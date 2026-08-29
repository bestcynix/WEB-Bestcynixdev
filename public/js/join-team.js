/**
 * BestCyniX Dev — Join Team Public Form Logic
 * Pure Firestore SDK (no backend server needed)
 */
(function () {
  'use strict';

  const ROUTE_PARTS = window.location.pathname.split('/').filter(Boolean);
  const ROUTE_PROJECT_SLUG = new URLSearchParams(window.location.search).get('project')
    || (ROUTE_PARTS[0] === 'join-team' && ROUTE_PARTS[1] ? ROUTE_PARTS[1] : null);
  const FORM_DOC_ID = ROUTE_PROJECT_SLUG === 'mc-skyline' ? 'mc-skyline' : 'default';
  const APPLICATIONS_COL = 'joinTeamApplications';
  const FORMS_COL = 'joinTeamForms';

  // Brand SVG Icons
  const BRAND_ICONS = {
    facebook: `<svg viewBox="0 0 24 24"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/></svg>`,
    x: `<svg viewBox="0 0 24 24"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>`,
    tiktok: `<svg viewBox="0 0 24 24"><path d="M12.525.02c1.31-.02 2.61-.01 3.91-.02.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.05-2.89-.35-4.2-.97-.57-.26-1.1-.59-1.62-.93-.01 2.92.01 5.84-.02 8.75-.08 1.4-.54 2.79-1.35 3.94-1.31 1.92-3.58 3.17-5.91 3.21-1.43.08-2.86-.31-4.08-1.03-2.02-1.19-3.44-3.37-3.65-5.71-.02-.5-.03-1-.01-1.49.18-1.9 1.12-3.72 2.58-4.96 1.66-1.44 3.98-2.13 6.15-1.72.02 1.48-.04 2.96-.04 4.44-.99-.32-2.15-.23-3.02.37-.63.41-1.11 1.04-1.36 1.75-.21.51-.24 1.07-.14 1.61.24 1.64 1.82 3.02 3.5 2.87 1.12-.01 2.19-.66 2.77-1.61.19-.33.4-.67.41-1.06.1-1.79.06-3.57.07-5.36.01-4.03-.01-8.05.02-12.07z"/></svg>`,
    twitch: `<svg viewBox="0 0 24 24"><path d="M2.149 0L.537 4.119v16.836h5.731V24h3.224l3.045-3.045h4.657l6.269-6.269V0H2.149zm19.164 13.612l-3.582 3.582H12l-3.045 3.045v-3.045H4.836V1.791h16.477v11.821zm-8.239-6.448h2.149v6.09h-2.149v-6.09zm-5.015 0h2.149v6.09H8.059v-6.09z"/></svg>`,
    youtube: `<svg viewBox="0 0 24 24"><path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/></svg>`,
    instagram: `<svg viewBox="0 0 24 24"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/></svg>`,
    discord: `<svg viewBox="0 0 24 24"><path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028c.462-.63.874-1.295 1.226-1.994.021-.041.001-.09-.041-.106a13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.929 1.793 8.18 1.793 12.061 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.894.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.028zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.946 2.418-2.157 2.418z"/></svg>`,
    line: `<svg viewBox="0 0 24 24"><path d="M24 10.304c0-5.369-5.383-9.738-12-9.738-6.616 0-12 4.369-12 9.738 0 4.814 4.269 8.846 10.019 9.608.391.084.922.258 1.057.592.121.303.079.778.039 1.085l-.171 1.027c-.053.303-.242 1.186 1.039.647 1.281-.54 6.911-4.069 9.428-6.967 1.739-1.907 2.589-3.843 2.589-5.992z"/></svg>`
  };

  const SOCIAL_OPTIONS = [
    { key: 'facebook', label: 'Facebook', pillClass: 'brand-facebook', placeholder: 'ใส่ลิงก์ facebook' },
    { key: 'x', label: 'X', pillClass: 'brand-x', placeholder: 'ใส่ลิงก์ x' },
    { key: 'tiktok', label: 'TikTok', pillClass: 'brand-tiktok', placeholder: 'ใส่ลิงก์ tiktok' },
    { key: 'twitch', label: 'Twitch', pillClass: 'brand-twitch', placeholder: 'ใส่ลิงก์ twitch' },
    { key: 'youtube', label: 'YouTube', pillClass: 'brand-youtube', placeholder: 'ใส่ลิงก์ youtube' },
    { key: 'instagram', label: 'Instagram', pillClass: 'brand-instagram', placeholder: 'ใส่ลิงก์ instagram' },
    { key: 'discord', label: 'Discord', pillClass: 'brand-discord', placeholder: 'Discord ID หรือ ลิงก์' },
    { key: 'line', label: 'LINE', pillClass: 'brand-line', placeholder: 'LINE ID หรือ ลิงก์' },
  ];

  const ALL_DAYS = ['จันทร์', 'อังคาร', 'พุธ', 'พฤหัส', 'ศุกร์', 'เสาร์', 'อาทิตย์', 'ทุกวัน'];

  const MC_SKYLINE_DEFAULT = {
    formId: 'mc-skyline',
    projectSlug: 'mc-skyline',
    isOpen: true,
    title: 'รับสมัครทีม Mc-Skyline.online',
    subtitle: 'ร่วมสร้างเซิร์ฟเวอร์ Minecraft รุ่นใหม่จากทีมเดิม — ไม่จำกัดอายุหรือเพศ ขอเพียงรักการทำงานและมีเวลาว่างเพียงพอ',
    communityName: 'Mc-Skyline.online',
    communityUrl: 'https://discord.gg/5eNFMMk3ak',
    websiteUrl: 'https://mc-skyline.online',
    ageRange: {},
    availableDays: ALL_DAYS,
    positions: [
      { id: 'mc-dev', name: 'Developer', description: 'พัฒนาเว็บ บอท ปลั๊กอิน หรือระบบหลังบ้าน', maxSlots: 2, unlimited: false, active: true, ageRule: 'unlimited' },
      { id: 'mc-builder', name: 'Builder', description: 'ออกแบบและสร้างแผนที่/สิ่งปลูกสร้างในเซิร์ฟเวอร์', maxSlots: 2, unlimited: false, active: true, ageRule: 'unlimited' },
      { id: 'mc-systems', name: 'System / Item / Quest', description: 'ตั้งค่าระบบ ไอเทม เควสต์ และระบบภายในเกม', maxSlots: 2, unlimited: false, active: true, ageRule: 'unlimited' },
      { id: 'mc-modeler', name: 'Modeler', description: 'สร้างโมเดลและองค์ประกอบ 3D สำหรับเกม', maxSlots: 2, unlimited: false, active: true, ageRule: 'unlimited' },
      { id: 'mc-resource-pack', name: 'Resource Pack', description: 'จัดทำพื้นผิว เสียง และ resource pack', maxSlots: 2, unlimited: false, active: true, ageRule: 'unlimited' },
      { id: 'mc-other-staff', name: 'ทีมงานอื่น ๆ ตามความถนัด', description: 'ตำแหน่งเพิ่มเติมสำหรับผู้มีความสามารถเฉพาะด้าน', maxSlots: 0, unlimited: true, active: true, ageRule: 'unlimited' }
    ],
    benefits: [
      { icon: '🤝', title: 'ทำงานเป็นทีม', desc: 'ร่วมวางระบบและสร้างผลงานจริงกับทีม Mc-Skyline.online' },
      { icon: '📜', title: 'ข้อตกลงชัดเจน', desc: 'กำหนดหน้าที่ สิทธิในผลงาน และการยุติความร่วมมือไว้ในเอกสารก่อนเริ่มงาน' },
      { icon: '💰', title: 'แบ่งผลกำไรตามสัญญา', desc: 'หากโครงการมีกำไร จะแบ่งตามเปอร์เซ็นต์และเงื่อนไขที่คู่สัญญาตกลงเป็นลายลักษณ์อักษร' }
    ],
    customQuestions: []
  };

  const getRouteDefault = () => ROUTE_PROJECT_SLUG === 'mc-skyline' ? MC_SKYLINE_DEFAULT : null;
  const mergeRouteConfig = (remote) => {
    const routeDefault = getRouteDefault();
    if (!routeDefault) return remote || {};
    const source = remote || {};
    return {
      ...routeDefault,
      ...source,
      // Do not let an old generic/default CMS title leak into the project page.
      title: source.title && source.title !== 'สมัครร่วมทีม BestCyniX Dev' ? source.title : routeDefault.title,
      subtitle: source.subtitle && source.subtitle !== 'เป็นส่วนหนึ่งในการพัฒนาโปรเจกต์สุดเจ๋งกับ BestCyniX Dev' ? source.subtitle : routeDefault.subtitle,
      positions: Array.isArray(source.positions) && source.positions.length ? source.positions : routeDefault.positions,
      benefits: Array.isArray(source.benefits) && source.benefits.length ? source.benefits : routeDefault.benefits,
      customQuestions: Array.isArray(source.customQuestions) ? source.customQuestions : routeDefault.customQuestions,
      availableDays: Array.isArray(source.availableDays) && source.availableDays.length ? source.availableDays : routeDefault.availableDays,
      communityUrl: source.communityUrl || routeDefault.communityUrl,
      websiteUrl: source.websiteUrl || routeDefault.websiteUrl
    };
  };

  const renderRoleDirectory = (cfg) => {
    const wrap = $('jtRoleDirectory');
    if (!wrap) return;
    const search = ($('jtRoleSearch')?.value || '').trim().toLowerCase();
    const filter = $('jtRoleStatusFilter')?.value || 'all';
    const roles = (cfg.positions || []).filter(p => p.active !== false).filter((p) => {
      const approved = Number(p.approvedCount || 0);
      const unlimited = !p.maxSlots || p.maxSlots <= 0 || p.unlimited === true;
      const left = p.slotsLeft !== undefined ? Number(p.slotsLeft) : (unlimited ? 9999 : Math.max(0, Number(p.maxSlots) - approved));
      const searchable = `${p.name || ''} ${p.description || ''} ${cfg.communityName || ''}`.toLowerCase();
      return (!search || searchable.includes(search))
        && (filter === 'all' || (filter === 'open' ? unlimited || left > 0 : !unlimited && left <= 0));
    });
    if (!roles.length) {
      wrap.innerHTML = '<div style="grid-column:1/-1;padding:1rem;color:var(--muted);text-align:center;border:1px dashed rgba(255,255,255,.15);border-radius:12px;">ไม่พบตำแหน่งตามตัวกรอง</div>';
      return;
    }
    wrap.innerHTML = roles.map((p) => {
      const approved = Number(p.approvedCount || 0);
      const unlimited = !p.maxSlots || p.maxSlots <= 0 || p.unlimited === true;
      const left = p.slotsLeft !== undefined ? Number(p.slotsLeft) : (unlimited ? 9999 : Math.max(0, Number(p.maxSlots) - approved));
      const status = unlimited || left > 0 ? '🟢 ยังเปิดรับ' : '🔴 เต็มแล้ว';
      const quota = unlimited ? 'ไม่จำกัดจำนวน' : `ว่าง ${left}/${p.maxSlots} คน`;
      return `<article class="jt-role-card"><h3>${p.name || 'ตำแหน่งทีมงาน'}</h3><p>${p.description || 'ร่วมพัฒนาโปรเจกต์กับทีม'}</p><div class="jt-role-meta"><span>${status}</span><span>👥 ${quota}</span><span>🎯 ไม่จำกัดอายุ</span></div></article>`;
    }).join('');
  };

  let formConfig = null;
  let selectedDays = [];
  let activeSocials = {};
  let applicantPhotoDataUrl = null;

  const $ = (id) => document.getElementById(id);
  const show = (el) => { if (el) el.style.display = ''; };
  const hide = (el) => { if (el) el.style.display = 'none'; };

  const showToast = (title, body, type = 'info') => {
    const wrap = $('jtToastWrap');
    if (!wrap) return;
    const toast = document.createElement('div');
    const icon = type === 'success' ? '✅' : type === 'error' ? '❌' : 'ℹ️';
    const tone = type === 'success' ? 'tone-success' : type === 'error' ? 'tone-error' : '';
    toast.className = `jt-notif-toast ${tone}`;
    toast.innerHTML = `
      <span class="notif-icon">${icon}</span>
      <div>
        <div class="notif-title">${title}</div>
        <div class="notif-body">${body}</div>
      </div>
    `;
    wrap.appendChild(toast);
    requestAnimationFrame(() => toast.classList.add('is-show'));
    setTimeout(() => {
      toast.classList.remove('is-show');
      setTimeout(() => toast.remove(), 400);
    }, 5000);
  };

  // ── Robust Age Calculation ────────────────────────────────────────────────
  const calcAge = (dobString) => {
    if (!dobString) return { error: 'empty' };
    const birth = new Date(dobString);
    const now = new Date();
    // Normalize time to midnight for accurate day diff
    birth.setHours(0,0,0,0);
    now.setHours(0,0,0,0);

    if (isNaN(birth.getTime())) return { error: 'invalid' };
    if (birth > now) return { error: 'future' };

    let years = now.getFullYear() - birth.getFullYear();
    let months = now.getMonth() - birth.getMonth();
    let days = now.getDate() - birth.getDate();

    if (days < 0) {
      months--;
      const prevMonthLastDay = new Date(now.getFullYear(), now.getMonth(), 0).getDate();
      days += prevMonthLastDay;
    }
    if (months < 0) {
      years--;
      months += 12;
    }

    if (years < 0) return { error: 'future' };
    return { years, months, days };
  };

  // ── Position Age Limit Validator ──────────────────────────────────────────
  const getPositionAgeRequirementText = (pos) => {
    if (!pos) return '';
    const rule = pos.ageRule || (pos.minAge || pos.maxAge ? 'range' : 'unlimited');
    if (rule === 'unlimited') return '🎯 ตำแหน่งนี้: ไม่จำกัดอายุ';
    if (rule === 'min') return `🎯 ตำแหน่งนี้: รับอายุ ${pos.minAge || 18} ปีขึ้นไป`;
    if (rule === 'max') return `🎯 ตำแหน่งนี้: รับอายุไม่เกิน ${pos.maxAge || 99} ปี`;
    if (rule === 'range') return `🎯 ตำแหน่งนี้: รับอายุ ${pos.minAge || 0} – ${pos.maxAge || 99} ปี`;
    return '';
  };

  const validateAgeForPosition = (ageYears, pos) => {
    if (ageYears === undefined || ageYears === null) return { valid: false, message: 'กรุณากรอกวันเกิด' };
    if (!pos) return { valid: true };

    const rule = pos.ageRule || (pos.minAge || pos.maxAge ? 'range' : 'unlimited');
    if (rule === 'unlimited') return { valid: true };
    if (rule === 'min') {
      const min = pos.minAge || 18;
      if (ageYears < min) return { valid: false, message: `ตำแหน่งนี้รับอายุ ${min} ปีขึ้นไป (ปัจจุบันอายุ ${ageYears} ปี)` };
      return { valid: true };
    }
    if (rule === 'max') {
      const max = pos.maxAge || 99;
      if (ageYears > max) return { valid: false, message: `ตำแหน่งนี้รับอายุไม่เกิน ${max} ปี (ปัจจุบันอายุ ${ageYears} ปี)` };
      return { valid: true };
    }
    if (rule === 'range') {
      const min = pos.minAge || 0;
      const max = pos.maxAge || 99;
      if (ageYears < min || ageYears > max) {
        return { valid: false, message: `ตำแหน่งนี้รับอายุ ${min}–${max} ปี (ปัจจุบันอายุ ${ageYears} ปี)` };
      }
      return { valid: true };
    }
    return { valid: true };
  };

  const updatePositionAgeBadge = () => {
    const posId = $('jtPosition')?.value;
    const badge = $('jtPositionAgeNote');
    if (!badge) return;

    if (!posId || !formConfig) {
      hide(badge);
      return;
    }

    const pos = (formConfig.positions || []).find(p => p.id === posId);
    if (!pos) { hide(badge); return; }

    const ageTxt = getPositionAgeRequirementText(pos);
    badge.textContent = ageTxt;
    show(badge);

    // Check against entered age
    const ageVal = parseInt($('jtAgeHidden')?.value);
    if (!isNaN(ageVal)) {
      const check = validateAgeForPosition(ageVal, pos);
      if (!check.valid) {
        badge.className = 'jt-pos-age-badge warning';
        badge.textContent = `⚠️ ${check.message}`;
      } else {
        badge.className = 'jt-pos-age-badge';
      }
    } else {
      badge.className = 'jt-pos-age-badge';
    }
  };

  // ── Render Form Config & Countdown ────────────────────────────────────────
  let countdownTimerInterval = null;

  const startCountdownTimer = (targetDate, noteText) => {
    const wrap = $('jtScheduleCountdownWrap');
    const note = $('jtScheduleNote');
    if (!wrap) return;
    show(wrap);
    if (note) note.textContent = noteText || '';

    const update = () => {
      const diff = new Date(targetDate).getTime() - Date.now();
      if (diff <= 0) {
        clearInterval(countdownTimerInterval);
        hide(wrap);
        if (formConfig) applyFormConfig(formConfig);
        return;
      }
      const days = Math.floor(diff / (1000 * 60 * 60 * 24));
      const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const mins = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      const secs = Math.floor((diff % (1000 * 60)) / 1000);

      if ($('cdDays')) $('cdDays').textContent = String(days).padStart(2, '0');
      if ($('cdHours')) $('cdHours').textContent = String(hours).padStart(2, '0');
      if ($('cdMinutes')) $('cdMinutes').textContent = String(mins).padStart(2, '0');
      if ($('cdSeconds')) $('cdSeconds').textContent = String(secs).padStart(2, '0');
    };

    update();
    if (countdownTimerInterval) clearInterval(countdownTimerInterval);
    countdownTimerInterval = setInterval(update, 1000);
  };

  const applyFormConfig = (cfg) => {
    formConfig = cfg;

    // Hide loading indicator
    const loadingState = $('jtLoadingState');
    if (loadingState) hide(loadingState);

    const badge = $('jtStatusBadge');
    const isOpen = checkIsOpen(cfg);
    const mode = cfg.statusConfig?.mode || 'manual';
    const now = Date.now();
    const autoOpen = cfg.statusConfig?.autoOpenAt ? new Date(cfg.statusConfig.autoOpenAt).getTime() : null;

    if (badge) {
      show(badge);
      if (isOpen) {
        badge.className = 'jt-status-badge jt-status-open';
        badge.style.background = '';
        badge.style.borderColor = '';
        badge.style.color = '';
        badge.textContent = '🟢 เปิดรับสมัครอยู่';
      } else if (mode === 'auto' && autoOpen && now < autoOpen) {
        badge.className = 'jt-status-badge';
        badge.style.background = 'rgba(234,179,8,0.15)';
        badge.style.borderColor = 'rgba(234,179,8,0.4)';
        badge.style.color = '#facc15';
        badge.textContent = '⏰ เร็วๆ นี้ (กำลังจะเปิดรับสมัคร)';
      } else {
        badge.className = 'jt-status-badge jt-status-closed';
        badge.style.background = '';
        badge.style.borderColor = '';
        badge.style.color = '';
        badge.textContent = '🔴 ปิดรับสมัครแล้ว';
      }
    }

    if ($('jtHeroTitle')) $('jtHeroTitle').textContent = cfg.title || 'สมัครร่วมทีม';
    if ($('jtHeroSub')) $('jtHeroSub').textContent = cfg.subtitle || '';
    if ($('jtCommunity')) $('jtCommunity').textContent = cfg.communityName || 'BestCyniX Dev';

    const routeLinks = $('jtProjectLinks');
    if (routeLinks && (cfg.communityUrl || cfg.websiteUrl)) {
      show(routeLinks);
      const communityLink = $('jtProjectCommunityLink');
      const websiteLink = $('jtProjectWebsiteLink');
      if (communityLink) {
        communityLink.href = cfg.communityUrl || '#';
        communityLink.style.display = cfg.communityUrl ? '' : 'none';
        communityLink.textContent = `💬 เข้าร่วมชุมชน ${cfg.communityName || 'โปรเจกต์'}`;
      }
      if (websiteLink) {
        websiteLink.href = cfg.websiteUrl || '#';
        websiteLink.style.display = cfg.websiteUrl ? '' : 'none';
      }
    } else if (routeLinks) {
      hide(routeLinks);
    }

    const ageChip = $('jtAgeChip');
    if (ageChip) {
      if (cfg.ageRange && (cfg.ageRange.min || cfg.ageRange.max)) {
        ageChip.innerHTML = `🎂 อายุ: <span class="val">${cfg.ageRange.min || 0}–${cfg.ageRange.max || 99} ปี</span>`;
      } else {
        ageChip.innerHTML = `🎂 อายุ: <span class="val">ไม่จำกัด</span>`;
      }
    }

    const positions = (cfg.positions || []).filter(p => p.active !== false);
    if ($('jtPositionCount')) $('jtPositionCount').textContent = positions.length;
    renderRoleDirectory(cfg);

    // Benefits
    if (cfg.benefits && cfg.benefits.length && isOpen) {
      const sec = $('jtBenefitsSection');
      const grid = $('jtBenefitsGrid');
      if (sec && grid) {
        show(sec);
        grid.innerHTML = cfg.benefits.map(b => `
          <div class="jt-benefit-card">
            <div class="icon">${b.icon || '🎁'}</div>
            <h4>${b.title || ''}</h4>
            <p>${b.desc || ''}</p>
          </div>
        `).join('');
      }
    } else {
      hide($('jtBenefitsSection'));
    }

    // Positions dropdown with live slot calculation
    const posSelect = $('jtPosition');
    if (posSelect) {
      const currentVal = posSelect.value;
      posSelect.innerHTML = '<option value="">-- เลือกตำแหน่งที่ต้องการสมัคร --</option>';
      positions.forEach(pos => {
        const opt = document.createElement('option');
        opt.value = pos.id;
        const isUnlimited = !pos.maxSlots || pos.maxSlots <= 0 || pos.unlimited === true;
        const approved = pos.approvedCount || 0;
        const slotsLeft = pos.slotsLeft !== undefined ? pos.slotsLeft : (isUnlimited ? 999 : Math.max(0, pos.maxSlots - approved));
        const isFull = !isUnlimited && slotsLeft <= 0;

        const quotaTxt = isUnlimited ? ' (เปิดรับไม่จำกัดจำนวน)' : (slotsLeft > 0 ? ` (ว่าง ${slotsLeft}/${pos.maxSlots} คน)` : ` (รับ ${pos.maxSlots} คน)`);
        const ageRuleTxt = pos.ageRule === 'min' ? ` [${pos.minAge}+ ปี]` : pos.ageRule === 'range' ? ` [${pos.minAge}-${pos.maxAge} ปี]` : '';

        if (isFull) {
          opt.disabled = true;
          opt.textContent = `${pos.name}${quotaTxt} — ❌ เต็มแล้ว`;
        } else {
          opt.textContent = `${pos.name}${quotaTxt}${ageRuleTxt}`;
        }
        posSelect.appendChild(opt);
      });
      if (currentVal) posSelect.value = currentVal;
    }

    // Day picker
    renderDayPicker(cfg.availableDays || ALL_DAYS);

    // Custom questions
    renderCustomQuestions(cfg.customQuestions || []);

    // Form vs Closed State visibility
    const formWrap = $('jtFormWrap');
    const closedBanner = $('jtClosedBanner');
    const metaRow = $('jtMetaRow');

    if (isOpen) {
      show(formWrap);
      show(metaRow);
      hide(closedBanner);
      if (countdownTimerInterval) clearInterval(countdownTimerInterval);
    } else {
      hide(formWrap);
      hide(metaRow);
      show(closedBanner);

      if ($('jtClosedText')) {
        $('jtClosedText').textContent = cfg.closedMessage || 'ทีมงาน BestCyniX Dev กำลังดำเนินการคัดเลือกและจัดสรรตำแหน่ง กรุณาติดตามการประกาศเปิดรับสมัครรอบถัดไปผ่านช่องทาง Discord หรือหน้าเว็บไซต์';
      }

      const allPositionsFull = positions.length > 0 &&
        !positions.some(p => !p.maxSlots || p.maxSlots <= 0 || p.unlimited === true) &&
        positions.every(p => {
          const approved = p.approvedCount || 0;
          const slotsLeft = p.slotsLeft !== undefined ? p.slotsLeft : Math.max(0, p.maxSlots - approved);
          return slotsLeft <= 0;
        });

      if (allPositionsFull) {
        if (badge) {
          badge.className = 'jt-status-badge jt-status-closed';
          badge.textContent = '🔒 ปิดรับสมัคร (ตำแหน่งเต็มทุกอัตราแล้ว)';
        }
        if ($('jtClosedTitle')) $('jtClosedTitle').textContent = '🔒 ขณะนี้ตำแหน่งที่เปิดรับสมัครเต็มทุกอัตราแล้ว';
        if ($('jtClosedText')) $('jtClosedText').textContent = 'ขอขอบคุณทุกท่านที่ให้ความสนใจสมัครร่วมทีม BestCyniX Dev ขณะนี้ทุกตำแหน่งที่เปิดรับสมัครมีผู้ร่วมทีมครบตามจำนวนที่กำหนดแล้ว กรุณาติดตามการเปิดรับสมัครรอบถัดไปผ่าน Discord หรือหน้าเว็บไซต์';
        hide($('jtScheduleCountdownWrap'));
        if (countdownTimerInterval) clearInterval(countdownTimerInterval);
      } else if (mode === 'auto' && autoOpen && now < autoOpen) {
        if ($('jtClosedTitle')) $('jtClosedTitle').textContent = '⏳ กำลังจะเปิดรับสมัครเร็วๆ นี้';
        const formattedDate = new Date(autoOpen).toLocaleString('th-TH', { dateStyle: 'medium', timeStyle: 'short' });
        startCountdownTimer(autoOpen, `กำหนดการเปิดรับสมัคร: ${formattedDate} น.`);
      } else {
        if ($('jtClosedTitle')) $('jtClosedTitle').textContent = '🔒 ขณะนี้ระบบปิดรับสมัครชั่วคราว';
        hide($('jtScheduleCountdownWrap'));
        if (countdownTimerInterval) clearInterval(countdownTimerInterval);
      }
    }

    updatePositionAgeBadge();
    hide($('jtLoadingState'));
  };

  const checkIsOpen = (cfg) => {
    if (!cfg) return false;
    const mode = cfg.statusConfig?.mode || 'manual';
    if (mode === 'auto') {
      const now = Date.now();
      const open = cfg.statusConfig?.autoOpenAt ? new Date(cfg.statusConfig.autoOpenAt).getTime() : null;
      const close = cfg.statusConfig?.autoCloseAt ? new Date(cfg.statusConfig.autoCloseAt).getTime() : null;
      if (open && now < open) return false;
      if (close && now > close) return false;
    } else {
      if (cfg.isOpen !== true) return false;
    }

    // Check if ALL active positions are full
    const activePositions = (cfg.positions || []).filter(p => p.active !== false);
    if (activePositions.length > 0) {
      const hasUnlimited = activePositions.some(p => !p.maxSlots || p.maxSlots <= 0 || p.unlimited === true);
      if (!hasUnlimited) {
        const hasOpenSlots = activePositions.some(p => {
          const approved = p.approvedCount || 0;
          const slotsLeft = p.slotsLeft !== undefined ? p.slotsLeft : Math.max(0, p.maxSlots - approved);
          return slotsLeft > 0;
        });
        if (!hasOpenSlots) {
          return false; // All positions are full -> auto-close!
        }
      }
    }
    return true;
  };

  // ── Day Picker (Thai Day Colors + Bug-Free Logic) ─────────────────────────
  const renderDayPicker = (allowedDays) => {
    const grid = $('jtDayGrid');
    if (!grid) return;
    grid.innerHTML = '';

    ALL_DAYS.forEach(day => {
      const isAllowed = allowedDays.includes(day) || allowedDays.includes('ทุกวัน');
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = `jt-day-btn ${isAllowed ? '' : 'is-locked'}`;
      btn.dataset.day = day;
      btn.textContent = day;
      btn.disabled = !isAllowed;

      btn.addEventListener('click', () => {
        if (!isAllowed) return;

        if (day === 'ทุกวัน') {
          const isCurrentlyActive = btn.classList.contains('is-active');
          if (!isCurrentlyActive) {
            // Turn ALL days ON
            btn.classList.add('is-active');
            grid.querySelectorAll('.jt-day-btn:not([disabled])').forEach(b => {
              if (b.dataset.day !== 'ทุกวัน') b.classList.add('is-active');
            });
            selectedDays = ['ทุกวัน', ...ALL_DAYS.filter(d => d !== 'ทุกวัน' && allowedDays.includes(d))];
          } else {
            // Turn ALL days OFF
            grid.querySelectorAll('.jt-day-btn').forEach(b => b.classList.remove('is-active'));
            selectedDays = [];
          }
          return;
        }

        // Clicked individual weekday
        btn.classList.toggle('is-active');
        const activeButtons = Array.from(grid.querySelectorAll('.jt-day-btn.is-active:not([data-day="ทุกวัน"])'));
        const totalNonAll = grid.querySelectorAll('.jt-day-btn:not([disabled]):not([data-day="ทุกวัน"])').length;

        const allDaysBtn = grid.querySelector('.jt-day-btn[data-day="ทุกวัน"]');
        if (activeButtons.length === totalNonAll && totalNonAll > 0) {
          allDaysBtn?.classList.add('is-active');
          selectedDays = ['ทุกวัน', ...activeButtons.map(b => b.dataset.day)];
        } else {
          allDaysBtn?.classList.remove('is-active');
          selectedDays = activeButtons.map(b => b.dataset.day);
        }
      });

      grid.appendChild(btn);
    });
  };

  // ── Social Picker (Pills + Cards Grid Matching Screenshot) ─────────────────
  const renderSocialPicker = () => {
    const picker = $('jtSocialPicker');
    const cardsGrid = $('jtSocialCards');
    if (!picker || !cardsGrid) return;

    picker.innerHTML = '';
    cardsGrid.innerHTML = '';

    SOCIAL_OPTIONS.forEach(s => {
      const pill = document.createElement('button');
      pill.type = 'button';
      pill.className = `jt-social-pill ${s.pillClass}`;
      pill.dataset.key = s.key;
      pill.innerHTML = `${BRAND_ICONS[s.key] || ''} <span>${s.label}</span>`;

      pill.addEventListener('click', () => {
        if (activeSocials[s.key]) {
          // Remove card
          delete activeSocials[s.key];
          pill.classList.remove('is-active');
          const existingCard = cardsGrid.querySelector(`[data-card-social="${s.key}"]`);
          if (existingCard) existingCard.remove();
        } else {
          // Add card
          activeSocials[s.key] = true;
          pill.classList.add('is-active');

          const card = document.createElement('div');
          card.className = 'jt-social-card';
          card.dataset.cardSocial = s.key;
          card.innerHTML = `
            <div class="jt-social-card-header">
              <div class="jt-social-card-title">
                ${BRAND_ICONS[s.key] || ''}
                <span>${s.label}</span>
              </div>
              <button type="button" class="jt-social-card-close" title="ลบช่องนี้">✕</button>
            </div>
            <input name="social_${s.key}" class="jt-input" placeholder="${s.placeholder}" autofocus />
          `;

          card.querySelector('.jt-social-card-close').addEventListener('click', () => {
            delete activeSocials[s.key];
            pill.classList.remove('is-active');
            card.remove();
          });

          cardsGrid.appendChild(card);
        }
      });

      picker.appendChild(pill);
    });
  };

  // ── Custom Questions ──────────────────────────────────────────────────────
  const renderCustomQuestions = (questions) => {
    const section = $('jtCustomQuestionsSection');
    const wrap = $('jtCustomQuestionsWrap');
    if (!wrap || !section) return;
    if (!questions.length) { hide(section); return; }
    show(section);
    wrap.innerHTML = questions.map((q, i) => {
      const name = `cq_${q.id || i}`;
      const label = `<label style="font-size:.8rem;font-weight:700;color:var(--muted);text-transform:uppercase;letter-spacing:.5px;">${q.label || 'คำถาม'}${q.required ? ' <span style="color:var(--accent-red);">*</span>' : ''}</label>`;
      let input = '';
      if (q.type === 'text') {
        input = `<input name="${name}" class="jt-input" placeholder="${q.placeholder || ''}" ${q.required ? 'required' : ''} />`;
      } else if (q.type === 'textarea') {
        input = `<textarea name="${name}" class="jt-textarea" placeholder="${q.placeholder || ''}" ${q.required ? 'required' : ''}></textarea>`;
      } else if (q.type === 'radio') {
        input = (q.options || []).map(opt => `
          <label style="display:flex;align-items:center;gap:.5rem;cursor:pointer;font-size:.88rem;color:var(--text);">
            <input type="radio" name="${name}" value="${opt}" ${q.required ? 'required' : ''} style="accent-color:var(--accent);" />
            ${opt}
          </label>
        `).join('');
      } else if (q.type === 'checkbox') {
        input = (q.options || []).map(opt => `
          <label style="display:flex;align-items:center;gap:.5rem;cursor:pointer;font-size:.88rem;color:var(--text);">
            <input type="checkbox" name="${name}[]" value="${opt}" style="accent-color:var(--accent);" />
            ${opt}
          </label>
        `).join('');
      } else if (q.type === 'select' || q.type === 'dropdown') {
        input = `<select name="${name}" class="jt-select" ${q.required ? 'required' : ''}>
          <option value="">เลือก...</option>
          ${(q.options || []).map(opt => `<option value="${opt}">${opt}</option>`).join('')}
        </select>`;
      }
      const spanCols = (q.type === 'textarea' || q.type === 'radio' || q.type === 'checkbox') ? 'grid-column:1/-1;' : '';
      return `<div class="jt-form-group" style="${spanCols}">${label}${input}</div>`;
    }).join('');
  };

  // ── Submit ────────────────────────────────────────────────────────────────
  const handleSubmit = async (e) => {
    e.preventDefault();
    const form = $('jtForm');
    const submitBtn = $('jtSubmitBtn');
    const submitMsg = $('jtSubmitMsg');

    if (!formConfig) {
      submitMsg.className = 'jt-submit-msg error';
      submitMsg.textContent = '❌ ยังไม่โหลดข้อมูลฟอร์ม กรุณารีเฟรชหน้า';
      return;
    }

    if (!checkIsOpen(formConfig)) {
      submitMsg.className = 'jt-submit-msg error';
      submitMsg.textContent = '❌ ขณะนี้ปิดรับสมัครแล้วทุกตำแหน่ง';
      return;
    }

    const fd = new FormData(form);
    const get = (k) => (fd.get(k) || '').trim();

    // Required fields check
    const requiredFields = [
      ['positionId', 'ตำแหน่งที่สมัคร'],
      ['firstName', 'ชื่อ'], ['lastName', 'นามสกุล'], ['nickname', 'ชื่อเล่น'],
      ['dob', 'วันเกิด'], ['gender', 'เพศ'], ['platform', 'อุปกรณ์'],
      ['hasMic', 'ไมค์'], ['motivation', 'เหตุผลที่อยากร่วมทีม']
    ];
    for (const [field, label] of requiredFields) {
      if (!get(field)) {
        submitMsg.className = 'jt-submit-msg error';
        submitMsg.textContent = `❌ กรุณากรอก "${label}"`;
        return;
      }
    }

    if (!selectedDays.length) {
      submitMsg.className = 'jt-submit-msg error';
      submitMsg.textContent = '❌ กรุณาเลือกวันที่สะดวกทำงานอย่างน้อย 1 วัน';
      return;
    }

    // Age validation
    const ageData = calcAge(get('dob'));
    if (ageData.error === 'future' || ageData.error === 'invalid') {
      submitMsg.className = 'jt-submit-msg error';
      submitMsg.textContent = '❌ วันเกิดไม่ถูกต้อง (ไม่สามารถเลือกวันในอนาคตได้)';
      return;
    }

    // Position & Per-position age limit validation
    const position = (formConfig.positions || []).find(p => p.id === get('positionId'));
    if (!position) {
      submitMsg.className = 'jt-submit-msg error';
      submitMsg.textContent = '❌ ตำแหน่งที่เลือกไม่ถูกต้อง หรือถูกปิดรับแล้ว';
      return;
    }

    const posAgeCheck = validateAgeForPosition(ageData.years, position);
    if (!posAgeCheck.valid) {
      submitMsg.className = 'jt-submit-msg error';
      submitMsg.textContent = `❌ ${posAgeCheck.message}`;
      return;
    }

    // Photo Upload Validation
    if (!applicantPhotoDataUrl) {
      submitMsg.className = 'jt-submit-msg error';
      submitMsg.textContent = '❌ กรุณาเลือกอัปโหลดรูปถ่ายหน้าตรง สุภาพ';
      $('jtPhotoInput')?.focus();
      return;
    }

    // PDPA Consent Validation
    const pdpaCheckbox = $('jtPdpaConsent');
    if (pdpaCheckbox && !pdpaCheckbox.checked) {
      submitMsg.className = 'jt-submit-msg error';
      submitMsg.textContent = '❌ กรุณาทำเครื่องหมายยินยอมตามนโยบาย PDPA และข้อตกลงการร่วมทีมก่อนส่งใบสมัคร';
      pdpaCheckbox.focus();
      return;
    }

    // Collect social links
    const socialLinks = {};
    SOCIAL_OPTIONS.forEach(s => {
      const val = (fd.get(`social_${s.key}`) || '').trim();
      if (val) socialLinks[s.key] = val;
    });

    // Collect custom questions
    const customAnswers = {};
    (formConfig.customQuestions || []).forEach((q, i) => {
      const name = `cq_${q.id || i}`;
      const label = q.label || `คำถามข้อที่ ${i + 1}`;
      if (q.type === 'checkbox') {
        customAnswers[label] = fd.getAll(`${name}[]`);
      } else {
        const val = fd.get(name);
        if (val) customAnswers[label] = val;
      }
    });

    // Capture Current Logged-in User UID & Email
    const authUser = (typeof firebase !== 'undefined' && firebase.auth) ? firebase.auth().currentUser : null;
    const applicantUid = authUser ? authUser.uid : null;
    const applicantEmail = (authUser ? authUser.email : null) || socialLinks.email || null;

    // Build Payload
    const payload = {
      formId: FORM_DOC_ID,
      projectSlug: ROUTE_PROJECT_SLUG || null,
      status: 'submitted',
      applicantUid: applicantUid,
      userId: applicantUid,
      applicantEmail: applicantEmail,
      applicant: {
        uid: applicantUid,
        email: applicantEmail,
        firstName: get('firstName'),
        lastName: get('lastName'),
        nickname: get('nickname'),
        dob: get('dob'),
        age: { years: ageData.years, months: ageData.months, days: ageData.days },
        gender: get('gender'),
        photoURL: applicantPhotoDataUrl,
        platform: get('platform'),
        platformOther: get('platformOther'),
        deviceOS: get('deviceOS'),
        deviceOSOther: get('deviceOSOther'),
        hasMic: get('hasMic'),
        availableDays: selectedDays,
        availableTimeStart: get('availableTimeStart'),
        availableTimeEnd: get('availableTimeEnd'),
        socialLinks,
        motivation: get('motivation'),
        pdpaConsent: true,
        pdpaConsentAt: new Date().toISOString(),
      },
      positionId: get('positionId'),
      positionName: position.name,
      customAnswers,
      note: '',
      contractRefNo: `BCX-CTR-2026-${Date.now().toString().slice(-6)}`,
      contract: { sent: false },
      notifiedAt: null,
      createdAt: firebase.firestore.FieldValue.serverTimestamp(),
    };

    submitBtn.disabled = true;
    submitBtn.textContent = '⏳ กำลังส่งใบสมัคร...';
    submitMsg.className = 'jt-submit-msg info';
    submitMsg.textContent = '';

    try {
      const db = firebase.firestore();
      const ref = await db.collection(APPLICATIONS_COL).add(payload);

      // Notification for Admin Team
      await db.collection('joinTeamNotifications').add({
        type: 'submitted',
        applicationId: ref.id,
        applicantName: `${payload.applicant.nickname} (${payload.applicant.firstName} ${payload.applicant.lastName})`,
        positionName: position.name,
        createdAt: firebase.firestore.FieldValue.serverTimestamp(),
        read: false,
      });

      // Notification for Applicant User
      const userNotif = {
        title: `🚀 ส่งใบสมัครตำแหน่ง "${position.name}" สำเร็จ`,
        message: `ใบสมัครของคุณถูกบันทึกเข้าระบบเรียบร้อยแล้ว (เลขอ้างอิง: ${payload.contractRefNo}) ติดตามสถานะและสัญญาได้ที่นี่`,
        type: 'application_submitted',
        url: `/contract?id=${ref.id}`,
        applicationId: ref.id,
        positionName: position.name,
        createdAt: firebase.firestore.FieldValue.serverTimestamp(),
        read: false
      };

      if (applicantUid) {
        try {
          await db.collection('users').doc(applicantUid).collection('notifications').add(userNotif);
        } catch (e) {}
      }

      // Send Discord Webhook Notification to Dev Team (if configured securely)
      try {
        const webhookUrl = formConfig?.discordWebhookUrl;
        if (webhookUrl && webhookUrl.startsWith('https://')) {
          const a = payload.applicant || {};
          const embed = {
            title: `🚀 มีผู้สมัครร่วมทีมใหม่! [${position.name}]`,
            description: `มีผู้สมัครส่งใบสมัครเข้าสู่ระบบ BestCyniX Dev\n**หมายเลขอ้างอิงสัญญา:** \`${payload.contractRefNo}\``,
            color: 0x32ffc9,
            fields: [
              { name: '👤 ชื่อ-นามสกุล (ชื่อเล่น)', value: `${a.firstName || ''} ${a.lastName || ''} (${a.nickname || '-'})`, inline: true },
              { name: '🎂 อายุ', value: `${a.age?.years || '-'} ปี (เกิด ${a.dob || '-'})`, inline: true },
              { name: '💼 ตำแหน่งที่สมัคร', value: position.name, inline: true },
              { name: '💻 อุปกรณ์ & OS', value: `${a.platform || '-'} ${a.deviceOS ? `(${a.deviceOS})` : ''}`, inline: true },
              { name: '📅 วัน/เวลาที่สะดวก', value: `${(a.availableDays || []).join(', ') || '-'} [${a.availableTimeStart || ''} - ${a.availableTimeEnd || ''}]`, inline: true },
              { name: '📱 ข้อมูลติดต่อ', value: Object.entries(a.socialLinks || {}).map(([k, v]) => `${k.toUpperCase()}: ${v}`).join(' | ') || '-', inline: false },
              { name: '💡 ความถนัด / แรงจูงใจ', value: (a.motivation || '-').slice(0, 1000), inline: false },
              { name: '🔗 ลิงก์ตรวจสอบเอกสารสัญญา', value: `[📄 เปิดดูเอกสารสัญญา (Contract)](https://bestcynixdev.web.app/contract?id=${ref.id}) • [⚡ ตรวจใบสมัคร](https://bestcynixdev.web.app/admin-join-team)`, inline: false }
            ],
            footer: { text: '⚡ BestCyniX Dev Recruitment Gateway • Auto Notification', icon_url: 'https://bestcynixdev.web.app/assets/photo/bcxlogo2.png' },
            timestamp: new Date().toISOString()
          };

          if (a.photoURL && a.photoURL.startsWith('http')) {
            embed.thumbnail = { url: a.photoURL };
          }

          fetch(webhookUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              username: 'BestCyniX Recruitment Bot',
              avatar_url: 'https://bestcynixdev.web.app/assets/photo/bcxlogo2.png',
              embeds: [embed]
            })
          }).catch(e => console.warn('Discord webhook fetch error:', e));
        }
      } catch (e) {
        console.warn('Discord webhook payload error:', e);
      }

      form.innerHTML = `
        <div style="text-align:center;padding:3rem 1rem;">
          <div style="font-size:3.5rem;margin-bottom:1rem;">🎉</div>
          <h2 style="font-size:1.8rem;font-weight:800;color:#fff;margin-bottom:.6rem;">ส่งใบสมัครสำเร็จ!</h2>
          <p style="color:var(--muted);font-size:1rem;line-height:1.7;max-width:540px;margin:0 auto 1.5rem;">
            ใบสมัครตำแหน่ง <strong>${position.name}</strong> ของคุณถูกส่งเรียบร้อยแล้ว พร้อมหมายเลขอ้างอิงสัญญา: <strong>${payload.contractRefNo}</strong><br/>
            ทีมงาน BestCyniX Dev จะพิจารณาและแจ้งเตือนผลผ่านระบบโดยเร็ว
          </p>
          <div style="display:flex;gap:0.8rem;justify-content:center;flex-wrap:wrap;margin-bottom:2rem;">
            <div style="display:inline-flex;align-items:center;gap:.5rem;padding:.5rem 1.2rem;background:rgba(50,255,201,.12);border:1px solid var(--accent);border-radius:10px;font-size:.88rem;color:var(--accent);font-weight:700;">
              📋 หมายเลขอ้างอิง: ${payload.contractRefNo}
            </div>
            <a href="contract?id=${ref.id}" target="_blank" class="btn-primary" style="display:inline-flex;align-items:center;gap:0.4rem;background:#0284c7;border-color:#0284c7;">
              📄 ดูตัวอย่างเอกสารสัญญา
            </a>
          </div>
          <a href="/" class="btn-secondary" style="display:inline-flex;">← กลับหน้าหลัก</a>
        </div>
      `;
      showToast('ส่งใบสมัครสำเร็จ! ✅', 'ทีมงานจะพิจารณาและติดต่อกลับโดยเร็ว', 'success');
    } catch (err) {
      console.error('Apply error:', err);
      submitBtn.disabled = false;
      submitBtn.textContent = '🚀 ส่งใบสมัคร';
      submitMsg.className = 'jt-submit-msg error';
      submitMsg.textContent = `❌ เกิดข้อผิดพลาด: ${err.message}`;
      showToast('เกิดข้อผิดพลาด', err.message, 'error');
    }
  };

  // ── Init ──────────────────────────────────────────────────────────────────
  const init = () => {
    // Set max date for DOB input to today (prevent picking future dates)
    const dobInput = $('jtDob');
    const ageDisplay = $('jtAgeDisplay');
    const ageHidden = $('jtAgeHidden');

    const todayStr = new Date().toISOString().split('T')[0];
    if (dobInput) {
      dobInput.setAttribute('max', todayStr);
      dobInput.addEventListener('input', () => {
        const val = dobInput.value;
        if (!val) {
          if (ageDisplay) { ageDisplay.value = ''; ageDisplay.style.color = ''; }
          if (ageHidden) ageHidden.value = '';
          updatePositionAgeBadge();
          return;
        }
        const age = calcAge(val);
        if (age.error === 'future' || age.error === 'invalid') {
          if (ageDisplay) {
            ageDisplay.value = '⚠️ วันเกิดไม่ถูกต้อง (ไม่สามารถเลือกวันในอนาคตได้)';
            ageDisplay.style.color = 'var(--accent-red)';
          }
          if (ageHidden) ageHidden.value = '';
        } else {
          if (ageDisplay) {
            ageDisplay.value = `${age.years} ปี ${age.months} เดือน ${age.days} วัน`;
            ageDisplay.style.color = '';
          }
          if (ageHidden) ageHidden.value = age.years;
        }
        updatePositionAgeBadge();
      });
    }

    // Position change listener
    $('jtPosition')?.addEventListener('change', updatePositionAgeBadge);

    // Platform conditional fields
    const platformSel = $('jtPlatform');
    if (platformSel) {
      platformSel.addEventListener('change', () => {
        const val = platformSel.value;
        const isOther = val === 'อื่น ๆ';
        const isPC = val === 'คอม/โน้ตบุ๊ก';
        $('jtPlatformOtherWrap') && ($('jtPlatformOtherWrap').style.display = isOther ? '' : 'none');
        $('jtOsWrap') && ($('jtOsWrap').style.display = isPC ? '' : 'none');

        const osOther = $('jtOsOtherWrap');
        if (!isPC && osOther) osOther.style.display = 'none';
      });
    }
    const osSel = $('jtOs');
    if (osSel) {
      osSel.addEventListener('change', () => {
        $('jtOsOtherWrap') && ($('jtOsOtherWrap').style.display = osSel.value === 'อื่น ๆ' ? '' : 'none');
      });
    }

    // Photo input listener with compression
    const photoInput = $('jtPhotoInput');
    if (photoInput) {
      photoInput.addEventListener('change', (e) => {
        const file = e.target.files && e.target.files[0];
        if (!file) return;
        if (!file.type.startsWith('image/')) {
          showToast('ไฟล์ไม่ถูกต้อง', 'กรุณาเลือกไฟล์รูปภาพ (JPG, PNG)', 'error');
          photoInput.value = '';
          return;
        }
        if (file.size > 5 * 1024 * 1024) {
          showToast('ไฟล์มีขนาดใหญ่เกินไป', 'กรุณาเลือกไฟล์ภาพขนาดไม่เกิน 5MB', 'error');
          photoInput.value = '';
          return;
        }

        const reader = new FileReader();
        reader.onload = (ev) => {
          const img = new Image();
          img.onload = () => {
            const maxW = 400;
            const maxH = 500;
            let w = img.width;
            let h = img.height;
            if (w > maxW || h > maxH) {
              const ratio = Math.min(maxW / w, maxH / h);
              w = Math.round(w * ratio);
              h = Math.round(h * ratio);
            }
            const canvas = document.createElement('canvas');
            canvas.width = w;
            canvas.height = h;
            const ctx = canvas.getContext('2d');
            ctx.drawImage(img, 0, 0, w, h);
            applicantPhotoDataUrl = canvas.toDataURL('image/jpeg', 0.82);

            const preview = $('jtPhotoPreview');
            if (preview) preview.src = applicantPhotoDataUrl;
          };
          img.src = ev.target.result;
        };
        reader.readAsDataURL(file);
      });
    }

    // Social Picker Init
    renderSocialPicker();

    // Form submit
    const form = $('jtForm');
    if (form) form.addEventListener('submit', handleSubmit);

    // Load form config from Firestore
    if (typeof firebase !== 'undefined' && firebase.apps.length) {
      const db = firebase.firestore();
      db.collection(FORMS_COL).doc(FORM_DOC_ID).onSnapshot((doc) => {
        if (doc.exists) {
          applyFormConfig(mergeRouteConfig(doc.data()));
        } else {
          applyFormConfig(mergeRouteConfig({ isOpen: ROUTE_PROJECT_SLUG === 'mc-skyline', title: 'สมัครร่วมทีม BestCyniX Dev', positions: [], customQuestions: [] }));
        }
      }, (err) => {
        console.warn('JoinTeam config load error:', err);
        applyFormConfig(mergeRouteConfig({ isOpen: ROUTE_PROJECT_SLUG === 'mc-skyline', title: 'สมัครร่วมทีม BestCyniX Dev', positions: [], customQuestions: [] }));
      });
    } else {
      applyFormConfig(mergeRouteConfig({ isOpen: false, positions: [], customQuestions: [] }));
    }
  };

  ['jtRoleSearch', 'jtRoleStatusFilter'].forEach((id) => {
    $(id)?.addEventListener('input', () => formConfig && renderRoleDirectory(formConfig));
    $(id)?.addEventListener('change', () => formConfig && renderRoleDirectory(formConfig));
  });

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
