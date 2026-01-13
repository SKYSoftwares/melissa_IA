"use client";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { TabsContent } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Users,
  User,
  Building2,
  Target,
  TrendingUp,
  Plus,
  X,
} from "lucide-react";
import React from "react";

export function MeusGerentesTab({ user }: { user: any }) {
  const [managers, setManagers] = React.useState<any[]>([]);
  const [managerTeams, setManagerTeams] = React.useState<Record<string, any[]>>(
    {}
  );
  const [loading, setLoading] = React.useState(false);

  // Estados para adicionar gerentes
  const [showAddManagerDialog, setShowAddManagerDialog] = React.useState(false);
  const [availableManagers, setAvailableManagers] = React.useState<any[]>([]);
  const [availableDirectors, setAvailableDirectors] = React.useState<any[]>([]);
  const [selectedManagerId, setSelectedManagerId] = React.useState<string>("");
  const [selectedDirectorId, setSelectedDirectorId] =
    React.useState<string>("");
  const [addingManager, setAddingManager] = React.useState(false);

  React.useEffect(() => {
    fetchMyManagers();
  }, []);

  async function fetchMyManagers() {
    setLoading(true);
    try {
      // Buscar gerentes
      const res = await fetch("/api/members");
      if (res.ok) {
        const allMembers = await res.json();

        // Filtrar gerentes baseado no papel do usuário
        let myManagers: any[];
        if (user.role === "administrador") {
          // Administrador vê todos os gerentes
          myManagers = allMembers.filter(
            (member: any) => member.position === "Gerente"
          );
        } else if (user.role === "Diretor") {
          // Diretor vê apenas gerentes sob sua responsabilidade
          myManagers = allMembers.filter(
            (member: any) =>
              member.position === "Gerente" && member.directorId === user.id
          );
        } else {
          // Outros cargos não veem gerentes
          myManagers = [];
        }

        setManagers(myManagers);

        // Buscar equipes para cada gerente e informações do diretor
        const teamsData: Record<string, any[]> = {};
        const managersWithDirector = await Promise.all(
          myManagers.map(async (manager) => {
            const teams = await fetchManagerTeams(manager.id);
            teamsData[manager.id] = teams;

            // Se for administrador, buscar informações do diretor
            if (user.role === "administrador" && manager.directorId) {
              const director = allMembers.find(
                (member: any) => member.id === manager.directorId
              );
              return { ...manager, director };
            }
            return manager;
          })
        );

        setManagers(managersWithDirector);
        setManagerTeams(teamsData);
      }
    } catch (error) {
      console.error("Erro ao buscar gerentes:", error);
    } finally {
      setLoading(false);
    }
  }

  // Buscar equipes de um gerente específico
  async function fetchManagerTeams(managerId: string) {
    try {
      const res = await fetch("/api/teams");
      if (res.ok) {
        const allTeams = await res.json();
        // Filtrar equipes onde o gerente é o manager
        return allTeams.filter((team: any) => team.managerId === managerId);
      }
    } catch (error) {
      console.error("Erro ao buscar equipes do gerente:", error);
    }
    return [];
  }

  // Buscar gerentes disponíveis para adicionar
  async function fetchAvailableManagers() {
    try {
      const res = await fetch("/api/members");
      if (res.ok) {
        const allMembers = await res.json();

        if (user.role === "administrador") {
          // Administrador pode adicionar gerentes a qualquer diretor
          // Mostrar todos os gerentes (associados e não associados)
          const allManagers = allMembers.filter(
            (member: any) => member.position === "Gerente"
          );
          setAvailableManagers(allManagers);

          // Buscar diretores disponíveis
          const directors = allMembers.filter(
            (member: any) => member.position === "Diretor"
          );
          setAvailableDirectors(directors);
        } else {
          // Diretor só pode adicionar gerentes não associados
          const availableManagers = allMembers.filter(
            (member: any) => member.position === "Gerente" && !member.directorId
          );
          setAvailableManagers(availableManagers);
        }

        console.log("Gerentes disponíveis:", availableManagers);
      }
    } catch (error) {
      console.error("Erro ao buscar gerentes disponíveis:", error);
    }
  }

  // Adicionar gerente à equipe do diretor
  async function addManagerToTeam() {
    if (!selectedManagerId || selectedManagerId === "none") return;

    // Determinar o diretor alvo
    let targetDirectorId = user.id;
    if (
      user.role === "administrador" &&
      selectedDirectorId &&
      selectedDirectorId !== "none"
    ) {
      targetDirectorId = selectedDirectorId;
    }

    setAddingManager(true);
    try {
      const res = await fetch(
        `/api/members/${selectedManagerId}/assign-director`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            directorId: targetDirectorId,
          }),
        }
      );

      if (res.ok) {
        // Recarregar a lista de gerentes
        await fetchMyManagers();
        setShowAddManagerDialog(false);
        setSelectedManagerId("");
        setSelectedDirectorId("");
        alert("Gerente adicionado à equipe com sucesso!");
      } else {
        const error = await res.text();
        alert(`Erro ao adicionar gerente: ${error}`);
      }
    } catch (error) {
      console.error("Erro ao adicionar gerente:", error);
      alert("Erro ao adicionar gerente. Tente novamente.");
    } finally {
      setAddingManager(false);
    }
  }

  // Abrir modal para adicionar gerente
  function openAddManagerDialog() {
    fetchAvailableManagers();
    setShowAddManagerDialog(true);
  }

  if (loading) {
    return (
      <TabsContent value="my-managers" className="space-y-4">
        <div className="flex items-center justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      </TabsContent>
    );
  }

  return (
    <TabsContent value="my-managers" className="space-y-4">
      <div className="bg-white rounded-lg border p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="text-lg font-semibold flex items-center gap-2">
              <Building2 className="w-5 h-5" />
              {user.role === "administrador"
                ? "Todos os Gerentes"
                : "Meus Gerentes"}
            </h3>
            <p className="text-sm text-gray-600 mt-1">
              {user.role === "administrador"
                ? "Todos os gerentes do sistema e suas equipes"
                : "Gerentes sob sua responsabilidade e suas equipes"}
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Badge variant="secondary" className="text-sm">
              {managers.length} gerente{managers.length !== 1 ? "s" : ""}
            </Badge>
            {(user.role === "diretor" || user.role === "administrador") && (
              <Dialog
                open={showAddManagerDialog}
                onOpenChange={setShowAddManagerDialog}
              >
                <DialogTrigger asChild>
                  <Button
                    onClick={openAddManagerDialog}
                    size="sm"
                    className="flex items-center gap-2"
                  >
                    <Plus className="w-4 h-4" />
                    {user.role === "administrador"
                      ? "Associar Gerente"
                      : "Adicionar Gerente"}
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>
                      {user.role === "administrador"
                        ? "Adicionar Gerente a um Diretor"
                        : "Adicionar Gerente à Equipe"}
                    </DialogTitle>
                    <DialogDescription>
                      {user.role === "administrador"
                        ? "Selecione um gerente e um diretor para fazer a associação."
                        : "Selecione um gerente disponível para adicionar à sua equipe."}
                    </DialogDescription>
                  </DialogHeader>

                  <div className="space-y-4">
                    {user.role === "administrador" && (
                      <div>
                        <label className="text-sm font-medium">Diretor</label>
                        <Select
                          value={selectedDirectorId}
                          onValueChange={setSelectedDirectorId}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Selecione um diretor" />
                          </SelectTrigger>
                          <SelectContent>
                            {availableDirectors.length === 0 ? (
                              <SelectItem value="none" disabled>
                                Nenhum diretor disponível
                              </SelectItem>
                            ) : (
                              availableDirectors.map((director: any) => (
                                <SelectItem
                                  key={director.id}
                                  value={director.id}
                                >
                                  {director.name} - {director.email}
                                </SelectItem>
                              ))
                            )}
                          </SelectContent>
                        </Select>
                      </div>
                    )}

                    <div>
                      <label className="text-sm font-medium">Gerente</label>
                      <Select
                        value={selectedManagerId}
                        onValueChange={setSelectedManagerId}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione um gerente" />
                        </SelectTrigger>
                        <SelectContent>
                          {availableManagers.length === 0 ? (
                            <SelectItem value="none" disabled>
                              Nenhum gerente disponível
                            </SelectItem>
                          ) : (
                            availableManagers.map((manager: any) => (
                              <SelectItem key={manager.id} value={manager.id}>
                                {manager.name} - {manager.email}
                                {manager.directorId && " (Já associado)"}
                              </SelectItem>
                            ))
                          )}
                        </SelectContent>
                      </Select>
                    </div>

                    {availableManagers.length === 0 && (
                      <div className="text-sm text-gray-500 text-center py-4">
                        Não há gerentes disponíveis para adicionar.
                      </div>
                    )}
                  </div>

                  <div className="flex justify-end gap-2">
                    <Button
                      variant="outline"
                      onClick={() => {
                        setShowAddManagerDialog(false);
                        setSelectedManagerId("");
                        setSelectedDirectorId("");
                      }}
                    >
                      Cancelar
                    </Button>
                    <Button
                      onClick={addManagerToTeam}
                      disabled={
                        !selectedManagerId ||
                        selectedManagerId === "none" ||
                        addingManager ||
                        (user.role === "administrador" &&
                          (!selectedDirectorId ||
                            selectedDirectorId === "none"))
                      }
                    >
                      {addingManager ? "Adicionando..." : "Adicionar"}
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>
            )}
          </div>
        </div>

        {managers.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <Users className="w-12 h-12 mx-auto mb-4 text-gray-300" />
            <p>Nenhum gerente encontrado</p>
            <p className="text-sm">
              {user.role === "administrador"
                ? "Não há gerentes cadastrados no sistema"
                : "Os gerentes aparecerão aqui quando forem associados a você"}
            </p>
          </div>
        ) : (
          <div className="space-y-6">
            {managers.map((manager) => {
              const teams = managerTeams[manager.id] || [];
              const totalConsultores = teams.reduce(
                (total: number, team: any) =>
                  total + (team.members?.length || 0),
                0
              );

              return (
                <Card key={manager.id} className="border-l-4 border-l-blue-500">
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                          <User className="w-5 h-5 text-blue-600" />
                        </div>
                        <div>
                          <CardTitle className="text-lg">
                            {manager.name}
                          </CardTitle>
                          <CardDescription className="flex items-center gap-2">
                            <span>{manager.email}</span>
                            <Badge variant="outline" className="text-xs">
                              Gerente
                            </Badge>
                            {user.role === "administrador" &&
                              manager.directorId && (
                                <Badge variant="secondary" className="text-xs">
                                  Diretor:{" "}
                                  {manager.director?.name || "Não definido"}
                                </Badge>
                              )}
                          </CardDescription>
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                        <div className="text-center">
                          <div className="text-2xl font-bold text-blue-600">
                            {teams.length}
                          </div>
                          <div className="text-xs text-gray-500">Equipes</div>
                        </div>
                        <div className="text-center">
                          <div className="text-2xl font-bold text-green-600">
                            {totalConsultores}
                          </div>
                          <div className="text-xs text-gray-500">
                            Consultores
                          </div>
                        </div>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <h4 className="font-medium text-sm text-gray-700 flex items-center gap-2">
                        <Target className="w-4 h-4" />
                        Equipes do Gerente
                      </h4>

                      {teams.length === 0 ? (
                        <div className="text-sm text-gray-500 italic">
                          Nenhuma equipe criada ainda
                        </div>
                      ) : (
                        <div className="grid gap-3">
                          {teams.map((team: any) => (
                            <div
                              key={team.id}
                              className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                            >
                              <div className="flex items-center space-x-3">
                                <Users className="w-4 h-4 text-gray-500" />
                                <div>
                                  <div className="font-medium text-sm">
                                    {team.name}
                                  </div>
                                  <div className="text-xs text-gray-500">
                                    {team.members?.length || 0} consultor
                                    {(team.members?.length || 0) !== 1
                                      ? "es"
                                      : ""}
                                  </div>
                                </div>
                              </div>
                              <div className="flex items-center gap-2">
                                <TrendingUp className="w-4 h-4 text-green-500" />
                                <span className="text-xs text-gray-600">
                                  Ativa
                                </span>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </TabsContent>
  );
}
