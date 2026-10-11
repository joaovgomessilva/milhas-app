/** Glossário de um toque. Linguagem simples, sem jargão, uma ideia por verbete. */
export const GLOSSARY = {
  milheiro: {
    term: "Milheiro",
    short: "1.000 milhas.",
    body: "Milheiro é só um nome para 1.000 milhas. Todo preço de milha é falado por milheiro: \"o milheiro Smiles está a R$ 22\" quer dizer que 1.000 milhas valem cerca de R$ 22.",
  },
  taxas: {
    term: "Taxas",
    short: "A parte que você paga em dinheiro mesmo usando milhas.",
    body: "Mesmo emitindo com milhas, a taxa de embarque é cobrada em dinheiro. Em voo nacional fica perto de R$ 45 por trecho; em internacional pode passar de R$ 300. Por isso a comparação justa é: dinheiro × milhas + taxas.",
  },
  referencia: {
    term: "Valor de referência",
    short: "Quanto 1.000 milhas costumam valer.",
    body: "É o valor médio que 1.000 milhas daquele programa rendem numa emissão razoável, pela experiência do mercado. Se uma passagem faz suas milhas valerem mais que isso, é um bom uso. Se faz valer menos, melhor pagar em dinheiro e guardar as milhas para outra viagem.",
  },
  implicito: {
    term: "Milheiro nesta emissão",
    short: "Quanto cada 1.000 milhas está valendo neste voo.",
    body: "A conta é: (preço em dinheiro − taxas) ÷ (milhas ÷ 1.000). Exemplo: R$ 800 de passagem, R$ 45 de taxas e 25.000 milhas → (800 − 45) ÷ 25 = R$ 30 por milheiro. Compare com o valor de referência do programa.",
  },
  bonus: {
    term: "Bônus de transferência",
    short: "Milhas extras ao transferir pontos do banco.",
    body: "Pontos de banco (Livelo, Esfera) viram milhas quando você transfere para a companhia. De tempos em tempos a companhia dá bônus: com 80% de bônus, 10.000 pontos viram 18.000 milhas. É o jeito mais barato de conseguir milhas, por isso quase sempre vale esperar um bônus.",
  },
  programa: {
    term: "Programa de milhas",
    short: "Onde as milhas ficam guardadas.",
    body: "Cada companhia tem o seu: Smiles (GOL), LATAM Pass (LATAM) e TudoAzul (Azul). As milhas de um programa só emitem passagem nele, embora alguns tenham parceiros. Pontos de banco não são milhas até serem transferidos.",
  },
  tipico: {
    term: "Faixa típica",
    short: "Quanto essa rota costuma custar.",
    body: "Olhamos o menor preço de cada dia dos próximos 6 meses e pegamos o miolo: a faixa onde ficam metade dos dias (do percentil 25 ao 75). Se o preço que você está vendo está abaixo dessa faixa, está barato para a rota. Se está acima, está caro. É a mesma lógica do indicador de preço do Google Flights, só que com a conta à vista.",
  },
  fonte: {
    term: "Fonte e verificação",
    short: "De onde veio o preço e há quanto tempo.",
    body: "Preço de passagem muda a toda hora. Por isso cada valor aqui mostra de onde veio e quando foi conferido. Antes de comprar, abra o site da companhia pelo botão \"Ver na companhia\" e confira. Se o valor estiver diferente, avise pelo botão: isso ajuda a corrigir a fonte.",
  },
} as const;

export type GlossaryKey = keyof typeof GLOSSARY;
