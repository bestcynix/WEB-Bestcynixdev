/* Private recruitment interview room client.
 * The applicant can only see rooms whose applicantUid matches Firebase Auth.
 * Admins create/update the schedule from admin-join-team.
 */
(function () {
  'use strict';
  const parts = window.location.pathname.split('/').filter(Boolean);
  const slug = new URLSearchParams(window.location.search).get('project')
    || (parts[0] === 'join-team' ? parts[1] : '') || '';
  if (!slug || typeof firebase === 'undefined' || !firebase.auth || !firebase.firestore) return;

  const $ = (id) => document.getElementById(id);
  const panel = $('jtInterviewPanel');
  if (!panel) return;
  const db = firebase.firestore();
  let activeRoom = null;
  let unsubscribeMessages = null;

  const escapeHtml = (value) => String(value ?? '').replace(/[&<>"']/g, (char) => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#039;'
  }[char]));
  const dateText = (value) => {
    if (!value) return '';
    const date = value.toDate ? value.toDate() : new Date(value);
    return Number.isNaN(date.getTime()) ? '' : date.toLocaleString('th-TH', { dateStyle: 'medium', timeStyle: 'short' });
  };
  const setNotice = (message, isError) => {
    const el = $('jtInterviewNotice');
    if (el) {
      el.textContent = message;
      el.style.color = isError ? '#fecaca' : '';
      el.style.borderColor = isError ? 'rgba(248,113,113,.35)' : '';
    }
  };

  const renderMessages = (snap, user) => {
    const wrap = $('jtInterviewMessages');
    if (!wrap) return;
    if (snap.empty) {
      wrap.innerHTML = '<div class="jt-interview-message"><small>ห้องสัมภาษณ์</small>ยังไม่มีข้อความจากทีมงาน</div>';
      return;
    }
    wrap.innerHTML = snap.docs.map((doc) => {
      const m = doc.data() || {};
      const mine = m.senderUid === user.uid;
      return `<div class="jt-interview-message${mine ? ' is-mine' : ''}"><small>${escapeHtml(m.senderName || (mine ? 'คุณ' : 'Dev'))} · ${escapeHtml(dateText(m.createdAt))}</small>${escapeHtml(m.text || '')}</div>`;
    }).join('');
    wrap.scrollTop = wrap.scrollHeight;
  };

  const watchMessages = (roomId, user) => {
    if (unsubscribeMessages) unsubscribeMessages();
    unsubscribeMessages = db.collection('joinTeamInterviewRooms').doc(roomId).collection('messages')
      .orderBy('createdAt', 'asc').limit(100)
      .onSnapshot((snap) => renderMessages(snap, user), (err) => {
        console.warn('Interview room messages load error:', err);
        setNotice('โหลดข้อความไม่สำเร็จ กรุณาลองใหม่อีกครั้ง', true);
      });
  };

  const renderRoom = (room, user) => {
    activeRoom = room;
    panel.style.display = '';
    const statusMap = { open: 'เปิดห้องสัมภาษณ์', scheduled: 'นัดหมายแล้ว', closed: 'ปิดห้อง', cancelled: 'ยกเลิกนัดหมาย' };
    const lines = [
      `สถานะ: ${statusMap[room.status] || room.status || 'รอทีมงานแจ้งนัดหมาย'}`,
      room.interviewAt ? `🗓️ สัมภาษณ์: ${dateText(room.interviewAt)}` : '',
      room.trialAt ? `🧪 ทดลองงานเริ่ม: ${dateText(room.trialAt)}` : '',
      room.trialEndAt ? `🏁 สิ้นสุดทดลองงาน: ${dateText(room.trialEndAt)}` : '',
      room.notice || ''
    ].filter(Boolean).join('\n');
    setNotice(lines || 'ทีมงานยังไม่ได้แจ้งกำหนดการ');
    const link = $('jtInterviewRoomLink');
    if (link) {
      link.href = `${window.location.pathname}#jtInterviewPanel`;
      link.textContent = 'เลื่อนไปห้องแชท ↓';
      link.onclick = () => setTimeout(() => $('jtInterviewMessageInput')?.focus(), 50);
    }
    watchMessages(room.id, user);
  };

  const loadRoom = async (user) => {
    try {
      const appSnap = await db.collection('joinTeamApplications').where('applicantUid', '==', user.uid).limit(100).get();
      const appIds = new Set(appSnap.docs.filter((doc) => (doc.data() || {}).projectSlug === slug).map((doc) => doc.id));
      if (!appIds.size) {
        panel.style.display = 'none';
        return;
      }
      const roomSnap = await db.collection('joinTeamInterviewRooms').where('applicantUid', '==', user.uid).limit(100).get();
      const rooms = roomSnap.docs.map((doc) => ({ id: doc.id, ...doc.data() }))
        .filter((room) => room.projectSlug === slug && appIds.has(room.applicationId))
        .sort((a, b) => (b.updatedAt?.toMillis?.() || 0) - (a.updatedAt?.toMillis?.() || 0));
      if (rooms[0]) renderRoom(rooms[0], user);
      else panel.style.display = 'none';
    } catch (err) {
      console.warn('Interview room load error:', err);
      panel.style.display = '';
      setNotice('ยังไม่มีห้องสัมภาษณ์ หรือระบบยังไม่พร้อมสำหรับบัญชีนี้', false);
    }
  };

  $('jtInterviewMessageForm')?.addEventListener('submit', async (event) => {
    event.preventDefault();
    const user = firebase.auth().currentUser;
    const input = $('jtInterviewMessageInput');
    const text = (input?.value || '').trim();
    if (!user || !activeRoom || !text) return;
    input.disabled = true;
    try {
      await db.collection('joinTeamInterviewRooms').doc(activeRoom.id).collection('messages').add({
        senderUid: user.uid,
        senderName: user.displayName || user.email || 'ผู้สมัคร',
        text,
        createdAt: firebase.firestore.FieldValue.serverTimestamp()
      });
      await db.collection('joinTeamInterviewRooms').doc(activeRoom.id).update({ lastMessageAt: firebase.firestore.FieldValue.serverTimestamp(), updatedAt: firebase.firestore.FieldValue.serverTimestamp() });
      input.value = '';
    } catch (err) {
      setNotice('ส่งข้อความไม่สำเร็จ กรุณาลองใหม่', true);
    } finally {
      input.disabled = false;
      input.focus();
    }
  });

  firebase.auth().onAuthStateChanged((user) => {
    if (user) loadRoom(user);
    else panel.style.display = 'none';
  });
})();
