import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { useTranslation } from "react-i18next";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { Calendar, Clock, Search, Tag, User } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";

// Reuse the same interfaces from BlogManagement
interface BlogArticle {
  id: number;
  title: string;
  slug: string;
  excerpt: string;
  content: string;
  status: "published" | "draft" | "archived";
  category: string;
  tags: string[];
  authorId: number;
  authorName: string;
  publishedAt: string | null;
  createdAt: string;
  updatedAt: string;
  featuredImage: string | null;
  viewCount: number;
}

interface BlogCategory {
  id: number;
  name: string;
  slug: string;
  description: string | null;
  articleCount: number;
}

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
    createdAt: "2025-03-10T11:20:00Z",
    updatedAt: "2025-03-15T14:30:00Z",
    featuredImage: "https://placehold.co/600x400/blue/white?text=Workplace+Traits",
    viewCount: 1250
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
    createdAt: "2025-03-18T16:45:00Z",
    updatedAt: "2025-03-20T09:15:00Z",
    featuredImage: "https://placehold.co/600x400/purple/white?text=Hiring+Trends",
    viewCount: 980
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
    createdAt: "2025-04-01T10:30:00Z",
    updatedAt: "2025-04-05T15:20:00Z",
    featuredImage: "https://placehold.co/600x400/green/white?text=Data+Integration",
    viewCount: 0
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
    createdAt: "2025-03-25T09:45:00Z",
    updatedAt: "2025-03-28T11:00:00Z",
    featuredImage: "https://placehold.co/600x400/orange/white?text=Ethics+Profiling",
    viewCount: 1560
  },
  {
    id: 5,
    title: "Measuring ROI from Personality Analysis Tools",
    slug: "measuring-roi-personality-analysis-tools",
    excerpt: "Learn how to calculate return on investment from personality assessment initiatives.",
    content: "This is the full content about ROI measurement for personality tools...",
    status: "archived",
    category: "Business Intelligence",
    tags: ["ROI", "metrics", "business case", "assessment tools"],
    authorId: 2,
    authorName: "Michael Thompson",
    publishedAt: "2025-02-10T13:45:00Z",
    createdAt: "2025-02-05T16:30:00Z",
    updatedAt: "2025-04-01T09:15:00Z",
    featuredImage: "https://placehold.co/600x400/red/white?text=ROI+Measurement",
    viewCount: 720
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

const ArticleCard = ({ article }: { article: BlogArticle }) => {
  const [, navigate] = useLocation();
  const { t } = useTranslation();

  return (
    <Card className="h-full flex flex-col">
      {article.featuredImage && (
        <div className="h-48 w-full overflow-hidden">
          <img
            src={article.featuredImage}
            alt={article.title}
            className="w-full h-full object-cover transition-transform hover:scale-105"
          />
        </div>
      )}
      <CardHeader>
        <div className="flex flex-row justify-between items-start gap-2 mb-2">
          <Badge>{article.category}</Badge>
          <div className="flex items-center text-xs text-muted-foreground">
            <Calendar className="h-3 w-3 mr-1" />
            {new Date(article.publishedAt!).toLocaleDateString()}
          </div>
        </div>
        <CardTitle className="text-xl">{article.title}</CardTitle>
        <CardDescription className="line-clamp-2">{article.excerpt}</CardDescription>
      </CardHeader>
      <CardContent className="flex-grow">
        <div className="flex flex-wrap gap-1 mb-4">
          {article.tags.map((tag, i) => (
            <Badge key={i} variant="outline" className="text-xs">{tag}</Badge>
          ))}
        </div>
      </CardContent>
      <CardFooter className="flex justify-between items-center pt-2">
        <div className="flex items-center text-sm text-muted-foreground">
          <User className="h-4 w-4 mr-1" />
          {article.authorName}
        </div>
        <Button
          variant="link"
          className="p-0"
          onClick={() => navigate(`/blog/${article.slug}`)}
        >
          {t('pages.blog.readMore')}
        </Button>
      </CardFooter>
    </Card>
  );
};

const Blog = () => {
  const [, navigate] = useLocation();
  const { t } = useTranslation();
  const [searchTerm, setSearchTerm] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<string | null>(null);
  
  const { data: articles = [] } = useQuery({
    queryKey: ['blog', 'articles'],
    queryFn: async () => {
      try {
        const response = await apiRequest('GET', '/api/blog/articles/published');
        const data = await response.json();
        return Array.isArray(data) ? data : (data?.data ? data.data : []);
      } catch (error) {
        console.error('Error fetching published articles:', error);
        return [];
      }
    }
  });

  const { data: categories = [] } = useQuery({
    queryKey: ['blog', 'categories'],
    queryFn: async () => {
      try {
        const response = await apiRequest('GET', '/api/blog/categories');
        const data = await response.json();
        return Array.isArray(data) ? data : (data?.data ? data.data : []);
      } catch (error) {
        console.error('Error fetching categories:', error);
        return [];
      }
    }
  });
  
  // Filter articles based on search and category
  const filteredArticles = articles.filter((article: BlogArticle) => {
    const matchesSearch = searchTerm === "" ||
      article.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      article.excerpt.toLowerCase().includes(searchTerm.toLowerCase()) ||
      article.tags.some((tag: string) => tag.toLowerCase().includes(searchTerm.toLowerCase()));

    const matchesCategory = categoryFilter === null || article.category === categoryFilter;

    return matchesSearch && matchesCategory;
  });
  
  return (
    <div className="container mx-auto py-12 max-w-6xl">
      <div className="text-center mb-12">
        <h1 className="text-4xl font-bold mb-4">{t('pages.blog.title')}</h1>
        <p className="text-xl text-muted-foreground max-w-xl mx-auto">
          {t('pages.blog.subtitle')}
        </p>
      </div>

      <div className="flex flex-col md:flex-row justify-between gap-4 mb-8">
        <div className="relative flex-1">
          <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder={t('pages.blog.searchPlaceholder')}
            className="pl-8"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        <Select
          value={categoryFilter || "all"}
          onValueChange={(value) => setCategoryFilter(value === "all" ? null : value)}
        >
          <SelectTrigger className="w-[200px]">
            <SelectValue placeholder={t('pages.blog.allCategories')} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{t('pages.blog.allCategories')}</SelectItem>
            {categories.map((category: any) => (
              <SelectItem key={category.id} value={category.name}>
                {category.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {filteredArticles.length === 0 ? (
        <div className="text-center py-12">
          <h2 className="text-xl font-semibold">{t('pages.blog.noArticlesFound')}</h2>
          <p className="text-muted-foreground mt-2">{t('pages.blog.tryAdjustingFilters')}</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredArticles.map((article: any) => (
            <ArticleCard key={article.id} article={article} />
          ))}
        </div>
      )}

      <div className="mt-16 border-t pt-8">
        <h2 className="text-2xl font-bold mb-4">{t('pages.blog.categoriesTitle')}</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
          {categories.map((category: any) => (
            <Card
              key={category.id}
              className="hover:shadow-md transition-shadow cursor-pointer"
              onClick={() => setCategoryFilter(category.name)}
            >
              <CardHeader>
                <CardTitle className="text-lg">{category.name}</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground line-clamp-2">
                  {category.description}
                </p>
                <div className="mt-2 text-sm font-medium">
                  {t('pages.blog.articleCount', { count: category.articleCount })}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Blog;
