import React, { useState, useRef, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { ProductCategory, Product } from '../types';
import { 
  Gamepad2, 
  Search, 
  Heart, 
  ShieldCheck, 
  X,
  Sparkles
} from 'lucide-react';
import { getLowestPrice, formatCurrency } from '../utils/affiliate';

interface NavbarProps {
  onOpenWishlist: () => void;
  onSelectProduct: (product: Product) => void;
}

const CATEGORIES: { id: ProductCategory | 'all'; label: string }[] = [
  { id: 'all', label: 'All Gear' },
  { id: 'keyboards', label: 'Keyboards' },
  { id: 'mice', label: 'Mice' },
  { id: 'headsets', label: 'Headsets' },
  { id: 'monitors', label: 'Monitors' },
  { id: 'controllers', label: 'Controllers' },
  { id: 'accessories', label: 'Accessories' },
];

export const Navbar: React.FC<NavbarProps> = ({ 
  onOpenWishlist, 
  onSelectProduct 
}) => {
  const { 
    activeCategory, 
    setActiveCategory, 
    searchQuery, 
    setSearchQuery, 
    wishlist, 
    products 
  } = useApp();

  const [searchFocused, setSearchFocused] = useState(false);
  const searchContainerRef = useRef<HTMLDivElement>(null);

  // Close search dropdown on click outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchContainerRef.current && !searchContainerRef.current.contains(event.target as Node)) {
        setSearchFocused(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Filtered preview products for search dropdown
  const searchResults = searchQuery.trim()
    ? products.filter((p) => {
        const query = searchQuery.toLowerCase();
        return (
          p.title.toLowerCase().includes(query) ||
          p.brand.toLowerCase().includes(query) ||
          p.category.toLowerCase().includes(query) ||
          p.tags.some((t) => t.toLowerCase().includes(query))
        );
      }).slice(0, 5)
    : [];

  return (
    <header className="sticky top-0 z-40 w-full bg-zinc-950/95 backdrop-blur-xl border-b border-zinc-805/80 transition-all">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-20 gap-6">
          
          {/* Refined Brand Logo */}
          <button 
            onClick={() => { setActiveCategory('all'); setSearchQuery(''); }}
            className="flex items-center gap-3 group focus:outline-none shrink-0"
          >
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-400/20 via-zinc-900 to-zinc-900 border border-amber-500/30 flex items-center justify-center group-hover:border-amber-400/60 transition-colors shadow-sm">
              <Gamepad2 className="w-5 h-5 text-amber-400 group-hover:scale-105 transition-transform" />
            </div>
            <div className="text-left">
              <span className="font-bold text-lg tracking-wider text-white font-mono block leading-none">
                NEXUS<span className="text-amber-400 font-extrabold">GEAR</span>
              </span>
              <span className="text-[10px] text-zinc-400 tracking-widest uppercase font-mono mt-1 block">
                Gaming Hardware Hub
              </span>
            </div>
          </button>

          {/* Spacious, Premium Search Bar */}
          <div ref={searchContainerRef} className="relative flex-1 max-w-xl hidden md:block">
            <div className="relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400 pointer-events-none" />
              <input
                type="text"
                placeholder="Search keyboards, lightweight mice, headsets, switches..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onFocus={() => setSearchFocused(true)}
                className="w-full pl-11 pr-10 py-2.5 bg-zinc-900/60 text-sm text-zinc-100 placeholder-zinc-400 border border-zinc-800/90 rounded-xl focus:outline-none focus:border-amber-400/60 focus:bg-zinc-900/90 focus:ring-2 focus:ring-amber-500/10 transition-all"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-zinc-200 transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>

            {/* Instant Search Suggestions Dropdown */}
            {searchFocused && searchQuery.trim().length > 0 && (
              <div className="absolute left-0 right-0 top-full mt-2 bg-zinc-900/95 border border-zinc-800 rounded-xl shadow-2xl backdrop-blur-xl overflow-hidden z-50">
                <div className="px-4 py-2.5 border-b border-zinc-800/80 text-xs text-zinc-400 flex items-center justify-between">
                  <span>{searchResults.length} matching gear found</span>
                  <span className="text-[11px] text-zinc-400">Esc to close</span>
                </div>

                {searchResults.length === 0 ? (
                  <div className="p-6 text-center text-sm text-zinc-400">
                    No results for "{searchQuery}". Try searching by brand (Logitech, Razer) or category.
                  </div>
                ) : (
                  <div className="divide-y divide-zinc-800/50">
                    {searchResults.map((item) => {
                      const best = getLowestPrice(item);
                      return (
                        <div
                          key={item.id}
                          onClick={() => {
                            onSelectProduct(item);
                            setSearchFocused(false);
                          }}
                          className="flex items-center gap-3.5 p-3.5 hover:bg-zinc-800/60 cursor-pointer transition-colors group"
                        >
                          <img
                            src={item.imageUrl}
                            alt={item.title}
                            className="w-12 h-12 object-cover rounded-lg bg-zinc-950 shrink-0 border border-zinc-800"
                          />
                          <div className="flex-1 min-w-0">
                            <div className="text-[11px] text-zinc-400 font-mono flex items-center gap-1.5">
                              <span>{item.brand}</span>
                              <span>·</span>
                              <span className="capitalize">{item.category}</span>
                            </div>
                            <h4 className="text-sm font-medium text-zinc-200 truncate group-hover:text-amber-400 transition-colors mt-0.5">
                              {item.title}
                            </h4>
                          </div>
                          <div className="text-right shrink-0">
                            <div className="text-sm font-bold text-amber-400 font-mono">
                              {formatCurrency(best.price)}
                            </div>
                            <div className="text-[10px] text-zinc-400 capitalize">
                              at {best.store === 'equal' ? 'Amazon & Flipkart' : best.store}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Right Header Navigation & Actions */}
          <div className="flex items-center gap-3">
            {/* Wishlist / Saved Deals */}
            <button
              onClick={onOpenWishlist}
              className="relative flex items-center gap-2 px-3.5 py-2 text-zinc-300 hover:text-white hover:bg-zinc-900 border border-zinc-800/80 rounded-xl transition-all"
              title="Saved gaming gear"
            >
              <Heart className={`w-4 h-4 ${wishlist.length > 0 ? 'text-rose-400 fill-rose-400' : 'text-zinc-400'}`} />
              <span className="text-xs font-medium hidden sm:inline">Saved</span>
              {wishlist.length > 0 && (
                <span className="w-5 h-5 rounded-full bg-rose-500/20 text-rose-300 border border-rose-500/40 text-[10px] font-bold flex items-center justify-center font-mono">
                  {wishlist.length}
                </span>
              )}
            </button>
          </div>
        </div>

        {/* Mobile Search input */}
        <div className="pb-3 md:hidden">
          <div className="relative">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400 pointer-events-none" />
            <input
              type="text"
              placeholder="Search gaming gear..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-9 py-2 bg-zinc-900 text-xs text-zinc-100 placeholder-zinc-400 border border-zinc-800 rounded-lg focus:outline-none focus:border-amber-400"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>

        {/* Spacious, Clean Category Navigation Bar */}
        <nav className="flex items-center gap-1.5 py-3 overflow-x-auto no-scrollbar border-t border-zinc-850/60">
          {CATEGORIES.map((cat) => {
            const isActive = activeCategory === cat.id;
            return (
              <button
                key={cat.id}
                onClick={() => setActiveCategory(cat.id)}
                className={`px-4 py-1.5 text-xs font-medium rounded-lg whitespace-nowrap transition-all ${
                  isActive
                    ? 'bg-zinc-800 text-white font-semibold shadow-sm'
                    : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900/60'
                }`}
              >
                {cat.label}
              </button>
            );
          })}
        </nav>
      </div>
    </header>
  );
};
