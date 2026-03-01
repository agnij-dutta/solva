/**
 * GET /api/config
 *
 * Returns deployment configuration and contract addresses
 */

import { NextResponse } from 'next/server';
import type { ApiResponse, DeploymentConfig } from '@/types';
import { loadDeploymentConfig } from '@/lib/config';

export async function GET() {
  try {
    const config = await loadDeploymentConfig();

    const response: ApiResponse<DeploymentConfig> = {
      success: true,
      data: config,
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error('Error loading config:', error);

    const response: ApiResponse = {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to load deployment config',
      message: 'Make sure contracts are deployed (run ./scripts/deploy.sh)',
    };

    return NextResponse.json(response, { status: 500 });
  }
}
