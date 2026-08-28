/**
 * BestCyniX Dev - Alliance & Hosting Partners Engine
 * Handles dynamic rendering & Firestore live synchronization.
 */
(function() {
  'use strict';

  let partners = [];
  const container = document.getElementById('allianceContainer');

  const renderPartners = () => {
    if (!container) return;

    const activeList = partners.filter(p => p.active !== false);

    if (activeList.length === 0) {
      container.innerHTML = '<div style="grid-column:1/-1; text-align:center; padding:3rem; color:var(--muted);">กำลังโหลดข้อมูลพันธมิตร...</div>';
      return;
    }

    container.innerHTML = activeList.map(p => {
      const featuresHtml = (p.features || []).map(f => `
        <div class="feature-item">
          <span>${f}</span>
        </div>
      `).join('');

      return `
        <div class="alliance-card">
          <div>
            <div class="alliance-header">
              <img src="${p.logo || 'assets/photo/bcxlogo2.png'}" alt="${p.name || ''}" class="alliance-logo" />
              <div>
                ${p.badge ? `<span class="alliance-badge">${p.badge}</span>` : ''}
                <h3 class="alliance-name">${p.name || ''}</h3>
                <div class="alliance-subtitle">${p.subTitle || ''}</div>
              </div>
            </div>

            <p class="alliance-desc">${p.description || ''}</p>

            <div class="alliance-features">
              ${featuresHtml}
            </div>
          </div>

          <div>
            <a href="${p.url || '#'}" target="_blank" rel="noopener sponsored" class="btn-alliance-cta">
              <span>${p.ctaText || '🚀 ไปยังหน้าสั่งซื้อ →'}</span>
            </a>
            <div class="alliance-hint">${p.hintText || '💡 สั่งซื้อผ่านลิงก์นี้เพื่อสนับสนุนทีมงาน'}</div>
          </div>
        </div>
      `;
    }).join('');
  };

  const init = async () => {
    try {
      const res = await fetch('data/alliances.json?v=' + Date.now());
      if (res.ok) {
        partners = await res.json();
        renderPartners();
      }
    } catch (e) {}

    // Firestore Live Sync
    if (typeof firebase !== 'undefined' && firebase.firestore) {
      firebase.firestore().collection('alliances').orderBy('order', 'asc').onSnapshot(snap => {
        if (!snap.empty) {
          partners = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
          renderPartners();
        }
      }, () => {});
    }
  };

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();
