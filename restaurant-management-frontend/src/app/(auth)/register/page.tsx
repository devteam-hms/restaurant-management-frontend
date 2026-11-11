import { RegisterForm } from "@/components/forms/register-form";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Register Restaurant Business - Restaurant Management System",
  description: "Register your restaurant business tenant and create an owner account.",
};

export default function RegisterPage() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-4 sm:p-8 bg-slate-50/60">
      <RegisterForm />
    </main>
  );
}

