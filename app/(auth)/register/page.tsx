import type { Metadata } from "next";
import { RegisterForm } from "@/features/auth/RegisterForm";

export const metadata: Metadata = {
  title: "Register",
  description: "Create a new VendorBridge account.",
};

export default function RegisterPage() {
  return <RegisterForm />;
}
