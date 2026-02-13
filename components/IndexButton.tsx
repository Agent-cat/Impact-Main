
"use client";

import { useState } from "react";
import { Search, Loader2, Check } from "lucide-react";
import { toast } from "sonner";

export default function IndexButton({ owner, repo }: { owner: string; repo: string }) {
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);

  const handleIndex = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/indexRepo", {
        method: "POST",
        body: JSON.stringify({ owner, repo }),
      });

      if (!res.ok) throw new Error("Failed to index");

      const data = await res.ok ? await res.json() : null;
      toast.success(`Indexed ${data?.testsFound || 0} tests`);
      setDone(true);
      setTimeout(() => setDone(false), 3000);
    } catch (err) {
      toast.error("Failed to build index");
    } finally {
      setLoading(false);
    }
  };

  return (
    <button
      onClick={handleIndex}
      disabled={loading}
      className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
        done
        ? "bg-emerald-50 text-emerald-600 border border-emerald-100"
        : "bg-indigo-50 text-indigo-600 border border-indigo-100 hover:bg-indigo-100"
      }`}
    >
      {loading ? (
        <Loader2 className="w-3.5 h-3.5 animate-spin" />
      ) : done ? (
        <Check className="w-3.5 h-3.5" />
      ) : (
        <Search className="w-3.5 h-3.5" />
      )}
      {loading ? "Indexing..." : done ? "Indexed" : "Build Index"}
    </button>
  );
}
