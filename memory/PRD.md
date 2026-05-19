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

## Implemented (Feb 2026 — Real product catalog phase 1)
- ✅ 10 real products live across 10 brands (added 2 new brands: **Puma**, **Amiri**)
- ✅ All products use the new image gallery (1 hero + 4 angles) and dual EU/US sizing where applicable
- ✅ Catalog brand filter auto-populates from real product data (dynamic via `/api/brands`)
- ✅ Featured products auto-surface on homepage hero grid

### Real catalog inventory
| # | Product | Brand | Price | Sizes | Tag |
|---|---|---|---|---|---|
| 1 | NB 471 'Tan Suede' | New Balance | $180 | EU 36–45 / US 4–11 | — |
| 2 | Nike AF1 × Supreme 'Sail Box Logo' | Nike | $320 (was $500) | EU 40–45 / US 7–11 | Limited · Featured |
| 3 | Puma Speedcat OG 'Forest Green' | Puma | $200 | EU 36–45 / US 4–11 | New Drop |
| 4 | Junya Watanabe × NB 471 | New Balance | $220 | EU 40–45 / US 7–11 | Limited · Featured |
| 5 | Yeezy Boost 700 'Inertia' | Yeezy | $310 | EU 40–45 / US 7–11 | Hot · Featured |
| 6 | Air Jordan 4 Retro 'Lightning' | Air Jordan | $380 (was $600) | EU 40–45 / US 7–11 | Limited · Featured |
| 7 | Amiri MA-1 'White / Black' | Amiri | $810 | EU 37–45 / US 5–11 | Luxury · Featured |
| 8 | Air Jordan 11 Retro 'Bred' | Air Jordan | $300 | EU 40–46 / US 7–12 | Hot · Featured |
| 9 | Balenciaga Stapler Sneaker 'Black' | Balenciaga | $900 | EU 40–45 / US 7–11 | Luxury · Featured |
| 10 | Off-White 'Crossed Arrows' Oversized Tee | Off-White | $80 | M / L / XL / XXL | Hot |

## Backlog / Next
- P0: Replace remaining 24 Unsplash placeholder products with real photos (continue uploading in batches)
- P0: Consider removing/hiding placeholder products once real catalog reaches critical mass
- P1: Real payment integration (Stripe) — deferred per user ("Hostinger will connect us to Stripe at migration")
- P2: Wishlist + size guide modal (especially helpful for EU/US conversion)
- P2: Search with autocomplete
- P2: Order status updates (admin can mark shipped/delivered → triggers email)
- P2: Multi-tier referral milestones (e.g., refer 3 → free shipping month)
- P2: "Authenticity Verified" lightbox on product page (trust signal for dropshipping)
- P2: "View Order Online" button in confirmation email (links to /order/:orderNumber)
