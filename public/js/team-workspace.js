(function () {
  'use strict';

  const db = firebase.firestore();
  const auth = firebase.auth();
  const storage = firebase.storage();
  const $ = (id) => document.getElementById(id);
  const esc = (value) => String(value ?? '').replace(/[&<>'"]/g, (ch) => ({ '&':'&amp;', '<':'&lt;', '>':'&gt;', "'":'&#39;', '"':'&quot;' }[ch]));
  const safeUrl = (value) => { try { const u = new URL(value, window.location.origin); return ['http:', 'https:'].includes(u.protocol) ? u.href : ''; } catch { return ''; } };
  const timestamp = () => firebase.firestore.FieldValue.serverTimestamp();
  const adminEmails = new Set(['bestcynix@gmail.com', 'admin@email.com']);
  const MAX_MESSAGE_FILES = 10;
  const MAX_MESSAGE_FILE_BYTES = 25 * 1024 * 1024;
  const MAX_MESSAGE_TOTAL_BYTES = 50 * 1024 * 1024;
  const state = { user: null, admin: false, groups: [], group: null, role: 'member', members: [], messages: [], meetings: [], reply: null, unsubs: [], messageInitialized: false, messageFilter: 'all', editingMessageId: null, messageFiles: [], messagePreviewUrls: [], call: { meeting: null, localStream: null, peers: new Map(), participantNames: new Map(), participantsUnsub: null, signalsUnsub: null, participantRef: null } };

  function stopListeners() { state.unsubs.splice(0).forEach((fn) => { try { fn(); } catch {} }); }
  function setAuthState(message, kind = 'info') { const el = $('twAuthState'); if (el) { el.textContent = message; el.className = `tw-state tw-state-${kind}`; el.hidden = !message; } }
  function flash(message, kind = 'info') { setAuthState(message, kind); clearTimeout(flash.timer); flash.timer = setTimeout(() => { if ($('twAuthState')) $('twAuthState').hidden = true; }, 4500); }
  function storageErrorMessage(error) {
    const code = String(error?.code || '');
    if (code === 'storage/quota-exceeded' || code.endsWith('/quota-exceeded')) return 'Firebase Storage ใช้งานครบโควตา หรือโปรเจกต์ยังไม่ได้เปิดแพ็กเกจ Blaze กรุณาตรวจสอบ Billing และ Storage quota ก่อนอัปโหลดไฟล์อีกครั้ง';
    if (code === 'storage/unauthorized') return 'ไม่มีสิทธิ์อัปโหลดไฟล์ในกลุ่มงานนี้';
    if (code === 'storage/canceled') return 'ยกเลิกการอัปโหลดไฟล์แล้ว';
    if (code === 'storage/retry-limit-exceeded') return 'อัปโหลดไม่สำเร็จเพราะการเชื่อมต่อไม่เสถียร กรุณาลองใหม่';
    if (code === 'storage/network-request-failed') return 'อัปโหลดไม่สำเร็จเพราะเครือข่ายขัดข้อง กรุณาตรวจสอบอินเทอร์เน็ตแล้วลองใหม่';
    return error?.message || 'อัปโหลดไฟล์ไม่สำเร็จ';
  }
  function firestoreErrorMessage(error) {
    const code = String(error?.code || '');
    if (code === 'permission-denied' || code.endsWith('/permission-denied')) return 'ไม่มีสิทธิ์ดำเนินการนี้ ลิงก์อาจหมดอายุ บัญชีอาจเป็นสมาชิกกลุ่มอยู่แล้ว หรือข้อมูลกลุ่มไม่พร้อมใช้งาน';
    if (code === 'unavailable' || code.endsWith('/unavailable') || code === 'deadline-exceeded' || code.endsWith('/deadline-exceeded')) return 'เชื่อมต่อ Firebase ไม่สำเร็จ กรุณาตรวจสอบอินเทอร์เน็ตแล้วลองใหม่';
    return error?.message || 'ดำเนินการไม่สำเร็จ';
  }
  function friendlyErrorMessage(error) { return String(error?.code || '').startsWith('storage/') ? storageErrorMessage(error) : firestoreErrorMessage(error); }
  function isStorageQuotaError(error) { const code = String(error?.code || ''); return code === 'storage/quota-exceeded' || code.endsWith('/quota-exceeded'); }
  function isManager() { return state.admin || ['owner', 'admin', 'lead'].includes(state.role); }
  function displayName(user = state.user) { return user?.displayName || user?.email?.split('@')[0] || 'สมาชิก'; }
  function formatTime(value) { const date = value?.toDate ? value.toDate() : (value ? new Date(value) : null); return date && !Number.isNaN(date.getTime()) ? date.toLocaleString('th-TH', { dateStyle: 'short', timeStyle: 'short' }) : 'กำลังบันทึก…'; }
  function openModal(title, body, submitLabel = 'บันทึก') { $('twModalTitle').textContent = title; $('twModalBody').innerHTML = body; $('twModalSubmit').textContent = submitLabel; if ($('twModalCancel')) $('twModalCancel').textContent = 'ยกเลิก'; $('twModal').showModal(); }
  function closeModal() { if ($('twModal').open) $('twModal').close(); }
  function closeMessageMenus(exceptId = '') { document.querySelectorAll('.tw-message-menu-list').forEach((menu) => { if (menu.dataset.messageId !== exceptId) { menu.hidden = true; menu.previousElementSibling?.setAttribute('aria-expanded', 'false'); } }); }
  function setNoGroupState(title, description) { const panel = $('twNoGroup'); if (!panel) return; const heading = panel.querySelector('h2'); const text = panel.querySelector('p'); if (heading) heading.textContent = title; if (text) text.textContent = description; }
  function modalValue(id) { return ($(id)?.value || '').trim(); }
  function messageIsRead(message) { return message.senderUid === state.user?.uid || message.readBy?.[state.user?.uid] === true; }
  function readReceiptNames(message) { const ids = Object.entries(message.readBy || {}).filter(([, value]) => value === true).map(([uid]) => uid); return ids.map((uid) => state.members.find((member) => member.id === uid)?.displayName || state.members.find((member) => member.id === uid)?.email || uid); }
  async function uploadWorkspaceFile(file, path, maxBytes = 25 * 1024 * 1024, accepted = () => true) {
    if (!file) return null;
    if (file.size > maxBytes || !accepted(file)) throw new Error('ไฟล์ไม่ถูกต้องหรือมีขนาดใหญ่เกินกำหนด');
    const safeName = file.name.toLowerCase().replace(/[^a-z0-9._-]+/g, '-');
    const ref = storage.ref(`${path}/${Date.now()}-${crypto.randomUUID?.() || Math.random().toString(36).slice(2)}-${safeName}`);
    const uploaded = await ref.put(file, { contentType: file.type });
    return { url: await uploaded.ref.getDownloadURL(), name: file.name, type: file.type, size: file.size };
  }

  function clearSelectedMessageFiles() {
    state.messagePreviewUrls.splice(0).forEach((url) => URL.revokeObjectURL(url));
    state.messageFiles = [];
    const input = $('twAttachment');
    if (input) input.value = '';
    const preview = $('twAttachmentPreview');
    if (preview) { preview.hidden = true; preview.innerHTML = ''; }
    if ($('twClearAttachments')) $('twClearAttachments').hidden = true;
    if ($('twAttachmentName')) $('twAttachmentName').textContent = '';
  }

  function renderMessageAttachmentPreview() {
    const preview = $('twAttachmentPreview');
    if (!preview) return;
    state.messagePreviewUrls.splice(0).forEach((url) => URL.revokeObjectURL(url));
    if (!state.messageFiles.length) { preview.hidden = true; preview.innerHTML = ''; if ($('twAttachmentName')) $('twAttachmentName').textContent = ''; if ($('twClearAttachments')) $('twClearAttachments').hidden = true; return; }
    const cards = state.messageFiles.map((file, index) => {
      const url = URL.createObjectURL(file);
      state.messagePreviewUrls.push(url);
      const media = file.type.startsWith('video/') ? `<video src="${esc(url)}" muted playsinline preload="metadata"></video>` : `<img src="${esc(url)}" alt="${esc(file.name)}">`;
      return `<div class="tw-attachment-preview-item">${media}<button type="button" class="tw-attachment-remove" data-remove-attachment="${index}" aria-label="ยกเลิกไฟล์ ${esc(file.name)}">✕</button><span>${esc(file.name)}</span></div>`;
    }).join('');
    preview.innerHTML = cards;
    preview.hidden = false;
    if ($('twClearAttachments')) $('twClearAttachments').hidden = false;
    if ($('twAttachmentName')) $('twAttachmentName').textContent = `เลือกแล้ว ${state.messageFiles.length} ไฟล์`;
  }

  function selectMessageFiles(files) {
    const selected = Array.from(files || []);
    if (selected.length > MAX_MESSAGE_FILES) throw new Error(`เลือกไฟล์ได้ไม่เกิน ${MAX_MESSAGE_FILES} ไฟล์ต่อข้อความ`);
    if (selected.some((file) => file.size > MAX_MESSAGE_FILE_BYTES || !(file.type.startsWith('image/') || file.type.startsWith('video/')))) throw new Error('รองรับเฉพาะรูป/วิดีโอ โดยแต่ละไฟล์ต้องไม่เกิน 25 MB');
    if (selected.reduce((total, file) => total + file.size, 0) > MAX_MESSAGE_TOTAL_BYTES) throw new Error('ไฟล์รวมต่อข้อความต้องไม่เกิน 50 MB');
    state.messageFiles = selected;
    renderMessageAttachmentPreview();
  }

  function removeSelectedMessageFile(index) {
    if (!Number.isInteger(index) || index < 0 || index >= state.messageFiles.length) return;
    state.messageFiles.splice(index, 1);
    renderMessageAttachmentPreview();
  }

  async function uploadMessageFiles(files) {
    const uploads = [];
    for (const file of files) {
      const safeName = file.name.toLowerCase().replace(/[^a-z0-9._-]+/g, '-');
      const ref = storage.ref(`team-attachments/${state.group.id}/${Date.now()}-${crypto.randomUUID?.() || Math.random().toString(36).slice(2)}-${safeName}`);
      try {
        const uploaded = await ref.put(file, { contentType: file.type });
        uploads.push({ url: await uploaded.ref.getDownloadURL(), name: file.name, type: file.type, size: file.size });
      } catch (error) {
        error.uploaded = uploads;
        throw error;
      }
    }
    return uploads;
  }

  function messageAttachments(message) {
    if (Array.isArray(message.attachments) && message.attachments.length) return message.attachments;
    return message.attachmentUrl ? [{ url: message.attachmentUrl, name: message.attachmentName, type: message.attachmentType }] : [];
  }

  function renderMessageMedia(message) {
    if (message.revokedAt) return '';
    return messageAttachments(message).map((file) => {
      const url = safeUrl(file.url);
      if (!url) return '<div class="tw-attachment-unavailable">ไฟล์แนบไม่พร้อมใช้งาน</div>';
      const label = file.name || 'ไฟล์แนบ';
      return String(file.type || '').startsWith('video/') ? `<video class="tw-message-media" controls preload="metadata" data-tw-attachment-media src="${esc(url)}"></video>` : `<img class="tw-message-media" loading="lazy" data-tw-attachment-media src="${esc(url)}" alt="${esc(label)}">`;
    }).join('');
  }

  function renderGroups() {
    const query = ($('twGroupSearch')?.value || '').toLowerCase();
    const list = $('twGroupList');
    const rows = state.groups.filter((g) => `${g.name} ${g.organization} ${g.description}`.toLowerCase().includes(query));
    if (!rows.length) { list.innerHTML = '<div class="tw-empty">ยังไม่มีกลุ่มที่ตรงกับการค้นหา</div>'; return; }
    list.innerHTML = rows.map((g) => `<button class="tw-group-item ${state.group?.id === g.id ? 'is-active' : ''}" data-group-id="${esc(g.id)}"><img src="${esc(safeUrl(g.imageUrl) || 'assets/photo/bcxlogo2.png')}" alt=""><span><strong>${esc(g.name)}</strong><small>${esc(g.organization || 'กลุ่มงาน')} • ${(g.memberUids || []).length} สมาชิก</small></span></button>`).join('');
  }

  function renderGroupHeader() {
    const g = state.group; if (!g) return;
    $('twNoGroup').hidden = true; $('twGroupPanel').hidden = false;
    $('twGroupImage').src = safeUrl(g.imageUrl) || 'assets/photo/bcxlogo2.png'; $('twGroupName').textContent = g.name || 'กลุ่มงาน'; $('twGroupOrganization').textContent = g.organization || 'TEAM WORKSPACE'; $('twGroupDescription').textContent = g.description || '';
    $('twGroupRole').textContent = `ยศ: ${state.role}`; if ($('twGroupSelectionStatus')) $('twGroupSelectionStatus').textContent = `● เปิดใช้งาน: ${g.name || 'กลุ่มงาน'}`; $('twGroupUrlText').textContent = groupUrl(); $('twEditGroup').hidden = !isManager(); $('twAddDocument').hidden = !isManager(); $('twAddMeeting').hidden = !isManager();
    renderGroups();
  }

  function groupUrl() { if (!state.group) return ''; const url = new URL('/team-workspace', window.location.origin); url.searchParams.set('group', state.group.id); return url.href; }
  async function copyGroupLink() { const url = groupUrl(); if (!url) return; await navigator.clipboard?.writeText(url); flash('คัดลอก URL กลุ่มแล้ว', 'info'); }

  function validInviteId(inviteId) { return /^[A-Za-z0-9_-]{10,128}$/.test(String(inviteId || '')); }
  function renderInvitePreview(invite, inviteId) {
    const banner = $('twInviteBanner');
    if (!banner) return;
    const used = Number(invite.uses || 0); const maxUses = Number(invite.maxUses || 0); const expiresAt = invite.expiresAt ? new Date(invite.expiresAt) : null;
    banner.innerHTML = `<div class="tw-invite-card"><div class="tw-invite-card-main"><img class="tw-invite-avatar" src="assets/photo/bcxlogo2.png" alt="รูปกลุ่ม"><div><span class="tw-eyebrow">GROUP INVITATION</span><h2>${esc(invite.groupName || 'กลุ่มงาน')}</h2><p>คำเชิญเข้าร่วมพื้นที่ทำงานทีมแบบส่วนตัว</p></div></div><div class="tw-invite-card-meta"><span>🔗 ลิงก์เชิญใช้งานได้</span>${expiresAt && !Number.isNaN(expiresAt.getTime()) ? `<span>หมดอายุ ${esc(expiresAt.toLocaleDateString('th-TH'))}</span>` : ''}${maxUses ? `<span>ใช้แล้ว ${used}/${maxUses} ครั้ง</span>` : ''}</div><button id="twInviteAction" class="tw-btn tw-btn-primary tw-invite-action" type="button">ตรวจสอบและเข้าร่วม</button></div>`;
    const action = $('twInviteAction');
    action?.addEventListener('click', async () => { action.disabled = true; action.textContent = 'กำลังตรวจสอบ…'; try { await joinInvite(inviteId); } catch (error) { flash(firestoreErrorMessage(error), 'error'); action.disabled = false; action.textContent = state.user ? 'ตรวจสอบและเข้าร่วม' : 'เข้าสู่ระบบก่อนเข้าร่วม'; } });
  }
  async function loadInvitePreview(inviteId) {
    const banner = $('twInviteBanner');
    if (!banner || !validInviteId(inviteId)) return;
    banner.hidden = false; banner.innerHTML = '<div class="tw-invite-card"><div class="tw-invite-loading">กำลังโหลดข้อมูลกลุ่ม…</div></div>';
    try {
      const snapshot = await db.doc(`teamInvites/${inviteId}`).get();
      if (!snapshot.exists) throw new Error('ไม่พบลิงก์เชิญนี้');
      const invite = snapshot.data(); const expiresAt = invite.expiresAt ? new Date(invite.expiresAt).getTime() : 0;
      if (!invite.active || (expiresAt && expiresAt < Date.now()) || Number(invite.uses || 0) >= Number(invite.maxUses || 0)) throw new Error('ลิงก์เชิญหมดอายุหรือถูกใช้ครบแล้ว');
      renderInvitePreview(invite, inviteId);
    } catch (error) { banner.innerHTML = `<div class="tw-invite-card"><strong>ไม่สามารถเปิดลิงก์เชิญได้</strong><p>${esc(error.message || 'ตรวจสอบลิงก์แล้วลองใหม่')}</p></div>`; }
  }

  function setTab(name) { document.querySelectorAll('.tw-tabs button').forEach((b) => b.classList.toggle('is-active', b.dataset.tab === name)); document.querySelectorAll('.tw-tab-panel').forEach((p) => p.classList.remove('is-active')); $(`twTab${name[0].toUpperCase()}${name.slice(1)}`)?.classList.add('is-active'); if (name === 'documents') loadDocuments(); if (name === 'meetings') loadMeetings(); if (name === 'members') loadMembers(); }

  async function selectGroup(groupId) {
    stopListeners(); cleanupWebMeeting(); state.group = null; state.members = []; state.messages = []; state.meetings = []; state.reply = null; state.messageInitialized = false; $('twGroupPanel').hidden = true; $('twNoGroup').hidden = false; setNoGroupState('กำลังเปิดกลุ่มงาน…', 'กำลังตรวจสอบสิทธิ์และโหลดข้อมูลกลุ่ม');
    const nextGroup = state.groups.find((g) => g.id === groupId) || null;
    if (!nextGroup) { setNoGroupState('ไม่พบกลุ่มงานนี้', 'กลุ่มอาจถูกปิดใช้งาน หรือบัญชีนี้ไม่มีสิทธิ์เข้าถึง'); renderGroups(); return; }
    state.group = nextGroup;
    try { const member = await db.doc(`teamGroups/${groupId}/members/${state.user.uid}`).get(); if (!member.exists && !state.admin) throw new Error('บัญชีนี้ไม่ได้เป็นสมาชิกกลุ่มนี้'); state.role = member.exists ? (member.data().role || 'member') : 'owner'; } catch (error) { state.group = null; const message = firestoreErrorMessage(error); setNoGroupState('เปิดกลุ่มงานไม่สำเร็จ', message); renderGroups(); flash(message, 'error'); return; }
    const url = new URL(window.location.href); url.searchParams.set('group', groupId); url.searchParams.delete('invite'); window.history.replaceState(null, '', url);
    renderGroupHeader(); loadMessages(); loadMembers();
  }

  function loadMessages() {
    const groupId = state.group.id;
    const unsubscribe = db.collection(`teamGroups/${groupId}/messages`).orderBy('createdAt', 'desc').limit(100).onSnapshot((snap) => { const next = snap.docs.map((d) => ({ id: d.id, ...d.data() })).reverse(); const latest = next[next.length - 1]; if (state.messageInitialized && latest && latest.senderUid !== state.user.uid && 'Notification' in window && Notification.permission === 'granted') { const notify = () => new Notification(`${state.group.name}: ${latest.senderName || 'สมาชิก'}`, { body: latest.text || 'ส่งไฟล์แนบใหม่', icon: '/assets/photo/bcxlogo2.png', tag: `team-${groupId}` }); if (navigator.serviceWorker?.ready) navigator.serviceWorker.ready.then((registration) => registration.showNotification(`${state.group.name}: ${latest.senderName || 'สมาชิก'}`, { body: latest.text || 'ส่งไฟล์แนบใหม่', icon: '/assets/photo/bcxlogo2.png', tag: `team-${groupId}`, data: { url: `/team-workspace?group=${groupId}` } })).catch(notify); else notify(); } state.messageInitialized = true; state.messages = next; renderMessages(); markMessagesRead(next, groupId); }, (error) => flash(`โหลดแชทไม่สำเร็จ: ${friendlyErrorMessage(error)}`, 'error'));
    state.unsubs.push(unsubscribe);
  }
  function renderMessages() {
    const query = ($('twMessageSearch')?.value || '').toLowerCase();
    const rows = state.messages.filter((m) => (state.messageFilter !== 'unread' || !messageIsRead(m)) && `${m.text || ''} ${m.attachmentName || ''} ${Array.isArray(m.attachments) ? m.attachments.map((file) => file.name || '').join(' ') : ''} ${m.senderName || ''}`.toLowerCase().includes(query));
    const box = $('twMessages');
    if (!rows.length) { box.innerHTML = '<div class="tw-empty">ยังไม่มีข้อความในช่วงที่ค้นหา</div>'; return; }
    box.innerHTML = rows.map((m) => {
      const mine = m.senderUid === state.user.uid; const read = messageIsRead(m); const revoked = Boolean(m.revokedAt); const receiptNames = readReceiptNames(m);
      const reply = m.replyTo ? `<div class="tw-reply-preview">ตอบกลับ ${esc(m.replyTo.senderName || '')}: ${esc(m.replyTo.text || '')}</div>` : '';
      const statusLabel = mine ? 'ส่งแล้ว' : (read ? 'อ่านแล้ว' : 'ยังไม่อ่าน'); const statusClass = mine ? 'is-sent' : (read ? 'is-read' : 'is-unread');
      const readAction = mine || revoked ? '' : `<button type="button" data-read-id="${esc(m.id)}" data-read-value="${read ? 'false' : 'true'}">${read ? 'ทำเป็นยังไม่อ่าน' : 'ทำเป็นอ่านแล้ว'}</button>`;
      const ownerActions = mine && !revoked ? `<button type="button" data-edit-id="${esc(m.id)}">✏️ แก้ไขข้อความ</button><button type="button" data-revoke-id="${esc(m.id)}">↩️ ยกเลิกข้อความ</button>` : '';
      const managerActions = isManager() ? `<button type="button" data-pin-id="${esc(m.id)}">📌 ${m.pinned ? 'ยกเลิกปักหมุด' : 'ปักหมุด'}</button>` : '';
      const deleteAction = mine || isManager() ? `<button type="button" data-delete-id="${esc(m.id)}">🗑️ ลบข้อความ</button>` : '';
      const menu = `<div class="tw-message-menu"><button type="button" class="tw-message-menu-trigger" data-message-menu="${esc(m.id)}" aria-label="ตัวเลือกข้อความ" aria-haspopup="menu" aria-expanded="false">⋯</button><div class="tw-message-menu-list" data-message-id="${esc(m.id)}" role="menu" hidden><button type="button" data-reply-id="${esc(m.id)}">↩️ ตอบกลับ</button>${readAction}<button type="button" data-receipts-id="${esc(m.id)}">👁️ อ่านแล้ว ${receiptNames.length} คน</button>${ownerActions}${managerActions}${deleteAction}</div></div>`;
      const body = revoked ? '<em class="tw-revoked-message">ยกเลิกข้อความแล้ว</em>' : esc(m.text || '');
      return `<article class="tw-message ${mine ? 'is-mine' : ''} ${read ? 'is-read' : 'is-unread'} ${revoked ? 'is-revoked' : ''}">${menu}<div class="tw-message-meta"><span class="tw-online-dot ${m.senderOnline ? 'is-online' : ''}"></span><strong>${esc(m.senderName || 'สมาชิก')}</strong><span>${esc(formatTime(m.createdAt))}</span>${m.editedAt && !revoked ? '<span class="tw-edited-label">แก้ไขแล้ว</span>' : ''}${m.pinned ? '<span>📌</span>' : ''}<span class="tw-read-state ${statusClass}">${revoked ? 'ยกเลิกแล้ว' : statusLabel}</span></div>${reply}<div class="tw-message-body">${body}</div>${renderMessageMedia(m)}<button type="button" class="tw-message-receipt" data-receipts-id="${esc(m.id)}">👁️ อ่านแล้ว ${receiptNames.length} คน</button></article>`;
    }).join('');
    box.scrollTop = box.scrollHeight;
  }

  function showMessageEditModal(message) { openModal('แก้ไขข้อความ', `<label class="tw-field">ข้อความ<textarea id="twModalEditText" rows="4" maxlength="2500" required>${esc(message.text || '')}</textarea></label>`, 'บันทึกการแก้ไข'); $('twModalForm').dataset.action = 'edit-message'; $('twModalForm').dataset.messageId = message.id; }
  function showReadReceipts(message) { const names = readReceiptNames(message); openModal('อ่านข้อความแล้ว', names.length ? `<p class="tw-receipt-summary">อ่านแล้ว ${names.length} คน</p><ul class="tw-receipt-list">${names.map((name) => `<li>🟢 ${esc(name)}</li>`).join('')}</ul>` : '<p class="tw-empty">ยังไม่มีสมาชิกอื่นอ่านข้อความนี้</p>', 'ปิด'); $('twModalForm').dataset.action = 'close-modal'; }
  function meetingProviderLabel(provider) { return ({ web: 'ประชุมในเว็บ', 'google-meet': 'Google Meet', discord: 'Discord', 'microsoft-teams': 'Microsoft Teams' })[provider] || 'ประชุมภายนอก'; }

  async function markAllMessagesRead() {
    if (!state.group || !state.user) return;
    const pending = state.messages.filter((m) => m.senderUid !== state.user.uid && !messageIsRead(m));
    if (!pending.length) return flash('ไม่มีข้อความที่ยังไม่อ่าน', 'info');
    const batch = db.batch(); pending.forEach((m) => batch.update(db.doc(`teamGroups/${state.group.id}/messages/${m.id}`), { [`readBy.${state.user.uid}`]: true, [`unreadBy.${state.user.uid}`]: false, updatedAt: timestamp() })); await batch.commit(); flash(`ทำเครื่องหมายอ่านแล้ว ${pending.length} ข้อความ`, 'info');
  }

  async function markMessagesRead(messages, groupId = state.group?.id) {
    if (!groupId || !state.user) return;
    const pending = messages.filter((m) => m.senderUid !== state.user.uid && !messageIsRead(m));
    if (!pending.length) return;
    const batch = db.batch();
    pending.forEach((m) => batch.update(db.doc(`teamGroups/${groupId}/messages/${m.id}`), { [`readBy.${state.user.uid}`]: true, [`unreadBy.${state.user.uid}`]: false, updatedAt: timestamp() }));
    try { await batch.commit(); } catch (error) { flash(`บันทึกสถานะอ่านไม่สำเร็จ: ${friendlyErrorMessage(error)}`, 'error'); }
  }

  async function sendMessage(event) {
    event.preventDefault();
    if (!state.group || !state.user) return;
    const text = $('twMessageText').value.trim();
    const files = state.messageFiles.slice();
    if (!text && !files.length) return;
    const button = $('twMessageForm').querySelector('button[type="submit"]'); button.disabled = true;
    try {
      let attachments = [];
      let uploadWarning = '';
      if (files.length) {
        try {
          attachments = await uploadMessageFiles(files);
        } catch (error) {
          if (!text || !isStorageQuotaError(error)) throw error;
          attachments = error.uploaded || [];
          uploadWarning = storageErrorMessage(error);
        }
      }
      const first = attachments[0] || {};
      await db.collection(`teamGroups/${state.group.id}/messages`).add({ senderUid: state.user.uid, senderName: displayName(), senderPhoto: state.user.photoURL || null, senderOnline: true, text, attachments, attachmentUrl: first.url || null, attachmentType: first.type || null, attachmentName: first.name || null, replyTo: state.reply ? { messageId: state.reply.id, senderName: state.reply.senderName || '', text: String(state.reply.text || '').slice(0, 300) } : null, pinned: false, readBy: {}, unreadBy: {}, createdAt: timestamp() });
      $('twMessageText').value = ''; clearSelectedMessageFiles(); cancelReply();
      if (uploadWarning) flash(`ส่งข้อความแล้ว แต่ไม่ได้แนบรูป: ${uploadWarning}`, 'error');
    } catch (error) {
      flash(friendlyErrorMessage(error), 'error');
    } finally { button.disabled = false; }
  }
  function cancelReply() { state.reply = null; $('twReplyPreview').hidden = true; $('twCancelReply').hidden = true; }

  async function loadMembers() { if (!state.group) return; const snap = await db.collection(`teamGroups/${state.group.id}/members`).orderBy('displayName').get().catch(() => null); state.members = snap ? snap.docs.map((d) => ({ id: d.id, ...d.data() })) : []; renderMembers(); renderMessages(); }
  function renderMembers() { const box = $('twMembers'); if (!state.members.length) { box.innerHTML = '<div class="tw-empty">ยังไม่มีสมาชิก</div>'; return; } box.innerHTML = state.members.map((m) => `<div class="tw-card tw-member-row"><img class="tw-member-avatar" src="${esc(safeUrl(m.photoURL) || 'assets/photo/bcxlogo2.png')}" alt=""><div class="tw-member-info"><strong><span class="tw-online-dot ${m.online ? 'is-online' : ''}"></span> ${esc(m.displayName || m.email || m.id)}</strong><small>${esc(m.email || '')} • เข้าใช้งานล่าสุด ${esc(formatTime(m.lastSeen))}</small></div><div class="tw-member-controls">${isManager() && m.id !== state.user.uid ? `<select data-role-uid="${esc(m.id)}"><option ${m.role === 'member' ? 'selected' : ''} value="member">สมาชิก</option><option ${m.role === 'staff' ? 'selected' : ''} value="staff">Staff</option><option ${m.role === 'admin' ? 'selected' : ''} value="admin">Admin</option><option ${m.role === 'lead' ? 'selected' : ''} value="lead">หัวหน้ากลุ่ม</option></select><button class="tw-btn tw-btn-muted" data-remove-uid="${esc(m.id)}" type="button">นำออก</button>` : `<span class="tw-role-chip">${esc(m.role || 'member')}</span>`}</div></div>`).join(''); }
  async function loadDocuments() { if (!state.group) return; const snap = await db.collection(`teamGroups/${state.group.id}/documents`).orderBy('createdAt', 'desc').get().catch(() => null); const box = $('twDocuments'); const rows = snap ? snap.docs.map((d) => ({ id: d.id, ...d.data() })) : []; if (!rows.length) { box.innerHTML = '<div class="tw-empty">ยังไม่มีเอกสารในกลุ่ม</div>'; return; } box.innerHTML = rows.map((d) => { const url = safeUrl(d.url); const isImage = String(d.mimeType || '').startsWith('image/'); const preview = isImage && url ? `<img class="tw-document-preview" loading="lazy" src="${esc(url)}" alt="${esc(d.title || 'เอกสาร')}">` : ''; return `<article class="tw-card">${preview}<div class="tw-card-head"><div><h4>📄 ${esc(d.title || 'เอกสาร')}</h4><p>${esc(d.description || '')}</p></div><span>${esc(formatTime(d.createdAt))}</span></div><a href="${esc(url)}" target="_blank" rel="noopener noreferrer">${esc(d.fileName || d.url || 'เปิดเอกสาร')}</a><div class="tw-card-actions"><button class="tw-btn tw-btn-outline" data-copy-url="${esc(d.url)}" type="button">คัดลอกลิงก์</button>${isManager() ? `<button class="tw-btn tw-btn-muted" data-delete-doc="${esc(d.id)}" type="button">ลบ</button>` : ''}</div></article>`; }).join(''); }
  async function loadMeetings() { if (!state.group) return; const snap = await db.collection(`teamGroups/${state.group.id}/meetings`).orderBy('startsAt', 'asc').get().catch(() => null); const box = $('twMeetings'); const rows = snap ? snap.docs.map((d) => ({ id: d.id, ...d.data() })) : []; state.meetings = rows; if (!rows.length) { box.innerHTML = '<div class="tw-empty">ยังไม่มีนัดหมาย</div>'; return; } box.innerHTML = rows.map((m) => { const response = m.responses?.[state.user.uid] || 'pending'; const provider = m.provider || (String(m.url || '').includes('meet.google') ? 'google-meet' : 'external'); const providerText = meetingProviderLabel(provider); const link = safeUrl(m.roomUrl || m.url); const joinAction = provider === 'web' ? `<button class="tw-btn tw-btn-primary" data-join-meeting-id="${esc(m.id)}" type="button">▶ เปิดห้องประชุมในเว็บ</button>` : `<a class="tw-btn tw-btn-primary" href="${esc(link)}" target="_blank" rel="noopener noreferrer">↗ เปิด ${esc(providerText)}</a>`; return `<article class="tw-card tw-meeting-card"><div class="tw-card-head"><div><span class="tw-eyebrow">${esc(providerText)}</span><h4>📹 ${esc(m.title || 'นัดหมายทีม')}</h4><p>เริ่ม: ${esc(formatTime(m.startsAt))}</p></div><span class="tw-role-chip">${esc(response === 'accepted' ? 'ตอบรับแล้ว' : response === 'rejected' ? 'ปฏิเสธแล้ว' : 'รอตอบรับ')}</span></div>${provider === 'web' ? '<p class="tw-provider-note">ห้องประชุมเสียง/วิดีโอของทีม เปิดไมค์และกล้องได้จากในเว็บ</p>' : `<a href="${esc(link)}" target="_blank" rel="noopener noreferrer">${esc(link)}</a>`}<div class="tw-card-actions">${joinAction}<button class="tw-btn tw-btn-outline" data-meeting-response="accepted" data-meeting-id="${esc(m.id)}" type="button">✓ ตอบรับ</button><button class="tw-btn tw-btn-muted" data-meeting-response="rejected" data-meeting-id="${esc(m.id)}" type="button">ไม่เข้าร่วม</button>${isManager() ? `<button class="tw-btn tw-btn-muted" data-delete-meeting="${esc(m.id)}" type="button">ลบนัดหมาย</button>` : ''}</div></article>`; }).join(''); }

  function showGroupModal() { openModal('ตั้งค่ากลุ่มงาน', `<label class="tw-field">ชื่อกลุ่ม/ทีม<input id="twModalName" required maxlength="120" value="${esc(state.group?.name || '')}"></label><label class="tw-field">ชื่อกลุ่ม/บริษัทที่แสดง<input id="twModalOrg" maxlength="120" value="${esc(state.group?.organization || '')}"></label><label class="tw-field">คำอธิบาย<textarea id="twModalDescription" maxlength="1000" rows="3">${esc(state.group?.description || '')}</textarea></label><label class="tw-field">รูปกลุ่ม (เลือกอย่างใดอย่างหนึ่ง)<input id="twModalImageFile" type="file" accept="image/jpeg,image/png,image/webp" /><small>อัปโหลดรูปได้ไม่เกิน 5 MB</small></label><label class="tw-field">หรือ URL รูปกลุ่ม<input id="twModalImage" type="url" maxlength="1000" value="${esc(state.group?.imageUrl || '')}" placeholder="https://…"></label><div id="twModalImageStatus" class="tw-file-name">ถ้าเลือกไฟล์ ระบบจะใช้ไฟล์แทน URL</div>`, 'บันทึกกลุ่ม'); $('twModalForm').dataset.action = state.group ? 'edit-group' : 'create-group'; }
  function showCreateModal() { const currentGroup = state.group; state.group = null; showGroupModal(); state.group = currentGroup; $('twModalForm').dataset.action = 'create-group'; }
  function showDocumentModal() { openModal('เพิ่มเอกสารของกลุ่ม', `<div class="tw-warning">เอกสารในหน้านี้เป็นพื้นที่ส่วนตัวของสมาชิกกลุ่ม ห้ามใส่สำเนาบัตรประชาชน สมุดบัญชี หรือข้อมูลภาษีโดยไม่จำเป็น</div><label class="tw-field">ชื่อเอกสาร<input id="twModalTitleValue" maxlength="160" required></label><label class="tw-field">คำอธิบาย<textarea id="twModalDocDescription" maxlength="800" rows="2"></textarea></label><label class="tw-field">อัปโหลดรูป/PDF<input id="twModalFile" type="file" accept="image/jpeg,image/png,image/webp,application/pdf" /><small>ไฟล์ไม่เกิน 20 MB หรือใช้ URL ด้านล่าง</small></label><label class="tw-field">URL เอกสาร/ไฟล์ (HTTPS)<input id="twModalUrl" type="url" maxlength="1000" placeholder="https://…"></label>`, 'เพิ่มเอกสาร'); $('twModalForm').dataset.action = 'add-document'; }
  function showMeetingModal() { openModal('สร้างนัดหมายประชุม', `<label class="tw-field">หัวข้อประชุม<input id="twModalMeetingTitle" maxlength="160" placeholder="เช่น ประชุมวางแผนงาน" required></label><label class="tw-field">วันและเวลา<input id="twModalStartsAt" type="datetime-local" required></label><label class="tw-field">รูปแบบการประชุม<select id="twModalMeetingProvider"><option value="web">ประชุมในเว็บ (เสียง/วิดีโอ)</option><option value="google-meet">Google Meet</option><option value="discord">Discord</option><option value="microsoft-teams">Microsoft Teams</option></select></label><div id="twMeetingProviderNote" class="tw-provider-note">สร้างห้องประชุมของทีมในเว็บนี้ ผู้เข้าร่วมเปิดไมค์และกล้องได้หลังเข้าห้อง</div><label id="twMeetingUrlField" class="tw-field" hidden>ลิงก์ห้องประชุมภายนอก<input id="twModalMeetingUrl" type="url" maxlength="1000" placeholder="https://meet.google.com/…"></label>`, 'สร้างนัดหมาย'); $('twModalForm').dataset.action = 'add-meeting'; syncMeetingProviderFields(); }
  function syncMeetingProviderFields() { const provider = $('twModalMeetingProvider')?.value || 'web'; const external = provider !== 'web'; const field = $('twMeetingUrlField'); const input = $('twModalMeetingUrl'); if (field) field.hidden = !external; if (input) { input.required = external; input.placeholder = provider === 'google-meet' ? 'https://meet.google.com/…' : provider === 'discord' ? 'https://discord.com/channels/…' : 'https://teams.microsoft.com/…'; } if ($('twMeetingProviderNote')) $('twMeetingProviderNote').textContent = external ? `วางลิงก์ ${meetingProviderLabel(provider)} ที่ทีมใช้ ผู้เข้าร่วมจะเปิดลิงก์ในแท็บใหม่` : 'สร้างห้องประชุมของทีมในเว็บนี้ ผู้เข้าร่วมเปิดไมค์และกล้องได้หลังเข้าห้อง'; }

  async function createOrUpdateGroup() { const name = modalValue('twModalName'); if (!name) throw new Error('กรุณาระบุชื่อกลุ่ม'); const imageFile = $('twModalImageFile')?.files?.[0]; const imageUrlInput = safeUrl(modalValue('twModalImage')); const base = { name, organization: modalValue('twModalOrg'), description: modalValue('twModalDescription'), imageUrl: imageUrlInput || null, updatedAt: timestamp() }; if (state.group && $('twModalForm').dataset.action === 'edit-group') { if (imageFile) base.imageUrl = (await uploadWorkspaceFile(imageFile, `team-group-images/${state.group.id}`, 5 * 1024 * 1024, (file) => file.type.startsWith('image/'))).url; await db.doc(`teamGroups/${state.group.id}`).update(base); state.group = { ...state.group, ...base }; closeModal(); renderGroupHeader(); flash('บันทึกการตั้งค่ากลุ่มแล้ว', 'info'); return; } if (!state.admin) throw new Error('การสร้างกลุ่มใหม่ต้องให้ Dev Admin ดำเนินการ'); const ref = db.collection('teamGroups').doc(); if (imageFile) base.imageUrl = (await uploadWorkspaceFile(imageFile, `team-group-images/${ref.id}`, 5 * 1024 * 1024, (file) => file.type.startsWith('image/'))).url; const member = { uid: state.user.uid, displayName: displayName(), email: state.user.email || '', photoURL: state.user.photoURL || null, role: 'owner', online: true, lastSeen: timestamp(), joinedAt: timestamp() }; await db.runTransaction(async (tx) => { tx.set(ref, { id: ref.id, ...base, ownerUid: state.user.uid, managerUids: [state.user.uid], memberUids: [state.user.uid], lastMemberUid: state.user.uid, active: true, createdAt: timestamp() }); tx.set(ref.collection('members').doc(state.user.uid), member); }); closeModal(); flash('สร้างกลุ่มใหม่แล้ว', 'info'); await loadGroups(); await selectGroup(ref.id); }
  async function addDocument() { const title = modalValue('twModalTitleValue'); const urlInput = safeUrl(modalValue('twModalUrl')); const file = $('twModalFile')?.files?.[0]; if (!title || (!urlInput && !file)) throw new Error('กรุณาใส่ URL หรือเลือกไฟล์'); let uploaded = null; if (file) uploaded = await uploadWorkspaceFile(file, `team-documents/${state.group.id}`, 20 * 1024 * 1024, (item) => item.type === 'application/pdf' || item.type.startsWith('image/')); const url = uploaded?.url || urlInput; await db.collection(`teamGroups/${state.group.id}/documents`).add({ title, description: modalValue('twModalDocDescription'), url, fileName: uploaded?.name || null, mimeType: uploaded?.type || null, createdBy: state.user.uid, createdAt: timestamp(), updatedAt: timestamp() }); closeModal(); loadDocuments(); }
  async function addMeeting() { const title = modalValue('twModalMeetingTitle'); const provider = modalValue('twModalMeetingProvider') || 'web'; const externalUrl = safeUrl(modalValue('twModalMeetingUrl')); const startsAt = $('twModalStartsAt').value; if (!title || !startsAt || (provider !== 'web' && !externalUrl)) throw new Error('กรุณากรอกข้อมูลนัดหมายให้ครบ'); if (provider !== 'web') { const host = new URL(externalUrl).hostname.toLowerCase(); const expected = provider === 'google-meet' ? host.includes('meet.google.com') : provider === 'discord' ? host.includes('discord.com') || host.includes('discord.gg') : host.includes('teams.microsoft.com') || host.includes('teams.live.com'); if (!expected) throw new Error(`ลิงก์ไม่ตรงกับผู้ให้บริการ ${meetingProviderLabel(provider)}`); } const ref = db.collection(`teamGroups/${state.group.id}/meetings`).doc(); const room = new URL('/team-workspace', window.location.origin); room.searchParams.set('group', state.group.id); room.searchParams.set('meeting', ref.id); const url = provider === 'web' ? room.href : externalUrl; await ref.set({ title, provider, url, roomUrl: provider === 'web' ? room.href : null, startsAt: new Date(startsAt).toISOString(), createdBy: state.user.uid, responses: {}, createdAt: timestamp(), updatedAt: timestamp() }); closeModal(); loadMeetings(); flash('สร้างนัดหมายแล้ว', 'info'); }

  function callPath(meetingId) { return `teamGroups/${state.group.id}/meetings/${meetingId}`; }
  function ensureCallTile(uid, name, local = false) { const grid = $('twCallStage'); if (!grid) return null; const id = local ? 'twCallLocalTile' : `twCallRemoteTile-${uid}`; let tile = $(id); if (!tile) { tile = document.createElement('figure'); tile.id = id; tile.className = 'tw-call-tile'; tile.innerHTML = `<video id="${local ? 'twCallLocalVideo' : `twCallRemoteVideo-${esc(uid)}`}" autoplay playsinline ${local ? 'muted' : ''}></video><figcaption>${esc(name || (local ? 'คุณ' : 'สมาชิก'))}</figcaption>`; grid.appendChild(tile); } else if (name) tile.querySelector('figcaption').textContent = name; return tile.querySelector('video'); }
  async function sendCallSignal(to, type, payload) { const call = state.call; if (!call.meeting) return; await db.collection(`${callPath(call.meeting.id)}/signals`).add({ from: state.user.uid, to, type, payload, createdAt: timestamp() }); }
  function ensurePeer(remoteUid, initiator) { const call = state.call; const existing = call.peers.get(remoteUid); if (existing) return existing; const pc = new RTCPeerConnection({ iceServers: [{ urls: 'stun:stun.l.google.com:19302' }] }); const peer = { pc, pendingCandidates: [], remoteDescriptionSet: false }; call.peers.set(remoteUid, peer); const remoteVideo = ensureCallTile(remoteUid, call.participantNames.get(remoteUid) || 'สมาชิก'); if (call.localStream) call.localStream.getTracks().forEach((track) => pc.addTrack(track, call.localStream)); pc.onicecandidate = (event) => { if (event.candidate) sendCallSignal(remoteUid, 'candidate', event.candidate.toJSON()).catch(() => {}); }; pc.ontrack = (event) => { if (remoteVideo && event.streams[0]) remoteVideo.srcObject = event.streams[0]; }; pc.onconnectionstatechange = () => { if (['failed', 'closed', 'disconnected'].includes(pc.connectionState)) { pc.close(); call.peers.delete(remoteUid); $( `twCallRemoteTile-${remoteUid}`)?.remove(); } }; if (initiator) pc.createOffer().then((offer) => pc.setLocalDescription(offer).then(() => sendCallSignal(remoteUid, 'offer', offer))).catch(() => {}); return peer; }
  async function handleCallSignal(signal) { const initiator = state.user.uid < signal.from; const peer = ensurePeer(signal.from, initiator); if (signal.type === 'offer') { await peer.pc.setRemoteDescription(signal.payload); peer.remoteDescriptionSet = true; for (const candidate of peer.pendingCandidates.splice(0)) await peer.pc.addIceCandidate(candidate); const answer = await peer.pc.createAnswer(); await peer.pc.setLocalDescription(answer); await sendCallSignal(signal.from, 'answer', answer); } else if (signal.type === 'answer') { await peer.pc.setRemoteDescription(signal.payload); peer.remoteDescriptionSet = true; for (const candidate of peer.pendingCandidates.splice(0)) await peer.pc.addIceCandidate(candidate); } else if (signal.type === 'candidate') { const candidate = new RTCIceCandidate(signal.payload); if (peer.remoteDescriptionSet) await peer.pc.addIceCandidate(candidate); else peer.pendingCandidates.push(candidate); } }
  async function startWebMeeting(meeting) { const call = state.call; call.meeting = meeting; call.participantNames.set(state.user.uid, displayName()); $('twCallStatus').textContent = 'กำลังขอสิทธิ์ไมโครโฟนและกล้อง…'; try { call.localStream = await navigator.mediaDevices.getUserMedia({ audio: true, video: true }); if (state.call !== call || !call.meeting) { call.localStream.getTracks().forEach((track) => track.stop()); return; } const localVideo = ensureCallTile(state.user.uid, displayName(), true); if (localVideo) localVideo.srcObject = call.localStream; } catch (error) { $('twCallStatus').textContent = 'เปิดไมค์/กล้องไม่ได้: อนุญาตสิทธิ์จากเบราว์เซอร์แล้วลองเข้าห้องอีกครั้ง'; flash(error.message || 'ไม่สามารถเปิดไมค์และกล้องได้', 'error'); return; } const path = callPath(meeting.id); call.participantRef = db.doc(`${path}/participants/${state.user.uid}`); await call.participantRef.set({ uid: state.user.uid, displayName: displayName(), online: true, joinedAt: timestamp(), updatedAt: timestamp() }); if (state.call !== call || !call.meeting) return; call.participantsUnsub = db.collection(`${path}/participants`).onSnapshot((snap) => { snap.docs.forEach((doc) => { if (doc.id === state.user.uid) return; const data = doc.data(); call.participantNames.set(doc.id, data.displayName || 'สมาชิก'); ensureCallTile(doc.id, data.displayName || 'สมาชิก'); ensurePeer(doc.id, state.user.uid < doc.id); }); $('twCallStatus').textContent = `อยู่ในห้องประชุม • ${snap.docs.filter((doc) => doc.data().online !== false).length} คน`; }); call.signalsUnsub = db.collection(`${path}/signals`).where('to', '==', state.user.uid).onSnapshot((snap) => snap.docChanges().filter((change) => change.type === 'added').forEach((change) => handleCallSignal(change.doc.data()).catch(() => {}))); $('twCallStatus').textContent = 'เข้าห้องแล้ว • รอสมาชิกคนอื่นเข้าร่วม'; }
  function cleanupWebMeeting() { const call = state.call; if (!call.meeting) return; call.participantsUnsub?.(); call.signalsUnsub?.(); call.peers.forEach(({ pc }) => pc.close()); call.localStream?.getTracks().forEach((track) => track.stop()); call.participantRef?.update({ online: false, updatedAt: timestamp() }).catch(() => {}); state.call = { meeting: null, localStream: null, peers: new Map(), participantNames: new Map(), participantsUnsub: null, signalsUnsub: null, participantRef: null }; }
  function showWebMeetingModal(meeting) { openModal(`ห้องประชุม: ${meeting.title || 'ประชุมทีม'}`, `<div class="tw-call-shell"><div id="twCallStatus" class="tw-call-status">กำลังเตรียมห้องประชุม…</div><div id="twCallStage" class="tw-call-stage"></div><div class="tw-call-controls"><button class="tw-btn tw-btn-muted" type="button" data-call-toggle="audio">🎙️ ปิดไมค์</button><button class="tw-btn tw-btn-muted" type="button" data-call-toggle="video">📷 ปิดกล้อง</button></div></div>`, 'วางสาย'); $('twModalForm').dataset.action = 'web-meeting'; $('twModalForm').dataset.meetingId = meeting.id; if ($('twModalCancel')) $('twModalCancel').textContent = 'ออกจากห้อง'; startWebMeeting(meeting).catch((error) => { if ($('twCallStatus')) $('twCallStatus').textContent = error.message || 'เข้าห้องประชุมไม่สำเร็จ'; }); }

  async function copyInvite() { if (!state.group) return; const ref = db.collection('teamInvites').doc(); await ref.set({ id: ref.id, groupId: state.group.id, groupName: state.group.name, createdBy: state.user.uid, active: true, expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(), uses: 0, maxUses: 100, createdAt: timestamp() }); const url = `${location.origin}/team-workspace?invite=${ref.id}`; await navigator.clipboard?.writeText(url); flash('สร้างและคัดลอกลิงก์เชิญแล้ว', url, 'info'); }
  async function joinInvite(inviteId) { if (!state.user) throw new Error('กรุณาเข้าสู่ระบบก่อนเข้าร่วมกลุ่ม'); if (!validInviteId(inviteId)) throw new Error('ลิงก์เชิญไม่ถูกต้อง'); const inviteSnap = await db.doc(`teamInvites/${inviteId}`).get(); if (!inviteSnap.exists) throw new Error('ไม่พบลิงก์เชิญ'); const invite = inviteSnap.data(); if (!invite.active || new Date(invite.expiresAt).getTime() < Date.now() || Number(invite.uses || 0) >= Number(invite.maxUses || 100)) throw new Error('ลิงก์เชิญหมดอายุหรือถูกปิดแล้ว'); const groupRef = db.doc(`teamGroups/${invite.groupId}`); const memberRef = groupRef.collection('members').doc(state.user.uid); const member = { uid: state.user.uid, displayName: displayName(), email: state.user.email || '', photoURL: state.user.photoURL || null, role: 'member', online: true, lastSeen: timestamp(), joinedAt: timestamp(), inviteId }; const batch = db.batch(); batch.set(memberRef, member); batch.update(groupRef, { memberUids: firebase.firestore.FieldValue.arrayUnion(state.user.uid), lastMemberUid: state.user.uid, lastJoinInviteId: inviteId, updatedAt: timestamp() }); batch.update(inviteSnap.ref, { uses: firebase.firestore.FieldValue.increment(1) }); await batch.commit(); flash('เข้าร่วมกลุ่มสำเร็จแล้ว', 'info'); await loadGroups(); await selectGroup(invite.groupId); }
  async function loadGroups() { const query = state.admin ? db.collection('teamGroups').where('active', '==', true) : db.collection('teamGroups').where('active', '==', true).where('memberUids', 'array-contains', state.user.uid); const snap = await query.get(); state.groups = snap.docs.map((d) => ({ id: d.id, ...d.data() })).sort((a,b) => String(a.name).localeCompare(String(b.name), 'th')); renderGroups(); const requested = new URLSearchParams(location.search).get('group'); const requestedGroup = requested && state.groups.find((g) => g.id === requested); if (!state.group && (requestedGroup || state.groups[0])) await selectGroup((requestedGroup || state.groups[0]).id); }

  async function handleModalSubmit(event) { event.preventDefault(); try { const action = $('twModalForm').dataset.action; if (action === 'create-group' || action === 'edit-group') await createOrUpdateGroup(); if (action === 'add-document') await addDocument(); if (action === 'add-meeting') await addMeeting(); if (action === 'edit-message') { const text = modalValue('twModalEditText'); if (!text) throw new Error('ข้อความต้องไม่ว่าง'); await db.doc(`teamGroups/${state.group.id}/messages/${$('twModalForm').dataset.messageId}`).update({ text, editedAt: timestamp(), updatedAt: timestamp() }); closeModal(); } if (action === 'web-meeting') { cleanupWebMeeting(); closeModal(); } if (action === 'close-modal') closeModal(); } catch (error) { flash(friendlyErrorMessage(error), 'error'); } }
  async function updatePresence(online) { if (!state.user || !state.group) return; await db.doc(`teamGroups/${state.group.id}/members/${state.user.uid}`).update({ online, lastSeen: timestamp() }).catch(() => {}); }

  $('twMessages').addEventListener('error', (event) => { if (!event.target.matches('.tw-message-media')) return; const fallback = document.createElement('div'); fallback.className = 'tw-attachment-unavailable'; fallback.textContent = 'ไฟล์แนบไม่พร้อมใช้งาน'; event.target.replaceWith(fallback); }, true);
  document.addEventListener('error', (event) => { const image = event.target; if (!(image instanceof HTMLImageElement) || image.dataset.fallbackImage) return; image.dataset.fallbackImage = 'true'; image.src = 'assets/photo/bcxlogo2.png'; }, true);

  document.addEventListener('click', async (event) => {
    const groupButton = event.target.closest('[data-group-id]'); if (groupButton) return selectGroup(groupButton.dataset.groupId);
    const tab = event.target.closest('[data-tab]'); if (tab) return setTab(tab.dataset.tab);
    const removeAttachment = event.target.closest('[data-remove-attachment]'); if (removeAttachment) { removeSelectedMessageFile(Number(removeAttachment.dataset.removeAttachment)); return; }
    const menuTrigger = event.target.closest('[data-message-menu]'); if (menuTrigger) { const id = menuTrigger.dataset.messageMenu; const menu = document.querySelector(`.tw-message-menu-list[data-message-id="${CSS.escape(id)}"]`); const isOpen = menu && !menu.hidden; closeMessageMenus(isOpen ? '' : id); if (menu) { menu.hidden = isOpen; menuTrigger.setAttribute('aria-expanded', String(!isOpen)); } return; }
    if (!event.target.closest('.tw-message-menu')) closeMessageMenus();
    const menuItem = event.target.closest('.tw-message-menu-list button'); if (menuItem) closeMessageMenus();
    const callToggle = event.target.closest('[data-call-toggle]'); if (callToggle) { const kind = callToggle.dataset.callToggle; const tracks = state.call.localStream?.getTracks().filter((track) => track.kind === kind) || []; const enabled = tracks.some((track) => track.enabled); tracks.forEach((track) => { track.enabled = !enabled; }); callToggle.classList.toggle('is-off', enabled); callToggle.textContent = kind === 'audio' ? `${enabled ? '🎙️ เปิดไมค์' : '🎙️ ปิดไมค์'}` : `${enabled ? '📷 เปิดกล้อง' : '📷 ปิดกล้อง'}`; return; }
    const joinMeeting = event.target.closest('[data-join-meeting-id]'); if (joinMeeting) { const meeting = state.group && state.meetings?.find((item) => item.id === joinMeeting.dataset.joinMeetingId); if (meeting) showWebMeetingModal(meeting); return; }
    const reply = event.target.closest('[data-reply-id]'); if (reply) { state.reply = state.messages.find((m) => m.id === reply.dataset.replyId); if (state.reply) { $('twReplyPreview').textContent = `ตอบกลับ ${state.reply.senderName}: ${String(state.reply.text || '').slice(0, 300)}`; $('twReplyPreview').hidden = false; $('twCancelReply').hidden = false; $('twMessageText').focus(); } return; }
    const receipts = event.target.closest('[data-receipts-id]'); if (receipts) { const message = state.messages.find((m) => m.id === receipts.dataset.receiptsId); if (message) showReadReceipts(message); return; }
    const edit = event.target.closest('[data-edit-id]'); if (edit) { const message = state.messages.find((m) => m.id === edit.dataset.editId); if (message) showMessageEditModal(message); return; }
    const revoke = event.target.closest('[data-revoke-id]'); if (revoke) { const confirmed = window.bcxConfirm ? await window.bcxConfirm('ยกเลิกข้อความ', 'ยกเลิกข้อความนี้หรือไม่? สมาชิกจะเห็นว่าข้อความถูกยกเลิก แต่ระบบจะเก็บเวลาและผู้ยกเลิกไว้') : window.confirm('ยกเลิกข้อความนี้หรือไม่?'); if (!confirmed) return; await db.doc(`teamGroups/${state.group.id}/messages/${revoke.dataset.revokeId}`).update({ revokedAt: timestamp(), revokedBy: state.user.uid, updatedAt: timestamp() }); return; }
    const read = event.target.closest('[data-read-id]'); if (read) { const value = read.dataset.readValue === 'true'; await db.doc(`teamGroups/${state.group.id}/messages/${read.dataset.readId}`).update({ [`readBy.${state.user.uid}`]: value, [`unreadBy.${state.user.uid}`]: !value, updatedAt: timestamp() }); return; }
    const pin = event.target.closest('[data-pin-id]'); if (pin) { const msg = state.messages.find((m) => m.id === pin.dataset.pinId); if (msg) await db.doc(`teamGroups/${state.group.id}/messages/${msg.id}`).update({ pinned: !msg.pinned }); return; }
    const del = event.target.closest('[data-delete-id]'); if (del) { const confirmed = window.bcxConfirm ? await window.bcxConfirm('ลบข้อความ', 'ต้องการลบข้อความนี้หรือไม่?') : window.confirm('ต้องการลบข้อความนี้หรือไม่?'); if (!confirmed) return; await db.doc(`teamGroups/${state.group.id}/messages/${del.dataset.deleteId}`).delete(); return; }
    const copy = event.target.closest('[data-copy-url]'); if (copy) { await navigator.clipboard?.writeText(copy.dataset.copyUrl); flash('คัดลอกลิงก์แล้ว', '', 'info'); return; }
    const remove = event.target.closest('[data-remove-uid]'); if (remove) { const confirmed = window.bcxConfirm ? await window.bcxConfirm('นำสมาชิกออก', 'ต้องการนำสมาชิกคนนี้ออกจากกลุ่มหรือไม่?') : window.confirm('ต้องการนำสมาชิกคนนี้ออกจากกลุ่มหรือไม่?'); if (!confirmed) return; const uid = remove.dataset.removeUid; await db.doc(`teamGroups/${state.group.id}/members/${uid}`).delete(); const next = (state.group.memberUids || []).filter((id) => id !== uid); await db.doc(`teamGroups/${state.group.id}`).update({ memberUids: next, updatedAt: timestamp() }); state.group.memberUids = next; loadMembers(); renderGroups(); return; }
    const role = event.target.closest('[data-role-uid]'); if (role) { await db.doc(`teamGroups/${state.group.id}/members/${role.dataset.roleUid}`).update({ role: role.value, updatedAt: timestamp() }); loadMembers(); return; }
    const response = event.target.closest('[data-meeting-response]'); if (response) { await db.doc(`teamGroups/${state.group.id}/meetings/${response.dataset.meetingId}`).update({ [`responses.${state.user.uid}`]: response.dataset.meetingResponse }); loadMeetings(); return; }
    const deleteDoc = event.target.closest('[data-delete-doc]'); if (deleteDoc) { const confirmed = window.bcxConfirm ? await window.bcxConfirm('ลบเอกสาร', 'ต้องการลบรายการเอกสารนี้หรือไม่?') : window.confirm('ต้องการลบรายการเอกสารนี้หรือไม่?'); if (!confirmed) return; await db.doc(`teamGroups/${state.group.id}/documents/${deleteDoc.dataset.deleteDoc}`).delete(); loadDocuments(); return; }
    const deleteMeeting = event.target.closest('[data-delete-meeting]'); if (deleteMeeting) { const confirmed = window.bcxConfirm ? await window.bcxConfirm('ลบนัดหมาย', 'ต้องการลบนัดหมายนี้หรือไม่?') : window.confirm('ต้องการลบนัดหมายนี้หรือไม่?'); if (!confirmed) return; await db.doc(`teamGroups/${state.group.id}/meetings/${deleteMeeting.dataset.deleteMeeting}`).delete(); loadMeetings(); }
  });
  $('twGroupSearch').addEventListener('input', renderGroups); $('twMessageSearch').addEventListener('input', renderMessages); $('twMessageForm').addEventListener('submit', sendMessage); $('twCancelReply').addEventListener('click', cancelReply); $('twClearAttachments').addEventListener('click', clearSelectedMessageFiles); $('twAttachment').addEventListener('change', (event) => { try { selectMessageFiles(event.target.files); } catch (error) { event.target.value = ''; flash(error.message, 'error'); } }); $('twMarkAllRead').addEventListener('click', () => markAllMessagesRead().catch((e) => flash(friendlyErrorMessage(e), 'error'))); $('twShowUnread').addEventListener('click', () => { state.messageFilter = state.messageFilter === 'unread' ? 'all' : 'unread'; $('twShowUnread').classList.toggle('is-active', state.messageFilter === 'unread'); $('twShowUnread').textContent = state.messageFilter === 'unread' ? 'แสดงทั้งหมด' : 'เฉพาะยังไม่อ่าน'; renderMessages(); }); $('twModalForm').addEventListener('submit', handleModalSubmit); $('twModal').addEventListener('close', cleanupWebMeeting); $('twCreateGroup').addEventListener('click', showCreateModal); $('twEditGroup').addEventListener('click', showGroupModal); $('twAddDocument').addEventListener('click', showDocumentModal); $('twAddMeeting').addEventListener('click', showMeetingModal); $('twCopyGroupLink').addEventListener('click', () => copyGroupLink().catch((e) => flash(friendlyErrorMessage(e), 'error'))); $('twCopyInvite').addEventListener('click', () => copyInvite().catch((e) => flash(friendlyErrorMessage(e), 'error'))); $('twJoinInvite').addEventListener('click', () => { const id = new URLSearchParams(location.search).get('invite'); if (id) joinInvite(id).catch((e) => flash(friendlyErrorMessage(e), 'error')); }); $('twNotifyPermission').addEventListener('click', async () => { if (!('Notification' in window)) return flash('เบราว์เซอร์นี้ไม่รองรับการแจ้งเตือน', 'error'); const result = await Notification.requestPermission(); flash(result === 'granted' ? 'เปิดการแจ้งเตือนบนอุปกรณ์นี้แล้ว' : 'ยังไม่ได้อนุญาตการแจ้งเตือน', result === 'granted' ? 'info' : 'error'); }); document.addEventListener('change', (event) => { if (event.target.id === 'twModalMeetingProvider') syncMeetingProviderFields(); });

  const inviteId = new URLSearchParams(location.search).get('invite');
  if (inviteId) loadInvitePreview(inviteId);
  auth.onAuthStateChanged(async (user) => { stopListeners(); cleanupWebMeeting(); state.user = user; state.group = null; state.meetings = []; state.messageFilter = 'all'; if (!user) { setAuthState('กรุณาเข้าสู่ระบบก่อนใช้พื้นที่ทำงานทีม', 'error'); $('twCreateGroup').hidden = true; return; } state.admin = Boolean(user.emailVerified && adminEmails.has((user.email || '').toLowerCase())); try { const token = await user.getIdTokenResult(); state.admin = state.admin || token.claims.admin === true; } catch {} $('twCreateGroup').hidden = !state.admin; setAuthState(`เข้าสู่ระบบแล้ว: ${displayName(user)}`, 'info'); try { await loadGroups(); if (state.group) updatePresence(true); } catch (error) { flash(`โหลดกลุ่มไม่สำเร็จ: ${friendlyErrorMessage(error)}`, 'error'); } });
  window.addEventListener('beforeunload', () => { cleanupWebMeeting(); updatePresence(false); });
}());
