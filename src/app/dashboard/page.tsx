"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  admin: boolean;
}

interface Order {
  orderId: string;
  customerName: string;
  phone: string;
  email: string;
  size: string;
  color: string;
  quantity: number;
  notes: string;
  createdAt: string;
  status: string;
}

// Status columns inspired by angular-app-master's sprint board
const STATUS_COLUMNS = [
  { key: "new", label: "Đơn mới", icon: "📥", color: "#6c5ce7" },
  { key: "processing", label: "Đang xử lý", icon: "⚙️", color: "#f59e0b" },
  { key: "printing", label: "Đang in", icon: "🖨️", color: "#3b82f6" },
  { key: "done", label: "Hoàn thành", icon: "✅", color: "#10b981" },
];

export default function DashboardPage() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [draggedOrder, setDraggedOrder] = useState<string | null>(null);
  const [stats, setStats] = useState({ total: 0, today: 0, revenue: 0 });

  useEffect(() => {
    // Check auth - like angular-app-master's authenticationRequired
    const userData = sessionStorage.getItem("user");
    if (!userData) {
      router.push("/login");
      return;
    }
    setUser(JSON.parse(userData));

    // Load orders
    loadOrders();
  }, [router]);

  const loadOrders = async () => {
    try {
      const res = await fetch("/api/orders");
      if (res.ok) {
        const data = await res.json();
        setOrders(data.orders || []);
        
        const today = new Date().toDateString();
        const todayOrders = (data.orders || []).filter(
          (o: Order) => new Date(o.createdAt).toDateString() === today
        );
        setStats({
          total: (data.orders || []).length,
          today: todayOrders.length,
          revenue: (data.orders || []).reduce((sum: number, o: Order) => sum + (o.quantity * 89000), 0),
        });
      }
    } catch (err) {
      console.error("Load orders error:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = (orderId: string, newStatus: string) => {
    setOrders((prev) =>
      prev.map((o) => (o.orderId === orderId ? { ...o, status: newStatus } : o))
    );
  };

  const handleDragStart = (orderId: string) => setDraggedOrder(orderId);
  const handleDragEnd = () => setDraggedOrder(null);
  const handleDragOver = (e: React.DragEvent) => { e.preventDefault(); e.dataTransfer.dropEffect = "move"; };
  const handleDrop = (e: React.DragEvent, status: string) => {
    e.preventDefault();
    if (draggedOrder) handleStatusChange(draggedOrder, status);
    setDraggedOrder(null);
  };

  const handleLogout = () => {
    sessionStorage.removeItem("user");
    router.push("/login");
  };

  const colorNames: Record<string, string> = {
    "#ffffff": "Trắng", "#1a1a1a": "Đen", "#6b7280": "Xám", "#1e3a5f": "Navy",
    "#ef4444": "Đỏ", "#3b82f6": "Xanh", "#22c55e": "Xanh lá", "#8b5cf6": "Tím",
    "#ec4899": "Hồng", "#f59e0b": "Vàng",
  };

  if (!user) return null;

  return (
    <div className="dash-layout">
      {/* ═══ Sidebar ═══ */}
      <aside className="dash-sidebar">
        <div className="dash-sidebar-top">
          <Link href="/" className="dash-logo">
            <span className="dash-logo-accent">U</span>S
          </Link>
        </div>

        <nav className="dash-nav">
          <a href="/dashboard" className="dash-nav-item active" title="Dashboard">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
              <rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/>
              <rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/>
            </svg>
          </a>
          <Link href="/design" className="dash-nav-item" title="Thiết kế">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
              <path d="M12 19l7-7 3 3-7 7-3-3z"/><path d="M18 13l-1.5-7.5L2 2l3.5 14.5L13 18l5-5z"/><path d="M2 2l7.586 7.586"/>
              <circle cx="11" cy="11" r="2"/>
            </svg>
          </Link>
          <a href="https://www.facebook.com/UniSpaceTramdongphuc" target="_blank" rel="noopener noreferrer" className="dash-nav-item" title="Facebook">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
              <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"/>
            </svg>
          </a>
        </nav>

        <div className="dash-sidebar-bottom">
          <button onClick={handleLogout} className="dash-nav-item" title="Đăng xuất">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
              <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/>
            </svg>
          </button>
        </div>
      </aside>

      {/* ═══ Main Content ═══ */}
      <main className="dash-main">
        {/* Header */}
        <header className="dash-header">
          <div>
            <h1 className="dash-title">Dashboard</h1>
            <p className="dash-subtitle">Xin chào, {user.firstName} {user.lastName} 👋</p>
          </div>
          <div className="dash-header-actions">
            <Link href="/design" className="dash-btn-new">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
              Tạo đơn mới
            </Link>
          </div>
        </header>

        {/* Stats */}
        <div className="dash-stats">
          <div className="dash-stat-card">
            <div className="dash-stat-icon" data-color="purple">📦</div>
            <div>
              <span className="dash-stat-value">{stats.total}</span>
              <span className="dash-stat-label">Tổng đơn</span>
            </div>
          </div>
          <div className="dash-stat-card">
            <div className="dash-stat-icon" data-color="blue">🆕</div>
            <div>
              <span className="dash-stat-value">{stats.today}</span>
              <span className="dash-stat-label">Đơn hôm nay</span>
            </div>
          </div>
          <div className="dash-stat-card">
            <div className="dash-stat-icon" data-color="green">💰</div>
            <div>
              <span className="dash-stat-value">{(stats.revenue / 1000).toFixed(0)}K</span>
              <span className="dash-stat-label">Doanh thu (VNĐ)</span>
            </div>
          </div>
          <div className="dash-stat-card">
            <div className="dash-stat-icon" data-color="orange">👕</div>
            <div>
              <span className="dash-stat-value">{orders.reduce((s, o) => s + (o.quantity || 1), 0)}</span>
              <span className="dash-stat-label">Tổng áo</span>
            </div>
          </div>
        </div>

        {/* Order Board - inspired by sprint board */}
        <div className="dash-board">
          <h2 className="dash-board-title">
            Bảng đơn hàng
            <span className="dash-board-hint">Kéo thả đơn để đổi trạng thái</span>
          </h2>

          {loading ? (
            <div className="dash-loading">
              <div className="dash-spinner" />
              <p>Đang tải đơn hàng...</p>
            </div>
          ) : orders.length === 0 ? (
            <div className="dash-empty">
              <span className="dash-empty-icon">📭</span>
              <h3>Chưa có đơn hàng nào</h3>
              <p>Đơn hàng sẽ hiển thị ở đây khi khách đặt hàng</p>
              <Link href="/design" className="dash-btn-new">Tạo thiết kế mẫu</Link>
            </div>
          ) : (
            <div className="dash-columns">
              {STATUS_COLUMNS.map((col) => {
                const colOrders = orders.filter((o) => (o.status || "new") === col.key);
                return (
                  <div
                    key={col.key}
                    className="dash-column"
                    onDragOver={handleDragOver}
                    onDrop={(e) => handleDrop(e, col.key)}
                  >
                    <div className="dash-column-header">
                      <span className="dash-column-icon">{col.icon}</span>
                      <span className="dash-column-title">{col.label}</span>
                      <span className="dash-column-count">{colOrders.length}</span>
                    </div>

                    <div className="dash-column-body">
                      {colOrders.map((order) => (
                        <div
                          key={order.orderId}
                          className={`dash-order-card ${draggedOrder === order.orderId ? "dragging" : ""}`}
                          draggable
                          onDragStart={() => handleDragStart(order.orderId)}
                          onDragEnd={handleDragEnd}
                        >
                          <div className="dash-order-top">
                            <span className="dash-order-id">{order.orderId.slice(0, 8)}</span>
                            <Link href={`/manufacturer/${order.orderId}`} className="dash-order-link" title="Xem chi tiết">
                              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/></svg>
                            </Link>
                          </div>
                          <p className="dash-order-name">{order.customerName}</p>
                          <div className="dash-order-meta">
                            <span className="dash-order-color">
                              <span className="dash-color-dot" data-bg={order.color} />
                              {colorNames[order.color] || "Custom"}
                            </span>
                            <span>Size {order.size}</span>
                            <span>×{order.quantity}</span>
                          </div>
                          <div className="dash-order-date">
                            {new Date(order.createdAt).toLocaleDateString("vi-VN")}
                          </div>
                        </div>
                      ))}
                      {colOrders.length === 0 && (
                        <div className="dash-column-empty">Kéo đơn vào đây</div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
