"use client";

import { useState, useEffect, useCallback } from "react";
import { useAccount, useConnect, useDisconnect } from "@starknet-react/core";
import { motion, AnimatePresence } from "framer-motion";
import { Wallet, LogOut, Copy, Check, ExternalLink, Download, Loader2 } from "lucide-react";
import { cn } from "@/lib/cn";
import { NETWORK } from "@/lib/contracts";

const INSTALL_URLS: Record<string, string> = {
  argentX: "https://www.argent.xyz/argent-x/",
  braavos: "https://braavos.app/download-braavos-wallet/",
  argent: "https://www.argent.xyz/argent-x/",
};

function getInstallUrl(connectorId: string): string {
  const id = connectorId.toLowerCase();
  if (id.includes("argent")) return INSTALL_URLS.argentX;
  if (id.includes("braavos")) return INSTALL_URLS.braavos;
  return "#";
}

function truncAddr(addr: string) {
  if (!addr) return "";
  return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
}

export function ConnectWallet({ compact = false }: { compact?: boolean }) {
  const { address, isConnected, isConnecting, isReconnecting, status } = useAccount();
  const { connect, connectors, pendingConnector, error: connectError, isPending: isConnectPending } = useConnect();
  const { disconnect } = useDisconnect();
  const [showMenu, setShowMenu] = useState(false);
  const [copied, setCopied] = useState(false);
  const [availability, setAvailability] = useState<Record<string, boolean>>({});

  // Check which connectors are installed
  useEffect(() => {
    const check: Record<string, boolean> = {};
    for (const c of connectors) {
      try { check[c.id] = c.available(); } catch { check[c.id] = false; }
    }
    setAvailability(check);
  }, [connectors]);

  // Close menu when connected
  useEffect(() => {
    if (isConnected && address) {
      setShowMenu(false);
    }
  }, [isConnected, address]);

  // Close on click outside
  useEffect(() => {
    if (!showMenu) return;
    const handler = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (!target.closest("[data-wallet-menu]")) setShowMenu(false);
    };
    // Delay to prevent immediate close
    const timer = setTimeout(() => document.addEventListener("click", handler), 50);
    return () => { clearTimeout(timer); document.removeEventListener("click", handler); };
  }, [showMenu]);

  const copyAddress = () => {
    if (address) {
      navigator.clipboard.writeText(address);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    }
  };

  const handleConnect = useCallback((connector: any) => {
    connect({ connector });
    // Don't close menu — let it close automatically when isConnected becomes true
  }, [connect]);

  const busy = isConnecting || isReconnecting || isConnectPending;

  // ── Connected state ──
  if (isConnected && address) {
    return (
      <div className="relative" data-wallet-menu>
        <button
          onClick={() => setShowMenu(!showMenu)}
          className={cn(
            "flex items-center gap-2 rounded-lg border border-green-400/15 bg-green-400/5 hover:bg-green-400/8 transition-all",
            compact ? "px-2 py-1 text-[9px]" : "px-3 py-1.5 text-[10px]"
          )}
        >
          <div className="w-1.5 h-1.5 rounded-full bg-green-400 pulse-dot" />
          <span className="text-green-400 tabular-nums font-medium">{truncAddr(address)}</span>
        </button>

        <AnimatePresence>
          {showMenu && (
            <motion.div
              initial={{ opacity: 0, y: 4, scale: 0.97 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 4, scale: 0.97 }}
              transition={{ duration: 0.15 }}
              className="absolute right-0 top-full mt-2 w-52 rounded-xl bg-[var(--bg-surface)] border border-[var(--border-dim)] shadow-xl overflow-hidden z-50"
            >
              <div className="px-3 py-2.5 border-b border-[var(--border-dim)]">
                <p className="text-[9px] text-green-400/60 mb-0.5">Connected</p>
                <p className="text-[10px] text-[var(--text-primary)] tabular-nums">{truncAddr(address)}</p>
              </div>
              <div className="py-1">
                <button onClick={copyAddress}
                  className="w-full flex items-center gap-2 px-3 py-2 text-[10px] text-[var(--text-secondary)] hover:bg-[var(--bg-hover)] transition-colors">
                  {copied ? <Check className="w-3 h-3 text-green-400" /> : <Copy className="w-3 h-3" />}
                  {copied ? "Copied" : "Copy Address"}
                </button>
                <a href={`${NETWORK.explorer}/contract/${address}`} target="_blank" rel="noopener noreferrer"
                  className="w-full flex items-center gap-2 px-3 py-2 text-[10px] text-[var(--text-secondary)] hover:bg-[var(--bg-hover)] transition-colors">
                  <ExternalLink className="w-3 h-3" />
                  View on Voyager
                </a>
                <button onClick={() => { disconnect(); setShowMenu(false); }}
                  className="w-full flex items-center gap-2 px-3 py-2 text-[10px] text-red-400/70 hover:bg-[var(--bg-hover)] transition-colors">
                  <LogOut className="w-3 h-3" />
                  Disconnect
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    );
  }

  // ── Disconnected / connecting state ──
  return (
    <div className="relative" data-wallet-menu>
      <button
        onClick={() => setShowMenu(!showMenu)}
        className={cn(
          "flex items-center gap-2 rounded-lg border transition-all",
          busy
            ? "border-violet-400/15 bg-violet-400/8 text-violet-400"
            : "border-[var(--amber-400)]/15 bg-[var(--amber-400)]/8 text-[var(--amber-400)] hover:bg-[var(--amber-400)]/12",
          compact ? "px-2 py-1 text-[9px]" : "px-3 py-1.5 text-[10px]"
        )}
      >
        {busy ? (
          <Loader2 className="w-3 h-3 animate-spin" />
        ) : (
          <Wallet className="w-3 h-3" />
        )}
        <span className="font-semibold">{busy ? "Connecting..." : "Connect"}</span>
      </button>

      <AnimatePresence>
        {showMenu && (
          <motion.div
            initial={{ opacity: 0, y: 4, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 4, scale: 0.97 }}
            transition={{ duration: 0.15 }}
            className="absolute right-0 top-full mt-2 w-60 rounded-xl bg-[var(--bg-surface)] border border-[var(--border-dim)] shadow-xl overflow-hidden z-50"
          >
            <div className="px-3 py-2.5 border-b border-[var(--border-dim)]">
              <p className="text-[10px] text-[var(--text-secondary)]">
                {busy ? "Approve in your wallet..." : "Select Wallet"}
              </p>
            </div>

            {connectError && (
              <div className="px-3 py-2 border-b border-[var(--border-dim)] bg-red-400/5">
                <p className="text-[9px] text-red-400/80">{connectError.message?.slice(0, 80) || "Connection failed"}</p>
              </div>
            )}

            <div className="py-1">
              {connectors.map((connector) => {
                const isInstalled = availability[connector.id] ?? false;
                const isPending = pendingConnector?.id === connector.id && busy;
                const installUrl = getInstallUrl(connector.id);

                if (isInstalled) {
                  return (
                    <button
                      key={connector.id}
                      onClick={() => handleConnect(connector)}
                      disabled={busy}
                      className={cn(
                        "w-full flex items-center gap-3 px-3 py-3 transition-colors group",
                        busy ? "opacity-50 cursor-wait" : "hover:bg-[var(--bg-hover)]"
                      )}
                    >
                      <div className="w-8 h-8 rounded-lg bg-[var(--bg-elevated)] border border-[var(--border-dim)] flex items-center justify-center shrink-0">
                        {isPending ? (
                          <Loader2 className="w-4 h-4 text-violet-400 animate-spin" />
                        ) : (
                          <Wallet className="w-4 h-4 text-[var(--text-secondary)]" />
                        )}
                      </div>
                      <div className="flex-1 text-left">
                        <p className="text-[11px] text-[var(--text-primary)] font-medium">{connector.name}</p>
                        <p className="text-[8px] text-green-400/60">
                          {isPending ? "Waiting for approval..." : "Installed"}
                        </p>
                      </div>
                      <div className={cn(
                        "w-1.5 h-1.5 rounded-full shrink-0",
                        isPending ? "bg-violet-400 pulse-dot" : "bg-green-400/50"
                      )} />
                    </button>
                  );
                }

                return (
                  <a
                    key={connector.id}
                    href={installUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-full flex items-center gap-3 px-3 py-3 hover:bg-[var(--bg-hover)] transition-colors group"
                  >
                    <div className="w-8 h-8 rounded-lg bg-[var(--bg-void)] border border-[var(--border-dim)] flex items-center justify-center shrink-0 opacity-50">
                      <Wallet className="w-4 h-4 text-[var(--text-tertiary)]" />
                    </div>
                    <div className="flex-1 text-left">
                      <p className="text-[11px] text-[var(--text-secondary)]">{connector.name}</p>
                      <p className="text-[8px] text-[var(--amber-400)]/60">Click to install</p>
                    </div>
                    <Download className="w-3.5 h-3.5 text-[var(--amber-400)] opacity-0 group-hover:opacity-100 transition-opacity shrink-0" />
                  </a>
                );
              })}
            </div>

            <div className="px-3 py-2 border-t border-[var(--border-dim)]">
              <p className="text-[8px] text-[var(--text-tertiary)] leading-relaxed">
                {busy
                  ? "Check your wallet extension for a connection request"
                  : "Install a Starknet wallet to connect"}
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
