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
import { generateComprehensiveQuestions } from "@/lib/aiQuestionGeneratorEnhanced";
import { Question } from "@shared/schema";
import { Sparkles, Loader2 } from "lucide-react";

interface UploadFormProps {
  onSessionCreated: () => void;
}

export default function UploadForm({ onSessionCreated }: UploadFormProps) {
  const { user } = useAuth();
  const { setCurrentSession, setSessionProgress } = useSession();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    jobTitle: "",
    companyName: "",
    jobDescription: "",
    resume: "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user) {
      toast({
        title: "Authentication Required",
        description: "Please sign in to create an interview session.",
        variant: "destructive",
      });
      return;
    }

    if (!formData.jobDescription.trim() || !formData.resume.trim()) {
      toast({
        title: "Missing Information",
        description: "Please provide both job description and resume.",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);

    try {
      toast({
        title: "🤖 Generating Questions",
        description: "Our AI is analyzing your resume and job description to create personalized interview questions.",
      });

      console.log("🚀 Starting AI question generation process...");
      
      // Generate questions using the enhanced AI system
      const aiResult = await generateComprehensiveQuestions(
        formData.jobDescription,
        formData.resume,
        formData.jobTitle,
        formData.companyName
      );

      if (!aiResult.success) {
        console.warn("AI generation had issues:", aiResult.error);
        toast({
          title: "⚠️ Partial Success",
          description: "AI generation encountered issues, using high-quality fallback questions tailored to your role.",
        });
      } else {
        console.log("✅ AI generation successful!");
        toast({
          title: "✅ Questions Generated",
          description: `Successfully generated ${aiResult.questions.length} personalized questions!`,
        });
      }

      const questions = aiResult.questions;

      // Create session with generated questions
      console.log("📝 Creating session with questions...");
      const sessionResponse = await fetch(`/api/sessions`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          jobTitle: formData.jobTitle || "Software Engineer",
          companyName: formData.companyName || "Technology Company", 
          jobDescription: formData.jobDescription,
          resume: formData.resume,
          questions: questions,
        }),
      });

      if (!sessionResponse.ok) {
        throw new Error("Failed to create session");
      }

      const session = await sessionResponse.json();
      console.log("✅ Session created successfully:", session.sessionId);

      // Set up session context
      setCurrentSession(session);
      setSessionProgress({
        currentQuestionIndex: 0,
        completedQuestions: [],
        totalQuestions: questions.length,
        technicalScore: 0,
        behavioralScore: 0,
        codingScore: 0,
      });

      toast({
        title: "🎯 Ready to Start!",
        description: `Your interview session is ready with ${questions.length} questions. Good luck!`,
      });

      onSessionCreated();

    } catch (error: any) {
      console.error("❌ Session creation failed:", error);
      toast({
        title: "Session Creation Failed",
        description: error.message || "Failed to create interview session. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (field: keyof typeof formData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Sparkles className="h-5 w-5 text-blue-500" />
          Create Interview Session
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="jobTitle">Job Title</Label>
              <Input
                id="jobTitle"
                placeholder="e.g., Frontend Developer"
                value={formData.jobTitle}
                onChange={(e) => handleInputChange("jobTitle", e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="companyName">Company Name</Label>
              <Input
                id="companyName"
                placeholder="e.g., Google, Microsoft"
                value={formData.companyName}
                onChange={(e) => handleInputChange("companyName", e.target.value)}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="jobDescription">Job Description *</Label>
            <Textarea
              id="jobDescription"
              placeholder="Paste the complete job description here..."
              value={formData.jobDescription}
              onChange={(e) => handleInputChange("jobDescription", e.target.value)}
              rows={6}
              required
              className="min-h-[150px]"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="resume">Resume *</Label>
            <Textarea
              id="resume"
              placeholder="Paste your resume content here..."
              value={formData.resume}
              onChange={(e) => handleInputChange("resume", e.target.value)}
              rows={8}
              required
              className="min-h-[200px]"
            />
          </div>

          <Button
            type="submit"
            disabled={loading || !formData.jobDescription.trim() || !formData.resume.trim()}
            className="w-full"
            size="lg"
          >
            {loading ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Generating Questions...
              </>
            ) : (
              <>
                <Sparkles className="h-4 w-4 mr-2" />
                Generate Interview Questions
              </>
            )}
          </Button>

          {loading && (
            <div className="text-center text-sm text-muted-foreground">
              <p>🤖 AI is analyzing your information...</p>
              <p>This may take 30-60 seconds</p>
            </div>
          )}
        </form>
      </CardContent>
    </Card>
  );
}