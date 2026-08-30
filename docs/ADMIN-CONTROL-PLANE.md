# Dev Admin control plane

หน้า `/admin-users` เป็นศูนย์จัดการผู้ใช้และข้อมูลประกอบเอกสารสำหรับผู้ดูแลที่ผ่าน `isAdmin()` เท่านั้น

## ผู้ใช้

เพิ่มฟิลด์บน `users/{uid}` ได้โดยไม่กระทบฟิลด์เดิม:

- `companyId`, `companyName` — บริษัท/กลุ่มที่สังกัด
- `teamRole` — ยศหรือตำแหน่งในกลุ่ม
- `employmentStatus` — `active`, `suspended`, `exited`, `terminated`
- `employmentNote`, `employmentChangedAt`, `employmentChangedBy`

ปุ่มลบในหน้านี้ลบเฉพาะโปรไฟล์ Firestore; ไม่ลบบัญชี Firebase Auth และไม่ลบสัญญา เพื่อป้องกันข้อมูลหลักฐานสูญหายโดยไม่ตั้งใจ

## สัญญาและประกาศ

- `joinTeamApplications` เป็นแหล่งข้อมูลใบสมัคร/สัญญาเดิม
- `employmentRecords/{id}` เก็บประวัติการเปลี่ยนสถานะสำหรับ Dev เท่านั้น
- `adminAnnouncements/{id}` เป็นประกาศเจาะจงผู้ใช้ โดยผู้รับอ่านได้เฉพาะของตนเอง
- `users/{uid}/notifications/{id}` ใช้ส่งรายการแจ้งเตือนเข้าเว็บและแอปแจ้งเตือนเดิม

## บริษัทและลายเซ็น

- `adminCompanyProfiles/{companyId}` เก็บชื่อ โลโก้ ตรา URL และลายเซ็นเริ่มต้น
- `devSignatures/{signatureId}` เก็บลายเซ็น Dev กลางและข้อมูลผู้ลงนาม
- `/contract` อ่านลายเซ็นรายการที่ `isDefault == true` หากไม่มีสิทธิ์หรือไม่มีรายการ จะใช้ fallback ที่ไม่ทำให้เอกสารล่ม

ข้อมูลเอกสารประจำตัว บัญชีธนาคาร และเลขภาษีไม่ควรถูกส่งผ่านฟอร์ม Public ตามกฎเดิมของ `joinTeamApplications`.
