import { users, sessions, answers, type User, type InsertUser, type Session, type InsertSession, type Answer, type InsertAnswer, type SessionProgress } from "@shared/schema";

export interface IStorage {
  // User operations
  getUser(id: number): Promise<User | undefined>;
  getUserByFirebaseUid(firebaseUid: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;

  // Session operations
  getSession(id: number): Promise<Session | undefined>;
  getSessionBySessionId(sessionId: string): Promise<Session | undefined>;
  createSession(session: Omit<InsertSession, 'userId' | 'sessionId'> & { userId: number; sessionId: string; questions: any[]; progress: SessionProgress }): Promise<Session>;
  updateSession(id: number, updates: Partial<Session>): Promise<Session>;
  getUserSessions(userId: number): Promise<Session[]>;

  // Answer operations
  getAnswer(id: number): Promise<Answer | undefined>;
  getAnswersBySessionId(sessionId: number): Promise<Answer[]>;
  createAnswer(answer: InsertAnswer): Promise<Answer>;
  updateAnswerSatisfaction(questionId: string, sessionId: number, satisfied: boolean): Promise<Answer>;
}

export class MemStorage implements IStorage {
  private users: Map<number, User>;
  private sessions: Map<number, Session>;
  private answers: Map<number, Answer>;
  private currentUserId: number;
  private currentSessionId: number;
  private currentAnswerId: number;

  constructor() {
    this.users = new Map();
    this.sessions = new Map();
    this.answers = new Map();
    this.currentUserId = 1;
    this.currentSessionId = 1;
    this.currentAnswerId = 1;
  }

  // User operations
  async getUser(id: number): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByFirebaseUid(firebaseUid: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.firebaseUid === firebaseUid,
    );
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = this.currentUserId++;
    const user: User = { 
      ...insertUser, 
      id,
      createdAt: new Date()
    };
    this.users.set(id, user);
    return user;
  }

  // Session operations
  async getSession(id: number): Promise<Session | undefined> {
    return this.sessions.get(id);
  }

  async getSessionBySessionId(sessionId: string): Promise<Session | undefined> {
    return Array.from(this.sessions.values()).find(
      (session) => session.sessionId === sessionId,
    );
  }

  async createSession(sessionData: Omit<InsertSession, 'userId' | 'sessionId'> & { userId: number; sessionId: string; questions: any[]; progress: SessionProgress }): Promise<Session> {
    const id = this.currentSessionId++;
    const now = new Date();
    const session: Session = {
      id,
      userId: sessionData.userId,
      sessionId: sessionData.sessionId,
      jobTitle: sessionData.jobTitle || null,
      companyName: sessionData.companyName || null,
      jobDescription: sessionData.jobDescription,
      resume: sessionData.resume,
      questions: sessionData.questions,
      progress: sessionData.progress,
      completed: false,
      createdAt: now,
      updatedAt: now
    };
    this.sessions.set(id, session);
    return session;
  }

  async updateSession(id: number, updates: Partial<Session>): Promise<Session> {
    const session = this.sessions.get(id);
    if (!session) {
      throw new Error("Session not found");
    }
    
    const updatedSession: Session = {
      ...session,
      ...updates,
      updatedAt: new Date()
    };
    
    this.sessions.set(id, updatedSession);
    return updatedSession;
  }

  async getUserSessions(userId: number): Promise<Session[]> {
    return Array.from(this.sessions.values()).filter(
      (session) => session.userId === userId,
    );
  }

  // Answer operations
  async getAnswer(id: number): Promise<Answer | undefined> {
    return this.answers.get(id);
  }

  async getAnswersBySessionId(sessionId: number): Promise<Answer[]> {
    return Array.from(this.answers.values()).filter(
      (answer) => answer.sessionId === sessionId,
    );
  }

  async createAnswer(insertAnswer: InsertAnswer): Promise<Answer> {
    const id = this.currentAnswerId++;
    const answer: Answer = {
      id,
      sessionId: insertAnswer.sessionId,
      questionId: insertAnswer.questionId,
      userAnswer: insertAnswer.userAnswer || null,
      aiAnswer: insertAnswer.aiAnswer || null,
      evaluation: insertAnswer.evaluation as any || null,
      satisfied: insertAnswer.satisfied || null,
      createdAt: new Date()
    };
    this.answers.set(id, answer);
    return answer;
  }

  async updateAnswerSatisfaction(questionId: string, sessionId: number, satisfied: boolean): Promise<Answer> {
    const answer = Array.from(this.answers.values()).find(
      (a) => a.questionId === questionId && a.sessionId === sessionId
    );
    
    if (!answer) {
      throw new Error("Answer not found");
    }
    
    const updatedAnswer: Answer = {
      ...answer,
      satisfied
    };
    
    this.answers.set(answer.id, updatedAnswer);
    return updatedAnswer;
  }
}

export const storage = new MemStorage();
