import { createContext, useContext, useState, ReactNode } from 'react';
import { Session, Question, SessionProgress, AnswerEvaluation } from '@shared/schema';

interface SessionContextType {
  currentSession: Session | null;
  currentQuestion: Question | null;
  currentQuestionIndex: number;
  sessionProgress: SessionProgress | null;
  setCurrentSession: (session: Session | null) => void;
  setCurrentQuestion: (question: Question | null) => void;
  setCurrentQuestionIndex: (index: number) => void;
  setSessionProgress: (progress: SessionProgress | null) => void;
  getNextQuestion: () => Question | null;
  getPreviousQuestion: () => Question | null;
}

const SessionContext = createContext<SessionContextType | undefined>(undefined);

export function useSession() {
  const context = useContext(SessionContext);
  if (context === undefined) {
    throw new Error('useSession must be used within a SessionProvider');
  }
  return context;
}

interface SessionProviderProps {
  children: ReactNode;
}

export function SessionProvider({ children }: SessionProviderProps) {
  const [currentSession, setCurrentSession] = useState<Session | null>(null);
  const [currentQuestion, setCurrentQuestion] = useState<Question | null>(null);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [sessionProgress, setSessionProgress] = useState<SessionProgress | null>(null);

  const getNextQuestion = (): Question | null => {
    if (!currentSession?.questions || currentQuestionIndex >= currentSession.questions.length - 1) {
      return null;
    }
    return currentSession.questions[currentQuestionIndex + 1];
  };

  const getPreviousQuestion = (): Question | null => {
    if (!currentSession?.questions || currentQuestionIndex <= 0) {
      return null;
    }
    return currentSession.questions[currentQuestionIndex - 1];
  };

  const value: SessionContextType = {
    currentSession,
    currentQuestion,
    currentQuestionIndex,
    sessionProgress,
    setCurrentSession,
    setCurrentQuestion,
    setCurrentQuestionIndex,
    setSessionProgress,
    getNextQuestion,
    getPreviousQuestion,
  };

  return <SessionContext.Provider value={value}>{children}</SessionContext.Provider>;
}
