# Enterium marketing site

Dependency-free static site: plain HTML + one shared CSS file + one shared JS file.
No build step, no npm, no frameworks.

**Visual world:** the "canon" light B2B category standard — white surfaces, near-black
ink, single indigo accent (`#4338ca`), Geist / Geist Mono, hairline rules, dark band
only for metrics and the final CTA. The old dark HUD theme is gone (anti-reference);
do not reintroduce it.

## Files

```
site/
├── index.html            # Home (canon reference page — match it)
├── audit.html            # AI-Visibility Audit offer page
├── snapshot.html         # Free AI-Visibility Snapshot (lead form, hero right column)
├── method.html           # Method / trust page
├── privacy.html          # Privacy policy (DRAFT — pending legal review)
├── terms.html            # Terms of service (DRAFT — pending legal review)
├── 404.html              # On-brand not-found page (noindex)
├── robots.txt            # allow all + sitemap reference
├── sitemap.xml           # 6 URLs (placeholder domain)
├── assets/
│   ├── canon.css         # shared stylesheet (all pages)
│   ├── main.js           # nav toggle, scroll reveals, form handling, GA4 stub
│   ├── favicon.svg       # brand mark (indigo rounded square, white dot)
│   ├── apple-touch-icon.svg
│   ├── og-image.svg      # 1200x630 social card (see note below)
│   └── cockpit.png       # product screenshot used on the homepage — keep
└── README.md
```

## Deploy

Any static host works — no build:

- **Cloudflare Pages / Netlify / Vercel:** point at this directory, build command: none, output dir: `/`.
  Configure `404.html` as the not-found page (default on Netlify/Cloudflare Pages).
- **Nginx:** `root /path/to/site;` with `try_files $uri $uri/ /404.html;`.
- **Local preview:** `python3 -m http.server 8080` from this directory.

## Placeholder inventory (replace before launch)

| Placeholder | Where | Notes |
|---|---|---|
| `https://enterium.ai/` | canonical/og URLs in all HTML, robots.txt, sitemap.xml, JSON-LD | Placeholder domain. Search-and-replace across the directory. |
| `hello@enterium.ai` | footers, privacy.html, terms.html | Placeholder contact email. Point at a real mailbox. |
| `G-XXXXXXXXXX` | commented gtag snippet in each page `<head>`, `assets/main.js` | Real GA4 measurement ID. |
| `og-image.svg` | `og:image` / `twitter:image` on all pages | **SVG is not supported as an og:image by most platforms** (Facebook/LinkedIn/X want PNG/JPG). Render a 1200×630 PNG from this SVG before launch and update the URLs. Same caveat for `apple-touch-icon.svg` (Apple expects PNG). |

## Legal pages

`privacy.html` and `terms.html` are **plain-language drafts pending legal review**
(marked visibly at the top of each page with `.banner-draft`). Do not remove the
draft banner until a lawyer signs off. Terms deliberately leave governing law open.

## Wiring the snapshot form to a real endpoint

The form on `snapshot.html` currently runs in **demo mode**: on submit it validates,
shows the loading state, waits 900 ms, logs the payload to the browser console, and
shows the success state. Nothing leaves the browser.

To point it at a real backend:

1. Set the `data-endpoint` attribute on the form in `snapshot.html`:

   ```html
   <form class="form" id="snapshot-form" data-snapshot-form
         data-endpoint="https://api.example.com/snapshot" novalidate>
   ```

2. The endpoint receives a `POST` with `Content-Type: application/json`:

   ```json
   {
     "website": "yourcompany.com",
     "category": "IPv4 address leasing",
     "competitors": "Acme Corp, Globex",
     "email": "you@yourcompany.com",
     "buyer_question": "…or null"
   }
   ```

3. Any 2xx response shows the success state; non-2xx or network failure shows the
   inline error state with a retry button. Formspree/Basin-style endpoints work
   out of the box.

Note: all "Book the AI-Visibility Audit" CTAs currently land on `snapshot.html` —
the snapshot form is the only conversion layer. If a booking calendar or sales
inbox is introduced, repoint those CTAs.

## Analytics (GA4)

GA4 is a **placeholder** and intentionally not loaded:

- Each page's `<head>` contains a commented-out gtag snippet with the placeholder
  ID `G-XXXXXXXXXX` and a consent-mode default of `denied` for
  `analytics_storage` and `ad_storage`.
- `assets/main.js` exposes `window.ENTERIUM_ANALYTICS.init(consentGranted)` which
  refuses to load while the ID is still the placeholder, and only loads when
  called with `consentGranted === true`.

To enable:

1. Replace `G-XXXXXXXXXX` in every HTML file and in `assets/main.js` with your
   real measurement ID.
2. Uncomment the two `<script>` blocks in each page's `<head>`.
3. Keep the consent-mode default `denied`; call
   `gtag('consent', 'update', { analytics_storage: 'granted' })` from your consent
   banner before any pageview config — **analytics must fire only after consent**.

## Conventions

- No dependencies, ever. If you need a build step, this is the wrong directory.
- One `<h1>` per page; eyebrows, stat labels and microcopy use Geist Mono (`--mono`).
- Reveal-on-scroll: add `class="reveal"` and an inline `style="--i:N"` stagger index.
- Section rhythm alternates white / `section.soft` (light gray); the dark band is
  reserved for the metrics band and `.cta-final` panels. Buttons on dark panels use
  `.btn-on-dark`.
- Hero on offer pages: `<section class="hero wrap">` with `.hero-inner` left and a
  supporting panel right (white `.offer` panel or `.note` callout).
- Content rules: brand is "Enterium" (never the legacy repo spelling); no fictional
  stats — only the sourced numbers from the approved copy files; no emojis, no
  testimonials, no named-competitor user quotes.
