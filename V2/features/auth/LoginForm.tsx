"use client";

import { useActionState, useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Eye, EyeOff, Loader2, ShieldCheck, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import { loginUser, type ActionResponse } from "@/lib/actions/auth.actions";

// ---------------------------------------------------------------------------
// LoginForm
// Wired to the loginUser Server Action via React 19 useActionState.
// Handles loading state, server-side error display, and redirect on success.
// ---------------------------------------------------------------------------
export function LoginForm() {
  const router = useRouter();
  const [showPassword, setShowPassword] = useState(false);

  const [state, formAction, isPending] = useActionState<ActionResponse | null, FormData>(
    loginUser,
    null
  );

  // On successful login, redirect to dashboard
  useEffect(() => {
    if (state?.success) {
      router.push("/dashboard");
      router.refresh();
    }
  }, [state, router]);

  return (
    <div className="relative w-full min-h-screen flex items-center justify-center overflow-hidden bg-gradient-to-br from-slate-950 via-blue-950 to-slate-900">
      {/* Decorative background orbs */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -top-40 -left-40 h-[600px] w-[600px] rounded-full bg-blue-600/20 blur-[120px]"
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -bottom-40 -right-40 h-[500px] w-[500px] rounded-full bg-indigo-600/20 blur-[120px]"
      />

      {/* Card */}
      <div className="relative z-10 w-full max-w-md mx-4">
        {/* Glass card */}
        <div className="rounded-2xl border border-white/10 bg-white/5 backdrop-blur-xl shadow-2xl p-8">
          {/* Logo / Brand */}
          <div className="mb-8 flex flex-col items-center gap-3">
            <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 shadow-lg shadow-blue-500/30">
              <ShieldCheck className="h-7 w-7 text-white" />
            </div>
            <div className="text-center">
              <h1 className="text-2xl font-bold tracking-tight text-white">
                VendorBridge
              </h1>
              <p className="mt-1 text-sm text-slate-400">
                Sign in to your procurement workspace
              </p>
            </div>
          </div>

          {/* Error Alert */}
          {state && !state.success && state.error && (
            <div
              role="alert"
              className="mb-6 flex items-start gap-3 rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3"
            >
              <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-red-400" />
              <p className="text-sm text-red-300">{state.error}</p>
            </div>
          )}

          {/* Form */}
          <form action={formAction} noValidate className="space-y-5">
            {/* Email */}
            <div className="space-y-1.5">
              <Label
                htmlFor="login-email"
                className="text-sm font-medium text-slate-200"
              >
                Email address
              </Label>
              <Input
                id="login-email"
                name="email"
                type="email"
                autoComplete="email"
                required
                placeholder="you@company.com"
                disabled={isPending}
                className={cn(
                  "h-11 border-white/10 bg-white/5 text-white placeholder:text-slate-500",
                  "focus:border-blue-500 focus:ring-blue-500/30",
                  "disabled:opacity-60"
                )}
              />
            </div>

            {/* Password */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <Label
                  htmlFor="login-password"
                  className="text-sm font-medium text-slate-200"
                >
                  Password
                </Label>
                <button
                  type="button"
                  className="text-xs text-blue-400 hover:text-blue-300 transition-colors"
                  tabIndex={-1}
                >
                  Forgot password?
                </button>
              </div>
              <div className="relative">
                <Input
                  id="login-password"
                  name="password"
                  type={showPassword ? "text" : "password"}
                  autoComplete="current-password"
                  required
                  placeholder="••••••••"
                  disabled={isPending}
                  className={cn(
                    "h-11 border-white/10 bg-white/5 text-white placeholder:text-slate-500 pr-10",
                    "focus:border-blue-500 focus:ring-blue-500/30",
                    "disabled:opacity-60"
                  )}
                />
                <button
                  type="button"
                  aria-label={showPassword ? "Hide password" : "Show password"}
                  onClick={() => setShowPassword((v) => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200 transition-colors"
                  tabIndex={-1}
                >
                  {showPassword ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </button>
              </div>
            </div>

            {/* Submit */}
            <Button
              id="login-submit"
              type="submit"
              disabled={isPending}
              className={cn(
                "w-full h-11 font-semibold text-sm",
                "bg-gradient-to-r from-blue-600 to-indigo-600",
                "hover:from-blue-500 hover:to-indigo-500",
                "shadow-lg shadow-blue-500/25 transition-all duration-200",
                "disabled:opacity-60"
              )}
            >
              {isPending ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Signing in…
                </>
              ) : (
                "Sign In"
              )}
            </Button>
          </form>

          {/* Divider */}
          <div className="my-6 flex items-center gap-3">
            <div className="h-px flex-1 bg-white/10" />
            <span className="text-xs text-slate-500">or</span>
            <div className="h-px flex-1 bg-white/10" />
          </div>

          {/* Register link */}
          <p className="text-center text-sm text-slate-400">
            Don&apos;t have an account?{" "}
            <Link
              href="/register"
              className="font-medium text-blue-400 hover:text-blue-300 underline-offset-4 hover:underline transition-colors"
            >
              Create one now
            </Link>
          </p>
        </div>

        {/* Footer note */}
        <p className="mt-6 text-center text-xs text-slate-600">
          Protected by end-to-end encryption · VendorBridge ERP
        </p>
      </div>
    </div>
  );
}
