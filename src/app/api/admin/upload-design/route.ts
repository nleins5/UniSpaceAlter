import { NextRequest, NextResponse } from "next/server";
import { isSupabaseConfigured, supabase } from "../../../../lib/supabase";
import { writeFile, mkdir } from "fs/promises";
import path from "path";

/**
 * POST /api/admin/upload-design
 * Accepts: FormData with field "file" (PNG/JPEG)
 * Returns: { url: string }
 *   1. Supabase Storage (if configured & bucket exists)
 *   2. Local filesystem fallback → /public/uploads/designs/
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
      console.warn("[upload-design] Supabase Storage failed, falling back to local:", error.message);
    }

    // ── Strategy 2: Local filesystem ──────────────────────────
    const uploadsDir = path.join(process.cwd(), "public", "uploads", "designs");
    await mkdir(uploadsDir, { recursive: true });
    const localPath = path.join(uploadsDir, uniqueName);
    await writeFile(localPath, buffer);

    // Return a path relative to /public so Next.js can serve it
    const publicUrl = `/uploads/designs/${uniqueName}`;
    return NextResponse.json({ url: publicUrl });
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    console.error("[POST /api/admin/upload-design]", msg);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
