import { useEffect, useState } from "react";
import { api } from "../lib/api";
import { Lock, Send, Users, ShoppingBag, Sparkles, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";

const PASSCODE_KEY = "osneakers_admin_passcode";

export default function AdminPage() {
  const [passcode, setPasscode] = useState(localStorage.getItem(PASSCODE_KEY) || "");
  const [authed, setAuthed] = useState(false);
  const [overview, setOverview] = useState(null);
  const [form, setForm] = useState({
    code: "DROP24",
    percent: 20,
    subject: "Flash drop — 24h only.",
    headline: "FRESH HEAT.",
    body: "We just dropped new heat. For the next 24h, use the code below for an extra discount on anything in stock. Once it's gone, it's gone.",
    expires_hours: 24,
  });
  const [sending, setSending] = useState(false);
  const [result, setResult] = useState(null);

  const headers = { "X-Admin-Passcode": passcode };

  const loadOverview = async (pc) => {
    try {
      const { data } = await api.get("/admin/overview", {
        headers: { "X-Admin-Passcode": pc },
      });
      setOverview(data);
      setAuthed(true);
      localStorage.setItem(PASSCODE_KEY, pc);
    } catch {
      toast.error("Invalid passcode");
      setAuthed(false);
      localStorage.removeItem(PASSCODE_KEY);
    }
  };

  useEffect(() => {
    if (passcode) loadOverview(passcode);
  }, []); // eslint-disable-line

  const submitAuth = (e) => {
    e.preventDefault();
    loadOverview(passcode);
  };

  const sendCampaign = async (e) => {
    e.preventDefault();
    setSending(true);
    try {
      const { data } = await api.post("/admin/campaigns", form, { headers });
      setResult(data);
      toast.success(`Sent to ${data.sent_count}/${data.total_subscribers}`);
      loadOverview(passcode);
    } catch {
      toast.error("Send failed");
    } finally {
      setSending(false);
    }
  };

  if (!authed) {
    return (
      <div className="pt-32 pb-20 min-h-screen flex items-center justify-center px-6" data-testid="admin-auth">
        <form onSubmit={submitAuth} className="w-full max-w-sm glass-strong p-8">
          <div className="inline-flex h-12 w-12 rounded-sm bg-cyan-400/10 border border-cyan-400/40 items-center justify-center mb-5">
            <Lock className="h-5 w-5 text-cyan-400" />
          </div>
          <h1 className="font-display font-black text-3xl tracking-tighter mb-2">ADMIN</h1>
          <p className="text-sm text-zinc-500 mb-6">Enter passcode to access campaigns.</p>
          <input
            type="password"
            value={passcode}
            onChange={(e) => setPasscode(e.target.value)}
            placeholder="Passcode"
            data-testid="admin-passcode-input"
            className="w-full bg-black/60 border border-white/15 focus:border-cyan-400/60 outline-none px-4 py-3 text-sm mb-3"
          />
          <button
            type="submit"
            data-testid="admin-passcode-submit"
            className="w-full py-3 bg-cyan-400 text-black font-display font-black tracking-[0.25em] text-xs uppercase hover:shadow-[0_0_30px_rgba(0,229,255,0.5)] transition-all"
          >
            UNLOCK
          </button>
        </form>
      </div>
    );
  }

  return (
    <div className="pt-24 pb-20" data-testid="admin-page">
      <div className="mx-auto max-w-7xl px-6 lg:px-10">
        <p className="text-[10px] tracking-[0.3em] uppercase font-mono-tech text-cyan-400 mb-3">[ COMMAND CENTER ]</p>
        <h1 className="font-display font-black text-5xl sm:text-6xl text-white tracking-tighter mb-12">ADMIN.</h1>

        {/* Stats */}
        <div className="grid sm:grid-cols-3 gap-5 mb-12">
          {[
            { Icon: Users, label: "SUBSCRIBERS", val: overview?.subscribers ?? "—", color: "cyan" },
            { Icon: ShoppingBag, label: "ORDERS", val: overview?.orders ?? "—", color: "lime" },
            { Icon: Sparkles, label: "CAMPAIGNS SENT", val: overview?.campaigns ?? "—", color: "cyan" },
          ].map(({ Icon, label, val, color }) => (
            <div key={label} className="glass p-6">
              <div className={`h-10 w-10 rounded-sm border flex items-center justify-center mb-4 ${color === "cyan" ? "border-cyan-400/40 bg-cyan-400/10" : "border-lime-400/40 bg-lime-400/10"}`}>
                <Icon className={`h-4 w-4 ${color === "cyan" ? "text-cyan-400" : "text-lime-400"}`} />
              </div>
              <div className="font-display font-black text-4xl text-white tracking-tighter">{val}</div>
              <div className="text-[10px] tracking-[0.3em] uppercase text-zinc-500 font-mono-tech mt-1">{label}</div>
            </div>
          ))}
        </div>

        <div className="grid lg:grid-cols-12 gap-8">
          {/* Compose */}
          <div className="lg:col-span-7 glass p-8">
            <p className="text-[10px] tracking-[0.3em] uppercase font-mono-tech text-lime-400 mb-3">[ FLASH DROP CAMPAIGN ]</p>
            <h2 className="font-display font-black text-3xl text-white tracking-tighter mb-6">SEND A DROP.</h2>

            {result ? (
              <div className="text-center py-8" data-testid="campaign-result">
                <CheckCircle2 className="h-10 w-10 text-lime-400 mx-auto mb-4" />
                <p className="font-display font-black text-2xl mb-2">DELIVERED.</p>
                <p className="text-sm text-zinc-400">
                  Sent <strong className="text-lime-400">{result.sent_count}</strong> / {result.total_subscribers} ·{" "}
                  {result.failed_count > 0 && <span className="text-red-400">{result.failed_count} failed</span>}
                </p>
                <p className="text-xs text-zinc-500 mt-2">Code <span className="font-mono-tech text-cyan-400">{result.code}</span> active until {result.expires_at.slice(0, 16).replace("T", " ")} UTC</p>
                <button
                  onClick={() => setResult(null)}
                  className="mt-6 px-6 py-2.5 border border-white/15 text-xs uppercase tracking-[0.2em] font-bold hover:border-cyan-400/60 hover:text-cyan-400 transition-all"
                  data-testid="campaign-new-btn"
                >
                  NEW CAMPAIGN
                </button>
              </div>
            ) : (
              <form onSubmit={sendCampaign} className="space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  <label className="block">
                    <span className="text-[10px] tracking-[0.25em] uppercase text-zinc-500 font-bold">Code</span>
                    <input required value={form.code} onChange={(e) => setForm({ ...form, code: e.target.value.toUpperCase() })} data-testid="campaign-code"
                      className="mt-1.5 w-full bg-black/40 border border-white/10 focus:border-cyan-400/60 outline-none px-3 py-2.5 text-sm font-mono-tech tracking-[3px]" />
                  </label>
                  <label className="block">
                    <span className="text-[10px] tracking-[0.25em] uppercase text-zinc-500 font-bold">% Off</span>
                    <input required type="number" min={1} max={90} value={form.percent} onChange={(e) => setForm({ ...form, percent: +e.target.value })} data-testid="campaign-percent"
                      className="mt-1.5 w-full bg-black/40 border border-white/10 focus:border-cyan-400/60 outline-none px-3 py-2.5 text-sm" />
                  </label>
                </div>
                <label className="block">
                  <span className="text-[10px] tracking-[0.25em] uppercase text-zinc-500 font-bold">Subject</span>
                  <input required value={form.subject} onChange={(e) => setForm({ ...form, subject: e.target.value })} data-testid="campaign-subject"
                    className="mt-1.5 w-full bg-black/40 border border-white/10 focus:border-cyan-400/60 outline-none px-3 py-2.5 text-sm" />
                </label>
                <label className="block">
                  <span className="text-[10px] tracking-[0.25em] uppercase text-zinc-500 font-bold">Headline</span>
                  <input required value={form.headline} onChange={(e) => setForm({ ...form, headline: e.target.value })} data-testid="campaign-headline"
                    className="mt-1.5 w-full bg-black/40 border border-white/10 focus:border-cyan-400/60 outline-none px-3 py-2.5 text-sm font-display font-bold uppercase" />
                </label>
                <label className="block">
                  <span className="text-[10px] tracking-[0.25em] uppercase text-zinc-500 font-bold">Body</span>
                  <textarea required rows={4} value={form.body} onChange={(e) => setForm({ ...form, body: e.target.value })} data-testid="campaign-body"
                    className="mt-1.5 w-full bg-black/40 border border-white/10 focus:border-cyan-400/60 outline-none px-3 py-2.5 text-sm resize-none" />
                </label>
                <label className="block">
                  <span className="text-[10px] tracking-[0.25em] uppercase text-zinc-500 font-bold">Expires in (hours)</span>
                  <input required type="number" min={1} max={168} value={form.expires_hours} onChange={(e) => setForm({ ...form, expires_hours: +e.target.value })} data-testid="campaign-hours"
                    className="mt-1.5 w-full bg-black/40 border border-white/10 focus:border-cyan-400/60 outline-none px-3 py-2.5 text-sm" />
                </label>
                <button type="submit" disabled={sending}
                  data-testid="campaign-send-btn"
                  className="w-full mt-2 py-3.5 bg-lime-400 text-black font-display font-black tracking-[0.25em] text-xs uppercase hover:shadow-[0_0_30px_rgba(204,255,0,0.5)] transition-all disabled:opacity-50 flex items-center justify-center gap-2">
                  <Send className="h-3.5 w-3.5" />
                  {sending ? "SENDING..." : `BLAST TO ${overview?.subscribers ?? 0} SUBSCRIBERS`}
                </button>
              </form>
            )}
          </div>

          {/* Recent activity */}
          <div className="lg:col-span-5 space-y-5">
            <div className="glass p-6">
              <p className="text-[10px] tracking-[0.3em] uppercase font-mono-tech text-cyan-400 mb-4">[ RECENT ORDERS ]</p>
              {overview?.recent_orders?.length ? (
                <div className="space-y-3">
                  {overview.recent_orders.slice(0, 5).map((o) => (
                    <div key={o.id} className="flex justify-between items-center py-2 border-b border-white/5 last:border-0">
                      <div className="min-w-0">
                        <p className="font-mono-tech text-xs text-cyan-400 truncate">{o.order_number}</p>
                        <p className="text-xs text-zinc-500 truncate">{o.customer_name} · {o.email}</p>
                      </div>
                      <span className="font-display font-bold text-white text-sm">${o.total?.toFixed(0)}</span>
                    </div>
                  ))}
                </div>
              ) : <p className="text-sm text-zinc-500">No orders yet.</p>}
            </div>

            <div className="glass p-6">
              <p className="text-[10px] tracking-[0.3em] uppercase font-mono-tech text-lime-400 mb-4">[ RECENT SUBSCRIBERS ]</p>
              {overview?.recent_subscribers?.length ? (
                <div className="space-y-2">
                  {overview.recent_subscribers.slice(0, 8).map((s) => (
                    <p key={s.email} className="text-sm text-zinc-300 font-mono-tech">{s.email}</p>
                  ))}
                </div>
              ) : <p className="text-sm text-zinc-500">No subscribers yet.</p>}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
