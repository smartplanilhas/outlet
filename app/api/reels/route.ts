import { NextRequest, NextResponse } from "next/server";
import sql, { ensureTable } from "@/lib/db";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const produto_id = parseInt(body.produto_id);
    if (!produto_id) return NextResponse.json({ error: "produto_id obrigatório." }, { status: 400 });

    await ensureTable();

    const existing = await sql`
      SELECT id, status FROM reels_trabalhos
      WHERE produto_id = ${produto_id} AND status IN ('pendente', 'gerando')
      LIMIT 1
    `;
    if (existing.length > 0) {
      return NextResponse.json({ ok: true, id: existing[0].id, status: existing[0].status, existed: true });
    }

    const rows = await sql`
      INSERT INTO reels_trabalhos (produto_id)
      VALUES (${produto_id})
      RETURNING id, status, criado_em
    `;
    return NextResponse.json({ ok: true, id: rows[0].id, status: rows[0].status });
  } catch (e) {
    console.error("[reels POST]", e);
    return NextResponse.json({ error: "Erro ao criar trabalho." }, { status: 500 });
  }
}

export async function GET(req: NextRequest) {
  try {
    await ensureTable();
    const produtoId = req.nextUrl.searchParams.get("produto_id");

    if (produtoId) {
      const rows = await sql`
        SELECT rt.*, pt.descricao, pt.foto_url
        FROM reels_trabalhos rt
        JOIN produtos_triagem pt ON pt.id = rt.produto_id
        WHERE rt.produto_id = ${parseInt(produtoId)}
        ORDER BY rt.criado_em DESC
        LIMIT 20
      `;
      return NextResponse.json(rows);
    }

    const rows = await sql`
      SELECT rt.*, pt.descricao, pt.foto_url
      FROM reels_trabalhos rt
      JOIN produtos_triagem pt ON pt.id = rt.produto_id
      ORDER BY rt.criado_em DESC
      LIMIT 100
    `;
    return NextResponse.json(rows);
  } catch (e) {
    console.error("[reels GET]", e);
    return NextResponse.json({ error: "Erro ao buscar." }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const id = req.nextUrl.searchParams.get("id");
    if (!id) return NextResponse.json({ error: "ID obrigatório." }, { status: 400 });
    const body = await req.json();

    await ensureTable();

    if ("legenda" in body) {
      await sql`
        UPDATE reels_trabalhos SET legenda = ${body.legenda}, atualizado_em = NOW()
        WHERE id = ${parseInt(id)}
      `;
    }
    if ("status" in body) {
      await sql`
        UPDATE reels_trabalhos SET status = ${body.status}, atualizado_em = NOW()
        WHERE id = ${parseInt(id)}
      `;
    }

    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error("[reels PATCH]", e);
    return NextResponse.json({ error: "Erro ao atualizar." }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const id = req.nextUrl.searchParams.get("id");
    if (!id) return NextResponse.json({ error: "ID obrigatório." }, { status: 400 });

    await ensureTable();
    await sql`DELETE FROM reels_trabalhos WHERE id = ${parseInt(id)}`;
    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error("[reels DELETE]", e);
    return NextResponse.json({ error: "Erro ao excluir." }, { status: 500 });
  }
}
