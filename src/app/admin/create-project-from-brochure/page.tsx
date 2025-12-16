"use client";

import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { AllDevelopersCombobox } from "@/components/admin/generate-pages/AllDevelopersCombobox";
import { CityCombobox } from "@/components/admin/generate-pages/CityCombobox";
import { MicromarketCombobox } from "@/components/admin/generate-pages/MicromarketCombobox";
import { 
  Wand2, 
  Upload, 
  FileText, 
  Building2, 
  MapPin, 
  CheckCircle2, 
  ExternalLink,
  Loader2,
  AlertCircle
} from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

interface FormData {
  projectName: string;
  developerId: string;
  developerName: string;
  cityId: string;
  cityName: string;
  citySlug: string;
  microMarketId: string;
  microMarketName: string;
  microMarketSlug: string;
  brochureFile: File | null;
  reraFile: File | null;
}

interface GenerationResult {
  status: "success" | "error";
  project_id?: string;
  url_slug?: string;
  public_url?: string;
  error?: string;
}

const slugify = (text: string): string => {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_-]+/g, '-')
    .replace(/^-+|-+$/g, '');
};

export default function CreateProjectFromBrochure() {
  const { toast } = useToast();
  const [formData, setFormData] = useState<FormData>({
    projectName: "",
    developerId: "",
    developerName: "",
    cityId: "",
    cityName: "",
    citySlug: "",
    microMarketId: "",
    microMarketName: "",
    microMarketSlug: "",
    brochureFile: null,
    reraFile: null,
  });
  const [isGenerating, setIsGenerating] = useState(false);
  const [progress, setProgress] = useState(0);
  const [progressMessage, setProgressMessage] = useState("");
  const [result, setResult] = useState<GenerationResult | null>(null);

  // Fetch additional data when selections change
  const handleDeveloperChange = async (developerId: string) => {
    if (!developerId) {
      setFormData(prev => ({ ...prev, developerId: "", developerName: "" }));
      return;
    }

    const { data } = await supabase
      .from('developers')
      .select('id, developer_name')
      .eq('id', developerId)
      .single();

    if (data) {
      setFormData(prev => ({
        ...prev,
        developerId: data.id,
        developerName: data.developer_name,
      }));
    }
  };

  const handleCityChange = async (cityId: string) => {
    if (!cityId) {
      setFormData(prev => ({ 
        ...prev, 
        cityId: "", 
        cityName: "", 
        citySlug: "",
        microMarketId: "",
        microMarketName: "",
        microMarketSlug: ""
      }));
      return;
    }

    const { data } = await supabase
      .from('cities')
      .select('id, city_name, url_slug')
      .eq('id', cityId)
      .single();

    if (data) {
      setFormData(prev => ({
        ...prev,
        cityId: data.id,
        cityName: data.city_name,
        citySlug: data.url_slug,
        microMarketId: "",
        microMarketName: "",
        microMarketSlug: ""
      }));
    }
  };

  const handleMicroMarketChange = async (microMarketId: string) => {
    if (!microMarketId) {
      setFormData(prev => ({ 
        ...prev, 
        microMarketId: "", 
        microMarketName: "",
        microMarketSlug: ""
      }));
      return;
    }

    const { data } = await supabase
      .from('micro_markets')
      .select('id, micro_market_name, url_slug')
      .eq('id', microMarketId)
      .single();

    if (data) {
      setFormData(prev => ({
        ...prev,
        microMarketId: data.id,
        microMarketName: data.micro_market_name,
        microMarketSlug: data.url_slug,
      }));
    }
  };

  const handleFileChange = (type: 'brochure' | 'rera') => (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Validate file type
      if (file.type !== 'application/pdf') {
        toast({
          title: "Invalid file type",
          description: "Please upload a PDF file",
          variant: "destructive",
        });
        return;
      }
      // Validate file size (25MB limit)
      if (file.size > 25 * 1024 * 1024) {
        toast({
          title: "File too large",
          description: "Maximum file size is 25MB",
          variant: "destructive",
        });
        return;
      }
      
      if (type === 'brochure') {
        setFormData(prev => ({ ...prev, brochureFile: file }));
      } else {
        setFormData(prev => ({ ...prev, reraFile: file }));
      }
    }
  };

  const validateForm = (): boolean => {
    if (!formData.projectName.trim()) {
      toast({ title: "Error", description: "Please enter a project name", variant: "destructive" });
      return false;
    }
    if (!formData.developerId) {
      toast({ title: "Error", description: "Please select a developer", variant: "destructive" });
      return false;
    }
    if (!formData.cityId) {
      toast({ title: "Error", description: "Please select a city", variant: "destructive" });
      return false;
    }
    if (!formData.microMarketId) {
      toast({ title: "Error", description: "Please select a micro market", variant: "destructive" });
      return false;
    }
    if (!formData.brochureFile) {
      toast({ title: "Error", description: "Please upload a brochure PDF", variant: "destructive" });
      return false;
    }
    if (!formData.reraFile) {
      toast({ title: "Error", description: "Please upload a RERA PDF", variant: "destructive" });
      return false;
    }
    return true;
  };

  const uploadFile = async (file: File, bucket: string, path: string): Promise<string> => {
    const { data, error } = await supabase.storage
      .from(bucket)
      .upload(path, file, { 
        cacheControl: '3600',
        upsert: true 
      });

    if (error) {
      throw new Error(`Failed to upload ${file.name}: ${error.message}`);
    }

    return data.path;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) return;

    setIsGenerating(true);
    setProgress(0);
    setResult(null);

    try {
      const projectSlug = slugify(formData.projectName);

      // Step 1: Upload brochure PDF
      setProgressMessage("Uploading brochure PDF...");
      setProgress(10);
      
      const brochurePath = `${projectSlug}.pdf`;
      await uploadFile(formData.brochureFile!, 'brochures', brochurePath);

      // Step 2: Upload RERA PDF
      setProgressMessage("Uploading RERA PDF...");
      setProgress(20);
      
      const reraPath = `${projectSlug}-rera.pdf`;
      await uploadFile(formData.reraFile!, 'documents', reraPath);

      // Step 3: Call edge function
      setProgressMessage("Generating project content with AI...");
      setProgress(30);

      const { data, error } = await supabase.functions.invoke('create-project-from-brochure', {
        body: {
          project_name: formData.projectName,
          developer_id: formData.developerId,
          developer_name: formData.developerName,
          city_id: formData.cityId,
          city_name: formData.cityName,
          city_slug: formData.citySlug,
          micro_market_id: formData.microMarketId,
          micro_market_name: formData.microMarketName,
          micro_market_slug: formData.microMarketSlug,
          brochure_path: brochurePath,
          rera_path: reraPath,
        },
      });

      // Check for error in response - edge function returns error details in data
      if (error || data?.status === 'error') {
        const errorMessage = data?.error || error?.message || 'Unknown error occurred';
        const errorDetails = data?.details ? `\n\nDetails: ${data.details}` : '';
        throw new Error(`${errorMessage}${errorDetails}`);
      }

      // Monitor progress from response
      if (data.status === 'success') {
        setProgress(100);
        setProgressMessage("Project created successfully!");
        setResult(data);
        
        toast({
          title: "Success!",
          description: `Project "${formData.projectName}" has been created`,
        });

        // Reset form
        setFormData({
          projectName: "",
          developerId: "",
          developerName: "",
          cityId: "",
          cityName: "",
          citySlug: "",
          microMarketId: "",
          microMarketName: "",
          microMarketSlug: "",
          brochureFile: null,
          reraFile: null,
        });
      } else {
        throw new Error(data?.error || 'Unknown error occurred');
      }

    } catch (error: any) {
      console.error('Error creating project:', error);
      setResult({
        status: "error",
        error: error.message || "Failed to create project",
      });
      toast({
        title: "Error",
        description: error.message || "Failed to create project",
        variant: "destructive",
      });
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Wand2 className="h-5 w-5" />
            Create Project from Brochure
          </CardTitle>
          <CardDescription>
            Upload a brochure and RERA PDF to automatically generate a complete project listing with AI-powered content and image extraction
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Project Name */}
            <div className="space-y-2">
              <Label htmlFor="projectName" className="flex items-center gap-2">
                <Building2 className="h-4 w-4" />
                Project Name
              </Label>
              <Input
                id="projectName"
                placeholder="Enter project name (e.g., Godrej Regal Heights)"
                value={formData.projectName}
                onChange={(e) => setFormData(prev => ({ ...prev, projectName: e.target.value }))}
                disabled={isGenerating}
              />
            </div>

            {/* Developer Selection */}
            <div className="space-y-2">
              <Label className="flex items-center gap-2">
                <Building2 className="h-4 w-4" />
                Developer
              </Label>
              <AllDevelopersCombobox
                value={formData.developerId}
                onValueChange={handleDeveloperChange}
              />
            </div>

            {/* City Selection */}
            <div className="space-y-2">
              <Label className="flex items-center gap-2">
                <MapPin className="h-4 w-4" />
                City
              </Label>
              <CityCombobox
                value={formData.cityId}
                onValueChange={handleCityChange}
              />
            </div>

            {/* Micro Market Selection */}
            <div className="space-y-2">
              <Label className="flex items-center gap-2">
                <MapPin className="h-4 w-4" />
                Micro Market
              </Label>
              <MicromarketCombobox
                cityId={formData.cityId || null}
                value={formData.microMarketId}
                onValueChange={handleMicroMarketChange}
              />
            </div>

            {/* File Uploads */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Brochure Upload */}
              <div className="space-y-2">
                <Label htmlFor="brochure" className="flex items-center gap-2">
                  <FileText className="h-4 w-4" />
                  Brochure PDF
                </Label>
                <div className="flex items-center gap-2">
                  <Input
                    id="brochure"
                    type="file"
                    accept=".pdf"
                    onChange={handleFileChange('brochure')}
                    disabled={isGenerating}
                    className="cursor-pointer"
                  />
                  {formData.brochureFile && (
                    <CheckCircle2 className="h-5 w-5 text-green-500 flex-shrink-0" />
                  )}
                </div>
                <p className="text-xs text-muted-foreground">
                  Max 25MB. PDF only.
                </p>
              </div>

              {/* RERA Upload */}
              <div className="space-y-2">
                <Label htmlFor="rera" className="flex items-center gap-2">
                  <FileText className="h-4 w-4" />
                  RERA Certificate PDF
                </Label>
                <div className="flex items-center gap-2">
                  <Input
                    id="rera"
                    type="file"
                    accept=".pdf"
                    onChange={handleFileChange('rera')}
                    disabled={isGenerating}
                    className="cursor-pointer"
                  />
                  {formData.reraFile && (
                    <CheckCircle2 className="h-5 w-5 text-green-500 flex-shrink-0" />
                  )}
                </div>
                <p className="text-xs text-muted-foreground">
                  Max 25MB. PDF only.
                </p>
              </div>
            </div>

            {/* Progress Indicator */}
            {isGenerating && (
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span className="text-sm text-muted-foreground">{progressMessage}</span>
                </div>
                <Progress value={progress} className="w-full" />
              </div>
            )}

            {/* Submit Button */}
            <Button
              type="submit"
              disabled={isGenerating}
              className="w-full"
              size="lg"
            >
              {isGenerating ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Generating Project...
                </>
              ) : (
                <>
                  <Wand2 className="mr-2 h-4 w-4" />
                  Generate Project from Brochure
                </>
              )}
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Result Display */}
      {result && (
        <Card>
          <CardContent className="pt-6">
            {result.status === "success" ? (
              <Alert className="border-green-200 bg-green-50">
                <CheckCircle2 className="h-4 w-4 text-green-600" />
                <AlertTitle className="text-green-800">Project Created Successfully!</AlertTitle>
                <AlertDescription className="text-green-700">
                  <div className="space-y-2 mt-2">
                    <p><strong>Project ID:</strong> {result.project_id}</p>
                    <p><strong>URL Slug:</strong> {result.url_slug}</p>
                    <Button
                      variant="outline"
                      size="sm"
                      asChild
                      className="mt-2"
                    >
                      <a href={result.public_url} target="_blank" rel="noopener noreferrer">
                        <ExternalLink className="mr-2 h-4 w-4" />
                        View Project Page
                      </a>
                    </Button>
                  </div>
                </AlertDescription>
              </Alert>
            ) : (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>Error</AlertTitle>
                <AlertDescription>{result.error}</AlertDescription>
              </Alert>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
