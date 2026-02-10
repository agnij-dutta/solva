"""Normalize Bitcoin reserve data for ZK circuit input."""

from __future__ import annotations

import hashlib
import json
import logging
from pathlib import Path

from .fetch_utxos import ReserveData

logger = logging.getLogger(__name__)

# BN254 (alt_bn128) scalar field prime.
# All field elements must be strictly less than this value.
BN254_PRIME = (
    21888242871839275222246405745257275088548364400416034343698204186575808495617
)


def hash_address(address: str) -> int:
    """Produce a deterministic field element from a Bitcoin address string.

    The address is SHA-256 hashed and the first 31 bytes of the digest are
    interpreted as a big-endian unsigned integer.  Using 31 bytes (248 bits)
    guarantees the result fits inside the BN254 scalar field (roughly 254 bits).
    """
    digest = hashlib.sha256(address.encode("utf-8")).digest()
    # Take the first 31 bytes to stay below the BN254 field modulus.
    value = int.from_bytes(digest[:31], byteorder="big")
    return value % BN254_PRIME


def normalize_for_circuit(
    data: ReserveData,
    tree_depth: int = 4,
) -> dict:
    """Convert *data* into a circuit-friendly dictionary.

    Returns a dict with the following keys:

    - **leaves**: list of ``[address_hash, balance_sats]`` pairs.  The list is
      padded with ``[0, 0]`` entries so its length equals ``2 ** tree_depth``.
    - **total_reserves**: aggregate satoshi balance across all addresses.
    - **num_addresses**: number of real (non-padding) addresses.
    - **tree_depth**: the Merkle tree depth used for padding.
    """
    max_leaves = 2 ** tree_depth

    if len(data.addresses) > max_leaves:
        raise ValueError(
            f"Number of addresses ({len(data.addresses)}) exceeds the maximum "
            f"leaf count for tree_depth={tree_depth} ({max_leaves})"
        )

    leaves: list[list[int]] = []
    for address in data.addresses:
        addr_utxos = data.utxos.get(address, [])
        balance = sum(u.value for u in addr_utxos)
        addr_hash = hash_address(address)
        leaves.append([addr_hash, balance])

    # Pad with zero entries to fill the tree.
    while len(leaves) < max_leaves:
        leaves.append([0, 0])

    return {
        "leaves": leaves,
        "total_reserves": data.total_sats,
        "num_addresses": len(data.addresses),
        "tree_depth": tree_depth,
    }


def save_circuit_input(circuit_input: dict, output_path: str) -> None:
    """Persist *circuit_input* as a JSON file at *output_path*."""
    path = Path(output_path)
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(
        json.dumps(circuit_input, indent=2),
        encoding="utf-8",
    )
    logger.info("Circuit input saved to %s", path)
