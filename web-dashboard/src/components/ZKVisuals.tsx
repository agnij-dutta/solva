/**
 * ZK Visual Elements Component
 * Merkle tree visualization, circuit connections, cryptographic effects
 */

'use client';

import React from 'react';

export const MerkleTreeVisualization: React.FC<{ className?: string }> = ({ className = '' }) => {
  return (
    <div className={`relative ${className}`}>
      <svg
        viewBox="0 0 400 300"
        className="w-full h-auto"
        style={{ filter: 'drop-shadow(0 0 10px rgba(0, 245, 255, 0.3))' }}
      >
        {/* Connection lines */}
        <line x1="200" y1="50" x2="100" y2="120" stroke="#00F5FF" strokeWidth="2" opacity="0.5" />
        <line x1="200" y1="50" x2="300" y2="120" stroke="#00F5FF" strokeWidth="2" opacity="0.5" />
        <line x1="100" y1="120" x2="50" y2="190" stroke="#B794F6" strokeWidth="2" opacity="0.5" />
        <line x1="100" y1="120" x2="150" y2="190" stroke="#B794F6" strokeWidth="2" opacity="0.5" />
        <line x1="300" y1="120" x2="250" y2="190" stroke="#B794F6" strokeWidth="2" opacity="0.5" />
        <line x1="300" y1="120" x2="350" y2="190" stroke="#B794F6" strokeWidth="2" opacity="0.5" />

        {/* Root node */}
        <circle cx="200" cy="50" r="20" fill="#0F1433" stroke="#00F5FF" strokeWidth="3" />
        <text x="200" y="55" textAnchor="middle" fill="#00F5FF" fontSize="12" fontWeight="bold">R</text>

        {/* Level 1 nodes */}
        <circle cx="100" cy="120" r="18" fill="#0F1433" stroke="#00F5FF" strokeWidth="2.5" />
        <text x="100" y="125" textAnchor="middle" fill="#00F5FF" fontSize="11">H1</text>

        <circle cx="300" cy="120" r="18" fill="#0F1433" stroke="#00F5FF" strokeWidth="2.5" />
        <text x="300" y="125" textAnchor="middle" fill="#00F5FF" fontSize="11">H2</text>

        {/* Level 2 nodes (leaves) */}
        <circle cx="50" cy="190" r="15" fill="#0F1433" stroke="#B794F6" strokeWidth="2" />
        <text x="50" y="195" textAnchor="middle" fill="#B794F6" fontSize="10">L1</text>

        <circle cx="150" cy="190" r="15" fill="#0F1433" stroke="#B794F6" strokeWidth="2" />
        <text x="150" y="195" textAnchor="middle" fill="#B794F6" fontSize="10">L2</text>

        <circle cx="250" cy="190" r="15" fill="#0F1433" stroke="#B794F6" strokeWidth="2" />
        <text x="250" y="195" textAnchor="middle" fill="#B794F6" fontSize="10">L3</text>

        <circle cx="350" cy="190" r="15" fill="#0F1433" stroke="#B794F6" strokeWidth="2" />
        <text x="350" y="195" textAnchor="middle" fill="#B794F6" fontSize="10">L4</text>

        {/* Animated pulse on root */}
        <circle cx="200" cy="50" r="20" fill="none" stroke="#00F5FF" strokeWidth="2" opacity="0.3">
          <animate attributeName="r" from="20" to="30" dur="2s" repeatCount="indefinite" />
          <animate attributeName="opacity" from="0.3" to="0" dur="2s" repeatCount="indefinite" />
        </circle>
      </svg>
    </div>
  );
};

export const CircuitLines: React.FC<{ className?: string }> = ({ className = '' }) => {
  return (
    <div className={`absolute inset-0 pointer-events-none overflow-hidden ${className}`}>
      {/* Horizontal circuit lines */}
      <div className="absolute top-1/4 left-0 right-0 h-px bg-gradient-to-r from-transparent via-cyan-400/30 to-transparent" />
      <div className="absolute top-1/2 left-0 right-0 h-px bg-gradient-to-r from-transparent via-purple-400/30 to-transparent" />
      <div className="absolute top-3/4 left-0 right-0 h-px bg-gradient-to-r from-transparent via-pink-400/30 to-transparent" />

      {/* Vertical circuit lines */}
      <div className="absolute left-1/4 top-0 bottom-0 w-px bg-gradient-to-b from-transparent via-cyan-400/30 to-transparent" />
      <div className="absolute left-1/2 top-0 bottom-0 w-px bg-gradient-to-b from-transparent via-purple-400/30 to-transparent" />
      <div className="absolute left-3/4 top-0 bottom-0 w-px bg-gradient-to-b from-transparent via-pink-400/30 to-transparent" />

      {/* Circuit nodes */}
      <div className="absolute top-1/4 left-1/4 w-2 h-2 bg-cyan-400 rounded-full shadow-glow-primary" />
      <div className="absolute top-1/2 left-1/2 w-2 h-2 bg-purple-400 rounded-full shadow-glow-purple" />
      <div className="absolute top-3/4 left-3/4 w-2 h-2 bg-pink-400 rounded-full shadow-glow-pink" />
    </div>
  );
};

export const HashVisualization: React.FC<{ hash: string; className?: string }> = ({ hash, className = '' }) => {
  const truncatedHash = hash.length > 16 ? `${hash.slice(0, 8)}...${hash.slice(-8)}` : hash;

  return (
    <div className={`inline-flex items-center gap-2 ${className}`}>
      <div className="font-mono text-sm text-cyan-400 bg-cyan-400/10 px-3 py-1.5 rounded-lg border border-cyan-400/30 hover:border-cyan-400/50 hover:shadow-glow-primary transition-all">
        {truncatedHash}
      </div>
      <div className="w-6 h-6 rounded border border-cyan-400/30 flex items-center justify-center">
        <svg className="w-3.5 h-3.5 text-cyan-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
        </svg>
      </div>
    </div>
  );
};

export const ProofVerificationAnimation: React.FC<{ isVerifying?: boolean; className?: string }> = ({
  isVerifying = false,
  className = '',
}) => {
  return (
    <div className={`relative inline-flex items-center justify-center ${className}`}>
      {isVerifying ? (
        <>
          {/* Spinning outer ring */}
          <div className="absolute inset-0">
            <div className="w-full h-full rounded-full border-2 border-cyan-400/30 border-t-cyan-400 animate-spin" />
          </div>
          {/* Pulsing inner circle */}
          <div className="w-8 h-8 rounded-full bg-cyan-400/20 animate-pulse flex items-center justify-center">
            <svg className="w-5 h-5 text-cyan-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
            </svg>
          </div>
        </>
      ) : (
        <div className="w-10 h-10 rounded-full bg-green-400/20 border-2 border-green-400 shadow-glow-success flex items-center justify-center">
          <svg className="w-6 h-6 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
          </svg>
        </div>
      )}
    </div>
  );
};

export const StarknetLogo: React.FC<{ className?: string; size?: number }> = ({ className = '', size = 24 }) => {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      className={`zk-starknet-logo ${className}`}
      fill="none"
    >
      <path
        d="M12 2L3 7v10l9 5 9-5V7l-9-5z"
        stroke="#B794F6"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M12 2v20M3 7l9 5M21 7l-9 5"
        stroke="#B794F6"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        opacity="0.6"
      />
      <circle cx="12" cy="12" r="3" fill="#B794F6" opacity="0.4" />
    </svg>
  );
};

export const DataFlowAnimation: React.FC<{ className?: string }> = ({ className = '' }) => {
  return (
    <div className={`relative h-1 overflow-hidden rounded-full bg-white/5 ${className}`}>
      <div
        className="absolute inset-y-0 w-1/3 bg-gradient-to-r from-transparent via-cyan-400 to-transparent"
        style={{
          animation: 'data-flow 2s linear infinite',
        }}
      />
      <style jsx>{`
        @keyframes data-flow {
          0% {
            left: -33.333%;
          }
          100% {
            left: 100%;
          }
        }
      `}</style>
    </div>
  );
};

export default {
  MerkleTreeVisualization,
  CircuitLines,
  HashVisualization,
  ProofVerificationAnimation,
  StarknetLogo,
  DataFlowAnimation,
};
