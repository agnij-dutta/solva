"""
Deploy all Solva contracts to Starknet Sepolia.
Order: declare verifier -> deploy verifier -> deploy registry -> deploy lending
Saves results to deployments/sepolia.json
"""

import json, asyncio, warnings, time, os, sys
warnings.filterwarnings("ignore")

from starknet_py.net.account.account import Account
from starknet_py.net.full_node_client import FullNodeClient
from starknet_py.net.signer.stark_curve_signer import KeyPair
from starknet_py.common import create_casm_class
from starknet_py.hash.casm_class_hash import compute_casm_class_hash
from starknet_py.contract import Contract

from dotenv import load_dotenv
load_dotenv(os.path.join(BASE if 'BASE' in dir() else os.path.dirname(os.path.dirname(os.path.abspath(__file__))), ".env"))

RPC_URL = os.environ.get("STARKNET_RPC_URL", "https://api.cartridge.gg/x/starknet/sepolia")
PRIVATE_KEY = int(os.environ["STARKNET_PRIVATE_KEY"], 16)
ACCOUNT_ADDRESS = int(os.environ["STARKNET_ACCOUNT_ADDRESS"], 16)
CHAIN_ID = 0x534e5f5345504f4c4941

REGISTRY_CLASS_HASH = 0x1b3b4c3793a83042cb96cf096b4efa78d7872bb14822cb0980072fbd035cd51
LENDING_CLASS_HASH = 0x17a0d5808980f515a9c8d3d9f813907a15150dd402ca746a07d1372e99a46a

BASE = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
VERIFIER_SIERRA = os.path.join(BASE, "contracts/solvency_verifier/target/dev/solvency_verifier_UltraKeccakZKHonkVerifier.contract_class.json")
VERIFIER_CASM = os.path.join(BASE, "contracts/solvency_verifier/target/dev/solvency_verifier_UltraKeccakZKHonkVerifier.compiled_contract_class.json")
REGISTRY_SIERRA = os.path.join(BASE, "contracts/solvency_registry/target/dev/solvency_registry_SolvencyRegistry.contract_class.json")
LENDING_SIERRA = os.path.join(BASE, "contracts/lending_protocol/target/dev/lending_protocol_LendingProtocol.contract_class.json")
OUTPUT_FILE = os.path.join(BASE, "deployments/sepolia.json")
MAX_PROOF_AGE = 86400


async def wait_for_tx(client, tx_hash, label="tx"):
    print(f"  Waiting for {label} ({hex(tx_hash)}) ...")
    while True:
        try:
            receipt = await client.get_transaction_receipt(tx_hash)
            status = str(receipt.finality_status) if hasattr(receipt, 'finality_status') else str(receipt.status)
            if "ACCEPTED" in status or "SUCCEEDED" in status:
                print(f"  {label} confirmed: {status}")
                return receipt
            elif "REJECTED" in status or "REVERTED" in status:
                print(f"  {label} FAILED: {status} reason={getattr(receipt, 'revert_reason', None)}")
                sys.exit(1)
        except Exception as e:
            if "not found" not in str(e).lower() and "not received" not in str(e).lower():
                print(f"  (poll: {str(e)[:80]})")
        await asyncio.sleep(5)


async def declare_contract(account, client, sierra_path, casm_path, name):
    print(f"\n{'='*60}\nDECLARING: {name}\n{'='*60}")
    with open(sierra_path) as f:
        sierra_json = f.read()
    with open(casm_path) as f:
        casm_json = f.read()

    casm_class = create_casm_class(casm_json)
    casm_hash = compute_casm_class_hash(casm_class)
    print(f"  CASM hash: {hex(casm_hash)}")

    declare_tx = await account.sign_declare_v3(
        compiled_contract=sierra_json,
        compiled_class_hash=casm_hash,
        auto_estimate=True,
    )
    result = await client.declare(declare_tx)
    print(f"  Declare tx: {hex(result.transaction_hash)}")
    print(f"  Class hash: {hex(result.class_hash)}")
    await wait_for_tx(client, result.transaction_hash, f"{name} declare")
    return result.class_hash


async def deploy_contract(account, client, class_hash, sierra_path, constructor_args, name):
    print(f"\n{'='*60}\nDEPLOYING: {name}\n{'='*60}")
    print(f"  Class hash: {hex(class_hash)}")
    with open(sierra_path) as f:
        abi = json.loads(f.read()).get("abi", [])

    deploy_result = await Contract.deploy_contract_v3(
        account=account,
        class_hash=class_hash,
        abi=abi,
        constructor_args=constructor_args,
        auto_estimate=True,
    )
    print(f"  Deploy tx: {hex(deploy_result.hash)}")
    await wait_for_tx(client, deploy_result.hash, f"{name} deploy")
    addr = deploy_result.deployed_contract.address
    print(f"  Deployed at: {hex(addr)}")
    return addr


async def main():
    print("=" * 60)
    print("SOLVA PROTOCOL - STARKNET SEPOLIA DEPLOYMENT")
    print("=" * 60)

    client = FullNodeClient(node_url=RPC_URL)
    key_pair = KeyPair.from_private_key(PRIVATE_KEY)
    account = Account(
        client=client,
        address=ACCOUNT_ADDRESS,
        key_pair=key_pair,
        chain=CHAIN_ID,
    )
    print(f"Deployer: {hex(ACCOUNT_ADDRESS)}")

    # 1. Declare verifier
    verifier_class_hash = await declare_contract(
        account, client, VERIFIER_SIERRA, VERIFIER_CASM,
        "Solvency Verifier (interim)")

    # 2. Deploy verifier: constructor(owner)
    verifier_address = await deploy_contract(
        account, client, verifier_class_hash, VERIFIER_SIERRA,
        {"owner": ACCOUNT_ADDRESS}, "Solvency Verifier")

    # 3. Deploy registry: constructor(verifier_address, max_proof_age, owner)
    registry_address = await deploy_contract(
        account, client, REGISTRY_CLASS_HASH, REGISTRY_SIERRA,
        {"verifier_address": verifier_address, "max_proof_age": MAX_PROOF_AGE, "owner": ACCOUNT_ADDRESS},
        "Solvency Registry")

    # 4. Deploy lending: constructor(registry_address, reserve_manager)
    lending_address = await deploy_contract(
        account, client, LENDING_CLASS_HASH, LENDING_SIERRA,
        {"registry_address": registry_address, "reserve_manager": ACCOUNT_ADDRESS},
        "Lending Protocol")

    # Save deployment
    deployment = {
        "network": "starknet-sepolia",
        "rpc": RPC_URL,
        "deployer": hex(ACCOUNT_ADDRESS),
        "deployed_at": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime()),
        "contracts": {
            "solvency_verifier": {
                "class_hash": hex(verifier_class_hash),
                "address": hex(verifier_address),
                "type": "interim",
            },
            "solvency_registry": {
                "class_hash": hex(REGISTRY_CLASS_HASH),
                "address": hex(registry_address),
                "max_proof_age": MAX_PROOF_AGE,
            },
            "lending_protocol": {
                "class_hash": hex(LENDING_CLASS_HASH),
                "address": hex(lending_address),
                "reserve_manager": hex(ACCOUNT_ADDRESS),
            },
        },
    }
    os.makedirs(os.path.dirname(OUTPUT_FILE), exist_ok=True)
    with open(OUTPUT_FILE, "w") as f:
        json.dump(deployment, f, indent=2)
    print(f"\nSaved to {OUTPUT_FILE}")

    print(f"\n{'='*60}")
    print("DEPLOYMENT SUMMARY")
    print(f"{'='*60}")
    print(f"  Verifier:  {hex(verifier_address)}")
    print(f"  Registry:  {hex(registry_address)}")
    print(f"  Lending:   {hex(lending_address)}")
    print("=" * 60)


if __name__ == "__main__":
    asyncio.run(main())
