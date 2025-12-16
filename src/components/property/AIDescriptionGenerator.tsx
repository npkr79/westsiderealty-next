
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Sparkles, RefreshCw } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface AIDescriptionGeneratorProps {
  formData: any;
  onDescriptionGenerated: (description: string) => void;
  currentDescription?: string;
}

const AIDescriptionGenerator = ({ 
  formData, 
  onDescriptionGenerated, 
  currentDescription = "" 
}: AIDescriptionGeneratorProps) => {
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedDescription, setGeneratedDescription] = useState(currentDescription);
  const { toast } = useToast();

  const generateDescription = async () => {
    if (!formData.title || !formData.propertyType || !formData.location) {
      toast({
        title: "Missing Information",
        description: "Please fill in title, property type, and location before generating description.",
        variant: "destructive"
      });
      return;
    }

    setIsGenerating(true);
    try {
      // Simulate AI generation with a realistic description
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      const description = generateRealisticDescription(formData);
      setGeneratedDescription(description);
      onDescriptionGenerated(description);
      
      toast({
        title: "Description Generated!",
        description: "AI has generated a property description based on your inputs."
      });
    } catch (error) {
      toast({
        title: "Generation Failed",
        description: "Failed to generate description. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const generateRealisticDescription = (data: any) => {
    const propertyTypes = {
      'apartment': 'apartment',
      'villa': 'villa',
      'house': 'house',
      'plot': 'plot',
      'commercial': 'commercial space'
    };

    const type = propertyTypes[data.propertyType as keyof typeof propertyTypes] || 'property';
    
    let description = `Discover this exceptional ${data.bedrooms || '2'}BHK ${type} located in the prime area of ${data.location}`;
    
    if (data.microMarket) {
      description += `, ${data.microMarket}`;
    }
    
    description += `. Spanning ${data.area || '1000'} sq ft, this ${type} offers modern living with excellent connectivity and amenities.`;

    if (data.amenities && data.amenities.length > 0) {
      description += `\n\nThe property features premium amenities including ${data.amenities.slice(0, 3).join(', ')}`;
      if (data.amenities.length > 3) {
        description += ` and many more`;
      }
      description += `.`;
    }

    if (data.uniqueUSPs && data.uniqueUSPs.length > 0) {
      description += `\n\nKey highlights include ${data.uniqueUSPs.slice(0, 2).join(' and ')}.`;
    }

    if (data.nearbyFacilities && data.nearbyFacilities.length > 0) {
      description += ` The location offers easy access to ${data.nearbyFacilities.slice(0, 3).join(', ')}.`;
    }

    description += `\n\nThis ${type} represents an excellent opportunity for both end-users and investors, offering great value in one of Hyderabad's most sought-after locations.`;

    return description;
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center">
          <Sparkles className="h-5 w-5 mr-2 text-purple-600" />
          AI Description Generator
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex space-x-2">
          <Button 
            type="button"
            onClick={generateDescription}
            disabled={isGenerating}
            className="bg-purple-600 hover:bg-purple-700"
          >
            {isGenerating ? (
              <>
                <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                Generating...
              </>
            ) : (
              <>
                <Sparkles className="h-4 w-4 mr-2" />
                Generate Description
              </>
            )}
          </Button>
        </div>

        {generatedDescription && (
          <div>
            <label className="block text-sm font-medium mb-2">Generated Description:</label>
            <Textarea
              value={generatedDescription}
              onChange={(e) => {
                setGeneratedDescription(e.target.value);
                onDescriptionGenerated(e.target.value);
              }}
              rows={6}
              className="resize-none"
              placeholder="AI generated description will appear here..."
            />
            <p className="text-sm text-gray-500 mt-2">
              You can edit the generated description above before using it.
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default AIDescriptionGenerator;
