import { NextAuthProtectedRoute } from "@/components/NextAuthProtectedRoute";

export default function IAAttendanceLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <NextAuthProtectedRoute>
      {children}
    </NextAuthProtectedRoute>
  );
} 