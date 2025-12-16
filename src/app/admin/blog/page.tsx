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
  AlertCircle,
  FileText,
  CheckCircle
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
import { supabaseImageService, UploadedImage } from "@/services/supabaseImageService";
import { blogService, BlogArticle } from "@/services/blogService";
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import { Dialog as UIDialog, DialogContent as UIDialogContent } from "@/components/ui/dialog";
import { BlogTopicClusterManager } from "@/components/admin/BlogTopicClusterManager";

const LOVABLE_UPLOADS = [
  "Article1-Resale-vs-new-launch.jpg",
  "Article2-how-to-negotiate.jpg",
  "Hyderabad Cover page.jpg",
  "Goa Cover page.jpg",
  "Dubai Cover page.jpg",
];

const BlogManagement = () => {
  const [articles, setArticles] = useState<BlogArticle[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingArticle, setEditingArticle] = useState<BlogArticle | null>(null);
  const [uploadedImage, setUploadedImage] = useState<UploadedImage | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [contentLength, setContentLength] = useState(0);
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
    author: "Westside Realty Team"
  });
  const { toast } = useToast();
  const quillRef = useRef<ReactQuill>(null);

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
    (async () => {
      try {
        const allArticles = await blogService.getAllArticles();
        setArticles(allArticles);
      } catch (error) {
        toast({
          title: "Error",
          description: "Failed to load articles from server.",
          variant: "destructive"
        });
      }
    })();
  }, []);

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    try {
      const uploaded = await supabaseImageService.uploadSingleImage(file, 'blog-articles');
      setUploadedImage(uploaded);
      setFormData(prev => ({ ...prev, image_url: uploaded.url }));
      toast({
        title: "Success",
        description: "Image uploaded successfully"
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to upload image",
        variant: "destructive"
      });
    } finally {
      setIsUploading(false);
    }
  };

  const removeUploadedImage = () => {
    if (uploadedImage) {
      supabaseImageService.removeUploadedImage(uploadedImage.id);
      setUploadedImage(null);
      setFormData(prev => ({ ...prev, image_url: "" }));
    }
  };

  const handleEdit = (article: BlogArticle) => {
    setEditingArticle(article);
    setFormData({
      title: article.title,
      description: article.description,
      content: article.content,
      category: article.category ?? "",
      image_url: article.image_url ?? "",
      read_time: article.read_time ?? "",
      status: (article.status === "published" ? "published" : "draft"),
      author: article.author || "Westside Realty Team"
    });
    setUploadedImage(null);
    setContentIntegrityCheck({ status: 'none' });
    setIsDialogOpen(true);
  };

    const handleInsertImage = (url: string) => {
      const editor = quillRef.current?.getEditor();
      if (editor) {
        const range = editor.getSelection();
        editor.insertEmbed(range ? range.index : 0, "image", url, "user");
      }
      toast({
        title: "Image Inserted",
        description: "The image was inserted at the cursor position.",
      });
    };

  const handleContentChange = (content: string) => {
    setFormData(prev => ({ ...prev, content }));
    setContentIntegrityCheck({ status: 'none' });
  };

  const validateContentBeforeSave = (): boolean => {
    setContentIntegrityCheck({ status: 'checking', message: 'Validating content...' });

    const contentLength = formData.content.length;
    console.log('Pre-save validation:', {
      title: formData.title,
      contentLength,
      hasRequiredFields: !!(formData.title && formData.description && formData.content)
    });

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
        message: 'Content too short' 
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
    const originalContentLength = formData.content.length;

    try {
      if (editingArticle) {
        await blogService.updateArticle(editingArticle.id, {
          ...formData
        });
        toast({
          title: "Success",
          description: `Article updated successfully.`
        });
      } else {
        await blogService.addArticle({
          ...formData,
          date: new Date().toISOString().split('T')[0]
        });
        toast({
          title: "Success",
          description: `Article created successfully.`
        });
      }

      const updatedList = await blogService.getAllArticles();
      setArticles(updatedList);
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
        await blogService.deleteArticle(id);
        const updatedList = await blogService.getAllArticles();
        setArticles(updatedList);
        toast({
          title: "Success",
          description: "Article deleted successfully"
        });
      } catch (error: any) {
        toast({
          title: "Error",
          description: "Failed to delete article",
          variant: "destructive"
        });
      }
    }
  };

  const filteredArticles = articles.filter(article =>
    article.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    article.category.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const getContentSizeInfo = () => {
    if (contentLength > 25000) {
      return { color: "text-red-600", message: "Very long article" };
    } else if (contentLength > 10000) {
      return { color: "text-yellow-600", message: "Long article" };
    } else if (contentLength > 5000) {
      return { color: "text-green-600", message: "Good length" };
    } else {
      return { color: "text-gray-600", message: "Short article" };
    }
  };

  const sizeInfo = getContentSizeInfo();

  const resetForm = () => {
    setFormData({
      title: "",
      description: "",
      content: "",
      category: "",
      image_url: "",
      read_time: "",
      status: "draft",
      author: "Westside Realty Team"
    });
    setEditingArticle(null);
    setUploadedImage(null);
    setContentLength(0);
    setContentIntegrityCheck({ status: 'none' });
  };

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
                    {editingArticle ? "Update the article details below." : "Create a new blog article. You can paste large content from ChatGPT or any other source - there's no character limit!"}
                  </DialogDescription>
                </DialogHeader>
                <Tabs defaultValue="compose" className="w-full">
                  <TabsList className="mb-4">
                    <TabsTrigger value="compose">Compose</TabsTrigger>
                    <TabsTrigger value="preview">Preview</TabsTrigger>
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
                    <Label htmlFor="image">Featured Image</Label>
                    
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

                      <div className="flex items-center justify-between pb-2">
                        <Label htmlFor="content">Content * (Rich Text Editor)</Label>
                        <div className="flex items-center gap-2">
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() =>
                              (document.getElementById("image-insert-dialog") as HTMLDialogElement)?.showModal()
                            }
                          >
                            Insert Inline Image
                          </Button>
                          <UIDialog>
                            <UIDialogContent>
                              <div className="mb-4 text-lg font-bold" id="image-insert-dialog">Insert Image from /lovable-uploads</div>
                              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                                {LOVABLE_UPLOADS.map((img) => (
                                  <button
                                    key={img}
                                    type="button"
                                    className="flex flex-col items-center group p-2 border rounded hover-scale"
                                    onClick={() => {
                                      handleInsertImage(`/lovable-uploads/${img}`);
                                      (document.getElementById("image-insert-dialog") as HTMLDialogElement)?.close();
                                    }}
                                  >
                                    <img
                                      src={`/lovable-uploads/${img}`}
                                      alt={img}
                                      className="w-24 h-16 object-cover rounded shadow-md mb-2"
                                    />
                                    <span className="text-xs text-gray-500">{img}</span>
                                  </button>
                                ))}
                              </div>
                            </UIDialogContent>
                          </UIDialog>
                        </div>
                      </div>
                      <div className="border rounded-lg bg-white">
                        <ReactQuill
                          ref={quillRef}
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
                      
                  {contentLength > 0 && (
                      <div className="flex items-center space-x-2 text-sm text-blue-600 bg-blue-50 p-2 rounded">
                        <CheckCircle className="h-4 w-4" />
                        <span>
                          Content ready for save - {contentLength.toLocaleString()} characters will be preserved
                        </span>
                      </div>
                    )}
                  

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
                      <h2 className="font-bold">{formData.title}</h2>
                      {formData.image_url && (
                        <img
                          src={formData.image_url}
                          alt="Cover"
                          className="rounded shadow my-2 w-full max-h-60 object-cover"
                        />
                      )}
                      <div dangerouslySetInnerHTML={{ __html: formData.content }} />
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
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
              <Card className="md:col-span-3">
                <CardContent className="p-4">
                  <div className="relative">
                    <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                    <Input
                      placeholder="Search articles by title or category..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-4">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-blue-600">{articles.length}</div>
                    <div className="text-sm text-gray-600">Total Articles</div>
                  </div>
                </CardContent>
              </Card>
            </div>

            <div className="grid gap-6">
              {filteredArticles.map((article) => (
            <Card key={article.id}>
              <CardContent className="p-6">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-2 mb-2">
                      <Badge variant={article.status === 'published' ? 'default' : 'secondary'}>
                        {article.status}
                      </Badge>
                      <Badge variant="outline">{article.category}</Badge>
                      <div className="text-xs text-gray-500">
                        {article.content.replace(/<[^>]*>/g, '').length.toLocaleString()} chars
                      </div>
                    </div>
                    
                    <h3 className="text-xl font-semibold mb-2">{article.title}</h3>
                    <p className="text-gray-600 mb-3 line-clamp-2">{article.description}</p>
                    
                    <div className="flex items-center text-sm text-gray-500 space-x-4">
                      <div className="flex items-center">
                        <Calendar className="h-4 w-4 mr-1" />
                        {formatDate(article.date)}
                      </div>
                      <span>{article.read_time}</span>
                      <span>By {article.author}</span>
                    </div>
                  </div>

                  <div className="flex items-center space-x-2 ml-4">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => window.open(`/blog/${article.id}`, '_blank')}
                    >
                      <Eye className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleEdit(article)}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDelete(article.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
                </Card>
              ))}
            </div>

            {filteredArticles.length === 0 && (
              <div className="text-center py-12">
                <BookOpen className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500">
                  {searchQuery ? "No articles found matching your search." : "No articles yet. Create your first article!"}
                </p>
              </div>
            )}
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
