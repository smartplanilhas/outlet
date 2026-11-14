import { put } from "@vercel/blob";
import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const form = await req.formData();
    const file = form.get("file") as File | null;
    if (!file) return NextResponse.json({ error: "Nenhum arquivo enviado." }, { status: 400 });

    const ext      = file.name.split(".").pop() ?? "jpg";
    const filename = `produtos/${Date.now()}.${ext}`;

    const blob = await put(filename, file, { access: "public" });
    return NextResponse.json({ url: blob.url });
  } catch (e) {
    console.error("[upload POST]", e);
    return NextResponse.json({ error: "Erro ao fazer upload da imagem." }, { status: 500 });
  }
}
