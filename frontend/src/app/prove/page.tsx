"use client";

import { useRef } from "react";
import { motion, useInView } from "framer-motion";
import { Lock, Shield, Bitcoin, ArrowRight, ShieldCheck, GitBranch, Landmark } from "lucide-react";
import { ProveFlow } from "@/components/prove-flow";

/* ─── scroll-triggered reveal ─── */
function R({ children, delay = 0, className = "" }: {
  children: React.ReactNode; delay?: number; className?: string;
}) {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: "-60px" });
  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 24 }}
      animate={inView ? { opacity: 1, y: 0 } : {}}
      transition={{ delay, duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

export default function ProvePage() {
  return (
    <div className="max-w-[1200px] mx-auto px-6 py-10">
      {/* Header */}
      <R>
        <p className="label-mono mb-2">Prove</p>
        <h1 className="heading-serif text-[32px] text-[var(--text-primary)] leading-tight mb-3">
          Submit Solvency Proof
        </h1>

        {/* Inline pipeline */}
        <div className="flex items-center gap-2 text-[10px] text-[var(--text-tertiary)] mb-10">
          {[
            { icon: Bitcoin, label: "UTXOs" },
            { icon: GitBranch, label: "Merkle" },
            { icon: Lock, label: "ZK Proof" },
            { icon: ShieldCheck, label: "Verify" },
            { icon: Landmark, label: "Registry" },
          ].map((s, i) => (
            <span key={s.label} className="flex items-center gap-1">
              <s.icon className="w-3 h-3" />
              {s.label}
              {i < 4 && <ArrowRight className="w-2.5 h-2.5 ml-1 opacity-30" />}
            </span>
          ))}
        </div>
      </R>

      {/* Main flow */}
      <R delay={0.1}>
        <ProveFlow />
      </R>

      {/* Info cells */}
      <R delay={0.2}>
        <div className="mt-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {[
              {
                icon: Shield,
                title: "Private by design",
                desc: "Your UTXO data never leaves your machine. Only the ZK proof and public inputs go on-chain.",
              },
              {
                icon: Lock,
                title: "Cryptographic truth",
                desc: "UltraHonk proofs on BN254 with 128-bit security. The Noir circuit enforces reserves ≥ liabilities.",
              },
              {
                icon: ShieldCheck,
                title: "On-chain finality",
                desc: "Verified proofs are recorded in the Starknet registry with tier classification. Proofs expire after 24h.",
              },
            ].map((item) => (
              <div key={item.title} className="cell cell-pad noise">
                <div className="flex items-center gap-2 mb-2">
                  <item.icon className="w-3.5 h-3.5 text-[var(--text-tertiary)]" />
                  <p className="text-[11px] font-semibold text-[var(--text-primary)]">{item.title}</p>
                </div>
                <p className="text-[10px] text-[var(--text-tertiary)] leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </R>
    </div>
  );
}
