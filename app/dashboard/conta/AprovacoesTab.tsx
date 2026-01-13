"use client";

import React from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import {
  Check,
  X,
  RefreshCcw,
  Search as SearchIcon,
  Shield,
  ChevronRight,
  Info,
} from "lucide-react";
import { TabsContent } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";

const onlyDigits = (s: string) => String(s || "").replace(/\D/g, "");
const maskCPF = (v?: string) => {
  const d = onlyDigits(v || "").slice(0, 11);
  if (!d) return "";
  return d
    .replace(/(\d{3})(\d)/, "$1.$2")
    .replace(/(\d{3})(\d)/, "$1.$2")
    .replace(/(\d{3})(\d{1,2})$/, "$1-$2");
};
const maskPhone = (v?: string) => {
  const d = onlyDigits(v || "").slice(0, 11);
  if (!d) return "";
  if (d.length <= 10)
    return d.replace(/^(\d{2})(\d)/, "($1) $2").replace(/(\d{4})(\d)/, "$1-$2");
  return d
    .replace(/^(\d{2})(\d)/, "($1) $2")
    .replace(/(\d{5})(\d{1,4})$/, "$1-$2");
};
const maskCNPJ = (v?: string) => {
  const d = onlyDigits(v || "").slice(0, 14);
  if (!d) return "";
  return d.replace(
    /(\d{2})(\d{3})(\d{3})(\d{4})(\d{0,2})/,
    (_m, a, b, c, d4, e) => `${a}.${b}.${c}/${d4}${e ? "-" + e : ""}`
  );
};
const formatDate = (iso?: string) => {
  if (!iso) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleDateString();
};
const formatDateTime = (iso?: string) =>
  iso ? new Date(iso).toLocaleString() : "-";

type PendingMember = {
  id: string;
  name: string;
  email: string;
  position?: string;
  cpf?: string | null;
  phone?: string | null;
  birthDate?: string | null;
  cnpj?: string | null;
  address?: string | null;
  requestedAt?: string | null;
  accessStatus?: string;
};

export function AprovacoesTab({ user }: { user: any }) {
  const { toast } = useToast();
  const [loading, setLoading] = React.useState(false);
  const [query, setQuery] = React.useState("");
  const [items, setItems] = React.useState<PendingMember[]>([]);
  const [roleById, setRoleById] = React.useState<Record<string, string>>({});

  // Modal (detalhes)
  const [openModal, setOpenModal] = React.useState(false);
  const [selected, setSelected] = React.useState<PendingMember | null>(null);

  const isAdmin =
    String(user?.role || user?.position || "").toLowerCase() ===
    "administrador";

  React.useEffect(() => {
    fetchPending();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function fetchPending() {
    try {
      setLoading(true);
      const res = await fetch("/api/access-request?status=pending");
      if (!res.ok) throw new Error("Falha ao carregar solicitações");
      const data = await res.json();
      setItems(Array.isArray(data) ? data : []);
      // default role = Consultor
      const defaults: Record<string, string> = {};
      (Array.isArray(data) ? data : []).forEach((m: any) => {
        defaults[m.id] = "Consultor";
      });
      setRoleById(defaults);
    } catch (e: any) {
      toast({
        title: "Erro",
        description: e?.message || "Não foi possível carregar as solicitações.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }

  const filtered = React.useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return items;
    const qDigits = onlyDigits(q);
    return items.filter((m) => {
      const pool = [
        m.name,
        m.email,
        m.position,
        m.address,
        m.cpf,
        maskCPF(m.cpf || ""),
        m.phone,
        maskPhone(m.phone || ""),
        m.cnpj,
        maskCNPJ(m.cnpj || ""),
        m.birthDate,
        formatDate(m.birthDate || ""),
      ]
        .filter(Boolean)
        .map(String);

      return pool.some((t) => {
        const txt = t.toLowerCase();
        return txt.includes(q) || onlyDigits(t).includes(qDigits);
      });
    });
  }, [items, query]);
  console.log(filtered);

  async function approve(id: string) {
    try {
      setLoading(true);
      const role = roleById[id] || "Consultor";
      const res = await fetch("/api/access-request", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, action: "approve", role }),
      });
      if (!res.ok) {
        const { error } = await res.json();
        throw new Error(error || "Falha ao aprovar");
      }
      setItems((prev) => prev.filter((p) => p.id !== id));
      if (selected?.id === id) {
        setOpenModal(false);
        setSelected(null);
      }
      toast({
        title: "Aprovado",
        description: "A conta foi aprovada e liberada para acesso.",
      });
    } catch (e: any) {
      toast({
        title: "Erro",
        description: e?.message || "Não foi possível aprovar.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }

  async function reject(id: string) {
    try {
      setLoading(true);
      const res = await fetch("/api/access-request", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, action: "reject" }),
      });
      if (!res.ok) {
        const { error } = await res.json();
        throw new Error(error || "Falha ao recusar");
      }
      setItems((prev) => prev.filter((p) => p.id !== id));
      if (selected?.id === id) {
        setOpenModal(false);
        setSelected(null);
      }
      toast({
        title: "Recusado",
        description: "A solicitação foi recusada.",
      });
    } catch (e: any) {
      toast({
        title: "Erro",
        description: e?.message || "Não foi possível recusar.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }

  function openDetails(m: PendingMember) {
    setSelected(m);
    setOpenModal(true);
  }

  if (!isAdmin) {
    return (
      <div className="bg-white rounded-lg border p-6">
        <p className="text-gray-600">
          Você não tem permissão para acessar esta área.
        </p>
      </div>
    );
  }

  return (
    <TabsContent value="approvals" className="space-y-4">
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        {/* Header */}
        <div className="flex flex-col gap-4 p-6 border-b border-gray-100 md:flex-row md:items-center md:justify-between bg-gradient-to-r from-blue-50 to-white">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center border border-blue-200">
              <Shield className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-xl font-semibold tracking-tight text-gray-900">
                Aprovação de Contas
              </h3>
              <p className="text-sm text-gray-500 mt-1">
                Revise os dados do solicitante antes de aprovar ou recusar.
              </p>
            </div>
          </div>
          <div className="flex gap-3">
            <div className="relative">
              <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Buscar por nome, e-mail, CPF, telefone, CNPJ..."
                className="pl-9 w-80"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
              />
            </div>
            <Button variant="outline" onClick={fetchPending} disabled={loading}>
              <RefreshCcw className="h-4 w-4 mr-2" />
              Atualizar
            </Button>
          </div>
        </div>

        {/* Lista */}
        <div className="p-6">
          {loading ? (
            <div className="text-center py-12 text-gray-500">
              Carregando solicitações…
            </div>
          ) : filtered.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              Nenhuma solicitação pendente.
            </div>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {filtered.map((m) => (
                <div
                  key={m.id}
                  className="rounded-lg border border-gray-200 bg-white p-5 shadow-sm hover:shadow-md transition"
                >
                  <div className="mb-3 flex items-start justify-between">
                    <div>
                      <h4 className="font-semibold text-gray-900 leading-tight">
                        {m.name}
                      </h4>
                      <p className="text-xs uppercase tracking-wide text-gray-500">
                        {m.position || "Solicitante"}
                      </p>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-blue-700 hover:text-blue-800"
                      onClick={() => openDetails(m)}
                      title="Ver detalhes"
                    >
                      Detalhes
                      <ChevronRight className="h-4 w-4 ml-1" />
                    </Button>
                  </div>

                  <div className="grid gap-1.5 text-sm text-gray-700">
                    <div className="truncate">
                      <span className="text-gray-500">E-mail: </span>
                      {m.email}
                    </div>
                    {m.phone && (
                      <div>
                        <span className="text-gray-500">Telefone: </span>
                        {maskPhone(m.phone)}
                      </div>
                    )}
                    {m.cpf && (
                      <div>
                        <span className="text-gray-500">CPF: </span>
                        {maskCPF(m.cpf)}
                      </div>
                    )}
                    {m.birthDate && (
                      <div>
                        <span className="text-gray-500">Nascimento: </span>
                        {formatDate(m.birthDate)}
                      </div>
                    )}
                    {m.cnpj && (
                      <div className="truncate">
                        <span className="text-gray-500">CNPJ: </span>
                        {maskCNPJ(m.cnpj)}
                      </div>
                    )}
                    {m.address && (
                      <div className="truncate">
                        <span className="text-gray-500">Endereço: </span>
                        {m.address}
                      </div>
                    )}
                    <div>
                      <span className="text-gray-500">Solicitado em: </span>
                      {formatDateTime(m.requestedAt || "")}
                    </div>
                  </div>

                  <div className="mt-4 grid gap-2">
                    <div>
                      <Label className="text-xs text-gray-500">
                        Definir cargo ao aprovar
                      </Label>
                      <Select
                        value={roleById[m.id] || "Consultor"}
                        onValueChange={(v) =>
                          setRoleById((prev) => ({ ...prev, [m.id]: v }))
                        }
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Cargo" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Consultor">Consultor</SelectItem>
                          <SelectItem value="Gerente">Gerente</SelectItem>
                          <SelectItem value="Diretor">Diretor</SelectItem>
                          <SelectItem value="Administrador">
                            Administrador
                          </SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="flex gap-2">
                      <Button
                        className="bg-green-600 hover:bg-green-700"
                        onClick={() => approve(m.id)}
                        disabled={loading}
                      >
                        <Check className="h-4 w-4 mr-2" />
                        Aprovar
                      </Button>
                      <Button
                        variant="outline"
                        className="text-red-600 hover:text-red-700"
                        onClick={() => reject(m.id)}
                        disabled={loading}
                      >
                        <X className="h-4 w-4 mr-2" />
                        Recusar
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Modal de Detalhes */}
      <Dialog
        open={openModal}
        onOpenChange={(o) => {
          setOpenModal(o);
          if (!o) setSelected(null);
        }}
      >
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-hidden p-0">
          <DialogHeader className="px-6 pt-6 pb-3 border-b">
            <div className="flex items-center gap-2 text-blue-700">
              <Info className="h-5 w-5" />
              <DialogTitle>Detalhes do solicitante</DialogTitle>
            </div>
            <DialogDescription className="text-gray-500">
              Revise as informações cadastradas antes de tomar uma decisão.
            </DialogDescription>
          </DialogHeader>

          <div className="px-6 py-5 overflow-y-auto">
            <div className="grid gap-6">
              {/* Cabeçalho do solicitante */}
              <div className="flex items-start justify-between">
                <div>
                  <h4 className="text-lg font-semibold text-gray-900">
                    {selected?.name}
                  </h4>
                  <p className="text-xs uppercase tracking-wide text-gray-500">
                    {selected?.position || "Solicitante"}
                  </p>
                </div>
                <div className="text-right text-sm text-gray-600">
                  <div>
                    <span className="text-gray-500">Status: </span>
                    {selected?.accessStatus || "pending"}
                  </div>
                  <div>
                    <span className="text-gray-500">Solicitado em: </span>
                    {formatDateTime(selected?.requestedAt || "")}
                  </div>
                </div>
              </div>

              {/* Dados */}
              <div className="grid sm:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <Label className="text-xs text-gray-500">E-mail</Label>
                  <div className="text-sm text-gray-800 break-all">
                    {selected?.email || "-"}
                  </div>
                </div>

                <div className="space-y-1">
                  <Label className="text-xs text-gray-500">Telefone</Label>
                  <div className="text-sm text-gray-800">
                    {maskPhone(selected?.phone ?? "")}
                  </div>
                </div>

                <div className="space-y-1">
                  <Label className="text-xs text-gray-500">CPF</Label>
                  <div className="text-sm text-gray-800">
                    {maskCPF(selected?.cpf ?? "")}
                  </div>
                </div>

                {selected?.birthDate && (
                  <div className="space-y-1">
                    <Label className="text-xs text-gray-500">
                      Data de Nascimento
                    </Label>
                    <div className="text-sm text-gray-800">
                      {formatDate(selected?.birthDate)}
                    </div>
                  </div>
                )}

                {selected?.cnpj && (
                  <div className="space-y-1">
                    <Label className="text-xs text-gray-500">CNPJ</Label>
                    <div className="text-sm text-gray-800">
                      {maskCNPJ(selected?.cnpj)}
                    </div>
                  </div>
                )}

                {selected?.address && (
                  <div className="sm:col-span-2 space-y-1">
                    <Label className="text-xs text-gray-500">Endereço</Label>
                    <div className="text-sm text-gray-800">
                      {selected?.address}
                    </div>
                  </div>
                )}
              </div>

              {/* Cargo ao aprovar */}
              <div className="space-y-2">
                <Label className="text-xs text-gray-500">
                  Definir cargo ao aprovar
                </Label>
                <Select
                  value={
                    selected
                      ? roleById[selected.id] || "Consultor"
                      : "Consultor"
                  }
                  onValueChange={(v) =>
                    selected &&
                    setRoleById((prev) => ({ ...prev, [selected.id]: v }))
                  }
                >
                  <SelectTrigger className="w-full sm:w-64">
                    <SelectValue placeholder="Cargo" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Consultor">Consultor</SelectItem>
                    <SelectItem value="Gerente">Gerente</SelectItem>
                    <SelectItem value="Diretor">Diretor</SelectItem>
                    <SelectItem value="Administrador">Administrador</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          <DialogFooter className="px-6 py-4 border-t flex gap-2 justify-end">
            <Button
              variant="outline"
              className="text-red-600 hover:text-red-700"
              disabled={loading || !selected}
              onClick={() => selected && reject(selected.id)}
            >
              <X className="h-4 w-4 mr-2" />
              Recusar
            </Button>
            <Button
              className="bg-green-600 hover:bg-green-700"
              disabled={loading || !selected}
              onClick={() => selected && approve(selected.id)}
            >
              <Check className="h-4 w-4 mr-2" />
              Aprovar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </TabsContent>
  );
}
