(() => {
  /* Lay out one etched circuit field over the actual page, including expanded content.
     Device outlines retain their physical proportions at every viewport. */
  function routeSubstrate(width, height, seed, maxRows = Infinity) {
    const packages = ['via', 'array', 'soic', 'crystal', 'qfn', 'header', 'choke', 'via'];
    let randomState = seed + 1;
    const sample = () => {
      randomState = (Math.imul(randomState, 1664525) + 1013904223) >>> 0;
      return randomState / 4294967296;
    };
    // Let plates on very large / zoomed documents breathe while retaining a bounded SVG.
    const pitch = Math.max(width < 650 ? 155 : 226, Math.sqrt(width * height / 420));
    const columns = Math.max(2, Math.ceil(width / pitch));
    const rows = Math.max(3, Math.min(maxRows, Math.ceil(height / (pitch * .8))));
    const columnWidth = width / columns;
    const rowHeight = height / rows;
    const nodes = [];
    for (let row = 0; row < rows; row++) {
      const line = [];
      for (let col = 0; col < columns; col++) {
        line.push({
          x: Math.round((col + .12 + .72 * sample()) * columnWidth),
          y: Math.round((row + .12 + .72 * sample()) * rowHeight),
          part: packages[Math.floor(sample() * packages.length)],
          scale: [.65, .8, 1, 1.35, 1.85][Math.floor(sample() * 5)],
          turn: Math.floor(sample() * 4) * 90
        });
      }
      nodes.push(line);
    }
    const wiring = [];
    const furniture = [];
    function link(a, b, vertical) {
      // Run straight from a terminal, turn 45 degrees, then fan into its neighbour.
      const u = vertical ? 'y' : 'x', v = vertical ? 'x' : 'y';
      const span = b[u] - a[u], across = b[v] - a[v];
      const diagonal = Math.min(Math.abs(across), Math.max(0, span - 16));
      const straight = Math.round((span - diagonal) * (.18 + .6 * sample()));
      const bend = a[u] + straight;
      const slant = Math.sign(across) * diagonal;
      const count = sample() < .68 ? 2 : 1;
      for (let lane = 0; lane < count; lane++) {
        const offset = lane * 3;
        const from = a[v] + offset, to = b[v] + offset;
        const jog = from + slant === to ? '' : (vertical ? 'H' : 'V') + to;
        if (vertical) wiring.push('M'+from+' '+a[u]+'V'+bend+'l'+slant+' '+diagonal+jog+'V'+b[u]);
        else wiring.push('M'+a[u]+' '+from+'H'+bend+'l'+diagonal+' '+slant+jog+'H'+b[u]);
      }
    }
    nodes.forEach((line,row) => {
      line.forEach((node,col) => {
        const {x,y,part,turn,scale} = node;
        let transform = 'translate('+x+' '+y+')';
        if (turn) transform += ' rotate('+turn+')';
        if (scale !== 1) transform += ' scale('+scale+')';
        furniture.push('<use href="#field-'+part+'" transform="'+transform+'"/>');
        if (col + 1 < columns && (sample() < .72 || row === 0)) link(node, line[col+1], false);
        if (row + 1 < rows && (sample() < .62 || columns === 2)) link(node, nodes[row+1][col], true);
        if (sample() < .4) {
          const dx = Math.round(columnWidth * (.1 + .17 * sample()));
          const dy = Math.floor(9 + sample() * 20);
          wiring.push('M'+x+' '+y+'h'+dx+'l'+dy+' '+dy+'h13');
          furniture.push('<use href="#field-array" transform="translate('+(x+dx+dy+13)+' '+(y+dy)+') scale(.6)"/>');
        }
      });
    });
    const artwork = '<path class="etched-traces" d="'+wiring.join('')+'"/><g class="etched-parts">'+furniture.join('')+'</g>';
    // Browser serialization expands self-closing SVG elements. Leave room for
    // the permanent board artwork, even at a 32px default with every panel open.
    const serializedBytes = artwork.length + 5 * (furniture.length + 1);
    if (serializedBytes > 104000 && rows > 3) {
      return routeSubstrate(width, height, seed, Math.floor(rows * .9));
    }
    return artwork;
  }

  const field = document.querySelector('.pcb-field');
  if (field && 'ResizeObserver' in window) {
    let paintFrame = 0;
    const fitField = () => {
      paintFrame = 0;
      const width = Math.round(document.body.clientWidth);
      const height = Math.round(document.body.offsetHeight);
      const bounds = '0 0 ' + width + ' ' + height;
      if (!width || !height || field.getAttribute('viewBox') === bounds) return;
      field.innerHTML = routeSubstrate(width, height, Number(field.dataset.seed));
      field.setAttribute('viewBox', bounds);
    };
    fitField();
    new ResizeObserver(() => {
      if (!paintFrame) paintFrame = requestAnimationFrame(fitField);
    }).observe(document.body);
  }

  const board = document.querySelector('.board');
  const menu = document.querySelector('.navigator');
  const chapters = [...menu.querySelectorAll('[data-chapter]')];
  const digits = document.querySelectorAll('[data-debug]');
  const sections = [...document.querySelectorAll('main section[data-unit]')];
  const contents = [...document.querySelectorAll('.case-toc a[href^="#"]')];
  const motionButton = document.querySelector('#motion-toggle');
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  const fault = document.body.classList.contains('fault-page');
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

  // Keep the CPU-first cropped view in the same reading and keyboard order.
  const drawing = board?.closest('.drawing');
  const intro = drawing?.parentElement.querySelector('.hero-copy');
  if (intro && drawing) {
    const landscape = matchMedia('(max-height: 27em) and (orientation: landscape)');
    const arrangeHero = () => {
      const first = landscape.matches ? drawing : intro;
      const second = landscape.matches ? intro : drawing;
      if (first.nextElementSibling === second) return;
      const active = document.activeElement;
      if (first.parentElement.moveBefore) first.parentElement.moveBefore(first, second);
      else {
        second.before(first);
        if (first.contains(active)) active.focus({preventScroll: true});
      }
    };
    arrangeHero();
    landscape.addEventListener('change', arrangeHero);
  }

  function show() {
    const part = focus || hover || current;
    const index = fault ? -1 : chapters.findIndex(a => a.dataset.chapter === current);
    menu.dataset.active = fault ? '' : current;
    chapters.forEach((a,i) => i === index ? a.setAttribute('aria-current','location') : a.removeAttribute('aria-current'));
    if (!fault) digits.forEach(digit => digit.textContent = String(index + 1).padStart(2,'0'));
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
