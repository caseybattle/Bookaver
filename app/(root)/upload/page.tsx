import { Suspense } from "react";
import UploadForm from "@/components/UploadForm";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";

export default function UploadPage() {
  return (
    <div className="max-w-xl mx-auto space-y-6">
      <Link href="/" className="flex items-center gap-2 text-sm text-stone-500 dark:text-stone-400 hover:text-stone-900 dark:hover:text-stone-50 transition-colors">
        <ArrowLeft className="w-4 h-4" />
        Back to Library
      </Link>
      <div>
        <h1 className="text-2xl font-bold">Upload a Book</h1>
        <p className="text-stone-500 dark:text-stone-400 mt-1 text-sm">Upload a PDF — we'll parse and index it for voice conversations.</p>
      </div>
      <div className="bg-stone-50 dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-2xl p-6">
        <Suspense fallback={<div className="animate-pulse h-96 bg-stone-100 dark:bg-stone-800 rounded-xl" />}>
          <UploadForm />
        </Suspense>
      </div>
    </div>
  );
}
