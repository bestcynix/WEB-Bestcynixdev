/**
 * BestCyniX Dev - Soft Protection & System Logger
 * อนุญาตให้คลิกขวาใช้งานได้ตามปกติ พร้อมระบบรักษาความปลอดภัยเบื้องต้น
 */

(function () {
  'use strict';

  // 1. Image & Asset Drag Soft Guard
  document.addEventListener('dragstart', (e) => {
    if (e.target.nodeName === 'IMG' || e.target.nodeName === 'A') {
      // Prevent accidental drag
    }
  });

  // 2. Console Security Notice
  console.log(
    '%c⚡ BESTCYNIX DEV • FULL-STACK ENGINEERING ⚡',
    'color: #32ffc9; font-size: 18px; font-weight: bold; background: #050b14; padding: 8px 16px; border: 2px solid #32ffc9; border-radius: 8px;'
  );
  console.log(
    '%cยินดีต้อนรับสู่ระบบของ BestCyniX Dev • สนใจพัฒนาระบบหรือร่วมงาน ติดต่อได้ที่ contact@bestcynix.dev',
    'color: #38bdf8; font-size: 12px; font-weight: 500;'
  );
})();
