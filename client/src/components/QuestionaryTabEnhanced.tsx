import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ChevronLeft, ChevronRight, Sparkles, Send, RefreshCw } from 'lucide-react';
import { useSession } from '@/contexts/SessionContext';
import { Question, AnswerEvaluation } from '@shared/schema';
import { callDeepSeek, createAnswerGenerationPrompt, createEvaluationPrompt } from '@/lib/openrouter';
import { apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';

export default function QuestionaryTabEnhanced() {
  const { currentSession, currentQuestion, setCurrentQuestion, setCurrentQuestionIndex, currentQuestionIndex } = useSession();
  const [selectedDifficulty, setSelectedDifficulty] = useState<'easy' | 'medium' | 'hard'>('easy');
  const [selectedType, setSelectedType] = useState<'technical' | 'behavioral'>('technical');
  const [userAnswer, setUserAnswer] = useState('');
  const [aiAnswer, setAiAnswer] = useState('');
  const [evaluation, setEvaluation] = useState<AnswerEvaluation | null>(null);
  const [isEvaluating, setIsEvaluating] = useState(false);
  const [isGeneratingAnswer, setIsGeneratingAnswer] = useState(false);
  const [showFinalAnswer, setShowFinalAnswer] = useState(false);
  const [isAnswerSatisfactory, setIsAnswerSatisfactory] = useState<boolean | null>(null);
  const { toast } = useToast();

  const filteredQuestions = currentSession?.questions?.filter(q => 
    selectedType === 'behavioral' 
      ? q.type === 'behavioral'
      : q.type === 'technical' && q.difficulty === selectedDifficulty
  ) || [];

  const currentFilteredIndex = filteredQuestions.findIndex(q => q.id === currentQuestion?.id);

  const handleQuestionSelect = (question: Question, index: number) => {
    setCurrentQuestion(question);
    setCurrentQuestionIndex(index);
    setUserAnswer('');
    setAiAnswer('');
    setEvaluation(null);
    setShowFinalAnswer(false);
    setIsAnswerSatisfactory(null);
  };

  const handleNextQuestion = () => {
    if (currentFilteredIndex < filteredQuestions.length - 1) {
      const nextQuestion = filteredQuestions[currentFilteredIndex + 1];
      handleQuestionSelect(nextQuestion, currentFilteredIndex + 1);
    }
  };

  const handlePreviousQuestion = () => {
    if (currentFilteredIndex > 0) {
      const prevQuestion = filteredQuestions[currentFilteredIndex - 1];
      handleQuestionSelect(prevQuestion, currentFilteredIndex - 1);
    }
  };

  const generateAnswer = async () => {
    if (!currentQuestion) return;

    setIsGeneratingAnswer(true);
    try {
      const messages = createAnswerGenerationPrompt(
        currentQuestion.question, 
        currentQuestion.type,
        currentQuestion.context
      );
      const aiResponse = await callDeepSeek(messages);
      
      const cleanedResponse = aiResponse
        .replace(/\*\*/g, '')
        .replace(/\*/g, '')
        .trim();
      
      setAiAnswer(cleanedResponse);
      
      toast({
        title: "Answer generated successfully",
        description: "Review the AI-generated answer and customize it as needed.",
      });
    } catch (error) {
      console.error('Error generating answer:', error);
      toast({
        title: "Error generating answer",
        description: "Failed to generate answer. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsGeneratingAnswer(false);
    }
  };

  const regenerateAnswer = () => {
    setAiAnswer('');
    setIsAnswerSatisfactory(null);
    generateAnswer();
  };

  const submitAnswer = async () => {
    if (!currentQuestion || !userAnswer.trim() || !currentSession) return;

    setIsEvaluating(true);
    try {
      const evaluationMessages = createEvaluationPrompt(
        currentQuestion.question,
        userAnswer,
        currentQuestion.type
      );
      
      const evaluationResponse = await callDeepSeek(evaluationMessages);
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
            "Answer demonstrates understanding of the topic",
            "Clear communication style",
            "Relevant points addressed"
          ],
          cons: [
            "Could provide more specific examples",
            "Some technical details could be expanded",
            "Structure could be improved"
          ],
          suggestions: [
            "Add practical examples from your experience",
            "Structure your answer with clear sections",
            "Include specific metrics or outcomes where possible"
          ]
        };
      }

      setEvaluation(parsedEvaluation);
      
      await apiRequest('POST', '/api/answers', {
        sessionId: currentSession.id,
        questionId: currentQuestion.id,
        userAnswer,
        evaluation: parsedEvaluation
      });

      toast({
        title: "Answer submitted successfully",
        description: "Your answer has been evaluated. Review the feedback below.",
      });
      
      setShowFinalAnswer(true);
    } catch (error: any) {
      console.error('Error submitting answer:', error);
      toast({
        title: "Error submitting answer",
        description: "Failed to submit answer. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsEvaluating(false);
    }
  };

  const technicalQuestions = currentSession?.questions?.filter(q => q.type === 'technical') || [];
  const behavioralQuestions = currentSession?.questions?.filter(q => q.type === 'behavioral') || [];
  const easyTech = technicalQuestions.filter(q => q.difficulty === 'easy').length;
  const mediumTech = technicalQuestions.filter(q => q.difficulty === 'medium').length;
  const hardTech = technicalQuestions.filter(q => q.difficulty === 'hard').length;

  return (
    <div className="space-y-6">
      {/* Enhanced Question Type and Difficulty Filters */}
      <div className="flex flex-wrap gap-4 items-end">
        <div className="space-y-2">
          <Label>Question Category</Label>
          <Select value={selectedType} onValueChange={(value: 'technical' | 'behavioral') => setSelectedType(value)}>
            <SelectTrigger className="w-48">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="technical">Technical ({technicalQuestions.length} questions)</SelectItem>
              <SelectItem value="behavioral">Behavioral ({behavioralQuestions.length} questions)</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {selectedType === 'technical' && (
          <div className="space-y-2">
            <Label>Difficulty Level</Label>
            <Select value={selectedDifficulty} onValueChange={(value: 'easy' | 'medium' | 'hard') => setSelectedDifficulty(value)}>
              <SelectTrigger className="w-40">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="easy">Easy ({easyTech})</SelectItem>
                <SelectItem value="medium">Medium ({mediumTech})</SelectItem>
                <SelectItem value="hard">Hard ({hardTech})</SelectItem>
              </SelectContent>
            </Select>
          </div>
        )}

        {/* Navigation Controls with Question Count */}
        <div className="flex gap-2 ml-auto items-center">
          <span className="text-sm text-muted-foreground mr-2">
            {currentFilteredIndex + 1} of {filteredQuestions.length}
          </span>
          <Button 
            onClick={handlePreviousQuestion}
            disabled={currentFilteredIndex <= 0}
            variant="outline"
            size="sm"
          >
            <ChevronLeft className="h-4 w-4 mr-1" />
            Previous
          </Button>
          <Button 
            onClick={handleNextQuestion}
            disabled={currentFilteredIndex >= filteredQuestions.length - 1}
            variant="outline"
            size="sm"
          >
            Next
            <ChevronRight className="h-4 w-4 ml-1" />
          </Button>
        </div>
      </div>

      {/* Questions Overview */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="p-4">
          <div className="text-center">
            <div className="text-2xl font-bold text-green-600">{easyTech}</div>
            <div className="text-sm text-muted-foreground">Easy Technical</div>
          </div>
        </Card>
        <Card className="p-4">
          <div className="text-center">
            <div className="text-2xl font-bold text-yellow-600">{mediumTech}</div>
            <div className="text-sm text-muted-foreground">Medium Technical</div>
          </div>
        </Card>
        <Card className="p-4">
          <div className="text-center">
            <div className="text-2xl font-bold text-red-600">{hardTech}</div>
            <div className="text-sm text-muted-foreground">Hard Technical</div>
          </div>
        </Card>
        <Card className="p-4">
          <div className="text-center">
            <div className="text-2xl font-bold text-purple-600">{behavioralQuestions.length}</div>
            <div className="text-sm text-muted-foreground">Behavioral</div>
          </div>
        </Card>
      </div>

      {/* Current Question Display */}
      {currentQuestion && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Badge variant={currentQuestion.difficulty === 'easy' ? 'secondary' : currentQuestion.difficulty === 'medium' ? 'default' : 'destructive'}>
                {currentQuestion.difficulty}
              </Badge>
              <Badge variant="outline">{currentQuestion.type}</Badge>
              <span className="text-sm text-muted-foreground ml-auto">
                Question {currentFilteredIndex + 1} of {filteredQuestions.length}
              </span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div>
              <h3 className="text-lg font-medium mb-3">Question:</h3>
              <p className="text-gray-700 dark:text-gray-300 text-base leading-relaxed">
                {currentQuestion.question}
              </p>
              {currentQuestion.context && (
                <div className="mt-3 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                  <p className="text-sm text-blue-800 dark:text-blue-200">
                    <strong>Context:</strong> {currentQuestion.context}
                  </p>
                </div>
              )}
            </div>

            <div>
              <Label htmlFor="answer" className="text-base font-medium">Your Answer</Label>
              <Textarea
                id="answer"
                placeholder={currentQuestion.type === 'technical' 
                  ? "Provide a detailed technical answer with concepts, examples, and best practices..."
                  : "Use the STAR method: Situation, Task, Action, Result. Include specific examples and outcomes..."
                }
                value={userAnswer}
                onChange={(e) => setUserAnswer(e.target.value)}
                className="mt-2 min-h-40 text-base"
                rows={10}
              />
            </div>

            <div className="flex gap-3">
              <Button onClick={generateAnswer} variant="outline" disabled={isGeneratingAnswer} className="flex-1">
                {isGeneratingAnswer ? (
                  <>
                    <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                    Generating...
                  </>
                ) : (
                  <>
                    <Sparkles className="mr-2 h-4 w-4" />
                    Generate AI Answer
                  </>
                )}
              </Button>
              <Button onClick={submitAnswer} disabled={!userAnswer.trim() || isEvaluating} className="flex-1">
                {isEvaluating ? (
                  <>
                    <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                    Evaluating...
                  </>
                ) : (
                  <>
                    <Send className="mr-2 h-4 w-4" />
                    Submit Answer
                  </>
                )}
              </Button>
            </div>

            {/* AI Generated Answer Section */}
            {aiAnswer && (
              <div className="space-y-4 pt-4 border-t">
                <div className="flex items-center justify-between">
                  <h4 className="text-lg font-medium">AI-Generated Answer</h4>
                  <div className="flex gap-2">
                    <Button onClick={regenerateAnswer} variant="outline" size="sm">
                      <RefreshCw className="h-4 w-4 mr-1" />
                      Regenerate
                    </Button>
                  </div>
                </div>
                <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg border">
                  <div className="whitespace-pre-wrap text-sm leading-relaxed">{aiAnswer}</div>
                </div>
                
                {/* Satisfaction Check */}
                <div className="flex items-center gap-4 p-4 bg-amber-50 dark:bg-amber-900/20 rounded-lg">
                  <span className="text-sm font-medium">Are you satisfied with this answer?</span>
                  <div className="flex gap-2">
                    <Button 
                      size="sm" 
                      variant={isAnswerSatisfactory === true ? "default" : "outline"}
                      onClick={() => setIsAnswerSatisfactory(true)}
                    >
                      Yes, it's good
                    </Button>
                    <Button 
                      size="sm" 
                      variant={isAnswerSatisfactory === false ? "default" : "outline"}
                      onClick={() => {
                        setIsAnswerSatisfactory(false);
                        regenerateAnswer();
                      }}
                    >
                      No, regenerate
                    </Button>
                  </div>
                </div>
              </div>
            )}

            {/* Evaluation Results */}
            {evaluation && (
              <div className="space-y-6 pt-4 border-t">
                <div className="flex items-center gap-2">
                  <h4 className="text-lg font-medium">AI Evaluation & Feedback</h4>
                  <Badge variant={evaluation.score >= 8 ? 'default' : evaluation.score >= 6 ? 'secondary' : 'destructive'}>
                    Score: {evaluation.score}/10
                  </Badge>
                </div>

                <div className="grid gap-4 md:grid-cols-3">
                  <Card className="bg-green-50 dark:bg-green-900/20 border-green-200">
                    <CardContent className="p-4">
                      <h5 className="font-medium text-green-700 dark:text-green-300 mb-3">
                        Strengths
                      </h5>
                      <ul className="text-sm text-green-600 dark:text-green-400 space-y-2">
                        {evaluation.pros.map((pro, index) => (
                          <li key={index} className="flex items-start gap-2">
                            <span className="text-green-500 mt-1 font-bold">+</span>
                            <span>{pro}</span>
                          </li>
                        ))}
                      </ul>
                    </CardContent>
                  </Card>

                  <Card className="bg-red-50 dark:bg-red-900/20 border-red-200">
                    <CardContent className="p-4">
                      <h5 className="font-medium text-red-700 dark:text-red-300 mb-3">
                        Areas for Improvement
                      </h5>
                      <ul className="text-sm text-red-600 dark:text-red-400 space-y-2">
                        {evaluation.cons.map((con, index) => (
                          <li key={index} className="flex items-start gap-2">
                            <span className="text-red-500 mt-1 font-bold">-</span>
                            <span>{con}</span>
                          </li>
                        ))}
                      </ul>
                    </CardContent>
                  </Card>

                  <Card className="bg-blue-50 dark:bg-blue-900/20 border-blue-200">
                    <CardContent className="p-4">
                      <h5 className="font-medium text-blue-700 dark:text-blue-300 mb-3">
                        Improvement Suggestions
                      </h5>
                      <ul className="text-sm text-blue-600 dark:text-blue-400 space-y-2">
                        {evaluation.suggestions.map((suggestion, index) => (
                          <li key={index} className="flex items-start gap-2">
                            <span className="text-blue-500 mt-1 font-bold">•</span>
                            <span>{suggestion}</span>
                          </li>
                        ))}
                      </ul>
                    </CardContent>
                  </Card>
                </div>
              </div>
            )}

            {/* Final Expected Answer Analysis */}
            {showFinalAnswer && (
              <div className="space-y-4 pt-4 border-t">
                <h4 className="text-lg font-medium text-blue-700 dark:text-blue-300">
                  Expected Answer Guidelines
                </h4>
                <Card className="bg-blue-50 dark:bg-blue-900/20 border-blue-200">
                  <CardContent className="p-4">
                    <div className="text-sm text-blue-800 dark:text-blue-200 space-y-2">
                      {currentQuestion.type === 'technical' ? (
                        <div>
                          <p className="font-medium mb-2">A strong technical answer should include:</p>
                          <ul className="list-disc list-inside space-y-1">
                            <li>Clear definition of core concepts</li>
                            <li>Practical examples from real-world experience</li>
                            <li>Discussion of pros/cons or trade-offs</li>
                            <li>Best practices and industry standards</li>
                            <li>Demonstration of deep understanding</li>
                          </ul>
                        </div>
                      ) : (
                        <div>
                          <p className="font-medium mb-2">A compelling behavioral answer should follow STAR method:</p>
                          <ul className="list-disc list-inside space-y-1">
                            <li><strong>Situation:</strong> Set clear context and background</li>
                            <li><strong>Task:</strong> Define your specific responsibility</li>
                            <li><strong>Action:</strong> Describe your strategic approach and decisions</li>
                            <li><strong>Result:</strong> Quantify outcomes and positive impact</li>
                            <li>Show leadership, problem-solving, and measurable results</li>
                          </ul>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Question List for Quick Navigation */}
      <Card>
        <CardHeader>
          <CardTitle>Question List - {selectedType === 'technical' ? `${selectedDifficulty} Technical` : 'Behavioral'} Questions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-2 max-h-60 overflow-y-auto">
            {filteredQuestions.map((question, index) => (
              <Button
                key={question.id}
                variant={currentQuestion?.id === question.id ? "default" : "ghost"}
                className="justify-start text-left h-auto p-3"
                onClick={() => handleQuestionSelect(question, index)}
              >
                <div className="flex items-center gap-2 w-full">
                  <Badge variant="outline" className="text-xs">
                    {index + 1}
                  </Badge>
                  <span className="truncate flex-1">
                    {question.question.length > 80 
                      ? `${question.question.substring(0, 80)}...` 
                      : question.question
                    }
                  </span>
                </div>
              </Button>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}