/**
 * Collection Service — Supabase (with in-memory fallback)
 * 
 * Manages design collections published to the homepage storefront.
 */

import { isSupabaseConfigured, supabase } from "./supabase";

export interface DesignItem {
  id: string;
  name: string;
  collectionId: string;
  previewUrl: string;      // public URL or base64 data URL
  garmentType: string;
  color: string;
  price?: string;
  published: boolean;
  createdAt: string;
}

export interface Collection {
  id: string;
  name: string;
  description?: string;
  status: "LIVE" | "DRAFT" | "SCHEDULED";
  designs: DesignItem[];
  createdAt: string;
  updatedAt?: string;
}

// ── In-memory fallback ────────────────────────────────────────
const memCollections = new Map<string, Collection>();
const memDesigns = new Map<string, DesignItem>();

// Seed demo data
function seedDemo() {
  if (memCollections.size > 0) return;
  const demos: Collection[] = [
    {
      id: "COL_001", name: "VARSITY 2026",
      description: "Bộ sưu tập áo lớp mùa tốt nghiệp 2026",
      status: "LIVE", designs: [], createdAt: "2026-04-01",
    },
    {
      id: "COL_002", name: "STREETWEAR DROP",
      description: "Phong cách đường phố hiện đại",
      status: "DRAFT", designs: [], createdAt: "2026-04-15",
    },
  ];
  for (const c of demos) memCollections.set(c.id, c);
}
seedDemo();

// ── READ all collections ──────────────────────────────────────
export async function getAllCollections(): Promise<Collection[]> {
  if (isSupabaseConfigured && supabase) {
    const { data: cols, error } = await supabase
      .from("collections")
      .select("*, designs(*)")
      .order("created_at", { ascending: false });
    if (error) {
      console.warn("Supabase getAllCollections (falling back to memory):", error.message);
      // Fall through to in-memory
    } else {
      return (cols || []).map(rowToCollection);
    }
  }
  // In-memory: attach designs
  const result: Collection[] = [];
  for (const col of memCollections.values()) {
    const designs = Array.from(memDesigns.values()).filter(d => d.collectionId === col.id);
    result.push({ ...col, designs });
  }
  return result.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

// ── READ live collections (homepage) ─────────────────────────
export async function getLiveCollections(): Promise<Collection[]> {
  const all = await getAllCollections();
  return all
    .filter(c => c.status === "LIVE")
    .map(c => ({ ...c, designs: c.designs.filter(d => d.published) }))
    .filter(c => c.designs.length > 0);
}

// ── CREATE collection ─────────────────────────────────────────
export async function createCollection(
  name: string,
  description?: string,
  status: Collection["status"] = "DRAFT",
): Promise<Collection> {
  const id = `COL_${Date.now().toString(36).toUpperCase()}`;
  const now = new Date().toISOString();

  if (isSupabaseConfigured && supabase) {
    const { data, error } = await supabase.from("collections").insert({
      id, name, description: description || null, status, created_at: now,
    }).select().single();
    if (error) {
      console.warn("Supabase createCollection (falling back to memory):", error.message);
      // Fall through to in-memory
    } else {
      return rowToCollection(data);
    }
  }
  const col: Collection = { id, name, description, status, designs: [], createdAt: now };
  memCollections.set(id, col);
  return col;
}

// ── UPDATE collection status ──────────────────────────────────
export async function updateCollectionStatus(
  id: string, status: Collection["status"]
): Promise<void> {
  if (isSupabaseConfigured && supabase) {
    const { error } = await supabase.from("collections")
      .update({ status, updated_at: new Date().toISOString() })
      .eq("id", id);
    if (error) console.warn("Supabase updateCollectionStatus (falling back to memory):", error.message);
    // Always also update in-memory for consistency
  }
  const col = memCollections.get(id);
  if (col) { col.status = status; col.updatedAt = new Date().toISOString(); }
}

// ── ADD design to collection ──────────────────────────────────
export async function addDesignToCollection(
  collectionId: string,
  design: Omit<DesignItem, "id" | "collectionId" | "createdAt">,
): Promise<DesignItem> {
  const id = `DSG_${Date.now().toString(36).toUpperCase()}`;
  const now = new Date().toISOString();
  const item: DesignItem = { ...design, id, collectionId, createdAt: now };

  if (isSupabaseConfigured && supabase) {
    const { data, error } = await supabase.from("designs").insert({
      id,
      collection_id: collectionId,
      name: design.name,
      preview_url: design.previewUrl,
      garment_type: design.garmentType,
      color: design.color,
      price: design.price || null,
      published: design.published,
      created_at: now,
    }).select().single();
    if (error) {
      console.warn("Supabase addDesignToCollection (falling back to memory):", error.message);
      // Fall through to in-memory
    } else {
      memDesigns.set(id, item); // Also keep in memory
      return rowToDesign(data);
    }
  }
  memDesigns.set(id, item);
  return item;
}

// ── UPDATE design published status ────────────────────────────
export async function updateDesignPublished(id: string, published: boolean): Promise<void> {
  if (isSupabaseConfigured && supabase) {
    const { error } = await supabase.from("designs").update({ published }).eq("id", id);
    if (error) console.warn("Supabase updateDesignPublished (falling back to memory):", error.message);
  }
  const d = memDesigns.get(id);
  if (d) d.published = published;
}

// ── DELETE design ─────────────────────────────────────────────
export async function deleteDesign(id: string): Promise<void> {
  if (isSupabaseConfigured && supabase) {
    await supabase.from("designs").delete().eq("id", id);
    return;
  }
  memDesigns.delete(id);
}

// ── Supabase row mappers ──────────────────────────────────────
function rowToCollection(row: Record<string, unknown>): Collection {
  const designs = ((row.designs as Record<string, unknown>[]) || []).map(rowToDesign);
  return {
    id: row.id as string,
    name: row.name as string,
    description: (row.description as string) || undefined,
    status: (row.status as Collection["status"]) || "DRAFT",
    designs,
    createdAt: row.created_at as string,
    updatedAt: (row.updated_at as string) || undefined,
  };
}

function rowToDesign(row: Record<string, unknown>): DesignItem {
  return {
    id: row.id as string,
    name: row.name as string,
    collectionId: (row.collection_id as string) || (row.collectionId as string),
    previewUrl: (row.preview_url as string) || (row.previewUrl as string),
    garmentType: (row.garment_type as string) || (row.garmentType as string) || "RAGLAN",
    color: row.color as string,
    price: (row.price as string) || undefined,
    published: Boolean(row.published),
    createdAt: (row.created_at as string) || (row.createdAt as string),
  };
}
