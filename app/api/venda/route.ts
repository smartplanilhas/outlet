import { NextRequest, NextResponse } from "next/server";
import sql, { ensureTable } from "@/lib/db";

interface ItemPayload {
  produto_id: number | null;
  descricao: string;
  categoria: string | null;
  preco_unitario: number;
  quantidade: number;
  subtotal: number;
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { subtotal, desconto, total, forma_pagamento, valor_pago, troco, origem_venda, conta, itens } = body as {
      subtotal: number;
      desconto: number;
      total: number;
      forma_pagamento: string;
      valor_pago: number;
      troco: number;
      origem_venda: string | null;
      conta: string | null;
      itens: ItemPayload[];
    };

    if (!itens?.length) return NextResponse.json({ error: "Carrinho vazio." }, { status: 400 });

    await ensureTable();

    const [venda] = await sql`
      INSERT INTO vendas (subtotal, desconto, total, forma_pagamento, valor_pago, troco, origem_venda, conta)
      VALUES (${subtotal}, ${desconto}, ${total}, ${forma_pagamento}, ${valor_pago}, ${troco}, ${origem_venda ?? null}, ${conta ?? null})
      RETURNING *
    `;

    for (const item of itens) {
      await sql`
        INSERT INTO venda_itens (venda_id, produto_id, descricao, categoria, preco_unitario, quantidade, subtotal)
        VALUES (${venda.id}, ${item.produto_id ?? null}, ${item.descricao}, ${item.categoria ?? null},
                ${item.preco_unitario}, ${item.quantidade}, ${item.subtotal})
      `;
      if (item.produto_id) {
        await sql`
          UPDATE produtos_triagem
          SET quantidade = GREATEST(0, COALESCE(quantidade, 1) - ${item.quantidade})
          WHERE id = ${item.produto_id}
        `;
      }
    }

    return NextResponse.json({ ok: true, id: venda.id, total: venda.total });
  } catch (e) {
    console.error("[venda POST]", e);
    return NextResponse.json({ error: "Erro ao registrar venda." }, { status: 500 });
  }
}

export async function GET(req: NextRequest) {
  try {
    await ensureTable();
    const id = req.nextUrl.searchParams.get("id");

    if (id) {
      const [venda] = await sql`SELECT * FROM vendas WHERE id = ${parseInt(id)}`;
      const itens   = await sql`SELECT * FROM venda_itens WHERE venda_id = ${parseInt(id)} ORDER BY id`;
      return NextResponse.json({ ...venda, itens });
    }

    const rows = await sql`
      SELECT v.*, COUNT(i.id)::int AS total_itens
      FROM vendas v
      LEFT JOIN venda_itens i ON i.venda_id = v.id
      GROUP BY v.id
      ORDER BY v.data_venda DESC
      LIMIT 100
    `;
    return NextResponse.json(rows);
  } catch (e) {
    console.error("[venda GET]", e);
    return NextResponse.json({ error: "Erro ao buscar vendas." }, { status: 500 });
  }
}
