"use client";

import { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Logo } from "@/components/Logo";

interface User {
  id: string; email: string; firstName: string; lastName: string; admin: boolean;
}
interface Order {
  orderId: string; customerName: string; phone: string; email: string;
  address: string; size: string; color: string; quantity: number;
  notes: string; createdAt: string; status: string;
  hasFrontDesign?: boolean; hasBackDesign?: boolean;
  frontDesignUrl?: string; backDesignUrl?: string;
}

const STATUS_COLUMNS = [
  { key: "pending",       label: "Đơn mới",      icon: "📥", color: "#6c5ce7", bg: "#f0edff" },
  { key: "confirmed",     label: "Đang xử lý",   icon: "⚙️", color: "#f59e0b", bg: "#fffbeb" },
  { key: "manufacturing", label: "Đang in",       icon: "🖨️", color: "#3b82f6", bg: "#eff6ff" },
  { key: "completed",     label: "Hoàn thành",    icon: "✅", color: "#10b981", bg: "#ecfdf5" },
];



export default function DashboardPage() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState<"kanban" | "table">("kanban");
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [draggedOrder, setDraggedOrder] = useState<string | null>(null);
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  useEffect(() => {
    const userData = sessionStorage.getItem("user");
    if (!userData) { router.push("/login"); return; }
    setUser(JSON.parse(userData));
    loadOrders();
  }, [router]);

  const loadOrders = async () => {
    try {
      const res = await fetch("/api/orders");
      if (res.ok) {
        const data = await res.json();
        setOrders(data.orders || []);
      }
    } catch (err) {
      console.error("Load orders error:", err);
    } finally {
      setLoading(false);
    }
  };

  // Stats
  const stats = useMemo(() => {
    const today = new Date().toDateString();
    const todayOrders = orders.filter(o => new Date(o.createdAt).toDateString() === today);
    const revenue = orders.reduce((s, o) => s + (o.quantity * 89000), 0);
    const totalShirts = orders.reduce((s, o) => s + (o.quantity || 1), 0);
    const pending = orders.filter(o => (o.status || "pending") === "pending").length;
    return { total: orders.length, today: todayOrders.length, revenue, totalShirts, pending };
  }, [orders]);

  // Revenue chart data — last 7 days
  const chartData = useMemo(() => {
    const days: { label: string; revenue: number; count: number }[] = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const dateStr = d.toDateString();
      const dayOrders = orders.filter(o => new Date(o.createdAt).toDateString() === dateStr);
      days.push({
        label: d.toLocaleDateString("vi-VN", { weekday: "short" }),
        revenue: dayOrders.reduce((s, o) => s + o.quantity * 89000, 0),
        count: dayOrders.length,
      });
    }
    return days;
  }, [orders]);

  const maxRevenue = Math.max(...chartData.map(d => d.revenue), 1);

  // Filtered orders
  const filtered = useMemo(() => orders.filter(o => {
    const matchSearch = !search || [o.customerName, o.phone, o.orderId, o.email]
      .some(v => v?.toLowerCase().includes(search.toLowerCase()));
    const matchStatus = filterStatus === "all" || (o.status || "pending") === filterStatus;
    return matchSearch && matchStatus;
  }), [orders, search, filterStatus]);

  // Status change
  const handleStatusChange = async (orderId: string, newStatus: string) => {
    setUpdatingId(orderId);
    const prev = orders;
    setOrders(cur => cur.map(o => o.orderId === orderId ? { ...o, status: newStatus } : o));
    try {
      const res = await fetch(`/api/orders/${orderId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });
      if (!res.ok) throw new Error();
    } catch {
      setOrders(prev);
      alert("Không thể cập nhật trạng thái.");
    } finally {
      setUpdatingId(null);
    }
  };

  const handleDragStart = (id: string) => setDraggedOrder(id);
  const handleDragEnd = () => setDraggedOrder(null);
  const handleDragOver = (e: React.DragEvent) => { e.preventDefault(); e.dataTransfer.dropEffect = "move"; };
  const handleDrop = (e: React.DragEvent, status: string) => {
    e.preventDefault();
    if (draggedOrder) handleStatusChange(draggedOrder, status);
    setDraggedOrder(null);
  };

  const handleLogout = () => { sessionStorage.removeItem("user"); router.push("/login"); };

  const formatMoney = (n: number) => n >= 1_000_000
    ? `${(n / 1_000_000).toFixed(1)}M`
    : `${(n / 1000).toFixed(0)}K`;

  if (!user) return null;

  return (
    <div className="dash-layout">
      {/* ═════ Sidebar ═════ */}
      <aside className="dash-sidebar">
        <div className="dash-sidebar-top">
          <Link href="/" className="dash-logo" style={{ textDecoration: 'none' }}><Logo scale={0.45} /></Link>
        </div>
        <nav className="dash-nav">
          <button className="dash-nav-item active" title="Dashboard">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
              <rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/>
              <rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/>
            </svg>
          </button>
          <Link href="/design" className="dash-nav-item" title="Thiết kế">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
              <path d="M12 19l7-7 3 3-7 7-3-3z"/><path d="M18 13l-1.5-7.5L2 2l3.5 14.5L13 18l5-5z"/>
              <circle cx="11" cy="11" r="2"/>
            </svg>
          </Link>
          <a href="https://www.facebook.com/UniSpace.TramInAo" target="_blank" rel="noopener noreferrer" className="dash-nav-item" title="Facebook">
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

      {/* ═════ Main ═════ */}
      <main className="dash-main">

        {/* Header */}
        <header className="dash-header">
          <div>
            <h1 className="dash-title">Admin Panel</h1>
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
          {[
            { icon: "📦", label: "Tổng đơn",      value: stats.total,                   color: "purple" },
            { icon: "🆕", label: "Hôm nay",        value: stats.today,                   color: "blue"   },
            { icon: "⏳", label: "Chờ xử lý",      value: stats.pending,                 color: "orange" },
            { icon: "👕", label: "Tổng áo",         value: stats.totalShirts,             color: "green"  },
            { icon: "💰", label: "Doanh thu (VNĐ)", value: formatMoney(stats.revenue),    color: "teal"   },
          ].map(s => (
            <div key={s.label} className="dash-stat-card">
              <div className="dash-stat-icon" data-color={s.color}>{s.icon}</div>
              <div>
                <span className="dash-stat-value">{s.value}</span>
                <span className="dash-stat-label">{s.label}</span>
              </div>
            </div>
          ))}
        </div>

        {/* Revenue Chart */}
        <div className="admin-chart-card">
          <div className="admin-chart-header">
            <span className="admin-chart-title">Doanh thu 7 ngày</span>
            <span className="admin-chart-total">{formatMoney(stats.revenue)} VNĐ</span>
          </div>

          {/* Dynamic styles: chart bars + colour swatches */}
          <style dangerouslySetInnerHTML={{ __html:
            [
              ...chartData.map((d, i) =>
                `.bar-${i}{height:${Math.round((d.revenue / maxRevenue) * 100)}%}`
              ),
              ...orders.map(o =>
                `.sc-${o.orderId.replace(/\W/g,'_')}{background:${o.color}}`
              ),
            ].join('')
          }} />

          <div className="admin-chart-bars">
            {chartData.map((d, i) => (
              <div key={i} className="admin-chart-bar-col">
                <div className="admin-chart-bar-wrap">
                  <div
                    className={`admin-chart-bar bar-${i}`}
                    title={`${d.label}: ${formatMoney(d.revenue)} VNĐ (${d.count} đơn)`}
                  />
                </div>
                <span className="admin-chart-day">{d.label}</span>
                {d.count > 0 && <span className="admin-chart-count">{d.count}</span>}
              </div>
            ))}
          </div>
        </div>

        {/* Toolbar */}
        <div className="admin-toolbar">
          <div className="admin-search-wrap">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="admin-search-icon">
              <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
            </svg>
            <input
              className="admin-search"
              placeholder="Tìm theo tên, SĐT, mã đơn…"
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>

          <select
            aria-label="Lọc theo trạng thái"
            className="admin-filter-select"
            value={filterStatus}
            onChange={e => setFilterStatus(e.target.value)}
          >
            <option value="all">Tất cả trạng thái</option>
            {STATUS_COLUMNS.map(c => (
              <option key={c.key} value={c.key}>{c.icon} {c.label}</option>
            ))}
          </select>

          <div className="admin-view-toggle">
            <button className={`admin-view-btn ${view === "kanban" ? "active" : ""}`} onClick={() => setView("kanban")} title="Kanban">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <rect x="3" y="3" width="5" height="18" rx="1"/><rect x="10" y="3" width="5" height="18" rx="1"/><rect x="17" y="3" width="4" height="18" rx="1"/>
              </svg>
            </button>
            <button className={`admin-view-btn ${view === "table" ? "active" : ""}`} onClick={() => setView("table")} title="Bảng">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="18" x2="21" y2="18"/>
              </svg>
            </button>
          </div>

          <button onClick={loadOrders} className="admin-refresh-btn" title="Làm mới">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <polyline points="23 4 23 10 17 10"/><path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"/>
            </svg>
          </button>
        </div>

        {/* Content */}
        {loading ? (
          <div className="dash-loading"><div className="dash-spinner"/><p>Đang tải đơn hàng…</p></div>
        ) : filtered.length === 0 ? (
          <div className="dash-empty">
            <span className="dash-empty-icon">{search ? "🔍" : "📭"}</span>
            <h3>{search ? "Không tìm thấy đơn nào" : "Chưa có đơn hàng"}</h3>
            <p>{search ? `Không có kết quả cho "${search}"` : "Đơn hàng sẽ hiện ở đây khi khách đặt"}</p>
            {!search && <Link href="/design" className="dash-btn-new">Tạo thiết kế mẫu</Link>}
          </div>
        ) : view === "kanban" ? (

          /* ── KANBAN ── */
          <div className="dash-columns">
            {STATUS_COLUMNS.map(col => {
              const colOrders = filtered.filter(o => (o.status || "pending") === col.key);
              return (
                <div key={col.key} className="dash-column" onDragOver={handleDragOver} onDrop={e => handleDrop(e, col.key)}>
                  <div
                    className="dash-column-header"
                    data-col={col.key}
                  >
                    <span className="dash-column-icon">{col.icon}</span>
                    <span className="dash-column-title">{col.label}</span>
                    <span className="dash-column-count" data-col={col.key}>{colOrders.length}</span>
                  </div>
                  <div className="dash-column-body">
                    {colOrders.map(order => (
                      <div
                        key={order.orderId}
                        className={`dash-order-card ${draggedOrder === order.orderId ? "dragging" : ""} ${updatingId === order.orderId ? "updating" : ""}`}
                        draggable
                        onDragStart={() => handleDragStart(order.orderId)}
                        onDragEnd={handleDragEnd}
                      >
                        <div className="dash-order-top">
                          <span className="dash-order-id">{order.orderId.slice(4, 16)}</span>
                          <Link href={`/manufacturer/${order.orderId}`} className="dash-order-link" title="Xem chi tiết">
                            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/></svg>
                          </Link>
                        </div>
                        <p className="dash-order-name">{order.customerName}</p>
                        <p className="admin-order-phone">{order.phone}</p>
                        <div className="dash-order-meta">
                          <span className="admin-size-badge">Size {order.size}</span>
                          <span className="admin-qty-badge">×{order.quantity}</span>
                        </div>
                        <div className="admin-order-footer">
                          <span className="dash-order-date">{new Date(order.createdAt).toLocaleDateString("vi-VN")}</span>
                          <select
                            aria-label="Trạng thái đơn hàng"
                            className="admin-status-select"
                            value={order.status || "pending"}
                            data-status={order.status || "pending"}
                            onChange={e => handleStatusChange(order.orderId, e.target.value)}
                            onClick={e => e.stopPropagation()}
                          >
                            {STATUS_COLUMNS.map(s => <option key={s.key} value={s.key}>{s.label}</option>)}
                            <option value="cancelled">❌ Huỷ</option>
                          </select>
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

        ) : (

          /* ── TABLE ── */
          <div className="admin-table-wrap">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Mã đơn</th>
                  <th>Khách hàng</th>
                  <th>SĐT</th>
                  <th>Size</th>
                  <th>Màu</th>
                  <th>SL</th>
                  <th>Doanh thu</th>
                  <th>Ngày đặt</th>
                  <th>Trạng thái</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {filtered.map(order => {
                  return (
                    <tr key={order.orderId} className={updatingId === order.orderId ? "updating" : ""}>
                      <td><span className="admin-table-id">{order.orderId.slice(4, 16)}</span></td>
                      <td>
                        <div className="admin-table-customer">
                          <span className="admin-table-name">{order.customerName}</span>
                          {order.email && <span className="admin-table-email">{order.email}</span>}
                        </div>
                      </td>
                      <td className="admin-table-phone">{order.phone}</td>
                      <td><span className="admin-size-badge">{order.size}</span></td>
                      <td>
                        <div className="admin-color-cell">
                          <span
                            className={`admin-color-swatch sc-${order.orderId.replace(/\W/g,'_')}`}
                          />
                        </div>
                      </td>
                      <td className="admin-table-qty">×{order.quantity}</td>
                      <td className="admin-table-revenue">{formatMoney(order.quantity * 89000)}</td>
                      <td className="admin-table-date">{new Date(order.createdAt).toLocaleDateString("vi-VN")}</td>
                      <td>
                        <select
                          aria-label="Trạng thái đơn hàng"
                          className="admin-status-select"
                          value={order.status || "pending"}
                          data-status={order.status || "pending"}
                          onChange={e => handleStatusChange(order.orderId, e.target.value)}
                        >
                          {STATUS_COLUMNS.map(s => <option key={s.key} value={s.key}>{s.label}</option>)}
                          <option value="cancelled">Huỷ</option>
                        </select>
                      </td>
                      <td>
                        <Link href={`/manufacturer/${order.orderId}`} className="admin-table-action">
                          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
                        </Link>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
              <tfoot>
                <tr>
                  <td colSpan={6} className="admin-table-footer-label">Tổng ({filtered.length} đơn)</td>
                  <td className="admin-table-footer-total">
                    {formatMoney(filtered.reduce((s, o) => s + o.quantity * 89000, 0))}
                  </td>
                  <td colSpan={3}/>
                </tr>
              </tfoot>
            </table>
          </div>
        )}
      </main>
    </div>
  );
}
