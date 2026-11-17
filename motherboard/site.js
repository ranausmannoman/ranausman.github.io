(() => {
  const board = document.querySelector('.board');
  const menu = document.querySelector('.navigator');
  const chapters = [...menu.querySelectorAll('[data-chapter]')];
  const digits = document.querySelectorAll('[data-debug]');
  const sections = [...document.querySelectorAll('main section[data-unit]')];
  const contents = [...document.querySelectorAll('.case-toc a[href^="#"]')];
  const motionButton = document.querySelector('#motion-toggle');
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  let paused = false;
  let current = 'pcie';
  let hover = '';
  let focus = '';
  let frame = 0;
  try { paused = localStorage.getItem('ru-x1-motion') === 'pause'; } catch { /* Local preference only. */ }

  function motionState() {
    const off = paused || reduced.matches;
    document.documentElement.classList.toggle('motion-off', off);
    if (motionButton) {
      motionButton.hidden = reduced.matches;
      motionButton.setAttribute('aria-pressed', String(paused));
      motionButton.textContent = paused ? 'Resume motion' : 'Pause motion';
    }
  }
  motionState();
  reduced.addEventListener('change', motionState);
  motionButton?.addEventListener('click', () => {
    paused = !paused;
    try { localStorage.setItem('ru-x1-motion', paused ? 'pause' : 'play'); } catch { /* Keep local state. */ }
    motionState();
  });

  function show() {
    const part = focus || hover || current;
    const index = chapters.findIndex(a => a.dataset.chapter === part);
    menu.dataset.active = part;
    chapters.forEach((a,i) => i === index ? a.setAttribute('aria-current','location') : a.removeAttribute('aria-current'));
    if (!document.body.classList.contains('fault-page')) {
      const chapter = index >= 0 ? index + 1 : current === 'cpu' ? 0 : Math.max(0, chapters.findIndex(a => a.dataset.chapter === current) + 1);
      digits.forEach(digit => digit.textContent = String(chapter).padStart(2,'0'));
    }
    if (board) {
      board.dataset.active = part;
      board.querySelectorAll('[data-route]').forEach(bus => bus.classList.toggle('live',bus.dataset.route === part));
      const idx = [...board.querySelectorAll('[data-part]')].findIndex(a => a.dataset.part === part);
      board.querySelectorAll('.station').forEach((li,i) => li.classList.toggle('feeding', idx >= 0 && i <= idx && !!(hover || focus)));
    }
  }
  board?.querySelectorAll('[data-part]').forEach(a => {
    a.addEventListener('pointerenter', e => { if (e.pointerType !== 'touch') {hover = a.dataset.part; show();} });
    a.addEventListener('pointerleave', () => {hover = ''; show();});
    a.addEventListener('focus', () => {focus = a.dataset.part; show();});
    a.addEventListener('blur', () => {focus = ''; show();});
  });
  function locate() {
    frame = 0;
    const mark = Math.min(innerHeight*.36, 260) + document.querySelector('.mast').offsetHeight;
    if (sections.length) {
      const atEnd = Math.ceil(scrollY + innerHeight) >= document.documentElement.scrollHeight - 2;
      current = atEnd ? sections.at(-1).dataset.unit : sections.filter(s => s.getBoundingClientRect().top <= mark).at(-1)?.dataset.unit || 'cpu';
    }
    if (contents.length) {
      const active = contents.filter(a => document.getElementById(a.hash.slice(1))?.getBoundingClientRect().top <= mark).at(-1);
      contents.forEach(a => a === active ? a.setAttribute('aria-current','location') : a.removeAttribute('aria-current'));
    }
    show();
  }
  function queueLocate() { if (!frame) frame = requestAnimationFrame(locate); }
  if (sections.length || contents.length) {
    addEventListener('scroll', queueLocate, {passive:true});
    addEventListener('resize', queueLocate);
  }
  locate();
  if ('IntersectionObserver' in window) {
    const observer = new IntersectionObserver(entries => entries.forEach(({target,isIntersecting}) => {
      if (!isIntersecting) return;
      if (scrollY > 0) target.classList.add('powered');
      observer.unobserve(target);
    }),{threshold:0});
    [...sections,...document.querySelectorAll('.case-section')].forEach(section => observer.observe(section));
  }
  document.addEventListener('keydown',e => {
    if (e.key==='Escape' && menu.open) {menu.open=false; menu.querySelector('summary').focus();}
  });
  document.addEventListener('click',e => {
    if (menu.open && (!menu.contains(e.target) || e.target.closest('a'))) menu.open=false;
    const power = e.target.closest('[data-part="power"],a[data-power]');
    if (!power || e.defaultPrevented || e.button!==0 || e.ctrlKey || e.metaKey || e.shiftKey || e.altKey || paused || reduced.matches) return;
    e.preventDefault();
    if (document.documentElement.classList.contains('power-on')) return;
    document.documentElement.classList.add('power-on');
    setTimeout(() => {document.documentElement.classList.remove('power-on'); location.href=power.href;},160);
  });
  menu.addEventListener('focusout',e=>{if(e.relatedTarget && !menu.contains(e.relatedTarget)) menu.open=false;});
})();
