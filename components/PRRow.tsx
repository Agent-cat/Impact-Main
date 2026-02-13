"use client";

import { useState } from "react";
import { ChevronDown, ChevronRight, CheckCircle, XCircle, Clock, FileCode, TestTube, AlertTriangle } from "lucide-react";

// Define a type that matches the PR structure we expect
interface ChangedFile {
  filename: string;
  status: string;
  additions: number;
  deletions: number;
  patch?: string;
}

interface PRData {
  id: string;
  prNumber: number;
  impactedTests: string[];
  skippedTests: string[];
  changedFiles?: ChangedFile[] | any; // Use any for loose JSON typing from Prisma
  testsRun?: number | null;
  testsFailed?: number | null;
  timeSaved?: string | null;
  createdAt: Date;
  headSha?: string | null;
}

export default function PRRow({ pr }: { pr: PRData }) {
  const [expanded, setExpanded] = useState(false);

  // Calculate percentages/stats
  const totalTests = pr.impactedTests.length + pr.skippedTests.length;
  const impactedPercentage = totalTests > 0 ? Math.round((pr.impactedTests.length / totalTests) * 100) : 0;

  // Status determination
  const hasImpacted = pr.impactedTests.length > 0;
  const statusColor = hasImpacted ? "text-amber-400" : "text-emerald-400";
  const StatusIcon = hasImpacted ? AlertTriangle : CheckCircle;

  return (
    <div className="bg-zinc-900/50 border border-white/5 rounded-xl overflow-hidden hover:border-white/10 transition-colors">
      <div
        className="p-4 flex items-center gap-4 cursor-pointer hover:bg-white/5 transition-colors"
        onClick={() => setExpanded(!expanded)}
      >
        <button className="text-gray-400 hover:text-white transition-colors">
          {expanded ? <ChevronDown className="w-5 h-5" /> : <ChevronRight className="w-5 h-5" />}
        </button>

        <div className="flex-1 min-w-0 grid grid-cols-12 gap-4 items-center">
            {/* PR Info */}
            <div className="col-span-4 flex items-center gap-3">
                <div className={`p-2 rounded-lg bg-zinc-800 ${statusColor} bg-opacity-10`}>
                    <StatusIcon className={`w-5 h-5 ${statusColor}`} />
                </div>
                <div>
                    <h4 className="text-white font-medium truncate">PR #{pr.prNumber}</h4>
                    <div className="flex items-center gap-2 text-xs text-gray-500">
                        <Clock className="w-3 h-3" />
                        <span>{new Date(pr.createdAt).toLocaleString()}</span>
                    </div>
                </div>
            </div>

            {/* Stats */}
            <div className="col-span-8 flex items-center justify-between gap-6">
                <div className="flex flex-col items-center">
                    <span className="text-xs text-gray-400 uppercase tracking-wider mb-1">Impacted</span>
                    <span className="text-amber-400 font-bold">{pr.impactedTests.length}</span>
                </div>

                <div className="flex flex-col items-center">
                    <span className="text-xs text-gray-400 uppercase tracking-wider mb-1">Skipped</span>
                    <span className="text-gray-400 font-bold">{pr.skippedTests.length}</span>
                </div>

                <div className="flex flex-col items-center">
                    <span className="text-xs text-gray-400 uppercase tracking-wider mb-1">Saved</span>
                    <span className="text-emerald-400 font-bold">{pr.timeSaved || "0s"}</span>
                </div>

                {pr.headSha && (
                    <div className="text-xs font-mono text-gray-600 bg-black/30 px-2 py-1 rounded border border-white/5">
                        {pr.headSha.substring(0, 7)}
                    </div>
                )}
            </div>
        </div>
      </div>

      {expanded && (
        <div className="border-t border-white/5 bg-black/20 p-6 grid grid-cols-1 md:grid-cols-2 gap-6 animate-in slide-in-from-top-2 duration-200">
            {/* Impacted Tests Column */}
            <div className="space-y-3">
                <div className="flex items-center gap-2 text-amber-400 mb-2">
                    <AlertTriangle className="w-4 h-4" />
                    <h5 className="font-semibold text-sm uppercase tracking-wider">Impacted Tests ({pr.impactedTests.length})</h5>
                </div>
                {pr.impactedTests.length > 0 ? (
                    <div className="space-y-2">
                        {pr.impactedTests.map((test, index) => (
                            <div key={index} className="flex items-start gap-3 p-3 rounded-lg bg-amber-500/5 border border-amber-500/10 text-sm">
                                <TestTube className="w-4 h-4 text-amber-500 mt-0.5 shrink-0" />
                                <span className="text-gray-300 break-all font-mono text-xs">{test}</span>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="text-gray-500 text-sm italic">No tests impacted</div>
                )}
            </div>


            {/* Skipped Tests Column */}
            <div className="space-y-3">
                <div className="flex items-center gap-2 text-gray-400 mb-2">
                    <CheckCircle className="w-4 h-4" />
                    <h5 className="font-semibold text-sm uppercase tracking-wider">Skipped Tests ({pr.skippedTests.length})</h5>
                </div>
                {pr.skippedTests.length > 0 ? (
                    <div className="space-y-1">
                        {pr.skippedTests.slice(0, 5).map((test, index) => (
                            <div key={index} className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-white/5 text-xs text-gray-500 transition-colors">
                                <span className="w-1.5 h-1.5 rounded-full bg-gray-600 shrink-0" />
                                <span className="truncate font-mono">{test}</span>
                            </div>
                        ))}
                        {pr.skippedTests.length > 5 && (
                            <div className="text-xs text-gray-600 pl-6 pt-1">
                                + {pr.skippedTests.length - 5} more skipped tests
                            </div>
                        )}
                    </div>
                ) : (
                    <div className="text-gray-500 text-sm italic">No tests skipped</div>
                )}
            </div>

            {/* Code Changes Section - Full Width */}
            <div className="col-span-1 md:col-span-2 border-t border-white/5 pt-6 mt-2">
                <div className="flex items-center gap-2 text-indigo-400 mb-4">
                    <FileCode className="w-4 h-4" />
                    <h5 className="font-semibold text-sm uppercase tracking-wider">Code Changes ({pr.changedFiles?.length || 0})</h5>
                </div>

                {pr.changedFiles && pr.changedFiles.length > 0 ? (
                    <div className="space-y-4">
                        {pr.changedFiles.map((file: ChangedFile, index: number) => (
                            <div key={index} className="rounded-lg overflow-hidden border border-white/10 bg-black/40">
                                <div className="px-4 py-2 bg-white/5 flex items-center justify-between border-b border-white/5">
                                    <span className="text-sm font-mono text-gray-300">{file.filename}</span>
                                    <div className="flex items-center gap-3 text-xs">
                                        <span className="text-emerald-400">+{file.additions}</span>
                                        <span className="text-red-400">-{file.deletions}</span>
                                    </div>
                                </div>
                                {file.patch ? (
                                    <div className="p-4 overflow-x-auto">
                                        <pre className="text-xs font-mono text-gray-400 leading-relaxed whitespace-pre-wrap">
                                            {file.patch.split('\n').map((line, i) => (
                                                <div key={i} className={`
                                                    ${line.startsWith('+') ? 'bg-emerald-500/10 text-emerald-300 block w-full -mx-4 px-4' : ''}
                                                    ${line.startsWith('-') ? 'bg-red-500/10 text-red-300 block w-full -mx-4 px-4' : ''}
                                                    ${line.startsWith('@@') ? 'text-indigo-400 py-1 block' : ''}
                                                `}>
                                                    {line}
                                                </div>
                                            ))}
                                        </pre>
                                    </div>
                                ) : (
                                    <div className="p-4 text-xs text-gray-600 italic">Binary file or no diff available</div>
                                )}
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="text-gray-500 text-sm italic">No code changes recorded for this analysis.</div>
                )}
            </div>
        </div>
      )}
    </div>
  );
}
