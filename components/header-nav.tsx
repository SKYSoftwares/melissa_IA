'use client';

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Input } from '@/components/ui/input';
import { SidebarTrigger } from '@/components/ui/sidebar';
import { Search, Settings, User } from 'lucide-react';
import { signOut, useSession } from 'next-auth/react';
import Link from 'next/link';

export function HeaderNav() {
    const { data: session, status } = useSession();

    if (status === 'loading') {
        return (
            <header className="top-0 z-40 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
                <div className="container flex h-14 items-center justify-between px-4">
                    <div className="flex items-center space-x-4">
                        {/* Botão de toggle do sidebar - visível apenas no mobile */}
                        <SidebarTrigger className="md:hidden" />
                        <div className="md:hidden h-8 w-8 rounded-full overflow-hidden">
                            <img
                                src="/images/zeus-capital-logo.png"
                                alt="Dr. Zeus Capital"
                                className="h-full w-full object-cover"
                            />
                        </div>
                        <div className="relative hidden md:block">
                            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                            <Input
                                placeholder="Buscar leads, propostas..."
                                className="pl-8 w-80"
                            />
                        </div>
                        {/* Barra de busca mobile - mais compacta */}
                        <div className="relative md:hidden">
                            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                            <Input
                                placeholder="Buscar..."
                                className="pl-8 w-40"
                            />
                        </div>
                    </div>
                    <div className="flex items-center space-x-4">
                        <div className="h-8 w-8 rounded-full bg-gray-200 animate-pulse"></div>
                    </div>
                </div>
            </header>
        );
    }

    return (
        <header className="top-0 z-40 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
            <div className="container flex h-14 items-center justify-between px-4">
                <div className="flex items-center space-x-4">
                    {/* Botão de toggle do sidebar - visível apenas no mobile */}
                    <SidebarTrigger className="md:hidden" />
                    <div className="md:hidden h-8 w-8 rounded-full overflow-hidden">
                        <img
                            src="/images/zeus-capital-logo.png"
                            alt="Dr. Zeus Capital"
                            className="h-full w-full object-cover"
                        />
                    </div>
                    <div className="relative hidden md:block">
                        <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                        <Input
                            placeholder="Buscar leads, propostas..."
                            className="pl-8 w-80"
                        />
                    </div>
                    {/* Barra de busca mobile - mais compacta */}
                    <div className="relative md:hidden">
                        <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                        <Input
                            placeholder="Buscar..."
                            className="pl-8 w-40"
                        />
                    </div>
                </div>

                <div className="flex items-center space-x-4">
                    {/* <Button variant="ghost" size="icon" className="relative">
            <Bell className="h-4 w-4" />
            <Badge className="absolute -top-1 -right-1 h-5 w-5 p-0 flex items-center justify-center text-xs">
              3
            </Badge>
          </Button> */}

                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button
                                variant="ghost"
                                className="relative h-8 w-8 rounded-full"
                            >
                                <Avatar className="h-8 w-8">
                                    <AvatarImage
                                        src={
                                            session?.user?.image ||
                                            '/images/avatar-placeholder.png'
                                        }
                                        alt={session?.user?.name || 'Avatar'}
                                    />
                                    <AvatarFallback>
                                        {session?.user?.name
                                            ? session.user.name
                                                  .charAt(0)
                                                  .toUpperCase()
                                            : 'U'}
                                    </AvatarFallback>
                                </Avatar>
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent
                            className="w-56"
                            align="end"
                            forceMount
                        >
                            <DropdownMenuLabel className="font-normal">
                                <div className="flex flex-col space-y-1">
                                    <p className="text-sm font-medium leading-none">
                                        {session?.user?.name || 'Admin User'}
                                    </p>
                                    <p className="text-xs leading-none text-muted-foreground">
                                        {session?.user?.email ||
                                            'admin@empresa.com'}
                                    </p>
                                </div>
                            </DropdownMenuLabel>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem asChild>
                                <Link
                                    href="/dashboard/perfil"
                                    className="flex w-full cursor-pointer"
                                >
                                    <User className="mr-2 h-4 w-4" />
                                    <span>Perfil</span>
                                </Link>
                            </DropdownMenuItem>
                            <DropdownMenuItem asChild>
                                <Link
                                    href="/dashboard/conta"
                                    className="flex w-full cursor-pointer"
                                >
                                    <Settings className="mr-2 h-4 w-4" />
                                    <span>Configurações</span>
                                </Link>
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                                className="cursor-pointer text-red-600 focus:text-red-600 focus:bg-red-50"
                                onClick={() =>
                                    signOut({ callbackUrl: '/login' })
                                }
                            >
                                Sair
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                </div>
            </div>
        </header>
    );
}
