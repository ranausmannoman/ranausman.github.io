# RU-X1 motherboard preview · Stage A

The standalone preview is ready for artwork review. It includes the complete board in both finishes, a portrait layout built from the same parts, a three-phase process section and a Maker’s Row expansion card. All five Stage A acceptance checks passed. The additional mobile Lighthouse run missed the SEO target by four points.

[Open the interactive preview](http://127.0.0.1:4187/redesign/preview/) · [Open the screenshot gallery](/Users/usman/.codex/visualizations/2026/11/17/01a1eb1b-113b-7430-aed3-331652a09019/RU-X1/index.html)

## Verified

| Check | How it was tested and what happened |
|---|---|
| Pages, content and publishing | GitHub’s Pages API confirmed branch publishing from `main:/`. Inventoried six static documents, 122 IDs, 156 anchor elements, document metadata, 18 content assets and 11 existing scripts and stylesheets. All eleven requested home IDs exist. The original six pages and 29 assets and presentation files retained their baseline SHA-256 hashes. |
| Artwork and layout | Captured all 18 requested sizes in light and dark. Reviewed 36 viewport screenshots, 36 full-page screenshots and ten component/layout close-ups. At 1366 × 768 the whole 787 px-wide board ends at y=675. At 4K the composition stays centered and capped. Both short-landscape screens open on the board. |
| Browser matrix | Chrome 157, Edge 157, Firefox 159 and WebKit 27.2 passed all 144 viewport/finish combinations. Chrome, Firefox and WebKit also passed every 40 px from 320 through 3840, for 534 sweep samples and zero horizontal overflows. The matrix checked visible control sizes, label bounds and collisions. Thirty-two 2×/3× touch-emulation samples passed. |
| Zoom and larger text | Actual Chrome browser zoom on a 1280 px window yielded a 640 px layout at 200% and a 320 px single-column layout at 400%. Both finishes passed. Chrome also passed 28 cases with 20 px and 24 px default fonts. The narrow CPU sample was inspected at 2× density. |
| Type, materials and contrast | Two Latin WOFF2 files loaded locally, with their common IBM SIL OFL license alongside. All 28 assigned foreground/background checks in each finish passed. Body ink on the mask measured 18.42:1 light and 17.48:1 dark. The lowest checked reading-label pair was 4.55:1. Resting traces against the raised mask measured 3.92:1 light and 7.65:1 dark. Searches of the new page, scripts, CSS and SVG paint found zero authored color literals outside the token block. |
| Theme | Tested Chromium, Gecko and WebKit with the OS set dark. Each opened light on the first visit. Space and Enter operated the named switch, the accessible state and browser-theme metadata followed it, sibling tabs synchronized and a reload/navigation retained the choice. Chromium retained it after a browser restart. With storage denied, the switch still worked for the current document. With JS disabled, all three opened light and hid the switch. |
| First paint and motion | A deliberately delayed bootstrap and fresh navigation produced eight consecutive content-bearing frame samples in the stored dark finish in each of three engines. The first content frame already used the dark surface. Page load started zero animations. Reduced-motion checks recorded zero active motion. The user-triggered finish fade lasts 160 ms. |
| Keyboard and plain HTML | The skip link focused `main`. The menu followed 01–09, Escape returned focus to Menu, and the map links followed document order. With CSS and JS disabled together, the preview exposed one main heading, two example section headings, twelve board links and an ordered three-role process. |
| Content and links | Whitespace-normalized original pages matched the baseline at 1366 and 390 px, with disclosures both open and closed. Exact differences were zero. Forty sampled excerpts in the prototype matched the existing copy. All 156 source hrefs matched, including the five distinct mailto forms and telephone number. Sixty distinct local targets resolved with their fragments. The CV downloaded with the original hash. Five of six external destinations returned HTTP 200. |
| Performance and budget | Lighthouse 13.6 mobile used a cold HTTP cache with the selected finish persisted. Both finishes scored **99 performance, 100 accessibility, 100 best practices and 91 SEO**. Largest contentful paint was 1.65 s, total blocking time was 0 ms and CLS was 0 in both final runs. Inline artwork measured 68,661 bytes against 200,000 allowed. JavaScript measured 3,913 bytes against 30,000 allowed. No third-party runtime requests or page errors were observed. |
| Existing imagery | Rendered all 17 source image and video assets against the two masks, including decoded frames from both 1280 × 720 video encodings. The white Strava assets and pale captions in several original illustrations need a dark neutral panel on the white board. Both Strava files can be used intact. The browser favicon is the original green artwork. |

The raised-surface copper measurements and all other material comparisons are in the [contrast table](evidence/materials.json). The [source inventory](baseline/source.json), [browser text baseline](baseline/rendered.json) and [test results](evidence/) are saved with the branch.

## Done but not verified

Physical iPhone and iPad Safari, mobile browser chrome, hardware notches, and real-device GPU behavior remain unverified. WebKit, touch emulation, safe-area CSS and desktop browser zoom cover the corresponding layout cases. The first-paint check observes the document from its first content-bearing frame. It does not measure a physical browser’s address-bar repaint.

LinkedIn returned HTTP 999 to the automated request. Its original profile URL is preserved. Mail and phone checks covered the exact destinations and subjects without contacting the owner.

## Deliberately not done

The production home page, five case studies, 404, production print layout, complete scroll and power-button interactions, and removal of the existing design belong to Stage B. The sample chapter links lead to original portfolio sections where a preview excerpt does not exist. Cross-document finish persistence was exercised using distinct navigations to the standalone preview. The original production documents still use their existing theme.

The branch is local. There was no push, merge, deployment or hosting change. A custom root 404 is supported when Stage B begins. [GitHub Pages documentation](https://docs.github.com/en/pages/getting-started-with-github-pages/creating-a-custom-404-page-for-your-github-pages-site)

## Decisions for you

1. **Production fonts.** Approve replacing only `font-src 'none'` with `font-src 'self'` in each production document’s CSP during Stage B. The local preview demonstrates this exact allowance. Without approval, those pages must use the system font fallbacks. All other CSP directives can retain their current values.
2. **Browser favicon.** Approve replacing the green fill in the existing `ru.` favicon with a neutral chip finish and retaining its mark, original path and proportions. The current preview uses the original asset. A neutral treatment would remove the third hue from browser tabs in both finishes.

## Obstacles and resolutions

- The checkout already contained an edited home page, cinema styles and scripts, media, an extra cybersecurity image and a Finder file. Stage A froze the working source and staged only `redesign/`. The published home differs from this local hero. No repository AGENTS.md or skill conflicted with the brief.
- The documents prohibit inline scripts and styles as well as all fonts. An early same-origin external script initializes the finish. The standalone document has its own local-font policy. The Google Fonts CSS request returned TTFs, so the actual Latin WOFF2 subsets were obtained from Fontsource distribution. The two upstream license texts matched.
- Initial renders exposed duplicate CPU engraving, a location line crossing the lid, copper opacity below 3:1, four SATA jacks for two books and identical seated cards. The lid now reserves clear type space, the meaningful routes use full-opacity copper, there are two storage jacks, and Maker’s Row carries the same three diagonal markings in both views.
- The narrow header initially missed the home link’s 44 px minimum and could overrun the viewport. Enlarged text also exposed portrait labels running past the board and a tablet socket offset. Header reflow, a narrow-container layout and corrected socket positioning resolved these findings. A larger chip inset preserves the marking at 24 px browser defaults. Short landscape layouts now put the board first.
- A voice-control audit flagged visible markings that differed from link names. Links now derive their names from their visible section text, and expose reference designators as descriptions. A preliminary run also measured CLS of 0.0039. Reserving switch space during binding removed one possible source. The final runs measured zero. The original shifting element was not captured.
- One screenshot sequence showed a duplicated sticky header after a browser full-page capture. Each full-page capture now uses a separate page. The installed browser channels and external Playwright browser packages supplied the requested engines without a repository dependency.
- Lighthouse’s in-page gatherer could not request `/robots.txt` under `connect-src 'none'`. A direct request returned HTTP 200 and Lighthouse’s own validator accepted the exact body with score 1.0. The reported SEO result is the raw **91**. The original CSP and robots file remain in place.
- The source uses literal relative case-study return links such as `../index.html#work`. The bare home stack strip has no legacy anchor. OpenVitals uses an internal product enquiry. The additional staffing project has no case-study page. The inventory preserves those details. The prototype introduces a local stack target for its DIMM navigation.

## Assumptions, files and screenshots

Maker’s Row was selected for the card sample because its source has an external destination, a role, a team and neighboring studies. The three original process roles demonstrate the component-framed section. The portrait board uses the same parts in reading order. Its cells expand when the visitor increases the default text size. The debug display previews chapter 01 on entry.

All Stage A additions are under `redesign/`. `preview/` contains the standalone HTML, material/board/placement CSS, two browser scripts, the two font files and their license. `tools/` contains the Python drawing and inventory scripts and the independent QA runners. `baseline/` contains two frozen inventories. `evidence/` contains the measured matrix, native zoom, plain-document, theme, links, contrast and Lighthouse results. `NOTES.md` records the final tokens, asset treatment, run commands and Stage B handoff. No pre-existing site file was changed or removed by Stage A. Before promotion, Stage B must move the review material out of the root publishing tree.

The full-resolution gallery is outside the repository at `/Users/usman/.codex/visualizations/2026/11/17/01a1eb1b-113b-7430-aed3-331652a09019/RU-X1/`.

[White board](/Users/usman/.codex/visualizations/2026/11/17/01a1eb1b-113b-7430-aed3-331652a09019/RU-X1/closeups/light-landscape.png) · [Black board](/Users/usman/.codex/visualizations/2026/11/17/01a1eb1b-113b-7430-aed3-331652a09019/RU-X1/closeups/dark-landscape.png) · [White portrait](/Users/usman/.codex/visualizations/2026/11/17/01a1eb1b-113b-7430-aed3-331652a09019/RU-X1/closeups/light-portrait.png) · [Black portrait](/Users/usman/.codex/visualizations/2026/11/17/01a1eb1b-113b-7430-aed3-331652a09019/RU-X1/closeups/dark-portrait.png) · [Expansion card](/Users/usman/.codex/visualizations/2026/11/17/01a1eb1b-113b-7430-aed3-331652a09019/RU-X1/closeups/light-expansion-card.png) · [Power phases](/Users/usman/.codex/visualizations/2026/11/17/01a1eb1b-113b-7430-aed3-331652a09019/RU-X1/closeups/dark-power-phases.png)
