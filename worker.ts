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
  WEB3FORMS_KEY: string;
  SENDGRID_API_KEY: string;
}

const ALLOWED_ORIGINS = [
  "https://italgresorlando.com",
  "https://www.italgresorlando.com",
];

function getCors(origin: string) {
  const allowed = ALLOWED_ORIGINS.includes(origin) ? origin : null;
  return {
    "Access-Control-Allow-Origin": allowed || "null",
    "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
  };
}

const SECURITY_HEADERS = {
  "X-Content-Type-Options": "nosniff",
  "X-Frame-Options": "DENY",
  "Referrer-Policy": "strict-origin-when-cross-origin",
  // Prevent MIME sniffing, clickjacking, and control browser features
  "Strict-Transport-Security": "max-age=31536000; includeSubDomains; preload",
  "Permissions-Policy": "camera=(), microphone=(), geolocation=(), payment=()",
  // CSP: only allow resources from own origin + trusted CDNs used by the app
  "Content-Security-Policy": [
    "default-src 'self'",
    "script-src 'self' 'unsafe-inline'",   // Vite inline scripts need unsafe-inline
    "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
    "font-src 'self' https://fonts.gstatic.com",
    "img-src 'self' data: https://v5.airtableusercontent.com https://dl.airtable.com",
    "connect-src 'self' https://api.web3forms.com https://api.airtable.com",
    "frame-ancestors 'none'",
    "base-uri 'self'",
    "form-action 'self' https://api.web3forms.com",
  ].join("; "),
};

const CACHE_KEY = "collections_v1";
const CACHE_TTL = 300; // 5 min — keeps Photo attachment URLs fresh

// ── General-purpose rate limiting (in-memory per isolate, resets on cold start) ─
// For production-grade rate limiting use Cloudflare's rate limit rules or Durable Objects
const rateLimitMaps = {
  chat: new Map<string, { count: number; resetAt: number }>(),
  submit: new Map<string, { count: number; resetAt: number }>(),
  download: new Map<string, { count: number; resetAt: number }>(),
};

function checkRateLimit(bucket: keyof typeof rateLimitMaps, ip: string, limit: number, windowMs: number): boolean {
  const map = rateLimitMaps[bucket];
  const now = Date.now();
  const entry = map.get(ip);
  if (!entry || now > entry.resetAt) {
    map.set(ip, { count: 1, resetAt: now + windowMs });
    return true; // allowed
  }
  if (entry.count >= limit) return false; // blocked
  entry.count++;
  return true; // allowed
}

const CHAT_RATE_LIMIT = 20;      // max requests per window
const CHAT_RATE_WINDOW = 60_000; // 1 minute window
function checkChatRateLimit(ip: string): boolean {
  return checkRateLimit("chat", ip, CHAT_RATE_LIMIT, CHAT_RATE_WINDOW);
}

const SUBMIT_RATE_LIMIT = 5;       // max form submissions per window
const SUBMIT_RATE_WINDOW = 300_000; // 5 minutes
function checkSubmitRateLimit(ip: string): boolean {
  return checkRateLimit("submit", ip, SUBMIT_RATE_LIMIT, SUBMIT_RATE_WINDOW);
}

const DOWNLOAD_RATE_LIMIT = 30;      // max downloads per window
const DOWNLOAD_RATE_WINDOW = 60_000; // 1 minute
function checkDownloadRateLimit(ip: string): boolean {
  return checkRateLimit("download", ip, DOWNLOAD_RATE_LIMIT, DOWNLOAD_RATE_WINDOW);
}

// ── Input sanitization ────────────────────────────────────────────────────────
const MAX_MSG_LENGTH = 500;  // max chars per single message
const MAX_MESSAGES   = 10;   // max messages in conversation history

function sanitizeText(s: unknown): string {
  if (typeof s !== "string") return "";
  // Strip null bytes, control chars (except newline/tab), trim whitespace
  return s
    .replace(/\x00/g, "")
    .replace(/[\x01-\x08\x0B\x0C\x0E-\x1F\x7F]/g, "")
    .trim()
    .slice(0, MAX_MSG_LENGTH);
}

// Prompt injection defense: block known jailbreak patterns
const INJECTION_PATTERNS = [
  /ignore\s+(previous|above|prior|all)\s+(instructions?|prompts?|rules?)/i,
  /you\s+are\s+now\s+(a\s+)?(different|new|another|evil|dan|jailbreak)/i,
  /pretend\s+(you\s+are|to\s+be)\s+(a\s+)?(different|unrestricted|evil)/i,
  /system\s*:\s*(ignore|disregard|forget)/i,
  /(act|behave)\s+as\s+(if\s+)?(you\s+(have\s+no|are\s+without|without)\s+(rules|restrictions|guidelines))/i,
  /\[\[?\s*system\s*\]?\]?/i,
  /<\|?system\|?>/i,
];

function containsInjection(text: string): boolean {
  return INJECTION_PATTERNS.some(p => p.test(text));
}

const F = {
  name: "Name", brand: "Brand", collection: "Collection",
  color: "Color", application: "Application", finish: "Finish",
  size: "Size", thickness: "Thickness", sqFtPerBox: "Sq Ft Per Box",
  stockQty1: "Stock Qty 1", stockQty2: "Stock Qty 2",
  price: "Price", productPhotoUrl: "Product Photo",
  specificMaterialStyle: "Specific Material Style",
  visualLook: "Visual Look", colorGroup: "Color Group",
  finishAndFeel: "Finish & Feel",  // ← correct Airtable column
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
      const color = str(f[F.color]) || "";
      const finish = str(f[F.finish]) || "Matte";
      const visualLook = str(f[F.visualLook]) || str(f[F.specificMaterialStyle]) || "";
      const category = deriveCategory(visualLook, finish);
      const size = str(f[F.size]);

      // Read Finish & Feel and Color Group directly from their Airtable columns
      const finishAndFeel = str(f[F.finishAndFeel]) || finish;
      const colorGroup = str(f[F.colorGroup]) || "";

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
        finishAndFeel,   // ← now reads from "Finish & Feel" column
        colorGroup,      // ← now reads from "Color Group" column only, no fallback to Color
        sizeAndFormat: str(f["Size  & Format "]),
        thickness: str(f[F.thickness]),
        visualLook,
        specificMaterialStyle: str(f[F.specificMaterialStyle]),
        thumbnailUrl: (f["Photo "] as any)?.[0]?.url || str(f[F.productPhotoUrl]) || "",
        // All lifestyle/installed photos from Photo attachment field
        photos: Array.isArray(f["Photo "]) 
          ? (f["Photo "] as any[]).map((p: any) => ({ url: p.url, filename: p.filename || "" }))
          : [],
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
    const url = new URL(request.url);

    // Only allow known query params — reject anything unexpected
    const allowedParams = new Set(["refresh", "token"]);
    for (const key of url.searchParams.keys()) {
      if (!allowedParams.has(key)) {
        return new Response(JSON.stringify({ error: "Bad request." }), {
          status: 400,
          headers: { "Content-Type": "application/json", ...CORS },
        });
      }
    }

    const forceRefresh = url.searchParams.get("refresh") === "1" &&
      url.searchParams.get("token") === env.REFRESH_TOKEN;

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
    return new Response(JSON.stringify({ error: "Failed to load catalog. Please try again." }), {
      status: 500,
      headers: { "Content-Type": "application/json", ...CORS },
    });
  }
}

async function handleChat(request: Request, env: Env, CORS: Record<string,string>, clientIP: string): Promise<Response> {
  try {
    // Rate limit by IP
    if (!checkChatRateLimit(clientIP)) {
      return new Response(JSON.stringify({ error: "Too many requests. Please wait a moment." }), {
        status: 429,
        headers: { "Content-Type": "application/json", "Retry-After": "60", ...CORS, ...SECURITY_HEADERS },
      });
    }

    // Validate body size (prevent payload bombs)
    const contentLength = parseInt(request.headers.get("Content-Length") || "0", 10);
    if (contentLength > 20_000) {
      return new Response(JSON.stringify({ error: "Request too large." }), {
        status: 413,
        headers: { "Content-Type": "application/json", ...CORS },
      });
    }

    let body: unknown;
    try {
      body = await request.json();
    } catch {
      return new Response(JSON.stringify({ error: "Invalid JSON." }), {
        status: 400,
        headers: { "Content-Type": "application/json", ...CORS },
      });
    }

    const raw = body as { messages?: unknown };
    if (!raw || !Array.isArray(raw.messages) || raw.messages.length === 0) {
      return new Response(JSON.stringify({ error: "No messages." }), {
        status: 400,
        headers: { "Content-Type": "application/json", ...CORS },
      });
    }

    // Sanitize + validate each message
    const sanitized: { role: string; content: string }[] = [];
    for (const m of raw.messages as unknown[]) {
      if (!m || typeof m !== "object") continue;
      const msg = m as Record<string, unknown>;
      const role = typeof msg.role === "string" ? msg.role : "";
      if (role !== "user" && role !== "assistant") continue;
      const content = sanitizeText(msg.content);
      if (!content) continue;
      if (containsInjection(content)) {
        return new Response(JSON.stringify({ error: "Invalid message content." }), {
          status: 400,
          headers: { "Content-Type": "application/json", ...CORS },
        });
      }
      sanitized.push({ role, content });
    }

    if (sanitized.length === 0) {
      return new Response(JSON.stringify({ error: "No valid messages." }), {
        status: 400,
        headers: { "Content-Type": "application/json", ...CORS },
      });
    }

    const clean = sanitized.slice(-MAX_MESSAGES);
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
    return new Response(JSON.stringify({ error: "Something went wrong. Please try again." }), {
      status: 500,
      headers: { "Content-Type": "application/json", ...CORS, ...SECURITY_HEADERS },
    });
  }
}


// ── Client confirmation email — single source of truth, generated server-side ─
const LOGO_B64 = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAABdAAAAHPCAYAAABTBPjMAAEAAElEQVR4nOz9eZwkV3UnfP/OvTcil6re1KAVrQiBBEISi20BQiAWe4wNNrZnPPbMvM+89tizPWOP7deP7cEej/cFr8/HMwzGGwa8MGBkwEbISIhFgFbQijbUUkvqbknV6u6qXCLi3nveP25EZFZ19SJ1V1dV9+/7+aRSXZWVFZmVEXHj3HPPkdFoBCIiIiIiIiIiovVKBRBNt8RApflehGqAiMLUjzMqELEADIIKQghQAZwKxChk8kRQI4hqAQBR669LhIFARCEAtLJwzvUV1bDwBSAWzjkoDHxVwdr0OKiZ2rYIFQ9FhFEHwKz8G0VEz5owgE5EREREREREROubAdSkIHUdmIZEaP09a3rQEKHRQzWkoLoYBGRQsb0sN92o5TPiYwqOKxCjB2BgjEGoA+gidVQeEaIKxABVgbgeqhCNGjVZ5pxBOfZVBRcMOq6DGAKAiCBoA/uCCINQP5uFMoBOtCa51d4AIiIiIiIiIiKio0EBoM081/aLGiJiFIhaiE1Z5h4KGDtjjZmp4vhJqxUE1Raj4ZQc1SXGikL9mYjhFKh2F/+muAkiYxgZQ+yuGNT18v4/RTNzYxFK70NAZiwyARBGMOoQBVAx9TZGiAI2pg2OjJ0TrVnMQCciIiIiIiIiouNAikKrxPYrbQxdBQILGAMRICAgaCrtAvHOanVKZv05eRz+c4z3/heM9wKj3cD8UygXdgN+DESP6KuUQW4dXJYhy7tA7oAtJwHdLYA7A9Gc/Luabf5F4zrzouNzvPebjMkfCMiGpfQQBH0j1dBqRMen7avMJDOdiNYWBtCJiIiIiIiIiOi40Aah63IuogZAhFiDqAqvgKrCSoAzFTIdvVnC4PtgRm/B/K5zRzsfwZ6dD0P37UQ3DpHrADaMkGkF1ap+agHEQp0BjAOcwThGVG4TulsuwuzplwAnnQvY/seh2oXNvxrN7F9U6N7t0UMQ0zcIQ6sRLhqIAsHERYF/Ilo7WMKFiIiIiIiIiIjWPRUgSgTUwMCkei4qgBiEGBEM4BVi4bVrqhmjC/8S48f/GPPbMb7nc8DCTlSDPegV83BhCKdjOPEw4qGhglhAjINaAxUDrxEhAjFGdDOLDB0UT34Dux64AXbr6dj0gou+M3vBJcDmF0UpwxnG4G5jKgBmaOpmokFSI1JmnxOtXcxAJyIiIiIiIiKidU8FaHK4mwB1U8LFS4AxgBVFHgcvkWr3b2H+4e/0j34Vg8duw8z4Mej8DvhqjNworHigGkPVQ3Lb/AbEpoa5MVARqABGAOsBwABZD6HTx1AdRnYLsq0vQf+US9B54esAc9K7vd3wh14621XzdvsEzD4nWssYQCciIiIiIiIionUvxgiIhYhAUSFAYU0GEYsYBBIL9M34AlS7PozHb335Mw99Cbr7AczEOeh4J7I4BGKAQQA0QDQCIqkpqRFEGIgIUq31FPBO/wYQ032wHpVxAHLA9iFuA0p7EqqN5+Okb3oH0H/J18r8tFcGOxPGw+LUTZ1sZ/AlorFQ7N9JVFUX/x4iOuYYQCciIiIiIiIionUtxgjnHDREBI2wmUGUiDIqJCoyFfR09CrMb7t5/NgtKB6/CW7hYWTFU9DRU3AygtECgKbgOWIqASNAqt3SBM7bIuv112L6ugogiiCpyajEDAYWYi2i6WMhfx5GGy/A5pd8Ozqnvwqhc8Zl0cx+NRYVrM0QVA5YxkVVGUAnWkWsgU5EREREREREROuaIMJIgCIAGiGaQ9UiRj/Tsxh03fg1ePK+L1aPfhn+8dvQ2Xc/OtUcJIwQ4xBiSig8RGMq+9IEzxUAwuTfSIHuNqCtACQgmGY7ABMEEgIgEYgBsAEOI+SDEebvH8KFOdjT3ni7zc76nrHb/NFBNMhNeg3LvjYGz4lWFQPoRERERERERES0jkUYJ/C+goPAWYvKK2L06DoddM34DZi7//p9274A/+iXMDN+FJ3qKWC8F+pLGFGoRJgm63w6gN7cADTBc0BTVnjz5brOugpg25+tM9ZFAAnoSAFTVqj2eTxzb4UtZQ57fveDDu7lmm18ADG2z0NEawsD6EREREREREREtK6JCKoYThLrdjsRSIiYMQaC4hzs2X793gdvgO6+Hd3qAeT+SaAcAr5ACnIDEqezv01blQViEQVow+WSyrtYbaLm6c5G1Onn9Q2KCEEUCxWFjQJTjtCPz8D4R7D3G9dhk7Ndd/Yb7lSEqyL6NyqyY/NmEdGzsn93AiIiIiIiIiIionUkqkKM3a3GwSuQCSAuzGDhiVurbbfCPHMfOsNHkfs5SJgHMAasQhwm0bE24zym27IMoEvCabrk/xVIyewBqgExBmiIyPMcMpzHDPYhG27DrnuvBXbd0sni0x/IULz0qL4hRHTUMAOdiIiIiIiIiIjWLRUDHz1s1ocPFiZU6NhiBqOdH8ETt55UPH4zeuPH4QdPohoPoBIhooBVmFCXY7EpKC5AqoGOuia5xpRdblJ6uaoBYKGwkCZyLhFBAIMIiZPMdKsKkRKmjreHYQmbAXHhGfRmMojtYs+9n8bmDRvPNbMbvht29u5j+LYR0WFiBjoREREREREREa1rGgUCCx/xfEEEZOHb8cx93zp64nbYwTZgfju6foieMzAiqBSANTCZa5t0plItS5+4uVdAQ7qPClVBVDO5pTamAGxd+yUxBrAGsGYSgjNWIcU+uOFjcHN3YeHWTwLh6V/uhIXLLCqoRKhMnkYUEDUQTfVhtA3npd96oOajRHR0MIBORERERERERETrlmjK/nZQWI1P9fJqE8pH/nb4+Fdghttgxztgq91AOQ8UY5hK4cQhqCB6BWBgILAQGEiKljXlXNqa5k0sPQKiEISpm8LFCBMDgLC4+aimLyFEWJv+rRqBWCAL+9D3O6BP3QHccz0Ec7+XxdEbAwKCMwhioCHCiYONBkYNFBZRTF2fPcIgwCAwiE60ghhAJyIiIiIiIiKidS13HcRQwegYqPb8O+y8F2HfNuh4F6zfC9FxyiAPOinRIhYi0magS5ttPh0BT7fFmelxv1vKBG8opv6xhKn/62HjGCYuoFPNYbjjDmC4/UrEwTtzZ1FV1Qws0Ol08rIYZUYhzZPulyVPRCuKAXQiIiIiIiIiIlrXRAGtSvRt6CHM/7vB0w+jWtgJX+xB8KOpR6YyKwLAahP4TnXQVeWAt0Wp6MvRpc1Fm+B7/e0m6h1TAF9VEWMEYkQMIwz2PQw89jXAD9+ZAxssdKA+IGpZGoMqmqhtOrv4+kkdoHXJmKWNTYnoqOHeRURERERERERE61qMgNWwSUxxGfY+eoGffwKmfAYSFmBNhVR6RQCxAAAbm4zzCEicZJ8fLbr/Ey7zJagqoCMYfRpPPHIrEAen63jw0twIoAHee2R52uYoEdH4tM0AJkF9d5Q3noimMYBORERERERERETrmoggs5hFMff7+x65A1h4DKacg9MBrKkj102WtppU3jwG1EXJ62cxR3DD5He0v0dTrFsFGptflbLdU2PQettRwcYnocNHgYUdkGr4vSZUJjMCZwQh+LqxaETKQA/t74pw9e9jiI9opXDvIiIiIiIiIiKidU01AMafitHTry52P4zMP4M87oPTMWIo0oOaiioSgaBAlKmC4k3QWxbfH7aDlXfZP/V8uva6NR4We9GVZ7Cw7Q4gL8/PJVzU/FwTh29/dvrpVCZNRYloRTCATkRERERERERE658fvxaDHciqZ9Dx8+jEAlAP7yuoeqTmnnFxQFtTTXSoQKJA1Cy+P5zb0iB887xTdcmNWRzhbuqqiwISA/LokYV57N15L+Dn3gEtL0IUaFBYk63QG0ZEh4MBdCIiIiIiIiIiWscijBMgDN+Bfbvgyj2IC3sgvoSFwhggQBHbJpwRgKQGnKgbcS4qxTJ9fxihs8NM/24yzpv4vdb/YxSQCsjDGLk+A+zZBpSjb++4jjOSQ+vtUwGMNs1J65IuR714OxEtxQA6ERERERERERGtayGWQMc8Ndj9OEw1DxMqQAWhihCxgAjUKNQoUjHy1HxTYaGYDqAvV9dcDvD9qcdpXUtdpb7V/45Sl4qZ1FqXqXi71o/JJUMceZjq6RRAt7EfAzw0A8RB2+1xME1muzQNRZsbEa0EBtCJiIiIiIiIiGh9MwqE0VtRzcPGMaxGQAxEDKICgGkzvlMt9LrEito6iL5ciMwsW798+cctzUJ/NiE3A3iLLAIuzAPFHIBwiteIqCKx7hk6KQvTPHfTWJTBc6KV5FZ7A4iIiIiIiIiIiJ4ziRBEh2KwJZQD5Fqlr6uBCKAaAWjdQzRikjluUw9RBYCw//OqYhKsPoxAehNEb8uqGLTB7Zi+J7JMuRcVIKZgv41jlKPdyI3mUQUG0kk563GUntrUP9IEzSNUmB9LtJIYQCciIiIiIiIionVNNTy/KoeI5RCiZQpYS92oUwSisQ6FL5MtLnH/+PjSzPPDykRvHisHrk3eZsEvDaQLDAQmVvDjAfI69i4CAXScHlEnzzc11NunaCYFiGglMIBORERERERERETrm8ZNiAHQCoKACIWJQHQGBhECwMQ6Kq2TILpIQNQAga3LozSWyUhfVpMJbpb8+1mQVJddJQX5g9fU41Qi1MRRjLFufLr/72uyz9lLlGjlMIBORERERERERETrlqR4szgBIB6qATAKjalJpzECEwygU+Vb1ABQKCoIIgRNo1CkLPFlKq0cVUsy0aMpUy322Ku3TzsBARaAwgOwwGQLEdrXgKngOhGtBK7vICIiIiIiIiKidc3ALIixMFDE6CGiEBGoBpiU4D1pwtk244wwCIAEtJndh12q5XCbd043/VyGKiIC1HhEeKgKnO0CKoVKhKIEEADx7e8UbTLOpycDiGilcA8jIiIiIiIiIqJ1zcKOYHJEWAQFxDjAGJioSKVd6geKQUovXyZQ/mzqnO8npJs2Qe2U1x7bTHaDtmPpJAIOKGAUEDGIYhCQQWwOqNkrIohGoFagonWm+SRw3zxFlEME6YnoiHDvIiIiIiIiIiKidczAR/s0upt3aTaDEjlUDVAGWNMBPAAjgBVEE6FG0QShIzIoslRLXGRyO5Tpx0qss9jrAHrMEMVBxUCbIHrUFKCvs+FVkSLgCiAaaHRQ7ULcDCRts+vYHEOvL/EuA1QgmnqjqqCu6x5RF0tfofeViAAG0ImIiIiIiIiIaD1Tk5qAwu6ynVlEm0HhAJOnwLVxKel8Os4sQFv+RN3iMiiHk4l+oMdIbFPDpxPNF//s1H29TVYMjDhU6CKbPRlw2T2+rJC5ztdjrLcV6T5ltTeZ6OmXsIco0cphAJ2IiIiIiIiIiNY3I4CxO/obNgOug2gs4BwCHGDrAHoMMNFAggEEdSA6ZXZLmyH+XELRFoADxCHaCsGNYNTDaITRAKMBaiKCMVDNoJpBogXUpu1yAQhjaKwwCB1g61kAsvtVFbmxcMFA1MAsU+s8SoRKZCNRohXEADoREREREREREa1bKkCAAmJ3uS2nIZoNUJMBIgjGpDacTZ3wKEBMmecqTQPOg5RAOVhJlzbgbgBkUBEEo4iiqaTLVMmWOlccsa513vzeKAZah+dUAXS3AlvPgQbt2czB+Ai7qGlow0AFKXh+WM1Miei5YgCdiIiIiIiIiIjWtZRNnt2PzWfBZyfBwyKoB5wiQBHUICLDJBRmU1Y3ALNc1rk25V0OnZUeoQgQeEhdnxyY1GkxKdO8+apUgFSA8XVUPAc0A5wgSgcbTnsx0Dv5y951PwkAqAJcBIyaRWHyOPV/kdnnRCuKAXQiIiIiIiIiIlq3VABYgyDZHeiegWzTufC2Cy8Btr6l2uEGgEMKaiuMHr3s7VRKZarueVvnPBVftxBI0/hTImC0DvqbVK89dlCYWWw646WIZecryDtfD6FCJgZGm6cyk8A+0JZuMWAWOtFKYgCdiIiIiIiIiIjWNQVQSu/jcGf+25PO+iZgdjNMx8L4gDwCKVPbIMKkkiwaAXhAAqI5dPBZVbC0hMrk37EtpZIFgQmYSkDP0g2AFcCadN/8RqMegGCkGyGbzgOedx7G0vtEVBsBQI1ARBBMrKvBOKik8i0AIKqQ51S3nYgOFwPoRERERERERES0rqkKFBngtv45Tr94oLMvgPaeBx8VQIRRQFTqrG0F4NvSLAcLP6sqtHncQQLVqnXN82jTDQIYhZq4uE55UwwdNmWnS4AXh6J7GrLnvwyYOf39WXfTPwUPWJvK0FTw0LrpqYq0GeiSpgNg0NRIJ6KVwAA6ERERERERERGta6qCiBxlsEDn+T/YP/WVGNgzIDMbAStw0oH4CEUJmLKOOguCAFUMdTmV/ZuFisii2/5SCNvBwqm0TUOb51IJUAkpwh3qL3tAfA5jcvjoEbtdjGbOw+wrvxOQ/idDNLBioCFCrUElispEBBP3a3pqImDiQZqgEtERYwCdiIiIiIiIiIjWLzUwsLAwkMzlsZSQnfsauOdfhgXZBGR9hDLCGQuXW0BKIJSAesA6WJdjueD54TIK2FTWfGqbUua7IiAgwEcAHQd4AK4DMQaFV9jZk/BU0cOG8y4Heme+10v3UzHGpisqIhRqAZXY0XYT6wx0BYxKyq5/zltPRIfCADoREREREREREa1bAgAhwoog+FEZXX4jZs5/7YZz34DR7HlYsCfBdDYAIQLlCEAAbIQaIESBqlnybFPh6KmmnQekSDXVY/2PpkyMphrlBoCYHKEUQAwQKgRTILgcCzgFG15wBWbPeS3gnvdzXt0+xBSJF7Hw6qFmmcz4RU1DD2Mbieg5495FRERERERERETrW1Ro9DCIENfZXVadG/G8Cz+84ZzXY9g7B0W+EWpzRHEABLAAbIQoECs58gC0IgXN2xrriSigUaCSwcMC4uCNIOZ9jLPNGPdfjM0v+05g47n/ooidOUgGI00Avc5CjxGAqSZPm4LnKePd1LXRj2zziejAGEAnIiIiIiIiIqJ1LMI6QYweWZYhBIVahyCzfzJ7/pvRfcHrsTfbjHF/I5BvQUAXVQxQeGQwyGCfRYCsads5pQmat/eY3Op66MFHdDo9VIgpeO42opo5D1te9G3A1lf8RcTs31YesGIgsAAMRCwsBFYjbDTRRgNIhEBhNG1HECAKw3tEK4l7GBERERERERERrWsRATZzGFclYA3EGATTvRb9F3zbxvNfg+z0izHobMW+kENdDy63CEERywrWmDrQfQSaBqP7VYCxEBE4G1BVIxjXxbjqYwGnY+t5V8K96HXbNdv646XJIKKpWalqaooaAGcFDgIbDYwaSF1bvclGV0lBdGagE60cBtCJiIiIiIiIiGjdUgGCKqIReI3GGCCWBTKbxypmt2DL2X940kveCHfay+F7GxAzC7E9ODUwIQCxAhbVFH92ohgEYxBNHWZTACb1AU0Z4gprS8RqDGO6sN0X4KQzroI7/63AzKnfPco7e2ACrFQQDdAoEGMRY4RTqRuUGpgoKcsdsS3fEgQI5ki2nogOxa32BhARERERERERER0Jay2KonAbZmaePx4NdjgRxKiA7c9VVfXh7NSLX7w5FN86lAqDx29FMXgSG7pdwFXAeAy4/UNkcVFW91QOqkQABkYnYeuI/bNUjQBRBFEEhQrMxufhGf98bDnrtZDLvguYPe+1o8LdGqzCGoECCCFAjYN1ZsZ7HagqUDcijc1vkrhf2RZmyBKtHBmNRqu9DURERERERERERM+JChDrELPVCMFUg00YQDxyGb1E8MwvYu7ef7Hw0BcweuxWdEfbMVM9DVMOgJgBKojqU/NOKykCDklNPI2BqtYlVAAgQBDrRp8RXiKsKEyMKdJdZ6GrAcZmBqPO8zFwZ+K0C78d7oI3ATjt/wfZ+Dfo9XdXZTWIVus+pKYux5JC4gJfv0hXfz2F0ZsSLrHOPrdHWoKGiA6IAXQiIiIiIiIiIlrXtA44G00Z2kZTUF3r4gshVujY8UaHfT+F4SM/j0e/gme+8SXEuQfQC3uRlQNkOinl4jWk5xVARFLwXASmKXAuvv5diqCAjwprBU4B1D8bTRdjtxF7zfNRbDwf57zme4BTX3W7lhvfI/lJ74V0tpTDco91ot4KVFiIhWgtYgCdiIiIiIiIiIjWuTpjWyNMU+xEAIWDwkCscwilz+Jwg5XBv0C1648x9w2MHrkLxRNfQ2fPXej5OUA9VD0gESIKoKk7jrpRqKDtOKqhDpY7INuIqiiQSQF0OkDIsTduRnj+Zei84Jsxc/7rgc1n//MQO18cR7O30+0PQhAUhWa9Xm6D92OIP9ZvGhEdBgbQiYiIiIiIiIhofVOXgt5tAD3VCdc6Cz0o4JxzEisvxcIpuS0uhylegfmnfx5P3YXxA5+GLDyM4fwzCOUAGUp0TYBBBQklHACtM8sBAGKhRiDWIkoH+8YONu/BCRBMDvROxczpl8Cc90bg9Mt+GdkpvzQsxBtrYZygKEeAMXBZv1NVocgklYQhorWHAXQiIiIiIiIiIlrfpgLoKWM8BaMVBioGQS0gBlYMDBSIY5jokYm/ADL/r1Dt+Hk8/RD2PPYAFnY9DAx2oBfm0Yvz6MQRTKgg0JSFLg4lHEoIKgVK5Mj6WzHUPrKNL8DJ574CcsbLge4pH4TOfhjo3VZGLSTLnzR5hghF6QsYY2CMQfQBInZ13z8iOiAG0ImIiIiIiIiIaJ2blHBZFEAXAGpgXIbSR6gKrHMwIgihgmqAE4+uKy5HXHgnwvBtGD19IeZ3AHseA/bsRBzvQxjsg68KFKVHGQHJe+hs2Ijeho1wvQ2QbAPwvLOBzecCsuWPq7DhvZJtvsXa7OTow5PWaseX46ICAGdhrcDHCoKALOvAV9q+BiJaWxhAJyIiIiIiIiKi48TiMijSfDVGWGshIggxImhEFECMgSAiluOX5VZ9x1qFVOchFJdBqwug4VSIdhDDqekJZTz15ArVHlTGyPofhzf7guQ3Rdf9fDC5xmAAH4CosApYa+HybEul8ZmiGIk4VeeAUMW+kc6QAXSitYkBdCIiIiIiIiIiWueW1g+fBKNFAasRqnXzTyOpwagRBChUFbnNgZj+P0KhGiAiyz5f8/tENJV1ARCiwBiHCEBVEKEwBhBEGEUKohuDEAJUFdY5RASE6GGtBYJZ5ncQ0VrAADoREREREREREa1rKWSdqBhAU0BaNGWhW60D2XWgPQoQJD1WYTDJVW+eJS5p6rl/AD39rqZhaXqMjQ6ipv2eNxHR+PRdVXVR0ve1rs0uzbNHiIKI1iC32htARERERERERER0pERNW/M8SgpiGwDQFBZvgtwNo0Cs/60wiBJhIAC0DadPgtqx/llTB83N1NcmzydtoD4F6EUBE522AXmdbFdUwMCkUjJTwX0iWlsYQCciIiIiIiIiovVNHQCTIuUyyQ6PiIDUX9bpgHgTbK8bjSKkLHAAi7LP28T0FDDXqaouzf+LGrjo6u9HeOPbx1h1kGjSg0WRguQRsc5cd2oQl3luIlo7GEAnIiIiIiIiIqJ1zABqAQDSRsh9ilc3JVYAQEybHd6SSdZ3mwUucVLJpf0m2uzxSab4pOyKUdRZ7z59HQpRgYn186rpqKCMIto8Tf31lI3O4DnRmsUAOhERERERERERrWspwdsACABiahoqEYBOFUaJU4Hq9D0glVMRlTbZHLpc9ByATNUprwPzAoWKwJvYPpeLTTkX7Yp6UZhREBRRLLxJtc9FI0ydAQ/ROvucJVyI1iIG0ImIiIiIiIiIaF1rA9DSlF+JEE3Fz0UARcpQjzBt8BtIzTsTi0ld8xTZVhGIpvro0maf149Rs6jJaKwz2U00dVg+AoCPJvomjK8CGAjiVHxeRRdtDxGtPQygExERERERERHRupVqnQMQwGoqoWKgdYmUFBhXOEQIRFITUEEA4NHknSsctA2g188L1D/bBM+bHPVJ49DUGBQwkn5rFCDCwaeAum8z1dW3P5kam9Y12NvM88lzEtHawgA6ERERERERERGtc03j0Ka2eAp2T2qTC5ogtaiBQAE4QJqGn2bRvdb/aYLnKlL/LNBkqE83LRWtc9Ol+fmm0HkKshtEGMWiGuxNEZl2m4loTZLRaLTa20BERERERERERPScaVOmvG4EOqlnPgmM636NOg+nbMrBMsP3/3ld+vi6tItofT+1XftvDxGtRcxAJyIiIiIiIiKidW1xBndThxxTEevnWmP82f2cLH18uyFm8T8ZPCdaN1hgiYiIiIiIiIiIiIhoGQygExEREREREREREREtgwF0IiIiIiIiIiIiIqJlMIBORERERERERERERLQMBtCJiIiIiIiIiIiIiJbBADoRERERERERERER0TIYQCciIiIiIiIiIiIiWgYD6EREREREREREREREy2AAnYiIiIiIiIiIiIhoGQygExEREREREREREREtgwF0IiIiIiIiIiIiIqJlMIBORERERERERERERLQMBtCJiIiIiIiIiIiIiJbBADoRERERERERERER0TIYQCciIiIiIiIiIiIiWgYD6EREREREREREREREy2AAnYiIiIiIiIiIiIhoGQygExEREREREREREREtgwF0IiIiIiIiIiIiIqJlMIBORERERERERERERLQMBtCJiIiIiIiIiIiIiJbBADoRERERERERERER0TIYQCciIiIiIiIiIiIiWgYD6EREREREREREREREy2AAnYiIiIiIiIiIiIhoGQygExEREREREREREREtgwF0IiIiIiIiIiIiIqJlMIBORERERERERERERLQMBtCJiIiIiIiIiIiIiJbBADoRERERERERERER0TIYQCciIiIiIiIiIiIiWgYD6EREREREREREREREy2AAnYiIiIiIiIiIiIhoGQygExEREREREREREREtgwF0IiIiIiIiIiIiIqJlMIBORERERERERERERLQMBtCJiIiIiIiIiIiIiJbBADoRERERERERERER0TIYQCciIiIiIiIiIiIiWgYD6EREREREREREREREy2AAnYiIiIiIiIiIiIhoGQygExEREREREREREREtw632BhARERERERERERHR8UlVD/p9ETlGW/LcMIBORERERERERERERCuCAXQiIiIiIiIiIiIiomWs9QD5oTCATkREREREREREREQrYr0H0E3zAowxUFUoDIzNUPkIiF3lzQNCBBQGlY+wLkeEImhElmWZ9/6AP6eSbrS6rMvT31CQ/nYhwBgDUcBAIIpFt4lY32g5CrPsrfIx/f8hlsbQ+hBVIMYhxLQv+aDwIR2nxbj2775eiQhijHAuzeV679vP7no/udKR2/+8kDTnd+MsiqrcCiOIUJRludVaC1VdG58fsYBYhAgYm7X3UQVR5YD7ryBCeP6jNab5XB72rd4HVbXdJ6f3yxgjYoyLjvnTP7P030tv04wxaWwpMvl9zXYsGWce6EY0benneSljDEIIiDF9z1qbrqWj5/F7GfvtzzCLz4P1+bL5+vTPTJ/TvfewdvXjE7SyNHo4m/7+IYT2sxBCWO1NWxeszaD1NaQYh6Iqt7o8y0tf5cvFx3g+PL4c6vriQLfDfv6lY7Q6LtFc80wf15tjehPTMDY7YByruTUxjhBTLARi2+ePKjA2a5+7iVc340ljzLMfrz7L90GGw2H7S/M8R1mWcHkGAwvVsOoHKmMMxBrEACjStqgqENMbdCDNwYEHgdXlY4BzDtZaxBhhkAJmvqzQ6XSw3CSIyvQHd/0GB1eawrQHi06ngxACmuCREV31fZeOXIho/6bTsiybGQ6HI+dchMR1e5xrAugxRmRZ1l6QGmNQFEWWZVm12ttIq6f5XC8d7Df/DiGdX9qxQJwc94wxbWBjtYQQ4LIOgDTGaj7vAOCca/9/6WCt+fd6nhyj48+zDQqGmI7xzf7Zft7ri64mCHag4HizzzSB8aWTYjHG9rmbQOb04xEVkAjo4e1HTLqhaUs/70uPx83nUUTa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";

function buildConfirmationEmail(formType: string, data: Record<string, string>): { subject: string; html: string } {
  const isQuote = formType === "quote";
  const eyebrow = isQuote ? "Material Selection Request Confirmed" : "Showroom Consultation Request Confirmed";
  const subject = isQuote ? "Your Material Selection Request — Italgres" : "Your Consultation Request — Italgres";

  const rows: string[] = [
    row("Name", data.name || ""),
    row("Email", data.email || ""),
    row("Phone", data.phone || "Not provided"),
    row("Project Type", data.project_type || "Not specified"),
  ];
  if (isQuote && data.selected_materials) {
    rows.push(row("Selected Materials", (data.selected_materials || "").replace(/\n/g, "<br>")));
  }
  rows.push(lastRow("Notes", data.notes || data.message || "None"));

  const nextStep = isQuote
    ? "We will review your selected materials and reach out within <strong style=\"color:#1C1A17;\">24 hours</strong> to discuss the details, answer any questions, and set up a meeting at your convenience."
    : "We will review your request and reach out within <strong style=\"color:#1C1A17;\">24 hours</strong> to discuss the details of your project, answer any questions, and set up a meeting at your convenience.";

  const html = `<!DOCTYPE html><html><head><meta charset='UTF-8'></head><body style='margin:0;padding:40px 20px;background:#F0EDE8;font-family:Helvetica,Arial,sans-serif;'><div style='max-width:600px;margin:0 auto;background:#fff;border:1px solid #E0DDD8;'><div style='height:4px;background:#f39b34;'></div><div style='background:#F7F7F7;padding:48px;text-align:center;'><img src='${LOGO_B64}' alt='Italgres' style='height:80px;width:auto;display:block;margin:0 auto;'></div><div style='padding:48px 48px 36px;'><p style='margin:0 0 8px;font-size:11px;letter-spacing:0.18em;text-transform:uppercase;color:#f39b34;font-weight:600;'>${eyebrow}</p><h1 style='margin:0 0 28px;font-size:26px;font-weight:300;color:#1C1A17;line-height:1.3;font-family:Georgia,serif;'>Thank you, ${data.name || "there"}.<br>We will be in touch shortly.</h1><div style='border-top:1px solid #E8E5E0;margin:32px 0;'></div><p style='margin:0 0 16px;font-size:10px;letter-spacing:0.18em;text-transform:uppercase;color:#9A9690;font-weight:600;'>Your Request Summary</p><table style='width:100%;border-collapse:collapse;font-size:13px;'>${rows.join("")}</table><div style='border-top:1px solid #E8E5E0;margin:32px 0;'></div><div style='background:#FAF9F6;border:1px solid #E8E5E0;padding:24px 28px;margin-bottom:32px;'><p style='margin:0 0 12px;font-size:10px;letter-spacing:0.18em;text-transform:uppercase;color:#f39b34;font-weight:600;'>What happens next</p><div style='display:flex;align-items:flex-start;gap:12px;'><div style='width:20px;height:20px;min-width:20px;background:#f39b34;border-radius:50%;text-align:center;line-height:20px;font-size:10px;font-weight:700;color:#fff;'>1</div><p style='margin:0;font-size:13px;color:#5A5650;line-height:1.7;'>${nextStep}</p></div></div><p style='margin:0;font-size:14px;color:#5A5650;line-height:1.8;'>Questions in the meantime? Simply reply to this email and we will get back to you.</p></div><div style='background:#1C1A17;padding:32px 48px;text-align:center;'><p style='margin:0 0 16px;font-size:12px;color:rgba(255,255,255,0.25);'>italgresorlando.com</p><div style='height:1px;background:rgba(255,255,255,0.08);margin:16px 0;'></div><p style='margin:0;font-size:10px;color:rgba(255,255,255,0.2);line-height:1.6;'>You received this email because you submitted a request at italgresorlando.com.<br>This is an automated confirmation — our team will follow up personally.</p></div><div style='height:4px;background:#f39b34;'></div></div></body></html>`;

  return { subject, html };
}

function row(label: string, value: string): string {
  return `<tr style="border-bottom:1px solid #F0EDE8;"><td style="padding:10px 0;color:#9A9690;font-size:11px;text-transform:uppercase;width:40%;">${label}</td><td style="padding:10px 0;color:#1C1A17;font-weight:500;">${escapeHtml(value)}</td></tr>`;
}
function lastRow(label: string, value: string): string {
  return `<tr><td style="padding:10px 0;color:#9A9690;font-size:11px;text-transform:uppercase;width:40%;">${label}</td><td style="padding:10px 0;color:#1C1A17;font-weight:500;">${escapeHtml(value)}</td></tr>`;
}
function escapeHtml(s: string): string {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

// ── Send client confirmation via Resend — required because Web3Forms can    ──
// ── only ever deliver to the single inbox tied to its access key, and      ──
// ── cannot send custom HTML on the free tier. See PDD Section 6 for setup. ──
// ── SendGrid — chosen over Resend for now because Single Sender Verification ─
// requires no DNS setup (verify one email address by clicking a link, live
// within minutes). Once you're ready for full domain authentication (better
// deliverability), Resend remains a documented upgrade path — see PDD notes.
async function sendClientConfirmation(env: Env, toEmail: string, formType: string, data: Record<string, string>): Promise<{ sent: boolean; error?: string }> {
  if (!env.SENDGRID_API_KEY) {
    const msg = "SENDGRID_API_KEY not set — client confirmation email skipped.";
    console.warn(msg);
    return { sent: false, error: msg };
  }
  const { subject, html } = buildConfirmationEmail(formType, data);
  try {
    const res = await fetch("https://api.sendgrid.com/v3/mail/send", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${env.SENDGRID_API_KEY}`,
      },
      body: JSON.stringify({
        personalizations: [{ to: [{ email: toEmail }] }],
        from: { email: "carlos@italgres.com", name: "Italgres" },
        subject,
        content: [{ type: "text/html", value: html }],
      }),
    });

    // SendGrid returns 202 with an empty body on success — do not call res.json() on success.
    if (!res.ok) {
      const errBody = await res.text();
      const msg = `SendGrid API error ${res.status}: ${errBody}`;
      console.error(msg);
      return { sent: false, error: msg };
    }

    return { sent: true };
  } catch (err) {
    const msg = `SendGrid request failed: ${err instanceof Error ? err.message : String(err)}`;
    console.error(msg);
    return { sent: false, error: msg };
  }
}

// ── Form submission — sends operator notification (Web3Forms) AND client   ──
// ── confirmation (Resend) from a single call. Frontend sends one request.  ──
async function handleSubmit(request: Request, env: Env, CORS: Record<string,string>, clientIP: string): Promise<Response> {
  try {
    if (!checkSubmitRateLimit(clientIP)) {
      return new Response(JSON.stringify({ error: "Too many requests. Please wait a few minutes and try again." }), {
        status: 429,
        headers: { "Content-Type": "application/json", "Retry-After": "300", ...CORS, ...SECURITY_HEADERS },
      });
    }

    const contentLength = parseInt(request.headers.get("Content-Length") || "0", 10);
    if (contentLength > 50_000) {
      return new Response(JSON.stringify({ error: "Request too large." }), {
        status: 413,
        headers: { "Content-Type": "application/json", ...CORS },
      });
    }

    let body: Record<string, unknown>;
    try {
      body = await request.json() as Record<string, unknown>;
    } catch {
      return new Response(JSON.stringify({ error: "Invalid JSON." }), {
        status: 400,
        headers: { "Content-Type": "application/json", ...CORS },
      });
    }

    // Sanitize all string values in the payload
    for (const key of Object.keys(body)) {
      if (typeof body[key] === "string") {
        body[key] = (body[key] as string)
          .replace(/\0/g, "")
          .replace(/[\x01-\x08\x0B\x0C\x0E-\x1F\x7F]/g, "")
          .trim()
          .slice(0, 5000);
      }
    }

    const clientEmail = typeof body.email === "string" ? body.email : "";
    const formType = typeof body.form_type === "string" ? body.form_type : "booking";

    // 1. Notify operator via Web3Forms (their default template — internal use only)
    const operatorPayload = { ...body, access_key: env.WEB3FORMS_KEY };
    delete (operatorPayload as Record<string, unknown>).form_type;

    const web3FormsHeaders = {
      "Content-Type": "application/json",
      "Referer": "https://italgresorlando.com/",
      "Origin": "https://italgresorlando.com",
      "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
    };

    let res = await fetch("https://api.web3forms.com/submit", {
      method: "POST",
      headers: web3FormsHeaders,
      body: JSON.stringify(operatorPayload),
    });

    if (res.status === 429) {
      await new Promise(r => setTimeout(r, 800));
      res = await fetch("https://api.web3forms.com/submit", {
        method: "POST",
        headers: web3FormsHeaders,
        body: JSON.stringify(operatorPayload),
      });
    }

    const data = await res.json();

    // 2. Send branded confirmation to the client via Resend
    let confirmationResult: { sent: boolean; error?: string } = { sent: false, error: "No client email provided." };
    if (clientEmail) {
      const stringData: Record<string, string> = {};
      for (const k of Object.keys(body)) {
        if (typeof body[k] === "string") stringData[k] = body[k] as string;
      }
      confirmationResult = await sendClientConfirmation(env, clientEmail, formType, stringData);
    }

    return new Response(JSON.stringify({ ...data, client_confirmation: confirmationResult }), {
      status: res.status,
      headers: { "Content-Type": "application/json", ...CORS, ...SECURITY_HEADERS },
    });
  } catch (err) {
    console.error("Submit error:", err);
    return new Response(JSON.stringify({ error: "Submission failed. Please try again." }), {
      status: 500,
      headers: { "Content-Type": "application/json", ...CORS },
    });
  }
}


// ── Image download proxy — forces browser download for cross-origin images ───
// Not restricted to a hardcoded domain allowlist: Product Photo is a manually
// pasted URL field and can legitimately point to any public image host.
// Instead we block requests to internal/private network addresses (SSRF
// protection) and require http/https, which is sufficient since these URLs
// come from Carlos's own vetted Airtable data, not untrusted site visitors.
function isPrivateOrInternalHost(hostname: string): boolean {
  const h = hostname.toLowerCase().replace(/^\[|\]$/g, ""); // strip IPv6 brackets

  if (h === "localhost" || h === "0.0.0.0" || h.endsWith(".local")) return true;

  // IPv6 loopback / unique-local / link-local
  if (h === "::1") return true;
  if (/^fc[0-9a-f]{2}:/.test(h) || /^fd[0-9a-f]{2}:/.test(h)) return true; // fc00::/7
  if (h.startsWith("fe80:")) return true; // fe80::/10
  // IPv4-mapped IPv6 (::ffff:127.0.0.1 style)
  const mapped = h.match(/::ffff:(\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3})$/);
  const ipv4Candidate = mapped ? mapped[1] : h;

  // Dotted-decimal IPv4 private/reserved ranges
  const m = ipv4Candidate.match(/^(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})$/);
  if (m) {
    const [a, b] = [parseInt(m[1]), parseInt(m[2])];
    if (a === 10) return true;
    if (a === 127) return true;
    if (a === 169 && b === 254) return true;
    if (a === 172 && b >= 16 && b <= 31) return true;
    if (a === 192 && b === 168) return true;
    if (a === 0) return true;
  }

  // Obfuscated IP encodings: pure-decimal (e.g. 2130706433) or hex (0x7f000001)
  // Browsers/servers can resolve these to real IPv4 addresses, bypassing dotted-quad checks.
  if (/^\d+$/.test(h) || /^0x[0-9a-f]+$/i.test(h)) return true;

  return false;
}

async function handleDownload(request: Request, CORS: Record<string,string>, clientIP: string): Promise<Response> {
  try {
    if (!checkDownloadRateLimit(clientIP)) {
      return new Response(JSON.stringify({ error: "Too many download requests. Please wait a moment." }), {
        status: 429,
        headers: { "Content-Type": "application/json", "Retry-After": "60", ...CORS, ...SECURITY_HEADERS },
      });
    }

    const url = new URL(request.url);
    const imageUrl = url.searchParams.get("url");
    const filename = url.searchParams.get("filename") || "italgres-photo.jpg";

    if (!imageUrl) {
      return new Response(JSON.stringify({ error: "Missing url param." }), {
        status: 400, headers: { "Content-Type": "application/json", ...CORS },
      });
    }

    let parsedUrl: URL;
    try {
      parsedUrl = new URL(imageUrl);
    } catch {
      return new Response(JSON.stringify({ error: "Invalid url param." }), {
        status: 400, headers: { "Content-Type": "application/json", ...CORS },
      });
    }

    if (parsedUrl.protocol !== "http:" && parsedUrl.protocol !== "https:") {
      return new Response(JSON.stringify({ error: "Only http/https URLs are allowed." }), {
        status: 403, headers: { "Content-Type": "application/json", ...CORS },
      });
    }

    if (isPrivateOrInternalHost(parsedUrl.hostname)) {
      return new Response(JSON.stringify({ error: "This host is not allowed." }), {
        status: 403, headers: { "Content-Type": "application/json", ...CORS },
      });
    }

    // Standard automatic redirect-following. (An earlier "manual" redirect
    // approach broke every download: cross-origin manual redirects resolve
    // as opaque responses with status 0 and unreadable headers in the Fetch
    // API, so the "follow the Location header" logic never actually ran.
    // The origin-URL SSRF check above is the real protection here — these
    // URLs come from Carlos's own Airtable data, not arbitrary public input.)
    const imgRes = await fetch(imageUrl, {
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        "Accept": "image/avif,image/webp,image/apng,image/svg+xml,image/*,*/*;q=0.8",
      },
    });

    if (!imgRes.ok) {
      return new Response(JSON.stringify({ error: `Could not fetch image: ${imgRes.status}` }), {
        status: 502, headers: { "Content-Type": "application/json", ...CORS },
      });
    }

    // Buffer fully so we can set an explicit Content-Length — streaming
    // without a known length makes Windows/Edge flag the download as
    // untrusted and silently block it.
    const imgBuffer = await imgRes.arrayBuffer();
    const contentType = imgRes.headers.get("Content-Type") || "image/jpeg";

    const safeFilename = filename.replace(/[^a-zA-Z0-9._-]/g, "_") || "italgres-photo.jpg";
    const encodedFilename = encodeURIComponent(safeFilename);

    return new Response(imgBuffer, {
      headers: {
        "Content-Type": contentType,
        "Content-Length": String(imgBuffer.byteLength),
        "Content-Disposition": `attachment; filename="${safeFilename}"; filename*=UTF-8''${encodedFilename}`,
        "Cache-Control": "no-store",
        "X-Content-Type-Options": "nosniff",
        "Access-Control-Allow-Origin": "*",
      },
    });
  } catch (err) {
    console.error("Download proxy error:", err);
    return new Response(JSON.stringify({ error: "Download failed." }), {
      status: 500, headers: { "Content-Type": "application/json", ...CORS },
    });
  }
}


// ── Branded 404 page — replaces Cloudflare's default asset-not-found page ────

// ── Public logo asset — some external services (e.g. Cloudflare Access custom
// login page branding) require a real HTTPS "Logo URL", not embedded base64.
// This decodes the same LOGO_B64 used elsewhere and serves it as a real file.
function serveLogo(): Response {
  const base64 = LOGO_B64.split(",")[1]; // strip "data:image/png;base64," prefix
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return new Response(bytes, {
    headers: {
      "Content-Type": "image/png",
      "Cache-Control": "public, max-age=86400",
      "Access-Control-Allow-Origin": "*",
    },
  });
}

function build404Page(): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Page Not Found — Italgres Orlando</title>
<style>
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body {
    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Arial, sans-serif;
    background: #1C1A17;
    color: #FAF9F6;
    min-height: 100svh;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    text-align: center;
    padding: 2rem;
  }
  .logo { height: 56px; width: auto; margin-bottom: 3rem; }
  .code {
    font-size: clamp(4rem, 15vw, 8rem);
    font-weight: 700;
    color: #f39b34;
    line-height: 1;
    letter-spacing: -0.02em;
    margin-bottom: 1rem;
  }
  h1 {
    font-size: 1.5rem;
    font-weight: 500;
    margin-bottom: 0.75rem;
    color: #FAF9F6;
  }
  p {
    font-size: 0.95rem;
    color: rgba(250,249,246,0.6);
    max-width: 420px;
    line-height: 1.6;
    margin-bottom: 2.5rem;
  }
  .actions { display: flex; gap: 1rem; flex-wrap: wrap; justify-content: center; }
  a.btn {
    display: inline-block;
    padding: 0.85rem 1.75rem;
    border-radius: 2px;
    font-size: 0.85rem;
    letter-spacing: 0.04em;
    text-decoration: none;
    transition: opacity 0.2s;
  }
  a.btn:hover { opacity: 0.85; }
  a.btn-primary { background: #f39b34; color: #1C1A17; font-weight: 600; }
  a.btn-secondary { border: 1px solid rgba(250,249,246,0.3); color: #FAF9F6; }
  .footer-note {
    margin-top: 3rem;
    font-size: 0.75rem;
    color: rgba(250,249,246,0.35);
  }
</style>
</head>
<body>
  <img class="logo" src="${LOGO_B64}" alt="Italgres Orlando">
  <div class="code">404</div>
  <h1>This page could not be found</h1>
  <p>The page you're looking for may have been moved, renamed, or doesn't exist. Let's get you back on track.</p>
  <div class="actions">
    <a class="btn btn-primary" href="/">Back to Home</a>
    <a class="btn btn-secondary" href="/contact">Contact Us</a>
  </div>
  <p class="footer-note">Italgres Orlando</p>
</body>
</html>`;
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);
    const origin = request.headers.get("Origin") || "";
    const CORS = getCors(origin);

    if (request.method === "OPTIONS") {
      return new Response(null, { headers: CORS });
    }

    if (url.pathname === "/api/collections" && request.method === "GET") {
      return handleCollections(request, env, CORS);
    }

    if (url.pathname === "/branding/logo.png" && request.method === "GET") {
      return serveLogo();
    }

    if (url.pathname === "/api/chat" && request.method === "POST") {
      const clientIP = request.headers.get("CF-Connecting-IP") || "unknown";
      return handleChat(request, env, CORS, clientIP);
    }

    if (url.pathname === "/api/submit" && request.method === "POST") {
      const clientIP = request.headers.get("CF-Connecting-IP") || "unknown";
      return handleSubmit(request, env, CORS, clientIP);
    }

    if (url.pathname === "/api/download" && request.method === "GET") {
      const clientIP = request.headers.get("CF-Connecting-IP") || "unknown";
      return handleDownload(request, CORS, clientIP);
    }

    const assetResponse = await env.ASSETS.fetch(request);
    if (assetResponse.status === 404) {
      return new Response(build404Page(), {
        status: 404,
        headers: { "Content-Type": "text/html;charset=UTF-8", ...SECURITY_HEADERS },
      });
    }
    return assetResponse;
  },
};
