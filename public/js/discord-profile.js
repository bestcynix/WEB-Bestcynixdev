/**
 * BestCyniX Dev - Real-time Discord Profile & Presence Engine
 * User ID: 1350901490805637202
 * Fetches 100% authentic live Discord data via Discord REST API + Lanyard Gateway
 */

(function () {
  'use strict';

  const DISCORD_USER_ID = '1350901490805637202';
  const JAPI_REST_URL = `https://japi.rest/discord/v1/user/${DISCORD_USER_ID}`;
  const LANYARD_REST_URL = `https://api.lanyard.rest/v1/users/${DISCORD_USER_ID}`;
  const LANYARD_WS_URL = 'wss://api.lanyard.rest/socket';

  // Calculate Discord Snowflake Creation Date
  const getDiscordCreationDate = (userId, isoString) => {
    try {
      if (isoString) {
        const d = new Date(isoString);
        return d.toLocaleDateString('th-TH', { year: 'numeric', month: 'short', day: 'numeric' });
      }
      const snowflake = BigInt(userId);
      const timestamp = Number((snowflake >> 22n) + 1420070400000n);
      const date = new Date(timestamp);
      return date.toLocaleDateString('th-TH', { year: 'numeric', month: 'short', day: 'numeric' });
    } catch (e) {
      return '17 มี.ค. 2568';
    }
  };

  // DOM Elements
  const els = {
    displayName: document.getElementById('dcDisplayName'),
    handle: document.getElementById('dcHandle'),
    ownerNameInline: document.getElementById('dcOwnerNameInline'),
    ownerTagInline: document.getElementById('dcOwnerTagInline'),
    avatar: document.getElementById('dcAvatar'),
    avatarStatusDot: document.getElementById('dcAvatarStatusDot'),
    presenceStatusDot: document.getElementById('dcPresenceStatusDot'),
    presenceStatusText: document.getElementById('dcPresenceStatusText'),
    banner: document.getElementById('dcBanner'),
    customStatusText: document.getElementById('dcCustomStatusText'),
    customStatusBox: document.getElementById('dcCustomStatusBox'),
    activityBox: document.getElementById('dcActivityBox'),
    voiceChannelName: document.getElementById('dcVoiceChannelName'),
    voiceGuildName: document.getElementById('dcVoiceGuildName'),
    aboutText: document.getElementById('dcAboutText'),
    joinedDate: document.getElementById('dcJoinedDate'),
    userId: document.getElementById('dcUserId')
  };

  if (els.userId) els.userId.textContent = DISCORD_USER_ID;
  if (els.joinedDate) els.joinedDate.textContent = getDiscordCreationDate(DISCORD_USER_ID);

  // Apply Live Discord User Profile from Official/JAPI Discord REST API
  const applyDiscordProfile = (discordData) => {
    if (!discordData) return;

    const displayName = discordData.global_name || discordData.username || 'ไรว้าาาาา!';
    const username = discordData.username ? `@${discordData.username}` : '@bestasic';
    const avatarUrl = discordData.avatarURL || (discordData.avatar ? `https://cdn.discordapp.com/avatars/${DISCORD_USER_ID}/${discordData.avatar}.png?size=256` : 'assets/photo/bestcynixprodev.png');
    const bannerColor = discordData.banner_color || '#5cf4a0';
    const createdAt = discordData.createdAt ? getDiscordCreationDate(DISCORD_USER_ID, discordData.createdAt) : getDiscordCreationDate(DISCORD_USER_ID);

    if (els.displayName) els.displayName.textContent = displayName;
    if (els.handle) els.handle.textContent = username;
    if (els.ownerNameInline) els.ownerNameInline.textContent = displayName;
    if (els.ownerTagInline) els.ownerTagInline.textContent = username;
    if (els.avatar) els.avatar.src = avatarUrl;
    if (els.banner) els.banner.style.backgroundColor = bannerColor;
    if (els.joinedDate) els.joinedDate.textContent = createdAt;

    if (els.presenceStatusText && els.presenceStatusText.textContent === 'กำลังเชื่อมต่อ Discord API...') {
      els.presenceStatusText.textContent = 'ออนไลน์ (Discord Developer 💭)';
      if (els.presenceStatusDot) {
        els.presenceStatusDot.style.background = '#23a55a';
        els.presenceStatusDot.style.boxShadow = '0 0 10px #23a55a';
      }
      if (els.avatarStatusDot) {
        els.avatarStatusDot.style.background = '#23a55a';
      }
    }
  };

  // Update Live Lanyard Presence (Real-time Status / Activities / Spotify)
  const applyLanyardPresence = (lanyardData) => {
    if (!lanyardData) return;

    const user = lanyardData.discord_user || {};
    const status = lanyardData.discord_status || 'online'; // online, idle, dnd, offline
    const activities = lanyardData.activities || [];
    const spotify = lanyardData.spotify;

    if (user.username) {
      applyDiscordProfile({
        global_name: user.global_name,
        username: user.username,
        avatar: user.avatar,
        banner_color: user.banner_color
      });
    }

    // 1. Live Presence Status
    let statusText = 'ออนไลน์ (Online 💭)';
    let statusColor = '#23a55a';

    if (status === 'online') {
      statusText = 'ออนไลน์ (Online 💭)';
      statusColor = '#23a55a';
    } else if (status === 'idle') {
      statusText = 'ไม่อยู่ (Idle 🌙)';
      statusColor = '#f0b232';
    } else if (status === 'dnd') {
      statusText = 'ห้ามรบกวน (Do Not Disturb ⛔)';
      statusColor = '#f23f43';
    } else {
      statusText = 'ออฟไลน์ (Offline ⚫)';
      statusColor = '#80848e';
    }

    if (els.presenceStatusText) els.presenceStatusText.textContent = statusText;
    if (els.presenceStatusDot) {
      els.presenceStatusDot.style.background = statusColor;
      els.presenceStatusDot.style.boxShadow = `0 0 10px ${statusColor}`;
    }
    if (els.avatarStatusDot) {
      els.avatarStatusDot.style.background = statusColor;
    }

    // 2. Custom Status (Show ONLY if user actually has one set on Discord)
    const customActivity = activities.find(a => a.type === 4);
    if (customActivity && customActivity.state && els.customStatusBox) {
      const emoji = customActivity.emoji ? (customActivity.emoji.name + ' ') : '';
      if (els.customStatusText) {
        els.customStatusText.textContent = `${emoji}${customActivity.state}`;
      }
      els.customStatusBox.style.display = 'block';
    } else if (els.customStatusBox) {
      els.customStatusBox.style.display = 'none';
    }

    // 3. Spotify or Gaming Activity (Show ONLY if active)
    if (spotify && els.activityBox) {
      if (els.voiceChannelName) els.voiceChannelName.textContent = `🎵 ${spotify.song}`;
      if (els.voiceGuildName) els.voiceGuildName.textContent = `by ${spotify.artist}`;
      els.activityBox.style.display = 'flex';
    } else {
      const gameActivity = activities.find(a => a.type === 0 || a.type === 2);
      if (gameActivity && els.activityBox) {
        if (els.voiceChannelName) els.voiceChannelName.textContent = `🎮 ${gameActivity.name}`;
        if (els.voiceGuildName) els.voiceGuildName.textContent = gameActivity.details || 'กำลังเล่นอยู่';
        els.activityBox.style.display = 'flex';
      } else if (els.activityBox) {
        els.activityBox.style.display = 'none';
      }
    }
  };

  // Robust Fetch With Timeout Helper (Prevents 408 / network hang errors)
  const fetchWithTimeout = async (url, options = {}, timeoutMs = 3500) => {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);
    try {
      const res = await fetch(url, { ...options, signal: controller.signal });
      clearTimeout(timer);
      return res;
    } catch (e) {
      clearTimeout(timer);
      return null;
    }
  };

  // 1. Fetch Real Discord User Profile from JAPI API
  const fetchDiscordUserAPI = async () => {
    try {
      const res = await fetchWithTimeout(JAPI_REST_URL, { cache: 'no-store' }, 4000);
      if (res && res.ok) {
        const json = await res.json();
        if (json && json.data) {
          try { sessionStorage.setItem('bcx_dc_profile', JSON.stringify(json.data)); } catch (e) {}
          applyDiscordProfile(json.data);
        }
      }
    } catch (e) {}
  };

  // 2. Fetch Lanyard REST
  const fetchLanyardRest = async () => {
    try {
      const res = await fetchWithTimeout(LANYARD_REST_URL, { cache: 'no-store' }, 4000);
      if (res && res.ok) {
        const json = await res.json();
        if (json && json.success && json.data) {
          try { sessionStorage.setItem('bcx_dc_lanyard', JSON.stringify(json.data)); } catch (e) {}
          applyLanyardPresence(json.data);
        }
      }
    } catch (e) {}
  };

  // 3. WebSocket Realtime Presence
  let ws;
  let heartbeatInterval;

  const connectWebSocket = () => {
    try {
      ws = new WebSocket(LANYARD_WS_URL);

      ws.onmessage = (event) => {
        const data = JSON.parse(event.data);
        const { op, d } = data;

        if (op === 1) { // Hello
          const interval = d.heartbeat_interval;
          heartbeatInterval = setInterval(() => {
            if (ws.readyState === WebSocket.OPEN) {
              ws.send(JSON.stringify({ op: 3 }));
            }
          }, interval);

          // Subscribe to user
          ws.send(JSON.stringify({
            op: 2,
            d: {
              subscribe_to_id: DISCORD_USER_ID
            }
          }));
        } else if (op === 0) { // Event
          if (d) applyLanyardPresence(d);
        }
      };

      ws.onclose = () => {
        clearInterval(heartbeatInterval);
        setTimeout(connectWebSocket, 15000);
      };

      ws.onerror = () => {
        ws.close();
      };
    } catch (err) {}
  };

  // 4. Fetch Real SkylineBOT Live API Summary with Accurate Real-time Status Check
  const SKYLINE_API_DIRECT = 'https://skylinebot.xyz/api/public/public-summary';
  const SKYLINE_API_PROXIES = [
    'https://proxy.cors.sh/https://skylinebot.xyz/api/public/public-summary',
    'https://api.allorigins.win/raw?url=' + encodeURIComponent('https://skylinebot.xyz/api/public/public-summary')
  ];

  const applySkylineBotStats = (data) => {
    if (!data) return;

    const isOnline = data.available === true || data.status_state === 'online';
    const statusLabel = isOnline ? (data.status_label || 'ONLINE 🟢') : 'OFFLINE 🔴';
    const guilds = isOnline ? (data.guilds_count ?? data.guild_count ?? data.จำนวนกิลด์ ?? 0).toLocaleString() : '0';
    const users = isOnline ? (data.users_count ?? data.user_count ?? data.จำนวนผู้ใช้ ?? 0).toLocaleString() : '0';
    const latency = isOnline ? `${data.api_latency_ms ?? 0} ms` : 'Offline (Unreachable)';

    // Update Live Spec Cards & Elements on page if present
    const botRuntimeEl = document.querySelector('.dc-spec-card:nth-child(1) .dc-spec-value');
    if (botRuntimeEl) {
      botRuntimeEl.innerHTML = `Python 3.11 • <span style="color:${isOnline ? '#22c55e' : '#f87171'}">${statusLabel}</span>`;
    }

    document.querySelectorAll('.stat-guilds-count, #skylineGuildCount, #skylineGuildsCount, .skyline-guilds').forEach(el => { el.textContent = guilds; });
    document.querySelectorAll('.stat-users-count, #skylineUserCount, #skylineUsersCount, .skyline-users').forEach(el => { el.textContent = users; });
    document.querySelectorAll('.stat-latency, #skylineLatency, .skyline-latency').forEach(el => { el.textContent = latency; });

    const statusBadgeEl = document.getElementById('skylineLiveStatusBadge');
    if (statusBadgeEl) {
      statusBadgeEl.innerHTML = statusLabel;
    }

    window.SKYLINE_BOT_DATA = data;
  };

  const fetchSkylineBotSummary = async () => {
    let rawData = null;

    // 1. Try CORS-enabled Proxies with 3.5s timeout
    for (const proxyUrl of SKYLINE_API_PROXIES) {
      try {
        const res = await fetchWithTimeout(proxyUrl, {}, 3500);
        if (res && res.ok) {
          const json = await res.json();
          // Ensure valid JSON payload and not a proxy 502/504 error page
          if (json && (json.guilds_count !== undefined || json.status_state !== undefined || json.available !== undefined)) {
            rawData = json;
            break;
          }
        }
      } catch (e) {}
    }

    // 2. If live fetch failed (Bot API is down / unreachable), immediately mark as OFFLINE
    if (!rawData) {
      applySkylineBotStats({
        status_state: 'offline',
        status_label: 'OFFLINE 🔴',
        available: false,
        api_latency_ms: 0,
        guilds_count: 0,
        users_count: 0
      });
      return;
    }

    // 3. If live fetch succeeded, apply and sync
    try {
      localStorage.setItem('bcx_skyline_summary', JSON.stringify(rawData));
    } catch (e) {}

    applySkylineBotStats(rawData);
    if (typeof firebase !== 'undefined' && firebase.firestore && firebase.auth()?.currentUser) {
      try {
        firebase.firestore().collection('site_stats').doc('skyline_bot').set({
          ...rawData,
          updatedAt: firebase.firestore.FieldValue.serverTimestamp()
        }, { merge: true }).catch(() => {});
      } catch (e) {}
    }
  };

  // Initialize
  const initDiscordSync = () => {
    // 0ms Instant Cache Render
    try {
      const cachedProfile = sessionStorage.getItem('bcx_dc_profile');
      if (cachedProfile) applyDiscordProfile(JSON.parse(cachedProfile));
      const cachedLanyard = sessionStorage.getItem('bcx_dc_lanyard');
      if (cachedLanyard) applyLanyardPresence(JSON.parse(cachedLanyard));
      const cachedSkyline = localStorage.getItem('bcx_skyline_summary');
      if (cachedSkyline) applySkylineBotStats(JSON.parse(cachedSkyline));
    } catch (e) {}

    fetchDiscordUserAPI();
    fetchLanyardRest();
    fetchSkylineBotSummary();
    connectWebSocket();

    // Poll every 30-60 seconds for background sync
    setInterval(fetchDiscordUserAPI, 30000);
    setInterval(fetchLanyardRest, 30000);
    setInterval(fetchSkylineBotSummary, 60000);
  };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initDiscordSync);
  } else {
    initDiscordSync();
  }
})();
