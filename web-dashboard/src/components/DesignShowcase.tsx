/**
 * Design Showcase Component
 * Demo page showing all ZK theme elements and components
 * Use this for design review and component reference
 */

'use client';

import React from 'react';
import {
  MerkleTreeVisualization,
  CircuitLines,
  HashVisualization,
  ProofVerificationAnimation,
  StarknetLogo,
  DataFlowAnimation,
} from './ZKVisuals';

export const DesignShowcase: React.FC = () => {
  return (
    <div className="min-h-screen relative">
      {/* Background */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />
      </div>

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-16">
        {/* Header */}
        <div className="text-center">
          <h1 className="text-6xl font-bold text-gradient-cyber mb-4">
            ZK Theme Design System
          </h1>
          <p className="text-gray-400 font-mono text-lg">
            Solva Protocol Visual Components Library
          </p>
        </div>

        {/* Color Palette */}
        <section>
          <h2 className="text-3xl font-bold text-gradient-cyber mb-6">Color Palette</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            <div className="glass-card p-6 rounded-xl border border-cyan-400/30 text-center">
              <div className="w-full h-24 bg-cyan-400 rounded-lg mb-4 shadow-glow-primary" />
              <div className="text-cyan-400 font-mono font-bold">#00F5FF</div>
              <div className="text-gray-500 text-sm">Cyan Accent</div>
            </div>
            <div className="glass-card p-6 rounded-xl border border-purple-400/30 text-center">
              <div className="w-full h-24 bg-purple-400 rounded-lg mb-4 shadow-glow-purple" />
              <div className="text-purple-400 font-mono font-bold">#B794F6</div>
              <div className="text-gray-500 text-sm">Purple Accent</div>
            </div>
            <div className="glass-card p-6 rounded-xl border border-green-400/30 text-center">
              <div className="w-full h-24 bg-green-400 rounded-lg mb-4 shadow-glow-success" />
              <div className="text-green-400 font-mono font-bold">#00FF88</div>
              <div className="text-gray-500 text-sm">Green Success</div>
            </div>
            <div className="glass-card p-6 rounded-xl border border-pink-400/30 text-center">
              <div className="w-full h-24 bg-pink-400 rounded-lg mb-4 shadow-glow-pink" />
              <div className="text-pink-400 font-mono font-bold">#FF1CF7</div>
              <div className="text-gray-500 text-sm">Pink Accent</div>
            </div>
          </div>
        </section>

        {/* Typography */}
        <section>
          <h2 className="text-3xl font-bold text-gradient-cyber mb-6">Typography</h2>
          <div className="glass-card p-8 rounded-xl border border-white/10 space-y-4">
            <div>
              <h1 className="text-6xl font-bold text-gradient-cyber">Display Heading</h1>
              <p className="text-gray-500 text-sm mt-2">text-6xl font-bold text-gradient-cyber</p>
            </div>
            <div>
              <h2 className="text-4xl font-bold text-white">Section Heading</h2>
              <p className="text-gray-500 text-sm mt-2">text-4xl font-bold text-white</p>
            </div>
            <div>
              <h3 className="text-2xl font-bold text-cyan-400">Subsection Heading</h3>
              <p className="text-gray-500 text-sm mt-2">text-2xl font-bold text-cyan-400</p>
            </div>
            <div>
              <p className="text-base text-gray-400">Body text - The quick brown fox jumps over the lazy dog</p>
              <p className="text-gray-500 text-sm mt-2">text-base text-gray-400</p>
            </div>
            <div>
              <p className="text-sm font-mono text-cyan-400">0x1234567890abcdef</p>
              <p className="text-gray-500 text-sm mt-2">text-sm font-mono text-cyan-400</p>
            </div>
          </div>
        </section>

        {/* Buttons */}
        <section>
          <h2 className="text-3xl font-bold text-gradient-cyber mb-6">Buttons</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="glass-card p-6 rounded-xl border border-white/10">
              <button className="w-full zk-button-glow">
                Primary Action
              </button>
              <p className="text-gray-500 text-sm mt-3 text-center">zk-button-glow</p>
            </div>
            <div className="glass-card p-6 rounded-xl border border-white/10">
              <button className="w-full px-6 py-3 rounded-lg bg-gradient-to-r from-cyan-500 to-purple-500 text-white font-bold hover:-translate-y-1 transition-all shadow-glow-primary">
                Gradient Button
              </button>
              <p className="text-gray-500 text-sm mt-3 text-center">Custom gradient</p>
            </div>
            <div className="glass-card p-6 rounded-xl border border-white/10">
              <button className="w-full px-6 py-3 rounded-lg glass-card border border-cyan-400/30 text-cyan-400 font-bold hover:bg-cyan-400/10 transition-all">
                Outlined Button
              </button>
              <p className="text-gray-500 text-sm mt-3 text-center">Glass outlined</p>
            </div>
          </div>
        </section>

        {/* Cards */}
        <section>
          <h2 className="text-3xl font-bold text-gradient-cyber mb-6">Cards</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="glass-card p-6 rounded-xl border border-white/10 hover-lift">
              <h3 className="text-xl font-bold text-cyan-400 mb-3">Glass Card</h3>
              <p className="text-gray-400 mb-4">Standard glass morphism effect with backdrop blur.</p>
              <code className="text-xs text-gray-500 font-mono">glass-card</code>
            </div>
            <div className="glass-card-strong p-6 rounded-xl border border-white/10 hover-lift">
              <h3 className="text-xl font-bold text-purple-400 mb-3">Strong Glass Card</h3>
              <p className="text-gray-400 mb-4">Enhanced glass effect with more opacity and blur.</p>
              <code className="text-xs text-gray-500 font-mono">glass-card-strong</code>
            </div>
            <div className="zk-holographic-border-hover p-6 rounded-xl hover-lift">
              <h3 className="text-xl font-bold text-gradient-cyber mb-3">Holographic Border</h3>
              <p className="text-gray-400 mb-4">Animated gradient border appears on hover.</p>
              <code className="text-xs text-gray-500 font-mono">zk-holographic-border-hover</code>
            </div>
            <div className="relative glass-card p-6 rounded-xl border-2 border-cyan-400/30 overflow-hidden group">
              <div className="zk-scan-line" />
              <h3 className="text-xl font-bold text-green-400 mb-3">Scan Line Effect</h3>
              <p className="text-gray-400 mb-4">Animated scan line on hover for cyber effect.</p>
              <code className="text-xs text-gray-500 font-mono">zk-scan-line</code>
            </div>
          </div>
        </section>

        {/* Badges */}
        <section>
          <h2 className="text-3xl font-bold text-gradient-cyber mb-6">Badges & Tags</h2>
          <div className="glass-card p-8 rounded-xl border border-white/10">
            <div className="flex flex-wrap gap-4">
              <span className="zk-tier-a px-4 py-2 rounded-full text-xs font-bold">TIER A</span>
              <span className="zk-tier-b px-4 py-2 rounded-full text-xs font-bold">TIER B</span>
              <span className="zk-tier-c px-4 py-2 rounded-full text-xs font-bold">TIER C</span>
              <span className="zk-verified-badge">
                <svg className="w-3 h-3" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                VERIFIED
              </span>
              <span className="px-3 py-1.5 rounded-full bg-cyan-400/20 border border-cyan-400/30 text-cyan-400 text-xs font-bold">
                PROCESSING
              </span>
              <span className="px-3 py-1.5 rounded-full bg-purple-400/20 border border-purple-400/30 text-purple-400 text-xs font-bold">
                PENDING
              </span>
            </div>
          </div>
        </section>

        {/* Progress Bars */}
        <section>
          <h2 className="text-3xl font-bold text-gradient-cyber mb-6">Progress Bars</h2>
          <div className="space-y-6">
            <div className="glass-card p-6 rounded-xl border border-white/10">
              <p className="text-gray-400 mb-3">Standard Progress (60%)</p>
              <div className="zk-progress-bar">
                <div className="zk-progress-fill" style={{ width: '60%' }} />
              </div>
            </div>
            <div className="glass-card p-6 rounded-xl border border-white/10">
              <p className="text-gray-400 mb-3">Data Flow Animation</p>
              <DataFlowAnimation className="w-full" />
            </div>
          </div>
        </section>

        {/* ZK Visual Elements */}
        <section>
          <h2 className="text-3xl font-bold text-gradient-cyber mb-6">ZK Visual Elements</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="glass-card p-8 rounded-xl border border-white/10">
              <h3 className="text-lg font-bold text-cyan-400 mb-4 text-center">Merkle Tree</h3>
              <MerkleTreeVisualization />
            </div>
            <div className="glass-card p-8 rounded-xl border border-white/10 relative">
              <CircuitLines className="opacity-30" />
              <h3 className="text-lg font-bold text-purple-400 mb-4 text-center relative z-10">Circuit Lines</h3>
              <div className="h-64 relative" />
            </div>
            <div className="glass-card p-8 rounded-xl border border-white/10">
              <h3 className="text-lg font-bold text-green-400 mb-4 text-center">Hash Display</h3>
              <div className="flex justify-center">
                <HashVisualization hash="0x1234567890abcdef1234567890abcdef" />
              </div>
            </div>
            <div className="glass-card p-8 rounded-xl border border-white/10">
              <h3 className="text-lg font-bold text-cyan-400 mb-4 text-center">Proof Verification</h3>
              <div className="flex justify-center gap-8">
                <div className="text-center">
                  <ProofVerificationAnimation isVerifying={true} />
                  <p className="text-xs text-gray-500 mt-2">Verifying</p>
                </div>
                <div className="text-center">
                  <ProofVerificationAnimation isVerifying={false} />
                  <p className="text-xs text-gray-500 mt-2">Verified</p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Icons */}
        <section>
          <h2 className="text-3xl font-bold text-gradient-cyber mb-6">Icons & Logos</h2>
          <div className="glass-card p-8 rounded-xl border border-white/10">
            <div className="flex flex-wrap items-center gap-8">
              <div className="text-center">
                <StarknetLogo size={48} />
                <p className="text-xs text-gray-500 mt-2">Starknet</p>
              </div>
              <div className="text-center">
                <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-cyan-400 to-purple-500 flex items-center justify-center shadow-glow-primary">
                  <span className="text-white text-2xl font-bold">S</span>
                </div>
                <p className="text-xs text-gray-500 mt-2">Solva</p>
              </div>
              <div className="text-center">
                <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-orange-400 to-orange-600 flex items-center justify-center shadow-glow-bitcoin">
                  <span className="text-white text-2xl font-bold">₿</span>
                </div>
                <p className="text-xs text-gray-500 mt-2">Bitcoin</p>
              </div>
            </div>
          </div>
        </section>

        {/* Animations */}
        <section>
          <h2 className="text-3xl font-bold text-gradient-cyber mb-6">Animations</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="glass-card p-8 rounded-xl border border-white/10 text-center">
              <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-cyan-400/20 border-2 border-cyan-400 flex items-center justify-center float">
                ⬆
              </div>
              <p className="text-gray-400 text-sm">Float Animation</p>
            </div>
            <div className="glass-card p-8 rounded-xl border border-white/10 text-center">
              <div className="w-16 h-16 mx-auto mb-4 rounded-lg glass-card border border-cyan-400/30 flex items-center justify-center pulse-glow">
                ✨
              </div>
              <p className="text-gray-400 text-sm">Pulse Glow</p>
            </div>
            <div className="glass-card p-8 rounded-xl border border-white/10 text-center">
              <div className="w-16 h-16 mx-auto mb-4 rounded-lg glass-card border border-purple-400/30 flex items-center justify-center hover-lift cursor-pointer">
                👆
              </div>
              <p className="text-gray-400 text-sm">Hover Lift (hover me)</p>
            </div>
          </div>
        </section>

        {/* Footer */}
        <div className="text-center pt-12">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full glass-card border border-cyan-500/30">
            <div className="w-2 h-2 rounded-full bg-cyan-400 shadow-glow-primary animate-pulse" />
            <span className="text-xs font-mono text-cyan-400 font-semibold tracking-wider">
              ZK INFRASTRUCTURE PROTOCOL DESIGN SYSTEM v1.0.0
            </span>
            <div className="w-2 h-2 rounded-full bg-cyan-400 shadow-glow-primary animate-pulse" />
          </div>
        </div>
      </div>
    </div>
  );
};

export default DesignShowcase;
