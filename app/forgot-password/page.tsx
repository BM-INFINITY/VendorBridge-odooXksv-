"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Loader2, Building2, Mail, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";

const forgotPasswordSchema = z.object({
  email: z.string().min(1, "Email is required").email("Invalid email address"),
});

type ForgotPasswordFormValues = z.infer<typeof forgotPasswordSchema>;

export default function ForgotPasswordPage() {
  const [isLoading, setIsLoading] = useState(false);
  const [resetSent, setResetSent] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ForgotPasswordFormValues>({
    resolver: zodResolver(forgotPasswordSchema),
  });

  const onSubmit = async (data: ForgotPasswordFormValues) => {
    setIsLoading(true);
    // Simulate API call
    await new Promise((resolve) => setTimeout(resolve, 1500));
    setIsLoading(false);
    setResetSent(true);
    console.log("Reset password requested for:", data.email);
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
              <h2 className="text-xl font-semibold text-slate-800">Reset Password</h2>
              <p className="text-sm text-slate-500">
                Enter your email address and we&apos;ll send you a link to reset your password.
              </p>
            </div>
          </CardHeader>

          <CardContent className="px-8 pb-8">
            {resetSent ? (
              <div className="flex flex-col items-center py-6 text-center gap-3">
                <div className="w-14 h-14 rounded-full bg-green-100 flex items-center justify-center">
                  <Mail className="w-7 h-7 text-green-600" />
                </div>
                <p className="text-slate-800 font-semibold text-lg">Reset Link Sent!</p>
                <p className="text-slate-500 text-sm">
                  Check your inbox for instructions on how to reset your password.
                </p>
                <Link href="/login" className="w-full mt-4">
                  <Button className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg h-10 transition-colors">
                    Go to Login
                  </Button>
                </Link>
              </div>
            ) : (
              <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-5">
                {/* Email Address */}
                <div className="space-y-2">
                  <Label htmlFor="email" className="text-sm font-medium text-slate-700">
                    Email Address
                  </Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="name@company.com"
                    autoComplete="email"
                    disabled={isLoading}
                    {...register("email")}
                    className={`h-10 bg-slate-50 border-slate-200 text-slate-800 placeholder:text-slate-400 focus:border-blue-500 focus:ring-blue-500/20 transition-colors ${
                      errors.email ? "border-red-400 focus:border-red-500 focus:ring-red-500/20" : ""
                    }`}
                  />
                  {errors.email && (
                    <p className="text-red-500 text-xs mt-1 flex items-center gap-1">
                      <span className="inline-block w-1 h-1 rounded-full bg-red-500 mt-0.5 shrink-0" />
                      {errors.email.message}
                    </p>
                  )}
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
                      Sending Link…
                    </>
                  ) : (
                    "Send Reset Link"
                  )}
                </Button>
              </form>
            )}

            {!resetSent && (
              <>
                <Separator className="my-6 bg-slate-100" />
                <div className="text-center">
                  <Link
                    href="/login"
                    className="inline-flex items-center text-sm text-blue-600 hover:text-blue-700 font-medium transition-colors gap-1.5"
                  >
                    <ArrowLeft className="w-4 h-4" />
                    Back to Login
                  </Link>
                </div>
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
