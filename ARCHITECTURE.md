# 🏛️ คู่มือสถาปัตยกรรมและมาตรฐานโครงสร้างเว็บไซต์ BestCyniX Dev (ARCHITECTURE.md)
> **สำหรับ AI และทีมพัฒนา (Developers):** เอกสารนี้ระบุมาตรฐานโครงสร้างไฟล์ การจัดระเบียบ "หัว - กลาง - ท้าย" และคู่มือ "จะแก้อะไร ต้องไปที่ไฟล์ไหน" ของระบบทั้งหมด

---

## 📂 1. โครงสร้างไฟล์และโฟลเดอร์ (File & Folder Structure)

```text
WEB-Bestcynixdev/
├── public/                     # ไฟล์เว็บทั้งหมดที่ Deploy ขึ้นสู่ Firebase Hosting
│   ├── css/
│   │   ├── style.css           # สไตล์ชีตหลัก (Cyberpunk Theme, UI Components)
│   │   └── responsive-system.css # Responsive contract กลางสำหรับทุกหน้าและทุก breakpoint
│   ├── firestore.rules          # กฎสิทธิ์ Firestore แบบ deny-by-default
│   ├── storage.rules            # กฎสิทธิ์ Storage และการตรวจชนิด/ขนาดไฟล์
│   ├── js/
│   │   ├── auth.js             # ระบบ Firebase Authentication (Google, Email/Pass, Role Check)
│   │   ├── affiliate.js        # เกณฑ์ตรวจลิงก์ Affiliate/ค่าคอมมิชชันกลางทุกหน้าดีล
│   │   ├── chat.js             # วิดเจ็ตแชทสด Real-Time ฝั่งผู้ใช้งาน
│   │   ├── cms-loader.js       # ตัวโหลดและจัดการเนื้อหา CMS หน้าแรกแบบ Real-Time
│   │   ├── discord-profile.js  # ดึงข้อมูลและอวตาร Discord สดของ Dev
│   │   ├── join-team.js        # ฟอร์มรับสมัครงาน, ตรวจสอบอายุ, อัปโหลดรูป, PDPA, นับถอยหลัง
│   │   ├── join-team-admin.js  # ระบบจัดการรับสมัคร, อนุมัติ/ปฏิเสธ, จัดการสัญญา, หัก/คืนโควต้า
│   │   ├── notifications.js    # ระบบกระดิ่งแจ้งเตือน 🔔, กล่อง Notification Drawer, Cyber Confirm Modal
│   │   ├── project-detail.js   # โมดอลและรายละเอียดโปรเจกต์เชิงลึก
│   │   ├── protection.js       # ระบบป้องกัน Security พื้นฐาน
│   │   └── shared-ui.js        # ✨ ศูนย์กลางคอมโพเนนต์ส่วนกลาง (Footer, PDPA, Cookies, Focus Z-Index)
│   │
│   ├── assets/                 # รูปภาพ, โลโก้, และทรัพยากรมีเดีย
│   │   └── photo/              # ภาพโปรเจกต์, โลโก้ bcxlogo2.png, dev-portrait
│   │
│   ├── 🏠 หน้าเว็บสาธารณะ (Public Pages)
│   │   ├── index.html          # หน้าหลักเว็บไซต์ (Home, Showcase, Tech Stack, Milestones)
│   │   ├── join-team.html      # หน้าฟอร์มสมัครร่วมทีม & หน้าปิดรับสมัคร (Cyber Closed Showcase)
│   │   ├── contract.html       # 📄 หน้าเอกสารสัญญาอิเล็กทรอนิกส์ & พิมพ์ PDF (A4 Ready)
│   │   ├── status.html         # หน้าตรวจเช็กสถานะระบบและบริการสด (System Status)
│   │   ├── project.html        # หน้ารายละเอียดโปรเจกต์เดี่ยว
│   │   ├── http-errors.html    # ศูนย์รวมโค้ดและวิธีแก้ HTTP Error Codes
│   │   └── 404.html            # หน้าแจ้งเตือนไม่พบหน้าเว็บ (Custom 404)
│   │
│   ├── 👤 หน้าสมาชิกและบัญชี (Auth & Profile Pages)
│   │   ├── login.html          # หน้าเข้าสู่ระบบ (Google Auth & Email/Password)
│   │   ├── register.html       # หน้าลงทะเบียนสมาชิกใหม่
│   │   ├── forgot-password.html# หน้าขอรีเซ็ตรหัสผ่านทางอีเมล
│   │   └── profile.html        # หน้าโปรไฟล์ผู้ใช้, ล็อกอินสถานะ, ตรวจสอบอีเมล, แก้ไขข้อมูล
│   │
│   ├── ⚡ หน้าผู้ดูแลระบบ (Admin Portals)
│   │   ├── admin-dashboard.html# ศูนย์ควบคุมหลักของผู้ดูแลระบบ & สถิติรวม
│   │   ├── admin-join-team.html# ระบบบริหารจัดการรับสมัครงาน, พิจารณาใบสมัคร, ตั้งเวลา
│   │   ├── team-workspace.html # พื้นที่ทำงานส่วนตัวแยกกลุ่ม: แชท เอกสาร ประชุม สมาชิก
│   │   ├── admin-content.html  # ระบบ CMS จัดการโปรเจกต์, สปอยล์, แผนพัฒนา
│   │   ├── admin-chats.html    # ระบบห้องแชทสด Real-Time ตอบข้อความลูกค้า
│   │   └── admin-users.html    # ระบบจัดการสมาชิกและกำหนดสิทธิ์ (User/Admin Roles)
│   │
│   └── 📚 ศูนย์เอกสารและนโยบาย (Documentation & Policy Pages)
│       ├── docs.html           # ศูนย์รวมเอกสาร คู่มือ และนโยบายทั้งหมด
│       ├── work-policy.html    # นโยบายและระเบียบการร่วมทีม (Work Policy & NDA)
│       ├── pdpa.html           # นโยบายคุ้มครองข้อมูลส่วนบุคคล (PDPA Law Compliance)
│       ├── privacy.html        # นโยบายความเป็นส่วนตัว (Privacy Policy)
│       ├── terms.html          # ข้อตกลงและเงื่อนไขการใช้งาน (Terms of Service)
│       └── cookies.html        # นโยบายการใช้คุกกี้ (Cookies Policy)
│
├── functions/                  # Firebase server-side probes and scheduled telemetry writer
│   ├── index.js                # SkylineBOT/Discord/Web/Firestore/Chat probes + status API
│   └── package.json            # Node 20 Cloud Functions dependencies
├── firebase.json               # การตั้งค่า Firebase Hosting, Clean URLs, Cache-Control, Security Headers
├── firestore.rules             # กฎความปลอดภัย Cloud Firestore
└── ARCHITECTURE.md             # เอกสารอธิบายสถาปัตยกรรมนี้
```

---

## 🧩 2. มาตรฐานส่วนประกอบ "หัว - กลาง - ท้าย" (Global Component Standards)

### 1) 🔝 ส่วนหัว (Header / Navigation Bar)
- **เดสก์ท็อป ($\ge 860\text{px}$):**
  - แสดงโลโก้แบรนด์ `bcxlogo2.png` + ชื่อทางซ้าย
  - แถบเมนูปุ่ม Pill Bar แนวนอน (`.desktop-nav-links`) ชิดขวา
  - ปุ่มกระดิ่งแจ้งเตือน `🔔` (จัดการโดย `notifications.js`)
- **มือถือและแท็บเล็ต ($< 860\text{px}$):**
  - แสดงเฉพาะ โลโก้ + กระดิ่ง `🔔` + ปุ่มแฮมเบอร์เกอร์ `🍔` (`#adminNavToggle` / `.nav-toggle`)
  - **Cyber Navigation Drawer (`#adminNavDrawer` / `.mobile-nav-drawer`):** เมนูสไลด์จากขวา มีหมวดหมู่พร้อมไอคอน ลิงก์กลับหน้าหลัก, Dashboard, สมัครงาน, โปรไฟล์ และศูนย์เอกสาร
  - มี Backdrop Overlay (`.mobile-drawer-overlay`) กดตรงไหนเพื่อปิดเมนูทันที

### 2) 💻 ส่วนกลาง (Body / Layout & Theme)
- **ธีมหลัก:** Cyberpunk Dark Mode (`#050b14`, `#0a182a`) ขลิบขอบนีออนมินต์ (`#32ffc9`) และฟ้าไซเบอร์ (`#0284c7`)
- **การจัดระยะขอบ:** ใช้ `.container` หรือ `.policy-container` (ความกว้างสูงสุด $940\text{px} - 1200\text{px}$) จัดกึ่งกลางอัตโนมัติ
- **ฟอร์มและการป้อนข้อมูล:** ใช้คลาส `.jt-input`, `.jt-select`, `.jt-textarea` โทนสีมืด มนขอบ $10\text{px}$ และมี Focus Glow

### 3) 🔻 ส่วนท้าย (Footer & Global Overlays)
- **Global Shared Footer:** โหลดผ่าน `public/js/shared-ui.js` อัตโนมัติ:
  - **คอลัมน์ 1:** โลโก้, สโลแกน, แถบสถานะระบบสด (100% Online)
  - **คอลัมน์ 2 (ระบบและบริการ):** โปรเจกต์, สแต็กเทคโนโลยี, แชทสด, Status, HTTP Errors
  - **คอลัมน์ 3 (นโยบายและความปลอดภัย):** Docs, Work Policy, Privacy, Terms, Cookies, PDPA
  - **คอลัมน์ 4 (แผนผังและบัญชี):** Join Team, Status, Login, Register, Profile
  - **แถบล่าง:** ลิขสิทธิ์และปี พ.ศ. อัปเดตอัตโนมัติ (`© 2021 - 2026 BestCyniX Dev`) และป้าย Cloudflare DDoS Protection
- **Global Modals:**
  - `showCyberConfirm(opts)` — โมดอลยืนยันสไตล์นีออน (แทน `confirm()` ของเบราว์เซอร์)
  - `cookiePreferencesModal` — โมดอลปรับแต่งคุกกี้ตามกฎหมาย PDPA
  - `pdpa-banner` — แถบแจ้งเตือนความยินยอม PDPA ด้านล่างหน้าจอ

---

## 🎯 3. "จะแก้อะไร ต้องไปที่ไฟล์ไหน" (Quick Reference Cheat Sheet)

| สิ่งที่ต้องการแก้ไข / ปรับปรุง | ไฟล์ที่ต้องแก้ไข | คำอธิบาย |
| :--- | :--- | :--- |
| **สไตล์หลัก, ธีมสี, ฟอนต์, ปุ่ม, Drawer CSS** | `public/css/style.css` | รวม CSS ทุกส่วน ดีไซน์โทนสี ตัวแปร `:root` และ Responsive Breakpoints |
| **Footer ส่วนท้าย, แถบ PDPA, คุกกี้ ทุกหน้า** | `public/js/shared-ui.js` | แก้ที่นี่ที่เดียว อัปเดตส่วนท้ายและแบนเนอร์ยินยอมพร้อมกันทุกหน้าเว็บ |
| **กระดิ่งแจ้งเตือน 🔔, กล่องแจ้งเตือน, ป๊อปอัปแจ้งเตือน** | `public/js/notifications.js` | จัดการ Real-Time Notification Bell, Drawer แจ้งเตือน และ `showCyberConfirm` |
| **ระบบรับสมัครงาน (ฝั่งผู้สมัคร) & รูปถ่าย** | `public/join-team.html`<br/>`public/js/join-team.js` | ฟอร์มกรอกข้อมูล, อัปโหลดรูปหน้าตรง, นับถอยหลังเปิด-ปิด, เช็กอายุ |
| **ระบบหลังบ้านรับสมัคร (Admin) & การอนุมัติ** | `public/admin-join-team.html`<br/>`public/js/join-team-admin.js` | พิจารณาใบสมัคร, เหตุผลปฏิเสธ/แก้ไข, จัดการโควต้าตำแหน่ง, ตั้งเวลา Auto |
| **หน้าเอกสารสัญญาอิเล็กทรอนิกส์ & พิมพ์ PDF** | `public/contract.html` | ตัวแสดงสัญญา A4, สัญญาพิมพ์ไม่ล้น, แสดงคำถามและรูปผู้สมัครครบถ้วน |
| **เนื้อหาหน้าแรก, ผลงาน, Roadmap, สปอยล์ (CMS)** | `public/js/cms-loader.js`<br/>`public/admin-content.html` | โหลดและจัดการข้อมูลโปรเจกต์หน้าแรกจาก Firestore แบบ Real-Time |
| **ระบบแชทสดติดต่อ Dev (Live Chat)** | `public/js/chat.js`<br/>`public/admin-chats.html` | วิดเจ็ตแชทฝั่งลูกค้า และระบบตอบแชทของ Dev |
| **ระบบล็อกอิน, สมัครสมาชิก, สิทธิ์ Admin** | `public/js/auth.js`<br/>`public/admin-users.html` | จัดการ Firebase Auth, Google Login, และเช็กสิทธิ์ Role `admin` / `user` |
| **ดีล Affiliate และลิงก์สร้างค่าคอมมิชชัน** | `public/js/affiliate.js`<br/>`AFFILIATE-OPERATIONS.md` | กรอง tracking URL, ตรวจสัญญาณค่าคอมมิชชัน และกำหนด contract สำหรับระบบ Sync ฝั่ง server |
| **สถานะระบบและ Uptime จริง** | `functions/index.js`<br/>`public/js/status-monitor.js` | ตรวจบริการฝั่ง server, บันทึก current/history/daily และแสดงผลโดยไม่สร้างค่าจำลอง |
| **ศูนย์เอกสาร, นโยบาย และข้อตกลงต่างๆ** | `public/docs.html`<br/>`public/work-policy.html`<br/>`public/pdpa.html` | หน้าเอกสารและนโยบายข้อบังคับทางการทั้งหมด |
| **พื้นที่ทำงานแต่ละกลุ่ม/บริษัท** | `public/team-workspace.html`<br/>`public/js/team-workspace.js`<br/>`firestore.rules` | แชทส่วนตัว เอกสาร นัดหมาย สมาชิก ยศ และลิงก์เชิญ โดยตรวจสมาชิกจาก Firestore |

---

## 🗄️ 4. ฐานข้อมูล Firestore (Database Collections Map)

- `joinTeamForms/default` — การตั้งค่าฟอร์มรับสมัครหลัก, ตำแหน่งงาน (`positions`), โควต้า (`slotsLeft`), กำหนดการเปิดปิด (`statusConfig`)
- `joinTeamApplications` — ข้อมูลใบสมัครของผู้สมัคร, รูปถ่าย, สถานะ (`status`), เลขอ้างอิงสัญญา (`contractRefNo`), คำตอบคำถามเพิ่มเติม
- `joinTeamNotifications` — ประวัติการแจ้งเตือนเกี่ยวกับระบบรับสมัครงาน
- `notifications` — การแจ้งเตือนระบบรวม (ใบสมัคร, แชท, ความปลอดภัย)
- `users` — ข้อมูลโปรไฟล์สมาชิก, เบอร์โทร, Bio, Role (`admin` หรือ `user`)
- `chats` — ข้อความแชทสดระหว่างลูกค้าและทีมงาน Dev
- `cms/content` — ข้อมูลโปรเจกต์, Roadmap, สปอยล์ที่แสดงในหน้าแรก
