import { useState } from "react";
import { Link } from "react-router-dom";
import { api } from "../lib/api";
import { User, Mail, Coins, Send, Copy, Check, ChevronDown, ChevronUp, ExternalLink } from "lucide-react";
import { toast } from "sonner";

export default function AccountPage() {
  const [email, setEmail] = useState(localStorage.getItem("osneakers_user_email") || "");
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);

  const load = async (e) => {
    e?.preventDefault();
    if (!email) return;
    setLoading(true);
    try {
      const { data: res } = await api.get(`/account/${encodeURIComponent(email)}`);
      setData(res);
      localStorage.setItem("osneakers_user_email", email);
    } catch {
      toast.error("Could not load account");
    } finally {
      setLoading(false);
    }
  };

  const copy = async () => {
    await navigator.clipboard.writeText(data.referral.code);
    setCopied(true);
    toast.success("Code copied");
    setTimeout(() => setCopied(false), 1500);
  };

  return (
    <div className="pt-24 pb-20" data-testid="account-page">
      <div className="mx-auto max-w-5xl px-6 lg:px-10">
        <p className="text-[10px] tracking-[0.3em] uppercase font-mono-tech text-cyan-400 mb-3">[ YOUR DROP ]</p>
        <h1 className="font-display font-black text-5xl sm:text-6xl text-white tracking-tighter mb-10">ACCOUNT.</h1>

        <form onSubmit={load} className="flex gap-3 mb-10 max-w-lg">
          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="your@email.com"
            data-testid="account-email-input"
            className="flex-1 bg-black/40 border border-white/15 focus:border-cyan-400/60 outline-none px-4 py-3 text-sm"
          />
          <button
            type="submit"
            disabled={loading}
            data-testid="account-lookup-btn"
            className="px-6 bg-cyan-400 text-black font-display font-black tracking-[0.2em] text-xs uppercase hover:shadow-[0_0_20px_rgba(0,229,255,0.4)] transition-all disabled:opacity-50"
          >
            {loading ? "..." : "LOAD"}
          </button>
        </form>

        {data && (
          <>
            <div className="grid sm:grid-cols-3 gap-5 mb-8">
              <div className="glass p-6">
                <Mail className="h-4 w-4 text-cyan-400 mb-3" />
                <div className="text-[10px] tracking-[0.3em] uppercase text-zinc-500 font-mono-tech">ORDERS</div>
                <div className="font-display font-black text-4xl text-white mt-1">{data.order_count}</div>
              </div>
              <div className="glass p-6">
                <User className="h-4 w-4 text-cyan-400 mb-3" />
                <div className="text-[10px] tracking-[0.3em] uppercase text-zinc-500 font-mono-tech">SPENT</div>
                <div className="font-display font-black text-4xl text-white mt-1">${data.total_spent.toFixed(0)}</div>
              </div>
              <div className="glass p-6 border-lime-400/30">
                <Coins className="h-4 w-4 text-lime-400 mb-3" />
                <div className="text-[10px] tracking-[0.3em] uppercase text-lime-400 font-mono-tech">CREDITS</div>
                <div className="font-display font-black text-4xl text-lime-400 mt-1" data-testid="account-credits">${data.referral.credits_earned.toFixed(2)}</div>
              </div>
            </div>

            <div className="glass border border-lime-400/30 p-8 mb-8">
              <p className="text-[10px] tracking-[0.3em] uppercase font-mono-tech text-lime-400 mb-2">[ YOUR REFERRAL CODE ]</p>
              <p className="text-sm text-zinc-400 mb-5">Used <strong className="text-white">{data.referral.uses}</strong> time{data.referral.uses === 1 ? "" : "s"} · earning <strong className="text-lime-400">5%</strong> on each order.</p>
              <button
                onClick={copy}
                data-testid="account-referral-copy"
                className="w-full p-4 border border-lime-400/60 bg-lime-400/5 hover:bg-lime-400/10 transition-all flex items-center justify-between"
              >
                <span className="font-mono-tech text-2xl tracking-[6px] text-lime-400 font-bold">{data.referral.code}</span>
                {copied ? <Check className="h-5 w-5 text-lime-400" /> : <Copy className="h-5 w-5 text-zinc-400" />}
              </button>
              <ShareForm fromEmail={data.email} />
            </div>

            <div className="glass p-6">
              <p className="text-[10px] tracking-[0.3em] uppercase font-mono-tech text-cyan-400 mb-4">[ ORDER HISTORY ]</p>
              {data.orders.length === 0 ? (
                <p className="text-sm text-zinc-500">No orders yet.</p>
              ) : (
                <div className="space-y-2" data-testid="order-history-list">
                  {data.orders.map((o) => (
                    <OrderRow key={o.id} order={o} />
                  ))}
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}

function OrderRow({ order }) {
  const [open, setOpen] = useState(false);
  const itemCount = order.items?.length || 0;
  const created = order.created_at ? new Date(order.created_at) : null;
  const statusColor =
    order.status === "shipped" || order.status === "delivered"
      ? "text-lime-400 border-lime-400/30"
      : order.status === "cancelled"
      ? "text-red-400 border-red-400/30"
      : "text-cyan-400 border-cyan-400/30";

  return (
    <div className="border border-white/5 hover:border-cyan-400/30 transition-colors" data-testid={`account-order-${order.order_number}`}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center justify-between gap-4 p-4 text-left"
        data-testid={`order-toggle-${order.order_number}`}
      >
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-3 flex-wrap">
            <p className="font-mono-tech text-xs text-cyan-400 tracking-[0.2em]">{order.order_number}</p>
            <span className={`px-2 py-0.5 border font-mono-tech text-[9px] tracking-[0.3em] uppercase ${statusColor}`}>
              {order.status || "pending"}
            </span>
          </div>
          <p className="text-xs text-zinc-500 mt-1">
            {itemCount} item{itemCount === 1 ? "" : "s"}
            {created ? ` · ${created.toLocaleDateString("en-US", { month: "short", day: "2-digit", year: "numeric" })}` : ""}
          </p>
        </div>
        <span className="font-display font-bold text-white text-lg">${order.total?.toFixed(2)}</span>
        {open ? <ChevronUp className="h-4 w-4 text-zinc-400 flex-shrink-0" /> : <ChevronDown className="h-4 w-4 text-zinc-400 flex-shrink-0" />}
      </button>

      {open && (
        <div className="px-4 pb-4 pt-1 border-t border-white/5 space-y-4" data-testid={`order-expanded-${order.order_number}`}>
          <div className="space-y-2">
            {order.items?.map((it, idx) => (
              <div key={idx} className="flex items-center gap-3 py-2">
                {it.image && (
                  <img src={it.image} alt={it.name} className="h-12 w-12 object-cover border border-white/10 flex-shrink-0" loading="lazy" />
                )}
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-white truncate">{it.name}</p>
                  <p className="font-mono-tech text-[10px] tracking-[0.2em] text-zinc-500 uppercase">
                    {it.size ? `Size ${it.size} · ` : ""}Qty {it.quantity}
                  </p>
                </div>
                <span className="font-mono-tech text-xs text-zinc-400 flex-shrink-0">${(it.price * it.quantity).toFixed(2)}</span>
              </div>
            ))}
          </div>

          <div className="text-xs text-zinc-500 space-y-1 pt-2 border-t border-white/5">
            <div className="flex justify-between"><span>Subtotal</span><span className="font-mono-tech text-zinc-300">${order.subtotal?.toFixed(2)}</span></div>
            {order.discount_amount > 0 && (
              <div className="flex justify-between"><span>Discount ({order.discount_code})</span><span className="font-mono-tech text-lime-400">−${order.discount_amount?.toFixed(2)}</span></div>
            )}
            {order.credits_applied > 0 && (
              <div className="flex justify-between"><span>Store credits</span><span className="font-mono-tech text-lime-400">−${order.credits_applied?.toFixed(2)}</span></div>
            )}
          </div>

          <div className="text-xs text-zinc-500 pt-2 border-t border-white/5">
            <p className="font-mono-tech text-[10px] tracking-[0.3em] uppercase text-zinc-600 mb-1">SHIP TO</p>
            <p className="text-zinc-300">{order.customer_name} · {order.address}, {order.city}, {order.country}</p>
          </div>

          <Link
            to={`/order/${order.order_number}`}
            className="inline-flex items-center gap-2 text-cyan-400 hover:text-cyan-300 font-mono-tech text-[10px] tracking-[0.3em] uppercase transition-colors"
            data-testid={`view-receipt-${order.order_number}`}
          >
            View full receipt <ExternalLink className="h-3 w-3" />
          </Link>
        </div>
      )}
    </div>
  );
}

function ShareForm({ fromEmail }) {
  const [toEmail, setToEmail] = useState("");
  const [sending, setSending] = useState(false);

  const send = async (e) => {
    e.preventDefault();
    if (!toEmail) return;
    setSending(true);
    try {
      const { data } = await api.post("/referral/share", { from_email: fromEmail, to_email: toEmail });
      toast.success(data.sent ? `Invite sent to ${toEmail}` : "Saved (email service in test mode)");
      setToEmail("");
    } catch {
      toast.error("Could not send");
    } finally {
      setSending(false);
    }
  };

  return (
    <form onSubmit={send} className="flex gap-2 mt-4">
      <input
        type="email"
        required
        value={toEmail}
        onChange={(e) => setToEmail(e.target.value)}
        placeholder="friend@email.com"
        data-testid="share-friend-input"
        className="flex-1 bg-black/40 border border-white/10 focus:border-lime-400/60 outline-none px-3 py-2.5 text-sm"
      />
      <button
        type="submit"
        disabled={sending}
        data-testid="share-friend-btn"
        className="px-4 border border-lime-400/40 text-lime-400 hover:bg-lime-400/10 text-xs font-bold tracking-[0.2em] uppercase transition-all disabled:opacity-50 flex items-center gap-2"
      >
        <Send className="h-3.5 w-3.5" />
        SEND
      </button>
    </form>
  );
}
