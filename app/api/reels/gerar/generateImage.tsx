import { ImageResponse } from 'next/og';
import React from 'react';

const C = { amarelo: '#FFC928', preto: '#141414', vermelho: '#DC1E1E', branco: '#FFFFFF' } as const;

const CTA_ICON:  Record<string, string> = { comenta_eu_quero: '💬', whatsapp: '📱', catalogo_bio: '🔗', venha_loja: '📍' };
const CTA_LABEL: Record<string, string> = { comenta_eu_quero: 'Comenta EU QUERO', whatsapp: 'Chama no WhatsApp', catalogo_bio: 'Link na bio', venha_loja: 'Venha à loja' };

async function loadFont(weight: 700 | 900): Promise<ArrayBuffer> {
  const css = await fetch(
    `https://fonts.googleapis.com/css2?family=Poppins:wght@${weight}`,
    { headers: { 'User-Agent': 'Mozilla/5.0 (Macintosh; U; Intel Mac OS X 10_6_8; de-at) AppleWebKit/533.21.1' } }
  ).then(r => r.text());
  const url = css.match(/src:\s*url\((.+?)\)/)?.[1];
  if (!url) throw new Error(`URL da fonte Poppins ${weight} não encontrada`);
  return fetch(url).then(r => r.arrayBuffer());
}

export async function generateImageBuffer(params: {
  descricao:     string;
  fotoUrl:       string | null;
  preco:         number;
  precoInternet: number | null;
  vantagens:     string[];
  cta:           string[];
  chamada:       string[];
  unidadeUnica:  boolean;
}): Promise<Buffer> {
  const { descricao, fotoUrl, preco, precoInternet, cta, chamada, unidadeUnica } = params;
  const brl     = (v: number) => `R$ ${v.toFixed(2).replace('.', ',')}`;
  const desconto = precoInternet ? Math.round(((precoInternet - preco) / precoInternet) * 100) : 0;

  const [bold, black] = await Promise.all([loadFont(700), loadFont(900)]);

  // Layout 1080×1080:
  // Top bar    110px
  // Foto       700px  ← herói
  // Preço      110px
  // CTA        160px
  // Total     1080px

  const img = new ImageResponse(
    (
      <div style={{ display: 'flex', flexDirection: 'column', width: '100%', height: '100%', background: C.amarelo, fontFamily: 'Poppins' }}>

        {/* ── Faixa topo ─────────────────────────────────────────────── */}
        <div style={{ display: 'flex', background: C.preto, height: 110, alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
          <span style={{ color: C.amarelo, fontSize: 52, fontWeight: 900, letterSpacing: 6 }}>
            ACHADO DO DIA
          </span>
        </div>

        {/* ── Foto do produto — herói ─────────────────────────────────── */}
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: 700, flexShrink: 0, padding: '12px 40px 0' }}>
          <div style={{
            display: 'flex', flexDirection: 'column',
            background: C.branco,
            borderRadius: 32,
            width: '100%', height: '100%',
            boxShadow: '0 20px 60px rgba(0,0,0,0.18)',
            overflow: 'hidden',
            position: 'relative',
          }}>
            {/* Imagem */}
            <div style={{ display: 'flex', flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24 }}>
              {fotoUrl
                ? <img src={fotoUrl} style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' }} />
                : <span style={{ fontSize: 180 }}>📦</span>
              }
            </div>

            {/* Nome do produto — overlay na base da foto */}
            <div style={{ display: 'flex', background: 'rgba(20,20,20,0.88)', padding: '18px 28px' }}>
              <span style={{ color: C.branco, fontSize: 36, fontWeight: 700, lineHeight: 1.3 }}>
                {descricao}
              </span>
            </div>
          </div>
        </div>

        {/* ── Preço ──────────────────────────────────────────────────── */}
        <div style={{ display: 'flex', flex: 1, alignItems: 'center', justifyContent: 'center', gap: 32, padding: '0 40px' }}>
          {precoInternet && (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
              <span style={{ fontSize: 26, color: C.preto, opacity: 0.5, fontWeight: 700 }}>na internet</span>
              <span style={{ fontSize: 38, color: C.preto, opacity: 0.5, fontWeight: 700, textDecoration: 'line-through' }}>
                {brl(precoInternet)}
              </span>
            </div>
          )}

          {precoInternet && (
            <div style={{ display: 'flex', width: 3, height: 60, background: 'rgba(20,20,20,0.2)' }} />
          )}

          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', background: C.vermelho, borderRadius: 20, padding: '12px 36px', boxShadow: `5px 5px 0 ${C.preto}` }}>
            {precoInternet && desconto > 0 && (
              <span style={{ fontSize: 24, color: 'rgba(255,255,255,0.85)', fontWeight: 700 }}>
                {desconto}% menor
              </span>
            )}
            <span style={{ fontSize: 24, color: C.branco, letterSpacing: 3, textTransform: 'uppercase', fontWeight: 400 }}>aqui na loja</span>
            <span style={{ fontSize: 72, color: C.branco, fontWeight: 900, lineHeight: 1 }}>{brl(preco)}</span>
          </div>
        </div>

        {/* ── CTA ────────────────────────────────────────────────────── */}
        <div style={{ display: 'flex', flexDirection: 'column', background: 'rgba(20,20,20,0.95)', padding: '14px 40px 24px', gap: 10, flexShrink: 0 }}>
          {unidadeUnica && (
            <div style={{ display: 'flex', background: C.vermelho, borderRadius: 10, padding: '6px 20px', alignSelf: 'center', marginBottom: 2 }}>
              <span style={{ color: C.branco, fontSize: 30, fontWeight: 900 }}>⚡ SÓ 1 UNIDADE!</span>
            </div>
          )}
          {cta.slice(0, 2).map((c, i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
              <span style={{ fontSize: 34 }}>{CTA_ICON[c] ?? '👉'}</span>
              <span style={{ fontSize: 32, color: C.branco, fontWeight: 700 }}>
                {chamada[i] || CTA_LABEL[c] || c}
              </span>
            </div>
          ))}
        </div>

      </div>
    ),
    {
      width: 1080,
      height: 1080,
      fonts: [
        { name: 'Poppins', data: bold,  weight: 700, style: 'normal' },
        { name: 'Poppins', data: black, weight: 900, style: 'normal' },
      ],
    }
  );

  return Buffer.from(await img.arrayBuffer());
}
