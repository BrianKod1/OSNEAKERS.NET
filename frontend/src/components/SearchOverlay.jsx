import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Search, X, Loader2 } from "lucide-react";
import { searchProducts } from "../lib/api";

export default function SearchOverlay({ open, onClose }) {
  const [q, setQ] = useState("");
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [highlight, setHighlight] = useState(0);
  const inputRef = useRef(null);
  const navigate = useNavigate();

  useEffect(() => {
    if (open) {
      setQ("");
      setResults([]);
      setHighlight(0);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [open]);

  // Debounced search
  useEffect(() => {
    if (!q.trim()) {
      setResults([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    const t = setTimeout(async () => {
      try {
        const data = await searchProducts(q.trim(), 8);
        setResults(data.results || []);
        setHighlight(0);
      } catch {
        setResults([]);
      } finally {
        setLoading(false);
      }
    }, 220);
    return () => clearTimeout(t);
  }, [q]);

  const go = (product) => {
    navigate(`/product/${product.id}`);
    onClose();
  };

  const onKey = (e) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setHighlight((h) => Math.min(h + 1, results.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setHighlight((h) => Math.max(h - 1, 0));
    } else if (e.key === "Enter") {
      e.preventDefault();
      if (results[highlight]) {
        go(results[highlight]);
      } else if (q.trim()) {
        navigate(`/catalog?q=${encodeURIComponent(q.trim())}`);
        onClose();
      }
    } else if (e.key === "Escape") {
      onClose();
    }
  };

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 bg-black/85 backdrop-blur-md z-[60] flex items-start justify-center p-4 pt-20 sm:pt-24"
      data-testid="search-overlay"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="bg-[#0a0a0a] border border-cyan-400/30 w-full max-w-2xl shadow-[0_0_60px_rgba(0,229,255,0.15)]">
        <div className="flex items-center gap-3 px-5 py-4 border-b border-white/5">
          <Search className="h-4 w-4 text-cyan-400 shrink-0" />
          <input
            ref={inputRef}
            type="text"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            onKeyDown={onKey}
            placeholder="Search Jordans, Yeezy, Nike, Off-White…"
            data-testid="search-input"
            className="flex-1 bg-transparent outline-none text-white text-sm placeholder:text-zinc-600"
          />
          {loading && <Loader2 className="h-4 w-4 text-cyan-400 animate-spin shrink-0" />}
          <button
            type="button"
            onClick={onClose}
            data-testid="search-close"
            className="text-zinc-500 hover:text-white transition-colors"
            aria-label="Close"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="max-h-[60vh] overflow-y-auto" data-testid="search-results">
          {!q.trim() ? (
            <div className="px-5 py-12 text-center">
              <p className="text-[10px] tracking-[0.3em] uppercase font-mono-tech text-zinc-600 mb-1">
                START TYPING
              </p>
              <p className="text-sm text-zinc-500">
                Search by name, brand, or model.
              </p>
              <div className="mt-6 flex flex-wrap gap-2 justify-center">
                {["Air Jordan", "Yeezy", "Nike", "Off-White", "Adidas", "Balenciaga"].map((tag) => (
                  <button
                    key={tag}
                    type="button"
                    onClick={() => setQ(tag)}
                    data-testid={`search-suggestion-${tag.replace(/\s+/g, "-").toLowerCase()}`}
                    className="px-3 py-1.5 text-[10px] tracking-[0.2em] uppercase border border-white/10 text-zinc-400 hover:border-cyan-400/60 hover:text-cyan-400 transition-all"
                  >
                    {tag}
                  </button>
                ))}
              </div>
            </div>
          ) : results.length === 0 && !loading ? (
            <div className="px-5 py-12 text-center">
              <p className="font-display font-black text-xl mb-1 text-white">NO MATCHES.</p>
              <p className="text-sm text-zinc-500">Try a different brand or model.</p>
            </div>
          ) : (
            <div className="divide-y divide-white/5">
              {results.map((p, i) => (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => go(p)}
                  onMouseEnter={() => setHighlight(i)}
                  data-testid={`search-result-${p.id}`}
                  className={`w-full flex items-center gap-4 px-5 py-3 text-left transition-colors ${
                    i === highlight ? "bg-cyan-400/5" : "hover:bg-white/[0.02]"
                  }`}
                >
                  <img
                    src={p.image}
                    alt={p.name}
                    className="h-12 w-12 object-cover bg-zinc-900 border border-white/5"
                    loading="lazy"
                  />
                  <div className="flex-1 min-w-0">
                    <p className="text-[10px] tracking-[0.25em] uppercase font-mono-tech text-zinc-500">
                      {p.brand}
                    </p>
                    <p className="text-sm text-white font-display font-bold truncate">{p.name}</p>
                  </div>
                  <span className="font-mono-tech text-sm text-cyan-400 shrink-0">${p.price}</span>
                </button>
              ))}
              {q.trim() && (
                <button
                  type="button"
                  onClick={() => {
                    navigate(`/catalog?q=${encodeURIComponent(q.trim())}`);
                    onClose();
                  }}
                  data-testid="search-see-all"
                  className="w-full px-5 py-3 text-left text-[11px] tracking-[0.25em] uppercase font-bold text-cyan-400 hover:bg-cyan-400/5 transition-colors"
                >
                  SEE ALL RESULTS FOR "{q.trim()}" →
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
