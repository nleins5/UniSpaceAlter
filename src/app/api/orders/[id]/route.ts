import { NextRequest, NextResponse } from "next/server";
import { getOrder, updateOrderStatus, deleteOrder } from "../../../../lib/orderService";
import { requireAdmin, requireAuth } from "../../../../lib/authService";

/**
 * GET /api/orders/[id] — Get single order details
 * Requires at least a valid login session (admin or staff)
 */
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  // Require any authenticated session to view order details
  const session = requireAuth(req);
  if (!session) {
    return NextResponse.json(
      { error: "Unauthorized — vui lòng đăng nhập" },
      { status: 401 }
    );
  }

  try {
    const { id } = await params;

    // Sanitize order ID
    const cleanId = id.trim().slice(0, 50);

    const order = await getOrder(cleanId);
    if (!order) return NextResponse.json({ error: "Order not found" }, { status: 404 });
    return NextResponse.json(order);
  } catch (error) {
    console.error("Get order error:", error);
    return NextResponse.json({ error: "Failed to fetch order" }, { status: 500 });
  }
}

/**
 * PATCH /api/orders/[id] — Update order status (ADMIN ONLY)
 */
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  // Require admin session to change order status
  const session = requireAdmin(req);
  if (!session) {
    return NextResponse.json(
      { error: "Unauthorized — chỉ admin mới được thay đổi trạng thái" },
      { status: 401 }
    );
  }

  try {
    const { id } = await params;
    const body = await req.json();
    const { status } = body;

    const VALID_STATUSES = ["pending", "confirmed", "manufacturing", "completed", "cancelled"];
    if (!status || !VALID_STATUSES.includes(status)) {
      return NextResponse.json({ error: "Invalid status" }, { status: 400 });
    }

    // Sanitize order ID
    const cleanId = id.trim().slice(0, 50);

    const existing = await getOrder(cleanId);
    if (!existing) return NextResponse.json({ error: "Order not found" }, { status: 404 });

    await updateOrderStatus(cleanId, status);
    return NextResponse.json({ success: true, orderId: cleanId, status });
  } catch (error) {
    console.error("Update order error:", error);
    return NextResponse.json({ error: "Failed to update order" }, { status: 500 });
  }
}

/**
 * DELETE /api/orders/[id] — Delete order (ADMIN ONLY)
 */
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  // Only admins can delete orders
  const session = requireAdmin(req);
  if (!session) {
    return NextResponse.json(
      { error: "Unauthorized — chỉ Admin mới được quyền xoá đơn hàng" },
      { status: 401 }
    );
  }

  try {
    const { id } = await params;
    const cleanId = id.trim().slice(0, 50);

    const success = await deleteOrder(cleanId);
    if (!success) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }
    return NextResponse.json({ success: true, orderId: cleanId });
  } catch (error) {
    console.error("Delete order error:", error);
    return NextResponse.json({ error: "Failed to delete order" }, { status: 500 });
  }
}
