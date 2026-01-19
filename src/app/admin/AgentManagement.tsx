"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Switch } from "@/components/ui/switch";
import { Search } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface AgentRow {
  id: string;
  name: string | null;
  email: string | null;
  phone: string | null;
  category: string | null;
  is_active: boolean | null;
}

export default function AgentManagement() {
  const { toast } = useToast();
  const [searchQuery, setSearchQuery] = useState("");
  const [agents, setAgents] = useState<AgentRow[]>([]);
  const [hasSearched, setHasSearched] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const loadAgents = async () => {
    setIsLoading(true);
    const response = await fetch(`/api/admin/agents?q=${encodeURIComponent(searchQuery.trim())}`);
    const data = await response.json();
    setIsLoading(false);
    setHasSearched(true);

    if (!response.ok) {
      toast({
        title: "Error",
        description: data?.error || "Failed to load agents.",
        variant: "destructive",
      });
      return;
    }

    setAgents((data.agents || []) as AgentRow[]);
  };

  useEffect(() => {
    loadAgents();
  }, []);

  const toggleActive = async (agentId: string, nextValue: boolean) => {
    const response = await fetch(`/api/admin/agents/${agentId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ is_active: nextValue }),
    });
    const data = await response.json();
    if (!response.ok) {
      toast({
        title: "Error",
        description: data?.error || "Failed to update agent.",
        variant: "destructive",
      });
      return;
    }
    setAgents((prev) =>
      prev.map((agent) => (agent.id === agentId ? { ...agent, is_active: nextValue } : agent))
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Agents</h2>
      </div>

      <Card>
        <CardContent className="pt-6 space-y-4">
          <div className="flex gap-2 max-w-md">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search agents..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            <Button variant="outline" onClick={loadAgents}>
              Search
            </Button>
          </div>

          {isLoading ? (
            <div className="text-sm text-muted-foreground">Loading agents...</div>
          ) : hasSearched ? (
            <div className="border rounded-lg">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Phone</TableHead>
                    <TableHead>Category</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Active</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {agents.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center text-muted-foreground py-8">
                        No agents found.
                      </TableCell>
                    </TableRow>
                  ) : (
                    agents.map((agent) => (
                      <TableRow key={agent.id}>
                        <TableCell className="font-medium">{agent.name || "-"}</TableCell>
                        <TableCell>{agent.email || "-"}</TableCell>
                        <TableCell>{agent.phone || "-"}</TableCell>
                        <TableCell>{agent.category || "-"}</TableCell>
                        <TableCell>{agent.is_active ? "active" : "inactive"}</TableCell>
                        <TableCell>
                          <Switch
                            checked={agent.is_active ?? false}
                            onCheckedChange={(value) => toggleActive(agent.id, value)}
                          />
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          ) : null}
        </CardContent>
      </Card>
    </div>
  );
}




