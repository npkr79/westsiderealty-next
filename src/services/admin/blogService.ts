
export interface BlogArticle {
  id: string;
  title: string;
  excerpt: string;
  content: string;
  date: string;
  image: string;
}

class BlogService {
  private static instance: BlogService;
  public static getInstance(): BlogService {
    if (!BlogService.instance) {
      BlogService.instance = new BlogService();
    }
    return BlogService.instance;
  }

  getBlogArticles(): BlogArticle[] {
    const articles = localStorage.getItem('blogArticles');
    if (!articles) {
      const defaultArticles: BlogArticle[] = [
        {
          id: '1',
          title: 'Top 3 Gated Communities to Buy in West Hyderabad',
          excerpt: 'Discover the most sought-after gated communities in West Hyderabad offering premium amenities and excellent connectivity.',
          content: 'Detailed analysis of premium gated communities in West Hyderabad...',
          date: '2024-01-15',
          image: '/placeholder.svg'
        },
        {
          id: '2',
          title: 'Buying Holiday Villas in Goa: What to Know Before You Invest',
          excerpt: 'A comprehensive guide to investing in Goa holiday properties with tips on location, legalities, and rental potential.',
          content: 'Complete guide to Goa property investment...',
          date: '2024-01-10',
          image: '/placeholder.svg'
        },
        {
          id: '3',
          title: 'Dubai Real Estate Investment: A Beginner\'s Guide for Indians',
          excerpt: 'Everything Indian investors need to know about investing in Dubai real estate, from regulations to ROI expectations.',
          content: 'Dubai investment guide for Indian investors...',
          date: '2024-01-05',
          image: '/placeholder.svg'
        }
      ];
      this.saveBlogArticles(defaultArticles);
      return defaultArticles;
    }
    return JSON.parse(articles);
  }

  saveBlogArticles(articles: BlogArticle[]): void {
    localStorage.setItem('blogArticles', JSON.stringify(articles));
  }

  addBlogArticle(article: Omit<BlogArticle, 'id'>): void {
    const articles = this.getBlogArticles();
    const newArticle = {
      ...article,
      id: Date.now().toString()
    };
    articles.unshift(newArticle);
    this.saveBlogArticles(articles);
  }

  updateBlogArticle(id: string, article: Omit<BlogArticle, 'id'>): void {
    const articles = this.getBlogArticles();
    const index = articles.findIndex(a => a.id === id);
    if (index !== -1) {
      articles[index] = { ...article, id };
      this.saveBlogArticles(articles);
    }
  }

  deleteBlogArticle(id: string): void {
    const articles = this.getBlogArticles();
    const filtered = articles.filter(a => a.id !== id);
    this.saveBlogArticles(filtered);
  }
}

export const blogService = BlogService.getInstance();
