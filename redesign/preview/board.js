(() => {
  const board = document.querySelector('.board');
  const menu = document.querySelector('.navigator');
  const chapters = [...menu.querySelectorAll('[data-chapter]')];
  const digits = document.querySelectorAll('[data-debug]');
  function showChapter(part) {
    const index = chapters.findIndex(link => link.dataset.chapter === part);
    chapters.forEach((link, i) => {
      if (i === index) link.setAttribute('aria-current', 'location');
      else link.removeAttribute('aria-current');
    });
    digits.forEach(node => { node.textContent = String(Math.max(1, index + 1)).padStart(2, '0'); });
    menu.dataset.active = part;
  }
  let current = 'pcie';
  function display(part) {
    board.querySelectorAll('[data-route]').forEach(bus => bus.classList.toggle('live', bus.dataset.route === part));
    board.dataset.active = part;
    showChapter(part || current);
  }
  for (const link of board.querySelectorAll('[data-part]')) {
    const on = () => display(link.dataset.part);
    link.addEventListener('pointerenter', on);
    link.addEventListener('focus', on);
    link.addEventListener('pointerleave', () => display(board.querySelector('a:focus-visible')?.dataset.part || ''));
    link.addEventListener('blur', () => display(''));
  }
  const sections = [...document.querySelectorAll('.chapter')];
  function locate() {
    const active = sections.filter(section => section.getBoundingClientRect().top < innerHeight * .55).at(-1);
    current = active?.id === 'approach' ? 'vrm' : 'pcie';
    display(board.querySelector('a:is(:hover,:focus-visible)')?.dataset.part || '');
  }
  if ('IntersectionObserver' in window) {
    const observer = new IntersectionObserver(locate, {rootMargin: '0px 0px -45% 0px'});
    sections.forEach(section => observer.observe(section));
  }
  document.addEventListener('keydown', event => {
    if (event.key === 'Escape' && menu.open) {
      menu.open = false;
      menu.querySelector('summary').focus();
    }
  });
  document.addEventListener('click', event => {
    if (menu.open && (!menu.contains(event.target) || event.target.closest('a'))) menu.open = false;
  });
  menu.addEventListener('focusout', event => {
    if (event.relatedTarget && !menu.contains(event.relatedTarget)) menu.open = false;
  });
  locate();
})();
