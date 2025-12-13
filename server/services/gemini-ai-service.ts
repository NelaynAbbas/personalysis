import { GoogleGenerativeAI } from '@google/generative-ai';

interface SurveyQuestion {
  id: number;
  question: string;
  questionType: string;
  options?: any[];
  required: boolean;
  order: number;
  helpText?: string;
  customValidation?: any;
  sliderConfig?: any;
  scenarioText?: string;
}

interface BusinessContext {
  productName?: string;
  productDescription?: string;
  industry?: string;
  targetMarket?: string[];
  painPoints?: string[];
}

interface Demographics {
  collectAge: boolean;
  collectGender: boolean;
  collectLocation: boolean;
  collectEducation: boolean;
  collectIncome: boolean;
}

interface AIResponseData {
  responses: Array<{questionId: number; answer: any}>;
  demographics: Record<string, any>;
  traits: TraitSummary[]; // Changed to array of TraitSummary instead of generic object
  startTime: Date;
  completeTime: Date;
}

export interface TraitSummary {
  name: string;
  score: number; // 0-100
  category: string; // e.g., behavioral, cognitive, social, emotional, leadership, etc.
}

export interface BatchTiming {
  batchNumber: number;
  batchStartTime: Date;
  batchCompleteTime: Date;
  batchDurationMs: number;
  responseCount: number;
}

export class GeminiAIService {
  private genAI: GoogleGenerativeAI;
  private apiKey: string;

  constructor() {
    this.apiKey = process.env.GEMINI_API_KEY || '';
    
    if (!this.apiKey) {
      throw new Error('GEMINI_API_KEY environment variable is required');
    }
    
    this.genAI = new GoogleGenerativeAI(this.apiKey);
  }

  /**
   * Generate AI responses for a survey with parallel processing
   */
  async generateSurveyResponses(
    questions: SurveyQuestion[],
    businessContext: BusinessContext,
    demographics: Demographics,
    count: number,
    onBatchComplete?: (args: {
      batchIndex: number;
      batchResponses: AIResponseData[];
      batchStartTime: Date;
      batchCompleteTime: Date;
      batchCount: number;
    }) => Promise<void> | void
  ): Promise<{ responses: AIResponseData[]; batchTimings: BatchTiming[] }> {
    // Process responses in batches of 5 to avoid token/rate limits per batch
    const batchSize = 5;
    const totalBatches = Math.ceil(count / batchSize);
    const maxConcurrentBatches = parseInt(process.env.AI_MAX_CONCURRENT_BATCHES || '3');
    const allResponses: Array<AIResponseData | undefined> = new Array(count);
    const batchTimings: BatchTiming[] = [];

    // Simple bounded-concurrency queue for batches
    let nextBatchIndex = 0;
    const runNextBatch = async (): Promise<void> => {
      const batchIndex = nextBatchIndex++;
      if (batchIndex >= totalBatches) return;

      const batchStartTime = new Date();
      const batchStart = batchIndex * batchSize;
      const batchEnd = Math.min(batchStart + batchSize, count);
      const batchCount = batchEnd - batchStart;

      console.log(`🔄 Starting batch ${batchIndex + 1}/${totalBatches} at ${batchStartTime.toISOString()}`);

      const batchPromises = Array.from({ length: batchCount }, (_, i) =>
        this.generateSingleResponse(
          questions,
          businessContext,
          demographics,
          batchStart + i + 1
        ).catch(error => {
          console.error(`Error generating response ${batchStart + i + 1}:`, error);
          const fallbackStartTime = new Date();
          const fallbackCompleteTime = new Date(fallbackStartTime.getTime() + this.calculateRealisticCompletionTime(questions));
          return {
            responses: this.generateFallbackResponses(questions),
            demographics: this.generateDefaultDemographics(demographics),
            traits: this.generateDefaultTraits(),
            startTime: fallbackStartTime,
            completeTime: fallbackCompleteTime
          };
        })
      );

      const batchResponses = await Promise.all(batchPromises);
      this.enforceOptionDiversity(batchResponses, questions);
      // Place responses in deterministic order slot
      for (let j = 0; j < batchResponses.length; j++) {
        allResponses[batchStart + j] = batchResponses[j];
      }

      const batchCompleteTime = new Date();
      const batchDurationMs = batchCompleteTime.getTime() - batchStartTime.getTime();

      batchTimings[batchIndex] = {
        batchNumber: batchIndex + 1,
        batchStartTime,
        batchCompleteTime,
        batchDurationMs,
        responseCount: batchCount
      };

      console.log(`✅ Batch ${batchIndex + 1}/${totalBatches} completed in ${batchDurationMs}ms at ${batchCompleteTime.toISOString()}`);

      // Notify caller immediately on batch completion
      if (onBatchComplete) {
        try {
          await onBatchComplete({
            batchIndex,
            batchResponses,
            batchStartTime,
            batchCompleteTime,
            batchCount
          });
        } catch (e) {
          console.error('onBatchComplete handler error:', e);
        }
      }

      // Immediately start next queued batch
      await runNextBatch();
    };

    // Kick off up to maxConcurrentBatches workers
    const workers = Array.from(
      { length: Math.min(maxConcurrentBatches, totalBatches) },
      () => runNextBatch()
    );
    await Promise.all(workers);

    return { responses: allResponses.filter((r): r is AIResponseData => Boolean(r)), batchTimings };
  }

  /**
   * Generate a single AI response with timing tracking
   */
  private async generateSingleResponse(
    questions: SurveyQuestion[],
    businessContext: BusinessContext,
    demographics: Demographics,
    responseNumber: number
  ): Promise<AIResponseData> {
    const startTime = new Date();
    const model = this.genAI.getGenerativeModel({
      model: 'gemini-2.5-flash',
      generationConfig: {
        temperature: 0.9,
        topP: 0.95,
        topK: 40,
        maxOutputTokens: 4096,
        responseMimeType: 'application/json'
      }
    });

    const prompt = this.buildPrompt(questions, businessContext, demographics, responseNumber);
    
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();

    // Calculate realistic completion time based on number of questions
    // Average person takes 30-60 seconds per question, but AI responses are generated instantly
    // So we simulate a realistic completion time based on question count
    const realisticCompletionTime = this.calculateRealisticCompletionTime(questions);
    const completeTime = new Date(startTime.getTime() + realisticCompletionTime);

    const parsedResponse = this.parseAIResponse(text, questions, demographics);
    
    return {
      ...parsedResponse,
      startTime,
      completeTime
    };
  }

  /**
   * Calculate realistic completion time in milliseconds based on number of questions
   * Assumes average of 30-90 seconds per question with some randomness
   */
  private calculateRealisticCompletionTime(questions: SurveyQuestion[]): number {
    const baseTimePerQuestion = 35000; // 35 seconds base
    const randomVariation = 40000; // Up to 40 seconds variation
    const totalTime = questions.length * (baseTimePerQuestion + Math.random() * randomVariation);
    // Minimum 30 seconds, maximum 10 minutes
    return Math.max(30000, Math.min(600000, totalTime));
  }

  /**
   * Build a deterministic-but-varied persona seed based on response number
   */
  private buildPersona(responseNumber: number) {
    const ageBuckets = [18, 25, 35, 45, 55, 65];
    const genders = ['', 'male', 'female', 'non-binary', 'other'];
    const locations = [
      'Seattle, WA, USA', 'Chicago, IL, USA', 'Austin, TX, USA', 'Miami, FL, USA',
      'Toronto, ON, Canada', 'London, UK', 'Berlin, Germany', 'Sydney, Australia'
    ];
    const education = ['high-school', 'associate', 'bachelor', 'master', 'doctorate', 'other'];
    const income = ['under-25k', '25k-50k', '50k-75k', '75k-100k', '100k-150k', '150k-plus'];

    const pick = <T,>(arr: T[], seed: number) => arr[Math.abs(seed) % arr.length];

    return {
      age: pick(ageBuckets, responseNumber + 1),
      gender: pick(genders, responseNumber + 2),
      location: pick(locations, responseNumber + 3),
      education: pick(education, responseNumber + 4),
      income: pick(income, responseNumber + 5)
    };
  }

  /**
   * Build the prompt for Gemini with complete survey details
   */
  private buildPrompt(
    questions: SurveyQuestion[],
    businessContext: BusinessContext,
    demographics: Demographics,
    responseNumber: number
  ): string {
    const questionsText = questions
      .sort((a, b) => a.order - b.order)
      .map((q, index) => {
        let questionText = `${index + 1}. [ID: ${q.id}] ${q.question}`;
        
        // Add question type and requirements
        questionText += `\n   Type: ${q.questionType}`;
        if (q.required) {
          questionText += ` (Required)`;
        }
        
        // Add help text if available
        if (q.helpText) {
          questionText += `\n   Help: ${q.helpText}`;
        }
        
        // Add scenario text if available
        if (q.scenarioText) {
          questionText += `\n   Scenario: ${q.scenarioText}`;
        }
        
        // Add options for multiple choice questions
        if (q.questionType === 'multiple-choice' && q.options) {
          const options = Array.isArray(q.options) ? q.options : JSON.parse(q.options);
          questionText += `\n   ⚠️  OPTIONS REQUIRED - Select ONE option value:`;
          options.forEach((opt: any, optIndex: number) => {
            const optionText = opt.text || opt.value || opt.label || String(opt);
            const optionValue = opt.value || opt.id || `option_${optIndex}`;
            questionText += `\n     - ${optionText} (value: ${optionValue})`;
          });
        } else if (q.questionType === 'slider') {
          const config = q.sliderConfig || {};
          const min = config.min || 0;
          const max = config.max || 100;
          const step = config.step || 1;
          questionText += `\n   📊 SLIDER - Provide number between ${min} and ${max}`;
        } else if (q.questionType === 'ranking' && q.options) {
          const options = Array.isArray(q.options) ? q.options : JSON.parse(q.options);
          questionText += `\n   📋 RANKING REQUIRED - Rank these options (1 = highest priority):`;
          options.forEach((opt: any, optIndex: number) => {
            const optionText = opt.text || opt.value || opt.label || String(opt);
            questionText += `\n     - ${optionText}`;
          });
        } else if (q.questionType === 'text') {
          questionText += `\n   ✏️  TEXT INPUT - Provide realistic text response`;
        } else if (q.questionType === 'scenario' && q.options) {
          const options = Array.isArray(q.options) ? q.options : JSON.parse(q.options);
          questionText += `\n   ⚠️  SCENARIO WITH OPTIONS - Select ONE option value:`;
          options.forEach((opt: any, optIndex: number) => {
            const optionText = opt.text || opt.value || opt.label || String(opt);
            const optionValue = opt.value || opt.id || `option_${optIndex}`;
            questionText += `\n     - ${optionText} (value: ${optionValue})`;
          });
        } else if (q.questionType === 'scenario' && !q.options) {
          questionText += `\n   📝 SCENARIO TEXT - Provide realistic text response`;
        } else if (q.questionType === 'image' && q.options) {
          const options = Array.isArray(q.options) ? q.options : JSON.parse(q.options);
          questionText += `\n   🖼️  IMAGE SELECTION - Select ONE option value:`;
          options.forEach((opt: any, optIndex: number) => {
            const optionText = opt.text || opt.value || opt.label || String(opt);
            const optionValue = opt.value || opt.id || `option_${optIndex}`;
            questionText += `\n     - ${optionText} (value: ${optionValue})`;
          });
        } else if (q.questionType === 'mood-board' && q.options) {
          const options = Array.isArray(q.options) ? q.options : JSON.parse(q.options);
          questionText += `\n   🎨 MOOD BOARD - Select ONE option value:`;
          options.forEach((opt: any, optIndex: number) => {
            const optionText = opt.text || opt.value || opt.label || String(opt);
            const optionValue = opt.value || opt.id || `option_${optIndex}`;
            questionText += `\n     - ${optionText} (value: ${optionValue})`;
          });
        } else if (q.questionType === 'personality-matrix' && q.options) {
          const options = Array.isArray(q.options) ? q.options : JSON.parse(q.options);
          questionText += `\n   🧠 PERSONALITY MATRIX - Select ONE option value:`;
          options.forEach((opt: any, optIndex: number) => {
            const optionText = opt.text || opt.value || opt.label || String(opt);
            const optionValue = opt.value || opt.id || `option_${optIndex}`;
            questionText += `\n     - ${optionText} (value: ${optionValue})`;
          });
        } else if (q.options && q.questionType !== 'multiple-choice' && q.questionType !== 'ranking') {
          // Handle other question types that might have options
          const options = Array.isArray(q.options) ? q.options : JSON.parse(q.options);
          questionText += `\n   ⚠️  OPTIONS REQUIRED - Select ONE option value:`;
          options.forEach((opt: any, optIndex: number) => {
            const optionText = opt.text || opt.value || opt.label || String(opt);
            const optionValue = opt.value || opt.id || `option_${optIndex}`;
            questionText += `\n     - ${optionText} (value: ${optionValue})`;
          });
        }
        
        return questionText;
      })
      .join('\n\n');

    const businessContextText = businessContext.productName 
      ? `\n\nBusiness Context:
- Product: ${businessContext.productName}
- Description: ${businessContext.productDescription || 'Not provided'}
- Industry: ${businessContext.industry || 'General'}
- Target Market: ${businessContext.targetMarket?.join(', ') || 'General consumers'}
- Pain Points: ${businessContext.painPoints?.join(', ') || 'Not specified'}`
      : '';

    const demographicsText = `\n\nDemographics to generate (STRICT ENUMS):
- Age (if enabled): choose EXACTLY ONE of these integers representing buckets: [0, 18, 25, 35, 45, 55, 65]
  - 0 = Prefer not to say
  - 18 = 18-24, 25 = 25-34, 35 = 35-44, 45 = 45-54, 55 = 55-64, 65 = 65+
- Gender (if enabled): choose EXACTLY ONE slug from: ["", "male", "female", "non-binary", "other"]
  - "" represents Prefer not to say (an empty string)
- Location (if enabled): free text city/state/country string is allowed
- Education (if enabled): choose EXACTLY ONE slug from: ["high-school", "associate", "bachelor", "master", "doctorate", "other"]
- Income (if enabled): choose EXACTLY ONE slug from: ["under-25k", "25k-50k", "50k-75k", "75k-100k", "100k-150k", "150k-plus"]`;

    const persona = this.buildPersona(responseNumber);
    const personaText = `\n\nPersona seed for response #${responseNumber} (use to guide plausible variation):
- Target Age Bucket (if enabled): ${persona.age}
- Target Gender (if enabled): ${persona.gender || 'prefer-not-to-say'}
- Target Location (if enabled): ${persona.location}
- Target Education (if enabled): ${persona.education}
- Target Income (if enabled): ${persona.income}
Important: stay within the allowed enums for demographics, but bias your selections to this persona seed so responses differ across #.`;

    return `You are generating realistic survey responses for a market research survey. Generate response #${responseNumber} that represents a real person taking this survey.

${businessContextText}

Survey Questions:
${questionsText}
${demographicsText}
${personaText}

CRITICAL RESPONSE RULES:
1. **TEXT QUESTIONS**: Only provide free-text answers for questions marked as "Type: text" with NO options listed
2. **OPTION-BASED QUESTIONS**: For ANY question that has "Options:" listed, you MUST select ONE of the exact option values provided
3. **SLIDER QUESTIONS**: For "Type: slider" questions, provide a number within the specified range (usually 0-100)
4. **RANKING QUESTIONS**: For "Type: ranking" questions, provide a JSON array with rank, option, and value
5. **SCENARIO QUESTIONS**: Even if there's scenario text, if options are provided, you MUST select from the options
6. **IMAGE QUESTIONS**: For "Type: image" with options, select ONE option value
7. **MOOD BOARD QUESTIONS**: For "Type: mood-board" with options, select ONE option value
8. **PERSONALITY MATRIX QUESTIONS**: For "Type: personality-matrix" with options, select ONE option value
9. **VARY OPTION SELECTION**: Do not always choose the first option; vary choices plausibly based on the persona seed

QUESTION TYPE EXAMPLES:
- If you see "Type: text" with NO options → Write a realistic text response
- If you see "Type: multiple-choice" with "Options:" → Select ONE option value (e.g., "option_123")
- If you see "Type: slider" with "Range: 0 to 100" → Provide a number like 75
- If you see "Type: ranking" with options → Provide JSON array with rankings
- If you see "Type: scenario" with "Options:" → Select ONE option value (even if there's scenario text)
- If you see "Type: image" with "Options:" → Select ONE option value
- If you see "Type: mood-board" with "Options:" → Select ONE option value
- If you see "Type: personality-matrix" with "Options:" → Select ONE option value

NEVER write descriptions of what you would choose - ALWAYS select the actual option value when options are provided.

DEMOGRAPHICS OUTPUT CONSTRAINTS (CRITICAL):
1. Only include demographics that are enabled.
2. When a demographic is enabled, return values ONLY from the enums above.
   - age must be one of: 0, 18, 25, 35, 45, 55, 65 (integer)
   - gender must be one of: "", "male", "female", "non-binary", "other" (string)
   - education must be one of: "high-school", "associate", "bachelor", "master", "doctorate", "other" (string)
   - income must be one of: "under-25k", "25k-50k", "50k-75k", "75k-100k", "100k-150k", "150k-plus" (string)
   - location is free-text (string) if enabled

Please respond with a JSON object containing:
1. "responses" - Array of objects with "questionId" and "answer" fields
2. "demographics" - Object with demographic information (only include enabled demographics from the list above)
3. "traits" - Array of exactly 5 personality traits with name, score (0-100), and category

MANDATORY TRAITS FORMAT:
You MUST return EXACTLY these 5 traits (no more, no less, no synonyms):
1. Innovation (category: "behavioral") - score 0-100
2. Analytical Thinking (category: "cognitive") - score 0-100
3. Leadership (category: "social") - score 0-100
4. Adaptability (category: "behavioral") - score 0-100
5. Creativity (category: "cognitive") - score 0-100

The traits array must be in this exact format:
[
  {"name": "Innovation", "score": 75, "category": "behavioral"},
  {"name": "Analytical Thinking", "score": 80, "category": "cognitive"},
  {"name": "Leadership", "score": 65, "category": "social"},
  {"name": "Adaptability", "score": 70, "category": "behavioral"},
  {"name": "Creativity", "score": 60, "category": "cognitive"}
]

Example response format:
{
  "responses": [
    {"questionId": 25, "answer": "I really enjoy using this product because it saves me time"},
    {"questionId": 26, "answer": "option_1761581251964"},
    {"questionId": 27, "answer": 75},
    {"questionId": 28, "answer": "[{\"rank\":1,\"option\":\"Option 2\",\"value\":\"option_1761581251964\"},{\"rank\":2,\"option\":\"Option 1\",\"value\":\"option_1\"}]"}
  ],
  "demographics": {
    "age": 25,
    "gender": "female",
    "location": "Chicago, IL, USA",
    "education": "bachelor",
    "income": "50k-75k"
  },
  "traits": [
    {"name": "Innovation", "score": 75, "category": "behavioral"},
    {"name": "Analytical Thinking", "score": 80, "category": "cognitive"},
    {"name": "Leadership", "score": 65, "category": "social"},
    {"name": "Adaptability", "score": 70, "category": "behavioral"},
    {"name": "Creativity", "score": 60, "category": "cognitive"}
  ]
}

IMPORTANT:
- Include ONLY demographics that were marked as "Yes" in the demographics list above
- Traits MUST be an array with exactly 5 objects in the format shown
- Each trait must have the exact name, category, and a score between 0-100
- Base trait scores on the respondent's answers to make them realistic and varied

Respond ONLY with valid JSON, no additional text.`;
  }

  /**
   * Parse the AI response and structure it properly
   */
  private parseAIResponse(
    aiText: string,
    questions: SurveyQuestion[],
    demographics: Demographics
  ): Omit<AIResponseData, 'startTime' | 'completeTime'> {
    try {
      // Extract a JSON-looking block and repair common issues before parsing
      const extracted = this.extractJsonBlock(aiText);
      const cleanedText = this.repairJson(extracted);
      const parsed = JSON.parse(cleanedText);

      // Parse, validate, and slightly jitter traits for variance
      const traits = this.jitterTraits(this.parseAndValidateTraits(parsed.traits));

      // Filter demographics to only include enabled ones
      const filteredDemographics = this.filterDemographics(
        parsed.demographics || {},
        demographics
      );

      // Ensure all required fields exist
      const response: Omit<AIResponseData, 'startTime' | 'completeTime'> = {
        responses: parsed.responses || [],
        demographics: filteredDemographics || this.generateDefaultDemographics(demographics),
        traits
      };

      // Validate and clean responses
      response.responses = this.validateResponses(response.responses, questions);

      return response;
    } catch (error) {
      // Log a compact, sanitized preview to help debugging without spamming logs
      const preview = aiText?.slice(0, 400)?.replace(/[\r\n\t]+/g, ' ');
      console.error('Error parsing AI response:', error, '\nPreview:', preview);
      // Return a fallback response
      return {
        responses: this.generateFallbackResponses(questions),
        demographics: this.generateDefaultDemographics(demographics),
        traits: this.generateDefaultTraits()
      };
    }
  }

  /**
   * Extract the most plausible JSON block from model output.
   * - Prefer fenced ```json blocks
   * - Fallback to first balanced {...} object
   */
  private extractJsonBlock(text: string): string {
    if (!text) return '{}';
    // Prefer fenced code block
    const fenceMatch = text.match(/```json[\s\S]*?```/i) || text.match(/```[\s\S]*?```/);
    if (fenceMatch) {
      return fenceMatch[0].replace(/```json|```/gi, '').trim();
    }
    // Fallback: find first balanced { ... }
    const start = text.indexOf('{');
    if (start === -1) return text.trim();
    let i = start;
    let depth = 0;
    let inString = false;
    let escape = false;
    for (; i < text.length; i++) {
      const ch = text[i];
      if (escape) { escape = false; continue; }
      if (ch === '\\') { escape = true; continue; }
      if (ch === '"') { inString = !inString; continue; }
      if (inString) continue;
      if (ch === '{') depth++;
      if (ch === '}') {
        depth--;
        if (depth === 0) {
          return text.slice(start, i + 1).trim();
        }
      }
    }
    // If unbalanced, return from start to end
    return text.slice(start).trim();
  }

  /**
   * Repair common JSON formatting issues often seen in LLM outputs.
   * This is intentionally conservative to avoid over-correcting.
   */
  private repairJson(raw: string): string {
    if (!raw) return '{}';
    let s = raw
      .replace(/^\uFEFF/, '') // strip BOM
      .replace(/[\u201C\u201D\u201E\u201F\u2033\u2036]/g, '"') // smart double quotes → "
      .replace(/[\u2018\u2019\u2032\u2035]/g, "'") // smart single quotes → '
      .replace(/```json|```/gi, '')
      .trim();

    // Replace single-quoted keys: {'key': ...} → {"key": ...}
    s = s.replace(/([\{,]\s*)'([^'\n\r]+?)'\s*:/g, '$1"$2":');

    // Replace single-quoted string values: : 'value' → : "value"
    s = s.replace(/:\s*'([^'\n\r]*?)'/g, ': "$1"');

    // Remove trailing commas before closing } or ]
    s = s.replace(/,(\s*[}\]])/g, '$1');

    // Occasionally backticks are used for strings; normalize to quotes
    s = s.replace(/`([^`\n\r]*?)`/g, '"$1"');

    // If content starts with text before {, drop prefix
    const firstBrace = s.indexOf('{');
    if (firstBrace > 0) s = s.slice(firstBrace);

    // Ensure it ends at matching brace if extra text trails
    // First, try to slice cleanly to the end of the top-level object
    let depth = 0, endIdx = -1, inStr = false, esc = false;
    for (let i = 0; i < s.length; i++) {
      const ch = s[i];
      if (esc) { esc = false; continue; }
      if (ch === '\\') { esc = true; continue; }
      if (ch === '"') { inStr = !inStr; continue; }
      if (inStr) continue;
      if (ch === '{') depth++;
      if (ch === '}') { depth--; if (depth === 0) { endIdx = i; break; } }
    }
    if (endIdx !== -1) {
      s = s.slice(0, endIdx + 1);
    }

    // Second, attempt to auto-balance any remaining unclosed strings/brackets/braces conservatively
    const stack: string[] = [];
    inStr = false; esc = false;
    for (let i = 0; i < s.length; i++) {
      const ch = s[i];
      if (esc) { esc = false; continue; }
      if (ch === '\\') { esc = true; continue; }
      if (ch === '"') { inStr = !inStr; continue; }
      if (inStr) continue;
      if (ch === '{' || ch === '[') stack.push(ch);
      else if (ch === '}' || ch === ']') {
        const last = stack[stack.length - 1];
        if ((ch === '}' && last === '{') || (ch === ']' && last === '[')) stack.pop();
      }
    }
    // Close open string if needed
    if (inStr) s += '"';
    // Append required closing brackets/braces
    while (stack.length) {
      const opener = stack.pop();
      s += opener === '{' ? '}' : ']';
    }

    return s;
  }

  /**
   * Parse and validate traits array - ensures exactly 5 traits with correct format
   */
  private parseAndValidateTraits(traitsInput: any): TraitSummary[] {
    const allowedTraits: TraitSummary[] = [
      { name: 'Innovation', score: 0, category: 'behavioral' },
      { name: 'Analytical Thinking', score: 0, category: 'cognitive' },
      { name: 'Leadership', score: 0, category: 'social' },
      { name: 'Adaptability', score: 0, category: 'behavioral' },
      { name: 'Creativity', score: 0, category: 'cognitive' }
    ];

    // If traits is not an array, return default
    if (!Array.isArray(traitsInput)) {
      return this.generateDefaultTraits();
    }

    // Map and enforce allowed set exactly once each
    const allowedMap = new Map(allowedTraits.map(t => [t.name, t.category] as const));
    const scores = new Map<string, number>();
    
    for (const item of traitsInput) {
      const name = typeof item?.name === 'string' ? item.name : '';
      const scoreRaw = parseInt(item?.score ?? 0);
      if (allowedMap.has(name)) {
        const clamped = Math.max(0, Math.min(100, isNaN(scoreRaw) ? 0 : scoreRaw));
        scores.set(name, clamped);
      }
    }

    // Build final array in canonical order, defaulting missing ones to 50
    const finalTraits: TraitSummary[] = allowedTraits.map(t => ({
      name: t.name,
      category: t.category,
      score: scores.has(t.name) ? (scores.get(t.name) as number) : 50
    }));

    return finalTraits;
  }

  /**
   * Slightly jitter trait scores to widen variance while staying within 0-100
   */
  private jitterTraits(traits: TraitSummary[], amplitude = 8): TraitSummary[] {
    return traits.map(t => ({
      ...t,
      score: Math.max(0, Math.min(100, t.score + Math.floor((Math.random() - 0.5) * 2 * amplitude)))
    }));
  }

  /**
   * Filter demographics to only include enabled ones
   */
  private filterDemographics(
    demographicsData: Record<string, any>,
    demographicsConfig: Demographics
  ): Record<string, any> {
    const filtered: Record<string, any> = {};

    if (demographicsConfig.collectAge && demographicsData.age != null) {
      filtered.age = demographicsData.age;
    }
    if (demographicsConfig.collectGender && demographicsData.gender) {
      filtered.gender = demographicsData.gender;
    }
    if (demographicsConfig.collectLocation && demographicsData.location) {
      filtered.location = demographicsData.location;
    }
    if (demographicsConfig.collectEducation && demographicsData.education) {
      filtered.education = demographicsData.education;
    }
    if (demographicsConfig.collectIncome && demographicsData.income) {
      filtered.income = demographicsData.income;
    }

    return filtered;
  }

  /**
   * Generate default traits array with all 5 required traits
   */
  private generateDefaultTraits(): TraitSummary[] {
    return [
      { name: 'Innovation', score: 50, category: 'behavioral' },
      { name: 'Analytical Thinking', score: 50, category: 'cognitive' },
      { name: 'Leadership', score: 50, category: 'social' },
      { name: 'Adaptability', score: 50, category: 'behavioral' },
      { name: 'Creativity', score: 50, category: 'cognitive' }
    ];
  }

  /**
   * Generate trait summaries from an actual survey submission (answers provided by the user).
   * Returns exactly 5 traits with name, score (0-100), and category.
   */
  public async generateTraitsFromSubmission(
    questions: SurveyQuestion[],
    responses: Array<{questionId: number; answer: any}>,
    businessContext: BusinessContext & { title?: string; surveyType?: string },
  ): Promise<TraitSummary[]> {
    const allowedTraits: TraitSummary[] = [
      { name: 'Innovation', score: 0, category: 'behavioral' },
      { name: 'Analytical Thinking', score: 0, category: 'cognitive' },
      { name: 'Leadership', score: 0, category: 'social' },
      { name: 'Adaptability', score: 0, category: 'behavioral' },
      { name: 'Creativity', score: 0, category: 'cognitive' }
    ];
    const model = this.genAI.getGenerativeModel({
      model: 'gemini-2.5-flash',
      generationConfig: {
        temperature: 0.8,
        topP: 0.95,
        topK: 40,
        maxOutputTokens: 512,
        responseMimeType: 'application/json'
      }
    });

    // Build detailed prompt including options and selected answers
    const questionsText = questions
      .sort((a, b) => a.order - b.order)
      .map((q, index) => {
        const selected = responses.find(r => r.questionId === q.id);
        let block = `${index + 1}. [ID: ${q.id}] ${q.question}`;
        block += `\n   Type: ${q.questionType}${q.required ? ' (Required)' : ''}`;
        if (q.helpText) block += `\n   Help: ${q.helpText}`;
        if (q.scenarioText) block += `\n   Scenario: ${q.scenarioText}`;
        if (q.options) {
          const options = Array.isArray(q.options) ? q.options : JSON.parse(q.options);
          block += `\n   Options:`;
          options.forEach((opt: any, optIndex: number) => {
            const optionText = opt.text || opt.value || opt.label || String(opt);
            const optionValue = opt.value || opt.id || `option_${optIndex}`;
            block += `\n     - ${optionText} (value: ${optionValue})`;
          });
        }
        block += `\n   Selected Answer: ${selected ? String(selected.answer) : 'null'}`;
        return block;
      })
      .join('\n\n');

    const contextText = `Survey: ${businessContext.title || 'Untitled'}\nSurvey Type: ${businessContext.surveyType || 'general'}\n` +
      (businessContext.productName ? `Product: ${businessContext.productName}\n` : '') +
      (businessContext.productDescription ? `Description: ${businessContext.productDescription}\n` : '') +
      (businessContext.industry ? `Industry: ${businessContext.industry}\n` : '') +
      (businessContext.targetMarket && businessContext.targetMarket.length ? `Target Market: ${businessContext.targetMarket.join(', ')}\n` : '') +
      (businessContext.painPoints && businessContext.painPoints.length ? `Pain Points: ${businessContext.painPoints.join(', ')}\n` : '');

    const prompt = `You are an expert psychometrics and market-research analyst.

Analyze the survey submission and produce scores ONLY for the following EXACT 5 traits. Use the respondent's selected answers to infer realistic scores.

MANDATORY OUTPUT CONSTRAINTS:
- Output EXACTLY these 5 traits, no others and no synonyms:
  1) Innovation (behavioral)
  2) Analytical Thinking (cognitive)
  3) Leadership (social)
  4) Adaptability (behavioral)
  5) Creativity (cognitive)
- Return ONLY a JSON array of 5 objects with fields: name (string), score (integer 0-100), category (string)
- The "name" MUST match one of the five EXACT strings above (case-sensitive)
- The "category" MUST match the corresponding category in parentheses

Context:\n${contextText}

Questions, Options, and Selected Answers:\n${questionsText}

Response format (exactly 5 items, names/categories as specified):
[
  {"name":"Innovation","score":82,"category":"behavioral"},
  {"name":"Analytical Thinking","score":73,"category":"cognitive"},
  {"name":"Leadership","score":68,"category":"social"},
  {"name":"Adaptability","score":85,"category":"behavioral"},
  {"name":"Creativity","score":83,"category":"cognitive"}
]
`;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();

    // Parse strict array
    const cleaned = text.replace(/```json|```/g, '').trim();
    let parsed: any;
    try {
      parsed = JSON.parse(cleaned);
    } catch (e) {
      throw new Error('Gemini did not return valid JSON for traits');
    }
    if (!Array.isArray(parsed)) {
      throw new Error('Gemini traits response is not an array');
    }
    // Map and enforce allowed set exactly once each
    const allowedMap = new Map(allowedTraits.map(t => [t.name, t.category] as const));
    const scores = new Map<string, number>();
    for (const item of parsed) {
      const name = typeof item?.name === 'string' ? item.name : '';
      const scoreRaw = parseInt(item?.score ?? 0);
      if (allowedMap.has(name)) {
        const clamped = Math.max(0, Math.min(100, isNaN(scoreRaw) ? 0 : scoreRaw));
        scores.set(name, clamped);
      }
    }

    // Build final array in canonical order, defaulting missing ones to 50
    const finalTraits: TraitSummary[] = allowedTraits.map(t => ({
      name: t.name,
      category: t.category,
      score: scores.has(t.name) ? (scores.get(t.name) as number) : 50
    }));

    return finalTraits;
  }

  /**
   * Validate and clean responses
   */
  private validateResponses(responses: Array<{questionId: number; answer: any}>, questions: SurveyQuestion[]): Array<{questionId: number; answer: any}> {
    const validated: Array<{questionId: number; answer: any}> = [];

    questions.forEach(question => {
      // Find existing response for this question
      let existingResponse = responses.find(r => r.questionId === question.id);
      
      if (!existingResponse) {
        existingResponse = { questionId: question.id, answer: null };
      }

      let answer = existingResponse.answer;

      if (question.questionType === 'multiple-choice' && question.options) {
        const options = Array.isArray(question.options) ? question.options : JSON.parse(question.options);
        const optionValues = options.map((opt: any) => opt.value || opt.id);
        
        // If answer is not in options, pick a random one
        if (!optionValues.includes(answer)) {
          console.warn(`Question ${question.id}: Invalid option "${answer}", selecting random option`);
          const randomOption = options[Math.floor(Math.random() * options.length)];
          answer = randomOption.value || randomOption.id;
        }
      } else if (question.questionType === 'slider') {
        const config = question.sliderConfig || {};
        const min = config.min || 1;
        const max = config.max || 10;
        const numAnswer = parseInt(answer);
        if (isNaN(numAnswer) || numAnswer < min || numAnswer > max) {
          answer = Math.floor(Math.random() * (max - min + 1)) + min;
        }
      } else if (question.questionType === 'ranking' && question.options) {
        // Generate a random ranking if not provided
        if (!answer || typeof answer !== 'string') {
          const options = Array.isArray(question.options) ? question.options : JSON.parse(question.options);
          const shuffled = [...options].sort(() => Math.random() - 0.5);
          answer = JSON.stringify(shuffled.map((opt: any, index: number) => ({
            rank: index + 1,
            option: opt.text || opt.value || opt.label || String(opt),
            value: opt.value || opt.id || `option_${index}`
          })));
        }
      } else if (question.questionType === 'scenario' && question.options) {
        // Scenario questions with options - must select from options
        const options = Array.isArray(question.options) ? question.options : JSON.parse(question.options);
        const optionValues = options.map((opt: any) => opt.value || opt.id);
        
        if (!optionValues.includes(answer)) {
          console.warn(`Question ${question.id}: Invalid option "${answer}" for scenario question, selecting random option`);
          const randomOption = options[Math.floor(Math.random() * options.length)];
          answer = randomOption.value || randomOption.id;
        }
      } else if (question.questionType === 'image' && question.options) {
        // Image selection questions - must select from options
        const options = Array.isArray(question.options) ? question.options : JSON.parse(question.options);
        const optionValues = options.map((opt: any) => opt.value || opt.id);
        
        if (!optionValues.includes(answer)) {
          console.warn(`Question ${question.id}: Invalid option "${answer}" for image question, selecting random option`);
          const randomOption = options[Math.floor(Math.random() * options.length)];
          answer = randomOption.value || randomOption.id;
        }
      } else if (question.questionType === 'mood-board' && question.options) {
        // Mood board questions - must select from options
        const options = Array.isArray(question.options) ? question.options : JSON.parse(question.options);
        const optionValues = options.map((opt: any) => opt.value || opt.id);
        
        if (!optionValues.includes(answer)) {
          console.warn(`Question ${question.id}: Invalid option "${answer}" for mood-board question, selecting random option`);
          const randomOption = options[Math.floor(Math.random() * options.length)];
          answer = randomOption.value || randomOption.id;
        }
      } else if (question.questionType === 'personality-matrix' && question.options) {
        // Personality matrix questions - must select from options
        const options = Array.isArray(question.options) ? question.options : JSON.parse(question.options);
        const optionValues = options.map((opt: any) => opt.value || opt.id);
        
        if (!optionValues.includes(answer)) {
          console.warn(`Question ${question.id}: Invalid option "${answer}" for personality-matrix question, selecting random option`);
          const randomOption = options[Math.floor(Math.random() * options.length)];
          answer = randomOption.value || randomOption.id;
        }
      } else if (question.options && question.questionType !== 'multiple-choice' && question.questionType !== 'ranking' && question.questionType !== 'slider' && question.questionType !== 'scenario' && question.questionType !== 'image' && question.questionType !== 'mood-board' && question.questionType !== 'personality-matrix' && question.questionType !== 'text') {
        // Handle any other question types that have options
        const options = Array.isArray(question.options) ? question.options : JSON.parse(question.options);
        const optionValues = options.map((opt: any) => opt.value || opt.id);
        
        if (!optionValues.includes(answer)) {
          console.warn(`Question ${question.id}: Invalid option "${answer}" for ${question.questionType}, selecting random option`);
          const randomOption = options[Math.floor(Math.random() * options.length)];
          answer = randomOption.value || randomOption.id;
        }
      } else if (question.questionType === 'text' && (!answer || answer === 'This is a realistic text response.')) {
        // Generate more realistic text responses
        const responses = [
          "I find this product very useful for my daily tasks.",
          "The quality is good but could be improved in some areas.",
          "I would recommend this to others based on my experience.",
          "It meets my needs well and I'm satisfied with the purchase.",
          "There are some features I really like and some that could be better.",
          "Overall, I'm happy with this product and would buy it again.",
          "The product works as expected and provides good value.",
          "I have mixed feelings - some aspects are great, others need work.",
          "This product has helped me solve a specific problem I had.",
          "I appreciate the attention to detail in the design and functionality."
        ];
        answer = responses[Math.floor(Math.random() * responses.length)];
      }

      validated.push({ questionId: question.id, answer });
    });

    return validated;
  }

  /**
   * Enforce option diversity across a batch to reduce identical selections
   */
  private enforceOptionDiversity(all: AIResponseData[], questions: SurveyQuestion[]): void {
    const questionById = new Map(questions.map(q => [q.id, q] as const));
    const countsByQuestion = new Map<number, Map<string, number>>();

    for (const response of all) {
      for (const ans of response.responses) {
        const question = questionById.get(ans.questionId);
        if (!question || !question.options) continue;
        const options = Array.isArray(question.options) ? question.options : JSON.parse(question.options);
        const values = options.map((o: any) => o.value || o.id).filter(Boolean);
        if (!values.length) continue;

        const used = countsByQuestion.get(ans.questionId) || new Map<string, number>();
        countsByQuestion.set(ans.questionId, used);

        const current = String(ans.answer);
        const count = (used.get(current) || 0) + 1;
        used.set(current, count);

        const threshold = Math.ceil(all.length / Math.max(1, values.length));
        if (count > threshold) {
          const alternative = values
            .map((v: string) => [v, used.get(v) || 0] as const)
            .sort((a: readonly [string, number], b: readonly [string, number]) => a[1] - b[1])[0]?.[0];
          if (alternative && alternative !== current) {
            ans.answer = alternative;
            used.set(alternative, (used.get(alternative) || 0) + 1);
          }
        }
      }
    }
  }

  /**
   * Generate default demographics
   */
  private generateDefaultDemographics(demographics: Demographics): Record<string, any> {
    const demo: Record<string, any> = {};

    if (demographics.collectAge) {
      // Use allowed bucket lower-bounds (including 0 for prefer not to say)
      const ageBuckets = [0, 18, 25, 35, 45, 55, 65];
      demo.age = ageBuckets[Math.floor(Math.random() * ageBuckets.length)];
    }
    if (demographics.collectGender) {
      // Use slug values; empty string represents prefer not to say
      const genders = ['', 'male', 'female', 'non-binary', 'other'];
      demo.gender = genders[Math.floor(Math.random() * genders.length)];
    }
    if (demographics.collectLocation) {
      const locations = ['United States', 'Canada', 'United Kingdom', 'Australia', 'Germany', 'France'];
      demo.location = locations[Math.floor(Math.random() * locations.length)];
    }
    if (demographics.collectEducation) {
      const education = ['high-school', 'associate', 'bachelor', 'master', 'doctorate', 'other'];
      demo.education = education[Math.floor(Math.random() * education.length)];
    }
    if (demographics.collectIncome) {
      const income = ['under-25k', '25k-50k', '50k-75k', '75k-100k', '100k-150k', '150k-plus'];
      demo.income = income[Math.floor(Math.random() * income.length)];
    }

    return demo;
  }

  /**
   * Generate fallback responses if AI fails
   */
  private generateFallbackResponses(questions: SurveyQuestion[]): Array<{questionId: number; answer: any}> {
    const responses: Array<{questionId: number; answer: any}> = [];

    questions.forEach(question => {
      let answer: any;

      if (question.questionType === 'multiple-choice' && question.options) {
        const options = Array.isArray(question.options) ? question.options : JSON.parse(question.options);
        const randomOption = options[Math.floor(Math.random() * options.length)];
        answer = randomOption.value || randomOption.id;
      } else if (question.questionType === 'slider') {
        const config = question.sliderConfig || {};
        const min = config.min || 1;
        const max = config.max || 10;
        answer = Math.floor(Math.random() * (max - min + 1)) + min;
      } else if (question.questionType === 'ranking' && question.options) {
        const options = Array.isArray(question.options) ? question.options : JSON.parse(question.options);
        const shuffled = [...options].sort(() => Math.random() - 0.5);
        answer = JSON.stringify(shuffled.map((opt: any, index: number) => ({
          rank: index + 1,
          option: opt.text || opt.value || opt.label || String(opt),
          value: opt.value || opt.id || `option_${index}`
        })));
      } else if (question.questionType === 'scenario' && question.options) {
        const options = Array.isArray(question.options) ? question.options : JSON.parse(question.options);
        const randomOption = options[Math.floor(Math.random() * options.length)];
        answer = randomOption.value || randomOption.id;
      } else if (question.questionType === 'image' && question.options) {
        const options = Array.isArray(question.options) ? question.options : JSON.parse(question.options);
        const randomOption = options[Math.floor(Math.random() * options.length)];
        answer = randomOption.value || randomOption.id;
      } else if (question.questionType === 'mood-board' && question.options) {
        const options = Array.isArray(question.options) ? question.options : JSON.parse(question.options);
        const randomOption = options[Math.floor(Math.random() * options.length)];
        answer = randomOption.value || randomOption.id;
      } else if (question.questionType === 'personality-matrix' && question.options) {
        const options = Array.isArray(question.options) ? question.options : JSON.parse(question.options);
        const randomOption = options[Math.floor(Math.random() * options.length)];
        answer = randomOption.value || randomOption.id;
      } else if (question.options && question.questionType !== 'multiple-choice' && question.questionType !== 'ranking' && question.questionType !== 'slider' && question.questionType !== 'scenario' && question.questionType !== 'image' && question.questionType !== 'mood-board' && question.questionType !== 'personality-matrix') {
        // Handle any other question types that have options
        const options = Array.isArray(question.options) ? question.options : JSON.parse(question.options);
        const randomOption = options[Math.floor(Math.random() * options.length)];
        answer = randomOption.value || randomOption.id;
      } else {
        const responses = [
          "I find this product very useful for my daily tasks.",
          "The quality is good but could be improved in some areas.",
          "I would recommend this to others based on my experience.",
          "It meets my needs well and I'm satisfied with the purchase.",
          "There are some features I really like and some that could be better."
        ];
        answer = responses[Math.floor(Math.random() * responses.length)];
      }

      responses.push({ questionId: question.id, answer });
    });

    return responses;
  }

  /**
   * Add delay between requests
   */
  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

export default GeminiAIService;

// Lightweight analysis used at submission time to enrich a single response
export type AnalysisInput = {
  responses?: Array<{ questionId: number; answer: any }>;
  traits?: TraitSummary[];
  demographics?: Record<string, any>;
  surveyContext?: { industry?: string; productName?: string; productCategory?: string };
};

export type AnalysisOutput = {
  genderStereotypes: {
    maleAssociated: Array<{ trait: string; score: number; description?: string }>;
    femaleAssociated: Array<{ trait: string; score: number; description?: string }>;
    neutralAssociated: Array<{ trait: string; score: number; description?: string }>;
  } | null;
  productRecommendations: {
    categories: Record<string, number>;
    topProducts: Array<{ name: string; category: string; confidence: number; description?: string; attributes?: string[] }>;
  } | null;
  marketSegment: string | null;
  satisfactionScore: number | null;
  feedback: string | null;
};

export async function analyzeSurveyResponse(
  input: AnalysisInput
): Promise<AnalysisOutput> {
  // Try to use Gemini if configured; otherwise use heuristic fallback
  let service: GeminiAIService | null = null;
  try {
    service = new GeminiAIService();
  } catch {
    service = null;
  }

  if (!service) {
    return heuristicAnalysis(input);
  }

  try {
    const model = (service as any).genAI.getGenerativeModel({
      model: 'gemini-2.5-flash',
      generationConfig: { temperature: 0.4, maxOutputTokens: 1024, responseMimeType: 'application/json' }
    });

    const prompt = buildAnalysisPrompt(input);
    const result = await model.generateContent(prompt);
    const text = (await result.response).text().replace(/```json|```/g, '').trim();
    const parsed = JSON.parse(text);

    return normalizeAnalysis(parsed);
  } catch (e) {
    console.warn('Gemini analysis failed, using heuristic fallback:', e instanceof Error ? e.message : String(e));
    return heuristicAnalysis(input);
  }
}

function buildAnalysisPrompt(input: AnalysisInput): string {
  const traits = (input.traits || []).map(t => ({ name: t.name, score: t.score, category: t.category }));
  const demographics = input.demographics || {};
  const surveyContext = input.surveyContext || {};
  const payload = { traits, demographics, surveyContext, sampleAnswers: (input.responses || []).slice(0, 20) };

  return `You are an expert market and psychometrics analyst. Given the respondent's traits, demographics, and some answers, derive the following fields.

Return ONLY JSON with this exact schema:
{
  "genderStereotypes": {
    "maleAssociated": [{"trait": string, "score": number (0-100), "description"?: string}],
    "femaleAssociated": [{"trait": string, "score": number (0-100), "description"?: string}],
    "neutralAssociated": [{"trait": string, "score": number (0-100), "description"?: string}]
  } | null,
  "productRecommendations": {
    "categories": { [category: string]: number },
    "topProducts": [{"name": string, "category": string, "confidence": number (0-100), "description"?: string, "attributes"?: string[]}]
  } | null,
  "marketSegment": string | null,
  "satisfactionScore": number | null,
  "feedback": string | null
}

Constraints:
- Keep arrays small (<= 6 items). Scores/confidence 0-100. Strings concise.
- If insufficient signal, return null for that section.

Input:
${JSON.stringify(payload)}`;
}

function normalizeAnalysis(parsed: any): AnalysisOutput {
  const clamp = (n: any) => Math.max(0, Math.min(100, Number.isFinite(+n) ? +n : 0));
  const arr = (x: any) => (Array.isArray(x) ? x : []);
  const obj = (x: any) => (x && typeof x === 'object' ? x : {});

  const gs = parsed?.genderStereotypes;
  const genderStereotypes = gs ? {
    maleAssociated: arr(gs.maleAssociated).slice(0, 6).map((i: any) => ({ trait: String(i?.trait || ''), score: clamp(i?.score), description: i?.description ? String(i.description) : undefined })).filter((i: any) => i.trait),
    femaleAssociated: arr(gs.femaleAssociated).slice(0, 6).map((i: any) => ({ trait: String(i?.trait || ''), score: clamp(i?.score), description: i?.description ? String(i.description) : undefined })).filter((i: any) => i.trait),
    neutralAssociated: arr(gs.neutralAssociated).slice(0, 6).map((i: any) => ({ trait: String(i?.trait || ''), score: clamp(i?.score), description: i?.description ? String(i.description) : undefined })).filter((i: any) => i.trait)
  } : null;

  const pr = parsed?.productRecommendations;
  const productRecommendations = pr ? {
    categories: obj(pr.categories),
    topProducts: arr(pr.topProducts).slice(0, 6).map((p: any) => ({
      name: String(p?.name || ''),
      category: String(p?.category || 'General'),
      confidence: clamp(p?.confidence),
      description: p?.description ? String(p.description) : undefined,
      attributes: Array.isArray(p?.attributes) ? p.attributes.map(String).slice(0, 6) : undefined
    })).filter((p: any) => p.name)
  } : null;

  const marketSegment = parsed?.marketSegment ? String(parsed.marketSegment) : null;
  const satisfactionScore = parsed?.satisfactionScore != null ? clamp(parsed.satisfactionScore) : null;
  const feedback = parsed?.feedback != null ? String(parsed.feedback) : null;

  return { genderStereotypes, productRecommendations, marketSegment, satisfactionScore, feedback };
}

function heuristicAnalysis(input: AnalysisInput): AnalysisOutput {
  const traits = input.traits || [];
  const top = [...traits].sort((a, b) => (b.score || 0) - (a.score || 0));
  const topTrait = top[0]?.name || 'Innovation';

  const genderStereotypes = {
    maleAssociated: topTrait === 'Leadership' ? [{ trait: 'Assertive', score: 70, description: 'Takes initiative' }] : [],
    femaleAssociated: topTrait === 'Creativity' ? [{ trait: 'Empathetic', score: 72, description: 'Understands user needs' }] : [],
    neutralAssociated: [{ trait: 'Creative', score: 65 }, { trait: 'Organized', score: 60 }]
  };

  const industry = input.surveyContext?.industry || 'General';
  const categories: Record<string, number> = {};
  if (topTrait === 'Analytical Thinking') categories['Education'] = 12;
  if (topTrait === 'Innovation') categories['Productivity'] = 18;
  if (topTrait === 'Creativity') categories['Design'] = 10;
  if (topTrait === 'Leadership') categories['Management'] = 8;
  categories[industry] = (categories[industry] || 0) + 5;

  const productRecommendations = {
    categories,
    topProducts: [
      { name: 'FocusPro', category: 'Productivity', confidence: 78 },
      { name: 'IdeaStudio', category: 'Design', confidence: 66 }
    ]
  };

  const marketSegment = topTrait === 'Innovation' ? 'Early Adopters' : topTrait === 'Analytical Thinking' ? 'Efficiency Seekers' : 'Value Hunters';
  const satisfactionScore = 70;
  const feedback = 'Overall positive experience.';

  return { genderStereotypes, productRecommendations, marketSegment, satisfactionScore, feedback };
}
