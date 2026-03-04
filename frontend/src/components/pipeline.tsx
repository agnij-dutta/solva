"use client";

import { motion } from "framer-motion";
import { Bitcoin, GitBranch, Lock, ShieldCheck, Landmark } from "lucide-react";

const stages = [
  { icon: Bitcoin, label: "BTC UTXOs", color: "text-[var(--amber-400)]", glow: "bg-[var(--amber-400)]" },
  { icon: GitBranch, label: "Merkle Tree", color: "text-[var(--amber-400)]/60", glow: "bg-[var(--amber-400)]" },
  { icon: Lock, label: "ZK Proof", color: "text-violet-400", glow: "bg-violet-400" },
  { icon: ShieldCheck, label: "Verify", color: "text-violet-400/60", glow: "bg-violet-400" },
  { icon: Landmark, label: "Lending", color: "text-green-400", glow: "bg-green-400" },
];

export function Pipeline() {
  return (
    <div className="flex items-center justify-center gap-0 w-full py-2">
      {stages.map((stage, i) => {
        const Icon = stage.icon;
        return (
          <motion.div
            key={stage.label}
            className="flex items-center"
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1, duration: 0.4, ease: "easeOut" }}
          >
            <div className="flex flex-col items-center gap-2 px-5 py-4">
              <div className="w-10 h-10 rounded-xl bg-[var(--bg-surface)] border border-[var(--border-dim)] flex items-center justify-center relative">
                <Icon className={`w-4.5 h-4.5 ${stage.color}`} />
                <div className={`absolute -bottom-0.5 left-1/2 -translate-x-1/2 w-3 h-[2px] rounded-full ${stage.glow} opacity-20 blur-sm`} />
              </div>
              <span className="text-[10px] text-[var(--text-secondary)]">{stage.label}</span>
            </div>
            {i < stages.length - 1 && (
              <motion.div
                className="flex items-center"
                initial={{ opacity: 0, scaleX: 0 }}
                animate={{ opacity: 1, scaleX: 1 }}
                transition={{ delay: i * 0.1 + 0.25, duration: 0.25 }}
              >
                <div className="w-10 h-px bg-gradient-to-r from-[var(--border-subtle)] to-[var(--border-dim)]" />
              </motion.div>
            )}
          </motion.div>
        );
      })}
    </div>
  );
}
