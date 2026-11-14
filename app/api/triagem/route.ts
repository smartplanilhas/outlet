import { NextRequest, NextResponse } from "next/server";
import sql, { ensureTable } from "@/lib/db";

export interface ProdutoTriagem {
  id: number;
  codigo: string | null;
  descricao: string;
  foto_url: string | null;
  codigo_ml: string | null;
  preco_referencia: number | null;
  custo: number | null;
  preco: number | null;
  quantidade: number | null;
  endereco: string | null;
  data_triagem: string;
  triagem_id: number | null;
  categoria: string | null;
  catalogo: boolean | null;
}

export interface ProdutoPayload {
  codigo?: string;
  descricao: string;
  foto_url?: string;
  codigo_ml?: string;
  preco_referencia?: number | null;
  custo?: number | null;
  preco?: number | null;
  quantidade?: number | null;
  endereco?: string | null;
  triagem_id?: number | null;
  categoria?: string | null;
  catalogo?: boolean | null;
}

export async function POST(req: NextRequest) {
  try {
    const body: ProdutoPayload = await req.json();
    if (!body.descricao?.trim()) {
      return NextResponse.json({ error: "Descrição obrigatória." }, { status: 400 });
    }

    await ensureTable();

    const rows = await sql`
      INSERT INTO produtos_triagem
        (codigo, descricao, foto_url, codigo_ml, preco_referencia, custo, preco, quantidade, endereco, triagem_id, categoria)
      VALUES
        (${body.codigo?.trim() || null},
         ${body.descricao.trim()},
         ${body.foto_url || null},
         ${body.codigo_ml || null},
         ${body.preco_referencia ?? null},
         ${body.custo ?? null},
         ${body.preco ?? null},
         ${body.quantidade ?? 1},
         ${body.endereco?.trim() || null},
         ${body.triagem_id ?? null},
         ${body.categoria?.trim() || null})
      RETURNING id, data_triagem
    `;

    return NextResponse.json({ ok: true, id: rows[0].id, data_triagem: rows[0].data_triagem });
  } catch (e) {
    console.error("[triagem POST]", e);
    return NextResponse.json({ error: "Erro ao salvar." }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const id = req.nextUrl.searchParams.get("id");
    if (!id) return NextResponse.json({ error: "ID obrigatório." }, { status: 400 });
    const body: Partial<ProdutoPayload> = await req.json();
    await ensureTable();
    // Full-field update — only when descricao is present (EditableRow full save)
    if ("descricao" in body) {
      await sql`
        UPDATE produtos_triagem SET
          descricao        = COALESCE(${body.descricao ?? null}, descricao),
          codigo           = ${body.codigo ?? null},
          preco_referencia = ${body.preco_referencia ?? null},
          custo            = ${body.custo ?? null},
          preco            = ${body.preco ?? null},
          quantidade       = ${body.quantidade ?? null},
          endereco         = ${body.endereco?.trim() || null},
          categoria        = ${body.categoria?.trim() || null}
        WHERE id = ${parseInt(id)}
      `;
    }
    if ("triagem_id" in body) {
      await sql`UPDATE produtos_triagem SET triagem_id = ${body.triagem_id ?? null} WHERE id = ${parseInt(id)}`;
    }
    if ("catalogo" in body) {
      await sql`UPDATE produtos_triagem SET catalogo = ${body.catalogo ?? false} WHERE id = ${parseInt(id)}`;
    }
    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error("[triagem PATCH]", e);
    return NextResponse.json({ error: "Erro ao atualizar." }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const id = req.nextUrl.searchParams.get("id");
    if (!id) return NextResponse.json({ error: "ID obrigatório." }, { status: 400 });
    await ensureTable();
    await sql`DELETE FROM produtos_triagem WHERE id = ${parseInt(id)}`;
    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error("[triagem DELETE]", e);
    return NextResponse.json({ error: "Erro ao remover." }, { status: 500 });
  }
}

export async function GET(req: NextRequest) {
  try {
    await ensureTable();
    const triagemId = req.nextUrl.searchParams.get("triagem_id");
    const q         = req.nextUrl.searchParams.get("q");

    // Busca para o PDV: por código exato, ID ou descrição parcial
    if (q) {
      const term = q.trim();
      const rows = await sql`
        SELECT * FROM produtos_triagem
        WHERE (
          LOWER(codigo) = LOWER(${term})
          OR id = ${parseInt(term) || -1}
          OR descricao ILIKE ${'%' + term + '%'}
        )
        AND preco IS NOT NULL
        AND COALESCE(quantidade, 1) > 0
        ORDER BY
          CASE WHEN LOWER(codigo) = LOWER(${term}) THEN 0 ELSE 1 END,
          data_triagem DESC
        LIMIT 20
      `;
      return NextResponse.json(rows);
    }

    const rows = triagemId
      ? await sql`SELECT * FROM produtos_triagem WHERE triagem_id = ${parseInt(triagemId)} ORDER BY data_triagem DESC LIMIT 200`
      : await sql`SELECT * FROM produtos_triagem ORDER BY data_triagem DESC LIMIT 200`;
    return NextResponse.json(rows);
  } catch (e) {
    console.error("[triagem GET]", e);
    return NextResponse.json({ error: "Erro ao buscar." }, { status: 500 });
  }
}
