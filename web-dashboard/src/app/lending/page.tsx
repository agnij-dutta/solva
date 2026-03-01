'use client';

import Link from 'next/link';
import { LendingDemo } from '@/components';

export default function LendingPage() {
  return (
    <div className="min-h-screen relative">
      {/* Animated background gradient overlay */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />
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
                <p className="text-sm text-cyan-400/80 font-mono">DeFi Integration</p>
              </div>
            </div>
            <nav className="flex gap-6">
              <Link href="/" className="text-gray-400 hover:text-cyan-400 transition-all relative group font-medium">
                Dashboard
                <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-gradient-to-r from-cyan-400 to-purple-400 group-hover:w-full transition-all" />
              </Link>
              <Link href="/feed" className="text-gray-400 hover:text-cyan-400 transition-all relative group font-medium">
                Live Feed
                <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-gradient-to-r from-cyan-400 to-purple-400 group-hover:w-full transition-all" />
              </Link>
              <Link href="/lending" className="text-cyan-400 font-semibold hover:text-cyan-300 transition-all relative group">
                DeFi Demo
                <span className="absolute -bottom-1 left-0 w-full h-0.5 bg-gradient-to-r from-cyan-400 to-purple-400" />
              </Link>
            </nav>
          </div>
        </div>
      </header>

      <main className="relative z-10 max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h2 className="text-4xl font-bold text-gradient-cyber mb-3">Lending Protocol Integration</h2>
          <p className="text-gray-400 font-mono text-sm">Borrow against BTC-backed collateral with solvency-gated LTV</p>
        </div>

        <LendingDemo />
      </main>
    </div>
  );
}
