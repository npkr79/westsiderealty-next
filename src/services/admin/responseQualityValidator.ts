export interface ValidationRule {
  id: string;
  name: string;
  description: string;
  category: 'structure' | 'content' | 'seo' | 'engagement' | 'technical';
  severity: 'error' | 'warning' | 'info';
  validator: (text: string, context?: any) => ValidationResult;
}

export interface ValidationResult {
  passed: boolean;
  message: string;
  score: number; // 0-100
  suggestions?: string[];
}

export interface QualityReport {
  overallScore: number;
  grade: 'A+' | 'A' | 'B+' | 'B' | 'C+' | 'C' | 'D' | 'F';
  passed: boolean;
  results: Array<{
    rule: ValidationRule;
    result: ValidationResult;
  }>;
  summary: {
    errors: number;
    warnings: number;
    infos: number;
  };
  recommendations: string[];
}

export class ResponseQualityValidator {
  private static instance: ResponseQualityValidator;
  private rules: ValidationRule[] = [];

  public static getInstance(): ResponseQualityValidator {
    if (!ResponseQualityValidator.instance) {
      ResponseQualityValidator.instance = new ResponseQualityValidator();
    }
    return ResponseQualityValidator.instance;
  }

  constructor() {
    this.initializeRules();
  }

  /**
   * Initialize validation rules
   */
  private initializeRules(): void {
    this.rules = [
      // Structure Rules
      {
        id: 'min-word-count',
        name: 'Minimum Word Count',
        description: 'Content should meet minimum word count requirements',
        category: 'structure',
        severity: 'error',
        validator: (text: string, context?: any) => {
          const wordCount = text.split(/\s+/).filter(w => w.length > 0).length;
          const minWords = context?.minWords || 100;
          
          if (wordCount >= minWords) {
            return {
              passed: true,
              message: `Word count (${wordCount}) meets minimum requirement (${minWords})`,
              score: 100
            };
          }
          
          const score = Math.max(0, (wordCount / minWords) * 100);
          return {
            passed: false,
            message: `Word count (${wordCount}) below minimum requirement (${minWords})`,
            score,
            suggestions: [
              'Add more detailed descriptions',
              'Include specific examples and use cases',
              'Expand on key benefits and features'
            ]
          };
        }
      },
      
      {
        id: 'max-word-count',
        name: 'Maximum Word Count',
        description: 'Content should not exceed maximum word count',
        category: 'structure',
        severity: 'warning',
        validator: (text: string, context?: any) => {
          const wordCount = text.split(/\s+/).filter(w => w.length > 0).length;
          const maxWords = context?.maxWords || 1000;
          
          if (wordCount <= maxWords) {
            return {
              passed: true,
              message: `Word count (${wordCount}) within limit (${maxWords})`,
              score: 100
            };
          }
          
          const excess = wordCount - maxWords;
          const score = Math.max(0, 100 - (excess / maxWords) * 100);
          return {
            passed: false,
            message: `Word count (${wordCount}) exceeds limit (${maxWords}) by ${excess} words`,
            score,
            suggestions: [
              'Remove redundant information',
              'Combine similar points',
              'Focus on most important details'
            ]
          };
        }
      },

      {
        id: 'paragraph-structure',
        name: 'Paragraph Structure',
        description: 'Content should be well-structured with proper paragraphs',
        category: 'structure',
        severity: 'warning',
        validator: (text: string) => {
          const paragraphs = text.split(/\n\s*\n/).filter(p => p.trim().length > 0);
          const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 0);
          
          if (paragraphs.length === 1 && sentences.length > 5) {
            return {
              passed: false,
              message: 'Content appears to be one long paragraph - consider breaking into sections',
              score: 60,
              suggestions: [
                'Break content into logical paragraphs',
                'Use headers to organize sections',
                'Separate different topics or ideas'
              ]
            };
          }
          
          if (paragraphs.length >= 2) {
            return {
              passed: true,
              message: `Well-structured content with ${paragraphs.length} paragraphs`,
              score: 100
            };
          }
          
          return {
            passed: true,
            message: 'Content structure is acceptable',
            score: 80
          };
        }
      },

      // Content Rules
      {
        id: 'readability-score',
        name: 'Readability Score',
        description: 'Content should be easy to read and understand',
        category: 'content',
        severity: 'warning',
        validator: (text: string) => {
          const readabilityScore = this.calculateReadabilityScore(text);
          
          if (readabilityScore >= 60) {
            return {
              passed: true,
              message: `Good readability score: ${readabilityScore.toFixed(1)}`,
              score: readabilityScore
            };
          } else if (readabilityScore >= 40) {
            return {
              passed: false,
              message: `Moderate readability score: ${readabilityScore.toFixed(1)}`,
              score: readabilityScore,
              suggestions: [
                'Use shorter sentences',
                'Replace complex words with simpler alternatives',
                'Break up long paragraphs'
              ]
            };
          } else {
            return {
              passed: false,
              message: `Low readability score: ${readabilityScore.toFixed(1)}`,
              score: readabilityScore,
              suggestions: [
                'Significantly simplify sentence structure',
                'Use common, everyday words',
                'Add more white space and formatting'
              ]
            };
          }
        }
      },

      {
        id: 'placeholder-content',
        name: 'Placeholder Content Check',
        description: 'Content should not contain placeholder text',
        category: 'content',
        severity: 'error',
        validator: (text: string) => {
          const placeholders = [
            'lorem ipsum', 'placeholder', 'todo', 'xxx', 'tbd', 'sample text',
            '[insert', '[add', '[replace', 'coming soon', 'under construction'
          ];
          
          const foundPlaceholders = placeholders.filter(placeholder => 
            text.toLowerCase().includes(placeholder)
          );
          
          if (foundPlaceholders.length === 0) {
            return {
              passed: true,
              message: 'No placeholder content detected',
              score: 100
            };
          }
          
          return {
            passed: false,
            message: `Placeholder content found: ${foundPlaceholders.join(', ')}`,
            score: 0,
            suggestions: [
              'Replace all placeholder text with actual content',
              'Complete all sections marked as TODO or TBD',
              'Ensure all content is finalized and reviewed'
            ]
          };
        }
      },

      {
        id: 'content-completeness',
        name: 'Content Completeness',
        description: 'Content should be complete and comprehensive',
        category: 'content',
        severity: 'warning',
        validator: (text: string, context?: any) => {
          const requiredElements = context?.requiredElements || [];
          if (requiredElements.length === 0) {
            return {
              passed: true,
              message: 'No specific content requirements defined',
              score: 100
            };
          }
          
          const missingElements = requiredElements.filter((element: string) => 
            !text.toLowerCase().includes(element.toLowerCase())
          );
          
          if (missingElements.length === 0) {
            return {
              passed: true,
              message: 'All required content elements present',
              score: 100
            };
          }
          
          const completeness = ((requiredElements.length - missingElements.length) / requiredElements.length) * 100;
          return {
            passed: completeness >= 80,
            message: `Missing required elements: ${missingElements.join(', ')}`,
            score: completeness,
            suggestions: [
              `Add information about: ${missingElements.join(', ')}`,
              'Ensure all key topics are covered',
              'Review content requirements checklist'
            ]
          };
        }
      },

      // SEO Rules
      {
        id: 'keyword-density',
        name: 'Keyword Density',
        description: 'Keywords should be used appropriately throughout content',
        category: 'seo',
        severity: 'info',
        validator: (text: string, context?: any) => {
          const keywords = context?.keywords || [];
          if (keywords.length === 0) {
            return {
              passed: true,
              message: 'No target keywords specified',
              score: 100
            };
          }
          
          const wordCount = text.split(/\s+/).length;
          let totalKeywordCount = 0;
          const keywordStats: Record<string, number> = {};
          
          keywords.forEach((keyword: string) => {
            const regex = new RegExp(`\\b${keyword}\\b`, 'gi');
            const matches = text.match(regex) || [];
            keywordStats[keyword] = matches.length;
            totalKeywordCount += matches.length;
          });
          
          const density = (totalKeywordCount / wordCount) * 100;
          
          if (density >= 1 && density <= 3) {
            return {
              passed: true,
              message: `Good keyword density: ${density.toFixed(1)}%`,
              score: 100
            };
          } else if (density < 1) {
            return {
              passed: false,
              message: `Low keyword density: ${density.toFixed(1)}% (target: 1-3%)`,
              score: Math.max(20, density * 50),
              suggestions: [
                'Include target keywords more naturally in content',
                'Use keyword variations and synonyms',
                'Ensure keywords appear in headings and important sections'
              ]
            };
          } else {
            return {
              passed: false,
              message: `High keyword density: ${density.toFixed(1)}% (target: 1-3%)`,
              score: Math.max(20, 100 - (density - 3) * 20),
              suggestions: [
                'Reduce keyword repetition',
                'Use more natural language',
                'Focus on content quality over keyword stuffing'
              ]
            };
          }
        }
      },

      // Engagement Rules
      {
        id: 'call-to-action',
        name: 'Call to Action',
        description: 'Content should include appropriate calls to action',
        category: 'engagement',
        severity: 'warning',
        validator: (text: string, context?: any) => {
          const ctaPatterns = [
            /contact\s+us/i, /call\s+now/i, /book\s+(now|today)/i,
            /schedule\s+a\s+visit/i, /enquire\s+now/i, /learn\s+more/i,
            /get\s+started/i, /sign\s+up/i, /register/i, /apply\s+now/i
          ];
          
          const hasCTA = ctaPatterns.some(pattern => pattern.test(text));
          
          if (hasCTA) {
            return {
              passed: true,
              message: 'Call-to-action found in content',
              score: 100
            };
          }
          
          const contentType = context?.type;
          if (contentType === 'informational' || contentType === 'educational') {
            return {
              passed: true,
              message: 'CTA not required for informational content',
              score: 100
            };
          }
          
          return {
            passed: false,
            message: 'No clear call-to-action found',
            score: 60,
            suggestions: [
              'Add a clear call-to-action at the end',
              'Include contact information or next steps',
              'Guide readers on what to do next'
            ]
          };
        }
      },

      {
        id: 'engagement-elements',
        name: 'Engagement Elements',
        description: 'Content should include engaging elements like questions, statistics, etc.',
        category: 'engagement',
        severity: 'info',
        validator: (text: string) => {
          let score = 0;
          const elements: string[] = [];
          
          // Check for questions
          if (/\?/.test(text)) {
            score += 20;
            elements.push('questions');
          }
          
          // Check for statistics/numbers
          if (/\d+%|\d+\s*(sqft|bhk|cr|lakh|km)/i.test(text)) {
            score += 25;
            elements.push('statistics');
          }
          
          // Check for bullet points or lists
          if (/^\s*[-•*]\s+/m.test(text) || /^\s*\d+\.\s+/m.test(text)) {
            score += 20;
            elements.push('lists');
          }
          
          // Check for emphasis/bold text
          if (/\*\*.*\*\*|\*.*\*|__.*__|_.*_/.test(text)) {
            score += 15;
            elements.push('emphasis');
          }
          
          // Check for headers
          if (/#{1,6}|^\*\*.*\*\*$/m.test(text)) {
            score += 20;
            elements.push('headers');
          }
          
          if (score >= 60) {
            return {
              passed: true,
              message: `Good engagement elements: ${elements.join(', ')}`,
              score
            };
          } else if (score >= 30) {
            return {
              passed: false,
              message: `Some engagement elements present: ${elements.join(', ')}`,
              score,
              suggestions: [
                'Add more engaging elements like questions or statistics',
                'Use bullet points to highlight key information',
                'Include headers to organize content better'
              ]
            };
          } else {
            return {
              passed: false,
              message: 'Limited engagement elements found',
              score,
              suggestions: [
                'Add questions to engage readers',
                'Include specific numbers and statistics',
                'Use formatting like bold text and bullet points',
                'Add headers to structure content'
              ]
            };
          }
        }
      },

      // Technical Rules
      {
        id: 'grammar-check',
        name: 'Basic Grammar Check',
        description: 'Content should have proper grammar and punctuation',
        category: 'technical',
        severity: 'warning',
        validator: (text: string) => {
          let issues: string[] = [];
          let score = 100;
          
          // Check for multiple spaces
          if (/\s{2,}/.test(text)) {
            issues.push('multiple consecutive spaces');
            score -= 10;
          }
          
          // Check for multiple punctuation
          if (/[.!?]{2,}/.test(text)) {
            issues.push('multiple punctuation marks');
            score -= 10;
          }
          
          // Check for sentence spacing
          if (/[.!?][a-zA-Z]/.test(text)) {
            issues.push('missing space after sentences');
            score -= 15;
          }
          
          // Check for capitalization after periods
          const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 0);
          const uncapitalized = sentences.filter(s => {
            const trimmed = s.trim();
            return trimmed.length > 0 && /^[a-z]/.test(trimmed);
          });
          
          if (uncapitalized.length > 0) {
            issues.push('sentences not starting with capital letters');
            score -= 20;
          }
          
          if (issues.length === 0) {
            return {
              passed: true,
              message: 'No basic grammar issues detected',
              score: 100
            };
          }
          
          return {
            passed: score >= 70,
            message: `Grammar issues found: ${issues.join(', ')}`,
            score: Math.max(0, score),
            suggestions: [
              'Review and fix spacing issues',
              'Ensure proper capitalization',
              'Check punctuation usage'
            ]
          };
        }
      },

      {
        id: 'formatting-consistency',
        name: 'Formatting Consistency',
        description: 'Content should have consistent formatting throughout',
        category: 'technical',
        severity: 'info',
        validator: (text: string) => {
          let score = 100;
          const issues: string[] = [];
          
          // Check for consistent list formatting
          const bulletLists = text.match(/^\s*[-•*]\s+/gm) || [];
          const numberedLists = text.match(/^\s*\d+\.\s+/gm) || [];
          
          if (bulletLists.length > 0 && numberedLists.length > 0) {
            const bulletTypes = [...new Set(bulletLists.map(b => b.trim()[0]))];
            if (bulletTypes.length > 1) {
              issues.push('inconsistent bullet point styles');
              score -= 15;
            }
          }
          
          // Check for consistent header formatting
          const headers = text.match(/^#{1,6}\s+.+$/gm) || [];
          const boldHeaders = text.match(/^\*\*.+\*\*$/gm) || [];
          
          if (headers.length > 0 && boldHeaders.length > 0) {
            issues.push('mixed header formatting styles');
            score -= 10;
          }
          
          // Check for consistent emphasis
          const boldAsterisks = (text.match(/\*\*[^*]+\*\*/g) || []).length;
          const boldUnderscores = (text.match(/__[^_]+__/g) || []).length;
          
          if (boldAsterisks > 0 && boldUnderscores > 0) {
            issues.push('mixed bold formatting styles');
            score -= 10;
          }
          
          if (issues.length === 0) {
            return {
              passed: true,
              message: 'Consistent formatting throughout content',
              score: 100
            };
          }
          
          return {
            passed: score >= 80,
            message: `Formatting inconsistencies: ${issues.join(', ')}`,
            score,
            suggestions: [
              'Use consistent bullet point styles',
              'Standardize header formatting',
              'Use consistent emphasis formatting'
            ]
          };
        }
      }
    ];
  }

  /**
   * Validate content against all rules
   */
  validateContent(text: string, context?: any): QualityReport {
    const results = this.rules.map(rule => ({
      rule,
      result: rule.validator(text, context)
    }));
    
    // Calculate overall score
    const totalScore = results.reduce((sum, { result }) => sum + result.score, 0);
    const overallScore = Math.round(totalScore / results.length);
    
    // Count issues by severity
    const summary = {
      errors: results.filter(r => r.rule.severity === 'error' && !r.result.passed).length,
      warnings: results.filter(r => r.rule.severity === 'warning' && !r.result.passed).length,
      infos: results.filter(r => r.rule.severity === 'info' && !r.result.passed).length
    };
    
    // Determine grade
    const grade = this.calculateGrade(overallScore);
    
    // Generate recommendations
    const recommendations = this.generateRecommendations(results);
    
    return {
      overallScore,
      grade,
      passed: summary.errors === 0 && overallScore >= 70,
      results,
      summary,
      recommendations
    };
  }

  /**
   * Validate specific rule
   */
  validateRule(ruleId: string, text: string, context?: any): ValidationResult | null {
    const rule = this.rules.find(r => r.id === ruleId);
    if (!rule) return null;
    
    return rule.validator(text, context);
  }

  /**
   * Get all validation rules
   */
  getRules(): ValidationRule[] {
    return [...this.rules];
  }

  /**
   * Get rules by category
   */
  getRulesByCategory(category: ValidationRule['category']): ValidationRule[] {
    return this.rules.filter(rule => rule.category === category);
  }

  /**
   * Add custom validation rule
   */
  addRule(rule: ValidationRule): void {
    // Check if rule with same ID already exists
    const existingIndex = this.rules.findIndex(r => r.id === rule.id);
    if (existingIndex >= 0) {
      this.rules[existingIndex] = rule;
    } else {
      this.rules.push(rule);
    }
  }

  /**
   * Remove validation rule
   */
  removeRule(ruleId: string): boolean {
    const index = this.rules.findIndex(r => r.id === ruleId);
    if (index >= 0) {
      this.rules.splice(index, 1);
      return true;
    }
    return false;
  }

  /**
   * Calculate readability score (Flesch Reading Ease approximation)
   */
  private calculateReadabilityScore(text: string): number {
    const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 0);
    const words = text.split(/\s+/).filter(w => w.length > 0);
    
    if (sentences.length === 0 || words.length === 0) return 0;
    
    const avgSentenceLength = words.length / sentences.length;
    const avgSyllables = words.reduce((sum, word) => sum + this.countSyllables(word), 0) / words.length;
    
    // Simplified Flesch Reading Ease formula
    const score = 206.835 - (1.015 * avgSentenceLength) - (84.6 * avgSyllables);
    return Math.max(0, Math.min(100, score));
  }

  /**
   * Count syllables in a word (approximation)
   */
  private countSyllables(word: string): number {
    word = word.toLowerCase().replace(/[^a-z]/g, '');
    if (word.length <= 3) return 1;
    
    const vowels = 'aeiouy';
    let count = 0;
    let previousWasVowel = false;
    
    for (let i = 0; i < word.length; i++) {
      const isVowel = vowels.includes(word[i]);
      if (isVowel && !previousWasVowel) {
        count++;
      }
      previousWasVowel = isVowel;
    }
    
    // Adjust for silent 'e'
    if (word.endsWith('e')) count--;
    
    return Math.max(1, count);
  }

  /**
   * Calculate grade based on score
   */
  private calculateGrade(score: number): QualityReport['grade'] {
    if (score >= 95) return 'A+';
    if (score >= 90) return 'A';
    if (score >= 85) return 'B+';
    if (score >= 80) return 'B';
    if (score >= 75) return 'C+';
    if (score >= 70) return 'C';
    if (score >= 60) return 'D';
    return 'F';
  }

  /**
   * Generate recommendations based on validation results
   */
  private generateRecommendations(results: Array<{ rule: ValidationRule; result: ValidationResult }>): string[] {
    const recommendations: string[] = [];
    
    // Priority recommendations for errors
    const errors = results.filter(r => r.rule.severity === 'error' && !r.result.passed);
    errors.forEach(({ rule, result }) => {
      recommendations.push(`🔴 ${rule.name}: ${result.message}`);
      if (result.suggestions) {
        result.suggestions.forEach(suggestion => {
          recommendations.push(`   • ${suggestion}`);
        });
      }
    });
    
    // Warning recommendations
    const warnings = results.filter(r => r.rule.severity === 'warning' && !r.result.passed);
    warnings.forEach(({ rule, result }) => {
      recommendations.push(`🟡 ${rule.name}: ${result.message}`);
      if (result.suggestions) {
        result.suggestions.slice(0, 2).forEach(suggestion => {
          recommendations.push(`   • ${suggestion}`);
        });
      }
    });
    
    // Top info recommendations (limit to avoid overwhelming)
    const infos = results
      .filter(r => r.rule.severity === 'info' && !r.result.passed)
      .sort((a, b) => a.result.score - b.result.score)
      .slice(0, 3);
    
    infos.forEach(({ rule, result }) => {
      recommendations.push(`ℹ️ ${rule.name}: ${result.message}`);
      if (result.suggestions && result.suggestions.length > 0) {
        recommendations.push(`   • ${result.suggestions[0]}`);
      }
    });
    
    return recommendations;
  }
}

export const responseQualityValidator = ResponseQualityValidator.getInstance();