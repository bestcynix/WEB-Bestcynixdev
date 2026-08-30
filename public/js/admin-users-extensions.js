(function () {
  'use strict';

  let editingCompanyId = null;
  let editingSignatureId = null;
  const $ = (id) => document.getElementById(id);
  const notify = (title, message = '', type = 'info') => window.showCyberToast ? window.showCyberToast(title, message, type) : window.alert(`${title}\n${message}`);
  const confirmAction = (title, message) => window.bcxConfirm ? window.bcxConfirm(title, message) : Promise.resolve(window.confirm(`${title}\n${message}`));
  const esc = (value) => typeof escapeHTML === 'function' ? escapeHTML(value) : String(value ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const stamp = () => firebase.firestore.FieldValue.serverTimestamp();
  const isValidExternalUrl = (value) => {
    if (!value) return true;
    try { const url = new URL(value); return ['http:', 'https:'].includes(url.protocol); } catch (_) { return false; }
  };

  function syncFilters() {
    const company = $('filterCompany');
    const role = $('filterTeamRole');
    if (!company || !role) return;
    const oldCompany = company.value;
    const oldRole = role.value;
    const companies = [...new Map((allUsers || []).map((u) => {
      const id = u.companyId || u.companyName;
      return id ? [id, u.companyName || id] : null;
    }).filter(Boolean)).entries()];
    const roles = [...new Set((allUsers || []).map((u) => u.teamRole).filter(Boolean))].sort();
    company.innerHTML = '<option value="">ทุกบริษัท/กลุ่ม</option>' + companies.map(([id, name]) => `<option value="${esc(id)}">${esc(name)}</option>`).join('');
    role.innerHTML = '<option value="">ทุกยศ/ตำแหน่ง</option>' + roles.map((item) => `<option value="${esc(item)}">${esc(item)}</option>`).join('');
    company.value = oldCompany;
    role.value = oldRole;
  }

  async function loadUserContracts(user) {
    const box = $('editContracts');
    if (!box || !user) return;
    try {
      const results = new Map();
      for (const field of ['applicantUid', 'userId']) {
        const snap = await db.collection('joinTeamApplications').where(field, '==', user.uid).limit(100).get();
        snap.forEach((doc) => results.set(doc.id, { id: doc.id, ...doc.data() }));
      }
      const contracts = [...results.values()];
      box.innerHTML = contracts.length ? '<strong>📄 สัญญา/ใบสมัครของสมาชิก</strong>' + contracts.map((item) => {
        const ref = esc(item.contractRefNo || item.id);
        const status = esc(item.status || 'ไม่ระบุ');
        return `<div style="margin-top:.45rem;display:flex;justify-content:space-between;gap:.6rem;flex-wrap:wrap;"><span>${esc(item.positionName || 'ตำแหน่งไม่ระบุ')} • ${status} • ${ref}</span><a href="contract?id=${encodeURIComponent(item.id)}" target="_blank" rel="noopener">เปิดเอกสาร</a></div>`;
      }).join('') : '<span style="color:var(--muted);">ยังไม่พบใบสมัครหรือสัญญาที่ผูกกับ UID นี้</span>';
    } catch (error) {
      box.textContent = `โหลดสัญญาไม่สำเร็จ: ${error.message}`;
    }
  }
  window.loadUserContracts = loadUserContracts;

  function renderCompanyList(snapshot) {
    const list = $('companyList');
    if (!list) return;
    const rows = [];
    snapshot.forEach((doc) => {
      const data = doc.data();
      rows.push(`<div class="admin-tool-item"><div><strong>${esc(data.displayName || data.name || doc.id)}</strong><small>${esc(doc.id)} • ${data.active ? 'เปิดใช้งาน' : 'ปิดใช้งาน'}${data.sealUrl ? ' • มีตรา' : ''}</small></div><div class="action-btn-row"><button class="btn-action-sm" data-edit-company="${esc(doc.id)}">แก้ไข</button><button class="btn-action-sm" data-delete-company="${esc(doc.id)}">ลบ</button></div></div>`);
    });
    list.innerHTML = rows.join('') || '<small style="color:var(--muted);">ยังไม่มีบริษัท/กลุ่มที่ตั้งค่า</small>';
    list.querySelectorAll('[data-edit-company]').forEach((button) => button.addEventListener('click', async () => {
      const doc = await db.collection('adminCompanyProfiles').doc(button.dataset.editCompany).get();
      if (!doc.exists) return;
      const data = doc.data(); editingCompanyId = doc.id;
      $('companyIdInput').value = doc.id; $('companyNameInput').value = data.name || data.displayName || '';
      $('companyLogoInput').value = data.logoUrl || ''; $('companySealInput').value = data.sealUrl || '';
      $('companyDefaultSignatureInput').value = data.defaultSignatureId || ''; $('companyActiveInput').checked = data.active !== false;
    }));
    list.querySelectorAll('[data-delete-company]').forEach((button) => button.addEventListener('click', async () => {
      if (!await confirmAction('ลบบริษัท/กลุ่ม', 'ลบเฉพาะรายการตั้งค่าและตรา ไม่ลบผู้ใช้หรือสัญญาใช่หรือไม่?')) return;
      await db.collection('adminCompanyProfiles').doc(button.dataset.deleteCompany).delete();
      notify('ลบบริษัท/กลุ่มแล้ว', '', 'success');
    }));
  }

  function renderSignatureList(snapshot) {
    const list = $('signatureList');
    if (!list) return;
    const rows = [];
    snapshot.forEach((doc) => {
      const data = doc.data();
      rows.push(`<div class="admin-tool-item"><div><strong>${esc(data.name || doc.id)}${data.isDefault ? ' ⭐' : ''}</strong><small>${esc(data.signerName || '')} • ${esc(data.signerTitle || '')} • ${esc(data.companyName || '')}</small></div><div class="action-btn-row"><button class="btn-action-sm" data-edit-signature="${esc(doc.id)}">แก้ไข</button><button class="btn-action-sm" data-delete-signature="${esc(doc.id)}">ลบ</button></div></div>`);
    });
    list.innerHTML = rows.join('') || '<small style="color:var(--muted);">ยังไม่มีลายเซ็นกลาง</small>';
    list.querySelectorAll('[data-edit-signature]').forEach((button) => button.addEventListener('click', async () => {
      const doc = await db.collection('devSignatures').doc(button.dataset.editSignature).get();
      if (!doc.exists) return;
      const data = doc.data(); editingSignatureId = doc.id;
      $('signatureNameInput').value = data.name || ''; $('signatureSignerInput').value = data.signerName || '';
      $('signatureTitleInput').value = data.signerTitle || ''; $('signatureCompanyInput').value = data.companyName || '';
      $('signatureImageInput').value = data.imageUrl || ''; $('signatureDefaultInput').checked = data.isDefault === true;
    }));
    list.querySelectorAll('[data-delete-signature]').forEach((button) => button.addEventListener('click', async () => {
      if (!await confirmAction('ลบลายเซ็น Dev', 'ลบรายการลายเซ็นกลางนี้หรือไม่?')) return;
      await db.collection('devSignatures').doc(button.dataset.deleteSignature).delete();
      notify('ลบลายเซ็นแล้ว', '', 'success');
    }));
  }

  function setup() {
    ['filterCompany', 'filterTeamRole', 'filterEmploymentStatus'].forEach((id) => $(id)?.addEventListener('change', () => {
      if (typeof renderUsersTable === 'function') renderUsersTable();
    }));
    const originalRender = window.renderUsersTable;
    if (originalRender) window.renderUsersTable = (...args) => { syncFilters(); return originalRender(...args); };

    db.collection('adminCompanyProfiles').onSnapshot(renderCompanyList, (error) => notify('โหลดบริษัท/กลุ่มไม่สำเร็จ', error.message, 'error'));
    db.collection('devSignatures').onSnapshot(renderSignatureList, (error) => notify('โหลดลายเซ็นไม่สำเร็จ', error.message, 'error'));
    setInterval(syncFilters, 1200);

    $('btnClearCompany')?.addEventListener('click', () => { editingCompanyId = null; ['companyIdInput','companyNameInput','companyLogoInput','companySealInput','companyDefaultSignatureInput'].forEach((id) => $(id).value = ''); $('companyActiveInput').checked = true; });
    $('btnSaveCompany')?.addEventListener('click', async () => {
      const id = ($('companyIdInput').value.trim() || editingCompanyId || '').toLowerCase();
      const name = $('companyNameInput').value.trim();
      const logoUrl = $('companyLogoInput').value.trim() || null; const sealUrl = $('companySealInput').value.trim() || null;
      if (!id || !name) return notify('กรุณากรอกรหัสและชื่อบริษัท/กลุ่ม', '', 'warning');
      if (!isValidExternalUrl(logoUrl) || !isValidExternalUrl(sealUrl)) return notify('URL โลโก้/ตราไม่ถูกต้อง', 'ต้องเป็น http หรือ https', 'warning');
      await db.collection('adminCompanyProfiles').doc(id).set({ id, name, displayName: name, logoUrl, sealUrl, active: $('companyActiveInput').checked, defaultSignatureId: $('companyDefaultSignatureInput').value.trim() || null, updatedAt: stamp(), updatedBy: currentUserObj?.uid || '' , ...(editingCompanyId ? {} : { createdAt: stamp() }) }, { merge: true });
      editingCompanyId = null; $('btnClearCompany').click(); notify('บันทึกบริษัท/ตราแล้ว', '', 'success');
    });

    $('btnClearSignature')?.addEventListener('click', () => { editingSignatureId = null; $('signatureNameInput').value = ''; $('signatureSignerInput').value = 'นายพงศ์ภรณ์ ทองศิริ'; $('signatureTitleInput').value = 'CEO / Owner'; $('signatureCompanyInput').value = ''; $('signatureImageInput').value = ''; $('signatureDefaultInput').checked = false; });
    $('btnSaveSignature')?.addEventListener('click', async () => {
      const name = $('signatureNameInput').value.trim(); const signerName = $('signatureSignerInput').value.trim(); const signerTitle = $('signatureTitleInput').value.trim(); const companyName = $('signatureCompanyInput').value.trim(); const imageUrl = $('signatureImageInput').value.trim() || null; const isDefault = $('signatureDefaultInput').checked;
      if (!name || !signerName || !signerTitle || !companyName) return notify('กรุณากรอกข้อมูลลายเซ็นให้ครบ', '', 'warning');
      if (!isValidExternalUrl(imageUrl)) return notify('URL รูปลายเซ็นไม่ถูกต้อง', 'ต้องเป็น http หรือ https', 'warning');
      if (isDefault) { const existing = await db.collection('devSignatures').get(); const batch = db.batch(); existing.forEach((doc) => batch.update(doc.ref, { isDefault: false, updatedAt: stamp(), updatedBy: currentUserObj?.uid || '' })); await batch.commit(); }
      const ref = editingSignatureId ? db.collection('devSignatures').doc(editingSignatureId) : db.collection('devSignatures').doc();
      await ref.set({ name, signerName, signerTitle, companyName, imageUrl, active: true, isDefault, updatedAt: stamp(), updatedBy: currentUserObj?.uid || '', ...(editingSignatureId ? {} : { createdAt: stamp() }) }, { merge: true });
      editingSignatureId = null; $('btnClearSignature').click(); notify('บันทึกลายเซ็น Dev แล้ว', '', 'success');
    });

    $('btnViewUserContracts')?.addEventListener('click', () => currentEditingUser && loadUserContracts(currentEditingUser));
    $('btnExitUser')?.addEventListener('click', async () => {
      if (!editingUserUid || !currentEditingUser) return;
      const status = $('editEmploymentStatus').value; const reason = $('editEmploymentNote').value.trim() || 'เปลี่ยนสถานะโดยผู้ดูแล';
      if (!await confirmAction('ยืนยันเปลี่ยนสถานะสมาชิก', `บันทึกสถานะ “${status}” และส่งประกาศแจ้งสมาชิกคนนี้หรือไม่?`)) return;
      const title = status === 'active' ? 'แจ้งสถานะกลับเข้าทีม' : 'ประกาศแจ้งการเปลี่ยนสถานะทีมงาน';
      const message = `สถานะของคุณใน ${$('editCompanyName').value.trim() || 'ทีมงาน'} เปลี่ยนเป็น ${status}: ${reason}`;
      await db.collection('users').doc(editingUserUid).set({ employmentStatus: status, employmentNote: reason, employmentChangedAt: stamp(), employmentChangedBy: currentUserObj?.uid || '' }, { merge: true });
      await db.collection('employmentRecords').doc(`employment-${editingUserUid}-${Date.now()}`).set({ userUid: editingUserUid, companyId: $('editCompanyId').value.trim() || '', companyName: $('editCompanyName').value.trim() || '', teamRole: $('editTeamRole').value.trim() || '', status, reason, noticeTitle: title, noticeMessage: message, createdAt: stamp(), updatedAt: stamp(), createdBy: currentUserObj?.uid || '' });
      await db.collection('adminAnnouncements').add({ targetUid: editingUserUid, title, message, type: 'employment', url: '/profile', createdAt: stamp(), createdBy: currentUserObj?.uid || '' });
      await db.collection('users').doc(editingUserUid).collection('notifications').add({ title, message, type: 'employment', url: '/profile', createdAt: stamp(), read: false });
      notify('เปลี่ยนสถานะและออกประกาศแล้ว', '', 'success');
    });
    $('btnDeleteUserProfile')?.addEventListener('click', async () => {
      if (editingUserUid && currentUserObj?.uid === editingUserUid) return notify('ป้องกันการลบตัวเอง', 'ใช้การเปลี่ยนสถานะหรือให้ Dev อีกบัญชีดำเนินการแทน', 'warning');
      if (!editingUserUid || !await confirmAction('ลบโปรไฟล์ Firestore', 'ลบเฉพาะเอกสารโปรไฟล์ Firestore นี้ บัญชี Firebase Auth และสัญญาจะไม่ถูกลบ ใช่หรือไม่?')) return;
      await db.collection('users').doc(editingUserUid).delete();
      notify('ลบโปรไฟล์ Firestore แล้ว', 'บัญชีล็อกอินและสัญญายังคงอยู่', 'success');
      if (typeof closeEditModal === 'function') closeEditModal();
    });
    syncFilters();
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', setup); else setup();
})();
