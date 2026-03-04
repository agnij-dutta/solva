"use client";

import { useRef, useState, useEffect } from "react";
import { motion, useInView } from "framer-motion";
import {
  Shield,
  ShieldCheck,
  Landmark,
  ExternalLink,
  CheckCircle2,
  Copy,
  Check,
  ArrowUpRight,
  Clock,
  AlertCircle,
  Loader2,
  RefreshCw,
} from "lucide-react";
import { cn } from "@/lib/cn";
import {
  CONTRACTS,
  NETWORK,
  formatSats,
  truncateHash,
  timeAgo,
} from "@/lib/contracts";
import { useRecentProofs, useSolvencyInfo, useRegistryConfig, useLendingState, type ProofEvent, type SolvencyTier } from "@/lib/hooks";

/* ─── scroll reveal ─── */
function R({ children, delay = 0, className = "" }: {
  children: React.ReactNode; delay?: number; className?: string;
}) {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: "-60px" });
  return (
    <motion.div ref={ref} initial={{ opacity: 0, y: 24 }} animate={inView ? { opacity: 1, y: 0 } : {}}
      transition={{ delay, duration: 0.6, ease: [0.22, 1, 0.36, 1] }} className={className}>
      {children}
    </motion.div>
  );
}

/* ─── copy hook ─── */
function useCopy() {
  const [copied, setCopied] = useState(false);
  const copy = (text: string) => { navigator.clipboard.writeText(text); setCopied(true); setTimeout(() => setCopied(false), 1500); };
  return { copied, copy };
}

/* ─── tier display mapping ─── */
function tierLabel(tier: SolvencyTier): string {
  switch (tier) {
    case "TierA": return "Excellent";
    case "TierB": return "Good";
    case "TierC": return "Adequate";
    default: return "None";
  }
}

function tierToDisplayColor(tier: SolvencyTier) {
  switch (tier) {
    case "TierA": return "text-green-400";
    case "TierB": return "text-green-400/80";
    case "TierC": return "text-amber-400";
    default: return "text-[var(--text-tertiary)]";
  }
}

function tierToDisplayBg(tier: SolvencyTier) {
  switch (tier) {
    case "TierA": return "bg-green-400/10 border-green-400/20";
    case "TierB": return "bg-green-400/5 border-green-400/15";
    case "TierC": return "bg-amber-400/10 border-amber-400/20";
    default: return "bg-[var(--bg-void)] border-[var(--border-dim)]";
  }
}

/* ─── contract row ─── */
function ContractRow({ name, address, icon: Icon, accent }: {
  name: string; address: string; icon: React.ElementType; accent: string;
}) {
  const { copied, copy } = useCopy();
  return (
    <div className="flex items-center justify-between py-3.5 group">
      <div className="flex items-center gap-3">
        <Icon className={cn("w-3.5 h-3.5", accent)} />
        <span className="text-[11px] text-[var(--text-primary)]">{name}</span>
      </div>
      <div className="flex items-center gap-2">
        <span className="text-[10px] text-[var(--text-tertiary)] tabular-nums">{truncateHash(address, 6)}</span>
        <button onClick={() => copy(address)} className="opacity-0 group-hover:opacity-100 transition-opacity">
          {copied ? <Check className="w-3 h-3 text-green-400" /> : <Copy className="w-3 h-3 text-[var(--text-tertiary)]" />}
        </button>
        <a href={`${NETWORK.explorer}/contract/${address}`} target="_blank" rel="noopener noreferrer"
          className="opacity-0 group-hover:opacity-100 transition-opacity">
          <ExternalLink className="w-3 h-3 text-[var(--text-tertiary)]" />
        </a>
      </div>
    </div>
  );
}

import { DEPLOYER_ADDRESS } from "@/lib/contracts";

/* ═══════════════════════════════════════════════════════════ */
export default function DashboardPage() {
  const { proofs: liveProofs, loading: proofsLoading, error: proofsError, refetch: refetchProofs } = useRecentProofs(20);
  const { data: deployerInfo, loading: infoLoading, refetch: refetchInfo } = useSolvencyInfo(DEPLOYER_ADDRESS);
  const { verifierAddress, maxProofAge, loading: configLoading } = useRegistryConfig();
  const { maxLtv, poolBalance, loading: lendingLoading } = useLendingState();

  const hasLiveData = liveProofs.length > 0;
  const displayProofs = liveProofs;

  return (
    <div className="max-w-[1200px] mx-auto px-6 py-10">
      {/* Header */}
      <R>
        <div className="flex items-end justify-between mb-10">
          <div>
            <p className="label-mono mb-2">Dashboard</p>
            <h1 className="heading-serif text-[32px] text-[var(--text-primary)] leading-tight mb-1">
              Protocol Overview
            </h1>
            <p className="text-[11px] text-[var(--text-tertiary)]">
              {proofsLoading ? "Querying Starknet Sepolia..." : hasLiveData ? "Live data from Starknet Sepolia" : "No on-chain proofs found yet"}
            </p>
          </div>
          <button
            onClick={() => { refetchProofs(); refetchInfo(); }}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[10px] text-[var(--text-tertiary)] hover:text-[var(--text-secondary)] border border-[var(--border-dim)] hover:border-[var(--border-subtle)] transition-all"
          >
            <RefreshCw className={cn("w-3 h-3", proofsLoading && "animate-spin")} />
            Refresh
          </button>
        </div>
      </R>

      {/* Live status banner */}
      {deployerInfo && deployerInfo.isValid && (
        <R delay={0.03}>
          <div className="cell cell-glow cell-pad mb-4 noise">
            <div className="flex items-center gap-3 mb-3">
              <CheckCircle2 className="w-4 h-4 text-green-400" />
              <span className="text-[12px] font-semibold text-green-400">Deployer is verified solvent</span>
            </div>
            <div className="grid grid-cols-4 gap-4 text-[11px]">
              <div>
                <p className="text-[8px] text-[var(--text-tertiary)] uppercase tracking-wider mb-0.5">Tier</p>
                <p className={cn("font-bold", tierToDisplayColor(deployerInfo.tier))}>{tierLabel(deployerInfo.tier)}</p>
              </div>
              <div>
                <p className="text-[8px] text-[var(--text-tertiary)] uppercase tracking-wider mb-0.5">Merkle Root</p>
                <p className="text-[var(--text-secondary)] tabular-nums">{truncateHash(deployerInfo.merkleRoot, 8)}</p>
              </div>
              <div>
                <p className="text-[8px] text-[var(--text-tertiary)] uppercase tracking-wider mb-0.5">Liabilities</p>
                <p className="text-[var(--text-secondary)] tabular-nums">{formatSats(Number(deployerInfo.totalLiabilities))}</p>
              </div>
              <div>
                <p className="text-[8px] text-[var(--text-tertiary)] uppercase tracking-wider mb-0.5">Last Proof</p>
                <p className="text-[var(--text-secondary)]">
                  {deployerInfo.lastProofTime > 0
                    ? timeAgo(deployerInfo.lastProofTime * 1000)
                    : "—"}
                </p>
              </div>
            </div>
          </div>
        </R>
      )}

      <div className="grid grid-cols-12 gap-3">
        {/* ── Proof History ── */}
        <R delay={0.05} className="col-span-12">
          <div className="cell noise">
            <div className="cell-pad-sm border-b border-[var(--border-dim)] flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Clock className="w-3 h-3 text-[var(--text-tertiary)]" />
                <span className="text-[11px] font-semibold text-[var(--text-primary)]">
                  On-Chain Proofs
                </span>
                {hasLiveData && (
                  <span className="text-[8px] px-1.5 py-0.5 rounded bg-green-400/10 text-green-400 border border-green-400/15">
                    LIVE
                  </span>
                )}
              </div>
              <span className="text-[9px] text-[var(--text-tertiary)] tabular-nums">
                {proofsLoading ? <Loader2 className="w-3 h-3 animate-spin inline" /> : `${displayProofs.length} verified`}
              </span>
            </div>
            {proofsError && (
              <div className="px-5 py-3 border-b border-[var(--border-dim)]/50 flex items-center gap-2 text-[10px] text-[var(--amber-400)]">
                <AlertCircle className="w-3 h-3" />
                RPC error — showing fallback data
              </div>
            )}
            <div>
              {displayProofs.map((proof, i) => (
                <motion.a
                  key={`${proof.txHash}-${i}`}
                  href={`${NETWORK.explorer}/tx/${proof.txHash}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  initial={{ opacity: 0, x: -8 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.06, duration: 0.4 }}
                  className="flex items-center gap-4 px-5 py-4 border-b border-[var(--border-dim)]/50 hover:bg-[var(--bg-hover)]/30 transition-colors group"
                >
                  <CheckCircle2 className="w-3.5 h-3.5 text-green-400/60 shrink-0" />
                  <span className="text-[11px] text-[var(--text-primary)] w-28 shrink-0 tabular-nums">
                    {truncateHash(proof.issuer)}
                  </span>
                  <span className="text-[10px] text-[var(--text-tertiary)] tabular-nums flex-1">
                    {truncateHash(proof.merkleRoot, 8)}
                  </span>
                  <span className={cn(
                    "text-[9px] font-semibold px-2 py-0.5 rounded border w-16 text-center shrink-0",
                    tierToDisplayBg(proof.tier), tierToDisplayColor(proof.tier)
                  )}>
                    {tierLabel(proof.tier)}
                  </span>
                  <span className="text-[10px] text-[var(--text-tertiary)] w-14 text-right shrink-0 tabular-nums">
                    {proof.timestamp > 0
                      ? timeAgo(proof.timestamp * (proof.timestamp > 1e12 ? 1 : 1000))
                      : "—"}
                  </span>
                  <ArrowUpRight className="w-3 h-3 text-[var(--text-tertiary)] opacity-0 group-hover:opacity-60 transition-opacity shrink-0" />
                </motion.a>
              ))}
              {displayProofs.length === 0 && !proofsLoading && (
                <div className="px-5 py-8 text-center text-[11px] text-[var(--text-tertiary)]">
                  No proofs found. Submit one from the Prove page.
                </div>
              )}
            </div>
          </div>
        </R>

        {/* ── Contracts ── */}
        <R delay={0.1} className="col-span-12 md:col-span-5">
          <div className="cell cell-pad noise h-full">
            <p className="label-mono mb-4">Contracts</p>
            <div className="divide-y divide-[var(--border-dim)]">
              <ContractRow name="Verifier" address={CONTRACTS.verifier.address} icon={ShieldCheck} accent="text-violet-400" />
              <ContractRow name="Registry" address={CONTRACTS.registry.address} icon={Shield} accent="text-amber-400" />
              <ContractRow name="Lending" address={CONTRACTS.lending.address} icon={Landmark} accent="text-green-400" />
            </div>
            <div className="divider mt-4 mb-4" />
            <div className="space-y-2.5">
              <div className="flex items-center justify-between text-[10px]">
                <span className="text-[var(--text-tertiary)]">Network</span>
                <span className="text-[var(--text-secondary)]">{NETWORK.name}</span>
              </div>
              <div className="flex items-center justify-between text-[10px]">
                <span className="text-[var(--text-tertiary)]">Max Proof Age</span>
                <span className="text-[var(--text-secondary)]">
                  {configLoading ? "..." : maxProofAge ? `${maxProofAge / 3600}h` : "24h"}
                </span>
              </div>
              <div className="flex items-center justify-between text-[10px]">
                <span className="text-[var(--text-tertiary)]">Proof System</span>
                <span className="text-[var(--text-secondary)]">UltraKeccakHonk</span>
              </div>
              <div className="flex items-center justify-between text-[10px]">
                <span className="text-[var(--text-tertiary)]">Current LTV</span>
                <span className="text-[var(--text-secondary)]">
                  {lendingLoading ? "..." : maxLtv !== null ? `${maxLtv}%` : "—"}
                </span>
              </div>
            </div>
          </div>
        </R>

        {/* ── Solvency Tiers ── */}
        <R delay={0.15} className="col-span-12 md:col-span-7">
          <div className="cell cell-glow cell-pad noise h-full">
            <p className="label-mono mb-5">Solvency Tiers</p>
            <p className="text-[11px] text-[var(--text-secondary)] leading-relaxed mb-6">
              The registry computes a solvency ratio (reserves / liabilities) and assigns
              a tier that governs DeFi access through the lending protocol.
            </p>
            <div className="space-y-3">
              {[
                { tier: "Excellent", range: "ratio ≥ 1.20x", ltv: "80% LTV", color: "bg-green-400", w: "100%" },
                { tier: "Good", range: "ratio ≥ 1.10x", ltv: "60% LTV", color: "bg-green-400/60", w: "75%" },
                { tier: "Adequate", range: "ratio ≥ 1.00x", ltv: "40% LTV", color: "bg-[var(--amber-400)]", w: "50%" },
              ].map((t, i) => (
                <motion.div key={t.tier} className="flex items-center gap-3"
                  initial={{ opacity: 0, x: -12 }} whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }} transition={{ delay: 0.2 + i * 0.1 }}>
                  <span className="text-[10px] text-[var(--text-secondary)] w-16 shrink-0">{t.tier}</span>
                  <div className="flex-1 h-2 rounded-full bg-[var(--bg-void)] overflow-hidden">
                    <motion.div className={cn("h-full rounded-full opacity-40", t.color)}
                      initial={{ width: 0 }} whileInView={{ width: t.w }}
                      viewport={{ once: true }} transition={{ delay: 0.4 + i * 0.12, duration: 0.6, ease: "easeOut" }} />
                  </div>
                  <span className="text-[9px] text-[var(--text-tertiary)] w-20 text-right tabular-nums shrink-0">{t.range}</span>
                  <span className="text-[9px] text-[var(--text-tertiary)] w-14 text-right shrink-0">{t.ltv}</span>
                </motion.div>
              ))}
            </div>
          </div>
        </R>
      </div>
    </div>
  );
}
