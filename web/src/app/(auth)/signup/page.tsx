import type { Metadata } from "next";
import { AuthForm } from "@/components/auth-form";

export const metadata: Metadata = { title: "Create account · Chatterbox" };

export default function SignupPage() {
  return <AuthForm mode="signup" />;
}
