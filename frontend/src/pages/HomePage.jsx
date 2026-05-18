import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { ArrowRight, Shield, Truck, Sparkles, Star } from "lucide-react";
import { fetchProducts, fetchReviews, fetchBrands } from "../lib/api";
import { ProductCard } from "../components/ProductCard";

const HERO_IMG =
  "https://images.unsplash.com/photo-1542291026-7eec264c27ff?crop=entropy&cs=srgb&fm=jpg&w=1200&q=85";

export default function HomePage() {
  const [featured, setFeatured] = useState([]);
  const [reviews, setReviews] = useState([]);
  const [brands, setBrands] = useState([]);

  useEffect(() => {
    fetchProducts({ featured: true }).then(setFeatured);
    fetchReviews().then(setReviews);
    fetchBrands().then(setBrands);
  }, []);

  return (
    <div data-testid="home-page">
      {/* HERO */}
      <section className="relative pt-24 pb-12 lg:pt-32 lg:pb-20 overflow-hidden">
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-1/3 left-1/2 -translate-x-1/2 h-[500px] w-[500px] rounded-full bg-cyan-500/10 blur-[120px]"></div>
          <div className="absolute bottom-0 right-0 h-[400px] w-[400px] rounded-full bg-lime-500/5 blur-[100px]"></div>
        </div>

        <div className="relative mx-auto max-w-7xl px-6 lg:px-10 grid lg:grid-cols-12 gap-10 items-center">
          <div className="lg:col-span-7 animate-fade-up">
            <div className="inline-flex items-center gap-2 mb-6 px-3 py-1.5 border border-cyan-400/30 bg-cyan-400/5">
              <span className="h-1.5 w-1.5 rounded-full bg-cyan-400 animate-pulse-glow"></span>
              <span className="text-[10px] tracking-[0.3em] uppercase font-mono-tech text-cyan-300">
                NEW DROP // FW26
              </span>
            </div>

            <h1 className="font-display font-black text-white tracking-[-0.04em] leading-[0.85] text-5xl sm:text-6xl lg:text-7xl xl:text-8xl">
              STEP INTO
              <br />
              THE <span className="text-cyan-400 text-glow-cyan">FUTURE</span>
              <br />
              OF SNEAKERS.
            </h1>

            <p className="mt-8 max-w-lg text-zinc-400 leading-relaxed font-light text-base sm:text-lg">
              Premium dropshipping for the world's most-wanted sneakers and
              high-end apparel. Trusted suppliers, 100% authentic, shipped from
              Ontario worldwide.
            </p>

            <div className="mt-10 flex flex-wrap items-center gap-4">
              <Link
                to="/catalog"
                data-testid="hero-shop-btn"
                className="group inline-flex items-center gap-3 px-7 py-4 bg-cyan-400 text-black font-display font-black tracking-[0.2em] text-xs uppercase hover:shadow-[0_0_40px_rgba(0,229,255,0.6)] transition-all"
              >
                SHOP THE DROP
                <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
              </Link>
              <Link
                to="/about"
                data-testid="hero-about-btn"
                className="inline-flex items-center gap-3 px-7 py-4 border border-white/15 text-white hover:border-lime-400 hover:text-lime-400 hover:shadow-[0_0_24px_rgba(204,255,0,0.25)] font-display font-bold tracking-[0.2em] text-xs uppercase transition-all"
              >
                OUR STORY
              </Link>
            </div>

            <div className="mt-14 grid grid-cols-3 gap-6 max-w-md">
              {[
                ["7+", "YEARS"],
                ["12K+", "ORDERS"],
                ["100%", "AUTH"],
              ].map(([n, l]) => (
                <div key={l}>
                  <div className="font-display font-black text-3xl text-white">
                    {n}
                  </div>
                  <div className="text-[10px] tracking-[0.25em] uppercase text-zinc-500 font-mono-tech mt-1">
                    {l}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="lg:col-span-5 relative animate-fade-up delay-300">
              <div className="relative aspect-square max-w-[520px] mx-auto overflow-hidden">
              <div className="absolute inset-8 rounded-full bg-gradient-to-br from-cyan-500/20 via-transparent to-lime-500/10 blur-3xl"></div>
              <div className="absolute inset-12 border border-cyan-400/20 rounded-full"></div>
              <div className="absolute inset-20 border border-white/5 rounded-full"></div>
              <img
                src={HERO_IMG}
                alt="OSneakers featured sneaker"
                className="relative z-10 w-full h-full object-cover rounded-full animate-float drop-shadow-[0_25px_40px_rgba(0,229,255,0.3)]"
                data-testid="hero-sneaker-image"
              />
              <div className="absolute top-1/4 -right-4 lg:right-0 glass px-3 py-2 z-20 hidden sm:block">
                <p className="text-[9px] tracking-[0.25em] uppercase text-zinc-500 font-mono-tech">
                  In Stock
                </p>
                <p className="font-display font-bold text-cyan-400 text-sm">
                  FEATURED
                </p>
              </div>
              <div className="absolute bottom-1/4 -left-2 lg:left-4 glass px-3 py-2 z-20 hidden sm:block">
                <p className="text-[9px] tracking-[0.25em] uppercase text-zinc-500 font-mono-tech">
                  Free Ship
                </p>
                <p className="font-display font-bold text-lime-400 text-sm">
                  WORLDWIDE
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* MARQUEE */}
      <section className="relative py-6 border-y border-white/5 overflow-hidden bg-black/30">
        <div className="flex whitespace-nowrap animate-marquee">
          {[...Array(2)].map((_, k) => (
            <div key={k} className="flex items-center shrink-0">
              {[
                "AIR JORDAN",
                "NIKE",
                "ADIDAS",
                "YEEZY",
                "BALENCIAGA",
                "OFF-WHITE",
                "NEW BALANCE",
                "PREMIUM APPAREL",
              ].map((b) => (
                <span
                  key={`${k}-${b}`}
                  className="font-display font-black text-3xl sm:text-4xl text-white/20 px-8"
                >
                  {b}
                  <span className="text-cyan-400 mx-6">✦</span>
                </span>
              ))}
            </div>
          ))}
        </div>
      </section>

      {/* FEATURED PRODUCTS */}
      <section className="relative py-24" id="featured">
        <div className="mx-auto max-w-7xl px-6 lg:px-10">
          <div className="flex items-end justify-between mb-12">
            <div>
              <p className="text-[10px] tracking-[0.3em] uppercase font-mono-tech text-cyan-400 mb-3">
                [ NEW + HOT ]
              </p>
              <h2 className="font-display font-black text-4xl sm:text-5xl text-white tracking-tighter">
                FEATURED DROPS
              </h2>
            </div>
            <Link
              to="/catalog"
              className="hidden sm:flex items-center gap-2 text-xs tracking-[0.25em] uppercase text-zinc-400 hover:text-cyan-400 transition-colors"
              data-testid="featured-view-all"
            >
              VIEW ALL <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {featured.slice(0, 8).map((p, i) => (
              <ProductCard product={p} key={p.id} index={i} />
            ))}
          </div>
        </div>
      </section>

      {/* BRANDS */}
      <section className="relative py-16 border-y border-white/5">
        <div className="mx-auto max-w-7xl px-6 lg:px-10">
          <p className="text-[10px] tracking-[0.3em] uppercase font-mono-tech text-zinc-500 mb-8 text-center">
            [ SHOP BY BRAND ]
          </p>
          <div className="flex flex-wrap justify-center gap-3">
            {brands.map((b) => (
              <Link
                key={b.name}
                to={`/catalog?brand=${encodeURIComponent(b.name)}`}
                data-testid={`brand-pill-${b.name.toLowerCase().replace(/\s+/g, "-")}`}
                className="group glass px-5 py-3 hover:border-cyan-400/50 hover:bg-black/60 transition-all"
              >
                <span className="font-display font-bold text-white group-hover:text-cyan-400 transition-colors">
                  {b.name}
                </span>
                <span className="ml-2 text-xs font-mono-tech text-zinc-500">
                  {b.count.toString().padStart(2, "0")}
                </span>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* VALUE PROPS */}
      <section className="relative py-24">
        <div className="mx-auto max-w-7xl px-6 lg:px-10 grid sm:grid-cols-3 gap-5">
          {[
            {
              Icon: Shield,
              title: "100% AUTHENTIC",
              text: "Every pair verified by our experts. Receipts & QR codes included.",
              color: "cyan",
            },
            {
              Icon: Truck,
              title: "FAST WORLDWIDE",
              text: "Shipped from Ontario in 24h. Tracked from door to door.",
              color: "lime",
            },
            {
              Icon: Sparkles,
              title: "7 YEARS DEEP",
              text: "Built trust since 2018 with a roster of premium suppliers.",
              color: "cyan",
            },
          ].map(({ Icon, title, text, color }) => (
            <div
              key={title}
              className={`group glass p-8 hover:border-${color}-400/50 transition-all`}
              data-testid={`value-prop-${title.split(" ").join("-").toLowerCase()}`}
            >
              <div
                className={`h-12 w-12 rounded-sm border flex items-center justify-center mb-5 ${
                  color === "cyan"
                    ? "border-cyan-400/40 bg-cyan-400/10"
                    : "border-lime-400/40 bg-lime-400/10"
                }`}
              >
                <Icon
                  className={`h-5 w-5 ${color === "cyan" ? "text-cyan-400" : "text-lime-400"}`}
                />
              </div>
              <h3 className="font-display font-black text-xl text-white tracking-tight mb-2">
                {title}
              </h3>
              <p className="text-sm text-zinc-400 leading-relaxed">{text}</p>
            </div>
          ))}
        </div>
      </section>

      {/* REVIEWS PREVIEW */}
      <section className="relative py-24 border-t border-white/5">
        <div className="mx-auto max-w-7xl px-6 lg:px-10">
          <div className="flex items-end justify-between mb-12">
            <div>
              <p className="text-[10px] tracking-[0.3em] uppercase font-mono-tech text-lime-400 mb-3">
                [ THE STREET SAID IT ]
              </p>
              <h2 className="font-display font-black text-4xl sm:text-5xl text-white tracking-tighter">
                12,000+ HAPPY DROPS.
              </h2>
            </div>
            <Link
              to="/reviews"
              className="hidden sm:flex items-center gap-2 text-xs tracking-[0.25em] uppercase text-zinc-400 hover:text-lime-400 transition-colors"
              data-testid="reviews-view-all"
            >
              ALL REVIEWS <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>

          <div className="grid md:grid-cols-3 gap-5">
            {reviews.slice(0, 3).map((r, i) => (
              <div
                key={r.id}
                className="glass p-6 hover:border-lime-400/40 transition-all animate-fade-up"
                style={{ animationDelay: `${i * 80}ms` }}
                data-testid={`review-card-${r.id}`}
              >
                <div className="flex gap-1 mb-4">
                  {Array.from({ length: r.rating }).map((_, k) => (
                    <Star
                      key={k}
                      className="h-3.5 w-3.5 fill-lime-400 text-lime-400"
                    />
                  ))}
                </div>
                <p className="text-zinc-300 leading-relaxed text-sm mb-5 line-clamp-4">
                  "{r.text}"
                </p>
                <div className="pt-4 border-t border-white/5 flex items-center justify-between">
                  <div>
                    <p className="font-display font-bold text-white text-sm">
                      {r.name}
                    </p>
                    <p className="text-[10px] tracking-[0.25em] uppercase text-zinc-500 font-mono-tech mt-0.5">
                      {r.location}
                    </p>
                  </div>
                  {r.verified && (
                    <span className="text-[9px] tracking-[0.2em] uppercase text-lime-400 font-bold">
                      VERIFIED
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
