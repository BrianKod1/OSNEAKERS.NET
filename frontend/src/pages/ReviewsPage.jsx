import { useEffect, useState } from "react";
import { fetchReviews } from "../lib/api";
import { Star, BadgeCheck } from "lucide-react";

export default function ReviewsPage() {
  const [reviews, setReviews] = useState([]);

  useEffect(() => {
    fetchReviews().then(setReviews);
  }, []);

  return (
    <div className="pt-24 pb-20" data-testid="reviews-page">
      {/* Hero */}
      <section className="relative py-16 lg:py-24 overflow-hidden">
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-1/2 right-1/4 -translate-y-1/2 h-[400px] w-[400px] rounded-full bg-lime-500/10 blur-[120px]"></div>
        </div>
        <div className="relative mx-auto max-w-5xl px-6 lg:px-10">
          <p className="text-[10px] tracking-[0.3em] uppercase font-mono-tech text-lime-400 mb-4">
            [ FULFILLMENT PROOF ]
          </p>
          <h1 className="font-display font-black text-5xl sm:text-7xl text-white tracking-[-0.04em] leading-[0.9]">
            REAL DROPS.
            <br />
            <span className="text-lime-400 text-glow-lime">REAL PEOPLE.</span>
          </h1>
          <p className="mt-8 max-w-2xl text-zinc-400 leading-relaxed text-base sm:text-lg font-light">
            Every pair we ship comes back as a story. Here's what 12,000+
            customers across 40+ countries had to say.
          </p>

          <div className="mt-10 flex items-center gap-8 flex-wrap">
            <div>
              <div className="flex gap-1 mb-1">
                {Array.from({ length: 5 }).map((_, k) => (
                  <Star
                    key={k}
                    className="h-5 w-5 fill-lime-400 text-lime-400"
                  />
                ))}
              </div>
              <p className="text-xs font-mono-tech text-zinc-500 tracking-wider">
                4.9 / 5 AVERAGE · 12,431 REVIEWS
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Reviews Grid */}
      <section className="relative py-16">
        <div className="mx-auto max-w-7xl px-6 lg:px-10">
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
            {reviews.map((r, i) => (
              <div
                key={r.id}
                className="glass overflow-hidden hover:border-lime-400/40 transition-all animate-fade-up"
                style={{ animationDelay: `${(i % 6) * 80}ms` }}
                data-testid={`reviews-card-${r.id}`}
              >
                {r.image && (
                  <div className="aspect-[4/3] overflow-hidden bg-zinc-900 relative">
                    <img
                      src={r.image}
                      alt={r.product_name || "fulfillment"}
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute bottom-3 left-3 px-2 py-1 bg-black/80 backdrop-blur text-[9px] tracking-[0.25em] uppercase text-lime-400 font-bold border border-lime-400/30">
                      {r.product_name}
                    </div>
                  </div>
                )}
                <div className="p-6">
                  <div className="flex justify-between items-start mb-3">
                    <div className="flex gap-1">
                      {Array.from({ length: r.rating }).map((_, k) => (
                        <Star
                          key={k}
                          className="h-3.5 w-3.5 fill-lime-400 text-lime-400"
                        />
                      ))}
                    </div>
                    {r.verified && (
                      <div className="flex items-center gap-1 text-[9px] tracking-[0.2em] uppercase text-lime-400 font-bold">
                        <BadgeCheck className="h-3 w-3" /> VERIFIED
                      </div>
                    )}
                  </div>
                  <p className="text-zinc-300 leading-relaxed text-sm mb-5">
                    "{r.text}"
                  </p>
                  <div className="pt-4 border-t border-white/5">
                    <p className="font-display font-bold text-white text-sm">
                      {r.name}
                    </p>
                    <p className="text-[10px] tracking-[0.25em] uppercase text-zinc-500 font-mono-tech mt-0.5">
                      {r.location}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
