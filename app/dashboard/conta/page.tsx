'use client';

import { Badge } from '@/components/ui/badge';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useSession } from 'next-auth/react';
import { ConfiguracoesTab } from './ConfiguracoesTab';

export default function ContaPage() {
    const { data: session, status } = useSession();
    const user = session?.user;

    // Se ainda está carregando, mostrar loading
    if (status === 'loading') {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
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
                <h2 className="text-3xl font-bold tracking-tight">
                    Minha Conta
                </h2>
                <Badge variant="secondary">{user?.role || 'Usuário'}</Badge>
            </div>

            <Tabs defaultValue="settings" className="space-y-4">
                <TabsList>
                    <TabsTrigger value="settings">Configurações</TabsTrigger>
                </TabsList>

                <ConfiguracoesTab user={user} />
            </Tabs>
        </div>
    );
}
