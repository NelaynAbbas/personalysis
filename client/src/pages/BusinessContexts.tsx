import React, { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import BusinessContextForm from "@/components/BusinessContextForm";
import type { BusinessContext } from "../../../shared/schema";

// Helper to truncate text for display
const truncateText = (text: string | undefined, maxLength: number = 100) => {
  if (!text) return "";
  return text.length > maxLength ? text.substring(0, maxLength) + "..." : text;
};

const BusinessContexts = () => {
  const { toast } = useToast();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedContext, setSelectedContext] = useState<BusinessContext | null>(null);

  // Fetch business contexts
  const { data: businessContexts, isLoading } = useQuery({
    queryKey: ["/api/business-contexts"],
    select: (data) => data.data || [],
  });

  // Create business context
  const createMutation = useMutation({
    mutationFn: (newContext: Partial<BusinessContext>) =>
      apiRequest("/api/business-contexts", {
        method: "POST",
        body: JSON.stringify(newContext),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/business-contexts"] });
      toast({
        title: "Business context created",
        description: "Your business context has been created successfully.",
      });
      setIsDialogOpen(false);
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to create business context",
        variant: "destructive",
      });
    },
  });

  // Update business context
  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: Partial<BusinessContext> }) =>
      apiRequest(`/api/business-contexts/${id}`, {
        method: "PATCH",
        body: JSON.stringify(data),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/business-contexts"] });
      toast({
        title: "Business context updated",
        description: "Your business context has been updated successfully.",
      });
      setIsDialogOpen(false);
      setSelectedContext(null);
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update business context",
        variant: "destructive",
      });
    },
  });

  const handleContextSubmit = (data: Partial<BusinessContext>) => {
    if (selectedContext?.id) {
      updateMutation.mutate({ id: selectedContext.id, data });
    } else {
      createMutation.mutate({
        ...data,
        name: data.productName || "Unnamed Context",
      });
    }
  };

  const handleAddNew = () => {
    setSelectedContext(null);
    setIsDialogOpen(true);
  };

  const handleEdit = (context: BusinessContext) => {
    setSelectedContext(context);
    setIsDialogOpen(true);
  };

  return (
    <div className="container py-10">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Business Contexts</h1>
          <p className="text-muted-foreground mt-2">
            Manage your business contexts to better target your surveys.
          </p>
        </div>
        <Button onClick={handleAddNew} className="flex items-center gap-2">
          <Plus className="h-4 w-4" />
          Add New Context
        </Button>
      </div>

      {isLoading ? (
        <div className="flex justify-center items-center h-64">
          <p>Loading business contexts...</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {businessContexts?.length > 0 ? (
            businessContexts.map((context: any) => (
              <Card key={context.id} className="h-full flex flex-col">
                <CardHeader>
                  <CardTitle>{context.productName || context.name}</CardTitle>
                  <CardDescription>{context.industry}</CardDescription>
                </CardHeader>
                <CardContent className="flex-grow">
                  <Tabs defaultValue="info" className="w-full">
                    <TabsList className="grid grid-cols-2">
                      <TabsTrigger value="info">Info</TabsTrigger>
                      <TabsTrigger value="product">Product</TabsTrigger>
                    </TabsList>
                    <TabsContent value="info" className="space-y-2 mt-4">
                      <div>
                        <h4 className="font-medium text-sm">Company Size:</h4>
                        <p className="text-sm text-muted-foreground">{context.companySize || "Not specified"}</p>
                      </div>
                      <div>
                        <h4 className="font-medium text-sm">Market Position:</h4>
                        <p className="text-sm text-muted-foreground">
                          {context.marketPosition ? 
                            context.marketPosition.charAt(0).toUpperCase() + context.marketPosition.slice(1) : 
                            "Not specified"}
                        </p>
                      </div>
                      <div>
                        <h4 className="font-medium text-sm">Industry:</h4>
                        <p className="text-sm text-muted-foreground">{context.industry || "Not specified"}</p>
                      </div>
                      <div>
                        <h4 className="font-medium text-sm">Target Markets:</h4>
                        <p className="text-sm text-muted-foreground">
                          {context.targetMarket && context.targetMarket.length > 0
                            ? context.targetMarket.join(", ")
                            : "Not specified"}
                        </p>
                      </div>
                    </TabsContent>
                    <TabsContent value="product" className="space-y-2 mt-4">
                      <div>
                        <h4 className="font-medium text-sm">Description:</h4>
                        <p className="text-sm text-muted-foreground">
                          {truncateText(context.productDescription) || "Not specified"}
                        </p>
                      </div>
                      <div>
                        <h4 className="font-medium text-sm">Features:</h4>
                        <p className="text-sm text-muted-foreground">
                          {context.productFeatures && context.productFeatures.length > 0
                            ? context.productFeatures.join(", ")
                            : "Not specified"}
                        </p>
                      </div>
                      <div>
                        <h4 className="font-medium text-sm">Value Proposition:</h4>
                        <p className="text-sm text-muted-foreground">
                          {truncateText(context.valueProposition) || "Not specified"}
                        </p>
                      </div>
                    </TabsContent>
                  </Tabs>
                </CardContent>
                <CardFooter className="border-t pt-4">
                  <Button variant="outline" className="w-full" onClick={() => handleEdit(context)}>
                    Edit
                  </Button>
                </CardFooter>
              </Card>
            ))
          ) : (
            <div className="col-span-3 text-center py-10">
              <h3 className="text-lg font-medium">No business contexts found</h3>
              <p className="text-muted-foreground mt-2">
                Create your first business context to get started.
              </p>
              <Button onClick={handleAddNew} className="mt-4">
                Create Business Context
              </Button>
            </div>
          )}
        </div>
      )}

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {selectedContext?.id ? "Edit Business Context" : "Create Business Context"}
            </DialogTitle>
            <DialogDescription>
              {selectedContext?.id
                ? "Update information about your business context."
                : "Add a new business context to help personalize your surveys."}
            </DialogDescription>
          </DialogHeader>
          <BusinessContextForm
            initialData={selectedContext || {}}
            onSubmit={handleContextSubmit}
            onCancel={() => setIsDialogOpen(false)}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default BusinessContexts;