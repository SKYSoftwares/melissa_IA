'use client';

import { signOut, useSession } from 'next-auth/react';
import React, {
    createContext,
    useContext,
    useEffect,
    useMemo,
    useState,
} from 'react';

interface User {
    id: string;
    name: string;
    email: string;
    role: string;
    phone: string;
}

interface AuthContextType {
    user: User | null;
    isLoading: boolean;
    logout: () => void;
    isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
    const { data: session, status } = useSession();
    const [user, setUser] = useState<User | null>(null);

    // sempre que a session mudar, atualiza o user do contexto
    useEffect(() => {
        if (status === 'loading') return;

        if (session?.user?.email) {
            const merged: User = {
                id: session.user.id,
                name: session.user.name || '',
                email: session.user.email,
                role: (session.user as any).role || '',
                phone: (session.user as any).phone || '',
            };
            setUser(merged);
            // opcional: mantém compat com seu localStorage
            localStorage.setItem('user', JSON.stringify(merged));
        } else {
            setUser(null);
            localStorage.removeItem('user');
        }
    }, [session, status]);

    const logout = () => {
        // limpar estado local (opcional, o signOut já zera a session)
        setUser(null);
        localStorage.removeItem('user');
        signOut({ callbackUrl: '/login' });
    };

    const value = useMemo(
        () => ({
            user,
            isLoading: status === 'loading',
            logout,
            isAuthenticated: !!user,
        }),
        [user, status]
    );

    return (
        <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
    );
}

export function useAuth() {
    const ctx = useContext(AuthContext);
    if (!ctx) throw new Error('useAuth deve ser usado dentro de AuthProvider');
    return ctx;
}
