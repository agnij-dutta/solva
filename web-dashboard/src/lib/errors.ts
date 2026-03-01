/**
 * Custom error classes for better error handling
 */

export class ScriptExecutionError extends Error {
  constructor(
    message: string,
    public scriptName: string,
    public exitCode?: number,
    public stderr?: string
  ) {
    super(message);
    this.name = 'ScriptExecutionError';
  }
}

export class StarknetError extends Error {
  constructor(
    message: string,
    public operation: string,
    public cause?: unknown
  ) {
    super(message);
    this.name = 'StarknetError';
  }
}

export class ConfigurationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ConfigurationError';
  }
}

export class ProofArtifactError extends Error {
  constructor(
    message: string,
    public missingArtifacts: string[]
  ) {
    super(message);
    this.name = 'ProofArtifactError';
  }
}

/**
 * Format error for API response
 */
export function formatErrorResponse(error: unknown): {
  error: string;
  details?: Record<string, unknown>;
} {
  if (error instanceof ScriptExecutionError) {
    return {
      error: error.message,
      details: {
        script: error.scriptName,
        exitCode: error.exitCode,
        stderr: error.stderr,
      },
    };
  }

  if (error instanceof StarknetError) {
    return {
      error: error.message,
      details: {
        operation: error.operation,
        cause: String(error.cause),
      },
    };
  }

  if (error instanceof ConfigurationError) {
    return {
      error: error.message,
      details: {
        type: 'configuration',
      },
    };
  }

  if (error instanceof ProofArtifactError) {
    return {
      error: error.message,
      details: {
        missingArtifacts: error.missingArtifacts,
      },
    };
  }

  if (error instanceof Error) {
    return {
      error: error.message,
    };
  }

  return {
    error: String(error),
  };
}
