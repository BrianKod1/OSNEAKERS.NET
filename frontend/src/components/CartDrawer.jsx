import { useEffect, useState } from "react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "../components/ui/sheet";
import { useCart } from "../context/CartContext";
import { Trash2, Plus, Minus, ShoppingBag, X, CheckCircle2, Tag } from "lucide-react";
import { createOrder, api } from "../lib/api";
import { toast } from "sonner";

export const CartDrawer = () => {
  const {
    items,
    isOpen,
    setIsOpen,
    removeItem,
    updateQty,
    total: subtotal,
    clear,
  } = useCart();
  const [checkout, setCheckout] = useState(false);
  const [success, setSuccess] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [discountCode, setDiscountCode] = useState("");
  const [discount, setDiscount] = useState(null); // { code, percent, type }
  const [validating, setValidating] = useState(false);
  const [referral, setReferral] = useState(null);
  const [copiedRef, setCopiedRef] = useState(false);
  const [form, setForm] = useState({
    customer_name: "",
    email: "",
    phone: "",
    address: "",
    city: "",
    country: "Canada",
    notes: "",
  });

  // Auto-fill code captured from newsletter popup
  useEffect(() => {
    const saved = localStorage.getItem("osneakers_discount");
    if (saved && !discount) {
      setDiscountCode(saved);
    }
  }, [discount]);

  const discountAmount = discount ? +(subtotal * (discount.percent / 100)).toFixed(2) : 0;
  const total = +(subtotal - discountAmount).toFixed(2);

  const handleField = (k) => (e) =>
    setForm((f) => ({ ...f, [k]: e.target.value }));

  const applyDiscount = async () => {
    if (!discountCode.trim()) return;
    setValidating(true);
    try {
      const { data } = await api.post("/validate-discount", {
        code: discountCode,
        email: form.email || undefined,
      });
      if (data.valid) {
        setDiscount({ code: data.code, percent: data.percent, type: data.type });
        toast.success(
          data.type === "referral"
            ? `${data.percent}% referral discount applied`
            : `${data.percent}% off applied`,
        );
      } else {
        setDiscount(null);
        toast.error("Invalid code");
      }
    } catch {
      toast.error("Could not validate code");
    } finally {
      setValidating(false);
    }
  };

  const removeDiscount = () => {
    setDiscount(null);
    setDiscountCode("");
    localStorage.removeItem("osneakers_discount");
  };

  const submitOrder = async (e) => {
    e.preventDefault();
    if (items.length === 0) return;
    setSubmitting(true);
    try {
      const payload = {
        ...form,
        items: items.map((i) => ({
          product_id: i.product_id,
          name: i.name,
          price: i.price,
          size: i.size,
          quantity: i.quantity,
          image: i.image,
        })),
        total,
        discount_code: discount?.code || null,
      };
      const order = await createOrder(payload);
      setSuccess(order);
      clear();
      localStorage.removeItem("osneakers_discount");
      toast.success(`Order ${order.order_number} placed!`);
      // Fetch buyer's referral code
      try {
        const { data: ref } = await api.get(`/referral/${encodeURIComponent(payload.email)}`);
        setReferral(ref);
      } catch {
        /* non-fatal */
      }
    } catch (err) {
      toast.error("Could not place order. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  const closeAll = () => {
    setIsOpen(false);
    setTimeout(() => {
      setCheckout(false);
      setSuccess(null);
    }, 300);
  };

  return (
    <Sheet open={isOpen} onOpenChange={setIsOpen}>
      <SheetContent
        side="right"
        className="bg-[#050505] border-l border-white/10 text-white p-0 w-full sm:max-w-md flex flex-col"
        data-testid="cart-drawer"
      >
        <SheetHeader className="p-6 border-b border-white/5">
          <SheetTitle className="font-display font-black text-2xl tracking-tight text-white flex items-center gap-3">
            <ShoppingBag className="h-5 w-5 text-cyan-400" />
            {success ? "ORDER CONFIRMED" : checkout ? "CHECKOUT" : "YOUR CART"}
          </SheetTitle>
          <p className="text-[10px] tracking-[0.3em] uppercase font-mono-tech text-zinc-500 mt-1">
            {success
              ? success.order_number
              : `${items.length} ITEM${items.length === 1 ? "" : "S"}`}
          </p>
        </SheetHeader>

        {success ? (
          <div className="flex-1 overflow-y-auto p-8 text-center" data-testid="checkout-success">
            <div className="h-16 w-16 rounded-full bg-lime-400/10 border border-lime-400/40 flex items-center justify-center mx-auto mb-6 glow-lime">
              <CheckCircle2 className="h-8 w-8 text-lime-400" />
            </div>
            <h3 className="font-display font-black text-3xl mb-3">
              YOU'RE LOCKED IN.
            </h3>
            <p className="text-zinc-400 text-sm mb-2">
              Order <span className="font-mono-tech text-cyan-400" data-testid="checkout-success-order-number">{success.order_number}</span>
            </p>
            <p className="text-zinc-500 text-sm max-w-xs mx-auto">
              We just emailed {success.email}. Our team will reach out within
              the hour to confirm sizing & payment.
            </p>

            {referral && (
              <div className="mt-8 text-left glass border border-lime-400/30 p-5" data-testid="referral-block">
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
                    setCopiedRef(true);
                    toast.success("Referral code copied");
                    setTimeout(() => setCopiedRef(false), 1500);
                  }}
                  data-testid="referral-copy-btn"
                  className="w-full group p-4 border border-lime-400/60 bg-lime-400/5 hover:bg-lime-400/10 transition-all flex items-center justify-between"
                >
                  <span className="font-mono-tech text-xl tracking-[5px] text-lime-400 font-bold">
                    {referral.code}
                  </span>
                  <span className="text-[10px] tracking-[0.25em] uppercase text-zinc-400 group-hover:text-lime-400">
                    {copiedRef ? "COPIED" : "COPY"}
                  </span>
                </button>
              </div>
            )}

            <button
              onClick={closeAll}
              className="mt-8 px-8 py-3 bg-cyan-400 text-black font-display font-bold tracking-[0.2em] text-xs uppercase hover:shadow-[0_0_30px_rgba(0,229,255,0.5)] transition-all"
              data-testid="order-success-close"
            >
              KEEP BROWSING
            </button>
          </div>
        ) : checkout ? (
          <form
            onSubmit={submitOrder}
            className="flex-1 flex flex-col overflow-hidden"
          >
            <div className="flex-1 overflow-y-auto p-6 space-y-4">
              {[
                ["customer_name", "Full Name", "text", "name"],
                ["email", "Email", "email", "email"],
                ["phone", "Phone", "tel", "phone"],
                ["address", "Address", "text", "address"],
                ["city", "City", "text", "city"],
                ["country", "Country", "text", "country"],
              ].map(([k, label, type, tid]) => (
                <label key={k} className="block">
                  <span className="text-[10px] tracking-[0.25em] uppercase text-zinc-500 font-bold">
                    {label}
                  </span>
                  <input
                    required
                    type={type}
                    value={form[k]}
                    onChange={handleField(k)}
                    data-testid={`checkout-${tid}`}
                    className="mt-1.5 w-full bg-black/40 border border-white/10 focus:border-cyan-400/60 outline-none px-3 py-2.5 text-sm transition-colors"
                  />
                </label>
              ))}
              <label className="block">
                <span className="text-[10px] tracking-[0.25em] uppercase text-zinc-500 font-bold">
                  Order notes
                </span>
                <textarea
                  rows={2}
                  value={form.notes}
                  onChange={handleField("notes")}
                  className="mt-1.5 w-full bg-black/40 border border-white/10 focus:border-cyan-400/60 outline-none px-3 py-2.5 text-sm resize-none transition-colors"
                  data-testid="checkout-input-notes"
                />
              </label>
            </div>
            <div className="border-t border-white/5 p-6 space-y-3">
              <div className="flex justify-between text-sm text-zinc-400">
                <span>Subtotal</span>
                <span className="font-mono-tech">${subtotal.toFixed(2)}</span>
              </div>
              {discount && (
                <div className="flex justify-between text-sm text-lime-400" data-testid="checkout-discount-row">
                  <span>Discount ({discount.code})</span>
                  <span className="font-mono-tech">−${discountAmount.toFixed(2)}</span>
                </div>
              )}
              <div className="flex justify-between text-sm text-zinc-400">
                <span>Shipping</span>
                <span className="font-mono-tech text-lime-400">FREE</span>
              </div>
              <div className="flex justify-between items-baseline pt-3 border-t border-white/5">
                <span className="text-xs tracking-[0.25em] uppercase text-zinc-500 font-bold">
                  Total
                </span>
                <span className="font-display font-black text-2xl text-white" data-testid="checkout-total">
                  ${total.toFixed(2)}
                </span>
              </div>
              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setCheckout(false)}
                  className="flex-1 px-4 py-3 border border-white/10 text-zinc-300 hover:border-white/30 text-xs font-bold tracking-[0.2em] uppercase transition-colors"
                  data-testid="checkout-back-btn"
                >
                  Back
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="flex-1 px-4 py-3 bg-cyan-400 text-black font-display font-black tracking-[0.2em] text-xs uppercase hover:shadow-[0_0_30px_rgba(0,229,255,0.5)] transition-all disabled:opacity-50"
                  data-testid="checkout-submit-btn"
                >
                  {submitting ? "PLACING..." : "CONFIRM ORDER"}
                </button>
              </div>
            </div>
          </form>
        ) : items.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center p-8 text-center">
            <ShoppingBag className="h-12 w-12 text-zinc-700 mb-4" />
            <p className="text-zinc-400 mb-1 font-display text-xl">
              Cart's empty.
            </p>
            <p className="text-xs text-zinc-600 max-w-xs">
              Browse the catalog and add your next grail.
            </p>
          </div>
        ) : (
          <>
            <div className="flex-1 overflow-y-auto p-6 space-y-4">
              {items.map((i) => (
                <div
                  key={i.key}
                  className="flex gap-4 p-3 glass border-white/5"
                  data-testid={`cart-item-${i.product_id}`}
                >
                  <img
                    src={i.image}
                    alt={i.name}
                    className="h-20 w-20 object-cover rounded-sm bg-zinc-900"
                  />
                  <div className="flex-1 min-w-0">
                    <p className="text-[9px] tracking-[0.25em] uppercase text-zinc-500 font-mono-tech">
                      {i.brand}
                    </p>
                    <p className="font-display font-bold text-sm text-white truncate">
                      {i.name}
                    </p>
                    {i.size && (
                      <p className="text-xs text-zinc-500 mt-0.5">
                        Size: <span className="text-zinc-300">{i.size}</span>
                      </p>
                    )}
                    <div className="flex items-center justify-between mt-2">
                      <div className="flex items-center border border-white/10">
                        <button
                          type="button"
                          onClick={() => updateQty(i.key, i.quantity - 1)}
                          data-testid={`cart-qty-dec-${i.product_id}`}
                          className="h-7 w-7 flex items-center justify-center text-zinc-400 hover:text-cyan-400"
                          aria-label="Decrease"
                        >
                          <Minus className="h-3 w-3" />
                        </button>
                        <span className="w-8 text-center text-xs font-mono-tech">
                          {i.quantity}
                        </span>
                        <button
                          type="button"
                          onClick={() => updateQty(i.key, i.quantity + 1)}
                          data-testid={`cart-qty-inc-${i.product_id}`}
                          className="h-7 w-7 flex items-center justify-center text-zinc-400 hover:text-cyan-400"
                          aria-label="Increase"
                        >
                          <Plus className="h-3 w-3" />
                        </button>
                      </div>
                      <span className="font-display font-bold text-white">
                        ${(i.price * i.quantity).toFixed(0)}
                      </span>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => removeItem(i.key)}
                    className="self-start text-zinc-600 hover:text-red-400 transition-colors"
                    data-testid={`cart-remove-${i.product_id}`}
                    aria-label="Remove"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              ))}
            </div>
            <div className="border-t border-white/5 p-6 space-y-3">
              {/* Discount code */}
              {discount ? (
                <div
                  className="flex items-center justify-between p-2.5 bg-lime-400/5 border border-lime-400/40"
                  data-testid="cart-discount-applied"
                >
                  <div className="flex items-center gap-2">
                    <Tag className="h-3.5 w-3.5 text-lime-400" />
                    <span className="font-mono-tech text-xs text-lime-400 tracking-[3px] font-bold">
                      {discount.code}
                    </span>
                    <span className="text-[10px] tracking-[0.2em] uppercase text-zinc-400">
                      −{discount.percent}%
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={removeDiscount}
                    data-testid="cart-discount-remove"
                    className="text-zinc-500 hover:text-red-400"
                    aria-label="Remove code"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                </div>
              ) : (
                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="Promo code"
                    value={discountCode}
                    onChange={(e) => setDiscountCode(e.target.value.toUpperCase())}
                    data-testid="cart-discount-input"
                    className="flex-1 bg-black/40 border border-white/10 focus:border-cyan-400/60 outline-none px-3 py-2 text-xs font-mono-tech tracking-[2px] uppercase transition-colors"
                  />
                  <button
                    type="button"
                    onClick={applyDiscount}
                    disabled={validating || !discountCode.trim()}
                    data-testid="cart-discount-apply"
                    className="px-4 border border-cyan-400/40 text-cyan-400 hover:bg-cyan-400/10 text-xs font-bold tracking-[0.2em] uppercase transition-all disabled:opacity-40"
                  >
                    {validating ? "..." : "APPLY"}
                  </button>
                </div>
              )}

              <div className="flex justify-between text-sm text-zinc-400 pt-2">
                <span>Subtotal</span>
                <span className="font-mono-tech">${subtotal.toFixed(2)}</span>
              </div>
              {discount && (
                <div className="flex justify-between text-sm text-lime-400">
                  <span>Discount</span>
                  <span className="font-mono-tech">−${discountAmount.toFixed(2)}</span>
                </div>
              )}
              <div className="flex justify-between items-baseline pt-2 border-t border-white/5">
                <span className="text-xs tracking-[0.25em] uppercase text-zinc-500 font-bold">
                  Total
                </span>
                <span className="font-display font-black text-2xl text-white" data-testid="cart-total">
                  ${total.toFixed(2)}
                </span>
              </div>
              <button
                onClick={() => setCheckout(true)}
                className="w-full px-4 py-3.5 bg-cyan-400 text-black font-display font-black tracking-[0.2em] text-xs uppercase hover:shadow-[0_0_30px_rgba(0,229,255,0.5)] transition-all"
                data-testid="cart-checkout-btn"
              >
                CHECKOUT →
              </button>
            </div>
          </>
        )}
      </SheetContent>
    </Sheet>
  );
};
