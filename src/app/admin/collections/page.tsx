"use client";
import { useState, useEffect, useCallback } from "react";
import Link from "next/link";

interface DesignItem {
  id: string;
  name: string;
  collectionId: string;
  previewUrl: string;
  garmentType: string;
  color: string;
  price?: string;
  published: boolean;
  createdAt: string;
}
interface Collection {
  id: string;
  name: string;
  description?: string;
  status: "LIVE" | "DRAFT" | "SCHEDULED";
  designs: DesignItem[];
  createdAt: string;
}

const STATUS_COLORS = { LIVE: "#22c55e", DRAFT: "#9ca3af", SCHEDULED: "#c8a0f0" };

export default function CollectionsPage() {
  const [tab, setTab] = useState<"collections" | "designs">("collections");
  const [collections, setCollections] = useState<Collection[]>([]);
  const [loading, setLoading] = useState(true);

  // New collection modal
  const [showNewCol, setShowNewCol] = useState(false);
  const [newColName, setNewColName] = useState("");
  const [newColDesc, setNewColDesc] = useState("");
  const [saving, setSaving] = useState(false);

  const fetch_ = useCallback(async () => {
    setLoading(true);
    try {
      const r = await fetch("/api/admin/collections");
      const d = await r.json();
      setCollections(d.collections || []);
    } finally { setLoading(false); }
  }, []);

  useEffect(() => { fetch_(); }, [fetch_]);

  const createCollection = async () => {
    if (!newColName.trim()) return;
    setSaving(true);
    await fetch("/api/admin/collections", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: newColName.trim(), description: newColDesc.trim(), status: "DRAFT" }),
    });
    setSaving(false);
    setShowNewCol(false);
    setNewColName(""); setNewColDesc("");
    fetch_();
  };

  const toggleStatus = async (colId: string, current: string) => {
    const next = current === "LIVE" ? "DRAFT" : "LIVE";
    await fetch("/api/admin/collections", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ collectionId: colId, status: next }),
    });
    fetch_();
  };

  const toggleDesign = async (designId: string, published: boolean) => {
    await fetch("/api/admin/collections", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "toggle_design", designId, published: !published }),
    });
    fetch_();
  };

  const deleteDesign = async (designId: string) => {
    if (!confirm("Xoá thiết kế này?")) return;
    await fetch(`/api/admin/collections?designId=${designId}`, { method: "DELETE" });
    fetch_();
  };

  const allDesigns = collections.flatMap(c => c.designs.map(d => ({ ...d, collectionName: c.name })));

  return (
    <div className="max-w-[1600px] mx-auto">
      {/* Header */}
      <div className="mb-6 flex flex-col gap-1">
        <div className="adm-mono flex items-center gap-2 text-[#7C3AED] text-xs mb-2">
          <span className="material-symbols-outlined text-[14px]">terminal</span>
          <span>root@unispace:~# ./manage_collections.sh</span>
        </div>
        <h2 className="adm-mono text-2xl font-bold tracking-tight uppercase">
          COLLECTIONS <span className="text-[#7C3AED] font-normal">{'// MARKETPLACE'}</span>
        </h2>
        <p className="adm-mono text-sm text-[#9ca3af]">Manage collections and push designs to the homepage storefront.</p>
      </div>

      {/* Tab + Actions */}
      <div className="flex gap-2 mb-6 flex-wrap">
        {(["collections", "designs"] as const).map(t => (
          <button key={t} onClick={() => setTab(t)}
            className={`adm-mono px-4 py-2 text-xs uppercase tracking-widest transition-colors ${tab === t ? "bg-[#7C3AED]/20 border border-[#7C3AED]/50 text-[#7C3AED]" : "border border-white/10 text-[#9ca3af] hover:bg-white/5"}`}>{t}
          </button>
        ))}
        {tab === "designs" ? (
          <Link href="/design"
            className="adm-mono ml-auto px-4 py-2 text-xs uppercase tracking-widest bg-[#7C3AED] text-white hover:bg-[#7C3AED]/80 transition-colors flex items-center gap-2">
            <span className="material-symbols-outlined text-[14px]">brush</span>NEW DESIGN
          </Link>
        ) : (
          <button onClick={() => setShowNewCol(true)}
            className="adm-mono ml-auto px-4 py-2 text-xs uppercase tracking-widest bg-[#7C3AED] text-white hover:bg-[#7C3AED]/80 transition-colors flex items-center gap-2">
            <span className="material-symbols-outlined text-[14px]">add</span>NEW COLLECTION
          </button>
        )}
      </div>

      {loading ? (
        <div className="adm-mono text-xs text-[#9ca3af] py-12 text-center animate-pulse">LOADING... ▋</div>
      ) : tab === "collections" ? (
        /* ── COLLECTIONS GRID ── */
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {collections.length === 0 && (
            <p className="adm-mono text-xs text-[#9ca3af] py-8">Chưa có collection nào. Tạo mới để bắt đầu.</p>
          )}
          {collections.map(c => {
            const col = STATUS_COLORS[c.status] || "#9ca3af";
            return (
              <div key={c.id} className="adm-glass p-5 group hover:border-[#7C3AED]/30 transition-all">
                <div className="flex justify-between items-start mb-3">
                  <span className="adm-mono text-[10px] text-[#9ca3af] uppercase tracking-widest">{c.id}</span>
                  <span className="adm-mono text-[10px] uppercase tracking-widest px-2 py-0.5 inline-flex items-center gap-1"
                    ref={(el) => { if (el) { el.style.color = col; el.style.background = `${col}20`; el.style.border = `1px solid ${col}50`; } }}>
                    <span className="inline-block w-1.5 h-1.5" ref={(el) => { if (el) el.style.background = col; }} />
                    {c.status}
                  </span>
                </div>
                <h3 className="text-lg font-black uppercase tracking-wider mb-1">{c.name}</h3>
                {c.description && <p className="adm-mono text-[11px] text-[#9ca3af] mb-2">{c.description}</p>}
                <div className="adm-mono flex gap-6 text-xs text-[#9ca3af] mb-4">
                  <span>{c.designs.length} DESIGNS</span>
                  <span>{c.designs.filter(d => d.published).length} PUBLISHED</span>
                  <span>CREATED: {c.createdAt.split("T")[0]}</span>
                </div>
                {/* Design previews row */}
                {c.designs.length > 0 && (
                  <div className="flex gap-2 mb-4 overflow-x-auto pb-1">
                    {c.designs.slice(0, 5).map(d => (
                      <div key={d.id} className="relative shrink-0 w-14 h-14">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={d.previewUrl} alt={d.name}
                          className="w-14 h-14 object-cover rounded border border-white/10 bg-white/5" />
                        {d.published && (
                          <span className="absolute top-0 right-0 w-3 h-3 bg-green-500 rounded-full border border-black" />
                        )}
                      </div>
                    ))}
                    {c.designs.length > 5 && (
                      <div className="shrink-0 w-14 h-14 flex items-center justify-center bg-white/5 border border-white/10 rounded adm-mono text-[10px] text-[#9ca3af]">
                        +{c.designs.length - 5}
                      </div>
                    )}
                  </div>
                )}
                <div className="flex gap-2">
                  <button onClick={() => toggleStatus(c.id, c.status)}
                    className="adm-mono px-3 py-1.5 text-[10px] uppercase tracking-wider border border-[#7C3AED]/30 text-[#7C3AED] hover:bg-[#7C3AED]/10 transition-colors flex items-center gap-1">
                    <span className="material-symbols-outlined text-[12px]">{c.status === "LIVE" ? "pause" : "rocket_launch"}</span>
                    {c.status === "LIVE" ? "SET DRAFT" : "GO LIVE"}
                  </button>
                  <button onClick={() => setTab("designs")}
                    className="adm-mono px-3 py-1.5 text-[10px] uppercase tracking-wider border border-white/10 text-[#9ca3af] hover:text-white hover:bg-white/5 transition-colors flex items-center gap-1">
                    <span className="material-symbols-outlined text-[12px]">grid_view</span>DESIGNS
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* ── DESIGNS TABLE ── */
        allDesigns.length === 0 ? (
          <div className="adm-mono text-xs text-[#9ca3af] py-12 text-center border border-white/10">
            NO_DESIGNS_FOUND // Thiết kế xong rồi lưu vào collection để thấy ở đây
          </div>
        ) : (
          <div className="adm-table-border w-full overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-[#262626] border-b border-white/20">
                  {["Preview", "Name", "Collection", "Loại áo", "On Store", "Actions"].map((h, i) => (
                    <th key={h} className={`adm-mono py-3 px-4 text-xs font-semibold text-[#7C3AED] uppercase tracking-wider ${i < 5 ? "adm-col-border" : ""}`}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="text-sm">
                {allDesigns.map((d, idx) => (
                  <tr key={d.id} className={`hover:bg-[#7C3AED]/10 transition-colors adm-row-border ${idx % 2 === 1 ? "bg-black/20" : ""}`}>
                    <td className="py-2 px-4 adm-col-border">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={d.previewUrl} alt={d.name} className="w-10 h-10 object-cover rounded border border-white/10 bg-white/5" />
                    </td>
                    <td className="py-3 px-4 font-bold adm-col-border">{d.name}</td>
                    <td className="adm-mono py-3 px-4 text-xs text-[#9ca3af] adm-col-border">{(d as DesignItem & {collectionName: string}).collectionName}</td>
                    <td className="adm-mono py-3 px-4 text-xs adm-col-border">{d.garmentType}</td>
                    <td className="py-3 px-4 adm-col-border">
                      {d.published ? (
                        <span className="adm-mono text-[10px] uppercase tracking-widest px-2 py-0.5 bg-[#22c55e]/20 border border-[#22c55e]/50 text-[#22c55e]">● LIVE</span>
                      ) : (
                        <span className="adm-mono text-[10px] uppercase tracking-widest px-2 py-0.5 bg-white/5 border border-white/10 text-[#9ca3af]">○ DRAFT</span>
                      )}
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex gap-3">
                        <button onClick={() => toggleDesign(d.id, d.published)}
                          className={`adm-mono text-[10px] uppercase tracking-wider flex items-center gap-1 transition-colors ${d.published ? "text-yellow-400 hover:text-white" : "text-[#7C3AED] hover:text-white"}`}>
                          <span className="material-symbols-outlined text-[12px]">{d.published ? "pause" : "rocket_launch"}</span>
                          {d.published ? "UNPUBLISH" : "PUBLISH"}
                        </button>
                        <button onClick={() => deleteDesign(d.id)}
                          className="adm-mono text-red-400 hover:text-white text-[10px] uppercase tracking-wider flex items-center gap-1 transition-colors">
                          <span className="material-symbols-outlined text-[12px]">delete</span>DEL
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )
      )}

      {/* New Collection Modal */}
      {showNewCol && (
        <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4" onClick={() => setShowNewCol(false)}>
          <div className="bg-[#111] border border-white/20 p-6 w-full max-w-md" onClick={e => e.stopPropagation()}>
            <h3 className="adm-mono font-bold text-sm uppercase tracking-widest text-[#7C3AED] mb-4">NEW_COLLECTION</h3>
            <div className="space-y-3">
              <div>
                <label className="adm-mono text-[10px] text-[#9ca3af] uppercase tracking-widest block mb-1">Tên collection *</label>
                <input
                  value={newColName}
                  onChange={e => setNewColName(e.target.value)}
                  placeholder="VD: VARSITY 2026"
                  className="w-full bg-white/5 border border-white/20 text-white px-3 py-2 text-sm outline-none focus:border-[#7C3AED]/50 adm-mono"
                />
              </div>
              <div>
                <label className="adm-mono text-[10px] text-[#9ca3af] uppercase tracking-widest block mb-1">Mô tả (tuỳ chọn)</label>
                <input
                  value={newColDesc}
                  onChange={e => setNewColDesc(e.target.value)}
                  placeholder="Mô tả ngắn..."
                  className="w-full bg-white/5 border border-white/20 text-white px-3 py-2 text-sm outline-none focus:border-[#7C3AED]/50 adm-mono"
                />
              </div>
            </div>
            <div className="flex gap-2 mt-4">
              <button
                onClick={createCollection}
                disabled={saving || !newColName.trim()}
                className="adm-mono flex-1 py-2 text-xs uppercase tracking-widest bg-[#7C3AED] text-white hover:bg-[#7C3AED]/80 disabled:opacity-40 transition-colors"
              >
                {saving ? "SAVING..." : "CREATE"}
              </button>
              <button onClick={() => setShowNewCol(false)}
                className="adm-mono px-4 py-2 text-xs uppercase tracking-widest border border-white/20 text-[#9ca3af] hover:bg-white/5 transition-colors">
                CANCEL
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
