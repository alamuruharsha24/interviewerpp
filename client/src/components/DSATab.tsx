import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Loader2, ExternalLink, Clock, Database } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";

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

export default function DSATab() {
  const [questions, setQuestions] = useState<DSAQuestion[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const { toast } = useToast();

  const handleGenerateQuestions = async () => {
    setIsGenerating(true);
    try {
      const response = await fetch("/api/dsa/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
      });
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      const data = await response.json() as { questions: DSAQuestion[] };
      if (data.questions && data.questions.length > 0) {
        setQuestions(data.questions);
        toast({
          title: "Success!",
          description: `Generated ${data.questions.length} DSA questions`,
        });
      } else {
        toast({
          title: "Error",
          description: "Failed to generate questions. Please try again.",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Something went wrong. Please check your API key and try again.",
        variant: "destructive",
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'easy': return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300';
      case 'medium': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300';
      case 'hard': return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300';
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300';
    }
  };

  const handleQuestionClick = (question: DSAQuestion) => {
    // Priority: LeetCode first, then GeeksforGeeks
    const url = question.leetcodeUrl || question.gfgUrl;
    if (url) {
      window.open(url, '_blank', 'noopener,noreferrer');
    }
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="text-center space-y-4">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
          DSA Practice Questions
        </h1>
        <p className="text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
          AI-generated Data Structures and Algorithms questions to help you prepare for coding interviews. 
          Click on any question to practice on LeetCode or GeeksforGeeks.
        </p>
        
        <Button 
          onClick={handleGenerateQuestions}
          disabled={isGenerating}
          size="lg"
          className="bg-blue-600 hover:bg-blue-700 text-white"
        >
          {isGenerating ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Generating Questions...
            </>
          ) : (
            "Generate Questions"
          )}
        </Button>
      </div>

      {questions.length > 0 && (
        <div className="space-y-4">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
            Generated Questions ({questions.length})
          </h2>
          
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {questions.map((question) => (
              <Card 
                key={question.id}
                className="cursor-pointer hover:shadow-lg transition-shadow duration-200 border-2 hover:border-blue-300 dark:hover:border-blue-600"
                onClick={() => handleQuestionClick(question)}
              >
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <CardTitle className="text-lg font-semibold text-gray-900 dark:text-white line-clamp-2">
                        {question.title}
                      </CardTitle>
                      <CardDescription className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                        {question.topic}
                      </CardDescription>
                    </div>
                    <ExternalLink className="h-4 w-4 text-gray-400" />
                  </div>
                  
                  <div className="flex flex-wrap gap-2 mt-2">
                    <Badge className={getDifficultyColor(question.difficulty)}>
                      {question.difficulty}
                    </Badge>
                    {question.tags.slice(0, 2).map((tag) => (
                      <Badge key={tag} variant="outline" className="text-xs">
                        {tag}
                      </Badge>
                    ))}
                  </div>
                </CardHeader>
                
                <CardContent className="pt-0">
                  <p className="text-sm text-gray-700 dark:text-gray-300 line-clamp-3 mb-3">
                    {question.description}
                  </p>
                  
                  {(question.timeComplexity || question.spaceComplexity) && (
                    <div className="flex items-center gap-4 text-xs text-gray-500 dark:text-gray-400">
                      {question.timeComplexity && (
                        <div className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          <span>Time: {question.timeComplexity}</span>
                        </div>
                      )}
                      {question.spaceComplexity && (
                        <div className="flex items-center gap-1">
                          <Database className="h-3 w-3" />
                          <span>Space: {question.spaceComplexity}</span>
                        </div>
                      )}
                    </div>
                  )}
                  
                  <div className="flex justify-between items-center mt-3 pt-2 border-t border-gray-200 dark:border-gray-700">
                    <div className="flex gap-2">
                      {question.leetcodeUrl && (
                        <Badge variant="outline" className="text-xs bg-orange-50 dark:bg-orange-950">
                          LeetCode
                        </Badge>
                      )}
                      {question.gfgUrl && (
                        <Badge variant="outline" className="text-xs bg-green-50 dark:bg-green-950">
                          GeeksforGeeks
                        </Badge>
                      )}
                    </div>
                    <span className="text-xs text-gray-400">#{question.id}</span>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}
      
      {questions.length === 0 && !isGenerating && (
        <div className="text-center py-12">
          <div className="text-gray-400 dark:text-gray-600 mb-4">
            <Database className="h-16 w-16 mx-auto mb-4" />
            <p className="text-lg">No questions generated yet</p>
            <p className="text-sm">Click "Generate Questions" to get started with AI-powered DSA problems</p>
          </div>
        </div>
      )}
    </div>
  );
}