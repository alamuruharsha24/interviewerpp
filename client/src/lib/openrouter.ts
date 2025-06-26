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

const OPENROUTER_API_KEY = import.meta.env.VITE_OPENROUTER_API_KEY;
const OPENROUTER_BASE_URL = "https://openrouter.ai/api/v1/chat/completions";

export async function callDeepSeek(
  messages: OpenRouterMessage[]
): Promise<string> {
  if (!OPENROUTER_API_KEY) {
    throw new Error(
      "OpenRouter API key not configured. Please check your VITE_OPENROUTER_API_KEY environment variable."
    );
  }

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 45000); // 45 second timeout for AI requests

    const response = await fetch(OPENROUTER_BASE_URL, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${OPENROUTER_API_KEY}`,
        "HTTP-Referer": window.location.origin,
        "X-Title": "InterviewGenie",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "deepseek/deepseek-r1:free",
        messages,
        max_tokens: 8000,
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

      if (response.status === 401) {
        throw new Error(
          "OpenRouter API authentication failed. Please verify your API key."
        );
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

    return content;
  } catch (error: any) {
    if (error.name === "AbortError") {
      throw new Error("AI request timeout - please try again");
    }
    console.error("Error calling DeepSeek API:", error);
    throw error;
  }
}

export function createQuestionGenerationPrompt(
  jobDescription: string,
  resume: string,
  jobTitle?: string,
  companyName?: string
): OpenRouterMessage[] {
  const systemPrompt = `You are a senior technical interviewer creating comprehensive interview questions. Generate exactly 85 interview questions based on the job description and resume.

CRITICAL: Return ONLY a valid JSON array with no markdown, explanations, or extra text. Structure:
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
