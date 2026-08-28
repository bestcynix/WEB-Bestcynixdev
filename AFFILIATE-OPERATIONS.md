# Affiliate Operations Contract

เอกสารนี้เป็นมาตรฐานกลางของระบบดีล เพื่อให้ผู้พัฒนาหรือ AI ตัวอื่นทำงานต่อได้โดยไม่ทำให้ลิงก์ที่สร้างรายได้ปะปนกับลิงก์ทั่วไป

## กติกาการแสดงผล

- แหล่งข้อมูลเดิมยังเก็บอยู่ใน `public/data/` และไม่ถูกลบ แต่รายการที่ไม่ผ่านเกณฑ์จะไม่ถูกนำมาแสดงเป็นปุ่มซื้อ
- รายการที่แสดงต้องมี `active !== false` และต้องมี `affiliateUrl` หรือ `affiliateLink` แบบ HTTPS
- โฮสต์ tracking ที่อนุญาตในปัจจุบันคือ `s.shopee.co.th`, `s.lazada.co.th`, `c.lazada.co.th` และ `aff.priceza.com`
- ต้องมีสัญญาณค่าคอมมิชชันอย่างน้อยหนึ่งอย่าง: `commissionEligible: true`, `commissionStatus: "verified"` หรือ `commissionRate`/`rate` มากกว่า 0
- ห้ามใช้ `productUrl`, โฮมเพจร้านค้า หรือ URL ตรงเป็นลิงก์ซื้อแทน `affiliateUrl`
- ถ้า API ล้มเหลว ลิงก์หมดอายุ หรือไม่ยืนยันค่าคอมมิชชันได้ ให้ปิดรายการนั้น (`active: false`) และแสดง empty state แทนการเดาลิงก์

ตัวกรองและการติดตามคลิกอยู่ที่ `public/js/affiliate.js` ทุกหน้าดีลต้องใช้โมดูลนี้ร่วมกัน

## สัญญาข้อมูลสำหรับระบบ Sync

```json
{
  "id": "provider-item-id",
  "platform": "shopee|lazada|gowabi|agoda|priceza",
  "name": "ชื่อสินค้า/บริการ",
  "image": "https://...",
  "price": "฿0",
  "rawPrice": 0,
  "productUrl": "https://...",
  "affiliateUrl": "https://approved-tracking-host/...",
  "commissionRate": "2%",
  "commissionEligible": true,
  "commissionStatus": "verified",
  "active": true,
  "updatedAt": "2026-08-28T00:00:00.000Z"
}
```

## สถานะข้อมูลปัจจุบัน

- Shopee: 100 รายการเดิม; รายการที่มี affiliate tracking และค่าคอมมิชชันผ่านตัวกรองได้ 99 รายการ อีก 1 รายการถูกซ่อนเพราะ URL เป็นลิงก์สินค้าโดยตรง
- Lazada: 24 รายการเดิม; ผ่านตัวกรอง 24 รายการ
- Priceza: 20 รายการเดิม; ยังไม่แสดงจนกว่าจะมีฟิลด์ยืนยันค่าคอมมิชชัน
- GoWabi และ Agoda: ข้อมูลเดิมยังเก็บไว้ แต่ยังไม่แสดงดีลจนกว่าจะได้รับ affiliate link จากโปรแกรมที่อนุมัติ
- หน้า Affiliate Hub ใช้ตัวกรองเดียวกัน จึงไม่สร้างลิงก์สำรองที่อาจไม่สร้างค่าคอมมิชชัน

## การเปิดใช้งาน API อัตโนมัติ

การ sync จริงต้องทำฝั่ง server เช่น Firebase Functions/Cloud Run และเก็บ API key/secret ใน Secret Manager เท่านั้น ห้ามใส่ secret ใน `public/`, JSON หรือ JavaScript ที่ส่งให้ผู้เข้าชม

ตัว sync ควรทำตามลำดับนี้:

1. ขอข้อมูลจาก API/ฟีดของพาร์ตเนอร์ที่บัญชีได้รับอนุมัติ
2. แปลงข้อมูลให้ตรงกับสัญญาด้านบน
3. ตรวจ `affiliateUrl`, โฮสต์, สถานะค่าคอมมิชชัน และวันอัปเดต
4. เขียนเฉพาะรายการที่ผ่าน validation ลงฐานข้อมูล/ฟีดสาธารณะ
5. ปิดรายการเก่าที่หมดอายุหรือยืนยันไม่ได้ และเก็บเหตุผลไว้ใน log ฝั่ง server

ขณะนี้โปรเจกต์ยังไม่มี server-side provider credentials หรือ endpoint contract ที่ใช้งานได้ จึงเปิดใช้เฉพาะ eligibility gate และโครงสร้างพร้อมต่อ API อย่างปลอดภัยแล้ว ไม่ควรสร้างข้อมูลหรือเปอร์เซ็นต์คอมมิชชันขึ้นเอง

## เช็กลิสต์ก่อน deploy

- ตรวจว่าไม่มี secret ใน `public/`
- ตรวจว่า card ทุกใบใช้ `BestCynixAffiliate.getPurchaseUrl()`
- ทดสอบว่า URL ทุกปุ่มเป็น tracking host ที่อนุญาต
- ทดสอบ empty state ของผู้ให้บริการที่ยังไม่มี affiliate link
- ทดสอบ mobile/tablet/desktop และไม่ให้เกิด horizontal overflow
