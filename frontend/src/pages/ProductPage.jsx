import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { fetchProduct, fetchProducts } from "../lib/api";
import { ChevronLeft, Shield, Truck, RefreshCw, Star } from "lucide-react";
import { useCart } from "../context/CartContext";
import { ProductCard } from "../components/ProductCard";
import { toast } from "sonner";

export default function ProductPage() {
  const { id } = useParams();
  const [product, setProduct] = useState(null);
  const [size, setSize] = useState(null);
  const [related, setRelated] = useState([]);
  const { addItem } = useCart();

  useEffect(() => {
    setProduct(null);
    setSize(null);
    fetchProduct(id).then((p) => {
      setProduct(p);
      setSize(p.sizes?.[0] || null);
      fetchProducts({ brand: p.brand }).then((rs) =>
        setRelated(rs.filter((x) => x.id !== p.id).slice(0, 4)),
      );
    });
  }, [id]);

  if (!product) {
    return (
      <div className="pt-32 pb-24 mx-auto max-w-7xl px-6 lg:px-10 animate-pulse">
        <div className="grid lg:grid-cols-2 gap-12">
          <div className="glass aspect-square"></div>
          <div className="space-y-4">
            <div className="h-4 w-24 glass"></div>
            <div className="h-16 w-3/4 glass"></div>
            <div className="h-8 w-32 glass"></div>
          </div>
        </div>
      </div>
    );
  }

  const handleBuy = () => {
    if (product.sizes?.length && !size) {
      toast.error("Pick a size first");
      return;
    }
    addItem(product, size, 1);
    toast.success(`${product.name} added`);
  };

  return (
    <div className="pt-24 pb-20" data-testid="product-page">
      <div className="mx-auto max-w-7xl px-6 lg:px-10">
        <Link
          to="/catalog"
          className="inline-flex items-center gap-1.5 text-xs tracking-[0.25em] uppercase text-zinc-500 hover:text-cyan-400 transition-colors mb-8"
          data-testid="product-back-btn"
        >
          <ChevronLeft className="h-3.5 w-3.5" /> BACK TO CATALOG
        </Link>

        <div className="grid lg:grid-cols-2 gap-12 lg:gap-16">
          {/* Image */}
          <div className="relative">
            <div className="sticky top-24">
              <div className="relative glass overflow-hidden aspect-square bg-gradient-to-br from-zinc-900 via-black to-zinc-950">
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_60%,rgba(0,229,255,0.18),transparent_60%)]"></div>
                {product.tag && (
                  <span className="absolute top-5 left-5 z-10 px-3 py-1 text-[10px] font-bold tracking-[0.25em] uppercase bg-black/80 backdrop-blur text-lime-400 border border-lime-400/40">
                    {product.tag}
                  </span>
                )}
                <img
                  src={product.image}
                  alt={product.name}
                  data-testid="product-image"
                  className="absolute inset-0 w-full h-full object-cover"
                />
              </div>
            </div>
          </div>

          {/* Info */}
          <div className="animate-fade-up">
            <p className="text-[10px] tracking-[0.3em] uppercase font-mono-tech text-cyan-400 mb-3">
              {product.brand}
            </p>
            <h1
              className="font-display font-black text-4xl sm:text-5xl text-white tracking-tighter leading-[0.95]"
              data-testid="product-name"
            >
              {product.name}
            </h1>

            <div className="mt-6 flex items-center gap-2">
              {Array.from({ length: 5 }).map((_, i) => (
                <Star
                  key={i}
                  className="h-3.5 w-3.5 fill-lime-400 text-lime-400"
                />
              ))}
              <span className="text-xs font-mono-tech text-zinc-500 ml-2">
                4.9 · 1,243 REVIEWS
              </span>
            </div>

            <div className="mt-8 flex items-baseline gap-3">
              <span
                className="font-display font-black text-4xl text-white"
                data-testid="product-price"
              >
                ${product.price}
              </span>
              {product.original_price && (
                <span className="text-lg text-zinc-500 line-through font-mono-tech">
                  ${product.original_price}
                </span>
              )}
              {product.original_price && (
                <span className="px-2 py-0.5 text-[10px] font-bold tracking-[0.2em] uppercase bg-cyan-400 text-black">
                  SAVE $
                  {(product.original_price - product.price).toFixed(0)}
                </span>
              )}
            </div>

            <p className="mt-6 text-zinc-400 leading-relaxed font-light">
              {product.description}
            </p>

            {/* Sizes */}
            {product.sizes?.length > 0 && (
              <div className="mt-10">
                <div className="flex justify-between mb-3">
                  <p className="text-[10px] tracking-[0.3em] uppercase font-mono-tech text-zinc-500">
                    Size
                  </p>
                  <p className="text-[10px] tracking-[0.3em] uppercase font-mono-tech text-zinc-500">
                    US
                  </p>
                </div>
                <div className="grid grid-cols-4 sm:grid-cols-6 gap-2">
                  {product.sizes.map((s) => (
                    <button
                      key={s}
                      onClick={() => setSize(s)}
                      data-testid={`size-btn-${s}`}
                      className={`h-12 border text-sm font-display font-bold transition-all ${
                        size === s
                          ? "border-cyan-400 text-cyan-400 bg-cyan-400/5 shadow-[0_0_15px_rgba(0,229,255,0.25)]"
                          : "border-white/10 text-zinc-300 hover:border-white/30"
                      }`}
                    >
                      {s}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Buy Now */}
            <div className="mt-8 flex flex-col sm:flex-row gap-3">
              <button
                onClick={handleBuy}
                data-testid="buy-now-btn"
                className="flex-1 h-14 bg-cyan-400 text-black font-display font-black tracking-[0.25em] text-sm uppercase hover:shadow-[0_0_40px_rgba(0,229,255,0.6)] transition-all"
              >
                BUY NOW · ${product.price}
              </button>
              <button
                onClick={handleBuy}
                data-testid="add-to-cart-btn"
                className="sm:w-44 h-14 border border-white/15 text-white hover:border-lime-400 hover:text-lime-400 hover:shadow-[0_0_20px_rgba(204,255,0,0.25)] font-display font-bold tracking-[0.2em] text-xs uppercase transition-all"
              >
                ADD TO CART
              </button>
            </div>

            {/* Perks */}
            <div className="mt-10 grid grid-cols-3 gap-3">
              {[
                [Shield, "AUTHENTIC"],
                [Truck, "FREE SHIP"],
                [RefreshCw, "EASY RETURNS"],
              ].map(([Icon, label]) => (
                <div
                  key={label}
                  className="glass p-3 flex flex-col items-center text-center gap-1.5"
                >
                  <Icon className="h-4 w-4 text-cyan-400" />
                  <span className="text-[10px] tracking-[0.2em] uppercase font-bold text-zinc-300">
                    {label}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Related */}
        {related.length > 0 && (
          <div className="mt-32">
            <p className="text-[10px] tracking-[0.3em] uppercase font-mono-tech text-cyan-400 mb-3">
              [ MORE FROM {product.brand.toUpperCase()} ]
            </p>
            <h2 className="font-display font-black text-3xl sm:text-4xl text-white tracking-tighter mb-10">
              YOU'LL ALSO WANT.
            </h2>
            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
              {related.map((p, i) => (
                <ProductCard product={p} key={p.id} index={i} />
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
