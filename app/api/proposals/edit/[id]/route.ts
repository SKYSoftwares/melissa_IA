// app/api/proposals/[id]/route.ts
import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

// Tipos “soltos” do payload (compatíveis com seu front)
type Base64File = {
  id?: string; // se já existir no banco
  name: string;
  originalName?: string;
  size?: number;
  type?: string; // mime
  base64?: string; // dataURL OU base64 puro
  url?: string; // caso venha de storage externo
  documentType: string; // e.g. "identificacao", "imovel_matricula" etc
  proponenteId?: string; // opcional - se quiser marcar no payload
  // obs: não existe FK de arquivo para imóvel/proponente no schema,
  // a gente diferencia pelos valores de documentType (padrão que você já usa).
};

type ProponenteIn = {
  id?: string;
  cpf: string;
  telefone: string;
  email: string;
  nascimento?: string | null;
  ocupacao?: string | null;
  renda?: string | null; // no GET você converte p/ rendaMensal
  nomeEmpresa?: string | null;
  cnpj?: string | null;

  endereco?: string | null;
  bairro?: string | null;
  cep?: string | null;
  cidadeUf?: string | null;

  // arquivos por proponente
  identificacao?: Base64File[];
  comprovanteResidencia?: Base64File[];
  certidaoEstadoCivil?: Base64File[];
  holerite?: Base64File[];
  extrato?: Base64File[];
  declaracaoIR?: Base64File[];
  reciboIR?: Base64File[];
  contratoAluguel?: Base64File[];
  escrituraPacto?: Base64File[];
  outrosDocumentos?: Base64File[];
};

type ImovelIn = {
  id?: string;
  endereco: string;
  bairro?: string | null;
  tipoImovel?: string | null; // Property.type
  cep?: string | null; // Property.zipCode
  valorEstimado: string; // Property.value
  valorCredito?: string | null; // Property.creditValue
  donos: string[]; // nomes; vamos substituir todos

  // arquivos do imóvel (virão do front como arrays)
  matricula?: Base64File[];
  iptu?: Base64File[];
  habiteSe?: Base64File[];
  alvaraConstrucao?: Base64File[];
  fotos?: Base64File[];
  outros?: Base64File[];
};

type BodyIn = {
  // campos básicos da Proposal (opcionais – só atualiza se vier)
  title?: string;
  client?: string;
  company?: string;
  value?: string;
  stage?: string;
  priority?: string;
  dueDate?: string | null;
  description?: string | null; // no seu front chama “defesa”
  phone?: string;
  email?: string;

  acrescentarSeguro?: boolean | null;
  creditoUnitario?: number | null;
  mesContemplacao?: number | null;
  opcaoParcela?: string | null;
  parcelaContemplacao?: number | null;
  prazoConsorcio?: number | null;
  taxa?: number | null;

  // relacionamentos
  proponentes: ProponenteIn[];
  imoveis: ImovelIn[];

  // Alternativamente, você pode mandar tudo “achatado” em arquivos,
  // mas aqui vamos extrair arquivos a partir dos arrays de proponente/imóvel.
};

const ALLOWED_DOC_TYPES = new Set<string>([
  // pessoa
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
  // imóvel
  "imovel_matricula",
  "imovel_iptu",
  "imovel_habiteSe",
  "imovel_alvaraConstrucao",
  "imovel_fotos",
  "imovel_outros",
]);

function bufferFromBase64(b64?: string): Buffer | undefined {
  if (!b64) return undefined;
  const comma = b64.indexOf(",");
  const raw = comma >= 0 ? b64.slice(comma + 1) : b64;
  return Buffer.from(raw, "base64");
}

// Util: compõe um vetor de arquivos (novos + existentes para manter)
function collectFilesFromPayload(
  proponentes: ProponenteIn[],
  imoveis: ImovelIn[]
): Base64File[] {
  const add = (arr?: Base64File[], typeOverride?: string) =>
    (arr ?? []).map((f) => ({
      ...f,
      documentType: typeOverride ?? f.documentType,
    }));

  const files: Base64File[] = [];

  // por proponente
  const mapProp: Array<keyof ProponenteIn> = [
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

  proponentes.forEach((p) => {
    mapProp.forEach((k) => {
      const arr = (p as any)[k] as Base64File[] | undefined;
      if (!arr) return;
      // documentType precisa ser exatamente a chave do grupo
      files.push(...add(arr, String(k)));
    });
  });

  // por imóvel
  imoveis.forEach((i) => {
    files.push(...add(i.matricula, "imovel_matricula"));
    files.push(...add(i.iptu, "imovel_iptu"));
    files.push(...add(i.habiteSe, "imovel_habiteSe"));
    files.push(...add(i.alvaraConstrucao, "imovel_alvaraConstrucao"));
    files.push(...add(i.fotos, "imovel_fotos"));
    files.push(...add(i.outros, "imovel_outros"));
  });

  // filtra só tipos permitidos
  return files.filter((f) => ALLOWED_DOC_TYPES.has(f.documentType));
}

export async function PUT(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const proposalId = params.id;

  try {
    const body: BodyIn = await req.json();

    // Coleta arquivos a partir do payload (novos ou já existentes)
    const incomingFiles = collectFilesFromPayload(
      body.proponentes ?? [],
      body.imoveis ?? []
    );

    // Transação para manter consistência
    const updated = await prisma.$transaction(async (tx) => {
      // 1) Atualiza campos simples da Proposal (só os que vierem)
      const proposal = await tx.proposal.update({
        where: { id: proposalId },
        data: {
          title: body.title ?? undefined,
          client: body.client ?? undefined,
          company: body.company ?? undefined,
          value: body.value ?? undefined,
          stage: body.stage ?? undefined,
          priority: body.priority ?? undefined,
          dueDate: body.dueDate ?? undefined,
          description: body.description ?? undefined, // “defesa”
          phone: body.phone ?? undefined,
          email: body.email ?? undefined,

          acrescentarSeguro:
            body.acrescentarSeguro === undefined
              ? undefined
              : body.acrescentarSeguro,
          creditoUnitario:
            body.creditoUnitario === undefined
              ? undefined
              : body.creditoUnitario,
          mesContemplacao:
            body.mesContemplacao === undefined
              ? undefined
              : body.mesContemplacao,
          opcaoParcela: body.opcaoParcela ?? undefined,
          parcelaContemplacao:
            body.parcelaContemplacao === undefined
              ? undefined
              : body.parcelaContemplacao,
          prazoConsorcio:
            body.prazoConsorcio === undefined ? undefined : body.prazoConsorcio,
          taxa: body.taxa === undefined ? undefined : body.taxa,
        },
      });

      // 2) Proponentes: upsert por id; apaga os que não vierem
      const existingProps = await tx.proponent.findMany({
        where: { proposalId },
        select: { id: true },
      });
      const keepPropIds: string[] = [];

      for (const p of body.proponentes ?? []) {
        const data = {
          name: p.nomeEmpresa || p.email || p.cpf, // se quiser guardar name
          cpf: p.cpf,
          email: p.email,
          phone: p.telefone,
          razaoSocial: p.nomeEmpresa ?? null,
          nomeEmpresa: p.nomeEmpresa ?? null,
          dataNascimento: p.nascimento ?? null,
          ocupacao: p.ocupacao ?? null,

          endereco: p.endereco ?? null,
          bairro: p.bairro ?? null,
          cep: p.cep ?? null,
          cidadeUf: p.cidadeUf ?? null,
          rendaMensal: p.renda ?? null,
          cnpj: p.cnpj ?? null,

          proposalId,
        };

        if (p.id) {
          const up = await tx.proponent.update({
            where: { id: p.id },
            data,
            select: { id: true },
          });
          keepPropIds.push(up.id);
        } else {
          const created = await tx.proponent.create({
            data,
            select: { id: true },
          });
          keepPropIds.push(created.id);
        }
      }

      const toDeleteProps = existingProps
        .map((e) => e.id)
        .filter((id) => !keepPropIds.includes(id));

      if (toDeleteProps.length) {
        await tx.proponent.deleteMany({ where: { id: { in: toDeleteProps } } });
      }

      // 3) Imóveis: upsert por id; donos = replace
      const existingImoveis = await tx.property.findMany({
        where: { proposalId },
        select: { id: true },
      });
      const keepImovelIds: string[] = [];

      for (const im of body.imoveis ?? []) {
        const dataProp = {
          address: im.endereco,
          neighborhood: im.bairro ?? null,
          type: im.tipoImovel ?? null,
          zipCode: im.cep ?? null,
          value: im.valorEstimado,
          creditValue: im.valorCredito ?? null,
          proposalId,
        };

        let propId: string;
        if (im.id) {
          const up = await tx.property.update({
            where: { id: im.id },
            data: dataProp,
            select: { id: true },
          });
          propId = up.id;
        } else {
          const created = await tx.property.create({
            data: dataProp,
            select: { id: true },
          });
          propId = created.id;
        }
        keepImovelIds.push(propId);

        // Donos → substitui tudo
        await tx.propertyOwner.deleteMany({ where: { propertyId: propId } });
        if (Array.isArray(im.donos) && im.donos.length) {
          await tx.propertyOwner.createMany({
            data: im.donos.map((name) => ({ name, propertyId: propId })),
          });
        }
      }

      const toDeleteImoveis = existingImoveis
        .map((e) => e.id)
        .filter((id) => !keepImovelIds.includes(id));

      if (toDeleteImoveis.length) {
        // apaga donos ligados a esses imóveis
        await tx.propertyOwner.deleteMany({
          where: { propertyId: { in: toDeleteImoveis } },
        });
        await tx.property.deleteMany({
          where: { id: { in: toDeleteImoveis } },
        });
      }

      // 4) Arquivos: sincroniza com base no que veio (mantém ids recebidos, cria os novos, apaga o resto)
      const existingFiles = await tx.proposalFile.findMany({
        where: { proposalId },
        select: { id: true },
      });

      const keepFileIds = new Set<string>();

      for (const f of incomingFiles) {
        // se veio id, só manter
        if (f.id) {
          keepFileIds.add(f.id);
          continue;
        }

        // cria se tiver base64 ou url (se vier só nome sem nada, ignora)
        const fileData = f.base64 ? bufferFromBase64(f.base64) : undefined;

        if (!fileData && !f.url) continue;

        const created = await tx.proposalFile.create({
          data: {
            proposalId,
            documentType: f.documentType,
            name: f.name || f.originalName || "arquivo",
            originalName: f.originalName || f.name || null,
            mimeType: f.type || null,
            size: f.size || null,
            url: f.url || null,
            fileData: fileData, // Bytes? no schema
          },
          select: { id: true },
        });

        keepFileIds.add(created.id);
      }

      // remove os que não vieram para manter
      const idsToKeep = Array.from(keepFileIds);
      const idsToDelete = existingFiles
        .map((e) => e.id)
        .filter((id) => !idsToKeep.includes(id));

      if (idsToDelete.length) {
        await tx.proposalFile.deleteMany({
          where: { id: { in: idsToDelete } },
        });
      }

      // Retorna atualizado com includes úteis
      return tx.proposal.findUnique({
        where: { id: proposalId },
        include: {
          proponentes: true,
          imoveis: { include: { owners: true } },
          arquivos: true,
          lead: true,
        },
      });
    });

    return NextResponse.json(updated, { status: 200 });
  } catch (err: any) {
    console.error("PUT /api/proposals/[id] error:", err);
    return NextResponse.json(
      { error: err?.message || "Erro ao atualizar a proposta" },
      { status: 500 }
    );
  }
}
