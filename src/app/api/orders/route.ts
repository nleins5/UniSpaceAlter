import { NextRequest, NextResponse } from "next/server";
import { writeFile, mkdir, readdir, readFile } from "fs/promises";
import path from "path";
import { existsSync } from "fs";

// GET /api/orders - List all orders (like angular-app-master's collection proxy)
export async function GET() {
  try {
    const ordersDir = path.join(process.cwd(), "orders");
    if (!existsSync(ordersDir)) {
      return NextResponse.json({ orders: [] });
    }

    const dirs = await readdir(ordersDir, { withFileTypes: true });
    const orders = [];

    for (const dir of dirs) {
      if (dir.isDirectory()) {
        const orderFile = path.join(ordersDir, dir.name, "order.json");
        try {
          const data = await readFile(orderFile, "utf8");
          orders.push(JSON.parse(data));
        } catch {
          // Skip invalid orders
        }
      }
    }

    // Sort by newest first
    orders.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    return NextResponse.json({ orders });
  } catch (error) {
    console.error("List orders error:", error);
    return NextResponse.json({ orders: [] });
  }
}

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();

    const name = formData.get("name") as string;
    const phone = formData.get("phone") as string;
    const email = formData.get("email") as string;
    const address = formData.get("address") as string;
    const size = formData.get("size") as string;
    const color = formData.get("color") as string;
    const quantity = formData.get("quantity") as string;
    const notes = formData.get("notes") as string;
    const frontDesign = formData.get("frontDesign") as File | null;
    const backDesign = formData.get("backDesign") as File | null;

    if (!name || !phone || !address) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    // Create orders directory
    const ordersDir = path.join(process.cwd(), "orders");
    await mkdir(ordersDir, { recursive: true });

    const orderId = `ORD-${Date.now()}`;
    const orderDir = path.join(ordersDir, orderId);
    await mkdir(orderDir, { recursive: true });

    // Save design images
    if (frontDesign && frontDesign.size > 0) {
      const frontBuffer = Buffer.from(await frontDesign.arrayBuffer());
      await writeFile(path.join(orderDir, "front_design.png"), frontBuffer);
    }

    if (backDesign && backDesign.size > 0) {
      const backBuffer = Buffer.from(await backDesign.arrayBuffer());
      await writeFile(path.join(orderDir, "back_design.png"), backBuffer);
    }

    // Save order info
    const orderInfo = {
      orderId,
      customerName: name,
      phone,
      email: email || "",
      address,
      size,
      color,
      quantity: parseInt(quantity) || 1,
      notes: notes || "",
      createdAt: new Date().toISOString(),
      status: "pending",
    };

    await writeFile(
      path.join(orderDir, "order.json"),
      JSON.stringify(orderInfo, null, 2)
    );

    return NextResponse.json({
      success: true,
      orderId,
      message: "Đơn hàng đã được gửi thành công!",
    });
  } catch (error) {
    console.error("Order API Error:", error);
    return NextResponse.json(
      { error: "Failed to save order" },
      { status: 500 }
    );
  }
}
