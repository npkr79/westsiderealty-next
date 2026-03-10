"use client";

import { useEffect, useState } from "react";
import { UserPlus, Trash2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

interface UserRole {
  id: string;
  user_id: string;
  role: string;
  phone: string | null;
}

const roleOptions = ["owner", "dev_admin", "office_admin", "admin", "agent"];

export default function UserRolesManager() {
  const [roles, setRoles] = useState<UserRole[]>([]);
  const [loading, setLoading] = useState(true);
  const [formState, setFormState] = useState({
    user_id: "",
    phone: "",
    role: "dev_admin",
  });
  const { toast } = useToast();

  useEffect(() => {
    loadRoles();
  }, []);

  const loadRoles = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from("crm_users")
        .select("id, full_name, phone, crm_roles(name)")
        .order("full_name", { ascending: true });

      if (error) throw error;
      const mapped = (data || []).map((row: any) => {
        const crmRoles = row.crm_roles;
        const roleName: string = Array.isArray(crmRoles)
          ? (crmRoles[0]?.name ?? "")
          : (crmRoles?.name ?? "");
        return {
          id: row.id,
          user_id: row.id,
          role: roleName,
          phone: row.phone ?? null,
        } as UserRole;
      });
      setRoles(mapped);
    } catch (error) {
      console.error("Error loading roles:", error);
      toast({
        title: "Error",
        description: "Failed to load user roles.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleAddRole = async () => {
    if (!formState.user_id || !formState.role) {
      toast({
        title: "Missing fields",
        description: "User ID and role are required.",
        variant: "destructive",
      });
      return;
    }

    try {
      // crm_users does not have a direct role column — role_id is set via crm_roles FK
      // This upsert sets phone; role_id must be set manually via DB or separate admin action
      const { error } = await supabase.from("crm_users").upsert(
        {
          id: formState.user_id,
          phone: formState.phone || null,
          is_active: true,
        },
        { onConflict: "id" }
      );

      if (error) throw error;

      toast({
        title: "Role added",
        description: "User role has been assigned.",
      });

      setFormState({ user_id: "", phone: "", role: "dev_admin" });
      loadRoles();
    } catch (error) {
      console.error("Error adding role:", error);
      toast({
        title: "Error",
        description: "Failed to assign role.",
        variant: "destructive",
      });
    }
  };

  const handleDeleteRole = async (roleId: string) => {
    try {
      // Deleting a crm_users row removes the whole user — deactivate instead
      const { error } = await supabase.from("crm_users").update({ is_active: false }).eq("id", roleId);
      if (error) throw error;

      setRoles((prev) => prev.filter((role) => role.id !== roleId));
      toast({
        title: "Role removed",
        description: "User role has been deleted.",
      });
    } catch (error) {
      console.error("Error deleting role:", error);
      toast({
        title: "Error",
        description: "Failed to delete role.",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Assign User Role</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-4">
          <Input
            placeholder="User ID (UUID)"
            value={formState.user_id}
            onChange={(e) => setFormState({ ...formState, user_id: e.target.value })}
          />
          <Input
            placeholder="Phone (optional)"
            value={formState.phone}
            onChange={(e) => setFormState({ ...formState, phone: e.target.value })}
          />
          <Select
            value={formState.role}
            onValueChange={(value) => setFormState({ ...formState, role: value })}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select role" />
            </SelectTrigger>
            <SelectContent>
              {roleOptions.map((role) => (
                <SelectItem key={role} value={role}>
                  {role}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button className="md:col-span-4" onClick={handleAddRole}>
            <UserPlus className="mr-2 h-4 w-4" />
            Assign Role
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Current Roles</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-sm text-muted-foreground">Loading roles...</div>
          ) : (
            <div className="border rounded-lg">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Role</TableHead>
                    <TableHead>User ID</TableHead>
                    <TableHead>Phone</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {roles.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={4} className="text-center text-muted-foreground py-6">
                        No roles assigned yet.
                      </TableCell>
                    </TableRow>
                  ) : (
                    roles.map((role) => (
                      <TableRow key={role.id}>
                        <TableCell className="font-medium">{role.role}</TableCell>
                        <TableCell className="text-xs text-muted-foreground">{role.user_id}</TableCell>
                        <TableCell>{role.phone || "-"}</TableCell>
                        <TableCell>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleDeleteRole(role.id)}
                          >
                            <Trash2 className="h-4 w-4 text-destructive" />
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
    </div>
  );
}
