"use client";

import { useRef } from "react";
import { motion, useInView } from "framer-motion";
import { Code2, Terminal, Globe, Layers, ArrowUpRight, Copy, Check, Shield } from "lucide-react";
import { useState } from "react";
import { CONTRACTS, NETWORK } from "@/lib/contracts";

function R({ children, delay = 0, className = "" }: {
  children: React.ReactNode; delay?: number; className?: string;
}) {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: "-60px" });
  return (
    <motion.div ref={ref} initial={{ opacity: 0, y: 24 }}
      animate={inView ? { opacity: 1, y: 0 } : {}}
      transition={{ delay, duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
      className={className}>
      {children}
    </motion.div>
  );
}

function CodeBlock({ code, lang, title }: { code: string; lang: string; title: string }) {
  const [copied, setCopied] = useState(false);
  const copy = () => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  return (
    <div className="cell noise overflow-hidden">
      <div className="flex items-center justify-between px-4 py-2.5 border-b border-[var(--border-dim)]" style={{ background: "rgba(255,255,255,0.015)" }}>
        <div className="flex items-center gap-2">
          <Code2 className="w-3 h-3 text-[var(--text-tertiary)]" />
          <span className="text-[9px] text-[var(--text-tertiary)]">{title}</span>
          <span className="text-[8px] text-violet-400/40 px-1.5 py-0.5 rounded bg-violet-400/5">{lang}</span>
        </div>
        <button onClick={copy} className="text-[var(--text-tertiary)] hover:text-[var(--text-secondary)] transition-colors">
          {copied ? <Check className="w-3 h-3 text-green-400" /> : <Copy className="w-3 h-3" />}
        </button>
      </div>
      <pre className="p-4 overflow-x-auto text-[11px] leading-relaxed" style={{ background: "#030408" }}>
        <code className="text-[var(--text-secondary)]">{code}</code>
      </pre>
    </div>
  );
}

export default function IntegratePage() {
  return (
    <div className="max-w-[1000px] mx-auto px-6 py-10">
      <R>
        <p className="label-mono mb-2">Integrate</p>
        <h1 className="heading-serif text-[32px] text-[var(--text-primary)] leading-tight mb-3">
          Plug into Solva
        </h1>
        <p className="text-[12px] text-[var(--text-secondary)] max-w-[520px] mb-10 leading-relaxed">
          Query solvency status from your smart contracts, frontend, or backend.
          Gate lending, minting, or any DeFi operation on verified Bitcoin reserves.
        </p>
      </R>

      <div className="space-y-6">
        {/* Cairo Integration */}
        <R delay={0.05}>
          <div className="flex items-center gap-2 mb-3">
            <Layers className="w-4 h-4 text-[var(--amber-400)]" />
            <h2 className="text-[14px] font-semibold text-[var(--text-primary)]">Query Solvency in Cairo</h2>
          </div>
          <p className="text-[11px] text-[var(--text-tertiary)] mb-3 leading-relaxed">
            Import the ISolvencyRegistry interface and call <code className="text-violet-400/70">is_solvent()</code> or <code className="text-violet-400/70">get_solvency_info()</code> from any Starknet contract.
          </p>
          <CodeBlock
            title="lending_protocol.cairo"
            lang="Cairo"
            code={`use starknet::ContractAddress;

#[starknet::interface]
trait ISolvencyRegistry<TContractState> {
    fn is_solvent(self: @TContractState, issuer: ContractAddress) -> bool;
    fn get_solvency_info(self: @TContractState, issuer: ContractAddress) -> SolvencyInfo;
}

#[starknet::contract]
mod MyProtocol {
    use super::{ISolvencyRegistryDispatcher, ISolvencyRegistryDispatcherTrait};

    #[storage]
    struct Storage {
        registry: ContractAddress,
    }

    #[external(v0)]
    fn borrow(ref self: ContractState, amount: u256) {
        let registry = ISolvencyRegistryDispatcher {
            contract_address: self.registry.read()
        };

        // Gate on verified solvency
        assert(registry.is_solvent(issuer_address), 'Reserve not verified');

        // Check tier for LTV limits
        let info = registry.get_solvency_info(issuer_address);
        match info.tier {
            SolvencyTier::TierA => { /* 80% LTV */ },
            SolvencyTier::TierB => { /* 60% LTV */ },
            SolvencyTier::TierC => { /* 40% LTV */ },
            SolvencyTier::None  => { panic!("No valid proof") },
        }
    }
}`}
          />
        </R>

        {/* JavaScript SDK */}
        <R delay={0.1}>
          <div className="flex items-center gap-2 mb-3">
            <Terminal className="w-4 h-4 text-violet-400" />
            <h2 className="text-[14px] font-semibold text-[var(--text-primary)]">JavaScript / TypeScript</h2>
          </div>
          <p className="text-[11px] text-[var(--text-tertiary)] mb-3 leading-relaxed">
            Use <code className="text-violet-400/70">starknet.js</code> to query the registry from any frontend or Node.js backend.
          </p>
          <CodeBlock
            title="query-solvency.ts"
            lang="TypeScript"
            code={`import { RpcProvider, Contract } from "starknet";

const provider = new RpcProvider({
  nodeUrl: "${NETWORK.rpc}"
});

const registry = new Contract(
  REGISTRY_ABI,
  "${CONTRACTS.registry.address}",
  provider
);

// Check if an issuer is solvent
const isSolvent = await registry.is_solvent(issuerAddress);
console.log("Solvent:", isSolvent); // true | false

// Get detailed solvency info
const info = await registry.get_solvency_info(issuerAddress);
console.log({
  lastProofTime: info.last_proof_time,
  merkleRoot: info.merkle_root,
  liabilities: info.total_liabilities,
  isValid: info.is_valid,
  tier: info.tier, // None | TierC | TierB | TierA
});`}
          />
        </R>

        {/* REST API */}
        <R delay={0.15}>
          <div className="flex items-center gap-2 mb-3">
            <Globe className="w-4 h-4 text-green-400" />
            <h2 className="text-[14px] font-semibold text-[var(--text-primary)]">REST API</h2>
          </div>
          <p className="text-[11px] text-[var(--text-tertiary)] mb-3 leading-relaxed">
            Query proof status and fetch Bitcoin reserves via the Solva API.
          </p>
          <div className="space-y-3">
            <CodeBlock
              title="GET /api/proof-status?issuer=0x..."
              lang="HTTP"
              code={`GET /api/proof-status?issuer=0x036f21aff52fb88cc777f0bc9151917c5196d17c8ac1ccb52da5087c35e8c635

Response:
{
  "isValid": true,
  "tier": "TierA",
  "lastProofTime": 1741459200,
  "merkleRoot": "0x1391...899e",
  "totalLiabilities": "13600000",
  "proofAge": "2h 15m",
  "fresh": true
}`}
            />
            <CodeBlock
              title="POST /api/reserves"
              lang="HTTP"
              code={`POST /api/reserves
Content-Type: application/json

{
  "addresses": [
    "bc1qm34lsc65zpw79lxes69zkqmk6ee3ewf0j77s3",
    "bc1ql49ydapnjafl5t2cp9zqpjwe6pdgmxy98859v2"
  ]
}

Response:
{
  "addresses": ["bc1qm34...", "bc1ql49..."],
  "utxos": { ... },
  "total_sats": 17000000,
  "network": "mainnet",
  "source": "mempool.space"
}`}
            />
          </div>
        </R>

        {/* Tier System */}
        <R delay={0.2}>
          <div className="flex items-center gap-2 mb-3">
            <Shield className="w-4 h-4 text-[var(--amber-400)]" />
            <h2 className="text-[14px] font-semibold text-[var(--text-primary)]">Solvency Tier System</h2>
          </div>
          <p className="text-[11px] text-[var(--text-tertiary)] mb-3 leading-relaxed">
            The registry classifies proofs into tiers based on reserve-to-liability ratio. Downstream protocols use tiers to set risk parameters.
          </p>
          <div className="cell noise overflow-hidden">
            <table className="w-full text-[11px]">
              <thead>
                <tr className="border-b border-[var(--border-dim)]" style={{ background: "rgba(255,255,255,0.015)" }}>
                  <th className="text-left px-4 py-3 text-[var(--text-tertiary)] font-medium text-[10px]">Tier</th>
                  <th className="text-left px-4 py-3 text-[var(--text-tertiary)] font-medium text-[10px]">Reserve Ratio</th>
                  <th className="text-left px-4 py-3 text-[var(--text-tertiary)] font-medium text-[10px]">Max LTV</th>
                  <th className="text-left px-4 py-3 text-[var(--text-tertiary)] font-medium text-[10px]">Risk Level</th>
                </tr>
              </thead>
              <tbody>
                {[
                  { tier: "A", ratio: "≥ 150%", ltv: "80%", risk: "Low", color: "text-green-400", bg: "bg-green-400/5" },
                  { tier: "B", ratio: "≥ 120%", ltv: "60%", risk: "Medium", color: "text-green-400/70", bg: "bg-green-400/3" },
                  { tier: "C", ratio: "≥ 100%", ltv: "40%", risk: "Elevated", color: "text-[var(--amber-400)]", bg: "bg-[var(--amber-400)]/5" },
                  { tier: "None", ratio: "< 100%", ltv: "0%", risk: "Blocked", color: "text-red-400/70", bg: "bg-red-400/3" },
                ].map((t) => (
                  <tr key={t.tier} className={`border-b border-[var(--border-dim)]/50 ${t.bg}`}>
                    <td className={`px-4 py-3 font-bold ${t.color}`}>{t.tier}</td>
                    <td className="px-4 py-3 text-[var(--text-secondary)] tabular-nums">{t.ratio}</td>
                    <td className="px-4 py-3 text-[var(--text-secondary)] tabular-nums">{t.ltv}</td>
                    <td className={`px-4 py-3 ${t.color}`}>{t.risk}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </R>

        {/* Contract Addresses */}
        <R delay={0.25}>
          <div className="flex items-center gap-2 mb-3">
            <Code2 className="w-4 h-4 text-violet-400" />
            <h2 className="text-[14px] font-semibold text-[var(--text-primary)]">Contract Addresses</h2>
          </div>
          <p className="text-[11px] text-[var(--text-tertiary)] mb-3">
            Deployed on Starknet Sepolia. All contracts are verified on Voyager.
          </p>
          <div className="cell noise overflow-hidden">
            {[
              { name: "SolvencyVerifier", addr: CONTRACTS.verifier.address, desc: "Garaga UltraKeccakHonk verifier", dot: "bg-violet-400" },
              { name: "SolvencyRegistry", addr: CONTRACTS.registry.address, desc: "Proof storage + tier classification", dot: "bg-[var(--amber-400)]" },
              { name: "LendingProtocol", addr: CONTRACTS.lending.address, desc: "Tier-gated DeFi access demo", dot: "bg-green-400" },
            ].map((c) => (
              <a key={c.name} href={`${NETWORK.explorer}/contract/${c.addr}`} target="_blank" rel="noopener noreferrer"
                className="flex items-center justify-between px-4 py-3.5 border-b border-[var(--border-dim)]/50 hover:bg-[var(--bg-hover)]/30 transition-colors group last:border-b-0">
                <div className="flex items-center gap-3">
                  <div className={`w-1.5 h-1.5 rounded-full ${c.dot} opacity-50`} />
                  <div>
                    <span className="text-[11px] text-[var(--text-primary)] font-medium">{c.name}</span>
                    <p className="text-[9px] text-[var(--text-tertiary)]">{c.desc}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] text-[var(--text-tertiary)] tabular-nums font-mono">
                    {c.addr.slice(0, 8)}...{c.addr.slice(-6)}
                  </span>
                  <ArrowUpRight className="w-3 h-3 text-[var(--text-tertiary)] opacity-0 group-hover:opacity-100 transition-opacity" />
                </div>
              </a>
            ))}
          </div>
        </R>

        {/* ZK Pipeline */}
        <R delay={0.3}>
          <div className="flex items-center gap-2 mb-3">
            <Shield className="w-4 h-4 text-violet-400" />
            <h2 className="text-[14px] font-semibold text-[var(--text-primary)]">ZK Proof Pipeline</h2>
          </div>
          <p className="text-[11px] text-[var(--text-tertiary)] mb-3 leading-relaxed">
            Solva uses a Noir circuit compiled to UltraKeccakHonk proofs on BN254, verified on-chain via Garaga.
          </p>
          <div className="cell cell-pad noise">
            <div className="space-y-3 text-[10px]">
              {[
                { step: "1", label: "Fetch UTXOs", desc: "Bitcoin reserve addresses → confirmed UTXOs via mempool.space API", color: "text-[var(--amber-400)]" },
                { step: "2", label: "Build Merkle Tree", desc: "Pedersen hash (BN254) each leaf = H(address_hash, balance). Fixed depth-4 binary tree", color: "text-[var(--amber-400)]" },
                { step: "3", label: "Compile Circuit", desc: "Noir circuit reconstructs entire tree in-circuit, verifies aggregate balance, proves reserves >= liabilities via 64-bit range check", color: "text-violet-400" },
                { step: "4", label: "Generate Proof", desc: "Barretenberg UltraKeccakHonk prover on BN254. Public inputs: root, liabilities, address count", color: "text-violet-400" },
                { step: "5", label: "Submit On-Chain", desc: "Garaga verifier validates proof. Registry stores result with tier + timestamp. 24h expiry", color: "text-green-400" },
              ].map((s) => (
                <div key={s.step} className="flex items-start gap-3">
                  <div className={`w-5 h-5 rounded-md flex items-center justify-center shrink-0 bg-[var(--bg-void)] border border-[var(--border-dim)] ${s.color} text-[9px] font-bold`}>
                    {s.step}
                  </div>
                  <div>
                    <p className={`font-semibold ${s.color}`}>{s.label}</p>
                    <p className="text-[var(--text-tertiary)] leading-relaxed">{s.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </R>
      </div>
    </div>
  );
}
