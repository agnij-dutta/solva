/**
 * Example React component demonstrating proof generation with real-time progress
 *
 * This is a reference implementation showing how to:
 * - Generate ZK proofs via API
 * - Stream progress with Server-Sent Events
 * - Submit proofs to Starknet
 * - Query proof status
 */

'use client';

import { useState, useEffect } from 'react';
import type { ProofGenerationProgress, ProofStatusResponse } from '@/types';

interface ProofGeneratorProps {
  issuerAddress?: string;
  onProofComplete?: (txHash: string) => void;
}

export default function ProofGenerator({
  issuerAddress,
  onProofComplete
}: ProofGeneratorProps) {
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [progress, setProgress] = useState<ProofGenerationProgress | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [txHash, setTxHash] = useState<string | null>(null);
  const [proofStatus, setProofStatus] = useState<ProofStatusResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Start proof generation
  const handleGenerateProof = async () => {
    try {
      setError(null);
      setIsGenerating(true);
      setProgress(null);

      const response = await fetch('/api/generate-proof', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ useSampleData: true }),
      });

      if (!response.ok) {
        throw new Error('Failed to start proof generation');
      }

      const result = await response.json();
      setSessionId(result.data.sessionId);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
      setIsGenerating(false);
    }
  };

  // Stream progress via SSE
  useEffect(() => {
    if (!sessionId) return;

    const eventSource = new EventSource(
      `/api/generate-proof/stream?sessionId=${sessionId}`
    );

    eventSource.onmessage = (event) => {
      const update: ProofGenerationProgress = JSON.parse(event.data);
      setProgress(update);

      if (update.status === 'complete') {
        setIsGenerating(false);
        eventSource.close();
      } else if (update.status === 'error') {
        setError(update.error || update.message);
        setIsGenerating(false);
        eventSource.close();
      }
    };

    eventSource.onerror = () => {
      setError('Connection to progress stream lost');
      eventSource.close();
      setIsGenerating(false);
    };

    return () => {
      eventSource.close();
    };
  }, [sessionId]);

  // Submit proof to Starknet
  const handleSubmitProof = async () => {
    try {
      setError(null);
      setIsSubmitting(true);

      const response = await fetch('/api/submit-proof', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({}),
      });

      if (!response.ok) {
        throw new Error('Failed to submit proof');
      }

      const result = await response.json();
      setTxHash(result.data.transactionHash);

      if (onProofComplete) {
        onProofComplete(result.data.transactionHash);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Query proof status
  const handleQueryStatus = async () => {
    if (!issuerAddress) {
      setError('Issuer address required to query status');
      return;
    }

    try {
      setError(null);

      const response = await fetch(
        `/api/proof-status?issuer=${issuerAddress}`
      );

      if (!response.ok) {
        throw new Error('Failed to query proof status');
      }

      const result = await response.json();
      setProofStatus(result.data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    }
  };

  return (
    <div style={{
      maxWidth: '600px',
      margin: '0 auto',
      padding: '2rem',
      fontFamily: 'system-ui, -apple-system, sans-serif'
    }}>
      <h1 style={{ marginBottom: '2rem' }}>ZK Proof Generator</h1>

      {/* Error Display */}
      {error && (
        <div style={{
          padding: '1rem',
          marginBottom: '1rem',
          backgroundColor: '#fee',
          border: '1px solid #fcc',
          borderRadius: '4px',
          color: '#c00'
        }}>
          <strong>Error:</strong> {error}
        </div>
      )}

      {/* Proof Generation */}
      <section style={{ marginBottom: '2rem' }}>
        <h2>1. Generate Proof</h2>
        <button
          onClick={handleGenerateProof}
          disabled={isGenerating}
          style={{
            padding: '0.75rem 1.5rem',
            fontSize: '1rem',
            backgroundColor: isGenerating ? '#ccc' : '#007bff',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: isGenerating ? 'not-allowed' : 'pointer'
          }}
        >
          {isGenerating ? 'Generating...' : 'Generate Proof'}
        </button>

        {progress && (
          <div style={{ marginTop: '1rem' }}>
            <div style={{
              backgroundColor: '#f0f0f0',
              borderRadius: '4px',
              padding: '1rem'
            }}>
              <div style={{ marginBottom: '0.5rem' }}>
                <strong>Status:</strong> {progress.status}
              </div>
              <div style={{ marginBottom: '0.5rem' }}>
                <strong>Progress:</strong> {progress.progress}%
              </div>
              <div style={{
                height: '20px',
                backgroundColor: '#e0e0e0',
                borderRadius: '10px',
                overflow: 'hidden',
                marginBottom: '0.5rem'
              }}>
                <div style={{
                  height: '100%',
                  width: `${progress.progress}%`,
                  backgroundColor: '#28a745',
                  transition: 'width 0.3s ease'
                }} />
              </div>
              <div style={{ fontSize: '0.875rem', color: '#666' }}>
                {progress.message}
              </div>
            </div>
          </div>
        )}
      </section>

      {/* Proof Submission */}
      <section style={{ marginBottom: '2rem' }}>
        <h2>2. Submit Proof</h2>
        <button
          onClick={handleSubmitProof}
          disabled={isSubmitting || isGenerating || !progress || progress.status !== 'complete'}
          style={{
            padding: '0.75rem 1.5rem',
            fontSize: '1rem',
            backgroundColor: (isSubmitting || isGenerating || !progress || progress.status !== 'complete') ? '#ccc' : '#28a745',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: (isSubmitting || isGenerating || !progress || progress.status !== 'complete') ? 'not-allowed' : 'pointer'
          }}
        >
          {isSubmitting ? 'Submitting...' : 'Submit to Starknet'}
        </button>

        {txHash && (
          <div style={{
            marginTop: '1rem',
            padding: '1rem',
            backgroundColor: '#d4edda',
            border: '1px solid #c3e6cb',
            borderRadius: '4px',
            color: '#155724'
          }}>
            <strong>Transaction submitted!</strong>
            <div style={{
              marginTop: '0.5rem',
              fontSize: '0.875rem',
              wordBreak: 'break-all'
            }}>
              Hash: {txHash}
            </div>
          </div>
        )}
      </section>

      {/* Status Query */}
      <section style={{ marginBottom: '2rem' }}>
        <h2>3. Query Proof Status</h2>
        <button
          onClick={handleQueryStatus}
          disabled={!issuerAddress}
          style={{
            padding: '0.75rem 1.5rem',
            fontSize: '1rem',
            backgroundColor: !issuerAddress ? '#ccc' : '#17a2b8',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: !issuerAddress ? 'not-allowed' : 'pointer'
          }}
        >
          Query Status
        </button>

        {proofStatus && (
          <div style={{
            marginTop: '1rem',
            padding: '1rem',
            backgroundColor: '#f8f9fa',
            border: '1px solid #dee2e6',
            borderRadius: '4px'
          }}>
            <div style={{ marginBottom: '0.5rem' }}>
              <strong>Valid:</strong> {proofStatus.isValid ? 'Yes' : 'No'}
            </div>
            <div style={{ marginBottom: '0.5rem' }}>
              <strong>Fresh:</strong> {proofStatus.isFresh ? 'Yes' : 'No'}
            </div>
            {proofStatus.solvencyInfo && (
              <>
                <div style={{ marginBottom: '0.5rem' }}>
                  <strong>Tier:</strong> {proofStatus.solvencyInfo.tier}
                </div>
                <div style={{ marginBottom: '0.5rem' }}>
                  <strong>Last Proof:</strong>{' '}
                  {new Date(Number(proofStatus.solvencyInfo.last_proof_time) * 1000).toLocaleString()}
                </div>
                <div style={{ fontSize: '0.875rem', color: '#666' }}>
                  <strong>Merkle Root:</strong>{' '}
                  {proofStatus.solvencyInfo.merkle_root.toString().slice(0, 16)}...
                </div>
              </>
            )}
          </div>
        )}
      </section>
    </div>
  );
}
