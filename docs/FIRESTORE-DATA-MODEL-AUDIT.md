# Firestore / Storage CMS audit (prototype)

วันที่ตรวจ: 2026-08-29

## ขอบเขต

การเพิ่ม CMS สำหรับหน้า `mc-skyline-docs` ใช้ Firebase เดิมเพื่อไม่ทิ้งงานเก่า โดยข้อมูลโครงสร้างอยู่ที่ `siteDocuments/mc-skyline` และไฟล์ไบนารีอยู่ใน Storage prefix `document-assets/mc-skyline/` เท่านั้น

## โมเดลข้อมูลใหม่

`siteDocuments/mc-skyline` มี `id`, `title`, `subtitle`, `intro`, `links[]`, `sections[]`, `updatedAt` และ `updatedBy` โดยแต่ละ section รองรับ `paragraphs[]`, `items[]`, `subitems[]`, `table`, `links[]` และ `attachments[]`. จำกัดความยาวระดับเอกสารและจำนวนรายการใน Firestore Rules; ไฟล์ไม่ถูกบันทึกลง Firestore.

## เส้นทางเดิมที่เกี่ยวข้อง

- `joinTeamForms/{docId}`: public read เพื่อแสดงแบบสมัคร; admin write
- `joinTeamApplications/{appId}`: public create เฉพาะข้อมูลสมัครที่ไม่ใช่เอกสารยืนยัน/ข้อมูลการเงิน; admin read/update/delete
- `joinTeamNotifications/{notifId}`: แจ้งเตือนใบสมัคร; admin read/update/delete
- `users/{userId}/notifications/{notifId}`: เจ้าของหรือ admin อ่าน/จัดการตาม rules
- `auditLogs/{logId}`: admin อ่าน; ผู้ใช้ที่ลงชื่อเข้าใช้สร้าง log ของตนเองได้; แก้ไข/ลบไม่ได้

## การตรวจสอบสมมติฐานและภัยที่ต้องกัน

- การอ่านแบบไม่ลงชื่อเข้าใช้ของ `siteDocuments/mc-skyline` เป็นเจตนา เพราะหน้าเอกสารเป็น public; เส้นทางใบสมัครและข้อมูลส่วนตัวไม่ได้เปิดอ่านแบบ public
- anonymous write ไปยัง `siteDocuments` ถูกปฏิเสธ; create/update/delete ต้องเป็น admin ที่อีเมลยืนยันแล้วหรือมี custom claim `admin`
- Storage เขียน/ลบได้เฉพาะ admin; รับเฉพาะ image หรือ PDF ไม่เกิน 20 MB; default catch-all deny
- ใบสมัคร public ถูกกัน top-level และ nested fields ที่เป็นเลขบัตร เอกสารยืนยัน สมุดบัญชี เลขบัญชี และเลขผู้เสียภาษี
- เนื้อหา CMS ถูก escape ก่อน render และ URL ที่ไม่ใช่ `http(s)`, path ภายใน, `#` หรือ `mailto:` จะถูกลดเป็น `#`
- การลบ attachment ออกจาก CMS ไม่ลบไฟล์ Storage เดิมอัตโนมัติ เพื่อป้องกันการลบโดยไม่ตั้งใจ; ควรทำ Storage cleanup แบบ admin-reviewed ภายหลัง
- กฎนี้ยังเป็น prototype: ต้องทดสอบด้วย Firebase Emulator/บัญชี role จริง และตรวจสอบรายชื่อ admin, retention, audit log, backup และการทบทวนสิทธิ์เป็นระยะ

## ผลกระทบจากการ query

หน้า public อ่าน document เดียวแบบ realtime; admin ใช้ document เดียวกันแก้ไขแล้วเขียนกลับทั้งชุด. การเพิ่มจำนวน section/ไฟล์มากขึ้นควรแยก collection หากใกล้ขีดจำกัดขนาดเอกสาร Firestore.
