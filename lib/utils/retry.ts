import { RetryOptions } from '../types/dex';

export class RetryError extends Error {
  public readonly attempts: number;
  
  constructor(message: string, attempts: number) {
    super(message);
    this.attempts = attempts;
    this.name = 'RetryError';
  }
}

export async function withRetry<T>(
  operation: () => Promise<T>,
  options: RetryOptions = {
    maxAttempts: 3,
    initialDelay: 1000,
    maxDelay: 10000,
    backoffFactor: 2
  }
): Promise<T> {
  let lastError: Error | null = null;
  let delay = options.initialDelay;

  for (let attempt = 1; attempt <= options.maxAttempts; attempt++) {
    try {
      return await operation();
    } catch (error) {
      lastError = error as Error;
      
      // If this was the last attempt, throw the error
      if (attempt === options.maxAttempts) {
        throw new RetryError(
          `Operation failed after ${attempt} attempts: ${lastError.message}`,
          attempt
        );
      }

      // Wait before retrying
      await new Promise(resolve => setTimeout(resolve, delay));
      
      // Calculate next delay with exponential backoff
      delay = Math.min(delay * options.backoffFactor, options.maxDelay);
    }
  }

  // This should never happen due to the throw above
  throw new Error('Unexpected retry failure');
}
