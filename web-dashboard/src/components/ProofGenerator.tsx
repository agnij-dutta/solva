/**
 * ProofGenerator Component
 * Handles ZK proof generation with real-time progress tracking
 * Shows 5-stage progress with SSE streaming
 */

'use client';

import React, { useState, useEffect, useRef } from 'react';
import { ProofStatus } from '@/types';

interface ProofStage {
  id: string;
  label: string;
  duration: string;
  icon: string;
  color: string;
  highlight?: boolean;
}

export interface ProofGeneratorProps {
  onProofComplete?: (data: any) => void;
  className?: string;
}

const stages: ProofStage[] = [
  {
    id: 'fetching',
    label: 'Fetching Bitcoin UTXOs',
    duration: '3s',
    icon: '⬇️',
    color: 'text-primary-500',
  },
  {
    id: 'building',
    label: 'Building Merkle Tree',
    duration: '2s',
    icon: '🌳',
    color: 'text-primary-600',
  },
  {
    id: 'proving',
    label: 'Generating ZK Proof',
    duration: '25s',
    icon: '🛡️',
    color: 'text-bitcoin-500',
    highlight: true,
  },
  {
    id: 'submitting',
    label: 'Submitting to Starknet',
    duration: '5s',
    icon: '⬆️',
    color: 'text-primary-500',
  },
  {
    id: 'verifying',
    label: 'Verifying On-Chain',
    duration: '3s',
    icon: '✅',
    color: 'text-success-500',
  },
];

const statusToStageIndex = (status: ProofStatus): number => {
  switch (status) {
    case ProofStatus.FETCHING_UTXOS:
      return 0;
    case ProofStatus.BUILDING_TREE:
      return 1;
    case ProofStatus.PROVING:
    case ProofStatus.COMPILING_CIRCUIT:
    case ProofStatus.GENERATING_WITNESS:
      return 2;
    case ProofStatus.VERIFYING:
      return 3;
    case ProofStatus.COMPLETE:
      return 4;
    default:
      return -1;
  }
};

export const ProofGenerator: React.FC<ProofGeneratorProps> = ({ onProofComplete, className = '' }) => {
  const [isGenerating, setIsGenerating] = useState(false);
  const [currentStage, setCurrentStage] = useState(-1);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [transactionHash, setTransactionHash] = useState<string | null>(null);
  const eventSourceRef = useRef<EventSource | null>(null);

  const startProofGeneration = async () => {
    setIsGenerating(true);
    setCurrentStage(0);
    setProgress(0);
    setError(null);
    setTransactionHash(null);

    try {
      // Initiate proof generation
      const response = await fetch('/api/generate-proof', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ useSampleData: true }),
      });

      if (!response.ok) {
        throw new Error('Failed to start proof generation');
      }

      // Connect to SSE stream for progress updates
      const eventSource = new EventSource('/api/generate-proof/stream');
      eventSourceRef.current = eventSource;

      eventSource.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);

          if (data.status === ProofStatus.ERROR) {
            setError(data.message || 'Proof generation failed');
            setIsGenerating(false);
            eventSource.close();
            return;
          }

          const stageIndex = statusToStageIndex(data.status);
          setCurrentStage(stageIndex);
          setProgress(data.progress || 0);

          if (data.status === ProofStatus.COMPLETE) {
            setTransactionHash(data.transaction_hash);
            setIsGenerating(false);
            eventSource.close();
            if (onProofComplete) {
              onProofComplete(data);
            }
          }
        } catch (err) {
          console.error('Error parsing SSE data:', err);
        }
      };

      eventSource.onerror = () => {
        setError('Connection lost. Please try again.');
        setIsGenerating(false);
        eventSource.close();
      };
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error occurred');
      setIsGenerating(false);
    }
  };

  useEffect(() => {
    return () => {
      if (eventSourceRef.current) {
        eventSourceRef.current.close();
      }
    };
  }, []);

  return (
    <div className={`glass-card-strong rounded-xl p-8 border-2 border-cyan-500/20 relative overflow-hidden group hover-lift ${className}`}>
      {/* Background glow effect */}
      <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/5 via-purple-500/5 to-pink-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

      {/* Header with icon */}
      <div className="flex items-center gap-3 mb-6 relative z-10">
        <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-cyan-400 to-purple-500 flex items-center justify-center shadow-glow-primary">
          <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 3v2m6-2v2M9 19v2m6-2v2M5 9H3m2 6H3m18-6h-2m2 6h-2M7 19h10a2 2 0 002-2V7a2 2 0 00-2-2H7a2 2 0 00-2 2v10a2 2 0 002 2zM9 9h6v6H9V9z" />
          </svg>
        </div>
        <div>
          <h2 className="text-2xl font-bold text-gradient-cyber">
            Generate Solvency Proof
          </h2>
          <p className="text-sm text-gray-400 font-mono">ZK-STARK Circuit Execution</p>
        </div>
      </div>

      {/* Progress Bar - Enhanced with glow */}
      <div className="w-full h-3 bg-white/5 rounded-full overflow-hidden mb-6 relative z-10 border border-white/10">
        <div
          className="h-full bg-gradient-to-r from-cyan-400 via-purple-500 to-pink-500 transition-all duration-300 relative overflow-hidden shadow-glow-primary"
          style={{ width: `${progress}%` }}
        >
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/40 to-transparent animate-shimmer" style={{ animationDuration: '1.5s' }} />
        </div>
      </div>

      {/* Stage Indicators - Matrix Style */}
      <div className="flex flex-col gap-3 mb-6 relative z-10">
        {stages.map((stage, index) => {
          const isActive = index === currentStage;
          const isComplete = index < currentStage;
          const isPending = index > currentStage;

          return (
            <div
              key={stage.id}
              className={`
                relative flex items-center gap-4 p-4 rounded-lg transition-all duration-300
                ${isActive ? 'glass-card-strong border-l-4 border-cyan-400 scale-[1.02] shadow-glow-primary' : 'glass-card'}
                ${isComplete ? 'opacity-60 border-l-4 border-green-400/50' : ''}
                ${isPending ? 'opacity-40 border-l-2 border-white/10' : ''}
                group
              `}
            >
              {/* Circuit line animation */}
              {isActive && (
                <div className="absolute left-0 top-0 bottom-0 w-1 overflow-hidden">
                  <div className="h-full w-full bg-gradient-to-b from-cyan-400 via-purple-500 to-pink-500 animate-pulse" />
                </div>
              )}

              {/* Icon with glow */}
              <div className={`
                text-3xl relative
                ${isActive ? 'animate-bounce' : ''}
                ${isActive ? 'filter drop-shadow-[0_0_8px_rgba(0,245,255,0.6)]' : ''}
              `}>
                {stage.icon}
              </div>

              {/* Content */}
              <div className="flex-1">
                <div className={`font-semibold mb-1 ${
                  isActive ? 'text-cyan-300' :
                  isComplete ? 'text-green-400' :
                  'text-gray-400'
                }`}>
                  {stage.label}
                </div>
                <div className={`text-xs font-mono ${
                  isActive ? 'text-cyan-400/80' :
                  isComplete ? 'text-green-400/60' :
                  'text-gray-500'
                }`}>
                  {isActive && (
                    <span className="inline-flex items-center gap-2">
                      <span className="w-1.5 h-1.5 bg-cyan-400 rounded-full animate-pulse" />
                      Processing circuit...
                    </span>
                  )}
                  {isComplete && (
                    <span className="inline-flex items-center gap-2">
                      <span className="w-1.5 h-1.5 bg-green-400 rounded-full" />
                      Verified
                    </span>
                  )}
                  {isPending && `Est. ${stage.duration}`}
                </div>
              </div>

              {/* Status indicator */}
              <div className="flex items-center gap-3">
                {isActive && (
                  <div className="font-mono text-sm font-bold text-cyan-400 tabular-nums">
                    {Math.round(progress)}%
                  </div>
                )}
                {isComplete && (
                  <div className="w-6 h-6 rounded-full bg-green-400/20 flex items-center justify-center border border-green-400/50">
                    <svg className="w-4 h-4 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                )}
                {isPending && (
                  <div className="w-6 h-6 rounded-full bg-white/5 border border-white/20" />
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Error Display - Cyber Style */}
      {error && (
        <div className="relative mb-4 p-4 glass-card border-2 border-red-500/50 rounded-lg overflow-hidden group">
          <div className="absolute inset-0 bg-red-500/10 animate-pulse" />
          <div className="relative z-10">
            <div className="flex items-center gap-2 font-semibold mb-2 text-red-400">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              Circuit Error
            </div>
            <div className="text-sm text-gray-300 font-mono">{error}</div>
          </div>
        </div>
      )}

      {/* Success Display - Holographic */}
      {transactionHash && (
        <div className="relative mb-4 p-5 glass-card-strong border-2 border-green-400/50 rounded-lg overflow-hidden group shadow-glow-success">
          <div className="absolute inset-0 bg-gradient-to-r from-green-400/10 via-cyan-400/10 to-green-400/10 animate-pulse" />

          <div className="relative z-10">
            <div className="flex items-center gap-2 font-bold mb-3 text-green-400">
              <div className="w-6 h-6 rounded-full bg-green-400/20 flex items-center justify-center">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              Proof Generated Successfully!
            </div>
            <div className="text-sm text-gray-300 mb-2">
              <span className="font-medium text-gray-400">Transaction Hash:</span>
            </div>
            <a
              href={`https://starkscan.co/tx/${transactionHash}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg glass-card border border-cyan-400/30 hover:border-cyan-400/60 transition-all group/link hover-lift"
            >
              <span className="font-mono text-cyan-400 text-sm">
                {transactionHash.slice(0, 10)}...{transactionHash.slice(-8)}
              </span>
              <svg className="w-4 h-4 text-cyan-400 group-hover/link:translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
              </svg>
            </a>
          </div>
        </div>
      )}

      {/* Action Button - Holographic */}
      <button
        onClick={startProofGeneration}
        disabled={isGenerating}
        className={`
          relative w-full px-6 py-4 rounded-lg font-bold transition-all duration-300
          inline-flex items-center justify-center gap-3 overflow-hidden group/btn
          ${
            isGenerating
              ? 'bg-gray-700/50 cursor-not-allowed opacity-60 border border-gray-600'
              : 'bg-gradient-to-r from-cyan-500 via-purple-500 to-pink-500 text-white hover:-translate-y-1 shadow-glow-primary border-2 border-transparent hover:border-cyan-400/50'
          }
        `}
      >
        {/* Button shine effect */}
        {!isGenerating && (
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover/btn:translate-x-full transition-transform duration-1000" />
        )}

        <div className="relative z-10 flex items-center gap-3">
          {isGenerating ? (
            <>
              <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              <span className="font-mono tracking-wide">GENERATING PROOF...</span>
            </>
          ) : (
            <>
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
              <span className="font-mono tracking-wide">GENERATE ZK PROOF</span>
            </>
          )}
        </div>
      </button>
    </div>
  );
};

export default ProofGenerator;
