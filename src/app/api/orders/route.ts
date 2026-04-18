import { NextRequest, NextResponse } from "next/server";
import { getAllOrders, createOrder } from "../../../lib/orderService";
import { requireAdmin } from "../../../lib/authService";
import crypto from "crypto";

/**
 * GET /api/orders — List all orders (ADMIN ONLY)
 */
export async function GET(req: NextRequest) {
  // Verify admin session
  const session = requireAdmin(req);
  if (!session) {
    return NextResponse.json(
      { error: "Unauthorized — vui lòng đăng nhập" },
      { status: 401 }
    );
  }

  try {
    const orders = await getAllOrders();
    return NextResponse.json({ orders });
  } catch (error) {
    console.error("List orders error:", error);
    return NextResponse.json({ orders: [] });
  }
}

/**
 * POST /api/orders — Create new order (PUBLIC — customers submit orders)
 */
export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();

    const name     = formData.get("name") as string;
    const phone    = formData.get("phone") as string;
    const email    = formData.get("email") as string;
    const address  = formData.get("address") as string;
    const size     = formData.get("size") as string;
    const color    = formData.get("color") as string;
    const sleeveColor = formData.get("sleeveColor") as string;
    const collarColor = formData.get("collarColor") as string;
    const quantity = formData.get("quantity") as string;
    const notes    = formData.get("notes") as string;
    const shirtType = formData.get("shirtType") as string;
    const frontDesign = formData.get("frontDesign") as File | null;
    const backDesign  = formData.get("backDesign") as File | null;

    // Input validation
    if (!name || !phone || !address) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    // Sanitize inputs
    const cleanName = name.trim().slice(0, 200);
    const cleanPhone = phone.trim().replace(/[^\d+\-\s()]/g, "").slice(0, 20);
    const cleanEmail = (email || "").trim().toLowerCase().slice(0, 200);
    const cleanAddress = address.trim().slice(0, 500);
    const cleanSize = (size || "M").trim().slice(0, 10);
    const cleanColor = (color || "#ffffff").trim().slice(0, 20);
    const cleanQty = Math.max(1, Math.min(100, parseInt(quantity) || 1));
    const cleanNotes = (notes || "").trim().slice(0, 1000);
    const cleanShirtType = (shirtType || "tshirt").trim().slice(0, 20);
    const cleanSleeveColor = (sleeveColor || "").trim().slice(0, 20);
    const cleanCollarColor = (collarColor || "").trim().slice(0, 20);

    // Phone validation
    if (cleanPhone.length < 8) {
      return NextResponse.json({ error: "Số điện thoại không hợp lệ" }, { status: 400 });
    }

    const frontBlob = frontDesign && frontDesign.size > 0
      ? Buffer.from(await frontDesign.arrayBuffer()) : undefined;
    const backBlob = backDesign && backDesign.size > 0
      ? Buffer.from(await backDesign.arrayBuffer()) : undefined;

    // File size validation (max 5MB per file)
    if (frontBlob && frontBlob.length > 5 * 1024 * 1024) {
      return NextResponse.json({ error: "Front design file too large (max 5MB)" }, { status: 400 });
    }
    if (backBlob && backBlob.length > 5 * 1024 * 1024) {
      return NextResponse.json({ error: "Back design file too large (max 5MB)" }, { status: 400 });
    }

    // Generate secure order ID (prefix + random hex)
    const secureId = `ORD-${Date.now().toString(36).toUpperCase()}-${crypto.randomBytes(3).toString("hex").toUpperCase()}`;

    const { orderId } = await createOrder(
      {
        customerName: cleanName,
        phone: cleanPhone,
        email: cleanEmail,
        address: cleanAddress,
        size: cleanSize,
        color: cleanColor,
        sleeveColor: cleanSleeveColor || undefined,
        collarColor: cleanCollarColor || undefined,
        quantity: cleanQty,
        notes: cleanNotes,
        shirtType: cleanShirtType,
        status: "pending",
      },
      frontBlob,
      backBlob,
      secureId,
    );

    return NextResponse.json({ success: true, orderId, message: "Đơn hàng đã được gửi thành công!" });
  } catch (error) {
    console.error("Order API Error:", error);
    return NextResponse.json({ error: "Failed to save order" }, { status: 500 });
  }
}
