import { NextRequest, NextResponse } from "next/server";
import { RpcProvider, Contract, hash } from "starknet";

const REGISTRY_ADDRESS = process.env.NEXT_PUBLIC_REGISTRY_ADDRESS || "0x7df7e6aa22c77771e4aeec9cbbb3ca3d8a69010460682cabccb7962e625d916";
const RPC_URL = process.env.NEXT_PUBLIC_STARKNET_RPC_URL || "https://api.cartridge.gg/x/starknet/sepolia";

const REGISTRY_ABI = [
  {
    type: "function",
    name: "get_solvency_info",
    inputs: [{ name: "issuer", type: "core::starknet::contract_address::ContractAddress" }],
    outputs: [{ type: "solvency_registry::SolvencyInfo" }],
    state_mutability: "view",
  },
  {
    type: "function",
    name: "is_solvent",
    inputs: [{ name: "issuer", type: "core::starknet::contract_address::ContractAddress" }],
    outputs: [{ type: "core::bool" }],
    state_mutability: "view",
  },
  {
    type: "struct",
    name: "solvency_registry::SolvencyInfo",
    members: [
      { name: "last_proof_time", type: "core::integer::u64" },
      { name: "merkle_root", type: "core::integer::u256" },
      { name: "total_liabilities", type: "core::integer::u256" },
      { name: "is_valid", type: "core::bool" },
      { name: "tier", type: "solvency_registry::SolvencyTier" },
    ],
  },
  {
    type: "struct",
    name: "core::integer::u256",
    members: [
      { name: "low", type: "core::integer::u128" },
      { name: "high", type: "core::integer::u128" },
    ],
  },
  {
    type: "enum",
    name: "core::bool",
    variants: [{ name: "False", type: "()" }, { name: "True", type: "()" }],
  },
  {
    type: "enum",
    name: "solvency_registry::SolvencyTier",
    variants: [
      { name: "None", type: "()" },
      { name: "TierC", type: "()" },
      { name: "TierB", type: "()" },
      { name: "TierA", type: "()" },
    ],
  },
];

export async function GET(req: NextRequest) {
  const issuer = req.nextUrl.searchParams.get("issuer");

  const provider = new RpcProvider({ nodeUrl: RPC_URL });

  // If issuer provided, get specific info
  if (issuer) {
    try {
      const contract = new Contract({ abi: REGISTRY_ABI as any, address: REGISTRY_ADDRESS, providerOrAccount: provider });
      const info = await contract.get_solvency_info(issuer);
      const isSolvent = await contract.is_solvent(issuer);

      return NextResponse.json({
        success: true,
        issuer,
        solvencyInfo: {
          lastProofTime: Number(info.last_proof_time ?? 0),
          merkleRoot: "0x" + (BigInt(info.merkle_root?.low ?? 0) + (BigInt(info.merkle_root?.high ?? 0) << 128n)).toString(16),
          totalLiabilities: (BigInt(info.total_liabilities?.low ?? 0) + (BigInt(info.total_liabilities?.high ?? 0) << 128n)).toString(),
          isValid: Boolean(info.is_valid === true || info.is_valid?.True !== undefined),
          tier: parseTier(info.tier),
        },
        isSolvent: Boolean(isSolvent === true || isSolvent?.True !== undefined),
      });
    } catch (e: any) {
      return NextResponse.json({ success: false, error: e.message }, { status: 500 });
    }
  }

  // No issuer: return recent events
  try {
    const latestBlock = await provider.getBlockLatestAccepted();
    const fromBlock = Math.max(0, latestBlock.block_number - 50000);
    const eventKey = hash.getSelectorFromName("SolvencyVerified");

    const eventsResponse = await provider.getEvents({
      address: REGISTRY_ADDRESS,
      from_block: { block_number: fromBlock },
      to_block: "latest" as any,
      keys: [[eventKey]],
      chunk_size: 100,
    });

    const proofs = eventsResponse.events.map((event) => {
      const issuer = event.keys[1] || "0x0";
      const d = event.data;
      const merkleRoot = BigInt(d[0] || 0) + (BigInt(d[1] || 0) << 128n);
      const liabilities = BigInt(d[2] || 0) + (BigInt(d[3] || 0) << 128n);
      const tierIndex = Number(d[4] || 0);
      const tierMap = ["None", "TierC", "TierB", "TierA"];
      const timestamp = Number(d[5] || 0);

      return {
        issuer,
        merkleRoot: "0x" + merkleRoot.toString(16),
        totalLiabilities: liabilities.toString(),
        tier: tierMap[tierIndex] || "None",
        timestamp,
        txHash: event.transaction_hash,
      };
    });

    return NextResponse.json({ success: true, proofs, blockHeight: latestBlock.block_number });
  } catch (e: any) {
    return NextResponse.json({ success: false, error: e.message, proofs: [] }, { status: 500 });
  }
}

function parseTier(tierVariant: any): string {
  if (typeof tierVariant === "object" && tierVariant !== null) {
    for (const key of ["TierA", "TierB", "TierC", "None"]) {
      if (key in tierVariant) return key;
    }
    if (tierVariant.variant) return tierVariant.variant;
  }
  return "None";
}
