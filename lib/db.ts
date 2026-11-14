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
}
