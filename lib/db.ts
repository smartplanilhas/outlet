import { neon } from "@neondatabase/serverless";

const sql = neon(process.env.DATABASE_URL!);

export default sql;

export async function ensureTable() {
  await sql`
    CREATE TABLE IF NOT EXISTS produtos_triagem (
      id               SERIAL PRIMARY KEY,
      codigo           VARCHAR(100),
      descricao        TEXT NOT NULL,
      foto_url         TEXT,
      codigo_ml        VARCHAR(50),
      preco_referencia NUMERIC(10,2),
      custo            NUMERIC(10,2),
      preco            NUMERIC(10,2),
      data_triagem     TIMESTAMPTZ DEFAULT NOW()
    )
  `;
  await sql`ALTER TABLE produtos_triagem ADD COLUMN IF NOT EXISTS custo NUMERIC(10,2)`;
  await sql`ALTER TABLE produtos_triagem ALTER COLUMN codigo_ml TYPE TEXT`;
  await sql`ALTER TABLE produtos_triagem ADD COLUMN IF NOT EXISTS quantidade INTEGER DEFAULT 1`;
  await sql`ALTER TABLE produtos_triagem ADD COLUMN IF NOT EXISTS endereco VARCHAR(100)`;
  await sql`
    CREATE TABLE IF NOT EXISTS triagens (
      id          SERIAL PRIMARY KEY,
      nome        VARCHAR(200),
      status      VARCHAR(20) DEFAULT 'ativa',
      data_inicio TIMESTAMPTZ DEFAULT NOW(),
      data_fim    TIMESTAMPTZ
    )
  `;
  await sql`ALTER TABLE produtos_triagem ADD COLUMN IF NOT EXISTS triagem_id INTEGER REFERENCES triagens(id) ON DELETE SET NULL`;
  await sql`ALTER TABLE produtos_triagem ADD COLUMN IF NOT EXISTS categoria VARCHAR(100)`;
  await sql`ALTER TABLE produtos_triagem ADD COLUMN IF NOT EXISTS catalogo BOOLEAN DEFAULT false`;
  await sql`ALTER TABLE produtos_triagem ADD COLUMN IF NOT EXISTS status VARCHAR(20)`;
  await sql`ALTER TABLE produtos_triagem ADD COLUMN IF NOT EXISTS venda_ml BOOLEAN DEFAULT false`;
  await sql`ALTER TABLE produtos_triagem ADD COLUMN IF NOT EXISTS vantagens TEXT[] DEFAULT '{}'`;
  await sql`ALTER TABLE produtos_triagem ADD COLUMN IF NOT EXISTS preco_internet NUMERIC(10,2)`;
  await sql`ALTER TABLE produtos_triagem ADD COLUMN IF NOT EXISTS remover_fundo BOOLEAN DEFAULT false`;
  await sql`ALTER TABLE produtos_triagem ADD COLUMN IF NOT EXISTS unidade_unica BOOLEAN DEFAULT false`;
  await sql`ALTER TABLE produtos_triagem ADD COLUMN IF NOT EXISTS cta TEXT[] DEFAULT '{whatsapp}'`;
  await sql`ALTER TABLE produtos_triagem ALTER COLUMN cta SET DEFAULT '{whatsapp}'`;
  await sql`
    CREATE TABLE IF NOT EXISTS reels_trabalhos (
      id                 SERIAL PRIMARY KEY,
      produto_id         INTEGER REFERENCES produtos_triagem(id) ON DELETE CASCADE,
      status             VARCHAR(20) DEFAULT 'pendente',
      abertura           TEXT,
      estilo_foto        VARCHAR(20),
      roteiro_narracao   TEXT,
      legenda            TEXT,
      hashtags           TEXT[],
      audio_url          TEXT,
      video_url          TEXT,
      capa_url           TEXT,
      instagram_media_id TEXT,
      instagram_link     TEXT,
      erro               TEXT,
      criado_em          TIMESTAMPTZ DEFAULT NOW(),
      atualizado_em      TIMESTAMPTZ DEFAULT NOW()
    )
  `;
  await sql`
    CREATE TABLE IF NOT EXISTS config_loja (
      id                 SERIAL PRIMARY KEY,
      whatsapp           VARCHAR(20),
      endereco           TEXT,
      horario            TEXT,
      link_bio           TEXT,
      instagram_usuario  VARCHAR(100),
      voz_id             TEXT DEFAULT '1oZawzZ4adgYtgm1oMqN'
    )
  `;
  await sql`ALTER TABLE reels_trabalhos ADD COLUMN IF NOT EXISTS tempos_narracao JSONB`;
  await sql`ALTER TABLE reels_trabalhos ADD COLUMN IF NOT EXISTS cta TEXT[]`;
  await sql`ALTER TABLE reels_trabalhos ADD COLUMN IF NOT EXISTS custo_estimado JSONB`;
  await sql`ALTER TABLE reels_trabalhos ADD COLUMN IF NOT EXISTS tipo VARCHAR(10) DEFAULT 'video'`;
  await sql`UPDATE reels_trabalhos SET tipo = 'video' WHERE tipo IS NULL`;
  await sql`ALTER TABLE vendas ADD COLUMN IF NOT EXISTS origem_venda VARCHAR(50)`;
  await sql`ALTER TABLE vendas ADD COLUMN IF NOT EXISTS conta VARCHAR(20)`;
  await sql`
    CREATE TABLE IF NOT EXISTS vendas (
      id              SERIAL PRIMARY KEY,
      data_venda      TIMESTAMPTZ DEFAULT NOW(),
      subtotal        NUMERIC(10,2) NOT NULL,
      desconto        NUMERIC(10,2) DEFAULT 0,
      total           NUMERIC(10,2) NOT NULL,
      forma_pagamento VARCHAR(50),
      valor_pago      NUMERIC(10,2),
      troco           NUMERIC(10,2) DEFAULT 0,
      observacao      TEXT
    )
  `;
  await sql`
    CREATE TABLE IF NOT EXISTS venda_itens (
      id             SERIAL PRIMARY KEY,
      venda_id       INTEGER NOT NULL REFERENCES vendas(id) ON DELETE CASCADE,
      produto_id     INTEGER REFERENCES produtos_triagem(id) ON DELETE SET NULL,
      descricao      TEXT NOT NULL,
      categoria      VARCHAR(100),
      preco_unitario NUMERIC(10,2) NOT NULL,
      quantidade     INTEGER NOT NULL DEFAULT 1,
      subtotal       NUMERIC(10,2) NOT NULL
    )
  `;
}
