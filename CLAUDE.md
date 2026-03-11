# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**Bookaver** — Upload PDFs and have real-time AI voice conversations with them. Users upload a book, the server extracts and segments the text, and Vapi drives a voice conversation using RAG to pull relevant context from the book. Built on Next.js 16 App Router with Clerk auth, MongoDB/Mongoose, Vercel Blob, and Vapi voice AI.

**Live app:** https://bookaver.vercel.app
**GitHub:** https://github.com/caseybattle/Bookaver
**Deployment:** Vercel auto-deploys on every push to `main`. MongoDB Atlas (database).
**Keys/secrets:** stored in `.env.local` (already configured, do not overwrite)

## Deploy Workflow

```bash
git add .
git commit -m "your message"
git push origin main   # Vercel picks this up and auto-deploys
```

## Commands

```bash
npm run dev      # Start dev server (localhost:3000)
npm run build    # Production build (webpack)
npm run start    # Run production server
npm run lint     # ESLint check
```

## Route Structure

```
app/
├── (auth)/              # Public — Clerk sign-in / sign-up pages
└── (root)/              # Protected — requires Clerk auth
    ├── page.tsx         # Home: book library grid + search
    ├── upload/          # Add new book (PDF upload form)
    ├── books/[id]/      # Book detail + voice session UI
    ├── pricing/         # Plan comparison + Clerk pricing table
    └── dashboard/       # Usage / billing overview
app/api/
└── vapi/search-book/    # POST — RAG endpoint called by Vapi during voice calls
```

## Data Models (`lib/db/models/`)

**Book** — metadata per user book:
`clerkId | title | author | blobUrl | coverUrl | totalPages | totalSegments`
Indexed on `clerkId`. Sorted newest-first on reads.

**Segment** — ~500-word text chunks extracted from the PDF:
`bookId | clerkId | content | chunkIndex | pageNumber`
Has a MongoDB full-text index on `content` for RAG keyword search.

**VoiceSession** — tracks each conversation for billing:
`bookId | clerkId | vapiCallId | personaId | startedAt | endedAt | durationSeconds | billingMonth ("YYYY-MM")`
Composite index on `(clerkId, billingMonth)`.

## Server Actions (`lib/actions/`)

All DB/storage mutations are Next.js Server Actions (`"use server"`).

- `book.actions.ts` — `createBook(formData)`, `getBooks(query?)`, `deleteBook(id)`
  - `createBook`: validates PDF → uploads to Vercel Blob at `books/{clerkId}/{ts}-{name}` → fetches cover from OpenLibrary (non-blocking) → saves Book doc → extracts + segments PDF → stores Segments → updates Book.totalSegments
  - `deleteBook`: verifies ownership → cascades: Blob → Segments → Book
- `session.actions.ts` — `startVoiceSession`, `endVoiceSession`, `getMonthlyMinutesUsed`

## Voice AI Flow (`lib/vapi/`)

1. `VOICE_PERSONAS` in `constants.ts` defines Scholar / Storyteller / Coach with their voice IDs
2. `useVapi.ts` hook manages call lifecycle: idle → connecting → listening → thinking → speaking
3. On `start()`: checks plan limits (sessions count + per-session duration), creates VoiceSession doc, calls `vapi.start()` with `{ bookId, title, author }` as variableValues
4. Live transcripts from Vapi events are rendered in real time; session timer auto-stops call at plan duration limit
5. Vapi's `searchBook` tool calls `POST /api/vapi/search-book` with `{ bookId, query }` → MongoDB full-text search → top 5 segments returned as context

## Subscription Plans & Limits (`lib/clerk/billing.ts`)

Plans enforced server-side before book creation and session start. Check via Clerk's `has()` or `publicMetadata.plan`.

| Plan | Books | Sessions/month | Max session duration |
|------|-------|----------------|----------------------|
| Free | 2 | limited | short |
| Standard | 10 | 100/month | 15 min |
| Pro | 20 | unlimited | unlimited |

If limit exceeded → return error → UI redirects to `/pricing`.

**Status:** Auth is integrated. Billing/plan enforcement is not yet fully wired — known gap.

## PDF Processing (`lib/pdf/parser.ts`)

Uses `pdfjs-dist` **legacy build** (required for server-side Node.js compatibility).
`extractAndSegmentPDF(buffer)` → page-by-page text extraction → 500-word chunks → `ParsedSegment[]`

## Key Patterns

- **Lean queries**: Always use `.lean()` on Mongoose reads
- **MongoDB connection**: Global singleton in `lib/db/mongoose.ts` (serverless-safe)
- **`cn()` helper**: `lib/utils.ts` — clsx + tailwind-merge
- **UI components**: `components/ui/` wraps Radix UI with Tailwind v4
- **Notifications**: Sonner toasts for all async feedback
- **Auth guard**: `auth()` from `@clerk/nextjs/server` on every server component; redirect to `/sign-in` if no userId
- **Ownership**: Every DB query must filter by `clerkId` — never query without it
- **Cascade deletes**: Manual cascade order is always Blob → Segments → Book

## Environment Variables

All values are in `.env.local`. Variable names:

```bash
# Clerk (Auth + Billing)
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY
CLERK_SECRET_KEY
NEXT_PUBLIC_CLERK_SIGN_IN_URL
NEXT_PUBLIC_CLERK_SIGN_UP_URL
NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL
NEXT_PUBLIC_CLERK_AFTER_SIGN_UP_URL

# MongoDB Atlas
MONGODB_URI

# Vercel Blob (PDF storage)
BLOB_READ_WRITE_TOKEN

# Vapi (Voice AI)
NEXT_PUBLIC_VAPI_API_KEY
NEXT_PUBLIC_VAPI_ASSISTANT_ID
VAPI_PRIVATE_KEY

# OpenAI (via Vapi — optional direct access)
OPENAI_API_KEY

# App
NEXT_PUBLIC_APP_URL
```

## Tech Stack

| Concern | Library |
|---------|---------|
| Framework | Next.js 16.1.6 (App Router) |
| Language | TypeScript 5 (strict) |
| Auth + Billing | Clerk v6 |
| Database | MongoDB + Mongoose 8 |
| File storage | Vercel Blob |
| PDF extraction | pdfjs-dist v4 (legacy build) |
| Voice AI | Vapi (`@vapi-ai/web` v2) |
| UI components | Radix UI + Tailwind CSS v4 |
| Forms | React Hook Form + ShadCN |
| Notifications | Sonner |
| Theme | next-themes |
| Icons | Lucide React |
| Path alias | `@/*` → repo root |
