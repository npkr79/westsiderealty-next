import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { 
  Search, 
  Phone, 
  MessageSquare,
  MapPin,
  Filter
} from "lucide-react";
import { Link } from "react-router-dom";
import Layout from "@/components/layout/Layout";
import type { AgentProfile } from "@/services/supabaseAgentService";

const AgentsDirectory = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [agents, setAgents] = useState<AgentProfile[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadAgents = async () => {
      try {
        setIsLoading(true);
        setAgents([]);
      } catch (error) {
        console.error('Error loading agents:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadAgents();
  }, []);

  const handleWhatsAppContact = (agent: AgentProfile) => {
    const message = `Hi ${agent.name}, I found your profile on REMAX Westside Realty. I'm looking for properties. Could you please help me?`;
    const whatsappNumber = agent.whatsapp || agent.phone;
    const url = `https://wa.me/${whatsappNumber?.replace(/\D/g, '')}?text=${encodeURIComponent(message)}`;
    window.open(url, '_blank');
  };

  const filteredAgents = agents.filter(agent =>
    agent.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (agent.service_areas && agent.service_areas.some(area => area.toLowerCase().includes(searchQuery.toLowerCase()))) ||
    (agent.specialization && agent.specialization.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  if (isLoading) {
    return (
      <Layout>
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <div className="text-center">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            <p className="mt-2 text-gray-600">Loading agents...</p>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="min-h-screen bg-gray-50">
        <div className="bg-white shadow-sm border-b">
          <div className="container mx-auto px-4 py-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-4">Find Real Estate Agents</h1>
            <p className="text-gray-600">Connect with experienced agents at REMAX Westside Realty</p>
          </div>
        </div>

        <div className="container mx-auto px-4 py-8">
          <Card className="mb-8">
            <CardContent className="p-6">
              <div className="flex flex-col md:flex-row gap-4">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                  <Input
                    placeholder="Search agents by name, location, or specialization..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10"
                  />
                </div>
                <Button variant="outline" className="md:w-auto">
                  <Filter className="h-4 w-4 mr-2" />
                  Filter
                </Button>
              </div>
            </CardContent>
          </Card>

          <div className="mb-6">
            <p className="text-gray-600">
              Showing {filteredAgents.length} agent{filteredAgents.length !== 1 ? 's' : ''}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredAgents.map((agent) => (
              <Card key={agent.id} className="overflow-hidden hover:shadow-lg transition-shadow">
                <CardContent className="p-6">
                  <div className="flex items-center space-x-4 mb-4">
                    <img
                      src={agent.profile_image || "/lovable-uploads/0921f9e5-f1e5-4ce6-adb2-480b68d73038.png"}
                      alt={agent.name}
                      className="w-16 h-16 rounded-full object-cover"
                    />
                    <div className="flex-1">
                      <h3 className="text-lg font-semibold">{agent.name}</h3>
                      <div className="flex items-center space-x-2">
                        <span className="text-sm text-gray-500">Real Estate Agent</span>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-2 mb-4">
                    {agent.service_areas && agent.service_areas.length > 0 && (
                      <div className="flex items-center text-sm text-gray-600">
                        <MapPin className="h-3 w-3 mr-2" />
                        {agent.service_areas[0]}
                      </div>
                    )}
                    {agent.specialization && (
                      <Badge variant="secondary" className="text-xs">
                        {agent.specialization}
                      </Badge>
                    )}
                  </div>

                  <p className="text-sm text-gray-600 mb-4" style={{ 
                    display: '-webkit-box',
                    WebkitLineClamp: 2,
                    WebkitBoxOrient: 'vertical',
                    overflow: 'hidden',
                    lineHeight: '1.4em',
                    height: '2.8em'
                  }}>
                    {agent.bio ? 
                      agent.bio.replace(/<[^>]*>/g, '') : // Strip HTML tags for display
                      "Real estate professional helping clients find their perfect property."
                    }
                  </p>

                  <div className="grid grid-cols-2 gap-2">
                    <Button
                      size="sm"
                      className="w-full"
                      onClick={() => handleWhatsAppContact(agent)}
                      disabled={!agent.whatsapp && !agent.phone}
                    >
                      <MessageSquare className="h-3 w-3 mr-1" />
                      WhatsApp
                    </Button>
                    <Button 
                      size="sm" 
                      variant="outline" 
                      className="w-full"
                      disabled={!agent.phone}
                      onClick={() => window.location.href = `tel:${agent.phone}`}
                    >
                      <Phone className="h-3 w-3 mr-1" />
                      Call
                    </Button>
                  </div>

                  <Link to={`/agent/${agent.id}`} className="block mt-2">
                    <Button variant="ghost" className="w-full text-sm">
                      View Profile
                    </Button>
                  </Link>
                </CardContent>
              </Card>
            ))}
          </div>

          {filteredAgents.length === 0 && (
            <div className="text-center py-12">
              <p className="text-gray-500">
                {agents.length === 0 
                  ? "No agents available at the moment." 
                  : "No agents found matching your search criteria."
                }
              </p>
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
};

export default AgentsDirectory;
