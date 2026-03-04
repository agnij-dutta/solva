#!/usr/bin/env python3
"""
Submit solvency proof directly to SolvencyRegistry on Starknet Sepolia.
Uses starknet-py (no garaga dependency needed for interim verifier).
"""

import asyncio
import json
import os

from starknet_py.net.full_node_client import FullNodeClient
from starknet_py.net.account.account import Account
from starknet_py.net.models import StarknetChainId
from starknet_py.net.signer.stark_curve_signer import KeyPair

from dotenv import load_dotenv

PROJECT_ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
load_dotenv(os.path.join(PROJECT_ROOT, ".env"))

# Load from .env
REGISTRY_ADDRESS = int(os.environ["REGISTRY_ADDRESS"], 16)
RPC_URL = os.environ["STARKNET_RPC_URL"]
ACCOUNT_ADDRESS = int(os.environ["STARKNET_ACCOUNT_ADDRESS"], 16)
PRIVATE_KEY = int(os.environ["STARKNET_PRIVATE_KEY"], 16)


def read_public_inputs():
    """Read public inputs from proof artifacts."""
    pi_path = os.path.join(PROJECT_ROOT, "circuits", "solvency_circuit", "target", "proof", "public_inputs")
    with open(pi_path, "rb") as f:
        data = f.read()

    # Public inputs: [root (32 bytes), total_liabilities (32 bytes)]
    root = int.from_bytes(data[0:32], "big")
    liabilities = int.from_bytes(data[32:64], "big")

    print(f"  Merkle root: 0x{root:064x}")
    print(f"  Liabilities: {liabilities} sats")

    return root, liabilities


def read_proof():
    """Read proof bytes."""
    proof_path = os.path.join(PROJECT_ROOT, "circuits", "solvency_circuit", "target", "proof", "proof")
    with open(proof_path, "rb") as f:
        data = f.read()
    print(f"  Proof size: {len(data)} bytes")
    return data


def build_calldata(root: int, liabilities: int, proof_bytes: bytes) -> list:
    """
    Build calldata for submit_solvency_proof().

    The interim verifier expects:
    - First 4 felt252s: root_low, root_high, liabilities_low, liabilities_high
    - Remaining felt252s: proof data (chunked into 31-byte segments as felt252)
    """
    calldata = []

    # Public inputs as u256 (low, high pairs)
    root_low = root & ((1 << 128) - 1)
    root_high = root >> 128
    liab_low = liabilities & ((1 << 128) - 1)
    liab_high = liabilities >> 128

    calldata.extend([root_low, root_high, liab_low, liab_high])

    # Chunk proof into felt252s (31 bytes each, since felt252 < 2^251)
    chunk_size = 31
    for i in range(0, min(len(proof_bytes), 31 * 20), chunk_size):  # Limit chunks
        chunk = proof_bytes[i:i + chunk_size]
        val = int.from_bytes(chunk, "big")
        calldata.append(val)

    return calldata


async def main():
    print("=== Solva Proof Submission ===")
    print()

    print("[1/3] Reading proof artifacts...")
    root, liabilities = read_public_inputs()
    proof_bytes = read_proof()
    print()

    print("[2/3] Building calldata...")
    calldata = build_calldata(root, liabilities, proof_bytes)
    print(f"  Calldata: {len(calldata)} felt252 values")
    print()

    print("[3/3] Submitting to SolvencyRegistry...")
    client = FullNodeClient(node_url=RPC_URL)

    key_pair = KeyPair.from_private_key(PRIVATE_KEY)
    account = Account(
        client=client,
        address=ACCOUNT_ADDRESS,
        key_pair=key_pair,
        chain=StarknetChainId.SEPOLIA,
    )

    from starknet_py.net.client_models import Call
    from starknet_py.hash.selector import get_selector_from_name

    selector = get_selector_from_name("submit_solvency_proof")

    invoke = await account.execute_v3(
        calls=[Call(
            to_addr=REGISTRY_ADDRESS,
            selector=selector,
            calldata=[len(calldata)] + calldata,
        )],
        auto_estimate=True,
    )

    print(f"  Transaction hash: 0x{invoke.transaction_hash:064x}")
    print(f"  Waiting for acceptance...")

    receipt = await client.wait_for_tx(invoke.transaction_hash, check_interval=3)
    print(f"  Status: {receipt.finality_status}")
    print()
    print(f"=== Proof submitted successfully ===")
    print(f"  Explorer: https://sepolia.voyager.online/tx/0x{invoke.transaction_hash:064x}")


if __name__ == "__main__":
    asyncio.run(main())
