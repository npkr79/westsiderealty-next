"use client";

import { useEffect, useMemo, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";

interface AgentProfileRow {
  id: string;
  name: string | null;
  email: string | null;
  phone: string | null;
  specialization: string | null;
  bio: string | null;
  whatsapp: string | null;
  linkedin: string | null;
  instagram: string | null;
  profile_image: string | null;
  service_areas: string[] | null;
  profile_completed: boolean | null;
  category?: string | null;
  is_active?: boolean | null;
}

const emptyProfile = {
  id: "",
  name: "",
  email: "",
  phone: "",
  specialization: "",
  bio: "",
  whatsapp: "",
  linkedin: "",
  instagram: "",
  profile_image: "",
  service_areas: "",
  profile_completed: false,
};

export default function AgentProfilesManager() {
  const { user, isAdmin } = useAuth();
  const supabase = createClient();
  const { toast } = useToast();
  const [profiles, setProfiles] = useState<AgentProfileRow[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [formState, setFormState] = useState<any>(emptyProfile);

  const isPrivileged = isAdmin;

  const loadProfiles = async () => {
    setIsLoading(true);
    try {
      if (isPrivileged) {
        const response = await fetch(
          `/api/admin/agent-profiles?q=${encodeURIComponent(searchQuery.trim())}`
        );
        const data = await response.json();
        if (!response.ok) {
          throw new Error(data?.error || "Failed to load agent profiles.");
        }
        setProfiles((data.profiles || []) as AgentProfileRow[]);
      } else if (user?.id) {
        const { data, error } = await supabase
          .from("agents_profile")
          .select("*")
          .eq("agent_id", user.id)
          .single();
        if (error) {
          throw error;
        }
        setProfiles([
          {
            ...data,
            id: data.agent_id,
          },
        ]);
      }
    } catch (error: any) {
      console.error("Error loading profiles:", error);
      toast({
        title: "Error",
        description: error?.message || "Failed to load profiles.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadProfiles();
  }, [isPrivileged, user?.id]);

  const filteredProfiles = useMemo(() => {
    if (!searchQuery.trim() || !isPrivileged) {
      return profiles;
    }
    const query = searchQuery.toLowerCase();
    return profiles.filter(
      (profile) =>
        profile.name?.toLowerCase().includes(query) ||
        profile.email?.toLowerCase().includes(query) ||
        profile.phone?.includes(query)
    );
  }, [profiles, searchQuery, isPrivileged]);

  const openEditor = (profile: AgentProfileRow) => {
    setFormState({
      id: profile.id,
      name: profile.name || "",
      email: profile.email || "",
      phone: profile.phone || "",
      specialization: profile.specialization || "",
      bio: profile.bio || "",
      whatsapp: profile.whatsapp || "",
      linkedin: profile.linkedin || "",
      instagram: profile.instagram || "",
      profile_image: profile.profile_image || "",
      service_areas: (profile.service_areas || []).join(", "),
      profile_completed: Boolean(profile.profile_completed),
    });
    setIsEditOpen(true);
  };

  const handleSave = async () => {
    try {
      const serviceAreas =
        typeof formState.service_areas === "string"
          ? formState.service_areas
              .split(",")
              .map((area: string) => area.trim())
              .filter(Boolean)
          : [];

      const payload = {
        name: formState.name || null,
        email: formState.email || null,
        phone: formState.phone || null,
        specialization: formState.specialization || null,
        bio: formState.bio || null,
        whatsapp: formState.whatsapp || null,
        linkedin: formState.linkedin || null,
        instagram: formState.instagram || null,
        profile_image: formState.profile_image || null,
        service_areas: serviceAreas,
        profile_completed: Boolean(formState.profile_completed),
      };

      if (isPrivileged) {
        const response = await fetch(`/api/admin/agent-profiles/${formState.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        const data = await response.json();
        if (!response.ok) {
          throw new Error(data?.error || "Failed to update profile.");
        }
      } else if (user?.id) {
        const { error } = await supabase
          .from("agents_profile")
          .update(payload)
          .eq("agent_id", user.id);
        if (error) {
          throw error;
        }
      }

      toast({ title: "Success", description: "Profile updated." });
      setIsEditOpen(false);
      await loadProfiles();
    } catch (error: any) {
      console.error("Error updating profile:", error);
      toast({
        title: "Error",
        description: error?.message || "Failed to update profile.",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Agent Profiles</h2>
      </div>

      <Card>
        <CardContent className="pt-6 space-y-4">
          {isPrivileged && (
            <div className="flex gap-2 max-w-md">
              <Input
                placeholder="Search by name, email, or phone..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
              <Button variant="outline" onClick={loadProfiles}>
                Search
              </Button>
            </div>
          )}

          {isLoading ? (
            <div className="text-sm text-muted-foreground">Loading profiles...</div>
          ) : (
            <div className="border rounded-lg">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Phone</TableHead>
                    <TableHead>Category</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Profile</TableHead>
                    <TableHead></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredProfiles.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center text-muted-foreground py-8">
                        No profiles found.
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredProfiles.map((profile) => (
                      <TableRow key={profile.id}>
                        <TableCell className="font-medium">{profile.name || "-"}</TableCell>
                        <TableCell>{profile.email || "-"}</TableCell>
                        <TableCell>{profile.phone || "-"}</TableCell>
                        <TableCell>{profile.category || "-"}</TableCell>
                        <TableCell>{profile.is_active ? "active" : "inactive"}</TableCell>
                        <TableCell>
                          {profile.profile_completed ? "completed" : "incomplete"}
                        </TableCell>
                        <TableCell className="text-right">
                          <Button variant="outline" size="sm" onClick={() => openEditor(profile)}>
                            Edit
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
        <DialogContent className="max-w-xl">
          <DialogHeader>
            <DialogTitle>Edit Agent Profile</DialogTitle>
            <DialogDescription>Update profile details for the agent.</DialogDescription>
          </DialogHeader>

          <div className="space-y-3">
            <div className="space-y-2">
              <Label>Name</Label>
              <Input
                value={formState.name}
                onChange={(e) => setFormState({ ...formState, name: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label>Email</Label>
              <Input
                value={formState.email}
                onChange={(e) => setFormState({ ...formState, email: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label>Phone</Label>
              <Input
                value={formState.phone}
                onChange={(e) => setFormState({ ...formState, phone: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label>Specialization</Label>
              <Input
                value={formState.specialization}
                onChange={(e) =>
                  setFormState({ ...formState, specialization: e.target.value })
                }
              />
            </div>
            <div className="space-y-2">
              <Label>Bio</Label>
              <Textarea
                value={formState.bio}
                onChange={(e) => setFormState({ ...formState, bio: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label>Service Areas (comma-separated)</Label>
              <Input
                value={formState.service_areas}
                onChange={(e) => setFormState({ ...formState, service_areas: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label>WhatsApp</Label>
              <Input
                value={formState.whatsapp}
                onChange={(e) => setFormState({ ...formState, whatsapp: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label>LinkedIn</Label>
              <Input
                value={formState.linkedin}
                onChange={(e) => setFormState({ ...formState, linkedin: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label>Instagram</Label>
              <Input
                value={formState.instagram}
                onChange={(e) => setFormState({ ...formState, instagram: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label>Profile Image URL</Label>
              <Input
                value={formState.profile_image}
                onChange={(e) => setFormState({ ...formState, profile_image: e.target.value })}
              />
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setIsEditOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleSave}>Save</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
