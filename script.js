const reducedMotion = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches;

// ── Semi-implicit Euler Spring Physics Primitive ──────────────────────────
const spring = (initial = 0, opts = {}) => {
  const stiffness = opts.stiffness ?? 180;
  const damping = opts.damping ?? 20;
  const mass = opts.mass ?? 1;
  const PRECISION = opts.precision ?? 0.001;
  let cur = initial;
  let vel = 0;
  let tgt = initial;
  return {
    set(t) { tgt = t; },
    jump(v) { cur = v; tgt = v; vel = 0; },
    step(dt) {
      const f = -stiffness * (cur - tgt);
      const dv = (f - damping * vel) / mass;
      vel += dv * dt;
      cur += vel * dt;
      if (Math.abs(vel) < PRECISION && Math.abs(cur - tgt) < PRECISION) {
        cur = tgt; vel = 0;
      }
      return cur;
    },
    get value() { return cur; },
  };
};

// ── Theme Switcher with Circular Reveal ───────────────────────────────────
(() => {
  const KEY = 'theme';
  const root = document.documentElement;
  const btn = document.querySelector('[data-theme-toggle]');
  const meta = document.querySelector('meta[name="theme-color"]');
  const mq = window.matchMedia('(prefers-color-scheme: light)');
  const COLOR = { light: '#f5f6ee', dark: '#0a0b09' };

  const current = () => (root.dataset.theme === 'light' ? 'light' : 'dark');

  const apply = (t, persist) => {
    if (t === 'light') root.dataset.theme = 'light';
    else delete root.dataset.theme;
    if (meta) meta.setAttribute('content', COLOR[t]);
    if (btn) btn.setAttribute('aria-pressed', t === 'light' ? 'true' : 'false');
    if (persist) {
      try { localStorage.setItem(KEY, t); } catch (_) { }
    }
  };

  apply(current(), false);

  window.toggleThemeMode = () => {
    const next = current() === 'light' ? 'dark' : 'light';
    const supported = typeof document.startViewTransition === 'function';
    if (!supported || reducedMotion()) {
      apply(next, true);
      return;
    }
    const rect = btn ? btn.getBoundingClientRect() : { left: window.innerWidth / 2, top: 40, width: 0, height: 0 };
    const x = rect.left + rect.width / 2;
    const y = rect.top + rect.height / 2;
    const endR = Math.hypot(
      Math.max(x, window.innerWidth - x),
      Math.max(y, window.innerHeight - y)
    );
    root.style.setProperty('--theme-clip-x', `${x}px`);
    root.style.setProperty('--theme-clip-y', `${y}px`);
    root.style.setProperty('--theme-clip-r', `${endR}px`);
    document.startViewTransition(() => apply(next, true));
  };

  if (btn) {
    btn.addEventListener('click', () => window.toggleThemeMode());
  }

  const onMqChange = (e) => {
    let stored = null;
    try { stored = localStorage.getItem(KEY); } catch (_) { }
    if (!stored) apply(e.matches ? 'light' : 'dark', false);
  };
  if (mq.addEventListener) mq.addEventListener('change', onMqChange);
  else if (mq.addListener) mq.addListener(onMqChange);
})();

// ── Realtime IST Clock ────────────────────────────────────────────────────
(() => {
  const els = document.querySelectorAll('[data-ist-clock]');
  if (!els.length) return;
  const fmt = (d) => {
    const ist = new Date(d.getTime() + (d.getTimezoneOffset() + 330) * 60000);
    const h = String(ist.getHours()).padStart(2, '0');
    const m = String(ist.getMinutes()).padStart(2, '0');
    return `${h}:${m}`;
  };
  const tick = () => {
    const t = fmt(new Date());
    els.forEach((el) => {
      const suffix = el.dataset.suffix ?? ' IST';
      el.innerHTML =
        `<span class="clock__br" aria-hidden="true">[</span>` +
        `<span class="clock__time" data-text="${t}">${t}</span>` +
        `<span class="clock__suffix">${suffix}</span>` +
        `<span class="clock__br" aria-hidden="true">]</span>`;
    });
  };
  tick();
  setInterval(tick, 30000);
})();

// ── Hero Subtitle Typewriter Engine (Dynamic LocalStorage Powered) ─────────
let globalTypewriterTick = null;
(() => {
  const target = document.querySelector('[data-typed-hero]');
  if (!target) return;

  const getRoles = () => {
    try {
      const stored = localStorage.getItem('portfolio_roles');
      if (stored) return JSON.parse(stored);
    } catch (_) {}
    return ['UG STUDENT', 'FULL-STACK DEVELOPER', 'GRAPHICS DESIGNER', 'CREATIVE BUILDER'];
  };

  let roles = getRoles();
  let roleIdx = 0;
  let charIdx = 0;
  let isDeleting = false;
  const TYPE_SPEED = 90;
  const DELETE_SPEED = 45;
  const PAUSE_TIME = 1600;
  let timerId = null;

  const tick = () => {
    roles = getRoles();
    if (!roles.length) return;
    const currentText = roles[roleIdx % roles.length];

    if (isDeleting) {
      charIdx--;
      target.textContent = currentText.substring(0, charIdx);
    } else {
      charIdx++;
      target.textContent = currentText.substring(0, charIdx);
    }

    let delay = isDeleting ? DELETE_SPEED : TYPE_SPEED;

    if (!isDeleting && charIdx === currentText.length) {
      delay = PAUSE_TIME;
      isDeleting = true;
    } else if (isDeleting && charIdx === 0) {
      isDeleting = false;
      roleIdx = (roleIdx + 1) % roles.length;
      delay = 350;
    }

    timerId = setTimeout(tick, delay);
  };

  tick();

  window.refreshTypewriterRoles = () => {
    clearTimeout(timerId);
    roleIdx = 0;
    charIdx = 0;
    isDeleting = false;
    tick();
  };
})();

// ── Hero Meta & CTA Fade In ───────────────────────────────────────────────
(() => {
  const reduced = reducedMotion();
  document.querySelectorAll('[data-fade-in]').forEach((el) => {
    if (reduced) {
      el.style.opacity = '1';
      el.style.transform = 'none';
      return;
    }
    const delay = el.dataset.delay || '0s';
    el.style.opacity = '0';
    el.style.transform = 'translateY(16px)';
    el.style.transition = `opacity 1s cubic-bezier(.2,.7,.2,1) ${delay}, transform 1s cubic-bezier(.2,.7,.2,1) ${delay}`;
    requestAnimationFrame(() => setTimeout(() => {
      el.style.opacity = '1';
      el.style.transform = 'translateY(0)';
    }, 120));
  });
})();

// ── Magnetic Buttons ──────────────────────────────────────────────────────
(() => {
  if (window.matchMedia('(pointer: coarse)').matches || reducedMotion()) return;
  const targets = [...document.querySelectorAll('[data-magnetic]')].map((el) => ({
    el,
    range: Number(el.dataset.range || 80),
    strength: Number(el.dataset.strength || 0.35),
  }));
  if (!targets.length) return;
  const onMove = (e) => {
    targets.forEach(({ el, range, strength }) => {
      const r = el.getBoundingClientRect();
      const cx = r.left + r.width / 2;
      const cy = r.top + r.height / 2;
      const dx = e.clientX - cx;
      const dy = e.clientY - cy;
      const dist = Math.hypot(dx, dy);
      if (dist < range + Math.max(r.width, r.height) / 2) {
        el.style.transform = `translate(${dx * strength}px, ${dy * strength}px)`;
      } else {
        el.style.transform = 'translate(0,0)';
      }
    });
  };
  const reset = () => targets.forEach(({ el }) => { el.style.transform = 'translate(0,0)'; });
  window.addEventListener('mousemove', onMove, { passive: true });
  document.addEventListener('mouseleave', reset);
})();

// ── Reveal on Scroll ──────────────────────────────────────────────────────
(() => {
  const els = document.querySelectorAll('[data-reveal]');
  const io = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add('in');
        io.unobserve(entry.target);
      }
    });
  }, { threshold: 0.18, rootMargin: '0px 0px -40px 0px' });
  els.forEach((el) => io.observe(el));
})();

// ── Scramble Decoders ─────────────────────────────────────────────────────
(() => {
  const els = document.querySelectorAll('[data-scramble]');
  if (!els.length || reducedMotion()) return;
  const GLYPHS = '#<>/[]{}=+*x10_';
  const DURATION = 900;
  const run = (el) => {
    const final = el.textContent;
    const start = performance.now();
    const step = (now) => {
      const p = Math.min(1, (now - start) / DURATION);
      const settled = Math.floor(p * final.length);
      let out = '';
      for (let i = 0; i < final.length; i++) {
        const ch = final[i];
        out += i < settled || !/[a-z0-9]/i.test(ch)
          ? ch
          : GLYPHS[(Math.random() * GLYPHS.length) | 0];
      }
      el.textContent = out;
      if (p < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  };
  const io = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        run(entry.target);
        io.unobserve(entry.target);
      }
    });
  }, { threshold: 0.6 });
  els.forEach((el) => io.observe(el));
})();

// ── Horizontal Work Rail Scroll ───────────────────────────────────────────
(() => {
  const rail = document.querySelector('[data-work-rail]');
  const track = document.querySelector('[data-work-track]');
  if (!rail || !track) return;

  let enabled = window.innerWidth > 760;
  let maxX = 0;
  window.measureWorkRail = () => { 
    maxX = Math.max(0, track.scrollWidth - window.innerWidth); 
  };
  const apply = () => {
    if (!enabled) {
      track.style.transform = '';
      return;
    }
    const r = rail.getBoundingClientRect();
    const total = rail.offsetHeight - window.innerHeight;
    if (total <= 0 || maxX <= 0) {
      track.style.transform = '';
      return;
    }
    const p = Math.min(1, Math.max(0, -r.top / total));
    track.style.transform = `translate3d(${-p * maxX}px, 0, 0)`;
  };
  window.measureWorkRail();

  let raf;
  const onScroll = () => {
    cancelAnimationFrame(raf);
    raf = requestAnimationFrame(apply);
  };
  const onResize = () => {
    enabled = window.innerWidth > 760;
    window.measureWorkRail();
    apply();
  };
  window.addEventListener('scroll', onScroll, { passive: true });
  window.addEventListener('resize', onResize);
  apply();
})();

// ── Flow Field Generative Hero Canvas ─────────────────────────────────────
(() => {
  const canvas = document.querySelector('[data-hero-canvas]');
  const hero = document.querySelector('.hero');
  if (!canvas || !hero) return;
  const ctx = canvas.getContext('2d');
  if (!ctx) return;

  let w = 0, h = 0;
  const resize = () => {
    const r = hero.getBoundingClientRect();
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    w = r.width;
    h = r.height;
    canvas.width = Math.round(w * dpr);
    canvas.height = Math.round(h * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  };
  resize();

  const COUNT = 160;
  const parts = [];
  const spawn = (p) => {
    p.x = Math.random() * w;
    p.y = Math.random() * h;
    p.px = p.x;
    p.py = p.y;
    p.sp = 18 + Math.random() * 26;
    p.isAccent = Math.random() < 0.45;
    p.a = 0.22 + Math.random() * 0.48;
    p.life = 3 + Math.random() * 6;
  };

  for (let i = 0; i < COUNT; i++) {
    const p = {};
    spawn(p);
    p.life *= Math.random();
    parts.push(p);
  }

  let mx = -9999, my = -9999;
  let targetMx = -9999, targetMy = -9999;

  window.addEventListener('mousemove', (e) => {
    const r = hero.getBoundingClientRect();
    if (e.clientY >= r.top && e.clientY <= r.bottom) {
      targetMx = e.clientX - r.left;
      targetMy = e.clientY - r.top;
    } else {
      targetMx = -9999;
      targetMy = -9999;
    }
  }, { passive: true });

  const field = (x, y, t) =>
    Math.sin(x * 0.0016 + t * 0.2) * 1.6 +
    Math.cos(y * 0.002 - t * 0.16) * 1.3;

  const step = (dt, t) => {
    mx += (targetMx - mx) * 0.18;
    my += (targetMy - my) * 0.18;

    const isLight = document.documentElement.dataset.theme === 'light';

    parts.forEach((p) => {
      const a = field(p.x, p.y, t);
      let vx = Math.cos(a) * p.sp;
      let vy = Math.sin(a) * p.sp;

      const dx = p.x - mx;
      const dy = p.y - my;
      const dist = Math.hypot(dx, dy);
      const RADIUS = 190;

      if (dist < RADIUS && dist > 0.1) {
        const force = (1 - dist / RADIUS) * 220;
        vx += (dx / dist) * force - (dy / dist) * (force * 0.8);
        vy += (dy / dist) * force + (dx / dist) * (force * 0.8);
      }

      p.px = p.x;
      p.py = p.y;
      p.x += vx * dt;
      p.y += vy * dt;
      p.life -= dt;

      if (p.life <= 0 || p.x < -20 || p.x > w + 20 || p.y < -20 || p.y > h + 20) {
        spawn(p);
        return;
      }

      if (isLight) {
        ctx.strokeStyle = p.isAccent
          ? `rgba(107, 143, 8, ${p.a * 0.75})`
          : `rgba(20, 22, 14, ${p.a * 0.28})`;
      } else {
        ctx.strokeStyle = p.isAccent
          ? `rgba(255, 230, 0, ${p.a})`
          : `rgba(237, 240, 227, ${p.a * 0.4})`;
      }

      ctx.lineWidth = 1.2;
      ctx.beginPath();
      ctx.moveTo(p.px, p.py);
      ctx.lineTo(p.x, p.y);
      ctx.stroke();
    });
  };

  let last = performance.now();
  const loop = (now) => {
    const dt = Math.min((now - last) / 1000, 0.05);
    last = now;

    ctx.globalCompositeOperation = 'destination-out';
    ctx.fillStyle = 'rgba(0, 0, 0, 0.06)';
    ctx.fillRect(0, 0, w, h);
    ctx.globalCompositeOperation = 'source-over';

    step(dt, now * 0.001);
    requestAnimationFrame(loop);
  };

  requestAnimationFrame(loop);
  window.addEventListener('resize', resize);

  new MutationObserver(() => {
    ctx.clearRect(0, 0, w, h);
  }).observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] });
})();

// ── Procedural Dynamic Cyber Art Generator (URL/Title Seeded) ──────────────
(() => {
  const NS = 'http://www.w3.org/2000/svg';
  const svg = (tag, attrs) => {
    const e = document.createElementNS(NS, tag);
    for (const k in attrs) e.setAttribute(k, attrs[k]);
    return e;
  };

  const hashString = (str) => {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      hash = (hash << 5) - hash + str.charCodeAt(i);
      hash |= 0;
    }
    return Math.abs(hash);
  };

  // Pattern 1: Concentric Orbital Gyro Rings
  const renderGyroArt = (container, seed) => {
    const s = svg('svg', { width: '200', height: '160', viewBox: '0 0 200 160', 'aria-hidden': 'true' });
    const rings = 4 + (seed % 3);
    for (let i = 1; i <= rings; i++) {
      const r = i * 16;
      s.appendChild(svg('circle', {
        cx: 100, cy: 80, r,
        fill: 'none',
        stroke: i % 2 === 0 ? 'var(--line-strong)' : 'var(--ink-mute)',
        'stroke-width': '1',
        'stroke-dasharray': `${(seed % 5) + 3} 4`
      }));
    }
    const nodes = 6 + (seed % 6);
    for (let i = 0; i < nodes; i++) {
      const angle = (i * 2 * Math.PI) / nodes;
      const x = 100 + Math.cos(angle) * 48;
      const y = 80 + Math.sin(angle) * 48;
      s.appendChild(svg('line', { x1: 100, y1: 80, x2: x, y2: y, stroke: 'var(--line)', 'stroke-width': '1' }));
      s.appendChild(svg('circle', { cx: x, cy: y, r: (i % 2 === 0 ? 3 : 2), fill: (i === 1 ? 'var(--highlight-color)' : 'var(--accent)') }));
    }
    container.innerHTML = '';
    container.appendChild(s);
  };

  // Pattern 2: Cyber Matrix Heatmap Grid
  const renderGridMatrixArt = (container, seed) => {
    const s = svg('svg', { width: '200', height: '160', viewBox: '0 0 200 160', 'aria-hidden': 'true' });
    const cols = 8;
    const rows = 6;
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        const x = 8 + c * 23;
        const y = 8 + r * 24;
        const cellVal = (seed + r * 7 + c * 13) % 19;
        let fill = 'none';
        let stroke = 'var(--line-strong)';
        let opacity = '1';

        if (cellVal === 2) {
          fill = 'var(--accent)';
          opacity = '0.85';
        } else if (cellVal === 5) {
          fill = 'var(--highlight-color)';
          opacity = '0.9';
        } else if (cellVal === 9) {
          fill = 'var(--ink)';
          opacity = '0.6';
        }

        s.appendChild(svg('rect', {
          x, y, width: '18', height: '18',
          rx: '3', fill, stroke,
          'stroke-width': '0.8',
          opacity
        }));
      }
    }
    container.innerHTML = '';
    container.appendChild(s);
  };

  // Pattern 3: Cyber Wave Spectrum
  const renderWaveArt = (container, seed) => {
    const s = svg('svg', { width: '200', height: '160', viewBox: '0 0 200 160', 'aria-hidden': 'true' });
    const bars = 18;
    for (let i = 0; i < bars; i++) {
      const x = 12 + i * 10;
      const h = 20 + Math.abs(Math.sin((seed + i) * 0.45) * 80);
      const y = 80 - h / 2;
      const isPeak = (i === (seed % bars));
      s.appendChild(svg('rect', {
        x, y, width: '4', height: h,
        rx: '2',
        fill: isPeak ? 'var(--highlight-color)' : (i % 3 === 0 ? 'var(--accent)' : 'var(--ink-mute)'),
        opacity: isPeak ? '1' : '0.5'
      }));
    }
    container.innerHTML = '';
    container.appendChild(s);
  };

  // Pattern 4: Constellation Node Network
  const renderNetworkArt = (container, seed) => {
    const s = svg('svg', { width: '200', height: '160', viewBox: '0 0 200 160', 'aria-hidden': 'true' });
    const pts = [];
    const count = 7 + (seed % 4);
    for (let i = 0; i < count; i++) {
      pts.push({
        x: 20 + ((seed * (i + 3) * 31) % 160),
        y: 20 + ((seed * (i + 7) * 47) % 120),
        r: (i === 0 ? 4.5 : 2.5)
      });
    }
    for (let i = 0; i < pts.length; i++) {
      for (let j = i + 1; j < pts.length; j++) {
        const d = Math.hypot(pts[i].x - pts[j].x, pts[i].y - pts[j].y);
        if (d < 75) {
          s.appendChild(svg('line', {
            x1: pts[i].x, y1: pts[i].y, x2: pts[j].x, y2: pts[j].y,
            stroke: 'var(--ink-mute)',
            'stroke-width': '0.7',
            opacity: '0.45'
          }));
        }
      }
    }
    pts.forEach((p, idx) => {
      s.appendChild(svg('circle', {
        cx: p.x, cy: p.y, r: p.r,
        fill: idx === 0 ? 'var(--highlight-color)' : (idx % 2 === 0 ? 'var(--accent)' : 'var(--ink-soft)')
      }));
    });
    container.innerHTML = '';
    container.appendChild(s);
  };

  window.autoGenerateCardArt = () => {
    document.querySelectorAll('.work-card').forEach((card) => {
      const artBox = card.querySelector('.work-card__art');
      if (!artBox || artBox.querySelector('.github-stats-widget')) return;

      const title = card.querySelector('.work-card__title')?.textContent || '';
      const link = card.querySelector('a[href]')?.getAttribute('href') || '';
      const seedKey = (title + link).trim() || 'default-project';
      const seed = hashString(seedKey);

      const patternType = seed % 4;
      if (patternType === 0) renderGyroArt(artBox, seed);
      else if (patternType === 1) renderGridMatrixArt(artBox, seed);
      else if (patternType === 2) renderWaveArt(artBox, seed);
      else renderNetworkArt(artBox, seed);
    });
  };

  window.autoGenerateCardArt();

  // Roadmap Blueprint Art
  const ga = document.querySelector('[data-graph-art]');
  if (ga) {
    const nodes = [
      { x: 30, y: 60, r: 5 }, { x: 70, y: 35, r: 4 },
      { x: 110, y: 80, r: 9, hub: true, label: 'c++' },
      { x: 160, y: 40, r: 5 }, { x: 200, y: 95, r: 6 },
      { x: 60, y: 130, r: 5 }, { x: 130, y: 160, r: 8, hub: true, label: 'dsa' },
      { x: 195, y: 145, r: 5 }, { x: 30, y: 175, r: 4 }, { x: 220, y: 195, r: 4 },
    ];
    const edges = [[0, 2], [1, 2], [2, 3], [2, 4], [3, 4], [2, 5], [5, 6], [6, 7], [4, 7], [0, 8], [6, 8], [4, 9], [7, 9], [6, 9]];
    const s = svg('svg', { viewBox: '0 0 250 220', width: '100%', 'aria-hidden': 'true' });
    edges.forEach(([a, b]) => {
      const na = nodes[a], nb = nodes[b];
      const hub = na.hub || nb.hub;
      s.appendChild(svg('line', {
        x1: na.x, y1: na.y, x2: nb.x, y2: nb.y,
        stroke: 'var(--ink-mute)',
        'stroke-opacity': hub ? '.55' : '.22',
        'stroke-width': '1',
      }));
    });
    nodes.forEach((n) => {
      const g = svg('g', {});
      g.appendChild(svg('circle', {
        cx: n.x, cy: n.y, r: n.r,
        fill: n.hub ? 'var(--accent)' : 'var(--bg-elev)',
        stroke: n.hub ? 'var(--accent)' : 'var(--ink-mute)',
        'stroke-width': '1',
      }));
      if (n.label) {
        const t = svg('text', {
          x: n.x, y: n.y + n.r + 14,
          'text-anchor': 'middle',
          'font-family': 'var(--font-mono)',
          'font-size': '8',
          fill: 'var(--ink-mute)',
          'letter-spacing': '.12em',
        });
        t.textContent = n.label.toUpperCase();
        g.appendChild(t);
      }
      s.appendChild(g);
    });
    ga.appendChild(s);
  }
})();

// ── Interactive Education / Skills / Milestones Tab Controller ────────────
(() => {
  const tabButtons = document.querySelectorAll('.edu-tab-btn');
  const tabPanes = document.querySelectorAll('.edu-tab-pane');
  if (!tabButtons.length || !tabPanes.length) return;

  tabButtons.forEach((btn) => {
    btn.addEventListener('click', () => {
      const targetSelector = btn.dataset.tabTarget;
      const targetPane = document.querySelector(targetSelector);
      if (!targetPane) return;

      tabButtons.forEach((b) => b.classList.remove('active'));
      tabPanes.forEach((p) => p.classList.remove('active'));

      btn.classList.add('active');
      targetPane.classList.add('active');

      if ('vibrate' in navigator) {
        try { navigator.vibrate(8); } catch (_) { }
      }
    });
  });
})();

// ── Bento Grid Animated DSA Counter ───────────────────────────────────────
(() => {
  const countEl = document.getElementById('bento-dsa-count');
  if (!countEl) return;

  const target = 120;
  let started = false;

  const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting && !started) {
        started = true;
        let current = 0;
        const stepTime = 12;
        const timer = setInterval(() => {
          current += 2;
          if (current >= target) {
            countEl.textContent = `${target}+`;
            clearInterval(timer);
          } else {
            countEl.textContent = `${current}+`;
          }
        }, stepTime);
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.4 });

  observer.observe(countEl);
})();

// ── Interactive Code Sandbox Runner ───────────────────────────────────────
(() => {
  const tabs = document.querySelectorAll('.sandbox-tab');
  const codeEl = document.getElementById('sandbox-code');
  const runBtn = document.querySelector('[data-sandbox-run]');
  const statusEl = document.getElementById('sandbox-status');
  const outputEl = document.getElementById('sandbox-output');

  if (!codeEl || !runBtn || !outputEl) return;

  const SNIPPETS = {
    cpp: {
      code: `// Fast I/O & Binary Search Template
#include <iostream>
#include <vector>
using namespace std;

int binarySearch(const vector<int>& arr, int target) {
    int left = 0, right = arr.size() - 1;
    while (left <= right) {
        int mid = left + (right - left) / 2;
        if (arr[mid] == target) return mid;
        if (arr[mid] < target) left = mid + 1;
        else right = mid - 1;
    }
    return -1;
}

int main() {
    vector<int> data = {2, 7, 11, 15, 24, 38, 56};
    int found = binarySearch(data, 24);
    cout << "Target 24 indexed at: " << found << endl;
    return 0;
}`,
      output: `[g++ -O3 -std=c++17 main.cpp -o main]
Target 24 indexed at: 4

Process exited with status 0 (0.018s, mem: 2.1MB)`
    },
    java: {
      code: `// Modular OOP System Simulation
import java.util.*;

class ProcessScheduler {
    private final PriorityQueue<Integer> pq = new PriorityQueue<>();

    public void enqueue(int task) { pq.offer(task); }
    public Integer dispatch() { return pq.poll(); }
}

public class Solution {
    public static void main(String[] args) {
        ProcessScheduler ps = new ProcessScheduler();
        ps.enqueue(40);
        ps.enqueue(10);
        ps.enqueue(25);
        System.out.println("Dispatched root priority: " + ps.dispatch());
    }
}`,
      output: `[javac Solution.java && java Solution]
Dispatched root priority: 10

JVM execution finalized (0.042s, thread_pool: 1)`
    },
    python: {
      code: `# Automation & Structured Data Parsing
import json

def summarize_telemetry(payload):
    data = json.loads(payload)
    active = [k for k, v in data.items() if v]
    return f"Active sub-modules: {', '.join(active)}"

feed = '{"dsa_stream": true, "web_audio": true, "telemetry_pill": true}'
print(summarize_telemetry(feed))`,
      output: `[python3 script.py]
Active sub-modules: dsa_stream, web_audio, telemetry_pill

Traceback free · Memory allocated: 840KB`
    }
  };

  let activeLang = 'cpp';

  tabs.forEach((tab) => {
    tab.addEventListener('click', () => {
      tabs.forEach((t) => t.classList.remove('active'));
      tab.classList.add('active');
      activeLang = tab.dataset.lang;
      codeEl.textContent = SNIPPETS[activeLang].code;
      outputEl.textContent = 'Ready to execute. Click "RUN CODE" to compile...';
      if (statusEl) {
        statusEl.textContent = 'IDLE';
        statusEl.style.color = 'var(--accent)';
      }
    });
  });

  runBtn.addEventListener('click', () => {
    if (statusEl) {
      statusEl.textContent = 'COMPILING...';
      statusEl.style.color = 'var(--highlight-color)';
    }
    outputEl.textContent = `Executing runtime container [${activeLang}]...`;

    setTimeout(() => {
      outputEl.textContent = SNIPPETS[activeLang].output;
      if (statusEl) {
        statusEl.textContent = 'SUCCESS (0)';
        statusEl.style.color = '#00ff88';
      }
    }, 420);
  });
})();

// ── Live Cyber Telemetry HUD Pill (FPS & Velocity Tracker) ────────────────
(() => {
  const fpsEl = document.querySelector('[data-telemetry-fps]');
  const velEl = document.querySelector('[data-telemetry-vel]');
  if (!fpsEl && !velEl) return;

  let lastFrameTime = performance.now();
  let frameCount = 0;
  let lastFpsUpdate = performance.now();

  let lastScrollY = window.scrollY;
  let lastScrollTime = performance.now();
  let currentVel = 0;

  const updateTelemetry = (now) => {
    frameCount++;
    if (now - lastFpsUpdate >= 500) {
      const fps = Math.round((frameCount * 1000) / (now - lastFpsUpdate));
      if (fpsEl) fpsEl.textContent = `${fps} FPS`;
      frameCount = 0;
      lastFpsUpdate = now;
    }

    const dt = Math.max((now - lastScrollTime) / 1000, 0.016);
    const dy = Math.abs(window.scrollY - lastScrollY);
    const instantVel = Math.round(dy / dt);
    currentVel = Math.round(currentVel * 0.8 + instantVel * 0.2);

    lastScrollY = window.scrollY;
    lastScrollTime = now;

    if (velEl) velEl.textContent = `${currentVel} PX/S`;

    requestAnimationFrame(updateTelemetry);
  };

  requestAnimationFrame(updateTelemetry);
})();

// ── Cmd + K Developer Command Palette (Spotlight Terminal) ────────────────
(() => {
  const backdrop = document.getElementById('cmdk-modal');
  const input = document.getElementById('cmdk-query');
  const list = document.getElementById('cmdk-list');
  const triggerBtn = document.querySelector('[data-cmdk-trigger]');
  if (!backdrop || !input || !list) return;

  let activeIndex = 0;

  const COMMANDS = [
    { title: 'Jump to Selected Work', category: 'Navigation', shortcut: 'G W', action: () => { location.hash = '#work'; } },
    { title: 'Jump to About & Education', category: 'Navigation', shortcut: 'G A', action: () => { location.hash = '#about'; } },
    { title: 'Jump to Practice Tracks', category: 'Navigation', shortcut: 'G P', action: () => { location.hash = '#experiments'; } },
    { title: 'Jump to Roadmap Blueprint', category: 'Navigation', shortcut: 'G R', action: () => { location.hash = '#roadmap'; } },
    { title: 'Say Hello / Contact', category: 'Navigation', shortcut: 'G C', action: () => { location.hash = '#contact'; } },
    { title: 'Toggle Light / Dark Theme', category: 'Preferences', shortcut: 'T', action: () => { if (window.toggleThemeMode) window.toggleThemeMode(); } },
    { title: 'Copy Email Address', category: 'Action', shortcut: 'C', action: () => { document.querySelector('[data-copy-email]')?.click(); } },
    { title: 'Trigger Matrix Rain Simulation', category: 'Terminal Easter Egg', shortcut: 'M', action: () => runMatrixRain() },
    { title: 'Open GitHub Profile', category: 'External', shortcut: '↗', action: () => window.open('https://github.com/max-subh', '_blank') },
  ];

  let filtered = [...COMMANDS];

  const renderItems = () => {
    list.innerHTML = '';
    if (!filtered.length) {
      list.innerHTML = `<div style="padding: 16px; text-align: center; color: var(--ink-mute); font-size: 13px;">No matching command found.</div>`;
      return;
    }

    filtered.forEach((cmd, idx) => {
      const item = document.createElement('div');
      item.className = `cmdk-item ${idx === activeIndex ? 'is-selected' : ''}`;
      item.innerHTML = `
        <div class="cmdk-item__left">
          <span>›</span>
          <b>${cmd.title}</b>
        </div>
        <span class="cmdk-item__shortcut">${cmd.shortcut}</span>
      `;
      item.addEventListener('click', () => {
        closePalette();
        cmd.action();
      });
      list.appendChild(item);
    });

    const selectedEl = list.children[activeIndex];
    if (selectedEl) selectedEl.scrollIntoView({ block: 'nearest' });
  };

  const openPalette = () => {
    backdrop.style.display = 'grid';
    backdrop.setAttribute('aria-hidden', 'false');
    input.value = '';
    filtered = [...COMMANDS];
    activeIndex = 0;
    renderItems();
    setTimeout(() => input.focus(), 20);
    document.body.style.overflow = 'hidden';
  };

  const closePalette = () => {
    backdrop.style.display = 'none';
    backdrop.setAttribute('aria-hidden', 'true');
    document.body.style.overflow = '';
  };

  if (triggerBtn) triggerBtn.addEventListener('click', openPalette);
  backdrop.addEventListener('click', (e) => {
    if (e.target === backdrop) closePalette();
  });

  input.addEventListener('input', () => {
    const q = input.value.trim().toLowerCase();
    filtered = COMMANDS.filter(c => c.title.toLowerCase().includes(q) || c.category.toLowerCase().includes(q));
    activeIndex = 0;
    renderItems();
  });

  input.addEventListener('keydown', (e) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      if (filtered.length) activeIndex = (activeIndex + 1) % filtered.length;
      renderItems();
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      if (filtered.length) activeIndex = (activeIndex - 1 + filtered.length) % filtered.length;
      renderItems();
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (filtered[activeIndex]) {
        closePalette();
        filtered[activeIndex].action();
      }
    } else if (e.key === 'Escape') {
      closePalette();
    }
  });

  window.addEventListener('keydown', (e) => {
    if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
      e.preventDefault();
      if (backdrop.style.display === 'grid') closePalette();
      else openPalette();
    }
  });

  const runMatrixRain = () => {
    const c = document.createElement('canvas');
    c.id = 'matrix-canvas';
    c.style.cssText = 'position: fixed; inset: 0; z-index: 99999; pointer-events: none; opacity: 0.92;';
    document.body.appendChild(c);
    const ctx = c.getContext('2d');
    let cw = c.width = window.innerWidth;
    let ch = c.height = window.innerHeight;
    const chars = '01SUBHAMSHITJAVA+C++PYTHONDSAMEDINIPUR#@$%&*';
    const fontSize = 14;
    const cols = Math.floor(cw / fontSize);
    const drops = Array(cols).fill(1);

    let rafId;
    const draw = () => {
      ctx.fillStyle = 'rgba(10, 11, 9, 0.08)';
      ctx.fillRect(0, 0, cw, ch);
      ctx.fillStyle = '#00ff88';
      ctx.font = `${fontSize}px monospace`;
      for (let i = 0; i < drops.length; i++) {
        const text = chars.charAt(Math.floor(Math.random() * chars.length));
        ctx.fillText(text, i * fontSize, drops[i] * fontSize);
        if (drops[i] * fontSize > ch && Math.random() > 0.975) drops[i] = 0;
        drops[i]++;
      }
      rafId = requestAnimationFrame(draw);
    };
    rafId = requestAnimationFrame(draw);

    const onExit = (e) => {
      if (e.key === 'Escape' || e.type === 'click') {
        cancelAnimationFrame(rafId);
        c.remove();
        window.removeEventListener('keydown', onExit);
        window.removeEventListener('click', onExit);
      }
    };
    window.addEventListener('keydown', onExit);
    window.addEventListener('click', onExit);
  };
})();

// ── Case Study Data ────────────────────────────────────────────────────────
const CASES = {
  portfolio: {
    tag: 'Personal Website · 2026',
    title: 'Personal Portfolio & Editorial Interface',
    lede: 'An editorial dark aesthetic portfolio with spring-driven cursor, flow-field hero particles, dynamic themes, and modal case study overlays.',
    problem: [
      'Standard template portfolios often look static and lack personality. I wanted to design an experience that demonstrates my interest in computer science, software design patterns, and fluid animations using vanilla code.',
    ],
    approach: [
      'Engineered semi-implicit Euler spring physics to calculate 3D card tilt and hover parallax.',
      'Constructed custom particle physics with real-time vector field math and mouse repulsion on HTML5 Canvas.',
      'Implemented View Transitions API for seamless circular clip-path theme shifts.',
      'Ensured semantic accessibility and complete fallback support for reduced motion preferences.',
    ],
    stack: ['HTML5', 'Modern CSS', 'Vanilla JavaScript', 'Vercel'],
    live: 'https://subh-4uq2.vercel.app/',
  },
  birthday: {
    tag: 'Web Experience · 2026',
    title: 'Celebration Web Experience',
    lede: 'A personal interactive celebration page featuring dynamic countdowns, heartfelt reveals, photo albums, and confetti animations.',
    problem: [
      'Creating an expressive, memorable digital greeting page that feels personal, smooth on mobile devices, and fast across all network conditions.',
    ],
    approach: [
      'Componentized interactive modules using React and TypeScript.',
      'Added smooth entry states, countdown timers, and particle confetti physics.',
      'Optimized media delivery and deployed with global edge caching on Vercel.',
    ],
    stack: ['React', 'TypeScript', 'Tailwind CSS', 'Vercel'],
    live: 'https://happy-birthdaytripti.vercel.app/',
  },
  github: {
    tag: 'Open Source · GitHub',
    title: 'Algorithms & Utilities Repositories',
    lede: 'Structured code repositories covering core data structures, algorithms practice in C/C++, object-oriented simulations in Java, and Python tools.',
    problem: [
      'Reinforcing computer science principles through hands-on implementation and structured Git version control.',
    ],
    approach: [
      'Documented daily code exercises covering arrays, pointers, linked lists, and trees.',
      'Practiced modular class architecture and collection implementations in Java.',
      'Authored utility automation scripts in Python.',
    ],
    stack: ['C', 'C++', 'Java', 'Python', 'Git'],
    live: 'https://github.com/max-subh',
  },
  roadmap: {
    tag: 'Learning Map · 2026',
    title: 'Data Structures & Algorithms Blueprint',
    lede: 'Focusing on core algorithmic discipline, time/space complexity analysis, and writing robust problem-solving programs.',
    problem: [
      'Frameworks come and go, but strong knowledge of memory, pointers, and algorithmic structures remains foundational for any high-performing software engineer.',
    ],
    approach: [
      'Daily implementation of core data structures from scratch in C++ and Java.',
      'Complexity analysis with focus on O(n) space and time benchmarks.',
      'Solving algorithmic problems consistently to sharpen debugging skills.',
    ],
    stack: ['Data Structures', 'Algorithms', 'C++', 'Java', 'Problem Solving'],
  },
};
const CASE_ORDER = ['portfolio', 'birthday', 'github'];

// ── Case Study Modal System ───────────────────────────────────────────────
(() => {
  const mount = document.querySelector('[data-case-mount]');
  if (!mount) return;
  let activeId = null;
  let lastTrigger = null;

  const closeModal = () => {
    activeId = null;
    mount.innerHTML = '';
    document.body.style.overflow = '';
    window.removeEventListener('keydown', onKey);
    if (lastTrigger && typeof lastTrigger.focus === 'function') lastTrigger.focus();
    lastTrigger = null;
  };

  const onKey = (e) => {
    if (!activeId) return;
    if (e.key === 'Escape') { closeModal(); return; }
    if (CASE_ORDER.includes(activeId)) {
      const idx = CASE_ORDER.indexOf(activeId);
      if (e.key === 'ArrowRight') open(CASE_ORDER[(idx + 1) % CASE_ORDER.length]);
      if (e.key === 'ArrowLeft') open(CASE_ORDER[(idx - 1 + CASE_ORDER.length) % CASE_ORDER.length]);
    }
  };

  const render = (id) => {
    const c = CASES[id];
    if (!c) return '';
    const isWork = CASE_ORDER.includes(id);
    const idx = isWork ? CASE_ORDER.indexOf(id) : -1;
    const nextId = isWork ? CASE_ORDER[(idx + 1) % CASE_ORDER.length] : null;
    const problem = c.problem.map((p) => `<p>${p}</p>`).join('');
    const approach = c.approach.map((a) => `<li>${a}</li>`).join('');
    const chips = c.stack.map((s) => `<span>${s}</span>`).join('');
    const liveBtn = c.live ? `
      <a class="case__live" href="${c.live}" target="_blank" rel="noreferrer">
        Visit project
        <svg width="11" height="11" viewBox="0 0 12 12" fill="none"><path d="M1 11L11 1H4M11 1V8" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round"/></svg>
      </a>` : '';
    const nextBtn = isWork && nextId ? `
      <button class="case__next-cta" data-open-case="${nextId}">
        Next project · ${CASES[nextId].title}
        <svg width="13" height="11" viewBox="0 0 14 12" fill="none"><path d="M1 6H13M13 6L8 1M13 6L8 11" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round"/></svg>
      </button>` : '';

    return `
      <div class="case-overlay" data-overlay role="dialog" aria-modal="true">
        <article class="case" data-case tabindex="-1">
          <header class="case__head">
            <button class="case__close" data-close aria-label="Close case study">
              <svg width="11" height="11" viewBox="0 0 12 12" fill="none"><path d="M11 1L1 11M1 1L11 11" stroke="currentColor" stroke-width="1.4" stroke-linecap="round"/></svg>
              <span>Close</span>
            </button>
            <span class="case__count">${isWork ? `${String(idx + 1).padStart(2, '0')} / ${String(CASE_ORDER.length).padStart(2, '0')}` : 'Overview'}</span>
          </header>
          <div class="case__scroll">
            <section class="case__hero">
              <div class="case__meta">${c.tag}</div>
              <h1 class="case__title">${c.title}</h1>
              <p class="case__lede">${c.lede}</p>
            </section>
            <section class="case__split">
              <span class="case__num">01 / Concept</span>
              <div class="case__copy">${problem}</div>
            </section>
            <section class="case__split">
              <span class="case__num">02 / Implementation</span>
              <ul class="case__list">${approach}</ul>
            </section>
            <section class="case__split">
              <span class="case__num">03 / Technologies</span>
              <div class="case__chips">${chips}</div>
            </section>
            <footer class="case__foot">${liveBtn}${nextBtn}</footer>
          </div>
        </article>
      </div>`;
  };

  const open = (id) => {
    if (!CASES[id]) return;
    const isFirstOpen = !activeId;
    activeId = id;
    mount.innerHTML = render(id);
    document.body.style.overflow = 'hidden';
    if (isFirstOpen) window.addEventListener('keydown', onKey);

    const overlay = mount.querySelector('[data-overlay]');
    overlay.addEventListener('click', (e) => { if (e.target === overlay) closeModal(); });
    mount.querySelector('[data-close]').addEventListener('click', closeModal);
    mount.querySelectorAll('[data-open-case]').forEach((b) => {
      b.addEventListener('click', () => open(b.dataset.openCase));
    });
  };

  document.querySelectorAll('[data-open-case]').forEach((b) => {
    b.addEventListener('click', (e) => {
      e.preventDefault();
      lastTrigger = b;
      open(b.dataset.openCase);
    });
  });
})();

// ── Copy Email ────────────────────────────────────────────────────────────
(() => {
  const btn = document.querySelector('[data-copy-email]');
  if (!btn) return;
  const email = 'subhamshit136@gmail.com';
  const orig = btn.textContent;
  btn.addEventListener('click', async (e) => {
    e.preventDefault();
    try {
      await navigator.clipboard.writeText(email);
      btn.textContent = '✓ Copied';
    } catch (_) {
      btn.textContent = 'subhamshit136@gmail.com';
    }
    setTimeout(() => { btn.textContent = orig; }, 2000);
  });
})();

// ── Scrub Rail Progress Tracker ───────────────────────────────────────────
(() => {
  const root = document.querySelector('[data-scrub]');
  if (!root) return;
  const track = root.querySelector('[data-scrub-track]');
  const fill = root.querySelector('[data-scrub-fill]');
  const pip = root.querySelector('[data-scrub-pip]');
  const readout = root.querySelector('[data-scrub-readout]');
  const topBtn = root.querySelector('[data-scrub-top]');

  const update = () => {
    const scrollable = document.documentElement.scrollHeight - window.innerHeight;
    const p = scrollable > 0 ? Math.min(1, Math.max(0, window.scrollY / scrollable)) : 0;
    const pct = Math.round(p * 100);
    if (fill) fill.style.height = `${(p * 100).toFixed(2)}%`;
    if (pip) pip.style.top = `${(p * 100).toFixed(2)}%`;
    if (readout) readout.textContent = `${pct}%`;
    if (track) track.setAttribute('aria-valuenow', String(pct));
    root.classList.toggle('is-visible', window.scrollY > 240);
  };

  window.addEventListener('scroll', update, { passive: true });
  window.addEventListener('resize', update, { passive: true });
  update();

  const jumpTo = (clientY) => {
    const r = track.getBoundingClientRect();
    const ratio = Math.min(1, Math.max(0, (clientY - r.top) / r.height));
    const scrollable = document.documentElement.scrollHeight - window.innerHeight;
    window.scrollTo({
      top: ratio * scrollable,
      behavior: reducedMotion() ? 'auto' : 'smooth',
    });
  };

  if (track) track.addEventListener('click', (e) => jumpTo(e.clientY));
  if (topBtn) {
    topBtn.addEventListener('click', () => {
      window.scrollTo({ top: 0, behavior: reducedMotion() ? 'auto' : 'smooth' });
    });
  }
})();

// ── Velocity-Stretching Ring Cursor ───────────────────────────────────────
(() => {
  if (window.matchMedia('(pointer: coarse)').matches || reducedMotion()) return;
  const dot = document.querySelector('[data-cursor-dot]');
  const ring = document.querySelector('[data-cursor-ring]');
  const label = document.querySelector('[data-cursor-label]');
  if (!dot || !ring || !label) return;

  const LABEL_MAP = [
    { sel: '[data-scrub-top]', label: 'Top' },
    { sel: '[data-copy-email]', label: 'Copy' },
    { sel: '.case__close, [data-close]', label: 'Close' },
    { sel: '[data-open-case]', label: 'View' },
    { sel: 'a[target="_blank"]', label: 'Visit' },
    { sel: '.nav__link, a[href^="#"]', label: 'Jump' },
    { sel: '.work-card', label: 'Open' },
    { sel: '.cta--primary', label: 'Explore' },
    { sel: '.cta', label: 'Open' },
    { sel: 'button', label: 'Click' },
    { sel: 'a', label: 'Open' },
  ];

  let tx = window.innerWidth / 2, ty = window.innerHeight / 2;
  let dx = tx, dy = ty, rx = tx, ry = ty, lastX = tx, lastY = ty;
  let smoothSpeed = 0, smoothAngle = 0, activated = false, currentHit = null;

  const lerp = (a, b, n) => (1 - n) * a + n * b;

  const matchTarget = (el) => {
    if (!el || !el.closest) return null;
    for (const entry of LABEL_MAP) {
      const hit = el.closest(entry.sel);
      if (hit) return { hit, label: entry.label };
    }
    return null;
  };

  const applyHover = (found) => {
    if (found && found.hit === currentHit) return;
    currentHit = found ? found.hit : null;
    if (found) {
      label.textContent = found.label;
      ring.classList.add('is-hover');
      dot.classList.add('is-hover');
    } else {
      ring.classList.remove('is-hover');
      dot.classList.remove('is-hover');
    }
  };

  window.addEventListener('mousemove', (e) => {
    tx = e.clientX; ty = e.clientY;
    if (!activated) {
      activated = true;
      document.documentElement.classList.add('is-cursor-active');
    }
    applyHover(matchTarget(e.target));
  }, { passive: true });

  window.addEventListener('mousedown', () => {
    ring.classList.remove('is-click');
    void ring.offsetWidth;
    ring.classList.add('is-click');
    setTimeout(() => ring.classList.remove('is-click'), 600);
  });

  const tick = () => {
    dx = lerp(dx, tx, 0.55);
    dy = lerp(dy, ty, 0.55);
    rx = lerp(rx, tx, 0.18);
    ry = lerp(ry, ty, 0.18);

    const vx = tx - lastX, vy = ty - lastY;
    lastX = tx; lastY = ty;
    const speed = Math.min(Math.hypot(vx, vy), 80);
    smoothSpeed = lerp(smoothSpeed, speed, 0.18);
    if (smoothSpeed > 2) {
      smoothAngle = lerp(smoothAngle, Math.atan2(vy, vx) * 180 / Math.PI, 0.22);
    }

    const isHover = currentHit !== null;
    const stretch = isHover ? 1 : 1 + Math.min(smoothSpeed / 220, 0.32);
    const squash = isHover ? 1 : 1 / stretch;
    const angle = isHover ? 0 : smoothAngle;

    dot.style.transform = `translate3d(${dx}px, ${dy}px, 0) translate(-50%, -50%)`;
    ring.style.transform = `translate3d(${rx}px, ${ry}px, 0) translate(-50%, -50%) rotate(${angle}deg) scale(${stretch}, ${squash})`;

    requestAnimationFrame(tick);
  };
  requestAnimationFrame(tick);
})();

// ── Physics Layer: 3D Spring Tilt & Parallax ──────────────────────────────
(() => {
  if (window.matchMedia('(pointer: coarse)').matches || reducedMotion()) return;

  const consumers = [];
  let last = performance.now();
  const tick = (now) => {
    const dt = Math.min((now - last) / 1000, 0.05);
    last = now;
    for (const fn of consumers) fn(dt);
    requestAnimationFrame(tick);
  };
  requestAnimationFrame(tick);

  document.querySelectorAll('.work-card, .edu-card, .bento-card').forEach((card) => {
    const rxS = spring(0, { stiffness: 140, damping: 18 });
    const ryS = spring(0, { stiffness: 140, damping: 18 });
    const tzS = spring(0, { stiffness: 200, damping: 22 });
    const liftS = spring(0, { stiffness: 220, damping: 24 });

    card.classList.add('js-physics');
    card.style.transformStyle = 'preserve-3d';
    card.style.willChange = 'transform';

    card.addEventListener('mouseenter', () => {
      liftS.set(-6);
      tzS.set(10);
    });
    card.addEventListener('mousemove', (e) => {
      const r = card.getBoundingClientRect();
      const px = (e.clientX - r.left) / r.width;
      const py = (e.clientY - r.top) / r.height;
      ryS.set((px - 0.5) * 12);
      rxS.set(-(py - 0.5) * 12);
    });
    card.addEventListener('mouseleave', () => {
      rxS.set(0); ryS.set(0); tzS.set(0); liftS.set(0);
    });

    consumers.push((dt) => {
      const a = rxS.step(dt);
      const b = ryS.step(dt);
      const tz = tzS.step(dt);
      const lift = liftS.step(dt);
      card.style.transform = `perspective(1100px) translate3d(0, ${lift.toFixed(2)}px, 0) rotateX(${a.toFixed(2)}deg) rotateY(${b.toFixed(2)}deg) translateZ(${tz.toFixed(2)}px)`;
    });
  });
})();

// ── Card Cursor Spotlight ─────────────────────────────────────────────────
(() => {
  if (window.matchMedia('(pointer: coarse)').matches) return;
  document.querySelectorAll('.work-card, .exp-card, .edu-card, .ai-feature, .bento-card').forEach((card) => {
    card.addEventListener('pointermove', (e) => {
      const r = card.getBoundingClientRect();
      card.style.setProperty('--mx', `${e.clientX - r.left}px`);
      card.style.setProperty('--my', `${e.clientY - r.top}px`);
    });
  });
})();

// ── Admin Console Controller (Projects, Typewriter & Meta Status) ──────────
(() => {
  const SECRET_KEY = 'subham24';
  const urlParams = new URLSearchParams(window.location.search);
  const showAdmin = urlParams.get('admin') === SECRET_KEY;

  const trigger = document.getElementById('admin-trigger');
  const modal = document.getElementById('admin-modal');
  const openBtn = document.getElementById('admin-open-btn');
  const closeBtn = document.getElementById('admin-close-btn');
  const track = document.querySelector('[data-work-track]');
  const statusEl = document.querySelector('.hero__status');

  const savedStatus = localStorage.getItem('portfolio_meta_status');
  if (savedStatus && statusEl) {
    statusEl.innerHTML = `<i aria-hidden="true"></i>${savedStatus}`;
  }

  if (showAdmin && trigger) {
    trigger.style.display = 'block';
  }

  if (openBtn && modal) {
    openBtn.addEventListener('click', () => {
      modal.style.display = 'grid';
      renderRolesList();
      renderCustomProjects();
      const statusInput = document.getElementById('adm-status-input');
      if (statusInput && statusEl) {
        statusInput.value = statusEl.textContent.trim();
      }
    });
  }

  if (closeBtn && modal) {
    closeBtn.addEventListener('click', () => { modal.style.display = 'none'; });
  }

  const tabBtns = document.querySelectorAll('.admin-tab-btn');
  const panes = document.querySelectorAll('.admin-pane');
  tabBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      tabBtns.forEach(b => {
        b.style.background = 'transparent';
        b.style.color = 'var(--ink-mute)';
        b.style.border = '1px solid var(--line)';
      });
      panes.forEach(p => p.style.display = 'none');

      btn.style.background = 'var(--accent)';
      btn.style.color = 'var(--ink-on-accent)';
      btn.style.border = 'none';

      const target = document.querySelector(btn.dataset.admTarget);
      if (target) target.style.display = 'block';
    });
  });

  const rolesContainer = document.getElementById('adm-roles-list');
  const addRoleBtn = document.getElementById('adm-add-role-btn');
  const newRoleInput = document.getElementById('adm-new-role-input');

  const getRoles = () => {
    try {
      const stored = localStorage.getItem('portfolio_roles');
      if (stored) return JSON.parse(stored);
    } catch (_) {}
    return ['UG STUDENT', 'FULL-STACK DEVELOPER', 'GRAPHICS DESIGNER', 'CREATIVE BUILDER'];
  };

  const renderRolesList = () => {
    if (!rolesContainer) return;
    const roles = getRoles();
    rolesContainer.innerHTML = '';
    roles.forEach((r, idx) => {
      const item = document.createElement('div');
      item.style.cssText = 'display: flex; justify-content: space-between; align-items: center; background: var(--bg); padding: 8px 12px; border-radius: 6px; border: 1px solid var(--line); font-size: 12px; font-family: var(--font-mono);';
      item.innerHTML = `
        <span>${r}</span>
        <button type="button" data-del-role="${idx}" style="color: #ff4757; cursor: pointer; border: none; background: none; font-size: 14px;">✕</button>
      `;
      rolesContainer.appendChild(item);
    });

    rolesContainer.querySelectorAll('[data-del-role]').forEach(b => {
      b.addEventListener('click', () => {
        const i = Number(b.dataset.delRole);
        const current = getRoles();
        current.splice(i, 1);
        localStorage.setItem('portfolio_roles', JSON.stringify(current));
        renderRolesList();
        if (window.refreshTypewriterRoles) window.refreshTypewriterRoles();
      });
    });
  };

  if (addRoleBtn && newRoleInput) {
    addRoleBtn.addEventListener('click', () => {
      const val = newRoleInput.value.trim().toUpperCase();
      if (!val) return;
      const current = getRoles();
      current.push(val);
      localStorage.setItem('portfolio_roles', JSON.stringify(current));
      newRoleInput.value = '';
      renderRolesList();
      if (window.refreshTypewriterRoles) window.refreshTypewriterRoles();
    });
  }

  const saveStatusBtn = document.getElementById('adm-save-status-btn');
  const statusInput = document.getElementById('adm-status-input');
  if (saveStatusBtn && statusInput) {
    saveStatusBtn.addEventListener('click', () => {
      const val = statusInput.value.trim();
      if (!val) return;
      localStorage.setItem('portfolio_meta_status', val);
      if (statusEl) statusEl.innerHTML = `<i aria-hidden="true"></i>${val}`;
      alert('Status text updated!');
    });
  }

  const form = document.getElementById('admin-project-form');
  const manageProjectsContainer = document.getElementById('adm-custom-proj-list');

  const createCardElement = (proj, num) => {
    const article = document.createElement('article');
    article.className = 'work-card js-physics custom-dyn-card';
    article.innerHTML = `
      <div class="work-card__hit">
        <div class="work-card__head">
          <span>Project</span>
          <span class="work-card__num">${String(num).padStart(2, '0')}</span>
        </div>
        <div class="work-card__art"></div>
        <div class="work-card__body">
          <h3 class="work-card__title">${proj.title}</h3>
          <p class="work-card__blurb">${proj.desc}</p>
          <div class="work-card__tags">
            ${proj.tags.map(t => `<span>${t.trim()}</span>`).join('')}
          </div>
        </div>
      </div>
      <div class="work-card__foot">
        ${proj.live ? `<a class="work-card__action work-card__action--primary" href="${proj.live}" target="_blank" rel="noreferrer">Visit Live ↗</a>` : ''}
        ${proj.github ? `<a class="work-card__action" href="${proj.github}" target="_blank" rel="noreferrer">GitHub ↗</a>` : ''}
      </div>
    `;
    return article;
  };

  const loadCustomProjects = () => {
    if (!track) return;
    document.querySelectorAll('.custom-dyn-card').forEach(el => el.remove());
    const saved = JSON.parse(localStorage.getItem('custom_projects') || '[]');
    saved.forEach((proj, idx) => {
      const card = createCardElement(proj, idx + 4);
      track.appendChild(card);
    });

    if (window.autoGenerateCardArt) window.autoGenerateCardArt();
  };

  const renderCustomProjects = () => {
    if (!manageProjectsContainer) return;
    const saved = JSON.parse(localStorage.getItem('custom_projects') || '[]');
    manageProjectsContainer.innerHTML = '';
    if (!saved.length) {
      manageProjectsContainer.innerHTML = '<span style="color: var(--ink-mute); font-size: 12px;">No custom projects added yet.</span>';
      return;
    }
    saved.forEach((p, idx) => {
      const item = document.createElement('div');
      item.style.cssText = 'display: flex; justify-content: space-between; align-items: center; background: var(--bg); padding: 10px 14px; border-radius: 6px; border: 1px solid var(--line); font-size: 12px;';
      item.innerHTML = `
        <div>
          <b>${p.title}</b>
          <div style="color: var(--ink-mute); font-size: 11px;">${p.tags.join(', ')}</div>
        </div>
        <button type="button" data-del-proj="${idx}" style="color: #ff4757; cursor: pointer; border: none; background: none; font-size: 13px; font-weight: bold;">Delete</button>
      `;
      manageProjectsContainer.appendChild(item);
    });

    manageProjectsContainer.querySelectorAll('[data-del-proj]').forEach(b => {
      b.addEventListener('click', () => {
        const i = Number(b.dataset.delProj);
        const current = JSON.parse(localStorage.getItem('custom_projects') || '[]');
        current.splice(i, 1);
        localStorage.setItem('custom_projects', JSON.stringify(current));
        renderCustomProjects();
        loadCustomProjects();
      });
    });
  };

  if (form) {
    form.addEventListener('submit', (e) => {
      e.preventDefault();
      const tagsInput = document.getElementById('proj-tags').value;
      const newProj = {
        title: document.getElementById('proj-title').value,
        desc: document.getElementById('proj-desc').value,
        tags: tagsInput ? tagsInput.split(',') : ['Web'],
        live: document.getElementById('proj-live').value,
        github: document.getElementById('proj-github').value,
      };

      const existing = JSON.parse(localStorage.getItem('custom_projects') || '[]');
      existing.push(newProj);
      localStorage.setItem('custom_projects', JSON.stringify(existing));

      loadCustomProjects();
      renderCustomProjects();
      form.reset();
      alert('Project saved successfully!');
    });
  }

  loadCustomProjects();
})();

// ── Feature 5: Web Audio API Procedural UI Sound Engine ───────────────────
(() => {
  let audioCtx = null;
  let soundEnabled = localStorage.getItem('sound_enabled') === 'true';

  const soundBtn = document.querySelector('[data-sound-toggle]');
  const iconOn = soundBtn?.querySelector('.sound-icon-on');
  const iconOff = soundBtn?.querySelector('.sound-icon-off');

  const updateIcons = () => {
    if (!iconOn || !iconOff) return;
    iconOn.style.display = soundEnabled ? 'block' : 'none';
    iconOff.style.display = soundEnabled ? 'none' : 'block';
  };
  updateIcons();

  const initAudio = () => {
    if (!audioCtx) {
      audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    }
  };

  const playTone = (freq, type, duration, gainLevel) => {
    if (!soundEnabled || !audioCtx) return;
    try {
      if (audioCtx.state === 'suspended') audioCtx.resume();
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();

      osc.type = type;
      osc.frequency.setValueAtTime(freq, audioCtx.currentTime);
      gain.gain.setValueAtTime(gainLevel, audioCtx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.0001, audioCtx.currentTime + duration);

      osc.connect(gain);
      gain.connect(audioCtx.destination);

      osc.start();
      osc.stop(audioCtx.currentTime + duration);
    } catch (_) { }
  };

  const playClick = () => playTone(800, 'sine', 0.04, 0.03);
  const playHover = () => playTone(300, 'triangle', 0.03, 0.008);
  const playTheme = () => playTone(520, 'sine', 0.08, 0.04);

  if (soundBtn) {
    soundBtn.addEventListener('click', () => {
      initAudio();
      soundEnabled = !soundEnabled;
      localStorage.setItem('sound_enabled', String(soundEnabled));
      updateIcons();
      if (soundEnabled) playClick();
    });
  }

  window.addEventListener('pointerdown', (e) => {
    if (!audioCtx) initAudio();
    if (e.target.closest('a, button, [data-open-case], .edu-tab-btn, .cmdk-item, .sandbox-tab, .sandbox-run-btn')) {
      playClick();
    }
  });

  document.querySelectorAll('a, button, .work-card, .exp-card, .edu-card, .edu-tab-btn, .bento-card, .cmdk-item, .sandbox-tab, .sandbox-run-btn').forEach((el) => {
    el.addEventListener('pointerenter', () => {
      if (audioCtx) playHover();
    });
  });

  document.querySelector('[data-theme-toggle]')?.addEventListener('click', playTheme);
})();

// ── Feature 2: Realtime GitHub Telemetry API Fetcher ───────────────────────
(() => {
  const USERNAME = 'max-subh';
  const repoCountEl = document.getElementById('gh-repos');
  const followersEl = document.getElementById('gh-followers');
  const latestEl = document.getElementById('gh-latest');
  const statusEl = document.getElementById('gh-status');

  if (!repoCountEl) return;

  async function fetchGitHubStats() {
    try {
      const userRes = await fetch(`https://api.github.com/users/${USERNAME}`);
      if (!userRes.ok) throw new Error('API Rate limit or not found');
      const userData = await userRes.json();

      repoCountEl.textContent = userData.public_repos || '0';
      followersEl.textContent = userData.followers || '0';

      const reposRes = await fetch(`https://api.github.com/users/${USERNAME}/repos?sort=updated&per_page=1`);
      if (reposRes.ok) {
        const reposData = await reposRes.json();
        if (reposData.length > 0) {
          latestEl.innerHTML = `Latest commit: <a href="${reposData[0].html_url}" target="_blank" style="color: var(--accent); text-decoration: underline;">${reposData[0].name}</a>`;
        }
      }

      if (statusEl) {
        statusEl.textContent = 'ONLINE';
        statusEl.style.color = 'var(--accent)';
      }
    } catch (_) {
      if (statusEl) statusEl.textContent = 'CACHED';
      repoCountEl.textContent = '3+';
      followersEl.textContent = 'Active';
      latestEl.textContent = 'Repositories available on GitHub profile';
    }
  }

  fetchGitHubStats();
})();

// ── Smooth Velocity-Based Haptic Scroll Ticks ──────────────────────────────
(() => {
  if (!('vibrate' in navigator)) return;

  let lastY = window.scrollY;
  let accumulated = 0;
  let isTicking = false;
  let lastVibeTime = 0;

  const DISTANCE_THRESHOLD = 180;
  const MIN_INTERVAL_MS = 60;
  const PULSE_DURATION = 4;

  const smoothTick = () => {
    const currentY = window.scrollY;
    const delta = Math.abs(currentY - lastY);
    lastY = currentY;
    accumulated += delta;

    const now = performance.now();
    if (accumulated >= DISTANCE_THRESHOLD) {
      if (now - lastVibeTime >= MIN_INTERVAL_MS) {
        try {
          navigator.vibrate(PULSE_DURATION);
          lastVibeTime = now;
        } catch (_) { }
      }
      accumulated = 0;
    }

    isTicking = false;
  };

  window.addEventListener('scroll', () => {
    if (!isTicking) {
      requestAnimationFrame(smoothTick);
      isTicking = true;
    }
  }, { passive: true });

  const sectionSnapObserver = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        try {
          navigator.vibrate([6, 30, 4]);
        } catch (_) { }
      }
    });
  }, { threshold: 0.35 });

  document.querySelectorAll('section, .work-card, .bento-card').forEach((el) => {
    sectionSnapObserver.observe(el);
  });
})();

// ── Codrops Clip-Path Polygon Multi-Image Glitch Deck Engine (Single Active Engine) ──
(() => {
  const deck = document.querySelector('[data-glitch-deck]');
  const layers = document.querySelectorAll('.glitch-layer-img');
  const tagCounter = document.querySelector('[data-hud-photo-counter]');

  if (!deck || !layers.length) return;

  // Yahan aap apni images ka path customize kar sakte hain
  const IMAGES = [
    'images/profile1.jpg',
    'images/profile2.jpg',
    'images/profile3.jpg',
    'images/profile4.png'
  ];

  let currentIndex = 0;
  let isGlitching = false;

  // Initial load par sabhi 5 layers par pehli photo lagana
  layers.forEach((layer) => {
    layer.style.backgroundImage = `url('${IMAGES[0]}')`;
  });

  // Preload all assets
  IMAGES.forEach((src) => {
    const img = new Image();
    img.src = src;
  });

  const triggerClipGlitch = (nextIdx = null) => {
    if (isGlitching || IMAGES.length <= 1) return;
    isGlitching = true;

    const targetIdx = nextIdx !== null ? nextIdx : (currentIndex + 1) % IMAGES.length;
    const nextSrc = IMAGES[targetIdx];

    // Layers 2, 3, 4, 5 par incoming photo set hogi polygon slicing animation ke liye
    for (let i = 1; i < layers.length; i++) {
      layers[i].style.backgroundImage = `url('${nextSrc}')`;
    }

    deck.classList.add('is-glitching');

    // Peak glitch displacement (160ms) par base layer change hogi
    setTimeout(() => {
      layers[0].style.backgroundImage = `url('${nextSrc}')`;
      currentIndex = targetIdx;
      if (tagCounter) {
        tagCounter.textContent = `FRAME [0${currentIndex + 1}/0${IMAGES.length}]`;
      }
    }, 160);

    // Animation end hone par cleanup
    setTimeout(() => {
      deck.classList.remove('is-glitching');
      isGlitching = false;
    }, 360);
  };

  // Har 4.5 seconds mein automatic glitch transition
  let autoTimer = setInterval(() => triggerClipGlitch(), 4500);

  // Click karne par instant switch
  deck.addEventListener('click', () => {
    clearInterval(autoTimer);
    triggerClipGlitch();
    autoTimer = setInterval(() => triggerClipGlitch(), 4500);
  });
})();QQQQQQQQ