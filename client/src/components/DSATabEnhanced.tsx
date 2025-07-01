import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { 
  Code2, 
  Brain, 
  ExternalLink, 
  Clock, 
  MemoryStick, 
  Building2, 
  Loader2, 
  Sparkles,
  Search,
  Filter,
  Target
} from "lucide-react";

// Import types and data
import type { DSAQuestion } from "@/lib/dsaQuestionGenerator";
import { TOP_COMPANIES } from "@/lib/dsaQuestionGenerator";

export default function DSATabEnhanced() {
  const { toast } = useToast();
  const [questions, setQuestions] = useState<DSAQuestion[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedCompany, setSelectedCompany] = useState<string>("");
  const [customCompany, setCustomCompany] = useState<string>("");
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [difficultyFilter, setDifficultyFilter] = useState<string>("all");
  const [topicFilter, setTopicFilter] = useState<string>("all");

  // Filter questions based on search and filters
  const filteredQuestions = questions.filter(question => {
    const matchesSearch = question.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         question.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         question.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()));
    
    const matchesDifficulty = difficultyFilter === "all" || question.difficulty === difficultyFilter;
    
    const matchesTopic = topicFilter === "all" || 
                        question.topic.toLowerCase().includes(topicFilter.toLowerCase()) ||
                        question.tags.some(tag => tag.toLowerCase().includes(topicFilter.toLowerCase()));

    return matchesSearch && matchesDifficulty && matchesTopic;
  });

  // Get unique topics for filter
  const uniqueTopics = Array.from(
    new Set(
      questions.flatMap(q => 
        q.topic.split(',').map(t => t.trim()).concat(q.tags)
      )
    )
  ).sort();

  const handleGenerateQuestions = async () => {
    const companyName = customCompany.trim() || selectedCompany;
    
    if (!companyName) {
      toast({
        title: "Company Required",
        description: "Please select a company or enter a custom company name.",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    
    try {
      toast({
        title: "🤖 Generating DSA Questions",
        description: `Creating ${companyName}-specific coding questions tailored to their interview patterns...`,
      });

      const response = await fetch('/api/dsa/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ companyName }),
      });

      if (!response.ok) {
        throw new Error('Failed to generate DSA questions');
      }

      const data = await response.json();
      
      if (data.success) {
        toast({
          title: "✅ Questions Generated!",
          description: `Successfully generated ${data.questions.length} ${companyName}-specific DSA questions.`,
        });
      } else {
        toast({
          title: "⚠️ Partial Success",
          description: `Generated questions with fallbacks. ${data.questions.length} questions available.`,
        });
      }

      setQuestions(data.questions);

    } catch (error: any) {
      console.error('DSA generation error:', error);
      toast({
        title: "Generation Failed",
        description: error.message || "Failed to generate DSA questions. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleQuestionClick = (question: DSAQuestion) => {
    // Prefer LeetCode, fallback to GFG
    const url = question.leetcodeUrl || question.gfgUrl;
    if (url) {
      window.open(url, '_blank', 'noopener,noreferrer');
    } else {
      toast({
        title: "No URL Available",
        description: "This question doesn't have an associated LeetCode or GeeksforGeeks link.",
        variant: "destructive",
      });
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

  const getFrequencyColor = (frequency: string) => {
    switch (frequency) {
      case 'Very High': return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300';
      case 'High': return 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-300';
      case 'Medium': return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300';
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300';
    }
  };

  return (
    <div className="space-y-6">
      {/* Company Selection and Generation */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Building2 className="h-5 w-5 text-blue-500" />
            Company-Specific DSA Questions Generator
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="company-select">Select Top Company</Label>
              <Select
                value={selectedCompany}
                onValueChange={(value) => {
                  setSelectedCompany(value);
                  setCustomCompany(""); // Clear custom when selecting from list
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Choose a company..." />
                </SelectTrigger>
                <SelectContent>
                  {TOP_COMPANIES.map((company) => (
                    <SelectItem key={company} value={company}>
                      {company}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="custom-company">Or Enter Custom Company</Label>
              <Input
                id="custom-company"
                placeholder="e.g., Stripe, Databricks, ByteDance..."
                value={customCompany}
                onChange={(e) => {
                  setCustomCompany(e.target.value);
                  if (e.target.value.trim()) {
                    setSelectedCompany(""); // Clear selection when typing custom
                  }
                }}
              />
            </div>
          </div>

          <Button
            onClick={handleGenerateQuestions}
            disabled={loading || (!selectedCompany && !customCompany.trim())}
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
                Generate 30+ DSA Questions
              </>
            )}
          </Button>

          {loading && (
            <div className="text-center text-sm text-muted-foreground">
              <p>🤖 AI is analyzing {customCompany || selectedCompany} interview patterns...</p>
              <p>This may take 30-60 seconds</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Search and Filters */}
      {questions.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Filter className="h-5 w-5" />
              Search & Filter Questions
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="search">Search Questions</Label>
                <div className="relative">
                  <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="search"
                    placeholder="Search by title, description, or tags..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-8"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="difficulty-filter">Difficulty</Label>
                <Select value={difficultyFilter} onValueChange={setDifficultyFilter}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Difficulties</SelectItem>
                    <SelectItem value="easy">Easy</SelectItem>
                    <SelectItem value="medium">Medium</SelectItem>
                    <SelectItem value="hard">Hard</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="topic-filter">Topic</Label>
                <Select value={topicFilter} onValueChange={setTopicFilter}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Topics</SelectItem>
                    {uniqueTopics.slice(0, 20).map((topic) => (
                      <SelectItem key={topic} value={topic.toLowerCase()}>
                        {topic}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Target className="h-4 w-4" />
              Showing {filteredQuestions.length} of {questions.length} questions
            </div>
          </CardContent>
        </Card>
      )}

      {/* Questions List */}
      {filteredQuestions.length > 0 && (
        <div className="grid gap-4">
          {filteredQuestions.map((question) => (
            <Card 
              key={question.id} 
              className="cursor-pointer hover:shadow-md transition-shadow"
              onClick={() => handleQuestionClick(question)}
            >
              <CardContent className="p-6">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 space-y-2">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="font-semibold text-lg">{question.title}</h3>
                      <Badge className={getDifficultyColor(question.difficulty)}>
                        {question.difficulty}
                      </Badge>
                      {question.companyFrequency && (
                        <Badge className={getFrequencyColor(question.companyFrequency)}>
                          {question.companyFrequency}
                        </Badge>
                      )}
                      <ExternalLink className="h-4 w-4 text-muted-foreground ml-auto" />
                    </div>

                    <p className="text-muted-foreground text-sm leading-relaxed">
                      {question.description}
                    </p>

                    <div className="flex items-center gap-4 text-xs text-muted-foreground">
                      {question.timeComplexity && (
                        <div className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          <span>Time: {question.timeComplexity}</span>
                        </div>
                      )}
                      {question.spaceComplexity && (
                        <div className="flex items-center gap-1">
                          <MemoryStick className="h-3 w-3" />
                          <span>Space: {question.spaceComplexity}</span>
                        </div>
                      )}
                    </div>

                    <div className="flex flex-wrap gap-1">
                      {question.tags.slice(0, 5).map((tag, index) => (
                        <Badge key={index} variant="outline" className="text-xs">
                          {tag}
                        </Badge>
                      ))}
                    </div>

                    <div className="flex items-center gap-4 pt-2">
                      {question.leetcodeUrl && (
                        <Badge variant="outline" className="text-xs bg-orange-50 text-orange-700 dark:bg-orange-950 dark:text-orange-300">
                          LeetCode
                        </Badge>
                      )}
                      {question.gfgUrl && (
                        <Badge variant="outline" className="text-xs bg-green-50 text-green-700 dark:bg-green-950 dark:text-green-300">
                          GeeksforGeeks
                        </Badge>
                      )}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Empty State */}
      {questions.length === 0 && !loading && (
        <Card>
          <CardContent className="p-12 text-center">
            <Code2 className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">No DSA Questions Yet</h3>
            <p className="text-muted-foreground mb-4">
              Select a company and generate AI-powered DSA questions tailored to their interview patterns.
            </p>
            <p className="text-sm text-muted-foreground">
              Questions will include direct links to LeetCode and GeeksforGeeks for practice.
            </p>
          </CardContent>
        </Card>
      )}

      {/* No Results State */}
      {questions.length > 0 && filteredQuestions.length === 0 && (
        <Card>
          <CardContent className="p-12 text-center">
            <Search className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">No Questions Found</h3>
            <p className="text-muted-foreground mb-4">
              No questions match your current search and filter criteria.
            </p>
            <Button 
              variant="outline" 
              onClick={() => {
                setSearchTerm("");
                setDifficultyFilter("all");
                setTopicFilter("all");
              }}
            >
              Clear Filters
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}