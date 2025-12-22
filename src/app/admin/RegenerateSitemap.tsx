"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { RefreshCw, CheckCircle2, XCircle } from "lucide-react";

export default function RegenerateSitemap() {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{ success: boolean; message: string } | null>(null);
  const { toast } = useToast();

  const handleRegenerate = async () => {
    setLoading(true);
    setResult(null);

    try {
      const response = await fetch("/api/sitemap/regenerate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
      });

      const data = await response.json();

      if (data.success) {
        setResult({ success: true, message: data.message });
        toast({
          title: "Success!",
          description: "Sitemap regenerated and submitted to Google Search Console",
        });
      } else {
        setResult({ success: false, message: data.message || data.error || "Failed to regenerate sitemap" });
        toast({
          title: "Error",
          description: data.message || "Failed to regenerate sitemap",
          variant: "destructive",
        });
      }
    } catch (error: any) {
      const errorMessage = error.message || "Failed to regenerate sitemap";
      setResult({ success: false, message: errorMessage });
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Regenerate Sitemap & Submit to Google</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="text-sm text-muted-foreground space-y-2">
          <p>
            This will regenerate the sitemap.xml and automatically submit it to Google Search Console.
          </p>
          <p className="text-xs">
            The sitemap is also automatically regenerated daily at 2 AM via cron job.
          </p>
        </div>

        <Button 
          size="sm" 
          onClick={handleRegenerate}
          disabled={loading}
          className="w-full sm:w-auto"
        >
          {loading ? (
            <>
              <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
              Processing...
            </>
          ) : (
            <>
              <RefreshCw className="h-4 w-4 mr-2" />
              Regenerate & Submit Now
            </>
          )}
        </Button>

        {result && (
          <div className={`p-3 rounded-lg flex items-start gap-2 ${
            result.success 
              ? "bg-green-50 border border-green-200" 
              : "bg-red-50 border border-red-200"
          }`}>
            {result.success ? (
              <CheckCircle2 className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" />
            ) : (
              <XCircle className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
            )}
            <div className="flex-1">
              <p className={`text-sm font-medium ${
                result.success ? "text-green-800" : "text-red-800"
              }`}>
                {result.success ? "Success" : "Error"}
              </p>
              <p className={`text-xs mt-1 ${
                result.success ? "text-green-700" : "text-red-700"
              }`}>
                {result.message}
              </p>
            </div>
          </div>
        )}

        <div className="text-xs text-muted-foreground pt-2 border-t">
          <p className="font-semibold mb-1">Sitemap URL:</p>
          <code className="bg-muted px-2 py-1 rounded text-xs">
            https://www.westsiderealty.in/sitemap.xml
          </code>
        </div>
      </CardContent>
    </Card>
  );
}




