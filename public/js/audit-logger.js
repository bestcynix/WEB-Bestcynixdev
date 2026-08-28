/**
 * BestCyniX Dev - Enterprise Audit Logger
 * Records administrative actions and security events to Firestore /auditLogs
 */

(function () {
  'use strict';

  const logAdminAudit = async (action, summary, details = {}, targetId = null) => {
    try {
      if (typeof firebase === 'undefined' || !firebase.firestore) return;
      const user = firebase.auth().currentUser;
      const db = firebase.firestore();

      const logData = {
        action: action || 'UNKNOWN_ACTION',
        summary: summary || 'No summary provided',
        details: details || {},
        targetId: targetId || null,
        adminEmail: user ? user.email : 'system/anonymous',
        adminUid: user ? user.uid : 'system',
        adminDisplayName: user ? (user.displayName || user.email.split('@')[0]) : 'System',
        userAgent: navigator.userAgent || 'Unknown',
        url: window.location.pathname,
        createdAt: firebase.firestore.FieldValue.serverTimestamp(),
        clientTimestamp: new Date().toISOString()
      };

      await db.collection('auditLogs').add(logData);
      console.log('📝 [AuditLog Recorded]:', action, summary);
    } catch (err) {
      console.warn('⚠️ Failed to record audit log:', err.message);
    }
  };

  // Expose globally
  window.logAdminAudit = logAdminAudit;
})();
