"use client";

import { useRef, useState, useCallback } from "react";
import { motion, useInView, AnimatePresence } from "framer-motion";
import {
  Shield,
  Landmark,
  ExternalLink,
  Loader2,
  RefreshCw,
  Lock,
  Unlock,
  CheckCircle2,
  XCircle,
  Copy,
  Check,
  ChevronRight,
  Terminal,
  ArrowRight,
  Wallet,
  ArrowDownToLine,
  ArrowUpFromLine,
} from "lucide-react";
import { cn } from "@/lib/cn";
import {
  CONTRACTS,
  NETWORK,
  DEPLOYER_ADDRESS,
  formatSats,
  truncateHash,
  timeAgo,
} from "@/lib/contracts";
import {
  useSolvencyInfo,
  useLendingState,
  useRegistryConfig,
  useUserLendingPosition,
  type SolvencyTier,
} from "@/lib/hooks";
import { useAccount, useSendTransaction } from "@starknet-react/core";

/* ─── scroll reveal ─── */
function R({
  children,
  delay = 0,
  className = "",
}: {
  children: React.ReactNode;
  delay?: number;
  className?: string;
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

/* ─── copy hook ─── */
function useCopy() {
  const [copied, setCopied] = useState(false);
  const copy = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };
  return { copied, copy };
}

/* ─── tier helpers ─── */
function tierLabel(tier: SolvencyTier): string {
  switch (tier) {
    case "TierA": return "TierA";
    case "TierB": return "TierB";
    case "TierC": return "TierC";
    default: return "None";
  }
}

function tierLtv(tier: SolvencyTier): number {
  switch (tier) {
    case "TierA": return 80;
    case "TierB": return 60;
    case "TierC": return 40;
    default: return 0;
  }
}

function tierColor(tier: SolvencyTier): string {
  switch (tier) {
    case "TierA": return "text-green-400";
    case "TierB": return "text-green-400/80";
    case "TierC": return "text-amber-400";
    default: return "text-red-400/60";
  }
}

function tierBg(tier: SolvencyTier): string {
  switch (tier) {
    case "TierA": return "bg-green-400/10 border-green-400/20";
    case "TierB": return "bg-green-400/5 border-green-400/15";
    case "TierC": return "bg-amber-400/10 border-amber-400/20";
    default: return "bg-red-400/10 border-red-400/20";
  }
}

/* ─── flow diagram ─── */
function FlowNode({ label, sub, icon: Icon, color, delay: d }: {
  label: string; sub: string; icon: React.ElementType; color: string; delay: number;
}) {
  return (
    <motion.div className="flex flex-col items-center gap-1.5"
      initial={{ opacity: 0, y: 12 }} whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }} transition={{ delay: d, duration: 0.4 }}>
      <div className="w-9 h-9 rounded-lg border bg-[var(--bg-surface)] border-[var(--border-subtle)] flex items-center justify-center">
        <Icon className={cn("w-3.5 h-3.5", color)} />
      </div>
      <span className="text-[9px] text-[var(--text-secondary)] text-center leading-tight">{label}</span>
      <span className="text-[8px] text-[var(--text-tertiary)] text-center leading-tight">{sub}</span>
    </motion.div>
  );
}

function FlowArrow({ delay: d }: { delay: number }) {
  return (
    <motion.div className="flex items-center pt-1"
      initial={{ opacity: 0, scaleX: 0 }} whileInView={{ opacity: 1, scaleX: 1 }}
      viewport={{ once: true }} transition={{ delay: d, duration: 0.25 }}>
      <div className="w-8 h-px bg-gradient-to-r from-[var(--border-subtle)] to-[var(--border-dim)]" />
      <ChevronRight className="w-2.5 h-2.5 text-[var(--text-tertiary)] -ml-1" />
    </motion.div>
  );
}

/* ═══════════════════════════════════════════════════════════ */
export default function LendingPage() {
  const { address, isConnected } = useAccount();
  const { sendAsync } = useSendTransaction({});

  // Query the connected wallet's solvency info (they submitted the proof from this address)
  const queryAddress = address || DEPLOYER_ADDRESS;
  const {
    data: solvencyInfo,
    loading: solvencyLoading,
    refetch: refetchSolvency,
  } = useSolvencyInfo(queryAddress);
  const { maxLtv, poolBalance, loading: lendingLoading } = useLendingState();
  const { verifierAddress, maxProofAge, loading: configLoading } = useRegistryConfig();
  const {
    deposit: userDeposit,
    borrow: userBorrow,
    loading: positionLoading,
    refetch: refetchPosition,
  } = useUserLendingPosition(address);

  // Deposit state
  const [depositAmount, setDepositAmount] = useState("1000");
  const [depositing, setDepositing] = useState(false);
  const [depositTxHash, setDepositTxHash] = useState<string | null>(null);

  // Borrow state
  const [borrowAmount, setBorrowAmount] = useState("500");
  const [borrowing, setBorrowing] = useState(false);
  const [borrowTxHash, setBorrowTxHash] = useState<string | null>(null);

  // Error / tx log
  const [logs, setLogs] = useState<{ text: string; color: string }[]>([]);
  const [txError, setTxError] = useState<string | null>(null);

  const logsEndRef = useRef<HTMLDivElement>(null);

  const addLog = useCallback((text: string, color = "text-[var(--text-secondary)]") => {
    setLogs((prev) => [...prev, { text, color }]);
    setTimeout(() => logsEndRef.current?.scrollIntoView({ behavior: "smooth" }), 50);
  }, []);

  const gateOpen = solvencyInfo?.isValid === true && solvencyInfo.tier !== "None";
  const currentTier = solvencyInfo?.tier ?? "None";
  const currentLtv = tierLtv(currentTier);

  const { copied: copiedRegistry, copy: copyRegistry } = useCopy();
  const { copied: copiedLending, copy: copyLending } = useCopy();

  // ─── Deposit handler ───
  const handleDeposit = async () => {
    if (!isConnected || !address) return;
    const amount = parseInt(depositAmount);
    if (!amount || amount <= 0) return;

    setDepositing(true);
    setTxError(null);
    setDepositTxHash(null);
    setLogs([]);

    addLog(`> lending.deposit(${amount})`, "text-[var(--text-primary)]");
    addLog(`  contract: ${truncateHash(CONTRACTS.lending.address, 8)}`, "text-[var(--text-tertiary)]");
    addLog(`  sender:   ${truncateHash(address, 8)}`, "text-[var(--text-tertiary)]");
    addLog("  requesting wallet signature...", "text-violet-400/80");

    try {
      const result = await sendAsync([
        {
          contractAddress: CONTRACTS.lending.address,
          entrypoint: "deposit",
          calldata: [amount.toString(), "0"], // u256: low, high
        },
      ]);

      const hash = result.transaction_hash;
      setDepositTxHash(hash);
      addLog(`  tx submitted: ${truncateHash(hash, 10)}`, "text-amber-400");
      addLog("  waiting for L2 acceptance...", "text-[var(--text-tertiary)]");

      // Poll for acceptance
      const { RpcProvider } = await import("starknet");
      const provider = new RpcProvider({ nodeUrl: NETWORK.rpc });
      let accepted = false;
      for (let i = 0; i < 30; i++) {
        await new Promise((r) => setTimeout(r, 3000));
        try {
          const receipt = await provider.getTransactionReceipt(hash);
          if (receipt && (receipt as any).execution_status === "SUCCEEDED") {
            accepted = true;
            break;
          }
          if (receipt && (receipt as any).execution_status === "REVERTED") {
            addLog(`  REVERTED: ${(receipt as any).revert_reason || "unknown"}`, "text-red-400");
            setTxError("Transaction reverted");
            setDepositing(false);
            return;
          }
        } catch {
          // not yet
        }
      }

      if (accepted) {
        addLog(`  ACCEPTED on L2`, "text-green-400");
        addLog(`  deposited ${amount} units into pool`, "text-green-400");
        refetchPosition();
      } else {
        addLog(`  tx pending (check Voyager)`, "text-amber-400");
      }
    } catch (e: any) {
      const msg = e?.message || "Transaction rejected";
      addLog(`  ERROR: ${msg.slice(0, 100)}`, "text-red-400");
      setTxError(msg.slice(0, 100));
    } finally {
      setDepositing(false);
    }
  };

  // ─── Borrow handler ───
  const handleBorrow = async () => {
    if (!isConnected || !address) return;
    const amount = parseInt(borrowAmount);
    if (!amount || amount <= 0) return;

    setBorrowing(true);
    setTxError(null);
    setBorrowTxHash(null);
    setLogs([]);

    addLog(`> lending.borrow(${amount})`, "text-[var(--text-primary)]");
    addLog(`  contract: ${truncateHash(CONTRACTS.lending.address, 8)}`, "text-[var(--text-tertiary)]");
    addLog(`  sender:   ${truncateHash(address, 8)}`, "text-[var(--text-tertiary)]");
    addLog("");
    addLog("  step 1: registry.is_solvent(caller)", "text-[var(--text-secondary)]");

    if (gateOpen) {
      addLog(`          -> true`, "text-green-400/80");
      addLog("  step 2: registry.get_solvency_info()", "text-[var(--text-secondary)]");
      addLog(`          -> tier: ${tierLabel(currentTier)} | LTV: ${currentLtv}%`, tierColor(currentTier));
      addLog(`  step 3: check max_borrow = deposit(${userDeposit.toString()}) * ${currentLtv}/100`, "text-[var(--text-secondary)]");
    } else {
      addLog(`          -> false`, "text-red-400/80");
      addLog("  borrow will revert: no valid solvency proof", "text-red-400");
    }

    addLog("");
    addLog("  requesting wallet signature...", "text-violet-400/80");

    try {
      const result = await sendAsync([
        {
          contractAddress: CONTRACTS.lending.address,
          entrypoint: "borrow",
          calldata: [amount.toString(), "0"], // u256: low, high
        },
      ]);

      const hash = result.transaction_hash;
      setBorrowTxHash(hash);
      addLog(`  tx submitted: ${truncateHash(hash, 10)}`, "text-amber-400");
      addLog("  waiting for L2 acceptance...", "text-[var(--text-tertiary)]");

      const { RpcProvider } = await import("starknet");
      const provider = new RpcProvider({ nodeUrl: NETWORK.rpc });
      let accepted = false;
      for (let i = 0; i < 30; i++) {
        await new Promise((r) => setTimeout(r, 3000));
        try {
          const receipt = await provider.getTransactionReceipt(hash);
          if (receipt && (receipt as any).execution_status === "SUCCEEDED") {
            accepted = true;
            break;
          }
          if (receipt && (receipt as any).execution_status === "REVERTED") {
            const reason = (receipt as any).revert_reason || "unknown";
            addLog(`  REVERTED: ${reason}`, "text-red-400");
            if (reason.includes("not solvent")) {
              addLog("  -> solvency gate blocked this borrow", "text-red-400");
            } else if (reason.includes("LTV")) {
              addLog("  -> borrow exceeds tier-based LTV limit", "text-red-400");
            } else if (reason.includes("stale")) {
              addLog("  -> solvency proof expired (>24h)", "text-red-400");
            }
            setTxError(`Reverted: ${reason}`);
            setBorrowing(false);
            return;
          }
        } catch {
          // not yet
        }
      }

      if (accepted) {
        addLog(`  ACCEPTED on L2`, "text-green-400");
        addLog(`  borrowed ${amount} units | solvency-gated via registry`, "text-green-400");
        refetchPosition();
      } else {
        addLog(`  tx pending (check Voyager)`, "text-amber-400");
      }
    } catch (e: any) {
      const msg = e?.message || "Transaction rejected";
      addLog(`  ERROR: ${msg.slice(0, 100)}`, "text-red-400");
      setTxError(msg.slice(0, 100));
    } finally {
      setBorrowing(false);
    }
  };

  const refreshAll = () => {
    refetchSolvency();
    refetchPosition();
  };

  const busy = depositing || borrowing;

  return (
    <div className="max-w-[1200px] mx-auto px-6 py-10">
      {/* ── Header ── */}
      <R>
        <div className="flex items-end justify-between mb-10">
          <div>
            <p className="label-mono mb-2">Lending</p>
            <h1 className="heading-serif text-[32px] text-[var(--text-primary)] leading-tight mb-1">
              Solvency-Gated Lending
            </h1>
            <p className="text-[11px] text-[var(--text-tertiary)] max-w-md leading-relaxed">
              Deposit collateral, borrow against it. Every borrow calls the SolvencyRegistry on-chain.
              No valid ZK proof = transaction reverts.
            </p>
          </div>
          <button
            onClick={refreshAll}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[10px] text-[var(--text-tertiary)] hover:text-[var(--text-secondary)] border border-[var(--border-dim)] hover:border-[var(--border-subtle)] transition-all"
          >
            <RefreshCw className={cn("w-3 h-3", solvencyLoading && "animate-spin")} />
            Refresh
          </button>
        </div>
      </R>

      {/* ── Row 1: Solvency Gate Status ── */}
      <R delay={0.03}>
        <div className={cn(
          "cell cell-glow cell-pad mb-3 noise relative overflow-hidden",
          gateOpen ? "border-green-400/15" : "border-red-400/15"
        )}>
          {gateOpen && (
            <div className="absolute top-0 right-0 w-40 h-40 bg-green-400/[0.02] rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 pointer-events-none" />
          )}

          <div className="flex items-center gap-3 mb-4">
            {solvencyLoading ? (
              <Loader2 className="w-4 h-4 text-[var(--text-tertiary)] animate-spin" />
            ) : gateOpen ? (
              <Unlock className="w-4 h-4 text-green-400" />
            ) : (
              <Lock className="w-4 h-4 text-red-400/80" />
            )}
            <span className={cn(
              "text-[12px] font-bold tracking-wider uppercase",
              solvencyLoading ? "text-[var(--text-tertiary)]" : gateOpen ? "text-green-400" : "text-red-400/80"
            )}>
              {solvencyLoading ? "Querying registry..." : gateOpen ? "Solvency Gate: Open" : "Solvency Gate: Closed"}
            </span>
            {!solvencyLoading && (
              <span className={cn(
                "text-[8px] px-1.5 py-0.5 rounded border ml-auto",
                gateOpen ? "bg-green-400/10 text-green-400 border-green-400/15" : "bg-red-400/10 text-red-400/80 border-red-400/15"
              )}>
                {gateOpen ? "BORROWS ENABLED" : "BORROWS BLOCKED"}
              </span>
            )}
          </div>

          {!solvencyLoading && (
            <div className="grid grid-cols-4 gap-4 text-[11px]">
              <div>
                <p className="text-[8px] text-[var(--text-tertiary)] uppercase tracking-wider mb-0.5">Current Tier</p>
                <p className={cn("font-bold", tierColor(currentTier))}>{gateOpen ? tierLabel(currentTier) : "None"}</p>
              </div>
              <div>
                <p className="text-[8px] text-[var(--text-tertiary)] uppercase tracking-wider mb-0.5">Max LTV</p>
                <p className={cn("tabular-nums font-bold", gateOpen ? "text-[var(--text-primary)]" : "text-[var(--text-tertiary)]")}>
                  {gateOpen ? `${currentLtv}%` : "0%"}
                </p>
              </div>
              <div>
                <p className="text-[8px] text-[var(--text-tertiary)] uppercase tracking-wider mb-0.5">Proof Age</p>
                <p className="text-[var(--text-secondary)] tabular-nums">
                  {solvencyInfo && solvencyInfo.lastProofTime > 0 ? timeAgo(solvencyInfo.lastProofTime * 1000) : "---"}
                </p>
              </div>
              <div>
                <p className="text-[8px] text-[var(--text-tertiary)] uppercase tracking-wider mb-0.5">Merkle Root</p>
                <p className="text-[var(--text-secondary)] tabular-nums">
                  {solvencyInfo ? truncateHash(solvencyInfo.merkleRoot, 8) : "---"}
                </p>
              </div>
            </div>
          )}
        </div>
      </R>

      {/* ── Row 2: Deposit + Borrow + Position ── */}
      <div className="grid grid-cols-12 gap-3 mb-3">
        {/* Left: Deposit & Borrow actions */}
        <R delay={0.06} className="col-span-12 md:col-span-7">
          <div className="cell cell-pad noise h-full flex flex-col">
            {/* Wallet check */}
            {!isConnected && (
              <div className="flex items-center gap-2 px-3 py-2.5 rounded-lg bg-amber-400/5 border border-amber-400/10 mb-4">
                <Wallet className="w-3.5 h-3.5 text-amber-400" />
                <span className="text-[10px] text-amber-400">Connect your wallet to deposit and borrow</span>
              </div>
            )}

            {/* Deposit section */}
            <div className="mb-5">
              <div className="flex items-center gap-2 mb-3">
                <ArrowDownToLine className="w-3 h-3 text-green-400" />
                <p className="text-[11px] font-semibold text-[var(--text-primary)]">Deposit Collateral</p>
              </div>
              <div className="flex gap-2">
                <input
                  type="number"
                  min={0}
                  value={depositAmount}
                  onChange={(e) => setDepositAmount(e.target.value)}
                  disabled={busy}
                  placeholder="Amount"
                  className="flex-1 px-3 py-2 rounded-lg bg-[var(--bg-void)] border border-[var(--border-dim)] text-[12px] text-[var(--text-primary)] tabular-nums focus:outline-none focus:border-[var(--border-subtle)] transition-colors disabled:opacity-40"
                />
                <button
                  onClick={handleDeposit}
                  disabled={busy || !isConnected || !depositAmount}
                  className={cn(
                    "px-4 py-2 rounded-lg text-[11px] font-semibold border transition-all",
                    "bg-green-400/10 border-green-400/20 text-green-400 hover:bg-green-400/15",
                    "disabled:opacity-30 disabled:cursor-not-allowed"
                  )}
                >
                  {depositing ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : "Deposit"}
                </button>
              </div>
              {depositTxHash && (
                <a href={`${NETWORK.explorer}/tx/${depositTxHash}`} target="_blank" rel="noopener noreferrer"
                  className="flex items-center gap-1 mt-1.5 text-[9px] text-green-400/60 hover:text-green-400 transition-colors">
                  <ExternalLink className="w-2.5 h-2.5" />
                  {truncateHash(depositTxHash, 8)}
                </a>
              )}
            </div>

            {/* Divider */}
            <div className="divider mb-5" />

            {/* Borrow section */}
            <div className="mb-4">
              <div className="flex items-center gap-2 mb-1">
                <ArrowUpFromLine className="w-3 h-3 text-violet-400" />
                <p className="text-[11px] font-semibold text-[var(--text-primary)]">Borrow (Solvency-Gated)</p>
              </div>
              <p className="text-[9px] text-[var(--text-tertiary)] mb-3 leading-relaxed">
                Calls <code className="text-violet-400/70">registry.is_solvent()</code> on-chain.
                Reverts if no valid ZK proof exists.
              </p>
              <div className="flex gap-2">
                <input
                  type="number"
                  min={0}
                  value={borrowAmount}
                  onChange={(e) => setBorrowAmount(e.target.value)}
                  disabled={busy}
                  placeholder="Amount"
                  className="flex-1 px-3 py-2 rounded-lg bg-[var(--bg-void)] border border-[var(--border-dim)] text-[12px] text-[var(--text-primary)] tabular-nums focus:outline-none focus:border-[var(--border-subtle)] transition-colors disabled:opacity-40"
                />
                <button
                  onClick={handleBorrow}
                  disabled={busy || !isConnected || !borrowAmount}
                  className={cn(
                    "px-4 py-2 rounded-lg text-[11px] font-semibold border transition-all",
                    gateOpen
                      ? "bg-violet-400/10 border-violet-400/20 text-violet-400 hover:bg-violet-400/15"
                      : "bg-red-400/10 border-red-400/20 text-red-400/80 hover:bg-red-400/15",
                    "disabled:opacity-30 disabled:cursor-not-allowed"
                  )}
                >
                  {borrowing ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : "Borrow"}
                </button>
              </div>
              {borrowTxHash && (
                <a href={`${NETWORK.explorer}/tx/${borrowTxHash}`} target="_blank" rel="noopener noreferrer"
                  className="flex items-center gap-1 mt-1.5 text-[9px] text-violet-400/60 hover:text-violet-400 transition-colors">
                  <ExternalLink className="w-2.5 h-2.5" />
                  {truncateHash(borrowTxHash, 8)}
                </a>
              )}
            </div>

            {/* Transaction log / terminal */}
            <AnimatePresence>
              {logs.length > 0 && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  className="mt-auto rounded-lg bg-[var(--bg-void)] border border-[var(--border-dim)] overflow-hidden"
                >
                  <div className="flex items-center gap-1.5 px-3 py-2 border-b border-[var(--border-dim)]">
                    <Terminal className="w-3 h-3 text-[var(--text-tertiary)]" />
                    <span className="text-[8px] text-[var(--text-tertiary)]">transaction trace</span>
                    {busy && <Loader2 className="w-2.5 h-2.5 text-violet-400 animate-spin ml-auto" />}
                  </div>
                  <div className="p-3 max-h-[240px] overflow-y-auto">
                    {logs.map((line, i) => (
                      <motion.p
                        key={i}
                        initial={{ opacity: 0, x: -4 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: i * 0.03, duration: 0.15 }}
                        className={cn("text-[10px] font-mono leading-relaxed whitespace-pre", line.color)}
                      >
                        {line.text}
                      </motion.p>
                    ))}
                    <div ref={logsEndRef} />
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {txError && (
              <div className="mt-2 px-3 py-2 rounded-lg bg-red-400/5 border border-red-400/10">
                <p className="text-[9px] text-red-400/80">{txError}</p>
              </div>
            )}
          </div>
        </R>

        {/* Right: Position + Tier System */}
        <R delay={0.1} className="col-span-12 md:col-span-5">
          <div className="space-y-3 h-full flex flex-col">
            {/* Your Position */}
            <div className="cell cell-glow cell-pad noise">
              <div className="flex items-center gap-2 mb-4">
                <Wallet className="w-3 h-3 text-amber-400" />
                <p className="label-mono">Your Position</p>
                {positionLoading && <Loader2 className="w-3 h-3 text-[var(--text-tertiary)] animate-spin ml-auto" />}
              </div>

              {!isConnected ? (
                <p className="text-[10px] text-[var(--text-tertiary)]">Connect wallet to view</p>
              ) : (
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] text-[var(--text-tertiary)]">Deposited</span>
                    <span className="text-[12px] font-bold text-green-400 tabular-nums">{userDeposit.toString()}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] text-[var(--text-tertiary)]">Borrowed</span>
                    <span className="text-[12px] font-bold text-violet-400 tabular-nums">{userBorrow.toString()}</span>
                  </div>
                  <div className="divider" />
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] text-[var(--text-tertiary)]">Max Borrow ({currentLtv}% LTV)</span>
                    <span className="text-[11px] text-[var(--text-primary)] tabular-nums font-semibold">
                      {(Number(userDeposit) * currentLtv / 100).toFixed(0)}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] text-[var(--text-tertiary)]">Remaining Capacity</span>
                    <span className="text-[11px] text-[var(--text-secondary)] tabular-nums">
                      {Math.max(0, Number(userDeposit) * currentLtv / 100 - Number(userBorrow)).toFixed(0)}
                    </span>
                  </div>
                </div>
              )}
            </div>

            {/* Tier System */}
            <div className="cell cell-pad noise flex-1">
              <div className="flex items-center gap-2 mb-4">
                <Shield className="w-3 h-3 text-amber-400" />
                <p className="label-mono">Tier System</p>
              </div>
              <div className="space-y-2.5">
                {([
                  { tier: "TierA" as SolvencyTier, ratio: ">= 120%", ltv: 80, barW: "100%", barColor: "bg-green-400" },
                  { tier: "TierB" as SolvencyTier, ratio: ">= 110%", ltv: 60, barW: "75%", barColor: "bg-green-400/60" },
                  { tier: "TierC" as SolvencyTier, ratio: ">= 100%", ltv: 40, barW: "50%", barColor: "bg-amber-400" },
                  { tier: "None" as SolvencyTier, ratio: "< 100%", ltv: 0, barW: "0%", barColor: "bg-red-400/40" },
                ]).map((t, i) => {
                  const isActive = currentTier === t.tier;
                  return (
                    <div
                      key={t.tier}
                      className={cn(
                        "rounded-lg border px-3 py-2 transition-all",
                        isActive ? tierBg(t.tier) : "border-transparent"
                      )}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <div className="flex items-center gap-2">
                          {isActive && <div className={cn("w-1.5 h-1.5 rounded-full", t.barColor)} />}
                          <span className={cn("text-[10px] font-semibold", isActive ? tierColor(t.tier) : "text-[var(--text-tertiary)]")}>
                            {tierLabel(t.tier)}
                          </span>
                          {isActive && (
                            <span className="text-[7px] px-1 py-px rounded bg-[var(--bg-void)] border border-[var(--border-dim)] text-[var(--text-tertiary)]">
                              ACTIVE
                            </span>
                          )}
                        </div>
                        <span className={cn("text-[9px] tabular-nums", isActive ? "text-[var(--text-primary)]" : "text-[var(--text-tertiary)]")}>
                          {t.ltv}% LTV
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="flex-1 h-1 rounded-full bg-[var(--bg-void)] overflow-hidden">
                          <motion.div
                            className={cn("h-full rounded-full", isActive ? t.barColor : `${t.barColor} opacity-20`)}
                            initial={{ width: 0 }}
                            whileInView={{ width: t.barW }}
                            viewport={{ once: true }}
                            transition={{ delay: 0.3 + i * 0.1, duration: 0.6, ease: "easeOut" }}
                          />
                        </div>
                        <span className="text-[8px] text-[var(--text-tertiary)] w-14 text-right shrink-0 tabular-nums">{t.ratio}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </R>
      </div>

      {/* ── Row 3: Contract Flow Diagram ── */}
      <R delay={0.14}>
        <div className="cell cell-pad noise mb-3">
          <div className="flex items-center gap-2 mb-5">
            <ArrowRight className="w-3 h-3 text-violet-400" />
            <p className="label-mono">On-Chain Call Flow</p>
          </div>
          <div className="flex items-start justify-center gap-0 overflow-x-auto py-2">
            <FlowNode label="Your Wallet" sub="caller" icon={Wallet} color="text-[var(--text-secondary)]" delay={0} />
            <FlowArrow delay={0.1} />
            <FlowNode label="LendingProtocol" sub=".borrow()" icon={Landmark} color="text-green-400" delay={0.15} />
            <FlowArrow delay={0.25} />
            <FlowNode label="Registry" sub=".is_solvent()" icon={Shield} color="text-amber-400" delay={0.3} />
            <FlowArrow delay={0.4} />
            <FlowNode label="Registry" sub=".get_solvency_info()" icon={Shield} color="text-amber-400" delay={0.45} />
            <FlowArrow delay={0.55} />
            <FlowNode label="Tier Check" sub="compute LTV" icon={Lock} color="text-violet-400" delay={0.6} />
            <FlowArrow delay={0.7} />
            <FlowNode
              label={gateOpen ? "Approved" : "Reverted"}
              sub={gateOpen ? "disburse" : "blocked"}
              icon={gateOpen ? CheckCircle2 : XCircle}
              color={gateOpen ? "text-green-400" : "text-red-400/80"}
              delay={0.75}
            />
          </div>
        </div>
      </R>

      {/* ── Row 4: Live Contract State ── */}
      <div className="grid grid-cols-12 gap-3">
        <R delay={0.18} className="col-span-12 md:col-span-6">
          <div className="cell cell-pad noise h-full">
            <div className="flex items-center gap-2 mb-4">
              <Shield className="w-3 h-3 text-amber-400" />
              <p className="label-mono">Registry State</p>
            </div>
            <div className="space-y-2.5">
              <div className="flex items-center justify-between text-[10px]">
                <span className="text-[var(--text-tertiary)]">Verifier</span>
                <span className="text-[var(--text-secondary)] tabular-nums">
                  {configLoading ? "..." : verifierAddress ? truncateHash(verifierAddress, 6) : "---"}
                </span>
              </div>
              <div className="flex items-center justify-between text-[10px]">
                <span className="text-[var(--text-tertiary)]">Max Proof Age</span>
                <span className="text-[var(--text-secondary)] tabular-nums">
                  {configLoading ? "..." : maxProofAge ? `${(maxProofAge / 3600).toFixed(0)}h` : "---"}
                </span>
              </div>
              <div className="flex items-center justify-between text-[10px]">
                <span className="text-[var(--text-tertiary)]">Checked Address</span>
                <div className="flex items-center gap-1.5">
                  <span className="text-[var(--text-secondary)] tabular-nums">{address ? truncateHash(address, 6) : "not connected"}</span>
                  {address && <button onClick={() => copyRegistry(address)}>
                    {copiedRegistry ? <Check className="w-2.5 h-2.5 text-green-400" /> : <Copy className="w-2.5 h-2.5 text-[var(--text-tertiary)]" />}
                  </button>}
                </div>
              </div>
              <div className="flex items-center justify-between text-[10px]">
                <span className="text-[var(--text-tertiary)]">Is Solvent</span>
                <span className={cn("font-semibold", gateOpen ? "text-green-400" : "text-red-400/80")}>
                  {solvencyLoading ? "..." : gateOpen ? "true" : "false"}
                </span>
              </div>
              <div className="flex items-center justify-between text-[10px]">
                <span className="text-[var(--text-tertiary)]">Liabilities</span>
                <span className="text-[var(--text-secondary)] tabular-nums">
                  {solvencyInfo ? formatSats(Number(solvencyInfo.totalLiabilities)) : "---"}
                </span>
              </div>
            </div>
          </div>
        </R>

        <R delay={0.22} className="col-span-12 md:col-span-6">
          <div className="cell cell-pad noise h-full">
            <div className="flex items-center gap-2 mb-4">
              <Landmark className="w-3 h-3 text-green-400" />
              <p className="label-mono">Lending Protocol</p>
            </div>
            <div className="space-y-2.5">
              <div className="flex items-center justify-between text-[10px]">
                <span className="text-[var(--text-tertiary)]">Contract</span>
                <div className="flex items-center gap-1.5">
                  <span className="text-[var(--text-secondary)] tabular-nums">{truncateHash(CONTRACTS.lending.address, 6)}</span>
                  <button onClick={() => copyLending(CONTRACTS.lending.address)}>
                    {copiedLending ? <Check className="w-2.5 h-2.5 text-green-400" /> : <Copy className="w-2.5 h-2.5 text-[var(--text-tertiary)]" />}
                  </button>
                  <a href={`${NETWORK.explorer}/contract/${CONTRACTS.lending.address}`} target="_blank" rel="noopener noreferrer">
                    <ExternalLink className="w-2.5 h-2.5 text-[var(--text-tertiary)] hover:text-[var(--text-secondary)]" />
                  </a>
                </div>
              </div>
              <div className="flex items-center justify-between text-[10px]">
                <span className="text-[var(--text-tertiary)]">Pool Balance</span>
                <span className="text-[var(--text-secondary)] tabular-nums">
                  {lendingLoading ? "..." : poolBalance !== null ? poolBalance.toString() : "---"}
                </span>
              </div>
              <div className="flex items-center justify-between text-[10px]">
                <span className="text-[var(--text-tertiary)]">Current Max LTV</span>
                <span className="text-[var(--text-secondary)] tabular-nums">
                  {lendingLoading ? "..." : maxLtv !== null ? `${maxLtv}%` : "---"}
                </span>
              </div>
              <div className="flex items-center justify-between text-[10px]">
                <span className="text-[var(--text-tertiary)]">Network</span>
                <span className="text-[var(--text-secondary)]">{NETWORK.name}</span>
              </div>
              <div className="divider my-1" />
              <a
                href={`${NETWORK.explorer}/contract/${CONTRACTS.lending.address}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center gap-1.5 w-full py-2 rounded-lg text-[10px] text-[var(--text-tertiary)] hover:text-[var(--text-secondary)] border border-[var(--border-dim)] hover:border-[var(--border-subtle)] transition-all"
              >
                View on Voyager
                <ExternalLink className="w-2.5 h-2.5" />
              </a>
            </div>
          </div>
        </R>
      </div>
    </div>
  );
}
