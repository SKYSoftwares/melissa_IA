'use client';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { RefreshCw, Search, Users } from 'lucide-react';
import { useEffect, useState } from 'react';

export default function ActiveCampaignsPage() {
    const [campaigns, setCampaigns] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);
    const [contacts, setContacts] = useState<any[]>([]);
    const [selectedCampaign, setSelectedCampaign] = useState<any | null>(null);
    const [search, setSearch] = useState('');
    const [expanded, setExpanded] = useState<string | null>(null);

    const loadActiveCampaigns = async () => {
        setLoading(true);
        try {
            const res = await fetch('/api/campaigns/active');
            const data = await res.json();
            if (data.status) setCampaigns(data.campaigns);
        } catch (err) {
            console.error('Erro:', err);
        } finally {
            setLoading(false);
        }
    };

    const loadCampaignMessages = async (campaignId: string, q = '') => {
        try {
            const url = q
                ? `/api/campaigns/${campaignId}/messages?q=${encodeURIComponent(
                      q
                  )}`
                : `/api/campaigns/${campaignId}/messages`;
            const res = await fetch(url);
            const data = await res.json();
            if (data.status) {
                setContacts(data.contacts);
            }
        } catch (err) {
            console.error('Erro ao buscar mensagens:', err);
        }
    };

    useEffect(() => {
        loadActiveCampaigns();
    }, []);

    return (
        <div className="flex-1 p-4 md:p-8">
            <div className="space-y-6 rounded-2xl bg-gradient-to-br from-sky-50 via-white to-cyan-50 shadow-sm border border-sky-100/70 px-4 py-6 md:px-8 md:py-8">
                {/* Header */}
                <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                    <div>
                        <h2 className="text-2xl md:text-3xl font-semibold text-sky-950 flex items-center gap-2">
                            📊 Campanhas Ativas
                        </h2>
                        <p className="text-sm text-sky-700/90">
                            Acompanhe o andamento das campanhas de forma clara e
                            organizada.
                        </p>
                    </div>
                    <div className="flex items-center gap-3">
                        <Button
                            variant="outline"
                            className="border-sky-300 text-sky-800 hover:bg-sky-50 hover:text-sky-900"
                            onClick={loadActiveCampaigns}
                        >
                            <RefreshCw className="h-4 w-4 mr-2" />
                            Atualizar
                        </Button>
                    </div>
                </div>

                {/* Conteúdo */}
                {loading ? (
                    <div className="flex items-center justify-center py-16">
                        <div className="text-center">
                            <div className="mx-auto mb-3 h-8 w-8 rounded-full border-2 border-sky-500 border-t-transparent animate-spin" />
                            <p className="text-sm text-sky-700/90">
                                Carregando campanhas ativas...
                            </p>
                        </div>
                    </div>
                ) : campaigns.length === 0 ? (
                    <div className="rounded-xl border border-dashed border-sky-200 bg-sky-50/60 px-6 py-10 text-center">
                        <p className="text-sm text-sky-700/90">
                            Nenhuma campanha ativa no momento.
                        </p>
                        <p className="text-xs text-sky-600 mt-1">
                            Assim que uma nova campanha for iniciada, ela
                            aparecerá aqui.
                        </p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                        {campaigns.map((c) => (
                            <Card
                                key={c.id}
                                className="relative cursor-pointer border border-sky-100 bg-white/90 rounded-2xl shadow-sm hover:shadow-md hover:-translate-y-[1px] transition-all duration-200"
                                onClick={() => {
                                    setSelectedCampaign(c);
                                    loadCampaignMessages(c.id);
                                }}
                            >
                                {/* Botões de ação */}
                                <div className="absolute top-3 right-3 flex gap-2 z-10">
                                    <Button
                                        size="sm"
                                        className="px-2 py-1 text-xs rounded-md bg-red-500 hover:bg-red-600 text-white shadow-sm"
                                        onClick={async (e) => {
                                            e.stopPropagation();
                                            if (
                                                !confirm(
                                                    'Tem certeza que deseja deletar esta campanha?'
                                                )
                                            )
                                                return;

                                            await fetch(
                                                `/api/campaigns/${c.id}/delete`,
                                                {
                                                    method: 'DELETE',
                                                }
                                            );
                                            loadActiveCampaigns();
                                        }}
                                    >
                                        🗑 Deletar
                                    </Button>

                                    <Button
                                        size="sm"
                                        className="px-2 py-1 text-xs rounded-md bg-amber-400 hover:bg-amber-500 text-slate-900 shadow-sm"
                                        onClick={async (e) => {
                                            e.stopPropagation();
                                            const newStatus =
                                                c.status === 'paused'
                                                    ? 'active'
                                                    : 'paused';
                                            await fetch(
                                                `/api/campaigns/${c.id}/status`,
                                                {
                                                    method: 'PUT',
                                                    headers: {
                                                        'Content-Type':
                                                            'application/json',
                                                    },
                                                    body: JSON.stringify({
                                                        status: newStatus,
                                                    }),
                                                }
                                            );
                                            loadActiveCampaigns();
                                        }}
                                    >
                                        {c.status === 'paused'
                                            ? '▶ Retomar'
                                            : '⏸ Pausar'}
                                    </Button>
                                </div>

                                <CardHeader className="pb-2 pr-24">
                                    <CardTitle className="text-lg font-semibold text-sky-900">
                                        {c.name}
                                    </CardTitle>
                                    {c.scheduledAt && (
                                        <p className="text-xs text-sky-700/80 mt-1">
                                            📅 Agendada para:{' '}
                                            {new Date(
                                                c.scheduledAt
                                            ).toLocaleString('pt-BR', {
                                                day: '2-digit',
                                                month: '2-digit',
                                                year: 'numeric',
                                                hour: '2-digit',
                                                minute: '2-digit',
                                            })}
                                        </p>
                                    )}
                                </CardHeader>

                                <CardContent className="space-y-3">
                                    <p className="text-sm text-sky-800/90">
                                        ⏱ Delay entre mensagens:{' '}
                                        <span className="font-semibold text-sky-950">
                                            {c.delay / 1000}s
                                        </span>
                                    </p>

                                    <div className="grid grid-cols-3 gap-2 mt-2">
                                        <Badge
                                            variant="outline"
                                            className="flex items-center justify-center gap-1 bg-emerald-50 text-emerald-800 border-emerald-200"
                                        >
                                            ✅ {c.stats.sent} enviadas
                                        </Badge>

                                        <Badge
                                            variant="outline"
                                            className="flex items-center justify-center gap-1 bg-amber-50 text-amber-800 border-amber-200"
                                        >
                                            ⏳ {c.stats.pending} pendentes
                                        </Badge>

                                        <Badge
                                            variant="outline"
                                            className="flex items-center justify-center gap-1 bg-rose-50 text-rose-800 border-rose-200"
                                        >
                                            ❌ {c.stats.failed} falhas
                                        </Badge>
                                    </div>
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                )}

                {/* Modal com mensagens */}
                <Dialog
                    open={!!selectedCampaign}
                    onOpenChange={() => {
                        setSelectedCampaign(null);
                        setContacts([]);
                        setSearch('');
                        setExpanded(null);
                    }}
                >
                    <DialogContent className="max-w-3xl border border-sky-100 bg-white/95">
                        <DialogHeader>
                            <DialogTitle className="flex items-center gap-2 text-sky-950">
                                <Users className="w-5 h-5 text-sky-500" />
                                Mensagens da campanha:{' '}
                                <span className="font-semibold">
                                    {selectedCampaign?.name}
                                </span>
                            </DialogTitle>
                        </DialogHeader>

                        {/* Busca */}
                        <div className="flex items-center gap-2 mb-4">
                            <div className="relative flex-1">
                                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-sky-400" />
                                <Input
                                    placeholder="Pesquisar por contato ou conteúdo..."
                                    value={search}
                                    onChange={(e) => {
                                        const q = e.target.value;
                                        setSearch(q);
                                        if (selectedCampaign) {
                                            loadCampaignMessages(
                                                selectedCampaign.id,
                                                q
                                            );
                                        }
                                    }}
                                    className="pl-8 border-sky-200 focus:border-sky-500 focus:ring-sky-500/60"
                                />
                            </div>
                        </div>

                        {contacts.length === 0 ? (
                            <p className="text-sm text-sky-700/90">
                                Nenhum contato encontrado para esta campanha.
                            </p>
                        ) : (
                            <ul className="divide-y divide-sky-100 max-h-96 overflow-y-auto">
                                {contacts.map((c) => (
                                    <li key={c.contact} className="py-2">
                                        <div
                                            className="flex justify-between items-center cursor-pointer rounded-md px-2 py-1 hover:bg-sky-50"
                                            onClick={() =>
                                                setExpanded(
                                                    expanded === c.contact
                                                        ? null
                                                        : c.contact
                                                )
                                            }
                                        >
                                            <p className="font-medium text-sky-950">
                                                {c.contact}
                                            </p>
                                            <Badge
                                                variant="secondary"
                                                className="bg-sky-100 text-sky-800 border-sky-200"
                                            >
                                                {c.messages.length} mensagens
                                            </Badge>
                                        </div>

                                        {expanded === c.contact && (
                                            <ul className="ml-4 mt-2 space-y-2">
                                                {c.messages.map((msg: any) => (
                                                    <li
                                                        key={msg.id}
                                                        className="border border-sky-100 bg-sky-50/70 p-2 rounded-lg"
                                                    >
                                                        <p className="text-sm text-sky-950">
                                                            {msg.text ||
                                                                '[mídia]'}
                                                        </p>
                                                        <p className="text-xs text-sky-700/80 mt-1">
                                                            {new Date(
                                                                msg.updatedAt
                                                            ).toLocaleString(
                                                                'pt-BR'
                                                            )}{' '}
                                                            - {msg.status}
                                                        </p>
                                                        {msg.error && (
                                                            <p className="text-xs text-rose-600 mt-1">
                                                                Erro:{' '}
                                                                {msg.error}
                                                            </p>
                                                        )}
                                                    </li>
                                                ))}
                                            </ul>
                                        )}
                                    </li>
                                ))}
                            </ul>
                        )}
                    </DialogContent>
                </Dialog>
            </div>
        </div>
    );
}
