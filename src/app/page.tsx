"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { Logo } from "../components/Logo";

// Slider images (downloaded from tramdongphuc.com → public/images/slider/)
const sliderImages = [
  "/images/slider/1.jpeg",
  "/images/slider/2.jpeg",
  "/images/slider/3.jpeg",
  "/images/slider/4.jpeg",
];

// UniSpace product catalog images
const productImages = [
  { src: "/images/products/p1.png", label: "Phong cách Đen - Đỏ" },
  { src: "/images/products/p2.png", label: "Phong cách Trắng - Navy" },
  { src: "/images/products/p3.png", label: "Phong cách Cam" },
  { src: "/images/products/p4.png", label: "Phong cách Xanh - Vàng" },
  { src: "/images/products/p5.png", label: "Phong cách Xanh dương" },
  { src: "/images/products/p6.png", label: "Phong cách Hồng" },
];

export default function HomePage() {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [mobileSubMenuOpen, setMobileSubMenuOpen] = useState<string | null>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Auto slide
  useEffect(() => {
    intervalRef.current = setInterval(() => {
      setCurrentSlide((s) => (s + 1) % sliderImages.length);
    }, 4000);
    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, []);

  const goSlide = (idx: number) => {
    setCurrentSlide(idx);
    if (intervalRef.current) clearInterval(intervalRef.current);
    intervalRef.current = setInterval(() => {
      setCurrentSlide((s) => (s + 1) % sliderImages.length);
    }, 4000);
  };

  return (
    <div className="tdp-page">

      {/* ═══ HEADER TOP (White) ═══ */}
      <div className="tdp-header-top">
        <div className="tdp-container tdp-header-top-inner">
          <Link href="/" className="tdp-logo-link">
            <Logo scale={0.5} />
          </Link>

          <div className="tdp-search-box">
            <span className="tdp-search-icon">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
              </svg>
            </span>
            <input type="text" placeholder="Tìm kiếm..." className="tdp-search-input" />
          </div>

          <div className="tdp-top-links">
            <a href="https://www.facebook.com/UniSpace.TramInAo" target="_blank" rel="noopener noreferrer">Bản tin Unispace</a>
            <a href="https://www.facebook.com/UniSpace.TramInAo" target="_blank" rel="noopener noreferrer">Tuyển dụng</a>
            <a href="https://www.facebook.com/UniSpace.TramInAo" target="_blank" rel="noopener noreferrer">Liên hệ</a>
          </div>

          <button
            className="tdp-mobile-toggle"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            aria-label="Toggle menu"
          >
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="3" y1="6" x2="21" y2="6" /><line x1="3" y1="12" x2="21" y2="12" /><line x1="3" y1="18" x2="21" y2="18" />
            </svg>
          </button>
        </div>
      </div>

      {/* ═══ HEADER MENU (Black) ═══ */}
      <div className="tdp-header-menu">
        <div className="tdp-container">
          <nav className={`tdp-nav ${mobileMenuOpen ? "open" : ""}`}>
            {/* left nav */}
            <ul className="tdp-nav-left">
              <li className="tdp-nav-dropdown">
                <a
                  href="#"
                  onClick={(e) => { e.preventDefault(); setMobileSubMenuOpen(mobileSubMenuOpen === "tram" ? null : "tram"); }}
                >
                  Trạm đồng phục <span className="tdp-caret">▼</span>
                </a>
                <ul className={`tdp-dropdown-menu ${mobileSubMenuOpen === "tram" ? "open" : ""}`}>
                  <li><Link href="/design">Thiết kế</Link></li>
                  <li><a href="#pricing">Bảng giá</a></li>
                  <li><a href="#products">Bảng size</a></li>
                  <li><a href="#products">Bảng màu</a></li>
                  <li><a href="https://www.facebook.com/UniSpace.TramInAo" target="_blank" rel="noopener noreferrer">Feedback</a></li>
                </ul>
              </li>
              <li className="tdp-nav-dropdown">
                <a
                  href="#"
                  onClick={(e) => { e.preventDefault(); setMobileSubMenuOpen(mobileSubMenuOpen === "design" ? null : "design"); }}
                >
                  Thiết kế <span className="tdp-caret">▼</span>
                </a>
                <ul className={`tdp-dropdown-menu ${mobileSubMenuOpen === "design" ? "open" : ""}`}>
                  <li><Link href="/design">Tự thiết kế online</Link></li>
                  <li><a href="#pricing">Bảng giá</a></li>
                  <li><a href="#products">Bảng size</a></li>
                  <li><a href="#products">Bảng màu</a></li>
                  <li><a href="https://www.facebook.com/UniSpace.TramInAo" target="_blank" rel="noopener noreferrer">Feedback</a></li>
                </ul>
              </li>
            </ul>

            {/* right nav */}
            <ul className="tdp-nav-right">
              <li><a href="#pricing">Khuyến mãi &amp; Quà tặng</a></li>
              <li><a href="#why">Giao hàng &amp; Thanh toán</a></li>
              <li><a href="#why">FAQ</a></li>
              <li>
                <Link href="/login" className="tdp-nav-login">Đăng nhập</Link>
              </li>
            </ul>
          </nav>
        </div>
      </div>

      {/* ═══ HERO SLIDER ═══ */}
      <div className="tdp-slider">
        <div className="tdp-carousel">
          <div className="tdp-carousel-inner">
            {sliderImages.map((src, i) => (
              <div
                key={i}
                className={`tdp-carousel-item ${i === currentSlide ? "active" : ""}`}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={src} alt={`Banner ${i + 1}`} />
              </div>
            ))}
          </div>

          {/* Dots */}
          <div className="tdp-carousel-dots">
            {sliderImages.map((_, i) => (
              <button
                key={i}
                className={`tdp-dot ${i === currentSlide ? "active" : ""}`}
                onClick={() => goSlide(i)}
                aria-label={`Slide ${i + 1}`}
              />
            ))}
          </div>

          {/* Prev / Next */}
          <button
            className="tdp-carousel-btn tdp-carousel-prev"
            onClick={() => goSlide((currentSlide - 1 + sliderImages.length) % sliderImages.length)}
            aria-label="Trước"
          >
            ‹
          </button>
          <button
            className="tdp-carousel-btn tdp-carousel-next"
            onClick={() => goSlide((currentSlide + 1) % sliderImages.length)}
            aria-label="Tiếp"
          >
            ›
          </button>
        </div>
      </div>

      {/* ═══ MARQUEE AD LINE ═══ */}
      <div className="tdp-marquee-bar">
        <div className="tdp-container">
          <div className="tdp-marquee-track">
            <span>
              🎨 Thiết kế áo lớp, áo nhóm, áo công ty ⚡ In DTG chất lượng cao ✈️ Giao hàng toàn quốc &nbsp;&nbsp;&nbsp; 🎨 Thiết kế áo lớp, áo nhóm, áo công ty ⚡ In DTG chất lượng cao ✈️ Giao hàng toàn quốc &nbsp;&nbsp;&nbsp;
            </span>
          </div>
        </div>
      </div>

      {/* ═══ BỘ SƯU TẬP ÁO ═══ */}
      <div className="tdp-section" id="products">
        <div className="tdp-container">
          <div className="tdp-section-title center">
            <span className="tdp-dot-icon">●</span>&nbsp; Bộ sưu tập áo lớp UniSpace &nbsp;<span className="tdp-dot-icon">●</span>
          </div>
          <p className="tdp-catalog-desc">Hàng trăm mẫu thiết kế độc quyền. Nhấn vào mẫu bất kỳ để bắt đầu thiết kế online.</p>
          <div className="tdp-catalog-grid">
            {productImages.map((p, i) => (
              <Link key={i} href="/design" className="tdp-catalog-item">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={p.src} alt={p.label} />
                <div className="tdp-catalog-overlay">
                  <span>🎨 Thiết kế ngay</span>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </div>


      {/* ═══ CÁC BƯỚC ═══ */}
      <div className="tdp-section tdp-section-dark" id="why">
        <div className="tdp-container">
          <div className="tdp-section-title white">
            <span className="tdp-dot-icon">●</span> Các bước đặt hàng
          </div>
          <div className="tdp-steps-grid">
            {[
              { num: "01", title: "Gửi ý tưởng", desc: "Inbox Facebook hoặc tự thiết kế online. Gửi logo, slogan, tên lớp — chúng tôi tư vấn miễn phí." },
              { num: "02", title: "Duyệt mẫu & đặt hàng", desc: "Xem trước mockup trên áo thật. Chốt mẫu, chọn size, số lượng — thanh toán linh hoạt." },
              { num: "03", title: "Nhận áo tận nơi", desc: "In xong trong 3–5 ngày. Giao tận trường, công ty hoặc nhà — kiểm tra trước khi nhận." },
            ].map((step, i) => (
              <div key={i} className="tdp-step-card">
                <div className="tdp-step-num">{step.num}</div>
                <h3>{step.title}</h3>
                <p>{step.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ═══ ĐĂNG KÝ TƯ VẤN ═══ */}
      <div className="tdp-section" id="pricing">
        <div className="tdp-container tdp-consult-area">
          <div className="tdp-consult-left">
            <h2>Đăng ký tư vấn</h2>
            <p>Để lại thông tin, đội ngũ UniSpace sẽ liên hệ hỗ trợ bạn trong thời gian sớm nhất.</p>
          </div>
          <form className="tdp-consult-form" onSubmit={(e) => e.preventDefault()}>
            <input type="text" placeholder="Họ và tên" required />
            <input type="tel" placeholder="Số điện thoại" required />
            <input type="text" placeholder="Tên trường / Lớp / Công ty" />
            <textarea placeholder="Yêu cầu thiết kế..." rows={3} />
            <button type="submit" className="tdp-consult-btn">
              OK — Gửi yêu cầu
            </button>
          </form>
        </div>
      </div>

      {/* ═══ FOOTER ═══ */}
      <footer className="tdp-footer">
        <div className="tdp-container">
          <div className="tdp-footer-grid">
            <div className="tdp-footer-brand">
              <Logo scale={0.6} />
              <p>Trạm In Áo — Chuyên áo lớp, áo nhóm, áo công ty.<br />
                <a
                  href="https://www.google.com/maps/search/?api=1&query=647+T%E1%BA%A1+Quang+B%E1%BB%ADu,+P.5,+Q.8,+TP.+H%E1%BB%93+Ch%C3%AD+Minh"
                  target="_blank" rel="noopener noreferrer"
                  className="tdp-footer-address"
                >
                  📍 647 Tạ Quang Bửu, P.5, Q.8, TP. Hồ Chí Minh
                </a>
              </p>
              <div className="tdp-footer-socials">
                <a
                  href="https://www.facebook.com/UniSpace.TramInAo"
                  target="_blank" rel="noopener noreferrer"
                  className="tdp-footer-fb"
                >
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z" /></svg>
                  Facebook
                </a>
                <a
                  href="https://www.instagram.com/tramdongphuc/"
                  target="_blank" rel="noopener noreferrer"
                  className="tdp-footer-ig"
                >
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="2" width="20" height="20" rx="5" ry="5" /><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" /><line x1="17.5" y1="6.5" x2="17.51" y2="6.5" /></svg>
                  Instagram
                </a>
              </div>
            </div>

            <div className="tdp-footer-col">
              <h4>Trạm đồng phục</h4>
              <Link href="/design">Thiết kế</Link>
              <a href="#pricing">Bảng giá</a>
              <a href="#products">Bảng size</a>
              <a href="#products">Bảng màu</a>
              <a href="https://www.facebook.com/UniSpace.TramInAo" target="_blank" rel="noopener noreferrer">Feedback</a>
            </div>

            <div className="tdp-footer-col">
              <h4>Hỗ trợ</h4>
              <a href="#why">Giao hàng &amp; Thanh toán</a>
              <a href="#pricing">Khuyến mãi &amp; Quà tặng</a>
              <a href="#why">FAQ</a>
              <Link href="/login">Đăng nhập quản lý</Link>
            </div>

            <div className="tdp-footer-col">
              <h4>Liên kết nhanh</h4>
              <Link href="/design">🎨 Tự thiết kế online</Link>
              <a href="https://www.facebook.com/UniSpace.TramInAo" target="_blank" rel="noopener noreferrer">💬 Nhắn tin Facebook</a>
              <a href="tel:+84000000000">📞 Hotline</a>
            </div>
          </div>

          <div className="tdp-footer-bottom">
            <p>© 2026 UniSpace — Trạm In Áo. All rights reserved.</p>
            <div className="tdp-footer-status">
              <span className="tdp-status-dot" />
              <span>System Operational</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
