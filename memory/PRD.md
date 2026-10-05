# Keneth Global — E-commerce PRD

> Current source of truth: see **Storefront changes — 2026-09-12** below. Earlier backlog and test counts are historical; several listed gaps (wishlist, search, galleries, journal) were already implemented before this change.

## Original problem statement
A modern e-commerce website for Keneth Global — an Indian company exporting to Europe. Deals in home decor (decorative cloth), Indian spices ("masalas"), and (added later) artificial jewelry. Website must be multi-language (English + EU languages) and "very beautiful". Full e-commerce with cart + Stripe checkout + admin panel + AI-generated product photography.

## User personas
- **European home-goods shopper** — buys premium spices, textiles, artisan jewelry as gifts / for their own home.
- **Storefront admin** — Keneth Global staff managing products, orders, image regeneration.

## Architecture
- **Frontend**: React 19 + Tailwind + Shadcn UI, react-router-dom v7, sonner for toasts, Cormorant Garamond + Outfit fonts, dark cinematic editorial theme (ink-900 + brass-400 gold accent).
- **Backend**: FastAPI + Motor async MongoDB. JWT (7d) + bcrypt password hashing. All routes under `/api`.
- **Payments**: Stripe via `emergentintegrations` (Flow B — India country not SMP-eligible; using `STRIPE_API_KEY=sk_test_emergent`). Webhook at `/api/webhook/stripe`.
- **AI images**: Gemini Nano Banana (`gemini-3.1-flash-image-preview`) via `emergentintegrations` LlmChat + Emergent LLM key. Auto-generates hero images for all seed products on startup, saved to `/app/backend/static/products/` and served via `/api/static/*`.
- **i18n**: In-memory JS dictionary for EN / DE / FR / ES / IT (5 languages).

## Verticals (3)
1. **Indian Spices** (6 products) — Garam Masala, Kashmiri Chilli, Turmeric Gold, Green Cardamom, Biryani Masala, Chai Masala.
2. **Home Decor** (6 products) — Bedsheet, Cushion Covers, Table Runner, Wall Hanging, Pillow Covers, Dining Sheet.
3. **Artificial Jewelry** (5 products) — Kundan Choker Set, Polki Jhumka Earrings, Meenakari Bangles, Temple Long Haram, Oxidised Ring Stack.

## What's been implemented (2026-02)
- Full storefront: Home → Shop → Product Detail → Cart → Checkout (Stripe) → Success/Cancel → Account/Orders
- JWT auth with admin seeding (admin@kenethglobal.com / Admin@Keneth2026)
- Admin panel with stats (revenue, orders, products, users), products list w/ regenerate-image, orders list, customer list
- 17 AI-generated luxury product photos via Nano Banana
- Multi-language switcher in header — EN/DE/FR/ES/IT
- Custom SVG monogram logo ("K" as woven wheat stem + fabric ribbon) — used in header, footer, favicon
- Responsive layout with mobile menu, mobile-first grid, marquee announcement bar, glass sticky header
- Cart persistence via localStorage; Stripe test card 4242…
- 22/22 backend pytest suite passing

## Prioritized backlog
- **P1 · Wishlist / saved items** — currently no wishlist feature
- **P1 · Product image gallery** — currently one image per product; multi-image gallery with thumbnails
- **P1 · Search bar in header** — no search UI yet (backend `/api/products?q=` exists)
- **P2 · Product reviews & ratings**
- **P2 · Blog / journal section** ("Craftsmanship" stories)
- **P2 · Newsletter integration** (currently visual only — needs email capture backend)
- **P2 · About / Contact / Shipping / Returns pages** (currently footer links go to placeholders)
- **P2 · Guest checkout email capture** — currently email only if logged in
- **P3 · Product variants** (size / color for textiles)
- **P3 · Wishlist → order gift note**
- **P3 · Better mobile search UX**

## Known limitations
- Stripe using shared test key `sk_test_emergent` — user can swap for real key in `.env` when going live. Because Keneth Global is India-based, Flow A claimable sandbox is not available (Stripe doesn't support IN merchants directly).
- Newsletter form is visual only.
- Footer links (About / Craftsmanship / Contact) are placeholders; no dedicated pages yet.

## Deployment (2026-06)
- Delivered archive `noida-ecom-main.zip` merged into /app (backend + frontend + 48 curated PNGs).
- Env configured in backend/.env: MONGO_URL, DB_NAME (local preview), JWT_SECRET (strong), STRIPE_API_KEY=sk_test_emergent, EMERGENT_LLM_KEY, ADMIN_EMAIL/PASSWORD, CORS_ORIGINS restricted to frontend domain.
- Startup now runs reconcile_static_images() to reuse the 48 bundled PNGs (products + journal covers) instead of regenerating via LLM (zero LLM spend); auto-gen only fills genuinely missing images.
- Added GET /api/health (DB ping).
- Verified: 28/28 backend pytest pass; frontend E2E (home, shop, product, cart->Stripe redirect, admin dashboard, language switch) pass; deployment_agent readiness = PASS.
- Go-live TODO: swap Stripe test key for a live key; consider Atlas managed DB + backups for real production.

## Deployment prep (2026-06)
- App imported from `noida-ecom-main.zip` into live workspace; running clean (backend healthy, 17 products seeded, bundled static images serve over HTTPS).
- Env wired: JWT_SECRET (rotated/strong), STRIPE_API_KEY=sk_test_emergent (TEST mode), EMERGENT_LLM_KEY, ADMIN_EMAIL/PASSWORD, CORS_ORIGINS locked to frontend domain (no "*").
- Backend verified: 42/42 pytest pass — auth boundaries, server-side Stripe amount calc, admin RBAC, webhook signature rejection, order flow all confirmed. Deployment-readiness scan: PASS.
- Homepage readability pass: lifted near-black (#0A0A09) base to warmer charcoal (#14120E), brightened bone text palette + muted tokens, strengthened hero/vertical-card overlays with text-shadow, fixed faint marquee/nav text.
- Still in TEST payment mode — switch to live Stripe keys only after an end-to-end order on the deployed URL (Phase 5).

## Homepage restructure (2026-06)
- New section order: Hero → About Us (new) → Three Houses → Featured this season (now includes spices) → Category showcases (new: Indian Spices, Artificial Jewelry, Home Decor; Christmas Decor auto-renders only when products exist) → Testimonials (new) → Press logos → Newsletter → Footer.
- Fixed Featured bucketing (was using stale vertical keys home-decor/jewelry; now masalas/home-furnishing/artificial-jewelry).
- Testimonials + About copy are static English (not yet in i18n dictionary).

## Christmas products added (2026-06)
- Seeded 4 christmas-decor products (total catalog 17 -> 21): christmas-beaded-ornament-set (€34, Festive), christmas-embroidered-stocking (€26, Handcrafted), christmas-zari-table-runner (€42), christmas-star-tree-topper (€38, Limited). Full 5-language names/descriptions + AI image_prompt + Unsplash image_hint fallback.
- Homepage "Christmas Decor" category showcase now renders automatically; AI images generated via Nano Banana on startup and served from /api/static.

## Seasonal + gifting features (2026-06)
- Christmas landing page at /christmas: free-shipping banner, festive hero, Christmas collection grid + gift guide (Under €30 / Statement gifts / For the host, derived from live catalog). Header/mobile nav "Christmas Decor" -> /christmas.
- Gift wrap at checkout: Cart toggle (+€5) with optional 500-char handwritten note. Backend CheckoutIn accepts gift_wrap + gift_message; €5 fee added server-side to order total and persisted on order doc (gift_wrap, gift_message) + Stripe metadata. Verified: 8.90 -> 13.90.
- i18n: added home.about.*, home.testi.* (translated quotes), home.house.*, home.shopAll/viewAll, cart.giftwrap.*, xmas.* keys to all 5 languages (en/de/fr/es/it). Home About + testimonials + category titles now fully localized (DE verified live).

## Gift preview, countdown & B2B (2026-06)
- Cart gift-wrap now shows a generated preview photo (/frontend/public/gift-wrap.jpg).
- Christmas page: live countdown "N days until Christmas" + order-by-20-Dec line (localized, /christmas).
- Product page B2B: retail (Add to Cart / Buy Now) PLUS "Business / Bulk Order" button -> modal capturing name, phone, quantity (+optional email/message). POST /api/product/enquiry (stored in bulk_enquiries, requires name+phone+quantity). Admin list: GET /api/admin/bulk-enquiries. All B2B + countdown copy translated in en/de/fr/es/it.
- PENDING: Order-confirmation email needs a provider (SendGrid/Resend/Gmail) + API key from user. Deploy is a user-triggered button (app already deploy-ready).

## Deployment import & hardening (2026-06, this workspace)
- Imported `noidaEcom2-main.zip` (Keneth Global store) into /app; preserved workspace .git/.emergent/.env protected vars.
- backend/.env reconstructed (was gitignored): MONGO_URL/DB_NAME (platform Mongo), strong JWT_SECRET, STRIPE_API_KEY=sk_test_emergent, EMERGENT_LLM_KEY, ADMIN creds, CORS_ORIGINS.
- Secrets audit: NO hardcoded keys/URIs in source; frontend uses REACT_APP_BACKEND_URL only; backend reads all config from env.
- Hardening: pinned Stripe webhook_url to server-side PUBLIC_BASE_URL env (falls back to runtime request origin so it works across preview/prod domains). handle_webhook verifies Stripe signature server-side.
- CORS: platform managed-deploy requires CORS_ORIGINS="*" (prod domain differs: {app}.emergent.host + custom domains). Safe here — auth uses Bearer tokens in localStorage, not cookies; frontend+API same-origin behind ingress.
- Verified: /api/health db ok; 21 products seeded; admin login; static PNGs serve 200; Stripe checkout session -> checkout.stripe.com; SPA deep-links no 404; 42/42 backend pytest; deployment_agent readiness = PASS.
- Known non-blocking (product decisions, not deploy bugs): EN visitors see INR-converted prices by design (lib/currency.js); top marquee strings are English-only (not routed through i18n).
- Go-live TODO: swap sk_test_emergent for a live Stripe key; the app then works on the assigned emergent.host domain automatically.

## Storefront changes — 2026-09-12

### User request / confirmed scope
- Increase the **header logo image only** by approximately 30%, leave brand text sizes unchanged. Do not compound the prior generic Logo.js enlargement.
- Remove desktop/mobile Home navigation; clicking the brand remains the home action.
- Show all live subcategories on hover under Indian Spices, Home Furnishing, Artificial Jewelry and Christmas Theme; mobile gets expandable category lists.
- Rename customer-facing Christmas Decor to **Christmas Theme** (with translated equivalents).
- Hero: multiple real products, working Buy Now, product details and story actions.
- Replace the About man photograph with a video configured through an admin video-link field.
- Preserve “Three houses. One provenance.”; replace featured spices with jewellery and women-wearing-jewellery imagery.
- Add left/right arrows and expose every product in all homepage collection rows.
- Each house shows only its own products and subcategories. Global Shop retains All plus the four houses.

### Implemented
- Header's actual Monogram changed from 56 → 73px mobile and 64 → 83px desktop. Earlier generic Logo.js sizes did not control the header. Brand text remains 20/26px and 16/22px.
- Roomier responsive header, logo-home link, no Home item, four dynamic hover menus with keyboard handling and mobile expandable submenus. Categories sourced from existing `/api/products/verticals`.
- Four-product hero (one product per house), thumbnails and previous/next controls. Buy Now adds the displayed product to cart; detail CTA opens its product page; story CTA scrolls to About.
- About photo removed; admin Homepage tab supports save, preview and remove for a public HTTPS video URL. Empty configuration shows About copy/stats without a fake player or sample film. About story link now opens existing Journal instead of an unmatched `/about` route.
- Five jewellery-only featured products plus two locally bundled, sourced editorial images of women wearing Indian jewellery. Existing product photography remains on sale-item cards.
- Reusable product carousels display all 6 spices, 5 jewellery, 6 furnishing and 4 Christmas products. Previous/next boundary disabling, touch scrolling and keyboard navigation. Product images now use contain sizing rather than cropping critical detail; context-prefixed test IDs avoid duplicates.
- House pages use `?category=...` and All resets within that house. Global `/shop?house=...` keeps all house tabs visible. Stale-request guards, empty/error/retry states added.
- Christmas landing queries only Christmas products. Its filters and all gift-guide bands are strictly scoped; menu links can go straight to its selected subcategory. Seasonal visuals/countdown retained.
- EN/DE/FR/ES/IT category labels, Christmas naming, new storefront copy and announcement translations. No longer an English-only announcement ticker.

### Architecture / reference files
- Existing React 19 + FastAPI + Motor MongoDB architecture retained. No changes to authentication, checkout or protected env configuration.
- New `/app/backend/video_settings.py`, registered in `server.py`: public GET `/api/site/about-video`; admin-only PUT/DELETE on same path using existing `require_admin`.
- Mongo `site_settings` singleton `_id: "about-video"`, fields `url`, `kind`, `updated_at`. GET projection excludes `_id`; typed Pydantic response. No startup seeding/reset of content settings.
- Accepted media: canonical privacy-enhanced YouTube embed, Vimeo public/player links (optional privacy hash), direct HTTPS MP4/WebM/OGG. Reject credentials, unsupported URLs, literal IP/local hosts and custom ports. Server never fetches supplied video URLs; no uploads, storage integration or new provider keys.
- Frontend modules: `HouseNavigation`, `CollectionFilters`, `ProductHero`, `ProductCarousel`, `HomeAbout`, `AboutVideo`, `AdminVideoSettings`, `FeaturedJewelry`, `ThreeHouses`; `lib/catalog.js`, `lib/storefrontTranslations.js`, `hooks/useCategories.js`.
- Main routes touched: Home, Shop, Christmas and Admin. Existing images/photos and dark gold/Cormorant/Outfit style preserved.

### Verification / current limitations
- Production frontend build and backend compile succeeded. External API health returns 200 / database healthy.
- `/app/test_reports/iteration_2.json`: **62/62 backend tests passed**; navigation/hero/cart actions/house and category filtering/carousels/admin save-remove/multilingual checks passed. Responsive overflow checked at 320/768/1024/1440; desktop smoke at 1920×800.
- Follow-up `/app/test_reports/iteration_2_followup.json`: investigated the reported direct-MP4 failure. The automated Chromium has **no H.264 decoder** (`canPlayType` empty), not a storage/API/host error. WebM native playback advances in admin and home; refresh persistence and UI removal verified. YouTube embed rendering passed original testing. MP4 requires a browser/codec combination supporting the file.
- Added localized format-specific video errors, retry and direct-open fallback; unsupported MP4 fallback/retry verified. No claim that H.264 playback passed in this test browser.
- Original empty About video configuration restored after testing. **Company video link still needed from the user**, entered at **Admin → Homepage → Public video link → Save video**. No sample content is published.
- Stripe remains a real integration in **TEST MODE**, not a mocked API. No payment/auth changes in this task. Existing newsletter remains visual-only; informational footer destinations still need dedicated content. No new mocked APIs.
- Test customer created by testing documented in `/app/memory/test_credentials.md`; existing admin credentials unchanged.

### Prioritized next actions
- **P0 / user verification:** review the storefront changes and enter the company About video link in Admin → Homepage. No known blocking application issue in requested scope.
- **P1:** inventory counts and atomic stock guarding; order-confirmation emails once an email service is selected; replace remaining placeholder informational pages.
- **P2 / backlog:** functional newsletter subscriptions, product reviews, textile variants and additional editorial content.
- **Suggested enhancement:** let the admin select/reorder hero and featured products for seasonal campaigns without code changes.

---

## Update — 2026-10-05 (deploy prep + content additions)

### Deployment readiness
- Project imported into workspace (React 19 + FastAPI + MongoDB e-commerce). All secrets env-driven, CORS locked to frontend origin, prod build compiles clean. Backend /api/health OK, DB seeded. Deploy pending user "confirm deploy" (first-deploy = 50 ECU).
- Payments: STRIPE_API_KEY placeholder (sk_test_emergent), webhook secret empty → checkout returns graceful 503 until real Stripe test creds provided.

### Certificate section (Home bottom)
- Added components/CertificateSection.js with Summary ⇄ Certificate toggle at bottom of Home.js.
- Summary = FSSAI Form C data (license 12726999000728 + FoSCoS ref 10260705108809121). Certificate tab = reliable fssai-page1.png preview + links to full fssai.pdf (8 pages).
- Note: user-attached "certificate (1).pdf" was actually the IEC certificate; pasted images were FSSAI Form C. Built around FSSAI per user focus.

### Catalog expansion from uploaded sourcing photos
- Added 10 new products to seed_catalog.py under vertical `masalas`:
  - whole-spices: cumin-seeds, star-anise-whole, cloves-whole, black-cardamom, cinnamon-bark, black-peppercorns
  - dry-fruits: medjool-dates, ajwa-dates
  - nuts: cashew-nuts, pistachios
- Real uploaded WhatsApp photos converted to PNG and placed in backend/static/products/ using {slug}-{hash}.png (main) and {slug}-gN-{hash}.png (gallery); auto-assigned via reconcile_static_images on startup.
- New categories (dry-fruits, nuts) appear automatically in Shop filters (data-driven via /products/verticals).
- Unused uploads (not product photos): 5 scenery/people shots (harbor/boats/sunset/two men) + 1 .mp4 video — skipped. Green-cardamom palm shot skipped (existing product already imaged).

### Backlog / next
- Provide real Stripe test key + webhook secret to enable checkout.
- Update CORS_ORIGINS / PUBLIC_BASE_URL to custom domain if one is pointed.
- Optional: translate new product copy into de/fr/es/it (currently English, tr() falls back to en).

---

## Update — 2026-10-05 (WooCommerce-style admin panel)

### Full QA pass (iteration_4)
- 40 backend tests passed, responsive (desktop 1920 + mobile 390) verified across home/shop/product/cart/checkout/certificate/admin. Zero issues.

### Admin panel — product management + image upload (iteration_5, 100% pass)
- Backend (server.py): POST /api/admin/products (create), PUT /api/admin/products/{id} (full update), DELETE /api/admin/products/{id}, POST /api/admin/upload (multipart image -> saves to static/products, returns {path,url}). All require_admin; 401/403 enforced.
- Frontend: pages/Admin.js rebuilt (icon tabs, searchable product list w/ thumbnails, Add/Edit/Delete, order status <select>), new components/admin/ProductEditor.js (modal with main+gallery image upload & preview, all product fields, active toggle, category datalist). Responsive at 390px.
- Verified: create->GET, edit price/desc persists, delete->404, upload serves via /api/static, authz. 14 backend tests in tests/test_admin_crud.py.

### Known low-priority
- Prices display in INR (₹) by default via existing i18n currency formatter; admin inputs & stores EUR exactly. Can switch default display currency to EUR on request.

### "Use as an app?" — answer given to user
- Yes: quickest = PWA (installable, offline shell); native app-store build via Capacitor wrapping the existing React build; or React Native rewrite for fully native. PWA recommended first.

---

## Update — 2026-10-05 (missing products batch + fixes)

### Diagnosis: "products not selling"
- Root cause = checkout disabled: Stripe is on a placeholder key (sk_test_emergent) with no webhook secret, so /payment/checkout/session returns 503. Customers can browse/cart but cannot pay. Awaiting user's payment-provider choice (Stripe / Razorpay / COD) to enable real selling.

### 13 new products added (catalog 31 -> 44) from "Christmas Tree Skirts.zip" (8 folders)
- artificial-jewelry: oxidised-silver-jhumka (earrings), beaded-choker-set (necklaces), pure-leather-wallet (leather-accessories NEW cat)
- christmas-decor: felt-christmas-ornament-set, jute-ball-ornaments (ornaments), velvet-embroidered-stocking (stockings), beaded-christmas-placemats (placemats NEW), embroidered-velvet-tree-skirt (tree-skirts NEW)
- home-furnishing: brass-votive-holder (candle-holders NEW), figurine-napkin-rings + carved-brass-napkin-rings + wire-mesh-napkin-rings (napkin-rings NEW), zari-work-wall-hanging (wall-hangings)
- Real uploaded photos -> PNG main+gallery in backend/static/products via {slug}-{hash}.png convention; new categories appear automatically in Shop filters.
- Skipped non-product uploads: lifestyle/model shots, a screenshot collage, a few loose napkin-holder/diya images.

### Verified (iteration_6): 18/19 backend, 100% storefront flows (shop grids, filters, detail, Add-to-Cart ₹ totals, mobile 390). 
### Fixes applied this session
- ProductDetail breadcrumb/house label mapping corrected: handled artificial-jewelry + christmas-decor (was falling back to "The Fabric House"). Verified visually.
- Known minor: jute-ball-ornaments has main image only (single clean source photo) — functional, no gallery.

---

## Update — 2026-10-05 (homepage responsive fix)

### Bug: homepage large blank vertical gaps + mobile responsiveness
- Root cause: a portrait product image (cumin-seeds) made the aspect-[4/3] card box grow to fit content (in-flow img + min-height:auto), stretching the whole grid row to ~822px -> every card became 822px tall, leaving huge black gaps. Affected masalas & artificial-jewelry carousels.
- Fix (ProductCard.js): image now 'absolute inset-0 w-full h-full object-contain' inside 'relative aspect-[4/3] overflow-hidden' box -> strict 4:3 for all images (portrait letterboxed). Added line-clamp-2 + min-h on title block so rows are uniform across sections.
- Result: homepage scrollHeight 11431 -> 10111; all four carousel tracks uniform ~398px. Verified by testing agent (iteration_7, 100% frontend): uniform image boxes at 390/768/1920, no horizontal overflow, no console errors.

### Still open
- Payments disabled (placeholder Stripe -> 503); user sent a UPI QR (SANJAY, 9953839245@axisbank) — offered to wire UPI/manual checkout, awaiting go-ahead.
- Deferred earlier requests: split jewellery folder into individual listings; add gold/green tree-skirt colour variants.
- Product images are self-hosted (/api/static); decorative hero/editorial images still use external stock URLs — can localize on request to remove all external image dependency.
- Deploy to production pending user 'confirm deploy' (lets them retire their VPS).

## Uploaded products added (2026-10-05)
- Imported owner-uploaded product photos (8 folders) as individual catalog products. Per owner: every distinct design = its own product; old grouped listings removed so nothing duplicates.
- New module `backend/uploaded_catalog.py` holds 81 individual products (UPLOADED) + REMOVED_SLUGS (11 old grouped listings). `seed_catalog.py` filters removed slugs and merges UPLOADED into CATALOG. `server.py` startup deletes REMOVED_SLUGS from DB after seeding.
- `backend/generate_uploaded_images.py` converts source photos (backend/uploaded_src/) to slug-named PNGs in static/products/ (98 PNGs); reconcile_static_images attaches them on startup.
- Catalog now 114 products: masalas 16, home-furnishing 41 (incl 28 napkin-rings, 2 curtain-holdbacks, 3 candle-holders, 3 wall-hangings), christmas-decor 39 (18 ornaments, 8 stockings, 7 coasters, 4 tree-skirts), artificial-jewelry 18 (8 necklaces, 4 earrings, 3 leather-accessories, 2 bangles, 1 ring).
- Personal/people photos and phone-screenshot grids were excluded as non-products.
- Prices set as sensible EUR defaults in line with similar items (owner can edit in Admin). Verified: all 114 products return a 200 image; new product detail pages render real photos.
