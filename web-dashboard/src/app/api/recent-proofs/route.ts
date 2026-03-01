/**
 * GET /api/recent-proofs?limit=10
 *
 * Fetches recent solvency proofs from Starknet registry events
 */

import { NextRequest, NextResponse } from 'next/server';
import type { ApiResponse, ProofRecord } from '@/types';
import { fetchRecentProofs } from '@/lib/starknet';

export async function GET(request: NextRequest) {
  try {
    const limitParam = request.nextUrl.searchParams.get('limit');
    const limit = limitParam ? parseInt(limitParam, 10) : 10;

    if (isNaN(limit) || limit < 1 || limit > 100) {
      const response: ApiResponse = {
        success: false,
        error: 'Invalid limit parameter (must be 1-100)',
      };
      return NextResponse.json(response, { status: 400 });
    }

    const proofs = await fetchRecentProofs(limit);

    const response: ApiResponse<ProofRecord[]> = {
      success: true,
      data: proofs,
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error('Error fetching recent proofs:', error);

    const response: ApiResponse = {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to fetch recent proofs',
    };

    return NextResponse.json(response, { status: 500 });
  }
}
