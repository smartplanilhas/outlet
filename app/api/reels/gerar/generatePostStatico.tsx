import { ImageResponse } from 'next/og';
import React from 'react';

const C = {
  preto:       '#141414',
  vermelho:    '#DC1E1E',
  branco:      '#FFFFFF',
  amarelo:     '#FFC928',
  cinza_texto: '#78706F',
  cinza_linha: '#E6E6E6',
} as const;

const CTA_RIGHT: Record<string, string> = {
  comenta_eu_quero: 'Comenta EU QUERO',
  whatsapp:         'Via WhatsApp',
  catalogo_bio:     'Link na bio',
  venha_loja:       'Aqui na loja',
};

const CTA_FOOTER_PREFIX: Record<string, string> = {
  comenta_eu_quero: 'Comenta EU QUERO',
  whatsapp:         'Chama no WhatsApp',
  catalogo_bio:     'Link na bio',
  venha_loja:       'Só na loja física',
};

async function loadFont(weight: 500 | 700): Promise<ArrayBuffer> {
  const css = await fetch(
    `https://fonts.googleapis.com/css2?family=Poppins:wght@${weight}`,
    { headers: { 'User-Agent': 'Mozilla/5.0 (Macintosh; U; Intel Mac OS X 10_6_8; de-at) AppleWebKit/533.21.1' } }
  ).then(r => r.text());
  const url = css.match(/src:\s*url\((.+?)\)/)?.[1];
  if (!url) throw new Error(`URL da fonte Poppins ${weight} não encontrada`);
  return fetch(url).then(r => r.arrayBuffer());
}

function brl(v: number): string {
  const intPart = Math.floor(v);
  const decPart = Math.round((v - intPart) * 100);
  const intStr  = intPart.toString().replace(/\B(?=(\d{3})+(?!\d))/g, '.');
  if (decPart === 0) return `R$ ${intStr}`;
  return `R$ ${intStr},${decPart.toString().padStart(2, '0')}`;
}

function precoBoldFontSize(str: string): number {
  if (str.length <= 6) return 120;  // R$ 999
  if (str.length <= 8) return 96;   // R$ 1.299
  return 78;
}

export async function generatePostEstatico(params: {
  descricao:     string;
  fotoUrl:       string | null;
  preco:         number;
  precoInternet: number | null;
  cta:           string[];
  cidade:        string;
}): Promise<Buffer> {
  const { descricao, fotoUrl, preco, precoInternet, cta, cidade } = params;

  const ctaKey    = cta[0] ?? 'venha_loja';
  const ctaLabel  = CTA_RIGHT[ctaKey] ?? ctaKey;
  const footerPfx = CTA_FOOTER_PREFIX[ctaKey] ?? 'Só na loja física';
  const precoStr  = brl(preco);
  const precoSize = precoBoldFontSize(precoStr);

  const [medium, bold] = await Promise.all([loadFont(500), loadFont(700)]);

  const img = new ImageResponse(
    (
      <div style={{ display: 'flex', flexDirection: 'column', width: '100%', height: '100%', background: C.branco, fontFamily: 'Poppins' }}>

        {/* ── Foto do produto — sem sobreposição alguma ─────────────────── */}
        <div style={{ display: 'flex', width: 1080, height: 1000, overflow: 'hidden', flexShrink: 0 }}>
          {fotoUrl
            ? <img src={fotoUrl} style={{ width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'center' }} />
            : <div style={{ display: 'flex', width: '100%', height: '100%', background: '#F0F0F0', alignItems: 'center', justifyContent: 'center' }}>
                <span style={{ fontSize: 160 }}>📦</span>
              </div>
          }
        </div>

        {/* ── Faixa branca de informações (350 px) ─────────────────────── */}
        <div style={{ display: 'flex', flexDirection: 'column', flex: 1, background: C.branco }}>

          {/* Linha de conteúdo: coluna esquerda + direita */}
          <div style={{ display: 'flex', flex: 1, alignItems: 'flex-start', padding: '28px 60px 0', gap: 20 }}>

            {/* ── Coluna esquerda ─────────────────────────────────────── */}
            <div style={{ display: 'flex', flexDirection: 'column', flex: 1, gap: 10, minWidth: 0 }}>

              {/* Pílula ACHADO DO DIA */}
              <div style={{ display: 'flex', background: C.preto, borderRadius: 100, paddingLeft: 20, paddingRight: 20, height: 52, alignItems: 'center', alignSelf: 'flex-start' }}>
                <span style={{ color: C.amarelo, fontSize: 30, fontWeight: 700 }}>ACHADO DO DIA</span>
              </div>

              {/* Nome do produto — 1 linha, corta com reticências */}
              <span style={{ fontSize: 40, fontWeight: 700, color: C.preto, lineHeight: 1.2, overflow: 'hidden', whiteSpace: 'nowrap', textOverflow: 'ellipsis' }}>
                {descricao}
              </span>

              {/* Preço na internet com risco vermelho (omitido se não houver) */}
              {precoInternet && (
                <div style={{ display: 'flex', alignItems: 'center', position: 'relative' }}>
                  <span style={{ fontSize: 36, fontWeight: 500, color: C.cinza_texto }}>
                    Na internet {brl(precoInternet)}
                  </span>
                  <div style={{ position: 'absolute', left: 0, right: 0, top: '54%', height: 5, background: C.vermelho }} />
                </div>
              )}
            </div>

            {/* ── Coluna direita ──────────────────────────────────────── */}
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', flexShrink: 0, width: 350 }}>
              <span style={{ fontSize: 36, fontWeight: 500, color: C.preto, textAlign: 'right', lineHeight: 1.25 }}>
                {ctaLabel}
              </span>
              <span style={{ fontSize: precoSize, fontWeight: 700, color: C.vermelho, lineHeight: 1, marginTop: 4 }}>
                {precoStr}
              </span>
            </div>
          </div>

          {/* ── Rodapé ──────────────────────────────────────────────────── */}
          <div style={{ display: 'flex', flexDirection: 'column', padding: '0 60px 22px' }}>
            <div style={{ height: 2, background: C.cinza_linha, marginBottom: 14 }} />
            <span style={{ fontSize: 32, fontWeight: 500, color: C.preto, textAlign: 'center' }}>
              {footerPfx} · {cidade}
            </span>
          </div>

        </div>
      </div>
    ),
    {
      width: 1080,
      height: 1350,
      fonts: [
        { name: 'Poppins', data: medium, weight: 500, style: 'normal' },
        { name: 'Poppins', data: bold,   weight: 700, style: 'normal' },
      ],
    }
  );

  return Buffer.from(await img.arrayBuffer());
}
