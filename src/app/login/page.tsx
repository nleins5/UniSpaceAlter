"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

type Mode = "login" | "register" | "verify";

export default function LoginPage() {
  const router = useRouter();
  const [mode, setMode] = useState<Mode>("login");
  const [mounted, setMounted] = useState(false);
  const [aiCreditsMessage, setAiCreditsMessage] = useState(false);

  // Shared fields
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [phone, setPhone] = useState("");
  const [firstName, setFirstName] = useState("");
  const [otp, setOtp] = useState("");

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [devOtp, setDevOtp] = useState("");

  useEffect(() => {
    setMounted(true);
    // Detect AI credits redirect
    const params = new URLSearchParams(window.location.search);
    if (params.get('reason') === 'ai_credits') setAiCreditsMessage(true);
  }, []);

  const switchMode = (m: Mode) => {
    setMode(m);
    setError("");
    setSuccess("");
  };

  // ── LOGIN ─────────────────────────────────────────────
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(""); setIsLoading(true);
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();
      if (data.user) {
        sessionStorage.setItem("user", JSON.stringify(data.user));
        sessionStorage.removeItem("ai_gen_count");
        const redirect = sessionStorage.getItem('login_redirect');
        sessionStorage.removeItem('login_redirect');
        if (data.user.admin) {
          sessionStorage.setItem("admin_logged_in", "1");
          router.push(redirect || "/admin");
        } else {
          router.push(redirect || "/design");
        }
      } else {
        setError(data.error || "AUTHENTICATION_FAILED // INVALID_CREDENTIALS");
      }
    } catch {
      setError("SYSTEM_ERROR // CONNECTION_LOST");
    } finally {
      setIsLoading(false);
    }
  };

  // ── REGISTER ──────────────────────────────────────────
  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(""); setIsLoading(true);
    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password, phone, firstName, lastName: "" }),
      });
      const data = await res.json();
      if (data.user) {
        sessionStorage.setItem("user", JSON.stringify(data.user));
        sessionStorage.removeItem("ai_gen_count");
        if (data._devOtp) setDevOtp(data._devOtp);
        setSuccess("ACCOUNT_CREATED // Mã xác minh đã được gửi đến email");
        switchMode("verify");
      } else {
        setError(data.error || "REGISTRATION_FAILED");
      }
    } catch {
      setError("SYSTEM_ERROR // CONNECTION_LOST");
    } finally {
      setIsLoading(false);
    }
  };

  // ── VERIFY EMAIL ──────────────────────────────────────
  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(""); setIsLoading(true);
    try {
      const res = await fetch("/api/auth/verify-email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, code: otp }),
      });
      const data = await res.json();
      if (data.verified) {
        setSuccess("EMAIL_VERIFIED // Đang chuyển hướng...");
        setTimeout(() => router.push("/design"), 1500);
      } else {
        setError(data.error || "VERIFICATION_FAILED");
      }
    } catch {
      setError("SYSTEM_ERROR");
    } finally {
      setIsLoading(false);
    }
  };

  // ── FACEBOOK ───────────────────────────────────
  const handleFacebookLogin = async () => {
    setError(""); setSuccess(""); setIsLoading(true);
    try {
      const res = await fetch("/api/auth/facebook", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      });
      const data = await res.json();
      if (data.user) {
        sessionStorage.setItem("user", JSON.stringify(data.user));
        sessionStorage.removeItem("ai_gen_count");
        setSuccess("FACEBOOK_AUTH_SUCCESS // Đang chuyển hướng...");
        setTimeout(() => router.push("/design"), 1000);
      } else {
        setError(data.error || "FACEBOOK_AUTH_FAILED");
      }
    } catch {
      setError("SYSTEM_ERROR // FACEBOOK_CONNECTION_LOST");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="login-terminal-page">
      <div className="login-grid-pattern" />
      <div className="login-watermark"><span>CONFIDENTIAL</span></div>

      {/* Floating particles */}
      <div className="login-particles">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className={`login-particle login-particle-${i}`} />
        ))}
      </div>

      {/* Header */}
      <header className="login-terminal-header">
        <div className="login-brand">
          <span className="login-brand-text">UNISPACE_STUDIO</span>
        </div>
        <div className="login-header-icons">
          <button className="login-header-btn" title="Terminal">
            <span className="material-symbols-outlined">terminal</span>
          </button>
          <button className="login-header-btn" title="System">
            <span className="material-symbols-outlined">settings_input_component</span>
          </button>
        </div>
      </header>

      {/* Main card */}
      <main className={`login-terminal-main ${mounted ? 'login-card-enter' : ''}`}>
        <div className="login-terminal-card">
          <div className="login-card-accent-line" />

          {/* AI Credits banner */}
          {aiCreditsMessage && (
            <div className="login-ai-credits-banner">
              <span className="login-ai-credits-icon">⚡</span>
              <div>
                <div className="login-ai-credits-title">AI Credits hết</div>
                <div className="login-ai-credits-desc">Đăng nhập để tiếp tục sử dụng AI Design miễn phí</div>
              </div>
            </div>
          )}

          {/* ═══ MODE TABS ═══ */}
          <div className="login-mode-tabs">
            <button
              className={`login-mode-tab ${mode === 'login' || mode === 'verify' ? 'active' : ''}`}
              onClick={() => switchMode(mode === 'verify' ? 'verify' : 'login')}
            >
              <span className="material-symbols-outlined login-icon-sm">login</span>
              ĐĂNG NHẬP
            </button>
            <button
              className={`login-mode-tab ${mode === 'register' ? 'active' : ''}`}
              onClick={() => switchMode('register')}
            >
              <span className="material-symbols-outlined login-icon-sm">person_add</span>
              TẠO TÀI KHOẢN
            </button>
          </div>

          {/* ═══ HEADER ═══ */}
          <div className="login-card-header">
            {mode === "login" && (
              <>
                <h1 className="login-card-title">USER_AUTHENTICATION <span className="login-card-title-dim">{'/'+'/'}</span></h1>
                <p className="login-card-subtitle">SYSTEM_ACCESS:: UNISPACE_STUDIO_v2.0</p>
              </>
            )}
            {mode === "register" && (
              <>
                <h1 className="login-card-title">CREATE_ACCOUNT <span className="login-card-title-dim">{'/'+'/'}</span></h1>
                <p className="login-card-subtitle">REGISTER:: EMAIL + PHONE_VERIFICATION</p>
              </>
            )}
            {mode === "verify" && (
              <>
                <h1 className="login-card-title">VERIFY_EMAIL <span className="login-card-title-dim">{'/'+'/'}</span></h1>
                <p className="login-card-subtitle">OTP_SENT:: {email}</p>
              </>
            )}
          </div>

          {/* Messages */}
          {error && (
            <div className="login-terminal-error">
              <span className="material-symbols-outlined login-icon-sm">error</span>
              <span>{error}</span>
            </div>
          )}
          {success && (
            <div className="login-terminal-success">
              <span className="material-symbols-outlined login-icon-sm">check_circle</span>
              <span>{success}</span>
            </div>
          )}

          {/* ═══ LOGIN FORM ═══ */}
          {mode === "login" && (
            <form onSubmit={handleLogin} className="login-terminal-form">
              <div className="login-terminal-field">
                <label htmlFor="login-email">USER ID</label>
                <div className="login-terminal-input-wrap">
                  <span className="material-symbols-outlined login-field-icon">person</span>
                  <input id="login-email" type="email" value={email} onChange={e => setEmail(e.target.value)}
                    placeholder="ENTER_EMAIL..." required autoFocus autoComplete="email" />
                </div>
              </div>

              <div className="login-terminal-field">
                <label htmlFor="login-pass">PASSCODE</label>
                <div className="login-terminal-input-wrap">
                  <span className="material-symbols-outlined login-field-icon">lock</span>
                  <input id="login-pass" type="password" value={password} onChange={e => setPassword(e.target.value)}
                    placeholder="********" required autoComplete="current-password" />
                </div>
              </div>

              <div className="login-terminal-action">
                <button type="submit" className="login-terminal-btn" disabled={isLoading}>
                  <span className="login-btn-bg-slide" />
                  <span className="login-btn-content">
                    {isLoading ? (
                      <><svg className="animate-spin" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M21 12a9 9 0 1 1-6.219-8.56"/></svg> AUTHENTICATING...</>
                    ) : (
                      <>INITIATE SESSION <span className="material-symbols-outlined login-btn-arrow">arrow_forward</span></>
                    )}
                  </span>
                </button>
              </div>

              {/* Divider */}
              <div className="login-divider">
                <div className="login-divider-line" />
                <span className="login-divider-text">HOẶC</span>
                <div className="login-divider-line" />
              </div>

              {/* Facebook */}
              <button type="button" onClick={handleFacebookLogin} className="login-facebook-btn">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                </svg>
                LIÊN KẾT FACEBOOK
              </button>

              <div className="login-demo-hint">
                <span className="login-demo-label">DEMO_ACCESS:</span>
                <code>admin@unispace.vn</code> / <code>admin123</code>
              </div>
            </form>
          )}

          {/* ═══ REGISTER FORM ═══ */}
          {mode === "register" && (
            <form onSubmit={handleRegister} className="login-terminal-form">
              <div className="login-terminal-field">
                <label htmlFor="reg-name">TÊN HIỂN THỊ</label>
                <div className="login-terminal-input-wrap">
                  <span className="material-symbols-outlined login-field-icon">badge</span>
                  <input id="reg-name" type="text" value={firstName} onChange={e => setFirstName(e.target.value)}
                    placeholder="ENTER_NAME..." required autoFocus autoComplete="given-name" />
                </div>
              </div>

              <div className="login-terminal-field">
                <label htmlFor="reg-email">EMAIL</label>
                <div className="login-terminal-input-wrap">
                  <span className="material-symbols-outlined login-field-icon">mail</span>
                  <input id="reg-email" type="email" value={email} onChange={e => setEmail(e.target.value)}
                    placeholder="ENTER_EMAIL..." required autoComplete="email" />
                </div>
              </div>

              <div className="login-terminal-field">
                <label htmlFor="reg-phone">SỐ ĐIỆN THOẠI</label>
                <div className="login-terminal-input-wrap">
                  <span className="material-symbols-outlined login-field-icon">phone</span>
                  <input id="reg-phone" type="tel" value={phone} onChange={e => setPhone(e.target.value)}
                    placeholder="0912_345_678" required autoComplete="tel" />
                </div>
              </div>

              <div className="login-terminal-field">
                <label htmlFor="reg-pass">MẬT KHẨU</label>
                <div className="login-terminal-input-wrap">
                  <span className="material-symbols-outlined login-field-icon">lock</span>
                  <input id="reg-pass" type="password" value={password} onChange={e => setPassword(e.target.value)}
                    placeholder="TỐI THIỂU 6 KÝ TỰ" required minLength={6} autoComplete="new-password" />
                </div>
              </div>

              <div className="login-terminal-action">
                <button type="submit" className="login-terminal-btn login-btn-register" disabled={isLoading}>
                  <span className="login-btn-bg-slide" />
                  <span className="login-btn-content">
                    {isLoading ? (
                      <><svg className="animate-spin" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M21 12a9 9 0 1 1-6.219-8.56"/></svg> CREATING...</>
                    ) : (
                      <>TẠO TÀI KHOẢN <span className="material-symbols-outlined login-btn-arrow">arrow_forward</span></>
                    )}
                  </span>
                </button>
              </div>

              {/* Divider */}
              <div className="login-divider">
                <div className="login-divider-line" />
                <span className="login-divider-text">HOẶC</span>
                <div className="login-divider-line" />
              </div>

              {/* Facebook */}
              <button type="button" onClick={handleFacebookLogin} className="login-facebook-btn">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                </svg>
                ĐĂNG KÝ VỚI FACEBOOK
              </button>
            </form>
          )}

          {/* ═══ VERIFY FORM ═══ */}
          {mode === "verify" && (
            <form onSubmit={handleVerify} className="login-terminal-form">
              <div className="login-verify-info">
                <span className="material-symbols-outlined login-icon-verify">mark_email_read</span>
                <p>Chúng tôi đã gửi mã xác minh 6 chữ số đến <strong>{email}</strong></p>
              </div>

              {devOtp && (
                <div className="login-terminal-success">
                  <span className="material-symbols-outlined login-icon-xs">code</span>
                  <span>DEV_MODE OTP: <strong>{devOtp}</strong></span>
                </div>
              )}

              <div className="login-terminal-field">
                <label htmlFor="verify-otp">MÃ XÁC MINH (6 SỐ)</label>
                <div className="login-terminal-input-wrap">
                  <span className="material-symbols-outlined login-field-icon">pin</span>
                  <input id="verify-otp" type="text" value={otp} onChange={e => setOtp(e.target.value)}
                    placeholder="000000" required maxLength={6} pattern="[0-9]{6}"
                    className="login-otp-input" autoFocus autoComplete="one-time-code"
                    inputMode="numeric" />
                </div>
              </div>

              <div className="login-terminal-action">
                <button type="submit" className="login-terminal-btn" disabled={isLoading}>
                  <span className="login-btn-bg-slide" />
                  <span className="login-btn-content">
                    {isLoading ? (
                      <><svg className="animate-spin" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M21 12a9 9 0 1 1-6.219-8.56"/></svg> VERIFYING...</>
                    ) : (
                      <>XÁC MINH EMAIL <span className="material-symbols-outlined login-btn-arrow">verified</span></>
                    )}
                  </span>
                </button>
              </div>

              <button type="button" onClick={() => switchMode('login')} className="login-skip-btn">
                BỎ QUA — ĐĂNG NHẬP SAU →
              </button>
            </form>
          )}

          {/* Secure connection footer */}
          <div className="login-card-divider" />
          <p className="login-card-secure">SECURE_CONNECTION_ESTABLISHED</p>
        </div>
      </main>

      {/* Footer */}
      <footer className="login-terminal-footer">
        <div className="login-footer-left">
          {'© 2024 UNISPACE DESIGN STUDIO'} <span className="login-footer-sep">{'/'+'/'}</span> {'SYSTEM_LOG_V2.0'}
        </div>
        <div className="login-footer-links">
          <a href="#">TERMINAL_STATUS</a>
          <a href="#">ENCRYPTION_POLICY</a>
          <a href="#">CORE_SUPPORT</a>
        </div>
      </footer>
    </div>
  );
}
