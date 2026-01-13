"use client";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { TabsContent } from "@/components/ui/tabs";
import {
  Plus,
  Search,
  UserPlus,
  UserX,
  Users,
  Mail,
  Building,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import * as React from "react";

// ======================================================
//  EquipeTabs — cabeçalho do usuário + cards de MANAGER
//  Cada card de manager agora mostra "Informações Pessoais"
//  e "Estatísticas" (usando /api/account/overview?userId=...)
// ======================================================

export function EquipeTabs({ user }: { user: any }) {
  // ======== Estados e lógica original ========
  const [teams, setTeams] = React.useState<any[]>([]);
  const [teamMembers, setTeamMembers] = React.useState<any[]>([]);
  const [showCreateTeam, setShowCreateTeam] = React.useState(false);
  const [newTeamName, setNewTeamName] = React.useState("");
  const [newTeamManager, setNewTeamManager] = React.useState("");
  const [showAddConsultant, setShowAddConsultant] = React.useState(false);
  const [selectedTeam, setSelectedTeam] = React.useState<any>(null);
  const [selectedConsultants, setSelectedConsultants] = React.useState<
    string[]
  >([]);
  const [consultantSearch, setConsultantSearch] = React.useState("");
  const [showCreateConsultant, setShowCreateConsultant] = React.useState(false);

  // Estados para criação de consultor
  const [newConsultantName, setNewConsultantName] = React.useState("");
  const [newConsultantEmail, setNewConsultantEmail] = React.useState("");
  const [newConsultantPassword, setNewConsultantPassword] = React.useState("");
  const [newConsultantConfirmPassword, setNewConsultantConfirmPassword] =
    React.useState("");
  const [newConsultantCPF, setNewConsultantCPF] = React.useState("");
  const [newConsultantPhone, setNewConsultantPhone] = React.useState("");
  const [newConsultantBirthDate, setNewConsultantBirthDate] =
    React.useState("");
  const [newConsultantCNPJ, setNewConsultantCNPJ] = React.useState("");
  const [newConsultantAddress, setNewConsultantAddress] = React.useState("");
  const [creatingConsultant, setCreatingConsultant] = React.useState(false);

  const [showRemoveConfirm, setShowRemoveConfirm] = React.useState(false);
  const [consultantToRemove, setConsultantToRemove] = React.useState<any>(null);
  const [teamFromRemove, setTeamFromRemove] = React.useState<any>(null);
  const [search, setSearch] = React.useState("");

  // ======== NOVO: resumo do usuário logado e de cada manager ========
  const [summary, setSummary] = React.useState<any>(null);
  const [mgrSummaries, setMgrSummaries] = React.useState<Record<string, any>>(
    {}
  );

  React.useEffect(() => {
    fetchMembers();
    fetchTeams();
    fetchSummary();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function fetchMembers() {
    const res = await fetch("/api/members");
    const data = await res.json();
    setTeamMembers(data);
  }
  async function fetchTeams() {
    const res = await fetch(`/api/teams/by-user?userId=${user.id}`);
    const data = await res.json();
    setTeams(data);
  }
  async function fetchSummary() {
    try {
      const res = await fetch(`/api/account/overview?userId=${user.id}`);
      if (!res.ok) return;
      const data = await res.json();
      setSummary(data);
    } catch (e) {
      console.error("Erro ao carregar overview:", e);
    }
  }

  function handleAddConsultantToTeam(team: any) {
    setSelectedTeam(team);
    setSelectedConsultants([]);
    setConsultantSearch("");
    setShowAddConsultant(true);
  }
  async function addConsultantsToTeam() {
    for (const consultantId of selectedConsultants) {
      await fetch("/api/teams/assign", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ consultantId, teamId: selectedTeam.id }),
      });
    }
    setShowAddConsultant(false);
    setSelectedTeam(null);
    setSelectedConsultants([]);
    fetchMembers();
    fetchTeams();
  }
  function openRemoveConfirm(consultant: any, team: any) {
    setConsultantToRemove(consultant);
    setTeamFromRemove(team);
    setShowRemoveConfirm(true);
  }

  async function removeConsultantFromTeam() {
    if (!consultantToRemove) return;

    try {
      const res = await fetch("/api/teams/assign", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          consultantId: consultantToRemove.id,
          teamId: null,
        }),
      });

      if (res.ok) {
        await fetchMembers();
        await fetchTeams();
        setShowRemoveConfirm(false);
        setConsultantToRemove(null);
        setTeamFromRemove(null);
        alert("Consultor removido da equipe com sucesso!");
      } else {
        const error = await res.text();
        alert(`Erro ao remover consultor: ${error}`);
      }
    } catch (error) {
      console.error("Erro ao remover consultor:", error);
      alert("Erro ao remover consultor. Tente novamente.");
    }
  }

  // ======== Helpers / filtros / agrupamentos ========
  const initials = (name: string) =>
    name
      ? name
          .split(" ")
          .map((w) => w[0])
          .join("")
          .slice(0, 2)
          .toUpperCase()
      : "";

  const titleCase = (s?: string | null) => {
    const txt = (s || "").toString();
    if (!txt) return "";
    const low = txt.toLowerCase();
    return low.charAt(0).toUpperCase() + low.slice(1);
  };

  const filteredTeams = React.useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return teams;
    return teams.filter((t) => {
      const name = (t.name || "").toLowerCase();
      const managerName = (t.manager?.name || "").toLowerCase();
      return name.includes(q) || managerName.includes(q);
    });
  }, [teams, search]);

  const dedupedTeams = React.useMemo(() => {
    const seen = new Set<string>();
    return (filteredTeams || []).filter((t: any) => {
      if (!t?.id) return false;
      if (seen.has(t.id)) return false;
      seen.add(t.id);
      return true;
    });
  }, [filteredTeams]);

  const groupedByManager = React.useMemo(() => {
    const map = new Map<
      string,
      { manager: any; teams: any[]; membersCount: number }
    >();

    for (const team of dedupedTeams) {
      const m = team.manager;
      const key = m?.id || "__sem_gerente__";
      if (!map.has(key)) {
        map.set(key, { manager: m, teams: [], membersCount: 0 });
      }
      const bucket = map.get(key)!;
      bucket.teams.push(team);
      bucket.membersCount += team.members?.length || 0;
    }

    const list = Array.from(map.values()).map((g) => ({
      ...g,
      teams: g.teams.sort((a: any, b: any) =>
        (a.name || "").localeCompare(b.name || "")
      ),
    }));

    return list.sort((a, b) =>
      (a.manager?.name || "Sem gerente").localeCompare(
        b.manager?.name || "Sem gerente"
      )
    );
  }, [dedupedTeams]);

  // ======== Buscar overview de cada manager (após agrupar) ========
  React.useEffect(() => {
    const ids = Array.from(
      new Set(
        groupedByManager.map((g) => g.manager?.id).filter(Boolean) as string[]
      )
    ).filter((id) => !mgrSummaries[id]); // só busca os que faltam

    if (ids.length === 0) return;

    (async () => {
      const pairs = await Promise.all(
        ids.map(async (id) => {
          try {
            const r = await fetch(`/api/account/overview?userId=${id}`);
            if (!r.ok) {
              console.log(`API failed for manager ${id}:`, r.status);
              return [id, null] as const;
            }
            const data = await r.json();
            console.log(`API response for manager ${id}:`, data);
            return [id, data] as const;
          } catch (error) {
            console.log(`API error for manager ${id}:`, error);
            return [id, null] as const;
          }
        })
      );
      setMgrSummaries((prev) => {
        const next = { ...prev };
        for (const [id, data] of pairs) next[id] = data;
        return next;
      });
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [groupedByManager]);

  // ======== Métricas locais (fallback do viewer) ========
  const myRole = (user?.position || "").toLowerCase();
  const managersAll = React.useMemo(
    () =>
      teamMembers.filter(
        (m: any) => (m.position || "").toLowerCase() === "gerente"
      ),
    [teamMembers]
  );
  const consultantsAll = React.useMemo(
    () =>
      teamMembers.filter(
        (m: any) => (m.position || "").toLowerCase() === "consultor"
      ),
    [teamMembers]
  );

  const directorScope = React.useMemo(() => {
    if (myRole !== "diretor") return null;
    const myManagers = managersAll.filter((m: any) => m.directorId === user.id);
    const myTeams = dedupedTeams.filter(
      (t: any) => t.manager?.directorId === user.id || t.managerId === user.id
    );
    const consultantIds = new Set<string>();
    for (const t of myTeams)
      for (const m of t.members || []) consultantIds.add(m.id);
    return {
      managers: myManagers.length,
      consultants: consultantIds.size,
      users: myManagers.length + consultantIds.size,
    };
  }, [myRole, managersAll, dedupedTeams, user?.id]);

  const managerScope = React.useMemo(() => {
    if (myRole !== "gerente") return null;
    const myTeams = dedupedTeams.filter((t: any) => t.managerId === user.id);
    const consultantIds = new Set<string>();
    for (const t of myTeams)
      for (const m of t.members || []) consultantIds.add(m.id);
    return {
      managers: 1,
      consultants: consultantIds.size,
      users: 1 + consultantIds.size,
    };
  }, [myRole, dedupedTeams, user?.id]);

  const adminScope = React.useMemo(() => {
    if (myRole !== "administrador") return null;
    // Para admin, contar apenas consultores que estão em equipes
    const consultantsInTeams = new Set<string>();
    for (const team of dedupedTeams) {
      for (const member of team.members || []) {
        consultantsInTeams.add(member.id);
      }
    }
    return {
      managers: managersAll.length,
      consultants: consultantsInTeams.size,
      users: managersAll.length + consultantsInTeams.size,
    };
  }, [myRole, managersAll, dedupedTeams]);

  // ======== Hierarquia: quem pode gerenciar o time ========
  const viewerRole = (summary?.position || user?.role || "").toLowerCase();

  const myDirectorId = React.useMemo(() => {
    if (viewerRole !== "gerente") return null;
    const t = teams.find((t: any) => t.managerId === user.id);
    return t?.manager?.directorId ?? null;
  }, [viewerRole, teams, user?.id]);

  function canManageTeam(team: any) {
    if (viewerRole === "administrador") return true;
    if (viewerRole === "diretor") return team?.manager?.directorId === user.id;
    if (viewerRole === "gerente") return team?.managerId === user.id;
    return false;
  }

  function getConsultantsCandidates(team?: any) {
    const candidates = teamMembers.filter((m: any) => {
      const pos = (m.position || "").toLowerCase();
      if (pos !== "consultor" || m.teamId) return false;

      if (viewerRole === "administrador") return true;
      if (viewerRole === "diretor") return m.directorId === user.id;
      if (viewerRole === "gerente") {
        const dirId = myDirectorId ?? team?.manager?.directorId;
        return dirId ? m.directorId === dirId : false;
      }
      return false;
    });

    // Filtrar por busca
    if (consultantSearch.trim()) {
      const searchTerm = consultantSearch.toLowerCase();
      return candidates.filter(
        (m: any) =>
          m.name.toLowerCase().includes(searchTerm) ||
          m.email.toLowerCase().includes(searchTerm)
      );
    }

    return candidates;
  }

  // ======== UI helpers ========
  const roleLabel = (summary?.position || user?.role || "Usuário")
    .toString()
    .toLowerCase()
    .replace(/^./, (c: string) => c.toUpperCase());

  const formatDate = (d?: string | null) =>
    d ? new Date(d).toLocaleDateString("pt-BR") : "—";

  // Funções auxiliares para máscaras e validações
  const maskCPF = (value: string) => {
    return value
      .replace(/\D/g, "")
      .replace(/(\d{3})(\d)/, "$1.$2")
      .replace(/(\d{3})(\d)/, "$1.$2")
      .replace(/(\d{3})(\d{1,2})/, "$1-$2")
      .replace(/(-\d{2})\d+?$/, "$1");
  };

  const maskPhone = (value: string) => {
    return value
      .replace(/\D/g, "")
      .replace(/(\d{2})(\d)/, "($1) $2")
      .replace(/(\d{4})(\d)/, "$1-$2")
      .replace(/(\d{4})-(\d)(\d{4})/, "$1$2-$3")
      .replace(/(-\d{4})\d+?$/, "$1");
  };

  const onlyDigits = (s: string) => String(s || "").replace(/\D/g, "");

  const cpfIsValid = (cpf: string) => {
    const digits = onlyDigits(cpf);
    if (digits.length !== 11) return false;
    if (/^(\d)\1{10}$/.test(digits)) return false;

    let sum = 0;
    for (let i = 0; i < 9; i++) {
      sum += parseInt(digits[i]) * (10 - i);
    }
    let remainder = (sum * 10) % 11;
    if (remainder === 10 || remainder === 11) remainder = 0;
    if (remainder !== parseInt(digits[9])) return false;

    sum = 0;
    for (let i = 0; i < 10; i++) {
      sum += parseInt(digits[i]) * (11 - i);
    }
    remainder = (sum * 10) % 11;
    if (remainder === 10 || remainder === 11) remainder = 0;
    return remainder === parseInt(digits[10]);
  };

  const clearConsultantForm = () => {
    setNewConsultantName("");
    setNewConsultantEmail("");
    setNewConsultantPassword("");
    setNewConsultantConfirmPassword("");
    setNewConsultantCPF("");
    setNewConsultantPhone("");
    setNewConsultantBirthDate("");
    setNewConsultantCNPJ("");
    setNewConsultantAddress("");
  };

  async function createConsultant() {
    if (!newConsultantName || !newConsultantEmail || !newConsultantPassword) {
      alert("Preencha nome, e-mail e senha.");
      return;
    }

    if (!newConsultantCPF || !cpfIsValid(newConsultantCPF)) {
      alert("CPF obrigatório e válido.");
      return;
    }

    if (!newConsultantPhone) {
      alert("Telefone é obrigatório.");
      return;
    }

    if (newConsultantPassword !== newConsultantConfirmPassword) {
      alert("As senhas não coincidem.");
      return;
    }

    setCreatingConsultant(true);
    try {
      const payload = {
        name: newConsultantName,
        email: newConsultantEmail,
        role: "Consultor",
        password: newConsultantPassword,
        cpf: onlyDigits(newConsultantCPF),
        phone: onlyDigits(newConsultantPhone),
        cnpj: onlyDigits(newConsultantCNPJ),
        address: newConsultantAddress || undefined,
        birthDate: newConsultantBirthDate || undefined,
        creatorId: user.id,
        directorId: user.id, // Consultor criado pelo diretor/gerente
      };

      const res = await fetch("/api/members/by-user", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        await fetchMembers();
        clearConsultantForm();
        setShowCreateConsultant(false);
        alert("Consultor criado com sucesso!");
      } else {
        const error = await res.json();
        alert(error.error || "Erro ao criar consultor");
      }
    } catch (error) {
      alert("Erro ao criar consultor");
    } finally {
      setCreatingConsultant(false);
    }
  }

  const stats = summary?.stats || {
    managers:
      adminScope?.managers ??
      directorScope?.managers ??
      managerScope?.managers ??
      0,
    consultants:
      adminScope?.consultants ??
      directorScope?.consultants ??
      managerScope?.consultants ??
      0,
    users:
      adminScope?.users ??
      directorScope?.users ??
      managerScope?.users ??
      teamMembers.length,
    teams: groupedByManager.reduce((a, g) => a + g.teams.length, 0),
  };

  // Chips de membro
  const memberPillEditable = (member: any, team: any) => (
    <div
      key={member.id}
      className="group flex items-center gap-2 rounded-full border bg-white/70 px-3 py-1 shadow-sm hover:shadow transition"
    >
      <Avatar className="h-6 w-6">
        <AvatarImage src="" />
        <AvatarFallback className="text-[10px]">
          {initials(member.name)}
        </AvatarFallback>
      </Avatar>
      <span className="text-sm text-gray-700">{member.name}</span>
      <Button
        size="icon"
        variant="ghost"
        className="h-5 w-5 ml-1 opacity-60 hover:opacity-100"
        onClick={() => openRemoveConfirm(member, team)}
      >
        <UserX className="h-3 w-3" />
      </Button>
    </div>
  );

  const memberPillReadOnly = (member: any) => (
    <div
      key={member.id}
      className="flex items-center gap-2 rounded-full border bg-white/70 px-3 py-1 shadow-sm"
    >
      <Avatar className="h-6 w-6">
        <AvatarImage src="" />
        <AvatarFallback className="text-[10px]">
          {initials(member.name)}
        </AvatarFallback>
      </Avatar>
      <span className="text-sm text-gray-700">{member.name}</span>
    </div>
  );

  // ======== UI ========
  return (
    <>
      {/* ===== Cabeçalho do Usuário (Informações + Estatísticas) ===== */}
      <Card className="overflow-hidden border shadow-sm">
        <CardHeader className="bg-blue-50/70">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Avatar className="h-12 w-12">
                <AvatarImage src={summary?.avatarUrl || ""} />
                <AvatarFallback>{initials(user?.name || "U")}</AvatarFallback>
              </Avatar>
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-xl font-semibold">{user?.name}</h2>
                  <Badge
                    variant="secondary"
                    className="bg-blue-100 text-blue-800"
                  >
                    {roleLabel}
                  </Badge>
                </div>
                <div className="text-sm text-gray-500">
                  Desde {formatDate(summary?.since)}
                </div>
              </div>
            </div>

            <div className="flex items-center gap-10 pr-2">
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-700">
                  {stats.managers}
                </div>
                <div className="text-xs text-gray-600">Gerentes</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-green-700">
                  {stats.consultants}
                </div>
                <div className="text-xs text-gray-600">Consultores</div>
              </div>
            </div>
          </div>
        </CardHeader>

        <CardContent className="p-6">
          <div className="grid gap-6 md:grid-cols-2">
            {/* Informações Pessoais */}
            <div>
              <h3 className="mb-4 flex items-center text-lg font-semibold">
                <Users className="mr-2 h-5 w-5 text-blue-600" />
                Informações Pessoais
              </h3>
              <div className="space-y-3">
                <div className="flex items-center gap-3 text-gray-700">
                  <Mail className="h-4 w-4 text-gray-400" />
                  {user?.email}
                </div>
                <div className="flex items-center gap-3 text-gray-700">
                  <Building className="h-4 w-4 text-gray-400" />
                  {roleLabel}
                </div>
              </div>
            </div>

            {/* Estatísticas */}
            <div>
              <h3 className="mb-4 flex items-center text-lg font-semibold">
                <Users className="mr-2 h-5 w-5 text-green-600" />
                Estatísticas
              </h3>
              <div className="grid grid-cols-2 gap-4">
                <MiniStat
                  color="blue"
                  label="Gerentes"
                  value={stats.managers}
                />
                <MiniStat
                  color="green"
                  label="Consultores"
                  value={stats.consultants}
                />
                <MiniStat
                  color="violet"
                  label="Total de Membros"
                  value={stats.users}
                />
                <MiniStat color="orange" label="Equipes" value={stats.teams} />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* ===== Busca ===== */}
      <div className="flex items-center justify-between mt-6">
        <div className="relative w-full max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            type="text"
            placeholder="Buscar por equipe ou usuário..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
      </div>

      {/* ===== ABA: Equipes por Usuário ===== */}
      <TabsContent value="teams" className="space-y-6 mt-6">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-2xl font-bold text-gray-900">
              Equipes por Usuário
            </h3>
            <p className="text-sm text-gray-600">
              Cada bloco representa um usuário responsável (Gerente) e as
              equipes sob sua gestão.
            </p>
          </div>
          {(viewerRole === "administrador" || viewerRole === "diretor") && (
            <Button onClick={() => setShowCreateTeam(true)} className="shadow">
              <Plus className="mr-2 h-4 w-4" />
              Criar Equipe
            </Button>
          )}
        </div>

        <div className="grid gap-6">
          {groupedByManager.map((group) => {
            const managerId = group.manager?.id as string | undefined;
            const msum = managerId ? mgrSummaries[managerId] : null;

            // Fallbacks locais caso overview do manager ainda não tenha carregado
            const localSince =
              group.teams.reduce<Date | null>((acc, t) => {
                const d = t.createdAt ? new Date(t.createdAt) : null;
                return !acc || (d && d < acc) ? d : acc;
              }, null) ?? null;

            const managerRole =
              titleCase(group.manager?.position) || "Sem função";
            const managerStats = msum?.stats
              ? {
                  managers: msum.stats.managers,
                  consultants:
                    msum.stats.consultants > 0
                      ? msum.stats.consultants
                      : group.membersCount,
                   users: msum.stats.managers + group.membersCount,
                  teams: msum.stats.teams,
                }
              : {
                  managers: 1,
                  consultants: group.membersCount,
                  users: 1 + group.membersCount,
                  teams: group.teams.length,
                };
            console.log(
              "Manager:",
              group.manager?.name,
              "msum:",
              msum,
              "group.membersCount:",
              group.membersCount,
              "managerStats:",
              managerStats
            );

            return (
              <Card
                key={managerId || "sem-gerente"}
                className="overflow-hidden border shadow-sm"
              >
                <CardHeader className="bg-gradient-to-r from-blue-50 to-indigo-50 border-b">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Avatar className="h-10 w-10">
                        <AvatarImage src={group.manager?.avatarUrl || ""} />
                        <AvatarFallback>
                          {initials(group.manager?.name || "SG")}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <CardTitle className="text-xl text-gray-900">
                          {group.manager?.name || "Sem gerente"}
                        </CardTitle>
                        <CardDescription className="mt-1 flex items-center gap-2">
                          <Badge
                            variant="secondary"
                            className="bg-blue-100 text-blue-800"
                          >
                            {managerRole}
                          </Badge>
                          {group.manager?.email && (
                            <span className="text-xs text-gray-600">
                              {group.manager.email}
                            </span>
                          )}
                        </CardDescription>
                        <div className="text-xs text-gray-500 mt-1">
                          Desde{" "}
                          {formatDate(
                            msum?.since ?? localSince?.toISOString() ?? null
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-6">
                      <MetricSmall label="Equipes" value={managerStats.teams} />
                      <MetricSmall
                        label="Consultores"
                        value={managerStats.consultants}
                      />
                    </div>
                  </div>
                </CardHeader>

                {/* === NOVO: Informações do manager (como "Minha Conta") === */}
                <CardContent className="px-6 pt-6">
                  <div className="grid gap-6 md:grid-cols-2">
                    {/* Informações Pessoais do Manager */}
                    <div>
                      <h4 className="mb-3 flex items-center text-base font-semibold">
                        <Users className="mr-2 h-4 w-4 text-blue-600" />
                        Informações Pessoais
                      </h4>
                      <div className="space-y-2">
                        <div className="flex items-center gap-3 text-gray-700">
                          <Mail className="h-4 w-4 text-gray-400" />
                          {group.manager?.email || "—"}
                        </div>
                        <div className="flex items-center gap-3 text-gray-700">
                          <Building className="h-4 w-4 text-gray-400" />
                          {managerRole}
                        </div>
                      </div>
                    </div>

                    {/* Estatísticas do Manager */}
                    <div>
                      <h4 className="mb-3 flex items-center text-base font-semibold">
                        <Users className="mr-2 h-4 w-4 text-green-600" />
                        Estatísticas
                      </h4>
                      <div className="grid grid-cols-2 gap-3">
                        <MiniStat
                          color="blue"
                          label="Gerentes"
                          value={managerStats.managers}
                        />
                        <MiniStat
                          color="green"
                          label="Consultores"
                          value={managerStats.consultants}
                        />
                        <MiniStat
                          color="violet"
                          label="Total de Membros"
                          value={managerStats.users}
                        />
                        <MiniStat
                          color="orange"
                          label="Equipes"
                          value={managerStats.teams}
                        />
                      </div>
                    </div>
                  </div>
                </CardContent>

                {/* Equipes do manager */}
                <CardContent className="p-6 pt-4">
                  <div className="grid gap-4">
                    {group.teams.map((team) => {
                      const canManage = canManageTeam(team);
                      const candidates = getConsultantsCandidates(team);
                      return (
                        <div
                          key={team.id}
                          className="rounded-lg border bg-white"
                        >
                          <div className="flex items-center justify-between p-4">
                            <div className="flex items-center gap-3">
                              <div className="h-9 w-9 grid place-items-center rounded-lg bg-slate-50">
                                <Users className="h-4 w-4 text-blue-700" />
                              </div>
                              <div>
                                <div className="font-semibold text-gray-900">
                                  {team.name}
                                </div>
                                <div className="text-xs text-gray-600">
                                  {team.members?.length || 0} consultor(es)
                                </div>
                              </div>
                            </div>

                            {canManage && (
                              <Button
                                size="sm"
                                onClick={() => handleAddConsultantToTeam(team)}
                                disabled={candidates.length === 0}
                                className="shadow"
                              >
                                <UserPlus className="mr-2 h-4 w-4" />
                                Adicionar Consultor
                              </Button>
                            )}
                          </div>

                          {/* Lista de consultores da equipe */}
                          <div className="px-4 pb-4">
                            {team.members && team.members.length > 0 ? (
                              <div className="flex flex-wrap gap-2">
                                {team.members.map((member: any) =>
                                  canManage
                                    ? memberPillEditable(member, team)
                                    : memberPillReadOnly(member)
                                )}
                              </div>
                            ) : (
                              <span className="text-sm text-muted-foreground">
                                Nenhum consultor alocado
                              </span>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Consultores sem Equipe (escopo do viewer) */}
        {getConsultantsCandidates().length > 0 && (
          <Card className="overflow-hidden border shadow-sm">
            <CardHeader className="bg-gradient-to-r from-amber-50 to-orange-50 border-b">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-lg">
                    Consultores sem Equipe
                  </CardTitle>
                  <CardDescription>
                    {getConsultantsCandidates().length} consultor(es) aguardando
                    alocação
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-6">
              <div className="space-y-2">
                {getConsultantsCandidates().map((consultant) => (
                  <div
                    key={consultant.id}
                    className="flex items-center justify-between rounded-md border bg-gray-50 px-3 py-2"
                  >
                    <div className="flex items-center gap-2">
                      <Avatar className="h-7 w-7">
                        <AvatarImage src="" />
                        <AvatarFallback className="text-[10px]">
                          {initials(consultant.name)}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <span className="font-medium">{consultant.name}</span>
                        <span className="ml-2 text-sm text-muted-foreground">
                          ({consultant.email})
                        </span>
                      </div>
                    </div>
                    <Badge variant="outline">Sem equipe</Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </TabsContent>

      {/* ===== ABA: Equipes dos Diretores ===== */}
      <TabsContent value="director-teams" className="space-y-6 mt-6">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-2xl font-bold text-gray-900">
              Equipes dos Diretores
            </h3>
            <p className="text-sm text-gray-600">
              Visualize e crie equipes vinculadas a diretores.
            </p>
          </div>
          {(viewerRole === "diretor" || viewerRole === "administrador") && (
            <Button onClick={() => setShowCreateTeam(true)} className="shadow">
              <Plus className="mr-2 h-4 w-4" />
              Criar Equipe
            </Button>
          )}
        </div>

        {viewerRole === "diretor" || viewerRole === "administrador" ? (
          <>
            {teams.filter(
              (team) =>
                team.manager?.directorId ===
                (viewerRole === "administrador" ? undefined : user.id)
            ).length === 0 && (
              <div className="text-muted-foreground">
                Nenhuma equipe vinculada a você ainda.
              </div>
            )}

            {teams
              .filter(
                (team) =>
                  team.manager?.directorId ===
                  (viewerRole === "administrador" ? undefined : user.id)
              )
              .map((team) => (
                <Card
                  key={team.id}
                  className="overflow-hidden border shadow-sm"
                >
                  <CardHeader className="bg-gradient-to-r from-purple-50 to-fuchsia-50 border-b">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 grid place-items-center rounded-xl bg-white shadow-sm">
                          <Users className="h-5 w-5 text-purple-700" />
                        </div>
                        <div>
                          <CardTitle className="text-xl text-gray-900">
                            {team.name}
                          </CardTitle>
                          <CardDescription className="mt-1">
                            Gerente: {team.manager?.name || "Não definido"}
                          </CardDescription>
                        </div>
                      </div>

                      <Button size="sm" onClick={() => {}} className="shadow">
                        <Plus className="mr-2 h-4 w-4" />
                        Adicionar Gerente
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent className="p-6">
                    <div className="space-y-3">
                      <h4 className="font-semibold text-gray-900">
                        Consultores
                      </h4>
                      {team.members && team.members.length > 0 ? (
                        <div className="flex flex-wrap gap-2">
                          {team.members.map((member: any) => (
                            <span
                              key={member.id}
                              className="rounded-full bg-white/70 px-3 py-1 text-sm shadow-sm"
                            >
                              {member.name}
                            </span>
                          ))}
                        </div>
                      ) : (
                        <span className="text-sm text-muted-foreground">
                          Nenhum consultor alocado
                        </span>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
          </>
        ) : (
          <div className="text-muted-foreground">
            Apenas diretores e administradores podem acessar esta aba.
          </div>
        )}
      </TabsContent>

      {/* === Modal: Criar Equipe === */}
      <Dialog open={showCreateTeam} onOpenChange={setShowCreateTeam}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Criar Nova Equipe</DialogTitle>
            <DialogDescription>
              Informe o nome da equipe, selecione o gerente responsável e o
              diretor responsável.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="team-name">Nome da Equipe</Label>
              <Input
                id="team-name"
                placeholder="Ex: Equipe Comercial Norte"
                value={newTeamName}
                onChange={(e) => setNewTeamName(e.target.value)}
              />
            </div>
            {viewerRole === "administrador" ? (
              <>
                <div className="space-y-2">
                  <Label htmlFor="team-manager">Gerente Responsável</Label>
                  <Select
                    value={newTeamManager}
                    onValueChange={setNewTeamManager}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione o gerente" />
                    </SelectTrigger>
                    <SelectContent>
                      {teamMembers
                        .filter(
                          (m) => (m.position || "").toLowerCase() === "gerente"
                        )
                        .map((gerente) => (
                          <SelectItem key={gerente.id} value={gerente.id}>
                            {gerente.name}
                          </SelectItem>
                        ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="team-director">Diretor Responsável</Label>
                  {/* mantém reaproveitamento do valor conforme código original */}
                  <Select
                    value={newTeamManager}
                    onValueChange={setNewTeamManager}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione o diretor" />
                    </SelectTrigger>
                    <SelectContent>
                      {teamMembers
                        .filter(
                          (m) => (m.position || "").toLowerCase() === "diretor"
                        )
                        .map((diretor) => (
                          <SelectItem key={diretor.id} value={diretor.id}>
                            {diretor.name}
                          </SelectItem>
                        ))}
                    </SelectContent>
                  </Select>
                </div>
              </>
            ) : (
              <div className="rounded-md bg-blue-50 p-3">
                <p className="text-sm text-blue-800">
                  A equipe será criada com você como diretor responsável.
                </p>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button
              onClick={async () => {
                let directorId = user.id;
                let managerId;
                if (viewerRole === "administrador") {
                  managerId = newTeamManager;
                  directorId = newTeamManager; // seguindo suposição prévia
                } else {
                  managerId = user.id;
                }
                await fetch("/api/teams", {
                  method: "POST",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({
                    name: newTeamName,
                    managerId,
                    directorId,
                  }),
                });
                setShowCreateTeam(false);
                setNewTeamName("");
                setNewTeamManager("");
                fetchTeams();
              }}
              disabled={
                !newTeamName ||
                (viewerRole === "administrador" && !newTeamManager)
              }
            >
              Criar Equipe
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* === Modal: Adicionar Consultor === */}
      <Dialog open={showAddConsultant} onOpenChange={setShowAddConsultant}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Adicionar Consultor à Equipe</DialogTitle>
            <DialogDescription>
              Selecione os consultores para adicionar à equipe{" "}
              <b>{selectedTeam?.name}</b> ou crie um novo consultor.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6">
            {/* Busca */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Buscar consultores por nome ou email..."
                value={consultantSearch}
                onChange={(e) => setConsultantSearch(e.target.value)}
                className="pl-9"
              />
            </div>

            {/* Botão para criar novo consultor */}
            <div className="flex justify-between items-center">
              <div>
                <h4 className="font-medium text-gray-900">
                  Consultores Disponíveis
                </h4>
                <p className="text-sm text-gray-600">
                  {getConsultantsCandidates(selectedTeam).length} consultor(es)
                  encontrado(s)
                </p>
              </div>
              <Button
                variant="outline"
                onClick={() => setShowCreateConsultant(true)}
                className="flex items-center gap-2"
              >
                <UserPlus className="h-4 w-4" />
                Criar Novo Consultor
              </Button>
            </div>

            {/* Lista de consultores */}
            <div className="max-h-60 overflow-y-auto border rounded-lg">
              {getConsultantsCandidates(selectedTeam).length > 0 ? (
                <div className="space-y-1 p-2">
                  {getConsultantsCandidates(selectedTeam).map((consultant) => (
                    <div
                      key={consultant.id}
                      className="flex items-center space-x-3 p-3 rounded-lg hover:bg-gray-50 transition-colors"
                    >
                      <Checkbox
                        id={consultant.id}
                        checked={selectedConsultants.includes(consultant.id)}
                        onCheckedChange={(checked) => {
                          if (checked) {
                            setSelectedConsultants([
                              ...selectedConsultants,
                              consultant.id,
                            ]);
                          } else {
                            setSelectedConsultants(
                              selectedConsultants.filter(
                                (id) => id !== consultant.id
                              )
                            );
                          }
                        }}
                      />
                      <Avatar className="h-8 w-8">
                        <AvatarImage src="" />
                        <AvatarFallback className="text-xs">
                          {initials(consultant.name)}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <Label
                          htmlFor={consultant.id}
                          className="font-medium cursor-pointer"
                        >
                          {consultant.name}
                        </Label>
                        <p className="text-sm text-gray-600 truncate">
                          {consultant.email}
                        </p>
                      </div>
                      <Badge variant="outline" className="text-xs">
                        Consultor
                      </Badge>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-8 text-center">
                  <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-sm text-gray-600 mb-2">
                    {consultantSearch.trim()
                      ? "Nenhum consultor encontrado com esse filtro"
                      : "Não há consultores disponíveis para alocar"}
                  </p>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setShowCreateConsultant(true)}
                    className="mt-2"
                  >
                    <UserPlus className="h-4 w-4 mr-2" />
                    Criar Novo Consultor
                  </Button>
                </div>
              )}
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setShowAddConsultant(false);
                setConsultantSearch("");
                setSelectedConsultants([]);
              }}
            >
              Cancelar
            </Button>
            <Button
              onClick={addConsultantsToTeam}
              disabled={selectedConsultants.length === 0}
            >
              Adicionar{" "}
              {selectedConsultants.length > 0
                ? `${selectedConsultants.length} `
                : ""}
              à Equipe
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* === Modal: Criar Novo Consultor === */}
      <Dialog
        open={showCreateConsultant}
        onOpenChange={setShowCreateConsultant}
      >
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Criar Novo Consultor</DialogTitle>
            <DialogDescription>
              Preencha os dados do novo consultor. Campos com{" "}
              <span className="text-red-500">*</span> são obrigatórios.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="sm:col-span-2">
                <Label>
                  Nome <span className="text-red-500">*</span>
                </Label>
                <Input
                  value={newConsultantName}
                  onChange={(e) => setNewConsultantName(e.target.value)}
                  placeholder="Nome completo"
                />
              </div>

              <div className="sm:col-span-2">
                <Label>
                  Email <span className="text-red-500">*</span>
                </Label>
                <Input
                  type="email"
                  value={newConsultantEmail}
                  onChange={(e) => setNewConsultantEmail(e.target.value)}
                  placeholder="email@exemplo.com"
                />
              </div>

              <div>
                <Label>
                  CPF <span className="text-red-500">*</span>
                </Label>
                <Input
                  inputMode="numeric"
                  maxLength={14}
                  value={newConsultantCPF}
                  onChange={(e) => setNewConsultantCPF(maskCPF(e.target.value))}
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
                  value={newConsultantPhone}
                  onChange={(e) =>
                    setNewConsultantPhone(maskPhone(e.target.value))
                  }
                  placeholder="(11) 9 9999-9999"
                />
              </div>

              <div>
                <Label>Data de Nascimento</Label>
                <Input
                  type="date"
                  value={newConsultantBirthDate}
                  onChange={(e) => setNewConsultantBirthDate(e.target.value)}
                />
              </div>

              <div>
                <Label>CNPJ</Label>
                <Input
                  inputMode="numeric"
                  value={newConsultantCNPJ}
                  onChange={(e) => setNewConsultantCNPJ(e.target.value)}
                  placeholder="Opcional"
                />
              </div>

              <div className="sm:col-span-2">
                <Label>Endereço</Label>
                <Input
                  value={newConsultantAddress}
                  onChange={(e) => setNewConsultantAddress(e.target.value)}
                  placeholder="Rua, número, bairro, cidade/UF"
                />
              </div>

              <div>
                <Label>
                  Senha <span className="text-red-500">*</span>
                </Label>
                <Input
                  type="password"
                  value={newConsultantPassword}
                  onChange={(e) => setNewConsultantPassword(e.target.value)}
                  placeholder="Digite a senha"
                />
              </div>
              <div>
                <Label>
                  Confirmar Senha <span className="text-red-500">*</span>
                </Label>
                <Input
                  type="password"
                  value={newConsultantConfirmPassword}
                  onChange={(e) =>
                    setNewConsultantConfirmPassword(e.target.value)
                  }
                  placeholder="Confirme a senha"
                />
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setShowCreateConsultant(false);
                clearConsultantForm();
              }}
            >
              Cancelar
            </Button>
            <Button onClick={createConsultant} disabled={creatingConsultant}>
              {creatingConsultant ? "Criando..." : "Criar Consultor"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* === Modal: Confirmar Remoção === */}
      <Dialog open={showRemoveConfirm} onOpenChange={setShowRemoveConfirm}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirmar Remoção</DialogTitle>
            <DialogDescription>
              Tem certeza que deseja remover{" "}
              <strong>{consultantToRemove?.name}</strong> da equipe{" "}
              <strong>{teamFromRemove?.name}</strong>?
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="rounded-lg border border-yellow-200 bg-yellow-50 p-4">
              <div className="flex items-start gap-3">
                <div className="flex-shrink-0">
                  <UserX className="h-5 w-5 text-yellow-700" />
                </div>
                <div>
                  <h4 className="text-sm font-medium text-yellow-900">
                    Atenção
                  </h4>
                  <p className="mt-1 text-sm text-yellow-800">
                    Esta ação irá remover o consultor da equipe. O consultor
                    ficará disponível para ser adicionado a outra equipe.
                  </p>
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm">
                <span className="font-medium">Consultor:</span>
                <span className="text-gray-700">
                  {consultantToRemove?.name} ({consultantToRemove?.email})
                </span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <span className="font-medium">Equipe:</span>
                <span className="text-gray-700">{teamFromRemove?.name}</span>
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setShowRemoveConfirm(false);
                setConsultantToRemove(null);
                setTeamFromRemove(null);
              }}
            >
              Cancelar
            </Button>
            <Button variant="destructive" onClick={removeConsultantFromTeam}>
              Remover Consultor
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

// ================== Pequenos componentes de UI ==================
function Metric({
  label,
  value,
  subtle,
}: {
  label: string;
  value: number | string;
  subtle?: string;
}) {
  return (
    <div className="text-right">
      <div className="text-2xl font-bold text-slate-900">{value}</div>
      <div className="text-xs text-slate-600">{label}</div>
      {subtle && <div className="text-[11px] text-slate-400">{subtle}</div>}
    </div>
  );
}

function MetricSmall({
  label,
  value,
}: {
  label: string;
  value: number | string;
}) {
  return (
    <div className="text-center">
      <div className="text-xl font-bold text-blue-700">{value}</div>
      <div className="text-xs text-gray-600">{label}</div>
    </div>
  );
}

/* MiniStat: cards coloridos das Estatísticas */
function MiniStat({
  label,
  value,
  color = "blue",
}: {
  label: string;
  value: number | string;
  color?: "blue" | "green" | "violet" | "orange";
}) {
  const palette: Record<string, { bg: string; text: string; num: string }> = {
    blue: { bg: "bg-blue-50", text: "text-blue-700", num: "text-blue-600" },
    green: { bg: "bg-green-50", text: "text-green-700", num: "text-green-600" },
    violet: {
      bg: "bg-purple-50",
      text: "text-purple-700",
      num: "text-purple-600",
    },
    orange: {
      bg: "bg-orange-50",
      text: "text-orange-700",
      num: "text-orange-600",
    },
  };
  const c = palette[color];
  return (
    <div className={`rounded-lg p-3 ${c.bg}`}>
      <div className={`text-2xl font-bold ${c.num}`}>{value}</div>
      <div className={`text-sm ${c.text}`}>{label}</div>
    </div>
  );
}
