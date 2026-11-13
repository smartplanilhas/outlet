import { NextRequest, NextResponse } from "next/server";

export interface MLItem {
  id: string;
  title: string;
  price: number | null;
  currency_id: string;
  thumbnail: string;
  permalink: string;
  condition: "new" | "used" | null;
  sold_quantity: number;
  seller: { nickname: string };
  snippet?: string;
}

function buildSearchUrl(q: string) {
  return `https://lista.mercadolivre.com.br/${encodeURIComponent(q.trim()).replace(/%20/g, "-")}`;
}

let mlTokenCache: { token: string; expiresAt: number } | null = null;

async function getMlToken(): Promise<string | null> {
  const clientId = process.env.ML_CLIENT_ID;
  const clientSecret = process.env.ML_CLIENT_SECRET;
  if (!clientId || !clientSecret) return null;

  if (mlTokenCache && Date.now() < mlTokenCache.expiresAt) {
    return mlTokenCache.token;
  }

  try {
    const res = await fetch("https://api.mercadolibre.com/oauth/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        grant_type: "client_credentials",
        client_id: clientId,
        client_secret: clientSecret,
      }),
    });

    if (!res.ok) {
      const err = await res.text();
      console.error("[ML token] falhou:", res.status, err);
      return null;
    }
    const data = await res.json();
    if (!data.access_token) return null;

    mlTokenCache = {
      token: data.access_token,
      expiresAt: Date.now() + (data.expires_in - 60) * 1000,
    };
    return mlTokenCache.token;
  } catch (e) {
    console.error("[ML token] exceção:", e);
    return null;
  }
}

async function searchMercadoLivre(q: string): Promise<{ items: MLItem[]; ok: boolean }> {
  try {
    const token = await getMlToken();

    const url = new URL("https://api.mercadolibre.com/sites/MLB/search");
    url.searchParams.set("q", q);
    url.searchParams.set("limit", "12");

    const headers: Record<string, string> = {};
    if (token) headers["Authorization"] = `Bearer ${token}`;

    const res = await fetch(url.toString(), { headers, cache: "no-store" });

    if (!res.ok) {
      const err = await res.text();
      console.error("[ML search] falhou:", res.status, err);
      return { items: [], ok: false };
    }

    const data = await res.json();
    const raw: {
      id: string;
      title: string;
      price: number;
      currency_id: string;
      thumbnail: string;
      permalink: string;
      condition: string;
      sold_quantity: number;
      seller: { nickname: string };
    }[] = data.results ?? [];

    console.log("[ML search] resultados:", raw.length, "para:", q);

    if (!raw.length) return { items: [], ok: true };

    const items: MLItem[] = raw.map((r) => ({
      id: r.id,
      title: r.title,
      price: r.price ?? null,
      currency_id: r.currency_id ?? "BRL",
      thumbnail: (r.thumbnail ?? "").replace(/-I\.jpg$/i, "-O.jpg"),
      permalink: r.permalink,
      condition: (r.condition === "new" || r.condition === "used") ? r.condition : null,
      sold_quantity: r.sold_quantity ?? 0,
      seller: { nickname: r.seller?.nickname ?? "" },
    }));

    return { items: items.filter((i) => i.title), ok: true };
  } catch (e) {
    console.error("[ML search] exceção:", e);
    return { items: [], ok: false };
  }
}

function extractPrice(title: string, snippet: string): number | null {
  const text = `${title} ${snippet}`;
  const match = text.match(/R\$\s*([\d.,]+)/);
  if (!match) return null;
  const raw = match[1].replace(/\./g, "").replace(",", ".");
  const val = parseFloat(raw);
  return isNaN(val) ? null : val;
}

async function searchGoogle(q: string): Promise<{ items: MLItem[]; ok: boolean }> {
  const key = process.env.GOOGLE_API_KEY;
  const cx = process.env.GOOGLE_CX;
  if (!key || !cx) return { items: [], ok: false };

  const url = new URL("https://www.googleapis.com/customsearch/v1");
  url.searchParams.set("key", key);
  url.searchParams.set("cx", cx);
  url.searchParams.set("q", q);
  url.searchParams.set("num", "10");

  const res = await fetch(url.toString(), { next: { revalidate: 120 } });
  if (!res.ok) return { items: [], ok: false };

  const data = await res.json();
  const raw = data.items ?? [];

  const items: MLItem[] = raw.map((r: {
    title: string;
    link: string;
    snippet: string;
    pagemap?: {
      offer?: { price?: string }[];
      metatags?: Record<string, string>[];
      product?: { name?: string }[];
    };
  }) => {
    const offerPrice = r.pagemap?.offer?.[0]?.price;
    const price = offerPrice
      ? parseFloat(offerPrice)
      : extractPrice(r.title, r.snippet ?? "");
    const thumbnail = r.pagemap?.metatags?.[0]?.["og:image"] ?? null;
    const cleanTitle = r.pagemap?.product?.[0]?.name ?? r.title.replace(/\s*[-|].*Mercado.*$/i, "").trim();

    return {
      id: r.link,
      title: cleanTitle,
      price: price ?? null,
      currency_id: "BRL",
      thumbnail: thumbnail ?? "",
      permalink: r.link,
      condition: null,
      sold_quantity: 0,
      seller: { nickname: "" },
      snippet: r.snippet,
    };
  });

  return { items: items.filter((i) => i.title), ok: true };
}

export async function GET(req: NextRequest) {
  const q = req.nextUrl.searchParams.get("q");
  if (!q?.trim()) {
    return NextResponse.json({ error: "Parâmetro 'q' obrigatório." }, { status: 400 });
  }

  const searchUrl = buildSearchUrl(q);

  // 1. Mercado Livre API (com ou sem credenciais OAuth)
  const mlResult = await searchMercadoLivre(q);
  if (mlResult.ok && mlResult.items.length > 0) {
    return NextResponse.json({ items: mlResult.items, searchUrl, mode: "google" });
  }

  // 2. Google Custom Search como fallback
  const googleResult = await searchGoogle(q);
  if (googleResult.ok) {
    return NextResponse.json({ items: googleResult.items, searchUrl, mode: "google" });
  }

  // 3. Link direto para o ML
  return NextResponse.json({ items: [], searchUrl, mode: "link" });
}
