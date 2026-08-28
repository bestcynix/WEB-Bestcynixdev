/**
 * BestCyniX Dev - Shared Global UI Components Suite
 * Handles Global Shared Footer (with Auto Copyright Year), PDPA Banner, Cookie Modal,
 * Live Chat Widget, Back to Top Button, and Global Focus Stacking Manager across all pages.
 */

// Global Dynamic Z-Index Manager: whichever window/menu/modal is clicked or opened last comes to the front
let _globalHighestZIndex = 10010;
window.bringToFront = function (el) {
  if (!el) return;
  _globalHighestZIndex += 2;
  el.style.zIndex = _globalHighestZIndex;
};

(function () {
  'use strict';

  const currentYear = new Date().getFullYear();

  // 0. Inject Self-Contained Styles for Shared Modals, PDPA Banner & Footer (Guarantees perfect rendering across all pages)
  const injectSharedStyles = () => {
    if (document.getElementById('bcxSharedStyles')) return;
    const style = document.createElement('style');
    style.id = 'bcxSharedStyles';
    style.textContent = `
      /* Cyber Modal */
      .cyber-modal {
        position: fixed;
        inset: 0;
        z-index: 100000;
        background: rgba(3, 8, 18, 0.85);
        backdrop-filter: blur(12px);
        -webkit-backdrop-filter: blur(12px);
        display: none;
        align-items: center;
        justify-content: center;
        padding: 1.2rem;
        transition: opacity 0.25s ease;
      }
      .cyber-modal.is-open {
        display: flex !important;
      }
      .cyber-modal-card {
        background: linear-gradient(160deg, rgba(8, 20, 42, 0.98), rgba(4, 10, 20, 0.98));
        border: 1px solid rgba(50, 255, 201, 0.35);
        border-radius: 18px;
        padding: 1.8rem;
        width: min(520px, 94vw);
        box-shadow: 0 25px 70px rgba(0, 0, 0, 0.85);
        position: relative;
        font-family: 'Prompt', sans-serif;
        color: #e6f3ff;
      }
      .cyber-modal-header {
        display: flex;
        align-items: center;
        justify-content: space-between;
        margin-bottom: 1rem;
      }
      .cyber-modal-close {
        background: rgba(255, 255, 255, 0.06);
        border: 1px solid rgba(255, 255, 255, 0.12);
        color: #8aa9c7;
        font-size: 1.1rem;
        cursor: pointer;
        width: 32px;
        height: 32px;
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        transition: all 0.2s ease;
      }
      .cyber-modal-close:hover {
        background: rgba(255, 85, 116, 0.2);
        border-color: #ff5574;
        color: #ff5574;
      }
      .btn-cookie-action {
        padding: 0.5rem 1.1rem;
        border-radius: 9px;
        font-weight: 600;
        cursor: pointer;
        font-family: 'Prompt', sans-serif;
        font-size: 0.88rem;
        transition: all 0.2s ease;
      }
      .btn-cookie-action.btn-accept {
        background: #32ffc9;
        color: #050b14;
        border: none;
      }
      .btn-cookie-action.btn-accept:hover {
        background: #1be4b0;
        box-shadow: 0 0 15px rgba(50, 255, 201, 0.4);
      }
      .btn-cookie-action.btn-essential {
        background: rgba(255, 255, 255, 0.08);
        border: 1px solid rgba(255, 255, 255, 0.15);
        color: #e6f3ff;
      }
      .btn-cookie-action.btn-essential:hover {
        background: rgba(255, 255, 255, 0.15);
      }
      .btn-cookie-action.btn-save {
        background: rgba(2, 132, 199, 0.25);
        border: 1px solid #0284c7;
        color: #38bdf8;
      }
      .btn-cookie-action.btn-save:hover {
        background: #0284c7;
        color: #fff;
      }

      /* PDPA Consent Banner */
      .pdpa-banner {
        position: fixed;
        bottom: 1.2rem;
        left: 50%;
        transform: translateX(-50%);
        width: min(860px, calc(100vw - 2rem));
        background: rgba(8, 20, 42, 0.96);
        backdrop-filter: blur(14px);
        -webkit-backdrop-filter: blur(14px);
        border: 1px solid rgba(50, 255, 201, 0.3);
        border-radius: 16px;
        padding: 1.1rem 1.4rem;
        display: none;
        align-items: center;
        justify-content: space-between;
        gap: 1.2rem;
        z-index: 99990;
        box-shadow: 0 15px 50px rgba(0, 0, 0, 0.75);
        font-family: 'Prompt', sans-serif;
        animation: pdpaSlideUp 0.35s ease forwards;
      }
      .pdpa-banner.is-visible {
        display: flex !important;
      }
      @keyframes pdpaSlideUp {
        from { opacity: 0; transform: translate(-50%, 20px); }
        to { opacity: 1; transform: translate(-50%, 0); }
      }
      @media (max-width: 768px) {
        .pdpa-banner {
          flex-direction: column;
          text-align: left;
          align-items: stretch;
          gap: 0.9rem;
          padding: 1rem;
        }
        .pdpa-actions {
          justify-content: flex-end;
          flex-wrap: wrap;
        }
      }
      .pdpa-text {
        font-size: 0.84rem;
        color: #e6f3ff;
        line-height: 1.55;
      }
      .pdpa-text a {
        color: #32ffc9;
        text-decoration: underline;
        font-weight: 500;
      }
      .pdpa-actions {
        display: flex;
        gap: 0.5rem;
        flex-shrink: 0;
        align-items: center;
      }
      .btn-pdpa-accept {
        background: #32ffc9;
        color: #050b14;
        border: none;
        font-weight: 700;
        padding: 0.45rem 1rem;
        border-radius: 8px;
        font-family: 'Prompt', sans-serif;
        font-size: 0.84rem;
        cursor: pointer;
        transition: all 0.2s ease;
      }
      .btn-pdpa-accept:hover {
        background: #1be4b0;
        box-shadow: 0 0 12px rgba(50, 255, 201, 0.4);
      }
      .btn-pdpa-reject {
        background: rgba(255, 255, 255, 0.08);
        border: 1px solid rgba(255, 255, 255, 0.15);
        color: #8aa9c7;
        padding: 0.45rem 0.85rem;
        border-radius: 8px;
        font-family: 'Prompt', sans-serif;
        font-size: 0.84rem;
        cursor: pointer;
        transition: all 0.2s ease;
      }
      .btn-pdpa-reject:hover {
        background: rgba(255, 255, 255, 0.15);
        color: #fff;
      }
      .btn-pdpa-settings {
        background: rgba(50, 255, 201, 0.08);
        border: 1px solid rgba(50, 255, 201, 0.3);
        color: #32ffc9;
        padding: 0.45rem 0.85rem;
        border-radius: 8px;
        font-family: 'Prompt', sans-serif;
        font-size: 0.84rem;
        cursor: pointer;
        transition: all 0.2s ease;
      }
      .btn-pdpa-settings:hover {
        background: rgba(50, 255, 201, 0.18);
      }

      /* Universal Mobile Cyber Drawer & Hamburger (Guarantees perfect rendering across all pages) */
      .nav-toggle {
        display: none;
        flex-direction: column;
        justify-content: space-around;
        width: 38px;
        height: 38px;
        min-width: 38px;
        min-height: 38px;
        background: rgba(255, 255, 255, 0.06);
        border: 1px solid var(--border, rgba(255, 255, 255, 0.15));
        border-radius: 10px;
        cursor: pointer;
        padding: 9px 8px;
        z-index: 10005;
        transition: all 0.2s ease;
        box-sizing: border-box;
      }
      .nav-toggle:hover {
        background: rgba(50, 255, 201, 0.12);
        border-color: var(--accent, #32ffc9);
      }
      .nav-toggle span {
        width: 100%;
        height: 2px;
        background: #fff;
        border-radius: 2px;
        transition: all 0.25s cubic-bezier(0.16, 1, 0.3, 1);
        display: block;
      }
      .nav-toggle.is-active span:nth-child(1) {
        transform: translateY(6px) rotate(45deg);
        background: var(--accent, #32ffc9);
      }
      .nav-toggle.is-active span:nth-child(2) {
        opacity: 0;
      }
      .nav-toggle.is-active span:nth-child(3) {
        transform: translateY(-6px) rotate(-45deg);
        background: var(--accent, #32ffc9);
      }

      .mobile-drawer-overlay {
        position: fixed;
        inset: 0;
        background: rgba(0, 0, 0, 0.8);
        backdrop-filter: blur(6px);
        -webkit-backdrop-filter: blur(6px);
        z-index: 99999;
        display: none;
        opacity: 0;
        transition: opacity 0.25s ease;
      }
      .mobile-drawer-overlay.is-open {
        display: block;
        opacity: 1;
      }
      .mobile-nav-drawer {
        position: fixed;
        top: 0;
        right: 0;
        bottom: 0;
        width: min(340px, calc(100vw - 2rem));
        height: 100vh;
        background: linear-gradient(170deg, rgba(8, 22, 42, 0.99), rgba(4, 10, 22, 0.99));
        backdrop-filter: blur(20px);
        -webkit-backdrop-filter: blur(20px);
        border-left: 1px solid rgba(50, 255, 201, 0.3);
        box-shadow: -15px 0 50px rgba(0, 0, 0, 0.9);
        z-index: 100000;
        display: flex;
        flex-direction: column;
        padding: 1.5rem 1.2rem;
        transform: translateX(100%);
        transition: transform 0.3s cubic-bezier(0.16, 1, 0.3, 1);
        box-sizing: border-box;
      }
      .mobile-nav-drawer.is-open {
        transform: translateX(0);
      }
      .mobile-drawer-header {
        display: flex;
        align-items: center;
        justify-content: space-between;
        padding-bottom: 1rem;
        border-bottom: 1px solid rgba(255, 255, 255, 0.08);
        margin-bottom: 1rem;
      }
      .btn-close-drawer {
        background: rgba(255, 255, 255, 0.06);
        border: 1px solid var(--border, rgba(255, 255, 255, 0.15));
        color: #fff;
        width: 32px;
        height: 32px;
        border-radius: 8px;
        cursor: pointer;
        font-size: 1rem;
        display: flex;
        align-items: center;
        justify-content: center;
      }
      .mobile-drawer-items {
        display: flex;
        flex-direction: column;
        gap: 0.5rem;
        overflow-y: auto;
      }
      .mobile-drawer-link {
        display: flex;
        align-items: center;
        gap: 0.85rem;
        padding: 0.75rem 0.9rem;
        border-radius: 12px;
        background: rgba(255, 255, 255, 0.03);
        border: 1px solid rgba(255, 255, 255, 0.06);
        text-decoration: none;
        color: #fff;
        transition: all 0.2s ease;
      }
      .mobile-drawer-link:hover, .mobile-drawer-link.active {
        background: rgba(50, 255, 201, 0.1);
        border-color: rgba(50, 255, 201, 0.35);
        transform: translateX(3px);
      }
      .mobile-drawer-link .drawer-icon {
        font-size: 1.2rem;
        width: 34px;
        height: 34px;
        border-radius: 10px;
        display: flex;
        align-items: center;
        justify-content: center;
        background: rgba(50, 255, 201, 0.1);
        border: 1px solid rgba(50, 255, 201, 0.2);
        flex-shrink: 0;
      }
      .mobile-drawer-link .drawer-text {
        display: flex;
        flex-direction: column;
        min-width: 0;
      }
      .mobile-drawer-link .drawer-text strong {
        font-size: 0.86rem;
        color: #fff;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
      }
      .mobile-drawer-link .drawer-text small {
        font-size: 0.72rem;
        color: var(--muted, #8aa9c7);
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
      }

      /* Universal Topbar & Right Cluster Alignment */
      .top-nav,
      .topbar,
      .topbar-inner,
      .topbar .container {
        display: flex !important;
        flex-direction: row !important;
        align-items: center !important;
        justify-content: space-between !important;
        flex-wrap: nowrap !important;
      }
      .nav-right-cluster,
      .topbar-actions,
      .nav-actions {
        display: flex !important;
        flex-direction: row !important;
        align-items: center !important;
        gap: 0.6rem !important;
        flex-wrap: nowrap !important;
        margin-left: auto !important;
      }
      .desktop-nav-links {
        display: flex !important;
        flex-direction: row !important;
        align-items: center !important;
        gap: 0.5rem !important;
        flex-wrap: nowrap !important;
      }

      /* Desktop Hide Rules */
      @media (min-width: 1025px) {
        .mobile-nav-drawer,
        .mobile-drawer-overlay,
        .nav-toggle {
          display: none !important;
        }
        .desktop-nav-links {
          display: flex !important;
        }
      }
      @media (max-width: 1024px) {
        .desktop-nav-links {
          display: none !important;
        }
        .nav-toggle {
          display: flex !important;
        }
      }

      /* ── Universal Cyber Neon Shared Footer ─────────────────────────────── */
      footer.site-footer {
        background: linear-gradient(180deg, rgba(5, 11, 20, 0.96) 0%, rgba(3, 7, 14, 0.99) 100%) !important;
        border-top: 1px solid rgba(50, 255, 201, 0.2) !important;
        padding: 3rem 0 2rem 0 !important;
        margin-top: auto !important;
        color: var(--text, #e6f3ff) !important;
        font-family: "Prompt", sans-serif !important;
        position: relative !important;
        box-sizing: border-box !important;
        width: 100% !important;
      }

      footer.site-footer .container {
        width: min(1200px, calc(100% - 2.5rem)) !important;
        margin: 0 auto !important;
        padding: 0 !important;
        box-sizing: border-box !important;
      }

      .footer-status-strip {
        display: flex !important;
        align-items: center !important;
        justify-content: flex-start !important;
        margin-bottom: 2rem !important;
        padding-bottom: 1.5rem !important;
        border-bottom: 1px solid rgba(255, 255, 255, 0.08) !important;
      }

      .footer-stat-pill {
        display: inline-flex !important;
        align-items: center !important;
        gap: 0.55rem !important;
        background: rgba(34, 197, 94, 0.1) !important;
        border: 1px solid rgba(34, 197, 94, 0.35) !important;
        padding: 0.4rem 0.95rem !important;
        border-radius: 999px !important;
        font-size: 0.84rem !important;
        color: #d1fae5 !important;
        font-weight: 500 !important;
        box-shadow: 0 0 15px rgba(34, 197, 94, 0.15) !important;
      }

      .footer-stat-pill .pulse-dot {
        width: 9px !important;
        height: 9px !important;
        border-radius: 50% !important;
        background: #4ade80 !important;
        box-shadow: 0 0 10px #4ade80 !important;
        display: inline-block !important;
        animation: pulseGreen 1.8s infinite ease-in-out !important;
      }

      @keyframes pulseGreen {
        0% { transform: scale(0.95); box-shadow: 0 0 0 0 rgba(74, 222, 128, 0.7); }
        70% { transform: scale(1.1); box-shadow: 0 0 0 8px rgba(74, 222, 128, 0); }
        100% { transform: scale(0.95); box-shadow: 0 0 0 0 rgba(74, 222, 128, 0); }
      }

      .footer-links-grid {
        display: grid !important;
        grid-template-columns: 1.4fr 1fr 1fr 1fr !important;
        gap: 2.5rem !important;
        margin-bottom: 2.5rem !important;
        padding-top: 1rem !important;
        box-sizing: border-box !important;
      }

      @media (max-width: 1024px) {
        .footer-links-grid {
          grid-template-columns: repeat(2, 1fr) !important;
          gap: 2rem !important;
        }
      }

      @media (max-width: 640px) {
        .footer-links-grid {
          grid-template-columns: 1fr !important;
          gap: 1.8rem !important;
        }
      }

      .footer-col {
        display: flex !important;
        flex-direction: column !important;
        align-items: flex-start !important;
        box-sizing: border-box !important;
      }

      .footer-col.brand-col .brand {
        display: inline-flex !important;
        align-items: center !important;
        gap: 0.65rem !important;
        text-decoration: none !important;
        margin-bottom: 0.85rem !important;
      }

      .footer-col h4 {
        color: #fff !important;
        font-size: 1rem !important;
        font-weight: 700 !important;
        margin-top: 0 !important;
        margin-bottom: 1.1rem !important;
        display: flex !important;
        align-items: center !important;
        gap: 0.4rem !important;
        letter-spacing: 0.3px !important;
      }

      .footer-col a {
        display: inline-flex !important;
        align-items: center !important;
        color: var(--muted, #8aa9c7) !important;
        text-decoration: none !important;
        font-size: 0.88rem !important;
        margin-bottom: 0.6rem !important;
        transition: all 0.2s ease !important;
        background: transparent !important;
        border: none !important;
        padding: 0 !important;
      }

      .footer-col a:hover {
        color: var(--accent, #32ffc9) !important;
        transform: translateX(4px) !important;
        text-shadow: 0 0 10px rgba(50, 255, 201, 0.4) !important;
      }

      .footer-bottom {
        padding-top: 1.8rem !important;
        border-top: 1px solid rgba(255, 255, 255, 0.08) !important;
        display: flex !important;
        justify-content: space-between !important;
        align-items: center !important;
        flex-wrap: wrap !important;
        gap: 1rem !important;
        font-size: 0.85rem !important;
        color: var(--muted, #8aa9c7) !important;
        box-sizing: border-box !important;
      }

      /* ── Universal Global Cyber Toast & Popup System (Zero native alert()) ── */
      .bcx-toast-container {
        position: fixed;
        bottom: 24px;
        right: 24px;
        z-index: 1000000;
        display: flex;
        flex-direction: column;
        gap: 10px;
        pointer-events: none;
        max-width: calc(100vw - 32px);
      }
      .bcx-toast-card {
        pointer-events: auto;
        min-width: 280px;
        max-width: 440px;
        background: linear-gradient(135deg, rgba(8, 24, 46, 0.98), rgba(4, 12, 24, 0.98));
        border: 1px solid rgba(50, 255, 201, 0.35);
        border-radius: 14px;
        padding: 0.9rem 1.2rem;
        color: #fff;
        font-family: 'Prompt', sans-serif;
        box-shadow: 0 15px 45px rgba(0, 0, 0, 0.8), 0 0 15px rgba(50, 255, 201, 0.15);
        backdrop-filter: blur(16px);
        -webkit-backdrop-filter: blur(16px);
        display: flex;
        align-items: flex-start;
        gap: 0.8rem;
        transform: translateY(20px) scale(0.95);
        opacity: 0;
        transition: all 0.3s cubic-bezier(0.16, 1, 0.3, 1);
      }
      .bcx-toast-card.is-visible {
        transform: translateY(0) scale(1);
        opacity: 1;
      }
      .bcx-toast-card.success { border-color: #10b981; box-shadow: 0 10px 30px rgba(16,185,129,0.25); }
      .bcx-toast-card.error { border-color: #ef4444; box-shadow: 0 10px 30px rgba(239,68,68,0.25); }
      .bcx-toast-card.warning { border-color: #f59e0b; box-shadow: 0 10px 30px rgba(245,158,11,0.25); }
      .bcx-toast-icon { font-size: 1.3rem; flex-shrink: 0; line-height: 1; margin-top: 2px; }
      .bcx-toast-content { flex: 1; }
      .bcx-toast-title { font-weight: 700; font-size: 0.92rem; color: #32ffc9; margin-bottom: 0.2rem; line-height: 1.3; }
      .bcx-toast-card.error .bcx-toast-title { color: #f87171; }
      .bcx-toast-card.warning .bcx-toast-title { color: #fbbf24; }
      .bcx-toast-card.success .bcx-toast-title { color: #4ade80; }
      .bcx-toast-body { font-size: 0.84rem; color: #cbd5e1; line-height: 1.45; word-break: break-word; white-space: pre-wrap; }
      .bcx-toast-close { background: none; border: none; color: #94a3b8; cursor: pointer; font-size: 1rem; padding: 0; margin-left: 0.4rem; line-height: 1; }
      .bcx-toast-close:hover { color: #fff; }
    `;
    document.head.appendChild(style);
  };

  // Universal Cyber Notification Toast Engine
  const showCyberToast = (titleOrMsg, body = '', type = 'info') => {
    let container = document.getElementById('bcxGlobalToastContainer');
    if (!container) {
      container = document.createElement('div');
      container.id = 'bcxGlobalToastContainer';
      container.className = 'bcx-toast-container';
      document.body.appendChild(container);
    }

    let title = titleOrMsg;
    let text = body;
    if (!body && titleOrMsg) {
      if (titleOrMsg.includes('\n')) {
        const parts = titleOrMsg.split('\n');
        title = parts[0];
        text = parts.slice(1).join('\n').trim();
      } else {
        text = titleOrMsg;
        title = type === 'error' ? 'แจ้งเตือนข้อผิดพลาด' : type === 'success' ? 'ดำเนินการสำเร็จ' : type === 'warning' ? 'คำเตือน' : 'การแจ้งเตือน';
      }
    }

    const toast = document.createElement('div');
    const icon = type === 'success' ? '✅' : type === 'error' ? '❌' : type === 'warning' ? '⚠️' : '⚡';
    toast.className = `bcx-toast-card ${type}`;
    toast.innerHTML = `
      <div class="bcx-toast-icon">${icon}</div>
      <div class="bcx-toast-content">
        <div class="bcx-toast-title">${title}</div>
        ${text ? `<div class="bcx-toast-body">${text}</div>` : ''}
      </div>
      <button type="button" class="bcx-toast-close" title="ปิด">✕</button>
    `;

    toast.querySelector('.bcx-toast-close').onclick = () => {
      toast.classList.remove('is-visible');
      setTimeout(() => toast.remove(), 300);
    };

    container.appendChild(toast);
    requestAnimationFrame(() => toast.classList.add('is-visible'));

    setTimeout(() => {
      if (toast.parentElement) {
        toast.classList.remove('is-visible');
        setTimeout(() => toast.remove(), 300);
      }
    }, 4500);
  };

  window.showCyberToast = showCyberToast;
  window.showToast = showCyberToast;

  // OVERRIDE NATIVE WINDOW.ALERT GLOBALLY (GUARANTEES 100% NON-BLOCKING CYBER TOAST ACROSS ENTIRE SYSTEM)
  window.alert = function (message) {
    const msgStr = String(message || '');
    let type = 'info';
    if (msgStr.includes('❌') || msgStr.includes('ไม่สำเร็จ') || msgStr.includes('Error') || msgStr.includes('ผิดพลาด') || msgStr.includes('⛔') || msgStr.includes('สงวนสิทธิ์')) {
      type = 'error';
    } else if (msgStr.includes('⚠️') || msgStr.includes('ระวัง') || msgStr.includes('กรุณา')) {
      type = 'warning';
    } else if (msgStr.includes('✓') || msgStr.includes('สำเร็จ') || msgStr.includes('✅') || msgStr.includes('เรียบร้อย')) {
      type = 'success';
    }
    showCyberToast('', msgStr, type);
  };

  // 1. Mount Global Shared Footer with Auto Year & Responsive Columns
  const mountSharedFooter = () => {
    let existingFooter = document.querySelector('footer');
    if (!existingFooter) return;

    // Move to body if trapped inside an inner container
    if (existingFooter.parentElement && existingFooter.parentElement !== document.body) {
      document.body.appendChild(existingFooter);
    }

    existingFooter.removeAttribute('style');
    existingFooter.className = 'site-footer';
    existingFooter.innerHTML = `
      <div class="container footer-links-grid">
        <div class="footer-col brand-col">
          <a href="/" class="brand" style="text-decoration: none; margin-bottom: 0.85rem; display: inline-flex; align-items: center; gap: 0.65rem;">
            <img src="/assets/photo/bcxlogo2.png" alt="Logo" style="width: 38px; height: 38px; border-radius: 50%; border: 2px solid var(--accent, #32ffc9);" />
            <span style="font-family: 'Chakra Petch', sans-serif; font-weight: 700; color: #fff; font-size: 1.15rem;">BESTCYNIX DEV</span>
          </a>
          <p style="font-size: 0.88rem; color: var(--muted, #8aa9c7); line-height: 1.6; margin: 0 0 1.1rem 0; text-align: left;">
            สร้างสรรค์ระบบ Discord Bot, ระบบเว็บ และ Full-Stack Architecture ประสิทธิภาพสูง ปลอดภัย และเสถียรภาพระดับโปรดักชัน
          </p>
          <div class="footer-stat-pill">
            <span class="pulse-dot"></span>
            <span>สถานะระบบ:</span>
            <strong class="stat-pill-val" style="color: #4ade80;">100% Online</strong>
          </div>
        </div>

        <div class="footer-col">
          <h4>🌐 ระบบและบริการ</h4>
          <a href="/alliance" style="color:#32ffc9 !important;font-weight:700;">⭐ บริการโฮสติ้งแนะนำ (Alliance)</a>
          <a href="/shopeedeals" style="color:#ff7a5c !important;font-weight:700;">🟠 ดีลสินค้า Shopee</a>
          <a href="/lazadadeals" style="color:#38bdf8 !important;font-weight:700;">🔵 ดีลสินค้า Lazada</a>
          <a href="/deals">🛍️ ศูนย์รวมดีลทั้งหมด (Hub)</a>
          <a href="/#projects">โปรเจกต์และผลงาน</a>
          <a href="/#skills">สแต็กเทคโนโลยี</a>
          <a href="/status">สถานะระบบ (System Status)</a>
          <a href="javascript:void(0)" id="footerLiveChatLink">แชทสดติดต่อ Dev</a>
          <a href="/http-errors">HTTP Error Codes Center</a>
        </div>

        <div class="footer-col">
          <h4>🔒 นโยบายและความปลอดภัย</h4>
          <a href="/docs">📚 ศูนย์เอกสารและนโยบาย</a>
          <a href="/work-policy">นโยบายการร่วมทีม (Work Policy)</a>
          <a href="/privacy">นโยบายความเป็นส่วนตัว</a>
          <a href="/terms">ข้อตกลงการใช้งาน</a>
          <a href="/cookies">การจัดการคุกกี้</a>
          <a href="/pdpa">ข้อมูลกฎหมาย PDPA</a>
        </div>

        <div class="footer-col">
          <h4>🗺️ แผนผังเว็บไซต์ & บัญชี</h4>
          <a href="/join-team">🚀 สมัครร่วมทีม (Join Team)</a>
          <a href="/status">🟢 สถานะระบบ (Status)</a>
          <a href="/login">เข้าสู่ระบบสมาชิก</a>
          <a href="/register">สมัครสมาชิกใหม่</a>
          <a href="/profile">โปรไฟล์ของฉัน</a>
        </div>
      </div>

      <div class="container footer-bottom">
        <p style="margin:0;">© 2021 - <span id="sharedCopyrightYear">${currentYear}</span> BestCyniX Dev. All rights reserved.</p>
        <div style="display: flex; gap: 1rem; align-items: center;">
          <span style="color: var(--accent, #32ffc9); font-size: 0.85rem; font-weight: 500;">🛡️ Protected by Cloudflare DDoS & SSL 256-bit</span>
        </div>
      </div>
    `;

    // Connect footer live chat link
    document.getElementById('footerLiveChatLink')?.addEventListener('click', () => {
      const launcher = document.getElementById('btnLiveChatLauncher');
      if (launcher) launcher.click();
    });
  };

  // 2. Cookie Modal Management (Full PDPA Toggles & Bug-free Stacking)
  const openCookieModal = () => {
    const modal = document.getElementById('cookiePreferencesModal');
    const banner = document.getElementById('pdpaBanner');
    if (banner) banner.classList.add('is-hidden-by-modal'); // Hide banner so they don't overlap

    if (modal) {
      // Sync stored toggle values
      try {
        const analytics = localStorage.getItem('bcx_cookie_analytics');
        const marketing = localStorage.getItem('bcx_cookie_marketing');
        const preferences = localStorage.getItem('bcx_cookie_preferences');

        if (document.getElementById('cookieToggleAnalytics')) {
          document.getElementById('cookieToggleAnalytics').checked = analytics !== 'false';
        }
        if (document.getElementById('cookieToggleMarketing')) {
          document.getElementById('cookieToggleMarketing').checked = marketing !== 'false';
        }
        if (document.getElementById('cookieTogglePreferences')) {
          document.getElementById('cookieTogglePreferences').checked = preferences !== 'false';
        }
      } catch (e) {}

      modal.classList.add('is-open');
      document.body.style.overflow = 'hidden';
    }
  };

  const closeCookieModal = () => {
    const modal = document.getElementById('cookiePreferencesModal');
    const banner = document.getElementById('pdpaBanner');
    if (modal) modal.classList.remove('is-open');
    document.body.style.overflow = '';

    // If user hasn't consented yet, restore banner
    let hasConsent = false;
    try {
      hasConsent = !!localStorage.getItem('bcx_pdpa_consent');
    } catch (e) {}

    if (banner) {
      banner.classList.remove('is-hidden-by-modal');
      if (!hasConsent) {
        banner.classList.add('is-visible');
      } else {
        banner.classList.remove('is-visible');
      }
    }
  };

  const mountCookieModal = () => {
    let modalDiv = document.getElementById('cookiePreferencesModal');
    if (!modalDiv) {
      modalDiv = document.createElement('div');
      modalDiv.className = 'cyber-modal';
      modalDiv.id = 'cookiePreferencesModal';
      modalDiv.innerHTML = `
        <div class="cyber-modal-card">
          <div class="cyber-modal-header">
            <h3 style="color: #fff; font-size: 1.15rem; font-weight: 800; margin: 0; font-family:'Chakra Petch', sans-serif;">🍪 ศูนย์ตั้งค่าความเป็นส่วนตัวและคุกกี้</h3>
            <button type="button" class="cyber-modal-close" id="btnCloseCookieModal" aria-label="ปิด">✕</button>
          </div>
          
          <p style="font-size: 0.85rem; color: #94a3b8; line-height: 1.6; margin: 0 0 1rem 0;">
            เราให้ความสำคัญกับสิทธิและความเป็นส่วนตัวของคุณตาม พ.ร.บ. คุ้มครองข้อมูลส่วนบุคคล (PDPA) คุณสามารถเลือกเปิดหรือปิดคุกกี้แต่ละประเภทได้ตามความต้องการ
          </p>

          <!-- Cookie Categories List with Toggles -->
          <div class="cookie-options-list">
            <!-- 1. Necessary -->
            <div class="cookie-option-card">
              <div class="cookie-option-header">
                <span class="cookie-option-title">🛡️ คุกกี้ที่จำเป็นอย่างยิ่ง (Strictly Necessary)</span>
                <span class="cookie-badge-always">เปิดใช้งานเสมอ</span>
              </div>
              <p class="cookie-option-desc">จำเป็นสำหรับการทำงานพื้นฐานของเว็บไซต์ ระบบรักษาความปลอดภัย การเข้าสู่ระบบ และการนำทาง ไม่สามารถปิดได้</p>
            </div>

            <!-- 2. Analytics -->
            <div class="cookie-option-card">
              <div class="cookie-option-header">
                <label for="cookieToggleAnalytics" class="cookie-option-title" style="cursor: pointer;">📊 คุกกี้เพื่อการวิเคราะห์และวัดผล (Analytics)</label>
                <label class="cyber-switch">
                  <input type="checkbox" id="cookieToggleAnalytics" checked />
                  <span class="cyber-slider"></span>
                </label>
              </div>
              <p class="cookie-option-desc">ช่วยให้เราเข้าใจพฤติกรรมการใช้งานของผู้เข้าชม เพื่อนำไปพัฒนาและปรับปรุงประสิทธิภาพของเว็บไซต์ให้ดียิ่งขึ้น</p>
            </div>

            <!-- 3. Marketing & Affiliate -->
            <div class="cookie-option-card">
              <div class="cookie-option-header">
                <label for="cookieToggleMarketing" class="cookie-option-title" style="cursor: pointer;">🎯 คุกกี้เพื่อการตลาดและพันธมิตร (Marketing & Affiliate)</label>
                <label class="cyber-switch">
                  <input type="checkbox" id="cookieToggleMarketing" checked />
                  <span class="cyber-slider"></span>
                </label>
              </div>
              <p class="cookie-option-desc">จดจำการคลิกข้อเสนอพิเศษ ลิงก์ดีล Shopee, Lazada, GoWabi, Agoda, B2S และบริการโฮสติ้ง เพื่อมอบสิทธิประโยชน์สูงสุด</p>
            </div>

            <!-- 4. Preferences -->
            <div class="cookie-option-card">
              <div class="cookie-option-header">
                <label for="cookieTogglePreferences" class="cookie-option-title" style="cursor: pointer;">✨ คุกกี้จดจำการตั้งค่า (Preferences)</label>
                <label class="cyber-switch">
                  <input type="checkbox" id="cookieTogglePreferences" checked />
                  <span class="cyber-slider"></span>
                </label>
              </div>
              <p class="cookie-option-desc">จดจำการตั้งค่าส่วนบุคคล เช่น ธีม, เสียงแจ้งเตือน, ภาษา, และสถานะการใช้งาน เพื่อความสะดวกในการเข้าชมครั้งต่อไป</p>
            </div>
          </div>

          <!-- Actions -->
          <div style="display: flex; gap: 0.6rem; justify-content: flex-end; flex-wrap: wrap;">
            <button type="button" class="btn-cookie-action btn-essential" id="btnModalEssentialOnly">เฉพาะที่จำเป็น</button>
            <button type="button" class="btn-cookie-action btn-save" id="btnModalSavePreferences">💾 บันทึกการตั้งค่า</button>
            <button type="button" class="btn-cookie-action btn-accept" id="btnModalAcceptAll">✨ ยอมรับทั้งหมด</button>
          </div>
        </div>
      `;
      document.body.appendChild(modalDiv);
    }

    // Attach Handlers
    document.getElementById('btnCloseCookieModal')?.addEventListener('click', closeCookieModal);
    modalDiv.addEventListener('click', (e) => {
      if (e.target === modalDiv) closeCookieModal();
    });

    const saveAndClose = (choice, options = {}) => {
      try {
        localStorage.setItem('bcx_pdpa_consent', choice);
        localStorage.setItem('bcx_cookie_analytics', options.analytics !== undefined ? options.analytics : 'true');
        localStorage.setItem('bcx_cookie_marketing', options.marketing !== undefined ? options.marketing : 'true');
        localStorage.setItem('bcx_cookie_preferences', options.preferences !== undefined ? options.preferences : 'true');
        localStorage.setItem('bcx_pdpa_time', new Date().toISOString());
      } catch (e) {}

      closeCookieModal();
      const banner = document.getElementById('pdpaBanner');
      if (banner) {
        banner.classList.remove('is-visible');
        banner.classList.remove('is-hidden-by-modal');
      }
    };

    document.getElementById('btnModalAcceptAll')?.addEventListener('click', () => {
      saveAndClose('all', { analytics: 'true', marketing: 'true', preferences: 'true' });
    });

    document.getElementById('btnModalEssentialOnly')?.addEventListener('click', () => {
      saveAndClose('essential', { analytics: 'false', marketing: 'false', preferences: 'false' });
    });

    document.getElementById('btnModalSavePreferences')?.addEventListener('click', () => {
      const analytics = document.getElementById('cookieToggleAnalytics')?.checked ? 'true' : 'false';
      const marketing = document.getElementById('cookieToggleMarketing')?.checked ? 'true' : 'false';
      const preferences = document.getElementById('cookieTogglePreferences')?.checked ? 'true' : 'false';
      saveAndClose('custom', { analytics, marketing, preferences });
    });
  };

  // 3. PDPA Consent Banner Management
  const mountPdpaBanner = () => {
    // Check if user already consented
    let hasConsent = false;
    try {
      hasConsent = !!localStorage.getItem('bcx_pdpa_consent');
    } catch (e) {}

    let pdpaDiv = document.getElementById('pdpaBanner');
    if (!pdpaDiv) {
      pdpaDiv = document.createElement('div');
      pdpaDiv.className = 'pdpa-banner';
      pdpaDiv.id = 'pdpaBanner';
      pdpaDiv.innerHTML = `
        <div class="pdpa-text">
          🔒 เว็บไซต์นี้ใช้คุกกี้เพื่อมอบประสบการณ์การใช้งานที่ดีที่สุดและพัฒนาความปลอดภัยตาม พ.ร.บ. คุ้มครองข้อมูลส่วนบุคคล (PDPA) 
          <a href="privacy" target="_blank">นโยบายความเป็นส่วนตัว</a> และ <a href="cookies" target="_blank">นโยบายคุกกี้</a>
        </div>
        <div class="pdpa-actions">
          <button type="button" class="btn-pdpa-settings" id="btnOpenCookieModal">⚙️ ตั้งค่าคุกกี้</button>
          <button type="button" class="btn-pdpa-reject" id="btnPdpaReject">เฉพาะที่จำเป็น</button>
          <button type="button" class="btn-pdpa-accept" id="btnPdpaAccept">ยอมรับทั้งหมด</button>
        </div>
      `;
      document.body.appendChild(pdpaDiv);
    }

    if (!hasConsent) {
      pdpaDiv.classList.add('is-visible');
    } else {
      pdpaDiv.classList.remove('is-visible');
    }

    // Attach Banner Handlers
    document.getElementById('btnOpenCookieModal')?.addEventListener('click', openCookieModal);

    document.getElementById('btnPdpaAccept')?.addEventListener('click', () => {
      try {
        localStorage.setItem('bcx_pdpa_consent', 'all');
        localStorage.setItem('bcx_pdpa_time', new Date().toISOString());
      } catch (e) {}
      pdpaDiv.classList.remove('is-visible');
    });

    document.getElementById('btnPdpaReject')?.addEventListener('click', () => {
      try {
        localStorage.setItem('bcx_pdpa_consent', 'essential');
        localStorage.setItem('bcx_pdpa_time', new Date().toISOString());
      } catch (e) {}
      pdpaDiv.classList.remove('is-visible');
    });
  };

  // 4. Update Copyright Year dynamically everywhere
  const updateAllCopyrightYears = () => {
    document.querySelectorAll('[id*="year"], [id*="Year"], .copyright-year').forEach((el) => {
      el.textContent = currentYear;
    });
  };

  // 6. Universal Cyber Hamburger & Mobile Drawer Manager (100% Bulletproof on Mobile)
  const initUniversalMobileDrawer = () => {
    const toggleButtons = document.querySelectorAll('.nav-toggle, #adminNavToggle, #navToggle');
    const siteNav = document.getElementById('siteNav');
    const adminDrawer = document.getElementById('adminNavDrawer') || document.querySelector('.mobile-nav-drawer');
    const adminOverlay = document.getElementById('adminDrawerOverlay') || document.querySelector('.mobile-drawer-overlay');
    const closeButtons = document.querySelectorAll('.btn-close-drawer, #adminBtnCloseDrawer');

    if (!toggleButtons.length && !siteNav && !adminDrawer) return;

    let isDrawerOpen = false;

    const setDrawerState = (open) => {
      isDrawerOpen = !!open;

      // Handle siteNav (Index & public pages)
      if (siteNav) {
        siteNav.setAttribute('data-open', isDrawerOpen ? 'true' : 'false');
      }

      // Handle admin / subpage slide drawer
      if (adminDrawer) {
        adminDrawer.classList.toggle('is-open', isDrawerOpen);
      }
      if (adminOverlay) {
        adminOverlay.classList.toggle('is-open', isDrawerOpen);
      }

      // Update all toggle buttons
      toggleButtons.forEach((btn) => {
        btn.classList.toggle('is-active', isDrawerOpen);
        btn.setAttribute('aria-expanded', isDrawerOpen ? 'true' : 'false');
      });

      // Prevent background scrolling when open on mobile
      if (isDrawerOpen) {
        document.body.style.overflow = 'hidden';
      } else {
        document.body.style.overflow = '';
      }
    };

    // Toggle button handler
    toggleButtons.forEach((btn) => {
      btn.onclick = (e) => {
        e.preventDefault();
        e.stopPropagation();
        setDrawerState(!isDrawerOpen);
      };
    });

    // Close button handler
    closeButtons.forEach((btn) => {
      btn.onclick = (e) => {
        e.preventDefault();
        e.stopPropagation();
        setDrawerState(false);
      };
    });

    // Overlay click
    if (adminOverlay) {
      adminOverlay.onclick = () => setDrawerState(false);
    }

    // Close when clicking any link inside siteNav or adminDrawer
    [siteNav, adminDrawer].forEach((drawer) => {
      if (!drawer) return;
      drawer.querySelectorAll('a').forEach((link) => {
        link.addEventListener('click', () => setDrawerState(false));
      });
    });

    // Close when clicking outside
    document.addEventListener('click', (e) => {
      if (!isDrawerOpen) return;
      let clickedInside = false;
      toggleButtons.forEach(b => { if (b.contains(e.target)) clickedInside = true; });
      if (siteNav && siteNav.contains(e.target)) clickedInside = true;
      if (adminDrawer && adminDrawer.contains(e.target)) clickedInside = true;

      if (!clickedInside) {
        setDrawerState(false);
      }
    });

    // Close on Escape key
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && isDrawerOpen) {
        setDrawerState(false);
      }
    });
  };

  // 7. PWA Service Worker Registration
  const registerServiceWorker = () => {
    if ('serviceWorker' in navigator) {
      window.addEventListener('load', () => {
        navigator.serviceWorker.register('/sw.js').catch(() => {});
      });
    }
  };

  // Initialize
  const init = () => {
    injectSharedStyles();
    mountSharedFooter();
    mountCookieModal();
    mountPdpaBanner();
    updateAllCopyrightYears();
    registerServiceWorker();
    initUniversalMobileDrawer();
    initUniversalScrollReveal();
  };

  // Universal Scroll Reveal Engine
  const initUniversalScrollReveal = () => {
    const runReveal = () => {
      const winH = window.innerHeight || document.documentElement.clientHeight || 800;
      document.querySelectorAll('.reveal-on-scroll:not(.is-revealed)').forEach((el) => {
        const rect = el.getBoundingClientRect();
        if (rect.top < winH + 150) {
          el.classList.add('is-revealed');
        }
      });

      if ('IntersectionObserver' in window) {
        const observer = new IntersectionObserver((entries) => {
          entries.forEach((entry) => {
            if (entry.isIntersecting) {
              entry.target.classList.add('is-revealed');
              observer.unobserve(entry.target);
            }
          });
        }, { threshold: 0.01, rootMargin: '0px 0px 100px 0px' });

        document.querySelectorAll('.reveal-on-scroll:not(.is-revealed)').forEach((el) => observer.observe(el));
      } else {
        document.querySelectorAll('.reveal-on-scroll').forEach((el) => el.classList.add('is-revealed'));
      }
    };

    window.triggerScrollReveal = runReveal;
    runReveal();
    setTimeout(runReveal, 50);
    setTimeout(runReveal, 200);
    setTimeout(runReveal, 600);
  };
  window.triggerScrollReveal = initUniversalScrollReveal;

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();



// ── Visper Host Affiliate Helper ───────────────────────────────────────────
window.copyVisperAffiliateLink = function(e) {
  if (e) e.preventDefault();
  const link = 'https://client.visperhost.net/order/forms/a/MTM4OTM=';
  if (navigator.clipboard && navigator.clipboard.writeText) {
    navigator.clipboard.writeText(link).then(() => {
      if (typeof showToast === 'function') {
        showToast('คัดลอกลิงก์แนะนำ Visper Host แล้ว! 📋', 'https://client.visperhost.net/order/forms/a/MTM4OTM=', 'success');
      } else {
        alert('คัดลอกลิงก์แนะนำเรียบร้อยแล้ว: ' + link);
      }
    }).catch(() => {
      prompt('คัดลอกลิงก์แนะนำ Visper Host ด้านล่างนี้:', link);
    });
  } else {
    prompt('คัดลอกลิงก์แนะนำ Visper Host ด้านล่างนี้:', link);
  }
};
