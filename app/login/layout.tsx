import type React from "react";
import type { Metadata } from "next";
import { Toaster } from "@/components/ui/toaster";

export const metadata: Metadata = {
  title: "Dr. Zeus Capital - Login",
  description: "Acesso ao sistema CRM da Dr. Zeus Capital",
  generator: "v0.dev",
};

export default function LoginLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
      {children}
      <Toaster />
    </div>
  );
}
