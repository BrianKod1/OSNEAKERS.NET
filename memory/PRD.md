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

## Backlog / Next
- P0: User-supplied real product images
- P1: Real payment integration (Stripe) — deferred per user ("Hostinger will connect us to Stripe at migration")
- P1: Customer order history page (currently only credits visible in Account)
- P2: Refactor `server.py` into `/app/backend/routes/`, `/models/`, `/services/` modules
- P2: Wishlist + size guide modal
- P2: Search with autocomplete
