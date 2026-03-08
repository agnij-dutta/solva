import { NextRequest, NextResponse } from "next/server";

interface UTXO {
  txid: string;
  vout: number;
  value: number;
  status: {
    confirmed: boolean;
    block_height?: number;
  };
}

interface UTXOResult {
  txid: string;
  vout: number;
  value: number;
  confirmed: boolean;
  block_height: number | null;
}

const APIS = [
  { name: "mempool.space", base: "https://mempool.space/api" },
  { name: "blockstream.info", base: "https://blockstream.info/api" },
];

const TESTNET_APIS = [
  { name: "mempool.space/testnet", base: "https://mempool.space/testnet/api" },
  { name: "blockstream.info/testnet", base: "https://blockstream.info/testnet/api" },
];

function detectNetwork(address: string): "mainnet" | "testnet" {
  if (address.startsWith("bc1") || address.startsWith("1") || address.startsWith("3")) return "mainnet";
  if (address.startsWith("tb1") || address.startsWith("m") || address.startsWith("n") || address.startsWith("2")) return "testnet";
  return "mainnet";
}

async function fetchUTXOs(address: string): Promise<{ utxos: UTXOResult[]; source: string }> {
  const network = detectNetwork(address);
  const apis = network === "testnet" ? TESTNET_APIS : APIS;

  for (const api of apis) {
    try {
      const res = await fetch(`${api.base}/address/${address}/utxo`, {
        headers: { "Accept": "application/json" },
        signal: AbortSignal.timeout(10000),
      });

      if (!res.ok) continue;

      const data: UTXO[] = await res.json();

      const utxos: UTXOResult[] = data
        .filter((u) => u.status.confirmed)
        .map((u) => ({
          txid: u.txid,
          vout: u.vout,
          value: u.value,
          confirmed: true,
          block_height: u.status.block_height ?? null,
        }));

      return { utxos, source: api.name };
    } catch {
      continue;
    }
  }

  return { utxos: [], source: "none" };
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const addresses: string[] = body.addresses;

    if (!addresses || !Array.isArray(addresses) || addresses.length === 0) {
      return NextResponse.json({ error: "addresses array required" }, { status: 400 });
    }

    if (addresses.length > 20) {
      return NextResponse.json({ error: "max 20 addresses" }, { status: 400 });
    }

    // Validate addresses
    const validAddresses = addresses
      .map((a) => a.trim())
      .filter((a) => a.length > 20);

    const utxos: Record<string, UTXOResult[]> = {};
    let totalSats = 0;
    let source = "";
    const network = validAddresses.length > 0 ? detectNetwork(validAddresses[0]) : "mainnet";

    // Fetch in parallel (max 5 concurrent)
    const results = await Promise.allSettled(
      validAddresses.map((addr) => fetchUTXOs(addr))
    );

    for (let i = 0; i < validAddresses.length; i++) {
      const result = results[i];
      if (result.status === "fulfilled") {
        utxos[validAddresses[i]] = result.value.utxos;
        totalSats += result.value.utxos.reduce((sum, u) => sum + u.value, 0);
        if (!source && result.value.source !== "none") source = result.value.source;
      } else {
        utxos[validAddresses[i]] = [];
      }
    }

    return NextResponse.json({
      addresses: validAddresses,
      utxos,
      total_sats: totalSats,
      network,
      source: source || "none",
      fetched_at: new Date().toISOString(),
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Failed to fetch UTXOs" },
      { status: 500 }
    );
  }
}
