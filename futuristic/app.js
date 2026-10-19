(() => {
  'use strict';

  const header = document.querySelector('.site-header');
  const toggle = document.getElementById('nav-toggle');
  const nav = document.getElementById('primary-nav');

  if (!header || !toggle || !nav || typeof window.matchMedia !== 'function') return;

  const mobile = window.matchMedia('(max-width: 800px)');
  if (typeof mobile.addEventListener !== 'function' && typeof mobile.addListener !== 'function') return;

  let open = false;

  function setOpen(next) {
    open = mobile.matches && next;
    toggle.setAttribute('aria-expanded', String(open));
    nav.hidden = mobile.matches && !open;
  }

  function syncLayout() {
    const focusInNav = nav.contains(document.activeElement);
    const focusOnToggle = document.activeElement === toggle;

    toggle.hidden = !mobile.matches;
    setOpen(mobile.matches && focusInNav);

    // Preserve a visible focus destination when the disclosure button disappears.
    if (!mobile.matches && focusOnToggle) {
      const firstLink = nav.querySelector('a[href]');
      if (firstLink) firstLink.focus({ preventScroll: true });
    }
  }

  toggle.addEventListener('click', () => setOpen(!open));

  document.addEventListener('keydown', event => {
    if (event.key !== 'Escape' || !open) return;
    event.preventDefault();
    setOpen(false);
    toggle.focus({ preventScroll: true });
  });

  nav.addEventListener('click', event => {
    if (event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
    const link = event.target.closest('a[href^="#"]');
    if (!link || link.hasAttribute('download') || (link.target && link.target !== '_self')) return;

    let id;
    try {
      id = decodeURIComponent(link.getAttribute('href').slice(1));
    } catch (_) {
      return;
    }
    const target = id && document.getElementById(id);
    if (!target) return;

    setOpen(false);
    target.focus({ preventScroll: true });
    // Let the anchor update the URL and scroll natively.
  });

  if (typeof mobile.addEventListener === 'function') {
    mobile.addEventListener('change', syncLayout);
  } else {
    mobile.addListener(syncLayout);
  }

  syncLayout();
  document.documentElement.classList.add('js');
})();

(() => {
  'use strict';

  const visuals = Array.from(document.querySelectorAll('.hero-visual, .project-visual, .collaboration-visual, .fitness-visual'));
  const visibleVisuals = new Set();
  const entranceSelector = '.hero-enter, .section-heading, .service, .ai-offer, .experience-row, .process-list li, .contact-inner, .project-visual, .fitness-copy';
  const entrances = Array.from(document.querySelectorAll(entranceSelector))
    .filter(element => typeof element.animate === 'function');

  visuals.forEach(visual => { visual.dataset.motionActive = 'false'; });
  // Manual pause controls are retired; discard any stale page-state marker.
  document.documentElement.removeAttribute('data-motion-paused');

  // Unsupported APIs leave the fully visible, static baseline intact.
  if (typeof window.matchMedia !== 'function' || typeof window.IntersectionObserver !== 'function') return;
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)');
  if (typeof reduced.addEventListener !== 'function' && typeof reduced.addListener !== 'function') return;

  let suspended = false;
  let heroObserver = null;
  let entranceObserver = null;
  const entered = new WeakSet();
  const activeEntrances = new Map();

  function motionAllowed() {
    return !document.documentElement.hasAttribute('data-preloading') && !suspended && !reduced.matches;
  }

  function updateVisuals() {
    visuals.forEach(visual => {
      visual.dataset.motionActive = String(motionAllowed() && visibleVisuals.has(visual) && document.visibilityState === 'visible');
    });
  }

  function disconnectObservers() {
    if (heroObserver) heroObserver.disconnect();
    if (entranceObserver) entranceObserver.disconnect();
    heroObserver = null;
    entranceObserver = null;
    visibleVisuals.clear();
  }

  function cancelEntrances() {
    activeEntrances.forEach(animation => animation.cancel());
    activeEntrances.clear();
  }

  function syncEntrances() {
    activeEntrances.forEach(animation => {
      if (motionAllowed() && document.visibilityState === 'visible') animation.play();
      else animation.pause();
    });
  }

  function configureMotion() {
    disconnectObservers();
    updateVisuals();
    if (!motionAllowed()) {
      if (reduced.matches || suspended) cancelEntrances();
      else syncEntrances();
      return;
    }
    syncEntrances();

    if (visuals.length) {
      const observer = new window.IntersectionObserver(entries => {
        if (heroObserver !== observer || !motionAllowed()) return;
        entries.forEach(entry => {
          if (entry.isIntersecting) visibleVisuals.add(entry.target);
          else visibleVisuals.delete(entry.target);
        });
        updateVisuals();
      }, { threshold: 0 });
      heroObserver = observer;
      visuals.forEach(visual => observer.observe(visual));
    }

    const pending = entrances.filter(element => !entered.has(element));
    if (!pending.length) return;

    const observer = new window.IntersectionObserver(entries => {
      if (entranceObserver !== observer || !motionAllowed() || document.visibilityState !== 'visible') return;
      entries.forEach(entry => {
        if (!entry.isIntersecting || entered.has(entry.target)) return;
        const element = entry.target;
        entered.add(element);
        observer.unobserve(element);

        const frames = [{ opacity: 0.75 }, { opacity: 1 }];

        try {
          const animation = element.animate(frames, {
            duration: 560,
            easing: 'cubic-bezier(0.22, 1, 0.36, 1)'
          });
          element.dataset.motionEntered = 'true';
          activeEntrances.set(element, animation);
          const complete = () => activeEntrances.delete(element);
          animation.onfinish = complete;
          animation.oncancel = complete;
        } catch (_) {
          // The static baseline needs no recovery when animation is unavailable.
        }
      });
    }, { threshold: 0.12, rootMargin: '0px 0px -24px 0px' });
    entranceObserver = observer;
    pending.forEach(element => observer.observe(element));
  }

  document.addEventListener('portfolio:ready', configureMotion);
  document.addEventListener('visibilitychange', () => {
    updateVisuals();
    syncEntrances();
    if (document.visibilityState === 'visible' && motionAllowed()) configureMotion();
  });
  window.addEventListener('pagehide', () => {
    suspended = true;
    configureMotion();
  });
  window.addEventListener('pageshow', () => {
    suspended = false;
    configureMotion();
  });
  if (typeof reduced.addEventListener === 'function') {
    reduced.addEventListener('change', configureMotion);
  } else {
    reduced.addListener(configureMotion);
  }

  configureMotion();
})();
