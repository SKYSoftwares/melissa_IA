import type React from "react";
import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/app-sidebar";
import { HeaderNav } from "@/components/header-nav";
import { NextAuthProtectedRoute } from "@/components/NextAuthProtectedRoute";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <NextAuthProtectedRoute>
      <SidebarProvider defaultOpen={true}>
        <AppSidebar />
        <SidebarInset>
          <HeaderNav />
          <main className="flex-1 overflow-auto p-6 bg-gray-50">
            {children}
          </main>
        </SidebarInset>
      </SidebarProvider>
    </NextAuthProtectedRoute>
  );
}
