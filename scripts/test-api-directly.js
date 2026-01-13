const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function testApiDirectly() {
  try {
    console.log('🔍 Testando API de leads diretamente...\n');
    
    const gerenteEmail = 'gabrielanascimento17529470031181751141_1@yahoo.com';
    const userRole = 'gerente';
    
    console.log('1️⃣ Buscando gerente no banco...');
    
    const gerente = await prisma.team.findUnique({
      where: { email: gerenteEmail },
      include: {
        managedTeams: {
          include: {
            members: {
              select: { id: true, name: true, email: true }
            }
          }
        }
      }
    });
    
    if (!gerente) {
      console.log('❌ Gerente não encontrada');
      return;
    }
    
    console.log(`✅ Gerente encontrada: ${gerente.name}`);
    console.log(`   Equipes gerenciadas: ${gerente.managedTeams.length}`);
    
    // Listar membros das equipes
    let totalMembers = 0;
    const memberIds = [];
    
    gerente.managedTeams.forEach((team, index) => {
      console.log(`   Equipe ${index + 1}: ${team.name}`);
      console.log(`   Membros: ${team.members.length}`);
      team.members.forEach(member => {
        console.log(`      - ${member.name} (${member.id})`);
        memberIds.push(member.id);
        totalMembers++;
      });
    });
    
    // Adicionar o próprio gerente
    memberIds.push(gerente.id);
    
    console.log(`\n📊 Total de membros: ${totalMembers + 1} (incluindo gerente)`);
    console.log(`🔍 IDs dos membros: ${memberIds.length}`);
    
    // Buscar leads usando a mesma lógica da API
    console.log('\n2️⃣ Buscando leads...');
    
    const leads = await prisma.lead.findMany({
      where: {
        createdBy: { in: memberIds }
      },
      include: {
        creator: {
          select: {
            name: true,
            email: true,
            position: true
          }
        }
      },
      orderBy: { id: 'desc' }
    });
    
    console.log(`📊 Total de leads encontrados: ${leads.length}\n`);
    
    if (leads.length > 0) {
      console.log('📋 Primeiros 5 leads:');
      leads.slice(0, 5).forEach((lead, index) => {
        console.log(`   ${index + 1}. ${lead.name}`);
        console.log(`      Criado por: ${lead.creator?.name || 'N/A'}`);
        console.log(`      Status: ${lead.status}`);
        console.log(`      Valor: ${lead.potentialValue}`);
        console.log('');
      });
      
      // Agrupar por criador
      const leadsByCreator = {};
      leads.forEach(lead => {
        const creatorName = lead.creator?.name || 'Desconhecido';
        if (!leadsByCreator[creatorName]) {
          leadsByCreator[creatorName] = [];
        }
        leadsByCreator[creatorName].push(lead);
      });
      
      console.log('📊 Leads por criador:');
      Object.entries(leadsByCreator).forEach(([creator, creatorLeads]) => {
        console.log(`   ${creator}: ${creatorLeads.length} leads`);
      });
    } else {
      console.log('❌ Nenhum lead encontrado');
    }
    
    // Verificar se há leads no banco
    console.log('\n3️⃣ Verificando total de leads no banco...');
    
    const totalLeads = await prisma.lead.count();
    console.log(`📊 Total de leads no banco: ${totalLeads}`);
    
    if (totalLeads > 0) {
      const sampleLeads = await prisma.lead.findMany({
        take: 5,
        include: {
          creator: {
            select: {
              name: true,
              email: true
            }
          }
        }
      });
      
      console.log('\n📋 Amostra de leads no banco:');
      sampleLeads.forEach((lead, index) => {
        console.log(`   ${index + 1}. ${lead.name} (${lead.creator?.name || 'N/A'})`);
      });
    }
    
  } catch (error) {
    console.error('❌ Erro:', error);
  } finally {
    await prisma.$disconnect();
  }
}

testApiDirectly(); 