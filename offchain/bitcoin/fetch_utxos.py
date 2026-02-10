"""Fetch UTXOs from Bitcoin testnet for reserve verification."""

from __future__ import annotations

import asyncio
import json
import logging
from datetime import datetime, timezone
from pathlib import Path
from typing import Any

import httpx
from pydantic import BaseModel, Field

from .config import (
    BLOCKSTREAM_TESTNET_API,
    MAX_RETRIES,
    MEMPOOL_TESTNET_API,
    REQUEST_TIMEOUT,
)

logger = logging.getLogger(__name__)

# ---------------------------------------------------------------------------
# Data models
# ---------------------------------------------------------------------------


class UTXO(BaseModel):
    """A single unspent transaction output."""

    txid: str
    vout: int
    value: int = Field(description="Value in satoshis")
    confirmed: bool
    block_height: int | None = None


class ReserveData(BaseModel):
    """Aggregated reserve information across all watched addresses."""

    addresses: list[str]
    utxos: dict[str, list[UTXO]]
    total_sats: int
    fetched_at: str = Field(
        default_factory=lambda: datetime.now(timezone.utc).isoformat(),
        description="ISO-8601 timestamp of when the data was fetched",
    )


# ---------------------------------------------------------------------------
# Internal helpers
# ---------------------------------------------------------------------------


def _parse_blockstream_utxo(raw: dict[str, Any]) -> UTXO:
    """Parse a single UTXO entry returned by the Blockstream API."""
    status = raw.get("status", {})
    return UTXO(
        txid=raw["txid"],
        vout=raw["vout"],
        value=raw["value"],
        confirmed=status.get("confirmed", False),
        block_height=status.get("block_height"),
    )


def _parse_mempool_utxo(raw: dict[str, Any]) -> UTXO:
    """Parse a single UTXO entry returned by the Mempool.space API."""
    status = raw.get("status", {})
    return UTXO(
        txid=raw["txid"],
        vout=raw["vout"],
        value=raw["value"],
        confirmed=status.get("confirmed", False),
        block_height=status.get("block_height"),
    )


async def _fetch_with_retries(
    client: httpx.AsyncClient,
    url: str,
    *,
    retries: int = MAX_RETRIES,
) -> list[dict[str, Any]]:
    """GET *url* and return the parsed JSON list, retrying on transient errors."""
    last_exc: Exception | None = None
    for attempt in range(1, retries + 1):
        try:
            resp = await client.get(url, timeout=REQUEST_TIMEOUT)
            resp.raise_for_status()
            data = resp.json()
            if not isinstance(data, list):
                raise ValueError(f"Expected JSON array from {url}, got {type(data).__name__}")
            return data
        except (httpx.HTTPStatusError, httpx.RequestError, ValueError) as exc:
            last_exc = exc
            wait = min(2 ** attempt, 8)
            logger.warning(
                "Attempt %d/%d for %s failed: %s  -- retrying in %ds",
                attempt,
                retries,
                url,
                exc,
                wait,
            )
            await asyncio.sleep(wait)

    raise RuntimeError(
        f"All {retries} attempts failed for {url}: {last_exc}"
    ) from last_exc


# ---------------------------------------------------------------------------
# Public API
# ---------------------------------------------------------------------------


async def fetch_utxos(address: str) -> list[UTXO]:
    """Fetch confirmed UTXOs for a single Bitcoin testnet address.

    Tries the Blockstream API first; falls back to Mempool.space on failure.
    Only confirmed UTXOs are returned.
    """
    async with httpx.AsyncClient() as client:
        # --- primary: Blockstream ---
        primary_url = f"{BLOCKSTREAM_TESTNET_API}/address/{address}/utxo"
        try:
            raw_utxos = await _fetch_with_retries(client, primary_url)
            utxos = [_parse_blockstream_utxo(u) for u in raw_utxos]
            confirmed = [u for u in utxos if u.confirmed]
            logger.info(
                "Fetched %d confirmed UTXOs for %s from Blockstream",
                len(confirmed),
                address,
            )
            return confirmed
        except RuntimeError:
            logger.warning(
                "Blockstream unavailable for %s, falling back to Mempool.space",
                address,
            )

        # --- fallback: Mempool.space ---
        fallback_url = f"{MEMPOOL_TESTNET_API}/address/{address}/utxo"
        try:
            raw_utxos = await _fetch_with_retries(client, fallback_url)
            utxos = [_parse_mempool_utxo(u) for u in raw_utxos]
            confirmed = [u for u in utxos if u.confirmed]
            logger.info(
                "Fetched %d confirmed UTXOs for %s from Mempool.space",
                len(confirmed),
                address,
            )
            return confirmed
        except RuntimeError as exc:
            logger.error("Both providers failed for %s: %s", address, exc)
            raise


async def fetch_all_reserves(addresses: list[str]) -> ReserveData:
    """Aggregate confirmed UTXOs across all *addresses* and compute totals."""
    utxo_map: dict[str, list[UTXO]] = {}
    total_sats = 0

    tasks = [fetch_utxos(addr) for addr in addresses]
    results = await asyncio.gather(*tasks, return_exceptions=True)

    for addr, result in zip(addresses, results):
        if isinstance(result, BaseException):
            logger.error("Skipping address %s due to error: %s", addr, result)
            utxo_map[addr] = []
            continue
        utxo_map[addr] = result
        total_sats += sum(u.value for u in result)

    return ReserveData(
        addresses=addresses,
        utxos=utxo_map,
        total_sats=total_sats,
    )


def save_reserve_data(data: ReserveData, output_path: str) -> None:
    """Persist *data* as a JSON file at *output_path*."""
    path = Path(output_path)
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(
        data.model_dump_json(indent=2),
        encoding="utf-8",
    )
    logger.info("Reserve data saved to %s", path)
