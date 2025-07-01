import { callDeepSeek, OpenRouterMessage } from "./openrouter";
import { Question } from "@shared/schema";
import { FALLBACK_QUESTIONS } from "./aiQuestionGenerator";

export interface QuestionGenerationResult {
  success: boolean;
  questions: Question[];
  error?: string;
}

function cleanJsonResponse(response: string): string {
  let cleaned = response.replace(/```json\s*/g, '').replace(/```\s*/g, '');
  
  const jsonStart = cleaned.indexOf('[');
  if (jsonStart >= 0) {
    cleaned = cleaned.substring(jsonStart);
  }
  
  let bracketCount = 0;
  let lastValidEnd = -1;
  
  for (let i = 0; i < cleaned.length; i++) {
    if (cleaned[i] === '[') {
      bracketCount++;
    } else if (cleaned[i] === ']') {
      bracketCount--;
      if (bracketCount === 0) {
        lastValidEnd = i;
        break;
      }
    }
  }
  
  if (lastValidEnd > 0) {
    cleaned = cleaned.substring(0, lastValidEnd + 1);
  }
  
  cleaned = cleaned
    .replace(/,\s*]/g, ']')
    .replace(/,\s*}/g, '}')
    .replace(/([^"])\n/g, '$1')
    .replace(/\s+/g, ' ')
    .replace(/,\s*,/g, ',')
    .trim();
  
  return cleaned;
}

function validateQuestions(questions: any[]): Question[] {
  const validQuestions: Question[] = [];
  
  for (const q of questions) {
    if (!q || typeof q !== 'object') continue;
    if (!q.id || !q.type || !q.difficulty || !q.question) continue;
    if (!['technical', 'behavioral', 'coding'].includes(q.type)) continue;
    if (!['easy', 'medium', 'hard'].includes(q.difficulty)) continue;
    
    const validQuestion: Question = {
      id: String(q.id),
      type: q.type as 'technical' | 'behavioral' | 'coding',
      difficulty: q.difficulty as 'easy' | 'medium' | 'hard',
      question: String(q.question)
    };
    
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

async function generateTechnicalQuestions(jobDescription: string, resume: string, jobTitle?: string, companyName?: string): Promise<Question[]> {
  const messages: OpenRouterMessage[] = [
    {
      role: "system",
      content: `Generate exactly 60 technical interview questions. Return ONLY a valid JSON array.

DISTRIBUTION: 20 easy, 20 medium, 20 hard

FORMAT: [{"id":"tech_1","type":"technical","difficulty":"easy","question":"..."}]

Focus on:
- Programming languages and frameworks
- System design concepts
- Database knowledge
- Software engineering principles
- Web technologies
- Development tools and practices`
    },
    {
      role: "user",
      content: `Company: ${companyName || 'Technology Company'}
Job: ${jobTitle || 'Software Engineer'}
Description: ${jobDescription.substring(0, 800)}
Resume: ${resume.substring(0, 400)}

Generate technical questions matching this role and company standards.`
    }
  ];

  try {
    const response = await callDeepSeek(messages);
    const cleaned = cleanJsonResponse(response);
    const parsed = JSON.parse(cleaned);
    return validateQuestions(parsed);
  } catch (error) {
    console.error("Technical questions generation failed:", error);
    return FALLBACK_QUESTIONS.filter(q => q.type === 'technical').slice(0, 60);
  }
}

async function generateBehavioralQuestions(jobDescription: string, resume: string, jobTitle?: string, companyName?: string): Promise<Question[]> {
  const messages: OpenRouterMessage[] = [
    {
      role: "system",
      content: `Generate exactly 25 behavioral interview questions. Return ONLY a valid JSON array.

FORMAT: [{"id":"behavioral_1","type":"behavioral","difficulty":"medium","question":"..."}]

Focus on:
- Leadership and teamwork
- Problem-solving approaches
- Communication skills
- Adaptability and learning
- Project management
- Conflict resolution
- Career motivation`
    },
    {
      role: "user",
      content: `Company: ${companyName || 'Technology Company'}
Job: ${jobTitle || 'Software Engineer'}
Description: ${jobDescription.substring(0, 800)}

Generate behavioral questions for this specific role and company culture.`
    }
  ];

  try {
    const response = await callDeepSeek(messages);
    const cleaned = cleanJsonResponse(response);
    const parsed = JSON.parse(cleaned);
    return validateQuestions(parsed);
  } catch (error) {
    console.error("Behavioral questions generation failed:", error);
    return FALLBACK_QUESTIONS.filter(q => q.type === 'behavioral').slice(0, 25);
  }
}

async function generateCodingQuestions(jobDescription: string, resume: string, jobTitle?: string, companyName?: string): Promise<Question[]> {
  const messages: OpenRouterMessage[] = [
    {
      role: "system",
      content: `Generate exactly 15 coding interview questions. Return ONLY a valid JSON array.

DISTRIBUTION: 5 easy, 5 medium, 5 hard

FORMAT: [{"id":"coding_1","type":"coding","difficulty":"easy","question":"...","context":"...","constraints":["..."],"examples":[{"input":"...","output":"...","explanation":"..."}]}]

Focus on:
- Data structures and algorithms
- Array and string manipulation
- Tree and graph problems
- Dynamic programming
- System design coding
- Real-world problem solving`
    },
    {
      role: "user",
      content: `Company: ${companyName || 'Technology Company'}
Job: ${jobTitle || 'Software Engineer'}
Description: ${jobDescription.substring(0, 600)}

Generate coding questions matching company standards and interview difficulty.`
    }
  ];

  try {
    const response = await callDeepSeek(messages);
    const cleaned = cleanJsonResponse(response);
    const parsed = JSON.parse(cleaned);
    return validateQuestions(parsed);
  } catch (error) {
    console.error("Coding questions generation failed:", error);
    return FALLBACK_QUESTIONS.filter(q => q.type === 'coding').slice(0, 15);
  }
}

export async function generateComprehensiveQuestions(
  jobDescription: string,
  resume: string,
  jobTitle?: string,
  companyName?: string
): Promise<QuestionGenerationResult> {
  
  try {
    console.log("🚀 Starting comprehensive AI question generation...");
    
    // Generate all question types in parallel
    const [technicalQuestions, behavioralQuestions, codingQuestions] = await Promise.all([
      generateTechnicalQuestions(jobDescription, resume, jobTitle, companyName),
      generateBehavioralQuestions(jobDescription, resume, jobTitle, companyName),
      generateCodingQuestions(jobDescription, resume, jobTitle, companyName)
    ]);
    
    const allQuestions = [
      ...technicalQuestions,
      ...behavioralQuestions,
      ...codingQuestions
    ];
    
    console.log(`✅ Generated total: ${allQuestions.length} questions`);
    console.log(`📊 Technical: ${technicalQuestions.length}, Behavioral: ${behavioralQuestions.length}, Coding: ${codingQuestions.length}`);
    
    if (allQuestions.length < 80) {
      console.warn("⚠️ Some AI generation failed, supplementing with fallbacks");
      const needed = 100 - allQuestions.length;
      const fallbackQuestions = FALLBACK_QUESTIONS.slice(0, needed);
      allQuestions.push(...fallbackQuestions);
    }
    
    return {
      success: true,
      questions: allQuestions.slice(0, 100)
    };
    
  } catch (error: any) {
    console.error("❌ Comprehensive generation failed:", error.message);
    return {
      success: false,
      questions: FALLBACK_QUESTIONS.slice(0, 100),
      error: error.message
    };
  }
}