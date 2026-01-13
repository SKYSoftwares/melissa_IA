const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

// Função para gerar nomes aleatórios
function generateRandomName() {
  const firstNames = [
    'João', 'Maria', 'Pedro', 'Ana', 'Carlos', 'Lucia', 'Fernando', 'Patricia',
    'Ricardo', 'Sandra', 'Marcelo', 'Cristina', 'Andre', 'Juliana', 'Roberto',
    'Vanessa', 'Eduardo', 'Camila', 'Felipe', 'Mariana', 'Lucas', 'Gabriela',
    'Thiago', 'Isabela', 'Rafael', 'Carolina', 'Bruno', 'Amanda', 'Diego',
    'Larissa', 'Guilherme', 'Beatriz', 'Rodrigo', 'Natalia', 'Alexandre',
    'Daniela', 'Leonardo', 'Fernanda', 'Matheus', 'Priscila', 'Vinícius',
    'Tatiana', 'Gustavo', 'Monica', 'Paulo', 'Renata', 'Cesar', 'Adriana',
    'Fabricio', 'Elaine', 'Marcos', 'Silvia', 'Ramon', 'Carla', 'Douglas',
    'Michele', 'Wagner', 'Débora', 'Jorge', 'Rosana', 'Hugo', 'Cintia',
    'Igor', 'Fabiana', 'Otavio', 'Gisele', 'Nelson', 'Valeria', 'Mauricio',
    'Regina', 'Davi', 'Tania', 'Caio', 'Lilian', 'Elias', 'Cecilia'
  ];
  
  const lastNames = [
    'Silva', 'Santos', 'Oliveira', 'Souza', 'Rodrigues', 'Ferreira', 'Alves',
    'Pereira', 'Lima', 'Gomes', 'Costa', 'Ribeiro', 'Martins', 'Carvalho',
    'Almeida', 'Lopes', 'Soares', 'Fernandes', 'Vieira', 'Barbosa', 'Rocha',
    'Dias', 'Nascimento', 'Andrade', 'Moreira', 'Nunes', 'Mendes', 'Barros',
    'Freitas', 'Cardoso', 'Correia', 'Melo', 'Araujo', 'Castro', 'Monteiro',
    'Ramos', 'Teixeira', 'Cavalcanti', 'Neves', 'Moura', 'Medeiros', 'Azevedo',
    'Dantas', 'Cunha', 'Borges', 'Reis', 'Machado', 'Lima', 'Guimaraes',
    'Oliveira', 'Costa', 'Santos', 'Silva', 'Pereira', 'Rodrigues', 'Alves',
    'Ferreira', 'Souza', 'Gomes', 'Ribeiro', 'Martins', 'Carvalho', 'Almeida'
  ];
  
  const firstName = firstNames[Math.floor(Math.random() * firstNames.length)];
  const lastName = lastNames[Math.floor(Math.random() * lastNames.length)];
  
  return `${firstName} ${lastName}`;
}

// Função para gerar emails aleatórios
function generateRandomEmail(name, index = 0) {
  const domains = ['gmail.com', 'hotmail.com', 'outlook.com', 'yahoo.com', 'zeus.com'];
  const domain = domains[Math.floor(Math.random() * domains.length)];
  const cleanName = name.toLowerCase().replace(/\s+/g, '');
  const timestamp = Date.now();
  const randomNumber = Math.floor(Math.random() * 999999);
  return `${cleanName}${timestamp}${randomNumber}${index}@${domain}`;
}

// Função para gerar telefones aleatórios
function generateRandomPhone() {
  const ddd = Math.floor(Math.random() * 90) + 10; // DDD entre 10 e 99
  const number = Math.floor(Math.random() * 90000000) + 10000000; // 8 dígitos
  return `(${ddd}) ${number.toString().substring(0, 4)}-${number.toString().substring(4)}`;
}

// Função para gerar leads aleatórios
function generateRandomLead(consultorName, consultorEmail, index = 0) {
  const leadNames = [
    'Empresa ABC Ltda', 'Comercial XYZ', 'Indústria Delta', 'Serviços Omega',
    'Tecnologia Beta', 'Consultoria Gamma', 'Comércio Epsilon', 'Indústria Zeta',
    'Serviços Eta', 'Tecnologia Theta', 'Consultoria Iota', 'Comércio Kappa',
    'Indústria Lambda', 'Serviços Mu', 'Tecnologia Nu', 'Consultoria Xi',
    'Comércio Omicron', 'Indústria Pi', 'Serviços Rho', 'Tecnologia Sigma',
    'Consultoria Tau', 'Comércio Upsilon', 'Indústria Phi', 'Serviços Chi',
    'Tecnologia Psi', 'Consultoria Omega', 'Comércio Alpha', 'Indústria Beta',
    'Serviços Gamma', 'Tecnologia Delta', 'Consultoria Epsilon', 'Comércio Zeta'
  ];
  
  const ocupations = [
    'Diretor Comercial', 'Gerente de Vendas', 'CEO', 'Proprietário',
    'Diretor Financeiro', 'Gerente de Marketing', 'Diretor de Operações',
    'Proprietário', 'Sócio', 'Diretor Administrativo', 'Gerente Geral',
    'Diretor de Recursos Humanos', 'Proprietário', 'Sócio Administrador',
    'Diretor de Tecnologia', 'Gerente de Produtos', 'Diretor de Estratégia'
  ];
  
  const products = [
    'Seguro de Vida', 'Seguro Residencial', 'Seguro Automóvel', 'Seguro Empresarial',
    'Previdência Privada', 'Seguro Saúde', 'Seguro Viagem', 'Seguro Rural',
    'Seguro Condomínio', 'Seguro de Crédito', 'Seguro de Responsabilidade Civil',
    'Seguro de Transporte', 'Seguro de Equipamentos', 'Seguro de Riscos de Engenharia'
  ];
  
  const statuses = [
    'novos_leads', 'contato_feito', 'proposta_enviada', 'negociacao',
    'fechado', 'perdido', 'aguardando_retorno', 'reagendado'
  ];
  
  const leadName = leadNames[Math.floor(Math.random() * leadNames.length)];
  const ocupation = ocupations[Math.floor(Math.random() * ocupations.length)];
  const product = products[Math.floor(Math.random() * products.length)];
  const status = statuses[Math.floor(Math.random() * statuses.length)];
  const potentialValue = (Math.random() * 50000 + 5000).toFixed(2);
  
  return {
    name: leadName,
    email: generateRandomEmail(leadName, index),
    phone: generateRandomPhone(),
    ocupation: ocupation,
    potentialValue: potentialValue,
    observations: `Lead gerado automaticamente para teste. Consultor responsável: ${consultorName}`,
    status: status,
    product: product
  };
}

async function createTestData() {
  try {
    console.log('🚀 Iniciando criação de dados de teste...');
    
    // Verificar se já existem dados
    const existingConsultores = await prisma.team.count();
    const existingLeads = await prisma.lead.count();
    
    console.log(`Encontrados ${existingConsultores} consultores e ${existingLeads} leads existentes.`);
    
    if (existingConsultores > 0) {
      console.log('⚠️  Já existem consultores no banco. Deseja continuar mesmo assim? (Ctrl+C para cancelar)');
      console.log('Pressione Enter para continuar...');
      await new Promise(resolve => setTimeout(resolve, 3000));
    }
    
    const hashedPassword = await bcrypt.hash('123456', 12);
    const consultores = [];
    
    console.log('\n📋 Criando 70 consultores...');
    
    // Criar 70 consultores
    for (let i = 1; i <= 70; i++) {
      const name = generateRandomName();
      const email = generateRandomEmail(name);
      
      const consultor = await prisma.team.create({
        data: {
          name: name,
          email: email,
          position: 'Consultor',
          password: hashedPassword
        }
      });
      
      consultores.push(consultor);
      
      if (i % 10 === 0) {
        console.log(`✅ Criados ${i} consultores...`);
      }
    }
    
    console.log('\n📊 Criando 10 leads para cada consultor...');
    
    let totalLeads = 0;
    
    // Criar 10 leads para cada consultor
    for (const consultor of consultores) {
      for (let j = 1; j <= 10; j++) {
        const leadData = generateRandomLead(consultor.name, consultor.email, j);
        
        await prisma.lead.create({
          data: {
            ...leadData,
            createdBy: consultor.id
          }
        });
        
        totalLeads++;
      }
      
      if (consultores.indexOf(consultor) % 10 === 0) {
        console.log(`✅ Criados leads para ${consultores.indexOf(consultor) + 1} consultores...`);
      }
    }
    
    console.log('\n🎉 Dados de teste criados com sucesso!');
    console.log(`📈 Total de consultores criados: ${consultores.length}`);
    console.log(`📈 Total de leads criados: ${totalLeads}`);
    console.log('\n📋 Informações de acesso:');
    console.log('Email padrão: [email_do_consultor]');
    console.log('Senha padrão: 123456');
    console.log('\n💡 Dica: Use o script list-users.js para ver todos os consultores criados.');
    
  } catch (error) {
    console.error('❌ Erro ao criar dados de teste:', error);
  } finally {
    await prisma.$disconnect();
  }
}

createTestData(); 