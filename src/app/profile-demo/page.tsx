"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ProfileForm } from "@/components/ui/profile-form";
import { ProfileUpdateData } from "@/services/profileService";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, Code, Eye, Settings } from "lucide-react";
import Link from "next/link";

export default function ProfileDemo() {
  const { toast } = useToast();
  const [demoProfile, setDemoProfile] = useState({
    id: "demo-user-123",
    name: "John Doe",
    email: "john.doe@example.com",
    phone: "+1 (555) 123-4567",
    bio: "Experienced real estate agent with over 10 years in the industry. Specializing in residential properties and first-time home buyers.",
    specialization: "Residential Properties",
    profileImage: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&h=150&fit=crop&crop=face",
    serviceAreas: ["Gachibowli", "Kondapur", "Hitech City"],
    whatsapp: "+919876543210",
    linkedin: "https://linkedin.com/in/johndoe",
    instagram: "@johndoe_realtor",
    profileCompleted: true,
  });
  
  const [isEditing, setIsEditing] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const serviceAreaOptions = [
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

  const handleSubmit = async (data: ProfileUpdateData & { profileImage?: string }) => {
    setIsLoading(true);
    
    // Simulate API call delay
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Update demo profile
    setDemoProfile(prev => ({
      ...prev,
      ...data,
    }));
    
    setIsLoading(false);
    setIsEditing(false);
    
    toast({
      title: "Success",
      description: "Profile updated successfully! (Demo mode)",
    });
  };

  const handleEditToggle = () => {
    setIsEditing(!isEditing);
  };

  const handleCancel = () => {
    setIsEditing(false);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Link href="/">
                <Button variant="outline" size="sm">
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Back to Home
                </Button>
              </Link>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">
                  Profile Form Demo
                </h1>
                <p className="text-sm text-gray-600">
                  Interactive demonstration of the ProfileForm component
                </p>
              </div>
            </div>
            <Badge variant="secondary" className="flex items-center">
              <Code className="h-4 w-4 mr-1" />
              Demo Mode
            </Badge>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto space-y-6">
          {/* Demo Info Card */}
          <Card className="border-blue-200 bg-blue-50">
            <CardHeader>
              <CardTitle className="flex items-center text-blue-800">
                <Eye className="h-5 w-5 mr-2" />
                Demo Features
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid md:grid-cols-2 gap-4 text-sm text-blue-700">
                <div>
                  <h4 className="font-medium mb-2">✨ Key Features:</h4>
                  <ul className="space-y-1">
                    <li>• Image upload with preview</li>
                    <li>• Form validation with Zod</li>
                    <li>• Service area selection</li>
                    <li>• Social media links</li>
                    <li>• Profile completion tracking</li>
                  </ul>
                </div>
                <div>
                  <h4 className="font-medium mb-2">🎯 Try These Actions:</h4>
                  <ul className="space-y-1">
                    <li>• Click "Edit Profile" to start editing</li>
                    <li>• Upload a new profile image</li>
                    <li>• Change service areas</li>
                    <li>• Update social media links</li>
                    <li>• Save to see the changes</li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Profile Form Demo */}
          <ProfileForm
            initialData={demoProfile}
            onSubmit={handleSubmit}
            onCancel={handleCancel}
            isEditing={isEditing}
            onEditToggle={handleEditToggle}
            isLoading={isLoading}
            showServiceAreas={true}
            serviceAreaOptions={serviceAreaOptions}
            title="User Profile (Demo)"
            showProfileCompletion={true}
            className="max-w-none"
          />

          {/* Implementation Guide */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Settings className="h-5 w-5 mr-2" />
                Implementation Guide
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4 text-sm">
                <div>
                  <h4 className="font-medium mb-2">Basic Usage:</h4>
                  <pre className="bg-gray-100 p-3 rounded text-xs overflow-x-auto">
{`import { ProfileForm } from "@/components/ui/profile-form";

<ProfileForm
  initialData={profileData}
  onSubmit={handleSubmit}
  onCancel={handleCancel}
  isEditing={isEditing}
  onEditToggle={handleEditToggle}
  showServiceAreas={true}
  serviceAreaOptions={serviceAreas}
/>`}
                  </pre>
                </div>

                <div>
                  <h4 className="font-medium mb-2">With Profile Service:</h4>
                  <pre className="bg-gray-100 p-3 rounded text-xs overflow-x-auto">
{`import { useProfile } from "@/hooks/use-profile";

const { profile, updateProfile, isUpdating } = useProfile();

const handleSubmit = async (data) => {
  await updateProfile(data);
};`}
                  </pre>
                </div>

                <div>
                  <h4 className="font-medium mb-2">API Integration:</h4>
                  <pre className="bg-gray-100 p-3 rounded text-xs overflow-x-auto">
{`// GET /api/profile - Get user profile
// PUT /api/profile - Update user profile  
// POST /api/profile/image - Upload profile image`}
                  </pre>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}