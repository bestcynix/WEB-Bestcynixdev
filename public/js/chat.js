/**
 * BestCyniX Dev - Live Web Chat Client
 * Messenger / LINE Cyber Style: Fullscreen, Quotes, Emojis, Image Attachments, Real-Time Presence
 */

(function () {
  'use strict';

  const liveChatWindow = document.getElementById('liveChatWindow');
  const btnLiveChatLauncher = document.getElementById('btnLiveChatLauncher');
  const btnCloseChatWindow = document.getElementById('btnCloseChatWindow');
  const btnToggleChatMaximize = document.getElementById('btnToggleChatMaximize');
  const btnToggleChatSearch = document.getElementById('btnToggleChatSearch');
  const chatSearchDropdown = document.getElementById('chatSearchDropdown');
  const chatSearchInput = document.getElementById('chatSearchInput');
  const chatMessagesArea = document.getElementById('chatMessagesArea');
  const chatTextInput = document.getElementById('chatTextInput');
  const btnChatSend = document.getElementById('btnChatSend');
  const chatFileInput = document.getElementById('chatFileInput');
  const btnChatAttach = document.getElementById('btnChatAttach');
  const chatPreviewWrap = document.getElementById('chatPreviewWrap');
  const chatPreviewImg = document.getElementById('chatPreviewImg');
  const btnRemoveChatImg = document.getElementById('btnRemoveChatImg');
  const chatUnreadBadge = document.getElementById('chatUnreadBadge');
  const userQuotePreview = document.getElementById('userQuotePreview');
  const userQuoteSnippet = document.getElementById('userQuoteSnippet');
  const btnCancelUserQuote = document.getElementById('btnCancelUserQuote');

  let activeChatId = localStorage.getItem('bestcynix_anon_chat_id') || ('anon_' + Math.random().toString(36).substring(2, 9));
  localStorage.setItem('bestcynix_anon_chat_id', activeChatId);

  let selectedChatFile = null;
  let userActiveQuote = null;
  let chatMessagesUnsubscribe = null;
  let lastUserMessageTime = 0;

  const escapeHTML = (str) => {
    if (!str) return '';
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  };

  const storageErrorMessage = (error) => {
    const code = String(error?.code || '');
    if (code === 'storage/quota-exceeded' || code.endsWith('/quota-exceeded')) return 'Firebase Storage ใช้งานครบโควตา หรือโปรเจกต์ยังไม่ได้เปิดแพ็กเกจ Blaze กรุณาตรวจสอบ Billing และ Storage quota ก่อนอัปโหลดไฟล์อีกครั้ง';
    if (code === 'storage/unauthorized') return 'ไม่มีสิทธิ์อัปโหลดไฟล์นี้';
    if (code === 'storage/canceled') return 'ยกเลิกการอัปโหลดไฟล์แล้ว';
    if (code === 'storage/retry-limit-exceeded') return 'อัปโหลดไม่สำเร็จเพราะการเชื่อมต่อไม่เสถียร กรุณาลองใหม่';
    if (code === 'storage/network-request-failed') return 'อัปโหลดไม่สำเร็จเพราะเครือข่ายขัดข้อง กรุณาตรวจสอบอินเทอร์เน็ตแล้วลองใหม่';
    return error?.message || 'อัปโหลดไฟล์ไม่สำเร็จ';
  };

  // Helper: Lock / Unlock page background scroll on Fullscreen Chat
  const syncChatScrollLock = () => {
    const isFullscreen = liveChatWindow && liveChatWindow.classList.contains('active') && liveChatWindow.classList.contains('fullscreen');
    if (isFullscreen) {
      document.body.classList.add('chat-fullscreen-lock');
      document.body.style.overflow = 'hidden';
      document.documentElement.style.overflow = 'hidden';
    } else {
      document.body.classList.remove('chat-fullscreen-lock');
      document.body.style.overflow = '';
      document.documentElement.style.overflow = '';
    }
  };

  // 1. Toggle Live Chat Window
  const toggleLiveChat = () => {
    if (!liveChatWindow) return;
    const isOpen = liveChatWindow.classList.contains('active');
    if (isOpen) {
      liveChatWindow.classList.remove('active');
      liveChatWindow.classList.remove('fullscreen');
      syncChatScrollLock();
    } else {
      liveChatWindow.classList.add('active');
      if (window.bringToFront) window.bringToFront(liveChatWindow);
      if (chatUnreadBadge) {
        chatUnreadBadge.style.display = 'none';
        chatUnreadBadge.textContent = '0';
      }
      if (chatMessagesArea) {
        chatMessagesArea.scrollTop = chatMessagesArea.scrollHeight;
      }
      syncChatScrollLock();
    }
  };

  if (liveChatWindow) {
    liveChatWindow.addEventListener('mousedown', () => {
      if (window.bringToFront) window.bringToFront(liveChatWindow);
    });
  }

  if (btnLiveChatLauncher) btnLiveChatLauncher.addEventListener('click', toggleLiveChat);
  if (btnCloseChatWindow) {
    btnCloseChatWindow.addEventListener('click', () => {
      liveChatWindow.classList.remove('active');
      liveChatWindow.classList.remove('fullscreen');
      syncChatScrollLock();
    });
  }
  document.getElementById('btnOpenChatFromMenu')?.addEventListener('click', () => {
    toggleLiveChat();
    document.getElementById('userDropdownMenu')?.classList.remove('active');
  });
  document.getElementById('footerLiveChatLink')?.addEventListener('click', toggleLiveChat);

  // 2. Fullscreen Toggle
  if (btnToggleChatMaximize && liveChatWindow) {
    btnToggleChatMaximize.addEventListener('click', () => {
      const isFull = liveChatWindow.classList.toggle('fullscreen');
      if (window.bringToFront) window.bringToFront(liveChatWindow);
      syncChatScrollLock();

      if (isFull) {
        btnToggleChatMaximize.innerHTML = `
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <polyline points="4 14 10 14 10 20"></polyline>
            <polyline points="20 10 14 10 14 4"></polyline>
            <line x1="14" y1="10" x2="21" y2="3"></line>
            <line x1="3" y1="21" x2="10" y2="14"></line>
          </svg>`;
        btnToggleChatMaximize.title = 'ย่อขนาดหน้าต่างแชท';
      } else {
        btnToggleChatMaximize.innerHTML = `
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <polyline points="15 3 21 3 21 9"></polyline>
            <polyline points="9 21 3 21 3 15"></polyline>
            <line x1="21" y1="3" x2="14" y2="10"></line>
            <line x1="3" y1="21" x2="10" y2="14"></line>
          </svg>`;
        btnToggleChatMaximize.title = 'ขยายเต็มหน้าจอ';
      }
      if (chatMessagesArea) {
        setTimeout(() => { chatMessagesArea.scrollTop = chatMessagesArea.scrollHeight; }, 100);
      }
    });
  }

  // 3. Online / Office Hours Presence Check
  const updateChatOnlineStatus = () => {
    const now = new Date();
    const currentHour = now.getHours();
    const isBusinessHours = currentHour >= 9 && currentHour <= 23;
    const statusText = document.getElementById('chatOnlineStatusText');
    const statusDot = document.getElementById('chatOnlineDot');
    if (statusText && statusDot) {
      if (isBusinessHours) {
        statusText.textContent = 'ออนไลน์พร้อมตอบกลับ';
        statusDot.style.background = '#32ffc9';
        statusDot.style.boxShadow = '0 0 10px #32ffc9';
      } else {
        statusText.textContent = '🌙 นอกเวลาทำการ (ฝากข้อความไว้ได้)';
        statusDot.style.background = '#f59e0b';
        statusDot.style.boxShadow = '0 0 8px #f59e0b';
      }
    }
  };
  updateChatOnlineStatus();

  // 4. Quote Reply
  const setUserQuoteReply = (text) => {
    userActiveQuote = text;
    if (userQuoteSnippet) userQuoteSnippet.textContent = text.length > 45 ? text.substring(0, 45) + '...' : text;
    if (userQuotePreview) userQuotePreview.style.display = 'flex';
    if (chatTextInput) chatTextInput.focus();
  };

  if (btnCancelUserQuote) {
    btnCancelUserQuote.addEventListener('click', () => {
      userActiveQuote = null;
      if (userQuotePreview) userQuotePreview.style.display = 'none';
    });
  }

  // 5. Quick Emoji buttons
  document.querySelectorAll('.btn-emoji-quick').forEach((btn) => {
    btn.addEventListener('click', () => {
      if (chatTextInput) {
        chatTextInput.value += btn.dataset.emoji;
        chatTextInput.focus();
      }
    });
  });

  // 6. In-Chat Search
  if (btnToggleChatSearch && chatSearchDropdown) {
    btnToggleChatSearch.addEventListener('click', () => {
      chatSearchDropdown.classList.toggle('active');
      if (chatSearchDropdown.classList.contains('active') && chatSearchInput) {
        chatSearchInput.focus();
      }
    });
  }

  if (chatSearchInput) {
    chatSearchInput.addEventListener('input', (e) => {
      const query = e.target.value.toLowerCase().trim();
      const bubbles = chatMessagesArea?.querySelectorAll('.chat-msg') || [];
      bubbles.forEach((b) => {
        const text = b.querySelector('.msg-bubble')?.textContent.toLowerCase() || '';
        if (query === '' || text.includes(query)) {
          b.style.display = '';
          b.style.opacity = '1';
        } else {
          b.style.opacity = '0.2';
        }
      });
    });
  }

  // 7. Attach Image
  if (btnChatAttach && chatFileInput) {
    btnChatAttach.addEventListener('click', () => chatFileInput.click());
    chatFileInput.addEventListener('change', (e) => {
      const file = e.target.files[0];
      if (!file) return;
      selectedChatFile = file;
      const reader = new FileReader();
      reader.onload = () => {
        if (chatPreviewImg) chatPreviewImg.src = reader.result;
        if (chatPreviewWrap) chatPreviewWrap.style.display = 'flex';
      };
      reader.readAsDataURL(file);
    });
  }

  if (btnRemoveChatImg) {
    btnRemoveChatImg.addEventListener('click', () => {
      selectedChatFile = null;
      if (chatFileInput) chatFileInput.value = '';
      if (chatPreviewWrap) chatPreviewWrap.style.display = 'none';
    });
  }

  // 8. Connect Real-time Chat
  window.connectLiveChatUser = (userId) => {
    if (userId) activeChatId = userId;
    if (typeof firebase === 'undefined' || !firebase.apps.length) return;
    const db = firebase.firestore();

    if (chatMessagesUnsubscribe) chatMessagesUnsubscribe();

    let isInitialChatSnapshot = true;
    const handleChatSnapshot = (snapshot) => {
      if (!chatMessagesArea) return;

      if (!isInitialChatSnapshot && snapshot.docChanges().some(c => c.type === 'added' && c.doc.data().senderRole === 'dev')) {
        if (window.playCyberNotificationChime) window.playCyberNotificationChime();
      }
      isInitialChatSnapshot = false;

      chatMessagesArea.innerHTML = '';

      // Default Welcome Message
      const welcomeEl = document.createElement('div');
      welcomeEl.className = 'chat-msg msg-dev';
      welcomeEl.innerHTML = `
        <div class="msg-bubble">
          สวัสดีครับ! ยินดีต้อนรับสู่ระบบติดต่อสด BestCyniX Dev มีข้อสงสัยเกี่ยวกับ SkyLineBOT, เว็บไซต์ หรือต้องการปรึกษางาน สามารถพิมพ์ข้อความหรือส่งรูปภาพทิ้งไว้ได้เลยครับ ทีมงานจะรีบตอบกลับให้เร็วที่สุดครับ ✨
        </div>
        <div class="msg-meta">
          <span class="msg-dev-badge">Dev Support</span>
          <span>ข้อความต้อนรับ</span>
        </div>
      `;
      chatMessagesArea.appendChild(welcomeEl);

      const msgs = [];
      snapshot.forEach((doc) => {
        const data = doc.data();
        data.id = doc.id;
        msgs.push(data);
      });

      msgs.sort((a, b) => {
        const tA = a.createdAt?.toDate ? a.createdAt.toDate().getTime() : (a.createdAt ? new Date(a.createdAt).getTime() : 0);
        const tB = b.createdAt?.toDate ? b.createdAt.toDate().getTime() : (b.createdAt ? new Date(b.createdAt).getTime() : 0);
        return tA - tB;
      });

      msgs.forEach((data) => {
        const isUser = data.senderRole === 'user';
        const msgEl = document.createElement('div');
        msgEl.className = `chat-msg ${isUser ? 'msg-user' : 'msg-dev'}`;

        let quoteHtml = '';
        if (data.replyTo) {
          quoteHtml = `<div class="chat-quote-box">↩️ ${escapeHTML(data.replyTo.text || '')}</div>`;
        }

        let imgHtml = '';
        if (data.imageUrl) {
          imgHtml = `<img src="${encodeURI(data.imageUrl)}" alt="Attached" style="max-width:100%; border-radius:8px; margin-top:0.4rem; cursor:pointer;" />`;
        }

        const safeText = escapeHTML(data.text || '');
        const safeName = escapeHTML(data.senderName || (isUser ? 'ฉัน' : 'Dev Team'));
        const timeStr = data.createdAt ? new Date(data.createdAt.toDate ? data.createdAt.toDate() : data.createdAt).toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' }) : '...';

        msgEl.innerHTML = `
          <div class="msg-bubble">
            ${quoteHtml}
            ${safeText}
            ${imgHtml}
          </div>
          <div class="msg-meta">
            ${!isUser ? '<span class="msg-dev-badge">Dev Team</span>' : ''}
            <span>${safeName}</span> • <span>${timeStr}</span>
            <button type="button" class="btn-quote-user-msg">↩️ ตอบกลับ</button>
          </div>
        `;

        msgEl.querySelector('.btn-quote-user-msg')?.addEventListener('click', () => {
          setUserQuoteReply(data.text || 'รูปภาพแนบ');
        });

        chatMessagesArea.appendChild(msgEl);
      });

      chatMessagesArea.scrollTop = chatMessagesArea.scrollHeight;
    };

    chatMessagesUnsubscribe = db.collection('chats').doc(activeChatId).collection('messages')
      .orderBy('createdAt', 'asc')
      .limit(100)
      .onSnapshot(handleChatSnapshot, () => {
        // Fallback without index requirement
        db.collection('chats').doc(activeChatId).collection('messages')
          .limit(100)
          .onSnapshot(handleChatSnapshot, (err) => console.warn('User chat fallback error:', err));
      });
  };

  // 9. Send Chat Message
  const sendChatMessage = async () => {
    const text = chatTextInput?.value.trim() || '';
    if (!text && !selectedChatFile) return;
    if (typeof firebase === 'undefined' || !firebase.apps.length) return;

    const db = firebase.firestore();
    const storage = firebase.storage();
    const auth = firebase.auth();
    const user = auth.currentUser;

    const now = Date.now();
    if (now - lastUserMessageTime < 1500) {
      showCyberToast('⚠️ กรุณารอสักครู่ก่อนส่งข้อความถัดไป (ระบบป้องกันสแปม)', '', 'warning');
      return;
    }

    if (btnChatSend) btnChatSend.disabled = true;

    try {
      let imageUrl = null;
      if (selectedChatFile && storage) {
        const fileRef = storage.ref(`chat-attachments/${activeChatId}/${Date.now()}_${selectedChatFile.name.replace(/[^a-zA-Z0-9._-]/g, '_')}`);
        await fileRef.put(selectedChatFile);
        imageUrl = await fileRef.getDownloadURL();
      }

      const senderName = user?.displayName || user?.email?.split('@')[0] || 'ผู้เยี่ยมชมเว็บ';
      const msgPayload = {
        text: text,
        imageUrl: imageUrl,
        senderId: user?.uid || activeChatId,
        senderName: senderName,
        senderRole: 'user',
        createdAt: firebase.firestore.FieldValue.serverTimestamp()
      };

      if (userActiveQuote) {
        msgPayload.replyTo = { text: userActiveQuote };
      }

      const chatRef = db.collection('chats').doc(activeChatId);
      await chatRef.set({
        userId: user?.uid || activeChatId,
        userName: senderName,
        userEmail: user?.email || 'guest@web.app',
        userPhoto: user?.photoURL || 'assets/photo/bcxlogo2.png',
        lastMessage: text || '📷 ส่งรูปภาพ',
        lastSenderRole: 'user',
        status: 'unanswered',
        tag: 'ทั่วไป',
        updatedAt: firebase.firestore.FieldValue.serverTimestamp()
      }, { merge: true });

      await chatRef.collection('messages').add(msgPayload);

      lastUserMessageTime = Date.now();

      if (chatTextInput) chatTextInput.value = '';
      selectedChatFile = null;
      userActiveQuote = null;
      if (userQuotePreview) userQuotePreview.style.display = 'none';
      if (chatFileInput) chatFileInput.value = '';
      if (chatPreviewWrap) chatPreviewWrap.style.display = 'none';

    } catch (err) {
      showCyberToast('ส่งข้อความไม่สำเร็จ', selectedChatFile ? storageErrorMessage(err) : (err.message || 'กรุณาลองใหม่'), 'error');
    } finally {
      if (btnChatSend) btnChatSend.disabled = false;
    }
  };

  if (btnChatSend) btnChatSend.addEventListener('click', sendChatMessage);
  if (chatTextInput) {
    chatTextInput.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        sendChatMessage();
      }
    });
  }

  // Initial connect
  window.connectLiveChatUser(activeChatId);
})();
