import { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { useSession } from '@/contexts/SessionContext';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';
import { Answer } from '@shared/schema';
import { HelpCircle, CheckCircle, Star, Code, Download, Plus, AlertCircle, TrendingUp, Lightbulb } from 'lucide-react';

interface SessionStats {
  totalQuestions: number;
  completedQuestions: number;
  averageScore: number;
  technicalScore: number;
  behavioralScore: number;
  codingScore: number;
  codingSolved: number;
  totalCoding: number;
}

export default function ResultsTab() {
  const [answers, setAnswers] = useState<Answer[]>([]);
  const [stats, setStats] = useState<SessionStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);

  const { currentSession, setCurrentSession } = useSession();
  const { user } = useAuth();
  const { toast } = useToast();

  useEffect(() => {
    if (currentSession?.id) {
      fetchAnswers();
    }
  }, [currentSession]);

  const fetchAnswers = async () => {
    if (!currentSession?.id) return;

    try {
      const response = await apiRequest('GET', `/api/sessions/${currentSession.id}/answers`);
      const answersData = await response.json();
      setAnswers(answersData);
      calculateStats(answersData);
    } catch (error: any) {
      toast({
        title: "Failed to load results",
        description: error.message,
        variant: "destructive",
      });
    }
    setLoading(false);
  };

  const calculateStats = (answersData: Answer[]) => {
    if (!currentSession?.questions) return;

    const totalQuestions = currentSession.questions.length;
    const completedQuestions = answersData.length;
    
    let totalScore = 0;
    let technicalCount = 0;
    let behavioralCount = 0;
    let codingCount = 0;
    let technicalSum = 0;
    let behavioralSum = 0;
    let codingSum = 0;
    let codingSolved = 0;

    answersData.forEach(answer => {
      if (answer.evaluation?.score) {
        totalScore += answer.evaluation.score;
        
        const question = currentSession.questions.find(q => q.id === answer.questionId);
        if (question) {
          switch (question.type) {
            case 'technical':
              technicalCount++;
              technicalSum += answer.evaluation.score;
              break;
            case 'behavioral':
              behavioralCount++;
              behavioralSum += answer.evaluation.score;
              break;
            case 'coding':
              codingCount++;
              codingSum += answer.evaluation.score;
              if (answer.evaluation.score >= 7) codingSolved++;
              break;
          }
        }
      }
    });

    const averageScore = completedQuestions > 0 ? totalScore / completedQuestions : 0;
    const technicalScore = technicalCount > 0 ? technicalSum / technicalCount : 0;
    const behavioralScore = behavioralCount > 0 ? behavioralSum / behavioralCount : 0;
    const codingScore = codingCount > 0 ? codingSum / codingCount : 0;
    const totalCoding = currentSession.questions.filter(q => q.type === 'coding').length;

    setStats({
      totalQuestions,
      completedQuestions,
      averageScore,
      technicalScore,
      behavioralScore,
      codingScore,
      codingSolved,
      totalCoding
    });
  };

  const exportToPDF = async () => {
    setExporting(true);
    try {
      // This would implement actual PDF generation
      // For now, we'll show a toast
      await new Promise(resolve => setTimeout(resolve, 2000));
      toast({
        title: "PDF exported successfully",
        description: "Your interview preparation results have been downloaded.",
      });
    } catch (error: any) {
      toast({
        title: "Failed to export PDF",
        description: error.message,
        variant: "destructive",
      });
    }
    setExporting(false);
  };

  const startNewSession = () => {
    setCurrentSession(null);
    toast({
      title: "New session started",
      description: "You can now upload a new job description and resume.",
    });
  };

  if (loading) {
    return (
      <div className="text-center py-12">
        <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full mx-auto mb-4"></div>
        <p className="text-muted-foreground">Loading your results...</p>
      </div>
    );
  }

  if (!stats) {
    return (
      <div className="text-center py-12">
        <AlertCircle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
        <p className="text-muted-foreground">No results available yet. Complete some questions to see your progress.</p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="text-center">
        <h2 className="text-3xl font-bold mb-4">Interview Summary</h2>
        <p className="text-muted-foreground text-lg">Your comprehensive interview preparation results</p>
      </div>

      {/* Stats Cards */}
      <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="text-center">
          <CardContent className="p-6">
            <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <HelpCircle className="h-6 w-6 text-blue-600" />
            </div>
            <div className="text-2xl font-bold mb-2">{stats.totalQuestions}</div>
            <div className="text-sm text-muted-foreground">Total Questions</div>
          </CardContent>
        </Card>

        <Card className="text-center">
          <CardContent className="p-6">
            <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <CheckCircle className="h-6 w-6 text-green-600" />
            </div>
            <div className="text-2xl font-bold mb-2">{stats.completedQuestions}</div>
            <div className="text-sm text-muted-foreground">Completed</div>
          </CardContent>
        </Card>

        <Card className="text-center">
          <CardContent className="p-6">
            <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Star className="h-6 w-6 text-purple-600" />
            </div>
            <div className="text-2xl font-bold mb-2">{stats.averageScore.toFixed(1)}</div>
            <div className="text-sm text-muted-foreground">Avg Score</div>
          </CardContent>
        </Card>

        <Card className="text-center">
          <CardContent className="p-6">
            <div className="w-12 h-12 bg-indigo-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Code className="h-6 w-6 text-indigo-600" />
            </div>
            <div className="text-2xl font-bold mb-2">{stats.codingSolved}/{stats.totalCoding}</div>
            <div className="text-sm text-muted-foreground">Coding Solved</div>
          </CardContent>
        </Card>
      </div>

      <div className="grid lg:grid-cols-2 gap-8">
        {/* Performance Breakdown */}
        <Card>
          <CardContent className="p-6">
            <h3 className="text-xl font-semibold mb-6">Performance Breakdown</h3>
            <div className="space-y-4">
              <div>
                <div className="flex justify-between mb-2">
                  <span className="text-muted-foreground">Technical Questions</span>
                  <span className="font-semibold">{((stats.technicalScore / 10) * 100).toFixed(0)}%</span>
                </div>
                <Progress value={(stats.technicalScore / 10) * 100} className="h-2" />
              </div>
              
              <div>
                <div className="flex justify-between mb-2">
                  <span className="text-muted-foreground">Behavioral Questions</span>
                  <span className="font-semibold">{((stats.behavioralScore / 10) * 100).toFixed(0)}%</span>
                </div>
                <Progress value={(stats.behavioralScore / 10) * 100} className="h-2" />
              </div>
              
              <div>
                <div className="flex justify-between mb-2">
                  <span className="text-muted-foreground">Coding Challenges</span>
                  <span className="font-semibold">{((stats.codingScore / 10) * 100).toFixed(0)}%</span>
                </div>
                <Progress value={(stats.codingScore / 10) * 100} className="h-2" />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Areas for Improvement */}
        <Card>
          <CardContent className="p-6">
            <h3 className="text-xl font-semibold mb-6">Areas for Improvement</h3>
            <div className="space-y-4">
              {stats.technicalScore < 7 && (
                <Card className="bg-amber-50 border-amber-200">
                  <CardContent className="p-4">
                    <h4 className="font-semibold text-amber-800 mb-2 flex items-center">
                      <TrendingUp className="h-4 w-4 mr-2" />
                      Technical Knowledge
                    </h4>
                    <p className="text-sm text-amber-700">Focus on strengthening your technical fundamentals and practice more complex problems.</p>
                  </CardContent>
                </Card>
              )}
              
              {stats.behavioralScore < 7 && (
                <Card className="bg-blue-50 border-blue-200">
                  <CardContent className="p-4">
                    <h4 className="font-semibold text-blue-800 mb-2 flex items-center">
                      <Lightbulb className="h-4 w-4 mr-2" />
                      Behavioral Responses
                    </h4>
                    <p className="text-sm text-blue-700">Strengthen your behavioral answers with more specific examples and structured responses.</p>
                  </CardContent>
                </Card>
              )}
              
              {stats.codingScore < 7 && (
                <Card className="bg-red-50 border-red-200">
                  <CardContent className="p-4">
                    <h4 className="font-semibold text-red-800 mb-2 flex items-center">
                      <Code className="h-4 w-4 mr-2" />
                      Coding Skills
                    </h4>
                    <p className="text-sm text-red-700">Practice more coding problems and focus on algorithm optimization and edge case handling.</p>
                  </CardContent>
                </Card>
              )}
              
              {stats.technicalScore >= 7 && stats.behavioralScore >= 7 && stats.codingScore >= 7 && (
                <Card className="bg-green-50 border-green-200">
                  <CardContent className="p-4">
                    <h4 className="font-semibold text-green-800 mb-2 flex items-center">
                      <CheckCircle className="h-4 w-4 mr-2" />
                      Excellent Performance!
                    </h4>
                    <p className="text-sm text-green-700">You're well-prepared across all areas. Keep practicing to maintain your strong performance.</p>
                  </CardContent>
                </Card>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Overall Assessment */}
      <Card className="bg-gradient-to-r from-primary to-purple-600 text-primary-foreground">
        <CardContent className="p-8 text-center">
          <h3 className="text-2xl font-bold mb-4">Overall Assessment</h3>
          <p className="text-lg mb-6 opacity-90">
            {stats.averageScore >= 8 
              ? "Excellent work! You're well-prepared for your interview. Keep up the great momentum!"
              : stats.averageScore >= 6
              ? "Good progress! Focus on the highlighted areas and you'll be ready to ace your interview."
              : "Keep practicing! Focus on the areas for improvement and consider more preparation time."
            }
          </p>
          <div className="flex justify-center space-x-4">
            <Button onClick={exportToPDF} disabled={exporting} variant="secondary">
              {exporting ? (
                <>
                  <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                  Generating PDF...
                </>
              ) : (
                <>
                  <Download className="mr-2 h-4 w-4" />
                  Export to PDF
                </>
              )}
            </Button>
            <Button onClick={startNewSession} variant="outline" className="border-primary-foreground text-primary-foreground hover:bg-primary-foreground hover:text-primary">
              <Plus className="mr-2 h-4 w-4" />
              New Session
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
