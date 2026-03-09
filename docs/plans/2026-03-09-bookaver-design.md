# Bookaver — Product Requirements Document & Architecture Design
**Date:** 2026-03-09
**Owner:** Casey Battle
**Status:** Approved → Implementation
**Source:** JSMastery "Right Way to Build AI Apps in 2026" tutorial (adapted)

---

## 1. Product Overview

Bookaver is a web application that lets users upload PDF books, choose a voice persona, and have real-time AI-powered voice conversations with the book's content using Retrieval-Augmented Generation (RAG) and Vapi voice AI.

### Core User Flow
1. User signs up / signs in (Clerk)
2. User uploads a PDF book → stored in Vercel Blob, text extracted + segmented into MongoDB
3. User selects a voice persona from a curated list
4. User starts a voice session → Vapi connects, RAG endpoint retrieves relevant segments on query
5. Billing enforces session limits per plan tier

---

## 2. Architecture Decision

**Chosen:** Approach A — Single Next.js 16 App Router monorepo

**Rationale:** Matches tutorial architecture, simplest deployment path (Vercel), server actions keep sensitive logic server-side, easiest for agents to slot into stubs.

---

## 3. Tech Stack

| Layer | Technology |
|---|---|
| Framework | Next.js 16, App Router, TypeScript |
| Auth + Billing | Clerk (useAuth, auth(), has(), PricingTable) |
| Database | MongoDB Atlas + Mongoose |
| File Storage | Vercel Blob |
| PDF Parsing | pdfjs-dist |
| Voice AI | Vapi (@vapi-ai/web) — stubbed, keys wired via .env |
| LLM | GPT-4o mini via Vapi |
| Voice Provider | ElevenLabs (eleven_turbo_v2_5) |
| UI | shadcn/ui + Tailwind CSS |
| Toasts | sonner |
| Deployment | Vercel |

---

## 4. Scope (What Gets Built Now)

### ✅ In Scope
- Full Next.js 16 project scaffold (App Router, TypeScript, Tailwind, shadcn/ui)
- MongoDB models: Book, Segment, VoiceSession + DB singleton
- Clerk auth integration: sign-in, sign-up, dashboard protection
- Clerk billing: PLAN_LIMITS config, getUserPlan(), PricingTable page
- Server actions: createBook (with clerkId server-resolved security fix), startVoiceSession
- PDF parsing + segmentation (pdfjs-dist, ~500-word chunks, MongoDB text index)
- Vercel Blob upload
- RAG API route stub (`/api/vapi/search-book`) — typed, documented, ready for implementation
- Vapi hook stub (`useVapi`) — typed interface, event handlers wired, key loaded from env
- Voice persona constants (VOICE_PERSONAS with ElevenLabs voice IDs)
- UI components: HomePage, SearchBar, UploadForm, BookCard, MicrophoneButton (animate-ping), Dashboard, PricingPage
- next.config.js with 100mb server action body limit
- .env.local with all required keys

### ⏳ Deferred (Agent/Casey handles)
- RAG endpoint full implementation (vector search logic)
- Vapi assistant configuration in Vapi dashboard
- Clerk dashboard plan setup (Standard $9.99, Pro $19.99)
- MongoDB Atlas cluster creation + IP whitelist
- Vercel deployment + domain config
- CodeRabbit PR review setup

---

## 5. Data Models

### Book
```
clerkId: String (server-resolved, never client-supplied)
title: String
author: String
coverUrl: String
blobUrl: String
createdAt: Date
```

### Segment
```
bookId: ObjectId → Book
content: String
index: Number
// text index on content field for $text search
```

### VoiceSession
```
clerkId: String
bookId: ObjectId
startedAt: Date
endedAt: Date
durationSeconds: Number
billingMonth: String (YYYY-MM)
```

---

## 6. Plan Limits

| Plan | Books | Sessions/mo | Max Duration |
|---|---|---|---|
| Free | 1 | 5 | 5 min |
| Standard | 10 | 30 | 30 min |
| Pro | Unlimited | Unlimited | Unlimited |

---

## 7. Security Rules (CodeRabbit Critical Fixes Pre-Applied)
- `clerkId` is ALWAYS resolved server-side via `auth()` — never trusted from client payload
- Vapi session timer uses `useRef` for elapsed time tracking to prevent re-entry bug
- All book queries filter by server-resolved `clerkId`

---

## 8. Directory Structure

```
bookaver/
├── app/
│   ├── (auth)/
│   │   ├── sign-in/[[...sign-in]]/page.tsx
│   │   └── sign-up/[[...sign-up]]/page.tsx
│   ├── (root)/
│   │   ├── layout.tsx
│   │   ├── page.tsx                  ← Homepage / book list
│   │   ├── dashboard/page.tsx
│   │   ├── upload/page.tsx
│   │   ├── books/[id]/page.tsx       ← Voice session page
│   │   └── pricing/page.tsx
│   ├── api/
│   │   └── vapi/
│   │       └── search-book/route.ts  ← RAG endpoint stub
│   ├── layout.tsx                    ← ClerkProvider root
│   └── globals.css
├── components/
│   ├── ui/                           ← shadcn primitives
│   ├── BookCard.tsx
│   ├── MicrophoneButton.tsx
│   ├── SearchBar.tsx
│   ├── UploadForm.tsx
│   └── VoiceControls.tsx
├── lib/
│   ├── db/
│   │   ├── mongoose.ts               ← singleton connection
│   │   └── models/
│   │       ├── Book.ts
│   │       ├── Segment.ts
│   │       └── VoiceSession.ts
│   ├── actions/
│   │   ├── book.actions.ts           ← createBook, getBooks, deleteBook
│   │   └── session.actions.ts        ← startVoiceSession, endVoiceSession
│   ├── pdf/
│   │   └── parser.ts                 ← extractAndSegmentPDF, chunkText
│   ├── vapi/
│   │   ├── client.ts                 ← getVapi() singleton
│   │   ├── useVapi.ts                ← hook stub
│   │   └── constants.ts              ← VOICE_PERSONAS, VAPI_CONFIG
│   └── clerk/
│       └── billing.ts                ← PLAN_LIMITS, getUserPlan()
├── docs/plans/
│   └── 2026-03-09-bookaver-design.md
├── .env.local                        ← keys (Casey fills in)
├── next.config.js
├── tailwind.config.ts
├── tsconfig.json
└── package.json
```

---

## 9. Parallel Build Breakdown (Sub-Agent Assignments)

| Agent | Responsibility |
|---|---|
| Agent 1 | Scaffold: npx create-next-app, install deps, next.config.js, tailwind, shadcn init |
| Agent 2 | MongoDB: mongoose.ts singleton, Book/Segment/VoiceSession models, text index |
| Agent 3 | Auth + Billing: Clerk layout, sign-in/up pages, billing.ts, PricingTable page |
| Agent 4 | Server Actions + PDF: createBook, startVoiceSession, parser.ts, Vercel Blob upload |
| Agent 5 | UI Components: HomePage, BookCard, MicrophoneButton, SearchBar, UploadForm, VoiceControls |
| Agent 6 | Vapi + RAG stub: getVapi singleton, useVapi hook, constants, /api/vapi/search-book route |

**Estimated total time:** 45–70 minutes (agents run in parallel)

---

## 10. Success Criteria
- `npm run dev` starts without errors
- User can sign in via Clerk
- User can upload a PDF → segments stored in MongoDB
- Voice session page loads, MicrophoneButton renders with animate-ping
- `/api/vapi/search-book` returns typed stub response
- `.env.local` keys are the only thing needed to make it fully live
