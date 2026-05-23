import { useState } from "react";
import { Shield, X, CheckCircle2, Camera, Package, RefreshCw } from "lucide-react";

const STEPS = [
  {
    Icon: Camera,
    title: "100-POINT INSPECTION",
    body: "Every pair is inspected from box to laces — stitching alignment, midsole density, glue lines, color match. We photograph each angle before it leaves the warehouse.",
  },
  {
    Icon: CheckCircle2,
    title: "BRAND-VERIFIED SOURCING",
    body: "We source directly from authorized distributors and brand-verified resellers. Each release ID is cross-referenced against the brand's manufacturer database.",
  },
  {
    Icon: Package,
    title: "TAMPER-SEALED PACKAGING",
    body: "Original box, original packaging materials, original branding inserts. The factory tamper seal stays intact. If anything is missing, we replace it on us.",
  },
  {
    Icon: RefreshCw,
    title: "30-DAY AUTHENTICITY GUARANTEE",
    body: "If a third-party authenticator (StockX, GOAT, CheckCheck) rejects your pair as inauthentic within 30 days, we'll refund your full purchase and pay your return shipping.",
  },
];

export default function AuthenticityLightbox() {
  const [open, setOpen] = useState(false);

  return (
    <>
      {/* Trigger badge — replaces the previous static 'AUTHENTIC' tile */}
      <button
        type="button"
        onClick={() => setOpen(true)}
        data-testid="authenticity-trigger"
        className="glass p-3 flex flex-col items-center text-center gap-1.5 group hover:border-cyan-400/60 hover:shadow-[0_0_20px_rgba(0,229,255,0.2)] transition-all cursor-pointer relative overflow-hidden"
      >
        <Shield className="h-4 w-4 text-cyan-400 group-hover:scale-110 transition-transform" />
        <span className="text-[10px] tracking-[0.2em] uppercase font-bold text-zinc-300 group-hover:text-white transition-colors">
          AUTHENTIC
        </span>
        <span className="text-[9px] tracking-[0.2em] uppercase text-cyan-400/70 group-hover:text-cyan-400 transition-colors">
          VIEW PROOF →
        </span>
      </button>

      {open && (
        <div
          className="fixed inset-0 bg-black/85 backdrop-blur-md z-50 flex items-center justify-center p-4 overflow-y-auto"
          data-testid="authenticity-lightbox"
          onClick={(e) => e.target === e.currentTarget && setOpen(false)}
        >
          <div className="bg-[#0a0a0a] border border-cyan-400/30 max-w-2xl w-full my-8 relative shadow-[0_0_60px_rgba(0,229,255,0.15)]">
            <button
              type="button"
              onClick={() => setOpen(false)}
              data-testid="authenticity-close"
              className="absolute top-5 right-5 text-zinc-500 hover:text-white transition-colors z-10"
              aria-label="Close"
            >
              <X className="h-5 w-5" />
            </button>

            {/* Header */}
            <div className="p-8 sm:p-10 border-b border-white/5">
              <div className="flex items-center gap-3 mb-3">
                <div className="h-10 w-10 rounded-sm border border-cyan-400/40 bg-cyan-400/10 flex items-center justify-center">
                  <Shield className="h-5 w-5 text-cyan-400" />
                </div>
                <p className="text-[10px] tracking-[0.3em] uppercase font-mono-tech text-cyan-400">
                  [ AUTHENTICITY VERIFIED ]
                </p>
              </div>
              <h2 className="font-display font-black text-3xl sm:text-4xl text-white tracking-tighter mb-3">
                100% REAL.<br />OR YOUR MONEY BACK.
              </h2>
              <p className="text-sm text-zinc-400 leading-relaxed max-w-lg">
                Sneaker culture lives or dies on authenticity. Every pair from OSneakers
                passes our 4-stage verification process before it ships.
              </p>
            </div>

            {/* Steps */}
            <div className="p-8 sm:p-10 space-y-6">
              {STEPS.map(({ Icon, title, body }, idx) => (
                <div key={title} className="flex gap-4" data-testid={`authenticity-step-${idx + 1}`}>
                  <div className="shrink-0">
                    <div className="h-10 w-10 rounded-sm border border-lime-400/40 bg-lime-400/5 flex items-center justify-center">
                      <Icon className="h-4 w-4 text-lime-400" />
                    </div>
                    <div className="h-full w-px bg-white/10 mx-auto mt-3 last:hidden" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-baseline gap-2 mb-1.5">
                      <span className="font-mono-tech text-[10px] tracking-[3px] text-zinc-600">
                        {String(idx + 1).padStart(2, "0")}
                      </span>
                      <h3 className="font-display font-black text-sm tracking-[0.15em] uppercase text-white">
                        {title}
                      </h3>
                    </div>
                    <p className="text-sm text-zinc-400 leading-relaxed">{body}</p>
                  </div>
                </div>
              ))}
            </div>

            {/* Footer */}
            <div className="p-8 sm:p-10 border-t border-white/5 bg-black/40">
              <p className="text-[10px] tracking-[0.3em] uppercase font-mono-tech text-lime-400 mb-2">
                [ OUR PROMISE ]
              </p>
              <p className="text-sm text-zinc-300 leading-relaxed mb-5">
                We've been doing this since 2018. <strong className="text-white">Zero authenticity disputes</strong> across thousands of fulfilled orders. If you ever have a doubt, send it back — we cover the return.
              </p>
              <button
                type="button"
                onClick={() => setOpen(false)}
                data-testid="authenticity-cta-close"
                className="px-6 py-3 bg-cyan-400 text-black font-display font-black tracking-[0.2em] text-xs uppercase hover:shadow-[0_0_30px_rgba(0,229,255,0.5)] transition-all"
              >
                LET'S DO IT →
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
