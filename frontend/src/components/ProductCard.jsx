import { Link } from "react-router-dom";
import { ArrowUpRight } from "lucide-react";

export const ProductCard = ({ product, index = 0 }) => {
  const discount = product.original_price
    ? Math.round(
        ((product.original_price - product.price) / product.original_price) * 100,
      )
    : 0;

  return (
    <Link
      to={`/product/${product.id}`}
      data-testid={`product-card-${product.id}`}
      className="group relative block animate-fade-up"
      style={{ animationDelay: `${(index % 8) * 60}ms` }}
    >
      <div className="relative overflow-hidden glass border-white/5 group-hover:border-cyan-400/50 transition-all duration-500 group-hover:shadow-[0_0_40px_rgba(0,229,255,0.2)]">
        {/* Tag */}
        {product.tag && (
          <span className="absolute top-3 left-3 z-10 px-2 py-0.5 text-[9px] font-bold tracking-[0.2em] uppercase bg-black/80 backdrop-blur text-lime-400 border border-lime-400/40">
            {product.tag}
          </span>
        )}
        {discount > 0 && (
          <span className="absolute top-3 right-3 z-10 px-2 py-0.5 text-[9px] font-bold tracking-[0.2em] uppercase bg-cyan-400 text-black">
            -{discount}%
          </span>
        )}

        {/* Image */}
        <div className="relative aspect-[4/3] overflow-hidden bg-gradient-to-br from-zinc-900 via-black to-zinc-950">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_60%,rgba(0,229,255,0.15),transparent_60%)] opacity-0 group-hover:opacity-100 transition-opacity duration-700"></div>
          <img
            src={product.image}
            alt={product.name}
            loading="lazy"
            className="absolute inset-0 h-full w-full object-cover transition-transform duration-700 group-hover:scale-110"
          />
          <div className="absolute bottom-0 inset-x-0 h-1/3 bg-gradient-to-t from-black/80 to-transparent"></div>
        </div>

        {/* Info */}
        <div className="p-5">
          <p className="text-[10px] tracking-[0.3em] uppercase font-mono-tech text-zinc-500 mb-1.5">
            {product.brand}
          </p>
          <h3 className="font-display font-bold text-white text-base leading-tight line-clamp-2 group-hover:text-cyan-400 transition-colors">
            {product.name}
          </h3>

          <div className="mt-4 flex items-end justify-between">
            <div className="flex items-baseline gap-2">
              <span className="font-display font-black text-white text-xl">
                ${product.price}
              </span>
              {product.original_price && (
                <span className="text-xs text-zinc-500 line-through font-mono-tech">
                  ${product.original_price}
                </span>
              )}
            </div>
            <div className="h-8 w-8 flex items-center justify-center border border-white/10 group-hover:border-cyan-400/60 group-hover:bg-cyan-400/10 transition-all">
              <ArrowUpRight className="h-3.5 w-3.5 text-zinc-300 group-hover:text-cyan-400 transition-colors" />
            </div>
          </div>
        </div>
      </div>
    </Link>
  );
};
