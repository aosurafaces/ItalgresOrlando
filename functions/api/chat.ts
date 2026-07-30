// functions/api/chat.ts
// Cloudflare Pages Function — /api/chat
// Fetches live Airtable products, injects into TileAI context
//
// Required env vars:
//   ANTHROPIC_API_KEY
//   AIRTABLE_TOKEN
//   AIRTABLE_BASE    appuFzevFbr3IyUHC
//   AIRTABLE_TABLE   tbljY0BfzJigZGCJr

interface Env {
  AI: { run: (model: string, options: object) => Promise<{ response: string }> };
  AIRTABLE_TOKEN: string;
  AIRTABLE_BASE: string;
  AIRTABLE_TABLE: string;
}

interface Message {
  role: "user" | "assistant";
  content: string;
}

const MAX_INPUT_CHARS = 500;
const MAX_HISTORY    = 10;
const MAX_TOKENS     = 1024;


const F = {
  name:                 "Name",
  brand:                "Brand",
  collection:           "Collection",
  color:                "Color",
  application:          "Application",
  finish:               "Finish",
  size:                 "Size",
  thickness:            "Thickness",
  sqFtPerBox:           "Sq Ft Per Box",
  stockQty1:            "Stock Qty 1",
  stockQty2:            "Stock Qty 2",
  price:                "Price",
  productPhotoUrl:      "Product Photo URL",
  specificMaterialStyle:"Specific Material Style",
  visualLook:           "Visual Look",
  colorGroup:           "Color Group",
};

async function fetchProducts(token: string, base: string, table: string): Promise<object[]> {
  const records: object[] = [];
  let offset: string | undefined;
  do {
    const params = new URLSearchParams({ pageSize: "100" });
    if (offset) params.set("offset", offset);
    const res = await fetch(`https://api.airtable.com/v0/${base}/${table}?${params}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!res.ok) throw new Error(`Airtable ${res.status}`);
    const data = await res.json() as {
      records: { id: string; fields: Record<string, unknown> }[];
      offset?: string;
    };
    for (const r of data.records) {
      const f = r.fields;
      const stock1 = typeof f[F.stockQty1] === "number" ? f[F.stockQty1] as number : 0;
      const stock2 = typeof f[F.stockQty2] === "number" ? f[F.stockQty2] as number : 0;
      records.push({
        id:                   slugify(str(f[F.name]) || r.id),
        name:                 str(f[F.name]),
        brand:                str(f[F.brand]),
        collection:           str(f[F.collection]),
        color:                str(f[F.color]),
        finish:               str(f[F.finish]),
        size:                 str(f[F.size]),
        thickness:            str(f[F.thickness]),
        application:          arr(f[F.application]).join(", "),
        visualLook:           str(f[F.visualLook]) || str(f[F.specificMaterialStyle]),
        colorGroup:           str(f[F.colorGroup]),
        sqFtPerBox:           f[F.sqFtPerBox] ?? null,
        stockQuantities:      stock1 > 0 || stock2 > 0 ? `${stock1}/${stock2} boxes` : "Order item",
        inStock:              stock1 > 0 || stock2 > 0,
        price:                str(f[F.price]),
        productPhotoUrl:      str(f[F.productPhotoUrl]),
        specificMaterialStyle: str(f[F.specificMaterialStyle]),
      });
    }
    offset = data.offset;
  } while (offset);
  return records;
}

function extractIntent(messages: Message[]): string {
  return messages.filter(m => m.role === "user").slice(-3).map(m => m.content).join(" ").toLowerCase();
}

function scoreProducts(products: object[], intent: string): object[] {
  const terms = intent.split(/\s+/).filter(t => t.length > 2);
  const scored = (products as Record<string, unknown>[]).map(p => {
    let score = 0;
    const text = [p.name, p.brand, p.collection, p.color, p.finish, p.size, p.application, p.visualLook, p.colorGroup, p.specificMaterialStyle].join(" ").toLowerCase();
    for (const term of terms) { if (text.includes(term)) score += 2; }
    if (p.inStock) score += 1;
    if (intent.includes("marble") && text.includes("marble")) score += 3;
    if (intent.includes("outdoor") && text.includes("outdoor")) score += 3;
    if (intent.includes("floor") && text.includes("floor")) score += 2;
    if (intent.includes("wall") && text.includes("wall")) score += 2;
    if (intent.includes("white") && (text.includes("white") || text.includes("calacatta"))) score += 3;
    if (intent.includes("black") && (text.includes("black") || text.includes("nero"))) score += 3;
    if (intent.includes("concrete") && text.includes("concrete")) score += 3;
    if (intent.includes("wood") && text.includes("wood")) score += 3;
    if (intent.includes("polished") && text.includes("polished")) score += 2;
    if (intent.includes("matte") && text.includes("matte")) score += 2;
    if (intent.includes("large") && (text.includes("160") || text.includes("120"))) score += 2;
    if (intent.includes("kitchen") && text.includes("floor")) score += 1;
    if (intent.includes("bathroom") && text.includes("wall")) score += 1;
    if (intent.includes("stock") && p.inStock) score += 4;
    return { product: p, score };
  });
  return scored.filter(s => s.score > 0).sort((a, b) => b.score - a.score).slice(0, 6).map(s => s.product);
}

function buildSystemPrompt(products: object[]): string {
  const catalog = (products as Record<string, unknown>[]).map(p =>
    [`• ${p.name}`, p.brand ? `Brand: ${p.brand}` : null, p.finish ? `Finish: ${p.finish}` : null,
     p.size ? `Size: ${p.size}` : null, p.application ? `Application: ${p.application}` : null,
     p.colorGroup ? `Color: ${p.colorGroup}` : null, p.stockQuantities ? `Stock: ${p.stockQuantities}` : null,
     p.specificMaterialStyle ? `Style: ${p.specificMaterialStyle}` : null].filter(Boolean).join(" | ")
  ).join("\n");

  return `You are TileAI, the AI material finder for Italgres Orlando — a luxury European tile showroom in Orlando, FL operated by AOSurfaces Group LLC.

Your job is to understand what the client needs and match them to real products from the live catalog below.

CONVERSATION APPROACH:
1. If the client hasn't specified the space — ask once (kitchen, bathroom, outdoor, commercial, living room).
2. If the client hasn't specified a look — ask once (marble, concrete, wood, stone, warm, cool, dramatic, minimal).
3. Once you have enough context (1-2 exchanges), recommend 2-4 specific products from the catalog by name.
4. Always mention finish, size, and stock status when recommending.
5. After recommending say: "You can pre-select any of these above, or I can connect you with Carlos for samples."
6. Never mention products not in the catalog. Never invent specs.
7. If asked about pricing say: "Pricing is confirmed during consultation with Carlos based on project quantity."
8. Keep responses concise — 3-5 sentences max unless detail is requested.
9. If someone wants to book say: "Use the Book a Consultation button to schedule with Carlos directly."

WHEN RESPONDING WITH PRODUCT RECOMMENDATIONS return this exact JSON format:

\`\`\`json
{
  "message": "Your conversational response explaining why these fit.",
  "products": [
    {
      "id": "product-id-slug",
      "name": "Full Product Name",
      "brand": "Brand Name",
      "finish": "Finish Type",
      "size": "Size Format",
      "category": "Marble Look",
      "productPhotoUrl": "url or empty string",
      "stockQuantities": "stock info or null"
    }
  ]
}
\`\`\`

Only use JSON format when recommending products. For questions or greetings use plain text.

LIVE CATALOG (${(products as object[]).length} products matched):
${catalog || "No products matched yet — ask the client more about their project."}`;
}

export const onRequestPost: PagesFunction<Env> = async ({ request, env }) => {
  const cors = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
  };
  const json = (body: unknown, status = 200) =>
    new Response(JSON.stringify(body), { status, headers: { "Content-Type": "application/json", ...cors } });

  try {
    const { messages } = await request.json() as { messages: Message[] };
    if (!Array.isArray(messages) || messages.length === 0) return json({ error: "No messages" }, 400);
    for (const m of messages) {
      if (m.role === "user" && m.content.length > MAX_INPUT_CHARS)
        return json({ error: "Message too long — please keep under 500 characters." }, 400);
    }
    const trimmed = messages.filter(m => m.role === "user" || m.role === "assistant").slice(-MAX_HISTORY);
    const firstUser = trimmed.findIndex(m => m.role === "user");
    const clean = firstUser > 0 ? trimmed.slice(firstUser) : trimmed;

    let systemPrompt: string;
    try {
      const all = await fetchProducts(env.AIRTABLE_TOKEN, env.AIRTABLE_BASE, env.AIRTABLE_TABLE);
      const intent = extractIntent(clean as Message[]);
      const matched = scoreProducts(all, intent);
      systemPrompt = buildSystemPrompt(matched);
    } catch (err) {
      console.error("Airtable fetch failed:", err);
      systemPrompt = buildSystemPrompt([]);
    }

    // Build messages for Cloudflare AI (Llama format)
    const cfMessages = [
      { role: "system", content: systemPrompt },
      ...clean.map(m => ({ role: m.role, content: m.content }))
    ];

    const aiResult = await env.AI.run("@cf/meta/llama-3.1-8b-instruct", {
      messages: cfMessages,
      max_tokens: MAX_TOKENS,
    });

    const text = aiResult.response ?? "";
    if (!text) return json({ error: "TileAI is updating. Please retry." }, 502);
    return json({ text });

  } catch (err) {
    console.error("Worker error:", err);
    return json({ error: "Unexpected error. Please try again." }, 500);
  }
};

export const onRequestOptions: PagesFunction = async () =>
  new Response(null, { headers: { "Access-Control-Allow-Origin": "*", "Access-Control-Allow-Methods": "POST, OPTIONS", "Access-Control-Allow-Headers": "Content-Type" }});

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
