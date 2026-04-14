"use client";

import { useEffect, useRef } from "react";
import Link from "next/link";
import Image from "next/image";
import { Logo } from "../components/Logo";

export default function HomePage() {
  const heroRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const handleScroll = () => {
      if (!heroRef.current) return;
      const scrollY = window.scrollY;
      const bg = heroRef.current.querySelector(".hero-bg") as HTMLElement;
      if (bg) bg.style.transform = `translateY(${scrollY * 0.3}px) scale(1.1)`;
    };
    window.addEventListener("scroll", handleScroll, { passive: true });

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) entry.target.classList.add("animate-in");
        });
      },
      { threshold: 0.15 }
    );
    document.querySelectorAll(".scroll-reveal").forEach((el) => observer.observe(el));

    return () => {
      window.removeEventListener("scroll", handleScroll);
      observer.disconnect();
    };
  }, []);

  return (
    <div className="home-page">
      {/* ═══ Navbar ═══ */}
      <nav className="home-nav">
        <div className="home-nav-inner">
          <Link href="/" className="home-nav-logo-link" style={{ textDecoration: 'none' }}>
            <Logo scale={0.5} />
          </Link>
          <div className="home-nav-links">
            <a href="#products">Sản phẩm</a>
            <a href="#why">Vì sao chọn chúng tôi</a>
            <a href="#pricing">Bảng giá</a>
            <a href="https://www.facebook.com/UniSpace.TramInAo" target="_blank" rel="noopener noreferrer">Facebook</a>
            <Link href="/login" className="home-nav-login">Đăng nhập</Link>
          </div>
          <Link href="/design" className="home-nav-cta">
            Đặt áo ngay
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></svg>
          </Link>
        </div>
      </nav>

      {/* ═══ Hero — giới thiệu shop ═══ */}
      <section className="home-hero" ref={heroRef}>
        <div className="hero-bg">
          <div className="hero-gradient" />
          <div className="hero-grid" />
        </div>

        <div className="hero-content">
          <div className="hero-badge scroll-reveal">
            <span className="hero-badge-dot" />
            34.000+ lượt thích trên Facebook
          </div>

          <h1 className="hero-title scroll-reveal">
            <span className="hero-title-line1">Trạm In Áo</span>
            <span className="hero-title-line2"><em>UniSpace</em></span>
          </h1>

          <p className="hero-desc scroll-reveal">
            Chuyên áo lớp, áo nhóm, áo công ty — thiết kế theo ý bạn. 
            Biến ý tưởng thành chiếc áo độc nhất, in sắc nét, giao tận nơi tại TP. Hồ Chí Minh và toàn quốc.
          </p>

          <div className="hero-actions scroll-reveal">
            <a href="https://www.facebook.com/UniSpace.TramInAo" target="_blank" rel="noopener noreferrer" className="hero-btn-primary">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"/></svg>
              Nhắn tin đặt hàng
            </a>
            <Link href="/design" className="hero-btn-ghost">
              Tự thiết kế online
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="9 18 15 12 9 6"/></svg>
            </Link>
          </div>

          <div className="hero-stats scroll-reveal">
            <div className="hero-stat">
              <span className="hero-stat-num">34K+</span>
              <span className="hero-stat-label">Lượt thích</span>
            </div>
            <div className="hero-stat-sep" />
            <div className="hero-stat">
              <span className="hero-stat-num">5000+</span>
              <span className="hero-stat-label">Đơn hàng</span>
            </div>
            <div className="hero-stat-sep" />
            <div className="hero-stat">
              <span className="hero-stat-num">98%</span>
              <span className="hero-stat-label">Hài lòng</span>
            </div>
          </div>
        </div>

        {/* Hero image — real product photo */}
        <div className="hero-image scroll-reveal">
          <Image
            src="/images/hero-shirts.png"
            alt="UniSpace - Áo lớp đồng phục đa dạng mẫu mã và màu sắc"
            width={560}
            height={520}
            priority
            className="hero-image-img"
          />
        </div>
      </section>

      {/* ═══ Sản phẩm ═══ */}
      <section className="home-section" id="products">
        <div className="home-container">
          <div className="section-header scroll-reveal">
            <span className="section-tag">Sản phẩm</span>
            <h2 className="section-title">Áo đồng phục cho <em>mọi dịp</em></h2>
            <p className="section-desc">Từ áo lớp, áo khoa, áo công ty đến áo sự kiện — UniSpace đều làm được.</p>
          </div>

          <div className="features-grid">
            <div className="feature-card scroll-reveal">
              <h3>Áo lớp</h3>
              <p>Thiết kế riêng cho từng lớp. In tên, logo, slogan, năm học — tạo kỷ niệm đáng nhớ cho cả lớp.</p>
            </div>
            <div className="feature-card scroll-reveal">
              <h3>Áo công ty</h3>
              <p>Đồng phục chuyên nghiệp cho doanh nghiệp. Thêu logo, in thương hiệu, vải cao cấp.</p>
            </div>
            <div className="feature-card scroll-reveal">
              <h3>Áo sự kiện</h3>
              <p>Áo team building, áo CLB, áo chạy bộ, áo nhóm bạn — đặt nhanh, giao sớm.</p>
            </div>
            <div className="feature-card scroll-reveal">
              <h3>Thiết kế miễn phí</h3>
              <p>Đội ngũ designer hỗ trợ thiết kế miễn phí. Hoặc tự thiết kế online với công cụ AI.</p>
            </div>
            <div className="feature-card scroll-reveal">
              <h3>In chất lượng cao</h3>
              <p>Công nghệ in DTG, in lụa, in chuyển nhiệt — màu sắc bền đẹp, giặt không phai.</p>
            </div>
            <div className="feature-card scroll-reveal">
              <h3>Giao hàng toàn quốc</h3>
              <p>Miễn phí giao hàng nội thành HCM. Ship toàn quốc trong 3-5 ngày làm việc.</p>
            </div>
          </div>
        </div>
      </section>

      {/* ═══ Vì sao chọn UniSpace ═══ */}
      <section className="home-section home-section-dark" id="why">
        <div className="home-container">
          <div className="section-header scroll-reveal">
            <span className="section-tag">Vì sao chọn chúng tôi</span>
            <h2 className="section-title">Quy trình đơn giản, <em>chất lượng thật</em></h2>
          </div>

          <div className="steps-grid">
            <div className="step-card scroll-reveal">
              <div className="step-num">01</div>
              <div className="step-content">
                <h3>Gửi ý tưởng</h3>
                <p>Inbox Facebook hoặc tự thiết kế online. Gửi logo, slogan, tên lớp — chúng tôi tư vấn miễn phí.</p>
              </div>
              <div className="step-line" />
            </div>
            <div className="step-card scroll-reveal">
              <div className="step-num">02</div>
              <div className="step-content">
                <h3>Duyệt mẫu & đặt hàng</h3>
                <p>Xem trước mockup trên áo thật. Chốt mẫu, chọn size, số lượng — thanh toán linh hoạt.</p>
              </div>
              <div className="step-line" />
            </div>
            <div className="step-card scroll-reveal">
              <div className="step-num">03</div>
              <div className="step-content">
                <h3>Nhận áo tận nơi</h3>
                <p>In xong trong 3-5 ngày. Giao tận trường, công ty hoặc nhà — kiểm tra hàng trước khi nhận.</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ═══ Bảng giá ═══ */}
      <section className="home-section" id="pricing">
        <div className="home-container">
          <div className="section-header scroll-reveal">
            <span className="section-tag">Bảng giá</span>
            <h2 className="section-title">Giá tốt nhất cho <em>áo đồng phục</em></h2>
            <p className="section-desc">Giá đã bao gồm thiết kế + in ấn. Đặt càng nhiều giá càng tốt.</p>
          </div>

          <div className="pricing-grid">
            <div className="pricing-card scroll-reveal">
              <div className="pricing-name">Cơ bản</div>
              <div className="pricing-price">89K<span>/áo</span></div>
              <p className="pricing-desc">Từ 10 áo trở lên</p>
              <ul className="pricing-features">
                <li>✓ In 1 mặt</li>
                <li>✓ 1 màu in</li>
                <li>✓ Vải cotton 65/35</li>
                <li>✓ Thiết kế miễn phí</li>
              </ul>
              <a href="https://www.facebook.com/UniSpace.TramInAo" target="_blank" rel="noopener noreferrer" className="pricing-btn">Nhắn tin đặt hàng</a>
            </div>

            <div className="pricing-card pricing-card-pop scroll-reveal">
              <div className="pricing-badge">Phổ biến nhất</div>
              <div className="pricing-name">Premium</div>
              <div className="pricing-price">119K<span>/áo</span></div>
              <p className="pricing-desc">Từ 20 áo trở lên</p>
              <ul className="pricing-features">
                <li>✓ In 2 mặt full màu</li>
                <li>✓ Công nghệ DTG</li>
                <li>✓ Vải cotton 100%</li>
                <li>✓ Giao hàng miễn phí toàn quốc</li>
                <li>✓ Thiết kế riêng miễn phí</li>
              </ul>
              <a href="https://www.facebook.com/UniSpace.TramInAo" target="_blank" rel="noopener noreferrer" className="pricing-btn-pop">Nhắn tin đặt hàng</a>
            </div>

            <div className="pricing-card scroll-reveal">
              <div className="pricing-name">Số lượng lớn</div>
              <div className="pricing-price">Liên hệ</div>
              <p className="pricing-desc">Từ 100 áo trở lên</p>
              <ul className="pricing-features">
                <li>✓ Tất cả tính năng Premium</li>
                <li>✓ In thêu cao cấp</li>
                <li>✓ Nhân viên tư vấn riêng</li>
                <li>✓ Form áo riêng theo yêu cầu</li>
              </ul>
              <a href="https://www.facebook.com/UniSpace.TramInAo" target="_blank" rel="noopener noreferrer" className="pricing-btn">Liên hệ báo giá</a>
            </div>
          </div>
        </div>
      </section>

      {/* ═══ Footer ═══ */}
      <footer className="home-footer">
        <div className="home-container">
          <div className="footer-grid">
            <div className="footer-brand">
              <Link href="/" style={{ textDecoration: 'none', display: 'inline-block', marginBottom: '1rem' }}>
                <Logo scale={0.7} />
              </Link>
              <p>Trạm In Áo — Chuyên áo lớp, áo nhóm, áo công ty. Biến ý tưởng thành chiếc áo độc nhất.</p>
              <p className="footer-address">📍 TP. Hồ Chí Minh</p>
              <div className="footer-social">
                <a href="https://www.facebook.com/UniSpace.TramInAo" target="_blank" rel="noopener noreferrer" title="Facebook">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"/></svg>
                </a>
              </div>
            </div>
            <div className="footer-col">
              <h4>Dịch vụ</h4>
              <a href="#products">Áo lớp</a>
              <a href="#products">Áo công ty</a>
              <a href="#products">Áo sự kiện</a>
              <a href="#pricing">Bảng giá</a>
            </div>
            <div className="footer-col">
              <h4>Hỗ trợ</h4>
              <a href="https://www.facebook.com/UniSpace.TramInAo" target="_blank" rel="noopener noreferrer">Nhắn tin Facebook</a>
              <Link href="/design">Tự thiết kế online</Link>
              <Link href="/login">Đăng nhập quản lý</Link>
            </div>
          </div>

          <div className="footer-bottom">
            <p>&copy; 2026 UniSpace — Trạm In Áo. All rights reserved.</p>
            <div className="footer-status">
              <span className="footer-status-dot" />
              <span className="footer-status-text">System Operational</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
