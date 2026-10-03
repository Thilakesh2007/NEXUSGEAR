import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { 
  SlidersHorizontal, 
  RotateCcw, 
  Check, 
  X
} from 'lucide-react';
import { formatCurrency } from '../utils/affiliate';

interface FilterBarProps {
  totalResults: number;
}

const ALL_POPULAR_TAGS = [
  'Hall Effect',
  'Rapid Trigger',
  'Wireless',
  'Ultra-light',
  '60g',
  'TKL',
  'OLED',
  '240Hz',
  'ANC',
  '300h Battery',
  'Hot-swap',
  'Esports'
];

export const FilterBar: React.FC<FilterBarProps> = ({ totalResults }) => {
  const {
    activeCategory,
    setActiveCategory,
    storeFilter,
    setStoreFilter,
    sortBy,
    setSortBy,
    minDiscount,
    setMinDiscount,
    maxPrice,
    setMaxPrice,
    onlyInStock,
    setOnlyInStock,
    selectedTag,
    setSelectedTag,
  } = useApp();

  const [expanded, setExpanded] = useState(false);

  const resetAllFilters = () => {
    setActiveCategory('all');
    setStoreFilter('all');
    setSortBy('discount');
    setMinDiscount(0);
    setMaxPrice(100000);
    setOnlyInStock(false);
    setSelectedTag(null);
  };

  const isFiltered =
    activeCategory !== 'all' ||
    storeFilter !== 'all' ||
    sortBy !== 'discount' ||
    minDiscount > 0 ||
    maxPrice < 100000 ||
    onlyInStock ||
    selectedTag !== null;

  return (
    <div className="bg-zinc-900/40 border border-zinc-800/80 rounded-2xl p-5 my-8 space-y-4">
      
      {/* Top Level Bar */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        
        {/* Results Count & Active Filter indicator */}
        <div className="flex items-center gap-3">
          <span className="text-sm font-semibold text-white font-mono">
            {totalResults} {totalResults === 1 ? 'Product Deal' : 'Product Deals'}
          </span>
          {activeCategory !== 'all' && (
            <span className="text-xs text-zinc-400 capitalize">
              in <span className="text-amber-400 font-medium">{activeCategory}</span>
            </span>
          )}
          {selectedTag && (
            <span className="text-xs bg-amber-500/10 text-amber-400 px-2.5 py-0.5 rounded-full border border-amber-500/20 flex items-center gap-1.5 font-mono">
              #{selectedTag}
              <button onClick={() => setSelectedTag(null)} className="hover:text-white font-bold">×</button>
            </span>
          )}
        </div>

        {/* Filter Controls Row */}
        <div className="flex items-center gap-3">
          
          {/* Store Segmented Control */}
          <div className="flex items-center p-1 bg-zinc-950/80 border border-zinc-800/80 rounded-xl text-xs font-mono">
            <button
              onClick={() => setStoreFilter('all')}
              className={`px-3 py-1.5 rounded-lg transition-colors ${
                storeFilter === 'all'
                  ? 'bg-zinc-800 text-white font-semibold shadow-sm'
                  : 'text-zinc-400 hover:text-white'
              }`}
            >
              All Stores
            </button>
            <button
              onClick={() => setStoreFilter('amazon')}
              className={`px-3 py-1.5 rounded-lg transition-colors ${
                storeFilter === 'amazon'
                  ? 'bg-amber-400/15 text-amber-400 font-semibold'
                  : 'text-zinc-400 hover:text-white'
              }`}
            >
              Amazon
            </button>
            <button
              onClick={() => setStoreFilter('flipkart')}
              className={`px-3 py-1.5 rounded-lg transition-colors ${
                storeFilter === 'flipkart'
                  ? 'bg-cyan-400/15 text-cyan-400 font-semibold'
                  : 'text-zinc-400 hover:text-white'
              }`}
            >
              Flipkart
            </button>
            <button
              onClick={() => setStoreFilter('both')}
              className={`px-3 py-1.5 rounded-lg transition-colors ${
                storeFilter === 'both'
                  ? 'bg-emerald-400/15 text-emerald-400 font-semibold'
                  : 'text-zinc-400 hover:text-white'
              }`}
            >
              Both
            </button>
          </div>

          {/* Sort By Dropdown */}
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as any)}
            className="bg-zinc-950/80 text-xs text-zinc-200 border border-zinc-800/80 rounded-xl px-3.5 py-2 focus:outline-none focus:border-amber-400/60 font-mono cursor-pointer"
          >
            <option value="discount">🔥 Top Discount %</option>
            <option value="price-asc">Price: Low to High</option>
            <option value="price-desc">Price: High to Low</option>
            <option value="rating">★ Top Rated</option>
            <option value="newest">Latest Deals</option>
          </select>

          {/* Toggle More Filters */}
          <button
            onClick={() => setExpanded(!expanded)}
            className={`p-2 rounded-xl border text-xs flex items-center gap-1.5 transition-all ${
              expanded || isFiltered
                ? 'bg-zinc-800 text-amber-400 border-amber-400/30'
                : 'bg-zinc-950/80 text-zinc-400 border-zinc-800/80 hover:text-white'
            }`}
            title="Toggle price & tags filter"
          >
            <SlidersHorizontal className="w-3.5 h-3.5" />
            <span className="hidden sm:inline font-medium">Filter</span>
          </button>

          {isFiltered && (
            <button
              onClick={resetAllFilters}
              className="p-2 text-zinc-400 hover:text-rose-400 text-xs transition-colors flex items-center gap-1"
              title="Reset all filters"
            >
              <RotateCcw className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* Advanced Filters Section */}
      {expanded && (
        <div className="pt-5 border-t border-zinc-800/60 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            
            {/* Price Slider */}
            <div className="space-y-2.5">
              <div className="flex items-center justify-between text-xs">
                <span className="text-zinc-400 font-medium">Maximum Price</span>
                <span className="text-white font-mono font-bold">
                  {maxPrice >= 100000 ? 'No Limit' : formatCurrency(maxPrice)}
                </span>
              </div>
              <input
                type="range"
                min="3000"
                max="100000"
                step="2000"
                value={maxPrice}
                onChange={(e) => setMaxPrice(Number(e.target.value))}
                className="w-full accent-amber-500 h-1.5 bg-zinc-800 rounded-lg cursor-pointer"
              />
              <div className="flex items-center gap-2 pt-1 text-[11px] font-mono">
                <button
                  onClick={() => setMaxPrice(5000)}
                  className="px-2.5 py-1 rounded-lg bg-zinc-950 hover:bg-zinc-800 text-zinc-400 hover:text-white border border-zinc-800 transition-colors"
                >
                  &lt; ₹5,000
                </button>
                <button
                  onClick={() => setMaxPrice(15000)}
                  className="px-2.5 py-1 rounded-lg bg-zinc-950 hover:bg-zinc-800 text-zinc-400 hover:text-white border border-zinc-800 transition-colors"
                >
                  &lt; ₹15,000
                </button>
                <button
                  onClick={() => setMaxPrice(30000)}
                  className="px-2.5 py-1 rounded-lg bg-zinc-950 hover:bg-zinc-800 text-zinc-400 hover:text-white border border-zinc-800 transition-colors"
                >
                  &lt; ₹30,000
                </button>
                <button
                  onClick={() => setMaxPrice(100000)}
                  className="px-2.5 py-1 rounded-lg bg-zinc-950 hover:bg-zinc-800 text-zinc-400 hover:text-white border border-zinc-800 transition-colors"
                >
                  All
                </button>
              </div>
            </div>

            {/* Minimum Discount */}
            <div className="space-y-2.5">
              <span className="text-zinc-400 text-xs font-medium block">Minimum Discount</span>
              <div className="flex items-center gap-2 text-xs font-mono">
                {[0, 15, 25, 40].map((disc) => (
                  <button
                    key={disc}
                    onClick={() => setMinDiscount(disc)}
                    className={`px-3.5 py-1.5 rounded-lg border transition-colors ${
                      minDiscount === disc
                        ? 'bg-amber-400 text-zinc-950 font-bold border-amber-400'
                        : 'bg-zinc-950 text-zinc-400 border-zinc-800 hover:text-white'
                    }`}
                  >
                    {disc === 0 ? 'All' : `${disc}%+`}
                  </button>
                ))}
              </div>
            </div>

            {/* Stock Availability */}
            <div className="space-y-2.5 flex flex-col justify-center">
              <span className="text-zinc-400 text-xs font-medium block">Stock Status</span>
              <label className="flex items-center gap-2.5 cursor-pointer select-none text-xs text-zinc-300">
                <input
                  type="checkbox"
                  checked={onlyInStock}
                  onChange={(e) => setOnlyInStock(e.target.checked)}
                  className="w-4 h-4 rounded bg-zinc-950 border-zinc-700 accent-amber-500 cursor-pointer"
                />
                <span>In Stock items only</span>
              </label>
            </div>
          </div>

          {/* Quick Spec Tags */}
          <div className="pt-2">
            <span className="text-xs text-zinc-400 font-mono block mb-2.5">TAGS &amp; HARDWARE FEATURES</span>
            <div className="flex flex-wrap gap-2">
              {ALL_POPULAR_TAGS.map((tag) => {
                const isSelected = selectedTag === tag;
                return (
                  <button
                    key={tag}
                    onClick={() => setSelectedTag(isSelected ? null : tag)}
                    className={`px-3 py-1 rounded-lg text-xs transition-all font-mono ${
                      isSelected
                        ? 'bg-amber-400 text-zinc-950 font-bold'
                        : 'bg-zinc-950 text-zinc-400 hover:text-zinc-200 hover:bg-zinc-850 border border-zinc-800/80'
                    }`}
                  >
                    {tag}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
