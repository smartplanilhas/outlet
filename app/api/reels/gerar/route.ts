import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { put } from "@vercel/blob";
import sql, { ensureTable } from "@/lib/db";
import { sortearAbertura, ABERTURAS, type AberturaKey } from "@/lib/aberturas";

export const maxDuration = 120;

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

// ─── Tipos ────────────────────────────────────────────────────────────────────

interface Roteiro {
  abertura_fala:  string;
  corpo_fala:     string;
  fechamento_fala: string;
  textos_tela: {
    abertura:   string;
    vantagens:  string[];
    chamada:    string[];
  };
  legenda:   string;
  hashtags:  string[];
}

interface ElevenAlignment {
  characters:                    string[];
  character_start_times_seconds: number[];
  character_end_times_seconds:   number[];
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

const CTA_LABEL: Record<string, string> = {
  comenta_eu_quero: "Comenta EU QUERO",
  whatsapp:         "Chama no WhatsApp",
  catalogo_bio:     "Link da bio",
  venha_loja:       "Venha à loja",
};

function buildPrompt({
  descricao,
  vantagens,
  precoLoja,
  precoInternet,
  unidade_unica,
  cta,
  aberturaKey,
  ultimasFalas,
  novaAbertura,
}: {
  descricao:     string;
  vantagens:     string[];
  precoLoja:     number;
  precoInternet: number | null;
  unidade_unica: boolean;
  cta:           string[];
  aberturaKey:   AberturaKey;
  ultimasFalas:  string[];
  novaAbertura:  boolean;
}): string {
  const abertura   = ABERTURAS[aberturaKey];
  const ctaTextos  = cta.map(c => CTA_LABEL[c] ?? c).join(" / ");
  const precoFmt   = (v: number) => `R$ ${v.toFixed(2).replace(".", ",")}`;

  const desconto = precoInternet
    ? Math.round(((precoInternet - precoLoja) / precoInternet) * 100)
    : 0;

  const precoInstrucao = precoInternet
    ? `Preço na internet: ${precoFmt(precoInternet)} · Preço aqui: ${precoFmt(precoLoja)} (${desconto}% mais barato).
OBRIGATÓRIO no corpo_fala: sempre cite PRIMEIRO o preço da internet e DEPOIS o preço da loja. Estrutura: "Na internet custa [por extenso]. Aqui [por extenso]." — nunca inverta essa ordem.`
    : `Preço na loja: ${precoFmt(precoLoja)}. Fale por extenso na narração.`;

  const listaFalas = ultimasFalas.length
    ? `\nFRASES DE ABERTURA JÁ USADAS (crie algo DIFERENTE):\n${ultimasFalas.map((f, i) => `${i + 1}. "${f}"`).join("\n")}\n`
    : "";

  const instrucaoModo = novaAbertura
    ? "\nMODO: Gere apenas uma NOVA abertura_fala. Para corpo_fala e fechamento_fala use qualquer texto (será descartado).\n"
    : "";

  return `Crie um script de Reels do Instagram para o "Achado do Dia" de uma loja de logística reversa em Sorocaba-SP.

PRODUTO: ${descricao}
BENEFÍCIOS: ${vantagens.length ? vantagens.join(", ") : "não informado"}
${precoInstrucao}
UNIDADE ÚNICA: ${unidade_unica ? "Sim — mencione 'só uma unidade' no fechamento" : "Não"}
CHAMADA PARA AÇÃO (use em textos_tela.chamada): ${ctaTextos}

ABERTURA SORTEADA: ${abertura.label}
Animação: ${abertura.descricao}
${listaFalas}${instrucaoModo}
REGRAS OBRIGATÓRIAS:
1. Tudo em português do Brasil — ZERO palavras em inglês (nem "off", "sale", "outlet", "return", "kit", "new")
2. Total de palavras na narração (abertura_fala + corpo_fala + fechamento_fala): entre 25 e 35 palavras
3. Preços SEMPRE por extenso na narração: "vinte e cinco reais", nunca "R$ 25"
4. Tom: vendedor animado de loja física, sem exagero
5. Nunca cite "Mercado Livre" — diga "na internet" ou "em outras lojas"
6. abertura_fala deve ser DIFERENTE das já usadas acima
7. Quando houver preço da internet: SEMPRE mencione o preço da internet ANTES do preço da loja — nunca ao contrário. O contraste é o argumento de venda principal.

Retorne APENAS JSON válido (sem markdown, sem texto extra):
{
  "abertura_fala": "frase de abertura — 5 a 8 palavras",
  "corpo_fala": "produto + preço — 10 a 15 palavras",
  "fechamento_fala": "chamada para ação — 5 a 8 palavras",
  "textos_tela": {
    "abertura": "texto curtíssimo para tela — máx 4 palavras",
    "vantagens": ["benefício 1", "benefício 2"],
    "chamada": ["texto CTA 1", "texto CTA 2"]
  },
  "legenda": "[DISPONÍVEL] legenda do post com emojis — 2 a 4 frases — sem hashtags",
  "hashtags": ["#achadosorocaba", "#outlet", "#promoção"]
}`;
}

function buildPromptImagem({
  descricao, vantagens, precoLoja, precoInternet, unidade_unica, cta,
}: {
  descricao: string; vantagens: string[]; precoLoja: number;
  precoInternet: number | null; unidade_unica: boolean; cta: string[];
}): string {
  const precoFmt = (v: number) => `R$ ${v.toFixed(2).replace(".", ",")}`;
  const desconto = precoInternet
    ? Math.round(((precoInternet - precoLoja) / precoInternet) * 100)
    : 0;
  const ctaTextos = cta.map(c => CTA_LABEL[c] ?? c).join(" / ");

  return `Crie a legenda e hashtags de um post de imagem no Instagram para o "Achado do Dia" de uma loja de logística reversa em Sorocaba-SP.

PRODUTO: ${descricao}
BENEFÍCIOS: ${vantagens.length ? vantagens.join(", ") : "não informado"}
${precoInternet
  ? `Preço na internet: ${precoFmt(precoInternet)} · Preço aqui: ${precoFmt(precoLoja)} (${desconto}% mais barato).`
  : `Preço aqui: ${precoFmt(precoLoja)}.`}
UNIDADE ÚNICA: ${unidade_unica ? "Sim" : "Não"}
CHAMADA PARA AÇÃO: ${ctaTextos}

REGRAS:
1. Tudo em português do Brasil — ZERO palavras em inglês
2. Legenda começa com [DISPONÍVEL]
3. Tom animado de loja física, sem exagero
4. Nunca cite "Mercado Livre" — use "na internet"

Retorne APENAS este JSON (sem markdown):
{
  "legenda": "[DISPONÍVEL] legenda com emojis — 2 a 4 frases — sem hashtags",
  "hashtags": ["#achadosorocaba", "#outlet", "#promoção"],
  "chamada": ["texto CTA 1", "texto CTA 2"]
}`;
}

function computeTempos(
  roteiro: Pick<Roteiro, "abertura_fala" | "corpo_fala" | "fechamento_fala">,
  al:      ElevenAlignment,
): Array<{ parte: string; texto: string; inicio: number; fim: number }> {
  const full   = `${roteiro.abertura_fala} ${roteiro.corpo_fala} ${roteiro.fechamento_fala}`;
  const partes = [
    { parte: "abertura",   texto: roteiro.abertura_fala },
    { parte: "corpo",      texto: roteiro.corpo_fala },
    { parte: "fechamento", texto: roteiro.fechamento_fala },
  ];
  return partes.map(({ parte, texto }) => {
    const idx = full.indexOf(texto);
    if (idx === -1) return { parte, texto, inicio: 0, fim: 0 };
    const endIdx = Math.min(idx + texto.length - 1, al.character_end_times_seconds.length - 1);
    return {
      parte,
      texto,
      inicio: al.character_start_times_seconds[idx]  ?? 0,
      fim:    al.character_end_times_seconds[endIdx]  ?? 0,
    };
  });
}

// ─── Handler ──────────────────────────────────────────────────────────────────

export async function POST(req: NextRequest) {
  let jobId: number | null = null;

  try {
    const body        = await req.json();
    jobId             = parseInt(body.id);
    const novaAbertura = body.modo === "nova_abertura";

    if (!jobId) return NextResponse.json({ error: "id obrigatório." }, { status: 400 });

    await ensureTable();

    // ── Carregar job + produto ─────────────────────────────────────────────
    const rows = await sql`
      SELECT rt.*, pt.descricao, pt.foto_url, pt.vantagens, pt.preco, pt.preco_internet,
             pt.remover_fundo, pt.unidade_unica, pt.cta,
             rt.cta AS cta_job
      FROM reels_trabalhos rt
      JOIN produtos_triagem pt ON pt.id = rt.produto_id
      WHERE rt.id = ${jobId}
    `;
    const job = rows[0];
    if (!job)             return NextResponse.json({ error: "Trabalho não encontrado." }, { status: 404 });
    if (job.status === "gerando") return NextResponse.json({ error: "Já está sendo gerado." }, { status: 409 });

    await sql`UPDATE reels_trabalhos SET status = 'gerando', atualizado_em = NOW() WHERE id = ${jobId}`;

    // ── Dados de contexto ─────────────────────────────────────────────────
    const ultimos = await sql`
      SELECT roteiro_narracao, abertura
      FROM reels_trabalhos
      WHERE produto_id = ${job.produto_id}
        AND roteiro_narracao IS NOT NULL
        AND id != ${jobId}
      ORDER BY criado_em DESC
      LIMIT 10
    `;

    const isImagem = (job.tipo ?? 'video') === 'imagem';
    console.log(`[gerar] job #${jobId} tipo="${job.tipo}" isImagem=${isImagem}`);

    const cfgRows = await sql`SELECT voz_id FROM config_loja LIMIT 1`;
    const voz_id  = cfgRows[0]?.voz_id ?? "1oZawzZ4adgYtgm1oMqN";

    const ctaJob = ((job.cta_job ?? job.cta) as string[] ?? ["whatsapp"]).slice(0, 2);
    const vantagensJob = (job.vantagens as string[] ?? []).filter(Boolean);

    // ── Abertura (apenas para vídeo) ───────────────────────────────────────
    const desconto = job.preco_internet && job.preco
      ? ((Number(job.preco_internet) - Number(job.preco)) / Number(job.preco_internet)) * 100
      : 0;

    const ultimas3: AberturaKey[] = ultimos.slice(0, 3).map((r: Record<string, unknown>) => r.abertura as string).filter(Boolean) as AberturaKey[];
    const aberturaKey: AberturaKey = isImagem ? 'caixa_misteriosa' : (
      novaAbertura && job.abertura
        ? sortearAbertura({ unidade_unica: !!job.unidade_unica, desconto_pct: desconto, ultimas_3: [job.abertura as AberturaKey, ...ultimas3].slice(0, 3) })
        : sortearAbertura({ unidade_unica: !!job.unidade_unica, desconto_pct: desconto, ultimas_3: ultimas3 })
    );

    const ultimasFalas = ultimos.map((r: Record<string, unknown>) => {
      try { return (JSON.parse(r.roteiro_narracao as string) as Roteiro).abertura_fala; } catch { return null; }
    }).filter(Boolean) as string[];

    // ── Prompt Claude (simplificado para imagem) ───────────────────────────
    const prompt = isImagem
      ? buildPromptImagem({
          descricao:     job.descricao,
          vantagens:     vantagensJob,
          precoLoja:     Number(job.preco),
          precoInternet: job.preco_internet ? Number(job.preco_internet) : null,
          unidade_unica: !!job.unidade_unica,
          cta:           ctaJob,
        })
      : buildPrompt({
          descricao:     job.descricao,
          vantagens:     vantagensJob,
          precoLoja:     Number(job.preco),
          precoInternet: job.preco_internet ? Number(job.preco_internet) : null,
          unidade_unica: !!job.unidade_unica,
          cta:           ctaJob,
          aberturaKey,
          ultimasFalas,
      novaAbertura,
    });

    const claudeRes = await anthropic.messages.create({
      model:      "claude-haiku-4-5-20251001",
      max_tokens: 1024,
      system:     "Você é especialista em copywriting para vídeos curtos. Retorne APENAS JSON válido, sem markdown, sem texto extra.",
      messages:   [{ role: "user", content: prompt }],
    });

    // ── Custo Claude ──────────────────────────────────────────────────────
    const inputTokens  = claudeRes.usage.input_tokens;
    const outputTokens = claudeRes.usage.output_tokens;
    const custoClaude  = inputTokens * 0.0000008 + outputTokens * 0.000004;

    let jsonText = (claudeRes.content[0] as { text: string }).text.trim();
    jsonText = jsonText.replace(/^```(?:json)?\n?/i, "").replace(/\n?```$/i, "").trim();

    let roteiro: Roteiro;
    try {
      roteiro = JSON.parse(jsonText);
    } catch {
      const match = jsonText.match(/\{[\s\S]*\}/);
      if (!match) throw new Error("Claude não retornou JSON válido.");
      roteiro = JSON.parse(match[0]);
    }

    // Para imagem: normalizar campos de vídeo que não existem no prompt simples
    if (isImagem) {
      const roteiroRaw = roteiro as unknown as Record<string, unknown>;
      roteiro.abertura_fala   = '';
      roteiro.corpo_fala      = '';
      roteiro.fechamento_fala = '';
      if (!roteiro.textos_tela) {
        roteiro.textos_tela = {
          abertura:  '',
          vantagens: vantagensJob,
          chamada:   (roteiroRaw.chamada as string[] | undefined) ?? [],
        };
      }
    }

    // Em nova_abertura: preservar corpo e fechamento do roteiro anterior
    if (!isImagem && novaAbertura && job.roteiro_narracao) {
      try {
        const anterior = JSON.parse(job.roteiro_narracao) as Roteiro;
        roteiro.corpo_fala      = anterior.corpo_fala;
        roteiro.fechamento_fala = anterior.fechamento_fala;
        roteiro.legenda         = anterior.legenda;
        roteiro.hashtags        = anterior.hashtags;
      } catch { /* usa o que Claude gerou */ }
    }


    // ── Narração via ElevenLabs (apenas para vídeo) ────────────────────────
    let tempos:    ReturnType<typeof computeTempos> = [];
    let audioUrl:  string | null = null;
    let custoElevenLabs = 0;
    let caracteres      = 0;

    if (!isImagem) {
      const narracao = `${roteiro.abertura_fala} ${roteiro.corpo_fala} ${roteiro.fechamento_fala}`;

      const elRes = await fetch(
        `https://api.elevenlabs.io/v1/text-to-speech/${voz_id}/with-timestamps`,
        {
          method:  "POST",
          headers: {
            "xi-api-key":    process.env.ELEVENLABS_API_KEY!,
            "Content-Type":  "application/json",
          },
          body: JSON.stringify({
            text:     narracao,
            model_id: "eleven_multilingual_v2",
            voice_settings: { stability: 0.5, similarity_boost: 0.75 },
          }),
        },
      );

      if (!elRes.ok) {
        const errText = await elRes.text();
        throw new Error(`ElevenLabs ${elRes.status}: ${errText}`);
      }

      const elData: { audio_base64: string; alignment: ElevenAlignment } = await elRes.json();
      tempos     = computeTempos(roteiro, elData.alignment);
      caracteres = narracao.length;
      custoElevenLabs = caracteres * 0.0003;

      const audioBuffer = Buffer.from(elData.audio_base64, "base64");
      try {
        const blob = await put(`reels/audio/${jobId}-${Date.now()}.mp3`, audioBuffer, {
          access: "public", contentType: "audio/mpeg",
        });
        audioUrl = blob.url;
      } catch {
        audioUrl = `data:audio/mpeg;base64,${elData.audio_base64}`;
      }
    }

    // ── Custo estimado ─────────────────────────────────────────────────────
    const custoTotal    = custoClaude + custoElevenLabs;
    const custoEstimado = {
      claude:     Number(custoClaude.toFixed(5)),
      elevenlabs: Number(custoElevenLabs.toFixed(5)),
      total:      Number(custoTotal.toFixed(5)),
      detalhes:   { input_tokens: inputTokens, output_tokens: outputTokens, caracteres },
    };

    // ── Imagem: gerar com next/og direto, sem GH Actions ──────────────────
    if (isImagem) {
      const { generateImageBuffer } = await import('./generateImage');
      const imgBuffer = await generateImageBuffer({
        descricao:     job.descricao,
        fotoUrl:       job.foto_url ?? null,
        preco:         Number(job.preco),
        precoInternet: job.preco_internet ? Number(job.preco_internet) : null,
        vantagens:     (job.vantagens as string[] ?? []).filter(Boolean),
        cta:           ((job.cta_job ?? job.cta) as string[] ?? ['whatsapp']).slice(0, 2),
        chamada:       roteiro.textos_tela?.chamada ?? [],
        unidadeUnica:  !!job.unidade_unica,
      });

      const imgBlob = await put(`reels/imagens/${jobId}-${Date.now()}.png`, imgBuffer, {
        access: 'public', contentType: 'image/png',
      });

      await sql`
        UPDATE reels_trabalhos SET
          status           = 'pronto',
          roteiro_narracao = ${JSON.stringify(roteiro)},
          legenda          = ${roteiro.legenda},
          hashtags         = ${roteiro.hashtags},
          video_url        = ${imgBlob.url},
          capa_url         = ${imgBlob.url},
          custo_estimado   = ${JSON.stringify(custoEstimado)},
          atualizado_em    = NOW()
        WHERE id = ${jobId}
      `;

      return NextResponse.json({ ok: true, roteiro, image_url: imgBlob.url, custo: custoEstimado });
    }

    // ── Vídeo: atualizar job e disparar GH Actions ─────────────────────────
    const estilo_foto = job.remover_fundo ? "recorte" : "cartao";

    await sql`
      UPDATE reels_trabalhos SET
        status           = 'aguardando_video',
        abertura         = ${aberturaKey},
        estilo_foto      = ${estilo_foto},
        roteiro_narracao = ${JSON.stringify(roteiro)},
        legenda          = ${roteiro.legenda},
        hashtags         = ${roteiro.hashtags},
        audio_url        = ${audioUrl},
        tempos_narracao  = ${JSON.stringify(tempos)},
        custo_estimado   = ${JSON.stringify(custoEstimado)},
        atualizado_em    = NOW()
      WHERE id = ${jobId}
    `;

    // ── Disparar GitHub Actions workflow ──────────────────────────────────
    const githubPat  = process.env.GITHUB_PAT;
    const githubRepo = process.env.GITHUB_REPO ?? 'smartplanilhas/outlet';
    if (githubPat) {
      const dispatchRes = await fetch(`https://api.github.com/repos/${githubRepo}/dispatches`, {
        method:  'POST',
        headers: {
          'Authorization': `Bearer ${githubPat}`,
          'Accept':        'application/vnd.github.v3+json',
          'Content-Type':  'application/json',
        },
        body: JSON.stringify({
          event_type:    'render-reels',
          client_payload: { job_id: jobId },
        }),
      });
      if (!dispatchRes.ok) {
        console.error('[gerar] GitHub dispatch falhou:', dispatchRes.status, await dispatchRes.text());
      } else {
        console.log(`[gerar] GitHub Actions disparado para job #${jobId}`);
      }
    }

    return NextResponse.json({ ok: true, roteiro, audio_url: audioUrl, tempos, custo: custoEstimado });

  } catch (e) {
    console.error("[reels gerar]", e);
    if (jobId) {
      await sql`
        UPDATE reels_trabalhos SET
          status        = 'erro',
          erro          = ${e instanceof Error ? e.message : String(e)},
          atualizado_em = NOW()
        WHERE id = ${jobId}
      `.catch(() => {});
    }
    return NextResponse.json({ error: e instanceof Error ? e.message : String(e) }, { status: 500 });
  }
}
