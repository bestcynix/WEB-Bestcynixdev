/* Admin side of the private interview/trial room. */
(function () {
  'use strict';
  if (typeof firebase === 'undefined' || !firebase.auth || !firebase.firestore) return;
  const $ = (id) => document.getElementById(id);
  const db = firebase.firestore();
  let activeRoom = null;
  let unsubscribeMessages = null;
  let lastLoadedApplicationId = null;

  const escapeHtml = (value) => String(value ?? '').replace(/[&<>"']/g, (char) => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#039;'
  }[char]));
  const dateText = (value) => {
    if (!value) return '';
    const date = value.toDate ? value.toDate() : new Date(value);
    return Number.isNaN(date.getTime()) ? '' : date.toLocaleString('th-TH', { dateStyle: 'medium', timeStyle: 'short' });
  };
  const toTimestamp = (value) => value ? firebase.firestore.Timestamp.fromDate(new Date(value)) : null;
  const toInputValue = (value) => {
    if (!value) return '';
    const date = value.toDate ? value.toDate() : new Date(value);
    if (Number.isNaN(date.getTime())) return '';
    const pad = (n) => String(n).padStart(2, '0');
    return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
  };
  const flash = (message, type) => {
    const wrap = $('adminToastWrap');
    if (!wrap) return;
    const item = document.createElement('div');
    item.className = `jt-toast ${type === 'error' ? 'error' : 'success'}`;
    item.textContent = message;
    wrap.appendChild(item);
    setTimeout(() => item.remove(), 3600);
  };
  const getCurrentAppId = () => window._currentJoinApplicationId || $('appDetailModal')?.dataset.applicationId || null;
  const setRoomState = (text, error) => {
    const el = $('modalInterviewRoomState');
    if (el) { el.textContent = text; el.style.color = error ? '#fca5a5' : ''; }
  };

  const renderMessages = (snap) => {
    const wrap = $('modalInterviewMessages');
    if (!wrap) return;
    if (snap.empty) { wrap.innerHTML = '<div class="jt-interview-admin-message"><small>ห้องสัมภาษณ์</small>ยังไม่มีข้อความ</div>'; return; }
    wrap.innerHTML = snap.docs.map((doc) => {
      const m = doc.data() || {};
      return `<div class="jt-interview-admin-message"><small>${escapeHtml(m.senderName || 'ผู้ส่ง')} · ${escapeHtml(dateText(m.createdAt))}</small>${escapeHtml(m.text || '')}</div>`;
    }).join('');
    wrap.scrollTop = wrap.scrollHeight;
  };
  const watchMessages = (roomId) => {
    if (unsubscribeMessages) unsubscribeMessages();
    unsubscribeMessages = db.collection('joinTeamInterviewRooms').doc(roomId).collection('messages')
      .orderBy('createdAt', 'asc').limit(100).onSnapshot(renderMessages, () => setRoomState('ห้องเปิด แต่โหลดข้อความไม่สำเร็จ', true));
  };
  const clearRoomForm = () => {
    activeRoom = null;
    setRoomState('ยังไม่มีห้อง');
    ['modalInterviewAt', 'modalTrialAt', 'modalTrialEndAt', 'modalInterviewNotice'].forEach((id) => { if ($(id)) $(id).value = ''; });
    if ($('modalInterviewStatus')) $('modalInterviewStatus').value = 'open';
    if ($('btnCopyInterviewRoom')) $('btnCopyInterviewRoom').style.display = 'none';
    if ($('modalInterviewMessages')) $('modalInterviewMessages').innerHTML = '';
  };
  const loadRoom = async (appId) => {
    if (!appId || appId === lastLoadedApplicationId) return;
    lastLoadedApplicationId = appId;
    clearRoomForm();
    try {
      const snap = await db.collection('joinTeamInterviewRooms').where('applicationId', '==', appId).limit(1).get();
      if (snap.empty) return;
      const doc = snap.docs[0];
      activeRoom = { id: doc.id, ...doc.data() };
      $('modalInterviewStatus').value = activeRoom.status || 'open';
      $('modalInterviewAt').value = toInputValue(activeRoom.interviewAt);
      $('modalTrialAt').value = toInputValue(activeRoom.trialAt);
      $('modalTrialEndAt').value = toInputValue(activeRoom.trialEndAt);
      $('modalInterviewNotice').value = activeRoom.notice || '';
      setRoomState(`เปิดห้องแล้ว · ${activeRoom.status || 'open'}`);
      $('btnCopyInterviewRoom').style.display = 'inline-flex';
      watchMessages(activeRoom.id);
    } catch (err) { setRoomState('โหลดห้องไม่สำเร็จ', true); }
  };

  $('btnSaveInterviewRoom')?.addEventListener('click', async () => {
    const appId = getCurrentAppId();
    if (!appId) return flash('กรุณาเปิดรายละเอียดใบสมัครก่อน', 'error');
    const user = firebase.auth().currentUser;
    if (!user) return flash('เซสชัน Admin หมดอายุ กรุณาเข้าสู่ระบบใหม่', 'error');
    const appRef = db.collection('joinTeamApplications').doc(appId);
    try {
      const appSnap = await appRef.get();
      const app = appSnap.data() || {};
      const applicantUid = app.applicantUid || app.userId || app.applicant?.uid;
      if (!applicantUid) return flash('ใบสมัครนี้ไม่มี UID ผู้ใช้ จึงสร้างห้องส่วนตัวไม่ได้', 'error');
      const roomId = activeRoom?.id || `app-${appId}`;
      const status = $('modalInterviewStatus').value || 'open';
      const room = {
        id: roomId,
        applicationId: appId,
        applicantUid,
        projectSlug: app.projectSlug || app.formId || 'default',
        projectName: app.projectName || app.communityName || app.projectSlug || 'ทีมงาน',
        title: `ห้องสัมภาษณ์ ${app.applicant?.nickname || appId}`,
        status,
        interviewAt: toTimestamp($('modalInterviewAt').value),
        trialAt: toTimestamp($('modalTrialAt').value),
        trialEndAt: toTimestamp($('modalTrialEndAt').value),
        notice: ($('modalInterviewNotice').value || '').trim(),
        createdBy: activeRoom?.createdBy || user.uid,
        createdAt: activeRoom?.createdAt || firebase.firestore.FieldValue.serverTimestamp(),
        updatedAt: firebase.firestore.FieldValue.serverTimestamp(),
        lastMessageAt: activeRoom?.lastMessageAt || null
      };
      await db.collection('joinTeamInterviewRooms').doc(roomId).set(room, { merge: true });
      await appRef.update({ interviewRoomId: roomId, status: status === 'scheduled' ? 'interview' : (status === 'closed' || status === 'cancelled' ? 'reviewing' : (app.status === 'submitted' ? 'interview' : app.status)), interviewUpdatedAt: firebase.firestore.FieldValue.serverTimestamp() });
      await db.collection('users').doc(applicantUid).collection('notifications').add({
        title: status === 'trial' ? '🧪 แจ้งกำหนดการทดลองงาน' : '🗣️ แจ้งห้องสัมภาษณ์',
        message: room.notice || 'ทีมงานมีประกาศใหม่ในห้องสัมภาษณ์ส่วนตัวของคุณ',
        type: 'interview_update', url: `/join-team/${room.projectSlug}#jtInterviewPanel`, applicationId: appId, positionName: app.positionName || '', createdAt: firebase.firestore.FieldValue.serverTimestamp(), read: false
      });
      activeRoom = { ...room, id: roomId };
      lastLoadedApplicationId = appId;
      setRoomState(`บันทึกแล้ว · ${status}`);
      $('btnCopyInterviewRoom').style.display = 'inline-flex';
      watchMessages(roomId);
      flash('บันทึกห้องสัมภาษณ์และส่งแจ้งเตือนแล้ว ✅', 'success');
    } catch (err) {
      console.error('Interview room save error:', err);
      flash(`บันทึกห้องไม่สำเร็จ: ${err.message}`, 'error');
    }
  });

  $('btnCopyInterviewRoom')?.addEventListener('click', async () => {
    if (!activeRoom) return;
    const url = `${window.location.origin}/join-team/${encodeURIComponent(activeRoom.projectSlug || '')}#jtInterviewPanel`;
    try { await navigator.clipboard.writeText(url); flash('คัดลอกลิงก์ห้องแล้ว 📋', 'success'); } catch (_) { flash(url, 'error'); }
  });
  $('modalInterviewMessageForm')?.addEventListener('submit', async (event) => {
    event.preventDefault();
    const user = firebase.auth().currentUser;
    const input = $('modalInterviewMessageInput');
    const text = (input?.value || '').trim();
    if (!user || !activeRoom || !text) return;
    input.disabled = true;
    try {
      await db.collection('joinTeamInterviewRooms').doc(activeRoom.id).collection('messages').add({ senderUid: user.uid, senderName: user.displayName || user.email || 'Dev', text, createdAt: firebase.firestore.FieldValue.serverTimestamp() });
      await db.collection('joinTeamInterviewRooms').doc(activeRoom.id).update({ lastMessageAt: firebase.firestore.FieldValue.serverTimestamp(), updatedAt: firebase.firestore.FieldValue.serverTimestamp() });
      input.value = '';
    } catch (err) { flash('ส่งข้อความไม่สำเร็จ', 'error'); }
    input.disabled = false;
    input.focus();
  });

  const modal = $('appDetailModal');
  if (modal) {
    const observer = new MutationObserver(() => { if (modal.dataset.applicationId !== lastLoadedApplicationId) loadRoom(modal.dataset.applicationId); });
    observer.observe(modal, { attributes: true, attributeFilter: ['data-application-id', 'class'] });
  }
})();
