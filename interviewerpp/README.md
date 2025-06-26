# InterviewGenie - AI-Powered Interview Preparation Platform

A comprehensive interview preparation application that generates personalized questions based on job descriptions and resumes using AI.

## Features

- **AI Question Generation**: 100 personalized questions (85 questionary + 15 coding)
- **Company-Specific Questions**: Tailored to FAANG, startups, enterprise companies
- **Real-time Evaluation**: AI feedback on answers with scoring
- **Coding Environment**: Interactive coding challenges with multiple difficulties
- **Session Management**: Save and resume interview sessions
- **Firebase Authentication**: Secure user authentication

## Tech Stack

- **Frontend**: React 18, TypeScript, Vite
- **Backend**: Node.js, Express, TypeScript
- **Database**: PostgreSQL with Drizzle ORM
- **UI**: Tailwind CSS, Shadcn/ui
- **AI**: OpenRouter with DeepSeek R1 model
- **Authentication**: Firebase Auth

## Setup Instructions

### Prerequisites

- Node.js 18+ 
- PostgreSQL database
- Firebase project
- OpenRouter API key

### 1. Clone and Install

```bash
git clone <your-repo-url>
cd interview-preparation-app
npm install
```

### 2. Environment Configuration

Copy `.env.example` to `.env` and fill in your credentials:

```bash
cp .env.example .env
```

Required environment variables:
- `DATABASE_URL`: PostgreSQL connection string
- `VITE_OPENROUTER_API_KEY`: Get from https://openrouter.ai
- Firebase config variables (get from Firebase console)
- `SESSION_SECRET`: Random string for session encryption

### 3. Database Setup

```bash
npm run db:push
```

### 4. Firebase Setup

1. Create a Firebase project at https://console.firebase.google.com
2. Enable Authentication with Email/Password and Google providers
3. Get your Firebase config from Project Settings
4. Add the config values to your `.env` file

### 5. OpenRouter API Setup

1. Sign up at https://openrouter.ai
2. Get your API key from the dashboard
3. Add it to your `.env` file as `VITE_OPENROUTER_API_KEY`

### 6. Start Development

```bash
npm run dev
```

This will start:
- Frontend server at http://localhost:3000
- Backend server at http://localhost:3001

## Question Structure

The AI generates exactly 100 questions with this distribution:

**Questionary Section (85 questions):**
- 60 Technical: 20 easy, 20 medium, 20 hard
- 25 Behavioral: leadership, teamwork, problem-solving

**Coding Section (15 questions):**
- 5 Easy: basic algorithms, string manipulation
- 5 Medium: data structures, tree/graph traversal
- 5 Hard: advanced algorithms, optimization

## Usage

1. **Sign Up/Login**: Create account with email or Google
2. **Upload Details**: Add job description, resume, company info
3. **AI Generation**: System generates personalized questions
4. **Interview Practice**: Answer questions with AI assistance
5. **Get Feedback**: Receive detailed AI evaluation
6. **Review Results**: Track progress and improvements

## Project Structure

```
├── client/                 # Frontend React application
│   ├── src/
│   │   ├── components/     # Reusable UI components
│   │   ├── contexts/       # React contexts for state
│   │   ├── lib/            # Utilities and API clients
│   │   └── pages/          # Application pages
├── server/                 # Backend Express application
│   ├── db/                 # Database schema and migrations
│   └── routes/             # API route handlers
├── shared/                 # Shared types and schemas
└── public/                 # Static assets
```

## API Endpoints

- `POST /api/users` - Create/update user
- `POST /api/sessions` - Create interview session
- `GET /api/sessions/:id` - Get session details
- `POST /api/answers` - Submit answer
- `POST /api/answers/:id/evaluate` - Get AI evaluation

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## License

MIT License - see LICENSE file for details