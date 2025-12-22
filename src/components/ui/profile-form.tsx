"use client";

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { 
  Edit, 
  Save, 
  Upload, 
  User as UserIcon, 
  CheckCircle, 
  Loader2,
  X,
  Camera
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

// Profile form schema
const profileFormSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email("Invalid email address"),
  phone: z.string().optional(),
  bio: z.string().optional(),
  specialization: z.string().optional(),
  whatsapp: z.string().optional(),
  linkedin: z.string().url("Invalid LinkedIn URL").optional().or(z.literal("")),
  instagram: z.string().optional(),
  serviceAreas: z.array(z.string()).optional(),
});

type ProfileFormData = z.infer<typeof profileFormSchema>;

interface ProfileFormProps {
  initialData?: Partial<ProfileFormData & { 
    profileImage?: string; 
    profileCompleted?: boolean;
    id?: string;
  }>;
  onSubmit: (data: ProfileFormData & { profileImage?: string }) => Promise<void>;
  onCancel?: () => void;
  isEditing?: boolean;
  onEditToggle?: () => void;
  isLoading?: boolean;
  showServiceAreas?: boolean;
  serviceAreaOptions?: string[];
  className?: string;
  title?: string;
  showProfileCompletion?: boolean;
}

export function ProfileForm({
  initialData = {},
  onSubmit,
  onCancel,
  isEditing = false,
  onEditToggle,
  isLoading = false,
  showServiceAreas = false,
  serviceAreaOptions = [],
  className,
  title = "Profile Information",
  showProfileCompletion = false,
}: ProfileFormProps) {
  const { toast } = useToast();
  const [profileImage, setProfileImage] = useState(initialData.profileImage || "");
  const [newProfileImage, setNewProfileImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string>("");
  const [isSaving, setIsSaving] = useState(false);

  const form = useForm<ProfileFormData>({
    resolver: zodResolver(profileFormSchema),
    defaultValues: {
      name: initialData.name || "",
      email: initialData.email || "",
      phone: initialData.phone || "",
      bio: initialData.bio || "",
      specialization: initialData.specialization || "",
      whatsapp: initialData.whatsapp || "",
      linkedin: initialData.linkedin || "",
      instagram: initialData.instagram || "",
      serviceAreas: initialData.serviceAreas || [],
    },
  });

  // Update form when initialData changes
  useEffect(() => {
    if (initialData) {
      form.reset({
        name: initialData.name || "",
        email: initialData.email || "",
        phone: initialData.phone || "",
        bio: initialData.bio || "",
        specialization: initialData.specialization || "",
        whatsapp: initialData.whatsapp || "",
        linkedin: initialData.linkedin || "",
        instagram: initialData.instagram || "",
        serviceAreas: initialData.serviceAreas || [],
      });
      setProfileImage(initialData.profileImage || "");
    }
  }, [initialData, form]);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Validate file type
      const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
      if (!validTypes.includes(file.type)) {
        toast({
          title: "Invalid file type",
          description: "Please select a JPEG, PNG, or WebP image.",
          variant: "destructive",
        });
        return;
      }

      // Validate file size (5MB limit)
      if (file.size > 5 * 1024 * 1024) {
        toast({
          title: "File too large",
          description: "Please select an image smaller than 5MB.",
          variant: "destructive",
        });
        return;
      }

      setNewProfileImage(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        const result = reader.result as string;
        setImagePreview(result);
        setProfileImage(result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleRemoveImage = () => {
    setNewProfileImage(null);
    setImagePreview("");
    setProfileImage(initialData.profileImage || "");
  };

  const handleServiceAreaToggle = (area: string) => {
    const currentAreas = form.getValues("serviceAreas") || [];
    const newAreas = currentAreas.includes(area)
      ? currentAreas.filter((a) => a !== area)
      : [...currentAreas, area];
    form.setValue("serviceAreas", newAreas);
  };

  const handleFormSubmit = async (data: ProfileFormData) => {
    setIsSaving(true);
    try {
      await onSubmit({
        ...data,
        profileImage: newProfileImage ? imagePreview : profileImage,
      });
      
      toast({
        title: "Success",
        description: "Profile updated successfully!",
      });
    } catch (error) {
      console.error("Profile update error:", error);
      toast({
        title: "Error",
        description: "Failed to update profile. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancel = () => {
    form.reset();
    setNewProfileImage(null);
    setImagePreview("");
    setProfileImage(initialData.profileImage || "");
    onCancel?.();
  };

  const safeImageSrc = (src?: string) => (src && src.trim() ? src : "/placeholder.svg");

  return (
    <Card className={cn("shadow-lg", className)}>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
        <CardTitle className="text-xl font-bold">{title}</CardTitle>
        <div className="flex items-center space-x-2">
          {showProfileCompletion && initialData.profileCompleted && (
            <Badge variant="outline">
              <CheckCircle className="h-4 w-4 mr-2" />
              Profile Completed
            </Badge>
          )}
          {onEditToggle && (
            <Button
              variant={isEditing ? "ghost" : "default"}
              size="sm"
              onClick={onEditToggle}
              disabled={isLoading}
            >
              {isEditing ? (
                <>
                  <X className="h-4 w-4 mr-2" />
                  Cancel
                </>
              ) : (
                <>
                  <Edit className="h-4 w-4 mr-2" />
                  Edit Profile
                </>
              )}
            </Button>
          )}
        </div>
      </CardHeader>
      
      <CardContent>
        <form onSubmit={form.handleSubmit(handleFormSubmit)} className="space-y-6">
          {/* Profile Picture */}
          <div className="flex items-center space-x-4">
            <div className="relative">
              <Avatar className="w-24 h-24">
                {profileImage ? (
                  <AvatarImage 
                    src={safeImageSrc(profileImage)} 
                    alt={form.getValues("name") || "Profile"} 
                  />
                ) : (
                  <AvatarFallback className="bg-gray-300 text-gray-600">
                    <UserIcon className="w-8 h-8" />
                  </AvatarFallback>
                )}
              </Avatar>
              {isEditing && (
                <div className="absolute -bottom-2 -right-2">
                  <Label
                    htmlFor="profile-image-upload"
                    className="cursor-pointer bg-blue-500 text-white p-2 rounded-full hover:bg-blue-600 transition-colors duration-200 shadow-lg"
                  >
                    <Camera className="h-4 w-4" />
                  </Label>
                  <Input
                    type="file"
                    id="profile-image-upload"
                    className="hidden"
                    onChange={handleImageUpload}
                    accept="image/jpeg,image/jpg,image/png,image/webp"
                  />
                </div>
              )}
            </div>
            
            {isEditing && (
              <div className="flex-1">
                <div className="space-y-2">
                  <Label className="text-sm font-medium">Profile Picture</Label>
                  <div className="flex items-center space-x-2">
                    <Label
                      htmlFor="profile-image-upload"
                      className="cursor-pointer bg-blue-500 text-white px-4 py-2 rounded-md hover:bg-blue-600 transition-colors duration-200 text-sm"
                    >
                      <Upload className="h-4 w-4 mr-2 inline-block" />
                      Upload New Image
                    </Label>
                    {(newProfileImage || profileImage !== initialData.profileImage) && (
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={handleRemoveImage}
                      >
                        Remove
                      </Button>
                    )}
                  </div>
                  <p className="text-xs text-gray-500">
                    JPEG, PNG, or WebP. Max 5MB.
                  </p>
                </div>
              </div>
            )}
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            {/* Name */}
            <div className="space-y-2">
              <Label htmlFor="name">Full Name *</Label>
              <Input
                id="name"
                {...form.register("name")}
                disabled={!isEditing}
                className={form.formState.errors.name ? "border-red-500" : ""}
              />
              {form.formState.errors.name && (
                <p className="text-sm text-red-500">{form.formState.errors.name.message}</p>
              )}
            </div>

            {/* Email */}
            <div className="space-y-2">
              <Label htmlFor="email">Email Address *</Label>
              <Input
                id="email"
                type="email"
                {...form.register("email")}
                disabled={!isEditing}
                className={form.formState.errors.email ? "border-red-500" : ""}
              />
              {form.formState.errors.email && (
                <p className="text-sm text-red-500">{form.formState.errors.email.message}</p>
              )}
            </div>

            {/* Phone */}
            <div className="space-y-2">
              <Label htmlFor="phone">Phone Number</Label>
              <Input
                id="phone"
                type="tel"
                {...form.register("phone")}
                disabled={!isEditing}
                placeholder="+1 (555) 123-4567"
              />
            </div>

            {/* WhatsApp */}
            <div className="space-y-2">
              <Label htmlFor="whatsapp">WhatsApp Number</Label>
              <Input
                id="whatsapp"
                type="tel"
                {...form.register("whatsapp")}
                disabled={!isEditing}
                placeholder="+919876543210"
              />
            </div>
          </div>

          {/* Bio */}
          <div className="space-y-2">
            <Label htmlFor="bio">Bio</Label>
            <Textarea
              id="bio"
              {...form.register("bio")}
              disabled={!isEditing}
              className="resize-none"
              rows={3}
              placeholder="Tell us about yourself..."
            />
          </div>

          {/* Specialization */}
          <div className="space-y-2">
            <Label htmlFor="specialization">Specialization</Label>
            <Input
              id="specialization"
              {...form.register("specialization")}
              disabled={!isEditing}
              placeholder="e.g., Residential Properties, Commercial Real Estate"
            />
          </div>

          {/* Service Areas */}
          {showServiceAreas && serviceAreaOptions.length > 0 && (
            <div className="space-y-2">
              <Label>Service Areas</Label>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                {serviceAreaOptions.map((area) => (
                  <div key={area} className="flex items-center space-x-2">
                    <Checkbox
                      id={`area-${area}`}
                      checked={(form.getValues("serviceAreas") || []).includes(area)}
                      onCheckedChange={() => handleServiceAreaToggle(area)}
                      disabled={!isEditing}
                    />
                    <Label htmlFor={`area-${area}`} className="text-sm">
                      {area}
                    </Label>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Social Media Links */}
          <div className="space-y-4">
            <Label className="text-base font-medium">Social Media Links</Label>
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="linkedin">LinkedIn Profile URL</Label>
                <Input
                  id="linkedin"
                  type="url"
                  {...form.register("linkedin")}
                  disabled={!isEditing}
                  placeholder="https://linkedin.com/in/yourprofile"
                  className={form.formState.errors.linkedin ? "border-red-500" : ""}
                />
                {form.formState.errors.linkedin && (
                  <p className="text-sm text-red-500">{form.formState.errors.linkedin.message}</p>
                )}
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="instagram">Instagram Username</Label>
                <Input
                  id="instagram"
                  {...form.register("instagram")}
                  disabled={!isEditing}
                  placeholder="@yourusername"
                />
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          {isEditing && (
            <div className="flex justify-end space-x-2 pt-4">
              <Button
                type="button"
                variant="ghost"
                onClick={handleCancel}
                disabled={isSaving}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={isSaving || isLoading}
              >
                {isSaving ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4 mr-2" />
                    Save Changes
                  </>
                )}
              </Button>
            </div>
          )}
        </form>
      </CardContent>
    </Card>
  );
}