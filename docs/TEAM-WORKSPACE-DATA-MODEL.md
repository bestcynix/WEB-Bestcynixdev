# Team Workspace Data Model

พื้นที่ทำงานทีมเป็นระบบใหม่ที่แยกจาก `chats` (แชทติดต่อ Dev) และ `joinTeamApplications` (ใบสมัคร) เพื่อไม่ให้ข้อมูลเก่าถูกย้ายหรือเขียนทับ

## Routes

- `/team-workspace` — พื้นที่ทำงานสำหรับสมาชิกที่เข้าสู่ระบบ
- `/team-workspace?invite=<inviteId>` — ตรวจสอบและเข้าร่วมด้วยลิงก์เชิญ
- `/team-workspace?group=<groupId>` — เปิดกลุ่มที่เป็นสมาชิกอยู่โดยตรง

## Firestore collections

```text
teamGroups/{groupId}
  id, name, organization, description, imageUrl
  ownerUid, managerUids[], memberUids[], active
  teamGroups/{groupId}/members/{uid}
    uid, displayName, email, photoURL, role, online, lastSeen, joinedAt
  teamGroups/{groupId}/messages/{messageId}
    senderUid, senderName, senderPhoto, senderOnline, text
    attachmentUrl, attachmentType, attachmentName, replyTo, pinned, createdAt
  teamGroups/{groupId}/documents/{documentId}
    title, description, url, createdBy, createdAt, updatedAt
  teamGroups/{groupId}/meetings/{meetingId}
    title, url, startsAt, createdBy, responses{}, createdAt

teamInvites/{inviteId}
  id, groupId, groupName, createdBy, active, expiresAt, uses, maxUses, createdAt
```

## Authority and security

- `members/{uid}` เป็นแหล่งอำนาจจริงของสมาชิกและยศ; `memberUids[]` เป็นดัชนีสำหรับค้นหารายชื่อกลุ่มเท่านั้น
- `owner`, `admin`, `lead` จัดการกลุ่ม สมาชิก เอกสาร นัดหมาย และปักหมุดข้อความได้
- สมาชิกทั่วไปอ่านข้อมูลของกลุ่มที่ตนเป็นสมาชิก ส่งข้อความ อัปโหลด media และตอบรับ/ปฏิเสธนัดหมายได้
- Public invite ต้องล็อกอินก่อน และกฎจะเพิ่มสมาชิกได้เฉพาะ UID ของผู้ใช้ที่ล็อกอินพร้อมเพิ่มจำนวนใช้ทีละ 1
- ไฟล์แชทใช้ `team-attachments/{groupId}/...` จำกัดรูป/วิดีโอ 25 MB และอ่านได้เฉพาะสมาชิก

## Existing systems kept intact

- สมัครงาน/อนุมัติ/สัญญา: `joinTeamApplications`, `joinTeamNotifications`, `contract.html`
- เอกสารสาธารณะ Mc-Skyline: `siteDocuments/mc-skyline`, `mc-skyline-docs.html`
- แชทติดต่อ Dev: `chats/{chatId}` และ `admin-chats.html`

## Next integrations

- Push notification เมื่อปิดหน้าเว็บ/แอปต้องเพิ่ม FCM token registration และ server sender ที่มี credential ของเจ้าของระบบ
- การสร้าง Google Meet อัตโนมัติต้องเพิ่ม Google Calendar OAuth scope; รุ่นปัจจุบันเก็บและตรวจสิทธิ์ลิงก์ประชุมที่หัวหน้ากลุ่มสร้างไว้แล้ว
