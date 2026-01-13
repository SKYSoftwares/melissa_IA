// Script para testar localStorage no navegador
console.log('🔍 Testando localStorage...');

// Simular dados do usuário que deveriam estar no localStorage
const userData = {
  id: 'cmdajdw4v000fv4i4hx8qrgb4',
  name: 'Gerente 1 - Gabriela Nascimento',
  email: 'gabrielanascimento17529470031181751141_1@yahoo.com',
  role: 'gerente'
};

console.log('📋 Dados do usuário que deveriam estar no localStorage:');
console.log(JSON.stringify(userData, null, 2));

// Verificar se há dados no localStorage
const savedUser = localStorage.getItem('user');
console.log('💾 Dados salvos no localStorage:', savedUser);

if (savedUser) {
  try {
    const parsedUser = JSON.parse(savedUser);
    console.log('✅ Dados parseados do localStorage:', parsedUser);
    
    // Verificar se os dados estão corretos
    if (parsedUser.email === userData.email && parsedUser.role === userData.role) {
      console.log('✅ Dados do localStorage estão corretos!');
    } else {
      console.log('❌ Dados do localStorage estão incorretos!');
      console.log('Esperado:', userData);
      console.log('Encontrado:', parsedUser);
    }
  } catch (error) {
    console.error('❌ Erro ao parsear dados do localStorage:', error);
  }
} else {
  console.log('❌ Nenhum dado encontrado no localStorage');
  console.log('💡 Isso pode indicar que:');
  console.log('   1. O usuário não fez login');
  console.log('   2. O login não salvou os dados corretamente');
  console.log('   3. O localStorage foi limpo');
}

// Função para simular o login
function simulateLogin() {
  console.log('🔐 Simulando login...');
  localStorage.setItem('user', JSON.stringify(userData));
  console.log('✅ Dados salvos no localStorage');
  
  // Recarregar a página para testar
  console.log('🔄 Recarregando página...');
  window.location.reload();
}

// Função para limpar localStorage
function clearLocalStorage() {
  console.log('🗑️ Limpando localStorage...');
  localStorage.removeItem('user');
  console.log('✅ localStorage limpo');
}

// Adicionar botões para teste (se estiver no navegador)
if (typeof window !== 'undefined') {
  console.log(`
🎯 INSTRUÇÕES PARA TESTE:

1. Se não há dados no localStorage:
   - Execute: simulateLogin()
   - Isso simulará o login da gerente

2. Para limpar e testar novamente:
   - Execute: clearLocalStorage()
   - Depois faça login normalmente

3. Para verificar se a API funciona:
   - Execute: testApiInBrowser()
  `);
  
  // Função para testar a API
  window.testApiInBrowser = async function() {
    try {
      console.log('🧪 Testando API...');
      const response = await fetch('/api/leads?userEmail=gabrielanascimento17529470031181751141_1%40yahoo.com&userRole=gerente');
      console.log('📡 Status:', response.status);
      
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
  };
  
  // Adicionar funções globais
  window.simulateLogin = simulateLogin;
  window.clearLocalStorage = clearLocalStorage;
} 