/**
 * BestCyniX Dev - Shopee Deals Catalog Engine
 */
(function() {
  'use strict';

  let products = [];
  let categories = [];
  let currentCategory = 'all';
  let searchQuery = '';
  let currentSort = 'sold_desc';
  let currentPage = 1;
  let pageSize = 24;

  const $ = (id) => document.getElementById(id);

  window.copyShopeeRefCode = () => {
    const code = $('lblShopeeRefCode')?.textContent?.trim() || 'WVMG5VP';
    if (navigator.clipboard) {
      navigator.clipboard.writeText(code).then(() => {
        if (window.showToast) window.showToast('คัดลอกรหัสแนะนำ Shopee แล้ว! 📋', 'รหัส: ' + code, 'success');
        else alert('คัดลอกรหัสแล้ว: ' + code);
      });
    }
  };

  const renderCategories = () => {
    const container = $('shopeeCategoriesScroll');
    if (!container) return;

    const eligibleCategories = window.BestCynixAffiliate
      ? window.BestCynixAffiliate.filter(categories.map(c => ({
        ...c,
        affiliateUrl: c.affiliateUrl || c.url,
        commissionRate: c.commissionRate || c.rate
      })))
      : [];

    container.innerHTML = eligibleCategories.map(c => `
      <a href="${c.affiliateUrl || c.url}" target="_blank" rel="noopener sponsored" data-affiliate-id="${c.id || c.name || ''}" data-affiliate-platform="shopee" class="cat-offer-chip" title="เปิดหมวดหมู่ ${c.thName} บน Shopee">
        <span>${c.icon || '🟠'}</span>
        <span>${c.thName || c.name}</span>
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
    const container = $('shopeeProductsContainer');
    const countEl = $('shopeeProductsCount');
    if (!container) return;

    const filtered = getFiltered();
    const total = filtered.length;

    if (countEl) {
      countEl.textContent = `แสดงผล ${total} รายการ Shopee ${currentCategory !== 'all' ? '(ในหมวดที่เลือก)' : ''}`;
    }

    if (total === 0) {
      container.innerHTML = `
        <div style="grid-column:1/-1; text-align:center; padding:4rem 1rem; background:rgba(8,20,38,0.6); border:1px dashed rgba(255,255,255,0.15); border-radius:18px;">
          <div style="font-size:2.5rem; margin-bottom:0.8rem;">🔍</div>
          <h3 style="color:#fff; font-size:1.2rem; margin-bottom:0.3rem;">ไม่พบสินค้า Shopee ที่ตรงกับคำค้นหา</h3>
          <p style="color:var(--muted); font-size:0.88rem;">ลองค้นหาด้วยคำอื่น หรือเลือกหมวดหมู่อื่นดูนะครับ</p>
        </div>
      `;
      if ($('shopeePaginationBar')) $('shopeePaginationBar').style.display = 'none';
      return;
    }

    if ($('shopeePaginationBar')) $('shopeePaginationBar').style.display = 'flex';

    const limit = pageSize === 'all' ? total : parseInt(pageSize);
    const totalPages = Math.ceil(total / limit) || 1;
    if (currentPage > totalPages) currentPage = totalPages;
    if (currentPage < 1) currentPage = 1;

    if ($('lblShopeeCurrentPage')) $('lblShopeeCurrentPage').textContent = currentPage;
    if ($('lblShopeeTotalPages')) $('lblShopeeTotalPages').textContent = totalPages;

    const start = (currentPage - 1) * limit;
    const paged = pageSize === 'all' ? filtered : filtered.slice(start, start + limit);

    container.innerHTML = paged.map(p => {
      const buyUrl = window.BestCynixAffiliate?.getPurchaseUrl(p) || '';
      if (!buyUrl) return '';
      return `
        <a href="${buyUrl}" target="_blank" rel="noopener sponsored" data-affiliate-id="${p.id || ''}" data-affiliate-platform="shopee" class="product-clickable-card shopee" title="สั่งซื้อ ${p.name || ''} บน Shopee">
          <div>
            <div class="prod-img-wrap">
              <img src="${p.image}" alt="${p.name || ''}" class="prod-img" loading="lazy" />
              <span style="position:absolute; top:8px; left:8px; font-size:0.72rem; font-weight:800; padding:0.2rem 0.5rem; border-radius:6px; background:rgba(238,77,45,0.9); color:#fff;">
                🟠 Shopee
              </span>
            </div>
            <div class="prod-shop-name">🏪 ${p.shop || 'Shopee Official Store'} • ขายแล้ว ${p.sold || 'ยอดนิยม'}</div>
            <h4 class="prod-title">${p.name || 'สินค้า Shopee แนะนำ'}</h4>
          </div>

          <div>
            <div class="prod-price-strip">
              <div>
                <span class="prod-price">${p.price || '฿0'}</span>
              </div>
              <span style="font-size:0.75rem; color:#4ade80; font-weight:700;">Affiliate ✓</span>
            </div>
            <div class="prod-btn-action shopee">
              <span>🛒 สั่งซื้อบน Shopee</span>
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
      const res = await fetch('data/shopee-products.json?v=' + Date.now());
      if (res.ok) {
        const data = await res.json();
        products = data.products || [];
        categories = data.categories || [];
        if (data.referralCode && $('lblShopeeRefCode')) $('lblShopeeRefCode').textContent = data.referralCode;
        renderCategories();
        renderProducts();
      }
    } catch (e) {}

    // Firestore Sync
    if (typeof firebase !== 'undefined' && firebase.firestore) {
      firebase.firestore().collection('shopeeDeals').where('platform', '==', 'shopee').onSnapshot(snap => {
        if (!snap.empty) {
          const custom = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
          const customIds = new Set(custom.map(d => d.id));
          const base = products.filter(p => !customIds.has(p.id));
          products = [...custom, ...base];
          renderProducts();
        }
      }, () => {});
    }

    $('shopeeSearchInput')?.addEventListener('input', (e) => {
      searchQuery = e.target.value;
      currentPage = 1;
      renderProducts();
    });

    $('shopeeSortSelect')?.addEventListener('change', (e) => {
      currentSort = e.target.value;
      currentPage = 1;
      renderProducts();
    });

    $('shopeePageSizeSelect')?.addEventListener('change', (e) => {
      pageSize = e.target.value;
      currentPage = 1;
      renderProducts();
    });

    $('btnShopeePrev')?.addEventListener('click', () => {
      if (currentPage > 1) {
        currentPage--;
        renderProducts();
        window.scrollTo({ top: $('shopeeProductsContainer').offsetTop - 120, behavior: 'smooth' });
      }
    });

    $('btnShopeeNext')?.addEventListener('click', () => {
      const limit = pageSize === 'all' ? products.length : parseInt(pageSize);
      const totalPages = Math.ceil(getFiltered().length / limit) || 1;
      if (currentPage < totalPages) {
        currentPage++;
        renderProducts();
        window.scrollTo({ top: $('shopeeProductsContainer').offsetTop - 120, behavior: 'smooth' });
      }
    });

    document.querySelectorAll('#shopeeFilterPills .filter-pill').forEach(btn => {
      btn.addEventListener('click', () => {
        document.querySelectorAll('#shopeeFilterPills .filter-pill').forEach(b => b.classList.remove('active'));
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
