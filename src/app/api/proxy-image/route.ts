import { NextRequest, NextResponse } from "next/server";

export const maxDuration = 60;

async function fetchWithRetry(baseUrl: string, maxAttempts = 3): Promise<Response | null> {
  for (let i = 0; i < maxAttempts; i++) {
    try {
      // On retry, change the seed to get a fresh generation
      const url = i === 0 ? baseUrl : (() => {
        const u = new URL(baseUrl);
        u.searchParams.set('seed', String(Math.floor(Math.random() * 99999)));
        return u.toString();
      })();

      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 50000);
      const res = await fetch(url, {
        signal: controller.signal,
        headers: {
          "User-Agent": "Mozilla/5.0 (compatible; UniSpace/1.0)",
          "Accept": "image/webp,image/jpeg,image/*",
        },
      });
      clearTimeout(timeout);

      if (res.ok) return res;
      console.log(`Proxy attempt ${i + 1} got status ${res.status}, retrying...`);
    } catch (e) {
      console.log(`Proxy attempt ${i + 1} failed: ${(e as Error).message?.slice(0, 80)}`);
      if (i < maxAttempts - 1) await new Promise(r => setTimeout(r, 2000));
    }
  }
  return null;
}

export async function GET(req: NextRequest) {
  const url = req.nextUrl.searchParams.get("url");
  if (!url || !url.startsWith("https://image.pollinations.ai/")) {
    return NextResponse.json({ error: "Invalid URL" }, { status: 400 });
  }

  const res = await fetchWithRetry(url, 3);

  if (!res) {
    return NextResponse.json({ error: "Proxy failed after retries" }, { status: 504 });
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
}
