'use client';

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { toast } from 'sonner';
import { Copy, Download, RefreshCw, Save, Settings, Wand2, Eye, History } from 'lucide-react';
import { 
  SampleResponseType, 
  ResponseLength, 
  ResponseTone, 
  SampleResponseContext, 
  SampleResponseResult,
  SampleResponseRequest,
  SAMPLE_RESPONSE_TYPES,
  RESPONSE_LENGTHS,
  RESPONSE_TONES
} from '@/types/sampleResponse';

interface SampleResponseGeneratorProps {
  initialType?: SampleResponseType;
  initialContext?: SampleResponseContext;
  onGenerate?: (response: SampleResponseResult) => void;
  onError?: (error: any) => void;
  showAdvancedOptions?: boolean;
  enableSaveToHistory?: boolean;
  className?: string;
}

export function SampleResponseGenerator({
  initialType = 'market_analysis',
  initialContext = {},
  onGenerate,
  onError,
  showAdvancedOptions = true,
  enableSaveToHistory = true,
  className = ''
}: SampleResponseGeneratorProps) {
  const [type, setType] = useState<SampleResponseType>(initialType);
  const [length, setLength] = useState<ResponseLength>('medium');
  const [tone, setTone] = useState<ResponseTone>('professional');
  const [context, setContext] = useState<SampleResponseContext>(initialContext);
  const [customPrompt, setCustomPrompt] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [currentResponse, setCurrentResponse] = useState<SampleResponseResult | null>(null);
  const [history, setHistory] = useState<SampleResponseResult[]>([]);
  const [showPreview, setShowPreview] = useState(false);

  // Context form fields based on type
  const getContextFields = (responseType: SampleResponseType) => {
    const commonFields = [
      { key: 'cityName', label: 'City Name', type: 'text', placeholder: 'e.g., Hyderabad' },
      { key: 'avgPrice', label: 'Average Price/sqft', type: 'number', placeholder: 'e.g., 5500' },
      { key: 'appreciation', label: 'Appreciation %', type: 'number', placeholder: 'e.g., 10' },
      { key: 'rentalYield', label: 'Rental Yield %', type: 'number', placeholder: 'e.g., 7' }
    ];

    const typeSpecificFields: Record<SampleResponseType, any[]> = {
      market_analysis: [
        ...commonFields,
        { key: 'topAreas', label: 'Top Areas', type: 'text', placeholder: 'e.g., Gachibowli, Kondapur, Kokapet' },
        { key: 'projectCount', label: 'Active Projects', type: 'number', placeholder: 'e.g., 25' },
        { key: 'demandLevel', label: 'Demand Level', type: 'select', options: ['Low', 'Moderate', 'Strong', 'Very Strong'] }
      ],
      property_description: [
        { key: 'projectName', label: 'Project Name', type: 'text', placeholder: 'e.g., Premium Residences' },
        { key: 'developerName', label: 'Developer Name', type: 'text', placeholder: 'e.g., Prestigious Developers' },
        { key: 'micromarketName', label: 'Location', type: 'text', placeholder: 'e.g., Gachibowli' },
        { key: 'configurations', label: 'Configurations', type: 'text', placeholder: 'e.g., 2 BHK, 3 BHK, 4 BHK' },
        { key: 'priceRange', label: 'Price Range', type: 'text', placeholder: 'e.g., ₹60 lakhs - ₹1.2 crores' },
        { key: 'amenities', label: 'Key Amenities', type: 'text', placeholder: 'e.g., Swimming Pool, Gym, Clubhouse' }
      ],
      investment_advice: [
        ...commonFields,
        { key: 'investorType', label: 'Investor Type', type: 'select', options: ['First-time investor', 'Experienced investor', 'NRI investor', 'Institutional investor'] },
        { key: 'budgetRange', label: 'Budget Range', type: 'text', placeholder: 'e.g., ₹50 lakhs - ₹1.5 crores' },
        { key: 'timeframe', label: 'Investment Timeframe', type: 'select', options: ['1-2 years', '3-5 years', '5-10 years', '10+ years'] },
        { key: 'riskLevel', label: 'Risk Tolerance', type: 'select', options: ['Conservative', 'Moderate', 'Aggressive'] }
      ],
      location_overview: [
        { key: 'locationName', label: 'Location Name', type: 'text', placeholder: 'e.g., Gachibowli' },
        { key: 'cityName', label: 'City Name', type: 'text', placeholder: 'e.g., Hyderabad' },
        { key: 'distanceFromCenter', label: 'Distance from Center', type: 'text', placeholder: 'e.g., 15 km' },
        { key: 'connectivity', label: 'Connectivity Options', type: 'text', placeholder: 'e.g., Metro, IT Parks, Airport' },
        { key: 'amenities', label: 'Key Amenities', type: 'text', placeholder: 'e.g., Schools, Hospitals, Malls' }
      ],
      custom: []
    };

    return typeSpecificFields[responseType] || commonFields;
  };

  const handleContextChange = (key: string, value: any) => {
    setContext(prev => ({
      ...prev,
      [key]: value
    }));
  };

  const generateResponse = async () => {
    setIsGenerating(true);
    try {
      const request: SampleResponseRequest = {
        type,
        context,
        customPrompt: type === 'custom' ? customPrompt : undefined,
        length,
        tone,
        includeMetadata: true,
        saveToHistory: enableSaveToHistory
      };

      const response = await fetch('/api/admin/sample-response', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(request),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result: SampleResponseResult = await response.json();
      setCurrentResponse(result);
      setHistory(prev => [result, ...prev.slice(0, 9)]); // Keep last 10 responses
      
      if (onGenerate) {
        onGenerate(result);
      }

      toast.success('Sample response generated successfully!', {
        description: `Generated ${result.wordCount} words in ${result.metadata.processingTime}ms`
      });
    } catch (error: any) {
      console.error('Error generating response:', error);
      toast.error('Failed to generate response', {
        description: error.message || 'An unexpected error occurred'
      });
      
      if (onError) {
        onError(error);
      }
    } finally {
      setIsGenerating(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success('Copied to clipboard!');
  };

  const downloadResponse = (response: SampleResponseResult) => {
    const content = `# ${SAMPLE_RESPONSE_TYPES[response.type]} - ${response.metadata.length} (${response.metadata.tone})

Generated: ${new Date(response.generatedAt).toLocaleString()}
Word Count: ${response.wordCount}
Quality Score: ${response.quality?.score ? (response.quality.score * 100).toFixed(1) + '%' : 'N/A'}

## Content

${response.content}

## Context Used

${JSON.stringify(response.context, null, 2)}

## Metadata

${JSON.stringify(response.metadata, null, 2)}
`;

    const blob = new Blob([content], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `sample-response-${response.id}.md`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const contextFields = getContextFields(type);

  return (
    <div className={`space-y-6 ${className}`}>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Wand2 className="h-5 w-5" />
            Sample Response Generator
          </CardTitle>
          <CardDescription>
            Generate sample text responses for different real estate content types with customizable context and tone.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="generate" className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="generate">Generate</TabsTrigger>
              <TabsTrigger value="preview">Preview</TabsTrigger>
              <TabsTrigger value="history">History</TabsTrigger>
            </TabsList>

            <TabsContent value="generate" className="space-y-6">
              {/* Basic Settings */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="type">Response Type</Label>
                  <Select value={type} onValueChange={(value) => setType(value as SampleResponseType)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select type" />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.entries(SAMPLE_RESPONSE_TYPES).map(([key, label]) => (
                        <SelectItem key={key} value={key}>{label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="length">Length</Label>
                  <Select value={length} onValueChange={(value) => setLength(value as ResponseLength)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select length" />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.entries(RESPONSE_LENGTHS).map(([key, label]) => (
                        <SelectItem key={key} value={key}>{label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="tone">Tone</Label>
                  <Select value={tone} onValueChange={(value) => setTone(value as ResponseTone)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select tone" />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.entries(RESPONSE_TONES).map(([key, label]) => (
                        <SelectItem key={key} value={key}>{label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Custom Prompt for Custom Type */}
              {type === 'custom' && (
                <div className="space-y-2">
                  <Label htmlFor="customPrompt">Custom Prompt</Label>
                  <Textarea
                    id="customPrompt"
                    placeholder="Enter your custom prompt here..."
                    value={customPrompt}
                    onChange={(e) => setCustomPrompt(e.target.value)}
                    rows={3}
                  />
                </div>
              )}

              {/* Context Fields */}
              {contextFields.length > 0 && (
                <Accordion type="single" collapsible className="w-full">
                  <AccordionItem value="context">
                    <AccordionTrigger>
                      <div className="flex items-center gap-2">
                        <Settings className="h-4 w-4" />
                        Context Settings
                        <Badge variant="secondary">{Object.keys(context).length} fields set</Badge>
                      </div>
                    </AccordionTrigger>
                    <AccordionContent>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4">
                        {contextFields.map((field) => (
                          <div key={field.key} className="space-y-2">
                            <Label htmlFor={field.key}>{field.label}</Label>
                            {field.type === 'select' ? (
                              <Select
                                value={context[field.key] || ''}
                                onValueChange={(value) => handleContextChange(field.key, value)}
                              >
                                <SelectTrigger>
                                  <SelectValue placeholder={`Select ${field.label.toLowerCase()}`} />
                                </SelectTrigger>
                                <SelectContent>
                                  {field.options?.map((option: string) => (
                                    <SelectItem key={option} value={option}>{option}</SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            ) : (
                              <Input
                                id={field.key}
                                type={field.type}
                                placeholder={field.placeholder}
                                value={context[field.key] || ''}
                                onChange={(e) => handleContextChange(field.key, 
                                  field.type === 'number' ? Number(e.target.value) : e.target.value
                                )}
                              />
                            )}
                          </div>
                        ))}
                      </div>
                    </AccordionContent>
                  </AccordionItem>
                </Accordion>
              )}

              {/* Generate Button */}
              <div className="flex justify-center">
                <Button 
                  onClick={generateResponse} 
                  disabled={isGenerating || (type === 'custom' && !customPrompt.trim())}
                  size="lg"
                  className="min-w-[200px]"
                >
                  {isGenerating ? (
                    <>
                      <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                      Generating...
                    </>
                  ) : (
                    <>
                      <Wand2 className="mr-2 h-4 w-4" />
                      Generate Response
                    </>
                  )}
                </Button>
              </div>
            </TabsContent>

            <TabsContent value="preview" className="space-y-4">
              {currentResponse ? (
                <Card>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div>
                        <CardTitle className="text-lg">
                          {SAMPLE_RESPONSE_TYPES[currentResponse.type]}
                        </CardTitle>
                        <CardDescription>
                          Generated {new Date(currentResponse.generatedAt).toLocaleString()}
                        </CardDescription>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant="outline">{currentResponse.metadata.length}</Badge>
                        <Badge variant="outline">{currentResponse.metadata.tone}</Badge>
                        <Badge variant="secondary">{currentResponse.wordCount} words</Badge>
                        {currentResponse.quality && (
                          <Badge variant={currentResponse.quality.score > 0.8 ? "default" : "secondary"}>
                            {(currentResponse.quality.score * 100).toFixed(0)}% quality
                          </Badge>
                        )}
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="prose max-w-none">
                        <div className="whitespace-pre-wrap bg-gray-50 p-4 rounded-lg border">
                          {currentResponse.content}
                        </div>
                      </div>
                      
                      <div className="flex gap-2">
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => copyToClipboard(currentResponse.content)}
                        >
                          <Copy className="mr-2 h-4 w-4" />
                          Copy
                        </Button>
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => downloadResponse(currentResponse)}
                        >
                          <Download className="mr-2 h-4 w-4" />
                          Download
                        </Button>
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={generateResponse}
                          disabled={isGenerating}
                        >
                          <RefreshCw className="mr-2 h-4 w-4" />
                          Regenerate
                        </Button>
                      </div>

                      {/* Quality Assessment */}
                      {currentResponse.quality && (
                        <div className="bg-blue-50 p-4 rounded-lg">
                          <h4 className="font-medium mb-2">Quality Assessment</h4>
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                            <div>
                              <div className="text-gray-600">Relevance</div>
                              <div className="font-medium">{(currentResponse.quality.factors.relevance * 100).toFixed(0)}%</div>
                            </div>
                            <div>
                              <div className="text-gray-600">Coherence</div>
                              <div className="font-medium">{(currentResponse.quality.factors.coherence * 100).toFixed(0)}%</div>
                            </div>
                            <div>
                              <div className="text-gray-600">Completeness</div>
                              <div className="font-medium">{(currentResponse.quality.factors.completeness * 100).toFixed(0)}%</div>
                            </div>
                            <div>
                              <div className="text-gray-600">Engagement</div>
                              <div className="font-medium">{(currentResponse.quality.factors.engagement * 100).toFixed(0)}%</div>
                            </div>
                          </div>
                        </div>
                      )}

                      {/* Context Used */}
                      {currentResponse.context && Object.keys(currentResponse.context).length > 0 && (
                        <Accordion type="single" collapsible>
                          <AccordionItem value="context-used">
                            <AccordionTrigger>Context Used</AccordionTrigger>
                            <AccordionContent>
                              <div className="bg-gray-50 p-4 rounded-lg">
                                <pre className="text-sm overflow-x-auto">
                                  {JSON.stringify(currentResponse.context, null, 2)}
                                </pre>
                              </div>
                            </AccordionContent>
                          </AccordionItem>
                        </Accordion>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ) : (
                <Card>
                  <CardContent className="flex items-center justify-center py-12">
                    <div className="text-center text-gray-500">
                      <Eye className="h-12 w-12 mx-auto mb-4 opacity-50" />
                      <p>No response generated yet</p>
                      <p className="text-sm">Generate a response to see the preview</p>
                    </div>
                  </CardContent>
                </Card>
              )}
            </TabsContent>

            <TabsContent value="history" className="space-y-4">
              {history.length > 0 ? (
                <div className="space-y-4">
                  {history.map((response, index) => (
                    <Card key={response.id} className="cursor-pointer hover:shadow-md transition-shadow">
                      <CardHeader className="pb-3">
                        <div className="flex items-center justify-between">
                          <div>
                            <CardTitle className="text-base">
                              {SAMPLE_RESPONSE_TYPES[response.type]}
                            </CardTitle>
                            <CardDescription>
                              {new Date(response.generatedAt).toLocaleString()}
                            </CardDescription>
                          </div>
                          <div className="flex items-center gap-2">
                            <Badge variant="outline" className="text-xs">
                              {response.metadata.length}
                            </Badge>
                            <Badge variant="outline" className="text-xs">
                              {response.wordCount}w
                            </Badge>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => setCurrentResponse(response)}
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent className="pt-0">
                        <p className="text-sm text-gray-600 line-clamp-2">
                          {response.content.substring(0, 150)}...
                        </p>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : (
                <Card>
                  <CardContent className="flex items-center justify-center py-12">
                    <div className="text-center text-gray-500">
                      <History className="h-12 w-12 mx-auto mb-4 opacity-50" />
                      <p>No history available</p>
                      <p className="text-sm">Generated responses will appear here</p>
                    </div>
                  </CardContent>
                </Card>
              )}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}