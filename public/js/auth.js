/**
 * BestCyniX Dev - Authentication & User State Controller
 * Handles Auth status, User Pill Dropdown, Cookie Consent, and Live Site Metrics
 */

(function () {
  'use strict';

  if (typeof firebase === 'undefined' || !firebase.apps.length) return;

  const auth = firebase.auth();
  const db = firebase.firestore();

  const navGuestButtons = document.getElementById('navGuestButtons');
  const userPillWrap = document.getElementById('userPillWrap');
  const userPillName = document.getElementById('userPillName');
  const userPillAvatar = document.getElementById('userPillAvatar');
  const btnUserMenu = document.getElementById('btnUserMenu');
  const userDropdownMenu = document.getElementById('userDropdownMenu');
  const btnDevPortal = document.getElementById('btnDevPortal');
  const btnOpenDevPortalFromMenu = document.getElementById('btnOpenDevPortalFromMenu');
  const btnOpenDevChatsFromMenu = document.getElementById('btnOpenDevChatsFromMenu');
  const btnOpenDevUsersFromMenu = document.getElementById('btnOpenDevUsersFromMenu');
  const btnLogout = document.getElementById('btnLogout');

  window._isDevAdminLoggedIn = false;
  let adminMetricsStarted = false;

  const initAdminMetrics = () => {
    if (!window._isDevAdminLoggedIn || adminMetricsStarted) return;
    adminMetricsStarted = true;

    // Do not query the protected users/chats collections from a public page.
    // Admin UI state can be broader than Firestore rules, so those listeners
    // produced permission-denied errors for verified accounts without an
    // admin custom claim. The aggregate site_stats document is intentionally
    // public-readable and is the safe source for footer counters.
    db.collection('site_stats').doc('metrics').onSnapshot((snapshot) => {
      const data = snapshot.exists ? snapshot.data() : {};
      const elUsers = document.getElementById('footerTotalUsers');
      const elChats = document.getElementById('footerTotalChats');
      if (elUsers && data.totalUsers != null) elUsers.textContent = Number(data.totalUsers).toLocaleString();
      if (elChats && data.totalChats != null) elChats.textContent = Number(data.totalChats).toLocaleString();
    }, () => {
      // The footer is non-critical; keep its fallback text without logging a
      // noisy unhandled snapshot error in the browser console.
    });
  };

  // 1. Toggle User Dropdown
  if (btnUserMenu && userDropdownMenu) {
    btnUserMenu.addEventListener('click', (e) => {
      e.stopPropagation();
      const isActive = userDropdownMenu.classList.toggle('active');
      if (isActive && window.bringToFront) {
        const topbar = document.querySelector('.topbar');
        if (topbar) window.bringToFront(topbar);
        window.bringToFront(userDropdownMenu);
      }
    });

    document.addEventListener('click', (e) => {
      if (!userPillWrap.contains(e.target)) {
        userDropdownMenu.classList.remove('active');
      }
    });
  }

  // 2. Auth State Listener
  auth.onAuthStateChanged(async (user) => {
    if (user) {
      if (navGuestButtons) navGuestButtons.style.display = 'none';
      if (userPillWrap) userPillWrap.style.display = 'flex';

      const displayName = user.displayName || user.email.split('@')[0];
      if (userPillName) userPillName.textContent = displayName;
      if (userPillAvatar && user.photoURL) userPillAvatar.src = user.photoURL;

      // Check Dev Admin Permission
      let isDevAdmin = (user.email === 'bestcynix@gmail.com' || user.email === 'admin@email.com');
      try {
        const docSnap = await db.collection('users').doc(user.uid).get();
        if (docSnap.exists) {
          const uData = docSnap.data();
          if (uData.role === 'admin') isDevAdmin = true;
          if (uData.photoURL && userPillAvatar) userPillAvatar.src = uData.photoURL;
        }
      } catch (e) {}

      window._isDevAdminLoggedIn = isDevAdmin;
      initAdminMetrics();

      // Show Dev Links
      if (btnDevPortal) btnDevPortal.style.display = isDevAdmin ? 'inline-flex' : 'none';
      if (btnOpenDevPortalFromMenu) btnOpenDevPortalFromMenu.style.display = isDevAdmin ? 'flex' : 'none';
      if (btnOpenDevChatsFromMenu) btnOpenDevChatsFromMenu.style.display = isDevAdmin ? 'flex' : 'none';
      if (btnOpenDevUsersFromMenu) btnOpenDevUsersFromMenu.style.display = isDevAdmin ? 'flex' : 'none';

      // Connect Chat with User UID
      if (window.connectLiveChatUser) {
        window.connectLiveChatUser(user.uid);
      }

      // Mobile Drawer Elements
      const mobileDevBanner = document.getElementById('mobileDevBanner');
      const mobileUserCard = document.getElementById('mobileUserCard');
      const mobileGuestCard = document.getElementById('mobileGuestCard');
      const mobileUserAvatar = document.getElementById('mobileUserAvatar');
      const mobileUserName = document.getElementById('mobileUserName');
      const mobileUserRole = document.getElementById('mobileUserRole');

      if (mobileGuestCard) mobileGuestCard.style.display = 'none';
      if (mobileUserCard) mobileUserCard.style.display = 'flex';
      if (mobileUserName) mobileUserName.textContent = displayName;
      if (mobileUserAvatar && user.photoURL) mobileUserAvatar.src = user.photoURL;
      if (mobileUserRole) mobileUserRole.textContent = isDevAdmin ? '👑 DEV ADMIN' : '👤 สมาชิก (Member)';
      if (mobileDevBanner) mobileDevBanner.style.display = isDevAdmin ? 'flex' : 'none';

      // Re-render Projects to remove spoiler blur for dev
      if (window.BestCynixCMS && window.BestCynixCMS.renderProjects) {
        window.BestCynixCMS.renderProjects();
      }
    } else {
      window._isDevAdminLoggedIn = false;
      if (navGuestButtons) navGuestButtons.style.display = 'flex';
      if (userPillWrap) userPillWrap.style.display = 'none';
      if (btnDevPortal) btnDevPortal.style.display = 'none';
      if (btnOpenDevPortalFromMenu) btnOpenDevPortalFromMenu.style.display = 'none';
      if (btnOpenDevChatsFromMenu) btnOpenDevChatsFromMenu.style.display = 'none';
      if (btnOpenDevUsersFromMenu) btnOpenDevUsersFromMenu.style.display = 'none';

      const mobileDevBanner = document.getElementById('mobileDevBanner');
      const mobileUserCard = document.getElementById('mobileUserCard');
      const mobileGuestCard = document.getElementById('mobileGuestCard');
      if (mobileDevBanner) mobileDevBanner.style.display = 'none';
      if (mobileUserCard) mobileUserCard.style.display = 'none';
      if (mobileGuestCard) mobileGuestCard.style.display = 'grid';
    }
  });

  // 3. Logout (Desktop & Mobile)
  const performLogout = async () => {
    await auth.signOut();
    window.location.reload();
  };
  if (btnLogout) btnLogout.addEventListener('click', performLogout);
  document.getElementById('btnMobileLogout')?.addEventListener('click', performLogout);

  // Mobile Live Chat Trigger inside Drawer
  document.getElementById('btnMobileOpenChat')?.addEventListener('click', () => {
    const launcher = document.getElementById('btnLiveChatLauncher');
    if (launcher) launcher.click();
    document.getElementById('siteNav')?.setAttribute('data-open', 'false');
    document.getElementById('navToggle')?.setAttribute('aria-expanded', 'false');
  });

  // 4. Cookie Preferences & PDPA Banner
  const pdpaBanner = document.getElementById('pdpaBanner');
  const btnPdpaAccept = document.getElementById('btnPdpaAccept');
  const btnPdpaReject = document.getElementById('btnPdpaReject');
  const cookiePreferencesModal = document.getElementById('cookiePreferencesModal');
  const btnOpenCookieModal = document.getElementById('btnOpenCookieModal');
  const btnCloseCookieModal = document.getElementById('btnCloseCookieModal');
  const btnModalSavePreferences = document.getElementById('btnModalSavePreferences');
  const btnModalAcceptAll = document.getElementById('btnModalAcceptAll');
  const btnModalEssentialOnly = document.getElementById('btnModalEssentialOnly');

  const hasConsent = localStorage.getItem('bestcynix_pdpa_consent');
  if (!hasConsent && pdpaBanner) {
    setTimeout(() => pdpaBanner.classList.add('visible'), 800);
  }

  if (btnPdpaAccept) {
    btnPdpaAccept.addEventListener('click', () => {
      localStorage.setItem('bestcynix_pdpa_consent', 'all');
      pdpaBanner.classList.remove('visible');
    });
  }

  if (btnPdpaReject) {
    btnPdpaReject.addEventListener('click', () => {
      localStorage.setItem('bestcynix_pdpa_consent', 'essential');
      pdpaBanner.classList.remove('visible');
    });
  }

  if (btnOpenCookieModal && cookiePreferencesModal) {
    btnOpenCookieModal.addEventListener('click', () => {
      cookiePreferencesModal.classList.add('active');
      if (window.bringToFront) window.bringToFront(cookiePreferencesModal);
    });
  }

  if (btnCloseCookieModal && cookiePreferencesModal) {
    btnCloseCookieModal.addEventListener('click', () => {
      cookiePreferencesModal.classList.remove('active');
    });
  }

  if (btnModalAcceptAll) {
    btnModalAcceptAll.addEventListener('click', () => {
      localStorage.setItem('bestcynix_pdpa_consent', 'all');
      if (cookiePreferencesModal) cookiePreferencesModal.classList.remove('active');
      if (pdpaBanner) pdpaBanner.classList.remove('visible');
      showCyberToast('บันทึกการตั้งค่ายอมรับคุกกี้ทั้งหมดเรียบร้อย', '', 'success');
    });
  }

  if (btnModalEssentialOnly) {
    btnModalEssentialOnly.addEventListener('click', () => {
      localStorage.setItem('bestcynix_pdpa_consent', 'essential');
      if (cookiePreferencesModal) cookiePreferencesModal.classList.remove('active');
      if (pdpaBanner) pdpaBanner.classList.remove('visible');
      showCyberToast('บันทึกการตั้งค่าเฉพาะคุกกี้ที่จำเป็นเรียบร้อย', '', 'success');
    });
  }

  if (btnModalSavePreferences) {
    btnModalSavePreferences.addEventListener('click', () => {
      localStorage.setItem('bestcynix_pdpa_consent', 'custom');
      if (cookiePreferencesModal) cookiePreferencesModal.classList.remove('active');
      if (pdpaBanner) pdpaBanner.classList.remove('visible');
      showCyberToast('บันทึกการตั้งค่าคุกกี้เรียบร้อย', '', 'success');
    });
  }

  // 5. Real-Time Site Analytics Metric Counter
  const recordVisit = async () => {
    try {
      const isUnique = !localStorage.getItem('bestcynix_visited');
      localStorage.setItem('bestcynix_visited', 'true');
      const statsRef = db.collection('site_stats').doc('metrics');
      const updateData = {
        pageviews: firebase.firestore.FieldValue.increment(1),
        lastVisit: firebase.firestore.FieldValue.serverTimestamp()
      };
      if (isUnique) {
        updateData.uniqueVisitors = firebase.firestore.FieldValue.increment(1);
      }
      await statsRef.set(updateData, { merge: true });
    } catch (e) {}
  };

  recordVisit();

  // Listen to Site Stats
  db.collection('site_stats').doc('metrics').onSnapshot((doc) => {
    if (doc.exists) {
      const d = doc.data();
      const elViews = document.getElementById('footerTotalViews');
      const elUnique = document.getElementById('footerUniqueVisitors');
      if (elViews) elViews.textContent = (d.pageviews || 1).toLocaleString();
      if (elUnique) elUnique.textContent = (d.uniqueVisitors || 1).toLocaleString();
    }
  });

})();
