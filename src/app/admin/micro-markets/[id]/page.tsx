import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ImageUploader } from "@/components/admin/ImageUploader";
import RichTextEditor from "@/components/property/RichTextEditor";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { ArrowLeft, Save } from "lucide-react";

export default function MicromarketEditor() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [cities, setCities] = useState<any[]>([]);
  
  const [formData, setFormData] = useState({
    micro_market_name: "",
    city_id: "",
    url_slug: "",
    seo_title: "",
    meta_description: "",
    h1_title: "",
    hero_hook: "",
    hero_image_url: "",
    growth_story: "",
    connectivity_details: "",
    infrastructure_details: "",
    price_per_sqft_min: "",
    price_per_sqft_max: "",
    status: "draft" as "draft" | "published"
  });

  useEffect(() => {
    loadCities();
    if (id) loadMicromarket();
  }, [id]);

  const loadCities = async () => {
    const { data } = await supabase
      .from('cities')
      .select('id, city_name')
      .order('city_name');
    
    if (data) setCities(data);
  };

  const loadMicromarket = async () => {
    const { data, error } = await supabase
      .from('micro_markets')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      toast.error("Failed to load micromarket");
      return;
    }

    if (data) {
      setFormData({
        micro_market_name: data.micro_market_name || "",
        city_id: data.city_id || "",
        url_slug: data.url_slug || "",
        seo_title: data.seo_title || "",
        meta_description: data.meta_description || "",
        h1_title: data.h1_title || "",
        hero_hook: data.hero_hook || "",
        hero_image_url: data.hero_image_url || "",
        growth_story: data.growth_story || "",
        connectivity_details: data.connectivity_details || "",
        infrastructure_details: data.infrastructure_details || "",
        price_per_sqft_min: data.price_per_sqft_min?.toString() || "",
        price_per_sqft_max: data.price_per_sqft_max?.toString() || "",
        status: (data.status as "draft" | "published") || "draft"
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
      const slug = formData.url_slug || generateSlug(formData.micro_market_name);
      const dataToSave = {
        ...formData,
        url_slug: slug,
        price_per_sqft_min: formData.price_per_sqft_min ? parseInt(formData.price_per_sqft_min) : null,
        price_per_sqft_max: formData.price_per_sqft_max ? parseInt(formData.price_per_sqft_max) : null
      };

      if (id) {
        const { error } = await supabase
          .from('micro_markets')
          .update(dataToSave)
          .eq('id', id);

        if (error) throw error;
        toast.success("Micromarket updated successfully");
      } else {
        const { error } = await supabase
          .from('micro_markets')
          .insert([dataToSave]);

        if (error) throw error;
        toast.success("Micromarket created successfully");
      }

      navigate('/admin');
    } catch (error) {
      console.error('Error saving micromarket:', error);
      toast.error("Failed to save micromarket");
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
            <CardTitle>{id ? 'Edit Micromarket' : 'Create New Micromarket'}</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="micro_market_name">Micromarket Name *</Label>
                  <Input
                    id="micro_market_name"
                    value={formData.micro_market_name}
                    onChange={(e) => setFormData(prev => ({ ...prev, micro_market_name: e.target.value }))}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="city">City *</Label>
                  <Select value={formData.city_id} onValueChange={(v) => setFormData(prev => ({ ...prev, city_id: v }))} required>
                    <SelectTrigger>
                      <SelectValue placeholder="Select city" />
                    </SelectTrigger>
                    <SelectContent>
                      {cities.map(city => (
                        <SelectItem key={city.id} value={city.id}>{city.city_name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
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
                  <Label htmlFor="min_price">Min Price/sqft (₹)</Label>
                  <Input
                    id="min_price"
                    type="number"
                    value={formData.price_per_sqft_min}
                    onChange={(e) => setFormData(prev => ({ ...prev, price_per_sqft_min: e.target.value }))}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="max_price">Max Price/sqft (₹)</Label>
                  <Input
                    id="max_price"
                    type="number"
                    value={formData.price_per_sqft_max}
                    onChange={(e) => setFormData(prev => ({ ...prev, price_per_sqft_max: e.target.value }))}
                  />
                </div>

                <div className="space-y-2 col-span-2">
                  <Label htmlFor="status">Status</Label>
                  <Select value={formData.status} onValueChange={(v: any) => setFormData(prev => ({ ...prev, status: v }))}>
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

              <ImageUploader
                value={formData.hero_image_url}
                onChange={(url) => setFormData(prev => ({ ...prev, hero_image_url: url }))}
                bucket="project-hero-images"
                label="Hero Image"
              />

              <RichTextEditor
                value={formData.growth_story}
                onChange={(value) => setFormData(prev => ({ ...prev, growth_story: value }))}
                label="Growth Story"
              />

              <RichTextEditor
                value={formData.connectivity_details}
                onChange={(value) => setFormData(prev => ({ ...prev, connectivity_details: value }))}
                label="Connectivity Details"
              />

              <RichTextEditor
                value={formData.infrastructure_details}
                onChange={(value) => setFormData(prev => ({ ...prev, infrastructure_details: value }))}
                label="Infrastructure Details"
              />

              <div className="flex gap-4">
                <Button type="submit" disabled={loading}>
                  <Save className="mr-2 h-4 w-4" />
                  {loading ? 'Saving...' : 'Save Micromarket'}
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
