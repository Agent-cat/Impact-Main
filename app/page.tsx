import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import Image from "next/image";
import Link from "next/link";
import { LogOut, Star, GitFork, ExternalLink, Zap, LayoutDashboard, Github } from "lucide-react";
import SignOutButton from "@/components/SignOutButton";
import IndexButton from "@/components/IndexButton";

export default async function Home() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) {
    return (
      <div className="min-h-screen bg-[#F8F9FA] flex flex-col items-center justify-center p-4">
        <div className="max-w-md w-full text-center">
            <div className="inline-flex p-3 bg-white rounded-2xl shadow-sm border border-gray-100 mb-6">
                <Zap className="w-10 h-10 text-indigo-600" />
            </div>
            <h1 className="text-4xl font-extrabold text-gray-900 tracking-tight mb-4 bg-clip-text text-transparent bg-gradient-to-r from-indigo-600 to-violet-600">
                ImpacAnalyzer
            </h1>
            <p className="text-gray-500 mb-8 text-lg">
                Intelligent Test Impact Analysis. Save hours of CI time by running only what matters.
            </p>
            <Link
                href="/signin"
                className="group flex items-center justify-center gap-2 px-8 py-4 bg-black text-white rounded-xl font-semibold hover:bg-gray-900 transition-all shadow-lg hover:shadow-xl hover:-translate-y-1 active:translate-y-0"
            >
                <Github className="w-5 h-5" />
                Get Started with GitHub
            </Link>
            <p className="mt-6 text-xs text-gray-400">
                Used by high-performance engineering teams worldwide.
            </p>
        </div>
      </div>
    );
  }

  const account = await prisma.account.findFirst({
    where: {
      userId: session.user.id,
      providerId: "github",
    },
  });

  if (!account || !account.accessToken) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-4 bg-[#F8F9FA]">
        <div className="bg-white p-8 rounded-2xl border border-gray-100 shadow-sm text-center max-w-sm">
            <h1 className="text-2xl font-bold text-gray-900 mb-4">
            Connection Needed
            </h1>
            <p className="text-gray-500 mb-6">
            Please sign in with GitHub to link your account and access your repositories.
            </p>
            <Link href="/signin" className="block w-full py-3 bg-indigo-600 text-white rounded-xl font-medium hover:bg-indigo-700 transition-colors">
                Connect GitHub
            </Link>
        </div>
      </div>
    );
  }

  // Fetch repositories from GitHub API
  const reposResponse = await fetch("https://api.github.com/user/repos?sort=updated&per_page=100&visibility=all", {
    headers: {
      Authorization: `Bearer ${account.accessToken}`,
      Accept: "application/vnd.github.v3+json",
    },
    next: { revalidate: 60 },
  });

  if (!reposResponse.ok) {
    // ... error handling remains same or simplified
    return (
        <div className="min-h-screen flex flex-col items-center justify-center p-4 bg-[#F8F9FA]">
            <h1 className="text-2xl font-bold text-red-600 mb-4">GitHub API Error</h1>
            <p className="text-gray-500 mb-6">Failed to retrieve your repositories. Status: {reposResponse.status}</p>
            <Link href="/api/auth/sign-out" className="px-6 py-2 bg-gray-200 text-gray-700 rounded-lg">Sign Out</Link>
        </div>
    );
  }

  const repos = await reposResponse.json();

  return (
    <div className="min-h-screen bg-[#F8F9FA]">
      <header className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Zap className="w-6 h-6 text-indigo-600" />
            <span className="font-bold text-xl tracking-tight">ImpacAnalyzer</span>
          </div>

          <div className="flex items-center gap-4">
            <Link href="/dashboard" className="flex items-center gap-2 text-sm font-medium text-gray-600 hover:text-indigo-600 transition-colors px-3 py-1.5 rounded-lg hover:bg-indigo-50">
              <LayoutDashboard className="w-4 h-4" />
              Analyze Dashboard
            </Link>
            <div className="h-6 w-[1px] bg-gray-200"></div>
            <div className="flex items-center gap-3">
                {session.user.image && (
                <Image
                    src={session.user.image}
                    alt={session.user.name || "User"}
                    width={32}
                    height={32}
                    className="rounded-full border border-gray-200"
                />
                )}
                <div className="hidden sm:block">
                    <p className="text-sm font-semibold text-gray-900 leading-none">{session.user.name}</p>
                </div>
                <SignOutButton />
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8 flex justify-between items-end">
            <div>
                <h2 className="text-2xl font-bold text-gray-900">My Repositories</h2>
                <p className="text-gray-500">Select a repository to monitor or index.</p>
            </div>
            <div className="text-sm text-gray-400 font-medium bg-white px-3 py-1 rounded-full border border-gray-100 shadow-sm">
                {repos.length} Repositories
            </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {Array.isArray(repos) && repos.map((repo: any) => (
            <div
              key={repo.id}
              className="group bg-white rounded-2xl border border-gray-200 p-6 hover:shadow-xl hover:shadow-indigo-500/5 hover:-translate-y-1 transition-all duration-300 flex flex-col"
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                        <Link
                            href={repo.html_url}
                            target="_blank"
                            className="text-lg font-bold text-gray-900 hover:text-indigo-600 truncate block transition-colors"
                        >
                            {repo.name}
                        </Link>
                        <ExternalLink className="w-3.5 h-3.5 text-gray-300 group-hover:text-indigo-400 transition-colors" />
                    </div>
                    <div className="flex items-center gap-2">
                        {repo.private ? (
                            <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider bg-gray-100 text-gray-500 border border-gray-200">
                                Private
                            </span>
                        ) : (
                            <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider bg-emerald-50 text-emerald-600 border border-emerald-100">
                                Public
                            </span>
                        )}
                        <span className="text-[10px] text-gray-400 font-medium">Updated {new Date(repo.updated_at).toLocaleDateString()}</span>
                    </div>
                </div>
                {repo.owner.avatar_url && (
                    <Image
                        src={repo.owner.avatar_url}
                        alt={repo.owner.login}
                        width={36}
                        height={36}
                        className="rounded-xl border border-gray-100 shadow-sm"
                    />
                )}
              </div>

              <p className="text-gray-500 text-sm mb-6 flex-1 line-clamp-2 leading-relaxed">
                {repo.description || "No description provided for this repository."}
              </p>

              <div className="flex items-center justify-between pt-4 border-t border-gray-50 mt-auto">
                <div className="flex items-center gap-3">
                     <span className="flex items-center gap-1 text-xs font-medium text-gray-500">
                        <Star className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />
                        {repo.stargazers_count}
                    </span>
                    <span className="flex items-center gap-1 text-xs font-medium text-gray-500">
                        <GitFork className="w-3.5 h-3.5 text-gray-400" />
                        {repo.forks_count}
                    </span>
                </div>

                <IndexButton owner={repo.owner.login} repo={repo.name} />
              </div>
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}
