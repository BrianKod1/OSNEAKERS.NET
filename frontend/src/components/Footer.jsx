import { Mail, Phone, MapPin, Instagram, MessageCircle } from "lucide-react";
import { Link } from "react-router-dom";

export const Footer = () => {
  return (
    <footer
      className="relative border-t border-white/5 mt-32 overflow-hidden"
      data-testid="site-footer"
    >
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute -top-32 left-1/4 h-64 w-64 rounded-full bg-cyan-500/10 blur-3xl"></div>
        <div className="absolute -bottom-32 right-1/4 h-64 w-64 rounded-full bg-lime-500/5 blur-3xl"></div>
      </div>

      <div className="relative mx-auto max-w-7xl px-6 lg:px-10 py-20">
        <div className="grid lg:grid-cols-12 gap-12">
          <div className="lg:col-span-7">
            <p className="text-xs tracking-[0.3em] font-mono-tech text-cyan-400 mb-4">
              [ LET'S TALK ]
            </p>
            <h2 className="font-display font-black text-5xl sm:text-6xl lg:text-7xl text-white tracking-tighter leading-[0.9]">
              READY TO
              <br />
              <span className="text-glow-cyan text-cyan-400">STEP UP?</span>
            </h2>
            <p className="mt-6 max-w-md text-zinc-400 leading-relaxed font-light">
              Drop us a line, slide into the DMs, or call the line. We respond
              within minutes — that's how we built 7 years of trust.
            </p>

            <div className="mt-10 flex flex-col gap-4 max-w-md">
              <a
                href="mailto:osneakers9@gmail.com"
                data-testid="footer-email"
                className="group flex items-center gap-4 p-4 glass hover:border-cyan-400/50 hover:bg-black/60 transition-all"
              >
                <div className="h-10 w-10 rounded-sm bg-cyan-400/10 border border-cyan-400/30 flex items-center justify-center group-hover:bg-cyan-400/20">
                  <Mail className="h-4 w-4 text-cyan-400" />
                </div>
                <div>
                  <div className="text-[10px] tracking-[0.25em] uppercase text-zinc-500 font-bold">
                    Email
                  </div>
                  <div className="text-white font-medium group-hover:text-cyan-400 transition-colors">
                    osneakers9@gmail.com
                  </div>
                </div>
              </a>

              <a
                href="tel:+12896007311"
                data-testid="footer-phone"
                className="group flex items-center gap-4 p-4 glass hover:border-lime-400/50 hover:bg-black/60 transition-all"
              >
                <div className="h-10 w-10 rounded-sm bg-lime-400/10 border border-lime-400/30 flex items-center justify-center group-hover:bg-lime-400/20">
                  <Phone className="h-4 w-4 text-lime-400" />
                </div>
                <div>
                  <div className="text-[10px] tracking-[0.25em] uppercase text-zinc-500 font-bold">
                    Phone
                  </div>
                  <div className="text-white font-medium group-hover:text-lime-400 transition-colors">
                    +1 (289) 600-7311
                  </div>
                </div>
              </a>

              <div className="flex items-center gap-4 p-4 glass">
                <div className="h-10 w-10 rounded-sm bg-white/5 border border-white/10 flex items-center justify-center">
                  <MapPin className="h-4 w-4 text-zinc-300" />
                </div>
                <div>
                  <div className="text-[10px] tracking-[0.25em] uppercase text-zinc-500 font-bold">
                    HQ
                  </div>
                  <div className="text-white font-medium">Ontario, Canada</div>
                </div>
              </div>
            </div>
          </div>

          <div className="lg:col-span-5 grid grid-cols-2 gap-8">
            <div>
              <p className="text-[10px] tracking-[0.3em] uppercase text-zinc-500 font-bold mb-5">
                Shop
              </p>
              <ul className="space-y-3">
                {["Catalog", "New Drops", "Sneakers", "Apparel"].map((x) => (
                  <li key={x}>
                    <Link
                      to="/catalog"
                      className="text-zinc-400 hover:text-cyan-400 transition-colors text-sm"
                      data-testid={`footer-link-${x.toLowerCase().replace(" ", "-")}`}
                    >
                      {x}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <p className="text-[10px] tracking-[0.3em] uppercase text-zinc-500 font-bold mb-5">
                Company
              </p>
              <ul className="space-y-3">
                {[
                  ["About", "/about"],
                  ["Reviews", "/reviews"],
                  ["Authenticity", "/about"],
                  ["Shipping", "/about"],
                ].map(([x, to]) => (
                  <li key={x}>
                    <Link
                      to={to}
                      className="text-zinc-400 hover:text-cyan-400 transition-colors text-sm"
                    >
                      {x}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            <div className="col-span-2 pt-6 border-t border-white/5">
              <p className="text-[10px] tracking-[0.3em] uppercase text-zinc-500 font-bold mb-4">
                Social
              </p>
              <div className="flex gap-3">
                <a
                  href="#"
                  className="h-10 w-10 flex items-center justify-center border border-white/10 hover:border-cyan-400/60 hover:text-cyan-400 text-zinc-400 transition-all"
                  data-testid="footer-instagram"
                  aria-label="Instagram"
                >
                  <Instagram className="h-4 w-4" />
                </a>
                <a
                  href="#"
                  className="h-10 w-10 flex items-center justify-center border border-white/10 hover:border-lime-400/60 hover:text-lime-400 text-zinc-400 transition-all"
                  data-testid="footer-whatsapp"
                  aria-label="WhatsApp"
                >
                  <MessageCircle className="h-4 w-4" />
                </a>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-20 pt-8 border-t border-white/5 flex flex-col sm:flex-row justify-between gap-4">
          <p className="text-xs font-mono-tech text-zinc-600">
            © {new Date().getFullYear()} OSNEAKERS // PREMIUM DROPSHIP
          </p>
          <p className="text-xs font-mono-tech text-zinc-600">
            ONTARIO · CANADA — SHIPPING WORLDWIDE
          </p>
        </div>
      </div>
    </footer>
  );
};
