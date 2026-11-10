(() => {
  'use strict';

  const canvas = document.getElementById('neural-network');
  if (!canvas || typeof canvas.getContext !== 'function') return;

  let context;
  try {
    context = canvas.getContext('2d', { alpha: true });
  } catch (_) {
    return;
  }
  if (!context) return;

  const root = document.documentElement;
  const reduced = typeof window.matchMedia === 'function'
    ? window.matchMedia('(prefers-reduced-motion: reduce)')
    : { matches: true };
  const palette = window.getComputedStyle(root);
  const primary = palette.getPropertyValue('--neural-primary').trim() || '193, 255, 114';
  const secondary = palette.getPropertyValue('--neural-secondary').trim() || '108, 146, 127';
  const highlight = palette.getPropertyValue('--neural-highlight').trim() || '220, 242, 207';
  const glowSprites = new Map();
  let width = 1;
  let height = 1;
  let nodes = [];
  let edges = [];
  let routes = [];
  let animationFrame = null;
  let resizeFrame = null;
  let previousTime = null;
  let elapsed = 0;
  let suspended = false;

  function randomGenerator(seed) {
    return () => {
      seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0;
      return seed / 4294967296;
    };
  }

  function motionAllowed() {
    return !suspended && document.visibilityState !== 'hidden' &&
      !reduced.matches && !root.hasAttribute('data-motion-paused') &&
      typeof window.requestAnimationFrame === 'function';
  }

  function glowFor(color) {
    if (glowSprites.has(color)) return glowSprites.get(color);
    const sprite = document.createElement('canvas');
    sprite.width = 96;
    sprite.height = 96;
    const glow = sprite.getContext('2d');
    if (!glow) {
      glowSprites.set(color, null);
      return null;
    }
    const gradient = glow.createRadialGradient(48, 48, 0, 48, 48, 48);
    gradient.addColorStop(0, `rgba(${color}, .7)`);
    gradient.addColorStop(0.16, `rgba(${color}, .4)`);
    gradient.addColorStop(0.4, `rgba(${color}, .16)`);
    gradient.addColorStop(0.72, `rgba(${color}, .035)`);
    gradient.addColorStop(1, `rgba(${color}, 0)`);
    glow.fillStyle = gradient;
    glow.fillRect(0, 0, 96, 96);
    glowSprites.set(color, sprite);
    return sprite;
  }

  function buildNetwork() {
    const random = randomGenerator(271828);
    const columns = width < 620 ? 4 : width < 1050 ? 6 : width < 1800 ? 8 : 10;
    const nodeBudget = width < 620 ? 28 : 60;
    const rows = Math.max(4, Math.min(Math.ceil(height / 150) + 2, Math.floor(nodeBudget / columns)));
    // The outer layer lives beyond the screen, so branches continue through
    // every edge instead of leaving a rectangular margin around the network.
    const overscanX = Math.max(24, Math.min(80, width * 0.08));
    const overscanY = Math.max(24, Math.min(80, height * 0.08));
    const columnWidth = (width + overscanX * 2) / (columns - 1);
    const rowHeight = (height + overscanY * 2) / (rows - 1);
    nodes = [];
    edges = [];
    routes = [];
    const outgoing = Array.from({ length: columns * rows }, () => []);

    for (let column = 0; column < columns; column += 1) {
      for (let row = 0; row < rows; row += 1) {
        const hub = (column * rows + row) % 11 === 4;
        const horizontalJitter = (random() - 0.5) * columnWidth * 0.42;
        const verticalJitter = (random() - 0.5) * rowHeight * 0.5;
        nodes.push({
          baseX: column === 0 ? -overscanX : column === columns - 1 ? width + overscanX : -overscanX + column * columnWidth + horizontalJitter,
          baseY: row === 0 ? -overscanY : row === rows - 1 ? height + overscanY : -overscanY + row * rowHeight + verticalJitter,
          x: 0,
          y: 0,
          phase: random() * Math.PI * 2,
          drift: Math.min(14, columnWidth * 0.09, rowHeight * 0.14) * (0.5 + random() * 0.5),
          speed: 0.1 + random() * 0.08,
          radius: hub ? 2.4 : 1.1 + random() * 0.7,
          alpha: 0.3 + random() * 0.25,
          color: hub ? highlight : column % 4 === 2 ? primary : secondary,
          glow: glowFor(hub ? highlight : primary),
          activation: 0,
          hub
        });
      }
    }

    // Connections are chosen once per resize, never searched for in a frame.
    for (let column = 0; column < columns - 1; column += 1) {
      for (let row = 0; row < rows; row += 1) {
        const from = column * rows + row;
        const nearest = Array.from({ length: rows }, (_, nextRow) => (column + 1) * rows + nextRow)
          .sort((a, b) => Math.abs(nodes[a].baseY - nodes[from].baseY) - Math.abs(nodes[b].baseY - nodes[from].baseY));
        [nearest[0], nearest[random() > 0.65 ? 2 : 1]].forEach((to, branch) => {
          const edge = {
            from,
            to,
            alpha: branch ? 0.08 + random() * 0.035 : 0.13 + random() * 0.05,
            color: column % 4 === 1 && branch === 0 ? highlight : branch ? secondary : primary,
            lengths: [0]
          };
          // A small arc-length table keeps light speed even on curved branches.
          const a = { x: nodes[from].baseX, y: nodes[from].baseY };
          const b = { x: nodes[to].baseX, y: nodes[to].baseY };
          let previous = a;
          for (let step = 1; step <= 32; step += 1) {
            const point = pointOnConnection(a, b, step / 32);
            edge.lengths.push(edge.lengths[step - 1] + Math.hypot(point.x - previous.x, point.y - previous.y));
            previous = point;
          }
          edge.length = edge.lengths[32];
          edges.push(edge);
          outgoing[from].push(edge);
        });
      }
    }

    // Each packet follows connected branches from one off-screen edge to the other.
    // Separate route phases spread traffic over the whole viewport, in both directions.
    const variants = width < 620 ? 1 : 2;
    for (let row = 0; row < rows; row += 1) {
      for (let variant = 0; variant < variants; variant += 1) {
        const segments = [];
        let node = row;
        let length = 0;
        for (let column = 0; column < columns - 1; column += 1) {
          const options = outgoing[node];
          const boundaryRow = node % rows === 0 || node % rows === rows - 1;
          const branch = boundaryRow || (variant === 1 && random() > 0.45) ? 1 : 0;
          const edge = options[branch];
          segments.push({ edge, start: length, end: length + edge.length });
          length += edge.length;
          node = edge.to;
        }
        const index = row * variants + variant;
        routes.push({
          segments,
          length,
          phase: (index * 0.61803398875 + 0.13) % 1,
          speed: width < 620 ? 38 + random() * 12 : 52 + random() * 20,
          direction: index % 2 === 0 ? 1 : -1,
          trail: width < 620 ? 44 : 72,
          color: variant === 0 ? primary : highlight,
          points: Array.from({ length: 9 }, () => ({})),
          glow: glowFor(variant === 0 ? primary : highlight)
        });
      }
    }
  }

  function pointOnConnection(from, to, progress, point = {}) {
    const inverse = 1 - progress;
    const middle = (from.x + to.x) / 2;
    point.x = inverse * inverse * inverse * from.x +
        3 * inverse * inverse * progress * middle +
        3 * inverse * progress * progress * middle +
        progress * progress * progress * to.x;
    point.y = inverse * inverse * inverse * from.y +
        3 * inverse * inverse * progress * from.y +
        3 * inverse * progress * progress * to.y +
        progress * progress * progress * to.y;
    return point;
  }

  function pointOnRoute(route, distance, point = {}) {
    const bounded = Math.max(0, Math.min(route.length, distance));
    const segment = route.segments.find(part => bounded <= part.end) || route.segments[route.segments.length - 1];
    const edge = segment.edge;
    const local = bounded - segment.start;
    let low = 0;
    let high = edge.lengths.length - 1;
    while (high - low > 1) {
      const middle = (low + high) >> 1;
      if (edge.lengths[middle] < local) low = middle;
      else high = middle;
    }
    const fraction = (local - edge.lengths[low]) / (edge.lengths[high] - edge.lengths[low] || 1);
    const progress = (low + fraction) / (edge.lengths.length - 1);
    pointOnConnection(nodes[edge.from], nodes[edge.to], progress, point);
    point.segment = segment;
    point.local = local;
    return point;
  }

  function drawTravelingSignals(time) {
    routes.forEach(route => {
      const raw = time * route.speed * route.direction + route.phase * route.length;
      const distance = ((raw % route.length) + route.length) % route.length;
      const head = pointOnRoute(route, distance, route.points[0]);
      const fade = Math.min(1, distance / 72, (route.length - distance) / 72);
      if (fade <= 0 || head.x + route.trail + 20 < 0 || head.x - route.trail - 20 > width ||
          head.y + route.trail + 20 < 0 || head.y - route.trail - 20 > height) return;
      // Trails continue through a junction on the same route, never jumping branches.
      let tail = head;
      context.beginPath();
      context.moveTo(head.x, head.y);
      for (let step = 1; step <= 8; step += 1) {
        const behind = distance - route.direction * route.trail * step / 8;
        if (behind < 0 || behind > route.length) break;
        tail = pointOnRoute(route, behind, route.points[step]);
        context.lineTo(tail.x, tail.y);
      }
      // One tapered stroke per packet avoids a separate canvas draw for each sample.
      if (tail !== head) {
        const trail = context.createLinearGradient(tail.x, tail.y, head.x, head.y);
        trail.addColorStop(0, `rgba(${route.color}, 0)`);
        trail.addColorStop(0.4, `rgba(${route.color}, .15)`);
        trail.addColorStop(1, `rgba(${route.color}, .68)`);
        context.strokeStyle = trail;
        context.lineWidth = 1.8;
        context.lineCap = 'round';
        context.globalAlpha = fade;
        context.stroke();
        context.globalAlpha = 1;
      }
      if (route.glow) {
        context.globalAlpha = fade * 0.85;
        context.drawImage(route.glow, head.x - 16, head.y - 16, 32, 32);
        context.globalAlpha = 1;
      }
      context.fillStyle = `rgba(${highlight}, ${fade * 0.94})`;
      context.beginPath();
      context.arc(head.x, head.y, 2.1, 0, Math.PI * 2);
      context.fill();

      // Connected neurons brighten as a packet arrives, then gently settle again.
      const edge = head.segment.edge;
      const fromGlow = Math.exp(-Math.pow(head.local / 28, 2)) * fade;
      const toGlow = Math.exp(-Math.pow((edge.length - head.local) / 28, 2)) * fade;
      nodes[edge.from].activation = Math.max(nodes[edge.from].activation, fromGlow);
      nodes[edge.to].activation = Math.max(nodes[edge.to].activation, toGlow);
    });
  }

  function draw(time) {
    context.clearRect(0, 0, width, height);
    nodes.forEach(node => {
      node.x = node.baseX + Math.sin(time * node.speed + node.phase) * node.drift;
      node.y = node.baseY + Math.cos(time * node.speed * 0.73 + node.phase) * node.drift;
      node.activation = 0;
    });

    context.lineWidth = 0.65;
    edges.forEach(edge => {
      const from = nodes[edge.from];
      const to = nodes[edge.to];
      const middle = (from.x + to.x) / 2;
      context.strokeStyle = `rgba(${edge.color}, ${edge.alpha})`;
      context.beginPath();
      context.moveTo(from.x, from.y);
      context.bezierCurveTo(middle, from.y, middle, to.y, to.x, to.y);
      context.stroke();
    });

    drawTravelingSignals(time);

    nodes.forEach(node => {
      // Staggered 7.5–10 second cycles brighten gently without abrupt flashes.
      const speed = 0.62 + node.phase / (Math.PI * 2) * 0.22;
      const wave = 0.5 + Math.sin(time * speed + node.phase) * 0.5;
      const pulse = Math.max(wave * wave, node.activation);
      const glowRadius = node.hub ? 23 + pulse * 13 : 14 + pulse * 10;
      if (node.x + glowRadius < 0 || node.x - glowRadius > width ||
          node.y + glowRadius < 0 || node.y - glowRadius > height) return;

      // Reuse tiny radial sprites; no full-canvas blur or per-frame gradients.
      if (node.glow) {
        context.globalAlpha = 0.22 + pulse * 0.64;
        context.drawImage(node.glow, node.x - glowRadius, node.y - glowRadius, glowRadius * 2, glowRadius * 2);
        context.globalAlpha = 1;
      }
      if (node.hub) {
        context.strokeStyle = `rgba(${node.color}, ${0.08 + pulse * 0.22})`;
        context.lineWidth = 0.7;
        context.beginPath();
        context.arc(node.x, node.y, 6.5 + pulse * 3.5, 0, Math.PI * 2);
        context.stroke();
      }
      context.fillStyle = `rgba(${node.color}, ${Math.min(0.85, node.alpha * 0.8 + pulse * 0.38)})`;
      context.beginPath();
      context.arc(node.x, node.y, node.radius * (0.95 + pulse * 0.25), 0, Math.PI * 2);
      context.fill();
      context.fillStyle = `rgba(${highlight}, ${0.22 + pulse * 0.45})`;
      context.beginPath();
      context.arc(node.x, node.y, node.radius * 0.45, 0, Math.PI * 2);
      context.fill();
    });
  }

  function animate(timestamp) {
    animationFrame = null;
    if (!motionAllowed()) {
      previousTime = null;
      return;
    }
    if (previousTime !== null) elapsed += Math.min(0.064, Math.max(0, timestamp - previousTime) / 1000);
    previousTime = timestamp;
    draw(elapsed);
    animationFrame = window.requestAnimationFrame(animate);
  }

  function syncMotion() {
    if (motionAllowed()) {
      if (animationFrame === null) {
        previousTime = null;
        animationFrame = window.requestAnimationFrame(animate);
      }
    } else {
      if (animationFrame !== null) window.cancelAnimationFrame(animationFrame);
      animationFrame = null;
      previousTime = null;
      if (document.visibilityState !== 'hidden') draw(elapsed);
    }
  }

  function resize() {
    resizeFrame = null;
    const bounds = canvas.getBoundingClientRect();
    width = Math.max(1, bounds.width || root.clientWidth || window.innerWidth || 1);
    height = Math.max(1, bounds.height || root.clientHeight || window.innerHeight || 1);
    const ratio = Math.min(1.5, window.devicePixelRatio || 1);
    canvas.width = Math.round(width * ratio);
    canvas.height = Math.round(height * ratio);
    context.setTransform(ratio, 0, 0, ratio, 0, 0);
    buildNetwork();
    draw(elapsed);
    syncMotion();
  }

  window.addEventListener('resize', () => {
    if (resizeFrame !== null) return;
    if (typeof window.requestAnimationFrame === 'function') resizeFrame = window.requestAnimationFrame(resize);
    else resize();
  });
  document.addEventListener('visibilitychange', syncMotion);
  window.addEventListener('pagehide', () => {
    suspended = true;
    syncMotion();
  });
  window.addEventListener('pageshow', () => {
    suspended = false;
    syncMotion();
  });
  if (typeof reduced.addEventListener === 'function') reduced.addEventListener('change', syncMotion);
  else if (typeof reduced.addListener === 'function') reduced.addListener(syncMotion);
  if (typeof window.MutationObserver === 'function') {
    new window.MutationObserver(syncMotion).observe(root, { attributes: true, attributeFilter: ['data-motion-paused'] });
  }

  resize();
})();
