// Type definitions for Sample Response Generation System

export type SampleResponseType = 'market_analysis' | 'property_description' | 'investment_advice' | 'location_overview' | 'custom';

export type ResponseLength = 'short' | 'medium' | 'long';

export type ResponseTone = 'professional' | 'conversational' | 'technical' | 'marketing';

export type ContextVariableType = 'string' | 'number' | 'array' | 'boolean';

export interface ContextVariable {
  type: ContextVariableType;
  description: string;
  defaultValue?: any;
  options?: any[];
  required?: boolean;
  validation?: {
    min?: number;
    max?: number;
    pattern?: string;
    customValidator?: (value: any) => boolean;
  };
}

export interface SampleResponseContext {
  // Location-based context
  cityName?: string;
  micromarketName?: string;
  locationName?: string;
  distanceFromCenter?: string;
  connectivity?: string[];
  
  // Project-specific context
  projectName?: string;
  developerName?: string;
  propertyType?: string;
  configurations?: string[];
  totalUnits?: number;
  projectArea?: string;
  
  // Pricing context
  avgPrice?: number;
  priceRange?: string;
  startingPrice?: string;
  pricePerSqft?: number;
  budgetRange?: string;
  
  // Market context
  appreciation?: number;
  rentalYield?: number;
  marketTrend?: string;
  demandLevel?: string;
  growthPotential?: string;
  
  // Investment context
  investorType?: string;
  timeframe?: string;
  expectedReturns?: string;
  riskLevel?: string;
  
  // Amenities and features
  amenities?: string[];
  keyFeatures?: string[];
  uniqueSellingPoints?: string[];
  
  // Target audience
  targetBuyers?: string[];
  buyerSegments?: string[];
  
  // Additional context
  [key: string]: any;
}

export interface SampleResponseRequest {
  type: SampleResponseType;
  templateId?: string;
  context?: SampleResponseContext;
  customPrompt?: string;
  length?: ResponseLength;
  tone?: ResponseTone;
  includeMetadata?: boolean;
  saveToHistory?: boolean;
}

export interface SampleResponseMetadata {
  tone: string;
  length: string;
  processingTime: number;
  template?: string;
  version: string;
  generationMethod: 'template' | 'ai' | 'hybrid';
  contextVariablesUsed: string[];
  qualityChecks: {
    lengthCompliance: boolean;
    contentRelevance: boolean;
    toneConsistency: boolean;
    structureValid: boolean;
  };
}

export interface QualityAssessment {
  score: number; // 0-1 scale
  factors: {
    relevance: number;
    coherence: number;
    completeness: number;
    engagement: number;
  };
  suggestions?: string[];
  warnings?: string[];
}

export interface SampleResponseResult {
  id: string;
  templateId?: string;
  type: SampleResponseType;
  content: string;
  wordCount: number;
  characterCount: number;
  generatedAt: string;
  context?: SampleResponseContext;
  metadata: SampleResponseMetadata;
  quality?: QualityAssessment;
  variations?: {
    [key in ResponseLength]?: string;
  };
  alternativeTones?: {
    [key in ResponseTone]?: string;
  };
}

export interface SampleResponseTemplate {
  id: string;
  name: string;
  type: SampleResponseType;
  description: string;
  category: string;
  tags: string[];
  isActive: boolean;
  defaultContext: SampleResponseContext;
  requiredContext: string[];
  optionalContext: string[];
  variations: {
    [key in ResponseLength]: {
      template: string;
      targetWordCount: number;
      structure: string[];
    };
  };
  toneAdaptations: {
    [key in ResponseTone]: {
      vocabulary: string;
      style: string;
      perspective: string;
      modifications: Record<string, string>;
    };
  };
  examples: {
    length: ResponseLength;
    tone: ResponseTone;
    context: SampleResponseContext;
    output: string;
  }[];
  createdAt: string;
  updatedAt: string;
  createdBy: string;
  version: string;
}

export interface SampleResponseConfig {
  templates: SampleResponseTemplate[];
  contextVariables: Record<string, ContextVariable>;
  lengthTargets: {
    [key in ResponseLength]: {
      min: number;
      max: number;
      target: number;
      description: string;
    };
  };
  toneGuidelines: {
    [key in ResponseTone]: {
      description: string;
      characteristics: string[];
      vocabulary: string[];
      avoidWords: string[];
      examplePhrases: string[];
    };
  };
  qualityThresholds: {
    minimum: number;
    good: number;
    excellent: number;
  };
  generationSettings: {
    maxRetries: number;
    timeoutMs: number;
    cacheResults: boolean;
    enableVariations: boolean;
  };
}

export interface SampleResponseHistory {
  id: string;
  templateId?: string;
  type: SampleResponseType;
  content: string;
  wordCount: number;
  characterCount: number;
  context: SampleResponseContext;
  metadata: SampleResponseMetadata;
  qualityScore: number;
  qualityFactors: QualityAssessment['factors'];
  createdAt: string;
  userId?: string;
  sessionId?: string;
  feedback?: {
    rating: number;
    comments: string;
    useful: boolean;
  };
}

export interface SampleResponseAnalytics {
  totalGenerated: number;
  byType: Record<SampleResponseType, number>;
  byLength: Record<ResponseLength, number>;
  byTone: Record<ResponseTone, number>;
  averageQualityScore: number;
  averageWordCount: number;
  averageProcessingTime: number;
  popularTemplates: {
    templateId: string;
    name: string;
    usageCount: number;
  }[];
  qualityDistribution: {
    excellent: number;
    good: number;
    fair: number;
    poor: number;
  };
  userSatisfaction: {
    averageRating: number;
    totalFeedback: number;
    positivePercentage: number;
  };
  trends: {
    dailyGeneration: { date: string; count: number }[];
    typePopularity: { type: SampleResponseType; trend: 'up' | 'down' | 'stable' }[];
  };
}

export interface SampleResponseError {
  code: string;
  message: string;
  details?: any;
  timestamp: string;
  context?: SampleResponseContext;
  templateId?: string;
}

// API Response types
export interface SampleResponseApiResponse {
  success: boolean;
  data?: SampleResponseResult;
  error?: SampleResponseError;
  metadata?: {
    requestId: string;
    processingTime: number;
    version: string;
  };
}

export interface SampleResponseListApiResponse {
  success: boolean;
  data?: SampleResponseResult[];
  pagination?: {
    page: number;
    limit: number;
    total: number;
    hasMore: boolean;
  };
  error?: SampleResponseError;
}

export interface SampleResponseTemplateApiResponse {
  success: boolean;
  data?: SampleResponseTemplate[];
  error?: SampleResponseError;
}

export interface SampleResponseAnalyticsApiResponse {
  success: boolean;
  data?: SampleResponseAnalytics;
  error?: SampleResponseError;
}

// UI Component Props
export interface SampleResponseGeneratorProps {
  initialType?: SampleResponseType;
  initialContext?: SampleResponseContext;
  onGenerate?: (response: SampleResponseResult) => void;
  onError?: (error: SampleResponseError) => void;
  showAdvancedOptions?: boolean;
  enableSaveToHistory?: boolean;
  className?: string;
}

export interface SampleResponseDisplayProps {
  response: SampleResponseResult;
  showMetadata?: boolean;
  showQuality?: boolean;
  enableCopy?: boolean;
  enableEdit?: boolean;
  enableRegenerate?: boolean;
  onCopy?: (content: string) => void;
  onEdit?: (response: SampleResponseResult) => void;
  onRegenerate?: (context: SampleResponseContext) => void;
  className?: string;
}

export interface SampleResponseHistoryProps {
  responses: SampleResponseHistory[];
  onSelect?: (response: SampleResponseHistory) => void;
  onDelete?: (id: string) => void;
  onFeedback?: (id: string, feedback: SampleResponseHistory['feedback']) => void;
  showFilters?: boolean;
  showAnalytics?: boolean;
  className?: string;
}

export interface SampleResponseTemplateManagerProps {
  templates: SampleResponseTemplate[];
  onCreateTemplate?: (template: Omit<SampleResponseTemplate, 'id' | 'createdAt' | 'updatedAt'>) => void;
  onUpdateTemplate?: (template: SampleResponseTemplate) => void;
  onDeleteTemplate?: (id: string) => void;
  onDuplicateTemplate?: (template: SampleResponseTemplate) => void;
  showPreview?: boolean;
  className?: string;
}

// Utility types
export type SampleResponseContextKey = keyof SampleResponseContext;

export type SampleResponseValidationResult = {
  isValid: boolean;
  errors: string[];
  warnings: string[];
};

export type SampleResponseGenerationOptions = {
  enableCache: boolean;
  maxRetries: number;
  timeoutMs: number;
  qualityThreshold: number;
  generateVariations: boolean;
  includeSuggestions: boolean;
};

// Constants
export const SAMPLE_RESPONSE_TYPES: Record<SampleResponseType, string> = {
  market_analysis: 'Market Analysis',
  property_description: 'Property Description',
  investment_advice: 'Investment Advice',
  location_overview: 'Location Overview',
  custom: 'Custom Response'
};

export const RESPONSE_LENGTHS: Record<ResponseLength, string> = {
  short: 'Short (80-150 words)',
  medium: 'Medium (250-400 words)',
  long: 'Long (500-800 words)'
};

export const RESPONSE_TONES: Record<ResponseTone, string> = {
  professional: 'Professional',
  conversational: 'Conversational',
  technical: 'Technical',
  marketing: 'Marketing'
};

export const DEFAULT_CONTEXT_VARIABLES: Record<string, ContextVariable> = {
  cityName: {
    type: 'string',
    description: 'Name of the city',
    defaultValue: 'Hyderabad',
    required: false
  },
  avgPrice: {
    type: 'number',
    description: 'Average price per square foot',
    defaultValue: 5500,
    required: false,
    validation: {
      min: 1000,
      max: 50000
    }
  },
  appreciation: {
    type: 'number',
    description: 'Annual appreciation percentage',
    defaultValue: 10,
    required: false,
    validation: {
      min: 0,
      max: 50
    }
  },
  rentalYield: {
    type: 'number',
    description: 'Expected rental yield percentage',
    defaultValue: 7,
    required: false,
    validation: {
      min: 0,
      max: 20
    }
  }
};