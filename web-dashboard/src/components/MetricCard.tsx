/**
 * MetricCard Component
 * Reusable metric display card with gradient text and customizable styling
 */

import React from 'react';

export interface MetricCardProps {
  label: string;
  value: string | number;
  subtext?: string;
  gradient?: 'primary' | 'bitcoin' | 'success' | 'warning';
  className?: string;
}

const gradientMap = {
  primary: 'bg-gradient-to-r from-primary-600 to-bitcoin-500',
  bitcoin: 'bg-gradient-to-r from-bitcoin-500 to-bitcoin-600',
  success: 'bg-gradient-to-r from-success-500 to-success-600',
  warning: 'bg-gradient-to-r from-warning-500 to-warning-600',
};

export const MetricCard: React.FC<MetricCardProps> = ({
  label,
  value,
  subtext,
  gradient = 'primary',
  className = '',
}) => {
  return (
    <div className={`
      relative group overflow-hidden
      glass-card p-6 rounded-xl border border-white/10
      hover-lift hover:border-cyan-400/30 transition-all duration-300
      ${className}
    `}>
      {/* Animated background gradient */}
      <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/5 via-purple-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

      {/* Circuit line decoration */}
      <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-cyan-400/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />

      <div className="relative z-10 text-center">
        {/* Animated counter value */}
        <div className="mb-3">
          <div
            className={`
              text-4xl font-bold font-mono leading-tight tabular-nums
              ${gradientMap[gradient]} bg-clip-text text-transparent
              group-hover:scale-105 transition-transform duration-300
            `}
            style={{
              textShadow: '0 0 20px rgba(0, 245, 255, 0.3)',
            }}
          >
            {value}
          </div>
        </div>

        {/* Label with glow on hover */}
        <div className="text-xs text-gray-400 uppercase tracking-widest font-bold mb-1 group-hover:text-cyan-400 transition-colors">
          {label}
        </div>

        {/* Subtext */}
        {subtext && (
          <div className="text-xs text-gray-500 font-mono">
            {subtext}
          </div>
        )}
      </div>

      {/* Corner accent */}
      <div className="absolute bottom-0 right-0 w-12 h-12 opacity-0 group-hover:opacity-100 transition-opacity">
        <div className="absolute bottom-0 right-0 w-8 h-px bg-gradient-to-l from-cyan-400/50 to-transparent" />
        <div className="absolute bottom-0 right-0 w-px h-8 bg-gradient-to-t from-cyan-400/50 to-transparent" />
      </div>
    </div>
  );
};

export default MetricCard;
