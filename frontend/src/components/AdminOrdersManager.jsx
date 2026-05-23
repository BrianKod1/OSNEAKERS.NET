import { useEffect, useState } from "react";
import { api } from "../lib/api";
import { Package, Truck, CheckCircle2, X, ExternalLink } from "lucide-react";
import { toast } from "sonner";

const CARRIERS = ["Canada Post", "UPS", "FedEx", "DHL", "Purolator", "USPS"];

export default function AdminOrdersManager({ passcode }) {
  const [orders, setOrders] = useState([]);
  const [filter, setFilter] = useState("paid");
  const [loading, setLoading] = useState(false);
  const [shipping, setShipping] = useState(null); // order being shipped
  const [form, setForm] = useState({ carrier: "Canada Post", tracking_number: "", tracking_url: "" });
  const [submitting, setSubmitting] = useState(false);

  const headers = { "X-Admin-Passcode": passcode };

  const load = async () => {
    setLoading(true);
    try {
      const params = filter === "all" ? {} : { status: filter };
      const { data } = await api.get("/admin/orders", { params, headers });
      setOrders(data.orders || []);
    } catch {
      toast.error("Failed to load orders");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, [filter]); // eslint-disable-line

  const submitShip = async (e) => {
    e.preventDefault();
    if (!shipping) return;
    setSubmitting(true);
    try {
      const { data } = await api.post(
        `/admin/orders/${shipping.order_number}/ship`,
        {
          carrier: form.carrier,
          tracking_number: form.tracking_number.trim(),
          tracking_url: form.tracking_url.trim() || undefined,
        },
        { headers }
      );
      toast.success(`Shipped + tracking email sent to ${data.email}`);
      setShipping(null);
      setForm({ carrier: "Canada Post", tracking_number: "", tracking_url: "" });
      load();
    } catch (err) {
      toast.error(err?.response?.data?.detail || "Failed to mark shipped");
    } finally {
      setSubmitting(false);
    }
  };

  const resendShipped = async (orderNumber) => {
    if (!confirm("Resend tracking email to customer?")) return;
    try {
      await api.post(`/admin/orders/${orderNumber}/resend-shipped-email`, {}, { headers });
      toast.success("Tracking email resent");
    } catch {
      toast.error("Resend failed");
    }
  };

  const statusBadge = (s) => {
    const map = {
      pending: "bg-amber-400/10 border-amber-400/40 text-amber-400",
      paid: "bg-cyan-400/10 border-cyan-400/40 text-cyan-400",
      shipped: "bg-lime-400/10 border-lime-400/40 text-lime-400",
      delivered: "bg-lime-400/20 border-lime-400/60 text-lime-300",
    };
    return (
      <span className={`px-2 py-1 border text-[10px] tracking-[0.2em] uppercase font-mono-tech font-bold ${map[s] || "border-white/15 text-zinc-400"}`}>
        {s || "unknown"}
      </span>
    );
  };

  return (
    <div className="glass p-6 lg:p-8" data-testid="admin-orders-manager">
      <div className="flex items-end justify-between gap-4 mb-6">
        <div>
          <p className="text-[10px] tracking-[0.3em] uppercase font-mono-tech text-cyan-400 mb-2">[ ORDER FULFILLMENT ]</p>
          <h2 className="font-display font-black text-3xl text-white tracking-tighter">ORDERS.</h2>
        </div>
        <div className="flex gap-2 flex-wrap" data-testid="orders-filter-group">
          {["paid", "pending", "shipped", "all"].map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => setFilter(s)}
              data-testid={`orders-filter-${s}`}
              className={`px-3 py-2 text-[10px] tracking-[0.2em] uppercase font-bold border transition-all ${
                filter === s
                  ? "border-cyan-400/80 bg-cyan-400/10 text-cyan-400"
                  : "border-white/10 text-zinc-500 hover:border-white/30 hover:text-zinc-300"
              }`}
            >
              {s}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <p className="text-sm text-zinc-500">Loading…</p>
      ) : orders.length === 0 ? (
        <p className="text-sm text-zinc-500">No orders matching this filter.</p>
      ) : (
        <div className="space-y-3" data-testid="admin-orders-list">
          {orders.map((o) => (
            <div
              key={o.order_number}
              data-testid={`admin-order-${o.order_number}`}
              className="border border-white/10 hover:border-white/20 p-4 transition-colors"
            >
              <div className="flex items-start justify-between gap-3 flex-wrap">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                    <p className="font-mono-tech text-cyan-400 text-xs tracking-[2px]">{o.order_number}</p>
                    {statusBadge(o.status)}
                    {o.shipped_email_sent && (
                      <span className="text-[9px] tracking-[0.2em] uppercase text-lime-400 font-mono-tech">EMAIL SENT</span>
                    )}
                  </div>
                  <p className="text-sm text-zinc-300 truncate">{o.customer_name} · <span className="text-zinc-500">{o.email}</span></p>
                  <p className="text-xs text-zinc-500 truncate">{o.address}, {o.city}, {o.country}</p>
                  <div className="flex gap-3 mt-2 text-[10px] tracking-[0.15em] uppercase font-mono-tech text-zinc-500">
                    <span>{o.items?.length || 0} item{o.items?.length === 1 ? "" : "s"}</span>
                    <span>·</span>
                    <span className="text-white">${o.total?.toFixed(2)}</span>
                  </div>
                  {o.tracking_number && (
                    <div className="mt-2 flex items-center gap-2 text-xs">
                      <Truck className="h-3.5 w-3.5 text-lime-400" />
                      <span className="text-zinc-300">{o.tracking_carrier}</span>
                      <span className="font-mono-tech text-lime-400">{o.tracking_number}</span>
                      {o.tracking_url && (
                        <a
                          href={o.tracking_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-cyan-400 hover:text-cyan-300 inline-flex items-center gap-1"
                          data-testid={`order-${o.order_number}-track-link`}
                        >
                          TRACK <ExternalLink className="h-3 w-3" />
                        </a>
                      )}
                    </div>
                  )}
                </div>
                <div className="flex flex-col gap-2 shrink-0">
                  {o.status === "paid" && !o.tracking_number && (
                    <button
                      type="button"
                      onClick={() => setShipping(o)}
                      data-testid={`order-${o.order_number}-ship-btn`}
                      className="px-4 py-2 bg-lime-400 text-black font-display font-black tracking-[0.2em] text-[10px] uppercase hover:shadow-[0_0_20px_rgba(204,255,0,0.4)] transition-all flex items-center gap-2"
                    >
                      <Package className="h-3.5 w-3.5" />
                      SHIP
                    </button>
                  )}
                  {o.status === "shipped" && (
                    <button
                      type="button"
                      onClick={() => resendShipped(o.order_number)}
                      data-testid={`order-${o.order_number}-resend-btn`}
                      className="px-3 py-2 border border-cyan-400/40 text-cyan-400 hover:bg-cyan-400/10 text-[10px] font-bold tracking-[0.2em] uppercase transition-all"
                    >
                      RESEND EMAIL
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Ship modal */}
      {shipping && (
        <div
          className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          data-testid="ship-modal"
          onClick={(e) => e.target === e.currentTarget && setShipping(null)}
        >
          <form
            onSubmit={submitShip}
            className="bg-[#0a0a0a] border border-white/15 w-full max-w-md p-8 relative"
          >
            <button
              type="button"
              onClick={() => setShipping(null)}
              className="absolute top-4 right-4 text-zinc-500 hover:text-white"
              aria-label="Close"
              data-testid="ship-modal-close"
            >
              <X className="h-4 w-4" />
            </button>
            <p className="text-[10px] tracking-[0.3em] uppercase font-mono-tech text-cyan-400 mb-2">[ FULFILL ORDER ]</p>
            <h3 className="font-display font-black text-2xl mb-1 text-white">MARK SHIPPED</h3>
            <p className="text-xs text-zinc-500 font-mono-tech tracking-[2px] mb-6">{shipping.order_number} · {shipping.customer_name}</p>

            <label className="block mb-4">
              <span className="text-[10px] tracking-[0.25em] uppercase text-zinc-500 font-bold">Carrier</span>
              <select
                value={form.carrier}
                onChange={(e) => setForm((f) => ({ ...f, carrier: e.target.value }))}
                data-testid="ship-form-carrier"
                className="mt-1.5 w-full bg-black/60 border border-white/15 focus:border-cyan-400/60 outline-none px-3 py-2.5 text-sm transition-colors"
              >
                {CARRIERS.map((c) => <option key={c} value={c}>{c}</option>)}
              </select>
            </label>

            <label className="block mb-4">
              <span className="text-[10px] tracking-[0.25em] uppercase text-zinc-500 font-bold">Tracking Number</span>
              <input
                required
                value={form.tracking_number}
                onChange={(e) => setForm((f) => ({ ...f, tracking_number: e.target.value }))}
                placeholder="e.g. 1Z999AA10123456784"
                data-testid="ship-form-tracking-number"
                className="mt-1.5 w-full bg-black/60 border border-white/15 focus:border-cyan-400/60 outline-none px-3 py-2.5 text-sm font-mono-tech tracking-[1px] transition-colors"
              />
            </label>

            <label className="block mb-6">
              <span className="text-[10px] tracking-[0.25em] uppercase text-zinc-500 font-bold">Tracking URL (optional — auto-generated if blank)</span>
              <input
                value={form.tracking_url}
                onChange={(e) => setForm((f) => ({ ...f, tracking_url: e.target.value }))}
                placeholder="https://…"
                data-testid="ship-form-tracking-url"
                className="mt-1.5 w-full bg-black/60 border border-white/15 focus:border-cyan-400/60 outline-none px-3 py-2.5 text-xs transition-colors"
              />
            </label>

            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => setShipping(null)}
                className="flex-1 px-4 py-3 border border-white/10 text-zinc-300 hover:border-white/30 text-xs font-bold tracking-[0.2em] uppercase transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={submitting || !form.tracking_number.trim()}
                data-testid="ship-form-submit"
                className="flex-1 px-4 py-3 bg-lime-400 text-black font-display font-black tracking-[0.2em] text-xs uppercase hover:shadow-[0_0_30px_rgba(204,255,0,0.5)] transition-all disabled:opacity-50 flex items-center justify-center gap-2"
              >
                <CheckCircle2 className="h-4 w-4" />
                {submitting ? "SENDING…" : "MARK SHIPPED"}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
