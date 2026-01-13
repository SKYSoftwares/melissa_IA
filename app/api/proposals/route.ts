import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import { bucket } from "@/lib/firebaseAdmin";
import { v4 as uuid } from "uuid";

const prisma = new PrismaClient();
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userEmail = searchParams.get("userEmail");
    const userRole = searchParams.get("userRole");
    const isAdmin = searchParams.get("admin") === "true";

    console.log("Buscando propostas para:", { userEmail, userRole, isAdmin });

    let whereClause: any = {};

    if (isAdmin || userRole === "administrador") {
      // Admin vê todas as propostas (sem filtros)
      console.log("Admin - vendo todas as propostas");
    } else if (userRole === "diretor") {
      // Diretor vê propostas dos gerentes que gerencia e dos consultores dessas equipes
      console.log(
        "Diretor - buscando propostas dos gerentes e equipes que gerencia"
      );
      const diretor = await prisma.team.findUnique({
        where: { email: userEmail || "" },
        include: {
          managedTeams: {
            include: {
              members: {
                include: {
                  managedTeams: {
                    include: {
                      members: {
                        select: { id: true },
                      },
                    },
                  },
                },
                select: {
                  id: true,
                  email: true,
                  position: true,
                  managedTeams: true,
                },
              },
            },
          },
        },
      });
      let allIds: string[] = [];
      if (diretor && diretor.managedTeams.length > 0) {
        diretor.managedTeams.forEach((gerenteTeam) => {
          if (gerenteTeam.managerId) allIds.push(gerenteTeam.managerId);
          gerenteTeam.members.forEach((member) => {
            allIds.push(member.id);
          });
        });
        allIds.push(diretor.id);
        whereClause.createdBy = { in: allIds };
      } else {
        whereClause.createdBy = diretor?.id;
      }
    } else if (userRole === "gerente") {
      // Gerente vê apenas propostas dos consultores da sua equipe e as próprias
      console.log("Gerente - buscando propostas da equipe");
      const gerente = await prisma.team.findUnique({
        where: { email: userEmail || "" },
        include: {
          managedTeams: {
            include: {
              members: {
                select: { id: true },
              },
            },
          },
        },
      });
      if (gerente && gerente.managedTeams.length > 0) {
        const memberIds = gerente.managedTeams.flatMap((team) =>
          team.members.map((member) => member.id)
        );
        memberIds.push(gerente.id);
        whereClause.createdBy = { in: memberIds };
      } else {
        whereClause.createdBy = gerente?.id;
      }
    } else {
      // Consultor vê apenas suas próprias propostas
      console.log("Consultor - vendo apenas próprias propostas");
      const user = await prisma.team.findUnique({
        where: { email: userEmail || "" },
        select: { id: true },
      });
      if (user) {
        whereClause.createdBy = user.id;
      }
    }

    const proposals = await prisma.proposal.findMany({
      where: whereClause,
      include: {
        lead: true,
        proponentes: true,
        imoveis: true,
        arquivos: true,
        creator: true,
      },
      orderBy: { createdAt: "desc" },
    });

    console.log(`Encontradas ${proposals.length} propostas`);
    return NextResponse.json(proposals);
  } catch (error) {
    console.error("Erro ao buscar propostas:", error);
    return NextResponse.json(
      { error: "Erro interno do servidor" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      leadId,
      proponentes = [],
      imoveis = [],
      defesa = "",
      userEmail,
    } = body;

    if (!leadId || !userEmail) {
      return NextResponse.json(
        { error: "leadId e userEmail são obrigatórios" },
        { status: 400 }
      );
    }

    // Buscar usuário
    const user = await prisma.team.findUnique({
      where: { email: userEmail },
      select: { id: true },
    });
    if (!user) {
      return NextResponse.json(
        { error: "Usuário não encontrado" },
        { status: 404 }
      );
    }

    // Buscar lead
    const lead = await prisma.lead.findFirst({
      where: { 
        id: leadId,
        deletedAt: null, // Não permitir criar proposta para lead deletado
      },
      select: { name: true, email: true, phone: true },
    });
    if (!lead) {
      return NextResponse.json(
        { error: "Lead não encontrado ou está na lixeira" },
        { status: 404 }
      );
    }

    // Criar proposta
    const proposal = await prisma.proposal.create({
      data: {
        title: `Proposta - ${lead.name}`,
        client: lead.name,
        company: "",
        value: Array.isArray(imoveis[0]?.valorCredito)
          ? imoveis[0]?.valorCredito[0] || ""
          : imoveis[0]?.valorCredito || "",
        stage: "pendente_envio",
        priority: "medium",
        description: defesa,
        phone: lead.phone,
        email: lead.email ?? "",
        leadId,
        createdBy: user.id,
      },
    });

    // Atualizar lead → proposta
    await prisma.lead.update({
      where: { id: leadId },
      data: { status: "proposta" },
    });

    // Criar proponentes
    for (const p of proponentes) {
      await prisma.proponent.create({
        data: {
          name: p.nomeEmpresa || "Proponente",
          cpf: p.cpf,
          email: p.email,
          phone: p.telefone,
          razaoSocial: p.razaoSocial || null,
          proposalId: proposal.id,
          endereco: p.endereco,
          bairro: p.bairro,
          cep: p.cep,
          cidadeUf: p.cidadeUf,
          nomeEmpresa: p.nomeEmpresa,
          dataNascimento: p.nascimento,
          ocupacao: p.ocupacao,
          rendaMensal: p.renda,
          cnpj: p.cnpj,
        },
      });
    }

    // Criar imóveis
    for (const i of imoveis) {
      await prisma.property.create({
        data: {
          address: Array.isArray(i.endereco)
            ? i.endereco[0] || ""
            : i.endereco || "",
          neighborhood: Array.isArray(i.bairro)
            ? i.bairro[0] || ""
            : i.bairro || "",
          type: Array.isArray(i.tipoImovel)
            ? i.tipoImovel[0] || ""
            : i.tipoImovel || "",
          zipCode: Array.isArray(i.cep) ? i.cep[0] || "" : i.cep || "",
          creditValue: Array.isArray(i.valorCredito)
            ? i.valorCredito[0] || ""
            : i.valorCredito || "",
          owners: {
            create: i.donos.map((owner: string) => ({
              name: owner,
            })),
          },
          description: `Tipo: ${
            Array.isArray(i.tipoImovel)
              ? i.tipoImovel[0] || ""
              : i.tipoImovel || ""
          }, CEP: ${
            Array.isArray(i.cep) ? i.cep[0] || "" : i.cep || ""
          }, Donos: ${i.donos?.join(", ") || "N/A"}`,
          value: Array.isArray(i.valorEstimado)
            ? i.valorEstimado[0] || ""
            : i.valorEstimado || "",

          proposalId: proposal.id,
        },
      });
    }

    // 📂 Upload de arquivos dos proponentes
    for (const p of proponentes) {
      const docTypes = [
        "identificacao",
        "comprovanteResidencia",
        "certidaoEstadoCivil",
        "holerite",
        "extrato",
        "declaracaoIR",
        "reciboIR",
        "contratoAluguel",
        "escrituraPacto",
        "outrosDocumentos",
      ];

      for (const docType of docTypes) {
        if (Array.isArray(p[docType])) {
          for (const file of p[docType]) {
            if (file?.base64 && file?.name) {
              const base64Data = file.base64.split(",")[1] || file.base64;
              const buffer = Buffer.from(base64Data, "base64");

              const fileName = `${uuid()}-${file.name}`;
              const firebaseFile = bucket.file(
                `proposals/${proposal.id}/${fileName}`
              );

              await firebaseFile.save(buffer, {
                metadata: {
                  contentType: file.type || "application/octet-stream",
                },
                resumable: false,
              });

              const [url] = await firebaseFile.getSignedUrl({
                action: "read",
                expires: "03-01-2030",
              });

              await prisma.proposalFile.create({
                data: {
                  url,
                  name: `${docType}_${file.name}`,
                  proposalId: proposal.id,
                  documentType: docType,
                  mimeType: file.type,
                  size: file.size,
                  originalName: file.name,
                },
              });
            }
          }
        }
      }
    }

    // 📂 Upload de arquivos dos imóveis
    // 📂 Upload de arquivos dos imóveis
    for (const i of imoveis) {
      const docTypes = [
        "matricula",
        "iptu",
        "habiteSe",
        "alvaraConstrucao",
        "fotos",
        "outros",
      ];

      for (const docType of docTypes) {
        if (Array.isArray(i[docType])) {
          for (const file of i[docType]) {
            if (file?.base64 && file?.name) {
              const base64Data = file.base64.split(",")[1] || file.base64;
              const buffer = Buffer.from(base64Data, "base64");

              const fileName = `${uuid()}-${file.name}`;
              const firebaseFile = bucket.file(
                `proposals/${proposal.id}/${fileName}`
              );

              await firebaseFile.save(buffer, {
                metadata: {
                  contentType: file.type || "application/octet-stream",
                },
                resumable: false,
              });

              const [url] = await firebaseFile.getSignedUrl({
                action: "read",
                expires: "03-01-2030",
              });

              await prisma.proposalFile.create({
                data: {
                  url,
                  name: `imovel_${docType}_${file.name}`,
                  proposalId: proposal.id,
                  documentType: `imovel_${docType}`, // 👈 prefixado
                  mimeType: file.type,
                  size: file.size,
                  originalName: file.name,
                },
              });
            }
          }
        }
      }
    }

    return NextResponse.json(
      {
        success: true,
        proposalId: proposal.id,
        message: "Proposta criada com sucesso",
      },
      { status: 201 }
    );
  } catch (error: any) {
    console.error("Erro ao criar proposta:", error);
    return NextResponse.json(
      { error: "Erro interno do servidor" },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { id, stage, arquivoUrl } = body;

    // Validações básicas
    if (!id) {
      return NextResponse.json({ error: "ID é obrigatório" }, { status: 400 });
    }

    const updateData: any = {};
    if (stage) updateData.stage = stage;
    if (arquivoUrl !== undefined) updateData.arquivoUrl = arquivoUrl;

    const proposal = await prisma.proposal.update({
      where: { id },
      data: updateData,
    });

    return NextResponse.json(proposal);
  } catch (error: any) {
    console.error("Erro ao atualizar proposta:", error);

    if (error.code === "P2025") {
      return NextResponse.json(
        { error: "Proposta não encontrada" },
        { status: 404 }
      );
    }

    return NextResponse.json(
      { error: "Erro interno do servidor" },
      { status: 500 }
    );
  }
}
