/**
 * BitcoinAddresses Component
 * Manages Bitcoin reserve addresses with balance display and explorer links
 */

'use client';

import React, { useState } from 'react';

export interface BitcoinAddress {
  address: string;
  balance: number; // in BTC
  verified: boolean;
  label?: string;
}

export interface BitcoinAddressesProps {
  addresses?: BitcoinAddress[];
  className?: string;
}

export const BitcoinAddresses: React.FC<BitcoinAddressesProps> = ({
  addresses = [],
  className = '',
}) => {
  const [copiedAddress, setCopiedAddress] = useState<string | null>(null);

  const copyToClipboard = async (address: string) => {
    try {
      await navigator.clipboard.writeText(address);
      setCopiedAddress(address);
      setTimeout(() => setCopiedAddress(null), 2000);
    } catch (err) {
      console.error('Failed to copy address:', err);
    }
  };

  const formatBalance = (balance: number): string => {
    return balance.toFixed(8);
  };

  const truncateAddress = (address: string): string => {
    if (address.length <= 20) return address;
    return `${address.slice(0, 10)}...${address.slice(-10)}`;
  };

  return (
    <div className={`space-y-4 ${className}`}>
      <div className="flex items-center gap-3 mb-6">
        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-orange-400 to-orange-600 flex items-center justify-center shadow-glow-bitcoin">
          <span className="text-white font-bold text-lg">₿</span>
        </div>
        <h3 className="text-xl font-bold text-gradient-cyber">
          Bitcoin Reserve Addresses
        </h3>
      </div>

      {addresses.length === 0 ? (
        <div className="text-center py-12 glass-card rounded-xl border border-white/10">
          <div className="text-gray-500 font-mono text-sm">No addresses configured</div>
        </div>
      ) : (
        addresses.map((addr, index) => (
          <div
            key={`${addr.address}-${index}`}
            className={`
              relative p-5 rounded-xl border transition-all duration-300
              glass-card group hover-lift overflow-hidden
              ${
                addr.verified
                  ? 'border-green-400/30 hover:border-green-400/50 hover:shadow-glow-success'
                  : 'border-white/10 hover:border-cyan-400/30 hover:shadow-glow-primary'
              }
            `}
          >
            {/* Scan line effect */}
            <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-cyan-400/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />

            {/* Address Display */}
            <div className="flex items-center justify-between gap-3 mb-4">
              <div className="flex-1 overflow-hidden">
                <div className="font-mono text-sm text-cyan-400 overflow-hidden text-ellipsis whitespace-nowrap hover:text-cyan-300 transition-colors">
                  {addr.address}
                </div>
                {addr.label && (
                  <div className="text-xs text-gray-500 mt-1.5 font-medium">
                    {addr.label}
                  </div>
                )}
              </div>

              {/* Action Buttons */}
              <div className="flex gap-2 flex-shrink-0">
                <button
                  onClick={() => copyToClipboard(addr.address)}
                  className="p-2 rounded-lg glass-card border border-white/10 hover:border-cyan-400/30 transition-all duration-150 hover:scale-110 text-gray-400 hover:text-cyan-400"
                  title="Copy address"
                >
                  {copiedAddress === addr.address ? (
                    <svg className="w-4 h-4 text-green-400" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                      <polyline points="20 6 9 17 4 12" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  ) : (
                    <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                      <rect x="9" y="9" width="13" height="13" rx="2" ry="2" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                      <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  )}
                </button>

                <a
                  href={`https://blockstream.info/address/${addr.address}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-2 rounded-lg glass-card border border-white/10 hover:border-cyan-400/30 transition-all duration-150 hover:scale-110 text-gray-400 hover:text-cyan-400"
                  title="View on explorer"
                >
                  <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                    <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    <polyline points="15 3 21 3 21 9" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    <line x1="10" y1="14" x2="21" y2="3" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </a>
              </div>
            </div>

            {/* Balance Display */}
            <div className="flex items-center justify-between">
              <div>
                <div className="text-2xl font-bold text-gradient-cyber font-mono">
                  {formatBalance(addr.balance)} BTC
                </div>
                <div className="text-xs text-gray-500 uppercase tracking-wider font-semibold mt-1">
                  Balance
                </div>
              </div>

              {/* Verification Badge */}
              {addr.verified && (
                <div className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-gradient-to-r from-green-400/20 to-cyan-400/20 border border-green-400/30 text-green-400 rounded-full text-xs font-bold shadow-glow-success">
                  <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z" />
                  </svg>
                  VERIFIED
                </div>
              )}
            </div>
          </div>
        ))
      )}

      {/* Total Balance Summary */}
      {addresses.length > 0 && (
        <div className="mt-6 p-6 glass-card-strong rounded-xl border-2 border-orange-500/30 relative overflow-hidden group hover-lift">
          <div className="absolute inset-0 bg-gradient-to-r from-orange-500/5 via-yellow-500/5 to-orange-500/5 opacity-0 group-hover:opacity-100 transition-opacity" />
          <div className="relative z-10 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-orange-400 to-orange-600 flex items-center justify-center shadow-glow-bitcoin">
                <span className="text-white font-bold text-xl">₿</span>
              </div>
              <div>
                <div className="text-xs text-gray-400 uppercase tracking-wider font-semibold mb-1">
                  Total Reserve Balance
                </div>
                <div className="text-3xl font-bold font-mono">
                  <span className="text-gradient-cyber">
                    {formatBalance(addresses.reduce((sum, addr) => sum + addr.balance, 0))}
                  </span>
                  <span className="text-orange-400 ml-2">BTC</span>
                </div>
              </div>
            </div>
            <div className="text-right">
              <div className="text-xs text-gray-500 font-mono mb-1">
                {addresses.length} {addresses.length === 1 ? 'Address' : 'Addresses'}
              </div>
              <div className="inline-flex items-center gap-1.5 px-2 py-1 bg-green-400/20 border border-green-400/30 rounded-full">
                <div className="w-1.5 h-1.5 bg-green-400 rounded-full animate-pulse" />
                <span className="text-xs text-green-400 font-bold">SECURED</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default BitcoinAddresses;
