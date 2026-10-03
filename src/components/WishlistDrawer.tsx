import React from 'react';
import { useApp } from '../context/AppContext';
import { Product } from '../types';
import { 
  X, 
  Trash2, 
  ExternalLink, 
  Heart
} from 'lucide-react';
import { formatCurrency, getLowestPrice } from '../utils/affiliate';

interface WishlistDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectProduct: (product: Product) => void;
}

export const WishlistDrawer: React.FC<WishlistDrawerProps> = ({ 
  isOpen, 
  onClose,
  onSelectProduct
}) => {
  const { 
    products, 
    wishlist, 
    toggleWishlist 
  } = useApp();

  if (!isOpen) return null;

  const wishlistedItems = products.filter((p) => wishlist.includes(p.id));

  const totalRetail = wishlistedItems.reduce((acc, item) => acc + item.originalPrice, 0);
  const totalDealPrice = wishlistedItems.reduce((acc, item) => {
    const lowest = getLowestPrice(item);
    return acc + lowest.price;
  }, 0);
  const totalSavings = totalRetail - totalDealPrice;

  return (
    <div className="fixed inset-0 z-50 overflow-hidden bg-black/80 backdrop-blur-sm flex justify-end">
      <div 
        className="w-full max-w-md bg-zinc-950 border-l border-zinc-800 h-full flex flex-col shadow-2xl animate-in slide-in-from-right duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-6 border-b border-zinc-800/80 flex items-center justify-between bg-zinc-900/60">
          <div className="flex items-center gap-2.5">
            <Heart className="w-5 h-5 text-rose-500 fill-rose-500" />
            <div>
              <h3 className="font-bold text-white text-base font-mono">
                Saved Deals ({wishlistedItems.length})
              </h3>
              <p className="text-xs text-zinc-400">
                Tracked price drops across stores
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-zinc-400 hover:text-white bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Savings banner */}
        {wishlistedItems.length > 0 && totalSavings > 0 && (
          <div className="bg-emerald-950/30 border-b border-emerald-800/30 px-6 py-2.5 text-xs text-emerald-300 flex items-center justify-between font-mono">
            <span>Potential Savings:</span>
            <span className="font-bold text-emerald-400">
              {formatCurrency(totalSavings)} OFF
            </span>
          </div>
        )}

        {/* Items List */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {wishlistedItems.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center p-6 space-y-3">
              <div className="w-14 h-14 rounded-2xl bg-zinc-900 flex items-center justify-center text-zinc-600 border border-zinc-800">
                <Heart className="w-6 h-6" />
              </div>
              <p className="text-sm font-medium text-zinc-200">No saved deals yet</p>
              <p className="text-xs text-zinc-400 max-w-xs leading-relaxed">
                Click the heart icon on any gear card to save it here and keep track of live deals.
              </p>
            </div>
          ) : (
            wishlistedItems.map((item) => {
              const lowest = getLowestPrice(item);
              return (
                <div 
                  key={item.id}
                  className="p-4 bg-zinc-900/60 border border-zinc-800/80 rounded-2xl space-y-3 hover:border-zinc-700 transition-colors"
                >
                  <div className="flex gap-3.5">
                    <img
                      src={item.imageUrl}
                      alt={item.title}
                      onClick={() => {
                        onSelectProduct(item);
                        onClose();
                      }}
                      className="w-16 h-16 object-cover rounded-xl bg-zinc-950 border border-zinc-800 shrink-0 cursor-pointer"
                    />

                    <div className="flex-1 min-w-0">
                      <div className="text-[11px] text-zinc-400 font-mono flex items-center justify-between">
                        <span className="capitalize">{item.brand} · {item.category}</span>
                        <button
                          onClick={() => toggleWishlist(item.id)}
                          className="text-zinc-500 hover:text-rose-400 p-1"
                          title="Remove from wishlist"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>

                      <h4 
                        onClick={() => {
                          onSelectProduct(item);
                          onClose();
                        }}
                        className="text-xs font-semibold text-zinc-200 hover:text-amber-400 truncate cursor-pointer mt-0.5"
                      >
                        {item.title}
                      </h4>

                      <div className="flex items-baseline gap-2 mt-1.5">
                        <span className="text-sm font-bold text-white font-mono">
                          {formatCurrency(lowest.price)}
                        </span>
                        <span className="text-xs text-zinc-400 line-through font-mono">
                          {formatCurrency(item.originalPrice)}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Direct Buy Buttons */}
                  <div className="grid grid-cols-2 gap-2 pt-1 border-t border-zinc-850/80 text-xs">
                    {item.amazonUrl ? (
                      <a
                        href={item.amazonUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="py-1.5 px-3 bg-amber-500 hover:bg-amber-400 text-zinc-950 text-xs font-bold rounded-lg flex items-center justify-center gap-1.5 transition-colors"
                      >
                        <span>Amazon</span>
                        <ExternalLink className="w-3 h-3" />
                      </a>
                    ) : (
                      <span className="text-xs text-zinc-600 text-center py-1.5">Amazon N/A</span>
                    )}

                    {item.flipkartUrl ? (
                      <a
                        href={item.flipkartUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="py-1.5 px-3 bg-cyan-500 hover:bg-cyan-400 text-zinc-950 text-xs font-bold rounded-lg flex items-center justify-center gap-1.5 transition-colors"
                      >
                        <span>Flipkart</span>
                        <ExternalLink className="w-3 h-3" />
                      </a>
                    ) : (
                      <span className="text-xs text-zinc-600 text-center py-1.5">Flipkart N/A</span>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Footer */}
        {wishlistedItems.length > 0 && (
          <div className="p-6 border-t border-zinc-800/80 bg-zinc-900/60 space-y-2">
            <div className="flex items-center justify-between text-xs text-zinc-300">
              <span>Total Watchlist Price:</span>
              <span className="text-lg font-extrabold text-white font-mono">
                {formatCurrency(totalDealPrice)}
              </span>
            </div>
            <p className="text-[11px] text-zinc-400 text-center">
              Direct affiliate links with verified deals.
            </p>
          </div>
        )}

      </div>
    </div>
  );
};
