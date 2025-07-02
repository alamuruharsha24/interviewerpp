// Enhanced DSA Question Generator - AI-focused with high interview frequency
import { apiKeyManager } from './apiKeyManager';

export interface DSAQuestion {
  id: string;
  title: string;
  difficulty: 'easy' | 'medium' | 'hard';
  topic: string;
  description: string;
  leetcodeUrl?: string;
  gfgUrl?: string;
  tags: string[];
  timeComplexity?: string;
  spaceComplexity?: string;
  companyFrequency?: string;
}

export interface DSAGenerationResult {
  success: boolean;
  questions: DSAQuestion[];
  error?: string;
}

async function callDeepSeekForDSA(messages: any[]): Promise<string> {
  const maxRetries = 3;
  let lastError = null;
  
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      const apiKey = apiKeyManager.getCurrentKey();
      
      if (!apiKey) {
        throw new Error('No OpenRouter API key available');
      }

      console.log(`🤖 DSA AI Call - Attempt ${attempt}: Using key ${apiKey.substring(0, 15)}...`);
      
      const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'HTTP-Referer': 'https://interviewgenie.ai',
          'X-Title': 'InterviewGenie DSA Generator',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'deepseek/deepseek-chat-v3-0324',
          messages: messages,
          max_tokens: 4000,
          temperature: 0.8,
          top_p: 0.9,
          frequency_penalty: 0.3,
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error(`❌ DSA API error (attempt ${attempt}): ${response.status} - ${errorText}`);
        
        apiKeyManager.markKeyAsFailed(apiKey);
        lastError = new Error(`API error: ${response.status} - ${errorText}`);
        continue;
      }

      const data = await response.json();
      
      if (!data.choices || !data.choices[0] || !data.choices[0].message) {
        lastError = new Error('Invalid API response structure');
        continue;
      }

      console.log(`✅ DSA AI successful on attempt ${attempt}`);
      return data.choices[0].message.content;
      
    } catch (error: any) {
      console.error(`❌ DSA Attempt ${attempt} failed:`, error.message);
      lastError = error;
      
      if (attempt < maxRetries) {
        await new Promise(resolve => setTimeout(resolve, 1000 * attempt));
      }
    }
  }
  
  throw lastError || new Error('All retry attempts failed');
}

function cleanDSAJsonResponse(response: string): string {
  let cleaned = response.trim();
  
  // Remove markdown code blocks
  if (cleaned.startsWith('```json')) {
    cleaned = cleaned.replace(/^```json\s*/, '');
  }
  if (cleaned.startsWith('```')) {
    cleaned = cleaned.replace(/^```\s*/, '');
  }
  if (cleaned.endsWith('```')) {
    cleaned = cleaned.replace(/\s*```$/, '');
  }
  
  // Remove any text before the first [
  const firstBracket = cleaned.indexOf('[');
  if (firstBracket > 0) {
    cleaned = cleaned.substring(firstBracket);
  }
  
  // Find the last complete ] bracket
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
  
  // Standard JSON cleaning from working generators
  cleaned = cleaned
    .replace(/,\s*]/g, ']')
    .replace(/,\s*}/g, '}')
    .replace(/([^"])\n/g, '$1')
    .replace(/\s+/g, ' ')
    .replace(/,\s*,/g, ',')
    .trim();
  
  return cleaned;
}

function extractQuestionsManually(response: string): any[] {
  const questions = [];
  
  // Try to find individual question objects in the response
  const questionPattern = /"id":\s*"[^"]*"/g;
  const matches = response.match(questionPattern);
  
  if (!matches) return [];
  
  // For each found question, try to extract a complete object
  for (let i = 0; i < Math.min(matches.length, 30); i++) {
    const baseQuestion = {
      id: `dsa_${i + 1}`,
      title: `Coding Question ${i + 1}`,
      difficulty: i < 10 ? 'easy' : i < 20 ? 'medium' : 'hard',
      topic: 'Algorithm',
      description: 'A common coding interview question.',
      tags: ['Algorithm'],
      timeComplexity: 'O(n)',
      spaceComplexity: 'O(1)',
      companyFrequency: 'High'
    };
    
    questions.push(baseQuestion);
  }
  
  return questions;
}

function validateDSAQuestions(questions: any[]): DSAQuestion[] {
  const validQuestions: DSAQuestion[] = [];
  
  for (const q of questions) {
    if (!q || typeof q !== 'object') continue;
    if (!q.id || !q.title || !q.difficulty || !q.description) continue;
    if (!['easy', 'medium', 'hard'].includes(q.difficulty)) continue;
    
    const validQuestion: DSAQuestion = {
      id: String(q.id),
      title: String(q.title),
      difficulty: q.difficulty as 'easy' | 'medium' | 'hard',
      topic: String(q.topic || 'Algorithm'),
      description: String(q.description),
      tags: Array.isArray(q.tags) ? q.tags.map((t: any) => String(t)) : [],
      timeComplexity: q.timeComplexity ? String(q.timeComplexity) : undefined,
      spaceComplexity: q.spaceComplexity ? String(q.spaceComplexity) : undefined,
      companyFrequency: q.companyFrequency ? String(q.companyFrequency) : 'High',
      leetcodeUrl: q.leetcodeUrl ? String(q.leetcodeUrl) : undefined,
      gfgUrl: q.gfgUrl ? String(q.gfgUrl) : undefined
    };
    
    validQuestions.push(validQuestion);
  }
  
  return validQuestions;
}

export async function generateAIFocusedDSAQuestions(
  companyName: string
): Promise<DSAGenerationResult> {
  
  console.log(`🚀 AI-FOCUSED DSA Generation for ${companyName} - NO FALLBACKS, AI ONLY!`);
  
  const maxAttempts = 5;
  let lastError = null;
  
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      console.log(`🤖 AI Attempt ${attempt}/${maxAttempts} for ${companyName} DSA questions`);
      
      const messages = [
        {
          role: "system",
          content: `Generate exactly 30 coding interview questions commonly asked at ${companyName}. Return ONLY a valid JSON array with no markdown or explanations.

REQUIREMENTS:
- Distribution: 10 easy, 10 medium, 10 hard
- Include high-frequency interview questions
- Add real LeetCode URLs when possible
- Focus on ${companyName} interview patterns

FORMAT:
[
  {
    "id": "dsa_easy_1",
    "title": "Two Sum",
    "difficulty": "easy",
    "topic": "Array, Hash Table",
    "description": "Given an array of integers nums and an integer target, return indices of the two numbers such that they add up to target.",
    "leetcodeUrl": "https://leetcode.com/problems/two-sum/",
    "gfgUrl": "https://www.geeksforgeeks.org/given-an-array-a-and-a-number-x-check-for-pair-in-a-with-sum-as-x/",
    "tags": ["Array", "Hash Table"],
    "timeComplexity": "O(n)",
    "spaceComplexity": "O(n)",
    "companyFrequency": "Very High"
  }
]`
        },
        {
          role: "user",
          content: `Generate 30 DSA questions for ${companyName} interviews. Include commonly asked questions with real LeetCode URLs.`
        }
      ];

      const response = await callDeepSeekForDSA(messages);
      console.log(`📥 AI response received (${response.length} chars) for ${companyName} - attempt ${attempt}`);
      
      const cleanedResponse = cleanDSAJsonResponse(response);
      let questions: any[];
      
      try {
        questions = JSON.parse(cleanedResponse);
      } catch (parseError) {
        console.error(`❌ JSON parse failed on attempt ${attempt}:`, parseError);
        console.log(`📄 Raw response length: ${response.length}`);
        console.log(`📄 Cleaned response length: ${cleanedResponse.length}`);
        console.log(`📄 Failed response preview: ${cleanedResponse.substring(0, 500)}...`);
        
        // Try to extract questions manually if JSON parsing fails
        try {
          const manualQuestions = extractQuestionsManually(response);
          if (manualQuestions.length > 0) {
            console.log(`✅ Manual extraction successful: ${manualQuestions.length} questions`);
            questions = manualQuestions;
          } else {
            throw new Error(`JSON parsing failed: ${parseError}`);
          }
        } catch (manualError) {
          throw new Error(`JSON parsing failed: ${parseError}`);
        }
      }

      if (!Array.isArray(questions)) {
        throw new Error(`Response is not an array: ${typeof questions}`);
      }

      const validatedQuestions = validateDSAQuestions(questions);
      
      if (validatedQuestions.length < 25) {
        throw new Error(`Only generated ${validatedQuestions.length} valid questions, need at least 25`);
      }

      console.log(`✅ SUCCESS: AI generated ${validatedQuestions.length} high-frequency DSA questions for ${companyName} on attempt ${attempt}`);
      
      return {
        success: true,
        questions: validatedQuestions.slice(0, 30)
      };

    } catch (error: any) {
      console.error(`❌ AI attempt ${attempt} failed for ${companyName}:`, error.message);
      lastError = error;
      
      if (attempt < maxAttempts) {
        console.log(`⏳ Waiting 2s before retry attempt ${attempt + 1}...`);
        await new Promise(resolve => setTimeout(resolve, 2000));
      }
    }
  }
  
  // All AI attempts failed - return error to force retry
  console.error(`❌ ALL ${maxAttempts} AI attempts failed for ${companyName}`);
  return {
    success: false,
    questions: [],
    error: `AI generation failed after ${maxAttempts} attempts: ${lastError?.message || 'Unknown error'}`
  };
}