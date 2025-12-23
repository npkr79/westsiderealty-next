"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";
import { blogServiceClient, BlogArticle } from "@/services/blogServiceClient";
import { Link2, Star, Trash2, Edit, Plus, Save, X } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

export function BlogTopicClusterManager() {
  const [articles, setArticles] = useState<BlogArticle[]>([]);
  const [clusters, setClusters] = useState<string[]>([]);
  const [selectedCluster, setSelectedCluster] = useState<string>("");
  const [editingArticle, setEditingArticle] = useState<BlogArticle | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [dialogArticleId, setDialogArticleId] = useState<string | null>(null);
  const [newClusterName, setNewClusterName] = useState("");
  const { toast } = useToast();

  useEffect(() => {
    loadArticles();
  }, []);

  useEffect(() => {
    // Extract unique clusters from articles
    const uniqueClusters = Array.from(
      new Set(articles.map(a => a.topic_cluster).filter(Boolean) as string[])
    );
    setClusters(uniqueClusters);
  }, [articles]);

  const loadArticles = async () => {
    try {
      const allArticles = await blogServiceClient.getAllArticles();
      setArticles(allArticles || []);
    } catch (error: any) {
      console.error('Error loading articles:', error);
      toast({
        title: "Error",
        description: error?.message || "Failed to load articles",
        variant: "destructive"
      });
    }
  };

  const handleClusterFilter = (cluster: string) => {
    setSelectedCluster(cluster);
  };

  const handleUpdateCluster = async (articleId: string, cluster: string) => {
    try {
      await blogServiceClient.updateArticle(articleId, { topic_cluster: cluster || null });
      await loadArticles();
      toast({
        title: "Success",
        description: "Topic cluster updated"
      });
    } catch (error: any) {
      console.error('Error updating cluster:', error);
      toast({
        title: "Error",
        description: error?.message || "Failed to update cluster",
        variant: "destructive"
      });
    }
  };

  const handleTogglePillar = async (articleId: string, isPillar: boolean) => {
    try {
      await blogServiceClient.updateArticle(articleId, { is_pillar_article: isPillar });
      await loadArticles();
      toast({
        title: "Success",
        description: isPillar ? "Article marked as pillar" : "Pillar status removed"
      });
    } catch (error: any) {
      console.error('Error updating pillar status:', error);
      toast({
        title: "Error",
        description: error?.message || "Failed to update pillar status",
        variant: "destructive"
      });
    }
  };

  const handleAddRelatedArticle = async (articleId: string, relatedId: string) => {
    try {
      const article = articles.find(a => a.id === articleId);
      if (!article) return;

      const currentRelated = article.related_article_ids || [];
      if (currentRelated.includes(relatedId)) {
        toast({
          title: "Already Added",
          description: "This article is already linked",
          variant: "destructive"
        });
        return;
      }

      await blogServiceClient.updateArticle(articleId, {
        related_article_ids: [...currentRelated, relatedId]
      });
      await loadArticles();
      toast({
        title: "Success",
        description: "Related article linked"
      });
    } catch (error: any) {
      console.error('Error linking article:', error);
      toast({
        title: "Error",
        description: error?.message || "Failed to link article",
        variant: "destructive"
      });
    }
  };

  const handleRemoveRelatedArticle = async (articleId: string, relatedId: string) => {
    try {
      const article = articles.find(a => a.id === articleId);
      if (!article) return;

      const currentRelated = article.related_article_ids || [];
      await blogServiceClient.updateArticle(articleId, {
        related_article_ids: currentRelated.filter(id => id !== relatedId)
      });
      await loadArticles();
      toast({
        title: "Success",
        description: "Related article unlinked"
      });
    } catch (error: any) {
      console.error('Error unlinking article:', error);
      toast({
        title: "Error",
        description: error?.message || "Failed to unlink article",
        variant: "destructive"
      });
    }
  };

  const handleCreateCluster = () => {
    if (!newClusterName.trim()) {
      toast({
        title: "Error",
        description: "Cluster name cannot be empty",
        variant: "destructive"
      });
      return;
    }

    if (clusters.includes(newClusterName.trim())) {
      toast({
        title: "Error",
        description: "Cluster already exists",
        variant: "destructive"
      });
      return;
    }

    setClusters([...clusters, newClusterName.trim()]);
    setNewClusterName("");
    toast({
      title: "Success",
      description: "Cluster created. Assign articles to it using the dropdown."
    });
  };

  const filteredArticles = selectedCluster
    ? articles.filter(a => a.topic_cluster === selectedCluster)
    : articles;

  const getClusterStats = (cluster: string) => {
    const clusterArticles = articles.filter(a => a.topic_cluster === cluster);
    const pillarCount = clusterArticles.filter(a => a.is_pillar_article).length;
    return {
      total: clusterArticles.length,
      published: clusterArticles.filter(a => a.status === 'published').length,
      pillars: pillarCount
    };
  };

  return (
    <div className="space-y-6">
      {/* Cluster Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Total Clusters</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{clusters.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Clustered Articles</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">
              {articles.filter(a => a.topic_cluster).length}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Pillar Articles</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">
              {articles.filter(a => a.is_pillar_article).length}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Cluster Management */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Topic Clusters</CardTitle>
              <CardDescription>
                Organize articles into topic clusters for better SEO and internal linking
              </CardDescription>
            </div>
            <div className="flex gap-2">
              <Input
                placeholder="New cluster name..."
                value={newClusterName}
                onChange={(e) => setNewClusterName(e.target.value)}
                className="w-48"
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    handleCreateCluster();
                  }
                }}
              />
              <Button onClick={handleCreateCluster}>
                <Plus className="h-4 w-4 mr-2" />
                Create Cluster
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2 mb-4">
            <Button
              variant={selectedCluster === "" ? "default" : "outline"}
              size="sm"
              onClick={() => handleClusterFilter("")}
            >
              All Articles
            </Button>
            {clusters.map(cluster => {
              const stats = getClusterStats(cluster);
              return (
                <Button
                  key={cluster}
                  variant={selectedCluster === cluster ? "default" : "outline"}
                  size="sm"
                  onClick={() => handleClusterFilter(cluster)}
                >
                  {cluster}
                  <Badge variant="secondary" className="ml-2">
                    {stats.total}
                  </Badge>
                </Button>
              );
            })}
          </div>

          {selectedCluster && (
            <div className="mb-4 p-4 bg-muted rounded-lg">
              <h3 className="font-semibold mb-2">Cluster: {selectedCluster}</h3>
              <div className="grid grid-cols-3 gap-4 text-sm">
                <div>
                  <span className="text-muted-foreground">Total Articles:</span>{" "}
                  <span className="font-semibold">{getClusterStats(selectedCluster).total}</span>
                </div>
                <div>
                  <span className="text-muted-foreground">Published:</span>{" "}
                  <span className="font-semibold">{getClusterStats(selectedCluster).published}</span>
                </div>
                <div>
                  <span className="text-muted-foreground">Pillar Articles:</span>{" "}
                  <span className="font-semibold">{getClusterStats(selectedCluster).pillars}</span>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Articles Table */}
      <Card>
        <CardHeader>
          <CardTitle>Manage Articles</CardTitle>
          <CardDescription>
            Assign articles to clusters, mark pillar articles, and link related content
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Title</TableHead>
                <TableHead>Current Cluster</TableHead>
                <TableHead>Pillar</TableHead>
                <TableHead>Related Articles</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredArticles.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                    {selectedCluster ? "No articles in this cluster" : "No articles found"}
                  </TableCell>
                </TableRow>
              ) : (
                filteredArticles.map((article) => (
                  <TableRow key={article.id}>
                    <TableCell className="font-medium">
                      <div>
                        <div>{article?.title ?? "Untitled"}</div>
                        <div className="text-xs text-muted-foreground">
                          {(article?.status ?? 'draft') === 'published' ? (
                            <Badge variant="default" className="text-xs">Published</Badge>
                          ) : (
                            <Badge variant="secondary" className="text-xs">Draft</Badge>
                          )}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Select
                        value={article?.topic_cluster || ""}
                        onValueChange={(value) => article?.id && handleUpdateCluster(article.id, value)}
                      >
                        <SelectTrigger className="w-48">
                          <SelectValue placeholder="No cluster" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="">No cluster</SelectItem>
                          {clusters.map(cluster => (
                            <SelectItem key={cluster} value={cluster}>
                              {cluster}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center space-x-2">
                        <Checkbox
                          checked={article?.is_pillar_article || false}
                          onCheckedChange={(checked) => article?.id && handleTogglePillar(article.id, checked as boolean)}
                        />
                        {article?.is_pillar_article && (
                          <Star className="h-4 w-4 text-yellow-500 fill-yellow-500" />
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="space-y-1">
                        {article?.related_article_ids && article.related_article_ids.length > 0 ? (
                          <div className="flex flex-wrap gap-1">
                            {article.related_article_ids.map(relatedId => {
                              const relatedArticle = articles.find(a => a.id === relatedId);
                              return relatedArticle ? (
                                <Badge
                                  key={relatedId}
                                  variant="outline"
                                  className="text-xs cursor-pointer hover:bg-destructive hover:text-destructive-foreground"
                                  onClick={() => article?.id && handleRemoveRelatedArticle(article.id, relatedId)}
                                >
                                  {(relatedArticle?.title ?? "").substring(0, 30)}...
                                  <X className="h-3 w-3 ml-1" />
                                </Badge>
                              ) : null;
                            })}
                          </div>
                        ) : (
                          <span className="text-xs text-muted-foreground">None</span>
                        )}
                        <Dialog open={dialogArticleId === article?.id} onOpenChange={(open) => setDialogArticleId(open ? article?.id ?? null : null)}>
                          <DialogTrigger asChild>
                            <Button variant="ghost" size="sm" className="h-6 text-xs">
                              <Link2 className="h-3 w-3 mr-1" />
                              Add Related
                            </Button>
                          </DialogTrigger>
                          <DialogContent>
                            <DialogHeader>
                              <DialogTitle>Link Related Article</DialogTitle>
                              <DialogDescription>
                                Select an article to link to "{article?.title ?? "this article"}"
                              </DialogDescription>
                            </DialogHeader>
                            <div className="max-h-96 overflow-y-auto space-y-2">
                              {articles
                                .filter(a => a.id !== article?.id && !article?.related_article_ids?.includes(a.id))
                                .map(a => (
                                  <div
                                    key={a.id}
                                    className="p-2 border rounded cursor-pointer hover:bg-muted"
                                    onClick={() => {
                                      if (article?.id) {
                                        handleAddRelatedArticle(article.id, a.id);
                                        setDialogArticleId(null);
                                      }
                                    }}
                                  >
                                    <div className="font-medium text-sm">{a?.title ?? "Untitled"}</div>
                                    <div className="text-xs text-muted-foreground">{a?.category ?? "Uncategorized"}</div>
                                  </div>
                                ))}
                              {articles.filter(a => a.id !== article?.id && !article?.related_article_ids?.includes(a.id)).length === 0 && (
                                <p className="text-sm text-muted-foreground text-center py-4">
                                  No available articles to link
                                </p>
                              )}
                            </div>
                          </DialogContent>
                        </Dialog>
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => window.open(`/blog/${article?.slug ?? article?.id}`, '_blank')}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
