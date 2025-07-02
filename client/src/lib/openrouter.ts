export interface OpenRouterMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

export interface OpenRouterResponse {
  choices: {
    message: {
      content: string;
    };
  }[];
}

// Multiple API keys for failover
const API_KEYS = [
  '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',
  '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',
  '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',
  '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',
  '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',
  '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',
  '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',
  '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',
  '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',
  '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',
  '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',
  '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',
  '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',
  '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',
  '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'
];

// Client-side API key manager
class ClientAPIKeyManager {
  private failedKeys: Set<string> = new Set();
  private currentKeyIndex: number = 0;

  getCurrentKey(): string {
    // Find next working key
    while (this.currentKeyIndex < API_KEYS.length) {
      const key = API_KEYS[this.currentKeyIndex];
      if (!this.failedKeys.has(key)) {
        console.log(`🔐 Using client API key #${this.currentKeyIndex + 1}`);
        return key;
      }
      this.currentKeyIndex++;
    }

    // If all keys failed, reset and try again
    if (this.failedKeys.size === API_KEYS.length) {
      console.log('⚠️ All client API keys failed, resetting...');
      this.failedKeys.clear();
      this.currentKeyIndex = 0;
      return API_KEYS[0];
    }

    throw new Error('No working API keys available');
  }

  markKeyAsFailed(apiKey: string): void {
    console.log(`❌ Marking client API key as failed: ${apiKey.substring(0, 20)}...`);
    this.failedKeys.add(apiKey);
    this.currentKeyIndex++;
  }

  getWorkingKeysCount(): number {
    return API_KEYS.length - this.failedKeys.size;
  }

  getStats(): { total: number; working: number; failed: number } {
    return {
      total: API_KEYS.length,
      working: this.getWorkingKeysCount(),
      failed: this.failedKeys.size
    };
  }
}

const clientAPIKeyManager = new ClientAPIKeyManager();
const OPENROUTER_BASE_URL = "https://openrouter.ai/api/v1/chat/completions";

export async function callDeepSeek(
  messages: OpenRouterMessage[]
): Promise<string> {
  const maxRetries = 3;
  let lastError: Error | null = null;

  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      const currentApiKey = clientAPIKeyManager.getCurrentKey();
      console.log(`🔄 Client API attempt ${attempt + 1}/${maxRetries} with key #${clientAPIKeyManager.getStats().total - clientAPIKeyManager.getStats().working + 1}`);
      
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 45000); // 45 second timeout for AI requests

      const response = await fetch(OPENROUTER_BASE_URL, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${currentApiKey}`,
          "HTTP-Referer": window.location.origin,
          "X-Title": "InterviewGenie",
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "deepseek/deepseek-chat-v3-0324",
          messages,
          max_tokens: 4000,
          temperature: 0.3,
          top_p: 0.9,
          stream: false,
        }),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        const errorText = await response.text();
        console.error("OpenRouter API error details:", errorText);

        // Check if it's an API key related error
        if (response.status === 401 || response.status === 403) {
          console.log('🔑 Client API key authentication failed, marking as failed and trying next key');
          clientAPIKeyManager.markKeyAsFailed(currentApiKey);
          
          // If we still have working keys, continue to next attempt
          if (clientAPIKeyManager.getWorkingKeysCount() > 0) {
            continue;
          } else {
            throw new Error("All API keys failed. Please check your API key configuration.");
          }
        }

        if (response.status === 429) {
          throw new Error(
            "Rate limit exceeded. Please try again in a few minutes."
          );
        }

        throw new Error(
          `OpenRouter API error: ${response.status} ${response.statusText} - ${errorText}`
        );
      }

      const data: OpenRouterResponse = await response.json();
      const content = data.choices[0]?.message?.content;

      if (!content) {
        throw new Error("No response content received from AI");
      }

      console.log(`✅ Client API success on attempt ${attempt + 1}`);
      return content;
    } catch (error: any) {
      lastError = error;
      console.error(`❌ Client API error on attempt ${attempt + 1}:`, error.message);
      
      if (error.name === "AbortError") {
        throw new Error("AI request timeout - please try again");
      }

      // Check if it's an API key related error
      if (error.message.includes('authentication') || error.message.includes('unauthorized')) {
        const currentApiKey = clientAPIKeyManager.getCurrentKey();
        clientAPIKeyManager.markKeyAsFailed(currentApiKey);
        
        // If we still have working keys, continue to next attempt
        if (clientAPIKeyManager.getWorkingKeysCount() > 0) {
          continue;
        }
      }
      
      // For other errors, wait a bit before retrying
      if (attempt < maxRetries - 1) {
        console.log(`⏳ Waiting 2 seconds before retry...`);
        await new Promise(resolve => setTimeout(resolve, 2000));
      }
    }
  }

  console.error(`💥 All client API attempts failed. Stats:`, clientAPIKeyManager.getStats());
  throw lastError || new Error("DeepSeek API failed after all retries");
}

export function createQuestionGenerationPrompt(
  jobDescription: string,
  resume: string,
  jobTitle?: string,
  companyName?: string
): OpenRouterMessage[] {
  const systemPrompt = `You are a senior technical interviewer creating comprehensive interview questions. Generate exactly 85 interview questions based on the job description and resume.

CRITICAL FORMATTING RULES:
- Return ONLY valid JSON array format
- No markdown blocks or code fences
- No explanations or extra text  
- No trailing commas
- All strings must be properly quoted
- Ensure proper JSON syntax

Structure:
[
  {
    "id": "tech_easy_1",
    "type": "technical",
    "difficulty": "easy",
    "question": "Explain the difference between synchronous and asynchronous programming"
  },
  {
    "id": "behavioral_1",
    "type": "behavioral", 
    "difficulty": "medium",
    "question": "Describe a time when you had to work with a difficult team member"
  },
  {
    "id": "coding_easy_1",
    "type": "coding",
    "difficulty": "easy",
    "question": "Write a function to reverse a string",
    "context": "String manipulation problem",
    "constraints": ["Time complexity: O(n)", "Space complexity: O(1) preferred"],
    "examples": [{"input": "hello", "output": "olleh", "explanation": "Reverse each character"}]
  }
]

You are an expert technical interviewer. Generate exactly 100 interview questions as a JSON array.

CRITICAL: Respond with ONLY the JSON array. No explanations, no markdown blocks, no extra text before or after the JSON.

STRUCTURE: 60 technical (20 easy, 20 medium, 20 hard) + 25 behavioral + 15 coding (5 easy, 5 medium, 5 hard)

JSON FORMAT:
[{"id":"1","type":"technical","difficulty":"easy","question":"What is the difference between let and var in JavaScript?"},{"id":"86","type":"coding","difficulty":"easy","question":"Write a function to reverse a string","context":"String manipulation problem","constraints":["O(n) time complexity"],"examples":[{"input":"hello","output":"olleh"}]}]

Tailor questions to company type and job requirements. Use specific technologies mentioned in job description.`;

  const userPrompt = `Position: ${jobTitle || "Software Developer"}
Company: ${companyName || "Technology Company"}
Job Requirements: ${jobDescription.substring(0, 1000)}
Candidate Background: ${resume.substring(0, 800)}

COMPANY ANALYSIS: Determine company type and standards:
- FAANG (Google, Meta, Amazon, Apple, Netflix): Focus on scalability, system design, complex algorithms
- Startup: Emphasis on versatility, rapid development, full-stack capabilities
- Enterprise: Focus on maintainability, documentation, established patterns
- Consulting: Client communication, adaptability, diverse technology exposure

ROLE ANALYSIS: Extract key technologies, frameworks, and requirements from job description.

Generate 100 comprehensive interview questions as a pure JSON array with exact distribution:
- 60 technical (20 easy, 20 medium, 20 hard)
- 25 behavioral 
- 15 coding (5 easy, 5 medium, 5 hard)

Tailor ALL questions to the specific company standards and job requirements.`;

  return [
    { role: "system", content: systemPrompt },
    { role: "user", content: userPrompt },
  ];
}

export function createAnswerGenerationPrompt(
  question: string,
  questionType: string,
  context?: string
): OpenRouterMessage[] {
  if (questionType === "technical") {
    return [
      {
        role: "system",
        content: `You are a senior software engineer providing a technical interview answer. Create a response that demonstrates deep expertise and impresses interviewers.

STRUCTURE YOUR ANSWER AS:
1. Core Concept: Brief, clear definition
2. Key Points: 3-4 main technical aspects
3. Real-World Example: Practical implementation scenario
4. Best Practices: Industry standards and recommendations
5. Advanced Insight: Something that shows senior-level thinking

FORMAT: Use natural conversation flow with clear sections. NO asterisks or markdown symbols. Use bullet points and numbered lists for clarity. Write in a conversational tone as if speaking to an interviewer.`,
      },
      {
        role: "user",
        content: `Technical Question: ${question}${
          context ? `\nContext: ${context}` : ""
        }

Provide a comprehensive technical answer that showcases expertise and impresses interviewers.`,
      },
    ];
  } else if (questionType === "behavioral") {
    return [
      {
        role: "system",
        content: `You are an executive coach helping prepare impressive behavioral interview answers. Create responses using the STAR method that demonstrate leadership and impact.

STRUCTURE YOUR ANSWER AS:
1. Situation: Set the professional context clearly
2. Task: Define your specific responsibility
3. Action: Detail your strategic approach and decisions
4. Result: Quantify the positive outcome and impact
5. Learning: What insights you gained for future situations

FORMAT: Tell a compelling story that highlights leadership, problem-solving, and results. NO asterisks or markdown symbols. Use natural storytelling flow that sounds authentic and engaging.`,
      },
      {
        role: "user",
        content: `Behavioral Question: ${question}

Provide a compelling STAR-method answer that demonstrates leadership and results.`,
      },
    ];
  } else {
    return [
      {
        role: "system",
        content:
          "You are a coding interview expert. Provide a well-structured solution with clear explanation, optimization notes, and best practices. Format code properly with comments.",
      },
      {
        role: "user",
        content: `Coding Question: ${question}${
          context ? `\nContext: ${context}` : ""
        }\n\nProvide a complete solution with explanation.`,
      },
    ];
  }
}

export function createEvaluationPrompt(
  question: string,
  answer: string,
  questionType: string
): OpenRouterMessage[] {
  const systemPrompt = `You are an expert interviewer evaluating candidate responses. Provide detailed feedback in the following JSON format:
{
  "score": 8.5,
  "pros": ["strength 1", "strength 2", "strength 3"],
  "cons": ["area for improvement 1", "area for improvement 2"],
  "suggestions": ["suggestion 1", "suggestion 2", "suggestion 3"],
  "correctness": 9.0, // for technical/coding questions only
  "optimization": 7.5, // for coding questions only
  "edgeCaseHandling": 8.0 // for coding questions only
}

Score should be between 0-10. Be constructive but honest in your evaluation.`;

  return [
    { role: "system", content: systemPrompt },
    {
      role: "user",
      content: `Question Type: ${questionType}\nQuestion: ${question}\nCandidate Answer: ${answer}`,
    },
  ];
}
