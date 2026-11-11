import { LoginForm } from "@/components/forms/login-form";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Sign In - Restaurant Management System",
  description: "Sign in with your Keycloak credentials to access your restaurant admin dashboard.",
};

export default function LoginPage() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-4 sm:p-8 bg-slate-50/60">
      <LoginForm />
    </main>
  );
}

