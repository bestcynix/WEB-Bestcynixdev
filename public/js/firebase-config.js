/**
 * BestCyniX Dev - Universal Firebase Config & Initialization Module
 */
(function () {
  'use strict';

  const firebaseConfig = {
    projectId: "bestcynixdev",
    appId: "1:172682556745:web:457116d929345ad70f1698",
    databaseURL: "https://bestcynixdev-default-rtdb.asia-southeast1.firebasedatabase.app",
    storageBucket: "bestcynixdev.firebasestorage.app",
    apiKey: "AIzaSyA20pomQmBi9122UZ5WLGADoLwYIw8rxpU",
    authDomain: "bestcynixdev.firebaseapp.com",
    messagingSenderId: "172682556745",
    measurementId: "G-710F6F2YG5",
    projectNumber: "172682556745"
  };

  if (typeof firebase !== 'undefined') {
    if (!firebase.apps || !firebase.apps.length) {
      firebase.initializeApp(firebaseConfig);
    }
  }

  if (typeof window !== 'undefined') {
    window.BESTCYNIX_FIREBASE_CONFIG = firebaseConfig;
  }
})();
