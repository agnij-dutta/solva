/**
 * POST /api/submit-proof
 *
 * Submits a generated proof to the Starknet SolvencyRegistry
 */

import { NextRequest, NextResponse } from 'next/server';
import type { ApiResponse, SubmitProofRequest } from '@/types';
import { executeSubmitProofScript, checkProofArtifacts } from '@/lib/scripts';
import { getRegistryAddress } from '@/lib/config';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json() as SubmitProofRequest;

    // Check if proof artifacts exist
    const { hasProof, hasVk } = await checkProofArtifacts();

    if (!hasProof || !hasVk) {
      const response: ApiResponse = {
        success: false,
        error: 'Proof artifacts not found. Generate a proof first.',
      };
      return NextResponse.json(response, { status: 400 });
    }

    // Get registry address from deployment config
    const registryAddress = await getRegistryAddress();

    // Execute submit_proof.py script
    const txHash = await executeSubmitProofScript(
      registryAddress,
      body.account
    );

    const response: ApiResponse<{ transactionHash: string }> = {
      success: true,
      data: { transactionHash: txHash },
      message: 'Proof submitted successfully',
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error('Error submitting proof:', error);

    const response: ApiResponse = {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to submit proof',
    };

    return NextResponse.json(response, { status: 500 });
  }
}
