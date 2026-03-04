"use client";

import { useRef, useState, useEffect } from "react";
import {
  motion,
  useScroll,
  useTransform,
  useInView,
  useMotionValue,
  useSpring,
} from "framer-motion";
import {
  ArrowRight,
  Lock,
  Bitcoin,
  ShieldCheck,
  Landmark,
  GitBranch,
  Terminal,
  ArrowUpRight,
  Code2,
  Zap,
  Shield,
} from "lucide-react";
import Link from "next/link";
import { CONTRACTS, NETWORK, truncateHash } from "@/lib/contracts";

/* ─── scroll-triggered reveal ─── */
function R({ children, delay = 0, className = "" }: {
  children: React.ReactNode; delay?: number; className?: string;
}) {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: "-80px" });
  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 30 }}
      animate={inView ? { opacity: 1, y: 0 } : {}}
      transition={{ delay, duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

/* ─── interactive pipeline ─── */
function Pipeline() {
  const [hovered, setHovered] = useState<number | null>(null);
  const stages = [
    { icon: Bitcoin, label: "BTC UTXOs", detail: "Custodians commit Bitcoin reserves as a UTXO set", color: "var(--amber-400)" },
    { icon: GitBranch, label: "Merkle Tree", detail: "Pedersen hash tree on BN254, depth 4", color: "var(--amber-400)" },
    { icon: Lock, label: "ZK Proof", detail: "Noir circuit + UltraHonk prover", color: "var(--violet-400)" },
    { icon: ShieldCheck, label: "Verify", detail: "Garaga verifier validates on Starknet", color: "var(--violet-400)" },
    { icon: Landmark, label: "DeFi", detail: "Solvency tier unlocks lending access", color: "var(--green-400)" },
  ];

  return (
    <div className="relative">
      <div className="absolute top-6 left-[10%] right-[10%] h-px bg-gradient-to-r from-[var(--amber-400)]/8 via-[var(--violet-400)]/8 to-green-400/8" />
      <div className="flex items-start justify-between relative">
        {stages.map((s, i) => {
          const Icon = s.icon;
          const active = hovered === i;
          return (
            <motion.div
              key={i}
              className="flex flex-col items-center gap-2.5 cursor-pointer relative z-10 w-[18%]"
              onHoverStart={() => setHovered(i)}
              onHoverEnd={() => setHovered(null)}
              animate={{ y: active ? -6 : 0 }}
              transition={{ type: "spring", stiffness: 300, damping: 22 }}
            >
              <motion.div
                className="w-12 h-12 rounded-2xl flex items-center justify-center border"
                animate={{
                  background: active ? `color-mix(in srgb, ${s.color} 10%, transparent)` : "var(--bg-surface)",
                  borderColor: active ? `color-mix(in srgb, ${s.color} 20%, transparent)` : "var(--border-dim)",
                  boxShadow: active ? `0 0 30px color-mix(in srgb, ${s.color} 12%, transparent)` : "none",
                }}
                transition={{ duration: 0.3 }}
              >
                <Icon className="w-5 h-5" style={{ color: active ? s.color : "var(--text-tertiary)" }} />
              </motion.div>
              <span className="text-[10px] text-[var(--text-secondary)]">{s.label}</span>
              <motion.p
                animate={{ opacity: active ? 1 : 0, y: active ? 0 : 6 }}
                transition={{ duration: 0.2 }}
                className="absolute top-full mt-7 text-[9px] text-[var(--text-tertiary)] text-center leading-relaxed max-w-[140px] pointer-events-none"
              >
                {s.detail}
              </motion.p>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}

/* ─── terminal that types ─── */
function TerminalBlock() {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: "-100px" });
  const [lines, setLines] = useState(0);
  const cmds = [
    { t: "$ nargo compile", c: "text-green-400/60" },
    { t: "  compiled: 32,768 gates", c: "text-[var(--text-tertiary)]" },
    { t: "$ bb prove_ultra_keccak_honk", c: "text-green-400/60" },
    { t: "  proof: 2.1 KB (BN254)", c: "text-[var(--text-tertiary)]" },
    { t: "$ bb verify -k vk -p proof", c: "text-green-400/60" },
    { t: "  verified ✓", c: "text-green-400/40" },
  ];

  useEffect(() => {
    if (!inView) return;
    let i = 0;
    const iv = setInterval(() => { i++; setLines(i); if (i >= cmds.length) clearInterval(iv); }, 350);
    return () => clearInterval(iv);
  }, [inView]);

  return (
    <div ref={ref} className="cell noise" style={{ background: "#030408" }}>
      <div className="flex items-center gap-2 px-4 py-2.5 border-b border-[var(--border-dim)]">
        <Terminal className="w-3 h-3 text-[var(--text-tertiary)]" />
        <span className="text-[9px] text-[var(--text-tertiary)]">proof generation</span>
        <div className="ml-auto flex gap-1.5">
          <div className="w-2 h-2 rounded-full bg-[var(--bg-hover)]" />
          <div className="w-2 h-2 rounded-full bg-[var(--bg-hover)]" />
          <div className="w-2 h-2 rounded-full bg-[var(--bg-hover)]" />
        </div>
      </div>
      <div className="p-4 space-y-1.5 min-h-[200px]">
        {cmds.slice(0, lines).map((l, i) => (
          <motion.p key={i} initial={{ opacity: 0, x: -6 }} animate={{ opacity: 1, x: 0 }} className={`text-[11px] ${l.c}`}>{l.t}</motion.p>
        ))}
        {lines < cmds.length && (
          <div className="flex items-center gap-1 pt-1">
            <span className="text-green-400/30 text-[11px]">$</span>
            <motion.div className="w-[6px] h-[14px] bg-green-400/20" animate={{ opacity: [1, 0] }} transition={{ duration: 0.7, repeat: Infinity, repeatType: "reverse" }} />
          </div>
        )}
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════ */
export default function Home() {
  const heroRef = useRef(null);
  const { scrollYProgress } = useScroll({ target: heroRef, offset: ["start start", "end start"] });
  const heroOpacity = useTransform(scrollYProgress, [0, 0.7], [1, 0]);
  const heroY = useTransform(scrollYProgress, [0, 1], [0, 100]);
  const heroScale = useTransform(scrollYProgress, [0, 0.7], [1, 0.96]);

  return (
    <div className="relative">

      {/* ═══ HERO ═══ */}
      <section ref={heroRef} className="relative min-h-[100vh] flex items-center justify-center overflow-hidden">
        {/* Ambient gradients */}
        <div className="absolute inset-0 pointer-events-none">
          <motion.div
            className="absolute top-[20%] left-[15%] w-[600px] h-[600px] rounded-full blur-[200px] bg-[var(--amber-400)]/[0.025]"
            animate={{ scale: [1, 1.08, 1], x: [0, 30, 0] }}
            transition={{ duration: 12, repeat: Infinity, ease: "easeInOut" }}
          />
          <motion.div
            className="absolute bottom-[20%] right-[15%] w-[500px] h-[500px] rounded-full blur-[180px] bg-violet-500/[0.02]"
            animate={{ scale: [1, 1.12, 1], y: [0, -20, 0] }}
            transition={{ duration: 15, repeat: Infinity, ease: "easeInOut" }}
          />
        </div>

        {/* Floating dots */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          {Array.from({ length: 16 }).map((_, i) => (
            <motion.div
              key={i}
              className="absolute w-px h-px rounded-full"
              style={{
                left: `${12 + (i * 5.3) % 76}%`,
                top: `${8 + (i * 7.1) % 84}%`,
                background: i % 3 === 0 ? "var(--amber-400)" : i % 3 === 1 ? "var(--violet-400)" : "#484c64",
              }}
              animate={{ y: [0, -(20 + i * 3), 0], opacity: [0, 0.5, 0], scale: [0, 1.5, 0] }}
              transition={{ duration: 4 + i * 0.3, repeat: Infinity, delay: i * 0.4, ease: "easeInOut" }}
            />
          ))}
        </div>

        <motion.div
          style={{ opacity: heroOpacity, y: heroY, scale: heroScale }}
          className="relative z-10 max-w-[780px] mx-auto px-6 text-center"
        >
          {/* Badge */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5 }}
            className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-[var(--bg-surface)]/60 backdrop-blur-xl border border-[var(--border-dim)] mb-8"
          >
            <div className="w-1.5 h-1.5 rounded-full bg-green-400 pulse-dot" />
            <span className="text-[10px] text-[var(--text-tertiary)]">Live on Starknet Sepolia</span>
          </motion.div>

          {/* Heading */}
          <motion.h1
            initial={{ opacity: 0, y: 32 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.1, ease: [0.22, 1, 0.36, 1] }}
            className="heading-serif text-[clamp(48px,8vw,88px)] leading-[0.88] mb-6 tracking-tight"
          >
            <span className="text-gradient-amber">Solvency</span>
            <br />
            <span className="text-[var(--text-primary)]">without trust</span>
          </motion.h1>

          {/* Sub */}
          <motion.p
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.25 }}
            className="text-[13px] text-[var(--text-secondary)] max-w-[400px] mx-auto mb-10 leading-relaxed"
          >
            Bitcoin custodians prove reserves exceed liabilities using zero-knowledge proofs, verified on Starknet.
          </motion.p>

          {/* CTAs */}
          <motion.div
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.4 }}
            className="flex items-center gap-3 justify-center"
          >
            <Link
              href="/prove"
              className="group flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[var(--amber-400)]/10 text-[var(--amber-400)] border border-[var(--amber-400)]/15 text-[11px] font-semibold hover:bg-[var(--amber-400)]/15 transition-all glow-amber"
            >
              Submit Proof
              <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
            </Link>
            <Link
              href="/explorer"
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[var(--bg-surface)]/80 backdrop-blur text-[var(--text-secondary)] border border-[var(--border-dim)] text-[11px] font-semibold hover:text-[var(--text-primary)] hover:border-[var(--border-subtle)] transition-all"
            >
              Explore Proofs
            </Link>
          </motion.div>
        </motion.div>

        {/* Scroll indicator */}
        <motion.div
          className="absolute bottom-8 left-1/2 -translate-x-1/2"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.8 }}
        >
          <motion.div
            className="w-5 h-8 rounded-full border border-[var(--border-subtle)] flex items-start justify-center p-1"
            animate={{ opacity: [0.3, 0.5, 0.3] }}
            transition={{ duration: 2.5, repeat: Infinity }}
          >
            <motion.div
              className="w-0.5 h-1.5 rounded-full bg-[var(--text-tertiary)]"
              animate={{ y: [0, 10, 0] }}
              transition={{ duration: 1.8, repeat: Infinity, ease: "easeInOut" }}
            />
          </motion.div>
        </motion.div>
      </section>

      {/* ═══ PIPELINE ═══ */}
      <section className="py-24 px-6">
        <div className="max-w-[900px] mx-auto">
          <R>
            <p className="label-mono text-center mb-3">The Pipeline</p>
            <h2 className="heading-serif text-[28px] text-[var(--text-primary)] text-center mb-14">
              From UTXOs to on-chain truth
            </h2>
          </R>
          <R delay={0.15}>
            <Pipeline />
          </R>
        </div>
      </section>

      {/* ═══ HOW IT WORKS — bento ═══ */}
      <section className="py-24 px-6 border-t border-[var(--border-dim)]">
        <div className="max-w-[1100px] mx-auto">
          <R>
            <p className="label-mono mb-2">How It Works</p>
            <h2 className="heading-serif text-[32px] text-[var(--text-primary)] mb-10">
              Math replaces trust
            </h2>
          </R>

          <div className="grid grid-cols-12 gap-3">
            {/* Reserve commitment + tree visual */}
            <R delay={0.05} className="col-span-12 md:col-span-7">
              <div className="cell cell-glow cell-pad noise h-full">
                <div className="flex items-center gap-2 mb-4">
                  <Bitcoin className="w-4 h-4 text-[var(--amber-400)]" />
                  <h3 className="text-[13px] font-semibold text-[var(--text-primary)]">Reserve Commitment</h3>
                </div>
                <p className="text-[11px] text-[var(--text-secondary)] leading-relaxed mb-6">
                  UTXOs are hashed into a Pedersen Merkle tree on BN254. Only the root is public.
                </p>
                {/* Tree */}
                <div className="flex flex-col items-center gap-3 py-4">
                  <R delay={0.3}>
                    <div className="px-3 py-1.5 rounded-lg bg-[var(--amber-400)]/8 border border-[var(--amber-400)]/15 text-[10px] text-[var(--amber-400)] tabular-nums">
                      root: 0x1391...899e
                    </div>
                  </R>
                  <div className="flex items-center gap-16">
                    <div className="w-px h-4 bg-[var(--border-subtle)]" />
                    <div className="w-px h-4 bg-[var(--border-subtle)]" />
                  </div>
                  <R delay={0.4}>
                    <div className="flex items-center gap-6">
                      <div className="px-2.5 py-1 rounded bg-[var(--bg-void)] border border-[var(--border-dim)] text-[9px] text-[var(--text-tertiary)] tabular-nums">H(L0,L1)</div>
                      <div className="px-2.5 py-1 rounded bg-[var(--bg-void)] border border-[var(--border-dim)] text-[9px] text-[var(--text-tertiary)] tabular-nums">H(L2,L3)</div>
                    </div>
                  </R>
                  <R delay={0.5}>
                    <div className="flex items-center gap-2">
                      {["3.2M", "2.8M", "1.5M", "2.5M"].map((v, i) => (
                        <div key={i} className="px-2 py-1 rounded bg-[var(--bg-void)] border border-[var(--border-dim)] text-center">
                          <div className="text-[8px] text-[var(--text-tertiary)]">UTXO {i}</div>
                          <div className="text-[9px] text-[var(--amber-400)]/60 tabular-nums">{v}</div>
                        </div>
                      ))}
                    </div>
                  </R>
                </div>
              </div>
            </R>

            {/* Right column */}
            <div className="col-span-12 md:col-span-5 space-y-3">
              <R delay={0.12}>
                <TerminalBlock />
              </R>
              <R delay={0.2}>
                <div className="cell cell-glow cell-pad noise">
                  <div className="flex items-center gap-2 mb-3">
                    <Landmark className="w-4 h-4 text-green-400" />
                    <h3 className="text-[13px] font-semibold text-[var(--text-primary)]">Lending Gate</h3>
                  </div>
                  <p className="text-[11px] text-[var(--text-secondary)] leading-relaxed mb-4">
                    Verified proofs unlock DeFi. Tier system governs borrowing.
                  </p>
                  <div className="flex items-center gap-2">
                    {[
                      { tier: "A", pct: ">120%", color: "text-green-400 bg-green-400/8 border-green-400/12" },
                      { tier: "B", pct: ">110%", color: "text-green-400/70 bg-green-400/5 border-green-400/8" },
                      { tier: "C", pct: ">100%", color: "text-[var(--amber-400)] bg-[var(--amber-400)]/8 border-[var(--amber-400)]/12" },
                    ].map((t) => (
                      <div key={t.tier} className={`flex-1 px-2 py-2 rounded-lg border text-center ${t.color}`}>
                        <div className="text-[11px] font-bold">{t.tier}</div>
                        <div className="text-[8px] opacity-50 mt-0.5">{t.pct}</div>
                      </div>
                    ))}
                  </div>
                </div>
              </R>
            </div>
          </div>
        </div>
      </section>

      {/* ═══ TECH & CONTRACTS ═══ */}
      <section className="py-24 px-6 border-t border-[var(--border-dim)]">
        <div className="max-w-[1100px] mx-auto">
          <div className="grid grid-cols-12 gap-3">
            {/* Stack */}
            <R className="col-span-12 md:col-span-4">
              <div className="cell cell-pad noise h-full">
                <p className="label-mono mb-5">Stack</p>
                <div className="space-y-4">
                  {[
                    { name: "Noir", sub: "ZK circuit language", icon: Code2, c: "group-hover:text-violet-400" },
                    { name: "Barretenberg", sub: "UltraHonk prover", icon: Lock, c: "group-hover:text-violet-400" },
                    { name: "Garaga", sub: "On-chain verifier", icon: ShieldCheck, c: "group-hover:text-[var(--amber-400)]" },
                    { name: "Starknet", sub: "Settlement layer", icon: Zap, c: "group-hover:text-[var(--amber-400)]" },
                  ].map((t) => (
                    <div key={t.name} className="flex items-center gap-3 group cursor-default">
                      <div className="w-8 h-8 rounded-lg bg-[var(--bg-void)] border border-[var(--border-dim)] flex items-center justify-center shrink-0 group-hover:border-[var(--border-subtle)] transition-colors">
                        <t.icon className={`w-3.5 h-3.5 text-[var(--text-tertiary)] transition-colors ${t.c}`} />
                      </div>
                      <div>
                        <p className="text-[11px] font-semibold text-[var(--text-primary)]">{t.name}</p>
                        <p className="text-[9px] text-[var(--text-tertiary)]">{t.sub}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </R>

            {/* Contracts */}
            <R delay={0.08} className="col-span-12 md:col-span-8">
              <div className="cell noise h-full">
                <div className="cell-pad-sm border-b border-[var(--border-dim)] flex items-center justify-between">
                  <p className="label-mono">Deployed Contracts</p>
                  <a href={NETWORK.explorer} target="_blank" rel="noopener noreferrer"
                    className="text-[9px] text-[var(--text-tertiary)] hover:text-[var(--text-secondary)] flex items-center gap-1 transition-colors">
                    Voyager <ArrowUpRight className="w-2.5 h-2.5" />
                  </a>
                </div>
                {[
                  { name: "SolvencyVerifier", addr: CONTRACTS.verifier.address, desc: "ZK proof verification", dot: "bg-violet-400" },
                  { name: "SolvencyRegistry", addr: CONTRACTS.registry.address, desc: "Attestation storage, 24h expiry", dot: "bg-[var(--amber-400)]" },
                  { name: "LendingProtocol", addr: CONTRACTS.lending.address, desc: "Tier-gated DeFi access", dot: "bg-green-400" },
                ].map((c) => (
                  <a key={c.name} href={`${NETWORK.explorer}/contract/${c.addr}`} target="_blank" rel="noopener noreferrer"
                    className="flex items-center justify-between px-5 py-4 border-b border-[var(--border-dim)]/50 hover:bg-[var(--bg-hover)]/30 transition-colors group">
                    <div className="flex items-center gap-3">
                      <div className={`w-1.5 h-1.5 rounded-full ${c.dot} opacity-40`} />
                      <div>
                        <span className="text-[11px] text-[var(--text-primary)] font-medium">{c.name}</span>
                        <p className="text-[9px] text-[var(--text-tertiary)]">{c.desc}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] text-[var(--text-tertiary)] tabular-nums">{truncateHash(c.addr, 6)}</span>
                      <ArrowUpRight className="w-3 h-3 text-[var(--text-tertiary)] opacity-0 group-hover:opacity-100 transition-opacity" />
                    </div>
                  </a>
                ))}
              </div>
            </R>
          </div>
        </div>
      </section>

      {/* ═══ CTA ═══ */}
      <section className="py-28 px-6 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-[var(--amber-400)]/[0.01] to-transparent pointer-events-none" />
        <R>
          <div className="max-w-[460px] mx-auto text-center relative z-10">
            <h2 className="heading-serif text-[28px] text-[var(--text-primary)] mb-3">
              Prove your solvency
            </h2>
            <p className="text-[12px] text-[var(--text-tertiary)] mb-8">
              Generate a ZK proof of your Bitcoin reserves in under 30 seconds.
            </p>
            <Link
              href="/prove"
              className="group inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-[var(--amber-400)]/10 text-[var(--amber-400)] border border-[var(--amber-400)]/15 text-[12px] font-semibold hover:bg-[var(--amber-400)]/15 transition-all glow-amber"
            >
              Get Started
              <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
            </Link>
          </div>
        </R>
      </section>

      {/* ═══ FOOTER ═══ */}
      <footer className="py-6 px-6 border-t border-[var(--border-dim)]">
        <div className="max-w-[1100px] mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Shield className="w-3 h-3 text-[var(--amber-400)]/30" />
            <span className="text-[9px] text-[var(--text-tertiary)]">Solva Protocol</span>
          </div>
          <p className="text-[9px] text-[var(--text-tertiary)]">
            RE&#123;DEFINE&#125; Hackathon &middot; Starknet
          </p>
        </div>
      </footer>
    </div>
  );
}
