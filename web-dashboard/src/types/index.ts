/**
 * Shared TypeScript types for Solva Web Dashboard
 */

export enum ProofStatus {
  IDLE = 'idle',
  FETCHING_UTXOS = 'fetching_utxos',
  BUILDING_TREE = 'building_tree',
  COMPILING_CIRCUIT = 'compiling_circuit',
  GENERATING_WITNESS = 'generating_witness',
  PROVING = 'proving',
  VERIFYING = 'verifying',
  COMPLETE = 'complete',
  ERROR = 'error',
}

export enum SolvencyTier {
  None = 'None',
  TierC = 'TierC',
  TierB = 'TierB',
  TierA = 'TierA',
}

export interface ProofGenerationProgress {
  status: ProofStatus;
  message: string;
  progress: number; // 0-100
  timestamp: number;
  error?: string;
}

export interface SolvencyInfo {
  last_proof_time: bigint;
  merkle_root: bigint;
  total_liabilities: bigint;
  is_valid: boolean;
  tier: SolvencyTier;
}

export interface ProofRecord {
  issuer: string;
  merkle_root: string;
  total_liabilities: string;
  tier: SolvencyTier;
  timestamp: number;
  transaction_hash: string;
}

export interface ContractAddresses {
  solvency_verifier: string;
  solva_token: string;
  solvency_registry: string;
  lending_protocol: string;
}

export interface DeploymentConfig {
  network: string;
  rpc_url: string;
  contracts: ContractAddresses;
  deployed_at: string;
}

export interface GenerateProofRequest {
  useSampleData: boolean;
}

export interface SubmitProofRequest {
  proofPath?: string;
  vkPath?: string;
  account?: string;
}

export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface ProofStatusResponse {
  issuer: string;
  solvencyInfo: SolvencyInfo | null;
  isValid: boolean;
  isFresh: boolean;
}
