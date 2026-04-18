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
  shirtType?: string;
  sleeveColor?: string;
  collarColor?: string;
}

const STATUS_MAP: Record<string, { label: string; color: string; bg: string }> = {
  pending: { label: "Đơn mới", color: "#7c3aed", bg: "#f0edff" },
  confirmed: { label: "Đang xử lý", color: "#f59e0b", bg: "#fffbeb" },
  manufacturing: { label: "Đang in", color: "#3b82f6", bg: "#eff6ff" },
  completed: { label: "Hoàn thành", color: "#10b981", bg: "#ecfdf5" },
};

function DesignImage({ src, alt }: { src: string; alt: string }) {
  const [imgUrl, setImgUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const userData = sessionStorage.getItem("user");
    const token = userData ? JSON.parse(userData).token : null;
    let localUrl = "";

    fetch(src, {
      headers: token ? { "Authorization": `Bearer ${token}` } : {}
    })
      .then(res => res.blob())
      .then(blob => {
        localUrl = URL.createObjectURL(blob);
        setImgUrl(localUrl);
        setLoading(false);
      })
      .catch(() => setLoading(false));

    return () => {
      if (localUrl) URL.revokeObjectURL(localUrl);
    };
  }, [src]);

  if (loading) return <div className="mfr-spinner-small" />;
  if (!imgUrl) return <div className="text-red-500 text-[10px]">Lỗi tải ảnh</div>;

  // eslint-disable-next-line @next/next/no-img-element
  return <img src={imgUrl} alt={alt} />;
}

const COLOR_NAMES: Record<string, string> = {
  "#ffffff": "Trắng", "#1a1a1a": "Đen", "#1a1a2e": "Tím đen",
  "#6b7280": "Xám", "#ef4444": "Đỏ", "#3b82f6": "Xanh dương",
  "#22c55e": "Xanh lá", "#8b5cf6": "Tím", "#6c5ce7": "Tím UniSpace",
  "#ec4899": "Hồng", "#e84393": "Hồng đậm", "#f59e0b": "Vàng",
  "#00b894": "Xanh ngọc", "#fdcb6e": "Vàng nhạt", "#f57f17": "Cam",
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
    const userData = sessionStorage.getItem("user");
    const token = userData ? JSON.parse(userData).token : null;

    fetch(`/api/orders/${id}`, {
      headers: token ? { "Authorization": `Bearer ${token}` } : {}
    })
      .then((res) => {
        if (res.status === 401) throw new Error("Unauthorized — Vui lòng đăng nhập để xem đơn hàng");
        if (!res.ok) throw new Error("Order not found");
        return res.json();
      })
      .then((data) => setOrder(data))
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [id]);

  const handleDownload = async (file: string) => {
    try {
      const userData = sessionStorage.getItem("user");
      const token = userData ? JSON.parse(userData).token : null;

      const res = await fetch(`/api/orders/${id}/${file}?dl=1`, {
        headers: token ? { "Authorization": `Bearer ${token}` } : {}
      });
      if (res.status === 401) {
        alert("Bạn cần đăng nhập để tải file.");
        return;
      }
      if (!res.ok) {
        alert("Không thể tải file. Vui lòng thử lại.");
        return;
      }
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${id}_${file}`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch {
      alert("Lỗi tải file.");
    }
  };

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
          <Link href="/dashboard" className="mfr-logo-link">
            <Logo scale={0.6} />
            <span className="mfr-label">Nhà sản xuất</span>
          </Link>
          <div className="mfr-header-right">
            <Link href="/dashboard" className="mfr-back-btn">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="15 18 9 12 15 6" /></svg>
              Quay lại
            </Link>
            <style>{`.mfr-st-badge{background:${st.bg};color:${st.color}} .mfr-st-dot{background:${st.color}}`}</style>
            <div className="mfr-status-badge mfr-st-badge">
              <span className="mfr-status-dot mfr-st-dot" />
              {st.label}
            </div>
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
            {new Date(order.createdAt).toLocaleDateString("vi-VN", {
              year: "numeric", month: "long", day: "numeric",
              hour: "2-digit", minute: "2-digit",
            })}
          </div>
        </div>

        <div className="mfr-grid">
          {/* Design Preview — Shirt Mockups */}
          <div className="mfr-card mfr-design-card">
            <h3 className="mfr-card-title">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--accent)" strokeWidth="2"><rect x="3" y="3" width="18" height="18" rx="2" /><circle cx="8.5" cy="8.5" r="1.5" /><polyline points="21 15 16 10 5 21" /></svg>
              Bản thiết kế
            </h3>

            {/* Design image previews */}
            <div className="mfr-mockup-grid">
              <div className="mfr-mockup-slot">
                <span className="mfr-design-label">Mặt trước</span>
                {order.hasFrontDesign ? (
                  <div className="mfr-design-preview">
                    <DesignImage src={`/api/orders/${order.orderId}/front_design.png`} alt="Front design" />
                  </div>
                ) : (
                  <div className="mfr-design-empty">
                    <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#ccc" strokeWidth="1.5"><rect x="3" y="3" width="18" height="18" rx="2" /><circle cx="8.5" cy="8.5" r="1.5" /><polyline points="21 15 16 10 5 21" /></svg>
                    <span>Không có thiết kế</span>
                  </div>
                )}
                {order.hasFrontDesign && (
                  <button onClick={() => handleDownload("front_design.png")} className="mfr-download-btn">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4" /><polyline points="7 10 12 15 17 10" /><line x1="12" y1="15" x2="12" y2="3" /></svg>
                    Tải mặt trước
                  </button>
                )}
              </div>
              <div className="mfr-mockup-slot">
                <span className="mfr-design-label">Mặt sau</span>
                {order.hasBackDesign ? (
                  <div className="mfr-design-preview">
                    <DesignImage src={`/api/orders/${order.orderId}/back_design.png`} alt="Back design" />
                  </div>
                ) : (
                  <div className="mfr-design-empty">
                    <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#ccc" strokeWidth="1.5"><rect x="3" y="3" width="18" height="18" rx="2" /><circle cx="8.5" cy="8.5" r="1.5" /><polyline points="21 15 16 10 5 21" /></svg>
                    <span>Không có thiết kế</span>
                  </div>
                )}
                {order.hasBackDesign && (
                  <button onClick={() => handleDownload("back_design.png")} className="mfr-download-btn">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4" /><polyline points="7 10 12 15 17 10" /><line x1="12" y1="15" x2="12" y2="3" /></svg>
                    Tải mặt sau
                  </button>
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
                {order.shirtType && (
                  <div className="mfr-info-row">
                    <span>Loại áo</span>
                    <strong>
                      {order.shirtType === "polo-a1" ? "Polo A1" : 
                       order.shirtType === "polo-d5" ? "Polo D5" : 
                       order.shirtType === "raglan" ? "Raglan" : "Áo thun"}
                    </strong>
                  </div>
                )}
                {order.sleeveColor && order.sleeveColor !== order.color && (
                  <div className="mfr-info-row">
                    <span>Màu tay áo</span>
                    <div className="mfr-color-val">
                      <style>{`.mfr-s-dot{background:${order.sleeveColor};border:${order.sleeveColor === '#ffffff' ? '1px solid #ddd' : 'none'}}`}</style>
                      <span className="mfr-color-dot mfr-s-dot" />
                      <strong>{COLOR_NAMES[order.sleeveColor] || order.sleeveColor}</strong>
                    </div>
                  </div>
                )}
                {order.collarColor && order.collarColor !== order.color && (
                  <div className="mfr-info-row">
                    <span>Màu cổ áo</span>
                    <div className="mfr-color-val">
                      <style>{`.mfr-c-dot{background:${order.collarColor};border:${order.collarColor === '#ffffff' ? '1px solid #ddd' : 'none'}}`}</style>
                      <span className="mfr-color-dot mfr-c-dot" />
                      <strong>{COLOR_NAMES[order.collarColor] || order.collarColor}</strong>
                    </div>
                  </div>
                )}
              </div>
              {order.notes && (
                <div className="mfr-notes">
                  <span className="mfr-notes-label">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" /><polyline points="14 2 14 8 20 8" /><line x1="16" y1="13" x2="8" y2="13" /><line x1="16" y1="17" x2="8" y2="17" /></svg>
                    Ghi chú
                  </span>
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
