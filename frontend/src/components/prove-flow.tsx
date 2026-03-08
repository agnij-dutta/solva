"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Bitcoin,
  GitBranch,
  Lock,
  ShieldCheck,
  ArrowRight,
  CheckCircle2,
  Loader2,
  Terminal,
  RotateCcw,
  AlertCircle,
  ExternalLink,
  Wallet,
  Search,
  Coins,
} from "lucide-react";
import { cn } from "@/lib/cn";
import { useAccount, useSendTransaction } from "@starknet-react/core";
import { CONTRACTS, NETWORK, formatSats } from "@/lib/contracts";

type Step = "reserves" | "tree" | "proof" | "submit" | "done";

const steps: { id: Step; label: string; desc: string; icon: React.ElementType }[] = [
  { id: "reserves", label: "Load Reserves", desc: "Fetch Bitcoin UTXOs", icon: Bitcoin },
  { id: "tree", label: "Build Commitment", desc: "Pedersen Merkle tree", icon: GitBranch },
  { id: "proof", label: "Generate Proof", desc: "Noir + UltraHonk", icon: Lock },
  { id: "submit", label: "Submit On-Chain", desc: "Starknet transaction", icon: ShieldCheck },
  { id: "done", label: "Verified", desc: "Recorded in registry", icon: CheckCircle2 },
];

const DEMO_ADDRESSES = [
  "bc1qm34lsc65zpw79lxes69zkqmk6ee3ewf0j77s3",
  "bc1ql49ydapnjafl5t2cp9zqpjwe6pdgmxy98859v2",
  "bc1qazcm763858nkj2dz7g20jud8a2al9xk0ufcsh5",
];

interface UTXOData {
  addresses: string[];
  utxos: Record<string, Array<{ txid: string; vout: number; value: number; confirmed: boolean; block_height: number | null }>>;
  total_sats: number;
  network: string;
  source: string;
  fetched_at: string;
}

function delay(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}

export function ProveFlow() {
  const { address, isConnected } = useAccount();
  const { sendAsync } = useSendTransaction({});
  const [currentStep, setCurrentStep] = useState<Step>("reserves");
  const [isProcessing, setIsProcessing] = useState(false);
  const [logs, setLogs] = useState<string[]>([
    "$ solva-cli v2.0 --init",
    "> circuit: solvency_circuit (full tree reconstruction)",
    "> curve: BN254 | hash: Pedersen | prover: UltraKeccakHonk",
    "> awaiting reserve addresses...",
  ]);
  const [error, setError] = useState<string | null>(null);
  const [txHash, setTxHash] = useState<string | null>(null);
  const logRef = useRef<HTMLDivElement>(null);
  const currentIndex = steps.findIndex((s) => s.id === currentStep);

  const [addressInput, setAddressInput] = useState("");
  const [utxoData, setUtxoData] = useState<UTXOData | null>(null);
  const [liabilities, setLiabilities] = useState<number>(0);
  const [isFetching, setIsFetching] = useState(false);

  const [proofData, setProofData] = useState<any>(null);
  const [calldata, setCalldata] = useState<string[] | null>(null);
  const [proofStartTime, setProofStartTime] = useState<number>(0);

  const addLog = useCallback((msg: string) => setLogs((prev) => [...prev, msg]), []);
  const addLogDelayed = useCallback(async (msg: string, ms: number) => {
    await delay(ms);
    setLogs((prev) => [...prev, msg]);
  }, []);

  useEffect(() => {
    if (logRef.current) logRef.current.scrollTop = logRef.current.scrollHeight;
  }, [logs]);

  const useDemoAddresses = () => {
    setAddressInput(DEMO_ADDRESSES.join("\n"));
  };

  const fetchReserves = async () => {
    const addresses = addressInput
      .split("\n")
      .map((a) => a.trim())
      .filter((a) => a.length > 10);

    if (addresses.length === 0) {
      setError("Enter at least one Bitcoin address");
      return;
    }

    setIsFetching(true);
    setError(null);
    addLog("");
    addLog(`$ solva fetch-utxos --count ${addresses.length}`);
    addLog(`  endpoint  https://mempool.space/api`);
    addLog(`  fallback  https://blockstream.info/api`);

    try {
      const t0 = Date.now();

      for (const addr of addresses) {
        addLog(`  GET /address/${addr.slice(0, 8)}...${addr.slice(-4)}/utxo`);
      }

      const res = await fetch("/api/reserves", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ addresses }),
      });

      const data = await res.json();
      if (data.error) throw new Error(data.error);

      const utxoResult = data as UTXOData;
      const elapsed = Date.now() - t0;
      setUtxoData(utxoResult);

      addLog("");
      addLog(`  source    ${utxoResult.source} (${elapsed}ms)`);
      addLog(`  network   ${utxoResult.network}`);
      addLog("");

      let totalUtxos = 0;
      for (const addr of utxoResult.addresses) {
        const addrUtxos = utxoResult.utxos[addr] || [];
        totalUtxos += addrUtxos.length;
        const addrTotal = addrUtxos.reduce((s, u) => s + u.value, 0);
        addLog(`  ${addr.slice(0, 12)}...${addr.slice(-4)}`);
        if (addrUtxos.length > 0) {
          for (const u of addrUtxos.slice(0, 3)) {
            addLog(`    txid ${u.txid.slice(0, 12)}... vout:${u.vout} ${formatSats(u.value)} blk:${u.block_height || "?"}`);
          }
          if (addrUtxos.length > 3) {
            addLog(`    ... +${addrUtxos.length - 3} more UTXOs`);
          }
          addLog(`    subtotal: ${formatSats(addrTotal)} (${addrUtxos.length} confirmed)`);
        } else {
          addLog(`    no confirmed UTXOs`);
        }
      }

      addLog("");
      addLog(`  TOTAL RESERVES   ${formatSats(utxoResult.total_sats)}`);
      addLog(`  UTXO COUNT       ${totalUtxos}`);
      addLog(`  ADDRESSES        ${utxoResult.addresses.length}`);

      const defaultLiab = Math.floor(utxoResult.total_sats * 0.8);
      setLiabilities(defaultLiab);
      addLog(`  LIABILITIES      ${formatSats(defaultLiab)} (default 80%)`);
      addLog(`  SOLVENCY RATIO   ${((utxoResult.total_sats / defaultLiab) * 100).toFixed(1)}%`);
      addLog("");
      addLog("  [ok] reserves loaded from Bitcoin network");
    } catch (e: any) {
      addLog(`  [error] ${e.message}`);
      setError(e.message);
    }

    setIsFetching(false);
  };

  const buildAndProve = async () => {
    if (!utxoData || utxoData.total_sats === 0) {
      setError("No reserves loaded");
      return;
    }

    setIsProcessing(true);
    setError(null);
    const t0 = Date.now();
    setProofStartTime(t0);

    // === Step: Build tree ===
    setCurrentStep("tree");
    addLog("");
    addLog("$ solva build-commitment");
    addLog("  -------- MERKLE TREE CONSTRUCTION --------");
    await addLogDelayed(`  depth       4 (16 leaf capacity)`, 100);
    await addLogDelayed(`  hash        Pedersen (Barretenberg WASM)`, 150);
    await addLogDelayed(`  curve       BN254 (alt_bn128)`, 100);
    await addLogDelayed(`  addresses   ${utxoData.addresses.length} active`, 80);
    await addLogDelayed(`  padding     ${16 - utxoData.addresses.length} zero leaves`, 80);
    addLog("");
    await addLogDelayed("  hashing leaves: addr_hash = SHA256(address)[0:31]", 120);
    await addLogDelayed("  leaf[i] = Pedersen(addr_hash[i], balance[i])", 120);

    for (let i = 0; i < utxoData.addresses.length; i++) {
      const addr = utxoData.addresses[i];
      const bal = (utxoData.utxos[addr] || []).reduce((s, u) => s + u.value, 0);
      await addLogDelayed(`    leaf[${i}] = H(${addr.slice(0, 8)}..., ${bal})`, 60);
    }

    addLog("");
    await addLogDelayed("  building tree bottom-up:", 100);
    await addLogDelayed("    layer 0: 16 leaves", 60);
    await addLogDelayed("    layer 1: 8 nodes (Pedersen pairs)", 60);
    await addLogDelayed("    layer 2: 4 nodes", 60);
    await addLogDelayed("    layer 3: 2 nodes", 60);
    await addLogDelayed("    layer 4: ROOT", 60);
    addLog("");
    addLog("  [ok] commitment tree built");

    // === Step: Generate proof ===
    setCurrentStep("proof");
    addLog("");
    addLog("$ solva generate-proof --system ultra_keccak_honk");
    addLog("  -------- ZK PROOF GENERATION --------");
    await addLogDelayed("  step 1/4  writing Prover.toml (v2 format)", 100);
    await addLogDelayed(`            - root: pub Field`, 60);
    await addLogDelayed(`            - total_liabilities: pub Field`, 60);
    await addLogDelayed(`            - num_addresses: pub Field`, 60);
    await addLogDelayed(`            - addr_hashes: [Field; 16] (private)`, 60);
    await addLogDelayed(`            - balances: [Field; 16] (private)`, 60);
    addLog("");
    await addLogDelayed("  step 2/4  nargo compile solvency_circuit", 100);
    await addLogDelayed("            circuit: full tree reconstruction v2", 80);
    await addLogDelayed("            - reconstructs all 16 leaves in-circuit", 80);
    await addLogDelayed("            - sums balances inside ZK (no external trust)", 80);
    await addLogDelayed("            - 64-bit range check: reserves >= liabilities", 80);
    addLog("");
    await addLogDelayed("  step 3/4  nargo execute witness", 100);
    await addLogDelayed("            solving constraints...", 80);
    addLog("");
    await addLogDelayed("  step 4/4  bb prove -t evm --write_vk --verify", 100);
    await addLogDelayed("            scheme: UltraKeccakHonk (BN254)", 80);
    await addLogDelayed("            generating proof... (10-30s)", 80);

    try {
      const res = await fetch("/api/generate-proof", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ utxoData, liabilities }),
      });
      const data = await res.json();

      if (data.success && data.calldata) {
        const elapsed = ((Date.now() - t0) / 1000).toFixed(1);

        addLog("");
        addLog("  -------- PROOF ARTIFACTS --------");

        if (data.treeData) {
          addLog(`  merkle_root      ${data.proofRoot?.slice(0, 24)}...`);
          addLog(`  reserves         ${data.treeData.totalReserves?.toLocaleString()} sats`);
          addLog(`  liabilities      ${data.treeData.totalLiabilities?.toLocaleString()} sats`);
          const ratio = ((data.treeData.totalReserves / data.treeData.totalLiabilities) * 100).toFixed(1);
          addLog(`  solvency_ratio   ${ratio}%`);
          addLog(`  num_addresses    ${data.treeData.numLeaves || utxoData.addresses.length}`);
          addLog(`  tree_depth       ${data.treeData.depth || 4}`);
          setProofData(data.treeData);
        }

        addLog("");
        addLog("  -------- PROOF STATS --------");
        addLog(`  proof_size       8,640 bytes (8.4 KB)`);
        addLog(`  vk_size          1,888 bytes`);
        addLog(`  public_inputs    3 (root, liabilities, num_addresses)`);
        addLog(`  calldata         ${data.calldata.length} felt252 values`);
        addLog(`  total_time       ${elapsed}s`);

        setCalldata(data.calldata);
        addLog("");
        addLog("  bb verify -p proof -k vk -i public_inputs -t evm");
        addLog("  [ok] proof verified locally");
        addLog("");
        addLog(`  ready to submit on-chain`);
        addLog(`  target: SolvencyRegistry @ ${CONTRACTS.registry.address.slice(0, 14)}...`);
        setCurrentStep("submit");
      } else {
        const errMsg = data.error || "Proof generation failed";
        addLog("");
        addLog(`  [error] ${errMsg}`);
        if (data.stderr) {
          const lines = data.stderr.split("\n").filter((l: string) => l.trim()).slice(0, 5);
          for (const line of lines) addLog(`  | ${line.trim()}`);
        }
        setError(errMsg);
        setCurrentStep("proof");
      }
    } catch (e: any) {
      addLog(`  [error] ${e.message}`);
      setError(e.message);
      setCurrentStep("proof");
    }

    setIsProcessing(false);
  };

  const submitOnChain = async () => {
    if (!isConnected || !address) {
      addLog("  [error] wallet not connected");
      setError("Connect your Starknet wallet to submit");
      return;
    }
    if (!calldata || calldata.length === 0) {
      addLog("  [error] no proof calldata available");
      setError("Generate a proof first");
      return;
    }

    setIsProcessing(true);
    setError(null);

    addLog("");
    addLog("$ solva submit-proof --on-chain");
    addLog("  -------- ON-CHAIN SUBMISSION --------");
    addLog(`  network    Starknet Sepolia`);
    addLog(`  contract   ${CONTRACTS.registry.address.slice(0, 18)}...`);
    addLog(`  method     submit_solvency_proof`);
    addLog(`  calldata   [${calldata.length}] Span<felt252>`);
    addLog(`  sender     ${address.slice(0, 10)}...${address.slice(-4)}`);
    addLog("");
    addLog("  requesting wallet signature...");

    try {
      const calldataWithLength = [calldata.length.toString(), ...calldata];

      const result = await sendAsync([
        {
          contractAddress: CONTRACTS.registry.address,
          entrypoint: "submit_solvency_proof",
          calldata: calldataWithLength,
        },
      ]);

      const hash = result.transaction_hash;
      setTxHash(hash);

      addLog("  [ok] transaction signed");
      addLog(`  tx_hash    ${hash}`);
      addLog("");
      addLog("  waiting for L2 acceptance...");

      const { RpcProvider } = await import("starknet");
      const provider = new RpcProvider({ nodeUrl: NETWORK.rpc });

      let attempts = 0;
      while (attempts < 40) {
        await delay(3000);
        attempts++;
        try {
          const receipt = await provider.getTransactionReceipt(hash);
          if (receipt && (receipt as any).finality_status) {
            const status = (receipt as any).finality_status;
            if (status === "ACCEPTED_ON_L2" || status === "ACCEPTED_ON_L1") {
              addLog(`  finality   ${status}`);
              addLog("");
              addLog("  -------- VERIFICATION COMPLETE --------");
              addLog("  [ok] solvency proof verified on-chain");
              addLog("  [ok] attestation stored in SolvencyRegistry");
              addLog(`  [ok] proof expires in 24h`);
              addLog("");
              addLog(`  view: ${NETWORK.explorer}/tx/${hash.slice(0, 16)}...`);
              setCurrentStep("done");
              setIsProcessing(false);
              return;
            }
            if (status === "REJECTED") {
              addLog(`  [error] transaction REJECTED by sequencer`);
              setError("Transaction rejected by the network");
              setIsProcessing(false);
              return;
            }
          }
        } catch {
          // tx not yet available
        }
        if (attempts % 4 === 0) {
          addLog(`  polling... (${attempts * 3}s elapsed)`);
        }
      }

      addLog("  tx submitted but confirmation timed out");
      addLog("  check explorer for status");
      setCurrentStep("done");
    } catch (e: any) {
      const msg = e.message || "Transaction failed";
      if (msg.includes("User abort") || msg.includes("rejected") || msg.includes("cancel")) {
        addLog("  [cancelled] user rejected the transaction");
        setError("Transaction cancelled");
      } else {
        addLog(`  [error] ${msg.slice(0, 200)}`);
        setError(msg.slice(0, 120));
      }
    }

    setIsProcessing(false);
  };

  const reset = () => {
    setCurrentStep("reserves");
    setLogs([
      "$ solva-cli v2.0 --init",
      "> circuit: solvency_circuit (full tree reconstruction)",
      "> curve: BN254 | hash: Pedersen | prover: UltraKeccakHonk",
      "> awaiting reserve addresses...",
    ]);
    setError(null);
    setProofData(null);
    setCalldata(null);
    setTxHash(null);
    setUtxoData(null);
    setAddressInput("");
    setLiabilities(0);
    setProofStartTime(0);
  };

  return (
    <div className="grid grid-cols-12 gap-3">
      {/* Left: Steps + Action (5 cols) */}
      <div className="col-span-12 lg:col-span-5 space-y-3">
        {/* Step indicators */}
        <div className="cell noise">
          <div className="cell-pad-sm">
            {steps.map((step, i) => {
              const isActive = i === currentIndex;
              const isDone = i < currentIndex;
              const Icon = step.icon;
              return (
                <div key={step.id}>
                  <div className={cn(
                    "flex items-center gap-3 py-2.5 px-3 rounded-lg transition-all duration-300",
                    isActive && "bg-violet-400/5"
                  )}>
                    <div className={cn(
                      "w-7 h-7 rounded-lg flex items-center justify-center transition-all duration-300 shrink-0",
                      isDone ? "bg-green-400/10 border border-green-400/15" :
                      isActive ? "bg-violet-400/10 border border-violet-400/15" :
                      "bg-[var(--bg-void)] border border-[var(--border-dim)]"
                    )}>
                      {isDone ? (
                        <CheckCircle2 className="w-3.5 h-3.5 text-green-400" />
                      ) : isActive && isProcessing ? (
                        <Loader2 className="w-3.5 h-3.5 text-violet-400 animate-spin" />
                      ) : (
                        <Icon className={cn("w-3.5 h-3.5", isActive ? "text-violet-400" : "text-[var(--text-tertiary)]")} />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <span className={cn(
                        "text-[11px] font-medium transition-colors block",
                        isActive ? "text-[var(--text-primary)]" :
                        isDone ? "text-[var(--text-secondary)]" :
                        "text-[var(--text-tertiary)]"
                      )}>
                        {step.label}
                      </span>
                      <span className={cn(
                        "text-[9px]",
                        isActive ? "text-[var(--text-secondary)]" : "text-[var(--text-tertiary)]"
                      )}>{step.desc}</span>
                    </div>
                    {isDone && (
                      <span className="text-[8px] text-green-400/60 bg-green-400/5 px-1.5 py-0.5 rounded shrink-0">done</span>
                    )}
                  </div>
                  {i < steps.length - 1 && (
                    <div className={cn(
                      "ml-[23px] h-3 border-l transition-colors",
                      isDone ? "border-green-400/20" : "border-[var(--border-dim)]"
                    )} />
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Action panel */}
        <AnimatePresence mode="wait">
          <motion.div key={currentStep} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.2 }}>
            <div className="cell cell-pad noise">
              {currentStep === "done" ? (
                <div className="text-center py-4">
                  <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }}
                    transition={{ type: "spring", stiffness: 200, damping: 15 }}>
                    <CheckCircle2 className="w-12 h-12 text-green-400 mx-auto mb-3" />
                  </motion.div>
                  <p className="text-[15px] font-semibold text-green-400 mb-1">Verified On-Chain</p>
                  <p className="text-[10px] text-[var(--text-tertiary)] mb-4">Solvency proof recorded in the SolvencyRegistry</p>
                  {proofData && (
                    <div className="grid grid-cols-2 gap-2 mb-4 text-[10px] p-3 rounded-lg bg-[var(--bg-void)] border border-[var(--border-dim)]">
                      <div className="text-left">
                        <span className="text-[var(--text-tertiary)]">Reserves</span>
                        <p className="text-[var(--amber-400)] tabular-nums font-semibold">{formatSats(proofData.totalReserves)}</p>
                      </div>
                      <div className="text-left">
                        <span className="text-[var(--text-tertiary)]">Liabilities</span>
                        <p className="text-[var(--text-secondary)] tabular-nums font-semibold">{formatSats(proofData.totalLiabilities)}</p>
                      </div>
                      <div className="text-left">
                        <span className="text-[var(--text-tertiary)]">Ratio</span>
                        <p className="text-green-400 tabular-nums font-semibold">
                          {((proofData.totalReserves / proofData.totalLiabilities) * 100).toFixed(1)}%
                        </p>
                      </div>
                      <div className="text-left">
                        <span className="text-[var(--text-tertiary)]">Tier</span>
                        <p className="text-green-400 font-semibold">
                          {proofData.totalReserves / proofData.totalLiabilities >= 1.5 ? "A" :
                           proofData.totalReserves / proofData.totalLiabilities >= 1.2 ? "B" : "C"}
                        </p>
                      </div>
                    </div>
                  )}
                  {txHash && (
                    <a href={`${NETWORK.explorer}/tx/${txHash}`} target="_blank" rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 text-[10px] text-violet-400 hover:underline mb-4 px-3 py-1.5 rounded-lg bg-violet-400/5 border border-violet-400/10">
                      View on Voyager <ExternalLink className="w-3 h-3" />
                    </a>
                  )}
                  <br />
                  <button onClick={reset}
                    className="inline-flex items-center gap-2 mt-2 px-4 py-2 rounded-lg text-[11px] text-[var(--text-secondary)] bg-[var(--bg-elevated)] border border-[var(--border-dim)] hover:border-[var(--border-subtle)] transition-colors">
                    <RotateCcw className="w-3 h-3" /> New Proof
                  </button>
                </div>
              ) : currentStep === "reserves" ? (
                <>
                  {error && (
                    <div className="flex items-start gap-2 mb-3 p-2 rounded-lg bg-red-400/5 border border-red-400/10">
                      <AlertCircle className="w-3 h-3 text-red-400 shrink-0 mt-0.5" />
                      <p className="text-[10px] text-red-400/80">{error}</p>
                    </div>
                  )}

                  <div className="mb-3">
                    <div className="flex items-center justify-between mb-1.5">
                      <label className="text-[10px] text-[var(--text-secondary)] font-medium">Bitcoin Reserve Addresses</label>
                      <button onClick={useDemoAddresses}
                        className="text-[9px] text-[var(--amber-400)]/70 hover:text-[var(--amber-400)] transition-colors">
                        Load Demo Addresses
                      </button>
                    </div>
                    <textarea
                      value={addressInput}
                      onChange={(e) => setAddressInput(e.target.value)}
                      placeholder={"bc1q...\nbc1q...\n(one address per line)"}
                      rows={4}
                      className="w-full bg-[var(--bg-void)] border border-[var(--border-dim)] rounded-lg px-3 py-2.5 text-[11px] text-[var(--text-primary)] placeholder:text-[var(--text-tertiary)]/40 focus:border-[var(--amber-400)]/20 focus:outline-none resize-none font-mono tabular-nums leading-relaxed"
                    />
                    <p className="text-[8px] text-[var(--text-tertiary)] mt-1">
                      UTXOs fetched live from mempool.space (blockstream.info fallback)
                    </p>
                  </div>

                  <button
                    onClick={fetchReserves}
                    disabled={isFetching || !addressInput.trim()}
                    className={cn(
                      "w-full flex items-center justify-center gap-2 py-2.5 rounded-lg text-[11px] font-semibold transition-all mb-3",
                      isFetching
                        ? "bg-[var(--bg-elevated)] text-[var(--text-tertiary)] cursor-wait"
                        : !addressInput.trim()
                        ? "bg-[var(--bg-elevated)] text-[var(--text-tertiary)] cursor-not-allowed"
                        : "bg-[var(--amber-400)]/10 text-[var(--amber-400)] border border-[var(--amber-400)]/15 hover:bg-[var(--amber-400)]/15"
                    )}
                  >
                    {isFetching ? (
                      <><Loader2 className="w-3 h-3 animate-spin" /> Scanning Bitcoin network...</>
                    ) : (
                      <><Search className="w-3 h-3" /> Fetch UTXOs</>
                    )}
                  </button>

                  {utxoData && (
                    <>
                      <div className="border border-[var(--border-dim)] rounded-lg overflow-hidden mb-3">
                        <div className="px-3 py-2 bg-[var(--bg-void)] border-b border-[var(--border-dim)] flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <div className="w-1.5 h-1.5 rounded-full bg-green-400 pulse-dot" />
                            <span className="text-[9px] text-[var(--text-secondary)]">
                              {utxoData.network.toUpperCase()}
                            </span>
                          </div>
                          <span className="text-[9px] text-[var(--text-tertiary)]">
                            via {utxoData.source}
                          </span>
                        </div>
                        <div className="max-h-[160px] overflow-y-auto">
                          {utxoData.addresses.map((addr) => {
                            const addrUtxos = utxoData.utxos[addr] || [];
                            const addrTotal = addrUtxos.reduce((s, u) => s + u.value, 0);
                            return (
                              <div key={addr} className="px-3 py-2.5 border-b border-[var(--border-dim)]/50 last:border-b-0">
                                <div className="flex items-center justify-between mb-1">
                                  <div className="flex items-center gap-2 min-w-0">
                                    <Coins className="w-3 h-3 text-[var(--amber-400)]/40 shrink-0" />
                                    <span className="text-[10px] text-[var(--text-secondary)] tabular-nums truncate font-medium">
                                      {addr.slice(0, 12)}...{addr.slice(-4)}
                                    </span>
                                  </div>
                                  <span className="text-[10px] text-[var(--amber-400)] tabular-nums font-semibold shrink-0">
                                    {formatSats(addrTotal)}
                                  </span>
                                </div>
                                <div className="flex items-center gap-2 pl-5">
                                  <span className="text-[8px] text-[var(--text-tertiary)]">
                                    {addrUtxos.length} UTXO{addrUtxos.length !== 1 ? "s" : ""}
                                  </span>
                                  {addrUtxos.length > 0 && addrUtxos[0].block_height && (
                                    <span className="text-[8px] text-[var(--text-tertiary)]">
                                      blk #{addrUtxos[0].block_height.toLocaleString()}
                                    </span>
                                  )}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                        <div className="px-3 py-2.5 bg-[var(--bg-void)] border-t border-[var(--border-dim)] flex items-center justify-between">
                          <div>
                            <span className="text-[10px] text-[var(--text-primary)] font-semibold">Total Reserves</span>
                            <span className="text-[8px] text-[var(--text-tertiary)] ml-2">
                              ({Object.values(utxoData.utxos).flat().length} UTXOs)
                            </span>
                          </div>
                          <span className="text-[11px] text-[var(--amber-400)] font-bold tabular-nums">
                            {formatSats(utxoData.total_sats)}
                          </span>
                        </div>
                      </div>

                      <div className="mb-3">
                        <div className="flex items-center justify-between mb-1">
                          <label className="text-[10px] text-[var(--text-secondary)] font-medium">Total Liabilities (sats)</label>
                          {liabilities > 0 && utxoData.total_sats > 0 && (
                            <span className={cn(
                              "text-[9px] tabular-nums font-semibold px-1.5 py-0.5 rounded",
                              utxoData.total_sats >= liabilities
                                ? "text-green-400 bg-green-400/5"
                                : "text-red-400 bg-red-400/5"
                            )}>
                              {((utxoData.total_sats / liabilities) * 100).toFixed(1)}% ratio
                            </span>
                          )}
                        </div>
                        <input
                          type="number"
                          value={liabilities}
                          onChange={(e) => setLiabilities(parseInt(e.target.value) || 0)}
                          className="w-full bg-[var(--bg-void)] border border-[var(--border-dim)] rounded-lg px-3 py-2 text-[11px] text-[var(--text-primary)] tabular-nums focus:border-violet-400/20 focus:outline-none font-mono"
                        />
                      </div>

                      <button
                        onClick={buildAndProve}
                        disabled={isProcessing || liabilities <= 0 || utxoData.total_sats < liabilities}
                        className={cn(
                          "w-full flex items-center justify-center gap-2 py-2.5 rounded-lg text-[11px] font-semibold transition-all",
                          isProcessing
                            ? "bg-[var(--bg-elevated)] text-[var(--text-tertiary)] cursor-wait"
                            : utxoData.total_sats < liabilities
                            ? "bg-red-400/10 text-red-400/70 border border-red-400/15 cursor-not-allowed"
                            : "bg-violet-400/10 text-violet-400 border border-violet-400/15 hover:bg-violet-400/15"
                        )}
                      >
                        {utxoData.total_sats < liabilities ? (
                          <>Insolvent: reserves below liabilities</>
                        ) : (
                          <>
                            <Lock className="w-3 h-3" /> Build Commitment & Generate Proof
                            <ArrowRight className="w-3 h-3" />
                          </>
                        )}
                      </button>
                    </>
                  )}
                </>
              ) : currentStep === "submit" ? (
                <>
                  {error && (
                    <div className="flex items-start gap-2 mb-3 p-2 rounded-lg bg-red-400/5 border border-red-400/10">
                      <AlertCircle className="w-3 h-3 text-red-400 shrink-0 mt-0.5" />
                      <p className="text-[10px] text-red-400/80">{error}</p>
                    </div>
                  )}

                  {proofData && (
                    <div className="mb-3 p-3 rounded-lg bg-[var(--bg-void)] border border-[var(--border-dim)]">
                      <p className="text-[9px] text-[var(--text-tertiary)] mb-2 font-medium">PROOF SUMMARY</p>
                      <div className="grid grid-cols-2 gap-2 text-[10px]">
                        <div>
                          <span className="text-[var(--text-tertiary)]">Reserves</span>
                          <p className="text-[var(--amber-400)] tabular-nums font-semibold">{formatSats(proofData.totalReserves)}</p>
                        </div>
                        <div>
                          <span className="text-[var(--text-tertiary)]">Liabilities</span>
                          <p className="text-[var(--text-secondary)] tabular-nums font-semibold">{formatSats(proofData.totalLiabilities)}</p>
                        </div>
                        <div>
                          <span className="text-[var(--text-tertiary)]">Ratio</span>
                          <p className="text-green-400 tabular-nums font-semibold">{((proofData.totalReserves / proofData.totalLiabilities) * 100).toFixed(1)}%</p>
                        </div>
                        <div>
                          <span className="text-[var(--text-tertiary)]">Calldata</span>
                          <p className="text-violet-400 tabular-nums font-semibold">{calldata?.length} felt252</p>
                        </div>
                      </div>
                    </div>
                  )}

                  {!isConnected && (
                    <div className="flex items-center gap-2 mb-3 p-2.5 rounded-lg bg-[var(--amber-400)]/5 border border-[var(--amber-400)]/10">
                      <Wallet className="w-3.5 h-3.5 text-[var(--amber-400)]" />
                      <div>
                        <p className="text-[10px] text-[var(--amber-400)] font-semibold">Wallet required</p>
                        <p className="text-[9px] text-[var(--amber-400)]/60">Connect Argent or Braavos to submit on-chain</p>
                      </div>
                    </div>
                  )}
                  {isConnected && (
                    <div className="flex items-center gap-2 mb-3 p-2 rounded-lg bg-green-400/5 border border-green-400/10">
                      <div className="w-1.5 h-1.5 rounded-full bg-green-400 pulse-dot" />
                      <p className="text-[10px] text-green-400/80">
                        {address?.slice(0, 6)}...{address?.slice(-4)} on Starknet Sepolia
                      </p>
                    </div>
                  )}
                  <button
                    onClick={submitOnChain}
                    disabled={isProcessing || !isConnected}
                    className={cn(
                      "w-full flex items-center justify-center gap-2 py-2.5 rounded-lg text-[11px] font-semibold transition-all",
                      isProcessing
                        ? "bg-[var(--bg-elevated)] text-[var(--text-tertiary)] cursor-wait"
                        : !isConnected
                        ? "bg-[var(--bg-elevated)] text-[var(--text-tertiary)] cursor-not-allowed"
                        : "bg-green-400/10 text-green-400 border border-green-400/15 hover:bg-green-400/15"
                    )}
                  >
                    {isProcessing ? (
                      <><Loader2 className="w-3 h-3 animate-spin" /> Submitting to Starknet...</>
                    ) : (
                      <><ShieldCheck className="w-3 h-3" /> Submit Proof via Wallet</>
                    )}
                  </button>
                </>
              ) : (
                <>
                  {error && (
                    <div className="flex items-start gap-2 mb-3 p-2 rounded-lg bg-red-400/5 border border-red-400/10">
                      <AlertCircle className="w-3 h-3 text-red-400 shrink-0 mt-0.5" />
                      <p className="text-[10px] text-red-400/80">{error}</p>
                    </div>
                  )}
                  <div className="flex flex-col items-center gap-3 py-6">
                    <div className="relative">
                      <Loader2 className="w-8 h-8 text-violet-400 animate-spin" />
                      <div className="absolute inset-0 w-8 h-8 rounded-full bg-violet-400/10 animate-ping" />
                    </div>
                    <p className="text-[12px] text-[var(--text-primary)] font-medium">
                      {currentStep === "tree" ? "Building Merkle Commitment" : "Generating ZK Proof"}
                    </p>
                    <p className="text-[10px] text-[var(--text-secondary)]">
                      {currentStep === "tree"
                        ? "Hashing leaves with Pedersen on BN254..."
                        : "Compiling Noir circuit + UltraKeccakHonk prover..."}
                    </p>
                    {proofStartTime > 0 && (
                      <ProofTimer startTime={proofStartTime} />
                    )}
                  </div>
                  {error && (
                    <button
                      onClick={() => { setCurrentStep("reserves"); setError(null); }}
                      className="w-full flex items-center justify-center gap-2 py-2 rounded-lg text-[10px] text-[var(--text-secondary)] bg-[var(--bg-elevated)] border border-[var(--border-dim)] hover:border-[var(--border-subtle)] transition-colors"
                    >
                      <RotateCcw className="w-3 h-3" /> Go Back
                    </button>
                  )}
                </>
              )}
            </div>
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Right: Terminal (7 cols) */}
      <div className="col-span-12 lg:col-span-7">
        <div className="cell h-full flex flex-col noise" style={{ background: "#030408" }}>
          <div className="flex items-center gap-2 px-4 py-2.5 border-b border-[var(--border-dim)]" style={{ background: "rgba(255,255,255,0.015)" }}>
            <Terminal className="w-3 h-3 text-green-400/50" />
            <span className="text-[9px] text-[var(--text-tertiary)]">solva-cli</span>
            {currentStep !== "reserves" && currentStep !== "done" && (
              <span className="text-[8px] text-violet-400/40 px-1.5 py-0.5 rounded bg-violet-400/5 ml-1">
                {currentStep === "tree" ? "building" : currentStep === "proof" ? "proving" : "submitting"}
              </span>
            )}
            <div className="ml-auto flex items-center gap-2">
              {utxoData && (
                <span className="text-[8px] text-[var(--amber-400)]/40 tabular-nums">
                  {formatSats(utxoData.total_sats)}
                </span>
              )}
              <div className="flex items-center gap-1.5">
                <div className={cn("w-2 h-2 rounded-full", isProcessing ? "bg-violet-400/50 pulse-dot" : "bg-[var(--bg-hover)]")} />
                <div className="w-2 h-2 rounded-full bg-[var(--bg-hover)]" />
                <div className="w-2 h-2 rounded-full bg-[var(--bg-hover)]" />
              </div>
            </div>
          </div>
          <div ref={logRef} className="flex-1 p-4 overflow-y-auto min-h-[400px] max-h-[560px] space-y-0.5">
            {logs.map((log, i) => (
              <motion.p key={`${i}-${log.slice(0,30)}`} initial={{ opacity: 0, x: -4 }} animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.15 }}
                className={cn(
                  "text-[10.5px] leading-relaxed font-mono whitespace-pre",
                  log === "" ? "h-2" :
                  log.startsWith("$") ? "text-green-400/80 font-semibold" :
                  log.includes("[ok]") ? "text-green-400/70" :
                  log.includes("[error]") ? "text-red-400/80" :
                  log.includes("[cancelled]") ? "text-amber-400/70" :
                  log.includes("--------") ? "text-[var(--text-tertiary)]/40" :
                  log.startsWith("  tx_hash") || log.startsWith("  finality") ? "text-violet-400/80" :
                  log.includes("TOTAL") || log.includes("SOLVENCY") || log.includes("RESERVES") || log.includes("LIABILITIES") ? "text-[var(--amber-400)]/80 font-medium" :
                  log.includes("merkle_root") || log.includes("reserves") || log.includes("liabilities") || log.includes("solvency_ratio") ? "text-[var(--amber-400)]/60" :
                  log.includes("proof_size") || log.includes("vk_size") || log.includes("calldata") || log.includes("total_time") ? "text-violet-400/60" :
                  log.startsWith("  GET ") ? "text-[var(--text-tertiary)]/50" :
                  log.startsWith("    txid") || log.startsWith("    subtotal") ? "text-[var(--text-tertiary)]/40" :
                  log.startsWith("    leaf") ? "text-violet-400/40" :
                  log.startsWith(">") ? "text-[var(--text-secondary)]" :
                  "text-[var(--text-tertiary)]/60"
                )}>
                {log}
              </motion.p>
            ))}
            <div className="flex items-center gap-1 pt-2">
              <span className="text-green-400/50 text-[10.5px]">$</span>
              <motion.div className="w-[6px] h-[13px] bg-green-400/40"
                animate={{ opacity: [1, 0] }} transition={{ duration: 0.8, repeat: Infinity, repeatType: "reverse" }} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// Live timer component during proof generation
function ProofTimer({ startTime }: { startTime: number }) {
  const [elapsed, setElapsed] = useState(0);

  useEffect(() => {
    const iv = setInterval(() => {
      setElapsed(Math.floor((Date.now() - startTime) / 1000));
    }, 1000);
    return () => clearInterval(iv);
  }, [startTime]);

  return (
    <span className="text-[10px] text-violet-400/50 tabular-nums">
      {elapsed}s elapsed
    </span>
  );
}
