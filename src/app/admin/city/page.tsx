import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { ArrowLeft, Save, Eye, Loader2 } from "lucide-react";
import { FeaturedDevelopersSelector } from "@/components/admin/city-editor/FeaturedDevelopersSelector";
import { JSONEditor } from "@/components/admin/city-editor/JSONEditor";
import { LifestyleInfraEditor } from "@/components/admin/city-editor/LifestyleInfraEditor";
import { ImageUploader } from "@/components/admin/ImageUploader";
import RichTextEditor from "@/components/property/RichTextEditor";

export default function CityEditor() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  
  const [formData, setFormData] = useState({
    city_name: "",
    country: "India",
    url_slug: "",
    seo_title: "",
    meta_description: "",
    h1_title: "",
    hero_hook: "",
    hero_image_url: "",
    city_overview_seo: "",
    average_price_sqft: "",
    annual_appreciation_pct: "",
    rental_yield_pct: "",
    page_status: "draft" as "draft" | "published",
    lifestyle_infrastructure_json: null as any,
    investment_zones_json: null as any
  });

  useEffect(() => {
    if (id) loadCity();
  }, [id]);

  const loadCity = async () => {
    const { data, error } = await supabase
      .from('cities')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      toast.error("Failed to load city");
      return;
    }

    if (data) {
      setFormData({
        city_name: data.city_name || "",
        country: data.country || "India",
        url_slug: data.url_slug || "",
        seo_title: data.seo_title || "",
        meta_description: data.meta_description || "",
        h1_title: data.h1_title || "",
        hero_hook: data.hero_hook || "",
        hero_image_url: data.hero_image_url || "",
        city_overview_seo: data.city_overview_seo || "",
        average_price_sqft: data.average_price_sqft?.toString() || "",
        annual_appreciation_pct: data.annual_appreciation_pct?.toString() || "",
        rental_yield_pct: data.rental_yield_pct?.toString() || "",
        page_status: (data.page_status as "draft" | "published") || "draft",
        lifestyle_infrastructure_json: data.lifestyle_infrastructure_json || null,
        investment_zones_json: data.investment_zones_json || null
      });
    }
  };

  const generateSlug = (name: string) => {
    return name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const slug = formData.url_slug || generateSlug(formData.city_name);
      const dataToSave = {
        ...formData,
        url_slug: slug,
        average_price_sqft: formData.average_price_sqft ? parseInt(formData.average_price_sqft) : null,
        annual_appreciation_pct: formData.annual_appreciation_pct ? parseFloat(formData.annual_appreciation_pct) : null,
        rental_yield_pct: formData.rental_yield_pct ? parseFloat(formData.rental_yield_pct) : null
      };

      if (id) {
        const { error } = await supabase
          .from('cities')
          .update(dataToSave)
          .eq('id', id);

        if (error) throw error;
        toast.success("City updated successfully");
      } else {
        const { error } = await supabase
          .from('cities')
          .insert([dataToSave]);

        if (error) throw error;
        toast.success("City created successfully");
      }

      navigate('/admin');
    } catch (error) {
      console.error('Error saving city:', error);
      toast.error("Failed to save city");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-4xl mx-auto">
        <Button
          variant="ghost"
          onClick={() => navigate('/admin')}
          className="mb-4"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Admin
        </Button>

        <Card>
          <CardHeader>
            <CardTitle>{id ? 'Edit City' : 'Create New City'}</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="city_name">City Name *</Label>
                  <Input
                    id="city_name"
                    value={formData.city_name}
                    onChange={(e) => setFormData(prev => ({ ...prev, city_name: e.target.value }))}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="country">Country *</Label>
                  <Input
                    id="country"
                    value={formData.country}
                    onChange={(e) => setFormData(prev => ({ ...prev, country: e.target.value }))}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="url_slug">URL Slug</Label>
                  <Input
                    id="url_slug"
                    value={formData.url_slug}
                    onChange={(e) => setFormData(prev => ({ ...prev, url_slug: e.target.value }))}
                    placeholder="Auto-generated from name"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="status">Status</Label>
                  <Select value={formData.page_status} onValueChange={(v: any) => setFormData(prev => ({ ...prev, page_status: v }))}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="draft">Draft</SelectItem>
                      <SelectItem value="published">Published</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="seo_title">SEO Title</Label>
                <Input
                  id="seo_title"
                  value={formData.seo_title}
                  onChange={(e) => setFormData(prev => ({ ...prev, seo_title: e.target.value }))}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="meta_description">Meta Description</Label>
                <Input
                  id="meta_description"
                  value={formData.meta_description}
                  onChange={(e) => setFormData(prev => ({ ...prev, meta_description: e.target.value }))}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="h1_title">H1 Title</Label>
                <Input
                  id="h1_title"
                  value={formData.h1_title}
                  onChange={(e) => setFormData(prev => ({ ...prev, h1_title: e.target.value }))}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="hero_hook">Hero Hook</Label>
                <Input
                  id="hero_hook"
                  value={formData.hero_hook}
                  onChange={(e) => setFormData(prev => ({ ...prev, hero_hook: e.target.value }))}
                />
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="avg_price">Avg Price/sqft (₹)</Label>
                  <Input
                    id="avg_price"
                    type="number"
                    value={formData.average_price_sqft}
                    onChange={(e) => setFormData(prev => ({ ...prev, average_price_sqft: e.target.value }))}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="appreciation">Annual Appreciation %</Label>
                  <Input
                    id="appreciation"
                    type="number"
                    step="0.1"
                    value={formData.annual_appreciation_pct}
                    onChange={(e) => setFormData(prev => ({ ...prev, annual_appreciation_pct: e.target.value }))}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="rental_yield">Rental Yield %</Label>
                  <Input
                    id="rental_yield"
                    type="number"
                    step="0.1"
                    value={formData.rental_yield_pct}
                    onChange={(e) => setFormData(prev => ({ ...prev, rental_yield_pct: e.target.value }))}
                  />
                </div>
              </div>

              <ImageUploader
                value={formData.hero_image_url}
                onChange={(url) => setFormData(prev => ({ ...prev, hero_image_url: url }))}
                bucket="project-hero-images"
                label="Hero Image"
              />

              <RichTextEditor
                value={formData.city_overview_seo}
                onChange={(value) => setFormData(prev => ({ ...prev, city_overview_seo: value }))}
                label="City Overview"
              />

              <LifestyleInfraEditor
                value={formData.lifestyle_infrastructure_json}
                onChange={(value) => setFormData(prev => ({ ...prev, lifestyle_infrastructure_json: value }))}
              />

              <JSONEditor
                value={formData.investment_zones_json}
                onChange={(value) => setFormData(prev => ({ ...prev, investment_zones_json: value }))}
                label="Investment Zones"
                description="Strategic investment zones with title, subtitle, introduction, zones array (title, subtitle, icon, content, highlights), and conclusion"
              />

              {id && (
                <Card>
                  <CardHeader>
                    <CardTitle>Featured Developers</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <FeaturedDevelopersSelector cityId={id} />
                  </CardContent>
                </Card>
              )}

              <div className="flex gap-4">
                <Button type="submit" disabled={loading}>
                  <Save className="mr-2 h-4 w-4" />
                  {loading ? 'Saving...' : 'Save City'}
                </Button>
                <Button type="button" variant="outline" onClick={() => navigate('/admin')}>
                  Cancel
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
