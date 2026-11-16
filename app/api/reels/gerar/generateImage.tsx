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
  const { descricao, fotoUrl, preco, precoInternet, vantagens, cta, chamada, unidadeUnica } = params;
  const brl     = (v: number) => `R$ ${v.toFixed(2).replace('.', ',')}`;
  const desconto = precoInternet ? Math.round(((precoInternet - preco) / precoInternet) * 100) : 0;

  const [bold, black] = await Promise.all([loadFont(700), loadFont(900)]);

  const img = new ImageResponse(
    (
      <div style={{ display: 'flex', flexDirection: 'column', width: '100%', height: '100%', background: C.amarelo, fontFamily: 'Poppins' }}>

        {/* Faixa topo */}
        <div style={{ display: 'flex', background: C.preto, height: 130, alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
          <span style={{ color: C.amarelo, fontSize: 54, fontWeight: 900, letterSpacing: 5 }}>ACHADO DO DIA</span>
        </div>

        {/* Foto */}
        <div style={{ display: 'flex', justifyContent: 'center', padding: '20px 0', flexShrink: 0 }}>
          <div style={{ display: 'flex', background: C.branco, borderRadius: 24, width: 460, height: 460, alignItems: 'center', justifyContent: 'center', padding: 20, boxShadow: '0 16px 48px rgba(0,0,0,0.15)' }}>
            {fotoUrl
              ? <img src={fotoUrl} style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' }} />
              : <span style={{ fontSize: 120 }}>📦</span>
            }
          </div>
        </div>

        {/* Nome */}
        <div style={{ display: 'flex', padding: '0 40px 10px', flexShrink: 0 }}>
          <div style={{ display: 'flex', background: 'rgba(20,20,20,0.88)', borderRadius: 16, padding: '14px 24px' }}>
            <span style={{ color: C.branco, fontSize: 34, fontWeight: 700, lineHeight: 1.3 }}>{descricao}</span>
          </div>
        </div>

        {/* Vantagens */}
        {vantagens.length > 0 && (
          <div style={{ display: 'flex', padding: '0 40px 10px', gap: 10, flexShrink: 0 }}>
            {vantagens.slice(0, 2).map((v, i) => (
              <div key={i} style={{ display: 'flex', background: i % 2 === 0 ? C.preto : C.vermelho, borderRadius: 50, padding: '10px 24px' }}>
                <span style={{ color: C.branco, fontSize: 28, fontWeight: 700 }}>✓ {v}</span>
              </div>
            ))}
          </div>
        )}

        {/* Preço */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', flex: 1, gap: 12 }}>
          {precoInternet && (
            <span style={{ fontSize: 36, fontWeight: 700, color: C.preto, opacity: 0.5 }}>
              Na internet: {brl(precoInternet)}
            </span>
          )}
          <div style={{ display: 'flex', flexDirection: 'column', background: C.vermelho, borderRadius: 20, padding: '20px 56px', alignItems: 'center', boxShadow: `6px 6px 0 ${C.preto}` }}>
            {precoInternet && desconto > 0 && (
              <span style={{ fontSize: 28, color: 'rgba(255,255,255,0.85)', fontWeight: 700 }}>{desconto}% mais barato</span>
            )}
            <span style={{ fontSize: 36, color: C.branco, letterSpacing: 4, textTransform: 'uppercase', fontWeight: 400 }}>AQUI NA LOJA</span>
            <span style={{ fontSize: 88, color: C.branco, fontWeight: 900, lineHeight: 1 }}>{brl(preco)}</span>
          </div>
        </div>

        {/* CTA */}
        <div style={{ display: 'flex', flexDirection: 'column', background: 'rgba(20,20,20,0.95)', padding: '16px 40px 28px', gap: 10, flexShrink: 0 }}>
          {unidadeUnica && (
            <div style={{ display: 'flex', background: C.vermelho, borderRadius: 10, padding: '8px 24px', alignSelf: 'center', marginBottom: 4 }}>
              <span style={{ color: C.branco, fontSize: 32, fontWeight: 900 }}>⚡ SÓ 1 UNIDADE!</span>
            </div>
          )}
          {cta.slice(0, 2).map((c, i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
              <span style={{ fontSize: 36 }}>{CTA_ICON[c] ?? '👉'}</span>
              <span style={{ fontSize: 34, color: C.branco, fontWeight: 700 }}>
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
