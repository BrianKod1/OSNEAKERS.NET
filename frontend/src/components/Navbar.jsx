import { Link, NavLink } from "react-router-dom";
import { ShoppingBag, Search, Menu, X } from "lucide-react";
import { useEffect, useState } from "react";
import { useCart } from "../context/CartContext";
import SearchOverlay from "./SearchOverlay";

const links = [
  { to: "/", label: "Home" },
  { to: "/catalog", label: "Catalog" },
  { to: "/about", label: "About" },
  { to: "/reviews", label: "Reviews" },
  { to: "/track", label: "Track" },
  { to: "/account", label: "Account" },
];

export const Navbar = () => {
  const { count, setIsOpen } = useCart();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);

  // Cmd/Ctrl+K keyboard shortcut
  useEffect(() => {
    const handler = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setSearchOpen(true);
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, []);

  return (
    <header
      className="fixed top-0 inset-x-0 z-50 glass-strong"
      data-testid="main-navbar"
    >
      <div className="mx-auto max-w-7xl px-6 lg:px-10 h-16 flex items-center justify-between">
        <Link
          to="/"
          className="flex items-center gap-2 group"
          data-testid="nav-logo"
        >
          <div className="relative">
            <div className="h-7 w-7 rounded-sm bg-cyan-400/10 border border-cyan-400/40 flex items-center justify-center group-hover:bg-cyan-400/20 transition-colors">
              <span className="font-display font-black text-cyan-400 text-sm">
                O
              </span>
            </div>
            <span className="absolute -top-1 -right-1 h-1.5 w-1.5 rounded-full bg-lime-400 animate-pulse-glow"></span>
          </div>
          <div className="font-display font-black text-white tracking-tight text-lg leading-none">
            OSNEAKERS
            <span className="block text-[9px] tracking-[0.3em] font-mono-tech text-zinc-500 mt-0.5">
              ONTARIO · EST. 2018
            </span>
          </div>
        </Link>

        <nav className="hidden md:flex items-center gap-8">
          {links.map((l) => (
            <NavLink
              key={l.to}
              to={l.to}
              data-testid={`nav-link-${l.label.toLowerCase()}`}
              className={({ isActive }) =>
                `text-xs uppercase tracking-[0.25em] font-semibold transition-colors ${
                  isActive
                    ? "text-cyan-400 text-glow-cyan"
                    : "text-zinc-400 hover:text-white"
                }`
              }
            >
              {l.label}
            </NavLink>
          ))}
        </nav>

        <div className="flex items-center gap-3">
          <button
            onClick={() => setSearchOpen(true)}
            className="hidden sm:flex h-9 items-center gap-2 px-3 border border-white/10 hover:border-cyan-400/60 text-zinc-400 hover:text-cyan-400 transition-all group"
            data-testid="nav-search-btn"
            aria-label="Search"
          >
            <Search className="h-3.5 w-3.5" />
            <span className="text-[10px] tracking-[0.25em] uppercase font-bold hidden md:inline">SEARCH</span>
            <kbd className="hidden md:inline font-mono-tech text-[9px] tracking-wider text-zinc-600 group-hover:text-cyan-400/60 transition-colors border border-white/10 px-1 py-0.5">⌘K</kbd>
          </button>
          <button
            onClick={() => setIsOpen(true)}
            className="relative h-9 px-3 flex items-center gap-2 border border-white/10 hover:border-cyan-400/60 text-white hover:text-cyan-400 transition-all hover:shadow-[0_0_18px_rgba(0,229,255,0.25)]"
            data-testid="nav-cart-btn"
          >
            <ShoppingBag className="h-4 w-4" />
            <span className="text-xs font-bold tracking-wider">CART</span>
            {count > 0 && (
              <span
                className="absolute -top-2 -right-2 h-5 min-w-[20px] px-1 rounded-full bg-lime-400 text-black text-[10px] font-black flex items-center justify-center"
                data-testid="nav-cart-count"
              >
                {count}
              </span>
            )}
          </button>
          <button
            className="md:hidden h-9 w-9 flex items-center justify-center text-white"
            onClick={() => setMobileOpen((v) => !v)}
            data-testid="nav-mobile-toggle"
            aria-label="Menu"
          >
            {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </div>

      {mobileOpen && (
        <div className="md:hidden glass-strong border-t border-white/5">
          <div className="px-6 py-4 flex flex-col gap-4">
            <button
              type="button"
              onClick={() => { setMobileOpen(false); setSearchOpen(true); }}
              data-testid="nav-mobile-search"
              className="flex items-center gap-2 text-sm uppercase tracking-[0.25em] font-semibold text-zinc-300"
            >
              <Search className="h-4 w-4 text-cyan-400" /> Search
            </button>
            {links.map((l) => (
              <NavLink
                key={l.to}
                to={l.to}
                onClick={() => setMobileOpen(false)}
                data-testid={`nav-mobile-link-${l.label.toLowerCase()}`}
                className={({ isActive }) =>
                  `text-sm uppercase tracking-[0.25em] font-semibold ${
                    isActive ? "text-cyan-400" : "text-zinc-300"
                  }`
                }
              >
                {l.label}
              </NavLink>
            ))}
          </div>
        </div>
      )}

      <SearchOverlay open={searchOpen} onClose={() => setSearchOpen(false)} />
    </header>
  );
};
