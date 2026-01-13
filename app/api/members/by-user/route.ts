import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

// Evitar múltiplas instâncias do PrismaClient em dev
const globalForPrisma = global as unknown as { prisma: PrismaClient };
const prisma = globalForPrisma.prisma || new PrismaClient();
if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;
async function createPermissionsForMember(teamId: string, role: string) {
  let permissions = {};

  if (role === "Diretor") {
    // Diretor tem todas as permissões, incluindo configurações
    permissions = {
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
    };
  } else if (role === "Gerente") {
    // Gerente tem todas as permissões, exceto configurações
    permissions = {
      teamId,
      role: "gerente",
      dashboard: true,
      whatsapp: true,
      propostas: true,
      simuladores: true,
      relatorios: true,
      campanhas: true,
      equipe: true,
      configuracoes: false, // Única permissão negada para gerentes
    };
  } else if (role === "Consultor") {
    // Consultor tem permissões básicas
    permissions = {
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
    };
  }

  // Criar as permissões no banco
  await prisma.teamPermission.create({
    data: permissions as any,
  });
}
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const role = searchParams.get("role");
    const userId = searchParams.get("userId"); // 👈 você pode enviar isso da sessão ou JWT

    if (!userId) {
      return NextResponse.json(
        { error: "Usuário não autenticado" },
        { status: 401 }
      );
    }

    // Buscar dados do usuário logado
    const loggedUser = await prisma.team.findUnique({
      where: { id: userId },
      include: { permissions: true },
    });

    if (!loggedUser) {
      return NextResponse.json(
        { error: "Usuário não encontrado" },
        { status: 404 }
      );
    }

    if (loggedUser.position === "administrador") {
      console.log("cai aqui");
      const allMembers = await prisma.team.findMany({
        orderBy: { name: "asc" },
        include: { permissions: true },
      });
      return NextResponse.json(allMembers);
    }
    // Caso seja diretor → retorna gerentes e consultores vinculados
    if (loggedUser.position === "Diretor") {
      const subordinates = await prisma.team.findMany({
        where: {
          OR: [
            { directorId: loggedUser.id }, // gerentes sob este diretor
            { team: { managerId: loggedUser.id } }, // membros de grupos que ele gerencia
          ],
        },
        orderBy: { name: "asc" },
        include: { permissions: true },
      });

      return NextResponse.json(subordinates);
    }

    // Caso seja gerente → retorna apenas membros dos grupos que ele gerencia
    if (loggedUser.permissions.some((p) => p.role === "gerente")) {
      const subordinates = await prisma.team.findMany({
        where: {
          team: { managerId: loggedUser.id }, // membros do grupo do gerente
        },
        orderBy: { name: "asc" },
        include: { permissions: true },
      });

      return NextResponse.json(subordinates);
    }

    // Caso seja consultor ou outro → só retorna ele mesmo
    return NextResponse.json([loggedUser]);
  } catch (error) {
    return NextResponse.json(
      { error: "Erro ao buscar membros", details: String(error) },
      { status: 500 }
    );
  }
}
export async function POST(req: NextRequest) {
  try {
    const {
      name,
      email,
      role,
      password,
      creatorId,
      cpf,
      phone,
      birthDate,
      cnpj,
      address,
    } = await req.json();
    // 👆 precisa vir do frontend (ex: session.user.id)

    if (!name || !email || !role || !password || !creatorId) {
      return NextResponse.json(
        { error: "Preencha todos os campos." },
        { status: 400 }
      );
    }

    // Verifica se já existe membro com o mesmo e-mail
    const exists = await prisma.team.findUnique({ where: { email } });
    if (exists) {
      return NextResponse.json(
        { error: "Já existe um membro com este e-mail." },
        { status: 409 }
      );
    }

    // Buscar o criador no banco
    const creator = await prisma.team.findUnique({
      where: { id: creatorId },
      include: { permissions: true },
    });
    if (!creator) {
      return NextResponse.json(
        { error: "Criador não encontrado." },
        { status: 404 }
      );
    }

    // Gerar hash da senha
    const saltRounds = 12;
    const hashedPassword = await bcrypt.hash(password, saltRounds);

    // Dados base
    const newMemberData: any = {
      name,
      email,
      position: role,
      password: hashedPassword,
      cpf: cpf,
      phone: phone,
      birthDate: birthDate,
      cnpj: cnpj,
      address: address,
      accessStatus: "approved",
    };

    // 📌 Lógica de hierarquia
    if (creator.permissions.some((p) => p.role === "administrador")) {
      newMemberData.directorId = creator.id;
    } else if (
      creator.permissions.some((p) => p.role === "diretor") &&
      role === "Gerente"
    ) {
      // Diretor criando gerente → vincula pelo directorId
      newMemberData.directorId = creator.id;
    } else if (
      creator.permissions.some((p) => p.role === "gerente") &&
      role === "Consultor"
    ) {
      // Gerente criando consultor → precisa de um TeamGroup
      // Procurar (ou criar) grupo do gerente
      let teamGroup = await prisma.teamGroup.findFirst({
        where: { managerId: creator.id },
      });
      if (!teamGroup) {
        teamGroup = await prisma.teamGroup.create({
          data: {
            name: `Equipe de ${creator.name}`,
            managerId: creator.id,
          },
        });
      }
      newMemberData.teamId = teamGroup.id;
    } else if (
      creator.permissions.some((p) => p.role === "diretor") &&
      role === "Consultor"
    ) {
      // Diretor criando gerente → vincula pelo directorId
      newMemberData.directorId = creator.id;
    }
    // Criar o membro
    const createdMember = await prisma.team.create({
      data: newMemberData,
    });
    console.log(role, "ROLE");
    if (role === "Gerente") {
      const team = await prisma.teamGroup.create({
        data: {
          name: `Equipe de ${createdMember.name}`, // pode personalizar
          managerId: createdMember.id,
        },
      });
      console.log(team, "Time criado");
    }
    // Criar permissões baseadas no cargo
    if (createdMember) {
      await createPermissionsForMember(createdMember.id, role);
    }

    return NextResponse.json(createdMember, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      { error: "Erro ao adicionar membro", details: String(error) },
      { status: 500 }
    );
  }
}
