import { NextRequest, NextResponse } from "next/server";
import { readFile, stat } from "fs/promises";
import path from "path";

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

    const filePath = path.join(process.cwd(), "orders", id, file);

    try {
      await stat(filePath);
    } catch {
      return NextResponse.json({ error: "File not found" }, { status: 404 });
    }

    const fileBuffer = await readFile(filePath);

    return new NextResponse(fileBuffer, {
      headers: {
        "Content-Type": "image/png",
        "Content-Disposition": `attachment; filename="${id}_${file}"`,
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
