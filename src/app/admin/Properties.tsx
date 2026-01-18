"use client";

import { useMemo, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Search, Trash2, Edit } from "lucide-react";
import BulkCsvUpload from "@/components/admin/BulkCsvUpload";
import { slugify, ensureUniqueSlug } from "@/utils/seoUrlGenerator";
import { useAuth } from "@/contexts/AuthContext";

interface PropertyRow {
  id: string;
  title: string;
  location: string;
  micro_market: string | null;
  price: number | null;
  price_display: string | null;
  bhk_config: string | null;
  area_sqft: number | null;
  status: string | null;
  property_type: string | null;
  project_name: string | null;
  developer_name: string | null;
  main_image_url: string | null;
  updated_at: string | null;
}

const statusOptions = ["active", "inactive", "draft", "published"];

const emptyForm = {
  title: "",
  location: "",
  micro_market: "",
  price_display: "",
  price: "",
  bhk_config: "",
  area_sqft: "",
  status: "active",
  property_type: "",
  project_name: "",
  developer_name: "",
  main_image_url: "",
  additional_json: "",
};

export default function Properties() {
  const supabase = createClient();
  const { toast } = useToast();
  const { isOwner } = useAuth();
  const [searchQuery, setSearchQuery] = useState("");
  const [properties, setProperties] = useState<PropertyRow[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [hasSearched, setHasSearched] = useState(false);
  const [formState, setFormState] = useState({ ...emptyForm });

  const filtered = useMemo(() => {
    const query = searchQuery.toLowerCase();
    return properties.filter(
      (item) =>
        item.title.toLowerCase().includes(query) ||
        item.location.toLowerCase().includes(query) ||
        (item.micro_market || "").toLowerCase().includes(query)
    );
  }, [properties, searchQuery]);

  const loadProperties = async () => {
    setIsLoading(true);
    if (!searchQuery.trim()) {
      setProperties([]);
      setHasSearched(true);
      setIsLoading(false);
      return;
    }
    const { data, error } = await supabase
      .from("hyderabad_properties")
      .select(
        "id, title, location, micro_market, price, price_display, bhk_config, area_sqft, status, property_type, project_name, developer_name, main_image_url, updated_at"
      )
      .or(`title.ilike.%${searchQuery.trim()}%,location.ilike.%${searchQuery.trim()}%,micro_market.ilike.%${searchQuery.trim()}%`)
      .limit(50);

    if (error) {
      toast({ title: "Error", description: "Failed to load properties.", variant: "destructive" });
      setIsLoading(false);
      return;
    }

    setProperties((data || []) as PropertyRow[]);
    setIsLoading(false);
    setHasSearched(true);
  };

  const openForEdit = (row: PropertyRow) => {
    setEditingId(row.id);
    setFormState({
      title: row.title || "",
      location: row.location || "",
      micro_market: row.micro_market || "",
      price_display: row.price_display || "",
      price: row.price ? String(row.price) : "",
      bhk_config: row.bhk_config || "",
      area_sqft: row.area_sqft ? String(row.area_sqft) : "",
      status: row.status || "active",
      property_type: row.property_type || "",
      project_name: row.project_name || "",
      developer_name: row.developer_name || "",
      main_image_url: row.main_image_url || "",
      additional_json: "",
    });
    setIsDialogOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (!isOwner) {
      toast({ title: "Not allowed", description: "Only owner can delete.", variant: "destructive" });
      return;
    }
    if (!confirm("Delete this property?")) return;
    const { error } = await supabase.from("hyderabad_properties").delete().eq("id", id);
    if (error) {
      toast({ title: "Error", description: "Failed to delete.", variant: "destructive" });
      return;
    }
    setProperties((prev) => prev.filter((item) => item.id !== id));
  };

  const handleSave = async () => {
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
      title: formState.title,
      location: formState.location,
      micro_market: formState.micro_market || null,
      price_display: formState.price_display || null,
      price: formState.price ? Number(formState.price) : null,
      bhk_config: formState.bhk_config || null,
      area_sqft: formState.area_sqft ? Number(formState.area_sqft) : null,
      status: formState.status,
      property_type: formState.property_type || null,
      project_name: formState.project_name || null,
      developer_name: formState.developer_name || null,
      main_image_url: formState.main_image_url || null,
      ...extraFields,
    };

    if (editingId) {
      const { error } = await supabase
        .from("hyderabad_properties")
        .update(payload)
        .eq("id", editingId);
      if (error) {
        toast({ title: "Error", description: "Failed to update.", variant: "destructive" });
        return;
      }
      toast({ title: "Updated", description: "Property updated." });
    } else {
      const { data: existingSlugs } = await supabase
        .from("hyderabad_properties")
        .select("seo_slug, slug");
      const slugs =
        existingSlugs?.map((item: any) => item.seo_slug || item.slug).filter(Boolean) || [];
      let baseSlug = slugify(formState.title);
      const locationSlug = slugify(formState.location);
      if (!baseSlug.includes(locationSlug)) {
        baseSlug += `-${locationSlug}`;
      }
      const uniqueSlug = ensureUniqueSlug(baseSlug, slugs);

      const insertPayload = {
        ...payload,
        slug: uniqueSlug,
        seo_slug: uniqueSlug,
        agent_id: "11111111-1111-1111-1111-111111111111",
        image_gallery: payload.main_image_url ? [payload.main_image_url] : [],
        ownership_type: "Freehold",
      };

      const { error } = await supabase.from("hyderabad_properties").insert([insertPayload]);
      if (error) {
        toast({ title: "Error", description: "Failed to add property.", variant: "destructive" });
        return;
      }
      toast({ title: "Added", description: "Property created." });
    }

    setIsDialogOpen(false);
    setEditingId(null);
    setFormState({ ...emptyForm });
    loadProperties();
  };

  const handleBulkUpload = async (rows: Record<string, string>[]) => {
    const { data: existingSlugs } = await supabase
      .from("hyderabad_properties")
      .select("seo_slug, slug");
    const slugs =
      existingSlugs?.map((item: any) => item.seo_slug || item.slug).filter(Boolean) || [];

    const payload = rows
      .filter((row) => row.title && row.location)
      .map((row, index) => {
        let baseSlug = slugify(row.title);
        const locationSlug = slugify(row.location);
        if (!baseSlug.includes(locationSlug)) {
          baseSlug += `-${locationSlug}`;
        }
        const uniqueSlug = ensureUniqueSlug(`${baseSlug}-${index + 1}`, slugs);
        slugs.push(uniqueSlug);
        return {
          title: row.title,
          location: row.location,
          micro_market: row.micro_market || null,
          price_display: row.price_display || null,
          price: row.price ? Number(row.price) : null,
          bhk_config: row.bhk_config || null,
          area_sqft: row.area_sqft ? Number(row.area_sqft) : null,
          status: row.status || "active",
          property_type: row.property_type || null,
          project_name: row.project_name || null,
          developer_name: row.developer_name || null,
          main_image_url: row.main_image_url || null,
          slug: uniqueSlug,
          seo_slug: uniqueSlug,
          agent_id: "11111111-1111-1111-1111-111111111111",
          image_gallery: row.main_image_url ? [row.main_image_url] : [],
          ownership_type: "Freehold",
        };
      });

    if (!payload.length) {
      return { successCount: 0, errorCount: rows.length, errorMessage: "No valid rows." };
    }

    const { error } = await supabase.from("hyderabad_properties").insert(payload);
    if (error) {
      return { successCount: 0, errorCount: payload.length, errorMessage: error.message };
    }

    await loadProperties();
    return { successCount: payload.length, errorCount: 0 };
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Properties</h2>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => setEditingId(null)}>
              <Plus className="mr-2 h-4 w-4" />
              Add Property
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>{editingId ? "Edit Property" : "Add Property"}</DialogTitle>
            </DialogHeader>
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label>Title</Label>
                <Input value={formState.title} onChange={(e) => setFormState({ ...formState, title: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label>Location</Label>
                <Input value={formState.location} onChange={(e) => setFormState({ ...formState, location: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label>Micro Market</Label>
                <Input value={formState.micro_market} onChange={(e) => setFormState({ ...formState, micro_market: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label>Status</Label>
                <Select value={formState.status} onValueChange={(value) => setFormState({ ...formState, status: value })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {statusOptions.map((option) => (
                      <SelectItem key={option} value={option}>
                        {option}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Price (numeric)</Label>
                <Input value={formState.price} onChange={(e) => setFormState({ ...formState, price: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label>Price Display</Label>
                <Input value={formState.price_display} onChange={(e) => setFormState({ ...formState, price_display: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label>BHK Config</Label>
                <Input value={formState.bhk_config} onChange={(e) => setFormState({ ...formState, bhk_config: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label>Area (sqft)</Label>
                <Input value={formState.area_sqft} onChange={(e) => setFormState({ ...formState, area_sqft: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label>Property Type</Label>
                <Input value={formState.property_type} onChange={(e) => setFormState({ ...formState, property_type: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label>Project Name</Label>
                <Input value={formState.project_name} onChange={(e) => setFormState({ ...formState, project_name: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label>Developer Name</Label>
                <Input value={formState.developer_name} onChange={(e) => setFormState({ ...formState, developer_name: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label>Main Image URL</Label>
                <Input value={formState.main_image_url} onChange={(e) => setFormState({ ...formState, main_image_url: e.target.value })} />
              </div>
              <div className="space-y-2 md:col-span-2">
                <Label>Additional Fields (JSON)</Label>
                <Input
                  value={formState.additional_json}
                  onChange={(e) => setFormState({ ...formState, additional_json: e.target.value })}
                />
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
                placeholder="Search properties..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            <Button variant="outline" onClick={loadProperties}>
              Search
            </Button>
          </div>

          <BulkCsvUpload
            label="Properties Bulk Upload"
            templateHeaders={[
              "title",
              "location",
              "micro_market",
              "price",
              "price_display",
              "bhk_config",
              "area_sqft",
              "status",
              "property_type",
              "project_name",
              "developer_name",
              "main_image_url",
            ]}
            onUpload={handleBulkUpload}
          />

          {isLoading ? (
            <div className="text-sm text-muted-foreground">Loading properties...</div>
          ) : hasSearched ? (
            <div className="border rounded-lg">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Title</TableHead>
                    <TableHead>Location</TableHead>
                    <TableHead>Price</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center text-muted-foreground py-8">
                        No properties found.
                      </TableCell>
                    </TableRow>
                  ) : (
                    filtered.map((item) => (
                      <TableRow key={item.id}>
                        <TableCell className="font-medium">{item.title}</TableCell>
                        <TableCell>{item.location}</TableCell>
                        <TableCell>{item.price_display || item.price || "-"}</TableCell>
                        <TableCell>
                          <Badge variant="outline">{item.status || "active"}</Badge>
                        </TableCell>
                        <TableCell className="space-x-2">
                          <Button size="sm" variant="ghost" onClick={() => openForEdit(item)}>
                            <Edit className="h-4 w-4" />
                          </Button>
                        {isOwner && (
                          <Button size="sm" variant="ghost" onClick={() => handleDelete(item.id)}>
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
          ) : null}
        </CardContent>
      </Card>
    </div>
  );
}




