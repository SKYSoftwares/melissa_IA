'use client';

import { PermissionProtectedRoute } from '@/components/PermissionProtectedRoute';
import { Badge } from '@/components/ui/badge';
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from '@/components/ui/card';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useAuth } from '@/contexts/AuthContext';
import { useEffect, useMemo, useState } from 'react';

import { BarChart3 } from 'lucide-react';
import {
    Area,
    AreaChart,
    Bar,
    BarChart,
    CartesianGrid,
    Cell,
    Legend,
    Line,
    LineChart,
    Pie,
    PieChart as RechartsPieChart,
    ResponsiveContainer,
    Tooltip,
    XAxis,
    YAxis,
} from 'recharts';

function formatarMoedaBR(valor: number) {
    return new Intl.NumberFormat('pt-BR', {
        style: 'currency',
        currency: 'BRL',
    }).format(valor);
}
function formatarPorcentagem(valor: number) {
    return `${valor.toFixed(1)}%`;
}

export default function DashboardPage() {
    const { user } = useAuth();
    const [period, setPeriod] = useState('mes');
    const [loading, setLoading] = useState(true);
    const [data, setData] = useState<any>(null);
    const [searchName, setSearchName] = useState('');
    const [filterRole, setFilterRole] = useState('all');

    // Member modal
    const [selectedMember, setSelectedMember] = useState<any>(null);
    const [memberStats, setMemberStats] = useState<any>(null);
    const [loadingMemberStats, setLoadingMemberStats] = useState(false);

    async function fetchAll() {
        if (!user?.email) return;
        try {
            setLoading(true);
            const res = await fetch(
                `/api/dashboard/hierarchy?userEmail=${encodeURIComponent(
                    user.email
                )}&period=${period}`
            );
            const json = await res.json();
            if (json?.ok) setData(json.data);
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    }

    useEffect(() => {
        fetchAll();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [user?.email, period]);

    useEffect(() => {
        async function fetchMemberStats() {
            if (!selectedMember) return;
            setLoadingMemberStats(true);
            try {
                const res = await fetch(
                    `/api/dashboard/member?id=${selectedMember.id}&period=${period}`
                );
                const json = await res.json();
                if (json?.ok) setMemberStats(json.data);
            } catch (e) {
                console.error(e);
            } finally {
                setLoadingMemberStats(false);
            }
        }
        fetchMemberStats();
    }, [selectedMember, period]);

    const role = data?.me?.position;
    const isAdmin = role === 'Administrador';
    const isDirector = role === 'Diretor';
    const isManager = role === 'Gerente';

    const filteredConsultants = useMemo(() => {
        if (!data?.consultantsSummary) return [];
        return data.consultantsSummary.filter((u: any) => {
            const matchesName = u.name
                .toLowerCase()
                .includes(searchName.toLowerCase());
            const matchesRole =
                filterRole === 'all' || u.position.toLowerCase() === filterRole;
            return matchesName && matchesRole;
        });
    }, [data?.consultantsSummary, searchName, filterRole]);

    const kpis = useMemo(() => {
        const t = data?.totals || {};
        return [
            {
                title: 'Valor Total Assinado',
                value: formatarMoedaBR(t.totalSignedValue || 0),
                hint: `${t.signedContracts || 0} contratos`,
            },
            {
                title: 'Total de Leads',
                value: `${t.totalLeads || 0}`,
                hint: `${t.totalProposals || 0} propostas criadas`,
            },
            {
                title: 'Taxa de Conversão',
                value: formatarPorcentagem(t.conversionRate || 0),
                hint: `${t.signedContracts || 0} contratos assinados`,
            },
        ];
    }, [data]);

    const STATUS_COLORS = [
        '#3b82f6',
        '#22c55e',
        '#f59e0b',
        '#ef4444',
        '#8b5cf6',
        '#14b8a6',
        '#eab308',
        '#f97316',
        '#94a3b8',
    ];

    const leadsStats = useMemo(() => {
        const arr = data?.leadsByStatus || [];
        const total = arr.reduce((a: number, s: any) => a + (s?.count || 0), 0);

        const withPct = arr.map((s: any, i: number) => ({
            ...s,
            pct: total ? (s.count / total) * 100 : 0,
            color: STATUS_COLORS[i % STATUS_COLORS.length],
        }));

        const evo = (data?.evolution || []).map((d: any) => ({
            date: d.date,
            leads: d.leads || 0,
        }));

        const days = evo.length || 1;
        const avgPerDay = days
            ? withPct.reduce((a: number, s: any) => a + s.count, 0) / days
            : 0;

        const top = [...withPct].sort((a, b) => b.count - a.count)[0] || null;

        return { total, byStatus: withPct, evolution: evo, avgPerDay, top };
    }, [data?.leadsByStatus, data?.evolution]);

    const STAGE_COLORS = [
        '#10b981',
        '#6366f1',
        '#f97316',
        '#dc2626',
        '#06b6d4',
        '#84cc16',
        '#a855f7',
        '#f43f5e',
        '#0ea5e9',
    ];

    const proposalsStats = useMemo(() => {
        const arr = data?.proposalsByStage || [];
        const total = arr.reduce((a: number, s: any) => a + (s?.count || 0), 0);

        const withPct = arr.map((s: any, i: number) => ({
            ...s,
            pct: total ? (s.count / total) * 100 : 0,
            color: STAGE_COLORS[i % STAGE_COLORS.length],
        }));

        const evo = (data?.evolution || []).map((d: any) => ({
            date: d.date,
            proposals: d.proposals || 0,
            signed: d.signed || 0,
        }));

        const days = evo.length || 1;
        const avgPerDay = total ? total / days : 0;

        const signedFromTotals = data?.totals?.signedContracts || 0;
        const signedFromStage =
            arr.find((s: any) => s.stage === 'assinatura')?.count ?? 0;

        const signed = Math.max(signedFromStage, signedFromTotals);
        const winRate = total ? (signed / total) * 100 : 0;

        const top = [...withPct].sort((a, b) => b.count - a.count)[0] || null;

        return {
            total,
            byStage: withPct,
            evolution: evo,
            avgPerDay,
            signed,
            winRate,
            top,
        };
    }, [
        data?.proposalsByStage,
        data?.evolution,
        data?.totals?.signedContracts,
    ]);

    if (loading) {
        return (
            <PermissionProtectedRoute requiredPermission="dashboard">
                <div className="flex-1 p-4 md:p-8">
                    <div className="rounded-2xl bg-gradient-to-br from-sky-50 via-white to-cyan-50 shadow-inner flex items-center justify-center h-64">
                        <div className="text-center">
                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-sky-600 mx-auto"></div>
                            <p className="mt-2 text-sm text-sky-800/80">
                                Carregando dados do dashboard...
                            </p>
                        </div>
                    </div>
                </div>
            </PermissionProtectedRoute>
        );
    }

    return (
        <PermissionProtectedRoute requiredPermission="dashboard">
            <div className="flex-1 p-4 md:p-8">
                <div className="space-y-6 rounded-2xl bg-gradient-to-br from-sky-50 via-white to-cyan-50 shadow-sm border border-sky-100/60 px-4 py-6 md:px-8 md:py-8">
                    {/* Header */}
                    <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                        <div>
                            <h2 className="text-3xl font-semibold tracking-tight text-sky-950">
                                Central de Relatórios
                            </h2>
                            <p className="text-sm text-sky-700/90">
                                Análises detalhadas e insights de performance
                            </p>
                        </div>
                        <div className="flex flex-wrap items-center gap-3">
                            {role && (
                                <Badge
                                    variant="outline"
                                    className="border-sky-300 bg-sky-50/80 text-sky-900"
                                >
                                    Perfil: {role}
                                </Badge>
                            )}
                            <Select value={period} onValueChange={setPeriod}>
                                <SelectTrigger className="w-40 border-sky-200 bg-white/80 focus:ring-sky-500 focus:border-sky-500">
                                    <SelectValue placeholder="Período" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="hoje">Hoje</SelectItem>
                                    <SelectItem value="semana">
                                        Esta Semana
                                    </SelectItem>
                                    <SelectItem value="mes">
                                        Este Mês
                                    </SelectItem>
                                    <SelectItem value="trimestre">
                                        Trimestre
                                    </SelectItem>
                                    <SelectItem value="ano">
                                        Este Ano
                                    </SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </div>

                    {/* KPIs */}
                    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                        {kpis.map((k) => (
                            <Card
                                key={k.title}
                                className="border-sky-100/80 bg-white/90 shadow-sm hover:shadow-md transition-shadow"
                            >
                                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                    <CardTitle className="text-sm font-medium text-sky-900">
                                        {k.title}
                                    </CardTitle>
                                    <BarChart3 className="h-4 w-4 text-sky-400" />
                                </CardHeader>
                                <CardContent>
                                    <div className="text-2xl font-bold text-sky-950">
                                        {k.value}
                                    </div>
                                    <p className="text-xs text-sky-700/90">
                                        {k.hint}
                                    </p>
                                </CardContent>
                            </Card>
                        ))}
                    </div>

                    {/* Tabs */}
                    <Tabs defaultValue="overview" className="space-y-4">
                        <TabsList className="bg-sky-50/80 rounded-xl border border-sky-100 overflow-hidden">
                            <TabsTrigger
                                value="overview"
                                className="data-[state=active]:bg-white data-[state=active]:text-sky-900 data-[state=active]:shadow-sm text-sky-700 px-4"
                            >
                                Visão Geral
                            </TabsTrigger>
                            <TabsTrigger
                                value="team"
                                className="data-[state=active]:bg-white data-[state=active]:text-sky-900 data-[state=active]:shadow-sm text-sky-700 px-4"
                            >
                                Equipe
                            </TabsTrigger>
                            <TabsTrigger
                                value="leads"
                                className="data-[state=active]:bg-white data-[state=active]:text-sky-900 data-[state=active]:shadow-sm text-sky-700 px-4"
                            >
                                Leads
                            </TabsTrigger>
                            <TabsTrigger
                                value="proposals"
                                className="data-[state=active]:bg-white data-[state=active]:text-sky-900 data-[state=active]:shadow-sm text-sky-700 px-4"
                            >
                                Propostas
                            </TabsTrigger>
                        </TabsList>

                        {/* Visão Geral */}
                        <TabsContent value="overview" className="space-y-4">
                            <div className="grid gap-4 md:grid-cols-2">
                                {/* Série Temporal */}
                                <Card className="border-sky-100 bg-white/90 shadow-sm">
                                    <CardHeader>
                                        <CardTitle className="text-sky-900">
                                            Evolução (Leads, Propostas,
                                            Assinaturas)
                                        </CardTitle>
                                        <CardDescription className="text-sky-700/90">
                                            Distribuição diária no período
                                        </CardDescription>
                                    </CardHeader>
                                    <CardContent className="h-72">
                                        <ResponsiveContainer
                                            width="100%"
                                            height="100%"
                                        >
                                            <LineChart
                                                data={data?.evolution || []}
                                                margin={{
                                                    top: 8,
                                                    right: 16,
                                                    left: 0,
                                                    bottom: 8,
                                                }}
                                            >
                                                <CartesianGrid strokeDasharray="3 3" />
                                                <XAxis
                                                    dataKey="date"
                                                    tick={{ fontSize: 12 }}
                                                />
                                                <YAxis
                                                    tick={{ fontSize: 12 }}
                                                />
                                                <Tooltip
                                                    formatter={(
                                                        value,
                                                        name
                                                    ) => {
                                                        if (name === 'leads')
                                                            return [
                                                                value,
                                                                'Leads',
                                                            ];
                                                        if (
                                                            name === 'proposals'
                                                        )
                                                            return [
                                                                value,
                                                                'Propostas',
                                                            ];
                                                        if (name === 'signed')
                                                            return [
                                                                value,
                                                                'Assinaturas',
                                                            ];
                                                        return value;
                                                    }}
                                                    labelFormatter={(label) =>
                                                        `Data: ${label}`
                                                    }
                                                />
                                                <Legend
                                                    verticalAlign="top"
                                                    height={36}
                                                />
                                                <Line
                                                    type="monotone"
                                                    dataKey="leads"
                                                    stroke="#0ea5e9"
                                                    name="Leads"
                                                    strokeWidth={2}
                                                />
                                                <Line
                                                    type="monotone"
                                                    dataKey="proposals"
                                                    stroke="#22c55e"
                                                    name="Propostas"
                                                    strokeWidth={2}
                                                />
                                                <Line
                                                    type="monotone"
                                                    dataKey="signed"
                                                    stroke="#f59e0b"
                                                    name="Assinaturas"
                                                    strokeWidth={2}
                                                />
                                            </LineChart>
                                        </ResponsiveContainer>
                                    </CardContent>
                                </Card>

                                {/* Top Vendedores */}
                                <Card className="border-sky-100 bg-white/90 shadow-sm">
                                    <CardHeader>
                                        <CardTitle className="text-sky-900">
                                            Top Vendedores
                                        </CardTitle>
                                        <CardDescription className="text-sky-700/90">
                                            Por valor de contratos assinados
                                        </CardDescription>
                                    </CardHeader>
                                    <CardContent>
                                        <div className="space-y-3">
                                            {(data?.topSellers || []).map(
                                                (s: any, i: number) => (
                                                    <div
                                                        key={s.userId}
                                                        className="flex items-center justify-between p-3 border border-sky-100 rounded-lg bg-sky-50/40"
                                                    >
                                                        <div className="flex items-center gap-3">
                                                            <Badge
                                                                variant={
                                                                    i === 0
                                                                        ? 'default'
                                                                        : i ===
                                                                          1
                                                                        ? 'secondary'
                                                                        : 'outline'
                                                                }
                                                                className={
                                                                    i === 0
                                                                        ? 'bg-sky-600 text-white'
                                                                        : i ===
                                                                          1
                                                                        ? 'bg-sky-100 text-sky-800'
                                                                        : 'border-sky-200 text-sky-800'
                                                                }
                                                            >
                                                                {i + 1}º
                                                            </Badge>
                                                            <div>
                                                                <div className="font-medium text-sky-950">
                                                                    {s.name}
                                                                </div>
                                                                <div className="text-xs text-sky-700/80">
                                                                    {s.email}
                                                                </div>
                                                            </div>
                                                        </div>
                                                        <div className="text-right">
                                                            <div className="font-bold text-sky-950">
                                                                {formatarMoedaBR(
                                                                    s.totalValue
                                                                )}
                                                            </div>
                                                            <div className="text-xs text-sky-700/80">
                                                                {s.count}{' '}
                                                                contratos
                                                            </div>
                                                        </div>
                                                    </div>
                                                )
                                            )}
                                            {(!data?.topSellers ||
                                                data.topSellers.length ===
                                                    0) && (
                                                <div className="text-center text-sm text-sky-700/80 py-6">
                                                    Sem vendas no período
                                                </div>
                                            )}
                                        </div>
                                    </CardContent>
                                </Card>
                            </div>
                        </TabsContent>

                        {/* Equipe */}
                        <TabsContent value="team" className="space-y-4">
                            {(isAdmin || isDirector) && (
                                <Card className="border-sky-100 bg-white/90 shadow-sm">
                                    <CardHeader>
                                        <CardTitle className="text-sky-900">
                                            Leads por Gestor
                                        </CardTitle>
                                        <CardDescription className="text-sky-700/90">
                                            Total do gestor + consultores
                                            (período selecionado)
                                        </CardDescription>
                                    </CardHeader>
                                    <CardContent>
                                        <div className="h-72">
                                            <ResponsiveContainer
                                                width="100%"
                                                height="100%"
                                            >
                                                <BarChart
                                                    data={(
                                                        data?.managersBreakdown ||
                                                        []
                                                    ).map((m: any) => ({
                                                        name: m.manager.name,
                                                        leads: m.totalLeads,
                                                        proposals:
                                                            m.totalProposals,
                                                    }))}
                                                >
                                                    <CartesianGrid
                                                        strokeDasharray="3 3"
                                                        vertical={false}
                                                    />
                                                    <XAxis
                                                        dataKey="name"
                                                        tick={{ fontSize: 12 }}
                                                    />
                                                    <YAxis
                                                        tick={{ fontSize: 12 }}
                                                    />
                                                    <Tooltip />
                                                    <Legend />
                                                    <Bar
                                                        dataKey="leads"
                                                        name="Leads"
                                                        fill="#0ea5e9"
                                                    />
                                                    <Bar
                                                        dataKey="proposals"
                                                        name="Propostas"
                                                        fill="#22c55e"
                                                    />
                                                </BarChart>
                                            </ResponsiveContainer>
                                        </div>

                                        {/* Detalhe gestores */}
                                        <div className="mt-6 space-y-6">
                                            {(
                                                data?.managersBreakdown || []
                                            ).map((m: any) => (
                                                <div
                                                    key={m.manager.id}
                                                    className="border border-sky-100 rounded-xl p-4 bg-sky-50/40"
                                                >
                                                    <div className="flex items-center justify-between mb-3">
                                                        <div>
                                                            <div className="font-semibold text-sky-950">
                                                                {m.manager.name}
                                                            </div>
                                                            <div className="text-xs text-sky-700/80">
                                                                {
                                                                    m.manager
                                                                        .email
                                                                }
                                                            </div>
                                                        </div>
                                                        <div className="grid grid-cols-2 gap-6 text-sm text-right">
                                                            <div>
                                                                <div className="text-sky-700/80">
                                                                    Leads
                                                                    (Gestor)
                                                                </div>
                                                                <div className="font-bold text-sky-950">
                                                                    {
                                                                        m.managerLeads
                                                                    }
                                                                </div>
                                                            </div>
                                                            <div>
                                                                <div className="text-sky-700/80">
                                                                    Propostas
                                                                    (Gestor)
                                                                </div>
                                                                <div className="font-bold text-sky-950">
                                                                    {
                                                                        m.managerProposals
                                                                    }
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </div>
                                                    <div className="mt-2">
                                                        <div className="text-sm font-medium text-sky-900 mb-2">
                                                            Consultores do
                                                            Gestor
                                                        </div>
                                                        <div className="grid md:grid-cols-2 gap-3">
                                                            {m.consultants.map(
                                                                (c: any) => (
                                                                    <div
                                                                        className="flex items-center justify-between border border-sky-100 rounded-lg p-3 bg-white/80"
                                                                        key={
                                                                            c.id
                                                                        }
                                                                    >
                                                                        <div>
                                                                            <div className="font-medium text-sky-950">
                                                                                {
                                                                                    c.name
                                                                                }
                                                                            </div>
                                                                            <div className="text-xs text-sky-700/80">
                                                                                {
                                                                                    c.email
                                                                                }
                                                                            </div>
                                                                        </div>
                                                                        <div className="grid grid-cols-2 gap-6 text-right text-sm">
                                                                            <div>
                                                                                <div className="text-sky-700/80">
                                                                                    Leads
                                                                                </div>
                                                                                <div className="font-semibold text-sky-950">
                                                                                    {
                                                                                        c.leads
                                                                                    }
                                                                                </div>
                                                                            </div>
                                                                            <div>
                                                                                <div className="text-sky-700/80">
                                                                                    Propostas
                                                                                </div>
                                                                                <div className="font-semibold text-sky-950">
                                                                                    {
                                                                                        c.proposals
                                                                                    }
                                                                                </div>
                                                                            </div>
                                                                        </div>
                                                                    </div>
                                                                )
                                                            )}
                                                            {m.consultants
                                                                .length ===
                                                                0 && (
                                                                <div className="text-sm text-sky-700/80">
                                                                    Nenhum
                                                                    consultor
                                                                    associado
                                                                </div>
                                                            )}
                                                        </div>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </CardContent>
                                </Card>
                            )}

                            {/* Resumo consultores */}
                            <Card className="border-sky-100 bg-white/90 shadow-sm">
                                <CardHeader>
                                    <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                                        <div>
                                            <CardTitle className="text-sky-900">
                                                Resumo por Consultor
                                            </CardTitle>
                                            <CardDescription className="text-sky-700/90">
                                                Leads, Propostas e Assinaturas
                                                (escopo do seu perfil)
                                            </CardDescription>
                                        </div>
                                        <div className="flex flex-col gap-2 md:flex-row md:items-center md:gap-3">
                                            <input
                                                type="text"
                                                placeholder="Buscar por nome..."
                                                value={searchName}
                                                onChange={(e) =>
                                                    setSearchName(
                                                        e.target.value
                                                    )
                                                }
                                                className="border border-sky-200 bg-white/80 rounded-md px-3 py-2 text-sm flex-1 focus:outline-none focus:ring-2 focus:ring-sky-500/70 focus:border-sky-500"
                                            />

                                            <Select
                                                value={filterRole}
                                                onValueChange={setFilterRole}
                                            >
                                                <SelectTrigger className="w-40 border-sky-200 bg-white/80 focus:ring-sky-500 focus:border-sky-500">
                                                    <SelectValue placeholder="Filtrar por cargo" />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="all">
                                                        Todos
                                                    </SelectItem>
                                                    <SelectItem value="administrador">
                                                        Administrador
                                                    </SelectItem>
                                                    <SelectItem value="diretor">
                                                        Diretor
                                                    </SelectItem>
                                                    <SelectItem value="gerente">
                                                        Gerente
                                                    </SelectItem>
                                                    <SelectItem value="consultor">
                                                        Consultor
                                                    </SelectItem>
                                                </SelectContent>
                                            </Select>
                                        </div>
                                    </div>
                                </CardHeader>
                                <CardContent>
                                    <div className="grid gap-3">
                                        {(filteredConsultants || []).map(
                                            (u: any) => (
                                                <div
                                                    key={u.id}
                                                    className="flex items-center justify-between border border-sky-100 rounded-lg p-3 cursor-pointer bg-sky-50/40 hover:bg-sky-100/60 transition-colors"
                                                    onClick={() =>
                                                        setSelectedMember(u)
                                                    }
                                                >
                                                    <div>
                                                        <div className="font-medium text-sky-950">
                                                            {u.name}
                                                        </div>
                                                        <div className="text-xs text-sky-700/80">
                                                            {u.email} •{' '}
                                                            {u.position}
                                                        </div>
                                                    </div>
                                                    <div className="grid grid-cols-3 gap-8 text-right">
                                                        <div>
                                                            <div className="text-xs text-sky-700/80">
                                                                Leads
                                                            </div>
                                                            <div className="font-semibold text-sky-950">
                                                                {u.leads}
                                                            </div>
                                                        </div>
                                                        <div>
                                                            <div className="text-xs text-sky-700/80">
                                                                Propostas
                                                            </div>
                                                            <div className="font-semibold text-sky-950">
                                                                {u.proposals}
                                                            </div>
                                                        </div>
                                                        <div>
                                                            <div className="text-xs text-sky-700/80">
                                                                Assinaturas
                                                            </div>
                                                            <div className="font-semibold text-sky-950">
                                                                {u.signed}
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                            )
                                        )}
                                        {(!data?.consultantsSummary ||
                                            data.consultantsSummary.length ===
                                                0) && (
                                            <div className="text-center text-sm text-sky-700/80 py-6">
                                                Nenhum dado no período
                                            </div>
                                        )}
                                    </div>
                                </CardContent>
                            </Card>
                        </TabsContent>

                        {/* Leads */}
                        <TabsContent value="leads" className="space-y-4">
                            <Card className="border-sky-100 bg-white/90 shadow-sm">
                                <CardHeader className="pb-3">
                                    <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                                        <div>
                                            <CardTitle className="text-sky-900">
                                                Leads por Status
                                            </CardTitle>
                                            <CardDescription className="text-sky-700/90">
                                                Distribuição de leads por status
                                                e evolução diária no período
                                            </CardDescription>
                                        </div>
                                        <div className="grid grid-cols-3 gap-4 text-right">
                                            <div>
                                                <div className="text-xs text-sky-700/90">
                                                    Total
                                                </div>
                                                <div className="text-xl font-bold text-sky-950">
                                                    {leadsStats.total}
                                                </div>
                                            </div>
                                            <div>
                                                <div className="text-xs text-sky-700/90">
                                                    Média/dia
                                                </div>
                                                <div className="text-xl font-bold text-sky-950">
                                                    {leadsStats.avgPerDay.toFixed(
                                                        1
                                                    )}
                                                </div>
                                            </div>
                                            <div>
                                                <div className="text-xs text-sky-700/90">
                                                    Status + comum
                                                </div>
                                                <div className="text-sm font-semibold truncate max-w-[180px] text-sky-950">
                                                    {leadsStats.top
                                                        ? `${leadsStats.top.label} (${leadsStats.top.count})`
                                                        : '—'}
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </CardHeader>

                                {leadsStats.total === 0 ? (
                                    <CardContent className="py-10 text-center text-sm text-sky-700/80">
                                        Nenhum lead no período selecionado.
                                    </CardContent>
                                ) : (
                                    <CardContent className="space-y-8">
                                        <div className="grid gap-6 md:grid-cols-2">
                                            {/* Donut */}
                                            <div className="h-72">
                                                <ResponsiveContainer
                                                    width="100%"
                                                    height="100%"
                                                >
                                                    <RechartsPieChart>
                                                        <Pie
                                                            data={
                                                                leadsStats.byStatus
                                                            }
                                                            dataKey="count"
                                                            nameKey="label"
                                                            cx="50%"
                                                            cy="50%"
                                                            outerRadius="70%"
                                                            innerRadius="45%"
                                                            isAnimationActive
                                                            labelLine={false}
                                                            label={({
                                                                percent,
                                                                name,
                                                            }) =>
                                                                `${name} ${(
                                                                    percent *
                                                                    100
                                                                ).toFixed(0)}%`
                                                            }
                                                        >
                                                            {leadsStats.byStatus.map(
                                                                (
                                                                    s: any,
                                                                    i: number
                                                                ) => (
                                                                    <Cell
                                                                        key={`cell-${i}`}
                                                                        fill={
                                                                            s.color
                                                                        }
                                                                    />
                                                                )
                                                            )}
                                                        </Pie>
                                                        <Tooltip
                                                            formatter={(
                                                                value: any,
                                                                _n,
                                                                props: any
                                                            ) => [
                                                                value,
                                                                props?.payload
                                                                    ?.label ??
                                                                    'Status',
                                                            ]}
                                                        />
                                                        <Legend
                                                            verticalAlign="bottom"
                                                            height={36}
                                                        />
                                                    </RechartsPieChart>
                                                </ResponsiveContainer>
                                            </div>

                                            {/* Lista */}
                                            <div className="space-y-3">
                                                {leadsStats.byStatus.map(
                                                    (s: any) => (
                                                        <div
                                                            key={s.status}
                                                            className="flex items-center justify-between gap-4"
                                                        >
                                                            <div className="flex items-center gap-2 min-w-0">
                                                                <span
                                                                    className="inline-block h-2 w-2 rounded-full"
                                                                    style={{
                                                                        backgroundColor:
                                                                            s.color,
                                                                    }}
                                                                />
                                                                <span className="text-sm truncate text-sky-950">
                                                                    {s.label}
                                                                </span>
                                                            </div>
                                                            <div className="flex items-center gap-2 w-2/3">
                                                                <div className="w-full h-2 bg-sky-50 rounded">
                                                                    <div
                                                                        className="h-2 rounded"
                                                                        style={{
                                                                            width: `${s.pct.toFixed(
                                                                                2
                                                                            )}%`,
                                                                            backgroundColor:
                                                                                s.color,
                                                                        }}
                                                                    />
                                                                </div>
                                                                <div className="text-xs tabular-nums text-sky-700/90 w-20 text-right">
                                                                    {s.count} (
                                                                    {s.pct.toFixed(
                                                                        0
                                                                    )}
                                                                    %)
                                                                </div>
                                                            </div>
                                                        </div>
                                                    )
                                                )}
                                            </div>
                                        </div>

                                        {/* Evolução diária */}
                                        <div className="h-72">
                                            <ResponsiveContainer
                                                width="100%"
                                                height="100%"
                                            >
                                                <AreaChart
                                                    data={leadsStats.evolution}
                                                    margin={{
                                                        top: 8,
                                                        right: 16,
                                                        left: 0,
                                                        bottom: 8,
                                                    }}
                                                >
                                                    <CartesianGrid strokeDasharray="3 3" />
                                                    <XAxis
                                                        dataKey="date"
                                                        tick={{ fontSize: 12 }}
                                                    />
                                                    <YAxis
                                                        tick={{ fontSize: 12 }}
                                                    />
                                                    <Tooltip
                                                        labelFormatter={(l) =>
                                                            `Data: ${l}`
                                                        }
                                                    />
                                                    <Legend />
                                                    <Area
                                                        type="monotone"
                                                        dataKey="leads"
                                                        name="Leads"
                                                        stroke="#0ea5e9"
                                                        fill="#0ea5e9"
                                                        fillOpacity={0.2}
                                                    />
                                                </AreaChart>
                                            </ResponsiveContainer>
                                        </div>
                                    </CardContent>
                                )}
                            </Card>
                        </TabsContent>

                        {/* Propostas */}
                        <TabsContent value="proposals" className="space-y-4">
                            <Card className="border-sky-100 bg-white/90 shadow-sm">
                                <CardHeader className="pb-3">
                                    <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                                        <div>
                                            <CardTitle className="text-sky-900">
                                                Propostas por Estágio
                                            </CardTitle>
                                            <CardDescription className="text-sky-700/90">
                                                Distribuição por estágio e
                                                evolução diária de
                                                propostas/assinaturas
                                            </CardDescription>
                                        </div>
                                        <div className="grid grid-cols-3 gap-4 text-right">
                                            <div>
                                                <div className="text-xs text-sky-700/90">
                                                    Total
                                                </div>
                                                <div className="text-xl font-bold text-sky-950">
                                                    {proposalsStats.total}
                                                </div>
                                            </div>
                                            <div>
                                                <div className="text-xs text-sky-700/90">
                                                    Média/dia
                                                </div>
                                                <div className="text-xl font-bold text-sky-950">
                                                    {proposalsStats.avgPerDay.toFixed(
                                                        1
                                                    )}
                                                </div>
                                            </div>
                                            <div>
                                                <div className="text-xs text-sky-700/90">
                                                    Conversão
                                                </div>
                                                <div className="text-xl font-bold text-sky-950">
                                                    {formatarPorcentagem(
                                                        proposalsStats.winRate ||
                                                            0
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </CardHeader>

                                {proposalsStats.total === 0 ? (
                                    <CardContent className="py-10 text-center text-sm text-sky-700/80">
                                        Nenhuma proposta no período selecionado.
                                    </CardContent>
                                ) : (
                                    <CardContent className="space-y-8">
                                        <div className="grid gap-6 md:grid-cols-2">
                                            {/* Donut */}
                                            <div className="h-72">
                                                <ResponsiveContainer
                                                    width="100%"
                                                    height="100%"
                                                >
                                                    <RechartsPieChart>
                                                        <Pie
                                                            data={
                                                                proposalsStats.byStage
                                                            }
                                                            dataKey="count"
                                                            nameKey="label"
                                                            cx="50%"
                                                            cy="50%"
                                                            outerRadius="70%"
                                                            innerRadius="45%"
                                                            isAnimationActive
                                                            labelLine={false}
                                                            label={({
                                                                percent,
                                                                name,
                                                            }) =>
                                                                `${name} ${(
                                                                    percent *
                                                                    100
                                                                ).toFixed(0)}%`
                                                            }
                                                        >
                                                            {proposalsStats.byStage.map(
                                                                (
                                                                    s: any,
                                                                    i: number
                                                                ) => (
                                                                    <Cell
                                                                        key={`cell-prop-${i}`}
                                                                        fill={
                                                                            s.color
                                                                        }
                                                                    />
                                                                )
                                                            )}
                                                        </Pie>
                                                        <Tooltip
                                                            formatter={(
                                                                value: any,
                                                                _n,
                                                                props: any
                                                            ) => [
                                                                value,
                                                                props?.payload
                                                                    ?.label ??
                                                                    'Estágio',
                                                            ]}
                                                        />
                                                        <Legend
                                                            verticalAlign="bottom"
                                                            height={36}
                                                        />
                                                    </RechartsPieChart>
                                                </ResponsiveContainer>
                                            </div>

                                            {/* Lista + destaques */}
                                            <div className="space-y-3">
                                                {proposalsStats.byStage.map(
                                                    (s: any) => (
                                                        <div
                                                            key={s.stage}
                                                            className="flex items-center justify-between gap-4"
                                                        >
                                                            <div className="flex items-center gap-2 min-w-0">
                                                                <span
                                                                    className="inline-block h-2 w-2 rounded-full"
                                                                    style={{
                                                                        backgroundColor:
                                                                            s.color,
                                                                    }}
                                                                />
                                                                <span className="text-sm truncate text-sky-950">
                                                                    {s.label}
                                                                </span>
                                                            </div>
                                                            <div className="flex items-center gap-2 w-2/3">
                                                                <div className="w-full h-2 bg-sky-50 rounded">
                                                                    <div
                                                                        className="h-2 rounded"
                                                                        style={{
                                                                            width: `${s.pct.toFixed(
                                                                                2
                                                                            )}%`,
                                                                            backgroundColor:
                                                                                s.color,
                                                                        }}
                                                                    />
                                                                </div>
                                                                <div className="text-xs tabular-nums text-sky-700/90 w-24 text-right">
                                                                    {s.count} (
                                                                    {s.pct.toFixed(
                                                                        0
                                                                    )}
                                                                    %)
                                                                </div>
                                                            </div>
                                                        </div>
                                                    )
                                                )}

                                                <div className="mt-4 grid grid-cols-2 gap-4">
                                                    <div className="rounded-lg border border-sky-100 bg-sky-50/60 p-3">
                                                        <div className="text-xs text-sky-700/90">
                                                            Assinadas
                                                        </div>
                                                        <div className="text-lg font-semibold text-sky-950">
                                                            {
                                                                proposalsStats.signed
                                                            }
                                                        </div>
                                                    </div>
                                                    <div className="rounded-lg border border-sky-100 bg-sky-50/60 p-3">
                                                        <div className="text-xs text-sky-700/90">
                                                            Estágio + comum
                                                        </div>
                                                        <div className="text-sm font-semibold truncate text-sky-950">
                                                            {proposalsStats.top
                                                                ? `${proposalsStats.top.label} (${proposalsStats.top.count})`
                                                                : '—'}
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Evolução diária */}
                                        <div className="h-72">
                                            <ResponsiveContainer
                                                width="100%"
                                                height="100%"
                                            >
                                                <AreaChart
                                                    data={
                                                        proposalsStats.evolution
                                                    }
                                                    margin={{
                                                        top: 8,
                                                        right: 16,
                                                        left: 0,
                                                        bottom: 8,
                                                    }}
                                                >
                                                    <CartesianGrid strokeDasharray="3 3" />
                                                    <XAxis
                                                        dataKey="date"
                                                        tick={{ fontSize: 12 }}
                                                    />
                                                    <YAxis
                                                        tick={{ fontSize: 12 }}
                                                    />
                                                    <Tooltip
                                                        labelFormatter={(l) =>
                                                            `Data: ${l}`
                                                        }
                                                    />
                                                    <Legend />
                                                    <Area
                                                        type="monotone"
                                                        dataKey="proposals"
                                                        name="Propostas"
                                                        stroke="#6366f1"
                                                        fill="#6366f1"
                                                        fillOpacity={0.18}
                                                    />
                                                    <Area
                                                        type="monotone"
                                                        dataKey="signed"
                                                        name="Assinaturas"
                                                        stroke="#10b981"
                                                        fill="#10b981"
                                                        fillOpacity={0.18}
                                                    />
                                                </AreaChart>
                                            </ResponsiveContainer>
                                        </div>
                                    </CardContent>
                                )}
                            </Card>
                        </TabsContent>
                    </Tabs>

                    {/* Modal membro */}
                    <Dialog
                        open={!!selectedMember}
                        onOpenChange={() => setSelectedMember(null)}
                    >
                        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto border-sky-100 bg-white/95">
                            <DialogHeader>
                                <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                                    <DialogTitle className="text-sky-950">
                                        {selectedMember?.name}
                                    </DialogTitle>
                                    <Select
                                        value={period}
                                        onValueChange={setPeriod}
                                    >
                                        <SelectTrigger className="w-40 border-sky-200 bg-white/80 focus:ring-sky-500 focus:border-sky-500">
                                            <SelectValue placeholder="Período" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="hoje">
                                                Hoje
                                            </SelectItem>
                                            <SelectItem value="semana">
                                                Esta Semana
                                            </SelectItem>
                                            <SelectItem value="mes">
                                                Este Mês
                                            </SelectItem>
                                            <SelectItem value="trimestre">
                                                Trimestre
                                            </SelectItem>
                                            <SelectItem value="ano">
                                                Este Ano
                                            </SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                            </DialogHeader>

                            {loadingMemberStats ? (
                                <div className="text-center py-10">
                                    <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-sky-600 mx-auto"></div>
                                    <p className="mt-3 text-sky-700/90 text-sm">
                                        Carregando dados do consultor...
                                    </p>
                                </div>
                            ) : (
                                memberStats && (
                                    <div className="space-y-8">
                                        {/* KPIs */}
                                        <div className="grid gap-4 md:grid-cols-3">
                                            <Card className="border-sky-100 bg-sky-50/60">
                                                <CardHeader>
                                                    <CardTitle className="text-sm text-sky-900">
                                                        Leads
                                                    </CardTitle>
                                                </CardHeader>
                                                <CardContent>
                                                    <div className="text-2xl font-bold text-sky-950">
                                                        {memberStats?.totals
                                                            ?.leads || 0}
                                                    </div>
                                                </CardContent>
                                            </Card>
                                            <Card className="border-sky-100 bg-sky-50/60">
                                                <CardHeader>
                                                    <CardTitle className="text-sm text-sky-900">
                                                        Propostas
                                                    </CardTitle>
                                                </CardHeader>
                                                <CardContent>
                                                    <div className="text-2xl font-bold text-sky-950">
                                                        {memberStats?.totals
                                                            ?.proposals || 0}
                                                    </div>
                                                </CardContent>
                                            </Card>
                                            <Card className="border-sky-100 bg-sky-50/60">
                                                <CardHeader>
                                                    <CardTitle className="text-sm text-sky-900">
                                                        Assinaturas
                                                    </CardTitle>
                                                </CardHeader>
                                                <CardContent>
                                                    <div className="text-2xl font-bold text-sky-950">
                                                        {memberStats?.totals
                                                            ?.signed || 0}
                                                    </div>
                                                </CardContent>
                                            </Card>
                                        </div>

                                        {/* Gráficos */}
                                        <div className="grid md:grid-cols-2 gap-6">
                                            <Card className="border-sky-100 bg-white/90">
                                                <CardHeader>
                                                    <CardTitle className="text-sm text-sky-900">
                                                        Leads por Status
                                                    </CardTitle>
                                                </CardHeader>
                                                <CardContent className="h-64">
                                                    <ResponsiveContainer
                                                        width="100%"
                                                        height="100%"
                                                    >
                                                        <RechartsPieChart>
                                                            <Pie
                                                                data={
                                                                    memberStats?.leadsByStatus ||
                                                                    []
                                                                }
                                                                dataKey="count"
                                                                nameKey="label"
                                                                cx="50%"
                                                                cy="50%"
                                                                outerRadius="70%"
                                                                innerRadius="40%"
                                                                isAnimationActive
                                                                labelLine={
                                                                    false
                                                                }
                                                                label={({
                                                                    name,
                                                                    percent,
                                                                }) =>
                                                                    `${name} ${(
                                                                        percent *
                                                                        100
                                                                    ).toFixed(
                                                                        0
                                                                    )}%`
                                                                }
                                                            >
                                                                {(
                                                                    memberStats?.leadsByStatus ||
                                                                    []
                                                                ).map(
                                                                    (
                                                                        _: any,
                                                                        i: number
                                                                    ) => (
                                                                        <Cell
                                                                            key={`cell-lead-${i}`}
                                                                            fill={
                                                                                [
                                                                                    '#0ea5e9',
                                                                                    '#22c55e',
                                                                                    '#f59e0b',
                                                                                    '#ef4444',
                                                                                ][
                                                                                    i %
                                                                                        4
                                                                                ]
                                                                            }
                                                                        />
                                                                    )
                                                                )}
                                                            </Pie>
                                                            <Tooltip
                                                                formatter={(
                                                                    v
                                                                ) => [
                                                                    v,
                                                                    'Qtd.',
                                                                ]}
                                                            />
                                                            <Legend
                                                                verticalAlign="bottom"
                                                                height={36}
                                                            />
                                                        </RechartsPieChart>
                                                    </ResponsiveContainer>
                                                </CardContent>
                                            </Card>

                                            <Card className="border-sky-100 bg-white/90">
                                                <CardHeader>
                                                    <CardTitle className="text-sm text-sky-900">
                                                        Propostas por Estágio
                                                    </CardTitle>
                                                </CardHeader>
                                                <CardContent className="h-64">
                                                    <ResponsiveContainer
                                                        width="100%"
                                                        height="100%"
                                                    >
                                                        <RechartsPieChart>
                                                            <Pie
                                                                data={
                                                                    memberStats?.proposalsByStage ||
                                                                    []
                                                                }
                                                                dataKey="count"
                                                                nameKey="label"
                                                                cx="50%"
                                                                cy="50%"
                                                                outerRadius="70%"
                                                                innerRadius="40%"
                                                                isAnimationActive
                                                                labelLine={
                                                                    false
                                                                }
                                                                label={({
                                                                    name,
                                                                    percent,
                                                                }) =>
                                                                    `${name} ${(
                                                                        percent *
                                                                        100
                                                                    ).toFixed(
                                                                        0
                                                                    )}%`
                                                                }
                                                            >
                                                                {(
                                                                    memberStats?.proposalsByStage ||
                                                                    []
                                                                ).map(
                                                                    (
                                                                        _: any,
                                                                        i: number
                                                                    ) => (
                                                                        <Cell
                                                                            key={`cell-prop-${i}`}
                                                                            fill={
                                                                                [
                                                                                    '#10b981',
                                                                                    '#6366f1',
                                                                                    '#f97316',
                                                                                    '#dc2626',
                                                                                ][
                                                                                    i %
                                                                                        4
                                                                                ]
                                                                            }
                                                                        />
                                                                    )
                                                                )}
                                                            </Pie>
                                                            <Tooltip
                                                                formatter={(
                                                                    v
                                                                ) => [
                                                                    v,
                                                                    'Qtd.',
                                                                ]}
                                                            />
                                                            <Legend
                                                                verticalAlign="bottom"
                                                                height={36}
                                                            />
                                                        </RechartsPieChart>
                                                    </ResponsiveContainer>
                                                </CardContent>
                                            </Card>
                                        </div>

                                        {/* Série temporal individual */}
                                        <Card className="border-sky-100 bg-white/90">
                                            <CardHeader>
                                                <CardTitle className="text-sm text-sky-900">
                                                    Evolução no Período
                                                </CardTitle>
                                                <CardDescription className="text-sky-700/90">
                                                    Distribuição diária de
                                                    leads, propostas e
                                                    assinaturas
                                                </CardDescription>
                                            </CardHeader>
                                            <CardContent className="h-72">
                                                <ResponsiveContainer
                                                    width="100%"
                                                    height="100%"
                                                >
                                                    <LineChart
                                                        data={
                                                            memberStats?.evolution ||
                                                            []
                                                        }
                                                    >
                                                        <CartesianGrid strokeDasharray="3 3" />
                                                        <XAxis
                                                            dataKey="date"
                                                            tick={{
                                                                fontSize: 12,
                                                            }}
                                                        />
                                                        <YAxis
                                                            tick={{
                                                                fontSize: 12,
                                                            }}
                                                        />
                                                        <Tooltip />
                                                        <Legend />
                                                        <Line
                                                            type="monotone"
                                                            dataKey="leads"
                                                            stroke="#0ea5e9"
                                                            name="Leads"
                                                            strokeWidth={2}
                                                        />
                                                        <Line
                                                            type="monotone"
                                                            dataKey="proposals"
                                                            stroke="#22c55e"
                                                            name="Propostas"
                                                            strokeWidth={2}
                                                        />
                                                        <Line
                                                            type="monotone"
                                                            dataKey="signed"
                                                            stroke="#f59e0b"
                                                            name="Assinaturas"
                                                            strokeWidth={2}
                                                        />
                                                    </LineChart>
                                                </ResponsiveContainer>
                                            </CardContent>
                                        </Card>
                                    </div>
                                )
                            )}
                        </DialogContent>
                    </Dialog>
                </div>
            </div>
        </PermissionProtectedRoute>
    );
}
