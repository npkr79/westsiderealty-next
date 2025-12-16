import { toast } from "sonner";

export type ErrorType = 
  | 'validation'
  | 'network'
  | 'api'
  | 'rate_limit'
  | 'payment_required'
  | 'not_found'
  | 'server'
  | 'timeout'
  | 'unknown';

export interface AppError {
  type: ErrorType;
  message: string;
  originalError?: any;
  retryable: boolean;
  userMessage: string;
}

/**
 * Error handling service for content generation
 */
export const errorHandlingService = {
  /**
   * Parse and classify errors
   */
  parseError(error: any): AppError {
    // Validation errors
    if (error.name === 'ZodError') {
      return {
        type: 'validation',
        message: 'Validation failed',
        originalError: error,
        retryable: false,
        userMessage: 'Please check your input and try again.',
      };
    }

    // Network errors
    if (error.name === 'TypeError' && error.message.includes('fetch')) {
      return {
        type: 'network',
        message: 'Network connection failed',
        originalError: error,
        retryable: true,
        userMessage: 'Connection failed. Please check your internet and try again.',
      };
    }

    // Rate limit errors
    if (error.status === 429 || error.message?.includes('rate limit')) {
      return {
        type: 'rate_limit',
        message: 'Rate limit exceeded',
        originalError: error,
        retryable: true,
        userMessage: 'Too many requests. Please wait a moment and try again.',
      };
    }

    // Payment required errors
    if (error.status === 402 || error.message?.includes('payment')) {
      return {
        type: 'payment_required',
        message: 'Payment required',
        originalError: error,
        retryable: false,
        userMessage: 'Please add credits to your account to continue.',
      };
    }

    // Not found errors
    if (error.status === 404) {
      return {
        type: 'not_found',
        message: 'Resource not found',
        originalError: error,
        retryable: false,
        userMessage: 'The requested resource was not found.',
      };
    }

    // Server errors
    if (error.status >= 500) {
      return {
        type: 'server',
        message: 'Server error',
        originalError: error,
        retryable: true,
        userMessage: 'Server error. Please try again in a moment.',
      };
    }

    // Timeout errors
    if (error.name === 'TimeoutError' || error.message?.includes('timeout')) {
      return {
        type: 'timeout',
        message: 'Request timeout',
        originalError: error,
        retryable: true,
        userMessage: 'Request timed out. Please try again.',
      };
    }

    // API errors
    if (error.message) {
      return {
        type: 'api',
        message: error.message,
        originalError: error,
        retryable: false,
        userMessage: error.message,
      };
    }

    // Unknown errors
    return {
      type: 'unknown',
      message: 'An unexpected error occurred',
      originalError: error,
      retryable: true,
      userMessage: 'Something went wrong. Please try again.',
    };
  },

  /**
   * Handle error with toast notification
   */
  handleError(error: any, context?: string): AppError {
    const appError = this.parseError(error);
    
    const contextMessage = context ? `${context}: ` : '';
    const fullMessage = `${contextMessage}${appError.userMessage}`;

    // Log to console for debugging
    console.error(`[Error] ${contextMessage}`, {
      type: appError.type,
      message: appError.message,
      retryable: appError.retryable,
      originalError: appError.originalError,
    });

    // Show toast notification
    if (appError.type === 'payment_required') {
      toast.error(fullMessage, {
        duration: 5000,
        action: {
          label: 'Add Credits',
          onClick: () => window.open('https://docs.lovable.dev/features/ai', '_blank'),
        },
      });
    } else if (appError.retryable) {
      toast.error(fullMessage, {
        duration: 4000,
      });
    } else {
      toast.error(fullMessage, {
        duration: 3000,
      });
    }

    return appError;
  },

  /**
   * Handle success with toast notification
   */
  handleSuccess(message: string) {
    toast.success(message);
  },

  /**
   * Handle warning with toast notification
   */
  handleWarning(message: string) {
    toast.warning(message);
  },

  /**
   * Handle info with toast notification
   */
  handleInfo(message: string) {
    toast.info(message);
  },
};
