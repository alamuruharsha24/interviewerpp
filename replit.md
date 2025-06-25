# InterviewGenie - AI-Powered Interview Preparation Platform

## Overview

InterviewGenie is a full-stack web application that helps users prepare for job interviews through AI-powered question generation and evaluation. The platform analyzes user resumes and job descriptions to create personalized interview questions, provides intelligent feedback, and tracks performance across technical, behavioral, and coding challenges.

## System Architecture

### Frontend Architecture
- **Framework**: React 18 with TypeScript
- **Routing**: Wouter for client-side routing
- **State Management**: React Context API with custom hooks for authentication and session management
- **UI Components**: Shadcn/ui component library built on Radix UI primitives
- **Styling**: Tailwind CSS with CSS variables for theming
- **Data Fetching**: TanStack Query (React Query) for server state management
- **Build Tool**: Vite for development and production builds

### Backend Architecture
- **Runtime**: Node.js with Express.js server
- **Language**: TypeScript with ES modules
- **Database**: PostgreSQL with Drizzle ORM for type-safe database operations
- **Database Hosting**: Neon Database (serverless PostgreSQL)
- **Session Management**: Connect-pg-simple for PostgreSQL-backed sessions
- **Development**: Hot module replacement with Vite integration

### Authentication System
- **Provider**: Firebase Authentication
- **Methods**: Google OAuth and email/password authentication
- **Flow**: Firebase handles authentication, backend syncs user data to PostgreSQL
- **Session**: Server-side session management with PostgreSQL storage

## Key Components

### Database Schema
- **Users**: Stores user profiles with Firebase UID mapping
- **Sessions**: Interview preparation sessions with job details and questions
- **Answers**: User responses with AI evaluations and satisfaction tracking
- **Questions**: Structured interview questions with type, difficulty, and context

### AI Integration
- **Provider**: OpenRouter API with DeepSeek R1 model
- **Capabilities**:
  - Question generation based on job description and resume analysis
  - Answer evaluation with scoring and feedback
  - Code review and technical assessment
  - Behavioral response analysis

### Core Features
1. **Question Generation**: AI analyzes resume and job description to create personalized questions
2. **Interview Simulation**: Three-tab interface for questionary, coding, and results
3. **Real-time Evaluation**: Instant AI feedback on answers with scoring
4. **Progress Tracking**: Session-based progress monitoring and statistics
5. **Code Challenges**: Interactive coding environment with test cases

## Data Flow

1. **User Authentication**: Firebase handles auth, backend syncs user data
2. **Session Creation**: User uploads resume/job description, AI generates questions
3. **Interview Process**: User answers questions across different categories
4. **AI Evaluation**: Responses are evaluated by AI with detailed feedback
5. **Results Analysis**: Performance metrics and improvement suggestions provided

## External Dependencies

### Core Dependencies
- **Database**: Neon PostgreSQL, Drizzle ORM
- **Authentication**: Firebase Auth
- **AI Service**: OpenRouter (DeepSeek R1 model)
- **UI Framework**: React, Shadcn/ui, Radix UI
- **Styling**: Tailwind CSS
- **Development**: Vite, TypeScript

### Key Libraries
- `@tanstack/react-query` for server state management
- `drizzle-orm` and `@neondatabase/serverless` for database operations
- `firebase` for authentication services
- `wouter` for lightweight routing
- `lucide-react` for icons

## Deployment Strategy

### Development Environment
- **Platform**: Local development with Node.js 18+
- **Port Configuration**: Frontend on port 3000, backend on port 3001
- **Hot Reload**: Vite development server with HMR enabled
- **Database**: PostgreSQL (local or hosted)

### Production Build
- **Build Process**: Vite builds client assets, esbuild bundles server code
- **Static Assets**: Client built to `dist/public`, server to `dist/index.js`
- **Deployment Target**: Any Node.js hosting platform
- **Environment Variables**: Firebase config, OpenRouter API key, database URL required

### Build Commands
- `npm run dev`: Start both frontend and backend development servers
- `npm run dev:client`: Start only frontend development server
- `npm run dev:server`: Start only backend development server
- `npm run build`: Production build for both client and server
- `npm run start`: Production server startup
- `npm run db:push`: Database schema deployment

## Changelog

Changelog:
- June 24, 2025. Initial setup
- June 24, 2025. Fixed OpenRouter API authentication issues and implemented fallback question generation system
- June 24, 2025. Resolved timeout issues, improved JSON parsing, and optimized AI response handling
- June 24, 2025. Successfully migrated project from Replit Agent to Replit environment
- June 24, 2025. Fixed server binding configuration for Replit compatibility (0.0.0.0 instead of localhost)
- June 24, 2025. Resolved coding questions display issue in CodingTabEnhanced component
- June 24, 2025. Fixed undefined variable error in UploadForm fallback question generation
- June 24, 2025. Successfully migrated from Replit Agent to Replit environment with proper server binding and coding question display fixes
- June 25, 2025. Configured for local development with separate frontend/backend servers and improved AI question generation
- June 25, 2025. Added project download functionality and pushed complete codebase to Git repository

## User Preferences

Preferred communication style: Simple, everyday language.