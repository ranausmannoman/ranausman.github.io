// QA tools live outside the site. Usage: node lighthouse.mjs /absolute/path/to/node_modules [URL]
import fs from 'node:fs/promises';
import path from 'node:path';
import {createRequire} from 'node:module';
import {fileURLToPath, pathToFileURL} from 'node:url';

const modules = path.resolve(process.argv[2]);
const requireQA = createRequire(path.join(modules,'../package.json'));
const puppeteer = requireQA('puppeteer-core');
const {default: lighthouse} = await import(pathToFileURL(requireQA.resolve('lighthouse')));
const url = process.argv[3] || 'http://127.0.0.1:4187/redesign/preview/';
const out = path.resolve(path.dirname(fileURLToPath(import.meta.url)),'../evidence/lighthouse.json');
const results = {};
const robotsURL = new URL('/robots.txt',url).href;
const robotsResponse = await fetch(robotsURL);
const robotsText = await robotsResponse.text();
const {default: RobotsAudit} = await import(new URL('audits/seo/robots-txt.js',pathToFileURL(requireQA.resolve('lighthouse'))));
const robotsCheck = RobotsAudit.audit({RobotsTxt:{status:robotsResponse.status,content:robotsText}});
for (const finish of ['light','dark']) {
  const browser = await puppeteer.launch({channel:'chrome',headless:true,args:['--no-first-run']});
  try {
    const page = await browser.newPage();
    await page.goto(url, {waitUntil:'load'});
    if (finish === 'dark') await page.click('[data-switch]');
    const session = await page.createCDPSession();
    await session.send('Network.clearBrowserCache');
    const result = await lighthouse(url, {
      port:Number(new URL(browser.wsEndpoint()).port),
      disableStorageReset:true, formFactor:'mobile', output:'json',
      onlyCategories:['performance','accessibility','best-practices','seo'], logLevel:'error'
    }, undefined, page);
    const lhr = result.lhr;
    const actualFinish = await page.evaluate(() => ({
      dataset:document.documentElement.dataset.finish,
      surface:getComputedStyle(document.documentElement).backgroundColor,
      chrome:document.querySelector('meta[name="theme-color"]').content,
      stored:localStorage.getItem('ru-x1-finish')
    }));
    if (actualFinish.dataset !== finish) throw Error('Measured incorrect finish: '+JSON.stringify(actualFinish));
    results[finish] = {
      timestamp:lhr.fetchTime, url:lhr.finalDisplayedUrl, version:lhr.lighthouseVersion,
      browser:lhr.environment.hostUserAgent, benchmarkIndex:lhr.environment.benchmarkIndex,
      settings:{formFactor:lhr.configSettings.formFactor,throttlingMethod:lhr.configSettings.throttlingMethod,
        throttling:lhr.configSettings.throttling,screen:lhr.configSettings.screenEmulation,
        coldHTTPCache:true,disableStorageReset:true}, actualFinish,
      scores:Object.fromEntries(Object.entries(lhr.categories).map(([k,v]) => [k,Math.round(v.score*100)])),
      clsCulprits:lhr.audits['cls-culprits-insight']?.details?.items || [],
      metrics:Object.fromEntries(['first-contentful-paint','largest-contentful-paint','cumulative-layout-shift','total-blocking-time','speed-index'].map(k=>[k,lhr.audits[k]?.numericValue])),
      independentRobots:{url:robotsURL,status:robotsResponse.status,body:robotsText,validationScore:robotsCheck.score},
      failed:Object.fromEntries(Object.entries(lhr.audits).filter(([,v])=>v.score===0).map(([k,v])=>[k,{title:v.title,explanation:v.explanation,details:v.details?.items?.map(item=>item.node?.snippet||item.description||item.url).filter(Boolean)}])),
      warnings:lhr.runWarnings
    };
    console.log(finish,results[finish].scores,results[finish].failed);
  } finally { await browser.close(); }
}
await fs.writeFile(out,JSON.stringify(results,null,2)+'\n');
