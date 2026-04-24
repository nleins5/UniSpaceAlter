"use client";
import { useState, useEffect, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";

interface CreditPackage {
  id: string;
  name: string;
  credits: number;
  priceVND: number;
  priceUSD: string;
  perCreditVND: number;
  popular: boolean;
  badge?: string;
}

interface PaymentInfo {
  bankName: string;
  accountNumber: string;
  accountName: string;
  transferNoteTemplate: string;
  contactZalo?: string;
  contactEmail?: string;
  note?: string;
}

function formatVND(n: number) {
  return n.toLocaleString("vi-VN") + " ₫";
}

// ── Step 1: Transfer info ──────────────────────────────────
function TransferStep({
  pkg,
  payment,
  transferNote,
  onConfirm,
}: {
  pkg: CreditPackage;
  payment: PaymentInfo;
  transferNote: string;
  onConfirm: () => void;
}) {
  const [copied, setCopied] = useState<string | null>(null);
  const [checked, setChecked] = useState(false);

  function copy(text: string, key: string) {
    navigator.clipboard.writeText(text).then(() => {
      setCopied(key);
      setTimeout(() => setCopied(null), 2000);
    });
  }

  const fields = [
    { label: "Ngân hàng",      value: payment.bankName,      key: "bank" },
    { label: "Số tài khoản",   value: payment.accountNumber, key: "acc" },
    { label: "Chủ tài khoản",  value: payment.accountName,   key: "name" },
    { label: "Nội dung CK",    value: transferNote,          key: "note", accent: true },
  ];

  return (
    <div className="space-y-6">
      {/* Package summary */}
      <div className="p-5 bg-[#7C3AED]/10 border border-[#7C3AED]/30 rounded-2xl flex items-center justify-between">
        <div>
          <div className="adm-mono text-[10px] text-[#7C3AED] uppercase tracking-widest mb-1">Gói đã chọn</div>
          <div className="text-2xl font-black uppercase tracking-wide">{pkg.name}</div>
          <div className="adm-mono text-sm text-gray-400 mt-0.5">{pkg.credits} credits</div>
        </div>
        <div className="text-right">
          <div className="adm-mono text-3xl font-bold text-[#7C3AED]">{formatVND(pkg.priceVND)}</div>
          <div className="adm-mono text-xs text-gray-500 mt-0.5">{pkg.priceUSD}</div>
        </div>
      </div>

      {/* Bank transfer info */}
      <div>
        <div className="adm-mono text-[10px] text-gray-500 uppercase tracking-widest mb-3">
          Thông tin chuyển khoản
        </div>
        <div className="space-y-2">
          {fields.map(({ label, value, key, accent }) => (
            <div key={key}
              className="flex items-center justify-between p-4 bg-white/5 border border-white/10 rounded-xl hover:border-white/20 transition-colors">
              <div className="min-w-0 flex-1">
                <div className="adm-mono text-[10px] text-gray-500 uppercase tracking-wider mb-1">{label}</div>
                <div className={`font-mono text-base font-bold truncate ${accent ? "text-[#7C3AED]" : "text-white"}`}>
                  {value}
                </div>
              </div>
              <button
                type="button"
                onClick={() => copy(value, key)}
                aria-label={`Copy ${label}`}
                className="ml-4 shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold adm-mono uppercase transition-all border border-white/10 hover:border-white/20 text-gray-400 hover:text-white"
              >
                {copied === key ? (
                  <>
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#7C3AED" strokeWidth="2.5"><path d="M20 6L9 17l-5-5"/></svg>
                    <span className="text-[#7C3AED]">Copied</span>
                  </>
                ) : (
                  <>
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>
                    Copy
                  </>
                )}
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Note */}
      {payment.note && (
        <div className="flex gap-3 p-4 bg-amber-500/10 border border-amber-500/30 rounded-xl">
          <svg className="shrink-0 mt-0.5" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#f59e0b" strokeWidth="2">
            <path d="M12 9v4m0 4h.01M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
          </svg>
          <p className="adm-mono text-xs text-amber-400 leading-relaxed">{payment.note}</p>
        </div>
      )}

      {/* Confirmation checkbox */}
      <label className="flex items-start gap-3 cursor-pointer group select-none">
        <div className="relative mt-0.5">
          <input
            type="checkbox"
            className="sr-only"
            checked={checked}
            onChange={e => setChecked(e.target.checked)}
          />
          <div className={`w-5 h-5 border-2 rounded flex items-center justify-center transition-all ${
            checked ? "bg-[#7C3AED] border-[#7C3AED]" : "border-white/20 group-hover:border-white/40"
          }`}>
            {checked && <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3"><path d="M20 6L9 17l-5-5"/></svg>}
          </div>
        </div>
        <span className="adm-mono text-sm text-gray-400 leading-relaxed">
          Tôi đã chuyển khoản đúng <strong className="text-white">{formatVND(pkg.priceVND)}</strong> với nội dung{" "}
          <strong className="text-[#7C3AED]">{transferNote}</strong>
        </span>
      </label>

      {/* CTA */}
      <button
        type="button"
        onClick={onConfirm}
        disabled={!checked}
        className="w-full adm-mono py-4 text-sm font-black uppercase tracking-widest rounded-xl transition-all duration-300 flex items-center justify-center gap-3 disabled:opacity-30 disabled:cursor-not-allowed bg-[#7C3AED] text-white hover:bg-[#7C3AED]/80 disabled:hover:bg-[#7C3AED] shadow-[0_0_30px_rgba(124,58,237,0.3)] hover:shadow-[0_0_40px_rgba(124,58,237,0.5)]"
      >
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
          <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/>
          <path d="M22 4L12 14.01l-3-3"/>
        </svg>
        Tôi đã chuyển khoản xong
      </button>

      {/* Contact shortcuts */}
      <div className="flex gap-3">
        {payment.contactZalo && (
          <a href={`https://zalo.me/${payment.contactZalo}`} target="_blank" rel="noopener noreferrer"
            className="flex-1 adm-mono flex items-center justify-center gap-2 py-3 border border-[#06C755]/30 text-[#06C755] rounded-xl text-xs font-bold uppercase hover:bg-[#06C755]/10 transition-colors">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><circle cx="12" cy="12" r="12"/></svg>
            Liên hệ Zalo
          </a>
        )}
        {payment.contactEmail && (
          <a href={`mailto:${payment.contactEmail}?subject=Mua Credits&body=Tôi đã chuyển khoản gói credits.`}
            className="flex-1 adm-mono flex items-center justify-center gap-2 py-3 border border-white/10 text-gray-400 rounded-xl text-xs font-bold uppercase hover:bg-white/5 hover:text-white transition-colors">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="2" y="4" width="20" height="16" rx="2"/><path d="M22 7l-10 7L2 7"/></svg>
            Email
          </a>
        )}
      </div>
    </div>
  );
}

// ── Step 2: Confirmation screen ────────────────────────────
function ConfirmStep({ pkg, transferNote }: { pkg: CreditPackage; transferNote: string }) {
  const router = useRouter();
  const [dots, setDots] = useState(".");

  useEffect(() => {
    const iv = setInterval(() => setDots(d => d.length >= 3 ? "." : d + "."), 600);
    return () => clearInterval(iv);
  }, []);

  return (
    <div className="flex flex-col items-center text-center py-8 space-y-6">
      {/* Animated checkmark */}
      <div className="relative">
        <div className="w-24 h-24 rounded-full bg-[#7C3AED]/20 border-2 border-[#7C3AED]/50 flex items-center justify-center animate-pulse">
          <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#7C3AED" strokeWidth="2">
            <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><path d="M22 4L12 14.01l-3-3"/>
          </svg>
        </div>
        <div className="absolute inset-0 rounded-full bg-[#7C3AED]/10 animate-ping" />
      </div>

      <div>
        <div className="adm-mono text-[10px] text-[#7C3AED] uppercase tracking-widest mb-2">
          Đang xác nhận giao dịch{dots}
        </div>
        <h2 className="text-2xl font-black uppercase tracking-wide mb-1">
          Yêu cầu đã ghi nhận!
        </h2>
        <p className="adm-mono text-sm text-gray-400 max-w-sm">
          Chúng tôi đã nhận được thông báo của bạn. Credits sẽ được cộng vào tài khoản trong vòng <strong className="text-white">15 phút</strong>.
        </p>
      </div>

      {/* Summary */}
      <div className="w-full max-w-sm space-y-2">
        <div className="flex justify-between p-3 bg-white/5 border border-white/10 rounded-xl">
          <span className="adm-mono text-xs text-gray-500 uppercase">Gói</span>
          <span className="adm-mono text-sm font-bold text-white">{pkg.name} — {pkg.credits} credits</span>
        </div>
        <div className="flex justify-between p-3 bg-white/5 border border-white/10 rounded-xl">
          <span className="adm-mono text-xs text-gray-500 uppercase">Số tiền</span>
          <span className="adm-mono text-sm font-bold text-[#7C3AED]">{formatVND(pkg.priceVND)}</span>
        </div>
        <div className="flex justify-between p-3 bg-white/5 border border-white/10 rounded-xl">
          <span className="adm-mono text-xs text-gray-500 uppercase">Mã giao dịch</span>
          <span className="adm-mono text-sm font-bold text-gray-300">{transferNote}</span>
        </div>
        <div className="flex justify-between p-3 bg-white/5 border border-white/10 rounded-xl">
          <span className="adm-mono text-xs text-gray-500 uppercase">Trạng thái</span>
          <span className="adm-mono text-sm font-bold flex items-center gap-2">
            <span className="w-2 h-2 bg-amber-400 rounded-full animate-pulse" />
            <span className="text-amber-400">Đang xử lý</span>
          </span>
        </div>
      </div>

      {/* Info box */}
      <div className="w-full max-w-sm flex gap-3 p-4 bg-[#7C3AED]/10 border border-[#7C3AED]/20 rounded-xl text-left">
        <svg className="shrink-0 mt-0.5" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#7C3AED" strokeWidth="2">
          <circle cx="12" cy="12" r="10"/><path d="M12 16v-4m0-4h.01"/>
        </svg>
        <p className="adm-mono text-xs text-gray-400 leading-relaxed">
          Nếu sau <strong className="text-white">30 phút</strong> credits chưa được cộng, hãy liên hệ qua Zalo hoặc email để được hỗ trợ nhanh nhất.
        </p>
      </div>

      <button
        type="button"
        onClick={() => router.push("/admin/credits")}
        className="adm-mono px-8 py-3 border border-white/10 text-gray-400 rounded-xl text-xs font-bold uppercase hover:bg-white/5 hover:text-white transition-colors"
      >
        ← Quay lại Credits
      </button>
    </div>
  );
}

// ── Main page ──────────────────────────────────────────────
function PurchasePageContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const pkgId = searchParams.get("pkg") ?? "";

  const [pkg, setPkg] = useState<CreditPackage | null>(null);
  const [payment, setPayment] = useState<PaymentInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [step, setStep] = useState<"transfer" | "confirmed">("transfer");

  const today = new Date().toISOString().slice(0, 10).replace(/-/g, "");
  const transferNote = payment
    ? payment.transferNoteTemplate.replace("{package}", pkg?.name ?? pkgId.toUpperCase()).replace("{date}", today)
    : "";

  useEffect(() => {
    fetch("/api/admin/credits/packages")
      .then(r => r.json())
      .then(data => {
        const found = (data.packages ?? []).find((p: CreditPackage) => p.id === pkgId);
        if (!found) { router.replace("/admin/credits"); return; }
        setPkg(found);
        setPayment(data.payment ?? null);
      })
      .catch(() => router.replace("/admin/credits"))
      .finally(() => setLoading(false));
  }, [pkgId, router]);

  if (loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="adm-mono text-[#7C3AED] text-xs animate-pulse uppercase tracking-widest">
          Đang tải thông tin gói{" "}
          <span className="animate-ping">▌</span>
        </div>
      </div>
    );
  }

  if (!pkg || !payment) return null;

  return (
    <div className="max-w-2xl mx-auto">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 mb-8 adm-mono text-xs text-gray-500">
        <Link href="/admin/credits" className="hover:text-white transition-colors">AI Credits</Link>
        <span>/</span>
        <span className="text-white">Purchase — {pkg.name}</span>
      </div>

      {/* Header */}
      <div className="mb-8">
        <div className="adm-mono flex items-center gap-2 text-[#7C3AED] text-xs mb-2">
          <span className="material-symbols-outlined text-[14px]">receipt_long</span>
          <span>root@unispace:~# ./purchase.sh --pkg={pkgId}</span>
        </div>
        <h1 className="adm-mono text-2xl md:text-3xl font-bold uppercase tracking-tight">
          {step === "transfer" ? "Thanh toán" : "Xác nhận giao dịch"}
          <span className="text-[#7C3AED] font-normal">{" // "}{pkg.name}</span>
        </h1>
      </div>

      {/* Step indicator */}
      <div className="flex items-center gap-3 mb-8">
        {[
          { id: "transfer", label: "Chuyển khoản" },
          { id: "confirmed", label: "Xác nhận" },
        ].map((s, i) => (
          <div key={s.id} className="flex items-center gap-3">
            <div className={`flex items-center gap-2 adm-mono text-xs uppercase font-bold ${
              step === s.id ? "text-[#7C3AED]" : step === "confirmed" && s.id === "transfer" ? "text-gray-600" : "text-gray-600"
            }`}>
              <div className={`w-6 h-6 rounded-full flex items-center justify-center text-[11px] font-black border ${
                step === "confirmed" && s.id === "transfer"
                  ? "bg-[#7C3AED] border-[#7C3AED] text-white"
                  : step === s.id
                  ? "border-[#7C3AED] text-[#7C3AED]"
                  : "border-white/20 text-gray-600"
              }`}>
                {step === "confirmed" && s.id === "transfer"
                  ? <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3"><path d="M20 6L9 17l-5-5"/></svg>
                  : i + 1}
              </div>
              {s.label}
            </div>
            {i === 0 && <div className={`flex-1 h-px w-12 ${step === "confirmed" ? "bg-[#7C3AED]/40" : "bg-white/10"}`} />}
          </div>
        ))}
      </div>

      {/* Content panel */}
      <div className="adm-glass p-6 md:p-8 rounded-2xl">
        {step === "transfer" ? (
          <TransferStep
            pkg={pkg}
            payment={payment}
            transferNote={transferNote}
            onConfirm={() => setStep("confirmed")}
          />
        ) : (
          <ConfirmStep pkg={pkg} transferNote={transferNote} />
        )}
      </div>
    </div>
  );
}

export default function PurchasePage() {
  return (
    <Suspense fallback={
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="adm-mono text-[#7C3AED] text-xs animate-pulse uppercase tracking-widest">Loading▌</div>
      </div>
    }>
      <PurchasePageContent />
    </Suspense>
  );
}
