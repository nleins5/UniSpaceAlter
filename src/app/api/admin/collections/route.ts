import { NextRequest, NextResponse } from "next/server";
import {
  getAllCollections,
  createCollection,
  updateCollectionStatus,
  addDesignToCollection,
  updateDesignPublished,
  deleteDesign,
} from "../../../../lib/collectionService";

/** GET /api/admin/collections — list all */
export async function GET() {
  try {
    const collections = await getAllCollections();
    return NextResponse.json({ collections });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ collections: [], error: "Failed to fetch" }, { status: 500 });
  }
}

/** POST /api/admin/collections — create collection OR add design */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    // Add design to collection
    if (body.action === "add_design") {
      const { collectionId, name, previewUrl, garmentType, color, price, published } = body;
      if (!collectionId || !name || !previewUrl) {
        return NextResponse.json({ error: "Missing required fields: collectionId, name, previewUrl" }, { status: 400 });
      }
      const design = await addDesignToCollection(collectionId, {
        name, previewUrl, garmentType: garmentType || "RAGLAN",
        color: color || "#ffffff", price, published: published ?? false,
      });
      return NextResponse.json({ design });
    }

    // Create new collection
    const { name, description, status } = body;
    if (!name) return NextResponse.json({ error: "Name is required" }, { status: 400 });
    const collection = await createCollection(name, description, status || "DRAFT");
    return NextResponse.json({ collection });
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    console.error("[POST /api/admin/collections]", msg);
    return NextResponse.json({ error: msg || "Failed to process" }, { status: 500 });
  }
}


/** PATCH /api/admin/collections — update status or design published */
export async function PATCH(req: NextRequest) {
  try {
    const body = await req.json();

    if (body.action === "toggle_design") {
      await updateDesignPublished(body.designId, body.published);
      return NextResponse.json({ success: true });
    }

    // Update collection status
    await updateCollectionStatus(body.collectionId, body.status);
    return NextResponse.json({ success: true });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Failed to update" }, { status: 500 });
  }
}

/** DELETE /api/admin/collections?designId=xxx */
export async function DELETE(req: NextRequest) {
  try {
    const designId = req.nextUrl.searchParams.get("designId");
    if (!designId) return NextResponse.json({ error: "designId required" }, { status: 400 });
    await deleteDesign(designId);
    return NextResponse.json({ success: true });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Failed to delete" }, { status: 500 });
  }
}
