import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Product, ProductCategory, DbStatus } from '../types';

interface ToastMessage {
  id: string;
  type: 'success' | 'info' | 'error';
  message: string;
}

interface AppContextType {
  products: Product[];
  wishlist: string[];
  activeCategory: ProductCategory | 'all';
  searchQuery: string;
  storeFilter: 'all' | 'amazon' | 'flipkart' | 'both';
  sortBy: 'discount' | 'price-asc' | 'price-desc' | 'rating' | 'newest';
  minDiscount: number;
  maxPrice: number;
  onlyInStock: boolean;
  selectedTag: string | null;
  toasts: ToastMessage[];

  // Database status & sync
  dbStatus: DbStatus | null;
  isDbSyncing: boolean;
  refreshDbStatus: () => Promise<void>;

  // Actions
  setActiveCategory: (cat: ProductCategory | 'all') => void;
  setSearchQuery: (query: string) => void;
  setStoreFilter: (store: 'all' | 'amazon' | 'flipkart' | 'both') => void;
  setSortBy: (sort: 'discount' | 'price-asc' | 'price-desc' | 'rating' | 'newest') => void;
  setMinDiscount: (discount: number) => void;
  setMaxPrice: (price: number) => void;
  setOnlyInStock: (only: boolean) => void;
  setSelectedTag: (tag: string | null) => void;
  
  // Product Operations
  addProduct: (product: Omit<Product, 'id' | 'createdAt'>) => Product;
  updateProduct: (id: string, updates: Partial<Product>) => void;
  deleteProduct: (id: string) => void;
  resetToDefaultCatalog: () => void;
  importCatalogJson: (json: string) => { success: boolean; count?: number; error?: string };
  exportCatalogJson: () => string;
  
  // Wishlist Operations
  toggleWishlist: (productId: string) => void;
  isInWishlist: (productId: string) => boolean;
  isWishlisted: (productId: string) => boolean;
  clearWishlist: () => void;
  
  // Toasts
  showToast: (message: string, type?: 'success' | 'info' | 'error') => void;
  removeToast: (id: string) => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  // Products state (seeded from localStorage or empty)
  const [products, setProducts] = useState<Product[]>(() => {
    try {
      localStorage.removeItem('nexusgear_products_v1');
      const saved = localStorage.getItem('nexusgear_products_v2');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) return parsed;
      }
    } catch (e) {
      console.error('Failed to parse products from localStorage', e);
    }
    return [];
  });

  // Database Connection State
  const [dbStatus, setDbStatus] = useState<DbStatus | null>(null);
  const [isDbSyncing, setIsDbSyncing] = useState<boolean>(false);

  // Wishlist
  const [wishlist, setWishlist] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem('nexusgear_wishlist_v1');
      if (saved) return JSON.parse(saved);
    } catch {
      return [];
    }
    return [];
  });

  // Filters
  const [activeCategory, setActiveCategory] = useState<ProductCategory | 'all'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [storeFilter, setStoreFilter] = useState<'all' | 'amazon' | 'flipkart' | 'both'>('all');
  const [sortBy, setSortBy] = useState<'discount' | 'price-asc' | 'price-desc' | 'rating' | 'newest'>('discount');
  const [minDiscount, setMinDiscount] = useState<number>(0);
  const [maxPrice, setMaxPrice] = useState<number>(100000);
  const [onlyInStock, setOnlyInStock] = useState<boolean>(false);
  const [selectedTag, setSelectedTag] = useState<string | null>(null);

  // Toasts
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  // Function to refresh MongoDB status
  const refreshDbStatus = async () => {
    try {
      const res = await fetch('/api/db/status');
      if (res.ok) {
        const data = await res.json();
        if (data.success) {
          setDbStatus({
            isAtlasConnected: data.isAtlasConnected,
            databaseType: data.databaseType,
            dbName: data.dbName,
            collection: data.collection,
            count: data.count,
            uriConfigured: data.uriConfigured,
            error: data.error,
          });
        }
      }
    } catch (e) {
      console.warn('Could not check MongoDB status:', e);
    }
  };

  // Initial load: Fetch from MongoDB Atlas on mount
  useEffect(() => {
    let isMounted = true;
    const fetchInitialData = async () => {
      setIsDbSyncing(true);
      try {
        await refreshDbStatus();
        const res = await fetch('/api/products');
        if (res.ok) {
          const json = await res.json();
          if (json.success && Array.isArray(json.products) && isMounted) {
            setProducts(json.products);
          }
        }
      } catch (err) {
        console.warn('Failed to fetch initial products from MongoDB:', err);
      } finally {
        if (isMounted) setIsDbSyncing(false);
      }
    };

    fetchInitialData();
    return () => {
      isMounted = false;
    };
  }, []);

  // Sync products to localStorage as client cache
  useEffect(() => {
    try {
      localStorage.setItem('nexusgear_products_v2', JSON.stringify(products));
    } catch (e) {
      console.error('Failed to save products to localStorage', e);
    }
  }, [products]);

  // Sync wishlist
  useEffect(() => {
    try {
      localStorage.setItem('nexusgear_wishlist_v1', JSON.stringify(wishlist));
    } catch (e) {
      console.error('Failed to save wishlist to localStorage', e);
    }
  }, [wishlist]);

  const showToast = (message: string, type: 'success' | 'info' | 'error' = 'info') => {
    const id = Math.random().toString(36).substring(2, 9);
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 3500);
  };

  const removeToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  const addProduct = (newProd: Omit<Product, 'id' | 'createdAt'>): Product => {
    const id = `item-${Date.now().toString(36)}-${Math.random().toString(36).substring(2, 6)}`;

    const product: Product = {
      ...newProd,
      id,
      amazonUrl: newProd.amazonUrl ? newProd.amazonUrl.trim() : '',
      flipkartUrl: newProd.flipkartUrl ? newProd.flipkartUrl.trim() : '',
      createdAt: new Date().toISOString(),
    };

    setProducts((prev) => [product, ...prev]);
    showToast(`Added "${product.title}" to catalog!`, 'success');

    // Sync to MongoDB Atlas in background
    fetch('/api/products', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(product),
    })
      .then(() => refreshDbStatus())
      .catch((err) => console.error('Error syncing added product to MongoDB:', err));

    return product;
  };

  const updateProduct = (id: string, updates: Partial<Product>) => {
    let updatedProduct: Product | null = null;
    setProducts((prev) =>
      prev.map((item) => {
        if (item.id === id) {
          updatedProduct = {
            ...item,
            ...updates,
            amazonUrl: updates.amazonUrl !== undefined ? updates.amazonUrl.trim() : item.amazonUrl,
            flipkartUrl: updates.flipkartUrl !== undefined ? updates.flipkartUrl.trim() : item.flipkartUrl,
          };
          return updatedProduct;
        }
        return item;
      })
    );
    showToast('Product updated successfully', 'success');

    if (updatedProduct) {
      fetch('/api/products', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updatedProduct),
      })
        .then(() => refreshDbStatus())
        .catch((err) => console.error('Error syncing updated product to MongoDB:', err));
    }
  };

  const deleteProduct = (id: string) => {
    const prod = products.find((p) => p.id === id);
    setProducts((prev) => prev.filter((item) => item.id !== id));
    showToast(`Removed "${prod ? prod.title : 'Product'}"`, 'info');

    // Delete in MongoDB Atlas
    fetch(`/api/products/${encodeURIComponent(id)}`, {
      method: 'DELETE',
    })
      .then(() => refreshDbStatus())
      .catch((err) => console.error('Error deleting product from MongoDB:', err));
  };

  const resetToDefaultCatalog = () => {
    setProducts([]);
    showToast('Catalog cleared', 'info');

    // Clear all in MongoDB Atlas
    fetch('/api/products', {
      method: 'DELETE',
    })
      .then(() => refreshDbStatus())
      .catch((err) => console.error('Error clearing products in MongoDB:', err));
  };

  const importCatalogJson = (jsonStr: string) => {
    try {
      const data = JSON.parse(jsonStr);
      if (Array.isArray(data)) {
        if (data.length === 0) return { success: false, error: 'File contains empty array.' };
        if (!data[0].title || !data[0].category) {
          return { success: false, error: 'Invalid product schema. "title" and "category" required.' };
        }
        setProducts(data);
        showToast(`Successfully imported ${data.length} products!`, 'success');

        // Batch sync to MongoDB Atlas
        fetch('/api/products/batch', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ products: data, replaceAll: true }),
        })
          .then(() => refreshDbStatus())
          .catch((err) => console.error('Error batch syncing products to MongoDB:', err));

        return { success: true, count: data.length };
      }
      return { success: false, error: 'Imported data must be an array of products.' };
    } catch (e: any) {
      return { success: false, error: e.message || 'Failed to parse JSON file.' };
    }
  };

  const exportCatalogJson = (): string => {
    return JSON.stringify(products, null, 2);
  };

  // Wishlist Actions
  const toggleWishlist = (productId: string) => {
    setWishlist((prev) => {
      if (prev.includes(productId)) {
        showToast('Removed from saved wishlist', 'info');
        return prev.filter((id) => id !== productId);
      } else {
        showToast('Saved to wishlist!', 'success');
        return [...prev, productId];
      }
    });
  };

  const isInWishlist = (productId: string) => wishlist.includes(productId);

  const clearWishlist = () => {
    setWishlist([]);
    showToast('Wishlist cleared', 'info');
  };

  return (
    <AppContext.Provider
      value={{
        products,
        wishlist,
        activeCategory,
        searchQuery,
        storeFilter,
        sortBy,
        minDiscount,
        maxPrice,
        onlyInStock,
        selectedTag,
        toasts,
        dbStatus,
        isDbSyncing,
        refreshDbStatus,
        setActiveCategory,
        setSearchQuery,
        setStoreFilter,
        setSortBy,
        setMinDiscount,
        setMaxPrice,
        setOnlyInStock,
        setSelectedTag,
        addProduct,
        updateProduct,
        deleteProduct,
        resetToDefaultCatalog,
        importCatalogJson,
        exportCatalogJson,
        toggleWishlist,
        isInWishlist,
        isWishlisted: isInWishlist,
        clearWishlist,
        showToast,
        removeToast,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};
