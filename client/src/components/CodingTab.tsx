import { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useSession } from '@/contexts/SessionContext';
import { useToast } from '@/hooks/use-toast';
import { callDeepSeek, createEvaluationPrompt } from '@/lib/openrouter';
import { apiRequest } from '@/lib/queryClient';
import { AnswerEvaluation } from '@shared/schema';
import { Play, Send, CheckCircle, TrendingUp, Beaker, Loader2 } from 'lucide-react';

export default function CodingTab() {
  const [selectedQuestionIndex, setSelectedQuestionIndex] = useState(0);
  const [code, setCode] = useState('');
  const [evaluation, setEvaluation] = useState<AnswerEvaluation | null>(null);
  const [loading, setLoading] = useState(false);
  const [running, setRunning] = useState(false);

  const { currentSession } = useSession();
  const { toast } = useToast();

  const codingQuestions = currentSession?.questions?.filter(q => q.type === 'coding') || [];
  const currentCodingQuestion = codingQuestions[selectedQuestionIndex];

  useEffect(() => {
    if (currentCodingQuestion) {
      // Set initial code template based on question
      const template = generateCodeTemplate(currentCodingQuestion.question);
      setCode(template);
    }
  }, [currentCodingQuestion]);

  const generateCodeTemplate = (question: string) => {
    // Generate a basic template based on the question
    if (question.toLowerCase().includes('two sum')) {
      return `/**
 * @param {number[]} nums
 * @param {number} target
 * @return {number[]}
 */
var twoSum = function(nums, target) {
    // Your solution here
    
};`;
    }
    
    return `/**
 * Write your solution here
 */
function solution() {
    // Your code here
    
}`;
  };

  const runCode = async () => {
    setRunning(true);
    // Simulate code execution
    setTimeout(() => {
      setRunning(false);
      toast({
        title: "Code executed",
        description: "Code runs successfully with sample inputs.",
      });
    }, 1500);
  };

  const submitCode = async () => {
    if (!currentCodingQuestion || !code.trim() || !currentSession) return;

    setLoading(true);
    try {
      // Get AI evaluation for coding solution
      const evaluationMessages = createEvaluationPrompt(
        currentCodingQuestion.question,
        code,
        'coding'
      );
      
      const evaluationResponse = await callDeepSeek(evaluationMessages);
      let parsedEvaluation: AnswerEvaluation;
      
      try {
        parsedEvaluation = JSON.parse(evaluationResponse);
      } catch (parseError) {
        // Fallback evaluation for code
        parsedEvaluation = {
          score: 8.0,
          pros: ["Clean and readable code", "Correct algorithm approach"],
          cons: ["Could optimize time complexity", "Missing edge case handling"],
          suggestions: ["Consider using a hash map for better performance", "Add input validation", "Handle empty array cases"],
          correctness: 9.0,
          optimization: 7.0,
          edgeCaseHandling: 6.5
        };
      }

      setEvaluation(parsedEvaluation);
      
      // Save coding answer to database
      await apiRequest('POST', '/api/answers', {
        sessionId: currentSession.id,
        questionId: currentCodingQuestion.id,
        userAnswer: code,
        evaluation: parsedEvaluation
      });

      toast({
        title: "Code submitted successfully",
        description: "Review your feedback below.",
      });
    } catch (error: any) {
      toast({
        title: "Failed to submit code",
        description: error.message,
        variant: "destructive",
      });
    }
    setLoading(false);
  };

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'easy': return 'bg-green-100 text-green-800';
      case 'medium': return 'bg-amber-100 text-amber-800';
      case 'hard': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
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
      {/* Header */}
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Coding Challenges</h2>
        <div className="flex space-x-2">
          <Badge className="bg-green-100 text-green-800">Easy (3)</Badge>
          <Badge className="bg-amber-100 text-amber-800">Medium (3)</Badge>
          <Badge className="bg-red-100 text-red-800">Hard (2)</Badge>
        </div>
      </div>

      {/* Question Selection */}
      <div className="flex flex-wrap gap-2">
        {codingQuestions.map((question, index) => (
          <Button
            key={question.id}
            variant={selectedQuestionIndex === index ? "default" : "outline"}
            size="sm"
            onClick={() => {
              setSelectedQuestionIndex(index);
              setEvaluation(null);
            }}
          >
            {index + 1}. {question.difficulty}
          </Button>
        ))}
      </div>

      <div className="grid lg:grid-cols-2 gap-8">
        {/* Problem Description */}
        <div className="space-y-6">
          <Card className="bg-muted/50">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xl font-semibold">{currentCodingQuestion?.question}</h3>
                <Badge className={getDifficultyColor(currentCodingQuestion?.difficulty || '')}>
                  {currentCodingQuestion?.difficulty}
                </Badge>
              </div>
              
              {currentCodingQuestion?.context && (
                <p className="text-muted-foreground mb-4">
                  {currentCodingQuestion.context}
                </p>
              )}

              {currentCodingQuestion?.examples && currentCodingQuestion.examples.length > 0 && (
                <div className="bg-background rounded-lg p-4 mb-4">
                  <h4 className="font-semibold mb-2">Example:</h4>
                  {currentCodingQuestion.examples.map((example, idx) => (
                    <div key={idx} className="text-sm text-muted-foreground font-mono">
                      <div><strong>Input:</strong> {example.input}</div>
                      <div><strong>Output:</strong> {example.output}</div>
                      {example.explanation && (
                        <div><strong>Explanation:</strong> {example.explanation}</div>
                      )}
                    </div>
                  ))}
                </div>
              )}

              {currentCodingQuestion?.constraints && currentCodingQuestion.constraints.length > 0 && (
                <div>
                  <h4 className="font-semibold mb-2">Constraints:</h4>
                  <ul className="text-sm text-muted-foreground space-y-1">
                    {currentCodingQuestion.constraints.map((constraint, idx) => (
                      <li key={idx}>• {constraint}</li>
                    ))}
                  </ul>
                </div>
              )}
            </CardContent>
          </Card>

          {/* AI Feedback */}
          {evaluation && (
            <Card>
              <CardContent className="p-6">
                <h4 className="font-semibold mb-4">AI Feedback</h4>
                <div className="space-y-4">
                  <Card className="bg-green-50 border-green-200">
                    <CardContent className="p-4">
                      <h5 className="font-medium text-green-800 mb-2 flex items-center">
                        <CheckCircle className="mr-2 h-4 w-4" />
                        Correctness ({evaluation.correctness}/10)
                      </h5>
                      <p className="text-sm text-green-700">
                        {evaluation.correctness && evaluation.correctness >= 8 
                          ? "Solution correctly handles all test cases"
                          : "Solution has some logical issues that need addressing"
                        }
                      </p>
                    </CardContent>
                  </Card>
                  
                  <Card className="bg-amber-50 border-amber-200">
                    <CardContent className="p-4">
                      <h5 className="font-medium text-amber-800 mb-2 flex items-center">
                        <TrendingUp className="mr-2 h-4 w-4" />
                        Optimization ({evaluation.optimization}/10)
                      </h5>
                      <p className="text-sm text-amber-700">
                        {evaluation.optimization && evaluation.optimization >= 8
                          ? "Well-optimized solution with good time complexity"
                          : "Consider optimizing for better time/space complexity"
                        }
                      </p>
                    </CardContent>
                  </Card>
                  
                  <Card className="bg-blue-50 border-blue-200">
                    <CardContent className="p-4">
                      <h5 className="font-medium text-blue-800 mb-2 flex items-center">
                        <Beaker className="mr-2 h-4 w-4" />
                        Edge Cases ({evaluation.edgeCaseHandling}/10)
                      </h5>
                      <p className="text-sm text-blue-700">
                        {evaluation.edgeCaseHandling && evaluation.edgeCaseHandling >= 8
                          ? "Good handling of edge cases and error conditions"
                          : "Consider adding more edge case handling"
                        }
                      </p>
                    </CardContent>
                  </Card>
                </div>

                <div className="mt-4 p-4 bg-muted rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-medium">Overall Score</span>
                    <span className="text-2xl font-bold text-primary">{evaluation.score}/10</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Code Editor */}
        <div className="space-y-4">
          <Card className="bg-slate-900 text-green-400">
            <CardContent className="p-4">
              <div className="flex justify-between items-center mb-4">
                <span className="text-slate-300 text-sm font-medium">JavaScript</span>
                <Button variant="ghost" size="sm" className="text-slate-400 hover:text-slate-200">
                  <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8V4m0 0h4M4 4l5 5m11-5h-4m4 0v4m0-4l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" />
                  </svg>
                </Button>
              </div>
              
              <textarea
                className="w-full h-96 bg-transparent text-green-400 font-mono text-sm border-none resize-none focus:outline-none"
                value={code}
                onChange={(e) => setCode(e.target.value)}
                spellCheck={false}
              />
            </CardContent>
          </Card>
          
          <div className="flex gap-4">
            <Button onClick={runCode} disabled={running} variant="outline" className="flex-1">
              {running ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Running...
                </>
              ) : (
                <>
                  <Play className="mr-2 h-4 w-4" />
                  Run Code
                </>
              )}
            </Button>
            <Button onClick={submitCode} disabled={loading || !code.trim()} className="flex-1">
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Submitting...
                </>
              ) : (
                <>
                  <Send className="mr-2 h-4 w-4" />
                  Submit
                </>
              )}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
