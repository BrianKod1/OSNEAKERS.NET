import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { api } from "../lib/api";
import { ArrowLeft, MapPin, Package, Truck } from "lucide-react";

const STATUS_THEME = {
  pending: { label: "AWAITING CONFIRMATION", className: "text-cyan-400 border-cyan-400/40" },
  confirmed: { label: "CONFIRMED · PREPARING", className: "text-cyan-400 border-cyan-400/40" },
  shipped: { label: "SHIPPED", className: "text-lime-400 border-lime-400/40" },
  delivered: { label: "DELIVERED", className: "text-lime-400 border-lime-400/40" },
  cancelled: { label: "CANCELLED", className: "text-red-400 border-red-400/40" },
};

export default function OrderDetailPage() {
  const { orderNumber } = useParams();
  const [order, setOrder] = useState(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const { data } = await api.get(`/orders/${orderNumber}`);
        if (!cancelled) setOrder(data);
      } catch {
        if (!cancelled) setError("Order not found");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [orderNumber]);

  if (loading) {
    return (
      <div className="pt-32 pb-20 text-center text-zinc-500 font-mono-tech tracking-[0.3em] text-xs" data-testid="order-detail-loading">
        LOADING ORDER…
      </div>
    );
  }
  if (error || !order) {
    return (
      <div className="pt-32 pb-20 max-w-xl mx-auto px-6 text-center" data-testid="order-detail-error">
        <p className="text-[10px] tracking-[0.3em] uppercase font-mono-tech text-red-400 mb-3">[ NOT FOUND ]</p>
        <h1 className="font-display font-black text-4xl text-white tracking-tighter mb-6">No order here.</h1>
        <p className="text-sm text-zinc-500 mb-8">Double-check the order number or head back to your account.</p>
        <Link to="/account" className="inline-flex items-center gap-2 text-cyan-400 hover:text-cyan-300 font-bold tracking-[0.2em] uppercase text-xs">
          <ArrowLeft className="h-4 w-4" /> Account
        </Link>
      </div>
    );
  }

  const theme = STATUS_THEME[order.status] || STATUS_THEME.pending;
  const created = order.created_at ? new Date(order.created_at) : null;

  return (
    <div className="pt-24 pb-20" data-testid="order-detail-page">
      <div className="mx-auto max-w-4xl px-6 lg:px-10">
        <Link to="/account" className="inline-flex items-center gap-2 text-zinc-500 hover:text-cyan-400 font-mono-tech text-[10px] tracking-[0.3em] uppercase mb-8 transition-colors" data-testid="back-to-account">
          <ArrowLeft className="h-3 w-3" /> Back to Account
        </Link>

        <div className="flex flex-wrap items-end justify-between gap-6 mb-12">
          <div>
            <p className="text-[10px] tracking-[0.3em] uppercase font-mono-tech text-cyan-400 mb-3">[ ORDER RECEIPT ]</p>
            <h1 className="font-display font-black text-5xl sm:text-6xl text-white tracking-tighter leading-none" data-testid="order-number-heading">
              {order.order_number}
            </h1>
            {created && (
              <p className="font-mono-tech text-xs text-zinc-500 tracking-[0.2em] uppercase mt-3">
                {created.toLocaleDateString("en-US", { year: "numeric", month: "short", day: "2-digit" })} ·{" "}
                {created.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" })}
              </p>
            )}
          </div>
          <span className={`px-4 py-2 border font-mono-tech text-[10px] tracking-[0.3em] uppercase ${theme.className}`} data-testid="order-status-badge">
            {theme.label}
          </span>
        </div>

        {/* Items */}
        <div className="glass p-6 sm:p-8 mb-6">
          <p className="text-[10px] tracking-[0.3em] uppercase font-mono-tech text-cyan-400 mb-5 flex items-center gap-2">
            <Package className="h-3 w-3" /> [ ITEMS · {order.items?.length || 0} ]
          </p>
          <div className="space-y-4">
            {order.items?.map((it, idx) => (
              <div key={idx} className="flex gap-4 py-3 border-b border-white/5 last:border-0" data-testid={`order-item-${idx}`}>
                {it.image && (
                  <img src={it.image} alt={it.name} className="h-20 w-20 object-cover border border-white/10 flex-shrink-0" loading="lazy" />
                )}
                <div className="flex-1 min-w-0">
                  <p className="font-display font-bold text-white truncate">{it.name}</p>
                  <p className="font-mono-tech text-[10px] tracking-[0.2em] text-zinc-500 uppercase mt-1">
                    {it.size ? `Size ${it.size} · ` : ""}Qty {it.quantity}
                  </p>
                  <p className="font-mono-tech text-xs text-cyan-400 mt-1.5">${(it.price * it.quantity).toFixed(2)}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Totals */}
        <div className="glass p-6 sm:p-8 mb-6">
          <p className="text-[10px] tracking-[0.3em] uppercase font-mono-tech text-cyan-400 mb-5">[ BREAKDOWN ]</p>
          <div className="space-y-2 text-sm">
            <Row label="Subtotal" value={`$${order.subtotal?.toFixed(2)}`} />
            {order.discount_amount > 0 && (
              <Row label={`Discount (${order.discount_code})`} value={`−$${order.discount_amount?.toFixed(2)}`} accent />
            )}
            {order.credits_applied > 0 && <Row label="Store credits" value={`−$${order.credits_applied?.toFixed(2)}`} accent />}
            <Row label="Shipping" value="FREE" accent />
            <div className="pt-3 mt-2 border-t border-white/10 flex justify-between items-baseline">
              <span className="font-mono-tech text-[10px] tracking-[0.3em] uppercase text-white">TOTAL</span>
              <span className="font-display font-black text-3xl text-cyan-400" data-testid="order-total">
                ${order.total?.toFixed(2)}
              </span>
            </div>
          </div>
        </div>

        {/* Shipping address */}
        <div className="glass p-6 sm:p-8 mb-6">
          <p className="text-[10px] tracking-[0.3em] uppercase font-mono-tech text-cyan-400 mb-4 flex items-center gap-2">
            <MapPin className="h-3 w-3" /> [ SHIP TO ]
          </p>
          <div className="text-sm text-zinc-300 leading-relaxed">
            <p className="text-white font-bold">{order.customer_name}</p>
            <p>{order.address}</p>
            <p>
              {order.city}, {order.country}
            </p>
            <p className="font-mono-tech text-xs text-zinc-500 mt-2">{order.phone}</p>
          </div>
        </div>

        {/* Next steps */}
        <div className="border border-lime-400/30 bg-lime-400/5 p-6 sm:p-8 mb-8">
          <p className="text-[10px] tracking-[0.3em] uppercase font-mono-tech text-lime-400 mb-3 flex items-center gap-2">
            <Truck className="h-3 w-3" /> [ WHAT'S NEXT ]
          </p>
          <p className="text-sm text-zinc-300 leading-relaxed">
            Our team will reach out within the hour to confirm sizing &amp; payment. Tracking info ships to{" "}
            <span className="text-white font-bold">{order.email}</span> as soon as your order leaves Ontario.
          </p>
        </div>

        <p className="text-center font-mono-tech text-[10px] tracking-[0.3em] uppercase text-zinc-600">
          Questions? Reply to your confirmation email or call +1 (289) 600-7311
        </p>
      </div>
    </div>
  );
}

function Row({ label, value, accent = false }) {
  return (
    <div className="flex justify-between items-baseline">
      <span className="text-zinc-400">{label}</span>
      <span className={`font-mono-tech text-sm ${accent ? "text-lime-400" : "text-white"}`}>{value}</span>
    </div>
  );
}
