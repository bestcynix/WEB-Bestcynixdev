/**
 * BestCyniX Dev - Real-time Notification System & Management Center
 * Handles Notification Bell Button, Unread Badges, Notification Drawer,
 * Mark as Read, Delete, Direct Link Navigation, History Filter & Firestore Sync
 */

(function () {
  'use strict';

  let currentFilter = 'all'; // 'all', 'unread', 'history'
  let notificationsList = [];
  let currentUser = null;
  let isDevAdmin = false;
  let unsubscribeListeners = [];
  const selectedNotifIds = new Set();

  // Helper: Relative Time in Thai
  const timeAgoThai = (timestamp) => {
    if (!timestamp) return 'เมื่อสักครู่';
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    const now = new Date();
    const diffSec = Math.floor((now - date) / 1000);

    if (diffSec < 45) return 'เมื่อสักครู่';
    if (diffSec < 3600) return `${Math.floor(diffSec / 60)} นาทีที่แล้ว`;
    if (diffSec < 86400) return `${Math.floor(diffSec / 3600)} ชั่วโมงที่แล้ว`;
    if (diffSec < 604800) return `${Math.floor(diffSec / 86400)} วันที่แล้ว`;
    return date.toLocaleDateString('th-TH', { day: 'numeric', month: 'short', year: 'numeric' });
  };

  // 1. Inject Styles for Notification Center
  const injectNotificationStyles = () => {
    if (document.getElementById('bcxNotificationStyles')) return;
    const style = document.createElement('style');
    style.id = 'bcxNotificationStyles';
    style.textContent = `
      /* Notification Bell Button */
      .bcx-notif-bell-btn {
        position: relative;
        background: rgba(255, 255, 255, 0.06);
        border: 1px solid rgba(255, 255, 255, 0.12);
        color: #e6f3ff;
        width: 38px;
        height: 38px;
        border-radius: 50%;
        display: inline-flex;
        align-items: center;
        justify-content: center;
        cursor: pointer;
        transition: all 0.2s ease;
        font-size: 1.1rem;
        flex-shrink: 0;
        margin-right: 0.4rem;
      }
      .bcx-notif-bell-btn:hover {
        background: rgba(50, 255, 201, 0.15);
        border-color: var(--accent, #32ffc9);
        color: var(--accent, #32ffc9);
        transform: translateY(-1px);
      }
      .bcx-notif-badge {
        position: absolute;
        top: -3px;
        right: -3px;
        background: #ff5574;
        color: #fff;
        font-size: 0.7rem;
        font-weight: 800;
        font-family: 'Chakra Petch', sans-serif;
        min-width: 18px;
        height: 18px;
        border-radius: 999px;
        display: none;
        align-items: center;
        justify-content: center;
        padding: 0 4px;
        box-shadow: 0 0 10px rgba(255, 85, 116, 0.6);
        animation: pulseNotif 2s infinite;
      }
      .bcx-notif-badge.is-visible {
        display: flex !important;
      }
      @keyframes pulseNotif {
        0%, 100% { transform: scale(1); }
        50% { transform: scale(1.12); }
      }

      /* Notification Dropdown Drawer */
      .bcx-notif-drawer {
        position: fixed;
        top: 72px;
        right: 1.5rem;
        width: min(440px, calc(100vw - 2rem));
        max-height: calc(100vh - 90px);
        background: linear-gradient(165deg, rgba(8, 22, 42, 0.98), rgba(4, 10, 22, 0.98));
        backdrop-filter: blur(16px);
        -webkit-backdrop-filter: blur(16px);
        border: 1px solid rgba(50, 255, 201, 0.3);
        border-radius: 18px;
        box-shadow: 0 20px 60px rgba(0, 0, 0, 0.85);
        z-index: 100005;
        display: none;
        flex-direction: column;
        overflow: hidden;
        font-family: 'Prompt', sans-serif;
        animation: notifSlideDown 0.25s ease forwards;
      }
      .bcx-notif-drawer.is-open {
        display: flex !important;
      }
      @keyframes notifSlideDown {
        from { opacity: 0; transform: translateY(-10px); }
        to { opacity: 1; transform: translateY(0); }
      }

      /* Header */
      .bcx-notif-header {
        padding: 1.1rem 1.3rem;
        border-bottom: 1px solid rgba(255, 255, 255, 0.08);
        display: flex;
        align-items: center;
        justify-content: space-between;
        background: rgba(255, 255, 255, 0.02);
      }
      .bcx-notif-title {
        font-size: 1.05rem;
        font-weight: 700;
        color: #fff;
        display: flex;
        align-items: center;
        gap: 0.5rem;
      }
      .bcx-notif-header-actions {
        display: flex;
        gap: 0.4rem;
        align-items: center;
      }
      .bcx-notif-action-btn {
        background: rgba(255, 255, 255, 0.06);
        border: 1px solid rgba(255, 255, 255, 0.1);
        color: var(--muted, #8aa9c7);
        padding: 0.3rem 0.65rem;
        border-radius: 8px;
        font-size: 0.76rem;
        font-weight: 600;
        cursor: pointer;
        transition: all 0.2s ease;
        font-family: 'Prompt', sans-serif;
      }
      .bcx-notif-action-btn:hover {
        background: rgba(50, 255, 201, 0.15);
        border-color: var(--accent, #32ffc9);
        color: var(--accent, #32ffc9);
      }
      .bcx-notif-action-btn.danger:hover {
        background: rgba(255, 85, 116, 0.15);
        border-color: #ff5574;
        color: #ff5574;
      }


/* Notification Batch Selection Bar & Checkboxes */
.bcx-notif-batch-bar {
  display: none !important;
  align-items: center;
  justify-content: space-between;
  padding: 0.55rem 0.9rem;
  background: rgba(8, 28, 52, 0.96);
  border-bottom: 1px solid rgba(50, 255, 201, 0.3);
  font-size: 0.8rem;
  color: #e6f3ff;
  box-sizing: border-box;
}
.bcx-notif-batch-bar.is-active {
  display: flex !important;
}
.bcx-notif-batch-actions {
  display: flex;
  gap: 0.35rem;
  align-items: center;
}
.bcx-btn-batch {
  background: rgba(255, 255, 255, 0.08);
  border: 1px solid rgba(255, 255, 255, 0.15);
  color: #e6f3ff;
  padding: 0.25rem 0.55rem;
  border-radius: 6px;
  font-size: 0.72rem;
  font-weight: 700;
  cursor: pointer;
  font-family: 'Prompt', sans-serif;
  transition: all 0.15s ease;
}
.bcx-btn-batch:hover {
  background: var(--accent, #32ffc9);
  color: #050b14;
  border-color: var(--accent, #32ffc9);
}
.bcx-btn-batch.unread-btn {
  color: #ff70a6;
}
.bcx-btn-batch.unread-btn:hover {
  background: #ff70a6;
  color: #050b14;
}
.bcx-btn-batch.danger:hover {
  background: #ff5574;
  color: #fff;
  border-color: #ff5574;
}
.bcx-notif-checkbox {
  accent-color: var(--accent, #32ffc9);
  width: 16px;
  height: 16px;
  cursor: pointer;
  margin-top: 0.2rem;
  flex-shrink: 0;
}

      /* Tabs */
      .bcx-notif-tabs {
        display: flex;
        border-bottom: 1px solid rgba(255, 255, 255, 0.06);
        background: rgba(0, 0, 0, 0.2);
        padding: 0 0.5rem;
      }
      .bcx-notif-tab {
        flex: 1;
        padding: 0.65rem 0.5rem;
        text-align: center;
        background: transparent;
        border: none;
        border-bottom: 2px solid transparent;
        color: var(--muted, #8aa9c7);
        font-size: 0.82rem;
        font-weight: 600;
        cursor: pointer;
        transition: all 0.2s ease;
        font-family: 'Prompt', sans-serif;
      }
      .bcx-notif-tab.active {
        color: var(--accent, #32ffc9);
        border-bottom-color: var(--accent, #32ffc9);
        background: rgba(50, 255, 201, 0.04);
      }

      /* List Body */
      .bcx-notif-list {
        padding: 0.8rem;
        overflow-y: auto;
        max-height: 400px;
        display: flex;
        flex-direction: column;
        gap: 0.6rem;
      }
      .bcx-notif-item {
        background: rgba(255, 255, 255, 0.03);
        border: 1px solid rgba(255, 255, 255, 0.06);
        border-radius: 12px;
        padding: 0.85rem 1rem;
        display: flex;
        gap: 0.85rem;
        align-items: flex-start;
        transition: all 0.2s ease;
        position: relative;
      }
      .bcx-notif-item.unread {
        background: rgba(50, 255, 201, 0.06);
        border-color: rgba(50, 255, 201, 0.25);
      }
      .bcx-notif-item:hover {
        background: rgba(255, 255, 255, 0.06);
        border-color: rgba(255, 255, 255, 0.15);
      }
      .bcx-notif-icon {
        width: 36px;
        height: 36px;
        border-radius: 10px;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 1.15rem;
        flex-shrink: 0;
        background: rgba(50, 255, 201, 0.12);
        color: var(--accent, #32ffc9);
        border: 1px solid rgba(50, 255, 201, 0.25);
      }
      .bcx-notif-icon.application {
        background: rgba(255, 112, 166, 0.15);
        color: #ff70a6;
        border-color: rgba(255, 112, 166, 0.35);
      }
      .bcx-notif-icon.chat {
        background: rgba(2, 132, 199, 0.15);
        color: #38bdf8;
        border-color: rgba(2, 132, 199, 0.35);
      }
      .bcx-notif-icon.security {
        background: rgba(234, 179, 8, 0.15);
        color: #facc15;
        border-color: rgba(234, 179, 8, 0.35);
      }
      .bcx-notif-content {
        flex: 1;
        min-width: 0;
      }
      .bcx-notif-item-title {
        font-size: 0.88rem;
        font-weight: 700;
        color: #fff;
        line-height: 1.4;
        margin-bottom: 0.2rem;
      }
      .bcx-notif-item-desc {
        font-size: 0.82rem;
        color: var(--muted, #8aa9c7);
        line-height: 1.55;
        margin-bottom: 0.45rem;
        word-break: break-word;
      }
      .bcx-notif-desc-text {
        white-space: pre-line;
        line-height: 1.55;
        color: #cbd5e1;
      }
      .bcx-notif-desc-text.is-clamped {
        display: -webkit-box;
        -webkit-line-clamp: 3;
        -webkit-box-orient: vertical;
        overflow: hidden;
      }
      .bcx-btn-expand-notif {
        background: rgba(50, 255, 201, 0.08);
        border: 1px solid rgba(50, 255, 201, 0.25);
        color: var(--accent, #32ffc9);
        font-size: 0.72rem;
        font-weight: 700;
        cursor: pointer;
        padding: 0.15rem 0.5rem;
        border-radius: 5px;
        margin-top: 0.35rem;
        display: inline-flex;
        align-items: center;
        gap: 0.25rem;
        transition: all 0.15s ease;
      }
      .bcx-btn-expand-notif:hover {
        background: var(--accent, #32ffc9);
        color: #050b14;
      }
      .bcx-notif-item-footer {
        display: flex;
        align-items: center;
        justify-content: space-between;
        flex-wrap: wrap;
        gap: 0.4rem;
      }
      .bcx-notif-time {
        font-size: 0.74rem;
        color: rgba(255, 255, 255, 0.4);
      }
      .bcx-notif-item-actions {
        display: flex;
        gap: 0.35rem;
        align-items: center;
      }
      .bcx-btn-item-action {
        background: rgba(255, 255, 255, 0.05);
        border: 1px solid rgba(255, 255, 255, 0.1);
        color: #d1e5f8;
        padding: 0.2rem 0.55rem;
        border-radius: 6px;
        font-size: 0.72rem;
        font-weight: 600;
        cursor: pointer;
        transition: all 0.15s ease;
        text-decoration: none;
        display: inline-flex;
        align-items: center;
        gap: 0.25rem;
      }
      .bcx-btn-item-action:hover {
        background: var(--accent, #32ffc9);
        color: #050b14;
        border-color: var(--accent, #32ffc9);
      }
      .bcx-btn-item-action.delete:hover {
        background: #ff5574;
        color: #fff;
        border-color: #ff5574;
      }
      .bcx-btn-item-action.mark-read:hover {
        background: #10b981;
        color: #fff;
        border-color: #10b981;
      }

      /* Responsive Drawer */
      @media (max-width: 600px) {
        .bcx-notif-drawer {
          top: 64px;
          right: 0.75rem;
          left: 0.75rem;
          width: auto;
          max-width: calc(100vw - 1.5rem);
          max-height: calc(100vh - 80px);
        }
        .bcx-notif-header {
          padding: 0.9rem 1rem;
        }
      }

      /* Empty State */
      .bcx-notif-empty {
        padding: 2.5rem 1.5rem;
        text-align: center;
        color: var(--muted, #8aa9c7);
      }
      .bcx-notif-empty-icon {
        font-size: 2.4rem;
        margin-bottom: 0.6rem;
      }
      .bcx-notif-empty-title {
        font-size: 0.95rem;
        font-weight: 700;
        color: #fff;
        margin-bottom: 0.3rem;
      }
      .bcx-notif-empty-desc {
        font-size: 0.8rem;
        line-height: 1.5;
      }
    `;
    document.head.appendChild(style);
  };

  // 2. Mount Bell Button & Notification Drawer into DOM
  const mountNotificationUI = () => {
    injectNotificationStyles();

    // 2a. Mount Bell Button in Topbar (if not already mounted)
    let bellBtn = document.getElementById('btnNotificationBell');
    if (!bellBtn) {
      bellBtn = document.createElement('button');
      bellBtn.type = 'button';
      bellBtn.id = 'btnNotificationBell';
      bellBtn.className = 'bcx-notif-bell-btn';
      bellBtn.setAttribute('aria-label', 'เปิดการแจ้งเตือน');
      bellBtn.setAttribute('title', 'การแจ้งเตือน (Notifications)');
      bellBtn.style.cssText = 'display: inline-flex !important; align-items: center !important; justify-content: center !important; flex-shrink: 0 !important; width: 38px !important; height: 38px !important; min-width: 38px !important; min-height: 38px !important; background: rgba(255,255,255,0.06) !important; border: 1px solid rgba(255,255,255,0.15) !important; border-radius: 10px !important; cursor: pointer !important; font-size: 1.1rem !important; margin: 0 !important; padding: 0 !important; line-height: 1 !important; position: relative !important; z-index: 10005 !important;';
      bellBtn.innerHTML = `
        <span style="font-size: 1.15rem; line-height: 1; pointer-events: none;">🔔</span>
        <span class="bcx-notif-badge" id="notifBadgeCount">0</span>
      `;

      // Insert bell cleanly into right actions container
      const navActions = document.querySelector('.nav-right-cluster') || document.querySelector('.topbar-actions') || document.querySelector('.nav-actions') || document.querySelector('.nav-links');
      if (navActions) {
        navActions.style.display = 'flex';
        navActions.style.alignItems = 'center';
        navActions.style.flexWrap = 'nowrap';
        navActions.style.gap = '0.6rem';
        navActions.style.marginLeft = 'auto';

        const toggleBtn = navActions.querySelector('.nav-toggle') || document.getElementById('adminNavToggle');
        const userWrap = document.getElementById('userPillWrap') || document.getElementById('navAuthWrap');
        if (toggleBtn && toggleBtn.parentElement === navActions) {
          navActions.insertBefore(bellBtn, toggleBtn);
        } else if (userWrap && userWrap.parentElement === navActions) {
          navActions.insertBefore(bellBtn, userWrap);
        } else {
          navActions.prepend(bellBtn);
        }
      } else {
        const topNav = document.querySelector('.top-nav') || document.querySelector('header nav');
        if (topNav) {
          topNav.appendChild(bellBtn);
        }
      }
    }

    // 2b. Mount Notification Drawer Container
    let drawer = document.getElementById('notificationDrawer');
    if (!drawer) {
      drawer = document.createElement('div');
      drawer.id = 'notificationDrawer';
      drawer.className = 'bcx-notif-drawer';
      drawer.innerHTML = `
        <div class="bcx-notif-header">
          <div class="bcx-notif-title">
            <span>🔔</span>
            <span>การแจ้งเตือน</span>
          </div>
          <div class="bcx-notif-header-actions">
            <button type="button" class="bcx-notif-action-btn" id="btnToggleNotifSound" title="เปิด/ปิดเสียงแจ้งเตือน">${localStorage.getItem('bcx_sound_enabled') === 'false' ? '🔇 เสียง: ปิด' : '🔊 เสียง: เปิด'}</button>
            <button type="button" class="bcx-notif-action-btn" id="btnMarkAllNotifsRead" title="ทำเครื่องหมายว่าอ่านแล้วทั้งหมด">✓ อ่านทั้งหมด</button>
            <button type="button" class="bcx-notif-action-btn danger" id="btnClearAllNotifs" title="ลบการแจ้งเตือนทั้งหมด">🗑️ ลบทั้งหมด</button>
          </div>
        </div>

        <div class="bcx-push-permission-banner" id="bcxPushBanner" style="display: none; padding: 0.65rem 1rem; background: rgba(50, 255, 201, 0.08); border-bottom: 1px solid rgba(50, 255, 201, 0.2); font-size: 0.78rem; align-items: center; justify-content: space-between; gap: 0.6rem;">
          <div style="color: #e6f3ff;">
            <strong style="color: var(--accent, #32ffc9);">📲 แจ้งเตือนบนอุปกรณ์:</strong> เปิดรับแจ้งเตือนสดแม้ปิดเว็บ
          </div>
          <button type="button" class="bcx-notif-action-btn" id="btnRequestPushPermission" style="background: #32ffc9; color: #050b14; font-weight: 700; border: none; white-space: nowrap; cursor: pointer;">เปิดใช้งาน</button>
        </div>

        <div class="bcx-notif-tabs" style="justify-content:space-between;">
          <div style="display:flex;gap:0.3rem;">
            <button type="button" class="bcx-notif-tab active" data-tab="all">📌 ทั้งหมด</button>
            <button type="button" class="bcx-notif-tab" data-tab="unread">🔴 ยังไม่อ่าน</button>
            <button type="button" class="bcx-notif-tab" data-tab="history">📜 ประวัติ</button>
          </div>
          <label style="display:inline-flex;align-items:center;gap:0.35rem;font-size:0.75rem;color:#94a3b8;cursor:pointer;padding-right:0.4rem;">
            <input type="checkbox" id="chkSelectAllNotifs" onchange="window._handleSelectAllNotifs(this.checked)" style="accent-color:var(--accent);" />
            <span>เลือกทั้งหมด</span>
          </label>
        </div>

        <!-- Batch Selection Toolbar -->
        <div class="bcx-notif-batch-bar" id="bcxBatchNotifBar" style="display: none;">
          <div>เลือกแล้ว <strong id="bcxSelectedCount" style="color:var(--accent);">0</strong> รายการ:</div>
          <div class="bcx-notif-batch-actions">
            <button type="button" class="bcx-btn-batch" onclick="window._handleBatchAction('read')">✓ อ่านแล้ว</button>
            <button type="button" class="bcx-btn-batch unread-btn" onclick="window._handleBatchAction('unread')">🔴 ยังไม่อ่าน</button>
            <button type="button" class="bcx-btn-batch danger" onclick="window._handleBatchAction('delete')">🗑️ ลบ</button>
            <button type="button" class="bcx-btn-batch" onclick="window._handleSelectAllNotifs(false)">✕</button>
          </div>
        </div>

        <div class="bcx-notif-list" id="notifListContainer">
          <div class="bcx-notif-empty">
            <div class="bcx-notif-empty-icon">⏳</div>
            <div class="bcx-notif-empty-title">กำลังโหลดการแจ้งเตือน...</div>
          </div>
        </div>
      `;
      document.body.appendChild(drawer);

      // Sound toggle handler
      document.getElementById('btnToggleNotifSound')?.addEventListener('click', () => {
        const current = localStorage.getItem('bcx_sound_enabled') !== 'false';
        const next = !current;
        localStorage.setItem('bcx_sound_enabled', next ? 'true' : 'false');
        const btn = document.getElementById('btnToggleNotifSound');
        if (btn) btn.textContent = next ? '🔊 เสียง: เปิด' : '🔇 เสียง: ปิด';
        if (next) {
          playCyberNotificationChime();
          showToast('เปิดเสียงการแจ้งเตือนแล้ว 🔊', '', 'info');
        } else {
          showToast('ปิดเสียงการแจ้งเตือนแล้ว 🔇', '', 'info');
        }
      });

      // Check Push Permission state
      if ('Notification' in window && Notification.permission !== 'granted' && Notification.permission !== 'denied') {
        const pushBanner = document.getElementById('bcxPushBanner');
        if (pushBanner) pushBanner.style.display = 'flex';
      }

      document.getElementById('btnRequestPushPermission')?.addEventListener('click', async () => {
        if (!('Notification' in window)) {
          showCyberToast('เบราว์เซอร์นี้ไม่รองรับการแจ้งเตือน Native Notifications', '', 'warning');
          return;
        }
        const perm = await Notification.requestPermission();
        if (perm === 'granted') {
          const pushBanner = document.getElementById('bcxPushBanner');
          if (pushBanner) pushBanner.style.display = 'none';
          triggerNativeBrowserNotification('🎉 เปิดการแจ้งเตือนสำเร็จ!', 'ระบบ BestCyniX Dev จะแจ้งเตือนคุณทันทีเมื่อมีข่าวสาร สัญญา หรือข้อความใหม่', '/');
        }
      });
    }

    const triggerNativeBrowserNotification = (title, body, url) => {
      if (!('Notification' in window)) return;
      if (Notification.permission === 'granted') {
        try {
          const notif = new Notification(title || '⚡ BestCyniX Dev Alert', {
            body: body || 'มีการอัปเดตใหม่ในระบบ',
            icon: '/assets/photo/bcxlogo2.png',
            badge: '/assets/photo/bcxlogo2.png',
            tag: 'bestcynix-alert-' + Date.now(),
            renotify: true
          });
          notif.onclick = () => {
            window.focus();
            if (url && url !== '/') window.location.href = url;
            notif.close();
          };
        } catch (err) {
          console.warn('Native notification trigger error:', err);
        }
      }
    };
    window.triggerNativeBrowserNotification = triggerNativeBrowserNotification;

    // 2c. Attach Event Handlers
    bellBtn.onclick = (e) => {
      e.stopPropagation();
      const isOpen = drawer.classList.toggle('is-open');
      if (isOpen && window.bringToFront) {
        window.bringToFront(drawer);
      }
    };

    document.addEventListener('click', (e) => {
      if (drawer && !drawer.contains(e.target) && e.target !== bellBtn && !bellBtn.contains(e.target)) {
        drawer.classList.remove('is-open');
      }
    });

    // Tab switching
    drawer.querySelectorAll('.bcx-notif-tab').forEach(tab => {
      tab.addEventListener('click', () => {
        drawer.querySelectorAll('.bcx-notif-tab').forEach(t => t.classList.remove('active'));
        tab.classList.add('active');
        currentFilter = tab.getAttribute('data-tab');
        renderNotificationsList();
      });
    });

    // Mark all as read
    document.getElementById('btnMarkAllNotifsRead')?.addEventListener('click', handleMarkAllRead);

    // Clear all
    document.getElementById('btnClearAllNotifs')?.addEventListener('click', handleClearAll);

    // Auto-bind Mobile Cyber Drawer if present on the page
    const adminToggle = document.getElementById('adminNavToggle');
    const adminDrawer = document.getElementById('adminNavDrawer');
    const adminOverlay = document.getElementById('adminDrawerOverlay');
    const adminClose = document.getElementById('adminBtnCloseDrawer');

    if (adminToggle && adminDrawer) {
      const toggleDrawer = (open) => {
        const isOpen = open !== undefined ? open : !adminDrawer.classList.contains('is-open');
        adminDrawer.classList.toggle('is-open', isOpen);
        if (adminOverlay) adminOverlay.classList.toggle('is-open', isOpen);
        adminToggle.classList.toggle('is-active', isOpen);
        adminToggle.setAttribute('aria-expanded', isOpen);
      };

      adminToggle.onclick = (e) => {
        e.stopPropagation();
        toggleDrawer();
      };
      if (adminClose) adminClose.onclick = () => toggleDrawer(false);
      if (adminOverlay) adminOverlay.onclick = () => toggleDrawer(false);
    }
  };

  
  const escapeNotifHtml = (str) => {
    if (!str) return '';
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  };

  const updateBatchToolbarState = () => {
    const bar = document.getElementById('bcxBatchNotifBar');
    const count = document.getElementById('bcxSelectedCount');
    const visibleIds = new Set(notificationsList.map(n => String(n.id)));
    selectedNotifIds.forEach(id => { if (!visibleIds.has(String(id))) selectedNotifIds.delete(id); });
    if (count) count.textContent = String(selectedNotifIds.size);
    if (bar) bar.classList.toggle('is-active', selectedNotifIds.size > 0);
  };

  window._handleNotifSelectChange = () => {
    document.querySelectorAll('.bcx-notif-checkbox').forEach((checkbox) => {
      const id = String(checkbox.dataset.id || '');
      if (checkbox.checked) selectedNotifIds.add(id);
      else selectedNotifIds.delete(id);
    });
    updateBatchToolbarState();
  };

  window._handleSelectAllNotifs = (checked) => {
    document.querySelectorAll('.bcx-notif-checkbox').forEach((checkbox) => { checkbox.checked = checked; });
    selectedNotifIds.clear();
    if (checked) notificationsList.forEach(n => selectedNotifIds.add(String(n.id)));
    updateBatchToolbarState();
  };

  window._handleBatchAction = async (action) => {
    const selected = notificationsList.filter(n => selectedNotifIds.has(String(n.id)));
    if (!selected.length) return;
    if (action === 'read') await Promise.all(selected.map(n => window._handleMarkSingleRead(n.id, n._col)));
    if (action === 'unread') await Promise.all(selected.map(n => window._handleMarkSingleUnread(n.id, n._col)));
    if (action === 'delete') await Promise.all(selected.map(n => window._handleDeleteSingleNotif(n.id, n._col)));
    selectedNotifIds.clear();
    updateBatchToolbarState();
  };

  window._toggleNotifExpand = (id, e) => {
    if (e) e.stopPropagation();
    const textEl = document.getElementById(`desc-text-${id}`);
    const lblEl = document.getElementById(`expand-lbl-${id}`);
    if (!textEl || !lblEl) return;
    const isClamped = textEl.classList.contains('is-clamped');
    if (isClamped) {
      textEl.classList.remove('is-clamped');
      lblEl.textContent = 'ย่อลง ▴';
    } else {
      textEl.classList.add('is-clamped');
      lblEl.textContent = 'ดูเพิ่มเติม ▾';
    }
  };

  // 3. Render Notifications
  const renderNotificationsList = () => {
    const container = document.getElementById('notifListContainer');
    const badge = document.getElementById('notifBadgeCount');
    if (!container) return;

    // Filter items
    let filtered = notificationsList;
    if (currentFilter === 'unread') {
      filtered = notificationsList.filter(n => !n.read);
    } else if (currentFilter === 'history') {
      filtered = notificationsList.filter(n => n.read);
    }

    // Update unread count badge
    const unreadCount = notificationsList.filter(n => !n.read).length;
    if (badge) {
      if (unreadCount > 0) {
        badge.textContent = unreadCount > 99 ? '99+' : unreadCount;
        badge.classList.add('is-visible');
      } else {
        badge.classList.remove('is-visible');
      }
    }

    if (!filtered.length) {
      let emptyTitle = 'ยังไม่มีการแจ้งเตือน';
      let emptyDesc = 'การแจ้งเตือนกิจกรรม เช่น ใบสมัครงานใหม่, ข้อความแชท และประกาศระบบ จะปรากฏที่นี่แบบเรียลไทม์';
      if (currentFilter === 'unread') {
        emptyTitle = 'อ่านครบทุกข้อความแล้ว';
        emptyDesc = 'ไม่มีการแจ้งเตือนที่ค้างอยู่ คุณสามารถดูรายการย้อนหลังได้ในแท็บ "📜 ประวัติ"';
      } else if (currentFilter === 'history') {
        emptyTitle = 'ยังไม่มีประวัติการแจ้งเตือน';
        emptyDesc = 'การแจ้งเตือนที่คุณอ่านแล้วจะถูกจัดเก็บไว้ที่นี่';
      }

      container.innerHTML = `
        <div class="bcx-notif-empty">
          <div class="bcx-notif-empty-icon">📭</div>
          <div class="bcx-notif-empty-title">${emptyTitle}</div>
          <div class="bcx-notif-empty-desc">${emptyDesc}</div>
        </div>
      `;
      return;
    }

    container.innerHTML = filtered.map((n) => {
      let icon = '📢';
      let iconClass = 'system';
      if (n.type === 'submitted' || n.type === 'application') {
        icon = '🚀';
        iconClass = 'application';
      } else if (n.type === 'approved') {
        icon = '✅';
        iconClass = 'application';
      } else if (n.type === 'rejected') {
        icon = '❌';
        iconClass = 'system';
      } else if (n.type === 'revision') {
        icon = '📝';
        iconClass = 'application';
      } else if (n.type === 'chat' || n.type === 'message') {
        icon = '💬';
        iconClass = 'chat';
      } else if (n.type === 'security' || n.type === 'auth') {
        icon = '🔐';
        iconClass = 'security';
      }

      const isUnread = !n.read;
      const targetUrl = n.url || (n.applicationId ? '/admin-join-team' : null);

      return `
        <div class="bcx-notif-item ${isUnread ? 'unread' : ''}" data-id="${n.id}" data-col="${n._col || 'notifications'}">
          <input type="checkbox" class="bcx-notif-checkbox" data-id="${n.id}" data-col="${n._col || 'notifications'}" onchange="window._handleNotifSelectChange()" />
          <div class="bcx-notif-icon ${iconClass}">${icon}</div>
          <div class="bcx-notif-content">
          <div class="bcx-notif-item-title">${escapeNotifHtml(n.title || (n.positionName ? `ใบสมัครใหม่: ${n.positionName}` : 'การแจ้งเตือน'))}</div>
            <div class="bcx-notif-item-desc">
              <div class="bcx-notif-desc-text ${(n.message && (n.message.length > 120 || n.message.includes('\n'))) ? 'is-clamped' : ''}" id="desc-text-${n.id}">${escapeNotifHtml(n.message || n.applicantName || '')}</div>
              ${(n.message && (n.message.length > 120 || n.message.includes('\n'))) ? `
                <button type="button" class="bcx-btn-expand-notif" onclick="window._toggleNotifExpand('${n.id}', event)">
                  <span id="expand-lbl-${n.id}">ดูเพิ่มเติม ▾</span>
                </button>
              ` : ''}
            </div>
            <div class="bcx-notif-item-footer">
              <span class="bcx-notif-time">${timeAgoThai(n.createdAt)}</span>
              <div class="bcx-notif-item-actions">
                ${targetUrl ? `
                  <a href="${targetUrl}" class="bcx-btn-item-action" onclick="window._handleNotifClick('${n.id}', '${n._col}')">
                    <span>🔗 ไปยังหน้านั้น</span>
                  </a>
                ` : ''}
                ${isUnread ? `
                  <button type="button" class="bcx-btn-item-action mark-read" onclick="window._handleMarkSingleRead('${n.id}', '${n._col}')" title="ทำเครื่องหมายว่าอ่านแล้ว">
                    <span>✓ อ่านแล้ว</span>
                  </button>
                ` : `
                  <button type="button" class="bcx-btn-item-action mark-unread" onclick="window._handleMarkSingleUnread('${n.id}', '${n._col}')" title="ทำเครื่องหมายว่ายังไม่อ่าน">
                    <span>🔴 ยังไม่อ่าน</span>
                  </button>
                `}
                <button type="button" class="bcx-btn-item-action delete" onclick="window._handleDeleteSingleNotif('${n.id}', '${n._col}')" title="ลบการแจ้งเตือนนี้">
                  <span>🗑️ ลบ</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      `;
    }).join('');
  };


  // ── 4. Unified Action Handlers (Single & Batch with Instant State Flip) ──

  window._handleMarkSingleRead = async (id, col) => {
    // 1. Instant optimistic UI update
    const target = notificationsList.find(n => String(n.id) === String(id));
    if (target) {
      target.read = true;
      renderNotificationsList();
    }

    if (id === 'welcome_notif') {
      try { localStorage.setItem('bcx_seen_welcome', 'true'); } catch (e) {}
      showToast('ทำเครื่องหมายว่าอ่านแล้ว ✅', '', 'success');
      return;
    }

    if (typeof firebase === 'undefined' || !firebase.firestore) {
      showToast('ทำเครื่องหมายว่าอ่านแล้ว ✅', '', 'success');
      return;
    }

    const db = firebase.firestore();
    try {
      if (col === 'joinTeamNotifications') {
        await db.collection('joinTeamNotifications').doc(id).update({ read: true }).catch(() => {});
      }
      if (currentUser) {
        await db.collection('users').doc(currentUser.uid).collection('notifications').doc(id).update({ read: true }).catch(() => {});
      }
      await db.collection('userNotifications').doc(id).update({ read: true }).catch(() => {});
      await db.collection('notifications').doc(id).update({ read: true }).catch(() => {});
      showToast('ทำเครื่องหมายว่าอ่านแล้ว ✅', '', 'success');
    } catch (e) {
      console.warn('Mark read error:', e);
    }
  };

  window._handleMarkSingleUnread = async (id, col) => {
    // 1. Instant optimistic UI update
    const target = notificationsList.find(n => String(n.id) === String(id));
    if (target) {
      target.read = false;
      renderNotificationsList();
    }

    if (id === 'welcome_notif') {
      try { localStorage.removeItem('bcx_seen_welcome'); } catch (e) {}
      showToast('ทำเครื่องหมายว่ายังไม่อ่าน 🔴', '', 'info');
      return;
    }

    if (typeof firebase === 'undefined' || !firebase.firestore) {
      showToast('ทำเครื่องหมายว่ายังไม่อ่าน 🔴', '', 'info');
      return;
    }

    const db = firebase.firestore();
    try {
      if (col === 'joinTeamNotifications') {
        await db.collection('joinTeamNotifications').doc(id).update({ read: false }).catch(() => {});
      }
      if (currentUser) {
        await db.collection('users').doc(currentUser.uid).collection('notifications').doc(id).update({ read: false }).catch(() => {});
      }
      await db.collection('userNotifications').doc(id).update({ read: false }).catch(() => {});
      await db.collection('notifications').doc(id).update({ read: false }).catch(() => {});
      showToast('ทำเครื่องหมายว่ายังไม่อ่าน 🔴', '', 'info');
    } catch (e) {
      console.warn('Mark unread error:', e);
    }
  };

  window._handleDeleteSingleNotif = async (id, col) => {
    // 1. Instant optimistic removal from UI
    notificationsList = notificationsList.filter(n => String(n.id) !== String(id));
    selectedNotifIds.delete(id);
    renderNotificationsList();
    updateBatchToolbarState();

    if (id === 'welcome_notif') {
      try { localStorage.setItem('bcx_deleted_welcome', 'true'); } catch (e) {}
      showToast('ลบการแจ้งเตือนแล้ว 🗑️', '', 'success');
      return;
    }

    if (typeof firebase === 'undefined' || !firebase.firestore) {
      showToast('ลบการแจ้งเตือนแล้ว 🗑️', '', 'success');
      return;
    }

    const db = firebase.firestore();
    try {
      if (col === 'joinTeamNotifications') {
        await db.collection('joinTeamNotifications').doc(id).delete().catch(() => {});
      }
      if (currentUser) {
        await db.collection('users').doc(currentUser.uid).collection('notifications').doc(id).delete().catch(() => {});
      }
      await db.collection('userNotifications').doc(id).delete().catch(() => {});
      await db.collection('notifications').doc(id).delete().catch(() => {});
      showToast('ลบการแจ้งเตือนแล้ว 🗑️', '', 'success');
    } catch (e) {
      console.warn('Delete notif error:', e);
    }
  };

  window._handleNotifClick = (id, col) => {
    window._handleMarkSingleRead(id, col);
    const drawer = document.getElementById('notificationDrawer');
    if (drawer) drawer.classList.remove('is-open');
  };

  const handleMarkAllRead = async () => {
    if (!notificationsList.length) return;
    notificationsList.forEach(n => n.read = true);
    renderNotificationsList();
    updateBatchToolbarState();

    try { localStorage.setItem('bcx_seen_welcome', 'true'); } catch (e) {}

    if (typeof firebase === 'undefined' || !firebase.firestore) {
      showToast('อ่านครบทุกรายการแล้ว ✅', '', 'success');
      return;
    }

    const db = firebase.firestore();
    const batch = db.batch();

    notificationsList.forEach(n => {
      if (n.id === 'welcome_notif') return;
      if (n._col === 'joinTeamNotifications') {
        batch.update(db.collection('joinTeamNotifications').doc(n.id), { read: true });
      }
      if (currentUser) {
        batch.update(db.collection('users').doc(currentUser.uid).collection('notifications').doc(n.id), { read: true });
      }
    });

    try {
      await batch.commit();
      showToast('อ่านครบทุกรายการแล้ว ✅', '', 'success');
    } catch (e) {
      console.warn('Batch mark read error:', e);
    }
  };

  const handleClearAll = async () => {
    if (!notificationsList.length) return;
    const confirmed = await showCyberConfirm('ลบการแจ้งเตือนทั้งหมด?', 'คุณต้องการล้างประวัติการแจ้งเตือนทั้งหมดในรายการใช่หรือไม่', 'ลบทั้งหมด', 'ยกเลิก', true);
    if (!confirmed) return;

    const toDelete = [...notificationsList];
    notificationsList = [];
    selectedNotifIds.clear();
    renderNotificationsList();
    updateBatchToolbarState();

    try { localStorage.setItem('bcx_deleted_welcome', 'true'); } catch (e) {}

    if (typeof firebase === 'undefined' || !firebase.firestore) {
      showToast('ล้างการแจ้งเตือนทั้งหมดแล้ว 🗑️', '', 'success');
      return;
    }

    const db = firebase.firestore();
    const batch = db.batch();

    toDelete.forEach(n => {
      if (n.id === 'welcome_notif') return;
      if (n._col === 'joinTeamNotifications') {
        batch.delete(db.collection('joinTeamNotifications').doc(n.id));
      }
      if (currentUser) {
        batch.delete(db.collection('users').doc(currentUser.uid).collection('notifications').doc(n.id));
      }
    });

    try {
      await batch.commit();
      showToast('ล้างการแจ้งเตือนทั้งหมดแล้ว 🗑️', '', 'success');
    } catch (e) {
      console.warn('Clear all error:', e);
    }
  };


  // Custom Cyber Confirmation Modal
  const showCyberConfirm = (title, message, confirmText = 'ตกลง', cancelText = 'ยกเลิก', isDanger = true) => {
    return new Promise((resolve) => {
      let modal = document.getElementById('bcxCyberConfirmModal');
      if (!modal) {
        modal = document.createElement('div');
        modal.id = 'bcxCyberConfirmModal';
        modal.className = 'cropper-modal';
        modal.style.cssText = 'position:fixed;inset:0;z-index:100010;background:rgba(0,0,0,0.85);backdrop-filter:blur(12px);display:none;align-items:center;justify-content:center;padding:1.5rem;';
        modal.innerHTML = `
          <div class="cropper-box" style="background:rgba(10,24,42,0.98);border:1px solid rgba(50,255,201,0.35);border-radius:20px;padding:2rem;width:min(440px,calc(100vw - 2rem));text-align:center;box-shadow:0 20px 60px rgba(0,0,0,0.85);display:flex;flex-direction:column;align-items:center;gap:1rem;">
            <div id="bcxConfirmIcon" style="font-size:2.6rem;margin-bottom:0.1rem;">⚠️</div>
            <h3 id="bcxConfirmTitle" style="color:#fff;font-size:1.2rem;font-weight:700;margin:0;">ยืนยัน</h3>
            <p id="bcxConfirmMessage" style="color:var(--muted,#8aa9c7);font-size:0.9rem;line-height:1.6;margin:0;"></p>
            <div style="display:flex;gap:0.8rem;width:100%;margin-top:0.5rem;">
              <button type="button" class="btn-nav-action" id="btnCyberConfirmCancel" style="flex:1;justify-content:center;padding:0.65rem;border-radius:10px;font-weight:600;background:rgba(255,255,255,0.08);color:#fff;border:1px solid rgba(255,255,255,0.15);cursor:pointer;">ยกเลิก</button>
              <button type="button" class="btn-save-profile" id="btnCyberConfirmOk" style="flex:1;justify-content:center;padding:0.65rem;border-radius:10px;font-weight:700;cursor:pointer;border:none;">ตกลง</button>
            </div>
          </div>
        `;
        document.body.appendChild(modal);
      }

      document.getElementById('bcxConfirmTitle').textContent = title;
      document.getElementById('bcxConfirmMessage').textContent = message;
      const okBtn = document.getElementById('btnCyberConfirmOk');
      const cancelBtn = document.getElementById('btnCyberConfirmCancel');
      okBtn.textContent = confirmText;
      cancelBtn.textContent = cancelText;

      if (isDanger) {
        okBtn.style.background = 'linear-gradient(135deg, #ef4444, #dc2626)';
        okBtn.style.color = '#fff';
      } else {
        okBtn.style.background = 'linear-gradient(135deg, var(--accent, #32ffc9), var(--accent-blue, #0284c7))';
        okBtn.style.color = '#050b14';
      }

      modal.style.display = 'flex';
      if (window.bringToFront) window.bringToFront(modal);

      const cleanup = () => {
        modal.style.display = 'none';
        okBtn.onclick = null;
        cancelBtn.onclick = null;
      };

      okBtn.onclick = () => { cleanup(); resolve(true); };
      cancelBtn.onclick = () => { cleanup(); resolve(false); };
    });
  };
  window.showCyberConfirm = showCyberConfirm;

  // 5. Connect Realtime Firestore Sync (With Instant Guest Fallback)
  const connectNotificationsSync = (user, isAdmin) => {
    currentUser = user;
    isDevAdmin = isAdmin;

    // Unsubscribe previous listeners
    unsubscribeListeners.forEach(unsub => unsub());
    unsubscribeListeners = [];

    let teamNotifs = [];
    let userNotifs = [];

    const mergeAndRender = () => {
      const seen = new Set();
      const unique = [];
      const combined = [...teamNotifs, ...userNotifs];

      combined.forEach(item => {
        const key = item.id || `${item.applicationId || ''}_${item.status || ''}_${item.title || ''}`;
        if (!seen.has(key)) {
          seen.add(key);
          unique.push(item);
        }
      });

      unique.sort((a, b) => {
        const timeA = a.createdAt?.toDate ? a.createdAt.toDate().getTime() : (a.createdAt ? new Date(a.createdAt).getTime() : 0);
        const timeB = b.createdAt?.toDate ? b.createdAt.toDate().getTime() : (b.createdAt ? new Date(b.createdAt).getTime() : 0);
        return timeB - timeA;
      });
      notificationsList = unique;
      renderNotificationsList();
      updateBatchToolbarState();
    };

    // If guest / not logged in: immediately render empty or local welcome state
    if (!user && !isAdmin) {
      // Default welcome notification for new visitors
      const isDeletedWelcome = localStorage.getItem('bcx_deleted_welcome') === 'true';
      const hasSeenWelcome = localStorage.getItem('bcx_seen_welcome') === 'true';
      if (!isDeletedWelcome) {
        userNotifs = [
          {
            id: 'welcome_notif',
            title: '🎉 ยินดีต้อนรับสู่ BestCyniX Dev!',
            message: 'ขอบคุณที่เยี่ยมชมเว็บไซต์ของเรา คุณสามารถติดตามโปรเจกต์ สอบถามผ่านแชทสด หรือสมัครร่วมทีมได้ตลอดเวลา',
            type: 'system',
            read: hasSeenWelcome,
            createdAt: new Date().toISOString(),
            url: '/'
          }
        ];
      } else {
        userNotifs = [];
      }
      mergeAndRender();
      return;
    }

    if (typeof firebase === 'undefined' || !firebase.firestore) {
      mergeAndRender();
      return;
    }

    const db = firebase.firestore();

    // 5a. If Dev Admin, listen to joinTeamNotifications
    if (isAdmin) {
      const unsubTeam = db.collection('joinTeamNotifications')
        .orderBy('createdAt', 'desc')
        .limit(25)
        .onSnapshot(snap => {
          teamNotifs = snap.docs
            .filter(doc => {
              const t = doc.data().type;
              return t === 'submitted' || t === 'contract_signed';
            })
            .map(doc => {
              const d = doc.data();
              let title = `🚀 ใบสมัครใหม่: ${d.positionName || 'ไม่ระบุตำแหน่ง'}`;
              let msg = `ผู้สมัคร: ${d.applicantName || 'ไม่ระบุชื่อ'} ได้ส่งใบสมัครร่วมทีมเข้ามา`;
              if (d.type === 'contract_signed') {
                title = `✍️ เซ็นสัญญาแล้ว: ${d.positionName || 'ไม่ระบุตำแหน่ง'}`;
                msg = `ผู้สมัคร: ${d.applicantName || 'ไม่ระบุชื่อ'} ได้ลงลายมือชื่อในสัญญาเรียบร้อยแล้ว`;
              }
              return {
                id: doc.id,
                _col: 'joinTeamNotifications',
                title,
                message: msg,
                url: d.url || '/admin-join-team',
                ...d
              };
            });
          mergeAndRender();
        }, () => {
          db.collection('joinTeamNotifications').limit(25).onSnapshot(snap => {
            teamNotifs = snap.docs
              .filter(doc => {
                const t = doc.data().type;
                return t === 'submitted' || t === 'contract_signed';
              })
              .map(doc => {
                const d = doc.data();
                let title = `🚀 ใบสมัครใหม่: ${d.positionName || 'ไม่ระบุตำแหน่ง'}`;
                let msg = `ผู้สมัคร: ${d.applicantName || 'ไม่ระบุชื่อ'} ได้ส่งใบสมัครร่วมทีมเข้ามา`;
                if (d.type === 'contract_signed') {
                  title = `✍️ เซ็นสัญญาแล้ว: ${d.positionName || 'ไม่ระบุตำแหน่ง'}`;
                  msg = `ผู้สมัคร: ${d.applicantName || 'ไม่ระบุชื่อ'} ได้ลงลายมือชื่อในสัญญาเรียบร้อยแล้ว`;
                }
                return {
                  id: doc.id,
                  _col: 'joinTeamNotifications',
                  title,
                  message: msg,
                  url: d.url || '/admin-join-team',
                  ...d
                };
              });
            mergeAndRender();
          }, () => {});
        });
      unsubscribeListeners.push(unsubTeam);
    }

    // 5b. Listen to user's individual notifications
    if (user) {
      const unsubUser = db.collection('users').doc(user.uid).collection('notifications')
        .orderBy('createdAt', 'desc')
        .limit(25)
        .onSnapshot(snap => {
          userNotifs = snap.docs.map(doc => ({
            id: doc.id,
            _col: 'userNotifications',
            ...doc.data()
          }));
          mergeAndRender();
        }, () => {
          db.collection('users').doc(user.uid).collection('notifications').limit(25).onSnapshot(snap => {
            userNotifs = snap.docs.map(doc => ({
              id: doc.id,
              _col: 'userNotifications',
              ...doc.data()
            }));
            mergeAndRender();
          }, () => {});
        });
      unsubscribeListeners.push(unsubUser);
    }
  };

  // Web Audio Synthesizer Engine
  let audioCtx = null;
  const playCyberNotificationChime = () => {
    if (localStorage.getItem('bcx_sound_enabled') === 'false') return;
    try {
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      if (!AudioContext) return;
      if (!audioCtx) audioCtx = new AudioContext();
      if (audioCtx.state === 'suspended') audioCtx.resume();

      const now = audioCtx.currentTime;
      const osc1 = audioCtx.createOscillator();
      const osc2 = audioCtx.createOscillator();
      const gain = audioCtx.createGain();

      osc1.type = 'sine';
      osc1.frequency.setValueAtTime(587.33, now); // D5
      osc1.frequency.exponentialRampToValueAtTime(880.00, now + 0.15); // A5

      osc2.type = 'triangle';
      osc2.frequency.setValueAtTime(880.00, now + 0.15);
      osc2.frequency.exponentialRampToValueAtTime(1174.66, now + 0.35); // D6

      gain.gain.setValueAtTime(0.25, now);
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.45);

      osc1.connect(gain);
      osc2.connect(gain);
      gain.connect(audioCtx.destination);

      osc1.start(now);
      osc1.stop(now + 0.2);
      osc2.start(now + 0.15);
      osc2.stop(now + 0.45);
    } catch (e) {}
  };
  window.playCyberNotificationChime = playCyberNotificationChime;
  window.isCyberSoundEnabled = () => localStorage.getItem('bcx_sound_enabled') !== 'false';
  window.toggleCyberSound = () => {
    const next = !window.isCyberSoundEnabled();
    localStorage.setItem('bcx_sound_enabled', next ? 'true' : 'false');
    const notifBtn = document.getElementById('btnToggleNotifSound');
    if (notifBtn) notifBtn.textContent = next ? '🔊 เสียง: เปิด' : '🔇 เสียง: ปิด';
    return next;
  };

  // Expose global method for auth listener
  window.connectNotificationHub = connectNotificationsSync;

  // Initialize UI on load
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', mountNotificationUI);
  } else {
    mountNotificationUI();
  }

  // Hook into Firebase Auth if available
  if (typeof firebase !== 'undefined' && firebase.auth) {
    firebase.auth().onAuthStateChanged(async (user) => {
      if (user) {
        let isAdmin = (user.email === 'bestcynix@gmail.com' || user.email === 'admin@email.com');
        if (!isAdmin) {
          try {
            const doc = await firebase.firestore().collection('users').doc(user.uid).get();
            if (doc.exists && doc.data().role === 'admin') isAdmin = true;
          } catch (e) {}
        }
        connectNotificationsSync(user, isAdmin);
      } else {
        connectNotificationsSync(null, false);
      }
    });
  }
})();
