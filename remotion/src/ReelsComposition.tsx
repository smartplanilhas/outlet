import React from 'react';
import {
  AbsoluteFill, Audio, Img, Sequence,
  useCurrentFrame, useVideoConfig,
  interpolate, spring, staticFile,
} from 'remotion';

// ── Cores da marca ────────────────────────────────────────────────────────────
const C = { amarelo: '#FFC928', preto: '#141414', vermelho: '#DC1E1E', branco: '#FFFFFF' } as const;
const FONT = "'Poppins', sans-serif";

// ── Tipos ─────────────────────────────────────────────────────────────────────
interface Tempo { parte: string; texto: string; inicio: number; fim: number; }

export interface ReelsProps {
  descricao:        string;
  fotoStaticFile:   string | null;
  fotoUrl:          string | null;
  preco:            number;
  precoInternet:    number | null;
  vantagens:        string[];
  cta:              string[];
  unidadeUnica:     boolean;
  abertura:         string;
  roteiro:          { textos_tela: { abertura: string; vantagens: string[]; chamada: string[] } };
  tempos:           Tempo[];
  audioStaticFile:  string | null;
  audioUrl:         string | null;
  durationInFrames: number;
}

// ── Helpers ───────────────────────────────────────────────────────────────────
const brl = (v: number) => `R$ ${v.toFixed(2).replace('.', ',')}`;

function getTiming(tempos: Tempo[], parte: string, fps: number, fb: [number, number]) {
  const t = tempos.find(t => t.parte === parte);
  return t
    ? { f0: Math.round(t.inicio * fps), f1: Math.round(t.fim * fps) }
    : { f0: Math.round(fb[0] * fps),    f1: Math.round(fb[1] * fps) };
}

// ── Fundo com raios giratórios ────────────────────────────────────────────────
const Fundo: React.FC = () => {
  const frame = useCurrentFrame();
  const { durationInFrames } = useVideoConfig();
  const rot = interpolate(frame, [0, durationInFrames], [0, 40]);
  return (
    <AbsoluteFill style={{ background: C.amarelo, overflow: 'hidden' }}>
      <div style={{
        position: 'absolute',
        width: '280%', height: '280%',
        top: '-90%', left: '-90%',
        backgroundImage: `conic-gradient(${
          Array.from({ length: 18 }, (_, i) =>
            i % 2 === 0
              ? `rgba(255,255,255,0.08) ${(i/18)*360}deg ${((i+1)/18)*360}deg`
              : `transparent ${(i/18)*360}deg ${((i+1)/18)*360}deg`
          ).join(', ')
        })`,
        transform: `rotate(${rot}deg)`,
        transformOrigin: '50% 50%',
      }} />
    </AbsoluteFill>
  );
};

// ── Faixa topo ────────────────────────────────────────────────────────────────
const FaixaTopo: React.FC = () => (
  <div style={{
    position: 'absolute', top: 0, left: 0, right: 0, height: 160,
    background: C.preto, zIndex: 100,
    display: 'flex', alignItems: 'center', justifyContent: 'center',
  }}>
    <span style={{ fontFamily: FONT, fontWeight: 900, fontSize: 68, color: C.amarelo, letterSpacing: 6 }}>
      ACHADO DO DIA
    </span>
  </div>
);

// ── Abertura ──────────────────────────────────────────────────────────────────
const AberturaCena: React.FC<{ tipo: string; texto: string; preco: number }> = ({ tipo, texto, preco }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const sp = spring({ frame, fps, config: { stiffness: 120, damping: 18 } });

  const base: React.CSSProperties = {
    position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
    display: 'flex', flexDirection: 'column',
    alignItems: 'center', justifyContent: 'center',
    padding: '0 80px', paddingTop: 160,
  };

  if (tipo === 'preco_primeiro') {
    const ty = interpolate(sp, [0, 1], [-500, 0]);
    return (
      <AbsoluteFill style={base}>
        <div style={{ transform: `translateY(${ty}px)`, textAlign: 'center' }}>
          <div style={{ fontFamily: FONT, fontWeight: 900, fontSize: 240, color: C.vermelho,
            textShadow: `8px 8px 0 ${C.preto}`, lineHeight: 1 }}>
            {brl(preco)}
          </div>
          <div style={{ fontFamily: FONT, fontWeight: 700, fontSize: 72, color: C.preto,
            opacity: interpolate(frame, [15, 30], [0, 1], { extrapolateRight: 'clamp' }) }}>
            AQUI NA LOJA!
          </div>
        </div>
      </AbsoluteFill>
    );
  }

  if (tipo === 'contagem') {
    const perNum = Math.round(fps * 0.65);
    const idx = Math.min(2, Math.floor(frame / perNum));
    const nf  = frame % perNum;
    const nsp = spring({ frame: nf, fps, config: { stiffness: 350, damping: 12 } });
    return (
      <AbsoluteFill style={base}>
        <div style={{
          fontFamily: FONT, fontWeight: 900, fontSize: 500, color: C.preto, lineHeight: 1,
          transform: `scale(${interpolate(nsp, [0, 1], [2, 1])})`,
          opacity: interpolate(nsp, [0, 0.2, 0.7, 1], [0, 1, 1, 0.3]),
        }}>
          {3 - idx}
        </div>
      </AbsoluteFill>
    );
  }

  if (tipo === 'urgencia') {
    const flash = Math.floor(frame / 7) % 2 === 0;
    return (
      <AbsoluteFill style={base}>
        <div style={{
          background: flash ? C.vermelho : C.preto,
          padding: '40px 80px', borderRadius: 24,
          transform: `scale(${interpolate(sp, [0, 1], [0.4, 1])})`,
          textAlign: 'center',
        }}>
          <div style={{ fontFamily: FONT, fontWeight: 900, fontSize: 96,
            color: flash ? C.branco : C.vermelho }}>
            ⚡ SÓ 1 UNIDADE!
          </div>
        </div>
        <div style={{ fontFamily: FONT, fontWeight: 700, fontSize: 68, color: C.preto,
          marginTop: 48, opacity: interpolate(frame, [12, 24], [0, 1], { extrapolateRight: 'clamp' }),
          textAlign: 'center' }}>
          {texto || 'Última chance!'}
        </div>
      </AbsoluteFill>
    );
  }

  if (tipo === 'pergunta') {
    const pulse = Math.sin(frame * 0.25) * 0.08 + 1;
    return (
      <AbsoluteFill style={base}>
        <div style={{ fontFamily: FONT, fontWeight: 900, fontSize: 76, color: C.preto,
          textAlign: 'center', lineHeight: 1.3,
          opacity: interpolate(sp, [0, 1], [0, 1]) }}>
          {texto || 'Precisa disso\nem casa?'}
        </div>
        <div style={{ fontFamily: FONT, fontWeight: 900, fontSize: 300, color: C.vermelho,
          transform: `scale(${pulse})`, lineHeight: 1, marginTop: 16 }}>?</div>
      </AbsoluteFill>
    );
  }

  if (tipo === 'detalhe') {
    // Zoom out handled by photo — here shows hook text
    const ty = interpolate(sp, [0, 1], [80, 0]);
    return (
      <AbsoluteFill style={base}>
        <div style={{ fontFamily: FONT, fontWeight: 700, fontSize: 76, color: C.preto,
          textAlign: 'center', lineHeight: 1.3,
          opacity: interpolate(sp, [0, 1], [0, 1]),
          transform: `translateY(${ty}px)` }}>
          {texto || 'Um achado especial...'}
        </div>
      </AbsoluteFill>
    );
  }

  // caixa_misteriosa / raspadinha / problema_solucao
  const ty = interpolate(sp, [0, 1], [80, 0]);
  const scale = tipo === 'caixa_misteriosa'
    ? interpolate(sp, [0, 1], [0.2, 1])
    : 1;
  const rot = tipo === 'caixa_misteriosa'
    ? interpolate(sp, [0, 1], [-12, 0])
    : 0;
  const filter = tipo === 'problema_solucao'
    ? `saturate(${interpolate(frame, [0, 20], [0, 100], { extrapolateRight: 'clamp' })}%)`
    : undefined;

  return (
    <AbsoluteFill style={{ ...base, filter }}>
      {tipo === 'caixa_misteriosa' && (
        <div style={{ fontSize: 220, transform: `scale(${scale}) rotate(${rot}deg)`, marginBottom: 20 }}>
          📦
        </div>
      )}
      <div style={{
        fontFamily: FONT, fontWeight: 900, fontSize: 76, color: C.preto,
        textAlign: 'center', lineHeight: 1.3, maxWidth: '90%',
        transform: `translateY(${ty}px)`,
        opacity: interpolate(sp, [0, 1], [0, 1]),
      }}>
        {texto || 'Olha que achado!'}
      </div>
    </AbsoluteFill>
  );
};

// ── Foto do produto ───────────────────────────────────────────────────────────
const FotoProduto: React.FC<{ src: string | null; tipo: string }> = ({ src, tipo }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const sp    = spring({ frame, fps, config: { stiffness: 100, damping: 20 } });
  const scale = tipo === 'detalhe'
    ? interpolate(frame, [0, 20], [2, 1], { extrapolateRight: 'clamp' })
    : interpolate(sp, [0, 1], [0.5, 1]);

  if (!src) return null;
  return (
    <div style={{
      position: 'absolute', top: 185, left: '50%',
      transform: `translateX(-50%) scale(${scale})`,
      opacity: interpolate(sp, [0, 1], [0, 1]),
      width: 680, height: 680,
    }}>
      <div style={{
        width: '100%', height: '100%',
        background: C.branco, borderRadius: 32,
        boxShadow: '0 24px 64px rgba(0,0,0,0.22)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: 24, overflow: 'hidden',
      }}>
        <Img src={src} style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' }} />
      </div>
    </div>
  );
};

// ── Nome do produto ───────────────────────────────────────────────────────────
const NomeProduto: React.FC<{ nome: string }> = ({ nome }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const op = interpolate(frame, [0, Math.round(fps * 0.4)], [0, 1], { extrapolateRight: 'clamp' });
  return (
    <div style={{
      position: 'absolute', top: 882, left: 60, right: 60, opacity: op,
    }}>
      <div style={{
        background: 'rgba(20,20,20,0.88)', borderRadius: 20,
        padding: '20px 36px', display: 'inline-block', maxWidth: '100%',
      }}>
        <span style={{ fontFamily: FONT, fontWeight: 700, fontSize: 46,
          color: C.branco, lineHeight: 1.3 }}>
          {nome}
        </span>
      </div>
    </div>
  );
};

// ── Vantagens ─────────────────────────────────────────────────────────────────
const VantagensBadges: React.FC<{ vantagens: string[] }> = ({ vantagens }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  return (
    <div style={{
      position: 'absolute', bottom: 520, left: 60, right: 60,
      display: 'flex', flexDirection: 'column', gap: 20, alignItems: 'flex-start',
    }}>
      {vantagens.slice(0, 3).map((v, i) => {
        const delay = i * 10;
        const sp    = spring({ frame: Math.max(0, frame - delay), fps, config: { stiffness: 160, damping: 18 } });
        const tx    = interpolate(sp, [0, 1], [i % 2 === 0 ? -380 : 380, 0]);
        return (
          <div key={i} style={{
            transform: `translateX(${tx}px)`,
            opacity: interpolate(sp, [0, 1], [0, 1]),
            background: i % 2 === 0 ? C.preto : C.vermelho,
            borderRadius: 50, padding: '18px 44px',
            display: 'inline-flex', alignItems: 'center', gap: 14,
          }}>
            <span style={{ fontFamily: FONT, fontWeight: 700, fontSize: 46, color: C.branco }}>
              ✓ {v}
            </span>
          </div>
        );
      })}
    </div>
  );
};

// ── Preço ─────────────────────────────────────────────────────────────────────
const PrecoCena: React.FC<{ preco: number; precoInternet: number | null }> = ({ preco, precoInternet }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const sp    = spring({ frame, fps, config: { stiffness: 200, damping: 12 } });
  const ty    = interpolate(sp, [0, 1], [-320, 0]);
  const shakeFim = Math.round(fps * 0.5);
  const shake = frame > shakeFim
    ? Math.sin((frame - shakeFim) * 1.4) * Math.max(0, 1 - (frame - shakeFim) / 24) * 18
    : 0;
  const risco = precoInternet
    ? interpolate(frame, [4, 22], [0, 100], { extrapolateRight: 'clamp' })
    : 0;

  return (
    <div style={{
      position: 'absolute', bottom: 300, left: 0, right: 0,
      display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 24,
    }}>
      {precoInternet && (
        <div style={{ position: 'relative', display: 'inline-block' }}>
          <span style={{ fontFamily: FONT, fontWeight: 700, fontSize: 54,
            color: C.preto, opacity: 0.55 }}>
            Na internet: {brl(precoInternet)}
          </span>
          <div style={{
            position: 'absolute', top: '50%', left: 0,
            height: 7, width: `${risco}%`,
            background: C.vermelho, borderRadius: 4,
            transform: 'translateY(-50%)',
          }} />
        </div>
      )}
      <div style={{
        transform: `translateY(${ty}px) rotate(${shake * 0.4}deg)`,
        marginLeft: shake,
        background: C.vermelho, borderRadius: 24,
        padding: '28px 72px', textAlign: 'center',
        boxShadow: `10px 10px 0 ${C.preto}`,
      }}>
        <span style={{ fontFamily: FONT, fontWeight: 400, fontSize: 46,
          color: C.branco, display: 'block', letterSpacing: 5, textTransform: 'uppercase' }}>
          AQUI NA LOJA
        </span>
        <span style={{ fontFamily: FONT, fontWeight: 900, fontSize: 120,
          color: C.branco, display: 'block', lineHeight: 1 }}>
          {brl(preco)}
        </span>
      </div>
    </div>
  );
};

// ── Cartão CTA ────────────────────────────────────────────────────────────────
const CTA_ICON: Record<string, string> = {
  comenta_eu_quero: '💬', whatsapp: '📱', catalogo_bio: '🔗', venha_loja: '📍',
};
const CTA_LABEL: Record<string, string> = {
  comenta_eu_quero: 'Comenta EU QUERO',
  whatsapp:         'Chama no WhatsApp',
  catalogo_bio:     'Link na bio',
  venha_loja:       'Venha à loja',
};

const CartaoCta: React.FC<{
  cta: string[]; unidadeUnica: boolean; chamada: string[];
}> = ({ cta, unidadeUnica, chamada }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const sp    = spring({ frame, fps, config: { stiffness: 100, damping: 22 } });
  const ty    = interpolate(sp, [0, 1], [340, 0]);

  return (
    <div style={{
      position: 'absolute', bottom: 0, left: 0, right: 0,
      transform: `translateY(${ty}px)`,
    }}>
      <div style={{
        background: 'rgba(20,20,20,0.96)',
        padding: '36px 60px 72px',
        display: 'flex', flexDirection: 'column', gap: 20,
      }}>
        {unidadeUnica && (
          <div style={{
            background: C.vermelho, borderRadius: 14,
            padding: '14px 36px', alignSelf: 'center',
          }}>
            <span style={{ fontFamily: FONT, fontWeight: 900, fontSize: 46, color: C.branco }}>
              ⚡ SÓ 1 UNIDADE!
            </span>
          </div>
        )}
        {cta.slice(0, 2).map((c, i) => {
          const delay = i * 10;
          const op = interpolate(frame, [delay, delay + 15], [0, 1], { extrapolateRight: 'clamp' });
          const tx = interpolate(frame, [delay, delay + 15], [60, 0], { extrapolateRight: 'clamp' });
          return (
            <div key={i} style={{
              display: 'flex', alignItems: 'center', gap: 24,
              opacity: op, transform: `translateX(${tx}px)`,
            }}>
              <span style={{ fontSize: 60 }}>{CTA_ICON[c] ?? '👉'}</span>
              <span style={{ fontFamily: FONT, fontWeight: 700, fontSize: 56, color: C.branco }}>
                {chamada[i] || CTA_LABEL[c] || c}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
};

// ── Composição principal ──────────────────────────────────────────────────────
export const ReelsComposition: React.FC<ReelsProps> = (props) => {
  const {
    descricao, fotoStaticFile, fotoUrl, preco, precoInternet,
    vantagens, cta, unidadeUnica, abertura, roteiro, tempos,
    audioStaticFile, audioUrl,
  } = props;

  const { fps } = useVideoConfig();

  const audioSrc = audioStaticFile ? staticFile(audioStaticFile) : (audioUrl ?? undefined);
  const fotoSrc  = fotoStaticFile  ? staticFile(fotoStaticFile)  : (fotoUrl ?? null);

  // Timing de cada parte
  const aberturaT   = getTiming(tempos, 'abertura',   fps, [0, 2.5]);
  const corpoT      = getTiming(tempos, 'corpo',       fps, [2.5, 5.5]);
  const fechamentoT = getTiming(tempos, 'fechamento',  fps, [5.5, 8.0]);

  const precoF     = Math.max(0, corpoT.f1 - Math.round(fps * 0.6));
  const vantagensF = aberturaT.f1 + Math.round(fps * 0.3);
  const vantagensD = Math.max(1, corpoT.f1 - vantagensF);

  return (
    <AbsoluteFill>
      {/* Fonte */}
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Poppins:wght@400;700;900&display=swap');`}</style>

      {/* Áudio */}
      {audioSrc && <Audio src={audioSrc} />}

      {/* Fundo */}
      <Fundo />

      {/* Faixa topo — sempre visível */}
      <FaixaTopo />

      {/* Abertura */}
      <Sequence from={0} durationInFrames={aberturaT.f1}>
        <AberturaCena tipo={abertura} texto={roteiro.textos_tela.abertura} preco={preco} />
      </Sequence>

      {/* Foto */}
      <Sequence from={aberturaT.f1}>
        <FotoProduto src={fotoSrc} tipo={abertura} />
      </Sequence>

      {/* Nome */}
      <Sequence from={aberturaT.f1}>
        <NomeProduto nome={descricao} />
      </Sequence>

      {/* Vantagens */}
      {vantagens.length > 0 && vantagensD > 0 && (
        <Sequence from={vantagensF} durationInFrames={vantagensD}>
          <VantagensBadges vantagens={vantagens} />
        </Sequence>
      )}

      {/* Preço */}
      <Sequence from={precoF}>
        <PrecoCena preco={preco} precoInternet={precoInternet} />
      </Sequence>

      {/* CTA */}
      <Sequence from={fechamentoT.f0}>
        <CartaoCta
          cta={cta}
          unidadeUnica={unidadeUnica}
          chamada={roteiro.textos_tela.chamada}
        />
      </Sequence>
    </AbsoluteFill>
  );
};
