"use client";
import { useState, useEffect } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";

interface Order {
  orderId: string;
  customerName: string;
  phone: string;
  address: string;
  color: string;
  size: string;
  quantity: number;
  status: "pending" | "confirmed" | "manufacturing" | "completed" | "cancelled";
  notes?: string;
  className?: string;
  createdAt: string;
  frontDesignUrl?: string;
  backDesignUrl?: string;
  hasFrontDesign?: boolean;
  hasBackDesign?: boolean;
}

const STATUS_COLORS: Record<string, string> = {
  pending: 'bg-amber-100 text-amber-700',
  confirmed: 'bg-blue-100 text-blue-700',
  manufacturing: 'bg-sky-100 text-sky-700',
  completed: 'bg-green-100 text-green-700',
  cancelled: 'bg-red-100 text-red-700',
};
const STATUS_LABELS: Record<string, string> = {
  pending: '⏳ Chờ xử lý',
  confirmed: '✅ Đã xác nhận',
  manufacturing: '🖨️ Đang in',
  completed: '✅ Hoàn thành',
  cancelled: '❌ Đã huỷ',
};
const VALID_STATUSES = ["pending", "confirmed", "manufacturing", "completed", "cancelled"] as const;

export default function AdminDesignsPage() {
  const router = useRouter();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [selected, setSelected] = useState<Order | null>(null);

  useEffect(() => {
    const userData = sessionStorage.getItem("user");
    if (!userData) { router.push("/login"); return; }
    const parsedUser = JSON.parse(userData);
    if (!parsedUser.admin) { router.push("/dashboard"); return; }

    const token = parsedUser.token;
    fetch("/api/orders", {
      headers: token ? { "Authorization": `Bearer ${token}` } : {}
    })
      .then(r => {
        if (r.status === 401) { sessionStorage.removeItem("user"); router.push("/login"); return null; }
        return r.json();
      })
      .then((data: { orders: Order[] } | null) => {
        if (data) setOrders(data.orders || []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [router]);

  const totalQuantity = orders.reduce((sum, o) => sum + o.quantity, 0);
  const pending = orders.filter(o => !o.status || o.status === 'pending').length;

  const handleStatusUpdate = async (orderId: string, newStatus: string) => {
    if (!VALID_STATUSES.includes(newStatus as (typeof VALID_STATUSES)[number])) return;
    setUpdatingId(orderId);
    setOrders(prev => prev.map(o => o.orderId === orderId ? { ...o, status: newStatus as Order['status'] } : o));
    try {
      const userData = sessionStorage.getItem("user");
      const token = userData ? JSON.parse(userData).token : null;
      const res = await fetch(`/api/orders/${orderId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json", ...(token ? { "Authorization": `Bearer ${token}` } : {}) },
        body: JSON.stringify({ status: newStatus }),
      });
      if (!res.ok) { alert("Không thể cập nhật trạng thái."); }
    } catch (err) {
      console.error(err);
      alert("Lỗi kết nối.");
    } finally {
      setUpdatingId(null);
    }
  };

  return (
    <div className="min-h-screen bg-[#F5F4F1] font-sans">
      {/* HEADER */}
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
        {/* STATS */}
        <div className="grid grid-cols-3 gap-4 mb-8">
          <div className="bg-white rounded-2xl p-5 border border-gray-200 shadow-sm">
            <p className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-1">Tổng Đơn</p>
            <p className="text-3xl font-black">{orders.length}</p>
          </div>
          <div className="bg-white rounded-2xl p-5 border border-gray-200 shadow-sm">
            <p className="text-[10px] font-black uppercase tracking-widest text-amber-500 mb-1">Chờ Xử Lý</p>
            <p className="text-3xl font-black text-amber-600">{pending}</p>
          </div>
          <div className="bg-white rounded-2xl p-5 border border-gray-200 shadow-sm">
            <p className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-1">Tổng Áo</p>
            <p className="text-3xl font-black">{totalQuantity}</p>
          </div>
        </div>

        {/* TABLE */}
        {loading ? (
          <div className="text-center py-32 text-gray-400 font-mono text-sm">Loading...</div>
        ) : orders.length === 0 ? (
          <div className="text-center py-32 text-gray-400 font-mono text-sm">Chưa có đơn nào</div>
        ) : (
          <div className="bg-white rounded-3xl border border-gray-200 overflow-hidden shadow-sm">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  {['#', 'Thiết kế', 'Khách hàng', 'Lớp/Trường', 'Số lượng', 'Size', 'Màu áo', 'Thời gian', 'Trạng thái', ''].map(h => (
                    <th key={h} className="px-4 py-3 text-left text-[10px] font-black uppercase tracking-widest text-gray-500">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {orders.map((order, i) => (
                  <tr key={order.orderId}
                    className="border-b border-gray-100 hover:bg-gray-50 transition-colors cursor-pointer"
                    onClick={() => setSelected(order)}>
                    <td className="px-4 py-3 text-[11px] font-mono text-gray-400">{orders.length - i}</td>
                    <td className="px-4 py-3">
                      <div className="flex gap-1">
                        {order.frontDesignUrl && (
                          <div className="w-8 h-10 relative rounded overflow-hidden border border-gray-200 bg-gray-50">
                            <Image src={order.frontDesignUrl} alt="front" fill className="object-contain" unoptimized />
                          </div>
                        )}
                        {order.backDesignUrl && (
                          <div className="w-8 h-10 relative rounded overflow-hidden border border-gray-200 bg-gray-50">
                            <Image src={order.backDesignUrl} alt="back" fill className="object-contain" unoptimized />
                          </div>
                        )}
                        {!order.frontDesignUrl && !order.backDesignUrl && (
                          <span className="text-[9px] text-gray-300 font-mono">—</span>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <p className="text-sm font-bold text-gray-900">{order.customerName || '—'}</p>
                      <p className="text-[11px] text-gray-400 font-mono">{order.phone || ''}</p>
                    </td>
                    <td className="px-4 py-3 text-[11px] text-gray-600">{order.className || '—'}</td>
                    <td className="px-4 py-3 text-sm font-black">{order.quantity} <span className="text-[10px] font-normal text-gray-400">áo</span></td>
                    <td className="px-4 py-3 text-[10px] font-mono text-gray-500">{order.size || '—'}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1.5">
                        {/* eslint-disable-next-line react/forbid-component-props */}
                        <div className="w-4 h-4 rounded border border-gray-200 shrink-0" style={{ backgroundColor: order.color }} />
                        <span className="text-[10px] font-mono text-gray-400">{order.color}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-[11px] text-gray-400 font-mono">
                      {order.createdAt ? new Date(order.createdAt).toLocaleString('vi-VN') : '—'}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`text-[10px] font-black px-2 py-1 rounded-full ${STATUS_COLORS[order.status] || STATUS_COLORS.pending}`}>
                        {STATUS_LABELS[order.status] || STATUS_LABELS.pending}
                      </span>
                    </td>
                    <td className="px-4 py-3" onClick={e => e.stopPropagation()}>
                      <select
                        value={order.status}
                        disabled={updatingId === order.orderId}
                        onChange={e => handleStatusUpdate(order.orderId, e.target.value)}
                        aria-label="Cập nhật trạng thái đơn hàng"
                        className="text-[10px] font-black border border-gray-200 rounded-lg px-2 py-1 bg-white cursor-pointer hover:border-black transition-colors"
                      >
                        {VALID_STATUSES.map(s => (
                          <option key={s} value={s}>{STATUS_LABELS[s]}</option>
                        ))}
                      </select>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </main>

      {/* ORDER DETAIL MODAL */}
      {selected && (
        <div className="fixed inset-0 z-[999] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4" onClick={() => setSelected(null)}>
          <div className="bg-white rounded-3xl max-w-3xl w-full shadow-2xl overflow-hidden" onClick={e => e.stopPropagation()}>
            <div className="bg-black text-white px-6 py-4 flex items-center justify-between">
              <div>
                <h2 className="text-sm font-black uppercase tracking-widest">Chi Tiết Đơn Hàng</h2>
                <p className="text-[10px] text-gray-400 font-mono mt-0.5">
                  {selected.customerName} — {selected.createdAt ? new Date(selected.createdAt).toLocaleString('vi-VN') : ''}
                </p>
              </div>
              <button onClick={() => setSelected(null)} type="button" className="text-gray-400 hover:text-white text-xl">✕</button>
            </div>

            <div className="p-6">
              {/* Design previews: front + back side by side */}
              <div className="grid grid-cols-2 gap-4 mb-6">
                <div>
                  <p className="text-[9px] font-black uppercase tracking-widest text-gray-400 mb-2">Mặt trước</p>
                  {selected.frontDesignUrl ? (
                    <div className="relative w-full aspect-[5/6] rounded-2xl overflow-hidden border border-gray-200 bg-gray-50">
                      <Image src={selected.frontDesignUrl} alt="front design" fill className="object-contain p-2" unoptimized />
                    </div>
                  ) : (
                    <div className="w-full aspect-[5/6] rounded-2xl border border-dashed border-gray-200 bg-gray-50 flex items-center justify-center">
                      <span className="text-[10px] text-gray-300 font-mono">Không có thiết kế</span>
                    </div>
                  )}
                  {selected.frontDesignUrl && (
                    <a href={selected.frontDesignUrl} download
                      className="mt-2 w-full block text-center py-2 bg-black text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-gray-900 transition-colors">
                      ↓ Tải mặt trước
                    </a>
                  )}
                </div>
                <div>
                  <p className="text-[9px] font-black uppercase tracking-widest text-gray-400 mb-2">Mặt sau</p>
                  {selected.backDesignUrl ? (
                    <div className="relative w-full aspect-[5/6] rounded-2xl overflow-hidden border border-gray-200 bg-gray-50">
                      <Image src={selected.backDesignUrl} alt="back design" fill className="object-contain p-2" unoptimized />
                    </div>
                  ) : (
                    <div className="w-full aspect-[5/6] rounded-2xl border border-dashed border-gray-200 bg-gray-50 flex items-center justify-center">
                      <span className="text-[10px] text-gray-300 font-mono">Không có thiết kế</span>
                    </div>
                  )}
                  {selected.backDesignUrl && (
                    <a href={selected.backDesignUrl} download
                      className="mt-2 w-full block text-center py-2 bg-black text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-gray-900 transition-colors">
                      ↓ Tải mặt sau
                    </a>
                  )}
                </div>
              </div>

              {/* Order info */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-3">
                  {([
                    ['Họ tên', selected.customerName],
                    ['Điện thoại', selected.phone],
                    ['Địa chỉ', selected.address],
                    ['Lớp/Trường', selected.className],
                    ['Ghi chú', selected.notes],
                  ] as [string, string | undefined][]).map(([label, val]) => val ? (
                    <div key={label}>
                      <p className="text-[9px] font-black uppercase tracking-widest text-gray-400">{label}</p>
                      <p className="text-sm font-medium text-gray-900">{val}</p>
                    </div>
                  ) : null)}
                </div>
                <div className="bg-gray-50 rounded-2xl p-4">
                  <p className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-3">Thông tin đơn hàng</p>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-[10px] text-gray-500">Số lượng</span>
                      <span className="text-sm font-black">{selected.quantity} áo</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-[10px] text-gray-500">Size</span>
                      <span className="text-[11px] font-mono">{selected.size || '—'}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-[10px] text-gray-500">Màu áo</span>
                      <div className="flex items-center gap-1.5">
                        {/* eslint-disable-next-line react/forbid-component-props */}
                        <div className="w-4 h-4 rounded border border-gray-200" style={{ backgroundColor: selected.color }} />
                        <span className="text-[10px] font-mono">{selected.color}</span>
                      </div>
                    </div>
                    <div className="flex justify-between items-center pt-2 border-t border-gray-200">
                      <span className="text-[10px] text-gray-500">Trạng thái</span>
                      <select
                        value={selected.status}
                        disabled={updatingId === selected.orderId}
                        onChange={e => {
                          handleStatusUpdate(selected.orderId, e.target.value);
                          setSelected(prev => prev ? { ...prev, status: e.target.value as Order['status'] } : null);
                        }}
                        aria-label="Cập nhật trạng thái đơn hàng"
                        className="text-[10px] font-black border border-gray-200 rounded-lg px-2 py-1 bg-white cursor-pointer"
                      >
                        {VALID_STATUSES.map(s => (
                          <option key={s} value={s}>{STATUS_LABELS[s]}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="px-6 pb-6">
              <button onClick={() => setSelected(null)}
                className="w-full py-2.5 border border-gray-200 rounded-2xl text-[11px] font-black uppercase tracking-widest hover:border-black transition-colors">
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
