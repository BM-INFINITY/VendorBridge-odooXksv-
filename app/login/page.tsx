"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Eye, EyeOff, Loader2, Building2, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";

const loginSchema = z.object({
  username: z.string().min(1, "Username is required").min(3, "Username must be at least 3 characters"),
  password: z.string().min(1, "Password is required").min(6, "Password must be at least 6 characters"),
  rememberMe: z.boolean().optional(),
});

type LoginFormValues = z.infer<typeof loginSchema>;

export default function LoginPage() {
  const router = useRouter();
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [loginSuccess, setLoginSuccess] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: { rememberMe: false },
  });

  const onSubmit = async (data: LoginFormValues) => {
    setIsLoading(true);
    // Simulate API call
    await new Promise((resolve) => setTimeout(resolve, 1500));
    setIsLoading(false);
    setLoginSuccess(true);
    console.log("Login data:", data);
    setTimeout(() => {
      router.push("/dashboard");
    }, 1500);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-slate-100 flex items-center justify-center p-4">
      {/* Background decorative elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-blue-100 rounded-full opacity-40 blur-3xl" />
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-slate-200 rounded-full opacity-40 blur-3xl" />
      </div>

      <div className="relative w-full max-w-md">
        {/* Logo / Brand */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-600 rounded-2xl shadow-lg mb-4">
            <Building2 className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-slate-800 tracking-tight">VendorBridge</h1>
          <p className="text-slate-500 text-sm mt-1">Procurement &amp; Vendor Management ERP</p>
        </div>

        <Card className="border border-slate-200 shadow-xl shadow-slate-200/50 bg-white/90 backdrop-blur-sm">
          <CardHeader className="pb-4 pt-8 px-8">
            <div className="space-y-1">
              <h2 className="text-xl font-semibold text-slate-800">Welcome back</h2>
              <p className="text-sm text-slate-500">Sign in to your account to continue</p>
            </div>
          </CardHeader>

          <CardContent className="px-8 pb-8">
            {loginSuccess ? (
              <div className="flex flex-col items-center py-6 text-center gap-3">
                <div className="w-14 h-14 rounded-full bg-green-100 flex items-center justify-center">
                  <ShieldCheck className="w-7 h-7 text-green-600" />
                </div>
                <p className="text-slate-800 font-semibold text-lg">Login Successful!</p>
                <p className="text-slate-500 text-sm">Redirecting to your dashboard…</p>
              </div>
            ) : (
              <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-5">
                {/* Username */}
                <div className="space-y-2">
                  <Label htmlFor="username" className="text-sm font-medium text-slate-700">
                    Username
                  </Label>
                  <Input
                    id="username"
                    type="text"
                    placeholder="Enter your username"
                    autoComplete="username"
                    disabled={isLoading}
                    {...register("username")}
                    className={`h-10 bg-slate-50 border-slate-200 text-slate-800 placeholder:text-slate-400 focus:border-blue-500 focus:ring-blue-500/20 transition-colors ${
                      errors.username ? "border-red-400 focus:border-red-500 focus:ring-red-500/20" : ""
                    }`}
                  />
                  {errors.username && (
                    <p className="text-red-500 text-xs mt-1 flex items-center gap-1">
                      <span className="inline-block w-1 h-1 rounded-full bg-red-500 mt-0.5 shrink-0" />
                      {errors.username.message}
                    </p>
                  )}
                </div>

                {/* Password */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="password" className="text-sm font-medium text-slate-700">
                      Password
                    </Label>
                    <Link
                      href="/forgot-password"
                      className="text-xs text-blue-600 hover:text-blue-700 font-medium transition-colors"
                    >
                      Forgot password?
                    </Link>
                  </div>
                  <div className="relative">
                    <Input
                      id="password"
                      type={showPassword ? "text" : "password"}
                      placeholder="Enter your password"
                      autoComplete="current-password"
                      disabled={isLoading}
                      {...register("password")}
                      className={`h-10 bg-slate-50 border-slate-200 text-slate-800 placeholder:text-slate-400 focus:border-blue-500 focus:ring-blue-500/20 transition-colors pr-10 ${
                        errors.password ? "border-red-400 focus:border-red-500 focus:ring-red-500/20" : ""
                      }`}
                    />
                    <button
                      type="button"
                      tabIndex={-1}
                      onClick={() => setShowPassword((v) => !v)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
                      aria-label={showPassword ? "Hide password" : "Show password"}
                    >
                      {showPassword ? (
                        <EyeOff className="w-4 h-4" />
                      ) : (
                        <Eye className="w-4 h-4" />
                      )}
                    </button>
                  </div>
                  {errors.password && (
                    <p className="text-red-500 text-xs mt-1 flex items-center gap-1">
                      <span className="inline-block w-1 h-1 rounded-full bg-red-500 mt-0.5 shrink-0" />
                      {errors.password.message}
                    </p>
                  )}
                </div>

                {/* Remember Me */}
                <div className="flex items-center gap-2.5">
                  <input
                    id="rememberMe"
                    type="checkbox"
                    {...register("rememberMe")}
                    disabled={isLoading}
                    className="w-4 h-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500/30 cursor-pointer accent-blue-600"
                  />
                  <Label
                    htmlFor="rememberMe"
                    className="text-sm text-slate-600 cursor-pointer select-none"
                  >
                    Remember me for 30 days
                  </Label>
                </div>

                {/* Submit Button */}
                <Button
                  type="submit"
                  disabled={isLoading}
                  className="w-full h-10 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-all duration-200 shadow-sm shadow-blue-200 hover:shadow-blue-300 disabled:opacity-70"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Signing in…
                    </>
                  ) : (
                    "Sign In"
                  )}
                </Button>
              </form>
            )}

            {!loginSuccess && (
              <>
                <Separator className="my-6 bg-slate-100" />
                <p className="text-center text-sm text-slate-500">
                  Don&apos;t have an account?{" "}
                  <Link
                    href="/register"
                    className="text-blue-600 hover:text-blue-700 font-medium transition-colors"
                  >
                    Register
                  </Link>
                </p>
              </>
            )}
          </CardContent>
        </Card>

        {/* Footer */}
        <p className="text-center text-xs text-slate-400 mt-6">
          © {new Date().getFullYear()} VendorBridge. All rights reserved.
        </p>
      </div>
    </div>
  );
}
