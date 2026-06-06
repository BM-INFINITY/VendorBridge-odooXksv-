"use client";

import React, { useState, useRef } from "react";
import Link from "next/link";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  Eye,
  EyeOff,
  Loader2,
  Building2,
  Camera,
  User,
  CheckCircle2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { CountryCombobox } from "@/components/ui/country-combobox";

// ──────────────────────────────────────────────
// Zod schema
// ──────────────────────────────────────────────
const registerSchema = z
  .object({
    firstName: z.string().min(1, "First name is required").min(2, "Min 2 characters"),
    lastName: z.string().min(1, "Last name is required").min(2, "Min 2 characters"),
    email: z.string().min(1, "Email is required").email("Invalid email address"),
    phone: z
      .string()
      .min(1, "Phone number is required")
      .regex(/^\+?[0-9\s\-()]{7,20}$/, "Invalid phone number"),
    role: z.string().min(1, "Please select a role"),
    country: z.string().min(1, "Please select a country"),
    password: z
      .string()
      .min(1, "Password is required")
      .min(8, "Password must be at least 8 characters"),
    confirmPassword: z.string().min(1, "Please confirm your password"),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

type RegisterFormValues = z.infer<typeof registerSchema>;

// ──────────────────────────────────────────────
// Password strength helper
// ──────────────────────────────────────────────
function getPasswordStrength(password: string): {
  score: number;
  label: string;
  color: string;
} {
  if (!password) return { score: 0, label: "", color: "" };
  let score = 0;
  if (password.length >= 8) score++;
  if (password.length >= 12) score++;
  if (/[A-Z]/.test(password)) score++;
  if (/[0-9]/.test(password)) score++;
  if (/[^A-Za-z0-9]/.test(password)) score++;

  if (score <= 1) return { score: 1, label: "Weak", color: "bg-red-500" };
  if (score <= 2) return { score: 2, label: "Fair", color: "bg-orange-400" };
  if (score <= 3) return { score: 3, label: "Good", color: "bg-yellow-400" };
  if (score <= 4) return { score: 4, label: "Strong", color: "bg-blue-500" };
  return { score: 5, label: "Very Strong", color: "bg-green-500" };
}

// ──────────────────────────────────────────────
// Field wrapper helpers
// ──────────────────────────────────────────────
function FieldError({ message }: { message?: string }) {
  if (!message) return null;
  return (
    <p className="text-red-500 text-xs mt-1 flex items-center gap-1">
      <span className="inline-block w-1 h-1 rounded-full bg-red-500 mt-0.5 shrink-0" />
      {message}
    </p>
  );
}

// ──────────────────────────────────────────────
// Page
// ──────────────────────────────────────────────
export default function RegisterPage() {
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const {
    register,
    handleSubmit,
    watch,
    control,
    formState: { errors },
  } = useForm<RegisterFormValues>({
    resolver: zodResolver(registerSchema),
  });

  const passwordValue = watch("password", "");
  const strength = getPasswordStrength(passwordValue);

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const url = URL.createObjectURL(file);
      setAvatarPreview(url);
    }
  };

  const onSubmit = async (data: RegisterFormValues) => {
    setIsLoading(true);
    await new Promise((r) => setTimeout(r, 1500));
    setIsLoading(false);
    setSuccess(true);
    console.log("Register data:", data);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-slate-100 flex items-center justify-center p-4 py-10">
      {/* Background decorative */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-blue-100 rounded-full opacity-40 blur-3xl" />
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-slate-200 rounded-full opacity-40 blur-3xl" />
      </div>

      <div className="relative w-full max-w-2xl">
        <Card className="border border-slate-200 shadow-xl shadow-slate-200/50 bg-white/90 backdrop-blur-sm overflow-hidden">
          <CardHeader className="pb-0 pt-8 px-8">
            {/* ── Avatar upload ── */}
            <div className="flex flex-col items-center gap-3 mb-2">
              <div className="relative group">
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="w-20 h-20 rounded-full bg-blue-50 border-2 border-dashed border-blue-300 hover:border-blue-500 flex items-center justify-center overflow-hidden transition-all group-hover:bg-blue-100 focus:outline-none focus:ring-2 focus:ring-blue-500/40"
                  aria-label="Upload profile image"
                >
                  {avatarPreview ? (
                    <img
                      src={avatarPreview}
                      alt="Profile preview"
                      className="w-full h-full object-cover rounded-full"
                    />
                  ) : (
                    <User className="w-8 h-8 text-blue-400 group-hover:text-blue-600 transition-colors" />
                  )}
                </button>
                <div className="absolute bottom-0 right-0 w-6 h-6 bg-blue-600 rounded-full flex items-center justify-center shadow-md cursor-pointer"
                     onClick={() => fileInputRef.current?.click()}>
                  <Camera className="w-3 h-3 text-white" />
                </div>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleAvatarChange}
                  className="hidden"
                  aria-label="Upload logo or profile image"
                />
              </div>
              <div className="text-center">
                <div className="flex items-center gap-2 justify-center">
                  <Building2 className="w-5 h-5 text-blue-600" />
                  <h1 className="text-xl font-bold text-slate-800">VendorBridge Registration</h1>
                </div>
                <p className="text-sm text-slate-500 mt-0.5">
                  Create your account to get started
                </p>
              </div>
            </div>
          </CardHeader>

          <CardContent className="px-8 pb-8">
            {success ? (
              <div className="flex flex-col items-center py-8 text-center gap-3">
                <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center">
                  <CheckCircle2 className="w-8 h-8 text-green-600" />
                </div>
                <p className="text-slate-800 font-semibold text-xl">Account Created!</p>
                <p className="text-slate-500 text-sm max-w-xs">
                  Your VendorBridge account has been successfully created.
                  You can now sign in.
                </p>
                <Link href="/login">
                  <Button className="mt-2 bg-blue-600 hover:bg-blue-700 text-white px-8">
                    Go to Login
                  </Button>
                </Link>
              </div>
            ) : (
              <form onSubmit={handleSubmit(onSubmit)} noValidate>
                <Separator className="mb-6 bg-slate-100" />

                {/* ── Row 1: First Name + Last Name ── */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
                  <div className="space-y-2">
                    <Label htmlFor="firstName" className="text-sm font-medium text-slate-700">
                      First Name <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      id="firstName"
                      placeholder="John"
                      disabled={isLoading}
                      {...register("firstName")}
                      className={`h-10 bg-slate-50 border-slate-200 text-slate-800 placeholder:text-slate-400 focus:border-blue-500 transition-colors ${
                        errors.firstName ? "border-red-400" : ""
                      }`}
                    />
                    <FieldError message={errors.firstName?.message} />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="lastName" className="text-sm font-medium text-slate-700">
                      Last Name <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      id="lastName"
                      placeholder="Doe"
                      disabled={isLoading}
                      {...register("lastName")}
                      className={`h-10 bg-slate-50 border-slate-200 text-slate-800 placeholder:text-slate-400 focus:border-blue-500 transition-colors ${
                        errors.lastName ? "border-red-400" : ""
                      }`}
                    />
                    <FieldError message={errors.lastName?.message} />
                  </div>
                </div>

                {/* ── Row 2: Email + Phone ── */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
                  <div className="space-y-2">
                    <Label htmlFor="email" className="text-sm font-medium text-slate-700">
                      Email Address <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      id="email"
                      type="email"
                      placeholder="john@company.com"
                      autoComplete="email"
                      disabled={isLoading}
                      {...register("email")}
                      className={`h-10 bg-slate-50 border-slate-200 text-slate-800 placeholder:text-slate-400 focus:border-blue-500 transition-colors ${
                        errors.email ? "border-red-400" : ""
                      }`}
                    />
                    <FieldError message={errors.email?.message} />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="phone" className="text-sm font-medium text-slate-700">
                      Phone Number <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      id="phone"
                      type="tel"
                      placeholder="+1 (555) 000-0000"
                      autoComplete="tel"
                      disabled={isLoading}
                      {...register("phone")}
                      className={`h-10 bg-slate-50 border-slate-200 text-slate-800 placeholder:text-slate-400 focus:border-blue-500 transition-colors ${
                        errors.phone ? "border-red-400" : ""
                      }`}
                    />
                    <FieldError message={errors.phone?.message} />
                  </div>
                </div>

                {/* ── Row 3: Role + Country ── */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
                  <div className="space-y-2">
                    <Label htmlFor="role" className="text-sm font-medium text-slate-700">
                      Role <span className="text-red-500">*</span>
                    </Label>
                    <Controller
                      name="role"
                      control={control}
                      render={({ field }) => (
                        <Select
                          onValueChange={field.onChange}
                          value={field.value}
                          disabled={isLoading}
                        >
                          <SelectTrigger
                            id="role"
                            className={`h-10 bg-slate-50 border-slate-200 text-slate-800 focus:border-blue-500 transition-colors ${
                              errors.role ? "border-red-400" : ""
                            }`}
                          >
                            <SelectValue placeholder="Select role…" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="admin">Admin</SelectItem>
                            <SelectItem value="procurement_officer">
                              Procurement Officer
                            </SelectItem>
                          </SelectContent>
                        </Select>
                      )}
                    />
                    <FieldError message={errors.role?.message} />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="country" className="text-sm font-medium text-slate-700">
                      Country <span className="text-red-500">*</span>
                    </Label>
                    <Controller
                      name="country"
                      control={control}
                      render={({ field }) => (
                        <CountryCombobox
                          value={field.value}
                          onChange={field.onChange}
                          placeholder="Search country…"
                        />
                      )}
                    />
                    <FieldError message={errors.country?.message} />
                  </div>
                </div>

                {/* ── Row 4: Password + Confirm ── */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-2">
                  <div className="space-y-2">
                    <Label htmlFor="password" className="text-sm font-medium text-slate-700">
                      Password <span className="text-red-500">*</span>
                    </Label>
                    <div className="relative">
                      <Input
                        id="password"
                        type={showPassword ? "text" : "password"}
                        placeholder="Min 8 characters"
                        autoComplete="new-password"
                        disabled={isLoading}
                        {...register("password")}
                        className={`h-10 bg-slate-50 border-slate-200 text-slate-800 placeholder:text-slate-400 focus:border-blue-500 transition-colors pr-10 ${
                          errors.password ? "border-red-400" : ""
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
                    {/* Password strength indicator */}
                    {passwordValue && (
                      <div className="space-y-1">
                        <div className="flex gap-1">
                          {[1, 2, 3, 4, 5].map((i) => (
                            <div
                              key={i}
                              className={`h-1 flex-1 rounded-full transition-all duration-300 ${
                                i <= strength.score
                                  ? strength.color
                                  : "bg-slate-200"
                              }`}
                            />
                          ))}
                        </div>
                        <p className={`text-xs font-medium ${
                          strength.score <= 1 ? "text-red-500" :
                          strength.score <= 2 ? "text-orange-400" :
                          strength.score <= 3 ? "text-yellow-500" :
                          strength.score <= 4 ? "text-blue-500" :
                          "text-green-500"
                        }`}>
                          {strength.label}
                        </p>
                      </div>
                    )}
                    <FieldError message={errors.password?.message} />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="confirmPassword" className="text-sm font-medium text-slate-700">
                      Confirm Password <span className="text-red-500">*</span>
                    </Label>
                    <div className="relative">
                      <Input
                        id="confirmPassword"
                        type={showConfirm ? "text" : "password"}
                        placeholder="Re-enter password"
                        autoComplete="new-password"
                        disabled={isLoading}
                        {...register("confirmPassword")}
                        className={`h-10 bg-slate-50 border-slate-200 text-slate-800 placeholder:text-slate-400 focus:border-blue-500 transition-colors pr-10 ${
                          errors.confirmPassword ? "border-red-400" : ""
                        }`}
                      />
                      <button
                        type="button"
                        tabIndex={-1}
                        onClick={() => setShowConfirm((v) => !v)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
                        aria-label={showConfirm ? "Hide password" : "Show password"}
                      >
                        {showConfirm ? (
                          <EyeOff className="w-4 h-4" />
                        ) : (
                          <Eye className="w-4 h-4" />
                        )}
                      </button>
                    </div>
                    <FieldError message={errors.confirmPassword?.message} />
                  </div>
                </div>

                {/* ── Submit Button ── */}
                <div className="mt-6">
                  <Button
                    type="submit"
                    disabled={isLoading}
                    className="w-full h-10 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-all duration-200 shadow-sm shadow-blue-200 hover:shadow-blue-300 disabled:opacity-70"
                  >
                    {isLoading ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Creating account…
                      </>
                    ) : (
                      "Create Account"
                    )}
                  </Button>
                </div>

                <Separator className="my-5 bg-slate-100" />

                <p className="text-center text-sm text-slate-500">
                  Already have an account?{" "}
                  <Link
                    href="/login"
                    className="text-blue-600 hover:text-blue-700 font-medium transition-colors"
                  >
                    Login
                  </Link>
                </p>
              </form>
            )}
          </CardContent>
        </Card>

        <p className="text-center text-xs text-slate-400 mt-6">
          © {new Date().getFullYear()} VendorBridge. All rights reserved.
        </p>
      </div>
    </div>
  );
}
