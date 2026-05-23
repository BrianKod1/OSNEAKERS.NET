import { useState } from "react";
import { Search, Truck, CheckCircle2, Clock, Package, ExternalLink, AlertCircle } from "lucide-react";
import { trackOrder } from "../lib/api";

const STEPS = [
  { key: "ordered", Icon: Package, label: "ORDERED" },
  { key: "paid", Icon: CheckCircle2, label: "PAID" },
  { key: "shipped", Icon: Truck, label: "SHIPPED" },
];

function statusToIndex(status) {
  if (status === "shipped" || status === "delivered") return 2;
  if (status === "paid") return 1;
  return 0;
}

export default function TrackPage() {
  const [orderNumber, setOrderNumber] = useState("");
  const [email, setEmail] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [order, setOrder] = useState(null);
  const [error, setError] = useState(null);

  const submit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    try {
      const data = await trackOrder(orderNumber.trim(), email.trim());
      setOrder(data);
    } catch (err) {
      setOrder(null);
      setError(err?.response?.data?.detail || "Could not find that order. Double-check the number and email used at checkout.");
    } finally {
      setSubmitting(false);
    }
  };

  const reset = () => {
    setOrder(null);
    setError(null);
    setOrderNumber("");
    setEmail("");
  };

  const activeStep = order ? statusToIndex(order.status) : 0;

  return (
    <main className="pt-24 pb-20 min-h-screen bg-[#050505] text-white" data-testid="track-page">
      <div className="mx-auto max-w-2xl px-6 lg:px-10">
        <p className="text-[10px] tracking-[0.3em] uppercase font-mono-tech text-cyan-400 mb-3">
          [ ORDER TRACKING ]
        </p>
        <h1 className="font-display font-black text-5xl sm:text-6xl text-white tracking-tighter mb-3">
          TRACK ORDER.
        </h1>
        <p className="text-zinc-400 text-sm mb-10 max-w-md">
          Punch in your order number + the email you checked out with. We'll pull up the live status.
        </p>

        {!order ? (
          <form onSubmit={submit} className="glass p-8 space-y-5" data-testid="track-form">
            <label className="block">
              <span className="text-[10px] tracking-[0.25em] uppercase text-zinc-500 font-bold">Order Number</span>
              <input
                required
                value={orderNumber}
                onChange={(e) => setOrderNumber(e.target.value.toUpperCase())}
                placeholder="OS20260523XXXXXX"
                data-testid="track-order-input"
                className="mt-2 w-full bg-black/60 border border-white/15 focus:border-cyan-400/60 outline-none px-4 py-3 text-sm font-mono-tech tracking-[2px] transition-colors"
              />
            </label>
            <label className="block">
              <span className="text-[10px] tracking-[0.25em] uppercase text-zinc-500 font-bold">Email</span>
              <input
                required
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@email.com"
                data-testid="track-email-input"
                className="mt-2 w-full bg-black/60 border border-white/15 focus:border-cyan-400/60 outline-none px-4 py-3 text-sm transition-colors"
              />
            </label>

            {error && (
              <div className="flex gap-3 p-3 border border-red-400/40 bg-red-400/5" data-testid="track-error">
                <AlertCircle className="h-4 w-4 text-red-400 shrink-0 mt-0.5" />
                <p className="text-xs text-red-300 leading-relaxed">{error}</p>
              </div>
            )}

            <button
              type="submit"
              disabled={submitting || !orderNumber.trim() || !email.trim()}
              data-testid="track-submit"
              className="w-full py-3.5 bg-cyan-400 text-black font-display font-black tracking-[0.25em] text-xs uppercase hover:shadow-[0_0_30px_rgba(0,229,255,0.5)] transition-all disabled:opacity-50 flex items-center justify-center gap-2"
            >
              <Search className="h-4 w-4" />
              {submitting ? "LOOKING UP…" : "TRACK ORDER"}
            </button>
          </form>
        ) : (
          <div className="space-y-6" data-testid="track-result">
            {/* Status header */}
            <div className="glass p-8">
              <div className="flex items-baseline justify-between flex-wrap gap-3 mb-1">
                <p className="text-[10px] tracking-[0.3em] uppercase font-mono-tech text-cyan-400">
                  [ {order.status?.toUpperCase() || "PENDING"} ]
                </p>
                <button
                  type="button"
                  onClick={reset}
                  data-testid="track-new-lookup"
                  className="text-[10px] tracking-[0.25em] uppercase text-zinc-500 hover:text-cyan-400 transition-colors"
                >
                  ← NEW LOOKUP
                </button>
              </div>
              <h2 className="font-display font-black text-3xl tracking-tighter" data-testid="track-order-number">
                {order.order_number}
              </h2>
              <p className="text-sm text-zinc-500 mt-1">
                {order.customer_name} · {order.items?.length || 0} item{order.items?.length === 1 ? "" : "s"} · ${order.total?.toFixed(2)} CAD
              </p>

              {/* Timeline */}
              <div className="mt-8 grid grid-cols-3 gap-2" data-testid="track-timeline">
                {STEPS.map((s, i) => {
                  const active = i <= activeStep;
                  const current = i === activeStep && order.status !== "shipped" && order.status !== "delivered";
                  return (
                    <div key={s.key} className="text-center" data-testid={`track-step-${s.key}`}>
                      <div
                        className={`mx-auto h-10 w-10 rounded-sm border flex items-center justify-center mb-2 transition-all ${
                          active
                            ? "border-cyan-400/60 bg-cyan-400/10 text-cyan-400"
                            : "border-white/10 bg-black/40 text-zinc-700"
                        } ${current ? "shadow-[0_0_24px_rgba(0,229,255,0.4)] animate-pulse-glow" : ""}`}
                      >
                        <s.Icon className="h-4 w-4" />
                      </div>
                      <p className={`text-[10px] tracking-[0.2em] uppercase font-bold ${active ? "text-white" : "text-zinc-600"}`}>
                        {s.label}
                      </p>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Tracking */}
            {order.tracking_number ? (
              <div className="glass p-6 border-lime-400/30" data-testid="track-shipping-block">
                <p className="text-[10px] tracking-[0.3em] uppercase font-mono-tech text-lime-400 mb-3">
                  [ ON THE WAY ]
                </p>
                <div className="flex items-center justify-between gap-3 flex-wrap">
                  <div className="min-w-0">
                    <p className="text-xs text-zinc-500">Carrier</p>
                    <p className="text-white font-display font-bold">{order.tracking_carrier}</p>
                    <p className="font-mono-tech text-lime-400 text-sm tracking-[2px] mt-2 break-all">
                      {order.tracking_number}
                    </p>
                  </div>
                  {order.tracking_url && (
                    <a
                      href={order.tracking_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      data-testid="track-carrier-link"
                      className="px-5 py-3 bg-lime-400 text-black font-display font-black tracking-[0.2em] text-xs uppercase hover:shadow-[0_0_30px_rgba(204,255,0,0.5)] transition-all inline-flex items-center gap-2"
                    >
                      TRACK PACKAGE <ExternalLink className="h-3.5 w-3.5" />
                    </a>
                  )}
                </div>
              </div>
            ) : order.status === "paid" ? (
              <div className="glass p-6 border-cyan-400/30">
                <div className="flex items-start gap-3">
                  <Clock className="h-5 w-5 text-cyan-400 shrink-0 mt-0.5" />
                  <div>
                    <p className="text-[10px] tracking-[0.3em] uppercase font-mono-tech text-cyan-400 mb-1">[ PROCESSING ]</p>
                    <p className="text-sm text-zinc-300">Your order is paid and being prepared for shipment. You'll get an email with tracking as soon as it leaves the warehouse.</p>
                  </div>
                </div>
              </div>
            ) : (
              <div className="glass p-6 border-amber-400/30">
                <div className="flex items-start gap-3">
                  <Clock className="h-5 w-5 text-amber-400 shrink-0 mt-0.5" />
                  <div>
                    <p className="text-[10px] tracking-[0.3em] uppercase font-mono-tech text-amber-400 mb-1">[ AWAITING PAYMENT ]</p>
                    <p className="text-sm text-zinc-300">Your order is created but payment hasn't been confirmed. Check your email for a Stripe receipt, or contact us if you think this is an error.</p>
                  </div>
                </div>
              </div>
            )}

            {/* Items */}
            <div className="glass p-6">
              <p className="text-[10px] tracking-[0.3em] uppercase font-mono-tech text-zinc-500 mb-4">
                [ YOUR ORDER ]
              </p>
              <div className="space-y-3" data-testid="track-items">
                {order.items?.map((i, idx) => (
                  <div key={idx} className="flex items-center gap-4 border-b border-white/5 pb-3 last:border-0 last:pb-0">
                    {i.image && (
                      <img src={i.image} alt={i.name} className="h-12 w-12 object-cover border border-white/5" />
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-white font-display font-bold truncate">{i.name}</p>
                      <p className="text-[10px] tracking-[0.2em] uppercase font-mono-tech text-zinc-500">
                        {i.size ? `Size ${i.size} · ` : ""}Qty {i.quantity}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
              <div className="mt-5 pt-4 border-t border-white/5 flex justify-between text-sm">
                <span className="text-zinc-400">Total</span>
                <span className="font-display font-bold text-white">
                  ${order.total?.toFixed(2)} <span className="text-[10px] font-mono-tech text-zinc-500 ml-1">CAD</span>
                </span>
              </div>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
