
"use client";

import { useState } from "react";
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
      className={`px-3 py-1.5 rounded text-xs font-medium transition-all cursor-pointer ${
        done
        ? "bg-green-500/10 text-green-400 border border-green-500/20"
        : "bg-neutral-900 text-neutral-300 border border-neutral-700 hover:bg-neutral-800 hover:text-white"
      }`}
    >
      {loading ? "Indexing..." : done ? "✓ Indexed" : "Build Index"}
    </button>
  );
}
