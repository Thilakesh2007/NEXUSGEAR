import React from 'react';
import { useApp } from '../context/AppContext';
import { Product } from '../types';
import { 
  Heart, 
  ExternalLink, 
  Share2, 
  Star,
  ChevronRight
} from 'lucide-react';
import { formatCurrency, getDiscountPercentage, getLowestPrice } from '../utils/affiliate';

interface ProductCardProps {
  product: Product;
  onSelect: (product: Product) => void;
}

export const ProductCard: React.FC<ProductCardProps> = ({ product, onSelect }) => {
  const { 
    toggleWishlist, 
    isWishlisted, 
    showToast 
  } = useApp();

  const lowest = getLowestPrice(product);
  const discount = getDiscountPercentage(product.originalPrice, lowest.price);
  const favorited = isWishlisted(product.id);

  const hasBothPrices = 
    product.amazonPrice && 
    product.amazonPrice > 0 && 
    product.flipkartPrice && 
    product.flipkartPrice > 0;

  const priceDiff = hasBothPrices 
    ? Math.abs(product.amazonPrice! - product.flipkartPrice!)
    : 0;

  const copyProductLink = (e: React.MouseEvent) => {
    e.stopPropagation();
    const primaryUrl = product.amazonUrl || product.flipkartUrl || window.location.href;
    if (navigator.clipboard) {
      navigator.clipboard.writeText(primaryUrl);
      showToast('Link copied to clipboard', 'success');
    }
  };

  return (
    <div className="group relative flex flex-col rounded-2xl bg-zinc-900/60 border border-zinc-800/80 hover:border-zinc-700/90 transition-all duration-300 overflow-hidden shadow-sm hover:shadow-xl hover:shadow-black/40">
      
      {/* Top Image Section */}
      <div 
        onClick={() => onSelect(product)}
        className="relative w-full aspect-4/3 bg-zinc-950 overflow-hidden cursor-pointer"
      >
        <img
          src={product.imageUrl}
          alt={product.title}
          loading="lazy"
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 ease-out"
        />

        {/* Discount Flag */}
        {discount > 0 && (
          <div className="absolute top-3 left-3 bg-zinc-950/90 backdrop-blur-md text-emerald-400 font-mono font-bold text-xs px-2.5 py-1 rounded-lg border border-emerald-500/30">
            {discount}% OFF
          </div>
        )}

        {/* Action icons on image */}
        <div className="absolute top-3 right-3 flex items-center gap-1.5 opacity-90 group-hover:opacity-100 transition-opacity">
          <button
            onClick={(e) => {
              e.stopPropagation();
              toggleWishlist(product.id);
            }}
            className="p-2 rounded-xl bg-zinc-950/80 hover:bg-zinc-900 text-zinc-300 hover:text-rose-400 border border-zinc-800/80 backdrop-blur-md transition-colors"
            title={favorited ? 'Remove from saved' : 'Save deal'}
            aria-label="Wishlist toggle"
          >
            <Heart className={`w-3.5 h-3.5 ${favorited ? 'fill-rose-500 text-rose-500' : ''}`} />
          </button>

          <button
            onClick={copyProductLink}
            className="p-2 rounded-xl bg-zinc-950/80 hover:bg-zinc-900 text-zinc-300 hover:text-amber-400 border border-zinc-800/80 backdrop-blur-md transition-colors"
            title="Copy product link"
            aria-label="Copy link"
          >
            <Share2 className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Out of stock overlay */}
        {!product.inStock && (
          <div className="absolute inset-0 bg-zinc-950/80 backdrop-blur-xs flex items-center justify-center">
            <span className="text-rose-400 font-mono text-xs uppercase tracking-wider font-semibold px-3 py-1 bg-rose-950/40 border border-rose-800/50 rounded-lg">
              Out of Stock
            </span>
          </div>
        )}
      </div>

      {/* Card Content */}
      <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
        
        {/* Unboxed Metadata & Category */}
        <div>
          <div className="flex items-center gap-1.5 text-xs text-zinc-400 font-mono mb-1.5">
            <span className="text-zinc-300 font-medium">{product.brand}</span>
            <span aria-hidden="true" className="text-zinc-600">·</span>
            <span className="capitalize">{product.category}</span>
            {product.rating > 0 && (
              <>
                <span aria-hidden="true" className="text-zinc-600">·</span>
                <span className="flex items-center gap-1 text-amber-400">
                  <Star className="w-3 h-3 fill-amber-400" />
                  <span>{product.rating}</span>
                </span>
              </>
            )}
          </div>

          {/* Product Title */}
          <h3 
            onClick={() => onSelect(product)}
            className="text-sm font-semibold text-zinc-100 hover:text-amber-400 line-clamp-2 cursor-pointer transition-colors leading-snug"
          >
            {product.title}
          </h3>

          {/* Specs Snippet */}
          <ul className="mt-2.5 space-y-1 text-xs text-zinc-400 font-sans">
            {product.features.slice(0, 2).map((feat, i) => (
              <li key={i} className="flex items-center gap-2 line-clamp-1">
                <span className="w-1 h-1 rounded-full bg-amber-400/80 shrink-0" />
                <span className="truncate">{feat}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* Pricing Display */}
        <div className="pt-3 border-t border-zinc-800/60">
          <div className="flex items-baseline justify-between mb-3">
            <div>
              <span className="text-[10px] text-zinc-400 uppercase font-mono tracking-wider block">Best Price</span>
              <div className="flex items-baseline gap-2 mt-0.5">
                <span className="text-xl font-extrabold text-white font-mono">
                  {formatCurrency(lowest.price)}
                </span>
                {product.originalPrice > lowest.price && (
                  <span className="text-xs text-zinc-400 line-through font-mono">
                    {formatCurrency(product.originalPrice)}
                  </span>
                )}
              </div>
            </div>

            {hasBothPrices && priceDiff > 0 && (
              <div className="text-right">
                <span className="text-[11px] text-emerald-400 font-mono font-medium block">
                  Save {formatCurrency(priceDiff)} on {lowest.store}!
                </span>
              </div>
            )}
          </div>

          {/* Direct Store Buy Buttons */}
          <div className="grid grid-cols-2 gap-2">
            {/* Amazon Affiliate Buy Button */}
            {product.amazonUrl ? (
              <a
                href={product.amazonUrl}
                target="_blank"
                rel="noopener noreferrer"
                className={`flex items-center justify-between px-3 py-2 rounded-xl text-xs transition-all ${
                  lowest.store === 'amazon'
                    ? 'bg-amber-500 hover:bg-amber-400 text-zinc-950 font-bold shadow-sm'
                    : 'bg-zinc-850 hover:bg-zinc-800 text-zinc-200 border border-zinc-750 font-medium'
                }`}
              >
                <div className="flex flex-col text-left">
                  <span className="text-[9px] uppercase font-mono opacity-80 leading-3">Amazon</span>
                  <span className="font-mono text-xs font-semibold">
                    {product.amazonPrice ? formatCurrency(product.amazonPrice) : 'View'}
                  </span>
                </div>
                <ExternalLink className="w-3.5 h-3.5 shrink-0 opacity-80" />
              </a>
            ) : (
              <div className="px-3 py-2 rounded-xl bg-zinc-950 text-zinc-600 text-[11px] text-center font-mono border border-zinc-850">
                Unavailable
              </div>
            )}

            {/* Flipkart Affiliate Buy Button */}
            {product.flipkartUrl ? (
              <a
                href={product.flipkartUrl}
                target="_blank"
                rel="noopener noreferrer"
                className={`flex items-center justify-between px-3 py-2 rounded-xl text-xs transition-all ${
                  lowest.store === 'flipkart'
                    ? 'bg-cyan-500 hover:bg-cyan-400 text-zinc-950 font-bold shadow-sm'
                    : 'bg-zinc-850 hover:bg-zinc-800 text-zinc-200 border border-zinc-750 font-medium'
                }`}
              >
                <div className="flex flex-col text-left">
                  <span className="text-[9px] uppercase font-mono opacity-80 leading-3">Flipkart</span>
                  <span className="font-mono text-xs font-semibold">
                    {product.flipkartPrice ? formatCurrency(product.flipkartPrice) : 'View'}
                  </span>
                </div>
                <ExternalLink className="w-3.5 h-3.5 shrink-0 opacity-80" />
              </a>
            ) : (
              <div className="px-3 py-2 rounded-xl bg-zinc-950 text-zinc-600 text-[11px] text-center font-mono border border-zinc-850">
                Unavailable
              </div>
            )}
          </div>
        </div>

      </div>
    </div>
  );
};
