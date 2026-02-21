
import Link from "next/link";
import Image from "next/image";
import SignOutButton from "@/components/SignOutButton";

interface NavbarProps {
  user: {
    name: string;
    image?: string | null;
  };
}

export default function Navbar({ user }: NavbarProps) {
  return (
    <header className="bg-black border-b border-neutral-800 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-14 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2">
          <span className="font-bold text-lg tracking-tight text-white">ImpacAnalyzer</span>
          <span className="text-[10px] font-mono text-neutral-500 border border-neutral-800 px-1.5 py-0.5 rounded">v1</span>
        </Link>

        <div className="flex items-center gap-3">
          <Link
            href="/dashboard"
            className="text-xs font-medium text-neutral-400 hover:text-white transition-colors px-3 py-1.5 rounded hover:bg-neutral-900"
          >
            Dashboard
          </Link>
          <div className="h-5 w-px bg-neutral-800"></div>
          <div className="flex items-center gap-2.5">
            {user.image && (
              <Image
                src={user.image}
                alt={user.name || "User"}
                width={28}
                height={28}
                className="rounded-full border border-neutral-700"
              />
            )}
            <span className="text-xs text-neutral-400 hidden sm:block">{user.name}</span>
            <SignOutButton />
          </div>
        </div>
      </div>
    </header>
  );
}
