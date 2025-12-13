import React, { useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { useLocation, useParams, Link } from "wouter";
import {
  Card,
  CardContent,
  CardHeader,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Calendar, ArrowLeft, User, Tag, Eye } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";

// Reuse the same interfaces from Blog.tsx
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

// Mock data from Blog.tsx
const mockArticles: BlogArticle[] = [
  {
    id: 1,
    title: "Understanding Personality Traits in the Workplace",
    slug: "understanding-personality-traits-workplace",
    excerpt: "Learn how personality traits affect workplace dynamics and team performance.",
    content: "# Understanding Personality Traits in the Workplace\n\nPersonality traits significantly impact workplace dynamics and team performance. In this article, we explore how understanding these traits can lead to better collaboration and productivity.\n\n## The Big Five Personality Traits\n\nResearch has consistently shown that the Big Five personality traits—extraversion, agreeableness, conscientiousness, neuroticism, and openness to experience—play crucial roles in workplace behavior and outcomes.\n\n### Extraversion\n\nExtraverted employees typically thrive in team environments and client-facing roles. They draw energy from social interactions and often excel in positions that require networking and relationship building.\n\n### Conscientiousness\n\nConscientiousness is one of the strongest predictors of workplace performance. Employees high in this trait tend to be organized, detail-oriented, and reliable. They excel in roles that require adherence to schedules, attention to detail, and methodical approaches.\n\n### Agreeableness\n\nHighly agreeable employees prioritize team harmony and cooperation. They often excel in collaborative environments and can be effective mediators during conflicts.\n\n### Neuroticism\n\nEmployees high in neuroticism (or low in emotional stability) may experience more workplace stress and anxiety. However, they can also be valuable in roles that require risk assessment and careful planning.\n\n### Openness to Experience\n\nEmployees high in openness tend to be creative, curious, and adaptable to change. They often excel in roles that require innovation, creative problem-solving, and adaptation to new situations.\n\n## Leveraging Personality Insights for Team Building\n\nUnderstanding team members' personality traits can be invaluable for team formation and development. By balancing different personality types, managers can create well-rounded teams with complementary strengths.\n\n## Personality Assessment Tools\n\nModern assessment tools provide detailed insights into employees' personality profiles. These tools go beyond basic categorizations and offer nuanced understandings of behavioral tendencies, communication preferences, and work styles.\n\n## Cultural Considerations\n\nIt's important to note that personality expression can vary across cultures. What might be considered assertive in one culture might be perceived as aggressive in another. Effective managers account for these cultural differences when interpreting personality assessments.\n\n## Conclusion\n\nBy understanding the role of personality traits in workplace dynamics, organizations can better leverage their human capital, improve team cohesion, and enhance overall productivity. The key is to view personality differences not as obstacles but as opportunities for complementary strengths and diverse perspectives.",
    status: "published",
    category: "Workplace Psychology",
    tags: ["workplace", "personality", "team dynamics"],
    authorId: 1,
    authorName: "Dr. Sarah Johnson",
    publishedAt: "2025-03-15T14:30:00Z",
    createdAt: "2025-03-10T11:20:00Z",
    updatedAt: "2025-03-15T14:30:00Z",
    featuredImage: "/blog/workplace-traits.jpg",
    viewCount: 1250
  },
  {
    id: 2,
    title: "The Future of Personality Assessments in Hiring",
    slug: "future-personality-assessments-hiring",
    excerpt: "Explore how modern personality assessments are changing the hiring landscape.",
    content: "# The Future of Personality Assessments in Hiring\n\nThe landscape of hiring and recruitment is evolving rapidly, with personality assessments playing an increasingly central role. This article explores how modern assessment techniques are transforming the hiring process and what this means for both employers and candidates.\n\n## Beyond Traditional Assessments\n\nTraditional personality assessments have been used in hiring for decades, but recent advancements have significantly expanded their capabilities and applications. Today's assessments go beyond simple trait identification to provide insights into behavioral tendencies, team compatibility, leadership potential, and cultural fit.\n\n## AI-Powered Assessments\n\nArtificial intelligence has revolutionized personality assessments by enabling more sophisticated analysis of candidate responses. AI algorithms can detect patterns that human evaluators might miss, leading to more accurate predictions of job performance and fit.\n\n### Natural Language Processing\n\nNatural language processing allows assessment tools to analyze candidates' written responses, identifying linguistic patterns that correlate with specific personality traits. This approach provides a more authentic understanding of a candidate's personality than traditional multiple-choice assessments.\n\n### Behavioral Analysis\n\nAdvanced assessment tools now incorporate behavioral analysis, examining how candidates respond to simulated workplace scenarios. This approach offers insights into decision-making processes, problem-solving abilities, and interpersonal skills in context.\n\n## Ethical Considerations\n\nAs personality assessments become more pervasive in hiring, ethical considerations become increasingly important. Organizations must ensure that assessments don't inadvertently discriminate against certain demographic groups and that they respect candidates' privacy.\n\n## Candidate Experience\n\nModern personality assessments are being designed with the candidate experience in mind. Engaging, interactive assessment formats not only provide better data but also create a positive impression of the hiring organization.\n\n## Continuous Assessment\n\nThe future of personality assessment extends beyond the hiring process. Continuous assessment throughout an employee's tenure can inform professional development, team composition, and succession planning.\n\n## Conclusion\n\nPersonality assessments are no longer just a hiring tool but a comprehensive approach to understanding and optimizing human potential in the workplace. As these technologies continue to evolve, they will offer increasingly valuable insights for both organizations and individuals navigating the complex landscape of modern work.",
    status: "published",
    category: "HR Trends",
    tags: ["hiring", "assessments", "HR", "future trends"],
    authorId: 2,
    authorName: "Michael Thompson",
    publishedAt: "2025-03-20T09:15:00Z",
    createdAt: "2025-03-18T16:45:00Z",
    updatedAt: "2025-03-20T09:15:00Z",
    featuredImage: "/blog/hiring-trends.jpg",
    viewCount: 980
  },
  {
    id: 4,
    title: "Ethical Considerations in Personality Profiling",
    slug: "ethical-considerations-personality-profiling",
    excerpt: "Explore the ethical dimensions of using personality data in business settings.",
    content: "# Ethical Considerations in Personality Profiling\n\nAs personality profiling becomes increasingly prevalent in business settings, it brings with it a host of ethical considerations. This article examines key ethical dimensions that organizations should consider when implementing personality assessment programs.\n\n## Privacy and Consent\n\nOne of the most fundamental ethical considerations in personality profiling is respect for individual privacy. Organizations must obtain informed consent before collecting personality data, clearly explaining how the data will be used, who will have access to it, and how long it will be retained.\n\n## Data Security\n\nPersonality data is sensitive personal information that requires robust security measures. Organizations must implement appropriate technical and organizational safeguards to protect this data from unauthorized access, disclosure, alteration, or destruction.\n\n## Bias and Fairness\n\nPersonality assessments must be designed and implemented in ways that minimize bias and ensure fairness across different demographic groups. This includes regular validation studies to identify and address any potential adverse impact on protected groups.\n\n### Assessment Design\n\nThe design of personality assessments should incorporate considerations of cultural sensitivity and linguistic accessibility. Assessments should be validated across diverse populations to ensure they measure the intended constructs consistently regardless of a person's background.\n\n### Interpretation and Application\n\nEven well-designed assessments can be misused if the results are interpreted or applied inappropriately. Organizations should ensure that those interpreting assessment results are properly trained and understand the limitations of the tools they're using.\n\n## Transparency and Accountability\n\nOrganizations should be transparent about how personality data influences decisions. Individuals have a right to understand how their assessment results are being used and to challenge decisions that they believe are based on inaccurate or inappropriately applied data.\n\n## Right to Be Forgotten\n\nIn many jurisdictions, individuals have a right to have their personal data erased under certain circumstances. Organizations should have clear processes for handling such requests in relation to personality data.\n\n## Avoiding Reductionism\n\nPerhaps one of the most subtle ethical pitfalls in personality profiling is the tendency toward reductionism—reducing complex individuals to simplistic types or scores. Organizations must remind themselves that personality assessments provide valuable but limited insights that should complement, rather than replace, holistic evaluation.\n\n## Conclusion\n\nEthical personality profiling requires a thoughtful balance between organizational benefits and individual rights. By approaching personality assessment with a commitment to privacy, fairness, transparency, and respect for human complexity, organizations can harness the power of personality insights while upholding ethical standards. As these technologies continue to evolve, ongoing ethical reflection and adaptation will be essential.",
    status: "published",
    category: "Ethics & Compliance",
    tags: ["ethics", "data privacy", "compliance", "best practices"],
    authorId: 3,
    authorName: "Dr. James Wilson",
    publishedAt: "2025-03-28T11:00:00Z",
    createdAt: "2025-03-25T09:45:00Z",
    updatedAt: "2025-03-28T11:00:00Z",
    featuredImage: "/blog/ethics-profiling.jpg",
    viewCount: 1560
  }
];

// Utility function to convert markdown to HTML (simplified)
const markdownToHtml = (markdown: string) => {
  // This is a very basic implementation
  // In a real app, use a library like 'marked' or 'remark'
  return markdown
    .replace(/^# (.*$)/gm, '<h1>$1</h1>')
    .replace(/^## (.*$)/gm, '<h2>$1</h2>')
    .replace(/^### (.*$)/gm, '<h3>$1</h3>')
    .replace(/\n\n/gm, '</p><p>')
    .replace(/\n/gm, '<br>')
    .replace(/^\s*$/, '<p></p>');
};

const BlogArticle = () => {
  const { slug } = useParams();
  const [, navigate] = useLocation();
  
  // Fetch article by slug
  const { data: article, isLoading, error } = useQuery({
    queryKey: ['blog', 'article', slug],
    queryFn: async () => {
      const response = await apiRequest('GET', `/api/blog/articles/slug/${slug}`);
      return response.json();
    }
  });
  
  // Track view (would be implemented on the server in a real app)
  useEffect(() => {
    if (article) {
      // In a real implementation, this would be an API call
      // apiRequest('POST', `/api/blog/articles/${article.id}/view`);
      console.log(`Viewed article: ${article.title}`);
    }
  }, [article]);
  
  if (isLoading) {
    return (
      <div className="container mx-auto py-12 max-w-4xl text-center">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-muted rounded w-3/4 mx-auto"></div>
          <div className="h-4 bg-muted rounded w-1/2 mx-auto"></div>
          <div className="h-64 bg-muted rounded w-full"></div>
          <div className="space-y-2">
            <div className="h-4 bg-muted rounded"></div>
            <div className="h-4 bg-muted rounded"></div>
            <div className="h-4 bg-muted rounded w-5/6"></div>
          </div>
        </div>
      </div>
    );
  }
  
  if (error || !article) {
    return (
      <div className="container mx-auto py-12 max-w-4xl text-center">
        <h1 className="text-2xl font-bold mb-4">Article Not Found</h1>
        <p className="mb-8">The article you're looking for doesn't exist or has been removed.</p>
        <Button onClick={() => navigate('/blog')}>
          <ArrowLeft className="h-4 w-4 mr-2" /> Back to Blog
        </Button>
      </div>
    );
  }
  
  return (
    <div className="container mx-auto py-12 max-w-4xl">
      <Button variant="ghost" onClick={() => navigate('/blog')} className="mb-8">
        <ArrowLeft className="h-4 w-4 mr-2" /> Back to Blog
      </Button>
      
      {article.featuredImage && (
        <div className="mb-8 rounded-lg overflow-hidden h-[400px] w-full">
          <img 
            src={article.featuredImage} 
            alt={article.title}
            className="w-full h-full object-cover"
          />
        </div>
      )}
      
      <div className="mb-6">
        <h1 className="text-4xl font-bold mb-4">{article.title}</h1>
        <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
          <div className="flex items-center">
            <User className="h-4 w-4 mr-1" />
            {article.authorName}
          </div>
          <div className="flex items-center">
            <Calendar className="h-4 w-4 mr-1" />
            {new Date(article.publishedAt!).toLocaleDateString()}
          </div>
          <div className="flex items-center">
            <Eye className="h-4 w-4 mr-1" />
            {article.viewCount} views
          </div>
          <Badge>{article.category}</Badge>
        </div>
      </div>
      
      <Card className="mb-8">
        <CardHeader className="pb-0">
          <div className="italic text-muted-foreground">
            {article.excerpt}
          </div>
        </CardHeader>
        <CardContent>
          <Separator className="my-4" />
          <div 
            className="prose prose-lg max-w-none dark:prose-invert"
            dangerouslySetInnerHTML={{ __html: `<p>${markdownToHtml(article.content)}</p>` }}
          />
        </CardContent>
      </Card>
      
      <div className="mt-8">
        <h2 className="text-xl font-semibold mb-4">Tags</h2>
        <div className="flex flex-wrap gap-2">
          {article.tags.map((tag: string, i: number) => (
            <Badge key={i} variant="secondary" className="text-sm">
              <Tag className="h-3 w-3 mr-1" /> {tag}
            </Badge>
          ))}
        </div>
      </div>
      
      <Separator className="my-8" />
      
      <div>
        <h2 className="text-xl font-semibold mb-4">Share this article</h2>
        <div className="flex gap-2">
          <Button variant="outline" size="sm">
            Twitter
          </Button>
          <Button variant="outline" size="sm">
            LinkedIn
          </Button>
          <Button variant="outline" size="sm">
            Facebook
          </Button>
          <Button variant="outline" size="sm">
            Email
          </Button>
        </div>
      </div>
    </div>
  );
};

export default BlogArticle;
