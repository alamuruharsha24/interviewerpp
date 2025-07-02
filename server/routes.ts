import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertUserSchema, insertSessionSchema, insertAnswerSchema } from "@shared/schema";
import { nanoid } from "nanoid";
import { generateDSAQuestions } from "./openai";

export async function registerRoutes(app: Express): Promise<Server> {
  // User routes
  app.post("/api/users", async (req, res) => {
    try {
      const userData = insertUserSchema.parse(req.body);
      
      // Check if user already exists
      const existingUser = await storage.getUserByFirebaseUid(userData.firebaseUid);
      if (existingUser) {
        return res.json(existingUser);
      }
      
      const user = await storage.createUser(userData);
      res.json(user);
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  app.get("/api/users/:firebaseUid", async (req, res) => {
    try {
      const user = await storage.getUserByFirebaseUid(req.params.firebaseUid);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      res.json(user);
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  // Session routes
  app.post("/api/sessions", async (req, res) => {
    try {
      // For now, we'll use a hardcoded user ID
      // In a real app, you'd extract this from the authenticated user
      const userId = 1; // This should come from authentication middleware
      
      const sessionData = insertSessionSchema.parse(req.body);
      const sessionId = nanoid();
      
      const session = await storage.createSession({
        ...sessionData,
        userId,
        sessionId,
        questions: req.body.questions || [],
        progress: {
          currentQuestionIndex: 0,
          completedQuestions: [],
          totalQuestions: req.body.questions?.length || 0,
          technicalScore: 0,
          behavioralScore: 0,
          codingScore: 0
        }
      });
      
      res.json(session);
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  app.get("/api/sessions/:id", async (req, res) => {
    try {
      const session = await storage.getSession(parseInt(req.params.id));
      if (!session) {
        return res.status(404).json({ message: "Session not found" });
      }
      res.json(session);
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  app.get("/api/sessions/:id/answers", async (req, res) => {
    try {
      const answers = await storage.getAnswersBySessionId(parseInt(req.params.id));
      res.json(answers);
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  app.patch("/api/sessions/:id", async (req, res) => {
    try {
      const session = await storage.updateSession(parseInt(req.params.id), req.body);
      res.json(session);
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  // Answer routes
  app.post("/api/answers", async (req, res) => {
    try {
      const answerData = insertAnswerSchema.parse(req.body);
      const answer = await storage.createAnswer(answerData);
      res.json(answer);
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  app.patch("/api/answers/:questionId", async (req, res) => {
    try {
      const { sessionId, satisfied } = req.body;
      const answer = await storage.updateAnswerSatisfaction(req.params.questionId, sessionId, satisfied);
      res.json(answer);
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  app.get("/api/answers/:id", async (req, res) => {
    try {
      const answer = await storage.getAnswer(parseInt(req.params.id));
      if (!answer) {
        return res.status(404).json({ message: "Answer not found" });
      }
      res.json(answer);
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  // DSA Questions route - Company-specific generation
  app.post("/api/dsa/generate", async (req, res) => {
    try {
      console.log("DSA generation request received:", req.body);
      const { companyName } = req.body;
      
      if (!companyName || typeof companyName !== 'string' || companyName.trim() === '') {
        console.log("Invalid company name:", companyName);
        return res.status(400).json({ error: "Company name is required and must be a non-empty string" });
      }

      // Import the DSA generator
      const { generateCompanySpecificDSAQuestions } = await import('./dsaQuestionGenerator');
      
      console.log(`🚀 Generating DSA questions for company: ${companyName}`);
      const result = await generateCompanySpecificDSAQuestions(companyName.trim());
      
      if (!result.success) {
        console.warn(`⚠️ DSA generation had issues: ${result.error}`);
      } else {
        console.log(`✅ Successfully generated ${result.questions.length} DSA questions`);
      }
      
      res.json({ 
        questions: result.questions,
        success: result.success,
        company: companyName.trim() 
      });
    } catch (error: any) {
      console.error("❌ DSA generation error:", error);
      res.status(500).json({ error: error.message });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
