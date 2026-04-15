/**
 * Order Service — Firebase Firestore + Storage (with in-memory fallback)
 *
 * If NEXT_PUBLIC_FIREBASE_PROJECT_ID is set → uses Firestore + Storage
 * Otherwise → falls back to in-memory store (demo/MVP mode)
 * 
 * Note: In-memory store resets when serverless function cold-starts.
 * For production, configure Firebase.
 */

import { isFirebaseConfigured, db, storage } from "./firebase";
import {
  collection, doc, getDoc, getDocs, setDoc, updateDoc,
  query, orderBy, serverTimestamp, Timestamp,
} from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";

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

// ── In-memory store (fallback for Vercel serverless) ──────────
const memoryOrders = new Map<string, Order>();
const memoryFiles = new Map<string, Buffer>();

// Try filesystem first, then memory
async function useFilesystem(): Promise<boolean> {
  try {
    const fs = await import("fs/promises");
    const p = await import("path");
    const ordersDir = p.default.join(process.cwd(), "orders");
    await fs.stat(ordersDir).catch(() => fs.mkdir(ordersDir, { recursive: true }));
    // Test write
    const testFile = p.default.join(ordersDir, ".test");
    await fs.writeFile(testFile, "ok");
    await fs.unlink(testFile);
    return true;
  } catch {
    return false;
  }
}

// ── READ all orders ──────────────────────────────────────────
export async function getAllOrders(): Promise<Order[]> {
  if (isFirebaseConfigured && db) {
    const q = query(collection(db, "orders"), orderBy("createdAt", "desc"));
    const snap = await getDocs(q);
    return snap.docs.map((d) => {
      const data = d.data();
      const createdAt = data.createdAt instanceof Timestamp
        ? data.createdAt.toDate().toISOString()
        : data.createdAt;
      return { ...data, orderId: d.id, createdAt } as Order;
    });
  }

  // Try filesystem
  if (await useFilesystem()) {
    return getOrdersFromFilesystem();
  }

  // In-memory fallback
  const orders = Array.from(memoryOrders.values());
  return orders.sort((a, b) =>
    new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );
}

// ── READ single order ────────────────────────────────────────
export async function getOrder(id: string): Promise<Order | null> {
  if (isFirebaseConfigured && db) {
    const snap = await getDoc(doc(db, "orders", id));
    if (!snap.exists()) return null;
    const data = snap.data();
    const createdAt = data.createdAt instanceof Timestamp
      ? data.createdAt.toDate().toISOString()
      : data.createdAt;
    return { ...data, orderId: snap.id, createdAt } as Order;
  }

  if (await useFilesystem()) {
    return getOrderFromFilesystem(id);
  }

  return memoryOrders.get(id) || null;
}

// ── GET design file ──────────────────────────────────────────
export async function getDesignFile(orderId: string, file: string): Promise<Buffer | null> {
  if (await useFilesystem()) {
    try {
      const fs = await import("fs/promises");
      const p = await import("path");
      return await fs.readFile(p.default.join(process.cwd(), "orders", orderId, file)) as Buffer;
    } catch { return null; }
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

  if (isFirebaseConfigured && db && storage) {
    let frontDesignUrl: string | undefined;
    let backDesignUrl: string | undefined;

    if (frontBlob) {
      const frontRef = ref(storage, `orders/${orderId}/front_design.png`);
      await uploadBytes(frontRef, frontBlob, { contentType: "image/png" });
      frontDesignUrl = await getDownloadURL(frontRef);
    }
    if (backBlob) {
      const backRef = ref(storage, `orders/${orderId}/back_design.png`);
      await uploadBytes(backRef, backBlob, { contentType: "image/png" });
      backDesignUrl = await getDownloadURL(backRef);
    }

    await setDoc(doc(db, "orders", orderId), {
      ...orderData,
      orderId,
      status: "pending",
      frontDesignUrl: frontDesignUrl || null,
      backDesignUrl: backDesignUrl || null,
      hasFrontDesign: Boolean(frontBlob),
      hasBackDesign: Boolean(backBlob),
      createdAt: serverTimestamp(),
    });

    return { orderId };
  }

  // Try filesystem first
  if (await useFilesystem()) {
    return saveOrderToFilesystem(orderId, orderData, frontBlob, backBlob);
  }

  // In-memory fallback (Vercel serverless)
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
  if (isFirebaseConfigured && db) {
    await updateDoc(doc(db, "orders", id), {
      status,
      updatedAt: serverTimestamp(),
    });
    return;
  }

  if (await useFilesystem()) {
    const fs = await import("fs/promises");
    const p = await import("path");
    const orderPath = p.default.join(process.cwd(), "orders", id, "order.json");
    const orderInfo = JSON.parse(await fs.readFile(orderPath, "utf-8"));
    orderInfo.status = status;
    orderInfo.updatedAt = new Date().toISOString();
    await fs.writeFile(orderPath, JSON.stringify(orderInfo, null, 2));
    return;
  }

  // In-memory fallback
  const order = memoryOrders.get(id);
  if (order) {
    order.status = status;
    order.updatedAt = new Date().toISOString();
  }
}

// ── FILESYSTEM helpers ───────────────────────────────────────
async function getOrdersFromFilesystem(): Promise<Order[]> {
  try {
    const fs = await import("fs/promises");
    const p = await import("path");
    const ordersDir = p.default.join(process.cwd(), "orders");
    await fs.stat(ordersDir);
    const dirs = await fs.readdir(ordersDir);
    const orders: Order[] = [];
    for (const dir of dirs) {
      try {
        const o = await getOrderFromFilesystem(dir);
        if (o) orders.push(o);
      } catch { /* skip corrupt */ }
    }
    return orders.sort((a, b) =>
      new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
  } catch { return []; }
}

async function getOrderFromFilesystem(id: string): Promise<Order | null> {
  try {
    const fs = await import("fs/promises");
    const p = await import("path");
    const orderDir = p.default.join(process.cwd(), "orders", id);
    const orderInfo = JSON.parse(
      await fs.readFile(p.default.join(orderDir, "order.json"), "utf-8")
    );
    const files = await fs.readdir(orderDir);
    return {
      ...orderInfo,
      hasFrontDesign: files.includes("front_design.png"),
      hasBackDesign: files.includes("back_design.png"),
    };
  } catch { return null; }
}

async function saveOrderToFilesystem(
  orderId: string,
  orderData: Omit<Order, "orderId" | "createdAt" | "updatedAt">,
  frontBlob?: Buffer,
  backBlob?: Buffer,
): Promise<{ orderId: string }> {
  const fs = await import("fs/promises");
  const p = await import("path");
  const orderDir = p.default.join(process.cwd(), "orders", orderId);
  await fs.mkdir(orderDir, { recursive: true });
  const orderJson: Order = {
    ...orderData,
    orderId,
    status: "pending",
    hasFrontDesign: Boolean(frontBlob),
    hasBackDesign: Boolean(backBlob),
    createdAt: new Date().toISOString(),
  };
  await fs.writeFile(p.default.join(orderDir, "order.json"), JSON.stringify(orderJson, null, 2));
  if (frontBlob) await fs.writeFile(p.default.join(orderDir, "front_design.png"), frontBlob);
  if (backBlob) await fs.writeFile(p.default.join(orderDir, "back_design.png"), backBlob);
  return { orderId };
}
