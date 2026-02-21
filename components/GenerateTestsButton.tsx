"use client";

import { useState } from "react";

interface GeneratedTestInfo {
  prUrl?: string | null;
  prNumber?: number | null;
  testsGenerated?: number;
  status?: string;
}

interface GenerateTestsButtonProps {
  owner: string;
  repo: string;
  prNumber: number;
  evaluationId: string;
  existingGenPR?: GeneratedTestInfo | null;
}

export default function GenerateTestsButton({
  owner,
  repo,
  prNumber,
  evaluationId,
  existingGenPR,
}: GenerateTestsButtonProps) {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{
    prUrl?: string;
    prNumber?: number;
    testsGenerated?: number;
    error?: string;
    message?: string;
  } | null>(existingGenPR ? {
    prUrl: existingGenPR.prUrl || undefined,
    prNumber: existingGenPR.prNumber || undefined,
    testsGenerated: existingGenPR.testsGenerated,
  } : null);

  const handleGenerate = async () => {
    setLoading(true);
    setResult(null);

    try {
      const res = await fetch("/api/generate-tests", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          owner,
          repo,
          prNumber: prNumber.toString(),
          evaluationId,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setResult({ error: data.error || "Failed to generate tests" });
      } else {
        setResult({
          prUrl: data.prUrl,
          prNumber: data.prNumber,
          testsGenerated: data.testsGenerated,
          message: data.message,
        });
      }
    } catch (err: any) {
      setResult({ error: err.message || "Network error" });
    } finally {
      setLoading(false);
    }
  };

  // Already has a generated PR
  if (result?.prUrl) {
    return (
      <a
        href={result.prUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded text-xs font-medium
          bg-green-500/10 border border-green-500/20 text-green-400
          hover:bg-green-500/15 transition-colors"
      >
        PR #{result.prNumber} · {result.testsGenerated} tests →
      </a>
    );
  }

  // No tests needed
  if (result?.testsGenerated === 0) {
    return (
      <span className="inline-flex items-center px-3 py-1.5 rounded text-xs text-neutral-500 bg-neutral-900 border border-neutral-800">
        No additional tests needed
      </span>
    );
  }

  // Error state
  if (result?.error) {
    return (
      <div className="flex items-center gap-2">
        <span className="text-[11px] text-red-400/80 truncate max-w-[140px]">{result.error}</span>
        <button
          onClick={handleGenerate}
          className="px-3 py-1.5 rounded text-xs font-medium cursor-pointer
            bg-neutral-900 border border-neutral-700 text-neutral-300
            hover:bg-neutral-800 hover:text-white transition-colors"
        >
          Retry
        </button>
      </div>
    );
  }

  // Loading state
  if (loading) {
    return (
      <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded text-xs text-neutral-400 bg-neutral-900 border border-neutral-800">
        <span className="w-1.5 h-1.5 rounded-full bg-neutral-400 animate-pulse" />
        Generating...
      </span>
    );
  }

  // Default: Generate button
  return (
    <button
      onClick={handleGenerate}
      className="px-4 py-2 rounded text-xs font-semibold cursor-pointer
        bg-white text-black
        hover:bg-neutral-200
        active:scale-[0.97] transition-all"
    >
      Generate Tests
    </button>
  );
}
