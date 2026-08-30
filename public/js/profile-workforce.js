/*
 * Profile Workforce Workspace
 * Private employment history, attendance, payroll and finance controls.
 * All sensitive reads/writes are additionally enforced by Firestore/Storage Rules.
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
    isWorkforce: false
  };

  var $ = function (id) { return document.getElementById(id); };
  var stamp = function () { return firebase.firestore.FieldValue.serverTimestamp(); };
  var nowTimestamp = function () { return firebase.firestore.Timestamp.now(); };
  var todayKey = function () {
    var d = new Date();
    return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
  };
  var currentMonth = function () { return todayKey().slice(0, 7); };

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

  async function queryBy(collectionName, field, value) {
    try {
      var snap = await wfDb.collection(collectionName).where(field, '==', value).get();
      return snap.docs.map(function (d) { return Object.assign({ id: d.id }, d.data()); });
    } catch (error) {
      console.warn('Profile workforce query failed:', collectionName, field, error);
      return [];
    }
  }

  async function loadApplications() {
    var first = await queryBy('joinTeamApplications', 'applicantUid', wfState.targetUid);
    var second = await queryBy('joinTeamApplications', 'userId', wfState.targetUid);
    var map = {};
    first.concat(second).forEach(function (item) { map[item.id] = item; });
    wfState.applications = Object.keys(map).map(function (key) { return map[key]; });
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
    wfState.employment = await queryBy('employmentRecords', 'userUid', wfState.targetUid);
    wfState.employment.sort(function (a, b) {
      return (asDate(b.createdAt) || 0) - (asDate(a.createdAt) || 0);
    });
  }

  async function loadAttendance() {
    wfState.attendance = await queryBy('attendanceRecords', 'uid', wfState.targetUid);
    wfState.attendance.sort(function (a, b) { return String(b.date || '').localeCompare(String(a.date || '')); });
    renderAttendance();
  }

  async function loadPayroll() {
    wfState.payroll = await queryBy('payrollRecords', 'uid', wfState.targetUid);
    wfState.payroll.sort(function (a, b) { return String(b.period || '').localeCompare(String(a.period || '')); });
    renderPayroll();
  }

  async function loadIdentityDocuments() {
    wfState.identityDocs = await queryBy('identityDocuments', 'userUid', wfState.targetUid);
    wfState.identityDocs.sort(function (a, b) { return (asDate(b.createdAt) || 0) - (asDate(a.createdAt) || 0); });
    renderIdentityDocuments();
  }

  async function loadFinance() {
    if (!wfState.isAdmin) return;
    try {
      var snap = await wfDb.collection('financeEntries').limit(500).get();
      wfState.finance = snap.docs.map(function (d) { return Object.assign({ id: d.id }, d.data()); });
      wfState.finance.sort(function (a, b) { return (asDate(b.createdAt) || 0) - (asDate(a.createdAt) || 0); });
    } catch (error) {
      wfState.finance = [];
      flash('โหลดบัญชีรายรับรายจ่ายไม่สำเร็จ', error.message, 'error');
    }
    renderFinance();
  }

  async function loadPaymentProfile() {
    try {
      var snap = await wfDb.collection('paymentProfiles').doc(wfState.targetUid).get();
      var data = snap.exists ? snap.data() : {};
      wfState.paymentProfileExists = snap.exists;
      wfState.paymentProfile = snap.exists ? Object.assign({ id: snap.id }, data) : null;
      ['paymentBankName', 'paymentAccountName', 'paymentAccountNumber', 'paymentTaxId'].forEach(function (id) {
        var field = id.replace('payment', '').replace(/^[A-Z]/, function (m) { return m.toLowerCase(); });
        if ($(id)) $(id).value = data[field] || '';
      });
    } catch (error) {
      flash('โหลดข้อมูลรับเงินไม่สำเร็จ', error.message, 'error');
    }
    await Promise.all([loadPaymentHistory(), loadPaymentRequests()]);
    renderPaymentHistory();
  }

  async function loadPaymentHistory() {
    wfState.paymentHistory = await queryBy('paymentProfileHistory', 'userUid', wfState.targetUid);
    wfState.paymentHistory.sort(function (a, b) { return (asDate(b.createdAt) || 0) - (asDate(a.createdAt) || 0); });
  }

  async function loadPaymentRequests() {
    wfState.paymentRequests = await queryBy('paymentChangeRequests', 'userUid', wfState.targetUid);
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
    if (!path || !wfState.authUser || !wfStorage) throw new Error('ไม่พบเส้นทางไฟล์หรือเซสชันผู้ใช้');
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
      await wfDb.collection('joinTeamApplications').doc(id).update({
        status: status,
        statusChangedAt: stamp(),
        statusChangedBy: wfState.authUser.uid
      });
      var app = wfState.applications.find(function (item) { return item.id === id; }) || {};
      var message = 'สถานะใบสมัครตำแหน่ง ' + (app.positionName || '') + ' เปลี่ยนเป็น ' + statusLabel(status);
      var notice = {
        targetUid: wfState.targetUid,
        title: 'อัปเดตสถานะใบสมัคร',
        message: message,
        type: 'application_status',
        url: '/profile',
        createdAt: stamp(),
        createdBy: wfState.authUser.uid
      };
      await wfDb.collection('adminAnnouncements').add(notice);
      await wfDb.collection('users').doc(wfState.targetUid).collection('notifications').add({
        title: notice.title, message: notice.message, type: notice.type, url: notice.url, createdAt: stamp(), read: false
      });
      await writeAudit('UPDATE_APPLICATION_STATUS', message);
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
    var today = wfState.attendance.find(function (item) { return item.id === wfState.targetUid + '_' + todayKey(); });
    if ($('btnCheckIn')) $('btnCheckIn').style.display = wfState.isSelf && !(today && today.checkIn) ? 'inline-flex' : 'none';
    if ($('btnCheckOut')) $('btnCheckOut').style.display = wfState.isSelf && today && today.checkIn && !today.checkOut ? 'inline-flex' : 'none';
  }

  async function checkIn() {
    if (!wfState.isSelf) return;
    var id = wfState.targetUid + '_' + todayKey();
    var existing = wfState.attendance.find(function (item) { return item.id === id; });
    if (existing && existing.checkIn) return flash('ลงชื่อเข้างานแล้ว', 'รายการวันนี้มีเวลาเข้าอยู่แล้ว', 'warning');
    try {
      await wfDb.collection('attendanceRecords').doc(id).set({
        uid: wfState.targetUid, date: todayKey(), checkIn: nowTimestamp(), checkOut: null, hours: 0,
        status: 'open', note: '', createdAt: stamp(), updatedAt: stamp(), createdBy: wfState.authUser.uid, updatedBy: wfState.authUser.uid
      }, { merge: true });
      flash('ลงชื่อเข้างานสำเร็จ', 'บันทึกเวลาเข้าแล้ว', 'success');
      await loadAttendance();
    } catch (error) { flash('ลงชื่อเข้างานไม่สำเร็จ', error.message, 'error'); }
  }

  async function checkOut() {
    if (!wfState.isSelf) return;
    var id = wfState.targetUid + '_' + todayKey();
    var existing = wfState.attendance.find(function (item) { return item.id === id; });
    if (!existing || !existing.checkIn) return flash('ยังไม่มีเวลาเข้างาน', 'กรุณาลงชื่อเข้างานก่อน', 'warning');
    if (existing.checkOut) return flash('ลงชื่อออกงานแล้ว', 'รายการวันนี้มีเวลาออกอยู่แล้ว', 'warning');
    var start = asDate(existing.checkIn);
    var end = new Date();
    var hours = start ? Math.max(0, Math.min(24, (end - start) / 3600000)) : 0;
    try {
      await wfDb.collection('attendanceRecords').doc(id).update({ checkOut: nowTimestamp(), hours: Number(hours.toFixed(2)), status: 'closed', updatedAt: stamp(), updatedBy: wfState.authUser.uid });
      flash('ลงชื่อออกงานสำเร็จ', 'บันทึกชั่วโมงทำงาน ' + hours.toFixed(2) + ' ชั่วโมง', 'success');
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
    var checkIn = $('attendanceEditCheckIn').value ? firebase.firestore.Timestamp.fromDate(new Date($('attendanceEditCheckIn').value)) : null;
    var checkOut = $('attendanceEditCheckOut').value ? firebase.firestore.Timestamp.fromDate(new Date($('attendanceEditCheckOut').value)) : null;
    var hours = checkIn && checkOut ? Math.max(0, Math.min(24, (checkOut.toDate() - checkIn.toDate()) / 3600000)) : 0;
    try {
      await wfDb.collection('attendanceRecords').doc(id).update({ checkIn: checkIn, checkOut: checkOut, hours: Number(hours.toFixed(2)), status: checkOut ? 'closed' : 'open', note: ($('attendanceEditNote').value || '').trim(), updatedAt: stamp(), updatedBy: wfState.authUser.uid });
      if ($('adminAttendanceEditor')) $('adminAttendanceEditor').style.display = 'none';
      flash('แก้ไขเวลาทำงานแล้ว', '', 'success');
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
        await wfDb.collection('payrollRecords').doc(button.dataset.deletePayroll).delete();
        flash('ลบรายการจ่ายเงินแล้ว', '', 'success');
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
      var slipPath = null;
      if (slip) {
        validatePrivateFile(slip);
        slipPath = 'private-personal/' + wfState.targetUid + '/payroll/' + period + '_' + Date.now() + '_' + cleanFileName(slip.name);
        var ref = wfStorage.ref(slipPath);
        await ref.put(slip, { contentType: slip.type });
      }
      var data = {
        uid: wfState.targetUid,
        companyName: ($('payrollCompany').value || '').trim(),
        teamName: ($('payrollTeam').value || '').trim(),
        period: period,
        baseSalary: base,
        bonus: bonus,
        deductions: deductions,
        netSalary: Math.max(0, base + bonus - deductions),
        paymentStatus: $('payrollStatus').value,
        paidAt: $('payrollStatus').value === 'paid' ? nowTimestamp() : null,
        note: ($('payrollNote').value || '').trim(),
        updatedAt: stamp(),
        updatedBy: wfState.authUser.uid
      };
      if (slipPath) data.slipPath = slipPath;
      var editId = ensureHidden('payrollEditId').value;
      var refDoc = editId ? wfDb.collection('payrollRecords').doc(editId) : wfDb.collection('payrollRecords').doc();
      if (!editId) {
        data.createdAt = stamp();
        data.createdBy = wfState.authUser.uid;
      }
      await refDoc.set(data, { merge: true });
      ensureHidden('payrollEditId').value = '';
      $('payrollAdminForm').reset();
      flash('บันทึกรายการเงินเดือนแล้ว', 'คำนวณยอดสุทธิให้อัตโนมัติแล้ว', 'success');
      await loadPayroll();
      await writeAudit('UPSERT_PAYROLL', 'บันทึกเงินเดือน ' + period + ' ให้ UID ' + wfState.targetUid);
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
    var labels = { 'id-card': 'สำเนาบัตรประชาชน', bankbook: 'หน้าสมุดบัญชีธนาคาร', 'tax-document': 'เอกสารภาษี', other: 'เอกสารอื่น ๆ' };
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
          if (wfStorage && item.storagePath) await wfStorage.ref(item.storagePath).delete().catch(function () {});
          await wfDb.collection('identityDocuments').doc(item.id).delete();
          flash('ลบเอกสารแล้ว', '', 'success');
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
      var path = 'private-personal/' + wfState.targetUid + '/identity/' + kind + '_' + Date.now() + '_' + cleanFileName(file.name);
      var ref = wfStorage.ref(path);
      await ref.put(file, { contentType: file.type });
      await wfDb.collection('identityDocuments').add({
        userUid: wfState.targetUid, kind: kind, fileName: file.name.slice(0, 180), storagePath: path,
        createdAt: stamp(), updatedAt: stamp(), createdBy: wfState.authUser.uid
      });
      $('identityDocumentForm').reset();
      flash('อัปโหลดเอกสารส่วนตัวแล้ว', 'เอกสารนี้ไม่แสดงบนหน้า Public', 'success');
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
        var item = wfState.finance.find(function (row) { return row.id === button.dataset.deleteFinance; });
        if (item && wfStorage && item.receiptPath) await wfStorage.ref(item.receiptPath).delete().catch(function () {});
        await wfDb.collection('financeEntries').doc(button.dataset.deleteFinance).delete();
        flash('ลบรายการบัญชีแล้ว', '', 'success');
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
      var receiptPath = null;
      if (receipt) {
        validatePrivateFile(receipt);
        receiptPath = 'private-personal/' + wfState.authUser.uid + '/finance/' + period + '_' + Date.now() + '_' + cleanFileName(receipt.name);
        var ref = wfStorage.ref(receiptPath);
        await ref.put(receipt, { contentType: receipt.type });
      }
      var data = {
        type: $('financeType').value, amount: amount, category: $('financeCategory').value.trim(),
        companyName: $('financeCompany').value.trim(), period: period, note: $('financeNote').value.trim(),
        updatedAt: stamp(), updatedBy: wfState.authUser.uid
      };
      if (receiptPath) data.receiptPath = receiptPath;
      var editId = ensureHidden('financeEntryEditId').value;
      var refDoc = editId ? wfDb.collection('financeEntries').doc(editId) : wfDb.collection('financeEntries').doc();
      if (!editId) data.createdAt = stamp(), data.createdBy = wfState.authUser.uid;
      await refDoc.set(data, { merge: true });
      ensureHidden('financeEntryEditId').value = '';
      $('financeEntryForm').reset();
      flash('บันทึกรายการบัญชีแล้ว', 'อัปเดตกำไรคงเหลือให้อัตโนมัติแล้ว', 'success');
      await loadFinance();
      await writeAudit('UPSERT_FINANCE_ENTRY', 'บันทึก ' + data.type + ' ' + amount + ' บาท');
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
        await wfDb.collection('paymentChangeRequests').add({
          userUid: wfState.targetUid, newBankName: data.newBankName, newAccountName: data.newAccountName,
          newAccountNumber: data.newAccountNumber, newTaxId: data.newTaxId, reason: data.reason,
          status: 'pending', requestedAt: stamp(), requestedBy: wfState.authUser.uid
        });
        flash('ส่งคำขอแล้ว', 'Dev/CEO จะตรวจสอบก่อนเปิดใช้บัญชีใหม่ ข้อมูลเดิมจะไม่ถูกลบ', 'success');
      }
      $('paymentChangeReason').value = '';
      await loadPaymentProfile();
    } catch (error) { flash('บันทึกข้อมูลรับเงินไม่สำเร็จ', error.message, 'error'); }
  }

  async function applyPaymentProfile(requestData, requestId, reviewNote) {
    if (!wfState.isAdmin) throw new Error('เฉพาะ Dev/CEO เท่านั้นที่อนุมัติข้อมูลรับเงินได้');
    var current = wfState.paymentProfile;
    var batch = wfDb.batch();
    var version = Number(current && current.version || 0) + 1;
    if (current) {
      var oldHistoryRef = wfDb.collection('paymentProfileHistory').doc();
      batch.set(oldHistoryRef, {
        userUid: wfState.targetUid, version: Number(current.version || 1), bankName: current.bankName || '', accountName: current.accountName || '',
        accountNumber: current.accountNumber || '', taxId: current.taxId || '', status: 'archived', sourceRequestId: requestId || null,
        createdAt: current.createdAt || stamp(), createdBy: current.updatedBy || wfState.authUser.uid
      });
    }
    var historyRef = wfDb.collection('paymentProfileHistory').doc();
    batch.set(historyRef, {
      userUid: wfState.targetUid, version: version, bankName: requestData.newBankName, accountName: requestData.newAccountName,
      accountNumber: requestData.newAccountNumber, taxId: requestData.newTaxId || '', status: 'active', sourceRequestId: requestId || null,
      createdAt: stamp(), createdBy: wfState.authUser.uid
    });
    var profileRef = wfDb.collection('paymentProfiles').doc(wfState.targetUid);
    batch.set(profileRef, {
      uid: wfState.targetUid, bankName: requestData.newBankName, accountName: requestData.newAccountName,
      accountNumber: requestData.newAccountNumber, taxId: requestData.newTaxId || '', version: version,
      activeHistoryId: historyRef.id, createdAt: current && current.createdAt ? current.createdAt : stamp(), updatedAt: stamp(), updatedBy: wfState.authUser.uid
    }, { merge: true });
    if (requestId) batch.update(wfDb.collection('paymentChangeRequests').doc(requestId), { status: 'approved', reviewedAt: stamp(), reviewedBy: wfState.authUser.uid, reviewNote: String(reviewNote || '').slice(0, 1000), approvedVersion: version });
    await batch.commit();
    await wfDb.collection('users').doc(wfState.targetUid).collection('notifications').add({ title: 'อัปเดตข้อมูลรับเงิน', message: 'คำขอข้อมูลบัญชีรับเงินของคุณได้รับการอนุมัติแล้ว', type: 'payment_profile', url: '/profile', createdAt: stamp(), read: false });
    await writeAudit('APPROVE_PAYMENT_PROFILE', 'เปิดใช้ข้อมูลรับเงินเวอร์ชัน ' + version + ' ของ UID ' + wfState.targetUid);
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
        await wfDb.collection('paymentChangeRequests').doc(requestId).update({ status: 'rejected', reviewedAt: stamp(), reviewedBy: wfState.authUser.uid, reviewNote: String(note || '').slice(0, 1000) });
        await wfDb.collection('users').doc(wfState.targetUid).collection('notifications').add({ title: 'คำขอเปลี่ยนข้อมูลรับเงิน', message: 'คำขอของคุณยังไม่ได้รับการอนุมัติ' + (note ? ' เหตุผล: ' + note : ''), type: 'payment_profile', url: '/profile', createdAt: stamp(), read: false });
        await writeAudit('REJECT_PAYMENT_PROFILE', 'ไม่อนุมัติคำขอข้อมูลรับเงิน ' + requestId);
      }
      flash(status === 'approved' ? 'อนุมัติคำขอแล้ว' : 'ไม่อนุมัติคำขอแล้ว', 'บันทึกประวัติและแจ้งสมาชิกแล้ว', 'success');
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
      await wfDb.collection('users').doc(wfState.targetUid).set({
        companyId: companyId, companyName: companyName, teamName: teamName, teamRole: teamRole,
        employmentStatus: status, employmentNote: reason, employmentChangedAt: stamp(), employmentChangedBy: wfState.authUser.uid, updatedAt: stamp()
      }, { merge: true });
      var title = status === 'active' ? 'แจ้งสถานะกลับเข้าทีม' : 'ประกาศเปลี่ยนสถานะทีมงาน';
      var message = 'สถานะของคุณใน ' + companyName + ' เปลี่ยนเป็น ' + statusLabel(status) + ' เหตุผล: ' + reason;
      await wfDb.collection('employmentRecords').add({
        userUid: wfState.targetUid, companyId: companyId, companyName: companyName, teamName: teamName, teamRole: teamRole,
        status: status, reason: reason, noticeTitle: title, noticeMessage: message,
        createdAt: stamp(), updatedAt: stamp(), createdBy: wfState.authUser.uid
      });
      await wfDb.collection('adminAnnouncements').add({ targetUid: wfState.targetUid, title: title, message: message, type: 'employment', url: '/profile', createdAt: stamp(), createdBy: wfState.authUser.uid });
      await wfDb.collection('users').doc(wfState.targetUid).collection('notifications').add({ title: title, message: message, type: 'employment', url: '/profile', createdAt: stamp(), read: false });
      await writeAudit('UPDATE_EMPLOYMENT_STATUS', message);
      flash('เปลี่ยนสถานะและส่งประกาศแล้ว', message, 'success');
      await loadEmployment();
      renderWorkHistory();
    } catch (error) { flash('บันทึกสถานะไม่สำเร็จ', error.message, 'error'); }
    finally { setBusy(button, false); }
  }

  async function writeAudit(action, details) {
    if (!wfState.isAdmin) return;
    try {
      await wfDb.collection('auditLogs').add({ adminUid: wfState.authUser.uid, subjectUid: wfState.targetUid, action: action, details: String(details || '').slice(0, 1000), createdAt: stamp() });
    } catch (error) { console.warn('Audit write failed:', error); }
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

    await loadApplications();
    wfState.isWorkforce = inferWorkforceMode();
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
