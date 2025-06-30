import { pgTable, text, serial, integer, boolean, jsonb, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  email: text("email").notNull().unique(),
  name: text("name").notNull(),
  firebaseUid: text("firebase_uid").notNull().unique(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const sessions = pgTable("sessions", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id).notNull(),
  sessionId: text("session_id").notNull().unique(),
  jobTitle: text("job_title"),
  companyName: text("company_name"),
  jobDescription: text("job_description").notNull(),
  resume: text("resume").notNull(),
  questions: jsonb("questions").$type<Question[]>().default([]),
  progress: jsonb("progress").$type<SessionProgress>().default({
    currentQuestionIndex: 0,
    completedQuestions: [],
    totalQuestions: 0,
    technicalScore: 0,
    behavioralScore: 0,
    codingScore: 0
  }),
  completed: boolean("completed").default(false),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const answers = pgTable("answers", {
  id: serial("id").primaryKey(),
  sessionId: integer("session_id").references(() => sessions.id).notNull(),
  questionId: text("question_id").notNull(),
  userAnswer: text("user_answer"),
  aiAnswer: text("ai_answer"),
  evaluation: jsonb("evaluation").$type<AnswerEvaluation>(),
  satisfied: boolean("satisfied"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export interface Question {
  id: string;
  type: 'technical' | 'behavioral' | 'coding';
  difficulty: 'easy' | 'medium' | 'hard';
  question: string;
  context?: string;
  constraints?: string[];
  examples?: { input: string; output: string; explanation?: string }[];
}

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

export interface SessionProgress {
  currentQuestionIndex: number;
  completedQuestions: string[];
  totalQuestions: number;
  technicalScore: number;
  behavioralScore: number;
  codingScore: number;
}

export interface AnswerEvaluation {
  score: number;
  pros: string[];
  cons: string[];
  suggestions: string[];
  correctness?: number;
  optimization?: number;
  edgeCaseHandling?: number;
}

export const insertUserSchema = createInsertSchema(users).omit({
  id: true,
  createdAt: true,
});

export const insertSessionSchema = createInsertSchema(sessions).omit({
  id: true,
  userId: true,
  sessionId: true,
  questions: true,
  progress: true,
  completed: true,
  createdAt: true,
  updatedAt: true,
});

export const insertAnswerSchema = createInsertSchema(answers).omit({
  id: true,
  createdAt: true,
});

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;
export type InsertSession = z.infer<typeof insertSessionSchema>;
export type Session = typeof sessions.$inferSelect;
export type InsertAnswer = z.infer<typeof insertAnswerSchema>;
export type Answer = typeof answers.$inferSelect;
