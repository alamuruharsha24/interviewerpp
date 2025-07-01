import OpenAI from "openai";

// OpenRouter API configuration for DeepSeek model
let openai: OpenAI | null = null;

// Only initialize OpenAI if API key is available
if (process.env.OPENAI_API_KEY) {
  openai = new OpenAI({ 
    apiKey: process.env.OPENAI_API_KEY,
    baseURL: "https://openrouter.ai/api/v1",
    defaultHeaders: {
      "HTTP-Referer": "https://interviewgenie.replit.app",
      "X-Title": "InterviewGenie"
    }
  });
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
}

// Fallback DSA questions when OpenAI API is not available
const fallbackDSAQuestions: DSAQuestion[] = [
  {
    id: "1",
    title: "Two Sum",
    difficulty: "easy",
    topic: "Arrays",
    description: "Given an array of integers nums and an integer target, return indices of the two numbers such that they add up to target.",
    leetcodeUrl: "https://leetcode.com/problems/two-sum/",
    gfgUrl: "https://www.geeksforgeeks.org/given-an-array-a-and-a-number-x-check-for-pair-in-a-with-sum-as-x/",
    tags: ["array", "hash-table"],
    timeComplexity: "O(n)",
    spaceComplexity: "O(n)"
  },
  {
    id: "2",
    title: "Valid Parentheses",
    difficulty: "easy",
    topic: "Stack",
    description: "Given a string s containing just the characters '(', ')', '{', '}', '[' and ']', determine if the input string is valid.",
    leetcodeUrl: "https://leetcode.com/problems/valid-parentheses/",
    gfgUrl: "https://www.geeksforgeeks.org/check-for-balanced-parentheses-in-an-expression/",
    tags: ["string", "stack"],
    timeComplexity: "O(n)",
    spaceComplexity: "O(n)"
  },
  {
    id: "3",
    title: "Merge Two Sorted Lists",
    difficulty: "easy",
    topic: "Linked Lists",
    description: "You are given the heads of two sorted linked lists list1 and list2. Merge the two lists in a one sorted list.",
    leetcodeUrl: "https://leetcode.com/problems/merge-two-sorted-lists/",
    gfgUrl: "https://www.geeksforgeeks.org/merge-two-sorted-linked-lists/",
    tags: ["linked-list", "recursion"],
    timeComplexity: "O(n + m)",
    spaceComplexity: "O(1)"
  },
  {
    id: "4",
    title: "Best Time to Buy and Sell Stock",
    difficulty: "easy",
    topic: "Arrays",
    description: "You are given an array prices where prices[i] is the price of a given stock on the ith day. Find the maximum profit.",
    leetcodeUrl: "https://leetcode.com/problems/best-time-to-buy-and-sell-stock/",
    gfgUrl: "https://www.geeksforgeeks.org/best-time-to-buy-and-sell-stock/",
    tags: ["array", "dynamic-programming"],
    timeComplexity: "O(n)",
    spaceComplexity: "O(1)"
  },
  {
    id: "5",
    title: "Maximum Subarray",
    difficulty: "easy",
    topic: "Arrays",
    description: "Given an integer array nums, find the contiguous subarray which has the largest sum and return its sum.",
    leetcodeUrl: "https://leetcode.com/problems/maximum-subarray/",
    gfgUrl: "https://www.geeksforgeeks.org/largest-sum-contiguous-subarray/",
    tags: ["array", "divide-and-conquer", "dynamic-programming"],
    timeComplexity: "O(n)",
    spaceComplexity: "O(1)"
  },
  {
    id: "6",
    title: "Contains Duplicate",
    difficulty: "easy",
    topic: "Arrays",
    description: "Given an integer array nums, return true if any value appears at least twice in the array.",
    leetcodeUrl: "https://leetcode.com/problems/contains-duplicate/",
    gfgUrl: "https://www.geeksforgeeks.org/find-duplicates-in-on-time-and-constant-extra-space/",
    tags: ["array", "hash-table", "sorting"],
    timeComplexity: "O(n)",
    spaceComplexity: "O(n)"
  },
  {
    id: "7",
    title: "Product of Array Except Self",
    difficulty: "medium",
    topic: "Arrays",
    description: "Given an integer array nums, return an array answer such that answer[i] is equal to the product of all the elements of nums except nums[i].",
    leetcodeUrl: "https://leetcode.com/problems/product-of-array-except-self/",
    gfgUrl: "https://www.geeksforgeeks.org/a-product-array-puzzle/",
    tags: ["array", "prefix-sum"],
    timeComplexity: "O(n)",
    spaceComplexity: "O(1)"
  },
  {
    id: "8",
    title: "3Sum",
    difficulty: "medium",
    topic: "Arrays",
    description: "Given an integer array nums, return all the triplets [nums[i], nums[j], nums[k]] such that i != j, i != k, and j != k, and nums[i] + nums[j] + nums[k] == 0.",
    leetcodeUrl: "https://leetcode.com/problems/3sum/",
    gfgUrl: "https://www.geeksforgeeks.org/find-a-triplet-that-sum-to-a-given-value/",
    tags: ["array", "two-pointers", "sorting"],
    timeComplexity: "O(n²)",
    spaceComplexity: "O(1)"
  },
  {
    id: "9",
    title: "Container With Most Water",
    difficulty: "medium",
    topic: "Arrays",
    description: "You are given an integer array height of length n. Find two lines that together with the x-axis form a container that contains the most water.",
    leetcodeUrl: "https://leetcode.com/problems/container-with-most-water/",
    gfgUrl: "https://www.geeksforgeeks.org/container-with-most-water/",
    tags: ["array", "two-pointers", "greedy"],
    timeComplexity: "O(n)",
    spaceComplexity: "O(1)"
  },
  {
    id: "10",
    title: "Longest Substring Without Repeating Characters",
    difficulty: "medium",
    topic: "Strings",
    description: "Given a string s, find the length of the longest substring without repeating characters.",
    leetcodeUrl: "https://leetcode.com/problems/longest-substring-without-repeating-characters/",
    gfgUrl: "https://www.geeksforgeeks.org/length-of-the-longest-substring-without-repeating-characters/",
    tags: ["hash-table", "string", "sliding-window"],
    timeComplexity: "O(n)",
    spaceComplexity: "O(min(m,n))"
  },
  {
    id: "11",
    title: "Linked List Cycle",
    difficulty: "easy",
    topic: "Linked Lists",
    description: "Given head, the head of a linked list, determine if the linked list has a cycle in it.",
    leetcodeUrl: "https://leetcode.com/problems/linked-list-cycle/",
    gfgUrl: "https://www.geeksforgeeks.org/detect-loop-in-a-linked-list/",
    tags: ["hash-table", "linked-list", "two-pointers"],
    timeComplexity: "O(n)",
    spaceComplexity: "O(1)"
  },
  {
    id: "12",
    title: "Remove Nth Node From End of List",
    difficulty: "medium",
    topic: "Linked Lists",
    description: "Given the head of a linked list, remove the nth node from the end of the list and return its head.",
    leetcodeUrl: "https://leetcode.com/problems/remove-nth-node-from-end-of-list/",
    gfgUrl: "https://www.geeksforgeeks.org/remove-nth-node-from-end-of-the-linked-list/",
    tags: ["linked-list", "two-pointers"],
    timeComplexity: "O(L)",
    spaceComplexity: "O(1)"
  },
  {
    id: "13",
    title: "Invert Binary Tree",
    difficulty: "easy",
    topic: "Trees",
    description: "Given the root of a binary tree, invert the tree, and return its root.",
    leetcodeUrl: "https://leetcode.com/problems/invert-binary-tree/",
    gfgUrl: "https://www.geeksforgeeks.org/write-an-efficient-c-function-to-convert-a-tree-into-its-mirror-tree/",
    tags: ["tree", "depth-first-search", "breadth-first-search", "binary-tree"],
    timeComplexity: "O(n)",
    spaceComplexity: "O(n)"
  },
  {
    id: "14",
    title: "Maximum Depth of Binary Tree",
    difficulty: "easy",
    topic: "Trees",
    description: "Given the root of a binary tree, return its maximum depth.",
    leetcodeUrl: "https://leetcode.com/problems/maximum-depth-of-binary-tree/",
    gfgUrl: "https://www.geeksforgeeks.org/write-a-c-program-to-find-the-maximum-depth-or-height-of-a-tree/",
    tags: ["tree", "depth-first-search", "breadth-first-search", "binary-tree"],
    timeComplexity: "O(n)",
    spaceComplexity: "O(n)"
  },
  {
    id: "15",
    title: "Same Tree",
    difficulty: "easy",
    topic: "Trees",
    description: "Given the roots of two binary trees p and q, write a function to check if they are the same or not.",
    leetcodeUrl: "https://leetcode.com/problems/same-tree/",
    gfgUrl: "https://www.geeksforgeeks.org/write-c-code-to-determine-if-two-trees-are-identical/",
    tags: ["tree", "depth-first-search", "binary-tree"],
    timeComplexity: "O(n)",
    spaceComplexity: "O(n)"
  },
  {
    id: "16",
    title: "Validate Binary Search Tree",
    difficulty: "medium",
    topic: "Trees",
    description: "Given the root of a binary tree, determine if it is a valid binary search tree (BST).",
    leetcodeUrl: "https://leetcode.com/problems/validate-binary-search-tree/",
    gfgUrl: "https://www.geeksforgeeks.org/a-program-to-check-if-a-binary-tree-is-bst-or-not/",
    tags: ["tree", "depth-first-search", "binary-search-tree", "binary-tree"],
    timeComplexity: "O(n)",
    spaceComplexity: "O(n)"
  },
  {
    id: "17",
    title: "Binary Tree Level Order Traversal",
    difficulty: "medium",
    topic: "Trees",
    description: "Given the root of a binary tree, return the level order traversal of its nodes' values.",
    leetcodeUrl: "https://leetcode.com/problems/binary-tree-level-order-traversal/",
    gfgUrl: "https://www.geeksforgeeks.org/level-order-tree-traversal/",
    tags: ["tree", "breadth-first-search", "binary-tree"],
    timeComplexity: "O(n)",
    spaceComplexity: "O(n)"
  },
  {
    id: "18",
    title: "Number of Islands",
    difficulty: "medium",
    topic: "Graphs",
    description: "Given an m x n 2D binary grid grid which represents a map of '1's (land) and '0's (water), return the number of islands.",
    leetcodeUrl: "https://leetcode.com/problems/number-of-islands/",
    gfgUrl: "https://www.geeksforgeeks.org/find-number-of-islands/",
    tags: ["array", "depth-first-search", "breadth-first-search", "union-find", "matrix"],
    timeComplexity: "O(M × N)",
    spaceComplexity: "O(M × N)"
  },
  {
    id: "19",
    title: "Clone Graph",
    difficulty: "medium",
    topic: "Graphs",
    description: "Given a reference of a node in a connected undirected graph, return a deep copy (clone) of the graph.",
    leetcodeUrl: "https://leetcode.com/problems/clone-graph/",
    gfgUrl: "https://www.geeksforgeeks.org/clone-an-undirected-graph/",
    tags: ["hash-table", "depth-first-search", "breadth-first-search", "graph"],
    timeComplexity: "O(N + M)",
    spaceComplexity: "O(N)"
  },
  {
    id: "20",
    title: "Course Schedule",
    difficulty: "medium",
    topic: "Graphs",
    description: "There are a total of numCourses courses you have to take, labeled from 0 to numCourses - 1. Given the array prerequisites, return true if you can finish all courses.",
    leetcodeUrl: "https://leetcode.com/problems/course-schedule/",
    gfgUrl: "https://www.geeksforgeeks.org/detect-cycle-in-a-graph/",
    tags: ["depth-first-search", "breadth-first-search", "graph", "topological-sort"],
    timeComplexity: "O(V + E)",
    spaceComplexity: "O(V + E)"
  },
  {
    id: "21",
    title: "Pacific Atlantic Water Flow",
    difficulty: "medium",
    topic: "Graphs",
    description: "Given an m x n rectangular island heights matrix, return a list of grid coordinates where water can flow to both the Pacific and Atlantic oceans.",
    leetcodeUrl: "https://leetcode.com/problems/pacific-atlantic-water-flow/",
    gfgUrl: "https://www.geeksforgeeks.org/water-flow-problem/",
    tags: ["array", "depth-first-search", "breadth-first-search", "matrix"],
    timeComplexity: "O(m × n)",
    spaceComplexity: "O(m × n)"
  },
  {
    id: "22",
    title: "Climbing Stairs",
    difficulty: "easy",
    topic: "Dynamic Programming",
    description: "You are climbing a staircase. It takes n steps to reach the top. Each time you can either climb 1 or 2 steps. In how many distinct ways can you climb to the top?",
    leetcodeUrl: "https://leetcode.com/problems/climbing-stairs/",
    gfgUrl: "https://www.geeksforgeeks.org/count-ways-reach-nth-stair/",
    tags: ["math", "dynamic-programming", "memoization"],
    timeComplexity: "O(n)",
    spaceComplexity: "O(1)"
  },
  {
    id: "23",
    title: "Coin Change",
    difficulty: "medium",
    topic: "Dynamic Programming",
    description: "You are given an integer array coins representing coins of different denominations and an integer amount. Return the fewest number of coins needed to make up that amount.",
    leetcodeUrl: "https://leetcode.com/problems/coin-change/",
    gfgUrl: "https://www.geeksforgeeks.org/coin-change-dp-7/",
    tags: ["array", "dynamic-programming", "breadth-first-search"],
    timeComplexity: "O(S × n)",
    spaceComplexity: "O(S)"
  },
  {
    id: "24",
    title: "Longest Increasing Subsequence",
    difficulty: "medium",
    topic: "Dynamic Programming",
    description: "Given an integer array nums, return the length of the longest strictly increasing subsequence.",
    leetcodeUrl: "https://leetcode.com/problems/longest-increasing-subsequence/",
    gfgUrl: "https://www.geeksforgeeks.org/longest-increasing-subsequence-dp-3/",
    tags: ["array", "binary-search", "dynamic-programming"],
    timeComplexity: "O(n log n)",
    spaceComplexity: "O(n)"
  },
  {
    id: "25",
    title: "Word Break",
    difficulty: "medium",
    topic: "Dynamic Programming",
    description: "Given a string s and a dictionary of strings wordDict, return true if s can be segmented into a space-separated sequence of one or more dictionary words.",
    leetcodeUrl: "https://leetcode.com/problems/word-break/",
    gfgUrl: "https://www.geeksforgeeks.org/word-break-problem-dp-32/",
    tags: ["hash-table", "string", "dynamic-programming", "trie", "memoization"],
    timeComplexity: "O(n³)",
    spaceComplexity: "O(n)"
  },
  {
    id: "26",
    title: "Merge Sort",
    difficulty: "medium",
    topic: "Sorting",
    description: "Implement merge sort algorithm to sort an array of integers in ascending order.",
    leetcodeUrl: "https://leetcode.com/problems/sort-an-array/",
    gfgUrl: "https://www.geeksforgeeks.org/merge-sort/",
    tags: ["array", "divide-and-conquer", "sorting"],
    timeComplexity: "O(n log n)",
    spaceComplexity: "O(n)"
  },
  {
    id: "27",
    title: "Binary Search",
    difficulty: "easy",
    topic: "Searching",
    description: "Given an array of integers nums which is sorted in ascending order, and an integer target, write a function to search target in nums.",
    leetcodeUrl: "https://leetcode.com/problems/binary-search/",
    gfgUrl: "https://www.geeksforgeeks.org/binary-search/",
    tags: ["array", "binary-search"],
    timeComplexity: "O(log n)",
    spaceComplexity: "O(1)"
  },
  {
    id: "28",
    title: "Search in Rotated Sorted Array",
    difficulty: "medium",
    topic: "Searching",
    description: "Given the array nums after the possible rotation and an integer target, return the index of target if it is in nums, or -1 if it is not in nums.",
    leetcodeUrl: "https://leetcode.com/problems/search-in-rotated-sorted-array/",
    gfgUrl: "https://www.geeksforgeeks.org/search-an-element-in-a-sorted-and-pivoted-array/",
    tags: ["array", "binary-search"],
    timeComplexity: "O(log n)",
    spaceComplexity: "O(1)"
  },
  {
    id: "29",
    title: "Min Stack",
    difficulty: "medium",
    topic: "Stack",
    description: "Design a stack that supports push, pop, top, and retrieving the minimum element in constant time.",
    leetcodeUrl: "https://leetcode.com/problems/min-stack/",
    gfgUrl: "https://www.geeksforgeeks.org/design-a-stack-that-supports-getmin-in-o1-time-and-o1-extra-space/",
    tags: ["stack", "design"],
    timeComplexity: "O(1)",
    spaceComplexity: "O(n)"
  },
  {
    id: "30",
    title: "Implement Queue using Stacks",
    difficulty: "easy",
    topic: "Queue",
    description: "Implement a first in first out (FIFO) queue using only two stacks.",
    leetcodeUrl: "https://leetcode.com/problems/implement-queue-using-stacks/",
    gfgUrl: "https://www.geeksforgeeks.org/queue-using-stacks/",
    tags: ["stack", "design", "queue"],
    timeComplexity: "O(1) amortized",
    spaceComplexity: "O(n)"
  },
  {
    id: "31",
    title: "Trapping Rain Water",
    difficulty: "hard",
    topic: "Arrays",
    description: "Given n non-negative integers representing an elevation map where the width of each bar is 1, compute how much water it can trap after raining.",
    leetcodeUrl: "https://leetcode.com/problems/trapping-rain-water/",
    gfgUrl: "https://www.geeksforgeeks.org/trapping-rain-water/",
    tags: ["array", "two-pointers", "dynamic-programming", "stack", "monotonic-stack"],
    timeComplexity: "O(n)",
    spaceComplexity: "O(1)"
  },
  {
    id: "32",
    title: "Median of Two Sorted Arrays",
    difficulty: "hard",
    topic: "Arrays",
    description: "Given two sorted arrays nums1 and nums2 of size m and n respectively, return the median of the two sorted arrays.",
    leetcodeUrl: "https://leetcode.com/problems/median-of-two-sorted-arrays/",
    gfgUrl: "https://www.geeksforgeeks.org/median-of-two-sorted-arrays/",
    tags: ["array", "binary-search", "divide-and-conquer"],
    timeComplexity: "O(log(m+n))",
    spaceComplexity: "O(1)"
  }
];

export async function generateDSAQuestions(): Promise<DSAQuestion[]> {
  // Check if OpenAI API key exists and is valid
  if (!process.env.OPENAI_API_KEY || !openai) {
    console.log("No API key found, returning fallback questions");
    return fallbackDSAQuestions;
  }

  try {
    // TypeScript null check - this should never be null at this point due to the check above
    if (!openai) {
      console.log("OpenAI client is null, returning fallback questions");
      return fallbackDSAQuestions;
    }

    const response = await openai.chat.completions.create({
      model: "deepseek/deepseek-chat-v3-0324:free",
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
      temperature: 0.7
    });

    const result = JSON.parse(response.choices[0].message.content || "{}");
    return result.questions || fallbackDSAQuestions;
  } catch (error) {
    console.error("Error generating DSA questions:", error);
    console.log("Falling back to pre-defined questions");
    return fallbackDSAQuestions;
  }
}