'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { ProofGenerator, SolvencyStatus, BitcoinAddresses, MetricCard } from '@/components';

export default function HomePage() {
  const [config, setConfig] = useState<any>(null);
  const [solvencyData] = useState({
    totalReserves: 26.0,
    totalLiabilities: 20.0,
    ratio: 130,
    tier: 'A',
    lastProof: '2 hours ago',
    isVerified: true,
  });

  useEffect(() => {
    fetch('/api/config')
      .then((res) => res.json())
      .then((data) => setConfig(data))
      .catch(console.error);
  }, []);

  return (
    <div className="min-h-screen relative">
      {/* Animated background gradient overlay */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />
        <div className="absolute top-1/2 left-1/2 w-96 h-96 bg-pink-500/5 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '2s' }} />
      </div>

      {/* Header */}
      <header className="relative z-10 border-b border-white/10 glass-card">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              {/* Logo with holographic effect */}
              <div className="relative group">
                <div className="absolute inset-0 bg-gradient-to-br from-cyan-500 to-purple-500 rounded-xl blur opacity-75 group-hover:opacity-100 transition-opacity" />
                <div className="relative w-12 h-12 bg-gradient-to-br from-cyan-400 via-purple-500 to-pink-500 rounded-xl flex items-center justify-center shadow-glow-primary">
                  <svg className="w-7 h-7 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                  </svg>
                </div>
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gradient-cyber">Solva</h1>
                <p className="text-sm text-cyan-400/80 font-mono">ZK Solvency Verification Protocol</p>
              </div>
            </div>
            <nav className="flex gap-6">
              <Link
                href="/"
                className="text-cyan-400 font-semibold hover:text-cyan-300 transition-all relative group"
              >
                Dashboard
                <span className="absolute -bottom-1 left-0 w-full h-0.5 bg-gradient-to-r from-cyan-400 to-purple-400" />
              </Link>
              <Link
                href="/feed"
                className="text-gray-400 hover:text-cyan-400 transition-all relative group font-medium"
              >
                Live Feed
                <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-gradient-to-r from-cyan-400 to-purple-400 group-hover:w-full transition-all" />
              </Link>
              <Link
                href="/lending"
                className="text-gray-400 hover:text-cyan-400 transition-all relative group font-medium"
              >
                DeFi Demo
                <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-gradient-to-r from-cyan-400 to-purple-400 group-hover:w-full transition-all" />
              </Link>
            </nav>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Top Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <MetricCard
            label="Total Reserves"
            value={`${solvencyData.totalReserves} BTC`}
            subtext="Across all addresses"
            gradient="bitcoin"
          />
          <MetricCard
            label="Total Liabilities"
            value={`${solvencyData.totalLiabilities} BTC`}
            subtext="Outstanding tokens"
            gradient="primary"
          />
          <MetricCard
            label="Solvency Ratio"
            value={`${solvencyData.ratio}%`}
            subtext="Reserves / Liabilities"
            gradient="success"
          />
          <MetricCard
            label="Current Tier"
            value={`Tier ${solvencyData.tier}`}
            subtext="80% LTV Available"
            gradient="success"
          />
        </div>

        {/* Main Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column - Solvency Status */}
          <div className="lg:col-span-1">
            <SolvencyStatus
              tier={solvencyData.tier as 'A' | 'B' | 'C'}
              ratio={solvencyData.ratio}
              lastProof={solvencyData.lastProof}
              isVerified={solvencyData.isVerified}
            />
          </div>

          {/* Middle Column - Proof Generator */}
          <div className="lg:col-span-2">
            <ProofGenerator onProofComplete={(data) => {
              console.log('Proof completed:', data);
            }} />
          </div>
        </div>

        {/* Bitcoin Addresses Section */}
        <div className="mt-8">
          <BitcoinAddresses />
        </div>

        {/* Network Info - Enhanced */}
        {config && (
          <div className="mt-8 glass-card p-5 rounded-xl border border-purple-500/20 hover-lift group">
            <div className="flex items-center justify-between text-sm">
              <div className="flex items-center gap-4">
                <span className="text-gray-400 font-medium">Network:</span>
                <span className="font-mono font-bold text-purple-400">{config.network}</span>
              </div>
              <div className="flex items-center gap-3">
                <div className="relative">
                  <span className="w-2.5 h-2.5 bg-green-400 rounded-full block shadow-glow-success" />
                  <span className="absolute inset-0 w-2.5 h-2.5 bg-green-400 rounded-full animate-ping" />
                </div>
                <span className="text-gray-300 font-medium">Connected to Starknet</span>
                {/* Starknet logo placeholder */}
                <div className="w-5 h-5 rounded bg-purple-500/20 flex items-center justify-center">
                  <span className="text-purple-400 text-xs font-bold">S</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ZK Protocol Badge */}
        <div className="mt-6 flex justify-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full glass-card border border-cyan-500/30 group hover-lift cursor-default">
            <div className="w-2 h-2 rounded-full bg-cyan-400 shadow-glow-primary animate-pulse" />
            <span className="text-xs font-mono text-cyan-400 font-semibold tracking-wider">
              ZERO-KNOWLEDGE INFRASTRUCTURE PROTOCOL
            </span>
            <div className="w-2 h-2 rounded-full bg-cyan-400 shadow-glow-primary animate-pulse" />
          </div>
        </div>
      </main>
    </div>
  );
}
