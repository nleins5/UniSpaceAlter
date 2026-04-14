import { NextRequest, NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { writeFile, mkdir } from "fs/promises";
import path from "path";

export async function POST(req: NextRequest) {
  try {
    const { prompt } = await req.json();

    if (!prompt || typeof prompt !== "string") {
      return NextResponse.json({ error: "Prompt is required" }, { status: 400 });
    }

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey || apiKey === "your_gemini_api_key_here") {
      return NextResponse.json({
        images: getSmartSVG(prompt),
        isDemo: false,
        method: "smart",
      });
    }

    const genAI = new GoogleGenerativeAI(apiKey);

    // Hard timeout: if Gemini takes > 7s, immediately return smart SVG
    const timeout = new Promise<null>((resolve) => setTimeout(() => resolve(null), 7000));

    const geminiResult = await Promise.race([
      generateSVGDesigns(genAI, prompt).catch(() => null),
      timeout,
    ]);

    if (geminiResult && (geminiResult as {length:number}).length > 0) {
      return NextResponse.json({ images: geminiResult, isDemo: false, method: "svg" });
    }

    // Timeout or all models failed → instant smart SVG fallback
    return NextResponse.json({
      images: getSmartSVG(prompt),
      isDemo: false,
      method: "smart",
    });

  } catch (error) {
    console.error("API Error:", error);
    return NextResponse.json({ error: "Failed to generate designs" }, { status: 500 });
  }
}

// ═══════════════════════════════════════════════════════════════
// Gemini SVG — Text-based, reliable, free-tier friendly
// ═══════════════════════════════════════════════════════════════
async function generateSVGDesigns(genAI: GoogleGenerativeAI, prompt: string) {
  // Fastest first: flash-lite (free tier) → flash → flash-001
  const modelsToTry = ["gemini-2.0-flash-lite", "gemini-2.5-flash", "gemini-2.5-flash-001"];

  const svgPrompt = `You are a world-class t-shirt graphic designer specialising in SVG art.

Customer request: "${prompt}"

Create 4 STUNNING SVG t-shirt designs, each in a DIFFERENT style. The designs must actually depict "${prompt}" — not generic shapes.

Style 1 — "Gradient Bold": Vibrant radial/linear gradients, thick outlines, bold colours. Use <defs> with <linearGradient> or <radialGradient>.
Style 2 — "Neon Glow": Dark background optional OR transparent, glowing neon stroke effect using <filter><feGaussianBlur/><feMerge/>. Accent colours: electric blue, hot pink, or lime.
Style 3 — "Vintage Badge": Shield/circle/hexagon frame, distressed texture via <feTurbulence>, muted earthy tones, serif-style label text.
Style 4 — "Minimal Line": Clean single-weight strokes on white/transparent bg, geometric simplification of the subject, black or a single accent colour.

SVG rules (STRICT):
- viewBox="0 0 200 200", xmlns="http://www.w3.org/2000/svg"
- Use <defs> for gradients and filters — they MUST have unique IDs per design (prefix with s1_, s2_, s3_, s4_)
- All artwork must fit within the 200×200 viewBox
- Transparent background unless the design specifically needs a dark bg
- Print-ready: high contrast, works on white AND dark fabric
- NO external images, NO <image> tags, pure SVG paths/shapes only
- Make it look PROFESSIONAL, like something from a real t-shirt brand

Return ONLY a JSON array (no markdown, no extra text):
[
  {"label":"Short Vietnamese name","svg":"<svg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'>...</svg>"},
  {"label":"Short Vietnamese name","svg":"<svg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'>...</svg>"},
  {"label":"Short Vietnamese name","svg":"<svg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'>...</svg>"},
  {"label":"Short Vietnamese name","svg":"<svg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'>...</svg>"}
]`;

  for (const modelName of modelsToTry) {
    try {
        const model = genAI.getGenerativeModel({
          model: modelName,
          generationConfig: {
            temperature: 1,
            // @ts-expect-error - thinkingConfig not in types yet
            thinkingConfig: { thinkingBudget: 0 },
          },
        });

        const result = await model.generateContent(svgPrompt);
        let text = result.response.text().trim();
        if (text.startsWith("```json")) text = text.slice(7);
        else if (text.startsWith("```")) text = text.slice(3);
        if (text.endsWith("```")) text = text.slice(0, -3);

        const designs = JSON.parse(text.trim());
        if (!Array.isArray(designs) || designs.length === 0) continue;

        console.log(`✅ ${modelName}: ${designs.length} designs`);
        return designs.map((d: { label: string; svg: string }, i: number) => ({
          id: `svg-${Date.now()}-${i}`,
          label: d.label || `Mẫu ${i + 1}`,
          url: `data:image/svg+xml,${encodeURIComponent(d.svg)}`,
        }));
      } catch (e) {
        const msg = (e as Error).message || "";
        console.log(`${modelName}: ${msg.slice(0, 80)}`);
        if (msg.includes("404") || msg.includes("429")) continue;
      }
    }
  throw new Error("All SVG models failed");
}

// ═══════════════════════════════════════════════════════════════
// Gemini 2.0 Flash native image output
// ═══════════════════════════════════════════════════════════════
async function generateWithGeminiImage(genAI: GoogleGenerativeAI, prompt: string) {
  const modelNames = ["gemini-2.0-flash-preview-image-generation"];
  const outputDir = path.join(process.cwd(), "public", "generated");
  await mkdir(outputDir, { recursive: true });

  for (const modelName of modelNames) {
    try {
      const model = genAI.getGenerativeModel({
        model: modelName,
        generationConfig: {
          // @ts-expect-error responseModalities is not yet in the official SDK typings but is supported at runtime
          responseModalities: ["TEXT", "IMAGE"],
        },
      });

      const result = await model.generateContent(
        `T-shirt design: "${prompt}". Isolated on white background, bold colors, print-ready.`
      );

      const images: Array<{ id: string; label: string; url: string }> = [];
      if (result.response.candidates?.[0]?.content?.parts) {
        let idx = 0;
        for (const part of result.response.candidates[0].content.parts) {
          if (part.inlineData?.mimeType?.startsWith("image/")) {
            const ext = part.inlineData.mimeType === "image/png" ? "png" : "jpg";
            const fileName = `ai-${Date.now()}-${idx}.${ext}`;
            await writeFile(path.join(outputDir, fileName), Buffer.from(part.inlineData.data, "base64"));
            images.push({ id: `native-${Date.now()}-${idx}`, label: `Mẫu ${idx + 1}`, url: `/generated/${fileName}` });
            idx++;
          }
        }
      }
      if (images.length > 0) return images;
    } catch (e) {
      console.log(`${modelName}:`, (e as Error).message?.slice(0, 80));
    }
  }
  return [];
}

// ═══════════════════════════════════════════════════════════════
// Imagen 4 (paid tier only)
// ═══════════════════════════════════════════════════════════════
async function generateWithImagen(_genAI: GoogleGenerativeAI, apiKey: string, prompt: string) {
  const outputDir = path.join(process.cwd(), "public", "generated");
  await mkdir(outputDir, { recursive: true });

  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/imagen-4.0-fast-generate-001:predict?key=${apiKey}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        instances: [{ prompt: `T-shirt design: ${prompt}. Clean graphic on white background, bold colors, print-ready.` }],
        parameters: { sampleCount: 4, aspectRatio: "1:1" },
      }),
    }
  );

  if (!response.ok) throw new Error(`Imagen ${response.status}: ${await response.text()}`);

  const data = await response.json();
  const images: Array<{ id: string; label: string; url: string }> = [];
  if (data.predictions) {
    for (let i = 0; i < data.predictions.length; i++) {
      if (data.predictions[i].bytesBase64Encoded) {
        const fileName = `img-${Date.now()}-${i}.png`;
        await writeFile(path.join(outputDir, fileName), Buffer.from(data.predictions[i].bytesBase64Encoded, "base64"));
        images.push({ id: `imagen-${Date.now()}-${i}`, label: `Mẫu ${i + 1}`, url: `/generated/${fileName}` });
      }
    }
  }
  return images;
}

// ═══════════════════════════════════════════════════════════════
// Smart SVG Fallback — Keyword-based, draws actual shapes
// ═══════════════════════════════════════════════════════════════
function getSmartSVG(prompt: string) {
  const p = prompt.toLowerCase();
  const t = prompt.slice(0, 12).toUpperCase();
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
      { label: "Dragon Scale", shape: `<defs><radialGradient id="sg"><stop offset="0%" stop-color="#6c5ce7"/><stop offset="100%" stop-color="#2d3436"/></radialGradient></defs><circle cx="100" cy="100" r="85" fill="url(#sg)"/>${Array.from({length:4},(_,row)=>Array.from({length:5},(_,col)=>{const x=40+col*32-(row%2)*16,y=40+row*32;return `<path d="M${x} ${y} Q${x+16} ${y-12} ${x+32} ${y} Q${x+16} ${y+4} ${x} ${y}Z" fill="rgba(255,255,255,0.12)" stroke="rgba(255,255,255,0.2)" stroke-width="0.5"/>`}).join('')).join('')}<text x="100" y="170" text-anchor="middle" fill="#fdcb6e" font-family="Arial" font-weight="bold" font-size="14">${t}</text>` },
      { label: "Dragon Eye", shape: `<defs><radialGradient id="eg"><stop offset="0%" stop-color="#f39c12"/><stop offset="60%" stop-color="#e17055"/><stop offset="100%" stop-color="#2d3436"/></radialGradient></defs><circle cx="100" cy="100" r="80" fill="url(#eg)"/><ellipse cx="100" cy="100" rx="30" ry="45" fill="#2d3436"/><ellipse cx="100" cy="100" rx="15" ry="30" fill="#e17055" opacity="0.5"/><circle cx="100" cy="100" r="10" fill="#fdcb6e"/><line x1="20" y1="100" x2="180" y2="100" stroke="rgba(253,203,110,0.3)" stroke-width="1"/>` },
      { label: "Dragon Badge", shape: `<defs><linearGradient id="dbg" x1="0.5" y1="0" x2="0.5" y2="1"><stop offset="0%" stop-color="#e17055"/><stop offset="100%" stop-color="#d63031"/></linearGradient></defs><path d="M100 15 L175 50 L175 110 Q175 160 100 190 Q25 160 25 110 L25 50Z" fill="url(#dbg)"/><ellipse cx="100" cy="90" rx="40" ry="30" fill="rgba(253,203,110,0.3)"/><path d="M70 75 Q100 95 130 75" fill="none" stroke="#fdcb6e" stroke-width="2"/><circle cx="84" cy="83" r="6" fill="#2d3436"/><circle cx="116" cy="83" r="6" fill="#2d3436"/><text x="100" y="130" text-anchor="middle" fill="#fdcb6e" font-family="Arial" font-weight="bold" font-size="14">${t}</text>` },
      { label: "Dragon Text", shape: `<defs><linearGradient id="dtg" x1="0" y1="0" x2="1" y2="1"><stop offset="0%" stop-color="#f39c12"/><stop offset="100%" stop-color="#d63031"/></linearGradient></defs><path d="M30 50 C20 80 20 120 30 150 C40 170 60 160 100 155 C140 160 160 170 170 150 C180 120 180 80 170 50 C155 30 130 15 100 15 C70 15 45 30 30 50Z" fill="url(#dtg)"/><text x="100" y="108" text-anchor="middle" fill="white" font-family="Arial" font-weight="bold" font-size="20">${t}</text>` },
    ]);
  }

  // ── Sunflower ─────────────────────────────────────────────
  if (is(["hướng dương", "sunflower", "huong duong"])) {
    return makeSVGs(seed, [
      { label: "Sunflower", shape: `${Array.from({length:16},(_,i)=>{const a=i*22.5;const x=100+68*Math.cos(a*Math.PI/180),y=100+68*Math.sin(a*Math.PI/180);return `<ellipse cx="${x}" cy="${y}" rx="10" ry="22" fill="#f1c40f" transform="rotate(${a} ${x} ${y})"/>`}).join('')}<circle cx="100" cy="100" r="35" fill="#8B4513"/><circle cx="100" cy="100" r="28" fill="#5D2E0C"/>${Array.from({length:12},(_,i)=>{const a=i*30;const x=100+18*Math.cos(a*Math.PI/180),y=100+18*Math.sin(a*Math.PI/180);return `<circle cx="${x}" cy="${y}" r="4" fill="#f1c40f" opacity="0.7"/>`}).join('')}` },
      { label: "Sunflower Duo", shape: `${Array.from({length:12},(_,i)=>{const a=i*30;const x=70+45*Math.cos(a*Math.PI/180),y=80+45*Math.sin(a*Math.PI/180);return `<ellipse cx="${x}" cy="${y}" rx="8" ry="18" fill="#f1c40f" transform="rotate(${a} ${x} ${y})"/>`}).join('')}<circle cx="70" cy="80" r="24" fill="#5D2E0C"/>${Array.from({length:10},(_,i)=>{const a=i*36;const x=145+40*Math.cos(a*Math.PI/180),y=120+40*Math.sin(a*Math.PI/180);return `<ellipse cx="${x}" cy="${y}" rx="7" ry="16" fill="#fdcb6e" transform="rotate(${a} ${x} ${y})"/>`}).join('')}<circle cx="145" cy="120" r="20" fill="#6B3A2A"/>` },
      { label: "Sunflower Badge", shape: `<circle cx="100" cy="100" r="88" fill="#fff9e6"/><circle cx="100" cy="100" r="88" fill="none" stroke="#f1c40f" stroke-width="4"/>${Array.from({length:14},(_,i)=>{const a=i*25.7;const x=100+68*Math.cos(a*Math.PI/180),y=100+68*Math.sin(a*Math.PI/180);return `<ellipse cx="${x}" cy="${y}" rx="9" ry="20" fill="#f39c12" transform="rotate(${a} ${x} ${y})"/>`}).join('')}<circle cx="100" cy="100" r="32" fill="#7B3F00"/>` },
      { label: "Sunflower Minimal", shape: `${Array.from({length:8},(_,i)=>{const a=i*45;const x=100+60*Math.cos(a*Math.PI/180),y=100+60*Math.sin(a*Math.PI/180);return `<ellipse cx="${x}" cy="${y}" rx="12" ry="28" fill="#f1c40f" opacity="0.9" transform="rotate(${a} ${x} ${y})"/>`}).join('')}<circle cx="100" cy="100" r="28" fill="#4A2106"/><line x1="100" y1="128" x2="100" y2="185" stroke="#27ae60" stroke-width="4"/><ellipse cx="80" cy="175" rx="22" ry="10" fill="#27ae60" opacity="0.6"/>` },
      { label: "Sunflower Field", shape: `${[{cx:65,cy:140,r:28},{cx:100,cy:120,r:36},{cx:140,cy:138,r:26}].map(f=>`${Array.from({length:10},(_,i)=>{const a=i*36;const x=f.cx+f.r*Math.cos(a*Math.PI/180),y=f.cy+f.r*Math.sin(a*Math.PI/180);return `<ellipse cx="${x}" cy="${y}" rx="6" ry="14" fill="#f1c40f" transform="rotate(${a} ${x} ${y})"/>`}).join('')}<circle cx="${f.cx}" cy="${f.cy}" r="${f.r*0.6}" fill="#5D2E0C"/>`).join('')}` },
      { label: "Sunflower + Text", shape: `${Array.from({length:14},(_,i)=>{const a=i*25.7;const x=100+60*Math.cos(a*Math.PI/180),y=85+60*Math.sin(a*Math.PI/180);return `<ellipse cx="${x}" cy="${y}" rx="9" ry="20" fill="#f1c40f" transform="rotate(${a} ${x} ${y})"/>`}).join('')}<circle cx="100" cy="85" r="28" fill="#6B3A2A"/><text x="100" y="165" text-anchor="middle" fill="#f39c12" font-family="Arial" font-weight="bold" font-size="15">${t}</text>` },
    ]);
  }

  // ── Sakura / Cherry Blossom ────────────────────────────────
  if (is(["sakura", "anh đào", "hoa đào", "cherry blossom", "đào", "cherry"])) {
    return makeSVGs(seed, [
      { label: "Sakura Branch", shape: `<line x1="40" y1="180" x2="160" y2="60" stroke="#8B4B62" stroke-width="5"/><line x1="100" y1="120" x2="165" y2="105" stroke="#8B4B62" stroke-width="3"/><line x1="80" y1="140" x2="45" y2="110" stroke="#8B4B62" stroke-width="3"/>${Array.from({length:6},(_,i)=>{const cx=[90,130,158,50,120,75][i],cy=[55,80,105,115,130,165][i];return Array.from({length:5},(_,j)=>{const a=j*72-90;const px=cx+18*Math.cos(a*Math.PI/180),py=cy+18*Math.sin(a*Math.PI/180);return `<ellipse cx="${px}" cy="${py}" rx="10" ry="14" fill="#ffb7c5" opacity="0.9" transform="rotate(${a+90} ${px} ${py})"/>`}).join('')+`<circle cx="${cx}" cy="${cy}" r="6" fill="#ffe5ec"/>`}).join('')}` },
      { label: "Sakura Bloom", shape: `${Array.from({length:5},(_,i)=>{const a=i*72-90;const px=100+55*Math.cos(a*Math.PI/180),py=100+55*Math.sin(a*Math.PI/180);return `<ellipse cx="${px}" cy="${py}" rx="22" ry="32" fill="#ffb7c5" opacity="0.85" transform="rotate(${a+90} ${px} ${py})"/>`}).join('')}<circle cx="100" cy="100" r="18" fill="#ffe5ec"/>${Array.from({length:5},(_,i)=>{const a=i*72-90;const px=100+18*Math.cos(a*Math.PI/180),py=100+18*Math.sin(a*Math.PI/180);return `<line x1="100" y1="100" x2="${px}" y2="${py}" stroke="#e84393" stroke-width="1.5"/><circle cx="${px}" cy="${py}" r="3" fill="#e84393"/>`}).join('')}` },
      { label: "Sakura Scatter", shape: `${Array.from({length:5},(_,i)=>{const cx=[55,140,95,35,160][i],cy=[50,40,100,145,140][i];return Array.from({length:5},(_,j)=>{const a=j*72-90;const px=cx+14*Math.cos(a*Math.PI/180),py=cy+14*Math.sin(a*Math.PI/180);return `<ellipse cx="${px}" cy="${py}" rx="8" ry="11" fill="#ffb7c5" opacity="0.8" transform="rotate(${a+90} ${px} ${py})"/>`}).join('')+`<circle cx="${cx}" cy="${cy}" r="4" fill="#ffe5ec"/>`}).join('')}${Array.from({length:8},(_,i)=>{const x=20+i*22,y=160+Math.sin(i*1.2)*8;return `<ellipse cx="${x}" cy="${y}" rx="6" ry="8" fill="#ffb7c5" opacity="0.5" transform="rotate(${i*45} ${x} ${y})"/>`}).join('')}` },
      { label: "Sakura Circle", shape: `<circle cx="100" cy="100" r="85" fill="#fff0f5"/>${Array.from({length:8},(_,i)=>{const a=i*45;const cx=100+62*Math.cos(a*Math.PI/180),cy=100+62*Math.sin(a*Math.PI/180);return Array.from({length:5},(_,j)=>{const pa=j*72-90;const px=cx+12*Math.cos(pa*Math.PI/180),py=cy+12*Math.sin(pa*Math.PI/180);return `<ellipse cx="${px}" cy="${py}" rx="6" ry="9" fill="#ffb7c5" opacity="0.8" transform="rotate(${pa+90} ${px} ${py})"/>`}).join('')+`<circle cx="${cx}" cy="${cy}" r="4" fill="#ffe5ec"/>`}).join('')}<circle cx="100" cy="100" r="22" fill="#ffb7c5"/><circle cx="100" cy="100" r="14" fill="#ffe5ec"/>` },
      { label: "Sakura Minimal", shape: `${Array.from({length:5},(_,i)=>{const a=i*72-90;const px=100+50*Math.cos(a*Math.PI/180),py=100+50*Math.sin(a*Math.PI/180);return `<ellipse cx="${px}" cy="${py}" rx="18" ry="26" fill="none" stroke="#e84393" stroke-width="2" opacity="0.7" transform="rotate(${a+90} ${px} ${py})"/>`}).join('')}<circle cx="100" cy="100" r="16" fill="none" stroke="#e84393" stroke-width="2"/>` },
      { label: "Sakura + Text", shape: `${Array.from({length:5},(_,i)=>{const a=i*72-90;const px=100+52*Math.cos(a*Math.PI/180),py=85+52*Math.sin(a*Math.PI/180);return `<ellipse cx="${px}" cy="${py}" rx="20" ry="28" fill="#ffb7c5" opacity="0.85" transform="rotate(${a+90} ${px} ${py})"/>`}).join('')}<circle cx="100" cy="85" r="16" fill="#ffe5ec"/><text x="100" y="165" text-anchor="middle" fill="#e84393" font-family="Arial" font-weight="bold" font-size="15">${t}</text>` },
    ]);
  }

  // ── Rose ──────────────────────────────────────────────────
  if (is(["hoa hồng", "rose"])) {
    return makeSVGs(seed, [
      { label: "Rose Bloom", shape: `<defs><radialGradient id="rg"><stop offset="0%" stop-color="#fdcb6e"/><stop offset="40%" stop-color="#fd79a8"/><stop offset="100%" stop-color="#d63031"/></radialGradient></defs><circle cx="100" cy="100" r="70" fill="url(#rg)"/>${Array.from({length:5},(_,i)=>{const a=i*72-90;const r=55;const x=100+r*Math.cos(a*Math.PI/180),y=100+r*Math.sin(a*Math.PI/180);return `<ellipse cx="${x}" cy="${y}" rx="18" ry="28" fill="rgba(214,48,49,0.6)" transform="rotate(${a+90} ${x} ${y})"/>`}).join('')}<circle cx="100" cy="100" r="22" fill="#fdcb6e"/>` },
      { label: "Rose Outline", shape: `${Array.from({length:5},(_,i)=>{const a=i*72-90;const r=55;const x=100+r*Math.cos(a*Math.PI/180),y=100+r*Math.sin(a*Math.PI/180);return `<ellipse cx="${x}" cy="${y}" rx="18" ry="28" fill="none" stroke="#d63031" stroke-width="2" transform="rotate(${a+90} ${x} ${y})"/>`}).join('')}<circle cx="100" cy="100" r="22" fill="none" stroke="#d63031" stroke-width="2"/>` },
      { label: "Rose + Stem", shape: `${Array.from({length:5},(_,i)=>{const a=i*72-90;const r=45;const x=90+r*Math.cos(a*Math.PI/180),y=80+r*Math.sin(a*Math.PI/180);return `<ellipse cx="${x}" cy="${y}" rx="16" ry="24" fill="#d63031" opacity="0.85" transform="rotate(${a+90} ${x} ${y})"/>`}).join('')}<circle cx="90" cy="80" r="18" fill="#e84393"/><line x1="90" y1="125" x2="90" y2="185" stroke="#27ae60" stroke-width="4"/><ellipse cx="70" cy="165" rx="22" ry="10" fill="#27ae60" opacity="0.6"/>` },
    ]);
  }

  // ── Lotus / Sen ────────────────────────────────────────────
  if (is(["hoa sen", "sen", "lotus"])) {
    return makeSVGs(seed, [
      { label: "Lotus Bloom", shape: `<defs><linearGradient id="lfg" x1="0.5" y1="0" x2="0.5" y2="1"><stop offset="0%" stop-color="#fd79a8"/><stop offset="100%" stop-color="#e84393"/></linearGradient></defs>${Array.from({length:8},(_,i)=>{const a=i*45;const x=100+55*Math.sin(a*Math.PI/180),y=100-55*Math.cos(a*Math.PI/180);return `<ellipse cx="${(100+x)/2}" cy="${(100+y)/2}" rx="20" ry="35" fill="url(#lfg)" opacity="0.85" transform="rotate(${a} 100 100)"/>`}).join('')}<circle cx="100" cy="100" r="20" fill="#fdcb6e"/>` },
      { label: "Lotus Minimal", shape: `<defs><linearGradient id="lmg" x1="0.5" y1="0" x2="0.5" y2="1"><stop offset="0%" stop-color="#fd79a8"/><stop offset="100%" stop-color="#e84393"/></linearGradient></defs><path d="M100 160 Q60 130 40 90 Q60 95 100 110 Q140 95 160 90 Q140 130 100 160Z" fill="url(#lmg)" opacity="0.9"/><path d="M100 145 Q55 110 50 70 Q70 85 100 100 Q130 85 150 70 Q145 110 100 145Z" fill="url(#lmg)" opacity="0.7"/><path d="M100 130 Q65 100 70 55 Q85 75 100 90 Q115 75 130 55 Q135 100 100 130Z" fill="url(#lmg)" opacity="0.9"/><line x1="100" y1="160" x2="100" y2="185" stroke="#00b894" stroke-width="3"/><ellipse cx="80" cy="180" rx="25" ry="12" fill="#00b894" opacity="0.5"/>` },
    ]);
  }

  // ── Generic flower ─────────────────────────────────────────
  if (is(["hoa", "flower"])) {
    return makeSVGs(seed, [
      { label: "Lotus Bloom", shape: `<defs><linearGradient id="lfg" x1="0.5" y1="0" x2="0.5" y2="1"><stop offset="0%" stop-color="#fd79a8"/><stop offset="100%" stop-color="#e84393"/></linearGradient></defs>${Array.from({length:8},(_,i)=>{const a=i*45;const x=100+55*Math.sin(a*Math.PI/180),y=100-55*Math.cos(a*Math.PI/180);return `<ellipse cx="${(100+x)/2}" cy="${(100+y)/2}" rx="20" ry="35" fill="url(#lfg)" opacity="0.85" transform="rotate(${a} 100 100)"/>`}).join('')}<circle cx="100" cy="100" r="20" fill="#fdcb6e"/>` },
      { label: "Sunflower", shape: `${Array.from({length:16},(_,i)=>{const a=i*22.5;const x=100+68*Math.cos(a*Math.PI/180),y=100+68*Math.sin(a*Math.PI/180);return `<ellipse cx="${x}" cy="${y}" rx="10" ry="22" fill="#f1c40f" transform="rotate(${a} ${x} ${y})"/>`}).join('')}<circle cx="100" cy="100" r="35" fill="#8B4513"/><circle cx="100" cy="100" r="28" fill="#5D2E0C"/>` },
      { label: "Rose", shape: `<defs><radialGradient id="rg"><stop offset="0%" stop-color="#fdcb6e"/><stop offset="40%" stop-color="#fd79a8"/><stop offset="100%" stop-color="#d63031"/></radialGradient></defs><circle cx="100" cy="100" r="70" fill="url(#rg)"/>${Array.from({length:5},(_,i)=>{const a=i*72-90;const r=55;const x=100+r*Math.cos(a*Math.PI/180),y=100+r*Math.sin(a*Math.PI/180);return `<ellipse cx="${x}" cy="${y}" rx="18" ry="28" fill="rgba(214,48,49,0.6)" transform="rotate(${a+90} ${x} ${y})"/>`}).join('')}<circle cx="100" cy="100" r="22" fill="#fdcb6e"/>` },
      { label: "Sakura", shape: `${Array.from({length:5},(_,i)=>{const a=i*72-90;const px=100+55*Math.cos(a*Math.PI/180),py=100+55*Math.sin(a*Math.PI/180);return `<ellipse cx="${px}" cy="${py}" rx="22" ry="32" fill="#ffb7c5" opacity="0.85" transform="rotate(${a+90} ${px} ${py})"/>`}).join('')}<circle cx="100" cy="100" r="18" fill="#ffe5ec"/>` },
      { label: "Flower Badge", shape: `<circle cx="100" cy="100" r="85" fill="#fff0f5"/><circle cx="100" cy="100" r="85" fill="none" stroke="#e84393" stroke-width="3"/>${Array.from({length:8},(_,i)=>{const a=i*45;const px=100+58*Math.cos(a*Math.PI/180),py=100+58*Math.sin(a*Math.PI/180);return `<circle cx="${px}" cy="${py}" r="18" fill="#fd79a8" opacity="0.7"/>`}).join('')}<circle cx="100" cy="100" r="25" fill="#fdcb6e"/>` },
      { label: "Flower + Text", shape: `${Array.from({length:8},(_,i)=>{const a=i*45;const px=100+52*Math.cos(a*Math.PI/180),py=88+52*Math.sin(a*Math.PI/180);return `<circle cx="${px}" cy="${py}" r="16" fill="#fd79a8" opacity="0.75"/>`}).join('')}<circle cx="100" cy="88" r="24" fill="#fdcb6e"/><text x="100" y="162" text-anchor="middle" fill="#e84393" font-family="Arial" font-weight="bold" font-size="14">${t}</text>` },
    ]);
  }

  if (is(["sao", "star", "ngôi sao"])) {
    return makeSVGs(seed, [
      { label: "Star Gold", shape: `<defs><linearGradient id="sg" x1="0.5" y1="0" x2="0.5" y2="1"><stop offset="0%" stop-color="#f1c40f"/><stop offset="100%" stop-color="#f39c12"/></linearGradient></defs><polygon points="100,10 125,75 195,75 138,118 158,185 100,145 42,185 62,118 5,75 75,75" fill="url(#sg)"/>` },
      { label: "Star Neon", shape: `<defs><filter id="glow"><feGaussianBlur stdDeviation="5" result="blur"/><feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge></filter></defs><polygon points="100,10 125,75 195,75 138,118 158,185 100,145 42,185 62,118 5,75 75,75" fill="none" stroke="#f1c40f" stroke-width="3" filter="url(#glow)"/>` },
      { label: "5 Stars", shape: `${[0,1,2,3,4].map(i=>{const x=35+i*34;return `<polygon points="${x},25 ${x+7},18 ${x+14},25 ${x+6},32 ${x+2},32" fill="#f1c40f"/>`}).join('')}<polygon points="100,55 120,105 175,105 132,135 148,185 100,158 52,185 68,135 25,105 80,105" fill="#f39c12"/>` },
      { label: "Star Badge", shape: `<polygon points="100,10 125,75 195,75 138,118 158,185 100,145 42,185 62,118 5,75 75,75" fill="#f39c12"/><polygon points="100,35 118,83 170,83 128,112 144,161 100,134 56,161 72,112 30,83 82,83" fill="rgba(255,255,255,0.2)"/><text x="100" y="110" text-anchor="middle" fill="white" font-family="Arial" font-weight="bold" font-size="18">${t}</text>` },
      { label: "Shooting Star", shape: `<defs><linearGradient id="stg" x1="0" y1="0" x2="1" y2="1"><stop offset="0%" stop-color="#f1c40f"/><stop offset="100%" stop-color="transparent"/></linearGradient></defs><polygon points="140,40 155,80 190,80 162,103 172,143 140,122 108,143 118,103 90,80 125,80" fill="#f1c40f"/><path d="M30 180 L138 42" stroke="url(#stg)" stroke-width="4" stroke-linecap="round"/><path d="M20 170 L100 60" stroke="rgba(241,196,15,0.4)" stroke-width="2" stroke-linecap="round"/>` },
      { label: "Star Pattern", shape: `${Array.from({length:7},(_,i)=>{const r=i%2===0?50:25;const a=i*51;const x=100+r*Math.cos(a*Math.PI/180),y=100+r*Math.sin(a*Math.PI/180);const s=i%2===0?22:14;return `<polygon points="${x},${y-s} ${x+s*0.4},${y-s*0.2} ${x+s*0.9},${y-s*0.3} ${x+s*0.5},${y+s*0.2} ${x+s*0.7},${y+s*0.8} ${x},${y+s*0.5} ${x-s*0.7},${y+s*0.8} ${x-s*0.5},${y+s*0.2} ${x-s*0.9},${y-s*0.3} ${x-s*0.4},${y-s*0.2}" fill="#f1c40f" opacity="${0.5+i*0.07}"/>`}).join('')}` },
    ]);
  }

  if (is(["mặt trời", "sun", "sunshine"])) {
    return makeSVGs(seed, [
      { label: "Sun Burst", shape: `${Array.from({length:16},(_,i)=>{const a=i*22.5;const x1=100+45*Math.cos(a*Math.PI/180),y1=100+45*Math.sin(a*Math.PI/180),x2=100+80*Math.cos(a*Math.PI/180),y2=100+80*Math.sin(a*Math.PI/180);return `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="#f1c40f" stroke-width="${i%2===0?4:2}" stroke-linecap="round"/>`}).join('')}<circle cx="100" cy="100" r="42" fill="#f39c12"/><circle cx="100" cy="100" r="35" fill="#f1c40f"/>` },
      { label: "Sun Smile", shape: `${Array.from({length:12},(_,i)=>{const a=i*30;const x1=100+48*Math.cos(a*Math.PI/180),y1=100+48*Math.sin(a*Math.PI/180),x2=100+75*Math.cos(a*Math.PI/180),y2=100+75*Math.sin(a*Math.PI/180);return `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="#fdcb6e" stroke-width="3" stroke-linecap="round"/>`}).join('')}<circle cx="100" cy="100" r="45" fill="#f1c40f"/><circle cx="88" cy="92" r="6" fill="#e17055"/><circle cx="112" cy="92" r="6" fill="#e17055"/><path d="M82 114 Q100 128 118 114" fill="none" stroke="#e17055" stroke-width="4" stroke-linecap="round"/>` },
    ]);
  }

  if (is(["lửa", "fire", "flame", "ngọn lửa"])) {
    return makeSVGs(seed, [
      { label: "Flame", shape: `<defs><linearGradient id="flg" x1="0.5" y1="1" x2="0.5" y2="0"><stop offset="0%" stop-color="#d63031"/><stop offset="50%" stop-color="#f39c12"/><stop offset="100%" stop-color="#f1c40f"/></linearGradient></defs><path d="M100 18 C122 55 168 75 155 122 C148 148 130 162 118 166 C126 144 114 120 100 108 C86 120 74 144 82 166 C70 162 52 148 45 122 C32 75 78 55 100 18Z" fill="url(#flg)"/><ellipse cx="100" cy="160" rx="32" ry="10" fill="rgba(214,48,49,0.2)"/>` },
      { label: "Fire Ring", shape: `${Array.from({length:12},(_,i)=>{const a=i*30;const r=70;const x=100+r*Math.cos(a*Math.PI/180),y=100+r*Math.sin(a*Math.PI/180);return `<path d="M${x} ${y} C${x+10} ${y-20} ${x+5} ${y-35} ${x} ${y-25} C${x-5} ${y-35} ${x-10} ${y-20} ${x} ${y}Z" fill="#f39c12" transform="rotate(${a+90} ${x} ${y})" opacity="0.8"/>`}).join('')}<circle cx="100" cy="100" r="25" fill="#d63031"/>` },
    ]);
  }

  if (is(["cầu vồng", "rainbow"])) {
    return makeSVGs(seed, [
      { label: "Rainbow", shape: `${["#d63031","#e17055","#f1c40f","#00b894","#0984e3","#6c5ce7"].map((c,i)=>`<path d="M${15+i*9} ${160+i*3} A${85-i*9} ${85-i*9} 0 0 1 ${185-i*9} ${160+i*3}" fill="none" stroke="${c}" stroke-width="8" stroke-linecap="round"/>`).join('')}<path d="M20 175 L40 175" stroke="#f1c40f" stroke-width="3"/><path d="M160 175 L180 175" stroke="#f1c40f" stroke-width="3"/>` },
    ]);
  }

  if (is(["bóng đá", "football", "soccer", "sport", "thể thao", "bóng rổ", "basketball"])) {
    return makeSVGs(seed, [
      { label: "Sport Badge", shape: `<defs><linearGradient id="sbg" x1="0.5" y1="0" x2="0.5" y2="1"><stop offset="0%" stop-color="#0984e3"/><stop offset="100%" stop-color="#2d3436"/></linearGradient></defs><path d="M100 15 L175 50 L175 110 Q175 160 100 190 Q25 160 25 110 L25 50Z" fill="url(#sbg)"/><circle cx="100" cy="90" r="30" fill="white" opacity="0.15"/><text x="100" y="95" text-anchor="middle" fill="white" font-family="Arial" font-weight="bold" font-size="15">${t}</text><text x="100" y="140" text-anchor="middle" fill="#fdcb6e" font-family="Arial" font-size="11">2026</text>` },
      { label: "Football", shape: `<circle cx="100" cy="100" r="75" fill="#2d3436"/><circle cx="100" cy="100" r="75" fill="none" stroke="white" stroke-width="2"/><polygon points="100,38 116,62 108,88 92,88 84,62" fill="white"/><polygon points="155,72 140,94 116,88 108,64 126,46" fill="white"/><polygon points="144,130 118,140 108,116 124,96 150,100" fill="white"/><polygon points="100,162 82,145 88,120 112,120 118,145" fill="white"/><polygon points="56,130 50,100 76,96 92,116 82,140" fill="white"/><polygon points="45,72 74,46 92,64 84,88 60,94" fill="white"/>` },
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
  return items.map((item, i) => ({
    id: `smart-${seed}-${i}`,
    label: item.label,
    url: `data:image/svg+xml,${encodeURIComponent(`<svg viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg">${item.shape}</svg>`)}`,
  }));
}
