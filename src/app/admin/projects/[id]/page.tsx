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

export default function ProjectEditor() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [cities, setCities] = useState<any[]>([]);
  const [micromarkets, setMicromarkets] = useState<any[]>([]);
  const [developers, setDevelopers] = useState<any[]>([]);
  
  const [formData, setFormData] = useState({
    project_name: "",
    city_id: "",
    micro_market_id: "",
    developer_id: "",
    url_slug: "",
    seo_title: "",
    meta_description: "",
    h1_title: "",
    hero_image_url: "",
    project_overview_seo: "",
    price_range_text: "",
    rera_id: "",
    page_status: "draft" as "draft" | "published"
  });

  useEffect(() => {
    loadReferences();
    if (id) loadProject();
  }, [id]);

  const loadReferences = async () => {
    const [citiesRes, devsRes] = await Promise.all([
      supabase.from('cities').select('id, city_name').order('city_name'),
      supabase.from('developers').select('id, developer_name').order('developer_name')
    ]);
    
    if (citiesRes.data) setCities(citiesRes.data);
    if (devsRes.data) setDevelopers(devsRes.data);
  };

  const loadMicromarkets = async (cityId: string) => {
    const { data } = await supabase
      .from('micro_markets')
      .select('id, micro_market_name')
      .eq('city_id', cityId)
      .order('micro_market_name');
    
    if (data) setMicromarkets(data);
  };

  const loadProject = async () => {
    const { data, error } = await supabase
      .from('projects')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      toast.error("Failed to load project");
      return;
    }

    if (data) {
      setFormData({
        project_name: data.project_name || "",
        city_id: data.city_id || "",
        micro_market_id: data.micro_market_id || "",
        developer_id: data.developer_id || "",
        url_slug: data.url_slug || "",
        seo_title: data.seo_title || "",
        meta_description: data.meta_description || "",
        h1_title: data.h1_title || "",
        hero_image_url: data.hero_image_url || "",
        project_overview_seo: data.project_overview_seo || "",
        price_range_text: data.price_range_text || "",
        rera_id: data.rera_id || "",
        page_status: (data.page_status as "draft" | "published") || "draft"
      });
      if (data.city_id) loadMicromarkets(data.city_id);
    }
  };

  const handleCityChange = (cityId: string) => {
    setFormData(prev => ({ ...prev, city_id: cityId, micro_market_id: "" }));
    loadMicromarkets(cityId);
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
      const slug = formData.url_slug || generateSlug(formData.project_name);
      const dataToSave = { ...formData, url_slug: slug };

      if (id) {
        const { error } = await supabase
          .from('projects')
          .update(dataToSave)
          .eq('id', id);

        if (error) throw error;
        toast.success("Project updated successfully");
      } else {
        const { error } = await supabase
          .from('projects')
          .insert([dataToSave]);

        if (error) throw error;
        toast.success("Project created successfully");
      }

      navigate('/admin');
    } catch (error) {
      console.error('Error saving project:', error);
      toast.error("Failed to save project");
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
            <CardTitle>{id ? 'Edit Project' : 'Create New Project'}</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="project_name">Project Name *</Label>
                  <Input
                    id="project_name"
                    value={formData.project_name}
                    onChange={(e) => setFormData(prev => ({ ...prev, project_name: e.target.value }))}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="city">City *</Label>
                  <Select value={formData.city_id} onValueChange={handleCityChange} required>
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
                  <Label htmlFor="micromarket">Micromarket *</Label>
                  <Select value={formData.micro_market_id} onValueChange={(v) => setFormData(prev => ({ ...prev, micro_market_id: v }))} required>
                    <SelectTrigger>
                      <SelectValue placeholder="Select micromarket" />
                    </SelectTrigger>
                    <SelectContent>
                      {micromarkets.map(mm => (
                        <SelectItem key={mm.id} value={mm.id}>{mm.micro_market_name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="developer">Developer</Label>
                  <Select value={formData.developer_id || ""} onValueChange={(v) => setFormData(prev => ({ ...prev, developer_id: v }))}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select developer" />
                    </SelectTrigger>
                    <SelectContent>
                      {developers.map(dev => (
                        <SelectItem key={dev.id} value={dev.id}>{dev.developer_name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="price_range">Price Range</Label>
                  <Input
                    id="price_range"
                    value={formData.price_range_text}
                    onChange={(e) => setFormData(prev => ({ ...prev, price_range_text: e.target.value }))}
                    placeholder="e.g., ₹80L - ₹1.2Cr"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="rera">RERA ID</Label>
                  <Input
                    id="rera"
                    value={formData.rera_id}
                    onChange={(e) => setFormData(prev => ({ ...prev, rera_id: e.target.value }))}
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

                <div className="space-y-2">
                  <Label htmlFor="url_slug">URL Slug</Label>
                  <Input
                    id="url_slug"
                    value={formData.url_slug}
                    onChange={(e) => setFormData(prev => ({ ...prev, url_slug: e.target.value }))}
                    placeholder="Auto-generated from name"
                  />
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

              <ImageUploader
                value={formData.hero_image_url}
                onChange={(url) => setFormData(prev => ({ ...prev, hero_image_url: url }))}
                bucket="project-hero-images"
                label="Hero Image"
              />

              <RichTextEditor
                value={formData.project_overview_seo}
                onChange={(value) => setFormData(prev => ({ ...prev, project_overview_seo: value }))}
                label="Project Overview"
              />

              <div className="flex gap-4">
                <Button type="submit" disabled={loading}>
                  <Save className="mr-2 h-4 w-4" />
                  {loading ? 'Saving...' : 'Save Project'}
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
