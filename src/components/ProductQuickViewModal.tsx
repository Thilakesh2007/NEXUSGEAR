import React from 'react';
import { useApp } from '../context/AppContext';
import { Product } from '../types';
import { 
  X, 
  ExternalLink, 
  Heart, 
  Share2, 
  Star, 
  ShieldCheck, 
  CheckCircle2
} from 'lucide-react';
import { formatCurrency, getDiscountPercentage, getLowestPrice } from '../utils/affiliate';

interface ProductQuickViewModalProps {
  product: Product | null;
  onClose: () => void;
}

export const ProductQuickViewModal: React.FC<ProductQuickViewModalProps> = ({ 
  product, 
  onClose 
}) => {
  const { 
    toggleWishlist, 
    isWishlisted, 
    showToast 
  } = useApp();

  if (!product) return null;

  const lowest = getLowestPrice(product);
  const discount = getDiscountPercentage(product.originalPrice, lowest.price);
  const favorited = isWishlisted(product.id);

  const copyLink = () => {
    const url = product.amazonUrl || product.flipkartUrl || window.location.href;
    if (navigator.clipboard) {
      navigator.clipboard.writeText(url);
      showToast('Product link copied to clipboard', 'success');
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/85 backdrop-blur-md flex items-center justify-center p-4 sm:p-6 animate-in fade-in duration-200">
      <div 
        className="relative w-full max-w-4xl bg-zinc-900 border border-zinc-800 rounded-3xl shadow-2xl overflow-hidden my-8"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-5 right-5 z-10 p-2.5 text-zinc-400 hover:text-white bg-zinc-950/80 hover:bg-zinc-800 rounded-full border border-zinc-750 transition-colors"
          aria-label="Close dialog"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="grid grid-cols-1 md:grid-cols-2">
          
          {/* Left Column: Image & Badges */}
          <div className="relative bg-zinc-950 p-8 flex flex-col items-center justify-center border-b md:border-b-0 md:border-r border-zinc-800/80">
            <div className="relative w-full aspect-square max-w-sm overflow-hidden rounded-2xl border border-zinc-800 bg-zinc-900 shadow-xl">
              <img
                src={product.imageUrl}
                alt={product.title}
                className="w-full h-full object-cover"
              />
              {discount > 0 && (
                <div className="absolute top-3.5 left-3.5 bg-zinc-950/90 text-emerald-400 font-mono font-bold text-xs px-3 py-1 rounded-lg border border-emerald-500/30">
                  {discount}% OFF
                </div>
              )}
            </div>

            {/* Action buttons */}
            <div className="flex items-center gap-3 mt-6 w-full justify-center">
              <button
                onClick={() => toggleWishlist(product.id)}
                className={`flex items-center gap-2 px-4 py-2 text-xs font-medium rounded-xl border transition-colors ${
                  favorited
                    ? 'bg-rose-950/40 border-rose-500/40 text-rose-300'
                    : 'bg-zinc-900 border-zinc-800 text-zinc-300 hover:text-white'
                }`}
              >
                <Heart className={`w-4 h-4 ${favorited ? 'fill-rose-500 text-rose-500' : ''}`} />
                <span>{favorited ? 'Saved in Wishlist' : 'Add to Wishlist'}</span>
              </button>

              <button
                onClick={copyLink}
                className="flex items-center gap-2 px-4 py-2 text-xs font-medium rounded-xl bg-zinc-900 border border-zinc-800 text-zinc-300 hover:text-amber-400 transition-colors"
              >
                <Share2 className="w-4 h-4" />
                <span>Copy Link</span>
              </button>
            </div>

            {/* Tags */}
            <div className="flex flex-wrap gap-2 mt-5 justify-center">
              {product.tags.map((t) => (
                <span
                  key={t}
                  className="text-xs font-mono px-2.5 py-1 rounded-lg bg-zinc-900 text-zinc-400 border border-zinc-800/80"
                >
                  #{t}
                </span>
              ))}
            </div>
          </div>

          {/* Right Column: Information, Prices & Store Actions */}
          <div className="p-8 flex flex-col justify-between space-y-6 max-h-[85vh] overflow-y-auto">
            <div className="space-y-5">
              
              {/* Metadata */}
              <div className="flex items-center gap-2 text-xs font-mono text-zinc-400">
                <span className="text-zinc-300 uppercase tracking-widest">{product.brand}</span>
                <span>·</span>
                <span className="capitalize">{product.category}</span>
                {product.dealBadge && (
                  <>
                    <span>·</span>
                    <span className="text-amber-400 font-semibold">{product.dealBadge}</span>
                  </>
                )}
              </div>

              {/* Title */}
              <h2 className="text-2xl font-bold text-white leading-tight">
                {product.title}
              </h2>

              {/* Ratings */}
              <div className="flex items-center gap-3 text-xs">
                <div className="flex items-center gap-1.5 text-amber-400 font-bold">
                  <Star className="w-4 h-4 fill-amber-400" />
                  <span>{product.rating}</span>
                </div>
                <span className="text-zinc-600">|</span>
                <span className="text-zinc-400">{product.reviewCount.toLocaleString()} reviews</span>
                <span className="text-zinc-600">|</span>
                <span className={`font-mono ${product.inStock ? 'text-emerald-400' : 'text-rose-400'}`}>
                  {product.inStock ? 'In Stock' : 'Out of Stock'}
                </span>
              </div>

              {/* Pricing Breakdown Box */}
              <div className="p-5 rounded-2xl bg-zinc-950 border border-zinc-800 space-y-4">
                <div className="flex items-baseline justify-between">
                  <div>
                    <span className="text-[11px] font-mono text-zinc-400 uppercase tracking-wider block">Best Deal Price</span>
                    <div className="flex items-baseline gap-2.5 mt-0.5">
                      <span className="text-3xl font-extrabold text-white font-mono">
                        {formatCurrency(lowest.price)}
                      </span>
                      {product.originalPrice > lowest.price && (
                        <span className="text-sm text-zinc-400 line-through font-mono">
                          {formatCurrency(product.originalPrice)}
                        </span>
                      )}
                    </div>
                  </div>
                  {discount > 0 && (
                    <span className="text-xs font-bold text-emerald-400 font-mono bg-emerald-500/10 px-3 py-1 rounded-full border border-emerald-500/20">
                      Save {discount}%
                    </span>
                  )}
                </div>

                {/* Side-by-side Amazon vs Flipkart Comparison */}
                <div className="grid grid-cols-2 gap-3 pt-3 border-t border-zinc-850 text-xs">
                  {/* Amazon Option */}
                  <div className="p-3.5 rounded-xl bg-zinc-900 border border-zinc-800 flex flex-col justify-between space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="font-mono font-bold text-amber-400 text-xs">AMAZON</span>
                      {lowest.store === 'amazon' && (
                        <span className="text-[10px] bg-amber-500/15 text-amber-300 px-2 py-0.5 rounded-full font-mono font-medium">
                          Best Offer
                        </span>
                      )}
                    </div>
                    <div>
                      <span className="text-base font-extrabold font-mono text-white">
                        {product.amazonPrice ? formatCurrency(product.amazonPrice) : 'Unavailable'}
                      </span>
                    </div>
                    {product.amazonUrl ? (
                      <a
                        href={product.amazonUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center justify-center gap-1.5 py-2 px-3 bg-amber-500 hover:bg-amber-400 text-zinc-950 font-bold rounded-lg text-xs transition-colors"
                      >
                        <span>Buy on Amazon</span>
                        <ExternalLink className="w-3 h-3" />
                      </a>
                    ) : (
                      <span className="text-xs text-zinc-500 text-center block py-1.5">Out of stock</span>
                    )}
                  </div>

                  {/* Flipkart Option */}
                  <div className="p-3.5 rounded-xl bg-zinc-900 border border-zinc-800 flex flex-col justify-between space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="font-mono font-bold text-cyan-400 text-xs">FLIPKART</span>
                      {lowest.store === 'flipkart' && (
                        <span className="text-[10px] bg-cyan-500/15 text-cyan-300 px-2 py-0.5 rounded-full font-mono font-medium">
                          Best Offer
                        </span>
                      )}
                    </div>
                    <div>
                      <span className="text-base font-extrabold font-mono text-white">
                        {product.flipkartPrice ? formatCurrency(product.flipkartPrice) : 'Unavailable'}
                      </span>
                    </div>
                    {product.flipkartUrl ? (
                      <a
                        href={product.flipkartUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center justify-center gap-1.5 py-2 px-3 bg-cyan-500 hover:bg-cyan-400 text-zinc-950 font-bold rounded-lg text-xs transition-colors"
                      >
                        <span>Buy on Flipkart</span>
                        <ExternalLink className="w-3 h-3" />
                      </a>
                    ) : (
                      <span className="text-xs text-zinc-500 text-center block py-1.5">Out of stock</span>
                    )}
                  </div>
                </div>
              </div>

              {/* Description */}
              <div className="space-y-2">
                <h4 className="text-xs uppercase font-mono text-zinc-400 font-bold">Gear Overview</h4>
                <p className="text-sm text-zinc-300 leading-relaxed">
                  {product.fullDescription}
                </p>
              </div>

              {/* Hardware Specifications */}
              {Object.keys(product.specs).length > 0 && (
                <div className="space-y-2">
                  <h4 className="text-xs uppercase font-mono text-zinc-400 font-bold">Specifications</h4>
                  <div className="rounded-xl border border-zinc-800 overflow-hidden divide-y divide-zinc-800/80 text-xs">
                    {Object.entries(product.specs).map(([specKey, specVal]) => (
                      <div key={specKey} className="grid grid-cols-3 p-2.5 bg-zinc-950/60">
                        <span className="text-zinc-400 font-mono">{specKey}</span>
                        <span className="col-span-2 text-zinc-200 font-medium">{specVal}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Highlights */}
              <div className="space-y-2">
                <h4 className="text-xs uppercase font-mono text-zinc-400 font-bold">Key Highlights</h4>
                <ul className="space-y-1.5 text-xs text-zinc-300">
                  {product.features.map((feat, i) => (
                    <li key={i} className="flex items-start gap-2">
                      <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                      <span>{feat}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            {/* Transparency Note */}
            <div className="pt-4 border-t border-zinc-800 text-[11px] text-zinc-400 space-y-1 leading-normal">
              <div className="flex items-center gap-1.5 text-zinc-300 font-medium">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                <span>Verified Retail Information</span>
              </div>
              <p>
                Product prices and availability are verified periodically from official Amazon and Flipkart store listings.
              </p>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
};
