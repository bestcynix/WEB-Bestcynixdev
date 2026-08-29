(function () {
  'use strict';

  const DOC_ID = 'mc-skyline';
  const MAX_FILE_BYTES = 20 * 1024 * 1024;
  const ALLOWED_URL = /^(https?:\/\/|\/|#|mailto:)/i;
  const DEFAULT_DOCUMENT = {
    id: DOC_ID,
    title: 'เอกสารรับสมัคร กฎระเบียบ และการจัดการข้อมูล',
    subtitle: 'เอกสารนี้เป็นแนวทางและร่างข้อตกลงสำหรับทีม/ผู้จัดโครงการ ไม่ใช่คำปรึกษากฎหมายเฉพาะกรณี',
    intro: 'ศูนย์รวมเอกสารของ Mc-Skyline.online จัดหมวดหมู่เพื่อให้ทีม ผู้สมัคร และผู้ดูแลตรวจสอบข้อมูลชุดเดียวกันได้ง่าย',
    links: [
      { label: '🚀 สมัครทีม Mc-Skyline', url: '/join-team/mc-skyline' },
      { label: '📚 ศูนย์เอกสาร', url: '/docs' }
    ],
    sections: [
      { id: 'warning', title: '⚠️ ข้อควรรู้ก่อนส่งข้อมูล', paragraphs: [
        'แบบสมัคร Public ไม่รับสำเนาบัตรประชาชน สมุดบัญชี เลขบัญชี หรือเลขประจำตัวผู้เสียภาษี ผู้สมัครไม่ควรส่งข้อมูลดังกล่าวใน Discord หรือแชททั่วไป ทีมงานจะขอเฉพาะเมื่อผ่านการคัดเลือกและมีเหตุจำเป็นจริง โดยจะแจ้งวัตถุประสงค์ รายการข้อมูล ผู้เข้าถึง ระยะเวลาเก็บ และช่องทางลบ/ถอนความยินยอมก่อนส่งทุกครั้ง',
        'ผู้จัดโครงการยังไม่ได้จดทะเบียนเป็นบริษัท จึงต้องระบุชื่อ-สกุลและที่อยู่ของคู่สัญญาฝ่ายผู้จัดโครงการจริงในฉบับที่จะลงนาม ห้ามใช้คำว่า “บริษัท” หรืออ้างสถานะนิติบุคคลหากยังไม่มีการจดทะเบียน'
      ] },
      { id: 'apply', title: '1. ขั้นตอนการรับสมัคร', items: [
        'กรอกข้อมูลที่จำเป็นต่อการคัดเลือกและยอมรับประกาศความเป็นส่วนตัว',
        'ทีมงานตรวจผลงาน ความถนัด เวลาว่าง และความเหมาะสมของตำแหน่ง',
        'ผู้ผ่านการคัดเลือกได้รับรายละเอียดงานและร่างข้อตกลงให้อ่านก่อนตัดสินใจ',
        'ถ้าจำเป็นต้องยืนยันตัวตน/รับเงิน จึงขอเอกสารผ่านช่องทางส่วนตัวที่กำหนด และบันทึกการเข้าถึง',
        'เริ่มงานหลังทั้งสองฝ่ายยืนยันขอบเขตงาน วิธีจ่ายเงิน/แบ่งกำไร และสิทธิในผลงานเป็นลายลักษณ์อักษร'
      ] },
      { id: 'roles', title: '2. ตำแหน่งและโควตาเบื้องต้น', paragraphs: ['ไม่จำกัดอายุหรือเพศในประกาศ แต่การทำสัญญา การรับเงิน และการให้ความยินยอมต้องตรวจสอบความสามารถตามกฎหมายของผู้สมัครเป็นรายกรณี หากเป็นผู้เยาว์ควรให้ผู้แทนโดยชอบธรรมและทนายตรวจเอกสารก่อน'], table: {
        headers: ['ตำแหน่ง', 'จำนวน', 'หน้าที่โดยสรุป'], rows: [
          ['Developer', '2', 'เว็บ บอท ปลั๊กอิน และระบบหลังบ้าน'], ['Builder', '2', 'แผนที่และสิ่งปลูกสร้างในเกม'],
          ['System / Item / Quest', '2', 'ระบบ ไอเทม เควสต์ และระบบภายในเกม'], ['Modeler', '2', 'โมเดลและองค์ประกอบ 3D'],
          ['Resource Pack', '2', 'พื้นผิว เสียง และ resource pack'], ['ทีมงานอื่น ๆ', 'ตามความเหมาะสม', 'ความสามารถเฉพาะด้านที่สนับสนุนโครงการ']
        ]
      } },
      { id: 'identity', title: '3. รายการเอกสารยืนยันตัวตน (ขอเฉพาะเมื่อจำเป็น)', items: [
        'สำเนาบัตรประชาชนด้านหน้า: ใช้เพื่อยืนยันตัวตนของคู่สัญญาเท่าที่จำเป็นเท่านั้น โดยให้ปิดบังข้อมูลที่ไม่จำเป็นต่อวัตถุประสงค์',
        'ข้อความกำกับสำเนาที่แนะนำ: “สำเนาถูกต้อง ใช้สำหรับทำสัญญากับ Mc-Skyline.online เท่านั้น วันที่ … ลายเซ็น … (คำนำหน้า ชื่อ–สกุล)”',
        'หน้าสมุดบัญชี/ชื่อธนาคาร/เลขบัญชี: ขอเมื่อถึงขั้นตอนจ่ายเงินเท่านั้น และไม่ควรใช้เป็นหลักฐานแทนการยืนยันตัวตนโดยอัตโนมัติ',
        'เลขประจำตัวผู้เสียภาษี: ขอเมื่อมีเหตุด้านภาษีหรือการจ่ายเงินที่ต้องใช้จริง พร้อมแจ้งฐานและวัตถุประสงค์ก่อนเก็บ'
      ], paragraphs: ['การเขียนข้อความกำกับบนสำเนาไม่ได้ทำให้เอกสารถูกต้องตามกฎหมายทุกกรณี และไม่ควรขอเอกสารเกินความจำเป็น การจัดเก็บจริงต้องใช้ private storage/ระบบหลังบ้านที่จำกัดสิทธิ์ ไม่ใช่ Firestore public collection หรือ data URL ในแบบสมัคร'] },
      { id: 'contract', title: '4. หัวข้อที่ต้องมีในสัญญาฉบับจริง', items: [
        'ชื่อ-สกุลและที่อยู่ของคู่สัญญา สถานะผู้จัดโครงการ และขอบเขตโครงการ', 'ตำแหน่ง งานส่งมอบ เกณฑ์ตรวจรับ เวลา และช่องทางสื่อสาร',
        'ค่าตอบแทนหรือสูตรแบ่งผลกำไร: รายได้ที่นำมาคำนวณ ค่าใช้จ่ายที่หักได้ รอบสรุปบัญชี วันจ่าย และหลักฐานประกอบ',
        'สิทธิในโค้ด โมเดล แผนที่ เพลง resource pack เครื่องหมายการค้า และผลงานเดิมของแต่ละฝ่าย',
        'ความลับ ความปลอดภัย การคืน/ลบข้อมูล การยุติความร่วมมือ และช่องทางระงับข้อพิพาท',
        'เงื่อนไขแก้ไขสัญญาและการยืนยันตัวตน/ลายเซ็นของทั้งสองฝ่าย'
      ], paragraphs: ['เปอร์เซ็นต์แบ่งกำไรต้องกรอกเป็นตัวเลขและสูตรที่ตรวจสอบได้ ห้ามใช้ข้อความกว้าง ๆ ว่า “แบ่งตามความเหมาะสม” โดยไม่มีวิธีคำนวณ'] },
      { id: 'finance', title: '4.1 โครงสร้างเงินทุนและการแบ่งผลกำไรที่ผู้จัดโครงการเสนอ', paragraphs: ['ผู้จัดโครงการ/ผู้ลงทุนหลัก: นายพงศ์ภรณ์ ทองศิริ เป็นผู้จัดหาเงินทุนและใช้บัญชีรับเงินของโครงการตามข้อมูลที่แจ้งไว้ ผู้จัดโครงการต้องเปิดเผยบัญชีรายรับ-รายจ่ายให้ทีมตรวจสอบได้ตามรอบที่ระบุในสัญญา'], items: [
        'รายรับของโครงการหักคืน/กันไว้สำหรับต้นทุนที่พิสูจน์ได้ก่อน เช่น ค่าไฟ VPS โดเมน ซอฟต์แวร์ ค่าธรรมเนียม และค่าใช้จ่ายจำเป็นอื่นที่ระบุไว้',
        'จนกว่าต้นทุนสะสมที่ตกลงกันจะได้รับคืนครบ จะยังไม่มีเงินเดือนหรือเงินจ่ายประจำให้ทีมโดยอัตโนมัติ เว้นแต่มีข้อตกลงใหม่เป็นลายลักษณ์อักษร',
        'เดือนที่ไม่มีรายรับ หรือหลังหักต้นทุนแล้วไม่มีกำไรสุทธิ จะไม่มีการแบ่งกำไรในเดือนนั้น และไม่ควรเรียกว่าเงินเดือนค้างจ่าย',
        'เมื่อหักต้นทุนครบและมีกำไรสุทธิ จึงแบ่งตามเปอร์เซ็นต์ที่กรอกในตารางสัญญา โดยกำหนดให้สัดส่วนของนายพงศ์ภรณ์ ทองศิริสูงกว่าสมาชิกแต่ละรายได้ แต่ต้องระบุเปอร์เซ็นต์จริง สูตรคำนวณ และการยินยอมของทุกฝ่ายก่อนลงนาม',
        'สรุปบัญชีทุกเดือน/ไตรมาส พร้อมหลักฐานรายรับ รายจ่าย ต้นทุนคงเหลือ และยอดที่จะแบ่ง ผู้ร่วมทีมมีสิทธิขอตรวจเอกสารตามขอบเขตที่สัญญากำหนด'
      ] },
      { id: 'fraud', title: '5. ป้องกันการโกงและการละเมิด', items: [
        'ห้ามปลอมแปลงเอกสาร สวมรอย หลอกให้โอนเงิน เข้าถึงบัญชี/เซิร์ฟเวอร์โดยไม่ได้รับอนุญาต หรือเผยแพร่ข้อมูลผู้อื่น',
        'ทีมงานอาจระงับสิทธิ์ เก็บหลักฐานตามสมควร และยุติการเข้าถึงเมื่อพบความเสี่ยง โดยแจ้งเหตุและเปิดช่องทางชี้แจง',
        'เมื่อมีมูลความผิด ให้เก็บ log, เวลา, URL, หลักฐานการชำระเงิน และข้อความที่เกี่ยวข้องอย่างไม่แก้ไข แล้วปรึกษาทนาย/แจ้งหน่วยงานที่มีอำนาจตามข้อเท็จจริง',
        'ห้ามข่มขู่หรือเปิดเผยข้อมูลส่วนตัวเพื่อประจาน และห้ามดำเนินคดีโดยไม่มีการตรวจสอบหลักฐาน'
      ] },
      { id: 'data', title: '6. แผนการจัดการข้อมูลที่ต้องทำก่อนรับเอกสารจริง', items: [
        'ทำ Privacy Notice แยกสำหรับการสมัครและการทำสัญญา ระบุผู้ควบคุมข้อมูล วัตถุประสงค์ ฐานการประมวลผล และสิทธิของเจ้าของข้อมูล',
        'เก็บเอกสารไว้ใน private bucket ที่เข้ารหัส จำกัด role, MFA, signed URL อายุสั้น และ audit log',
        'แยกข้อมูลระบุตัวบุคคลออกจากใบสมัครที่ใช้แสดงผล จำกัดผู้ดูแล และไม่ส่งเข้า Discord webhook',
        'กำหนด retention เช่น ลบข้อมูลผู้ไม่ผ่านการคัดเลือกเมื่อพ้นระยะที่แจ้งไว้ และลบเอกสารเมื่อหมดสัญญา/หมดเหตุจำเป็นตามนโยบาย',
        'เตรียมขั้นตอนขอเข้าถึง แก้ไข ถอนความยินยอม ลบ หรือคัดค้าน และช่องทางติดต่อผู้รับผิดชอบ'
      ] },
      { id: 'disclaimer', title: 'เอกสารนี้ยังไม่ใช่สัญญาสำเร็จรูป', paragraphs: ['ควรให้ทนายไทยตรวจร่างก่อนใช้งานจริง โดยเฉพาะสถานะผู้จัดโครงการที่ยังไม่จดทะเบียน ภาษี การแบ่งกำไร ความเป็นเจ้าของผลงาน และกรณีผู้สมัครเป็นผู้เยาว์'], links: [
        { label: 'พ.ร.บ. PDPA ฉบับราชกิจจานุเบกษา', url: 'https://ratchakitcha.soc.go.th/documents/17082307.pdf' },
        { label: 'แนวทางจาก สคส.', url: 'https://gppc.pdpc.go.th/pdpa-courses-for-general-public/' },
        { label: 'ติดต่อผู้ดูแลข้อมูล', url: 'mailto:bestcynix@gmail.com' }
      ] }
    ]
  };

  const state = { doc: normalizeDoc(DEFAULT_DOCUMENT), remoteLoaded: false, admin: false, editing: false, saving: false };
  const root = document.querySelector('.ms-docs');
  if (!root || typeof firebase === 'undefined') return;

  function normalizeDoc(raw) {
    const source = raw || DEFAULT_DOCUMENT;
    const clone = (value, fallback) => Array.isArray(value) ? value : fallback;
    const sections = clone(source.sections, DEFAULT_DOCUMENT.sections).map((section, index) => ({
      id: String(section.id || `section-${index + 1}`), title: String(section.title || `หัวข้อ ${index + 1}`),
      paragraphs: clone(section.paragraphs, []).map(String), items: clone(section.items, []).map(String),
      subitems: clone(section.subitems, []).map((sub) => ({ title: String(sub.title || ''), body: String(sub.body || ''), items: clone(sub.items, []).map(String) })),
      links: clone(section.links, []).map((link) => ({ label: String(link.label || ''), url: String(link.url || '') })),
      attachments: clone(section.attachments, []).map((file) => ({ name: String(file.name || 'ไฟล์แนบ'), url: String(file.url || ''), type: String(file.type || ''), size: Number(file.size || 0) })),
      table: section.table && Array.isArray(section.table.headers) ? { headers: section.table.headers.map(String), rows: clone(section.table.rows, []).map((row) => clone(row, []).map(String)) } : null
    }));
    return { id: DOC_ID, title: String(source.title || DEFAULT_DOCUMENT.title), subtitle: String(source.subtitle || ''), intro: String(source.intro || ''), links: clone(source.links, []).map((link) => ({ label: String(link.label || ''), url: String(link.url || '') })), sections };
  }

  function escapeHtml(value) { return String(value == null ? '' : value).replace(/[&<>"']/g, (char) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[char])); }
  function safeUrl(value) { const url = String(value || '').trim(); return ALLOWED_URL.test(url) ? url : '#'; }
  function linkHtml(link, className) { return `<a class="${className || ''}" href="${escapeHtml(safeUrl(link.url))}" target="_blank" rel="noopener noreferrer">${escapeHtml(link.label || link.url)}</a>`; }
  function notify(title, message, type) { if (typeof window.showCyberToast === 'function') window.showCyberToast(title, message, type || 'info'); else window.alert(`${title}\n${message}`); }

  function renderDocument() {
    if (state.editing && state.admin) { renderEditor(); return; }
    const doc = state.doc;
    root.innerHTML = `<nav class="ms-doc-nav"><a href="/" class="ms-brand-link">⚡ BestCyniX Dev</a><div class="ms-links"><a href="/join-team/mc-skyline">🚀 สมัครทีม Mc-Skyline</a><a href="/docs">📚 ศูนย์เอกสาร</a></div></nav>
      <header class="ms-card ms-doc-hero"><div class="ms-kicker">MC-SKYLINE.ONLINE • DOCUMENTATION</div><h1>${escapeHtml(doc.title)}</h1><p>${escapeHtml(doc.subtitle)}</p>${doc.intro ? `<p class="ms-doc-intro">${escapeHtml(doc.intro)}</p>` : ''}<div class="ms-links">${doc.links.map((link) => linkHtml(link)).join('')}</div></header>
      ${doc.sections.map(renderSection).join('')}${state.admin ? '<div class="ms-admin-toolbar"><button type="button" data-action="edit">✏️ แก้ไขเอกสารนี้</button><span>โหมดผู้ดูแล: แก้ไขแล้วกดบันทึกเพื่อเผยแพร่</span></div>' : ''}`;
  }

  function renderSection(section) {
    const content = [section.paragraphs.map((p) => `<p>${escapeHtml(p)}</p>`).join(''), section.items.length ? `<ul>${section.items.map((item) => `<li>${escapeHtml(item)}</li>`).join('')}</ul>` : '', section.subitems.map((sub) => `<div class="ms-subitem"><h3>${escapeHtml(sub.title)}</h3><p>${escapeHtml(sub.body)}</p>${sub.items.length ? `<ul>${sub.items.map((item) => `<li>${escapeHtml(item)}</li>`).join('')}</ul>` : ''}</div>`).join('')].join('');
    const table = section.table ? `<div class="ms-table-wrap"><table class="ms-table"><thead><tr>${section.table.headers.map((h) => `<th>${escapeHtml(h)}</th>`).join('')}</tr></thead><tbody>${section.table.rows.map((row) => `<tr>${row.map((cell) => `<td>${escapeHtml(cell)}</td>`).join('')}</tr>`).join('')}</tbody></table></div>` : '';
    const links = section.links.length ? `<div class="ms-links">${section.links.map((link) => linkHtml(link)).join('')}</div>` : '';
    const files = section.attachments.length ? `<div class="ms-attachments">${section.attachments.map((file) => { const url = safeUrl(file.url); const isImage = file.type.startsWith('image/'); const isPdf = file.type === 'application/pdf' || /\.pdf($|\?)/i.test(url); return `<article class="ms-attachment"><div class="ms-attachment-name">📎 ${escapeHtml(file.name)}</div>${isImage ? `<img loading="lazy" src="${escapeHtml(url)}" alt="${escapeHtml(file.name)}">` : isPdf ? `<iframe loading="lazy" title="${escapeHtml(file.name)}" src="${escapeHtml(url)}"></iframe>` : ''}<a href="${escapeHtml(url)}" target="_blank" rel="noopener noreferrer">เปิดไฟล์</a></article>`; }).join('')}</div>` : '';
    return `<section class="ms-card"><h2>${escapeHtml(section.title)}</h2>${content}${table}${links}${files}</section>`;
  }

  function input(label, value, attrs) { return `<label class="ms-editor-field"><span>${label}</span><input ${attrs || ''} value="${escapeHtml(value)}"></label>`; }
  function textarea(label, value, attrs) { return `<label class="ms-editor-field"><span>${label}</span><textarea ${attrs || ''}>${escapeHtml(value)}</textarea></label>`; }
  function actionButton(action, label, indices) { return `<button type="button" class="ms-mini-btn" data-action="${action}" ${indices || ''}>${label}</button>`; }

  function renderEditor() {
    const doc = state.doc;
    root.innerHTML = `<div class="ms-editor"><div class="ms-editor-head"><div><div class="ms-kicker">ADMIN CMS • ${DOC_ID}</div><h1>แก้ไขเอกสาร Mc-Skyline</h1><p>แก้ไขแล้วกดบันทึก ระบบจะตรวจสิทธิ์แอดมินก่อนเขียน Firestore ทุกครั้ง</p></div><div class="ms-editor-actions"><button type="button" data-action="cancel">ยกเลิก</button><button type="button" class="primary" data-action="save" ${state.saving ? 'disabled' : ''}>${state.saving ? 'กำลังบันทึก…' : '💾 บันทึกและเผยแพร่'}</button></div></div>
      <div class="ms-editor-card">${input('ชื่อเอกสาร', doc.title, 'data-field="title"')}${input('คำโปรย', doc.subtitle, 'data-field="subtitle"')}${textarea('คำอธิบายสั้น', doc.intro, 'data-field="intro" rows="3"')}<h2>ลิงก์ส่วนหัว</h2>${doc.links.map((link, index) => `<div class="ms-editor-row">${input('ข้อความ', link.label, `data-link-field="label" data-index="${index}"`)}${input('URL', link.url, `data-link-field="url" data-index="${index}"`)}${actionButton('delete-link', 'ลบ', `data-index="${index}"`)}</div>`).join('')}<button type="button" data-action="add-link">＋ เพิ่มลิงก์</button></div>
      ${doc.sections.map((section, index) => renderEditorSection(section, index)).join('')}<button type="button" class="ms-add-section" data-action="add-section">＋ เพิ่มหัวข้อใหม่</button></div>`;
  }

  function renderEditorSection(section, index) {
    return `<div class="ms-editor-card ms-editor-section"><div class="ms-editor-section-head"><h2>หัวข้อที่ ${index + 1}</h2><div>${actionButton('move-up', '↑', `data-index="${index}"`)}${actionButton('move-down', '↓', `data-index="${index}"`)}${actionButton('delete-section', '🗑 ลบหัวข้อ', `data-index="${index}"`)}</div></div>${input('ชื่อหัวข้อ', section.title, `data-section-field="title" data-index="${index}"`)}<h3>ย่อหน้า</h3>${section.paragraphs.map((text, child) => `<div class="ms-editor-row">${textarea('ข้อความ', text, `data-paragraph-field data-index="${index}" data-child-index="${child}" rows="3"`)}${actionButton('delete-paragraph', 'ลบ', `data-index="${index}" data-child-index="${child}"`)}</div>`).join('')}<button type="button" data-action="add-paragraph" data-index="${index}">＋ เพิ่มย่อหน้า</button><h3>รายการข้อ</h3>${section.items.map((text, child) => `<div class="ms-editor-row">${textarea('ข้อ', text, `data-item-field data-index="${index}" data-child-index="${child}" rows="2"`)}${actionButton('delete-item', 'ลบ', `data-index="${index}" data-child-index="${child}"`)}</div>`).join('')}<button type="button" data-action="add-item" data-index="${index}">＋ เพิ่มข้อ</button><h3>ข้อย่อย</h3>${section.subitems.map((sub, child) => `<div class="ms-editor-subitem">${input('ชื่อข้อย่อย', sub.title, `data-sub-field="title" data-index="${index}" data-child-index="${child}"`)}${textarea('รายละเอียด', sub.body, `data-sub-field="body" data-index="${index}" data-child-index="${child}" rows="2"`)}${sub.items.map((text, nested) => `<div class="ms-editor-row nested">${input('รายการย่อย', text, `data-subitem-field data-index="${index}" data-child-index="${child}" data-nested-index="${nested}"`)}${actionButton('delete-nested', 'ลบ', `data-index="${index}" data-child-index="${child}" data-nested-index="${nested}"`)}</div>`).join('')}<button type="button" data-action="add-nested" data-index="${index}" data-child-index="${child}">＋ เพิ่มรายการย่อย</button>${actionButton('delete-subitem', 'ลบข้อย่อย', `data-index="${index}" data-child-index="${child}"`)}</div>`).join('')}<button type="button" data-action="add-subitem" data-index="${index}">＋ เพิ่มข้อย่อย</button><h3>ลิงก์ในหัวข้อ</h3>${section.links.map((link, child) => `<div class="ms-editor-row">${input('ข้อความ', link.label, `data-section-link-field="label" data-index="${index}" data-child-index="${child}"`)}${input('URL', link.url, `data-section-link-field="url" data-index="${index}" data-child-index="${child}"`)}${actionButton('delete-section-link', 'ลบ', `data-index="${index}" data-child-index="${child}"`)}</div>`).join('')}<button type="button" data-action="add-section-link" data-index="${index}">＋ เพิ่มลิงก์</button><h3>ไฟล์ รูปภาพ และ PDF</h3><div class="ms-upload-row"><input type="file" accept="image/*,.pdf" data-file-input="${index}"><button type="button" data-action="upload" data-index="${index}">⬆️ อัปโหลดไฟล์</button></div>${section.attachments.map((file, child) => `<div class="ms-file-row"><span>📎 ${escapeHtml(file.name)}</span>${actionButton('delete-attachment', 'ลบ', `data-index="${index}" data-child-index="${child}"`)}</div>`).join('')}</div>`;
  }

  function updateFromElement(element) {
    if (element.dataset.field) state.doc[element.dataset.field] = element.value;
    if (element.dataset.linkField) state.doc.links[Number(element.dataset.index)][element.dataset.linkField] = element.value;
    if (element.dataset.sectionField) state.doc.sections[Number(element.dataset.index)][element.dataset.sectionField] = element.value;
    if (element.dataset.paragraphField !== undefined) state.doc.sections[Number(element.dataset.index)].paragraphs[Number(element.dataset.childIndex)] = element.value;
    if (element.dataset.itemField !== undefined) state.doc.sections[Number(element.dataset.index)].items[Number(element.dataset.childIndex)] = element.value;
    if (element.dataset.subField) state.doc.sections[Number(element.dataset.index)].subitems[Number(element.dataset.childIndex)][element.dataset.subField] = element.value;
    if (element.dataset.subitemField !== undefined) state.doc.sections[Number(element.dataset.index)].subitems[Number(element.dataset.childIndex)].items[Number(element.dataset.nestedIndex)] = element.value;
    if (element.dataset.sectionLinkField) state.doc.sections[Number(element.dataset.index)].links[Number(element.dataset.childIndex)][element.dataset.sectionLinkField] = element.value;
  }

  async function confirmAction(message) { return typeof window.bcxConfirm === 'function' ? window.bcxConfirm('ยืนยันการแก้ไขเอกสาร', message) : window.confirm(message); }
  async function handleAction(action, button) {
    const index = Number(button.dataset.index); const child = Number(button.dataset.childIndex); const nested = Number(button.dataset.nestedIndex);
    const section = state.doc.sections[index];
    if (action === 'edit') { state.editing = true; renderDocument(); return; }
    if (action === 'cancel') { state.editing = false; renderDocument(); return; }
    if (action === 'add-link') state.doc.links.push({ label: 'ลิงก์ใหม่', url: '/' });
    if (action === 'delete-link' && await confirmAction('ลบลิงก์ส่วนหัวนี้หรือไม่?')) state.doc.links.splice(index, 1);
    if (action === 'add-section') state.doc.sections.push({ id: `section-${Date.now()}`, title: 'หัวข้อใหม่', paragraphs: [], items: [], subitems: [], links: [], attachments: [] });
    if (action === 'delete-section' && await confirmAction('ลบหัวข้อนี้และข้อมูลย่อยทั้งหมดหรือไม่?')) state.doc.sections.splice(index, 1);
    if (action === 'move-up' && index > 0) [state.doc.sections[index - 1], state.doc.sections[index]] = [state.doc.sections[index], state.doc.sections[index - 1]];
    if (action === 'move-down' && index < state.doc.sections.length - 1) [state.doc.sections[index + 1], state.doc.sections[index]] = [state.doc.sections[index], state.doc.sections[index + 1]];
    if (action === 'add-paragraph') section.paragraphs.push('ย่อหน้าใหม่');
    if (action === 'delete-paragraph' && await confirmAction('ลบย่อหน้านี้หรือไม่?')) section.paragraphs.splice(child, 1);
    if (action === 'add-item') section.items.push('ข้อใหม่');
    if (action === 'delete-item' && await confirmAction('ลบข้อนี้หรือไม่?')) section.items.splice(child, 1);
    if (action === 'add-subitem') section.subitems.push({ title: 'ข้อย่อยใหม่', body: '', items: [] });
    if (action === 'delete-subitem' && await confirmAction('ลบข้อย่อยนี้หรือไม่?')) section.subitems.splice(child, 1);
    if (action === 'add-nested') section.subitems[child].items.push('รายการย่อยใหม่');
    if (action === 'delete-nested' && await confirmAction('ลบรายการย่อยนี้หรือไม่?')) section.subitems[child].items.splice(nested, 1);
    if (action === 'add-section-link') section.links.push({ label: 'ลิงก์ใหม่', url: '/' });
    if (action === 'delete-section-link' && await confirmAction('ลบลิงก์นี้หรือไม่?')) section.links.splice(child, 1);
    if (action === 'delete-attachment' && await confirmAction('ลบไฟล์แนบจากเอกสารหรือไม่? (ไฟล์ Storage เดิมจะไม่ถูกลบอัตโนมัติ)')) section.attachments.splice(child, 1);
    if (action !== 'save' && action !== 'upload') renderEditor();
    if (action === 'save') await saveDocument();
    if (action === 'upload') await uploadFile(index, button);
  }

  async function saveDocument() {
    state.saving = true; renderEditor();
    try {
      const payload = normalizeDoc(state.doc); payload.updatedAt = firebase.firestore.FieldValue.serverTimestamp(); payload.updatedBy = firebase.auth().currentUser.uid;
      await firebase.firestore().collection('siteDocuments').doc(DOC_ID).set(payload);
      state.doc = normalizeDoc(payload); state.saving = false; state.editing = false; notify('บันทึกสำเร็จ', 'เอกสารและการแก้ไขถูกเผยแพร่แล้ว', 'success'); renderDocument();
    } catch (error) { state.saving = false; notify('บันทึกไม่สำเร็จ', error.message || 'ตรวจสอบสิทธิ์แอดมินและกติกา Firestore', 'error'); renderEditor(); }
  }

  async function uploadFile(sectionIndex, button) {
    const fileInput = root.querySelector(`[data-file-input="${sectionIndex}"]`); const file = fileInput && fileInput.files[0];
    if (!file) { notify('ยังไม่ได้เลือกไฟล์', 'เลือกภาพหรือ PDF ก่อนอัปโหลด', 'warning'); return; }
    if (file.size > MAX_FILE_BYTES) { notify('ไฟล์ใหญ่เกินไป', 'รองรับไฟล์ไม่เกิน 20 MB', 'error'); return; }
    if (!(file.type.startsWith('image/') || file.type === 'application/pdf')) { notify('ชนิดไฟล์ไม่รองรับ', 'รองรับเฉพาะรูปภาพและ PDF', 'error'); return; }
    button.disabled = true;
    try {
      const safeName = file.name.toLowerCase().replace(/[^a-z0-9._-]+/g, '-');
      const random = window.crypto && crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).slice(2);
      const ref = firebase.storage().ref(`document-assets/${DOC_ID}/${Date.now()}-${random}-${safeName}`);
      const snapshot = await ref.put(file, { contentType: file.type, customMetadata: { docId: DOC_ID } });
      const url = await snapshot.ref.getDownloadURL(); state.doc.sections[sectionIndex].attachments.push({ name: file.name, url, type: file.type, size: file.size });
      notify('อัปโหลดสำเร็จ', 'ไฟล์ถูกเพิ่มในหัวข้อนี้แล้ว กดบันทึกเพื่อเผยแพร่', 'success'); renderEditor();
    } catch (error) { notify('อัปโหลดไม่สำเร็จ', error.message || 'ตรวจสอบสิทธิ์และการเชื่อมต่อ Storage', 'error'); button.disabled = false; }
  }

  root.addEventListener('input', (event) => { if (state.editing && event.target.matches('[data-field],[data-link-field],[data-section-field],[data-paragraph-field],[data-item-field],[data-sub-field],[data-subitem-field],[data-section-link-field]')) updateFromElement(event.target); });
  root.addEventListener('click', (event) => { const button = event.target.closest('[data-action]'); if (button) handleAction(button.dataset.action, button); });

  firebase.auth().onAuthStateChanged((user) => {
    state.admin = Boolean(user && user.emailVerified && (user.email === 'bestcynix@gmail.com' || user.email === 'admin@email.com' || user.getIdTokenResult && false));
    if (user) user.getIdTokenResult().then((token) => { state.admin = Boolean(user.emailVerified && (state.admin || token.claims.admin === true)); renderDocument(); }).catch(() => renderDocument()); else renderDocument();
  });
  firebase.firestore().collection('siteDocuments').doc(DOC_ID).onSnapshot((snapshot) => { if (snapshot.exists) state.doc = normalizeDoc(snapshot.data()); state.remoteLoaded = true; if (!state.editing) renderDocument(); }, (error) => { state.remoteLoaded = true; if (!state.editing) renderDocument(); if (state.admin) notify('อ่านเอกสารจากฐานข้อมูลไม่สำเร็จ', error.message || 'กำลังใช้ข้อมูลเริ่มต้น', 'warning'); });
  injectStyles();
  function injectStyles() {
    const style = document.createElement('style'); style.textContent = `.ms-doc-nav{display:flex;justify-content:space-between;align-items:center;gap:1rem;flex-wrap:wrap;margin-bottom:1.5rem}.ms-brand-link{color:#fff;text-decoration:none;font-weight:800}.ms-doc-hero{text-align:center}.ms-doc-hero h1{color:#fff;margin:.45rem 0;font-size:clamp(1.55rem,4vw,2.35rem)}.ms-kicker{color:var(--accent);font-size:.78rem;font-weight:800;letter-spacing:.1em}.ms-doc-intro{border-top:1px solid rgba(255,255,255,.1);padding-top:.8rem}.ms-subitem{border-left:2px solid var(--accent);padding-left:1rem;margin:1rem 0}.ms-table-wrap{overflow:auto}.ms-attachments{display:grid;grid-template-columns:repeat(auto-fit,minmax(220px,1fr));gap:1rem;margin-top:1rem}.ms-attachment{border:1px solid rgba(255,255,255,.12);border-radius:12px;padding:.7rem;overflow:hidden}.ms-attachment img{display:block;width:100%;max-height:280px;object-fit:contain;margin:.5rem 0}.ms-attachment iframe{width:100%;height:300px;border:0;margin:.5rem 0}.ms-attachment a{color:var(--accent)}.ms-admin-toolbar{position:sticky;bottom:1rem;z-index:5;display:flex;gap:1rem;align-items:center;justify-content:center;flex-wrap:wrap;background:rgba(5,15,29,.96);border:1px solid rgba(50,255,201,.35);border-radius:14px;padding:.8rem;color:var(--muted)}.ms-admin-toolbar button,.ms-editor button{border:1px solid rgba(50,255,201,.3);background:rgba(14,42,65,.95);color:#fff;border-radius:9px;padding:.6rem .85rem;cursor:pointer}.ms-admin-toolbar button,.ms-editor button.primary{background:var(--accent);color:#06131d;border-color:var(--accent);font-weight:800}.ms-editor{padding-bottom:4rem}.ms-editor-head,.ms-editor-section-head{display:flex;justify-content:space-between;gap:1rem;align-items:flex-start;flex-wrap:wrap}.ms-editor-head h1{color:#fff}.ms-editor-card{background:rgba(8,24,42,.9);border:1px solid rgba(50,255,201,.22);border-radius:16px;padding:1rem;margin:1rem 0}.ms-editor-card h2{color:#fff}.ms-editor-card h3{color:var(--accent);margin:1.1rem 0 .5rem}.ms-editor-row{display:grid;grid-template-columns:minmax(0,1fr) auto;gap:.6rem;align-items:end;margin:.5rem 0}.ms-editor-field{display:block;min-width:0}.ms-editor-field span{display:block;color:var(--muted);font-size:.8rem;margin:.25rem 0}.ms-editor input,.ms-editor textarea{box-sizing:border-box;width:100%;border:1px solid rgba(255,255,255,.15);border-radius:8px;background:#071526;color:#fff;padding:.65rem;font:inherit}.ms-editor textarea{resize:vertical;min-height:2.5rem}.ms-editor-subitem{border:1px dashed rgba(50,255,201,.25);border-radius:10px;padding:.75rem;margin:.7rem 0}.ms-editor-row.nested{grid-template-columns:minmax(0,1fr) auto;margin-left:1rem}.ms-mini-btn{padding:.45rem .65rem!important;background:rgba(239,68,68,.18)!important;border-color:rgba(239,68,68,.45)!important}.ms-upload-row{display:flex;gap:.6rem;align-items:center;flex-wrap:wrap}.ms-upload-row input{max-width:100%}.ms-file-row{display:flex;justify-content:space-between;gap:.6rem;align-items:center;padding:.6rem 0;border-bottom:1px solid rgba(255,255,255,.08);color:var(--muted)}.ms-add-section{width:100%;margin:1rem 0;padding:1rem!important}@media(max-width:640px){.ms-editor-row{grid-template-columns:1fr}.ms-editor-row.nested{margin-left:0}.ms-editor-head .ms-editor-actions{width:100%;display:flex}.ms-editor-actions button{flex:1}.ms-card{padding:1rem}.ms-table{min-width:560px}}`; document.head.appendChild(style);
  }
}());
