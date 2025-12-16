import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'sonner';
import { CheckCircle2, XCircle, Loader2 } from 'lucide-react';
import { slugify, ensureUniqueSlug } from '@/utils/seoUrlGenerator';

export default function FixMyScapeSlugs() {
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<{
    fixed: number;
    skipped: number;
    details: any[];
  }>({ fixed: 0, skipped: 0, details: [] });
  const [error, setError] = useState<string | null>(null);

  const fixSlugs = async () => {
    setLoading(true);
    setError(null);
    setResults({ fixed: 0, skipped: 0, details: [] });

    try {
      const tables = ['hyderabad_properties', 'goa_properties', 'dubai_properties'];
      let totalFixed = 0;
      let totalSkipped = 0;
      const allDetails: any[] = [];

      for (const table of tables) {
        console.log(`Processing ${table}...`);
        
        const { data: properties, error: fetchError } = await supabase
          .from(table as any)
          .select('id, title, location, slug, seo_slug');

        if (fetchError) {
          console.error(`Error fetching ${table}:`, fetchError);
          continue;
        }

        if (!properties || properties.length === 0) continue;

        const existingSlugs: string[] = [];
        
        for (const property of properties as any[]) {
          const hasTimestamp = /-\d{13}(-\d+)?$/.test(property.slug || '');
          const missingSeoSlug = !property.seo_slug;
          
          if (hasTimestamp || missingSeoSlug) {
            let baseSlug = slugify(property.title);
            
            const locationSlug = slugify(property.location);
            if (!baseSlug.includes(locationSlug)) {
              baseSlug += `-${locationSlug}`;
            }
            
            const newSlug = ensureUniqueSlug(baseSlug, existingSlugs);
            existingSlugs.push(newSlug);
            
            const { error: updateError } = await supabase
              .from(table as any)
              .update({ slug: newSlug, seo_slug: newSlug })
              .eq('id', property.id);
            
            if (updateError) {
              console.error(`Failed to update ${property.id}:`, updateError);
              totalSkipped++;
            } else {
              totalFixed++;
              allDetails.push({
                table,
                title: property.title,
                oldSlug: property.slug,
                newSlug: newSlug
              });
            }
          } else {
            existingSlugs.push(property.seo_slug || property.slug);
            totalSkipped++;
          }
        }
      }

      setResults({
        fixed: totalFixed,
        skipped: totalSkipped,
        details: allDetails.slice(0, 20)
      });
      
      toast.success(`Fixed ${totalFixed} property slugs!`);
    } catch (err: any) {
      setError(err.message);
      toast.error('Failed to fix slugs: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto p-6">
      <Card>
        <CardHeader>
          <CardTitle>Fix All Property Slugs</CardTitle>
          <CardDescription>
            Scan and fix property slugs across all locations (Hyderabad, Goa, Dubai)
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <p className="text-sm text-muted-foreground">
              This will find all properties with:
            </p>
            <ul className="text-sm text-muted-foreground list-disc list-inside space-y-1">
              <li>Timestamp suffixes (e.g., -1762008437494)</li>
              <li>Missing SEO slugs</li>
            </ul>
            <p className="text-sm text-muted-foreground mt-2">
              And generate clean, SEO-friendly slugs using your property titles.
            </p>
          </div>

          <Button onClick={fixSlugs} disabled={loading}>
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Processing...
              </>
            ) : (
              'Fix All Slugs Now'
            )}
          </Button>

          {error && (
            <div className="flex items-start gap-2 p-4 bg-destructive/10 border border-destructive rounded-lg">
              <XCircle className="h-5 w-5 text-destructive mt-0.5" />
              <div>
                <p className="font-medium text-destructive">Error</p>
                <p className="text-sm text-destructive/90">{error}</p>
              </div>
            </div>
          )}

          {results.fixed > 0 && (
            <div className="space-y-4">
              <div className="flex items-center gap-2 text-green-600">
                <CheckCircle2 className="h-5 w-5" />
                <p className="font-medium">Update Complete!</p>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="p-3 bg-green-50 rounded-lg">
                  <p className="text-sm text-muted-foreground">Fixed</p>
                  <p className="text-2xl font-bold text-green-600">{results.fixed}</p>
                </div>
                <div className="p-3 bg-muted rounded-lg">
                  <p className="text-sm text-muted-foreground">Skipped (already clean)</p>
                  <p className="text-2xl font-bold">{results.skipped}</p>
                </div>
              </div>

              {results.details.length > 0 && (
                <div className="space-y-2">
                  <p className="text-sm font-medium">Updated Properties (showing first 20):</p>
                  <div className="space-y-2 max-h-96 overflow-y-auto">
                    {results.details.map((prop, idx) => (
                      <div key={idx} className="p-3 bg-muted rounded-lg text-xs">
                        <p className="font-medium">{prop.title}</p>
                        <p className="text-muted-foreground">
                          <span className="line-through">{prop.oldSlug}</span>
                          {' → '}
                          <span className="text-green-600">{prop.newSlug}</span>
                        </p>
                        <p className="text-muted-foreground capitalize">{prop.table.replace('_', ' ')}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
