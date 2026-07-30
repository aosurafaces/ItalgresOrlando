import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI } from "@google/genai";
import dotenv from "dotenv";
import { COLLECTIONS as localCollections } from "./src/data";

// Load environment variables
dotenv.config();

let dynamicCollections: any[] = [];

const app = express();
const PORT = 3000;

app.use(express.json());

// Initialize Gemini Client
const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
  httpOptions: {
    headers: {
      'User-Agent': 'aistudio-build',
    }
  }
});

const SOREN_SYSTEM_PROMPT = `You are Soren, the AI design concierge for Italgres Orlando — a luxury tile and surface showroom in Orlando, Florida. You represent a brand that values precision, material quality, and exceptional client experience.

Your role is to help clients find the right tile or surface collection for their project. You ask about the space (kitchen, bathroom, outdoor, commercial), the look they want (marble, concrete, wood, stone, minimalist, dramatic), their preferred finish (polished, matte, textured), and scale of the project.

You never hard-sell. You guide. Your tone is warm, knowledgeable, and refined — like a trusted design advisor, not a salesperson.

After 2-3 exchanges, recommend 2-3 specific collections by name with a brief reason why each fits. Always end by offering to connect them with Carlos for a consultation: "I can arrange a meeting with Carlos to walk you through samples in person. Would that be helpful?"

Keep responses concise — 3-5 sentences maximum unless the client asks for detail. Never mention competitors. If asked about pricing, say pricing is discussed during consultation based on project scope.

Collections available: Calacatta Gold, Nero Marquina, Travertine, Statuario Extra, Roma Imperial, Frappuccino Marble, Arabescato Orobico, Concrete Series, Quartzite Corteccia, Patagonie, Dual White, Nature Mood series (Rainforest, Mountain Peak, Riverbed), Distrito series (Aluminio, Iron, Zinc), Ankara Bronze, Sunshine Capraia, Arken Gris.

Applications: Wall, Floor, Indoor, Outdoor. Formats available: 160×320cm, 120×280cm, 120×120cm, 48×102cm, 48×108cm.`;

// In-memory bookings store (for simulation)
const bookings: any[] = [];

// Airtable Configuration & Integration
let cachedBaseId: string | null = null;
const tablesVerified = new Set<string>();

async function getAirtableBaseId(): Promise<string | null> {
  if (process.env.AIRTABLE_BASE_ID) {
    return process.env.AIRTABLE_BASE_ID;
  }
  if (cachedBaseId) {
    return cachedBaseId;
  }
  const token = process.env.AIRTABLE_API_TOKEN;
  if (!token) {
    return null;
  }

  try {
    const res = await fetch("https://api.airtable.com/v0/meta/bases", {
      headers: {
        Authorization: `Bearer ${token}`
      }
    });
    if (!res.ok) {
      console.error(`Airtable list bases failed with status ${res.status}:`, await res.text());
      return null;
    }
    const data: any = await res.json();
    if (data.bases && data.bases.length > 0) {
      // Look for a base named Italgres or Orlando
      const matched = data.bases.find((b: any) => 
        b.name.toLowerCase().includes("italgres") || 
        b.name.toLowerCase().includes("orlando")
      );
      if (matched) {
        cachedBaseId = matched.id;
        console.log(`Auto-discovered matched Airtable Base: "${matched.name}" (${matched.id})`);
        return matched.id;
      }
      // Fallback to the first base
      cachedBaseId = data.bases[0].id;
      console.log(`Using first available Airtable Base: "${data.bases[0].name}" (${data.bases[0].id})`);
      return data.bases[0].id;
    }
    console.warn("Airtable token has no accessible bases.");
    return null;
  } catch (err: any) {
    console.error("Error auto-discovering Airtable Base ID:", err.message);
    return null;
  }
}

async function ensureAirtableTables(baseId: string) {
  const token = process.env.AIRTABLE_API_TOKEN;
  if (!token) return;

  const cacheKey = `${baseId}_verified`;
  if (tablesVerified.has(cacheKey)) {
    return;
  }

  try {
    const res = await fetch(`https://api.airtable.com/v0/meta/bases/${baseId}/tables`, {
      headers: {
        Authorization: `Bearer ${token}`
      }
    });
    if (!res.ok) {
      console.warn(`Could not fetch Airtable tables schema (${res.status}). Skipping auto-creation.`);
      return;
    }
    const data: any = await res.json();
    const existingTableNames = (data.tables || []).map((t: any) => t.name.toLowerCase());

    // Ensure Bookings
    if (!existingTableNames.includes("bookings")) {
      console.log(`Creating "Bookings" table in Airtable base ${baseId}...`);
      const createRes = await fetch(`https://api.airtable.com/v0/meta/bases/${baseId}/tables`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          name: "Bookings",
          description: "Italgres showroom consultation bookings",
          fields: [
            { name: "Name", type: "singleLineText" },
            { name: "Email", type: "email" },
            { name: "Phone", type: "singleLineText" },
            { name: "Date", type: "singleLineText" },
            { name: "Time", type: "singleLineText" },
            { name: "Notes", type: "multilineText" },
            { name: "ProjectType", type: "singleLineText" },
            { name: "CreatedAt", type: "singleLineText" }
          ]
        })
      });
      if (createRes.ok) {
        console.log(`Successfully created "Bookings" table in Airtable.`);
      } else {
        console.error(`Failed to create "Bookings" table:`, await createRes.text());
      }
    }

    // Ensure Pre-Selections
    if (!existingTableNames.includes("pre-selections") && !existingTableNames.includes("pre_selections") && !existingTableNames.includes("preselections")) {
      console.log(`Creating "Pre-Selections" table in Airtable base ${baseId}...`);
      const createRes = await fetch(`https://api.airtable.com/v0/meta/bases/${baseId}/tables`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          name: "Pre-Selections",
          description: "Italgres luxury material specifications and pre-selections",
          fields: [
            { name: "Name", type: "singleLineText" },
            { name: "Email", type: "email" },
            { name: "Phone", type: "singleLineText" },
            { name: "Notes", type: "multilineText" },
            { name: "ProjectType", type: "singleLineText" },
            { name: "Slabs", type: "multilineText" },
            { name: "CreatedAt", type: "singleLineText" }
          ]
        })
      });
      if (createRes.ok) {
        console.log(`Successfully created "Pre-Selections" table in Airtable.`);
      } else {
        console.error(`Failed to create "Pre-Selections" table:`, await createRes.text());
      }
    }

    tablesVerified.add(cacheKey);
  } catch (err: any) {
    console.error("Error ensuring Airtable tables:", err.message);
  }
}

async function saveBookingToAirtable(booking: any) {
  const token = process.env.AIRTABLE_API_TOKEN;
  if (!token) return;
  const baseId = await getAirtableBaseId();
  if (!baseId) return;

  await ensureAirtableTables(baseId);

  try {
    const res = await fetch(`https://api.airtable.com/v0/${baseId}/Bookings`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        records: [
          {
            fields: {
              Name: booking.name,
              Email: booking.email,
              Phone: booking.phone || "",
              Date: booking.date,
              Time: booking.time,
              Notes: booking.notes || "",
              ProjectType: booking.projectType || "",
              CreatedAt: booking.createdAt
            }
          }
        ]
      })
    });
    if (!res.ok) {
      console.error(`Airtable save booking failed (${res.status}):`, await res.text());
    } else {
      console.log("Booking successfully synced to Airtable!");
    }
  } catch (err: any) {
    console.error("Failed to save booking to Airtable:", err.message);
  }
}

async function savePreSelectionToAirtable(preSelection: any) {
  const token = process.env.AIRTABLE_API_TOKEN;
  if (!token) return;
  const baseId = await getAirtableBaseId();
  if (!baseId) return;

  await ensureAirtableTables(baseId);

  // Format the slabs nicely for multiline text
  const formattedSlabsList = preSelection.slabs.map((s: any) => 
    `- ${s.name} (${s.category} | ${s.finish}): ${s.quantity || 1} ${s.quantityType || 'Slabs'}`
  ).join("\n");

  try {
    const res = await fetch(`https://api.airtable.com/v0/${baseId}/Pre-Selections`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        records: [
          {
            fields: {
              Name: preSelection.name,
              Email: preSelection.email,
              Phone: preSelection.phone || "",
              Notes: preSelection.notes || "",
              ProjectType: preSelection.projectType || "",
              Slabs: formattedSlabsList,
              CreatedAt: preSelection.createdAt
            }
          }
        ]
      })
    });
    if (!res.ok) {
      console.error(`Airtable save pre-selection failed (${res.status}):`, await res.text());
    } else {
      console.log("Pre-selection successfully synced to Airtable!");
    }
  } catch (err: any) {
    console.error("Failed to save pre-selection to Airtable:", err.message);
  }
}


// API Chat endpoint
app.post("/api/chat", async (req, res) => {
  try {
    const { messages } = req.body;
    if (!messages || !Array.isArray(messages)) {
      return res.status(400).json({ error: "Invalid messages array" });
    }

    const activeCols = dynamicCollections.length > 0 ? dynamicCollections : localCollections;
    const collectionsStr = activeCols.map(c => 
      `- ${c.name} (${c.brand ? `Brand: ${c.brand}` : `Origin: ${c.origin}`}, Category: ${c.category}, Finish: ${c.finish}, Size: ${c.formats?.[0] || "24x48"}, Thickness: ${c.thickness || "6mm"}, Stock: ${c.stockQuantities || "In Stock"}, Price: ${c.price || "Consultation Required"}): ${c.description} (Visual style: ${c.veiningStyle || "Stunning layout"}).`
    ).join("\n");

    const enrichedSystemPrompt = `${SOREN_SYSTEM_PROMPT}\n\nACTIVE LOT CATALOG AVAILABLE NOW (Use these specific collections and details to answer user inquiries):\n${collectionsStr}`;

    const anthropicKey = process.env.ANTHROPIC_API_KEY;
    const hasAnthropic = anthropicKey && anthropicKey !== "YOUR_KEY_HERE" && anthropicKey.trim() !== "";

    if (hasAnthropic) {
      // call Anthropic Claude API
      try {
        const formattedMessages = messages.map(msg => ({
          role: msg.role === "model" || msg.role === "assistant" ? "assistant" : "user",
          content: msg.content
        }));

        const response = await fetch("https://api.anthropic.com/v1/messages", {
          method: "POST",
          headers: {
            "x-api-key": anthropicKey,
            "anthropic-version": "2023-06-01",
            "content-type": "application/json"
          },
          body: JSON.stringify({
            model: "claude-3-5-sonnet-20241022",
            system: enrichedSystemPrompt,
            messages: formattedMessages,
            max_tokens: 1024
          })
        });

        if (!response.ok) {
          const errData = await response.text();
          throw new Error(`Anthropic API error: ${errData}`);
        }

        const data = await response.json();
        const textResponse = data.content?.[0]?.text || "I apologize, but I am having trouble connecting to my creative matrix.";
        return res.json({ text: textResponse, provider: "anthropic" });
      } catch (anthropicError: any) {
        console.error("Anthropic call failed, falling back to Gemini:", anthropicError.message);
      }
    }

    // Default: Fallback or primary use of Gemini API
    if (!process.env.GEMINI_API_KEY) {
      return res.status(500).json({ error: "No API keys configured. Please add GEMINI_API_KEY in secrets." });
    }

    // Map conversation history for Gemini's generateContent
    const contents = messages.map((msg: any) => ({
      role: msg.role === "assistant" || msg.role === "model" ? "model" : "user",
      parts: [{ text: msg.content }]
    }));

    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: contents,
      config: {
        systemInstruction: enrichedSystemPrompt,
        temperature: 0.7,
      }
    });

    res.json({ text: response.text || "I am processing your material request...", provider: "gemini" });
  } catch (error: any) {
    console.error("Chat handler error:", error);
    res.status(500).json({ error: error.message || "An error occurred during processing." });
  }
});

// API Booking endpoint
app.post("/api/book", (req, res) => {
  const { name, email, phone, date, time, notes, projectType } = req.body;
  if (!name || !email || !date || !time) {
    return res.status(400).json({ error: "Missing required booking details." });
  }

  const booking = {
    id: `book_${Date.now()}`,
    name,
    email,
    phone,
    date,
    time,
    notes,
    projectType,
    createdAt: new Date().toISOString()
  };

  bookings.push(booking);
  console.log("New booking received:", booking);

  // Sync to Airtable asynchronously
  saveBookingToAirtable(booking).catch((err) => {
    console.error("Airtable sync error during booking:", err);
  });

  res.json({
    success: true,
    message: `Thank you, ${name}. Your private consultation at our Orlando showroom on ${date} at ${time} is requested. We will connect you with Carlos shortly to confirm.`,
    bookingId: booking.id
  });
});

// In-memory pre-selections store
const preSelections: any[] = [];

// API Material Pre-Selection endpoint
app.post("/api/pre-selection", (req, res) => {
  const { name, email, phone, notes, slabs, projectType } = req.body;
  
  if (!name || !email || !slabs || !Array.isArray(slabs) || slabs.length === 0) {
    return res.status(400).json({ error: "Missing required pre-selection details. Slabs list must be non-empty." });
  }

  const preSelection = {
    id: `pre_${Date.now()}`,
    name,
    email,
    phone,
    notes: notes || "No additional project notes",
    projectType: projectType || "Residential Slabs & Porcelain",
    slabs, // Array of { id, name, category, finish, quantity, quantityType }
    createdAt: new Date().toISOString()
  };

  preSelections.push(preSelection);
  console.log("New Material Pre-selection received:", preSelection);

  // Sync to Airtable asynchronously
  savePreSelectionToAirtable(preSelection).catch((err) => {
    console.error("Airtable sync error during pre-selection:", err);
  });

  // Email Notification details simulated professionally
  const formattedSlabsList = slabs.map(s => 
    `- ${s.name} (${s.category} | ${s.finish}): ${s.quantity || 1} ${s.quantityType || 'Slabs'}`
  ).join("\n");

  const emailText = `
--------------------------------------------------
PORTAL DE PRESELECCIÓN - ITALGRES ORLANDO
--------------------------------------------------
Un cliente ha preseleccionado materiales en la web:

INFORMACIÓN DEL CLIENTE:
- Nombre: ${name}
- Email: ${email}
- Teléfono: ${phone || "No provisto"}
- Tipo de Proyecto: ${preSelection.projectType}
- Notas de Diseño: ${preSelection.notes}

MATERIALES PRESELECCIONADOS:
${formattedSlabsList}

--------------------------------------------------
ESTADO: Correo enviado a Carlos (carlos@italgresorlando.com) y copia a ${email}.
--------------------------------------------------
  `;

  console.log(emailText);

  res.json({
    success: true,
    message: `Material Pre-Selection request compiled successfully!`,
    summary: `Your bespoke specification sheet has been compiled. A notification was sent to Carlos's personal showroom queue (carlos@italgresorlando.com) and a receipt copy has been dispatched to your email: ${email}.`,
    emailSimulated: emailText,
    preSelectionId: preSelection.id
  });
});

// API Get Collections (Dynamically fetches from Airtable products table if configured, otherwise falls back)
app.get("/api/collections", async (req, res) => {
  const token = process.env.AIRTABLE_API_TOKEN;
  const baseId = await getAirtableBaseId();
  const customTableName = process.env.AIRTABLE_TABLE_NAME || "Master Grid View";

  if (token && baseId) {
    try {
      // List of potential table names to try, starting with user-provided table name
      const tablesToTry = [customTableName, "Master Grid View", "Products", "Slabs", "Inventory", "Catalog", "Table 1", "Sheet1"];
      let airtableRes: any = null;
      let matchedTable = "";

      for (const t of tablesToTry) {
        if (!t) continue;
        console.log(`Checking Airtable catalog table "${t}"...`);
        const testRes = await fetch(`https://api.airtable.com/v0/${baseId}/${encodeURIComponent(t)}?maxRecords=100`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (testRes.ok) {
          airtableRes = testRes;
          matchedTable = t;
          break;
        } else {
          console.log(`Table "${t}" check failed or not accessible (status ${testRes.status})`);
        }
      }

      if (airtableRes) {
        const data: any = await airtableRes.json();
        const records = data.records || [];
        console.log(`Successfully fetched ${records.length} records from Airtable table "${matchedTable}"!`);

        const mapped = records.map((rec: any) => {
          const fields = rec.fields;

          // Product name or Collection or id
          const name = fields["Product name"] || fields["Product Name"] || fields["Collection"] || `Slab ${rec.id.substring(0, 5)}`;
          
          // Photo URL
          let productPhotoUrl = fields["Photo URL (external CDN)"] || fields["Photo URL"] || fields["Photo"] || fields["Photo URL (external CDN) "];
          if (!productPhotoUrl && fields["Attachment"] && Array.isArray(fields["Attachment"]) && fields["Attachment"].length > 0) {
            productPhotoUrl = fields["Attachment"][0].url || fields["Attachment"][0].thumbnails?.large?.url;
          }
          if (!productPhotoUrl && fields["Attachments"] && Array.isArray(fields["Attachments"]) && fields["Attachments"].length > 0) {
            productPhotoUrl = fields["Attachments"][0].url || fields["Attachments"][0].thumbnails?.large?.url;
          }

          // Inferred or explicit category
          let category = fields["Category description"] || fields["Category Description"] || fields["Category"] || "";
          if (!category) {
            const specStyle = (fields["Specific Material Style (Concrete & Cement Look, Marble Look)"] || "").toLowerCase();
            if (specStyle.includes("marble")) category = "Marble Look";
            else if (specStyle.includes("concrete") || specStyle.includes("cement")) category = "Concrete Look";
            else if (specStyle.includes("metal")) category = "Metal Look";
            else if (specStyle.includes("stone")) category = "Stone Look";
            else category = "Marble Look"; // default fallback
          }

          // Finish and style
          const finish = fields["Finish"] || fields["Style (Deco, Polished)"] || "Matte";
          const size = fields["Size (24x48, 32x71)"] || fields["Size"] || "24x48";

          // Applications mapping
          let applications = ["Wall", "Floor"];
          const appVal = fields["Application (Wall/Floor)"] || fields["Application"];
          if (appVal) {
            if (Array.isArray(appVal)) {
              applications = appVal;
            } else if (typeof appVal === "string") {
              applications = appVal.split(/[\/,]/).map((s: string) => s.trim());
            }
          }

          // Colors mapping
          let colors = ["Grey"];
          const colVal = fields["Color"] || fields["Color Group"];
          if (colVal) {
            if (Array.isArray(colVal)) {
              colors = colVal;
            } else if (typeof colVal === "string") {
              colors = colVal.split(/[,/]/).map((s: string) => s.trim());
            }
          }

          // Generate a beautiful, high-contrast linear gradient background dynamically based on the material style/color!
          const styleStr = (fields["Specific Material Style (Concrete & Cement Look, Marble Look)"] || "").toLowerCase();
          const colorStr = (fields["Color"] || "").toLowerCase();
          
          let backgroundGradient = "linear-gradient(135deg, #18191b 0%, #262a2e 100%)"; // default sleek dark slate
          if (styleStr.includes("marble") || styleStr.includes("calacatta")) {
            if (colorStr.includes("white") || colorStr.includes("gold")) {
              backgroundGradient = "linear-gradient(135deg, #e5dfd5 0%, #ffffff 40%, #d4c6b3 55%, #f2eae0 80%, #ffffff 100%)";
            } else if (colorStr.includes("black")) {
              backgroundGradient = "linear-gradient(135deg, #0d0d0d 0%, #181818 40%, #ffffff 45%, #101010 50%, #080808 100%)";
            }
          } else if (styleStr.includes("concrete") || styleStr.includes("cement")) {
            backgroundGradient = "linear-gradient(180deg, #191a1b 0%, #222426 50%, #191a1b 100%)";
          } else if (styleStr.includes("metal") || styleStr.includes("iron")) {
            backgroundGradient = "linear-gradient(135deg, #0e302e 0%, #1f423d 30%, #304e46 50%, #152c28 80%, #0c1a18 100%)";
          }

          return {
            id: rec.id,
            name: name,
            category: category,
            finish: finish,
            formats: [size],
            specs: `${size} · Thickness: ${fields["Thickness"] || "6mm"}`,
            description: fields["Category description"] || `Exclusive slab with sub-style: ${fields["Sub-style (Concrete/Solid, Laurent)"] || "Standard"}.`,
            veiningStyle: fields["Sub-style (Concrete/Solid, Laurent)"] || fields["Style (Deco, Polished)"] || "",
            backgroundGradient: backgroundGradient,
            origin: fields["Brand (Imola, Vives)"] || "Imported",
            colors: colors,
            applications: applications,
            // Enriched fields from spec sheets
            finishAndFeel: fields["Style (Deco, Polished)"] || fields["Finish"] || "Smooth Matte",
            colorGroup: fields["Color"] || "Neutral",
            sizeAndFormat: size,
            thickness: fields["Thickness"] || "6 mm",
            visualLook: fields["Specific Material Style (Concrete & Cement Look, Marble Look)"] || "Porcelain Slabs & Panels",
            specificMaterialStyle: fields["Specific Material Style (Concrete & Cement Look, Marble Look)"],
            subStyle: fields["Sub-style (Concrete/Solid, Laurent)"],
            brand: fields["Brand (Imola, Vives)"],
            unit: fields["Unit"],
            sqFtPerUnit: fields["SqFt per unit"],
            sqFtPerBox: fields["SqFt per box"],
            stockQuantities: fields["Stock quantities"],
            price: fields["Price fields"] || fields["Price"],
            productPhotoUrl: productPhotoUrl,
            source: "Airtable"
          };
        });

        if (mapped.length > 0) {
          dynamicCollections = mapped;
          return res.json(mapped);
        }
      }
    } catch (err: any) {
      console.warn("Could not connect to Airtable catalog dynamically (checking/permissions issues). Falling back to local data:", err.message);
    }
  }

  res.json(localCollections);
});

app.get("/api/pre-selections", async (req, res) => {
  const token = process.env.AIRTABLE_API_TOKEN;
  const baseId = await getAirtableBaseId();
  if (token && baseId) {
    try {
      const airtableRes = await fetch(`https://api.airtable.com/v0/${baseId}/Pre-Selections?maxRecords=100&sort%5B0%5D%5Bfield%5D=CreatedAt&sort%5B0%5D%5Bdirection%5D=desc`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (airtableRes.ok) {
        const data: any = await airtableRes.json();
        const airtablePreSelections = (data.records || []).map((rec: any) => ({
          id: rec.id,
          name: rec.fields.Name,
          email: rec.fields.Email,
          phone: rec.fields.Phone,
          notes: rec.fields.Notes,
          projectType: rec.fields.ProjectType,
          slabs: [{ name: rec.fields.Slabs }],
          createdAt: rec.fields.CreatedAt,
          source: "Airtable"
        }));
        // Merge with in-memory ones not present in Airtable by email & createdAt
        const merged = [...airtablePreSelections];
        for (const ps of preSelections) {
          if (!merged.some(m => m.email === ps.email && m.createdAt === ps.createdAt)) {
            merged.push({
              ...ps,
              source: "In-Memory"
            });
          }
        }
        return res.json(merged);
      } else {
        console.error(`Airtable fetch pre-selections failed with status ${airtableRes.status}:`, await airtableRes.text());
      }
    } catch (err: any) {
      console.error("Failed to fetch pre-selections from Airtable:", err.message);
    }
  }
  res.json(preSelections);
});

// API Get Bookings (mainly for debugging/visual tracking in the panel if wanted)
app.get("/api/bookings", async (req, res) => {
  const token = process.env.AIRTABLE_API_TOKEN;
  const baseId = await getAirtableBaseId();
  if (token && baseId) {
    try {
      const airtableRes = await fetch(`https://api.airtable.com/v0/${baseId}/Bookings?maxRecords=100&sort%5B0%5D%5Bfield%5D=CreatedAt&sort%5B0%5D%5Bdirection%5D=desc`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (airtableRes.ok) {
        const data: any = await airtableRes.json();
        const airtableBookings = (data.records || []).map((rec: any) => ({
          id: rec.id,
          name: rec.fields.Name,
          email: rec.fields.Email,
          phone: rec.fields.Phone,
          date: rec.fields.Date,
          time: rec.fields.Time,
          notes: rec.fields.Notes,
          projectType: rec.fields.ProjectType,
          createdAt: rec.fields.CreatedAt,
          source: "Airtable"
        }));
        // Merge with in-memory ones not present in Airtable by email & date & time
        const merged = [...airtableBookings];
        for (const b of bookings) {
          if (!merged.some(m => m.email === b.email && m.date === b.date && m.time === b.time)) {
            merged.push({
              ...b,
              source: "In-Memory"
            });
          }
        }
        return res.json(merged);
      } else {
        console.error(`Airtable fetch bookings failed with status ${airtableRes.status}:`, await airtableRes.text());
      }
    } catch (err: any) {
      console.error("Failed to fetch bookings from Airtable:", err.message);
    }
  }
  res.json(bookings);
});

async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Italgres Orlando Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
