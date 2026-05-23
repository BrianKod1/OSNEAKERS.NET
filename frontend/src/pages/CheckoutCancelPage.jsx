import { Link, useSearchParams } from "react-router-dom";
import { XCircle } from "lucide-react";

export default function CheckoutCancelPage() {
  const [params] = useSearchParams();
  const orderNumber = params.get("order");

  return (
    <main
      className="min-h-screen bg-[#050505] text-white pt-24 pb-20 px-4"
      data-testid="checkout-cancel-page"
    >
      <div className="max-w-xl mx-auto text-center">
        <div className="h-16 w-16 rounded-full bg-amber-400/10 border border-amber-400/40 flex items-center justify-center mx-auto mb-6">
          <XCircle className="h-8 w-8 text-amber-400" />
        </div>
        <p className="text-[10px] tracking-[0.3em] uppercase font-mono-tech text-amber-400 mb-2">
          [ CHECKOUT CANCELLED ]
        </p>
        <h1 className="font-display font-black text-4xl sm:text-5xl mb-3">
          NO CHARGE MADE.
        </h1>
        <p className="text-zinc-400 text-sm mb-2">
          Your cart is still saved. Pick up where you left off whenever you're ready.
        </p>
        {orderNumber && (
          <p className="text-[10px] tracking-[0.3em] uppercase font-mono-tech text-zinc-600 mb-6">
            REF: {orderNumber}
          </p>
        )}
        <div className="flex flex-col sm:flex-row gap-3 mt-8 justify-center">
          <Link
            to="/catalog"
            className="px-6 py-3 bg-cyan-400 text-black font-display font-black tracking-[0.2em] text-xs uppercase hover:shadow-[0_0_30px_rgba(0,229,255,0.5)] transition-all"
            data-testid="cancel-back-to-catalog"
          >
            BACK TO CATALOG
          </Link>
          <Link
            to="/"
            className="px-6 py-3 border border-white/10 text-zinc-300 hover:border-white/30 font-display font-bold tracking-[0.2em] text-xs uppercase transition-all"
            data-testid="cancel-home"
          >
            HOME
          </Link>
        </div>
      </div>
    </main>
  );
}
