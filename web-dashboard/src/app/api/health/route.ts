/**
 * GET /api/health
 *
 * Health check endpoint for monitoring
 */

import { NextResponse } from 'next/server';
import type { ApiResponse } from '@/types';

export async function GET() {
  const response: ApiResponse<{ status: string; timestamp: number }> = {
    success: true,
    data: {
      status: 'healthy',
      timestamp: Date.now(),
    },
  };

  return NextResponse.json(response);
}
