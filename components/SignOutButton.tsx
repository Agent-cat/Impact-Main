"use client";

import { authClient } from "@/lib/auth-client";
import { useRouter } from "next/navigation";
import { LogOut } from "lucide-react";
import { toast } from "sonner"; // If sonner is installed, otherwise console.log/alert

export default function SignOutButton() {
  const router = useRouter();

  const handleSignOut = async () => {
    await authClient.signOut({
      fetchOptions: {
        onSuccess: () => {
          toast.success("Successfully signed out");
          router.replace("/signin");
        },
        onError: (ctx) => {
          toast.error("Failed to sign out");
        },
      },
    });
  };

  return (
    <button
      onClick={handleSignOut}
      className="flex items-center gap-2 px-4 py-2 text-sm text-gray-400 hover:text-red-400 hover:bg-white/5 rounded-lg transition-colors"
    >
      <LogOut size={18} />
      <span>Sign Out</span>
    </button>
  );
}
