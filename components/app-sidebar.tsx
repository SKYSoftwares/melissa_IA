"use client";

import { useState } from "react";
import {
  Calendar,
  FileText,
  Home,
  LogOut,
  MessageCircle,
  Send,
  Settings,
  UserCog,
  Users,
  ChevronLeft,
  Stethoscope,
  Link2,
  CircleUser,
  Sparkles,
  BellRing,
} from "lucide-react";

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
} from "@/components/ui/sidebar";

import { usePathname } from "next/navigation";
import Link from "next/link";
import { useSession, signOut } from "next-auth/react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import { PermissoesPorRole, podeAcessar, Role } from "@/lib/permissions";
import { useEffect } from "react";

interface MenuItem {
  title: string;
  url: string;
  icon: React.ElementType;
  badge?: string | null;
  description?: string;
  permissao?: string | null;
}

interface MenuGroup {
  label: string;
  items: MenuItem[];
}

/* ================= MENU ORGANIZADO ================= */

const menuGroups: MenuGroup[] = [
  {
    label: "Meu Dia",
    items: [
      { title: "Painel Geral", url: "/dashboard/dashboard", icon: Home },
      { title: "Agenda", url: "/dashboard/agenda", icon: Calendar },
      {
        title: "Mensagens",
        url: "/dashboard/whatsapp",
        icon: MessageCircle,
        badge: null,
        permissao: "whatsapp",
      },
    ],
  },
  {
    label: "Pacientes",
    items: [
      { title: "Contatos & Leads", url: "/dashboard/leads", icon: Users },
      {
        title: "Propostas",
        url: "/dashboard/propostas/enviadas",
        icon: FileText,
        permissao: "propostas_enviadas",
      },
    ],
  },
  {
    label: "Marketing",
    items: [
      {
        title: "Campanhas",
        url: "/dashboard/active-page",
        icon: Send,
        permissao: "campanhas",
      },
      { title: "Conexões", url: "/dashboard/conexoes", icon: Link2 },
    ],
  },
  {
    label: "Inteligência",
    items: [
      { title: "Assistente IA", url: "/dashboard/ai-config", icon: Sparkles },
    ],
  },
];

const bottomItems: MenuItem[] = [
  { title: "Equipe", url: "/dashboard/team", icon: UserCog },
  { title: "Minha Conta", url: "/dashboard/conta", icon: Settings },
];

/* ================= PERMISSÕES MOCK ================= */

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

/* ================= COMPONENTE LINK ================= */

function SidebarLink({
  item,
  isActive,
  collapsed,
}: {
  item: MenuItem;
  isActive: boolean;
  collapsed: boolean;
}) {
  return (
    <Link
      href={item.url}
      className={cn(
        "group relative flex items-center gap-3 rounded-xl px-3 py-2.5 text-[13px] font-medium transition-all duration-150",
        collapsed && "justify-center px-2.5",
        isActive
          ? "text-white"
          : "text-sky-900/80 hover:bg-sky-50 hover:text-sky-900"
      )}
    >
      {isActive && (
        <motion.div
          layoutId="sidebar-active"
          className="absolute inset-0 rounded-xl bg-sky-600 shadow-md"
          transition={{ type: "spring", bounce: 0.15, duration: 0.45 }}
        />
      )}

      <item.icon
        className={cn(
          "relative z-10 h-[18px] w-[18px] shrink-0",
          isActive ? "text-white" : "text-sky-400"
        )}
      />

      {!collapsed && (
        <span className="relative z-10 truncate">{item.title}</span>
      )}

      {!collapsed && item.badge && (
        <span className="relative z-10 ml-auto flex h-5 min-w-5 items-center justify-center rounded-full bg-red-500 text-white text-[10px] font-bold animate-pulse">
          {item.badge}
        </span>
      )}
    </Link>
  );
}

/* ================= APP SIDEBAR ================= */

export function AppSidebar() {
  const [collapsed, setCollapsed] = useState(false);
  const pathname = usePathname();
  const { data: session } = useSession();
  const [totalConversas, setTotalConversas] = useState<number>(0);

  const isActive = (url: string) =>
    pathname === url || pathname.startsWith(url);

  const podeVer = (item: MenuItem) => {
    if (!item.permissao) return true;
    if (!session?.user?.role) return false;

    return podeAcessar(
      session.user.role as Role,
      item.permissao as keyof typeof permissoes.usuario,
      permissoes
    );
  };
  useEffect(() => {
    async function carregarConversas() {
      try {
        const res = await fetch("/api/chat/count");
        const data = await res.json();
        setTotalConversas(data.total || 0);
      } catch (error) {
        console.error("Erro ao buscar total de conversas:", error);
      }
    }

    carregarConversas();
  }, []);

  return (
    <motion.aside
      initial={false}
      animate={{ width: collapsed ? 72 : 260 }}
      transition={{ duration: 0.2 }}
      className="sticky top-0 flex h-screen flex-col border-r bg-white shadow-sm"
    >
      {/* HEADER */}
      <SidebarHeader className="px-4 py-4 flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-sky-600 shadow-md">
          <Stethoscope className="h-5 w-5 text-white" />
        </div>

        <AnimatePresence>
          {!collapsed && (
            <motion.div
              initial={{ opacity: 0, width: 0 }}
              animate={{ opacity: 1, width: "auto" }}
              exit={{ opacity: 0, width: 0 }}
              className="flex flex-col overflow-hidden"
            >
              <span className="truncate text-base font-bold text-sky-950">
                Melissa IA
              </span>
              <span className="truncate text-[11px] text-sky-600">
                CRM Médico Inteligente
              </span>
            </motion.div>
          )}
        </AnimatePresence>
      </SidebarHeader>

      {/* CARD MÉDICO */}
      <div
        className={cn(
          "mx-3 mb-3 flex items-center gap-3 rounded-xl border bg-sky-50/50 transition-all",
          collapsed ? "justify-center p-2" : "p-3"
        )}
      >
        <div className="flex h-9 w-9 items-center justify-center rounded-full bg-sky-100 text-sky-600">
          <CircleUser className="h-5 w-5" />
        </div>

        {!collapsed && (
          <>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold truncate">
                {session?.user?.name || "Usuário"}
              </p>
              <p className="text-[11px] text-muted-foreground truncate">
                {session?.user?.role || "Médico"}
              </p>
            </div>

            <BellRing className="h-4 w-4 text-sky-500" />
          </>
        )}
      </div>

      {/* NAV */}
      <SidebarContent className="flex-1 overflow-y-auto px-3 py-2 space-y-4">
        {menuGroups.map((group) => (
          <div key={group.label}>
            {!collapsed && (
              <p className="mb-1.5 px-3 text-[10px] font-bold uppercase tracking-wider text-sky-400">
                {group.label}
              </p>
            )}

            <div className="space-y-1">
              {group.items.filter(podeVer).map((item) => {
                const updatedItem =
                  item.url === "/dashboard/whatsapp"
                    ? { ...item, badge: totalConversas > 0 ? String(totalConversas) : null }
                    : item;

                return (
                  <SidebarLink
                    key={item.url}
                    item={updatedItem}
                    isActive={isActive(item.url)}
                    collapsed={collapsed}
                  />
                );
              })}

            </div>
          </div>
        ))}
      </SidebarContent>

      {/* FOOTER */}
      <SidebarFooter className="border-t px-3 py-3 space-y-1">
        {bottomItems.map((item) => (
          <SidebarLink
            key={item.url}
            item={item}
            isActive={isActive(item.url)}
            collapsed={collapsed}
          />
        ))}

        {/* Logout */}
        <button
          onClick={() => {
            signOut({ redirect: false });
            window.location.href = "/login";
          }}
          className={cn(
            "flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-red-600 hover:bg-red-50 transition",
            collapsed && "justify-center"
          )}
        >
          <LogOut className="h-[18px] w-[18px]" />
          {!collapsed && <span>Sair</span>}
        </button>

        {/* Collapse */}
        <button
          onClick={() => setCollapsed(!collapsed)}
          className={cn(
            "flex w-full items-center gap-3 rounded-xl px-3 py-2 text-sm text-sky-500 hover:bg-sky-50 transition",
            collapsed && "justify-center"
          )}
        >
          <ChevronLeft
            className={cn(
              "h-4 w-4 transition-transform",
              collapsed && "rotate-180"
            )}
          />
          {!collapsed && <span>Recolher menu</span>}
        </button>
      </SidebarFooter>
    </motion.aside>
  );
}
