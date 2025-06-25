import { useState, useEffect } from "react";
import { Switch, Route } from "wouter";
import { QueryClientProvider } from "@tanstack/react-query";
import { queryClient } from "./lib/queryClient";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import { SessionProvider, useSession } from "@/contexts/SessionContext";
import Landing from "@/components/Landing";
import AuthModal from "@/components/AuthModal";
import Dashboard from "@/components/Dashboard";
import UploadForm from "@/components/UploadForm";
import LoadingScreen from "@/components/LoadingScreen";
import InterviewInterface from "@/components/InterviewInterface";
import NotFound from "@/pages/not-found";

function AppContent() {
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [authType, setAuthType] = useState<"login" | "signup">("login");
  const [currentView, setCurrentView] = useState<
    "landing" | "dashboard" | "upload" | "loading" | "interview"
  >("landing");

  const { user, loading: authLoading } = useAuth();
  const { currentSession } = useSession();

  // Handle authentication state changes
  useEffect(() => {
    if (user && currentView === "landing") {
      setCurrentView("upload");
      setShowAuthModal(false);
    } else if (!user && currentView !== "landing") {
      setCurrentView("landing");
    }
  }, [user, currentView]);

  // Handle session state changes
  useEffect(() => {
    if (currentSession && user) {
      setCurrentView("interview");
    } else if (user && !currentSession && currentView === "interview") {
      setCurrentView("upload");
    }
  }, [currentSession, user, currentView]);

  const handleShowAuth = (type: "login" | "signup") => {
    setAuthType(type);
    setShowAuthModal(true);
  };

  const handleSessionCreated = () => {
    setCurrentView("interview");
  };

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full"></div>
      </div>
    );
  }

  return (
    <>
      {currentView === "landing" && <Landing onShowAuth={handleShowAuth} />}

      {user && currentView === "upload" && (
        <Dashboard>
          <UploadForm onSessionCreated={handleSessionCreated} />
        </Dashboard>
      )}

      {user && currentView === "loading" && (
        <Dashboard>
          <LoadingScreen />
        </Dashboard>
      )}

      {user && currentView === "interview" && currentSession && (
        <Dashboard>
          <InterviewInterface />
        </Dashboard>
      )}

      <AuthModal
        isOpen={showAuthModal}
        onClose={() => setShowAuthModal(false)}
        initialType={authType}
      />
    </>
  );
}

function Router() {
  return (
    <Switch>
      <Route path="/" component={AppContent} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <AuthProvider>
          <SessionProvider>
            <Toaster />
            <Router />
          </SessionProvider>
        </AuthProvider>
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
