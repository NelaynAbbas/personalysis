import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';

import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';

// Form validation schema
const formSchema = z.object({
  firstName: z.string().min(2, { message: 'First name must be at least 2 characters' }),
  lastName: z.string().min(2, { message: 'Last name must be at least 2 characters' }),
  email: z.string().email({ message: 'Please enter a valid email address' }),
  company: z.string().min(2, { message: 'Company name must be at least 2 characters' }),
  phone: z.string().min(1, { message: 'Phone number is required' }),
  role: z.string().min(1, { message: 'Please select your role' }),
  companySize: z.string().min(1, { message: 'Please select company size' }),
  industry: z.string().min(1, { message: 'Please select industry' }),
  message: z.string().optional(),
  source: z.string().optional(),
});

type FormValues = z.infer<typeof formSchema>;

const DemoRequestForm: React.FC = () => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const { toast } = useToast();

  // Initialize form
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      firstName: '',
      lastName: '',
      email: '',
      company: '',
      phone: '',
      role: '',
      companySize: '',
      industry: '',
      message: '',
      source: 'website',
    },
  });

  // Form submission handler
  const onSubmit = async (data: FormValues) => {
    setIsSubmitting(true);
    
    try {
      console.log('Submitting demo request form:', data);
      
      // Create a demo request object with additional required fields
      const demoRequest = {
        ...data,
        jobTitle: data.role, // Map role to jobTitle field for API
        id: Date.now(), // Use timestamp as a unique ID
        status: 'new',
        viewed: false,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        notes: null,
        scheduledAt: null
      };
      
      // Save to localStorage for admin panel visibility
      try {
        // Get existing requests from localStorage
        const savedRequests = localStorage.getItem('demoRequests');
        let existingRequests = [];
        
        if (savedRequests) {
          existingRequests = JSON.parse(savedRequests);
        }
        
        // Add the new request and save back to localStorage
        existingRequests.push(demoRequest);
        localStorage.setItem('demoRequests', JSON.stringify(existingRequests));
        console.log('Saved demo request to localStorage for admin panel visibility');
      } catch (storageError) {
        console.error('Failed to save to localStorage:', storageError);
      }
      
      // Submit to server API
      const response = await fetch('/api/demo-request', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(demoRequest), // Use the same data format we save to localStorage
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to submit request');
      }
      
      // Success!
      toast({
        title: 'Request Submitted!',
        description: 'Thank you for your interest. We will contact you shortly.',
      });
      
      setIsSubmitted(true);
    } catch (error) {
      console.error('Error submitting form:', error);
      toast({
        title: 'Submission Failed',
        description: error instanceof Error ? error.message : 'An unexpected error occurred',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Thank you message after successful submission
  if (isSubmitted) {
    return (
      <Card className="w-full max-w-lg mx-auto">
        <CardHeader>
          <CardTitle className="text-3xl text-center mb-4">Thank You!</CardTitle>
        </CardHeader>
        <CardContent className="text-center">
          <p className="text-lg mb-4 leading-relaxed">
            Your demo request has been successfully submitted. Our team will contact you shortly.
          </p>
          <p className="text-lg mb-8 leading-relaxed">
            In the meantime, feel free to explore more of our platform's capabilities.
          </p>
          <Button onClick={() => setIsSubmitted(false)}>Request Another Demo</Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full max-w-lg mx-auto">
      <CardHeader>
        <CardTitle className="text-2xl">Request a Demo</CardTitle>
        <CardDescription>
          Fill out the form below to schedule a personalized demo of PersonalysisPro.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* First Name */}
              <FormField
                control={form.control}
                name="firstName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Name *</FormLabel>
                    <FormControl>
                      <Input placeholder="Your first name" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Last Name */}
              <FormField
                control={form.control}
                name="lastName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Surname *</FormLabel>
                    <FormControl>
                      <Input placeholder="Your last name" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Email */}
            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Email address *</FormLabel>
                  <FormControl>
                    <Input placeholder="your.email@company.com" type="email" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Phone */}
            <FormField
              control={form.control}
              name="phone"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Phone *</FormLabel>
                  <FormControl>
                    <Input placeholder="+1 (555) 000-0000" type="tel" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Role */}
            <FormField
              control={form.control}
              name="role"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Role *</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select your role" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="ceo">CEO / Founder</SelectItem>
                      <SelectItem value="cto">CTO / Technical Director</SelectItem>
                      <SelectItem value="cmo">CMO / Marketing Director</SelectItem>
                      <SelectItem value="product">Product Manager</SelectItem>
                      <SelectItem value="sales">Sales Manager</SelectItem>
                      <SelectItem value="other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Company */}
            <FormField
              control={form.control}
              name="company"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Company *</FormLabel>
                  <FormControl>
                    <Input placeholder="Your company name" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Company Size */}
              <FormField
                control={form.control}
                name="companySize"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Company Size*</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
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
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Industry */}
              <FormField
                control={form.control}
                name="industry"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Industry*</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select industry" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="Technology">Technology</SelectItem>
                        <SelectItem value="Marketing">Marketing & Advertising</SelectItem>
                        <SelectItem value="Retail">Retail & E-commerce</SelectItem>
                        <SelectItem value="Financial">Financial Services</SelectItem>
                        <SelectItem value="Healthcare">Healthcare</SelectItem>
                        <SelectItem value="Education">Education</SelectItem>
                        <SelectItem value="Manufacturing">Manufacturing</SelectItem>
                        <SelectItem value="Consulting">Consulting</SelectItem>
                        <SelectItem value="Other">Other</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Message */}
            <FormField
              control={form.control}
              name="message"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Message (Optional)</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Tell us about your specific needs or questions..."
                      {...field}
                      rows={4}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Hidden source field */}
            <input type="hidden" {...form.register('source')} value="website" />

            <Button type="submit" className="w-full" disabled={isSubmitting}>
              {isSubmitting ? 'Submitting...' : 'Book Your Demo'}
            </Button>
          </form>
        </Form>
      </CardContent>
      <CardFooter className="text-xs text-muted-foreground">
        <p>
          By submitting this form, you agree to our{' '}
          <a href="/privacy-policy" className="underline">
            Privacy Policy
          </a>{' '}
          and{' '}
          <a href="/terms" className="underline">
            Terms of Service
          </a>
          .
        </p>
      </CardFooter>
    </Card>
  );
};

export default DemoRequestForm;