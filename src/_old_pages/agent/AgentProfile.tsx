import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Edit, Save, Upload, User as UserIcon, CheckCircle } from "lucide-react";
import { ArrowLeft, Loader2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Link } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import { agentProfileService } from "@/services/agentProfileService";
import { supabaseImageService } from "@/services/supabaseImageService";

interface AgentProfileData {
  id: string;
  name: string;
  email: string;
  phone: string;
  bio: string;
  specialization: string;
  profileImage: string;
  serviceAreas: string[];
  whatsapp: string;
  linkedin: string;
  instagram: string;
  createdAt: string;
  profileCompleted: boolean;
}

const AgentProfile = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [agent, setAgent] = useState<AgentProfileData | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [bio, setBio] = useState("");
  const [specialization, setSpecialization] = useState("");
  const [serviceAreas, setServiceAreas] = useState<string[]>([]);
  const [whatsapp, setWhatsapp] = useState("");
  const [linkedin, setLinkedin] = useState("");
  const [instagram, setInstagram] = useState("");
  const [profileImage, setProfileImage] = useState("");
  const [newProfileImage, setNewProfileImage] = useState<File | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [profileCompleted, setProfileCompleted] = useState(false);

  const userId = localStorage.getItem("user_id");

  useEffect(() => {
    const loadAgentProfile = async () => {
      if (!userId) {
        toast({
          title: "Error",
          description: "User ID not found. Please log in again.",
          variant: "destructive",
        });
        navigate("/login");
        return;
      }

      setIsLoading(true);
      try {
        const agentData = await agentProfileService.getAgentById(userId);
        if (agentData) {
          setAgent({
            id: agentData.id,
            name: agentData.name,
            email: agentData.email,
            phone: agentData.phone || "",
            bio: agentData.bio || "",
            specialization: agentData.specialization || "",
            profileImage: agentData.profile_image || "",
            serviceAreas: agentData.service_areas || [],
            whatsapp: agentData.whatsapp || "",
            linkedin: agentData.linkedin || "",
            instagram: agentData.instagram || "",
            createdAt: agentData.created_at,
            profileCompleted: agentData.profile_completed || false,
          });
          setName(agentData.name);
          setPhone(agentData.phone || "");
          setBio(agentData.bio || "");
          setSpecialization(agentData.specialization || "");
          setServiceAreas(agentData.service_areas || []);
          setWhatsapp(agentData.whatsapp || "");
          setLinkedin(agentData.linkedin || "");
          setInstagram(agentData.instagram || "");
          setProfileImage(agentData.profile_image || "");
          setProfileCompleted(agentData.profile_completed || false);
        } else {
          toast({
            title: "Error",
            description: "Agent profile not found.",
            variant: "destructive",
          });
        }
      } catch (error) {
        console.error("Error fetching agent profile:", error);
        toast({
          title: "Error",
          description: "Failed to load agent profile. Please try again.",
          variant: "destructive",
        });
      } finally {
        setIsLoading(false);
      }
    };

    loadAgentProfile();
  }, [navigate, toast, userId]);

  const handleEditClick = () => {
    setIsEditing(true);
  };

  const handleCancelClick = () => {
    setIsEditing(false);
    if (agent) {
      setName(agent.name);
      setPhone(agent.phone);
      setBio(agent.bio);
      setSpecialization(agent.specialization);
      setServiceAreas(agent.serviceAreas);
      setWhatsapp(agent.whatsapp);
      setLinkedin(agent.linkedin);
      setInstagram(agent.instagram);
    }
  };

  const handleServiceAreaToggle = (area: string) => {
    setServiceAreas((prevAreas) =>
      prevAreas.includes(area)
        ? prevAreas.filter((a) => a !== area)
        : [...prevAreas, area]
    );
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setNewProfileImage(file);
      // Optionally display a local preview of the image
      const reader = new FileReader();
      reader.onloadend = () => {
        setProfileImage(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSaveClick = async () => {
    if (!userId) {
      toast({
        title: "Error",
        description: "User ID not found. Please log in again.",
        variant: "destructive",
      });
      navigate("/login");
      return;
    }

    setIsSaving(true);
    try {
      let uploadedImageUrl = profileImage;

      if (newProfileImage) {
        const uploadResult = await supabaseImageService.uploadSingleImage(
          newProfileImage
        );
        if (uploadResult) {
          uploadedImageUrl = uploadResult.url;
        } else {
          toast({
            title: "Error",
            description: "Failed to upload new profile image.",
            variant: "destructive",
          });
          setIsSaving(false);
          return;
        }
      }

      const updatedProfileData = {
        name,
        phone,
        bio,
        specialization,
        service_areas: serviceAreas,
        whatsapp,
        linkedin,
        instagram,
        profile_image: uploadedImageUrl,
        profile_completed: true,
      };

      const updatedAgent = await agentProfileService.updateProfile(
        userId,
        updatedProfileData
      );

      if (updatedAgent) {
        setAgent(updatedAgent);
        setIsEditing(false);
        setNewProfileImage(null);
        setProfileCompleted(true);
        toast({
          title: "Success",
          description: "Profile updated successfully!",
        });
      } else {
        toast({
          title: "Error",
          description: "Failed to update profile. Please try again.",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Error updating agent profile:", error);
      toast({
        title: "Error",
        description: "Failed to update profile. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
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

  if (!agent) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Card className="shadow-lg">
          <CardContent className="p-6">
            <h2 className="text-lg font-semibold mb-4">Agent Profile Not Found</h2>
            <p className="text-gray-600">
              Could not load your profile. Please try again later.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Link to="/agent/dashboard">
                <Button variant="outline" size="sm">
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Back to Dashboard
                </Button>
              </Link>
              <h1 className="text-2xl font-bold text-gray-900">
                {isEditing ? "Edit Profile" : "My Profile"}
              </h1>
            </div>
            {isEditing ? (
              <div className="space-x-2">
                <Button variant="ghost" onClick={handleCancelClick}>
                  Cancel
                </Button>
                <Button onClick={handleSaveClick} disabled={isSaving}>
                  {isSaving ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <Save className="h-4 w-4 mr-2" />
                      Save
                    </>
                  )}
                </Button>
              </div>
            ) : (
              <Button onClick={handleEditClick}>
                <Edit className="h-4 w-4 mr-2" />
                Edit Profile
              </Button>
            )}
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="container mx-auto px-4 py-8">
        <Card className="shadow-lg">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xl font-bold">
              Personal Information
            </CardTitle>
            {profileCompleted && (
              <Badge variant="outline">
                <CheckCircle className="h-4 w-4 mr-2" />
                Profile Completed
              </Badge>
            )}
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4">
              {/* Profile Picture */}
              <div>
                <div className="flex items-center space-x-4">
                  <Avatar className="w-24 h-24">
                    {profileImage ? (
                      <AvatarImage src={profileImage} alt={name} />
                    ) : (
                      <AvatarFallback className="bg-gray-300 text-gray-600">
                        <UserIcon className="w-6 h-6" />
                      </AvatarFallback>
                    )}
                  </Avatar>
                  {isEditing && (
                    <div>
                      <Label
                        htmlFor="profile-image-upload"
                        className="cursor-pointer bg-blue-500 text-white px-4 py-2 rounded-md hover:bg-blue-600 transition-colors duration-200"
                      >
                        <Upload className="h-4 w-4 mr-2 inline-block" />
                        Upload New Image
                      </Label>
                      <Input
                        type="file"
                        id="profile-image-upload"
                        className="hidden"
                        onChange={handleImageUpload}
                        accept="image/*"
                      />
                    </div>
                  )}
                </div>
              </div>

              {/* Name */}
              <div>
                <Label htmlFor="name">Full Name</Label>
                <Input
                  id="name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  disabled={!isEditing}
                />
              </div>

              {/* Email */}
              <div>
                <Label htmlFor="email">Email Address</Label>
                <Input
                  id="email"
                  type="email"
                  value={agent.email}
                  disabled
                />
              </div>

              {/* Phone */}
              <div>
                <Label htmlFor="phone">Phone Number</Label>
                <Input
                  id="phone"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  disabled={!isEditing}
                />
              </div>

              {/* Bio */}
              <div>
                <Label htmlFor="bio">Bio</Label>
                <Textarea
                  id="bio"
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  disabled={!isEditing}
                  className="resize-none"
                />
              </div>

              {/* Specialization */}
              <div>
                <Label htmlFor="specialization">Specialization</Label>
                <Input
                  id="specialization"
                  value={specialization}
                  onChange={(e) => setSpecialization(e.target.value)}
                  disabled={!isEditing}
                />
              </div>

              {/* Service Areas */}
              <div>
                <Label>Service Areas</Label>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                  {microMarkets.map((area) => (
                    <div key={area} className="flex items-center space-x-2">
                      <Checkbox
                        id={`area-${area}`}
                        checked={serviceAreas.includes(area)}
                        onCheckedChange={() => handleServiceAreaToggle(area)}
                        disabled={!isEditing}
                      />
                      <Label htmlFor={`area-${area}`}>{area}</Label>
                    </div>
                  ))}
                </div>
              </div>

              {/* Social Media Links */}
              <div>
                <Label>Social Media Links</Label>
                <div className="grid gap-4">
                  <div>
                    <Label htmlFor="whatsapp">WhatsApp Number</Label>
                    <Input
                      id="whatsapp"
                      type="tel"
                      placeholder="+919876543210"
                      value={whatsapp}
                      onChange={(e) => setWhatsapp(e.target.value)}
                      disabled={!isEditing}
                    />
                  </div>
                  <div>
                    <Label htmlFor="linkedin">LinkedIn Profile URL</Label>
                    <Input
                      id="linkedin"
                      type="url"
                      placeholder="https://linkedin.com/in/yourprofile"
                      value={linkedin}
                      onChange={(e) => setLinkedin(e.target.value)}
                      disabled={!isEditing}
                    />
                  </div>
                  <div>
                    <Label htmlFor="instagram">Instagram Username</Label>
                    <Input
                      id="instagram"
                      type="text"
                      placeholder="@yourusername"
                      value={instagram}
                      onChange={(e) => setInstagram(e.target.value)}
                      disabled={!isEditing}
                    />
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default AgentProfile;
