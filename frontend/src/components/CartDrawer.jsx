import { useState } from "react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "../components/ui/sheet";
import { useCart } from "../context/CartContext";
import { Trash2, Plus, Minus, ShoppingBag, X, CheckCircle2 } from "lucide-react";
import { createOrder } from "../lib/api";
import { toast } from "sonner";

export const CartDrawer = () => {
  const {
    items,
    isOpen,
    setIsOpen,
    removeItem,
    updateQty,
    total,
    clear,
  } = useCart();
  const [checkout, setCheckout] = useState(false);
  const [success, setSuccess] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState({
    customer_name: "",
    email: "",
    phone: "",
    address: "",
    city: "",
    country: "Canada",
    notes: "",
  });

  const handleField = (k) => (e) =>
    setForm((f) => ({ ...f, [k]: e.target.value }));

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
      };
      const order = await createOrder(payload);
      setSuccess(order);
      clear();
      toast.success(`Order ${order.order_number} placed!`);
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
          <div className="flex-1 flex flex-col items-center justify-center p-8 text-center">
            <div className="h-16 w-16 rounded-full bg-lime-400/10 border border-lime-400/40 flex items-center justify-center mb-6 glow-lime">
              <CheckCircle2 className="h-8 w-8 text-lime-400" />
            </div>
            <h3 className="font-display font-black text-3xl mb-3">
              YOU'RE LOCKED IN.
            </h3>
            <p className="text-zinc-400 text-sm mb-2">
              Order <span className="font-mono-tech text-cyan-400">{success.order_number}</span>
            </p>
            <p className="text-zinc-500 text-sm max-w-xs">
              We just emailed {success.email}. Our team will reach out within
              the hour to confirm sizing & payment.
            </p>
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
                ["customer_name", "Full Name", "text"],
                ["email", "Email", "email"],
                ["phone", "Phone", "tel"],
                ["address", "Address", "text"],
                ["city", "City", "text"],
                ["country", "Country", "text"],
              ].map(([k, label, type]) => (
                <label key={k} className="block">
                  <span className="text-[10px] tracking-[0.25em] uppercase text-zinc-500 font-bold">
                    {label}
                  </span>
                  <input
                    required
                    type={type}
                    value={form[k]}
                    onChange={handleField(k)}
                    data-testid={`checkout-input-${k}`}
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
                <span>Items</span>
                <span className="font-mono-tech">${total.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-sm text-zinc-400">
                <span>Shipping</span>
                <span className="font-mono-tech text-lime-400">FREE</span>
              </div>
              <div className="flex justify-between items-baseline pt-3 border-t border-white/5">
                <span className="text-xs tracking-[0.25em] uppercase text-zinc-500 font-bold">
                  Total
                </span>
                <span className="font-display font-black text-2xl text-white">
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
              <div className="flex justify-between items-baseline">
                <span className="text-xs tracking-[0.25em] uppercase text-zinc-500 font-bold">
                  Subtotal
                </span>
                <span className="font-display font-black text-2xl text-white">
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
