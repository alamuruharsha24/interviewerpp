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
  
  // Find the JSON array boundaries
  const startIndex = cleaned.indexOf('[');
  let lastIndex = cleaned.lastIndexOf(']');
  
  if (startIndex !== -1 && lastIndex !== -1 && lastIndex > startIndex) {
    cleaned = cleaned.substring(startIndex, lastIndex + 1);
  }
  
  // Enhanced JSON cleaning - fix common issues
  cleaned = cleaned
    .replace(/,\s*]/g, ']')
    .replace(/,\s*}/g, '}')
    .replace(/([^"])\n/g, '$1')
    .replace(/\s+/g, ' ')
    .replace(/,\s*,/g, ',')
    .replace(/([^\\])"/g, '$1"') // Fix unescaped quotes
    .replace(/:\s*([^",\[\]{}]+)\s*([,}\]])/g, ': "$1"$2') // Quote unquoted values
    .replace(/:\s*"([^"]*)"([,}\]])/g, ': "$1"$2') // Ensure consistent quoting
    .trim();
  
  // Try to fix incomplete JSON by ensuring proper bracket balance
  let bracketCount = 0;
  let validJson = '';
  
  for (let i = 0; i < cleaned.length; i++) {
    const char = cleaned[i];
    validJson += char;
    
    if (char === '[' || char === '{') {
      bracketCount++;
    } else if (char === ']' || char === '}') {
      bracketCount--;
      if (bracketCount === 0 && char === ']') {
        break; // Found complete array
      }
    }
  }
  
  return validJson;
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
          content: `You are a senior ${companyName} coding interviewer with 10+ years experience. Generate exactly 30 of the MOST COMMONLY ASKED DSA questions in real ${companyName} technical interviews.

CRITICAL REQUIREMENTS:
- Return ONLY a valid JSON array (no markdown, no explanations)
- Focus EXCLUSIVELY on HIGH-FREQUENCY questions (asked in 80%+ of interviews)
- EXACT DISTRIBUTION: 10 easy, 10 medium, 10 hard
- Include REAL LeetCode URLs for popular problems
- Questions must reflect actual ${companyName} interview patterns

MUST INCLUDE THESE CLASSIC HIGH-FREQUENCY PROBLEMS:
1. Two Sum - The most asked coding question (95% frequency)
2. Reverse Linked List - Core data structure question
3. Valid Parentheses - Stack fundamentals  
4. Maximum Subarray (Kadane's) - DP classic
5. Binary Tree Inorder Traversal - Tree basics
6. Merge Two Sorted Lists - Linked list manipulation
7. First Bad Version - Binary search template
8. Climbing Stairs - DP introduction
9. Best Time to Buy/Sell Stock - Array optimization
10. Contains Duplicate - Hash table basics

JSON RESPONSE FORMAT (return exactly this structure):
[
  {
    "id": "dsa_easy_1",
    "title": "Two Sum",
    "difficulty": "easy", 
    "topic": "Arrays, Hash Table",
    "description": "Given an array of integers nums and an integer target, return indices of the two numbers such that they add up to target. You may assume that each input would have exactly one solution.",
    "leetcodeUrl": "https://leetcode.com/problems/two-sum/",
    "gfgUrl": "https://www.geeksforgeeks.org/given-an-array-a-and-a-number-x-check-for-pair-in-a-with-sum-as-x/",
    "tags": ["Array", "Hash Table", "Two Pointers"],
    "timeComplexity": "O(n)",
    "spaceComplexity": "O(n)",
    "companyFrequency": "Very High"
  }
]`
        },
        {
          role: "user",
          content: `Generate the 30 most commonly asked DSA questions in ${companyName} interviews. Include only questions with 90%+ interview frequency. Focus on the classic problems every ${companyName} candidate encounters. Provide real LeetCode URLs where available.`
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
        console.log(`📄 Failed response preview: ${cleanedResponse.substring(0, 300)}...`);
        throw new Error(`JSON parsing failed: ${parseError}`);
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