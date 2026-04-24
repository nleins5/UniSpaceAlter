import { NextRequest, NextResponse } from "next/server";
import { isSupabaseConfigured, supabase } from "../../../../lib/supabase";

/**
 * POST /api/admin/upload-design
 * Accepts: FormData with field "file" (PNG/JPEG)
 * Returns: { url: string }
 *   1. Supabase Storage (if configured & bucket exists)
 *   2. Base64 data URL fallback (works on read-only filesystems like Vercel)
 */
export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const ext = file.type === "image/png" ? "png" : "jpg";
    const uniqueName = `${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;

    // ── Strategy 1: Supabase Storage ──────────────────────────
    if (isSupabaseConfigured && supabase) {
      const fileName = `designs/${uniqueName}`;
      const { error } = await supabase.storage
        .from("design-previews")
        .upload(fileName, buffer, { contentType: file.type, upsert: false });

      if (!error) {
        const { data: urlData } = supabase.storage
          .from("design-previews")
          .getPublicUrl(fileName);
        return NextResponse.json({ url: urlData.publicUrl });
      }
      console.warn("[upload-design] Supabase Storage failed, falling back to data URL:", error.message);
    }

    // ── Strategy 2: Base64 data URL (serverless-safe) ─────────
    const mimeType = file.type || (ext === "png" ? "image/png" : "image/jpeg");
    const base64 = buffer.toString("base64");
    const dataUrl = `data:${mimeType};base64,${base64}`;
    return NextResponse.json({ url: dataUrl });
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    console.error("[POST /api/admin/upload-design]", msg);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
