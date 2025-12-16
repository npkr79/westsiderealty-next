import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { ArrowLeft, Save } from "lucide-react";

const KollurInvestmentEditor = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [contentId, setContentId] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    hero_image_url: "",
    hero_subtitle: "",
    hero_title: "",
    hero_title_highlight: "",
    hero_description: "",
    hero_cta_text: "",
    
    valuation_title: "",
    valuation_subtitle: "",
    launch_price_per_sqft: 4000,
    resale_price_per_sqft: 7000,
    appreciation_percentage: 43,
    possession_months: 48,
    possession_quarter: "",
    
    positioning_title: "",
    positioning_subtitle: "",
    orr_distance: "",
    orr_connectivity: "",
    infrastructure_description: "",
    growth_corridor_description: "",
    
    proximity_data: [
      { label: "ORR Junction", distance: "2.5 km" },
      { label: "Gachibowli", distance: "12 km" },
      { label: "Financial District", distance: "18 km" },
      { label: "Airport", distance: "35 km" },
      { label: "Patancheru Metro", distance: "8 km" }
    ],
    
    features_title: "",
    features_intro: "",
    architecture_title: "",
    architecture_intro: "",
    location_security_title: "",
    location_security_intro: "",
    architecture_features: [] as Array<{ icon: string; title: string; description: string }>,
    location_features: [] as Array<{ icon: string; title: string; description: string }>,
    
    landowner_title: "",
    landowner_description: "",
    landowner_detail: "",
    
    cta_badge_text: "",
    cta_title: "",
    cta_description: "",
    cta_primary_button: "",
    cta_secondary_button: "",
    cta_hours_info: "",
    
    seo_title: "",
    seo_description: "",
    seo_keywords: "",
    
    is_active: true
  });

  useEffect(() => {
    loadContent();
  }, []);

  const loadContent = async () => {
    try {
      const { data, error } = await supabase
        .from("kollur_investment_content")
        .select("*")
        .eq("is_active", true)
        .maybeSingle();

      if (error) throw error;

      if (data) {
        setContentId(data.id);
        setFormData({
          hero_image_url: data.hero_image_url || "",
          hero_subtitle: data.hero_subtitle,
          hero_title: data.hero_title,
          hero_title_highlight: data.hero_title_highlight,
          hero_description: data.hero_description,
          hero_cta_text: data.hero_cta_text,
          
          valuation_title: data.valuation_title,
          valuation_subtitle: data.valuation_subtitle,
          launch_price_per_sqft: data.launch_price_per_sqft,
          resale_price_per_sqft: data.resale_price_per_sqft,
          appreciation_percentage: data.appreciation_percentage,
          possession_months: data.possession_months,
          possession_quarter: data.possession_quarter,
          
          positioning_title: data.positioning_title,
          positioning_subtitle: data.positioning_subtitle,
          orr_distance: data.orr_distance,
          orr_connectivity: data.orr_connectivity,
          infrastructure_description: data.infrastructure_description,
          growth_corridor_description: data.growth_corridor_description,
          
          proximity_data: data.proximity_data as Array<{ label: string; distance: string }>,
          
          features_title: data.features_title || "",
          features_intro: data.features_intro || "",
          architecture_title: data.architecture_title || "",
          architecture_intro: data.architecture_intro || "",
          location_security_title: data.location_security_title || "",
          location_security_intro: data.location_security_intro || "",
          architecture_features: data.architecture_features as Array<{ icon: string; title: string; description: string }> || [],
          location_features: data.location_features as Array<{ icon: string; title: string; description: string }> || [],
          
          landowner_title: data.landowner_title,
          landowner_description: data.landowner_description,
          landowner_detail: data.landowner_detail,
          
          cta_badge_text: data.cta_badge_text,
          cta_title: data.cta_title,
          cta_description: data.cta_description,
          cta_primary_button: data.cta_primary_button,
          cta_secondary_button: data.cta_secondary_button,
          cta_hours_info: data.cta_hours_info,
          
          seo_title: data.seo_title,
          seo_description: data.seo_description,
          seo_keywords: data.seo_keywords,
          
          is_active: data.is_active
        });
      }
    } catch (error) {
      console.error("Error loading content:", error);
      toast.error("Failed to load content");
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleProximityChange = (index: number, field: "label" | "distance", value: string) => {
    const newProximity = [...formData.proximity_data];
    newProximity[index][field] = value;
    setFormData(prev => ({ ...prev, proximity_data: newProximity }));
  };

  const handleFeatureChange = (
    type: 'architecture' | 'location',
    index: number,
    field: 'icon' | 'title' | 'description',
    value: string
  ) => {
    const fieldName = type === 'architecture' ? 'architecture_features' : 'location_features';
    const features = [...formData[fieldName]];
    features[index] = { ...features[index], [field]: value };
    setFormData(prev => ({ ...prev, [fieldName]: features }));
  };

  const addFeature = (type: 'architecture' | 'location') => {
    const fieldName = type === 'architecture' ? 'architecture_features' : 'location_features';
    const newFeature = { icon: 'Star', title: '', description: '' };
    setFormData(prev => ({
      ...prev,
      [fieldName]: [...prev[fieldName], newFeature]
    }));
  };

  const removeFeature = (type: 'architecture' | 'location', index: number) => {
    const fieldName = type === 'architecture' ? 'architecture_features' : 'location_features';
    const features = formData[fieldName].filter((_, i) => i !== index);
    setFormData(prev => ({ ...prev, [fieldName]: features }));
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const { error } = await supabase
        .from("kollur_investment_content")
        .update(formData)
        .eq("id", contentId);

      if (error) throw error;

      toast.success("Content updated successfully!");
    } catch (error) {
      console.error("Error saving content:", error);
      toast.error("Failed to save content");
    } finally {
      setSaving(false);
    }
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `kollur-hero-${Date.now()}.${fileExt}`;
      const filePath = `kollur-investment/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('property-images')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('property-images')
        .getPublicUrl(filePath);

      handleInputChange('hero_image_url', publicUrl);
      toast.success("Image uploaded successfully!");
    } catch (error) {
      console.error("Error uploading image:", error);
      toast.error("Failed to upload image");
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-lg">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="container mx-auto max-w-5xl">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            <Button variant="ghost" onClick={() => navigate("/admin/dashboard")}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Dashboard
            </Button>
            <h1 className="text-3xl font-bold">Edit Kollur Investment Page</h1>
          </div>
          <Button onClick={handleSave} disabled={saving}>
            <Save className="h-4 w-4 mr-2" />
            {saving ? "Saving..." : "Save Changes"}
          </Button>
        </div>

        <div className="space-y-6">
          {/* Hero Section */}
          <Card>
            <CardHeader>
              <CardTitle>Hero Section</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label>Hero Image</Label>
                {formData.hero_image_url && (
                  <img src={formData.hero_image_url} alt="Hero" className="w-full h-48 object-cover rounded-lg mb-2" />
                )}
                <Input type="file" accept="image/*" onChange={handleImageUpload} />
              </div>
              <div>
                <Label>Subtitle</Label>
                <Input
                  value={formData.hero_subtitle}
                  onChange={(e) => handleInputChange('hero_subtitle', e.target.value)}
                  placeholder="KOLLUR ORR • PHASE 2 LAUNCH"
                />
              </div>
              <div>
                <Label>Main Title</Label>
                <Input
                  value={formData.hero_title}
                  onChange={(e) => handleInputChange('hero_title', e.target.value)}
                />
              </div>
              <div>
                <Label>Title Highlight (colored text)</Label>
                <Input
                  value={formData.hero_title_highlight}
                  onChange={(e) => handleInputChange('hero_title_highlight', e.target.value)}
                />
              </div>
              <div>
                <Label>Description</Label>
                <Textarea
                  value={formData.hero_description}
                  onChange={(e) => handleInputChange('hero_description', e.target.value)}
                  rows={3}
                />
              </div>
              <div>
                <Label>CTA Button Text</Label>
                <Input
                  value={formData.hero_cta_text}
                  onChange={(e) => handleInputChange('hero_cta_text', e.target.value)}
                />
              </div>
            </CardContent>
          </Card>

          {/* Valuation Section */}
          <Card>
            <CardHeader>
              <CardTitle>Valuation Advantage</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label>Section Title</Label>
                <Input
                  value={formData.valuation_title}
                  onChange={(e) => handleInputChange('valuation_title', e.target.value)}
                />
              </div>
              <div>
                <Label>Section Subtitle</Label>
                <Input
                  value={formData.valuation_subtitle}
                  onChange={(e) => handleInputChange('valuation_subtitle', e.target.value)}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Launch Price per sqft (₹)</Label>
                  <Input
                    type="number"
                    value={formData.launch_price_per_sqft}
                    onChange={(e) => handleInputChange('launch_price_per_sqft', parseInt(e.target.value))}
                  />
                </div>
                <div>
                  <Label>Resale Price per sqft (₹)</Label>
                  <Input
                    type="number"
                    value={formData.resale_price_per_sqft}
                    onChange={(e) => handleInputChange('resale_price_per_sqft', parseInt(e.target.value))}
                  />
                </div>
                <div>
                  <Label>Appreciation %</Label>
                  <Input
                    type="number"
                    value={formData.appreciation_percentage}
                    onChange={(e) => handleInputChange('appreciation_percentage', parseInt(e.target.value))}
                  />
                </div>
                <div>
                  <Label>Possession Months</Label>
                  <Input
                    type="number"
                    value={formData.possession_months}
                    onChange={(e) => handleInputChange('possession_months', parseInt(e.target.value))}
                  />
                </div>
                <div>
                  <Label>Possession Quarter</Label>
                  <Input
                    value={formData.possession_quarter}
                    onChange={(e) => handleInputChange('possession_quarter', e.target.value)}
                    placeholder="Q1 2029"
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Strategic Positioning */}
          <Card>
            <CardHeader>
              <CardTitle>Strategic Positioning</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label>Section Title</Label>
                <Input
                  value={formData.positioning_title}
                  onChange={(e) => handleInputChange('positioning_title', e.target.value)}
                />
              </div>
              <div>
                <Label>Section Subtitle</Label>
                <Input
                  value={formData.positioning_subtitle}
                  onChange={(e) => handleInputChange('positioning_subtitle', e.target.value)}
                />
              </div>
              <div>
                <Label>ORR Distance</Label>
                <Input
                  value={formData.orr_distance}
                  onChange={(e) => handleInputChange('orr_distance', e.target.value)}
                />
              </div>
              <div>
                <Label>ORR Connectivity</Label>
                <Textarea
                  value={formData.orr_connectivity}
                  onChange={(e) => handleInputChange('orr_connectivity', e.target.value)}
                  rows={2}
                />
              </div>
              <div>
                <Label>Infrastructure Description</Label>
                <Textarea
                  value={formData.infrastructure_description}
                  onChange={(e) => handleInputChange('infrastructure_description', e.target.value)}
                  rows={2}
                />
              </div>
              <div>
                <Label>Growth Corridor Description</Label>
                <Textarea
                  value={formData.growth_corridor_description}
                  onChange={(e) => handleInputChange('growth_corridor_description', e.target.value)}
                  rows={2}
                />
              </div>
            </CardContent>
          </Card>

          {/* Proximity Data */}
          <Card>
            <CardHeader>
              <CardTitle>Proximity Advantages</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {formData.proximity_data.map((item, index) => (
                <div key={index} className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Location {index + 1}</Label>
                    <Input
                      value={item.label}
                      onChange={(e) => handleProximityChange(index, 'label', e.target.value)}
                    />
                  </div>
                  <div>
                    <Label>Distance</Label>
                    <Input
                      value={item.distance}
                      onChange={(e) => handleProximityChange(index, 'distance', e.target.value)}
                    />
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Project Features Section */}
          <Card>
            <CardHeader>
              <CardTitle>Exclusive Project Features</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <Label>Features Section Title</Label>
                <Input
                  value={formData.features_title}
                  onChange={(e) => handleInputChange('features_title', e.target.value)}
                  placeholder="Exclusive Project Features: Defining Ultra-Luxury High-Rise Living"
                />
              </div>
              <div>
                <Label>Features Introduction</Label>
                <Textarea
                  value={formData.features_intro}
                  onChange={(e) => handleInputChange('features_intro', e.target.value)}
                  rows={2}
                  placeholder="Discover an unparalleled residential opportunity..."
                />
              </div>

              {/* Architecture Section */}
              <div className="border-t pt-4">
                <h3 className="font-semibold mb-3">Architecture & Design Excellence</h3>
                <div className="space-y-3">
                  <div>
                    <Label>Architecture Section Title</Label>
                    <Input
                      value={formData.architecture_title}
                      onChange={(e) => handleInputChange('architecture_title', e.target.value)}
                      placeholder="Signature Architecture & Design Excellence"
                    />
                  </div>
                  <div>
                    <Label>Architecture Introduction</Label>
                    <Textarea
                      value={formData.architecture_intro}
                      onChange={(e) => handleInputChange('architecture_intro', e.target.value)}
                      rows={2}
                    />
                  </div>
                  
                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <Label>Architecture Features</Label>
                      <Button
                        type="button"
                        size="sm"
                        onClick={() => addFeature('architecture')}
                      >
                        Add Feature
                      </Button>
                    </div>
                    {formData.architecture_features.map((feature, index) => (
                      <Card key={index} className="p-3">
                        <div className="space-y-2">
                          <div className="grid grid-cols-3 gap-2">
                            <div>
                              <Label className="text-xs">Icon Name</Label>
                              <Input
                                value={feature.icon}
                                onChange={(e) => handleFeatureChange('architecture', index, 'icon', e.target.value)}
                                placeholder="Building2"
                                className="text-sm"
                              />
                            </div>
                            <div className="col-span-2">
                              <Label className="text-xs">Feature Title</Label>
                              <Input
                                value={feature.title}
                                onChange={(e) => handleFeatureChange('architecture', index, 'title', e.target.value)}
                                className="text-sm"
                              />
                            </div>
                          </div>
                          <div>
                            <Label className="text-xs">Description</Label>
                            <Input
                              value={feature.description}
                              onChange={(e) => handleFeatureChange('architecture', index, 'description', e.target.value)}
                              className="text-sm"
                            />
                          </div>
                          <Button
                            type="button"
                            variant="destructive"
                            size="sm"
                            onClick={() => removeFeature('architecture', index)}
                          >
                            Remove
                          </Button>
                        </div>
                      </Card>
                    ))}
                  </div>
                </div>
              </div>

              {/* Location & Investment Section */}
              <div className="border-t pt-4">
                <h3 className="font-semibold mb-3">Strategic Location & Investment Security</h3>
                <div className="space-y-3">
                  <div>
                    <Label>Location Section Title</Label>
                    <Input
                      value={formData.location_security_title}
                      onChange={(e) => handleInputChange('location_security_title', e.target.value)}
                      placeholder="Strategic Location & Investment Security"
                    />
                  </div>
                  <div>
                    <Label>Location Introduction</Label>
                    <Textarea
                      value={formData.location_security_intro}
                      onChange={(e) => handleInputChange('location_security_intro', e.target.value)}
                      rows={2}
                    />
                  </div>
                  
                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <Label>Location Features</Label>
                      <Button
                        type="button"
                        size="sm"
                        onClick={() => addFeature('location')}
                      >
                        Add Feature
                      </Button>
                    </div>
                    {formData.location_features.map((feature, index) => (
                      <Card key={index} className="p-3">
                        <div className="space-y-2">
                          <div className="grid grid-cols-3 gap-2">
                            <div>
                              <Label className="text-xs">Icon Name</Label>
                              <Input
                                value={feature.icon}
                                onChange={(e) => handleFeatureChange('location', index, 'icon', e.target.value)}
                                placeholder="MapPin"
                                className="text-sm"
                              />
                            </div>
                            <div className="col-span-2">
                              <Label className="text-xs">Feature Title</Label>
                              <Input
                                value={feature.title}
                                onChange={(e) => handleFeatureChange('location', index, 'title', e.target.value)}
                                className="text-sm"
                              />
                            </div>
                          </div>
                          <div>
                            <Label className="text-xs">Description</Label>
                            <Input
                              value={feature.description}
                              onChange={(e) => handleFeatureChange('location', index, 'description', e.target.value)}
                              className="text-sm"
                            />
                          </div>
                          <Button
                            type="button"
                            variant="destructive"
                            size="sm"
                            onClick={() => removeFeature('location', index)}
                          >
                            Remove
                          </Button>
                        </div>
                      </Card>
                    ))}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Direct Landowner Section */}
          <Card>
            <CardHeader>
              <CardTitle>Direct Landowner Section</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label>Section Title</Label>
                <Input
                  value={formData.landowner_title}
                  onChange={(e) => handleInputChange('landowner_title', e.target.value)}
                />
              </div>
              <div>
                <Label>Short Description</Label>
                <Textarea
                  value={formData.landowner_description}
                  onChange={(e) => handleInputChange('landowner_description', e.target.value)}
                  rows={2}
                />
              </div>
              <div>
                <Label>Detailed Description</Label>
                <Textarea
                  value={formData.landowner_detail}
                  onChange={(e) => handleInputChange('landowner_detail', e.target.value)}
                  rows={4}
                />
              </div>
            </CardContent>
          </Card>

          {/* Final CTA Section */}
          <Card>
            <CardHeader>
              <CardTitle>Final CTA Section</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label>Badge Text</Label>
                <Input
                  value={formData.cta_badge_text}
                  onChange={(e) => handleInputChange('cta_badge_text', e.target.value)}
                />
              </div>
              <div>
                <Label>Main Title</Label>
                <Input
                  value={formData.cta_title}
                  onChange={(e) => handleInputChange('cta_title', e.target.value)}
                />
              </div>
              <div>
                <Label>Description</Label>
                <Textarea
                  value={formData.cta_description}
                  onChange={(e) => handleInputChange('cta_description', e.target.value)}
                  rows={3}
                />
              </div>
              <div>
                <Label>Primary Button Text</Label>
                <Input
                  value={formData.cta_primary_button}
                  onChange={(e) => handleInputChange('cta_primary_button', e.target.value)}
                />
              </div>
              <div>
                <Label>Secondary Button Text</Label>
                <Input
                  value={formData.cta_secondary_button}
                  onChange={(e) => handleInputChange('cta_secondary_button', e.target.value)}
                />
              </div>
              <div>
                <Label>Hours Information</Label>
                <Input
                  value={formData.cta_hours_info}
                  onChange={(e) => handleInputChange('cta_hours_info', e.target.value)}
                />
              </div>
            </CardContent>
          </Card>

          {/* SEO Section */}
          <Card>
            <CardHeader>
              <CardTitle>SEO Settings</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label>SEO Title</Label>
                <Input
                  value={formData.seo_title}
                  onChange={(e) => handleInputChange('seo_title', e.target.value)}
                />
              </div>
              <div>
                <Label>Meta Description</Label>
                <Textarea
                  value={formData.seo_description}
                  onChange={(e) => handleInputChange('seo_description', e.target.value)}
                  rows={3}
                />
              </div>
              <div>
                <Label>SEO Keywords</Label>
                <Input
                  value={formData.seo_keywords}
                  onChange={(e) => handleInputChange('seo_keywords', e.target.value)}
                />
              </div>
            </CardContent>
          </Card>

          <div className="flex justify-end">
            <Button onClick={handleSave} disabled={saving} size="lg">
              <Save className="h-5 w-5 mr-2" />
              {saving ? "Saving..." : "Save All Changes"}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default KollurInvestmentEditor;
