'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { LiveProofFeed } from '@/components';

export default function FeedPage() {
  const [proofs, setProofs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/recent-proofs?limit=20')
      .then((res) => res.json())
      .then((data) => {
        if (data.success) {
          setProofs(data.data.proofs);
        }
        setLoading(false);
      })
      .catch((err) => {
        console.error('Failed to fetch proofs:', err);
        setLoading(false);
      });
  }, []);

  return (
    <div className="min-h-screen relative">
      {/* Animated background gradient overlay */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />
      </div>

      <header className="relative z-10 border-b border-white/10 glass-card">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
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
                <p className="text-sm text-cyan-400/80 font-mono">Live Proof Feed</p>
              </div>
            </div>
            <nav className="flex gap-6">
              <Link href="/" className="text-gray-400 hover:text-cyan-400 transition-all relative group font-medium">
                Dashboard
                <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-gradient-to-r from-cyan-400 to-purple-400 group-hover:w-full transition-all" />
              </Link>
              <Link href="/feed" className="text-cyan-400 font-semibold hover:text-cyan-300 transition-all relative group">
                Live Feed
                <span className="absolute -bottom-1 left-0 w-full h-0.5 bg-gradient-to-r from-cyan-400 to-purple-400" />
              </Link>
              <Link href="/lending" className="text-gray-400 hover:text-cyan-400 transition-all relative group font-medium">
                DeFi Demo
                <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-gradient-to-r from-cyan-400 to-purple-400 group-hover:w-full transition-all" />
              </Link>
            </nav>
          </div>
        </div>
      </header>

      <main className="relative z-10 max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h2 className="text-4xl font-bold text-gradient-cyber mb-3">Recent Solvency Proofs</h2>
          <p className="text-gray-400 font-mono text-sm">Real-time verification feed from Starknet</p>
        </div>

        {loading ? (
          <div className="glass-card p-12 rounded-xl border border-white/10 text-center">
            <div className="inline-block w-12 h-12 border-3 border-cyan-400 border-t-transparent rounded-full animate-spin mb-4" />
            <p className="text-gray-400 font-mono">Loading proofs...</p>
          </div>
        ) : (
          <LiveProofFeed proofs={proofs} />
        )}
      </main>
    </div>
  );
}
