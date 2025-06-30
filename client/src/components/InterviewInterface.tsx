import { useState, useEffect } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card } from '@/components/ui/card';
import { useSession } from '@/contexts/SessionContext';
import QuestionaryTabEnhanced from './QuestionaryTabEnhanced';
import CodingTabEnhanced from './CodingTabEnhanced';
import ResultsTab from './ResultsTab';
import DSATab from './DSATab';
import { HelpCircle, Code, BarChart3, Database } from 'lucide-react';

export default function InterviewInterface() {
  const [activeTab, setActiveTab] = useState('questionary');
  const { currentSession, setCurrentQuestion, setCurrentQuestionIndex } = useSession();

  useEffect(() => {
    if (currentSession?.questions && currentSession.questions.length > 0) {
      // Find the first non-coding question for the questionary tab
      const firstQuestion = currentSession.questions.find(q => q.type !== 'coding');
      if (firstQuestion) {
        setCurrentQuestion(firstQuestion);
        setCurrentQuestionIndex(currentSession.questions.indexOf(firstQuestion));
      }
    }
  }, [currentSession, setCurrentQuestion, setCurrentQuestionIndex]);

  if (!currentSession) {
    return null;
  }

  return (
    <div className="max-w-7xl mx-auto p-6">
      <Card className="shadow-lg">
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="questionary" className="flex items-center gap-2">
              <HelpCircle className="h-4 w-4" />
              Questionary
            </TabsTrigger>
            <TabsTrigger value="coding" className="flex items-center gap-2">
              <Code className="h-4 w-4" />
              Coding
            </TabsTrigger>
            <TabsTrigger value="dsa" className="flex items-center gap-2">
              <Database className="h-4 w-4" />
              DSA
            </TabsTrigger>
            <TabsTrigger value="results" className="flex items-center gap-2">
              <BarChart3 className="h-4 w-4" />
              Results
            </TabsTrigger>
          </TabsList>

          <TabsContent value="questionary" className="p-8">
            <QuestionaryTabEnhanced />
          </TabsContent>

          <TabsContent value="coding" className="p-8">
            <CodingTabEnhanced />
          </TabsContent>

          <TabsContent value="dsa" className="p-8">
            <DSATab />
          </TabsContent>

          <TabsContent value="results" className="p-8">
            <ResultsTab />
          </TabsContent>
        </Tabs>
      </Card>
    </div>
  );
}
