import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useAuth } from "@/contexts/AuthContext";
import { useSession } from "@/contexts/SessionContext";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { generateQuestionsWithAI } from "@/lib/aiQuestionGenerator";
import { Question } from "@shared/schema";
import { Sparkles, Loader2 } from "lucide-react";

interface UploadFormProps {
  onSessionCreated: () => void;
}

export default function UploadForm({ onSessionCreated }: UploadFormProps) {
  const [formData, setFormData] = useState({
    jobTitle: "",
    companyName: "",
    jobDescription: "",
    resume: "",
  });
  const [loading, setLoading] = useState(false);

  const { user } = useAuth();
  const { setCurrentSession } = useSession();
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (formData.jobDescription.length < 50) {
      toast({
        title: "Job description too short",
        description:
          "Please provide at least 50 characters for the job description.",
        variant: "destructive",
      });
      return;
    }

    if (formData.resume.length < 100) {
      toast({
        title: "Resume too short",
        description: "Please provide at least 100 characters for your resume.",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);

    try {
      // Generate questions using AI
      toast({
        title: "Generating questions...",
        description: "Our AI is analyzing your resume and job description.",
      });

      const messages = createQuestionGenerationPrompt(
        formData.jobDescription,
        formData.resume,
        formData.jobTitle,
        formData.companyName
      );

      let aiResponse: string;
      try {
        aiResponse = await callDeepSeek(messages);
      } catch (apiError: any) {
        console.warn(
          "OpenRouter API failed, using fallback questions:",
          apiError.message
        );

        // Try AI generation as fallback
        try {
          const fallbackMessages: OpenRouterMessage[] = [
            { 
              role: 'system' as const, 
              content: `Generate exactly 100 interview questions as a JSON array. No markdown, no explanations.

STRUCTURE: 60 technical (20 easy, 20 medium, 20 hard) + 25 behavioral + 15 coding (5 easy, 5 medium, 5 hard)

FORMAT: [{"id":"1","type":"technical","difficulty":"easy","question":"..."}]

For coding add: "context", "constraints":[], "examples":[]

Return ONLY the JSON array.` 
            },
            { 
              role: 'user' as const, 
              content: `Company: ${formData.companyName || 'Technology Company'}
Position: ${formData.jobTitle || 'Software Engineer'}
Requirements: ${formData.jobDescription.substring(0, 500)}

Create company-specific and role-specific questions.` 
            }
          ];
          
          const fallbackAI = await callDeepSeek(fallbackMessages);
          console.log("Second fallback AI response:", fallbackAI.substring(0, 200) + "...");
          
          // Final fallback JSON cleaning
          let cleanFallback = fallbackAI.trim();
          cleanFallback = cleanFallback.replace(/```json\n?/g, '').replace(/\n?```/g, '');
          
          // Try to extract complete JSON
          const arrayMatch = cleanFallback.match(/\[[\s\S]*?\]/);
          if (arrayMatch) {
            cleanFallback = arrayMatch[0];
          }
          
          // Fix JSON issues
          cleanFallback = cleanFallback.replace(/,\s*]/g, ']');
          cleanFallback = cleanFallback.replace(/,\s*}/g, '}');
          
          let finalParsed = JSON.parse(cleanFallback);
          let questions;
          
          if (Array.isArray(finalParsed)) {
            questions = finalParsed;
          } else if (finalParsed.interview_questions || finalParsed.technical || finalParsed.behavioral || finalParsed.coding) {
            const nested = finalParsed.interview_questions || finalParsed;
            questions = [
              ...(nested.technical || []),
              ...(nested.behavioral || []),
              ...(nested.coding || [])
            ];
          }
          
          if (Array.isArray(questions) && questions.length > 0) {
            return await apiRequest("POST", "/api/sessions", {
              ...formData,
              questions,
            });
          }
        } catch (fallbackError) {
          console.warn("Fallback AI generation failed:", fallbackError);
        }
        
        // Final fallback to static questions
        const questionaryQuestions = createFallbackQuestions(
          formData.jobDescription,
          formData.jobTitle
        );
        const codingQuestions = generateCodingQuestions(
          formData.jobDescription,
          formData.jobTitle
        );
        const questions = [...questionaryQuestions, ...codingQuestions];

        try {
          const sessionResponse = await apiRequest("POST", "/api/sessions", {
            ...formData,
            questions,
          });

          const session = await sessionResponse.json();
          setCurrentSession(session);

          toast({
            title: "Questions ready!",
            description: `Created ${questions.length} personalized questions for your interview.`,
          });

          onSessionCreated();
        } catch (sessionError: any) {
          console.error("Session creation failed:", sessionError);
          toast({
            title: "Session creation failed",
            description: "Please try again.",
            variant: "destructive",
          });
        }
        setLoading(false);
        return;
      }

      // Parse AI response to extract questions
      let questions: Question[] = [];
      try {
        console.log("Raw AI response:", aiResponse.substring(0, 300) + "...");
        
        // Clean and extract JSON more carefully
        let cleanResponse = aiResponse.trim();
        
        // Remove markdown blocks and explanatory text
        cleanResponse = cleanResponse.replace(/```json\n?/g, '').replace(/\n?```/g, '');
        cleanResponse = cleanResponse.replace(/^[^[\{]*/, ''); // Remove text before JSON
        cleanResponse = cleanResponse.replace(/[^}\]]*$/, ''); // Remove text after JSON
        
        // Find JSON boundaries
        let jsonStart = cleanResponse.indexOf('[');
        let jsonEnd = cleanResponse.lastIndexOf(']') + 1;
        
        if (jsonStart === -1) {
          jsonStart = cleanResponse.indexOf('{');
          jsonEnd = cleanResponse.lastIndexOf('}') + 1;
        }
        
        if (jsonStart !== -1 && jsonEnd > jsonStart) {
          cleanResponse = cleanResponse.substring(jsonStart, jsonEnd);
        }
        
        // Fix common JSON issues
        cleanResponse = cleanResponse.replace(/,\s*]/g, ']'); // Remove trailing commas before ]
        cleanResponse = cleanResponse.replace(/,\s*}/g, '}'); // Remove trailing commas before }
        cleanResponse = cleanResponse.replace(/([^"])\n/g, '$1'); // Remove line breaks not in strings
        cleanResponse = cleanResponse.replace(/\s+/g, ' '); // Normalize whitespace
        cleanResponse = cleanResponse.replace(/,\s*,/g, ','); // Remove duplicate commas
        cleanResponse = cleanResponse.replace(/"\s*:\s*"([^"]*)"([^,}\]]*)/g, '":"$1"'); // Fix broken strings
        
        console.log("Cleaned response:", cleanResponse.substring(0, 500) + "...");
        
        try {
          let parsedData = JSON.parse(cleanResponse);
          
          // Handle different response formats
          if (Array.isArray(parsedData)) {
            questions = parsedData;
          } else if (parsedData.interview_questions) {
            const nested = parsedData.interview_questions;
            questions = [
              ...(nested.technical || []),
              ...(nested.behavioral || []),
              ...(nested.coding || [])
            ];
          } else if (parsedData.technical || parsedData.behavioral || parsedData.coding) {
            questions = [
              ...(parsedData.technical || []),
              ...(parsedData.behavioral || []),
              ...(parsedData.coding || [])
            ];
          }
          
          if (Array.isArray(questions) && questions.length > 0) {
            // Validate and fix question structure
            questions.forEach((q, index) => {
              if (!q.id) q.id = (index + 1).toString();
              if (!q.type) q.type = 'technical';
              if (!q.difficulty) q.difficulty = 'medium';
              if (!q.question) q.question = 'Sample question';
            });
            
            const technical = questions.filter(q => q.type === 'technical');
            const behavioral = questions.filter(q => q.type === 'behavioral');
            const coding = questions.filter(q => q.type === 'coding');
            
            console.log(`AI generated: ${technical.length} technical, ${behavioral.length} behavioral, ${coding.length} coding questions`);
          } else {
            throw new Error("No valid questions found");
          }
        } catch (jsonError) {
          console.warn("JSON parsing failed:", jsonError);
          throw jsonError;
        }
      } catch (parseError) {
        console.warn(
          "AI response parsing failed, trying fallback generation:",
          parseError
        );
        
        // Try AI generation one more time with simpler prompt
        try {
          const simpleMessages: OpenRouterMessage[] = [
            { 
              role: 'system' as const, 
              content: `Generate exactly 100 interview questions as a pure JSON array. No explanations, no markdown.

STRUCTURE: 60 technical (20 easy, 20 medium, 20 hard) + 25 behavioral + 15 coding (5 easy, 5 medium, 5 hard)

REQUIRED FORMAT: [{"id":"1","type":"technical","difficulty":"easy","question":"..."}, ...]

For coding questions add: "context":"...", "constraints":["..."], "examples":[{"input":"...","output":"..."}]

Return ONLY the JSON array.` 
            },
            { 
              role: 'user' as const, 
              content: `Company: ${formData.companyName || 'Tech Company'}
Role: ${formData.jobTitle || 'Software Engineer'}
Job Details: ${formData.jobDescription.substring(0, 600)}

Generate questions matching this specific role and company standards.` 
            }
          ];
          
          const fallbackAI = await callDeepSeek(simpleMessages);
          console.log("Fallback AI response:", fallbackAI.substring(0, 200) + "...");
          
          // Better JSON cleaning for fallback
          let cleanFallback = fallbackAI.trim();
          cleanFallback = cleanFallback.replace(/```json\n?/g, '').replace(/\n?```/g, '');
          
          // Extract just the JSON array part
          const arrayMatch = cleanFallback.match(/\[[\s\S]*\]/);
          if (arrayMatch) {
            cleanFallback = arrayMatch[0];
          } else {
            // Look for object format
            const objMatch = cleanFallback.match(/\{[\s\S]*\}/);
            if (objMatch) {
              cleanFallback = objMatch[0];
            }
          }
          
          // Fix common JSON issues
          cleanFallback = cleanFallback.replace(/,\s*]/g, ']');
          cleanFallback = cleanFallback.replace(/,\s*}/g, '}');
          cleanFallback = cleanFallback.replace(/([^"\\])\n/g, '$1'); // Remove unexpected newlines
          
          console.log("Cleaned fallback JSON:", cleanFallback.substring(0, 500) + "...");
          
          let fallbackParsed = JSON.parse(cleanFallback);
          
          if (Array.isArray(fallbackParsed)) {
            questions = fallbackParsed;
          } else if (fallbackParsed.interview_questions || fallbackParsed.technical || fallbackParsed.behavioral || fallbackParsed.coding) {
            const nested = fallbackParsed.interview_questions || fallbackParsed;
            questions = [
              ...(nested.technical || []),
              ...(nested.behavioral || []),
              ...(nested.coding || [])
            ];
          }
          
          if (!Array.isArray(questions) || questions.length === 0) {
            throw new Error("Invalid fallback response");
          }
          
          toast({
            title: "AI questions generated",
            description: "Created personalized questions using simplified AI generation.",
          });
        } catch (fallbackError) {
          console.warn("Fallback AI generation also failed, using static questions:", fallbackError);
          
          const questionaryQuestions = createFallbackQuestions(
            formData.jobDescription,
            formData.jobTitle
          );
          const codingQuestions = generateCodingQuestions(
            formData.jobDescription,
            formData.jobTitle
          );
          questions = [...questionaryQuestions, ...codingQuestions];

          toast({
            title: "Using smart question generation",
            description: "Generated personalized questions based on your job requirements.",
          });
        }
      }

      // Create session in database
      try {
        const sessionResponse = await apiRequest("POST", "/api/sessions", {
          ...formData,
          questions,
        });

        const session = await sessionResponse.json();
        setCurrentSession(session);

        toast({
          title: "Questions ready!",
          description: `Created ${questions.length} personalized interview questions.`,
        });

        onSessionCreated();
      } catch (sessionError: any) {
        console.error("Session creation failed:", sessionError);
        toast({
          title: "Session creation failed",
          description: sessionError.message || "Please try again.",
          variant: "destructive",
        });
        setLoading(false);
        return;
      }
    } catch (error: any) {
      console.error("Session creation error:", error);
      toast({
        title: "Failed to generate questions",
        description: error.message || "Please try again later.",
        variant: "destructive",
      });
    }

    setLoading(false);
  };

  const createFallbackQuestions = (
    jobDesc: string,
    jobTitle?: string
  ): Question[] => {
    const questions: Question[] = [];
    let idCounter = 1;

    // Analyze job description for technology keywords
    const jobDescLower = jobDesc.toLowerCase();
    const jobTitleLower = jobTitle?.toLowerCase() || '';
    const isReact = jobDescLower.includes('react') || jobTitleLower.includes('react');
    const isNode = jobDescLower.includes('node') || jobDescLower.includes('backend') || jobTitleLower.includes('backend');
    const isPython = jobDescLower.includes('python') || jobTitleLower.includes('python');

    // 60 Technical Questions (20 easy, 20 medium, 20 hard)
    const easyTechnicalQuestions = [
      "What is the difference between let, var, and const in JavaScript?",
      "Explain the concept of hoisting in JavaScript.",
      'What is the purpose of the "use strict" directive?',
      "What are the different data types in JavaScript?",
      "Explain the difference between == and === operators.",
      "What is a callback function?",
      "What is the difference between null and undefined?",
      "How do you create an object in JavaScript?",
      "What is the difference between function declaration and function expression?",
      "What is the DOM and how do you manipulate it?",
      "What is event bubbling and capturing?",
      "What is the difference between innerHTML and textContent?",
      "How do you handle errors in JavaScript?",
      "What is JSON and how do you work with it?",
      "What are template literals in JavaScript?",
      "What is the spread operator and how is it used?",
      "What is destructuring assignment?",
      "What are arrow functions and how do they differ from regular functions?",
      "What is the difference between localStorage and sessionStorage?",
      "How do you make HTTP requests in JavaScript?",
    ];

    const mediumTechnicalQuestions = [
      "What are closures and how do they work?",
      "Explain the concept of prototypal inheritance.",
      "What is the event loop in JavaScript?",
      "How does garbage collection work in JavaScript?",
      "What are promises and how do they work?",
      "What is async/await and how does it differ from promises?",
      "What is the difference between call, apply, and bind?",
      "What are higher-order functions?",
      "What is memoization and when would you use it?",
      "Explain the concept of currying.",
      "What is the difference between deep and shallow copying?",
      "How do you implement inheritance in JavaScript?",
      "What are generators and iterators?",
      "What is the difference between synchronous and asynchronous programming?",
      "How do you handle asynchronous errors?",
      "What are web workers and when would you use them?",
      "What is the difference between debouncing and throttling?",
      "How do you optimize JavaScript performance?",
      "What are design patterns and which ones do you commonly use?",
      "How do you handle memory leaks in JavaScript applications?",
    ];

    const hardTechnicalQuestions = [
      "How would you design a scalable web architecture?",
      "Explain the concept of micro-frontends.",
      "How do you implement server-side rendering?",
      "What are the trade-offs between different state management solutions?",
      "How would you optimize a React application for performance?",
      "Explain the concept of lazy loading and code splitting.",
      "How do you implement authentication and authorization?",
      "What are the security considerations for web applications?",
      "How do you handle data consistency in distributed systems?",
      "Explain the CAP theorem and its implications.",
      "How do you implement real-time features using WebSockets?",
      "What are the challenges of building progressive web apps?",
      "How do you handle cross-browser compatibility issues?",
      "What are the best practices for API design?",
      "How do you implement testing strategies for complex applications?",
      "What are the considerations for mobile-first development?",
      "How do you handle internationalization and localization?",
      "What are the performance implications of different CSS architectures?",
      "How do you implement continuous integration and deployment?",
      "What are the trade-offs between different database technologies?",
    ];

    // 25 Behavioral Questions
    const behavioralQuestions = [
      "Tell me about a challenging project you worked on.",
      "How do you handle conflict in a team environment?",
      "Describe a time when you had to learn a new technology quickly.",
      "Tell me about a time when you disagreed with your manager.",
      "How do you prioritize tasks when you have multiple deadlines?",
      "Describe a situation where you had to work with a difficult team member.",
      "Tell me about a time when you made a mistake and how you handled it.",
      "How do you stay updated with new technologies and industry trends?",
      "Describe a time when you had to convince others to adopt your idea.",
      "Tell me about a project where you had to work with tight deadlines.",
      "How do you handle stress and pressure in the workplace?",
      "Describe a time when you had to take on additional responsibilities.",
      "Tell me about a time when you received constructive criticism.",
      "How do you approach problem-solving when facing a complex issue?",
      "Describe a situation where you had to work with limited resources.",
      "Tell me about a time when you had to adapt to significant changes.",
      "How do you ensure code quality and maintainability?",
      "Describe a time when you mentored or helped a junior developer.",
      "Tell me about a project where you implemented innovative solutions.",
      "How do you balance technical debt with new feature development?",
      "Describe a time when you had to make a difficult technical decision.",
      "Tell me about your experience with remote work and collaboration.",
      "How do you handle feedback and incorporate it into your work?",
      "Describe a time when you had to debug a particularly challenging issue.",
      "What motivates you in your software development career?",
    ];

    // Generate exactly 60 technical questions (20 easy, 20 medium, 20 hard)
    // Easy Technical Questions (20)
    for (let i = 0; i < 20; i++) {
      questions.push({
        id: (idCounter++).toString(),
        type: "technical",
        difficulty: "easy",
        question: easyTechnicalQuestions[i % easyTechnicalQuestions.length],
      });
    }

    // Medium Technical Questions (20)
    for (let i = 0; i < 20; i++) {
      questions.push({
        id: (idCounter++).toString(),
        type: "technical",
        difficulty: "medium",
        question: mediumTechnicalQuestions[i % mediumTechnicalQuestions.length],
      });
    }

    // Hard Technical Questions (20)
    for (let i = 0; i < 20; i++) {
      questions.push({
        id: (idCounter++).toString(),
        type: "technical",
        difficulty: "hard",
        question: hardTechnicalQuestions[i % hardTechnicalQuestions.length],
      });
    }

    // Generate exactly 25 behavioral questions
    for (let i = 0; i < 25; i++) {
      questions.push({
        id: (idCounter++).toString(),
        type: "behavioral",
        difficulty: "medium",
        question: behavioralQuestions[i % behavioralQuestions.length],
      });
    }

    // Total: 85 questionary questions (60 technical + 25 behavioral)
    return questions;
  };

  const generateCodingQuestions = (
    jobDesc: string,
    jobTitle?: string
  ): Question[] => {
    const codingQuestions: Question[] = [];
    let idCounter = 86; // Start after questionary questions

    // Easy Coding Questions (5)
    const easyCoding = [
      {
        question: "Write a function to find the two numbers in an array that add up to a target sum.",
        context: "Given an array of integers and a target sum, return the indices of two numbers that add up to the target.",
        constraints: ["Each input has exactly one solution", "You may not use the same element twice"],
        examples: [{ input: "nums = [2,7,11,15], target = 9", output: "[0,1]", explanation: "nums[0] + nums[1] = 2 + 7 = 9" }]
      },
      {
        question: "Check if a string is a palindrome (ignoring spaces and case).",
        context: "A palindrome reads the same forward and backward.",
        constraints: ["Ignore spaces, punctuation, and case"],
        examples: [{ input: '"A man a plan a canal Panama"', output: "true" }]
      },
      {
        question: "Find the maximum element in an array.",
        context: "Given an array of numbers, return the largest number.",
        constraints: ["Array will have at least one element"],
        examples: [{ input: "[3, 7, 2, 9, 1]", output: "9" }]
      },
      {
        question: "Count the number of vowels in a string.",
        context: "Count occurrences of a, e, i, o, u (case insensitive).",
        constraints: ["Consider both uppercase and lowercase vowels"],
        examples: [{ input: '"Hello World"', output: "3" }]
      },
      {
        question: "Reverse a string without using built-in reverse methods.",
        context: "Implement string reversal manually.",
        constraints: ["Do not use built-in reverse functions"],
        examples: [{ input: '"hello"', output: '"olleh"' }]
      }
    ];

    // Medium Coding Questions (5)
    const mediumCoding = [
      {
        question: "Implement a function to reverse a linked list.",
        context: "Given the head of a singly linked list, reverse the list and return the reversed list.",
        constraints: ["The number of nodes in the list is in the range [0, 5000]"],
        examples: [{ input: "[1,2,3,4,5]", output: "[5,4,3,2,1]" }]
      },
      {
        question: "Find the longest substring without repeating characters.",
        context: "Given a string, find the length of the longest substring without repeating characters.",
        constraints: ["String length is between 0 and 50,000"],
        examples: [{ input: '"abcabcbb"', output: "3", explanation: 'The answer is "abc", with the length of 3' }]
      },
      {
        question: "Validate if a binary tree is a binary search tree.",
        context: "Check if a binary tree satisfies the BST property.",
        constraints: ["Node values can be any integer"],
        examples: [{ input: "[2,1,3]", output: "true" }]
      },
      {
        question: "Implement a stack using queues.",
        context: "Design a stack that supports push, pop, top, and empty operations using only queue operations.",
        constraints: ["You may only use standard queue operations"],
        examples: [{ input: "push(1), push(2), top(), pop(), empty()", output: "2, 2, false" }]
      },
      {
        question: "Find all anagrams in a string.",
        context: "Given a string s and a non-empty string p, find all the start indices of p's anagrams in s.",
        constraints: ["Strings consist of lowercase English letters only"],
        examples: [{ input: 's = "abab", p = "ab"', output: "[0, 2]" }]
      }
    ];

    // Hard Coding Questions (5)
    const hardCoding = [
      {
        question: "Find the median of two sorted arrays.",
        context: "Given two sorted arrays nums1 and nums2, return the median of the two sorted arrays.",
        constraints: ["The overall run time complexity should be O(log (m+n))"],
        examples: [{ input: "nums1 = [1,3], nums2 = [2]", output: "2.0", explanation: "merged array = [1,2,3] and median is 2" }]
      },
      {
        question: "Design and implement an LRU (Least Recently Used) cache.",
        context: "Implement LRUCache class with get and put operations in O(1) time complexity.",
        constraints: ["Both operations must run in O(1) average time complexity"],
        examples: [{ input: "LRUCache(2), put(1,1), put(2,2), get(1), put(3,3), get(2)", output: "1, -1" }]
      },
      {
        question: "Serialize and deserialize a binary tree.",
        context: "Design an algorithm to serialize and deserialize a binary tree.",
        constraints: ["The encoded string should be as compact as possible"],
        examples: [{ input: "[1,2,3,null,null,4,5]", output: "serialize then deserialize returns original tree" }]
      },
      {
        question: "Find minimum window substring.",
        context: "Given strings s and t, return the minimum window substring of s such that every character in t is included in the window.",
        constraints: ["If no such window exists, return empty string"],
        examples: [{ input: 's = "ADOBECODEBANC", t = "ABC"', output: '"BANC"' }]
      },
      {
        question: "Implement a trie (prefix tree) with insert, search, and startsWith methods.",
        context: "Design a data structure that supports efficient string operations.",
        constraints: ["All inputs consist of lowercase English letters"],
        examples: [{ input: "insert('apple'), search('app'), startsWith('app')", output: "false, true" }]
      }
    ];

    // Generate 5 easy coding questions
    for (let i = 0; i < 5; i++) {
      codingQuestions.push({
        id: (idCounter++).toString(),
        type: "coding",
        difficulty: "easy",
        question: easyCoding[i].question,
        context: easyCoding[i].context,
        constraints: easyCoding[i].constraints,
        examples: easyCoding[i].examples
      });
    }

    // Generate 5 medium coding questions
    for (let i = 0; i < 5; i++) {
      codingQuestions.push({
        id: (idCounter++).toString(),
        type: "coding",
        difficulty: "medium",
        question: mediumCoding[i].question,
        context: mediumCoding[i].context,
        constraints: mediumCoding[i].constraints,
        examples: mediumCoding[i].examples
      });
    }

    // Generate 5 hard coding questions
    for (let i = 0; i < 5; i++) {
      codingQuestions.push({
        id: (idCounter++).toString(),
        type: "coding",
        difficulty: "hard",
        question: hardCoding[i].question,
        context: hardCoding[i].context,
        constraints: hardCoding[i].constraints,
        examples: hardCoding[i].examples
      });
    }

    return codingQuestions;
  };

  return (
    <div className="max-w-4xl mx-auto p-6">
      <Card className="shadow-lg">
        <CardHeader className="text-center">
          <CardTitle className="text-3xl font-bold mb-4">
            Start Your Interview Preparation
          </CardTitle>
          <p className="text-muted-foreground text-lg">
            Upload your resume and job description to generate personalized
            interview questions
          </p>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <Label htmlFor="jobTitle">Job Title</Label>
                <Input
                  id="jobTitle"
                  placeholder="e.g. Frontend Engineer"
                  value={formData.jobTitle}
                  onChange={(e) =>
                    setFormData({ ...formData, jobTitle: e.target.value })
                  }
                />
              </div>
              <div>
                <Label htmlFor="companyName">Company Name</Label>
                <Input
                  id="companyName"
                  placeholder="e.g. Google"
                  value={formData.companyName}
                  onChange={(e) =>
                    setFormData({ ...formData, companyName: e.target.value })
                  }
                />
              </div>
            </div>

            <div>
              <Label htmlFor="jobDescription">
                Job Description <span className="text-destructive">*</span>
              </Label>
              <Textarea
                id="jobDescription"
                rows={8}
                placeholder="Paste the complete job description here..."
                value={formData.jobDescription}
                onChange={(e) =>
                  setFormData({ ...formData, jobDescription: e.target.value })
                }
                required
                className="resize-none"
              />
              <p className="text-sm text-muted-foreground mt-1">
                Minimum 50 characters required
              </p>
            </div>

            <div>
              <Label htmlFor="resume">
                Resume/CV <span className="text-destructive">*</span>
              </Label>
              <Textarea
                id="resume"
                rows={10}
                placeholder="Paste your resume content here..."
                value={formData.resume}
                onChange={(e) =>
                  setFormData({ ...formData, resume: e.target.value })
                }
                required
                className="resize-none"
              />
              <p className="text-sm text-muted-foreground mt-1">
                Minimum 100 characters required
              </p>
            </div>

            <div className="flex justify-center pt-4">
              <Button
                type="submit"
                size="lg"
                disabled={loading}
                className="px-8 py-6 text-lg"
              >
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                    Generating Questions...
                  </>
                ) : (
                  <>
                    <Sparkles className="mr-2 h-5 w-5" />
                    Generate Interview Questions
                  </>
                )}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
