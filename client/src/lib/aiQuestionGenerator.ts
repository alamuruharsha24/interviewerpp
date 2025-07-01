import { callDeepSeek, OpenRouterMessage } from "./openrouter";
import { Question } from "@shared/schema";

export interface QuestionGenerationResult {
  success: boolean;
  questions: Question[];
  error?: string;
}

// Comprehensive fallback questions (100 total) for when AI fails
const FALLBACK_QUESTIONS: Question[] = [
  // Technical Questions - Easy (20)
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
  {
    id: "tech_easy_6",
    type: "technical",
    difficulty: "easy",
    question: "What is HTML and what are semantic HTML elements?"
  },
  {
    id: "tech_easy_7",
    type: "technical",
    difficulty: "easy",
    question: "Explain CSS box model and its components."
  },
  {
    id: "tech_easy_8",
    type: "technical",
    difficulty: "easy",
    question: "What is the difference between HTTP and HTTPS?"
  },
  {
    id: "tech_easy_9",
    type: "technical",
    difficulty: "easy",
    question: "What are the different data types in JavaScript?"
  },
  {
    id: "tech_easy_10",
    type: "technical",
    difficulty: "easy",
    question: "Explain what is DOM and how to manipulate it."
  },
  {
    id: "tech_easy_11",
    type: "technical",
    difficulty: "easy",
    question: "What is the difference between == and === in JavaScript?"
  },
  {
    id: "tech_easy_12",
    type: "technical",
    difficulty: "easy",
    question: "What are CSS selectors and their types?"
  },
  {
    id: "tech_easy_13",
    type: "technical",
    difficulty: "easy",
    question: "Explain the concept of responsive design."
  },
  {
    id: "tech_easy_14",
    type: "technical",
    difficulty: "easy",
    question: "What is JSON and how is it used?"
  },
  {
    id: "tech_easy_15",
    type: "technical",
    difficulty: "easy",
    question: "What are the basic Linux commands every developer should know?"
  },
  {
    id: "tech_easy_16",
    type: "technical",
    difficulty: "easy",
    question: "Explain what is an API and how it works."
  },
  {
    id: "tech_easy_17",
    type: "technical",
    difficulty: "easy",
    question: "What is the difference between frontend and backend development?"
  },
  {
    id: "tech_easy_18",
    type: "technical",
    difficulty: "easy",
    question: "What are the advantages of using frameworks like React or Angular?"
  },
  {
    id: "tech_easy_19",
    type: "technical",
    difficulty: "easy",
    question: "Explain what is debugging and what tools you use for it."
  },
  {
    id: "tech_easy_20",
    type: "technical",
    difficulty: "easy",
    question: "What is the difference between synchronous and asynchronous programming?"
  },
  
  // Technical Questions - Medium (20)
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
  {
    id: "tech_medium_6",
    type: "technical",
    difficulty: "medium",
    question: "What is middleware and how is it used in web applications?"
  },
  {
    id: "tech_medium_7",
    type: "technical",
    difficulty: "medium",
    question: "Explain the concept of caching and different caching strategies."
  },
  {
    id: "tech_medium_8",
    type: "technical",
    difficulty: "medium",
    question: "How do you handle error handling and logging in applications?"
  },
  {
    id: "tech_medium_9",
    type: "technical",
    difficulty: "medium",
    question: "What is database indexing and when should you use it?"
  },
  {
    id: "tech_medium_10",
    type: "technical",
    difficulty: "medium",
    question: "Explain the concept of load balancing and its types."
  },
  {
    id: "tech_medium_11",
    type: "technical",
    difficulty: "medium",
    question: "What are the principles of clean code and how do you implement them?"
  },
  {
    id: "tech_medium_12",
    type: "technical",
    difficulty: "medium",
    question: "How do you implement security best practices in web applications?"
  },
  {
    id: "tech_medium_13",
    type: "technical",
    difficulty: "medium",
    question: "What is containerization and how does Docker work?"
  },
  {
    id: "tech_medium_14",
    type: "technical",
    difficulty: "medium",
    question: "Explain the concept of CI/CD and its benefits."
  },
  {
    id: "tech_medium_15",
    type: "technical",
    difficulty: "medium",
    question: "How do you optimize frontend performance?"
  },
  {
    id: "tech_medium_16",
    type: "technical",
    difficulty: "medium",
    question: "What are the different types of testing and when to use each?"
  },
  {
    id: "tech_medium_17",
    type: "technical",
    difficulty: "medium",
    question: "Explain the concept of database normalization."
  },
  {
    id: "tech_medium_18",
    type: "technical",
    difficulty: "medium",
    question: "How do you handle cross-browser compatibility issues?"
  },
  {
    id: "tech_medium_19",
    type: "technical",
    difficulty: "medium",
    question: "What is GraphQL and how does it differ from REST?"
  },
  {
    id: "tech_medium_20",
    type: "technical",
    difficulty: "medium",
    question: "Explain the concept of event-driven architecture."
  },

  // Technical Questions - Hard (20)
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
  {
    id: "tech_hard_6",
    type: "technical",
    difficulty: "hard",
    question: "Design a highly available and fault-tolerant distributed system."
  },
  {
    id: "tech_hard_7",
    type: "technical",
    difficulty: "hard",
    question: "How would you implement a search engine like Google?"
  },
  {
    id: "tech_hard_8",
    type: "technical",
    difficulty: "hard",
    question: "Explain eventual consistency and how to handle it in distributed systems."
  },
  {
    id: "tech_hard_9",
    type: "technical",
    difficulty: "hard",
    question: "Design a content delivery network (CDN) from scratch."
  },
  {
    id: "tech_hard_10",
    type: "technical",
    difficulty: "hard",
    question: "How would you implement a recommendation system for a social media platform?"
  },
  {
    id: "tech_hard_11",
    type: "technical",
    difficulty: "hard",
    question: "Design a distributed database that can handle ACID properties."
  },
  {
    id: "tech_hard_12",
    type: "technical",
    difficulty: "hard",
    question: "How would you implement a real-time analytics system for big data?"
  },
  {
    id: "tech_hard_13",
    type: "technical",
    difficulty: "hard",
    question: "Design a system to handle payment processing with high security."
  },
  {
    id: "tech_hard_14",
    type: "technical",
    difficulty: "hard",
    question: "How would you implement rate limiting in a distributed system?"
  },
  {
    id: "tech_hard_15",
    type: "technical",
    difficulty: "hard",
    question: "Design a system for handling video streaming like Netflix."
  },
  {
    id: "tech_hard_16",
    type: "technical",
    difficulty: "hard",
    question: "How would you implement consistent hashing for load balancing?"
  },
  {
    id: "tech_hard_17",
    type: "technical",
    difficulty: "hard",
    question: "Design a system for real-time collaborative editing like Google Docs."
  },
  {
    id: "tech_hard_18",
    type: "technical",
    difficulty: "hard",
    question: "How would you implement a distributed lock manager?"
  },
  {
    id: "tech_hard_19",
    type: "technical",
    difficulty: "hard",
    question: "Design a system for handling financial transactions with ACID properties."
  },
  {
    id: "tech_hard_20",
    type: "technical",
    difficulty: "hard",
    question: "How would you implement a global DNS system?"
  },

  // Behavioral Questions (25)
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
  {
    id: "behavioral_6",
    type: "behavioral",
    difficulty: "medium",
    question: "Tell me about a time when you had to give constructive feedback to a colleague."
  },
  {
    id: "behavioral_7",
    type: "behavioral",
    difficulty: "medium",
    question: "Describe a situation where you had to adapt to significant changes at work."
  },
  {
    id: "behavioral_8",
    type: "behavioral",
    difficulty: "medium",
    question: "How do you prioritize tasks when everything seems urgent?"
  },
  {
    id: "behavioral_9",
    type: "behavioral",
    difficulty: "medium",
    question: "Tell me about a time when you had to convince someone to adopt your idea."
  },
  {
    id: "behavioral_10",
    type: "behavioral",
    difficulty: "medium",
    question: "Describe a time when you had to work with incomplete information."
  },
  {
    id: "behavioral_11",
    type: "behavioral",
    difficulty: "medium",
    question: "How do you stay updated with new technologies and industry trends?"
  },
  {
    id: "behavioral_12",
    type: "behavioral",
    difficulty: "medium",
    question: "Tell me about a time when you had to resolve a conflict within your team."
  },
  {
    id: "behavioral_13",
    type: "behavioral",
    difficulty: "medium",
    question: "Describe a situation where you had to take initiative without being asked."
  },
  {
    id: "behavioral_14",
    type: "behavioral",
    difficulty: "medium",
    question: "How do you handle failure or setbacks in your projects?"
  },
  {
    id: "behavioral_15",
    type: "behavioral",
    difficulty: "medium",
    question: "Tell me about a time when you had to mentor or help a junior developer."
  },
  {
    id: "behavioral_16",
    type: "behavioral",
    difficulty: "medium",
    question: "Describe a challenging technical problem you solved and your approach."
  },
  {
    id: "behavioral_17",
    type: "behavioral",
    difficulty: "medium",
    question: "How do you balance technical debt with new feature development?"
  },
  {
    id: "behavioral_18",
    type: "behavioral",
    difficulty: "medium",
    question: "Tell me about a time when you had to work with a remote or distributed team."
  },
  {
    id: "behavioral_19",
    type: "behavioral",
    difficulty: "medium",
    question: "Describe a situation where you had to make a decision with limited data."
  },
  {
    id: "behavioral_20",
    type: "behavioral",
    difficulty: "medium",
    question: "How do you approach code reviews and giving feedback to peers?"
  },
  {
    id: "behavioral_21",
    type: "behavioral",
    difficulty: "medium",
    question: "Tell me about a time when you had to switch between multiple projects."
  },
  {
    id: "behavioral_22",
    type: "behavioral",
    difficulty: "medium",
    question: "Describe your approach to debugging complex issues."
  },
  {
    id: "behavioral_23",
    type: "behavioral",
    difficulty: "medium",
    question: "How do you ensure code quality in your projects?"
  },
  {
    id: "behavioral_24",
    type: "behavioral",
    difficulty: "medium",
    question: "Tell me about a time when you had to present technical concepts to non-technical stakeholders."
  },
  {
    id: "behavioral_25",
    type: "behavioral",
    difficulty: "medium",
    question: "What motivates you as a software developer and how do you stay passionate about coding?"
  },

  // Coding Questions - Easy (5)
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
  {
    id: "coding_easy_4",
    type: "coding",
    difficulty: "easy",
    question: "Write a function to count the number of vowels in a string.",
    context: "String processing problem",
    constraints: ["Case insensitive", "Count a, e, i, o, u"],
    examples: [
      { input: "Hello World", output: "3", explanation: "e, o, o are vowels" }
    ]
  },
  {
    id: "coding_easy_5",
    type: "coding",
    difficulty: "easy",
    question: "Implement a function to check if a number is even or odd.",
    context: "Basic arithmetic problem",
    constraints: ["Handle negative numbers", "Return boolean"],
    examples: [
      { input: "4", output: "true", explanation: "4 is even" }
    ]
  },

  // Coding Questions - Medium (5)
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
  {
    id: "coding_medium_3",
    type: "coding",
    difficulty: "medium",
    question: "Find the longest substring without repeating characters.",
    context: "Sliding window technique problem",
    constraints: ["O(n) time complexity", "Handle edge cases"],
    examples: [
      { input: "abcabcbb", output: "3", explanation: "abc is the longest substring" }
    ]
  },
  {
    id: "coding_medium_4",
    type: "coding",
    difficulty: "medium",
    question: "Implement a function to rotate an array to the right by k steps.",
    context: "Array manipulation problem",
    constraints: ["O(n) time complexity", "O(1) space complexity"],
    examples: [
      { input: "[1,2,3,4,5,6,7], k=3", output: "[5,6,7,1,2,3,4]", explanation: "Rotated 3 steps right" }
    ]
  },
  {
    id: "coding_medium_5",
    type: "coding",
    difficulty: "medium",
    question: "Find all pairs in an array that sum to a target value.",
    context: "Two-sum problem variation",
    constraints: ["O(n) time complexity", "Return all unique pairs"],
    examples: [
      { input: "[1,2,3,4,5], target=5", output: "[(1,4), (2,3)]", explanation: "Pairs that sum to 5" }
    ]
  },

  // Coding Questions - Hard (5)
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
  },
  {
    id: "coding_hard_2",
    type: "coding",
    difficulty: "hard",
    question: "Find the median of two sorted arrays in O(log(min(m,n))) time.",
    context: "Binary search problem",
    constraints: ["Logarithmic time complexity", "Handle arrays of different sizes"],
    examples: [
      { input: "[1,3] and [2]", output: "2", explanation: "Median of [1,2,3] is 2" }
    ]
  },
  {
    id: "coding_hard_3",
    type: "coding",
    difficulty: "hard",
    question: "Implement a trie (prefix tree) with insert, search, and startsWith operations.",
    context: "Tree data structure problem",
    constraints: ["Efficient string operations", "Support prefix matching"],
    examples: [
      { input: "insert('apple'), search('app'), startsWith('app')", output: "false, true", explanation: "Trie operations" }
    ]
  },
  {
    id: "coding_hard_4",
    type: "coding",
    difficulty: "hard",
    question: "Find the minimum window substring that contains all characters of a pattern.",
    context: "Sliding window + hash map problem",
    constraints: ["O(m+n) time complexity", "Handle duplicate characters"],
    examples: [
      { input: "s='ADOBECODEBANC', t='ABC'", output: "BANC", explanation: "Minimum window containing A, B, C" }
    ]
  },
  {
    id: "coding_hard_5",
    type: "coding",
    difficulty: "hard",
    question: "Serialize and deserialize a binary tree.",
    context: "Tree traversal and reconstruction problem",
    constraints: ["Preserve tree structure", "Handle null nodes"],
    examples: [
      { input: "Tree: [1,2,3,null,null,4,5]", output: "1,2,null,null,3,4,null,null,5,null,null", explanation: "Pre-order serialization" }
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
        content: `You are an expert technical interviewer. Generate exactly 100 interview questions based on the provided job description and resume.

CRITICAL REQUIREMENTS:
- Return ONLY a valid JSON array
- No markdown formatting, no explanations, no extra text
- Each question must have: id, type, difficulty, question
- For coding questions add: context, constraints (array), examples (array with input/output/explanation)

DISTRIBUTION:
- 60 technical questions (20 easy, 20 medium, 20 hard)
- 25 behavioral questions (all medium difficulty)
- 15 coding questions (5 easy, 5 medium, 5 hard)

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
    
    if (validQuestions.length < 50) {
      console.warn("⚠️ Too few valid questions generated, using fallback");
      return {
        success: false,
        questions: FALLBACK_QUESTIONS.slice(0, 100),
        error: "AI generated too few valid questions"
      };
    }
    
    return {
      success: true,
      questions: validQuestions.slice(0, 100) // Ensure we don't exceed 100
    };
    
  } catch (error: any) {
    console.error("❌ AI generation failed:", error.message);
    return {
      success: false,
      questions: FALLBACK_QUESTIONS.slice(0, 100),
      error: error.message
    };
  }
}