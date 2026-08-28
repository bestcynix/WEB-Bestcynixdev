/**
 * BestCyniX Dev - Main UI Controller
 * Scroll Reveal Observer, Particle Layer, 3D Card Tilt Effects, Mobile Nav, Filters, Search & Countdown Timer
 */

// Global Dynamic Z-Index Manager: whichever component is opened or clicked last comes to the front
let _highestZIndex = 10010;
window.bringToFront = function (el) {
  if (!el) return;
  _highestZIndex += 2;
  el.style.zIndex = _highestZIndex;
};

(function () {
  'use strict';

  // 1. Scroll Progress Bar & Back to Top
  const scrollProgress = document.getElementById('scrollProgress');
  const btnBackToTop = document.getElementById('btnBackToTop');

  window.addEventListener('scroll', () => {
    const scrollTop = window.scrollY || document.documentElement.scrollTop;
    const docHeight = document.documentElement.scrollHeight - document.documentElement.clientHeight;
    const scrolled = (scrollTop / docHeight) * 100;

    if (scrollProgress) {
      scrollProgress.style.width = scrolled + '%';
    }

    if (btnBackToTop) {
      if (scrollTop > 400) {
        btnBackToTop.classList.add('active');
      } else {
        btnBackToTop.classList.remove('active');
      }
    }
  });

  if (btnBackToTop) {
    btnBackToTop.addEventListener('click', () => {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    });
  }

  // 2. Scroll Reveal Observer (แอนิเมชันเลื่อนขึ้นลงแสดงผล)
  const setupScrollReveal = () => {
    const revealElements = document.querySelectorAll('.reveal-on-scroll:not(.is-revealed)');
    if (!('IntersectionObserver' in window)) {
      revealElements.forEach(el => el.classList.add('is-revealed'));
      return;
    }

    const observer = new IntersectionObserver((entries, obs) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-revealed');
          obs.unobserve(entry.target);
        }
      });
    }, {
      rootMargin: '0px 0px -40px 0px',
      threshold: 0.1
    });

    revealElements.forEach(el => observer.observe(el));
  };

  window.triggerScrollReveal = setupScrollReveal;

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', setupScrollReveal);
  } else {
    setupScrollReveal();
  }

  // 3. Interactive 3D Tilt Effect on Dev Avatar Card & Featured Projects
  const init3DTilt = () => {
    const tiltCards = document.querySelectorAll('.hero-dev-card, .project-card, .history-card');
    tiltCards.forEach((card) => {
      card.addEventListener('mousemove', (e) => {
        const rect = card.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        const centerX = rect.width / 2;
        const centerY = rect.height / 2;

        const rotateX = ((y - centerY) / centerY) * -5;
        const rotateY = ((x - centerX) / centerX) * 5;

        card.style.transform = `perspective(1000px) rotateX(${rotateX.toFixed(2)}deg) rotateY(${rotateY.toFixed(2)}deg) translateY(-4px)`;
      });

      card.addEventListener('mouseleave', () => {
        card.style.transform = '';
      });
    });
  };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init3DTilt);
  } else {
    init3DTilt();
  }

  // 4. Desktop Dropdown Triggers (Mobile Drawer handled universally by shared-ui.js)
  document.querySelectorAll('.nav-dropdown-trigger').forEach((trigger) => {
    trigger.addEventListener('click', (e) => {
      e.stopPropagation();
      const parentGroup = trigger.closest('.nav-dropdown-group');
      const isActive = parentGroup.classList.contains('active');
      document.querySelectorAll('.nav-dropdown-group').forEach(grp => grp.classList.remove('active'));
      if (!isActive) {
        parentGroup.classList.add('active');
      }
    });
  });

  document.addEventListener('click', (e) => {
    document.querySelectorAll('.nav-dropdown-group').forEach(grp => {
      if (!grp.contains(e.target)) {
        grp.classList.remove('active');
      }
    });
  });

  // 5. Project Filter Tabs & Search
  window._currentProjectFilter = 'all';
  const filterPills = document.querySelectorAll('.p-filter-pill');
  const searchInput = document.getElementById('projectSearchInput');

  filterPills.forEach((btn) => {
    btn.addEventListener('click', () => {
      filterPills.forEach((b) => b.classList.remove('active'));
      btn.classList.add('active');
      window._currentProjectFilter = btn.dataset.filter || 'all';
      window._projectCurrentPage = 1;
      if (window.BestCynixCMS && window.BestCynixCMS.renderProjects) {
        window.BestCynixCMS.renderProjects();
        setTimeout(init3DTilt, 100);
      }
    });
  });

  if (searchInput) {
    searchInput.addEventListener('input', () => {
      window._projectCurrentPage = 1;
      if (window.BestCynixCMS && window.BestCynixCMS.renderProjects) {
        window.BestCynixCMS.renderProjects();
        setTimeout(init3DTilt, 100);
      }
    });
  }

  // 6. Release Countdown Timer Loop
  const updateCountdowns = () => {
    const pills = document.querySelectorAll('.countdown-pill[data-release]');
    const now = new Date().getTime();

    pills.forEach((pill) => {
      const targetStr = pill.getAttribute('data-release');
      if (!targetStr) return;

      const target = new Date(targetStr).getTime();
      const diff = target - now;

      if (diff <= 0) {
        pill.textContent = '🚀 เปิดตัวอย่างเป็นทางการแล้ว!';
        pill.style.borderColor = '#4ade80';
        pill.style.color = '#4ade80';
      } else {
        const days = Math.floor(diff / (1000 * 60 * 60 * 24));
        const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        const mins = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
        const secs = Math.floor((diff % (1000 * 60)) / 1000);

        pill.textContent = `⏳ เปิดตัวใน: ${days}วัน ${hours}ชม. ${mins}น. ${secs}วิ`;
      }
    });
  };

  setInterval(updateCountdowns, 1000);

  // 7. Contact Form Submission
  const contactForm = document.getElementById('contactForm');
  if (contactForm) {
    contactForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const name = document.getElementById('contactName')?.value.trim();
      const email = document.getElementById('contactEmail')?.value.trim();
      const subject = document.getElementById('contactSubject')?.value.trim() || 'ติดต่อสอบถามทั่วไป';
      const message = document.getElementById('contactMessage')?.value.trim();
      const btn = document.getElementById('btnSubmitContact');

      if (!name || !email || !message) {
        showCyberToast('⚠️ กรุณากรอกชื่อ, อีเมลสำหรับตอบกลับ และข้อความให้ครบถ้วน', '', 'warning');
        return;
      }

      if (btn) {
        btn.disabled = true;
        btn.innerHTML = '<span>⚡ กำลังส่งข้อความถึงทีมงาน...</span>';
      }

      try {
        if (typeof firebase !== 'undefined' && firebase.apps.length) {
          const db = firebase.firestore();
          const auth = firebase.auth();
          const user = auth.currentUser;
          const anonChatId = localStorage.getItem('bestcynix_anon_chat_id') || ('anon_' + Math.random().toString(36).substring(2, 9));

          // 1. Add to contactMessages collection for Dev Inbox
          await db.collection('contactMessages').add({
            name,
            email,
            subject,
            message,
            chatId: user?.uid || anonChatId,
            status: 'unread',
            createdAt: firebase.firestore.FieldValue.serverTimestamp()
          });

          // 2. Create the chat thread before adding its message so security rules
          // can verify the participant on both writes.
          const activeId = user?.uid || anonChatId;
          const chatRef = db.collection('chats').doc(activeId);
          await chatRef.set({
            userId: activeId,
            userName: name,
            userEmail: email,
            lastMessage: `✉️ ติดต่อ: ${subject}`,
            lastSenderRole: 'user',
            status: 'unanswered',
            tag: 'เว็บไซต์',
            updatedAt: firebase.firestore.FieldValue.serverTimestamp()
          }, { merge: true });

          await chatRef.collection('messages').add({
            text: `✉️ [ข้อความติดต่อด่วน]\n📌 เรื่อง: ${subject}\n👤 ผู้ส่ง: ${name} (${email})\n💬 ข้อความ: ${message}`,
            senderId: activeId,
            senderName: name,
            senderRole: 'user',
            createdAt: firebase.firestore.FieldValue.serverTimestamp()
          });

        }

        showCyberToast('✓ ส่งข้อความติดต่อสำเร็จแล้ว!', `ทีมงาน BestCyniX Dev ได้รับเรื่องเรียบร้อย และจะตอบกลับไปยังอีเมล: ${email} โดยเร็วที่สุด ✨`, 'success');
        contactForm.reset();
      } catch (err) {
        showCyberToast('เกิดข้อผิดพลาดในการส่งข้อความ', err.message, 'error');
      } finally {
        if (btn) {
          btn.disabled = false;
          btn.innerHTML = '<span>➤ ส่งข้อความติดต่อถึง Dev ทันที</span>';
        }
      }
    });
  }
})();
