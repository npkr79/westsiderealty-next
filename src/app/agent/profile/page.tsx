"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Loader2, BarChart3, Lightbulb } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { useAuth } from "@/contexts/AuthContext";
import { useProfile } from "@/hooks/use-profile";
import { ProfileForm } from "@/components/ui/profile-form";
import { ProfileUpdateData } from "@/services/profileService";
import { supabaseImageService } from "@/services/supabaseImageService";

export default function AgentProfile() {
  const router = useRouter();
  const { user } = useAuth();
  const { 
    profile, 
    isLoading, 
    isUpdating, 
    completion,
    updateProfile, 
    updateProfileImage,
    getCompletionPercentage,
    getSuggestions 
  } = useProfile();
  const [isEditing, setIsEditing] = useState(false);

  // Handle profile form submission
  const handleProfileSubmit = async (data: ProfileUpdateData & { profileImage?: string }) => {
    let profileImageFile: File | undefined;

    // Handle image upload if there's a new image
    if (data.profileImage && data.profileImage.startsWith('data:')) {
      // Convert base64 to file if needed
      const response = await fetch(data.profileImage);
      const blob = await response.blob();
      profileImageFile = new File([blob], 'profile-image.jpg', { type: 'image/jpeg' });
    }

    const updateData: ProfileUpdateData = {
      name: data.name,
      phone: data.phone,
      bio: data.bio,
      specialization: data.specialization,
      serviceAreas: data.serviceAreas,
      whatsapp: data.whatsapp,
      linkedin: data.linkedin,
      instagram: data.instagram,
      profileImage: data.profileImage,
      profileImageFile,
    };

    const success = await updateProfile(updateData);
    if (success) {
      setIsEditing(false);
    }
  };

  const handleEditToggle = () => {
    setIsEditing(!isEditing);
  };

  const handleCancel = () => {
    setIsEditing(false);
  };

  const microMarkets = [
    "Kokapet",
    "Gandipet",
    "Narsingi",
    "Gachibowli",
    "Kondapur",
    "Tellapur",
    "Mokila",
    "Nallagandla",
    "Nanakramguda",
    "Financial District",
    "Hitech City",
    "Manikonda",
    "Khajaguda",
  ];

  // Redirect if not authenticated
  if (!user) {
    router.push("/login");
    return null;
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <p className="mt-2 text-gray-600">Loading profile...</p>
        </div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Card className="shadow-lg">
          <CardContent className="p-6">
            <h2 className="text-lg font-semibold mb-4">Profile Not Found</h2>
            <p className="text-gray-600">
              Could not load your profile. Please try again later.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const completionPercentage = getCompletionPercentage();
  const suggestions = getSuggestions();

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Link href="/agent">
                <Button variant="outline" size="sm">
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Back to Dashboard
                </Button>
              </Link>
              <h1 className="text-2xl font-bold text-gray-900">
                {isEditing ? "Edit Profile" : "My Profile"}
              </h1>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="container mx-auto px-4 py-8 space-y-6">
        {/* Profile Completion Card */}
        {!profile.profileCompleted && (
          <Card className="border-amber-200 bg-amber-50">
            <CardHeader>
              <CardTitle className="flex items-center text-amber-800">
                <BarChart3 className="h-5 w-5 mr-2" />
                Profile Completion
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <div className="flex justify-between text-sm mb-2">
                    <span>Progress</span>
                    <span>{completionPercentage}%</span>
                  </div>
                  <Progress value={completionPercentage} className="h-2" />
                </div>
                
                {suggestions.length > 0 && (
                  <div>
                    <h4 className="font-medium text-amber-800 mb-2 flex items-center">
                      <Lightbulb className="h-4 w-4 mr-1" />
                      Suggestions to improve your profile:
                    </h4>
                    <ul className="text-sm text-amber-700 space-y-1">
                      {suggestions.map((suggestion, index) => (
                        <li key={index} className="flex items-start">
                          <span className="mr-2">•</span>
                          {suggestion}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Profile Form */}
        <ProfileForm
          initialData={profile}
          onSubmit={handleProfileSubmit}
          onCancel={handleCancel}
          isEditing={isEditing}
          onEditToggle={handleEditToggle}
          isLoading={isUpdating}
          showServiceAreas={true}
          serviceAreaOptions={microMarkets}
          title="Personal Information"
          showProfileCompletion={true}
        />
      </div>
    </div>
  );
}
