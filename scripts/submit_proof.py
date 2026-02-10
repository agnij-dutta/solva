#!/usr/bin/env python3
"""
Solva: Submit solvency proof to Starknet.

Generates calldata with Garaga (includes EC hints for efficient on-chain verification)
and submits to the SolvencyRegistry contract.

Usage:
    python3 scripts/submit_proof.py \
        --proof circuits/solvency_circuit/proof \
        --vk circuits/solvency_circuit/vk \
        --registry-address <REGISTRY_CONTRACT_ADDRESS> \
        [--account <ACCOUNT_ADDRESS>] \
        [--rpc-url <RPC_URL>]
"""

import argparse
import json
import subprocess
import sys
from pathlib import Path


def generate_calldata(proof_path: str, vk_path: str) -> list[str]:
    """Generate proof calldata with Garaga hints."""
    try:
        from garaga.starknet.cli import gen_proof_calldata

        calldata = gen_proof_calldata(
            system="ultra_keccak_honk",
            proof_path=proof_path,
            vk_path=vk_path,
        )
        return calldata
    except ImportError:
        print("ERROR: garaga not installed. Run: pip install garaga")
        sys.exit(1)
    except Exception as e:
        print(f"ERROR generating calldata: {e}")
        sys.exit(1)


def submit_to_starknet(
    calldata: list[str],
    registry_address: str,
    account: str | None = None,
    rpc_url: str = "https://free-rpc.nethermind.io/sepolia-juno/v0_7",
) -> str:
    """Submit proof calldata to SolvencyRegistry via sncast."""
    cmd = [
        "sncast",
        "invoke",
        "--contract-address",
        registry_address,
        "--function",
        "submit_solvency_proof",
        "--calldata",
        *calldata,
        "--url",
        rpc_url,
    ]

    if account:
        cmd.extend(["--account", account])

    print(f"Submitting to registry at {registry_address}...")
    print(f"Calldata length: {len(calldata)} felt252s")

    result = subprocess.run(cmd, capture_output=True, text=True)

    if result.returncode != 0:
        print(f"ERROR: sncast invoke failed:\n{result.stderr}")
        sys.exit(1)

    print("Transaction submitted!")
    print(result.stdout)
    return result.stdout


def main():
    parser = argparse.ArgumentParser(
        description="Submit Solva solvency proof to Starknet"
    )
    parser.add_argument("--proof", required=True, help="Path to proof file")
    parser.add_argument("--vk", required=True, help="Path to verification key file")
    parser.add_argument(
        "--registry-address", required=True, help="SolvencyRegistry contract address"
    )
    parser.add_argument(
        "--account", help="Starknet account name (from sncast accounts)"
    )
    parser.add_argument(
        "--rpc-url",
        default="https://free-rpc.nethermind.io/sepolia-juno/v0_7",
        help="Starknet RPC URL",
    )
    parser.add_argument(
        "--dry-run",
        action="store_true",
        help="Generate calldata only, don't submit",
    )

    args = parser.parse_args()

    print("=== Solva Proof Submission ===")
    print("")

    # Step 1: Generate calldata with Garaga hints
    print("[1/2] Generating calldata with Garaga hints...")
    calldata = generate_calldata(args.proof, args.vk)
    print(f"  Generated {len(calldata)} felt252 calldata elements")
    print("")

    if args.dry_run:
        print("DRY RUN -- calldata generated but not submitted")
        # Save calldata to file for inspection
        output_path = Path(args.proof).parent / "calldata.json"
        with open(output_path, "w") as f:
            json.dump(calldata, f, indent=2)
        print(f"  Saved to {output_path}")
        return

    # Step 2: Submit to Starknet
    print("[2/2] Submitting to Starknet...")
    submit_to_starknet(calldata, args.registry_address, args.account, args.rpc_url)

    print("")
    print("=== Proof submitted successfully! ===")


if __name__ == "__main__":
    main()
