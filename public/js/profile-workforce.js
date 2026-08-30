/*
 * Profile Workforce Workspace
 * Private employment history, attendance, payroll and finance controls.
 * Sensitive workforce reads/writes go through the Supabase private-workforce API.
 * Firebase Auth remains the login provider; no Supabase service key is shipped to
 * this browser. Firestore is kept only for the non-workforce profile bootstrap
 * and legacy records while migration is being verified.
 */
(function () {
  'use strict';

  if (typeof firebase === 'undefined' || !firebase.auth || !firebase.firestore) return;

  var wfAuth = firebase.auth();
  var wfDb = firebase.firestore();
  var wfStorage = firebase.storage ? firebase.storage() : null;
  var wfState = {
    authUser: null,
    targetUid: null,
    profile: {},
    isAdmin: false,
    isSelf: true,
    applications: [],
    employment: [],
    attendance: [],
    payroll: [],
    identityDocs: [],
    finance: [],
    attendanceMonth: '',
    paymentProfileExists: false,
    paymentProfile: null,
    paymentHistory: [],
    paymentRequests: [],
    isWorkforce: false,
    privateSnapshot: null
  };

  var PRIVATE_API_URL = window.BESTCYNIX_PRIVATE_API_URL || 'https://eujnhvfgraunjqgymslr.supabase.co/functions/v1/private-workforce-api';

  var $ = function (id) { return document.getElementById(id); };
  var stamp = function () { return firebase.firestore.FieldValue.serverTimestamp(); };
  var nowTimestamp = function () { return firebase.firestore.Timestamp.now(); };
  var todayKey = function () {
    var d = new Date();
    return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
  };
  var currentMonth = function () { return todayKey().slice(0, 7); };

  async function privateRequest(method, action, data, file) {
    if (!wfState.authUser) throw new Error('ไม่พบเซสชันผู้ใช้');
    var token = await wfState.authUser.getIdToken();
    var url = PRIVATE_API_URL;
    var options = { method: method, headers: { Authorization: 'Bearer ' + token } };
    if (method === 'GET') {
      var params = new URLSearchParams({ uid: wfState.targetUid });
      if (action) params.set('action', action);
      Object.keys(data || {}).forEach(function (key) { if (data[key] != null) params.set(key, String(data[key])); });
      url += '?' + params.toString();
    } else if (file) {
      var form = new FormData();
      form.append('action', action);
      Object.keys(data || {}).forEach(function (key) { if (data[key] != null) form.append(key, String(data[key])); });
      form.append('file', file, file.name);
      options.body = form;
    } else {
      options.headers['Content-Type'] = 'application/json';
      options.body = JSON.stringify(Object.assign({ action: action }, data || {}));
    }
    var response = await fetch(url, options);
    var body = await response.json().catch(function () { return {}; });
    if (!response.ok) throw new Error(body.error || 'private_workforce_api_failed');
    return body;
  }

  async function loadPrivateSnapshot() {
    var data = await privateRequest('GET', '', null);
    wfState.privateSnapshot = data;
    // The API is the source of truth for private-data privileges. Do not let
    // a client-side Firestore profile or allow-list decide what the UI exposes.
    wfState.isAdmin = Boolean(data.isAdmin);
    wfState.applications = data.applications || [];
    wfState.employment = data.employment || [];
    wfState.attendance = data.attendance || [];
    wfState.payroll = data.payroll || [];
    wfState.identityDocs = data.identityDocs || [];
    wfState.finance = data.finance || [];
    wfState.paymentProfile = data.paymentProfile || null;
    wfState.paymentProfileExists = Boolean(data.paymentProfile);
    wfState.paymentHistory = data.paymentHistory || [];
    wfState.paymentRequests = data.paymentRequests || [];
    if (data.member) wfState.profile = Object.assign({}, wfState.profile, data.member);
    return data;
  }

  function esc(value) {
    return String(value == null ? '' : value)
      .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;').replace(/'/g, '&#039;');
  }

  function asDate(value) {
    if (!value) return null;
    if (value.toDate) return value.toDate();
    if (value.seconds) return new Date(value.seconds * 1000);
    var d = new Date(value);
    return isNaN(d.getTime()) ? null : d;
  }

  function formatDate(value, time) {
    var d = asDate(value);
    if (!d) return '—';
    return d.toLocaleString('th-TH', time === false
      ? { year: 'numeric', month: 'short', day: 'numeric' }
      : { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
  }

  function money(value) {
    return Number(value || 0).toLocaleString('th-TH', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  }

  function flash(title, message, type) {
    if (window.showCyberToast) window.showCyberToast(title, message || '', type || 'info');
    else if (window.showToast) window.showToast(title + (message ? ' ' + message : ''), type || 'info');
  }

  function confirmAction(title, message) {
    return window.bcxConfirm ? window.bcxConfirm(title, message) : Promise.resolve(window.confirm(title + '\n' + message));
  }

  function setBusy(button, busy, label) {
    if (!button) return;
    button.disabled = busy;
    if (busy) {
      button.dataset.originalLabel = button.textContent;
      button.textContent = label || 'กำลังบันทึก...';
    } else if (button.dataset.originalLabel) {
      button.textContent = button.dataset.originalLabel;
    }
  }

  function ensureHidden(id) {
    var input = $(id);
    if (!input) {
      input = document.createElement('input');
      input.type = 'hidden';
      input.id = id;
      document.body.appendChild(input);
    }
    return input;
  }

  function setText(id, value) {
    if ($(id)) $(id).textContent = value;
  }

  function statusLabel(status) {
    return {
      submitted: '📩 ส่งใบสมัครแล้ว',
      reviewing: '🔍 กำลังพิจารณา',
      interview: '🗣️ รอสัมภาษณ์',
      trial: '🧪 ทดลองงาน',
      approved: '✅ อนุมัติแล้ว',
      rejected: '❌ ปฏิเสธ',
      cancelled: '⛔ ยกเลิก',
      active: '🟢 อยู่ในทีม',
      suspended: '🟡 พักงาน',
      exited: '🔴 พ้นสภาพ',
      terminated: '⛔ เลิกสัญญา/ไล่ออก'
    }[status] || status || 'ไม่ระบุ';
  }

  function statusClass(status) {
    return ['rejected', 'cancelled', 'exited', 'terminated'].indexOf(status) >= 0
      ? 'danger' : (['submitted', 'reviewing', 'interview', 'trial', 'suspended'].indexOf(status) >= 0 ? 'warn' : '');
  }

  async function loadApplications() {
    await loadPrivateSnapshot();
    wfState.applications.sort(function (a, b) {
      return (asDate(b.createdAt) || 0) - (asDate(a.createdAt) || 0);
    });
  }

  function isEmploymentStatus(status) {
    return ['active', 'suspended', 'exited', 'terminated'].indexOf(status) >= 0;
  }

  function hasSignedTeamContract() {
    return wfState.applications.some(function (app) {
      return Boolean(app.contract && app.contract.signed === true && !app.contract.voided && app.status !== 'cancelled');
    });
  }

  function inferWorkforceMode() {
    // A public/customer profile must not gain workforce access just because it has
    // an ordinary account or a pending application. Contract signing or a trusted
    // Dev-created employment status is the source of truth.
    return hasSignedTeamContract() || isEmploymentStatus(wfState.profile.employmentStatus);
  }

  function applyProfileMode() {
    var workforce = $('profileWorkWorkspace');
    var customer = $('profileCustomerWorkspace');
    if (workforce) workforce.style.display = wfState.isWorkforce ? 'grid' : 'none';
    if (customer) customer.style.display = wfState.isWorkforce ? 'none' : 'grid';
    var badge = $('heroRoleBadge');
    if (badge) {
      var label = wfState.isAdmin && wfState.isSelf ? '⚡ Dev / Admin' : (wfState.isWorkforce ? '🧑‍💻 ทีมงาน' : '👤 ลูกค้า');
      badge.textContent = label;
      badge.className = (wfState.isAdmin && wfState.isSelf) || wfState.isWorkforce ? 'badge-role role-admin' : 'badge-role role-user';
    }
  }

  async function loadEmployment() {
    wfState.employment.sort(function (a, b) {
      return (asDate(b.createdAt) || 0) - (asDate(a.createdAt) || 0);
    });
  }

  async function loadAttendance() {
    wfState.attendance.sort(function (a, b) { return String(b.date || '').localeCompare(String(a.date || '')); });
    renderAttendance();
  }

  async function loadPayroll() {
    wfState.payroll.sort(function (a, b) { return String(b.period || '').localeCompare(String(a.period || '')); });
    renderPayroll();
  }

  async function loadIdentityDocuments() {
    wfState.identityDocs.sort(function (a, b) { return (asDate(b.createdAt) || 0) - (asDate(a.createdAt) || 0); });
    renderIdentityDocuments();
  }

  async function loadFinance() {
    if (!wfState.isAdmin) return;
    wfState.finance.sort(function (a, b) { return (asDate(b.createdAt) || 0) - (asDate(a.createdAt) || 0); });
    renderFinance();
  }

  async function loadPaymentProfile() {
    var data = wfState.paymentProfile || {};
    ['paymentBankName', 'paymentAccountName', 'paymentAccountNumber', 'paymentTaxId'].forEach(function (id) {
      var field = id.replace('payment', '').replace(/^[A-Z]/, function (m) { return m.toLowerCase(); });
      if ($(id)) $(id).value = data[field] || '';
    });
    renderPaymentHistory();
  }

  async function loadPaymentHistory() {
    wfState.paymentHistory.sort(function (a, b) { return (asDate(b.createdAt) || 0) - (asDate(a.createdAt) || 0); });
  }

  async function loadPaymentRequests() {
    wfState.paymentRequests.sort(function (a, b) { return (asDate(b.requestedAt) || 0) - (asDate(a.requestedAt) || 0); });
  }

  function maskedAccount(value) {
    var text = String(value || '');
    if (text.length <= 4) return text ? '••••' : '—';
    return '•••• ' + text.slice(-4);
  }

  function paymentStatusLabel(status) {
    return { active: 'ใช้งานอยู่', archived: 'เก็บเป็นหลักฐาน', pending: 'รออนุมัติ', approved: 'อนุมัติแล้ว', rejected: 'ไม่อนุมัติ' }[status] || status || 'ไม่ระบุ';
  }

  function renderPaymentHistory() {
    var box = $('paymentChangeHistory');
    if (!box) return;
    var current = wfState.paymentProfile ? '<article class="workspace-item"><div class="workspace-item-head"><div><strong>🟢 ข้อมูลที่ใช้โอนปัจจุบัน</strong><p>' + esc(wfState.paymentProfile.bankName || 'ไม่ระบุธนาคาร') + ' · ' + esc(wfState.paymentProfile.accountName || 'ไม่ระบุชื่อบัญชี') + '</p></div><span class="workspace-badge">ใช้งานอยู่</span></div><p>เลขบัญชี: <b>' + esc(maskedAccount(wfState.paymentProfile.accountNumber)) + '</b> · เลขภาษี: <b>' + esc(wfState.paymentProfile.taxId ? 'มีข้อมูล' : 'ไม่มีข้อมูล') + '</b></p><p>แก้ไขล่าสุด: ' + esc(formatDate(wfState.paymentProfile.updatedAt)) + '</p></article>' : '';
    var history = wfState.paymentHistory.map(function (item) {
      return '<article class="workspace-item"><div class="workspace-item-head"><div><strong>📚 เวอร์ชัน ' + esc(item.version || '—') + '</strong><p>' + esc(item.bankName || 'ไม่ระบุธนาคาร') + ' · ' + esc(item.accountName || 'ไม่ระบุชื่อบัญชี') + '</p></div><span class="workspace-badge ' + (item.status === 'archived' ? 'warn' : '') + '">' + esc(paymentStatusLabel(item.status)) + '</span></div><p>เลขบัญชี: <b>' + esc(maskedAccount(item.accountNumber)) + '</b> · เลขภาษี: <b>' + esc(item.taxId ? 'มีข้อมูล' : 'ไม่มีข้อมูล') + '</b></p><p>บันทึกเมื่อ: ' + esc(formatDate(item.createdAt)) + ' · ผู้บันทึก: ' + esc(item.createdBy === wfState.targetUid ? 'เจ้าของข้อมูล' : 'Dev/CEO') + '</p></article>';
    }).join('');
    var requests = wfState.paymentRequests.map(function (item) {
      return '<article class="workspace-item"><div class="workspace-item-head"><div><strong>📨 คำขอเปลี่ยนข้อมูล</strong><p>' + esc(item.newBankName || 'ไม่ระบุธนาคาร') + ' · ' + esc(item.newAccountName || 'ไม่ระบุชื่อบัญชี') + '</p></div><span class="workspace-badge ' + (item.status === 'rejected' ? 'danger' : item.status === 'pending' ? 'warn' : '') + '">' + esc(paymentStatusLabel(item.status)) + '</span></div><p>เลขบัญชีใหม่: <b>' + esc(maskedAccount(item.newAccountNumber)) + '</b> · ยื่นเมื่อ: ' + esc(formatDate(item.requestedAt)) + '</p>' + (item.reason ? '<p>เหตุผล: ' + esc(item.reason) + '</p>' : '') + (item.reviewNote ? '<p>หมายเหตุ Dev/CEO: ' + esc(item.reviewNote) + '</p>' : '') + '</article>';
    }).join('');
    box.innerHTML = current + history + requests || '<div class="workspace-empty">ยังไม่มีข้อมูลบัญชีหรือประวัติการเปลี่ยนแปลง</div>';
    var adminBox = $('paymentChangeAdminRequests');
    if (!adminBox) return;
    adminBox.style.display = wfState.isAdmin && wfState.paymentRequests.some(function (item) { return item.status === 'pending'; }) ? 'block' : 'none';
    if (!wfState.isAdmin) return;
    var pending = wfState.paymentRequests.filter(function (item) { return item.status === 'pending'; });
    adminBox.innerHTML = '<h4 style="margin:0 0 .65rem;">🛡️ คำขอที่รอ Dev/CEO อนุมัติ</h4>' + (pending.length ? pending.map(function (item) {
      return '<article class="workspace-item"><p><b>' + esc(item.newBankName) + '</b> · ' + esc(item.newAccountName) + ' · ' + esc(maskedAccount(item.newAccountNumber)) + '</p><p>ยื่นเมื่อ ' + esc(formatDate(item.requestedAt)) + ' · เหตุผล: ' + esc(item.reason || '—') + '</p><div class="workspace-actions"><button type="button" class="workspace-btn" data-approve-payment="' + esc(item.id) + '">✅ อนุมัติและเก็บเวอร์ชันเดิม</button><button type="button" class="workspace-btn danger" data-reject-payment="' + esc(item.id) + '">❌ ไม่อนุมัติ</button></div></article>';
    }).join('') : '<div class="workspace-empty">ไม่มีคำขอค้างอนุมัติ</div>');
    adminBox.querySelectorAll('[data-approve-payment]').forEach(function (button) { button.addEventListener('click', function () { reviewPaymentRequest(button.dataset.approvePayment, 'approved'); }); });
    adminBox.querySelectorAll('[data-reject-payment]').forEach(function (button) { button.addEventListener('click', function () { reviewPaymentRequest(button.dataset.rejectPayment, 'rejected'); }); });
  }

  async function openPrivateFile(path, popup) {
    if (!path || !wfState.authUser) throw new Error('ไม่พบเส้นทางไฟล์หรือเซสชันผู้ใช้');
    if (String(path).indexOf('supabase-document:') === 0) {
      var documentId = String(path).slice('supabase-document:'.length);
      var signed = await privateRequest('GET', 'signed-url', { documentId: documentId });
      if (popup) popup.location.href = signed.url; else window.location.href = signed.url;
      return;
    }
    if (!wfStorage) throw new Error('ไม่พบพื้นที่จัดเก็บไฟล์เดิม');
    // Read through Firebase Storage Rules using the authenticated SDK. Unlike
    // This does not mint a shareable, permanent Firebase token URL.
    var ref = wfStorage.ref(path);
    var metadata = await ref.getMetadata().catch(function () { return {}; });
    var bytes = await ref.getBytes(20 * 1024 * 1024);
    var blob = new Blob([bytes], { type: metadata.contentType || 'application/octet-stream' });
    var objectUrl = URL.createObjectURL(blob);
    if (popup) popup.location.href = objectUrl; else window.location.href = objectUrl;
    window.setTimeout(function () { URL.revokeObjectURL(objectUrl); }, 60 * 1000);
  }

  function bindPrivateFileLinks(root) {
    if (!root) return;
    root.querySelectorAll('[data-private-path]').forEach(function (link) {
      link.addEventListener('click', async function (event) {
        event.preventDefault();
        var popup = window.open('about:blank', '_blank');
        try {
          await openPrivateFile(link.dataset.privatePath, popup);
        } catch (error) {
          if (popup) popup.close();
          flash('เปิดไฟล์ไม่สำเร็จ', error.message, 'error');
        }
      });
    });
  }

  function renderWorkHistory() {
    var box = $('workHistoryList');
    if (!box) return;
    var rows = [];

    wfState.applications.forEach(function (app) {
      var applicant = app.applicant || {};
      var name = app.companyName || app.projectName || app.organization || app.projectSlug || 'ไม่ระบุบริษัท/กลุ่ม';
      var role = app.positionName || app.teamRole || 'ไม่ระบุตำแหน่ง';
      var contract = app.contract || {};
      var appStatus = app.status || 'submitted';
      var actions = wfState.isAdmin
        ? '<div class="workspace-actions" style="margin-top:.55rem;">' +
          '<select data-application-status="' + esc(app.id) + '" style="padding:.35rem .5rem;background:#081727;color:#fff;border:1px solid rgba(255,255,255,.2);border-radius:7px;">' +
          ['submitted', 'reviewing', 'interview', 'trial', 'approved', 'rejected', 'cancelled'].map(function (s) {
            return '<option value="' + s + '"' + (s === appStatus ? ' selected' : '') + '>' + statusLabel(s) + '</option>';
          }).join('') + '</select>' +
          '<button type="button" class="workspace-btn" data-save-application="' + esc(app.id) + '">อัปเดตผล</button></div>'
        : '';
      rows.push('<article class="workspace-item">' +
        '<div class="workspace-item-head"><div><strong>' + esc(name) + '</strong><p>' + esc(role) + ' · ' + esc(app.teamName || 'ทีมที่สมัคร') + '</p></div>' +
        '<span class="workspace-badge ' + statusClass(appStatus) + '">' + esc(statusLabel(appStatus)) + '</span></div>' +
        '<p>สมัครเมื่อ: <b>' + esc(formatDate(app.createdAt)) + '</b> · ตัดสินใจ/อัปเดต: <b>' + esc(formatDate(app.statusChangedAt || app.updatedAt)) + '</b></p>' +
        '<p>เอกสาร: ' + (contract.signed ? '<span style="color:#4ade80;">✍️ เซ็นแล้ว ' + esc(formatDate(contract.signedAt)) + '</span>' : '<span style="color:#facc15;">รอลงนาม</span>') +
        (contract.voided ? ' · <span style="color:#f87171;">ยกเลิก: ' + esc(contract.voidReason || 'ไม่ระบุเหตุผล') + '</span>' : '') + '</p>' +
        '<p><a href="contract?id=' + encodeURIComponent(app.id) + '" target="_blank" rel="noopener" style="color:var(--accent);">📄 เปิดดูเอกสารสัญญา</a></p>' + actions + '</article>');
    });

    wfState.employment.forEach(function (record) {
      rows.push('<article class="workspace-item">' +
        '<div class="workspace-item-head"><div><strong>' + esc(record.companyName || record.companyId || 'ไม่ระบุบริษัท/กลุ่ม') + '</strong><p>' + esc(record.teamName || 'ไม่ระบุทีม') + ' · ' + esc(record.teamRole || 'ไม่ระบุตำแหน่ง') + '</p></div>' +
        '<span class="workspace-badge ' + statusClass(record.status) + '">' + esc(statusLabel(record.status)) + '</span></div>' +
        '<p>บันทึกเมื่อ: ' + esc(formatDate(record.createdAt)) + ' · แก้ไขล่าสุด: ' + esc(formatDate(record.updatedAt)) + '</p>' +
        (record.reason ? '<p>เหตุผล/ประกาศ: ' + esc(record.reason) + '</p>' : '') +
        (record.noticeMessage ? '<p>' + esc(record.noticeMessage) + '</p>' : '') + '</article>');
    });

    box.innerHTML = rows.length ? rows.join('') : '<div class="workspace-empty">ยังไม่มีประวัติการสมัครหรือประวัติการทำงาน</div>';
    box.querySelectorAll('[data-save-application]').forEach(function (button) {
      button.addEventListener('click', function () {
        var id = button.dataset.saveApplication;
        var select = box.querySelector('[data-application-status="' + id + '"]');
        updateApplicationStatus(id, select ? select.value : 'submitted');
      });
    });
  }

  async function updateApplicationStatus(id, status) {
    if (!wfState.isAdmin) return;
    var ok = await confirmAction('ยืนยันอัปเดตผลใบสมัคร', 'ต้องการเปลี่ยนสถานะเป็น “' + statusLabel(status) + '” หรือไม่?');
    if (!ok) return;
    try {
      var app = wfState.applications.find(function (item) { return item.id === id; }) || {};
      var message = 'สถานะใบสมัครตำแหน่ง ' + (app.positionName || '') + ' เปลี่ยนเป็น ' + statusLabel(status);
      await privateRequest('POST', 'application.update', { targetUid: wfState.targetUid, id: id, status: status, reason: message });
      flash('อัปเดตผลใบสมัครแล้ว', message, 'success');
      await loadApplications();
      renderWorkHistory();
    } catch (error) {
      flash('อัปเดตผลใบสมัครไม่สำเร็จ', error.message, 'error');
    }
  }

  function renderAttendance() {
    var month = wfState.attendanceMonth || currentMonth();
    var rows = wfState.attendance.filter(function (item) { return !item.date || String(item.date).slice(0, 7) === month; });
    var total = rows.reduce(function (sum, item) { return sum + Number(item.hours || 0); }, 0);
    setText('attendanceDays', String(rows.length));
    setText('attendanceHours', total.toFixed(2));
    setText('attendanceAverage', rows.length ? (total / rows.length).toFixed(2) : '0');
    var box = $('attendanceList');
    if (!box) return;
    if (!rows.length) {
      box.innerHTML = '<div class="workspace-empty">ยังไม่มีรายการเวลาในเดือนนี้</div>';
    } else {
      box.innerHTML = '<div class="workspace-table-wrap"><table class="workspace-table"><thead><tr><th>วันที่</th><th>เข้า</th><th>ออก</th><th>ชั่วโมง</th><th>สถานะ</th><th></th></tr></thead><tbody>' +
        rows.map(function (item) {
          return '<tr><td>' + esc(item.date || '—') + '</td><td>' + esc(formatDate(item.checkIn)) + '</td><td>' + esc(formatDate(item.checkOut)) + '</td><td>' + esc(Number(item.hours || 0).toFixed(2)) + '</td><td>' + esc(item.status === 'closed' ? 'ปิดงานแล้ว' : 'กำลังทำงาน') + '</td><td>' +
            (wfState.isAdmin ? '<button type="button" class="workspace-btn secondary" data-edit-attendance="' + esc(item.id) + '">แก้ไข</button>' : '') + '</td></tr>';
        }).join('') + '</tbody></table></div>';
    }
    box.querySelectorAll('[data-edit-attendance]').forEach(function (button) {
      button.addEventListener('click', function () { openAttendanceEditor(wfState.attendance.find(function (item) { return item.id === button.dataset.editAttendance; })); });
    });
    updateAttendanceButtons();
  }

  function updateAttendanceButtons() {
    var today = wfState.attendance.find(function (item) { return String(item.date || '') === todayKey(); });
    if ($('btnCheckIn')) $('btnCheckIn').style.display = wfState.isSelf && !(today && today.checkIn) ? 'inline-flex' : 'none';
    if ($('btnCheckOut')) $('btnCheckOut').style.display = wfState.isSelf && today && today.checkIn && !today.checkOut ? 'inline-flex' : 'none';
  }

  async function checkIn() {
    if (!wfState.isSelf) return;
    var existing = wfState.attendance.find(function (item) { return String(item.date || '') === todayKey(); });
    if (existing && existing.checkIn) return flash('ลงชื่อเข้างานแล้ว', 'รายการวันนี้มีเวลาเข้าอยู่แล้ว', 'warning');
    try {
      await privateRequest('POST', 'attendance.check_in', { targetUid: wfState.targetUid });
      flash('ลงชื่อเข้างานสำเร็จ', 'บันทึกเวลาเข้าแล้ว', 'success');
      await loadPrivateSnapshot();
      await loadAttendance();
    } catch (error) { flash('ลงชื่อเข้างานไม่สำเร็จ', error.message, 'error'); }
  }

  async function checkOut() {
    if (!wfState.isSelf) return;
    var existing = wfState.attendance.find(function (item) { return String(item.date || '') === todayKey(); });
    if (!existing || !existing.checkIn) return flash('ยังไม่มีเวลาเข้างาน', 'กรุณาลงชื่อเข้างานก่อน', 'warning');
    if (existing.checkOut) return flash('ลงชื่อออกงานแล้ว', 'รายการวันนี้มีเวลาออกอยู่แล้ว', 'warning');
    var start = asDate(existing.checkIn);
    var end = new Date();
    var hours = start ? Math.max(0, Math.min(24, (end - start) / 3600000)) : 0;
    try {
      await privateRequest('POST', 'attendance.check_out', { targetUid: wfState.targetUid });
      flash('ลงชื่อออกงานสำเร็จ', 'บันทึกชั่วโมงทำงาน ' + hours.toFixed(2) + ' ชั่วโมง', 'success');
      await loadPrivateSnapshot();
      await loadAttendance();
    } catch (error) { flash('ลงชื่อออกงานไม่สำเร็จ', error.message, 'error'); }
  }

  function toLocalInput(value) {
    var d = asDate(value);
    if (!d) return '';
    var pad = function (n) { return String(n).padStart(2, '0'); };
    return d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate()) + 'T' + pad(d.getHours()) + ':' + pad(d.getMinutes());
  }

  function openAttendanceEditor(item) {
    if (!wfState.isAdmin || !item) return;
    ensureHidden('attendanceEditId').value = item.id;
    if ($('attendanceEditCheckIn')) $('attendanceEditCheckIn').value = toLocalInput(item.checkIn);
    if ($('attendanceEditCheckOut')) $('attendanceEditCheckOut').value = toLocalInput(item.checkOut);
    if ($('attendanceEditNote')) $('attendanceEditNote').value = item.note || '';
    if ($('adminAttendanceEditor')) $('adminAttendanceEditor').style.display = 'grid';
    $('adminAttendanceEditor') && $('adminAttendanceEditor').scrollIntoView({ behavior: 'smooth', block: 'center' });
  }

  async function saveAttendanceEdit() {
    if (!wfState.isAdmin) return;
    var id = $('attendanceEditId') && $('attendanceEditId').value;
    if (!id) return;
    var checkIn = $('attendanceEditCheckIn').value ? new Date($('attendanceEditCheckIn').value).toISOString() : null;
    var checkOut = $('attendanceEditCheckOut').value ? new Date($('attendanceEditCheckOut').value).toISOString() : null;
    var hours = checkIn && checkOut ? Math.max(0, Math.min(24, (new Date(checkOut) - new Date(checkIn)) / 3600000)) : 0;
    try {
      await privateRequest('POST', 'attendance.update', { targetUid: wfState.targetUid, id: id, checkIn: checkIn, checkOut: checkOut, note: ($('attendanceEditNote').value || '').trim() });
      if ($('adminAttendanceEditor')) $('adminAttendanceEditor').style.display = 'none';
      flash('แก้ไขเวลาทำงานแล้ว', '', 'success');
      await loadPrivateSnapshot();
      await loadAttendance();
    } catch (error) { flash('แก้ไขเวลาไม่สำเร็จ', error.message, 'error'); }
  }

  function renderPayroll() {
    var total = wfState.payroll.reduce(function (sum, item) { return sum + Number(item.netSalary || 0); }, 0);
    setText('payrollTotal', 'รวมสุทธิ ' + money(total) + ' บาท');
    var box = $('payrollList');
    if (!box) return;
    if (!wfState.payroll.length) {
      box.innerHTML = '<div class="workspace-empty">ยังไม่มีรายการจ่ายเงินเดือน/ส่วนแบ่ง</div>';
      return;
    }
    box.innerHTML = wfState.payroll.map(function (item) {
      var actions = wfState.isAdmin ? '<div class="workspace-actions" style="margin-top:.55rem;"><button type="button" class="workspace-btn secondary" data-edit-payroll="' + esc(item.id) + '">แก้ไข</button><button type="button" class="workspace-btn danger" data-delete-payroll="' + esc(item.id) + '">ลบ</button></div>' : '';
      return '<article class="workspace-item"><div class="workspace-item-head"><div><strong>' + esc(item.period || 'ไม่ระบุเดือน') + '</strong><p>' + esc(item.companyName || item.companyId || 'ไม่ระบุบริษัท') + ' · ' + esc(item.teamName || '') + '</p></div><span class="workspace-badge ' + (item.paymentStatus === 'paid' ? '' : 'warn') + '">' + esc(item.paymentStatus === 'paid' ? '✅ โอนแล้ว' : item.paymentStatus === 'approved' ? '🟡 อนุมัติยอด' : '📝 ร่าง') + '</span></div>' +
        '<p>ก่อนหัก ' + money(Number(item.baseSalary || 0) + Number(item.bonus || 0)) + ' บาท · หัก ' + money(item.deductions) + ' บาท · <b style="color:var(--accent);">สุทธิ ' + money(item.netSalary) + ' บาท</b></p>' +
        '<p>บันทึกเมื่อ: ' + esc(formatDate(item.createdAt)) + (item.paidAt ? ' · โอนเมื่อ: ' + esc(formatDate(item.paidAt)) : '') + '</p>' +
        (item.slipPath ? '<p><a class="workspace-file" href="#" data-private-path="' + esc(item.slipPath) + '">🔐 เปิดดูสลิป/หลักฐานแบบลิงก์ชั่วคราว</a></p>' : '') + (item.slipUrl && !item.slipPath ? '<p class="workspace-private-note">พบลิงก์ไฟล์แบบเก่าที่ไม่มีเส้นทางไฟล์ จึงไม่เปิดเผยเพื่อความปลอดภัย</p>' : '') + (item.note ? '<p>หมายเหตุ: ' + esc(item.note) + '</p>' : '') + actions + '</article>';
    }).join('');
    bindPrivateFileLinks(box);
    box.querySelectorAll('[data-delete-payroll]').forEach(function (button) {
      button.addEventListener('click', async function () {
        if (!await confirmAction('ลบรายการจ่ายเงิน', 'รายการนี้จะถูกลบออกจากประวัติการจ่ายเงินของสมาชิก')) return;
        await privateRequest('POST', 'payroll.delete', { targetUid: wfState.targetUid, id: button.dataset.deletePayroll });
        flash('ลบรายการจ่ายเงินแล้ว', '', 'success');
        await loadPrivateSnapshot();
        await loadPayroll();
      });
    });
    box.querySelectorAll('[data-edit-payroll]').forEach(function (button) {
      button.addEventListener('click', function () { fillPayrollForm(wfState.payroll.find(function (item) { return item.id === button.dataset.editPayroll; })); });
    });
  }

  function fillPayrollForm(item) {
    if (!item) return;
    ensureHidden('payrollEditId').value = item.id;
    if ($('payrollPeriod')) $('payrollPeriod').value = item.period || '';
    if ($('payrollCompany')) $('payrollCompany').value = item.companyName || '';
    if ($('payrollTeam')) $('payrollTeam').value = item.teamName || '';
    if ($('payrollBase')) $('payrollBase').value = item.baseSalary || 0;
    if ($('payrollBonus')) $('payrollBonus').value = item.bonus || 0;
    if ($('payrollDeductions')) $('payrollDeductions').value = item.deductions || 0;
    if ($('payrollStatus')) $('payrollStatus').value = item.paymentStatus || 'draft';
    if ($('payrollNote')) $('payrollNote').value = item.note || '';
    $('payrollAdminForm') && $('payrollAdminForm').scrollIntoView({ behavior: 'smooth', block: 'center' });
  }

  async function savePayroll(event) {
    event.preventDefault();
    if (!wfState.isAdmin) return;
    var button = $('btnSavePayroll');
    setBusy(button, true, 'กำลังบันทึกเงินเดือน...');
    try {
      var period = $('payrollPeriod').value;
      var base = Number($('payrollBase').value || 0);
      var bonus = Number($('payrollBonus').value || 0);
      var deductions = Number($('payrollDeductions').value || 0);
      if (!period || base < 0 || bonus < 0 || deductions < 0) throw new Error('กรุณากรอกเดือนและจำนวนเงินให้ถูกต้อง');
      var slip = $('payrollSlipFile').files[0];
      if (slip) {
        validatePrivateFile(slip);
      }
      var editId = ensureHidden('payrollEditId').value;
      await privateRequest('POST', 'payroll.upsert', {
        targetUid: wfState.targetUid, id: editId || '', period: period, base: base, bonus: bonus,
        deductions: deductions, status: $('payrollStatus').value, note: ($('payrollNote').value || '').trim()
      }, slip);
      ensureHidden('payrollEditId').value = '';
      $('payrollAdminForm').reset();
      flash('บันทึกรายการเงินเดือนแล้ว', 'คำนวณยอดสุทธิให้อัตโนมัติแล้ว', 'success');
      await loadPrivateSnapshot();
      await loadPayroll();
    } catch (error) { flash('บันทึกเงินเดือนไม่สำเร็จ', error.message, 'error'); }
    finally { setBusy(button, false); }
  }

  function renderIdentityDocuments() {
    var box = $('identityDocumentList');
    if (!box) return;
    if (!wfState.identityDocs.length) {
      box.innerHTML = '<div class="workspace-empty">ยังไม่มีเอกสารส่วนตัว</div>';
      return;
    }
    var labels = { 'id-card': 'สำเนาบัตรประชาชน', identity_card: 'สำเนาบัตรประชาชน', bankbook: 'หน้าสมุดบัญชีธนาคาร', bank_book: 'หน้าสมุดบัญชีธนาคาร', 'tax-document': 'เอกสารภาษี', tax_document: 'เอกสารภาษี', other: 'เอกสารอื่น ๆ' };
    box.innerHTML = wfState.identityDocs.map(function (item) {
      return '<article class="workspace-item"><div class="workspace-item-head"><div><strong>🗂️ ' + esc(labels[item.kind] || item.kind || 'เอกสาร') + '</strong><p class="workspace-file">' + esc(item.fileName || item.storagePath || 'ไฟล์ส่วนตัว') + '</p></div><span class="workspace-badge">🔒 Private</span></div><p>อัปโหลดเมื่อ: ' + esc(formatDate(item.createdAt)) + '</p>' +
        (item.storagePath ? '<p><a class="workspace-file" href="#" data-private-path="' + esc(item.storagePath) + '">🔐 ดูเอกสารแบบลิงก์ชั่วคราว</a></p>' : '<p class="workspace-private-note">ไฟล์เดิมไม่มีเส้นทางสำหรับสร้างลิงก์ใหม่ กรุณาให้ Dev อัปโหลดไฟล์อีกครั้ง</p>') +
        '<div class="workspace-actions"><button type="button" class="workspace-btn danger" data-delete-identity="' + esc(item.id) + '">ลบเอกสาร</button></div></article>';
    }).join('');
    bindPrivateFileLinks(box);
    box.querySelectorAll('[data-delete-identity]').forEach(function (button) {
      button.addEventListener('click', async function () {
        if (!await confirmAction('ลบเอกสารส่วนตัว', 'เอกสารนี้จะถูกนำออกจากพื้นที่จัดเก็บส่วนตัว')) return;
        var item = wfState.identityDocs.find(function (doc) { return doc.id === button.dataset.deleteIdentity; });
        if (!item) return;
        try {
          await privateRequest('POST', 'document.delete', { targetUid: wfState.targetUid, id: item.id });
          flash('ลบเอกสารแล้ว', '', 'success');
          await loadPrivateSnapshot();
          await loadIdentityDocuments();
        } catch (error) { flash('ลบเอกสารไม่สำเร็จ', error.message, 'error'); }
      });
    });
  }

  function validatePrivateFile(file) {
    if (!file || file.size > 20 * 1024 * 1024) throw new Error('ไฟล์ต้องมีขนาดไม่เกิน 20 MB');
    if (!/^image\//.test(file.type) && file.type !== 'application/pdf') throw new Error('รองรับเฉพาะรูปภาพหรือ PDF');
  }

  function cleanFileName(name) {
    return String(name || 'file').replace(/[^a-zA-Z0-9._-]/g, '_').slice(-100);
  }

  async function uploadIdentity(event) {
    event.preventDefault();
    if (!wfState.isSelf && !wfState.isAdmin) return;
    var file = $('identityDocumentFile').files[0];
    var button = $('btnUploadIdentity');
    try {
      validatePrivateFile(file);
      setBusy(button, true, 'กำลังอัปโหลดเอกสาร...');
      var kind = $('identityDocumentType').value;
      await privateRequest('POST', 'document.upload', { targetUid: wfState.targetUid, documentType: kind }, file);
      $('identityDocumentForm').reset();
      flash('อัปโหลดเอกสารส่วนตัวแล้ว', 'เอกสารนี้ไม่แสดงบนหน้า Public', 'success');
      await loadPrivateSnapshot();
      await loadIdentityDocuments();
    } catch (error) { flash('อัปโหลดเอกสารไม่สำเร็จ', error.message, 'error'); }
    finally { setBusy(button, false); }
  }

  function renderFinance() {
    if (!wfState.isAdmin) return;
    var income = wfState.finance.filter(function (item) { return item.type === 'income'; }).reduce(function (sum, item) { return sum + Number(item.amount || 0); }, 0);
    var expense = wfState.finance.filter(function (item) { return item.type === 'expense'; }).reduce(function (sum, item) { return sum + Number(item.amount || 0); }, 0);
    setText('financeIncome', money(income));
    setText('financeExpense', money(expense));
    setText('financeProfit', money(income - expense));
    var box = $('financeEntryList');
    if (!box) return;
    if (!wfState.finance.length) { box.innerHTML = '<div class="workspace-empty">ยังไม่มีรายการบัญชี</div>'; return; }
    box.innerHTML = wfState.finance.map(function (item) {
      return '<article class="workspace-item"><div class="workspace-item-head"><div><strong>' + (item.type === 'income' ? '🟢 รายรับ' : '🔴 รายจ่าย') + ' · ' + esc(item.category || 'ไม่ระบุหมวดหมู่') + '</strong><p>' + esc(item.companyName || 'ไม่ระบุบริษัท') + ' · เดือน ' + esc(item.period || '—') + '</p></div><strong style="color:' + (item.type === 'income' ? '#4ade80' : '#f87171') + ';">' + (item.type === 'income' ? '+' : '-') + money(item.amount) + ' บาท</strong></div>' +
        '<p>' + esc(item.note || 'ไม่มีรายละเอียด') + ' · บันทึกเมื่อ ' + esc(formatDate(item.createdAt)) + '</p>' +
        (item.receiptPath ? '<p><a class="workspace-file" href="#" data-private-path="' + esc(item.receiptPath) + '">🔐 ดูเอกสารประกอบแบบลิงก์ชั่วคราว</a></p>' : (item.receiptUrl ? '<p class="workspace-private-note">พบลิงก์ไฟล์แบบเก่าที่ไม่มีเส้นทางไฟล์ จึงไม่เปิดเผยเพื่อความปลอดภัย</p>' : '')) +
        '<div class="workspace-actions"><button type="button" class="workspace-btn secondary" data-edit-finance="' + esc(item.id) + '">แก้ไข</button><button type="button" class="workspace-btn danger" data-delete-finance="' + esc(item.id) + '">ลบ</button></div></article>';
    }).join('');
    bindPrivateFileLinks(box);
    box.querySelectorAll('[data-edit-finance]').forEach(function (button) {
      button.addEventListener('click', function () { fillFinanceForm(wfState.finance.find(function (item) { return item.id === button.dataset.editFinance; })); });
    });
    box.querySelectorAll('[data-delete-finance]').forEach(function (button) {
      button.addEventListener('click', async function () {
        if (!await confirmAction('ลบรายการบัญชี', 'ยืนยันลบรายการรายรับ/รายจ่ายนี้หรือไม่?')) return;
        await privateRequest('POST', 'finance.delete', { targetUid: wfState.targetUid, id: button.dataset.deleteFinance });
        flash('ลบรายการบัญชีแล้ว', '', 'success');
        await loadPrivateSnapshot();
        await loadFinance();
      });
    });
  }

  function fillFinanceForm(item) {
    if (!item) return;
    ensureHidden('financeEntryEditId').value = item.id;
    if ($('financeType')) $('financeType').value = item.type || 'income';
    if ($('financeAmount')) $('financeAmount').value = item.amount || 0;
    if ($('financeCategory')) $('financeCategory').value = item.category || '';
    if ($('financeCompany')) $('financeCompany').value = item.companyName || '';
    if ($('financePeriod')) $('financePeriod').value = item.period || currentMonth();
    if ($('financeNote')) $('financeNote').value = item.note || '';
    $('financeEntryForm') && $('financeEntryForm').scrollIntoView({ behavior: 'smooth', block: 'center' });
  }

  async function saveFinance(event) {
    event.preventDefault();
    if (!wfState.isAdmin) return;
    var button = $('btnSaveFinance');
    setBusy(button, true, 'กำลังบันทึกบัญชี...');
    try {
      var amount = Number($('financeAmount').value || 0);
      var period = $('financePeriod').value;
      if (!amount || amount < 0 || amount > 100000000 || !period || !$('financeCategory').value.trim()) throw new Error('กรุณากรอกจำนวนเงิน หมวดหมู่ และเดือนบัญชีให้ครบ');
      var receipt = $('financeReceiptFile').files[0];
      if (receipt) {
        validatePrivateFile(receipt);
      }
      var editId = ensureHidden('financeEntryEditId').value;
      await privateRequest('POST', 'finance.upsert', {
        targetUid: wfState.targetUid, id: editId || '', type: $('financeType').value, amount: amount,
        category: $('financeCategory').value.trim(), companySlug: $('financeCompany').value.trim(),
        period: period, note: $('financeNote').value.trim()
      }, receipt);
      ensureHidden('financeEntryEditId').value = '';
      $('financeEntryForm').reset();
      flash('บันทึกรายการบัญชีแล้ว', 'อัปเดตกำไรคงเหลือให้อัตโนมัติแล้ว', 'success');
      await loadPrivateSnapshot();
      await loadFinance();
    } catch (error) { flash('บันทึกรายการบัญชีไม่สำเร็จ', error.message, 'error'); }
    finally { setBusy(button, false); }
  }

  async function savePaymentProfile(event) {
    event.preventDefault();
    if (!wfState.isSelf && !wfState.isAdmin) return;
    var data = {
      userUid: wfState.targetUid,
      newBankName: $('paymentBankName').value.trim(),
      newAccountName: $('paymentAccountName').value.trim(),
      newAccountNumber: $('paymentAccountNumber').value.trim(),
      newTaxId: $('paymentTaxId').value.trim(),
      reason: ($('paymentChangeReason').value || '').trim()
    };
    if (!data.newBankName || !data.newAccountName || !data.newAccountNumber || !data.reason) return flash('ข้อมูลยังไม่ครบ', 'กรุณากรอกธนาคาร ชื่อบัญชี เลขบัญชี และเหตุผล', 'warning');
    try {
      if (wfState.isAdmin) {
        await applyPaymentProfile(data, null, data.reason);
        flash('บันทึกข้อมูลรับเงินแล้ว', 'เก็บเวอร์ชันเดิมไว้เป็นหลักฐานและเปิดใช้ข้อมูลใหม่แล้ว', 'success');
      } else {
        await privateRequest('POST', 'payment.request', { targetUid: wfState.targetUid, bankName: data.newBankName, accountName: data.newAccountName, accountNumber: data.newAccountNumber, taxId: data.newTaxId, reason: data.reason });
        flash('ส่งคำขอแล้ว', 'Dev/CEO จะตรวจสอบก่อนเปิดใช้บัญชีใหม่ ข้อมูลเดิมจะไม่ถูกลบ', 'success');
      }
      $('paymentChangeReason').value = '';
      await loadPrivateSnapshot();
      await loadPaymentProfile();
    } catch (error) { flash('บันทึกข้อมูลรับเงินไม่สำเร็จ', error.message, 'error'); }
  }

  async function applyPaymentProfile(requestData, requestId, reviewNote) {
    if (!wfState.isAdmin) throw new Error('เฉพาะ Dev/CEO เท่านั้นที่อนุมัติข้อมูลรับเงินได้');
    if (requestId) {
      await privateRequest('POST', 'payment.review', { targetUid: wfState.targetUid, id: requestId, status: 'approved', reviewNote: String(reviewNote || '').slice(0, 1000) });
      return;
    }
    var created = await privateRequest('POST', 'payment.request', { targetUid: wfState.targetUid, bankName: requestData.newBankName, accountName: requestData.newAccountName, accountNumber: requestData.newAccountNumber, taxId: requestData.newTaxId || '', reason: requestData.reason || 'บันทึกโดย Dev/CEO' });
    await privateRequest('POST', 'payment.review', { targetUid: wfState.targetUid, id: created.id, status: 'approved', reviewNote: String(reviewNote || '').slice(0, 1000) });
  }

  async function reviewPaymentRequest(requestId, status) {
    if (!wfState.isAdmin) return;
    var item = wfState.paymentRequests.find(function (request) { return request.id === requestId; });
    if (!item || item.status !== 'pending') return;
    var note = window.prompt(status === 'approved' ? 'หมายเหตุการอนุมัติ (ถ้ามี)' : 'เหตุผลที่ไม่อนุมัติ');
    if (note === null) return;
    try {
      if (status === 'approved') await applyPaymentProfile(item, requestId, note);
      else {
        await privateRequest('POST', 'payment.review', { targetUid: wfState.targetUid, id: requestId, status: 'rejected', reviewNote: String(note || '').slice(0, 1000) });
      }
      flash(status === 'approved' ? 'อนุมัติคำขอแล้ว' : 'ไม่อนุมัติคำขอแล้ว', 'บันทึกประวัติและแจ้งสมาชิกแล้ว', 'success');
      await loadPrivateSnapshot();
      await loadPaymentProfile();
    } catch (error) { flash('จัดการคำขอไม่สำเร็จ', error.message, 'error'); }
  }

  async function saveEmployment(event) {
    event.preventDefault();
    if (!wfState.isAdmin) return;
    var status = $('employmentStatus').value;
    var companyId = $('employmentCompanyId').value.trim();
    var companyName = $('employmentCompanyName').value.trim();
    var teamName = $('employmentTeamName').value.trim();
    var teamRole = $('employmentRole').value.trim();
    var reason = $('employmentReason').value.trim();
    if (!companyId || !companyName || !teamRole || !reason) return flash('ข้อมูลยังไม่ครบ', 'กรุณาระบุบริษัท ตำแหน่ง และเหตุผล', 'warning');
    var ok = await confirmAction('ยืนยันเปลี่ยนสถานะทีมงาน', 'ระบบจะบันทึกประวัติ ส่งประกาศ และแจ้งเตือนสมาชิกคนนี้');
    if (!ok) return;
    var button = $('btnSaveEmployment');
    setBusy(button, true, 'กำลังบันทึกสถานะ...');
    try {
      var title = status === 'active' ? 'แจ้งสถานะกลับเข้าทีม' : 'ประกาศเปลี่ยนสถานะทีมงาน';
      var message = 'สถานะของคุณใน ' + companyName + ' เปลี่ยนเป็น ' + statusLabel(status) + ' เหตุผล: ' + reason;
      await privateRequest('POST', 'employment.update', { targetUid: wfState.targetUid, status: status, companySlug: companyId, teamSlug: teamName, roleName: teamRole, reason: reason });
      flash('เปลี่ยนสถานะและส่งประกาศแล้ว', message, 'success');
      await loadPrivateSnapshot();
      await loadEmployment();
      renderWorkHistory();
    } catch (error) { flash('บันทึกสถานะไม่สำเร็จ', error.message, 'error'); }
    finally { setBusy(button, false); }
  }

  async function writeAudit(action, details) {
    // Private audit events are appended server-side by Supabase.
    return Promise.resolve({ action: action, details: details });
  }

  function bindEvents() {
    if ($('attendanceMonth')) {
      $('attendanceMonth').value = wfState.attendanceMonth || currentMonth();
      $('attendanceMonth').addEventListener('change', function () { wfState.attendanceMonth = $('attendanceMonth').value || currentMonth(); renderAttendance(); });
    }
    $('btnCheckIn') && $('btnCheckIn').addEventListener('click', checkIn);
    $('btnCheckOut') && $('btnCheckOut').addEventListener('click', checkOut);
    $('btnSaveAttendanceEdit') && $('btnSaveAttendanceEdit').addEventListener('click', saveAttendanceEdit);
    $('btnCancelAttendanceEdit') && $('btnCancelAttendanceEdit').addEventListener('click', function () { $('adminAttendanceEditor').style.display = 'none'; });
    $('paymentProfileForm') && $('paymentProfileForm').addEventListener('submit', savePaymentProfile);
    $('identityDocumentForm') && $('identityDocumentForm').addEventListener('submit', uploadIdentity);
    $('employmentControlForm') && $('employmentControlForm').addEventListener('submit', saveEmployment);
    $('financeEntryForm') && $('financeEntryForm').addEventListener('submit', saveFinance);
    $('payrollAdminForm') && $('payrollAdminForm').addEventListener('submit', savePayroll);
  }

  async function initProfile(user) {
    if (wfState.authUser) return;
    wfState.authUser = user;
    var params = new URLSearchParams(window.location.search);
    wfState.targetUid = params.get('uid') || user.uid;
    wfState.isSelf = wfState.targetUid === user.uid;
    try {
      var ownSnap = await wfDb.collection('users').doc(user.uid).get();
      var ownData = ownSnap.exists ? ownSnap.data() : {};
      wfState.isAdmin = user.email === 'bestcynix@gmail.com' || user.email === 'admin@email.com' || ownData.role === 'admin';
      var targetSnap = wfState.isSelf ? ownSnap : await wfDb.collection('users').doc(wfState.targetUid).get();
      wfState.profile = targetSnap.exists ? targetSnap.data() : {};
      if (!wfState.isSelf && !wfState.isAdmin) return;
    } catch (error) {
      flash('โหลดข้อมูลสิทธิ์ไม่สำเร็จ', error.message, 'error');
      return;
    }

    try {
      await loadApplications();
    } catch (error) {
      flash('โหลดข้อมูลพื้นที่ทีมงานไม่สำเร็จ', error.message, 'error');
      return;
    }
    // The Supabase workforce member row is the source of truth after migration;
    // a legacy Firestore field alone must not expose private workforce sections.
    wfState.isWorkforce = Boolean(wfState.privateSnapshot && wfState.privateSnapshot.member);
    if (wfState.isWorkforce) await loadEmployment();
    applyProfileMode();
    var adminBox = $('profileAdminWorkspace');
    if (adminBox) adminBox.style.display = wfState.isWorkforce && wfState.isAdmin ? 'block' : 'none';
    if (!wfState.isSelf && $('identityDocumentForm')) $('identityDocumentForm').style.display = wfState.isWorkforce && wfState.isAdmin ? 'grid' : 'none';
    if (!wfState.isWorkforce) return;
    ['companyId', 'companyName', 'teamName', 'teamRole'].forEach(function (field) {
      var id = 'employment' + field.charAt(0).toUpperCase() + field.slice(1);
      if ($(id)) $(id).value = wfState.profile[field] || '';
    });
    if ($('employmentStatus')) $('employmentStatus').value = wfState.profile.employmentStatus || 'active';
    if ($('employmentReason')) $('employmentReason').value = wfState.profile.employmentNote || '';
    if ($('financePeriod')) $('financePeriod').value = currentMonth();
    if ($('payrollPeriod')) $('payrollPeriod').value = currentMonth();
    bindEvents();
    await loadPaymentProfile();
    await Promise.all([loadAttendance(), loadPayroll(), loadIdentityDocuments(), loadFinance()]);
    renderWorkHistory();
  }

  wfAuth.onAuthStateChanged(function (user) {
    if (user) initProfile(user);
  });
})();
