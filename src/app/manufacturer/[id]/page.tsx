"use client";

import { useState, useEffect, use } from "react";
import Link from "next/link";

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

  const colorNames: Record<string, string> = {
    "#ffffff": "Trắng",
    "#1a1a1a": "Đen",
    "#6b7280": "Xám",
    "#ef4444": "Đỏ",
    "#3b82f6": "Xanh dương",
    "#22c55e": "Xanh lá",
    "#8b5cf6": "Tím",
    "#ec4899": "Hồng",
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="w-10 h-10 border-2 border-[var(--accent)] border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          <p className="text-sm text-[var(--muted)]">Đang tải đơn hàng...</p>
        </div>
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6">
        <div className="text-center">
          <div className="w-16 h-16 rounded-full bg-red-50 flex items-center justify-center mx-auto mb-4">
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="var(--danger)" strokeWidth="2">
              <circle cx="12" cy="12" r="10" />
              <line x1="15" y1="9" x2="9" y2="15" />
              <line x1="9" y1="9" x2="15" y2="15" />
            </svg>
          </div>
          <h1 className="text-xl font-bold mb-2">Không tìm thấy đơn hàng</h1>
          <p className="text-[var(--muted)] text-sm mb-4">
            Mã đơn hàng &quot;{id}&quot; không tồn tại hoặc đã bị xóa.
          </p>
          <Link href="/" className="btn-primary">Về trang chủ</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[var(--surface-hover)]">
      {/* Header */}
      <header className="bg-[var(--surface)] border-b border-[var(--border)] px-6 py-3">
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          <Link href="/" className="text-lg font-bold tracking-tight">
            <span className="text-[var(--accent)]">Uni</span>Space
            <span className="text-xs text-[var(--muted)] font-normal ml-2">Nhà sản xuất</span>
          </Link>
          <div className="flex items-center gap-2 px-3 py-1 bg-green-50 text-green-700 text-xs font-medium rounded-full">
            <span className="w-2 h-2 rounded-full bg-green-500" />
            Đơn hàng mới
          </div>
        </div>
      </header>

      <div className="max-w-5xl mx-auto px-6 py-10">
        {/* Order header */}
        <div className="flex items-start justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold">Chi tiết đơn hàng</h1>
            <p className="text-[var(--muted)] text-sm mt-1 font-mono">{order.orderId}</p>
          </div>
          <div className="text-right text-sm text-[var(--muted)]">
            <p>Ngày đặt: {new Date(order.createdAt).toLocaleDateString("vi-VN", {
              year: "numeric",
              month: "long",
              day: "numeric",
              hour: "2-digit",
              minute: "2-digit",
            })}</p>
          </div>
        </div>

        <div className="grid lg:grid-cols-2 gap-6">
          {/* Design Files */}
          <div className="bg-[var(--surface)] rounded-[var(--radius-xl)] border border-[var(--border)] p-6">
            <h3 className="text-sm font-semibold mb-4 flex items-center gap-2">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--accent)" strokeWidth="2">
                <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
                <circle cx="8.5" cy="8.5" r="1.5" />
                <polyline points="21 15 16 10 5 21" />
              </svg>
              Bản thiết kế
            </h3>

            <div className="space-y-4">
              {/* Front Design */}
              <div className="border border-[var(--border)] rounded-[var(--radius)] p-4">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-sm font-medium">Mặt trước</span>
                  {order.hasFrontDesign ? (
                    <a
                      href={`/api/orders/${order.orderId}/front_design.png`}
                      download
                      className="btn-primary !text-xs !py-1.5 !px-3"
                    >
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                        <polyline points="7 10 12 15 17 10" />
                        <line x1="12" y1="15" x2="12" y2="3" />
                      </svg>
                      Tải PNG
                    </a>
                  ) : (
                    <span className="text-xs text-[var(--muted)]">Không có thiết kế</span>
                  )}
                </div>
                {order.hasFrontDesign && (
                  <div className="bg-[var(--surface-hover)] rounded-[var(--radius)] p-2">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={`/api/orders/${order.orderId}/front_design.png`}
                      alt="Front design"
                      className="w-full max-h-[300px] object-contain rounded"
                    />
                  </div>
                )}
              </div>

              {/* Back Design */}
              <div className="border border-[var(--border)] rounded-[var(--radius)] p-4">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-sm font-medium">Mặt sau</span>
                  {order.hasBackDesign ? (
                    <a
                      href={`/api/orders/${order.orderId}/back_design.png`}
                      download
                      className="btn-primary !text-xs !py-1.5 !px-3"
                    >
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                        <polyline points="7 10 12 15 17 10" />
                        <line x1="12" y1="15" x2="12" y2="3" />
                      </svg>
                      Tải PNG
                    </a>
                  ) : (
                    <span className="text-xs text-[var(--muted)]">Không có thiết kế</span>
                  )}
                </div>
                {order.hasBackDesign && (
                  <div className="bg-[var(--surface-hover)] rounded-[var(--radius)] p-2">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={`/api/orders/${order.orderId}/back_design.png`}
                      alt="Back design"
                      className="w-full max-h-[300px] object-contain rounded"
                    />
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Order Details */}
          <div className="space-y-6">
            {/* Customer Info */}
            <div className="bg-[var(--surface)] rounded-[var(--radius-xl)] border border-[var(--border)] p-6">
              <h3 className="text-sm font-semibold mb-4 flex items-center gap-2">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--accent)" strokeWidth="2">
                  <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                  <circle cx="12" cy="7" r="4" />
                </svg>
                Thông tin khách hàng
              </h3>

              <div className="space-y-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-[var(--muted)]">Họ tên</span>
                  <span className="font-medium">{order.customerName}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[var(--muted)]">Điện thoại</span>
                  <span className="font-medium">{order.phone}</span>
                </div>
                {order.email && (
                  <div className="flex justify-between">
                    <span className="text-[var(--muted)]">Email</span>
                    <span className="font-medium">{order.email}</span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span className="text-[var(--muted)]">Địa chỉ</span>
                  <span className="font-medium text-right max-w-[60%]">{order.address}</span>
                </div>
              </div>
            </div>

            {/* Product Details */}
            <div className="bg-[var(--surface)] rounded-[var(--radius-xl)] border border-[var(--border)] p-6">
              <h3 className="text-sm font-semibold mb-4 flex items-center gap-2">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--accent)" strokeWidth="2">
                  <path d="M20.38 3.46L16 2 12 5.5 8 2 3.62 3.46a2 2 0 0 0-1.34 1.88v13.72a2 2 0 0 0 1.34 1.88L8 22l4-3.5L16 22l4.38-1.46a2 2 0 0 0 1.34-1.88V5.34a2 2 0 0 0-1.34-1.88Z" />
                </svg>
                Chi tiết sản phẩm
              </h3>

              <div className="space-y-3 text-sm">
                <div className="flex justify-between items-center">
                  <span className="text-[var(--muted)]">Màu áo</span>
                  <div className="flex items-center gap-2">
                    <style>{`.order-color-dot-${order.orderId.replace(/[^a-z0-9]/gi, '')} { background-color: ${order.color}; border-color: ${order.color === '#ffffff' ? '#ddd' : 'transparent'}; }`}</style>
                    <span
                      className={`w-5 h-5 rounded-full border order-color-dot-${order.orderId.replace(/[^a-z0-9]/gi, '')}`}
                    />
                    <span className="font-medium">
                      {colorNames[order.color] || order.color}
                    </span>
                  </div>
                </div>
                <div className="flex justify-between">
                  <span className="text-[var(--muted)]">Size</span>
                  <span className="font-medium">{order.size}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[var(--muted)]">Số lượng</span>
                  <span className="font-medium">{order.quantity}</span>
                </div>
                {order.notes && (
                  <div className="pt-2 border-t border-[var(--border)]">
                    <span className="text-[var(--muted)] block mb-1">Ghi chú</span>
                    <p className="font-medium">{order.notes}</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
