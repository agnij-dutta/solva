"""Configuration constants for Bitcoin UTXO fetcher."""

# ---------------------------------------------------------------------------
# API endpoints (Bitcoin testnet)
# ---------------------------------------------------------------------------
BLOCKSTREAM_TESTNET_API: str = "https://blockstream.info/testnet/api"
MEMPOOL_TESTNET_API: str = "https://mempool.space/testnet/api"  # fallback

# ---------------------------------------------------------------------------
# HTTP client settings
# ---------------------------------------------------------------------------
REQUEST_TIMEOUT: int = 10   # seconds
MAX_RETRIES: int = 3

# ---------------------------------------------------------------------------
# Bitcoin constants
# ---------------------------------------------------------------------------
SATS_PER_BTC: int = 100_000_000
