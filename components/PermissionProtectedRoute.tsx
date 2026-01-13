"use client";

import { useAuth } from "@/contexts/AuthContext";
import { podeAcessar, Role, PermissoesPorRole } from "@/lib/permissions";
import { useEffect } from "react";
import { useRouter } from "next/navigation";

interface PermissionProtectedRouteProps {
  children: React.ReactNode;
  requiredPermission: keyof PermissoesPorRole["usuario"]; // dashboard, whatsapp, propostas, etc.
}

export function PermissionProtectedRoute({
  children,
  requiredPermission,
}: PermissionProtectedRouteProps) {
  const { user, isAuthenticated, isLoading } = useAuth();
  const router = useRouter();

  // Permissões baseadas na configuração da imagem
  const permissoes: PermissoesPorRole = {
    usuario: {
      dashboard: true,
      whatsapp: true,
      propostas: true,
      simuladores: true,
      relatorios: true,
      campanhas: true,
      equipe: false, // Usuário NÃO pode acessar
      configuracoes: false, // Usuário NÃO pode acessar
    },
    gerente: {
      dashboard: true,
      whatsapp: true,
      propostas: true,
      simuladores: true,
      relatorios: true,
      campanhas: true,
      equipe: true, // Gerente PODE acessar
      configuracoes: true, // Gerente PODE acessar
    },
  };

  useEffect(() => {
    if (!isLoading) {
      if (!isAuthenticated) {
        // Se não está logado, vai para login
        router.push("/login");
      } else if (
        user &&
        !podeAcessar(user.role as Role, requiredPermission, permissoes)
      ) {
        // Se está logado mas não tem permissão, vai para dashboard
        router.push("/dashboard");
      }
    }
  }, [
    isAuthenticated,
    isLoading,
    user,
    requiredPermission,
    router,
    permissoes,
  ]);

  // Mostrar loading enquanto verifica
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  // Se não está autenticado, não renderizar nada (será redirecionado)
  if (!isAuthenticated) {
    return null;
  }

  // Se não tem permissão, mostrar mensagem de acesso negado
  if (user && !podeAcessar(user.role as Role, requiredPermission, permissoes)) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">
            Acesso Negado
          </h2>
          <p className="text-gray-600 mb-4">
            Você não tem permissão para acessar esta funcionalidade.
          </p>
          <p className="text-sm text-gray-500">
            Entre em contato com seu administrador para solicitar acesso.
          </p>
        </div>
      </div>
    );
  }

  // Se tem permissão, renderizar o conteúdo
  return <>{children}</>;
}
