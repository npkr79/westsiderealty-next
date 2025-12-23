"use client";

import { useState, useEffect, useRef } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { 
  Plus,
  Edit,
  Trash2,
  Eye,
  Search,
  Calendar,
  BookOpen,
  Upload,
  X,
  CheckCircle,
  Filter,
  MoreVertical,
  ChevronLeft,
  ChevronRight,
  CheckSquare,
  Square
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { supabaseImageServiceClient, UploadedImage } from "@/services/supabaseImageServiceClient";
import { blogServiceClient, BlogArticle } from "@/services/blogServiceClient";
import dynamic from 'next/dynamic';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import { BlogTopicClusterManager } from "@/components/admin/BlogTopicClusterManager";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

// Dynamically import ReactQuill only on client side
const ReactQuill = dynamic(() => import('react-quill'), { ssr: false });
import 'react-quill/dist/quill.snow.css';

const ITEMS_PER_PAGE = 10;

const BlogManagement = () => {
  const [articles, setArticles] = useState<BlogArticle[]>([]);
  const [filteredArticles, setFilteredArticles] = useState<BlogArticle[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [selectedArticles, setSelectedArticles] = useState<Set<string>>(new Set());
  const [currentPage, setCurrentPage] = useState(1);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingArticle, setEditingArticle] = useState<BlogArticle | null>(null);
  const [uploadedImage, setUploadedImage] = useState<UploadedImage | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [contentIntegrityCheck, setContentIntegrityCheck] = useState<{
    status: 'none' | 'checking' | 'valid' | 'invalid';
    message?: string;
  }>({ status: 'none' });
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    content: "",
    category: "",
    image_url: "",
    read_time: "",
    status: "draft" as "published" | "draft",
    author: "Westside Realty Team",
    seo_title: "",
    seo_description: "",
    topic_cluster: "",
    is_pillar_article: false,
    related_article_ids: [] as string[],
  });
  const { toast } = useToast();

  const quillModules = {
    toolbar: [
      [{ 'header': [1, 2, 3, 4, 5, 6, false] }],
      ['bold', 'italic', 'underline', 'strike'],
      [{ 'list': 'ordered'}, { 'list': 'bullet' }],
      [{ 'indent': '-1'}, { 'indent': '+1' }],
      ['link', 'blockquote', 'code-block'],
      [{ 'align': [] }],
      [{ 'color': [] }, { 'background': [] }],
      ['clean']
    ],
    clipboard: {
      matchVisual: false,
    },
    history: {
      delay: 1000,
      maxStack: 100,
      userOnly: false
    }
  };

  const quillFormats = [
    'header', 'bold', 'italic', 'underline', 'strike',
    'list', 'bullet', 'indent', 'link', 'align', 'blockquote',
    'code-block', 'color', 'background'
  ];

  useEffect(() => {
    loadArticles();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [articles, searchQuery, statusFilter, categoryFilter]);

  const loadArticles = async () => {
    try {
      const allArticles = await blogServiceClient.getAllArticles();
      setArticles(allArticles || []);
    } catch (error: any) {
      console.error('Error loading articles:', error);
      toast({
        title: "Error",
        description: error?.message || "Failed to load articles from server.",
        variant: "destructive"
      });
    }
  };

  const applyFilters = () => {
    let filtered = [...articles];

    // Search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(article =>
        article.title.toLowerCase().includes(query) ||
        (article.category && article.category.toLowerCase().includes(query)) ||
        (article.description && article.description.toLowerCase().includes(query))
      );
    }

    // Status filter
    if (statusFilter !== "all") {
      filtered = filtered.filter(article => article.status === statusFilter);
    }

    // Category filter
    if (categoryFilter !== "all") {
      filtered = filtered.filter(article => article.category === categoryFilter);
    }

    setFilteredArticles(filtered);
    setCurrentPage(1); // Reset to first page when filters change
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    try {
      // Upload to blog-images bucket as specified
      const uploaded = await supabaseImageServiceClient.uploadSingleImage(file, 'blog-images');
      setUploadedImage(uploaded);
      setFormData(prev => ({ ...prev, image_url: uploaded.url }));
      toast({
        title: "Success",
        description: "Image uploaded successfully to blog-images bucket"
      });
    } catch (error: any) {
      console.error('Error uploading image:', error);
      toast({
        title: "Error",
        description: error?.message || "Failed to upload image",
        variant: "destructive"
      });
    } finally {
      setIsUploading(false);
    }
  };

  const removeUploadedImage = async () => {
    if (uploadedImage) {
      try {
        await supabaseImageServiceClient.removeUploadedImage(uploadedImage.id);
        setUploadedImage(null);
        setFormData(prev => ({ ...prev, image_url: "" }));
      } catch (error) {
        console.error('Error removing image:', error);
        // Still remove from UI even if storage deletion fails
        setUploadedImage(null);
        setFormData(prev => ({ ...prev, image_url: "" }));
      }
    }
  };

  const handleEdit = (article: BlogArticle | null) => {
    if (!article) return;
    
    setEditingArticle(article);
    setFormData({
      title: article?.title ?? "",
      description: article?.description ?? "",
      content: article?.content ?? "",
      category: article?.category ?? "",
      image_url: article?.image_url ?? "",
      read_time: article?.read_time ?? "",
      status: (article?.status === "published" ? "published" : "draft"),
      author: article?.author ?? "Westside Realty Team",
      seo_title: article?.seo_title ?? "",
      seo_description: article?.seo_description ?? "",
      topic_cluster: article?.topic_cluster ?? "",
      is_pillar_article: article?.is_pillar_article ?? false,
      related_article_ids: article?.related_article_ids ?? [],
    });
    setUploadedImage(null);
    setContentIntegrityCheck({ status: 'none' });
    setIsDialogOpen(true);
  };

  const handleContentChange = (content: string) => {
    setFormData(prev => ({ ...prev, content }));
    setContentIntegrityCheck({ status: 'none' });
  };

  const validateContentBeforeSave = (): boolean => {
    setContentIntegrityCheck({ status: 'checking', message: 'Validating content...' });

    if (!formData.title || !formData.description || !formData.content) {
      setContentIntegrityCheck({ 
        status: 'invalid', 
        message: 'Missing required fields' 
      });
      return false;
    }

    if (formData.content.length < 100) {
      setContentIntegrityCheck({ 
        status: 'invalid', 
        message: 'Content too short (minimum 100 characters)' 
      });
      return false;
    }

    setContentIntegrityCheck({ 
      status: 'valid', 
      message: `Content validated (${formData.content.length} characters)` 
    });
    return true;
  };

  const handleSave = async () => {
    if (!validateContentBeforeSave()) {
      toast({
        title: "Validation Error",
        description: contentIntegrityCheck.message || "Please check your content",
        variant: "destructive"
      });
      return;
    }

    setIsSaving(true);

    try {
      const articleData = {
        ...formData,
        date: editingArticle?.date || new Date().toISOString().split('T')[0],
      };

      if (editingArticle?.id) {
        await blogServiceClient.updateArticle(editingArticle.id, articleData);
        toast({
          title: "Success",
          description: `Article updated successfully.`
        });
      } else {
        await blogServiceClient.addArticle(articleData);
        toast({
          title: "Success",
          description: `Article created successfully.`
        });
      }

      await loadArticles();
      setIsDialogOpen(false);
      resetForm();
    } catch (error: any) {
      setContentIntegrityCheck({status: 'invalid', message: error.message || 'Save failed'});
      toast({title: "Error", description: error.message || "Failed to save article", variant: "destructive"});
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (window.confirm("Are you sure you want to delete this article?")) {
      try {
        await blogServiceClient.deleteArticle(id);
        await loadArticles();
        toast({
          title: "Success",
          description: "Article deleted successfully"
        });
      } catch (error: any) {
        console.error('Error deleting article:', error);
        toast({
          title: "Error",
          description: error?.message || "Failed to delete article",
          variant: "destructive"
        });
      }
    }
  };

  const handleBulkDelete = async () => {
    if (selectedArticles.size === 0) {
      toast({
        title: "No Selection",
        description: "Please select articles to delete",
        variant: "destructive"
      });
      return;
    }

    const count = selectedArticles.size;
    if (window.confirm(`Are you sure you want to delete ${count} article(s)?`)) {
      try {
        const deletePromises = Array.from(selectedArticles).map(id => 
          blogServiceClient.deleteArticle(id)
        );
        await Promise.all(deletePromises);
        await loadArticles();
        setSelectedArticles(new Set());
        toast({
          title: "Success",
          description: `${count} article(s) deleted successfully`
        });
      } catch (error: any) {
        console.error('Error deleting articles:', error);
        toast({
          title: "Error",
          description: error?.message || "Failed to delete articles",
          variant: "destructive"
        });
      }
    }
  };

  const handleBulkStatusChange = async (newStatus: "published" | "draft") => {
    if (selectedArticles.size === 0) {
      toast({
        title: "No Selection",
        description: "Please select articles to update",
        variant: "destructive"
      });
      return;
    }

    const count = selectedArticles.size;
    try {
      const updatePromises = Array.from(selectedArticles).map(id => 
        blogServiceClient.updateArticle(id, { status: newStatus })
      );
      await Promise.all(updatePromises);
      await loadArticles();
      setSelectedArticles(new Set());
      toast({
        title: "Success",
        description: `${count} article(s) updated to ${newStatus}`
      });
    } catch (error: any) {
      console.error('Error updating articles:', error);
      toast({
        title: "Error",
        description: error?.message || "Failed to update articles",
        variant: "destructive"
      });
    }
  };

  const toggleSelectArticle = (id: string) => {
    const newSelected = new Set(selectedArticles);
    if (newSelected.has(id)) {
      newSelected.delete(id);
    } else {
      newSelected.add(id);
    }
    setSelectedArticles(newSelected);
  };

  const toggleSelectAll = () => {
    if (selectedArticles.size === paginatedArticles.length) {
      setSelectedArticles(new Set());
    } else {
      setSelectedArticles(new Set(paginatedArticles.map(a => a.id)));
    }
  };

  const formatDate = (dateString: string | null | undefined) => {
    if (!dateString) return 'N/A';
    try {
      return new Date(dateString).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      });
    } catch (error) {
      return dateString;
    }
  };

  const resetForm = () => {
    setFormData({
      title: "",
      description: "",
      content: "",
      category: "",
      image_url: "",
      read_time: "",
      status: "draft",
      author: "Westside Realty Team",
      seo_title: "",
      seo_description: "",
      topic_cluster: "",
      is_pillar_article: false,
      related_article_ids: [],
    });
    setEditingArticle(null);
    setUploadedImage(null);
    setContentIntegrityCheck({ status: 'none' });
  };

  // Pagination
  const totalPages = Math.ceil(filteredArticles.length / ITEMS_PER_PAGE);
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const endIndex = startIndex + ITEMS_PER_PAGE;
  const paginatedArticles = filteredArticles.slice(startIndex, endIndex);

  // Get unique categories for filter
  const categories = Array.from(new Set(articles.map(a => a.category).filter(Boolean)));

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <BookOpen className="h-6 w-6 text-blue-600" />
              <h1 className="text-2xl font-bold text-gray-900">Blog Management</h1>
            </div>
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
              <DialogTrigger asChild>
                <Button onClick={resetForm}>
                  <Plus className="h-4 w-4 mr-2" />
                  Add Article
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-6xl max-h-[95vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>
                    {editingArticle ? "Edit Article" : "Add New Article"}
                  </DialogTitle>
                  <DialogDescription>
                    {editingArticle ? "Update the article details below." : "Create a new blog article with SEO optimization."}
                  </DialogDescription>
                </DialogHeader>
                <Tabs defaultValue="compose" className="w-full">
                  <TabsList className="mb-4">
                    <TabsTrigger value="compose">Compose</TabsTrigger>
                    <TabsTrigger value="preview">Preview</TabsTrigger>
                    <TabsTrigger value="seo">SEO</TabsTrigger>
                  </TabsList>

                  <TabsContent value="compose">
                    <div className="grid gap-4 py-4">
                      <div className="grid gap-2">
                        <Label htmlFor="title">Title *</Label>
                        <Input
                          id="title"
                          value={formData.title}
                          onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                          placeholder="Enter article title"
                        />
                        {formData.title && (
                          <p className="text-xs text-muted-foreground">
                            Slug: {formData.title.toLowerCase().replace(/[^a-zA-Z0-9 ]/g, '').replace(/\s+/g, '-')}
                          </p>
                        )}
                      </div>
                      
                      <div className="grid gap-2">
                        <Label htmlFor="description">Description *</Label>
                        <Textarea
                          id="description"
                          value={formData.description}
                          onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                          placeholder="Brief description of the article"
                          rows={3}
                        />
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div className="grid gap-2">
                          <Label htmlFor="category">Category</Label>
                          <Select
                            value={formData.category}
                            onValueChange={(value) => setFormData(prev => ({ ...prev, category: value }))}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Select category" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="Market Analysis">Market Analysis</SelectItem>
                              <SelectItem value="Investment Guide">Investment Guide</SelectItem>
                              <SelectItem value="Buyer's Guide">Buyer's Guide</SelectItem>
                              <SelectItem value="Seller's Guide">Seller's Guide</SelectItem>
                              <SelectItem value="Legal Guide">Legal Guide</SelectItem>
                              <SelectItem value="Real Estate Investment">Real Estate Investment</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>

                        <div className="grid gap-2">
                          <Label htmlFor="readTime">Read Time</Label>
                          <Input
                            id="readTime"
                            value={formData.read_time}
                            onChange={(e) => setFormData(prev => ({ ...prev, read_time: e.target.value }))}
                            placeholder="e.g., 5 min read"
                          />
                        </div>
                      </div>

                      <div className="grid gap-2">
                        <Label htmlFor="image">Featured Image (blog-images bucket)</Label>
                        
                        {!uploadedImage && !formData.image_url && (
                          <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                            <Upload className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                            <p className="text-gray-600 mb-2">Upload featured image</p>
                            <p className="text-sm text-gray-500 mb-4">Maximum 5MB, JPG, PNG, or WebP</p>
                            <input
                              type="file"
                              accept="image/*"
                              onChange={handleImageUpload}
                              className="hidden"
                              id="image-upload"
                            />
                            <Button 
                              type="button" 
                              variant="outline" 
                              onClick={() => document.getElementById('image-upload')?.click()}
                              disabled={isUploading}
                            >
                              {isUploading ? "Uploading..." : "Choose Image"}
                            </Button>
                          </div>
                        )}

                        {(uploadedImage || formData.image_url) && (
                          <div className="relative">
                            <img
                              src={uploadedImage?.preview || formData.image_url}
                              alt="Featured image"
                              className="w-full h-48 object-cover rounded-lg border"
                            />
                            <Button
                              type="button"
                              variant="destructive"
                              size="icon"
                              className="absolute top-2 right-2 h-8 w-8"
                              onClick={removeUploadedImage}
                            >
                              <X className="h-4 w-4" />
                            </Button>
                          </div>
                        )}
                      </div>

                      <div className="grid gap-2">
                        <Label htmlFor="content">Content * (Rich Text Editor)</Label>
                        <div className="border rounded-lg bg-white">
                          <ReactQuill
                            theme="snow"
                            value={formData.content}
                            onChange={handleContentChange}
                            modules={quillModules}
                            formats={quillFormats}
                            placeholder="Write or paste your article content here. Supports formatting and inline images."
                            style={{ minHeight: "400px", borderRadius: "0.5rem" }}
                            className="prose-editor"
                          />
                        </div>
                        {formData.content && (
                          <p className="text-xs text-muted-foreground">
                            {formData.content.length.toLocaleString()} characters
                          </p>
                        )}
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div className="grid gap-2">
                          <Label htmlFor="status">Status</Label>
                          <Select
                            value={formData.status}
                            onValueChange={(value: "published" | "draft") => setFormData(prev => ({ ...prev, status: value }))}
                          >
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="draft">Draft</SelectItem>
                              <SelectItem value="published">Published</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>

                        <div className="grid gap-2">
                          <Label htmlFor="author">Author</Label>
                          <Input
                            id="author"
                            value={formData.author}
                            onChange={(e) => setFormData(prev => ({ ...prev, author: e.target.value }))}
                            placeholder="Author name"
                          />
                        </div>
                      </div>
                    </div>
                  </TabsContent>

                  <TabsContent value="preview">
                    <div className="prose max-w-full bg-white p-4 rounded shadow border my-4 min-h-[300px]">
                      <h2 className="font-bold">{formData.title || "Untitled Article"}</h2>
                      {formData.image_url && (
                        <img
                          src={formData.image_url}
                          alt="Cover"
                          className="rounded shadow my-2 w-full max-h-60 object-cover"
                        />
                      )}
                      <div dangerouslySetInnerHTML={{ __html: formData.content || "<p>No content yet.</p>" }} />
                    </div>
                  </TabsContent>

                  <TabsContent value="seo">
                    <div className="grid gap-4 py-4">
                      <div className="grid gap-2">
                        <Label htmlFor="seo_title">SEO Title</Label>
                        <Input
                          id="seo_title"
                          value={formData.seo_title}
                          onChange={(e) => setFormData(prev => ({ ...prev, seo_title: e.target.value }))}
                          placeholder="Optimized title for search engines (leave empty to use article title)"
                        />
                        <p className="text-xs text-muted-foreground">
                          Recommended: 50-60 characters. If empty, article title will be used.
                        </p>
                      </div>

                      <div className="grid gap-2">
                        <Label htmlFor="seo_description">SEO Description</Label>
                        <Textarea
                          id="seo_description"
                          value={formData.seo_description}
                          onChange={(e) => setFormData(prev => ({ ...prev, seo_description: e.target.value }))}
                          placeholder="Meta description for search engines (leave empty to use article description)"
                          rows={3}
                        />
                        <p className="text-xs text-muted-foreground">
                          Recommended: 150-160 characters. If empty, article description will be used.
                        </p>
                      </div>

                      <div className="grid gap-2">
                        <Label htmlFor="topic_cluster">Topic Cluster</Label>
                        <Input
                          id="topic_cluster"
                          value={formData.topic_cluster}
                          onChange={(e) => setFormData(prev => ({ ...prev, topic_cluster: e.target.value }))}
                          placeholder="e.g., Real Estate Investment, Market Analysis"
                        />
                        <p className="text-xs text-muted-foreground">
                          Group related articles together for better SEO and internal linking.
                        </p>
                      </div>

                      <div className="flex items-center space-x-2">
                        <Checkbox
                          id="is_pillar_article"
                          checked={formData.is_pillar_article}
                          onCheckedChange={(checked) => setFormData(prev => ({ ...prev, is_pillar_article: checked as boolean }))}
                        />
                        <Label htmlFor="is_pillar_article" className="cursor-pointer">
                          Mark as Pillar Article
                        </Label>
                        <p className="text-xs text-muted-foreground ml-2">
                          Pillar articles are comprehensive guides that link to cluster articles.
                        </p>
                      </div>
                    </div>
                  </TabsContent>
                </Tabs>
                
                <div className="flex justify-end space-x-2 pt-4 border-t">
                  <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button
                    onClick={handleSave}
                    disabled={isSaving || contentIntegrityCheck.status === "invalid"}
                  >
                    {isSaving ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                        Saving...
                      </>
                    ) : (
                      <>
                        {editingArticle ? "Update" : "Create"} Article
                      </>
                    )}
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </div>
      </header>
      
      <div className="container mx-auto px-4 py-8">
        <Tabs defaultValue="articles" className="w-full">
          <TabsList className="mb-6">
            <TabsTrigger value="articles">Articles</TabsTrigger>
            <TabsTrigger value="clusters">Topic Clusters</TabsTrigger>
          </TabsList>

          <TabsContent value="articles" className="space-y-6">
            {/* Filters and Search */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <Card className="md:col-span-2">
                <CardContent className="p-4">
                  <div className="relative">
                    <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                    <Input
                      placeholder="Search articles by title, category, or description..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-4">
                  <Select value={statusFilter} onValueChange={setStatusFilter}>
                    <SelectTrigger>
                      <SelectValue placeholder="Filter by status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Status</SelectItem>
                      <SelectItem value="published">Published</SelectItem>
                      <SelectItem value="draft">Draft</SelectItem>
                    </SelectContent>
                  </Select>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-4">
                  <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                    <SelectTrigger>
                      <SelectValue placeholder="Filter by category" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Categories</SelectItem>
                      {categories.map(cat => (
                        <SelectItem key={cat} value={cat || ""}>{cat}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </CardContent>
              </Card>
            </div>

            {/* Bulk Actions */}
            {selectedArticles.size > 0 && (
              <Card className="bg-blue-50 border-blue-200">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-blue-900">
                      {selectedArticles.size} article(s) selected
                    </span>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleBulkStatusChange("published")}
                      >
                        Publish Selected
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleBulkStatusChange("draft")}
                      >
                        Draft Selected
                      </Button>
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={handleBulkDelete}
                      >
                        <Trash2 className="h-4 w-4 mr-2" />
                        Delete Selected
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Stats */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <Card>
                <CardContent className="p-4">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-blue-600">{articles.length}</div>
                    <div className="text-sm text-gray-600">Total Articles</div>
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-green-600">
                      {articles.filter(a => a.status === 'published').length}
                    </div>
                    <div className="text-sm text-gray-600">Published</div>
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-yellow-600">
                      {articles.filter(a => a.status === 'draft').length}
                    </div>
                    <div className="text-sm text-gray-600">Drafts</div>
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-purple-600">{filteredArticles.length}</div>
                    <div className="text-sm text-gray-600">Filtered Results</div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Table View */}
            <Card>
              <CardHeader>
                <CardTitle>Articles</CardTitle>
                <CardDescription>
                  Manage your blog articles. Use checkboxes to select multiple articles for bulk actions.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-12">
                        <Checkbox
                          checked={selectedArticles.size === paginatedArticles.length && paginatedArticles.length > 0}
                          onCheckedChange={toggleSelectAll}
                        />
                      </TableHead>
                      <TableHead>Title</TableHead>
                      <TableHead>Category</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Date</TableHead>
                      <TableHead>Author</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {paginatedArticles.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={7} className="text-center py-12">
                          <BookOpen className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                          <p className="text-gray-500">
                            {searchQuery || statusFilter !== "all" || categoryFilter !== "all"
                              ? "No articles found matching your filters."
                              : "No articles yet. Create your first article!"}
                          </p>
                        </TableCell>
                      </TableRow>
                    ) : (
                      paginatedArticles.map((article) => (
                        <TableRow key={article.id}>
                          <TableCell>
                            <Checkbox
                              checked={selectedArticles.has(article.id)}
                              onCheckedChange={() => toggleSelectArticle(article.id)}
                            />
                          </TableCell>
                          <TableCell className="font-medium">
                            <div>
                              <div className="font-semibold">{article?.title ?? "Untitled"}</div>
                              <div className="text-xs text-muted-foreground line-clamp-1">
                                {article?.description ?? ""}
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline">{article?.category || "Uncategorized"}</Badge>
                          </TableCell>
                          <TableCell>
                            <Badge variant={(article?.status ?? 'draft') === 'published' ? 'default' : 'secondary'}>
                              {article?.status ?? 'draft'}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center text-sm text-gray-500">
                              <Calendar className="h-4 w-4 mr-1" />
                              {formatDate(article?.date)}
                            </div>
                          </TableCell>
                          <TableCell className="text-sm">{article?.author ?? "Unknown"}</TableCell>
                          <TableCell className="text-right">
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="sm">
                                  <MoreVertical className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuLabel>Actions</DropdownMenuLabel>
                                <DropdownMenuItem onClick={() => window.open(`/blog/${article?.slug ?? article?.id}`, '_blank')}>
                                  <Eye className="h-4 w-4 mr-2" />
                                  View
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => handleEdit(article)}>
                                  <Edit className="h-4 w-4 mr-2" />
                                  Edit
                                </DropdownMenuItem>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem
                                  onClick={() => article?.id && handleDelete(article.id)}
                                  className="text-red-600"
                                >
                                  <Trash2 className="h-4 w-4 mr-2" />
                                  Delete
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>

                {/* Pagination */}
                {totalPages > 1 && (
                  <div className="flex items-center justify-between mt-4">
                    <div className="text-sm text-muted-foreground">
                      Showing {startIndex + 1} to {Math.min(endIndex, filteredArticles.length)} of {filteredArticles.length} articles
                    </div>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                        disabled={currentPage === 1}
                      >
                        <ChevronLeft className="h-4 w-4" />
                        Previous
                      </Button>
                      <div className="flex items-center gap-1">
                        {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                          let pageNum;
                          if (totalPages <= 5) {
                            pageNum = i + 1;
                          } else if (currentPage <= 3) {
                            pageNum = i + 1;
                          } else if (currentPage >= totalPages - 2) {
                            pageNum = totalPages - 4 + i;
                          } else {
                            pageNum = currentPage - 2 + i;
                          }
                          return (
                            <Button
                              key={pageNum}
                              variant={currentPage === pageNum ? "default" : "outline"}
                              size="sm"
                              onClick={() => setCurrentPage(pageNum)}
                            >
                              {pageNum}
                            </Button>
                          );
                        })}
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                        disabled={currentPage === totalPages}
                      >
                        Next
                        <ChevronRight className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="clusters">
            <BlogTopicClusterManager />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default BlogManagement;
