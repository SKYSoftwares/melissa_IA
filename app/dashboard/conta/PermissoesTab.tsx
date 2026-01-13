"use client";

import { Button } from "@/components/ui/button";
import { TabsContent } from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Shield, Users, Settings, BarChart3, MessageSquare, FileText, Calculator, Target } from "lucide-react";
import React from "react";

export function PermissoesTab({ user }: { user: any }) {
  const [permissions, setPermissions] = React.useState<any>(null);
  const [allMembers, setAllMembers] = React.useState<any[]>([]);
  const [selectedMember, setSelectedMember] = React.useState<any>(null);
  const [loading, setLoading] = React.useState(false);
  const isAdmin = user?.role === "administrador" || user?.role === "diretor";

  // Buscar permissões ao montar
  React.useEffect(() => {
    if (isAdmin) {
      fetchAllMembers();
    } else {
      fetchPermissions();
    }
  }, [isAdmin]);

  async function fetchAllMembers() {
    try {
      const res = await fetch("/api/members");
      if (res.ok) {
        const members = await res.json();
        setAllMembers(members);
      } else {
        console.error("Erro ao buscar membros:", res.status);
      }
    } catch (error) {
      console.error("Erro ao buscar membros:", error);
    }
  }

  async function fetchPermissions() {
    try {
      // Buscar todos os membros primeiro
      const res = await fetch("/api/members");
      if (res.ok) {
        const members = await res.json();
        // Encontrar o membro atual
        const currentMember = members.find((member: any) => member.id === user?.id);
        if (currentMember && currentMember.permissions && currentMember.permissions.length > 0) {
          // Pegar a primeira permissão (deve ser a única para o membro)
          setPermissions(currentMember.permissions[0]);
        } else {
          console.log("Nenhuma permissão encontrada para o usuário:", user?.id);
          setPermissions(null);
        }
      } else {
        console.error("Erro ao buscar permissões:", res.status);
      }
    } catch (error) {
      console.error("Erro ao buscar permissões:", error);
    }
  }

  async function updatePermission(permissionKey: string, value: boolean, memberId?: string) {
    setLoading(true);
    try {
      const targetMemberId = memberId || user?.id;
      
      // Atualizar permissão diretamente no banco
      const res = await fetch("/api/members/permissions", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          teamId: targetMemberId,
          permissionKey,
          value
        }),
      });

      if (res.ok) {
        if (isAdmin) {
          await fetchAllMembers();
        } else {
          await fetchPermissions();
        }
      } else {
        console.error("Erro ao atualizar permissão");
      }
    } catch (error) {
      console.error("Erro ao atualizar permissão:", error);
    } finally {
      setLoading(false);
    }
  }

  const permissionItems = [
    {
      key: "dashboard",
      label: "Dashboard",
      description: "Acesso ao painel principal",
      icon: BarChart3,
      color: "bg-blue-100 text-blue-600"
    },
    {
      key: "whatsapp",
      label: "WhatsApp",
      description: "Gerenciamento de conversas e mensagens",
      icon: MessageSquare,
      color: "bg-green-100 text-green-600"
    },
    {
      key: "propostas",
      label: "Propostas",
      description: "Criação e gerenciamento de propostas",
      icon: FileText,
      color: "bg-purple-100 text-purple-600"
    },
    {
      key: "simuladores",
      label: "Simuladores",
      description: "Acesso aos simuladores financeiros",
      icon: Calculator,
      color: "bg-orange-100 text-orange-600"
    },
    {
      key: "relatorios",
      label: "Relatórios",
      description: "Visualização de relatórios e análises",
      icon: BarChart3,
      color: "bg-indigo-100 text-indigo-600"
    },
    {
      key: "campanhas",
      label: "Campanhas",
      description: "Gerenciamento de campanhas de marketing",
      icon: Target,
      color: "bg-pink-100 text-pink-600"
    },
    {
      key: "equipe",
      label: "Equipe",
      description: "Gerenciamento de membros da equipe",
      icon: Users,
      color: "bg-teal-100 text-teal-600"
    },
    {
      key: "configuracoes",
      label: "Configurações",
      description: "Acesso às configurações do sistema",
      icon: Settings,
      color: "bg-gray-100 text-gray-600"
    }
  ];

  return (
    <TabsContent value="permissions" className="space-y-4">
      <div className="bg-white rounded-lg border p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="text-lg font-semibold">
              {isAdmin ? "Gerenciar Permissões dos Usuários" : "Minhas Permissões"}
            </h3>
            <p className="text-sm text-gray-600 mt-1">
              {isAdmin 
                ? "Configure as permissões de acesso para todos os usuários do sistema"
                : "Visualize suas permissões de acesso no sistema"
              }
            </p>
          </div>
          <Badge variant="secondary" className="capitalize">
            {user?.role || "Usuário"}
          </Badge>
        </div>

        {isAdmin ? (
          // Interface para Administrador/Diretor
          <div className="space-y-4">
            {allMembers.length > 0 ? (
              <div className="space-y-4">
                {allMembers.map((member) => (
                  <Card key={member.id} className="hover:shadow-md transition-shadow">
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                          <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                            <Users className="w-5 h-5 text-blue-600" />
                          </div>
                          <div>
                            <CardTitle className="text-base">{member.name}</CardTitle>
                            <CardDescription className="text-sm">
                              {member.email} • {member.position}
                            </CardDescription>
                          </div>
                        </div>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setSelectedMember(member)}
                        >
                          Gerenciar Permissões
                        </Button>
                      </div>
                    </CardHeader>
                  </Card>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <Users className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                <p className="text-gray-500">Nenhum membro encontrado</p>
              </div>
            )}

            {/* Modal para gerenciar permissões de um membro específico */}
            {selectedMember && (
              <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
                <div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-[80vh] overflow-y-auto">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-semibold">
                      Permissões de {selectedMember.name}
                    </h3>
                    <Button
                      variant="outline"
                      onClick={() => setSelectedMember(null)}
                    >
                      Fechar
                    </Button>
                  </div>
                  
                  <div className="grid gap-4 md:grid-cols-2">
                    {permissionItems.map((item) => {
                      const Icon = item.icon;
                      const memberPermissions = selectedMember.permissions?.[0];
                      const isEnabled = memberPermissions?.[item.key] || false;
                      
                      return (
                        <Card key={item.key} className="hover:shadow-md transition-shadow">
                          <CardHeader className="pb-3">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center space-x-3">
                                <div className={`p-2 rounded-lg ${item.color}`}>
                                  <Icon className="w-5 h-5" />
                                </div>
                                <div>
                                  <CardTitle className="text-base">{item.label}</CardTitle>
                                  <CardDescription className="text-sm">
                                    {item.description}
                                  </CardDescription>
                                </div>
                              </div>
                              <Switch
                                checked={isEnabled}
                                onCheckedChange={(checked) => updatePermission(item.key, checked, selectedMember.id)}
                                disabled={loading}
                              />
                            </div>
                          </CardHeader>
                        </Card>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}
          </div>
        ) : (
          // Interface para usuário comum
          <div>
            {permissions ? (
              <div className="grid gap-4 md:grid-cols-2">
                {permissionItems.map((item) => {
                  const Icon = item.icon;
                  const isEnabled = permissions[item.key] || false;
                  
                  return (
                    <Card key={item.key} className="hover:shadow-md transition-shadow">
                      <CardHeader className="pb-3">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-3">
                            <div className={`p-2 rounded-lg ${item.color}`}>
                              <Icon className="w-5 h-5" />
                            </div>
                            <div>
                              <CardTitle className="text-base">{item.label}</CardTitle>
                              <CardDescription className="text-sm">
                                {item.description}
                              </CardDescription>
                            </div>
                          </div>
                          <div className="flex items-center space-x-2">
                            <Switch
                              checked={isEnabled}
                              disabled={true}
                            />
                            <span className="text-xs text-gray-500">
                              {isEnabled ? "Ativo" : "Inativo"}
                            </span>
                          </div>
                        </div>
                      </CardHeader>
                    </Card>
                  );
                })}
              </div>
            ) : (
              <div className="text-center py-8">
                <Shield className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                <p className="text-gray-500">Nenhuma permissão encontrada</p>
                <p className="text-sm text-gray-400 mt-2">Entre em contato com o administrador para configurar suas permissões</p>
              </div>
            )}
          </div>
        )}
      </div>
    </TabsContent>
  );
} 