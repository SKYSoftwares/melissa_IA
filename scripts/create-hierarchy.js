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

// Função para gerar emails únicos
function generateRandomEmail(name, index = 0) {
  const domains = ['gmail.com', 'hotmail.com', 'outlook.com', 'yahoo.com', 'zeus.com'];
  const domain = domains[Math.floor(Math.random() * domains.length)];
  const cleanName = name.toLowerCase().replace(/\s+/g, '');
  const timestamp = Date.now();
  const randomNumber = Math.floor(Math.random() * 999999);
  return `${cleanName}${timestamp}${randomNumber}${index}@${domain}`;
}

// Função para criar permissões baseadas no cargo
async function createPermissions(teamId, role) {
  const permissions = {
    teamId: teamId,
    role: role,
    dashboard: true,
    whatsapp: true,
    propostas: true,
    simuladores: true,
    relatorios: true,
    campanhas: true,
    equipe: role === 'diretor' || role === 'gerente',
    configuracoes: role === 'diretor'
  };

  await prisma.teamPermission.create({
    data: permissions
  });
}

async function createHierarchy() {
  try {
    console.log('🏢 Criando hierarquia organizacional...\n');
    
    const hashedPassword = await bcrypt.hash('123456', 12);
    
    // Verificar consultores existentes
    const existingConsultores = await prisma.team.findMany({
      where: {
        position: 'Consultor'
      },
      orderBy: {
        name: 'asc'
      }
    });
    
    console.log(`📊 Encontrados ${existingConsultores.length} consultores existentes.`);
    
    if (existingConsultores.length < 400) {
      console.log('⚠️  Aviso: Serão necessários pelo menos 400 consultores para distribuir 20 por gerente.');
      console.log('💡 Execute o script create-test-data.js primeiro para criar mais consultores.');
    }
    
    // Criar 5 diretores
    console.log('\n👔 Criando 5 diretores...');
    const diretores = [];
    
    for (let i = 1; i <= 5; i++) {
      const name = generateRandomName();
      const email = generateRandomEmail(name, i);
      
      const diretor = await prisma.team.create({
        data: {
          name: `Diretor ${i} - ${name}`,
          email: email,
          position: 'Diretor',
          password: hashedPassword
        }
      });
      
      await createPermissions(diretor.id, 'diretor');
      diretores.push(diretor);
      
      console.log(`✅ Diretor ${i} criado: ${diretor.name} (${email})`);
    }
    
    // Criar 4 gerentes para cada diretor (total: 20 gerentes)
    console.log('\n👨‍💼 Criando 4 gerentes para cada diretor...');
    const gerentes = [];
    
    for (let diretorIndex = 0; diretorIndex < diretores.length; diretorIndex++) {
      const diretor = diretores[diretorIndex];
      
      for (let gerenteIndex = 1; gerenteIndex <= 4; gerenteIndex++) {
        const name = generateRandomName();
        const email = generateRandomEmail(name, `${diretorIndex + 1}_${gerenteIndex}`);
        
        const gerente = await prisma.team.create({
          data: {
            name: `Gerente ${gerenteIndex} - ${name}`,
            email: email,
            position: 'Gerente',
            password: hashedPassword
          }
        });
        
        await createPermissions(gerente.id, 'gerente');
        gerentes.push({ ...gerente, diretorId: diretor.id });
        
        console.log(`✅ Gerente ${gerenteIndex} do Diretor ${diretorIndex + 1} criado: ${gerente.name} (${email})`);
      }
    }
    
    // Criar equipes e distribuir consultores
    console.log('\n👥 Criando equipes e distribuindo consultores...');
    
    let consultorIndex = 0;
    
    for (let gerenteIndex = 0; gerenteIndex < gerentes.length; gerenteIndex++) {
      const gerente = gerentes[gerenteIndex];
      
      // Criar equipe para o gerente
      const teamGroup = await prisma.teamGroup.create({
        data: {
          name: `Equipe ${gerente.name}`,
          managerId: gerente.id
        }
      });
      
      console.log(`\n🏢 Criada equipe: ${teamGroup.name}`);
      
      // Distribuir ~20 consultores para esta equipe
      const consultoresParaEstaEquipe = Math.min(20, existingConsultores.length - consultorIndex);
      
      for (let i = 0; i < consultoresParaEstaEquipe; i++) {
        if (consultorIndex < existingConsultores.length) {
          const consultor = existingConsultores[consultorIndex];
          
          // Atualizar consultor para pertencer à equipe
          await prisma.team.update({
            where: { id: consultor.id },
            data: { teamId: teamGroup.id }
          });
          
          console.log(`  👤 ${consultor.name} adicionado à equipe ${teamGroup.name}`);
          consultorIndex++;
        }
      }
      
      console.log(`  📊 ${consultoresParaEstaEquipe} consultores adicionados à equipe ${teamGroup.name}`);
    }
    
    // Estatísticas finais
    console.log('\n📈 Estatísticas da Hierarquia:');
    console.log(`👔 Diretores: ${diretores.length}`);
    console.log(`👨‍💼 Gerentes: ${gerentes.length}`);
    console.log(`👥 Consultores distribuídos: ${consultorIndex}`);
    console.log(`🏢 Equipes criadas: ${gerentes.length}`);
    
    console.log('\n📋 Informações de acesso:');
    console.log('Senha padrão para todos: 123456');
    console.log('\n👔 Diretores:');
    diretores.forEach((diretor, index) => {
      console.log(`  ${index + 1}. ${diretor.name} - ${diretor.email}`);
    });
    
    console.log('\n👨‍💼 Gerentes:');
    gerentes.forEach((gerente, index) => {
      console.log(`  ${index + 1}. ${gerente.name} - ${gerente.email}`);
    });
    
    console.log('\n💡 Dica: Use o script list-hierarchy.js para ver a estrutura completa.');
    
  } catch (error) {
    console.error('❌ Erro ao criar hierarquia:', error);
  } finally {
    await prisma.$disconnect();
  }
}

createHierarchy(); 