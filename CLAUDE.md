# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**DontGetCaught.AI** - AI writing tool that generates human-sounding content undetectable by AI detectors. Uses foreign-language source research → literal translation → assembly → GPTZero scanning → humanization loop → polish pipeline. Chat-style conversational UI guides users through prompt → clarification → text type/tone/citations/word count → generation.

**Core pipeline**: Anthropic Claude (claude-sonnet-4-20250514) with web search for source research + GPTZero API for AI detection scanning. Target: 85%+ human score.

## Development Commands

```bash
# Development
npm run dev          # Start development server at http://localhost:3000

# Production
npm run build        # Build for production
npm start            # Start production server

# Code quality
npm run lint         # Run ESLint
```

## Architecture Overview

### Supabase Client Patterns

The project uses **@supabase/ssr** with three distinct client creation patterns:

1. **Browser Client** (`src/lib/supabase/client.ts`)
   - Used in Client Components
   - `createBrowserClient()`

2. **Server Client** (`src/lib/supabase/server.ts`)
   - Used in Server Components and API Routes
   - `createServerClient()` with `next/headers` cookies
   - Handles cookie setting errors gracefully (Server Components)

3. **Middleware Client** (`middleware.ts`)
   - Used for auth checks and session refresh
   - Custom cookie handlers for request/response manipulation
   - DO NOT reuse the server client pattern here

### Authentication & Route Protection

- **Protected routes**: `/dashboard`, `/style-library`, `/new-task`, `/history`, `/settings`
- `middleware.ts` handles:
  - Session refresh on every request
  - Redirect unauthenticated users to `/login`
  - Redirect authenticated users away from `/login` and `/signup`
- Route groups:
  - `(auth)` - Login/Signup pages
  - `(dashboard)` - Protected app pages with shared layout

### Data Flow Pipeline (10 Development Steps)

The project follows a sequential implementation plan (see `spec.md` and README):

**Current status**: Backend APIs merged, chat-style dashboard functional, FaultyTerminal landing page

### API Routes (merged from partner's Express backend)

```
src/app/api/
├── clarify/     # Prompt ambiguity detection (1 question at a time)
├── analyze/     # Pre-generation category analysis (research_based / semi_personal / highly_personal / impossible)
├── generate/    # Core generation — Claude + web search, foreign-language sources → translate → assemble
├── scan/        # GPTZero AI detection scanning
├── humanize/    # Rewrite AI-flagged connective tissue
├── polish/      # Final editing pass
├── extract/     # File text extraction (docx via mammoth, txt)
└── health/      # Health check
```

### Core Modules

```
src/lib/
├── supabase/        # Three client patterns (browser/server/middleware)
├── claude.ts        # Shared Claude API helper with retry logic (429/529 backoff)
└── generation/
    └── ai-checker.ts # Post-generation AI pattern detection (banned words, structural patterns)
```

## Database Schema (Step 2)

When implementing migrations in `supabase/migrations/`:

**Key tables**:
- `style_samples` - Uploaded documents with `detected_language` and `status` fields
- `style_chunks` - Text chunks with `vector(1536)` embeddings (pgvector)
- `style_profiles` - Aggregated user style metrics (JSONB)
- `writing_tasks` + `task_versions` - Generated content with revision history

**Critical**: Enable pgvector extension (`CREATE EXTENSION vector`) before creating chunk tables.

## English-Only Enforcement

Language detection is **mandatory** at multiple checkpoints:

1. **Upload flow** (`style_samples.detected_language`):
   - "en" → proceed to embedding
   - "non_en" → mark `status = 'lang_failed'`, show error
   - "mixed" → suggest user clean samples

2. **Task creation**: Validate prompt/requirements are English

3. **Revision instructions**: Reject non-English revision commands

Use library like `franc` or `langdetect` for detection.

## Style Profile Mechanics

The system extracts **natural imperfections** without intentionally adding errors:

- Sentence length distribution (short/medium/long %)
- Punctuation habits (comma density, em-dash, semicolon)
- Transition phrases ("However", "I think", "Honestly")
- Tone markers (formal vs casual, hedging words)
- Quirks (fragments, contractions, minor tense shifts)

**Readiness threshold**: ~2,000-6,000 English words across samples.

## Environment Variables

Required in `.env.local`:

```env
# Supabase (Step 1)
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=     # For admin operations

# OpenAI (Step 5+)
OPENAI_API_KEY=                # For embeddings + generation
```

## Key Technical Decisions

- **Vector DB**: Supabase pgvector (simplifies stack vs separate Pinecone/Weaviate)
- **LLM**: OpenAI GPT-4o/GPT-4 for style-matching generation
- **Embeddings**: `text-embedding-ada-002` or `text-embedding-3-small` (1536 dim)
- **Parsing**: `mammoth` (docx), `pdf-parse` (pdf)
- **Export**: `docx` library for Word generation

## Important Patterns

### API Route Authentication

```typescript
import { createClient } from '@/lib/supabase/server'

export async function POST(request: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 })
  }
  // ... proceed with authenticated logic
}
```

### Language Detection Example

```typescript
// In Step 4, create lib/language/detector.ts
export function detectLanguage(text: string): 'en' | 'non_en' | 'mixed' {
  // Use franc or langdetect
  // Return 'en' if >90% English, 'non_en' if <50%, else 'mixed'
}
```

### Vector Search Pattern (Step 7)

```sql
-- In Supabase, use pgvector's cosine similarity operator
SELECT chunk_text, embedding <=> $1 AS distance
FROM style_chunks
WHERE user_id = $2
ORDER BY distance
LIMIT 5;
```

## Development Workflow

1. Implement features following the 10-step plan sequentially
2. Each step builds on previous infrastructure (don't skip ahead)
3. Test language detection thoroughly (edge cases: mixed content, code snippets)
4. Monitor OpenAI API costs (embeddings + generation tokens)
5. Use Supabase Dashboard SQL Editor for quick migration testing

## References

- Full specification: `spec.md`
- Development progress: README.md "开发步骤进度" section
- Detailed implementation plan: `C:\Users\jzhang23\.claude\plans\twinkly-wandering-comet.md`

## 版本记录规范

### 存档（当我说"存档"或"提交"时）
1. 运行 git diff 检查本次改动
2. 执行 git add . 和 git commit（根据改动自动生成备注）
3. 在 CHANGELOG.md 顶部添加记录，格式：
   ## YYYY-MM-DD HH:mm
   - 改动内容

### 回退（当我说"回退"或"撤销"时）
1. 先告诉我会回退到哪个版本（显示上一次的提交信息）
2. 等我确认后再执行回退
3. 回退后在 CHANGELOG.md 顶部记录：
   ## YYYY-MM-DD HH:mm
   - 回退：撤销了 xxx 改动

### 查看历史（当我说"历史"或"记录"时）
显示最近 5 次提交的简要信息