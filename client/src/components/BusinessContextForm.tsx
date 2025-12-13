import React, { useState } from "react";
import { useForm } from "react-hook-form";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import type { BusinessContext } from "../../../shared/schema";

type BusinessContextFormProps = {
  initialData?: Partial<BusinessContext>;
  onSubmit: (data: Partial<BusinessContext>) => void;
  onCancel?: () => void;
};

// Multi-select input component for string arrays
const TagInput = ({ 
  value = [], 
  onChange, 
  placeholder 
}: { 
  value: string[];
  onChange: (values: string[]) => void;
  placeholder: string;
}) => {
  const [inputValue, setInputValue] = useState("");

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" || e.key === ",") {
      e.preventDefault();
      if (inputValue.trim()) {
        const newValue = [...value, inputValue.trim()];
        onChange(newValue);
        setInputValue("");
      }
    }
  };

  const removeTag = (index: number) => {
    const newValue = [...value];
    newValue.splice(index, 1);
    onChange(newValue);
  };

  return (
    <div className="flex flex-col space-y-2">
      <div className="flex flex-wrap gap-2 p-2 border rounded-md">
        {value.map((tag, index) => (
          <div key={index} className="bg-primary/10 px-2 py-1 rounded-md flex items-center">
            {tag}
            <button
              type="button"
              className="ml-2 text-sm"
              onClick={() => removeTag(index)}
            >
              &times;
            </button>
          </div>
        ))}
        <Input
          type="text"
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          className="flex-grow border-none focus-visible:ring-0 focus-visible:ring-offset-0"
        />
      </div>
      <p className="text-xs text-muted-foreground">
        Press Enter or comma to add
      </p>
    </div>
  );
};

const BusinessContextForm: React.FC<BusinessContextFormProps> = ({
  initialData = {},
  onSubmit,
  onCancel,
}) => {
  const { toast } = useToast();
  const form = useForm<Partial<BusinessContext>>({
    defaultValues: initialData || {
      industry: "",
      companySize: "",
      companyStage: "growth",
      department: "",
      role: "",
      targetMarket: [],
      productName: "",
      productDescription: "",
      productCategory: "",
      productFeatures: [],
      valueProposition: "",
      uniqueSellingPoints: [],
      competitors: [],
      marketPosition: "challenger",
      pricingStrategy: "",
      decisionTimeframe: "",
      budget: "",
      decisionMakers: [],
      painPoints: [],
      currentSolutions: "",
      desiredOutcomes: [],
      idealCustomerProfile: "",
      customerDemographics: "",
      customerPsychographics: "",
    },
  });

  const handleFormSubmit = (data: Partial<BusinessContext>) => {
    onSubmit(data);
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleFormSubmit)} className="space-y-6">
        <Tabs defaultValue="company" className="w-full">
          <TabsList className="grid grid-cols-5 mb-4">
            <TabsTrigger value="company">Company</TabsTrigger>
            <TabsTrigger value="product">Product</TabsTrigger>
            <TabsTrigger value="market">Market</TabsTrigger>
            <TabsTrigger value="decision">Decision Making</TabsTrigger>
            <TabsTrigger value="customer">Customer</TabsTrigger>
          </TabsList>

          {/* Company Information Tab */}
          <TabsContent value="company">
            <Card>
              <CardHeader>
                <CardTitle>Company Information</CardTitle>
                <CardDescription>
                  Provide details about your company to help us better understand your business context.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <FormField
                  control={form.control}
                  name="industry"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Industry</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g. Technology, Healthcare, Finance" {...field} />
                      </FormControl>
                      <FormDescription>
                        The industry your company operates in
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="companySize"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Company Size</FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select company size" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="1-10">1-10 employees</SelectItem>
                          <SelectItem value="11-50">11-50 employees</SelectItem>
                          <SelectItem value="51-200">51-200 employees</SelectItem>
                          <SelectItem value="201-500">201-500 employees</SelectItem>
                          <SelectItem value="501-1000">501-1000 employees</SelectItem>
                          <SelectItem value="1000+">1000+ employees</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormDescription>
                        The number of employees in your company
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="companyStage"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Company Stage</FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select company stage" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="startup">Startup</SelectItem>
                          <SelectItem value="growth">Growth</SelectItem>
                          <SelectItem value="established">Established</SelectItem>
                          <SelectItem value="enterprise">Enterprise</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormDescription>
                        The current stage of your company's growth
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="department"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Department</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g. Marketing, Sales, Product" {...field} />
                      </FormControl>
                      <FormDescription>
                        Your department within the company
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="role"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Role</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g. Manager, Director, VP" {...field} />
                      </FormControl>
                      <FormDescription>
                        Your role within the company
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="targetMarket"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Target Markets</FormLabel>
                      <FormControl>
                        <TagInput
                          value={field.value || []}
                          onChange={field.onChange}
                          placeholder="Add target markets"
                        />
                      </FormControl>
                      <FormDescription>
                        The markets your company targets
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </CardContent>
            </Card>
          </TabsContent>

          {/* Product Information Tab */}
          <TabsContent value="product">
            <Card>
              <CardHeader>
                <CardTitle>Product Information</CardTitle>
                <CardDescription>
                  Provide details about your product or service.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <FormField
                  control={form.control}
                  name="productName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Product Name</FormLabel>
                      <FormControl>
                        <Input placeholder="Your product or service name" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="productDescription"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Product Description</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Brief description of your product or service"
                          className="min-h-[100px]"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="productCategory"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Product Category</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g. SaaS, Hardware, Consulting" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="productFeatures"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Product Features</FormLabel>
                      <FormControl>
                        <TagInput
                          value={field.value || []}
                          onChange={field.onChange}
                          placeholder="Add key features"
                        />
                      </FormControl>
                      <FormDescription>
                        Key features of your product or service
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="valueProposition"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Value Proposition</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="What makes your product or service valuable to customers?"
                          className="min-h-[100px]"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="uniqueSellingPoints"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Unique Selling Points</FormLabel>
                      <FormControl>
                        <TagInput
                          value={field.value || []}
                          onChange={field.onChange}
                          placeholder="Add unique selling points"
                        />
                      </FormControl>
                      <FormDescription>
                        What makes your product or service stand out from competitors?
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </CardContent>
            </Card>
          </TabsContent>

          {/* Market Analysis Tab */}
          <TabsContent value="market">
            <Card>
              <CardHeader>
                <CardTitle>Market Analysis</CardTitle>
                <CardDescription>
                  Information about your market position and competitors.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <FormField
                  control={form.control}
                  name="competitors"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Competitors</FormLabel>
                      <FormControl>
                        <TagInput
                          value={field.value || []}
                          onChange={field.onChange}
                          placeholder="Add competitors"
                        />
                      </FormControl>
                      <FormDescription>
                        List your main competitors
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="marketPosition"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Market Position</FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select market position" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="leader">Market Leader</SelectItem>
                          <SelectItem value="challenger">Challenger</SelectItem>
                          <SelectItem value="follower">Follower</SelectItem>
                          <SelectItem value="niche">Niche Player</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormDescription>
                        How your company positions itself in the market
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="pricingStrategy"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Pricing Strategy</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g. Premium, Value-based, Subscription" {...field} />
                      </FormControl>
                      <FormDescription>
                        Your pricing strategy in the market
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </CardContent>
            </Card>
          </TabsContent>

          {/* Decision Making Tab */}
          <TabsContent value="decision">
            <Card>
              <CardHeader>
                <CardTitle>Decision Making</CardTitle>
                <CardDescription>
                  Information about how decisions are made in your organization.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <FormField
                  control={form.control}
                  name="decisionTimeframe"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Decision Timeframe</FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select timeframe" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="immediate">Immediate (within days)</SelectItem>
                          <SelectItem value="short-term">Short-term (within weeks)</SelectItem>
                          <SelectItem value="medium-term">Medium-term (within months)</SelectItem>
                          <SelectItem value="long-term">Long-term (within a year)</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormDescription>
                        Typical timeframe for making decisions
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="budget"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Budget Range</FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select budget range" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="under-5k">Under $5,000</SelectItem>
                          <SelectItem value="5k-25k">$5,000 - $25,000</SelectItem>
                          <SelectItem value="25k-100k">$25,000 - $100,000</SelectItem>
                          <SelectItem value="100k-500k">$100,000 - $500,000</SelectItem>
                          <SelectItem value="over-500k">Over $500,000</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormDescription>
                        Typical budget range for projects
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="decisionMakers"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Decision Makers</FormLabel>
                      <FormControl>
                        <TagInput
                          value={field.value || []}
                          onChange={field.onChange}
                          placeholder="Add decision makers"
                        />
                      </FormControl>
                      <FormDescription>
                        Roles involved in the decision making process (e.g. CTO, VP of Sales)
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="painPoints"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Pain Points</FormLabel>
                      <FormControl>
                        <TagInput
                          value={field.value || []}
                          onChange={field.onChange}
                          placeholder="Add pain points"
                        />
                      </FormControl>
                      <FormDescription>
                        Current challenges your organization faces
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="currentSolutions"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Current Solutions</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="How are you currently addressing these challenges?"
                          className="min-h-[100px]"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="desiredOutcomes"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Desired Outcomes</FormLabel>
                      <FormControl>
                        <TagInput
                          value={field.value || []}
                          onChange={field.onChange}
                          placeholder="Add desired outcomes"
                        />
                      </FormControl>
                      <FormDescription>
                        What results are you hoping to achieve?
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </CardContent>
            </Card>
          </TabsContent>

          {/* Customer Information Tab */}
          <TabsContent value="customer">
            <Card>
              <CardHeader>
                <CardTitle>Customer Information</CardTitle>
                <CardDescription>
                  Information about your ideal customers.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <FormField
                  control={form.control}
                  name="idealCustomerProfile"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Ideal Customer Profile</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Describe your ideal customer"
                          className="min-h-[100px]"
                          {...field}
                        />
                      </FormControl>
                      <FormDescription>
                        A description of your perfect customer
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="customerDemographics"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Customer Demographics</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Age, gender, location, education, income, etc."
                          className="min-h-[100px]"
                          {...field}
                        />
                      </FormControl>
                      <FormDescription>
                        Demographic details of your typical customers
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="customerPsychographics"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Customer Psychographics</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Values, attitudes, interests, lifestyle, etc."
                          className="min-h-[100px]"
                          {...field}
                        />
                      </FormControl>
                      <FormDescription>
                        Psychological characteristics of your typical customers
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        <div className="flex justify-end space-x-4">
          {onCancel && (
            <Button variant="outline" type="button" onClick={onCancel}>
              Cancel
            </Button>
          )}
          <Button type="submit">Save Business Context</Button>
        </div>
      </form>
    </Form>
  );
};

export default BusinessContextForm;