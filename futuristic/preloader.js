(() => {
  'use strict';

  const root = document.documentElement;
  const sessionKey = 'ru:preloader-seen';
  const reduced = typeof window.matchMedia === 'function'
    ? window.matchMedia('(prefers-reduced-motion: reduce)')
    : null;
  const navigation = typeof performance.getEntriesByType === 'function'
    ? performance.getEntriesByType('navigation')[0]
    : null;

  let seen = false;
  let internal = false;
  try {
    seen = sessionStorage.getItem(sessionKey) === '1';
    sessionStorage.setItem(sessionKey, '1');
  } catch (_) {
    // Referrer and navigation checks still prevent ordinary internal repeats.
  }
  try {
    internal = Boolean(document.referrer) && new URL(document.referrer).origin === location.origin;
  } catch (_) {}

  // This optional async script never covers an already-ready document.
  if (document.readyState !== 'loading' || seen || internal || location.hash ||
      document.visibilityState === 'hidden' || (reduced && reduced.matches) ||
      (navigation && navigation.type !== 'navigate')) return;

  let loader = null;
  let finished = false;
  let dismissing = false;
  let revealTimer;
  let deadlineTimer;
  let cleanupTimer;
  const listeners = [];

  function listen(target, type, handler, options) {
    target.addEventListener(type, handler, options);
    listeners.push(() => target.removeEventListener(type, handler, options));
  }

  function finish() {
    if (finished) return;
    finished = true;
    window.clearTimeout(revealTimer);
    window.clearTimeout(deadlineTimer);
    window.clearTimeout(cleanupTimer);
    const wasVisible = root.hasAttribute('data-preloading');
    root.removeAttribute('data-preloading');
    if (loader) loader.remove();
    listeners.forEach(remove => remove());
    if (wasVisible) document.dispatchEvent(new Event('portfolio:ready'));
  }

  function dismiss(immediate = false) {
    if (finished || (dismissing && !immediate)) return;
    dismissing = true;
    window.clearTimeout(revealTimer);
    if (immediate || !loader || (reduced && reduced.matches)) {
      finish();
      return;
    }
    // Start fading immediately; no minimum dwell or load-event dependency.
    root.setAttribute('data-preloading', 'leaving');
    cleanupTimer = window.setTimeout(finish, 240);
  }

  function reveal() {
    const focus = document.activeElement;
    if (finished || document.readyState !== 'loading' || !document.body ||
        document.visibilityState === 'hidden' ||
        (focus && focus !== document.body && focus !== root)) {
      finish();
      return;
    }
    loader = document.createElement('div');
    loader.className = 'page-preloader';
    loader.setAttribute('aria-hidden', 'true');
    loader.innerHTML = '<div class="preloader-brand"><span class="brand-mark">ru.</span>' +
      '<span class="preloader-name">Rana Usman</span>' +
      '<span class="preloader-track"><span></span></span>' +
      '<span class="preloader-label">Loading portfolio</span></div>';
    document.body.appendChild(loader);
    // Missing CSS fails open instead of showing unstyled loading text.
    if (window.getComputedStyle(loader).position !== 'fixed') {
      finish();
      return;
    }
    root.setAttribute('data-preloading', 'active');
  }

  listen(document, 'readystatechange', () => {
    if (document.readyState !== 'loading') dismiss();
  });
  listen(window, 'error', () => dismiss(true), true);
  listen(window, 'unhandledrejection', () => dismiss(true));
  listen(window, 'pagehide', () => dismiss(true));
  listen(window, 'pageshow', event => {
    if (event.persisted) dismiss(true);
  });
  listen(document, 'visibilitychange', () => {
    if (document.visibilityState === 'hidden') dismiss(true);
  });
  ['keydown', 'pointerdown', 'focusin'].forEach(type => {
    listen(document, type, () => dismiss(true), { capture: true, once: true });
  });
  if (reduced && typeof reduced.addEventListener === 'function') {
    listen(reduced, 'change', () => {
      if (reduced.matches) dismiss(true);
    });
  }

  // Delayed appearance prevents fast-load flashes; this never delays readiness.
  revealTimer = window.setTimeout(reveal, 180);
  deadlineTimer = window.setTimeout(() => dismiss(true), 2500);
})();
