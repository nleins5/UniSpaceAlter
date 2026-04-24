import { NextResponse } from "next/server";
import { CREDIT_PACKAGES, PAYMENT_INFO } from "../../../../../config/creditPackages";

/**
 * GET /api/admin/credits/packages
 * Returns the current credit packages set by the owner.
 * No auth required — pricing is public info.
 */
export async function GET() {
  return NextResponse.json({
    packages: CREDIT_PACKAGES,
    payment: PAYMENT_INFO,
  });
}
