/**
 * GET /api/generate-proof/stream?sessionId=xxx
 *
 * Server-Sent Events endpoint for streaming proof generation progress
 */

import { NextRequest } from 'next/server';
import { activeProofSessions } from '../sessions';

export async function GET(request: NextRequest) {
  const sessionId = request.nextUrl.searchParams.get('sessionId');

  if (!sessionId) {
    return new Response('Missing sessionId parameter', { status: 400 });
  }

  const session = activeProofSessions.get(sessionId);
  if (!session) {
    return new Response('Session not found', { status: 404 });
  }

  // Create readable stream for SSE
  const encoder = new TextEncoder();
  let lastSentIndex = 0;

  const stream = new ReadableStream({
    start(controller) {
      const sendEvents = () => {
        const session = activeProofSessions.get(sessionId);
        if (!session) {
          controller.close();
          return;
        }

        // Send new progress events
        while (lastSentIndex < session.progress.length) {
          const progress = session.progress[lastSentIndex];
          const data = JSON.stringify(progress);
          controller.enqueue(encoder.encode(`data: ${data}\n\n`));
          lastSentIndex++;
        }

        // Check if session is complete
        if (session.isComplete) {
          // Send final completion event
          const finalEvent = {
            status: session.error ? 'error' : 'complete',
            message: session.error || 'Proof generation complete',
            progress: session.error ? session.progress[session.progress.length - 1]?.progress || 0 : 100,
            timestamp: Date.now(),
            error: session.error || undefined,
          };
          controller.enqueue(encoder.encode(`data: ${JSON.stringify(finalEvent)}\n\n`));
          controller.close();
        } else {
          // Continue polling
          setTimeout(sendEvents, 500);
        }
      };

      sendEvents();
    },
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
    },
  });
}
