"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { TabsContent } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Shield, Plus, Edit, Trash2, Crown, UserCheck, UserX, Users } from "lucide-react";
import React from "react";

interface ContaTabsProps {
  user: any;
  teamMembers: any[];
  showAddMember: boolean;
  setShowAddMember: (v: boolean) => void;
  selectedMember: any;
  setSelectedMember: (v: any) => void;
  memberName: string;
  setMemberName: (v: string) => void;
  memberEmail: string;
  setMemberEmail: (v: string) => void;
  memberRole: string;
  setMemberRole: (v: string) => void;
  memberPassword: string;
  setMemberPassword: (v: string) => void;
  confirmPassword: string;
  setConfirmPassword: (v: string) => void;
  loading: boolean;
  setLoading: (v: boolean) => void;
  handleAddNewMember: () => void;
  handleEditMember: (m: any) => void;
  showDeleteConfirm: boolean;
  setShowDeleteConfirm: (v: boolean) => void;
  memberToDelete: any;
  setMemberToDelete: (v: any) => void;
  fetchMembers: () => void;
  consultorPerms: Record<string, boolean>;
  setConsultorPerms: (v: Record<string, boolean>) => void;
  gerentePerms: Record<string, boolean>;
  setGerentePerms: (v: Record<string, boolean>) => void;
  diretorPerms: Record<string, boolean>;
  setDiretorPerms: (v: Record<string, boolean>) => void;
  adminPerms: Record<string, boolean>;
  setAdminPerms: (v: Record<string, boolean>) => void;
  permissions: any[];
  isAdmin: boolean;
  companyId: string;
  companyName: string;
  setCompanyName: (v: string) => void;
  companyCnpj: string;
  setCompanyCnpj: (v: string) => void;
  companyPhone: string;
  setCompanyPhone: (v: string) => void;
  companyAddress: string;
  setCompanyAddress: (v: string) => void;
  companyLoading: boolean;
  companySuccess: boolean;
  setCompanyLoading: (v: boolean) => void;
  setCompanySuccess: (v: boolean) => void;
  handleDeleteMember: () => void;
}

export function ContaTabs({ user }: { user: any }) {
  // Estados para membros
  const [teamMembers, setTeamMembers] = React.useState<any[]>([]);
  const [showAddMember, setShowAddMember] = React.useState(false);
  const [selectedMember, setSelectedMember] = React.useState<any>(null);
  const [memberName, setMemberName] = React.useState("");
  const [memberEmail, setMemberEmail] = React.useState("");
  const [memberRole, setMemberRole] = React.useState("");
  const [memberPassword, setMemberPassword] = React.useState("");
  const [confirmPassword, setConfirmPassword] = React.useState("");
  const [loading, setLoading] = React.useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = React.useState(false);
  const [memberToDelete, setMemberToDelete] = React.useState<any>(null);

  // Estados para empresa
  const [companyId, setCompanyId] = React.useState("");
  const [companyName, setCompanyName] = React.useState("");
  const [companyCnpj, setCompanyCnpj] = React.useState("");
  const [companyPhone, setCompanyPhone] = React.useState("");
  const [companyAddress, setCompanyAddress] = React.useState("");
  const [companyLoading, setCompanyLoading] = React.useState(false);
  const [companySuccess, setCompanySuccess] = React.useState(false);

  // Estados para permissões
  const [consultorPerms, setConsultorPerms] = React.useState({
    dashboard: true,
    whatsapp: true,
    propostas: true,
    simulator: true,
    reports: false,
    campaigns: false,
    team: false,
    settings: false,
  });
  const [gerentePerms, setGerentePerms] = React.useState({
    dashboard: true,
    whatsapp: true,
    propostas: true,
    simulator: true,
    reports: true,
    campaigns: true,
    team: true,
    settings: false,
  });
  const [diretorPerms, setDiretorPerms] = React.useState({
    dashboard: true,
    whatsapp: true,
    propostas: true,
    simulator: true,
    reports: true,
    campaigns: true,
    team: true,
    settings: true,
  });
  const [adminPerms, setAdminPerms] = React.useState({
    dashboard: true,
    whatsapp: true,
    propostas: true,
    simulator: true,
    reports: true,
    campaigns: true,
    team: true,
    settings: true,
  });

  // Buscar membros e empresa ao montar
  React.useEffect(() => {
    fetchMembers();
    fetchCompany();
  }, []);

  async function fetchMembers() {
    const res = await fetch("/api/members");
    const data = await res.json();
    setTeamMembers(data);
  }
  async function fetchCompany() {
    const res = await fetch("/api/company");
    const data = await res.json();
    if (data && data.id) {
      setCompanyId(data.id);
      setCompanyName(data.name || "");
      setCompanyCnpj(data.cnpj || "");
      setCompanyPhone(data.phone || "");
      setCompanyAddress(data.address || "");
    }
  }

  async function handleAddNewMember() {
    if (!memberName || !memberEmail || !memberRole || !memberPassword) {
      alert("Preencha todos os campos obrigatórios");
      return;
    }

    if (memberPassword !== confirmPassword) {
      alert("As senhas não coincidem");
      return;
    }

    setLoading(true);
    try {
      const method = selectedMember ? "PUT" : "POST";
      const url = selectedMember ? "/api/members" : "/api/members";
      const body = selectedMember 
        ? { id: selectedMember.id, name: memberName, email: memberEmail, role: memberRole, password: memberPassword }
        : { name: memberName, email: memberEmail, role: memberRole, password: memberPassword };

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      if (res.ok) {
        await fetchMembers();
        setShowAddMember(false);
        setSelectedMember(null);
        setMemberName("");
        setMemberEmail("");
        setMemberRole("");
        setMemberPassword("");
        setConfirmPassword("");
        alert(selectedMember ? "Membro atualizado com sucesso!" : "Membro adicionado com sucesso!");
      } else {
        const error = await res.json();
        alert(error.error || "Erro ao salvar membro");
      }
    } catch (error) {
      alert("Erro ao salvar membro");
    } finally {
      setLoading(false);
    }
  }

  function handleEditMember(member: any) {
    setSelectedMember(member);
    setMemberName(member.name);
    setMemberEmail(member.email);
    setMemberRole(member.position);
    setMemberPassword("");
    setConfirmPassword("");
    setShowAddMember(true);
  }

  async function handleDeleteMember() {
    if (!memberToDelete) return;

    setLoading(true);
    try {
      const res = await fetch("/api/members", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: memberToDelete.id }),
      });

      if (res.ok) {
        await fetchMembers();
        setShowDeleteConfirm(false);
        setMemberToDelete(null);
        alert("Membro excluído com sucesso!");
      } else {
        const error = await res.json();
        alert(error.error || "Erro ao excluir membro");
      }
    } catch (error) {
      alert("Erro ao excluir membro");
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      {/* Tab de Membros */}
      <TabsContent value="team" className="space-y-4">
        <div className="bg-white rounded-lg border p-6">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-lg font-semibold">Gerenciar Membros</h3>
            <Button
              onClick={() => setShowAddMember(true)}
              className="bg-blue-600 hover:bg-blue-700"
            >
              <Plus className="w-4 h-4 mr-2" />
              Adicionar Membro
            </Button>
          </div>

          {teamMembers.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <Users className="w-12 h-12 mx-auto mb-4 text-gray-300" />
              <p>Nenhum membro encontrado</p>
              <p className="text-sm">Clique em "Adicionar Membro" para começar</p>
            </div>
          ) : (
            <div className="space-y-4">
              {teamMembers.map((member) => (
                <div
                  key={member.id}
                  className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50"
                >
                  <div className="flex items-center space-x-4">
                    <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                      <User className="w-5 h-5 text-blue-600" />
                    </div>
                    <div>
                      <h4 className="font-medium">{member.name}</h4>
                      <p className="text-sm text-gray-600">{member.email}</p>
                      <p className="text-xs text-gray-500 capitalize">{member.position}</p>
                    </div>
                  </div>
                  <div className="flex space-x-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleEditMember(member)}
                    >
                      <Edit className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setMemberToDelete(member);
                        setShowDeleteConfirm(true);
                      }}
                      className="text-red-600 hover:text-red-700"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </TabsContent>

      {/* Tab de Permissões */}
      <TabsContent value="permissions" className="space-y-4">
        <div className="bg-white rounded-lg border p-6">
          <h3 className="text-lg font-semibold mb-4">Configurar Permissões</h3>
          <p className="text-gray-600">
            Configure as permissões para cada tipo de usuário no sistema.
          </p>
        </div>
      </TabsContent>

      {/* Tab de Perfil */}
      <TabsContent value="profile" className="space-y-4">
        <div className="bg-white rounded-lg border p-6">
          <h3 className="text-lg font-semibold mb-4">Meu Perfil</h3>
          <p className="text-gray-600">
            Gerencie suas informações pessoais e configurações de conta.
          </p>
        </div>
      </TabsContent>

      {/* Tab de Configurações */}
      <TabsContent value="settings" className="space-y-4">
        <div className="bg-white rounded-lg border p-6">
          <h3 className="text-lg font-semibold mb-4">Configurações</h3>
          <p className="text-gray-600">
            Configure suas preferências e configurações do sistema.
          </p>
        </div>
      </TabsContent>

      {/* Modais de adicionar/editar/excluir membro */}
      {/* Modal de Adicionar/Editar Membro */}
      {showAddMember && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h3 className="text-lg font-semibold mb-4">
              {selectedMember ? "Editar Membro" : "Adicionar Membro"}
            </h3>
            <div className="space-y-4">
              <div>
                <Label>Nome</Label>
                <Input
                  value={memberName}
                  onChange={(e) => setMemberName(e.target.value)}
                  placeholder="Nome completo"
                />
              </div>
              <div>
                <Label>Email</Label>
                <Input
                  type="email"
                  value={memberEmail}
                  onChange={(e) => setMemberEmail(e.target.value)}
                  placeholder="email@exemplo.com"
                />
              </div>
              <div>
                <Label>Cargo</Label>
                <Select value={memberRole} onValueChange={setMemberRole}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione o cargo" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Consultor">Consultor</SelectItem>
                    <SelectItem value="Gerente">Gerente</SelectItem>
                    <SelectItem value="Administrador">Administrador</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Senha</Label>
                <Input
                  type="password"
                  value={memberPassword}
                  onChange={(e) => setMemberPassword(e.target.value)}
                  placeholder="Digite a senha"
                />
              </div>
              <div>
                <Label>Confirmar Senha</Label>
                <Input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Confirme a senha"
                />
              </div>
            </div>
            <div className="flex space-x-2 mt-6">
              <Button
                variant="outline"
                onClick={() => {
                  setShowAddMember(false);
                  setSelectedMember(null);
                  setMemberName("");
                  setMemberEmail("");
                  setMemberRole("");
                  setMemberPassword("");
                  setConfirmPassword("");
                }}
              >
                Cancelar
              </Button>
              <Button
                onClick={handleAddNewMember}
                disabled={loading}
                className="bg-blue-600 hover:bg-blue-700"
              >
                {loading ? "Salvando..." : selectedMember ? "Atualizar" : "Adicionar"}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Confirmação de Exclusão */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h3 className="text-lg font-semibold mb-4">Confirmar Exclusão</h3>
            <p className="text-gray-600 mb-6">
              Tem certeza que deseja excluir o membro "{memberToDelete?.name}"? Esta ação não pode ser desfeita.
            </p>
            <div className="flex space-x-2">
              <Button
                variant="outline"
                onClick={() => {
                  setShowDeleteConfirm(false);
                  setMemberToDelete(null);
                }}
              >
                Cancelar
              </Button>
              <Button
                onClick={handleDeleteMember}
                disabled={loading}
                className="bg-red-600 hover:bg-red-700"
              >
                {loading ? "Excluindo..." : "Excluir"}
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  );
} 