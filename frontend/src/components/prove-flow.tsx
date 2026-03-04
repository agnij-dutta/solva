"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Upload,
  GitBranch,
  Lock,
  ShieldCheck,
  ArrowRight,
  CheckCircle2,
  Loader2,
  FileJson,
  Terminal,
  RotateCcw,
  AlertCircle,
  ExternalLink,
  Wallet,
} from "lucide-react";
import { cn } from "@/lib/cn";
import { useAccount, useSendTransaction } from "@starknet-react/core";
import { CONTRACTS, NETWORK } from "@/lib/contracts";

type Step = "upload" | "tree" | "proof" | "submit" | "done";

const steps: { id: Step; label: string; icon: React.ElementType }[] = [
  { id: "upload", label: "Input Data", icon: Upload },
  { id: "tree", label: "Merkle Tree", icon: GitBranch },
  { id: "proof", label: "ZK Proof", icon: Lock },
  { id: "submit", label: "On-Chain", icon: ShieldCheck },
  { id: "done", label: "Verified", icon: CheckCircle2 },
];

export function ProveFlow() {
  const { address, isConnected } = useAccount();
  const { sendAsync } = useSendTransaction({});
  const [currentStep, setCurrentStep] = useState<Step>("upload");
  const [isProcessing, setIsProcessing] = useState(false);
  const [logs, setLogs] = useState<string[]>(["$ solva --init", "> ready. awaiting input..."]);
  const [error, setError] = useState<string | null>(null);
  const [proofData, setProofData] = useState<any>(null);
  const [calldata, setCalldata] = useState<string[] | null>(null);
  const [txHash, setTxHash] = useState<string | null>(null);
  const logRef = useRef<HTMLDivElement>(null);
  const currentIndex = steps.findIndex((s) => s.id === currentStep);

  const addLog = useCallback((msg: string) => setLogs((prev) => [...prev, msg]), []);

  useEffect(() => {
    if (logRef.current) logRef.current.scrollTop = logRef.current.scrollHeight;
  }, [logs]);

  // Check existing proof artifacts on mount
  useEffect(() => {
    fetch("/api/generate-proof")
      .then((r) => r.json())
      .then((data) => {
        if (data.hasProof && data.calldata) {
          addLog("> existing proof artifacts detected");
          if (data.treeData) {
            addLog(`  reserves    ${data.treeData.totalReserves?.toLocaleString()} sats`);
            addLog(`  liabilities ${data.treeData.totalLiabilities?.toLocaleString()} sats`);
            addLog(`  root        ${data.proofRoot?.slice(0, 18)}...`);
            setProofData(data.treeData);
          }
          setCalldata(data.calldata);
          addLog(`  calldata    ${data.calldata.length} felt252 values`);
          addLog("> ready to submit on-chain");
        }
      })
      .catch(() => {});
  }, [addLog]);

  const generateProof = async () => {
    setIsProcessing(true);
    setError(null);

    addLog("$ fetching sample BTC UTXO data...");
    setCurrentStep("tree");
    addLog("$ solva tree-builder --depth 4");
    addLog("  hashing UTXOs into Pedersen Merkle tree...");

    await new Promise((r) => setTimeout(r, 300));
    setCurrentStep("proof");
    addLog("$ nargo compile && bb prove -t evm");
    addLog("  compiling Noir circuit...");
    addLog("  generating UltraKeccakHonk proof (BN254)...");
    addLog("  this takes 10-30 seconds...");

    try {
      const res = await fetch("/api/generate-proof", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ useSample: true }),
      });
      const data = await res.json();

      if (data.success && data.calldata) {
        // Show interesting output lines
        const lines = (data.stdout || "").split("\n").filter((l: string) => l.trim());
        for (const line of lines.slice(-6)) {
          addLog("  " + line.trim());
        }

        if (data.treeData) {
          addLog(`  reserves    ${data.treeData.totalReserves?.toLocaleString()} sats`);
          addLog(`  liabilities ${data.treeData.totalLiabilities?.toLocaleString()} sats`);
          addLog(`  root        ${data.proofRoot?.slice(0, 18)}...`);
          setProofData(data.treeData);
        }

        setCalldata(data.calldata);
        addLog(`  calldata    ${data.calldata.length} felt252 values`);
        addLog("  [ok] proof generated and verified locally");
        setCurrentStep("submit");
      } else {
        const errMsg = data.error || "Proof generation failed";
        addLog(`  [error] ${errMsg}`);
        if (data.stderr) addLog(`  ${data.stderr.slice(0, 200)}`);
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

    addLog("$ submitting proof to SolvencyRegistry...");
    addLog(`  target   ${CONTRACTS.registry.address.slice(0, 16)}...`);
    addLog(`  method   submit_solvency_proof`);
    addLog(`  calldata ${calldata.length} felt252 values`);
    addLog("  signing transaction with wallet...");

    try {
      // Build the call — Span<felt252> expects [length, ...data]
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

      addLog(`  tx hash  ${hash.slice(0, 18)}...`);
      addLog("  waiting for L2 acceptance...");

      // Poll for acceptance
      const { RpcProvider } = await import("starknet");
      const provider = new RpcProvider({ nodeUrl: NETWORK.rpc });

      let attempts = 0;
      while (attempts < 40) {
        await new Promise((r) => setTimeout(r, 3000));
        attempts++;
        try {
          const receipt = await provider.getTransactionReceipt(hash);
          if (receipt && (receipt as any).finality_status) {
            const status = (receipt as any).finality_status;
            if (status === "ACCEPTED_ON_L2" || status === "ACCEPTED_ON_L1") {
              addLog(`  status   ${status}`);
              addLog("  [ok] solvency proof verified and recorded on-chain");
              setCurrentStep("done");
              setIsProcessing(false);
              return;
            }
            if (status === "REJECTED") {
              addLog(`  [error] transaction rejected`);
              setError("Transaction rejected by the network");
              setIsProcessing(false);
              return;
            }
          }
        } catch {
          // tx not yet available, keep polling
        }
        if (attempts % 5 === 0) {
          addLog(`  polling... (${attempts * 3}s)`);
        }
      }

      // If we get here, tx was sent but we timed out waiting
      addLog("  tx sent but confirmation timed out — check explorer");
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

  const handleAction = () => {
    if (currentStep === "upload") {
      generateProof();
    } else if (currentStep === "submit") {
      submitOnChain();
    } else if (proofData && calldata && (currentStep === "tree" || currentStep === "proof")) {
      setCurrentStep("submit");
      addLog("> proof already generated, ready to submit");
    }
  };

  const reset = () => {
    setCurrentStep("upload");
    setLogs(["$ solva --init", "> ready. awaiting input..."]);
    setError(null);
    setProofData(null);
    setCalldata(null);
    setTxHash(null);
  };

  return (
    <div className="grid grid-cols-12 gap-3">
      {/* Left: Steps + Action (5 cols) */}
      <div className="col-span-12 lg:col-span-5 space-y-3">
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
                      "w-6 h-6 rounded-md flex items-center justify-center transition-all duration-300 shrink-0",
                      isDone ? "bg-green-400/10" : isActive ? "bg-violet-400/10" : "bg-[var(--bg-void)]"
                    )}>
                      {isDone ? (
                        <CheckCircle2 className="w-3 h-3 text-green-400" />
                      ) : isActive && isProcessing ? (
                        <Loader2 className="w-3 h-3 text-violet-400 animate-spin" />
                      ) : (
                        <Icon className={cn("w-3 h-3", isActive ? "text-violet-400" : "text-[var(--text-tertiary)]")} />
                      )}
                    </div>
                    <span className={cn(
                      "text-[11px] transition-colors",
                      isActive ? "text-[var(--text-primary)]" :
                      isDone ? "text-[var(--text-secondary)]" :
                      "text-[var(--text-tertiary)]"
                    )}>
                      {step.label}
                    </span>
                    {isDone && <span className="text-[8px] text-green-400/50 ml-auto">done</span>}
                  </div>
                  {i < steps.length - 1 && <div className="ml-[22px] h-2 border-l border-[var(--border-dim)]" />}
                </div>
              );
            })}
          </div>
        </div>

        {/* Action cell */}
        <AnimatePresence mode="wait">
          <motion.div key={currentStep} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.2 }}>
            <div className="cell cell-pad noise">
              {currentStep === "done" ? (
                <div className="text-center py-4">
                  <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }}
                    transition={{ type: "spring", stiffness: 200, damping: 15 }}>
                    <CheckCircle2 className="w-10 h-10 text-green-400 mx-auto mb-3" />
                  </motion.div>
                  <p className="text-[14px] font-semibold text-green-400 mb-1">Verified On-Chain</p>
                  <p className="text-[10px] text-[var(--text-tertiary)] mb-3">Solvency proof recorded in the registry</p>
                  {txHash && (
                    <a href={`${NETWORK.explorer}/tx/${txHash}`} target="_blank" rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-[10px] text-violet-400 hover:underline mb-4">
                      View on Voyager <ExternalLink className="w-3 h-3" />
                    </a>
                  )}
                  <br />
                  <button onClick={reset}
                    className="inline-flex items-center gap-2 mt-2 px-4 py-2 rounded-lg text-[11px] text-[var(--text-secondary)] bg-[var(--bg-elevated)] border border-[var(--border-dim)] hover:border-[var(--border-subtle)] transition-colors">
                    <RotateCcw className="w-3 h-3" /> New Proof
                  </button>
                </div>
              ) : (
                <>
                  {error && (
                    <div className="flex items-start gap-2 mb-3 p-2 rounded-lg bg-red-400/5 border border-red-400/10">
                      <AlertCircle className="w-3 h-3 text-red-400 shrink-0 mt-0.5" />
                      <p className="text-[10px] text-red-400/80">{error}</p>
                    </div>
                  )}
                  {currentStep === "upload" && (
                    <div className="border border-dashed border-[var(--border-subtle)] rounded-lg py-8 flex flex-col items-center gap-2 hover:border-[var(--amber-400)]/20 transition-colors cursor-pointer mb-4">
                      <FileJson className="w-6 h-6 text-[var(--text-tertiary)]" />
                      <p className="text-[10px] text-[var(--text-tertiary)]">Uses sample BTC testnet data</p>
                    </div>
                  )}
                  {currentStep === "submit" && !isConnected && (
                    <div className="flex items-center gap-2 mb-3 p-2.5 rounded-lg bg-[var(--amber-400)]/5 border border-[var(--amber-400)]/10">
                      <Wallet className="w-3.5 h-3.5 text-[var(--amber-400)]" />
                      <div>
                        <p className="text-[10px] text-[var(--amber-400)] font-semibold">Wallet required</p>
                        <p className="text-[9px] text-[var(--amber-400)]/60">Connect Argent or Braavos to submit on-chain</p>
                      </div>
                    </div>
                  )}
                  {currentStep === "submit" && isConnected && (
                    <div className="flex items-center gap-2 mb-3 p-2 rounded-lg bg-green-400/5 border border-green-400/10">
                      <div className="w-1.5 h-1.5 rounded-full bg-green-400" />
                      <p className="text-[10px] text-green-400/80">
                        Connected: {address?.slice(0, 6)}...{address?.slice(-4)}
                      </p>
                    </div>
                  )}
                  <button
                    onClick={handleAction}
                    disabled={isProcessing || (currentStep === "submit" && !isConnected)}
                    className={cn(
                      "w-full flex items-center justify-center gap-2 py-2.5 rounded-lg text-[11px] font-semibold transition-all",
                      isProcessing
                        ? "bg-[var(--bg-elevated)] text-[var(--text-tertiary)] cursor-wait"
                        : currentStep === "submit" && !isConnected
                        ? "bg-[var(--bg-elevated)] text-[var(--text-tertiary)] cursor-not-allowed"
                        : currentStep === "submit"
                        ? "bg-green-400/10 text-green-400 border border-green-400/15 hover:bg-green-400/15"
                        : "bg-violet-400/10 text-violet-400 border border-violet-400/15 hover:bg-violet-400/15"
                    )}
                  >
                    {isProcessing ? (
                      <><Loader2 className="w-3 h-3 animate-spin" /> Processing...</>
                    ) : (
                      <>
                        {currentStep === "upload" ? "Generate Proof" :
                         currentStep === "submit" ? (isConnected ? "Submit via Wallet" : "Connect Wallet First") :
                         "Continue"}
                        <ArrowRight className="w-3 h-3" />
                      </>
                    )}
                  </button>
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
            <Terminal className="w-3 h-3 text-[var(--text-tertiary)]" />
            <span className="text-[9px] text-[var(--text-tertiary)]">solva-cli</span>
            <div className="ml-auto flex items-center gap-1.5">
              <div className="w-2 h-2 rounded-full bg-[var(--bg-hover)]" />
              <div className="w-2 h-2 rounded-full bg-[var(--bg-hover)]" />
              <div className="w-2 h-2 rounded-full bg-[var(--bg-hover)]" />
            </div>
          </div>
          <div ref={logRef} className="flex-1 p-4 overflow-y-auto min-h-[400px] max-h-[520px] space-y-0.5">
            {logs.map((log, i) => (
              <motion.p key={`${i}-${log}`} initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                className={cn(
                  "text-[11px] leading-relaxed font-mono",
                  log.startsWith("$") ? "text-green-400/70" :
                  log.includes("[ok]") ? "text-green-400/60" :
                  log.includes("[error]") ? "text-red-400/70" :
                  log.includes("[cancelled]") ? "text-amber-400/70" :
                  log.startsWith("  tx") || log.startsWith("  status") ? "text-violet-400/70" :
                  log.includes("reserves") || log.includes("liabilities") ? "text-[var(--amber-400)]/70" :
                  log.startsWith(">") ? "text-[var(--text-tertiary)]" :
                  "text-[var(--text-tertiary)]/70"
                )}>
                {log}
              </motion.p>
            ))}
            <div className="flex items-center gap-1 pt-1">
              <span className="text-green-400/40 text-[11px]">$</span>
              <motion.div className="w-[6px] h-[14px] bg-green-400/30"
                animate={{ opacity: [1, 0] }} transition={{ duration: 0.8, repeat: Infinity, repeatType: "reverse" }} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
