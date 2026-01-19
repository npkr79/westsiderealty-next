 "use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Plus, Edit, Trash2 } from "lucide-react";
import Link from "next/link";
import { useToast } from "@/hooks/use-toast";
import AddAgentModal from "@/components/admin/AddAgentModal";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

interface AgentProfile {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  category: string;
  is_active: boolean;
  created_at: string;
}

const AgentManagement = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [agents, setAgents] = useState<AgentProfile[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isAddAgentModalOpen, setIsAddAgentModalOpen] = useState(false);
  const [selectedAgentId, setSelectedAgentId] = useState<string | null>(null);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const { toast } = useToast();

  const loadAgents = async () => {
    try {
      setIsLoading(true);
      const response = await fetch(`/api/admin/agents?q=${encodeURIComponent(searchQuery.trim())}`);
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data?.error || "Failed to load agents.");
      }
      setAgents((data.agents || []) as AgentProfile[]);
    } catch (error) {
      console.error("Error loading agents:", error);
      toast({
        title: "Error",
        description: "Failed to load agents.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadAgents();
  }, []);

  const handleAgentAdded = async () => {
    setIsAddAgentModalOpen(false);
    await loadAgents();
  };

  const handleDeleteAgent = async () => {
    if (!selectedAgentId) return;

    try {
      setIsLoading(true);
      const response = await fetch(`/api/admin/agents/${selectedAgentId}`, { method: "DELETE" });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data?.error || "Failed to delete agent.");
      }
      setAgents(agents.filter(agent => agent.id !== selectedAgentId));
      toast({
        title: "Success",
        description: "Agent deleted successfully!",
      });
    } catch (error) {
      console.error("Error deleting agent:", error);
      toast({
        title: "Error",
        description: "Failed to delete agent.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
      setIsDeleteDialogOpen(false);
      setSelectedAgentId(null);
    }
  };

  const handleActivateAgent = async (agentId: string) => {
    try {
      setIsLoading(true);
      const response = await fetch(`/api/admin/agents/${agentId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ is_active: true }),
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data?.error || "Failed to activate agent.");
      }
      const updatedAgents = agents.map(agent =>
        agent.id === agentId ? { ...agent, is_active: true } : agent
      );
      setAgents(updatedAgents);
      toast({
        title: "Success",
        description: "Agent activated successfully!",
      });
    } catch (error) {
      console.error("Error activating agent:", error);
      toast({
        title: "Error",
        description: "Failed to activate agent.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeactivateAgent = async (agentId: string) => {
    try {
      setIsLoading(true);
      const response = await fetch(`/api/admin/agents/${agentId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ is_active: false }),
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data?.error || "Failed to deactivate agent.");
      }
      const updatedAgents = agents.map(agent =>
        agent.id === agentId ? { ...agent, is_active: false } : agent
      );
      setAgents(updatedAgents);
      toast({
        title: "Success",
        description: "Agent deactivated successfully!",
      });
    } catch (error) {
      console.error("Error deactivating agent:", error);
      toast({
        title: "Error",
        description: "Failed to deactivate agent.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const filteredAgents = agents.filter(agent =>
    agent.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    agent.email.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white shadow-sm border-b">
        <div className="container mx-auto px-4 py-8">
          <div className="flex items-center justify-between">
            <h1 className="text-3xl font-bold text-gray-900">Agent Management</h1>
            <Button onClick={() => setIsAddAgentModalOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Add Agent
            </Button>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        <Card className="mb-8">
          <CardContent className="p-6">
            <div className="flex items-center">
              <Label htmlFor="search">Search Agents:</Label>
              <Input
                type="search"
                id="search"
                placeholder="Search by name or email..."
                className="ml-4"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </CardContent>
        </Card>

        {isLoading ? (
          <div className="text-center py-8">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            <p className="mt-2 text-gray-600">Loading agents...</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredAgents.map((agent) => (
              <Card key={agent.id} className="shadow-md">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">{agent.name}</CardTitle>
                  <div className="flex items-center space-x-2">
                    <Switch
                      id={`active-${agent.id}`}
                      checked={agent.is_active}
                      onCheckedChange={(checked) => {
                        if (checked) {
                          handleActivateAgent(agent.id);
                        } else {
                          handleDeactivateAgent(agent.id);
                        }
                      }}
                    />
                    <Label htmlFor={`active-${agent.id}`} className="text-xs text-gray-700 font-medium">
                      {agent.is_active ? "Active" : "Inactive"}
                    </Label>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="text-sm text-gray-600">
                    <p>Email: {agent.email}</p>
                    <p>Phone: {agent.phone || "N/A"}</p>
                    <p>Category: {agent.category || "N/A"}</p>
                  </div>
                  <div className="flex justify-end mt-4 space-x-2">
                    <Link href={`/agent/${agent.id}`}>
                      <Button variant="ghost" size="sm">
                        <Edit className="h-4 w-4 mr-2" />
                        Edit
                      </Button>
                    </Link>
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button variant="ghost" size="sm" onClick={() => setSelectedAgentId(agent.id)}>
                          <Trash2 className="h-4 w-4 mr-2" />
                          Delete
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                          <AlertDialogDescription>
                            This action cannot be undone. Are you sure you want to delete {agent.name}?
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                          <AlertDialogAction onClick={handleDeleteAgent}>Continue</AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        <AddAgentModal
          open={isAddAgentModalOpen}
          onClose={() => setIsAddAgentModalOpen(false)}
          onAgentAdded={handleAgentAdded}
        />
      </div>
    </div>
  );
};

export default AgentManagement;
