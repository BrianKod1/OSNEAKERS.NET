import { useEffect, useRef, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { CheckCircle2, Loader2, AlertCircle } from "lucide-react";
import { getCheckoutStatus, api } from "../lib/api";
import { useCart } from "../context/CartContext";
import { toast } from "sonner";

const MAX_ATTEMPTS = 8;
const POLL_INTERVAL_MS = 2000;

export default function CheckoutSuccessPage() {
  const [params] = useSearchParams();
  const sessionId = params.get("session_id");
  const [state, setState] = useState("polling"); // polling | paid | expired | error
  const [order, setOrder] = useState(null);
  const [referral, setReferral] = useState(null);
  const attemptsRef = useRef(0);
  const cancelledRef = useRef(false);
  const { clear } = useCart();

  useEffect(() => {
    if (!sessionId) {
      setState("error");
      return;
    }

    const poll = async () => {
      if (cancelledRef.current) return;
      attemptsRef.current += 1;
      try {
        const data = await getCheckoutStatus(sessionId);
        if (data.payment_status === "paid") {
          setOrder(data.order);
          setState("paid");
          clear();
          localStorage.removeItem("osneakers_discount");
          localStorage.removeItem("osneakers_last_session");
          localStorage.removeItem("osneakers_last_order");
          toast.success(`Order ${data.order?.order_number} confirmed`);
          if (data.order?.email) {
            try {
              const { data: ref } = await api.get(
                `/referral/${encodeURIComponent(data.order.email)}`
              );
              setReferral(ref);
            } catch {
              /* non-fatal */
            }
          }
          return;
        }
        if (data.status === "expired") {
          setState("expired");
          return;
        }
        if (attemptsRef.current >= MAX_ATTEMPTS) {
          setState("error");
          return;
        }
        setTimeout(poll, POLL_INTERVAL_MS);
      } catch {
        if (attemptsRef.current >= MAX_ATTEMPTS) {
          setState("error");
        } else {
          setTimeout(poll, POLL_INTERVAL_MS);
        }
      }
    };
    poll();
    return () => {
      cancelledRef.current = true;
    };
  }, [sessionId, clear]);

  return (
    <main className="min-h-screen bg-[#050505] text-white pt-24 pb-20 px-4" data-testid="checkout-success-page">
      <div className="max-w-2xl mx-auto">
        {state === "polling" && (
          <div className="text-center py-20" data-testid="checkout-polling">
            <Loader2 className="h-10 w-10 text-cyan-400 mx-auto animate-spin mb-6" />
            <p className="text-[10px] tracking-[0.3em] uppercase font-mono-tech text-zinc-500 mb-2">
              [ CONFIRMING PAYMENT ]
            </p>
            <h1 className="font-display font-black text-3xl">Hang tight…</h1>
            <p className="text-zinc-500 text-sm mt-3">
              Stripe is finalizing your order.
            </p>
          </div>
        )}

        {state === "paid" && order && (
          <div data-testid="checkout-paid">
            <div className="text-center mb-10">
              <div className="h-16 w-16 rounded-full bg-lime-400/10 border border-lime-400/40 flex items-center justify-center mx-auto mb-6">
                <CheckCircle2 className="h-8 w-8 text-lime-400" />
              </div>
              <p className="text-[10px] tracking-[0.3em] uppercase font-mono-tech text-lime-400 mb-2">
                [ PAYMENT CONFIRMED ]
              </p>
              <h1 className="font-display font-black text-4xl sm:text-5xl mb-2">
                YOU'RE LOCKED IN.
              </h1>
              <p className="text-zinc-400 text-sm">
                Order{" "}
                <span className="font-mono-tech text-cyan-400" data-testid="success-order-number">
                  {order.order_number}
                </span>
              </p>
              <p className="text-zinc-500 text-sm mt-1">
                Confirmation sent to {order.email}
              </p>
            </div>

            <div className="glass border border-white/10 p-6 mb-6">
              <p className="text-[10px] tracking-[0.3em] uppercase font-mono-tech text-zinc-500 mb-4">
                [ ORDER SUMMARY ]
              </p>
              <div className="space-y-3 text-sm">
                <div className="flex justify-between text-zinc-400">
                  <span>Subtotal</span>
                  <span className="font-mono-tech">${order.subtotal.toFixed(2)}</span>
                </div>
                {order.discount_amount > 0 && (
                  <div className="flex justify-between text-lime-400">
                    <span>Discount ({order.discount_code})</span>
                    <span className="font-mono-tech">−${order.discount_amount.toFixed(2)}</span>
                  </div>
                )}
                {order.credits_applied > 0 && (
                  <div className="flex justify-between text-lime-400">
                    <span>Credits</span>
                    <span className="font-mono-tech">−${order.credits_applied.toFixed(2)}</span>
                  </div>
                )}
                <div className="flex justify-between text-zinc-400">
                  <span>Shipping</span>
                  <span className="font-mono-tech">
                    {order.shipping === 0 ? (
                      <span className="text-lime-400">FREE</span>
                    ) : (
                      `$${order.shipping.toFixed(2)}`
                    )}
                  </span>
                </div>
                <div className="flex justify-between items-baseline pt-3 border-t border-white/5">
                  <span className="text-xs tracking-[0.25em] uppercase text-zinc-500 font-bold">
                    Total
                  </span>
                  <span className="font-display font-black text-2xl text-white">
                    ${order.total.toFixed(2)}{" "}
                    <span className="text-[10px] font-mono-tech text-zinc-500 ml-1">CAD</span>
                  </span>
                </div>
              </div>
            </div>

            {referral && (
              <div className="glass border border-lime-400/30 p-6 mb-6" data-testid="success-referral">
                <p className="text-[10px] tracking-[0.3em] uppercase font-mono-tech text-lime-400 mb-2">
                  [ SHARE &amp; EARN ]
                </p>
                <p className="text-sm text-zinc-300 leading-relaxed mb-4">
                  Friends get <strong className="text-white">5% off</strong>, you earn{" "}
                  <strong className="text-lime-400">5% credit</strong> on every order they place.
                </p>
                <button
                  type="button"
                  onClick={async () => {
                    await navigator.clipboard.writeText(referral.code);
                    toast.success("Referral code copied");
                  }}
                  data-testid="success-referral-copy"
                  className="w-full group p-4 border border-lime-400/60 bg-lime-400/5 hover:bg-lime-400/10 transition-all flex items-center justify-between"
                >
                  <span className="font-mono-tech text-xl tracking-[5px] text-lime-400 font-bold">
                    {referral.code}
                  </span>
                  <span className="text-[10px] tracking-[0.25em] uppercase text-zinc-400 group-hover:text-lime-400">
                    COPY
                  </span>
                </button>
              </div>
            )}

            <div className="flex flex-col sm:flex-row gap-3">
              <Link
                to="/catalog"
                className="flex-1 text-center px-6 py-3 bg-cyan-400 text-black font-display font-black tracking-[0.2em] text-xs uppercase hover:shadow-[0_0_30px_rgba(0,229,255,0.5)] transition-all"
                data-testid="success-keep-browsing"
              >
                KEEP BROWSING
              </Link>
              <Link
                to={`/order/${order.order_number}`}
                className="flex-1 text-center px-6 py-3 border border-white/10 text-zinc-300 hover:border-white/30 font-display font-bold tracking-[0.2em] text-xs uppercase transition-all"
                data-testid="success-view-receipt"
              >
                VIEW RECEIPT
              </Link>
            </div>
          </div>
        )}

        {state === "expired" && (
          <div className="text-center py-20" data-testid="checkout-expired">
            <AlertCircle className="h-10 w-10 text-amber-400 mx-auto mb-6" />
            <h1 className="font-display font-black text-3xl mb-2">Session expired</h1>
            <p className="text-zinc-500 text-sm mb-6">
              Your checkout session timed out. Please add items to your cart and try again.
            </p>
            <Link
              to="/catalog"
              className="inline-block px-6 py-3 bg-cyan-400 text-black font-display font-black tracking-[0.2em] text-xs uppercase"
            >
              BACK TO CATALOG
            </Link>
          </div>
        )}

        {state === "error" && (
          <div className="text-center py-20" data-testid="checkout-error">
            <AlertCircle className="h-10 w-10 text-red-400 mx-auto mb-6" />
            <h1 className="font-display font-black text-3xl mb-2">We couldn't confirm your payment</h1>
            <p className="text-zinc-500 text-sm mb-6">
              If Stripe charged you, you'll still receive a confirmation email shortly. Otherwise please contact us.
            </p>
            <Link
              to="/catalog"
              className="inline-block px-6 py-3 bg-cyan-400 text-black font-display font-black tracking-[0.2em] text-xs uppercase"
            >
              BACK TO CATALOG
            </Link>
          </div>
        )}
      </div>
    </main>
  );
}
