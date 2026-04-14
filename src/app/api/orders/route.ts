import { NextRequest, NextResponse } from "next/server";
import { getAllOrders, createOrder } from "../../../lib/orderService";

export async function GET() {
  try {
    const orders = await getAllOrders();
    return NextResponse.json({ orders });
  } catch (error) {
    console.error("List orders error:", error);
    return NextResponse.json({ orders: [] });
  }
}

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();

    const name     = formData.get("name") as string;
    const phone    = formData.get("phone") as string;
    const email    = formData.get("email") as string;
    const address  = formData.get("address") as string;
    const size     = formData.get("size") as string;
    const color    = formData.get("color") as string;
    const quantity = formData.get("quantity") as string;
    const notes    = formData.get("notes") as string;
    const frontDesign = formData.get("frontDesign") as File | null;
    const backDesign  = formData.get("backDesign") as File | null;

    if (!name || !phone || !address) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const frontBlob = frontDesign && frontDesign.size > 0
      ? Buffer.from(await frontDesign.arrayBuffer()) : undefined;
    const backBlob = backDesign && backDesign.size > 0
      ? Buffer.from(await backDesign.arrayBuffer()) : undefined;

    const { orderId } = await createOrder(
      {
        customerName: name,
        phone,
        email: email || "",
        address,
        size,
        color,
        quantity: parseInt(quantity) || 1,
        notes: notes || "",
        status: "pending",
      },
      frontBlob,
      backBlob,
    );

    return NextResponse.json({ success: true, orderId, message: "Đơn hàng đã được gửi thành công!" });
  } catch (error) {
    console.error("Order API Error:", error);
    return NextResponse.json({ error: "Failed to save order" }, { status: 500 });
  }
}
