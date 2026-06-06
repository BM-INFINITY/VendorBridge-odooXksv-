import type { Metadata } from "next";
import { LoginForm } from "@/features/auth/LoginForm";

export const metadata: Metadata = {
  title: "Login",
  description: "Sign in to your VendorBridge account.",
};

export default function LoginPage() {
  return <LoginForm />;
}
