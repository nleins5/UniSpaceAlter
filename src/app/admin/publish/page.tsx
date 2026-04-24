"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";

interface Collection {
  id: string;
  name: string;
  status: string;
}

export default function AdminPublishPage() {
  // --- Design data from sessionStorage ---
  const [previews, setPreviews] = useState<{ front: string; back: string } | null>(null);
  const [config, setConfig] = useState({ garmentType: "RAGLAN", tshirtColor: "#ffffff", projectName: "" });

  // --- Form state ---
  const [productName, setProductName] = useState("");
  const [collections, setCollections] = useState<Collection[]>([]);
  const [selectedCollId, setSelectedCollId] = useState("");
  const [mode, setMode] = useState<"pick" | "new">("pick");
  const [newCollName, setNewCollName] = useState("");
  const [newCollDesc, setNewCollDesc] = useState("");
  const [publishNow, setPublishNow] = useState(true);

  // --- UI state ---
  const [loadingColls, setLoadingColls] = useState(true);
  const [saving, setSaving] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState("");

  // Load previews from sessionStorage
  useEffect(() => {
    const front = sessionStorage.getItem("design_preview_front");
    const back = sessionStorage.getItem("design_preview_back");
    const cfg = sessionStorage.getItem("design_config");
    if (front && back) setPreviews({ front, back });
    if (cfg) {
      try {
        const parsed = JSON.parse(cfg);
        setConfig(parsed);
        setProductName(parsed.projectName || "");
      } catch {}
    }
  }, []);

  // Fetch existing collections
  useEffect(() => {
    fetch("/api/admin/collections")
      .then((r) => r.json())
      .then((data) => {
        setCollections(data.collections || []);
        if (data.collections?.length > 0) setSelectedCollId(data.collections[0].id);
      })
      .catch(() => setError("Không tải được danh sách collection."))
      .finally(() => setLoadingColls(false));
  }, []);

  /** Convert base64 data URL → File blob, upload to server, get back a URL */
  const uploadPreview = async (dataUrl: string, fileName: string): Promise<string> => {
    const [meta, base64] = dataUrl.split(",");
    const mime = meta.match(/:(.*?);/)?.[1] || "image/png";
    const bytes = atob(base64);
    const arr = new Uint8Array(bytes.length);
    for (let i = 0; i < bytes.length; i++) arr[i] = bytes.charCodeAt(i);
    const blob = new Blob([arr], { type: mime });
    const fd = new FormData();
    fd.append("file", blob, fileName);
    const res = await fetch("/api/admin/upload-design", { method: "POST", body: fd });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || "Upload ảnh thất bại");
    return data.url as string;
  };

  const handleSave = async () => {
    if (!previews) return setError("Không có ảnh thiết kế. Hãy quay lại và export lại.");
    if (!productName.trim()) return setError("Vui lòng đặt tên sản phẩm.");
    if (mode === "pick" && !selectedCollId) return setError("Vui lòng chọn collection.");
    if (mode === "new" && !newCollName.trim()) return setError("Vui lòng nhập tên collection mới.");

    setSaving(true);
    setError("");

    try {
      // Step 1: Upload front preview image (avoid sending huge base64 in JSON)
      const previewUrl = await uploadPreview(previews.front, "front_preview.png");

      // Step 2: Create collection if needed
      let targetCollId = selectedCollId;
      if (mode === "new") {
        const res = await fetch("/api/admin/collections", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ name: newCollName.trim(), description: newCollDesc.trim(), status: "LIVE" }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "Tạo collection thất bại");
        targetCollId = data.collection.id;
      }

      // Step 3: Add design to collection (now just a short URL, not base64)
      const res = await fetch("/api/admin/collections", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "add_design",
          collectionId: targetCollId,
          name: productName.trim(),
          previewUrl,
          garmentType: config.garmentType,
          color: config.tshirtColor,
          published: publishNow,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Lưu thiết kế thất bại");

      // Step 4: Publish the collection if "pick" mode + publishNow
      if (publishNow && mode === "pick") {
        await fetch("/api/admin/collections", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ collectionId: targetCollId, status: "LIVE" }),
        });
      }

      // Clean up sessionStorage
      sessionStorage.removeItem("design_preview_front");
      sessionStorage.removeItem("design_preview_back");
      sessionStorage.removeItem("design_config");

      setDone(true);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Có lỗi xảy ra");
    } finally {
      setSaving(false);
    }
  };

  // --- SUCCESS SCREEN ---
  if (done) {
    return (
      <div className="min-h-screen bg-[#0a0a0f] flex items-center justify-center p-6">
        <div className="max-w-md w-full text-center flex flex-col items-center gap-6">
          <div className="w-20 h-20 rounded-full bg-green-500/10 border border-green-500/30 flex items-center justify-center">
            <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="#22c55e" strokeWidth="2">
              <path d="M22 11.08V12a10 10 0 11-5.93-9.14" />
              <polyline points="22 4 12 14.01 9 11.01" />
            </svg>
          </div>
          <div>
            <h1 className="text-2xl font-black text-white mb-2">Đã đăng thành công!</h1>
            <p className="text-slate-400 text-sm">Sản phẩm của bạn đã xuất hiện trên trang chủ.</p>
          </div>
          <div className="flex gap-3">
            <Link href="/" className="px-6 py-3 bg-white text-black font-bold rounded-xl text-sm hover:bg-white/90 transition-colors">
              Xem trang chủ →
            </Link>
            <Link href="/design" className="px-6 py-3 border border-white/20 text-white font-bold rounded-xl text-sm hover:bg-white/5 transition-colors">
              Design tiếp
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0a0a0f] text-white">
      {/* Header */}
      <header className="border-b border-white/10 px-6 py-4 flex items-center justify-between sticky top-0 bg-[#0a0a0f]/95 backdrop-blur-sm z-10">
        <div className="flex items-center gap-4">
          <Link href="/design" className="flex items-center gap-2 text-slate-400 hover:text-white transition-colors text-sm">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <path d="M19 12H5" /><polyline points="12 19 5 12 12 5" />
            </svg>
            Quay lại Designer
          </Link>
          <div className="w-px h-4 bg-white/20" />
          <span className="font-black text-sm tracking-widest">UNISPACE STUDIO</span>
        </div>
        <div className="flex items-center gap-2 text-xs text-slate-400">
          <span className="w-2 h-2 rounded-full bg-violet-500 animate-pulse inline-block" />
          ADMIN MODE
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-6 py-10 grid grid-cols-1 lg:grid-cols-2 gap-10">

        {/* LEFT — Preview */}
        <div className="flex flex-col gap-4">
          <h2 className="text-xs font-black tracking-widest text-slate-400 uppercase">Xem trước thiết kế</h2>
          {previews ? (
            <>
              <div className="rounded-2xl overflow-hidden border border-white/10 bg-white/5">
                <div className="px-4 pt-4 pb-1 text-[10px] font-bold text-violet-400 tracking-widest uppercase">Mặt trước</div>
                <Image
                  src={previews.front}
                  alt="Front Design"
                  width={800}
                  height={960}
                  unoptimized
                  className="w-full rounded-b-2xl"
                />
              </div>
              <div className="rounded-2xl overflow-hidden border border-white/10 bg-white/5">
                <div className="px-4 pt-4 pb-1 text-[10px] font-bold text-violet-400 tracking-widest uppercase">Mặt sau</div>
                <Image
                  src={previews.back}
                  alt="Back Design"
                  width={800}
                  height={960}
                  unoptimized
                  className="w-full rounded-b-2xl"
                />
              </div>
            </>
          ) : (
            <div className="rounded-2xl border border-dashed border-white/20 bg-white/5 h-80 flex flex-col items-center justify-center gap-3 text-slate-500">
              <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" opacity="0.4">
                <rect x="3" y="3" width="18" height="18" rx="2" /><path d="M3 9h18M9 21V9" />
              </svg>
              <p className="text-sm">Không tìm thấy ảnh thiết kế</p>
              <Link href="/design" className="text-violet-400 text-xs hover:underline">Quay lại và export lại</Link>
            </div>
          )}
        </div>

        {/* RIGHT — Form */}
        <div className="flex flex-col gap-6">
          <div>
            <h1 className="text-2xl font-black mb-1">Thêm vào Collection</h1>
            <p className="text-slate-400 text-sm">Điền thông tin để xuất bản thiết kế lên trang chủ.</p>
          </div>

          {/* Product name */}
          <div className="flex flex-col gap-2">
            <label className="text-xs font-bold tracking-widest text-slate-400 uppercase">Tên sản phẩm *</label>
            <input
              type="text"
              value={productName}
              onChange={(e) => setProductName(e.target.value)}
              placeholder="VD: Áo lớp 12A1 — THPT Nguyễn Du"
              className="w-full bg-white/5 border border-white/15 rounded-xl px-4 py-3 text-sm text-white placeholder:text-slate-600 focus:outline-none focus:border-violet-500 transition-colors"
            />
          </div>

          {/* Collection picker */}
          <div className="flex flex-col gap-3">
            <label className="text-xs font-bold tracking-widest text-slate-400 uppercase">Collection *</label>

            {/* Toggle pick vs new */}
            <div className="flex rounded-xl overflow-hidden border border-white/15">
              <button
                type="button"
                onClick={() => setMode("pick")}
                className={`flex-1 py-2.5 text-xs font-bold tracking-wider transition-colors ${mode === "pick" ? "bg-violet-600 text-white" : "bg-white/5 text-slate-400 hover:bg-white/10"}`}
              >
                Chọn có sẵn
              </button>
              <button
                type="button"
                onClick={() => setMode("new")}
                className={`flex-1 py-2.5 text-xs font-bold tracking-wider transition-colors ${mode === "new" ? "bg-violet-600 text-white" : "bg-white/5 text-slate-400 hover:bg-white/10"}`}
              >
                Tạo mới
              </button>
            </div>

            {mode === "pick" ? (
              loadingColls ? (
                <div className="text-slate-500 text-sm py-3 text-center">Đang tải...</div>
              ) : collections.length === 0 ? (
                <div className="text-slate-500 text-sm py-3 text-center">
                  Chưa có collection nào.{" "}
                  <button onClick={() => setMode("new")} className="text-violet-400 hover:underline">Tạo mới?</button>
                </div>
              ) : (
                <div className="flex flex-col gap-2 max-h-64 overflow-y-auto pr-1">
                  {collections.map((c) => (
                    <button
                      key={c.id}
                      type="button"
                      onClick={() => setSelectedCollId(c.id)}
                      className={`flex items-center justify-between px-4 py-3 rounded-xl border text-sm text-left transition-all ${
                        selectedCollId === c.id
                          ? "border-violet-500 bg-violet-500/10 text-white"
                          : "border-white/10 bg-white/5 text-slate-300 hover:border-white/25"
                      }`}
                    >
                      <span className="font-semibold">{c.name}</span>
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${c.status === "LIVE" || c.status === "PUBLISHED" ? "bg-green-500/20 text-green-400" : "bg-slate-500/20 text-slate-400"}`}>
                        {c.status === "LIVE" ? "LIVE" : c.status === "DRAFT" ? "DRAFT" : c.status}
                      </span>
                    </button>
                  ))}
                </div>
              )
            ) : (
              <div className="flex flex-col gap-3">
                <input
                  type="text"
                  value={newCollName}
                  onChange={(e) => setNewCollName(e.target.value)}
                  placeholder="Tên collection mới *"
                  className="w-full bg-white/5 border border-white/15 rounded-xl px-4 py-3 text-sm text-white placeholder:text-slate-600 focus:outline-none focus:border-violet-500 transition-colors"
                />
                <textarea
                  value={newCollDesc}
                  onChange={(e) => setNewCollDesc(e.target.value)}
                  placeholder="Mô tả (tuỳ chọn)..."
                  rows={2}
                  className="w-full bg-white/5 border border-white/15 rounded-xl px-4 py-3 text-sm text-white placeholder:text-slate-600 focus:outline-none focus:border-violet-500 transition-colors resize-none"
                />
              </div>
            )}
          </div>

          {/* Publish toggle */}
          <label className="flex items-center gap-3 cursor-pointer select-none group">
            <div
              onClick={() => setPublishNow(!publishNow)}
              className={`w-11 h-6 rounded-full transition-colors relative ${publishNow ? "bg-violet-600" : "bg-white/15"}`}
            >
              <div className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow transition-transform ${publishNow ? "translate-x-6" : "translate-x-1"}`} />
            </div>
            <div>
              <div className="text-sm font-semibold text-white">Xuất bản ngay lên trang chủ</div>
              <div className="text-xs text-slate-500">Tắt để lưu nháp, không hiện công khai</div>
            </div>
          </label>

          {/* Error */}
          {error && (
            <div className="px-4 py-3 bg-red-500/10 border border-red-500/30 rounded-xl text-sm text-red-400">
              {error}
            </div>
          )}

          {/* Submit */}
          <button
            type="button"
            onClick={handleSave}
            disabled={saving || !previews}
            className="w-full py-4 rounded-xl font-black text-sm tracking-widest uppercase transition-all disabled:opacity-40 disabled:cursor-not-allowed relative overflow-hidden group bg-gradient-to-br from-violet-600 to-indigo-600"
          >
            <span className="absolute inset-0 bg-white/10 translate-y-full group-hover:translate-y-0 transition-transform duration-300" />
            <span className="relative flex items-center justify-center gap-2">
              {saving ? (
                <>
                  <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Đang lưu...
                </>
              ) : (
                <>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                    <path d="M19 21H5a2 2 0 01-2-2V5a2 2 0 012-2h11l5 5v11a2 2 0 01-2 2z" />
                    <polyline points="17 21 17 13 7 13 7 21" />
                    <polyline points="7 3 7 8 15 8" />
                  </svg>
                  {publishNow ? "Lưu & Xuất bản ngay" : "Lưu nháp"}
                </>
              )}
            </span>
          </button>

          <p className="text-xs text-slate-600 text-center">
            Thiết kế sẽ{" "}
            {publishNow
              ? <span className="text-green-400">hiện ngay trên trang chủ</span>
              : <span className="text-slate-400">được lưu nháp, không công khai</span>
            }
          </p>
        </div>
      </main>
    </div>
  );
}
