import { NextRequest, NextResponse } from "next/server";
import sql, { ensureTable } from "@/lib/db";

export interface Triagem {
  id: number;
  nome: string | null;
  status: "ativa" | "finalizada";
  data_inicio: string;
  data_fim: string | null;
  total_produtos?: number;
  total_outlet?: number;
  total_custo?: number;
}


export async function GET(req: NextRequest) {
  try {
    await ensureTable();
    const id     = req.nextUrl.searchParams.get("id");
    const status = req.nextUrl.searchParams.get("status");

    if (id) {
      const rows = await sql`
        SELECT t.*,
          COUNT(p.id)::int AS total_produtos,
          COALESCE(SUM(p.preco * p.quantidade), 0) AS total_outlet,
          COALESCE(SUM(p.custo * p.quantidade), 0) AS total_custo
        FROM triagens t
        LEFT JOIN produtos_triagem p ON p.triagem_id = t.id
        WHERE t.id = ${parseInt(id)}
        GROUP BY t.id
      `;
      return NextResponse.json(rows[0] ?? null);
    }

    const rows = status
      ? await sql`
          SELECT t.*,
            COUNT(p.id)::int AS total_produtos,
            COALESCE(SUM(p.preco * p.quantidade), 0) AS total_outlet,
            COALESCE(SUM(p.custo * p.quantidade), 0) AS total_custo
          FROM triagens t
          LEFT JOIN produtos_triagem p ON p.triagem_id = t.id
          WHERE t.status = ${status}
          GROUP BY t.id ORDER BY t.data_inicio DESC`
      : await sql`
          SELECT t.*,
            COUNT(p.id)::int AS total_produtos,
            COALESCE(SUM(p.preco * p.quantidade), 0) AS total_outlet,
            COALESCE(SUM(p.custo * p.quantidade), 0) AS total_custo
          FROM triagens t
          LEFT JOIN produtos_triagem p ON p.triagem_id = t.id
          GROUP BY t.id ORDER BY t.data_inicio DESC`;

    return NextResponse.json(rows);
  } catch (e) {
    console.error("[triagens GET]", e);
    return NextResponse.json({ error: "Erro ao buscar." }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const { nome } = await req.json();
    await ensureTable();
    const rows = await sql`
      INSERT INTO triagens (nome) VALUES (${nome?.trim() || null})
      RETURNING *
    `;
    return NextResponse.json(rows[0]);
  } catch (e) {
    console.error("[triagens POST]", e);
    return NextResponse.json({ error: "Erro ao criar." }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const id = req.nextUrl.searchParams.get("id");
    if (!id) return NextResponse.json({ error: "ID obrigatório." }, { status: 400 });
    const body = await req.json();
    await ensureTable();
    const rows = await sql`
      UPDATE triagens SET
        nome     = COALESCE(${body.nome    ?? null}, nome),
        status   = COALESCE(${body.status  ?? null}, status),
        data_fim = CASE WHEN ${body.status ?? null} = 'finalizada' THEN NOW() ELSE data_fim END
      WHERE id = ${parseInt(id)}
      RETURNING *
    `;
    return NextResponse.json(rows[0] ?? null);
  } catch (e) {
    console.error("[triagens PATCH]", e);
    return NextResponse.json({ error: "Erro ao atualizar." }, { status: 500 });
  }
}

