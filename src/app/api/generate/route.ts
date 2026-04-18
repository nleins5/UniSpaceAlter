import { NextRequest, NextResponse } from "next/server";

const CF_MODEL = "@cf/black-forest-labs/flux-1-schnell";
const T8STAR_URL = "https://ai.t8star.cn/v1/images/generations";
const T8STAR_MODEL = "flux-schnell";
const RATE_LIMIT_PER_MINUTE = 60;

// ── Vietnamese → English for AI image model ──────
const VI_EN: Record<string, string> = {
  "con bò": "cow", "con mèo": "cat", "con chó": "dog", "con gà": "chicken",
  "con cá": "fish", "con hổ": "tiger", "con rồng": "dragon", "con rắn": "snake",
  "con thỏ": "rabbit", "con ngựa": "horse", "con voi": "elephant", "con khỉ": "monkey",
  "con ong": "bee", "con bướm": "butterfly", "con cú": "owl", "con sói": "wolf",
  "con gấu": "bear", "con sư tử": "lion", "con đại bàng": "eagle", "con cáo": "fox",
  "con heo": "pig", "con lợn": "pig", "con dê": "goat", "con cừu": "sheep",
  "trái tim": "heart", "ngôi sao": "star", "mặt trăng": "moon", "mặt trời": "sun",
  "bông hoa": "flower", "hoa hồng": "rose", "hoa sen": "lotus", "hoa anh đào": "cherry blossom",
  "cây": "tree", "núi": "mountain", "biển": "ocean", "sóng": "wave",
  "lửa": "fire", "nước": "water", "mây": "cloud", "cầu vồng": "rainbow",
  "vương miện": "crown", "kiếm": "sword", "kim cương": "diamond", "cánh": "wings",
  "vô cực": "infinity symbol", "trái banh": "ball", "quả bóng": "ball",
  "galaxy": "galaxy cosmic nebula", "thiên hà": "galaxy cosmic",
  "vũ trụ": "space universe", "đầu lâu": "skull", "thiên thần": "angel",
  "phượng hoàng": "phoenix", "kỳ lân": "unicorn", "cướp biển": "pirate",
  "dễ thương": "cute adorable chibi mascot, kawaii character design", "đẹp": "beautiful high quality", "ngầu": "cool badass sigma", "đáng yêu": "lovely cute", "cổ điển": "vintage retro", "neon": "neon glowing cinematic",
  "cháy": "fire aesthetic, vibrant, explosive colors, streetwear vibe",
  "áo lớp": "professional high school class t-shirt design, centered mascot logo, vectorized logo style, vibrant streetwear aesthetic, student apparel brand",
  "y2k": "y2k aesthetic, chrome, futuristic, 2000s style, cyber sigilism",
  "vẽ tay": "hand-drawn illustration, sketch style",
  "chất": "premium quality, sharp edges, professional graphic design",
  "chuyên": "specialized academic major theme, intellectual minimalist icon",
  "niên khóa": "graduation year batch style, varsity logo aesthetic",
  "mạnh mẽ": "powerful aggressive mascot, sports team logo style",
  "tối giản": "minimalist clean line art, simple sophisticated logo",
  "màu nước": "artistic watercolor style, soft ethereal colors",
  "vẽ nét": "detailed line art illustration, ink drawing style",
  "cá tính": "unique edgy streetwear design, expressive individualistic art",
  "vượt thời gian": "timeless classic design, iconic simple branding",
};

function translatePrompt(prompt: string): string {
  let r = prompt.toLowerCase().trim();
  const sorted = Object.entries(VI_EN).sort((a, b) => b[0].length - a[0].length);
  for (const [vi, en] of sorted) { r = r.replaceAll(vi, en); }
  return r;
}

// ── T8star AI Gateway (primary — unlimited Flux) ─────────────
async function generateWithT8star(prompt: string, retries = 1): Promise<{ id: string; label: string; url: string }[]> {
  const enPrompt = translatePrompt(prompt);
  console.log(`🔤 T8star: "${prompt}" → "${enPrompt}"`);

  const t8Key = process.env.T8STAR_API_KEY;
  if (!t8Key) return [];

  const fullPrompt = `${enPrompt}, professional t-shirt graphic design, high-fidelity vector illustration style, isolated on solid white background, flat 2D vector art, clean sharp lines, vibrant color palette, professional streetwear brand identity, student class uniform mascot aesthetic, high resolution, masterpiece, no realistic shadows, printable screen-print design, centered composition, high-end merchandise quality`;

  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      if (attempt > 0) console.log(`🔄 T8star retry ${attempt}...`);
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 30000);
      const res = await fetch(T8STAR_URL, {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${t8Key}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: T8STAR_MODEL,
          prompt: fullPrompt,
          n: 1,
          size: "512x512",
          response_format: "b64_json",
        }),
        signal: controller.signal,
      });
      clearTimeout(timeout);

      if (!res.ok) {
        const text = await res.text().catch(() => "");
        console.log(`❌ T8star HTTP ${res.status}: ${text.slice(0, 200)}`);
        if (attempt < retries) continue;
        return [];
      }

      const data = await res.json();

      if (data.data && data.data.length > 0) {
        const images = data.data.map((img: { url?: string; b64_json?: string }, i: number) => ({
          id: `t8-${Date.now()}-${i}`,
          label: "AI Design",
          url: img.b64_json
            ? `data:image/png;base64,${img.b64_json}`
            : img.url || "",
        })).filter((img: { url: string }) => img.url);
        console.log(`✅ T8star: ${images.length} images (attempt ${attempt + 1})`);
        return images;
      } else {
        console.log(`❌ T8star no images:`, JSON.stringify(data).slice(0, 200));
        if (attempt < retries) continue;
      }
    } catch (err) {
      const msg = (err as Error).message?.slice(0, 100) || "unknown";
      console.log(`❌ T8star attempt ${attempt + 1} failed: ${msg}`);
      if (attempt < retries) continue;
    }
  }
  return [];
}

// ── Cloudflare AI (fallback) ─────────────────────────────────
async function generateWithCloudflare(prompt: string) {
  const enPrompt = translatePrompt(prompt);
  console.log(`🔤 CF: "${prompt}" → "${enPrompt}"`);

  const styles = [
    { label: "Original", suffix: ", high quality, detailed, vibrant colors" },
    { label: "Minimal", suffix: ", minimalist flat vector, clean simple shapes" },
    { label: "Cartoon", suffix: ", cartoon illustration, cute colorful, playful" },
    { label: "Streetwear", suffix: ", streetwear graphic art, bold urban, high contrast" },
  ];

  const cfAccountId = process.env.CF_ACCOUNT_ID || "";
  const cfToken = process.env.CF_API_TOKEN || "";

  const images: { id: string; label: string; url: string }[] = [];
  for (const style of styles) {
    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 8000);
      const res = await fetch(
        `https://api.cloudflare.com/client/v4/accounts/${cfAccountId}/ai/run/${CF_MODEL}`,
        {
          method: "POST",
          headers: {
            "Authorization": `Bearer ${cfToken}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            prompt: `${enPrompt}, t-shirt graphic design, isolated on transparent background, no background, PNG with alpha transparency, centered${style.suffix}`,
          }),
          signal: controller.signal,
        }
      );
      clearTimeout(timeout);
      const data = await res.json();
      if (data.result?.image) {
        images.push({
          id: `cf-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
          label: style.label,
          url: `data:image/jpeg;base64,${data.result.image}`,
        });
        console.log(`✅ CF ${style.label} OK`);
        if (images.length >= 1) break;
      } else {
        console.log(`❌ CF ${style.label}: no image in response`, JSON.stringify(data).slice(0, 200));
      }
    } catch (err) {
      console.log(`❌ CF ${style.label} error:`, (err as Error).message?.slice(0, 100));
    }
  }

  return images;
}
// Rate limiter: max RATE_LIMIT_PER_MINUTE generates per minute per IP
const genLimiter = new Map<string, { count: number; resetAt: number }>();

// ── Background removal via remove.bg ─────────────────────────
async function removeBackground(base64Image: string): Promise<string> {
  const apiKey = process.env.REMOVE_BG_API_KEY;
  if (!apiKey) {
    console.log("⚠️ No REMOVE_BG_API_KEY, skipping background removal");
    return base64Image;
  }

  try {
    // Strip data URI prefix if present
    const rawBase64 = base64Image.replace(/^data:image\/[a-z]+;base64,/, "");

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 15000);

    const res = await fetch("https://api.remove.bg/v1.0/removebg", {
      method: "POST",
      headers: {
        "X-Api-Key": apiKey,
        "Content-Type": "application/json",
        "Accept": "application/json",
      },
      body: JSON.stringify({
        image_file_b64: rawBase64,
        size: "preview", // free tier: up to 625x400
        type: "auto",
        format: "png",
      }),
      signal: controller.signal,
    });
    clearTimeout(timeout);

    if (!res.ok) {
      const errText = await res.text().catch(() => "");
      console.log(`❌ remove.bg HTTP ${res.status}: ${errText.slice(0, 200)}`);
      return base64Image; // fallback to original
    }

    const data = await res.json();
    if (data.data?.result_b64) {
      console.log("✅ Background removed successfully");
      return `data:image/png;base64,${data.data.result_b64}`;
    }

    console.log("❌ remove.bg: no result_b64 in response");
    return base64Image;
  } catch (err) {
    console.log(`❌ remove.bg error: ${(err as Error).message?.slice(0, 100)}`);
    return base64Image; // fallback to original
  }
}

async function processImages(images: { id: string; label: string; url: string }[]): Promise<{ id: string; label: string; url: string }[]> {
  // Process all images in parallel for speed
  return Promise.all(
    images.map(async (img) => {
      if (img.url.startsWith("data:image/")) {
        const cleaned = await removeBackground(img.url);
        return { ...img, url: cleaned };
      }
      return img;
    })
  );
}

export async function POST(req: NextRequest) {
  try {
    // Rate limiting
    const ip = req.headers.get("x-forwarded-for") || req.headers.get("x-real-ip") || "unknown";
    const now = Date.now();
    const entry = genLimiter.get(ip);
    if (entry && now < entry.resetAt && entry.count >= RATE_LIMIT_PER_MINUTE) {
      return NextResponse.json({ error: "Quá nhiều yêu cầu. Vui lòng đợi 1 phút." }, { status: 429 });
    }
    if (!entry || now > (entry?.resetAt ?? 0)) {
      genLimiter.set(ip, { count: 1, resetAt: now + 60_000 });
    } else {
      entry.count++;
    }

    const { prompt } = await req.json();
    if (!prompt || typeof prompt !== "string") {
      return NextResponse.json({ error: "Prompt is required" }, { status: 400 });
    }

    // Sanitize: strip HTML, limit length
    const cleanPrompt = prompt.replace(/<[^>]*>/g, "").trim().slice(0, 200);
    if (!cleanPrompt) {
      return NextResponse.json({ error: "Prompt is required" }, { status: 400 });
    }

    // Priority 1: T8star (unlimited Flux)
    const t8Key = process.env.T8STAR_API_KEY;
    if (t8Key) {
      console.log(`🔑 T8star key: ${t8Key.slice(0, 8)}...`);
      try {
        const images = await generateWithT8star(cleanPrompt);
        if (images.length > 0) {
          const processed = await processImages(images);
          return NextResponse.json({ images: processed, isDemo: false, method: "t8star" });
        }
      } catch (e) {
        console.log("T8star failed:", (e as Error).message?.slice(0, 100));
      }
    }

    // Priority 2: Cloudflare (daily limit)
    const accountId = process.env.CF_ACCOUNT_ID;
    const apiToken = process.env.CF_API_TOKEN;
    if (accountId && apiToken) {
      console.log(`🔑 CF env: ${accountId.slice(0, 8)}...`);
      try {
        const images = await generateWithCloudflare(cleanPrompt);
        if (images.length > 0) {
          const processed = await processImages(images);
          return NextResponse.json({ images: processed, isDemo: false, method: "cloudflare" });
        }
      } catch (e) {
        console.log("CF failed:", (e as Error).message?.slice(0, 100));
      }
    }

    // Fallback: Smart SVG
    return NextResponse.json({
      images: getSmartSVG(cleanPrompt),
      isDemo: false,
      method: "smart",
    });

  } catch (error) {
    console.error("API Error:", error);
    return NextResponse.json({ error: "Failed to generate designs" }, { status: 500 });
  }
}


// ═══════════════════════════════════════════════════════════════
// Smart SVG Fallback — Keyword-based, draws actual shapes
// ═══════════════════════════════════════════════════════════════
function getSmartSVG(prompt: string) {
  const p = prompt.toLowerCase();
  const t = prompt.length > 12 ? prompt.slice(0, 12) : prompt;

  const seed = Date.now();

  // ── Keyword detection ──────────────────────────────────────
  const is = (keys: string[]) => keys.some(k => p.includes(k));

  if (is(["trái tim", "heart", "love", "tim", "yêu"])) {
    return makeSVGs(seed, [
      { label: "Heart Gradient", shape: `<defs><linearGradient id="hg" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stop-color="#ff6b6b"/><stop offset="100%" stop-color="#ee5a24"/></linearGradient></defs><path d="M100 170 C60 130 20 100 20 70 C20 40 50 20 75 20 C90 20 100 32 100 32 C100 32 110 20 125 20 C150 20 180 40 180 70 C180 100 140 130 100 170Z" fill="url(#hg)"/>` },
      { label: "Double Heart", shape: `<path d="M70 120 C50 100 20 88 20 68 C20 52 38 40 55 40 C63 40 70 46 70 46 C70 46 77 40 85 40 C102 40 120 52 120 68 C120 88 90 100 70 120Z" fill="#ff6b6b"/><path d="M130 130 C110 112 85 100 85 80 C85 64 100 52 115 52 C122 52 128 58 130 58 C132 58 138 52 145 52 C160 52 175 64 175 80 C175 100 150 112 130 130Z" fill="#fd79a8"/>` },
      { label: "Heart Outline", shape: `<path d="M100 165 C60 128 18 98 18 68 C18 42 42 22 68 22 C82 22 94 30 100 38 C106 30 118 22 132 22 C158 22 182 42 182 68 C182 98 140 128 100 165Z" fill="none" stroke="#e84393" stroke-width="6"/><path d="M100 148 C65 114 35 88 35 68 C35 50 52 38 68 38 C80 38 90 44 100 54 C110 44 120 38 132 38 C148 38 165 50 165 68 C165 88 135 114 100 148Z" fill="#fd79a8" opacity="0.3"/>` },
      { label: "Heart Neon", shape: `<defs><filter id="neon"><feGaussianBlur stdDeviation="4" result="blur"/><feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge></filter></defs><path d="M100 165 C62 130 22 100 22 70 C22 44 46 24 72 24 C86 24 98 32 100 32 C102 32 114 24 128 24 C154 24 178 44 178 70 C178 100 138 130 100 165Z" fill="none" stroke="#ff00ff" stroke-width="4" filter="url(#neon)"/>` },
      { label: "Heart + Text", shape: `<defs><linearGradient id="hg2" x1="0" y1="0" x2="1" y2="1"><stop offset="0%" stop-color="#ff6b6b"/><stop offset="100%" stop-color="#6c5ce7"/></linearGradient></defs><path d="M100 155 C65 120 28 94 28 68 C28 46 48 28 72 28 C84 28 95 36 100 42 C105 36 116 28 128 28 C152 28 172 46 172 68 C172 94 135 120 100 155Z" fill="url(#hg2)"/><text x="100" y="188" text-anchor="middle" fill="#ff6b6b" font-family="Arial" font-weight="bold" font-size="16">${t}</text>` },
      { label: "Heart Badge", shape: `<path d="M100 160 C64 126 24 98 24 68 C24 44 46 26 70 26 C84 26 96 34 100 40 C104 34 116 26 130 26 C154 26 176 44 176 68 C176 98 136 126 100 160Z" fill="#e84393"/><path d="M100 138 C75 114 50 94 50 76 C50 62 62 54 76 54 C86 54 94 60 100 66 C106 60 114 54 124 54 C138 54 150 62 150 76 C150 94 125 114 100 138Z" fill="rgba(255,255,255,0.25)"/><text x="100" y="106" text-anchor="middle" fill="white" font-family="Arial" font-weight="bold" font-size="14">${t}</text>` },
    ]);
  }

  if (is(["rồng", "dragon", "long"])) {
    return makeSVGs(seed, [
      { label: "Dragon Head", shape: `<defs><linearGradient id="dg" x1="0" y1="0" x2="1" y2="1"><stop offset="0%" stop-color="#e17055"/><stop offset="100%" stop-color="#d63031"/></linearGradient></defs><ellipse cx="100" cy="100" rx="75" ry="60" fill="url(#dg)"/><polygon points="100,20 85,55 115,55" fill="#fdcb6e"/><polygon points="55,40 65,70 80,55" fill="#fdcb6e"/><polygon points="145,40 135,70 120,55" fill="#fdcb6e"/><circle cx="80" cy="90" r="10" fill="#2d3436"/><circle cx="120" cy="90" r="10" fill="#2d3436"/><circle cx="83" cy="87" r="4" fill="#fdcb6e"/><circle cx="123" cy="87" r="4" fill="#fdcb6e"/><path d="M70 120 Q100 140 130 120" fill="none" stroke="#fdcb6e" stroke-width="3"/>` },
      { label: "Dragon Flame", shape: `<defs><linearGradient id="fg" x1="0.5" y1="1" x2="0.5" y2="0"><stop offset="0%" stop-color="#d63031"/><stop offset="50%" stop-color="#f39c12"/><stop offset="100%" stop-color="#f1c40f"/></linearGradient></defs><path d="M100 20 C120 55 165 70 155 115 C150 140 132 158 120 162 C126 140 118 120 100 108 C82 120 74 140 80 162 C68 158 50 140 45 115 C35 70 80 55 100 20Z" fill="url(#fg)"/><ellipse cx="100" cy="158" rx="28" ry="8" fill="rgba(214,48,49,0.2)"/>` },
      { label: "Dragon Scale", shape: `<defs><radialGradient id="sg"><stop offset="0%" stop-color="#6c5ce7"/><stop offset="100%" stop-color="#2d3436"/></radialGradient></defs><circle cx="100" cy="100" r="85" fill="url(#sg)"/>${Array.from({ length: 4 }, (_, row) => Array.from({ length: 5 }, (_, col) => { const x = 40 + col * 32 - (row % 2) * 16, y = 40 + row * 32; return `<path d="M${x} ${y} Q${x + 16} ${y - 12} ${x + 32} ${y} Q${x + 16} ${y + 4} ${x} ${y}Z" fill="rgba(255,255,255,0.12)" stroke="rgba(255,255,255,0.2)" stroke-width="0.5"/>` }).join('')).join('')}<text x="100" y="170" text-anchor="middle" fill="#fdcb6e" font-family="Arial" font-weight="bold" font-size="14">${t}</text>` },
      { label: "Dragon Eye", shape: `<defs><radialGradient id="eg"><stop offset="0%" stop-color="#f39c12"/><stop offset="60%" stop-color="#e17055"/><stop offset="100%" stop-color="#2d3436"/></radialGradient></defs><circle cx="100" cy="100" r="80" fill="url(#eg)"/><ellipse cx="100" cy="100" rx="30" ry="45" fill="#2d3436"/><ellipse cx="100" cy="100" rx="15" ry="30" fill="#e17055" opacity="0.5"/><circle cx="100" cy="100" r="10" fill="#fdcb6e"/><line x1="20" y1="100" x2="180" y2="100" stroke="rgba(253,203,110,0.3)" stroke-width="1"/>` },
      { label: "Dragon Badge", shape: `<defs><linearGradient id="dbg" x1="0.5" y1="0" x2="0.5" y2="1"><stop offset="0%" stop-color="#e17055"/><stop offset="100%" stop-color="#d63031"/></linearGradient></defs><path d="M100 15 L175 50 L175 110 Q175 160 100 190 Q25 160 25 110 L25 50Z" fill="url(#dbg)"/><ellipse cx="100" cy="90" rx="40" ry="30" fill="rgba(253,203,110,0.3)"/><path d="M70 75 Q100 95 130 75" fill="none" stroke="#fdcb6e" stroke-width="2"/><circle cx="84" cy="83" r="6" fill="#2d3436"/><circle cx="116" cy="83" r="6" fill="#2d3436"/><text x="100" y="130" text-anchor="middle" fill="#fdcb6e" font-family="Arial" font-weight="bold" font-size="14">${t}</text>` },
      { label: "Dragon Text", shape: `<defs><linearGradient id="dtg" x1="0" y1="0" x2="1" y2="1"><stop offset="0%" stop-color="#f39c12"/><stop offset="100%" stop-color="#d63031"/></linearGradient></defs><path d="M30 50 C20 80 20 120 30 150 C40 170 60 160 100 155 C140 160 160 170 170 150 C180 120 180 80 170 50 C155 30 130 15 100 15 C70 15 45 30 30 50Z" fill="url(#dtg)"/><text x="100" y="108" text-anchor="middle" fill="white" font-family="Arial" font-weight="bold" font-size="20">${t}</text>` },
    ]);
  }

  // ── Sunflower ─────────────────────────────────────────────
  if (is(["hướng dương", "sunflower", "huong duong"])) {
    return makeSVGs(seed, [
      { label: "Sunflower", shape: `${Array.from({ length: 16 }, (_, i) => { const a = i * 22.5; const x = 100 + 68 * Math.cos(a * Math.PI / 180), y = 100 + 68 * Math.sin(a * Math.PI / 180); return `<ellipse cx="${x}" cy="${y}" rx="10" ry="22" fill="#f1c40f" transform="rotate(${a} ${x} ${y})"/>` }).join('')}<circle cx="100" cy="100" r="35" fill="#8B4513"/><circle cx="100" cy="100" r="28" fill="#5D2E0C"/>${Array.from({ length: 12 }, (_, i) => { const a = i * 30; const x = 100 + 18 * Math.cos(a * Math.PI / 180), y = 100 + 18 * Math.sin(a * Math.PI / 180); return `<circle cx="${x}" cy="${y}" r="4" fill="#f1c40f" opacity="0.7"/>` }).join('')}` },
      { label: "Sunflower Duo", shape: `${Array.from({ length: 12 }, (_, i) => { const a = i * 30; const x = 70 + 45 * Math.cos(a * Math.PI / 180), y = 80 + 45 * Math.sin(a * Math.PI / 180); return `<ellipse cx="${x}" cy="${y}" rx="8" ry="18" fill="#f1c40f" transform="rotate(${a} ${x} ${y})"/>` }).join('')}<circle cx="70" cy="80" r="24" fill="#5D2E0C"/>${Array.from({ length: 10 }, (_, i) => { const a = i * 36; const x = 145 + 40 * Math.cos(a * Math.PI / 180), y = 120 + 40 * Math.sin(a * Math.PI / 180); return `<ellipse cx="${x}" cy="${y}" rx="7" ry="16" fill="#fdcb6e" transform="rotate(${a} ${x} ${y})"/>` }).join('')}<circle cx="145" cy="120" r="20" fill="#6B3A2A"/>` },
      { label: "Sunflower Badge", shape: `<circle cx="100" cy="100" r="88" fill="#fff9e6"/><circle cx="100" cy="100" r="88" fill="none" stroke="#f1c40f" stroke-width="4"/>${Array.from({ length: 14 }, (_, i) => { const a = i * 25.7; const x = 100 + 68 * Math.cos(a * Math.PI / 180), y = 100 + 68 * Math.sin(a * Math.PI / 180); return `<ellipse cx="${x}" cy="${y}" rx="9" ry="20" fill="#f39c12" transform="rotate(${a} ${x} ${y})"/>` }).join('')}<circle cx="100" cy="100" r="32" fill="#7B3F00"/>` },
      { label: "Sunflower Minimal", shape: `${Array.from({ length: 8 }, (_, i) => { const a = i * 45; const x = 100 + 60 * Math.cos(a * Math.PI / 180), y = 100 + 60 * Math.sin(a * Math.PI / 180); return `<ellipse cx="${x}" cy="${y}" rx="12" ry="28" fill="#f1c40f" opacity="0.9" transform="rotate(${a} ${x} ${y})"/>` }).join('')}<circle cx="100" cy="100" r="28" fill="#4A2106"/><line x1="100" y1="128" x2="100" y2="185" stroke="#27ae60" stroke-width="4"/><ellipse cx="80" cy="175" rx="22" ry="10" fill="#27ae60" opacity="0.6"/>` },
      { label: "Sunflower Field", shape: `${[{ cx: 65, cy: 140, r: 28 }, { cx: 100, cy: 120, r: 36 }, { cx: 140, cy: 138, r: 26 }].map(f => `${Array.from({ length: 10 }, (_, i) => { const a = i * 36; const x = f.cx + f.r * Math.cos(a * Math.PI / 180), y = f.cy + f.r * Math.sin(a * Math.PI / 180); return `<ellipse cx="${x}" cy="${y}" rx="6" ry="14" fill="#f1c40f" transform="rotate(${a} ${x} ${y})"/>` }).join('')}<circle cx="${f.cx}" cy="${f.cy}" r="${f.r * 0.6}" fill="#5D2E0C"/>`).join('')}` },
      { label: "Sunflower + Text", shape: `${Array.from({ length: 14 }, (_, i) => { const a = i * 25.7; const x = 100 + 60 * Math.cos(a * Math.PI / 180), y = 85 + 60 * Math.sin(a * Math.PI / 180); return `<ellipse cx="${x}" cy="${y}" rx="9" ry="20" fill="#f1c40f" transform="rotate(${a} ${x} ${y})"/>` }).join('')}<circle cx="100" cy="85" r="28" fill="#6B3A2A"/><text x="100" y="165" text-anchor="middle" fill="#f39c12" font-family="Arial" font-weight="bold" font-size="15">${t}</text>` },
    ]);
  }

  // ── Sakura / Cherry Blossom ────────────────────────────────
  if (is(["sakura", "anh đào", "hoa đào", "cherry blossom", "đào", "cherry"])) {
    return makeSVGs(seed, [
      { label: "Sakura Branch", shape: `<line x1="40" y1="180" x2="160" y2="60" stroke="#8B4B62" stroke-width="5"/><line x1="100" y1="120" x2="165" y2="105" stroke="#8B4B62" stroke-width="3"/><line x1="80" y1="140" x2="45" y2="110" stroke="#8B4B62" stroke-width="3"/>${Array.from({ length: 6 }, (_, i) => { const cx = [90, 130, 158, 50, 120, 75][i], cy = [55, 80, 105, 115, 130, 165][i]; return Array.from({ length: 5 }, (_, j) => { const a = j * 72 - 90; const px = cx + 18 * Math.cos(a * Math.PI / 180), py = cy + 18 * Math.sin(a * Math.PI / 180); return `<ellipse cx="${px}" cy="${py}" rx="10" ry="14" fill="#ffb7c5" opacity="0.9" transform="rotate(${a + 90} ${px} ${py})"/>` }).join('') + `<circle cx="${cx}" cy="${cy}" r="6" fill="#ffe5ec"/>` }).join('')}` },
      { label: "Sakura Bloom", shape: `${Array.from({ length: 5 }, (_, i) => { const a = i * 72 - 90; const px = 100 + 55 * Math.cos(a * Math.PI / 180), py = 100 + 55 * Math.sin(a * Math.PI / 180); return `<ellipse cx="${px}" cy="${py}" rx="22" ry="32" fill="#ffb7c5" opacity="0.85" transform="rotate(${a + 90} ${px} ${py})"/>` }).join('')}<circle cx="100" cy="100" r="18" fill="#ffe5ec"/>${Array.from({ length: 5 }, (_, i) => { const a = i * 72 - 90; const px = 100 + 18 * Math.cos(a * Math.PI / 180), py = 100 + 18 * Math.sin(a * Math.PI / 180); return `<line x1="100" y1="100" x2="${px}" y2="${py}" stroke="#e84393" stroke-width="1.5"/><circle cx="${px}" cy="${py}" r="3" fill="#e84393"/>` }).join('')}` },
      { label: "Sakura Scatter", shape: `${Array.from({ length: 5 }, (_, i) => { const cx = [55, 140, 95, 35, 160][i], cy = [50, 40, 100, 145, 140][i]; return Array.from({ length: 5 }, (_, j) => { const a = j * 72 - 90; const px = cx + 14 * Math.cos(a * Math.PI / 180), py = cy + 14 * Math.sin(a * Math.PI / 180); return `<ellipse cx="${px}" cy="${py}" rx="8" ry="11" fill="#ffb7c5" opacity="0.8" transform="rotate(${a + 90} ${px} ${py})"/>` }).join('') + `<circle cx="${cx}" cy="${cy}" r="4" fill="#ffe5ec"/>` }).join('')}${Array.from({ length: 8 }, (_, i) => { const x = 20 + i * 22, y = 160 + Math.sin(i * 1.2) * 8; return `<ellipse cx="${x}" cy="${y}" rx="6" ry="8" fill="#ffb7c5" opacity="0.5" transform="rotate(${i * 45} ${x} ${y})"/>` }).join('')}` },
      { label: "Sakura Circle", shape: `<circle cx="100" cy="100" r="85" fill="#fff0f5"/>${Array.from({ length: 8 }, (_, i) => { const a = i * 45; const cx = 100 + 62 * Math.cos(a * Math.PI / 180), cy = 100 + 62 * Math.sin(a * Math.PI / 180); return Array.from({ length: 5 }, (_, j) => { const pa = j * 72 - 90; const px = cx + 12 * Math.cos(pa * Math.PI / 180), py = cy + 12 * Math.sin(pa * Math.PI / 180); return `<ellipse cx="${px}" cy="${py}" rx="6" ry="9" fill="#ffb7c5" opacity="0.8" transform="rotate(${pa + 90} ${px} ${py})"/>` }).join('') + `<circle cx="${cx}" cy="${cy}" r="4" fill="#ffe5ec"/>` }).join('')}<circle cx="100" cy="100" r="22" fill="#ffb7c5"/><circle cx="100" cy="100" r="14" fill="#ffe5ec"/>` },
      { label: "Sakura Minimal", shape: `${Array.from({ length: 5 }, (_, i) => { const a = i * 72 - 90; const px = 100 + 50 * Math.cos(a * Math.PI / 180), py = 100 + 50 * Math.sin(a * Math.PI / 180); return `<ellipse cx="${px}" cy="${py}" rx="18" ry="26" fill="none" stroke="#e84393" stroke-width="2" opacity="0.7" transform="rotate(${a + 90} ${px} ${py})"/>` }).join('')}<circle cx="100" cy="100" r="16" fill="none" stroke="#e84393" stroke-width="2"/>` },
      { label: "Sakura + Text", shape: `${Array.from({ length: 5 }, (_, i) => { const a = i * 72 - 90; const px = 100 + 52 * Math.cos(a * Math.PI / 180), py = 85 + 52 * Math.sin(a * Math.PI / 180); return `<ellipse cx="${px}" cy="${py}" rx="20" ry="28" fill="#ffb7c5" opacity="0.85" transform="rotate(${a + 90} ${px} ${py})"/>` }).join('')}<circle cx="100" cy="85" r="16" fill="#ffe5ec"/><text x="100" y="165" text-anchor="middle" fill="#e84393" font-family="Arial" font-weight="bold" font-size="15">${t}</text>` },
    ]);
  }

  // ── Rose ──────────────────────────────────────────────────
  if (is(["hoa hồng", "rose"])) {
    return makeSVGs(seed, [
      { label: "Rose Bloom", shape: `<defs><radialGradient id="rg"><stop offset="0%" stop-color="#fdcb6e"/><stop offset="40%" stop-color="#fd79a8"/><stop offset="100%" stop-color="#d63031"/></radialGradient></defs><circle cx="100" cy="100" r="70" fill="url(#rg)"/>${Array.from({ length: 5 }, (_, i) => { const a = i * 72 - 90; const r = 55; const x = 100 + r * Math.cos(a * Math.PI / 180), y = 100 + r * Math.sin(a * Math.PI / 180); return `<ellipse cx="${x}" cy="${y}" rx="18" ry="28" fill="rgba(214,48,49,0.6)" transform="rotate(${a + 90} ${x} ${y})"/>` }).join('')}<circle cx="100" cy="100" r="22" fill="#fdcb6e"/>` },
      { label: "Rose Outline", shape: `${Array.from({ length: 5 }, (_, i) => { const a = i * 72 - 90; const r = 55; const x = 100 + r * Math.cos(a * Math.PI / 180), y = 100 + r * Math.sin(a * Math.PI / 180); return `<ellipse cx="${x}" cy="${y}" rx="18" ry="28" fill="none" stroke="#d63031" stroke-width="2" transform="rotate(${a + 90} ${x} ${y})"/>` }).join('')}<circle cx="100" cy="100" r="22" fill="none" stroke="#d63031" stroke-width="2"/>` },
      { label: "Rose + Stem", shape: `${Array.from({ length: 5 }, (_, i) => { const a = i * 72 - 90; const r = 45; const x = 90 + r * Math.cos(a * Math.PI / 180), y = 80 + r * Math.sin(a * Math.PI / 180); return `<ellipse cx="${x}" cy="${y}" rx="16" ry="24" fill="#d63031" opacity="0.85" transform="rotate(${a + 90} ${x} ${y})"/>` }).join('')}<circle cx="90" cy="80" r="18" fill="#e84393"/><line x1="90" y1="125" x2="90" y2="185" stroke="#27ae60" stroke-width="4"/><ellipse cx="70" cy="165" rx="22" ry="10" fill="#27ae60" opacity="0.6"/>` },
    ]);
  }

  // ── Lotus / Sen ────────────────────────────────────────────
  if (is(["hoa sen", "sen", "lotus"])) {
    return makeSVGs(seed, [
      { label: "Lotus Bloom", shape: `<defs><linearGradient id="lfg" x1="0.5" y1="0" x2="0.5" y2="1"><stop offset="0%" stop-color="#fd79a8"/><stop offset="100%" stop-color="#e84393"/></linearGradient></defs>${Array.from({ length: 8 }, (_, i) => { const a = i * 45; const x = 100 + 55 * Math.sin(a * Math.PI / 180), y = 100 - 55 * Math.cos(a * Math.PI / 180); return `<ellipse cx="${(100 + x) / 2}" cy="${(100 + y) / 2}" rx="20" ry="35" fill="url(#lfg)" opacity="0.85" transform="rotate(${a} 100 100)"/>` }).join('')}<circle cx="100" cy="100" r="20" fill="#fdcb6e"/>` },
      { label: "Lotus Minimal", shape: `<defs><linearGradient id="lmg" x1="0.5" y1="0" x2="0.5" y2="1"><stop offset="0%" stop-color="#fd79a8"/><stop offset="100%" stop-color="#e84393"/></linearGradient></defs><path d="M100 160 Q60 130 40 90 Q60 95 100 110 Q140 95 160 90 Q140 130 100 160Z" fill="url(#lmg)" opacity="0.9"/><path d="M100 145 Q55 110 50 70 Q70 85 100 100 Q130 85 150 70 Q145 110 100 145Z" fill="url(#lmg)" opacity="0.7"/><path d="M100 130 Q65 100 70 55 Q85 75 100 90 Q115 75 130 55 Q135 100 100 130Z" fill="url(#lmg)" opacity="0.9"/><line x1="100" y1="160" x2="100" y2="185" stroke="#00b894" stroke-width="3"/><ellipse cx="80" cy="180" rx="25" ry="12" fill="#00b894" opacity="0.5"/>` },
    ]);
  }

  // ── Generic flower ─────────────────────────────────────────
  if (is(["hoa", "flower"])) {
    return makeSVGs(seed, [
      { label: "Lotus Bloom", shape: `<defs><linearGradient id="lfg" x1="0.5" y1="0" x2="0.5" y2="1"><stop offset="0%" stop-color="#fd79a8"/><stop offset="100%" stop-color="#e84393"/></linearGradient></defs>${Array.from({ length: 8 }, (_, i) => { const a = i * 45; const x = 100 + 55 * Math.sin(a * Math.PI / 180), y = 100 - 55 * Math.cos(a * Math.PI / 180); return `<ellipse cx="${(100 + x) / 2}" cy="${(100 + y) / 2}" rx="20" ry="35" fill="url(#lfg)" opacity="0.85" transform="rotate(${a} 100 100)"/>` }).join('')}<circle cx="100" cy="100" r="20" fill="#fdcb6e"/>` },
      { label: "Sunflower", shape: `${Array.from({ length: 16 }, (_, i) => { const a = i * 22.5; const x = 100 + 68 * Math.cos(a * Math.PI / 180), y = 100 + 68 * Math.sin(a * Math.PI / 180); return `<ellipse cx="${x}" cy="${y}" rx="10" ry="22" fill="#f1c40f" transform="rotate(${a} ${x} ${y})"/>` }).join('')}<circle cx="100" cy="100" r="35" fill="#8B4513"/><circle cx="100" cy="100" r="28" fill="#5D2E0C"/>` },
      { label: "Rose", shape: `<defs><radialGradient id="rg"><stop offset="0%" stop-color="#fdcb6e"/><stop offset="40%" stop-color="#fd79a8"/><stop offset="100%" stop-color="#d63031"/></radialGradient></defs><circle cx="100" cy="100" r="70" fill="url(#rg)"/>${Array.from({ length: 5 }, (_, i) => { const a = i * 72 - 90; const r = 55; const x = 100 + r * Math.cos(a * Math.PI / 180), y = 100 + r * Math.sin(a * Math.PI / 180); return `<ellipse cx="${x}" cy="${y}" rx="18" ry="28" fill="rgba(214,48,49,0.6)" transform="rotate(${a + 90} ${x} ${y})"/>` }).join('')}<circle cx="100" cy="100" r="22" fill="#fdcb6e"/>` },
      { label: "Sakura", shape: `${Array.from({ length: 5 }, (_, i) => { const a = i * 72 - 90; const px = 100 + 55 * Math.cos(a * Math.PI / 180), py = 100 + 55 * Math.sin(a * Math.PI / 180); return `<ellipse cx="${px}" cy="${py}" rx="22" ry="32" fill="#ffb7c5" opacity="0.85" transform="rotate(${a + 90} ${px} ${py})"/>` }).join('')}<circle cx="100" cy="100" r="18" fill="#ffe5ec"/>` },
      { label: "Flower Badge", shape: `<circle cx="100" cy="100" r="85" fill="#fff0f5"/><circle cx="100" cy="100" r="85" fill="none" stroke="#e84393" stroke-width="3"/>${Array.from({ length: 8 }, (_, i) => { const a = i * 45; const px = 100 + 58 * Math.cos(a * Math.PI / 180), py = 100 + 58 * Math.sin(a * Math.PI / 180); return `<circle cx="${px}" cy="${py}" r="18" fill="#fd79a8" opacity="0.7"/>` }).join('')}<circle cx="100" cy="100" r="25" fill="#fdcb6e"/>` },
      { label: "Flower + Text", shape: `${Array.from({ length: 8 }, (_, i) => { const a = i * 45; const px = 100 + 52 * Math.cos(a * Math.PI / 180), py = 88 + 52 * Math.sin(a * Math.PI / 180); return `<circle cx="${px}" cy="${py}" r="16" fill="#fd79a8" opacity="0.75"/>` }).join('')}<circle cx="100" cy="88" r="24" fill="#fdcb6e"/><text x="100" y="162" text-anchor="middle" fill="#e84393" font-family="Arial" font-weight="bold" font-size="14">${t}</text>` },
    ]);
  }

  if (is(["sao", "star", "ngôi sao"])) {
    return makeSVGs(seed, [
      { label: "Star Gold", shape: `<defs><linearGradient id="sg" x1="0.5" y1="0" x2="0.5" y2="1"><stop offset="0%" stop-color="#f1c40f"/><stop offset="100%" stop-color="#f39c12"/></linearGradient></defs><polygon points="100,10 125,75 195,75 138,118 158,185 100,145 42,185 62,118 5,75 75,75" fill="url(#sg)"/>` },
      { label: "Star Neon", shape: `<defs><filter id="glow"><feGaussianBlur stdDeviation="5" result="blur"/><feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge></filter></defs><polygon points="100,10 125,75 195,75 138,118 158,185 100,145 42,185 62,118 5,75 75,75" fill="none" stroke="#f1c40f" stroke-width="3" filter="url(#glow)"/>` },
      { label: "5 Stars", shape: `${[0, 1, 2, 3, 4].map(i => { const x = 35 + i * 34; return `<polygon points="${x},25 ${x + 7},18 ${x + 14},25 ${x + 6},32 ${x + 2},32" fill="#f1c40f"/>` }).join('')}<polygon points="100,55 120,105 175,105 132,135 148,185 100,158 52,185 68,135 25,105 80,105" fill="#f39c12"/>` },
      { label: "Star Badge", shape: `<polygon points="100,10 125,75 195,75 138,118 158,185 100,145 42,185 62,118 5,75 75,75" fill="#f39c12"/><polygon points="100,35 118,83 170,83 128,112 144,161 100,134 56,161 72,112 30,83 82,83" fill="rgba(255,255,255,0.2)"/><text x="100" y="110" text-anchor="middle" fill="white" font-family="Arial" font-weight="bold" font-size="18">${t}</text>` },
      { label: "Shooting Star", shape: `<defs><linearGradient id="stg" x1="0" y1="0" x2="1" y2="1"><stop offset="0%" stop-color="#f1c40f"/><stop offset="100%" stop-color="transparent"/></linearGradient></defs><polygon points="140,40 155,80 190,80 162,103 172,143 140,122 108,143 118,103 90,80 125,80" fill="#f1c40f"/><path d="M30 180 L138 42" stroke="url(#stg)" stroke-width="4" stroke-linecap="round"/><path d="M20 170 L100 60" stroke="rgba(241,196,15,0.4)" stroke-width="2" stroke-linecap="round"/>` },
      { label: "Star Pattern", shape: `${Array.from({ length: 7 }, (_, i) => { const r = i % 2 === 0 ? 50 : 25; const a = i * 51; const x = 100 + r * Math.cos(a * Math.PI / 180), y = 100 + r * Math.sin(a * Math.PI / 180); const s = i % 2 === 0 ? 22 : 14; return `<polygon points="${x},${y - s} ${x + s * 0.4},${y - s * 0.2} ${x + s * 0.9},${y - s * 0.3} ${x + s * 0.5},${y + s * 0.2} ${x + s * 0.7},${y + s * 0.8} ${x},${y + s * 0.5} ${x - s * 0.7},${y + s * 0.8} ${x - s * 0.5},${y + s * 0.2} ${x - s * 0.9},${y - s * 0.3} ${x - s * 0.4},${y - s * 0.2}" fill="#f1c40f" opacity="${0.5 + i * 0.07}"/>` }).join('')}` },
    ]);
  }

  if (is(["mặt trời", "sun", "sunshine"])) {
    return makeSVGs(seed, [
      { label: "Sun Burst", shape: `${Array.from({ length: 16 }, (_, i) => { const a = i * 22.5; const x1 = 100 + 45 * Math.cos(a * Math.PI / 180), y1 = 100 + 45 * Math.sin(a * Math.PI / 180), x2 = 100 + 80 * Math.cos(a * Math.PI / 180), y2 = 100 + 80 * Math.sin(a * Math.PI / 180); return `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="#f1c40f" stroke-width="${i % 2 === 0 ? 4 : 2}" stroke-linecap="round"/>` }).join('')}<circle cx="100" cy="100" r="42" fill="#f39c12"/><circle cx="100" cy="100" r="35" fill="#f1c40f"/>` },
      { label: "Sun Smile", shape: `${Array.from({ length: 12 }, (_, i) => { const a = i * 30; const x1 = 100 + 48 * Math.cos(a * Math.PI / 180), y1 = 100 + 48 * Math.sin(a * Math.PI / 180), x2 = 100 + 75 * Math.cos(a * Math.PI / 180), y2 = 100 + 75 * Math.sin(a * Math.PI / 180); return `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="#fdcb6e" stroke-width="3" stroke-linecap="round"/>` }).join('')}<circle cx="100" cy="100" r="45" fill="#f1c40f"/><circle cx="88" cy="92" r="6" fill="#e17055"/><circle cx="112" cy="92" r="6" fill="#e17055"/><path d="M82 114 Q100 128 118 114" fill="none" stroke="#e17055" stroke-width="4" stroke-linecap="round"/>` },
      { label: "Sun Neon", shape: `<defs><filter id="sn"><feGaussianBlur stdDeviation="5" result="blur"/><feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge></filter></defs>${Array.from({ length: 12 }, (_, i) => { const a = i * 30; const x1 = 100 + 50 * Math.cos(a * Math.PI / 180), y1 = 100 + 50 * Math.sin(a * Math.PI / 180), x2 = 100 + 85 * Math.cos(a * Math.PI / 180), y2 = 100 + 85 * Math.sin(a * Math.PI / 180); return `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="#ff6b00" stroke-width="3" stroke-linecap="round" filter="url(#sn)"/>` }).join('')}<circle cx="100" cy="100" r="38" fill="none" stroke="#ff9500" stroke-width="3" filter="url(#sn)"/>` },
      { label: "Sun Gradient", shape: `<defs><radialGradient id="sg2"><stop offset="0%" stop-color="#fff7ae"/><stop offset="40%" stop-color="#f1c40f"/><stop offset="100%" stop-color="#e67e22"/></radialGradient></defs>${Array.from({ length: 8 }, (_, i) => { const a = i * 45; const x = 100 + 68 * Math.cos(a * Math.PI / 180), y = 100 + 68 * Math.sin(a * Math.PI / 180); return `<polygon points="${x},${y - 16} ${x + 10},${y + 8} ${x - 10},${y + 8}" fill="#f39c12" transform="rotate(${a} ${x} ${y})"/>` }).join('')}<circle cx="100" cy="100" r="45" fill="url(#sg2)"/>` },
      { label: "Sun Badge", shape: `<circle cx="100" cy="100" r="88" fill="#fff9e6"/><circle cx="100" cy="100" r="88" fill="none" stroke="#f39c12" stroke-width="4"/>${Array.from({ length: 16 }, (_, i) => { const a = i * 22.5; const x1 = 100 + 60 * Math.cos(a * Math.PI / 180), y1 = 100 + 60 * Math.sin(a * Math.PI / 180), x2 = 100 + 82 * Math.cos(a * Math.PI / 180), y2 = 100 + 82 * Math.sin(a * Math.PI / 180); return `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="#f39c12" stroke-width="3" stroke-linecap="round"/>` }).join('')}<circle cx="100" cy="100" r="40" fill="#f1c40f"/><text x="100" y="106" text-anchor="middle" fill="white" font-family="Arial" font-weight="bold" font-size="16">SUN</text>` },
      { label: "Sunrise", shape: `<defs><linearGradient id="srg" x1="0.5" y1="1" x2="0.5" y2="0"><stop offset="0%" stop-color="#e74c3c"/><stop offset="50%" stop-color="#f39c12"/><stop offset="100%" stop-color="#f1c40f"/></linearGradient></defs><rect x="10" y="100" width="180" height="80" rx="4" fill="#2d3436" opacity="0.15"/><path d="M10 100 Q100 20 190 100" fill="url(#srg)"/>${Array.from({ length: 9 }, (_, i) => { const a = -180 + i * 22.5; const x1 = 100 + 60 * Math.cos(a * Math.PI / 180), y1 = 100 + 60 * Math.sin(a * Math.PI / 180); return `<line x1="100" y1="100" x2="${x1}" y2="${y1}" stroke="#f1c40f" stroke-width="2" stroke-linecap="round" opacity="0.6"/>` }).join('')}<circle cx="100" cy="100" r="28" fill="#f1c40f"/>` },
      { label: "Sun Vintage", shape: `<defs><filter id="sv"><feTurbulence type="fractalNoise" baseFrequency="0.8" numOctaves="4" result="n"/><feDisplacementMap in="SourceGraphic" in2="n" scale="2"/></filter></defs><circle cx="100" cy="100" r="85" fill="none" stroke="#e67e22" stroke-width="4" stroke-dasharray="5 3" filter="url(#sv)"/><circle cx="100" cy="100" r="76" fill="none" stroke="#e67e22" stroke-width="1.5"/>${Array.from({ length: 12 }, (_, i) => { const a = i * 30; const x1 = 100 + 42 * Math.cos(a * Math.PI / 180), y1 = 100 + 42 * Math.sin(a * Math.PI / 180), x2 = 100 + 65 * Math.cos(a * Math.PI / 180), y2 = 100 + 65 * Math.sin(a * Math.PI / 180); return `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="#e67e22" stroke-width="2" stroke-linecap="round"/>` }).join('')}<circle cx="100" cy="100" r="32" fill="#f39c12"/>` },
      { label: "Sun Kawaii", shape: `${Array.from({ length: 10 }, (_, i) => { const a = i * 36; const x = 100 + 62 * Math.cos(a * Math.PI / 180), y = 100 + 62 * Math.sin(a * Math.PI / 180); return `<circle cx="${x}" cy="${y}" r="14" fill="#fdcb6e"/>` }).join('')}<circle cx="100" cy="100" r="48" fill="#f1c40f"/><circle cx="85" cy="92" r="8" fill="white"/><circle cx="115" cy="92" r="8" fill="white"/><circle cx="85" cy="94" r="4" fill="#2d3436"/><circle cx="115" cy="94" r="4" fill="#2d3436"/><circle cx="87" cy="91" r="2" fill="white"/><circle cx="117" cy="91" r="2" fill="white"/><path d="M88 110 Q100 122 112 110" fill="#e17055" opacity="0.8"/><circle cx="74" cy="108" r="8" fill="#fdcb6e" opacity="0.5"/>` },
    ]);
  }

  if (is(["lửa", "fire", "flame", "ngọn lửa"])) {
    return makeSVGs(seed, [
      { label: "Flame", shape: `<defs><linearGradient id="flg" x1="0.5" y1="1" x2="0.5" y2="0"><stop offset="0%" stop-color="#d63031"/><stop offset="50%" stop-color="#f39c12"/><stop offset="100%" stop-color="#f1c40f"/></linearGradient></defs><path d="M100 18 C122 55 168 75 155 122 C148 148 130 162 118 166 C126 144 114 120 100 108 C86 120 74 144 82 166 C70 162 52 148 45 122 C32 75 78 55 100 18Z" fill="url(#flg)"/><ellipse cx="100" cy="160" rx="32" ry="10" fill="rgba(214,48,49,0.2)"/>` },
      { label: "Fire Ring", shape: `${Array.from({ length: 12 }, (_, i) => { const a = i * 30; const r = 70; const x = 100 + r * Math.cos(a * Math.PI / 180), y = 100 + r * Math.sin(a * Math.PI / 180); return `<path d="M${x} ${y} C${x + 10} ${y - 20} ${x + 5} ${y - 35} ${x} ${y - 25} C${x - 5} ${y - 35} ${x - 10} ${y - 20} ${x} ${y}Z" fill="#f39c12" transform="rotate(${a + 90} ${x} ${y})" opacity="0.8"/>` }).join('')}<circle cx="100" cy="100" r="25" fill="#d63031"/>` },
    ]);
  }

  if (is(["cầu vồng", "rainbow"])) {
    return makeSVGs(seed, [
      { label: "Rainbow", shape: `${["#d63031", "#e17055", "#f1c40f", "#00b894", "#0984e3", "#6c5ce7"].map((c, i) => `<path d="M${15 + i * 9} ${160 + i * 3} A${85 - i * 9} ${85 - i * 9} 0 0 1 ${185 - i * 9} ${160 + i * 3}" fill="none" stroke="${c}" stroke-width="8" stroke-linecap="round"/>`).join('')}<path d="M20 175 L40 175" stroke="#f1c40f" stroke-width="3"/><path d="M160 175 L180 175" stroke="#f1c40f" stroke-width="3"/>` },
    ]);
  }

  if (is(["bóng đá", "football", "soccer", "sport", "thể thao", "bóng rổ", "basketball"])) {
    return makeSVGs(seed, [
      { label: "Sport Badge", shape: `<defs><linearGradient id="sbg" x1="0.5" y1="0" x2="0.5" y2="1"><stop offset="0%" stop-color="#0984e3"/><stop offset="100%" stop-color="#2d3436"/></linearGradient></defs><path d="M100 15 L175 50 L175 110 Q175 160 100 190 Q25 160 25 110 L25 50Z" fill="url(#sbg)"/><circle cx="100" cy="90" r="30" fill="white" opacity="0.15"/><text x="100" y="95" text-anchor="middle" fill="white" font-family="Arial" font-weight="bold" font-size="15">${t}</text><text x="100" y="140" text-anchor="middle" fill="#fdcb6e" font-family="Arial" font-size="11">2026</text>` },
      { label: "Football", shape: `<circle cx="100" cy="100" r="75" fill="#2d3436"/><circle cx="100" cy="100" r="75" fill="none" stroke="white" stroke-width="2"/><polygon points="100,38 116,62 108,88 92,88 84,62" fill="white"/><polygon points="155,72 140,94 116,88 108,64 126,46" fill="white"/><polygon points="144,130 118,140 108,116 124,96 150,100" fill="white"/><polygon points="100,162 82,145 88,120 112,120 118,145" fill="white"/><polygon points="56,130 50,100 76,96 92,116 82,140" fill="white"/><polygon points="45,72 74,46 92,64 84,88 60,94" fill="white"/>` },
    ]);
  }

  if (is(["ớt", "chili", "cay", "tương ớt", "hot sauce", "pepper", "spicy", "fire sauce"])) {
    return makeSVGs(seed, [
      { label: "Chili Fire", shape: `<defs><linearGradient id="cfg" x1="0.5" y1="0" x2="0.5" y2="1"><stop offset="0%" stop-color="#f1c40f"/><stop offset="40%" stop-color="#e17055"/><stop offset="100%" stop-color="#d63031"/></linearGradient></defs><path d="M100 170 C80 150 45 130 40 95 C35 60 55 30 80 25 C90 22 100 28 100 28 C100 28 88 45 90 65 C92 85 105 88 108 70 C112 50 105 30 115 20 C125 15 140 25 148 40 C160 60 158 90 148 110 C138 130 115 150 100 170Z" fill="url(#cfg)"/><ellipse cx="100" cy="30" rx="6" ry="12" fill="#27ae60" transform="rotate(-15 100 30)"/><path d="M60 145 Q100 185 140 145" fill="none" stroke="#d63031" stroke-width="2" opacity="0.4"/>` },
      { label: "Hot Badge", shape: `<defs><radialGradient id="hbg"><stop offset="0%" stop-color="#f39c12"/><stop offset="100%" stop-color="#d63031"/></radialGradient><filter id="hglow"><feGaussianBlur stdDeviation="4" result="blur"/><feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge></filter></defs><circle cx="100" cy="100" r="85" fill="url(#hbg)"/><circle cx="100" cy="100" r="85" fill="none" stroke="#fdcb6e" stroke-width="3"/><text x="100" y="78" text-anchor="middle" fill="white" font-family="Arial" font-weight="900" font-size="13" letter-spacing="3">🌶 SUPER</text><text x="100" y="108" text-anchor="middle" fill="white" font-family="Arial" font-weight="900" font-size="22" filter="url(#hglow)">HOT</text><text x="100" y="135" text-anchor="middle" fill="#fdcb6e" font-family="Arial" font-size="11" letter-spacing="2">SAUCE</text>` },
      { label: "Flame Skull", shape: `<defs><linearGradient id="fsg" x1="0.5" y1="0" x2="0.5" y2="1"><stop offset="0%" stop-color="#f1c40f"/><stop offset="50%" stop-color="#e17055"/><stop offset="100%" stop-color="#d63031"/></linearGradient></defs><path d="M100 20 C118 50 155 65 148 108 C144 130 130 148 120 152 C126 135 118 115 100 105 C82 115 74 135 80 152 C70 148 56 130 52 108 C45 65 82 50 100 20Z" fill="url(#fsg)"/><ellipse cx="100" cy="148" rx="30" ry="22" fill="#2d3436"/><circle cx="88" cy="142" r="7" fill="white"/><circle cx="112" cy="142" r="7" fill="white"/><path d="M88 155 L96 155 L96 160 L100 155 L104 160 L104 155 L112 155" fill="none" stroke="white" stroke-width="2" stroke-linecap="round"/>` },
      { label: "Chili Vintage", shape: `<defs><filter id="cv"><feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves="4" result="n"/><feDisplacementMap in="SourceGraphic" in2="n" scale="2"/></filter></defs><circle cx="100" cy="100" r="86" fill="none" stroke="#d63031" stroke-width="6" stroke-dasharray="5 3" filter="url(#cv)"/><circle cx="100" cy="100" r="76" fill="none" stroke="#d63031" stroke-width="1.5" filter="url(#cv)"/><text x="100" y="72" text-anchor="middle" fill="#d63031" font-family="Georgia,serif" font-size="10" letter-spacing="5">✦ ORIGINAL ✦</text><path d="M100 150 C84 130 60 118 58 95 C56 74 68 56 84 52 C90 50 96 54 100 58 C104 54 110 50 116 52 C132 56 144 74 142 95 C140 118 116 130 100 150Z" fill="#d63031"/><text x="100" y="140" text-anchor="middle" fill="white" font-family="Arial" font-weight="bold" font-size="11">SPICY</text>` },
      { label: "Pepper Stack", shape: `${[{ x: 72, y: 70, r: -20 }, { x: 100, y: 55, r: 0 }, { x: 128, y: 70, r: 20 }].map(p => `<path d="M${p.x} ${p.y + 80} C${p.x - 15} ${p.y + 60} ${p.x - 18} ${p.y + 30} ${p.x} ${p.y + 20} C${p.x + 10} ${p.y + 15} ${p.x + 18} ${p.y + 25} ${p.x + 20} ${p.y + 45} C${p.x + 22} ${p.y + 65} ${p.x + 15} ${p.y + 80} ${p.x} ${p.y + 80}Z" fill="#d63031" transform="rotate(${p.r} ${p.x} ${p.y + 50})"/><ellipse cx="${p.x}" cy="${p.y + 20}" rx="4" ry="8" fill="#27ae60" transform="rotate(${p.r} ${p.x} ${p.y + 20})"/>`).join('')}` },
      { label: "Hot Label", shape: `<defs><linearGradient id="hlg" x1="0" y1="0" x2="1" y2="1"><stop offset="0%" stop-color="#e17055"/><stop offset="100%" stop-color="#d63031"/></linearGradient></defs><rect x="18" y="55" width="164" height="90" rx="12" fill="url(#hlg)"/><rect x="25" y="62" width="150" height="76" rx="8" fill="none" stroke="rgba(255,255,255,0.4)" stroke-width="2"/><text x="100" y="92" text-anchor="middle" fill="white" font-family="Arial" font-weight="900" font-size="26" letter-spacing="2">HOT</text><text x="100" y="118" text-anchor="middle" fill="#fdcb6e" font-family="Arial" font-size="13" letter-spacing="4">SAUCE 🌶</text>` },
    ]);
  }

  if (is(["mèo", "cat", "kitty", "kitten", "neko", "meow"])) {
    return makeSVGs(seed, [
      { label: "Cat Face", shape: `<circle cx="100" cy="105" r="72" fill="#fdcb6e"/><ellipse cx="72" cy="60" rx="22" ry="30" fill="#fdcb6e"/><ellipse cx="128" cy="60" rx="22" ry="30" fill="#fdcb6e"/><ellipse cx="72" cy="55" rx="14" ry="20" fill="#e84393"/><ellipse cx="128" cy="55" rx="14" ry="20" fill="#e84393"/><ellipse cx="88" cy="95" r="12" fill="#e17055"/><ellipse cx="112" cy="95" r="12" fill="#e17055"/><circle cx="88" cy="93" r="5" fill="#2d3436"/><circle cx="112" cy="93" r="5" fill="#2d3436"/><circle cx="90" cy="91" r="2" fill="white"/><circle cx="114" cy="91" r="2" fill="white"/><path d="M85 110 Q100 120 115 110" fill="none" stroke="#e17055" stroke-width="3" stroke-linecap="round"/><line x1="55" y1="105" x2="82" y2="108" stroke="#2d3436" stroke-width="2"/><line x1="55" y1="115" x2="82" y2="112" stroke="#2d3436" stroke-width="2"/><line x1="118" y1="108" x2="145" y2="105" stroke="#2d3436" stroke-width="2"/><line x1="118" y1="112" x2="145" y2="115" stroke="#2d3436" stroke-width="2"/>` },
      { label: "Cat Paw", shape: `<ellipse cx="100" cy="115" rx="55" ry="50" fill="#fdcb6e"/><circle cx="70" cy="78" r="18" fill="#fdcb6e"/><circle cx="100" cy="68" r="18" fill="#fdcb6e"/><circle cx="130" cy="78" r="18" fill="#fdcb6e"/><ellipse cx="70" cy="82" rx="10" ry="9" fill="#e84393" opacity="0.6"/><ellipse cx="100" cy="72" rx="10" ry="9" fill="#e84393" opacity="0.6"/><ellipse cx="130" cy="82" rx="10" ry="9" fill="#e84393" opacity="0.6"/><ellipse cx="100" cy="128" rx="30" ry="25" fill="#e84393" opacity="0.5"/><circle cx="82" cy="118" r="12" fill="#e84393" opacity="0.5"/><circle cx="118" cy="118" r="12" fill="#e84393" opacity="0.5"/>` },
    ]);
  }

  if (is(["sao", "star", "galaxy", "vũ trụ", "space", "ngôi sao", "tinh tú", "thiên hà"])) {
    return makeSVGs(seed, [
      { label: "Star Galaxy", shape: `<defs><radialGradient id="sgal"><stop offset="0%" stop-color="#6c5ce7"/><stop offset="60%" stop-color="#0984e3"/><stop offset="100%" stop-color="#0a0a14"/></radialGradient></defs><circle cx="100" cy="100" r="90" fill="url(#sgal)"/>${Array.from({ length: 25 }, (_, i) => { const x = 15 + Math.sin(i * 2.5) * 80 + Math.cos(i * 1.3) * 60, y = 15 + Math.cos(i * 2.1) * 80 + Math.sin(i * 1.7) * 60, r = i % 5 === 0 ? 3 : 1.5; return `<circle cx="${100 + x - 50}" cy="${100 + y - 50}" r="${r}" fill="white" opacity="${0.5 + r / 6}"/>` }).join('')}<polygon points="100,55 107,78 132,78 112,92 119,115 100,101 81,115 88,92 68,78 93,78" fill="#f1c40f" opacity="0.9"/><circle cx="100" cy="100" r="18" fill="rgba(241,196,15,0.2)"/>` },
      { label: "Star Badge", shape: `<defs><linearGradient id="stbg" x1="0" y1="0" x2="1" y2="1"><stop offset="0%" stop-color="#fdcb6e"/><stop offset="100%" stop-color="#e17055"/></linearGradient></defs><polygon points="100,10 121,72 187,72 133,110 154,172 100,134 46,172 67,110 13,72 79,72" fill="url(#stbg)"/><polygon points="100,32 116,80 165,80 125,106 140,154 100,128 60,154 75,106 35,80 84,80" fill="rgba(255,255,255,0.2)"/><text x="100" y="105" text-anchor="middle" fill="white" font-family="Arial" font-weight="900" font-size="14">${t}</text>` },
    ]);
  }

  if (is(["núi", "mountain", "đỉnh", "peak", "highland", "rừng", "forest"])) {
    return makeSVGs(seed, [
      { label: "Mountain", shape: `<defs><linearGradient id="mtg" x1="0.5" y1="0" x2="0.5" y2="1"><stop offset="0%" stop-color="#dfe6e9"/><stop offset="40%" stop-color="#636e72"/><stop offset="100%" stop-color="#2d3436"/></linearGradient></defs><polygon points="100,18 175,160 25,160" fill="url(#mtg)"/><polygon points="100,18 135,80 65,80" fill="white" opacity="0.7"/><polygon points="55,90 105,165 5,165" fill="#2d3436" opacity="0.4"/><ellipse cx="100" cy="162" rx="80" ry="8" fill="rgba(0,0,0,0.1)"/>` },
      { label: "Peak Badge", shape: `<circle cx="100" cy="100" r="85" fill="#0984e3" opacity="0.15"/><circle cx="100" cy="100" r="85" fill="none" stroke="#0984e3" stroke-width="3"/><polygon points="100,30 150,130 50,130" fill="#2d3436"/><polygon points="100,30 122,70 78,70" fill="white" opacity="0.8"/><text x="100" y="158" text-anchor="middle" fill="#0984e3" font-family="Arial" font-weight="bold" font-size="13" letter-spacing="2">ADVENTURE</text>` },
    ]);
  }

  if (is(["nhạc", "music", "âm nhạc", "guitar", "note", "band", "rock", "pop", "beat"])) {
    return makeSVGs(seed, [
      { label: "Music Note", shape: `<defs><linearGradient id="mng" x1="0" y1="0" x2="1" y2="1"><stop offset="0%" stop-color="#a29bfe"/><stop offset="100%" stop-color="#6c5ce7"/></linearGradient></defs><ellipse cx="80" cy="148" rx="22" ry="16" fill="url(#mng)"/><ellipse cx="140" cy="132" rx="22" ry="16" fill="url(#mng)"/><line x1="102" y1="148" x2="102" y2="55" stroke="#6c5ce7" stroke-width="8" stroke-linecap="round"/><line x1="162" y1="132" x2="162" y2="40" stroke="#6c5ce7" stroke-width="8" stroke-linecap="round"/><line x1="102" y1="55" x2="162" y2="40" stroke="#6c5ce7" stroke-width="8" stroke-linecap="round"/>` },
      { label: "Vinyl Record", shape: `<circle cx="100" cy="100" r="85" fill="#2d3436"/><circle cx="100" cy="100" r="82" fill="none" stroke="#636e72" stroke-width="3"/><circle cx="100" cy="100" r="65" fill="none" stroke="#636e72" stroke-width="1"/><circle cx="100" cy="100" r="50" fill="none" stroke="#636e72" stroke-width="1"/><circle cx="100" cy="100" r="20" fill="#e84393"/><circle cx="100" cy="100" r="6" fill="#2d3436"/><text x="100" y="103" text-anchor="middle" fill="white" font-family="Arial" font-size="7" letter-spacing="1">${t}</text>` },
    ]);
  }

  if (is(["skull", "sọ", "xương", "death", "rock", "punk", "pirate", "hải tặc"])) {
    return makeSVGs(seed, [
      { label: "Skull Bold", shape: `<defs><linearGradient id="skg" x1="0" y1="0" x2="1" y2="1"><stop offset="0%" stop-color="#636e72"/><stop offset="100%" stop-color="#2d3436"/></linearGradient></defs><ellipse cx="100" cy="88" rx="62" ry="68" fill="url(#skg)"/><rect x="68" y="148" width="20" height="30" rx="4" fill="url(#skg)"/><rect x="92" y="145" width="16" height="35" rx="4" fill="url(#skg)"/><rect x="112" y="148" width="20" height="30" rx="4" fill="url(#skg)"/><ellipse cx="82" cy="82" rx="18" ry="22" fill="#111"/><ellipse cx="118" cy="82" rx="18" ry="22" fill="#111"/><ellipse cx="82" cy="82" rx="12" ry="15" fill="#0984e3" opacity="0.6"/><ellipse cx="118" cy="82" rx="12" ry="15" fill="#0984e3" opacity="0.6"/><path d="M85 118 Q100 130 115 118" fill="none" stroke="#111" stroke-width="3"/><line x1="78" y1="120" x2="78" y2="130" stroke="#111" stroke-width="3"/><line x1="88" y1="122" x2="88" y2="132" stroke="#111" stroke-width="3"/><line x1="100" y1="123" x2="100" y2="133" stroke="#111" stroke-width="3"/><line x1="112" y1="122" x2="112" y2="132" stroke="#111" stroke-width="3"/><line x1="122" y1="120" x2="122" y2="130" stroke="#111" stroke-width="3"/>` },
    ]);
  }

  if (is(["bướm", "butterfly", "hoa", "flower", "bloom", "spring", "cánh hoa"])) {
    return makeSVGs(seed, [
      { label: "Butterfly", shape: `<defs><radialGradient id="bwg1"><stop offset="0%" stop-color="#fd79a8"/><stop offset="100%" stop-color="#6c5ce7"/></radialGradient><radialGradient id="bwg2"><stop offset="0%" stop-color="#00b894"/><stop offset="100%" stop-color="#0984e3"/></radialGradient></defs><ellipse cx="65" cy="85" rx="52" ry="38" fill="url(#bwg1)" opacity="0.9" transform="rotate(-20 65 85)"/><ellipse cx="135" cy="85" rx="52" ry="38" fill="url(#bwg1)" opacity="0.9" transform="rotate(20 135 85)"/><ellipse cx="72" cy="128" rx="30" ry="22" fill="url(#bwg2)" opacity="0.85" transform="rotate(20 72 128)"/><ellipse cx="128" cy="128" rx="30" ry="22" fill="url(#bwg2)" opacity="0.85" transform="rotate(-20 128 128)"/><ellipse cx="100" cy="100" rx="6" ry="55" fill="#2d3436"/><ellipse cx="100" cy="38" rx="3" ry="12" fill="#2d3436" transform="rotate(-15 100 38)"/><ellipse cx="100" cy="38" rx="3" ry="12" fill="#2d3436" transform="rotate(15 100 38)"/>` },
    ]);
  }

  if (is(["vô cực", "infinity", "∞", "biểu tượng vô cực", "infinite"])) {
    return makeSVGs(seed, [
      { label: "∞ Gradient", shape: `<defs><linearGradient id="ig1" x1="0" y1="0" x2="1" y2="1"><stop offset="0%" stop-color="#6c5ce7"/><stop offset="50%" stop-color="#e84393"/><stop offset="100%" stop-color="#fd79a8"/></linearGradient></defs><path d="M100 100 C100 65 145 40 160 70 C175 100 145 130 100 100 C55 70 25 100 40 130 C55 160 100 135 100 100Z" fill="none" stroke="url(#ig1)" stroke-width="8" stroke-linecap="round"/>` },
      { label: "∞ Neon", shape: `<defs><filter id="inf"><feGaussianBlur stdDeviation="6" result="blur"/><feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge></filter></defs><path d="M100 100 C100 60 155 35 170 72 C185 110 150 140 100 100 C50 60 15 110 30 128 C50 165 100 140 100 100Z" fill="none" stroke="#00fff0" stroke-width="5" stroke-linecap="round" filter="url(#inf)"/>` },
      { label: "∞ Bold", shape: `<defs><linearGradient id="ig2" x1="0" y1="0" x2="1" y2="0"><stop offset="0%" stop-color="#f39c12"/><stop offset="100%" stop-color="#e74c3c"/></linearGradient></defs><path d="M100 100 C100 58 158 30 175 70 C192 110 155 145 100 100 C45 55 8 110 25 130 C42 165 100 142 100 100Z" fill="url(#ig2)"/>` },
      { label: "∞ Outline", shape: `<path d="M100 100 C100 62 150 38 168 70 C186 102 155 138 100 100 C45 62 14 102 32 130 C50 162 100 138 100 100Z" fill="none" stroke="#2d3436" stroke-width="6" stroke-linecap="round"/><path d="M100 100 C100 68 142 48 158 72 C174 96 148 128 100 100 C52 72 26 96 42 120 C58 148 100 132 100 100Z" fill="none" stroke="#6c5ce7" stroke-width="3" stroke-linecap="round" opacity="0.5"/>` },
      { label: "∞ Galaxy", shape: `<defs><radialGradient id="ig3"><stop offset="0%" stop-color="#6c5ce7"/><stop offset="100%" stop-color="#0a0a14"/></radialGradient></defs><circle cx="100" cy="100" r="90" fill="url(#ig3)"/>${Array.from({ length: 20 }, (_, i) => { const x = 20 + Math.sin(i * 3.1) * 75 + Math.cos(i * 1.7) * 55, y = 20 + Math.cos(i * 2.3) * 75 + Math.sin(i * 1.9) * 55; return `<circle cx="${100 + x - 50}" cy="${100 + y - 50}" r="${i % 4 === 0 ? 2 : 1}" fill="white" opacity="${0.4 + Math.random() * 0.5}"/>` }).join('')}<path d="M100 100 C100 62 150 40 165 70 C180 100 150 135 100 100 C50 65 20 100 35 130 C50 160 100 138 100 100Z" fill="none" stroke="#a29bfe" stroke-width="4" stroke-linecap="round"/>` },
      { label: "∞ Fire", shape: `<defs><linearGradient id="ig4" x1="0" y1="0" x2="1" y2="1"><stop offset="0%" stop-color="#f1c40f"/><stop offset="50%" stop-color="#e67e22"/><stop offset="100%" stop-color="#e74c3c"/></linearGradient><filter id="ifg"><feGaussianBlur stdDeviation="3" result="blur"/><feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge></filter></defs><path d="M100 100 C100 58 158 30 175 70 C192 110 155 145 100 100 C45 55 8 110 25 130 C42 165 100 142 100 100Z" fill="none" stroke="url(#ig4)" stroke-width="8" stroke-linecap="round" filter="url(#ifg)"/>` },
      { label: "∞ Minimal", shape: `<path d="M100 100 C100 65 148 42 163 70 C178 98 150 130 100 100 C50 70 22 98 37 130 C52 158 100 135 100 100Z" fill="none" stroke="#111" stroke-width="4" stroke-linecap="round"/>` },
      { label: "∞ Double", shape: `<path d="M100 90 C100 55 148 35 163 60 C178 85 150 115 100 90 C50 65 22 85 37 115 C52 140 100 125 100 90Z" fill="none" stroke="#e84393" stroke-width="5" stroke-linecap="round"/><path d="M100 110 C100 75 148 55 163 80 C178 105 150 135 100 110 C50 85 22 105 37 135 C52 160 100 145 100 110Z" fill="none" stroke="#6c5ce7" stroke-width="5" stroke-linecap="round"/>` },
    ]);
  }

  if (is(["vương miện", "crown", "king", "queen", "hoàng gia"])) {
    return makeSVGs(seed, [
      { label: "Crown Gold", shape: `<defs><linearGradient id="cg1" x1="0.5" y1="0" x2="0.5" y2="1"><stop offset="0%" stop-color="#f1c40f"/><stop offset="100%" stop-color="#e67e22"/></linearGradient></defs><path d="M30 130 L30 80 L60 105 L100 60 L140 105 L170 80 L170 130Z" fill="url(#cg1)"/><rect x="30" y="130" width="140" height="20" rx="4" fill="#e67e22"/><circle cx="60" cy="78" r="6" fill="#e74c3c"/><circle cx="100" cy="55" r="8" fill="#e74c3c"/><circle cx="140" cy="78" r="6" fill="#e74c3c"/>` },
      { label: "Crown Neon", shape: `<defs><filter id="cn"><feGaussianBlur stdDeviation="4" result="blur"/><feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge></filter></defs><path d="M30 130 L30 80 L60 105 L100 55 L140 105 L170 80 L170 130Z" fill="none" stroke="#f1c40f" stroke-width="4" stroke-linejoin="round" filter="url(#cn)"/><line x1="30" y1="135" x2="170" y2="135" stroke="#f1c40f" stroke-width="4" filter="url(#cn)"/>` },
      { label: "Crown Minimal", shape: `<path d="M35 125 L35 82 L62 100 L100 60 L138 100 L165 82 L165 125Z" fill="none" stroke="#2d3436" stroke-width="4" stroke-linejoin="round"/><line x1="35" y1="130" x2="165" y2="130" stroke="#2d3436" stroke-width="4"/>` },
      { label: "Crown Badge", shape: `<circle cx="100" cy="100" r="85" fill="#0a0a14"/><path d="M45 118 L45 78 L68 95 L100 60 L132 95 L155 78 L155 118Z" fill="#f1c40f"/><rect x="45" y="118" width="110" height="14" rx="3" fill="#e67e22"/><text x="100" y="155" text-anchor="middle" fill="#f1c40f" font-family="Arial" font-weight="bold" font-size="12" letter-spacing="2">KING</text>` },
    ]);
  }

  if (is(["sóng", "wave", "biển", "ocean", "sea", "nước", "water"])) {
    return makeSVGs(seed, [
      { label: "Wave", shape: `<defs><linearGradient id="wg" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stop-color="#0984e3"/><stop offset="100%" stop-color="#00cec9"/></linearGradient></defs><path d="M0 120 Q25 90 50 110 Q75 130 100 110 Q125 90 150 110 Q175 130 200 110 L200 200 L0 200Z" fill="url(#wg)" opacity="0.9"/><path d="M0 140 Q25 115 50 130 Q75 145 100 130 Q125 115 150 130 Q175 145 200 130 L200 200 L0 200Z" fill="#00b894" opacity="0.6"/>` },
      { label: "Wave Neon", shape: `<defs><filter id="wn"><feGaussianBlur stdDeviation="4" result="blur"/><feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge></filter></defs><path d="M10 100 Q35 60 60 100 Q85 140 110 100 Q135 60 160 100 Q185 140 200 100" fill="none" stroke="#00fff0" stroke-width="4" filter="url(#wn)"/><path d="M5 120 Q30 85 60 120 Q90 155 120 120 Q150 85 180 120" fill="none" stroke="#7b61ff" stroke-width="3" filter="url(#wn)"/>` },
      { label: "Wave Minimal", shape: `<path d="M10 90 Q40 50 70 90 Q100 130 130 90 Q160 50 190 90" fill="none" stroke="#0984e3" stroke-width="4" stroke-linecap="round"/><path d="M10 110 Q40 70 70 110 Q100 150 130 110 Q160 70 190 110" fill="none" stroke="#0984e3" stroke-width="2" stroke-linecap="round" opacity="0.5"/>` },
      { label: "Wave Badge", shape: `<circle cx="100" cy="100" r="85" fill="#dfe6e9"/><circle cx="100" cy="100" r="85" fill="none" stroke="#0984e3" stroke-width="3"/><path d="M25 100 Q50 70 75 100 Q100 130 125 100 Q150 70 175 100" fill="none" stroke="#0984e3" stroke-width="5" stroke-linecap="round"/><text x="100" y="140" text-anchor="middle" fill="#0984e3" font-family="Arial" font-weight="bold" font-size="12" letter-spacing="2">WAVE</text>` },
    ]);
  }

  if (is(["kim cương", "diamond", "đá quý", "gem", "jewel"])) {
    return makeSVGs(seed, [
      { label: "Diamond", shape: `<defs><linearGradient id="dg1" x1="0" y1="0" x2="1" y2="1"><stop offset="0%" stop-color="#dfe6e9"/><stop offset="40%" stop-color="#74b9ff"/><stop offset="100%" stop-color="#0984e3"/></linearGradient></defs><polygon points="100,15 155,75 100,185 45,75" fill="url(#dg1)"/><polygon points="100,15 130,75 100,55 70,75" fill="rgba(255,255,255,0.3)"/><line x1="45" y1="75" x2="155" y2="75" stroke="rgba(255,255,255,0.5)" stroke-width="1"/>` },
      { label: "Diamond Neon", shape: `<defs><filter id="dn"><feGaussianBlur stdDeviation="5" result="blur"/><feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge></filter></defs><polygon points="100,18 152,78 100,182 48,78" fill="none" stroke="#74b9ff" stroke-width="3" filter="url(#dn)"/><line x1="48" y1="78" x2="152" y2="78" stroke="#74b9ff" stroke-width="2" filter="url(#dn)"/>` },
      { label: "Diamond Minimal", shape: `<polygon points="100,20 150,78 100,180 50,78" fill="none" stroke="#2d3436" stroke-width="4" stroke-linejoin="round"/><line x1="50" y1="78" x2="150" y2="78" stroke="#2d3436" stroke-width="2"/>` },
      { label: "Diamond Badge", shape: `<circle cx="100" cy="100" r="85" fill="#0a0a14"/><polygon points="100,30 145,80 100,170 55,80" fill="#74b9ff" opacity="0.8"/><polygon points="100,30 125,80 100,60 75,80" fill="rgba(255,255,255,0.3)"/><text x="100" y="155" text-anchor="middle" fill="#74b9ff" font-family="Arial" font-weight="bold" font-size="10" letter-spacing="3">DIAMOND</text>` },
    ]);
  }

  // ── Generic fallback: premium quality designs ───────────
  return makeSVGs(seed, [
    // 1. Gradient crest / shield
    { label: "Huy hiệu", shape: `<defs><linearGradient id="g0" x1="0" y1="0" x2="1" y2="1"><stop offset="0%" stop-color="#a29bfe"/><stop offset="50%" stop-color="#6c5ce7"/><stop offset="100%" stop-color="#341f97"/></linearGradient><filter id="gsh"><feDropShadow dx="0" dy="4" stdDeviation="4" flood-color="#341f97" flood-opacity="0.4"/></filter></defs><path d="M100 12 L180 48 L180 112 Q180 165 100 192 Q20 165 20 112 L20 48Z" fill="url(#g0)" filter="url(#gsh)"/><path d="M100 32 L162 62 L162 112 Q162 152 100 172 Q38 152 38 112 L38 62Z" fill="none" stroke="rgba(255,255,255,0.25)" stroke-width="2"/><circle cx="100" cy="105" r="32" fill="rgba(255,255,255,0.12)"/><text x="100" y="100" text-anchor="middle" fill="white" font-family="Arial" font-weight="900" font-size="17" letter-spacing="1">${t}</text><text x="100" y="150" text-anchor="middle" fill="rgba(255,255,255,0.6)" font-family="Arial" font-size="10" letter-spacing="3">EST 2026</text>` },

    // 2. Neon circle glow
    { label: "Neon glow", shape: `<defs><filter id="neon1"><feGaussianBlur stdDeviation="5" result="blur"/><feMerge><feMergeNode in="blur"/><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge></filter><radialGradient id="ng1" cx="50%" cy="50%" r="50%"><stop offset="0%" stop-color="#00fff0" stop-opacity="0.15"/><stop offset="100%" stop-color="#00fff0" stop-opacity="0"/></radialGradient></defs><circle cx="100" cy="100" r="90" fill="url(#ng1)"/><circle cx="100" cy="100" r="82" fill="none" stroke="#00fff0" stroke-width="2.5" filter="url(#neon1)" opacity="0.9"/><circle cx="100" cy="100" r="68" fill="none" stroke="#7b61ff" stroke-width="1.5" filter="url(#neon1)" opacity="0.7"/><text x="100" y="95" text-anchor="middle" fill="#00fff0" font-family="Arial" font-weight="900" font-size="18" filter="url(#neon1)" letter-spacing="2">${t}</text><text x="100" y="118" text-anchor="middle" fill="#7b61ff" font-family="Arial" font-size="10" letter-spacing="4" filter="url(#neon1)">ORIGINAL</text>` },

    // 3. Vintage stamp
    { label: "Vintage Tem", shape: `<defs><filter id="rough"><feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves="4" result="noise"/><feDisplacementMap in="SourceGraphic" in2="noise" scale="2" xChannelSelector="R" yChannelSelector="G"/></filter></defs><circle cx="100" cy="100" r="87" fill="none" stroke="#c0392b" stroke-width="6" stroke-dasharray="5 3" filter="url(#rough)"/><circle cx="100" cy="100" r="78" fill="none" stroke="#c0392b" stroke-width="2" filter="url(#rough)"/><text x="100" y="78" text-anchor="middle" fill="#c0392b" font-family="Georgia,serif" font-size="11" letter-spacing="5">✦ AUTHENTIC ✦</text><text x="100" y="108" text-anchor="middle" fill="#c0392b" font-family="Georgia,serif" font-weight="bold" font-size="20">${t}</text><line x1="40" y1="120" x2="160" y2="120" stroke="#c0392b" stroke-width="1.5"/><text x="100" y="138" text-anchor="middle" fill="#c0392b" font-family="Georgia,serif" font-size="10" letter-spacing="3">EST. 2026</text>` },

    // 4. Bold retro arc text
    { label: "Retro Arc", shape: `<defs><linearGradient id="g3" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stop-color="#f7971e"/><stop offset="100%" stop-color="#ffd200"/></linearGradient><filter id="sh3"><feDropShadow dx="2" dy="3" stdDeviation="3" flood-color="#000" flood-opacity="0.3"/></filter></defs><path d="M15 130 Q100 25 185 130" fill="none" stroke="#1a1a2e" stroke-width="42" stroke-linecap="round"/><path d="M22 130 Q100 33 178 130" fill="none" stroke="url(#g3)" stroke-width="32" stroke-linecap="round"/><path d="M30 100 Q100 200 170 100" fill="none" stroke="#1a1a2e" stroke-width="38" stroke-linecap="round"/><path d="M37 100 Q100 192 163 100" fill="none" stroke="url(#g3)" stroke-width="28" stroke-linecap="round"/><text x="100" y="98" text-anchor="middle" fill="#1a1a2e" font-family="Arial" font-weight="900" font-size="16" filter="url(#sh3)" letter-spacing="1">${t}</text>` },

    // 5. Geometric layers
    { label: "Geometric", shape: `<defs><linearGradient id="g4" x1="0" y1="0" x2="1" y2="1"><stop offset="0%" stop-color="#f953c6"/><stop offset="100%" stop-color="#b91d73"/></linearGradient><linearGradient id="g4b" x1="1" y1="0" x2="0" y2="1"><stop offset="0%" stop-color="#0575e6"/><stop offset="100%" stop-color="#021b79"/></linearGradient></defs><polygon points="100,8 192,55 192,145 100,192 8,145 8,55" fill="url(#g4b)"/><polygon points="100,30 170,65 170,135 100,170 30,135 30,65" fill="url(#g4)" opacity="0.7"/><polygon points="100,55 145,78 145,122 100,145 55,122 55,78" fill="none" stroke="rgba(255,255,255,0.4)" stroke-width="2"/><circle cx="100" cy="100" r="22" fill="rgba(255,255,255,0.15)"/><text x="100" y="105" text-anchor="middle" fill="white" font-family="Arial" font-weight="900" font-size="15" letter-spacing="1">${t}</text>` },

    // 6. Minimal line art
    { label: "Minimal Line", shape: `<defs><filter id="sh6"><feDropShadow dx="0" dy="2" stdDeviation="2" flood-color="#6c5ce7" flood-opacity="0.3"/></filter></defs><circle cx="100" cy="100" r="80" fill="none" stroke="#111" stroke-width="4"/><line x1="20" y1="100" x2="180" y2="100" stroke="#111" stroke-width="2"/><line x1="100" y1="20" x2="100" y2="180" stroke="#111" stroke-width="2"/><circle cx="100" cy="100" r="40" fill="none" stroke="#6c5ce7" stroke-width="3" filter="url(#sh6)"/><text x="100" y="89" text-anchor="middle" fill="#111" font-family="Arial" font-weight="900" font-size="12" letter-spacing="2">${t}</text><text x="100" y="115" text-anchor="middle" fill="#6c5ce7" font-family="Arial" font-size="9" letter-spacing="3">ORIGINAL</text>` },
  ]);
}

function makeSVGs(seed: number, items: { label: string; shape: string }[]) {
  // Shuffle items so each call returns different order
  const shuffled = [...items].sort(() => Math.random() - 0.5);

  // Random hue rotation (0-360°) to generate different color variants each time
  const hueShift = Math.floor(Math.random() * 360);

  // If pool is too small, pad with generic shapes for variety
  const genericPadding: { label: string; shape: string }[] = [
    { label: "Huy hiệu", shape: `<defs><linearGradient id="gp0" x1="0" y1="0" x2="1" y2="1"><stop offset="0%" stop-color="#a29bfe"/><stop offset="100%" stop-color="#6c5ce7"/></linearGradient></defs><path d="M100 12 L175 48 L175 112 Q175 165 100 192 Q25 165 25 112 L25 48Z" fill="url(#gp0)"/><circle cx="100" cy="100" r="30" fill="rgba(255,255,255,0.15)"/>` },
    { label: "Neon Ring", shape: `<defs><filter id="gpn"><feGaussianBlur stdDeviation="5" result="blur"/><feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge></filter></defs><circle cx="100" cy="100" r="78" fill="none" stroke="#00fff0" stroke-width="3" filter="url(#gpn)"/><circle cx="100" cy="100" r="60" fill="none" stroke="#7b61ff" stroke-width="2" filter="url(#gpn)"/>` },
    { label: "Geometric", shape: `<defs><linearGradient id="gp4" x1="0" y1="0" x2="1" y2="1"><stop offset="0%" stop-color="#f953c6"/><stop offset="100%" stop-color="#b91d73"/></linearGradient></defs><polygon points="100,8 192,55 192,145 100,192 8,145 8,55" fill="url(#gp4)"/><polygon points="100,40 160,72 160,128 100,160 40,128 40,72" fill="none" stroke="rgba(255,255,255,0.3)" stroke-width="2"/>` },
    { label: "Retro Badge", shape: `<defs><filter id="gpr"><feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves="4" result="n"/><feDisplacementMap in="SourceGraphic" in2="n" scale="2"/></filter></defs><circle cx="100" cy="100" r="85" fill="none" stroke="#c0392b" stroke-width="5" stroke-dasharray="5 3" filter="url(#gpr)"/><circle cx="100" cy="100" r="72" fill="none" stroke="#c0392b" stroke-width="1.5"/><text x="100" y="105" text-anchor="middle" fill="#c0392b" font-family="Georgia" font-weight="bold" font-size="18">★</text>` },
  ];

  let pool = [...shuffled];
  if (pool.length < 6) {
    const padded = genericPadding.sort(() => Math.random() - 0.5).slice(0, 6 - pool.length);
    pool = [...pool, ...padded];
  }

  // Pick 4-6 items randomly
  const count = Math.min(pool.length, 4 + Math.floor(Math.random() * 3));
  const selected = pool.sort(() => Math.random() - 0.5).slice(0, count);

  return selected.map((item, i) => {
    // Apply different hue rotation to each item for max variety
    const itemHue = (hueShift + i * 60) % 360;
    const svgContent = itemHue > 30
      ? `<svg viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg"><g style="filter: hue-rotate(${itemHue}deg)">${item.shape}</g></svg>`
      : `<svg viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg">${item.shape}</svg>`;

    return {
      id: `smart-${seed}-${i}-${Math.random().toString(36).slice(2, 6)}`,
      label: item.label,
      url: `data:image/svg+xml,${encodeURIComponent(svgContent)}`,
    };
  });
}
