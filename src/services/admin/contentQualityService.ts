import type { GeneratedContent } from "./contentStorageService";

export interface QualityCheck {
  passed: boolean;
  score: number; // 0-100
  issues: string[];
  warnings: string[];
}

/**
 * Content quality checking service
 */
export const contentQualityService = {
  /**
   * Check content quality and SEO compliance
   */
  checkQuality(content: GeneratedContent): QualityCheck {
    const issues: string[] = [];
    const warnings: string[] = [];
    let score = 100;

    // Check SEO Title
    if (content.seo_title) {
      const titleLength = content.seo_title.length;
      if (titleLength < 30) {
        warnings.push('SEO title is shorter than recommended (30-60 chars)');
        score -= 5;
      } else if (titleLength > 60) {
        issues.push('SEO title exceeds 60 characters and may be truncated');
        score -= 10;
      }

      if (!content.seo_title.match(/[A-Z]/)) {
        warnings.push('SEO title should start with a capital letter');
        score -= 3;
      }
    } else {
      issues.push('SEO title is missing');
      score -= 20;
    }

    // Check Meta Description
    if (content.meta_description) {
      const descLength = content.meta_description.length;
      if (descLength < 120) {
        warnings.push('Meta description is shorter than recommended (120-160 chars)');
        score -= 5;
      } else if (descLength > 160) {
        issues.push('Meta description exceeds 160 characters and may be truncated');
        score -= 10;
      }
    } else {
      issues.push('Meta description is missing');
      score -= 20;
    }

    // Check H1 Title
    if (content.h1_title) {
      if (content.h1_title.length > 70) {
        warnings.push('H1 title is longer than recommended (70 chars max)');
        score -= 5;
      }
    } else {
      issues.push('H1 title is missing');
      score -= 15;
    }

    // Check Hero Hook
    if (content.hero_hook) {
      if (content.hero_hook.length < 50) {
        warnings.push('Hero hook could be more descriptive');
        score -= 3;
      }
    } else {
      warnings.push('Hero hook is missing');
      score -= 10;
    }

    // Check Overview
    if (content.overview_seo) {
      const wordCount = content.overview_seo.split(/\s+/).length;
      if (wordCount < 100) {
        warnings.push('Overview content is too short (min 100 words)');
        score -= 10;
      } else if (wordCount > 1000) {
        warnings.push('Overview content is very long and may need editing');
        score -= 5;
      }

      // Check for placeholder text
      const placeholders = ['lorem', 'ipsum', 'placeholder', 'TODO', 'XXX'];
      const hasPlaceholders = placeholders.some(p => 
        content.overview_seo!.toLowerCase().includes(p)
      );
      if (hasPlaceholders) {
        issues.push('Content contains placeholder text');
        score -= 30;
      }
    } else {
      issues.push('Overview content is missing');
      score -= 25;
    }

    // Check FAQs
    if (content.faqs) {
      if (content.faqs.length < 3) {
        warnings.push('Consider adding more FAQs (min 3-5 recommended)');
        score -= 5;
      }

      content.faqs.forEach((faq, index) => {
        if (!faq.question.endsWith('?')) {
          warnings.push(`FAQ ${index + 1}: Question should end with a question mark`);
          score -= 2;
        }
        if (faq.answer.length < 50) {
          warnings.push(`FAQ ${index + 1}: Answer is too short`);
          score -= 3;
        }
      });
    }

    // Check Testimonials
    if (content.testimonials) {
      content.testimonials.forEach((testimonial, index) => {
        if (testimonial.rating < 4) {
          warnings.push(`Testimonial ${index + 1}: Low rating (${testimonial.rating}/5)`);
          score -= 5;
        }
        if (testimonial.feedback.length < 50) {
          warnings.push(`Testimonial ${index + 1}: Feedback is too short`);
          score -= 3;
        }
      });
    }

    // Ensure score doesn't go below 0
    score = Math.max(0, score);

    return {
      passed: issues.length === 0,
      score,
      issues,
      warnings,
    };
  },

  /**
   * Check if content meets minimum quality standards
   */
  meetsMinimumStandards(content: GeneratedContent): boolean {
    const check = this.checkQuality(content);
    return check.passed && check.score >= 60;
  },

  /**
   * Get quality grade
   */
  getQualityGrade(score: number): string {
    if (score >= 90) return 'Excellent';
    if (score >= 75) return 'Good';
    if (score >= 60) return 'Fair';
    if (score >= 40) return 'Poor';
    return 'Very Poor';
  },

  /**
   * Format quality report
   */
  formatQualityReport(check: QualityCheck): string {
    const grade = this.getQualityGrade(check.score);
    let report = `Quality Score: ${check.score}/100 (${grade})\n\n`;

    if (check.issues.length > 0) {
      report += '❌ Issues:\n';
      check.issues.forEach(issue => {
        report += `  - ${issue}\n`;
      });
      report += '\n';
    }

    if (check.warnings.length > 0) {
      report += '⚠️ Warnings:\n';
      check.warnings.forEach(warning => {
        report += `  - ${warning}\n`;
      });
    }

    if (check.issues.length === 0 && check.warnings.length === 0) {
      report += '✅ All quality checks passed!';
    }

    return report;
  },
};
