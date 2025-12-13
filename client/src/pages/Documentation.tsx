import { useEffect, useState } from "react";
import { 
  FileText, 
  Book, 
  Code, 
  Users, 
  Database,
  BarChart, 
  Search,
  ChevronRight,
  X,
  ArrowLeft
} from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogClose } from "@/components/ui/dialog";

export default function Documentation() {
  const [activeCategory, setActiveCategory] = useState("getting-started");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedArticle, setSelectedArticle] = useState(null);
  const [isArticleOpen, setIsArticleOpen] = useState(false);
  
  useEffect(() => {
    // Set page title
    document.title = "Documentation | PersonalysisPro";
    // Scroll to top on page load
    window.scrollTo(0, 0);
  }, []);

  const categories = [
    { id: "getting-started", label: "Getting Started", icon: <Book size={16} /> },
    { id: "user-guides", label: "User Guides", icon: <FileText size={16} /> },
    { id: "team-management", label: "Team Management", icon: <Users size={16} /> },
    { id: "data-management", label: "Data Management", icon: <Database size={16} /> },
    { id: "analytics", label: "Analytics", icon: <BarChart size={16} /> },
  ];

  const docArticles = {
    "getting-started": [
      { 
        id: 1, 
        title: "Introduction to PersonalysisPro", 
        description: "Learn the basics of our platform and how it can benefit your business.",
        content: `
          <h2>Introduction to PersonalysisPro</h2>
          <p>PersonalysisPro is a comprehensive personality assessment platform designed to help businesses gain deeper insights into their customers, employees, and market segments. Our AI-powered tools transform survey responses into actionable intelligence.</p>
          
          <h3>Key Features</h3>
          <ul>
            <li><strong>Interactive Surveys:</strong> Create engaging personality assessments with customizable questions</li>
            <li><strong>AI Analysis:</strong> Advanced algorithms identify personality traits and behavioral patterns</li>
            <li><strong>Visual Reports:</strong> Beautiful, interactive visualizations make data easy to understand</li>
            <li><strong>Business Intelligence:</strong> Transform survey results into actionable business strategies</li>
            <li><strong>Team Collaboration:</strong> Work together with colleagues on survey design and analysis</li>
          </ul>
          
          <h3>Benefits for Your Business</h3>
          <p>Understanding personality traits and preferences helps businesses in numerous ways:</p>
          <ul>
            <li>Improve product development by aligning features with customer personalities</li>
            <li>Enhance marketing strategies with psychographic targeting</li>
            <li>Build stronger teams by understanding employee work styles</li>
            <li>Increase customer satisfaction through personalized experiences</li>
            <li>Make data-driven decisions based on psychological insights</li>
          </ul>
          
          <p>Ready to get started? The following documentation will guide you through setting up your account, creating your first survey, and analyzing the results.</p>
        `
      },
      { 
        id: 2, 
        title: "Setting Up Your Account", 
        description: "A step-by-step guide to configuring your account for the first time.",
        content: `
          <h2>Setting Up Your Account</h2>
          
          <h3>Creating Your Account</h3>
          <p>To get started with PersonalysisPro, follow these simple steps:</p>
          <ol>
            <li><strong>Sign Up:</strong> Visit our homepage and click the "Sign Up" button in the top right corner</li>
            <li><strong>Choose Your Plan:</strong> Select the subscription plan that fits your needs (Business, Enterprise, or Custom)</li>
            <li><strong>Complete Registration:</strong> Fill in your details and create a password</li>
            <li><strong>Verify Email:</strong> Check your inbox for a verification email and click the confirmation link</li>
            <li><strong>Set Up Company Profile:</strong> Add your company information, logo, and branding colors</li>
          </ol>
          
          <h3>Account Settings</h3>
          <p>After creating your account, it's important to configure these key settings:</p>
          <ol>
            <li><strong>User Profile:</strong> Complete your personal profile with professional information</li>
            <li><strong>Security Settings:</strong> Set up two-factor authentication for enhanced security</li>
            <li><strong>Notification Preferences:</strong> Choose how and when you receive platform notifications</li>
            <li><strong>Billing Information:</strong> Add or update your payment methods</li>
            <li><strong>API Access:</strong> Generate API keys if you plan to integrate with other systems</li>
          </ol>
          
          <h3>Adding Team Members</h3>
          <p>To invite colleagues to your workspace:</p>
          <ol>
            <li>Go to Settings > Team Management</li>
            <li>Click "Invite Team Member"</li>
            <li>Enter email addresses and select appropriate roles</li>
            <li>Customize the invitation message (optional)</li>
            <li>Click "Send Invitations"</li>
          </ol>
          
          <p>Your team members will receive email invitations with instructions to join your workspace.</p>
        `
      },
      { 
        id: 3, 
        title: "Creating Your First Survey", 
        description: "Learn how to create and customize your first personality assessment survey.",
        content: `
          <h2>Creating Your First Survey</h2>
          
          <h3>Starting a New Survey</h3>
          <p>Follow these steps to create your first personality assessment survey:</p>
          <ol>
            <li>From your dashboard, click the "Create New Survey" button</li>
            <li>Choose from available templates or start from scratch</li>
            <li>Give your survey a compelling title and description</li>
            <li>Select your target audience and purpose</li>
            <li>Click "Create" to generate your new survey</li>
          </ol>
          
          <h3>Customizing Questions</h3>
          <p>PersonalysisPro offers various question types optimized for personality assessment:</p>
          <ul>
            <li><strong>Likert Scale:</strong> Measure agreement levels (Strongly Disagree to Strongly Agree)</li>
            <li><strong>Multiple Choice:</strong> Present several options for selection</li>
            <li><strong>Ranking:</strong> Ask participants to prioritize options</li>
            <li><strong>Semantic Differential:</strong> Compare opposing qualities</li>
            <li><strong>Situational Judgment:</strong> Present scenarios with multiple responses</li>
          </ul>
          
          <p>To add questions to your survey:</p>
          <ol>
            <li>Click "Add Question" in the editor</li>
            <li>Select the question type</li>
            <li>Enter your question text</li>
            <li>Add response options</li>
            <li>Assign trait mappings for AI analysis</li>
          </ol>
          
          <h3>Survey Branding and Design</h3>
          <p>Customize the look and feel of your survey:</p>
          <ul>
            <li>Upload your logo in the "Branding" tab</li>
            <li>Select colors that match your brand identity</li>
            <li>Choose a background image or pattern</li>
            <li>Adjust typography settings</li>
            <li>Add a custom thank-you message for completion</li>
          </ul>
          
          <h3>Preview and Testing</h3>
          <p>Before launching your survey:</p>
          <ol>
            <li>Click "Preview" to see how your survey will appear to participants</li>
            <li>Use the "Test Mode" to complete the survey without recording responses</li>
            <li>Share the test link with colleagues for feedback</li>
            <li>Check the mobile view to ensure responsive design</li>
            <li>Verify trait mappings in the test results</li>
          </ol>
        `
      },
      { 
        id: 4, 
        title: "Understanding Dashboard Analytics", 
        description: "An overview of the key metrics and insights available in your dashboard.",
        content: `
          <h2>Understanding Dashboard Analytics</h2>
          
          <h3>Dashboard Overview</h3>
          <p>The PersonalysisPro dashboard provides a comprehensive view of your survey performance and results. Key components include:</p>
          <ul>
            <li><strong>Survey Summary:</strong> Quick stats on active surveys, completion rates, and responses</li>
            <li><strong>Participant Demographics:</strong> Visual breakdown of respondent characteristics</li>
            <li><strong>Trait Distribution:</strong> Aggregated personality trait analysis across respondents</li>
            <li><strong>Response Timeline:</strong> Participation patterns over time</li>
            <li><strong>Engagement Metrics:</strong> Average completion time, drop-off rates, and more</li>
          </ul>
          
          <h3>Interpreting Personality Traits</h3>
          <p>The Trait Analysis section shows the distribution of personality traits among your respondents. Each trait is accompanied by:</p>
          <ul>
            <li>Percentage distribution across the spectrum</li>
            <li>Comparison to population averages</li>
            <li>Correlation with other traits</li>
            <li>Business implications and recommendations</li>
            <li>Trend analysis if historical data is available</li>
          </ul>
          
          <h3>Business Intelligence Features</h3>
          <p>Transform personality insights into business strategies with these tools:</p>
          <ul>
            <li><strong>Market Segmentation:</strong> Identify personality-based customer segments</li>
            <li><strong>Product Recommendations:</strong> Match products to personality profiles</li>
            <li><strong>Marketing Strategy:</strong> Optimize messaging for different personality types</li>
            <li><strong>Team Composition:</strong> Analyze team dynamics and work styles</li>
            <li><strong>Competitive Analysis:</strong> Compare your customer base to industry benchmarks</li>
          </ul>
          
          <h3>Exporting and Sharing Insights</h3>
          <p>You can share dashboard insights with stakeholders in several ways:</p>
          <ul>
            <li>Generate PDF reports with selected visualizations</li>
            <li>Schedule automated email reports</li>
            <li>Export raw data in CSV or Excel format</li>
            <li>Create shareable dashboard links with customized permissions</li>
            <li>Integrate with business intelligence tools via API</li>
          </ul>
        `
      },
      { 
        id: 5, 
        title: "Quick Start Guide", 
        description: "Get up and running with PersonalysisPro in less than 30 minutes.",
        content: `
          <h2>Quick Start Guide</h2>
          
          <p>This guide will help you get productive with PersonalysisPro in under 30 minutes. Follow these simple steps to create and launch your first personality assessment survey.</p>
          
          <h3>Step 1: Account Setup (5 minutes)</h3>
          <ul>
            <li>Sign up at personalysispro.com using your business email</li>
            <li>Verify your email address</li>
            <li>Complete your organization profile with logo and company name</li>
            <li>Choose the default color scheme that matches your brand</li>
          </ul>
          
          <h3>Step 2: Create a Survey (10 minutes)</h3>
          <ul>
            <li>From your dashboard, click "Create New Survey"</li>
            <li>Select the "Personality Assessment" template</li>
            <li>Name your survey and add a brief description</li>
            <li>Review the pre-loaded questions (20 questions covering core personality dimensions)</li>
            <li>Customize 2-3 questions if desired (but the template works well as-is)</li>
          </ul>
          
          <h3>Step 3: Share Your Survey (5 minutes)</h3>
          <ul>
            <li>Click "Publish" to activate your survey</li>
            <li>Select "Share" and choose your preferred distribution method:</li>
            <ul>
              <li>Direct link (copy and share via email or messaging)</li>
              <li>Email invitations (upload recipients or enter manually)</li>
              <li>Website embed (copy the code snippet for your website)</li>
              <li>QR code (download for print materials)</li>
            </ul>
          </ul>
          
          <h3>Step 4: Monitor Results (10 minutes)</h3>
          <ul>
            <li>Return to your dashboard to watch responses in real-time</li>
            <li>Review the "Quick Insights" panel for immediate takeaways</li>
            <li>Explore the "Trait Distribution" visualization to see personality patterns</li>
            <li>Check the "Business Recommendations" tab for actionable insights</li>
          </ul>
          
          <h3>Next Steps</h3>
          <p>After completing these steps, you'll have your first survey up and running with initial results. To go deeper:</p>
          <ul>
            <li>Explore the "Analytics" section for detailed data analysis</li>
            <li>Try the "Comparison" tool to see differences between respondent groups</li>
            <li>Create a custom dashboard with your most important metrics</li>
            <li>Invite team members to collaborate on survey analysis</li>
          </ul>
          
          <p>Congratulations! You're now ready to unlock the power of personality insights for your business.</p>
        `
      },
    ],
    "user-guides": [
      { 
        id: 12, 
        title: "Survey Customization", 
        description: "Detailed guide on customizing surveys to match your brand and needs.",
        content: `
          <h2>Survey Customization</h2>
          
          <p>PersonalysisPro offers extensive customization options to ensure your surveys reflect your brand identity and meet your specific research objectives.</p>
          
          <h3>Branding Options</h3>
          <p>Create a cohesive brand experience with these customization options:</p>
          <ul>
            <li><strong>Logo:</strong> Upload your company logo (recommended size: 250x100px)</li>
            <li><strong>Color Scheme:</strong> Set primary, secondary, and accent colors using hex codes or the color picker</li>
            <li><strong>Typography:</strong> Select from 12 font families or upload custom fonts</li>
            <li><strong>Custom Header:</strong> Add a welcome image or banner (recommended size: 1200x300px)</li>
            <li><strong>Email Templates:</strong> Customize invitation and reminder emails with your branding</li>
          </ul>
          
          <h3>Survey Structure Customization</h3>
          <p>Organize your survey content effectively:</p>
          <ul>
            <li><strong>Section Management:</strong> Group related questions into themed sections</li>
            <li><strong>Progress Indicators:</strong> Choose from 5 styles of progress bars or disable completely</li>
            <li><strong>Page Breaks:</strong> Control the flow with custom page divisions</li>
            <li><strong>Question Order:</strong> Set fixed order or enable randomization to reduce bias</li>
            <li><strong>Conditional Logic:</strong> Create dynamic surveys that adapt based on previous answers</li>
          </ul>
          
          <h3>Advanced Customization</h3>
          <p>Take your surveys to the next level with these features:</p>
          <ul>
            <li><strong>Custom CSS:</strong> Apply advanced styling with your own CSS code</li>
            <li><strong>JavaScript Integration:</strong> Add custom scripts for enhanced functionality</li>
            <li><strong>Multilingual Support:</strong> Create surveys in multiple languages with automatic translation</li>
            <li><strong>White Labeling:</strong> Remove PersonalysisPro branding (available on Enterprise plans)</li>
            <li><strong>Custom Domains:</strong> Host surveys on your own domain for a seamless experience</li>
          </ul>
          
          <h3>Best Practices</h3>
          <p>Consider these recommendations when customizing your surveys:</p>
          <ul>
            <li>Maintain brand consistency across all touchpoints</li>
            <li>Keep survey design clean and minimalist to focus attention on questions</li>
            <li>Test your customized survey on multiple devices before launching</li>
            <li>Save custom themes as templates for future surveys</li>
            <li>Collect feedback on the survey experience to continuously improve design</li>
          </ul>
        `
      },
      { 
        id: 13, 
        title: "Question Types", 
        description: "Overview of available question types and when to use each one.",
        content: `
          <h2>Question Types</h2>
          
          <p>PersonalysisPro offers a variety of question types optimized for personality assessment. Understanding when to use each type will help you create more effective surveys.</p>
          
          <h3>Likert Scale Questions</h3>
          <p>These questions ask respondents to rate their level of agreement with statements.</p>
          <ul>
            <li><strong>Format:</strong> Statement followed by a 5 or 7-point scale (Strongly Disagree to Strongly Agree)</li>
            <li><strong>Best for:</strong> Measuring attitudes, opinions, and personality traits</li>
            <li><strong>Example:</strong> "I enjoy being the center of attention at social gatherings."</li>
            <li><strong>Trait mapping:</strong> Excellent for measuring extraversion, agreeableness, and openness</li>
            <li><strong>Analysis:</strong> Provides nuanced data that works well with our AI algorithms</li>
          </ul>
          
          <h3>Multiple Choice Questions</h3>
          <p>These questions present several options for selection.</p>
          <ul>
            <li><strong>Format:</strong> Question with 3-7 distinct answer choices</li>
            <li><strong>Best for:</strong> Preferences, behaviors, and situational responses</li>
            <li><strong>Example:</strong> "When facing a difficult problem, I typically..."</li>
            <li><strong>Options:</strong> Single selection or multiple selection</li>
            <li><strong>Trait mapping:</strong> Good for identifying specific personality traits and behavioral tendencies</li>
          </ul>
          
          <h3>Ranking Questions</h3>
          <p>These questions ask participants to order items by preference or importance.</p>
          <ul>
            <li><strong>Format:</strong> A set of 3-7 items to arrange in priority order</li>
            <li><strong>Best for:</strong> Determining values, priorities, and preferences</li>
            <li><strong>Example:</strong> "Rank these workplace factors from most to least important to you."</li>
            <li><strong>Trait mapping:</strong> Excellent for identifying underlying motivations and values</li>
            <li><strong>Analysis:</strong> Provides comparative preferences that reveal personality dynamics</li>
          </ul>
          
          <h3>Semantic Differential Questions</h3>
          <p>These questions use opposing word pairs with a scale between them.</p>
          <ul>
            <li><strong>Format:</strong> Two opposing traits with a 5 or 7-point scale between</li>
            <li><strong>Best for:</strong> Capturing nuanced personality dimensions</li>
            <li><strong>Example:</strong> "Practical [1-7] Creative"</li>
            <li><strong>Trait mapping:</strong> Ideal for measuring complex personality spectrums</li>
            <li><strong>Analysis:</strong> Creates detailed personality profiles with fewer questions</li>
          </ul>
          
          <h3>Situational Judgment Questions</h3>
          <p>These questions present scenarios with multiple possible responses.</p>
          <ul>
            <li><strong>Format:</strong> A scenario followed by 3-5 potential reactions</li>
            <li><strong>Best for:</strong> Assessing behavioral tendencies in specific contexts</li>
            <li><strong>Example:</strong> "Your team member takes credit for your work in a meeting. You would most likely..."</li>
            <li><strong>Trait mapping:</strong> Excellent for measuring emotional intelligence and conflict resolution styles</li>
            <li><strong>Analysis:</strong> Provides contextual personality insights that predict real-world behavior</li>
          </ul>
          
          <h3>Best Practices for Question Selection</h3>
          <ul>
            <li>Use a variety of question types to maintain engagement</li>
            <li>Match question types to the traits you're trying to measure</li>
            <li>Consider the cognitive load when designing complex questions</li>
            <li>Test questions with a small group before full deployment</li>
            <li>Review the trait mapping analysis to ensure questions are capturing intended dimensions</li>
          </ul>
        `
      },
      { 
        id: 14, 
        title: "Personality Trait Analysis", 
        description: "Understanding how our AI analyzes traits from survey responses.",
        content: `
          <h2>Personality Trait Analysis</h2>
          
          <p>PersonalysisPro uses advanced AI algorithms to transform survey responses into comprehensive personality profiles. This guide explains how our trait analysis works and how to interpret the results.</p>
          
          <h3>Core Personality Framework</h3>
          <p>Our platform is built on scientifically validated personality models, including:</p>
          <ul>
            <li><strong>Five Factor Model (Big Five):</strong> Openness, Conscientiousness, Extraversion, Agreeableness, Neuroticism</li>
            <li><strong>Myers-Briggs Dimensions:</strong> Extraversion/Introversion, Sensing/Intuition, Thinking/Feeling, Judging/Perceiving</li>
            <li><strong>HEXACO Model:</strong> Adds Honesty-Humility dimension to the Big Five</li>
            <li><strong>Emotional Intelligence:</strong> Self-awareness, Self-regulation, Motivation, Empathy, Social skills</li>
            <li><strong>Work Style Traits:</strong> Leadership, Teamwork, Innovation, Detail-orientation, Time management</li>
          </ul>
          
          <h3>How the AI Works</h3>
          <p>Our trait analysis follows a sophisticated process:</p>
          <ol>
            <li><strong>Response Collection:</strong> Raw survey answers are securely captured</li>
            <li><strong>Pattern Recognition:</strong> AI algorithms identify consistent response patterns</li>
            <li><strong>Trait Scoring:</strong> Responses are mapped to personality dimensions and scored</li>
            <li><strong>Cross-Validation:</strong> Internal consistency checks ensure reliable measurement</li>
            <li><strong>Profile Generation:</strong> A comprehensive personality profile is created</li>
            <li><strong>Business Insights:</strong> Personality data is translated into actionable business intelligence</li>
          </ol>
          
          <h3>Interpreting Trait Scores</h3>
          <p>Each trait is presented on a percentile scale relative to population norms:</p>
          <ul>
            <li><strong>1-20%:</strong> Significantly below average</li>
            <li><strong>21-40%:</strong> Somewhat below average</li>
            <li><strong>41-60%:</strong> Average range</li>
            <li><strong>61-80%:</strong> Somewhat above average</li>
            <li><strong>81-100%:</strong> Significantly above average</li>
          </ul>
          
          <p>Remember that trait levels are not inherently "good" or "bad" - their significance depends on your specific context and objectives.</p>
          
          <h3>Business Applications</h3>
          <p>Personality trait data can inform various business functions:</p>
          <ul>
            <li><strong>Marketing:</strong> Tailor messaging to resonate with customer personality types</li>
            <li><strong>Product Development:</strong> Design features aligned with user personality preferences</li>
            <li><strong>Customer Service:</strong> Adjust communication styles based on customer traits</li>
            <li><strong>Team Building:</strong> Create balanced teams with complementary personality traits</li>
            <li><strong>Leadership Development:</strong> Identify strengths and growth areas based on trait profiles</li>
          </ul>
          
          <h3>Ethical Considerations</h3>
          <p>When using personality trait data, keep these ethical principles in mind:</p>
          <ul>
            <li>Obtain informed consent from respondents</li>
            <li>Maintain data privacy and security</li>
            <li>Avoid stereotyping based on trait profiles</li>
            <li>Remember that traits are tendencies, not absolutes</li>
            <li>Use trait data as one input among many for decision-making</li>
          </ul>
        `
      },
      { 
        id: 15, 
        title: "Sharing Surveys", 
        description: "Methods for distributing surveys to participants.",
        content: `
          <h2>Sharing Surveys</h2>
          
          <p>PersonalysisPro offers multiple distribution methods to help you reach your target audience effectively. This guide covers all available options for sharing your personality assessment surveys.</p>
          
          <h3>Direct Link Sharing</h3>
          <p>The simplest way to distribute your survey:</p>
          <ul>
            <li><strong>How to access:</strong> From your survey dashboard, click "Share" then "Get Link"</li>
            <li><strong>Customization options:</strong> Enable password protection or expiration date</li>
            <li><strong>Tracking:</strong> Add UTM parameters for advanced analytics integration</li>
            <li><strong>Best for:</strong> Sharing via messaging apps, social media, or direct communication</li>
            <li><strong>Pro tip:</strong> Use a URL shortener for cleaner links in printed materials</li>
          </ul>
          
          <h3>Email Invitations</h3>
          <p>Send professional email invitations directly from the platform:</p>
          <ul>
            <li><strong>How to access:</strong> From your survey dashboard, click "Share" then "Email Invitations"</li>
            <li><strong>Recipient options:</strong> Enter emails manually, upload CSV, or integrate with your CRM</li>
            <li><strong>Customization:</strong> Personalize subject line, message body, sender name, and logo</li>
            <li><strong>Scheduling:</strong> Send immediately or schedule for optimal timing</li>
            <li><strong>Follow-up:</strong> Set automated reminders for non-respondents</li>
          </ul>
          
          <h3>Website Embedding</h3>
          <p>Integrate surveys directly into your website:</p>
          <ul>
            <li><strong>How to access:</strong> From your survey dashboard, click "Share" then "Embed"</li>
            <li><strong>Integration options:</strong> 
              <ul>
                <li>Inline embed (survey appears directly on page)</li>
                <li>Modal popup (appears in a window overlay)</li>
                <li>Button trigger (opens when user clicks)</li>
                <li>Timed popup (appears after specified seconds)</li>
              </ul>
            </li>
            <li><strong>Customization:</strong> Adjust width, height, colors, and button text</li>
            <li><strong>Best for:</strong> Collecting feedback from website visitors or qualifying leads</li>
          </ul>
          
          <h3>QR Code Distribution</h3>
          <p>Generate scannable QR codes for offline distribution:</p>
          <ul>
            <li><strong>How to access:</strong> From your survey dashboard, click "Share" then "QR Code"</li>
            <li><strong>Customization:</strong> Adjust size, add logo, change colors</li>
            <li><strong>Download formats:</strong> PNG, SVG, PDF (print-ready)</li>
            <li><strong>Best for:</strong> Event feedback, print materials, physical locations</li>
            <li><strong>Pro tip:</strong> Test QR code scan functionality before printing large quantities</li>
          </ul>
          
          <h3>Social Media Sharing</h3>
          <p>Promote your survey across social platforms:</p>
          <ul>
            <li><strong>How to access:</strong> From your survey dashboard, click "Share" then "Social Media"</li>
            <li><strong>Platform options:</strong> Direct posting to LinkedIn, Twitter, Facebook, etc.</li>
            <li><strong>Customization:</strong> Editable post text and preview image</li>
            <li><strong>Scheduling:</strong> Plan posts for optimal engagement times</li>
            <li><strong>Analytics:</strong> Track clicks and conversions from social sources</li>
          </ul>
          
          <h3>Best Practices for Survey Distribution</h3>
          <ul>
            <li>Use multiple channels to maximize reach</li>
            <li>Segment your audience for more relevant invitations</li>
            <li>Clearly communicate the purpose and value of completing the survey</li>
            <li>Mention the estimated completion time in invitations</li>
            <li>Test all distribution methods before full-scale launch</li>
          </ul>
        `
      },
      { 
        id: 16, 
        title: "Managing Responses", 
        description: "How to view, filter, and export survey responses.",
        content: `
          <h2>Managing Responses</h2>
          
          <p>PersonalysisPro provides comprehensive tools for viewing, analyzing, and exporting survey responses. This guide covers everything you need to know about managing the data collected from your personality assessments.</p>
          
          <h3>Viewing Individual Responses</h3>
          <p>Access detailed information about each participant:</p>
          <ul>
            <li><strong>How to access:</strong> From your survey dashboard, select "Responses" then click on any respondent</li>
            <li><strong>Information available:</strong>
              <ul>
                <li>Timestamp and completion time</li>
                <li>Answers to all questions</li>
                <li>Personality trait profile</li>
                <li>Demographic information (if collected)</li>
                <li>Device and browser information</li>
              </ul>
            </li>
            <li><strong>Actions available:</strong> Flag for follow-up, add notes, tag with custom labels</li>
          </ul>
          
          <h3>Filtering and Segmenting Responses</h3>
          <p>Analyze specific subsets of your data:</p>
          <ul>
            <li><strong>Basic filters:</strong> Date range, completion status, source, device type</li>
            <li><strong>Demographic filters:</strong> Age, gender, location, occupation, etc.</li>
            <li><strong>Response filters:</strong> Filter by answers to specific questions</li>
            <li><strong>Trait filters:</strong> Filter by personality trait scores (e.g., high extraversion)</li>
            <li><strong>Saved segments:</strong> Create and save custom segments for ongoing analysis</li>
          </ul>
          
          <h3>Data Visualization Tools</h3>
          <p>Visualize response patterns and distributions:</p>
          <ul>
            <li><strong>Question summaries:</strong> See distribution of answers for each question</li>
            <li><strong>Trait distribution charts:</strong> View how respondents spread across trait dimensions</li>
            <li><strong>Trend analysis:</strong> Track changes in responses over time</li>
            <li><strong>Correlation maps:</strong> Identify relationships between different traits</li>
            <li><strong>Comparison tools:</strong> Compare different segments side by side</li>
          </ul>
          
          <h3>Exporting Data</h3>
          <p>Extract response data for external analysis or reporting:</p>
          <ul>
            <li><strong>Export formats:</strong> CSV, Excel, PDF, SPSS</li>
            <li><strong>Content options:</strong>
              <ul>
                <li>Raw response data</li>
                <li>Analyzed trait scores</li>
                <li>Summary statistics</li>
                <li>Visualization images</li>
                <li>Full reports</li>
              </ul>
            </li>
            <li><strong>Automation:</strong> Schedule recurring exports to email or cloud storage</li>
            <li><strong>API access:</strong> Programmatically retrieve data (available on Business and Enterprise plans)</li>
          </ul>
          
          <h3>Data Management Best Practices</h3>
          <ul>
            <li>Regularly review incoming responses to spot patterns or issues</li>
            <li>Create consistent tagging conventions for easier organization</li>
            <li>Use filters to identify outliers or unusual response patterns</li>
            <li>Export data backups periodically for safekeeping</li>
            <li>Document any data cleaning or transformation steps</li>
            <li>Follow data privacy regulations when sharing or storing response data</li>
          </ul>
          
          <h3>Response Notifications</h3>
          <p>Stay informed about new submissions:</p>
          <ul>
            <li>Set up real-time email alerts for new responses</li>
            <li>Configure threshold notifications for significant milestones</li>
            <li>Receive weekly summary reports of response activity</li>
            <li>Enable mobile app notifications (if using our mobile application)</li>
            <li>Create special alerts for responses matching specific criteria</li>
          </ul>
        `
      },
    ],
    "team-management": [
      { 
        id: 17, 
        title: "Adding Team Members", 
        description: "How to invite colleagues and set appropriate access levels.",
        content: `
          <h2>Adding Team Members</h2>
          
          <p>PersonalysisPro makes it easy to collaborate with colleagues on personality assessment projects. This guide explains how to add team members and manage their permissions.</p>
          
          <h3>Inviting New Users</h3>
          <p>Follow these steps to add team members to your workspace:</p>
          <ol>
            <li>Navigate to "Settings" from the main dashboard</li>
            <li>Select "Team Management" from the sidebar</li>
            <li>Click the "Invite Team Members" button</li>
            <li>Enter email addresses (individually or bulk upload via CSV)</li>
            <li>Assign appropriate roles to each invitee</li>
            <li>Add a personalized message (optional)</li>
            <li>Click "Send Invitations"</li>
          </ol>
          
          <h3>Understanding User Roles</h3>
          <p>PersonalysisPro offers several predefined roles with different permission sets:</p>
          <ul>
            <li><strong>Administrator:</strong> Full system access, including billing, user management, and all survey functions</li>
            <li><strong>Manager:</strong> Can create, edit, and delete surveys; view all results; manage team members</li>
            <li><strong>Creator:</strong> Can create and edit surveys, view results for their own surveys</li>
            <li><strong>Analyst:</strong> Cannot create surveys but has full access to view and analyze results</li>
            <li><strong>Viewer:</strong> Can only view dashboards and reports; no editing capabilities</li>
          </ul>
          
          <h3>Custom Permission Sets</h3>
          <p>For more granular control, you can create custom roles with specific permissions:</p>
          <ol>
            <li>Go to "Settings" > "Team Management" > "Custom Roles"</li>
            <li>Click "Create New Role"</li>
            <li>Name your custom role</li>
            <li>Configure permissions across these categories:
              <ul>
                <li>Survey Management (create, edit, delete, publish)</li>
                <li>Question Library (view, add, edit, delete)</li>
                <li>Results & Analysis (view, export, delete)</li>
                <li>Reports (view, create, share)</li>
                <li>Team Management (invite, edit permissions)</li>
                <li>Billing & Subscription (view, modify)</li>
              </ul>
            </li>
            <li>Save your custom role</li>
            <li>Assign to team members as needed</li>
          </ol>
          
          <h3>Managing Existing Team Members</h3>
          <p>Keep your team roster updated and secure:</p>
          <ul>
            <li><strong>Editing permissions:</strong> Change a user's role or custom permissions anytime</li>
            <li><strong>Deactivating accounts:</strong> Temporarily disable access without deleting the account</li>
            <li><strong>Removing users:</strong> Permanently remove team members who no longer need access</li>
            <li><strong>Transfer ownership:</strong> Change the primary account owner (requires confirmation)</li>
            <li><strong>Activity monitoring:</strong> View login history and action logs for security</li>
          </ul>
          
          <h3>Organizing Teams and Departments</h3>
          <p>For larger organizations, you can create team structures:</p>
          <ul>
            <li>Create departments or teams within your organization</li>
            <li>Assign members to specific departments</li>
            <li>Set department-level permissions and defaults</li>
            <li>Enable resource sharing within departments</li>
            <li>Generate department-specific reports and analytics</li>
          </ul>
          
          <h3>Best Practices for Team Management</h3>
          <ul>
            <li>Follow the principle of least privilege (give users only the permissions they need)</li>
            <li>Regularly audit user accounts and remove unnecessary access</li>
            <li>Create documentation for team members about your organization's survey practices</li>
            <li>Schedule training sessions for new team members</li>
            <li>Establish clear ownership for surveys and analysis projects</li>
          </ul>
        `
      },
      { 
        id: 18, 
        title: "Role-Based Permissions", 
        description: "Understanding the different user roles and their capabilities.",
        content: `
          <h2>Role-Based Permissions</h2>
          
          <p>PersonalysisPro uses a comprehensive role-based access control system to ensure team members have appropriate permissions. This guide details each role and its capabilities.</p>
          
          <h3>Administrator Role</h3>
          <p>Administrators have complete control over the platform:</p>
          <ul>
            <li><strong>User Management:</strong> Invite, modify, and remove users</li>
            <li><strong>Billing Control:</strong> Manage subscription plans, payment methods, and invoices</li>
            <li><strong>System Configuration:</strong> Set organization-wide defaults and policies</li>
            <li><strong>Data Management:</strong> Access all surveys, responses, and analytics</li>
            <li><strong>Security Settings:</strong> Configure authentication options and security policies</li>
            <li><strong>Audit Logs:</strong> View all platform activity for compliance and security</li>
          </ul>
          <p><strong>When to assign:</strong> Give Administrator access only to trusted team leaders who need full platform control.</p>
          
          <h3>Manager Role</h3>
          <p>Managers oversee project work but don't control billing or system settings:</p>
          <ul>
            <li><strong>Survey Management:</strong> Create, edit, publish, and delete any survey</li>
            <li><strong>Team Oversight:</strong> Invite users and modify their survey-related permissions</li>
            <li><strong>Analytics Access:</strong> View and export all survey results and reports</li>
            <li><strong>Resource Library:</strong> Full access to question libraries and templates</li>
            <li><strong>Limited System Access:</strong> Cannot change billing or core system settings</li>
          </ul>
          <p><strong>When to assign:</strong> Ideal for department heads or project leaders who manage multiple surveys and teams.</p>
          
          <h3>Creator Role</h3>
          <p>Creators focus on building and managing surveys:</p>
          <ul>
            <li><strong>Survey Creation:</strong> Build and modify their own surveys</li>
            <li><strong>Publishing Control:</strong> Launch and close their surveys</li>
            <li><strong>Results Access:</strong> View and analyze results for surveys they created</li>
            <li><strong>Limited Sharing:</strong> Share reports for their own surveys</li>
            <li><strong>No Team Management:</strong> Cannot add or modify user permissions</li>
          </ul>
          <p><strong>When to assign:</strong> Perfect for team members who need to create and run their own surveys independently.</p>
          
          <h3>Analyst Role</h3>
          <p>Analysts focus on data interpretation rather than survey creation:</p>
          <ul>
            <li><strong>Results Only:</strong> Full access to view all survey results and analytics</li>
            <li><strong>Report Creation:</strong> Build custom reports and dashboards</li>
            <li><strong>Data Export:</strong> Download and share results in various formats</li>
            <li><strong>No Survey Editing:</strong> Cannot create or modify surveys</li>
            <li><strong>Comment Access:</strong> Can add notes and analysis to results</li>
          </ul>
          <p><strong>When to assign:</strong> Ideal for data scientists, research team members, or executives who need insights without survey creation capabilities.</p>
          
          <h3>Viewer Role</h3>
          <p>Viewers have read-only access to select information:</p>
          <ul>
            <li><strong>Basic Viewing:</strong> See published reports and dashboards</li>
            <li><strong>Limited Results:</strong> Access only to surveys explicitly shared with them</li>
            <li><strong>No Export:</strong> Cannot download raw data or create new reports</li>
            <li><strong>No Editing:</strong> Cannot modify any content or settings</li>
            <li><strong>Comments Only:</strong> Can leave comments but not edit content</li>
          </ul>
          <p><strong>When to assign:</strong> Appropriate for stakeholders who need to view results but shouldn't modify surveys or access sensitive data.</p>
          
          <h3>Custom Roles</h3>
          <p>In addition to standard roles, you can create custom permission sets by combining specific capabilities:</p>
          <ul>
            <li><strong>Granular Controls:</strong> Select precise permissions for each functional area</li>
            <li><strong>Team-Specific:</strong> Create roles tailored to your organizational structure</li>
            <li><strong>Permission Groups:</strong> Bundle commonly used permission sets</li>
            <li><strong>Role Templates:</strong> Save custom roles as templates for future use</li>
            <li><strong>Inheritance:</strong> Build hierarchical permission structures</li>
          </ul>
          <p><strong>When to create:</strong> Develop custom roles when standard roles don't match your specific workflow needs.</p>
          
          <h3>Permission Management Tips</h3>
          <ul>
            <li>Audit user roles quarterly to ensure appropriate access</li>
            <li>Document your role structure and the rationale for custom permissions</li>
            <li>Start users with minimal access and increase as needed</li>
            <li>Consider creating time-limited roles for temporary team members</li>
            <li>Establish a clear process for requesting elevated permissions</li>
          </ul>
        `
      },
      { 
        id: 19, 
        title: "Collaboration Features", 
        description: "Tools for working together on survey creation and analysis.",
        content: `
          <h2>Collaboration Features</h2>
          
          <p>PersonalysisPro offers robust collaboration tools that enable team members to work together effectively on survey projects. This guide explores these features and how to use them efficiently.</p>
          
          <h3>Shared Workspaces</h3>
          <p>Central environments where teams can collaborate:</p>
          <ul>
            <li><strong>Organization Workspace:</strong> Main area shared by all team members</li>
            <li><strong>Department Workspaces:</strong> Dedicated spaces for specific teams</li>
            <li><strong>Project Workspaces:</strong> Temporary collaborative areas for specific initiatives</li>
            <li><strong>Resource Libraries:</strong> Shared collections of templates, questions, and assets</li>
            <li><strong>Activity Feeds:</strong> Real-time updates on workspace changes and activities</li>
          </ul>
          
          <h3>Collaborative Survey Design</h3>
          <p>Create surveys together with these powerful tools:</p>
          <ul>
            <li><strong>Multi-User Editing:</strong> Multiple team members can work on a survey simultaneously</li>
            <li><strong>Change Tracking:</strong> View a history of all modifications with user attribution</li>
            <li><strong>Commenting:</strong> Leave notes and feedback on specific questions or sections</li>
            <li><strong>Review Requests:</strong> Send surveys to colleagues for formal review</li>
            <li><strong>Approval Workflows:</strong> Establish multi-stage approval processes for survey publication</li>
          </ul>
          
          <h3>Template Management</h3>
          <p>Streamline your work with shared resources:</p>
          <ul>
            <li><strong>Team Templates:</strong> Create and share reusable survey structures</li>
            <li><strong>Question Library:</strong> Maintain a database of pre-approved questions</li>
            <li><strong>Brand Kits:</strong> Share consistent styling across team surveys</li>
            <li><strong>Text Snippets:</strong> Save and reuse common instructions or messages</li>
            <li><strong>Translation Memory:</strong> Share translated content across projects</li>
          </ul>
          
          <h3>Collaborative Analysis</h3>
          <p>Analyze results together with these features:</p>
          <ul>
            <li><strong>Shared Dashboards:</strong> Create and view analytics visualizations together</li>
            <li><strong>Annotation Tools:</strong> Add comments and interpretations to data points</li>
            <li><strong>Insight Tagging:</strong> Mark and categorize important findings</li>
            <li><strong>Analysis Sessions:</strong> Scheduled collaborative review meetings with shared controls</li>
            <li><strong>Presentation Mode:</strong> Create and deliver team presentations of findings</li>
          </ul>
          
          <h3>Communication Tools</h3>
          <p>Keep everyone in sync with integrated messaging:</p>
          <ul>
            <li><strong>In-App Messaging:</strong> Chat directly within the platform</li>
            <li><strong>Comment Threads:</strong> Focused discussions on specific elements</li>
            <li><strong>@Mentions:</strong> Tag team members to notify them about relevant items</li>
            <li><strong>Notification Center:</strong> Central hub for all alerts and updates</li>
            <li><strong>Email Digests:</strong> Configurable summaries of platform activity</li>
          </ul>
          
          <h3>Task Management</h3>
          <p>Coordinate team efforts efficiently:</p>
          <ul>
            <li><strong>Task Assignment:</strong> Delegate specific actions to team members</li>
            <li><strong>Due Dates:</strong> Set and track deadlines for project milestones</li>
            <li><strong>Progress Tracking:</strong> Monitor completion status of surveys and analysis</li>
            <li><strong>Checklists:</strong> Create standardized processes for common workflows</li>
            <li><strong>Calendar Integration:</strong> Sync deadlines with external calendars</li>
          </ul>
          
          <h3>Best Practices for Collaboration</h3>
          <ul>
            <li>Establish clear roles and responsibilities within collaborative projects</li>
            <li>Create naming conventions for shared resources</li>
            <li>Schedule regular sync meetings for active project teams</li>
            <li>Document decisions and rationales in comments</li>
            <li>Use templates to maintain consistency across team members</li>
            <li>Set up notification preferences to avoid information overload</li>
          </ul>
        `
      },
      { 
        id: 20, 
        title: "Activity Logs", 
        description: "Tracking team actions and changes within the platform.",
        content: `
          <h2>Activity Logs</h2>
          
          <p>PersonalysisPro maintains comprehensive activity logs to help you track all actions taken within your account. These logs provide transparency, accountability, and valuable information for troubleshooting and compliance purposes.</p>
          
          <h3>Accessing Activity Logs</h3>
          <p>Find and explore user activity records:</p>
          <ul>
            <li><strong>Main Access Path:</strong> Go to Settings > Activity Logs</li>
            <li><strong>Administrator View:</strong> See all account activity across users</li>
            <li><strong>User View:</strong> Individual users can see their own activity history</li>
            <li><strong>Context Access:</strong> Activity tabs on surveys, users, and other objects</li>
            <li><strong>Real-time Feed:</strong> Live activity stream available on the dashboard</li>
          </ul>
          
          <h3>Types of Logged Activities</h3>
          <p>The system tracks a wide range of actions:</p>
          <ul>
            <li><strong>User Management:</strong> Account creation, role changes, login activity</li>
            <li><strong>Survey Operations:</strong> Creation, editing, publishing, closing</li>
            <li><strong>Data Handling:</strong> Viewing, exporting, or deleting response data</li>
            <li><strong>System Settings:</strong> Changes to account configuration</li>
            <li><strong>Billing Events:</strong> Subscription changes, payment processing</li>
          </ul>
          
          <h3>Log Entry Details</h3>
          <p>Each activity record contains comprehensive information:</p>
          <ul>
            <li><strong>Timestamp:</strong> Exact date and time of the action</li>
            <li><strong>User Information:</strong> Name and email of the person who performed the action</li>
            <li><strong>IP Address:</strong> Origin of the request</li>
            <li><strong>Action Type:</strong> Categorized activity (create, edit, delete, view, etc.)</li>
            <li><strong>Object Details:</strong> What was affected (survey name, user, setting, etc.)</li>
            <li><strong>Before/After State:</strong> For edit actions, what was changed</li>
            <li><strong>System Notes:</strong> Additional context about the action</li>
          </ul>
          
          <h3>Filtering and Searching Logs</h3>
          <p>Find specific activities quickly:</p>
          <ul>
            <li><strong>Date Range:</strong> Filter activities by time period</li>
            <li><strong>User Filters:</strong> Focus on specific team members</li>
            <li><strong>Action Types:</strong> Filter by the kind of activity</li>
            <li><strong>Object Filters:</strong> Limit to actions affecting specific surveys or resources</li>
            <li><strong>Keyword Search:</strong> Find activities containing specific terms</li>
            <li><strong>Advanced Queries:</strong> Combine multiple filters for precise results</li>
            <li><strong>Saved Filters:</strong> Store commonly used filter combinations</li>
          </ul>
          
          <h3>Log Management and Exports</h3>
          <p>Work with your activity data:</p>
          <ul>
            <li><strong>Retention Period:</strong> Activity logs are kept for 12 months by default</li>
            <li><strong>Extended History:</strong> Enterprise plans offer longer retention options</li>
            <li><strong>Export Formats:</strong> Download logs as CSV, JSON, or PDF</li>
            <li><strong>Scheduled Exports:</strong> Set up automatic exports to email or cloud storage</li>
            <li><strong>Archiving:</strong> Save historical logs for long-term storage</li>
          </ul>
          
          <h3>Audit and Compliance Uses</h3>
          <p>Leverage activity logs for governance and compliance:</p>
          <ul>
            <li><strong>User Accountability:</strong> Track who made specific changes</li>
            <li><strong>Compliance Reporting:</strong> Generate reports for regulatory requirements</li>
            <li><strong>Security Monitoring:</strong> Identify suspicious activity patterns</li>
            <li><strong>Change Validation:</strong> Verify approved changes were implemented</li>
            <li><strong>Problem Resolution:</strong> Trace the history of issues to their source</li>
          </ul>
          
          <h3>Best Practices for Activity Monitoring</h3>
          <ul>
            <li>Review activity logs regularly, especially for sensitive operations</li>
            <li>Set up custom alerts for critical or unusual activities</li>
            <li>Export and archive logs monthly for important projects</li>
            <li>Include log review in your routine security practices</li>
            <li>Train team members on the importance of traceable actions</li>
            <li>Document your log review processes for compliance purposes</li>
          </ul>
        `
      },
    ],
    "data-management": [
      { 
        id: 21, 
        title: "Data Storage & Retention", 
        description: "How your data is stored and for how long.",
        content: `
          <h2>Data Storage & Retention</h2>
          
          <p>PersonalysisPro implements comprehensive data storage and retention policies to ensure your information is secure, accessible, and compliant with regulations. This guide explains how we handle your valuable data.</p>
          
          <h3>Data Storage Infrastructure</h3>
          <p>Understanding where and how your data is stored:</p>
          <ul>
            <li><strong>Cloud Infrastructure:</strong> All data is stored in enterprise-grade cloud environments with redundancy</li>
            <li><strong>Regional Data Centers:</strong> Data is stored in your selected geographic region</li>
            <li><strong>Data Encryption:</strong> All stored data is encrypted at rest using AES-256 encryption</li>
            <li><strong>Backup Systems:</strong> Automated daily backups with point-in-time recovery options</li>
            <li><strong>Database Architecture:</strong> Isolated tenant architecture prevents cross-account data exposure</li>
          </ul>
          
          <h3>Types of Data Stored</h3>
          <p>Different categories of data have different handling procedures:</p>
          <ul>
            <li><strong>Account Data:</strong> User profiles, authentication information, billing details</li>
            <li><strong>Survey Configuration:</strong> Questions, logic, design elements, and settings</li>
            <li><strong>Response Data:</strong> Participant answers and completion information</li>
            <li><strong>Analytical Results:</strong> Processed insights, personality profiles, and reports</li>
            <li><strong>System Logs:</strong> Activity records and audit trails</li>
          </ul>
          
          <h3>Standard Retention Periods</h3>
          <p>Our default data retention schedule:</p>
          <table>
            <tr>
              <th>Data Type</th>
              <th>Standard Retention</th>
              <th>Extended Options</th>
            </tr>
            <tr>
              <td>Account Data</td>
              <td>Active account + 2 years</td>
              <td>Custom retention available</td>
            </tr>
            <tr>
              <td>Survey Configurations</td>
              <td>Active account lifetime</td>
              <td>N/A</td>
            </tr>
            <tr>
              <td>Survey Responses</td>
              <td>24 months from collection</td>
              <td>3, 5, or 7 year options</td>
            </tr>
            <tr>
              <td>Analytical Results</td>
              <td>24 months from generation</td>
              <td>3, 5, or 7 year options</td>
            </tr>
            <tr>
              <td>System Logs</td>
              <td>12 months</td>
              <td>Up to 7 years (Enterprise plans)</td>
            </tr>
          </table>
          
          <h3>Customizing Retention Policies</h3>
          <p>Adjust data retention to meet your requirements:</p>
          <ul>
            <li><strong>Survey-Level Settings:</strong> Configure retention periods for individual surveys</li>
            <li><strong>Account-Level Defaults:</strong> Set organization-wide retention policies</li>
            <li><strong>Legal Hold:</strong> Suspend normal retention for specific data sets</li>
            <li><strong>Manual Archive:</strong> Create permanent archives of important data</li>
            <li><strong>Automated Pruning:</strong> Schedule automatic data cleanup processes</li>
          </ul>
          <p>To configure retention settings, go to Settings > Data Management > Retention Policies.</p>
          
          <h3>Data Deletion Processes</h3>
          <p>Understanding how data is removed from our systems:</p>
          <ul>
            <li><strong>Soft Deletion:</strong> Initial deletion moves data to a recoverable state for 30 days</li>
            <li><strong>Permanent Deletion:</strong> After recovery period, data is permanently removed</li>
            <li><strong>Sanitization:</strong> Storage locations are securely wiped following industry standards</li>
            <li><strong>Deletion Verification:</strong> Automated processes confirm complete removal</li>
            <li><strong>Deletion Certificates:</strong> Available for compliance documentation (Enterprise plans)</li>
          </ul>
          
          <h3>Data Portability</h3>
          <p>Options for accessing and moving your data:</p>
          <ul>
            <li><strong>Manual Exports:</strong> Download data in standard formats (CSV, JSON, Excel)</li>
            <li><strong>Scheduled Exports:</strong> Automate regular data exports to secure storage</li>
            <li><strong>API Access:</strong> Programmatically retrieve data for integration</li>
            <li><strong>Migration Services:</strong> Assisted data transfer between systems</li>
            <li><strong>Data Request Portal:</strong> Self-service system for data subject requests</li>
          </ul>
          
          <h3>Compliance Considerations</h3>
          <p>How our storage and retention practices support regulatory compliance:</p>
          <ul>
            <li><strong>GDPR Compliance:</strong> Data minimization and right to be forgotten</li>
            <li><strong>CCPA Support:</strong> Consumer request handling and data transparency</li>
            <li><strong>Data Processing Agreements:</strong> Available for Enterprise customers</li>
            <li><strong>Audit Trails:</strong> Complete logs of data access and modification</li>
            <li><strong>Compliance Reporting:</strong> Pre-built reports for common regulations</li>
          </ul>
          
          <h3>Best Practices for Data Management</h3>
          <ul>
            <li>Regularly review and export critical data</li>
            <li>Implement the shortest practical retention periods for personal data</li>
            <li>Document your organization's retention requirements and policies</li>
            <li>Train team members on proper data handling procedures</li>
            <li>Periodically audit access to sensitive response data</li>
          </ul>
        `
      },
      { 
        id: 22, 
        title: "Importing Data", 
        description: "Methods for importing existing customer or survey data.",
        content: `
          <h2>Importing Data</h2>
          
          <p>PersonalysisPro offers several methods for importing existing data into the platform. Whether you're migrating from another system or integrating with your existing tools, these import capabilities make the process straightforward.</p>
          
          <h3>Supported Import Types</h3>
          <p>You can import various kinds of data into the platform:</p>
          <ul>
            <li><strong>Contact Lists:</strong> Participant information for survey distribution</li>
            <li><strong>Survey Questions:</strong> Import existing questions or entire surveys</li>
            <li><strong>Response Data:</strong> Historical survey responses from other platforms</li>
            <li><strong>User Accounts:</strong> Team member information (Enterprise plan only)</li>
            <li><strong>Reference Data:</strong> Custom demographic or organizational information</li>
          </ul>
          
          <h3>File Import Methods</h3>
          <p>Import data directly from standard file formats:</p>
          <ul>
            <li><strong>CSV Import:</strong> Standard comma-separated values format
              <ul>
                <li>Supports mapping columns to system fields</li>
                <li>Handles international character sets</li>
                <li>Preview data before final import</li>
              </ul>
            </li>
            <li><strong>Excel Import (.xlsx):</strong> Direct Microsoft Excel file import
              <ul>
                <li>Multiple worksheet support</li>
                <li>Formula result import (not formulas themselves)</li>
                <li>Cell formatting detection for data types</li>
              </ul>
            </li>
            <li><strong>JSON Import:</strong> For structured data with nested elements
              <ul>
                <li>Ideal for complex survey structures</li>
                <li>Preserves hierarchical relationships</li>
                <li>Schema validation before import</li>
              </ul>
            </li>
            <li><strong>XML Import:</strong> For data exchange with legacy systems
              <ul>
                <li>DTD/XSD validation options</li>
                <li>XPath-based field mapping</li>
                <li>Namespace support</li>
              </ul>
            </li>
          </ul>
          
          <h3>Survey Platform Migrations</h3>
          <p>Specialized import tools for common survey platforms:</p>
          <ul>
            <li><strong>SurveyMonkey Migration:</strong> Direct API-based import of surveys and responses</li>
            <li><strong>Qualtrics Converter:</strong> Import QSF files with question types and logic</li>
            <li><strong>Google Forms Transfer:</strong> Import questions and responses from Google Forms</li>
            <li><strong>TypeForm Migration:</strong> Convert TypeForm surveys to PersonalysisPro format</li>
            <li><strong>Custom Platform Assistance:</strong> Contact support for help with other platforms</li>
          </ul>
          
          <h3>API-Based Imports</h3>
          <p>Programmatically import data for automation and integration:</p>
          <ul>
            <li><strong>REST API:</strong> Standard endpoints for all data types</li>
            <li><strong>Webhook Receivers:</strong> Accept data pushed from other systems</li>
            <li><strong>Batch Processing:</strong> Handle large volumes of data efficiently</li>
            <li><strong>Real-time Streaming:</strong> Process continuous data flows (Enterprise plan)</li>
            <li><strong>API Documentation:</strong> Comprehensive guides and examples available</li>
          </ul>
          
          <h3>Integration-Based Imports</h3>
          <p>Direct connections to popular business systems:</p>
          <ul>
            <li><strong>CRM Integrations:</strong> Import contacts from Salesforce, HubSpot, etc.</li>
            <li><strong>HRIS Connections:</strong> Sync employee data from Workday, BambooHR, etc.</li>
            <li><strong>Marketing Automation:</strong> Connect with Marketo, Mailchimp, etc.</li>
            <li><strong>Data Warehouse Links:</strong> Import from Snowflake, Redshift, BigQuery</li>
            <li><strong>iPaaS Support:</strong> Use Zapier, Microsoft Power Automate, or Make.com</li>
          </ul>
          
          <h3>Data Transformation During Import</h3>
          <p>Modify data during the import process:</p>
          <ul>
            <li><strong>Field Mapping:</strong> Connect source fields to destination fields</li>
            <li><strong>Data Type Conversion:</strong> Automatically convert between data formats</li>
            <li><strong>Value Transformations:</strong> Apply formulas or functions to incoming data</li>
            <li><strong>Filtering:</strong> Import only records meeting specific criteria</li>
            <li><strong>Deduplication:</strong> Identify and handle duplicate records</li>
            <li><strong>Data Enrichment:</strong> Add derived or calculated values during import</li>
          </ul>
          
          <h3>Best Practices for Data Imports</h3>
          <ul>
            <li>Always back up your data before performing imports</li>
            <li>Test imports with a small sample before processing complete datasets</li>
            <li>Create data validation rules to ensure quality</li>
            <li>Document your import process and field mappings</li>
            <li>Schedule large imports during off-peak hours</li>
            <li>Set up post-import verification reports</li>
            <li>Consider privacy implications when importing personal data</li>
          </ul>
        `
      },
      { 
        id: 23, 
        title: "Exporting Data", 
        description: "Options for exporting your data in various formats.",
        content: `
          <h2>Exporting Data</h2>
          
          <p>PersonalysisPro provides flexible options for exporting your valuable data for external analysis, reporting, or backup purposes. This guide covers all available export methods and best practices.</p>
          
          <h3>Available Export Formats</h3>
          <p>Choose from multiple formats to suit your needs:</p>
          <ul>
            <li><strong>CSV (Comma-Separated Values):</strong>
              <ul>
                <li>Universal compatibility with spreadsheet software</li>
                <li>Simple, flat structure for tabular data</li>
                <li>Configurable delimiters and encoding options</li>
              </ul>
            </li>
            <li><strong>Excel (.xlsx):</strong>
              <ul>
                <li>Native Microsoft Excel format with multiple worksheets</li>
                <li>Formatting and formula preservation</li>
                <li>Data validation and conditional formatting options</li>
              </ul>
            </li>
            <li><strong>JSON:</strong>
              <ul>
                <li>Ideal for preserving hierarchical data structures</li>
                <li>Perfect for developer use and API integrations</li>
                <li>Options for compact or pretty-printed formatting</li>
              </ul>
            </li>
            <li><strong>PDF:</strong>
              <ul>
                <li>Publication-ready reports with visualizations</li>
                <li>Customizable headers, footers, and styling</li>
                <li>Password protection and document security options</li>
              </ul>
            </li>
            <li><strong>SPSS (.sav):</strong>
              <ul>
                <li>Statistical analysis package format</li>
                <li>Preserves variable labels and value labels</li>
                <li>Includes metadata for statistical processing</li>
              </ul>
            </li>
          </ul>
          
          <h3>Types of Exportable Data</h3>
          <p>Export different kinds of platform data:</p>
          <ul>
            <li><strong>Response Data:</strong> Raw participant answers to survey questions</li>
            <li><strong>Personality Profiles:</strong> Analyzed trait scores and dimensions</li>
            <li><strong>Analytics Reports:</strong> Aggregated insights and statistics</li>
            <li><strong>Survey Configurations:</strong> Questions, logic, and design elements</li>
            <li><strong>Participant Lists:</strong> Contact information for survey respondents</li>
            <li><strong>Activity Logs:</strong> System usage and action records</li>
          </ul>
          
          <h3>Export Methods</h3>
          <p>Different ways to retrieve your data:</p>
          <ul>
            <li><strong>Manual Download:</strong> 
              <ul>
                <li>Access from the "Export" button in survey dashboards</li>
                <li>Select desired format and customization options</li>
                <li>Filter data before export if needed</li>
                <li>Immediate download to your device</li>
              </ul>
            </li>
            <li><strong>Scheduled Exports:</strong>
              <ul>
                <li>Set up recurring automatic exports</li>
                <li>Configure frequency (daily, weekly, monthly)</li>
                <li>Delivery via email or to cloud storage</li>
                <li>Filter criteria for focused data sets</li>
              </ul>
            </li>
            <li><strong>API-Based Export:</strong>
              <ul>
                <li>Programmatic access to all exportable data</li>
                <li>RESTful endpoints with authentication</li>
                <li>Pagination for large data sets</li>
                <li>Filtering and query parameters</li>
              </ul>
            </li>
          </ul>
          
          <h3>Export Customization</h3>
          <p>Tailor exports to your exact requirements:</p>
          <ul>
            <li><strong>Field Selection:</strong> Choose which fields to include</li>
            <li><strong>Data Filtering:</strong> Export only records meeting specific criteria</li>
            <li><strong>Date Ranges:</strong> Limit exports to specific time periods</li>
            <li><strong>Data Transformation:</strong> Apply calculations or formatting during export</li>
            <li><strong>Metadata Inclusion:</strong> Include descriptive information about the data</li>
            <li><strong>Anonymization Options:</strong> Remove or mask personal identifiers</li>
          </ul>
          
          <h3>Export Security</h3>
          <p>Protect sensitive data during and after export:</p>
          <ul>
            <li><strong>Encryption:</strong> Password-protect sensitive exports</li>
            <li><strong>Access Controls:</strong> Limit export capabilities by user role</li>
            <li><strong>Audit Logging:</strong> Track all export activities</li>
            <li><strong>Data Redaction:</strong> Automatically remove sensitive information</li>
            <li><strong>Secure Delivery:</strong> Encrypted transmission for scheduled exports</li>
            <li><strong>Export Watermarking:</strong> Track the source of exported files</li>
          </ul>
          
          <h3>Best Practices for Data Exports</h3>
          <ul>
            <li>Create a data export schedule for important surveys</li>
            <li>Document the structure and meaning of exported data</li>
            <li>Use consistent naming conventions for export files</li>
            <li>Consider data privacy regulations when exporting personal information</li>
            <li>Test large exports during off-peak hours</li>
            <li>Maintain secure storage for exported data containing sensitive information</li>
            <li>Periodically validate that scheduled exports are working correctly</li>
          </ul>
        `
      },
      { 
        id: 24, 
        title: "Data Backup", 
        description: "How we ensure your data is safely backed up.",
        content: `
          <h2>Data Backup</h2>
          
          <p>PersonalysisPro implements a comprehensive backup strategy to protect your valuable data from loss or corruption. This guide explains our backup processes and how you can supplement them with your own backup practices.</p>
          
          <h3>Platform Backup Architecture</h3>
          <p>How we protect your data at the system level:</p>
          <ul>
            <li><strong>Automated Daily Backups:</strong> Complete system snapshots taken every 24 hours</li>
            <li><strong>Incremental Backups:</strong> Hourly incremental changes captured between full backups</li>
            <li><strong>Multi-Region Redundancy:</strong> Backups stored in geographically separate data centers</li>
            <li><strong>Encryption:</strong> All backup data encrypted at rest and in transit</li>
            <li><strong>Integrity Verification:</strong> Automated checks ensure backup validity</li>
          </ul>
          
          <h3>Backup Retention Policy</h3>
          <p>How long we keep different types of backups:</p>
          <table>
            <tr>
              <th>Backup Type</th>
              <th>Standard Retention</th>
              <th>Enterprise Retention</th>
            </tr>
            <tr>
              <td>Hourly Incremental</td>
              <td>24 hours</td>
              <td>48 hours</td>
            </tr>
            <tr>
              <td>Daily Full Backup</td>
              <td>7 days</td>
              <td>30 days</td>
            </tr>
            <tr>
              <td>Weekly Consolidated</td>
              <td>4 weeks</td>
              <td>12 weeks</td>
            </tr>
            <tr>
              <td>Monthly Archive</td>
              <td>3 months</td>
              <td>12 months</td>
            </tr>
            <tr>
              <td>Point-in-Time Recovery</td>
              <td>7 days</td>
              <td>30 days</td>
            </tr>
          </table>
          
          <h3>Data Recovery Options</h3>
          <p>Available methods for restoring data if needed:</p>
          <ul>
            <li><strong>Full Account Recovery:</strong> Restore your entire account to a previous state</li>
            <li><strong>Selective Restoration:</strong> Recover specific surveys or data sets</li>
            <li><strong>Point-in-Time Recovery:</strong> Restore to a specific moment (hour granularity)</li>
            <li><strong>Object Versioning:</strong> Access previous versions of individual surveys or reports</li>
            <li><strong>Deleted Item Recovery:</strong> Retrieve items from the recycle bin within 30 days</li>
          </ul>
          
          <h3>Self-Service Backup Features</h3>
          <p>Tools for creating your own backups:</p>
          <ul>
            <li><strong>Manual Exports:</strong> Download data in standard formats (CSV, Excel, JSON)</li>
            <li><strong>Scheduled Exports:</strong> Set up automatic recurring backups
              <ul>
                <li>Configure frequency (daily, weekly, monthly)</li>
                <li>Select delivery method (email, cloud storage)</li>
                <li>Choose content to include</li>
              </ul>
            </li>
            <li><strong>API-Based Backup:</strong> Programmatically retrieve data for automated backup systems</li>
            <li><strong>Content Library:</strong> Archive surveys and report templates</li>
            <li><strong>Configuration Snapshots:</strong> Save complete survey setups for future reference</li>
          </ul>
          
          <h3>Disaster Recovery Capabilities</h3>
          <p>How we handle major system disruptions:</p>
          <ul>
            <li><strong>Failover Systems:</strong> Automatic switching to redundant infrastructure</li>
            <li><strong>Recovery Time Objective (RTO):</strong> 4 hours for standard plans, 2 hours for enterprise</li>
            <li><strong>Recovery Point Objective (RPO):</strong> 1 hour data loss maximum</li>
            <li><strong>Disaster Testing:</strong> Regular simulations and recovery drills</li>
            <li><strong>Incident Communication:</strong> Transparent status updates during recovery operations</li>
          </ul>
          
          <h3>Enterprise Backup Enhancements</h3>
          <p>Additional options available on Enterprise plans:</p>
          <ul>
            <li><strong>Custom Retention Policies:</strong> Tailored backup schedules and retention periods</li>
            <li><strong>Data Escrow Service:</strong> Third-party secured backup copies</li>
            <li><strong>Physical Backup Delivery:</strong> Encrypted hard drive backups (quarterly)</li>
            <li><strong>Backup Verification Reports:</strong> Regular attestation of backup integrity</li>
            <li><strong>Dedicated Recovery Support:</strong> Priority assistance for restore operations</li>
          </ul>
          
          <h3>Best Practices for Data Protection</h3>
          <ul>
            <li>Supplement system backups with regular manual exports of critical data</li>
            <li>Test the restoration process periodically to ensure familiarity</li>
            <li>Document your backup strategy and recovery procedures</li>
            <li>Maintain offline copies of your most important surveys and templates</li>
            <li>Regularly verify that scheduled exports are working correctly</li>
            <li>Implement internal access controls to prevent accidental deletion</li>
            <li>Create a data recovery contact list for your organization</li>
          </ul>
          
          <h3>Requesting Data Recovery</h3>
          <p>If you need to restore data from our backups:</p>
          <ol>
            <li>Go to Settings > Support > Recovery Request</li>
            <li>Select the type of recovery needed</li>
            <li>Specify the data to recover and the desired point in time</li>
            <li>Provide a reason for the recovery request</li>
            <li>Submit the request for processing</li>
          </ol>
          <p>Our support team will confirm the request and provide an estimated completion time.</p>
        `
      },
    ],
    "analytics": [
      { 
        id: 29, 
        title: "Basic Analytics", 
        description: "Understanding the fundamental metrics in your dashboard.",
        content: `
          <h2>Basic Analytics</h2>
          
          <p>The PersonalysisPro dashboard provides essential metrics that give you immediate insights into your survey performance and results. This guide explains these fundamental analytics and how to interpret them effectively.</p>
          
          <h3>Survey Performance Metrics</h3>
          <p>Track how your surveys are performing with these key indicators:</p>
          <ul>
            <li><strong>Response Rate:</strong> Percentage of invited participants who completed the survey
              <ul>
                <li>Benchmark: 20-30% is typical for external surveys, 40-60% for internal</li>
                <li>Calculation: (Completed Responses ÷ Total Invitations) × 100</li>
                <li>Usage: Evaluate invitation effectiveness and survey engagement</li>
              </ul>
            </li>
            <li><strong>Completion Rate:</strong> Percentage of started surveys that were completed
              <ul>
                <li>Benchmark: 70-85% indicates good survey design</li>
                <li>Calculation: (Completed Responses ÷ Started Surveys) × 100</li>
                <li>Usage: Identify potential issues with survey length or complexity</li>
              </ul>
            </li>
            <li><strong>Average Completion Time:</strong> How long respondents typically take
              <ul>
                <li>Benchmark: Varies by survey length; 5-10 minutes is ideal for engagement</li>
                <li>Visualization: Distribution chart showing time clusters</li>
                <li>Usage: Optimize survey length and identify potentially rushed responses</li>
              </ul>
            </li>
            <li><strong>Device Breakdown:</strong> What devices respondents are using
              <ul>
                <li>Categories: Desktop, Mobile, Tablet</li>
                <li>Visualization: Pie chart with percentage distribution</li>
                <li>Usage: Ensure your survey works well on the most common devices</li>
              </ul>
            </li>
          </ul>
          
          <h3>Respondent Demographics</h3>
          <p>Understand who is taking your surveys:</p>
          <ul>
            <li><strong>Age Distribution:</strong> Age ranges of participants
              <ul>
                <li>Visualization: Histogram or bar chart by age group</li>
                <li>Filters: Compare trait differences across age groups</li>
              </ul>
            </li>
            <li><strong>Gender Breakdown:</strong> Gender identity distribution
              <ul>
                <li>Visualization: Pie chart with percentage splits</li>
                <li>Filters: Compare trait differences across gender identities</li>
              </ul>
            </li>
            <li><strong>Geographic Distribution:</strong> Where respondents are located
              <ul>
                <li>Visualization: Interactive map with concentration indicators</li>
                <li>Drill-down: Country, region, city level analysis</li>
              </ul>
            </li>
            <li><strong>Custom Demographics:</strong> Any additional demographic data collected
              <ul>
                <li>Examples: Industry, job role, education level, etc.</li>
                <li>Visualization: Customizable charts based on data type</li>
              </ul>
            </li>
          </ul>
          
          <h3>Trait Distribution Metrics</h3>
          <p>Overview of personality trait measurements:</p>
          <ul>
            <li><strong>Trait Score Distribution:</strong> How respondents spread across trait dimensions
              <ul>
                <li>Visualization: Bell curve or histogram for each trait</li>
                <li>Reference: Population norms overlay for comparison</li>
                <li>Percentiles: Score interpretation guides</li>
              </ul>
            </li>
            <li><strong>Trait Correlation Map:</strong> How different traits relate to each other
              <ul>
                <li>Visualization: Heat map of correlation strengths</li>
                <li>Interpretation: Positive/negative relationships between traits</li>
                <li>Significance: Statistical confidence indicators</li>
              </ul>
            </li>
            <li><strong>Trait Segment Analysis:</strong> Natural groupings in your respondents
              <ul>
                <li>Visualization: Cluster diagram showing personality types</li>
                <li>Profiles: Common characteristic sets within groups</li>
                <li>Prevalence: Percentage of respondents in each segment</li>
              </ul>
            </li>
          </ul>
          
          <h3>Response Trend Analysis</h3>
          <p>How your data changes over time:</p>
          <ul>
            <li><strong>Response Volume Trends:</strong> Survey participation over time
              <ul>
                <li>Visualization: Line chart with daily/weekly response counts</li>
                <li>Markers: Survey launch dates, reminder sends, etc.</li>
                <li>Usage: Optimize timing for future survey distribution</li>
              </ul>
            </li>
            <li><strong>Trait Trends:</strong> Changes in trait measurements over time
              <ul>
                <li>Visualization: Line charts tracking trait averages</li>
                <li>Application: Measure impact of organizational initiatives</li>
                <li>Segmentation: Track changes within specific groups</li>
              </ul>
            </li>
            <li><strong>Cohort Analysis:</strong> Compare different participant groups
              <ul>
                <li>Visualization: Grouped bar charts or radar diagrams</li>
                <li>Filters: Define custom cohorts for comparison</li>
                <li>Statistical testing: Significance indicators for differences</li>
              </ul>
            </li>
          </ul>
          
          <h3>Using Basic Analytics Effectively</h3>
          <ul>
            <li>Start with performance metrics to ensure data quality before deeper analysis</li>
            <li>Use demographic filters to identify differences between respondent groups</li>
            <li>Look for clusters in trait distributions to identify natural personality segments</li>
            <li>Track trends over time to measure the impact of interventions or changes</li>
            <li>Create baseline measurements to enable meaningful comparisons</li>
            <li>Export visualizations for presentations and reports</li>
            <li>Set up regular analytics reviews with your team</li>
          </ul>
        `
      },
      { 
        id: 30, 
        title: "Advanced Insights", 
        description: "Leveraging AI-powered analytics for deeper understanding.",
        content: `
          <h2>Advanced Insights</h2>
          
          <p>PersonalysisPro's AI-powered analytics go beyond basic metrics to uncover deeper patterns and actionable intelligence. This guide explains how to leverage these advanced capabilities for transformative insights.</p>
          
          <h3>AI-Generated Personality Profiles</h3>
          <p>Our algorithms create detailed personality analyses from survey responses:</p>
          <ul>
            <li><strong>Multi-Dimensional Traits:</strong> Beyond simple scores to nuanced trait profiles
              <ul>
                <li>Primary Traits: Core personality dimensions (Big Five, etc.)</li>
                <li>Secondary Traits: More specific behavioral tendencies</li>
                <li>Contextual Variations: How traits manifest in different situations</li>
              </ul>
            </li>
            <li><strong>Trait Interaction Analysis:</strong> How different traits influence each other
              <ul>
                <li>Complementary Traits: Positive reinforcing patterns</li>
                <li>Conflicting Traits: Potential tension areas</li>
                <li>Compensatory Mechanisms: How certain traits balance others</li>
              </ul>
            </li>
            <li><strong>Linguistic Analysis:</strong> Insights from text responses
              <ul>
                <li>Sentiment Analysis: Emotional tone detection</li>
                <li>Communication Style: Formality, complexity, directness</li>
                <li>Thought Patterns: Analytical, creative, or concrete thinking styles</li>
              </ul>
            </li>
          </ul>
          
          <h3>Predictive Behavior Modeling</h3>
          <p>AI projections of likely behaviors and preferences:</p>
          <ul>
            <li><strong>Decision-Making Predictions:</strong> How individuals likely approach choices
              <ul>
                <li>Risk Tolerance: Conservative vs. adventurous tendencies</li>
                <li>Information Processing: Data-driven vs. intuitive approaches</li>
                <li>Time Orientation: Short-term vs. long-term perspective</li>
              </ul>
            </li>
            <li><strong>Interaction Style Predictions:</strong> Communication and relationship patterns
              <ul>
                <li>Conflict Resolution: Collaborative vs. competitive approaches</li>
                <li>Influence Methods: Persuasion techniques likely to be effective</li>
                <li>Team Dynamics: Projected role in group settings</li>
              </ul>
            </li>
            <li><strong>Motivational Drivers:</strong> What likely inspires and energizes individuals
              <ul>
                <li>Value Hierarchy: Primary vs. secondary motivational factors</li>
                <li>Reward Sensitivity: Response to different incentive types</li>
                <li>Growth Orientation: Fixed vs. development mindset indicators</li>
              </ul>
            </li>
          </ul>
          
          <h3>Pattern Recognition & Segmentation</h3>
          <p>Identify meaningful groupings and connections in your data:</p>
          <ul>
            <li><strong>Advanced Cluster Analysis:</strong> Discovery of natural personality types
              <ul>
                <li>Methodology: Machine learning algorithms identify natural groupings</li>
                <li>Archetypes: Common personality patterns with detailed profiles</li>
                <li>Distribution Analysis: Prevalence of different types in your population</li>
              </ul>
            </li>
            <li><strong>Psychographic Segmentation:</strong> Groups based on psychological attributes
              <ul>
                <li>Custom Segment Creation: Define target groups with specific attributes</li>
                <li>Comparative Analysis: Trait differences between segments</li>
                <li>Behavioral Correlations: Actions associated with each segment</li>
              </ul>
            </li>
            <li><strong>Network Analysis:</strong> Relationships between traits, behaviors, and outcomes
              <ul>
                <li>Correlation Mapping: Visual representation of trait relationships</li>
                <li>Causality Indicators: Potential directional influences</li>
                <li>Factor Analysis: Underlying dimensions driving multiple traits</li>
              </ul>
            </li>
          </ul>
          
          <h3>Business Intelligence Applications</h3>
          <p>Translating personality insights into business strategies:</p>
          <ul>
            <li><strong>Customer Preference Modeling:</strong> Product and experience recommendations
              <ul>
                <li>Feature Preference: Which product attributes appeal to different personas</li>
                <li>Communication Style: Messaging approaches for different segments</li>
                <li>Customer Journey Mapping: Personality-based path optimization</li>
              </ul>
            </li>
            <li><strong>Team Composition Analysis:</strong> Creating balanced, high-performing teams
              <ul>
                <li>Compatibility Assessment: Potential synergies and friction points</li>
                <li>Role Matching: Ideal position recommendations based on traits</li>
                <li>Development Opportunities: Growth areas based on trait patterns</li>
              </ul>
            </li>
            <li><strong>Market Strategy Insights:</strong> Aligning business approach with audience psychology
              <ul>
                <li>Segment Prioritization: High-value personality segments to target</li>
                <li>Messaging Framework: Communication strategies for different groups</li>
                <li>Product Development: Feature recommendations based on trait analysis</li>
              </ul>
            </li>
          </ul>
          
          <h3>Accessing Advanced Insights</h3>
          <p>How to find and use these powerful analytical tools:</p>
          <ul>
            <li><strong>AI Insight Dashboard:</strong> Available under the "Advanced Analytics" tab</li>
            <li><strong>Custom Reports:</strong> Create tailored analyses for specific business questions</li>
            <li><strong>Export Options:</strong> Generate detailed PDF reports or raw data exports</li>
            <li><strong>API Access:</strong> Integrate advanced insights into your business systems</li>
            <li><strong>Scheduled Analysis:</strong> Set up recurring insights for ongoing monitoring</li>
          </ul>
          
          <h3>Best Practices for Advanced Analytics</h3>
          <ul>
            <li>Start with a clear business question or hypothesis</li>
            <li>Combine quantitative metrics with AI-generated qualitative insights</li>
            <li>Test insights with targeted follow-up surveys or interviews</li>
            <li>Implement insights gradually, measuring impact as you go</li>
            <li>Create cross-functional teams to interpret and apply advanced insights</li>
            <li>Maintain ethical considerations when applying psychological insights</li>
            <li>Regularly update your analysis as new data becomes available</li>
          </ul>
        `
      },
      { 
        id: 31, 
        title: "Custom Reports", 
        description: "Creating tailored reports for specific business needs.",
        content: `
          <h2>Custom Reports</h2>
          
          <p>PersonalysisPro's custom reporting engine allows you to create precisely tailored reports that address your specific business questions and insights needs. This guide covers the complete process of building, automating, and sharing these reports.</p>
          
          <h3>Report Builder Basics</h3>
          <p>Getting started with the custom report creator:</p>
          <ul>
            <li><strong>Accessing the Report Builder:</strong>
              <ul>
                <li>Navigate to your survey dashboard</li>
                <li>Select "Reports" from the main menu</li>
                <li>Click "Create Custom Report"</li>
              </ul>
            </li>
            <li><strong>Report Types:</strong>
              <ul>
                <li>Survey Summary: Overview of all key metrics</li>
                <li>Trait Analysis: Focused on personality dimensions</li>
                <li>Respondent Comparison: Contrasting different participant groups</li>
                <li>Trend Analysis: Examining changes over time</li>
                <li>Business Insights: Actionable recommendations based on results</li>
                <li>Executive Brief: Condensed high-level findings</li>
              </ul>
            </li>
            <li><strong>Report Canvas:</strong>
              <ul>
                <li>Drag-and-drop interface for adding components</li>
                <li>Grid layout system with resizable elements</li>
                <li>Page management for multi-page reports</li>
                <li>Preview mode to see the final result</li>
              </ul>
            </li>
          </ul>
          
          <h3>Report Components</h3>
          <p>Building blocks for creating informative reports:</p>
          <ul>
            <li><strong>Text Elements:</strong>
              <ul>
                <li>Headings and subheadings with formatting options</li>
                <li>Text blocks with rich formatting</li>
                <li>Dynamic text that updates based on data</li>
                <li>Annotated comments and footnotes</li>
              </ul>
            </li>
            <li><strong>Data Visualizations:</strong>
              <ul>
                <li>Charts: Bar, line, pie, radar, scatter, and more</li>
                <li>Tables: Data grids with sorting and filtering</li>
                <li>Gauges: Visual indicators for key metrics</li>
                <li>Heat maps: Color-coded data intensity displays</li>
                <li>Word clouds: Visual representation of text responses</li>
              </ul>
            </li>
            <li><strong>Interactive Elements:</strong>
              <ul>
                <li>Filters: Allow report viewers to customize their view</li>
                <li>Drill-downs: Click through to see detailed information</li>
                <li>Tooltips: Reveal additional information on hover</li>
                <li>Tabs: Organize content into focused sections</li>
              </ul>
            </li>
            <li><strong>Media Elements:</strong>
              <ul>
                <li>Images: Add logos, illustrations, or photographs</li>
                <li>Icons: Visual indicators for important points</li>
                <li>Dividers: Visual separation between sections</li>
                <li>Shapes: Highlight information with visual elements</li>
              </ul>
            </li>
          </ul>
          
          <h3>Data Configuration</h3>
          <p>Connecting report elements to your survey data:</p>
          <ul>
            <li><strong>Data Sources:</strong>
              <ul>
                <li>Single Survey: Data from one specific survey</li>
                <li>Multiple Surveys: Combined data from related surveys</li>
                <li>Comparative Source: Side-by-side display of different data sources</li>
                <li>Trend Data: Time-series information from recurring surveys</li>
              </ul>
            </li>
            <li><strong>Data Filtering:</strong>
              <ul>
                <li>Response filters: Include only specific answer groups</li>
                <li>Demographic filters: Focus on particular respondent segments</li>
                <li>Date range filters: Limit data to specific time periods</li>
                <li>Completion filters: Include partial or complete responses</li>
              </ul>
            </li>
            <li><strong>Calculations:</strong>
              <ul>
                <li>Aggregations: Sum, average, median, count, etc.</li>
                <li>Custom formulas: Create your own calculations</li>
                <li>Statistical functions: Standard deviation, correlation, etc.</li>
                <li>Conditional logic: If-then rules for data display</li>
              </ul>
            </li>
          </ul>
          
          <h3>Report Styling and Branding</h3>
          <p>Create professionally designed reports:</p>
          <ul>
            <li><strong>Visual Themes:</strong>
              <ul>
                <li>Pre-built themes with coordinated colors and typography</li>
                <li>Custom theme creation with your brand elements</li>
                <li>Light and dark mode options</li>
                <li>Print-optimized themes for physical distribution</li>
              </ul>
            </li>
            <li><strong>Branding Elements:</strong>
              <ul>
                <li>Logo placement in header, footer, or watermark</li>
                <li>Custom color schemes matching your brand</li>
                <li>Typography selection with web and print fonts</li>
                <li>Header and footer customization</li>
              </ul>
            </li>
            <li><strong>Layout Options:</strong>
              <ul>
                <li>Page size and orientation settings</li>
                <li>Margin and padding controls</li>
                <li>Grid and guide systems for precise alignment</li>
                <li>Responsive design for multi-device viewing</li>
              </ul>
            </li>
          </ul>
          
          <h3>Sharing and Distribution</h3>
          <p>Deliver reports to stakeholders effectively:</p>
          <ul>
            <li><strong>Export Formats:</strong>
              <ul>
                <li>PDF: High-quality documents for printing and sharing</li>
                <li>Interactive Web: Online version with dynamic elements</li>
                <li>PowerPoint: Presentation-ready slides</li>
                <li>Image: PNG or JPG for quick sharing</li>
                <li>Raw Data: CSV or Excel for further analysis</li>
              </ul>
            </li>
            <li><strong>Sharing Methods:</strong>
              <ul>
                <li>Direct link: Shareable URL with optional password protection</li>
                <li>Email delivery: Send reports directly to recipients</li>
                <li>Embed code: Include reports in websites or intranets</li>
                <li>Integration sharing: Connect with Slack, Teams, etc.</li>
              </ul>
            </li>
            <li><strong>Access Controls:</strong>
              <ul>
                <li>Viewer permissions: Control who can access reports</li>
                <li>Edit permissions: Allow others to modify reports</li>
                <li>Expiration settings: Time-limited access</li>
                <li>Download restrictions: Control what can be exported</li>
              </ul>
            </li>
          </ul>
          
          <h3>Report Automation</h3>
          <p>Save time with automated report generation:</p>
          <ul>
            <li><strong>Scheduling Options:</strong>
              <ul>
                <li>Recurring schedules: Daily, weekly, monthly reports</li>
                <li>Trigger-based: Generate reports when conditions are met</li>
                <li>Data-threshold: Create reports when data reaches certain levels</li>
                <li>API-triggered: Programmatically generate reports</li>
              </ul>
            </li>
            <li><strong>Dynamic Content:</strong>
              <ul>
                <li>Data-driven text: Automatically generated insights</li>
                <li>Conditional sections: Show/hide based on results</li>
                <li>Comparative elements: Automatically highlight changes</li>
                <li>AI-generated commentary: Automatic result interpretation</li>
              </ul>
            </li>
            <li><strong>Delivery Automation:</strong>
              <ul>
                <li>Email distribution lists: Send to multiple stakeholders</li>
                <li>Delivery logs: Track when reports were sent and viewed</li>
                <li>Notification alerts: Inform users of new reports</li>
                <li>Repository archiving: Automatically save to document storage</li>
              </ul>
            </li>
          </ul>
          
          <h3>Best Practices for Custom Reports</h3>
          <ul>
            <li>Start with the end goal: Define what decisions the report should inform</li>
            <li>Focus on clarity: Choose visualizations that clearly communicate key insights</li>
            <li>Create a logical flow: Organize information in a coherent narrative structure</li>
            <li>Use consistent formatting: Maintain visual harmony throughout the report</li>
            <li>Include context: Provide benchmarks or comparisons where appropriate</li>
            <li>Highlight actionable insights: Emphasize findings that lead to specific actions</li>
            <li>Test with stakeholders: Get feedback before finalizing report templates</li>
            <li>Create a report library: Save successful reports as templates for future use</li>
          </ul>
        `
      },
      { 
        id: 32, 
        title: "Trend Analysis", 
        description: "Identifying patterns and changes over time.",
        content: `
          <h2>Trend Analysis</h2>
          
          <p>PersonalysisPro's trend analysis tools help you identify patterns and changes in personality traits and survey responses over time. This guide explains how to set up, interpret, and leverage these powerful longitudinal insights.</p>
          
          <h3>Types of Trend Analysis</h3>
          <p>Different approaches to examining data changes:</p>
          <ul>
            <li><strong>Longitudinal Tracking:</strong> Following the same respondents over time
              <ul>
                <li>Individual Development: Track a person's trait changes</li>
                <li>Before/After Measurement: Impact of specific interventions</li>
                <li>Growth Trajectory: Progressive development patterns</li>
              </ul>
            </li>
            <li><strong>Cross-Sectional Comparison:</strong> Different respondent groups across time periods
              <ul>
                <li>Seasonal Patterns: Recurring changes at specific times</li>
                <li>Generational Differences: Comparing age cohorts</li>
                <li>Organizational Evolution: How company culture changes</li>
              </ul>
            </li>
            <li><strong>Cumulative Aggregation:</strong> Building larger datasets over time
              <ul>
                <li>Benchmark Development: Creating more robust comparison standards</li>
                <li>Pattern Recognition: Identifying consistent traits in customer base</li>
                <li>Statistical Confidence: Increasing validity with larger samples</li>
              </ul>
            </li>
          </ul>
          
          <h3>Setting Up Trend Analysis</h3>
          <p>How to configure your surveys for effective trend tracking:</p>
          <ul>
            <li><strong>Survey Design for Trending:</strong>
              <ul>
                <li>Consistent Questions: Maintain core questions across survey versions</li>
                <li>Respondent Identifiers: Use consistent identifiers for longitudinal tracking</li>
                <li>Timestamp Capture: Enable precise time recording</li>
                <li>Version Control: Track survey modifications that might impact trends</li>
              </ul>
            </li>
            <li><strong>Collection Frequency:</strong>
              <ul>
                <li>Regular Intervals: Set consistent measurement periods</li>
                <li>Event-Triggered: Measure before and after significant events</li>
                <li>Continuous Assessment: Ongoing data collection with rolling analysis</li>
                <li>Milestone-Based: Measurement at key organizational or project points</li>
              </ul>
            </li>
            <li><strong>Trend Display Configuration:</strong>
              <ul>
                <li>Time Units: Select appropriate granularity (days, weeks, months, quarters)</li>
                <li>Comparison Basis: Absolute values vs. relative change</li>
                <li>Reference Points: Establish baselines and benchmarks</li>
                <li>Segmentation: Define groups for comparative trending</li>
              </ul>
            </li>
          </ul>
          
          <h3>Trend Visualization Tools</h3>
          <p>Ways to visually represent changes over time:</p>
          <ul>
            <li><strong>Timeline Charts:</strong>
              <ul>
                <li>Line Graphs: Show continuous change trajectories</li>
                <li>Area Charts: Emphasize cumulative amounts or proportions</li>
                <li>Stepped Lines: Highlight distinct measurement periods</li>
                <li>Multi-Series: Compare multiple traits simultaneously</li>
              </ul>
            </li>
            <li><strong>Comparative Visuals:</strong>
              <ul>
                <li>Radar/Spider Charts: Before/after trait profiles</li>
                <li>Clustered Bar Charts: Side-by-side time period comparison</li>
                <li>Heatmaps: Color-intensity time-series visualization</li>
                <li>Motion Charts: Animated visualization of changes</li>
              </ul>
            </li>
            <li><strong>Statistical Indicators:</strong>
              <ul>
                <li>Trendlines: Regression-based directional indicators</li>
                <li>Moving Averages: Smoothed patterns that reduce noise</li>
                <li>Confidence Intervals: Statistical reliability indicators</li>
                <li>Significance Markers: Highlight statistically meaningful changes</li>
              </ul>
            </li>
          </ul>
          
          <h3>Analyzing Personality Trait Trends</h3>
          <p>Interpretation of changes in psychological measures:</p>
          <ul>
            <li><strong>Short-Term vs. Long-Term Changes:</strong>
              <ul>
                <li>State vs. Trait Differentiation: Temporary vs. lasting changes</li>
                <li>Rate of Change Analysis: How quickly traits shift</li>
                <li>Stability Patterns: Which traits remain consistent over time</li>
                <li>Volatility Measures: Identifying highly variable characteristics</li>
              </ul>
            </li>
            <li><strong>Correlation with External Factors:</strong>
              <ul>
                <li>Event Mapping: Connecting trait changes with external events</li>
                <li>Environmental Factors: Impact of organizational changes</li>
                <li>Seasonal Effects: Recurring patterns tied to time of year</li>
                <li>Intervention Analysis: Measuring program impact on traits</li>
              </ul>
            </li>
            <li><strong>Group Dynamics:</strong>
              <ul>
                <li>Convergence/Divergence: Whether groups become more similar or different</li>
                <li>Cultural Evolution: Shifts in organizational personality</li>
                <li>Subgroup Comparison: Different trend patterns across teams</li>
                <li>Outlier Identification: Individuals with unique trend patterns</li>
              </ul>
            </li>
          </ul>
          
          <h3>Business Applications of Trend Analysis</h3>
          <p>Practical ways to use trend insights:</p>
          <ul>
            <li><strong>Program Effectiveness Measurement:</strong>
              <ul>
                <li>Training Impact: Assess how development programs change traits</li>
                <li>Culture Initiatives: Track shifts in organizational values</li>
                <li>Leadership Development: Measure growth in leadership dimensions</li>
                <li>ROI Calculation: Connect trait changes to business outcomes</li>
              </ul>
            </li>
            <li><strong>Customer Evolution Tracking:</strong>
              <ul>
                <li>Preference Shifts: Changing customer personality profiles</li>
                <li>Satisfaction Correlation: Link trait patterns to customer satisfaction</li>
                <li>Loyalty Prediction: Use trait trends to forecast retention</li>
                <li>Segment Migration: How customers move between psychographic segments</li>
              </ul>
            </li>
            <li><strong>Predictive Modeling:</strong>
              <ul>
                <li>Future State Projection: Forecast trait evolution</li>
                <li>Early Indicators: Identify leading signals of meaningful shifts</li>
                <li>Scenario Planning: Model different trait development paths</li>
                <li>Risk Detection: Spot concerning trend patterns early</li>
              </ul>
            </li>
          </ul>
          
          <h3>Advanced Trend Analysis Techniques</h3>
          <p>Sophisticated methods for deeper insights:</p>
          <ul>
            <li><strong>Time Series Analysis:</strong>
              <ul>
                <li>Seasonal Decomposition: Isolate cyclical patterns</li>
                <li>Autocorrelation: Identify time-dependent relationships</li>
                <li>ARIMA Modeling: Sophisticated forecasting methods</li>
                <li>Anomaly Detection: Identify unusual pattern deviations</li>
              </ul>
            </li>
            <li><strong>Cohort Analysis:</strong>
              <ul>
                <li>Generation Tracking: Follow specific entry groups over time</li>
                <li>Retention Patterns: How traits relate to ongoing engagement</li>
                <li>Maturation Effects: Distinguish age-related vs. environmental changes</li>
                <li>Interaction Analysis: How different cohorts influence each other</li>
              </ul>
            </li>
            <li><strong>AI-Enhanced Trending:</strong>
              <ul>
                <li>Pattern Recognition: Machine learning identification of complex trends</li>
                <li>Causal Analysis: AI-assisted identification of change drivers</li>
                <li>Natural Language Processing: Track linguistic pattern evolution</li>
                <li>Predictive Forecasting: Advanced projection of future states</li>
              </ul>
            </li>
          </ul>
          
          <h3>Best Practices for Trend Analysis</h3>
          <ul>
            <li>Establish clear baselines before tracking changes</li>
            <li>Use consistent measurement tools and methodologies</li>
            <li>Consider external factors that might influence trends</li>
            <li>Look for convergent evidence across multiple metrics</li>
            <li>Be cautious about attributing causality to correlated trends</li>
            <li>Document environmental events that might impact measurements</li>
            <li>Balance short-term fluctuations against long-term patterns</li>
            <li>Regularly validate trending tools and methods</li>
            <li>Create trend-specific reports and dashboards for monitoring</li>
            <li>Review trend analyses with cross-functional teams for diverse perspectives</li>
          </ul>
        `
      },
      { 
        id: 33, 
        title: "Exporting Analytics", 
        description: "Options for saving and sharing analytics data.",
        content: `
          <h2>Exporting Analytics</h2>
          
          <p>PersonalysisPro provides comprehensive options for exporting your valuable analytics data for external use, presentation, or further analysis. This guide covers all available export methods, formats, and best practices.</p>
          
          <h3>Export Formats for Different Needs</h3>
          <p>Choose the right format based on your intended use:</p>
          <ul>
            <li><strong>Visual Presentation Formats:</strong>
              <ul>
                <li><strong>PDF Reports:</strong> Professional documents with complete formatting
                  <ul>
                    <li>Best for: Formal presentations, printed materials, email sharing</li>
                    <li>Features: Preserves all visualizations, layout, and branding</li>
                    <li>Options: Password protection, quality settings, interactive elements</li>
                  </ul>
                </li>
                <li><strong>PowerPoint (.pptx):</strong> Presentation-ready slide decks
                  <ul>
                    <li>Best for: Meetings, presentations, executive briefings</li>
                    <li>Features: Each visualization as an editable slide element</li>
                    <li>Options: Company template integration, notes, animations</li>
                  </ul>
                </li>
                <li><strong>Image Files (.png, .jpg):</strong> Individual visualizations
                  <ul>
                    <li>Best for: Including in other documents, sharing specific charts</li>
                    <li>Features: High-resolution options, transparent backgrounds</li>
                    <li>Options: Custom dimensions, cropping, annotation</li>
                  </ul>
                </li>
              </ul>
            </li>
            <li><strong>Data Analysis Formats:</strong>
              <ul>
                <li><strong>Excel (.xlsx):</strong> Spreadsheet with data and basic charts
                  <ul>
                    <li>Best for: Additional analysis, pivot tables, custom charting</li>
                    <li>Features: Multiple worksheets, formulas, formatting</li>
                    <li>Options: Data-only or charts-included versions</li>
                  </ul>
                </li>
                <li><strong>CSV (Comma-Separated Values):</strong> Raw data in plain text
                  <ul>
                    <li>Best for: Importing to other analytics tools, data processing</li>
                    <li>Features: Universal compatibility, compact file size</li>
                    <li>Options: Delimiter selection, encoding options</li>
                  </ul>
                </li>
                <li><strong>SPSS (.sav):</strong> Statistical package format
                  <ul>
                    <li>Best for: Advanced statistical analysis</li>
                    <li>Features: Variable labels, value labels, metadata</li>
                    <li>Options: Transformation syntax, computed variables</li>
                  </ul>
                </li>
              </ul>
            </li>
            <li><strong>Web & Integration Formats:</strong>
              <ul>
                <li><strong>Interactive HTML:</strong> Web-based interactive dashboards
                  <ul>
                    <li>Best for: Online sharing, interactive exploration</li>
                    <li>Features: Filters, drill-downs, tooltips</li>
                    <li>Options: Embedding code, access controls</li>
                  </ul>
                </li>
                <li><strong>JSON:</strong> Structured data for web applications
                  <ul>
                    <li>Best for: API integration, web development</li>
                    <li>Features: Hierarchical data structure, metadata</li>
                    <li>Options: Formatting style, data filtering</li>
                  </ul>
                </li>
                <li><strong>XML:</strong> Extensible markup language for data exchange
                  <ul>
                    <li>Best for: Legacy system integration, structured data</li>
                    <li>Features: Schema definition, validation</li>
                    <li>Options: DTD inclusion, namespace configuration</li>
                  </ul>
                </li>
              </ul>
            </li>
          </ul>
          
          <h3>Export Methods</h3>
          <p>Different ways to trigger and deliver exports:</p>
          <ul>
            <li><strong>Manual Export:</strong>
              <ul>
                <li><strong>Dashboard Export:</strong> Direct from analytics view
                  <ul>
                    <li>Access: "Export" button on any dashboard or report</li>
                    <li>Options: Format selection, scope (current view/all data)</li>
                    <li>Delivery: Immediate download to your device</li>
                  </ul>
                </li>
                <li><strong>Customized Export:</strong> Configure specific export details
                  <ul>
                    <li>Access: "Advanced Export" option in export menu</li>
                    <li>Options: Field selection, filtering, formatting, calculations</li>
                    <li>Delivery: Download or send to specified destination</li>
                  </ul>
                </li>
                <li><strong>Bulk Export:</strong> Multiple items simultaneously
                  <ul>
                    <li>Access: "Bulk Export" in data management section</li>
                    <li>Options: Select multiple surveys, reports, or data sets</li>
                    <li>Delivery: Compressed file with all selected items</li>
                  </ul>
                </li>
              </ul>
            </li>
            <li><strong>Automated Export:</strong>
              <ul>
                <li><strong>Scheduled Exports:</strong> Regular, automatic delivery
                  <ul>
                    <li>Setup: "Schedule" option in export menu</li>
                    <li>Frequency: Daily, weekly, monthly, custom</li>
                    <li>Delivery: Email, cloud storage, SFTP, or webhook</li>
                  </ul>
                </li>
                <li><strong>Event-Triggered Exports:</strong> Based on specific conditions
                  <ul>
                    <li>Setup: "Triggers" section in data management</li>
                    <li>Conditions: Response threshold, date, data values</li>
                    <li>Delivery: Same options as scheduled exports</li>
                  </ul>
                </li>
                <li><strong>API-Initiated Exports:</strong> Programmatic export requests
                  <ul>
                    <li>Setup: Developer section with API credentials</li>
                    <li>Implementation: REST API calls with parameters</li>
                    <li>Delivery: Direct response or asynchronous callback</li>
                  </ul>
                </li>
              </ul>
            </li>
          </ul>
          
          <h3>Export Customization</h3>
          <p>Tailoring exports to your exact requirements:</p>
          <ul>
            <li><strong>Content Selection:</strong>
              <ul>
                <li>Full Reports: Complete analytics with all elements</li>
                <li>Specific Sections: Selected portions of analysis</li>
                <li>Individual Visualizations: Single charts or tables</li>
                <li>Raw Data: Underlying data without visualizations</li>
              </ul>
            </li>
            <li><strong>Data Filtering:</strong>
              <ul>
                <li>Date Range: Limit to specific time periods</li>
                <li>Respondent Segment: Filter by demographic or response patterns</li>
                <li>Data Completeness: Include/exclude partial responses</li>
                <li>Custom Filters: Advanced criteria combinations</li>
              </ul>
            </li>
            <li><strong>Visual Styling:</strong>
              <ul>
                <li>Branding Application: Add logos and corporate identity</li>
                <li>Color Schemes: Match company palette or optimize for purpose</li>
                <li>Typography: Font selection and sizing</li>
                <li>Layout Adjustments: Page orientation, margins, spacing</li>
              </ul>
            </li>
            <li><strong>Security Options:</strong>
              <ul>
                <li>Password Protection: Secure access to exported files</li>
                <li>Data Anonymization: Remove personally identifiable information</li>
                <li>Watermarking: Add ownership and usage information</li>
                <li>Expiration: Time-limited access to exports</li>
              </ul>
            </li>
          </ul>
          
          <h3>Managing Exported Data</h3>
          <p>Organizing and tracking your exports:</p>
          <ul>
            <li><strong>Export Library:</strong>
              <ul>
                <li>Access: "Export History" in your account dashboard</li>
                <li>Features: Browse, search, and re-download previous exports</li>
                <li>Organization: Categories, tags, and folders</li>
                <li>Retention: Configure how long exports are stored</li>
              </ul>
            </li>
            <li><strong>Sharing Controls:</strong>
              <ul>
                <li>Direct Sharing: Generate shareable links to exports</li>
                <li>Permission Control: Set who can access shared exports</li>
                <li>Notification: Alert team members about new exports</li>
                <li>Tracking: See who has viewed shared exports</li>
              </ul>
            </li>
            <li><strong>Storage Integration:</strong>
              <ul>
                <li>Cloud Storage: Direct export to Google Drive, Dropbox, etc.</li>
                <li>Enterprise Systems: Connect to SharePoint, Box, etc.</li>
                <li>SFTP Delivery: Secure file transfer to your servers</li>
                <li>Webhook Delivery: Send to custom endpoints</li>
              </ul>
            </li>
          </ul>
          
          <h3>Best Practices for Analytics Export</h3>
          <ul>
            <li><strong>Export Strategy:</strong>
              <ul>
                <li>Create a regular export schedule for critical data</li>
                <li>Document which exports contain what information</li>
                <li>Establish naming conventions for exports</li>
                <li>Define standard export templates for consistency</li>
              </ul>
            </li>
            <li><strong>Data Security:</strong>
              <ul>
                <li>Review exports for sensitive information before sharing</li>
                <li>Use appropriate security options for confidential data</li>
                <li>Implement a retention policy for exported files</li>
                <li>Audit who has access to exported analytics</li>
              </ul>
            </li>
            <li><strong>Usage Optimization:</strong>
              <ul>
                <li>Choose the right format for your intended use</li>
                <li>Include context and interpretation with raw data</li>
                <li>Create specialized exports for different stakeholders</li>
                <li>Gather feedback to improve export usefulness</li>
              </ul>
            </li>
          </ul>
          
          <h3>Enterprise Export Features</h3>
          <p>Advanced capabilities available on Enterprise plans:</p>
          <ul>
            <li><strong>Custom Export API:</strong> Build specialized export integrations</li>
            <li><strong>Advanced Security:</strong> DRM, digital signatures, audit trails</li>
            <li><strong>White-Label Exports:</strong> Completely branded export experience</li>
            <li><strong>Enhanced Automation:</strong> Complex export workflows and rules</li>
            <li><strong>Data Transformation:</strong> Custom calculations and formatting during export</li>
            <li><strong>Enterprise Integration:</strong> Direct connection to BI tools and data warehouses</li>
          </ul>
        `
      },
    ],
  };

  const handleArticleClick = (article) => {
    setSelectedArticle(article);
    setIsArticleOpen(true);
  };

  const filteredArticles = searchQuery 
    ? Object.values(docArticles).flat().filter(article => 
        article.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
        article.description.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : docArticles[activeCategory];

  return (
    <div className="container mx-auto px-4 py-12">
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-8 mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Documentation</h1>
        <p className="text-gray-600 mb-8">
          Everything you need to know about using the PersonalysisPro platform
        </p>
        
        <div className="relative mb-8">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
          <Input
            type="text"
            placeholder="Search documentation..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 py-3 w-full"
          />
        </div>
        
        {!searchQuery ? (
          <Tabs defaultValue={activeCategory} onValueChange={setActiveCategory} className="w-full">
            <TabsList className="mb-6 flex flex-wrap gap-2">
              {categories.map((category) => (
                <TabsTrigger 
                  key={category.id} 
                  value={category.id}
                  className="flex items-center gap-2 py-2 px-4"
                >
                  {category.icon}
                  <span>{category.label}</span>
                </TabsTrigger>
              ))}
            </TabsList>
            
            {categories.map((category) => (
              <TabsContent key={category.id} value={category.id} className="mt-0">
                <div className="grid md:grid-cols-2 gap-6">
                  {docArticles[category.id].map((article) => (
                    <div 
                      key={article.id} 
                      className="p-6 border border-gray-100 rounded-lg hover:border-primary/30 hover:shadow-md transition-all duration-200 cursor-pointer group"
                      onClick={() => handleArticleClick(article)}
                    >
                      <h3 className="text-lg font-semibold text-gray-900 mb-2 group-hover:text-primary transition-colors duration-200">
                        {article.title}
                      </h3>
                      <p className="text-gray-600 mb-3">{article.description}</p>
                      <div className="flex items-center text-primary font-medium text-sm">
                        Read more
                        <ChevronRight className="ml-1 w-4 h-4 transform group-hover:translate-x-1 transition-transform duration-200" />
                      </div>
                    </div>
                  ))}
                </div>
              </TabsContent>
            ))}
          </Tabs>
        ) : (
          <div>
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Search Results</h2>
            {filteredArticles.length > 0 ? (
              <div className="grid md:grid-cols-2 gap-6">
                {filteredArticles.map((article) => (
                  <div 
                    key={article.id} 
                    className="p-6 border border-gray-100 rounded-lg hover:border-primary/30 hover:shadow-md transition-all duration-200 cursor-pointer group"
                    onClick={() => handleArticleClick(article)}
                  >
                    <h3 className="text-lg font-semibold text-gray-900 mb-2 group-hover:text-primary transition-colors duration-200">
                      {article.title}
                    </h3>
                    <p className="text-gray-600 mb-3">{article.description}</p>
                    <div className="flex items-center text-primary font-medium text-sm">
                      Read more
                      <ChevronRight className="ml-1 w-4 h-4 transform group-hover:translate-x-1 transition-transform duration-200" />
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-10">
                <p className="text-gray-600 mb-4">No results found for "{searchQuery}"</p>
                <Button 
                  variant="outline" 
                  onClick={() => setSearchQuery("")}
                >
                  Clear Search
                </Button>
              </div>
            )}
          </div>
        )}
        
        <div className="mt-12 p-6 bg-gray-50 rounded-lg border border-gray-100">
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Need more help?</h2>
          <p className="text-gray-600 mb-4">
            If you can't find what you're looking for in our documentation, our support team is here to help.
          </p>
          <div className="flex flex-wrap gap-3">
            <a href="/contact">
              <Button variant="default">Contact us</Button>
            </a>
          </div>
        </div>
      </div>

      {/* Article Dialog */}
      <Dialog open={isArticleOpen} onOpenChange={setIsArticleOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          {selectedArticle && (
            <>
              <DialogHeader>
                <div className="flex items-center justify-between">
                  <DialogTitle className="text-2xl font-bold">{selectedArticle.title}</DialogTitle>
                  <DialogClose asChild>
                    <Button variant="ghost" size="icon">
                      <X className="h-4 w-4" />
                    </Button>
                  </DialogClose>
                </div>
                <DialogDescription className="text-gray-600 mt-2">
                  {selectedArticle.description}
                </DialogDescription>
              </DialogHeader>
              
              <div 
                className="article-content prose prose-primary max-w-none mt-4" 
                dangerouslySetInnerHTML={{ __html: selectedArticle.content }}
              />
              
              <DialogFooter className="flex justify-center items-center mt-6 pt-4 border-t">
                <Button 
                  variant="outline" 
                  className="flex items-center" 
                  onClick={() => setIsArticleOpen(false)}
                >
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  Back to Documentation
                </Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}