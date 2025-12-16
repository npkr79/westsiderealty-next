import { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Loader2 } from "lucide-react";
import { Link } from "react-router-dom";
import AgentProfileView from "@/components/agent/AgentProfileView";
import { agentService } from "@/services/agentService";

type User = {
  id: string;
  name: string;
  email?: string;
  phone?: string;
  bio?: string;
  specialization?: string;
  profileImage?: string;
  serviceAreas?: string[];
  whatsapp?: string;
  linkedin?: string;
  instagram?: string;
  createdAt?: string;
  profileCompleted?: boolean;
};

const AgentPublicProfile = () => {
  const { id } = useParams();
  const [agent, setAgent] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchAgent = async () => {
      if (!id) {
        setError("Agent ID not provided");
        setIsLoading(false);
        return;
      }

      try {
        const agentData = await agentService.getAgentById(id);
        
        if (agentData) {
          // Convert agent data to User format
          const userAgent: User = {
            id: agentData.id,
            name: agentData.name,
            email: agentData.email,
            phone: agentData.phone || '',
            bio: agentData.bio || '',
            specialization: agentData.specialization || '',
            profileImage: agentData.profile_image || '',
            serviceAreas: agentData.service_areas || [],
            whatsapp: agentData.whatsapp || '',
            linkedin: agentData.linkedin || '',
            instagram: agentData.instagram || '',
            createdAt: agentData.created_at,
            profileCompleted: true
          };
          
          setAgent(userAgent);
        } else {
          setError("Agent not found");
        }
      } catch (error) {
        console.error("Error fetching agent:", error);
        setError("Failed to load agent profile");
      } finally {
        setIsLoading(false);
      }
    };

    fetchAgent();
  }, [id]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 flex items-center justify-center">
        <div className="flex items-center space-x-3">
          <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
          <span className="text-lg text-gray-700">Loading agent profile...</span>
        </div>
      </div>
    );
  }

  if (error || !agent) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50">
        <header className="bg-white shadow-sm border-b">
          <div className="container mx-auto px-4 py-4">
            <Link to="/agents">
              <Button variant="outline" size="sm">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Agents
              </Button>
            </Link>
          </div>
        </header>
        
        <div className="container mx-auto px-4 py-8">
          <Card className="shadow-xl">
            <CardContent className="p-8 text-center">
              <h1 className="text-2xl font-bold text-gray-900 mb-2">Agent Not Found</h1>
              <p className="text-gray-600 mb-4">
                {error || "The agent profile you're looking for doesn't exist."}
              </p>
              <Link to="/agents">
                <Button>View All Agents</Button>
              </Link>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      {/* Floating Back Button */}
      <div className="fixed top-4 left-4 z-50">
        <Link to="/agents">
          <Button variant="outline" size="sm" className="bg-white/90 backdrop-blur-sm shadow-lg border-white/20">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Agents
          </Button>
        </Link>
      </div>

      {/* Agent Profile Content */}
      <AgentProfileView agent={agent} />
    </div>
  );
};

export default AgentPublicProfile;
