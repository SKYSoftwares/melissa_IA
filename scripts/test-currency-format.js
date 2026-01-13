// Função utilitária para formatar moeda brasileira (igual à do frontend)
function formatarMoedaBR(valor) {
  // Se já está formatado com R$, retorna como está
  if (valor.includes('R$')) {
    return valor;
  }
  
  // Remove tudo que não for número
  let v = valor.replace(/\D/g, "");
  if (!v) return "";
  v = (parseInt(v, 10) / 100).toFixed(2) + "";
  v = v.replace(".", ",");
  v = v.replace(/(\d)(?=(\d{3})+(?!\d))/g, "$1.");
  return "R$ " + v;
}

// Testar diferentes tipos de valores
const testValues = [
  "50268.14",
  "77795.98", 
  "105245.04",
  "10000000",
  "10000",
  "R$ 80.000",
  "R$ 350.000",
  "R$ 25.000"
];

console.log("Testando formatação de moeda:");
testValues.forEach(valor => {
  console.log(`${valor} → ${formatarMoedaBR(valor)}`);
}); 