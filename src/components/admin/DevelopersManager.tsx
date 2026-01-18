"use client";

import { useMemo, useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Plus, Search, Trash2, Edit } from "lucide-react";
import BulkCsvUpload from "@/components/admin/BulkCsvUpload";
import { slugify } from "@/utils/seoUrlGenerator";
import { useAuth } from "@/contexts/AuthContext";

interface DeveloperRow {
  id: string;
  developer_name: string;
  url_slug: string;
  website_url: string | null;
  logo_url: string | null;
  seo_title: string | null;
  meta_description: string | null;
  is_published: boolean | null;
}

const emptyForm = {
  developer_name: "",
  url_slug: "",
  website_url: "",
  logo_url: "",
  seo_title: "",
  meta_description: "",
  is_published: true,
  additional_json: "",
};

export function DevelopersManager() {
  const { toast } = useToast();
  const { isOwner } = useAuth();
  const [developers, setDevelopers] = useState<DeveloperRow[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [hasSearched, setHasSearched] = useState(false);
  const [formState, setFormState] = useState({ ...emptyForm });

  const filtered = useMemo(() => {
    const query = searchQuery.toLowerCase();
    return developers.filter(
      (item) =>
        item.developer_name.toLowerCase().includes(query) ||
        item.url_slug.toLowerCase().includes(query)
    );
  }, [developers, searchQuery]);

  const loadDevelopers = async () => {
    if (!searchQuery.trim()) {
      setDevelopers([]);
      setHasSearched(true);
      return;
    }
    const response = await fetch(`/api/admin/developers?q=${encodeURIComponent(searchQuery.trim())}`);
    const result = await response.json();
    if (!response.ok) {
      toast({ title: "Error", description: result?.error || "Failed to load developers.", variant: "destructive" });
      return;
    }
    setDevelopers((result.developers || []) as DeveloperRow[]);
    setHasSearched(true);
  };

  const handleSave = async () => {
    if (!formState.developer_name.trim()) return;

    let extraFields: Record<string, any> = {};
    if (formState.additional_json.trim()) {
      try {
        extraFields = JSON.parse(formState.additional_json);
      } catch (error) {
        toast({ title: "Error", description: "Additional JSON is invalid.", variant: "destructive" });
        return;
      }
    }

    const urlSlug = formState.url_slug || slugify(formState.developer_name);
    const seoTitle = formState.seo_title || `${formState.developer_name} Projects`;
    const metaDescription =
      formState.meta_description || `Explore ${formState.developer_name} projects and listings.`;

    const payload = {
      developer_name: formState.developer_name,
      url_slug: urlSlug,
      website_url: formState.website_url || null,
      logo_url: formState.logo_url || null,
      seo_title: seoTitle,
      meta_description: metaDescription,
      is_published: formState.is_published,
      ...extraFields,
    };

    if (editingId) {
      const response = await fetch(`/api/admin/developers/${editingId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const result = await response.json();
      if (!response.ok) {
        toast({ title: "Error", description: result?.error || "Failed to update developer.", variant: "destructive" });
        return;
      }
      toast({ title: "Updated", description: "Developer updated." });
    } else {
      const response = await fetch("/api/admin/developers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const result = await response.json();
      if (!response.ok) {
        toast({ title: "Error", description: result?.error || "Failed to add developer.", variant: "destructive" });
        return;
      }
      toast({ title: "Added", description: "Developer created." });
    }

    setIsDialogOpen(false);
    setEditingId(null);
    setFormState({ ...emptyForm });
    loadDevelopers();
  };

  const handleDelete = async (id: string) => {
    if (!isOwner) {
      toast({ title: "Not allowed", description: "Only owner can delete.", variant: "destructive" });
      return;
    }
    if (!confirm("Delete this developer?")) return;
    const response = await fetch(`/api/admin/developers/${id}`, { method: "DELETE" });
    const result = await response.json();
    if (!response.ok) {
      toast({ title: "Error", description: result?.error || "Failed to delete developer.", variant: "destructive" });
      return;
    }
    setDevelopers((prev) => prev.filter((item) => item.id !== id));
  };

  const handleBulkUpload = async (rows: Record<string, string>[]) => {
    const payload = rows
      .filter((row) => row.developer_name)
      .map((row) => ({
        developer_name: row.developer_name,
        url_slug: row.url_slug || slugify(row.developer_name),
        website_url: row.website_url || null,
        logo_url: row.logo_url || null,
        seo_title: row.seo_title || `${row.developer_name} Projects`,
        meta_description:
          row.meta_description || `Explore ${row.developer_name} projects and listings.`,
        is_published: row.is_published ? row.is_published.toLowerCase() === "true" : true,
      }));

    if (!payload.length) {
      return { successCount: 0, errorCount: rows.length, errorMessage: "No valid rows." };
    }

    const response = await fetch("/api/admin/developers", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ items: payload }),
    });
    const result = await response.json();
    if (!response.ok) {
      return { successCount: 0, errorCount: payload.length, errorMessage: result?.error || "Upload failed." };
    }
    await loadDevelopers();
    return { successCount: payload.length, errorCount: 0 };
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Developers</h2>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => setEditingId(null)}>
              <Plus className="mr-2 h-4 w-4" />
              Add Developer
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>{editingId ? "Edit Developer" : "Add Developer"}</DialogTitle>
            </DialogHeader>
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label>Developer Name</Label>
                <Input
                  value={formState.developer_name}
                  onChange={(e) => setFormState({ ...formState, developer_name: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>URL Slug</Label>
                <Input value={formState.url_slug} onChange={(e) => setFormState({ ...formState, url_slug: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label>Website URL</Label>
                <Input value={formState.website_url} onChange={(e) => setFormState({ ...formState, website_url: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label>Logo URL</Label>
                <Input value={formState.logo_url} onChange={(e) => setFormState({ ...formState, logo_url: e.target.value })} />
              </div>
              <div className="space-y-2 md:col-span-2">
                <Label>SEO Title</Label>
                <Input value={formState.seo_title} onChange={(e) => setFormState({ ...formState, seo_title: e.target.value })} />
              </div>
              <div className="space-y-2 md:col-span-2">
                <Label>Meta Description</Label>
                <Input
                  value={formState.meta_description}
                  onChange={(e) => setFormState({ ...formState, meta_description: e.target.value })}
                />
              </div>
              <div className="space-y-2 md:col-span-2">
                <Label>Additional Fields (JSON)</Label>
                <Input
                  value={formState.additional_json}
                  onChange={(e) => setFormState({ ...formState, additional_json: e.target.value })}
                />
              </div>
              <div className="flex items-center gap-3">
                <Switch
                  checked={formState.is_published}
                  onCheckedChange={(value) => setFormState({ ...formState, is_published: value })}
                />
                <span className="text-sm text-muted-foreground">Published</span>
              </div>
            </div>
            <div className="flex justify-end">
              <Button onClick={handleSave}>{editingId ? "Update" : "Create"}</Button>
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
                placeholder="Search developers..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            <Button variant="outline" onClick={loadDevelopers}>
              Search
            </Button>
          </div>

          <BulkCsvUpload
            label="Developers Bulk Upload"
            templateHeaders={[
              "developer_name",
              "url_slug",
              "website_url",
              "logo_url",
              "seo_title",
              "meta_description",
              "is_published",
            ]}
            onUpload={handleBulkUpload}
          />

          {hasSearched && (
            <div className="border rounded-lg">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Developer</TableHead>
                  <TableHead>Slug</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={4} className="text-center text-muted-foreground py-8">
                      No developers found.
                    </TableCell>
                  </TableRow>
                ) : (
                  filtered.map((row) => (
                    <TableRow key={row.id}>
                      <TableCell className="font-medium">{row.developer_name}</TableCell>
                      <TableCell>{row.url_slug}</TableCell>
                      <TableCell>
                        <Badge variant="outline">{row.is_published ? "published" : "draft"}</Badge>
                      </TableCell>
                      <TableCell className="space-x-2">
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => {
                            setEditingId(row.id);
                            setFormState({
                              developer_name: row.developer_name || "",
                              url_slug: row.url_slug || "",
                              website_url: row.website_url || "",
                              logo_url: row.logo_url || "",
                              seo_title: row.seo_title || "",
                              meta_description: row.meta_description || "",
                              is_published: row.is_published ?? true,
                              additional_json: "",
                            });
                            setIsDialogOpen(true);
                          }}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        {isOwner && (
                          <Button size="sm" variant="ghost" onClick={() => handleDelete(row.id)}>
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




