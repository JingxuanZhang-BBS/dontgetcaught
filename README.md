# DontGetCaught.AI

**AI humanizer that achieves >85% human detection bypass rate across GPTZero, Turnitin, and Originality.ai.**

Live at: [dontgetcaught.vercel.app](https://dontgetcaught.vercel.app)

---

## What It Does

DontGetCaught.AI rewrites AI-generated content to pass human detection. Upload a document or paste text, and the system runs it through a multi-stage refinement pipeline that produces output indistinguishable from human writing — while preserving meaning, tone, and citations.

Supports English, Mandarin, Spanish, French, German, and Japanese.

---

## Features

- **Multilingual support** — processes content across 6 languages
- **Real-time AI score feedback** — scans output with GPTZero after each refinement round
- **Multiple content types** — academic essays, blog posts, op-eds, business reports, and more
- **Citation grounding** — preserves factual integrity through the humanization process
- **File upload** — accepts .docx and .txt input
- **Credit system** — tracks usage per user
- **Full auth** — email/password login, email verification, password reset
- **User history** — all generated content saved per account

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | Next.js 15 (App Router) |
| Language | TypeScript |
| Database & Auth | Supabase (PostgreSQL + RLS) |
| AI | Anthropic Claude API |
| AI Detection | GPTZero API |
| Styling | Tailwind CSS |
| Deployment | Vercel |

---

## Getting Started

### 1. Clone and install

```bash
git clone https://github.com/JingxuanZhang-BBS/dontgetcaught.git
cd dontgetcaught
npm install
```

### 2. Set up Supabase

Create a project at [supabase.com](https://supabase.com) and run the migrations in `supabase/migrations/`.

### 3. Configure environment variables

Create `.env.local` from `.env.example`:

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key
ANTHROPIC_API_KEY=your_anthropic_api_key
GPTZERO_API_KEY=your_gptzero_api_key
NEXT_PUBLIC_DEV_MODE=false
```

### 4. Run

```bash
npm run dev   # http://localhost:3000
```

---

## Project Structure

```
src/
├── app/
│   ├── (auth)/          # Login, signup, password reset
│   ├── api/             # All API routes
│   │   ├── generate/    # Core generation endpoint
│   │   ├── scan/        # GPTZero detection scoring
│   │   ├── humanize/    # Refinement loop
│   │   ├── polish/      # Final editing pass
│   │   ├── clarify/     # Prompt disambiguation
│   │   ├── analyze/     # Pre-generation analysis
│   │   └── extract/     # File text extraction
│   └── page.tsx         # Landing page
├── components/          # React components
└── lib/
    ├── supabase/        # Browser, server, and middleware clients
    └── claude.ts        # Anthropic API helper with retry logic
public/
└── demo.html            # Main product UI
```

---

## Built by

[Jeffrey Zhang](https://linkedin.com/in/jingxuan-zhang) — Babson College '28  
Solo-built from zero. Commercially live.
