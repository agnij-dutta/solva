/**
 * Script execution utilities for wrapping existing bash/Python scripts
 */

import { spawn } from 'child_process';
import { join } from 'path';
import { SCRIPTS_DIR, CIRCUITS_DIR } from './config';
import type { ProofGenerationProgress, ProofStatus } from '@/types';

export type ProgressCallback = (progress: ProofGenerationProgress) => void;

/**
 * Execute prove.sh script with progress tracking
 */
export async function executeProveScript(
  useSampleData: boolean,
  onProgress: ProgressCallback
): Promise<void> {
  return new Promise((resolve, reject) => {
    const scriptPath = join(SCRIPTS_DIR, 'prove.sh');
    const args = useSampleData ? ['--sample'] : [];

    const child = spawn(scriptPath, args, {
      cwd: SCRIPTS_DIR,
      env: { ...process.env },
    });

    let currentStatus: ProofStatus = 'fetching_utxos';
    let currentProgress = 0;

    child.stdout.on('data', (data: Buffer) => {
      const output = data.toString();
      console.log('[prove.sh]', output);

      // Parse script output to determine progress
      if (output.includes('[1/5] Fetching Bitcoin reserve data')) {
        currentStatus = 'fetching_utxos';
        currentProgress = 10;
      } else if (output.includes('[2/5] Building Merkle tree')) {
        currentStatus = 'building_tree';
        currentProgress = 30;
      } else if (output.includes('[3/5] Compiling Noir circuit')) {
        currentStatus = 'compiling_circuit';
        currentProgress = 50;
      } else if (output.includes('[4/5] Generating witness')) {
        currentStatus = 'generating_witness';
        currentProgress = 70;
      } else if (output.includes('[5/5] Generating UltraKeccakHonk proof')) {
        currentStatus = 'proving';
        currentProgress = 85;
      } else if (output.includes('Local Verification')) {
        currentStatus = 'verifying';
        currentProgress = 95;
      } else if (output.includes('Proof verified locally!')) {
        currentStatus = 'complete';
        currentProgress = 100;
      }

      onProgress({
        status: currentStatus,
        message: output.trim(),
        progress: currentProgress,
        timestamp: Date.now(),
      });
    });

    child.stderr.on('data', (data: Buffer) => {
      const error = data.toString();
      console.error('[prove.sh error]', error);

      onProgress({
        status: 'error',
        message: error.trim(),
        progress: currentProgress,
        timestamp: Date.now(),
        error,
      });
    });

    child.on('close', (code) => {
      if (code === 0) {
        onProgress({
          status: 'complete',
          message: 'Proof generation completed successfully',
          progress: 100,
          timestamp: Date.now(),
        });
        resolve();
      } else {
        const errorMsg = `prove.sh exited with code ${code}`;
        onProgress({
          status: 'error',
          message: errorMsg,
          progress: currentProgress,
          timestamp: Date.now(),
          error: errorMsg,
        });
        reject(new Error(errorMsg));
      }
    });

    child.on('error', (error) => {
      const errorMsg = `Failed to start prove.sh: ${error.message}`;
      onProgress({
        status: 'error',
        message: errorMsg,
        progress: currentProgress,
        timestamp: Date.now(),
        error: errorMsg,
      });
      reject(error);
    });
  });
}

/**
 * Execute submit_proof.py script
 */
export async function executeSubmitProofScript(
  registryAddress: string,
  account?: string
): Promise<string> {
  return new Promise((resolve, reject) => {
    const scriptPath = join(SCRIPTS_DIR, 'submit_proof.py');
    const proofPath = join(CIRCUITS_DIR, 'proof');
    const vkPath = join(CIRCUITS_DIR, 'vk');

    const args = [
      scriptPath,
      '--proof',
      proofPath,
      '--vk',
      vkPath,
      '--registry-address',
      registryAddress,
    ];

    if (account) {
      args.push('--account', account);
    }

    const child = spawn('python3', args, {
      cwd: SCRIPTS_DIR,
      env: { ...process.env },
    });

    let output = '';
    let errorOutput = '';

    child.stdout.on('data', (data: Buffer) => {
      const text = data.toString();
      output += text;
      console.log('[submit_proof.py]', text);
    });

    child.stderr.on('data', (data: Buffer) => {
      const text = data.toString();
      errorOutput += text;
      console.error('[submit_proof.py error]', text);
    });

    child.on('close', (code) => {
      if (code === 0) {
        // Extract transaction hash from output if available
        const txHashMatch = output.match(/transaction_hash[:\s]+([0-9a-fx]+)/i);
        const txHash = txHashMatch ? txHashMatch[1] : 'unknown';
        resolve(txHash);
      } else {
        reject(
          new Error(
            `submit_proof.py exited with code ${code}: ${errorOutput || output}`
          )
        );
      }
    });

    child.on('error', (error) => {
      reject(new Error(`Failed to start submit_proof.py: ${error.message}`));
    });
  });
}

/**
 * Check if proof artifacts exist
 */
export async function checkProofArtifacts(): Promise<{
  hasProof: boolean;
  hasVk: boolean;
}> {
  const { access } = await import('fs/promises');
  const { constants } = await import('fs');

  const proofPath = join(CIRCUITS_DIR, 'proof');
  const vkPath = join(CIRCUITS_DIR, 'vk');

  const hasProof = await access(proofPath, constants.F_OK)
    .then(() => true)
    .catch(() => false);

  const hasVk = await access(vkPath, constants.F_OK)
    .then(() => true)
    .catch(() => false);

  return { hasProof, hasVk };
}
