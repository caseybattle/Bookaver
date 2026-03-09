import UploadForm from "@/components/UploadForm";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";

export default function UploadPage() {
  return (
    <div className="max-w-xl mx-auto space-y-6">
      <Link href="/" className="flex items-center gap-2 text-sm text-gray-400 hover:text-white transition-colors">
        <ArrowLeft className="w-4 h-4" />
        Back to Library
      </Link>
      <div>
        <h1 className="text-2xl font-bold">Upload a Book</h1>
        <p className="text-gray-400 mt-1 text-sm">Upload a PDF — we'll parse and index it for voice conversations.</p>
      </div>
      <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6">
        <UploadForm />
      </div>
    </div>
  );
}
