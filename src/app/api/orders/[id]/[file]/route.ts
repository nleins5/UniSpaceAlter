import { NextRequest, NextResponse } from "next/server";
import { getDesignFile } from "../../../../../lib/orderService";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string; file: string }> }
) {
  try {
    const { id, file } = await params;

    // Only allow specific files
    if (file !== "front_design.png" && file !== "back_design.png") {
      return NextResponse.json({ error: "Invalid file" }, { status: 400 });
    }

    const fileBuffer = await getDesignFile(id, file);

    if (!fileBuffer) {
      return NextResponse.json({ error: "File not found" }, { status: 404 });
    }

    // Check if download requested or inline display
    const isDownload = req.nextUrl.searchParams.get("dl") === "1";

    return new NextResponse(new Uint8Array(fileBuffer), {
      headers: {
        "Content-Type": "image/png",
        "Cache-Control": "public, max-age=3600",
        ...(isDownload
          ? { "Content-Disposition": `attachment; filename="${id}_${file}"` }
          : { "Content-Disposition": "inline" }),
      },
    });
  } catch (error) {
    console.error("File download error:", error);
    return NextResponse.json(
      { error: "Failed to download file" },
      { status: 500 }
    );
  }
}
