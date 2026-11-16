export const ABERTURAS = {
  caixa_misteriosa: {
    label:    "Caixa misteriosa",
    descricao: "Caixa de papelão com etiqueta 'DEVOLUÇÃO' treme e abre revelando o produto",
  },
  pergunta: {
    label:    "Pergunta",
    descricao: "Pergunta provocativa em texto grande com '?' pulsando na tela",
  },
  preco_primeiro: {
    label:    "Preço primeiro",
    descricao: "Número gigante do preço cai na tela em destaque antes do produto aparecer",
  },
  contagem: {
    label:    "Contagem regressiva",
    descricao: "Contagem 3… 2… 1… e o produto explode na tela com efeito dramático",
  },
  problema_solucao: {
    label:    "Problema e solução",
    descricao: "Tela acinzentada mostra o problema do dia a dia; depois ganha cor e revela o produto como solução",
  },
  raspadinha: {
    label:    "Raspadinha",
    descricao: "Produto escondido atrás de uma camada que é 'raspada' revelando o achado",
  },
  urgencia: {
    label:    "Urgência",
    descricao: "Faixa piscando 'SÓ 1 UNIDADE' com contador de tempo — só usar quando unidade_unica = true",
  },
  detalhe: {
    label:    "Detalhe ampliado",
    descricao: "Vídeo começa num detalhe close da foto e vai abrindo o enquadramento até revelar o produto inteiro",
  },
} as const;

export type AberturaKey = keyof typeof ABERTURAS;

export function sortearAbertura({
  unidade_unica,
  desconto_pct,
  ultimas_3,
}: {
  unidade_unica: boolean;
  desconto_pct: number;
  ultimas_3: AberturaKey[];
}): AberturaKey {
  const pesos: Record<AberturaKey, number> = {
    caixa_misteriosa: 2,
    pergunta:         2,
    preco_primeiro:   desconto_pct >= 25 ? 4 : 2,
    contagem:         2,
    problema_solucao: 2,
    raspadinha:       2,
    urgencia:         unidade_unica ? 3 : 0,
    detalhe:          2,
  };

  for (const a of ultimas_3) pesos[a] = 0;

  const candidatos: AberturaKey[] = [];
  for (const [key, peso] of Object.entries(pesos) as [AberturaKey, number][]) {
    for (let i = 0; i < peso; i++) candidatos.push(key);
  }

  if (candidatos.length === 0) {
    const all = Object.keys(ABERTURAS) as AberturaKey[];
    return all[Math.floor(Math.random() * all.length)];
  }

  return candidatos[Math.floor(Math.random() * candidatos.length)];
}
