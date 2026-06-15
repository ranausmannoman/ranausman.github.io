/* ══════════ PRELOADER ══════════ */
(function(){
  const pre = document.getElementById('pre');
  if(!pre) return;
  const bar = document.getElementById('preBar');
  const tip = document.getElementById('preTip');
  const pct = document.getElementById('prePct');
  const nameEl = document.getElementById('preName');
  const statusEl = document.getElementById('preStatus');
  const CIRC = 553;
  const R = 88, CX = 110, CY = 110;

  const STATUSES = ['Initializing','Compiling systems','Linking modules','Hydrating interface','Calibrating motion','Ready'];

  // staggered name letters
  'RANA USMAN'.split('').forEach((ch,i)=>{
    const s = document.createElement('span');
    s.className = 'L';
    s.style.animationDelay = (0.3 + i*0.07) + 's';
    s.innerHTML = ch === ' ' ? '&nbsp;' : ch;
    nameEl.appendChild(s);
  });

  let p = 0;
  const int = setInterval(()=>{
    p = Math.min(100, p + Math.random()*7 + 2.5);
    pct.textContent = String(Math.round(p)).padStart(2,'0');
    bar.style.strokeDashoffset = CIRC * (1 - p/100);
    // orbit the tip dot to the progress head (progress svg is rotated -90deg)
    const ang = (p/100) * Math.PI * 2;
    tip.setAttribute('cx', CX + R*Math.cos(ang));
    tip.setAttribute('cy', CY + R*Math.sin(ang));
    // cycle status text
    const si = Math.min(STATUSES.length-1, Math.floor((p/100)*STATUSES.length));
    if(statusEl.textContent !== STATUSES[si]) statusEl.textContent = STATUSES[si];
    if(p >= 100){
      clearInterval(int);
      setTimeout(()=>{
        pre.classList.add('done');
        document.body.classList.remove('loading');
        // seamless: stagger hero content in as the veil lifts
        document.querySelectorAll('.hero .rv').forEach(el=>el.classList.add('on'));
      }, 600);
    }
  }, 80);
})();

/* ══════════ AURORA CANVAS ══════════ */
(function(){
  const c = document.getElementById('aurora');
  if(!c) return;
  const ctx = c.getContext('2d');
  let w,h,t=0;
  const blobs = [
    {x:.2,y:.25,r:.45,c:'91,140,255',s:.00045,p:0},
    {x:.75,y:.2,r:.4,c:'139,92,246',s:.00038,p:2},
    {x:.5,y:.8,r:.5,c:'34,211,238',s:.0003,p:4},
    {x:.85,y:.7,r:.35,c:'91,140,255',s:.0005,p:1}
  ];
  function rs(){w=c.width=innerWidth;h=c.height=innerHeight}
  rs(); addEventListener('resize',rs);
  (function draw(){
    t++;
    ctx.clearRect(0,0,w,h);
    blobs.forEach(b=>{
      const bx = (b.x + Math.sin(t*b.s*60 + b.p)*0.08) * w;
      const by = (b.y + Math.cos(t*b.s*50 + b.p)*0.1) * h;
      const br = b.r * Math.min(w,h);
      const g = ctx.createRadialGradient(bx,by,0,bx,by,br);
      g.addColorStop(0,`rgba(${b.c},0.14)`);
      g.addColorStop(1,'rgba(0,0,0,0)');
      ctx.fillStyle = g;
      ctx.fillRect(0,0,w,h);
    });
    requestAnimationFrame(draw);
  })();
})();

/* ══════════ SCROLL PROGRESS + NAV ══════════ */
const nav = document.querySelector('.nav');
const prog = document.getElementById('progress');
const secIds = ['approach','work','experience','education','contact'];
const secEls = secIds.map(id=>document.getElementById(id));
const lnks = document.querySelectorAll('.nav a.lnk');
addEventListener('scroll',()=>{
  const sy = scrollY;
  nav.classList.toggle('scrolled', sy>40);
  const dh = document.documentElement.scrollHeight - innerHeight;
  prog.style.width = (dh>0 ? (sy/dh)*100 : 0) + '%';
  let cur='';
  secEls.forEach(s=>{ if(s && sy+180 >= s.offsetTop) cur=s.id; });
  lnks.forEach(a=>a.classList.toggle('current', a.getAttribute('href')==='#'+cur));
},{passive:true});

/* ══════════ REVEALS ══════════ */
const io = new IntersectionObserver(es=>{
  es.forEach(e=>{ if(e.isIntersecting){ e.target.classList.add('on'); io.unobserve(e.target); }});
},{threshold:.08,rootMargin:'0px 0px -70px 0px'});
document.querySelectorAll('.rv').forEach(el=>io.observe(el));

/* ══════════ SPOTLIGHT + TILT on cards ══════════ */
document.querySelectorAll('.tcard,.wcard').forEach(card=>{
  card.addEventListener('mousemove',e=>{
    const r = card.getBoundingClientRect();
    const x = e.clientX - r.left, y = e.clientY - r.top;
    card.style.setProperty('--mx', (x/r.width*100)+'%');
    card.style.setProperty('--my', (y/r.height*100)+'%');
    const rx = ((y/r.height)-.5)*-4;
    const ry = ((x/r.width)-.5)*4;
    card.style.transform = `perspective(900px) rotateX(${rx}deg) rotateY(${ry}deg)`;
  });
  card.addEventListener('mouseleave',()=>{ card.style.transform=''; });
});

/* ══════════ WORK EXPAND ══════════ */
document.querySelectorAll('[data-work]').forEach(w=>{
  w.addEventListener('click',e=>{
    if(e.target.closest('a')) return;
    w.classList.toggle('open');
  });
});

/* ══════════ COUNTERS ══════════ */
const co = new IntersectionObserver(es=>{
  es.forEach(e=>{
    if(!e.isIntersecting || e.target.dataset.done) return;
    e.target.dataset.done='1';
    const el = e.target, txt = el.textContent.trim();
    const num = parseInt(txt.replace(/\D/g,''),10);
    if(isNaN(num)) return;
    const suffix = txt.replace(/[\d,]/g,'');
    const dur=1300, st=performance.now();
    const ease = p=>1-Math.pow(1-p,4);
    (function tick(now){
      const p = Math.min((now-st)/dur,1);
      el.textContent = Math.round(ease(p)*num) + suffix;
      if(p<1) requestAnimationFrame(tick);
    })(st);
  });
},{threshold:.6});
document.querySelectorAll('.stat .n').forEach(el=>co.observe(el));

/* ══════════ TWEAKS ══════════ */
const PRESETS = {
  blue:  {a1:'#5b8cff',a2:'#8b5cf6',a3:'#22d3ee'},
  ember: {a1:'#ff8a3d',a2:'#f43f5e',a3:'#fbbf24'},
  mint:  {a1:'#34d399',a2:'#22d3ee',a3:'#a3e635'}
};
let TWEAKS = { preset:'blue', aurora:true };
function applyTweaks(t){
  const p = PRESETS[t.preset] || PRESETS.blue;
  const r = document.documentElement.style;
  r.setProperty('--a1',p.a1); r.setProperty('--a2',p.a2); r.setProperty('--a3',p.a3);
  const au = document.getElementById('aurora');
  if(au) au.style.display = t.aurora ? '' : 'none';
  document.querySelectorAll('#presetRow .sw').forEach(el=>el.classList.toggle('active',el.dataset.p===t.preset));
  document.querySelectorAll('#auroraToggle button').forEach(el=>el.classList.toggle('active',(el.dataset.v==='1')===!!t.aurora));
}
applyTweaks(TWEAKS);
addEventListener('message',e=>{
  const d=e.data||{};
  if(d.type==='__activate_edit_mode') document.getElementById('tweaks').classList.add('visible');
  if(d.type==='__deactivate_edit_mode') document.getElementById('tweaks').classList.remove('visible');
});
try{ parent.postMessage({type:'__edit_mode_available'},'*'); }catch(_){}
function persist(edits){
  Object.assign(TWEAKS,edits); applyTweaks(TWEAKS);
  try{ parent.postMessage({type:'__edit_mode_set_keys',edits},'*'); }catch(_){}
}
document.querySelectorAll('#presetRow .sw').forEach(el=>el.addEventListener('click',()=>persist({preset:el.dataset.p})));
document.querySelectorAll('#auroraToggle button').forEach(el=>el.addEventListener('click',()=>persist({aurora:el.dataset.v==='1'})));
