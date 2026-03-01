/**
 * GET /api/proof-status?issuer=0x...
 *
 * Queries the Starknet SolvencyRegistry for proof status of a specific issuer
 */

import { NextRequest, NextResponse } from 'next/server';
import type { ApiResponse, ProofStatusResponse } from '@/types';
import { querySolvencyInfo, checkIsSolvent } from '@/lib/starknet';

export async function GET(request: NextRequest) {
  try {
    const issuer = request.nextUrl.searchParams.get('issuer');

    if (!issuer) {
      const response: ApiResponse = {
        success: false,
        error: 'Missing issuer address parameter',
      };
      return NextResponse.json(response, { status: 400 });
    }

    // Query solvency info from registry
    const [solvencyInfo, isSolvent] = await Promise.all([
      querySolvencyInfo(issuer),
      checkIsSolvent(issuer),
    ]);

    const data: ProofStatusResponse = {
      issuer,
      solvencyInfo,
      isValid: solvencyInfo?.is_valid ?? false,
      isFresh: isSolvent,
    };

    const response: ApiResponse<ProofStatusResponse> = {
      success: true,
      data,
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error('Error querying proof status:', error);

    const response: ApiResponse = {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to query proof status',
    };

    return NextResponse.json(response, { status: 500 });
  }
}
