import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import {
  CheckCircle2,
  XCircle,
  Clock,
  Zap,
  GitPullRequest,
  Search,
} from "lucide-react";
import Link from "next/link";

export default async function DashboardPage() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) {
    redirect("/signin");
  }

  const evaluations = await prisma.pREvaluation.findMany({
    orderBy: { createdAt: "desc" },
  });

  const totalAnalyses = evaluations.length;

  const totalSkipped = evaluations.reduce(
    (acc, curr) => acc + curr.skippedTests.length,
    0,
  );
  const totalImpacted = evaluations.reduce(
    (acc, curr) => acc + curr.impactedTests.length,
    0,
  );
  const totalTests = totalSkipped + totalImpacted;

  const avgTimeSaved =
    totalTests > 0 ? Math.round((totalSkipped / totalTests) * 100) : 0;

  const analysesWithResults = evaluations.filter((e) => e.testsRun !== null);
  const totalRuns = analysesWithResults.reduce(
    (acc, curr) => acc + (curr.testsRun || 0),
    0,
  );
  const totalFailures = analysesWithResults.reduce(
    (acc, curr) => acc + (curr.testsFailed || 0),
    0,
  );
  const passRate =
    totalRuns > 0
      ? Math.round(((totalRuns - totalFailures) / totalRuns) * 100)
      : 0; // Default to 100 if no runs? Or 0.

  return (
    <div className="min-h-screen bg-[#F8F9FA]">
      <nav className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="bg-indigo-600 p-1.5 rounded-lg">
              <Zap className="w-5 h-5 text-white" />
            </div>
            <span className="text-xl font-bold bg-clip-text text-transparent bg-linear-to-r from-indigo-600 to-violet-600">
              ImpacAnalyzer
            </span>
          </div>
          <div className="flex items-center gap-4">
            <Link
              href="/"
              className="text-sm font-medium text-gray-600 hover:text-indigo-600 transition-colors"
            >
              Repositories
            </Link>
            <div className="h-8 w-px bg-gray-200"></div>
            <div className="flex items-center gap-2">
              <img
                src={session.user.image || ""}
                className="w-8 h-8 rounded-full border border-gray-200"
                alt=""
              />
              <span className="text-sm text-gray-700 hidden sm:block">
                {session.user.name}
              </span>
            </div>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 tracking-tight">
              AI Analysis Dashboard
            </h1>
            <p className="text-gray-500 mt-1">
              Monitor PR impact analysis and CI time savings.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <div className="bg-white border border-gray-200 rounded-lg px-4 py-2 flex items-center gap-2 shadow-sm">
              <Search className="w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Filter PRs..."
                className="bg-transparent border-none focus:ring-0 text-sm w-48"
              />
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <StatsCard
            title="Total Analyses"
            value={totalAnalyses.toString()}
            sub="Lifetime"
            icon={<Clock className="w-5 h-5 text-indigo-500" />}
          />
          <StatsCard
            title="Avg. Time Saved"
            value={`${avgTimeSaved}%`}
            sub="Based on skipped tests"
            icon={<Zap className="w-5 h-5 text-amber-500" />}
          />
          <StatsCard
            title="Tests Skipped"
            value={totalSkipped.toLocaleString()}
            sub="Total redundant tests avoided"
            icon={<CheckCircle2 className="w-5 h-5 text-emerald-500" />}
          />
        </div>

        <div className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm">
          <div className="px-6 py-4 border-b border-gray-100 bg-gray-50/50 flex justify-between items-center">
            <h2 className="font-semibold text-gray-800">Recent Evaluations</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
                  <th className="px-6 py-4">Repository / PR</th>
                  <th className="px-6 py-4">Status</th>
                  <th className="px-6 py-4">Impacted</th>
                  <th className="px-6 py-4">Skipped</th>
                  <th className="px-6 py-4">Time Saved</th>
                  <th className="px-6 py-4">Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {evaluations.length === 0 ? (
                  <tr>
                    <td
                      colSpan={6}
                      className="px-6 py-12 text-center text-gray-500"
                    >
                      No evaluations found. Connect a repo and open a PR to
                      start.
                    </td>
                  </tr>
                ) : (
                  evaluations.map((ev) => {
                    const isPending = ev.testsRun === null;
                    const hasFailures = (ev.testsFailed || 0) > 0;
                    const localTimeSaved =
                      ev.testsRun !== null &&
                      ev.impactedTests.length > 0 &&
                      ev.skippedTests.length > 0
                        ? Math.round(
                            (ev.skippedTests.length /
                              (ev.skippedTests.length +
                                ev.impactedTests.length)) *
                              100,
                          )
                        : 0;

                    return (
                      <tr
                        key={ev.id}
                        className="hover:bg-gray-50/50 transition-colors"
                      >
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <div className="bg-gray-100 p-2 rounded-lg">
                              <GitPullRequest className="w-4 h-4 text-gray-600" />
                            </div>
                            <div>
                              <Link
                                href={`/${ev.owner}/${ev.repo}`}
                                className="font-medium text-gray-900 hover:text-indigo-600 transition-colors"
                              >
                                {ev.owner}/{ev.repo}
                              </Link>
                              <div className="text-xs text-gray-500 flex items-center gap-1">
                                <span>PR #{ev.prNumber}</span>
                                {ev.headSha && (
                                  <>
                                    <span>•</span>
                                    <span className="font-mono bg-gray-100 px-1 rounded text-[10px]">
                                      {ev.headSha.substring(0, 7)}
                                    </span>
                                  </>
                                )}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          {isPending ? (
                            <div className="flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-full bg-blue-50 text-blue-700 border border-blue-100 w-fit">
                              <div className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse"></div>
                              Running
                            </div>
                          ) : hasFailures ? (
                            <div className="flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-full bg-red-50 text-red-700 border border-red-100 w-fit">
                              <XCircle className="w-3 h-3" />
                              Failed ({ev.testsFailed})
                            </div>
                          ) : (
                            <div className="flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-100 w-fit">
                              <CheckCircle2 className="w-3 h-3" />
                              Passed
                            </div>
                          )}
                        </td>
                        <td className="px-6 py-4">
                          <span className="font-semibold text-indigo-600">
                            {ev.impactedTests.length}
                          </span>
                          <span className="text-gray-400 text-sm"> tests</span>
                        </td>
                        <td className="px-6 py-4">
                          <span className="text-gray-700">
                            {ev.skippedTests.length}
                          </span>
                          <span className="text-gray-400 text-sm"> tests</span>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-1 text-amber-600 font-bold">
                            <Zap className="w-3.5 h-3.5 fill-amber-500" />
                            {ev.timeSaved ? ev.timeSaved : localTimeSaved + "%"}
                          </div>
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-500">
                          {new Date(ev.createdAt).toLocaleDateString()}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      </main>
    </div>
  );
}

function StatsCard({
  title,
  value,
  sub,
  icon,
}: {
  title: string;
  value: string;
  sub: string;
  icon: React.ReactNode;
}) {
  return (
    <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm hover:shadow-md transition-shadow">
      <div className="flex items-center justify-between mb-4">
        <span className="text-sm font-medium text-gray-500 uppercase tracking-tight">
          {title}
        </span>
        <div className="bg-gray-50 p-2 rounded-lg">{icon}</div>
      </div>
      <div className="flex items-baseline gap-2">
        <span className="text-3xl font-bold text-gray-900">{value}</span>
        <span className="text-xs text-gray-400 font-medium">{sub}</span>
      </div>
    </div>
  );
}
