"use client";

import { authClient } from "@/lib/auth-client";
import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

export default function SignUp() {
    const [loading, setLoading] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);
    const router = useRouter();
    const { data: session, isPending } = authClient.useSession();

    useEffect(() => {
        if (session) {
            router.replace("/");
        }
    }, [session, router]);

    const handleSignIn = async (provider: "github") => {
        setLoading(provider);
        setError(null);
        await authClient.signIn.social({
            provider,
            callbackURL: "/",
        }, {
            onSuccess: () => {
                toast.success("Sign up successful");
            },
            onError: (ctx) => {
                if (ctx.error.status === 403 || ctx.error.message.toLowerCase().includes("cancel")) {
                    setLoading(null);
                    return;
                }
                toast.error(ctx.error.message);
                setLoading(null);
            }
        });
    };

    if (isPending) {
        return (
            <div className="min-h-screen bg-white flex items-center justify-center">
                <div className="w-8 h-8 border-4 border-[#FF5722] border-t-transparent rounded-full animate-spin"></div>
            </div>
        );
    }

    if (session) return null;

    return (
        <div className="min-h-screen bg-white flex items-center justify-center p-4">
            <div className="max-w-md w-full space-y-8">
                <div className="text-center">
                    <h1 className="text-4xl font-serif text-[#FF5722] mb-2">Sign Up</h1>
                </div>

                {error && (
                    <div className="bg-red-50 text-red-600 p-4 rounded-xl text-sm text-center border border-red-100">
                        {error}
                    </div>
                )}

                <div className="space-y-4 mt-8">
                    <button
                        onClick={() => handleSignIn("github")}
                        disabled={!!loading}
                        className="w-full flex items-center justify-center gap-3 px-6 py-4 bg-[#24292e] hover:bg-[#2b3137] text-white font-semibold rounded-xl transition-all transform hover:scale-[1.02] active:scale-[0.98] disabled:opacity-70 disabled:cursor-not-allowed shadow-lg"
                    >
                        {loading === "github" ? (
                            <div className="w-6 h-6 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        ) : (
                            <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                                <path d="M12 2A10 10 0 0 0 2 12c0 4.42 2.87 8.17 6.84 9.5c.5.08.66-.23.66-.5v-1.69c-2.77.6-3.36-1.34-3.36-1.34c-.46-1.16-1.1-1.47-1.1-1.47c-.9-.62.07-.6.07-.6c1 .07 1.53 1.03 1.53 1.03c.87 1.52 2.34 1.07 2.91.83c.09-.65.35-1.09.63-1.34c-2.22-.25-4.55-1.11-4.55-4.92c0-1.11.38-2 1.03-2.71c-.1-.25-.45-1.29.1-2.64c0 0 .84-.27 2.75 1.02c.79-.22 1.65-.33 2.5-.33c.85 0 1.71.11 2.5.33c1.91-1.29 2.75-1.02 2.75-1.02c.55 1.35.2 2.39.1 2.64c.65.71 1.03 1.6 1.03 2.71c0 3.82-2.34 4.66-4.57 4.91c.36.31.69.92.69 1.85V21c0 .27.16.59.67.5C19.14 20.16 22 16.42 22 12A10 10 0 0 0 12 2Z" fill="#FFFFFF" />
                            </svg>
                        )}
                        <span>Continue with GitHub</span>
                    </button>
                </div>


                <div className="text-center mt-6">
                    <p className="text-gray-600">Already have an account? <Link href="/signin" className="text-[#FF5722] font-semibold hover:underline">Sign In</Link></p>
                </div>
            </div>
        </div>
    );
}
