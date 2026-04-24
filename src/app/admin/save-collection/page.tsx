"use client";
import { useState, useEffect, Suspense } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

interface Collection { id: string; name: string; status: string; designs: unknown[]; }
interface DraftData { previewUrl: string; garmentType: string; color: string; ts: number; }

function SaveCollectionContent() {
  const router = useRouter();
  const [draft, setDraft] = useState<DraftData | null>(null);
  const [collections, setCollections] = useState<Collection[]>([]);
  const [loading, setLoading] = useState(true);
  const [mode, setMode] = useState<"pick" | "new">("pick");

  const [selectedColId, setSelectedColId] = useState("");
  const [designName, setDesignName] = useState("Thiết kế " + new Date().toLocaleDateString("vi-VN"));
  const [publishNow, setPublishNow] = useState(false);
  const [newColName, setNewColName] = useState("");
  const [newColDesc, setNewColDesc] = useState("");
  const [saving, setSaving] = useState(false);
  const [done, setDone] = useState(false);
  const [savedInfo, setSavedInfo] = useState("");

  // Load draft from sessionStorage
  useEffect(() => {
    try {
      const raw = sessionStorage.getItem("unispace_save_draft");
      if (!raw) { router.replace("/admin"); return; }
      const data = JSON.parse(raw) as DraftData;
      // Expire after 30 min
      if (Date.now() - data.ts > 30 * 60 * 1000) {
        sessionStorage.removeItem("unispace_save_draft");
        router.replace("/admin");
        return;
      }
      setDraft(data);
    } catch {
      router.replace("/admin");
    }
  }, [router]);

  // Load collections
  useEffect(() => {
    fetch("/api/admin/collections")
      .then(r => r.json())
      .then(d => { setCollections(d.collections || []); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  const handleSave = async () => {
    if (!draft || !designName.trim()) return;
    setSaving(true);
    try {
      let collectionId = selectedColId;
      let collectionName = collections.find(c => c.id === collectionId)?.name || "";

      if (mode === "new") {
        if (!newColName.trim()) { setSaving(false); return; }
        const r = await fetch("/api/admin/collections", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ name: newColName.trim(), description: newColDesc.trim(), status: "DRAFT" }),
        });
        const d = await r.json();
        collectionId = d.collection.id;
        collectionName = d.collection.name;
      }

      await fetch("/api/admin/collections", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "add_design",
          collectionId,
          name: designName.trim(),
          previewUrl: draft.previewUrl,
          garmentType: draft.garmentType,
          color: draft.color,
          published: publishNow,
        }),
      });

      sessionStorage.removeItem("unispace_save_draft");
      setSavedInfo(collectionName);
      setDone(true);
    } catch {
      alert("Lỗi khi lưu thiết kế");
    } finally {
      setSaving(false);
    }
  };

  if (!draft) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="adm-mono text-[#7C3AED] text-xs animate-pulse uppercase tracking-widest">
          Đang tải▌
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 mb-8 adm-mono text-xs text-gray-500">
        <Link href="/admin" className="hover:text-white transition-colors">Admin</Link>
        <span>/</span>
        <Link href="/admin/collections" className="hover:text-white transition-colors">Collections</Link>
        <span>/</span>
        <span className="text-white">Save Design</span>
      </div>

      {/* Header */}
      <div className="mb-8">
        <div className="adm-mono flex items-center gap-2 text-[#7C3AED] text-xs mb-2">
          <span className="material-symbols-outlined text-[14px]">collections</span>
          <span>root@unispace:~# ./save-design.sh</span>
        </div>
        <h1 className="adm-mono text-2xl md:text-3xl font-bold uppercase tracking-tight">
          Lưu vào Collection
        </h1>
      </div>

      {done ? (
        /* ── Success screen ── */
        <div className="adm-glass p-8 rounded-2xl flex flex-col items-center text-center space-y-6">
          <div className="relative">
            <div className="w-20 h-20 rounded-full bg-[#7C3AED]/20 border-2 border-[#7C3AED]/50 flex items-center justify-center">
              <span className="material-symbols-outlined text-4xl text-[#7C3AED]">check_circle</span>
            </div>
            <div className="absolute inset-0 rounded-full bg-[#7C3AED]/10 animate-ping" />
          </div>
          <div>
            <h2 className="adm-mono text-xl font-black uppercase tracking-wide mb-2">Đã lưu thành công!</h2>
            <p className="adm-mono text-sm text-gray-400">
              Thiết kế đã được thêm vào <span className="text-[#7C3AED] font-bold">{savedInfo}</span>.
              {publishNow && " Đã published lên homepage."}
            </p>
          </div>
          <div className="flex gap-3">
            <Link href="/admin/collections"
              className="adm-mono px-6 py-3 bg-[#7C3AED] text-white text-xs uppercase tracking-widest hover:bg-[#7C3AED]/80 transition-colors rounded-xl">
              Xem Collections
            </Link>
            <button type="button" onClick={() => window.close()}
              className="adm-mono px-6 py-3 border border-white/10 text-gray-400 text-xs uppercase tracking-widest hover:bg-white/5 hover:text-white transition-colors rounded-xl">
              Đóng tab
            </button>
          </div>
        </div>
      ) : (
        <div className="adm-glass p-6 md:p-8 rounded-2xl space-y-6">
          {/* Preview + Name */}
          <div className="flex gap-5 items-start">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={draft.previewUrl} alt="Design preview"
              className="w-24 h-24 object-contain rounded-xl border border-white/10 bg-white/5 shrink-0" />
            <div className="flex-1">
              <label htmlFor="design-name-input"
                className="adm-mono text-[10px] text-gray-500 uppercase tracking-widest block mb-2">
                Tên thiết kế
              </label>
              <input
                id="design-name-input"
                value={designName}
                onChange={e => setDesignName(e.target.value)}
                className="w-full bg-white/5 border border-white/10 text-white px-4 py-3 text-sm outline-none focus:border-[#7C3AED]/50 adm-mono rounded-xl"
              />
              <div className="flex gap-3 mt-3 adm-mono text-[10px] text-gray-600 uppercase tracking-wider">
                <span>{draft.garmentType}</span>
                <span>•</span>
                <span className="flex items-center gap-1">
                  <span className="w-3 h-3 rounded-full border border-white/20 inline-block adm-color-swatch" data-color={draft.color} ref={el => { if (el) el.style.setProperty('background', draft.color); }} />
                  {draft.color}
                </span>
              </div>
            </div>
          </div>

          {/* Mode toggle */}
          <div>
            <div className="adm-mono text-[10px] text-gray-500 uppercase tracking-widest mb-3">Chọn collection</div>
            <div className="flex gap-2 mb-4">
              <button type="button" onClick={() => setMode("pick")}
                className={`adm-mono flex-1 py-2.5 text-xs uppercase tracking-widest border transition-colors rounded-xl ${
                  mode === "pick" ? "border-[#7C3AED]/50 bg-[#7C3AED]/10 text-[#7C3AED]" : "border-white/10 text-gray-400 hover:bg-white/5"
                }`}>
                Có sẵn
              </button>
              <button type="button" onClick={() => setMode("new")}
                className={`adm-mono flex-1 py-2.5 text-xs uppercase tracking-widest border transition-colors rounded-xl ${
                  mode === "new" ? "border-[#7C3AED]/50 bg-[#7C3AED]/10 text-[#7C3AED]" : "border-white/10 text-gray-400 hover:bg-white/5"
                }`}>
                + Tạo mới
              </button>
            </div>

            {mode === "pick" ? (
              loading ? (
                <div className="adm-mono text-xs text-gray-500 animate-pulse py-6 text-center">LOADING...</div>
              ) : collections.length === 0 ? (
                <div className="adm-mono text-xs text-gray-500 py-6 text-center">
                  Chưa có collection. Chuyển sang tạo mới.
                </div>
              ) : (
                <div className="space-y-2 max-h-56 overflow-y-auto">
                  {collections.map(c => (
                    <label key={c.id}
                      className={`flex items-center gap-3 px-4 py-3 border cursor-pointer transition-colors rounded-xl ${
                        selectedColId === c.id ? "border-[#7C3AED]/50 bg-[#7C3AED]/10" : "border-white/10 hover:bg-white/5"
                      }`}>
                      <input type="radio" name="col" value={c.id}
                        checked={selectedColId === c.id}
                        onChange={() => setSelectedColId(c.id)}
                        className="accent-[#7C3AED]" />
                      <div className="flex-1 min-w-0">
                        <p className="adm-mono text-sm font-bold text-white">{c.name}</p>
                        <p className="adm-mono text-[10px] text-gray-500">
                          {(c.designs as unknown[]).length} thiết kế • {c.status}
                        </p>
                      </div>
                    </label>
                  ))}
                </div>
              )
            ) : (
              <div className="space-y-3">
                <div>
                  <label className="adm-mono text-[10px] text-gray-500 uppercase tracking-widest block mb-1">
                    Tên collection *
                  </label>
                  <input value={newColName} onChange={e => setNewColName(e.target.value)}
                    placeholder="VD: VARSITY 2026"
                    className="w-full bg-white/5 border border-white/10 text-white px-4 py-3 text-sm outline-none focus:border-[#7C3AED]/50 adm-mono rounded-xl" />
                </div>
                <div>
                  <label className="adm-mono text-[10px] text-gray-500 uppercase tracking-widest block mb-1">
                    Mô tả (tuỳ chọn)
                  </label>
                  <input value={newColDesc} onChange={e => setNewColDesc(e.target.value)}
                    placeholder="Mô tả ngắn..."
                    className="w-full bg-white/5 border border-white/10 text-white px-4 py-3 text-sm outline-none focus:border-[#7C3AED]/50 adm-mono rounded-xl" />
                </div>
              </div>
            )}
          </div>

          {/* Publish toggle */}
          <label className="flex items-center gap-4 cursor-pointer p-4 border border-white/10 rounded-xl hover:bg-white/5 transition-colors">
            <div
              onClick={() => setPublishNow(v => !v)}
              className={`relative w-11 h-6 rounded-full transition-colors shrink-0 ${publishNow ? "bg-[#7C3AED]" : "bg-white/20"}`}>
              <div className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-all ${publishNow ? "left-6" : "left-1"}`} />
            </div>
            <div>
              <p className="adm-mono text-sm text-white font-bold">Publish lên homepage ngay</p>
              <p className="adm-mono text-[10px] text-gray-500">Nếu tắt, thiết kế sẽ ở trạng thái Draft</p>
            </div>
          </label>

          {/* Save button */}
          <button
            type="button"
            onClick={handleSave}
            disabled={saving || !designName.trim() || (mode === "pick" && !selectedColId) || (mode === "new" && !newColName.trim())}
            className="w-full adm-mono py-4 text-sm font-black uppercase tracking-widest bg-[#7C3AED] text-white hover:bg-[#7C3AED]/80 disabled:opacity-30 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-3 rounded-xl shadow-[0_0_30px_rgba(124,58,237,0.3)]"
          >
            <span className="material-symbols-outlined text-[18px]">save</span>
            {saving ? "SAVING..." : "LƯU VÀO COLLECTION"}
          </button>
        </div>
      )}
    </div>
  );
}

export default function SaveCollectionPage() {
  return (
    <Suspense fallback={
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="adm-mono text-[#7C3AED] text-xs animate-pulse uppercase tracking-widest">Loading▌</div>
      </div>
    }>
      <SaveCollectionContent />
    </Suspense>
  );
}
