/**
 * SolvencyStatus Component
 * Displays current solvency status with tier badge, ratio metric, and verification status
 */

import React from 'react';
import { SolvencyTier } from '@/types';

export interface SolvencyStatusProps {
  tier: SolvencyTier | 'A' | 'B' | 'C';
  ratio: number;
  lastProof: number | string;
  isVerified: boolean;
  className?: string;
}

const tierConfig = {
  [SolvencyTier.TierA]: {
    label: 'TIER A - Premium',
    ltv: '80% LTV',
    reserveRatio: '≥150%',
    borderColor: 'border-success-500',
    bgColor: 'bg-success-50',
    badgeBg: 'bg-white',
    badgeText: 'text-success-600',
    glowClass: 'hover:shadow-[0_10px_15px_-3px_rgba(0,0,0,0.1),0_4px_6px_-4px_rgba(0,0,0,0.1),0_0_20px_rgba(34,197,94,0.3)]',
  },
  [SolvencyTier.TierB]: {
    label: 'TIER B - Standard',
    ltv: '60% LTV',
    reserveRatio: '≥120%',
    borderColor: 'border-primary-500',
    bgColor: 'bg-primary-50',
    badgeBg: 'bg-white',
    badgeText: 'text-primary-600',
    glowClass: 'hover:shadow-[0_10px_15px_-3px_rgba(0,0,0,0.1),0_4px_6px_-4px_rgba(0,0,0,0.1),0_0_20px_rgba(14,165,233,0.3)]',
  },
  [SolvencyTier.TierC]: {
    label: 'TIER C - Minimum',
    ltv: '40% LTV',
    reserveRatio: '≥100%',
    borderColor: 'border-warning-500',
    bgColor: 'bg-warning-50',
    badgeBg: 'bg-white',
    badgeText: 'text-warning-600',
    glowClass: 'hover:shadow-lg',
  },
  [SolvencyTier.None]: {
    label: 'Not Verified',
    ltv: '0% LTV',
    reserveRatio: 'N/A',
    borderColor: 'border-neutral-300',
    bgColor: 'bg-neutral-50',
    badgeBg: 'bg-white',
    badgeText: 'text-neutral-500',
    glowClass: 'hover:shadow-lg',
  },
};

const formatTimestamp = (timestamp: number): string => {
  const date = new Date(timestamp * 1000);
  const now = new Date();
  const diff = now.getTime() - date.getTime();
  const minutes = Math.floor(diff / 60000);

  if (minutes < 1) return 'Just now';
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
};

export const SolvencyStatus: React.FC<SolvencyStatusProps> = ({
  tier,
  ratio,
  lastProof,
  isVerified,
  className = '',
}) => {
  // Map string tier to enum
  const tierMap: Record<string, SolvencyTier> = {
    'A': SolvencyTier.TierA,
    'B': SolvencyTier.TierB,
    'C': SolvencyTier.TierC,
  };

  const actualTier = typeof tier === 'string' ? (tierMap[tier] || SolvencyTier.None) : tier;
  const config = tierConfig[actualTier];

  // Handle lastProof as string or number
  const proofTimestamp = typeof lastProof === 'string' ? Date.now() / 1000 - 7200 : lastProof;

  return (
    <div
      className={`
        relative p-6 rounded-xl shadow-md transition-all duration-300
        glass-card border-2 hover:-translate-y-2
        ${actualTier === SolvencyTier.TierA ? 'border-green-400/30 hover:shadow-glow-success' : ''}
        ${actualTier === SolvencyTier.TierB ? 'border-cyan-400/30 hover:shadow-glow-primary' : ''}
        ${actualTier === SolvencyTier.TierC ? 'border-purple-400/30 hover:shadow-glow-purple' : ''}
        overflow-hidden group
        ${className}
      `}
    >
      {/* Animated holographic border on hover */}
      <div className="absolute inset-0 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none">
        <div className="absolute inset-0 bg-gradient-to-r from-cyan-500/20 via-purple-500/20 to-pink-500/20 animate-pulse" />
      </div>

      {/* Scan line effect */}
      <div className="zk-scan-line opacity-0 group-hover:opacity-100" />

      {/* Header with badge and verification icon */}
      <div className="flex items-center justify-between mb-5 relative z-10">
        <div className={`
          inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider
          ${actualTier === SolvencyTier.TierA ? 'bg-gradient-to-r from-green-400 to-cyan-400 text-white shadow-glow-success' : ''}
          ${actualTier === SolvencyTier.TierB ? 'bg-gradient-to-r from-cyan-400 to-purple-400 text-white shadow-glow-primary' : ''}
          ${actualTier === SolvencyTier.TierC ? 'bg-gradient-to-r from-purple-400 to-pink-400 text-white shadow-glow-purple' : ''}
          ${actualTier === SolvencyTier.None ? 'bg-gray-700 text-gray-300' : ''}
        `}>
          <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
          {config.label}
        </div>
        {isVerified && (
          <div className="relative group/icon">
            <div className="absolute inset-0 bg-green-400 rounded-full blur-md opacity-50 group-hover/icon:opacity-75 transition-opacity" />
            <div className="relative w-7 h-7 text-green-400 animate-pulse">
              <svg viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z" />
              </svg>
            </div>
          </div>
        )}
      </div>

      {/* Main metric - Reserve Ratio with glow */}
      <div className="mb-3 relative z-10">
        <div className="text-5xl font-bold font-mono leading-tight text-glow-cyan mb-1">
          {ratio.toFixed(2)}%
        </div>
        <div className="text-sm text-gray-400 font-semibold tracking-wide uppercase">
          Reserve Ratio
        </div>
      </div>

      {/* Visual indicator bar */}
      <div className="mb-4 relative z-10">
        <div className="h-2 bg-white/10 rounded-full overflow-hidden">
          <div
            className={`h-full rounded-full transition-all duration-1000 ${
              actualTier === SolvencyTier.TierA ? 'bg-gradient-to-r from-green-400 to-cyan-400 shadow-glow-success' :
              actualTier === SolvencyTier.TierB ? 'bg-gradient-to-r from-cyan-400 to-purple-400 shadow-glow-primary' :
              actualTier === SolvencyTier.TierC ? 'bg-gradient-to-r from-purple-400 to-pink-400 shadow-glow-purple' :
              'bg-gray-600'
            }`}
            style={{ width: `${Math.min(ratio, 200) / 2}%` }}
          />
        </div>
      </div>

      {/* LTV Information */}
      <div className="mb-4 relative z-10">
        <div className="flex items-center justify-between text-sm">
          <span className="text-gray-400 font-medium">Available LTV:</span>
          <span className={`font-bold font-mono ${
            actualTier === SolvencyTier.TierA ? 'text-green-400' :
            actualTier === SolvencyTier.TierB ? 'text-cyan-400' :
            actualTier === SolvencyTier.TierC ? 'text-purple-400' :
            'text-gray-500'
          }`}>
            {config.ltv}
          </span>
        </div>
      </div>

      {/* Timestamp with icon */}
      <div className="flex items-center gap-2 text-xs text-gray-500 font-mono relative z-10">
        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        <span>Last proof: {typeof lastProof === 'string' ? lastProof : formatTimestamp(lastProof)}</span>
      </div>

      {/* Circuit line decoration */}
      <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-cyan-400/50 to-transparent" />
    </div>
  );
};

export default SolvencyStatus;
