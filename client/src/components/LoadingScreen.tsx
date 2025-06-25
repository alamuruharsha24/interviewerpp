import { Card, CardContent } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Loader2 } from 'lucide-react';

export default function LoadingScreen() {
  return (
    <div className="max-w-4xl mx-auto p-6">
      <Card className="shadow-lg">
        <CardContent className="p-12 text-center">
          <Loader2 className="w-16 h-16 animate-spin mx-auto mb-6 text-primary" />
          <h2 className="text-2xl font-bold mb-4">Generating Your Questions...</h2>
          <p className="text-muted-foreground text-lg mb-8">Our AI is analyzing your resume and job description to create personalized interview questions.</p>
          
          <div className="bg-muted rounded-lg p-4">
            <div className="text-sm text-muted-foreground mb-2">Generating:</div>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span>Technical Questions (Easy)</span>
                <span className="text-green-600 font-semibold">20+</span>
              </div>
              <div className="flex justify-between">
                <span>Technical Questions (Medium)</span>
                <span className="text-amber-600 font-semibold">20+</span>
              </div>
              <div className="flex justify-between">
                <span>Technical Questions (Hard)</span>
                <span className="text-red-600 font-semibold">20+</span>
              </div>
              <div className="flex justify-between">
                <span>Behavioral Questions</span>
                <span className="text-primary font-semibold">25+</span>
              </div>
              <div className="flex justify-between">
                <span>Coding Challenges</span>
                <span className="text-purple-600 font-semibold">8</span>
              </div>
            </div>
          </div>
          
          <Progress value={65} className="mt-6" />
        </CardContent>
      </Card>
    </div>
  );
}
