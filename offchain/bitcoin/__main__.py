"""CLI entry point: python -m bitcoin.fetch_utxos"""

import asyncio
import json
import logging
import sys
from pathlib import Path

from .fetch_utxos import fetch_all_reserves, save_reserve_data

logging.basicConfig(level=logging.INFO, format="%(levelname)s: %(message)s")
logger = logging.getLogger(__name__)


def main() -> None:
    data_dir = Path(__file__).resolve().parent.parent / "data"
    addresses_file = data_dir / "addresses.json"
    output_file = data_dir / "reserve_data.json"

    if not addresses_file.exists():
        logger.error("addresses.json not found at %s", addresses_file)
        sys.exit(1)

    with open(addresses_file) as f:
        config = json.load(f)

    addresses = config["addresses"]
    logger.info("Fetching UTXOs for %d addresses...", len(addresses))

    data = asyncio.run(fetch_all_reserves(addresses))
    save_reserve_data(data, str(output_file))

    logger.info("Total reserves: %d sats (%.8f BTC)", data.total_sats, data.total_sats / 1e8)
    logger.info("Output: %s", output_file)


main()
