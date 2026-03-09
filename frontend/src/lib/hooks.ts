"use client";

import { useEffect, useState, useCallback } from "react";
import { RpcProvider, Contract, hash } from "starknet";
import { CONTRACTS, NETWORK } from "./contracts";
import { REGISTRY_ABI, LENDING_ABI } from "./abis";

// ─── Types ───────────────────────────────────────────────
export type SolvencyTier = "None" | "TierC" | "TierB" | "TierA";

export interface SolvencyInfo {
  lastProofTime: number;
  merkleRoot: string;
  totalLiabilities: bigint;
  isValid: boolean;
  tier: SolvencyTier;
}

export interface ProofEvent {
  issuer: string;
  merkleRoot: string;
  totalLiabilities: string;
  tier: SolvencyTier;
  timestamp: number;
  txHash: string;
}

// ─── Provider ────────────────────────────────────────────
function getProvider() {
  return new RpcProvider({ nodeUrl: NETWORK.rpc });
}

function getRegistryContract() {
  const provider = getProvider();
  return new Contract({ abi: REGISTRY_ABI as any, address: CONTRACTS.registry.address, providerOrAccount: provider });
}

function getLendingContract() {
  const provider = getProvider();
  return new Contract({ abi: LENDING_ABI as any, address: CONTRACTS.lending.address, providerOrAccount: provider });
}

// ─── Map tier enum ───────────────────────────────────────
function parseTier(tierVariant: any): SolvencyTier {
  if (typeof tierVariant === "object" && tierVariant !== null) {
    // Format: { variant: { TierA: {} } }
    if (tierVariant.variant && typeof tierVariant.variant === "object") {
      for (const key of ["TierA", "TierB", "TierC", "None"]) {
        if (key in tierVariant.variant) return key as SolvencyTier;
      }
    }
    // Format: string variant name
    if (typeof tierVariant.variant === "string") return tierVariant.variant as SolvencyTier;
    if (tierVariant.activeVariant) return tierVariant.activeVariant() as SolvencyTier;
    // Format: { TierA: {} } directly
    for (const key of ["TierA", "TierB", "TierC", "None"]) {
      if (key in tierVariant) return key as SolvencyTier;
    }
  }
  const s = String(tierVariant);
  if (s.includes("TierA")) return "TierA";
  if (s.includes("TierB")) return "TierB";
  if (s.includes("TierC")) return "TierC";
  return "None";
}

// ─── Hook: Query solvency info for an issuer ─────────────
export function useSolvencyInfo(issuerAddress: string | undefined) {
  const [data, setData] = useState<SolvencyInfo | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refetch = useCallback(async () => {
    if (!issuerAddress) return;
    setLoading(true);
    setError(null);
    try {
      const contract = getRegistryContract();
      const result = await contract.get_solvency_info(issuerAddress);

      // starknet.js may return a named struct OR a flat felt252 array depending on version/ABI parsing.
      // Handle both formats.
      let lastProofTime: number;
      let merkleRoot: string;
      let totalLiabilities: bigint;
      let isValid: boolean;
      let tier: SolvencyTier;

      if (result.last_proof_time !== undefined) {
        // Named struct format from starknet.js Contract with ABI
        // merkle_root and total_liabilities are already assembled BigInts (not {low,high})
        lastProofTime = Number(result.last_proof_time);
        const rootVal = BigInt(result.merkle_root ?? 0);
        merkleRoot = "0x" + rootVal.toString(16);
        totalLiabilities = BigInt(result.total_liabilities ?? 0);
        isValid = Boolean(result.is_valid);
        tier = parseTier(result.tier);
      } else {
        // Flat array fallback
        const r = Array.isArray(result) ? result : Object.values(result);
        lastProofTime = Number(BigInt(r[0] ?? 0));
        const rootLow = BigInt(r[1] ?? 0);
        const rootHigh = BigInt(r[2] ?? 0);
        merkleRoot = "0x" + (rootLow + (rootHigh << 128n)).toString(16);
        const liabLow = BigInt(r[3] ?? 0);
        const liabHigh = BigInt(r[4] ?? 0);
        totalLiabilities = liabLow + (liabHigh << 128n);
        const validVal = Number(BigInt(r[5] ?? 0));
        isValid = validVal === 1;
        const tierIndex = Number(BigInt(r[6] ?? 0));
        const tierMap: SolvencyTier[] = ["None", "TierC", "TierB", "TierA"];
        tier = tierMap[tierIndex] ?? "None";
      }

      setData({ lastProofTime, merkleRoot, totalLiabilities, isValid, tier });
    } catch (e: any) {
      setError(e.message || "Failed to query solvency info");
    } finally {
      setLoading(false);
    }
  }, [issuerAddress]);

  useEffect(() => { refetch(); }, [refetch]);

  return { data, loading, error, refetch };
}

// ─── Hook: Check is_solvent ──────────────────────────────
export function useIsSolvent(issuerAddress: string | undefined) {
  const [solvent, setSolvent] = useState<boolean | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!issuerAddress) return;
    setLoading(true);
    const contract = getRegistryContract();
    contract.is_solvent(issuerAddress)
      .then((r: any) => setSolvent(Boolean(r === true || r?.True !== undefined)))
      .catch(() => setSolvent(null))
      .finally(() => setLoading(false));
  }, [issuerAddress]);

  return { solvent, loading };
}

// ─── Hook: Fetch recent proof events ─────────────────────
export function useRecentProofs(limit = 20) {
  const [proofs, setProofs] = useState<ProofEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refetch = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const provider = getProvider();
      const latestBlock = await provider.getBlockLatestAccepted();
      const fromBlock = Math.max(0, latestBlock.block_number - 50000);

      // SolvencyVerified event key
      const eventKey = hash.getSelectorFromName("SolvencyVerified");

      const eventsResponse = await provider.getEvents({
        address: CONTRACTS.registry.address,
        from_block: { block_number: fromBlock },
        to_block: "latest" as any,
        keys: [[eventKey]],
        chunk_size: 100,
      });

      const records: ProofEvent[] = [];
      for (const event of eventsResponse.events.slice(0, limit)) {
        try {
          const issuer = event.keys[1] || "0x0";
          // data: [merkle_root_low, merkle_root_high, liabilities_low, liabilities_high, tier_variant, timestamp]
          const d = event.data;
          const merkleRoot = BigInt(d[0] || 0) + (BigInt(d[1] || 0) << 128n);
          const liabilities = BigInt(d[2] || 0) + (BigInt(d[3] || 0) << 128n);
          // tier is an enum index (0=None,1=TierC,2=TierB,3=TierA)
          const tierIndex = Number(d[4] || 0);
          const tierMap: SolvencyTier[] = ["None", "TierC", "TierB", "TierA"];
          const timestamp = Number(d[5] || 0);

          records.push({
            issuer,
            merkleRoot: "0x" + merkleRoot.toString(16),
            totalLiabilities: liabilities.toString(),
            tier: tierMap[tierIndex] || "None",
            timestamp,
            txHash: event.transaction_hash,
          });
        } catch {
          // skip unparseable events
        }
      }

      setProofs(records);
    } catch (e: any) {
      setError(e.message || "Failed to fetch events");
      setProofs([]);
    } finally {
      setLoading(false);
    }
  }, [limit]);

  useEffect(() => { refetch(); }, [refetch]);

  return { proofs, loading, error, refetch };
}

// ─── Hook: Lending protocol state ────────────────────────
export function useLendingState() {
  const [maxLtv, setMaxLtv] = useState<number | null>(null);
  const [poolBalance, setPoolBalance] = useState<bigint | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const contract = getLendingContract();
    Promise.all([
      contract.get_max_ltv().catch(() => null),
      contract.get_pool_balance().catch(() => null),
    ]).then(([ltv, pool]) => {
      if (ltv) setMaxLtv(Number(BigInt(ltv.low || ltv || 0)));
      if (pool) setPoolBalance(BigInt(pool.low || pool || 0));
    }).finally(() => setLoading(false));
  }, []);

  return { maxLtv, poolBalance, loading };
}

// ─── Hook: User lending position ─────────────────────────
export function useUserLendingPosition(userAddress: string | undefined) {
  const [deposit, setDeposit] = useState<bigint>(0n);
  const [borrow, setBorrow] = useState<bigint>(0n);
  const [loading, setLoading] = useState(false);

  const refetch = useCallback(async () => {
    if (!userAddress) return;
    setLoading(true);
    try {
      const contract = getLendingContract();
      const [dep, borr] = await Promise.all([
        contract.get_user_deposit(userAddress).catch(() => null),
        contract.get_user_borrow(userAddress).catch(() => null),
      ]);
      if (dep) setDeposit(BigInt(dep.low ?? dep ?? 0) + (BigInt(dep.high ?? 0) << 128n));
      if (borr) setBorrow(BigInt(borr.low ?? borr ?? 0) + (BigInt(borr.high ?? 0) << 128n));
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  }, [userAddress]);

  useEffect(() => { refetch(); }, [refetch]);

  return { deposit, borrow, loading, refetch };
}

// ─── Hook: Registry config ───────────────────────────────
export function useRegistryConfig() {
  const [verifierAddress, setVerifierAddress] = useState<string | null>(null);
  const [maxProofAge, setMaxProofAge] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const contract = getRegistryContract();
    Promise.all([
      contract.get_verifier_address().catch(() => null),
      contract.get_max_proof_age().catch(() => null),
    ]).then(([addr, age]) => {
      if (addr) setVerifierAddress("0x" + BigInt(addr).toString(16));
      if (age) setMaxProofAge(Number(age));
    }).finally(() => setLoading(false));
  }, []);

  return { verifierAddress, maxProofAge, loading };
}
