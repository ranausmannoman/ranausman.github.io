/**
 * Stage A geometry and screenshot checks. Run with an outside-repository Playwright
 * installation on NODE_PATH. No test package is part of the production site.
 * Usage: NODE_PATH=/path/to/node_modules node redesign/tools/matrix.cjs URL OUTPUT [--capture]
 */
const fs = require('node:fs/promises');
const os = require('node:os');
const path = require('node:path');
const { chromium, firefox, webkit } = require('playwright');

const [url, outputDir, mode] = process.argv.slice(2);
if (!url || !outputDir) throw new Error('Provide the preview URL and an output directory.');
const output = path.resolve(outputDir);
const matrix = [[320,568],[360,640],[390,844],[430,932],[600,960],[768,1024],[820,1180],[1024,768],
  [1280,800],[1366,768],[1440,900],[1536,864],[1920,1080],[2560,1440],[3440,1440],[3840,2160],[844,390],[667,375]];
const sweep = Array.from({length:89},(_,index)=>320+index*40);
const round = v => Math.round(v * 100) / 100;

function measure() {
  const root = document.documentElement;
  const visible = node => {
    if (!node.getClientRects().length) return false;
    return !node.closest('details:not([open]) nav');
  };
  const rect = node => {
    const {left,top,right,bottom,width,height} = node.getBoundingClientRect();
    return {left,top,right,bottom,width,height};
  };
  const textBox = node => {
    const range = document.createRange();
    range.selectNodeContents(node);
    return rect(range);
  };
  const key = el => (el.dataset.part || el.getAttribute('aria-label') || el.textContent).trim().slice(0,45);
  const board = document.querySelector('.board');
  const bounds = rect(board);
  const sources = [...document.querySelectorAll('.component-label,.cpu-face,.board-id,.board-stat,.board-domain,.map-debug')].filter(visible);
  const labels = sources.map(el=>[el.closest('[data-part]')?.dataset.part || el.className,textBox(el)]);
  const portrait = !visible(document.querySelector('.wide-art'));
  const issues=[];
  const data = (kind,detail) => issues.push({kind,detail});
  if (root.scrollWidth>root.clientWidth) data('overflow', [root.scrollWidth,root.clientWidth]);
  const interactives = [...document.querySelectorAll('button,summary,a')].filter(visible).filter(e=>!e.matches('.skip'));
  for(const e of interactives) {
    const box=rect(e);
    if(box.width<43.99 || box.height<43.99) data('target', [key(e), box.width,box.height]);
    if(box.left<-.5 || box.right>innerWidth+.5) data('offscreen', [key(e),box.left,box.right]);
  }
  for (const [i,[name,box]] of labels.entries()) {
    if(!box.width || !box.height) continue;
    if(box.left<bounds.left-1||box.right>bounds.right+1||box.top<bounds.top-1||box.bottom>bounds.bottom+1) data('label-outside-board',name);
    for(const [other,b] of labels.slice(i+1)) {
      const w=Math.min(box.right,b.right)-Math.max(box.left,b.left), h=Math.min(box.bottom,b.bottom)-Math.max(box.top,b.top);
      if(w>1 && h>1) data('labels-overlap', [name,other,w,h]);
    }
  }
  // Transform each HTML chip inscription into the original socket's local
  // coordinates. This catches drift between the SVG socket and the HTML layer.
  const chipUse=document.querySelector(portrait ? '.st-cpu .portrait-part use' : '.wide-art use[href="#p-cpu"]');
  const toSocket=chipUse.getScreenCTM().inverse();
  const chipText=document.createTreeWalker(document.querySelector('.cpu-face'),NodeFilter.SHOW_TEXT);
  while(chipText.nextNode()) {
    const range=document.createRange();
    range.selectNodeContents(chipText.currentNode);
    for(const box of range.getClientRects()) {
      if(!box.width) continue;
      const start=new DOMPoint(box.left,box.top).matrixTransform(toSocket);
      const end=new DOMPoint(box.right,box.bottom).matrixTransform(toSocket);
      // Outer chamfered lid, before socket pins. Bounds use full line boxes,
      // which include ascender and descender whitespace above and below the ink.
      if(start.x<20||end.x>165||start.y<17.5||end.y>121.5) {
        data('cpu-marking-outside-lid',[chipText.currentNode.textContent,start.x,start.y,end.x,end.y]);
      }
    }
  }
  for(const e of document.querySelectorAll('.board-id :is(strong,span),.component-label :is(b,small),.cpu-face :is(b,small,span),.board-stat,.board-domain,.switch :is(small,span)')) {
    if(visible(e)&&parseFloat(getComputedStyle(e).fontSize)<12) data('label-type',key(e));
  }
  for(const e of document.querySelectorAll('.intro,.card-prose p,.phase-bank p,.section-intro p:not(.eyebrow)')) {
    if(visible(e)&&parseFloat(getComputedStyle(e).fontSize)<16) data('body-type',key(e));
  }
  return {issues,portrait,boardBottom:Math.round(bounds.bottom),boardWidth:Math.round(bounds.width),rootPx:getComputedStyle(root).fontSize};
}

async function changeFinish(page,finish) {
  if (await page.locator('html').getAttribute('data-finish') !== finish) {
    await page.getByRole('switch',{name:'Dark theme'}).click();
    await page.mouse.move(0,0);
    await page.waitForFunction(()=>!document.documentElement.classList.contains('change-finish'));
  }
}

async function setViewport(page,w,h) {
  await page.setViewportSize({width:w,height:h});
  await page.evaluate(()=>{
    window.scrollTo(0,0);
    return new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve)));
  });
}

async function check(engine,options) {
  const browser=await engine.launch(options.launch);
  const name=options.name;
  const context=await browser.newContext({ viewport:{width:1366,height:768},reducedMotion:'reduce'});
  const page=await context.newPage();
  const issues=[];
  const matrixRows=[];
  let sweepChecks=0,stressChecks=0,densityChecks=0;
  const record=(measurement,step,finish,w,h)=>{for(const issue of measurement.issues) issues.push({step,finish,w,h,...issue});};
  try {
    await page.goto(url,{waitUntil:'load'});
    await page.evaluate(()=>document.fonts.ready);
    for(const finish of ['light','dark']) {
      await changeFinish(page,finish);
      for(const [w,h] of matrix) {
        await setViewport(page,w,h);
        const result=await page.evaluate(measure);
        record(result,'matrix',finish,w,h);
        matrixRows.push([finish,w,h,result.portrait?'portrait':'landscape',result.boardWidth,result.boardBottom]);
        if(mode==='--capture'&&name==='chrome') {
          const prefix=path.join(output,'matrix',finish+'-'+w+'x'+h);
          await page.screenshot({path:prefix+'.png',animations:'disabled'});
          // Isolate full-height capture. Resizing Chrome's compositor for a
          // full page can otherwise duplicate the sticky mast in a later shot.
          const full=await context.newPage();
          await setViewport(full,w,h);
          await full.goto(url,{waitUntil:'load'});
          await full.evaluate(()=>document.fonts.ready);
          await full.screenshot({path:prefix+'-page.png',fullPage:true,animations:'disabled'});
          await full.close();
        }
      }
      if(mode==='--capture'&&name==='chrome') {
        // Higher-density browser captures preserve individual copper tracks when zooming.
        const close=await browser.newContext({viewport:{width:1440,height:900},deviceScaleFactor:2,reducedMotion:'reduce'});
        const detail=await close.newPage();
        await detail.goto(url,{waitUntil:'load'});
        await detail.evaluate(()=>document.fonts.ready);
        await changeFinish(detail,finish);
        for(const [part,selector] of Object.entries({landscape:'.drawing',socket:'.st-cpu','expansion-card':'.card-machine','power-phases':'.phase-bank'})) {
          await detail.locator(selector).screenshot({path:path.join(output,'closeups',finish+'-'+part+'.png'),animations:'disabled'});
        }
        await setViewport(detail,390,2700);
        await detail.locator('.drawing').screenshot({path:path.join(output,'closeups',finish+'-portrait.png'),animations:'disabled'});
        await close.close();
      }
      if(name!=='edge') {
        for(const w of sweep) {
          const h=w<=820?900:800;
          await setViewport(page,w,h);
          record(await page.evaluate(measure),'sweep',finish,w,h);
          sweepChecks++;
        }
      }
      if(name==='chrome') {
        const cdp=await context.newCDPSession(page);
        for(const font of [20,24]) {
          await cdp.send('Page.setFontSizes',{fontSizes:{standard:font}});
          for(const [w,h] of [[320,568],[390,844],[640,450],[1024,768],[1366,768],[1536,864],[1920,1080]]) {
            await setViewport(page,w,h);
            const r=await page.evaluate(measure);
            if(r.rootPx!==font+'px') throw new Error('Default text size override failed');
            record(r,'default-font-'+font,finish,w,h);
            stressChecks++;
          }
        }
        await cdp.send('Page.setFontSizes',{fontSizes:{standard:16}});
        await cdp.detach();
        // Equivalent CSS viewports of a 1280x900 window at browser zoom; no pinch scaling.
        for(const zoom of [2,4]) {
          const w=1280/zoom,h=900/zoom;
          await setViewport(page,w,h);
          const r=await page.evaluate(measure);
          if(!r.portrait) r.issues.push({kind:'zoom-layout',detail:'Expected the one-column board'});
          record(r,'zoom-css-'+zoom,finish,w,h);
          stressChecks++;
        }
      }
    }
    for(const dpr of [2,3]) {
      const settings={viewport:{width:390,height:844},deviceScaleFactor:dpr,hasTouch:true};
      if(name!=='firefox') settings.isMobile=true;
      const mobile=await browser.newContext(settings);
      const mobilePage=await mobile.newPage();
      await mobilePage.goto(url,{waitUntil:'load'});
      await mobilePage.evaluate(()=>document.fonts.ready);
      for(const finish of ['light','dark']) {
        await changeFinish(mobilePage,finish);
        for(const [w,h] of [[390,844],[844,390]]) {
          await setViewport(mobilePage,w,h);
          record(await mobilePage.evaluate(measure),'dpr-'+dpr,finish,w,h);
          densityChecks++;
        }
      }
      await mobile.close();
    }
    return {name,version:browser.version(),matrixRows,sweepChecks,stressChecks,densityChecks,issues};
  } finally {await browser.close();}
}

async function checkNativeZoom() {
  // Chrome's settings API changes real browser zoom in a disposable profile.
  const profile=await fs.mkdtemp(path.join(os.tmpdir(),'ru-x1-zoom-'));
  const context=await chromium.launchPersistentContext(profile,{
    channel:'chrome',viewport:null,args:['--window-size=1280,900']
  });
  const samples=[];
  try {
    const prefs=await context.newPage();
    await prefs.goto('chrome://settings/appearance');
    const page=await context.newPage();
    for(const zoom of [2,4]) {
      await prefs.evaluate(v=>new Promise(done=>chrome.settingsPrivate.setDefaultZoom(v,done)),zoom);
      await page.goto(url,{waitUntil:'load'});
      await page.evaluate(()=>document.fonts.ready);
      for(const finish of ['light','dark']) {
        await changeFinish(page,finish);
        const {inner,outer,scale}=await page.evaluate(()=>({inner:innerWidth,outer:outerWidth,scale:devicePixelRatio}));
        if(inner!==1280/zoom || outer!==1280 || scale!==zoom) throw new Error('Browser zoom did not apply');
        const result=await page.evaluate(measure);
        if(!result.portrait) result.issues.push({kind:'zoom-layout',detail:'Expected a single column'});
        samples.push({finish,zoom,inner,outer,scale,issues:result.issues});
        if(mode==='--capture' || mode==='--zoom') {
          await page.screenshot({path:path.join(output,'closeups',finish+'-zoom-'+zoom+'x.png')});
        }
      }
    }
    return samples;
  } finally {
    await context.close();
    await fs.rm(profile,{recursive:true,force:true});
  }
}

(async()=>{
  await fs.mkdir(path.join(output,'matrix'),{recursive:true});
  await fs.mkdir(path.join(output,'closeups'),{recursive:true});
  const zoomSamples=await checkNativeZoom();
  await fs.writeFile(path.join(output,'browser-zoom.json'),JSON.stringify(zoomSamples,null,2));
  if(zoomSamples.some(row=>row.issues.length)) throw new Error('Native-zoom geometry failed');
  if(mode==='--zoom') return;
  const configs = [[chromium,{name:'chrome',launch:{channel:'chrome'}}],[firefox,{name:'firefox',launch:{}}],
    [webkit,{name:'webkit',launch:{}}],[chromium,{name:'edge',launch:{channel:'msedge'}}]];
  const results=await Promise.all(configs.map(async ([engine,config])=>{
    try {return await check(engine,config);}
    catch(e) {return {name:config.name,error:e.message};}
  }));
  await fs.writeFile(path.join(output,'matrix.json'),JSON.stringify(results,(_,v)=>typeof v==='number'?round(v):v,2));
  for(const {name,version,sweepChecks,stressChecks,issues,error} of results) {
    console.log(name,version,error||JSON.stringify({sweepChecks,stressChecks,issues:issues.length,examples:issues.slice(0,10)}));
  }
  if(results.some(r=>r.error||r.issues.length)) process.exitCode=1;
})();
