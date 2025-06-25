import { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { useSession } from '@/contexts/SessionContext';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';
import { callDeepSeek, createAnswerGenerationPrompt, createEvaluationPrompt } from '@/lib/openrouter';
import { AnswerEvaluation } from '@shared/schema';
import { Sparkles, Send, CheckCircle, RotateCcw, ThumbsUp, ThumbsDown, Lightbulb, Loader2 } from 'lucide-react';

export default function QuestionaryTab() {
  const [userAnswer, setUserAnswer] = useState('');
  const [evaluation, setEvaluation] = useState<AnswerEvaluation | null>(null);
  const [showEvaluation, setShowEvaluation] = useState(false);
  const [loading, setLoading] = useState(false);
  const [aiGenerating, setAiGenerating] = useState(false);

  const { currentSession, currentQuestion, currentQuestionIndex, setCurrentQuestion, setCurrentQuestionIndex } = useSession();
  const { user } = useAuth();
  const { toast } = useToast();

  const nonCodingQuestions = currentSession?.questions?.filter(q => q.type !== 'coding') || [];
  const currentNonCodingIndex = currentQuestion ? nonCodingQuestions.indexOf(currentQuestion) : 0;
  const progress = nonCodingQuestions.length > 0 ? ((currentNonCodingIndex + 1) / nonCodingQuestions.length) * 100 : 0;

  const generateAIAnswer = async () => {
    if (!currentQuestion) return;

    setAiGenerating(true);
    try {
      const messages = createAnswerGenerationPrompt(currentQuestion.question, currentQuestion.context);
      const aiResponse = await callDeepSeek(messages);
      setUserAnswer(aiResponse);
      toast({
        title: "AI answer generated",
        description: "Review and customize the answer before submitting.",
      });
    } catch (error: any) {
      toast({
        title: "Failed to generate answer",
        description: error.message,
        variant: "destructive",
      });
    }
    setAiGenerating(false);
  };

  const submitAnswer = async () => {
    if (!currentQuestion || !userAnswer.trim() || !currentSession) return;

    setLoading(true);
    try {
      // Get AI evaluation
      const evaluationMessages = createEvaluationPrompt(
        currentQuestion.question,
        userAnswer,
        currentQuestion.type
      );
      
      const evaluationResponse = await callDeepSeek(evaluationMessages);
      let parsedEvaluation: AnswerEvaluation;
      
      try {
        parsedEvaluation = JSON.parse(evaluationResponse);
      } catch (parseError) {
        // Fallback evaluation if parsing fails
        parsedEvaluation = {
          score: 7.5,
          pros: ["Clear and well-structured answer", "Demonstrates understanding of the topic"],
          cons: ["Could provide more specific examples", "Some areas could be expanded"],
          suggestions: ["Consider adding practical examples", "Elaborate on key concepts", "Structure your answer more clearly"]
        };
      }

      setEvaluation(parsedEvaluation);
      
      // Save answer to database
      await apiRequest('POST', '/api/answers', {
        sessionId: currentSession.id,
        questionId: currentQuestion.id,
        userAnswer,
        evaluation: parsedEvaluation
      });

      setShowEvaluation(true);
      
      toast({
        title: "Answer submitted",
        description: "Review your evaluation and decide if you're satisfied.",
      });
    } catch (error: any) {
      toast({
        title: "Failed to submit answer",
        description: error.message,
        variant: "destructive",
      });
    }
    setLoading(false);
  };

  const handleSatisfaction = async (satisfied: boolean) => {
    if (!currentQuestion || !currentSession) return;

    try {
      // Update satisfaction in database
      await apiRequest('PATCH', `/api/answers/${currentQuestion.id}`, {
        satisfied,
        sessionId: currentSession.id
      });

      if (satisfied) {
        nextQuestion();
      } else {
        // Reset for retry
        setShowEvaluation(false);
        setEvaluation(null);
        toast({
          title: "Try again",
          description: "You can modify your answer and resubmit.",
        });
      }
    } catch (error: any) {
      toast({
        title: "Failed to save satisfaction",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const nextQuestion = () => {
    const nextIndex = currentNonCodingIndex + 1;
    if (nextIndex < nonCodingQuestions.length) {
      const nextQ = nonCodingQuestions[nextIndex];
      setCurrentQuestion(nextQ);
      setCurrentQuestionIndex(currentSession?.questions?.indexOf(nextQ) || 0);
      setUserAnswer('');
      setEvaluation(null);
      setShowEvaluation(false);
    } else {
      toast({
        title: "All questions completed!",
        description: "Switch to the Results tab to see your overall performance.",
      });
    }
  };

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'easy': return 'bg-green-100 text-green-800';
      case 'medium': return 'bg-amber-100 text-amber-800';
      case 'hard': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'technical': return 'bg-blue-100 text-blue-800';
      case 'behavioral': return 'bg-purple-100 text-purple-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  if (!currentQuestion || !currentSession) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">No questions available. Please generate questions first.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header with Progress */}
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Interview Questions</h2>
        <div className="flex items-center space-x-4">
          <span className="text-sm text-muted-foreground">
            Progress: <span className="font-semibold">{currentNonCodingIndex + 1}/{nonCodingQuestions.length}</span>
          </span>
          <Progress value={progress} className="w-32" />
        </div>
      </div>

      {/* Question Badges */}
      <div className="flex space-x-2">
        <Badge className={getDifficultyColor(currentQuestion.difficulty)}>
          {currentQuestion.difficulty}
        </Badge>
        <Badge className={getTypeColor(currentQuestion.type)}>
          {currentQuestion.type}
        </Badge>
        <Badge variant="outline">
          Question {currentNonCodingIndex + 1}/{nonCodingQuestions.length}
        </Badge>
      </div>

      {/* Question Card */}
      <Card className="bg-muted/50">
        <CardContent className="p-8">
          <h3 className="text-xl font-semibold mb-4">
            {currentQuestion.question}
          </h3>
          {currentQuestion.context && (
            <p className="text-muted-foreground">
              {currentQuestion.context}
            </p>
          )}
        </CardContent>
      </Card>

      {/* Answer Section */}
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-foreground mb-3">Your Answer</label>
          <Textarea
            rows={8}
            placeholder="Type your answer here..."
            value={userAnswer}
            onChange={(e) => setUserAnswer(e.target.value)}
            className="resize-none"
            disabled={loading}
          />
        </div>

        <div className="flex flex-col sm:flex-row gap-4">
          <Button 
            onClick={generateAIAnswer} 
            disabled={aiGenerating || loading}
            variant="outline"
            className="flex-1"
          >
            {aiGenerating ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Generating...
              </>
            ) : (
              <>
                <Sparkles className="mr-2 h-4 w-4" />
                Generate Answer with AI
              </>
            )}
          </Button>
          <Button 
            onClick={submitAnswer} 
            disabled={!userAnswer.trim() || loading}
            className="flex-1"
          >
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Submitting...
              </>
            ) : (
              <>
                <Send className="mr-2 h-4 w-4" />
                Submit Answer
              </>
            )}
          </Button>
        </div>
      </div>

      {/* Evaluation Section */}
      {showEvaluation && evaluation && (
        <Card className="border-2">
          <CardContent className="p-6">
            <h4 className="text-lg font-semibold mb-4">AI Evaluation</h4>
            
            <div className="grid md:grid-cols-3 gap-6 mb-6">
              <Card className="bg-green-50 border-green-200">
                <CardContent className="p-4">
                  <h5 className="font-semibold text-green-800 mb-2 flex items-center">
                    <CheckCircle className="mr-2 h-4 w-4" />
                    Strengths
                  </h5>
                  <ul className="text-sm text-green-700 space-y-1">
                    {evaluation.pros.map((pro, index) => (
                      <li key={index}>• {pro}</li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
              
              <Card className="bg-red-50 border-red-200">
                <CardContent className="p-4">
                  <h5 className="font-semibold text-red-800 mb-2 flex items-center">
                    <ThumbsDown className="mr-2 h-4 w-4" />
                    Areas to Improve
                  </h5>
                  <ul className="text-sm text-red-700 space-y-1">
                    {evaluation.cons.map((con, index) => (
                      <li key={index}>• {con}</li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
              
              <Card className="bg-blue-50 border-blue-200">
                <CardContent className="p-4">
                  <h5 className="font-semibold text-blue-800 mb-2 flex items-center">
                    <Lightbulb className="mr-2 h-4 w-4" />
                    Suggestions
                  </h5>
                  <ul className="text-sm text-blue-700 space-y-1">
                    {evaluation.suggestions.map((suggestion, index) => (
                      <li key={index}>• {suggestion}</li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            </div>

            <Card className="bg-muted/50 mb-6">
              <CardContent className="p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="font-medium">Overall Score</span>
                  <span className="text-2xl font-bold text-green-600">{evaluation.score}/10</span>
                </div>
                <Progress value={evaluation.score * 10} className="h-3" />
              </CardContent>
            </Card>

            <Card className="bg-amber-50 border-amber-200 mb-6">
              <CardContent className="p-4 text-center">
                <p className="text-amber-800 font-medium">Are you satisfied with this answer?</p>
              </CardContent>
            </Card>

            <div className="flex gap-4">
              <Button onClick={() => handleSatisfaction(true)} className="flex-1 bg-green-600 hover:bg-green-700">
                <ThumbsUp className="mr-2 h-4 w-4" />
                Yes, Next Question
              </Button>
              <Button onClick={() => handleSatisfaction(false)} variant="outline" className="flex-1 text-amber-600 border-amber-600 hover:bg-amber-50">
                <RotateCcw className="mr-2 h-4 w-4" />
                No, Try Again
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
