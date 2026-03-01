/**
 * In-memory session management for proof generation progress tracking
 */

import type { ProofGenerationProgress } from '@/types';

export interface ProofSession {
  sessionId: string;
  startTime: number;
  progress: ProofGenerationProgress[];
  isComplete: boolean;
  error: string | null;
}

// In-memory session storage (consider Redis for production)
export const activeProofSessions = new Map<string, ProofSession>();

// Cleanup old sessions after 1 hour
const SESSION_TIMEOUT = 60 * 60 * 1000; // 1 hour

setInterval(() => {
  const now = Date.now();
  for (const [sessionId, session] of activeProofSessions.entries()) {
    if (now - session.startTime > SESSION_TIMEOUT) {
      activeProofSessions.delete(sessionId);
    }
  }
}, 5 * 60 * 1000); // Check every 5 minutes
