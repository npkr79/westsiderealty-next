import { errorHandlingService } from "./errorHandlingService";

export interface RetryOptions {
  maxAttempts?: number;
  delayMs?: number;
  backoffMultiplier?: number;
  maxDelayMs?: number;
  retryableErrors?: string[];
  onRetry?: (attempt: number, error: any) => void;
}

/**
 * Retry service for handling transient failures
 */
export const retryService = {
  /**
   * Execute function with retry logic
   */
  async withRetry<T>(
    fn: () => Promise<T>,
    options: RetryOptions = {}
  ): Promise<T> {
    const {
      maxAttempts = 3,
      delayMs = 1000,
      backoffMultiplier = 2,
      maxDelayMs = 10000,
      retryableErrors = ['network', 'timeout', 'rate_limit', 'server'],
      onRetry,
    } = options;

    let lastError: any;
    let currentDelay = delayMs;

    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      try {
        return await fn();
      } catch (error) {
        lastError = error;

        // Parse error to determine if retryable
        const appError = errorHandlingService.parseError(error);
        
        // Don't retry if not retryable or last attempt
        if (!appError.retryable || attempt === maxAttempts) {
          throw error;
        }

        // Check if error type is in retryable list
        if (!retryableErrors.includes(appError.type)) {
          throw error;
        }

        console.log(
          `Retry attempt ${attempt}/${maxAttempts} after ${currentDelay}ms for error:`,
          appError.type
        );

        // Call onRetry callback
        if (onRetry) {
          onRetry(attempt, error);
        }

        // Wait before retry
        await this.delay(currentDelay);

        // Increase delay for next attempt (exponential backoff)
        currentDelay = Math.min(currentDelay * backoffMultiplier, maxDelayMs);
      }
    }

    throw lastError;
  },

  /**
   * Delay helper
   */
  delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  },

  /**
   * Execute with timeout
   */
  async withTimeout<T>(
    fn: () => Promise<T>,
    timeoutMs: number,
    timeoutMessage = 'Operation timed out'
  ): Promise<T> {
    return Promise.race([
      fn(),
      this.delay(timeoutMs).then(() => {
        throw new Error(timeoutMessage);
      }),
    ]);
  },

  /**
   * Execute with retry and timeout
   */
  async withRetryAndTimeout<T>(
    fn: () => Promise<T>,
    retryOptions: RetryOptions = {},
    timeoutMs: number = 30000
  ): Promise<T> {
    return this.withRetry(
      () => this.withTimeout(fn, timeoutMs),
      retryOptions
    );
  },

  /**
   * Batch execution with retry
   */
  async batchWithRetry<T>(
    items: T[],
    fn: (item: T) => Promise<any>,
    options: RetryOptions & { concurrency?: number } = {}
  ): Promise<Array<{ item: T; result?: any; error?: any }>> {
    const { concurrency = 3, ...retryOptions } = options;
    const results: Array<{ item: T; result?: any; error?: any }> = [];

    // Process in batches
    for (let i = 0; i < items.length; i += concurrency) {
      const batch = items.slice(i, i + concurrency);
      
      const batchResults = await Promise.allSettled(
        batch.map(item =>
          this.withRetry(() => fn(item), retryOptions)
            .then(result => ({ item, result }))
            .catch(error => ({ item, error }))
        )
      );

      batchResults.forEach(result => {
        if (result.status === 'fulfilled') {
          results.push(result.value);
        } else {
          results.push({ 
            item: batch[results.length % batch.length], 
            error: result.reason 
          });
        }
      });
    }

    return results;
  },
};
