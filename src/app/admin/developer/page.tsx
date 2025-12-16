 "use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ImageUploader } from "@/components/admin/ImageUploader";
import RichTextEditor from "@/components/property/RichTextEditor";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { ArrowLeft, Save } from "lucide-react";

export default function DeveloperEditor() {
  const params = useParams();
  const id = typeof params?.id === "string" ? params.id : undefined;
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  
  const [formData, setFormData] = useState({
    developer_name: "",
    url_slug: "",
    seo_title: "",
    meta_description: "",
    tagline: "",
    hero_description: "",
    long_description_seo: "",
    logo_url: "",
    banner_image_url: "",
    specialization: "",
    years_in_business: "",
    total_projects: "",
    total_sft_delivered: "",
    website_url: ""
  });

  useEffect(() => {
    if (id) loadDeveloper();
  }, [id]);

  const loadDeveloper = async () => {
    const { data, error } = await supabase
      .from('developers')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      toast.error("Failed to load developer");
      return;
    }

    if (data) {
      setFormData({
        ...data,
        years_in_business: data.years_in_business?.toString() || "",
        total_projects: data.total_projects?.toString() || "",
        total_sft_delivered: data.total_sft_delivered || ""
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
      const slug = formData.url_slug || generateSlug(formData.developer_name);
      const dataToSave = {
        ...formData,
        url_slug: slug,
        years_in_business: formData.years_in_business ? parseInt(formData.years_in_business) : null,
        total_projects: formData.total_projects ? parseInt(formData.total_projects) : null,
        total_sft_delivered: formData.total_sft_delivered || null
      };

      if (id) {
        const { error } = await supabase
          .from('developers')
          .update(dataToSave)
          .eq('id', id);

        if (error) throw error;
        toast.success("Developer updated successfully");
      } else {
        const { error } = await supabase
          .from('developers')
          .insert([dataToSave]);

        if (error) throw error;
        toast.success("Developer created successfully");
      }

      router.push('/admin');
    } catch (error) {
      console.error('Error saving developer:', error);
      toast.error("Failed to save developer");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-4xl mx-auto">
        <Button
          variant="ghost"
          onClick={() => router.push('/admin')}
          className="mb-4"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Admin
        </Button>

        <Card>
          <CardHeader>
            <CardTitle>{id ? 'Edit Developer' : 'Create New Developer'}</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="developer_name">Developer Name *</Label>
                  <Input
                    id="developer_name"
                    value={formData.developer_name}
                    onChange={(e) => setFormData(prev => ({ ...prev, developer_name: e.target.value }))}
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
                  <Label htmlFor="specialization">Specialization</Label>
                  <Input
                    id="specialization"
                    value={formData.specialization}
                    onChange={(e) => setFormData(prev => ({ ...prev, specialization: e.target.value }))}
                    placeholder="e.g., Luxury Residential"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="website_url">Website URL</Label>
                  <Input
                    id="website_url"
                    type="url"
                    value={formData.website_url}
                    onChange={(e) => setFormData(prev => ({ ...prev, website_url: e.target.value }))}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="years_in_business">Years in Business</Label>
                  <Input
                    id="years_in_business"
                    type="number"
                    value={formData.years_in_business}
                    onChange={(e) => setFormData(prev => ({ ...prev, years_in_business: e.target.value }))}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="total_projects">Total Projects</Label>
                  <Input
                    id="total_projects"
                    type="number"
                    value={formData.total_projects}
                    onChange={(e) => setFormData(prev => ({ ...prev, total_projects: e.target.value }))}
                  />
                </div>

                <div className="space-y-2 col-span-2">
                  <Label htmlFor="total_sft_delivered">Total SFT Delivered</Label>
                  <Input
                    id="total_sft_delivered"
                    type="text"
                    value={formData.total_sft_delivered}
                    onChange={(e) => setFormData(prev => ({ ...prev, total_sft_delivered: e.target.value }))}
                    placeholder="e.g., 30 Million SFT"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="tagline">Tagline</Label>
                <Input
                  id="tagline"
                  value={formData.tagline}
                  onChange={(e) => setFormData(prev => ({ ...prev, tagline: e.target.value }))}
                />
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

              <div className="grid grid-cols-2 gap-4">
                <ImageUploader
                  value={formData.logo_url}
                  onChange={(urlOrFile) => {
                    const url = urlOrFile instanceof File 
                      ? URL.createObjectURL(urlOrFile) 
                      : (urlOrFile || '');
                    setFormData(prev => ({ ...prev, logo_url: url }));
                  }}
                  bucket="brand-assets"
                  label="Logo"
                  aspectRatio="1/1"
                />

                <ImageUploader
                  value={formData.banner_image_url}
                  onChange={(urlOrFile) => {
                    const url = urlOrFile instanceof File 
                      ? URL.createObjectURL(urlOrFile) 
                      : (urlOrFile || '');
                    setFormData(prev => ({ ...prev, banner_image_url: url }));
                  }}
                  bucket="project-hero-images"
                  label="Banner Image"
                />
              </div>

              <RichTextEditor
                value={formData.hero_description}
                onChange={(value) => setFormData(prev => ({ ...prev, hero_description: value }))}
                label="Hero Description"
              />

              <RichTextEditor
                value={formData.long_description_seo}
                onChange={(value) => setFormData(prev => ({ ...prev, long_description_seo: value }))}
                label="Full Description (SEO)"
              />

              <div className="flex gap-4">
                <Button type="submit" disabled={loading}>
                  <Save className="mr-2 h-4 w-4" />
                  {loading ? 'Saving...' : 'Save Developer'}
                </Button>
                <Button type="button" variant="outline" onClick={() => router.push('/admin')}>
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
