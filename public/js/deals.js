/**
 * BestCyniX Dev - Dual Platform Deals & Affiliate Catalog Engine (Shopee & Lazada)
 * Handles Platform Switching, Category Direct Offers, Product Filtering, Real-time Search,
 * Sorting, Pagination, and Firestore Live Sync.
 */

(function () {
  'use strict';

  let allProducts = [];
  let shopeeCategories = [];
  let lazadaCampaigns = [];
  let currentPlatform = 'all'; // 'all', 'shopee', 'lazada'
  let currentCategory = 'all';
  let searchQuery = '';
  let currentSort = 'sold_desc';
  let currentPage = 1;
  let pageSize = 24;

  const $ = (id) => document.getElementById(id);

  // Copy Referral Code
  window.copyShopeeRefCode = () => {
    const code = $('lblShopeeRefCode')?.textContent?.trim() || 'WVMG5VP';
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(code).then(() => {
        if (typeof showToast === 'function') {
          showToast('คัดลอกรหัสแนะนำ Shopee แล้ว! 📋', 'รหัส: ' + code, 'success');
        } else {
          alert('คัดลอกรหัสแนะนำแล้ว: ' + code);
        }
      });
    }
  };

  // Copy Product Link
  window.copyProductLink = (url) => {
    if (!url) return;
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(url).then(() => {
        if (typeof showToast === 'function') {
          showToast('คัดลอกลิงก์สินค้าแล้ว! 📋', url, 'success');
        } else {
          alert('คัดลอกลิงก์สินค้าแล้ว: ' + url);
        }
      });
    }
  };

  // 1. Render Category & Campaign Direct Offers
  const renderCategoryOffers = () => {
    const container = $('categoryOffersScroll');
    if (!container) return;

    let items = [];

    if (currentPlatform === 'all' || currentPlatform === 'shopee') {
      shopeeCategories.forEach(c => {
        items.push({
          icon: c.icon || '🟠',
          name: c.thName || c.name,
          rate: 'คอม ' + c.rate,
          affiliateUrl: c.affiliateUrl || c.url,
          commissionRate: c.commissionRate || c.rate,
          platform: 'shopee'
        });
      });
    }

    if (currentPlatform === 'all' || currentPlatform === 'lazada') {
      lazadaCampaigns.forEach(c => {
        items.push({
          icon: c.icon || '🔵',
          name: c.name,
          rate: c.tag || 'Lazada Deal',
          affiliateUrl: c.affiliateUrl || c.url,
          commissionRate: c.commissionRate,
          platform: 'lazada'
        });
      });
    }

    const eligibleItems = window.BestCynixAffiliate ? window.BestCynixAffiliate.filter(items) : [];
    container.innerHTML = eligibleItems.map(c => `
      <a href="${c.affiliateUrl}" target="_blank" rel="noopener sponsored" data-affiliate-id="${c.name || ''}" data-affiliate-platform="${c.platform}" class="cat-offer-chip ${c.platform}" title="เปิดดูข้อเสนอ ${c.name}">
        <span>${c.icon}</span>
        <span>${c.name}</span>
        <span class="badge">${c.rate}</span>
        <span style="font-size:0.72rem;opacity:0.6;">↗</span>
      </a>
    `).join('');
    window.BestCynixAffiliate?.attachClickTracking(container);
  };

  // 2. Filter & Sort Logic
  const getFilteredProducts = () => {
    let result = window.BestCynixAffiliate
      ? window.BestCynixAffiliate.filter(allProducts)
      : [];

    // Filter by Platform
    if (currentPlatform !== 'all') {
      result = result.filter(p => p.platform === currentPlatform);
    }

    // Filter by Category
    if (currentCategory !== 'all') {
      result = result.filter(p => p.category === currentCategory);
    }

    // Filter by Search Query
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      result = result.filter(p =>
        (p.name && p.name.toLowerCase().includes(q)) ||
        (p.shop && p.shop.toLowerCase().includes(q)) ||
        (p.id && String(p.id).toLowerCase().includes(q))
      );
    }

    // Sort
    result.sort((a, b) => {
      if (currentSort === 'sold_desc') {
        const soldA = parseSoldCount(a.sold);
        const soldB = parseSoldCount(b.sold);
        return soldB - soldA;
      }
      if (currentSort === 'comm_desc') {
        const commA = parseFloat(a.commissionRate) || 0;
        const commB = parseFloat(b.commissionRate) || 0;
        return commB - commA;
      }
      if (currentSort === 'price_asc') {
        return (a.rawPrice || 0) - (b.rawPrice || 0);
      }
      if (currentSort === 'price_desc') {
        return (b.rawPrice || 0) - (a.rawPrice || 0);
      }
      return 0;
    });

    return result;
  };

  const parseSoldCount = (soldStr) => {
    if (!soldStr) return 0;
    let s = String(soldStr).replace('+', '').replace('ชิ้น', '').trim();
    if (s.includes('พัน')) {
      return parseFloat(s.replace('พัน', '')) * 1000;
    }
    return parseFloat(s) || 0;
  };

  // 3. Render Product Cards Grid with Pagination
  const renderProducts = () => {
    const container = $('productsContainer');
    const countLabel = $('productsCountLabel');
    if (!container) return;

    const filtered = getFilteredProducts();
    const totalCount = filtered.length;

    // Update Platform count indicators
    const eligibleProducts = window.BestCynixAffiliate ? window.BestCynixAffiliate.filter(allProducts) : [];
    const allCnt = eligibleProducts.length;
    const shopeeCnt = eligibleProducts.filter(p => p.platform === 'shopee').length;
    const lazadaCnt = eligibleProducts.filter(p => p.platform === 'lazada').length;

    if ($('cntAll')) $('cntAll').textContent = `(${allCnt})`;
    if ($('cntShopee')) $('cntShopee').textContent = `(${shopeeCnt})`;
    if ($('cntLazada')) $('cntLazada').textContent = `(${lazadaCnt})`;

    if (countLabel) {
      const platTxt = currentPlatform === 'shopee' ? 'Shopee' : (currentPlatform === 'lazada' ? 'Lazada' : 'ทั้งหมด');
      countLabel.textContent = `แสดงผล ${totalCount} รายการ (${platTxt}${currentCategory !== 'all' ? `, หมวดที่เลือก` : ''})`;
    }

    if (totalCount === 0) {
      container.innerHTML = `
        <div style="grid-column: 1 / -1; text-align: center; padding: 4rem 1rem; background: rgba(8, 20, 38, 0.6); border: 1px dashed rgba(255,255,255,0.15); border-radius: 18px;">
          <div style="font-size: 2.5rem; margin-bottom: 0.8rem;">🔍</div>
          <h3 style="color: #fff; font-size: 1.2rem; margin-bottom: 0.3rem;">ไม่พบสินค้าที่ตรงกับการค้นหา</h3>
          <p style="color: var(--muted); font-size: 0.88rem;">ลองค้นหาด้วยคำอื่น หรือสลับแพลตฟอร์ม/หมวดหมู่ดูนะครับ</p>
        </div>
      `;
      if ($('dealsPaginationBar')) $('dealsPaginationBar').style.display = 'none';
      return;
    }

    if ($('dealsPaginationBar')) $('dealsPaginationBar').style.display = 'flex';

    // Pagination calculations
    const limit = pageSize === 'all' ? totalCount : parseInt(pageSize);
    const totalPages = Math.ceil(totalCount / limit) || 1;
    if (currentPage > totalPages) currentPage = totalPages;
    if (currentPage < 1) currentPage = 1;

    if ($('lblCurrentPage')) $('lblCurrentPage').textContent = currentPage;
    if ($('lblTotalPages')) $('lblTotalPages').textContent = totalPages;

    const startIdx = (currentPage - 1) * limit;
    const pagedProducts = pageSize === 'all' ? filtered : filtered.slice(startIdx, startIdx + limit);

    container.innerHTML = pagedProducts.map(p => {
      const isLazada = p.platform === 'lazada';
      const buyUrl = window.BestCynixAffiliate?.getPurchaseUrl(p) || '';
      if (!buyUrl) return '';
      const btnTxt = isLazada ? '🛒 สั่งซื้อบน Lazada' : '🛒 สั่งซื้อบน Shopee';
      const platLabel = isLazada ? '🔵 Lazada' : '🟠 Shopee';

      return `
        <div class="product-card ${p.platform || 'shopee'}">
          <div>
            <div class="prod-badge-strip">
              <span class="prod-platform-pill ${p.platform || 'shopee'}">${platLabel}</span>
              <span class="prod-shop-name" title="${p.shop || ''}">🏪 ${p.shop || 'Official Store'}</span>
            </div>
            
            <h4 class="prod-title" title="${p.name || ''}">${p.name || 'สินค้าแนะนำ'}</h4>

            <div class="prod-price-row">
              <div>
                <span class="prod-price">${p.price || '฿0'}</span>
                ${p.origPrice ? `<span class="prod-orig-price">${p.origPrice}</span>` : ''}
              </div>
              <div style="display:flex;gap:0.3rem;align-items:center;">
                ${p.discount ? `<span style="background:rgba(239,68,68,0.15);color:#f87171;padding:0.15rem 0.4rem;border-radius:4px;font-size:0.7rem;font-weight:700;">-${p.discount}</span>` : ''}
                ${p.commissionRate ? `<span class="prod-comm-badge">คอม ${p.commissionRate}</span>` : ''}
              </div>
            </div>
          </div>

          <div class="prod-actions">
            <a href="${buyUrl}" target="_blank" rel="noopener sponsored" data-affiliate-id="${p.id || ''}" data-affiliate-platform="${p.platform || 'unknown'}" class="btn-buy ${p.platform || 'shopee'}" title="เปิดหน้า Affiliate สินค้า">
              <span>${btnTxt}</span>
              <span style="font-size:0.75rem;">↗</span>
            </a>
            <button type="button" class="btn-copy-prod" onclick="window.copyProductLink('${buyUrl}')" title="คัดลอกลิงก์สินค้า">
              📋
            </button>
          </div>
        </div>
      `;
    }).join('');
    window.BestCynixAffiliate?.attachClickTracking(container);
  };

  // 4. Initialize Data & Listeners
  const init = async () => {
    try {
      const res = await fetch('data/deals-dataset.json?v=' + Date.now());
      if (res.ok) {
        const data = await res.json();
        allProducts = data.products || [];
        shopeeCategories = data.shopeeCategories || [];
        lazadaCampaigns = data.lazadaCampaigns || [];

        if (data.shopeeReferralCode && $('lblShopeeRefCode')) {
          $('lblShopeeRefCode').textContent = data.shopeeReferralCode;
        }

        renderCategoryOffers();
        renderProducts();
      }
    } catch (e) {
      console.warn('Load dataset error:', e);
    }

    // Firestore Live Sync
    if (typeof firebase !== 'undefined' && firebase.firestore) {
      const db = firebase.firestore();
      db.collection('shopeeDeals').onSnapshot(snap => {
        if (!snap.empty) {
          const customDeals = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
          const customIds = new Set(customDeals.map(d => d.id));
          const baseDeals = allProducts.filter(p => !customIds.has(p.id));
          allProducts = [...customDeals, ...baseDeals];
          renderProducts();
        }
      }, () => {});
    }

    // Platform Switcher
    document.querySelectorAll('.platform-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        document.querySelectorAll('.platform-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        currentPlatform = btn.getAttribute('data-platform') || 'all';
        currentPage = 1;
        renderCategoryOffers();
        renderProducts();
      });
    });

    // Event Listeners
    $('dealsSearchInput')?.addEventListener('input', (e) => {
      searchQuery = e.target.value;
      currentPage = 1;
      renderProducts();
    });

    $('dealsSortSelect')?.addEventListener('change', (e) => {
      currentSort = e.target.value;
      currentPage = 1;
      renderProducts();
    });

    $('dealsPageSizeSelect')?.addEventListener('change', (e) => {
      pageSize = e.target.value;
      currentPage = 1;
      renderProducts();
    });

    $('btnDealsPrev')?.addEventListener('click', () => {
      if (currentPage > 1) {
        currentPage--;
        renderProducts();
        window.scrollTo({ top: $('productsContainer').offsetTop - 120, behavior: 'smooth' });
      }
    });

    $('btnDealsNext')?.addEventListener('click', () => {
      const limit = pageSize === 'all' ? allProducts.length : parseInt(pageSize);
      const totalPages = Math.ceil(getFilteredProducts().length / limit) || 1;
      if (currentPage < totalPages) {
        currentPage++;
        renderProducts();
        window.scrollTo({ top: $('productsContainer').offsetTop - 120, behavior: 'smooth' });
      }
    });

    // Category Filter Pills
    document.querySelectorAll('.filter-pill').forEach(btn => {
      btn.addEventListener('click', () => {
        document.querySelectorAll('.filter-pill').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        currentCategory = btn.getAttribute('data-cat') || 'all';
        currentPage = 1;
        renderProducts();
      });
    });
  };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
