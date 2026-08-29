/**
 * BestCyniX Dev — Join Team Admin JS
 * Firebase Auth + Firestore CRUD
 */
(function () {
  'use strict';

  const FORMS_COL = 'joinTeamForms';
  const PROJECTS_COL = 'siteRecruitmentProjects';
  const APPS_COL = 'joinTeamApplications';
  const NOTIF_COL = 'joinTeamNotifications';
  const FORM_DOC_ID = new URLSearchParams(window.location.search).get('project') || 'default';
  const ADMIN_EMAIL = 'bestcynix@gmail.com';

  const ALL_DAYS = ['จันทร์', 'อังคาร', 'พุธ', 'พฤหัส', 'ศุกร์', 'เสาร์', 'อาทิตย์', 'ทุกวัน'];

  const $ = (id) => document.getElementById(id);
  let db, auth;
  let currentUser = null;
  let formConfig = {};
  let allApplications = [];
  let currentAppId = null;
  let contractClauses = [];
  let editingContractClauseIndex = null;
  const publicFormLink = $('adminPublicFormLink');
  if (publicFormLink && FORM_DOC_ID !== 'default') publicFormLink.href = `join-team/${encodeURIComponent(FORM_DOC_ID)}`;

  // ── Toast ─────────────────────────────────────────────────────────────────
  const showToast = (title, body = '', type = 'info') => {
    const wrap = $('adminToastWrap');
    if (!wrap) return;
    const toast = document.createElement('div');
    const icon = type === 'success' ? '✅' : type === 'error' ? '❌' : '🔔';
    const tone = type === 'success' ? 'tone-success' : type === 'error' ? 'tone-error' : '';
    toast.className = `jt-notif-toast ${tone}`;
    toast.innerHTML = `<span class="notif-icon">${icon}</span><div><div class="notif-title">${title}</div><div class="notif-body">${body}</div></div>`;
    wrap.appendChild(toast);
    requestAnimationFrame(() => toast.classList.add('is-show'));
    setTimeout(() => { toast.classList.remove('is-show'); setTimeout(() => toast.remove(), 400); }, 5000);
  };

  const escapeHtml = (value = '') => String(value).replace(/[&<>"']/g, (char) => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
  }[char]));

  // Project/URL registry. This is deliberately separate from joinTeamForms so
  // editing a public route never overwrites old applications or contracts.
  const DEFAULT_PROJECTS = [
    { id: 'mc-skyline', slug: 'mc-skyline', title: 'Mc-Skyline.online', summary: 'ทีม Minecraft: เว็บ บอท ปลั๊กอิน แผนที่ ระบบไอเทม เควสต์ โมเดล และ resource pack', communityName: 'Mc-Skyline.online', communityUrl: 'https://discord.gg/5eNFMMk3ak', websiteUrl: 'https://mc-skyline.online', isOpen: true, visible: true, displayOrder: 10 },
    { id: 'discord-bot', slug: 'discord-bot', title: 'Discord Bot', summary: 'ทีมพัฒนาบอท Discord, API, ระบบอัตโนมัติ และเครื่องมือดูแลชุมชน', communityName: 'Discord Bot', communityUrl: 'https://discord.gg/M8k2N3XgYF', websiteUrl: '', isOpen: true, visible: true, displayOrder: 20 },
    { id: 'discord-server', slug: 'discord-server', title: 'Discord Server', summary: 'ทีมดูแลกฎ สิทธิ์ ระบบ และกิจกรรมของเซิร์ฟเวอร์ Discord', communityName: 'Discord Server', communityUrl: 'https://discord.gg/M8k2N3XgYF', websiteUrl: '', isOpen: true, visible: true, displayOrder: 30 },
    { id: 'dev-web', slug: 'dev-web', title: 'Web Development', summary: 'ทีมสร้างเว็บไซต์ เว็บแอป ระบบหลังบ้าน และระบบคลาวด์', communityName: 'Web Development', communityUrl: 'https://discord.gg/M8k2N3XgYF', websiteUrl: 'https://bestcynixdev.web.app', isOpen: true, visible: true, displayOrder: 40 },
    { id: 'teamdev', slug: 'teamdev', title: 'ทีมพัฒนา BestCyniX Dev', summary: 'เปิดรับทีมงานตามความสามารถ ให้ระบุความถนัดและตำแหน่งที่ต้องการรับผิดชอบ 1–3', communityName: 'ทีมพัฒนา BestCyniX Dev', communityUrl: 'https://discord.gg/M8k2N3XgYF', websiteUrl: 'https://bestcynixdev.web.app', isOpen: true, visible: true, displayOrder: 50 }
  ];
  let projectRegistry = [];

  const projectRecordFromCard = (card) => {
    const slug = (card.querySelector('[data-field="slug"]')?.value || '').trim().toLowerCase();
    return {
      id: slug,
      slug,
      title: (card.querySelector('[data-field="title"]')?.value || '').trim(),
      summary: (card.querySelector('[data-field="summary"]')?.value || '').trim(),
      communityName: (card.querySelector('[data-field="communityName"]')?.value || '').trim(),
      communityUrl: (card.querySelector('[data-field="communityUrl"]')?.value || '').trim(),
      websiteUrl: (card.querySelector('[data-field="websiteUrl"]')?.value || '').trim(),
      displayOrder: Math.max(0, Math.min(10000, parseInt(card.querySelector('[data-field="displayOrder"]')?.value, 10) || 0)),
      isOpen: Boolean(card.querySelector('[data-field="isOpen"]')?.checked),
      visible: Boolean(card.querySelector('[data-field="visible"]')?.checked)
    };
  };

  const renderProjectRegistry = () => {
    const wrap = $('projectRegistryList');
    if (!wrap) return;
    if (!projectRegistry.length) {
      wrap.innerHTML = '<div style="padding:1.25rem;color:var(--muted);border:1px dashed rgba(255,255,255,.16);border-radius:12px;text-align:center;">ยังไม่มีทะเบียนโปรเจกต์ กด “โหลดค่าเริ่มต้น 5 ทีม” หรือ “เพิ่มโปรเจกต์”</div>';
      return;
    }
    const sorted = [...projectRegistry].sort((a, b) => Number(a.displayOrder || 0) - Number(b.displayOrder || 0));
    wrap.innerHTML = sorted.map((project) => {
      const id = escapeHtml(project.id || project.slug || '');
      return `<article class="project-registry-card" data-project-id="${id}">
        <div class="project-registry-heading"><div><strong>${escapeHtml(project.title || project.slug || 'โปรเจกต์ใหม่')}</strong><small>/join-team/${escapeHtml(project.slug || '')}</small></div><span class="project-registry-state ${project.visible === false ? 'is-hidden' : (project.isOpen === false ? 'is-closed' : 'is-open')}">${project.visible === false ? 'ซ่อนอยู่' : (project.isOpen === false ? 'ปิดรับสมัคร' : 'เปิดรับสมัคร')}</span></div>
        <div class="project-registry-grid">
          <label>URL slug<input class="jt-input" data-field="slug" value="${escapeHtml(project.slug || '')}" placeholder="เช่น discord-bot" /></label>
          <label>ชื่อทีม/โปรเจกต์<input class="jt-input" data-field="title" value="${escapeHtml(project.title || '')}" placeholder="ชื่อที่แสดงบนหน้าเว็บ" /></label>
          <label style="grid-column:1/-1;">คำอธิบาย<input class="jt-input" data-field="summary" value="${escapeHtml(project.summary || '')}" placeholder="รายละเอียดสั้น ๆ ของทีม" /></label>
          <label>ชื่อชุมชน<input class="jt-input" data-field="communityName" value="${escapeHtml(project.communityName || '')}" placeholder="ชื่อ Discord/ชุมชน" /></label>
          <label>ลิงก์ชุมชน<input class="jt-input" data-field="communityUrl" value="${escapeHtml(project.communityUrl || '')}" placeholder="https://discord.gg/..." /></label>
          <label>URL เว็บไซต์<input class="jt-input" data-field="websiteUrl" value="${escapeHtml(project.websiteUrl || '')}" placeholder="https://..." /></label>
          <label>ลำดับแสดง<input class="jt-input" data-field="displayOrder" type="number" min="0" max="10000" value="${Number(project.displayOrder || 0)}" /></label>
        </div>
        <div class="project-registry-actions">
          <label class="toggle-switch"><input data-field="isOpen" type="checkbox" ${project.isOpen !== false ? 'checked' : ''}/><span class="toggle-track"></span><span class="toggle-thumb"></span><span class="toggle-label">เปิดรับสมัคร</span></label>
          <label class="toggle-switch"><input data-field="visible" type="checkbox" ${project.visible !== false ? 'checked' : ''}/><span class="toggle-track"></span><span class="toggle-thumb"></span><span class="toggle-label">แสดง URL นี้</span></label>
          <div class="project-registry-buttons"><a class="jt-admin-btn secondary" href="/join-team/${encodeURIComponent(project.slug || '')}" target="_blank">🔗 เปิดหน้า</a><a class="jt-admin-btn secondary" href="/admin-join-team?project=${encodeURIComponent(project.slug || '')}" target="_blank">⚙️ ตั้งค่าฟอร์ม</a><button type="button" class="jt-admin-btn primary btn-save-project">💾 บันทึก</button><button type="button" class="jt-admin-btn danger btn-hide-project">${project.visible === false ? '♻️ แสดงกลับ' : '🗑️ ซ่อน/ลบ'}</button></div>
        </div>
      </article>`;
    }).join('');

    wrap.querySelectorAll('.btn-save-project').forEach((button) => button.addEventListener('click', () => saveProjectFromCard(button.closest('.project-registry-card'))));
    wrap.querySelectorAll('.btn-hide-project').forEach((button) => button.addEventListener('click', () => toggleProjectVisibility(button.closest('.project-registry-card'))));
  };

  const loadProjectRegistry = () => {
    db.collection(PROJECTS_COL).onSnapshot((snapshot) => {
      projectRegistry = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
      renderProjectRegistry();
    }, (err) => {
      console.warn('Project registry load error:', err);
      projectRegistry = [];
      renderProjectRegistry();
      showToast('โหลดทะเบียนโปรเจกต์ไม่สำเร็จ', 'ตรวจสอบ Firestore Rules หรือสิทธิ์ Admin', 'error');
    });
  };

  const saveProjectRecord = async (record, oldId = record.id) => {
    if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(record.slug)) throw new Error('URL slug ใช้ได้เฉพาะ a-z, 0-9 และขีดกลาง เช่น discord-bot');
    if (!record.title || record.title.length > 200) throw new Error('กรุณากรอกชื่อทีม/โปรเจกต์ไม่เกิน 200 ตัวอักษร');
    if (record.summary.length > 1000 || record.communityName.length > 120 || record.communityUrl.length > 1000 || record.websiteUrl.length > 1000) throw new Error('ข้อมูลบางช่องยาวเกินกำหนด');
    const payload = { ...record, updatedAt: firebase.firestore.FieldValue.serverTimestamp(), updatedBy: currentUser?.uid || '' };
    const targetRef = db.collection(PROJECTS_COL).doc(record.slug);
    await targetRef.set(payload, { merge: true });
    if (oldId && oldId !== record.slug && oldId !== 'new') await db.collection(PROJECTS_COL).doc(oldId).delete();
  };

  const saveProjectFromCard = async (card) => {
    if (!card) return;
    try {
      const oldId = card.dataset.projectId || 'new';
      const record = projectRecordFromCard(card);
      await saveProjectRecord(record, oldId);
      showToast('บันทึกโปรเจกต์และ URL แล้ว', `/join-team/${record.slug}`, 'success');
    } catch (err) { showToast('บันทึกโปรเจกต์ไม่สำเร็จ', err.message, 'error'); }
  };

  const toggleProjectVisibility = async (card) => {
    if (!card) return;
    const current = projectRecordFromCard(card);
    const isVisible = current.visible;
    const accepted = window.bcxConfirm ? await window.bcxConfirm(isVisible ? 'ซ่อน URL และปิดรับสมัครโปรเจกต์นี้หรือไม่?' : 'แสดง URL โปรเจกต์นี้กลับมาอีกครั้งหรือไม่?', 'ข้อมูลใบสมัครเก่าจะไม่ถูกลบ การซ่อนจะไม่แสดงในหน้า /join-team') : window.confirm(isVisible ? 'ซ่อน URL โปรเจกต์นี้หรือไม่?' : 'แสดง URL โปรเจกต์นี้กลับมาหรือไม่?');
    if (!accepted) return;
    try {
      await db.collection(PROJECTS_COL).doc(current.slug).set({ visible: !isVisible, isOpen: isVisible ? false : current.isOpen, updatedAt: firebase.firestore.FieldValue.serverTimestamp(), updatedBy: currentUser?.uid || '' }, { merge: true });
      showToast(isVisible ? 'ซ่อนโปรเจกต์แล้ว' : 'แสดงโปรเจกต์แล้ว', '', 'success');
    } catch (err) { showToast('เปลี่ยนการแสดงผลไม่สำเร็จ', err.message, 'error'); }
  };

  const addProjectDraft = () => {
    projectRegistry = [{ id: 'new', slug: 'new-project', title: 'โปรเจกต์ใหม่', summary: '', communityName: '', communityUrl: '', websiteUrl: '', displayOrder: 100, isOpen: false, visible: true }, ...projectRegistry];
    renderProjectRegistry();
    document.querySelector('.admin-tab-btn[data-tab="projects"]')?.click();
  };

  const seedDefaultProjects = async () => {
    const accepted = window.bcxConfirm ? await window.bcxConfirm('โหลดค่าเริ่มต้น 5 ทีมลงทะเบียนโปรเจกต์หรือไม่?', 'ระบบจะเขียนเฉพาะทะเบียน URL และไม่ลบฟอร์มหรือใบสมัครเดิม') : window.confirm('โหลดค่าเริ่มต้น 5 ทีมลงทะเบียนโปรเจกต์หรือไม่?');
    if (!accepted) return;
    try {
      const batch = db.batch();
      DEFAULT_PROJECTS.forEach((project) => batch.set(db.collection(PROJECTS_COL).doc(project.id), { ...project, updatedAt: firebase.firestore.FieldValue.serverTimestamp(), updatedBy: currentUser?.uid || '' }, { merge: true }));
      await batch.commit();
      showToast('เพิ่มทะเบียน 5 ทีมแล้ว', 'Dev สามารถแก้ URL และเปิด/ปิดแต่ละทีมต่อได้', 'success');
    } catch (err) { showToast('โหลดค่าเริ่มต้นไม่สำเร็จ', err.message, 'error'); }
  };

  $('btnSeedProjects')?.addEventListener('click', seedDefaultProjects);
  $('btnAddProject')?.addEventListener('click', addProjectDraft);

  // Contract clause CMS renderer. Kept independent from Firestore listeners so an
  // empty/new document never throws and the admin can build clauses from scratch.
  const renderContractClausesList = (list = []) => {
    contractClauses = Array.isArray(list) ? list : [];
    const el = $('clausesListContainer');
    if (!el) return;
    if (!contractClauses.length) {
      el.innerHTML = '<div style="padding:1rem;color:var(--muted);border:1px dashed rgba(255,255,255,.16);border-radius:12px;">ยังไม่มีข้อตกลง กด “เพิ่มข้อตกลงใหม่” เพื่อเริ่มจัดทำร่าง</div>';
      return;
    }
    el.innerHTML = contractClauses.map((clause, index) => {
      const editing = editingContractClauseIndex === index;
      if (!editing) {
        return `<article style="background:rgba(5,11,22,.72);border:1px solid rgba(255,255,255,.1);border-radius:14px;padding:1rem 1.15rem;">
          <div style="display:flex;justify-content:space-between;gap:.8rem;align-items:flex-start;flex-wrap:wrap;">
            <div><strong style="color:#fff;">${escapeHtml(clause.title || `ข้อ ${index + 1}`)}</strong>${clause.pageBreak ? '<span style="margin-left:.5rem;color:#facc15;font-size:.75rem;">ขึ้นหน้าใหม่</span>' : ''}
              <p style="white-space:pre-wrap;color:var(--muted);font-size:.84rem;margin:.45rem 0 0;">${escapeHtml(clause.content || 'ยังไม่มีรายละเอียด')}</p></div>
            <div style="display:flex;gap:.45rem;flex-wrap:wrap;"><button type="button" class="jt-admin-btn secondary" onclick="window._editContractClause(${index})">✏️ แก้ไข</button><button type="button" class="jt-admin-btn danger" onclick="window._deleteContractClause(${index})">🗑️ ลบ</button></div>
          </div>
        </article>`;
      }
      return `<article style="background:rgba(5,11,22,.9);border:1px solid rgba(50,255,201,.35);border-radius:14px;padding:1rem 1.15rem;display:grid;gap:.7rem;">
        <input class="jt-input clause-title" data-idx="${index}" value="${escapeHtml(clause.title || '')}" placeholder="หัวข้อข้อตกลง" />
        <textarea class="jt-textarea clause-content" data-idx="${index}" rows="6" placeholder="รายละเอียดข้อตกลง">${escapeHtml(clause.content || '')}</textarea>
        <label style="display:flex;align-items:center;gap:.5rem;color:var(--muted);font-size:.84rem;"><input class="clause-page-break" data-idx="${index}" type="checkbox" ${clause.pageBreak ? 'checked' : ''}/> ขึ้นหน้าใหม่เมื่อนำไปจัดทำสัญญา</label>
        <div style="display:flex;gap:.5rem;justify-content:flex-end;flex-wrap:wrap;"><button type="button" class="jt-admin-btn secondary" onclick="window._cancelContractClauseEdit()">ยกเลิก</button><button type="button" class="jt-admin-btn primary" onclick="window._saveContractClause(${index})">💾 บันทึกข้อนี้</button></div>
      </article>`;
    }).join('');
  };

  const saveContractClauses = async () => {
    const communityName = $('clauseCommunityName')?.value || '';
    const contractTitle = $('clauseDocTitle')?.value || '';
    const contractSubtitle = $('clauseDocSubtitle')?.value || '';
    await db.collection(FORMS_COL).doc(FORM_DOC_ID).set({
      contractClauses,
      communityName,
      contractTitle,
      contractSubtitle,
      updatedAt: firebase.firestore.FieldValue.serverTimestamp()
    }, { merge: true });
  };

  window._editContractClause = (index) => { editingContractClauseIndex = index; renderContractClausesList(contractClauses); };
  window._cancelContractClauseEdit = () => { editingContractClauseIndex = null; renderContractClausesList(contractClauses); };
  window._saveContractClause = async (index) => {
    const title = document.querySelector(`.clause-title[data-idx="${index}"]`)?.value.trim() || `ข้อ ${index + 1}`;
    const content = document.querySelector(`.clause-content[data-idx="${index}"]`)?.value.trim() || '';
    const pageBreak = Boolean(document.querySelector(`.clause-page-break[data-idx="${index}"]`)?.checked);
    contractClauses[index] = { ...contractClauses[index], title, content, pageBreak };
    try { await saveContractClauses(); editingContractClauseIndex = null; renderContractClausesList(contractClauses); showToast('บันทึกข้อตกลงสำเร็จ', title, 'success'); }
    catch (err) { showToast('บันทึกไม่สำเร็จ', err.message, 'error'); }
  };
  window._deleteContractClause = async (index) => {
    const accepted = window.bcxConfirm ? await window.bcxConfirm('ลบข้อตกลงนี้หรือไม่?', 'การลบจะมีผลกับเอกสารสัญญาที่สร้างใหม่') : window.confirm('ลบข้อตกลงนี้หรือไม่?');
    if (!accepted) return;
    contractClauses.splice(index, 1);
    editingContractClauseIndex = null;
    try { await saveContractClauses(); renderContractClausesList(contractClauses); showToast('ลบข้อตกลงแล้ว', '', 'success'); }
    catch (err) { showToast('ลบไม่สำเร็จ', err.message, 'error'); }
  };

  $('btnAddClause')?.addEventListener('click', () => {
    contractClauses.push({ title: `ข้อ ${contractClauses.length + 1}. ข้อตกลง`, content: '', pageBreak: false });
    editingContractClauseIndex = contractClauses.length - 1;
    renderContractClausesList(contractClauses);
  });
  $('btnSaveClauses')?.addEventListener('click', async () => {
    try { await saveContractClauses(); showToast('บันทึกข้อตกลงสัญญาทั้งหมดแล้ว', '', 'success'); }
    catch (err) { showToast('บันทึกไม่สำเร็จ', err.message, 'error'); }
  });

  // ── Auth ──────────────────────────────────────────────────────────────────
  const initAuth = () => {
    auth = firebase.auth();
    db = firebase.firestore();

    $('btnLogout')?.addEventListener('click', () => auth.signOut().then(() => window.location.replace('/')));

    auth.onAuthStateChanged(async (user) => {
      if (!user) {
        window.location.replace("login");
        return;
      }

      let isAdmin = (user.email === ADMIN_EMAIL || user.email === 'admin@email.com' || (user.email && user.email.endsWith('@bestcynixdev.web.app')));
      if (!isAdmin) {
        try {
          const docSnap = await db.collection("users").doc(user.uid).get();
          if (docSnap.exists && docSnap.data().role === "admin") isAdmin = true;
        } catch (e) {}
      }

      if (isAdmin) {
        currentUser = user;
        const gate = $('authGuardOverlay') || $('adminLoginGate');
        if (gate) gate.style.display = 'none';
        $('adminPanel').style.display = '';
        if ($('adminUserName')) $('adminUserName').textContent = user.displayName || user.email;
        initAdminPanel();
      } else {
        showCyberToast("⛔ ขออภัย คุณไม่มีสิทธิ์เข้าถึงหน้า Join Team Admin (สงวนสิทธิ์เฉพาะบัญชีทีมพัฒนา BestCyniX Dev เท่านั้น)", "", "error");
        setTimeout(() => { window.location.replace("/"); }, 1500);
      }
    });
  };

  // ── Tabs ──────────────────────────────────────────────────────────────────
  const initTabs = () => {
    document.querySelectorAll('.admin-tab-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        document.querySelectorAll('.admin-tab-btn').forEach(b => b.classList.remove('active'));
        document.querySelectorAll('.admin-tab-content').forEach(t => t.classList.remove('active'));
        btn.classList.add('active');
        const tab = $(`tab-${btn.dataset.tab}`);
        if (tab) tab.classList.add('active');
      });
    });
  };

  // ── Form Config ───────────────────────────────────────────────────────────
  const loadFormConfig = () => {
    db.collection(FORMS_COL).doc(FORM_DOC_ID).onSnapshot((doc) => {
      formConfig = doc.exists ? doc.data() : {};
      applyConfigToUI(formConfig);
      renderPositionsList(formConfig.positions || []);
      renderContractClausesList(formConfig.contractClauses || []);
      renderQuestionsList(formConfig.customQuestions || []);
      renderBenefitsList(formConfig.benefits || []);
    });
  };

  const applyConfigToUI = (cfg) => {
    // Status badge
    const isOpen = checkIsOpen(cfg);
    const badge = $('adminStatusBadge');
    if (badge) {
      badge.className = `jt-status-badge ${isOpen ? 'jt-status-open' : 'jt-status-closed'}`;
      badge.textContent = isOpen ? '🟢 กำลังเปิดรับสมัคร' : '🔴 ปิดรับสมัครแล้ว';
    }

    // Stats
    const positions = (cfg.positions || []).filter(p => p.active !== false);
    if ($('statPositions')) $('statPositions').textContent = positions.length;

    const webhookVal = cfg.discordWebhookUrl || '';

    // Form settings fields
    if ($('cfgTitle')) $('cfgTitle').value = cfg.title || '';
    if ($('cfgSubtitle')) $('cfgSubtitle').value = cfg.subtitle || '';
    if ($('cfgCommunity')) $('cfgCommunity').value = cfg.communityName || '';
    if ($('cfgClosedMessage')) $('cfgClosedMessage').value = cfg.closedMessage || '';
    if ($('cfgDiscordWebhook')) $('cfgDiscordWebhook').value = webhookVal;
    if ($('cfgAgeMin')) $('cfgAgeMin').value = cfg.ageRange?.min ?? '';
    if ($('cfgAgeMax')) $('cfgAgeMax').value = cfg.ageRange?.max ?? '';
    if ($('cfgStatusMode')) $('cfgStatusMode').value = cfg.statusConfig?.mode || 'manual';
    if ($('clauseCommunityName')) $('clauseCommunityName').value = cfg.communityName || '';
    if ($('clauseDocTitle')) $('clauseDocTitle').value = cfg.contractTitle || '';
    if ($('clauseDocSubtitle')) $('clauseDocSubtitle').value = cfg.contractSubtitle || '';
    if ($('cfgAutoOpen')) $('cfgAutoOpen').value = cfg.statusConfig?.autoOpenAt || '';
    if ($('cfgAutoClose')) $('cfgAutoClose').value = cfg.statusConfig?.autoCloseAt || '';

    // Auto schedule time visibility
    const autoWrap = $('cfgAutoTimeWrap');
    if (autoWrap) {
      autoWrap.style.display = (cfg.statusConfig?.mode === 'auto') ? 'grid' : 'none';
    }

    renderDayCheckboxes(cfg.availableDays || ALL_DAYS);
  };

  // ── Form Settings Edit Mode Controller ────────────────────────────────────
  let isFormEditing = false;
  const setFormEditMode = (editing) => {
    isFormEditing = editing;
    const fields = ['cfgTitle', 'cfgSubtitle', 'cfgCommunity', 'cfgClosedMessage', 'cfgDiscordWebhook', 'cfgAgeMin', 'cfgAgeMax', 'cfgStatusMode', 'cfgAutoOpen', 'cfgAutoClose'];
    fields.forEach(id => { if ($(id)) $(id).disabled = !editing; });

    const saveBtn = $('btnSaveFormSettings');
    const cancelBtn = $('btnCancelEditForm');
    const toggleBtn = $('btnToggleEditForm');

    const bottomSaveBtn = $('btnBottomSaveFormSettings');
    const bottomCancelBtn = $('btnBottomCancelEditForm');
    const bottomToggleBtn = $('btnBottomToggleEditForm');

    const lockText = $('cfgLockStatusText');

    if (editing) {
      if (saveBtn) saveBtn.style.display = 'inline-flex';
      if (cancelBtn) cancelBtn.style.display = 'inline-flex';
      if (toggleBtn) toggleBtn.style.display = 'none';

      if (bottomSaveBtn) bottomSaveBtn.style.display = 'inline-flex';
      if (bottomCancelBtn) bottomCancelBtn.style.display = 'inline-flex';
      if (bottomToggleBtn) bottomToggleBtn.style.display = 'none';

      if (lockText) {
        lockText.innerHTML = '✏️ กำลังแก้ไขการตั้งค่าฟอร์มหลัก (สามารถแก้ไขข้อมูลด้านล่างได้แล้ว)';
        lockText.style.color = 'var(--accent)';
      }
    } else {
      if (saveBtn) saveBtn.style.display = 'none';
      if (cancelBtn) cancelBtn.style.display = 'none';
      if (toggleBtn) toggleBtn.style.display = 'inline-flex';

      if (bottomSaveBtn) bottomSaveBtn.style.display = 'none';
      if (bottomCancelBtn) bottomCancelBtn.style.display = 'none';
      if (bottomToggleBtn) bottomToggleBtn.style.display = 'inline-flex';

      if (lockText) {
        lockText.innerHTML = 'กดปุ่ม ✏️ เพื่อแก้ไขข้อมูลการตั้งค่า';
        lockText.style.color = 'var(--muted)';
      }
    }
  };

  $('btnToggleEditForm')?.addEventListener('click', () => setFormEditMode(true));
  $('btnBottomToggleEditForm')?.addEventListener('click', () => setFormEditMode(true));

  $('btnCancelEditForm')?.addEventListener('click', () => {
    if (formConfig) applyConfigToUI(formConfig);
    setFormEditMode(false);
  });
  $('btnBottomCancelEditForm')?.addEventListener('click', () => {
    if (formConfig) applyConfigToUI(formConfig);
    setFormEditMode(false);
  });

  $('btnBottomSaveFormSettings')?.addEventListener('click', () => {
    $('btnSaveFormSettings')?.click();
  });

  $('cfgStatusMode')?.addEventListener('change', (e) => {
    const autoWrap = $('cfgAutoTimeWrap');
    if (autoWrap) {
      autoWrap.style.display = (e.target.value === 'auto') ? 'grid' : 'none';
    }
  });

  // Discord Webhook Test Button
  $('btnTestDiscordWebhook')?.addEventListener('click', async () => {
    const url = $('cfgDiscordWebhook')?.value?.trim();
    if (!url) {
      showToast('กรุณากรอก Discord Webhook URL ก่อนทดสอบ', '', 'error');
      return;
    }

    try {
      showToast('กำลังส่งข้อความทดสอบ...', '', 'info');
      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username: 'BestCyniX Test Bot',
          avatar_url: 'https://bestcynixdev.web.app/assets/photo/bcxlogo2.png',
          embeds: [{
            title: '🧪 ทดสอบการเชื่อมต่อ Discord Webhook สำเร็จ!',
            description: 'ระบบรับสมัครและแจ้งเตือนของ **BestCyniX Dev** เชื่อมต่อกับ Discord เรียบร้อยแล้ว พร้อมรับการแจ้งเตือนทันทีเมื่อมีผู้สมัครงานใหม่!',
            color: 0x32ffc9,
            fields: [
              { name: '⚡ ระบบ', value: 'Recruitment & Live Chat Integration', inline: true },
              { name: '🕒 เวลาทดสอบ', value: new Date().toLocaleString('th-TH'), inline: true }
            ],
            footer: { text: 'BestCyniX Dev Webhook Gateway' }
          }]
        })
      });

      if (res.ok || res.status === 204) {
        showToast('ส่งข้อความทดสอบเข้า Discord สำเร็จ! ✅', '', 'success');
        if (window.logAdminAudit) {
          const maskedUrl = url.replace(/\/webhooks\/(\d+)\/([A-Za-z0-9_-]+)/, '/webhooks/$1/***');
          window.logAdminAudit('TEST_DISCORD_WEBHOOK', 'ทดสอบการส่ง Discord Webhook สำเร็จ', { webhookUrl: maskedUrl });
        }
      } else {
        showToast(`Discord แจ้งข้อผิดพลาด: HTTP ${res.status}`, '', 'error');
      }
    } catch (err) {
      showToast('ส่งไม่สำเร็จ: ' + err.message, '', 'error');
    }
  });

  const checkIsOpen = (cfg) => {
    if (!cfg) return false;
    const mode = cfg.statusConfig?.mode || 'manual';
    if (mode === 'auto') {
      const now = Date.now();
      const open = cfg.statusConfig?.autoOpenAt ? new Date(cfg.statusConfig.autoOpenAt).getTime() : null;
      const close = cfg.statusConfig?.autoCloseAt ? new Date(cfg.statusConfig.autoCloseAt).getTime() : null;
      if (open && now < open) return false;
      if (close && now > close) return false;
      return true;
    }
    return cfg.isOpen === true;
  };

  // Interactive Days Selector with Neon Pills
  let currentAvailableDays = [];
  const STANDARD_DAYS = ['จันทร์', 'อังคาร', 'พุธ', 'พฤหัส', 'ศุกร์', 'เสาร์', 'อาทิตย์'];

  const renderDayCheckboxes = (selectedDays) => {
    currentAvailableDays = Array.isArray(selectedDays) ? [...selectedDays] : [...STANDARD_DAYS];
    const grid = $('cfgDaysGrid');
    if (!grid) return;

    const isAllSelected = STANDARD_DAYS.every(d => currentAvailableDays.includes(d)) || currentAvailableDays.includes('ทุกวัน');

    grid.innerHTML = `
      <div style="display:flex; flex-wrap:wrap; gap:0.45rem; width:100%; align-items:center;">
        <button type="button" id="btnToggleAllDays" class="jt-day-pill ${isAllSelected ? 'is-active' : ''}" style="background:${isAllSelected ? 'rgba(50,255,201,0.22)' : 'rgba(255,255,255,0.06)'}; border:1px solid ${isAllSelected ? 'var(--accent)' : 'rgba(255,255,255,0.18)'}; color:${isAllSelected ? 'var(--accent)' : '#cbd5e1'}; font-weight:700; padding:0.4rem 0.85rem; border-radius:8px; cursor:pointer; font-size:0.84rem; display:inline-flex; align-items:center; gap:0.35rem; transition:all 0.2s;">
          ✨ ทุกวัน (จันทร์ - อาทิตย์)
        </button>
        ${STANDARD_DAYS.map(day => {
          const isChecked = currentAvailableDays.includes(day) || currentAvailableDays.includes('ทุกวัน');
          return `
            <button type="button" class="jt-day-pill ${isChecked ? 'is-active' : ''}" data-day="${day}" style="background:${isChecked ? 'rgba(50,255,201,0.16)' : 'rgba(255,255,255,0.04)'}; border:1px solid ${isChecked ? 'var(--accent)' : 'rgba(255,255,255,0.12)'}; color:${isChecked ? '#fff' : '#94a3b8'}; font-weight:${isChecked ? '700' : '500'}; padding:0.4rem 0.8rem; border-radius:8px; cursor:pointer; font-size:0.84rem; display:inline-flex; align-items:center; gap:0.35rem; transition:all 0.2s;">
              ${isChecked ? '✓' : '+'} ${day}
            </button>
          `;
        }).join('')}
      </div>
    `;

    $('btnToggleAllDays')?.addEventListener('click', () => {
      if (!isFormEditing) {
        showToast('กรุณากดปุ่ม ✏️ แก้ไขการตั้งค่า ก่อนปรับเปลี่ยนวันที่', '', 'info');
        return;
      }
      if (isAllSelected) {
        currentAvailableDays = [];
      } else {
        currentAvailableDays = [...STANDARD_DAYS];
      }
      renderDayCheckboxes(currentAvailableDays);
    });

    grid.querySelectorAll('.jt-day-pill[data-day]').forEach(btn => {
      btn.addEventListener('click', () => {
        if (!isFormEditing) {
          showToast('กรุณากดปุ่ม ✏️ แก้ไขการตั้งค่า ก่อนปรับเปลี่ยนวันที่', '', 'info');
          return;
        }
        const day = btn.getAttribute('data-day');
        const idx = currentAvailableDays.indexOf(day);
        if (idx >= 0) {
          currentAvailableDays.splice(idx, 1);
        } else {
          currentAvailableDays.push(day);
        }
        renderDayCheckboxes(currentAvailableDays);
      });
    });
  };

  const saveFormSettings = async () => {
    const mode = $('cfgStatusMode')?.value || 'manual';
    const availableDays = currentAvailableDays.length ? currentAvailableDays : STANDARD_DAYS;
    const discordWebhookUrl = $('cfgDiscordWebhook')?.value?.trim() || '';
    const data = {
      title: $('cfgTitle')?.value || 'สมัครร่วมทีม BestCyniX Dev',
      subtitle: $('cfgSubtitle')?.value || '',
      communityName: $('cfgCommunity')?.value || 'BestCyniX Dev',
      closedMessage: $('cfgClosedMessage')?.value || 'ขณะนี้ปิดรับสมัครแล้ว',
      discordWebhookUrl: discordWebhookUrl,
      ageRange: {
        min: parseInt($('cfgAgeMin')?.value) || 0,
        max: parseInt($('cfgAgeMax')?.value) || 99,
      },
      statusConfig: {
        mode,
        autoOpenAt: mode === 'auto' ? ($('cfgAutoOpen')?.value || null) : null,
        autoCloseAt: mode === 'auto' ? ($('cfgAutoClose')?.value || null) : null,
      },
      availableDays: availableDays,
      updatedAt: firebase.firestore.FieldValue.serverTimestamp(),
    };

    const msg = $('formSaveMsg');
    try {
      await db.collection(FORMS_COL).doc(FORM_DOC_ID).set(data, { merge: true });
      if (msg) { msg.style.color = '#4ade80'; msg.textContent = '✅ บันทึกแล้ว!'; }
      showToast('บันทึกการตั้งค่าแล้ว', '', 'success');
      if (window.logAdminAudit) {
        window.logAdminAudit('UPDATE_FORM_SETTINGS', 'แก้ไขและบันทึกการตั้งค่าฟอร์มรับสมัคร', { title: data.title, mode });
      }
      setFormEditMode(false);
    } catch (err) {
      if (msg) { msg.style.color = '#f87171'; msg.textContent = `❌ ${err.message}`; }
      showToast('เกิดข้อผิดพลาด', err.message, 'error');
    }
    setTimeout(() => { if (msg) msg.textContent = ''; }, 3000);
  };

  $('btnSaveFormSettings')?.addEventListener('click', saveFormSettings);

  // ── Status & Schedule Modal Controller ────────────────────────────────────
  const openStatusScheduleModal = () => {
    const modal = $('statusScheduleModal');
    if (!modal) return;

    const modeSel = $('modalStatusModeSelect');
    const autoFields = $('modalAutoScheduleFields');
    const autoOpen = $('modalAutoOpenAt');
    const autoClose = $('modalAutoCloseAt');
    const noClose = $('modalNoCloseDate');

    const statusCfg = formConfig?.statusConfig || {};
    const currentMode = statusCfg.mode || (formConfig?.isOpen ? 'open' : 'closed');

    if (modeSel) modeSel.value = currentMode;
    if (autoOpen) autoOpen.value = statusCfg.autoOpenAt || '';
    if (autoClose) autoClose.value = statusCfg.autoCloseAt || '';
    if (noClose) {
      noClose.checked = !statusCfg.autoCloseAt;
      if (autoClose) autoClose.disabled = noClose.checked;
    }

    if (autoFields) {
      autoFields.style.display = currentMode === 'auto' ? 'grid' : 'none';
    }

    modal.classList.add('is-open');
  };

  const closeStatusScheduleModal = () => {
    $('statusScheduleModal')?.classList.remove('is-open');
  };

  $('statusModalCloseBtn')?.addEventListener('click', closeStatusScheduleModal);
  $('btnCancelStatusModal')?.addEventListener('click', closeStatusScheduleModal);
  $('statusScheduleModal')?.addEventListener('click', (e) => {
    if (e.target === $('statusScheduleModal')) closeStatusScheduleModal();
  });

  $('modalStatusModeSelect')?.addEventListener('change', (e) => {
    const autoFields = $('modalAutoScheduleFields');
    if (autoFields) {
      autoFields.style.display = e.target.value === 'auto' ? 'grid' : 'none';
    }
  });

  $('modalNoCloseDate')?.addEventListener('change', (e) => {
    const autoClose = $('modalAutoCloseAt');
    if (autoClose) {
      autoClose.disabled = e.target.checked;
      if (e.target.checked) autoClose.value = '';
    }
  });

  $('btnSaveStatusSchedule')?.addEventListener('click', async () => {
    const mode = $('modalStatusModeSelect')?.value || 'open';
    const autoOpenAt = $('modalAutoOpenAt')?.value || null;
    const isNoClose = $('modalNoCloseDate')?.checked;
    const autoCloseAt = isNoClose ? null : ($('modalAutoCloseAt')?.value || null);

    let isOpen = false;
    if (mode === 'open') {
      isOpen = true;
    } else if (mode === 'closed') {
      isOpen = false;
    } else if (mode === 'auto') {
      const now = Date.now();
      const openTime = autoOpenAt ? new Date(autoOpenAt).getTime() : null;
      const closeTime = autoCloseAt ? new Date(autoCloseAt).getTime() : null;
      isOpen = (!openTime || now >= openTime) && (!closeTime || now <= closeTime);
    }

    try {
      await db.collection(FORMS_COL).doc(FORM_DOC_ID).set({
        isOpen,
        statusConfig: {
          mode,
          autoOpenAt: mode === 'auto' ? autoOpenAt : null,
          autoCloseAt: mode === 'auto' ? autoCloseAt : null,
        },
        updatedAt: firebase.firestore.FieldValue.serverTimestamp()
      }, { merge: true });

      const label = mode === 'open' ? '🟢 เปิดรับสมัครทันที (ไม่มีกำหนดปิด)' :
        mode === 'closed' ? '🔴 ปิดรับสมัครแล้ว' : '⏰ ตั้งค่าเปิด-ปิดตามกำหนดการแล้ว';
      showToast('อัปเดตสถานะสำเร็จ', label, 'success');
      closeStatusScheduleModal();
    } catch (err) {
      showToast('เกิดข้อผิดพลาด', err.message, 'error');
    }
  });

  const toggleOpen = () => {
    openStatusScheduleModal();
  };

  // ── Automatic Position Quota & Approved Contract Slots Sync ───────────────
  const recalculatePositionSlots = async () => {
    if (!formConfig || !formConfig.positions) return;
    const approvedByPos = {};
    allApplications.forEach(app => {
      if (app.status === 'approved' || app.status === 'contract_signed') {
        const key = app.positionId || app.positionName;
        if (key) approvedByPos[key] = (approvedByPos[key] || 0) + 1;
      }
    });

    let hasChange = false;
    const updatedPositions = formConfig.positions.map(pos => {
      const approvedCount = approvedByPos[pos.id] || approvedByPos[pos.name] || 0;
      const isUnlimited = !pos.maxSlots || pos.maxSlots <= 0 || pos.unlimited === true;
      const maxSlots = isUnlimited ? 0 : (pos.maxSlots || 1);
      const slotsLeft = isUnlimited ? 9999 : Math.max(0, maxSlots - approvedCount);
      if (pos.slotsLeft !== slotsLeft || pos.approvedCount !== approvedCount || pos.unlimited !== isUnlimited) {
        hasChange = true;
      }
      return {
        ...pos,
        unlimited: isUnlimited,
        maxSlots,
        approvedCount,
        slotsLeft,
      };
    });

    if (hasChange) {
      try {
        await db.collection(FORMS_COL).doc(FORM_DOC_ID).set({
          positions: updatedPositions,
          updatedAt: firebase.firestore.FieldValue.serverTimestamp()
        }, { merge: true });
      } catch (e) {
        console.warn('Quota sync error:', e);
      }
    }
  };

  // ── Positions (Per-Item View & Edit Mode) ─────────────────────────────────
  let positions = [];
  let editingPositionIndex = null;

  const renderPositionsList = (list) => {
    positions = list;
    const el = $('positionsList');
    if (!el) return;
    if (!list.length) {
      el.innerHTML = '<p style="color:var(--muted);font-size:.86rem;">ยังไม่มีตำแหน่ง กด "+ เพิ่มตำแหน่งใหม่" เพื่อเริ่ม</p>';
      return;
    }

    el.innerHTML = list.map((pos, i) => {
      const isEditing = editingPositionIndex === i;
      const ageRule = pos.ageRule || 'unlimited';
      const approved = pos.approvedCount || 0;
      const maxSlots = pos.maxSlots || 1;
      const slotsLeft = pos.slotsLeft !== undefined ? pos.slotsLeft : Math.max(0, maxSlots - approved);
      const isFull = slotsLeft <= 0;

      let ageDesc = 'ไม่จำกัดอายุ';
      if (ageRule === 'range') ageDesc = `${pos.minAge ?? 15} - ${pos.maxAge ?? 30} ปี`;
      else if (ageRule === 'min') ageDesc = `${pos.minAge ?? 15} ปีขึ้นไป`;
      else if (ageRule === 'max') ageDesc = `ไม่เกิน ${pos.maxAge ?? 30} ปี`;

      if (!isEditing) {
        // VIEW MODE CARD
        return `
        <div style="background:rgba(5,11,22,.75);border:1px solid rgba(255,255,255,.08);border-radius:14px;padding:1.1rem 1.3rem;display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:1rem;transition:border-color 0.2s;">
          <div style="display:grid;gap:0.5rem;">
            <div style="display:flex;align-items:center;gap:0.6rem;flex-wrap:wrap;">
              <span style="font-size:1.1rem;font-weight:800;color:#fff;">${pos.name || 'ไม่มีชื่อตำแหน่ง'}</span>
              <span style="background:${pos.active !== false ? 'rgba(34,197,94,0.15)' : 'rgba(148,163,184,0.15)'};border:1px solid ${pos.active !== false ? 'rgba(34,197,94,0.35)' : 'rgba(148,163,184,0.3)'};color:${pos.active !== false ? '#4ade80' : '#94a3b8'};padding:0.2rem 0.6rem;border-radius:6px;font-size:0.75rem;font-weight:700;">
                ${pos.active !== false ? '🟢 เปิดรับสมัคร' : '⚪ ปิดรับชั่วคราว'}
              </span>
            </div>
            
            <div style="display:flex;flex-wrap:wrap;align-items:center;gap:0.6rem;font-size:0.8rem;">
              <span style="background:rgba(255,255,255,0.06);border:1px solid rgba(255,255,255,0.1);padding:0.2rem 0.6rem;border-radius:6px;color:#d1e5f8;">
                👥 รับ: <strong>${maxSlots}</strong> คน
              </span>
              <span style="background:rgba(34,197,94,0.12);border:1px solid rgba(34,197,94,0.3);padding:0.2rem 0.6rem;border-radius:6px;color:#4ade80;">
                ✅ อนุมัติแล้ว: <strong>${approved}</strong> คน
              </span>
              <span style="background:${isFull ? 'rgba(239,68,68,0.15)' : 'rgba(50,255,201,0.12)'};border:1px solid ${isFull ? 'rgba(239,68,68,0.4)' : 'rgba(50,255,201,0.3)'};padding:0.2rem 0.6rem;border-radius:6px;color:${isFull ? '#f87171' : 'var(--accent)'};font-weight:700;">
                ${isFull ? '🔒 รับครบแล้ว' : `🟢 คงเหลือ: ${slotsLeft} คน`}
              </span>
              <span style="background:rgba(255,255,255,0.04);border:1px solid rgba(255,255,255,0.08);padding:0.2rem 0.6rem;border-radius:6px;color:#cbd5e1;">
                🎂 อายุ: <strong>${ageDesc}</strong>
              </span>
            </div>
          </div>

          <div style="display:flex;gap:0.5rem;align-items:center;">
            <button class="jt-admin-btn secondary" onclick="window._editPosition(${i})" style="padding:0.45rem 0.95rem;font-size:0.84rem;font-weight:700;">
              ✏️ แก้ไข
            </button>
            <button class="jt-admin-btn danger" onclick="window._deletePosition(${i})" style="padding:0.45rem 0.8rem;font-size:0.84rem;">
              🗑️ ลบ
            </button>
          </div>
        </div>
        `;
      }

      // EDIT MODE FORM
      return `
      <div style="background:rgba(8,18,36,.95);border:2px solid var(--accent);border-radius:14px;padding:1.2rem;display:grid;gap:1rem;box-shadow:0 0 20px rgba(50,255,201,0.15);">
        <div style="display:flex;justify-content:space-between;align-items:center;border-bottom:1px solid rgba(255,255,255,0.1);padding-bottom:0.6rem;">
          <span style="font-weight:800;color:var(--accent);font-size:0.9rem;">✏️ กำลังแก้ไขตำแหน่ง: ${pos.name || 'ตำแหน่งใหม่'}</span>
          <span style="font-size:0.75rem;color:var(--muted);">แก้ไขเสร็จแล้วกด "บันทึกตำแหน่งนี้"</span>
        </div>

        <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(200px,1fr));gap:0.8rem;align-items:center;">
          <div class="jt-form-group">
            <label style="font-size:0.78rem;">ชื่อตำแหน่ง</label>
            <input class="jt-input pos-name" data-idx="${i}" value="${pos.name || ''}" placeholder="เช่น Bot Developer, Admin" style="font-weight:700;" />
          </div>

          <div class="jt-form-group" style="max-width:140px;">
            <label style="font-size:0.78rem;">จำนวนที่รับ (คน)</label>
            <input class="jt-input pos-slots" data-idx="${i}" type="number" min="1" value="${maxSlots}" />
          </div>

          <div class="jt-form-group" style="padding-top:1.2rem;">
            <label style="display:inline-flex;align-items:center;gap:.4rem;cursor:pointer;font-size:.84rem;color:#fff;">
              <input type="checkbox" class="pos-active" data-idx="${i}" ${pos.active !== false ? 'checked' : ''} style="accent-color:var(--accent);" />
              <span>เปิดรับสมัครตำแหน่งนี้</span>
            </label>
          </div>
        </div>

        <!-- Age restriction settings -->
        <div style="background:rgba(255,255,255,.03);border:1px solid rgba(255,255,255,.08);border-radius:10px;padding:.8rem;display:flex;flex-wrap:wrap;align-items:center;gap:0.8rem;font-size:.82rem;">
          <span style="font-weight:700;color:var(--accent);">🎂 เกณฑ์อายุ:</span>
          <select class="jt-select pos-age-rule" data-idx="${i}" onchange="window._onAgeRuleChange(${i})" style="width:auto;padding:.35rem .7rem;">
            <option value="unlimited" ${ageRule === 'unlimited' ? 'selected' : ''}>ไม่จำกัดอายุ</option>
            <option value="range" ${ageRule === 'range' ? 'selected' : ''}>ช่วงอายุ (ระหว่าง X - Y ปี)</option>
            <option value="min" ${ageRule === 'min' ? 'selected' : ''}>อายุขั้นต่ำ (X ปีขึ้นไป)</option>
            <option value="max" ${ageRule === 'max' ? 'selected' : ''}>อายุสูงสุด (ไม่เกิน X ปี)</option>
          </select>

          <div id="posAgeInputs_${i}" style="display:flex;gap:.5rem;align-items:center;">
            <div id="posMinWrap_${i}" style="display:${(ageRule === 'range' || ageRule === 'min') ? 'flex' : 'none'};gap:.3rem;align-items:center;">
              <span style="color:var(--muted);font-size:.78rem;">ตั้งแต่:</span>
              <input class="jt-input pos-min-age" data-idx="${i}" type="number" min="0" max="99" value="${pos.minAge ?? 15}" style="width:65px;padding:.25rem .5rem;" />
              <span style="color:var(--muted);font-size:.78rem;">ปี</span>
            </div>
            <div id="posMaxWrap_${i}" style="display:${(ageRule === 'range' || ageRule === 'max') ? 'flex' : 'none'};gap:.3rem;align-items:center;">
              <span style="color:var(--muted);font-size:.78rem;">ถึง:</span>
              <input class="jt-input pos-max-age" data-idx="${i}" type="number" min="0" max="99" value="${pos.maxAge ?? 30}" style="width:65px;padding:.25rem .5rem;" />
              <span style="color:var(--muted);font-size:.78rem;">ปี</span>
            </div>
          </div>
        </div>

        <div style="display:flex;gap:0.6rem;justify-content:flex-end;margin-top:0.4rem;">
          <button class="jt-admin-btn secondary" onclick="window._cancelEditPosition()">✕ ยกเลิก</button>
          <button class="jt-admin-btn primary" onclick="window._savePositionItem(${i})">💾 บันทึกตำแหน่งนี้</button>
          <button class="jt-admin-btn danger" onclick="window._deletePosition(${i})">🗑️ ลบ</button>
        </div>
      </div>
      `;
    }).join('');
  };

  window._editPosition = (idx) => {
    editingPositionIndex = idx;
    renderPositionsList(positions);
  };

  window._cancelEditPosition = () => {
    editingPositionIndex = null;
    renderPositionsList(positions);
  };

  window._onAgeRuleChange = (idx) => {
    const rule = document.querySelector(`.pos-age-rule[data-idx="${idx}"]`)?.value;
    const minWrap = $(`posMinWrap_${idx}`);
    const maxWrap = $(`posMaxWrap_${idx}`);
    if (minWrap) minWrap.style.display = (rule === 'range' || rule === 'min') ? 'flex' : 'none';
    if (maxWrap) maxWrap.style.display = (rule === 'range' || rule === 'max') ? 'flex' : 'none';
  };

  window._savePositionItem = async (idx) => {
    const rule = document.querySelector(`.pos-age-rule[data-idx="${idx}"]`)?.value || 'unlimited';
    const minAgeVal = parseInt(document.querySelector(`.pos-min-age[data-idx="${idx}"]`)?.value);
    const maxAgeVal = parseInt(document.querySelector(`.pos-max-age[data-idx="${idx}"]`)?.value);

    positions[idx] = {
      ...positions[idx],
      name: document.querySelector(`.pos-name[data-idx="${idx}"]`)?.value || positions[idx].name || 'ตำแหน่ง',
      maxSlots: parseInt(document.querySelector(`.pos-slots[data-idx="${idx}"]`)?.value) || 1,
      active: document.querySelector(`.pos-active[data-idx="${idx}"]`)?.checked !== false,
      ageRule: rule,
      minAge: !isNaN(minAgeVal) ? minAgeVal : null,
      maxAge: !isNaN(maxAgeVal) ? maxAgeVal : null,
    };

    try {
      await db.collection(FORMS_COL).doc(FORM_DOC_ID).set({ positions, updatedAt: firebase.firestore.FieldValue.serverTimestamp() }, { merge: true });
      showToast('บันทึกตำแหน่งสำเร็จ! ✅', positions[idx].name, 'success');
      editingPositionIndex = null;
      renderPositionsList(positions);
    } catch (err) {
      showToast('บันทึกไม่สำเร็จ', err.message, 'error');
    }
  };

  window._deletePosition = async (idx) => {
    if (!(window.bcxConfirm ? await window.bcxConfirm('ยืนยันการลบตำแหน่งนี้?', 'ตำแหน่งนี้จะถูกลบออกจากแบบฟอร์มรับสมัคร') : window.confirm('ยืนยันการลบตำแหน่งนี้?'))) return;
    positions.splice(idx, 1);
    editingPositionIndex = null;
    await db.collection(FORMS_COL).doc(FORM_DOC_ID).set({ positions, updatedAt: firebase.firestore.FieldValue.serverTimestamp() }, { merge: true });
    renderPositionsList(positions);
    showToast('ลบตำแหน่งแล้ว', '', 'success');
  };

  $('btnAddPosition')?.addEventListener('click', () => {
    positions.push({ id: `pos_${Date.now()}`, name: '', maxSlots: 1, active: true, ageRule: 'unlimited', minAge: 15, maxAge: 35 });
    editingPositionIndex = positions.length - 1;
    renderPositionsList(positions);
  });

  // ── Custom Questions (Per-Item View & Edit Mode) ──────────────────────────
  let questions = [];
  let editingQuestionIndex = null;

  const renderQuestionsList = (list) => {
    questions = list;
    const el = $('questionsList');
    if (!el) return;
    if (!list.length) {
      el.innerHTML = `
        <div style="background: rgba(8, 20, 36, 0.6); border: 1px dashed rgba(255, 255, 255, 0.15); border-radius: 14px; padding: 2rem 1.5rem; text-align: center; color: var(--muted);">
          <div style="font-size: 2rem; margin-bottom: 0.5rem;">❓</div>
          <div style="font-size: 0.95rem; font-weight: 700; color: #fff; margin-bottom: 0.3rem;">ยังไม่มีคำถามเพิ่มเติม</div>
          <p style="font-size: 0.82rem; margin-bottom: 1rem;">เพิ่มคำถามเพื่อถามข้อมูลเฉพาะทางจากผู้สมัคร เช่น ประสบการณ์ หรือผลงาน</p>
          <button type="button" class="jt-admin-btn primary" onclick="$('btnAddQuestion')?.click()">+ เพิ่มคำถามแรก</button>
        </div>
      `;
      return;
    }

    el.innerHTML = list.map((q, i) => {
      const isEditing = editingQuestionIndex === i;
      const type = q.type || 'text';
      const isChoiceType = (type === 'radio' || type === 'checkbox' || type === 'select');
      const defaultOptions = (q.options && q.options.length) ? q.options : ['ตัวเลือกที่ 1', 'ตัวเลือกที่ 2', 'ตัวเลือกที่ 3'];
      const optionsText = (q.options && q.options.length) ? q.options.join('\n') : (isChoiceType ? 'ตัวเลือกที่ 1\nตัวเลือกที่ 2\nตัวเลือกที่ 3' : '');

      const typeLabels = {
        text: '✏️ ข้อความสั้น (Text)',
        textarea: '📝 ข้อความยาว (Textarea)',
        radio: '🔘 ตัวเลือกเดียว (Radio)',
        checkbox: '☑️ หลายตัวเลือก (Checkbox)',
        select: '📋 เมนูเลือก (Dropdown)'
      };

      if (!isEditing) {
        // VIEW MODE CARD
        return `
        <div class="jt-admin-question-card" style="background:rgba(5,11,22,.75);border:1px solid rgba(255,255,255,.08);border-radius:14px;padding:1.1rem 1.3rem;display:grid;gap:0.8rem;">
          <div style="display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:0.8rem;">
            <div style="display:flex;align-items:center;gap:0.6rem;flex-wrap:wrap;">
              <span style="background:rgba(50,255,201,.15);color:var(--accent);font-weight:800;font-size:.78rem;padding:.2rem .55rem;border-radius:6px;">ข้อที่ ${i+1}</span>
              <span style="font-size:1.02rem;font-weight:700;color:#fff;">${q.label || 'ยังไม่ได้ระบุหัวข้อคำถาม'}</span>
              ${q.required ? '<span style="color:var(--accent-red);font-weight:800;">* บังคับตอบ</span>' : ''}
              <span style="background:rgba(255,255,255,0.06);border:1px solid rgba(255,255,255,0.1);padding:0.2rem 0.55rem;border-radius:6px;font-size:0.75rem;color:#cbd5e1;">
                ${typeLabels[type] || type}
              </span>
            </div>

            <div style="display:flex;gap:0.5rem;align-items:center;">
              <button class="jt-admin-btn secondary" onclick="window._editQuestion(${i})" style="padding:0.4rem 0.85rem;font-size:0.82rem;font-weight:700;">
                ✏️ แก้ไขคำถามนี้
              </button>
              <button class="jt-admin-btn danger" onclick="window._deleteQuestion(${i})" style="padding:0.4rem 0.75rem;font-size:0.82rem;">
                🗑️ ลบ
              </button>
            </div>
          </div>

          <!-- Live Preview in View Mode -->
          <div style="background:rgba(8,20,40,.4);border:1px solid rgba(255,255,255,.06);border-radius:10px;padding:.75rem 1rem;">
            <div id="qPreviewContent_${i}"></div>
          </div>
        </div>
        `;
      }

      // EDIT MODE FORM
      return `
      <div class="jt-admin-question-card" style="background:rgba(8,18,36,.95);border:2px solid var(--accent);border-radius:14px;padding:1.2rem;display:grid;gap:.9rem;box-shadow:0 0 20px rgba(50,255,201,0.15);">
        <div style="display:flex;justify-content:space-between;align-items:center;border-bottom:1px solid rgba(255,255,255,0.1);padding-bottom:0.6rem;">
          <span style="font-weight:800;color:var(--accent);font-size:0.9rem;">✏️ กำลังแก้ไขคำถามข้อที่ ${i+1}</span>
          <span style="font-size:0.75rem;color:var(--muted);">แก้ไขเสร็จแล้วกด "บันทึกคำถามนี้"</span>
        </div>

        <div style="display:flex;gap:.65rem;align-items:center;justify-content:space-between;flex-wrap:wrap;">
          <div style="display:flex;align-items:center;gap:.5rem;flex:1;min-width:260px;">
            <input class="jt-input q-label" data-idx="${i}" oninput="window._updateQuestionPreview(${i})" value="${q.label || ''}" placeholder="ระบุหัวข้อคำถาม เช่น คุณเคยเขียนโปรแกรมภาษาอะไรบ้าง?..." style="flex:1;font-weight:700;" />
          </div>

          <div style="display:flex;gap:.5rem;align-items:center;flex-wrap:wrap;">
            <select class="jt-select q-type" data-idx="${i}" onchange="window._onQuestionTypeChange(${i})" style="width:auto;padding:.4rem .85rem;font-size:.84rem;font-weight:600;">
              <option value="text" ${type === 'text' ? 'selected' : ''}>✏️ ข้อความสั้น (บรรทัดเดียว - Text)</option>
              <option value="textarea" ${type === 'textarea' ? 'selected' : ''}>📝 ข้อความยาว (หลายบรรทัด - Textarea)</option>
              <option value="radio" ${type === 'radio' ? 'selected' : ''}>🔘 ตัวเลือกแบบข้อเดียว (Radio Button)</option>
              <option value="checkbox" ${type === 'checkbox' ? 'selected' : ''}>☑️ ตัวเลือกแบบหลายข้อ (Checkbox)</option>
              <option value="select" ${type === 'select' ? 'selected' : ''}>📋 เมนูเลือกแบบเลื่อนลง (Dropdown / Select)</option>
            </select>

            <label style="display:inline-flex;align-items:center;gap:.35rem;font-size:.84rem;color:var(--text);cursor:pointer;white-space:nowrap;background:rgba(255,255,255,.04);padding:.35rem .7rem;border-radius:8px;border:1px solid rgba(255,255,255,.08);">
              <input type="checkbox" class="q-required" data-idx="${i}" onchange="window._updateQuestionPreview(${i})" ${q.required ? 'checked' : ''} style="accent-color:var(--accent);" />
              <span style="color:var(--accent-red);font-weight:700;">*</span> บังคับตอบ
            </label>
          </div>
        </div>

        <div style="display:grid;grid-template-columns:1fr;gap:.5rem;">
          <input class="jt-input q-placeholder" data-idx="${i}" oninput="window._updateQuestionPreview(${i})" value="${q.placeholder || ''}" placeholder="ข้อความตัวอย่างในช่องกรอก (Placeholder)..." style="font-size:.84rem;" />
        </div>

        <div id="qOptionsWrap_${i}" style="display:${isChoiceType ? 'block' : 'none'};background:rgba(0,0,0,.25);border:1px solid rgba(255,255,255,.06);border-radius:10px;padding:.85rem;">
          <label style="font-size:.78rem;font-weight:700;color:var(--accent);display:block;margin-bottom:.35rem;">
            📋 รายการตัวเลือก (พิมพ์แต่ละตัวเลือกแยก 1 บรรทัด):
          </label>
          <textarea class="jt-textarea q-options" data-idx="${i}" oninput="window._updateQuestionPreview(${i})" placeholder="ตัวเลือกที่ 1&#10;ตัวเลือกที่ 2&#10;ตัวเลือกที่ 3" style="min-height:75px;font-size:.86rem;">${optionsText}</textarea>
        </div>

        <div style="background:rgba(8,20,40,.6);border:1px dashed rgba(50,255,201,.35);border-radius:12px;padding:.9rem 1.1rem;">
          <span style="font-size:.74rem;font-weight:800;color:var(--accent);text-transform:uppercase;margin-bottom:.5rem;display:block;">
            👁️ Live Form Preview:
          </span>
          <div id="qPreviewContent_${i}"></div>
        </div>

        <div style="display:flex;gap:0.6rem;justify-content:flex-end;margin-top:0.3rem;">
          <button class="jt-admin-btn secondary" onclick="window._cancelEditQuestion()">✕ ยกเลิก</button>
          <button class="jt-admin-btn primary" onclick="window._saveQuestionItem(${i})">💾 บันทึกคำถามนี้</button>
          <button class="jt-admin-btn danger" onclick="window._deleteQuestion(${i})">🗑️ ลบ</button>
        </div>
      </div>
      `;
    }).join('');

    // Trigger preview for all questions
    list.forEach((_, i) => window._updateQuestionPreview(i));
  };

  window._editQuestion = (idx) => {
    editingQuestionIndex = idx;
    renderQuestionsList(questions);
  };

  window._cancelEditQuestion = () => {
    editingQuestionIndex = null;
    renderQuestionsList(questions);
  };

  window._onQuestionTypeChange = (idx) => {
    const type = document.querySelector(`.q-type[data-idx="${idx}"]`)?.value || 'text';
    const isChoice = (type === 'radio' || type === 'checkbox' || type === 'select');
    const wrap = $(`qOptionsWrap_${idx}`);
    if (wrap) wrap.style.display = isChoice ? 'block' : 'none';
    window._updateQuestionPreview(idx);
  };

  window._updateQuestionPreview = (idx) => {
    const previewContainer = $(`qPreviewContent_${idx}`);
    if (!previewContainer) return;

    const q = questions[idx] || {};
    const isEditing = editingQuestionIndex === idx;

    const labelVal = isEditing ? (document.querySelector(`.q-label[data-idx="${idx}"]`)?.value || q.label || 'หัวข้อคำถาม') : (q.label || 'หัวข้อคำถาม');
    const typeVal = isEditing ? (document.querySelector(`.q-type[data-idx="${idx}"]`)?.value || q.type || 'text') : (q.type || 'text');
    const placeholderVal = isEditing ? (document.querySelector(`.q-placeholder[data-idx="${idx}"]`)?.value || q.placeholder || 'กรอกคำตอบ...') : (q.placeholder || 'กรอกคำตอบ...');
    const isRequired = isEditing ? (document.querySelector(`.q-required[data-idx="${idx}"]`)?.checked) : q.required;

    let options = q.options || [];
    if (isEditing) {
      const optText = document.querySelector(`.q-options[data-idx="${idx}"]`)?.value || '';
      options = optText.split('\n').map(s => s.trim()).filter(Boolean);
    }
    const finalOptions = options.length ? options : ['ตัวเลือกที่ 1', 'ตัวเลือกที่ 2'];

    let inputHtml = '';
    if (typeVal === 'text') {
      inputHtml = `<input class="jt-input" placeholder="${placeholderVal}" disabled style="opacity:.85;cursor:default;" />`;
    } else if (typeVal === 'textarea') {
      inputHtml = `<textarea class="jt-textarea" placeholder="${placeholderVal}" disabled style="min-height:70px;opacity:.85;cursor:default;"></textarea>`;
    } else if (typeVal === 'radio') {
      inputHtml = `
        <div style="display:flex;flex-direction:column;gap:.45rem;padding-top:.2rem;">
          ${finalOptions.map((opt, oi) => `
            <label style="display:flex;align-items:center;gap:.5rem;cursor:default;font-size:.88rem;color:var(--text);">
              <input type="radio" name="preview_radio_${idx}" ${oi === 0 ? 'checked' : ''} style="accent-color:var(--accent);" />
              <span>${opt}</span>
            </label>
          `).join('')}
        </div>
      `;
    } else if (typeVal === 'checkbox') {
      inputHtml = `
        <div style="display:flex;flex-direction:column;gap:.45rem;padding-top:.2rem;">
          ${finalOptions.map((opt, oi) => `
            <label style="display:flex;align-items:center;gap:.5rem;cursor:default;font-size:.88rem;color:var(--text);">
              <input type="checkbox" ${oi === 0 ? 'checked' : ''} style="accent-color:var(--accent);" />
              <span>${opt}</span>
            </label>
          `).join('')}
        </div>
      `;
    } else if (typeVal === 'select') {
      inputHtml = `
        <select class="jt-select" style="cursor:default;">
          <option value="">-- ${placeholderVal || 'กรุณาเลือกตัวเลือก'} --</option>
          ${finalOptions.map(opt => `<option value="${opt}">${opt}</option>`).join('')}
        </select>
      `;
    }

    previewContainer.innerHTML = `
      <div class="jt-form-group" style="margin:0;">
        <label style="font-size:.82rem;font-weight:700;color:#fff;margin-bottom:.4rem;display:block;">
          ${labelVal} ${isRequired ? '<span style="color:var(--accent-red);font-weight:800;">*</span>' : ''}
        </label>
        ${inputHtml}
      </div>
    `;
  };

  window._saveQuestionItem = async (idx) => {
    const optEl = document.querySelector(`.q-options[data-idx="${idx}"]`);
    const options = optEl ? optEl.value.split('\n').map(l => l.trim()).filter(Boolean) : [];

    questions[idx] = {
      id: questions[idx].id || `q_${Date.now()}`,
      label: document.querySelector(`.q-label[data-idx="${idx}"]`)?.value || 'คำถาม',
      type: document.querySelector(`.q-type[data-idx="${idx}"]`)?.value || 'text',
      placeholder: document.querySelector(`.q-placeholder[data-idx="${idx}"]`)?.value || '',
      required: document.querySelector(`.q-required[data-idx="${idx}"]`)?.checked || false,
      options: options,
    };

    try {
      await db.collection(FORMS_COL).doc(FORM_DOC_ID).set({ customQuestions: questions, updatedAt: firebase.firestore.FieldValue.serverTimestamp() }, { merge: true });
      showToast('บันทึกคำถามสำเร็จ! ✅', questions[idx].label, 'success');
      editingQuestionIndex = null;
      renderQuestionsList(questions);
    } catch (err) {
      showToast('บันทึกไม่สำเร็จ', err.message, 'error');
    }
  };

  window._deleteQuestion = async (idx) => {
    if (!(window.bcxConfirm ? await window.bcxConfirm('ยืนยันการลบคำถามนี้?', 'คำถามนี้จะถูกลบออกจากแบบฟอร์มรับสมัคร') : window.confirm('ยืนยันการลบคำถามนี้?'))) return;
    questions.splice(idx, 1);
    editingQuestionIndex = null;
    await db.collection(FORMS_COL).doc(FORM_DOC_ID).set({ customQuestions: questions, updatedAt: firebase.firestore.FieldValue.serverTimestamp() }, { merge: true });
    renderQuestionsList(questions);
    showToast('ลบคำถามแล้ว', '', 'success');
  };

  $('btnAddQuestion')?.addEventListener('click', () => {
    questions.push({ id: `q_${Date.now()}`, label: '', type: 'text', required: false, placeholder: '', options: [] });
    editingQuestionIndex = questions.length - 1;
    renderQuestionsList(questions);
  });

  // ── Benefits (Per-Item View & Edit Mode) ──────────────────────────────────
  let benefits = [];
  let editingBenefitIndex = null;

  const renderBenefitsList = (list) => {
    benefits = list;
    const el = $('benefitsList');
    if (!el) return;
    if (!list.length) {
      el.innerHTML = `
        <div style="background: rgba(8, 20, 36, 0.6); border: 1px dashed rgba(255, 255, 255, 0.15); border-radius: 14px; padding: 2rem 1.5rem; text-align: center; color: var(--muted);">
          <div style="font-size: 2rem; margin-bottom: 0.5rem;">🎁</div>
          <div style="font-size: 0.95rem; font-weight: 700; color: #fff; margin-bottom: 0.3rem;">ยังไม่มีรายการสิทธิพิเศษ</div>
          <p style="font-size: 0.82rem; margin-bottom: 1rem;">เพิ่มสิทธิประโยชน์ที่จะได้รับเมื่อเข้าร่วมทีม เช่น ประสบการณ์จริง หรือผลงานในพอร์ต</p>
          <button type="button" class="jt-admin-btn primary" onclick="$('btnAddBenefit')?.click()">+ เพิ่มสิทธิพิเศษแรก</button>
        </div>
      `;
      return;
    }

    el.innerHTML = list.map((b, i) => {
      const isEditing = editingBenefitIndex === i;

      if (!isEditing) {
        // VIEW MODE CARD
        return `
        <div style="background:rgba(5,11,22,.75);border:1px solid rgba(255,255,255,.08);border-radius:14px;padding:1rem 1.3rem;display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:1rem;">
          <div style="display:flex;align-items:center;gap:1rem;">
            <span style="font-size:1.8rem;background:rgba(255,255,255,0.06);padding:0.4rem 0.6rem;border-radius:10px;">${b.icon || '🎁'}</span>
            <div>
              <div style="font-weight:700;color:#fff;font-size:1rem;">${b.title || 'ไม่มีชื่อสิทธิพิเศษ'}</div>
              <div style="font-size:0.84rem;color:var(--muted);margin-top:0.2rem;">${b.desc || '-'}</div>
            </div>
          </div>

          <div style="display:flex;gap:0.5rem;align-items:center;">
            <button class="jt-admin-btn secondary" onclick="window._editBenefit(${i})" style="padding:0.4rem 0.85rem;font-size:0.82rem;font-weight:700;">
              ✏️ แก้ไข
            </button>
            <button class="jt-admin-btn danger" onclick="window._deleteBenefit(${i})" style="padding:0.4rem 0.75rem;font-size:0.82rem;">
              🗑️ ลบ
            </button>
          </div>
        </div>
        `;
      }

      // EDIT MODE FORM
      return `
      <div style="background:rgba(8,18,36,.95);border:2px solid var(--accent);border-radius:14px;padding:1.2rem;display:grid;gap:0.8rem;box-shadow:0 0 20px rgba(50,255,201,0.15);">
        <div style="display:flex;justify-content:space-between;align-items:center;border-bottom:1px solid rgba(255,255,255,0.1);padding-bottom:0.5rem;">
          <span style="font-weight:800;color:var(--accent);font-size:0.88rem;">✏️ กำลังแก้ไขสิทธิพิเศษ</span>
        </div>

        <div style="display:grid;grid-template-columns:70px 1fr 1fr;gap:.7rem;align-items:center;">
          <div class="jt-form-group">
            <label style="font-size:0.75rem;">ไอคอน</label>
            <input class="jt-input b-icon" data-idx="${i}" value="${b.icon || '🎁'}" placeholder="🎁" style="font-size:1.2rem;text-align:center;" />
          </div>
          <div class="jt-form-group">
            <label style="font-size:0.75rem;">ชื่อสิทธิพิเศษ</label>
            <input class="jt-input b-title" data-idx="${i}" value="${b.title || ''}" placeholder="เช่น ได้รับยศพิเศษใน Discord" style="font-weight:700;" />
          </div>
          <div class="jt-form-group">
            <label style="font-size:0.75rem;">คำอธิบาย</label>
            <input class="jt-input b-desc" data-idx="${i}" value="${b.desc || ''}" placeholder="เช่น เข้าถึงห้องเฉพาะทีมงาน..." />
          </div>
        </div>

        <div style="display:flex;gap:0.6rem;justify-content:flex-end;margin-top:0.3rem;">
          <button class="jt-admin-btn secondary" onclick="window._cancelEditBenefit()">✕ ยกเลิก</button>
          <button class="jt-admin-btn primary" onclick="window._saveBenefitItem(${i})">💾 บันทึกสิทธิพิเศษนี้</button>
          <button class="jt-admin-btn danger" onclick="window._deleteBenefit(${i})">🗑️ ลบ</button>
        </div>
      </div>
      `;
    }).join('');
  };

  window._editBenefit = (idx) => {
    editingBenefitIndex = idx;
    renderBenefitsList(benefits);
  };

  window._cancelEditBenefit = () => {
    editingBenefitIndex = null;
    renderBenefitsList(benefits);
  };

  window._saveBenefitItem = async (idx) => {
    benefits[idx] = {
      icon: document.querySelector(`.b-icon[data-idx="${idx}"]`)?.value || '🎁',
      title: document.querySelector(`.b-title[data-idx="${idx}"]`)?.value || 'สิทธิพิเศษ',
      desc: document.querySelector(`.b-desc[data-idx="${idx}"]`)?.value || '',
    };

    try {
      await db.collection(FORMS_COL).doc(FORM_DOC_ID).set({ benefits, updatedAt: firebase.firestore.FieldValue.serverTimestamp() }, { merge: true });
      showToast('บันทึกสิทธิพิเศษสำเร็จ! ✅', benefits[idx].title, 'success');
      editingBenefitIndex = null;
      renderBenefitsList(benefits);
    } catch (err) {
      showToast('บันทึกไม่สำเร็จ', err.message, 'error');
    }
  };

  window._deleteBenefit = async (idx) => {
    if (!(window.bcxConfirm ? await window.bcxConfirm('ยืนยันการลบสิทธิพิเศษนี้?', 'สิทธิพิเศษนี้จะถูกลบออกจากหน้า Public') : window.confirm('ยืนยันการลบสิทธิพิเศษนี้?'))) return;
    benefits.splice(idx, 1);
    editingBenefitIndex = null;
    await db.collection(FORMS_COL).doc(FORM_DOC_ID).set({ benefits, updatedAt: firebase.firestore.FieldValue.serverTimestamp() }, { merge: true });
    renderBenefitsList(benefits);
    showToast('ลบสิทธิพิเศษแล้ว', '', 'success');
  };

  $('btnAddBenefit')?.addEventListener('click', () => {
    benefits.push({ icon: '🎁', title: '', desc: '' });
    editingBenefitIndex = benefits.length - 1;
    renderBenefitsList(benefits);
  });

  // ── App Detail Modal Edit Controller ──────────────────────────────────────
  let isAppDetailEditing = false;
  const setAppDetailEditMode = (editing) => {
    isAppDetailEditing = editing;
    const statusSel = $('modalStatusSelect');
    const rejReason = $('modalRejectionReason');
    const revReason = $('modalRevisionReason');
    const noteInput = $('appNoteInput');
    const updateBtn = $('btnUpdateStatus');
    const cancelBtn = $('btnCancelEditAppStatus');
    const delBtn = $('btnDeleteApp');
    const toggleBtn = $('btnToggleEditAppStatus');

    if (statusSel) statusSel.disabled = !editing;
    if (rejReason) rejReason.disabled = !editing;
    if (revReason) revReason.disabled = !editing;
    if (noteInput) noteInput.disabled = !editing;

    if (editing) {
      if (updateBtn) updateBtn.style.display = 'inline-flex';
      if (cancelBtn) cancelBtn.style.display = 'inline-flex';
      if (delBtn) delBtn.style.display = 'inline-flex';
      if (toggleBtn) toggleBtn.style.display = 'none';
    } else {
      if (updateBtn) updateBtn.style.display = 'none';
      if (cancelBtn) cancelBtn.style.display = 'none';
      if (delBtn) delBtn.style.display = 'none';
      if (toggleBtn) toggleBtn.style.display = 'inline-flex';
    }
  };

  $('btnToggleEditAppStatus')?.addEventListener('click', () => setAppDetailEditMode(true));
  $('btnCancelEditAppStatus')?.addEventListener('click', () => {
    if (currentAppId) window._openAppModal(currentAppId);
    setAppDetailEditMode(false);
  });

  
  // ── Contracts Master Registry ─────────────────────────────────────────────
  const getPosKey = (name = '') => {
    const n = (name || '').trim().toLowerCase();
    if (n.includes('dev') || n.includes('developer') || n.includes('พัฒนา') || n.includes('โปรแกรมเมอร์')) return 'Dev';
    if (n.includes('staff') || n.includes('สตาฟ') || n.includes('ทีมงาน')) return 'Staff';
    if (n.includes('mod') || n.includes('ผู้ดูแล') || n.includes('moderator')) return 'Mod';
    if (n.includes('admin') || n.includes('แอดมิน')) return 'Admin';
    if (n.includes('design') || n.includes('กราฟิก') || n.includes('graphic') || n.includes('ui')) return 'Designer';
    if (n.includes('content') || n.includes('คอนเทนต์') || n.includes('creator')) return 'Content';
    if (n.includes('translate') || n.includes('แปล')) return 'Translator';
    const eng = name.replace(/[^a-zA-Z0-9]/g, '');
    return eng ? eng.slice(0, 8) : 'Staff';
  };

  const computeContractRefNo = (app, allApps) => {
    if (app.contractRefNo && /BCX-CTR-[a-zA-Z0-9]+-\d{4}-\d{6}/.test(app.contractRefNo)) {
      return app.contractRefNo;
    }
    const posKey = getPosKey(app.positionName || 'Staff');
    const createdDate = app.createdAt?.toDate ? app.createdAt.toDate() : new Date();
    const year = createdDate.getFullYear();

    // Find position sequence index
    const samePosApps = (allApps || [])
      .filter(a => getPosKey(a.positionName) === posKey)
      .sort((a, b) => {
        const tA = a.createdAt?.toMillis ? a.createdAt.toMillis() : 0;
        const tB = b.createdAt?.toMillis ? b.createdAt.toMillis() : 0;
        return tA - tB;
      });

    let seqIdx = samePosApps.findIndex(a => a.id === app.id);
    if (seqIdx === -1) seqIdx = samePosApps.length;
    const seqFormatted = String(seqIdx + 1).padStart(6, '0');
    const newRef = 'BCX-CTR-' + posKey + '-' + year + '-' + seqFormatted;

    // Async persist to Firestore if changed
    if (app.id && app.contractRefNo !== newRef) {
      db.collection(APPS_COL).doc(app.id).update({ contractRefNo: newRef }).catch(() => {});
      app.contractRefNo = newRef;
    }
    return newRef;
  };

  const renderContractsRegistry = () => {
    const tbody = $('contractsTableBody');
    if (!tbody) return;

    const filterPos = $('ctrFilterPosition')?.value || '';
    const filterStatus = $('ctrFilterStatus')?.value || '';
    const filterYear = $('ctrFilterYear')?.value || '';
    const searchVal = ($('ctrSearchInput')?.value || '').trim().toLowerCase();

    // Populate Position Filter Dropdown if empty
    const posSelect = $('ctrFilterPosition');
    if (posSelect && posSelect.options.length <= 1) {
      const uniquePositions = Array.from(new Set(allApplications.map(a => a.positionName).filter(Boolean)));
      uniquePositions.forEach(p => {
        const opt = document.createElement('option');
        opt.value = p;
        opt.textContent = p;
        posSelect.appendChild(opt);
      });
    }

    // Stats Calculation
    let statTotal = 0;
    let statSigned = 0;
    let statPending = 0;
    let statVoided = 0;

    const listWithRefs = allApplications.map(app => {
      const refNo = computeContractRefNo(app, allApplications);
      const isVoided = Boolean(app.contract && app.contract.voided) || app.status === 'cancelled';
      const isSigned = !isVoided && Boolean(app.contract && app.contract.signed);
      const isPending = !isVoided && !isSigned;

      statTotal++;
      if (isVoided) statVoided++;
      else if (isSigned) statSigned++;
      else statPending++;

      return { ...app, computedRef: refNo, isVoided, isSigned, isPending };
    });

    if ($('ctrStatTotal')) $('ctrStatTotal').textContent = statTotal;
    if ($('ctrStatSigned')) $('ctrStatSigned').textContent = statSigned;
    if ($('ctrStatPending')) $('ctrStatPending').textContent = statPending;
    if ($('ctrStatVoided')) $('ctrStatVoided').textContent = statVoided;
    if ($('statContractsCount')) $('statContractsCount').textContent = statTotal;

    // Filter Items
    const filtered = listWithRefs.filter(app => {
      const a = app.applicant || {};
      const fullName = ((a.firstName || '') + ' ' + (a.lastName || '')).toLowerCase();
      const nick = (a.nickname || '').toLowerCase();
      const email = (app.applicantEmail || a.email || '').toLowerCase();
      const pos = (app.positionName || '').toLowerCase();
      const ref = (app.computedRef || '').toLowerCase();

      // Position Filter
      if (filterPos && app.positionName !== filterPos) return false;

      // Status Filter
      if (filterStatus === 'signed' && !app.isSigned) return false;
      if (filterStatus === 'pending' && !app.isPending) return false;
      if (filterStatus === 'voided' && !app.isVoided) return false;

      // Year Filter
      if (filterYear) {
        const createdDate = app.createdAt?.toDate ? app.createdAt.toDate() : new Date();
        if (String(createdDate.getFullYear()) !== filterYear) return false;
      }

      // Search
      if (searchVal) {
        const match = ref.includes(searchVal) ||
          fullName.includes(searchVal) ||
          nick.includes(searchVal) ||
          email.includes(searchVal) ||
          pos.includes(searchVal);
        if (!match) return false;
      }

      return true;
    });

    if (filtered.length === 0) {
      tbody.innerHTML = '<tr><td colspan="7" style="text-align:center;color:var(--muted);padding:2.5rem;">ไม่พบเอกสารสัญญาที่ตรงกับเงื่อนไขการค้นหา</td></tr>';
      return;
    }

    tbody.innerHTML = filtered.map((app, idx) => {
      const a = app.applicant || {};
      const fullName = ((a.firstName || '') + ' ' + (a.lastName || '')).trim() || '-';
      const nick = a.nickname ? (' (' + a.nickname + ')') : '';
      const pos = app.positionName || '-';

      const createdAt = app.createdAt?.toDate ? app.createdAt.toDate() : new Date();
      const dateStr = createdAt.toLocaleDateString('th-TH', { year: 'numeric', month: 'short', day: 'numeric' });

      let signStatusHtml = '<span style="color:#fbbf24;font-weight:700;font-size:0.82rem;">⏳ รอลงนาม</span>';
      if (app.isVoided) {
        signStatusHtml = '<span style="color:#f87171;font-weight:700;font-size:0.82rem;">⛔ ยกเลิกสัญญา</span>';
      } else if (app.isSigned) {
        const signDate = app.contract.signedAt?.toDate ? app.contract.signedAt.toDate().toLocaleDateString('th-TH', { year: 'numeric', month: 'short', day: 'numeric' }) : '';
        signStatusHtml = '<span style="color:#4ade80;font-weight:700;font-size:0.82rem;">✍️ เซ็นแล้ว' + (signDate ? (' (' + signDate + ')') : '') + '</span>';
      }

      return '<tr>' +
        '<td>' + (idx + 1) + '</td>' +
        '<td><strong style="font-family:\'Chakra Petch\',monospace;color:#38bdf8;font-size:0.88rem;">' + app.computedRef + '</strong></td>' +
        '<td><strong>' + fullName + '</strong>' + nick + '</td>' +
        '<td><span class="jt-pos-badge" style="display:inline-block;padding:0.15rem 0.5rem;border-radius:6px;background:rgba(50,255,201,0.1);color:#32ffc9;border:1px solid rgba(50,255,201,0.3);font-size:0.78rem;">' + pos + '</span></td>' +
        '<td>' + dateStr + '</td>' +
        '<td>' + signStatusHtml + '</td>' +
        '<td>' +
          '<div style="display:flex;gap:0.35rem;flex-wrap:wrap;">' +
            '<a href="contract?id=' + app.id + '" target="_blank" class="jt-admin-btn secondary" style="padding:0.25rem 0.6rem;font-size:0.75rem;text-decoration:none;">👁️ ดูสัญญา</a>' +
            '<button type="button" class="jt-admin-btn secondary btn-copy-ctr-link" data-id="' + app.id + '" style="padding:0.25rem 0.55rem;font-size:0.75rem;" title="คัดลอกลิงก์สัญญา">📋</button>' +
            (!app.isVoided ? ('<button type="button" class="jt-admin-btn danger btn-void-ctr" data-id="' + app.id + '" style="padding:0.25rem 0.6rem;font-size:0.75rem;">⛔ ยกเลิก</button>') : '') +
            '<button type="button" class="jt-admin-btn danger btn-del-ctr" data-id="' + app.id + '" style="padding:0.25rem 0.55rem;font-size:0.75rem;" title="ลบใบสมัครและสัญญา">🗑️</button>' +
          '</div>' +
        '</td>' +
      '</tr>';
    }).join('');

    // Attach Event Listeners
    tbody.querySelectorAll('.btn-copy-ctr-link').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const id = e.currentTarget.dataset.id;
        const link = window.location.origin + '/contract?id=' + id;
        navigator.clipboard.writeText(link).then(() => {
          showToast('✓ คัดลอกลิงก์สัญญาเรียบร้อยแล้ว', '', 'success');
        });
      });
    });

    tbody.querySelectorAll('.btn-void-ctr').forEach(btn => {
      btn.addEventListener('click', async (e) => {
        const id = e.currentTarget.dataset.id;
        const app = allApplications.find(a => a.id === id);
        const reason = prompt('ระบุเหตุผลในการยกเลิกสัญญา (Void Contract):', 'ยกเลิกข้อตกลงและสิทธิ์การร่วมทีมโดยฝ่ายบริหาร');
        if (reason === null) return;

        try {
          await db.collection(APPS_COL).doc(id).set({
            status: 'cancelled',
            contract: {
              voided: true,
              voidReason: reason || 'ยกเลิกสัญญาโดยทีมงาน',
              voidedAt: firebase.firestore.FieldValue.serverTimestamp()
            },
            updatedAt: firebase.firestore.FieldValue.serverTimestamp()
          }, { merge: true });

          // Audit Log
          await recordAuditLog('VOID_CONTRACT', 'ยกเลิกสัญญา ID: ' + id + ' เหตุผล: ' + reason);

          // Notify User
          const targetUid = app?.applicantUid || app?.userId;
          if (targetUid) {
            try {
              await db.collection('users').doc(targetUid).collection('notifications').add({
                title: '⛔ สัญญาการร่วมทีมถูกยกเลิก',
                message: 'สัญญาตำแหน่ง "' + (app.positionName || '') + '" ได้ถูกยกเลิกแล้ว เนื่องจาก: ' + (reason || '-'),
                type: 'contract_voided',
                url: '/contract?id=' + id,
                createdAt: firebase.firestore.FieldValue.serverTimestamp(),
                read: false
              });
            } catch (err) {}
          }

          showToast('✓ ทำการยกเลิกสัญญาเรียบร้อยแล้ว', '', 'success');
          loadApplications();
        } catch (err) {
          showToast('เกิดข้อผิดพลาดในการยกเลิกสัญญา', err.message, 'error');
        }
      });
    });

    tbody.querySelectorAll('.btn-del-ctr').forEach(btn => {
      btn.addEventListener('click', async (e) => {
        const id = e.currentTarget.dataset.id;
        if (window.bcxConfirm ? await window.bcxConfirm('ลบใบสมัครและสัญญานี้ถาวรหรือไม่?', 'การลบข้อมูลไม่สามารถย้อนกลับได้') : window.confirm('คุณแน่ใจหรือไม่ว่าต้องการลบใบสมัครและสัญญานี้อย่างถาวร?')) {
          try {
            await db.collection(APPS_COL).doc(id).delete();
            await recordAuditLog('DELETE_CONTRACT_APPLICATION', 'ลบสัญญาและใบสมัคร ID: ' + id);
            showToast('✓ ลบข้อมูลสำเร็จ', '', 'success');
            loadApplications();
          } catch (err) {
            showToast('เกิดข้อผิดพลาดในการลบ', err.message, 'error');
          }
        }
      });
    });
  };

  // Export Contracts CSV
  const exportContractsCsv = () => {
    if (allApplications.length === 0) {
      showToast('ไม่มีข้อมูลสัญญาสำหรับส่งออก', '', 'warning');
      return;
    }

    let csvContent = '\uFEFF'; // UTF-8 BOM
    csvContent += 'ลำดับ,เลขที่สัญญา,ชื่อ-นามสกุล,ชื่อเล่น,ตำแหน่ง,อีเมล,เบอร์โทร,วันที่ทำสัญญา,สถานะการลงนาม,ผู้เซ็นสัญญา,สถานะยกเลิก\n';

    allApplications.forEach((app, idx) => {
      const a = app.applicant || {};
      const ref = computeContractRefNo(app, allApplications);
      const fullName = ((a.firstName || '') + ' ' + (a.lastName || '')).trim() || '-';
      const nick = a.nickname || '-';
      const pos = app.positionName || '-';
      const email = app.applicantEmail || a.email || a.socialLinks?.email || '-';
      const tel = a.socialLinks?.phone || a.socialLinks?.tel || '-';
      const createdAt = app.createdAt?.toDate ? app.createdAt.toDate().toLocaleDateString('th-TH') : '-';
      const isVoided = Boolean(app.contract && app.contract.voided) || app.status === 'cancelled';
      const isSigned = Boolean(app.contract && app.contract.signed);
      const signer = app.contract?.signerName || '-';

      const signStatus = isVoided ? 'ยกเลิกสัญญา' : (isSigned ? 'เซ็นแล้ว' : 'รอลงนาม');
      const voidStatus = isVoided ? (app.contract?.voidReason || 'ยกเลิกแล้ว') : 'ปกติ';

      const row = [
        idx + 1,
        '"' + ref + '"',
        '"' + fullName + '"',
        '"' + nick + '"',
        '"' + pos + '"',
        '"' + email + '"',
        '"' + tel + '"',
        '"' + createdAt + '"',
        '"' + signStatus + '"',
        '"' + signer + '"',
        '"' + voidStatus + '"'
      ].join(',');

      csvContent += row + '\n';
    });

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', 'BestCyniX_Contracts_Registry_' + new Date().toISOString().slice(0, 10) + '.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Event Listeners for Contracts Filters & Export
  $('ctrFilterPosition')?.addEventListener('change', renderContractsRegistry);
  $('ctrFilterStatus')?.addEventListener('change', renderContractsRegistry);
  $('ctrFilterYear')?.addEventListener('change', renderContractsRegistry);
  $('ctrSearchInput')?.addEventListener('input', renderContractsRegistry);
  $('btnExportContractsCsv')?.addEventListener('click', exportContractsCsv);


// ── Applications ──────────────────────────────────────────────────────────
  const loadApplications = () => {
    const handleAppSnap = (snap) => {
      allApplications = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      allApplications.sort((a, b) => {
        const tA = a.createdAt?.toDate ? a.createdAt.toDate().getTime() : (a.createdAt ? new Date(a.createdAt).getTime() : 0);
        const tB = b.createdAt?.toDate ? b.createdAt.toDate().getTime() : (b.createdAt ? new Date(b.createdAt).getTime() : 0);
        return tB - tA;
      });
      updateStats();
      renderAppTable(allApplications);
      recalculatePositionSlots();
    };

    db.collection(APPS_COL).orderBy('createdAt', 'desc').limit(100).onSnapshot(handleAppSnap, () => {
      db.collection(APPS_COL).limit(100).onSnapshot(handleAppSnap, (err) => console.error('Applications load error:', err));
    });
  };

  const updateStats = () => {
    if ($('statTotal')) $('statTotal').textContent = allApplications.length;
    if ($('statReviewing')) $('statReviewing').textContent = allApplications.filter(a => a.status === 'reviewing').length;
    if ($('statApproved')) $('statApproved').textContent = allApplications.filter(a => a.status === 'approved').length;
    if ($('statRejected')) $('statRejected').textContent = allApplications.filter(a => a.status === 'rejected').length;
  };

  const renderAppTable = (list) => {
    const tbody = $('appTableBody');
    if (!tbody) return;
    const filterStatus = $('appFilterStatus')?.value || '';
    const searchQuery = ($('appSearchInput')?.value || '').toLowerCase().trim();

    const filtered = list.filter(app => {
      const matchStatus = !filterStatus || app.status === filterStatus;
      const name = `${app.applicant?.nickname || ''} ${app.applicant?.firstName || ''} ${app.applicant?.lastName || ''} ${app.positionName || ''}`.toLowerCase();
      const matchSearch = !searchQuery || name.includes(searchQuery);
      return matchStatus && matchSearch;
    });

    if (!filtered.length) {
      tbody.innerHTML = '<tr><td colspan="7" style="text-align:center;color:var(--muted);padding:2rem;">ไม่พบใบสมัคร</td></tr>';
      return;
    }

    tbody.innerHTML = filtered.map((app, i) => {
      const date = app.createdAt?.toDate ? app.createdAt.toDate().toLocaleDateString('th-TH') : '-';
      return `
        <tr>
          <td style="font-size:.78rem;color:var(--muted);">${i + 1}</td>
          <td style="font-weight:700;">${app.applicant?.nickname || '-'}</td>
          <td>${app.applicant?.firstName || ''} ${app.applicant?.lastName || ''}</td>
          <td style="font-size:.82rem;">${app.positionName || '-'}</td>
          <td>${statusChip(app.status)}</td>
          <td style="font-size:.78rem;color:var(--muted);">${date}</td>
          <td>
            <button class="jt-admin-btn secondary" style="padding:.3rem .7rem;font-size:.78rem;" onclick="window._openAppModal('${app.id}')">👁 ดูรายละเอียด</button>
          </td>
        </tr>
      `;
    }).join('');
  };

  const statusChip = (status) => {
    switch (status) {
      case 'submitted':
        return `<span style="background:rgba(2,132,199,0.15);border:1px solid rgba(2,132,199,0.4);color:#38bdf8;padding:0.25rem 0.65rem;border-radius:999px;font-size:0.78rem;font-weight:700;">📩 ส่งใบสมัครแล้ว</span>`;
      case 'reviewing':
        return `<span style="background:rgba(234,179,8,0.15);border:1px solid rgba(234,179,8,0.4);color:#facc15;padding:0.25rem 0.65rem;border-radius:999px;font-size:0.78rem;font-weight:700;">🔍 กำลังพิจารณา</span>`;
      case 'approved':
        return `<span style="background:rgba(34,197,94,0.15);border:1px solid rgba(34,197,94,0.4);color:#4ade80;padding:0.25rem 0.65rem;border-radius:999px;font-size:0.78rem;font-weight:700;">✅ ผ่านการอนุมัติ</span>`;
      case 'rejected':
        return `<span style="background:rgba(239,68,68,0.15);border:1px solid rgba(239,68,68,0.4);color:#f87171;padding:0.25rem 0.65rem;border-radius:999px;font-size:0.78rem;font-weight:700;">❌ ปฏิเสธ</span>`;
      case 'revision':
        return `<span style="background:rgba(192,132,252,0.15);border:1px solid rgba(192,132,252,0.4);color:#c084fc;padding:0.25rem 0.65rem;border-radius:999px;font-size:0.78rem;font-weight:700;">📝 ขอแก้ไขข้อมูล</span>`;
      case 'cancelled':
        return `<span style="background:rgba(148,163,184,0.15);border:1px solid rgba(148,163,184,0.4);color:#94a3b8;padding:0.25rem 0.65rem;border-radius:999px;font-size:0.78rem;font-weight:700;">⛔ ยกเลิก</span>`;
      default:
        return `<span style="background:rgba(255,255,255,0.08);padding:0.25rem 0.65rem;border-radius:999px;font-size:0.78rem;">${status || '-'}</span>`;
    }
  };

  // ── App Detail Modal ──────────────────────────────────────────────────────
  const toggleModalActionPanels = (status) => {
    const rejWrap = $('modalRejectionWrap');
    const revWrap = $('modalRevisionWrap');
    const ctrWrap = $('modalContractActionsWrap');

    if (rejWrap) rejWrap.style.display = (status === 'rejected') ? 'block' : 'none';
    if (revWrap) revWrap.style.display = (status === 'revision') ? 'block' : 'none';
    if (ctrWrap) ctrWrap.style.display = (status === 'approved') ? 'block' : 'none';
  };

  $('modalStatusSelect')?.addEventListener('change', (e) => {
    toggleModalActionPanels(e.target.value);
  });

  window._openAppModal = (appId) => {
    currentAppId = appId;
    const app = allApplications.find(a => a.id === appId);
    if (!app) return;

    setAppDetailEditMode(false); // Reset to view mode on open

    const modal = $('appDetailModal');
    const body = $('modalBodyContent');
    const statusSel = $('modalStatusSelect');

    const a = app.applicant || {};
    const refNo = app.contractRefNo || `BCX-CTR-2026-${appId.slice(0, 6).toUpperCase()}`;

    if ($('modalAppTitle')) $('modalAppTitle').textContent = `ใบสมัคร: ${a.nickname || appId} [${refNo}]`;
    if (statusSel) statusSel.value = app.status || 'submitted';

    if ($('modalRejectionReason')) $('modalRejectionReason').value = app.rejectionReason || '';
    if ($('modalRevisionReason')) $('modalRevisionReason').value = app.revisionReason || '';
    if ($('modalContractRefText')) $('modalContractRefText').textContent = `เลขอ้างอิงสัญญา: ${refNo}`;

    const contractUrl = `${window.location.origin}/contract?id=${appId}`;
    const btnOpenCtr = $('btnModalOpenContract');
    if (btnOpenCtr) btnOpenCtr.href = contractUrl;

    const btnCopyCtr = $('btnModalCopyContractLink');
    if (btnCopyCtr) {
      btnCopyCtr.onclick = () => {
        navigator.clipboard.writeText(contractUrl).then(() => {
          showToast('คัดลอกลิงก์สัญญาแล้ว! 📋', contractUrl, 'success');
        });
      };
    }

    toggleModalActionPanels(app.status || 'submitted');

    const social = a.socialLinks || {};
    const socialHtml = Object.entries(social).map(([k, v]) => `<span style="margin-right:.5rem;">• ${k}: ${v}</span>`).join('');
    const customHtml = Object.entries(app.customAnswers || {}).map(([k, v]) => `
      <div class="jt-detail-field"><div class="jt-detail-label">${k}</div><div class="jt-detail-value">${Array.isArray(v) ? v.join(', ') : v}</div></div>
    `).join('');

    const photoCardHtml = a.photoURL ? `
      <div style="display:flex;gap:1.2rem;align-items:center;background:rgba(50,255,201,0.06);border:1px solid rgba(50,255,201,0.25);border-radius:12px;padding:0.9rem;margin-bottom:1rem;">
        <img src="${a.photoURL}" alt="Applicant Photo" style="width:75px;height:95px;border-radius:8px;object-fit:cover;border:2px solid var(--accent);" />
        <div>
          <div style="font-weight:700;color:var(--accent);font-size:0.95rem;">📸 รูปถ่ายผู้สมัคร (หน้าตรง สุภาพ)</div>
          <div style="font-size:0.8rem;color:var(--muted);margin-top:0.2rem;">ใช้ประกอบใบสมัครและเอกสารสัญญาทางการ</div>
        </div>
      </div>
    ` : '';

    if (body) body.innerHTML = `
      ${photoCardHtml}
      <div class="jt-detail-grid">
        <div class="jt-detail-field"><div class="jt-detail-label">ชื่อเล่น</div><div class="jt-detail-value">${a.nickname || '-'}</div></div>
        <div class="jt-detail-field"><div class="jt-detail-label">ชื่อ-นามสกุล</div><div class="jt-detail-value">${a.firstName || ''} ${a.lastName || ''}</div></div>
        <div class="jt-detail-field"><div class="jt-detail-label">อายุ</div><div class="jt-detail-value">${a.age ? `${a.age.years} ปี ${a.age.months || 0} เดือน` : '-'}</div></div>
        <div class="jt-detail-field"><div class="jt-detail-label">เพศ</div><div class="jt-detail-value">${a.gender || '-'}</div></div>
        <div class="jt-detail-field"><div class="jt-detail-label">วันเกิด</div><div class="jt-detail-value">${a.dob || '-'}</div></div>
        <div class="jt-detail-field"><div class="jt-detail-label">ตำแหน่งที่สมัคร</div><div class="jt-detail-value" style="color:var(--accent);font-weight:700;">${app.positionName || '-'}</div></div>
        <div class="jt-detail-field"><div class="jt-detail-label">อุปกรณ์</div><div class="jt-detail-value">${a.platform || '-'} ${a.platformOther || ''} ${a.deviceOS ? `(${a.deviceOS})` : ''}</div></div>
        <div class="jt-detail-field"><div class="jt-detail-label">ไมค์</div><div class="jt-detail-value">${a.hasMic || '-'}</div></div>
      </div>
      <div class="jt-detail-field"><div class="jt-detail-label">วันที่สะดวกทำงาน</div><div class="jt-detail-value">${(a.availableDays || []).join(', ') || '-'} ${a.availableTimeStart ? `(${a.availableTimeStart}–${a.availableTimeEnd || '?'})` : ''}</div></div>
      ${socialHtml ? `<div class="jt-detail-field"><div class="jt-detail-label">ช่องทาง Social</div><div class="jt-detail-value">${socialHtml}</div></div>` : ''}
      <div class="jt-detail-field"><div class="jt-detail-label">เหตุผลที่อยากร่วมทีม</div><div class="jt-detail-value" style="white-space:pre-wrap;background:rgba(5,11,22,.6);padding:.75rem;border-radius:8px;">${a.motivation || '-'}</div></div>
      ${customHtml}
      <div class="jt-detail-field">
        <div class="jt-detail-label">หมายเหตุ Admin (บันทึกภายใน)</div>
        <textarea id="appNoteInput" class="jt-textarea" style="min-height:70px;">${app.note || ''}</textarea>
      </div>
      <div style="display:flex;justify-content:space-between;align-items:center;font-size:.76rem;color:var(--muted);margin-top:.5rem;">
        <span>Application ID: ${appId}</span>
        <span>PDPA Consent: ✅ ยินยอมแล้ว</span>
      </div>
    `;

    modal.classList.add('is-open');
  };

  $('modalCloseBtn')?.addEventListener('click', () => {
    $('appDetailModal')?.classList.remove('is-open');
    currentAppId = null;
  });

  $('appDetailModal')?.addEventListener('click', (e) => {
    if (e.target === $('appDetailModal')) {
      $('appDetailModal').classList.remove('is-open');
      currentAppId = null;
    }
  });

  $('btnUpdateStatus')?.addEventListener('click', async () => {
    if (!currentAppId) return;
    const status = $('modalStatusSelect')?.value || 'submitted';
    const note = $('appNoteInput')?.value || '';
    const rejectionReason = $('modalRejectionReason')?.value || '';
    const revisionReason = $('modalRevisionReason')?.value || '';

    const app = allApplications.find(a => a.id === currentAppId);
    const refNo = app?.contractRefNo || `BCX-CTR-2026-${currentAppId.slice(0, 6).toUpperCase()}`;

    try {
      await db.collection(APPS_COL).doc(currentAppId).update({
        status,
        note,
        rejectionReason,
        revisionReason,
        contractRefNo: refNo,
        notifiedAt: firebase.firestore.FieldValue.serverTimestamp()
      });

      // Prepare Notification Content in Thai
      let notifTitle = `อัปเดตสถานะใบสมัคร (${app?.positionName || ''})`;
      let notifBody = `สถานะใบสมัครของคุณได้รับการอัปเดตเป็น: ${status}`;
      let notifUrl = `${window.location.origin}/join-team`;

      if (status === 'approved') {
        notifTitle = `🎉 ยินดีด้วย! ใบสมัครตำแหน่ง "${app?.positionName || ''}" ผ่านการอนุมัติแล้ว`;
        notifBody = note || 'ยินดีต้อนรับสู่ทีมงาน BestCyniX Dev! กรุณาเปิดดูเอกสารสัญญาและดำเนินการเซ็นสัญญา';
        notifUrl = `${window.location.origin}/contract?id=${currentAppId}`;
      } else if (status === 'rejected') {
        notifTitle = `ผลการพิจารณาใบสมัครตำแหน่ง "${app?.positionName || ''}"`;
        notifBody = rejectionReason || note || 'ขอบคุณที่ให้ความสนใจร่วมงานกับทีมงาน BestCyniX Dev';
        notifUrl = `${window.location.origin}/join-team`;
      } else if (status === 'revision') {
        notifTitle = `📝 ขอให้แก้ไขข้อมูลใบสมัครตำแหน่ง "${app?.positionName || ''}"`;
        notifBody = revisionReason || note || 'กรุณาตรวจสอบและอัปเดตข้อมูลใบสมัครของคุณตามที่แจ้ง';
        notifUrl = `${window.location.origin}/contract?id=${currentAppId}`;
      } else if (status === 'reviewing') {
        notifTitle = `🔍 ใบสมัครตำแหน่ง "${app?.positionName || ''}" กำลังอยู่ระหว่างการพิจารณา`;
        notifBody = note || 'ทีมงานกำลังตรวจสอบคุณสมบัติและข้อมูลใบสมัครของคุณ';
        notifUrl = `${window.location.origin}/join-team`;
      } else if (status === 'submitted') {
        notifTitle = `📩 ได้รับใบสมัครตำแหน่ง "${app?.positionName || ''}" แล้ว`;
        notifBody = note || 'ใบสมัครของคุณเข้าสู่ระบบเรียบร้อยแล้ว';
        notifUrl = `${window.location.origin}/contract?id=${currentAppId}`;
      } else if (status === 'cancelled') {
        notifTitle = `⛔ ใบสมัครตำแหน่ง "${app?.positionName || ''}" ถูกยกเลิก`;
        notifBody = note || 'ใบสมัครของคุณถูกยกเลิกเรียบร้อยแล้ว';
        notifUrl = `${window.location.origin}/join-team`;
      }

      // Robust User UID & Email Resolution
      let targetUid = app?.applicantUid || app?.userId || app?.uid || app?.applicant?.uid || app?.applicant?.userId || null;
      const applicantEmail = app?.applicantEmail || app?.applicant?.email || app?.applicant?.socialLinks?.email || null;
      const applicantNickname = app?.applicant?.nickname || '';
      const applicantFirstName = app?.applicant?.firstName || '';

      if (!targetUid && (applicantEmail || applicantNickname || applicantFirstName)) {
        try {
          if (applicantEmail) {
            const snap = await db.collection('users').where('email', '==', applicantEmail).limit(1).get();
            if (!snap.empty) targetUid = snap.docs[0].id;
          }
          if (!targetUid) {
            const allUsersSnap = await db.collection('users').get();
            allUsersSnap.forEach(uDoc => {
              const u = uDoc.data() || {};
              const uEmail = (u.email || '').toLowerCase();
              const uName = (u.displayName || '').toLowerCase();
              if (applicantEmail && uEmail === applicantEmail.toLowerCase()) targetUid = uDoc.id;
              else if (applicantNickname && uName.includes(applicantNickname.toLowerCase())) targetUid = uDoc.id;
              else if (applicantFirstName && uName.includes(applicantFirstName.toLowerCase())) targetUid = uDoc.id;
            });
          }
        } catch (e) {
          console.warn('User search error:', e);
        }
      }

      const notifData = {
        type: `application_${status}`,
        title: notifTitle,
        message: notifBody,
        url: notifUrl,
        applicationId: currentAppId,
        positionName: app?.positionName || '',
        contractRefNo: refNo,
        status: status,
        createdAt: firebase.firestore.FieldValue.serverTimestamp(),
        read: false
      };

      // Send notification strictly to the applicant's account only (Do not send to Dev team stream)
      if (targetUid) {
        try {
          await db.collection('users').doc(targetUid).collection('notifications').add(notifData);
        } catch (e) {}
      }

      // 4. Audit Log
      if (window.logAdminAudit) {
        window.logAdminAudit('UPDATE_APPLICATION_STATUS', `เปลี่ยนสถานะใบสมัคร ${app?.positionName || ''} เป็น ${status}`, {
          appId: currentAppId,
          status,
          refNo
        });
      }

      showToast(`อัปเดตสถานะเป็น "${status}" เรียบร้อยแล้ว`, notifTitle, 'success');
      $('appDetailModal')?.classList.remove('is-open');
      recalculatePositionSlots();
    } catch (err) {
      showToast('Error', err.message, 'error');
    }
  });

  $('btnDeleteApp')?.addEventListener('click', async () => {
    if (!currentAppId) return;
    if (!(window.bcxConfirm ? await window.bcxConfirm('ลบใบสมัครนี้ถาวรหรือไม่?', 'การลบข้อมูลไม่สามารถย้อนกลับได้') : window.confirm('ลบใบสมัครนี้ถาวร?'))) return;
    try {
      await db.collection(APPS_COL).doc(currentAppId).delete();
      showToast('ลบใบสมัครแล้ว', '', 'success');
      $('appDetailModal')?.classList.remove('is-open');
      currentAppId = null;
    } catch (err) {
      showToast('Error', err.message, 'error');
    }
  });

  // ── Contract ──────────────────────────────────────────────────────────────
  $('btnSendContract')?.addEventListener('click', () => {
    if (!currentAppId) return;
    const app = allApplications.find(a => a.id === currentAppId);
    if (!app) return;
    const a = app.applicant || {};
    const today = new Date().toLocaleDateString('th-TH', { year: 'numeric', month: 'long', day: 'numeric' });
    const contractHtml = `
      <div style="text-align:center;margin-bottom:2rem;">
        <h1 style="font-size:1.8rem;font-weight:800;color:#1a1a1a;margin-bottom:.5rem;">สัญญาการร่วมทีม</h1>
        <p style="color:#555;">BestCyniX Dev — Team Contract</p>
      </div>
      <p style="margin-bottom:1rem;">สัญญาฉบับนี้จัดทำขึ้นเมื่อวันที่ <strong>${today}</strong> ระหว่างทีม BestCyniX Dev และ:</p>
      <div style="border:1px solid #ddd;border-radius:8px;padding:1.2rem;margin-bottom:1.5rem;background:#f9f9f9;">
        <p><strong>ชื่อ-นามสกุล:</strong> ${a.firstName || ''} ${a.lastName || ''}</p>
        <p><strong>ชื่อเล่น:</strong> ${a.nickname || '-'}</p>
        <p><strong>ตำแหน่ง:</strong> ${app.positionName || '-'}</p>
        <p><strong>Application ID:</strong> ${currentAppId}</p>
      </div>
      <h3 style="margin-bottom:.5rem;">ข้อตกลงและเงื่อนไข</h3>
      <ol style="padding-left:1.3rem;line-height:2;color:#333;">
        <li>ผู้ร่วมทีมยินยอมทำงานให้กับ BestCyniX Dev ในตำแหน่งที่กำหนด</li>
        <li>ห้ามเปิดเผยข้อมูลความลับของทีมและโปรเจกต์แก่บุคคลภายนอก</li>
        <li>ปฏิบัติตามกฎระเบียบและข้อกำหนดของทีม</li>
        <li>ให้ความร่วมมือและสื่อสารกับทีมอย่างสม่ำเสมอ</li>
        <li>ทีมงานสามารถยกเลิกสัญญาได้หากผู้ร่วมทีมละเมิดข้อตกลง</li>
      </ol>
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:2rem;margin-top:3rem;">
        <div style="text-align:center;">
          <div style="border-top:1px solid #333;padding-top:.5rem;margin-top:3rem;font-size:.9rem;">
            <strong>ลายมือชื่อผู้ร่วมทีม</strong><br/>
            ${a.firstName || ''} ${a.lastName || ''}<br/>
            <small style="color:#777;">วันที่: ${today}</small>
          </div>
        </div>
        <div style="text-align:center;">
          <div style="border-top:1px solid #333;padding-top:.5rem;margin-top:3rem;font-size:.9rem;">
            <strong>ลายมือชื่อหัวหน้าทีม</strong><br/>
            BestCyniX Dev<br/>
            <small style="color:#777;">วันที่: ${today}</small>
          </div>
        </div>
      </div>
    `;
    const content = $('contractContent');
    if (content) content.innerHTML = contractHtml;
    $('contractModal')?.classList.add('is-open');
    $('appDetailModal')?.classList.remove('is-open');
  });

  // ── Notifications ─────────────────────────────────────────────────────────
  const loadNotifications = () => {
    db.collection(NOTIF_COL).orderBy('createdAt', 'desc').limit(50).onSnapshot((snap) => {
      const notifs = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      const unread = notifs.filter(n => !n.read).length;

      const badge = $('notifBadge');
      if (badge) {
        badge.textContent = unread;
        badge.style.display = unread > 0 ? 'inline' : 'none';
      }

      const list = $('notifList');
      if (!list) return;
      if (!notifs.length) {
        list.innerHTML = `
          <div style="text-align:center;padding:2.5rem;color:var(--muted);">
            <div style="font-size:2rem;margin-bottom:.5rem;">📭</div>
            <div style="font-weight:700;color:#fff;margin-bottom:.2rem;">ยังไม่มีการแจ้งเตือน</div>
            <div style="font-size:.82rem;">เมื่อมีผู้สมัครงานใหม่หรืออัปเดตสถานะ จะปรากฏขึ้นที่นี่แบบเรียลไทม์</div>
          </div>
        `;
        return;
      }
      list.innerHTML = notifs.map(n => {
        const icon = n.type === 'submitted' ? '🚀' : n.type === 'approved' ? '✅' : '❌';
        const typeLabel = n.type === 'submitted' ? 'ใบสมัครใหม่' : n.type === 'approved' ? 'อนุมัติ' : 'ปฏิเสธ';
        const date = n.createdAt?.toDate ? n.createdAt.toDate().toLocaleString('th-TH') : '';
        return `
          <div style="display:flex;align-items:flex-start;gap:.75rem;padding:.95rem 1.1rem;background:${n.read ? 'rgba(5,11,22,.4)' : 'rgba(50,255,201,.06)'};border:1px solid ${n.read ? 'rgba(255,255,255,.06)' : 'rgba(50,255,201,.25)'};border-radius:14px;transition:all .2s;">
            <span style="font-size:1.4rem;">${icon}</span>
            <div style="flex:1;min-width:0;">
              <div style="font-weight:700;color:#fff;font-size:.9rem;display:flex;align-items:center;gap:.4rem;">
                ${typeLabel} — ${n.positionName || '-'}
                ${!n.read ? '<span style="background:#ff5574;width:8px;height:8px;border-radius:50%;display:inline-block;"></span>' : ''}
              </div>
              <div style="font-size:.84rem;color:var(--muted);margin-top:.2rem;">${n.applicantName || ''}</div>
              <div style="font-size:.74rem;color:rgba(255,255,255,.4);margin-top:.3rem;">${date}</div>
            </div>
            <div style="display:flex;gap:.4rem;align-items:center;flex-wrap:wrap;">
              ${n.applicationId ? `
                <button class="jt-admin-btn primary" onclick="window._viewAppFromNotif('${n.applicationId}', '${n.id}')" style="padding:.3rem .7rem;font-size:.78rem;">
                  🔍 ดูใบสมัคร
                </button>
              ` : ''}
              ${!n.read ? `
                <button class="jt-admin-btn secondary" onclick="window._markNotifRead('${n.id}')" title="ทำเครื่องหมายว่าอ่านแล้ว" style="padding:.3rem .6rem;font-size:.78rem;">
                  ✓ อ่านแล้ว
                </button>
              ` : ''}
              <button class="jt-admin-btn danger" onclick="window._deleteNotif('${n.id}')" title="ลบการแจ้งเตือน" style="padding:.3rem .6rem;font-size:.78rem;">
                🗑️
              </button>
            </div>
          </div>
        `;
      }).join('');
    });
  };

  window._viewAppFromNotif = (appId, notifId) => {
    if (notifId) window._markNotifRead(notifId);
    // Switch to tab applications and open modal
    document.querySelectorAll('.admin-tab-btn').forEach(b => b.classList.remove('active'));
    document.querySelectorAll('.admin-tab-content').forEach(c => c.classList.remove('active'));
    document.querySelector('.admin-tab-btn[data-tab="applications"]')?.classList.add('active');
    $('tab-applications')?.classList.add('active');
    window._openAppDetail(appId);
  };

  window._markNotifRead = async (notifId) => {
    await db.collection(NOTIF_COL).doc(notifId).update({ read: true });
  };

  window._deleteNotif = async (notifId) => {
    await db.collection(NOTIF_COL).doc(notifId).delete();
    showToast('ลบการแจ้งเตือนแล้ว', '', 'success');
  };

  $('btnMarkAllRead')?.addEventListener('click', async () => {
    const snap = await db.collection(NOTIF_COL).where('read', '==', false).get();
    const batch = db.batch();
    snap.docs.forEach(d => batch.update(d.ref, { read: true }));
    await batch.commit();
    showToast('อ่านทั้งหมดเรียบร้อยแล้ว', '', 'success');
  });

  // ── CSV Export ────────────────────────────────────────────────────────────
  $('btnExportCsv')?.addEventListener('click', () => {
    const rows = [['ID', 'ชื่อเล่น', 'ชื่อ', 'นามสกุล', 'ตำแหน่ง', 'สถานะ', 'อายุ', 'เพศ', 'วันที่สมัคร']];
    allApplications.forEach(app => {
      const a = app.applicant || {};
      const date = app.createdAt?.toDate ? app.createdAt.toDate().toLocaleDateString('th-TH') : '-';
      rows.push([app.id, a.nickname || '', a.firstName || '', a.lastName || '', app.positionName || '', app.status || '', a.age?.years || '', a.gender || '', date]);
    });
    const csv = rows.map(r => r.map(c => `"${String(c).replace(/"/g, '""')}"`).join(',')).join('\n');
    const blob = new Blob(['\ufeff' + csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `join-team-applications-${new Date().toISOString().slice(0,10)}.csv`;
    link.click();
  });

  // ── Filter/Search ─────────────────────────────────────────────────────────
  $('appFilterStatus')?.addEventListener('change', () => renderAppTable(allApplications));
  $('appSearchInput')?.addEventListener('input', () => renderAppTable(allApplications));

  // ── Status mode conditional ───────────────────────────────────────────────
  $('cfgStatusMode')?.addEventListener('change', () => {
    const wrap = $('cfgAutoTimeWrap');
    if (wrap) wrap.style.display = $('cfgStatusMode').value === 'auto' ? 'grid' : 'none';
  });

  // ── Init Admin Panel ──────────────────────────────────────────────────────
  const initAdminPanel = () => {
    initTabs();
    loadFormConfig();
    loadProjectRegistry();
    loadApplications();
    loadNotifications();

    $('btnToggleOpen')?.addEventListener('click', toggleOpen);
    $('btnSaveFormSettings')?.addEventListener('click', saveFormSettings);
  };

  // ── Boot ──────────────────────────────────────────────────────────────────
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initAuth);
  } else {
    initAuth();
  }
})();
