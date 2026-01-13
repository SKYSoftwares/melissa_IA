const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function simulateFrontend() {
  try {
    console.log('🔍 Simulando comportamento do frontend...\n');
    
    // Simular dados do usuário logado (como seria no localStorage)
    const userData = {
      id: 'cmdajdw4v000fv4i4hx8qrgb4',
      name: 'Gerente 1 - Gabriela Nascimento',
      email: 'gabrielanascimento17529470031181751141_1@yahoo.com',
      role: 'gerente'
    };
    
    console.log('1️⃣ Dados do usuário logado:');
    console.log(JSON.stringify(userData, null, 2));
    console.log('');
    
    // Simular a função fetchLeads do frontend
    console.log('2️⃣ Simulando fetchLeads...');
    
    if (!userData.email || !userData.role) {
      console.log('❌ Dados do usuário incompletos');
      return;
    }
    
    // Simular a chamada da API
    const apiUrl = `/api/leads?userEmail=${encodeURIComponent(userData.email)}&userRole=${encodeURIComponent(userData.role)}`;
    console.log(`🔗 URL da API: ${apiUrl}`);
    
    // Simular a lógica da API
    console.log('\n3️⃣ Executando lógica da API...');
    
    const gerente = await prisma.team.findUnique({
      where: { email: userData.email },
      include: {
        managedTeams: {
          include: {
            members: {
              select: { id: true }
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
    
    let memberIds = [];
    if (gerente.managedTeams.length > 0) {
      memberIds = gerente.managedTeams.flatMap(team => 
        team.members.map(member => member.id)
      );
      memberIds.push(gerente.id);
    } else {
      memberIds = [gerente.id];
    }
    
    console.log(`📊 IDs dos membros: ${memberIds.length}`);
    
    // Buscar leads
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
    
    console.log(`📊 Total de leads retornados: ${leads.length}\n`);
    
    // Simular o que o frontend faria com os dados
    console.log('4️⃣ Simulando processamento do frontend...');
    
    if (leads.length > 0) {
      console.log('✅ Dados encontrados - frontend deveria exibir os leads');
      console.log('📋 Primeiros 3 leads que apareceriam:');
      
      leads.slice(0, 3).forEach((lead, index) => {
        console.log(`   ${index + 1}. ${lead.name}`);
        console.log(`      Criado por: ${lead.creator?.name || 'N/A'}`);
        console.log(`      Status: ${lead.status}`);
        console.log(`      Valor: ${lead.potentialValue}`);
        console.log('');
      });
      
      // Simular agrupamento por status (como no frontend)
      const leadsByStatus = {};
      leads.forEach(lead => {
        const status = lead.status || 'sem_status';
        if (!leadsByStatus[status]) {
          leadsByStatus[status] = [];
        }
        leadsByStatus[status].push(lead);
      });
      
      console.log('📊 Distribuição por status:');
      Object.entries(leadsByStatus).forEach(([status, statusLeads]) => {
        console.log(`   ${status}: ${statusLeads.length} leads`);
      });
      
    } else {
      console.log('❌ Nenhum lead encontrado - frontend não exibiria nada');
    }
    
    // Verificar se há algum problema de cache ou estado
    console.log('\n5️⃣ Verificando possíveis problemas...');
    
    // Verificar se todos os membros têm leads
    const membersWithLeads = await prisma.lead.groupBy({
      by: ['createdBy'],
      _count: {
        id: true
      },
      where: {
        createdBy: { in: memberIds }
      }
    });
    
    console.log(`📊 Membros com leads: ${membersWithLeads.length}`);
    membersWithLeads.forEach(member => {
      console.log(`   ID ${member.createdBy}: ${member._count.id} leads`);
    });
    
  } catch (error) {
    console.error('❌ Erro:', error);
  } finally {
    await prisma.$disconnect();
  }
}

simulateFrontend(); 