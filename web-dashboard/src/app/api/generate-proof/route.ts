/**
 * POST /api/generate-proof
 *
 * Triggers the prove.sh script and returns a session ID.
 * Progress can be tracked via Server-Sent Events at /api/generate-proof/stream
 */

import { NextRequest, NextResponse } from 'next/server';
import { randomUUID } from 'crypto';
import type { ApiResponse, GenerateProofRequest } from '@/types';
import { executeProveScript } from '@/lib/scripts';
import { activeProofSessions } from './sessions';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json() as GenerateProofRequest;
    const useSampleData = body.useSampleData ?? true;

    // Generate session ID for tracking progress
    const sessionId = randomUUID();

    // Initialize session
    activeProofSessions.set(sessionId, {
      sessionId,
      startTime: Date.now(),
      progress: [],
      isComplete: false,
      error: null,
    });

    // Execute proof generation in background
    executeProveScript(useSampleData, (progress) => {
      const session = activeProofSessions.get(sessionId);
      if (session) {
        session.progress.push(progress);

        if (progress.status === 'complete') {
          session.isComplete = true;
        } else if (progress.status === 'error') {
          session.error = progress.error || progress.message;
          session.isComplete = true;
        }
      }
    }).catch((error) => {
      const session = activeProofSessions.get(sessionId);
      if (session) {
        session.error = error.message;
        session.isComplete = true;
      }
    });

    const response: ApiResponse<{ sessionId: string }> = {
      success: true,
      data: { sessionId },
      message: 'Proof generation started',
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error('Error starting proof generation:', error);

    const response: ApiResponse = {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };

    return NextResponse.json(response, { status: 500 });
  }
}
