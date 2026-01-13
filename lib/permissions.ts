// Tipos para os papéis e permissões
// lib/permissions.ts
export type Role = 'usuario' | 'gerente' | 'admin' | 'administrador';

export type Permissao = {
    dashboard: boolean;
    whatsapp: boolean;
    propostas: boolean;
    simuladores: boolean;
    relatorios: boolean;
    campanhas: boolean;
    equipe: boolean;
    configuracoes: boolean;
};

export type PermissoesPorRole = {
    usuario: Permissao;
    gerente: Permissao;
    administrador?: Permissao; // opcional, pois admin sempre tem tudo
};

// Função para checar se o usuário pode acessar determinada funcionalidade
export function podeAcessar(
    role: Role,
    permissao: keyof Permissao,
    permissoes: PermissoesPorRole
): boolean {
    if (role === 'admin' || role === 'administrador') return true;
    if (role === 'gerente') {
        return permissoes.gerente[permissao] || permissoes.usuario[permissao];
    }
    return permissoes.usuario[permissao];
}

// Função mock para obter usuário autenticado e role (substitua por integração real depois)
export async function getAuthenticatedUser(req: any) {
    // Exemplo: buscar de cookie, header, etc. Aqui é simulado.
    // Retorne { id, role, teamId }
    return {
        id: 'user1',
        role: 'gerente', // Troque para 'usuario', 'gerente' ou 'administrador' para testar
        teamId: 'team1',
    };
}
