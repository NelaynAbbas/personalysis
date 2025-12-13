import { useState } from 'react';
import { useLocation } from 'wouter';
import { HelpCircle, Search, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { 
  Popover, 
  PopoverContent, 
  PopoverTrigger 
} from '@/components/ui/popover';
import { 
  Sheet, 
  SheetContent, 
  SheetHeader, 
  SheetTitle, 
  SheetTrigger,
  SheetDescription,
  SheetFooter,
  SheetClose
} from '@/components/ui/sheet';
import { 
  Card, 
  CardHeader, 
  CardTitle, 
  CardDescription, 
  CardContent 
} from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { getArticlesByPage, getHelpArticleById, searchHelpArticles, HelpArticle, helpArticles } from '@/data/help/helpDocs';

/**
 * Contextual Help Component
 * 
 * Provides context-aware help resources based on the current page
 * and user interaction patterns.
 */
export function ContextualHelp() {
  const [location] = useLocation();
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeArticle, setActiveArticle] = useState<HelpArticle | null>(null);
  
  // Get context-relevant help articles
  const contextualArticles = getArticlesByPage(location);
  const searchResults = searchQuery.length > 2 
    ? searchHelpArticles(searchQuery) 
    : [];
  
  const handleArticleSelect = (articleId: string) => {
    const article = getHelpArticleById(articleId);
    if (article) {
      setActiveArticle(article);
    }
  };
  
  const handleCloseArticle = () => {
    setActiveArticle(null);
  };
  
  return (
    <>
      {/* Quick help button with popover for common questions */}
      <Popover>
        <PopoverTrigger asChild>
          <Button 
            variant="ghost" 
            size="icon" 
            className="fixed bottom-6 right-6 h-12 w-12 rounded-full shadow-lg bg-primary text-primary-foreground hover:bg-primary/90"
          >
            <HelpCircle className="h-6 w-6" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-80 p-0" align="end">
          <div className="p-4 border-b">
            <h3 className="font-medium">Need help?</h3>
            <p className="text-sm text-muted-foreground mt-1">
              Quick answers or open the help center
            </p>
          </div>
          
          <div className="py-2">
            {contextualArticles.slice(0, 3).map(article => (
              <button
                key={article.id}
                className="w-full text-left px-4 py-2 text-sm hover:bg-accent"
                onClick={() => handleArticleSelect(article.id)}
              >
                {article.title}
              </button>
            ))}
          </div>
          
          <div className="p-2 border-t flex justify-end">
            <SheetTrigger asChild>
              <Button 
                variant="ghost" 
                size="sm" 
                className="text-xs"
                onClick={() => setIsOpen(true)}
              >
                Open Help Center
              </Button>
            </SheetTrigger>
          </div>
        </PopoverContent>
      </Popover>
      
      {/* Full help center as a slide-in panel */}
      <Sheet open={isOpen} onOpenChange={setIsOpen}>
        <SheetContent className="w-full sm:max-w-md overflow-y-auto" side="right">
          {activeArticle ? (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <SheetTitle>{activeArticle.title}</SheetTitle>
                <Button variant="ghost" size="icon" onClick={handleCloseArticle}>
                  <X className="h-4 w-4" />
                </Button>
              </div>
              
              <div className="text-xs text-muted-foreground">
                Category: {activeArticle.category}
              </div>
              
              <div 
                className="prose dark:prose-invert prose-sm max-w-none" 
                dangerouslySetInnerHTML={{ __html: activeArticle.content }} 
              />
            </div>
          ) : (
            <>
              <SheetHeader>
                <SheetTitle>Help Center</SheetTitle>
                <SheetDescription>
                  Find answers to your questions and learn how to use the platform
                </SheetDescription>
              </SheetHeader>
              
              <div className="py-4">
                <div className="relative">
                  <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search help articles..."
                    className="pl-8"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>
              </div>
              
              {searchQuery.length > 2 ? (
                <div className="space-y-4">
                  <h3 className="text-sm font-medium">Search results</h3>
                  {searchResults.length === 0 ? (
                    <p className="text-sm text-muted-foreground">No results found</p>
                  ) : (
                    <div className="space-y-2">
                      {searchResults.map(article => (
                        <Card 
                          key={article.id} 
                          className="cursor-pointer hover:bg-accent"
                          onClick={() => handleArticleSelect(article.id)}
                        >
                          <CardHeader className="p-4">
                            <CardTitle className="text-base">{article.title}</CardTitle>
                            <CardDescription>{article.category}</CardDescription>
                          </CardHeader>
                        </Card>
                      ))}
                    </div>
                  )}
                </div>
              ) : (
                <Tabs defaultValue="contextual">
                  <TabsList className="grid w-full grid-cols-2">
                    <TabsTrigger value="contextual">For This Page</TabsTrigger>
                    <TabsTrigger value="all">All Topics</TabsTrigger>
                  </TabsList>
                  
                  <TabsContent value="contextual" className="mt-4 space-y-4">
                    {contextualArticles.length === 0 ? (
                      <p className="text-sm text-muted-foreground">No specific help articles for this page</p>
                    ) : (
                      <div className="space-y-2">
                        {contextualArticles.map(article => (
                          <Card 
                            key={article.id} 
                            className="cursor-pointer hover:bg-accent"
                            onClick={() => handleArticleSelect(article.id)}
                          >
                            <CardHeader className="p-4">
                              <CardTitle className="text-base">{article.title}</CardTitle>
                              <CardDescription>{article.category}</CardDescription>
                            </CardHeader>
                          </Card>
                        ))}
                      </div>
                    )}
                  </TabsContent>
                  
                  <TabsContent value="all" className="mt-4">
                    <div className="space-y-4">
                      {['Getting Started', 'Survey Creation', 'Data Analysis', 'Survey Management', 'Account & Settings'].map(category => (
                        <div key={category}>
                          <h3 className="text-sm font-medium mb-2">{category}</h3>
                          <div className="space-y-2">
                            {helpArticles.filter(article => article.category === category).map(article => (
                              <Card 
                                key={article.id} 
                                className="cursor-pointer hover:bg-accent"
                                onClick={() => handleArticleSelect(article.id)}
                              >
                                <CardHeader className="p-3">
                                  <CardTitle className="text-sm">{article.title}</CardTitle>
                                </CardHeader>
                              </Card>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  </TabsContent>
                </Tabs>
              )}
              
              <SheetFooter className="mt-4 flex justify-end border-t pt-4">
                <SheetClose asChild>
                  <Button variant="outline">Close</Button>
                </SheetClose>
              </SheetFooter>
            </>
          )}
        </SheetContent>
      </Sheet>
    </>
  );
}