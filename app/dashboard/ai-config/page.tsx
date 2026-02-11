'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Save } from 'lucide-react';

interface AIConfig {
    id: string | null;
    userId: string;
    assistantName: string;
    assistantRole: string;
    assistantTeam: string;
    assistantContext: string;
    greetingMessage: string;
    appointmentFlow: string;
    confirmationMessage: string;
    generalRules: string;
}

export default function AIConfigPage() {
    const { data: session, status } = useSession();
    const { toast } = useToast();
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [config, setConfig] = useState<AIConfig | null>(null);

    useEffect(() => {
        if (status === 'authenticated') {
            loadConfig();
        }
    }, [status]);

    const loadConfig = async () => {
        try {
            setLoading(true);
            const response = await fetch('/api/ai-config');
            if (response.ok) {
                const data = await response.json();
                setConfig(data);
            } else {
                toast({
                    title: 'Erro',
                    description: 'Não foi possível carregar as configurações',
                    variant: 'destructive',
                });
            }
        } catch (error) {
            console.error('Erro ao carregar configurações:', error);
            toast({
                title: 'Erro',
                description: 'Erro ao carregar configurações',
                variant: 'destructive',
            });
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async () => {
        if (!config) return;

        try {
            setSaving(true);
            const response = await fetch('/api/ai-config', {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(config),
            });

            if (response.ok) {
                toast({
                    title: 'Sucesso',
                    description: 'Configurações salvas com sucesso!',
                });
            } else {
                const error = await response.json();
                toast({
                    title: 'Erro',
                    description: error.error || 'Erro ao salvar configurações',
                    variant: 'destructive',
                });
            }
        } catch (error) {
            console.error('Erro ao salvar configurações:', error);
            toast({
                title: 'Erro',
                description: 'Erro ao salvar configurações',
                variant: 'destructive',
            });
        } finally {
            setSaving(false);
        }
    };

    const handleChange = (field: keyof AIConfig, value: string) => {
        if (config) {
            setConfig({ ...config, [field]: value });
        }
    };

    if (status === 'loading' || loading) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <Loader2 className="h-8 w-8 animate-spin text-sky-600" />
            </div>
        );
    }

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

    if (!config) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <div className="text-center">
                    <h2 className="text-2xl font-bold text-gray-900 mb-4">
                        Erro ao carregar configurações
                    </h2>
                </div>
            </div>
        );
    }

    return (
        <div className="flex-1 space-y-4 p-8 pt-6">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-3xl font-bold tracking-tight">
                        Configurações da IA
                    </h2>
                    <p className="text-muted-foreground mt-1">
                        Configure o comportamento e as respostas da assistente virtual Melissa
                    </p>
                </div>
                <Button onClick={handleSave} disabled={saving}>
                    {saving ? (
                        <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Salvando...
                        </>
                    ) : (
                        <>
                            <Save className="mr-2 h-4 w-4" />
                            Salvar
                        </>
                    )}
                </Button>
            </div>

            <div className="grid gap-6">
                {/* Informações Básicas */}
                <Card>
                    <CardHeader>
                        <CardTitle>Informações Básicas</CardTitle>
                        <CardDescription>
                            Configure o nome, papel e equipe da assistente
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="assistantName">Nome da Assistente</Label>
                            <Input
                                id="assistantName"
                                value={config.assistantName}
                                onChange={(e) => handleChange('assistantName', e.target.value)}
                                placeholder="Ex: Melissa"
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="assistantRole">Papel/Função</Label>
                            <Input
                                id="assistantRole"
                                value={config.assistantRole}
                                onChange={(e) => handleChange('assistantRole', e.target.value)}
                                placeholder="Ex: assistente virtual"
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="assistantTeam">Equipe</Label>
                            <Input
                                id="assistantTeam"
                                value={config.assistantTeam}
                                onChange={(e) => handleChange('assistantTeam', e.target.value)}
                                placeholder="Ex: equipe do Dr. Marcelo"
                            />
                        </div>
                    </CardContent>
                </Card>

                {/* Mensagem de Saudação */}
                <Card>
                    <CardHeader>
                        <CardTitle>Mensagem de Saudação</CardTitle>
                        <CardDescription>
                            A mensagem inicial que a assistente envia ao paciente
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-2">
                            <Label htmlFor="greetingMessage">Mensagem</Label>
                            <Textarea
                                id="greetingMessage"
                                value={config.greetingMessage}
                                onChange={(e) => handleChange('greetingMessage', e.target.value)}
                                placeholder="Ex: Olá! Eu me chamo Melissa😊, faço parte da equipe do Dr. Marcelo. Como posso te ajudar hoje?"
                                rows={4}
                            />
                        </div>
                    </CardContent>
                </Card>

                {/* Contexto da Assistente */}
                <Card>
                    <CardHeader>
                        <CardTitle>Contexto da Assistente</CardTitle>
                        <CardDescription>
                            Informações sobre consultas, agendamentos e serviços oferecidos
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-2">
                            <Label htmlFor="assistantContext">Contexto</Label>
                            <Textarea
                                id="assistantContext"
                                value={config.assistantContext}
                                onChange={(e) => handleChange('assistantContext', e.target.value)}
                                placeholder="Descreva como funcionam as consultas, valores, etc."
                                rows={12}
                            />
                        </div>
                    </CardContent>
                </Card>

                {/* Fluxo de Agendamento */}
                <Card>
                    <CardHeader>
                        <CardTitle>Fluxo de Agendamento</CardTitle>
                        <CardDescription>
                            Instruções sobre como a assistente deve conduzir o agendamento
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-2">
                            <Label htmlFor="appointmentFlow">Instruções do Fluxo</Label>
                            <Textarea
                                id="appointmentFlow"
                                value={config.appointmentFlow}
                                onChange={(e) => handleChange('appointmentFlow', e.target.value)}
                                placeholder="Descreva o passo a passo do agendamento"
                                rows={8}
                            />
                        </div>
                    </CardContent>
                </Card>

                {/* Mensagem de Confirmação */}
                <Card>
                    <CardHeader>
                        <CardTitle>Mensagem de Confirmação</CardTitle>
                        <CardDescription>
                            Mensagem enviada após confirmar o agendamento
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-2">
                            <Label htmlFor="confirmationMessage">Mensagem</Label>
                            <Textarea
                                id="confirmationMessage"
                                value={config.confirmationMessage}
                                onChange={(e) => handleChange('confirmationMessage', e.target.value)}
                                placeholder="Ex: ✅ Consulta marcada para {NOME} no dia {DIA} às {HORÁRIO}."
                                rows={6}
                            />
                        </div>
                    </CardContent>
                </Card>

                {/* Regras Gerais */}
                <Card>
                    <CardHeader>
                        <CardTitle>Regras Gerais</CardTitle>
                        <CardDescription>
                            Diretrizes gerais de comportamento da assistente
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-2">
                            <Label htmlFor="generalRules">Regras</Label>
                            <Textarea
                                id="generalRules"
                                value={config.generalRules}
                                onChange={(e) => handleChange('generalRules', e.target.value)}
                                placeholder="Ex: Mensagens curtas, em tom de WhatsApp. Não invente preços diferentes dos informados."
                                rows={6}
                            />
                        </div>
                    </CardContent>
                </Card>
            </div>

            <div className="flex justify-end">
                <Button onClick={handleSave} disabled={saving} size="lg">
                    {saving ? (
                        <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Salvando...
                        </>
                    ) : (
                        <>
                            <Save className="mr-2 h-4 w-4" />
                            Salvar Configurações
                        </>
                    )}
                </Button>
            </div>
        </div>
    );
}

