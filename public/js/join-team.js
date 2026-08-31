/**
 * BestCyniX Dev — Join Team Public Form Logic
 * Pure Firestore SDK (no backend server needed)
 */
(function () {
  'use strict';

  const ROUTE_PARTS = window.location.pathname.split('/').filter(Boolean);
  // /join-team is the public directory; /join-team/:slug is the only route
  // that may display an application form. Keep the legacy ?project= URL working.
  const ROUTE_PROJECT_SLUG = new URLSearchParams(window.location.search).get('project')
    || (ROUTE_PARTS[0] === 'join-team' && ROUTE_PARTS[1] ? ROUTE_PARTS[1] : null);
  const IS_DIRECTORY_ROUTE = !ROUTE_PROJECT_SLUG;
  const FORM_DOC_ID = ROUTE_PROJECT_SLUG || 'default';
  const APPLICATIONS_COL = 'joinTeamApplications';
  const FORMS_COL = 'joinTeamForms';
  const PROJECTS_COL = 'siteRecruitmentProjects';
  let projectRegistry = [];
  let formConfigsBySlug = {};

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
  const asList = (value) => Array.isArray(value)
    ? value.map((item) => String(item || '').trim()).filter(Boolean)
    : String(value || '').split(/[\n,]/).map((item) => item.trim()).filter(Boolean);
  const renderList = (value, empty = 'ยังไม่ได้ระบุ') => {
    const items = asList(value);
    return items.length ? `<ul class="jt-detail-list">${items.map((item) => `<li>${escapeHtml(item)}</li>`).join('')}</ul>` : `<p class="jt-detail-empty">${empty}</p>`;
  };

  // Recruitment content is stored in Firestore (joinTeamForms/{projectSlug}).
  // Keep only a small offline shell here; project-specific copy, roles, stacks,
  // benefits and questions must come from the database and remain editable in Admin.
  const GENERAL_DEFAULT = {
    formId: FORM_DOC_ID,
    projectSlug: ROUTE_PROJECT_SLUG || 'all',
    isOpen: true,
    title: 'ร่วมพัฒนาโปรเจกต์กับทีม',
    subtitle: 'เลือกโปรเจกต์และตำแหน่งที่สนใจเพื่ออ่านรายละเอียดและสมัครร่วมทีม',
    communityName: 'BestCyniX Dev',
    communityUrl: 'https://discord.gg/M8k2N3XgYF',
    websiteUrl: 'https://bestcynixdev.web.app',
    projectImage: 'assets/photo/bcxlogo2.png',
    projectBanner: 'assets/photo/bcxlogo2.png',
    projectIntro: 'กำลังโหลดรายละเอียดโปรเจกต์จากระบบ',
    highlights: [],
    stack: [],
    ageRange: {},
    availableDays: ALL_DAYS,
    positions: [],
    benefits: [],
    customQuestions: []
  };
  const PROJECT_CONFIGS = {};
  const getRouteDefault = () => PROJECT_CONFIGS[ROUTE_PROJECT_SLUG] || GENERAL_DEFAULT;
  const getProjectRegistryMeta = () => projectRegistry.find((project) => (project.slug || project.id) === ROUTE_PROJECT_SLUG) || null;
  const mergeRouteConfig = (remote, registryMeta = getProjectRegistryMeta()) => {
    const routeDefault = getRouteDefault();
    const source = remote || {};
    const registry = registryMeta || {};
    const legacyGenericDefault = !ROUTE_PROJECT_SLUG && source.title === 'สมัครร่วมทีม BestCyniX Dev';
    return {
      ...routeDefault,
      ...registry,
      ...source,
      isOpen: registry.visible === false ? false : (legacyGenericDefault ? true : (registry.isOpen !== undefined ? registry.isOpen : (source.isOpen !== undefined ? source.isOpen : routeDefault.isOpen))),
      title: registry.title || (source.title && source.title !== 'สมัครร่วมทีม BestCyniX Dev' ? source.title : routeDefault.title),
      subtitle: source.subtitle && source.subtitle !== 'เป็นส่วนหนึ่งในการพัฒนาโปรเจกต์สุดเจ๋งกับ BestCyniX Dev' ? source.subtitle : (registry.summary || routeDefault.subtitle),
      positions: legacyGenericDefault ? routeDefault.positions : (Array.isArray(source.positions) && source.positions.length
        ? source.positions.map((position) => ({ ...(routeDefault.positions || []).find((fallback) => fallback.id === position.id || fallback.name === position.name), ...position }))
        : routeDefault.positions),
      benefits: legacyGenericDefault ? routeDefault.benefits : (Array.isArray(source.benefits) && source.benefits.length ? source.benefits : routeDefault.benefits),
      projectIntro: source.projectIntro || registry.projectIntro || routeDefault.projectIntro || routeDefault.subtitle,
      projectBanner: source.projectBanner || registry.projectBanner || routeDefault.projectBanner || routeDefault.projectImage,
      highlights: asList(source.highlights).length ? source.highlights : (asList(registry.highlights).length ? registry.highlights : (routeDefault.highlights || [])),
      customQuestions: legacyGenericDefault ? routeDefault.customQuestions : (Array.isArray(source.customQuestions) ? source.customQuestions : routeDefault.customQuestions),
      availableDays: Array.isArray(source.availableDays) && source.availableDays.length ? source.availableDays : routeDefault.availableDays,
      communityName: registry.communityName || source.communityName || routeDefault.communityName,
      communityUrl: registry.communityUrl || source.communityUrl || routeDefault.communityUrl,
      websiteUrl: registry.websiteUrl || source.websiteUrl || routeDefault.websiteUrl
    };
  };

  // The directory is assembled from Firestore registry + form documents.
  // There is intentionally no project content fallback in the public bundle.
  const fallbackProjectRows = () => [];

  const getProjectRows = (cfg) => {
    if (ROUTE_PROJECT_SLUG) {
      const registry = getProjectRegistryMeta();
      return [{
        slug: ROUTE_PROJECT_SLUG,
        project: cfg,
        positions: cfg.positions || [],
        isOpen: registry ? registry.isOpen !== false && registry.visible !== false : cfg.isOpen !== false,
        visible: registry ? registry.visible !== false : true,
        displayOrder: registry?.displayOrder || 0
      }];
    }

    const registeredSlugs = new Set(projectRegistry.map((project) => project.slug || project.id).filter(Boolean));
    const registryRows = projectRegistry.map((project) => ({ ...project, slug: project.slug || project.id }))
      .filter((project) => project.slug && project.slug !== 'default');
    const formRows = Object.entries(formConfigsBySlug)
      .filter(([slug]) => slug !== 'default' && !registeredSlugs.has(slug))
      .map(([slug, form]) => ({
        slug,
        title: form.title || slug,
        summary: form.subtitle || '',
        communityName: form.communityName || '',
        communityUrl: form.communityUrl || '',
        websiteUrl: form.websiteUrl || '',
        projectImage: form.projectImage || '',
        projectBanner: form.projectBanner || '',
        projectIntro: form.projectIntro || '',
        highlights: form.highlights || [],
        stack: form.stack || [],
        isOpen: form.isOpen !== false,
        visible: true,
        displayOrder: 100
      }));

    return [...registryRows, ...formRows]
      .filter((meta) => meta.visible !== false)
      .sort((a, b) => Number(a.displayOrder || 0) - Number(b.displayOrder || 0))
      .map((meta) => {
        const slug = meta.slug;
        const remote = formConfigsBySlug[slug] || {};
        const project = {
          ...mergeRouteConfig(remote, meta),
          title: meta.title || remote.title || slug,
          subtitle: remote.subtitle || meta.summary || remote.projectIntro || ''
        };
        return { slug, project, positions: project.positions || [], isOpen: meta.isOpen !== false && project.isOpen !== false, visible: meta.visible !== false, displayOrder: meta.displayOrder || 0 };
      });
  };
  const escapeHtml = (value) => String(value ?? '').replace(/[&<>"']/g, (char) => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#039;'
  }[char]));

  const renderRoleDirectory = (cfg) => {
    const wrap = $('jtRoleDirectory');
    if (!wrap) return;
    const search = ($('jtRoleSearch')?.value || '').trim().toLowerCase();
    const filter = $('jtRoleStatusFilter')?.value || 'all';
    const projectRows = getProjectRows(cfg);
    const roles = projectRows.flatMap(({ slug, project, positions, isOpen }) => positions.filter(p => p.active !== false).map((p) => ({ ...p, projectSlug: slug, projectName: project.title || project.communityName || slug, projectSummary: project.subtitle || project.summary || '', projectIntro: project.projectIntro || '', projectImage: project.projectImage || '', projectStack: project.stack || [], communityName: project.communityName || '', projectOpen: isOpen }))).filter((p) => {
      const approved = Number(p.approvedCount || 0);
      const unlimited = !p.maxSlots || p.maxSlots <= 0 || p.unlimited === true;
      const left = p.slotsLeft !== undefined ? Number(p.slotsLeft) : (unlimited ? 9999 : Math.max(0, Number(p.maxSlots) - approved));
      const searchable = `${p.name || ''} ${p.description || ''} ${p.projectName || ''}`.toLowerCase();
      return (!search || searchable.includes(search))
        && (filter === 'all' || (filter === 'open' ? p.projectOpen && (unlimited || left > 0) : !p.projectOpen || (!unlimited && left <= 0)));
    });
    if (!roles.length) {
      wrap.innerHTML = '<div style="grid-column:1/-1;padding:1rem;color:var(--muted);text-align:center;border:1px dashed rgba(255,255,255,.15);border-radius:12px;">ไม่พบตำแหน่งตามตัวกรอง</div>';
      return;
    }
    const grouped = roles.reduce((map, role) => {
      if (!map.has(role.projectSlug)) map.set(role.projectSlug, { ...role, roles: [] });
      map.get(role.projectSlug).roles.push(role);
      return map;
    }, new Map());

    wrap.innerHTML = Array.from(grouped.values()).map((project) => {
      const projectHref = `/join-team/${encodeURIComponent(project.projectSlug)}`;
      const roleCards = project.roles.map((p) => {
      const approved = Number(p.approvedCount || 0);
      const unlimited = !p.maxSlots || p.maxSlots <= 0 || p.unlimited === true;
      const left = p.slotsLeft !== undefined ? Number(p.slotsLeft) : (unlimited ? 9999 : Math.max(0, Number(p.maxSlots) - approved));
      const status = !p.projectOpen ? '🔴 ปิดรับสมัคร' : (unlimited || left > 0 ? '🟢 ยังเปิดรับ' : '🔴 เต็มแล้ว');
      const quota = unlimited ? 'ไม่จำกัดจำนวน' : `ว่าง ${left}/${p.maxSlots} คน`;
      const stack = asList(p.stack || p.projectStack);
      return `<article class="jt-role-card"><div class="jt-role-card-head"><h3>${escapeHtml(p.name || 'ตำแหน่งทีมงาน')}</h3><span class="jt-role-status">${status}</span></div><p>${escapeHtml(p.description || 'ร่วมพัฒนาโปรเจกต์กับทีม')}</p><div class="jt-role-meta"><span>👥 ${quota}</span><span>🎯 ${escapeHtml(getPositionAgeRequirementText(p).replace('🎯 ', '') || 'ไม่จำกัดอายุ')}</span></div>${stack.length ? `<div class="jt-detail-block"><h4>🧰 Stack ที่ใช้</h4><div class="jt-stack-list">${stack.map((item) => `<span>${escapeHtml(item)}</span>`).join('')}</div></div>` : ''}${p.responsibilities || p.requirements || p.preferred ? `<div class="jt-role-details"><div><h4>หน้าที่และขอบเขต</h4>${renderList(p.responsibilities)}</div><div><h4>คุณสมบัติ</h4>${renderList(p.requirements)}</div><div><h4>พิจารณาเป็นพิเศษ</h4>${renderList(p.preferred)}</div></div>` : ''}</article>`;
      }).join('');
      const projectStatus = project.projectOpen ? '🟢 เปิดรับสมัครอยู่' : '🔴 ปิดรับสมัคร';
      const image = publicUrl(project.projectImage) || 'assets/photo/bcxlogo2.png';
      const stack = asList(project.projectStack);
      if (!IS_DIRECTORY_ROUTE) {
        return `<section class="jt-detail-roles"><div class="jt-detail-roles-head"><span class="jt-overview-kicker">OPEN POSITIONS</span><h3>ตำแหน่งที่เปิดรับ</h3><p>เลือกบทบาทที่ตรงกับความถนัด แล้วอ่าน Stack หน้าที่ คุณสมบัติ และสิ่งที่ทีมพิจารณาเป็นพิเศษ</p></div><div class="jt-project-role-grid">${roleCards}</div></section>`;
      }
      return `<section class="jt-project-group"><div class="jt-project-group-head"><div class="jt-project-brand"><img src="${escapeHtml(image)}" alt="${escapeHtml(project.projectName || 'โปรเจกต์')}" loading="lazy" onerror="this.onerror=null;this.src='assets/photo/bcxlogo2.png';"><div><span class="jt-project-kicker">PROJECT / TEAM</span><h3>${escapeHtml(project.projectName || project.projectSlug)}</h3><p>${escapeHtml(project.projectSummary || project.projectIntro || 'รายละเอียดการรับสมัครของทีมนี้')}</p><div class="jt-project-group-meta"><span>${projectStatus}</span><span>🧩 ${project.roles.length} ตำแหน่ง</span></div></div></div><a class="btn-secondary jt-project-open-link" href="${projectHref}">เปิดหน้าทีม →</a></div>${stack.length ? `<div class="jt-project-stack"><strong>Stack หลัก:</strong> ${stack.map((item) => `<span>${escapeHtml(item)}</span>`).join('')}</div>` : ''}<div class="jt-project-role-grid">${roleCards}</div><a class="jt-project-apply-link" href="${projectHref}">ดูรายละเอียดและสมัครในหน้านี้ →</a></section>`;
    }).join('');
  };

  const publicUrl = (value) => {
    try {
      const url = new URL(value, window.location.origin);
      return ['http:', 'https:'].includes(url.protocol) ? url.href : '';
    } catch {
      return '';
    }
  };
  const youtubeEmbedUrl = (value) => {
    const url = publicUrl(value);
    try {
      const parsed = new URL(url);
      return ['www.youtube.com', 'youtube.com', 'youtu.be'].includes(parsed.hostname.toLowerCase()) && parsed.pathname.startsWith('/embed/') ? parsed.href : '';
    } catch {
      return '';
    }
  };
  const renderProjectShowcase = (cfg) => {
    const wrap = $('jtProjectShowcase');
    if (!wrap) return;
    if (IS_DIRECTORY_ROUTE) { wrap.hidden = true; wrap.innerHTML = ''; return; }
    const image = publicUrl(cfg.projectBanner || cfg.projectImage) || 'assets/photo/bcxlogo2.png';
    const video = youtubeEmbedUrl(cfg.videoUrl);
    const highlights = asList(cfg.highlights);
    wrap.hidden = false;
    wrap.classList.toggle('has-video', Boolean(video));
    const modes = asList(cfg.modes);
    wrap.innerHTML = `<div class="jt-showcase-copy"><img class="jt-showcase-image" src="${escapeHtml(image)}" alt="${escapeHtml(cfg.title || 'โปรเจกต์')}" onerror="this.onerror=null;this.src='assets/photo/bcxlogo2.png';"><div><span class="jt-project-kicker">PROJECT / TEAM</span><h3>${escapeHtml(cfg.title || cfg.communityName || 'โปรเจกต์')}</h3><p>${escapeHtml(cfg.projectIntro || cfg.subtitle || '')}</p>${modes.length ? `<div class="jt-showcase-modes"><strong>โหมดที่เปิดรับทีม:</strong> ${modes.map((item) => `<span>${escapeHtml(item)}</span>`).join('')}</div>` : ''}${highlights.length ? `<ul class="jt-highlight-list">${highlights.map((item) => `<li>${escapeHtml(item)}</li>`).join('')}</ul>` : ''}</div></div>${video ? `<div class="jt-showcase-video"><iframe src="${escapeHtml(video)}" title="วิดีโอแนะนำ ${escapeHtml(cfg.title || 'โปรเจกต์')}" loading="lazy" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" allowfullscreen></iframe></div>` : ''}`;
  };

  let formConfig = null;
  let selectedDays = [];
  let activeSocials = {};
  let applicantPhotoDataUrl = null;
  let portfolioFiles = [];

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

  const portfolioFileSize = (bytes) => bytes < 1024 * 1024
    ? `${Math.max(1, Math.round(bytes / 1024))} KB`
    : `${(bytes / (1024 * 1024)).toFixed(1)} MB`;

  const renderPortfolioPreview = () => {
    const wrap = $('jtPortfolioPreview');
    if (!wrap) return;
    wrap.innerHTML = portfolioFiles.map((file) => {
      const preview = file.type.startsWith('image/')
        ? `<img class="jt-portfolio-thumb" src="${escapeHtml(URL.createObjectURL(file))}" alt="ตัวอย่าง ${escapeHtml(file.name)}" />`
        : '<div class="jt-portfolio-thumb jt-portfolio-file-icon" aria-hidden="true">📄</div>';
      return `<div class="jt-portfolio-item">${preview}<div style="min-width:0;"><div class="jt-portfolio-name" title="${escapeHtml(file.name)}">${escapeHtml(file.name)}</div><div class="jt-portfolio-size">${portfolioFileSize(file.size)}</div></div></div>`;
    }).join('');
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
      if (IS_DIRECTORY_ROUTE) {
        hide(badge);
      } else {
        show(badge);
      }
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

    if ($('jtHeroTitle')) $('jtHeroTitle').textContent = IS_DIRECTORY_ROUTE ? 'เปิดรับสมัครทีมงานหลายโปรเจกต์' : (cfg.title || 'สมัครร่วมทีม');
    if ($('jtHeroSub')) $('jtHeroSub').textContent = IS_DIRECTORY_ROUTE ? 'เลือกทีมและตำแหน่งที่สนใจเพื่ออ่านรายละเอียดและเปิดฟอร์มสมัครเฉพาะของทีมนั้น' : (cfg.subtitle || '');
    if ($('jtCommunity')) $('jtCommunity').textContent = cfg.communityName || 'BestCyniX Dev';

    const routeLinks = $('jtProjectLinks');
    if (!IS_DIRECTORY_ROUTE && routeLinks && (cfg.communityUrl || cfg.websiteUrl)) {
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
    if ($('jtRecruitmentOverview')) {
      $('jtRecruitmentOverview').style.display = '';
      const overviewTitle = $('jtOverviewTitle');
      const overviewText = $('jtOverviewTitle')?.parentElement?.querySelector('p');
      const overviewLink = document.querySelector('.jt-overview-link');
      const poster = document.querySelector('.jt-overview-poster-wrap');
      const filters = document.querySelector('.jt-overview-filters');
      if (overviewTitle) overviewTitle.textContent = IS_DIRECTORY_ROUTE ? '📣 ตำแหน่งที่เปิดรับและโปรเจกต์ทั้งหมด' : `📣 ตำแหน่งที่เปิดรับ: ${cfg.title || cfg.communityName || 'โปรเจกต์'}`;
      if (overviewText) overviewText.textContent = IS_DIRECTORY_ROUTE ? 'เลือกทีมและตำแหน่งที่สนใจเพื่ออ่านรายละเอียดการทำงาน Stack และเปิดฟอร์มสมัครเฉพาะของทีมนั้น' : 'อ่านหน้าที่ ขอบเขตงาน Stack ที่ใช้ คุณสมบัติ และสิ่งที่ทีมพิจารณาเป็นพิเศษก่อนสมัคร';
      if (overviewLink) overviewLink.hidden = !IS_DIRECTORY_ROUTE;
      if (poster) poster.style.display = IS_DIRECTORY_ROUTE ? '' : 'none';
      if (filters) filters.style.display = IS_DIRECTORY_ROUTE ? '' : 'none';
    }
    renderProjectShowcase(cfg);
    renderRoleDirectory(cfg);

    // Benefits
    if (!IS_DIRECTORY_ROUTE && cfg.benefits && cfg.benefits.length && isOpen) {
      const sec = $('jtBenefitsSection');
      const grid = $('jtBenefitsGrid');
      if (sec && grid) {
        show(sec);
        grid.innerHTML = cfg.benefits.map(b => `
          <div class="jt-benefit-card">
            <div class="icon">${escapeHtml(b.icon || '🎁')}</div>
            <h4>${escapeHtml(b.title || '')}</h4>
            <p>${escapeHtml(b.desc || '')}</p>
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

    if (IS_DIRECTORY_ROUTE) {
      hide(formWrap);
      hide(closedBanner);
      hide(metaRow);
      hide($('jtBenefitsSection'));
    } else if (isOpen) {
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

  // ── Application Step Flow ────────────────────────────────────────────────
  // The form markup stays easy to edit in HTML, while this adapter groups it
  // into four focused panels for applicants and keeps the existing submit
  // payload unchanged.
  let currentFormStep = 1;
  let formStepFlowReady = false;
  const initApplicationStepFlow = () => {
    const form = $('jtForm');
    if (!form || formStepFlowReady) return;

    const sections = Array.from(form.querySelectorAll(':scope > .jt-form-section'));
    if (sections.length < 7) return;

    const [personalSection, scheduleSection, socialSection, customSection, portfolioSection, motivationSection, pdpaSection] = sections;
    const firstSection = personalSection;
    const positionGroup = $('jtPosition')?.closest('.jt-form-group');
    const candidateProfile = personalSection.querySelector('.jt-candidate-profile-fields');
    const submitRow = form.querySelector(':scope > .jt-submit-row');

    const positionSection = document.createElement('section');
    positionSection.className = 'jt-form-section';
    positionSection.innerHTML = `
      <h3>💼 ตำแหน่งและความสามารถ</h3>
      <p style="font-size:.84rem;color:var(--muted);margin:-.35rem 0 1rem;">เลือกตำแหน่งที่สมัคร และเรียงลำดับความถนัดที่อยากรับผิดชอบให้ทีมพิจารณา</p>
    `;
    const positionGrid = document.createElement('div');
    positionGrid.className = 'jt-form-grid';
    positionSection.appendChild(positionGrid);
    if (positionGroup) positionGrid.appendChild(positionGroup);
    if (candidateProfile) positionGrid.appendChild(candidateProfile);

    const panels = [1, 2, 3, 4].map((step) => {
      const panel = document.createElement('div');
      panel.className = 'jt-step-panel';
      panel.dataset.stepPanel = String(step);
      panel.setAttribute('aria-label', `ขั้นตอนที่ ${step} จาก 4`);
      return panel;
    });

    // Insert before the original first section, then move the original
    // sections into their step panel. Moving nodes preserves all input IDs,
    // listeners, and the existing FormData contract.
    form.insertBefore(panels[0], firstSection);
    panels.slice(1).forEach((panel) => form.insertBefore(panel, firstSection));
    panels[0].appendChild(personalSection);
    panels[1].appendChild(positionSection);
    if (customSection) panels[1].appendChild(customSection);
    panels[2].appendChild(scheduleSection);
    panels[2].appendChild(socialSection);
    panels[3].appendChild(portfolioSection);
    panels[3].appendChild(motivationSection);
    panels[3].appendChild(pdpaSection);
    if (submitRow) panels[3].appendChild(submitRow);

    const nav = document.createElement('div');
    nav.className = 'jt-step-actions';
    nav.innerHTML = `
      <button type="button" id="jtStepBack" class="btn-secondary">← ย้อนกลับ</button>
      <span id="jtStepHint" class="jt-step-hint" aria-live="polite"></span>
      <button type="button" id="jtStepNext" class="btn-primary">ถัดไป →</button>
    `;
    form.appendChild(nav);

    const stepLabels = ['โปรไฟล์', 'ตำแหน่ง', 'เวลาทำงาน', 'ส่งใบสมัคร'];
    const submitMsg = $('jtSubmitMsg');
    const stepHint = $('jtStepHint');
    const clearStepMessage = () => {
      if (submitMsg && submitMsg.classList.contains('error')) {
        submitMsg.className = 'jt-submit-msg';
        submitMsg.textContent = '';
      }
      if (stepHint) stepHint.classList.remove('error');
    };
    const setStepMessage = (message) => {
      if (stepHint) {
        stepHint.classList.add('error');
        stepHint.textContent = `❌ ${message}`;
      }
    };
    const validateCurrentStep = () => {
      const panel = panels[currentFormStep - 1];
      if (!panel) return true;
      if (currentFormStep === 3 && !selectedDays.length) {
        setStepMessage('กรุณาเลือกวันที่สะดวกทำงานอย่างน้อย 1 วัน');
        return false;
      }
      const controls = Array.from(panel.querySelectorAll('input, select, textarea'))
        .filter((control) => !control.disabled && control.required);
      const invalid = controls.find((control) => !control.checkValidity());
      if (invalid) {
        invalid.reportValidity();
        return false;
      }
      return true;
    };
    const setCurrentFormStep = (step) => {
      currentFormStep = Math.max(1, Math.min(4, step));
      panels.forEach((panel, index) => {
        panel.hidden = index !== currentFormStep - 1;
      });
      const stepNodes = Array.from(document.querySelectorAll('.jt-form-steps span'));
      stepNodes.forEach((node, index) => {
        node.classList.toggle('is-current', index === currentFormStep - 1);
        node.classList.toggle('is-complete', index < currentFormStep - 1);
        node.setAttribute('aria-current', index === currentFormStep - 1 ? 'step' : 'false');
      });
      form.dataset.currentStep = String(currentFormStep);
      const back = $('jtStepBack');
      const next = $('jtStepNext');
      if (back) back.hidden = currentFormStep === 1;
      if (next) next.hidden = currentFormStep === 4;
      if (stepHint) stepHint.textContent = `ขั้นตอน ${currentFormStep}/4 • ${stepLabels[currentFormStep - 1]}`;
      clearStepMessage();
    };

    $('jtStepBack')?.addEventListener('click', () => setCurrentFormStep(currentFormStep - 1));
    $('jtStepNext')?.addEventListener('click', () => {
      if (validateCurrentStep()) setCurrentFormStep(currentFormStep + 1);
    });
    formStepFlowReady = true;
    setCurrentFormStep(1);
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
      ['hasMic', 'ไมค์'], ['desiredPosition1', 'ตำแหน่ง/งานที่ต้องการรับผิดชอบอันดับ 1'],
      ['skill1', 'ความสามารถที่ถนัดอันดับ 1'], ['experience', 'ประสบการณ์และสิ่งที่ทำได้'],
      ['motivation', 'เหตุผลที่อยากร่วมทีม']
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

    const portfolioUrl = get('portfolioUrl');
    if (portfolioUrl) {
      try {
        const parsedPortfolioUrl = new URL(portfolioUrl);
        if (!['http:', 'https:'].includes(parsedPortfolioUrl.protocol)) throw new Error('invalid protocol');
      } catch {
        submitMsg.className = 'jt-submit-msg error';
        submitMsg.textContent = '❌ ลิงก์ Portfolio ต้องเป็น URL ที่ขึ้นต้นด้วย http:// หรือ https://';
        $('jtPortfolioUrl')?.focus();
        return;
      }
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

    if (portfolioFiles.length && !applicantUid) {
      submitMsg.className = 'jt-submit-msg error';
      submitMsg.textContent = '❌ กรุณาเข้าสู่ระบบก่อนอัปโหลด Portfolio เพื่อผูกไฟล์กับเจ้าของข้อมูล';
      $('jtPortfolioInput')?.focus();
      return;
    }

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
        desiredPositions: [get('desiredPosition1'), get('desiredPosition2'), get('desiredPosition3')].filter(Boolean),
        skills: [get('skill1'), get('skill2'), get('skill3')].filter(Boolean),
        experience: get('experience'),
        portfolio: { link: portfolioUrl || null, files: [] },
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

    let applicationRef = null;
    const uploadedPortfolioRefs = [];
    let applicationSaved = false;
    try {
      const db = firebase.firestore();
      applicationRef = db.collection(APPLICATIONS_COL).doc();

      if (portfolioFiles.length) {
        const storage = firebase.storage();
        payload.applicant.portfolio.files = await Promise.all(portfolioFiles.map(async (file, index) => {
          const safeName = file.name.replace(/[^a-zA-Z0-9._-]+/g, '_').slice(-120) || `portfolio-${index + 1}`;
          const contentType = file.type || (/\.pdf$/i.test(file.name) ? 'application/pdf' : 'application/octet-stream');
          const path = `recruitment-portfolios/${applicantUid}/${applicationRef.id}/${Date.now()}-${index + 1}-${safeName}`;
          const fileRef = storage.ref(path);
          uploadedPortfolioRefs.push(fileRef);
          const snapshot = await fileRef.put(file, {
            contentType,
            customMetadata: { uploadedBy: applicantUid, applicationId: applicationRef.id }
          });
          const url = await snapshot.ref.getDownloadURL();
          return { name: file.name, path, url, contentType, size: file.size };
        }));
      }

      await applicationRef.set(payload);
      applicationSaved = true;

      // Notification for Admin Team
      await db.collection('joinTeamNotifications').add({
        type: 'submitted',
        projectSlug: ROUTE_PROJECT_SLUG || null,
        applicationId: applicationRef.id,
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
        url: `/contract?id=${applicationRef.id}`,
        applicationId: applicationRef.id,
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
              { name: '🎯 ตำแหน่ง/ความสามารถ', value: `ตำแหน่ง: ${(a.desiredPositions || []).join(' → ') || '-'}\nความสามารถ: ${(a.skills || []).join(' • ') || '-'}`, inline: false },
              { name: '📁 Portfolio', value: `${a.portfolio?.files?.length || 0} ไฟล์${a.portfolio?.link ? ' + มีลิงก์เพิ่มเติม' : ''}`, inline: true },
              { name: '💡 ความถนัด / แรงจูงใจ', value: (a.motivation || '-').slice(0, 1000), inline: false },
              { name: '🔗 ลิงก์ตรวจสอบเอกสารสัญญา', value: `[📄 เปิดดูเอกสารสัญญา (Contract)](https://bestcynixdev.web.app/contract?id=${applicationRef.id}) • [⚡ ตรวจใบสมัคร](https://bestcynixdev.web.app/admin-join-team)`, inline: false }
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
            <a href="contract?id=${applicationRef.id}" target="_blank" class="btn-primary" style="display:inline-flex;align-items:center;gap:0.4rem;background:#0284c7;border-color:#0284c7;">
              📄 ดูตัวอย่างเอกสารสัญญา
            </a>
          </div>
          <a href="/" class="btn-secondary" style="display:inline-flex;">← กลับหน้าหลัก</a>
        </div>
      `;
      showToast('ส่งใบสมัครสำเร็จ! ✅', 'ทีมงานจะพิจารณาและติดต่อกลับโดยเร็ว', 'success');
    } catch (err) {
      console.error('Apply error:', err);
      if (!applicationSaved && uploadedPortfolioRefs.length) {
        await Promise.all(uploadedPortfolioRefs.map((fileRef) => fileRef.delete().catch(() => null)));
      }
      submitBtn.disabled = false;
      submitBtn.textContent = '🚀 ส่งใบสมัคร';
      submitMsg.className = 'jt-submit-msg error';
      submitMsg.textContent = `❌ เกิดข้อผิดพลาด: ${err.message}`;
      showToast('เกิดข้อผิดพลาด', err.message, 'error');
    }
  };

  // ── Init ──────────────────────────────────────────────────────────────────
  const init = () => {
    document.body.classList.toggle('jt-is-detail', !IS_DIRECTORY_ROUTE);
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

    // Portfolio files: keep a small, explicit selection and show previews before upload.
    const portfolioInput = $('jtPortfolioInput');
    if (portfolioInput) {
      portfolioInput.addEventListener('change', (e) => {
        const files = Array.from(e.target.files || []);
        const allowed = (file) => file.type.startsWith('image/') || file.type === 'application/pdf' || /\.pdf$/i.test(file.name);
        if (files.length > 3) {
          showToast('เลือกไฟล์ได้ไม่เกิน 3 ไฟล์', 'กรุณาเลือกใหม่อีกครั้ง', 'error');
          portfolioInput.value = '';
          portfolioFiles = [];
          renderPortfolioPreview();
          return;
        }
        const invalid = files.find((file) => !allowed(file) || file.size > 10 * 1024 * 1024);
        if (invalid) {
          showToast('ไฟล์ Portfolio ไม่ถูกต้อง', `${invalid.name} ต้องเป็นรูปภาพ/PDF และมีขนาดไม่เกิน 10MB`, 'error');
          portfolioInput.value = '';
          portfolioFiles = [];
          renderPortfolioPreview();
          return;
        }
        portfolioFiles = files;
        renderPortfolioPreview();
      });
    }

    // Social Picker Init
    renderSocialPicker();

    // Turn the long form into four validated steps before attaching submit.
    initApplicationStepFlow();

    // Form submit
    const form = $('jtForm');
    if (form) form.addEventListener('submit', handleSubmit);

    // Load all recruitment content from Firestore. The directory needs every
    // project form; a detail route only uses its own project document.
    if (typeof firebase !== 'undefined' && firebase.apps.length) {
      const db = firebase.firestore();
      const renderFromDatabase = () => {
        const currentMeta = getProjectRegistryMeta();
        const currentConfig = IS_DIRECTORY_ROUTE
          ? (formConfigsBySlug.default || {})
          : (formConfigsBySlug[FORM_DOC_ID] || {});
        applyFormConfig(mergeRouteConfig(currentConfig, currentMeta));
      };

      db.collection(PROJECTS_COL).onSnapshot((snapshot) => {
        projectRegistry = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
        renderFromDatabase();
      }, (err) => {
        console.warn('JoinTeam project registry load error:', err);
        projectRegistry = [];
        renderFromDatabase();
      });

      db.collection(FORMS_COL).onSnapshot((snapshot) => {
        formConfigsBySlug = Object.fromEntries(snapshot.docs.map((doc) => [doc.id, { formId: doc.id, ...doc.data() }]));
        renderFromDatabase();
      }, (err) => {
        console.warn('JoinTeam forms load error:', err);
        formConfigsBySlug = {};
        renderFromDatabase();
      });
    } else {
      applyFormConfig(mergeRouteConfig({}, getProjectRegistryMeta()));
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
