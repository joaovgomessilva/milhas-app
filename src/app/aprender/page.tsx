const LESSONS = [
  {
    title: "O que é o milheiro",
    body: "Milheiro é o nome de 1.000 milhas. Todo mundo que fala de milhas fala em preço por milheiro: \"o milheiro Smiles está a R$ 22\". É a unidade que permite comparar uma passagem em milhas com uma em dinheiro.",
  },
  {
    title: "Como saber se vale a pena usar milhas",
    body: "Pegue o preço em dinheiro, tire as taxas e divida pelo número de milheiros. Exemplo: passagem de R$ 800 com taxas de R$ 45 por 25.000 milhas → (800 − 45) / 25 = R$ 30 por milheiro. Se esse número é maior que o valor de referência do programa (em torno de R$ 22 a R$ 25), suas milhas estão rendendo bem. Se é menor, pague em dinheiro e guarde as milhas.",
  },
  {
    title: "Taxas de embarque",
    body: "Mesmo emitindo com milhas, você paga as taxas em dinheiro. Em voo nacional costuma ser por volta de R$ 45 por trecho; em internacional pode passar de R$ 300. Por isso a conta sempre compara o preço em dinheiro com milhas + taxas.",
  },
  {
    title: "Transferência bonificada",
    body: "Pontos de banco (Livelo, Esfera) viram milhas quando você transfere para o programa da companhia. Em promoções, o programa dá bônus: com 80% de bônus, 10.000 pontos viram 18.000 milhas. É o jeito mais barato de encher a carteira de milhas. Quase sempre vale esperar um bônus para transferir.",
  },
  {
    title: "Comprar pontos e transferir",
    body: "Quando o banco vende pontos em promoção (por exemplo, R$ 35 o milheiro) e ao mesmo tempo há bônus de transferência, dá para comprar e transferir na hora: 1.000 pontos a R$ 35 viram 1.800 milhas, ou seja, cada milheiro de milhas custou menos de R$ 20. Se a passagem que você quer está rendendo R$ 30 por milheiro, você economiza mesmo sem ter nenhuma milha hoje. O app avisa quando isso acontece.",
  },
  {
    title: "Milhas vencem",
    body: "Milhas aéreas costumam expirar entre 2 e 3 anos depois de creditadas, dependendo do programa. Pontos de banco também. Se você tem milhas perto de vencer, usar em uma emissão razoável é melhor do que perder tudo.",
  },
];

export default function LearnPage() {
  return (
    <main className="px-4 pt-6 pb-4 flex flex-col gap-5">
      <header>
        <h1 className="text-[26px] font-semibold">Aprender</h1>
        <p className="text-ink-muted mt-1">O básico de milhas em seis leituras de um minuto.</p>
      </header>
      <ol className="flex flex-col gap-3">
        {LESSONS.map((l, i) => (
          <li key={l.title} className="card p-4">
            <div className="flex items-start gap-3">
              <span className="w-7 h-7 rounded-full bg-primary-soft text-primary-strong text-sm font-semibold flex items-center justify-center shrink-0" aria-hidden>{i + 1}</span>
              <div>
                <h2 className="text-base font-semibold">{l.title}</h2>
                <p className="text-sm text-ink mt-1">{l.body}</p>
              </div>
            </div>
          </li>
        ))}
      </ol>
    </main>
  );
}
