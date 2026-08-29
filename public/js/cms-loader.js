/**
 * BestCyniX Dev - Dynamic Content Management System (CMS) Loader & Brand Icons Engine
 * โหลดเนื้อหาและไอคอนแบรนด์แท้แบบเรียลไทม์ พร้อมระบบ Grouped Category Tech Pills ตามภาพตัวอย่าง
 */

(function () {
  'use strict';

  // 1. Full Official Brand SVGs Dictionary (สีและเวกเตอร์แท้ 100% ตรงตามแบรนด์)
  const brandIcons = {
    // Languages
    'rust': `<svg width="22" height="22" viewBox="0 0 24 24" fill="#DEA584"><path d="M23.834 8.101a13.912 13.912 0 0 0-1.743-3.02 1.34 1.34 0 0 0-.965-.503 1.378 1.378 0 0 0-.934.335l-.261.222a14.28 14.28 0 0 0-3.328-1.503 1.353 1.353 0 0 0-.616-.795 1.38 1.38 0 0 0-.99-.074l-.328.093A14.267 14.267 0 0 0 12 .397a14.267 14.267 0 0 0-2.669.459l-.328-.093a1.38 1.38 0 0 0-.99.074 1.353 1.353 0 0 0-.616.795c-1.18.423-2.3 1.05-3.328 1.503l-.261-.222a1.378 1.378 0 0 0-.934-.335 1.34 1.34 0 0 0-.965.503 13.912 13.912 0 0 0-1.743 3.02 1.352 1.352 0 0 0 .15 1.082c.162.27.42.459.722.534l.33.082a14.184 14.184 0 0 0-.585 3.593l-.337.042a1.36 1.36 0 0 0-.915.586 1.37 1.37 0 0 0-.158 1.082 13.882 13.882 0 0 0 1.743 3.02 1.34 1.34 0 0 0 .965.503c.348 0 .68-.12.934-.335l.261-.222a14.28 14.28 0 0 0 3.328 1.503c.125.327.34.606.616.795.275.19.605.273.99.074l.328-.093A14.267 14.267 0 0 0 12 23.603a14.267 14.267 0 0 0 2.669-.459l.328.093c.385.199.715.116.99-.074a1.353 1.353 0 0 0 .616-.795c1.18-.423 2.3-1.05 3.328-1.503l.261.222c.254.215.586.335.934.335.358 0 .7-.184.965-.503a13.882 13.882 0 0 0 1.743-3.02 1.37 1.37 0 0 0-.158-1.082 1.36 1.36 0 0 0-.915-.586l-.337-.042c.112-1.189.112-2.404-.585-3.593l.33-.082c.302-.075.56-.264.722-.534a1.352 1.352 0 0 0 .15-1.082zM12 18.067a6.067 6.067 0 1 1 0-12.134 6.067 6.067 0 0 1 0 12.134z"/></svg>`,
    'c++': `<svg width="22" height="22" viewBox="0 0 24 24" fill="#00599C"><path d="M22.394 10.963a.88.88 0 0 0-.882-.882h-1.018v-1.018a.88.88 0 1 0-1.764 0v1.018h-1.018a.88.88 0 0 0 0 1.764h1.018v1.018a.88.88 0 1 0 1.764 0v-1.018h1.018a.88.88 0 0 0 .882-.882zm-6.529 0a.88.88 0 0 0-.882-.882h-1.018v-1.018a.88.88 0 1 0-1.764 0v1.018h-1.018a.88.88 0 0 0 0 1.764h1.018v1.018a.88.88 0 1 0 1.764 0v-1.018h1.018a.88.88 0 0 0 .882-.882zM11.558 3.2L2.08 8.672a1.08 1.08 0 0 0-.54.935v10.947a1.08 1.08 0 0 0 .54.935l9.478 5.472a1.08 1.08 0 0 0 1.08 0l9.478-5.472a1.08 1.08 0 0 0 .54-.935V15.54a.882.882 0 1 0-1.764 0v4.545L12.098 25.1 3.304 20.085V10.054L12.098 5.04l6.19 3.573a.882.882 0 1 0 .882-1.528l-6.54-3.775a1.08 1.08 0 0 0-1.082-.11z"/></svg>`,
    'go': `<svg width="22" height="22" viewBox="0 0 24 24" fill="#00ADD8"><path d="M1.811 10.231c-.047-.297-.047-.5 0-.797.33-.298 1.037-.497 2.12-.497h1.084c.094-.398.283-.796.518-1.095.378-.597 1.084-.995 2.12-.995 1.414 0 2.45.896 2.733 2.19h5.183c.095-.398.283-.796.519-1.095.377-.597 1.084-.995 2.12-.995 1.414 0 2.45.896 2.733 2.19h.377c.895 0 1.696.398 2.167 1.095.377.597.471 1.294.283 1.991l-.942 3.882c-.283 1.195-1.32 2.091-2.545 2.091h-3.3c-.094.398-.282.796-.518 1.095-.377.597-1.084.995-2.12.995-1.414 0-2.45-.896-2.733-2.19h-5.183c-.095.398-.283.796-.519 1.095-.377.597-1.084.995-2.12.995-1.414 0-2.45-.896-2.733-2.19H2.8c-.895 0-1.696-.398-2.167-1.095-.377-.597-.471-1.294-.283-1.991l.942-3.882c.189-.896.377-1.593.519-2.091z"/></svg>`,
    'node.js': `<svg width="22" height="22" viewBox="0 0 24 24"><path d="M12 2l10 5.8v11.6L12 25.2 2 19.4V7.8L12 2zm0 2.3L4 8.9v10.3l8 4.6 8-4.6V8.9l-8-4.6z" fill="#5FA04E"/><circle cx="12" cy="13.5" r="4" fill="#5FA04E"/></svg>`,
    'kotlin': `<svg width="22" height="22" viewBox="0 0 24 24"><path d="M24 24H0V0h24L12 12Z" fill="#7F52FF"/><path d="M0 24l12-12L24 24H0z" fill="#C757BC"/></svg>`,
    'java': `<svg width="22" height="22" viewBox="0 0 24 24"><path d="M8.85 16.84c0-.02-.03-.03-.04-.04-1.2-.56-1.85-1.55-1.52-2.34.2-.48.7-.8 1.34-.9.2-.03.4-.04.6-.04.64 0 1.25.17 1.74.47.46.28.77.67.88 1.12.17.7-.22 1.36-1.04 1.77-.52.26-1.12.38-1.74.38-.07 0-.15 0-.22-.02z" fill="#E76F00"/><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1.68 18.06c-3.1.28-6.1-1.02-7.5-3.26-.14-.23.02-.52.28-.52h.15c.67 0 1.37.1 2.05.29 2.22.62 4.62.33 6.64-.81.25-.14.54.06.48.34-.34 1.63-1.08 3.12-2.1 3.96z" fill="#EA2D2E"/></svg>`,
    'javascript': `<svg width="22" height="22" viewBox="0 0 24 24"><rect width="24" height="24" rx="4" fill="#F7DF1E"/><path d="M7.5 17.5c0 .9.6 1.5 1.5 1.5.8 0 1.3-.4 1.6-.9l-1.1-.7c-.1.2-.3.4-.5.4-.3 0-.5-.2-.5-.5v-4.8h1.5V7.5H7.5v10zm6.5 0c0 .9.6 1.5 1.5 1.5 1.1 0 1.8-.7 1.8-1.7 0-1.1-.7-1.4-1.4-1.7-.5-.2-.8-.4-.8-.7 0-.3.2-.5.6-.5.4 0 .7.2.9.5l1.1-.8c-.4-.6-1.1-.9-2-.9-1.2 0-2 .7-2 1.8 0 1.1.7 1.4 1.4 1.7.5.2.8.4.8.7 0 .3-.3.5-.7.5-.4 0-.8-.3-1-.6l-1.2.9z" fill="#000000"/></svg>`,
    'typescript': `<svg width="22" height="22" viewBox="0 0 24 24"><rect width="24" height="24" rx="4" fill="#3178C6"/><path d="M5 8h6v2H9v7H7v-7H5V8zm8 5.5c0-.9.6-1.5 1.5-1.5.8 0 1.3.4 1.6.9l-1.1.7c-.1-.2-.3-.4-.5-.4-.3 0-.5.2-.5.5v.1c0 .4.2.6.8.8 1.1.4 1.7.9 1.7 1.8 0 1.1-.8 1.8-2 1.8-1.2 0-2-.7-2-1.8l1.3-.6c.1.4.4.6.8.6.4 0 .6-.2.6-.5 0-.4-.3-.6-.8-.8-1.1-.4-1.9-.9-1.9-1.8z" fill="#FFFFFF"/></svg>`,
    'python': `<svg width="22" height="22" viewBox="0 0 24 24"><path d="M11.9 2c-3.1 0-2.9 1.3-2.9 1.3l.1 1.4h3v.4H6.6s-1.9.2-1.9 2.9c0 2.6 1.6 2.8 1.6 2.8h1v-1.4c0-1.6 1.4-1.6 1.4-1.6h2.9s1.4.1 1.4-1.4V4.9c0-1.4-1.7-1.4-1.7-1.4h1zm-1.8 1c.3 0 .6.3.6.6s-.3.6-.6.6-.6-.3-.6-.6.3-.6.6-.6z" fill="#3776AB"/><path d="M12.1 22c3.1 0 2.9-1.3 2.9-1.3l-.1-1.4h-3v-.4h5.5s1.9-.2 1.9-2.9c0-2.6-1.6-2.8-1.6-2.8h-1v1.4c0 1.6-1.4 1.6-1.4 1.6h-2.9s-1.4-.1-1.4 1.4v2.5c0 1.4 1.7 1.4 1.7 1.4h-1zm1.8-1c-.3 0-.6-.3-.6-.6s.3-.6.6-.6.6.3.6.6-.3.6-.6.6z" fill="#FFD43B"/></svg>`,
    'html5': `<svg width="22" height="22" viewBox="0 0 24 24"><path d="M3 2l1.6 18 7.4 2 7.4-2L21 2H3zm14.8 5.7H9.2l.2 2.6h8l-.6 6.9-4.8 1.3-4.8-1.3-.3-3.6h2.5l.2 1.8 2.4.6 2.4-.6.3-3.4H6.5L5.8 5.7h12.3l-.3 2z" fill="#E34F26"/></svg>`,
    'css3': `<svg width="22" height="22" viewBox="0 0 24 24"><path d="M3 2l1.6 18 7.4 2 7.4-2L21 2H3zm14.8 5.7H9.2l.2 2.6h8l-.6 6.9-4.8 1.3-4.8-1.3-.3-3.6h2.5l.2 1.8 2.4.6 2.4-.6.3-3.4H6.5L5.8 5.7h12.3l-.3 2z" fill="#1572B6"/></svg>`,
    'sql': `<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#38BDF8" stroke-width="2"><ellipse cx="12" cy="5" rx="9" ry="3"/><path d="M21 12c0 1.66-4 3-9 3s-9-1.34-9-3"/><path d="M3 5v14c0 1.66 4 3 9 3s9-1.34 9-3V5"/></svg>`,
    'mysql': `<svg width="22" height="22" viewBox="0 0 24 24"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 14.5c-1.66 0-3-1.34-3-3s1.34-3 3-3 3 1.34 3 3-1.34 3-3 3z" fill="#00758F"/><path d="M14 9c0 2-3 4-4 4s-1-2-1-3 2-3 4-3 1 1 1 2z" fill="#F29111"/></svg>`,

    // Frontend
    'react': `<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#61DAFB" stroke-width="2"><ellipse cx="12" cy="12" rx="11" ry="4.2"/><ellipse cx="12" cy="12" rx="11" ry="4.2" transform="rotate(60 12 12)"/><ellipse cx="12" cy="12" rx="11" ry="4.2" transform="rotate(120 12 12)"/><circle cx="12" cy="12" r="2" fill="#61DAFB"/></svg>`,
    'next.js': `<svg width="22" height="22" viewBox="0 0 24 24"><circle cx="12" cy="12" r="11" fill="#000000" stroke="#FFFFFF" stroke-width="1.2"/><path d="M16.5 17.5L8.5 7.5h-1v9h1.5V10l7 8.5h1z" fill="#FFFFFF"/></svg>`,
    'vue': `<svg width="22" height="22" viewBox="0 0 24 24"><path d="M24 1.5H19.5L12 14.5 4.5 1.5H0L12 22.5 24 1.5Z" fill="#41B883"/><path d="M19.5 1.5H15L12 6.8 9 1.5H4.5L12 14.5 19.5 1.5Z" fill="#35495E"/></svg>`,
    'tailwind': `<svg width="22" height="22" viewBox="0 0 24 24" fill="#06B6D4"><path d="M12.001 4.8c-3.2 0-5.2 1.6-6 4.8 1.2-1.6 2.6-2.2 4.2-1.8.913.228 1.565.89 2.288 1.624C13.666 10.618 15.027 12 18.001 12c3.2 0 5.2-1.6 6-4.8-1.2 1.6-2.6 2.2-4.2 1.8-.913-.228-1.565-.89-2.288-1.624C16.337 6.182 14.976 4.8 12.001 4.8zm-6 7.2c-3.2 0-5.2 1.6-6 4.8 1.2-1.6 2.6-2.2 4.2-1.8.913.228 1.565.89 2.288 1.624 1.177 1.194 2.538 2.576 5.512 2.576 3.2 0 5.2-1.6 6-4.8-1.2 1.6-2.6 2.2-4.2 1.8-.913-.228-1.565-.89-2.288-1.624C10.337 13.382 8.976 12 6.001 12z"/></svg>`,
    'vite': `<svg width="22" height="22" viewBox="0 0 24 24"><path d="M23.6 3.8L12.7 23.3a.8.8 0 0 1-1.4 0L.4 3.8a.8.8 0 0 1 .7-1.2h21.8a.8.8 0 0 1 .7 1.2z" fill="#646CFF"/><path d="M17.8 1.5L9.6 16.2 8.2 8.8l7.2-7.3h2.4z" fill="#FFD62E"/></svg>`,
    'canvas': `<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#F43F5E" stroke-width="2"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10c.88 0 1.6-.72 1.6-1.6 0-.41-.17-.79-.44-1.06-.27-.28-.44-.65-.44-1.06 0-.88.72-1.6 1.6-1.6H16c3.31 0 6-2.69 6-6 0-4.97-4.48-9-10-9z"/><circle cx="6.5" cy="11.5" r="1.5" fill="#F43F5E"/><circle cx="9.5" cy="7.5" r="1.5" fill="#F43F5E"/><circle cx="14.5" cy="7.5" r="1.5" fill="#F43F5E"/><circle cx="17.5" cy="11.5" r="1.5" fill="#F43F5E"/></svg>`,

    // Backend
    'elysia': `<svg width="22" height="22" viewBox="0 0 24 24"><rect width="24" height="24" rx="6" fill="#8B5CF6"/><path d="M7 6h10v3H10v3h6v3h-6v3H7V6z" fill="#FFFFFF"/></svg>`,
    'axum': `<svg width="22" height="22" viewBox="0 0 24 24"><rect width="24" height="24" rx="6" fill="#3B82F6"/><path d="M12 4L6 19h3.5l1.2-3h6.6l1.2 3H22L16 4h-4zm0 4.5l2.2 5.5h-4.4L12 8.5z" fill="#FFFFFF"/></svg>`,
    'websocket': `<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#0284c7" stroke-width="2"><circle cx="12" cy="12" r="9"/><path d="m8 12 4-4 4 4"/><path d="m8 12 4 4 4-4"/></svg>`,
    'express': `<svg width="22" height="22" viewBox="0 0 24 24" fill="#FFFFFF"><path d="M22 6L14 18h-3L3 6h3.5l5.5 8.5L17.5 6H22z"/></svg>`,
    'fastapi': `<svg width="22" height="22" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10" fill="#009688"/><path d="M12 4L6 13h5l-1 7 7-10h-5l1-6z" fill="#FFFFFF"/></svg>`,
    'spring': `<svg width="22" height="22" viewBox="0 0 24 24" fill="#6DB33F"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 16.5c-3.5 0-6.5-2.5-7.2-6 .5.5 1.5 1 2.5 1 2.5 0 4.5-2 4.5-4.5 0-.5-.1-1-.2-1.5 3.5.7 6 3.8 6 7.5 0 2-1.5 3.5-3.6 3.5z"/></svg>`,

    // Databases
    'postgresql': `<svg width="22" height="22" viewBox="0 0 24 24" fill="#4169E1"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z"/></svg>`,
    'sqlite': `<svg width="22" height="22" viewBox="0 0 24 24" fill="#003B57"><path d="M21.5 5.5l-9.5-5-9.5 5v13l9.5 5 9.5-5v-13zm-9.5 15.5l-7.5-4v-9.5l7.5 4v9.5zm8-4l-7.5 4v-9.5l7.5-4v9.5z"/></svg>`,
    'mongodb': `<svg width="22" height="22" viewBox="0 0 24 24" fill="#47A248"><path d="M12 0s-6 6.5-6 13c0 4.5 3 8 6 11 3-3 6-6.5 6-11 0-6.5-6-13-6-13z"/></svg>`,
    'firestore': `<svg width="22" height="22" viewBox="0 0 24 24"><path d="M4.5 17.5l2-13 5.5 10.5-7.5 2.5zm15 0l-2-13-5.5 10.5 7.5 2.5zm-7.5 4.5l-6-4.5 6-3 6 3-6 4.5z" fill="#FFCA28"/></svg>`,
    'firebase': `<svg width="22" height="22" viewBox="0 0 24 24"><path d="M4.5 17.5l2-13 5.5 10.5-7.5 2.5zm15 0l-2-13-5.5 10.5 7.5 2.5zm-7.5 4.5l-6-4.5 6-3 6 3-6 4.5z" fill="#FFCA28"/></svg>`,
    'redis': `<svg width="22" height="22" viewBox="0 0 24 24" fill="#DC382D"><path d="M21.5 5.5l-9.5-5-9.5 5v13l9.5 5 9.5-5v-13zm-9.5 1.5l7 3.5-7 3.5-7-3.5 7-3.5zm-7.5 5.2l6.5 3.3v6.5l-6.5-3.3v-6.5zm8.5 9.8v-6.5l6.5-3.3v6.5l-6.5 3.3z"/></svg>`,
    'cloudflare': `<svg width="22" height="22" viewBox="0 0 24 24" fill="#F38020"><path d="M18.2 12.1c-.2-2.3-2.1-4.1-4.5-4.1-1.7 0-3.2.9-4 2.3-.5-.3-1.1-.4-1.7-.4-1.9 0-3.5 1.5-3.5 3.4 0 .3 0 .6.1.9C2 14.6 3.8 17 6.5 17h11.7c2.1 0 3.8-1.7 3.8-3.8 0-1.8-1.3-3.3-3-3.7-.3-.2-.5-.3-.8-.4z"/></svg>`,
    'docker': `<svg width="22" height="22" viewBox="0 0 24 24" fill="#2496ED"><path d="M13.9 8.2h2.2v2.2h-2.2V8.2zm-2.8 0h2.2v2.2h-2.2V8.2zm-2.8 0h2.2v2.2H8.3V8.2zm8.4 2.8h2.2v2.2h-2.2V11zm-2.8 0h2.2v2.2h-2.2V11zm-2.8 0h2.2v2.2h-2.2V11zm-2.8 0h2.2v2.2H8.3V11zm-2.8 0h2.2v2.2H5.5V11zm17.5 1.7c-.5-.4-1.5-.5-2.2-.2-.2-.5-.7-.9-1.2-1.2-.5-.3-1.1-.4-1.8-.4h-1.5v2.8H2.5c-.3 0-.6.1-.8.4-.2.3-.3.6-.3 1 0 3.8 3.1 6.9 6.9 6.9h9.4c3.4 0 6.2-2.8 6.2-6.2 0-1.2-.4-2.3-.9-3.1z"/></svg>`,
    'git': `<svg width="22" height="22" viewBox="0 0 24 24" fill="#F05032"><path d="M21.6 10.9L13.1 2.4a2.4 2.4 0 0 0-3.4 0L7.3 4.8l3.6 3.6c.4-.1.8 0 1.1.2.6.6.6 1.5 0 2.1-.6.6-1.5.6-2.1 0a1.5 1.5 0 0 1-.3-1.6L6.2 5.6 2.4 9.4a2.4 2.4 0 0 0 0 3.4l8.5 8.5c.9.9 2.5.9 3.4 0l7.3-7.3a2.4 2.4 0 0 0 0-3.4l-.01.01z"/></svg>`,
    'github': `<svg width="22" height="22" viewBox="0 0 24 24" fill="#FFFFFF"><path d="M12 2C6.477 2 2 6.477 2 12c0 4.42 2.87 8.17 6.84 9.5.5.08.66-.23.66-.5v-1.69c-2.77.6-3.36-1.34-3.36-1.34-.46-1.16-1.11-1.47-1.11-1.47-.91-.62.07-.6.07-.6 1 .07 1.53 1.03 1.53 1.03.87 1.52 2.34 1.07 2.91.83.1-.65.35-1.09.63-1.34-2.22-.25-4.55-1.11-4.55-4.92 0-1.11.38-2 1.03-2.71-.1-.25-.45-1.29.1-2.64 0 0 .84-.27 2.75 1.02.79-.22 1.65-.33 2.5-.33.85 0 1.71.11 2.5.33 1.91-1.29 2.75-1.02 2.75-1.02.55 1.35.2 2.39.1 2.64.65.71 1.03 1.6 1.03 2.71 0 3.82-2.34 4.66-4.57 4.91.36.31.69.92.69 1.85V21c0 .27.16.59.67.5C19.14 20.16 22 16.42 22 12A10 10 0 0 0 12 2z"/></svg>`,
    'vscode': `<svg width="22" height="22" viewBox="0 0 24 24" fill="#007ACC"><path d="M23.15 2.587L18.21.21a1.494 1.494 0 0 0-1.705.29l-9.46 8.63-4.12-3.128a.999.999 0 0 0-1.276.057L.327 7.276A1 1 0 0 0 .32 8.68l3.95 3.32-3.95 3.32a1 1 0 0 0-.007 1.404l1.322 1.217a1 1 0 0 0 1.276.057l4.12-3.128 9.46 8.63a1.492 1.492 0 0 0 1.704.29l4.942-2.377A1.5 1.5 0 0 0 24 20.06V3.939a1.5 1.5 0 0 0-.85-1.352zM18 16.79l-6.5-5.32 6.5-5.32v10.64z"/></svg>`,
    'gcp': `<svg width="22" height="22" viewBox="0 0 24 24"><path d="M19.35 10.04C18.67 6.59 15.64 4 12 4 9.11 4 6.6 5.64 5.35 8.04 2.34 8.36 0 10.91 0 14c0 3.31 2.69 6 6 6h13c2.76 0 5-2.24 5-5 0-2.64-2.05-4.78-4.65-4.96z" fill="#4285F4"/></svg>`,
    'discord.js': `<svg width="22" height="22" viewBox="0 0 24 24" fill="#5865F2"><path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028c.462-.63.874-1.295 1.226-1.994.021-.041.001-.09-.041-.106a13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.929 1.793 8.18 1.793 12.061 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.894.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.028zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.946 2.418-2.157 2.418z"/></svg>`,
    'ai': `<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#32ffc9" stroke-width="2"><path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83"/><circle cx="12" cy="12" r="3" fill="#32ffc9"/></svg>`,
    'api': `<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#38BDF8" stroke-width="2"><rect x="2" y="2" width="20" height="8" rx="2"/><rect x="2" y="14" width="20" height="8" rx="2"/><line x1="6" y1="6" x2="6.01" y2="6"/><line x1="6" y1="18" x2="6.01" y2="18"/></svg>`,
    'linux': `<svg width="22" height="22" viewBox="0 0 24 24" fill="#FCC624"><path d="M12.003 2c-3.1 0-4.8 2.2-4.8 5.6 0 1.3.3 2.8.7 4-.9 1.2-1.9 2.9-1.9 4.7 0 2.9 2.3 4.7 6 4.7s6-1.8 6-4.7c0-1.8-1-3.5-1.9-4.7.4-1.2.7-2.7.7-4 0-3.4-1.7-5.6-4.8-5.6zm-1.8 4.2c.4 0 .8.4.8.9s-.4.9-.8.9-.8-.4-.8-.9.4-.9.8-.9zm3.6 0c.4 0 .8.4.8.9s-.4.9-.8.9-.8-.4-.8-.9.4-.9.8-.9zm-1.8 3.5c1.1 0 2 .5 2 1.2s-.9 1.2-2 1.2-2-.5-2-1.2.9-1.2 2-1.2z"/></svg>`,
    'electron': `<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#47848F" stroke-width="2"><ellipse cx="12" cy="12" rx="10" ry="4"/><ellipse cx="12" cy="12" rx="10" ry="4" transform="rotate(60 12 12)"/><ellipse cx="12" cy="12" rx="10" ry="4" transform="rotate(120 12 12)"/><circle cx="12" cy="12" r="2" fill="#47848F"/></svg>`,
    'oauth': `<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#F43F5E" stroke-width="2"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>`,

    // Social Brands
    'discord_brand': `<svg width="26" height="26" viewBox="0 0 24 24" fill="#5865F2"><path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028c.462-.63.874-1.295 1.226-1.994.021-.041.001-.09-.041-.106a13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.929 1.793 8.18 1.793 12.061 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.894.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.028zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.946 2.418-2.157 2.418z"/></svg>`,
    'facebook_brand': `<svg width="26" height="26" viewBox="0 0 24 24" fill="#1877F2"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/></svg>`,
    'instagram_brand': `<svg width="26" height="26" viewBox="0 0 24 24"><defs><radialGradient id="igGrad" r="150%" cx="30%" cy="107%"><stop offset="0" stop-color="#fdf497"/><stop offset="0.05" stop-color="#fdf497"/><stop offset="0.45" stop-color="#fd5949"/><stop offset="0.6" stop-color="#d6249f"/><stop offset="0.9" stop-color="#285AEB"/></radialGradient></defs><rect width="24" height="24" rx="6" fill="url(#igGrad)"/><path d="M12 7a5 5 0 1 0 0 10 5 5 0 0 0 0-10zm0 8.2a3.2 3.2 0 1 1 0-6.4 3.2 3.2 0 0 1 0 6.4zm5.4-8.5a1.2 1.2 0 1 0 0 2.4 1.2 1.2 0 0 0 0-2.4z" fill="#FFFFFF"/></svg>`,
    'line_brand': `<svg width="26" height="26" viewBox="0 0 24 24"><rect width="24" height="24" rx="5" fill="#06C755"/><path d="M19.5 10.5c0-4.1-3.6-7.5-8-7.5s-8 3.4-8 7.5c0 3.7 3.2 6.8 7.5 7.4.3.1.7.2.8.5.1.3 0 .7-.1 1-.2.7-.8 2.6-.9 2.8-.1.4.1.6.4.4.3-.2 3.3-2 4.5-2.7 2.4-1.5 3.8-4.2 3.8-6.9z" fill="#FFFFFF"/></svg>`,
    'x_brand': `<svg width="26" height="26" viewBox="0 0 24 24" fill="#FFFFFF"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>`,
    'email_brand': `<svg width="26" height="26" viewBox="0 0 24 24" fill="#EA4335"><path d="M20 4H4c-1.1 0-1.99.9-1.99 2L2 18c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 4l-8 5-8-5V6l8 5 8-5v2z"/></svg>`
  };

  const getTechIcon = (name) => {
    const raw = String(name || '').trim().replace(/^undefined/i, '');
    const key = raw.toLowerCase();
    const fallbackSvg = `<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#32ffc9" stroke-width="2"><rect width="20" height="14" x="2" y="3" rx="2"/><line x1="8" x2="16" y1="21" y2="21"/><line x1="12" x2="12" y1="17" y2="21"/></svg>`;

    if (!key) return fallbackSvg;

    // Prioritized specific matches
    if (key.includes('discord')) return brandIcons['discord.js'] || fallbackSvg;
    if (key.includes('ai') || key.includes('llm') || key.includes('gemini') || key.includes('gpt')) return brandIcons['ai'] || fallbackSvg;
    if (key.includes('api') || key.includes('rest')) return brandIcons['api'] || fallbackSvg;
    if (key.includes('linux') || key.includes('ubuntu')) return brandIcons['linux'] || fallbackSvg;
    if (key.includes('electron')) return brandIcons['electron'] || fallbackSvg;
    if (key.includes('oauth') || key.includes('auth')) return brandIcons['oauth'] || fallbackSvg;
    if (key.includes('next')) return brandIcons['next.js'] || fallbackSvg;
    if (key.includes('node')) return brandIcons['node.js'] || fallbackSvg;
    if (key.includes('typescript') || key === 'ts') return brandIcons['typescript'] || fallbackSvg;
    if (key.includes('javascript') || key === 'js') return brandIcons['javascript'] || fallbackSvg;
    if (key.includes('rust')) return brandIcons['rust'] || fallbackSvg;
    if (key.includes('c++') || key.includes('cpp')) return brandIcons['c++'] || fallbackSvg;
    if (key === 'go' || key.includes('golang')) return brandIcons['go'] || fallbackSvg;
    if (key.includes('kotlin')) return brandIcons['kotlin'] || fallbackSvg;
    if (key.includes('spring')) return brandIcons['spring'] || fallbackSvg;
    if (key.includes('java')) return brandIcons['java'] || fallbackSvg;
    if (key.includes('fastapi')) return brandIcons['fastapi'] || fallbackSvg;
    if (key.includes('python') || key.includes('py')) return brandIcons['python'] || fallbackSvg;
    if (key.includes('html')) return brandIcons['html5'] || fallbackSvg;
    if (key.includes('tailwind')) return brandIcons['tailwind'] || fallbackSvg;
    if (key.includes('css')) return brandIcons['css3'] || fallbackSvg;
    if (key.includes('postgres')) return brandIcons['postgresql'] || fallbackSvg;
    if (key.includes('mysql')) return brandIcons['mysql'] || fallbackSvg;
    if (key.includes('sqlite')) return brandIcons['sqlite'] || fallbackSvg;
    if (key.includes('mongo')) return brandIcons['mongodb'] || fallbackSvg;
    if (key.includes('sql')) return brandIcons['sql'] || fallbackSvg;
    if (key.includes('react')) return brandIcons['react'] || fallbackSvg;
    if (key.includes('vue')) return brandIcons['vue'] || fallbackSvg;
    if (key.includes('vite')) return brandIcons['vite'] || fallbackSvg;
    if (key.includes('canvas')) return brandIcons['canvas'] || fallbackSvg;
    if (key.includes('elysia')) return brandIcons['elysia'] || fallbackSvg;
    if (key.includes('axum')) return brandIcons['axum'] || fallbackSvg;
    if (key.includes('websocket') || key === 'ws') return brandIcons['websocket'] || fallbackSvg;
    if (key.includes('express')) return brandIcons['express'] || fallbackSvg;
    if (key.includes('firestore')) return brandIcons['firestore'] || fallbackSvg;
    if (key.includes('firebase')) return brandIcons['firebase'] || fallbackSvg;
    if (key.includes('redis')) return brandIcons['redis'] || fallbackSvg;
    if (key.includes('cloudflare')) return brandIcons['cloudflare'] || fallbackSvg;
    if (key.includes('docker')) return brandIcons['docker'] || fallbackSvg;
    if (key.includes('github')) return brandIcons['github'] || fallbackSvg;
    if (key.includes('git')) return brandIcons['git'] || fallbackSvg;
    if (key.includes('vscode') || key.includes('vs code')) return brandIcons['vscode'] || fallbackSvg;
    if (key.includes('google cloud') || key.includes('gcp')) return brandIcons['gcp'] || fallbackSvg;

    return fallbackSvg;
  };
  window.getBCXTechIcon = getTechIcon;
  window.BCX_BRAND_ICONS = brandIcons;

  const GLOBAL_DISCORD_URL = 'https://discord.gg/M8k2N3XgYF';
  const PROJECT_COMMUNITY_URLS = {
    'mc-skyline': 'https://discord.gg/5eNFMMk3ak',
    'skylinebot-0194': 'https://discord.gg/CzsBvjYBdQ'
  };
  const BUSINESS_EMAIL = 'bestcynix@gmail.com';

  // 2. Default Rich Datasets
  const defaultCMSData = {
    projects: [
      {
        id: 'skylinebot-0194',
        title: 'SkyLineBOT #0194',
        period: '2026 - ปัจจุบัน',
        status: 'active',
        isFeatured: true,
        accessLevel: 'public',
        isSpoiler: false,
        showWebsite: true,
        showCommunity: true,
        communityUrl: PROJECT_COMMUNITY_URLS['skylinebot-0194'],
        releaseDate: null,
        url: 'https://skylinebot.xyz/',
        coverImage: 'assets/photo/SkyLineBOT-0194.png',
        gallery: ['assets/photo/SkyLineBOT-0194.png', 'assets/photo/bestcynixprodev.png', 'assets/photo/skylinebot-support.png'],
        description: 'บอทรุ่นปัจจุบันที่เปิดตัวแล้วอย่างเป็นทางการ รวมความสามารถบอทเพลงและระบบคอมมูนิตี้ไว้ในตัวเดียว พร้อมระบบรับคำขอเพลงและศูนย์ช่วยเหลือ 24/7',
        details: 'SkyLineBOT #0194 เป็นโปรเจกต์เรือธงของ BestCyniX Dev ในปี 2026 พัฒนาด้วย Node.js, Discord.js v14, AI Workflow และเชื่อมต่อ Firestore Database โดยภาพล่าสุดแสดงห้อง SkyLine&Music BOT SUPPORT, ระบบรับคำขอเพลง และปุ่มควบคุมเพลงอัตโนมัติ',
        stack: ['Node.js', 'Discord.js', 'AI Workflow', 'Firestore', 'Cloudflare']
      },
      {
        id: 'mc-skyline',
        title: 'Mc-Skyline',
        period: 'เร็ว ๆ นี้ • คาดการณ์ ธ.ค. 2026 หรือ 2027',
        status: 'spoiler',
        isFeatured: true,
        accessLevel: 'public',
        isSpoiler: true,
        showWebsite: true,
        showCommunity: true,
        communityUrl: PROJECT_COMMUNITY_URLS['mc-skyline'],
        releaseDate: null,
        url: 'https://bestcynixdev.web.app/project?id=mc-skyline',
        coverImage: 'assets/photo/mc-skyline.png',
        gallery: ['assets/photo/mc-skyline.png'],
        description: 'โปรเจกต์ Minecraft ยุคใหม่ของทีม Mc-Skyline กำลังเตรียมเปิดตัว โดยกำหนดการยังอยู่ระหว่างยืนยัน',
        details: 'Mc-Skyline เป็นโปรเจกต์ที่กำลังเตรียมเปิดตัวต่อยอดจากประสบการณ์เซิร์ฟเวอร์ Minecraft รุ่นก่อน คาดการณ์ช่วงเปิดตัวเดือนธันวาคม 2026 หรือปี 2027 โดยยังไม่ถือเป็นกำหนดการอย่างเป็นทางการ',
        stack: ['Minecraft', 'Server Architecture', 'Community Systems', 'Cloud Infrastructure']
      },
      {
        id: 'niceshopallforme',
        title: 'Niceshopallforme',
        period: '2024 - ปัจจุบัน',
        status: 'active',
        isFeatured: true,
        accessLevel: 'public',
        isSpoiler: false,
        releaseDate: null,
        url: 'https://niceshopallforme.web.app/',
        coverImage: 'assets/photo/NiceShopForAllWeb.png',
        gallery: ['assets/photo/NiceShopForAllWeb.png'],
        description: 'เว็บไซต์ที่เปิดตัวในช่วงรีสตาร์ทโปรเจกต์ใหม่ และยังคงพัฒนาในเส้นทางเว็บอย่างต่อเนื่อง มีระบบจัดการและแคตตาล็อกสินค้า',
        details: 'ระบบเว็บสโตร์ที่เริ่มพัฒนาในปี 2024 เพื่อรองรับการสั่งซื้อและแสดงสินค้าออนไลน์ รองรับการแสดงผลแบบ Responsive เต็มรูปแบบ',
        stack: ['HTML5', 'CSS3', 'JavaScript', 'Firebase Hosting']
      },
      {
        id: 'skylinebot-1391',
        title: 'Skylinebot#1391',
        period: '2021 - 2023',
        status: 'closed',
        isFeatured: true,
        accessLevel: 'public',
        isSpoiler: false,
        releaseDate: null,
        url: 'https://botdiscordcommands.web.app/skylinebot.html',
        coverImage: 'assets/photo/Skylinebot-1391.png',
        gallery: ['assets/photo/Skylinebot-1391.png', 'assets/photo/skylinebot-discord.png'],
        description: 'บอท Discord สายความบันเทิงและเพลงในยุค Skyline V1 พร้อมระบบคิวเพลงและการ์ดคำสั่งจากห้อง #skylinebot',
        details: 'บอทตัวแรกที่พัฒนาขึ้นจากความชอบ เปิดให้บริการตั้งแต่ปี 2021 ถึง 2023 โดยภาพหลักฐานจากห้อง Discord แสดงระบบคิวเพลง Skyline Endless และการเล่นเพลงจาก YouTube, Spotify, SoundCloud และลิงก์ MP3 ก่อนนำประสบการณ์ไปพัฒนา SkyLineBOT #0194',
        stack: ['Discord.js v12', 'Node.js', 'Web Commands Portal']
      },
      {
        id: 'musicbot-5750',
        title: 'MusicBOT#5750',
        period: '2021 - 2023',
        status: 'closed',
        isFeatured: true,
        accessLevel: 'public',
        isSpoiler: false,
        releaseDate: null,
        url: 'https://botdiscordcommands.web.app/musicbot.html',
        coverImage: 'assets/photo/MusicBOT-5750.png',
        gallery: ['assets/photo/MusicBOT-5750.png'],
        description: 'บอทเพลงที่เน้นการใช้งานง่ายและรองรับคำสั่งเพลงสำหรับคอมมูนิตี้ Discord หลากหลายฟังก์ชัน',
        details: 'บอทเพลงเฉพาะทางที่พัฒนาคู่ขนานกับ Skyline V1 เน้นระบบคิวเพลงที่เสถียรและคำสั่งใช้งานง่าย',
        stack: ['Lavalink', 'Node.js', 'Discord.js']
      },
      {
        id: 'discord-mh-myhome',
        title: 'Discord MH-Myhome / SkyLineEndless',
        period: '2021 - 2023',
        status: 'closed',
        isFeatured: true,
        accessLevel: 'public',
        isSpoiler: false,
        releaseDate: null,
        url: 'https://in-skylineendless.web.app/',
        coverImage: 'assets/photo/SkylineendlessServerdis2020.png',
        gallery: [
          'assets/photo/SkylineendlessServerdis2020.png',
          'assets/photo/SkylineendlessServerdis2020EXdis1.jpg',
          'assets/photo/SkylineendlessServerdis2020EXdis2.jpg',
          'assets/photo/SkylineendlessServerdis2020EXdis3.jpg',
          'assets/photo/MH_MyhomeServerdis2020.jpg',
          'assets/photo/MH_MyhomeServerdis2020-Update.jpg',
          'assets/photo/MHMyhomeServerdis2020.png'
        ],
        description: 'คอมมูนิตี้เซิร์ฟเวอร์ Discord ที่ต่อยอดจากงานบอทและงานดูแลระบบของทีมเพื่อเชื่อมต่อผู้ใช้งาน',
        details: 'เซิร์ฟเวอร์คอมมูนิตี้ศูนย์กลางที่รองรับสมาชิกกว่าหลายร้อยคน มีห้องพูดคุย และกิจกรรมต่างๆ',
        stack: ['Community Architecture', 'Role Management', 'Discord Portal']
      },
      {
        id: 'server-minecraft-legacy',
        title: 'ServerMinecraft (Legacy)',
        period: '2021 - 2023',
        status: 'closed',
        isFeatured: true,
        accessLevel: 'public',
        isSpoiler: false,
        releaseDate: null,
        url: 'https://bestcynixdev.web.app/project?id=server-minecraft-legacy',
        coverImage: 'assets/photo/ServerMinecraft2021.png',
        gallery: ['assets/photo/ServerMinecraft2021.png'],
        description: 'เซิร์ฟเวอร์ Minecraft หลายโปรเจกต์ที่สร้างช่วงแรก และปิดตัวลงในปี 2023 เพื่อเตรียมยุคใหม่',
        details: 'การรวมทีมกับเพื่อนสร้างเซิร์ฟเวอร์ Minecraft แม้เผชิญปัญหาทรัพยากรและงบประมาณจนต้องปิดตัว แต่เป็นบทเรียนล้ำค่าสำหรับการพัฒนารุ่นใหม่',
        stack: ['Java Paper/Spigot', 'Server Architecture', 'Custom Plugins']
      },
      {
        id: 'mc-slashz-net',
        title: 'MC-Slashz.net',
        period: '01/01/2020 - 08/06/2020',
        status: 'closed',
        isFeatured: false,
        accessLevel: 'public',
        isSpoiler: false,
        releaseDate: null,
        url: 'https://bestcynixdev.web.app/project?id=mc-slashz-net',
        coverImage: 'assets/photo/mc-slashz.png',
        gallery: ['assets/photo/mc-slashz.png'],
        description: 'เซิร์ฟเวอร์ Minecraft รุ่นบุกเบิกของทีม เปิดให้บริการตั้งแต่ 1 มกราคม 2020 ถึง 8 มิถุนายน 2020 พร้อมเอกลักษณ์ MC-SLASHZ.NET ตามภาพโลโก้ต้นฉบับ',
        details: 'MC-Slashz.net เป็นหนึ่งในจุดเริ่มต้นของประสบการณ์สร้างและดูแลเซิร์ฟเวอร์ Minecraft ของทีม ภาพประกอบเป็นโลโก้ต้นฉบับของโปรเจกต์ ก่อนต่อยอดไปสู่โปรเจกต์รุ่นถัดไป',
        stack: ['Minecraft Server', 'Community Management', 'MC-SLASHZ.NET Brand']
      },
      {
        id: 'mc-ctc-ml',
        title: 'Mc-ctc.ml',
        period: '29/08/2020 - 06/01/2021',
        status: 'closed',
        isFeatured: false,
        accessLevel: 'public',
        isSpoiler: false,
        releaseDate: null,
        url: 'https://bestcynixdev.web.app/project?id=mc-ctc-ml',
        coverImage: 'assets/photo/mc-ctc.png',
        gallery: ['assets/photo/mc-ctc.png'],
        description: 'เซิร์ฟเวอร์ Minecraft ที่เปิดให้บริการตั้งแต่ 29 สิงหาคม 2020 ถึง 6 มกราคม 2021',
        details: 'Mc-ctc.ml เป็นโปรเจกต์ช่วงต่อเนื่องที่ช่วยพัฒนาประสบการณ์ด้านการจัดการเซิร์ฟเวอร์ ระบบชุมชน และการดูแลผู้เล่น',
        stack: ['Minecraft Server', 'Community Management', 'Server Operations']
      },
      {
        id: 'mc-kileema-net',
        title: 'Mc-Kileema.net',
        period: '01/03/2021 - 17/05/2021',
        status: 'closed',
        isFeatured: false,
        accessLevel: 'public',
        isSpoiler: false,
        releaseDate: null,
        url: 'https://bestcynixdev.web.app/project?id=mc-kileema-net',
        coverImage: 'assets/photo/mc-kileema-world.png',
        gallery: [
          'assets/photo/mc-kileema-world.png',
          'assets/photo/mc-kileema-logo.png',
          'assets/photo/mc-kileema-survival-rain.png',
          'assets/photo/mc-kileema-survival-1122.png',
          'assets/photo/mc-kileema-survival-1165.png',
          'assets/photo/mc-kileema-overview.png',
          'assets/photo/mc-kileema-lobby.png'
        ],
        description: 'เซิร์ฟเวอร์ Minecraft Mc-Kileema.net เปิดให้บริการตั้งแต่ 1 มีนาคม 2021 ถึง 17 พฤษภาคม 2021 พร้อมภาพโลกจริง โหมด Survival และหน้าเซิร์ฟเวอร์จากหลายช่วงเวลา',
        details: 'Mc-Kileema.net เป็นโปรเจกต์ในช่วงเริ่มต้นของยุคทีม Kileema ภาพประกอบชุดนี้มาจากเซิร์ฟเวอร์จริง ได้แก่ โลโก้ Kileema, ภาพเมือง/แผนที่, การเล่น Survival เวอร์ชัน 1.12.2 และ 1.16.5, หน้าแสดง IP MC-Kileema.net และภาพบรรยากาศภายในเซิร์ฟเวอร์',
        stack: ['Minecraft Server', 'Survival 1.12.2', 'Survival 1.16.5', 'Community Management', 'Brand Identity']
      },
      {
        id: 'roblox-server-project',
        title: 'Roblox Server (New Era)',
        period: 'แผนงาน 2026+',
        status: 'spoiler',
        isFeatured: false,
        accessLevel: 'dev_only',
        isSpoiler: true,
        releaseDate: '2026-12-31T18:00:00Z',
        url: 'https://bestcynixdev.web.app/project?id=roblox-server-project',
        coverImage: 'assets/photo/bestcynixprodev.png',
        gallery: ['assets/photo/bestcynixprodev.png'],
        description: '🔒 โปรเจกต์ลับ: ระบบเซิร์ฟเวอร์ Roblox พร้อมระบบคอมมูนิตี้และเครื่องมือจัดการที่เชื่อมกับงานเว็บ',
        details: 'โปรเจกต์ที่กำลังซุ่มพัฒนาเพื่อเชื่อมต่อฐานข้อมูลเว็บเข้ากับโลกเกม Roblox อย่างไร้รอยต่อ',
        stack: ['Lua / Luau', 'Roblox Studio', 'Web API', 'Cloudflare']
      }
    ],
    futurePlans: [
      {
        id: 'plan-roblox',
        title: 'Roblox Server',
        description: 'มีแผนสร้างเซิร์ฟเวอร์ Roblox พร้อมระบบคอมมูนิตี้และเครื่องมือจัดการที่เชื่อมกับงานเว็บ',
        tag: 'Roadmap 2026',
        active: true
      },
      {
        id: 'plan-minecraft',
        title: 'Minecraft Server (New Era)',
        description: 'เตรียมกลับมาพัฒนาเซิร์ฟเวอร์ Minecraft รุ่นใหม่ โดยนำบทเรียนจากช่วง 2021 - 2023 มาต่อยอด',
        tag: 'In Planning',
        active: true
      },
      {
        id: 'plan-appgame',
        title: 'App Game',
        description: 'มีแผนพัฒนา App Game ของตัวเอง เพื่อต่อยอดจากระบบบอทและคอมมูนิตี้ ให้ใช้งานได้ง่ายขึ้นทั้งบนมือถือและเดสก์ท็อป',
        tag: 'Future Concept',
        active: true
      },
      {
        id: 'plan-mc-skyline',
        title: 'Mc-Skyline',
        description: 'กำลังเตรียมเปิดตัวโปรเจกต์ Minecraft ยุคใหม่ คาดการณ์ช่วงธันวาคม 2026 หรือ 2027 โดยกำหนดการยังไม่ยืนยัน',
        tag: 'Coming Soon • วันที่รอยืนยัน',
        active: true
      }
    ],
    techStackGroups: [
      {
        num: '01',
        name: 'ภาษาโปรแกรม',
        color: '#4ade80',
        items: ['Rust', 'C++', 'Go', 'Node.js', 'Kotlin', 'Java', 'Python', 'JavaScript', 'TypeScript', 'HTML5', 'CSS3', 'SQL', 'MySQL']
      },
      {
        num: '02',
        name: 'ฟรอนต์เอนด์',
        color: '#f472b6',
        items: ['Next.js', 'React', 'Vue', 'Tailwind CSS', 'Vite', 'Modern Canvas']
      },
      {
        num: '03',
        name: 'แบ็กเอนด์',
        color: '#60a5fa',
        items: ['Elysia', 'Axum', 'WebSocket', 'Node.js', 'Express', 'Python FastAPI', 'Java Spring Boot']
      },
      {
        num: '04',
        name: 'ฐานข้อมูล',
        color: '#fbbf24',
        items: ['PostgreSQL', 'MySQL', 'SQLite', 'MongoDB', 'Cloud Firestore', 'Redis']
      },
      {
        num: '05',
        name: 'คลาวด์และเครื่องมือ',
        color: '#c084fc',
        items: ['Firebase Hosting', 'Cloudflare DDoS', 'Docker', 'Git', 'GitHub', 'VS Code', 'Google Cloud Platform']
      }
    ],
    socialContact: {
      discord: { name: 'Discord', url: GLOBAL_DISCORD_URL, desc: 'Community & Support Server', iconKey: 'discord_brand', color: '#5865F2', visible: true },
      github: { name: 'GitHub', url: 'https://github.com/', desc: 'Open Source & Repositories', iconKey: 'github', color: '#ffffff', visible: true },
      facebook: { name: 'Facebook', url: 'https://facebook.com/', desc: 'BestCyniX Dev Page', iconKey: 'facebook_brand', color: '#1877F2', visible: true },
      instagram: { name: 'Instagram', url: 'https://instagram.com/', desc: '@bestcynix.dev', iconKey: 'instagram_brand', color: '#E4405F', visible: true },
      line: { name: 'LINE', url: 'https://line.me/', desc: 'Direct Chat & Inquiries', iconKey: 'line_brand', color: '#06C755', visible: true },
      x: { name: 'X (Twitter)', url: 'https://x.com/', desc: 'Latest Updates & Dev Log', iconKey: 'x_brand', color: '#ffffff', visible: true },
      email: { name: 'Email', url: `mailto:${BUSINESS_EMAIL}`, desc: 'Direct Business Mail', iconKey: 'email_brand', color: '#EA4335', visible: true }
    }
  };

  // State
  window.BestCynixCMS = {
    data: defaultCMSData,
    brandIcons: brandIcons,
    getTechIcon: getTechIcon
  };
  window.BestCynixSiteConfig = { discordUrl: GLOBAL_DISCORD_URL, businessEmail: BUSINESS_EMAIL };
  window.syncGlobalCommunityLinks?.();

  const defaultProjectById = new Map(defaultCMSData.projects.map((project) => [project.id, project]));
  const normalizeProjects = (projects) => (Array.isArray(projects) ? projects : []).map((project) => {
    const fallback = defaultProjectById.get(project.id) || {};
    const canonicalCommunityUrl = PROJECT_COMMUNITY_URLS[project.id];
    const storedCommunityUrl = project.communityUrl || fallback.communityUrl || '';
    const communityUrl = canonicalCommunityUrl && (!project.communityUrl || project.communityUrl === GLOBAL_DISCORD_URL)
      ? canonicalCommunityUrl
      : storedCommunityUrl;
    return {
      ...fallback,
      ...project,
      showWebsite: project.showWebsite !== undefined ? project.showWebsite !== false : fallback.showWebsite !== false,
      communityUrl,
      showCommunity: project.showCommunity !== undefined
        ? project.showCommunity === true && Boolean(communityUrl)
        : fallback.showCommunity === true && Boolean(fallback.communityUrl)
    };
  });

  const normalizeSocialContact = (raw) => {
    const source = Array.isArray(raw)
      ? raw.reduce((result, channel) => {
        if (channel?.platform) result[channel.platform] = channel;
        return result;
      }, {})
      : { ...(raw || {}) };
    if (source.discord && (!source.discord.url || source.discord.url === 'https://in-skylineendless.web.app/' || source.discord.url === 'https://discord.gg/')) {
        source.discord = { ...source.discord, url: GLOBAL_DISCORD_URL };
      } else if (source.discord?.url) {
        window.BestCynixSiteConfig.discordUrl = source.discord.url;
      }
    if (source.email && (!source.email.url || source.email.url.includes('contact@bestcynix.dev'))) {
      source.email = { ...source.email, url: `mailto:${BUSINESS_EMAIL}` };
    }
    return source;
  };

  const safeLink = (value) => {
    if (!value || typeof value !== 'string') return '';
    try {
      const parsed = new URL(value, document.baseURI);
      return ['http:', 'https:', 'mailto:'].includes(parsed.protocol) ? parsed.href : '';
    } catch (error) {
      return '';
    }
  };
  const escapeAttribute = (value) => String(value || '')
    .replace(/&/g, '&amp;')
    .replace(/"/g, '&quot;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');

  // Auto Calculate & Update Stats Overview
  const updateAutoStats = (projects, futurePlans) => {
    const featuredCount = projects.filter(p => p.isFeatured).length;
    const initialEraProjects = projects.filter(p => p.period && p.period.includes('2021')).length;
    const futureCount = futurePlans.filter(f => f.active !== false).length;

    const elFeatured = document.getElementById('statProjectsCount');
    if (elFeatured) elFeatured.textContent = featuredCount || 6;

    const elInitial = document.getElementById('statInitialEraCount');
    if (elInitial) elInitial.textContent = initialEraProjects || 3;

    const elFuture = document.getElementById('statFutureCount');
    if (elFuture) elFuture.textContent = futureCount || 3;
  };

  // 2.5 Projects Pagination State
  window._projectCurrentPage = 1;
  window._projectPageSize = 6;

  // Render Projects Grid with Pagination (< 0 >) and Filter
  const renderProjects = (projectsList) => {
    const container = document.getElementById('projectsContainer');
    if (!container) return;
    container.innerHTML = '';

    const list = normalizeProjects(projectsList || defaultCMSData.projects);
    const activeFilter = window._currentProjectFilter || 'all';
    const searchQuery = (document.getElementById('projectSearchInput')?.value || '').toLowerCase().trim();

    let filtered = list.filter((p) => {
      const matchSearch = !searchQuery || 
        p.title.toLowerCase().includes(searchQuery) || 
        p.description.toLowerCase().includes(searchQuery) ||
        (p.stack && p.stack.some(s => s.toLowerCase().includes(searchQuery)));

      let matchTab = true;
      if (activeFilter === 'featured') matchTab = p.isFeatured;
      else if (activeFilter === 'active') matchTab = p.status === 'active';
      else if (activeFilter === 'closed') matchTab = p.status === 'closed';
      else if (activeFilter === 'spoiler') matchTab = p.isSpoiler || p.status === 'spoiler';

      return matchSearch && matchTab;
    });

    const totalItems = filtered.length;
    const isAll = window._projectPageSize === 'all';
    const pageSize = isAll ? totalItems : (parseInt(window._projectPageSize, 10) || 6);
    const totalPages = Math.max(1, Math.ceil(totalItems / (pageSize || 1)));

    if (window._projectCurrentPage > totalPages) window._projectCurrentPage = totalPages;
    if (window._projectCurrentPage < 1) window._projectCurrentPage = 1;

    const startIdx = isAll ? 0 : (window._projectCurrentPage - 1) * pageSize;
    const endIdx = isAll ? totalItems : Math.min(startIdx + pageSize, totalItems);
    const pageItems = filtered.slice(startIdx, endIdx);

    // Update Pagination UI
    const countLabel = document.getElementById('projectCountLabel');
    if (countLabel) {
      countLabel.textContent = totalItems > 0 
        ? `แสดง ${startIdx + 1} - ${endIdx} จากทั้งหมด ${totalItems} โปรเจกต์ (หน้า ${window._projectCurrentPage}/${totalPages})`
        : `ไม่พบโปรเจกต์ที่ตรงกับเงื่อนไขค้นหา`;
    }

    const pageInput = document.getElementById('inputProjectPageNumber');
    if (pageInput) {
      pageInput.value = window._projectCurrentPage;
      pageInput.max = totalPages;
    }

    const totalLabel = document.getElementById('projectTotalPagesLabel');
    if (totalLabel) {
      totalLabel.textContent = `/ ${totalPages} >`;
    }

    const btnPrev = document.getElementById('btnProjectPrevPage');
    if (btnPrev) {
      btnPrev.disabled = window._projectCurrentPage <= 1;
      btnPrev.style.opacity = window._projectCurrentPage <= 1 ? '0.4' : '1';
      btnPrev.style.cursor = window._projectCurrentPage <= 1 ? 'not-allowed' : 'pointer';
    }

    const btnNext = document.getElementById('btnProjectNextPage');
    if (btnNext) {
      btnNext.disabled = window._projectCurrentPage >= totalPages;
      btnNext.style.opacity = window._projectCurrentPage >= totalPages ? '0.4' : '1';
      btnNext.style.cursor = window._projectCurrentPage >= totalPages ? 'not-allowed' : 'pointer';
    }

    const paginationBar = document.getElementById('portfolioPaginationBar');
    if (paginationBar) {
      paginationBar.style.display = totalItems > 0 ? 'flex' : 'none';
    }

    if (pageItems.length === 0) {
      container.innerHTML = '<div style="grid-column: 1/-1; text-align:center; padding:3rem; color:var(--muted); font-size:1.05rem;">ไม่พบโปรเจกต์ที่ตรงกับเงื่อนไขการค้นหาหรือตัวกรอง</div>';
      return;
    }

    pageItems.forEach((p) => {
      const card = document.createElement('div');
      card.className = `project-card reveal-on-scroll ${p.isFeatured ? 'featured-pin' : ''}`;
      card.dataset.id = p.id;

      // Status Pill
      let statusHtml = '';
      if (p.status === 'active') {
        statusHtml = '<span class="badge-pill badge-active">🟢 เปิดใช้งานอยู่</span>';
      } else if (p.status === 'closed') {
        statusHtml = '<span class="badge-pill badge-closed">🔴 ปิดตัวแล้ว</span>';
      } else {
        statusHtml = '<span class="badge-pill badge-spoiler">🔒 ความลับ / สปอยล์</span>';
      }

      // Featured Badge
      const featHtml = p.isFeatured ? '<span class="badge-pill badge-featured">⭐ เด่น</span>' : '';
      
      // Dev Only Badge
      const devHtml = p.accessLevel === 'dev_only' ? '<span class="badge-pill badge-devonly">🛡️ เฉพาะ DEV</span>' : '';

      // Countdown Timer
      let countdownHtml = '';
      if (p.releaseDate) {
        countdownHtml = `<div class="countdown-pill" data-release="${p.releaseDate}">⏳ นับถอยหลัง: กำลังคำนวณ...</div>`;
      }

      // Spoiler blur effect
      const isBlurred = p.isSpoiler && (!window._isDevAdminLoggedIn);

      // Dedicated Project Page URL
      const projectDetailUrl = `project?id=${p.id}`;
      const projectUrl = safeLink(p.url);
      const communityUrl = safeLink(p.communityUrl);

      // Sanitize cover image filename (replace # with -)
      const sanitizePhotoUrl = (url) => {
        if (!url) return '';
        return url.replace(/#0194\.png/g, '-0194.png')
                  .replace(/#1391\.png/g, '-1391.png')
                  .replace(/#5750\.png/g, '-5750.png');
      };
      const cleanCover = sanitizePhotoUrl(p.coverImage);
      const coverHtml = cleanCover ? `<img src="${cleanCover}" alt="${p.title}" class="project-card-cover" onerror="this.onerror=null;this.src='assets/photo/bcxlogo2.png';" />` : '';

      card.innerHTML = `
        <div>
          ${coverHtml}
          <div class="project-badge-row">
            <span style="font-size:0.8rem; color:var(--muted); font-weight:600;">${p.period}</span>
            ${statusHtml}
            ${featHtml}
            ${devHtml}
          </div>
          <div class="${isBlurred ? 'spoiler-overlay' : ''}">
            <h3 class="project-title">${p.title}</h3>
            <p class="project-desc">${p.description}</p>
          </div>
          ${isBlurred ? '<div class="spoiler-notice-box" style="margin-top:0.6rem;">🔒 ข้อมูลถูกสปอยล์เพื่อเตรียมเปิดตัว เร็วๆ นี้</div>' : ''}
          ${countdownHtml}
        </div>
        <div class="project-actions-row">
          ${p.showWebsite !== false && projectUrl ? `<button type="button" class="btn-project-link" data-access="${escapeAttribute(p.accessLevel || 'public')}" data-url="${escapeAttribute(projectUrl)}" data-title="${escapeAttribute(p.title)}"><span>🌐 เปิดหน้าเว็บไซต์ →</span></button>` : ''}
          ${p.showCommunity === true && communityUrl ? `<a href="${escapeAttribute(communityUrl)}" target="_blank" rel="noopener noreferrer" class="btn-project-link"><span>💬 เข้าร่วมชุมชน →</span></a>` : ''}
          <a href="${projectDetailUrl}" class="btn-project-details">
            <span>📄 ดูรายละเอียดโปรเจกต์ →</span>
          </a>
        </div>
      `;

      card.querySelector('button.btn-project-link')?.addEventListener('click', (e) => {
        if (p.accessLevel === 'dev_only' && !window._isDevAdminLoggedIn) {
          e.preventDefault();
          showCyberToast('🛡️ โปรเจกต์นี้เปิดให้เข้าถึงได้เฉพาะบัญชีทีมพัฒนา (Dev Only) เท่านั้น', '', 'warning');
          return;
        }
        window.openProjectPopup(p.url, p.title);
      });

      container.appendChild(card);
    });

    if (window.triggerScrollReveal) window.triggerScrollReveal();
    setTimeout(() => {
      container.querySelectorAll('.reveal-on-scroll:not(.is-revealed)').forEach((c) => c.classList.add('is-revealed'));
    }, 20);
  };

  // Pagination & Filter Event Listeners Setup
  const initProjectPaginationListeners = () => {
    document.getElementById('btnProjectPrevPage')?.addEventListener('click', () => {
      if (window._projectCurrentPage > 1) {
        window._projectCurrentPage--;
        renderProjects(window.BestCynixCMS?.data?.projects);
      }
    });

    document.getElementById('btnProjectNextPage')?.addEventListener('click', () => {
      window._projectCurrentPage++;
      renderProjects(window.BestCynixCMS?.data?.projects);
    });

    document.getElementById('inputProjectPageNumber')?.addEventListener('change', (e) => {
      const val = parseInt(e.target.value, 10);
      if (!isNaN(val)) {
        window._projectCurrentPage = val;
        renderProjects(window.BestCynixCMS?.data?.projects);
      }
    });

    document.getElementById('projectPageSizeSelect')?.addEventListener('change', (e) => {
      window._projectPageSize = e.target.value;
      window._projectCurrentPage = 1;
      renderProjects(window.BestCynixCMS?.data?.projects);
    });
  };

  // Render Grouped Category Tech Stack (Matching media_1787427917061.png)
  const renderTechStack = (groups) => {
    const container = document.getElementById('stackGroupsContainer');
    if (!container) return;
    container.innerHTML = '';

    const list = groups || defaultCMSData.techStackGroups;

    list.forEach((grp, index) => {
      const groupEl = document.createElement('div');
      groupEl.className = 'stack-category-group reveal-on-scroll';
      groupEl.style.setProperty('--stack-idx', index);
      groupEl.style.transitionDelay = `${index * 130}ms`;

      const pillsHtml = grp.items.map((item, pIdx) => {
        const iconSvg = getTechIcon(item);
        return `
          <div class="stack-pill-tag" style="transition-delay: ${(index * 100) + (pIdx * 25)}ms;">
            <span class="stack-pill-tag-icon">${iconSvg}</span>
            <span>${item}</span>
          </div>
        `;
      }).join('');

      groupEl.innerHTML = `
        <div class="stack-group-header">
          <span class="stack-group-num" style="color: ${grp.color};">${grp.num}</span>
          <span>${grp.name}</span>
        </div>
        <div class="stack-pills-row">
          ${pillsHtml}
        </div>
      `;

      container.appendChild(groupEl);
    });

    if (window.triggerScrollReveal) window.triggerScrollReveal();
  };

  // Render Future Plans
  const renderFuturePlans = (plansList) => {
    const container = document.getElementById('futurePlansContainer');
    if (!container) return;
    container.innerHTML = '';

    plansList.forEach((plan) => {
      if (plan.active === false) return;
      const card = document.createElement('div');
      card.className = 'future-card reveal-on-scroll';
      card.innerHTML = `
        <div class="badge-pill badge-spoiler" style="display:inline-block; margin-bottom:0.8rem;">${plan.tag || 'Roadmap'}</div>
        <h3>${plan.title}</h3>
        <p>${plan.description}</p>
      `;
      container.appendChild(card);
    });

    if (window.triggerScrollReveal) window.triggerScrollReveal();
  };

  // Render Social Links
  const renderSocialLinks = (socialObj) => {
    const container = document.getElementById('socialLinksGrid');
    if (!container || !socialObj) return;
    container.innerHTML = '';

    const keys = ['discord', 'github', 'facebook', 'instagram', 'line', 'x', 'email'];
    keys.forEach((k) => {
      const s = socialObj[k];
      if (!s || s.visible === false) return;
      const socialUrl = safeLink(s.url);
      if (!socialUrl) return;

      let iconHtml = brandIcons[s.iconKey] || brandIcons[k + '_brand'] || brandIcons[k] || '';
      let brandColor = s.color || '#32ffc9';

      const btn = document.createElement('a');
      btn.href = socialUrl;
      btn.target = '_blank';
      btn.rel = 'noopener noreferrer';
      btn.className = 'social-btn reveal-on-scroll';
      btn.style.setProperty('--brand-glow', brandColor);

      btn.innerHTML = `
        <div class="social-btn-top">
          <div style="display:flex; align-items:center; gap:0.65rem;">
            <div class="social-icon-box">${iconHtml}</div>
            <span class="social-name">${s.name}</span>
          </div>
          <span style="color:${brandColor}; font-weight:bold;">→</span>
        </div>
        <span class="social-desc">${s.desc}</span>
      `;
      container.appendChild(btn);
    });

    if (window.triggerScrollReveal) window.triggerScrollReveal();
  };

  // Render All Sections
  const renderAllCMSContent = (data) => {
    if (data.projects) renderProjects(data.projects);
    if (data.futurePlans) renderFuturePlans(data.futurePlans);
    renderTechStack(data.techStackGroups);
    if (data.socialContact) renderSocialLinks(normalizeSocialContact(data.socialContact));
    if (data.projects && data.futurePlans) updateAutoStats(data.projects, data.futurePlans);
  };

  // Initialize Firestore Real-Time Listeners
  const initFirestoreCMS = () => {
    if (typeof firebase === 'undefined' || !firebase.apps.length) {
      renderAllCMSContent(defaultCMSData);
      return;
    }

    const db = firebase.firestore();

    db.collection('site_cms').doc('projects').onSnapshot((doc) => {
      if (doc.exists && doc.data().list) {
        const projects = normalizeProjects(doc.data().list);
        window.BestCynixCMS.data.projects = projects;
        renderProjects(projects);
        updateAutoStats(projects, window.BestCynixCMS.data.futurePlans);
      }
    }, (e) => console.warn('CMS Projects note:', e));

    db.collection('site_cms').doc('future_plans').onSnapshot((doc) => {
      if (doc.exists && doc.data().list) {
        window.BestCynixCMS.data.futurePlans = doc.data().list;
        renderFuturePlans(doc.data().list);
        updateAutoStats(window.BestCynixCMS.data.projects, doc.data().list);
      }
    }, (e) => console.warn('CMS Future Plans note:', e));

    db.collection('site_cms').doc('tech_stack').onSnapshot((doc) => {
      if (doc.exists && doc.data().groups) {
        window.BestCynixCMS.data.techStackGroups = doc.data().groups;
        renderTechStack(doc.data().groups);
      }
    }, (e) => console.warn('CMS Tech Stack note:', e));

    db.collection('site_cms').doc('social_contact').onSnapshot((doc) => {
      if (doc.exists && doc.data().channels) {
        const socialContact = normalizeSocialContact(doc.data().channels);
        window.BestCynixCMS.data.socialContact = socialContact;
        if (socialContact.discord?.url) {
          window.BestCynixSiteConfig.discordUrl = socialContact.discord.url;
          window.syncGlobalCommunityLinks?.();
        }
        renderSocialLinks(socialContact);
      }
    }, (e) => console.warn('CMS Social Links note:', e));
  };

  // Expose render functions and helpers globally
  window.BestCynixCMS.renderProjects = () => renderProjects(window.BestCynixCMS.data.projects);
  window.BestCynixCMS.renderTechStack = () => renderTechStack(window.BestCynixCMS.data.techStackGroups);
  window.BestCynixCMS.getTechIcon = getTechIcon;

  // ─── Project Website Preview Popup ────────────────────────────────────────
  const injectPopupHtml = () => {
    if (document.getElementById('projectPopupOverlay')) return;
    const html = `
      <div id="projectPopupOverlay" class="project-popup-overlay" role="dialog" aria-modal="true" aria-label="ดูตัวอย่างเว็บไซต์">
        <div class="project-popup-modal">
          <div class="project-popup-header">
            <div style="min-width:0; flex:1;">
              <div class="project-popup-title">
                <span class="popup-dot"></span>
                <span id="popupProjectTitle">กำลังโหลด...</span>
              </div>
              <div class="project-popup-url-label" id="popupProjectUrl"></div>
            </div>
            <div class="project-popup-header-actions">
              <a id="popupNewTabBtn" href="#" target="_blank" rel="noopener noreferrer" class="project-popup-btn-newtab">
                ↗ เปิดใน Tab ใหม่
              </a>
              <button type="button" id="popupCloseBtn" class="project-popup-btn-close" aria-label="ปิด">✕</button>
            </div>
          </div>
          <div class="project-popup-iframe-wrap">
            <div class="project-popup-loading" id="popupLoading">
              <div class="popup-spinner"></div>
              <span>กำลังโหลดหน้าเว็บไซต์...</span>
            </div>
            <div class="project-popup-fallback" id="popupFallback">
              <div class="fallback-icon">🚫</div>
              <h4>ไม่สามารถแสดงตัวอย่างได้</h4>
              <p>เว็บไซต์นี้ไม่อนุญาตให้แสดงใน iframe กรุณาเปิดในแท็บใหม่เพื่อดูเนื้อหา</p>
              <a id="popupFallbackBtn" href="#" target="_blank" rel="noopener noreferrer" class="btn-primary">
                ↗ เปิดหน้าเว็บไซต์
              </a>
            </div>
            <iframe id="popupIframe" title="Project Website Preview" sandbox="allow-scripts allow-same-origin allow-forms allow-popups"></iframe>
          </div>
          <div class="project-popup-footer">
            <span id="popupFooterUrl" style="overflow:hidden; text-overflow:ellipsis; white-space:nowrap; max-width:70%;"></span>
            <span style="color:var(--accent); font-weight:700;">BestCyniX Dev Preview</span>
          </div>
        </div>
      </div>
    `;
    document.body.insertAdjacentHTML('beforeend', html);

    const overlay = document.getElementById('projectPopupOverlay');
    const iframe = document.getElementById('popupIframe');
    const loadingEl = document.getElementById('popupLoading');
    const fallbackEl = document.getElementById('popupFallback');
    let iframeTimeout = null;

    const closePopup = () => {
      overlay.classList.remove('is-open');
      document.body.style.overflow = '';
      clearTimeout(iframeTimeout);
      setTimeout(() => {
        iframe.src = 'about:blank';
        loadingEl.classList.remove('is-hidden');
        fallbackEl.classList.remove('is-shown');
      }, 300);
    };

    document.getElementById('popupCloseBtn').addEventListener('click', closePopup);
    overlay.addEventListener('click', (e) => { if (e.target === overlay) closePopup(); });
    document.addEventListener('keydown', (e) => { if (e.key === 'Escape' && overlay.classList.contains('is-open')) closePopup(); });

    iframe.addEventListener('load', () => {
      clearTimeout(iframeTimeout);
      // Check if the iframe actually loaded content or got blocked
      try {
        // If we can access contentDocument and it's blank, iframe is blocked
        const doc = iframe.contentDocument || iframe.contentWindow?.document;
        if (doc && (doc.title === '' || doc.body?.innerHTML === '' || doc.domain !== window.location.hostname)) {
          // Still show the iframe — let the browser handle it naturally
          loadingEl.classList.add('is-hidden');
        } else {
          loadingEl.classList.add('is-hidden');
        }
      } catch (err) {
        // Cross-origin — likely loaded OK but we can't read it
        loadingEl.classList.add('is-hidden');
      }
    });

    iframe.addEventListener('error', () => {
      clearTimeout(iframeTimeout);
      loadingEl.classList.add('is-hidden');
      fallbackEl.classList.add('is-shown');
    });

    window._popupCloseHandler = closePopup;
  };

  window.openProjectPopup = (url, title) => {
    if (!url) return;
    injectPopupHtml();

    const overlay = document.getElementById('projectPopupOverlay');
    const iframe = document.getElementById('popupIframe');
    const titleEl = document.getElementById('popupProjectTitle');
    const urlLabel = document.getElementById('popupProjectUrl');
    const footerUrl = document.getElementById('popupFooterUrl');
    const newTabBtn = document.getElementById('popupNewTabBtn');
    const fallbackBtn = document.getElementById('popupFallbackBtn');
    const loadingEl = document.getElementById('popupLoading');
    const fallbackEl = document.getElementById('popupFallback');

    titleEl.textContent = title || 'ดูตัวอย่างเว็บไซต์';
    urlLabel.textContent = url;
    footerUrl.textContent = url;
    newTabBtn.href = url;
    fallbackBtn.href = url;
    loadingEl.classList.remove('is-hidden');
    fallbackEl.classList.remove('is-shown');

    // Timeout fallback — if iframe doesn't load in 8s, show fallback
    clearTimeout(window._popupIframeTimeout);
    window._popupIframeTimeout = setTimeout(() => {
      if (!loadingEl.classList.contains('is-hidden')) {
        loadingEl.classList.add('is-hidden');
        fallbackEl.classList.add('is-shown');
      }
    }, 8000);

    iframe.src = url;
    overlay.classList.add('is-open');
    document.body.style.overflow = 'hidden';
  };
  // ──────────────────────────────────────────────────────────────────────────

  // Real-Time Join Team Status Sync on Homepage
  const initJoinTeamHomeSync = () => {
    if (typeof firebase === 'undefined' || !firebase.firestore) return;
    const db = firebase.firestore();

    const checkIsOpen = (cfg) => {
      if (!cfg) return false;
      const mode = cfg.statusConfig?.mode || 'manual';
      if (mode === 'auto') {
        const now = new Date();
        const open = cfg.statusConfig?.autoOpenAt ? new Date(cfg.statusConfig.autoOpenAt) : null;
        const close = cfg.statusConfig?.autoCloseAt ? new Date(cfg.statusConfig.autoCloseAt) : null;
        if (open && now < open) return false;
        if (close && now > close) return false;
        return true;
      }
      return cfg.isOpen === true;
    };

    db.collection('joinTeamForms').doc('default').onSnapshot((doc) => {
      const cfg = doc.exists ? doc.data() : null;
      const isOpen = checkIsOpen(cfg);

      const navItem = document.getElementById('navJoinTeamItem');
      const topbarBtn = document.getElementById('topbarJoinTeamBtn');
      const heroBtn = document.getElementById('heroJoinTeamBtn');
      const homeSection = document.getElementById('homeJoinTeamSection');
      const homeTitle = document.getElementById('homeJoinTeamTitle');
      const homeDesc = document.getElementById('homeJoinTeamDesc');

      if (isOpen) {
        if (navItem) navItem.style.display = 'flex';
        if (topbarBtn) topbarBtn.style.display = 'inline-flex';
        if (heroBtn) heroBtn.style.display = 'inline-flex';
        if (homeSection) homeSection.style.display = 'block';
        if (homeTitle && cfg?.title) homeTitle.textContent = cfg.title;
        if (homeDesc && cfg?.subtitle) homeDesc.textContent = cfg.subtitle;
      } else {
        if (navItem) navItem.style.display = 'none';
        if (topbarBtn) topbarBtn.style.display = 'none';
        if (heroBtn) heroBtn.style.display = 'none';
        if (homeSection) homeSection.style.display = 'none';
      }
    }, () => {
      ['navJoinTeamItem', 'topbarJoinTeamBtn', 'heroJoinTeamBtn', 'homeJoinTeamSection'].forEach(id => {
        const el = document.getElementById(id);
        if (el) el.style.display = 'none';
      });
    });
  };

  // Initial Instant Render
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      renderAllCMSContent(defaultCMSData);
      initProjectPaginationListeners();
      initFirestoreCMS();
      initJoinTeamHomeSync();
    });
  } else {
    renderAllCMSContent(defaultCMSData);
    initProjectPaginationListeners();
    initFirestoreCMS();
    initJoinTeamHomeSync();
  }
})();
