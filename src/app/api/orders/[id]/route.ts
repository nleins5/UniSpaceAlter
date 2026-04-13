import { NextRequest, NextResponse } from "next/server";
import { readFile, readdir, stat } from "fs/promises";
import path from "path";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const orderDir = path.join(process.cwd(), "orders", id);

    // Check if order exists
    try {
      await stat(orderDir);
    } catch {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }

    // Read order info
    const orderInfo = JSON.parse(
      await readFile(path.join(orderDir, "order.json"), "utf-8")
    );

    // Check for design files
    const files = await readdir(orderDir);
    const hasFrontDesign = files.includes("front_design.png");
    const hasBackDesign = files.includes("back_design.png");

    return NextResponse.json({
      ...orderInfo,
      hasFrontDesign,
      hasBackDesign,
    });
  } catch (error) {
    console.error("Get order error:", error);
    return NextResponse.json(
      { error: "Failed to fetch order" },
      { status: 500 }
    );
  }
}
