"use client";

import { authClient } from "@/lib/auth-client";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

export default function SignOutButton() {
  const router = useRouter();

  const handleSignOut = async () => {
    await authClient.signOut({
      fetchOptions: {
        onSuccess: () => {
          toast.success("Successfully signed out");
          router.replace("/signin");
        },
        onError: () => {
          toast.error("Failed to sign out");
        },
      },
    });
  };

  return (
    <button
      onClick={handleSignOut}
      className="text-xs text-neutral-500 hover:text-red-400 transition-colors cursor-pointer px-2 py-1 rounded hover:bg-neutral-900"
    >
      Sign Out
    </button>
  );
}
