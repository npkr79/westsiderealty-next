"use client";

import { createClient } from '@/lib/supabase/client';

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

// ========== CLIENT-SIDE BLOG SERVICE ==========
class BlogServiceClient {
  private getSupabase() {
    return createClient();
  }

  // ========== 1. Fetch Published Articles ==========
  async getPublishedArticles(): Promise<BlogArticle[]> {
    const supabase = this.getSupabase();
    const { data, error } = await supabase
      .from('blog_articles')
      .select('*')
      .eq('status', 'published')
      .order('date', { ascending: false });
    if (error) throw error;
    return data || [];
  }

  // ========== 2. Fetch All Articles (Admin) ==========
  async getAllArticles(): Promise<BlogArticle[]> {
    const supabase = this.getSupabase();
    const { data, error } = await supabase
      .from('blog_articles')
      .select('*')
      .order('date', { ascending: false });
    if (error) throw error;
    return data || [];
  }

  // ========== 3. Get by ID ==========
  async getArticleById(id: string): Promise<BlogArticle | null> {
    const supabase = this.getSupabase();
    const { data, error } = await supabase
      .from('blog_articles')
      .select('*')
      .eq('id', id)
      .maybeSingle();
    if (error) throw error;
    return data;
  }

  // ========== 3.1. Get by Slug ==========
  async getArticleBySlug(slug: string): Promise<BlogArticle | null> {
    const supabase = this.getSupabase();
    const { data, error } = await supabase
      .from('blog_articles')
      .select('*')
      .eq('slug', slug)
      .maybeSingle();
    if (error) throw error;
    return data;
  }

  // ========== 4. Add new ==========
  async addArticle(article: Omit<BlogArticle, 'id' | 'created_at' | 'updated_at' | 'slug'>): Promise<BlogArticle> {
    const supabase = this.getSupabase();
    // Generate slug from title
    const slug = (article.title || '')
      .toLowerCase()
      .replace(/[^a-zA-Z0-9 ]/g, '')
      .replace(/\s+/g, '-');
    
    const { data, error } = await supabase
      .from('blog_articles')
      .insert([{ ...article, slug }])
      .select()
      .maybeSingle();
    if (error) throw error;
    if (!data) throw new Error('Failed to create article');
    return data;
  }

  // ========== 5. Update ==========
  async updateArticle(id: string, updates: Partial<BlogArticle>): Promise<BlogArticle> {
    const supabase = this.getSupabase();
    // If the title is changed, update the slug as well.
    let updateData: any = { ...updates, updated_at: new Date().toISOString() };
    
    if (updates.title) {
      updateData.slug = updates.title
        .toLowerCase()
        .replace(/[^a-zA-Z0-9 ]/g, '')
        .replace(/\s+/g, '-');
    }
    
    const { data, error } = await supabase
      .from('blog_articles')
      .update(updateData)
      .eq('id', id)
      .select()
      .maybeSingle();
    if (error) throw error;
    if (!data) throw new Error('Failed to update article');
    return data;
  }

  // ========== 6. Delete ==========
  async deleteArticle(id: string): Promise<void> {
    const supabase = this.getSupabase();
    const { error } = await supabase
      .from('blog_articles')
      .delete()
      .eq('id', id);
    if (error) throw error;
  }
}

export const blogServiceClient = new BlogServiceClient();

