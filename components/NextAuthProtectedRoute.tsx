"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

interface NextAuthProtectedRouteProps {
  children: React.ReactNode;
}

export function NextAuthProtectedRoute({
  children,
}: NextAuthProtectedRouteProps) {
  const { data: session, status } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (status === "loading") return; // Ainda carregando

    if (!session) {
      router.push("/login");
    }
  }, [session, status, router]);

  // Mostrar loading enquanto verifica autenticação
  if (status === "loading") {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  // Se não está autenticado, não renderizar nada (será redirecionado)
  if (!session) {
    return null;
  }

  // Se está autenticado, renderizar o conteúdo
  return <>{children}</>;
}
