"use client";

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Separator } from '@/components/ui/separator';
import { 
  Loader2, 
  CheckCircle, 
  AlertCircle, 
  Info, 
  Sparkles, 
  FileText, 
  BarChart3,
  Clock,
  Target,
  Zap
} from 'lucide-react';
import { enhancedTextResponseService } from '@/services/admin/enhancedTextResponseService';
import { responseQualityValidator } from '@/services/admin/responseQualityValidator';
import type { EnhancedTextResponse, TextResponseTemplate } from '@/services/admin/enhancedTextResponseService';
import type { QualityReport } from '@/services/admin/responseQualityValidator';

interface DemoState {
  inputText: string;
  isProcessing: boolean;
  enhancedResponse: EnhancedTextResponse | null;
  qualityReport: QualityReport | null;
  selectedTemplate: string;
  error: string | null;
}

export function EnhancedTextResponseDemo() {
  const [state, setState] = useState<DemoState>({
    inputText: `This is a sample long text response.
It can span multiple lines.
Here are some more words to make it longer.

This property is located in a good area with nice amenities. The price is reasonable and it has good connectivity. Many people like this location because it has schools and hospitals nearby. The developer is also very good and has built many projects before.

Contact us for more details about this amazing property opportunity.`,
    isProcessing: false,
    enhancedResponse: null,
    qualityReport: null,
    selectedTemplate: '',
    error: null
  });

  const [templates, setTemplates] = useState<TextResponseTemplate[]>([]);

  useEffect(() => {
    // Load available templates
    const availableTemplates = enhancedTextResponseService.getTemplates();
    setTemplates(availableTemplates);
  }, []);

  const handleEnhanceText = async () => {
    if (!state.inputText.trim()) return;

    setState(prev => ({ ...prev, isProcessing: true, error: null }));

    try {
      // Enhance the text
      const enhancedResponse = await enhancedTextResponseService.enhanceTextResponse(
        state.inputText,
        {
          type: 'property-description',
          targetAudience: 'homebuyers',
          keywords: ['property', 'location', 'amenities', 'investment'],
          minWords: 200,
          maxWords: 500
        }
      );

      // Validate quality
      const qualityReport = responseQualityValidator.validateContent(
        enhancedResponse.enhancedContent,
        {
          minWords: 200,
          maxWords: 500,
          keywords: ['property', 'location', 'amenities'],
          requiredElements: ['location', 'price', 'features']
        }
      );

      setState(prev => ({
        ...prev,
        enhancedResponse,
        qualityReport,
        isProcessing: false
      }));

    } catch (error) {
      setState(prev => ({
        ...prev,
        error: error instanceof Error ? error.message : 'Enhancement failed',
        isProcessing: false
      }));
    }
  };

  const handleApplyTemplate = async () => {
    if (!state.selectedTemplate) return;

    setState(prev => ({ ...prev, isProcessing: true, error: null }));

    try {
      const templateContent = await enhancedTextResponseService.applyTemplate(
        state.selectedTemplate,
        {
          location: 'Gachibowli, Hyderabad',
          price: '₹85 lakhs',
          features: 'Modern amenities, 24/7 security, Swimming pool',
          contact: 'Call +91 9876543210'
        }
      );

      setState(prev => ({
        ...prev,
        inputText: templateContent,
        isProcessing: false
      }));

    } catch (error) {
      setState(prev => ({
        ...prev,
        error: error instanceof Error ? error.message : 'Template application failed',
        isProcessing: false
      }));
    }
  };

  const getGradeColor = (grade: string) => {
    switch (grade) {
      case 'A+':
      case 'A':
        return 'text-green-600 bg-green-50';
      case 'B+':
      case 'B':
        return 'text-blue-600 bg-blue-50';
      case 'C+':
      case 'C':
        return 'text-yellow-600 bg-yellow-50';
      case 'D':
        return 'text-orange-600 bg-orange-50';
      default:
        return 'text-red-600 bg-red-50';
    }
  };

  const getSeverityIcon = (severity: string) => {
    switch (severity) {
      case 'error':
        return <AlertCircle className="h-4 w-4 text-red-500" />;
      case 'warning':
        return <AlertCircle className="h-4 w-4 text-yellow-500" />;
      default:
        return <Info className="h-4 w-4 text-blue-500" />;
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-purple-500" />
            Enhanced Text Response System Demo
          </CardTitle>
          <CardDescription>
            Demonstrate the improved text response processing with quality validation, 
            enhancement features, and template application.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Template Selection */}
          <div className="space-y-3">
            <label className="text-sm font-medium">Apply Template (Optional)</label>
            <div className="flex gap-2">
              <select
                value={state.selectedTemplate}
                onChange={(e) => setState(prev => ({ ...prev, selectedTemplate: e.target.value }))}
                className="flex-1 px-3 py-2 border border-gray-300 rounded-md text-sm"
              >
                <option value="">Select a template...</option>
                {templates.map(template => (
                  <option key={template.id} value={template.id}>
                    {template.name}
                  </option>
                ))}
              </select>
              <Button
                onClick={handleApplyTemplate}
                disabled={!state.selectedTemplate || state.isProcessing}
                variant="outline"
                size="sm"
              >
                {state.isProcessing ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <FileText className="h-4 w-4" />
                )}
                Apply Template
              </Button>
            </div>
            {state.selectedTemplate && (
              <div className="text-sm text-gray-600 bg-gray-50 p-3 rounded-md">
                <strong>Template:</strong> {templates.find(t => t.id === state.selectedTemplate)?.description}
              </div>
            )}
          </div>

          <Separator />

          {/* Input Text */}
          <div className="space-y-3">
            <label className="text-sm font-medium">Input Text</label>
            <Textarea
              value={state.inputText}
              onChange={(e) => setState(prev => ({ ...prev, inputText: e.target.value }))}
              placeholder="Enter your text to enhance..."
              className="min-h-[120px]"
            />
            <div className="flex justify-between items-center text-sm text-gray-500">
              <span>Words: {state.inputText.split(/\s+/).filter(w => w.length > 0).length}</span>
              <span>Characters: {state.inputText.length}</span>
            </div>
          </div>

          {/* Action Button */}
          <Button
            onClick={handleEnhanceText}
            disabled={!state.inputText.trim() || state.isProcessing}
            className="w-full"
          >
            {state.isProcessing ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Processing...
              </>
            ) : (
              <>
                <Zap className="mr-2 h-4 w-4" />
                Enhance Text Response
              </>
            )}
          </Button>

          {/* Error Display */}
          {state.error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{state.error}</AlertDescription>
            </Alert>
          )}

          {/* Results */}
          {state.enhancedResponse && state.qualityReport && (
            <Tabs defaultValue="enhanced" className="w-full">
              <TabsList className="grid w-full grid-cols-4">
                <TabsTrigger value="enhanced">Enhanced Text</TabsTrigger>
                <TabsTrigger value="comparison">Comparison</TabsTrigger>
                <TabsTrigger value="metrics">Metrics</TabsTrigger>
                <TabsTrigger value="quality">Quality Report</TabsTrigger>
              </TabsList>

              <TabsContent value="enhanced" className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2">
                      <CheckCircle className="h-5 w-5 text-green-500" />
                      Enhanced Content
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="prose max-w-none">
                      <div className="bg-gray-50 p-4 rounded-lg whitespace-pre-wrap">
                        {state.enhancedResponse.enhancedContent}
                      </div>
                    </div>
                    
                    {state.enhancedResponse.improvements.length > 0 && (
                      <div className="mt-4">
                        <h4 className="font-medium mb-2">Improvements Made:</h4>
                        <ul className="space-y-1">
                          {state.enhancedResponse.improvements.map((improvement, index) => (
                            <li key={index} className="flex items-center gap-2 text-sm">
                              <CheckCircle className="h-3 w-3 text-green-500" />
                              {improvement}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="comparison" className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-base">Original Text</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="bg-red-50 p-3 rounded-lg text-sm whitespace-pre-wrap">
                        {state.enhancedResponse.originalContent}
                      </div>
                    </CardContent>
                  </Card>
                  
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-base">Enhanced Text</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="bg-green-50 p-3 rounded-lg text-sm whitespace-pre-wrap">
                        {state.enhancedResponse.enhancedContent}
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </TabsContent>

              <TabsContent value="metrics" className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  <Card>
                    <CardContent className="pt-6">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-medium text-gray-600">Word Count</p>
                          <p className="text-2xl font-bold">{state.enhancedResponse.metrics.wordCount}</p>
                        </div>
                        <FileText className="h-8 w-8 text-blue-500" />
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardContent className="pt-6">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-medium text-gray-600">Readability</p>
                          <p className="text-2xl font-bold">{state.enhancedResponse.metrics.readabilityScore.toFixed(1)}</p>
                        </div>
                        <BarChart3 className="h-8 w-8 text-green-500" />
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardContent className="pt-6">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-medium text-gray-600">Engagement</p>
                          <p className="text-2xl font-bold">{state.enhancedResponse.metrics.engagementScore}</p>
                        </div>
                        <Target className="h-8 w-8 text-purple-500" />
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardContent className="pt-6">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-medium text-gray-600">Processing Time</p>
                          <p className="text-2xl font-bold">{state.enhancedResponse.processingTime}ms</p>
                        </div>
                        <Clock className="h-8 w-8 text-orange-500" />
                      </div>
                    </CardContent>
                  </Card>
                </div>

                {/* Quality Score */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Overall Quality Score</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium">Quality Score</span>
                        <Badge className={getGradeColor(state.qualityReport.grade)}>
                          {state.enhancedResponse.qualityScore}/100 ({state.qualityReport.grade})
                        </Badge>
                      </div>
                      <Progress value={state.enhancedResponse.qualityScore} className="h-2" />
                    </div>
                  </CardContent>
                </Card>

                {/* Suggestions */}
                {state.enhancedResponse.suggestions.length > 0 && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">Suggestions for Further Improvement</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <ul className="space-y-2">
                        {state.enhancedResponse.suggestions.map((suggestion, index) => (
                          <li key={index} className="flex items-start gap-2 text-sm">
                            <Info className="h-4 w-4 text-blue-500 mt-0.5 flex-shrink-0" />
                            {suggestion}
                          </li>
                        ))}
                      </ul>
                    </CardContent>
                  </Card>
                )}
              </TabsContent>

              <TabsContent value="quality" className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg flex items-center justify-between">
                      Quality Validation Report
                      <Badge className={getGradeColor(state.qualityReport.grade)}>
                        Grade: {state.qualityReport.grade}
                      </Badge>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {/* Summary */}
                    <div className="grid grid-cols-3 gap-4 p-4 bg-gray-50 rounded-lg">
                      <div className="text-center">
                        <p className="text-2xl font-bold text-red-600">{state.qualityReport.summary.errors}</p>
                        <p className="text-sm text-gray-600">Errors</p>
                      </div>
                      <div className="text-center">
                        <p className="text-2xl font-bold text-yellow-600">{state.qualityReport.summary.warnings}</p>
                        <p className="text-sm text-gray-600">Warnings</p>
                      </div>
                      <div className="text-center">
                        <p className="text-2xl font-bold text-blue-600">{state.qualityReport.summary.infos}</p>
                        <p className="text-sm text-gray-600">Info</p>
                      </div>
                    </div>

                    {/* Detailed Results */}
                    <div className="space-y-3">
                      <h4 className="font-medium">Validation Results</h4>
                      {state.qualityReport.results.map(({ rule, result }, index) => (
                        <div
                          key={index}
                          className={`p-3 rounded-lg border ${
                            result.passed
                              ? 'bg-green-50 border-green-200'
                              : rule.severity === 'error'
                              ? 'bg-red-50 border-red-200'
                              : rule.severity === 'warning'
                              ? 'bg-yellow-50 border-yellow-200'
                              : 'bg-blue-50 border-blue-200'
                          }`}
                        >
                          <div className="flex items-start gap-3">
                            {result.passed ? (
                              <CheckCircle className="h-5 w-5 text-green-500 mt-0.5" />
                            ) : (
                              getSeverityIcon(rule.severity)
                            )}
                            <div className="flex-1">
                              <div className="flex items-center justify-between">
                                <h5 className="font-medium text-sm">{rule.name}</h5>
                                <Badge variant="outline" className="text-xs">
                                  {result.score}/100
                                </Badge>
                              </div>
                              <p className="text-sm text-gray-600 mt-1">{result.message}</p>
                              {result.suggestions && result.suggestions.length > 0 && (
                                <ul className="mt-2 space-y-1">
                                  {result.suggestions.map((suggestion, suggestionIndex) => (
                                    <li key={suggestionIndex} className="text-xs text-gray-500 ml-4">
                                      • {suggestion}
                                    </li>
                                  ))}
                                </ul>
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* Recommendations */}
                    {state.qualityReport.recommendations.length > 0 && (
                      <div className="space-y-3">
                        <h4 className="font-medium">Recommendations</h4>
                        <div className="space-y-2">
                          {state.qualityReport.recommendations.map((recommendation, index) => (
                            <div key={index} className="text-sm p-2 bg-blue-50 rounded border-l-4 border-blue-400">
                              {recommendation}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          )}
        </CardContent>
      </Card>
    </div>
  );
}