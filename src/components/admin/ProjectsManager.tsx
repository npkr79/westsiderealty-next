"use client";

import { useEffect, useMemo, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Plus, Search, Trash2, Edit } from "lucide-react";
import BulkCsvUpload from "@/components/admin/BulkCsvUpload";

interface ProjectRow {
  id: string;
  name: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export function ProjectsManager() {
  const supabase = createClient();
  const { toast } = useToast();
  const [projects, setProjects] = useState<ProjectRow[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editing, setEditing] = useState<ProjectRow | null>(null);
  const [projectName, setProjectName] = useState("");

  const filtered = useMemo(() => {
    const query = searchQuery.toLowerCase();
    return projects.filter((item) => item.name.toLowerCase().includes(query));
  }, [projects, searchQuery]);

  const loadProjects = async () => {
    const { data, error } = await supabase
      .from("hyderabad_project_names")
      .select("*")
      .order("name", { ascending: true });
    if (error) {
      toast({ title: "Error", description: "Failed to load projects.", variant: "destructive" });
      return;
    }
    setProjects((data || []) as ProjectRow[]);
  };

  useEffect(() => {
    loadProjects();
  }, []);

  const handleSave = async () => {
    if (!projectName.trim()) return;

    if (editing) {
      const { error } = await supabase
        .from("hyderabad_project_names")
        .update({ name: projectName.trim(), updated_at: new Date().toISOString() })
        .eq("id", editing.id);
      if (error) {
        toast({ title: "Error", description: "Failed to update project.", variant: "destructive" });
        return;
      }
      toast({ title: "Updated", description: "Project updated." });
    } else {
      const { error } = await supabase
        .from("hyderabad_project_names")
        .insert({ name: projectName.trim(), is_active: true });
      if (error) {
        toast({ title: "Error", description: "Failed to add project.", variant: "destructive" });
        return;
      }
      toast({ title: "Added", description: "Project created." });
    }

    setIsDialogOpen(false);
    setEditing(null);
    setProjectName("");
    loadProjects();
  };

  const handleToggle = async (row: ProjectRow, value: boolean) => {
    const { error } = await supabase
      .from("hyderabad_project_names")
      .update({ is_active: value, updated_at: new Date().toISOString() })
      .eq("id", row.id);
    if (error) {
      toast({ title: "Error", description: "Failed to update status.", variant: "destructive" });
      return;
    }
    setProjects((prev) =>
      prev.map((item) => (item.id === row.id ? { ...item, is_active: value } : item))
    );
  };

  const handleDelete = async (row: ProjectRow) => {
    if (!confirm(`Delete ${row.name}?`)) return;
    const { error } = await supabase.from("hyderabad_project_names").delete().eq("id", row.id);
    if (error) {
      toast({ title: "Error", description: "Failed to delete project.", variant: "destructive" });
      return;
    }
    setProjects((prev) => prev.filter((item) => item.id !== row.id));
  };

  const handleBulkUpload = async (rows: Record<string, string>[]) => {
    const payload = rows
      .filter((row) => row.name)
      .map((row) => ({
        name: row.name,
        is_active: row.is_active ? row.is_active.toLowerCase() === "true" : true,
      }));

    if (!payload.length) {
      return { successCount: 0, errorCount: rows.length, errorMessage: "No valid rows." };
    }

    const { error } = await supabase.from("hyderabad_project_names").insert(payload);
    if (error) {
      return { successCount: 0, errorCount: payload.length, errorMessage: error.message };
    }
    await loadProjects();
    return { successCount: payload.length, errorCount: 0 };
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Projects</h2>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => setEditing(null)}>
              <Plus className="mr-2 h-4 w-4" />
              Add Project
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{editing ? "Edit Project" : "Add Project"}</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Project Name</Label>
                <Input value={projectName} onChange={(e) => setProjectName(e.target.value)} />
              </div>
              <Button onClick={handleSave}>{editing ? "Update" : "Create"}</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardContent className="pt-6 space-y-4">
          <div className="relative max-w-md">
            <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search projects..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>

          <BulkCsvUpload
            label="Projects Bulk Upload"
            templateHeaders={["name", "is_active"]}
            onUpload={handleBulkUpload}
          />

          <div className="border rounded-lg">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Project</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Active</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={4} className="text-center text-muted-foreground py-8">
                      No projects found.
                    </TableCell>
                  </TableRow>
                ) : (
                  filtered.map((row) => (
                    <TableRow key={row.id}>
                      <TableCell className="font-medium">{row.name}</TableCell>
                      <TableCell>
                        <Badge variant="outline">{row.is_active ? "active" : "inactive"}</Badge>
                      </TableCell>
                      <TableCell>
                        <Switch checked={row.is_active} onCheckedChange={(value) => handleToggle(row, value)} />
                      </TableCell>
                      <TableCell className="space-x-2">
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => {
                            setEditing(row);
                            setProjectName(row.name);
                            setIsDialogOpen(true);
                          }}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button size="sm" variant="ghost" onClick={() => handleDelete(row)}>
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}




