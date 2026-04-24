import { NextResponse } from "next/server";
import { getLiveCollections } from "../../../lib/collectionService";

/** GET /api/collections — public endpoint for homepage */
export async function GET() {
  try {
    const collections = await getLiveCollections();
    return NextResponse.json({ collections });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ collections: [] });
  }
}
