import { NextRequest, NextResponse } from "next/server";

// Allow up to 60s for Pollinations to generate (Vercel hobby max)
export const maxDuration = 60;

export async function GET(req: NextRequest) {
  const url = req.nextUrl.searchParams.get("url");
  if (!url || !url.startsWith("https://image.pollinations.ai/")) {
    return NextResponse.json({ error: "Invalid URL" }, { status: 400 });
  }

  // Single attempt with generous timeout — Pollinations needs 15-30s to generate
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 55000); // 55s (under 60s max)

    const res = await fetch(url, {
      signal: controller.signal,
      headers: {
        "User-Agent": "Mozilla/5.0 (compatible; UniSpace/1.0)",
        "Accept": "image/webp,image/jpeg,image/*",
      },
    });
    clearTimeout(timeout);

    if (!res.ok) {
      return NextResponse.json(
        { error: `Pollinations returned ${res.status}` },
        { status: res.status >= 400 && res.status < 500 ? 502 : 504 }
      );
    }

    const contentType = res.headers.get("content-type") || "image/jpeg";
    const buffer = await res.arrayBuffer();

    return new NextResponse(buffer, {
      status: 200,
      headers: {
        "Content-Type": contentType,
        "Cache-Control": "public, max-age=3600",
        "Access-Control-Allow-Origin": "*",
      },
    });
  } catch (e) {
    const msg = (e as Error).message || "Unknown error";
    console.log("Proxy-image failed:", msg.slice(0, 100));
    return NextResponse.json(
      { error: msg.includes("aborted") ? "Generation timed out (55s)" : msg },
      { status: 504 }
    );
  }
}
