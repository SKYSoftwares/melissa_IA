import {
  simuladorConsorcioLanceFixo,
  simuladorConsorcioSorteio,
  simuladorConsorcioLanceVariavel,
  simuladorHomeEquity
} from '../lib/simuladores';

console.log('--- Simulador Consórcio - Lance Fixo ---');
console.log(simuladorConsorcioLanceFixo({
  creditoUnitario: 50000,
  qtdParcelas: 60,
  taxaParcela: 10,
  acrescentarSeguro: true,
  juncaoDeCotas: 1,
  percentualParcelaReduzida: 50,
  parcelaContemplacao: 12,
  lancePagoEmDinheiro: 2,
  lanceEmbutidoNaCarta: 1
}));

console.log('--- Simulador Consórcio - Sorteio ---');
console.log(simuladorConsorcioSorteio({
  credito: 50000,
  qtdParcelas: 60,
  taxaParcela: 10,
  acrescentarSeguro: true,
  juncaoDeCotas: 1
}));

console.log('--- Simulador Consórcio - Lance Variável ---');
console.log(simuladorConsorcioLanceVariavel({
  credito: 50000,
  qtdParcelas: 60,
  taxaParcela: 10,
  parcelasPagas: 5,
  parcelasEmbutidas: 2,
  acrescentarSeguro: true,
  usarINCC: true
}));

console.log('--- Simulador Home Equity ---');
console.log(simuladorHomeEquity({
  valorImovel: 300000,
  valorCredito: 100000,
  prazoMeses: 120,
  tabelaAmortizacao: "PRICE",
  taxa: 12,
  tipoDaTaxa: "a.a"
})); 