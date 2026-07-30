// functions/api/collections.ts
// Cloudflare Pages Function — auto-deploys as /api/collections
// Required env vars (set in Cloudflare Pages → Settings → Environment Variables):
//   AIRTABLE_TOKEN  — Personal Access Token (pat...)
//   AIRTABLE_BASE   — appuFzevFbr3IyUHC
//   AIRTABLE_TABLE  — tbljY0BfzJigZGCJr

interface Env {
  AIRTABLE_TOKEN: string;
  AIRTABLE_BASE: string;
  AIRTABLE_TABLE: string;
}

// ── Airtable field name → Collection field mapping ─────────────
// Adjust these if Carlos renames columns in Airtable
const FIELD = {
  name:                 "Name",              // Full product name e.g. "Retine Lavagna Deco Matte 24x48"
  brand:                "Brand",             // Imola, Vives, Grespania, Mirage, Florim...
  collection:           "Collection",        // Collection family name
  color:                "Color",             // Deep Black, Calacatta Gold, etc.
  category:             "Category",          // Large Wall Rectangles, etc. — we remap to UI categories
  application:          "Application",       // Wall, Floor (multi-select)
  style:                "Style",             // Deco, Polished, etc.
  finish:               "Finish",            // Matte, Polished, Textured, Satin
  size:                 "Size",              // 24x48, 32x71, etc.
  thickness:            "Thickness",         // 6 mm, 5.6 mm, 6.5 mm, 11 mm
  unit:                 "Unit",              // SqFt
  sqFtPerUnit:          "Sq Ft Per Unit",    // numeric
  sqFtPerBox:           "Sq Ft Per Box",     // numeric
  stockQty1:            "Stock Qty 1",       // first stock column
  stockQty2:            "Stock Qty 2",       // second stock column
  price:                "Price",             // price field
  productPhotoUrl:      "Product Photo URL", // CDN URL string
  specificMaterialStyle:"Specific Material Style", // Calacatta Gold, Nero Marquina, etc.
  visualLook:           "Visual Look",       // Marble Look, Concrete Look, etc.
  colorGroup:           "Color Group",       // Deep Black, White & Cream, etc.
};

// ── Map Airtable record → Collection interface ──────────────────
function toCollection(record: { id: string; fields: Record<string, unknown> }): object {
  const f = record.fields;

  // Derive category from visual look or specific material style
  const rawVisualLook = str(f[FIELD.visualLook]) || str(f[FIELD.specificMaterialStyle]) || "";
  const category = deriveCategory(rawVisualLook, str(f[FIELD.finish]));

  // Derive finish — normalize variations
  const rawFinish = str(f[FIELD.finish]) || str(f[FIELD.style]) || "";
  const finish = deriveFinish(rawFinish);

  // Applications — Airtable multi-select comes as array
  const applications = arr(f[FIELD.application]);

  // Colors — derive from color field or color group
  const colorRaw = str(f[FIELD.color]) || str(f[FIELD.colorGroup]) || "";
  const colors = colorRaw ? [colorRaw] : [];

  // Stock — combine both qty columns
  const stock1 = num(f[FIELD.stockQty1]);
  const stock2 = num(f[FIELD.stockQty2]);
  const stockQuantities = (stock1 !== null || stock2 !== null)
    ? `${stock1 ?? 0} / ${stock2 ?? 0}`
    : null;

  // Size/format
  const size = str(f[FIELD.size]) || "";
  const formats = size ? [size] : [];

  // Product name — use Name field, fall back to collection + size
  const name = str(f[FIELD.name])
    || [str(f[FIELD.collection]), size].filter(Boolean).join(" ");

  // Background gradient — derive from category/color
  const backgroundGradient = deriveGradient(category, colorRaw);

  // ID — slugify the name
  const id = slugify(name || record.id);

  return {
    id,
    airtableId: record.id,          // keep original for future writes
    name,
    brand:                str(f[FIELD.brand]) || "",
    collection:           str(f[FIELD.collection]) || "",
    category,
    finish,
    formats,
    specs:                [size, str(f[FIELD.thickness])].filter(Boolean).join(" · "),
    description:          buildDescription(name, category, finish, applications),
    colors,
    applications,
    finishAndFeel:        deriveFinishAndFeel(finish),
    colorGroup:           str(f[FIELD.colorGroup]) || deriveColorGroup(colorRaw),
    sizeAndFormat:        size,
    thickness:            str(f[FIELD.thickness]) || "",
    visualLook:           rawVisualLook || category,
    specificMaterialStyle: str(f[FIELD.specificMaterialStyle]) || "",
    productPhotoUrl:      str(f[FIELD.productPhotoUrl]) || "",
    backgroundGradient,
    origin:               str(f[FIELD.brand]) || "European",
    // Extra fields for spec sheet
    unit:                 str(f[FIELD.unit]) || "SqFt",
    sqFtPerUnit:          num(f[FIELD.sqFtPerUnit]),
    sqFtPerBox:           num(f[FIELD.sqFtPerBox]),
    stockQuantities,
    price:                str(f[FIELD.price]) || null,
  };
}

// ── Fetch all records with pagination ──────────────────────────
async function fetchAllRecords(
  token: string,
  base: string,
  table: string
): Promise<object[]> {
  const records: object[] = [];
  let offset: string | undefined;

  

  do {
    const params = new URLSearchParams({ pageSize: "100" });
    if (offset) params.set("offset", offset);

    const url = `https://api.airtable.com/v0/${base}/${table}?${params}`;

    const res = await fetch(url, {
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
    });

    if (!res.ok) {
      const err = await res.text();
      throw new Error(`Airtable error ${res.status}: ${err}`);
    }

    const data = await res.json() as {
      records: { id: string; fields: Record<string, unknown> }[];
      offset?: string;
    };

    for (const record of data.records) {
      records.push(toCollection(record));
    }

    offset = data.offset;
  } while (offset);

  return records;
}

// ── Main handler ───────────────────────────────────────────────
export const onRequestGet: PagesFunction<Env> = async ({ env }) => {
  const corsHeaders = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET, OPTIONS",
    "Content-Type": "application/json",
  };

  try {
    if (!env.AIRTABLE_TOKEN || !env.AIRTABLE_BASE || !env.AIRTABLE_TABLE) {
      throw new Error("Missing Airtable environment variables");
    }

    const collections = await fetchAllRecords(
      env.AIRTABLE_TOKEN,
      env.AIRTABLE_BASE,
      env.AIRTABLE_TABLE
    );

    return new Response(JSON.stringify(collections), {
      status: 200,
      headers: corsHeaders,
    });
  } catch (err) {
    console.error("Collections worker error:", err);
    return new Response(
      JSON.stringify({ error: String(err), collections: [] }),
      { status: 500, headers: corsHeaders }
    );
  }
};

export const onRequestOptions: PagesFunction = async () =>
  new Response(null, {
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type",
    },
  });

// ── Utility helpers ────────────────────────────────────────────
function str(v: unknown): string {
  if (typeof v === "string") return v.trim();
  if (Array.isArray(v)) return v.join(", ").trim();
  return "";
}

function num(v: unknown): number | null {
  if (typeof v === "number") return v;
  if (typeof v === "string") {
    const n = parseFloat(v.replace(/[^0-9.]/g, ""));
    return isNaN(n) ? null : n;
  }
  return null;
}

function arr(v: unknown): string[] {
  if (Array.isArray(v)) return v.map(String);
  if (typeof v === "string" && v.trim()) return [v.trim()];
  return [];
}

function slugify(s: string): string {
  return s
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
}

function deriveCategory(
  visualLook: string,
  finish: string
): "Marble Look" | "Stone Look" | "Concrete Look" | "Metal Look" | "Wood Look" {
  const v = visualLook.toLowerCase();
  if (v.includes("marble") || v.includes("calacatta") || v.includes("statuario") ||
      v.includes("nero") || v.includes("arabescato") || v.includes("frappuccino") ||
      v.includes("patagonie") || v.includes("travertino") || v.includes("quartzite")) {
    return "Marble Look";
  }
  if (v.includes("concrete") || v.includes("cement") || v.includes("iron") ||
      v.includes("zinc") || v.includes("aluminio") || v.includes("distrito") ||
      v.includes("deco")) {
    return "Concrete Look";
  }
  if (v.includes("metal") || v.includes("bronze") || v.includes("ankara")) {
    return "Metal Look";
  }
  if (v.includes("wood") || v.includes("plank") || v.includes("tundra")) {
    return "Wood Look";
  }
  // Default: stone
  return "Stone Look";
}

function deriveFinish(
  raw: string
): "Polished" | "Matte" | "Textured" | "Silk" | "Satin" {
  const r = raw.toLowerCase();
  if (r.includes("polished") || r.includes("gloss") || r.includes("brillante")) return "Polished";
  if (r.includes("matte") || r.includes("mate") || r.includes("natural") || r.includes("deco")) return "Matte";
  if (r.includes("textured") || r.includes("grip") || r.includes("structured")) return "Textured";
  if (r.includes("silk") || r.includes("velvet") || r.includes("lappato")) return "Silk";
  if (r.includes("satin")) return "Satin";
  return "Matte";
}

function deriveFinishAndFeel(finish: string): string {
  if (finish === "Polished") return "Polished/High Gloss";
  if (finish === "Matte") return "Smooth Matte";
  if (finish === "Silk") return "Velvet Silk";
  if (finish === "Textured") return "Structured Grip";
  return "Satin Tactile";
}

function deriveColorGroup(color: string): string {
  const c = color.toLowerCase();
  if (c.includes("white") || c.includes("cream") || c.includes("calacatta")) return "White & Cream";
  if (c.includes("black") || c.includes("nero") || c.includes("lavagna")) return "Deep Black";
  if (c.includes("grey") || c.includes("gray") || c.includes("gris")) return "Dark Grey";
  if (c.includes("beige") || c.includes("travertine") || c.includes("warm")) return "Warm Beige";
  if (c.includes("brown") || c.includes("bronze") || c.includes("ankara")) return "Earthy Tones";
  return "Earthy Tones";
}

function deriveGradient(category: string, color: string): string {
  const c = color.toLowerCase();
  if (c.includes("black") || c.includes("nero") || c.includes("lavagna")) {
    return "linear-gradient(135deg, #1a1a1a 0%, #0a0a0a 100%)";
  }
  if (c.includes("white") || c.includes("calacatta") || c.includes("statuario")) {
    return "linear-gradient(135deg, #f5f0e8 0%, #e8dfc8 100%)";
  }
  if (c.includes("beige") || c.includes("travertine") || c.includes("warm")) {
    return "linear-gradient(135deg, #d4b07a 0%, #b89060 100%)";
  }
  if (category === "Concrete Look") {
    return "linear-gradient(135deg, #585450 0%, #323030 100%)";
  }
  if (category === "Metal Look") {
    return "linear-gradient(135deg, #8a7560 0%, #5a4535 100%)";
  }
  if (category === "Wood Look") {
    return "linear-gradient(135deg, #8B6914 0%, #5a3e10 100%)";
  }
  return "linear-gradient(135deg, #c8b090 0%, #a88060 100%)";
}

function buildDescription(
  name: string,
  category: string,
  finish: string,
  applications: string[]
): string {
  const appStr = applications.length > 0 ? applications.join(" & ") : "Wall & Floor";
  return `${name} — ${category} with ${finish.toLowerCase()} finish. Suitable for ${appStr} applications.`;
}
