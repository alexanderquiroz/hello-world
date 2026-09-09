/* Iconos vectoriales de la interfaz DGIC. No contiene contraseñas. */
(() => {
  'use strict';
  const paths = {
    antenna: '<circle cx="12" cy="6.5" r="1.65" fill="currentColor" stroke="none"/><path d="M9.2 3.3a4.5 4.5 0 0 0 0 6.4m5.6-6.4a4.5 4.5 0 0 1 0 6.4M6.4 1a8 8 0 0 0 0 11m11.2-11a8 8 0 0 1 0 11M12 9.5 7.2 23M12 9.5 16.8 23M9.2 17h5.6M8 21h8M10.5 14l4.5 7M13.5 14l-4.5 7"/>',
    pin: '<path d="M20 10c0 6-8 12-8 12S4 16 4 10a8 8 0 1 1 16 0Z"/><circle cx="12" cy="10" r="2.8"/>',
    wifi: '<path d="M2 8.5a16 16 0 0 1 20 0M5.2 12a11 11 0 0 1 13.6 0M8.5 15.5a5.5 5.5 0 0 1 7 0"/><circle cx="12" cy="19" r="1.5" fill="currentColor" stroke="none"/>',
    dish: '<path d="m5 4 15 15A10.6 10.6 0 0 1 5 4Zm7.4 8.4 5-5M16 2a7 7 0 0 1 6 6M16 5a3.7 3.7 0 0 1 3 3M9 18l-2 4m7-3 2 3M5 22h13"/><circle cx="18" cy="6" r="1" fill="currentColor" stroke="none"/>',
    road: '<path d="M7 2 3 22M17 2l4 20M12 3v3m0 4v4m0 4v4"/><path d="m7 2 10 0" stroke-opacity=".4"/>',
    report: '<path d="M6 2h8l5 5v15H6V2Z"/><path d="M14 2v6h5M9 12h7M9 16h7M9 19h4"/>',
    filter: '<path d="M3 4h18l-7 8v8l-4-2v-6L3 4Z" fill="currentColor" stroke="none"/>',
    refresh: '<path d="M20 8a8 8 0 0 0-14-3L3 8m0-5v5h5M4 16a8 8 0 0 0 14 3l3-3m0 5v-5h-5"/>',
    download: '<path d="M12 3v12m-5-5 5 5 5-5M4 16v5h16v-5"/>',
    check: '<circle cx="12" cy="12" r="9"/><path d="m7.5 12 3 3 6-6"/>',
    clock: '<circle cx="12" cy="12" r="9"/><path d="M12 6v6l4 2"/>',
    alert: '<path d="m12 3 10 18H2L12 3Z"/><path d="M12 9v5m0 3v.1"/>',
    users: '<circle cx="9" cy="8" r="3"/><path d="M3 21v-3a6 6 0 0 1 12 0v3M16 5a3 3 0 0 1 0 6m2 3a5 5 0 0 1 3 4v3"/>',
    building: '<path d="M4 22V4h12v18M16 10h4v12M2 22h20M8 8h4m-4 4h4m-4 4h4M9 22v-3h2v3"/>',
    add: '<circle cx="12" cy="12" r="9"/><path d="M12 7v10M7 12h10"/>',
    database: '<ellipse cx="12" cy="5" rx="8" ry="3"/><path d="M4 5v14c0 1.7 3.6 3 8 3s8-1.3 8-3V5M4 12c0 1.7 3.6 3 8 3s8-1.3 8-3"/>',
    layers: '<path d="m12 2 10 6-10 6L2 8l10-6ZM2 12l10 6 10-6M2 16l10 6 10-6"/>',
    user: '<circle cx="12" cy="8" r="4"/><path d="M4 22v-3a8 8 0 0 1 16 0v3"/>',
    lock: '<rect x="5" y="10" width="14" height="12" rx="2"/><path d="M8 10V6a4 4 0 0 1 8 0v4M12 15v3"/>',
    exit: '<path d="M9 4H4v16h5M9 12h13m-4-4 4 4-4 4"/>',
    eye: '<path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12Z"/><circle cx="12" cy="12" r="3"/>',
    eyeOff: '<path d="m3 3 18 18M9.6 5.3A12 12 0 0 1 12 5c6.5 0 10 7 10 7a20 20 0 0 1-3 3.8M6.1 6.1A22 22 0 0 0 2 12s3.5 7 10 7a13 13 0 0 0 5.1-1.1M10 10a3 3 0 0 0 4 4"/>',
    calendar: '<rect x="3" y="5" width="18" height="17" rx="2"/><path d="M7 2v6m10-6v6M3 11h18M7 15h2m4 0h2m-8 4h2"/>',
    search: '<circle cx="10" cy="10" r="6.5"/><path d="m15 15 7 7"/>',
    map: '<path d="m3 5 6-3 6 3 6-3v17l-6 3-6-3-6 3V5ZM9 2v17M15 5v17"/>',
    info: '<circle cx="12" cy="12" r="9"/><path d="M12 10v7m0-11v.1"/>',
    close: '<path d="m6 6 12 12M18 6 6 18"/>',
    chevronLeft: '<path d="m15 5-7 7 7 7"/>',
    chevronRight: '<path d="m9 5 7 7-7 7"/>',
    chart: '<path d="M3 3v18h19M7 16V9m5 7V5m5 11v-5"/>'
  };
  const aliases = { DGIC: 'dgic@alexqpa.org.pe' };
  function icon(name, className = '') {
    const p = paths[name] || paths.report;
    const cls = String(className).replace(/[^a-zA-Z0-9_ -]/g, '');
    return `<svg class="dgic-icon ${cls}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false">${p}</svg>`;
  }
  function resolveLogin(value) {
    const id = String(value || '').trim();
    const alias = aliases[id.toUpperCase()];
    if (alias) return alias;
    if (/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(id)) return id;
    throw new Error('Ingresa DGIC o el correo de una cuenta autorizada.');
  }
  function accountLabel(user) {
    if (!user) return 'Resumen público';
    const key = Object.keys(aliases).find(k => aliases[k] === String(user.email || '').toLowerCase());
    return key || user.user_metadata?.display_name || 'Usuario autorizado';
  }
  function hydrate(root = document) {
    root.querySelectorAll('[data-icon]').forEach(el => { el.innerHTML = icon(el.dataset.icon); });
  }
  window.DGIC_UI = Object.freeze({ icon, hydrate, resolveLogin, accountLabel });
  hydrate();
})();
