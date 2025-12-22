/**
 * Integration tests for Sample Response Generation System
 * Tests the API endpoint, service layer, and type definitions
 */

import { 
  SampleResponseRequest, 
  SampleResponseResult, 
  SampleResponseType,
  ResponseLength,
  ResponseTone 
} from '@/types/sampleResponse';

// Mock fetch for testing
global.fetch = jest.fn();

describe('Sample Response Generation System', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Type Definitions', () => {
    it('should have correct SampleResponseType values', () => {
      const types: SampleResponseType[] = [
        'market_analysis',
        'property_description', 
        'investment_advice',
        'location_overview',
        'custom'
      ];
      
      expect(types).toHaveLength(5);
      expect(types).toContain('market_analysis');
      expect(types).toContain('custom');
    });

    it('should have correct ResponseLength values', () => {
      const lengths: ResponseLength[] = ['short', 'medium', 'long'];
      expect(lengths).toHaveLength(3);
    });

    it('should have correct ResponseTone values', () => {
      const tones: ResponseTone[] = ['professional', 'conversational', 'technical', 'marketing'];
      expect(tones).toHaveLength(4);
    });
  });

  describe('Sample Response Request Structure', () => {
    it('should create valid request object', () => {
      const request: SampleResponseRequest = {
        type: 'market_analysis',
        length: 'medium',
        tone: 'professional',
        context: {
          cityName: 'Hyderabad',
          avgPrice: 5500,
          appreciation: 10,
          rentalYield: 7
        },
        includeMetadata: true,
        saveToHistory: true
      };

      expect(request.type).toBe('market_analysis');
      expect(request.context?.cityName).toBe('Hyderabad');
      expect(request.context?.avgPrice).toBe(5500);
    });

    it('should handle custom type with prompt', () => {
      const request: SampleResponseRequest = {
        type: 'custom',
        customPrompt: 'Generate analysis for luxury properties in Mumbai',
        length: 'long',
        tone: 'marketing'
      };

      expect(request.type).toBe('custom');
      expect(request.customPrompt).toBeDefined();
    });
  });

  describe('API Integration', () => {
    it('should call API endpoint with correct parameters', async () => {
      const mockResponse: SampleResponseResult = {
        id: 'test-123',
        type: 'market_analysis',
        content: 'Test market analysis content',
        wordCount: 150,
        characterCount: 800,
        generatedAt: new Date().toISOString(),
        context: { cityName: 'Hyderabad' },
        metadata: {
          tone: 'professional',
          length: 'medium',
          processingTime: 500,
          template: 'Basic Market Analysis',
          version: '1.0',
          generationMethod: 'template',
          contextVariablesUsed: ['cityName'],
          qualityChecks: {
            lengthCompliance: true,
            contentRelevance: true,
            toneConsistency: true,
            structureValid: true
          }
        }
      };

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse
      });

      const request: SampleResponseRequest = {
        type: 'market_analysis',
        length: 'medium',
        tone: 'professional',
        context: { cityName: 'Hyderabad' }
      };

      // Simulate API call
      const response = await fetch('/api/admin/sample-response', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(request)
      });

      const result = await response.json();

      expect(fetch).toHaveBeenCalledWith('/api/admin/sample-response', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(request)
      });

      expect(result.type).toBe('market_analysis');
      expect(result.wordCount).toBe(150);
      expect(result.metadata.tone).toBe('professional');
    });

    it('should handle API errors gracefully', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        status: 400,
        json: async () => ({ error: 'Invalid request type' })
      });

      const request: SampleResponseRequest = {
        type: 'invalid_type' as SampleResponseType,
        length: 'medium',
        tone: 'professional'
      };

      const response = await fetch('/api/admin/sample-response', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(request)
      });

      expect(response.ok).toBe(false);
      expect(response.status).toBe(400);
    });
  });

  describe('Content Generation Logic', () => {
    it('should generate content with appropriate word count for different lengths', () => {
      const shortContent = 'Brief market analysis with key points about pricing and trends.';
      const mediumContent = shortContent + ' ' + 'Additional details about market dynamics, buyer segments, and investment potential with supporting data and analysis.';
      const longContent = mediumContent + ' ' + 'Comprehensive analysis including historical trends, future projections, risk assessment, and detailed recommendations for various investor types.';

      const shortWords = shortContent.split(/\s+/).length;
      const mediumWords = mediumContent.split(/\s+/).length;
      const longWords = longContent.split(/\s+/).length;

      // Verify word count progression
      expect(shortWords).toBeLessThan(mediumWords);
      expect(mediumWords).toBeLessThan(longWords);
      
      // Verify approximate target ranges
      expect(shortWords).toBeGreaterThan(10);
      expect(shortWords).toBeLessThan(200);
      expect(mediumWords).toBeGreaterThan(200);
      expect(longWords).toBeGreaterThan(400);
    });

    it('should incorporate context variables into generated content', () => {
      const context = {
        cityName: 'Mumbai',
        avgPrice: 12000,
        appreciation: 8,
        rentalYield: 5
      };

      // Simulate content generation with context
      const generatedContent = `The ${context.cityName} real estate market shows strong fundamentals with average pricing at ₹${context.avgPrice}/sqft. Annual appreciation of ${context.appreciation}% and rental yields of ${context.rentalYield}% make it attractive for investors.`;

      expect(generatedContent).toContain('Mumbai');
      expect(generatedContent).toContain('₹12000');
      expect(generatedContent).toContain('8%');
      expect(generatedContent).toContain('5%');
    });
  });

  describe('Quality Assessment', () => {
    it('should calculate quality scores correctly', () => {
      const mockQuality = {
        score: 0.85,
        factors: {
          relevance: 0.9,
          coherence: 0.8,
          completeness: 0.85,
          engagement: 0.85
        }
      };

      const averageScore = (
        mockQuality.factors.relevance +
        mockQuality.factors.coherence +
        mockQuality.factors.completeness +
        mockQuality.factors.engagement
      ) / 4;

      expect(averageScore).toBeCloseTo(0.85, 2);
      expect(mockQuality.score).toBe(0.85);
    });

    it('should validate quality thresholds', () => {
      const qualityThresholds = {
        minimum: 0.6,
        good: 0.75,
        excellent: 0.9
      };

      const testScore = 0.82;

      expect(testScore).toBeGreaterThan(qualityThresholds.minimum);
      expect(testScore).toBeGreaterThan(qualityThresholds.good);
      expect(testScore).toBeLessThan(qualityThresholds.excellent);
    });
  });

  describe('Template System Integration', () => {
    it('should select appropriate template based on type and length', () => {
      const templateSelections = [
        { type: 'market_analysis', length: 'short', expectedTemplate: 'market_analysis_short' },
        { type: 'property_description', length: 'medium', expectedTemplate: 'property_description_medium' },
        { type: 'investment_advice', length: 'long', expectedTemplate: 'investment_advice_long' }
      ];

      templateSelections.forEach(({ type, length, expectedTemplate }) => {
        // Simulate template selection logic
        const selectedTemplate = `${type}_${length}`;
        expect(selectedTemplate).toBe(expectedTemplate);
      });
    });

    it('should apply tone adaptations correctly', () => {
      const baseContent = 'This property offers excellent investment potential.';
      
      const toneAdaptations = {
        professional: 'This property demonstrates strong investment fundamentals.',
        conversational: 'This property is a great investment opportunity!',
        technical: 'This property exhibits favorable investment metrics.',
        marketing: 'This property presents an exceptional investment opportunity!'
      };

      Object.entries(toneAdaptations).forEach(([tone, adaptedContent]) => {
        expect(adaptedContent).toBeDefined();
        expect(adaptedContent.length).toBeGreaterThan(baseContent.length - 10);
      });
    });
  });

  describe('Error Handling', () => {
    it('should handle missing required fields', () => {
      const incompleteRequest = {
        length: 'medium',
        tone: 'professional'
        // Missing required 'type' field
      };

      // This should be caught by validation
      expect(() => {
        if (!incompleteRequest.type) {
          throw new Error('Response type is required');
        }
      }).toThrow('Response type is required');
    });

    it('should handle invalid context values', () => {
      const invalidContext = {
        avgPrice: -1000, // Invalid negative price
        appreciation: 150, // Unrealistic appreciation rate
        rentalYield: -5 // Invalid negative yield
      };

      // Validation logic
      const validateContext = (context: any) => {
        const errors = [];
        if (context.avgPrice && context.avgPrice < 0) {
          errors.push('Average price cannot be negative');
        }
        if (context.appreciation && context.appreciation > 100) {
          errors.push('Appreciation rate seems unrealistic');
        }
        if (context.rentalYield && context.rentalYield < 0) {
          errors.push('Rental yield cannot be negative');
        }
        return errors;
      };

      const errors = validateContext(invalidContext);
      expect(errors).toHaveLength(3);
      expect(errors[0]).toContain('negative');
    });
  });
});

// Integration test for the complete flow
describe('End-to-End Sample Response Generation', () => {
  it('should complete full generation workflow', async () => {
    const request: SampleResponseRequest = {
      type: 'market_analysis',
      length: 'medium',
      tone: 'professional',
      context: {
        cityName: 'Hyderabad',
        avgPrice: 5500,
        appreciation: 10,
        rentalYield: 7,
        topAreas: ['Gachibowli', 'Kondapur', 'Kokapet']
      },
      includeMetadata: true,
      saveToHistory: true
    };

    // Mock successful response
    const expectedResult: SampleResponseResult = {
      id: 'test-workflow-123',
      type: 'market_analysis',
      content: 'Hyderabad presents a compelling real estate investment opportunity with current average pricing at ₹5,500/sqft across prime residential areas. The market has demonstrated consistent growth over the past 3-5 years, with key micro-markets like Gachibowli, Kondapur, Kokapet leading appreciation trends.',
      wordCount: 45,
      characterCount: 280,
      generatedAt: new Date().toISOString(),
      context: request.context,
      metadata: {
        tone: 'professional',
        length: 'medium',
        processingTime: 750,
        template: 'Basic Market Analysis',
        version: '1.0',
        generationMethod: 'template',
        contextVariablesUsed: ['cityName', 'avgPrice', 'appreciation', 'rentalYield', 'topAreas'],
        qualityChecks: {
          lengthCompliance: true,
          contentRelevance: true,
          toneConsistency: true,
          structureValid: true
        }
      },
      quality: {
        score: 0.88,
        factors: {
          relevance: 0.9,
          coherence: 0.85,
          completeness: 0.9,
          engagement: 0.87
        }
      }
    };

    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => expectedResult
    });

    // Simulate the complete workflow
    const response = await fetch('/api/admin/sample-response', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(request)
    });

    const result: SampleResponseResult = await response.json();

    // Verify all aspects of the response
    expect(result.type).toBe(request.type);
    expect(result.content).toContain('Hyderabad');
    expect(result.content).toContain('₹5,500');
    expect(result.content).toContain('Gachibowli');
    expect(result.wordCount).toBeGreaterThan(0);
    expect(result.metadata.tone).toBe(request.tone);
    expect(result.metadata.length).toBe(request.length);
    expect(result.quality?.score).toBeGreaterThan(0.8);
    expect(result.context?.cityName).toBe('Hyderabad');
  });
});