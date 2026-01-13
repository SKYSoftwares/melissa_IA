"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { TabsContent } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Plus,
  Edit,
  Trash2,
  User,
  Users,
  Search as SearchIcon,
  X as XIcon,
} from "lucide-react";
import React from "react";

const onlyDigits = (s: string) => s.replace(/\D/g, "");

// ——— máscaras e validações ———
function maskCPF(v: string) {
  const d = onlyDigits(v).slice(0, 11);
  if (d.length <= 9)
    return d.replace(/(\d{3})(\d{0,3})(\d{0,3})/, (_, $1, $2, $3) =>
      [$1, $2, $3].filter(Boolean).join(".")
    );
  return d.replace(
    /(\d{3})(\d{3})(\d{3})(\d{0,2})/,
    (_, $1, $2, $3, $4) => `${$1}.${$2}.${$3}${$4 ? "-" + $4 : ""}`
  );
}

function maskPhone(v: string) {
  const d = onlyDigits(v).slice(0, 11);
  if (d.length <= 10)
    return d.replace(
      /(\d{2})(\d{0,4})(\d{0,4})/,
      (_, $1, $2, $3) => `(${$1}${$2 ? ") " + $2 : ""}${$3 ? "-" + $3 : ""}`
    );
  return d.replace(
    /(\d{2})(\d{0,5})(\d{0,4})/,
    (_, $1, $2, $3) => `(${$1}${$2 ? ") " + $2 : ""}${$3 ? "-" + $3 : ""}`
  );
}

function cpfIsValid(v: string) {
  const s = onlyDigits(v);
  if (s.length !== 11 || /^(\d)\1{10}$/.test(s)) return false;
  let sum = 0;
  for (let i = 0; i < 9; i++) sum += parseInt(s[i]) * (10 - i);
  let d1 = 11 - (sum % 11);
  if (d1 >= 10) d1 = 0;
  sum = 0;
  for (let i = 0; i < 10; i++) sum += parseInt(s[i]) * (11 - i);
  let d2 = 11 - (sum % 11);
  if (d2 >= 10) d2 = 0;
  return s[9] === String(d1) && s[10] === String(d2);
}

// ——— formatadores ———
const formatCPF = (v?: string) => (v ? maskCPF(v) : "");
const formatPhone = (v?: string) => (v ? maskPhone(v) : "");
const formatCNPJ = (v?: string) => {
  const d = onlyDigits(v || "").slice(0, 14);
  if (!d) return "";
  return d.replace(
    /(\d{2})(\d{3})(\d{3})(\d{4})(\d{0,2})/,
    (_m, a, b, c, d4, e) => `${a}.${b}.${c}/${d4}${e ? "-" + e : ""}`
  );
};
const formatDate = (iso?: string) => {
  if (!iso) return "";
  const [y, m, d] = iso.split("-");
  if (!y || !m || !d) return iso;
  return `${d}/${m}/${y}`;
};
function getAllowedRolesFor(user: any): string[] {
  const r = String(user?.role || user?.position || "").toLowerCase();
  if (r === "administrador")
    return ["Consultor", "Gerente", "Diretor", "Administrador"];
  if (r === "diretor") return ["Consultor", "Gerente"];
  if (r === "gerente") return ["Consultor"];
  return ["Consultor"]; // consultor (ou papel desconhecido) só cria Consultor
}
// ——— badge para cargo ———
function RoleBadge({ role }: { role?: string }) {
  const map: Record<string, string> = {
    Administrador:
      "bg-purple-50 text-purple-700 ring-1 ring-purple-200 dark:bg-purple-100/30",
    Diretor:
      "bg-amber-50 text-amber-700 ring-1 ring-amber-200 dark:bg-amber-100/30",
    Gerente:
      "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200 dark:bg-emerald-100/30",
    Consultor:
      "bg-blue-50 text-blue-700 ring-1 ring-blue-200 dark:bg-blue-100/30",
  };
  const cls =
    map[role || ""] ||
    "bg-gray-50 text-gray-700 ring-1 ring-gray-200 dark:bg-gray-100/30";
  return (
    <span
      className={`px-2 py-0.5 rounded-full text-[11px] font-semibold ${cls}`}
    >
      {role || "—"}
    </span>
  );
}

export function MembrosTab({ user }: { user: any }) {
  // Estados base
  const [teamMembers, setTeamMembers] = React.useState<any[]>([]);
  const [loadingMembers, setLoadingMembers] = React.useState(false);

  // Busca/Filtro
  const [query, setQuery] = React.useState("");
  const allowedRoles = React.useMemo(() => getAllowedRolesFor(user), [user]);
  // Modal adicionar/editar
  const [showAddMember, setShowAddMember] = React.useState(false);
  const [selectedMember, setSelectedMember] = React.useState<any>(null);

  // Campos do formulário
  const [memberName, setMemberName] = React.useState("");
  const [memberEmail, setMemberEmail] = React.useState("");
  const [memberRole, setMemberRole] = React.useState("");
  const [memberPassword, setMemberPassword] = React.useState("");
  const [confirmPassword, setConfirmPassword] = React.useState("");
  const [memberCPF, setMemberCPF] = React.useState("");
  const [memberPhone, setMemberPhone] = React.useState("");
  const [memberCNPJ, setMemberCNPJ] = React.useState("");
  const [memberAddress, setMemberAddress] = React.useState("");
  const [memberBirthDate, setMemberBirthDate] = React.useState(""); // YYYY-MM-DD

  // Exclusão
  const [showDeleteConfirm, setShowDeleteConfirm] = React.useState(false);
  const [memberToDelete, setMemberToDelete] = React.useState<any>(null);

  // Loading geral de ações
  const [loading, setLoading] = React.useState(false);

  // Buscar membros ao montar
  React.useEffect(() => {
    fetchMembers();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function fetchMembers() {
    try {
      setLoadingMembers(true);
      const res = await fetch(`/api/members/by-user?userId=${user.id}`);
      if (res.ok) {
        const data = await res.json();
        setTeamMembers(data || []);
      } else {
        console.error("Erro ao buscar membros:", res.status);
      }
    } catch (error) {
      console.error("Erro ao buscar membros:", error);
    } finally {
      setLoadingMembers(false);
    }
  }

  // Lista filtrada (corrigido: não comparar dígitos quando query não tem dígitos)
  const filteredMembers = React.useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return teamMembers;
    const qDigits = onlyDigits(q);
    const hasDigits = qDigits.length > 0;

    return (teamMembers || []).filter((m: any) => {
      const pool: Array<string> = [];

      // textos "puros"
      if (m?.name) pool.push(String(m.name));
      if (m?.email) pool.push(String(m.email));
      if (m?.position) pool.push(String(m.position));
      if (m?.address) pool.push(String(m.address));

      // valores numéricos/mascarados
      if (m?.phone) {
        pool.push(String(m.phone), formatPhone(String(m.phone)));
      }
      if (m?.cpf) {
        pool.push(String(m.cpf), formatCPF(String(m.cpf)));
      }
      if (m?.cnpj) {
        pool.push(String(m.cnpj), formatCNPJ(String(m.cnpj)));
      }

      return pool.some((t) => {
        const txt = String(t);
        const lowerMatch = txt.toLowerCase().includes(q);
        const digitMatch = hasDigits && onlyDigits(txt).includes(qDigits); // <— fix
        return lowerMatch || digitMatch;
      });
    });
  }, [teamMembers, query]);

  function clearForm() {
    setSelectedMember(null);
    setMemberName("");
    setMemberEmail("");
    setMemberRole("");
    setMemberPassword("");
    setConfirmPassword("");
    setMemberCPF("");
    setMemberPhone("");
    setMemberCNPJ("");
    setMemberAddress("");
    setMemberBirthDate("");
  }

  async function handleAddNewMember() {
    // Validações diferentes para criação vs edição
    if (!memberName || !memberEmail || !memberRole) {
      alert("Preencha nome, e-mail e cargo.");
      return;
    }

    // Senha obrigatória apenas na criação
    if (!selectedMember && !memberPassword) {
      alert("Preencha a senha.");
      return;
    }

    if (!memberCPF || !cpfIsValid(memberCPF)) {
      alert("CPF obrigatório e válido.");
      return;
    }
    if (!memberPhone) {
      alert("Telefone é obrigatório.");
      return;
    }

    // Validação de senha apenas na criação
    if (!selectedMember && memberPassword !== confirmPassword) {
      alert("As senhas não coincidem.");
      return;
    }

    const finalRole = allowedRoles.includes(memberRole)
      ? memberRole
      : allowedRoles[0];
    setLoading(true);
    try {
      const payload = {
        id: selectedMember?.id,
        name: memberName,
        email: memberEmail,
        role: finalRole,
        ...(selectedMember ? {} : { password: memberPassword }), // Senha apenas na criação
        cpf: onlyDigits(memberCPF),
        phone: onlyDigits(memberPhone),
        cnpj: onlyDigits(memberCNPJ),
        address: memberAddress || undefined,
        birthDate: memberBirthDate || undefined,
        ...(selectedMember ? {} : { creatorId: user.id }),
      };

      const res = selectedMember
        ? await fetch("/api/members", {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload),
          })
        : await fetch("/api/members/by-user", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload),
          });

      if (res.ok) {
        await fetchMembers();
        setShowAddMember(false);
        clearForm();
        alert(
          selectedMember
            ? "Membro atualizado com sucesso!"
            : "Membro adicionado com sucesso!"
        );
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
    setMemberName(member?.name || "");
    setMemberEmail(member?.email || "");
    setMemberRole(member?.position || allowedRoles[0]);
    setMemberCPF(maskCPF(member?.cpf || ""));
    setMemberPhone(maskPhone(member?.phone || ""));
    setMemberCNPJ(member?.cnpj || "");
    setMemberAddress(member?.address || "");
    setMemberBirthDate(member?.birthDate || "");
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

  // Skeleton simples
  const SkeletonCard = () => (
    <div className="rounded-lg border border-gray-200 bg-white p-5 shadow-sm animate-pulse">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-full bg-gray-200" />
        <div className="flex-1 space-y-2">
          <div className="h-3 bg-gray-200 rounded w-2/3" />
          <div className="h-2.5 bg-gray-100 rounded w-1/3" />
        </div>
      </div>
      <div className="mt-4 space-y-2">
        <div className="h-2.5 bg-gray-100 rounded" />
        <div className="h-2.5 bg-gray-100 rounded w-5/6" />
        <div className="h-2.5 bg-gray-100 rounded w-4/6" />
      </div>
    </div>
  );

  return (
    <TabsContent value="team" className="space-y-4">
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm">
        {/* Header */}
        <div className="flex flex-col gap-4 p-6 border-b border-gray-100 md:flex-row md:items-center md:justify-between">
          <div>
            <h3 className="text-xl font-semibold tracking-tight text-gray-900">
              Gerenciar Membros
            </h3>
            <p className="text-sm text-gray-500 mt-1">
              Cadastre, busque e edite integrantes da sua equipe.
            </p>
          </div>

          <div className="flex flex-col md:flex-row gap-3 md:items-center">
            <div className="relative w-full md:w-80">
              <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                aria-label="Buscar membros"
                placeholder="Buscar por nome, e-mail, cargo, telefone, CPF, CNPJ..."
                className="pl-9 pr-9"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Escape") setQuery("");
                }}
              />
              {query && (
                <button
                  aria-label="Limpar busca"
                  className="absolute right-2 top-1/2 -translate-y-1/2 p-1 rounded hover:bg-gray-100"
                  onClick={() => setQuery("")}
                >
                  <XIcon className="h-4 w-4 text-gray-400" />
                </button>
              )}
            </div>

            <div className="text-sm text-gray-500 md:ml-1">
              {filteredMembers.length} resultado
              {filteredMembers.length === 1 ? "" : "s"}
            </div>

            <Button
              onClick={() => {
                clearForm();
                setMemberRole(allowedRoles[0]); // força o cargo inicial permitido
                setShowAddMember(true);
              }}
              className="bg-blue-600 hover:bg-blue-700"
            >
              <Plus className="w-4 h-4 mr-2" />
              Adicionar Membro
            </Button>
          </div>
        </div>

        {/* Lista */}
        <div className="p-6">
          {loadingMembers ? (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {Array.from({ length: 6 }).map((_, i) => (
                <SkeletonCard key={i} />
              ))}
            </div>
          ) : filteredMembers.length === 0 ? (
            <div className="text-center py-14 text-gray-500">
              <Users className="w-12 h-12 mx-auto mb-4 text-gray-300" />
              <p className="font-medium">
                {query
                  ? "Nenhum membro encontrado para a busca."
                  : "Nenhum membro cadastrado."}
              </p>
              {!query && (
                <p className="text-sm mt-1">
                  Clique em “Adicionar Membro” para começar.
                </p>
              )}
            </div>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {filteredMembers.map((member: any) => (
                <div
                  key={member.id}
                  className="group rounded-lg border border-gray-200 bg-white p-5 shadow-sm hover:shadow-md hover:-translate-y-0.5 transition"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-11 h-11 rounded-full bg-blue-100 flex items-center justify-center ring-1 ring-blue-200">
                        <User className="w-5 h-5 text-blue-700" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h4 className="font-semibold text-gray-900 leading-tight">
                            {member.name}
                          </h4>
                          <RoleBadge role={member.position} />
                        </div>
                        <a
                          href={`mailto:${member.email}`}
                          className="text-xs text-blue-700 hover:underline"
                        >
                          {member.email.slice(0, 20)}...
                        </a>
                      </div>
                    </div>

                    <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition">
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={() => handleEditMember(member)}
                        title="Editar"
                      >
                        <Edit className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="icon"
                        className="text-red-600 hover:text-red-700"
                        onClick={() => {
                          setMemberToDelete(member);
                          setShowDeleteConfirm(true);
                        }}
                        title="Excluir"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>

                  <div className="mt-4 grid grid-cols-1 gap-1.5 text-[13px] text-gray-700">
                    {member?.phone && (
                      <div>
                        <span className="text-gray-500">Telefone: </span>
                        {formatPhone(member.phone)}
                      </div>
                    )}

                    {member?.cpf && (
                      <div>
                        <span className="text-gray-500">CPF: </span>
                        {formatCPF(member.cpf)}
                      </div>
                    )}

                    {member?.birthDate && (
                      <div>
                        <span className="text-gray-500">Nascimento: </span>
                        {formatDate(member.birthDate)}
                      </div>
                    )}

                    {member?.cnpj && (
                      <div>
                        <span className="text-gray-500">CNPJ: </span>
                        {formatCNPJ(member.cnpj)}
                      </div>
                    )}

                    {member?.address && (
                      <div className="truncate">
                        <span className="text-gray-500">Endereço: </span>
                        {member.address}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Modal de Adicionar/Editar Membro */}
      {showAddMember && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div
            className="absolute inset-0 bg-black/50"
            onClick={() => {
              setShowAddMember(false);
            }}
          />
          <div className="relative bg-white rounded-xl w-full max-w-xl max-h-[90vh] flex flex-col shadow-2xl">
            {/* Header fixo */}
            <div className="p-5 border-b">
              <h3 className="text-lg font-semibold">
                {selectedMember ? "Editar Membro" : "Adicionar Membro"}
              </h3>
              <p className="text-sm text-gray-500 mt-1">
                Campos com <span className="text-red-500">*</span> são
                obrigatórios.
              </p>
            </div>

            {/* Body rolável */}
            <div className="p-5 overflow-y-auto">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="sm:col-span-2">
                  <Label>
                    Nome <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    value={memberName}
                    onChange={(e) => setMemberName(e.target.value)}
                    placeholder="Nome completo"
                  />
                </div>

                <div className="sm:col-span-2">
                  <Label>
                    Email <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    type="email"
                    value={memberEmail}
                    onChange={(e) => setMemberEmail(e.target.value)}
                    placeholder="email@exemplo.com"
                  />
                </div>

                <div>
                  <Label>
                    Cargo <span className="text-red-500">*</span>
                  </Label>
                  <div>
                    <Select
                      value={memberRole}
                      onValueChange={setMemberRole}
                      disabled={allowedRoles.length === 1 && !selectedMember}
                      // se só há "Consultor" e é criação, travamos o select
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione o cargo" />
                      </SelectTrigger>
                      <SelectContent>
                        {allowedRoles.map((r) => (
                          <SelectItem key={r} value={r}>
                            {r}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {allowedRoles.length === 1 && !selectedMember && (
                      <p className="mt-1 text-xs text-gray-500">
                        Seu perfil permite criar apenas{" "}
                        <strong>Consultor</strong>.
                      </p>
                    )}
                  </div>
                </div>

                <div>
                  <Label>
                    CPF <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    inputMode="numeric"
                    maxLength={14}
                    value={memberCPF}
                    onChange={(e) => setMemberCPF(maskCPF(e.target.value))}
                    placeholder="000.000.000-00"
                  />
                </div>

                <div>
                  <Label>
                    Telefone <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    inputMode="numeric"
                    maxLength={16}
                    value={memberPhone}
                    onChange={(e) => setMemberPhone(maskPhone(e.target.value))}
                    placeholder="(11) 9 9999-9999"
                  />
                </div>

                <div>
                  <Label>Data de Nascimento</Label>
                  <Input
                    type="date"
                    value={memberBirthDate}
                    onChange={(e) => setMemberBirthDate(e.target.value)}
                  />
                </div>

                <div>
                  <Label>CNPJ</Label>
                  <Input
                    inputMode="numeric"
                    value={memberCNPJ}
                    onChange={(e) => setMemberCNPJ(e.target.value)}
                    placeholder="Opcional"
                  />
                </div>

                <div className="sm:col-span-2">
                  <Label>Endereço</Label>
                  <Input
                    value={memberAddress}
                    onChange={(e) => setMemberAddress(e.target.value)}
                    placeholder="Rua, número, bairro, cidade/UF"
                  />
                </div>

                {!selectedMember && (
                  <>
                    <div>
                      <Label>
                        Senha <span className="text-red-500">*</span>
                      </Label>
                      <Input
                        type="password"
                        value={memberPassword}
                        onChange={(e) => setMemberPassword(e.target.value)}
                        placeholder="Digite a senha"
                      />
                    </div>
                    <div>
                      <Label>
                        Confirmar Senha <span className="text-red-500">*</span>
                      </Label>
                      <Input
                        type="password"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        placeholder="Confirme a senha"
                      />
                    </div>
                  </>
                )}
              </div>
            </div>

            {/* Footer fixo */}
            <div className="p-5 border-t flex gap-2 justify-end">
              <Button
                variant="outline"
                onClick={() => {
                  setShowAddMember(false);
                  clearForm();
                }}
              >
                Cancelar
              </Button>
              <Button
                onClick={handleAddNewMember}
                disabled={loading}
                className="bg-blue-600 hover:bg-blue-700"
              >
                {loading
                  ? "Salvando..."
                  : selectedMember
                  ? "Atualizar"
                  : "Adicionar"}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Confirmação de Exclusão */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div
            className="absolute inset-0 bg-black/50"
            onClick={() => setShowDeleteConfirm(false)}
          />
          <div className="relative bg-white rounded-xl w-full max-w-md max-h-[90vh] shadow-2xl p-6">
            <h3 className="text-lg font-semibold mb-3">Confirmar Exclusão</h3>
            <p className="text-gray-600 mb-6">
              Tem certeza que deseja excluir o membro "{memberToDelete?.name}"?
              Esta ação não pode ser desfeita.
            </p>
            <div className="flex space-x-2 justify-end">
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
    </TabsContent>
  );
}
