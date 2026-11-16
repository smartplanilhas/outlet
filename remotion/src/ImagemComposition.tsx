import React from 'react';
import { AbsoluteFill, Img } from 'remotion';

const C = { amarelo: '#FFC928', preto: '#141414', vermelho: '#DC1E1E', branco: '#FFFFFF' } as const;
const FONT = "'Poppins', sans-serif";
const brl  = (v: number) => `R$ ${v.toFixed(2).replace('.', ',')}`;

export interface ImagemProps {
  descricao:        string;
  fotoStaticFile:   string | null;
  fotoUrl:          string | null;
  preco:            number;
  precoInternet:    number | null;
  vantagens:        string[];
  cta:              string[];
  unidadeUnica:     boolean;
  roteiro:          { textos_tela: { chamada: string[] } };
}

const CTA_ICON:  Record<string, string> = { comenta_eu_quero: '💬', whatsapp: '📱', catalogo_bio: '🔗', venha_loja: '📍' };
const CTA_LABEL: Record<string, string> = { comenta_eu_quero: 'Comenta EU QUERO', whatsapp: 'Chama no WhatsApp', catalogo_bio: 'Link na bio', venha_loja: 'Venha à loja' };

export const ImagemComposition: React.FC<ImagemProps> = (props) => {
  const { descricao, fotoStaticFile, fotoUrl, preco, precoInternet, vantagens, cta, unidadeUnica, roteiro } = props;
  const fotoSrc = fotoStaticFile ? `/public/${fotoStaticFile}` : (fotoUrl ?? null);
  const desconto = precoInternet ? Math.round(((precoInternet - preco) / precoInternet) * 100) : 0;

  return (
    <AbsoluteFill style={{ background: C.amarelo, fontFamily: FONT, overflow: 'hidden' }}>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Poppins:wght@400;700;900&display=swap');`}</style>

      {/* Raios */}
      <div style={{
        position: 'absolute', width: '280%', height: '280%', top: '-90%', left: '-90%',
        backgroundImage: `conic-gradient(${Array.from({ length: 18 }, (_, i) =>
          i % 2 === 0
            ? `rgba(255,255,255,0.08) ${(i/18)*360}deg ${((i+1)/18)*360}deg`
            : `transparent ${(i/18)*360}deg ${((i+1)/18)*360}deg`
        ).join(', ')})`,
        transformOrigin: '50% 50%',
      }} />

      {/* Faixa topo */}
      <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 130,
        background: C.preto, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <span style={{ fontWeight: 900, fontSize: 56, color: C.amarelo, letterSpacing: 6 }}>
          ACHADO DO DIA
        </span>
      </div>

      {/* Foto */}
      {fotoSrc && (
        <div style={{ position: 'absolute', top: 150, left: '50%', transform: 'translateX(-50%)',
          width: 620, height: 620, background: C.branco, borderRadius: 32,
          boxShadow: '0 20px 60px rgba(0,0,0,0.2)', display: 'flex',
          alignItems: 'center', justifyContent: 'center', padding: 24, overflow: 'hidden' }}>
          <Img src={fotoSrc} style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' }} />
        </div>
      )}

      {/* Nome */}
      <div style={{ position: 'absolute', top: 790, left: 48, right: 48 }}>
        <div style={{ background: 'rgba(20,20,20,0.88)', borderRadius: 20, padding: '16px 28px', display: 'inline-block', maxWidth: '100%' }}>
          <span style={{ fontWeight: 700, fontSize: 42, color: C.branco, lineHeight: 1.3 }}>{descricao}</span>
        </div>
      </div>

      {/* Vantagens */}
      {vantagens.length > 0 && (
        <div style={{ position: 'absolute', top: 900, left: 48, right: 48, display: 'flex', gap: 14, flexWrap: 'wrap' }}>
          {vantagens.slice(0, 3).map((v, i) => (
            <div key={i} style={{ background: i % 2 === 0 ? C.preto : C.vermelho,
              borderRadius: 50, padding: '12px 32px' }}>
              <span style={{ fontWeight: 700, fontSize: 36, color: C.branco }}>✓ {v}</span>
            </div>
          ))}
        </div>
      )}

      {/* Preço */}
      <div style={{ position: 'absolute', bottom: 200, left: 0, right: 0,
        display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16 }}>
        {precoInternet && (
          <div style={{ position: 'relative', display: 'inline-block' }}>
            <span style={{ fontWeight: 700, fontSize: 46, color: C.preto, opacity: 0.5 }}>
              Na internet: {brl(precoInternet)}
            </span>
            <div style={{ position: 'absolute', top: '50%', left: 0, right: 0,
              height: 6, background: C.vermelho, borderRadius: 3, transform: 'translateY(-50%)' }} />
          </div>
        )}
        <div style={{ background: C.vermelho, borderRadius: 20, padding: '24px 60px',
          textAlign: 'center', boxShadow: `8px 8px 0 ${C.preto}` }}>
          {precoInternet && desconto > 0 && (
            <span style={{ fontWeight: 700, fontSize: 36, color: 'rgba(255,255,255,0.8)',
              display: 'block', marginBottom: 4 }}>
              {desconto}% mais barato
            </span>
          )}
          <span style={{ fontWeight: 400, fontSize: 38, color: C.branco, display: 'block',
            letterSpacing: 4, textTransform: 'uppercase' }}>AQUI NA LOJA</span>
          <span style={{ fontWeight: 900, fontSize: 100, color: C.branco, display: 'block', lineHeight: 1 }}>
            {brl(preco)}
          </span>
        </div>
      </div>

      {/* CTA */}
      <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0,
        background: 'rgba(20,20,20,0.95)', padding: '20px 48px 36px',
        display: 'flex', flexDirection: 'column', gap: 14 }}>
        {unidadeUnica && (
          <div style={{ background: C.vermelho, borderRadius: 10, padding: '10px 28px',
            alignSelf: 'center' }}>
            <span style={{ fontWeight: 900, fontSize: 38, color: C.branco }}>⚡ SÓ 1 UNIDADE!</span>
          </div>
        )}
        {cta.slice(0, 2).map((c, i) => (
          <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
            <span style={{ fontSize: 48 }}>{CTA_ICON[c] ?? '👉'}</span>
            <span style={{ fontWeight: 700, fontSize: 44, color: C.branco }}>
              {roteiro.textos_tela.chamada[i] || CTA_LABEL[c] || c}
            </span>
          </div>
        ))}
      </div>
    </AbsoluteFill>
  );
};
