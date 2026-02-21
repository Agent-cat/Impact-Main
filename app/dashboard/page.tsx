import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
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
    include: { generatedTestPR: true },
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
  const totalTestsGenerated = evaluations.reduce(
    (acc, curr) => acc + (curr.generatedTestPR?.testsGenerated || 0),
    0,
  );

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
      : 0;

  return (
    <div className="min-h-screen bg-black">
      {/* Nav */}
      <nav className="bg-black border-b border-neutral-800 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-14 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-lg font-bold text-white">ImpacAnalyzer</span>
            <span className="text-[10px] font-mono text-neutral-600 border border-neutral-800 px-1.5 py-0.5 rounded">dashboard</span>
          </div>
          <div className="flex items-center gap-4">
            <Link
              href="/"
              className="text-xs font-medium text-neutral-500 hover:text-white transition-colors"
            >
              Repositories
            </Link>
            <div className="h-5 w-px bg-neutral-800"></div>
            <div className="flex items-center gap-2">
              <img
                src={session.user.image || ""}
                className="w-7 h-7 rounded-full border border-neutral-700"
                alt=""
              />
              <span className="text-xs text-neutral-400 hidden sm:block">
                {session.user.name}
              </span>
            </div>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-white">
            Analysis Dashboard
          </h1>
          <p className="text-neutral-600 text-sm mt-1">
            Monitor PR impact analysis and CI time savings.
          </p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-3 mb-8">
          <StatsCard
            title="Analyses"
            value={totalAnalyses.toString()}
            color="text-white"
          />
          <StatsCard
            title="Impacted"
            value={totalImpacted.toLocaleString()}
            color="text-red-400"
          />
          <StatsCard
            title="Skipped"
            value={totalSkipped.toLocaleString()}
            color="text-yellow-400"
          />
          <StatsCard
            title="Generated"
            value={totalTestsGenerated.toLocaleString()}
            color="text-green-400"
          />
          <StatsCard
            title="Time Saved"
            value={`${avgTimeSaved}%`}
            color="text-white"
          />
        </div>

        {/* Evaluations Table */}
        <div className="border border-neutral-800 rounded-lg overflow-hidden">
          <div className="px-5 py-3 border-b border-neutral-800 bg-neutral-950 flex justify-between items-center">
            <h2 className="text-sm font-semibold text-neutral-400 uppercase tracking-[0.15em]">Recent Evaluations</h2>
            <span className="text-[10px] text-neutral-600 font-mono">{evaluations.length} total</span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="text-[10px] font-semibold text-neutral-600 uppercase tracking-[0.15em] border-b border-neutral-800/50">
                  <th className="px-5 py-3">Repository / PR</th>
                  <th className="px-5 py-3">Status</th>
                  <th className="px-5 py-3">Impacted</th>
                  <th className="px-5 py-3">Skipped</th>
                  <th className="px-5 py-3">Generated</th>
                  <th className="px-5 py-3">Saved</th>
                  <th className="px-5 py-3">Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-800/50">
                {evaluations.length === 0 ? (
                  <tr>
                    <td
                      colSpan={7}
                      className="px-5 py-12 text-center text-neutral-600 text-sm"
                    >
                      No evaluations found. Connect a repo and open a PR to start.
                    </td>
                  </tr>
                ) : (
                  evaluations.map((ev) => {
                    const isPending = ev.testsRun === null;
                    const hasFailures = (ev.testsFailed || 0) > 0;
                    const localTimeSaved =
                      ev.impactedTests.length > 0 && ev.skippedTests.length > 0
                        ? Math.round(
                            (ev.skippedTests.length /
                              (ev.skippedTests.length + ev.impactedTests.length)) *
                              100,
                          )
                        : 0;
                    const genTests = ev.generatedTestPR?.testsGenerated || 0;

                    return (
                      <tr
                        key={ev.id}
                        className="hover:bg-neutral-950 transition-colors"
                      >
                        <td className="px-5 py-3.5">
                          <Link
                            href={`/${ev.owner}/${ev.repo}`}
                            className="text-sm font-medium text-white hover:text-neutral-300 transition-colors"
                          >
                            {ev.owner}/{ev.repo}
                          </Link>
                          <div className="text-[11px] text-neutral-600 flex items-center gap-1.5 mt-0.5 font-mono">
                            <span>#{ev.prNumber}</span>
                            {ev.headSha && (
                              <>
                                <span className="text-neutral-700">·</span>
                                <span className="text-neutral-700">{ev.headSha.substring(0, 7)}</span>
                              </>
                            )}
                          </div>
                        </td>
                        <td className="px-5 py-3.5">
                          {isPending ? (
                            <span className="text-[11px] font-medium text-neutral-400">
                              ● Running
                            </span>
                          ) : hasFailures ? (
                            <span className="text-[11px] font-medium text-red-400">
                              ✕ Failed ({ev.testsFailed})
                            </span>
                          ) : (
                            <span className="text-[11px] font-medium text-green-400">
                              ✓ Passed
                            </span>
                          )}
                        </td>
                        <td className="px-5 py-3.5">
                          <span className="font-bold text-red-400 text-sm tabular-nums">
                            {ev.impactedTests.length}
                          </span>
                        </td>
                        <td className="px-5 py-3.5">
                          <span className="font-bold text-yellow-400 text-sm tabular-nums">
                            {ev.skippedTests.length}
                          </span>
                        </td>
                        <td className="px-5 py-3.5">
                          <span className={`font-bold text-sm tabular-nums ${genTests > 0 ? 'text-green-400' : 'text-neutral-700'}`}>
                            {genTests}
                          </span>
                        </td>
                        <td className="px-5 py-3.5">
                          <span className="text-white font-bold text-sm">
                            {ev.timeSaved ? ev.timeSaved : localTimeSaved + "%"}
                          </span>
                        </td>
                        <td className="px-5 py-3.5 text-xs text-neutral-600 tabular-nums">
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
  color,
}: {
  title: string;
  value: string;
  color: string;
}) {
  return (
    <div className="bg-neutral-950 border border-neutral-800 rounded-lg p-4">
      <p className="text-[10px] font-semibold text-neutral-600 uppercase tracking-[0.15em] mb-2">
        {title}
      </p>
      <p className={`text-2xl font-bold ${color} tabular-nums`}>{value}</p>
    </div>
  );
}
