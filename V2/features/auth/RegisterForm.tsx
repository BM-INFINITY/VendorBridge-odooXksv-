"use client";

import { useActionState, useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  Eye,
  EyeOff,
  Loader2,
  ShieldCheck,
  AlertCircle,
  CheckCircle2,
  User,
  Mail,
  Phone,
  Globe,
  ChevronDown,
  Briefcase,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import { registerUser, type ActionResponse } from "@/lib/actions/auth.actions";

// ---------------------------------------------------------------------------
// Password strength helpers
// ---------------------------------------------------------------------------
type StrengthLevel = "empty" | "weak" | "fair" | "good" | "strong";

function getPasswordStrength(password: string): {
  level: StrengthLevel;
  score: number;
  label: string;
  color: string;
} {
  if (!password) return { level: "empty", score: 0, label: "", color: "" };

  let score = 0;
  if (password.length >= 8) score++;
  if (password.length >= 12) score++;
  if (/[A-Z]/.test(password)) score++;
  if (/[0-9]/.test(password)) score++;
  if (/[^A-Za-z0-9]/.test(password)) score++;

  if (score <= 1) return { level: "weak", score: 1, label: "Weak", color: "bg-red-500" };
  if (score === 2) return { level: "fair", score: 2, label: "Fair", color: "bg-amber-500" };
  if (score === 3) return { level: "good", score: 3, label: "Good", color: "bg-yellow-400" };
  return { level: "strong", score: 4, label: "Strong", color: "bg-emerald-500" };
}

// ---------------------------------------------------------------------------
// Field wrapper with icon
// ---------------------------------------------------------------------------
function FormField({
  id,
  label,
  children,
  error,
  required,
}: {
  id: string;
  label: string;
  children: React.ReactNode;
  error?: string;
  required?: boolean;
}) {
  return (
    <div className="space-y-1.5">
      <Label htmlFor={id} className="text-sm font-medium text-slate-200">
        {label}
        {required && <span className="ml-1 text-red-400">*</span>}
      </Label>
      {children}
      {error && (
        <p className="flex items-center gap-1 text-xs text-red-400">
          <AlertCircle className="h-3 w-3 shrink-0" />
          {error}
        </p>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Role options aligned with Prisma UserRole enum
// ---------------------------------------------------------------------------
const ROLE_OPTIONS = [
  { value: "PROCUREMENT_OFFICER", label: "Procurement Officer" },
  { value: "MANAGER", label: "Manager" },
  { value: "VENDOR", label: "Vendor" },
  { value: "ADMIN", label: "Administrator" },
] as const;

// ---------------------------------------------------------------------------
// RegisterForm
// Wired to registerUser Server Action via React 19 useActionState.
// On success, auto-signs in and redirects to dashboard.
// ---------------------------------------------------------------------------
export function RegisterForm() {
  const router = useRouter();

  // Local UI state
  const [showPassword, setShowPassword] = useState(false);
  const [password, setPassword] = useState("");
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [successMessage, setSuccessMessage] = useState(false);

  const strength = getPasswordStrength(password);

  // Server Action state
  const [state, formAction, isPending] = useActionState<ActionResponse | null, FormData>(
    registerUser,
    null
  );

  // On success: auto-login then redirect
  useEffect(() => {
    if (state?.success) {
      setSuccessMessage(true);
    }
  }, [state]);

  // Client-side field validation (pre-submission UX only)
  function handleBlurValidation(e: React.FocusEvent<HTMLInputElement | HTMLSelectElement>) {
    const { name, value } = e.target;
    const errors = { ...fieldErrors };

    if (name === "email" && value && !/\S+@\S+\.\S+/.test(value)) {
      errors.email = "Please enter a valid email address.";
    } else if (name === "email") {
      delete errors.email;
    }

    if (name === "password" && value && value.length < 8) {
      errors.password = "Password must be at least 8 characters.";
    } else if (name === "password") {
      delete errors.password;
    }

    setFieldErrors(errors);
  }

  // Success screen
  if (successMessage) {
    return (
      <div className="relative w-full min-h-screen flex items-center justify-center overflow-hidden bg-gradient-to-br from-slate-950 via-blue-950 to-slate-900">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -top-40 -left-40 h-[600px] w-[600px] rounded-full bg-emerald-600/15 blur-[120px]"
        />
        <div className="relative z-10 w-full max-w-md mx-4">
          <div className="rounded-2xl border border-white/10 bg-white/5 backdrop-blur-xl shadow-2xl p-10 text-center">
            <div className="flex justify-center mb-6">
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-emerald-500/20 border border-emerald-500/30">
                <CheckCircle2 className="h-8 w-8 text-emerald-400" />
              </div>
            </div>
            <h2 className="text-xl font-bold text-white mb-2">Account Created!</h2>
            <p className="text-sm text-slate-400 mb-8">
              Your VendorBridge account has been created successfully. You can now sign in.
            </p>
            <Button
              onClick={() => router.push("/login")}
              className="w-full h-11 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 font-semibold"
            >
              Go to Sign In
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="relative w-full min-h-screen flex items-center justify-center overflow-hidden bg-gradient-to-br from-slate-950 via-blue-950 to-slate-900 py-12">
      {/* Decorative orbs */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -top-40 -right-40 h-[600px] w-[600px] rounded-full bg-blue-600/20 blur-[120px]"
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -bottom-40 -left-40 h-[500px] w-[500px] rounded-full bg-indigo-600/20 blur-[120px]"
      />

      <div className="relative z-10 w-full max-w-lg mx-4">
        {/* Glass card */}
        <div className="rounded-2xl border border-white/10 bg-white/5 backdrop-blur-xl shadow-2xl p-8">
          {/* Brand header */}
          <div className="mb-8 flex flex-col items-center gap-3">
            <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 shadow-lg shadow-blue-500/30">
              <ShieldCheck className="h-7 w-7 text-white" />
            </div>
            <div className="text-center">
              <h1 className="text-2xl font-bold tracking-tight text-white">
                Create your account
              </h1>
              <p className="mt-1 text-sm text-slate-400">
                Join the VendorBridge procurement platform
              </p>
            </div>
          </div>

          {/* Server error */}
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
            {/* Name row */}
            <div className="grid grid-cols-2 gap-4">
              <FormField id="reg-firstName" label="First name" required>
                <div className="relative">
                  <User className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
                  <Input
                    id="reg-firstName"
                    name="firstName"
                    type="text"
                    autoComplete="given-name"
                    required
                    placeholder="John"
                    disabled={isPending}
                    className={cn(
                      "h-11 pl-9 border-white/10 bg-white/5 text-white placeholder:text-slate-500",
                      "focus:border-blue-500 focus:ring-blue-500/30 disabled:opacity-60"
                    )}
                  />
                </div>
              </FormField>

              <FormField id="reg-lastName" label="Last name" required>
                <div className="relative">
                  <User className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
                  <Input
                    id="reg-lastName"
                    name="lastName"
                    type="text"
                    autoComplete="family-name"
                    required
                    placeholder="Doe"
                    disabled={isPending}
                    className={cn(
                      "h-11 pl-9 border-white/10 bg-white/5 text-white placeholder:text-slate-500",
                      "focus:border-blue-500 focus:ring-blue-500/30 disabled:opacity-60"
                    )}
                  />
                </div>
              </FormField>
            </div>

            {/* Email */}
            <FormField
              id="reg-email"
              label="Email address"
              required
              error={fieldErrors.email}
            >
              <div className="relative">
                <Mail className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
                <Input
                  id="reg-email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  placeholder="you@company.com"
                  disabled={isPending}
                  onBlur={handleBlurValidation}
                  className={cn(
                    "h-11 pl-9 border-white/10 bg-white/5 text-white placeholder:text-slate-500",
                    "focus:border-blue-500 focus:ring-blue-500/30 disabled:opacity-60",
                    fieldErrors.email && "border-red-500/50 focus:border-red-500"
                  )}
                />
              </div>
            </FormField>

            {/* Phone + Country */}
            <div className="grid grid-cols-2 gap-4">
              <FormField id="reg-phone" label="Phone number">
                <div className="relative">
                  <Phone className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
                  <Input
                    id="reg-phone"
                    name="phone"
                    type="tel"
                    autoComplete="tel"
                    placeholder="+1 234 567 8900"
                    disabled={isPending}
                    className={cn(
                      "h-11 pl-9 border-white/10 bg-white/5 text-white placeholder:text-slate-500",
                      "focus:border-blue-500 focus:ring-blue-500/30 disabled:opacity-60"
                    )}
                  />
                </div>
              </FormField>

              <FormField id="reg-country" label="Country">
                <div className="relative">
                  <Globe className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
                  <Input
                    id="reg-country"
                    name="country"
                    type="text"
                    placeholder="United States"
                    disabled={isPending}
                    className={cn(
                      "h-11 pl-9 border-white/10 bg-white/5 text-white placeholder:text-slate-500",
                      "focus:border-blue-500 focus:ring-blue-500/30 disabled:opacity-60"
                    )}
                  />
                </div>
              </FormField>
            </div>

            {/* Role */}
            <FormField id="reg-role" label="Role" required>
              <div className="relative">
                <Briefcase className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500 z-10" />
                <ChevronDown className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500 z-10" />
                <select
                  id="reg-role"
                  name="role"
                  defaultValue="PROCUREMENT_OFFICER"
                  disabled={isPending}
                  className={cn(
                    "h-11 w-full appearance-none rounded-md pl-9 pr-9",
                    "border border-white/10 bg-white/5",
                    "text-sm text-white",
                    "focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500",
                    "disabled:opacity-60 cursor-pointer",
                    "[&>option]:bg-slate-900 [&>option]:text-white"
                  )}
                >
                  {ROLE_OPTIONS.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              </div>
            </FormField>

            {/* Password */}
            <FormField
              id="reg-password"
              label="Password"
              required
              error={fieldErrors.password}
            >
              <div className="relative">
                <Input
                  id="reg-password"
                  name="password"
                  type={showPassword ? "text" : "password"}
                  autoComplete="new-password"
                  required
                  placeholder="Min. 8 characters"
                  disabled={isPending}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  onBlur={handleBlurValidation}
                  className={cn(
                    "h-11 border-white/10 bg-white/5 text-white placeholder:text-slate-500 pr-10",
                    "focus:border-blue-500 focus:ring-blue-500/30 disabled:opacity-60",
                    fieldErrors.password && "border-red-500/50 focus:border-red-500"
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

              {/* Password strength meter */}
              {password.length > 0 && (
                <div className="mt-2 space-y-1.5">
                  <div className="flex gap-1">
                    {[1, 2, 3, 4].map((bar) => (
                      <div
                        key={bar}
                        className={cn(
                          "h-1 flex-1 rounded-full transition-all duration-300",
                          strength.score >= bar
                            ? strength.color
                            : "bg-white/10"
                        )}
                      />
                    ))}
                  </div>
                  <div className="flex items-center justify-between">
                    <p className="text-xs text-slate-500">Password strength</p>
                    <p
                      className={cn(
                        "text-xs font-medium transition-colors",
                        strength.level === "weak" && "text-red-400",
                        strength.level === "fair" && "text-amber-400",
                        strength.level === "good" && "text-yellow-400",
                        strength.level === "strong" && "text-emerald-400"
                      )}
                    >
                      {strength.label}
                    </p>
                  </div>
                  {/* Requirements list */}
                  <ul className="space-y-0.5">
                    {[
                      { test: password.length >= 8, text: "At least 8 characters" },
                      { test: /[A-Z]/.test(password), text: "One uppercase letter" },
                      { test: /[0-9]/.test(password), text: "One number" },
                      { test: /[^A-Za-z0-9]/.test(password), text: "One special character" },
                    ].map(({ test, text }) => (
                      <li
                        key={text}
                        className={cn(
                          "flex items-center gap-1.5 text-xs transition-colors",
                          test ? "text-emerald-400" : "text-slate-500"
                        )}
                      >
                        <CheckCircle2
                          className={cn(
                            "h-3 w-3 shrink-0 transition-opacity",
                            test ? "opacity-100" : "opacity-30"
                          )}
                        />
                        {text}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </FormField>

            {/* Additional Info */}
            <FormField id="reg-additionalInfo" label="Company / Additional info">
              <textarea
                id="reg-additionalInfo"
                name="additionalInfo"
                rows={2}
                placeholder="Tell us about your organization (optional)"
                disabled={isPending}
                className={cn(
                  "w-full resize-none rounded-md px-3 py-2.5",
                  "border border-white/10 bg-white/5 text-sm text-white placeholder:text-slate-500",
                  "focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500",
                  "disabled:opacity-60 transition-colors"
                )}
              />
            </FormField>

            {/* Submit */}
            <Button
              id="register-submit"
              type="submit"
              disabled={isPending}
              className={cn(
                "w-full h-11 font-semibold text-sm mt-2",
                "bg-gradient-to-r from-blue-600 to-indigo-600",
                "hover:from-blue-500 hover:to-indigo-500",
                "shadow-lg shadow-blue-500/25 transition-all duration-200",
                "disabled:opacity-60"
              )}
            >
              {isPending ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Creating account…
                </>
              ) : (
                "Create Account"
              )}
            </Button>
          </form>

          {/* Divider */}
          <div className="my-6 flex items-center gap-3">
            <div className="h-px flex-1 bg-white/10" />
            <span className="text-xs text-slate-500">or</span>
            <div className="h-px flex-1 bg-white/10" />
          </div>

          {/* Login link */}
          <p className="text-center text-sm text-slate-400">
            Already have an account?{" "}
            <Link
              href="/login"
              className="font-medium text-blue-400 hover:text-blue-300 underline-offset-4 hover:underline transition-colors"
            >
              Sign in
            </Link>
          </p>
        </div>

        {/* Footer note */}
        <p className="mt-6 text-center text-xs text-slate-600">
          By creating an account you agree to our Terms of Service · VendorBridge ERP
        </p>
      </div>
    </div>
  );
}
