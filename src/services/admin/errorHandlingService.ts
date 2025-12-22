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
  | 'text_processing'
  | 'quality_validation'
  | 'template_error'
  | 'enhancement_error'
  | 'unknown';

export interface AppError {
  type: ErrorType;
  message: string;
  originalError?: any;
  retryable: boolean;
  userMessage: string;
  suggestions?: string[];
  context?: Record<string, any>;
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

    // Text processing errors
    if (error.message?.includes('text processing') || error.message?.includes('enhancement')) {
      return {
        type: 'text_processing',
        message: 'Text processing failed',
        originalError: error,
        retryable: true,
        userMessage: 'Text processing failed. Please try again with different content.',
        suggestions: [
          'Check text format and encoding',
          'Reduce text length if too long',
          'Remove special characters that might cause issues'
        ]
      };
    }

    // Quality validation errors
    if (error.message?.includes('quality') || error.message?.includes('validation')) {
      return {
        type: 'quality_validation',
        message: 'Quality validation failed',
        originalError: error,
        retryable: false,
        userMessage: 'Content quality validation failed. Please review and improve the content.',
        suggestions: [
          'Review content structure and formatting',
          'Ensure all required elements are present',
          'Check grammar and readability'
        ]
      };
    }

    // Template errors
    if (error.message?.includes('template')) {
      return {
        type: 'template_error',
        message: 'Template processing failed',
        originalError: error,
        retryable: true,
        userMessage: 'Template processing failed. Please check template configuration.',
        suggestions: [
          'Verify template exists and is valid',
          'Check template parameters',
          'Try with a different template'
        ]
      };
    }

    // Enhancement errors
    if (error.message?.includes('enhance') || error.message?.includes('improvement')) {
      return {
        type: 'enhancement_error',
        message: 'Content enhancement failed',
        originalError: error,
        retryable: true,
        userMessage: 'Content enhancement failed. Proceeding with original content.',
        suggestions: [
          'Try with simpler content',
          'Check content length and complexity',
          'Disable enhancement if issues persist'
        ]
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
      suggestions: appError.suggestions,
    });

    // Show toast notification with enhanced options
    if (appError.type === 'payment_required') {
      toast.error(fullMessage, {
        duration: 5000,
        action: {
          label: 'Add Credits',
          onClick: () => window.open('https://docs.lovable.dev/features/ai', '_blank'),
        },
      });
    } else if (appError.suggestions && appError.suggestions.length > 0) {
      // Show error with first suggestion as description
      toast.error(fullMessage, {
        duration: 6000,
        description: appError.suggestions[0],
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
   * Handle text response specific errors
   */
  handleTextResponseError(error: any, context: {
    operation: string;
    textLength?: number;
    provider?: string;
    section?: string;
  }): AppError {
    const appError = this.parseError(error);
    
    // Add context-specific information
    appError.context = {
      ...context,
      category: 'text_response_generation',
      textMetrics: context.textLength ? {
        length: context.textLength,
        estimatedWords: Math.round(context.textLength / 5),
        complexity: context.textLength > 1000 ? 'high' : context.textLength > 500 ? 'medium' : 'low'
      } : undefined
    };

    // Enhanced error messages for text processing
    const contextMessage = `Text ${context.operation}`;
    const fullMessage = `${contextMessage}: ${appError.userMessage}`;

    console.error(`[Text Response Error] ${contextMessage}`, {
      ...appError,
      context: appError.context
    });

    // Show enhanced toast with context
    toast.error(fullMessage, {
      duration: 5000,
      description: appError.suggestions?.[0] || 'Check the content and try again',
    });

    return appError;
  },

  /**
   * Handle quality validation errors with detailed feedback
   */
  handleQualityValidationError(error: any, context: {
    validationRules?: string[];
    contentType?: string;
    qualityScore?: number;
  }): AppError {
    const appError = this.parseError(error);
    
    // Add quality-specific context
    appError.context = {
      ...context,
      category: 'quality_validation',
      validationMetrics: {
        rulesApplied: context.validationRules?.length || 0,
        score: context.qualityScore || 0,
        contentType: context.contentType || 'unknown'
      }
    };

    const contextMessage = `Quality Validation (Score: ${context.qualityScore || 0})`;
    const fullMessage = `${contextMessage}: ${appError.userMessage}`;

    console.error(`[Quality Validation Error] ${contextMessage}`, {
      ...appError,
      context: appError.context
    });

    // Show quality-specific toast
    toast.error(fullMessage, {
      duration: 6000,
      description: `Content needs improvement. ${appError.suggestions?.[0] || 'Review quality guidelines'}`,
    });

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
