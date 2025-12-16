 "use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter, useParams, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { ArrowLeft, Save, Upload, X } from "lucide-react";
import { toast } from "sonner";
import { locationPropertyService } from "@/services/locationPropertyService";
import { supabase } from "@/integrations/supabase/client";
import AmenitiesSelector from "@/components/admin/AmenitiesSelector";
import LocationDetailsEditor from "@/components/admin/LocationDetailsEditor";
import { LocationDetails } from "@/types/locationDetails";
import RichTextEditor from "@/components/property/RichTextEditor";

const EditProperty = () => {
  const params = useParams();
  const id = typeof params?.id === "string" ? params.id : undefined;
  console.log('🔥 ADMIN EditProperty loaded with ID:', id);
  const router = useRouter();
  const searchParams = useSearchParams();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [property, setProperty] = useState<any>({});
  const [propertyLocation, setPropertyLocation] = useState<'hyderabad' | 'goa' | 'dubai'>('hyderabad');
  const [uploadingImages, setUploadingImages] = useState(false);
  const [projects, setProjects] = useState<string[]>([]);

  useEffect(() => {
    if (id) {
      loadProperty();
    }
  }, [id]);

  // Redirect Goa properties to new editor
  useEffect(() => {
    if (propertyLocation === 'goa') {
      toast.info('Goa properties use the new editor. Redirecting...');
      router.push('/admin/properties');
    }
  }, [propertyLocation, router]);

  const fetchProjects = async (location: 'hyderabad' | 'goa' | 'dubai') => {
    if (location === "hyderabad") {
      const { data } = await supabase
        .from('hyderabad_project_names')
        .select('name')
        .eq('is_active', true)
        .order('name');
      
      if (data) {
        setProjects(['Independent', ...data.map(p => p.name)]);
      }
    }
  };

  const loadProperty = async () => {
    if (!id) return;
    
    setLoading(true);
    try {
      const locationParam = searchParams.get('location') as 'hyderabad' | 'goa' | 'dubai' | null;
      
      let data: any = null;
      let detectedLocation: 'hyderabad' | 'goa' | 'dubai' = 'hyderabad';

      if (locationParam) {
        detectedLocation = locationParam;
        if (locationParam === 'hyderabad') {
          data = await locationPropertyService.getHyderabadPropertyById(id);
        } else if (locationParam === 'goa') {
          data = await locationPropertyService.getGoaPropertyById(id);
        } else if (locationParam === 'dubai') {
          data = await locationPropertyService.getDubaiPropertyById(id);
        }
      } else {
        data = await locationPropertyService.getHyderabadPropertyById(id);
        if (data) {
          detectedLocation = 'hyderabad';
        } else {
          data = await locationPropertyService.getGoaPropertyById(id);
          if (data) {
            detectedLocation = 'goa';
          } else {
            data = await locationPropertyService.getDubaiPropertyById(id);
            if (data) {
              detectedLocation = 'dubai';
            }
          }
        }
      }

      if (data) {
        setProperty(data);
        setPropertyLocation(detectedLocation);
        fetchProjects(detectedLocation);
      } else {
        toast.error('Property not found');
        router.push('/admin/properties');
      }
    } catch (error) {
      console.error('Error loading property:', error);
      toast.error('Failed to load property');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (field: string, value: any) => {
    setProperty((prev: any) => ({ ...prev, [field]: value }));
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>, isMain: boolean = false) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setUploadingImages(true);
    try {
      const uploadedUrls: string[] = [];

      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const fileExt = file.name.split('.').pop();
        const fileName = `${Math.random()}.${fileExt}`;
        const filePath = `${fileName}`;

        const { error: uploadError, data } = await supabase.storage
          .from('property-images')
          .upload(filePath, file);

        if (uploadError) {
          console.error('Upload error:', uploadError);
          continue;
        }

        const { data: { publicUrl } } = supabase.storage
          .from('property-images')
          .getPublicUrl(filePath);

        uploadedUrls.push(publicUrl);
      }

      if (uploadedUrls.length > 0) {
        if (isMain) {
          handleInputChange('main_image_url', uploadedUrls[0]);
        } else {
          const currentGallery = property.image_gallery_urls || [];
          handleInputChange('image_gallery_urls', [...currentGallery, ...uploadedUrls]);
        }
        toast.success(`Uploaded ${uploadedUrls.length} image(s)`);
      }
    } catch (error) {
      console.error('Error uploading images:', error);
      toast.error('Failed to upload images');
    } finally {
      setUploadingImages(false);
    }
  };

  const removeGalleryImage = (index: number) => {
    const currentGallery = property.image_gallery_urls || [];
    const newGallery = currentGallery.filter((_: any, i: number) => i !== index);
    handleInputChange('image_gallery_urls', newGallery);
  };

  const handleAmenityToggle = (amenity: string) => {
    const currentAmenities = property.amenities || [];
    const newAmenities = currentAmenities.includes(amenity)
      ? currentAmenities.filter((a: any) => a !== amenity)
      : [...currentAmenities, amenity];
    handleInputChange('amenities', newAmenities);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    console.log('🔥🔥🔥 ADMIN SUBMIT CLICKED');
    console.log('🔥 ID from useParams:', id);
    console.log('🔥 Property object:', property);
    console.log('🔥 Property location:', propertyLocation);
    
    if (!id) {
      console.error('❌ Property ID is missing!');
      toast.error('Property ID is missing. Cannot update.');
      return;
    }

    setSaving(true);
    try {
      const tableName = propertyLocation === 'hyderabad' ? 'hyderabad_properties' 
        : propertyLocation === 'goa' ? 'goa_holiday_properties' 
        : 'dubai_properties';

      // Exclude system fields and prepare clean update data
      const { 
        id: propertyId, 
        created_at, 
        updated_at,
        view_count,
        last_updated_by,
        user_id,
        agent_id,
        ...propertyData 
      } = property;
      
      const updateData = {
        ...propertyData,
        nearby_landmarks: property.nearby_landmarks || {},
        amenities: Array.isArray(property.amenities) ? property.amenities : [],
        unique_features: Array.isArray(property.unique_features) ? property.unique_features : [],
        image_gallery: Array.isArray(property.image_gallery) ? property.image_gallery : [],
      };

      console.log('🔥 Table name:', tableName);
      console.log('🔥 Update data:', JSON.stringify(updateData, null, 2));
      console.log('🔥 Updating with ID:', id);

      // Use regular client - RLS should handle admin permissions
      const { error } = await supabase
        .from(tableName)
        .update(updateData)
        .eq('id', id);
      
      console.log('🔥 Update completed');
      console.log('🔥 Update response error:', error);

      if (error) {
        console.error('🔥 Supabase error details:', {
          message: error.message,
          details: error.details,
          hint: error.hint,
          code: error.code
        });
        
        if (error.message?.includes('WHERE clause')) {
          toast.error('Database security policy error. Please check your admin permissions.');
          console.error('❌ This is an RLS policy issue - admin may not have proper SELECT+UPDATE permissions');
        } else {
          toast.error(error.message || 'Failed to update property');
        }
        throw error;
      }

      toast.success('Property updated successfully');
      router.push('/admin/properties');
    } catch (error: any) {
      console.error('❌❌❌ ERROR UPDATING PROPERTY ❌❌❌');
      console.error('Error object:', error);
      console.error('Error message:', error.message);
      console.error('Error details:', error.details);
      console.error('Error hint:', error.hint);
      console.error('Error code:', error.code);
      toast.error(error.message || 'Failed to update property');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p>Loading property...</p>
      </div>
    );
  }


  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm border-b">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center space-x-4">
            <Link href="/admin/properties">
              <Button variant="outline" size="sm">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Properties
              </Button>
            </Link>
            <h1 className="text-2xl font-bold">Edit Property</h1>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Basic Information */}
          <Card>
            <CardHeader>
              <CardTitle>Basic Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="title">Property Title *</Label>
                <Input
                  id="title"
                  value={property.title || ''}
                  onChange={(e) => handleInputChange('title', e.target.value)}
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="price">Price (₹) *</Label>
                  <Input
                    id="price"
                    type="number"
                    value={property.price || ''}
                    onChange={(e) => handleInputChange('price', parseFloat(e.target.value))}
                    required
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    Numeric value (e.g., 5000000)
                  </p>
                </div>
                <div>
                  <Label htmlFor="price_display">Price Display Text *</Label>
                  <Input
                    id="price_display"
                    value={property.price_display || ''}
                    onChange={(e) => handleInputChange('price_display', e.target.value)}
                    placeholder="e.g., ₹50 Lakhs"
                    required
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    Formatted display (e.g., ₹50 Lakhs)
                  </p>
                </div>
              </div>

              <div>
                <Label htmlFor="area_sqft">Square Feet *</Label>
                <Input
                  id="area_sqft"
                  type="number"
                  value={property.area_sqft || property.sq_ft || ''}
                  onChange={(e) => handleInputChange('area_sqft', parseInt(e.target.value))}
                  required
                />
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div>
                  <Label htmlFor="bedrooms">Bedrooms *</Label>
                  <Input
                    id="bedrooms"
                    type="number"
                    value={property.bedrooms || ''}
                    onChange={(e) => handleInputChange('bedrooms', parseInt(e.target.value))}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="bathrooms">Bathrooms *</Label>
                  <Input
                    id="bathrooms"
                    type="number"
                    value={property.bathrooms || ''}
                    onChange={(e) => handleInputChange('bathrooms', parseInt(e.target.value))}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="floor_number">Floor Number</Label>
                  <Input
                    id="floor_number"
                    value={(property as any).floor_number || ''}
                    onChange={(e) => handleInputChange('floor_number', e.target.value)}
                    placeholder="e.g., 5th Floor"
                  />
                </div>
                <div>
                  <Label htmlFor="total_floors">Total Floors</Label>
                  <Input
                    id="total_floors"
                    value={(property as any).total_floors || ''}
                    onChange={(e) => handleInputChange('total_floors', e.target.value)}
                    placeholder="e.g., 15"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="facing">Facing</Label>
                  <Input
                    id="facing"
                    value={property.facing || ''}
                    onChange={(e) => handleInputChange('facing', e.target.value)}
                    placeholder="e.g., North, South"
                  />
                </div>
                <div>
                  <Label htmlFor="parking_spaces">Parking Spaces</Label>
                  <Input
                    id="parking_spaces"
                    type="number"
                    value={(property as any).parking_spaces || ''}
                    onChange={(e) => handleInputChange('parking_spaces', parseInt(e.target.value))}
                    placeholder="e.g., 1"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="micro_market">Micro Market</Label>
                  <Input
                    id="micro_market"
                    value={(property as any).micro_market || ''}
                    onChange={(e) => handleInputChange('micro_market', e.target.value)}
                    placeholder="e.g., Gachibowli, Kondapur"
                  />
                </div>
                <div>
                  <Label htmlFor="project_name">Project / Community Name</Label>
                  <Select
                    value={(property as any).project_name || 'Independent'}
                    onValueChange={(value) => 
                      handleInputChange('project_name', value === 'Independent' ? null : value)
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select Project" />
                    </SelectTrigger>
                    <SelectContent>
                      {projects.map(project => (
                        <SelectItem key={project} value={project}>
                          {project}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="location">Location/City *</Label>
                  <select
                    id="location"
                    value={(property as any).location || ''}
                    onChange={(e) => handleInputChange('location', e.target.value)}
                    className="w-full border rounded-md px-3 py-2"
                    required
                  >
                    <option value="">Select Location</option>
                    <option value="Hyderabad">Hyderabad</option>
                    <option value="Goa">Goa</option>
                    <option value="Dubai">Dubai</option>
                  </select>
                </div>

                <div>
                  <Label htmlFor="property_type">Property Type *</Label>
                  <select
                    id="property_type"
                    value={(property as any).property_type || ''}
                    onChange={(e) => handleInputChange('property_type', e.target.value)}
                    className="w-full border rounded-md px-3 py-2"
                    required
                  >
                    <option value="">Select Type</option>
                    <option value="Apartment">Apartment</option>
                    <option value="Villa">Villa</option>
                    <option value="Independent House">Independent House</option>
                    <option value="Plot">Plot</option>
                    <option value="Commercial">Commercial</option>
                    <option value="Penthouse">Penthouse</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="status">Status</Label>
                  <select
                    id="status"
                    value={property.status || 'draft'}
                    onChange={(e) => handleInputChange('status', e.target.value)}
                    className="w-full border rounded-md px-3 py-2"
                  >
                    <option value="draft">Draft</option>
                    <option value="active">Active</option>
                    <option value="sold">Sold</option>
                    <option value="pending">Pending</option>
                  </select>
                </div>

                <div>
                  <Label htmlFor="furnished_status">Furnishing Status</Label>
                  <select
                    id="furnished_status"
                    value={(property as any).furnished_status || ''}
                    onChange={(e) => handleInputChange('furnished_status', e.target.value)}
                    className="w-full border rounded-md px-3 py-2"
                  >
                    <option value="">Select Status</option>
                    <option value="Furnished">Furnished</option>
                    <option value="Semi-Furnished">Semi-Furnished</option>
                    <option value="Unfurnished">Unfurnished</option>
                  </select>
                </div>
              </div>

              <div>
                <Label htmlFor="google_maps_url">Google Maps URL</Label>
                <Input
                  id="google_maps_url"
                  type="url"
                  value={(property as any).google_maps_url || ''}
                  onChange={(e) => handleInputChange('google_maps_url', e.target.value)}
                  placeholder="https://www.google.com/maps/place/..."
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Paste the full Google Maps URL from your browser address bar (e.g., https://www.google.com/maps/place/...)
                </p>
              </div>

              {/* Property Share Options - Only for Hyderabad */}
              {propertyLocation === 'hyderabad' && (
                <Card>
                  <CardHeader>
                    <CardTitle>Property Share Options</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-3 gap-4">
                      <div className="flex items-center space-x-2">
                        <Switch
                          id="landowner_share"
                          checked={(property as any).landowner_share || false}
                          onCheckedChange={(checked) => handleInputChange('landowner_share', checked)}
                        />
                        <Label htmlFor="landowner_share">Landowner Share</Label>
                      </div>
                      
                      <div className="flex items-center space-x-2">
                        <Switch
                          id="investor_share"
                          checked={(property as any).investor_share || false}
                          onCheckedChange={(checked) => handleInputChange('investor_share', checked)}
                        />
                        <Label htmlFor="investor_share">Investor Share</Label>
                      </div>
                      
                      <div className="flex items-center space-x-2">
                        <Switch
                          id="is_resale"
                          checked={(property as any).is_resale || false}
                          onCheckedChange={(checked) => handleInputChange('is_resale', checked)}
                        />
                        <Label htmlFor="is_resale">Resale Property</Label>
                      </div>
                    </div>
                    
                    <p className="text-sm text-muted-foreground">
                      Mark if this property has landowner/investor shares available or is a resale unit
                    </p>
                  </CardContent>
                </Card>
              )}

              <LocationDetailsEditor
                locationDetails={(property as any).nearby_landmarks || {}}
                onChange={(details) => handleInputChange('nearby_landmarks', details)}
              />

              <div className="flex items-end">
                <label className="flex items-center space-x-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={(property as any).is_featured || false}
                    onChange={(e) => handleInputChange('is_featured', e.target.checked)}
                    className="rounded"
                  />
                  <Label className="cursor-pointer">Featured Property</Label>
                </label>
              </div>

              <div>
                <RichTextEditor
                  label="Description"
                  value={property.description || ''}
                  onChange={(value) => handleInputChange('description', value)}
                  placeholder="Detailed property description with formatting..."
                />
              </div>
            </CardContent>
          </Card>

          {/* Images */}
          <Card>
            <CardHeader>
              <CardTitle>Images</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label>Main Image</Label>
                <div className="mt-2 space-y-2">
                  {property.main_image_url && (
                    <img 
                      src={property.main_image_url} 
                      alt="Main" 
                      className="w-full h-48 object-cover rounded-lg"
                    />
                  )}
                  <div className="relative">
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => handleImageUpload(e, true)}
                      disabled={uploadingImages}
                      className="hidden"
                      id="main-image"
                    />
                    <label htmlFor="main-image">
                      <Button 
                        type="button"
                        variant="outline" 
                        disabled={uploadingImages}
                        asChild
                      >
                        <span>
                          <Upload className="h-4 w-4 mr-2" />
                          {property.main_image_url ? 'Change Main Image' : 'Upload Main Image'}
                        </span>
                      </Button>
                    </label>
                  </div>
                </div>
              </div>

              <div>
                <Label>Gallery Images</Label>
                <div className="mt-2 space-y-3">
                  <div className="grid grid-cols-3 gap-3">
                    {(property.image_gallery_urls || []).map((url: any, index: number) => (
                      <div key={index} className="relative group">
                        <img 
                          src={url} 
                          alt={`Gallery ${index + 1}`} 
                          className="w-full h-32 object-cover rounded-lg"
                        />
                        <Button
                          type="button"
                          size="sm"
                          variant="destructive"
                          className="absolute top-1 right-1 opacity-0 group-hover:opacity-100 transition-opacity"
                          onClick={() => removeGalleryImage(index)}
                        >
                          <X className="h-3 w-3" />
                        </Button>
                      </div>
                    ))}
                  </div>
                  
                  <div className="relative">
                    <input
                      type="file"
                      accept="image/*"
                      multiple
                      onChange={(e) => handleImageUpload(e, false)}
                      disabled={uploadingImages}
                      className="hidden"
                      id="gallery-images"
                    />
                    <label htmlFor="gallery-images">
                      <Button 
                        type="button"
                        variant="outline" 
                        disabled={uploadingImages}
                        asChild
                      >
                        <span>
                          <Upload className="h-4 w-4 mr-2" />
                          {uploadingImages ? 'Uploading...' : 'Add Gallery Images'}
                        </span>
                      </Button>
                    </label>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Video Upload */}
          <Card>
            <CardHeader>
              <CardTitle>Property Video</CardTitle>
            </CardHeader>
            <CardContent>
              <div>
                <Label htmlFor="video_url">Video URL</Label>
                <Input
                  id="video_url"
                  type="url"
                  value={(property as any).video_url || ''}
                  onChange={(e) => handleInputChange('video_url', e.target.value)}
                  placeholder="https://www.youtube.com/watch?v=... or uploaded video URL"
                />
                <p className="text-sm text-muted-foreground mt-2">
                  Enter a YouTube/Vimeo URL or upload via Add Property page
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Amenities */}
          <AmenitiesSelector 
            selectedAmenities={property.amenities || []}
            onAmenitiesChange={(amenities) => handleInputChange('amenities', amenities)}
          />

          {/* Submit */}
          <div className="flex justify-end space-x-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => router.push('/admin/properties')}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={saving}>
              <Save className="h-4 w-4 mr-2" />
              {saving ? 'Saving...' : 'Save Changes'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EditProperty;
