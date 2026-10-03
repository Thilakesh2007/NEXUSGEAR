import React from 'react';
import { useApp } from '../context/AppContext';
import { Gamepad2, ShieldCheck, Lock } from 'lucide-react';

interface FooterProps {
  onOpenAdmin: () => void;
}

export const Footer: React.FC<FooterProps> = ({ onOpenAdmin }) => {
  const { setActiveCategory } = useApp();

  return (
    <footer className="border-t border-zinc-800 bg-zinc-950 text-zinc-400 text-xs mt-20">
      
      {/* Transparency Note */}
      <div className="border-b border-zinc-850/80 bg-zinc-900/30 py-6 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto flex items-start gap-3">
          <ShieldCheck className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
          <div className="space-y-1">
            <h4 className="font-semibold text-zinc-300 text-xs uppercase font-mono tracking-wider">
              Product &amp; Pricing Transparency
            </h4>
            <p className="text-zinc-400 text-xs max-w-4xl leading-relaxed">
              NexusGear curates the best gaming gear deals across Amazon and Flipkart. Product prices, availability, and images are retrieved directly from official retail listings. Amazon and Flipkart trademarks belong to their respective owners.
            </p>
          </div>
        </div>
      </div>

      {/* Main Footer Links */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-10">
          
          {/* Brand info */}
          <div className="space-y-3">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-amber-500/10 text-amber-400 flex items-center justify-center border border-amber-500/20">
                <Gamepad2 className="w-4 h-4" />
              </div>
              <span className="font-bold text-white font-mono text-base tracking-wider">
                NEXUS<span className="text-amber-400 font-extrabold">GEAR</span>
              </span>
            </div>
            <p className="text-xs text-zinc-400 leading-relaxed">
              Curated gaming gear deals and live price comparisons across Amazon and Flipkart for competitive esports gamers and hardware enthusiasts.
            </p>
          </div>

          {/* Gaming Gear Categories */}
          <div>
            <h5 className="font-mono text-xs uppercase text-zinc-200 font-bold tracking-wider mb-3.5">
              Categories
            </h5>
            <ul className="space-y-2.5 text-xs">
              <li>
                <button
                  onClick={() => setActiveCategory('keyboards')}
                  className="hover:text-amber-400 transition-colors"
                >
                  Mechanical &amp; Analog Keyboards
                </button>
              </li>
              <li>
                <button
                  onClick={() => setActiveCategory('mice')}
                  className="hover:text-amber-400 transition-colors"
                >
                  Lightweight Gaming Mice
                </button>
              </li>
              <li>
                <button
                  onClick={() => setActiveCategory('headsets')}
                  className="hover:text-amber-400 transition-colors"
                >
                  Esports Audio &amp; Headsets
                </button>
              </li>
              <li>
                <button
                  onClick={() => setActiveCategory('monitors')}
                  className="hover:text-amber-400 transition-colors"
                >
                  High Refresh Gaming Monitors
                </button>
              </li>
              <li>
                <button
                  onClick={() => setActiveCategory('controllers')}
                  className="hover:text-amber-400 transition-colors"
                >
                  Hall Effect Controllers
                </button>
              </li>
            </ul>
          </div>

          {/* Quick Features */}
          <div>
            <h5 className="font-mono text-xs uppercase text-zinc-200 font-bold tracking-wider mb-3.5">
              Platform Features
            </h5>
            <ul className="space-y-2.5 text-xs text-zinc-400">
              <li className="flex items-center gap-2">
                <span className="text-emerald-400">✓</span> Official Amazon &amp; Flipkart product links
              </li>
              <li className="flex items-center gap-2">
                <span className="text-emerald-400">✓</span> Instant official image and price fetching
              </li>
              <li className="flex items-center gap-2">
                <span className="text-emerald-400">✓</span> Indian Rupee (₹ INR) live pricing
              </li>
              <li className="flex items-center gap-2">
                <span className="text-emerald-400">✓</span> Pro-level hardware specifications
              </li>
            </ul>
          </div>

          {/* Platform Trust & Quality */}
          <div>
            <h5 className="font-mono text-xs uppercase text-zinc-200 font-bold tracking-wider mb-3.5">
              Live Updates
            </h5>
            <p className="text-xs text-zinc-400 mb-3 leading-relaxed">
              Hardware deals and verified store prices are updated periodically from official Amazon and Flipkart partner stores.
            </p>
            <div className="flex items-center gap-2 text-xs font-mono text-emerald-400">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span>Catalog Sync Active</span>
            </div>
          </div>

        </div>

        {/* Bottom bar with small discreet admin link */}
        <div className="mt-12 pt-6 border-t border-zinc-850 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-zinc-400 font-mono">
          <div>
            © 2026 NexusGear · Esports &amp; Gaming Deals Hub
          </div>
          <div className="flex items-center gap-3">
            <span>Verified Store Listings</span>
            <span>·</span>
            <button
              onClick={onOpenAdmin}
              className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-zinc-500 hover:text-zinc-300 hover:bg-zinc-900 transition-colors text-[11px] cursor-pointer"
              title="Admin Portal"
            >
              <Lock className="w-2.5 h-2.5" />
              <span>Admin</span>
            </button>
          </div>
        </div>
      </div>
    </footer>
  );
};
