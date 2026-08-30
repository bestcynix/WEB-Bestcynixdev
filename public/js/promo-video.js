(function () {
  'use strict';

  const syncSoundButton = (video, button) => {
    const muted = video.muted || video.volume === 0;
    button.setAttribute('aria-pressed', String(!muted));
    button.textContent = muted ? '🔇 เปิดเสียง' : '🔊 ปิดเสียง';
  };

  const initialisePromoVideo = (root) => {
    const video = root.querySelector('video');
    const button = root.querySelector('[data-promo-sound-toggle]');
    const status = root.querySelector('[data-promo-video-status]');
    if (!video || !button) return;

    syncSoundButton(video, button);

    button.addEventListener('click', () => {
      video.muted = !video.muted;
      if (!video.muted && video.volume === 0) video.volume = 0.85;
      syncSoundButton(video, button);

      // A user gesture is allowed to start playback with audio in modern browsers.
      if (video.paused) {
        const playRequest = video.play();
        if (playRequest && typeof playRequest.catch === 'function') playRequest.catch(() => {});
      }
    });

    video.addEventListener('volumechange', () => syncSoundButton(video, button));
    video.addEventListener('playing', () => {
      if (status) status.textContent = video.muted ? 'กำลังเล่นแบบเงียบ • กด “เปิดเสียง” เพื่อฟังเสียง' : 'กำลังเล่นพร้อมเสียง';
    });
    video.addEventListener('pause', () => {
      if (status) status.textContent = 'หยุดชั่วคราว • กดปุ่มเล่นบนวิดีโอเพื่อเริ่มต่อ';
    });
    video.addEventListener('error', () => {
      if (status) status.textContent = 'ไม่สามารถโหลดคลิปได้ชั่วคราว กรุณารีเฟรชหน้าอีกครั้ง';
    });
  };

  const boot = () => document.querySelectorAll('[data-promo-video]').forEach(initialisePromoVideo);
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot);
  else boot();
})();
