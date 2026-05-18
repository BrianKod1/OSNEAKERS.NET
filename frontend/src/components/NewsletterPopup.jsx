import { useEffect, useState } from "react";
import { X, Sparkles, Copy, Check } from "lucide-react";
import { api } from "../lib/api";
import { toast } from "sonner";

const STORAGE_KEY = "osneakers_popup_v1";
const DELAY_MS = 7000;

export const NewsletterPopup = () => {
  const [open, setOpen] = useState(false);
  const [email, setEmail] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (localStorage.getItem(STORAGE_KEY)) return;
    const t = setTimeout(() => setOpen(true), DELAY_MS);
    return () => clearTimeout(t);
  }, []);

  const close = () => {
    setOpen(false);
    localStorage.setItem(STORAGE_KEY, "1");
  };

  const submit = async (e) => {
    e.preventDefault();
    if (!email) return;
    setSubmitting(true);
    try {
      const { data } = await api.post("/subscribe", { email });
      setResult(data);
      localStorage.setItem(STORAGE_KEY, "1");
      localStorage.setItem("osneakers_discount", data.discount_code);
      if (!data.email_sent) {
        toast.message("Code locked in — email delivery is in test mode.");
      }
    } catch (err) {
      toast.error("Could not subscribe. Try again.");
    } finally {
      setSubmitting(false);
    }
  };

  const copy = async () => {
    if (!result) return;
    await navigator.clipboard.writeText(result.discount_code);
    setCopied(true);
    toast.success("Code copied");
    setTimeout(() => setCopied(false), 1500);
  };

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center p-4 animate-fade-up"
      data-testid="newsletter-popup"
    >
      <div
        className="absolute inset-0 bg-black/80 backdrop-blur-sm"
        onClick={close}
      />
      <div className="relative w-full max-w-md glass-strong overflow-hidden">
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute -top-20 -right-20 h-48 w-48 rounded-full bg-cyan-500/30 blur-3xl"></div>
          <div className="absolute -bottom-24 -left-24 h-48 w-48 rounded-full bg-lime-500/20 blur-3xl"></div>
        </div>

        <button
          onClick={close}
          className="absolute top-4 right-4 z-10 h-8 w-8 flex items-center justify-center text-zinc-500 hover:text-white transition-colors"
          data-testid="newsletter-close"
          aria-label="Close"
        >
          <X className="h-4 w-4" />
        </button>

        <div className="relative p-8 sm:p-10">
          {result ? (
            <div className="text-center" data-testid="newsletter-success">
              <div className="inline-flex h-14 w-14 rounded-full bg-lime-400/10 border border-lime-400/40 items-center justify-center mb-6 glow-lime">
                <Sparkles className="h-6 w-6 text-lime-400" />
              </div>
              <p className="text-[10px] tracking-[0.3em] uppercase font-mono-tech text-lime-400 mb-3">
                [ YOU'RE IN ]
              </p>
              <h2 className="font-display font-black text-3xl sm:text-4xl text-white tracking-tighter leading-none mb-3">
                {result.discount_percent}% OFF
              </h2>
              <p className="text-sm text-zinc-400 mb-6">
                Use this code at checkout on your first drop:
              </p>
              <button
                onClick={copy}
                className="w-full group p-4 border border-cyan-400/60 bg-cyan-400/5 hover:bg-cyan-400/10 transition-all flex items-center justify-between"
                data-testid="newsletter-code-copy"
              >
                <span className="font-mono-tech text-2xl tracking-[6px] text-cyan-400 font-bold">
                  {result.discount_code}
                </span>
                {copied ? (
                  <Check className="h-5 w-5 text-lime-400" />
                ) : (
                  <Copy className="h-5 w-5 text-zinc-400 group-hover:text-cyan-400" />
                )}
              </button>
              <p className="mt-5 text-[10px] tracking-[0.25em] uppercase font-mono-tech text-zinc-500">
                {result.email_sent
                  ? `Sent to ${result.email}`
                  : "Code saved · check spam if no email"}
              </p>
              <button
                onClick={close}
                className="mt-7 w-full py-3 bg-cyan-400 text-black font-display font-black tracking-[0.25em] text-xs uppercase hover:shadow-[0_0_30px_rgba(0,229,255,0.5)] transition-all"
                data-testid="newsletter-start-shopping"
              >
                START SHOPPING
              </button>
            </div>
          ) : (
            <form onSubmit={submit}>
              <div className="inline-flex items-center gap-2 mb-5 px-2.5 py-1 border border-cyan-400/40 bg-cyan-400/5">
                <span className="h-1.5 w-1.5 rounded-full bg-cyan-400 animate-pulse-glow"></span>
                <span className="text-[10px] tracking-[0.3em] uppercase font-mono-tech text-cyan-300">
                  FIRST DROP · {DELAY_MS && "MEMBER PRICING"}
                </span>
              </div>
              <h2 className="font-display font-black text-4xl sm:text-5xl text-white tracking-[-0.03em] leading-[0.9] mb-3">
                GET <span className="text-cyan-400 text-glow-cyan">10% OFF</span>
                <br />
                YOUR FIRST DROP.
              </h2>
              <p className="text-sm text-zinc-400 leading-relaxed mb-6">
                Drop your email — we'll send you a one-time code, early access
                to drops & the occasional secret restock.
              </p>

              <input
                type="email"
                required
                placeholder="you@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                data-testid="newsletter-email"
                className="w-full bg-black/60 border border-white/15 focus:border-cyan-400/60 outline-none px-4 py-3.5 text-sm transition-colors mb-3 placeholder:text-zinc-600"
              />
              <button
                type="submit"
                disabled={submitting}
                data-testid="newsletter-submit"
                className="w-full py-3.5 bg-cyan-400 text-black font-display font-black tracking-[0.25em] text-xs uppercase hover:shadow-[0_0_30px_rgba(0,229,255,0.5)] transition-all disabled:opacity-50"
              >
                {submitting ? "UNLOCKING..." : "UNLOCK 10% OFF"}
              </button>

              <p className="mt-4 text-[10px] tracking-[0.2em] uppercase text-zinc-600 font-mono-tech text-center">
                NO SPAM · UNSUBSCRIBE ANYTIME
              </p>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
