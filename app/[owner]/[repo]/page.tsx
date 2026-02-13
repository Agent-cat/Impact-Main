import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { ArrowLeft, GitPullRequest, LayoutDashboard, Database, Activity, Clock } from "lucide-react";
import PRRow from "@/components/PRRow";
import Navbar from "@/components/Navbar";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { redirect } from "next/navigation";

export default async function RepoPage({
  params,
}: {
  params: Promise<{ owner: string; repo: string }>;
}) {
  const { owner, repo } = await params;
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) {
    redirect("/");
  }

  const prs = await prisma.pREvaluation.findMany({
    where: {
      owner,
      repo,
    },
    orderBy: {
      createdAt: "desc",
    },
  });

  const totalTestsImpacted = prs.reduce((acc, pr) => acc + pr.impactedTests.length, 0);
  const totalTestsSkipped = prs.reduce((acc, pr) => acc + pr.skippedTests.length, 0);

  return (
    <div className="min-h-screen bg-black text-white">
      <Navbar user={session.user} />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">

        {/* Header */}
        <div className="mb-8 flex items-center justify-between">
            <div className="flex items-center gap-4">
                <Link
                    href="/dashboard"
                    className="p-2 rounded-lg hover:bg-white/10 text-gray-400 hover:text-white transition-colors"
                >
                    <ArrowLeft className="w-5 h-5" />
                </Link>
                <div>
                    <h1 className="text-3xl font-bold text-white tracking-tight flex items-center gap-3">
                        {repo}
                        <span className="text-sm font-semibold text-gray-500 bg-white/5 px-2 py-1 rounded-full border border-white/5">
                            {owner}
                        </span>
                    </h1>
                </div>
            </div>

            <div className="flex items-center gap-4 text-sm text-gray-400">
                <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-zinc-900 border border-white/5">
                    <Activity className="w-4 h-4 text-indigo-400" />
                    <span className="font-mono text-white">{prs.length}</span> PRs Analyzed
                </div>
            </div>
        </div>



        {/* PR List */}
        <div className="space-y-4">
            <div className="flex items-center justify-between mb-2 px-2">
                <h2 className="text-lg font-semibold text-white">Pull Request History</h2>
                <div className="flex items-center gap-2 text-xs text-gray-500">
                    <span>Sort by:</span>
                    <select className="bg-transparent border-none text-white font-medium focus:ring-0 cursor-pointer">
                        <option>Date (Newest)</option>
                        <option>Impact (Highest)</option>
                    </select>
                </div>
            </div>

            {prs.length === 0 ? (
                <div className="text-center py-12 rounded-2xl border border-dashed border-white/10 bg-zinc-900/30">
                    <GitPullRequest className="w-12 h-12 text-gray-600 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-white mb-2">No Pull Requests Analysis Yet</h3>
                    <p className="text-gray-400 max-w-sm mx-auto">
                        Once a pull request is created and analyzed, it will appear here.
                    </p>
                </div>
            ) : (
                <div className="space-y-3">
                    {prs.map((pr) => (
                        <PRRow key={pr.id} pr={pr} />
                    ))}
                </div>
            )}
        </div>
      </main>
    </div>
  );
}
