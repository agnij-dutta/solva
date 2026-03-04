"use client";

import { useRef, useState } from "react";
import { motion, useInView } from "framer-motion";
import { Search, CheckCircle2, ChevronRight, Clock, Loader2, AlertCircle, RefreshCw } from "lucide-react";
import { cn } from "@/lib/cn";
import {
  NETWORK,
  formatSats,
  truncateHash,
  timeAgo,
} from "@/lib/contracts";
import { useRecentProofs, type ProofEvent, type SolvencyTier } from "@/lib/hooks";

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

/* ─── tier helpers ─── */
function tierLabel(tier: SolvencyTier): string {
  switch (tier) { case "TierA": return "Excellent"; case "TierB": return "Good"; case "TierC": return "Adequate"; default: return "None"; }
}
function tierColor(tier: SolvencyTier) {
  switch (tier) { case "TierA": return "text-green-400"; case "TierB": return "text-green-400/80"; case "TierC": return "text-amber-400"; default: return "text-[var(--text-tertiary)]"; }
}
function tierBg(tier: SolvencyTier) {
  switch (tier) { case "TierA": return "bg-green-400/10 border-green-400/20"; case "TierB": return "bg-green-400/5 border-green-400/15"; case "TierC": return "bg-amber-400/10 border-amber-400/20"; default: return "bg-[var(--bg-void)] border-[var(--border-dim)]"; }
}

/* ─── proof card ─── */
function ProofCard({ proof, index, isLive }: {
  proof: { issuer: string; merkleRoot: string; totalLiabilities: string; tier: SolvencyTier; timestamp: number; txHash: string };
  index: number;
  isLive: boolean;
}) {
  const liabNum = Number(proof.totalLiabilities);

  return (
    <motion.a
      href={`${NETWORK.explorer}/tx/${proof.txHash}`}
      target="_blank"
      rel="noopener noreferrer"
      initial={{ opacity: 0, y: 16 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ delay: index * 0.08, duration: 0.45 }}
      whileHover={{ y: -2 }}
      className="cell cell-glow noise block group"
    >
      <div className="cell-pad">
        {/* Header */}
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-3.5 h-3.5 text-green-400/50" />
            <span className="text-[11px] font-semibold text-[var(--text-primary)] tabular-nums">
              {truncateHash(proof.issuer, 8)}
            </span>
            {isLive && (
              <span className="text-[7px] px-1 py-0.5 rounded bg-green-400/10 text-green-400 border border-green-400/15">
                LIVE
              </span>
            )}
          </div>
          <div className="flex items-center gap-2">
            <span className={cn("text-[9px] font-semibold px-2 py-0.5 rounded border", tierBg(proof.tier), tierColor(proof.tier))}>
              {tierLabel(proof.tier)}
            </span>
            <ChevronRight className="w-3 h-3 text-[var(--text-tertiary)] opacity-0 group-hover:opacity-100 transition-opacity" />
          </div>
        </div>

        {/* Data */}
        <div className="grid grid-cols-2 gap-x-4 gap-y-3 mb-5">
          <div>
            <p className="text-[8px] text-[var(--text-tertiary)] mb-0.5 uppercase tracking-wider">Merkle Root</p>
            <p className="text-[11px] text-[var(--text-secondary)] tabular-nums leading-tight">
              {truncateHash(proof.merkleRoot, 8)}
            </p>
          </div>
          <div>
            <p className="text-[8px] text-[var(--text-tertiary)] mb-0.5 uppercase tracking-wider">Liabilities</p>
            <p className="text-[11px] font-bold text-[var(--text-primary)] tabular-nums leading-tight">
              {liabNum > 0 ? formatSats(liabNum) : "—"}
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between text-[9px] text-[var(--text-tertiary)]">
          <span className="tabular-nums">{truncateHash(proof.txHash, 6)}</span>
          <div className="flex items-center gap-1">
            <Clock className="w-2.5 h-2.5" />
            <span>
              {proof.timestamp > 0
                ? timeAgo(proof.timestamp * (proof.timestamp > 1e12 ? 1 : 1000))
                : "—"}
            </span>
          </div>
        </div>
      </div>
    </motion.a>
  );
}

/* ═══════════════════════════════════════════════════════════ */
export default function ExplorerPage() {
  const { proofs: liveProofs, loading, error, refetch } = useRecentProofs(50);
  const [search, setSearch] = useState("");

  const allProofs = liveProofs;

  // Filter by search
  const filtered = search
    ? allProofs.filter(p =>
        p.issuer.toLowerCase().includes(search.toLowerCase()) ||
        p.txHash.toLowerCase().includes(search.toLowerCase()) ||
        p.merkleRoot.toLowerCase().includes(search.toLowerCase())
      )
    : allProofs;

  return (
    <div className="max-w-[1200px] mx-auto px-6 py-10">
      {/* Header */}
      <R>
        <div className="flex items-end justify-between mb-1">
          <div>
            <p className="label-mono mb-2">Explorer</p>
            <h1 className="heading-serif text-[32px] text-[var(--text-primary)] leading-tight">
              Proof Explorer
            </h1>
          </div>
          <button
            onClick={refetch}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[10px] text-[var(--text-tertiary)] hover:text-[var(--text-secondary)] border border-[var(--border-dim)] hover:border-[var(--border-subtle)] transition-all"
          >
            <RefreshCw className={cn("w-3 h-3", loading && "animate-spin")} />
            Refresh
          </button>
        </div>
        <p className="text-[11px] text-[var(--text-tertiary)] mb-8">
          {liveProofs.length > 0
            ? `${liveProofs.length} verified proof${liveProofs.length === 1 ? "" : "s"} on Starknet Sepolia`
            : loading ? "Querying Starknet Sepolia..." : "No proofs found yet"}
        </p>
      </R>

      {/* Search */}
      <R delay={0.05}>
        <div className="mb-6">
          <div className="cell noise">
            <div className="flex items-center gap-2 px-5 py-3">
              <Search className="w-3.5 h-3.5 text-[var(--text-tertiary)]" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search by address, tx hash, or merkle root..."
                className="flex-1 bg-transparent text-[11px] text-[var(--text-primary)] placeholder:text-[var(--text-tertiary)] outline-none"
              />
              <span className="text-[9px] text-[var(--text-tertiary)] tabular-nums">
                {loading ? <Loader2 className="w-3 h-3 animate-spin inline" /> : `${filtered.length} results`}
              </span>
            </div>
          </div>
        </div>
      </R>

      {/* Error banner */}
      {error && (
        <div className="mb-4 flex items-center gap-2 px-4 py-2 rounded-lg bg-[var(--amber-400)]/5 border border-[var(--amber-400)]/10 text-[10px] text-[var(--amber-400)]">
          <AlertCircle className="w-3 h-3" />
          RPC error: {error} — showing fallback data
        </div>
      )}

      {/* Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
        {filtered.map((proof, i) => (
          <ProofCard key={`${proof.txHash}-${i}`} proof={proof} index={i} isLive={true} />
        ))}
      </div>

      {filtered.length === 0 && !loading && (
        <div className="text-center py-16 text-[12px] text-[var(--text-tertiary)]">
          {search ? "No proofs match your search" : "No proofs found"}
        </div>
      )}
    </div>
  );
}
