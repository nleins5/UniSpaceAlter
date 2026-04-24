/**
 * Credit Package Configuration
 * ─────────────────────────────────────────────────────────
 * Owner edits this file to set credit prices and payment info.
 * Changes take effect on next deployment.
 *
 * Alternatively, set CREDIT_PACKAGES_JSON env var to override at runtime.
 */

export interface CreditPackage {
  id: string;
  name: string;
  credits: number;
  priceVND: number;     // Price in Vietnamese Dong
  priceUSD: string;     // Display price in USD (optional label)
  perCreditVND: number; // Calculated: priceVND / credits
  popular: boolean;
  badge?: string;       // Optional badge label e.g. "BEST VALUE"
}

export interface PaymentInfo {
  bankName: string;
  accountNumber: string;
  accountName: string;
  transferNoteTemplate: string; // Use {package} and {date} as placeholders
  contactZalo?: string;
  contactEmail?: string;
  note?: string;
}

// ── Owner sets these prices ──────────────────────────────
export const CREDIT_PACKAGES: CreditPackage[] = [
  {
    id: "starter",
    name: "STARTER",
    credits: 50,
    priceVND: 149_000,
    priceUSD: "$5.99",
    perCreditVND: 2_980,
    popular: false,
  },
  {
    id: "pro",
    name: "PRO",
    credits: 200,
    priceVND: 449_000,
    priceUSD: "$17.99",
    perCreditVND: 2_245,
    popular: true,
    badge: "POPULAR",
  },
  {
    id: "enterprise",
    name: "ENTERPRISE",
    credits: 1000,
    priceVND: 1_490_000,
    priceUSD: "$59.99",
    perCreditVND: 1_490,
    popular: false,
    badge: "BEST VALUE",
  },
];

// ── Owner sets payment details ───────────────────────────
export const PAYMENT_INFO: PaymentInfo = {
  bankName: "Vietcombank",
  accountNumber: "1234567890",
  accountName: "UNISPACE",
  transferNoteTemplate: "CREDITS {package} {date}",
  contactZalo: "0901234567",
  contactEmail: "admin@unispace.vn",
  note: "Gói credits sẽ được kích hoạt trong vòng 15 phút sau khi chuyển khoản.",
};
