import { NextRequest, NextResponse } from "next/server";
import sql, { ensureTable } from "@/lib/db";

export async function GET() {
  try {
    await ensureTable();
    const rows = await sql`SELECT * FROM config_loja LIMIT 1`;
    return NextResponse.json(rows[0] ?? null);
  } catch (e) {
    console.error("[config-loja GET]", e);
    return NextResponse.json({ error: "Erro ao buscar." }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  try {
    const body = await req.json();
    await ensureTable();

    const existing = await sql`SELECT id FROM config_loja LIMIT 1`;

    if (existing.length > 0) {
      await sql`
        UPDATE config_loja SET
          whatsapp          = ${body.whatsapp ?? null},
          endereco          = ${body.endereco ?? null},
          horario           = ${body.horario ?? null},
          link_bio          = ${body.link_bio ?? null},
          instagram_usuario = ${body.instagram_usuario ?? null},
          voz_id            = ${body.voz_id ?? '1oZawzZ4adgYtgm1oMqN'}
        WHERE id = ${existing[0].id}
      `;
    } else {
      await sql`
        INSERT INTO config_loja (whatsapp, endereco, horario, link_bio, instagram_usuario, voz_id)
        VALUES (
          ${body.whatsapp ?? null},
          ${body.endereco ?? null},
          ${body.horario ?? null},
          ${body.link_bio ?? null},
          ${body.instagram_usuario ?? null},
          ${body.voz_id ?? '1oZawzZ4adgYtgm1oMqN'}
        )
      `;
    }

    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error("[config-loja PUT]", e);
    return NextResponse.json({ error: "Erro ao salvar." }, { status: 500 });
  }
}
