import OpenAI from "openai";

// the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
const openai = new OpenAI({ 
  apiKey: process.env.OPENAI_API_KEY
});

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
}

export async function generateDSAQuestions(): Promise<DSAQuestion[]> {
  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: `You are an expert in Data Structures and Algorithms. Generate exactly 30 coding questions with varying difficulty levels. 
          Each question should include:
          - A unique title
          - Difficulty (easy/medium/hard) - distribute evenly (10 easy, 10 medium, 10 hard)
          - Topic (arrays, strings, linked lists, trees, graphs, dynamic programming, sorting, searching, etc.)
          - Clear description
          - Relevant tags
          - Time and space complexity hints
          
          For each question, try to match it with real LeetCode or GeeksforGeeks problems when possible.
          
          Make sure to cover these topics:
          - Arrays and Strings (8 questions)
          - Linked Lists (3 questions)
          - Trees and Binary Search Trees (5 questions)
          - Graphs (4 questions)
          - Dynamic Programming (4 questions)
          - Sorting and Searching (3 questions)
          - Stack and Queue (3 questions)
          
          Respond with JSON in this exact format:
          {
            "questions": [
              {
                "id": "1",
                "title": "Two Sum",
                "difficulty": "easy",
                "topic": "Arrays",
                "description": "Given an array of integers nums and an integer target, return indices of the two numbers such that they add up to target.",
                "leetcodeUrl": "https://leetcode.com/problems/two-sum/",
                "gfgUrl": "https://www.geeksforgeeks.org/given-an-array-a-and-a-number-x-check-for-pair-in-a-with-sum-as-x/",
                "tags": ["array", "hash-table"],
                "timeComplexity": "O(n)",
                "spaceComplexity": "O(n)"
              }
            ]
          }`
        }
      ],
      response_format: { type: "json_object" },
      temperature: 0.7
    });

    const result = JSON.parse(response.choices[0].message.content || "{}");
    return result.questions || [];
  } catch (error) {
    console.error("Error generating DSA questions:", error);
    throw error;
  }
}