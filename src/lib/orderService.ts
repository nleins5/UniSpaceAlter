/**
 * Order Service — Firebase Firestore + Storage (with filesystem fallback)
 *
 * If NEXT_PUBLIC_FIREBASE_PROJECT_ID is set → uses Firestore + Storage
 * Otherwise → falls back to local filesystem (dev/MVP mode)
 */

import { isFirebaseConfigured, db, storage } from "./firebase";
import {
  collection, doc, getDoc, getDocs, setDoc, updateDoc,
  query, orderBy, serverTimestamp, Timestamp,
} from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { readFile, readdir, writeFile, mkdir, stat } from "fs/promises";
import path from "path";

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
  // Filesystem fallback
  return getOrdersFromFilesystem();
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
  return getOrderFromFilesystem(id);
}

// ── CREATE order ─────────────────────────────────────────────
export async function createOrder(
  orderData: Omit<Order, "orderId" | "createdAt" | "updatedAt">,
  frontBlob?: Buffer,
  backBlob?: Buffer,
): Promise<{ orderId: string }> {
  const orderId = `ORD-${Date.now()}`;

  if (isFirebaseConfigured && db && storage) {
    // Upload images to Firebase Storage
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

  // Filesystem fallback
  return saveOrderToFilesystem(orderId, orderData, frontBlob, backBlob);
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
  // Filesystem fallback
  const orderPath = path.join(process.cwd(), "orders", id, "order.json");
  const orderInfo = JSON.parse(await readFile(orderPath, "utf-8"));
  orderInfo.status = status;
  orderInfo.updatedAt = new Date().toISOString();
  await writeFile(orderPath, JSON.stringify(orderInfo, null, 2));
}

// ── FILESYSTEM helpers ───────────────────────────────────────
async function getOrdersFromFilesystem(): Promise<Order[]> {
  try {
    const ordersDir = path.join(process.cwd(), "orders");
    await stat(ordersDir);
    const dirs = await readdir(ordersDir);
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
    const orderDir = path.join(process.cwd(), "orders", id);
    const orderInfo = JSON.parse(
      await readFile(path.join(orderDir, "order.json"), "utf-8")
    );
    const files = await readdir(orderDir);
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
  const orderDir = path.join(process.cwd(), "orders", orderId);
  await mkdir(orderDir, { recursive: true });
  const orderJson: Order = {
    ...orderData,
    orderId,
    status: "pending",
    hasFrontDesign: Boolean(frontBlob),
    hasBackDesign: Boolean(backBlob),
    createdAt: new Date().toISOString(),
  };
  await writeFile(path.join(orderDir, "order.json"), JSON.stringify(orderJson, null, 2));
  if (frontBlob) await writeFile(path.join(orderDir, "front_design.png"), frontBlob);
  if (backBlob) await writeFile(path.join(orderDir, "back_design.png"), backBlob);
  return { orderId };
}
