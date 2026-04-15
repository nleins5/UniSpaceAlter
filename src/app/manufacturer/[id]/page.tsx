"use client";

import { useState, useEffect, use } from "react";
import Link from "next/link";
import { Logo } from "../../../components/Logo";

interface OrderData {
  orderId: string;
  customerName: string;
  phone: string;
  email: string;
  address: string;
  size: string;
  color: string;
  quantity: number;
  notes: string;
  createdAt: string;
  status: string;
  hasFrontDesign: boolean;
  hasBackDesign: boolean;
}

const STATUS_MAP: Record<string, { label: string; icon: string; color: string; bg: string }> = {
  pending: { label: "Đơn mới", icon: "📥", color: "#6c5ce7", bg: "#f0edff" },
  confirmed: { label: "Đang xử lý", icon: "⚙️", color: "#f59e0b", bg: "#fffbeb" },
  manufacturing: { label: "Đang in", icon: "🖨️", color: "#3b82f6", bg: "#eff6ff" },
  completed: { label: "Hoàn thành", icon: "✅", color: "#10b981", bg: "#ecfdf5" },
};

const COLOR_NAMES: Record<string, string> = {
  "#ffffff": "Trắng", "#1a1a1a": "Đen", "#1a1a2e": "Tím đen",
  "#6b7280": "Xám", "#ef4444": "Đỏ", "#3b82f6": "Xanh dương",
  "#22c55e": "Xanh lá", "#8b5cf6": "Tím", "#6c5ce7": "Tím UniSpace",
  "#ec4899": "Hồng", "#e84393": "Hồng đậm", "#f59e0b": "Vàng",
  "#00b894": "Xanh ngọc", "#fdcb6e": "Vàng nhạt",
};

export default function ManufacturerPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const [order, setOrder] = useState<OrderData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    fetch(`/api/orders/${id}`)
      .then((res) => {
        if (!res.ok) throw new Error("Order not found");
        return res.json();
      })
      .then((data) => setOrder(data))
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) {
    return (
      <div className="mfr-page">
        <div className="mfr-loading">
          <div className="mfr-spinner" />
          <p>Đang tải đơn hàng...</p>
        </div>
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="mfr-page">
        <div className="mfr-loading">
          <div className="mfr-error-icon">✕</div>
          <h1>Không tìm thấy đơn hàng</h1>
          <p>Mã đơn &quot;{id}&quot; không tồn tại hoặc đã bị xóa.</p>
          <Link href="/" className="btn-primary" style={{ marginTop: 16 }}>Về trang chủ</Link>
        </div>
      </div>
    );
  }

  const st = STATUS_MAP[order.status] || STATUS_MAP.pending;

  return (
    <div className="mfr-page">
      {/* Header */}
      <header className="mfr-header">
        <div className="mfr-header-inner">
          <Link href="/" className="mfr-logo-link">
            <Logo scale={0.6} />
            <span className="mfr-label">Nhà sản xuất</span>
          </Link>
          <style>{`.mfr-st-badge{background:${st.bg};color:${st.color}}`}</style>
          <div className="mfr-status-badge mfr-st-badge">
            <span className="mfr-status-dot" style={{ background: st.color }} />
            {st.icon} {st.label}
          </div>
        </div>
      </header>

      <main className="mfr-main">
        {/* Title */}
        <div className="mfr-title-row">
          <div>
            <h1 className="mfr-title">Chi tiết đơn hàng</h1>
            <p className="mfr-order-id">{order.orderId}</p>
          </div>
          <div className="mfr-date">
            Ngày đặt: {new Date(order.createdAt).toLocaleDateString("vi-VN", {
              year: "numeric", month: "long", day: "numeric",
              hour: "2-digit", minute: "2-digit",
            })}
          </div>
        </div>

        <div className="mfr-grid">
          {/* Design Files */}
          <div className="mfr-card">
            <h3 className="mfr-card-title">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--accent)" strokeWidth="2"><rect x="3" y="3" width="18" height="18" rx="2" /><circle cx="8.5" cy="8.5" r="1.5" /><polyline points="21 15 16 10 5 21" /></svg>
              Bản thiết kế
            </h3>

            <div className="mfr-design-grid">
              {/* Front */}
              <div className="mfr-design-slot">
                <div className="mfr-design-header">
                  <span className="mfr-design-label">Mặt trước</span>
                  {order.hasFrontDesign ? (
                    <a href={`/api/orders/${order.orderId}/front_design.png`} download className="mfr-download-btn">
                      ↓ Tải PNG
                    </a>
                  ) : (
                    <span className="mfr-no-design">Chưa có</span>
                  )}
                </div>
                {order.hasFrontDesign ? (
                  <div className="mfr-design-preview">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={`/api/orders/${order.orderId}/front_design.png`} alt="Front" />
                  </div>
                ) : (
                  <div className="mfr-design-empty">
                    <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#ccc" strokeWidth="1.5"><rect x="3" y="3" width="18" height="18" rx="2" /><circle cx="8.5" cy="8.5" r="1.5" /><polyline points="21 15 16 10 5 21" /></svg>
                    <span>Không có thiết kế</span>
                  </div>
                )}
              </div>

              {/* Back */}
              <div className="mfr-design-slot">
                <div className="mfr-design-header">
                  <span className="mfr-design-label">Mặt sau</span>
                  {order.hasBackDesign ? (
                    <a href={`/api/orders/${order.orderId}/back_design.png`} download className="mfr-download-btn">
                      ↓ Tải PNG
                    </a>
                  ) : (
                    <span className="mfr-no-design">Chưa có</span>
                  )}
                </div>
                {order.hasBackDesign ? (
                  <div className="mfr-design-preview">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={`/api/orders/${order.orderId}/back_design.png`} alt="Back" />
                  </div>
                ) : (
                  <div className="mfr-design-empty">
                    <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#ccc" strokeWidth="1.5"><rect x="3" y="3" width="18" height="18" rx="2" /><circle cx="8.5" cy="8.5" r="1.5" /><polyline points="21 15 16 10 5 21" /></svg>
                    <span>Không có thiết kế</span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Info cards */}
          <div className="mfr-info-col">
            {/* Customer */}
            <div className="mfr-card">
              <h3 className="mfr-card-title">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--accent)" strokeWidth="2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" /></svg>
                Thông tin khách hàng
              </h3>
              <div className="mfr-info-rows">
                <div className="mfr-info-row"><span>Họ tên</span><strong>{order.customerName}</strong></div>
                <div className="mfr-info-row"><span>Điện thoại</span><strong><a href={`tel:${order.phone}`}>{order.phone}</a></strong></div>
                {order.email && <div className="mfr-info-row"><span>Email</span><strong>{order.email}</strong></div>}
                <div className="mfr-info-row"><span>Địa chỉ</span><strong>{order.address}</strong></div>
              </div>
            </div>

            {/* Product */}
            <div className="mfr-card">
              <h3 className="mfr-card-title">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--accent)" strokeWidth="2"><path d="M12 3L4 7v2l3-1v11h10V8l3 1V7l-8-4z" /></svg>
                Chi tiết sản phẩm
              </h3>
              <div className="mfr-info-rows">
                <div className="mfr-info-row">
                  <span>Màu áo</span>
                  <div className="mfr-color-val">
                    <style>{`.mfr-cdot{background:${order.color};border:${order.color === '#ffffff' ? '1px solid #ddd' : 'none'}}`}</style>
                    <span className="mfr-color-dot mfr-cdot" />
                    <strong>{COLOR_NAMES[order.color] || order.color}</strong>
                  </div>
                </div>
                <div className="mfr-info-row"><span>Size</span><strong>{order.size}</strong></div>
                <div className="mfr-info-row">
                  <span>Số lượng</span>
                  <strong className="mfr-qty">{order.quantity} chiếc</strong>
                </div>
              </div>
              {order.notes && (
                <div className="mfr-notes">
                  <span className="mfr-notes-label">📝 Ghi chú</span>
                  <p>{order.notes}</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
