// Browser behavior checks. No dependencies are installed in the portfolio.
import {createRequire} from 'node:module';
import {fileURLToPath} from 'node:url';
import fs from 'node:fs/promises';
import path from 'node:path';
import os from 'node:os';
import assert from 'node:assert/strict';

const requireQA = createRequire(path.join(path.resolve(process.argv[2]),'../package.json'));
const {chromium,firefox,webkit}=requireQA('playwright');
const url = new URL(process.argv[3]||'http://127.0.0.1:4187/redesign/preview/');
const evidence=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'../evidence/behavior.json');
const report={scenarios:{}, engines:{}, noContentFlash:{}, transfer:{}};
const state = page=>page.evaluate(()=>({
  finish:document.documentElement.dataset.finish || null,
  surface:getComputedStyle(document.documentElement).backgroundColor,
  scheme:getComputedStyle(document.documentElement).colorScheme,
  theme:document.querySelector('meta[name="theme-color"]').content,
  checked:document.querySelector('[data-switch]').getAttribute('aria-checked'),
  switchVisible:document.querySelector('[data-switch]').getClientRects().length>0
}));
const light='rgb(255, 255, 255)';
const dark='rgb(10, 10, 11)';
const expected = (s,f) => {
  assert.equal(s.finish,f); assert.equal(s.scheme,f); assert.equal(s.surface,f==='light'?light:dark);
  assert.equal(s.theme.toLowerCase(),f==='light'?'#ffffff':'#0a0a0b');
  assert.equal(s.checked,String(f==='dark')); assert.equal(s.switchVisible,true);
};
const doneFade=async p=>{
  await p.bringToFront();
  await p.waitForFunction(()=>!document.documentElement.classList.contains('change-finish') &&
    getComputedStyle(document.documentElement).backgroundColor===(document.documentElement.dataset.finish==='dark'?'rgb(10, 10, 11)':'rgb(255, 255, 255)'));
};
const themeButton=p=>p.getByRole('switch',{name:'Dark theme'});
const persistedProfile=await fs.mkdtemp(path.join(os.tmpdir(),'ru-x1-pref-'));
const engineTools={chromium,firefox,webkit};
try {
for (const [name,tool] of Object.entries(engineTools)) {
  const options=name==='chromium'?{channel:'chrome'}:{};
  const browser=await tool.launch(options);
  try {
    const ctx=await browser.newContext({viewport:{width:1366,height:768},colorScheme:'dark'});
    const p=await ctx.newPage(); const errors=[],requests=[];
    p.on('pageerror',err=>errors.push(err.message)); p.on('request',req=>requests.push(req.url()));
    await p.goto(url.href); await p.evaluate(()=>document.fonts.ready);
    expected(await state(p),'light');
    const firstVisit=await state(p);
    const passiveAnimations=await p.evaluate(()=>document.getAnimations().length);
    const boot=await p.evaluate(()=>({fonts:[...document.fonts].map(f=>[f.family,f.status]),
      artBytes:[...document.querySelectorAll('svg')].filter(s=>!s.parentElement.closest('svg')).reduce((n,s)=>n+new TextEncoder().encode(s.outerHTML).length,0),
      js:performance.getEntriesByType('resource').filter(r=>r.name.includes('.js?')).map(r=>[r.name,r.decodedBodySize])}));
    const a=await ctx.newPage();await a.goto(new URL('index.html',url).href);
    await p.bringToFront();await themeButton(p).focus();await p.keyboard.press('Space');
    await a.waitForFunction(()=>document.documentElement.dataset.finish==='dark');
    await doneFade(p); await doneFade(a);
    expected(await state(p),'dark');expected(await state(a),'dark');
    await p.reload(); expected(await state(p),'dark');
    await p.goto(new URL('index.html',url).href); expected(await state(p),'dark');
    await p.emulateMedia({media:'print'});
    const print=await p.evaluate(()=>({surface:getComputedStyle(document.documentElement).backgroundColor,scheme:getComputedStyle(document.documentElement).colorScheme}));
    assert.equal(print.surface,light); await p.emulateMedia({media:'screen'});
    await p.emulateMedia({reducedMotion:'reduce'});await themeButton(p).focus();await p.keyboard.press('Enter');
    await p.locator('[data-part="pch"]').focus();
    const reduced=await p.evaluate(()=>document.getAnimations().map(a=>a.playState));assert.deepEqual(reduced,[]);
    await doneFade(p); expected(await state(p),'light');
    const jsOff=await browser.newContext({javaScriptEnabled:false,colorScheme:'dark'});
    const offPage=await jsOff.newPage(); await offPage.goto(url.href);
    const off=await state(offPage); assert.equal(off.switchVisible,false); assert.equal(off.scheme,'light');assert.equal(off.surface,light);
    assert.equal(await offPage.locator('.station a:visible').count(),12);
    await offPage.locator('.navigator summary').focus();await offPage.keyboard.press('Enter');
    assert.equal(await offPage.locator('.navigator nav a:visible').count(),9);
    await jsOff.close();
    const restricted=await browser.newContext();
    await restricted.addInitScript(()=>{Object.defineProperty(window,'localStorage',{get(){throw new DOMException('Unavailable','SecurityError')}})});
    const blocked=await restricted.newPage();await blocked.goto(url.href);
    await themeButton(blocked).click();await doneFade(blocked);expected(await state(blocked),'dark');
    await blocked.reload();expected(await state(blocked),'light');
    await restricted.close();
    // Sample BEFORE each content-bearing frame during a slowed bootstrap and a fresh navigation.
    await ctx.addInitScript(()=>{
      window.__pcbFrames=[];
      function beforePaint(time) {
        const first=document.querySelector('main h1');
        if(first && first.getBoundingClientRect().height>0 && window.__pcbFrames.length < 8) {
          const cs=getComputedStyle(document.documentElement);
          window.__pcbFrames.push({time:Math.round(time*10)/10,finish:document.documentElement.dataset.finish,background:cs.backgroundColor});
        }
        if(window.__pcbFrames.length<8) requestAnimationFrame(beforePaint);
      } requestAnimationFrame(beforePaint);
    });
    await p.route('**/finish.js*',async route=>{await new Promise(r=>setTimeout(r,180));await route.continue()});
    await themeButton(p).click();await doneFade(p);await p.goto(url.href);
    await p.waitForFunction(()=>window.__pcbFrames?.length===8);
    report.noContentFlash[name]=await p.evaluate(()=>window.__pcbFrames);
    assert(report.noContentFlash[name].every(frame=>frame.finish==='dark'&&frame.background===dark));
    report.engines[name]={version:browser.version(),firstVisit,passiveAnimations,darkReloadAndSiblingDocument:true,
      otherTabFollows:true,spaceAndEnter:true,reducedActiveAnimations:reduced,print,blockedStore:true,jsOff:off,
      pageErrors:errors,externalRequests:requests.filter(r=>new URL(r).origin!==url.origin)};
    assert.equal(passiveAnimations,0);assert.equal(errors.length,0);assert.equal(report.engines[name].externalRequests.length,0);
    if (name==='chromium') {
      report.transfer=boot;
      report.transfer.js = await Promise.all(boot.js.map(async ([source])=>{
        const response=await p.request.get(source);
        return [new URL(source).pathname,(await response.body()).length];
      }));
      const k=await ctx.newPage();await k.goto(url.href);await k.keyboard.press('Tab');
      assert.equal(await k.evaluate(()=>document.activeElement.getAttribute('href')),'#main');
      await k.keyboard.press('Enter');assert.equal(await k.evaluate(()=>document.activeElement.id),'main');
      await k.locator('.navigator summary').focus();await k.keyboard.press('Enter');
      const order=[];
      for(let i=0;i<9;i++) {
        await k.keyboard.press('Tab');
        order.push(await k.evaluate(()=>document.activeElement.dataset.chapter));
      }
      assert.deepEqual(order,['pcie','pch','history','m2','vrm','tpm','storage','fan','io']);
      await k.keyboard.press('Escape');assert.equal(await k.locator('.navigator').getAttribute('open'),null);
      assert.equal(await k.evaluate(()=>document.activeElement.matches('.navigator summary')),true);
      const stations=await k.locator('.stations [data-part]').evaluateAll(links=>links.map(a=>a.dataset.part));
      await k.locator('[data-part="cpu"]').focus();
      const focusOrder=['cpu'];
      for(let i=1;i<stations.length;i++) {
        await k.keyboard.press('Tab');focusOrder.push(await k.evaluate(()=>document.activeElement.dataset.part));
      }
      assert.deepEqual(focusOrder,stations);
      report.scenarios.keyboard={skip:'main',menuOrder:order,boardOrder:focusOrder,escapeRestoresFocus:true};
    }
    await ctx.close();
  } finally {await browser.close();}
}
let persistent=await chromium.launchPersistentContext(persistedProfile,{channel:'chrome',colorScheme:'dark'});
let tab=await persistent.newPage();await tab.goto(url.href);expected(await state(tab),'light');
await themeButton(tab).click();await doneFade(tab);await persistent.close();
persistent=await chromium.launchPersistentContext(persistedProfile,{channel:'chrome',colorScheme:'light'});
tab=await persistent.newPage();await tab.goto(url.href);expected(await state(tab),'dark');
await persistent.close();report.scenarios.browserRestart='The same on-disk profile retained dark after a browser restart with a light OS preference.';
} finally {
  await fs.rm(persistedProfile,{recursive:true,force:true});
  await fs.writeFile(evidence,JSON.stringify(report,null,2)+'\n');
}
console.log(report.engines,report.scenarios,report.transfer);
