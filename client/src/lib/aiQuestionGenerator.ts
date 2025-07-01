import { callDeepSeek, OpenRouterMessage } from "./openrouter";
import { Question } from "@shared/schema";

export interface QuestionGenerationResult {
  success: boolean;
  questions: Question[];
  error?: string;
}

// Static fallback questions for when AI fails
const FALLBACK_QUESTIONS: Question[] = [
  // Technical Questions - Easy
  {
    id: "tech_easy_1",
    type: "technical",
    difficulty: "easy",
    question: "What is the difference between let, const, and var in JavaScript?"
  },
  {
    id: "tech_easy_2", 
    type: "technical",
    difficulty: "easy",
    question: "Explain what REST API is and its main principles."
  },
  {
    id: "tech_easy_3",
    type: "technical", 
    difficulty: "easy",
    question: "What is the difference between SQL and NoSQL databases?"
  },
  {
    id: "tech_easy_4",
    type: "technical",
    difficulty: "easy", 
    question: "What are the main principles of Object-Oriented Programming?"
  },
  {
    id: "tech_easy_5",
    type: "technical",
    difficulty: "easy",
    question: "Explain the concept of version control and Git."
  },
  
  // Technical Questions - Medium
  {
    id: "tech_medium_1",
    type: "technical",
    difficulty: "medium",
    question: "How would you optimize a slow-performing database query?"
  },
  {
    id: "tech_medium_2",
    type: "technical", 
    difficulty: "medium",
    question: "Explain the concept of microservices architecture and its benefits."
  },
  {
    id: "tech_medium_3",
    type: "technical",
    difficulty: "medium",
    question: "What are design patterns and can you explain a few common ones?"
  },
  {
    id: "tech_medium_4",
    type: "technical",
    difficulty: "medium", 
    question: "How do you handle state management in a React application?"
  },
  {
    id: "tech_medium_5",
    type: "technical",
    difficulty: "medium",
    question: "Explain the differences between authentication and authorization."
  },

  // Technical Questions - Hard  
  {
    id: "tech_hard_1",
    type: "technical",
    difficulty: "hard",
    question: "Design a scalable system for handling millions of concurrent users."
  },
  {
    id: "tech_hard_2",
    type: "technical",
    difficulty: "hard", 
    question: "How would you implement a distributed caching system?"
  },
  {
    id: "tech_hard_3",
    type: "technical",
    difficulty: "hard",
    question: "Explain CAP theorem and its implications in distributed systems."
  },
  {
    id: "tech_hard_4",
    type: "technical",
    difficulty: "hard",
    question: "Design a real-time messaging system like WhatsApp."
  },
  {
    id: "tech_hard_5", 
    type: "technical",
    difficulty: "hard",
    question: "How would you handle database migrations in a production environment?"
  },

  // Behavioral Questions
  {
    id: "behavioral_1",
    type: "behavioral",
    difficulty: "medium",
    question: "Tell me about a time when you had to work with a difficult team member."
  },
  {
    id: "behavioral_2",
    type: "behavioral", 
    difficulty: "medium",
    question: "Describe a situation where you had to learn a new technology quickly."
  },
  {
    id: "behavioral_3",
    type: "behavioral",
    difficulty: "medium", 
    question: "How do you handle tight deadlines and pressure?"
  },
  {
    id: "behavioral_4",
    type: "behavioral",
    difficulty: "medium",
    question: "Tell me about a time when you made a mistake. How did you handle it?"
  },
  {
    id: "behavioral_5",
    type: "behavioral",
    difficulty: "medium",
    question: "Describe a project you're particularly proud of and why."
  },

  // Coding Questions - Easy
  {
    id: "coding_easy_1",
    type: "coding",
    difficulty: "easy",
    question: "Write a function to reverse a string without using built-in reverse methods.",
    context: "String manipulation problem",
    constraints: ["Time complexity should be O(n)", "Space complexity should be O(1)"],
    examples: [
      { input: "hello", output: "olleh", explanation: "Reverse each character position" }
    ]
  },
  {
    id: "coding_easy_2",
    type: "coding", 
    difficulty: "easy",
    question: "Find the maximum number in an array of integers.",
    context: "Array traversal problem",
    constraints: ["Handle empty arrays", "Single pass solution preferred"],
    examples: [
      { input: "[3, 1, 4, 1, 5, 9]", output: "9", explanation: "9 is the largest number" }
    ]
  },
  {
    id: "coding_easy_3",
    type: "coding",
    difficulty: "easy", 
    question: "Check if a string is a palindrome (reads the same forwards and backwards).",
    context: "String comparison problem",
    constraints: ["Case insensitive", "Ignore spaces and punctuation"],
    examples: [
      { input: "A man a plan a canal Panama", output: "true", explanation: "Reads same forwards and backwards" }
    ]
  },

  // Coding Questions - Medium
  {
    id: "coding_medium_1",
    type: "coding",
    difficulty: "medium",
    question: "Implement a function to find the first non-repeating character in a string.",
    context: "Hash table / frequency counting problem", 
    constraints: ["O(n) time complexity", "Handle edge cases"],
    examples: [
      { input: "leetcode", output: "l", explanation: "l appears only once" }
    ]
  },
  {
    id: "coding_medium_2",
    type: "coding", 
    difficulty: "medium",
    question: "Given two sorted arrays, merge them into one sorted array.",
    context: "Two-pointer technique problem",
    constraints: ["O(m+n) time complexity", "O(1) extra space if possible"],
    examples: [
      { input: "[1,2,3] and [2,5,6]", output: "[1,2,2,3,5,6]", explanation: "Merged and sorted" }
    ]
  },

  // Coding Questions - Hard
  {
    id: "coding_hard_1", 
    type: "coding",
    difficulty: "hard",
    question: "Implement a LRU (Least Recently Used) cache with get and put operations.",
    context: "Data structure design problem",
    constraints: ["O(1) time complexity for both operations", "Use doubly linked list and hash map"],
    examples: [
      { input: "put(1,1), put(2,2), get(1), put(3,3), get(2)", output: "1, -1", explanation: "LRU eviction policy" }
    ]
  }
];

function cleanJsonResponse(response: string): string {
  // Remove markdown code blocks
  let cleaned = response.replace(/```json\s*/g, '').replace(/```\s*/g, '');
  
  // Remove any text before the first [ or {
  const jsonStart = Math.min(
    cleaned.indexOf('[') >= 0 ? cleaned.indexOf('[') : Infinity,
    cleaned.indexOf('{') >= 0 ? cleaned.indexOf('{') : Infinity
  );
  
  if (jsonStart < Infinity) {
    cleaned = cleaned.substring(jsonStart);
  }
  
  // Find the last ] or }
  const lastBracket = cleaned.lastIndexOf(']');
  const lastBrace = cleaned.lastIndexOf('}');
  const jsonEnd = Math.max(lastBracket, lastBrace);
  
  if (jsonEnd > 0) {
    cleaned = cleaned.substring(0, jsonEnd + 1);
  }
  
  // Fix common JSON issues
  cleaned = cleaned
    .replace(/,\s*]/g, ']')           // Remove trailing commas before ]
    .replace(/,\s*}/g, '}')           // Remove trailing commas before }
    .replace(/([^"])\n/g, '$1')       // Remove newlines not in strings
    .replace(/\s+/g, ' ')             // Normalize whitespace
    .replace(/,\s*,/g, ',')           // Remove duplicate commas
    .trim();
  
  return cleaned;
}

function validateQuestions(questions: any[]): Question[] {
  const validQuestions: Question[] = [];
  
  for (const q of questions) {
    if (!q || typeof q !== 'object') continue;
    
    // Validate required fields
    if (!q.id || !q.type || !q.difficulty || !q.question) continue;
    
    // Validate types
    if (!['technical', 'behavioral', 'coding'].includes(q.type)) continue;
    if (!['easy', 'medium', 'hard'].includes(q.difficulty)) continue;
    
    const validQuestion: Question = {
      id: String(q.id),
      type: q.type as 'technical' | 'behavioral' | 'coding',
      difficulty: q.difficulty as 'easy' | 'medium' | 'hard',
      question: String(q.question)
    };
    
    // Add optional fields for coding questions
    if (q.type === 'coding') {
      if (q.context) validQuestion.context = String(q.context);
      if (Array.isArray(q.constraints)) {
        validQuestion.constraints = q.constraints.map((c: any) => String(c));
      }
      if (Array.isArray(q.examples)) {
        validQuestion.examples = q.examples.map((ex: any) => ({
          input: String(ex.input || ''),
          output: String(ex.output || ''),
          explanation: ex.explanation ? String(ex.explanation) : undefined
        }));
      }
    }
    
    validQuestions.push(validQuestion);
  }
  
  return validQuestions;
}

export async function generateQuestionsWithAI(
  jobDescription: string,
  resume: string,
  jobTitle?: string,
  companyName?: string
): Promise<QuestionGenerationResult> {
  
  try {
    console.log("🚀 Starting AI question generation...");
    
    const messages: OpenRouterMessage[] = [
      {
        role: "system",
        content: `You are an expert technical interviewer. Generate exactly 50 interview questions based on the provided job description and resume.

CRITICAL REQUIREMENTS:
- Return ONLY a valid JSON array
- No markdown formatting, no explanations, no extra text
- Each question must have: id, type, difficulty, question
- For coding questions add: context, constraints (array), examples (array with input/output/explanation)

DISTRIBUTION:
- 30 technical questions (10 easy, 10 medium, 10 hard)
- 15 behavioral questions (all medium difficulty)
- 5 coding questions (2 easy, 2 medium, 1 hard)

EXAMPLE FORMAT:
[
  {"id":"tech_1","type":"technical","difficulty":"easy","question":"What is REST API?"},
  {"id":"behavioral_1","type":"behavioral","difficulty":"medium","question":"Tell me about a challenging project."},
  {"id":"coding_1","type":"coding","difficulty":"easy","question":"Reverse a string","context":"String manipulation","constraints":["O(n) time"],"examples":[{"input":"hello","output":"olleh"}]}
]`
      },
      {
        role: "user",
        content: `Company: ${companyName || 'Technology Company'}
Job Title: ${jobTitle || 'Software Engineer'}
Job Description: ${jobDescription.substring(0, 1000)}
Resume: ${resume.substring(0, 500)}

Generate questions tailored to this specific role and company.`
      }
    ];

    console.log("📡 Calling AI API...");
    const aiResponse = await callDeepSeek(messages);
    console.log("✅ AI response received, length:", aiResponse.length);
    
    // Clean the response
    const cleanedResponse = cleanJsonResponse(aiResponse);
    console.log("🧹 Cleaned response length:", cleanedResponse.length);
    console.log("🧹 First 200 chars:", cleanedResponse.substring(0, 200));
    
    // Parse JSON
    let parsedQuestions: any[];
    try {
      parsedQuestions = JSON.parse(cleanedResponse);
    } catch (parseError) {
      console.error("❌ JSON parse error:", parseError);
      console.log("📝 Failed response:", cleanedResponse.substring(0, 500));
      throw new Error("Invalid JSON response from AI");
    }
    
    if (!Array.isArray(parsedQuestions)) {
      throw new Error("AI response is not an array");
    }
    
    // Validate and clean questions
    const validQuestions = validateQuestions(parsedQuestions);
    console.log(`✅ Generated ${validQuestions.length} valid questions`);
    
    if (validQuestions.length < 20) {
      console.warn("⚠️ Too few valid questions generated, using fallback");
      return {
        success: false,
        questions: FALLBACK_QUESTIONS.slice(0, 50),
        error: "AI generated too few valid questions"
      };
    }
    
    return {
      success: true,
      questions: validQuestions.slice(0, 50) // Ensure we don't exceed 50
    };
    
  } catch (error: any) {
    console.error("❌ AI generation failed:", error.message);
    return {
      success: false,
      questions: FALLBACK_QUESTIONS.slice(0, 50),
      error: error.message
    };
  }
}