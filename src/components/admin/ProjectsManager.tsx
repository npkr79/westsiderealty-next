"use client";

import { useMemo, useState } from "react";
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
import { useAuth } from "@/contexts/AuthContext";

interface ProjectRow {
  id: string;
  project_name: string;
  url_slug: string | null;
  city_id: string | null;
  micro_market_id: string | null;
  developer_id: string | null;
  status: string | null;
  seo_title: string | null;
  meta_description: string | null;
  project_overview_seo: string | null;
}

export function ProjectsManager() {
  const { toast } = useToast();
  const { isOwner } = useAuth();
  const [projects, setProjects] = useState<ProjectRow[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editing, setEditing] = useState<ProjectRow | null>(null);
  const [hasSearched, setHasSearched] = useState(false);
  const [formState, setFormState] = useState({
    project_name: "",
    url_slug: "",
    city_id: "",
    micro_market_id: "",
    developer_id: "",
    status: "published",
    seo_title: "",
    meta_description: "",
    project_overview_seo: "",
    additional_json: "",
  });

  const filtered = useMemo(() => {
    const query = searchQuery.toLowerCase();
    return projects.filter((item) => item.project_name.toLowerCase().includes(query));
  }, [projects, searchQuery]);

  const loadProjects = async () => {
    if (!searchQuery.trim()) {
      setProjects([]);
      setHasSearched(true);
      return;
    }

    const response = await fetch(`/api/admin/projects?q=${encodeURIComponent(searchQuery.trim())}`);
    const result = await response.json();
    if (!response.ok) {
      toast({ title: "Error", description: result?.error || "Failed to load projects.", variant: "destructive" });
      return;
    }
    setProjects((result.projects || []) as ProjectRow[]);
    setHasSearched(true);
  };

  const handleSave = async () => {
    if (!formState.project_name.trim()) return;

    let extraFields: Record<string, any> = {};
    if (formState.additional_json.trim()) {
      try {
        extraFields = JSON.parse(formState.additional_json);
      } catch (error) {
        toast({ title: "Error", description: "Additional JSON is invalid.", variant: "destructive" });
        return;
      }
    }

    const payload = {
      project_name: formState.project_name.trim(),
      url_slug: formState.url_slug || null,
      city_id: formState.city_id || null,
      micro_market_id: formState.micro_market_id || null,
      developer_id: formState.developer_id || null,
      status: formState.status || null,
      seo_title: formState.seo_title || null,
      meta_description: formState.meta_description || null,
      project_overview_seo: formState.project_overview_seo || null,
      ...extraFields,
    };

    if (editing) {
      const response = await fetch(`/api/admin/projects/${editing.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const result = await response.json();
      if (!response.ok) {
        toast({ title: "Error", description: result?.error || "Failed to update project.", variant: "destructive" });
        return;
      }
      toast({ title: "Updated", description: "Project updated." });
    } else {
      const response = await fetch("/api/admin/projects", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const result = await response.json();
      if (!response.ok) {
        toast({ title: "Error", description: result?.error || "Failed to add project.", variant: "destructive" });
        return;
      }
      toast({ title: "Added", description: "Project created." });
    }

    setIsDialogOpen(false);
    setEditing(null);
    setFormState({
      project_name: "",
      url_slug: "",
      city_id: "",
      micro_market_id: "",
      developer_id: "",
      status: "published",
      seo_title: "",
      meta_description: "",
      project_overview_seo: "",
      additional_json: "",
    });
    loadProjects();
  };

  const handleToggle = async (row: ProjectRow, value: boolean) => {
    const response = await fetch(`/api/admin/projects/${row.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: value ? "published" : "draft" }),
    });
    const result = await response.json();
    if (!response.ok) {
      toast({ title: "Error", description: result?.error || "Failed to update status.", variant: "destructive" });
      return;
    }
    setProjects((prev) =>
      prev.map((item) => (item.id === row.id ? { ...item, status: value ? "published" : "draft" } : item))
    );
  };

  const handleDelete = async (row: ProjectRow) => {
    if (!isOwner) {
      toast({ title: "Not allowed", description: "Only owner can delete.", variant: "destructive" });
      return;
    }
    if (!confirm(`Delete ${row.project_name}?`)) return;
    const response = await fetch(`/api/admin/projects/${row.id}`, { method: "DELETE" });
    const result = await response.json();
    if (!response.ok) {
      toast({ title: "Error", description: result?.error || "Failed to delete project.", variant: "destructive" });
      return;
    }
    setProjects((prev) => prev.filter((item) => item.id !== row.id));
  };

  const handleBulkUpload = async (rows: Record<string, string>[]) => {
    const payload = rows
      .filter((row) => row.project_name)
      .map((row) => ({
        project_name: row.project_name,
        url_slug: row.url_slug || null,
        city_id: row.city_id || null,
        micro_market_id: row.micro_market_id || null,
        developer_id: row.developer_id || null,
        status: row.status || "published",
        seo_title: row.seo_title || null,
        meta_description: row.meta_description || null,
        project_overview_seo: row.project_overview_seo || null,
      }));

    if (!payload.length) {
      return { successCount: 0, errorCount: rows.length, errorMessage: "No valid rows." };
    }

    const response = await fetch("/api/admin/projects", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ items: payload }),
    });
    const result = await response.json();
    if (!response.ok) {
      return { successCount: 0, errorCount: payload.length, errorMessage: result?.error || "Upload failed." };
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
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2 md:col-span-2">
                <Label>Project Name</Label>
                <Input value={formState.project_name} onChange={(e) => setFormState({ ...formState, project_name: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label>Slug</Label>
                <Input value={formState.url_slug} onChange={(e) => setFormState({ ...formState, url_slug: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label>Status</Label>
                <Input value={formState.status} onChange={(e) => setFormState({ ...formState, status: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label>City ID</Label>
                <Input value={formState.city_id} onChange={(e) => setFormState({ ...formState, city_id: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label>Micro Market ID</Label>
                <Input value={formState.micro_market_id} onChange={(e) => setFormState({ ...formState, micro_market_id: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label>Developer ID</Label>
                <Input value={formState.developer_id} onChange={(e) => setFormState({ ...formState, developer_id: e.target.value })} />
              </div>
              <div className="space-y-2 md:col-span-2">
                <Label>SEO Title</Label>
                <Input value={formState.seo_title} onChange={(e) => setFormState({ ...formState, seo_title: e.target.value })} />
              </div>
              <div className="space-y-2 md:col-span-2">
                <Label>Meta Description</Label>
                <Input value={formState.meta_description} onChange={(e) => setFormState({ ...formState, meta_description: e.target.value })} />
              </div>
              <div className="space-y-2 md:col-span-2">
                <Label>Project Overview</Label>
                <Input value={formState.project_overview_seo} onChange={(e) => setFormState({ ...formState, project_overview_seo: e.target.value })} />
              </div>
              <div className="space-y-2 md:col-span-2">
                <Label>Additional Fields (JSON)</Label>
                <Input value={formState.additional_json} onChange={(e) => setFormState({ ...formState, additional_json: e.target.value })} />
              </div>
              <div className="md:col-span-2 flex justify-end">
                <Button onClick={handleSave}>{editing ? "Update" : "Create"}</Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardContent className="pt-6 space-y-4">
          <div className="flex gap-2 max-w-md">
            <div className="relative flex-1">
            <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search projects..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
            </div>
            <Button variant="outline" onClick={loadProjects}>
              Search
            </Button>
          </div>

          <BulkCsvUpload
            label="Projects Bulk Upload"
            templateHeaders={[
              "project_name",
              "url_slug",
              "city_id",
              "micro_market_id",
              "developer_id",
              "status",
              "seo_title",
              "meta_description",
              "project_overview_seo",
            ]}
            onUpload={handleBulkUpload}
          />

          {hasSearched && (
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
                      <TableCell className="font-medium">{row.project_name}</TableCell>
                      <TableCell>
                        <Badge variant="outline">{row.status || "draft"}</Badge>
                      </TableCell>
                      <TableCell>
                        <Switch checked={(row.status || "draft") === "published"} onCheckedChange={(value) => handleToggle(row, value)} />
                      </TableCell>
                      <TableCell className="space-x-2">
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => {
                            setEditing(row);
                            setFormState({
                              project_name: row.project_name,
                              url_slug: row.url_slug || "",
                              city_id: row.city_id || "",
                              micro_market_id: row.micro_market_id || "",
                              developer_id: row.developer_id || "",
                              status: row.status || "published",
                              seo_title: row.seo_title || "",
                              meta_description: row.meta_description || "",
                              project_overview_seo: row.project_overview_seo || "",
                              additional_json: "",
                            });
                            setIsDialogOpen(true);
                          }}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        {isOwner && (
                          <Button size="sm" variant="ghost" onClick={() => handleDelete(row)}>
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        )}
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




