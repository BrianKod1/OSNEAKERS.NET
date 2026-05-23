# OSneakers — Premium Sneaker Dropshipping (PRD)

## Original problem statement
Build a futuristic yet simple e-commerce website for OSneakers (currently osneakers.net) — premium dropshipping platform for sneakers and high-end apparel.

Design: dark mode, glassmorphism, neon (electric blue + cyber lime) hover accents, minimalist typography, futuristic streetwear boutique aesthetic.

Core pages: Home (floating sneaker hero), Catalog (brand/price filters & sort), Product Detail (Buy Now), About Us (7 years experience, Ontario, Canada), Reviews (fulfillment proof), Contact footer (osneakers9@gmail.com / +12896007311).

## Architecture
- **Backend**: FastAPI + MongoDB (motor). Routes prefixed `/api`. Auto-seeds 24 products + 6 reviews on first startup.
- **Frontend**: React 19 + Tailwind + shadcn/ui + react-router-dom. CartContext (localStorage). Sonner toasts.
- **Fonts**: Outfit (display) + Manrope (body) + JetBrains Mono (tech labels).
- **Palette**: True black `#050505` background, cyan `#00E5FF`, lime `#CCFF00`.

## User personas
- Sneaker collector hunting grails / hyped drops
- Streetwear shopper looking for premium apparel
- First-time buyer needing trust (reviews, authenticity messaging)

## Core requirements (static)
- Public storefront (no auth, no payment integration — mock checkout only)
- 5 sections: Home, Catalog, Product, About, Reviews
- Brand pills: Air Jordan, Nike, Adidas, Yeezy, Balenciaga, Off-White, New Balance, Apparel
- Cart drawer + mock checkout form submitting to POST /api/orders
- Contact in footer: osneakers9@gmail.com, +1 289-600-7311, Ontario, Canada

## Implemented (Feb 2026 — initial MVP)
- ✅ FastAPI backend with products, brands, reviews, orders endpoints + filters/sort
- ✅ Seeded 24 products across 8 brands, 6 verified reviews with fulfillment photos
- ✅ Home page: hero, marquee, featured grid, brand pills, value props, review preview
- ✅ Catalog: brand filter sidebar, price range slider, sort (featured/new/price asc/desc), mobile filters drawer
- ✅ Product detail: image, sizes, Buy Now CTA, related products
- ✅ About: 7-years story timeline, four pillars, stats, CTA
- ✅ Reviews: full grid with verified badges and fulfillment images
- ✅ Cart drawer with quantity controls + checkout form + order confirmation
- ✅ Sticky glassmorphism navbar with animated cart count
- ✅ Footer with email/phone/Ontario contact, large CTA
- ✅ Dark theme + cyan/lime neon accents + animated floats & marquee

## Implemented (Feb 2026 — Resend production sender)
- ✅ `SENDER_EMAIL` updated to `noreply@osneakers.net` in `/app/backend/.env`
- ✅ Backend restarted cleanly (apscheduler crons re-armed: weekly digest + credit reminders)
- ✅ Verified via `/api/subscribe` → `email_sent: true`, no Resend errors in logs
- ✅ Production emails (welcome, order confirmation, weekly digest, credit reminders) now send from verified domain

## Implemented (Feb 2026 — Backend modular refactor + Order History)
- ✅ Split `server.py` (1053 lines monolith) into clean modules:
  - `config.py` (env vars), `database.py` (Mongo client), `models.py` (Pydantic)
  - `email_templates.py` (HTML templates), `services.py` (helpers + jobs), `seed.py`
  - `routes/{products,reviews,orders,subscribe,referrals,account,admin}.py`
- ✅ `server.py` slimmed to 86 lines — pure entry point (middleware + router wiring + scheduler bootstrap)
- ✅ All endpoints verified: products, brands, reviews, orders, account, admin overview, referral, validate-discount
- ✅ New endpoint: `GET /api/account/{email}/orders/{order_number}` (scoped order fetch with ownership check)
- ✅ Customer Order History redesigned in AccountPage — expandable rows showing items with thumbnails, subtotal, discount/credits breakdown, ship-to address, status badge
- ✅ New dedicated **OrderDetailPage** (`/order/:orderNumber`) — full receipt view with status badge, items, breakdown, ship-to, "what's next" CTA, support footer
- ✅ Backend lint clean (ruff), frontend lint clean (eslint)

## Implemented (Feb 2026 — First real product + Gallery feature)
- ✅ Added **New Balance 471 'Tan Suede'** — $180, EU 36–45 with dual EU/US sizing, 5 product photos (1 hero + 4 gallery)
- ✅ Built product image gallery: thumbnail strip below hero, click-to-swap with neon cyan focus state and fade-up animation
- ✅ Size selector now adapts to dual EU/US sizes (smaller font + 5-col grid + "EU / US" label) and falls back to original US grid for legacy products
- ✅ `ProductUpsert` schema extended to accept `gallery: List[str]` so admin API can write multi-image products
- ✅ Test order email delivered to brian.kodawa@gmail.com (`OS20260518687F2D`) — Resend confirmed `email_sent: true`

## Implemented (Feb 2026 — Hostinger migration prep)
- ✅ Updated reviews — replaced 6 placeholder reviews with 4 real names (Brenda Kodawa, Scott, Tom White, Adrian Omanga) matched to real catalog products
- ✅ Successfully exported MongoDB via mongodump (6 collections, 45 documents) → restored into MongoDB Atlas free tier (M0 cluster) under new DB name `osneakers`
- ✅ Created deploy kit at `/app/deploy/`:
  - `README.md` — full step-by-step Hostinger VPS deploy guide (Ubuntu 22.04, Nginx, Certbot, systemd)
  - `nginx.conf` — production reverse proxy with gzip, asset caching, React Router fallback
  - `deploy.sh` — one-command update script (git pull → rebuild → restart)
  - `backend.env.template` + `frontend.env.production.template` — env file scaffolds
- ✅ Temporary `/api/_export/db_backup.zip` endpoint added then removed after migration complete
- ✅ User now has: Atlas cluster live with 45 docs, mongorestore confirmed 0 failures, deploy bundle ready in repo

## Implemented (May 2026 — Stripe Hosted Checkout)
- ✅ Replaced mocked checkout with real **Stripe Hosted Checkout** (CAD)
- ✅ New `POST /api/checkout/session` — server-side compute (subtotal, discount, credits, shipping), creates Stripe session via `emergentintegrations`, persists pending `Order` + `payment_transactions` doc
- ✅ New `GET /api/checkout/status/{session_id}` — polls Stripe (direct SDK, bypasses upstream lib pydantic bug, retries for proxy eventual consistency); idempotent `_fulfill_order` (transaction `fulfilled` flag prevents double email / double credit debit)
- ✅ New `POST /api/webhook/stripe` — signature verified via `StripeCheckout.handle_webhook`, re-fetches authoritative status, fulfills
- ✅ Shipping rules: **$15 CAD flat, FREE over $100 CAD** (config-driven: `SHIPPING_FLAT_RATE`, `SHIPPING_FREE_THRESHOLD`)
- ✅ Discount codes (SNEAK10, campaign codes, referral codes) + store credits applied BEFORE Stripe redirect (price never trusted from frontend)
- ✅ Pending order created BEFORE redirect (visible in admin, marked paid after webhook/status confirmation)
- ✅ Frontend: `CartDrawer` "PAY WITH STRIPE" button redirects to checkout URL; cart preview shows shipping line + free-shipping nudge + CAD badge
- ✅ Frontend `/checkout/success` polls status (StrictMode-safe), shows order summary + referral block on confirm
- ✅ Frontend `/checkout/cancel` — "no charge made" page
- ✅ NewsletterPopup suppressed on `/checkout/*` routes
- ✅ `/app/deploy/backend.env.template` updated with `STRIPE_API_KEY` + shipping config placeholders for VPS
- ✅ Backend tested 15/15 pytest cases (`/app/backend/tests/test_checkout_stripe.py`)
- ✅ Frontend e2e verified: cart → Stripe redirect, cancel page, success page polling (8 attempts then error state on bad session)

## Implemented (May 2026 — Wallets + Stripe Tax wiring)
- ✅ Refactored `create_checkout_session` to use **direct stripe SDK** (was emergentintegrations wrapper) — unlocks `automatic_tax`, wallets, and future Stripe features
- ✅ Apple Pay & Google Pay surface automatically through `payment_method_types=['card']` once enabled in the user's Stripe Dashboard (Settings → Payment Methods) — zero code change needed beyond that
- ✅ Stripe Tax wired and gated behind `STRIPE_TAX_ENABLED` env var (default `false`). When `true`, sends `automatic_tax: {enabled: true}` + `billing_address_collection: 'required'` + `customer_creation: 'always'`
- ✅ Line item now uses descriptive product name (`OSneakers order OS{number}`) for cleaner Stripe receipts
- ✅ `customer_email` pre-filled so customers don't re-enter email at Stripe
- ✅ `deploy/backend.env.template` documents Stripe Tax + Wallets activation steps
- ✅ Backend tests still 15/15 pass after refactor

## Implemented (May 2026 — Abandoned-cart recovery)
- ✅ Hourly scheduler job `run_abandoned_cart_recovery` (runs at :15 every hour) — finds pending orders 1h–24h old without `paid_at`, sends recovery email with **COMEBACK5** code (5% off)
- ✅ New `COMEBACK5` discount code wired into `resolve_discount` (type=`recovery`, 5%)
- ✅ New email template `abandoned_cart_html` — dark neon design matching brand, shows abandoned items + big code + "FINISH CHECKOUT" CTA
- ✅ Order schema extended with `recovery_email_sent` + `recovery_email_at` (idempotent — never sends twice)
- ✅ Manual trigger endpoint `POST /api/admin/abandoned-cart-recovery` (admin passcode required)
- ✅ Admin overview enriched: `paid_orders`, `pending_orders`, `recovered_orders` counts (paid AFTER recovery email = recovered conversion)
- ✅ End-to-end tested: created stale order, backdated 2h, triggered job → 1 email sent via Resend, second trigger correctly returns 0/0 (idempotent)

## Implemented (May 2026 — Fulfillment + Tiered Recovery + Authenticity)
- ✅ **Ship & Track flow**: new `POST /api/admin/orders/{n}/ship` accepts carrier + tracking #, auto-generates tracking URL for major carriers (Canada Post, UPS, FedEx, DHL, Purolator, USPS), sends on-brand `shipped_html` email via Resend, updates order status to `shipped`
- ✅ `POST /api/admin/orders/{n}/resend-shipped-email` to re-send tracking email
- ✅ `GET /api/admin/orders?status=` for filterable order list
- ✅ New `AdminOrdersManager.jsx` component on `/admin` page with status filters (paid/pending/shipped/all), modal-driven SHIP action, tracking link display, RESEND EMAIL button
- ✅ Admin stats expanded: PAID, PENDING, RECOVERED counts visible at a glance
- ✅ **Tiered abandoned-cart recovery** (3-touch sequence):
  - Touch 1: 1–6h old, stage 0 → `COMEBACK5` (5%)
  - Touch 2: 12–24h old, stage 1 → `COMEBACK10` (10%)
  - Touch 3: 24–48h old, stage 2 → `SHIPFREE` (free shipping)
  - Per-tier candidate/sent counts returned by admin endpoint
  - `recovery_stage` flag on Order prevents tier skipping/duplication
- ✅ `SHIPFREE` discount code actually waives shipping at checkout (`_resolve_amounts` honors `type='free_shipping'`)
- ✅ Admin "CART RECOVERY" button next to digest/credit reminder for manual trigger
- ✅ **Authenticity Verified lightbox**: new `AuthenticityLightbox.jsx` component on ProductPage — interactive modal with 4-step verification process (100-point inspection → brand-verified sourcing → tamper-sealed packaging → 30-day authenticity guarantee), "100% REAL OR YOUR MONEY BACK" headline, CTA close button. Replaces the static AUTHENTIC perk tile.
- ✅ 34/34 backend pytest pass (added `test_fulfillment_and_recovery.py` — 10 new tests covering ship endpoints, tier 1/2/3 recovery, idempotency, SHIPFREE)
- ✅ Backend lint clean, frontend lint clean

## Backlog / Next
- P0: User flip `STRIPE_TAX_ENABLED=true` on VPS .env AFTER enabling Stripe Tax + registering for HST/GST/PST in Stripe Dashboard
- P0: User enable Apple Pay + Google Pay in Stripe Dashboard → Payment Methods (one-click toggle)
- P0: User add Stripe webhook in dashboard pointing to `https://osneakers.net/api/webhook/stripe` (event: `checkout.session.completed`)
- P2: Wishlist + size guide modal
- P2: Search with autocomplete
- P2: Order status updates (admin can mark shipped/delivered → triggers tracking email)
- P2: "Authenticity Verified" lightbox on product page
- P2: "View Order Online" button in confirmation emails
- P2: Multi-tier referral milestones
