"use client";

import { useSession } from "next-auth/react";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { ConfiguracoesTab } from "../conta/ConfiguracoesTab";
import { EquipeTabs } from "../conta/EquipeTabs";
import { MembrosTab } from "../conta/MembrosTab";
import { MeusGerentesTab } from "../conta/MeusGerentesTab";
import { AprovacoesTab } from "../conta/AprovacoesTab";
// import { PermissoesTab } from "./PermissoesTab";

export default function ContaPage() {
  const { data: session, status } = useSession();
  const user = session?.user;

  // Se ainda está carregando, mostrar loading
  if (status === "loading") {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  // Se não está autenticado, mostrar mensagem
  if (!session) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">
            Não autenticado
          </h2>
          <p className="text-gray-600">
            Você precisa estar logado para acessar esta página.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 space-y-4 p-8 pt-6">
      <div className="flex items-center justify-between space-y-2">
        <h2 className="text-3xl font-bold tracking-tight">Minha Conta</h2>
        <Badge variant="secondary">{user?.role || "Usuário"}</Badge>
      </div>

      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
        <h3 className="font-semibold text-blue-900 mb-2">
          Informações do Usuário
        </h3>
        <p className="text-blue-800 text-sm">
          <strong>Nome:</strong> {user?.name || "Não informado"}
          <br />
          <strong>Email:</strong> {user?.email || "Não informado"}
          <br />
          <strong>Função:</strong> {user?.role || "Não informado"}
        </p>
      </div>

      <Tabs defaultValue="teams" className="space-y-4">
        <TabsList>
          <TabsTrigger value="teams">Equipes</TabsTrigger>
          <TabsTrigger value="team">Membros</TabsTrigger>
          {(user?.role === "Diretor" || user?.role === "administrador") && (
            <TabsTrigger value="my-managers">Meus Gerentes</TabsTrigger>
          )}
          {String(user?.role || "").toLowerCase() === "administrador" && (
            <TabsTrigger value="approvals">Aprovações</TabsTrigger>
          )}
        </TabsList>

        {/* <TabsContent value="profile" className="space-y-4">
          <div className="bg-white rounded-lg border p-6">
            <h3 className="text-lg font-semibold mb-4">Meu Perfil</h3>
            <p className="text-gray-600">
              Aqui você pode gerenciar suas informações pessoais e configurações de conta.
            </p>1
          </div>
        </TabsContent> */}

        {/* <ConfiguracoesTab user={user} /> */}

        <TabsContent value="teams" className="space-y-4">
          <EquipeTabs user={user} />
        </TabsContent>

        <MembrosTab user={user} />

        <MeusGerentesTab user={user} />
        <TabsContent value="approvals" className="space-y-4">
          <AprovacoesTab user={user} />
        </TabsContent>

        {/* <PermissoesTab user={user} /> */}
      </Tabs>
    </div>
  );
}
