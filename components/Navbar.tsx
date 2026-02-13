
import Link from "next/link";
import Image from "next/image";
import { Zap, LayoutDashboard } from "lucide-react";
import SignOutButton from "@/components/SignOutButton";

interface NavbarProps {
  user: {
    name: string;
    image?: string | null;
  };
}

export default function Navbar({ user }: NavbarProps) {
  return (
    <header className="bg-black/50 backdrop-blur-md border-b border-white/10 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Zap className="w-6 h-6 text-indigo-500" />
          <span className="font-bold text-xl tracking-tight text-white">ImpacAnalyzer</span>
        </div>

        <div className="flex items-center gap-4">
          <Link
            href="/dashboard"
            className="flex items-center gap-2 text-sm font-medium text-gray-400 hover:text-indigo-400 transition-colors px-3 py-1.5 rounded-lg hover:bg-white/5"
          >
            <LayoutDashboard className="w-4 h-4" />
            Analyze Dashboard
          </Link>
          <div className="h-6 w-px bg-white/10"></div>
          <div className="flex items-center gap-3">
            {user.image && (
              <Image
                src={user.image}
                alt={user.name || "User"}
                width={32}
                height={32}
                className="rounded-full border border-white/10"
              />
            )}
            <div className="hidden sm:block">
              <p className="text-sm font-semibold text-gray-200 leading-none">{user.name}</p>
            </div>
            <SignOutButton />
          </div>
        </div>
      </div>
    </header>
  );
}
