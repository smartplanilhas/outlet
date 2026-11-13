import { NextRequest, NextResponse } from "next/server";

export interface MLProduct {
  id: string;
  name: string;
  thumbnail: string;
  pictures: string[];
  attributes: { id: string; name: string; value: string }[];
  price: number | null;
}

let tokenCache: { token: string; expiresAt: number } | null = null;

async function getToken(): Promise<string | null> {
  const clientId = process.env.ML_CLIENT_ID;
  const clientSecret = process.env.ML_CLIENT_SECRET;
  if (!clientId || !clientSecret) return null;
  if (tokenCache && Date.now() < tokenCache.expiresAt) return tokenCache.token;
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
    if (!res.ok) return null;
    const data = await res.json();
    if (!data.access_token) return null;
    tokenCache = { token: data.access_token, expiresAt: Date.now() + (data.expires_in - 60) * 1000 };
    return tokenCache.token;
  } catch {
    return null;
  }
}

async function resolveShortUrl(raw: string): Promise<string> {
  if (!/meli\.la\//i.test(raw)) return raw;
  try {
    const res = await fetch(raw.trim(), {
      headers: { "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36" },
    });
    // extrai MLB ID da URL final (após seguir redirects)
    const fromUrl = res.url.match(/MLB\d+/);
    if (fromUrl) return fromUrl[0];
    // fallback: procura no body HTML
    const html = await res.text();
    const fromBody = html.match(/MLB\d+/);
    return fromBody ? fromBody[0] : raw;
  } catch (e) {
    console.error("[meli.la resolve]", e);
    return raw;
  }
}

function normalizeId(raw: string): string {
  const s = raw.trim();

  // URL com catálogo: /p/MLB52039200
  const catalog = s.match(/\/p\/(MLB\d+)/i);
  if (catalog) return catalog[1].toUpperCase();

  // URL de anúncio: produto.mercadolivre.com.br/MLB-3282126605 ou wid=MLB4434672939
  const wid = s.match(/[?&#]wid=(MLB\d+)/i) ?? s.match(/\/MLB-(\d+)/i);
  if (wid) return `MLB${wid[1]}`.toUpperCase();

  // qualquer MLB... na string (código colado diretamente)
  const any = s.match(/MLB-?(\d+)/i);
  return any ? `MLB${any[1]}`.toUpperCase() : s.toUpperCase();
}

function metaContent(html: string, property: string): string {
  const re = new RegExp(`<meta[^>]+(?:property|name)=["']${property}["'][^>]+content=["']([^"']+)["']`, "i");
  const re2 = new RegExp(`<meta[^>]+content=["']([^"']+)["'][^>]+(?:property|name)=["']${property}["']`, "i");
  return (html.match(re) ?? html.match(re2))?.[1] ?? "";
}

function extractPrice(html: string): number | null {
  // tenta JSON-LD primeiro
  const ldMatch = html.match(/<script[^>]+type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi);
  if (ldMatch) {
    for (const block of ldMatch) {
      try {
        const json = JSON.parse(block.replace(/<\/?script[^>]*>/gi, ""));
        const price = json?.offers?.price ?? json?.offers?.[0]?.price;
        if (price) return parseFloat(String(price));
      } catch { /* continua */ }
    }
  }
  // fallback: busca padrão R$ no HTML
  const m = html.match(/["']price["']\s*:\s*["']?([\d.]+)["']?/);
  return m ? parseFloat(m[1]) : null;
}

async function fetchFromPage(id: string): Promise<MLProduct | null> {
  // ID de anúncio → URL com traço: MLB-3282126605
  const dashId = id.replace("MLB", "MLB-");
  const url = `https://produto.mercadolivre.com.br/${dashId}`;
  try {
    const res = await fetch(url, {
      headers: { "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36" },
      cache: "no-store",
    });
    if (!res.ok) return null;
    const html = await res.text();

    const name = metaContent(html, "og:title")
      .replace(/\s*\|.*$/, "")
      .replace(/\s*-\s*Mercado Livre.*$/i, "")
      .trim();
    const thumbnail = metaContent(html, "og:image");
    const price = extractPrice(html);

    if (!name) return null;
    return { id, name, thumbnail, pictures: thumbnail ? [thumbnail] : [], attributes: [], price };
  } catch {
    return null;
  }
}

async function fetchFromCatalog(id: string, token: string): Promise<MLProduct | null> {
  const res = await fetch(`https://api.mercadolibre.com/products/${id}`, {
    headers: { Authorization: `Bearer ${token}` },
    cache: "no-store",
  });
  if (!res.ok) return null;

  const data = await res.json();
  if (!data.name) return null;

  const pictures: string[] = (data.pictures ?? [])
    .map((p: { url?: string }) => p.url ?? "")
    .filter(Boolean);

  // preço: buy_box_winner → itens do catálogo → null
  let price: number | null = data.buy_box_winner?.price ?? null;
  if (!price) {
    try {
      const itemsRes = await fetch(`https://api.mercadolibre.com/products/${id}/items?limit=1`, {
        headers: { Authorization: `Bearer ${token}` },
        cache: "no-store",
      });
      if (itemsRes.ok) {
        const itemsData = await itemsRes.json();
        price = itemsData.results?.[0]?.price ?? null;
      }
    } catch { /* sem preço */ }
  }

  return {
    id: data.id,
    name: data.name,
    thumbnail: pictures[0] ?? "",
    pictures,
    attributes: (data.attributes ?? []).map((a: { id: string; name: string; value_name?: string }) => ({
      id: a.id, name: a.name, value: a.value_name ?? "",
    })),
    price,
  };
}

export async function GET(req: NextRequest) {
  const raw = req.nextUrl.searchParams.get("id");
  if (!raw?.trim()) {
    return NextResponse.json({ error: "Parâmetro 'id' obrigatório." }, { status: 400 });
  }

  const resolved = await resolveShortUrl(raw);
  const id = normalizeId(resolved);
  if (!/^MLB\d+$/.test(id)) {
    return NextResponse.json({ error: "Código inválido. Use o formato MLB seguido de números." }, { status: 400 });
  }

  const token = await getToken();

  // 1. tenta catálogo (IDs de produto)
  if (token) {
    const catalog = await fetchFromCatalog(id, token);
    if (catalog) return NextResponse.json(catalog);
  }

  // 2. fallback: scraping da página do anúncio
  const page = await fetchFromPage(id);
  if (page) return NextResponse.json(page);

  return NextResponse.json({ error: `Produto não encontrado. [product_id:${id}]` }, { status: 404 });
}
