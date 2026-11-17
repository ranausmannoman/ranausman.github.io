// Read-only browser baseline and source/link comparison. Browser packages are external QA tools.
import {createRequire} from 'node:module';
import fs from 'node:fs/promises';
import path from 'node:path';
import {createHash} from 'node:crypto';
import {fileURLToPath} from 'node:url';

const modules = path.resolve(process.argv[2]);
const requireQA = createRequire(path.join(modules,'../package.json'));
const {chromium} = requireQA('playwright');
const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)),'../..');
const url = new URL(process.argv[3] || 'http://127.0.0.1:4187/redesign/preview/');
const baseline = JSON.parse(await fs.readFile(path.join(ROOT,'redesign/baseline/source.json')));
const renderedPath = path.join(ROOT,'redesign/baseline/rendered.json');
const reportPath = path.join(ROOT,'redesign/evidence/source-checks.json');
const hash = data => createHash('sha256').update(data).digest('hex');
const normalize = s => s.replace(/\s+/g,' ').trim();
const report = {sourceHashes:{},assets:{},hrefDeltas:[],localUrls:{},externalUrls:[],emailAndTelephone:[],excerptChecks:[],previewLinks:[]};
const inventoryPages = Object.keys(baseline.pages);
const rendered = {};
const resources = new Set();
const externals = new Set();
const contacts = new Set();
const asURL = (page, href) => new URL(href, new URL(page,url.origin));

// Use text nodes with a layout box. innerText alone also returns text from SVG <defs>.
function visibleText() {
  const chunks = [];
  const tree = document.createTreeWalker(document.body,NodeFilter.SHOW_TEXT);
  while(tree.nextNode()) {
    const n = tree.currentNode;
    if (n.parentElement.closest('defs,script,style,template,title,desc')) continue;
    if (getComputedStyle(n.parentElement).visibility !== 'visible') continue;
    const r = document.createRange();
    r.selectNodeContents(n);
    if ([...r.getClientRects()].some(b=>b.width && b.height)) chunks.push(n.data);
  }
  return chunks.join(' ').replace(/\s+/g,' ').trim();
}

const browser = await chromium.launch({channel:'chrome'});
try {
  const page = await browser.newPage({viewport:{width:1366,height:768},reducedMotion:'reduce'});
  for (const [name, original] of Object.entries(baseline.pages)) {
    report.sourceHashes[name] = {match:hash(await fs.readFile(path.join(ROOT,name)))===original.sha256,sha256:original.sha256};
    const address = new URL(name,url.origin);
    await page.goto(address.href);
    await page.evaluate(() => document.fonts.ready);
    const hrefs = await page.locator('a[href]').evaluateAll(links=>links.map(link=>link.getAttribute('href')));
    if (JSON.stringify(hrefs)!==JSON.stringify(original.links.map(l=>l.href))) report.hrefDeltas.push(name);
    for (const href of hrefs) {
      const target=asURL(name,href);
      if (target.protocol==='mailto:' || target.protocol==='tel:') contacts.add(target.href);
      else if (target.origin!==url.origin) externals.add(target.href);
      else resources.add(target.href);
    }
    rendered[name]={};
    for (const [layout,width,height] of [['landscape',1366,768],['portrait',390,844]]) {
      await page.setViewportSize({width,height});
      await page.evaluate(()=>new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve))));
      await page.evaluate(()=>document.querySelectorAll('details').forEach(d=>d.open=false));
      const normal=await page.evaluate(visibleText);
      await page.evaluate(()=>document.querySelectorAll('details').forEach(d=>d.open=true));
      rendered[name][layout]={normal,allDisclosures:await page.evaluate(visibleText)};
    }
  }
  // Keep the captured pre-build snapshot immutable. Later runs compare against it.
  let initial;
  try { initial=JSON.parse(await fs.readFile(renderedPath)); }
  catch (error) { if (error.code!=='ENOENT') throw error; }
  if (!initial) await fs.writeFile(renderedPath,JSON.stringify(rendered,null,2)+'\n',{flag:'wx'});
  if (initial) {
    for(const name of inventoryPages) for(const layout of Object.keys(rendered[name])) {
      for(const state of Object.keys(rendered[name][layout])) {
        const before=initial[name][layout][state],after=rendered[name][layout][state];
        if(before!==after) {
          let i=0;while(i<before.length&&before[i]===after[i])i++;
          console.error('Rendered difference',name,layout,state,i,before.slice(Math.max(0,i-24),i+120),' / ',after.slice(Math.max(0,i-24),i+120));
        }
      }
    }
  }
  report.renderedTextDifferences=initial ? inventoryPages.filter(name=>JSON.stringify(initial[name])!==JSON.stringify(rendered[name])) : [];
  for (const [name,file] of Object.entries(baseline.files)) {
    report.assets[name]=hash(await fs.readFile(path.join(ROOT,name)))===file.sha256;
  }
  await page.goto(url.href);
  const destinations = await page.locator('a[href]').evaluateAll(links=>links.map(link=>link.href));
  for (const dest of destinations) {
    const target=new URL(dest);
    const fromSource=externals.has(dest)||contacts.has(dest)||resources.has(dest);
    const withinPreview=target.pathname===url.pathname && target.origin===url.origin;
    const section=withinPreview && target.hash ? await page.evaluate(k=>!!document.getElementById(k),decodeURIComponent(target.hash.slice(1))) : null;
    report.previewLinks.push({url:dest,fromSource,withinPreview,...(section!==null?{anchorFound:section}:{})});
    if (target.origin===url.origin) resources.add(dest);
  }
  const texts=await page.locator('.hero-copy h1,.hero-copy .intro,.cpu-face b,.cpu-face > span:not(.cpu-name),.spec-key,.stack li,.spec b,.chapter h2,.chapter h3,.chapter p:not(.eyebrow),.main-ic small,.card-tech li,footer > span').allTextContents();
  const corpora=Object.values(rendered).flatMap(page=>Object.values(page).map(layout=>layout.allDisclosures));
  // BR is a line break in the browser. Use a tight comparison too for source chunks
  // split around a styled span or decorative glyph, never to rewrite words.
  for (const value of texts.map(normalize)) {
    const tight = value.replace(/\s+/g,'');
    report.excerptChecks.push({text:value,presentInExistingCopy:corpora.some(c=>c.includes(value)||c.replace(/\s+/g,'').includes(tight))});
  }
  for (const dest of [...resources].sort()) {
    const u=new URL(dest), resource=u.pathname.replace(/^\//,'') || 'index.html';
    const preview=resource.endsWith('/')?resource+'index.html':resource;
    let exists=true;
    try { await fs.access(path.join(ROOT,decodeURIComponent(preview))); }
    catch { exists=false; }
    const anchor=u.hash ? decodeURIComponent(u.hash.slice(1)) : '';
    const ids=baseline.pages[preview]?.ids;
    const actualAnchor=!anchor || (ids?ids.includes(anchor):await page.evaluate(id=>!!document.getElementById(id),anchor));
    report.localUrls[dest]={exists,anchorFound:actualAnchor};
  }
  report.externalUrls=[...externals].sort();
  report.emailAndTelephone=[...contacts].sort();
  report.externalScope='Exact source and href preservation; direct HTTP status recorded separately where reachable.';
  const cv=await page.request.get(new URL('/assets/Usman_Iqbal_Resume.pdf',url).href);
  report.cv={status:cv.status(),sha256:hash(await cv.body()),downloadAttribute:await page.locator('a[download]').count()};
} finally { await browser.close(); }
await fs.writeFile(reportPath,JSON.stringify(report,null,2)+'\n');
console.log(JSON.stringify({
  pages:inventoryPages.length, hrefs:Object.values(baseline.pages).reduce((n,p)=>n+p.links.length,0),
  external:report.externalUrls.length, mailAndTel:report.emailAndTelephone.length,
  samples:report.excerptChecks.length, unmatched:report.excerptChecks.filter(v=>!v.presentInExistingCopy),
  localMissing:Object.entries(report.localUrls).filter(([,v])=>!v.exists||!v.anchorFound),
  previewUnknown:report.previewLinks.filter(l=>!l.withinPreview&&!l.fromSource), changedText:report.renderedTextDifferences,
  hashChanges:Object.entries(report.sourceHashes).filter(([,v])=>!v.match)
},null,2));

if (report.hrefDeltas.length || report.renderedTextDifferences.length ||
    Object.values(report.sourceHashes).some(v=>!v.match) || Object.values(report.assets).some(match=>!match) ||
    report.excerptChecks.some(v=>!v.presentInExistingCopy) || Object.values(report.localUrls).some(v=>!v.exists||!v.anchorFound) ||
    report.previewLinks.some(l=>(!l.withinPreview&&!l.fromSource)||l.anchorFound===false) ||
    report.cv.sha256!==baseline.files['assets/Usman_Iqbal_Resume.pdf'].sha256 ||
    report.cv.status!==200 || !report.cv.downloadAttribute) {
  process.exitCode=1;
}
