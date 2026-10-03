import React, { useState, useMemo } from 'react';
import { AppProvider, useApp } from './context/AppContext';
import { Product, ProductCategory } from './types';
import { Navbar } from './components/Navbar';
import { HeroDealsBanner } from './components/HeroDealsBanner';
import { FilterBar } from './components/FilterBar';
import { ProductCard } from './components/ProductCard';
import { ProductQuickViewModal } from './components/ProductQuickViewModal';
import { AdminPanelModal } from './components/AdminPanelModal';
import { AdminLoginModal } from './components/AdminLoginModal';
import { WishlistDrawer } from './components/WishlistDrawer';
import { Footer } from './components/Footer';
import { ToastContainer } from './components/ToastContainer';
import { getDiscountPercentage, getLowestPrice } from './utils/affiliate';
import { 
  Flame, 
  Gamepad2, 
  Keyboard, 
  Mouse, 
  Headphones, 
  Monitor, 
  Compass,
  RotateCcw
} from 'lucide-react';

const CATEGORY_ICONS: Record<string, React.ReactNode> = {
  all: <Flame className="w-4 h-4 text-amber-400" />,
  keyboards: <Keyboard className="w-4 h-4 text-emerald-400" />,
  mice: <Mouse className="w-4 h-4 text-cyan-400" />,
  headsets: <Headphones className="w-4 h-4 text-purple-400" />,
  monitors: <Monitor className="w-4 h-4 text-blue-400" />,
  controllers: <Gamepad2 className="w-4 h-4 text-orange-400" />,
  accessories: <Compass className="w-4 h-4 text-rose-400" />,
};

const MainContent: React.FC = () => {
  const {
    products,
    activeCategory,
    setActiveCategory,
    searchQuery,
    setSearchQuery,
    storeFilter,
    sortBy,
    minDiscount,
    maxPrice,
    onlyInStock,
    selectedTag,
    showToast,
  } = useApp();

  // Modals & Drawers state
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [isWishlistOpen, setIsWishlistOpen] = useState(false);
  
  // Admin Authentication & Panel State (Session-only, no persistent storage leak)
  const [isAdminAuthOpen, setIsAdminAuthOpen] = useState(false);
  const [isAdminPanelOpen, setIsAdminPanelOpen] = useState(false);
  const [authenticatedEmail, setAuthenticatedEmail] = useState<string | null>(() => {
    try {
      // Clear any legacy persistent localStorage session
      localStorage.removeItem('nexusgear_admin_session');
      return sessionStorage.getItem('nexusgear_admin_session');
    } catch {
      return null;
    }
  });

  const handleOpenAdmin = () => {
    if (authenticatedEmail) {
      setIsAdminPanelOpen(true);
    } else {
      setIsAdminAuthOpen(true);
    }
  };

  const handleLoginSuccess = (email: string) => {
    setAuthenticatedEmail(email);
    try {
      sessionStorage.setItem('nexusgear_admin_session', email);
    } catch {}
    setIsAdminAuthOpen(false);
    setIsAdminPanelOpen(true);
    showToast(`Authenticated as ${email}`, 'success');
  };

  const handleLogout = () => {
    setAuthenticatedEmail(null);
    try {
      sessionStorage.removeItem('nexusgear_admin_session');
      localStorage.removeItem('nexusgear_admin_session');
    } catch {}
    setIsAdminPanelOpen(false);
    showToast('Signed out of admin portal', 'info');
  };

  // Compute category counts
  const categoryCounts = useMemo(() => {
    const counts: Record<string, number> = {
      all: products.length,
      keyboards: 0,
      mice: 0,
      headsets: 0,
      monitors: 0,
      controllers: 0,
      accessories: 0,
    };
    products.forEach((p) => {
      if (counts[p.category] !== undefined) {
        counts[p.category]++;
      }
    });
    return counts;
  }, [products]);

  // Filtering & Sorting
  const filteredProducts = useMemo(() => {
    return products.filter((product) => {
      // Category filter
      if (activeCategory !== 'all' && product.category !== activeCategory) {
        return false;
      }

      // Search Query filter
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase().trim();
        const matchesTitle = product.title.toLowerCase().includes(query);
        const matchesBrand = product.brand.toLowerCase().includes(query);
        const matchesCategory = product.category.toLowerCase().includes(query);
        const matchesTags = product.tags.some((t) => t.toLowerCase().includes(query));
        const matchesSpecs = Object.values(product.specs).some((v) => v.toLowerCase().includes(query));
        if (!matchesTitle && !matchesBrand && !matchesCategory && !matchesTags && !matchesSpecs) {
          return false;
        }
      }

      // Store Availability filter
      const hasAmazon = Boolean(product.amazonUrl && product.amazonPrice);
      const hasFlipkart = Boolean(product.flipkartUrl && product.flipkartPrice);

      if (storeFilter === 'amazon' && !hasAmazon) return false;
      if (storeFilter === 'flipkart' && !hasFlipkart) return false;
      if (storeFilter === 'both' && (!hasAmazon || !hasFlipkart)) return false;

      // Price Filter
      const lowest = getLowestPrice(product);
      if (lowest.price > maxPrice) return false;

      // Min Discount Filter
      const discount = getDiscountPercentage(product.originalPrice, lowest.price);
      if (discount < minDiscount) return false;

      // In Stock filter
      if (onlyInStock && !product.inStock) return false;

      // Tag filter
      if (selectedTag && !product.tags.includes(selectedTag)) return false;

      return true;
    }).sort((a, b) => {
      const lowestA = getLowestPrice(a);
      const lowestB = getLowestPrice(b);
      const discountA = getDiscountPercentage(a.originalPrice, lowestA.price);
      const discountB = getDiscountPercentage(b.originalPrice, lowestB.price);

      if (sortBy === 'discount') {
        return discountB - discountA;
      }
      if (sortBy === 'price-asc') {
        return lowestA.price - lowestB.price;
      }
      if (sortBy === 'price-desc') {
        return lowestB.price - lowestA.price;
      }
      if (sortBy === 'rating') {
        return b.rating * b.reviewCount - a.rating * a.reviewCount;
      }
      if (sortBy === 'newest') {
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      }
      return 0;
    });
  }, [
    products,
    activeCategory,
    searchQuery,
    storeFilter,
    sortBy,
    minDiscount,
    maxPrice,
    onlyInStock,
    selectedTag,
  ]);

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 flex flex-col font-sans selection:bg-amber-500/20 selection:text-amber-300">
      
      {/* Navigation Bar (Clean top without admin button) */}
      <Navbar
        onOpenWishlist={() => setIsWishlistOpen(true)}
        onSelectProduct={(p) => setSelectedProduct(p)}
      />

      {/* Main Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-10 space-y-10">
        
        {/* Hero Deals Highlight */}
        {!searchQuery.trim() && activeCategory === 'all' && (
          <HeroDealsBanner onSelectProduct={(p) => setSelectedProduct(p)} />
        )}

        {/* Category Navigation */}
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xs font-mono uppercase text-zinc-400 tracking-wider font-semibold">
              Gear Categories
            </h2>
            <span className="text-xs text-zinc-500 font-mono">
              Curated Esports Hardware
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-3">
            {[
              { id: 'all', label: 'All Gear' },
              { id: 'keyboards', label: 'Keyboards' },
              { id: 'mice', label: 'Gaming Mice' },
              { id: 'headsets', label: 'Headsets' },
              { id: 'monitors', label: 'Monitors' },
              { id: 'controllers', label: 'Controllers' },
              { id: 'accessories', label: 'Accessories' },
            ].map((cat) => {
              const isSelected = activeCategory === cat.id;
              const count = categoryCounts[cat.id] || 0;
              return (
                <button
                  key={cat.id}
                  onClick={() => setActiveCategory(cat.id as any)}
                  className={`p-3.5 rounded-2xl border text-left transition-all flex flex-col justify-between ${
                    isSelected
                      ? 'bg-zinc-900 border-amber-400/50 shadow-lg shadow-amber-500/5'
                      : 'bg-zinc-900/40 border-zinc-800/80 hover:bg-zinc-900/80 hover:border-zinc-700/80'
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    {CATEGORY_ICONS[cat.id]}
                    <span className="text-xs font-mono text-zinc-500">
                      {count}
                    </span>
                  </div>
                  <span className={`text-xs font-semibold truncate ${isSelected ? 'text-amber-400' : 'text-zinc-200'}`}>
                    {cat.label}
                  </span>
                </button>
              );
            })}
          </div>
        </section>

        {/* Filter Bar */}
        <FilterBar totalResults={filteredProducts.length} />

        {/* Products Grid */}
        <section>
          {filteredProducts.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {filteredProducts.map((product) => (
                <ProductCard
                  key={product.id}
                  product={product}
                  onSelect={(p) => setSelectedProduct(p)}
                />
              ))}
            </div>
          ) : products.length === 0 ? (
            /* Blank Storefront State */
            <div className="p-16 text-center rounded-3xl bg-zinc-900/40 border border-zinc-800/80 space-y-4 max-w-lg mx-auto my-12">
              <div className="w-16 h-16 rounded-2xl bg-amber-500/10 text-amber-400 mx-auto flex items-center justify-center border border-amber-500/20 shadow-lg">
                <Gamepad2 className="w-8 h-8" />
              </div>
              <h3 className="text-lg font-bold text-white font-mono">
                Store Catalog is Empty
              </h3>
              <p className="text-xs text-zinc-400 leading-relaxed max-w-sm mx-auto">
                No products are currently listed in the store. Please check back soon for the latest gaming hardware and deals.
              </p>
            </div>
          ) : (
            /* Filter Empty State */
            <div className="p-16 text-center rounded-3xl bg-zinc-900/40 border border-zinc-800/80 space-y-4 max-w-lg mx-auto my-12">
              <div className="w-14 h-14 rounded-2xl bg-zinc-900 mx-auto flex items-center justify-center text-zinc-500 border border-zinc-800">
                <RotateCcw className="w-6 h-6" />
              </div>
              <h3 className="text-base font-bold text-white font-mono">
                No Gear Found
              </h3>
              <p className="text-xs text-zinc-400 leading-relaxed">
                No products match your current filters{searchQuery ? ` for "${searchQuery}"` : ''}.
              </p>
              <div className="pt-2">
                <button
                  onClick={() => {
                    setActiveCategory('all');
                    setSearchQuery('');
                  }}
                  className="px-5 py-2.5 bg-amber-500 hover:bg-amber-400 text-zinc-950 font-bold rounded-xl text-xs transition-colors"
                >
                  Clear Filters &amp; View All Gear
                </button>
              </div>
            </div>
          )}
        </section>
      </main>

      {/* Footer with small discrete bottom admin portal entry */}
      <Footer onOpenAdmin={handleOpenAdmin} />

      {/* Quick View Modal */}
      <ProductQuickViewModal
        product={selectedProduct}
        onClose={() => setSelectedProduct(null)}
      />

      {/* Admin Email & Password Authentication Modal */}
      <AdminLoginModal
        isOpen={isAdminAuthOpen}
        onClose={() => setIsAdminAuthOpen(false)}
        onLoginSuccess={handleLoginSuccess}
      />

      {/* Admin Panel Modal - Strictly gated behind verified authentication */}
      {authenticatedEmail && isAdminPanelOpen && (
        <AdminPanelModal
          isOpen={isAdminPanelOpen}
          onClose={() => setIsAdminPanelOpen(false)}
          onLogout={handleLogout}
          adminEmail={authenticatedEmail}
        />
      )}

      {/* Wishlist Drawer */}
      <WishlistDrawer
        isOpen={isWishlistOpen}
        onClose={() => setIsWishlistOpen(false)}
        onSelectProduct={(p) => setSelectedProduct(p)}
      />

      {/* Floating Notifications */}
      <ToastContainer />
    </div>
  );
};

export default function App() {
  return (
    <AppProvider>
      <MainContent />
    </AppProvider>
  );
}
