"use client";

import {
  Activity,
  Bot,
  Calendar,
  FileText,
  Home,
  LogOut,
  MessageCircle,
  Send,
  Settings,
  Shield,
  UserCog,
  Users,
} from "lucide-react";

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";
import { PermissoesPorRole, podeAcessar, Role } from "@/lib/permissions";
import { signOut, useSession } from "next-auth/react";
import Link from "next/link";
import { usePathname } from "next/navigation";

// Permissões mockadas (substitua por dados reais do banco depois)
const permissoes: PermissoesPorRole = {
  usuario: {
    dashboard: true,
    whatsapp: true,
    propostas: true,
    simuladores: true,
    relatorios: true,
    campanhas: true,
    equipe: false,
    configuracoes: false,
  },
  gerente: {
    dashboard: true,
    whatsapp: true,
    propostas: true,
    simuladores: true,
    relatorios: true,
    campanhas: true,
    equipe: true,
    configuracoes: true,
  },
};

type MenuItem = {
  title: string;
  url: string;
  icon: any;
  badge: string | null;
  permissao: string | null | "";
  match?: "exact" | "segment";
};

// checa rota ativa
const isRouteActive = (pathname: string, item: MenuItem) => {
  const clean = (s: string) => s.replace(/\/+$/, "");
  const p = clean(pathname);
  const u = clean(item.url);

  if (item.match === "exact") {
    return p === u;
  }
  return p === u || p.startsWith(u + "/");
};

const menuItems: MenuItem[] = [
  {
    title: "Início",
    url: "/dashboard/dashboard",
    icon: Home,
    badge: null,
    permissao: "",
    match: "exact",
  },
  {
    title: "Atendimento",
    url: "/dashboard/whatsapp",
    icon: MessageCircle,
    badge: null,
    permissao: "whatsapp",
    match: "segment",
  },
  {
    title: "Campanhas Ativas",
    url: "/dashboard/active-page",
    icon: Send,
    badge: null,
    permissao: "campanhas",
    match: "segment",
  },
  // {
  //     title: 'IA (Agnes)',
  //     url: '/dashboard/agnes',
  //     icon: Bot,
  //     badge: null,
  //     permissao: null,
  //     match: 'segment',
  // },
  {
    title: "Leads & Contatos",
    url: "/dashboard/leads",
    icon: Users,
    badge: null,
    permissao: null,
    match: "segment",
  },
  // {
  //     title: 'Propostas',
  //     url: '/dashboard/propostas',
  //     icon: TrendingUp,
  //     badge: null,
  //     permissao: 'propostas',
  //     match: 'segment',
  // },
  // {
  //     title: 'Propostas Recebidas',
  //     url: '/admin/propostas-recebidas',
  //     icon: FileText,
  //     badge: null,
  //     permissao: 'admin',
  //     match: 'segment',
  // },
  {
    title: "Propostas Enviadas",
    url: "/dashboard/propostas/enviadas",
    icon: FileText,
    badge: null,
    permissao: "propostas_enviadas",
    match: "segment",
  },
  // {
  //     title: 'Simulador',
  //     url: '/dashboard/simulador',
  //     icon: Calculator,
  //     badge: null,
  //     permissao: 'simuladores',
  //     match: 'segment',
  // },
  {
    title: "Conexões",
    url: "/dashboard/conexoes",
    icon: Send,
    badge: null,
    permissao: null,
    match: "segment",
  },
  {
    title: "Minha Conta",
    url: "/dashboard/conta",
    icon: Settings,
    badge: null,
    permissao: null,
    match: "segment",
  },
  {
    title: "Gestão de equipe",
    url: "/dashboard/team",
    icon: UserCog,
    badge: null,
    permissao: null,
    match: "segment",
  },
  {
    title: "Agenda",
    url: "/dashboard/agenda",
    icon: Calendar,
    badge: null,
    permissao: null,
    match: "segment",
  },
  {
    title: "Configurações da IA",
    url: "/dashboard/ai-config",
    icon: Bot,
    badge: null,
    permissao: null,
    match: "segment",
  },
];

// Links legais
const legalLinks = [
  {
    title: "Política de Privacidade",
    url: "/politica-privacidade",
    icon: Shield,
    badge: null,
    permissao: null,
    match: "exact" as const,
  },
  {
    title: "Termos de Serviço",
    url: "/termos-servico",
    icon: FileText,
    badge: null,
    permissao: null,
    match: "exact" as const,
  },
];

export function AppSidebar() {
  const pathname = usePathname();
  const { data: session } = useSession();

  return (
    <Sidebar
      className="border-r bg-gradient-to-b from-sky-50 via-white to-white shadow-sm min-w-[16rem]"
      collapsible="offcanvas"
    >
      {/* HEADER */}
      <SidebarHeader className="p-4 border-b bg-white/80 backdrop-blur-sm">
        <Link
          href="/dashboard"
          onClick={(e) => e.stopPropagation()}
          className="flex items-center gap-3"
        >
          <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-sky-600 shadow-md">
            {/* se quiser manter a imagem, troque pelo <img /> */}
            <Activity className="h-6 w-6 text-white" />
          </div>
          <div className="grid flex-1 text-left leading-tight">
            <span className="truncate font-semibold text-base text-sky-950">
              Odonto Clinic
            </span>
            <span className="truncate text-xs text-sky-700/80">
              Sistema de Gestão Odontológica
            </span>
          </div>
        </Link>
      </SidebarHeader>

      {/* CONTEÚDO */}
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              {menuItems
                .filter((item) => {
                  if (!item.permissao) return true;
                  if (!session?.user) return false;

                  if (item.permissao === "propostas_enviadas") {
                    return (
                      session.user.role &&
                      session.user.role.toLowerCase() !== "administrador" &&
                      session.user.role.toLowerCase() !== "admin"
                    );
                  }

                  if (item.permissao === "admin") {
                    return (
                      session.user.role === "admin" ||
                      session.user.role === "administrador"
                    );
                  }

                  return podeAcessar(
                    session.user.role as Role,
                    item.permissao as keyof typeof permissoes.usuario,
                    permissoes
                  );
                })
                .map((item) => {
                  const active = isRouteActive(pathname, item);
                  const Icon = item.icon;

                  return (
                    <SidebarMenuItem key={item.title}>
                      <SidebarMenuButton
                        asChild
                        isActive={active}
                        className={`
                          group relative rounded-lg px-3 py-2 text-sm font-medium
                          text-sky-900/80 transition-all
                          hover:bg-sky-50 hover:text-sky-900
                          data-[active=true]:bg-sky-600 data-[active=true]:text-white
                          data-[active=true]:shadow-md
                          before:content-[''] before:absolute before:left-0 before:top-1 before:bottom-1 before:w-1.5 before:rounded-full
                          data-[active=true]:before:bg-sky-500
                        `}
                      >
                        <Link
                          href={item.url}
                          className="flex items-center gap-2"
                        >
                          <Icon className="h-4 w-4 shrink-0 text-sky-400 group-hover:text-sky-500 group-data-[active=true]:text-white" />
                          <span className="truncate">{item.title}</span>
                          {item.badge && (
                            <span
                              className="ml-auto rounded-full px-2 py-0.5 text-xs font-medium
                                bg-sky-100 text-sky-700
                                group-data-[active=true]:bg-white group-data-[active=true]:text-sky-700"
                            >
                              {item.badge}
                            </span>
                          )}
                        </Link>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  );
                })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      {/* FOOTER */}
      <SidebarFooter className="p-4 border-t bg-white/80 backdrop-blur-sm">
        <SidebarMenu>
          {/* labelzinha suave */}
          <div className="px-3 pb-2 text-[11px] font-medium uppercase tracking-[0.12em] text-sky-500">
            Sobre
          </div>

          {legalLinks.map((item) => {
            const active = isRouteActive(pathname, item);
            const Icon = item.icon;

            return (
              <SidebarMenuItem key={item.title}>
                <SidebarMenuButton
                  asChild
                  isActive={active}
                  className="group relative rounded-lg px-3 py-2 text-xs text-sky-900/80 transition hover:bg-sky-50"
                >
                  <Link
                    href={item.url}
                    className="flex items-center gap-2 text-sky-800/80"
                  >
                    <Icon className="h-4 w-4 shrink-0 text-sky-400 group-hover:text-sky-500" />
                    <span className="truncate">{item.title}</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            );
          })}

          {/* Botão Sair */}
          <SidebarMenuItem>
            <SidebarMenuButton asChild>
              <button
                onClick={() => {
                  // evita usar NEXTAUTH_URL de produção no dev
                  signOut({ redirect: false });
                  window.location.href = "/login";
                }}
                className="mt-2 flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium
                  text-red-600 hover:text-red-700 hover:bg-red-50 transition"
              >
                <LogOut className="h-4 w-4" />
                <span>Sair</span>
              </button>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  );
}
