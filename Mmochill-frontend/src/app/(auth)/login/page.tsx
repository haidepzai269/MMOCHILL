"use client";

import Link from "next/link";
import {
  User,
  Mail,
  Lock,
  ArrowRight,
  Github,
  Loader2,
  Coins,
} from "lucide-react";
import { useState, useTransition } from "react";
import { userLogin } from "@/app/actions/auth";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { useLoading } from "@/lib/contexts/loading-context";

export default function UserLoginPage() {
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();
  const { showLoading, hideLoading } = useLoading();

  const handleSubmit = (formData: FormData) => {
    setError(null);
    showLoading();
    startTransition(async () => {
      const result = await userLogin(formData);
      if (result.success) {
        toast.success("Login successful!");
        router.push("/");
      } else {
        setError(result.error || "Something went wrong");
        toast.error(result.error || "Login failed");
      }
      hideLoading();
    });
  };

  return (
    <div
      className="min-h-screen flex flex-col justify-center items-center p-4 bg-cover bg-no-repeat"
      style={{
        backgroundImage: "url('/images/auth-bg.png')",
        backgroundPosition: "center 75%",
      }}
    >
      <div className="w-full max-w-[380px] bg-card/40 backdrop-blur-xl border border-white/10 rounded-3xl p-6 shadow-2xl relative overflow-hidden group">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent opacity-50 pointer-events-none" />

        <div className="flex flex-col items-center mb-6 relative z-10">
          <div className="w-12 h-12 bg-primary rounded-2xl flex items-center justify-center shadow-lg shadow-primary/20 mb-3 ring-4 ring-primary/10 group-hover:scale-110 transition-transform duration-500">
            <Coins className="text-primary-foreground w-6 h-6" />
          </div>
          <h1 className="text-2xl font-black tracking-tighter uppercase italic text-foreground">
            MMO<span className="text-primary">CHILL</span>
          </h1>
          <div className="h-1 w-10 bg-primary rounded-full mt-1 opacity-50" />
        </div>

        <div className="text-center mb-6 relative z-10">
          <h2 className="text-lg font-bold tracking-tight">Welcome Back</h2>
          <p className="text-muted-foreground text-xs mt-1">
            Log in to continue earning.
          </p>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-500/10 border border-red-500/20 rounded-2xl text-red-500 text-xs font-medium relative z-10">
            {error}
          </div>
        )}

        <form action={handleSubmit} className="space-y-3 relative z-10">
          <div className="space-y-1.5">
            <label className="text-xs font-medium ml-1">Email</label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <input
                name="email"
                type="email"
                required
                placeholder="name@example.com"
                className="w-full bg-muted/30 border border-white/5 rounded-xl py-2 pl-10 pr-4 focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all font-sans text-sm"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <div className="flex items-center justify-between ml-1">
              <label className="text-xs font-medium">Password</label>
              <Link
                href="/forgot-password"
                className="text-[10px] text-primary hover:underline font-medium"
              >
                Forgot password?
              </Link>
            </div>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <input
                name="password"
                type="password"
                required
                placeholder="••••••••"
                className="w-full bg-muted/30 border border-white/5 rounded-xl py-2 pl-10 pr-4 focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all font-sans text-sm"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={isPending}
            className="w-full bg-primary text-primary-foreground py-2.5 rounded-xl text-sm font-bold flex items-center justify-center gap-2 hover:opacity-90 transition-opacity mt-2 disabled:opacity-50 shadow-lg shadow-primary/20"
          >
            {isPending ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                Signing in...
              </>
            ) : (
              <>
                Sign In
                <ArrowRight className="w-5 h-5" />
              </>
            )}
          </button>
        </form>

        <div className="relative my-6 z-10">
          <div className="absolute inset-0 flex items-center">
            <span className="w-full border-t border-white/5" />
          </div>
          <div className="relative flex justify-center text-[10px] uppercase font-bold tracking-widest">
            <span className="bg-transparent px-2 text-muted-foreground">
              Or continue with
            </span>
          </div>
        </div>

        <button className="w-full bg-white/5 border border-white/5 py-2 rounded-xl flex items-center justify-center gap-2 hover:bg-white/10 transition-colors font-medium text-xs z-10 relative">
          <Github className="w-4 h-4" />
          GitHub
        </button>

        <p className="text-center text-xs text-muted-foreground mt-6 z-10 relative">
          Don't have an account?{" "}
          <Link
            href="/register"
            className="text-primary font-bold hover:underline"
          >
            Sign up
          </Link>
        </p>
      </div>
    </div>
  );
}
