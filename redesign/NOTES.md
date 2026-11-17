# RU-X1 · Stage A

The source for this preview is the working checkout of 18 November 2026, based on commit `94469861f604ec60e365d5fdef19646ac1680976`. The frozen inventory is in `baseline/source.json`. It records normalized text in source order, including closed disclosures and SVG text, copy grouped by section, original hrefs with all attributes, IDs, image descriptions, metadata, and asset hashes and references. A rendered baseline supplements this source inventory.

## Publishing and ownership

GitHub's Pages API reports legacy branch publishing from `main:/`, with the custom domain `ranausman.dev`. The site is six hand-authored HTML files, local CSS and vanilla JS. There is no package manifest, build command, workflow, header configuration, repository AGENTS.md, or repository skill. A root `404.html` is supported by this host. Working material lives on the local redesign branch. Before promotion in Stage B, move the preview, scripts, notes, evidence and baseline out of the published tree. The production asset paths will be selected in Stage B.

The eleven requested home anchors exist. Case studies use ordinary `.html` links and literal relative return links such as `../index.html#work`; keep these exact literals. The five case studies are OpenVitals, Maker’s Row, Guestay, QuickTake Health and RoundHere. Additional work includes the Staffing & Workforce Platform without a case-study URL. OpenVitals has an internal contact action rather than an external product URL. The work sample must use its actual available links. Do not invent client names, destinations, previous/next labels, thermal metrics or status readings.

The working home contains unpublished cinema markup, CSS, JS, poster and videos, and a separate cybersecurity image file. The public home and committed source still use the prior hero and a stricter media directive. These differences predate Stage A. The files are outside the Stage A commits. Preserve their baseline separately when continuing in a fresh checkout.

## Metadata and security

All pages have a document CSP that permits same-origin external scripts and styles, blocks inline script and style, and sets `font-src 'none'`. The public home returned no HTTP CSP header. Source metadata, including canonical, social cards, referrer policy and title, is recorded per page. No OG image is declared on the home page. Asset versioning mixes plain filenames with `?v=…` revision values. New preview assets are versioned.

**Approval needed for Stage B.** Replace only `font-src 'none'` with `font-src 'self'` in the six production documents to permit local Plex fonts. The preview uses its own same-origin font policy. The alternative is the system fallback on production pages. No hosting change is needed. No existing CSP was edited.

## Where to continue

Start with [the Stage A report](REPORT.md). `preview/index.html` is the review page. `tools/parts.py` owns the SVG footprints and materials. `tools/board.py` owns the placement table, wide copper and portrait assembly. `tools/build_preview.py` builds static HTML and the placement CSS. The same definitions power both boards, their enlarged samples and the seated cards. A six-slot rack includes the additional staffing project. The Maker’s Row card has three diagonal markings in its slot and on the enlarged chip. The thermal readout uses bars without claiming a temperature.

The wide PCB drawing is 810 × 568 design units. Narrow and tall layouts use the same footprints in chapter order on a routed backplane. On short landscape phones the CPU comes into view first. The cap on the entire composition is 100 rem. The two prototype chapters use local anchors. Links to chapters without excerpts resolve to the existing portfolio, as do the case-study links. The memory strip has a preview-local `#stack` target. Long case-study prose uses a 70ch measure. The hero introduction and component columns use the available width.

The default finish ignores the OS preference. A same-origin parser-blocking head script reads storage before body markup and sets the native color scheme and browser theme color. With scripting disabled, the system color keyword `Canvas` follows the light native canvas. The choice persists under the key `ru-x1-finish`. Storage failures fall back to document-local switching. The 160 ms fade is enabled only on a user or storage change. The switch reserves its space while it binds. Both font preloads match their CSS URLs and use optional display to avoid a late swap. The two Latin WOFF2 files total 60,420 bytes. Sans is variable. Mono is regular. Both carry the IBM SIL Open Font License.

### Source content and imagery

| Area | Inventory retained for Stage B |
|---|---|
| Identity and stack | Name, title, headline, bio, location, experience proof, OpenVitals link, CTA subjects, two-page CV and the five stack tags |
| Selected work | OpenVitals, Maker’s Row, Guestay, QuickTake Health, RoundHere and additional staffing work, including contribution disclosures, captions and image links |
| Engineering and SI | Three service blocks and three workflow blocks with their tags, descriptions and contact actions |
| Experience | Employment, past contracts, role enquiries and education in their existing order |
| Process | Three roles, plus the individual captions, workflow labels and feedback language in the original diagrams |
| Cybersecurity | Venture status, authorization and scope, evidence and retesting, coordinated disclosure, and enquiry link |
| Reading and fitness | Two books with subtitles, authors and edition details, three training entries, and Strava assets and destination |
| Contact and footer | Project, role, workflow and venture mailto subjects, plain email, telephone, LinkedIn, CV and return navigation |
| Five case studies | Each document’s headings, section IDs, original figures, metadata, actions and related-project links are recorded separately |

The source manifest counts direct references. The two collaboration diagrams, the marketplace, rental, live-events and kiosk illustrations also have art embedded inline in the documents. A blank direct-reference list is insufficient evidence for deleting an asset. OpenVitals has a linked full-size SVG. Its original download URL matters. The white Strava wordmark and echelon nearly disappear on the white mask. Place their original files on a dark component panel in Stage B. Keep the original diagrams on readable framed panels wherever pale captions need a dark field. The old green favicon decision is in the report.

### Reproduce

Run from the repository root. The Python generator and inventory use the standard library. Browser QA uses tools outside the checkout. This run used Playwright 1.65.1, Lighthouse 13.6 and installed Chrome and Edge channels, alongside Playwright Firefox and WebKit. There is no project package manifest or deployment step for them.

```sh
PYTHONDONTWRITEBYTECODE=1 python3 redesign/tools/build_preview.py
python3 -m http.server 4187 --bind 127.0.0.1
```

Open `http://127.0.0.1:4187/redesign/preview/`. In a second shell:

```sh
qa_modules=/private/tmp/ru-x1-qa/node_modules
preview_url=http://127.0.0.1:4187/redesign/preview/
matrix_output=/private/tmp/ru-x1-review-output
python3 redesign/tools/check-materials.py
node redesign/tools/check-source.mjs "$qa_modules" "$preview_url"
node redesign/tools/check-interactions.mjs "$qa_modules" "$preview_url"
node redesign/tools/lighthouse.mjs "$qa_modules" "$preview_url"
NODE_PATH="$qa_modules" node redesign/tools/matrix.cjs "$preview_url" "$matrix_output" --capture
```

On a new machine supply an external QA directory with Playwright, its Firefox and WebKit browsers, Lighthouse and puppeteer-core. Run `inventory.py --output /path/to/new.json` for a fresh source snapshot. The baseline is frozen. Compare new captures to it before any production markup changes. The staged branch contains work under `redesign/` and the original user-owned working changes stay in the checkout. The gallery lives outside the repository.

### Final material values

The source of all authored presentation paint is `preview/tokens.css`. Both finishes retain the requested numerical values. The measured table, including 56 thresholded pairs, is in `evidence/materials.json`.

| Token | Light | Dark |
|---|---|---|
| `surface` | `#FFFFFF` | `#0A0A0B` |
| `surface-2` | `#F7F5FC` | `#141416` |
| `line` | `#E4DFF0` | `#2A2A2F` |
| `ink` | `#15131A` | `#F3F1E7` |
| `ink-2` | `#45414F` | `#BDBAAE` |
| `ink-3` | `#696475` | `#8F8C80` |
| `accent` | `#6D28D9` | `#FFD21A` |
| `accent-strong` | `#5B21B6` | `#FFE066` |
| `accent-soft` | `#EFEAFE` | `#2B2507` |
| `on-accent` | `#FFFFFF` | `#0A0A0B` |
| `trace` | `#8B5CF6` | `#C9A30D` |
| `metal-1` | `#D5D7DD` | `#2E2E33` |
| `metal-2` | `#A3A8B3` | `#4A4A51` |
| `metal-3` | `#6F7480` | `#77777F` |
| `component` | `#1C1A22` | `#1B1B1E` |
| `component-mark` | `#F4F2FA` | `#BDBAAE` |
| `led` | `#C4B5FD` | `#FFD21A` |
