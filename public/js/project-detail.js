/**
 * BestCyniX Dev - Dedicated Project Detail & Portfolio Archive Page Controller
 * Dual Mode:
 *  - Catalog Mode (when no ?id=...): Displays full searchable/filterable Portfolio Archive with pagination
 *  - Detail Mode (when ?id=...): Displays deep architecture, story, tech stack & screenshots for single project
 */

(function () {
  'use strict';

  const urlParams = new URLSearchParams(window.location.search);
  const rawId = urlParams.get('id');
  const isCatalogMode = !rawId || rawId.trim() === '';
  const normalizedId = rawId ? decodeURIComponent(rawId).toLowerCase().trim().replace(/\s+/g, '-') : '';

  const allProjectsView = document.getElementById('allProjectsView');
  const singleProjectView = document.getElementById('singleProjectView');
  const loadingState = document.getElementById('loadingState');
  const projectDetailContent = document.getElementById('projectDetailContent');
  const accessDeniedState = document.getElementById('accessDeniedState');
  const topbarBackBtn = document.getElementById('topbarBackBtn');

  const projTitle = document.getElementById('projTitle');
  const projPeriodBadge = document.getElementById('projPeriodBadge');
  const projStatusBadge = document.getElementById('projStatusBadge');
  const projFeaturedBadge = document.getElementById('projFeaturedBadge');
  const projDevOnlyBadge = document.getElementById('projDevOnlyBadge');
  const projDesc = document.getElementById('projDesc');
  const projDetails = document.getElementById('projDetails');
  const projStackGrid = document.getElementById('projStackGrid');
  const btnVisitProjectUrl = document.getElementById('btnVisitProjectUrl');
  const btnVisitProjectCommunity = document.getElementById('btnVisitProjectCommunity');
  const btnShareProject = document.getElementById('btnShareProject');
  const projCountdownWrap = document.getElementById('projCountdownWrap');
  const projCountdownVal = document.getElementById('projCountdownVal');
  const projCoverBanner = document.getElementById('projCoverBanner');
  const projGalleryBox = document.getElementById('projGalleryBox');
  const projGalleryGrid = document.getElementById('projGalleryGrid');
  const mcSkylineProjectPromo = document.getElementById('mcSkylineProjectPromo');

  let currentProjectData = null;
  let isDevAdmin = false;

  const safeLink = (value) => {
    if (!value || typeof value !== 'string') return '';
    try {
      const parsed = new URL(value, document.baseURI);
      return ['http:', 'https:', 'mailto:'].includes(parsed.protocol) ? parsed.href : '';
    } catch (error) {
      return '';
    }
  };

  // ──────────────────────────────────────────────────────────────────────────
  // 1. CATALOG MODE (All Projects Portfolio Archive)
  // ──────────────────────────────────────────────────────────────────────────
  const initCatalogMode = () => {
    if (loadingState) loadingState.style.display = 'none';
    if (singleProjectView) singleProjectView.style.display = 'none';
    if (allProjectsView) allProjectsView.style.display = 'block';

    document.title = 'โปรเจกต์ทั้งหมด (Featured Portfolio) • BestCyniX Dev';

    if (topbarBackBtn) {
      topbarBackBtn.href = '/';
      topbarBackBtn.innerHTML = '<span>🏠 กลับสู่หน้าหลัก</span>';
    }

    // Connect Search & Filter Pills in Catalog View
    window._currentProjectFilter = 'all';
    window._projectCurrentPage = 1;
    window._projectPageSize = 'all';

    const searchInput = document.getElementById('projectSearchInput');
    const filterPills = document.querySelectorAll('.p-filter-pill');

    filterPills.forEach((btn) => {
      btn.addEventListener('click', () => {
        filterPills.forEach((b) => b.classList.remove('active'));
        btn.classList.add('active');
        window._currentProjectFilter = btn.dataset.filter || 'all';
        window._projectCurrentPage = 1;
        if (window.BestCynixCMS && window.BestCynixCMS.renderProjects) {
          window.BestCynixCMS.renderProjects();
        }
      });
    });

    if (searchInput) {
      searchInput.addEventListener('input', () => {
        window._projectCurrentPage = 1;
        if (window.BestCynixCMS && window.BestCynixCMS.renderProjects) {
          window.BestCynixCMS.renderProjects();
        }
      });
    }

    // Direct Instant Render
    const renderCatalog = () => {
      if (window.BestCynixCMS && window.BestCynixCMS.renderProjects) {
        window.BestCynixCMS.renderProjects();
      }
      document.querySelectorAll('.reveal-on-scroll').forEach((el) => el.classList.add('is-revealed'));
    };

    renderCatalog();
    setTimeout(renderCatalog, 50);
    setTimeout(renderCatalog, 200);
  };

  // ──────────────────────────────────────────────────────────────────────────
  // 2. DETAIL MODE (Single Project Deep Dive)
  // ──────────────────────────────────────────────────────────────────────────
  const renderProjectDetail = (proj) => {
    if (!proj) return;
    currentProjectData = proj;

    if (allProjectsView) allProjectsView.style.display = 'none';
    if (singleProjectView) singleProjectView.style.display = 'block';
    if (loadingState) loadingState.style.display = 'none';

    if (topbarBackBtn) {
      topbarBackBtn.href = 'project';
      topbarBackBtn.innerHTML = '<span>📁 ดูโปรเจกต์ทั้งหมด</span>';
    }

    // Access Control Check
    if (proj.accessLevel === 'dev_only' && !isDevAdmin) {
      if (projectDetailContent) projectDetailContent.style.display = 'none';
      if (accessDeniedState) accessDeniedState.style.display = 'block';
      return;
    }

    if (accessDeniedState) accessDeniedState.style.display = 'none';
    if (projectDetailContent) projectDetailContent.style.display = 'block';

    // Update Title & Metas
    document.title = `${proj.title} • ข้อมูลโปรเจกต์ BestCyniX Dev`;
    if (projTitle) projTitle.textContent = proj.title;
    if (projPeriodBadge) projPeriodBadge.textContent = proj.period || '2026';
    if (projDesc) projDesc.textContent = proj.description || '';
    if (projDetails) projDetails.textContent = proj.details || proj.description || 'ไม่มีข้อมูลเพิ่มเติม';

    // Keep the Mc-Skyline promotional media scoped to that project only.
    if (mcSkylineProjectPromo) {
      const projectKey = `${proj.id || ''} ${proj.title || ''} ${proj.url || ''}`.toLowerCase();
      const isMcSkyline = projectKey.includes('mc-skyline') || projectKey.includes('mc-skyline.online');
      mcSkylineProjectPromo.style.display = isMcSkyline ? 'block' : 'none';
    }

    // Lightbox Popup Viewer Elements
    const lightboxModal = document.getElementById('lightboxModal');
    const lightboxImg = document.getElementById('lightboxImg');
    const btnCloseLightbox = document.getElementById('btnCloseLightbox');

    const openLightbox = (imgSrc) => {
      if (!lightboxModal || !lightboxImg) return;
      lightboxImg.src = imgSrc;
      lightboxModal.style.display = 'flex';
      if (window.bringToFront) window.bringToFront(lightboxModal);
    };

    const closeLightbox = () => {
      if (lightboxModal) lightboxModal.style.display = 'none';
    };

    if (btnCloseLightbox) btnCloseLightbox.onclick = closeLightbox;
    if (lightboxModal) {
      lightboxModal.onclick = (e) => {
        if (e.target === lightboxModal) closeLightbox();
      };
    }
    window.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') closeLightbox();
    });

    // Cover Banner Image
    if (projCoverBanner) {
      if (proj.coverImage && proj.coverImage !== 'assets/photo/bcxlogo2.png') {
        projCoverBanner.src = proj.coverImage;
        projCoverBanner.style.display = 'block';
        projCoverBanner.style.cursor = 'pointer';
        projCoverBanner.title = 'คลิกเพื่อดูภาพขยายเต็มจอ';
        projCoverBanner.onclick = () => openLightbox(proj.coverImage);
        projCoverBanner.onerror = () => {
          projCoverBanner.onerror = null;
          projCoverBanner.src = 'assets/photo/bcxlogo2.png';
          projCoverBanner.style.cursor = 'default';
          projCoverBanner.onclick = null;
        };
      } else {
        projCoverBanner.style.display = 'none';
      }
    }

    // Screenshots Gallery
    if (projGalleryBox && projGalleryGrid) {
      if (proj.gallery && proj.gallery.length > 0) {
        projGalleryGrid.innerHTML = '';
        proj.gallery.forEach((imgUrl) => {
          const img = document.createElement('img');
          img.src = imgUrl;
          img.alt = 'Screenshot';
          img.className = 'proj-gallery-item';
          img.title = 'คลิกเพื่อดูภาพขยายเต็มจอ';
          img.onerror = () => {
            img.onerror = null;
            img.src = 'assets/photo/bcxlogo2.png';
            img.title = 'ไม่พบภาพต้นฉบับ';
          };
          img.onclick = () => openLightbox(imgUrl);
          projGalleryGrid.appendChild(img);
        });
        projGalleryBox.style.display = 'block';
      } else {
        projGalleryBox.style.display = 'none';
      }
    }

    // Badges
    if (projStatusBadge) {
      if (proj.status === 'active') {
        projStatusBadge.textContent = '🟢 เปิดใช้งานอยู่ (Active)';
        projStatusBadge.className = 'meta-badge badge-status-active';
      } else if (proj.status === 'closed') {
        projStatusBadge.textContent = '🔴 ปิดตัวแล้ว (Legacy)';
        projStatusBadge.className = 'meta-badge badge-status-closed';
      } else {
        projStatusBadge.textContent = '🔒 ความลับ / สปอยล์ (Spoiler)';
        projStatusBadge.className = 'meta-badge badge-status-spoiler';
      }
    }

    if (projFeaturedBadge) projFeaturedBadge.style.display = proj.isFeatured ? 'inline-flex' : 'none';
    if (projDevOnlyBadge) projDevOnlyBadge.style.display = proj.accessLevel === 'dev_only' ? 'inline-flex' : 'none';

    // Countdown Timer
    if (proj.releaseDate && projCountdownWrap && projCountdownVal) {
      projCountdownWrap.style.display = 'block';
      const target = new Date(proj.releaseDate).getTime();
      const updateTimer = () => {
        const now = new Date().getTime();
        const diff = target - now;
        if (diff <= 0) {
          projCountdownVal.textContent = '🚀 เปิดตัวอย่างเป็นทางการแล้ว!';
          projCountdownVal.style.color = '#4ade80';
        } else {
          const days = Math.floor(diff / (1000 * 60 * 60 * 24));
          const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
          const mins = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
          const secs = Math.floor((diff % (1000 * 60)) / 1000);
          projCountdownVal.textContent = `⏳ เปิดตัวใน: ${days}วัน ${hours}ชม. ${mins}น. ${secs}วิ`;
        }
      };
      updateTimer();
      setInterval(updateTimer, 1000);
    }

    // Tech Stack with Brand Icons
    if (projStackGrid) {
      projStackGrid.innerHTML = '';
      if (proj.stack && proj.stack.length > 0) {
        proj.stack.forEach((stk) => {
          const pill = document.createElement('div');
          pill.className = 'proj-tech-pill';

          const iconSvg = window.BestCynixCMS?.getTechIcon ? window.BestCynixCMS.getTechIcon(stk) : '💻';
          pill.innerHTML = `
            <span style="display:flex; align-items:center; width:20px; height:20px;">${iconSvg}</span>
            <span>${stk}</span>
          `;
          projStackGrid.appendChild(pill);
        });
      }
    }

    // Action Link
    if (btnVisitProjectUrl) {
      const websiteUrl = safeLink(proj.url);
      const websiteEnabled = proj.showWebsite !== false && Boolean(websiteUrl);
      btnVisitProjectUrl.style.display = websiteEnabled ? 'inline-flex' : 'none';
      btnVisitProjectUrl.href = websiteEnabled ? websiteUrl : '#';
      btnVisitProjectUrl.onclick = (e) => {
        if (!websiteEnabled) {
          e.preventDefault();
          return;
        }
        if (proj.accessLevel === 'dev_only' && !isDevAdmin) {
          e.preventDefault();
          showCyberToast('🛡️ โปรเจกต์นี้เปิดให้เข้าถึงได้เฉพาะบัญชีทีมพัฒนา (Dev Only) เท่านั้น', '', 'warning');
        }
      };
    }
    if (btnVisitProjectCommunity) {
      const communityUrl = safeLink(proj.communityUrl);
      const communityEnabled = proj.showCommunity === true && Boolean(communityUrl);
      btnVisitProjectCommunity.style.display = communityEnabled ? 'inline-flex' : 'none';
      btnVisitProjectCommunity.href = communityEnabled ? communityUrl : '#';
      btnVisitProjectCommunity.onclick = (e) => {
        if (!communityEnabled) {
          e.preventDefault();
          return;
        }
        if (proj.accessLevel === 'dev_only' && !isDevAdmin) {
          e.preventDefault();
          showCyberToast('🛡️ ชุมชนของโปรเจกต์นี้เปิดให้บัญชีทีมพัฒนาเท่านั้น', '', 'warning');
        }
      };
    }
  };

  // Share Project Link
  if (btnShareProject) {
    btnShareProject.addEventListener('click', async () => {
      try {
        await navigator.clipboard.writeText(window.location.href);
        showCyberToast('📋 คัดลอกลิงก์โปรเจกต์นี้เรียบร้อยแล้ว', '', 'success');
      } catch (err) {
        showCyberToast('คัดลอกลิงก์นี้:', window.location.href, 'info');
      }
    });
  }

  // Match Project in List Helper
  const findProjectInList = (list) => {
    if (!list || !list.length) return null;
    return list.find((p) => {
      const pId = (p.id || '').toLowerCase().trim().replace(/\s+/g, '-');
      const pTitle = (p.title || '').toLowerCase().trim().replace(/\s+/g, '-');
      return pId === normalizedId || pTitle === normalizedId || pId.includes(normalizedId) || normalizedId.includes(pId);
    }) || list[0];
  };

  const normalizeProject = (project) => {
    if (!project) return null;
    const fallback = (window.BestCynixCMS?.data?.projects || []).find((item) => item.id === project.id) || {};
    const canonicalCommunityUrls = {
      'mc-skyline': 'https://discord.gg/5eNFMMk3ak',
      'skylinebot-0194': 'https://discord.gg/CzsBvjYBdQ'
    };
    const canonicalCommunityUrl = canonicalCommunityUrls[project.id];
    const communityUrl = canonicalCommunityUrl && (!project.communityUrl || project.communityUrl === 'https://discord.gg/M8k2N3XgYF')
      ? canonicalCommunityUrl
      : (project.communityUrl || fallback.communityUrl || '');
    return {
      ...fallback,
      ...project,
      showWebsite: project.showWebsite !== false,
      communityUrl,
      showCommunity: project.showCommunity !== undefined
        ? project.showCommunity === true && Boolean(communityUrl)
        : fallback.showCommunity === true && Boolean(communityUrl)
    };
  };

  // Main Page Loader Router
  const loadPageContent = async () => {
    if (isCatalogMode) {
      initCatalogMode();
      return;
    }

    // Detail Mode: Check Auth for Dev and find project
    if (typeof firebase !== 'undefined' && firebase.apps.length) {
      const auth = firebase.auth();
      const db = firebase.firestore();

      auth.onAuthStateChanged(async (user) => {
        if (user) {
          isDevAdmin = (user.email === 'bestcynix@gmail.com' || user.email === 'admin@email.com');
          try {
            const docSnap = await db.collection('users').doc(user.uid).get();
            if (docSnap.exists && docSnap.data().role === 'admin') isDevAdmin = true;
          } catch (e) {}
        }

        // Fetch from Firestore
        try {
          const doc = await db.collection('site_cms').doc('projects').get();
          if (doc.exists && doc.data().list) {
            const found = normalizeProject(findProjectInList(doc.data().list));
            if (found) {
              renderProjectDetail(found);
              return;
            }
          }
        } catch (e) {}

        // Fallback from default dataset
        const fallbackList = window.BestCynixCMS?.data?.projects || [];
        const fallback = normalizeProject(findProjectInList(fallbackList) || fallbackList[0]);
        renderProjectDetail(fallback);
      });
    } else {
      const fallbackList = window.BestCynixCMS?.data?.projects || [];
      const fallback = normalizeProject(findProjectInList(fallbackList) || fallbackList[0]);
      renderProjectDetail(fallback);
    }
  };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', loadPageContent);
  } else {
    loadPageContent();
  }
})();
