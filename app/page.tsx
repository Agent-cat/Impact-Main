import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import Link from "next/link";
import Navbar from "@/components/Navbar";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";

export default async function Home() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) {
    return (
      <div className="min-h-screen bg-black flex flex-col items-center justify-center p-4">
        <div className="max-w-md w-full text-center">
          <h1 className="text-5xl font-extrabold text-white tracking-tight mb-2">
            ImpacAnalyzer
          </h1>
          <div className="w-12 h-px bg-neutral-700 mx-auto my-6"></div>
          <p className="text-neutral-500 mb-10 text-sm leading-relaxed max-w-xs mx-auto">
            Intelligent Test Impact Analysis. Save hours of CI time by running
            only what matters.
          </p>
          <Link
            href="/signin"
            className="inline-flex items-center justify-center gap-2 px-8 py-3.5 bg-white text-black rounded-lg font-semibold text-sm hover:bg-neutral-200 transition-all active:scale-[0.98]"
          >
            Get Started with GitHub
          </Link>
          <p className="mt-8 text-[11px] text-neutral-700">
            Used by high-performance engineering teams.
          </p>
        </div>
      </div>
    );
  }

  const projects = await prisma.repoIndex.findMany({
    orderBy: { lastIndexedAt: "desc" },
  });

  return (
    <div className="min-h-screen bg-black text-white">
      <Navbar user={session.user} />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h2 className="text-2xl font-bold text-white">Your Projects</h2>
            <p className="text-neutral-600 text-sm mt-1">Connected repositories</p>
          </div>
          <button className="bg-white text-black px-4 py-2 rounded-lg text-xs font-semibold hover:bg-neutral-200 transition-colors">
            + Add Project
          </button>
        </div>

        {projects.length === 0 ? (
          <div className="border border-dashed border-neutral-800 rounded-xl p-16 text-center">
            <h3 className="text-lg font-medium text-white mb-2">
              No projects found
            </h3>
            <p className="text-neutral-600 mb-6 max-w-sm mx-auto text-sm">
              Get started by connecting your GitHub repository to analyze test
              impact.
            </p>
            <button className="bg-white text-black px-6 py-2.5 rounded-lg font-semibold text-sm hover:bg-neutral-200 transition-colors">
              Import Project
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {projects.map((project) => (
              <Link
                key={project.id}
                href={`/${project.owner}/${project.repo}`}
                className="group bg-neutral-950 hover:bg-neutral-900 border border-neutral-800 hover:border-neutral-700 rounded-xl p-5 transition-all flex flex-col h-full"
              >
                <div className="flex items-start justify-between mb-3">
                  <h3 className="text-base font-bold text-white group-hover:text-neutral-200 transition-colors">
                    {project.repo}
                  </h3>
                  <span className="text-[10px] font-mono text-neutral-600 bg-neutral-900 px-2 py-0.5 rounded border border-neutral-800">
                    {project.testFiles.length} tests
                  </span>
                </div>

                <p className="text-xs text-neutral-600 mb-4">{project.owner}</p>

                <div className="mt-auto pt-3 border-t border-neutral-800 flex items-center justify-between">
                  <span className="text-[11px] text-neutral-700">
                    Indexed {new Date(project.lastIndexedAt).toLocaleDateString()}
                  </span>
                  <span className="text-neutral-600 group-hover:text-neutral-400 text-xs transition-colors">→</span>
                </div>
              </Link>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
