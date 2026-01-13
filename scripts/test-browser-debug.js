console.log('🔍 Script de debug para o navegador');

// Instruções para testar no navegador
console.log(`
🎯 INSTRUÇÕES PARA TESTAR:

1. Abra o navegador e acesse: http://localhost:3000/login

2. Faça login com a gerente:
   Email: gabrielanascimento17529470031181751141_1@yahoo.com
   Senha: 123456

3. Após o login, acesse: http://localhost:3000/leads

4. Abra o Console do navegador (F12) e procure pelos logs:
   - 🚀 useEffect executado - carregando leads
   - 👤 Usuário atual: {dados do usuário}
   - 🔍 fetchLeads chamada
   - 🔗 Chamando API: /api/leads?userEmail=...&userRole=gerente
   - 📡 Resposta da API: 200 OK
   - 📊 Dados recebidos: 100 leads
   - ✅ Leads atualizados no estado
   - 🔄 Estado dbLeads atualizado: 100 leads

5. Se os logs não aparecerem, verifique:
   - Se o usuário está logado corretamente
   - Se o contexto de autenticação está funcionando
   - Se a API está respondendo

6. Se os logs aparecerem mas os leads não são exibidos, verifique:
   - Se há erros no console
   - Se o estado dbLeads está sendo atualizado
   - Se a renderização está funcionando
`);

// Função para testar a API diretamente no navegador
async function testApiInBrowser() {
  try {
    console.log('🧪 Testando API no navegador...');
    
    const response = await fetch('/api/leads?userEmail=gabrielanascimento17529470031181751141_1%40yahoo.com&userRole=gerente');
    
    console.log('📡 Status da resposta:', response.status);
    
    if (response.ok) {
      const data = await response.json();
      console.log('📊 Dados recebidos:', data.length, 'leads');
      console.log('📋 Primeiros 3 leads:', data.slice(0, 3).map(l => ({ name: l.name, status: l.status })));
    } else {
      console.log('❌ Erro na API:', response.statusText);
    }
  } catch (error) {
    console.error('❌ Erro ao testar API:', error);
  }
}

// Executar teste se estiver no navegador
if (typeof window !== 'undefined') {
  console.log('🌐 Executando no navegador');
  // Descomente a linha abaixo para testar a API automaticamente
  // testApiInBrowser();
} else {
  console.log('🖥️ Executando no servidor');
} 