/**
 * LiveProofFeed Component
 * Real-time feed of proof submissions with animated entries
 */

'use client';

import React, { useState, useEffect } from 'react';
import { ProofRecord, SolvencyTier } from '@/types';

export interface LiveProofFeedProps {
  proofs?: ProofRecord[];
  maxItems?: number;
  className?: string;
}

const tierColors = {
  [SolvencyTier.TierA]: 'text-green-400',
  [SolvencyTier.TierB]: 'text-cyan-400',
  [SolvencyTier.TierC]: 'text-purple-400',
  [SolvencyTier.None]: 'text-gray-500',
};

const tierBadgeStyles = {
  [SolvencyTier.TierA]: 'bg-gradient-to-r from-green-400/20 to-cyan-400/20 border-green-400/30 text-green-400',
  [SolvencyTier.TierB]: 'bg-gradient-to-r from-cyan-400/20 to-purple-400/20 border-cyan-400/30 text-cyan-400',
  [SolvencyTier.TierC]: 'bg-gradient-to-r from-purple-400/20 to-pink-400/20 border-purple-400/30 text-purple-400',
  [SolvencyTier.None]: 'bg-gray-700/50 border-gray-600/30 text-gray-400',
};

const formatTimestamp = (timestamp: number): string => {
  const date = new Date(timestamp * 1000);
  const now = new Date();
  const diff = now.getTime() - date.getTime();
  const seconds = Math.floor(diff / 1000);

  if (seconds < 60) return `${seconds}s ago`;
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
};

const truncateHash = (hash: string): string => {
  if (hash.length <= 20) return hash;
  return `${hash.slice(0, 8)}...${hash.slice(-6)}`;
};

export const LiveProofFeed: React.FC<LiveProofFeedProps> = ({
  proofs = [],
  maxItems = 10,
  className = '',
}) => {
  const [newProofIds, setNewProofIds] = useState<Set<string>>(new Set());
  const [prevProofsLength, setPrevProofsLength] = useState(proofs.length);

  useEffect(() => {
    if (proofs.length > prevProofsLength) {
      // New proofs have been added
      const newIds = proofs.slice(0, proofs.length - prevProofsLength).map(p => p.transaction_hash);
      setNewProofIds(new Set(newIds));

      // Remove the "new" status after animation
      setTimeout(() => {
        setNewProofIds(new Set());
      }, 3000);
    }
    setPrevProofsLength(proofs.length);
  }, [proofs, prevProofsLength]);

  const displayProofs = proofs.slice(0, maxItems);

  return (
    <div className={className}>
      <div className="max-h-[700px] overflow-y-auto p-1 space-y-3">
        {displayProofs.length === 0 ? (
          <div className="text-center py-16 glass-card rounded-xl border border-white/10">
            <div className="text-6xl mb-4 opacity-50">🔐</div>
            <div className="text-gray-400 font-mono text-lg mb-2">No proofs yet</div>
            <div className="text-gray-500 text-sm">Generate your first proof to see it here</div>
          </div>
        ) : (
          displayProofs.map((proof) => {
            const isNew = newProofIds.has(proof.transaction_hash);

            return (
              <div
                key={proof.transaction_hash}
                className={`
                  relative glass-card border rounded-xl p-5 transition-all duration-300 group overflow-hidden
                  ${
                    isNew
                      ? 'border-cyan-400/50 shadow-glow-primary animate-slideIn'
                      : 'border-white/10 hover:border-cyan-400/30 hover-lift'
                  }
                `}
              >
                {/* Scan line effect */}
                <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-cyan-400/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />

                {/* Header with status and tier */}
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-3">
                    {/* Status Dot */}
                    <div className="relative">
                      <div className="w-2.5 h-2.5 rounded-full bg-green-400 shadow-glow-success" />
                      <div className="absolute inset-0 w-2.5 h-2.5 rounded-full bg-green-400 animate-ping" />
                    </div>

                    {/* Tier Badge */}
                    <span className={`px-3 py-1 rounded-full text-xs font-bold border ${tierBadgeStyles[proof.tier]}`}>
                      {proof.tier === SolvencyTier.None ? 'NO TIER' : proof.tier}
                    </span>
                  </div>

                  {/* Timestamp */}
                  <div className="text-xs text-gray-500 font-mono">
                    {formatTimestamp(proof.timestamp)}
                  </div>
                </div>

                {/* Issuer */}
                <div className="text-sm text-gray-400 mb-3">
                  <span className="font-medium">Issuer:</span>
                  <span className="ml-2 font-mono text-cyan-400">
                    {truncateHash(proof.issuer)}
                  </span>
                </div>

                {/* Transaction Hash */}
                <div className="flex items-center gap-2 mb-3">
                  <span className="text-xs text-gray-500">TX:</span>
                  <a
                    href={`https://starkscan.co/tx/${proof.transaction_hash}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="font-mono text-sm text-cyan-400 hover:text-cyan-300 hover:underline cursor-pointer transition-colors duration-150 flex-1"
                  >
                    {truncateHash(proof.transaction_hash)}
                  </a>
                  <svg className="w-4 h-4 text-gray-500 group-hover:text-cyan-400 transition-colors" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                    <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    <polyline points="15 3 21 3 21 9" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    <line x1="10" y1="14" x2="21" y2="3" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </div>

                {/* Additional Info */}
                <div className="pt-3 border-t border-white/10 flex items-center justify-between text-xs">
                  <div className="text-gray-400">
                    <span className="font-medium">Liabilities:</span>
                    <span className="ml-2 font-mono text-purple-400">{proof.total_liabilities}</span>
                  </div>
                  <div className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-green-400/20 border border-green-400/30 text-green-400 rounded-full text-xs font-bold shadow-glow-success">
                    <svg className="w-3 h-3" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    VERIFIED
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* View More Link */}
      {proofs.length > maxItems && (
        <div className="mt-4 text-center">
          <button className="text-sm text-cyan-400 hover:text-cyan-300 hover:underline font-mono font-semibold transition-colors">
            View all {proofs.length} proofs →
          </button>
        </div>
      )}
    </div>
  );
};

export default LiveProofFeed;
