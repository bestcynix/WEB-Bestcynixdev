/**
 * BestCyniX Dev - Affiliate eligibility and click policy
 *
 * Product data may remain in the legacy JSON files, but only records with a
 * verifiable tracking signal are allowed to render as a monetized offer.
 * Secrets/API keys must never be placed in public JavaScript or JSON.
 */
(function () {
  'use strict';

  const KNOWN_TRACKING_HOSTS = new Set([
    's.shopee.co.th',
    'aff.priceza.com',
    's.lazada.co.th',
    'c.lazada.co.th'
  ]);

  const toNumber = (value) => {
    if (typeof value === 'number') return Number.isFinite(value) ? value : 0;
    const parsed = parseFloat(String(value || '').replace(/[^0-9.]/g, ''));
    return Number.isFinite(parsed) ? parsed : 0;
  };

  const getUrl = (item) => String(item?.affiliateUrl || item?.affiliateLink || '').trim();

  const isTrackingUrl = (url) => {
    try {
      const parsed = new URL(url);
      return parsed.protocol === 'https:' && KNOWN_TRACKING_HOSTS.has(parsed.hostname);
    } catch (error) {
      return false;
    }
  };

  const commissionValue = (item) => item?.commissionRate ?? item?.rate;

  const isEligible = (item) => {
    if (!item || item.active === false || item.commissionEligible === false) return false;
    const url = getUrl(item);
    if (!isTrackingUrl(url)) return false;
    return item.commissionEligible === true
      || toNumber(commissionValue(item)) > 0
      || item.commissionStatus === 'verified';
  };

  const filter = (items) => Array.isArray(items) ? items.filter(isEligible) : [];

  const getPurchaseUrl = (item) => isEligible(item) ? getUrl(item) : '';

  const commissionLabel = (item) => {
    if (toNumber(commissionValue(item)) > 0) return `คอม ${commissionValue(item)}`;
    if (isEligible(item)) return 'Affiliate link';
    return '';
  };

  const attachClickTracking = (root = document) => {
    root.querySelectorAll('a[data-affiliate-id]').forEach((link) => {
      if (link.dataset.affiliateBound === 'true') return;
      link.dataset.affiliateBound = 'true';
      link.addEventListener('click', () => {
        window.dispatchEvent(new CustomEvent('bcx:affiliate-click', {
          detail: { id: link.dataset.affiliateId, platform: link.dataset.affiliatePlatform || 'unknown' }
        }));
      });
    });
  };

  window.BestCynixAffiliate = {
    isEligible,
    filter,
    getPurchaseUrl,
    commissionLabel,
    attachClickTracking,
    version: '2026.08.28'
  };
})();
