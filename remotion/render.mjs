import { bundle }                       from '@remotion/bundler';
import { renderMedia, renderStill, selectComposition, ensureLocalBrowser } from '@remotion/renderer';
import { neon }                          from '@neondatabase/serverless';
import { put }                           from '@vercel/blob';
import { createRequire }                 from 'module';
import { fileURLToPath }                 from 'url';
import { dirname, join }                 from 'path';
import { writeFileSync, readFileSync, mkdirSync, existsSync, unlinkSync } from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname  = dirname(__filename);

const jobId = parseInt(process.argv[2]);
if (!jobId || isNaN(jobId)) {
  console.error('Uso: node render.mjs <jobId>');
  process.exit(1);
}

console.log(`\n── Render Reels — job #${jobId} ──`);

console.log('Garantindo browser...');
await ensureLocalBrowser();

const sql = neon(process.env.DATABASE_URL);

// ── Buscar dados do job ───────────────────────────────────────────────────────
const rows = await sql`
  SELECT rt.*, pt.descricao, pt.vantagens, pt.preco, pt.preco_internet,
         pt.foto_url, pt.remover_fundo, pt.unidade_unica,
         rt.cta AS cta_job, pt.cta AS cta_produto
  FROM reels_trabalhos rt
  JOIN produtos_triagem pt ON pt.id = rt.produto_id
  WHERE rt.id = ${jobId}
`;
const job = rows[0];
if (!job) {
  console.error(`Job ${jobId} não encontrado.`);
  process.exit(1);
}

let roteiro;
try { roteiro = JSON.parse(job.roteiro_narracao); }
catch { console.error('roteiro_narracao inválido.'); process.exit(1); }

let tempos;
try { tempos = JSON.parse(job.tempos_narracao ?? '[]'); }
catch { tempos = []; }

const fps = 30;
const narrativaDuracao = tempos.length > 0
  ? Math.max(...tempos.map(t => t.fim))
  : 8;
const durationInFrames = Math.ceil((narrativaDuracao + 1.5) * fps);

// CTA: job overrides produto
const cta = (job.cta_job ?? job.cta_produto ?? ['venha_loja']).slice(0, 2);

// ── Arquivos temporários (data URL → public/) ─────────────────────────────────
const publicDir = join(__dirname, 'public');
if (!existsSync(publicDir)) mkdirSync(publicDir, { recursive: true });

const tempFiles = [];

function salvaPublic(dataUrl, prefix, ext) {
  const base64   = dataUrl.split(',')[1];
  const filename = `${prefix}-${jobId}.${ext}`;
  writeFileSync(join(publicDir, filename), Buffer.from(base64, 'base64'));
  tempFiles.push(join(publicDir, filename));
  return filename;
}

let audioStaticFile = null;
let audioUrl        = job.audio_url;
if (audioUrl?.startsWith('data:')) {
  audioStaticFile = salvaPublic(audioUrl, 'audio', 'mp3');
  audioUrl        = null;
}

let fotoStaticFile = null;
let fotoUrl        = job.foto_url;
if (fotoUrl?.startsWith('data:')) {
  const ext = (fotoUrl.match(/^data:image\/(\w+);/) || [])[1] || 'jpg';
  fotoStaticFile = salvaPublic(fotoUrl, 'foto', ext);
  fotoUrl        = null;
}

// ── Timing para capa ──────────────────────────────────────────────────────────
const corpoTempo = tempos.find(t => t.parte === 'corpo');
const precoFrame = corpoTempo
  ? Math.max(0, Math.round(corpoTempo.fim * fps) - Math.round(fps * 0.3))
  : Math.round(5 * fps);

// ── Props para a composição ───────────────────────────────────────────────────
const inputProps = {
  descricao:        job.descricao,
  fotoStaticFile,
  fotoUrl,
  preco:            Number(job.preco),
  precoInternet:    job.preco_internet ? Number(job.preco_internet) : null,
  vantagens:        (job.vantagens ?? []).filter(Boolean),
  cta,
  unidadeUnica:     !!job.unidade_unica,
  abertura:         job.abertura ?? 'caixa_misteriosa',
  roteiro:          { textos_tela: roteiro.textos_tela },
  tempos,
  audioStaticFile,
  audioUrl,
  durationInFrames,
};

// ── Bundle ────────────────────────────────────────────────────────────────────
console.log('Bundling...');
const serveUrl = await bundle({
  entryPoint: join(__dirname, 'src/index.ts'),
});

// ── Select composition ────────────────────────────────────────────────────────
const composition = await selectComposition({
  serveUrl,
  id: 'ReelsComposition',
  inputProps: { ...inputProps, durationInFrames },
});

// ── Diretório de saída ────────────────────────────────────────────────────────
const outDir = '/tmp/remotion-out';
if (!existsSync(outDir)) mkdirSync(outDir, { recursive: true });

const videoPath = `${outDir}/video-${jobId}.mp4`;
const coverPath = `${outDir}/cover-${jobId}.jpg`;

// ── Render vídeo ──────────────────────────────────────────────────────────────
console.log(`Renderizando ${durationInFrames} frames @ ${fps}fps...`);
await renderMedia({
  composition,
  serveUrl,
  codec:         'h264',
  outputLocation: videoPath,
  inputProps:    { ...inputProps, durationInFrames },
  concurrency:   2,
  timeoutInMilliseconds: 180_000,
});
console.log('Vídeo renderizado.');

// ── Render capa (frame do carimbo de preço) ───────────────────────────────────
console.log('Gerando capa...');
await renderStill({
  composition,
  serveUrl,
  output:     coverPath,
  inputProps: { ...inputProps, durationInFrames },
  frame:      Math.min(precoFrame + 10, durationInFrames - 1),
  imageFormat: 'jpeg',
  jpegQuality: 90,
});
console.log('Capa gerada.');

// ── Upload Vercel Blob ────────────────────────────────────────────────────────
console.log('Uploading...');
const videoBlob = await put(
  `reels/video/${jobId}-${Date.now()}.mp4`,
  readFileSync(videoPath),
  { access: 'public', contentType: 'video/mp4' },
);
const coverBlob = await put(
  `reels/covers/${jobId}-${Date.now()}.jpg`,
  readFileSync(coverPath),
  { access: 'public', contentType: 'image/jpeg' },
);
console.log('Upload concluído:', videoBlob.url);

// ── Atualizar job ─────────────────────────────────────────────────────────────
await sql`
  UPDATE reels_trabalhos SET
    status        = 'pronto',
    video_url     = ${videoBlob.url},
    capa_url      = ${coverBlob.url},
    atualizado_em = NOW()
  WHERE id = ${jobId}
`;
console.log(`Job #${jobId} → pronto. ✓\n`);

// ── Limpeza ───────────────────────────────────────────────────────────────────
for (const f of tempFiles) {
  try { unlinkSync(f); } catch {}
}

process.exit(0);
