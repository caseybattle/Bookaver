"use client";

import { useRef, useState } from "react";
import { Upload, FileText, Loader2 } from "lucide-react";
import { createBook } from "@/lib/actions/book.actions";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

export default function UploadForm() {
  const [dragging, setDragging] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const router = useRouter();

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragging(false);
    const dropped = e.dataTransfer.files[0];
    if (dropped?.type === "application/pdf") setFile(dropped);
    else toast.error("Please upload a PDF file");
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!file) return;
    setUploading(true);
    try {
      const fd = new FormData(e.currentTarget);
      await createBook(fd);
      toast.success("Book uploaded and processed!");
      router.push("/");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Upload failed");
    } finally {
      setUploading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Drop zone */}
      <div
        onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
        onDragLeave={() => setDragging(false)}
        onDrop={handleDrop}
        onClick={() => fileRef.current?.click()}
        className={`border-2 border-dashed rounded-xl p-12 text-center cursor-pointer transition-colors ${
          dragging ? "border-indigo-500 bg-indigo-500/5" : "border-gray-700 hover:border-gray-600"
        }`}
      >
        <input
          ref={fileRef}
          type="file"
          name="file"
          accept="application/pdf"
          className="hidden"
          onChange={(e) => setFile(e.target.files?.[0] ?? null)}
        />
        {file ? (
          <div className="flex flex-col items-center gap-2">
            <FileText className="w-10 h-10 text-indigo-400" />
            <p className="text-white font-medium">{file.name}</p>
            <p className="text-sm text-gray-400">{(file.size / 1024 / 1024).toFixed(1)} MB</p>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-2">
            <Upload className="w-10 h-10 text-gray-500" />
            <p className="text-gray-300 font-medium">Drop your PDF here or click to browse</p>
            <p className="text-sm text-gray-500">Up to 100 MB</p>
          </div>
        )}
      </div>

      {/* Metadata */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div>
          <label className="block text-sm text-gray-400 mb-1.5">Title</label>
          <input
            name="title"
            required
            placeholder="Book title"
            className="w-full px-3 py-2.5 bg-gray-900 border border-gray-800 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-indigo-500 transition-colors text-sm"
          />
        </div>
        <div>
          <label className="block text-sm text-gray-400 mb-1.5">Author</label>
          <input
            name="author"
            required
            placeholder="Author name"
            className="w-full px-3 py-2.5 bg-gray-900 border border-gray-800 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-indigo-500 transition-colors text-sm"
          />
        </div>
      </div>

      <button
        type="submit"
        disabled={!file || uploading}
        className="w-full py-3 bg-indigo-600 hover:bg-indigo-500 disabled:bg-gray-800 disabled:text-gray-500 text-white font-semibold rounded-xl transition-colors flex items-center justify-center gap-2"
      >
        {uploading ? (
          <>
            <Loader2 className="w-4 h-4 animate-spin" />
            Processing…
          </>
        ) : (
          "Upload & Process Book"
        )}
      </button>
    </form>
  );
}
