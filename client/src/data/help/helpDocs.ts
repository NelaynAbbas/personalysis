/**
 * Help Article Interface
 */
export interface HelpArticle {
  id: string;
  title: string;
  category: string;
  content: string;
  keywords: string[];
  relatedPages: string[];
  lastUpdated: string;
}

/**
 * Help Articles
 */
export const helpArticles: HelpArticle[] = [
  // Getting Started Articles
  {
    id: 'getting-started-overview',
    title: 'Getting Started with the Survey Platform',
    category: 'Getting Started',
    content: `
# Getting Started with our Survey Platform

Welcome to our advanced survey platform! This guide will help you understand the basics and get you up and running quickly.

## What You Can Do

- Create professional surveys with customizable templates
- Gather and analyze responses with powerful analytics tools
- Share surveys via multiple channels
- Collaborate with team members in real-time
- Generate AI-powered insights from your survey data

## First Steps

1. **Create an account or log in**: If you haven't already, create an account or log in to access all features.
2. **Explore the dashboard**: This is your central hub for managing all surveys and viewing analytics.
3. **Create your first survey**: Use one of our templates or start from scratch.
4. **Customize your survey**: Add your branding, customize questions, and set up logic flows.
5. **Share your survey**: Distribute via email, social media, or embed on your website.
6. **Analyze results**: View responses and analytics in real-time as they come in.

## Key Features to Explore

- **Templates Library**: Save time by starting with professionally designed templates
- **Real-time Collaboration**: Work with team members simultaneously
- **Advanced Question Types**: Create engaging surveys with various question formats
- **Logic Branching**: Create dynamic surveys that adapt based on responses
- **AI Analysis**: Get deeper insights with our AI-powered analytics

Need more help? Check out our detailed guides or contact support if you have specific questions.
    `,
    keywords: ['introduction', 'overview', 'basics', 'getting started', 'beginner', 'tutorial'],
    relatedPages: ['/', '/dashboard'],
    lastUpdated: '2025-04-01'
  },
  {
    id: 'create-first-survey',
    title: 'Creating Your First Survey',
    category: 'Getting Started',
    content: `
# Creating Your First Survey

Creating a survey is straightforward with our intuitive interface. Follow these steps to launch your first survey:

## Step 1: Start a New Survey

1. From your dashboard, click the "Create New Survey" button
2. Choose to start from scratch or select a template from our library
3. Give your survey a meaningful title and description

## Step 2: Add Questions

1. Click "Add Question" to insert new questions
2. Select the question type (multiple choice, rating, open-ended, etc.)
3. Enter your question text and any answer options
4. Use the formatting tools to customize appearance
5. Add instructions or descriptions if needed

## Step 3: Customize Survey Settings

1. Go to "Survey Settings" to configure:
   - **Appearance**: Customize colors, fonts, and add your logo
   - **Behavior**: Set up navigation options and progress indicators
   - **Logic**: Create conditional questions and page branching
   - **Notifications**: Set up email alerts for new responses

## Step 4: Preview and Test

1. Click "Preview" to see how your survey will appear to respondents
2. Test all question types and logic branches
3. Try completing the survey on different devices to ensure responsiveness

## Step 5: Launch Your Survey

1. Click "Publish" when you're ready to launch
2. Choose your distribution method:
   - Generate a shareable link
   - Send email invitations
   - Embed on your website
   - Share on social media

## Tips for Success

- Keep surveys concise to improve completion rates
- Use a mix of question types to maintain engagement
- Test your survey with a small group before wide distribution
- Consider offering incentives for completion

Your survey will start collecting responses immediately after publication. Monitor results in real-time from your dashboard.
    `,
    keywords: ['create', 'new survey', 'first survey', 'survey creation', 'setup', 'publish'],
    relatedPages: ['/survey/create', '/survey/customize'],
    lastUpdated: '2025-04-01'
  },
  {
    id: 'using-templates',
    title: 'Using Survey Templates',
    category: 'Getting Started',
    content: `
# Using Survey Templates

Our platform offers a variety of professionally designed templates to help you get started quickly. Templates are pre-built surveys with recommended questions, formatting, and logic that you can customize to suit your needs.

## Why Use Templates?

- **Save time**: Start with proven question sets instead of building from scratch
- **Follow best practices**: Our templates incorporate survey design best practices
- **Ensure quality**: Templates include properly formatted questions and response options
- **Maintain consistency**: Create multiple similar surveys with consistent structure

## Finding Templates

1. From your dashboard, click "Create New Survey"
2. Select "Choose a Template" 
3. Browse templates by category or use the search function
4. Preview templates to see questions and layout before selecting

## Popular Template Categories

- **Customer Satisfaction**: Measure customer experience and loyalty
- **Employee Feedback**: Gather insights from your team
- **Market Research**: Understand market trends and customer preferences
- **Event Feedback**: Collect attendee opinions after events
- **Education**: Course evaluations and student feedback
- **Product Feedback**: Get input on products and features

## Customizing Templates

After selecting a template:

1. Edit the survey title and description
2. Modify existing questions or add new ones
3. Remove questions that aren't relevant to your needs
4. Customize the appearance to match your branding
5. Adjust any logic or display conditions

## Creating Your Own Templates

You can also save your own surveys as templates:

1. Create a survey with your preferred structure and questions
2. From the survey editor, go to "Options" > "Save as Template"
3. Give your template a name and description
4. Choose whether to make it available to your entire team

Templates help ensure consistency across surveys while saving valuable time in the creation process.
    `,
    keywords: ['templates', 'survey templates', 'template library', 'pre-built', 'quick start'],
    relatedPages: ['/survey/create', '/templates'],
    lastUpdated: '2025-04-01'
  },
  // Survey Creation Articles
  {
    id: 'question-types',
    title: 'Survey Question Types and When to Use Them',
    category: 'Survey Creation',
    content: `
# Survey Question Types and When to Use Them

Choosing the right question types is essential for collecting accurate and useful data. Our platform offers various question formats to suit different research needs.

## Multiple Choice Questions

**Best for**: Gathering categorical data when respondents should select from predefined options.

**Example**: "Which of the following products have you purchased in the last month?"

**Tips**:
- Keep options mutually exclusive
- Consider including an "Other" option with a text field
- Use when you need quantifiable, easy-to-analyze responses

## Single Choice Questions

**Best for**: Questions with only one possible answer or opinion.

**Example**: "How did you hear about our company?"

**Tips**:
- Use radio buttons for 7 or fewer options
- Use dropdown menus for longer option lists
- Clearly indicate that only one selection is possible

## Rating Scale Questions

**Best for**: Measuring satisfaction, agreement, or importance on a numeric scale.

**Example**: "On a scale of 1-5, how satisfied are you with our customer service?"

**Tips**:
- Label the endpoints clearly (e.g., "Very Dissatisfied" to "Very Satisfied")
- Use consistent scales throughout your survey
- Consider whether you want to include a neutral midpoint

## Likert Scale Questions

**Best for**: Measuring attitudes or opinions with nuanced levels of agreement.

**Example**: "The product was easy to use."
- Strongly disagree
- Disagree
- Neither agree nor disagree
- Agree
- Strongly agree

**Tips**:
- Use when you need to capture intensity of opinions
- Maintain consistent direction of scales (positive to negative or vice versa)
- Group related Likert items together for easier analysis

## Open-Ended Questions

**Best for**: Collecting qualitative feedback when you want respondents to answer in their own words.

**Example**: "What improvements would you suggest for our service?"

**Tips**:
- Use sparingly as they require more effort to answer
- Consider setting character limits for focused responses
- Place these after related closed-ended questions

## Matrix/Grid Questions

**Best for**: Asking multiple related questions with the same response options.

**Example**: Rating several product features using the same scale.

**Tips**:
- Limit to 5-7 rows to prevent survey fatigue
- Use clear row and column labels
- Consider mobile users who may struggle with large grids

## Ranking Questions

**Best for**: Understanding preferences in order of importance.

**Example**: "Rank the following features in order of importance to you."

**Tips**:
- Limit to 7 or fewer items
- Provide clear instructions on how to complete the ranking
- Use when the relative order matters more than absolute ratings

## Best Practices

- Mix question types to maintain engagement
- Start with simpler question types before complex ones
- Use logic to show relevant question types based on previous answers
- Test your survey to ensure all question types function properly

The right question type can significantly impact your survey's completion rate and the quality of data collected.
    `,
    keywords: ['question types', 'multiple choice', 'likert', 'open-ended', 'rating scale', 'survey questions'],
    relatedPages: ['/survey/create', '/survey/customize'],
    lastUpdated: '2025-04-01'
  },
  {
    id: 'survey-logic',
    title: 'Setting Up Survey Logic and Branching',
    category: 'Survey Creation',
    content: `
# Setting Up Survey Logic and Branching

Survey logic allows you to create dynamic surveys that adapt based on respondents' answers. This creates a more personalized experience, improves completion rates, and collects more relevant data.

## Types of Survey Logic

### Skip Logic (Branching)

Skip logic directs respondents to different questions based on their answers to previous questions.

**Example**: If a respondent answers "No" to "Have you used our service before?", you might skip questions about service quality and instead ask why they haven't tried your service yet.

### Display Logic

Display logic shows or hides questions based on previous answers.

**Example**: Only showing questions about a specific product to respondents who indicated they've purchased it.

### Piping

Piping inserts a respondent's previous answer into later question text.

**Example**: Using their name throughout the survey after asking for it at the beginning.

### Randomization

Randomizes the order of questions or answer choices to prevent bias.

**Example**: Randomizing a list of features when asking respondents to rank them.

## Setting Up Basic Logic

1. Create your survey with all potential questions
2. Select the question that will trigger the logic
3. Click "Add Logic" or "Logic Rules"
4. Define the condition (e.g., "If answer equals X")
5. Specify the action (e.g., "Skip to question Y")
6. Save your logic rule

## Advanced Logic Techniques

### Multiple Conditions

Combine several conditions using AND/OR operators for complex branching.

**Example**: Show a question only if the respondent is both over 25 AND has purchased your product AND lives in a specific region.

### Chain Logic

Create logic chains where multiple rules work together for sophisticated paths.

**Example**: A respondent answers questions about their job role, which determines which department questions they see, which then determines which specific product questions they receive.

### Loop & Merge

For repeated sets of questions about multiple items.

**Example**: Asking the same set of satisfaction questions for each product a respondent has purchased.

## Testing Your Logic

1. Use the "Preview" mode to check all possible paths
2. Try different combinations of answers
3. Ask colleagues to test the survey
4. Check that no respondents can get "stuck" in logical loops

## Best Practices

- Plan your logic flow before building the survey
- Create a flowchart for complex surveys
- Only use logic when it adds value—too many branches can be confusing
- Always provide a path for all possible answer combinations
- Keep track of which questions use logic to simplify troubleshooting

Effective survey logic improves the respondent experience while collecting more targeted and relevant data.
    `,
    keywords: ['survey logic', 'branching', 'skip logic', 'conditional logic', 'display logic', 'piping', 'survey flow'],
    relatedPages: ['/survey/customize', '/survey/logic'],
    lastUpdated: '2025-04-01'
  },
  {
    id: 'survey-design-best-practices',
    title: 'Survey Design Best Practices',
    category: 'Survey Creation',
    content: `
# Survey Design Best Practices

Creating effective surveys goes beyond just asking questions. Follow these best practices to design surveys that engage respondents and collect high-quality data.

## Structure and Flow

### Start Strong
- Begin with an engaging introduction explaining the purpose and time commitment
- Place simple, interesting questions first to build momentum
- Save demographic questions for the end (unless needed for branching logic)

### Group Related Questions
- Organize questions into logical sections with clear headings
- Progress from general to specific topics
- Use page breaks to create manageable chunks

### End Effectively
- Thank respondents for their time
- Explain next steps or when they'll see results
- Provide contact information for questions

## Question Writing

### Be Clear and Specific
- Use simple, direct language
- Ask about one concept per question
- Avoid technical jargon unless your audience is familiar with it

### Eliminate Bias
- Use neutral wording that doesn't lead respondents
- Avoid loaded terms that might influence answers
- Present balanced response options

### Maintain Consistency
- Use the same scale direction throughout (e.g., always 1-5, not sometimes 5-1)
- Keep answer formats consistent for similar questions
- Maintain consistent terminology throughout

## Visual Design

### Optimize Readability
- Use sufficient contrast between text and background
- Choose an easily readable font size and style
- Highlight important instructions or key terms

### Create Visual Hierarchy
- Use headings and subheadings to organize content
- Apply consistent styling to question types
- Use white space effectively to prevent clutter

### Mobile Optimization
- Test your survey on multiple devices
- Keep matrix/grid questions limited for mobile users
- Use responsive design elements that adapt to screen size

## Technical Considerations

### Set Proper Validation
- Mark required questions clearly
- Use appropriate validation for email addresses, numbers, etc.
- Include helpful error messages for invalid responses

### Optimize Loading Speed
- Minimize large images that might slow loading
- Split very long surveys into multiple pages
- Consider connection quality of your target audience

### Test Thoroughly
- Preview on multiple browsers and devices
- Test all logic paths
- Have colleagues review for clarity and errors

## Ethical Considerations

### Respect Privacy
- Only collect necessary personal information
- Include a clear privacy statement
- Offer anonymity when appropriate

### Be Transparent
- Clearly state the survey's purpose
- Explain how data will be used
- Be honest about time commitments

### Accessibility
- Ensure compatibility with screen readers
- Provide alternative text for images
- Use sufficient color contrast for those with visual impairments

## Common Pitfalls to Avoid

- Making surveys too long
- Using double-barreled questions (asking two things at once)
- Requiring answers to sensitive questions
- Creating overly complex question logic
- Forgetting to test all aspects before launching

Following these best practices will help ensure your surveys yield valuable insights while providing a positive experience for respondents.
    `,
    keywords: ['survey design', 'best practices', 'questionnaire design', 'survey development', 'survey methodology'],
    relatedPages: ['/survey/create', '/survey/customize'],
    lastUpdated: '2025-04-01'
  },
  // Data Analysis Articles
  {
    id: 'understanding-survey-results',
    title: 'Understanding Your Survey Results',
    category: 'Data Analysis',
    content: `
# Understanding Your Survey Results

Collecting responses is just the beginning. Understanding how to interpret and analyze your survey data is crucial for extracting meaningful insights. Here's a guide to making sense of your survey results.

## Viewing Basic Results

### Response Overview
- **Response rate**: The percentage of invited participants who completed your survey
- **Completion rate**: The percentage of started surveys that were finished
- **Average completion time**: How long respondents took to complete the survey

### Question Summaries
- **Closed-ended questions**: View distribution of responses in percentages and counts
- **Open-ended questions**: Review individual responses or use text analysis tools
- **Rating questions**: See average scores and response distribution

## Types of Analysis

### Quantitative Analysis

For numerical data and closed-ended questions:

1. **Descriptive statistics**:
   - Mean (average)
   - Median (middle value)
   - Mode (most common response)
   - Standard deviation (spread of responses)

2. **Comparative analysis**:
   - Compare results across different segments
   - Track changes over time if repeat surveys are conducted
   - Benchmark against industry standards

### Qualitative Analysis

For open-ended responses:

1. **Thematic analysis**:
   - Identify common themes and patterns
   - Code responses into categories
   - Look for representative quotes

2. **Sentiment analysis**:
   - Determine if feedback is positive, negative, or neutral
   - Identify emotional content in responses
   - Track changes in sentiment over time

## Segmentation and Filtering

Break down results by:

- Demographic information
- Customer type or segments
- Respondent behavior or history
- Time periods
- Response to specific screening questions

This helps identify differences between groups and uncover insights that might be hidden in aggregate data.

## Visualization Tools

Use charts and graphs to better understand and communicate findings:

- **Bar charts**: Compare values across categories
- **Pie charts**: Show proportion of responses
- **Line graphs**: Display trends over time
- **Heat maps**: Identify patterns in matrix questions
- **Word clouds**: Visualize common terms in open responses

## Statistical Significance

For surveys with large sample sizes, consider:

- **Confidence intervals**: Understand the reliability of your results
- **P-values**: Determine if differences between groups are statistically significant
- **Correlation analysis**: Identify relationships between different responses

## Common Interpretation Pitfalls

- **Selection bias**: Your respondents may not represent your entire target population
- **Non-response bias**: People who didn't respond might have different opinions
- **Confirmation bias**: Looking only for results that confirm existing beliefs
- **Causation vs. correlation**: Remember that correlation doesn't imply causation

## Taking Action on Results

1. Identify key findings and insights
2. Prioritize areas for improvement
3. Develop action plans based on survey data
4. Set measurable goals for improvement
5. Communicate results to stakeholders
6. Plan follow-up surveys to measure progress

Remember that survey analysis is both an art and a science. Combining statistical rigor with contextual understanding of your organization and respondents will yield the most valuable insights.
    `,
    keywords: ['survey results', 'data analysis', 'survey analysis', 'interpret results', 'statistics', 'insights'],
    relatedPages: ['/results', '/dashboard'],
    lastUpdated: '2025-04-01'
  },
  {
    id: 'ai-insights-guide',
    title: 'Using AI-Powered Insights',
    category: 'Data Analysis',
    content: `
# Using AI-Powered Insights

Our platform's artificial intelligence capabilities can transform your survey data into actionable insights. Here's how to leverage AI to get more value from your surveys.

## Available AI Insights

### Sentiment Analysis
AI evaluates the emotional tone of open-ended responses to identify positive, negative, or neutral sentiment, helping you quickly understand overall feelings toward topics.

### Theme Detection
AI automatically identifies recurring themes and topics in open-ended responses, saving hours of manual coding and analysis.

### Response Categorization
AI groups similar responses together, making it easier to identify patterns and summarize large volumes of feedback.

### Predictive Analysis
Based on survey responses, AI can predict future behavior or outcomes like customer churn probability or product adoption.

### Natural Language Summaries
AI generates human-readable summaries of complex survey data, highlighting key findings and trends.

## Accessing AI Insights

1. Collect at least 50 responses for meaningful AI analysis
2. Navigate to the "Analysis" tab in your survey results
3. Select "AI Insights" from the menu
4. Choose the specific insights you want to generate
5. Allow the system a few moments to process (longer for larger datasets)

## Use Cases by Survey Type

### Customer Satisfaction Surveys
- Identify specific product features causing dissatisfaction
- Predict which customers are at risk of churning
- Discover unexpected customer pain points

### Employee Engagement Surveys
- Uncover hidden factors affecting employee morale
- Identify sentiment differences between departments
- Predict potential retention issues

### Market Research
- Analyze competitive advantages and disadvantages
- Identify emerging market trends
- Discover unmet customer needs

### Product Feedback
- Prioritize feature requests based on sentiment intensity
- Identify bugs and issues affecting multiple users
- Predict feature adoption rates

## Enhancing AI Insights

### Survey Design for AI
- Include open-ended follow-up questions to collect rich text data
- Use consistent rating scales for better comparative analysis
- Include demographic or segmentation questions for more detailed insights

### Combining AI with Human Analysis
- Use AI to handle large volumes of data initially
- Have human analysts review AI findings for context and nuance
- Ask follow-up questions based on AI discoveries

### Iterative Improvement
- Use AI insights to redesign future surveys
- Ask more targeted questions based on themes identified
- Track sentiment changes over time with repeat surveys

## Limitations and Considerations

- AI works best with larger sample sizes (50+ responses)
- Some industry-specific terminology may require custom tuning
- Always review critical insights rather than relying solely on automation
- AI analysis works across multiple languages but may have varying accuracy levels

## Best Practices

1. Start with a clear objective for what you want to learn
2. Combine structured and unstructured questions for comprehensive analysis
3. Use AI insights as a starting point for deeper investigation
4. Share relevant AI insights with stakeholders in digestible formats
5. Track changes in AI-detected patterns over time

AI-powered insights can dramatically reduce analysis time while uncovering patterns that might be missed by traditional methods. Use these capabilities to transform data collection into strategic decision-making.
    `,
    keywords: ['ai insights', 'artificial intelligence', 'machine learning', 'sentiment analysis', 'predictive analytics', 'text analysis'],
    relatedPages: ['/results', '/ai-insights'],
    lastUpdated: '2025-04-01'
  },
  {
    id: 'exporting-and-sharing-results',
    title: 'Exporting and Sharing Survey Results',
    category: 'Data Analysis',
    content: `
# Exporting and Sharing Survey Results

Our platform offers multiple ways to export, share, and present your survey findings. This guide covers all the options for getting your data into the right format and sharing it with stakeholders.

## Export Formats Available

### Raw Data Exports

- **CSV/Excel**: Complete dataset with one respondent per row
- **SPSS**: For statistical analysis in SPSS software
- **JSON**: For developers or custom analysis tools
- **API Access**: Programmatically access results for integration with other systems

### Report Exports

- **PDF Reports**: Formatted reports with visualizations and summaries
- **PowerPoint**: Presentation-ready slides with key findings
- **Word Documents**: Detailed reports with charts and analysis
- **Image Files**: Individual charts and graphs as PNG or JPG files

## How to Export Data

1. Navigate to your survey results
2. Select the "Export" or "Share" button
3. Choose your desired format
4. Select data options:
   - All data or filtered views
   - Date range selection
   - Question subset
   - Include or exclude incomplete responses
5. Customize report elements (for PDF/PowerPoint/Word exports):
   - Cover page
   - Table of contents
   - Executive summary
   - Question order
   - Chart types
6. Generate and download

## Sharing Options

### Direct Access Sharing

Share directly within the platform:

1. From survey results, click "Share"
2. Enter email addresses of recipients
3. Set permission levels:
   - View only
   - View and export
   - Full access (can modify filters and analysis)
4. Add a custom message
5. Choose whether to send automatic updates when new responses arrive

### Public Dashboard Sharing

Create public or password-protected dashboards:

1. From survey results, select "Create Dashboard"
2. Choose which elements to include
3. Customize appearance
4. Set access level:
   - Private (account users only)
   - Password-protected
   - Public link
5. Enable or disable data filters for viewers

### Automated Reports

Set up scheduled exports to stakeholders:

1. Go to "Automated Reports" in settings
2. Select report format and content
3. Choose frequency (daily, weekly, monthly)
4. Add recipients
5. Set conditional rules (e.g., only send if new responses received)

## Data Security Considerations

- **Personal Data**: Consider removing identifying information before sharing
- **Password Protection**: Use password protection for sensitive data
- **Access Logs**: Track who has viewed shared results
- **Expiring Links**: Set expiration dates for shared links when appropriate

## Presentation Best Practices

- **Highlight Key Findings**: Draw attention to the most important insights
- **Provide Context**: Include response rate and collection period
- **Use Appropriate Visualizations**: Choose the right chart type for each question
- **Include Methodology**: Briefly explain how data was collected
- **Add Commentary**: Provide interpretation alongside the raw data
- **Segment Results**: Break down findings by relevant demographic factors

## Integration with Other Tools

- **Business Intelligence Software**: Connect with Tableau, PowerBI, etc.
- **CRM Systems**: Integrate with Salesforce, HubSpot, and others
- **Project Management Tools**: Share results with Asana, Trello, or Jira
- **Collaboration Platforms**: Embed in Microsoft Teams, Slack, or SharePoint

Effective sharing of survey results ensures that the insights you've gathered drive action and decision-making throughout your organization.
    `,
    keywords: ['export data', 'share results', 'reports', 'data sharing', 'presentations', 'dashboards'],
    relatedPages: ['/results', '/dashboard', '/export'],
    lastUpdated: '2025-04-01'
  },
  // Survey Management Articles
  {
    id: 'survey-distribution',
    title: 'Survey Distribution Methods',
    category: 'Survey Management',
    content: `
# Survey Distribution Methods

Effectively distributing your survey is crucial for reaching your target audience and collecting representative data. Our platform offers multiple distribution methods to suit your particular needs.

## Email Distribution

### Direct Email

Send survey invitations directly from our platform:

1. Navigate to your survey and select "Distribute" > "Email"
2. Upload contacts or select from existing lists
3. Customize the email subject and message
4. Preview and send immediately or schedule for later

**Best for**: Reaching known contacts, customer lists, or employee groups

### Email Embed

Embed the survey link or first question in your own email campaigns:

1. Go to "Distribute" > "Email Embed"
2. Choose between link, button, or first question display
3. Copy the generated HTML
4. Paste into your email marketing system

**Best for**: Incorporating surveys into existing marketing emails or newsletters

## Web Distribution

### Website Embed

Embed surveys directly on your website:

1. Select "Distribute" > "Website"
2. Choose your embed type:
   - Inline embed
   - Pop-up
   - Slide-in
   - Chat-like interface
3. Customize timing, appearance, and targeting
4. Copy the generated code and add to your website

**Best for**: Collecting feedback from website visitors or conducting usability studies

### QR Codes

Generate QR codes for your survey:

1. Go to "Distribute" > "QR Code"
2. Customize size and design (optional)
3. Download the image
4. Add to printed materials, displays, or presentations

**Best for**: In-person events, retail locations, packaging, or printed materials

## Social Media Distribution

Share your survey across social platforms:

1. Select "Distribute" > "Social Media"
2. Choose platforms (Facebook, Twitter, LinkedIn, etc.)
3. Customize the message and preview image
4. Post directly or copy links for manual posting

**Best for**: Reaching broader audiences or conducting market research

## Mobile App Distribution

Distribute through your mobile application:

1. Go to "Distribute" > "Mobile SDK"
2. Follow integration instructions for iOS or Android
3. Configure in-app triggering rules
4. Test implementation before going live

**Best for**: Getting feedback from app users at specific interaction points

## SMS Distribution

Send survey links via text message:

1. Select "Distribute" > "SMS"
2. Upload phone numbers or select contacts
3. Craft a brief message with the survey link
4. Schedule and send

**Best for**: High urgency feedback or reaching audiences with limited internet access

## Advanced Distribution Options

### Targeted Distribution

Use logic to determine who receives your survey:

1. Create distribution rules based on contact properties
2. Set up quotas for different demographic groups
3. Stop collection automatically when quotas are met

**Best for**: Ensuring representative sample across population segments

### Scheduled Reminders

Increase response rates with automated follow-ups:

1. Go to "Distribute" > "Reminders"
2. Set timing for reminder messages
3. Customize reminder text
4. Configure to exclude those who have already responded

**Best for**: Maximizing response rates for important surveys

### API Integration

Programmatically trigger surveys from your own systems:

1. Navigate to "Distribute" > "API"
2. Generate API keys and review documentation
3. Implement API calls in your application

**Best for**: Complex workflows or integration with internal systems

## Best Practices

- **Multi-channel approach**: Use several distribution methods for wider reach
- **Mobile optimization**: Ensure your survey works well on mobile devices
- **Timing**: Send surveys at optimal times (typically mid-week, mid-day)
- **Clear expectations**: Communicate the survey's purpose and time commitment
- **Incentives**: Consider offering incentives for completion when appropriate
- **Testing**: Always test your distribution method before full deployment

Effective distribution strategies significantly impact response rates and data quality. Choose methods that best align with your audience's preferences and behaviors.
    `,
    keywords: ['survey distribution', 'sharing surveys', 'email surveys', 'web surveys', 'distribution methods', 'QR codes'],
    relatedPages: ['/survey/share'],
    lastUpdated: '2025-04-01'
  },
  {
    id: 'response-rates',
    title: 'Improving Survey Response Rates',
    category: 'Survey Management',
    content: `
# Improving Survey Response Rates

Low response rates can impact data quality and lead to biased results. Apply these proven strategies to increase your survey completion rates and collect more representative data.

## Optimize Survey Design

### Keep It Concise
- Limit surveys to 5-7 minutes when possible
- Display progress indicators so respondents know how much is left
- Remove unnecessary questions
- Use question logic to show only relevant questions

### Make It Engaging
- Vary question types to maintain interest
- Use conversational language
- Add visual elements where appropriate
- Include interactive elements like sliders or drag-and-drop ranking

### Mobile Optimization
- Ensure surveys display properly on all devices
- Use responsive design elements
- Keep matrix questions simple for mobile screens
- Test on multiple devices before launching

## Effective Invitations

### Compelling Subject Lines
- Keep subject lines under 50 characters
- Clearly state purpose (avoid spam-like language)
- Create a sense of importance or benefit
- Personalize when possible

### Clear Communication
- Explain why the survey matters
- State how the data will be used
- Be transparent about time commitment
- Outline any incentives offered

### Timing Considerations
- Send during business hours for B2B surveys
- Avoid holidays and weekends (unless specifically relevant)
- Consider your audience's typical schedule
- Send follow-up reminders (but don't overwhelm)

## Incentives and Motivation

### Types of Incentives
- Monetary rewards (gift cards, cash, donations)
- Prize drawings or sweepstakes
- Discounts on products or services
- Access to exclusive content or early product releases
- Sharing results with respondents

### Non-Monetary Motivation
- Appeal to helping improve services they use
- Emphasize the impact their feedback will have
- Create FOMO (fear of missing out)
- Leverage social proof ("others have contributed")

## Follow-Up Strategies

### Reminder Schedule
- Send first reminder 3-5 days after initial invitation
- Send second reminder 5-7 days later
- Change subject lines in reminders
- Only send to non-respondents

### Targeted Messaging
- Acknowledge it's a reminder
- Emphasize deadline if applicable
- Possibly increase incentive for later reminders
- Make it easy to find the survey link

## Technical Considerations

### Accessibility
- Ensure surveys work with screen readers
- Use sufficient color contrast
- Provide keyboard navigation options
- Offer alternative formats if necessary

### Reduce Friction
- Minimize required login steps
- Save progress automatically
- Allow responses to be completed in multiple sessions
- Optimize loading speeds

## Segment-Specific Strategies

### For Customers
- Time surveys after significant interactions
- Connect to previous purchase or service experience
- Show appreciation for their business
- Explain how feedback improves their future experience

### For Employees
- Guarantee anonymity when appropriate
- Communicate action plans from previous surveys
- Schedule during lower workload periods
- Get management endorsement

### For General Public/Market Research
- Use screening questions to identify qualified respondents
- Be clear about eligibility requirements upfront
- Consider using survey panels for hard-to-reach groups
- Optimize for sharing on social platforms

## Measuring and Testing

### Key Metrics to Track
- Invitation open rate
- Survey start rate
- Completion rate
- Abandonment points (where do people quit?)
- Time to complete

### A/B Testing Opportunities
- Test different subject lines
- Compare various incentive structures
- Experiment with survey length
- Try different distribution channels

Remember that higher response rates aren't the only goal—you also want quality, thoughtful responses. Balance quantity with quality by designing engaging, relevant surveys that respect respondents' time and provide clear value.
    `,
    keywords: ['response rates', 'survey completion', 'abandonment', 'increasing responses', 'participation rates'],
    relatedPages: ['/survey/share', '/dashboard'],
    lastUpdated: '2025-04-02'
  },
  {
    id: 'survey-collaboration',
    title: 'Team Collaboration on Surveys',
    category: 'Survey Management',
    content: `
# Team Collaboration on Surveys

Our platform enables seamless collaboration among team members when creating, managing, and analyzing surveys. This guide covers collaborative features and best practices for team-based survey projects.

## Collaboration Features

### User Roles and Permissions

Our platform offers different access levels:

- **Admin**: Full access to all surveys and account settings
- **Manager**: Can create, edit, and analyze surveys
- **Editor**: Can edit surveys and view results
- **Viewer**: Can only view specified surveys and results
- **Respondent**: Special access for internal surveys/feedback

To set roles:
1. Go to "Account Settings" > "Team Members"
2. Invite new members with their email address
3. Assign appropriate roles
4. Set survey-specific permissions as needed

### Real-Time Collaboration

Multiple team members can work on a survey simultaneously:

- See who is currently viewing or editing the survey
- View cursor positions of other editors
- Get notifications when changes are made
- Access revision history to see who made specific changes

### Comments and Discussion

- Add comments to specific questions or sections
- Tag team members to notify them
- Resolve comments when addressed
- Keep a discussion thread for each survey

## Collaborative Workflows

### Survey Creation Process

1. **Planning phase**:
   - Create survey outline as a shared document
   - Assign sections to different team members
   - Set up review milestones

2. **Build phase**:
   - Work simultaneously on different sections
   - Use comments for questions or suggestions
   - Schedule regular check-ins to ensure consistency

3. **Review phase**:
   - Assign specific reviewers
   - Create a review checklist
   - Set approval processes for final launch

### Results Analysis Collaboration

1. Share dashboards with customized views for different stakeholders
2. Schedule review meetings to discuss insights
3. Assign team members to investigate specific findings
4. Collaboratively develop action plans based on results

## Project Management Integration

Connect your survey projects with project management tools:

- Integrate with Asana, Trello, Monday.com, etc.
- Set up automated notifications for survey milestones
- Create tasks based on survey results
- Track progress on survey-driven initiatives

## Best Practices for Team Collaboration

### Clear Ownership and Accountability

- Designate a survey owner/project manager
- Assign specific responsibilities to team members
- Create clear timelines with owner for each milestone
- Document decisions made about survey design

### Communication Protocols

- Establish preferred communication channels
- Set expectations for response times
- Schedule regular sync meetings during active projects
- Create templates for common survey elements

### Knowledge Management

- Maintain a library of successful surveys
- Document best practices and lessons learned
- Create internal training materials
- Share relevant articles and research

### Collaborative Testing

- Assign different test scenarios to team members
- Consolidate testing feedback in one location
- Verify fixes as a team
- Conduct group preview sessions before launch

## Cross-Department Collaboration

### Working with Subject Matter Experts

- Involve SMEs early in question development
- Create clear briefing documents for context
- Use approval workflows for technical content
- Provide templates to standardize input

### Collaborating with External Stakeholders

- Set up limited access for external partners
- Use version control to track external input
- Create review links with appropriate permissions
- Schedule collaborative review sessions

## Team Training and Development

- Share survey design principles across the team
- Conduct internal workshops on effective questions
- Create opportunities for skill sharing
- Recognize and leverage individual strengths

Effective team collaboration ensures that your surveys benefit from diverse expertise while maintaining consistency and quality. Use our collaborative features to streamline workflows and create better surveys together.
    `,
    keywords: ['collaboration', 'team surveys', 'survey collaboration', 'team access', 'permissions', 'shared surveys'],
    relatedPages: ['/survey/collaborate', '/team'],
    lastUpdated: '2025-04-02'
  },
  // Account & Settings Articles
  {
    id: 'account-management',
    title: 'Managing Your Account Settings',
    category: 'Account & Settings',
    content: `
# Managing Your Account Settings

Properly configuring your account settings ensures you get the most out of our survey platform. This guide covers essential account management features and recommended configurations.

## Account Settings Overview

To access account settings:
1. Log in to your account
2. Click your profile icon in the top-right corner
3. Select "Account Settings" from the dropdown menu

## Personal Profile Settings

### User Profile
- Update your name, job title, and contact information
- Change your profile picture
- Set your preferred language and time zone
- Manage notification preferences

### Security Settings
- Change your password (recommended every 90 days)
- Enable two-factor authentication (2FA) for added security
- View active sessions and sign out remotely
- Review account activity logs

### Email Preferences
- Set which notifications you receive by email
- Configure digest options (daily, weekly summaries)
- Format preferences (HTML vs. plain text)
- Manage marketing communications opt-ins

## Organization Settings

### Company Profile
- Update organization name and contact information
- Upload company logo for branded surveys
- Set default company language and time zone
- Configure company address and business details

### Billing and Subscription
- View current plan and usage statistics
- Update payment methods
- Download invoices and billing history
- Manage plan upgrades or changes

### White Labeling
- Remove platform branding from surveys
- Set custom domain for survey links
- Configure email sender information
- Customize survey themes to match brand guidelines

## Team Management

### User Management
- Add new team members
- Assign user roles and permissions
- Organize users into groups
- Deactivate accounts for departing team members

### Permission Settings
- Create custom permission roles
- Set survey-level access controls
- Configure approval workflows
- Establish content libraries with varied access

### Team Dashboards
- Create shared workspaces
- Set up team-specific dashboards
- Configure default views for different teams
- Share templates and resources

## Integration Management

### API Access
- Generate and manage API keys
- Set API usage limits
- Monitor API activity
- Access developer documentation

### Third-Party Integrations
- Connect to CRM systems (Salesforce, HubSpot, etc.)
- Set up marketing automation integrations
- Configure analytics tool connections
- Enable project management tool integrations

### Single Sign-On (SSO)
- Set up SAML or OAuth authentication
- Configure identity provider settings
- Manage user provisioning
- Test SSO connections

## Data Management

### Data Retention
- Set automatic data deletion timeframes
- Configure backup settings
- Establish archiving policies
- Manage GDPR compliance settings

### Privacy Settings
- Configure data collection policies
- Set default anonymity options
- Manage consent configurations
- Set up data processing agreements

### Export Configurations
- Create default export formats
- Set up scheduled exports
- Configure automatic data backups
- Manage export permissions

## Best Practices for Account Management

### Regular Maintenance
- Review user accounts quarterly
- Update security settings regularly
- Clean up unused resources
- Check integration connections periodically

### Security Recommendations
- Require strong passwords
- Implement 2FA for all users
- Review access logs regularly
- Conduct security training for team members

### Optimization Tips
- Customize default settings to match typical usage
- Create templates for common configurations
- Document organization-specific processes
- Schedule regular account reviews

Properly managing your account settings enhances security, improves efficiency, and ensures a consistent experience across your organization. Take time to configure these settings thoughtfully based on your specific needs.
    `,
    keywords: ['account management', 'settings', 'account settings', 'user profile', 'team management', 'security settings'],
    relatedPages: ['/account', '/settings'],
    lastUpdated: '2025-04-02'
  },
  {
    id: 'data-security',
    title: 'Data Security and Privacy',
    category: 'Account & Settings',
    content: `
# Data Security and Privacy

Protecting your data and respecting respondent privacy are top priorities. This guide explains our security measures and offers best practices for handling survey data responsibly.

## Platform Security Measures

### Infrastructure Security
- Hosted on secure cloud infrastructure with 99.9% uptime
- Regular security audits and penetration testing
- Redundant data centers with failover capabilities
- Real-time threat monitoring and prevention

### Data Encryption
- All data encrypted in transit using TLS 1.3
- Data encrypted at rest using AES-256 encryption
- Secure key management practices
- Encrypted database backups

### Access Controls
- Role-based access control (RBAC) system
- Multi-factor authentication support
- IP restrictions available for account access
- Detailed access logs and monitoring

### Compliance Certifications
- SOC 2 Type II certified
- GDPR compliant
- HIPAA compliant (for Healthcare plans)
- ISO 27001 certified

## Privacy Features

### Respondent Anonymity Options
- Anonymous response collection
- IP address masking
- Personally identifiable information (PII) removal
- Aggregated reporting to prevent individual identification

### Consent Management
- Customizable consent forms
- Opt-in/opt-out tracking
- Data processing agreement templates
- Right to be forgotten request handling

### Data Retention Controls
- Configurable data retention periods
- Automatic data deletion options
- Data export capabilities before deletion
- Selective data removal tools

## Best Practices for Secure Surveys

### Collection Best Practices

1. **Only collect necessary data**:
   - Audit questions to ensure you're only asking what you need
   - Avoid collecting sensitive data unless absolutely required
   - Consider if you need identifying information or if anonymous data would suffice

2. **Be transparent with respondents**:
   - Clearly state how their data will be used
   - Explain who will have access to their responses
   - Provide estimated time for data retention
   - Include a link to your privacy policy

3. **Use appropriate security settings**:
   - Password-protect sensitive surveys
   - Set expiration dates for survey links when appropriate
   - Consider using single-use links for highly confidential surveys
   - Enable SSL for all surveys (enabled by default)

### Storage and Access Best Practices

1. **Implement strict access controls**:
   - Limit who can view sensitive survey data
   - Regularly audit user accounts and permissions
   - Remove access promptly when no longer needed
   - Use the principle of least privilege

2. **Secure data exports**:
   - Password-protect exported files
   - Be cautious about sharing exports via email
   - Delete downloaded data when no longer needed
   - Track who has exported data

3. **Consider data residency**:
   - Understand where your data is physically stored
   - Select appropriate data centers for compliance needs
   - Be aware of cross-border data transfer implications
   - Use region-specific surveys when required

### Sharing Results Securely

1. **Anonymize before sharing**:
   - Remove identifying information before wider distribution
   - Aggregate data when appropriate
   - Consider minimum thresholds for reporting (e.g., require at least 5 responses)
   - Scrub open-ended responses of potentially identifying details

2. **Secure sharing methods**:
   - Use access controls on shared dashboards
   - Set expiration dates for shared links
   - Track who has viewed shared results
   - Consider watermarking for sensitive reports

## Handling Special Cases

### Healthcare Surveys (HIPAA)
- Use HIPAA-compliant account settings
- Execute Business Associate Agreements
- Enable additional security features
- Implement special handling for PHI

### Financial Information
- Avoid collecting full credit card numbers or account details
- Consider using specialized payment processing integrations instead
- Apply additional encryption for financial data
- Implement stricter retention policies

### Children's Data
- Obtain verifiable parental consent
- Collect minimal data from children under 13
- Implement special handling procedures
- Understand COPPA and other relevant regulations

## Incident Response

In the unlikely event of a security incident:

1. Our team will notify affected customers promptly
2. We will provide details about the nature of the breach
3. We will offer guidance on recommended actions
4. We maintain an incident response team available 24/7

Maintaining the security and privacy of your survey data is a shared responsibility. By combining our platform's security features with these best practices, you can ensure that your data collection respects privacy while keeping sensitive information secure.
    `,
    keywords: ['security', 'data privacy', 'GDPR', 'encryption', 'data protection', 'privacy', 'anonymity'],
    relatedPages: ['/settings/security', '/privacy'],
    lastUpdated: '2025-04-02'
  },
  {
    id: 'billing-plans',
    title: 'Billing and Subscription Plans',
    category: 'Account & Settings',
    content: `
# Billing and Subscription Plans

This guide provides information about our subscription plans, billing procedures, and how to manage your account's financial aspects.

## Available Subscription Plans

### Free Plan
- 10 questions per survey
- Maximum 100 responses per month
- Basic question types only
- Standard support
- Survey platform branding included

### Professional Plan
- Unlimited questions per survey
- 1,000 responses per month
- All question types
- Logic and branching
- Email support
- White-label options (remove platform branding)
- Data export capabilities

### Business Plan
- Unlimited questions per survey
- 10,000 responses per month
- Advanced logic and branching
- Priority email and chat support
- Complete white-labeling
- Advanced analytics and reporting
- Team collaboration features
- API access

### Enterprise Plan
- Unlimited questions and responses
- Dedicated account manager
- Phone support with guaranteed response times
- Custom feature development
- Advanced security features
- HIPAA compliance
- Custom integrations
- On-premises deployment options

## Plan Comparison and Selection

### Factors to Consider
- Number of surveys you'll conduct annually
- Typical response volume
- Need for advanced features
- Team size and collaboration requirements
- Integration needs
- Security and compliance requirements
- Budget constraints

### Upgrading or Downgrading
1. Go to "Account Settings" > "Billing"
2. Select "Change Plan"
3. Choose your new plan
4. Review prorated charges or credits
5. Confirm the change

Changes typically take effect immediately, with billing adjusted accordingly.

## Billing Procedures

### Payment Methods
- Credit/debit cards (Visa, MasterCard, American Express, Discover)
- PayPal
- Bank transfers (for annual Enterprise plans)
- Purchase orders (Enterprise only)

### Billing Cycles
- Monthly billing: Charged on the same date each month
- Annual billing: Charged once per year (typically includes a discount)
- Enterprise: Custom billing cycles available

### Invoices and Receipts
- Automatically generated and emailed to billing contact
- Available in "Account Settings" > "Billing" > "Invoices"
- Include all necessary information for expense reporting and tax purposes
- Custom invoice fields available for Enterprise accounts

## Managing Billing Information

### Updating Payment Information
1. Navigate to "Account Settings" > "Billing"
2. Select "Payment Methods"
3. Add new payment method or update existing one
4. Set as default if desired

### Changing Billing Contacts
1. Go to "Account Settings" > "Billing"
2. Select "Billing Contacts"
3. Add or remove contacts as needed
4. Set primary billing contact

### Tax Information
1. Access "Account Settings" > "Billing" > "Tax Information"
2. Add company tax ID or VAT number
3. Update business address for tax purposes
4. Request specialized tax documentation if needed

## Response Overage Handling

If you exceed your plan's monthly response limit:

### Automatic Handling
- Overage charges apply at a per-response rate
- Specified in your plan details
- Automatically billed to your payment method
- Email notification sent when approaching limit

### Manual Handling
- Option to pause survey collection when limit reached
- Temporarily upgrade for high-volume periods
- Purchase response packs as needed

## Special Billing Arrangements

### Non-profit Discounts
- Available for qualified organizations
- Requires verification of non-profit status
- Contact sales for application process

### Educational Discounts
- Available for educational institutions
- Faculty and student plans available
- Verification required

### Enterprise Agreements
- Custom pricing based on specific needs
- Volume discounts available
- Multi-year agreements with locked-in rates
- Contact our sales team to discuss

## Cancellation Policy

### How to Cancel
1. Go to "Account Settings" > "Billing"
2. Select "Cancel Subscription"
3. Complete exit survey
4. Confirm cancellation

### What Happens After Cancellation
- Access continues until the end of current billing period
- Option to download all data before access ends
- Account remains dormant for 30 days before data deletion
- Reactivation possible during dormant period

## Frequently Asked Questions

**Q: Can I change plans in the middle of a billing cycle?**
A: Yes, you can upgrade at any time with prorated charges. Downgrading takes effect at the end of your current billing cycle.

**Q: What happens if I need more responses temporarily?**
A: You can either upgrade to a higher plan temporarily or purchase additional response packs without changing your base plan.

**Q: Do unused responses roll over to the next month?**
A: No, response allocations reset at the beginning of each billing cycle.

**Q: Is there a contract or commitment period?**
A: Monthly plans can be cancelled anytime. Annual plans commit you to a full year, with early cancellation resulting in a prorated refund minus any applicable discount.

For any billing questions not covered here, please contact our billing support team at billing@surveyplatform.com.
    `,
    keywords: ['billing', 'subscription', 'plans', 'payment', 'pricing', 'upgrade', 'downgrade'],
    relatedPages: ['/settings/billing', '/pricing'],
    lastUpdated: '2025-04-02'
  }
]

/**
 * Get help article by ID
 */
export function getHelpArticleById(id: string): HelpArticle | undefined {
  return helpArticles.find(article => article.id === id);
}

/**
 * Search help articles by query
 */
export function searchHelpArticles(query: string): HelpArticle[] {
  const lowerQuery = query.toLowerCase();
  
  return helpArticles.filter(article => {
    // Check if query matches title, category, or keywords
    return (
      article.title.toLowerCase().includes(lowerQuery) ||
      article.category.toLowerCase().includes(lowerQuery) ||
      article.keywords.some(keyword => keyword.toLowerCase().includes(lowerQuery)) ||
      article.content.toLowerCase().includes(lowerQuery)
    );
  });
}

/**
 * Get articles by category
 */
export function getArticlesByCategory(category: string): HelpArticle[] {
  return helpArticles.filter(article => article.category === category);
}

/**
 * Get articles related to a specific page
 */
export function getArticlesByPage(pagePath: string): HelpArticle[] {
  return helpArticles.filter(article => 
    article.relatedPages.some(path => path === pagePath || pagePath.startsWith(path))
  );
}