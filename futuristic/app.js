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

  // This is a disclosure, not a modal: leaving it should reveal the page again.
  document.addEventListener('focusin', event => {
    if (open && !header.contains(event.target)) setOpen(false);
  });
  document.addEventListener('pointerdown', event => {
    if (open && !header.contains(event.target)) setOpen(false);
  });

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

  const links = Array.from(document.querySelectorAll('#primary-nav a[href^="#"], .chapter-nav a[href^="#"]'));
  const destinations = new Map();
  links.forEach(link => {
    try {
      const id = decodeURIComponent(link.getAttribute('href').slice(1));
      const section = id && document.getElementById(id);
      if (section) destinations.set(link, section);
    } catch (_) {
      // Ignore malformed fragments without affecting ordinary navigation.
    }
  });
  if (!destinations.size || typeof window.IntersectionObserver !== 'function') return;

  // Include the hero so navigation does not claim the next section is being read.
  const sections = Array.from(document.querySelectorAll('main > section[id]'));
  destinations.forEach(section => {
    if (!sections.includes(section)) sections.push(section);
  });
  sections.sort((a, b) => a.compareDocumentPosition(b) & Node.DOCUMENT_POSITION_FOLLOWING ? -1 : 1);

  let observer = null;
  let readingLine = 0;

  function updateCurrent() {
    let current = sections[0];
    sections.forEach(section => {
      if (section.getBoundingClientRect().top <= readingLine + 1) current = section;
    });
    if (window.scrollY + window.innerHeight >= document.documentElement.scrollHeight - 2) {
      current = sections[sections.length - 1];
    }
    destinations.forEach((section, link) => {
      if (section === current) link.setAttribute('aria-current', 'location');
      else link.removeAttribute('aria-current');
    });
  }

  function observeSections() {
    if (observer) observer.disconnect();
    const header = document.querySelector('.site-header');
    const headerHeight = header ? header.getBoundingClientRect().height : 0;
    readingLine = Math.min(window.innerHeight - 2, Math.max(headerHeight + 24, window.innerHeight * 0.3));
    observer = new window.IntersectionObserver(updateCurrent, {
      rootMargin: `-${readingLine}px 0px -${Math.max(0, window.innerHeight - readingLine - 1)}px 0px`,
      threshold: 0
    });
    sections.forEach(section => observer.observe(section));
    updateCurrent();
  }

  window.addEventListener('resize', observeSections);
  window.addEventListener('pageshow', observeSections);
  window.addEventListener('hashchange', updateCurrent);
  observeSections();
})();

(() => {
  'use strict';

  const visuals = Array.from(document.querySelectorAll('.hero-visual, .project-visual, .collaboration-visual, .fitness-visual, .security-visual'));
  const visibleVisuals = new Set();
  const entranceSelector = '.hero-enter, .section-heading, .service, .si-offer, .experience-row, .process-list li, .security-principles li, .contact-inner, .project-visual, .fitness-copy, .security-copy';
  const entrances = Array.from(document.querySelectorAll(entranceSelector))
    .filter(element => typeof element.animate === 'function');

  visuals.forEach(visual => { visual.dataset.motionActive = 'false'; });
  const motionToggle = document.getElementById('motion-toggle');
  const motionPreferenceKey = 'ru:motion-paused';
  let userPaused = false;
  try {
    userPaused = sessionStorage.getItem(motionPreferenceKey) === '1';
  } catch (_) {
    // The control still works when storage is unavailable.
  }

  function syncMotionControl() {
    if (userPaused) document.documentElement.setAttribute('data-motion-paused', 'true');
    else document.documentElement.removeAttribute('data-motion-paused');
    if (motionToggle) {
      motionToggle.setAttribute('aria-pressed', String(userPaused));
      motionToggle.textContent = userPaused ? 'Resume motion' : 'Pause motion';
    }
  }
  syncMotionControl();

  // Unsupported APIs leave the fully visible, static baseline intact.
  if (typeof window.matchMedia !== 'function' || typeof window.IntersectionObserver !== 'function') {
    if (motionToggle) motionToggle.hidden = true;
    return;
  }
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)');
  if (typeof reduced.addEventListener !== 'function' && typeof reduced.addListener !== 'function') {
    if (motionToggle) motionToggle.hidden = true;
    return;
  }

  let suspended = false;
  let heroObserver = null;
  let entranceObserver = null;
  const entered = new WeakSet();
  const activeEntrances = new Map();

  function motionAllowed() {
    return !document.documentElement.hasAttribute('data-preloading') && !suspended && !userPaused && !reduced.matches;
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
    if (motionToggle) motionToggle.hidden = reduced.matches;
    disconnectObservers();
    updateVisuals();
    if (!motionAllowed()) {
      if (reduced.matches || suspended || userPaused) cancelEntrances();
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

  if (motionToggle) {
    motionToggle.addEventListener('click', () => {
      userPaused = !userPaused;
      try {
        sessionStorage.setItem(motionPreferenceKey, userPaused ? '1' : '0');
      } catch (_) {}
      syncMotionControl();
      configureMotion();
    });
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
