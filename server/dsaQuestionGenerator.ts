// Import OpenAI client
let openai: any = null;
try {
  const { OpenAI } = require('openai');
  
  // Initialize OpenAI client for server-side
  if (process.env.VITE_OPENROUTER_API_KEY) {
    openai = new OpenAI({
      baseURL: "https://openrouter.ai/api/v1",
      apiKey: process.env.VITE_OPENROUTER_API_KEY,
    });
  }
} catch (error) {
  console.warn("OpenAI not available, using fallback questions");
}

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

// High-quality fallback DSA questions with real LeetCode/GFG links
const FALLBACK_DSA_QUESTIONS: DSAQuestion[] = [
  // Easy Questions (10)
  {
    id: "dsa_easy_1",
    title: "Two Sum",
    difficulty: "easy",
    topic: "Array, Hash Table",
    description: "Given an array of integers nums and an integer target, return indices of the two numbers such that they add up to target.",
    leetcodeUrl: "https://leetcode.com/problems/two-sum/",
    gfgUrl: "https://www.geeksforgeeks.org/given-an-array-a-and-a-number-x-check-for-pair-in-a-with-sum-as-x/",
    tags: ["Array", "Hash Table", "Two Pointers"],
    timeComplexity: "O(n)",
    spaceComplexity: "O(n)",
    companyFrequency: "Very High"
  },
  {
    id: "dsa_easy_2",
    title: "Valid Parentheses",
    difficulty: "easy",
    topic: "Stack, String",
    description: "Given a string s containing just the characters '(', ')', '{', '}', '[' and ']', determine if the input string is valid.",
    leetcodeUrl: "https://leetcode.com/problems/valid-parentheses/",
    gfgUrl: "https://www.geeksforgeeks.org/check-for-balanced-parentheses-in-an-expression/",
    tags: ["Stack", "String"],
    timeComplexity: "O(n)",
    spaceComplexity: "O(n)",
    companyFrequency: "High"
  },
  {
    id: "dsa_easy_3",
    title: "Merge Two Sorted Lists",
    difficulty: "easy",
    topic: "Linked List, Recursion",
    description: "You are given the heads of two sorted linked lists list1 and list2. Merge the two lists in a sorted list.",
    leetcodeUrl: "https://leetcode.com/problems/merge-two-sorted-lists/",
    gfgUrl: "https://www.geeksforgeeks.org/merge-two-sorted-linked-lists/",
    tags: ["Linked List", "Recursion"],
    timeComplexity: "O(n + m)",
    spaceComplexity: "O(1)",
    companyFrequency: "High"
  },
  {
    id: "dsa_easy_4",
    title: "Best Time to Buy and Sell Stock",
    difficulty: "easy",
    topic: "Array, Dynamic Programming",
    description: "You are given an array prices where prices[i] is the price of a given stock on the ith day. Find the maximum profit.",
    leetcodeUrl: "https://leetcode.com/problems/best-time-to-buy-and-sell-stock/",
    gfgUrl: "https://www.geeksforgeeks.org/best-time-to-buy-and-sell-stock/",
    tags: ["Array", "Dynamic Programming"],
    timeComplexity: "O(n)",
    spaceComplexity: "O(1)",
    companyFrequency: "Very High"
  },
  {
    id: "dsa_easy_5",
    title: "Maximum Subarray",
    difficulty: "easy",
    topic: "Array, Dynamic Programming",
    description: "Given an integer array nums, find the contiguous subarray with the largest sum, and return its sum.",
    leetcodeUrl: "https://leetcode.com/problems/maximum-subarray/",
    gfgUrl: "https://www.geeksforgeeks.org/largest-sum-contiguous-subarray/",
    tags: ["Array", "Dynamic Programming", "Kadane's Algorithm"],
    timeComplexity: "O(n)",
    spaceComplexity: "O(1)",
    companyFrequency: "Very High"
  },
  {
    id: "dsa_easy_6",
    title: "Contains Duplicate",
    difficulty: "easy",
    topic: "Array, Hash Table",
    description: "Given an integer array nums, return true if any value appears at least twice in the array.",
    leetcodeUrl: "https://leetcode.com/problems/contains-duplicate/",
    gfgUrl: "https://www.geeksforgeeks.org/find-duplicates-in-on-time-and-constant-extra-space/",
    tags: ["Array", "Hash Table", "Sorting"],
    timeComplexity: "O(n)",
    spaceComplexity: "O(n)",
    companyFrequency: "Medium"
  },
  {
    id: "dsa_easy_7",
    title: "Missing Number",
    difficulty: "easy",
    topic: "Array, Math, Bit Manipulation",
    description: "Given an array nums containing n distinct numbers in the range [0, n], return the only number in the range that is missing.",
    leetcodeUrl: "https://leetcode.com/problems/missing-number/",
    gfgUrl: "https://www.geeksforgeeks.org/find-the-missing-number/",
    tags: ["Array", "Math", "Bit Manipulation"],
    timeComplexity: "O(n)",
    spaceComplexity: "O(1)",
    companyFrequency: "High"
  },
  {
    id: "dsa_easy_8",
    title: "Climbing Stairs",
    difficulty: "easy",
    topic: "Math, Dynamic Programming",
    description: "You are climbing a staircase. It takes n steps to reach the top. Each time you can climb 1 or 2 steps.",
    leetcodeUrl: "https://leetcode.com/problems/climbing-stairs/",
    gfgUrl: "https://www.geeksforgeeks.org/count-ways-reach-nth-stair/",
    tags: ["Math", "Dynamic Programming", "Memoization"],
    timeComplexity: "O(n)",
    spaceComplexity: "O(1)",
    companyFrequency: "High"
  },
  {
    id: "dsa_easy_9",
    title: "Reverse Linked List",
    difficulty: "easy",
    topic: "Linked List, Recursion",
    description: "Given the head of a singly linked list, reverse the list, and return the reversed list.",
    leetcodeUrl: "https://leetcode.com/problems/reverse-linked-list/",
    gfgUrl: "https://www.geeksforgeeks.org/reverse-a-linked-list/",
    tags: ["Linked List", "Recursion"],
    timeComplexity: "O(n)",
    spaceComplexity: "O(1)",
    companyFrequency: "Very High"
  },
  {
    id: "dsa_easy_10",
    title: "Palindrome Number",
    difficulty: "easy",
    topic: "Math",
    description: "Given an integer x, return true if x is palindrome integer.",
    leetcodeUrl: "https://leetcode.com/problems/palindrome-number/",
    gfgUrl: "https://www.geeksforgeeks.org/check-if-a-number-is-palindrome/",
    tags: ["Math"],
    timeComplexity: "O(log n)",
    spaceComplexity: "O(1)",
    companyFrequency: "Medium"
  },

  // Medium Questions (10)
  {
    id: "dsa_medium_1",
    title: "3Sum",
    difficulty: "medium",
    topic: "Array, Two Pointers",
    description: "Given an integer array nums, return all the triplets [nums[i], nums[j], nums[k]] such that i != j, i != k, and j != k, and nums[i] + nums[j] + nums[k] == 0.",
    leetcodeUrl: "https://leetcode.com/problems/3sum/",
    gfgUrl: "https://www.geeksforgeeks.org/find-a-triplet-that-sum-to-a-given-value/",
    tags: ["Array", "Two Pointers", "Sorting"],
    timeComplexity: "O(n²)",
    spaceComplexity: "O(1)",
    companyFrequency: "Very High"
  },
  {
    id: "dsa_medium_2",
    title: "Longest Substring Without Repeating Characters",
    difficulty: "medium",
    topic: "Hash Table, String, Sliding Window",
    description: "Given a string s, find the length of the longest substring without repeating characters.",
    leetcodeUrl: "https://leetcode.com/problems/longest-substring-without-repeating-characters/",
    gfgUrl: "https://www.geeksforgeeks.org/length-of-the-longest-substring-without-repeating-characters/",
    tags: ["Hash Table", "String", "Sliding Window"],
    timeComplexity: "O(n)",
    spaceComplexity: "O(min(m,n))",
    companyFrequency: "Very High"
  },
  {
    id: "dsa_medium_3",
    title: "Container With Most Water",
    difficulty: "medium",
    topic: "Array, Two Pointers",
    description: "You are given an integer array height of length n. Find two lines that together with the x-axis form a container that contains the most water.",
    leetcodeUrl: "https://leetcode.com/problems/container-with-most-water/",
    gfgUrl: "https://www.geeksforgeeks.org/container-with-most-water/",
    tags: ["Array", "Two Pointers", "Greedy"],
    timeComplexity: "O(n)",
    spaceComplexity: "O(1)",
    companyFrequency: "High"
  },
  {
    id: "dsa_medium_4",
    title: "Group Anagrams",
    difficulty: "medium",
    topic: "Array, Hash Table, String",
    description: "Given an array of strings strs, group the anagrams together. You can return the answer in any order.",
    leetcodeUrl: "https://leetcode.com/problems/group-anagrams/",
    gfgUrl: "https://www.geeksforgeeks.org/given-a-sequence-of-words-print-all-anagrams-together/",
    tags: ["Array", "Hash Table", "String", "Sorting"],
    timeComplexity: "O(NK log K)",
    spaceComplexity: "O(NK)",
    companyFrequency: "High"
  },
  {
    id: "dsa_medium_5",
    title: "Product of Array Except Self",
    difficulty: "medium",
    topic: "Array, Prefix Sum",
    description: "Given an integer array nums, return an array answer such that answer[i] is equal to the product of all the elements of nums except nums[i].",
    leetcodeUrl: "https://leetcode.com/problems/product-of-array-except-self/",
    gfgUrl: "https://www.geeksforgeeks.org/a-product-array-puzzle/",
    tags: ["Array", "Prefix Sum"],
    timeComplexity: "O(n)",
    spaceComplexity: "O(1)",
    companyFrequency: "Very High"
  },
  {
    id: "dsa_medium_6",
    title: "Valid Sudoku",
    difficulty: "medium",
    topic: "Array, Hash Table",
    description: "Determine if a 9 x 9 Sudoku board is valid. Only the filled cells need to be validated according to the rules.",
    leetcodeUrl: "https://leetcode.com/problems/valid-sudoku/",
    gfgUrl: "https://www.geeksforgeeks.org/check-if-given-sudoku-board-configuration-is-valid/",
    tags: ["Array", "Hash Table"],
    timeComplexity: "O(1)",
    spaceComplexity: "O(1)",
    companyFrequency: "Medium"
  },
  {
    id: "dsa_medium_7",
    title: "Search in Rotated Sorted Array",
    difficulty: "medium",
    topic: "Array, Binary Search",
    description: "There is an integer array nums sorted in ascending order (with distinct values). Given the array nums after the rotation and an integer target, return the index of target if it is in nums, or -1 if it is not in nums.",
    leetcodeUrl: "https://leetcode.com/problems/search-in-rotated-sorted-array/",
    gfgUrl: "https://www.geeksforgeeks.org/search-an-element-in-a-sorted-and-pivoted-array/",
    tags: ["Array", "Binary Search"],
    timeComplexity: "O(log n)",
    spaceComplexity: "O(1)",
    companyFrequency: "Very High"
  },
  {
    id: "dsa_medium_8",
    title: "Combination Sum",
    difficulty: "medium",
    topic: "Array, Backtracking",
    description: "Given an array of distinct integers candidates and a target integer target, return a list of all unique combinations of candidates where the chosen numbers sum to target.",
    leetcodeUrl: "https://leetcode.com/problems/combination-sum/",
    gfgUrl: "https://www.geeksforgeeks.org/combinational-sum/",
    tags: ["Array", "Backtracking"],
    timeComplexity: "O(N^(T/M))",
    spaceComplexity: "O(T/M)",
    companyFrequency: "High"
  },
  {
    id: "dsa_medium_9",
    title: "Rotate Image",
    difficulty: "medium",
    topic: "Array, Math, Matrix",
    description: "You are given an n x n 2D matrix representing an image, rotate the image by 90 degrees (clockwise).",
    leetcodeUrl: "https://leetcode.com/problems/rotate-image/",
    gfgUrl: "https://www.geeksforgeeks.org/rotate-a-matrix-by-90-degree-in-clockwise-direction-without-using-any-extra-space/",
    tags: ["Array", "Math", "Matrix"],
    timeComplexity: "O(n²)",
    spaceComplexity: "O(1)",
    companyFrequency: "High"
  },
  {
    id: "dsa_medium_10",
    title: "Spiral Matrix",
    difficulty: "medium",
    topic: "Array, Matrix, Simulation",
    description: "Given an m x n matrix, return all elements of the matrix in spiral order.",
    leetcodeUrl: "https://leetcode.com/problems/spiral-matrix/",
    gfgUrl: "https://www.geeksforgeeks.org/print-a-given-matrix-in-spiral-form/",
    tags: ["Array", "Matrix", "Simulation"],
    timeComplexity: "O(mn)",
    spaceComplexity: "O(1)",
    companyFrequency: "High"
  },

  // Hard Questions (10)
  {
    id: "dsa_hard_1",
    title: "Median of Two Sorted Arrays",
    difficulty: "hard",
    topic: "Array, Binary Search, Divide and Conquer",
    description: "Given two sorted arrays nums1 and nums2 of size m and n respectively, return the median of the two sorted arrays.",
    leetcodeUrl: "https://leetcode.com/problems/median-of-two-sorted-arrays/",
    gfgUrl: "https://www.geeksforgeeks.org/median-of-two-sorted-arrays-of-same-size/",
    tags: ["Array", "Binary Search", "Divide and Conquer"],
    timeComplexity: "O(log(min(m,n)))",
    spaceComplexity: "O(1)",
    companyFrequency: "Very High"
  },
  {
    id: "dsa_hard_2",
    title: "Trapping Rain Water",
    difficulty: "hard",
    topic: "Array, Two Pointers, Dynamic Programming",
    description: "Given n non-negative integers representing an elevation map where the width of each bar is 1, compute how much water it can trap after raining.",
    leetcodeUrl: "https://leetcode.com/problems/trapping-rain-water/",
    gfgUrl: "https://www.geeksforgeeks.org/trapping-rain-water/",
    tags: ["Array", "Two Pointers", "Dynamic Programming", "Stack"],
    timeComplexity: "O(n)",
    spaceComplexity: "O(1)",
    companyFrequency: "Very High"
  },
  {
    id: "dsa_hard_3",
    title: "Regular Expression Matching",
    difficulty: "hard",
    topic: "String, Dynamic Programming, Recursion",
    description: "Given an input string s and a pattern p, implement regular expression matching with support for '.' and '*'.",
    leetcodeUrl: "https://leetcode.com/problems/regular-expression-matching/",
    gfgUrl: "https://www.geeksforgeeks.org/wildcard-pattern-matching/",
    tags: ["String", "Dynamic Programming", "Recursion"],
    timeComplexity: "O(mn)",
    spaceComplexity: "O(mn)",
    companyFrequency: "High"
  },
  {
    id: "dsa_hard_4",
    title: "Merge k Sorted Lists",
    difficulty: "hard",
    topic: "Linked List, Divide and Conquer, Heap",
    description: "You are given an array of k linked-lists lists, each linked-list is sorted in ascending order. Merge all the linked-lists into one sorted linked-list and return it.",
    leetcodeUrl: "https://leetcode.com/problems/merge-k-sorted-lists/",
    gfgUrl: "https://www.geeksforgeeks.org/merge-k-sorted-linked-lists/",
    tags: ["Linked List", "Divide and Conquer", "Heap (Priority Queue)", "Merge Sort"],
    timeComplexity: "O(N log k)",
    spaceComplexity: "O(1)",
    companyFrequency: "Very High"
  },
  {
    id: "dsa_hard_5",
    title: "Longest Valid Parentheses",
    difficulty: "hard",
    topic: "String, Dynamic Programming, Stack",
    description: "Given a string containing just the characters '(' and ')', find the length of the longest valid (well-formed) parentheses substring.",
    leetcodeUrl: "https://leetcode.com/problems/longest-valid-parentheses/",
    gfgUrl: "https://www.geeksforgeeks.org/length-of-the-longest-valid-substring/",
    tags: ["String", "Dynamic Programming", "Stack"],
    timeComplexity: "O(n)",
    spaceComplexity: "O(n)",
    companyFrequency: "High"
  },
  {
    id: "dsa_hard_6",
    title: "Minimum Window Substring",
    difficulty: "hard",
    topic: "Hash Table, String, Sliding Window",
    description: "Given two strings s and t of lengths m and n respectively, return the minimum window substring of s such that every character in t (including duplicates) is included in the window.",
    leetcodeUrl: "https://leetcode.com/problems/minimum-window-substring/",
    gfgUrl: "https://www.geeksforgeeks.org/find-the-smallest-window-in-a-string-containing-all-characters-of-another-string/",
    tags: ["Hash Table", "String", "Sliding Window"],
    timeComplexity: "O(|s| + |t|)",
    spaceComplexity: "O(|s| + |t|)",
    companyFrequency: "Very High"
  },
  {
    id: "dsa_hard_7",
    title: "Edit Distance",
    difficulty: "hard",
    topic: "String, Dynamic Programming",
    description: "Given two strings word1 and word2, return the minimum number of operations required to convert word1 to word2.",
    leetcodeUrl: "https://leetcode.com/problems/edit-distance/",
    gfgUrl: "https://www.geeksforgeeks.org/edit-distance-dp-5/",
    tags: ["String", "Dynamic Programming"],
    timeComplexity: "O(mn)",
    spaceComplexity: "O(mn)",
    companyFrequency: "High"
  },
  {
    id: "dsa_hard_8",
    title: "Sliding Window Maximum",
    difficulty: "hard",
    topic: "Array, Queue, Sliding Window, Heap",
    description: "You are given an array of integers nums, there is a sliding window of size k which is moving from the very left of the array to the very right.",
    leetcodeUrl: "https://leetcode.com/problems/sliding-window-maximum/",
    gfgUrl: "https://www.geeksforgeeks.org/sliding-window-maximum-maximum-of-all-subarrays-of-size-k/",
    tags: ["Array", "Queue", "Sliding Window", "Heap (Priority Queue)", "Monotonic Queue"],
    timeComplexity: "O(n)",
    spaceComplexity: "O(k)",
    companyFrequency: "High"
  },
  {
    id: "dsa_hard_9",
    title: "Word Ladder",
    difficulty: "hard",
    topic: "Hash Table, String, BFS",
    description: "A transformation sequence from word beginWord to word endWord using a dictionary wordList is a sequence of words beginWord -> s1 -> s2 -> ... -> sk such that every adjacent pair of words differs by a single letter.",
    leetcodeUrl: "https://leetcode.com/problems/word-ladder/",
    gfgUrl: "https://www.geeksforgeeks.org/word-ladder-length-of-shortest-chain-to-reach-a-target-word/",
    tags: ["Hash Table", "String", "Breadth-First Search"],
    timeComplexity: "O(M² × N)",
    spaceComplexity: "O(M² × N)",
    companyFrequency: "High"
  },
  {
    id: "dsa_hard_10",
    title: "Serialize and Deserialize Binary Tree",
    difficulty: "hard",
    topic: "String, Tree, DFS, BFS, Design",
    description: "Serialization is the process of converting a data structure or object into a sequence of bits so that it can be stored in a file or memory buffer.",
    leetcodeUrl: "https://leetcode.com/problems/serialize-and-deserialize-binary-tree/",
    gfgUrl: "https://www.geeksforgeeks.org/serialize-deserialize-binary-tree/",
    tags: ["String", "Tree", "Depth-First Search", "Breadth-First Search", "Design", "Binary Tree"],
    timeComplexity: "O(n)",
    spaceComplexity: "O(n)",
    companyFrequency: "Very High"
  }
];

async function callDeepSeek(messages: any[]): Promise<string> {
  if (!openai) {
    throw new Error("OpenAI client not initialized");
  }

  const completion = await openai.chat.completions.create({
    model: "deepseek/deepseek-chat",
    messages: messages,
    max_tokens: 4000,
    temperature: 0.7,
  });

  return completion.choices[0].message.content;
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
      companyFrequency: q.companyFrequency ? String(q.companyFrequency) : undefined,
      leetcodeUrl: q.leetcodeUrl ? String(q.leetcodeUrl) : undefined,
      gfgUrl: q.gfgUrl ? String(q.gfgUrl) : undefined
    };
    
    validQuestions.push(validQuestion);
  }
  
  return validQuestions;
}

export async function generateCompanySpecificDSAQuestions(
  companyName: string
): Promise<DSAGenerationResult> {
  
  try {
    if (!openai) {
      console.log("No API key found, returning fallback questions");
      return {
        success: false,
        questions: FALLBACK_DSA_QUESTIONS.slice(0, 30),
        error: "OpenAI client not available"
      };
    }

    console.log(`🚀 Generating DSA questions for ${companyName}...`);
    
    const messages = [
      {
        role: "system",
        content: `You are an expert DSA interviewer. Generate exactly 30 coding interview questions commonly asked at ${companyName}.

CRITICAL REQUIREMENTS:
- Return ONLY a valid JSON array
- No markdown formatting, no explanations, no extra text
- DISTRIBUTION: 10 easy, 10 medium, 10 hard
- Include real LeetCode and GeeksforGeeks URLs when possible
- Focus on ${companyName}'s interview patterns and difficulty levels

REQUIRED FORMAT:
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
]

Focus on problems that ${companyName} frequently asks in their coding rounds.`
      },
      {
        role: "user",
        content: `Generate 30 DSA coding questions specifically for ${companyName} interviews. 

Include questions from these categories based on ${companyName}'s interview patterns:
- Arrays and Strings
- Linked Lists
- Trees and Graphs
- Dynamic Programming
- System Design Coding
- Hash Tables and Maps
- Stack and Queue
- Binary Search
- Two Pointers
- Backtracking

Make sure to include real LeetCode and GeeksforGeeks problem URLs that are commonly asked at ${companyName}.`
      }
    ];

    console.log("📡 Calling AI API for DSA questions...");
    const aiResponse = await callDeepSeek(messages);
    console.log("✅ AI response received, length:", aiResponse.length);
    
    const cleanedResponse = cleanJsonResponse(aiResponse);
    console.log("🧹 Cleaned response length:", cleanedResponse.length);
    
    let parsedQuestions: any[];
    try {
      parsedQuestions = JSON.parse(cleanedResponse);
    } catch (parseError) {
      console.error("❌ JSON parse error:", parseError);
      throw new Error("Invalid JSON response from AI");
    }
    
    if (!Array.isArray(parsedQuestions)) {
      throw new Error("AI response is not an array");
    }
    
    const validQuestions = validateDSAQuestions(parsedQuestions);
    console.log(`✅ Generated ${validQuestions.length} valid DSA questions for ${companyName}`);
    
    if (validQuestions.length < 15) {
      console.warn("⚠️ Too few valid questions generated, supplementing with fallbacks");
      const needed = 30 - validQuestions.length;
      const fallbackQuestions = FALLBACK_DSA_QUESTIONS.slice(0, needed);
      validQuestions.push(...fallbackQuestions);
    }
    
    return {
      success: true,
      questions: validQuestions.slice(0, 30)
    };
    
  } catch (error: any) {
    console.error("❌ DSA generation failed:", error.message);
    return {
      success: false,
      questions: FALLBACK_DSA_QUESTIONS.slice(0, 30),
      error: error.message
    };
  }
}