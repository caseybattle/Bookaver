# Bookaver Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Build a full Next.js 16 app where users upload PDF books, choose a voice persona, and have real-time AI voice conversations with book content via Vapi + RAG.

**Architecture:** Single Next.js 16 App Router monorepo in `Booklio/bookaver/`. Server actions handle PDF parsing, Vercel Blob upload, and billing enforcement. Clerk resolves identity server-side. Vapi client hook and RAG endpoint are stubbed and typed — ready for key injection and logic implementation.

**Tech Stack:** Next.js 16, TypeScript, Clerk, MongoDB Atlas + Mongoose, Vercel Blob, pdfjs-dist, @vapi-ai/web, shadcn/ui, Tailwind CSS, sonner

**Base directory for all work:** `/sessions/wizardly-elegant-pasteur/mnt/Booklio/bookaver/`

---

## PHASE 1 — SCAFFOLD (Must complete before Phase 2+)

### Task 1: Bootstrap Next.js 16 project

**Files:**
- Create: `package.json`, `next.config.js`, `tsconfig.json`, `tailwind.config.ts`, `postcss.config.js`

**Step 1: Scaffold the app**

```bash
cd /sessions/wizardly-elegant-pasteur/mnt/Booklio
npx create-next-app@latest bookaver \
  --typescript \
  --tailwind \
  --eslint \
  --app \
  --src-dir=false \
  --import-alias="@/*" \
  --yes
```

Expected: Project created at `bookaver/`

**Step 2: Install all dependencies**

```bash
cd /sessions/wizardly-elegant-pasteur/mnt/Booklio/bookaver
npm install \
  @clerk/nextjs \
  mongoose \
  @vercel/blob \
  pdfjs-dist \
  @vapi-ai/web \
  sonner \
  lucide-react
```

**Step 3: Install shadcn/ui**

```bash
cd /sessions/wizardly-elegant-pasteur/mnt/Booklio/bookaver
npx shadcn@latest init --yes --defaults
npx shadcn@latest add button card input label badge dialog sheet progress
```

**Step 4: Update next.config.js**

```js
// next.config.js
/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    serverActions: {
      bodySizeLimit: '100mb',
    },
  },
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: '*.vercel-storage.com' },
      { protocol: 'https', hostname: 'img.clerk.com' },
    ],
  },
};

module.exports = nextConfig;
```

**Step 5: Verify TypeScript compiles**

```bash
cd /sessions/wizardly-elegant-pasteur/mnt/Booklio/bookaver
npx tsc --noEmit 2>&1 | head -20
```

Expected: No errors (or only minor missing-env warnings)

**Step 6: Commit**

```bash
cd /sessions/wizardly-elegant-pasteur/mnt/Booklio/bookaver
git init
git add .
git commit -m "chore: scaffold Next.js 16 bookaver app with all deps"
```

---

## PHASE 2 — PARALLEL TRACKS (Run simultaneously after Phase 1)

---

## TRACK A — MongoDB Models + DB Connection

### Task 2: Mongoose singleton connection

**Files:**
- Create: `lib/db/mongoose.ts`

**Step 1: Create directory**

```bash
mkdir -p lib/db/models
```

**Step 2: Write mongoose.ts**

```typescript
// lib/db/mongoose.ts
import mongoose from 'mongoose';

const MONGODB_URI = process.env.MONGODB_URI!;

if (!MONGODB_URI) {
  throw new Error('MONGODB_URI environment variable is not set');
}

interface MongooseCache {
  conn: typeof mongoose | null;
  promise: Promise<typeof mongoose> | null;
}

declare global {
  var mongoose: MongooseCache | undefined;
}

const cached: MongooseCache = global.mongoose ?? { conn: null, promise: null };
global.mongoose = cached;

export async function connectToDatabase(): Promise<typeof mongoose> {
  if (cached.conn) return cached.conn;

  if (!cached.promise) {
    cached.promise = mongoose
      .connect(MONGODB_URI, { bufferCommands: false })
      .then((m) => m);
  }

  cached.conn = await cached.promise;
  return cached.conn;
}
```

**Step 3: Verify TypeScript**

```bash
npx tsc --noEmit 2>&1 | grep mongoose
```

Expected: No errors

**Step 4: Commit**

```bash
git add lib/db/mongoose.ts
git commit -m "feat: add mongoose singleton db connection"
```

---

### Task 3: Book model

**Files:**
- Create: `lib/db/models/Book.ts`

**Step 1: Write Book.ts**

```typescript
// lib/db/models/Book.ts
import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IBook extends Document {
  clerkId: string;
  title: string;
  author: string;
  coverUrl?: string;
  blobUrl: string;
  totalSegments: number;
  createdAt: Date;
  updatedAt: Date;
}

const BookSchema = new Schema<IBook>(
  {
    clerkId: { type: String, required: true, index: true },
    title: { type: String, required: true },
    author: { type: String, required: true },
    coverUrl: { type: String },
    blobUrl: { type: String, required: true },
    totalSegments: { type: Number, default: 0 },
  },
  { timestamps: true }
);

const Book: Model<IBook> =
  mongoose.models.Book ?? mongoose.model<IBook>('Book', BookSchema);

export default Book;
```

**Step 2: Verify**

```bash
npx tsc --noEmit 2>&1 | grep -i book
```

**Step 3: Commit**

```bash
git add lib/db/models/Book.ts
git commit -m "feat: add Book mongoose model"
```

---

### Task 4: Segment model

**Files:**
- Create: `lib/db/models/Segment.ts`

**Step 1: Write Segment.ts**

```typescript
// lib/db/models/Segment.ts
import mongoose, { Schema, Document, Model } from 'mongoose';

export interface ISegment extends Document {
  bookId: mongoose.Types.ObjectId;
  clerkId: string;
  content: string;
  index: number;
}

const SegmentSchema = new Schema<ISegment>({
  bookId: { type: Schema.Types.ObjectId, ref: 'Book', required: true, index: true },
  clerkId: { type: String, required: true, index: true },
  content: { type: String, required: true },
  index: { type: Number, required: true },
});

// Full-text search index on content
SegmentSchema.index({ content: 'text' });

const Segment: Model<ISegment> =
  mongoose.models.Segment ?? mongoose.model<ISegment>('Segment', SegmentSchema);

export default Segment;
```

**Step 2: Commit**

```bash
git add lib/db/models/Segment.ts
git commit -m "feat: add Segment model with text index"
```

---

### Task 5: VoiceSession model

**Files:**
- Create: `lib/db/models/VoiceSession.ts`

**Step 1: Write VoiceSession.ts**

```typescript
// lib/db/models/VoiceSession.ts
import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IVoiceSession extends Document {
  clerkId: string;
  bookId: mongoose.Types.ObjectId;
  startedAt: Date;
  endedAt?: Date;
  durationSeconds?: number;
  billingMonth: string; // format: "YYYY-MM"
}

const VoiceSessionSchema = new Schema<IVoiceSession>({
  clerkId: { type: String, required: true, index: true },
  bookId: { type: Schema.Types.ObjectId, ref: 'Book', required: true },
  startedAt: { type: Date, default: Date.now },
  endedAt: { type: Date },
  durationSeconds: { type: Number },
  billingMonth: { type: String, required: true },
});

const VoiceSession: Model<IVoiceSession> =
  mongoose.models.VoiceSession ??
  mongoose.model<IVoiceSession>('VoiceSession', VoiceSessionSchema);

export default VoiceSession;
```

**Step 2: Commit**

```bash
git add lib/db/models/VoiceSession.ts
git commit -m "feat: add VoiceSession model for billing enforcement"
```

---

## TRACK B — Clerk Auth + Billing

### Task 6: Root layout with ClerkProvider

**Files:**
- Modify: `app/layout.tsx`

**Step 1: Write root layout**

```typescript
// app/layout.tsx
import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import { ClerkProvider } from '@clerk/nextjs';
import { Toaster } from 'sonner';
import './globals.css';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'Bookaver — Talk to Your Books',
  description: 'Upload any PDF and have a real-time AI voice conversation with the content.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <ClerkProvider>
      <html lang="en">
        <body className={inter.className}>
          {children}
          <Toaster richColors position="top-right" />
        </body>
      </html>
    </ClerkProvider>
  );
}
```

**Step 2: Commit**

```bash
git add app/layout.tsx
git commit -m "feat: add ClerkProvider to root layout"
```

---

### Task 7: Auth pages (sign-in, sign-up)

**Files:**
- Create: `app/(auth)/sign-in/[[...sign-in]]/page.tsx`
- Create: `app/(auth)/sign-up/[[...sign-up]]/page.tsx`
- Create: `app/(auth)/layout.tsx`

**Step 1: Create directories**

```bash
mkdir -p "app/(auth)/sign-in/[[...sign-in]]"
mkdir -p "app/(auth)/sign-up/[[...sign-up]]"
```

**Step 2: Write sign-in page**

```typescript
// app/(auth)/sign-in/[[...sign-in]]/page.tsx
import { SignIn } from '@clerk/nextjs';

export default function SignInPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-slate-900 to-slate-800">
      <SignIn />
    </div>
  );
}
```

**Step 3: Write sign-up page**

```typescript
// app/(auth)/sign-up/[[...sign-up]]/page.tsx
import { SignUp } from '@clerk/nextjs';

export default function SignUpPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-slate-900 to-slate-800">
      <SignUp />
    </div>
  );
}
```

**Step 4: Write auth layout**

```typescript
// app/(auth)/layout.tsx
export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
```

**Step 5: Create Clerk middleware**

```typescript
// middleware.ts (root)
import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server';

const isPublicRoute = createRouteMatcher([
  '/',
  '/sign-in(.*)',
  '/sign-up(.*)',
  '/pricing',
]);

export default clerkMiddleware((auth, request) => {
  if (!isPublicRoute(request)) {
    auth().protect();
  }
});

export const config = {
  matcher: ['/((?!.+\\.[\\w]+$|_next).*)', '/', '/(api|trpc)(.*)'],
};
```

**Step 6: Commit**

```bash
git add app/(auth) middleware.ts
git commit -m "feat: add Clerk sign-in/up pages and middleware"
```

---

### Task 8: Billing config + getUserPlan

**Files:**
- Create: `lib/clerk/billing.ts`

**Step 1: Write billing.ts**

```typescript
// lib/clerk/billing.ts
import { auth } from '@clerk/nextjs/server';

export type PlanType = 'free' | 'standard' | 'pro';

export interface PlanLimits {
  maxBooks: number;
  maxSessionsPerMonth: number;
  maxSessionDurationSeconds: number; // -1 = unlimited
}

export const PLAN_LIMITS: Record<PlanType, PlanLimits> = {
  free: {
    maxBooks: 1,
    maxSessionsPerMonth: 5,
    maxSessionDurationSeconds: 300, // 5 min
  },
  standard: {
    maxBooks: 10,
    maxSessionsPerMonth: 30,
    maxSessionDurationSeconds: 1800, // 30 min
  },
  pro: {
    maxBooks: -1,
    maxSessionsPerMonth: -1,
    maxSessionDurationSeconds: -1,
  },
};

export async function getUserPlan(): Promise<PlanType> {
  const { has } = await auth();

  if (has && has({ permission: 'org:plan:pro' })) return 'pro';
  if (has && has({ permission: 'org:plan:standard' })) return 'standard';
  return 'free';
}

export async function getPlanLimits(): Promise<PlanLimits> {
  const plan = await getUserPlan();
  return PLAN_LIMITS[plan];
}
```

**Step 2: Commit**

```bash
git add lib/clerk/billing.ts
git commit -m "feat: add PLAN_LIMITS and getUserPlan billing config"
```

---

### Task 9: Pricing page

**Files:**
- Create: `app/(root)/pricing/page.tsx`

**Step 1: Write pricing page**

```typescript
// app/(root)/pricing/page.tsx
import { PricingTable } from '@clerk/nextjs';

export default function PricingPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 to-slate-800 py-20">
      <div className="mx-auto max-w-5xl px-4">
        <div className="mb-12 text-center">
          <h1 className="mb-4 text-4xl font-bold text-white">Choose Your Plan</h1>
          <p className="text-slate-400">
            Unlock more books, longer sessions, and unlimited conversations.
          </p>
        </div>
        <PricingTable />
      </div>
    </div>
  );
}
```

**Step 2: Commit**

```bash
git add "app/(root)/pricing/page.tsx"
git commit -m "feat: add pricing page with Clerk PricingTable"
```

---

## TRACK C — PDF Parsing + Server Actions

### Task 10: PDF parser (extractAndSegmentPDF)

**Files:**
- Create: `lib/pdf/parser.ts`

**Step 1: Create directory**

```bash
mkdir -p lib/pdf
```

**Step 2: Write parser.ts**

```typescript
// lib/pdf/parser.ts
import * as pdfjsLib from 'pdfjs-dist';

// Use legacy build to avoid worker issues in Node environment
pdfjsLib.GlobalWorkerOptions.workerSrc = '';

const WORDS_PER_SEGMENT = 500;

export interface BookSegment {
  content: string;
  index: number;
}

export function chunkText(text: string, wordsPerChunk = WORDS_PER_SEGMENT): string[] {
  const words = text.split(/\s+/).filter(Boolean);
  const chunks: string[] = [];

  for (let i = 0; i < words.length; i += wordsPerChunk) {
    const chunk = words.slice(i, i + wordsPerChunk).join(' ');
    if (chunk.trim()) chunks.push(chunk.trim());
  }

  return chunks;
}

export async function extractAndSegmentPDF(
  arrayBuffer: ArrayBuffer
): Promise<BookSegment[]> {
  const pdf = await pdfjsLib.getDocument({
    data: new Uint8Array(arrayBuffer),
    useWorkerFetch: false,
    isEvalSupported: false,
    useSystemFonts: true,
  }).promise;

  let fullText = '';

  for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
    const page = await pdf.getPage(pageNum);
    const textContent = await page.getTextContent();
    const pageText = textContent.items
      .filter((item): item is { str: string } => 'str' in item)
      .map((item) => item.str)
      .join(' ');
    fullText += pageText + ' ';
  }

  const chunks = chunkText(fullText.trim());

  return chunks.map((content, index) => ({ content, index }));
}
```

**Step 3: Commit**

```bash
git add lib/pdf/parser.ts
git commit -m "feat: add PDF parser with 500-word segmentation"
```

---

### Task 11: createBook server action

**Files:**
- Create: `lib/actions/book.actions.ts`

**Step 1: Create directory**

```bash
mkdir -p lib/actions
```

**Step 2: Write book.actions.ts**

```typescript
// lib/actions/book.actions.ts
'use server';

import { auth } from '@clerk/nextjs/server';
import { put } from '@vercel/blob';
import { revalidatePath } from 'next/cache';
import { connectToDatabase } from '@/lib/db/mongoose';
import Book from '@/lib/db/models/Book';
import Segment from '@/lib/db/models/Segment';
import { extractAndSegmentPDF } from '@/lib/pdf/parser';
import { getPlanLimits } from '@/lib/clerk/billing';

export interface CreateBookInput {
  title: string;
  author: string;
  file: File;
}

export interface CreateBookResult {
  success: boolean;
  bookId?: string;
  error?: string;
}

export async function createBook(input: CreateBookInput): Promise<CreateBookResult> {
  try {
    // SECURITY: Always resolve clerkId server-side — never trust client payload
    const { userId: clerkId } = await auth();
    if (!clerkId) return { success: false, error: 'Not authenticated' };

    await connectToDatabase();

    // Enforce plan book limit
    const limits = await getPlanLimits();
    if (limits.maxBooks !== -1) {
      const bookCount = await Book.countDocuments({ clerkId });
      if (bookCount >= limits.maxBooks) {
        return {
          success: false,
          error: `Your plan allows ${limits.maxBooks} book(s). Upgrade for more.`,
        };
      }
    }

    // Upload PDF to Vercel Blob
    const arrayBuffer = await input.file.arrayBuffer();
    const blob = await put(`books/${clerkId}/${Date.now()}-${input.file.name}`, arrayBuffer, {
      access: 'public',
      contentType: 'application/pdf',
    });

    // Extract and segment PDF text
    const segments = await extractAndSegmentPDF(arrayBuffer);

    // Save book to MongoDB
    const book = await Book.create({
      clerkId,
      title: input.title,
      author: input.author,
      blobUrl: blob.url,
      totalSegments: segments.length,
    });

    // Save all segments
    const segmentDocs = segments.map((seg) => ({
      bookId: book._id,
      clerkId,
      content: seg.content,
      index: seg.index,
    }));

    await Segment.insertMany(segmentDocs);

    revalidatePath('/dashboard');
    revalidatePath('/');

    return { success: true, bookId: book._id.toString() };
  } catch (error) {
    console.error('[createBook]', error);
    return { success: false, error: 'Failed to create book. Please try again.' };
  }
}

export async function getBooks() {
  const { userId: clerkId } = await auth();
  if (!clerkId) return [];

  await connectToDatabase();

  const books = await Book.find({ clerkId }).sort({ createdAt: -1 }).lean();
  return books.map((b) => ({
    id: b._id.toString(),
    title: b.title,
    author: b.author,
    coverUrl: b.coverUrl,
    blobUrl: b.blobUrl,
    totalSegments: b.totalSegments,
    createdAt: b.createdAt,
  }));
}

export async function deleteBook(bookId: string): Promise<{ success: boolean }> {
  const { userId: clerkId } = await auth();
  if (!clerkId) return { success: false };

  await connectToDatabase();

  await Book.deleteOne({ _id: bookId, clerkId }); // clerkId filter prevents deleting others' books
  await Segment.deleteMany({ bookId });

  revalidatePath('/dashboard');
  revalidatePath('/');

  return { success: true };
}
```

**Step 3: Commit**

```bash
git add lib/actions/book.actions.ts
git commit -m "feat: add createBook/getBooks/deleteBook server actions"
```

---

### Task 12: startVoiceSession server action

**Files:**
- Create: `lib/actions/session.actions.ts`

**Step 1: Write session.actions.ts**

```typescript
// lib/actions/session.actions.ts
'use server';

import { auth } from '@clerk/nextjs/server';
import { connectToDatabase } from '@/lib/db/mongoose';
import VoiceSession from '@/lib/db/models/VoiceSession';
import { getPlanLimits } from '@/lib/clerk/billing';

function getBillingMonth(): string {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
}

export async function startVoiceSession(bookId: string): Promise<{
  success: boolean;
  sessionId?: string;
  error?: string;
}> {
  const { userId: clerkId } = await auth();
  if (!clerkId) return { success: false, error: 'Not authenticated' };

  await connectToDatabase();

  const limits = await getPlanLimits();
  const billingMonth = getBillingMonth();

  // Enforce monthly session limit
  if (limits.maxSessionsPerMonth !== -1) {
    const sessionCount = await VoiceSession.countDocuments({ clerkId, billingMonth });
    if (sessionCount >= limits.maxSessionsPerMonth) {
      return {
        success: false,
        error: `You've used all ${limits.maxSessionsPerMonth} sessions this month. Upgrade to continue.`,
      };
    }
  }

  const session = await VoiceSession.create({
    clerkId,
    bookId,
    billingMonth,
    startedAt: new Date(),
  });

  return { success: true, sessionId: session._id.toString() };
}

export async function endVoiceSession(sessionId: string, durationSeconds: number) {
  const { userId: clerkId } = await auth();
  if (!clerkId) return;

  await connectToDatabase();

  await VoiceSession.updateOne(
    { _id: sessionId, clerkId },
    { endedAt: new Date(), durationSeconds }
  );
}
```

**Step 2: Commit**

```bash
git add lib/actions/session.actions.ts
git commit -m "feat: add startVoiceSession/endVoiceSession server actions"
```

---

## TRACK D — Vapi Integration + RAG Stub

### Task 13: Vapi constants and singleton

**Files:**
- Create: `lib/vapi/constants.ts`
- Create: `lib/vapi/client.ts`

**Step 1: Create directory**

```bash
mkdir -p lib/vapi
```

**Step 2: Write constants.ts**

```typescript
// lib/vapi/constants.ts
export interface VoicePersona {
  id: string;
  name: string;
  description: string;
  voiceId: string; // ElevenLabs voice ID
  avatarUrl?: string;
}

export const VOICE_PERSONAS: VoicePersona[] = [
  {
    id: 'scholar',
    name: 'The Scholar',
    description: 'Thoughtful, precise, academic — perfect for non-fiction',
    voiceId: '21m00Tcm4TlvDq8ikWAM', // Rachel
  },
  {
    id: 'storyteller',
    name: 'The Storyteller',
    description: 'Warm, engaging, narrative — great for fiction',
    voiceId: 'AZnzlk1XvdvUeBnXmlld', // Domi
  },
  {
    id: 'coach',
    name: 'The Coach',
    description: 'Energetic, motivational, direct — ideal for self-help',
    voiceId: 'EXAVITQu4vr4xnSDxMaL', // Bella
  },
  {
    id: 'analyst',
    name: 'The Analyst',
    description: 'Calm, analytical, structured — best for technical content',
    voiceId: 'ErXwobaYiN019PkySvjV', // Antoni
  },
];

export const DEFAULT_PERSONA = VOICE_PERSONAS[0];
```

**Step 3: Write client.ts (Vapi singleton)**

```typescript
// lib/vapi/client.ts
import Vapi from '@vapi-ai/web';

let vapiInstance: Vapi | null = null;

export function getVapi(): Vapi {
  if (!vapiInstance) {
    const token = process.env.NEXT_PUBLIC_VAPI_WEB_TOKEN;
    if (!token) {
      throw new Error('NEXT_PUBLIC_VAPI_WEB_TOKEN is not set');
    }
    vapiInstance = new Vapi(token);
  }
  return vapiInstance;
}
```

**Step 4: Commit**

```bash
git add lib/vapi/constants.ts lib/vapi/client.ts
git commit -m "feat: add Vapi singleton and voice persona constants"
```

---

### Task 14: useVapi hook (stub — ready for key injection)

**Files:**
- Create: `lib/vapi/useVapi.ts`

**Step 1: Write useVapi.ts**

```typescript
// lib/vapi/useVapi.ts
'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { getVapi } from './client';
import { VoicePersona } from './constants';
import { startVoiceSession, endVoiceSession } from '@/lib/actions/session.actions';

export type CallStatus = 'idle' | 'connecting' | 'active' | 'ending';

export interface UseVapiReturn {
  callStatus: CallStatus;
  isSpeaking: boolean;
  startCall: (bookId: string, persona: VoicePersona) => Promise<void>;
  stopCall: () => void;
  error: string | null;
}

export function useVapi(): UseVapiReturn {
  const [callStatus, setCallStatus] = useState<CallStatus>('idle');
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Use ref for elapsed time to prevent timer re-entry bug (CodeRabbit fix)
  const sessionIdRef = useRef<string | null>(null);
  const startTimeRef = useRef<number | null>(null);

  useEffect(() => {
    return () => {
      // Cleanup on unmount
      if (callStatus === 'active') {
        getVapi().stop();
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const startCall = useCallback(async (bookId: string, persona: VoicePersona) => {
    try {
      setError(null);
      setCallStatus('connecting');

      // Enforce billing server-side before starting
      const result = await startVoiceSession(bookId);
      if (!result.success) {
        setError(result.error ?? 'Could not start session');
        setCallStatus('idle');
        return;
      }

      sessionIdRef.current = result.sessionId ?? null;
      startTimeRef.current = Date.now();

      const vapi = getVapi();

      vapi.on('call-start', () => setCallStatus('active'));
      vapi.on('call-end', () => setCallStatus('idle'));
      vapi.on('speech-start', () => setIsSpeaking(true));
      vapi.on('speech-end', () => setIsSpeaking(false));
      vapi.on('error', (err: Error) => {
        console.error('[Vapi error]', err);
        setError(err.message);
        setCallStatus('idle');
      });

      // TODO: Replace with your Vapi assistant ID from dashboard
      await vapi.start({
        model: {
          provider: 'openai',
          model: 'gpt-4o-mini',
          systemPrompt: `You are a helpful AI assistant. You have access to a tool called search_book that retrieves relevant passages from the user's book. Always use this tool to ground your answers in the actual content.`,
          tools: [
            {
              type: 'function',
              function: {
                name: 'search_book',
                description: 'Search the book for relevant content based on the user query',
                parameters: {
                  type: 'object',
                  properties: {
                    query: { type: 'string', description: 'The search query' },
                    bookId: { type: 'string', description: 'The book ID' },
                  },
                  required: ['query', 'bookId'],
                },
              },
              server: {
                url: `${process.env.NEXT_PUBLIC_APP_URL}/api/vapi/search-book`,
              },
            },
          ],
        },
        voice: {
          provider: '11labs',
          voiceId: persona.voiceId,
          model: 'eleven_turbo_v2_5',
        },
        name: `Bookaver — ${persona.name}`,
      });
    } catch (err) {
      console.error('[startCall]', err);
      setError('Failed to start voice session');
      setCallStatus('idle');
    }
  }, []);

  const stopCall = useCallback(() => {
    setCallStatus('ending');
    getVapi().stop();

    if (sessionIdRef.current && startTimeRef.current) {
      const durationSeconds = Math.floor((Date.now() - startTimeRef.current) / 1000);
      endVoiceSession(sessionIdRef.current, durationSeconds);
    }

    sessionIdRef.current = null;
    startTimeRef.current = null;
  }, []);

  return { callStatus, isSpeaking, startCall, stopCall, error };
}
```

**Step 2: Commit**

```bash
git add lib/vapi/useVapi.ts
git commit -m "feat: add useVapi hook stub with billing enforcement"
```

---

### Task 15: RAG API endpoint stub

**Files:**
- Create: `app/api/vapi/search-book/route.ts`

**Step 1: Create directory**

```bash
mkdir -p app/api/vapi/search-book
```

**Step 2: Write route.ts**

```typescript
// app/api/vapi/search-book/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/db/mongoose';
import Segment from '@/lib/db/models/Segment';

interface VapiToolCallRequest {
  message: {
    type: 'tool-calls';
    toolCallList: Array<{
      id: string;
      function: {
        name: string;
        arguments: string;
      };
    }>;
  };
}

interface SearchResult {
  content: string;
  index: number;
}

/**
 * RAG search endpoint for Vapi tool calls.
 *
 * TODO (your RAG implementer): Replace the MongoDB $text search below
 * with a proper vector similarity search (e.g., via OpenAI embeddings +
 * MongoDB Atlas Vector Search, or Pinecone). The interface is stable.
 */
export async function POST(request: NextRequest) {
  try {
    const body: VapiToolCallRequest = await request.json();
    const toolCall = body.message?.toolCallList?.[0];

    if (!toolCall) {
      return NextResponse.json({ error: 'No tool call found' }, { status: 400 });
    }

    const args = JSON.parse(toolCall.function.arguments) as {
      query: string;
      bookId: string;
    };

    await connectToDatabase();

    // STUB: Basic full-text search — replace with vector search for production
    const results: SearchResult[] = await Segment.find(
      {
        bookId: args.bookId,
        $text: { $search: args.query },
      },
      { score: { $meta: 'textScore' } }
    )
      .sort({ score: { $meta: 'textScore' } })
      .limit(3)
      .lean()
      .then((docs) =>
        docs.map((d) => ({ content: d.content, index: d.index }))
      );

    const context = results.map((r) => r.content).join('\n\n---\n\n');

    return NextResponse.json({
      results: [
        {
          toolCallId: toolCall.id,
          result: context || 'No relevant content found for that query.',
        },
      ],
    });
  } catch (error) {
    console.error('[search-book]', error);
    return NextResponse.json({ error: 'Search failed' }, { status: 500 });
  }
}
```

**Step 3: Commit**

```bash
git add app/api/vapi/search-book/route.ts
git commit -m "feat: add RAG search-book API route stub with $text search"
```

---

## TRACK E — UI Components

### Task 16: Protected root layout + navbar

**Files:**
- Create: `app/(root)/layout.tsx`
- Create: `components/Navbar.tsx`

**Step 1: Write Navbar**

```typescript
// components/Navbar.tsx
'use client';

import Link from 'next/link';
import { UserButton } from '@clerk/nextjs';
import { BookOpen } from 'lucide-react';

export default function Navbar() {
  return (
    <nav className="sticky top-0 z-50 border-b border-white/10 bg-slate-900/80 backdrop-blur-md">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3">
        <Link href="/" className="flex items-center gap-2">
          <BookOpen className="h-6 w-6 text-violet-400" />
          <span className="text-xl font-bold text-white">Bookaver</span>
        </Link>
        <div className="flex items-center gap-4">
          <Link href="/dashboard" className="text-sm text-slate-300 hover:text-white">
            Dashboard
          </Link>
          <Link href="/upload" className="text-sm text-slate-300 hover:text-white">
            Upload
          </Link>
          <Link href="/pricing" className="text-sm text-slate-300 hover:text-white">
            Pricing
          </Link>
          <UserButton afterSignOutUrl="/" />
        </div>
      </div>
    </nav>
  );
}
```

**Step 2: Write root layout**

```typescript
// app/(root)/layout.tsx
import Navbar from '@/components/Navbar';

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      <Navbar />
      <main className="mx-auto max-w-7xl px-4 py-8">{children}</main>
    </div>
  );
}
```

**Step 3: Commit**

```bash
git add "app/(root)/layout.tsx" components/Navbar.tsx
git commit -m "feat: add Navbar and protected root layout"
```

---

### Task 17: BookCard component

**Files:**
- Create: `components/BookCard.tsx`

**Step 1: Write BookCard**

```typescript
// components/BookCard.tsx
'use client';

import Link from 'next/link';
import Image from 'next/image';
import { BookOpen, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { deleteBook } from '@/lib/actions/book.actions';
import { toast } from 'sonner';

interface BookCardProps {
  id: string;
  title: string;
  author: string;
  coverUrl?: string;
  totalSegments: number;
}

export default function BookCard({ id, title, author, coverUrl, totalSegments }: BookCardProps) {
  async function handleDelete() {
    const result = await deleteBook(id);
    if (result.success) {
      toast.success('Book deleted');
    } else {
      toast.error('Failed to delete book');
    }
  }

  return (
    <div className="group relative overflow-hidden rounded-xl border border-white/10 bg-white/5 p-4 transition hover:bg-white/10">
      <div className="mb-3 flex h-40 items-center justify-center overflow-hidden rounded-lg bg-slate-700">
        {coverUrl ? (
          <Image src={coverUrl} alt={title} width={120} height={160} className="object-cover" />
        ) : (
          <BookOpen className="h-16 w-16 text-slate-500" />
        )}
      </div>
      <h3 className="mb-1 font-semibold text-white">{title}</h3>
      <p className="mb-1 text-sm text-slate-400">{author}</p>
      <p className="mb-3 text-xs text-slate-500">{totalSegments} segments</p>
      <div className="flex gap-2">
        <Link href={`/books/${id}`} className="flex-1">
          <Button size="sm" className="w-full bg-violet-600 hover:bg-violet-700">
            Talk to Book
          </Button>
        </Link>
        <Button
          size="sm"
          variant="ghost"
          className="text-slate-400 hover:text-red-400"
          onClick={handleDelete}
        >
          <Trash2 className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
```

**Step 2: Commit**

```bash
git add components/BookCard.tsx
git commit -m "feat: add BookCard component"
```

---

### Task 18: SearchBar component

**Files:**
- Create: `components/SearchBar.tsx`

**Step 1: Write SearchBar**

```typescript
// components/SearchBar.tsx
'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { Search } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { useCallback } from 'react';

export default function SearchBar() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const handleSearch = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const params = new URLSearchParams(searchParams.toString());
      if (e.target.value) {
        params.set('q', e.target.value);
      } else {
        params.delete('q');
      }
      router.replace(`/?${params.toString()}`);
    },
    [router, searchParams]
  );

  return (
    <div className="relative">
      <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
      <Input
        placeholder="Search your books..."
        defaultValue={searchParams.get('q') ?? ''}
        onChange={handleSearch}
        className="pl-10 bg-white/10 border-white/20 text-white placeholder:text-slate-400 focus:border-violet-500"
      />
    </div>
  );
}
```

**Step 2: Commit**

```bash
git add components/SearchBar.tsx
git commit -m "feat: add SearchBar with URL query sync"
```

---

### Task 19: UploadForm component

**Files:**
- Create: `components/UploadForm.tsx`

**Step 1: Write UploadForm**

```typescript
// components/UploadForm.tsx
'use client';

import { useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { Upload, FileText } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import { toast } from 'sonner';
import { createBook } from '@/lib/actions/book.actions';

export default function UploadForm() {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<File | null>(null);
  const [title, setTitle] = useState('');
  const [author, setAuthor] = useState('');
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState(0);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!file || !title || !author) {
      toast.error('Please fill in all fields and select a PDF');
      return;
    }

    setLoading(true);
    setProgress(20);

    try {
      setProgress(50);
      const result = await createBook({ title, author, file });
      setProgress(100);

      if (result.success) {
        toast.success('Book uploaded and processed!');
        router.push('/dashboard');
      } else {
        toast.error(result.error ?? 'Upload failed');
      }
    } catch {
      toast.error('Something went wrong. Please try again.');
    } finally {
      setLoading(false);
      setProgress(0);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="space-y-2">
        <Label htmlFor="title" className="text-white">Book Title</Label>
        <Input
          id="title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="e.g. Atomic Habits"
          className="bg-white/10 border-white/20 text-white placeholder:text-slate-400"
          required
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="author" className="text-white">Author</Label>
        <Input
          id="author"
          value={author}
          onChange={(e) => setAuthor(e.target.value)}
          placeholder="e.g. James Clear"
          className="bg-white/10 border-white/20 text-white placeholder:text-slate-400"
          required
        />
      </div>

      <div className="space-y-2">
        <Label className="text-white">PDF File</Label>
        <div
          onClick={() => fileInputRef.current?.click()}
          className="cursor-pointer rounded-lg border-2 border-dashed border-white/20 p-8 text-center transition hover:border-violet-500"
        >
          {file ? (
            <div className="flex items-center justify-center gap-2 text-white">
              <FileText className="h-5 w-5 text-violet-400" />
              <span>{file.name}</span>
            </div>
          ) : (
            <div className="text-slate-400">
              <Upload className="mx-auto mb-2 h-8 w-8" />
              <p>Click to select a PDF</p>
              <p className="text-xs mt-1">Max 100MB</p>
            </div>
          )}
        </div>
        <input
          ref={fileInputRef}
          type="file"
          accept=".pdf"
          className="hidden"
          onChange={(e) => setFile(e.target.files?.[0] ?? null)}
        />
      </div>

      {loading && <Progress value={progress} className="h-2" />}

      <Button
        type="submit"
        disabled={loading}
        className="w-full bg-violet-600 hover:bg-violet-700"
      >
        {loading ? 'Processing...' : 'Upload Book'}
      </Button>
    </form>
  );
}
```

**Step 2: Commit**

```bash
git add components/UploadForm.tsx
git commit -m "feat: add UploadForm with progress indicator"
```

---

### Task 20: MicrophoneButton component (animate-ping)

**Files:**
- Create: `components/MicrophoneButton.tsx`

**Step 1: Write MicrophoneButton**

```typescript
// components/MicrophoneButton.tsx
'use client';

import { Mic, MicOff, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { CallStatus } from '@/lib/vapi/useVapi';

interface MicrophoneButtonProps {
  callStatus: CallStatus;
  isSpeaking: boolean;
  onStart: () => void;
  onStop: () => void;
}

export default function MicrophoneButton({
  callStatus,
  isSpeaking,
  onStart,
  onStop,
}: MicrophoneButtonProps) {
  const isIdle = callStatus === 'idle';
  const isConnecting = callStatus === 'connecting';
  const isActive = callStatus === 'active';
  const isEnding = callStatus === 'ending';

  return (
    <div className="relative flex items-center justify-center">
      {/* Pulsating ring when AI is speaking */}
      {isSpeaking && (
        <span className="absolute inline-flex h-20 w-20 rounded-full bg-violet-500 opacity-20 animate-ping" />
      )}

      <Button
        size="lg"
        onClick={isActive ? onStop : onStart}
        disabled={isConnecting || isEnding}
        className={`relative z-10 h-16 w-16 rounded-full transition-all ${
          isActive
            ? 'bg-red-600 hover:bg-red-700'
            : 'bg-violet-600 hover:bg-violet-700'
        }`}
      >
        {isConnecting || isEnding ? (
          <Loader2 className="h-6 w-6 animate-spin" />
        ) : isActive ? (
          <MicOff className="h-6 w-6" />
        ) : (
          <Mic className="h-6 w-6" />
        )}
      </Button>
    </div>
  );
}
```

**Step 2: Commit**

```bash
git add components/MicrophoneButton.tsx
git commit -m "feat: add MicrophoneButton with animate-ping speaking indicator"
```

---

## TRACK F — Pages

### Task 21: Homepage (book list + search)

**Files:**
- Create: `app/(root)/page.tsx`

**Step 1: Write homepage**

```typescript
// app/(root)/page.tsx
import { Suspense } from 'react';
import { currentUser } from '@clerk/nextjs/server';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import BookCard from '@/components/BookCard';
import SearchBar from '@/components/SearchBar';
import { getBooks } from '@/lib/actions/book.actions';

interface HomePageProps {
  searchParams: { q?: string };
}

export default async function HomePage({ searchParams }: HomePageProps) {
  const user = await currentUser();
  if (!user) redirect('/sign-in');

  const books = await getBooks();
  const query = searchParams.q?.toLowerCase() ?? '';

  const filtered = query
    ? books.filter(
        (b) =>
          b.title.toLowerCase().includes(query) ||
          b.author.toLowerCase().includes(query)
      )
    : books;

  return (
    <div>
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white">Your Library</h1>
          <p className="mt-1 text-slate-400">
            {books.length} book{books.length !== 1 ? 's' : ''} uploaded
          </p>
        </div>
        <Link href="/upload">
          <Button className="bg-violet-600 hover:bg-violet-700">
            <Plus className="mr-2 h-4 w-4" />
            Add Book
          </Button>
        </Link>
      </div>

      <div className="mb-6 max-w-md">
        <Suspense>
          <SearchBar />
        </Suspense>
      </div>

      {filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <p className="text-lg text-slate-400">
            {query ? 'No books match your search.' : 'No books yet. Upload your first PDF!'}
          </p>
          {!query && (
            <Link href="/upload" className="mt-4">
              <Button className="bg-violet-600 hover:bg-violet-700">Upload a Book</Button>
            </Link>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
          {filtered.map((book) => (
            <BookCard key={book.id} {...book} />
          ))}
        </div>
      )}
    </div>
  );
}
```

**Step 2: Commit**

```bash
git add "app/(root)/page.tsx"
git commit -m "feat: add homepage with book list and search"
```

---

### Task 22: Upload page

**Files:**
- Create: `app/(root)/upload/page.tsx`

**Step 1: Write upload page**

```typescript
// app/(root)/upload/page.tsx
import UploadForm from '@/components/UploadForm';

export default function UploadPage() {
  return (
    <div className="mx-auto max-w-lg">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-white">Upload a Book</h1>
        <p className="mt-2 text-slate-400">
          Upload any PDF and start talking to it with AI.
        </p>
      </div>
      <div className="rounded-2xl border border-white/10 bg-white/5 p-8">
        <UploadForm />
      </div>
    </div>
  );
}
```

**Step 2: Commit**

```bash
git add "app/(root)/upload/page.tsx"
git commit -m "feat: add upload page"
```

---

### Task 23: Voice session page (books/[id])

**Files:**
- Create: `app/(root)/books/[id]/page.tsx`
- Create: `components/VoiceSession.tsx`

**Step 1: Write VoiceSession client component**

```typescript
// components/VoiceSession.tsx
'use client';

import { useState } from 'react';
import { toast } from 'sonner';
import MicrophoneButton from '@/components/MicrophoneButton';
import { useVapi } from '@/lib/vapi/useVapi';
import { VOICE_PERSONAS, VoicePersona } from '@/lib/vapi/constants';

interface VoiceSessionProps {
  bookId: string;
  bookTitle: string;
}

export default function VoiceSession({ bookId, bookTitle }: VoiceSessionProps) {
  const [selectedPersona, setSelectedPersona] = useState<VoicePersona>(VOICE_PERSONAS[0]);
  const { callStatus, isSpeaking, startCall, stopCall, error } = useVapi();

  async function handleStart() {
    await startCall(bookId, selectedPersona);
  }

  if (error) toast.error(error);

  return (
    <div className="flex flex-col items-center gap-8">
      {/* Persona selector */}
      {callStatus === 'idle' && (
        <div className="w-full max-w-md">
          <p className="mb-3 text-center text-sm text-slate-400">Choose a voice persona</p>
          <div className="grid grid-cols-2 gap-3">
            {VOICE_PERSONAS.map((persona) => (
              <button
                key={persona.id}
                onClick={() => setSelectedPersona(persona)}
                className={`rounded-lg border p-3 text-left transition ${
                  selectedPersona.id === persona.id
                    ? 'border-violet-500 bg-violet-500/10'
                    : 'border-white/10 bg-white/5 hover:bg-white/10'
                }`}
              >
                <p className="font-medium text-white">{persona.name}</p>
                <p className="text-xs text-slate-400">{persona.description}</p>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Status */}
      <div className="text-center">
        <p className="text-slate-400">
          {callStatus === 'idle' && 'Ready to talk'}
          {callStatus === 'connecting' && 'Connecting...'}
          {callStatus === 'active' && (isSpeaking ? 'AI is speaking...' : 'Listening...')}
          {callStatus === 'ending' && 'Ending session...'}
        </p>
      </div>

      {/* Microphone button */}
      <MicrophoneButton
        callStatus={callStatus}
        isSpeaking={isSpeaking}
        onStart={handleStart}
        onStop={stopCall}
      />

      {callStatus === 'active' && (
        <p className="text-xs text-slate-500">Ask anything about "{bookTitle}"</p>
      )}
    </div>
  );
}
```

**Step 2: Write book detail page**

```typescript
// app/(root)/books/[id]/page.tsx
import { notFound } from 'next/navigation';
import { auth } from '@clerk/nextjs/server';
import { connectToDatabase } from '@/lib/db/mongoose';
import Book from '@/lib/db/models/Book';
import VoiceSession from '@/components/VoiceSession';
import { BookOpen } from 'lucide-react';

interface BookPageProps {
  params: { id: string };
}

export default async function BookPage({ params }: BookPageProps) {
  const { userId: clerkId } = await auth();
  if (!clerkId) notFound();

  await connectToDatabase();
  const book = await Book.findOne({ _id: params.id, clerkId }).lean();
  if (!book) notFound();

  return (
    <div className="mx-auto max-w-2xl">
      <div className="mb-10 text-center">
        <div className="mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-2xl bg-violet-500/20">
          <BookOpen className="h-10 w-10 text-violet-400" />
        </div>
        <h1 className="text-2xl font-bold text-white">{book.title}</h1>
        <p className="text-slate-400">{book.author}</p>
        <p className="mt-1 text-xs text-slate-500">{book.totalSegments} segments indexed</p>
      </div>

      <VoiceSession bookId={params.id} bookTitle={book.title} />
    </div>
  );
}
```

**Step 3: Commit**

```bash
git add "app/(root)/books" components/VoiceSession.tsx
git commit -m "feat: add voice session page with persona picker"
```

---

### Task 24: Dashboard page

**Files:**
- Create: `app/(root)/dashboard/page.tsx`

**Step 1: Write dashboard**

```typescript
// app/(root)/dashboard/page.tsx
import { currentUser } from '@clerk/nextjs/server';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import BookCard from '@/components/BookCard';
import { getBooks } from '@/lib/actions/book.actions';
import { getUserPlan, PLAN_LIMITS } from '@/lib/clerk/billing';

export default async function DashboardPage() {
  const user = await currentUser();
  if (!user) redirect('/sign-in');

  const [books, plan] = await Promise.all([getBooks(), getUserPlan()]);
  const limits = PLAN_LIMITS[plan];

  return (
    <div>
      {/* Header */}
      <div className="mb-8 flex items-start justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white">
            Welcome back, {user.firstName}
          </h1>
          <p className="mt-1 text-slate-400 capitalize">
            Plan: <span className="text-violet-400 font-medium">{plan}</span>
            {' · '}
            {limits.maxBooks === -1 ? 'Unlimited' : `${books.length}/${limits.maxBooks}`} books
          </p>
        </div>
        <div className="flex gap-2">
          <Link href="/pricing">
            <Button variant="outline" className="border-white/20 text-white hover:bg-white/10">
              Upgrade Plan
            </Button>
          </Link>
          <Link href="/upload">
            <Button className="bg-violet-600 hover:bg-violet-700">Upload Book</Button>
          </Link>
        </div>
      </div>

      {/* Books grid */}
      {books.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <p className="text-lg text-slate-400">No books yet. Upload your first PDF to get started.</p>
          <Link href="/upload" className="mt-4">
            <Button className="bg-violet-600 hover:bg-violet-700">Upload a Book</Button>
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
          {books.map((book) => (
            <BookCard key={book.id} {...book} />
          ))}
        </div>
      )}
    </div>
  );
}
```

**Step 2: Final TypeScript check**

```bash
cd /sessions/wizardly-elegant-pasteur/mnt/Booklio/bookaver
npx tsc --noEmit 2>&1
```

Expected: Zero errors (env warnings acceptable)

**Step 3: Final commit**

```bash
git add -A
git commit -m "feat: complete Bookaver MVP — upload, voice session, dashboard, billing"
```

---

## PHASE 3 — VERIFICATION

### Task 25: Start dev server and verify

**Step 1: Start dev server**

```bash
cd /sessions/wizardly-elegant-pasteur/mnt/Booklio/bookaver
npm run dev -- --port 3000 2>&1 &
sleep 5
curl -s http://localhost:3000 | head -20
```

Expected: HTML response from Next.js

**Step 2: Verify all routes resolve**

```bash
curl -s -o /dev/null -w "%{http_code}" http://localhost:3000/
curl -s -o /dev/null -w "%{http_code}" http://localhost:3000/sign-in
curl -s -o /dev/null -w "%{http_code}" http://localhost:3000/pricing
```

Expected: All 200

**Step 3: Final commit**

```bash
git add -A
git commit -m "chore: verify Bookaver dev server runs clean"
```

---

## Execution Handoff Note

After running this plan, the only remaining steps to go live are:
1. Fill in `.env.local` with real keys (Clerk, MongoDB, Vercel Blob, Vapi)
2. Set up MongoDB Atlas cluster + whitelist `0.0.0.0/0`
3. Configure Clerk dashboard: add Standard + Pro plans, set plan permissions
4. Deploy to Vercel: `vercel --prod`
5. Implement vector search in `/api/vapi/search-book/route.ts` (your RAG implementer)
6. Configure Vapi assistant in Vapi dashboard (your team)
