import { prisma } from "@/lib/prisma";
import Link from "next/link";
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
    include: {
      generatedTestPR: true,
    },
  });

  const totalTestsSkipped = prs.reduce((acc, pr) => acc + pr.skippedTests.length, 0);
  const totalTestsImpacted = prs.reduce((acc, pr) => acc + pr.impactedTests.length, 0);
  const totalTests = totalTestsImpacted + totalTestsSkipped;
  const savedPercent = totalTests > 0 ? Math.round((totalTestsSkipped / totalTests) * 100) : 0;

  return (
    <div className="min-h-screen bg-black text-white">
      <Navbar user={session.user} />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">

        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-1">
            <Link
              href="/"
              className="text-neutral-600 hover:text-neutral-400 text-xs transition-colors"
            >
              ← back
            </Link>
          </div>
          <div className="flex items-center justify-between mt-4">
            <div>
              <h1 className="text-3xl font-bold text-white tracking-tight">
                {repo}
              </h1>
              <p className="text-neutral-600 text-sm mt-1 font-mono">{owner}</p>
            </div>

            <div className="flex items-center gap-6 text-sm">
              <div className="text-center">
                <p className="text-neutral-600 text-[10px] uppercase tracking-[0.15em]">PRs</p>
                <p className="text-white font-bold text-lg tabular-nums">{prs.length}</p>
              </div>
              <div className="w-px h-8 bg-neutral-800" />
              <div className="text-center">
                <p className="text-neutral-600 text-[10px] uppercase tracking-[0.15em]">Saved</p>
                <p className="text-white font-bold text-lg">{savedPercent}%</p>
              </div>
            </div>
          </div>
        </div>

        {/* PR List */}
        <div className="space-y-4">
          <div className="flex items-center justify-between mb-2">
            <h2 className="text-sm font-semibold text-neutral-400 uppercase tracking-[0.15em]">Pull Request History</h2>
          </div>

          {prs.length === 0 ? (
            <div className="text-center py-16 rounded-xl border border-dashed border-neutral-800">
              <h3 className="text-base font-medium text-white mb-2">No Pull Requests Analyzed Yet</h3>
              <p className="text-neutral-600 max-w-sm mx-auto text-sm">
                Once a pull request is created and analyzed, it will appear here.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {prs.map((pr) => (
                <PRRow
                  key={pr.id}
                  pr={{
                    ...pr,
                    owner,
                    repo,
                    suggestedTests: pr.suggestedTests as any,
                    generatedTestPR: pr.generatedTestPR ? {
                      id: pr.generatedTestPR.id,
                      prNumber: pr.generatedTestPR.prNumber,
                      prUrl: pr.generatedTestPR.prUrl,
                      status: pr.generatedTestPR.status,
                      testsGenerated: pr.generatedTestPR.testsGenerated,
                      branchName: pr.generatedTestPR.branchName,
                    } : null,
                  }}
                />
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
