"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { motion, useScroll, useMotionValueEvent, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/cn";
import { ConnectWallet } from "./connect-wallet";

const links = [
  { href: "/", label: "Home" },
  { href: "/dashboard", label: "Dashboard" },
  { href: "/prove", label: "Prove" },
  { href: "/explorer", label: "Explorer" },
];

export function Nav() {
  const pathname = usePathname();
  const { scrollY } = useScroll();
  const [scrolled, setScrolled] = useState(false);
  const [hidden, setHidden] = useState(false);
  const [lastY, setLastY] = useState(0);

  useMotionValueEvent(scrollY, "change", (latest) => {
    setScrolled(latest > 50);
    if (latest > lastY && latest > 150) setHidden(true);
    else setHidden(false);
    setLastY(latest);
  });

  return (
    <motion.header
      initial={{ y: -20, opacity: 0 }}
      animate={{ y: hidden ? -80 : 0, opacity: 1 }}
      transition={{ duration: 0.35, ease: [0.25, 0.46, 0.45, 0.94] }}
      className="fixed top-0 left-0 right-0 z-50 pointer-events-none"
    >
      <div className="flex justify-between items-center max-w-[1200px] mx-auto px-6 pt-4">
        {/* Left: wordmark */}
        <Link href="/" className="pointer-events-auto group flex items-center gap-3">
          <motion.div
            layout
            className={cn(
              "rounded-lg border flex items-center justify-center transition-all duration-500",
              scrolled
                ? "w-7 h-7 bg-[var(--amber-400)]/8 border-[var(--amber-400)]/12"
                : "w-8 h-8 bg-[var(--amber-400)]/6 border-[var(--amber-400)]/10"
            )}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" className="text-amber-400">
              <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </motion.div>
          <AnimatePresence>
            {!scrolled && (
              <motion.span
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -8 }}
                transition={{ duration: 0.25 }}
                className="text-[11px] font-bold tracking-[0.15em] text-[var(--text-primary)]"
              >
                SOLVA
              </motion.span>
            )}
          </AnimatePresence>
        </Link>

        {/* Center: nav links */}
        <motion.nav
          layout
          className={cn(
            "pointer-events-auto flex items-center rounded-full border transition-all duration-500",
            scrolled
              ? "gap-0 px-1 py-1 bg-[var(--bg-void)]/80 backdrop-blur-2xl border-[var(--border-subtle)] shadow-[0_4px_24px_rgba(0,0,0,0.5)]"
              : "gap-0.5 px-1.5 py-1 bg-transparent border-transparent"
          )}
        >
          {links.map((link) => {
            const isActive = pathname === link.href;
            return (
              <Link
                key={link.href}
                href={link.href}
                className={cn(
                  "relative rounded-full transition-all duration-300",
                  scrolled ? "px-3 py-1.5 text-[10px]" : "px-3.5 py-1.5 text-[11px]",
                  isActive
                    ? "text-[var(--text-primary)]"
                    : "text-[var(--text-tertiary)] hover:text-[var(--text-secondary)]"
                )}
              >
                {isActive && (
                  <motion.div
                    layoutId="nav-pill"
                    className={cn(
                      "absolute inset-0 rounded-full",
                      scrolled
                        ? "bg-[var(--bg-elevated)] border border-[var(--border-dim)]"
                        : "bg-[var(--bg-surface)]/60 border border-[var(--border-dim)]"
                    )}
                    transition={{ type: "spring", stiffness: 380, damping: 30 }}
                  />
                )}
                <span className="relative z-10">{link.label}</span>
              </Link>
            );
          })}
        </motion.nav>

        {/* Right: wallet + status */}
        <div className="pointer-events-auto flex items-center gap-3">
          <ConnectWallet compact={scrolled} />
          <div className="flex items-center gap-1.5">
            <div className="w-1.5 h-1.5 rounded-full bg-green-400 pulse-dot" />
            <AnimatePresence>
              {!scrolled && (
                <motion.span
                  initial={{ opacity: 0, x: 8 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 8 }}
                  transition={{ duration: 0.25 }}
                  className="text-[9px] text-[var(--text-tertiary)]"
                >
                  Sepolia
                </motion.span>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>
    </motion.header>
  );
}
