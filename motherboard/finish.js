// Parser-blocking in the head, after the material sheet and before any body markup.
(() => {
  const root = document.documentElement;
  const key = 'ru-x1-finish';
  const chrome = document.querySelector('meta[name="theme-color"]');
  let finish = 'light';
  try {
    finish = localStorage.getItem(key) === 'dark' ? 'dark' : 'light';
  } catch { /* An unavailable store still permits switching this document. */ }

  function apply(value, fade = false) {
    if (fade && value !== root.dataset.finish) {
      root.classList.add('change-finish');
      clearTimeout(apply.timer);
      apply.timer = setTimeout(() => root.classList.remove('change-finish'), 190);
    }
    root.dataset.finish = value;
    const dark = value === 'dark';
    document.querySelectorAll('[data-switch]').forEach(control => {
      control.setAttribute('aria-checked', String(dark));
      control.hidden = false;
    });
    chrome.content = getComputedStyle(root).getPropertyValue('--surface').trim();
  }

  apply(finish);
  // Storage events also cover a removed preference or localStorage.clear().
  window.addEventListener('storage', event => {
    if (event.key === key || event.key === null) {
      apply(event.newValue === 'dark' ? 'dark' : 'light', true);
    }
  });
  document.addEventListener('DOMContentLoaded', () => {
    apply(root.dataset.finish);
    document.querySelector('[data-switch]').addEventListener('click', () => {
      const next = root.dataset.finish === 'dark' ? 'light' : 'dark';
      apply(next, true);
      try { localStorage.setItem(key, next); } catch { /* Session-only choice. */ }
    });
  });
})();
