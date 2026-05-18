import { Shield, Globe2, Award, Zap } from "lucide-react";
import { Link } from "react-router-dom";

export default function AboutPage() {
  return (
    <div className="pt-24 pb-20" data-testid="about-page">
      {/* Hero */}
      <section className="relative py-16 lg:py-24 overflow-hidden">
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-1/2 left-1/3 -translate-y-1/2 h-[500px] w-[500px] rounded-full bg-cyan-500/10 blur-[120px]"></div>
        </div>
        <div className="relative mx-auto max-w-5xl px-6 lg:px-10 text-center">
          <p className="text-[10px] tracking-[0.3em] uppercase font-mono-tech text-cyan-400 mb-4">
            [ EST. 2018 · ONTARIO ]
          </p>
          <h1 className="font-display font-black text-5xl sm:text-7xl text-white tracking-[-0.04em] leading-[0.9]">
            BUILT ON
            <br />
            <span className="text-cyan-400 text-glow-cyan">TRUST.</span> SHIPPED
            <br />
            WITH SPEED.
          </h1>
          <p className="mt-8 max-w-2xl mx-auto text-zinc-400 leading-relaxed text-base sm:text-lg font-light">
            For seven years, OSneakers has been the bridge between the world's
            most-wanted footwear and the streets of Canada. We don't sell hype —
            we deliver the real thing, fast.
          </p>
        </div>
      </section>

      {/* Story */}
      <section className="relative py-16 border-t border-white/5">
        <div className="mx-auto max-w-6xl px-6 lg:px-10 grid lg:grid-cols-12 gap-12 items-start">
          <div className="lg:col-span-5 lg:sticky lg:top-24">
            <p className="text-[10px] tracking-[0.3em] uppercase font-mono-tech text-lime-400 mb-3">
              [ THE STORY ]
            </p>
            <h2 className="font-display font-black text-4xl sm:text-5xl text-white tracking-tighter">
              FROM ONE GRAIL,
              <br />
              TO 12,000+.
            </h2>
          </div>
          <div className="lg:col-span-7 space-y-6 text-zinc-400 leading-relaxed font-light">
            <p>
              <span className="text-cyan-400 font-mono-tech text-xs tracking-[0.3em]">
                2018 —
              </span>{" "}
              It started in a garage in Mississauga. A single pair of Yeezys. A
              friend who couldn't find them in his size. One DM became ten,
              became hundreds.
            </p>
            <p>
              <span className="text-cyan-400 font-mono-tech text-xs tracking-[0.3em]">
                2020 —
              </span>{" "}
              We locked in our first relationships with trusted suppliers across
              three continents. Every pair vetted, every transaction traced.
            </p>
            <p>
              <span className="text-cyan-400 font-mono-tech text-xs tracking-[0.3em]">
                2024 —
              </span>{" "}
              Expanded into premium streetwear apparel. Same standards. Same
              speed. Same obsession with the details that matter.
            </p>
            <p>
              <span className="text-cyan-400 font-mono-tech text-xs tracking-[0.3em]">
                TODAY —
              </span>{" "}
              We ship from Ontario worldwide. Hundreds of pairs leave our hands
              every week — to first-time buyers, lifelong collectors, and
              everyone in between.
            </p>
          </div>
        </div>
      </section>

      {/* Pillars */}
      <section className="relative py-24 border-t border-white/5">
        <div className="mx-auto max-w-7xl px-6 lg:px-10">
          <p className="text-[10px] tracking-[0.3em] uppercase font-mono-tech text-cyan-400 mb-3 text-center">
            [ THE FOUR PILLARS ]
          </p>
          <h2 className="font-display font-black text-4xl sm:text-5xl text-white tracking-tighter text-center mb-16">
            WHY WE WIN.
          </h2>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {[
              {
                Icon: Shield,
                title: "AUTHENTIC",
                text: "Every pair verified. Receipts, tags & QR codes included in your drop.",
              },
              {
                Icon: Zap,
                title: "FAST",
                text: "Same-day dispatch from Ontario. Most orders arrive in 2–4 business days.",
              },
              {
                Icon: Award,
                title: "PREMIUM",
                text: "Sourced from trusted partners. No backyards, no fakes — only the real ones.",
              },
              {
                Icon: Globe2,
                title: "GLOBAL",
                text: "Shipping worldwide with full tracking. 12,000+ orders across 40+ countries.",
              },
            ].map(({ Icon, title, text }, i) => (
              <div
                key={title}
                className="glass p-7 hover:border-cyan-400/40 transition-all animate-fade-up"
                style={{ animationDelay: `${i * 80}ms` }}
                data-testid={`pillar-${title.toLowerCase()}`}
              >
                <div className="h-11 w-11 rounded-sm border border-cyan-400/40 bg-cyan-400/10 flex items-center justify-center mb-5">
                  <Icon className="h-5 w-5 text-cyan-400" />
                </div>
                <h3 className="font-display font-black text-xl text-white tracking-tight mb-2">
                  {title}
                </h3>
                <p className="text-sm text-zinc-400 leading-relaxed">{text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Stats / CTA */}
      <section className="relative py-24 border-t border-white/5">
        <div className="mx-auto max-w-6xl px-6 lg:px-10">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-8 mb-16">
            {[
              ["7+", "YEARS DEEP"],
              ["12K+", "PAIRS DROPPED"],
              ["40+", "COUNTRIES"],
              ["4.9", "AVG RATING"],
            ].map(([n, l]) => (
              <div key={l} className="text-center">
                <div className="font-display font-black text-5xl sm:text-6xl text-cyan-400 text-glow-cyan tracking-tighter">
                  {n}
                </div>
                <div className="text-[10px] tracking-[0.3em] uppercase text-zinc-500 font-mono-tech mt-2">
                  {l}
                </div>
              </div>
            ))}
          </div>

          <div className="glass p-10 sm:p-16 text-center relative overflow-hidden">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(0,229,255,0.08),transparent_60%)]"></div>
            <div className="relative">
              <h3 className="font-display font-black text-3xl sm:text-5xl text-white tracking-tighter mb-4">
                READY TO LOCK IN?
              </h3>
              <p className="text-zinc-400 max-w-md mx-auto mb-8">
                The catalog is loaded. Pick your pair, we'll handle the rest.
              </p>
              <Link
                to="/catalog"
                data-testid="about-cta-btn"
                className="inline-block px-8 py-4 bg-cyan-400 text-black font-display font-black tracking-[0.25em] text-sm uppercase hover:shadow-[0_0_40px_rgba(0,229,255,0.6)] transition-all"
              >
                SHOP THE DROP
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
