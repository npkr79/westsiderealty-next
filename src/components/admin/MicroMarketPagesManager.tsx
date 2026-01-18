"use client";

import { useEffect, useMemo, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Search, Trash2, Edit } from "lucide-react";
import BulkCsvUpload from "@/components/admin/BulkCsvUpload";
import { slugify } from "@/utils/seoUrlGenerator";
import { useAuth } from "@/contexts/AuthContext";

interface MicroMarketRow {
  id: string;
  micro_market_name: string;
  url_slug: string;
  city_id: string;
  status: string | null;
  seo_title: string | null;
  meta_description: string | null;
  h1_title: string | null;
  hero_hook: string | null;
}

interface CityRow {
  id: string;
  city_name: string;
  url_slug: string;
}

const emptyForm = {
  micro_market_name: "",
  url_slug: "",
  city_id: "",
  status: "published",
  seo_title: "",
  meta_description: "",
  h1_title: "",
  hero_hook: "",
  additional_json: "",
};

export function MicroMarketPagesManager() {
  const supabase = createClient();
  const { toast } = useToast();
  const { isOwner } = useAuth();
  const [markets, setMarkets] = useState<MicroMarketRow[]>([]);
  const [cities, setCities] = useState<CityRow[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [hasSearched, setHasSearched] = useState(false);
  const [formState, setFormState] = useState({ ...emptyForm });

  const filtered = useMemo(() => {
    const query = searchQuery.toLowerCase();
    return markets.filter(
      (item) =>
        item.micro_market_name.toLowerCase().includes(query) ||
        item.url_slug.toLowerCase().includes(query)
    );
  }, [markets, searchQuery]);

  const loadMarkets = async () => {
    if (!searchQuery.trim()) {
      setMarkets([]);
      setHasSearched(true);
      return;
    }
    const { data, error } = await supabase
      .from("micro_markets")
      .select("id, micro_market_name, url_slug, city_id, status, seo_title, meta_description, h1_title, hero_hook")
      .ilike("micro_market_name", `%${searchQuery.trim()}%`)
      .limit(50);
    if (error) {
      toast({ title: "Error", description: "Failed to load micro markets.", variant: "destructive" });
      return;
    }
    setMarkets((data || []) as MicroMarketRow[]);
    setHasSearched(true);
  };

  const loadCities = async () => {
    const { data, error } = await supabase.from("cities").select("id, city_name, url_slug");
    if (!error) setCities((data || []) as CityRow[]);
  };

  useEffect(() => {
    loadCities();
  }, []);

  const handleSave = async () => {
    if (!formState.micro_market_name || !formState.city_id) return;

    let extraFields: Record<string, any> = {};
    if (formState.additional_json.trim()) {
      try {
        extraFields = JSON.parse(formState.additional_json);
      } catch (error) {
        toast({ title: "Error", description: "Additional JSON is invalid.", variant: "destructive" });
        return;
      }
    }

    const urlSlug = formState.url_slug || slugify(formState.micro_market_name);
    const seoTitle = formState.seo_title || `${formState.micro_market_name} Real Estate`;
    const metaDescription =
      formState.meta_description || `Explore ${formState.micro_market_name} micro-market listings.`;
    const h1Title = formState.h1_title || `${formState.micro_market_name} Properties`;
    const heroHook = formState.hero_hook || `Discover ${formState.micro_market_name}.`;

    const payload = {
      micro_market_name: formState.micro_market_name,
      url_slug: urlSlug,
      city_id: formState.city_id,
      status: formState.status,
      seo_title: seoTitle,
      meta_description: metaDescription,
      h1_title: h1Title,
      hero_hook: heroHook,
      ...extraFields,
    };

    if (editingId) {
      const { error } = await supabase.from("micro_markets").update(payload).eq("id", editingId);
      if (error) {
        toast({ title: "Error", description: "Failed to update micro market.", variant: "destructive" });
        return;
      }
      toast({ title: "Updated", description: "Micro market updated." });
    } else {
      const { error } = await supabase.from("micro_markets").insert(payload);
      if (error) {
        toast({ title: "Error", description: "Failed to create micro market.", variant: "destructive" });
        return;
      }
      toast({ title: "Added", description: "Micro market created." });
    }

    setIsDialogOpen(false);
    setEditingId(null);
    setFormState({ ...emptyForm });
    loadMarkets();
  };

  const handleDelete = async (id: string) => {
    if (!isOwner) {
      toast({ title: "Not allowed", description: "Only owner can delete.", variant: "destructive" });
      return;
    }
    if (!confirm("Delete this micro market?")) return;
    const { error } = await supabase.from("micro_markets").delete().eq("id", id);
    if (error) {
      toast({ title: "Error", description: "Failed to delete micro market.", variant: "destructive" });
      return;
    }
    setMarkets((prev) => prev.filter((item) => item.id !== id));
  };

  const handleBulkUpload = async (rows: Record<string, string>[]) => {
    const payload = rows
      .filter((row) => row.micro_market_name && row.city_slug)
      .map((row) => {
        const city = cities.find((item) => item.url_slug === row.city_slug);
        if (!city) return null;
        const urlSlug = row.url_slug || slugify(row.micro_market_name);
        return {
          micro_market_name: row.micro_market_name,
          url_slug: urlSlug,
          city_id: city.id,
          status: row.status || "published",
          seo_title: row.seo_title || `${row.micro_market_name} Real Estate`,
          meta_description:
            row.meta_description || `Explore ${row.micro_market_name} micro-market listings.`,
          h1_title: row.h1_title || `${row.micro_market_name} Properties`,
          hero_hook: row.hero_hook || `Discover ${row.micro_market_name}.`,
        };
      })
      .filter(Boolean);

    if (!payload.length) {
      return { successCount: 0, errorCount: rows.length, errorMessage: "No valid rows." };
    }

    const { error } = await supabase.from("micro_markets").insert(payload as any[]);
    if (error) {
      return { successCount: 0, errorCount: payload.length, errorMessage: error.message };
    }
    await loadMarkets();
    return { successCount: payload.length, errorCount: 0 };
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Micro Markets</h2>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => setEditingId(null)}>
              <Plus className="mr-2 h-4 w-4" />
              Add Micro Market
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>{editingId ? "Edit Micro Market" : "Add Micro Market"}</DialogTitle>
            </DialogHeader>
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label>Name</Label>
                <Input
                  value={formState.micro_market_name}
                  onChange={(e) => setFormState({ ...formState, micro_market_name: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>Slug</Label>
                <Input value={formState.url_slug} onChange={(e) => setFormState({ ...formState, url_slug: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label>City</Label>
                <Select value={formState.city_id} onValueChange={(value) => setFormState({ ...formState, city_id: value })}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select city" />
                  </SelectTrigger>
                  <SelectContent>
                    {cities.map((city) => (
                      <SelectItem key={city.id} value={city.id}>
                        {city.city_name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Status</Label>
                <Select value={formState.status} onValueChange={(value) => setFormState({ ...formState, status: value })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="published">published</SelectItem>
                    <SelectItem value="draft">draft</SelectItem>
                  </SelectContent>
                </Select>
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
                <Label>H1 Title</Label>
                <Input value={formState.h1_title} onChange={(e) => setFormState({ ...formState, h1_title: e.target.value })} />
              </div>
              <div className="space-y-2 md:col-span-2">
                <Label>Hero Hook</Label>
                <Input value={formState.hero_hook} onChange={(e) => setFormState({ ...formState, hero_hook: e.target.value })} />
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
                placeholder="Search micro markets..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            <Button variant="outline" onClick={loadMarkets}>
              Search
            </Button>
          </div>

          <BulkCsvUpload
            label="Micro Markets Bulk Upload"
            templateHeaders={[
              "micro_market_name",
              "url_slug",
              "city_slug",
              "status",
              "seo_title",
              "meta_description",
              "h1_title",
              "hero_hook",
            ]}
            onUpload={handleBulkUpload}
          />

          {hasSearched && (
            <div className="border rounded-lg">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Slug</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={4} className="text-center text-muted-foreground py-8">
                      No micro markets found.
                    </TableCell>
                  </TableRow>
                ) : (
                  filtered.map((row) => (
                    <TableRow key={row.id}>
                      <TableCell className="font-medium">{row.micro_market_name}</TableCell>
                      <TableCell>{row.url_slug}</TableCell>
                      <TableCell>
                        <Badge variant="outline">{row.status || "draft"}</Badge>
                      </TableCell>
                      <TableCell className="space-x-2">
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => {
                            setEditingId(row.id);
                            setFormState({
                              micro_market_name: row.micro_market_name,
                              url_slug: row.url_slug,
                              city_id: row.city_id,
                              status: row.status || "published",
                              seo_title: row.seo_title || "",
                              meta_description: row.meta_description || "",
                              h1_title: row.h1_title || "",
                              hero_hook: row.hero_hook || "",
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




