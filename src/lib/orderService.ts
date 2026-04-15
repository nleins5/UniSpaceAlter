/**
 * Order Service — Supabase (with in-memory fallback)
 *
 * If NEXT_PUBLIC_SUPABASE_URL is set → uses Supabase DB + Storage
 * Otherwise → falls back to in-memory store (demo mode)
 *
 * Supabase table: orders
 * Supabase storage bucket: designs
 */

import { isSupabaseConfigured, supabase } from "./supabase";

export interface Order {
  orderId: string;
  customerName: string;
  phone: string;
  email?: string;
  address: string;
  size: string;
  color: string;
  quantity: number;
  notes?: string;
  status: string;
  createdAt: string;
  updatedAt?: string;
  frontDesignUrl?: string;
  backDesignUrl?: string;
  hasFrontDesign?: boolean;
  hasBackDesign?: boolean;
}

// ── In-memory store (fallback for Vercel/demo) ───────────────
const memoryOrders = new Map<string, Order>();
const memoryFiles = new Map<string, Buffer>();

// Seed demo data
function seedDemoOrders() {
  if (memoryOrders.size > 0) return;
  const demos: Order[] = [
    { orderId: "ORD-2026041501", customerName: "Nguyễn Văn An", phone: "0901234567", address: "59A Lê Đình Thám, Q.Tân Phú, TP.HCM", size: "L", color: "#ffffff", quantity: 5, status: "pending", createdAt: new Date(Date.now() - 3600000).toISOString(), notes: "Áo lớp 12A1, in logo mặt trước" },
    { orderId: "ORD-2026041502", customerName: "Trần Thị Bình", phone: "0912345678", address: "123 Nguyễn Huệ, Q.1, TP.HCM", size: "M", color: "#1a1a2e", quantity: 10, status: "confirmed", createdAt: new Date(Date.now() - 7200000).toISOString(), notes: "Áo team building công ty" },
    { orderId: "ORD-2026041503", customerName: "Lê Hoàng Cường", phone: "0923456789", address: "45 Trần Hưng Đạo, Q.5, TP.HCM", size: "XL", color: "#6c5ce7", quantity: 3, status: "manufacturing", createdAt: new Date(Date.now() - 14400000).toISOString(), notes: "Áo CLB bóng đá" },
    { orderId: "ORD-2026041504", customerName: "Phạm Ngọc Dung", phone: "0934567890", address: "78 Võ Văn Tần, Q.3, TP.HCM", size: "S", color: "#e84393", quantity: 2, status: "completed", createdAt: new Date(Date.now() - 86400000).toISOString(), notes: "Áo couple" },
    { orderId: "ORD-2026041505", customerName: "Hoàng Minh Đức", phone: "0945678901", address: "12 Phạm Ngọc Thạch, Q.3, TP.HCM", size: "L", color: "#00b894", quantity: 15, status: "pending", createdAt: new Date(Date.now() - 1800000).toISOString(), notes: "Áo đồng phục nhân viên" },
    { orderId: "ORD-2026041506", customerName: "Võ Thị Hạnh", phone: "0956789012", address: "200 Lý Tự Trọng, Q.1, TP.HCM", size: "M", color: "#fdcb6e", quantity: 8, status: "confirmed", createdAt: new Date(Date.now() - 10800000).toISOString(), notes: "Áo lưu niệm du lịch Đà Lạt" },
  ];
  for (const d of demos) memoryOrders.set(d.orderId, d);
}
seedDemoOrders();

// ── Helper: map Supabase row → Order ─────────────────────────
function rowToOrder(row: Record<string, unknown>): Order {
  return {
    orderId: row.order_id as string,
    customerName: row.customer_name as string,
    phone: row.phone as string,
    email: (row.email as string) || undefined,
    address: row.address as string,
    size: row.size as string,
    color: row.color as string,
    quantity: row.quantity as number,
    notes: (row.notes as string) || undefined,
    status: row.status as string,
    createdAt: row.created_at as string,
    updatedAt: (row.updated_at as string) || undefined,
    frontDesignUrl: (row.front_design_url as string) || undefined,
    backDesignUrl: (row.back_design_url as string) || undefined,
    hasFrontDesign: Boolean(row.has_front_design),
    hasBackDesign: Boolean(row.has_back_design),
  };
}

// ── READ all orders ──────────────────────────────────────────
export async function getAllOrders(): Promise<Order[]> {
  if (isSupabaseConfigured && supabase) {
    const { data, error } = await supabase
      .from("orders")
      .select("*")
      .order("created_at", { ascending: false });
    if (error) { console.error("Supabase getAllOrders:", error.message); return []; }
    return (data || []).map(rowToOrder);
  }
  // In-memory fallback
  return Array.from(memoryOrders.values()).sort((a, b) =>
    new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );
}

// ── READ single order ────────────────────────────────────────
export async function getOrder(id: string): Promise<Order | null> {
  if (isSupabaseConfigured && supabase) {
    const { data, error } = await supabase
      .from("orders")
      .select("*")
      .eq("order_id", id)
      .single();
    if (error || !data) return null;
    return rowToOrder(data);
  }
  return memoryOrders.get(id) || null;
}

// ── GET design file ──────────────────────────────────────────
export async function getDesignFile(orderId: string, file: string): Promise<Buffer | null> {
  if (isSupabaseConfigured && supabase) {
    const { data, error } = await supabase.storage
      .from("designs")
      .download(`${orderId}/${file}`);
    if (error || !data) return null;
    const arrayBuf = await data.arrayBuffer();
    return Buffer.from(arrayBuf);
  }
  return memoryFiles.get(`${orderId}/${file}`) || null;
}

// ── CREATE order ─────────────────────────────────────────────
export async function createOrder(
  orderData: Omit<Order, "orderId" | "createdAt" | "updatedAt">,
  frontBlob?: Buffer,
  backBlob?: Buffer,
): Promise<{ orderId: string }> {
  const orderId = `ORD-${Date.now()}`;

  if (isSupabaseConfigured && supabase) {
    // Upload design files
    let frontDesignUrl: string | undefined;
    let backDesignUrl: string | undefined;

    if (frontBlob) {
      const { error } = await supabase.storage
        .from("designs")
        .upload(`${orderId}/front_design.png`, frontBlob, { contentType: "image/png" });
      if (!error) {
        const { data: urlData } = supabase.storage.from("designs").getPublicUrl(`${orderId}/front_design.png`);
        frontDesignUrl = urlData.publicUrl;
      }
    }
    if (backBlob) {
      const { error } = await supabase.storage
        .from("designs")
        .upload(`${orderId}/back_design.png`, backBlob, { contentType: "image/png" });
      if (!error) {
        const { data: urlData } = supabase.storage.from("designs").getPublicUrl(`${orderId}/back_design.png`);
        backDesignUrl = urlData.publicUrl;
      }
    }

    const { error } = await supabase.from("orders").insert({
      order_id: orderId,
      customer_name: orderData.customerName,
      phone: orderData.phone,
      email: orderData.email || null,
      address: orderData.address,
      size: orderData.size,
      color: orderData.color,
      quantity: orderData.quantity,
      notes: orderData.notes || null,
      status: "pending",
      front_design_url: frontDesignUrl || null,
      back_design_url: backDesignUrl || null,
      has_front_design: Boolean(frontBlob),
      has_back_design: Boolean(backBlob),
    });
    if (error) console.error("Supabase createOrder:", error.message);
    return { orderId };
  }

  // In-memory fallback
  const order: Order = {
    ...orderData,
    orderId,
    status: "pending",
    hasFrontDesign: Boolean(frontBlob),
    hasBackDesign: Boolean(backBlob),
    createdAt: new Date().toISOString(),
  };
  memoryOrders.set(orderId, order);
  if (frontBlob) memoryFiles.set(`${orderId}/front_design.png`, frontBlob);
  if (backBlob) memoryFiles.set(`${orderId}/back_design.png`, backBlob);
  console.log(`📦 Order ${orderId} saved to memory (${memoryOrders.size} total)`);
  return { orderId };
}

// ── UPDATE status ────────────────────────────────────────────
export async function updateOrderStatus(id: string, status: string): Promise<void> {
  if (isSupabaseConfigured && supabase) {
    const { error } = await supabase
      .from("orders")
      .update({ status, updated_at: new Date().toISOString() })
      .eq("order_id", id);
    if (error) console.error("Supabase updateStatus:", error.message);
    return;
  }
  // In-memory fallback
  const order = memoryOrders.get(id);
  if (order) {
    order.status = status;
    order.updatedAt = new Date().toISOString();
  }
}
