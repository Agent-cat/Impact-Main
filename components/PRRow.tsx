"use client";

import { useState } from "react";
import GenerateTestsButton from "./GenerateTestsButton";

interface ChangedFile {
  filename: string;
  status: string;
  additions: number;
  deletions: number;
  patch?: string;
}

interface SuggestedTest {
  filename: string;
  content: string;
  description: string;
}

interface GeneratedTestPRInfo {
  id: string;
  prNumber: number;
  prUrl?: string | null;
  status: string;
  testsGenerated: number;
  branchName: string;
}

interface PRData {
  id: string;
  owner: string;
  repo: string;
  prNumber: number;
  impactedTests: string[];
  skippedTests: string[];
  changedFiles?: ChangedFile[] | any;
  suggestedTests?: SuggestedTest[] | any;
  generatedTestPR?: GeneratedTestPRInfo | null;
  testsRun?: number | null;
  testsFailed?: number | null;
  timeSaved?: string | null;
  createdAt: Date;
  headSha?: string | null;
}

export default function PRRow({ pr }: { pr: PRData }) {
  const [expanded, setExpanded] = useState(false);
  const [activeTab, setActiveTab] = useState<"impact" | "generated" | "changes">("impact");

  const totalTests = pr.impactedTests.length + pr.skippedTests.length;
  const savedPercent = totalTests > 0 ? Math.round((pr.skippedTests.length / totalTests) * 100) : 0;
  const suggestedTests: SuggestedTest[] = Array.isArray(pr.suggestedTests) ? pr.suggestedTests : [];

  return (
    <div className="border border-neutral-800 rounded-lg overflow-hidden bg-neutral-950 hover:border-neutral-700 transition-colors">
      {/* Header Row */}
      <div
        className="px-5 py-4 flex items-center gap-5 cursor-pointer hover:bg-neutral-900/50 transition-colors select-none"
        onClick={() => setExpanded(!expanded)}
      >
        {/* Expand indicator */}
        <span className="text-neutral-600 text-xs font-mono w-4 shrink-0">
          {expanded ? "−" : "+"}
        </span>

        {/* PR Info */}
        <div className="min-w-[120px]">
          <h4 className="text-white font-semibold text-sm">PR #{pr.prNumber}</h4>
          <p className="text-neutral-600 text-[11px] font-mono mt-0.5">
            {new Date(pr.createdAt).toLocaleDateString()}
            {pr.headSha && <span className="ml-1.5 text-neutral-700">{pr.headSha.substring(0, 7)}</span>}
          </p>
        </div>

        {/* Stats */}
        <div className="flex-1 flex items-center gap-8 justify-center">
          <div className="text-center">
            <p className="text-[10px] uppercase tracking-[0.15em] text-neutral-600 mb-0.5">Impacted</p>
            <p className="text-red-400 font-bold text-sm tabular-nums">{pr.impactedTests.length}</p>
          </div>
          <div className="text-center">
            <p className="text-[10px] uppercase tracking-[0.15em] text-neutral-600 mb-0.5">Skipped</p>
            <p className="text-yellow-400 font-bold text-sm tabular-nums">{pr.skippedTests.length}</p>
          </div>
          <div className="text-center">
            <p className="text-[10px] uppercase tracking-[0.15em] text-neutral-600 mb-0.5">Generated</p>
            <p className="text-green-400 font-bold text-sm tabular-nums">{suggestedTests.length}</p>
          </div>
          <div className="text-center">
            <p className="text-[10px] uppercase tracking-[0.15em] text-neutral-600 mb-0.5">Saved</p>
            <p className="text-neutral-300 font-bold text-sm">{pr.timeSaved || `${savedPercent}%`}</p>
          </div>
        </div>

        {/* Generate Tests Button */}
        <div className="shrink-0" onClick={(e) => e.stopPropagation()}>
          <GenerateTestsButton
            owner={pr.owner}
            repo={pr.repo}
            prNumber={pr.prNumber}
            evaluationId={pr.id}
            existingGenPR={pr.generatedTestPR ? {
              prUrl: pr.generatedTestPR.prUrl,
              prNumber: pr.generatedTestPR.prNumber,
              testsGenerated: pr.generatedTestPR.testsGenerated,
              status: pr.generatedTestPR.status,
            } : null}
          />
        </div>
      </div>

      {/* Expanded Content */}
      {expanded && (
        <div className="border-t border-neutral-800">
          {/* Tabs */}
          <div className="flex border-b border-neutral-800 bg-neutral-900/50">
            {([
              { key: "impact" as const, label: "Impact Analysis" },
              { key: "generated" as const, label: `Generated Tests (${suggestedTests.length})` },
              { key: "changes" as const, label: `Code Changes (${pr.changedFiles?.length || 0})` },
            ]).map((tab) => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={`px-5 py-3 text-xs font-medium transition-colors cursor-pointer ${
                  activeTab === tab.key
                    ? "text-white border-b-2 border-white bg-black/30"
                    : "text-neutral-500 hover:text-neutral-300"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Tab: Impact Analysis */}
          {activeTab === "impact" && (
            <div className="grid grid-cols-1 md:grid-cols-2 divide-y md:divide-y-0 md:divide-x divide-neutral-800 bg-black/40">
              {/* Impacted Tests */}
              <div className="p-5">
                <div className="flex items-center justify-between mb-3">
                  <h5 className="text-xs font-semibold uppercase tracking-[0.15em] text-red-400/80">
                    Impacted Tests
                  </h5>
                  <span className="text-[10px] font-mono text-neutral-600">{pr.impactedTests.length}</span>
                </div>
                {pr.impactedTests.length > 0 ? (
                  <div className="space-y-1">
                    {pr.impactedTests.map((test, i) => (
                      <div key={i} className="flex items-start gap-2.5 py-1.5 px-3 rounded bg-red-500/5 border border-red-500/10">
                        <span className="w-1.5 h-1.5 rounded-full bg-red-400 shrink-0 mt-1" />
                        <span className="text-neutral-300 font-mono text-xs break-all leading-relaxed">{test}</span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-neutral-700 text-xs italic">No tests impacted</p>
                )}
              </div>

              {/* Skipped Tests */}
              <div className="p-5">
                <div className="flex items-center justify-between mb-3">
                  <h5 className="text-xs font-semibold uppercase tracking-[0.15em] text-yellow-400/80">
                    Skipped Tests
                  </h5>
                  <span className="text-[10px] font-mono text-neutral-600">{pr.skippedTests.length}</span>
                </div>
                {pr.skippedTests.length > 0 ? (
                  <div className="space-y-1">
                    {pr.skippedTests.slice(0, 10).map((test, i) => (
                      <div key={i} className="flex items-start gap-2.5 py-1.5 px-3 rounded bg-yellow-500/5 border border-yellow-500/10">
                        <span className="w-1.5 h-1.5 rounded-full bg-yellow-500 shrink-0 mt-1" />
                        <span className="text-neutral-400 font-mono text-xs truncate">{test}</span>
                      </div>
                    ))}
                    {pr.skippedTests.length > 10 && (
                      <p className="text-neutral-600 text-[11px] pl-4 pt-1">
                        + {pr.skippedTests.length - 10} more
                      </p>
                    )}
                  </div>
                ) : (
                  <p className="text-neutral-700 text-xs italic">No tests skipped</p>
                )}
              </div>
            </div>
          )}

          {/* Tab: Generated Tests */}
          {activeTab === "generated" && (
            <div className="bg-black/40 p-5">
              {suggestedTests.length > 0 ? (
                <div className="space-y-3">
                  {suggestedTests.map((test: SuggestedTest, i: number) => (
                    <div key={i} className="rounded border border-neutral-800 overflow-hidden">
                      <div className="px-4 py-2.5 bg-neutral-900 border-b border-neutral-800 flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="w-1.5 h-1.5 rounded-full bg-green-400 shrink-0" />
                          <span className="font-mono text-xs text-green-300">{test.filename}</span>
                        </div>
                        <span className="text-[10px] text-neutral-600 max-w-[300px] truncate">{test.description}</span>
                      </div>
                      <pre className="p-4 overflow-x-auto text-xs font-mono text-neutral-400 leading-relaxed whitespace-pre-wrap bg-black/60">
                        {test.content}
                      </pre>
                    </div>
                  ))}
                  {pr.generatedTestPR?.prUrl && (
                    <div className="pt-2 border-t border-neutral-800 mt-4">
                      <a
                        href={pr.generatedTestPR.prUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-xs text-green-400/70 hover:text-green-400 transition-colors"
                      >
                        View PR #{pr.generatedTestPR.prNumber} →
                      </a>
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-center py-12">
                  <p className="text-neutral-600 text-sm mb-1">No tests generated yet</p>
                  <p className="text-neutral-700 text-xs">Click "Generate Tests" to create AI-powered test cases for this PR.</p>
                </div>
              )}
            </div>
          )}

          {/* Tab: Code Changes */}
          {activeTab === "changes" && (
            <div className="bg-black/40 p-5">
              {pr.changedFiles && pr.changedFiles.length > 0 ? (
                <div className="space-y-3">
                  {pr.changedFiles.map((file: ChangedFile, i: number) => (
                    <div key={i} className="rounded border border-neutral-800 overflow-hidden">
                      <div className="px-4 py-2 bg-neutral-900 border-b border-neutral-800 flex items-center justify-between">
                        <span className="font-mono text-xs text-neutral-300">{file.filename}</span>
                        <div className="flex items-center gap-3 text-xs font-mono">
                          <span className="text-green-400">+{file.additions}</span>
                          <span className="text-red-400">-{file.deletions}</span>
                        </div>
                      </div>
                      {file.patch ? (
                        <div className="overflow-x-auto">
                          <pre className="text-xs font-mono leading-relaxed whitespace-pre-wrap">
                            {file.patch.split('\n').map((line, j) => (
                              <div
                                key={j}
                                className={`px-4 py-px ${
                                  line.startsWith('+') ? 'bg-green-500/8 text-green-300' :
                                  line.startsWith('-') ? 'bg-red-500/8 text-red-300' :
                                  line.startsWith('@@') ? 'bg-neutral-900 text-neutral-500 py-1' :
                                  'text-neutral-500'
                                }`}
                              >
                                {line}
                              </div>
                            ))}
                          </pre>
                        </div>
                      ) : (
                        <div className="px-4 py-3 text-xs text-neutral-600">Binary file or no diff available</div>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-neutral-600 text-xs text-center py-8">No code changes recorded.</p>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
