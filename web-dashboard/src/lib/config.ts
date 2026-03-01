/**
 * Configuration management for Solva Dashboard
 */

import { readFile } from 'fs/promises';
import { join } from 'path';
import type { DeploymentConfig } from '@/types';

export const PROJECT_ROOT = join(process.cwd(), '..');
export const SCRIPTS_DIR = join(PROJECT_ROOT, 'scripts');
export const CIRCUITS_DIR = join(PROJECT_ROOT, 'circuits', 'solvency_circuit');
export const DEPLOYMENTS_FILE = join(PROJECT_ROOT, 'deployments.json');

export const DEFAULT_RPC_URL = 'https://free-rpc.nethermind.io/sepolia-juno/v0_7';

let cachedDeployment: DeploymentConfig | null = null;

/**
 * Load deployment configuration from deployments.json
 */
export async function loadDeploymentConfig(): Promise<DeploymentConfig> {
  if (cachedDeployment) {
    return cachedDeployment;
  }

  try {
    const content = await readFile(DEPLOYMENTS_FILE, 'utf-8');
    cachedDeployment = JSON.parse(content) as DeploymentConfig;
    return cachedDeployment;
  } catch (error) {
    throw new Error(
      `Failed to load deployment config from ${DEPLOYMENTS_FILE}. ` +
      `Have you run ./scripts/deploy.sh yet? Error: ${error}`
    );
  }
}

/**
 * Get RPC URL from deployment config or fallback to default
 */
export async function getRpcUrl(): Promise<string> {
  try {
    const config = await loadDeploymentConfig();
    return config.rpc_url || DEFAULT_RPC_URL;
  } catch {
    return DEFAULT_RPC_URL;
  }
}

/**
 * Get registry contract address from deployment config
 */
export async function getRegistryAddress(): Promise<string> {
  const config = await loadDeploymentConfig();
  if (!config.contracts.solvency_registry) {
    throw new Error('Registry address not found in deployment config');
  }
  return config.contracts.solvency_registry;
}

/**
 * Reset cached deployment config (useful after redeployment)
 */
export function resetDeploymentCache(): void {
  cachedDeployment = null;
}
