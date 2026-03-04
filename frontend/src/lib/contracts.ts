export const CONTRACTS = {
  verifier: {
    address: process.env.NEXT_PUBLIC_VERIFIER_ADDRESS || "0x2c6b72374f18167dbfde84f6334e187ac3c465c1b1487865b14bd4eadc8496",
  },
  registry: {
    address: process.env.NEXT_PUBLIC_REGISTRY_ADDRESS || "0x7df7e6aa22c77771e4aeec9cbbb3ca3d8a69010460682cabccb7962e625d916",
  },
  lending: {
    address: process.env.NEXT_PUBLIC_LENDING_ADDRESS || "0x64288b7d33fd437a1026c440793901216895f7fb98868d62b9bde3894fab5fd",
  },
} as const;

export const NETWORK = {
  name: "Starknet Sepolia",
  rpc: process.env.NEXT_PUBLIC_STARKNET_RPC_URL || "https://api.cartridge.gg/x/starknet/sepolia",
  explorer: process.env.NEXT_PUBLIC_EXPLORER_URL || "https://sepolia.voyager.online",
  chainId: "SN_SEPOLIA",
} as const;

export const DEPLOYER_ADDRESS = process.env.NEXT_PUBLIC_DEPLOYER_ADDRESS || "0x036f21aff52fb88cc777f0bc9151917c5196d17c8ac1ccb52da5087c35e8c635";

export type SolvencyTier = "Excellent" | "Good" | "Adequate" | "Warning" | "Critical";

export function getTierColor(tier: SolvencyTier) {
  switch (tier) {
    case "Excellent": return "text-green-400";
    case "Good": return "text-green-400/80";
    case "Adequate": return "text-amber-400";
    case "Warning": return "text-red-400/80";
    case "Critical": return "text-red-400";
  }
}

export function getTierBg(tier: SolvencyTier) {
  switch (tier) {
    case "Excellent": return "bg-green-400/10 border-green-400/20";
    case "Good": return "bg-green-400/5 border-green-400/15";
    case "Adequate": return "bg-amber-400/10 border-amber-400/20";
    case "Warning": return "bg-red-400/5 border-red-400/15";
    case "Critical": return "bg-red-400/10 border-red-400/20";
  }
}

export function formatSats(sats: number): string {
  if (sats >= 100_000_000) return `${(sats / 100_000_000).toFixed(2)} BTC`;
  if (sats >= 1_000_000) return `${(sats / 1_000_000).toFixed(1)}M sats`;
  if (sats >= 1_000) return `${(sats / 1_000).toFixed(0)}K sats`;
  return `${sats} sats`;
}

export function truncateHash(hash: string, chars = 6): string {
  if (hash.length <= chars * 2 + 2) return hash;
  return `${hash.slice(0, chars + 2)}...${hash.slice(-chars)}`;
}

export function timeAgo(timestamp: number): string {
  const diff = Date.now() - timestamp;
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}
