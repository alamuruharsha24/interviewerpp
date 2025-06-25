import { Brain, Code, TrendingUp, Play } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface LandingProps {
  onShowAuth: (type: 'login' | 'signup') => void;
}

export default function Landing({ onShowAuth }: LandingProps) {
  return (
    <div className="min-h-screen bg-background">
      {/* Navigation Header */}
      <nav className="border-b border-border bg-background/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
                <Brain className="h-4 w-4 text-primary-foreground" />
              </div>
              <span className="text-xl font-bold text-foreground">InterviewGenie</span>
            </div>
            <div className="flex items-center space-x-4">
              <Button variant="ghost" onClick={() => onShowAuth('login')}>
                Sign In
              </Button>
              <Button onClick={() => onShowAuth('signup')}>
                Get Started
              </Button>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-br from-background to-muted/30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 lg:py-32">
          <div className="text-center">
            <h1 className="text-5xl lg:text-7xl font-bold text-foreground mb-6 leading-tight">
              Nail Your
              <span className="text-primary block">Dream Interview</span>
            </h1>
            <p className="text-xl text-muted-foreground mb-10 max-w-3xl mx-auto leading-relaxed">
              AI-powered interview preparation that analyzes your resume and job description to generate personalized questions, provide intelligent feedback, and boost your confidence.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
              <Button size="lg" className="text-lg px-8 py-6" onClick={() => onShowAuth('signup')}>
                Start Preparing Now
              </Button>
              <Button variant="outline" size="lg" className="text-lg px-8 py-6">
                <Play className="h-5 w-5 mr-2" />
                Watch Demo
              </Button>
            </div>
          </div>
        </div>
        
        {/* Feature Cards */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-20">
          <div className="grid md:grid-cols-3 gap-8">
            <div className="bg-card p-8 rounded-2xl shadow-lg border border-border hover:shadow-xl transition-shadow">
              <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center mb-6">
                <Brain className="h-6 w-6 text-primary" />
              </div>
              <h3 className="text-xl font-semibold mb-4 text-card-foreground">AI-Generated Questions</h3>
              <p className="text-muted-foreground">Get personalized technical and behavioral questions based on your resume and target job description.</p>
            </div>
            <div className="bg-card p-8 rounded-2xl shadow-lg border border-border hover:shadow-xl transition-shadow">
              <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center mb-6">
                <Code className="h-6 w-6 text-green-600" />
              </div>
              <h3 className="text-xl font-semibold mb-4 text-card-foreground">Coding Practice</h3>
              <p className="text-muted-foreground">Practice coding problems with our built-in editor and get AI-powered feedback on your solutions.</p>
            </div>
            <div className="bg-card p-8 rounded-2xl shadow-lg border border-border hover:shadow-xl transition-shadow">
              <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center mb-6">
                <TrendingUp className="h-6 w-6 text-purple-600" />
              </div>
              <h3 className="text-xl font-semibold mb-4 text-card-foreground">Detailed Feedback</h3>
              <p className="text-muted-foreground">Receive comprehensive feedback with pros, cons, and suggestions to improve your answers.</p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
