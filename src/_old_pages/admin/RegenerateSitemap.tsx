import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from 'sonner';
import { CheckCircle2, XCircle, Loader2 } from 'lucide-react';
import SitemapSubmissionsTracker from '@/components/admin/SitemapSubmissionsTracker';

interface SitemapUrl {
  loc: string;
  lastmod: string;
  changefreq: string;
  priority: string;
}

export default function RegenerateSitemap() {
  const [loading, setLoading] = useState(false);
  const [urlCount, setUrlCount] = useState(0);
  const [error, setError] = useState<string | null>(null);

  const isValidSlug = (slug: string | null): boolean => {
    if (!slug || slug.length < 3 || slug.length > 200) return false;
    if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug)) return false;
    if (slug.startsWith('-') || slug.endsWith('-') || slug.includes('--')) return false;
    if (/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/.test(slug)) return false;
    return true;
  };

  const regenerateSitemap = async () => {
    setLoading(true);
    setError(null);
    setUrlCount(0);

    try {
      const baseUrl = 'https://www.westsiderealty.in';
      const urls: SitemapUrl[] = [];

      // Static pages
      const staticPages = [
        { path: '', priority: '1.0' },
        { path: '/about', priority: '0.8' },
        { path: '/properties', priority: '0.9' },
        { path: '/properties/hyderabad', priority: '0.9' },
        { path: '/properties/goa', priority: '0.9' },
        { path: '/properties/dubai', priority: '0.9' },
        { path: '/services', priority: '0.8' },
        { path: '/contact', priority: '0.7' },
        { path: '/blog', priority: '0.8' },
      ];

      staticPages.forEach(page => {
        urls.push({
          loc: `${baseUrl}${page.path}`,
          lastmod: new Date().toISOString().split('T')[0],
          changefreq: 'weekly',
          priority: page.priority,
        });
      });

      // Hyderabad properties
      const { data: hyderabadProps } = await supabase
        .from('hyderabad_properties')
        .select('seo_slug, slug, updated_at')
        .eq('status', 'active');

      hyderabadProps?.forEach(prop => {
        const slug = prop.seo_slug || prop.slug;
        if (slug && isValidSlug(slug)) {
          urls.push({
            loc: `${baseUrl}/hyderabad/${slug}`,
            lastmod: prop.updated_at?.split('T')[0] || new Date().toISOString().split('T')[0],
            changefreq: 'weekly',
            priority: '0.8',
          });
        }
      });

      // Goa properties
      const { data: goaProps } = await supabase
        .from('goa_holiday_properties')
        .select('seo_slug, updated_at')
        .eq('status', 'Active');

      goaProps?.forEach(prop => {
        const slug = prop.seo_slug;
        if (slug && isValidSlug(slug)) {
          urls.push({
            loc: `${baseUrl}/goa/${slug}`,
            lastmod: prop.updated_at?.split('T')[0] || new Date().toISOString().split('T')[0],
            changefreq: 'weekly',
            priority: '0.8',
          });
        }
      });

      // Dubai properties
      const { data: dubaiProps } = await supabase
        .from('dubai_properties')
        .select('seo_slug, slug, updated_at')
        .eq('status', 'active');

      dubaiProps?.forEach(prop => {
        const slug = prop.seo_slug || prop.slug;
        if (slug && isValidSlug(slug)) {
          urls.push({
            loc: `${baseUrl}/dubai/${slug}`,
            lastmod: prop.updated_at?.split('T')[0] || new Date().toISOString().split('T')[0],
            changefreq: 'weekly',
            priority: '0.8',
          });
        }
      });

      // Blog articles
      const { data: articles } = await supabase
        .from('blog_articles')
        .select('slug, updated_at')
        .eq('status', 'published');

      articles?.forEach(article => {
        if (article.slug && isValidSlug(article.slug)) {
          urls.push({
            loc: `${baseUrl}/blog/${article.slug}`,
            lastmod: article.updated_at?.split('T')[0] || new Date().toISOString().split('T')[0],
            changefreq: 'monthly',
            priority: '0.7',
          });
        }
      });

      // Landing Pages
      const { data: landingPages } = await supabase
        .from('landing_pages')
        .select('uri, updated_at')
        .eq('status', 'published');

      landingPages?.forEach(page => {
        if (page.uri && isValidSlug(page.uri)) {
          urls.push({
            loc: `${baseUrl}/${page.uri}`,
            lastmod: page.updated_at?.split('T')[0] || new Date().toISOString().split('T')[0],
            changefreq: 'weekly',
            priority: '0.9',
          });
        }
      });

      // Generate XML
      const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls.map(url => `  <url>
    <loc>${url.loc}</loc>
    <lastmod>${url.lastmod}</lastmod>
    <changefreq>${url.changefreq}</changefreq>
    <priority>${url.priority}</priority>
  </url>`).join('\n')}
</urlset>`;

      // Note: In a real implementation, you would need to save this to public/sitemap.xml
      // For now, we'll just show the count and allow download
      setUrlCount(urls.length);
      
      // Create download blob
      const blob = new Blob([xml], { type: 'text/xml' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'sitemap.xml';
      a.click();
      URL.revokeObjectURL(url);

      toast.success('Sitemap generated and downloaded!');
    } catch (err: any) {
      setError(err.message);
      toast.error('Failed to regenerate sitemap: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto p-6">
      <Tabs defaultValue="generate" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="generate">Generate Sitemap</TabsTrigger>
          <TabsTrigger value="tracking">Google Tracking</TabsTrigger>
        </TabsList>

        <TabsContent value="generate" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Regenerate Sitemap</CardTitle>
              <CardDescription>
                Generate a new sitemap.xml file with all current active properties and pages
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="text-sm text-muted-foreground">
                This will fetch all active properties from Hyderabad, Goa, Dubai, blog articles, and landing pages,
                and generate a fresh sitemap.xml file that you can download and upload to the public folder.
              </div>

              <Button onClick={regenerateSitemap} disabled={loading}>
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Generating...
                  </>
                ) : (
                  'Regenerate Sitemap'
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

              {urlCount > 0 && (
                <div className="flex items-center gap-2 text-green-600">
                  <CheckCircle2 className="h-5 w-5" />
                  <p className="font-medium">Sitemap generated with {urlCount} URLs and downloaded!</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="tracking" className="mt-6">
          <SitemapSubmissionsTracker />
        </TabsContent>
      </Tabs>
    </div>
  );
}
