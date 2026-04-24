"use client";
import { useState, useEffect } from "react";

interface Collection { id: string; name: string; status: string; designs: unknown[]; }

interface SaveToCollectionModalProps {
  previewUrl: string;        // base64 or blob URL of the exported design PNG
  garmentType?: string;
  color?: string;
  onClose: () => void;
  onSaved?: (designId: string, collectionName: string) => void;
}

export function SaveToCollectionModal({
  previewUrl, garmentType = "RAGLAN", color = "#ffffff", onClose, onSaved,
}: SaveToCollectionModalProps) {
  const [collections, setCollections] = useState<Collection[]>([]);
  const [loading, setLoading] = useState(true);
  const [mode, setMode] = useState<"pick" | "new">("pick");

  // Form fields
  const [selectedColId, setSelectedColId] = useState("");
  const [designName, setDesignName] = useState("Thiết kế " + new Date().toLocaleDateString("vi-VN"));
  const [publishNow, setPublishNow] = useState(false);
  // New collection
  const [newColName, setNewColName] = useState("");
  const [newColDesc, setNewColDesc] = useState("");

  const [saving, setSaving] = useState(false);
  const [done, setDone] = useState(false);
  const [savedInfo, setSavedInfo] = useState("");

  useEffect(() => {
    fetch("/api/admin/collections")
      .then(r => r.json())
      .then(d => { setCollections(d.collections || []); setLoading(false); });
  }, []);

  const handleSave = async () => {
    if (!designName.trim()) return;
    setSaving(true);
    try {
      let collectionId = selectedColId;
      let collectionName = collections.find(c => c.id === collectionId)?.name || "";

      // Create new collection first if needed
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

      // Save design
      const r2 = await fetch("/api/admin/collections", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "add_design",
          collectionId,
          name: designName.trim(),
          previewUrl,
          garmentType,
          color,
          published: publishNow,
        }),
      });
      const d2 = await r2.json();
      setSavedInfo(collectionName);
      setDone(true);
      onSaved?.(d2.design?.id || "", collectionName);
    } catch {
      alert("Lỗi khi lưu thiết kế");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/80 z-[200] flex items-center justify-center p-4">
      <div className="bg-[#0f0f12] border border-white/20 w-full max-w-lg" onClick={e => e.stopPropagation()}>
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/10">
          <div className="adm-mono text-xs font-bold text-[#7C3AED] uppercase tracking-widest flex items-center gap-2">
            <span className="material-symbols-outlined text-[14px]">collections</span>
            SAVE TO COLLECTION
          </div>
          <button onClick={onClose} className="text-[#9ca3af] hover:text-white transition-colors">
            <span className="material-symbols-outlined text-[18px]">close</span>
          </button>
        </div>

        {done ? (
          /* ── Success state ── */
          <div className="px-6 py-10 text-center">
            <div className="text-4xl mb-3">🎉</div>
            <p className="adm-mono text-sm text-white font-bold mb-1">Đã lưu thành công!</p>
            <p className="adm-mono text-xs text-[#9ca3af]">
              Thiết kế đã được thêm vào <span className="text-[#7C3AED]">{savedInfo}</span>.
              {publishNow && " Đã published lên homepage."}
            </p>
            <button onClick={onClose}
              className="adm-mono mt-6 px-6 py-2 text-xs uppercase tracking-widest bg-[#7C3AED] text-white hover:bg-[#7C3AED]/80 transition-colors">
              DONE
            </button>
          </div>
        ) : (
          <div className="px-6 py-5 space-y-5">
            {/* Preview */}
            <div className="flex gap-4 items-start">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={previewUrl} alt="Design preview"
                className="w-20 h-20 object-contain rounded border border-white/10 bg-white/5 shrink-0" />
              <div className="flex-1">
                <label htmlFor="design-name-input" className="adm-mono text-[10px] text-[#9ca3af] uppercase tracking-widest block mb-1">Tên thiết kế</label>
                <input
                  id="design-name-input"
                  aria-label="Tên thiết kế"
                  title="Tên thiết kế"
                  value={designName}
                  onChange={e => setDesignName(e.target.value)}
                  className="w-full bg-white/5 border border-white/20 text-white px-3 py-2 text-sm outline-none focus:border-[#7C3AED]/50 adm-mono"
                />
              </div>
            </div>

            {/* Mode toggle */}
            <div className="flex gap-2">
              <button onClick={() => setMode("pick")}
                className={`adm-mono flex-1 py-2 text-xs uppercase tracking-widest border transition-colors ${mode === "pick" ? "border-[#7C3AED]/50 bg-[#7C3AED]/10 text-[#7C3AED]" : "border-white/10 text-[#9ca3af] hover:bg-white/5"}`}>
                Chọn collection
              </button>
              <button onClick={() => setMode("new")}
                className={`adm-mono flex-1 py-2 text-xs uppercase tracking-widest border transition-colors ${mode === "new" ? "border-[#7C3AED]/50 bg-[#7C3AED]/10 text-[#7C3AED]" : "border-white/10 text-[#9ca3af] hover:bg-white/5"}`}>
                + Tạo collection mới
              </button>
            </div>

            {mode === "pick" ? (
              /* Pick existing collection */
              loading ? (
                <div className="adm-mono text-xs text-[#9ca3af] animate-pulse py-4 text-center">LOADING...</div>
              ) : collections.length === 0 ? (
                <div className="adm-mono text-xs text-[#9ca3af] py-4 text-center">
                  Chưa có collection. Chuyển sang tạo mới.
                </div>
              ) : (
                <div className="space-y-2 max-h-48 overflow-y-auto">
                  {collections.map(c => (
                    <label key={c.id}
                      className={`flex items-center gap-3 px-3 py-2.5 border cursor-pointer transition-colors ${selectedColId === c.id ? "border-[#7C3AED]/50 bg-[#7C3AED]/10" : "border-white/10 hover:bg-white/5"}`}>
                      <input type="radio" name="col" value={c.id}
                        checked={selectedColId === c.id}
                        onChange={() => setSelectedColId(c.id)}
                        className="accent-[#7C3AED]" />
                      <div className="flex-1 min-w-0">
                        <p className="adm-mono text-sm font-bold text-white">{c.name}</p>
                        <p className="adm-mono text-[10px] text-[#9ca3af]">{(c.designs as unknown[]).length} thiết kế • {c.status}</p>
                      </div>
                    </label>
                  ))}
                </div>
              )
            ) : (
              /* New collection form */
              <div className="space-y-3">
                <div>
                  <label className="adm-mono text-[10px] text-[#9ca3af] uppercase tracking-widest block mb-1">Tên collection *</label>
                  <input value={newColName} onChange={e => setNewColName(e.target.value)}
                    placeholder="VD: VARSITY 2026"
                    className="w-full bg-white/5 border border-white/20 text-white px-3 py-2 text-sm outline-none focus:border-[#7C3AED]/50 adm-mono" />
                </div>
                <div>
                  <label className="adm-mono text-[10px] text-[#9ca3af] uppercase tracking-widest block mb-1">Mô tả (tuỳ chọn)</label>
                  <input value={newColDesc} onChange={e => setNewColDesc(e.target.value)}
                    placeholder="Mô tả ngắn..."
                    className="w-full bg-white/5 border border-white/20 text-white px-3 py-2 text-sm outline-none focus:border-[#7C3AED]/50 adm-mono" />
                </div>
              </div>
            )}

            {/* Publish toggle */}
            <label className="flex items-center gap-3 cursor-pointer">
              <div
                onClick={() => setPublishNow(v => !v)}
                className={`relative w-10 h-5 rounded-full transition-colors ${publishNow ? "bg-[#7C3AED]" : "bg-white/20"}`}>
                <div className={`absolute top-0.5 w-4 h-4 rounded-full bg-white transition-all ${publishNow ? "left-5" : "left-0.5"}`} />
              </div>
              <div>
                <p className="adm-mono text-xs text-white">Publish lên homepage ngay</p>
                <p className="adm-mono text-[10px] text-[#9ca3af]">Nếu tắt, thiết kế sẽ ở trạng thái Draft</p>
              </div>
            </label>

            {/* Save button */}
            <button
              onClick={handleSave}
              disabled={saving || !designName.trim() || (mode === "pick" && !selectedColId) || (mode === "new" && !newColName.trim())}
              className="w-full adm-mono py-3 text-xs uppercase tracking-widest bg-[#7C3AED] text-white hover:bg-[#7C3AED]/80 disabled:opacity-40 transition-colors flex items-center justify-center gap-2"
            >
              <span className="material-symbols-outlined text-[14px]">save</span>
              {saving ? "SAVING..." : "LƯU VÀO COLLECTION"}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
