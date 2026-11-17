# RU-X1 · Stage A

The source for this preview is the working checkout of 18 November 2026, based on commit `94469861f604ec60e365d5fdef19646ac1680976`. The frozen inventory is in `baseline/source.json`. It records normalized text in source order, including closed disclosures and SVG text, copy grouped by section, original hrefs with all attributes, IDs, image descriptions, metadata, and asset hashes and references. A rendered baseline supplements this source inventory.

## Publishing and ownership

GitHub's Pages API reports legacy branch publishing from `main:/`, with the custom domain `ranausman.dev`. The site is six hand-authored HTML files, local CSS and vanilla JS. There is no package manifest, build command, workflow, header configuration, repository AGENTS.md, or repository skill. A root `404.html` is supported by this host. Working material lives on the local redesign branch. Before promotion in Stage B, move the preview, scripts, notes, evidence and baseline out of the published tree. The production asset paths will be selected in Stage B.

The eleven requested home anchors exist. Case studies use ordinary `.html` links and literal relative return links such as `../index.html#work`; keep these exact literals. The five case studies are OpenVitals, Maker’s Row, Guestay, QuickTake Health and RoundHere. Additional work includes the Staffing & Workforce Platform without a case-study URL. OpenVitals has an internal contact action rather than an external product URL. The work sample must use its actual available links. Do not invent client names, destinations, previous/next labels, thermal metrics or status readings.

The working home contains unpublished cinema markup, CSS, JS, poster and videos, and a separate cybersecurity image file. The public home and committed source still use the prior hero and a stricter media directive. These differences predate Stage A. The files are outside the Stage A commits. Preserve their baseline separately when continuing in a fresh checkout.

## Metadata and security

All pages have a document CSP that permits same-origin external scripts and styles, blocks inline script and style, and sets `font-src 'none'`. The public home returned no HTTP CSP header. Source metadata, including canonical, social cards, referrer policy and title, is recorded per page. No OG image is declared on the home page. Asset versioning mixes plain filenames with `?v=…` revision values. New preview assets are versioned.

**Approval needed for Stage B.** Replace only `font-src 'none'` with `font-src 'self'` in the six production documents to permit local Plex fonts. The preview uses its own same-origin font policy. The alternative is the system fallback on production pages. No hosting change is needed. No existing CSP was edited.
