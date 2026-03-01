/**
 * LendingDemo Component
 * Interactive demo of lending protocol with solvency-based LTV
 */

'use client';

import React, { useState, useEffect } from 'react';
import { SolvencyTier } from '@/types';

export interface LendingDemoProps {
  className?: string;
}

const tierLtvMap = {
  [SolvencyTier.TierA]: 80,
  [SolvencyTier.TierB]: 60,
  [SolvencyTier.TierC]: 40,
  [SolvencyTier.None]: 0,
};

const tierLabels = {
  [SolvencyTier.TierA]: 'Tier A - Premium (80% LTV)',
  [SolvencyTier.TierB]: 'Tier B - Standard (60% LTV)',
  [SolvencyTier.TierC]: 'Tier C - Minimum (40% LTV)',
  [SolvencyTier.None]: 'No Tier (0% LTV)',
};

export const LendingDemo: React.FC<LendingDemoProps> = ({ className = '' }) => {
  const [collateralAmount, setCollateralAmount] = useState<string>('1000');
  const [currentTier, setCurrentTier] = useState<SolvencyTier>(SolvencyTier.None);
  const [isCheckingSolvency, setIsCheckingSolvency] = useState(false);
  const [borrowAmount, setBorrowAmount] = useState(0);
  const [error, setError] = useState<string | null>(null);

  const checkSolvencyStatus = async () => {
    setIsCheckingSolvency(true);
    setError(null);

    try {
      const response = await fetch('/api/proof-status');
      if (!response.ok) {
        throw new Error('Failed to check solvency status');
      }

      const data = await response.json();

      if (data.success && data.data.solvencyInfo) {
        setCurrentTier(data.data.solvencyInfo.tier);
      } else {
        setCurrentTier(SolvencyTier.None);
      }
    } catch (err) {
      console.error('Error checking solvency:', err);
      setError('Failed to check solvency status');
      setCurrentTier(SolvencyTier.None);
    } finally {
      setIsCheckingSolvency(false);
    }
  };

  useEffect(() => {
    // Check solvency on mount
    checkSolvencyStatus();
  }, []);

  useEffect(() => {
    // Calculate borrow amount based on collateral and tier
    const collateral = parseFloat(collateralAmount) || 0;
    const ltv = tierLtvMap[currentTier];
    setBorrowAmount((collateral * ltv) / 100);
  }, [collateralAmount, currentTier]);

  const handleCollateralChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    // Only allow numbers and decimals
    if (value === '' || /^\d*\.?\d*$/.test(value)) {
      setCollateralAmount(value);
    }
  };

  const ltv = tierLtvMap[currentTier];
  const canBorrow = currentTier !== SolvencyTier.None && parseFloat(collateralAmount) > 0;

  return (
    <div className={`bg-white border-2 border-neutral-200 rounded-2xl p-8 ${className}`}>
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-2xl font-bold text-neutral-900">
          Lending Protocol Demo
        </h3>
        <button
          onClick={checkSolvencyStatus}
          disabled={isCheckingSolvency}
          className="text-sm text-primary-600 hover:text-primary-700 font-medium flex items-center gap-1"
        >
          {isCheckingSolvency ? (
            <>
              <div className="w-4 h-4 border-2 border-primary-600 border-t-transparent rounded-full animate-spin" />
              Checking...
            </>
          ) : (
            <>
              🔄 Refresh Status
            </>
          )}
        </button>
      </div>

      {/* Current Tier Status */}
      <div className="mb-6 p-4 bg-primary-50 border border-primary-200 rounded-lg">
        <div className="text-sm text-neutral-700 mb-1">Current Solvency Tier</div>
        <div className="text-lg font-bold text-primary-600">
          {tierLabels[currentTier]}
        </div>
      </div>

      {/* Collateral Input */}
      <div className="mb-6">
        <label className="block text-sm font-medium text-neutral-700 mb-2">
          Collateral Amount (USDC)
        </label>
        <div className="relative">
          <input
            type="text"
            value={collateralAmount}
            onChange={handleCollateralChange}
            className="
              w-full px-4 py-3 border border-neutral-300 rounded-md
              font-mono text-lg
              focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent
              transition-all duration-150
            "
            placeholder="0.00"
          />
          <div className="absolute right-4 top-1/2 -translate-y-1/2 text-neutral-500 font-medium">
            USDC
          </div>
        </div>
      </div>

      {/* LTV Indicator */}
      <div className="mb-6 p-4 bg-gradient-to-r from-primary-50 to-bitcoin-50 border border-primary-200 rounded-lg">
        <div className="flex items-center justify-between mb-2">
          <div className="text-sm font-medium text-neutral-700">
            Available Loan-to-Value (LTV)
          </div>
          <div className="text-2xl font-bold text-primary-600 font-mono">
            {ltv}%
          </div>
        </div>
        <div className="w-full bg-neutral-200 rounded-full h-2 overflow-hidden">
          <div
            className="bg-gradient-to-r from-primary-500 to-bitcoin-500 h-full transition-all duration-300"
            style={{ width: `${ltv}%` }}
          />
        </div>
      </div>

      {/* Borrow Amount Display */}
      <div className="mb-6 p-6 bg-neutral-50 rounded-lg border border-neutral-200">
        <div className="text-sm text-neutral-600 mb-2">You can borrow up to</div>
        <div className="text-3xl font-bold text-neutral-900 font-mono mb-1">
          ${borrowAmount.toFixed(2)}
        </div>
        <div className="text-xs text-neutral-500">
          Based on your {tierLabels[currentTier].split(' ')[0]} {tierLabels[currentTier].split(' ')[1]} solvency
        </div>
      </div>

      {/* Warning Box */}
      {currentTier === SolvencyTier.None && (
        <div className="mb-6 p-4 bg-warning-50 border border-warning-300 rounded-lg">
          <div className="flex gap-2">
            <div className="text-warning-600 flex-shrink-0">⚠️</div>
            <div>
              <div className="font-semibold text-warning-800 mb-1">
                Solvency Proof Required
              </div>
              <div className="text-sm text-warning-700">
                You need to generate and verify a solvency proof to access lending. Higher solvency tiers unlock better LTV ratios.
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Error Display */}
      {error && (
        <div className="mb-6 p-4 bg-danger-50 border border-danger-300 rounded-lg text-danger-700 text-sm">
          {error}
        </div>
      )}

      {/* Borrow Button */}
      <button
        disabled={!canBorrow}
        className={`
          w-full px-6 py-3 rounded-lg font-semibold transition-all duration-300
          ${
            canBorrow
              ? 'bg-primary-600 text-white hover:bg-primary-700 hover:-translate-y-0.5 hover:shadow-md'
              : 'bg-neutral-300 text-neutral-500 cursor-not-allowed opacity-60'
          }
        `}
      >
        {canBorrow ? `Borrow $${borrowAmount.toFixed(2)} USDC` : 'Borrowing Not Available'}
      </button>

      {/* Info Footer */}
      <div className="mt-6 pt-6 border-t border-neutral-200">
        <div className="text-xs text-neutral-600">
          <div className="font-semibold mb-2">How it works:</div>
          <ul className="space-y-1 list-disc list-inside">
            <li>Generate a solvency proof to establish your tier</li>
            <li>Higher reserve ratios unlock better LTV rates</li>
            <li>Tier A (≥150%): 80% LTV</li>
            <li>Tier B (≥120%): 60% LTV</li>
            <li>Tier C (≥100%): 40% LTV</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default LendingDemo;
