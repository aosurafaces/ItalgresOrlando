// src/worker.ts — Single Cloudflare Worker entry point
// Routes: /api/collections → Airtable (KV cached), /api/chat → AI, * → React app

interface Env {
  ASSETS: Fetcher;
  AI: Ai;
  AIRTABLE_TOKEN: string;
  AIRTABLE_BASE: string;
  AIRTABLE_TABLE: string;
  CATALOG_CACHE: KVNamespace;
  REFRESH_TOKEN: string;
}

const LANDING_HOST = "italgres-orlando.com";
const CATALOG_HOST = "catalog.italgres-orlando.com";

// Allow both domains + dev subdomain
const ALLOWED_ORIGINS = [
  "https://italgres-orlando.com",
  "https://catalog.italgres-orlando.com",
  "https://italgresorlando.andres-f72.workers.dev",
];

function getCors(origin: string) {
  const allowed = ALLOWED_ORIGINS.includes(origin) ? origin : ALLOWED_ORIGINS[2];
  return {
    "Access-Control-Allow-Origin": allowed,
    "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
  };
}

const SECURITY_HEADERS = {
  "X-Content-Type-Options": "nosniff",
  "X-Frame-Options": "DENY",
  "Referrer-Policy": "strict-origin-when-cross-origin",
};

const CACHE_KEY = "collections_v1";
const CACHE_TTL = 600; // 10 minutes in seconds

const F = {
  name: "Name", brand: "Brand", collection: "Collection",
  color: "Color", application: "Application", finish: "Finish",
  size: "Size", thickness: "Thickness", sqFtPerBox: "Sq Ft Per Box",
  stockQty1: "Stock Qty 1", stockQty2: "Stock Qty 2",
  price: "Price", productPhotoUrl: "Product Photo",
  specificMaterialStyle: "Specific Material Style",
  visualLook: "Visual Look", colorGroup: "Color Group",
};

function str(v: unknown): string {
  if (typeof v === "string") return v.trim();
  if (Array.isArray(v)) return v.join(", ").trim();
  return "";
}
function arr(v: unknown): string[] {
  if (Array.isArray(v)) return v.map(String);
  if (typeof v === "string" && v.trim()) return [v.trim()];
  return [];
}
function slugify(s: string): string {
  return s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 80);
}
function deriveCategory(look: string, finish: string): string {
  const v = (look + " " + finish).toLowerCase();
  if (v.match(/marble|calacatta|statuario|nero|arabescato|travertine|quartzite|patagonie/)) return "Marble Look";
  if (v.match(/concrete|cement|iron|zinc|aluminio|distrito|deco/)) return "Concrete Look";
  if (v.match(/metal|bronze|ankara/)) return "Metal Look";
  if (v.match(/wood|plank|tundra/)) return "Wood Look";
  return "Stone Look";
}
function deriveGradient(color: string, category: string): string {
  const c = color.toLowerCase();
  if (c.match(/black|nero|lavagna/)) return "linear-gradient(135deg,#1a1a1a,#0a0a0a)";
  if (c.match(/white|calacatta|statuario/)) return "linear-gradient(135deg,#f5f0e8,#e8dfc8)";
  if (c.match(/beige|travertine|warm/)) return "linear-gradient(135deg,#d4b07a,#b89060)";
  if (category === "Concrete Look") return "linear-gradient(135deg,#585450,#323030)";
  return "linear-gradient(135deg,#c8b090,#a88060)";
}

async function fetchFromAirtable(env: Env): Promise<object[]> {
  const records: object[] = [];
  let offset: string | undefined;

  do {
    const params = new URLSearchParams({ pageSize: "100" });
    if (offset) params.set("offset", offset);
    const url = `https://api.airtable.com/v0/${env.AIRTABLE_BASE}/${env.AIRTABLE_TABLE}?${params}`;
    const res = await fetch(url, { headers: { Authorization: `Bearer ${env.AIRTABLE_TOKEN}` } });
    if (!res.ok) throw new Error(`Airtable ${res.status}: ${await res.text()}`);
    const data = await res.json() as { records: {id:string;fields:Record<string,unknown>}[]; offset?:string };

    for (const r of data.records) {
      const f = r.fields;
      const stock1 = typeof f[F.stockQty1] === "number" ? f[F.stockQty1] as number : 0;
      const stock2 = typeof f[F.stockQty2] === "number" ? f[F.stockQty2] as number : 0;
      const name = str(f[F.name]) || [str(f[F.collection]), str(f[F.size])].filter(Boolean).join(" ");
      const color = str(f[F.color]) || str(f[F.colorGroup]) || "";
      const finish = str(f[F.finish]) || str(f["Style"]) || "Matte";
      const visualLook = str(f[F.visualLook]) || str(f[F.specificMaterialStyle]) || "";
      const category = deriveCategory(visualLook, finish);
      const size = str(f[F.size]);

      records.push({
        id: slugify(name || r.id),
        airtableId: r.id,
        name,
        brand: str(f[F.brand]),
        collection: str(f[F.collection]),
        category,
        finish,
        formats: size ? [size] : [],
        specs: [size, str(f[F.thickness])].filter(Boolean).join(" · "),
        description: `${name} — ${category} with ${finish} finish`,
        colors: color ? [color] : [],
        applications: arr(f[F.application]),
        finishAndFeel: finish,
        colorGroup: str(f[F.colorGroup]) || color,
        sizeAndFormat: size,
        thickness: str(f[F.thickness]),
        visualLook,
        specificMaterialStyle: str(f[F.specificMaterialStyle]),
        thumbnailUrl: (f["Photo "] as any)?.[0]?.url || str(f[F.productPhotoUrl]) || "",
        productPhotoUrl: str(f[F.productPhotoUrl]) || "",
        backgroundGradient: deriveGradient(color, category),
        origin: str(f[F.brand]) || "European",
        unit: str(f["Unit"]) || "SqFt",
        sqFtPerUnit: f["Sq Ft Per Unit"] ?? null,
        sqFtPerBox: f[F.sqFtPerBox] ?? null,
        stockQuantities: stock1 > 0 || stock2 > 0 ? `${stock1}/${stock2}` : null,
        inStock: stock1 > 0 || stock2 > 0,
        price: str(f[F.price]) || null,
      });
    }
    offset = data.offset;
  } while (offset);

  return records;
}

async function handleCollections(request: Request, env: Env, CORS: Record<string,string>): Promise<Response> {
  try {
    if (!env.AIRTABLE_TOKEN) throw new Error("Missing AIRTABLE_TOKEN");

    // Force refresh requires a secret token
    const url = new URL(request.url);
    const forceRefresh = url.searchParams.get("refresh") === "1" &&
      url.searchParams.get("token") === env.REFRESH_TOKEN;

    // Try KV cache first
    if (!forceRefresh && env.CATALOG_CACHE) {
      const cached = await env.CATALOG_CACHE.get(CACHE_KEY);
      if (cached) {
        return new Response(cached, {
          headers: { "Content-Type": "application/json", "X-Cache": "HIT", ...CORS, ...SECURITY_HEADERS },
        });
      }
    }

    const records = await fetchFromAirtable(env);
    const json = JSON.stringify(records);

    if (env.CATALOG_CACHE) {
      await env.CATALOG_CACHE.put(CACHE_KEY, json, { expirationTtl: CACHE_TTL });
    }

    return new Response(json, {
      headers: { "Content-Type": "application/json", "X-Cache": "MISS", ...CORS, ...SECURITY_HEADERS },
    });
  } catch (err) {
    console.error("Collections error:", err);
    return new Response(JSON.stringify({ error: String(err) }), {
      status: 500,
      headers: { "Content-Type": "application/json", ...CORS },
    });
  }
}

async function handleChat(request: Request, env: Env, CORS: Record<string,string>): Promise<Response> {
  try {
    const { messages } = await request.json() as { messages: {role:string;content:string}[] };
    if (!Array.isArray(messages) || messages.length === 0) {
      return new Response(JSON.stringify({ error: "No messages" }), { status: 400, headers: { "Content-Type": "application/json", ...CORS } });
    }

    const clean = messages
      .filter(m => m.role === "user" || m.role === "assistant")
      .slice(-10);
    const firstUser = clean.findIndex(m => m.role === "user");
    const finalMessages = firstUser > 0 ? clean.slice(firstUser) : clean;

    const systemPrompt = `You are TileAI, the AI material finder for Italgres Orlando — a luxury European tile showroom in Orlando, FL. Help clients find the right tile by asking about their space, style preference, finish, and size. Recommend specific products by name after 1-2 exchanges. Keep responses concise. If they want to book, say "Use the Book a Consultation button above."`;

    const result = await env.AI.run("@cf/meta/llama-3.1-8b-instruct", {
      messages: [{ role: "system", content: systemPrompt }, ...finalMessages],
      max_tokens: 512,
    });

    return new Response(JSON.stringify({ text: (result as {response:string}).response }), {
      headers: { "Content-Type": "application/json", ...CORS, ...SECURITY_HEADERS },
    });
  } catch (err) {
    console.error("Chat error:", err);
    return new Response(JSON.stringify({ error: String(err) }), {
      status: 500,
      headers: { "Content-Type": "application/json", ...CORS, ...SECURITY_HEADERS },
    });
  }
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);
    const origin = request.headers.get("Origin") || "";
    const CORS = getCors(origin);
    const host = url.hostname;

    if (request.method === "OPTIONS") {
      return new Response(null, { headers: CORS });
    }

    // Landing page domain — serve landing.html for all routes
    if (host === LANDING_HOST || host === `www.${LANDING_HOST}`) {
      const landingReq = new Request(new URL("/landing.html", request.url).toString(), request);
      return env.ASSETS.fetch(landingReq);
    }

    // API routes — only available on catalog domain or dev subdomain
    if (url.pathname === "/api/collections" && request.method === "GET") {
      return handleCollections(request, env, CORS);
    }

    if (url.pathname === "/api/chat" && request.method === "POST") {
      return handleChat(request, env, CORS);
    }

    // Catalog domain — serve React app
    return env.ASSETS.fetch(request);
  },
};
