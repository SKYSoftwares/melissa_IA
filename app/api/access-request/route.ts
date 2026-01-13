import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
import { getServerSession } from "next-auth";
import { authOptions } from "../auth/[...nextauth]/route";
// Prisma (evita múltiplas conexões em dev)
const globalForPrisma = global as unknown as { prisma: PrismaClient };
const prisma = globalForPrisma.prisma || new PrismaClient();
if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;

/** Permissões por cargo */
async function createPermissionsForMember(teamId: string, role: string) {
  const r = role?.toLowerCase();

  if (r === "diretor") {
    await prisma.teamPermission.create({
      data: {
        teamId,
        role: "diretor",
        dashboard: true,
        whatsapp: true,
        propostas: true,
        simuladores: true,
        relatorios: true,
        campanhas: true,
        equipe: true,
        configuracoes: true,
      },
    });
    return;
  }

  if (r === "gerente") {
    await prisma.teamPermission.create({
      data: {
        teamId,
        role: "gerente",
        dashboard: true,
        whatsapp: true,
        propostas: true,
        simuladores: true,
        relatorios: true,
        campanhas: true,
        equipe: true,
        configuracoes: false,
      },
    });
    return;
  }

  if (r === "administrador") {
    await prisma.teamPermission.create({
      data: {
        teamId,
        role: "administrador",
        dashboard: true,
        whatsapp: true,
        propostas: true,
        simuladores: true,
        relatorios: true,
        campanhas: true,
        equipe: true,
        configuracoes: true,
      },
    });
    return;
  }

  // Consultor (padrão)
  await prisma.teamPermission.create({
    data: {
      teamId,
      role: "usuario",
      dashboard: true,
      whatsapp: true,
      propostas: true,
      simuladores: true,
      relatorios: false,
      campanhas: false,
      equipe: false,
      configuracoes: false,
    },
  });
}

/** Garante que o usuário logado é Administrador */
async function requireAdmin() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) {
    return {
      ok: false,
      res: NextResponse.json({ error: "Não autenticado" }, { status: 401 }),
    };
  }

  // Confere no banco a position (fonte da verdade)
  const me = await prisma.team.findUnique({
    where: { email: session.user.email as string },
    select: { id: true, position: true, email: true },
  });

  const isAdmin =
    String(me?.position || "").toLowerCase() === "administrador" ||
    String((session.user as any)?.role || "").toLowerCase() === "administrador";

  if (!isAdmin) {
    return {
      ok: false,
      res: NextResponse.json({ error: "Proibido" }, { status: 403 }),
    };
  }

  return { ok: true, session, me };
}

/** POST /api/access-request
 *  Público — cria uma solicitação (pendente) a partir da tela de login.
 */
export async function POST(req: NextRequest) {
  try {
    const { name, email, password, cpf, phone, birthDate, cnpj, address } =
      await req.json();

    if (!name || !email || !password || !cpf || !phone) {
      return NextResponse.json(
        { error: "Preencha nome, e-mail, senha, CPF e telefone." },
        { status: 400 }
      );
    }

    // Já existe com este e-mail?
    const existing = await prisma.team.findUnique({ where: { email } });
    if (existing) {
      if (existing.accessStatus !== "approved") {
        return NextResponse.json(
          { error: "Sua solicitação já foi enviada e está em análise." },
          { status: 409 }
        );
      }
      return NextResponse.json(
        { error: "E-mail já cadastrado." },
        { status: 409 }
      );
    }

    const hashed = await bcrypt.hash(password, 12);

    const created = await prisma.team.create({
      data: {
        name,
        email,
        password: hashed,
        position: "Consultor", // padrão até aprovação
        cpf: String(cpf).replace(/\D/g, ""),
        phone: String(phone).replace(/\D/g, ""),
        birthDate: birthDate || null,
        cnpj: cnpj || null,
        address: address || null,
        accessStatus: "pending",
        requestedAt: new Date(),
      },
    });

    // Permissões mínimas antes da aprovação
    await prisma.teamPermission.create({
      data: {
        teamId: created.id,
        role: "usuario",
        dashboard: false,
        whatsapp: false,
        propostas: false,
        simuladores: false,
        relatorios: false,
        campanhas: false,
        equipe: false,
        configuracoes: false,
      },
    });

    return NextResponse.json({ ok: true }, { status: 201 });
  } catch (e: any) {
    return NextResponse.json(
      { error: "Erro ao solicitar acesso", details: String(e) },
      { status: 500 }
    );
  }
}

/** GET /api/access-request?status=pending
 *  Admin — lista solicitações (padrão: pendentes).
 */
export async function GET(req: NextRequest) {
  const admin = await requireAdmin();
  if (!admin.ok) return admin.res;

  const { searchParams } = new URL(req.url);
  const raw = (searchParams.get("status") || "pending").toLowerCase();
  const allowed = new Set(["pending", "approved", "rejected"]);
  const status = allowed.has(raw) ? raw : "pending";

  try {
    const rows = await prisma.team.findMany({
      where: { accessStatus: status },
      orderBy: [{ requestedAt: "desc" }, { name: "asc" }],
    });

    return NextResponse.json(rows);
  } catch (e: any) {
    return NextResponse.json(
      { error: "Erro ao buscar solicitações", details: String(e) },
      { status: 500 }
    );
  }
}

/** PUT /api/access-request
 *  Admin — aprova ou recusa: { id, action: "approve"|"reject", role? }
 */
export async function PUT(req: NextRequest) {
  const admin = await requireAdmin();
  if (!admin.ok) return admin.res;

  try {
    const { id, action, role } = await req.json();
    if (!id || !action) {
      return NextResponse.json(
        { error: "Informe id e action." },
        { status: 400 }
      );
    }

    const act = String(action).toLowerCase();
    if (!["approve", "reject"].includes(act)) {
      return NextResponse.json({ error: "Action inválida." }, { status: 400 });
    }

    if (act === "approve") {
      const roles = ["Consultor", "Gerente", "Diretor", "Administrador"];
      const finalRole = roles.includes(role) ? role : "Consultor";

      // Atualiza status e cargo
      await prisma.team.update({
        where: { id },
        data: {
          accessStatus: "approved",
          position: finalRole,
        },
      });

      // Recria permissões conforme o cargo escolhido
      await prisma.teamPermission.deleteMany({ where: { teamId: id } });
      await createPermissionsForMember(id, finalRole);

      return NextResponse.json({ ok: true });
    }

    // reject
    await prisma.team.update({
      where: { id },
      data: {
        accessStatus: "rejected",
      },
    });
    await prisma.teamPermission.deleteMany({ where: { teamId: id } });

    return NextResponse.json({ ok: true });
  } catch (e: any) {
    return NextResponse.json(
      { error: "Erro ao atualizar solicitação", details: String(e) },
      { status: 500 }
    );
  }
}
