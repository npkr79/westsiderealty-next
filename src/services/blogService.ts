
import { createClient } from '@/lib/supabase/server';
import { createServiceClient } from '@/lib/supabase/serviceClient';


export interface BlogArticle {
  id: string;
  slug: string;
  title: string;
  description: string;
  content: string;
  date: string;
  image_url: string | null;
  read_time: string | null;
  category: string | null;
  status: "published" | "draft";
  author: string;
  seo_title?: string | null;
  seo_description?: string | null;
  created_at: string;
  updated_at: string;
  topic_cluster?: string | null;
  is_pillar_article?: boolean | null;
  related_article_ids?: string[] | null;
}

// ========== MAIN BLOG SERVICE ==========
class BlogService {
  init() {
    // No initialization needed, but present for consistent API
  }

  private async runWithServiceFallback<T>(
    queryFn: (client: any) => Promise<{ data: T | null; error: any }>
  ) {
    const supabase = await createClient();
    let result = await queryFn(supabase);
    if (result.error && (result.error.code === '42501' || result.error.status === 403)) {
      const serviceClient = createServiceClient();
      result = await queryFn(serviceClient);
    }
    return result;
  }

  // ========== 1. Fetch Published Articles ==========
  async getPublishedArticles(): Promise<BlogArticle[]> {
    // @ts-ignore: Ignore missing type, will be fixed after types are regenerated
    const { data, error } = await this.runWithServiceFallback<BlogArticle[]>((client) =>
      (client as any)
        .from('blog_articles')
        .select('*')
        .eq('status', 'published')
        .order('date', { ascending: false })
    );
    if (error) throw error;
    return data || [];
  }

  // ========== 2. Fetch All Articles (Admin) ==========
  async getAllArticles(): Promise<BlogArticle[]> {
    // @ts-ignore: Ignore missing type, will be fixed after types are regenerated
    const { data, error } = await this.runWithServiceFallback<BlogArticle[]>((client) =>
      (client as any)
        .from('blog_articles')
        .select('*')
        .order('date', { ascending: false })
    );
    if (error) throw error;
    return data || [];
  }

  // ========== 3. Get by ID ==========
  async getArticleById(id: string): Promise<BlogArticle | null> {
    // @ts-ignore
    const { data, error } = await this.runWithServiceFallback<BlogArticle>((client) =>
      (client as any)
        .from('blog_articles')
        .select('*')
        .eq('id', id)
        .maybeSingle()
    );
    if (error) throw error;
    if (!data) throw new Error("Failed to insert blog article.");
    return data;
  }

  // ========== 3.1. Get by Slug ==========
  async getArticleBySlug(slug: string): Promise<BlogArticle | null> {
    // @ts-ignore
    const { data, error } = await this.runWithServiceFallback<BlogArticle>((client) =>
      (client as any)
        .from('blog_articles')
        .select('*')
        .eq('slug', slug)
        .maybeSingle()
    );
    if (error) throw error;
    if (!data) throw new Error("Failed to update blog article.");
    return data;
  }

  // ========== 4. Add new ==========
  async addArticle(article: Omit<BlogArticle, 'id' | 'created_at' | 'updated_at' | 'slug'>): Promise<BlogArticle> {
    // Generate slug from title
    const slug = article.title
      .toLowerCase()
      .replace(/[^a-zA-Z0-9 ]/g, '')
      .replace(/\s+/g, '-');
    // @ts-ignore
    const { data, error } = await this.runWithServiceFallback<BlogArticle>((client) =>
      (client as any)
        .from('blog_articles')
        .insert([{ ...article, slug }])
        .select()
        .maybeSingle()
    );
    if (error) throw error;
    return data;
  }

  // ========== 5. Update ==========
  async updateArticle(id: string, updates: Partial<BlogArticle>): Promise<BlogArticle> {
    // If the title is changed, update the slug as well.
    let newSlug = updates.slug;
    if (updates.title) {
      newSlug = updates.title
        .toLowerCase()
        .replace(/[^a-zA-Z0-9 ]/g, '')
        .replace(/\s+/g, '-');
    }
    // @ts-ignore
    const { data, error } = await this.runWithServiceFallback<BlogArticle>((client) =>
      (client as any)
        .from('blog_articles')
        .update({ ...updates, slug: newSlug, updated_at: new Date().toISOString() })
        .eq('id', id)
        .select()
        .maybeSingle()
    );
    if (error) throw error;
    return data;
  }

  // ========== 6. Delete ==========
  async deleteArticle(id: string): Promise<void> {
    // @ts-ignore
    const { error } = await this.runWithServiceFallback<BlogArticle>((client) =>
      (client as any)
        .from('blog_articles')
        .delete()
        .eq('id', id)
    );
    if (error) throw error;
    return;
  }

  // ========== 7. MIGRATION: Transfer from localStorage ==========
  async migrateLocalStorageArticles(localArticles: any[]): Promise<void> {
    for (const local of localArticles) {
      // Ensure unique article (skip if title and content match existing)
      // @ts-ignore
      const { data } = await this.runWithServiceFallback<{ id: string }>((client) =>
        (client as any)
          .from('blog_articles')
          .select('id')
          .eq('title', local.title)
          .maybeSingle()
      );
      if (!data) {
        // Insert (fallback: 'published' if not marked)
        const slug = local.title
          .toLowerCase()
          .replace(/[^a-zA-Z0-9 ]/g, '')
          .replace(/\s+/g, '-');
        await this.addArticle({
          ...local,
          status: local.status === "published" ? "published" : "draft",
          image_url: local.image || null,
          read_time: local.readTime ?? null,
          slug,
        });
      }
    }
  }
}

export const blogService = new BlogService();
