# Local Development Setup Guide

## Quick Start

1. **Install Dependencies**
```bash
npm install
```

2. **Setup Environment**
```bash
cp .env.example .env
# Edit .env with your credentials
```

3. **Setup Database**
```bash
npm run db:push
```

4. **Start Development**
```bash
npm run dev
```

## Required Services

### 1. PostgreSQL Database
You can use:
- Local PostgreSQL installation
- Docker: `docker run --name postgres -e POSTGRES_PASSWORD=password -p 5432:5432 -d postgres`
- Cloud services: Neon, Supabase, AWS RDS

Example DATABASE_URL:
```
DATABASE_URL=postgresql://username:password@localhost:5432/interview_db
```

### 2. Firebase Authentication
1. Go to https://console.firebase.google.com
2. Create new project
3. Enable Authentication → Email/Password and Google
4. Get config from Project Settings → General → Web apps
5. Add to .env file

### 3. OpenRouter API
1. Sign up at https://openrouter.ai
2. Get free API key
3. Add to .env as VITE_OPENROUTER_API_KEY

## Development Workflow

### Frontend (React + Vite)
- Runs on http://localhost:3000
- Hot reload enabled
- Proxies API calls to backend

### Backend (Express + TypeScript)
- Runs on http://localhost:3001
- Auto-restart on changes with tsx watch
- Serves API endpoints

### Database
- PostgreSQL with Drizzle ORM
- Type-safe queries
- Automatic migrations

## Troubleshooting

### Port Already in Use
```bash
# Kill processes on ports 3000 and 3001
npx kill-port 3000 3001
```

### Database Connection Issues
1. Check PostgreSQL is running
2. Verify DATABASE_URL format
3. Ensure database exists
4. Run `npm run db:push` to sync schema

### Firebase Auth Issues
1. Check Firebase config in .env
2. Verify domains in Firebase console
3. Enable required auth providers

### AI Generation Not Working
1. Verify VITE_OPENROUTER_API_KEY is set
2. Check API key is valid at openrouter.ai
3. Monitor browser console for errors

## Production Deployment

### Build
```bash
npm run build
```

### Deploy
The app can be deployed to:
- Vercel (recommended for frontend)
- Railway/Render (for full-stack)
- AWS/Google Cloud
- Any Node.js hosting

### Environment Variables for Production
Set all variables from .env.example in your hosting platform.

## Project Structure
```
├── client/           # Frontend (React + Vite)
├── server/           # Backend (Express + TypeScript)
├── shared/           # Shared types and schemas
├── .env.example      # Environment template
├── package.json      # Dependencies and scripts
└── README.md         # Main documentation
```