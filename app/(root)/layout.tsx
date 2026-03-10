import Navbar from "@/components/Navbar";

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-stone-50 dark:bg-[#0f0e0d] text-stone-900 dark:text-stone-50">
      <Navbar />
      <main className="max-w-6xl mx-auto px-4 py-8">{children}</main>
    </div>
  );
}
