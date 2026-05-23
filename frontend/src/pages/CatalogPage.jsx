import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { fetchProducts, fetchBrands } from "../lib/api";
import { ProductCard } from "../components/ProductCard";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../components/ui/select";
import { Slider } from "../components/ui/slider";
import { SlidersHorizontal, X } from "lucide-react";

export default function CatalogPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [products, setProducts] = useState([]);
  const [brands, setBrands] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [priceRange, setPriceRange] = useState([0, 1500]);

  const brand = searchParams.get("brand") || "All";
  const sort = searchParams.get("sort") || "featured";
  const q = searchParams.get("q") || "";

  const setParam = (key, value) => {
    const next = new URLSearchParams(searchParams);
    if (!value || value === "All" || value === "featured") next.delete(key);
    else next.set(key, value);
    setSearchParams(next);
  };

  useEffect(() => {
    fetchBrands().then(setBrands);
  }, []);

  useEffect(() => {
    setLoading(true);
    const params = { sort };
    if (brand !== "All") params.brand = brand;
    params.min_price = priceRange[0];
    params.max_price = priceRange[1];
    if (q.trim()) params.q = q.trim();
    fetchProducts(params).then((d) => {
      setProducts(d);
      setLoading(false);
    });
  }, [brand, sort, priceRange, q]);

  const allBrands = useMemo(() => ["All", ...brands.map((b) => b.name)], [brands]);

  return (
    <div className="pt-24 pb-20" data-testid="catalog-page">
      <div className="mx-auto max-w-7xl px-6 lg:px-10">
        {/* Header */}
        <div className="mb-12">
          <p className="text-[10px] tracking-[0.3em] uppercase font-mono-tech text-cyan-400 mb-3">
            [ THE FULL ARSENAL ]
          </p>
          <h1 className="font-display font-black text-5xl sm:text-6xl text-white tracking-tighter">
            CATALOG.
          </h1>
          {q && (
            <div className="mt-5 inline-flex items-center gap-2 px-3 py-1.5 border border-cyan-400/40 bg-cyan-400/5" data-testid="catalog-search-chip">
              <span className="text-[10px] tracking-[0.25em] uppercase font-mono-tech text-zinc-400">SEARCH:</span>
              <span className="text-sm text-cyan-400 font-display font-bold">"{q}"</span>
              <button
                type="button"
                onClick={() => setParam("q", "")}
                aria-label="Clear search"
                data-testid="catalog-search-clear"
                className="text-zinc-500 hover:text-white ml-1"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </div>
          )}
        </div>

        <div className="grid lg:grid-cols-12 gap-8">
          {/* Filters Sidebar */}
          <aside
            className={`lg:col-span-3 ${filtersOpen ? "fixed inset-0 z-40 bg-black/95 p-6 overflow-y-auto" : "hidden lg:block"}`}
            data-testid="catalog-filters"
          >
            {filtersOpen && (
              <div className="flex justify-between items-center mb-8 lg:hidden">
                <p className="font-display font-black text-2xl">FILTERS</p>
                <button onClick={() => setFiltersOpen(false)} data-testid="filters-close">
                  <X className="h-5 w-5" />
                </button>
              </div>
            )}

            <div className="glass p-6 lg:sticky lg:top-24">
              {/* Brand */}
              <div className="mb-8">
                <p className="text-[10px] tracking-[0.3em] uppercase font-mono-tech text-zinc-500 mb-4">
                  Brand
                </p>
                <div className="space-y-1.5">
                  {allBrands.map((b) => (
                    <button
                      key={b}
                      onClick={() => setParam("brand", b)}
                      data-testid={`filter-brand-${b}`}
                      className={`w-full text-left px-3 py-2 text-sm border transition-all ${
                        brand === b
                          ? "border-cyan-400/60 text-cyan-400 bg-cyan-400/5 shadow-[0_0_18px_rgba(0,229,255,0.15)]"
                          : "border-transparent text-zinc-400 hover:border-white/10 hover:text-white"
                      }`}
                    >
                      {b}
                    </button>
                  ))}
                </div>
              </div>

              {/* Price */}
              <div className="mb-2">
                <p className="text-[10px] tracking-[0.3em] uppercase font-mono-tech text-zinc-500 mb-4">
                  Price Range
                </p>
                <Slider
                  value={priceRange}
                  onValueChange={setPriceRange}
                  min={0}
                  max={1500}
                  step={10}
                  data-testid="filter-price-slider"
                  className="my-6"
                />
                <div className="flex justify-between text-xs font-mono-tech">
                  <span className="text-cyan-400">${priceRange[0]}</span>
                  <span className="text-cyan-400">${priceRange[1]}</span>
                </div>
              </div>
            </div>
          </aside>

          {/* Products */}
          <div className="lg:col-span-9">
            <div className="flex items-center justify-between mb-6">
              <p className="text-xs font-mono-tech text-zinc-500 tracking-wider">
                {loading ? "LOADING..." : `${products.length} RESULTS`}
              </p>
              <div className="flex items-center gap-3">
                <button
                  className="lg:hidden flex items-center gap-2 px-3 py-2 border border-white/10 text-xs uppercase tracking-wider"
                  onClick={() => setFiltersOpen(true)}
                  data-testid="filters-open-btn"
                >
                  <SlidersHorizontal className="h-3.5 w-3.5" />
                  Filters
                </button>
                <Select value={sort} onValueChange={(v) => setParam("sort", v)}>
                  <SelectTrigger
                    className="w-[180px] bg-black/40 border-white/10 text-xs uppercase tracking-wider"
                    data-testid="filter-sort-trigger"
                  >
                    <SelectValue placeholder="Sort" />
                  </SelectTrigger>
                  <SelectContent className="bg-[#0a0a0a] border-white/10 text-white">
                    <SelectItem value="featured">Featured</SelectItem>
                    <SelectItem value="newest">Newest</SelectItem>
                    <SelectItem value="price_asc">Price: Low → High</SelectItem>
                    <SelectItem value="price_desc">Price: High → Low</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {loading ? (
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
                {Array.from({ length: 6 }).map((_, i) => (
                  <div
                    key={i}
                    className="glass aspect-[4/5] animate-pulse-glow"
                  ></div>
                ))}
              </div>
            ) : products.length === 0 ? (
              <div className="glass p-16 text-center">
                <p className="font-display font-black text-2xl text-white mb-2">
                  NO MATCHES.
                </p>
                <p className="text-zinc-500 text-sm">
                  Adjust the filters to see more.
                </p>
              </div>
            ) : (
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
                {products.map((p, i) => (
                  <ProductCard product={p} key={p.id} index={i} />
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
