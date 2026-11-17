"""Render static markup with in-document artwork. No generator runs in the browser."""
from pathlib import Path
from board import PARTS, pcb, placement_css, svg
from parts import library, use, path, rect, mark

BASE = Path(__file__).resolve().parents[1] / "preview"
VERSION = "ru-x1-a1"
# The chapter menu mirrors the original 01–09 ordering. Only two excerpts live here.
chapters = PARTS[1:10]
menu = ''.join(f'<li><a data-chapter="{part}" href="{url}"><span>{i:02}</span>{name}</a></li>'
               for i,(part,ref,name,url,*_) in enumerate(chapters,1))
miniature = path("M4 1H47L53 7V36L48 41H3L1 38V4Z","mask-edge")
for part,x,y,w,h in [('cpu',17,12,13,11),('pcie',5,31,19,5),('pch',27,28,10,8),
                      ('history',7,17,6,5),('m2',6,25,11,3),('vrm',15,6,10,3),
                      ('tpm',39,28,5,4),('storage',46,24,4,6),('fan',42,17,6,3),('io',3,6,3,8)]:
    miniature+=rect(x,y,w,h,'mini-foot mini-'+part)
mini = svg(miniature,"0 0 55 43","mini-art")

def phase(i, title, copy):
    return f'''<li><div class="phase-figure" aria-hidden="true">{svg(use("phase",3,2),"0 0 55 54","")}
      <span>VRM{i}</span></div><h3>{title}</h3><p>{copy}</p></li>'''

phases = ''.join([
    phase(1,"Claude Code supervises","I use Claude Code to shape the plan, break work into tasks, delegate implementation to Codex and review the returned changes against the brief."),
    phase(2,"Codex implements","Codex works through the scoped implementation, updates the code, runs relevant checks and revises the changes as review feedback comes back."),
    phase(3,"I own the outcome","I set priorities and constraints, review the code and behavior, validate the result with the team and decide what is ready to merge or release.")
])
tech = ''.join(f'<li>{s}</li>' for s in ('Laravel','PHP','MySQL','Vue','Redis','Horizon','Stripe','Algolia','AWS EC2','S3','Laravel Forge'))
head = f'''<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta http-equiv="Content-Security-Policy" content="default-src 'none'; script-src 'self'; script-src-attr 'none'; style-src 'self'; style-src-attr 'none'; img-src 'self'; font-src 'self'; connect-src 'none'; media-src 'none'; object-src 'none'; frame-src 'none'; worker-src 'none'; manifest-src 'none'; base-uri 'none'; form-action 'none'">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<meta name="color-scheme" content="light dark">
<meta name="theme-color" content="Canvas">
<meta name="description" content="Exploring Super Intelligence (SI), building practical software and developing an independent cybersecurity audit venture. Full-stack engineering by Rana Usman.">
<title>RU-X1 · Rana Usman</title>
<link rel="icon" href="../../assets/favicon.svg">
<link rel="preload" as="font" type="font/woff2" crossorigin href="fonts/plex-sans-latin-wght.woff2?v={VERSION}">
<link rel="preload" as="font" type="font/woff2" crossorigin href="fonts/plex-mono-latin-400.woff2?v={VERSION}">
<link rel="stylesheet" href="tokens.css?v={VERSION}">
<script blocking="render" src="finish.js?v={VERSION}"></script>
<link rel="stylesheet" href="board.css?v={VERSION}">
<link rel="stylesheet" href="placements.css?v={VERSION}">
<script src="board.js?v={VERSION}" defer></script>
</head>'''
body = f'''
<body>
<a class="skip" href="#main">Skip to content</a>
{library()}
<header class="mast"><div class="mast-inner">
  <a class="brand" href="#top"><span class="brand-mark" aria-hidden="true">ru.</span><span class="brand-domain">ranausman.dev</span><span class="sr-only">Rana Usman, home</span></a>
  <nav class="head-links" aria-label="Main navigation"><a href="#work">Selected work</a><a href="../../index.html#contact">Contact</a></nav>
  <details class="navigator"><summary>{mini}<span class="dbg-unit" aria-hidden="true"><small>DBG</small><b data-debug>01</b></span><span>Menu</span><i aria-hidden="true"></i></summary>
    <nav aria-label="Portfolio chapters"><ol>{menu}</ol></nav>
  </details>
  <div class="switch-seat"><button class="switch" data-switch role="switch" aria-label="Dark theme" aria-checked="false" hidden type="button">
    <small aria-hidden="true">SW1</small><span class="light-mark" aria-hidden="true">LIGHT</span><i aria-hidden="true"><b></b></i><span class="dark-mark" aria-hidden="true">DARK</span>
  </button></div>
</div></header>
<main id="main" tabindex="-1">
<section class="hero page" id="top" aria-labelledby="hero-title">
<div class="hero-copy"><p class="eyebrow"><i class="register" aria-hidden="true"></i> RU / PORTFOLIO</p>
<h1 id="hero-title"><span>Exploring Super Intelligence.</span> <em>Building useful software.</em></h1>
<p class="intro">I build business software, modernize applications, connect systems and automate workflows with today’s intelligent tools and human review.</p>
<div class="actions"><a class="primary" href="mailto:ranausmannoman@gmail.com?subject=Project%20enquiry"><i class="power-icon" aria-hidden="true"></i>Discuss a project <span aria-hidden="true">↗</span></a>
<a class="quiet" href="../../assets/Usman_Iqbal_Resume.pdf" download>Download CV <span aria-hidden="true">↓</span><span class="sr-only"> (PDF, 2 pages)</span></a></div>
</div>
<div class="drawing"><i class="corner tl"></i><i class="corner tr"></i><i class="corner bl"></i><i class="corner br"></i>{pcb()}</div>
</section>
<div class="spec page" id="stack"><div><span class="spec-key">Built across the stack</span><ul class="stack"><li>.NET</li><li>MAUI</li><li>Laravel</li><li>Azure</li><li>AWS</li></ul></div>
<div><span class="spec-key">Full-stack engineering &amp; technical direction</span><b>Web · Mobile · Cloud</b></div>
<a href="../../case-studies/openvitals.html"><span class="spec-key">Building OpenVitals</span><b>An ongoing product · Explore the technology ↗</b></a></div>
<section class="chapter page" id="work" aria-labelledby="work-title"><div class="section-intro"><p class="eyebrow"><span>01 / PCIE</span> Selected work</p><h2 id="work-title">Real workflows.<br>Considered engineering.</h2></div>
<article class="card-machine">
  <div class="card-bracket"><span aria-hidden="true">PCIE</span><a href="../../index.html#work">All selected work ↗</a><a href="https://makersrow.com/" target="_blank" rel="noopener noreferrer">Visit Maker’s Row website ↗</a></div>
  <div class="card-board"><div class="card-top-art" aria-hidden="true">{svg(use("expansion-1",2,2),"0 0 201 27","card-thumbnail")}<span>RU-X1</span></div>
  <div class="card-main"><div class="main-ic">{svg(use("makers-mark"),"0 0 26 9","makers-mark")}<small>Maker’s Row / Laravel / AWS</small><h3>Maker’s Row</h3><p>Senior Full-Stack Engineer · Embark (past contract)</p></div>
  <ul class="card-tech" aria-label="Project technologies">{tech}</ul></div>
  <div class="card-prose"><p>Directed the production rollout of a Laravel marketplace upgrade and a blue/green AWS migration, with rehearsals and verification before release.</p>
  <a class="quiet" href="../../case-studies/makers-row.html">Read case study →</a></div>
  <nav class="edge" aria-label="Case studies"><a href="../../case-studies/openvitals.html">← OpenVitals</a><a href="../../case-studies/guestay.html">Guestay →</a></nav>
  </div>
</article></section>
<section class="chapter page" id="approach" aria-labelledby="approach-title"><div class="section-intro"><p class="eyebrow"><span>05 / VRM1–3</span> My working process</p><h2 id="approach-title">How I work with<br>Claude Code and Codex.</h2>
<p>A scoped brief, a supervised implementation and a review loop — with me setting priorities, validating the work and making the final release decision.</p></div>
<ol class="phase-bank">{phases}</ol></section>
</main>
<footer class="page"><span>© 2026 Rana Usman</span><a href="#top">Back to top ↑</a></footer>
</body></html>'''
(BASE / "index.html").write_text(head+body)
(BASE / "placements.css").write_text(placement_css())
