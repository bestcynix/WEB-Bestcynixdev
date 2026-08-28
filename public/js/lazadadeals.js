/**
 * BestCyniX Dev - Lazada Deals Catalog Engine
 */
(function() {
  'use strict';

  let products = [];
  let campaigns = [];
  let currentCategory = 'all';
  let searchQuery = '';
  let currentSort = 'sold_desc';
  let currentPage = 1;
  let pageSize = 24;

  const $ = (id) => document.getElementById(id);

  const renderCampaigns = () => {
    const container = $('lazadaCampaignsScroll');
    if (!container) return;

    const eligibleCampaigns = window.BestCynixAffiliate
      ? window.BestCynixAffiliate.filter(campaigns)
      : [];

    container.innerHTML = eligibleCampaigns.map(c => `
      <a href="${c.affiliateUrl || c.url}" target="_blank" rel="noopener sponsored" data-affiliate-id="${c.id || c.name || ''}" data-affiliate-platform="lazada" class="cat-offer-chip" title="เปิดแคมเปญ ${c.name} บน Lazada">
        <span>${c.icon || '🔵'}</span>
        <span>${c.name}</span>
        <span style="font-size:0.72rem; opacity:0.6;">↗</span>
      </a>
    `).join('');
    window.BestCynixAffiliate?.attachClickTracking(container);
  };

  const parseSoldCount = (soldStr) => {
    if (!soldStr) return 0;
    let s = String(soldStr).replace('+', '').replace('ชิ้น', '').trim();
    if (s.includes('พัน')) return parseFloat(s.replace('พัน', '')) * 1000;
    return parseFloat(s) || 0;
  };

  const getFiltered = () => {
    let result = window.BestCynixAffiliate
      ? window.BestCynixAffiliate.filter(products)
      : [];

    if (currentCategory !== 'all') {
      result = result.filter(p => p.category === currentCategory);
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      result = result.filter(p =>
        (p.name && p.name.toLowerCase().includes(q)) ||
        (p.shop && p.shop.toLowerCase().includes(q)) ||
        (p.id && String(p.id).toLowerCase().includes(q))
      );
    }

    result.sort((a, b) => {
      if (currentSort === 'sold_desc') return parseSoldCount(b.sold) - parseSoldCount(a.sold);
      if (currentSort === 'price_asc') return (a.rawPrice || 0) - (b.rawPrice || 0);
      if (currentSort === 'price_desc') return (b.rawPrice || 0) - (a.rawPrice || 0);
      return 0;
    });

    return result;
  };

  const renderProducts = () => {
    const container = $('lazadaProductsContainer');
    const countEl = $('lazadaProductsCount');
    if (!container) return;

    const filtered = getFiltered();
    const total = filtered.length;

    if (countEl) {
      countEl.textContent = `แสดงผล ${total} รายการ Lazada ${currentCategory !== 'all' ? '(ในหมวดที่เลือก)' : ''}`;
    }

    if (total === 0) {
      container.innerHTML = `
        <div style="grid-column:1/-1; text-align:center; padding:4rem 1rem; background:rgba(8,20,38,0.6); border:1px dashed rgba(255,255,255,0.15); border-radius:18px;">
          <div style="font-size:2.5rem; margin-bottom:0.8rem;">🔍</div>
          <h3 style="color:#fff; font-size:1.2rem; margin-bottom:0.3rem;">ไม่พบสินค้า Lazada ที่ตรงกับคำค้นหา</h3>
          <p style="color:var(--muted); font-size:0.88rem;">ลองค้นหาด้วยคำอื่น หรือเลือกหมวดหมู่อื่นดูนะครับ</p>
        </div>
      `;
      if ($('lazadaPaginationBar')) $('lazadaPaginationBar').style.display = 'none';
      return;
    }

    if ($('lazadaPaginationBar')) $('lazadaPaginationBar').style.display = 'flex';

    const limit = pageSize === 'all' ? total : parseInt(pageSize);
    const totalPages = Math.ceil(total / limit) || 1;
    if (currentPage > totalPages) currentPage = totalPages;
    if (currentPage < 1) currentPage = 1;

    if ($('lblLazadaCurrentPage')) $('lblLazadaCurrentPage').textContent = currentPage;
    if ($('lblLazadaTotalPages')) $('lblLazadaTotalPages').textContent = totalPages;

    const start = (currentPage - 1) * limit;
    const paged = pageSize === 'all' ? filtered : filtered.slice(start, start + limit);

    container.innerHTML = paged.map(p => {
      const buyUrl = window.BestCynixAffiliate?.getPurchaseUrl(p) || '';
      if (!buyUrl) return '';
      return `
        <a href="${buyUrl}" target="_blank" rel="noopener sponsored" data-affiliate-id="${p.id || ''}" data-affiliate-platform="lazada" class="product-clickable-card lazada" title="สั่งซื้อ ${p.name || ''} บน Lazada">
          <div>
            <div class="prod-img-wrap">
              <img src="${p.image}" alt="${p.name || ''}" class="prod-img" loading="lazy" />
              <span style="position:absolute; top:8px; left:8px; font-size:0.72rem; font-weight:800; padding:0.2rem 0.5rem; border-radius:6px; background:rgba(0,160,233,0.9); color:#fff;">
                🔵 Lazada
              </span>
            </div>
            <div class="prod-shop-name">🏪 ${p.shop || 'Lazada Store'} • ขายแล้ว ${p.sold || 'ยอดนิยม'}</div>
            <h4 class="prod-title">${p.name || 'สินค้า Lazada แนะนำ'}</h4>
          </div>

          <div>
            <div class="prod-price-strip">
              <div>
                <span class="prod-price">${p.price || '฿0'}</span>
                ${p.origPrice ? `<span class="prod-orig-price">${p.origPrice}</span>` : ''}
              </div>
              ${p.discount ? `<span style="background:rgba(239,68,68,0.15);color:#f87171;padding:0.15rem 0.4rem;border-radius:4px;font-size:0.7rem;font-weight:700;">-${p.discount}</span>` : ''}
            </div>
            <div class="prod-btn-action lazada">
              <span>🛒 สั่งซื้อบน Lazada</span>
              <span style="font-size:0.75rem;">↗</span>
            </div>
          </div>
        </a>
      `;
    }).join('');
    window.BestCynixAffiliate?.attachClickTracking(container);
  };

  const init = async () => {
    try {
      const res = await fetch('data/lazada-products.json?v=' + Date.now());
      if (res.ok) {
        const data = await res.json();
        products = data.products || [];
        campaigns = data.campaigns || [];
        renderCampaigns();
        renderProducts();
      }
    } catch (e) {}

    // Firestore Sync
    if (typeof firebase !== 'undefined' && firebase.firestore) {
      firebase.firestore().collection('shopeeDeals').where('platform', '==', 'lazada').onSnapshot(snap => {
        if (!snap.empty) {
          const custom = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
          const customIds = new Set(custom.map(d => d.id));
          const base = products.filter(p => !customIds.has(p.id));
          products = [...custom, ...base];
          renderProducts();
        }
      }, () => {});
    }

    $('lazadaSearchInput')?.addEventListener('input', (e) => {
      searchQuery = e.target.value;
      currentPage = 1;
      renderProducts();
    });

    $('lazadaSortSelect')?.addEventListener('change', (e) => {
      currentSort = e.target.value;
      currentPage = 1;
      renderProducts();
    });

    $('lazadaPageSizeSelect')?.addEventListener('change', (e) => {
      pageSize = e.target.value;
      currentPage = 1;
      renderProducts();
    });

    $('btnLazadaPrev')?.addEventListener('click', () => {
      if (currentPage > 1) {
        currentPage--;
        renderProducts();
        window.scrollTo({ top: $('lazadaProductsContainer').offsetTop - 120, behavior: 'smooth' });
      }
    });

    $('btnLazadaNext')?.addEventListener('click', () => {
      const limit = pageSize === 'all' ? products.length : parseInt(pageSize);
      const totalPages = Math.ceil(getFiltered().length / limit) || 1;
      if (currentPage < totalPages) {
        currentPage++;
        renderProducts();
        window.scrollTo({ top: $('lazadaProductsContainer').offsetTop - 120, behavior: 'smooth' });
      }
    });

    document.querySelectorAll('#lazadaFilterPills .filter-pill').forEach(btn => {
      btn.addEventListener('click', () => {
        document.querySelectorAll('#lazadaFilterPills .filter-pill').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        currentCategory = btn.getAttribute('data-cat') || 'all';
        currentPage = 1;
        renderProducts();
      });
    });
  };

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();
