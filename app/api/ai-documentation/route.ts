import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

// Documentação Dr. Zeus Capital - Home Equity
const documentation = [
  {
    id: '1',
    title: 'Home Equity - Produto Principal',
    content: 'Solução financeira que permite usar o imóvel como garantia para obter crédito com juros baixos (1,19% a 1,60% ao mês) e prazos longos (36 a 240 meses). Valor mínimo: R$100.000,00. Carência de até 180 dias.',
    category: 'produtos',
    lastUpdated: new Date('2024-01-15'),
    tags: ['home equity', 'credito', 'imovel', 'garantia', 'juros baixos', 'carencia']
  },
  {
    id: '2',
    title: 'Elegibilidade e Perfis',
    content: 'Atendemos clientes com até 80 anos. Perfil ideal: alta renda, bom patrimônio, mesmo que esteja negativado. Aceitamos casais com um dos cônjuges negativado e profissionais autônomos com renda irregular mas bom patrimônio.',
    category: 'politicas',
    lastUpdated: new Date('2024-01-10'),
    tags: ['elegibilidade', 'idade', 'perfil', 'negativado', 'casais', 'autonomos']
  },
  {
    id: '3',
    title: 'Tipos de Imóveis Aceitos',
    content: 'Imóveis urbanos: residenciais (LTV até 60%), comerciais (LTV até 50%), mistos (LTV até 45%), galpões (LTV até 40%). Imóveis rurais: área superior a 30 hectares, com produção ativa, CAR, georreferenciamento e ITR em dia.',
    category: 'produtos',
    lastUpdated: new Date('2024-01-12'),
    tags: ['imoveis', 'urbanos', 'rurais', 'LTV', 'residencial', 'comercial', 'galpoes']
  },
  {
    id: '4',
    title: 'Benefícios e Vantagens',
    content: 'Planejamento patrimonial e blindagem estratégica, carência de até 180 dias para empresários, venda de imóveis com Home Equity, uso livre do recurso, alavancagem financeira com retorno acima da dívida.',
    category: 'produtos',
    lastUpdated: new Date('2024-01-18'),
    tags: ['beneficios', 'blindagem', 'carencia', 'venda', 'uso livre', 'alavancagem']
  },
  {
    id: '5',
    title: 'Seguros e Proteções',
    content: 'Seguro DFI (Danos Físicos ao Imóvel) e Seguro MIP (Morte ou Invalidez Permanente) incluídos no contrato. Mitigação de riscos: inadimplência, má utilização do crédito e queda de valor do imóvel.',
    category: 'seguranca',
    lastUpdated: new Date('2024-01-16'),
    tags: ['seguros', 'DFI', 'MIP', 'protecao', 'riscos', 'mitigacao']
  },
  {
    id: '6',
    title: 'Documentação Necessária',
    content: 'Documentos pessoais: RG, CPF, comprovante de residência. Imóvel: matrícula atualizada, certidões negativas, IPTU. Renda: comprovante de renda, declaração de imposto de renda. Para PJ: documentos societários e financeiros.',
    category: 'procedimentos',
    lastUpdated: new Date('2024-01-14'),
    tags: ['documentos', 'RG', 'CPF', 'matricula', 'certidoes', 'IPTU', 'renda']
  },
  {
    id: '7',
    title: 'Processo e Prazos',
    content: 'Processo completo: 15 a 30 dias. Liberação: 4 a 10 dias úteis após documentação aprovada. Nossa equipe cuida de 90% da parte burocrática. Agilidade é parte do nosso DNA.',
    category: 'procedimentos',
    lastUpdated: new Date('2024-01-17'),
    tags: ['processo', 'prazos', 'liberacao', 'burocracia', 'agilidade']
  },
  {
    id: '8',
    title: 'Perfis de Cliente',
    content: '1) Proprietário Investidor: usar patrimônio para gerar oportunidades. 2) Empresário: capital estratégico para expansão. 3) Organização Pessoal: reorganizar vida financeira. 4) Investidor Estratégico: alavancagem para crescimento.',
    category: 'perfis',
    lastUpdated: new Date('2024-01-19'),
    tags: ['perfis', 'investidor', 'empresario', 'organizacao', 'estrategico', 'alavancagem']
  },
  {
    id: '9',
    title: 'Visão e Missão da Empresa',
    content: 'Visão: Ser a maior referência em Home Equity e soluções financeiras inteligentes do país. Missão: Resolver o agora e construir o amanhã. Fundador: Matheus Christian, 3 anos de atuação, movimentou mais de R$100 milhões.',
    category: 'empresa',
    lastUpdated: new Date('2024-01-20'),
    tags: ['visao', 'missao', 'fundador', 'matheus christian', 'historia']
  },
  {
    id: '10',
    title: 'Pilares Estratégicos',
    content: '1) Confiança Radical e Transparência Total. 2) Proteção Patrimonial Inteligente. 3) Inovação com Propósito e Parcerias que Escalam. 4) Protagonismo Compartilhado. Clareza gera poder, explicamos cada etapa com comunicação simples.',
    category: 'empresa',
    lastUpdated: new Date('2024-01-21'),
    tags: ['pilares', 'confianca', 'transparencia', 'protecao', 'inovacao', 'protagonismo']
  }
];

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const category = searchParams.get('category');
    const search = searchParams.get('search');

    let filteredDocs = documentation;

    // Filtrar por categoria
    if (category && category !== 'todas') {
      filteredDocs = filteredDocs.filter(doc => doc.category === category);
    }

    // Filtrar por busca
    if (search) {
      const searchLower = search.toLowerCase();
      filteredDocs = filteredDocs.filter(doc => 
        doc.title.toLowerCase().includes(searchLower) ||
        doc.content.toLowerCase().includes(searchLower) ||
        doc.tags.some(tag => tag.toLowerCase().includes(searchLower))
      );
    }

    return NextResponse.json({
      success: true,
      data: filteredDocs,
      total: filteredDocs.length
    });

  } catch (error) {
    console.error('Erro ao buscar documentação:', error);
    return NextResponse.json(
      { error: "Erro interno do servidor" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    // Verificar se o usuário é admin ou diretor
    const userRole = session.user?.role;
    if (!userRole || !['admin', 'administrador', 'diretor'].includes(userRole.toLowerCase())) {
      return NextResponse.json({ error: "Acesso negado" }, { status: 403 });
    }

    const body = await request.json();
    const { title, content, category, tags } = body;

    if (!title || !content || !category) {
      return NextResponse.json(
        { error: "Título, conteúdo e categoria são obrigatórios" },
        { status: 400 }
      );
    }

    const newDoc = {
      id: Date.now().toString(),
      title,
      content,
      category,
      tags: tags || [],
      lastUpdated: new Date()
    };

    // Em produção, salvar no banco de dados
    // documentation.push(newDoc);

    return NextResponse.json({
      success: true,
      data: newDoc,
      message: "Documentação criada com sucesso"
    });

  } catch (error) {
    console.error('Erro ao criar documentação:', error);
    return NextResponse.json(
      { error: "Erro interno do servidor" },
      { status: 500 }
    );
  }
} 