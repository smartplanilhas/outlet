import React from 'react';
import { AbsoluteFill, Img, staticFile } from 'remotion';

// ── Cores ─────────────────────────────────────────────────────────────────────
const C = {
  amarelo:  '#FFC928',
  preto:    '#141414',
  vermelho: '#DC1E1E',
  branco:   '#FFFFFF',
  cinza:    '#78706F',
  divider:  '#E6E6E6',
} as const;

// ── Props ─────────────────────────────────────────────────────────────────────
export interface PostEstaticoProps {
  descricao:      string;
  fotoStaticFile: string | null;
  fotoUrl:        string | null;
  preco:          number;
  precoInternet:  number | null;
  cidade:         string;
}

// ── Formatação de preço ───────────────────────────────────────────────────────
function brl(v: number): string {
  if (Number.isInteger(v)) {
    return 'R$ ' + v.toLocaleString('pt-BR');
  }
  return 'R$ ' + v.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

// ── Composição ────────────────────────────────────────────────────────────────
// 1080 × 1350 px (4:5 feed)
// Foto:    y  0 → 1000  (1000 px, sem nenhum texto por cima)
// Faixa:   y  1000 → 1350  (350 px, fundo branco)

export const PostEstatico: React.FC<PostEstaticoProps> = ({
  descricao, fotoStaticFile, fotoUrl, preco, precoInternet, cidade,
}) => {
  const src = fotoStaticFile ? staticFile(fotoStaticFile) : (fotoUrl ?? null);

  // Reduz fonte do nome se longo
  const nomeFontSize = descricao.length > 38 ? 34 : 42;

  return (
    <AbsoluteFill style={{ background: C.branco }}>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Poppins:wght@400;500;700;900&display=swap');`}</style>

      {/* ── Foto do produto — LIMPA, sem texto ─────────────────────────────── */}
      <div style={{
        position: 'absolute',
        top: 0, left: 0,
        width: 1080, height: 1000,
        overflow: 'hidden',
        background: '#f5f5f5',
      }}>
        {src ? (
          <Img
            src={src}
            style={{ width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'center' }}
          />
        ) : (
          <div style={{
            width: '100%', height: '100%',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontFamily: 'sans-serif', fontSize: 180,
          }}>
            📦
          </div>
        )}
      </div>

      {/* ── Faixa de informações (y 1000→1350, fundo branco) ────────────────── */}
      <div style={{
        position: 'absolute',
        top: 1000, left: 0,
        width: 1080, height: 350,
        background: C.branco,
        fontFamily: "'Poppins', sans-serif",
      }}>

        {/* Pílula "ACHADO DO DIA" — y=30 */}
        <div style={{
          position: 'absolute',
          top: 30, left: 60,
          background: C.preto,
          borderRadius: 100,
          height: 52,
          paddingLeft: 20, paddingRight: 20,
          display: 'flex', alignItems: 'center',
        }}>
          <span style={{ color: C.amarelo, fontSize: 30, fontWeight: 700, letterSpacing: 1 }}>
            ACHADO DO DIA
          </span>
        </div>

        {/* Coluna direita: "Aqui na loja" + preço — alinhado à direita */}
        <div style={{
          position: 'absolute',
          top: 28, right: 60,
          display: 'flex', flexDirection: 'column', alignItems: 'flex-end',
        }}>
          <span style={{
            fontSize: 34, fontWeight: 700, color: C.preto, lineHeight: 1.1,
            fontFamily: "'Poppins', sans-serif",
          }}>
            Aqui na loja
          </span>
          <span style={{
            fontSize: 120, fontWeight: 700, color: C.vermelho, lineHeight: 1,
            fontFamily: "'Poppins', sans-serif",
          }}>
            {brl(preco)}
          </span>
        </div>

        {/* Nome do produto — y=108, não invade coluna do preço */}
        <div style={{
          position: 'absolute',
          top: 108, left: 60, right: 480,
          overflow: 'hidden',
        }}>
          <span style={{
            fontSize: nomeFontSize, fontWeight: 700, color: C.preto,
            display: 'block', whiteSpace: 'nowrap',
            overflow: 'hidden', textOverflow: 'ellipsis',
            fontFamily: "'Poppins', sans-serif",
          }}>
            {descricao}
          </span>
        </div>

        {/* "Na internet R$ X" com risco vermelho — y=170 */}
        {precoInternet && (
          <div style={{
            position: 'absolute',
            top: 170, left: 60,
          }}>
            <div style={{ position: 'relative', display: 'inline-block' }}>
              <span style={{
                fontSize: 40, fontWeight: 500, color: C.cinza,
                fontFamily: "'Poppins', sans-serif",
                display: 'block',
              }}>
                Na internet {brl(precoInternet)}
              </span>
              {/* Risco vermelho */}
              <div style={{
                position: 'absolute',
                top: '50%', left: 0, right: 0,
                height: 5, background: C.vermelho,
                transform: 'translateY(-50%)',
              }} />
            </div>
          </div>
        )}

        {/* Linha divisória — y=275 */}
        <div style={{
          position: 'absolute',
          top: 275, left: 60,
          width: 960, height: 2,
          background: C.divider,
        }} />

        {/* Rodapé — y=293 */}
        <div style={{
          position: 'absolute',
          top: 293, left: 60, right: 60,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <span style={{
            fontSize: 32, fontWeight: 500, color: C.preto,
            fontFamily: "'Poppins', sans-serif",
          }}>
            Só na loja física · {cidade}
          </span>
        </div>

      </div>
    </AbsoluteFill>
  );
};
