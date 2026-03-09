"""Redeploy lending contract with caller-based solvency check."""
import json, asyncio, warnings, time, os, sys
warnings.filterwarnings("ignore")

from starknet_py.net.account.account import Account
from starknet_py.net.full_node_client import FullNodeClient
from starknet_py.net.signer.stark_curve_signer import KeyPair
from starknet_py.common import create_casm_class
from starknet_py.hash.casm_class_hash import compute_casm_class_hash
from starknet_py.contract import Contract

BASE = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))

from dotenv import load_dotenv
load_dotenv(os.path.join(BASE, ".env"))

RPC_URL = os.environ.get("STARKNET_RPC_URL", "https://api.cartridge.gg/x/starknet/sepolia")
PRIVATE_KEY = int(os.environ["STARKNET_PRIVATE_KEY"], 16)
ACCOUNT_ADDRESS = int(os.environ["STARKNET_ACCOUNT_ADDRESS"], 16)
CHAIN_ID = 0x534e5f5345504f4c4941

REGISTRY_ADDRESS = 0x7df7e6aa22c77771e4aeec9cbbb3ca3d8a69010460682cabccb7962e625d916

LENDING_SIERRA = os.path.join(BASE, "contracts/lending_protocol/target/dev/lending_protocol_LendingProtocol.contract_class.json")
LENDING_CASM = os.path.join(BASE, "contracts/lending_protocol/target/dev/lending_protocol_LendingProtocol.compiled_contract_class.json")


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


async def main():
    print("=" * 60)
    print("REDEPLOY LENDING (caller-based solvency)")
    print("=" * 60)

    client = FullNodeClient(node_url=RPC_URL)
    key_pair = KeyPair.from_private_key(PRIVATE_KEY)
    account = Account(client=client, address=ACCOUNT_ADDRESS, key_pair=key_pair, chain=CHAIN_ID)

    # Declare new class
    print("\nDeclaring new lending class...")
    with open(LENDING_SIERRA) as f:
        sierra_json = f.read()
    with open(LENDING_CASM) as f:
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
    class_hash = result.class_hash
    print(f"  Class hash: {hex(class_hash)}")
    await wait_for_tx(client, result.transaction_hash, "declare")

    # Deploy with registry + reserve_manager (kept for compat but unused for borrow checks now)
    print("\nDeploying new lending contract...")
    abi = json.loads(sierra_json).get("abi", [])
    deploy_result = await Contract.deploy_contract_v3(
        account=account,
        class_hash=class_hash,
        abi=abi,
        constructor_args={"registry_address": REGISTRY_ADDRESS, "reserve_manager": ACCOUNT_ADDRESS},
        auto_estimate=True,
    )
    print(f"  Deploy tx: {hex(deploy_result.hash)}")
    await wait_for_tx(client, deploy_result.hash, "deploy")
    addr = deploy_result.deployed_contract.address
    print(f"\n  NEW LENDING ADDRESS: {hex(addr)}")
    print(f"\nUpdate LENDING_ADDRESS in .env and frontend/src/lib/contracts.ts")


if __name__ == "__main__":
    asyncio.run(main())
