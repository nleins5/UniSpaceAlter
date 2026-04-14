import { NextRequest, NextResponse } from "next/server";
import { readFile, readdir, stat, writeFile } from "fs/promises";
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

// PATCH /api/orders/[id] — update order status
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { status } = await req.json();

    const VALID_STATUSES = ["pending", "confirmed", "manufacturing", "completed", "cancelled"];
    if (!status || !VALID_STATUSES.includes(status)) {
      return NextResponse.json({ error: "Invalid status" }, { status: 400 });
    }

    const orderPath = path.join(process.cwd(), "orders", id, "order.json");

    try {
      await stat(orderPath);
    } catch {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }

    const orderInfo = JSON.parse(await readFile(orderPath, "utf-8"));
    orderInfo.status = status;
    orderInfo.updatedAt = new Date().toISOString();

    await writeFile(orderPath, JSON.stringify(orderInfo, null, 2));

    return NextResponse.json({ success: true, orderId: id, status });
  } catch (error) {
    console.error("Update order error:", error);
    return NextResponse.json(
      { error: "Failed to update order" },
      { status: 500 }
    );
  }
}
