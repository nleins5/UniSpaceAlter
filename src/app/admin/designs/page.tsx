"use client";
import { useState, useEffect } from "react";
import Image from "next/image";

interface SizeMap { XS: number; S: number; M: number; L: number; XL: number; XXL: number; }
interface OrderInfo { name: string; phone: string; address: string; className: string; note: string; sizes: SizeMap; }
interface Submission {
  id: number;
  filename: string;
  url: string;
  tshirtColor: string;
  submittedAt: string;
  status: "pending" | "approved" | "rejected";
  orderInfo?: OrderInfo;
}

const SIZE_KEYS: (keyof SizeMap)[] = ['XS','S','M','L','XL','XXL'];
const STATUS_COLORS = { pending: 'bg-amber-100 text-amber-700', approved: 'bg-green-100 text-green-700', rejected: 'bg-red-100 text-red-700' };
const STATUS_LABELS = { pending: '⏳ Chờ xử lý', approved: '✅ Đã duyệt', rejected: '❌ Từ chối' };

export default function AdminDesignsPage() {
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<Submission | null>(null);

  useEffect(() => {
    fetch('/exports/submissions.json')
      .then(r => r.json())
      .then((data: Submission[]) => { setSubmissions(data.reverse()); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  const totalSizes = submissions.reduce((acc, s) => {
    if (!s.orderInfo?.sizes) return acc;
    SIZE_KEYS.forEach(k => { acc[k] = (acc[k] || 0) + (s.orderInfo!.sizes[k] || 0); });
    return acc;
  }, {} as Partial<SizeMap>);

  const totalShirts = Object.values(totalSizes).reduce((a, b) => a + b, 0);
  const pending = submissions.filter(s => !s.status || s.status === 'pending').length;

  return (
    <div className="min-h-screen bg-[#F5F4F1] font-sans">
      {/* ── HEADER ── */}
      <header className="bg-black text-white px-8 py-4 flex items-center justify-between sticky top-0 z-50">
        <div className="flex items-center gap-4">
          <span className="text-lg font-black uppercase tracking-tighter">UniSpace</span>
          <span className="text-gray-500 text-sm font-mono">/ Admin Orders</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
          <span className="text-[11px] font-mono text-gray-400 uppercase tracking-widest">System Operational</span>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-8">
        {/* ── STATS ROW ── */}
        <div className="grid grid-cols-4 gap-4 mb-8">
          <div className="bg-white rounded-2xl p-5 border border-gray-200 shadow-sm">
            <p className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-1">Tổng Đơn</p>
            <p className="text-3xl font-black">{submissions.length}</p>
          </div>
          <div className="bg-white rounded-2xl p-5 border border-gray-200 shadow-sm">
            <p className="text-[10px] font-black uppercase tracking-widest text-amber-500 mb-1">Chờ Xử Lý</p>
            <p className="text-3xl font-black text-amber-600">{pending}</p>
          </div>
          <div className="bg-white rounded-2xl p-5 border border-gray-200 shadow-sm">
            <p className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-1">Tổng Áo</p>
            <p className="text-3xl font-black">{totalShirts}</p>
          </div>
          <div className="bg-black rounded-2xl p-5 shadow-sm">
            <p className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-2">Breakdown Sizes</p>
            <div className="flex gap-3">
              {SIZE_KEYS.map(k => (
                <div key={k} className="text-center">
                  <p className="text-[9px] text-gray-500 uppercase">{k}</p>
                  <p className="text-sm font-black text-white">{totalSizes[k] || 0}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* ── TABLE ── */}
        {loading ? (
          <div className="text-center py-32 text-gray-400 font-mono text-sm">Loading submissions...</div>
        ) : submissions.length === 0 ? (
          <div className="text-center py-32 text-gray-400 font-mono text-sm">Chưa có đơn nào</div>
        ) : (
          <div className="bg-white rounded-3xl border border-gray-200 overflow-hidden shadow-sm">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  {['#','Thiết kế','Khách hàng','Lớp/Trường','Số lượng','Màu áo','Thời gian','Trạng thái',''].map(h => (
                    <th key={h} className="px-4 py-3 text-left text-[10px] font-black uppercase tracking-widest text-gray-500">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {submissions.map((sub, i) => {
                  const total = sub.orderInfo?.sizes ? Object.values(sub.orderInfo.sizes).reduce((a,b)=>a+b,0) : '—';
                  const status = sub.status || 'pending';
                  return (
                    <tr key={sub.id} className="border-b border-gray-100 hover:bg-gray-50 transition-colors cursor-pointer" onClick={() => setSelected(sub)}>
                      <td className="px-4 py-3 text-[11px] font-mono text-gray-400">{submissions.length - i}</td>
                      <td className="px-4 py-3">
                        <div className="w-16 h-10 relative rounded-lg overflow-hidden border border-gray-200 bg-gray-50">
                          <Image src={sub.url} alt="design" fill className="object-contain" unoptimized />
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <p className="text-sm font-bold text-gray-900">{sub.orderInfo?.name || '—'}</p>
                        <p className="text-[11px] text-gray-400 font-mono">{sub.orderInfo?.phone || ''}</p>
                      </td>
                      <td className="px-4 py-3 text-[11px] text-gray-600">{sub.orderInfo?.className || '—'}</td>
                      <td className="px-4 py-3 text-sm font-black">{total} <span className="text-[10px] font-normal text-gray-400">áo</span></td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1.5">
                          <div className="w-4 h-4 rounded border border-gray-200 shrink-0" style={{backgroundColor: sub.tshirtColor}} />
                          <span className="text-[10px] font-mono text-gray-400">{sub.tshirtColor}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-[11px] text-gray-400 font-mono">{new Date(sub.submittedAt).toLocaleString('vi-VN')}</td>
                      <td className="px-4 py-3">
                        <span className={`text-[10px] font-black px-2 py-1 rounded-full ${STATUS_COLORS[status]}`}>{STATUS_LABELS[status]}</span>
                      </td>
                      <td className="px-4 py-3">
                        <a href={sub.url} download onClick={e => e.stopPropagation()}
                          className="px-3 py-1.5 bg-black text-white text-[10px] font-black uppercase rounded-full hover:bg-gray-800 transition-all whitespace-nowrap">
                          ↓ PNG
                        </a>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </main>

      {/* ── ORDER DETAIL MODAL ── */}
      {selected && (
        <div className="fixed inset-0 z-[999] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4" onClick={() => setSelected(null)}>
          <div className="bg-white rounded-3xl max-w-2xl w-full shadow-2xl overflow-hidden" onClick={e => e.stopPropagation()}>
            <div className="bg-black text-white px-6 py-4 flex items-center justify-between">
              <div>
                <h2 className="text-sm font-black uppercase tracking-widest">Chi Tiết Đơn Hàng</h2>
                <p className="text-[10px] text-gray-400 font-mono mt-0.5">{selected.orderInfo?.name} — {new Date(selected.submittedAt).toLocaleString('vi-VN')}</p>
              </div>
              <button onClick={() => setSelected(null)} className="text-gray-400 hover:text-white text-xl">✕</button>
            </div>

            <div className="p-6 grid grid-cols-2 gap-6">
              {/* Design preview */}
              <div className="relative w-full aspect-video rounded-2xl overflow-hidden border border-gray-200 bg-gray-50">
                <Image src={selected.url} alt="design" fill className="object-contain p-2" unoptimized />
              </div>

              {/* Order info */}
              <div className="space-y-3">
                {[
                  ['Họ tên', selected.orderInfo?.name],
                  ['Điện thoại', selected.orderInfo?.phone],
                  ['Địa chỉ', selected.orderInfo?.address],
                  ['Lớp/Trường', selected.orderInfo?.className],
                  ['Ghi chú', selected.orderInfo?.note],
                ].map(([label, val]) => val ? (
                  <div key={label}>
                    <p className="text-[9px] font-black uppercase tracking-widest text-gray-400">{label}</p>
                    <p className="text-sm font-medium text-gray-900">{val}</p>
                  </div>
                ) : null)}
              </div>

              {/* Sizes full row */}
              <div className="col-span-2 bg-gray-50 rounded-2xl p-4">
                <p className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-3">Số lượng theo size</p>
                <div className="grid grid-cols-6 gap-3">
                  {SIZE_KEYS.map(k => (
                    <div key={k} className="text-center bg-white rounded-xl py-3 border border-gray-200">
                      <p className="text-[9px] font-black uppercase text-gray-400">{k}</p>
                      <p className="text-xl font-black mt-1">{selected.orderInfo?.sizes?.[k] || 0}</p>
                    </div>
                  ))}
                </div>
                <p className="text-right text-[11px] font-mono text-gray-500 mt-2">
                  Tổng: <span className="font-black text-black text-sm">
                    {selected.orderInfo?.sizes ? Object.values(selected.orderInfo.sizes).reduce((a,b)=>a+b,0) : 0} áo
                  </span>
                </p>
              </div>
            </div>

            <div className="px-6 pb-6 flex gap-3">
              <a href={selected.url} download
                className="flex-1 text-center py-2.5 bg-black text-white rounded-2xl text-[11px] font-black uppercase tracking-widest hover:bg-gray-900 transition-colors">
                ↓ Download PNG
              </a>
              <button onClick={() => setSelected(null)}
                className="flex-1 py-2.5 border border-gray-200 rounded-2xl text-[11px] font-black uppercase tracking-widest hover:border-black transition-colors">
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
