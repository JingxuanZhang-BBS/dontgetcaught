# CLAUDE.md

This file provides guidance to Claude Code when working with code in this repository.

## Project Overview

**DontGetCaught.AI** — multilingual AI humanizer. Rewrites AI-generated content to pass detection by GPTZero, Turnitin, and Originality.ai with >85% human score.

Live: [dontgetcaught.vercel.app](https://dontgetcaught.vercel.app)

## Development Commands

```bash
npm run dev      # Start dev server at http://localhost:3000
npm run build    # Production build
npm run lint     # ESLint
```

## Architecture

### Supabase Client Patterns

Three distinct patterns — do not mix them:

1. **Browser client** (`src/lib/supabase/client.ts`) — Client Components only
2. **Server client** (`src/lib/supabase/server.ts`) — Server Components and API Routes
3. **Middleware client** (`middleware.ts`) — auth checks and session refresh only

### Authentication

- Protected routes: all routes except `/`, `/login`, `/signup`, `/forgot-password`, `/reset-password`
- `middleware.ts` handles session refresh, unauthenticated redirects to `/login`, authenticated redirects away from auth pages
- Static files in `public/` (including `demo.html`) are protected via `/api/auth/check` endpoint called client-side — middleware alone is unreliable for static files

### API Routes

```
src/app/api/
├── generate/       # Core generation entry point — deducts 1 credit
├── scan/           # GPTZero AI detection scoring
├── humanize/       # Internal refinement — called by generate, no credit deduction
├── transplant/     # Standalone humanize tab — deducts 1 credit
├── polish/         # Final editing pass
├── clarify/        # Prompt ambiguity detection
├── analyze/        # Pre-generation analysis
├── extract/        # File text extraction (docx via mammoth, txt)
├── fun-facts/      # Loading screen fun facts
├── history/        # User task history
├── tasks/          # Task CRUD
├── samples/        # Style sample management
├── auth/           # Session check + signout
├── account/        # User account management
├── redeem/         # Credit redemption
├── refund/         # Credit refund
└── health/         # Health check
```

### Credit System

- Each user gets 10 credits on signup
- `/api/generate` and `/api/transplant` each deduct 1 credit
- `/api/humanize` does NOT deduct (internal sub-step, not user-triggered)
- Credits tracked in `user_credits` table in Supabase

### Rate Limiting

Rate limits enforced per user via `rate_limits` table in Supabase.

### Authentication Pattern for API Routes

```typescript
import { createClient } from '@/lib/supabase/server'

export async function POST(request: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 })
  // proceed
}
```

## Environment Variables

Required in `.env.local`:

```env
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
ANTHROPIC_API_KEY=
GPTZERO_API_KEY=
NEXT_PUBLIC_DEV_MODE=false
```

`NEXT_PUBLIC_DEV_MODE=true` bypasses all auth — only for local dev, never in production.

## Version Control Workflow

When committing:
1. Run `git diff` to review changes
2. `git add` specific files (avoid `git add -A` to prevent accidentally staging `.env.local`)
3. Write a clear commit message

When rolling back:
1. Show which commit we'd revert to before doing anything
2. Wait for confirmation
3. Record the rollback in CHANGELOG.md
