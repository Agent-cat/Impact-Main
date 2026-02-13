import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import Link from "next/link";
import { Zap, Github, Plus, FolderGit2, ArrowRight } from "lucide-react";
import Navbar from "@/components/Navbar";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";

export default async function Home() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) {
    return (
      <div className="min-h-screen bg-black flex flex-col items-center justify-center p-4 relative overflow-hidden">
        {/* Background Gradients */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[1000px] h-[400px] bg-indigo-500/20 blur-[120px] rounded-full pointer-events-none" />

        <div className="max-w-md w-full text-center relative z-10">
            <div className="inline-flex p-3 bg-zinc-900/80 backdrop-blur-sm rounded-2xl shadow-lg border border-white/10 mb-6">
                <Zap className="w-10 h-10 text-indigo-500" />
            </div>
            <h1 className="text-4xl font-extrabold text-white tracking-tight mb-4">
                ImpacAnalyzer
            </h1>
            <p className="text-gray-400 mb-8 text-lg">
                Intelligent Test Impact Analysis. Save hours of CI time by running only what matters.
            </p>
            <Link
                href="/signin"
                className="group flex items-center justify-center gap-2 px-8 py-4 bg-white text-black rounded-xl font-semibold hover:bg-gray-200 transition-all shadow-lg hover:shadow-xl hover:-translate-y-1 active:translate-y-0"
            >
                <Github className="w-5 h-5" />
                Get Started with GitHub
            </Link>
            <p className="mt-6 text-xs text-gray-500">
                Used by high-performance engineering teams worldwide.
            </p>
        </div>
      </div>
    );
  }

  const projects = await prisma.repoIndex.findMany({
    orderBy: { lastIndexedAt: 'desc' }
  });

  return (
    <div className="min-h-screen bg-black text-white">
      <Navbar user={session.user} />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="flex items-center justify-between mb-8">
            <h2 className="text-2xl font-bold bg-clip-text text-transparent bg-linear-to-r from-white to-white/60">Your Projects</h2>
            <button className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors">
                <Plus className="w-4 h-4" />
                Add Project
            </button>
        </div>

        {projects.length === 0 ? (
            <div className="border border-dashed border-white/10 rounded-2xl p-12 text-center bg-zinc-900/30">
                <div className="mx-auto w-12 h-12 bg-zinc-800 rounded-full flex items-center justify-center mb-4">
                    <FolderGit2 className="w-6 h-6 text-gray-400" />
                </div>
                <h3 className="text-lg font-medium text-white mb-2">No projects found</h3>
                <p className="text-gray-400 mb-6 max-w-sm mx-auto">
                    Get started by connecting your GitHub repository to analyze test impact.
                </p>
                <button className="bg-white text-black px-6 py-2 rounded-lg font-semibold hover:bg-gray-200 transition-colors">
                    Import Project
                </button>
            </div>
        ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {projects.map((project) => (
                    <Link
                        key={project.id}
                        href={`/${project.owner}/${project.repo}`}
                        className="group relative bg-zinc-900/50 hover:bg-zinc-900 border border-white/10 hover:border-indigo-500/50 rounded-2xl p-6 transition-all duration-300 hover:shadow-2xl hover:shadow-indigo-500/10 flex flex-col h-full"
                    >
                        <div className="flex items-start justify-between mb-4">
                            <div className="p-2 bg-zinc-800 rounded-lg group-hover:bg-indigo-500/20 group-hover:text-indigo-400 transition-colors">
                                <FolderGit2 className="w-6 h-6 text-gray-400 group-hover:text-indigo-400 transition-colors" />
                            </div>
                            <span className="text-xs font-medium text-gray-500 bg-zinc-800/50 px-2 py-1 rounded-full border border-white/5">
                                {project.testFiles.length} Test Files
                            </span>
                        </div>

                        <div className="mb-4">
                            <h3 className="text-xl font-bold text-white mb-1 group-hover:text-indigo-400 transition-colors">
                                {project.repo}
                            </h3>
                            <p className="text-sm text-gray-400">
                                {project.owner}
                            </p>
                        </div>

                        <div className="mt-auto pt-4 border-t border-white/5 flex items-center justify-between">
                            <span className="text-xs text-gray-500">
                                Last indexed {new Date(project.lastIndexedAt).toLocaleDateString()}
                            </span>
                            <ArrowRight className="w-4 h-4 text-gray-500 group-hover:text-indigo-400 group-hover:translate-x-1 transition-all" />
                        </div>
                    </Link>
                ))}
            </div>
        )}
      </main>
    </div>
  );
}
