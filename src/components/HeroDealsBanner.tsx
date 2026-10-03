import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { Product } from '../types';
import { 
  Zap, 
  ExternalLink, 
  ChevronRight,
  Star,
  Check
} from 'lucide-react';
import { formatCurrency, getDiscountPercentage, getLowestPrice } from '../utils/affiliate';

interface HeroDealsBannerProps {
  onSelectProduct: (product: Product) => void;
}

export const HeroDealsBanner: React.FC<HeroDealsBannerProps> = ({ onSelectProduct }) => {
  const { products } = useApp();

  // Find top featured deals
  const featuredProducts = products.filter((p) => p.isFeaturedDeal);
  const [currentIndex, setCurrentIndex] = useState(0);

  const featured = featuredProducts[currentIndex] || products[0];
  if (!featured) return null;

  const lowest = getLowestPrice(featured);
  const discount = getDiscountPercentage(featured.originalPrice, lowest.price);

  return (
    <div className="relative overflow-hidden rounded-3xl bg-gradient-to-b from-zinc-900/90 to-zinc-950 border border-zinc-800/80 p-8 md:p-12 my-8 shadow-2xl">
      {/* Subtle ambient lighting */}
      <div className="absolute top-0 right-1/4 w-[450px] h-[450px] bg-amber-500/5 rounded-full blur-3xl pointer-events-none" />

      <div className="relative z-10 grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-14 items-center">
        
        {/* Left Column: Product Spotlight Info */}
        <div className="lg:col-span-7 space-y-6">
          
          {/* Spotlight Tag */}
          <div className="flex items-center gap-3">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-400/10 text-amber-400 font-mono font-medium text-xs border border-amber-400/20">
              <Zap className="w-3.5 h-3.5 fill-amber-400" />
              SPOTLIGHT DEAL
            </span>
            {featured.dealBadge && (
              <span className="text-xs text-zinc-400 font-mono">
                {featured.dealBadge}
              </span>
            )}
          </div>

          {/* Heading */}
          <div>
            <div className="text-xs text-zinc-400 font-mono uppercase tracking-widest mb-1.5">
              {featured.brand} · {featured.category}
            </div>
            <h1 
              onClick={() => onSelectProduct(featured)}
              className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-white tracking-tight cursor-pointer hover:text-amber-400 transition-colors leading-[1.15]"
            >
              {featured.title}
            </h1>
          </div>

          <p className="text-base text-zinc-300 leading-relaxed max-w-2xl font-normal">
            {featured.shortDescription}
          </p>

          {/* Specs Highlights - Clean, airy layout */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 pt-1">
            {Object.entries(featured.specs).slice(0, 3).map(([key, val]) => (
              <div key={key} className="bg-zinc-900/50 border border-zinc-800/80 rounded-xl p-3">
                <span className="text-zinc-400 block text-[11px] font-mono mb-0.5">{key}</span>
                <span className="text-zinc-200 font-semibold text-xs truncate block">{val}</span>
              </div>
            ))}
          </div>

          {/* Pricing & Direct Partner Buy Options */}
          <div className="pt-2 flex flex-col sm:flex-row sm:items-center justify-between gap-6 border-t border-zinc-850/80">
            <div>
              <span className="text-[11px] font-mono text-zinc-400 block tracking-wider uppercase">
                Best Offer
              </span>
              <div className="flex items-baseline gap-3 mt-0.5">
                <span className="text-3xl sm:text-4xl font-extrabold text-white font-mono tracking-tight">
                  {formatCurrency(lowest.price)}
                </span>
                {featured.originalPrice > lowest.price && (
                  <span className="text-sm text-zinc-400 line-through font-mono">
                    {formatCurrency(featured.originalPrice)}
                  </span>
                )}
                {discount > 0 && (
                  <span className="text-xs font-bold text-emerald-400 bg-emerald-500/10 px-2.5 py-0.5 rounded-full border border-emerald-500/20 font-mono">
                    {discount}% OFF
                  </span>
                )}
              </div>
            </div>

            {/* Premium Direct Store Actions */}
            <div className="flex items-center gap-3">
              {featured.amazonUrl && (
                <a
                  href={featured.amazonUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 px-5 py-3 bg-amber-500 hover:bg-amber-400 text-zinc-950 font-bold rounded-xl text-xs transition-all shadow-md group"
                >
                  <span>Amazon</span>
                  <span className="font-mono opacity-80 font-normal">
                    {featured.amazonPrice ? formatCurrency(featured.amazonPrice) : 'Deal'}
                  </span>
                  <ExternalLink className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
                </a>
              )}

              {featured.flipkartUrl && (
                <a
                  href={featured.flipkartUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 px-5 py-3 bg-zinc-800 hover:bg-zinc-700 text-white font-bold rounded-xl text-xs transition-all border border-zinc-700/80 group"
                >
                  <span className="text-cyan-400">Flipkart</span>
                  <span className="font-mono text-zinc-300 font-normal">
                    {featured.flipkartPrice ? formatCurrency(featured.flipkartPrice) : 'Deal'}
                  </span>
                  <ExternalLink className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
                </a>
              )}
            </div>
          </div>

          {/* Quick switcher dots/pills */}
          {featuredProducts.length > 1 && (
            <div className="flex items-center gap-2 pt-2">
              <span className="text-[11px] text-zinc-400 font-mono">More deals:</span>
              <div className="flex items-center gap-2">
                {featuredProducts.map((p, idx) => (
                  <button
                    key={p.id}
                    onClick={() => setCurrentIndex(idx)}
                    className={`h-2 rounded-full transition-all ${
                      idx === currentIndex
                        ? 'w-7 bg-amber-400'
                        : 'w-2 bg-zinc-700 hover:bg-zinc-500'
                    }`}
                    aria-label={`View deal ${p.title}`}
                  />
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Right Column: Hero Showcase Image */}
        <div className="lg:col-span-5 relative flex justify-center">
          <div 
            onClick={() => onSelectProduct(featured)}
            className="group relative cursor-pointer overflow-hidden rounded-2xl border border-zinc-800/90 bg-zinc-950 aspect-4/3 w-full shadow-2xl"
          >
            <img
              src={featured.imageUrl}
              alt={featured.title}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700 ease-out"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-zinc-950/80 via-transparent to-transparent opacity-80" />

            <div className="absolute bottom-4 left-4 right-4 flex items-center justify-between text-xs">
              <div className="flex items-center gap-1.5 text-zinc-200 font-medium">
                <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                <span>{featured.rating}</span>
                <span className="text-zinc-400 font-normal">({featured.reviewCount.toLocaleString()} reviews)</span>
              </div>
              <span className="flex items-center gap-1 text-zinc-300 group-hover:text-amber-400 transition-colors font-medium">
                Full Details <ChevronRight className="w-3.5 h-3.5" />
              </span>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};
