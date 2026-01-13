const XLSX = require('xlsx');
const path = require('path');

// Dados de exemplo para o template
const templateData = [
  {
    Nome: 'João Silva',
    Email: 'joao@email.com',
    Telefone: '+55 11 99999-1111',
    Descricao: 'Cliente interessado em Home Equity',
    Ocupacao: 'Advogado',
    'Valor Potencial': 'R$ 200.000',
    Produto: 'home_equity'
  },
  {
    Nome: 'Maria Santos',
    Email: 'maria@empresa.com',
    Telefone: '+55 11 99999-2222',
    Descricao: 'Empresária procurando consórcio',
    Ocupacao: 'Empresária',
    'Valor Potencial': 'R$ 150.000',
    Produto: 'consorcio'
  },
  {
    Nome: 'Pedro Costa',
    Email: 'pedro@startup.com',
    Telefone: '+55 11 99999-3333',
    Descricao: 'Executivo interessado em financiamento',
    Ocupacao: 'Gerente',
    'Valor Potencial': 'R$ 300.000',
    Produto: 'home_equity'
  },
  {
    Nome: 'Ana Oliveira',
    Email: 'ana@corp.com',
    Telefone: '+55 11 99999-4444',
    Descricao: 'Diretora corporativa para imóveis',
    Ocupacao: 'Diretora',
    'Valor Potencial': 'R$ 500.000',
    Produto: 'consorcio'
  }
];

try {
  // Criar workbook e worksheet
  const wb = XLSX.utils.book_new();
  const ws = XLSX.utils.json_to_sheet(templateData);

  // Configurar largura das colunas
  const wscols = [
    { wch: 20 }, // Nome
    { wch: 25 }, // Email
    { wch: 18 }, // Telefone
    { wch: 35 }, // Descrição
    { wch: 15 }, // Ocupação
    { wch: 15 }, // Valor Potencial
    { wch: 12 }, // Produto
  ];
  ws['!cols'] = wscols;

  // Adicionar worksheet ao workbook
  XLSX.utils.book_append_sheet(wb, ws, 'Template Leads');

  // Salvar arquivo na pasta public
  const outputPath = path.join(__dirname, '..', 'public', 'template-leads.xlsx');
  XLSX.writeFile(wb, outputPath);

  console.log('✅ Template Excel criado com sucesso em:', outputPath);
} catch (error) {
  console.error('❌ Erro ao criar template Excel:', error);
}