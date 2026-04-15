"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Logo } from "../../components/Logo";

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

const UNIT_PRICE = 89000;

const STATUS_COLUMNS = [
  { key: "pending",       label: "Đơn mới",      icon: "📥", accent: "#7c3aed" },
  { key: "confirmed",     label: "Xác nhận",      icon: "⚙️", accent: "#f59e0b" },
  { key: "manufacturing", label: "Đang in",       icon: "🖨️", accent: "#3b82f6" },
  { key: "completed",     label: "Hoàn thành",    icon: "✅", accent: "#10b981" },
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
  const [sideExpanded, setSideExpanded] = useState(false);

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
    const revenue = orders.reduce((s, o) => s + (o.quantity * UNIT_PRICE), 0);
    const totalShirts = orders.reduce((s, o) => s + (o.quantity || 1), 0);
    const pending = orders.filter(o => (o.status || "pending") === "pending").length;
    const completed = orders.filter(o => o.status === "completed").length;
    return { total: orders.length, today: todayOrders.length, revenue, totalShirts, pending, completed };
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
        revenue: dayOrders.reduce((s, o) => s + o.quantity * UNIT_PRICE, 0),
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
  const handleStatusChange = useCallback(async (orderId: string, newStatus: string) => {
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
  }, [orders]);

  const handleDragStart = (id: string) => setDraggedOrder(id);
  const handleDragEnd = () => setDraggedOrder(null);
  const handleDragOver = (e: React.DragEvent) => { e.preventDefault(); e.dataTransfer.dropEffect = "move"; };
  const handleDrop = (e: React.DragEvent, status: string) => {
    e.preventDefault();
    if (draggedOrder) handleStatusChange(draggedOrder, status);
    setDraggedOrder(null);
  };

  const handleLogout = () => { sessionStorage.removeItem("user"); router.push("/login"); };

  const fmtMoney = (n: number) => {
    if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
    if (n >= 1_000) return `${(n / 1000).toFixed(0)}K`;
    return String(n);
  };
  const fmtFull = (n: number) => n.toLocaleString("vi-VN") + "₫";

  if (!user) return null;

  const initials = `${user.firstName?.[0] || ""}${user.lastName?.[0] || ""}`.toUpperCase();

  return (
    <div className="adm">
      {/* Dynamic styles for chart bars + color swatches */}
      <style dangerouslySetInnerHTML={{ __html:
        [
          ...chartData.map((d, i) =>
            `.adm-bar-${i}{height:${Math.round((d.revenue / maxRevenue) * 100)}%}`
          ),
          ...orders.map(o =>
            `.adm-sw-${o.orderId.replace(/\W/g,'_')}{background:${o.color}}`
          ),
        ].join('')
      }} />

      {/* ═══ SIDEBAR ═══ */}
      <aside className={`adm-side ${sideExpanded ? "expanded" : ""}`}
        onMouseEnter={() => setSideExpanded(true)}
        onMouseLeave={() => setSideExpanded(false)}
      >
        <div className="adm-side-logo">
          <Link href="/" style={{ textDecoration: 'none', display: 'flex', alignItems: 'center' }}>
            <Logo scale={0.4} />
          </Link>
        </div>

        <nav className="adm-side-nav">
          <button className="adm-side-btn active" title="Dashboard">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="7" height="7" rx="1.5"/><rect x="14" y="3" width="7" height="7" rx="1.5"/><rect x="3" y="14" width="7" height="7" rx="1.5"/><rect x="14" y="14" width="7" height="7" rx="1.5"/></svg>
            <span className="adm-side-label">Dashboard</span>
          </button>
          <Link href="/design" className="adm-side-btn" title="Thiết kế">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 19l7-7 3 3-7 7-3-3z"/><path d="M18 13l-1.5-7.5L2 2l3.5 14.5L13 18l5-5z"/><circle cx="11" cy="11" r="2"/></svg>
            <span className="adm-side-label">Thiết kế</span>
          </Link>
          <Link href="/order" className="adm-side-btn" title="Đặt hàng">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z"/><line x1="3" y1="6" x2="21" y2="6"/><path d="M16 10a4 4 0 01-8 0"/></svg>
            <span className="adm-side-label">Đặt hàng</span>
          </Link>
        </nav>

        <div className="adm-side-footer">
          <div className="adm-avatar">{initials}</div>
          <button onClick={handleLogout} className="adm-side-btn" title="Đăng xuất">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>
            <span className="adm-side-label">Đăng xuất</span>
          </button>
        </div>
      </aside>

      {/* ═══ MAIN ═══ */}
      <main className="adm-main">
        {/* Header */}
        <header className="adm-head">
          <div>
            <p className="adm-head-greeting">Xin chào, {user.firstName} 👋</p>
            <h1 className="adm-head-title">Quản lý đơn hàng</h1>
          </div>
          <div className="adm-head-actions">
            <button onClick={loadOrders} className="adm-icon-btn" title="Làm mới">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="23 4 23 10 17 10"/><path d="M20.49 15a9 9 0 11-2.12-9.36L23 10"/></svg>
            </button>
            <Link href="/design" className="adm-primary-btn">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
              Tạo đơn mới
            </Link>
          </div>
        </header>

        {/* Stats Grid */}
        <div className="adm-stats">
          {[
            { label: "Tổng đơn",   val: stats.total,                     sub: `${stats.today} hôm nay`,          accent: "#7c3aed", icon: "📦" },
            { label: "Chờ xử lý",  val: stats.pending,                   sub: "cần xác nhận",                     accent: "#f59e0b", icon: "⏳" },
            { label: "Đã hoàn",    val: stats.completed,                 sub: `${stats.totalShirts} áo`,          accent: "#10b981", icon: "✅" },
            { label: "Doanh thu",  val: fmtMoney(stats.revenue) + "₫",   sub: fmtFull(stats.revenue),             accent: "#ec4899", icon: "💰" },
          ].map(s => (
            <div key={s.label} className="adm-stat">
              <div className="adm-stat-left">
                <span className="adm-stat-num">{s.val}</span>
                <span className="adm-stat-label">{s.label}</span>
                <span className="adm-stat-sub">{s.sub}</span>
              </div>
              <span className="adm-stat-icon">{s.icon}</span>
            </div>
          ))}
        </div>

        {/* Revenue Chart + Toolbar Row */}
        <div className="adm-row">
          <div className="adm-chart">
            <div className="adm-chart-head">
              <div>
                <span className="adm-chart-title">Doanh thu 7 ngày</span>
                <span className="adm-chart-total">{fmtFull(stats.revenue)}</span>
              </div>
            </div>
            <div className="adm-chart-bars">
              {chartData.map((d, i) => (
                <div key={i} className="adm-chart-col">
                  <div className="adm-chart-bar-wrap">
                    <div className={`adm-chart-bar adm-bar-${i}`}
                      title={`${d.label}: ${fmtFull(d.revenue)} (${d.count} đơn)`}
                    />
                  </div>
                  <span className="adm-chart-day">{d.label}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Quick Stats */}
          <div className="adm-quick">
            <div className="adm-quick-item">
              <span className="adm-quick-val">{fmtMoney(stats.totalShirts * UNIT_PRICE)}₫</span>
              <span className="adm-quick-label">Giá trị tổng</span>
            </div>
            <div className="adm-quick-item">
              <span className="adm-quick-val">{stats.totalShirts}</span>
              <span className="adm-quick-label">Tổng áo in</span>
            </div>
            <div className="adm-quick-item">
              <span className="adm-quick-val">{fmtMoney(UNIT_PRICE)}₫</span>
              <span className="adm-quick-label">Đơn giá / áo</span>
            </div>
          </div>
        </div>

        {/* Toolbar */}
        <div className="adm-toolbar">
          <div className="adm-search-box">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
            <input
              placeholder="Tìm tên, SĐT, mã đơn…"
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>
          <select
            aria-label="Lọc trạng thái"
            className="adm-select"
            value={filterStatus}
            onChange={e => setFilterStatus(e.target.value)}
          >
            <option value="all">Tất cả</option>
            {STATUS_COLUMNS.map(c => <option key={c.key} value={c.key}>{c.icon} {c.label}</option>)}
          </select>
          <div className="adm-toggle">
            <button className={view === "kanban" ? "on" : ""} onClick={() => setView("kanban")}>Board</button>
            <button className={view === "table" ? "on" : ""} onClick={() => setView("table")}>Table</button>
          </div>
        </div>

        {/* Content */}
        {loading ? (
          <div className="adm-loading"><div className="adm-spinner" /><p>Đang tải…</p></div>
        ) : filtered.length === 0 ? (
          <div className="adm-empty">
            <span>{search ? "🔍" : "📭"}</span>
            <h3>{search ? "Không tìm thấy" : "Chưa có đơn hàng"}</h3>
            <p>{search ? `Không có kết quả cho "${search}"` : "Đơn hàng sẽ hiện khi khách đặt"}</p>
          </div>
        ) : view === "kanban" ? (

          /* ── KANBAN ── */
          <div className="adm-kanban">
            {STATUS_COLUMNS.map(col => {
              const colOrders = filtered.filter(o => (o.status || "pending") === col.key);
              return (
                <div key={col.key} className="adm-col" onDragOver={handleDragOver} onDrop={e => handleDrop(e, col.key)}>
                  <div className="adm-col-head">
                    <span className="adm-col-dot" style={{ background: col.accent }} />
                    <span className="adm-col-label">{col.label}</span>
                    <span className="adm-col-count">{colOrders.length}</span>
                  </div>
                  <div className="adm-col-body">
                    {colOrders.map(order => (
                      <div
                        key={order.orderId}
                        className={`adm-card ${draggedOrder === order.orderId ? "drag" : ""} ${updatingId === order.orderId ? "busy" : ""}`}
                        draggable
                        onDragStart={() => handleDragStart(order.orderId)}
                        onDragEnd={handleDragEnd}
                      >
                        <div className="adm-card-top">
                          <code>{order.orderId.slice(-8)}</code>
                          <Link href={`/manufacturer/${order.orderId}`} className="adm-card-link" title="Chi tiết">↗</Link>
                        </div>
                        <p className="adm-card-name">{order.customerName}</p>
                        <p className="adm-card-phone">{order.phone}</p>
                        <div className="adm-card-tags">
                          <span className={`adm-swatch adm-sw-${order.orderId.replace(/\W/g,'_')}`} />
                          <span className="adm-tag size">{order.size}</span>
                          <span className="adm-tag qty">×{order.quantity}</span>
                          <span className="adm-tag revenue">{fmtMoney(order.quantity * UNIT_PRICE)}₫</span>
                        </div>
                        <div className="adm-card-foot">
                          <time>{new Date(order.createdAt).toLocaleDateString("vi-VN", { day: "2-digit", month: "2-digit" })}</time>
                          <select
                            aria-label="Trạng thái"
                            className="adm-status-sel"
                            value={order.status || "pending"}
                            data-st={order.status || "pending"}
                            onChange={e => handleStatusChange(order.orderId, e.target.value)}
                            onClick={e => e.stopPropagation()}
                          >
                            {STATUS_COLUMNS.map(s => <option key={s.key} value={s.key}>{s.label}</option>)}
                            <option value="cancelled">Huỷ</option>
                          </select>
                        </div>
                      </div>
                    ))}
                    {colOrders.length === 0 && (
                      <div className="adm-col-empty">Kéo đơn vào đây</div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

        ) : (

          /* ── TABLE ── */
          <div className="adm-tbl-wrap">
            <table className="adm-tbl">
              <thead>
                <tr>
                  <th>Mã đơn</th>
                  <th>Khách hàng</th>
                  <th>SĐT</th>
                  <th>Size</th>
                  <th>Màu</th>
                  <th>SL</th>
                  <th>Thành tiền</th>
                  <th>Ngày</th>
                  <th>Trạng thái</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {filtered.map(order => (
                  <tr key={order.orderId} className={updatingId === order.orderId ? "busy" : ""}>
                    <td><code>{order.orderId.slice(-8)}</code></td>
                    <td>
                      <strong>{order.customerName}</strong>
                      {order.email && <small>{order.email}</small>}
                    </td>
                    <td>{order.phone}</td>
                    <td><span className="adm-tag size">{order.size}</span></td>
                    <td><span className={`adm-swatch adm-sw-${order.orderId.replace(/\W/g,'_')}`} /></td>
                    <td className="adm-tbl-qty">×{order.quantity}</td>
                    <td className="adm-tbl-rev">{fmtFull(order.quantity * UNIT_PRICE)}</td>
                    <td className="adm-tbl-date">{new Date(order.createdAt).toLocaleDateString("vi-VN")}</td>
                    <td>
                      <select
                        aria-label="Trạng thái"
                        className="adm-status-sel"
                        value={order.status || "pending"}
                        data-st={order.status || "pending"}
                        onChange={e => handleStatusChange(order.orderId, e.target.value)}
                      >
                        {STATUS_COLUMNS.map(s => <option key={s.key} value={s.key}>{s.label}</option>)}
                        <option value="cancelled">Huỷ</option>
                      </select>
                    </td>
                    <td>
                      <Link href={`/manufacturer/${order.orderId}`} className="adm-tbl-eye" title="Xem">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr>
                  <td colSpan={6}>Tổng {filtered.length} đơn</td>
                  <td className="adm-tbl-rev">{fmtFull(filtered.reduce((s, o) => s + o.quantity * UNIT_PRICE, 0))}</td>
                  <td colSpan={3}></td>
                </tr>
              </tfoot>
            </table>
          </div>
        )}
      </main>
    </div>
  );
}
