import { NextRequest, NextResponse } from "next/server";
import sql, { ensureTable } from "@/lib/db";

export async function POST(req: NextRequest) {
  try {
    const { id } = await req.json();
    const jobId = parseInt(id);
    if (!jobId) return NextResponse.json({ error: "id obrigatório." }, { status: 400 });

    await ensureTable();

    const rows = await sql`SELECT id, status, roteiro_narracao FROM reels_trabalhos WHERE id = ${jobId}`;
    const job = rows[0];
    if (!job) return NextResponse.json({ error: "Job não encontrado." }, { status: 404 });
    if (!job.roteiro_narracao) return NextResponse.json({ error: "Roteiro ainda não gerado." }, { status: 400 });

    // Resetar status para aguardando_video
    await sql`UPDATE reels_trabalhos SET status = 'aguardando_video', erro = NULL, atualizado_em = NOW() WHERE id = ${jobId}`;

    // Disparar GitHub Actions
    const githubPat  = process.env.GITHUB_PAT;
    const githubRepo = process.env.GITHUB_REPO ?? 'smartplanilhas/outlet';

    if (!githubPat) return NextResponse.json({ error: "GITHUB_PAT não configurado no servidor." }, { status: 500 });

    const dispatchRes = await fetch(`https://api.github.com/repos/${githubRepo}/dispatches`, {
      method:  'POST',
      headers: {
        'Authorization': `Bearer ${githubPat}`,
        'Accept':        'application/vnd.github.v3+json',
        'Content-Type':  'application/json',
      },
      body: JSON.stringify({
        event_type:     'render-reels',
        client_payload: { job_id: jobId },
      }),
    });

    if (!dispatchRes.ok) {
      const err = await dispatchRes.text();
      return NextResponse.json({ error: `GitHub dispatch falhou: ${err}` }, { status: 500 });
    }

    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error("[renderizar]", e);
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}
