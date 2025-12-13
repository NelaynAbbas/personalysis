import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Pencil, Trash2, Plus, Tag, Check, X, ArrowUpDown, Search } from 'lucide-react';

// Define TypeScript interfaces
interface BlogArticle {
  id: number;
  title: string;
  slug: string;
  excerpt: string;
  content: string;
  // include 'scheduled' because the form uses it
  status: "published" | "draft" | "archived" | "scheduled";
  category: string;
  tags: string[];
  authorId: number;
  authorName: string;
  publishedAt: string | null;
  scheduledPublishDate: string | null;
  createdAt: string;
  updatedAt: string;
  featuredImage: string | null;
  viewCount: number;
  seo: {
    metaTitle: string | null;
    metaDescription: string | null;
    ogImage: string | null;
  };
}


interface BlogCategory {
  id: number;
  name: string;
  slug: string;
  description: string | null;
  articleCount: number;
}

// Define schemas for forms
const articleFormSchema = z.object({
  title: z.string().min(5, "Title must be at least 5 characters"),
  slug: z.string().min(3, "Slug must be at least 3 characters"),
  excerpt: z.string().min(10, "Excerpt must be at least 10 characters"),
  content: z.string().min(50, "Content must be at least 50 characters"),
  status: z.enum(["published", "draft", "archived", "scheduled"]),
  category: z.string().min(1, "Category is required"),
  tags: z.string().optional(),
  featuredImage: z.string().optional(),
  scheduledPublishDate: z.string().optional(),
  metaTitle: z.string().optional(),
  metaDescription: z.string().optional(),
  ogImage: z.string().optional()
});

const categoryFormSchema = z.object({
  name: z.string().min(3, "Category name must be at least 3 characters"),
  slug: z.string().min(3, "Slug must be at least 3 characters"),
  description: z.string().optional()
});

type ArticleFormValues = z.infer<typeof articleFormSchema>;
type CategoryFormValues = z.infer<typeof categoryFormSchema>;

// Mock data for development
const mockArticles: BlogArticle[] = [
  {
    id: 1,
    title: "Understanding Personality Traits in the Workplace",
    slug: "understanding-personality-traits-workplace",
    excerpt: "Learn how personality traits affect workplace dynamics and team performance.",
    content: "This is the full content of the article about workplace personality traits...",
    status: "published",
    category: "Workplace Psychology",
    tags: ["workplace", "personality", "team dynamics"],
    authorId: 1,
    authorName: "Dr. Sarah Johnson",
    publishedAt: "2025-03-15T14:30:00Z",
    scheduledPublishDate: null,
    createdAt: "2025-03-10T11:20:00Z",
    updatedAt: "2025-03-15T14:30:00Z",
    featuredImage: "/blog/workplace-traits.jpg",
    viewCount: 1250,
    seo: {
      metaTitle: "Understanding Personality Traits in the Modern Workplace",
      metaDescription: "Discover how personality traits influence workplace dynamics, team performance, and productivity in the modern business environment.",
      ogImage: "/blog/workplace-traits-social.jpg"
    }
  },
  {
    id: 2,
    title: "The Future of Personality Assessments in Hiring",
    slug: "future-personality-assessments-hiring",
    excerpt: "Explore how modern personality assessments are changing the hiring landscape.",
    content: "This is the full content about the future of hiring and assessments...",
    status: "published",
    category: "HR Trends",
    tags: ["hiring", "assessments", "HR", "future trends"],
    authorId: 2,
    authorName: "Michael Thompson",
    publishedAt: "2025-03-20T09:15:00Z",
    scheduledPublishDate: null,
    createdAt: "2025-03-18T16:45:00Z",
    updatedAt: "2025-03-20T09:15:00Z",
    featuredImage: "/blog/hiring-trends.jpg",
    viewCount: 980,
    seo: {
      metaTitle: "The Future of Personality Assessments in Modern Hiring Practices",
      metaDescription: "Learn how AI-powered personality assessments are revolutionizing recruitment and hiring processes for HR professionals in 2025.",
      ogImage: "/blog/hiring-trends-social.jpg"
    }
  },
  {
    id: 3,
    title: "Integrating Personality Data with Business Intelligence",
    slug: "integrating-personality-data-business-intelligence",
    excerpt: "Discover how combining personality insights with business data drives better decisions.",
    content: "This is the full content about integrating personality data with BI tools...",
    status: "draft",
    category: "Business Intelligence",
    tags: ["data integration", "business intelligence", "analytics"],
    authorId: 1,
    authorName: "Dr. Sarah Johnson",
    publishedAt: null,
    scheduledPublishDate: "2025-05-15T09:00:00Z",
    createdAt: "2025-04-01T10:30:00Z",
    updatedAt: "2025-04-05T15:20:00Z",
    featuredImage: "/blog/data-integration.jpg",
    viewCount: 0,
    seo: {
      metaTitle: "The Power of Integrating Personality Insights with Business Intelligence",
      metaDescription: "Learn how organizations can gain competitive advantage by combining personality data with business intelligence tools for data-driven decision making.",
      ogImage: "/blog/data-integration-social.jpg"
    }
  },
  {
    id: 4,
    title: "Ethical Considerations in Personality Profiling",
    slug: "ethical-considerations-personality-profiling",
    excerpt: "Explore the ethical dimensions of using personality data in business settings.",
    content: "This is the full content about ethics in personality profiling...",
    status: "published",
    category: "Ethics & Compliance",
    tags: ["ethics", "data privacy", "compliance", "best practices"],
    authorId: 3,
    authorName: "Dr. James Wilson",
    publishedAt: "2025-03-28T11:00:00Z",
    scheduledPublishDate: null,
    createdAt: "2025-03-25T09:45:00Z",
    updatedAt: "2025-03-28T11:00:00Z",
    featuredImage: "/blog/ethics-profiling.jpg",
    viewCount: 1560,
    seo: {
      metaTitle: "Ethical Considerations in Modern Personality Profiling",
      metaDescription: "Examine the ethical implications of using personality data in business contexts, including privacy concerns, consent, and responsible use of assessment results.",
      ogImage: "/blog/ethics-profiling-social.jpg"
    }
  },
  {
    id: 5,
    title: "Measuring ROI from Personality Analysis Tools",
    slug: "measuring-roi-personality-analysis-tools",
    excerpt: "Learn how to calculate return on investment from personality assessment initiatives.",
    content: "This is the full content about ROI measurement for personality tools...",
    status: "draft",
    category: "Business Intelligence",
    tags: ["ROI", "metrics", "business case", "assessment tools"],
    authorId: 2,
    authorName: "Michael Thompson",
    publishedAt: null,
    scheduledPublishDate: null,
    createdAt: "2025-02-05T16:30:00Z",
    updatedAt: "2025-04-01T09:15:00Z",
    featuredImage: "/blog/roi-measurement.jpg",
    viewCount: 0,
    seo: {
      metaTitle: "Measuring ROI: A Guide to Calculating Value from Personality Analysis Tools",
      metaDescription: "Comprehensive guide for business leaders on how to measure and maximize return on investment from personality assessment initiatives and tools.",
      ogImage: "/blog/roi-measurement-social.jpg"
    }
  }
];

const mockCategories: BlogCategory[] = [
  {
    id: 1,
    name: "Workplace Psychology",
    slug: "workplace-psychology",
    description: "Articles about psychological principles in workplace environments",
    articleCount: 1
  },
  {
    id: 2,
    name: "HR Trends",
    slug: "hr-trends",
    description: "Latest developments and trends in human resources",
    articleCount: 1
  },
  {
    id: 3,
    name: "Business Intelligence",
    slug: "business-intelligence",
    description: "Content about data analysis and business insights",
    articleCount: 2
  },
  {
    id: 4,
    name: "Ethics & Compliance",
    slug: "ethics-compliance",
    description: "Ethical considerations in personality assessment",
    articleCount: 1
  }
];

const BlogManagement = () => {
  const [activeTab, setActiveTab] = useState("articles");
  const [isArticleDialogOpen, setIsArticleDialogOpen] = useState(false);
  const [isCategoryDialogOpen, setIsCategoryDialogOpen] = useState(false);
  const [editingArticle, setEditingArticle] = useState<BlogArticle | null>(null);
  const [editingCategory, setEditingCategory] = useState<BlogCategory | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string | null>(null);
  const [categoryFilter, setCategoryFilter] = useState<string | null>(null);
  const { toast } = useToast();

  // Forms setup
  const articleForm = useForm<ArticleFormValues>({
    resolver: zodResolver(articleFormSchema),
    defaultValues: {
      title: "",
      slug: "",
      excerpt: "",
      content: "",
      status: "draft",
      category: "",
      tags: "",
      featuredImage: "",
      scheduledPublishDate: "",
      metaTitle: "",
      metaDescription: "",
      ogImage: ""
    }
  });

  const categoryForm = useForm<CategoryFormValues>({
    resolver: zodResolver(categoryFormSchema),
    defaultValues: {
      name: "",
      slug: "",
      description: ""
    }
  });

// Fetch articles from API
const { data: articles = [] as BlogArticle[] } = useQuery<BlogArticle[]>({
  queryKey: ['admin', 'blog', 'articles'],
  queryFn: async () => {
    try {
      const response = await apiRequest('GET', '/api/blog/articles');
      const data = await response.json();

      // Handle different response formats
      const articlesData = Array.isArray(data) ? data : (data?.data ? data.data : []);

      // Transform the data to match frontend expectations
      return articlesData.map((article: any) => ({
        id: article.id,
        title: article.title,
        slug: article.slug,
        excerpt: article.excerpt,
        content: article.content,
        status: article.status,
        category: article.categoryName || article.category?.name || 'Uncategorized', // Handle category name
        tags: article.tags || [],
        authorId: article.authorId || 1,
        authorName: article.authorName || 'Admin',
        publishedAt: article.publishedAt,
        scheduledPublishDate: article.scheduledPublishDate,
        createdAt: article.createdAt,
        updatedAt: article.updatedAt,
        featuredImage: article.featuredImage,
        viewCount: article.viewCount || 0,
        seo: article.seo || {
          metaTitle: null,
          metaDescription: null,
          ogImage: null
        }
      }));
    } catch (error) {
      console.error('Error fetching articles:', error);
      return [];
    }
  },
  enabled: activeTab === "articles"
});

// Fetch categories from API
const { data: categories = [] as BlogCategory[] } = useQuery<BlogCategory[]>({
  queryKey: ['admin', 'blog', 'categories'],
  queryFn: async () => {
    try {
      const response = await apiRequest('GET', '/api/blog/categories');
      const data = await response.json();
      return Array.isArray(data) ? data : (data?.data ? data.data : []);
    } catch (error) {
      console.error('Error fetching categories:', error);
      return [];
    }
  },
  enabled: activeTab === "categories" || activeTab === "articles"
});

  // Filter articles based on search and filters
  const filteredArticles = articles.filter(article => {
    const matchesSearch = searchTerm === "" || 
      article.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      article.excerpt.toLowerCase().includes(searchTerm.toLowerCase()) ||
      article.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()));
    
    const matchesStatus = statusFilter === null || article.status === statusFilter;
    const matchesCategory = categoryFilter === null || article.category === categoryFilter;
    
    return matchesSearch && matchesStatus && matchesCategory;
  });

  // Create or update article
  const handleArticleSubmit = async (data: ArticleFormValues) => {
    try {
      // Convert comma-separated tags to array
      const tagsArray = data.tags ? data.tags.split(',').map(tag => tag.trim()) : [];

      // Prepare SEO data
      const seoData = {
        metaTitle: data.metaTitle || data.title,
        metaDescription: data.metaDescription || data.excerpt,
        ogImage: data.ogImage || data.featuredImage || null
      };

      // Determine publish status
      let status = data.status;
      let publishedAt = null;
      let scheduledPublishDate = null;

      if (status === 'published') {
        publishedAt = new Date().toISOString();
      } else if (data.scheduledPublishDate) {
        status = 'scheduled';
        scheduledPublishDate = new Date(data.scheduledPublishDate).toISOString();
      }

      const payload = {
        title: data.title,
        slug: data.slug,
        excerpt: data.excerpt,
        content: data.content,
        status: status,
        categoryId: categories.find(cat => cat.name === data.category)?.id || 1,
        tags: tagsArray,
        featuredImage: data.featuredImage || null,
        scheduledPublishDate: scheduledPublishDate,
        publishedAt: publishedAt,
        seo: seoData
      };

      if (editingArticle) {
        // Update existing article
        await apiRequest('PUT', `/api/blog/articles/${editingArticle.id}`, payload);

        toast({
          title: "Article updated",
          description: "The article has been updated successfully",
          variant: "default"
        });
      } else {
        // Create new article
        await apiRequest('POST', '/api/blog/articles', payload);

        toast({
          title: "Article created",
          description: "The article has been created successfully",
          variant: "default"
        });
      }

      // Reset form and close dialog
      articleForm.reset();
      setIsArticleDialogOpen(false);
      setEditingArticle(null);

      // Invalidate the query cache to refresh the data
      // Note: This would need react-query client access in a real implementation
      window.location.reload(); // Temporary solution to refresh data
    } catch (error) {
      console.error("Error saving article:", error);
      toast({
        title: "Error",
        description: "Failed to save the article",
        variant: "destructive"
      });
    }
  };

  // Create or update category
  const handleCategorySubmit = async (data: CategoryFormValues) => {
    try {
      if (editingCategory) {
        // Update existing category
        await apiRequest('PUT', `/api/blog/categories/${editingCategory.id}`, data);

        toast({
          title: "Category updated",
          description: "The category has been updated successfully",
          variant: "default"
        });
      } else {
        // Create new category
        await apiRequest('POST', '/api/blog/categories', data);

        toast({
          title: "Category created",
          description: "The category has been created successfully",
          variant: "default"
        });
      }

      // Reset form and close dialog
      categoryForm.reset();
      setIsCategoryDialogOpen(false);
      setEditingCategory(null);

      // Refresh the page to update the data
      window.location.reload(); // Temporary solution to refresh data
    } catch (error) {
      console.error("Error saving category:", error);
      toast({
        title: "Error",
        description: "Failed to save the category",
        variant: "destructive"
      });
    }
  };

  // Delete article
  const handleDeleteArticle = async (id: number) => {
    try {
      await apiRequest('DELETE', `/api/blog/articles/${id}`);

      toast({
        title: "Article deleted",
        description: "The article has been deleted successfully",
        variant: "default"
      });

      // Refresh the page to update the data
      window.location.reload(); // Temporary solution to refresh data
    } catch (error) {
      console.error("Error deleting article:", error);
      toast({
        title: "Error",
        description: "Failed to delete the article",
        variant: "destructive"
      });
    }
  };

  // Delete category
  const handleDeleteCategory = async (id: number) => {
    try {
      await apiRequest('DELETE', `/api/blog/categories/${id}`);

      toast({
        title: "Category deleted",
        description: "The category has been deleted successfully",
        variant: "default"
      });

      // Refresh the page to update the data
      window.location.reload(); // Temporary solution to refresh data
    } catch (error) {
      console.error("Error deleting category:", error);
      toast({
        title: "Error",
        description: "Failed to delete the category",
        variant: "destructive"
      });
    }
  };

  // Edit article
  const handleEditArticle = (article: BlogArticle) => {
    setEditingArticle(article);
    
    articleForm.reset({
      title: article.title,
      slug: article.slug,
      excerpt: article.excerpt,
      content: article.content,
      status: article.status,
      category: article.category,
      tags: article.tags.join(', '),
      featuredImage: article.featuredImage || "",
      scheduledPublishDate: article.scheduledPublishDate || "",
      metaTitle: article.seo?.metaTitle || "",
      metaDescription: article.seo?.metaDescription || "",
      ogImage: article.seo?.ogImage || ""
    });
    
    setIsArticleDialogOpen(true);
  };

  // Edit category
  const handleEditCategory = (category: BlogCategory) => {
    setEditingCategory(category);
    
    categoryForm.reset({
      name: category.name,
      slug: category.slug,
      description: category.description || ""
    });
    
    setIsCategoryDialogOpen(true);
  };

  // Status badge renderer
  const renderStatusBadge = (status: string) => {
    switch (status) {
      case 'published':
        return <Badge className="bg-green-500">Published</Badge>;
      case 'draft':
        return <Badge className="bg-yellow-500">Draft</Badge>;
      case 'archived':
        return <Badge className="bg-gray-500">Archived</Badge>;
      default:
        return <Badge>{status}</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <div className="flex justify-between items-center mb-4">
          <TabsList>
            <TabsTrigger value="articles">Articles</TabsTrigger>
            <TabsTrigger value="categories">Categories</TabsTrigger>
          </TabsList>
          {activeTab === "articles" ? (
            <Dialog open={isArticleDialogOpen} onOpenChange={setIsArticleDialogOpen}>
              <DialogTrigger asChild>
                <Button onClick={() => {
                  setEditingArticle(null);
                  articleForm.reset({
                    title: "",
                    slug: "",
                    excerpt: "",
                    content: "",
                    status: "draft",
                    category: "",
                    tags: "",
                    featuredImage: "",
                    scheduledPublishDate: "",
                    metaTitle: "",
                    metaDescription: "",
                    ogImage: ""
                  });
                }}>
                  <Plus className="h-4 w-4 mr-2" /> New Article
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl">
                <DialogHeader>
                  <DialogTitle>{editingArticle ? "Edit Article" : "Create New Article"}</DialogTitle>
                  <DialogDescription>
                    {editingArticle 
                      ? "Edit the details of your blog article" 
                      : "Fill in the details to create a new blog article"}
                  </DialogDescription>
                </DialogHeader>
                
                <Form {...articleForm}>
                  <form onSubmit={articleForm.handleSubmit(handleArticleSubmit)} className="space-y-4">
                    <FormField
                      control={articleForm.control}
                      name="title"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Title</FormLabel>
                          <FormControl>
                            <Input placeholder="Article title" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={articleForm.control}
                      name="slug"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Slug</FormLabel>
                          <FormControl>
                            <Input placeholder="article-url-slug" {...field} />
                          </FormControl>
                          <FormDescription>The URL-friendly version of the title</FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <div className="grid grid-cols-2 gap-4">
                      <FormField
                        control={articleForm.control}
                        name="status"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Status</FormLabel>
                            <Select 
                              onValueChange={field.onChange} 
                              defaultValue={field.value}
                            >
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="Select status" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                <SelectItem value="draft">Draft</SelectItem>
                                <SelectItem value="published">Published</SelectItem>
                                <SelectItem value="archived">Archived</SelectItem>
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={articleForm.control}
                        name="category"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Category</FormLabel>
                            <Select 
                              onValueChange={field.onChange} 
                              defaultValue={field.value}
                            >
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="Select category" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                {categories.map(category => (
                                  <SelectItem key={category.id} value={category.name}>
                                    {category.name}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                    
                    <FormField
                      control={articleForm.control}
                      name="excerpt"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Excerpt</FormLabel>
                          <FormControl>
                            <Textarea 
                              placeholder="Brief summary of the article" 
                              className="h-20"
                              {...field} 
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={articleForm.control}
                      name="content"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Content</FormLabel>
                          <FormControl>
                            <Textarea 
                              placeholder="Full article content" 
                              className="h-40"
                              {...field} 
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={articleForm.control}
                      name="tags"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Tags</FormLabel>
                          <FormControl>
                            <Input 
                              placeholder="personality, workplace, assessment" 
                              {...field} 
                            />
                          </FormControl>
                          <FormDescription>Comma-separated list of tags</FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={articleForm.control}
                      name="featuredImage"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Featured Image URL</FormLabel>
                          <FormControl>
                            <Input 
                              placeholder="/images/featured-image.jpg" 
                              {...field} 
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={articleForm.control}
                      name="scheduledPublishDate"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Scheduled Publish Date</FormLabel>
                          <FormControl>
                            <Input 
                              type="datetime-local"
                              {...field} 
                            />
                          </FormControl>
                          <FormDescription>Leave empty for immediate publishing</FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <Separator className="my-4" />
                    
                    <div className="space-y-2">
                      <h3 className="text-lg font-medium">SEO Settings</h3>
                      <p className="text-sm text-muted-foreground">
                        Optimize your article for search engines
                      </p>
                    </div>
                    
                    <FormField
                      control={articleForm.control}
                      name="metaTitle"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Meta Title</FormLabel>
                          <FormControl>
                            <Input 
                              placeholder="SEO-optimized title (displays in search results)" 
                              {...field} 
                            />
                          </FormControl>
                          <FormDescription>Leave empty to use the article title</FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={articleForm.control}
                      name="metaDescription"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Meta Description</FormLabel>
                          <FormControl>
                            <Textarea 
                              placeholder="Brief description for search engines" 
                              className="h-20"
                              {...field} 
                            />
                          </FormControl>
                          <FormDescription>Leave empty to use the excerpt</FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={articleForm.control}
                      name="ogImage"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Social Media Image URL</FormLabel>
                          <FormControl>
                            <Input 
                              placeholder="/images/og-image.jpg" 
                              {...field} 
                            />
                          </FormControl>
                          <FormDescription>Image shown when shared on social media (leave empty to use featured image)</FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <DialogFooter>
                      <Button type="button" variant="outline" onClick={() => setIsArticleDialogOpen(false)}>
                        Cancel
                      </Button>
                      <Button type="submit">
                        {editingArticle ? "Update Article" : "Create Article"}
                      </Button>
                    </DialogFooter>
                  </form>
                </Form>
              </DialogContent>
            </Dialog>
          ) : (
            <Dialog open={isCategoryDialogOpen} onOpenChange={setIsCategoryDialogOpen}>
              <DialogTrigger asChild>
                <Button onClick={() => {
                  setEditingCategory(null);
                  categoryForm.reset({
                    name: "",
                    slug: "",
                    description: ""
                  });
                }}>
                  <Plus className="h-4 w-4 mr-2" /> New Category
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>{editingCategory ? "Edit Category" : "Create New Category"}</DialogTitle>
                  <DialogDescription>
                    {editingCategory 
                      ? "Edit the details of your blog category" 
                      : "Fill in the details to create a new blog category"}
                  </DialogDescription>
                </DialogHeader>
                
                <Form {...categoryForm}>
                  <form onSubmit={categoryForm.handleSubmit(handleCategorySubmit)} className="space-y-4">
                    <FormField
                      control={categoryForm.control}
                      name="name"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Name</FormLabel>
                          <FormControl>
                            <Input placeholder="Category name" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={categoryForm.control}
                      name="slug"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Slug</FormLabel>
                          <FormControl>
                            <Input placeholder="category-slug" {...field} />
                          </FormControl>
                          <FormDescription>The URL-friendly version of the name</FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={categoryForm.control}
                      name="description"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Description</FormLabel>
                          <FormControl>
                            <Textarea 
                              placeholder="Category description" 
                              className="h-20"
                              {...field} 
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <DialogFooter>
                      <Button type="button" variant="outline" onClick={() => setIsCategoryDialogOpen(false)}>
                        Cancel
                      </Button>
                      <Button type="submit">
                        {editingCategory ? "Update Category" : "Create Category"}
                      </Button>
                    </DialogFooter>
                  </form>
                </Form>
              </DialogContent>
            </Dialog>
          )}
        </div>
        
        <TabsContent value="articles" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Blog Articles</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col gap-4">
                {/* Search and filters */}
                <div className="flex flex-col sm:flex-row gap-4">
                  <div className="relative flex-1">
                    <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Search articles..."
                      className="pl-8"
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                    />
                  </div>
                  <Select
                    value={statusFilter || "all"}
                    onValueChange={(value) => setStatusFilter(value === "all" ? null : value)}
                  >
                    <SelectTrigger className="w-[180px]">
                      <SelectValue placeholder="Filter by status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Statuses</SelectItem>
                      <SelectItem value="published">Published</SelectItem>
                      <SelectItem value="draft">Draft</SelectItem>
                      <SelectItem value="archived">Archived</SelectItem>
                    </SelectContent>
                  </Select>
                  <Select
                    value={categoryFilter || "all"}
                    onValueChange={(value) => setCategoryFilter(value === "all" ? null : value)}
                  >
                    <SelectTrigger className="w-[180px]">
                      <SelectValue placeholder="Filter by category" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Categories</SelectItem>
                      {categories.map(category => (
                        <SelectItem key={category.id} value={category.name}>
                          {category.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                {/* Articles Table */}
                <div className="rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-[400px]">Title</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Category</TableHead>
                        <TableHead className="text-right">Views</TableHead>
                        <TableHead>Published</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredArticles.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={6} className="h-24 text-center">
                            No articles found.
                          </TableCell>
                        </TableRow>
                      ) : (
                        filteredArticles.map((article) => (
                          <TableRow key={article.id}>
                            <TableCell className="font-medium">
                              <div>
                                {article.title}
                                <div className="text-xs text-muted-foreground">
                                  {article.excerpt.substring(0, 50)}...
                                </div>
                              </div>
                            </TableCell>
                            <TableCell>
                              {renderStatusBadge(article.status)}
                            </TableCell>
                            <TableCell>{article.category}</TableCell>
                            <TableCell className="text-right">{article.viewCount}</TableCell>
                            <TableCell>
                              {article.publishedAt 
                                ? new Date(article.publishedAt).toLocaleDateString() 
                                : "-"}
                            </TableCell>
                            <TableCell className="text-right">
                              <div className="flex justify-end gap-2">
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => handleEditArticle(article)}
                                >
                                  <Pencil className="h-4 w-4" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => handleDeleteArticle(article.id)}
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="categories" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Blog Categories</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-[200px]">Name</TableHead>
                      <TableHead>Slug</TableHead>
                      <TableHead>Description</TableHead>
                      <TableHead className="text-right">Articles</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {categories.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={5} className="h-24 text-center">
                          No categories found.
                        </TableCell>
                      </TableRow>
                    ) : (
                      categories.map((category) => (
                        <TableRow key={category.id}>
                          <TableCell className="font-medium">{category.name}</TableCell>
                          <TableCell>{category.slug}</TableCell>
                          <TableCell>{category.description || "-"}</TableCell>
                          <TableCell className="text-right">{category.articleCount}</TableCell>
                          <TableCell className="text-right">
                            <div className="flex justify-end gap-2">
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => handleEditCategory(category)}
                              >
                                <Pencil className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => handleDeleteCategory(category.id)}
                                disabled={category.articleCount > 0}
                                title={category.articleCount > 0 ? "Cannot delete category with articles" : "Delete category"}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default BlogManagement;
