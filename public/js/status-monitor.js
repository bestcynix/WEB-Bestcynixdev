/**
 * BestCyniX Dev - Server-backed status and uptime monitor.
 * The page never invents latency or uptime values; it only renders the
 * sanitized probe reports returned by Firebase Functions.
 */
(function () {
  'use strict';

  const API_URL = window.location.hostname.endsWith('vercel.app')
    ? '/api/status'
    : 'https://web-bestcynixdev.vercel.app/api/status';
  let currentMode = '10m';
  let statusPayload = null;

  const $ = (id) => document.getElementById(id);
  const asNumber = (value) => Number.isFinite(Number(value)) ? Number(value) : null;

  const setBadge = (id, service) => {
    const badge = $(id);
    if (!badge) return;
    const state = service?.status || 'unknown';
    badge.className = `status-badge ${state === 'operational' ? 'online' : state === 'degraded' ? 'warning' : 'offline'}`;
    badge.textContent = `● ${service?.label || state.toUpperCase()}`;
  };

  const setLatency = (id, service) => {
    const el = $(id);
    if (!el) return;
    const value = asNumber(service?.latencyMs);
    el.textContent = value === null ? '—' : `${value} ms`;
  };

  const updateServiceCards = (report) => {
    const services = report?.services || {};
    setLatency('skylineLatency', services.skylinebot);
    setLatency('discordLatency', services.discord);
    setLatency('webLatency', services.web);
    setLatency('dbLatency', services.database);
    setLatency('chatLatency', services.chat);
    setBadge('skylineBadge', services.skylinebot);
    setBadge('discordBadge', services.discord);
    setBadge('webBadge', services.web);
    setBadge('dbBadge', services.database);
    setBadge('chatBadge', services.chat);

    const skylineMetrics = services.skylinebot?.metrics || {};
    if ($('skylineGuildsCount')) $('skylineGuildsCount').textContent = skylineMetrics.guildsCount == null ? '—' : Number(skylineMetrics.guildsCount).toLocaleString();
    if ($('skylineUsersCount')) $('skylineUsersCount').textContent = skylineMetrics.usersCount == null ? '—' : Number(skylineMetrics.usersCount).toLocaleString();
    if ($('skylineLastChecked')) $('skylineLastChecked').textContent = report?.checkedAt
      ? `ตรวจสอบจริงเมื่อ: ${new Date(report.checkedAt).toLocaleString('th-TH')} • Server probe`
      : 'ยังไม่มีผลตรวจสอบจากเซิร์ฟเวอร์';
    if ($('discordStatusDetail')) $('discordStatusDetail').textContent = services.discord?.detail || 'ยังไม่มีผลตรวจสอบ Discord';
    if ($('rawApiOutput')) $('rawApiOutput').textContent = report ? JSON.stringify(report, null, 2) : 'ยังไม่มีข้อมูลจาก server probe';
  };

  const updateHero = (overall) => {
    const banner = $('heroStatusBanner');
    const dot = $('heroPulseDot');
    const title = $('heroStatusTitle');
    const desc = $('heroStatusDesc');
    if (overall === 'operational') {
      if (banner) banner.style.cssText += ';background:linear-gradient(135deg,rgba(16,185,129,.18),rgba(6,78,59,.28));border-color:rgba(16,185,129,.45)';
      if (dot) dot.style.cssText += ';background:#10b981;box-shadow:0 0 20px #10b981';
      if (title) title.textContent = 'ระบบทั้งหมดทำงานเป็นปกติ';
      if (desc) desc.textContent = 'All server-backed probes are operational';
    } else if (overall === 'degraded') {
      if (banner) banner.style.cssText += ';background:linear-gradient(135deg,rgba(245,158,11,.18),rgba(120,53,15,.28));border-color:rgba(245,158,11,.45)';
      if (dot) dot.style.cssText += ';background:#f59e0b;box-shadow:0 0 20px #f59e0b';
      if (title) title.textContent = 'ระบบทำงาน แต่อาจมีบางบริการหน่วง';
      if (desc) desc.textContent = 'One or more server-backed probes reported degraded status';
    } else {
      if (banner) banner.style.cssText += ';background:linear-gradient(135deg,rgba(239,68,68,.22),rgba(127,29,29,.38));border-color:rgba(239,68,68,.6)';
      if (dot) dot.style.cssText += ';background:#ef4444;box-shadow:0 0 20px #ef4444';
      if (title) title.textContent = overall === 'outage' ? 'ตรวจพบระบบขัดข้อง' : 'ยังไม่มีข้อมูลสถานะ';
      if (desc) desc.textContent = overall === 'outage' ? 'One or more server-backed probes failed' : 'Waiting for the first server probe';
    }
  };

  const formatRange = (checkedAt, minutes) => {
    const start = new Date(checkedAt);
    const end = new Date(start.getTime() + minutes * 60000);
    return `${start.toLocaleDateString('th-TH', { day: 'numeric', month: 'short' })} เวลา ${start.toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' })} - ${end.toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' })} น.`;
  };

  const statusLabel = (state) => state === 'operational' ? 'ปกติ' : state === 'degraded' ? 'หน่วง/ปรับปรุง' : state === 'outage' ? 'ขัดข้อง' : 'ไม่ทราบสถานะ';
  const statusEmoji = (state) => state === 'operational' ? '🟢' : state === 'degraded' ? '🟡' : state === 'outage' ? '🔴' : '⚪';

  const getHistoryItems = () => {
    if (!statusPayload) return [];
    if (currentMode === '90d') {
      return (statusPayload.daily || []).slice().reverse().map(day => ({
        checkedAt: `${day.dayKey}T00:00:00.000Z`,
        status: day.lastOverall || 'unknown',
        latencyMs: day.totalChecks ? Math.round((day.latencyTotalMs || 0) / day.totalChecks) : null,
        uptimeRate: day.totalChecks ? (Number(day.passedChecks || 0) / Number(day.totalChecks) * 100).toFixed(2) : '—',
        passed: `${day.passedChecks || 0} / ${day.totalChecks || 0}`,
        note: `บันทึกจริง ${day.totalChecks || 0} รอบในวันนี้`
      }));
    }
    const hours = currentMode === '5m' ? 5 : 12;
    const cutoff = Date.now() - hours * 60 * 60 * 1000;
    return (statusPayload.history || []).slice().reverse().filter(item => Date.parse(item.checkedAt) >= cutoff).map(item => {
      const services = Object.values(item.services || {});
      const passed = services.filter(service => service.status === 'operational').length;
      return {
        checkedAt: item.checkedAt,
        status: item.overall || 'unknown',
        latencyMs: services.length ? Math.round(services.reduce((sum, service) => sum + (Number(service.latencyMs) || 0), 0) / services.length) : null,
        uptimeRate: item.overall === 'operational' ? '100.00' : '0.00',
        passed: `${passed} / ${services.length}`,
        note: item.services?.skylinebot?.detail || 'Server probe report'
      };
    });
  };

  const inspect = (item) => {
    if (!item) return;
    if ($('inspectTimeRange')) $('inspectTimeRange').textContent = currentMode === '90d' ? new Date(item.checkedAt).toLocaleDateString('th-TH', { dateStyle: 'full' }) : formatRange(item.checkedAt, currentMode === '5m' ? 5 : 10);
    if ($('inspectLatency')) $('inspectLatency').textContent = item.latencyMs == null ? '—' : `${item.latencyMs} ms`;
    if ($('inspectUptimeRate')) $('inspectUptimeRate').textContent = item.uptimeRate === '—' ? '—' : `${item.uptimeRate}%`;
    if ($('inspectPassed')) $('inspectPassed').textContent = `${item.passed} ผ่านการตรวจจริง`;
    if ($('inspectIncidentNote')) $('inspectIncidentNote').textContent = item.note;
    const badge = $('inspectBadge');
    if (badge) {
      badge.className = `status-badge ${item.status === 'operational' ? 'online' : item.status === 'degraded' ? 'warning' : 'offline'}`;
      badge.textContent = `● ${statusEmoji(item.status)} ${statusLabel(item.status)}`;
    }
  };

  const renderHistory = () => {
    const container = $('uptimeBarsContainer');
    if (!container) return;
    container.replaceChildren();
    const items = getHistoryItems();
    const total = items.length;
    const passed = items.filter(item => item.status === 'operational').length;
    const uptime = total ? (passed / total * 100).toFixed(2) : '—';
    if ($('uptimeRangeLeft')) $('uptimeRangeLeft').textContent = currentMode === '90d' ? '90 วันที่แล้ว' : currentMode === '5m' ? '5 ชั่วโมงที่แล้ว' : '12 ชั่วโมงที่แล้ว';
    if ($('uptimeRangeRight')) $('uptimeRangeRight').textContent = total ? 'ล่าสุดจาก server' : 'ยังไม่มีข้อมูล';
    if ($('uptimePercentageText')) $('uptimePercentageText').textContent = total ? `${uptime}% Uptime จาก ${total} รอบจริง` : 'ยังไม่มี Uptime data';
    if (!total) {
      const empty = document.createElement('div');
      empty.style.cssText = 'color:var(--muted);padding:1.5rem;text-align:center;width:100%';
      empty.textContent = 'ยังไม่มีประวัติที่บันทึกจาก server monitor';
      container.appendChild(empty);
      inspect(null);
      return;
    }
    items.forEach((item, index) => {
      const bar = document.createElement('div');
      bar.className = `uptime-bar bar-${item.status === 'operational' ? 'green' : item.status === 'degraded' ? 'yellow' : 'red'}${index === items.length - 1 ? ' selected' : ''}`;
      bar.title = `${new Date(item.checkedAt).toLocaleString('th-TH')} • ${statusLabel(item.status)} • ${item.latencyMs == null ? '—' : item.latencyMs + ' ms'}`;
      bar.addEventListener('click', () => {
        container.querySelectorAll('.uptime-bar').forEach(node => node.classList.remove('selected'));
        bar.classList.add('selected');
        inspect(item);
      });
      container.appendChild(bar);
    });
    inspect(items[items.length - 1]);
  };

  const showUnavailable = () => {
    updateHero('unknown');
    updateServiceCards(null);
    if ($('telemetryStatusText')) $('telemetryStatusText').textContent = '● SERVER PROBE UNAVAILABLE';
    renderHistory();
  };

  const loadStatus = async (forceRun = false) => {
    const button = $('btnRefreshStatus');
    if (button) button.disabled = true;
    try {
      const response = await fetch(`${API_URL}${forceRun ? '?run=1' : ''}`, { cache: 'no-store', headers: { accept: 'application/json' } });
      if (!response.ok) throw new Error(`status_api_${response.status}`);
      statusPayload = await response.json();
      updateHero(statusPayload.current?.overall);
      updateServiceCards(statusPayload.current);
      if ($('telemetryStatusText')) $('telemetryStatusText').textContent = `● LIVE SERVER SYNC • ${new Date(statusPayload.generatedAt || Date.now()).toLocaleTimeString('th-TH')}`;
      renderHistory();
    } catch (error) {
      // The UI carries the unavailable state; do not turn an expected backend
      // outage into a noisy console error for visitors.
      void error;
      showUnavailable();
    } finally {
      if (button) {
        button.disabled = false;
        button.textContent = '🔄 ตรวจสอบสดอีกครั้ง';
      }
    }
  };

  const toggleTelemetry = () => {
    const drawer = $('telemetryDrawer');
    if (!drawer) return;
    const open = drawer.style.display === 'none' || drawer.style.display === '';
    drawer.style.display = open ? 'block' : 'none';
    if ($('eyeIcon')) $('eyeIcon').textContent = open ? '🙈' : '👁️';
    if ($('eyeText')) $('eyeText').textContent = open ? 'ซ่อนข้อมูล JSON' : 'ดูข้อมูล JSON';
    if ($('eyeArrow')) $('eyeArrow').style.transform = open ? 'rotate(180deg)' : 'rotate(0deg)';
  };

  document.querySelectorAll('.uptime-mode-btn').forEach(button => button.addEventListener('click', () => {
    document.querySelectorAll('.uptime-mode-btn').forEach(node => node.classList.remove('active'));
    button.classList.add('active');
    currentMode = button.dataset.mode || '10m';
    renderHistory();
  }));
  $('btnRefreshStatus')?.addEventListener('click', () => loadStatus(true));
  $('btnToggleTelemetry')?.addEventListener('click', event => { if (!event.target.closest('button')) toggleTelemetry(); });
  $('btnEyeToggle')?.addEventListener('click', event => { event.stopPropagation(); toggleTelemetry(); });
  $('btnCopyJson')?.addEventListener('click', () => navigator.clipboard?.writeText($('rawApiOutput')?.textContent || ''));
  $('btnDownloadJson')?.addEventListener('click', () => {
    const blob = new Blob([$('rawApiOutput')?.textContent || '{}'], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = `skylinebot-telemetry-${new Date().toISOString().slice(0, 10)}.json`;
    anchor.click();
    URL.revokeObjectURL(url);
  });

  loadStatus(true);
  setInterval(() => loadStatus(false), 30000);
})();
