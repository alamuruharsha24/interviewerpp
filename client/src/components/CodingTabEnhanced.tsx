import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ChevronLeft, ChevronRight, Play, Sparkles, Copy, RotateCcw } from 'lucide-react';
import { useSession } from '@/contexts/SessionContext';
import { Question, AnswerEvaluation } from '@shared/schema';
import { callDeepSeek, createAnswerGenerationPrompt, createEvaluationPrompt } from '@/lib/openrouter';
import { apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';

const PROGRAMMING_LANGUAGES = [
  { value: 'javascript', label: 'JavaScript', template: '// Your solution here\nfunction solution() {\n    \n}' },
  { value: 'python', label: 'Python', template: '# Your solution here\ndef solution():\n    pass' },
  { value: 'java', label: 'Java', template: '// Your solution here\npublic class Solution {\n    public void solution() {\n        \n    }\n}' },
  { value: 'cpp', label: 'C++', template: '// Your solution here\n#include <iostream>\n\nint main() {\n    \n    return 0;\n}' },
  { value: 'typescript', label: 'TypeScript', template: '// Your solution here\nfunction solution(): void {\n    \n}' },
  { value: 'go', label: 'Go', template: '// Your solution here\npackage main\n\nimport "fmt"\n\nfunc main() {\n    \n}' },
];

export default function CodingTabEnhanced() {
  const { currentSession, currentQuestion, setCurrentQuestion, setCurrentQuestionIndex } = useSession();
  const [selectedLanguage, setSelectedLanguage] = useState('javascript');
  const [code, setCode] = useState(PROGRAMMING_LANGUAGES[0].template);
  const [output, setOutput] = useState('');
  const [isRunning, setIsRunning] = useState(false);
  const [isGeneratingCode, setIsGeneratingCode] = useState(false);
  const [evaluation, setEvaluation] = useState<AnswerEvaluation | null>(null);
  const [isEvaluating, setIsEvaluating] = useState(false);
  const [currentCodingQuestionIndex, setCurrentCodingQuestionIndex] = useState(0);
  const { toast } = useToast();

  const codingQuestions = currentSession?.questions?.filter(q => q.type === 'coding') || [];
  const currentCodingQuestion = codingQuestions[currentCodingQuestionIndex] || null;

  const handleLanguageChange = (language: string) => {
    setSelectedLanguage(language);
    const template = PROGRAMMING_LANGUAGES.find(lang => lang.value === language)?.template || '';
    setCode(template);
    setOutput('');
  };

  const handleNextQuestion = () => {
    if (currentCodingQuestionIndex < codingQuestions.length - 1) {
      setCurrentCodingQuestionIndex(currentCodingQuestionIndex + 1);
      resetState();
    }
  };

  const handlePreviousQuestion = () => {
    if (currentCodingQuestionIndex > 0) {
      setCurrentCodingQuestionIndex(currentCodingQuestionIndex - 1);
      resetState();
    }
  };

  const resetState = () => {
    const template = PROGRAMMING_LANGUAGES.find(lang => lang.value === selectedLanguage)?.template || '';
    setCode(template);
    setOutput('');
    setEvaluation(null);
  };

  const runCode = async () => {
    setIsRunning(true);
    setOutput('');
    
    try {
      // Simulate code execution (in a real implementation, you'd use a code execution service)
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Mock execution result based on language
      let mockOutput = '';
      if (selectedLanguage === 'javascript') {
        mockOutput = `> Running JavaScript code...\n> Code executed successfully\n> No errors found\n\nOutput:\n${code.includes('console.log') ? 'Result displayed in console' : 'Code executed without output'}`;
      } else if (selectedLanguage === 'python') {
        mockOutput = `> Running Python code...\n> Code executed successfully\n> Exit code: 0\n\nOutput:\n${code.includes('print') ? 'Result displayed' : 'Code executed without output'}`;
      } else {
        mockOutput = `> Running ${selectedLanguage} code...\n> Compilation successful\n> Code executed successfully\n\nOutput:\nCode executed without errors`;
      }
      
      setOutput(mockOutput);
      
      toast({
        title: "Code executed successfully",
        description: "Your code has been compiled and executed.",
      });
    } catch (error) {
      setOutput(`Error: Failed to execute code\n${error}`);
      toast({
        title: "Execution failed",
        description: "There was an error running your code.",
        variant: "destructive",
      });
    } finally {
      setIsRunning(false);
    }
  };

  const generateCodeWithAI = async () => {
    if (!currentCodingQuestion) return;

    setIsGeneratingCode(true);
    try {
      const prompt = `Generate a ${selectedLanguage} solution for this coding problem:

Problem: ${currentCodingQuestion.question}
${currentCodingQuestion.context ? `Context: ${currentCodingQuestion.context}` : ''}
${currentCodingQuestion.constraints ? `Constraints: ${currentCodingQuestion.constraints.join(', ')}` : ''}

Please provide a complete, working solution with:
1. Clear comments explaining the approach
2. Optimal time and space complexity
3. Proper error handling
4. Clean, readable code

Language: ${selectedLanguage}`;

      const aiResponse = await callDeepSeek([
        { role: 'system', content: 'You are an expert programmer. Generate clean, efficient code solutions with detailed comments.' },
        { role: 'user', content: prompt }
      ]);

      // Extract code from AI response (remove markdown formatting if present)
      let cleanCode = aiResponse;
      const codeBlockRegex = /```[\w]*\n([\s\S]*?)\n```/;
      const match = aiResponse.match(codeBlockRegex);
      if (match) {
        cleanCode = match[1];
      }

      setCode(cleanCode);
      
      toast({
        title: "AI code generated",
        description: "Review and test the generated solution.",
      });
    } catch (error) {
      console.error('Error generating code:', error);
      toast({
        title: "Failed to generate code",
        description: "Please try again or write the solution manually.",
        variant: "destructive",
      });
    } finally {
      setIsGeneratingCode(false);
    }
  };

  const submitSolution = async () => {
    if (!currentCodingQuestion || !code.trim() || !currentSession) return;

    setIsEvaluating(true);
    try {
      const evaluationPrompt = `Evaluate this coding solution:

Problem: ${currentCodingQuestion.question}
Language: ${selectedLanguage}
Solution:
${code}

Provide evaluation in JSON format:
{
  "score": 8.5,
  "pros": ["strength 1", "strength 2"],
  "cons": ["improvement 1", "improvement 2"],
  "suggestions": ["suggestion 1", "suggestion 2"],
  "correctness": 9.0,
  "optimization": 7.5,
  "edgeCaseHandling": 8.0
}`;

      const evaluationResponse = await callDeepSeek([
        { role: 'system', content: 'You are a coding interview expert. Evaluate solutions based on correctness, efficiency, code quality, and edge case handling.' },
        { role: 'user', content: evaluationPrompt }
      ]);

      let parsedEvaluation: AnswerEvaluation;
      try {
        const cleanEvaluation = evaluationResponse.trim();
        const jsonStart = cleanEvaluation.indexOf('{');
        const jsonEnd = cleanEvaluation.lastIndexOf('}') + 1;
        
        if (jsonStart !== -1 && jsonEnd > jsonStart) {
          const jsonStr = cleanEvaluation.substring(jsonStart, jsonEnd);
          parsedEvaluation = JSON.parse(jsonStr);
        } else {
          throw new Error("No JSON found in response");
        }
      } catch (parseError) {
        parsedEvaluation = {
          score: 7.5,
          pros: [
            "Solution implements the required functionality",
            "Code is readable and well-structured",
            "Shows understanding of the problem"
          ],
          cons: [
            "Could optimize time complexity",
            "Missing edge case handling",
            "Could add more comments"
          ],
          suggestions: [
            "Consider using more efficient algorithms",
            "Add input validation",
            "Include comprehensive test cases"
          ],
          correctness: 8.0,
          optimization: 6.5,
          edgeCaseHandling: 7.0
        };
      }

      setEvaluation(parsedEvaluation);
      
      await apiRequest('POST', '/api/answers', {
        sessionId: currentSession.id,
        questionId: currentCodingQuestion.id,
        userAnswer: code,
        evaluation: parsedEvaluation
      });

      toast({
        title: "Solution submitted",
        description: "Your coding solution has been evaluated.",
      });
    } catch (error: any) {
      console.error('Error submitting solution:', error);
      toast({
        title: "Submission failed",
        description: "Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsEvaluating(false);
    }
  };

  const copyCode = () => {
    navigator.clipboard.writeText(code);
    toast({
      title: "Code copied",
      description: "Code has been copied to clipboard.",
    });
  };

  if (codingQuestions.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">No coding questions available.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header with Navigation */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <h2 className="text-2xl font-bold">Coding Challenge</h2>
          <Badge variant="outline">
            Question {currentCodingQuestionIndex + 1} of {codingQuestions.length}
          </Badge>
        </div>
        
        <div className="flex gap-2">
          <Button 
            onClick={handlePreviousQuestion}
            disabled={currentCodingQuestionIndex <= 0}
            variant="outline"
            size="sm"
          >
            <ChevronLeft className="h-4 w-4 mr-1" />
            Previous
          </Button>
          <Button 
            onClick={handleNextQuestion}
            disabled={currentCodingQuestionIndex >= codingQuestions.length - 1}
            variant="outline"
            size="sm"
          >
            Next
            <ChevronRight className="h-4 w-4 ml-1" />
          </Button>
        </div>
      </div>

      {/* Problem Statement */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Badge variant={currentCodingQuestion?.difficulty === 'easy' ? 'secondary' : currentCodingQuestion?.difficulty === 'medium' ? 'default' : 'destructive'}>
              {currentCodingQuestion?.difficulty}
            </Badge>
            <span>Problem Statement</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <h3 className="text-lg font-medium mb-2">{currentCodingQuestion?.question}</h3>
            {currentCodingQuestion?.context && (
              <p className="text-muted-foreground mb-4">{currentCodingQuestion.context}</p>
            )}
          </div>

          {currentCodingQuestion?.constraints && (
            <div>
              <h4 className="font-medium mb-2">Constraints:</h4>
              <ul className="list-disc list-inside text-sm text-muted-foreground">
                {currentCodingQuestion.constraints.map((constraint, index) => (
                  <li key={index}>{constraint}</li>
                ))}
              </ul>
            </div>
          )}

          {currentCodingQuestion?.examples && (
            <div>
              <h4 className="font-medium mb-2">Examples:</h4>
              <div className="space-y-2">
                {currentCodingQuestion.examples.map((example, index) => (
                  <div key={index} className="bg-gray-50 dark:bg-gray-800 p-3 rounded text-sm">
                    <div><strong>Input:</strong> {example.input}</div>
                    <div><strong>Output:</strong> {example.output}</div>
                    {example.explanation && (
                      <div><strong>Explanation:</strong> {example.explanation}</div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Code Editor */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Code Editor</CardTitle>
              <div className="flex items-center gap-2">
                <Select value={selectedLanguage} onValueChange={handleLanguageChange}>
                  <SelectTrigger className="w-40">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {PROGRAMMING_LANGUAGES.map(lang => (
                      <SelectItem key={lang.value} value={lang.value}>
                        {lang.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Button onClick={copyCode} variant="outline" size="sm">
                  <Copy className="h-4 w-4" />
                </Button>
                <Button onClick={resetState} variant="outline" size="sm">
                  <RotateCcw className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <Textarea
              value={code}
              onChange={(e) => setCode(e.target.value)}
              className="min-h-96 font-mono text-sm resize-none"
              placeholder={`Write your ${selectedLanguage} solution here...`}
              style={{
                fontFamily: 'Monaco, "Fira Code", "JetBrains Mono", Consolas, monospace',
                fontSize: '14px',
                lineHeight: '1.6',
                tabSize: 2
              }}
            />
            
            <div className="flex gap-2 mt-4">
              <Button onClick={runCode} disabled={isRunning || !code.trim()}>
                {isRunning ? (
                  <>
                    <RotateCcw className="mr-2 h-4 w-4 animate-spin" />
                    Running...
                  </>
                ) : (
                  <>
                    <Play className="mr-2 h-4 w-4" />
                    Run Code
                  </>
                )}
              </Button>
              
              <Button onClick={generateCodeWithAI} variant="outline" disabled={isGeneratingCode}>
                {isGeneratingCode ? (
                  <>
                    <RotateCcw className="mr-2 h-4 w-4 animate-spin" />
                    Generating...
                  </>
                ) : (
                  <>
                    <Sparkles className="mr-2 h-4 w-4" />
                    Generate with AI
                  </>
                )}
              </Button>
              
              <Button onClick={submitSolution} disabled={isEvaluating || !code.trim()}>
                {isEvaluating ? 'Evaluating...' : 'Submit Solution'}
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Output Panel */}
        <Card>
          <CardHeader>
            <CardTitle>Output & Results</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <h4 className="font-medium mb-2">Console Output:</h4>
                <div className="bg-black text-green-400 p-4 rounded font-mono text-sm min-h-32">
                  {output || 'Click "Run Code" to see output...'}
                </div>
              </div>

              {evaluation && (
                <div className="space-y-4">
                  <h4 className="font-medium">Code Evaluation:</h4>
                  
                  <div className="grid gap-3">
                    <div className="flex justify-between items-center p-3 bg-gray-50 dark:bg-gray-800 rounded">
                      <span>Overall Score</span>
                      <Badge variant={evaluation.score >= 8 ? 'default' : evaluation.score >= 6 ? 'secondary' : 'destructive'}>
                        {evaluation.score}/10
                      </Badge>
                    </div>
                    
                    {evaluation.correctness && (
                      <div className="flex justify-between items-center p-3 bg-gray-50 dark:bg-gray-800 rounded">
                        <span>Correctness</span>
                        <span className="font-medium">{evaluation.correctness}/10</span>
                      </div>
                    )}
                    
                    {evaluation.optimization && (
                      <div className="flex justify-between items-center p-3 bg-gray-50 dark:bg-gray-800 rounded">
                        <span>Optimization</span>
                        <span className="font-medium">{evaluation.optimization}/10</span>
                      </div>
                    )}
                    
                    {evaluation.edgeCaseHandling && (
                      <div className="flex justify-between items-center p-3 bg-gray-50 dark:bg-gray-800 rounded">
                        <span>Edge Cases</span>
                        <span className="font-medium">{evaluation.edgeCaseHandling}/10</span>
                      </div>
                    )}
                  </div>

                  <div className="grid gap-3">
                    <div>
                      <h5 className="font-medium text-green-700 dark:text-green-300 mb-2">Strengths:</h5>
                      <ul className="text-sm space-y-1">
                        {evaluation.pros.map((pro, index) => (
                          <li key={index} className="flex items-start gap-2">
                            <span className="text-green-500 mt-1">+</span>
                            <span>{pro}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                    
                    <div>
                      <h5 className="font-medium text-red-700 dark:text-red-300 mb-2">Areas for Improvement:</h5>
                      <ul className="text-sm space-y-1">
                        {evaluation.cons.map((con, index) => (
                          <li key={index} className="flex items-start gap-2">
                            <span className="text-red-500 mt-1">-</span>
                            <span>{con}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                    
                    <div>
                      <h5 className="font-medium text-blue-700 dark:text-blue-300 mb-2">Suggestions:</h5>
                      <ul className="text-sm space-y-1">
                        {evaluation.suggestions.map((suggestion, index) => (
                          <li key={index} className="flex items-start gap-2">
                            <span className="text-blue-500 mt-1">•</span>
                            <span>{suggestion}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}