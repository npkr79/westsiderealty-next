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
import { Textarea } from "@/components/ui/textarea";
import { Plus, Search, Trash2, Edit } from "lucide-react";
import { slugify } from "@/utils/seoUrlGenerator";

interface BlogRow {
  id: string;
  title: string;
  slug: string;
  description: string | null;
  content: string | null;
  date: string | null;
  status: string | null;
  category: string | null;
  author: string | null;
  image_url: string | null;
  read_time: string | null;
  seo_title: string | null;
  seo_description: string | null;
}

const emptyForm = {
  title: "",
  description: "",
  content: "",
  status: "draft",
  category: "",
  author: "",
  image_url: "",
  read_time: "",
  seo_title: "",
  seo_description: "",
};

export default function BlogManagement() {
  const supabase = createClient();
  const { toast } = useToast();
  const [articles, setArticles] = useState<BlogRow[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formState, setFormState] = useState({ ...emptyForm });

  const filtered = useMemo(() => {
    const query = searchQuery.toLowerCase();
    return articles.filter(
      (item) =>
        item.title.toLowerCase().includes(query) ||
        item.slug.toLowerCase().includes(query)
    );
  }, [articles, searchQuery]);

  const loadArticles = async () => {
    const { data, error } = await supabase
      .from("blog_articles")
      .select(
        "id, title, slug, description, content, date, status, category, author, image_url, read_time, seo_title, seo_description"
      )
      .order("date", { ascending: false });
    if (error) {
      toast({ title: "Error", description: "Failed to load articles.", variant: "destructive" });
      return;
    }
    setArticles((data || []) as BlogRow[]);
  };

  useEffect(() => {
    loadArticles();
  }, []);

  const handleSave = async () => {
    if (!formState.title.trim()) return;

    const slug = slugify(formState.title);
    const payload = {
      title: formState.title,
      slug,
      description: formState.description || null,
      content: formState.content || null,
      date: new Date().toISOString(),
      status: formState.status,
      category: formState.category || null,
      author: formState.author || null,
      image_url: formState.image_url || null,
      read_time: formState.read_time || null,
      seo_title: formState.seo_title || formState.title,
      seo_description: formState.seo_description || formState.description || null,
    };

    if (editingId) {
      const { error } = await supabase.from("blog_articles").update(payload).eq("id", editingId);
      if (error) {
        toast({ title: "Error", description: "Failed to update article.", variant: "destructive" });
        return;
      }
      toast({ title: "Updated", description: "Article updated." });
    } else {
      const { error } = await supabase.from("blog_articles").insert(payload);
      if (error) {
        toast({ title: "Error", description: "Failed to add article.", variant: "destructive" });
        return;
      }
      toast({ title: "Added", description: "Article created." });
    }

    setIsDialogOpen(false);
    setEditingId(null);
    setFormState({ ...emptyForm });
    loadArticles();
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this article?")) return;
    const { error } = await supabase.from("blog_articles").delete().eq("id", id);
    if (error) {
      toast({ title: "Error", description: "Failed to delete article.", variant: "destructive" });
      return;
    }
    setArticles((prev) => prev.filter((item) => item.id !== id));
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Blog Articles</h2>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => setEditingId(null)}>
              <Plus className="mr-2 h-4 w-4" />
              Add Article
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-3xl max-h-[85vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{editingId ? "Edit Article" : "Add Article"}</DialogTitle>
            </DialogHeader>
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2 md:col-span-2">
                <Label>Title</Label>
                <Input value={formState.title} onChange={(e) => setFormState({ ...formState, title: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label>Status</Label>
                <Input value={formState.status} onChange={(e) => setFormState({ ...formState, status: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label>Category</Label>
                <Input value={formState.category} onChange={(e) => setFormState({ ...formState, category: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label>Author</Label>
                <Input value={formState.author} onChange={(e) => setFormState({ ...formState, author: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label>Read Time</Label>
                <Input value={formState.read_time} onChange={(e) => setFormState({ ...formState, read_time: e.target.value })} />
              </div>
              <div className="space-y-2 md:col-span-2">
                <Label>Image URL</Label>
                <Input value={formState.image_url} onChange={(e) => setFormState({ ...formState, image_url: e.target.value })} />
              </div>
              <div className="space-y-2 md:col-span-2">
                <Label>Description</Label>
                <Textarea
                  value={formState.description}
                  onChange={(e) => setFormState({ ...formState, description: e.target.value })}
                  rows={3}
                />
              </div>
              <div className="space-y-2 md:col-span-2">
                <Label>Content</Label>
                <Textarea
                  value={formState.content}
                  onChange={(e) => setFormState({ ...formState, content: e.target.value })}
                  rows={6}
                />
              </div>
              <div className="space-y-2 md:col-span-2">
                <Label>SEO Title</Label>
                <Input value={formState.seo_title} onChange={(e) => setFormState({ ...formState, seo_title: e.target.value })} />
              </div>
              <div className="space-y-2 md:col-span-2">
                <Label>SEO Description</Label>
                <Textarea
                  value={formState.seo_description}
                  onChange={(e) => setFormState({ ...formState, seo_description: e.target.value })}
                  rows={2}
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
          <div className="relative max-w-md">
            <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search blog articles..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>

          <div className="border rounded-lg">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Title</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={4} className="text-center text-muted-foreground py-8">
                      No articles found.
                    </TableCell>
                  </TableRow>
                ) : (
                  filtered.map((row) => (
                    <TableRow key={row.id}>
                      <TableCell className="font-medium">{row.title}</TableCell>
                      <TableCell>
                        <Badge variant="outline">{row.status || "draft"}</Badge>
                      </TableCell>
                      <TableCell>{row.category || "-"}</TableCell>
                      <TableCell className="space-x-2">
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => {
                            setEditingId(row.id);
                            setFormState({
                              title: row.title,
                              description: row.description || "",
                              content: row.content || "",
                              status: row.status || "draft",
                              category: row.category || "",
                              author: row.author || "",
                              image_url: row.image_url || "",
                              read_time: row.read_time || "",
                              seo_title: row.seo_title || "",
                              seo_description: row.seo_description || "",
                            });
                            setIsDialogOpen(true);
                          }}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button size="sm" variant="ghost" onClick={() => handleDelete(row.id)}>
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




