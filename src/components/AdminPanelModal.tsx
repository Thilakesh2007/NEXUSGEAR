import React, { useState, useEffect, useRef } from 'react';
import { useApp } from '../context/AppContext';
import { Product, ProductCategory } from '../types';
import { 
  X, 
  Plus, 
  Trash2, 
  Edit3, 
  Check, 
  AlertCircle, 
  Search, 
  Settings, 
  Database, 
  ExternalLink,
  Save,
  RotateCcw,
  Sparkles,
  Link2,
  Sliders,
  Loader2,
  Zap,
  LogOut,
  Image as ImageIcon,
  Tag,
  Star,
  CheckCircle2,
  Info,
  Upload,
  Download,
  FileText,
  RefreshCw,
  Eye,
  Layers,
  KeyRound,
  Lock,
  Shield
} from 'lucide-react';
import { formatCurrency, getLowestPrice, getDiscountPercentage } from '../utils/affiliate';

interface AdminPanelModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLogout: () => void;
  adminEmail: string;
  initialEditProduct?: Product | null;
}

type AdminTab = 'inventory' | 'add-product' | 'data';

interface SpecItem {
  id: string;
  key: string;
  val: string;
}

const SUGGESTED_TAGS = [
  'Wireless',
  'Hall Effect',
  'Rapid Trigger',
  'Ultra-light',
  '60g',
  'TKL',
  'RGB',
  'OLED',
  '240Hz',
  'ANC',
  '300h Battery',
  'Hot-swap',
  'Esports'
];

export const AdminPanelModal: React.FC<AdminPanelModalProps> = ({ 
  isOpen, 
  onClose,
  onLogout,
  adminEmail,
  initialEditProduct = null
}) => {
  const { 
    products, 
    addProduct, 
    updateProduct, 
    deleteProduct, 
    resetToDefaultCatalog,
    exportCatalogJson,
    importCatalogJson,
    showToast,
    dbStatus,
    refreshDbStatus,
    isDbSyncing
  } = useApp();

  const [activeTab, setActiveTab] = useState<AdminTab>(initialEditProduct ? 'add-product' : 'inventory');
  const [editingProductId, setEditingProductId] = useState<string | null>(initialEditProduct ? initialEditProduct.id : null);

  // Form State
  const [title, setTitle] = useState('');
  const [brand, setBrand] = useState('');
  const [category, setCategory] = useState<ProductCategory>('keyboards');
  const [shortDescription, setShortDescription] = useState('');
  const [fullDescription, setFullDescription] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [originalPrice, setOriginalPrice] = useState<number | ''>(9999);
  const [amazonPrice, setAmazonPrice] = useState<number | ''>(7999);
  const [amazonUrl, setAmazonUrl] = useState('');
  const [flipkartPrice, setFlipkartPrice] = useState<number | ''>(8299);
  const [flipkartUrl, setFlipkartUrl] = useState('');
  const [rating, setRating] = useState<number | ''>(4.8);
  const [reviewCount, setReviewCount] = useState<number | ''>(120);
  const [isFeaturedDeal, setIsFeaturedDeal] = useState(false);
  const [dealBadge, setDealBadge] = useState('');
  const [inStock, setInStock] = useState(true);
  const [tags, setTags] = useState('Wireless, RGB, Esports');
  const [specsList, setSpecsList] = useState<SpecItem[]>([
    { id: '1', key: 'Connectivity', val: '2.4GHz Wireless / USB-C' },
    { id: '2', key: 'Weight', val: '65g' },
  ]);
  const [featuresList, setFeaturesList] = useState<string[]>([
    'Tournament-ready performance with instant response',
    'Ergonomic durable structure built for long sessions',
  ]);

  // Inventory Filters
  const [inventorySearch, setInventorySearch] = useState('');
  const [inventoryCategory, setInventoryCategory] = useState<ProductCategory | 'all'>('all');
  const [inventoryStockFilter, setInventoryStockFilter] = useState<'all' | 'in-stock' | 'out-of-stock'>('all');

  // Amazon Auto Fetch
  const [isFetchingAmazon, setIsFetchingAmazon] = useState(false);
  const [fetchUrlInput, setFetchUrlInput] = useState('');

  // Backup & Import
  const [importJsonText, setImportJsonText] = useState('');
  const [importError, setImportError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Custom Delete Confirmation Modal state
  const [productToDelete, setProductToDelete] = useState<Product | null>(null);
  const [showResetConfirm, setShowResetConfirm] = useState(false);

  // Admin Password Management State
  const [newPasswordInput, setNewPasswordInput] = useState('');
  const [confirmPasswordInput, setConfirmPasswordInput] = useState('');
  const [passwordError, setPasswordError] = useState<string | null>(null);

  const handleUpdatePassword = (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordError(null);

    const trimmed = newPasswordInput.trim();
    if (trimmed.length < 6) {
      setPasswordError('Password must be at least 6 characters long.');
      return;
    }

    if (trimmed !== confirmPasswordInput.trim()) {
      setPasswordError('Passwords do not match.');
      return;
    }

    try {
      localStorage.setItem('nexusgear_admin_password', trimmed);
      setNewPasswordInput('');
      setConfirmPasswordInput('');
      showToast('Admin password updated successfully!', 'success');
    } catch {
      setPasswordError('Failed to save new password to storage.');
    }
  };

  // Load product into form for editing
  const loadProductIntoForm = (product: Product) => {
    setEditingProductId(product.id);
    setTitle(product.title);
    setBrand(product.brand);
    setCategory(product.category);
    setShortDescription(product.shortDescription || '');
    setFullDescription(product.fullDescription || '');
    setImageUrl(product.imageUrl || '');
    setOriginalPrice(product.originalPrice);
    setAmazonPrice(product.amazonPrice !== undefined ? product.amazonPrice : '');
    setAmazonUrl(product.amazonUrl || '');
    setFlipkartPrice(product.flipkartPrice !== undefined ? product.flipkartPrice : '');
    setFlipkartUrl(product.flipkartUrl || '');
    setRating(product.rating || 4.5);
    setReviewCount(product.reviewCount || 10);
    setIsFeaturedDeal(Boolean(product.isFeaturedDeal));
    setDealBadge(product.dealBadge || '');
    setInStock(Boolean(product.inStock));
    setTags(product.tags ? product.tags.join(', ') : '');
    setSpecsList(
      product.specs && Object.keys(product.specs).length > 0
        ? Object.entries(product.specs).map(([key, val], idx) => ({ id: String(idx + 1), key, val }))
        : [{ id: '1', key: '', val: '' }]
    );
    setFeaturesList(product.features && product.features.length > 0 ? product.features : ['']);
  };

  const resetForm = () => {
    setEditingProductId(null);
    setTitle('');
    setBrand('');
    setCategory('keyboards');
    setShortDescription('');
    setFullDescription('');
    setImageUrl('');
    setOriginalPrice(9999);
    setAmazonPrice(7999);
    setAmazonUrl('');
    setFlipkartPrice(8299);
    setFlipkartUrl('');
    setRating(4.8);
    setReviewCount(50);
    setIsFeaturedDeal(false);
    setDealBadge('');
    setInStock(true);
    setTags('Wireless, Gaming, RGB');
    setSpecsList([
      { id: '1', key: 'Connectivity', val: '2.4GHz Wireless / USB-C' },
      { id: '2', key: 'Weight', val: '65g' },
    ]);
    setFeaturesList([
      'Tournament-ready performance with instant response',
      'Ergonomic durable structure built for long sessions',
    ]);
    setFetchUrlInput('');
  };

  // When initialEditProduct changes, load into form
  useEffect(() => {
    if (initialEditProduct) {
      loadProductIntoForm(initialEditProduct);
      setActiveTab('add-product');
    }
  }, [initialEditProduct]);

  if (!isOpen || !adminEmail) return null;

  // Auto-fetch from official Amazon listing
  const handleFetchAmazon = async (urlToUse?: string) => {
    const targetUrl = (urlToUse || fetchUrlInput || amazonUrl).trim();
    if (!targetUrl) {
      showToast('Please enter an Amazon product URL first', 'error');
      return;
    }

    setIsFetchingAmazon(true);
    showToast('Connecting to Amazon official listing...', 'info');

    try {
      const res = await fetch('/api/fetch-amazon', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: targetUrl }),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Failed to fetch details from Amazon');
      }

      const p = data.data;

      // Update form state with fetched fields
      setAmazonUrl(targetUrl);
      if (p.imageUrl) setImageUrl(p.imageUrl);
      if (p.amazonPrice) setAmazonPrice(p.amazonPrice);
      if (p.originalPrice) setOriginalPrice(p.originalPrice);
      if (p.title) setTitle(p.title);
      if (p.brand) setBrand(p.brand);
      if (p.category) setCategory(p.category);
      if (p.shortDescription) setShortDescription(p.shortDescription);
      if (p.fullDescription) setFullDescription(p.fullDescription);
      if (p.rating) setRating(p.rating);
      if (p.reviewCount) setReviewCount(p.reviewCount);
      if (p.specs && Object.keys(p.specs).length > 0) {
        setSpecsList(
          Object.entries(p.specs).map(([key, val], idx) => ({
            id: String(idx + 1),
            key,
            val: String(val),
          }))
        );
      }
      if (p.features && p.features.length > 0) {
        setFeaturesList(p.features);
      }
      if (p.tags && p.tags.length > 0) {
        setTags(p.tags.join(', '));
      }

      setFetchUrlInput('');
      showToast(
        `✓ Fetched: ${p.title ? p.title.slice(0, 30) + '...' : 'Product'} (Price: ₹${p.amazonPrice ? p.amazonPrice.toLocaleString('en-IN') : 'N/A'})`,
        'success'
      );
    } catch (err: any) {
      console.error('Fetch Amazon error:', err);
      showToast(err.message || 'Could not fetch from Amazon. Please check the URL.', 'error');
    } finally {
      setIsFetchingAmazon(false);
    }
  };

  const handleToggleTag = (tag: string) => {
    const currentTags = tags
      .split(',')
      .map((t) => t.trim())
      .filter((t) => t.length > 0);

    let updated: string[];
    if (currentTags.includes(tag)) {
      updated = currentTags.filter((t) => t !== tag);
    } else {
      updated = [...currentTags, tag];
    }
    setTags(updated.join(', '));
  };

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!title.trim() || !brand.trim()) {
      showToast('Title and Brand are required fields', 'error');
      return;
    }

    const specsRecord: Record<string, string> = {};
    specsList.forEach((s) => {
      if (s.key.trim() && s.val.trim()) {
        specsRecord[s.key.trim()] = s.val.trim();
      }
    });

    const parsedTags = tags
      .split(',')
      .map((t) => t.trim())
      .filter((t) => t.length > 0);

    const filteredFeatures = featuresList.filter((f) => f.trim().length > 0);

    const productPayload = {
      title: title.trim(),
      brand: brand.trim(),
      category,
      shortDescription: shortDescription.trim() || `${brand} ${title} tournament gaming hardware.`,
      fullDescription: fullDescription.trim() || `${title} provides high performance and durability for esports enthusiasts.`,
      imageUrl: imageUrl.trim() || 'https://images.unsplash.com/photo-1595225476474-87563907a212?auto=format&fit=crop&w=800&q=80',
      originalPrice: typeof originalPrice === 'number' ? originalPrice : 0,
      amazonPrice: typeof amazonPrice === 'number' ? amazonPrice : undefined,
      amazonUrl: amazonUrl.trim() || undefined,
      flipkartPrice: typeof flipkartPrice === 'number' ? flipkartPrice : undefined,
      flipkartUrl: flipkartUrl.trim() || undefined,
      rating: typeof rating === 'number' ? rating : 4.5,
      reviewCount: typeof reviewCount === 'number' ? reviewCount : 10,
      isFeaturedDeal,
      dealBadge: dealBadge.trim() || undefined,
      inStock,
      tags: parsedTags.length > 0 ? parsedTags : ['Gaming'],
      specs: specsRecord,
      features: filteredFeatures.length > 0 ? filteredFeatures : ['High performance gaming gear'],
    };

    if (editingProductId) {
      updateProduct(editingProductId, productPayload);
    } else {
      addProduct(productPayload);
    }

    resetForm();
    setActiveTab('inventory');
  };

  // Filtered inventory products
  const filteredInventory = products.filter((p) => {
    const matchesCat = inventoryCategory === 'all' || p.category === inventoryCategory;
    const matchesSearch =
      inventorySearch === '' ||
      p.title.toLowerCase().includes(inventorySearch.toLowerCase()) ||
      p.brand.toLowerCase().includes(inventorySearch.toLowerCase());
    const matchesStock =
      inventoryStockFilter === 'all' ||
      (inventoryStockFilter === 'in-stock' && p.inStock) ||
      (inventoryStockFilter === 'out-of-stock' && !p.inStock);
    return matchesCat && matchesSearch && matchesStock;
  });

  // Calculate live preview discount
  const effectivePrice = typeof amazonPrice === 'number' && amazonPrice > 0 
    ? amazonPrice 
    : (typeof originalPrice === 'number' ? originalPrice : 0);

  const previewDiscount = typeof originalPrice === 'number' && originalPrice > effectivePrice
    ? getDiscountPercentage(originalPrice, effectivePrice)
    : 0;

  // File Upload Handler for JSON Import
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      if (content) {
        setImportJsonText(content);
        setImportError(null);
        showToast(`Loaded ${file.name} (${Math.round(file.size / 1024)} KB). Click Import below.`, 'info');
      }
    };
    reader.onerror = () => {
      setImportError('Failed to read selected file.');
    };
    reader.readAsText(file);
  };

  return (
    <div className="fixed inset-0 z-50 overflow-hidden bg-black/85 backdrop-blur-md flex items-center justify-center p-3 sm:p-5 md:p-6 animate-in fade-in duration-200">
      <div 
        className="relative w-full max-w-6xl h-[90vh] bg-zinc-950 border border-zinc-800 rounded-3xl shadow-2xl overflow-hidden flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        
        {/* Sleek Admin Header */}
        <div className="flex flex-wrap items-center justify-between px-6 py-4 border-b border-zinc-800 bg-zinc-900/90 gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-amber-500/10 text-amber-400 flex items-center justify-center border border-amber-500/20 shadow-sm">
              <Settings className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-extrabold text-white text-base font-mono">
                  NEXUS<span className="text-amber-400">GEAR</span> Command Center
                </h3>
                <span className="text-[10px] bg-emerald-500/15 text-emerald-400 px-2 py-0.5 rounded-full font-mono border border-emerald-500/30">
                  Authorized
                </span>
              </div>
              <p className="text-xs text-zinc-400">
                Logged in as <span className="text-zinc-200 font-mono font-medium">{adminEmail}</span>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2.5">
            <button
              onClick={onLogout}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-zinc-400 hover:text-rose-400 border border-zinc-800 text-xs font-mono transition-colors cursor-pointer"
              title="Sign out of Admin"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Log Out</span>
            </button>

            <button
              onClick={onClose}
              className="p-2 rounded-xl text-zinc-400 hover:text-white bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 transition-colors cursor-pointer"
              title="Close Panel"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Tab Navigation Segmented Bar */}
        <div className="flex items-center gap-2 px-6 py-3 bg-zinc-900/40 border-b border-zinc-800 overflow-x-auto text-xs font-mono">
          <button
            onClick={() => setActiveTab('inventory')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl transition-all font-semibold cursor-pointer ${
              activeTab === 'inventory'
                ? 'bg-amber-400 text-zinc-950 shadow-md shadow-amber-500/10'
                : 'text-zinc-400 hover:text-white hover:bg-zinc-850'
            }`}
          >
            <Database className="w-3.5 h-3.5" />
            <span>Product Inventory ({products.length})</span>
          </button>

          <button
            onClick={() => {
              if (!editingProductId) resetForm();
              setActiveTab('add-product');
            }}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl transition-all font-semibold cursor-pointer ${
              activeTab === 'add-product'
                ? 'bg-amber-400 text-zinc-950 shadow-md shadow-amber-500/10'
                : 'text-zinc-400 hover:text-white hover:bg-zinc-850'
            }`}
          >
            <Plus className="w-3.5 h-3.5" />
            <span>{editingProductId ? 'Edit Product' : 'Add New Gear'}</span>
          </button>

          <button
            onClick={() => setActiveTab('data')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl transition-all font-semibold cursor-pointer ${
              activeTab === 'data'
                ? 'bg-amber-400 text-zinc-950 shadow-md shadow-amber-500/10'
                : 'text-zinc-400 hover:text-white hover:bg-zinc-850'
            }`}
          >
            <Sliders className="w-3.5 h-3.5" />
            <span>Backup &amp; Reset Tools</span>
          </button>
        </div>

        {/* Scrollable Content Body */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 bg-zinc-950 space-y-6">
          
          {/* TAB 1: PRODUCT INVENTORY */}
          {activeTab === 'inventory' && (
            <div className="space-y-5">
              
              {/* Metric Cards Banner */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="p-4 bg-zinc-900/60 border border-zinc-800 rounded-2xl">
                  <span className="text-[11px] text-zinc-400 block font-mono">TOTAL GEAR</span>
                  <span className="text-2xl font-extrabold text-white font-mono mt-0.5 block">{products.length}</span>
                </div>
                <div className="p-4 bg-zinc-900/60 border border-zinc-800 rounded-2xl">
                  <span className="text-[11px] text-zinc-400 block font-mono">IN STOCK</span>
                  <span className="text-2xl font-extrabold text-emerald-400 font-mono mt-0.5 block">
                    {products.filter((p) => p.inStock).length}
                  </span>
                </div>
                <div className="p-4 bg-zinc-900/60 border border-zinc-800 rounded-2xl">
                  <span className="text-[11px] text-zinc-400 block font-mono">SPOTLIGHT DEALS</span>
                  <span className="text-2xl font-extrabold text-amber-400 font-mono mt-0.5 block">
                    {products.filter((p) => p.isFeaturedDeal).length}
                  </span>
                </div>
                <div className="p-4 bg-zinc-900/60 border border-zinc-800 rounded-2xl">
                  <span className="text-[11px] text-zinc-400 block font-mono">OUT OF STOCK</span>
                  <span className="text-2xl font-extrabold text-rose-400 font-mono mt-0.5 block">
                    {products.filter((p) => !p.inStock).length}
                  </span>
                </div>
              </div>

              {/* Filtering Controls */}
              <div className="flex flex-wrap items-center justify-between gap-3 bg-zinc-900/40 p-4 rounded-2xl border border-zinc-800">
                <div className="relative flex-1 min-w-[240px]">
                  <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500 pointer-events-none" />
                  <input
                    type="text"
                    placeholder="Search inventory by title or brand..."
                    value={inventorySearch}
                    onChange={(e) => setInventorySearch(e.target.value)}
                    className="w-full pl-10 pr-3.5 py-2.5 bg-zinc-950 text-xs text-white placeholder-zinc-500 rounded-xl border border-zinc-800 focus:outline-none focus:border-amber-400/80 transition-all font-sans"
                  />
                </div>

                <div className="flex items-center gap-2.5 flex-wrap">
                  {/* Category Filter */}
                  <select
                    value={inventoryCategory}
                    onChange={(e) => setInventoryCategory(e.target.value as any)}
                    className="bg-zinc-950 text-xs text-zinc-200 border border-zinc-800 rounded-xl px-3 py-2.5 focus:outline-none capitalize font-mono cursor-pointer"
                  >
                    <option value="all">All Categories</option>
                    <option value="keyboards">Keyboards</option>
                    <option value="mice">Mice</option>
                    <option value="headsets">Headsets</option>
                    <option value="monitors">Monitors</option>
                    <option value="controllers">Controllers</option>
                    <option value="accessories">Accessories</option>
                  </select>

                  {/* Stock Filter */}
                  <select
                    value={inventoryStockFilter}
                    onChange={(e) => setInventoryStockFilter(e.target.value as any)}
                    className="bg-zinc-950 text-xs text-zinc-200 border border-zinc-800 rounded-xl px-3 py-2.5 focus:outline-none font-mono cursor-pointer"
                  >
                    <option value="all">All Stock Status</option>
                    <option value="in-stock">In Stock Only</option>
                    <option value="out-of-stock">Out of Stock Only</option>
                  </select>

                  <button
                    onClick={() => {
                      resetForm();
                      setActiveTab('add-product');
                    }}
                    className="flex items-center gap-1.5 px-4 py-2.5 bg-amber-500 hover:bg-amber-400 text-zinc-950 font-bold text-xs rounded-xl transition-all shadow-md cursor-pointer shrink-0"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Add New Gear</span>
                  </button>
                </div>
              </div>

              {/* Clean Inventory List / Table */}
              <div className="border border-zinc-800/80 rounded-2xl overflow-hidden bg-zinc-900/30">
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead>
                      <tr className="border-b border-zinc-800 bg-zinc-900 text-zinc-400 font-mono uppercase text-[10px]">
                        <th className="p-4">Product Details</th>
                        <th className="p-4">Category</th>
                        <th className="p-4">Amazon Price</th>
                        <th className="p-4">Flipkart Price</th>
                        <th className="p-4 text-center">Spotlight</th>
                        <th className="p-4 text-center">Status</th>
                        <th className="p-4 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-zinc-850">
                      {filteredInventory.map((item) => (
                        <tr key={item.id} className="hover:bg-zinc-900/70 transition-colors">
                          <td className="p-4">
                            <div className="flex items-center gap-3.5 max-w-sm">
                              <img
                                src={item.imageUrl}
                                alt={item.title}
                                className="w-12 h-12 object-cover rounded-xl bg-zinc-950 shrink-0 border border-zinc-800"
                              />
                              <div className="min-w-0">
                                <span className="font-semibold text-zinc-100 block truncate text-xs">
                                  {item.title}
                                </span>
                                <div className="flex items-center gap-2 mt-0.5">
                                  <span className="text-[11px] text-zinc-400 font-mono font-medium">
                                    {item.brand}
                                  </span>
                                  {item.originalPrice > 0 && (
                                    <span className="text-[10px] text-zinc-500 font-mono">
                                      MRP: {formatCurrency(item.originalPrice)}
                                    </span>
                                  )}
                                </div>
                              </div>
                            </div>
                          </td>

                          <td className="p-4 capitalize font-mono text-zinc-300">
                            <span className="px-2.5 py-1 rounded-lg bg-zinc-950 border border-zinc-800 text-[11px]">
                              {item.category}
                            </span>
                          </td>

                          <td className="p-4 font-mono">
                            {item.amazonPrice ? (
                              <div className="flex items-center gap-1.5">
                                <span className="text-amber-400 font-semibold">{formatCurrency(item.amazonPrice)}</span>
                                {item.amazonUrl && (
                                  <a href={item.amazonUrl} target="_blank" rel="noreferrer" className="text-zinc-500 hover:text-amber-400" title="Visit Amazon link">
                                    <ExternalLink className="w-3 h-3" />
                                  </a>
                                )}
                              </div>
                            ) : (
                              <span className="text-zinc-600">—</span>
                            )}
                          </td>

                          <td className="p-4 font-mono">
                            {item.flipkartPrice ? (
                              <div className="flex items-center gap-1.5">
                                <span className="text-cyan-400 font-semibold">{formatCurrency(item.flipkartPrice)}</span>
                                {item.flipkartUrl && (
                                  <a href={item.flipkartUrl} target="_blank" rel="noreferrer" className="text-zinc-500 hover:text-cyan-400" title="Visit Flipkart link">
                                    <ExternalLink className="w-3 h-3" />
                                  </a>
                                )}
                              </div>
                            ) : (
                              <span className="text-zinc-600">—</span>
                            )}
                          </td>

                          <td className="p-4 text-center">
                            <button
                              onClick={() => updateProduct(item.id, { isFeaturedDeal: !item.isFeaturedDeal })}
                              className={`p-1.5 rounded-lg text-xs transition-colors cursor-pointer ${
                                item.isFeaturedDeal
                                  ? 'bg-amber-400/20 text-amber-400 font-bold border border-amber-400/30'
                                  : 'text-zinc-600 hover:text-zinc-300 bg-zinc-950 border border-zinc-800'
                              }`}
                              title={item.isFeaturedDeal ? 'Remove from spotlight banner' : 'Feature on hero spotlight banner'}
                            >
                              ★
                            </button>
                          </td>

                          <td className="p-4 text-center">
                            <button
                              onClick={() => updateProduct(item.id, { inStock: !item.inStock })}
                              className={`px-3 py-1 rounded-full text-[11px] font-mono transition-colors cursor-pointer font-medium border ${
                                item.inStock
                                  ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20 hover:bg-emerald-500/20'
                                  : 'bg-rose-500/10 text-rose-400 border-rose-500/20 hover:bg-rose-500/20'
                              }`}
                              title="Click to toggle stock status"
                            >
                              {item.inStock ? 'In Stock' : 'Out of Stock'}
                            </button>
                          </td>

                          <td className="p-4 text-right">
                            <div className="flex items-center justify-end gap-2">
                              <button
                                onClick={() => {
                                  loadProductIntoForm(item);
                                  setActiveTab('add-product');
                                }}
                                className="p-2 text-zinc-400 hover:text-white bg-zinc-900 hover:bg-zinc-800 rounded-xl border border-zinc-800 transition-colors cursor-pointer"
                                title="Edit product details"
                              >
                                <Edit3 className="w-3.5 h-3.5" />
                              </button>
                              <button
                                onClick={() => setProductToDelete(item)}
                                className="p-2 text-zinc-400 hover:text-rose-400 bg-zinc-900 hover:bg-zinc-800 rounded-xl border border-zinc-800 transition-colors cursor-pointer"
                                title="Delete product"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                      {filteredInventory.length === 0 && (
                        <tr>
                          <td colSpan={7} className="p-12 text-center text-zinc-500 space-y-2">
                            <div className="w-10 h-10 rounded-xl bg-zinc-900 mx-auto flex items-center justify-center text-zinc-600">
                              <Database className="w-5 h-5" />
                            </div>
                            <p className="text-sm text-zinc-400 font-medium">No matching products found.</p>
                            <p className="text-xs text-zinc-500">Try changing your search keywords or category filters.</p>
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: ADD / EDIT PRODUCT */}
          {activeTab === 'add-product' && (
            <div className="space-y-6">
              
              {/* One-Click Amazon Fetch Banner */}
              <div className="p-5 rounded-2xl bg-gradient-to-r from-amber-500/10 via-zinc-900/60 to-zinc-950 border border-amber-500/30 shadow-lg">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2 text-xs font-mono font-bold text-amber-400">
                    <Zap className="w-4 h-4 fill-amber-400" />
                    <span>ONE-CLICK AUTO-IMPORT FROM AMAZON</span>
                  </div>
                  <span className="text-[11px] text-zinc-400 font-mono">
                    Fetches official photo, price in ₹ INR &amp; specs
                  </span>
                </div>

                <div className="flex flex-col sm:flex-row gap-2.5">
                  <input
                    type="text"
                    placeholder="Paste any Amazon product or affiliate link (e.g. https://www.amazon.in/dp/B0...)"
                    value={fetchUrlInput}
                    onChange={(e) => setFetchUrlInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        handleFetchAmazon();
                      }
                    }}
                    className="flex-1 px-4 py-2.5 bg-zinc-950 text-xs text-white placeholder-zinc-500 border border-zinc-800 rounded-xl focus:outline-none focus:border-amber-400 font-mono"
                  />
                  <button
                    type="button"
                    disabled={isFetchingAmazon || !fetchUrlInput.trim()}
                    onClick={() => handleFetchAmazon()}
                    className="flex items-center justify-center gap-2 px-5 py-2.5 bg-amber-500 hover:bg-amber-400 disabled:opacity-50 text-zinc-950 font-bold text-xs rounded-xl transition-all shadow-md shrink-0 cursor-pointer"
                  >
                    {isFetchingAmazon ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        <span>Fetching from Amazon...</span>
                      </>
                    ) : (
                      <>
                        <Zap className="w-4 h-4 fill-zinc-950" />
                        <span>Auto-Fill Details</span>
                      </>
                    )}
                  </button>
                </div>
              </div>

              {/* Form & Live Preview Grid */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
                
                {/* Form Fields (8 cols) */}
                <form onSubmit={handleFormSubmit} className="lg:col-span-8 space-y-6">
                  
                  <div className="flex items-center justify-between pb-3 border-b border-zinc-800">
                    <div>
                      <h4 className="text-sm font-bold text-white font-mono">
                        {editingProductId ? `Edit Product: ${title || 'Gear'}` : 'New Hardware Information'}
                      </h4>
                      <p className="text-xs text-zinc-400 mt-0.5">
                        Fill in product specifications, store URLs, and pricing.
                      </p>
                    </div>

                    {editingProductId && (
                      <button
                        type="button"
                        onClick={resetForm}
                        className="text-xs text-zinc-400 hover:text-white px-3 py-1.5 bg-zinc-900 border border-zinc-800 rounded-lg cursor-pointer"
                      >
                        Reset Form
                      </button>
                    )}
                  </div>

                  {/* Section 1: Essentials */}
                  <div className="space-y-4">
                    <span className="text-xs font-mono font-bold text-zinc-400 uppercase tracking-wider block">
                      1. Basic Information
                    </span>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-1.5">
                        <label className="text-xs text-zinc-300 font-medium">Product Title *</label>
                        <input
                          type="text"
                          required
                          placeholder="e.g. Wooting 60HE+ Rapid Trigger Keyboard"
                          value={title}
                          onChange={(e) => setTitle(e.target.value)}
                          className="w-full px-3.5 py-2.5 bg-zinc-900 text-xs text-white border border-zinc-800 rounded-xl focus:outline-none focus:border-amber-400"
                        />
                      </div>

                      <div className="space-y-1.5">
                        <label className="text-xs text-zinc-300 font-medium">Brand Name *</label>
                        <input
                          type="text"
                          required
                          placeholder="e.g. Wooting, Logitech G, Razer"
                          value={brand}
                          onChange={(e) => setBrand(e.target.value)}
                          className="w-full px-3.5 py-2.5 bg-zinc-900 text-xs text-white border border-zinc-800 rounded-xl focus:outline-none focus:border-amber-400"
                        />
                      </div>

                      <div className="space-y-1.5">
                        <label className="text-xs text-zinc-300 font-medium">Category *</label>
                        <select
                          value={category}
                          onChange={(e) => setCategory(e.target.value as ProductCategory)}
                          className="w-full px-3.5 py-2.5 bg-zinc-900 text-xs text-white border border-zinc-800 rounded-xl focus:outline-none focus:border-amber-400 capitalize font-mono cursor-pointer"
                        >
                          <option value="keyboards">Keyboards</option>
                          <option value="mice">Mice</option>
                          <option value="headsets">Headsets</option>
                          <option value="monitors">Monitors</option>
                          <option value="controllers">Controllers</option>
                          <option value="accessories">Accessories</option>
                        </select>
                      </div>

                      <div className="space-y-1.5">
                        <label className="text-xs text-zinc-300 font-medium">Original Retail MRP (₹ INR) *</label>
                        <input
                          type="number"
                          required
                          placeholder="e.g. 19999"
                          value={originalPrice}
                          onChange={(e) => setOriginalPrice(e.target.value === '' ? '' : Number(e.target.value))}
                          className="w-full px-3.5 py-2.5 bg-zinc-900 text-xs text-white border border-zinc-800 rounded-xl focus:outline-none focus:border-amber-400 font-mono"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Section 2: Image URL */}
                  <div className="space-y-3 pt-2 border-t border-zinc-850">
                    <span className="text-xs font-mono font-bold text-zinc-400 uppercase tracking-wider block">
                      2. Product Photo
                    </span>
                    <div className="flex gap-3">
                      <input
                        type="url"
                        placeholder="https://m.media-amazon.com/images/I/... (auto-filled on Amazon fetch)"
                        value={imageUrl}
                        onChange={(e) => setImageUrl(e.target.value)}
                        className="flex-1 px-3.5 py-2.5 bg-zinc-900 text-xs text-white border border-zinc-800 rounded-xl focus:outline-none focus:border-amber-400 font-mono"
                      />
                      {imageUrl ? (
                        <img
                          src={imageUrl}
                          alt="Preview"
                          className="w-12 h-12 object-cover rounded-xl bg-zinc-950 border border-zinc-800 shrink-0"
                        />
                      ) : (
                        <div className="w-12 h-12 rounded-xl bg-zinc-900 border border-zinc-800 flex items-center justify-center text-zinc-600 shrink-0">
                          <ImageIcon className="w-5 h-5" />
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Section 3: Store URLs & Live Prices */}
                  <div className="space-y-3 pt-2 border-t border-zinc-850">
                    <span className="text-xs font-mono font-bold text-zinc-400 uppercase tracking-wider block">
                      3. Store Links &amp; Live Pricing
                    </span>

                    {/* Amazon */}
                    <div className="p-4 rounded-2xl bg-zinc-900/60 border border-zinc-800 space-y-3">
                      <div className="flex items-center justify-between text-xs text-amber-400 font-mono font-bold">
                        <span>AMAZON INDIA LISTING</span>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                        <div className="md:col-span-2 space-y-1">
                          <label className="text-[11px] text-zinc-400">Amazon Product URL</label>
                          <input
                            type="text"
                            placeholder="https://www.amazon.in/dp/..."
                            value={amazonUrl}
                            onChange={(e) => setAmazonUrl(e.target.value)}
                            className="w-full px-3 py-2 bg-zinc-950 text-xs text-white border border-zinc-800 rounded-xl focus:outline-none focus:border-amber-400 font-mono"
                          />
                        </div>
                        <div className="space-y-1">
                          <label className="text-[11px] text-zinc-400">Live Price (₹ INR)</label>
                          <input
                            type="number"
                            placeholder="e.g. 16999"
                            value={amazonPrice}
                            onChange={(e) => setAmazonPrice(e.target.value === '' ? '' : Number(e.target.value))}
                            className="w-full px-3 py-2 bg-zinc-950 text-xs text-white border border-zinc-800 rounded-xl focus:outline-none focus:border-amber-400 font-mono"
                          />
                        </div>
                      </div>
                    </div>

                    {/* Flipkart */}
                    <div className="p-4 rounded-2xl bg-zinc-900/60 border border-zinc-800 space-y-3">
                      <div className="flex items-center justify-between text-xs text-cyan-400 font-mono font-bold">
                        <span>FLIPKART LISTING</span>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                        <div className="md:col-span-2 space-y-1">
                          <label className="text-[11px] text-zinc-400">Flipkart Product URL</label>
                          <input
                            type="text"
                            placeholder="https://www.flipkart.com/..."
                            value={flipkartUrl}
                            onChange={(e) => setFlipkartUrl(e.target.value)}
                            className="w-full px-3 py-2 bg-zinc-950 text-xs text-white border border-zinc-800 rounded-xl focus:outline-none focus:border-cyan-400 font-mono"
                          />
                        </div>
                        <div className="space-y-1">
                          <label className="text-[11px] text-zinc-400">Live Price (₹ INR)</label>
                          <input
                            type="number"
                            placeholder="e.g. 17499"
                            value={flipkartPrice}
                            onChange={(e) => setFlipkartPrice(e.target.value === '' ? '' : Number(e.target.value))}
                            className="w-full px-3 py-2 bg-zinc-950 text-xs text-white border border-zinc-800 rounded-xl focus:outline-none focus:border-cyan-400 font-mono"
                          />
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Section 4: Descriptions */}
                  <div className="space-y-3 pt-2 border-t border-zinc-850">
                    <span className="text-xs font-mono font-bold text-zinc-400 uppercase tracking-wider block">
                      4. Descriptions
                    </span>
                    <div className="space-y-3">
                      <div className="space-y-1">
                        <label className="text-xs text-zinc-300 font-medium">Short Hook Summary (1 sentence)</label>
                        <input
                          type="text"
                          placeholder="e.g. The gold standard esports keyboard with magnetic Hall Effect switches."
                          value={shortDescription}
                          onChange={(e) => setShortDescription(e.target.value)}
                          className="w-full px-3.5 py-2.5 bg-zinc-900 text-xs text-white border border-zinc-800 rounded-xl focus:outline-none"
                        />
                      </div>

                      <div className="space-y-1">
                        <label className="text-xs text-zinc-300 font-medium">Full Gear Overview</label>
                        <textarea
                          rows={3}
                          placeholder="Detailed overview explaining switches, ergonomics, sensor performance, build quality..."
                          value={fullDescription}
                          onChange={(e) => setFullDescription(e.target.value)}
                          className="w-full px-3.5 py-2.5 bg-zinc-900 text-xs text-white border border-zinc-800 rounded-xl focus:outline-none"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Section 5: Hardware Specs & Tags */}
                  <div className="space-y-4 pt-2 border-t border-zinc-850">
                    <span className="text-xs font-mono font-bold text-zinc-400 uppercase tracking-wider block">
                      5. Hardware Specs &amp; Tags
                    </span>

                    {/* Tag Selector */}
                    <div className="space-y-2">
                      <label className="text-xs text-zinc-300 font-medium block">Hardware Tags (Click to add)</label>
                      <div className="flex flex-wrap gap-1.5">
                        {SUGGESTED_TAGS.map((t) => {
                          const isSelected = tags.includes(t);
                          return (
                            <button
                              key={t}
                              type="button"
                              onClick={() => handleToggleTag(t)}
                              className={`px-3 py-1 rounded-lg text-xs font-mono transition-colors cursor-pointer ${
                                isSelected
                                  ? 'bg-amber-400 text-zinc-950 font-bold'
                                  : 'bg-zinc-900 text-zinc-400 hover:text-white border border-zinc-800'
                              }`}
                            >
                              {isSelected ? `✓ ${t}` : `+ ${t}`}
                            </button>
                          );
                        })}
                      </div>
                      <input
                        type="text"
                        placeholder="Or type comma-separated tags..."
                        value={tags}
                        onChange={(e) => setTags(e.target.value)}
                        className="w-full px-3.5 py-2 bg-zinc-900 text-xs text-white border border-zinc-800 rounded-xl focus:outline-none font-mono mt-1"
                      />
                    </div>

                    {/* Dynamic Specs List with Stable Keys */}
                    <div className="space-y-2.5">
                      <div className="flex items-center justify-between">
                        <label className="text-xs text-zinc-300 font-medium">Specifications Key-Value</label>
                        <button
                          type="button"
                          onClick={() => setSpecsList([...specsList, { id: String(Date.now()), key: '', val: '' }])}
                          className="text-xs text-amber-400 hover:text-amber-300 flex items-center gap-1 font-mono cursor-pointer"
                        >
                          <Plus className="w-3.5 h-3.5" /> Add Spec Line
                        </button>
                      </div>

                      <div className="space-y-2">
                        {specsList.map((spec, idx) => (
                          <div key={spec.id} className="flex gap-2">
                            <input
                              type="text"
                              placeholder="Spec Name (e.g. Switch)"
                              value={spec.key}
                              onChange={(e) => {
                                const updated = [...specsList];
                                updated[idx].key = e.target.value;
                                setSpecsList(updated);
                              }}
                              className="w-1/3 px-3 py-2 bg-zinc-900 text-xs text-white border border-zinc-800 rounded-xl focus:outline-none font-mono"
                            />
                            <input
                              type="text"
                              placeholder="Spec Value (e.g. Lekker Hall Effect)"
                              value={spec.val}
                              onChange={(e) => {
                                const updated = [...specsList];
                                updated[idx].val = e.target.value;
                                setSpecsList(updated);
                              }}
                              className="flex-1 px-3 py-2 bg-zinc-900 text-xs text-white border border-zinc-800 rounded-xl focus:outline-none font-mono"
                            />
                            <button
                              type="button"
                              onClick={() => {
                                const updated = specsList.filter((_, i) => i !== idx);
                                setSpecsList(updated);
                              }}
                              className="p-2 text-zinc-500 hover:text-rose-400 transition-colors cursor-pointer"
                              title="Delete spec"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Section 6: Visibility Options */}
                  <div className="flex flex-wrap items-center gap-6 p-4 bg-zinc-900/60 rounded-2xl border border-zinc-800 text-xs">
                    <label className="flex items-center gap-2 cursor-pointer select-none text-zinc-200">
                      <input
                        type="checkbox"
                        checked={isFeaturedDeal}
                        onChange={(e) => setIsFeaturedDeal(e.target.checked)}
                        className="w-4 h-4 rounded bg-zinc-950 border-zinc-700 accent-amber-500 cursor-pointer"
                      />
                      <span>Show on Hero Spotlight Banner</span>
                    </label>

                    <label className="flex items-center gap-2 cursor-pointer select-none text-zinc-200">
                      <input
                        type="checkbox"
                        checked={inStock}
                        onChange={(e) => setInStock(e.target.checked)}
                        className="w-4 h-4 rounded bg-zinc-950 border-zinc-700 accent-emerald-500 cursor-pointer"
                      />
                      <span>Item is Currently In Stock</span>
                    </label>
                  </div>

                  {/* Submit Actions Bar */}
                  <div className="flex items-center justify-end gap-3 pt-3 border-t border-zinc-800">
                    <button
                      type="button"
                      onClick={() => setActiveTab('inventory')}
                      className="px-5 py-2.5 bg-zinc-900 hover:bg-zinc-800 text-zinc-300 rounded-xl text-xs font-semibold transition-colors cursor-pointer border border-zinc-800"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="flex items-center gap-2 px-6 py-2.5 bg-amber-500 hover:bg-amber-400 text-zinc-950 rounded-xl text-xs font-bold transition-all shadow-lg cursor-pointer"
                    >
                      <Save className="w-4 h-4" />
                      <span>{editingProductId ? 'Update Product' : 'Save & Publish Product'}</span>
                    </button>
                  </div>

                </form>

                {/* Right: Live Interactive Card Preview (4 cols) */}
                <div className="lg:col-span-4 space-y-3">
                  <div className="flex items-center gap-2 text-xs font-mono text-zinc-400 uppercase font-semibold">
                    <Eye className="w-4 h-4 text-amber-400" />
                    <span>Real-time Store Card Preview</span>
                  </div>

                  <div className="rounded-2xl bg-zinc-900/90 border border-zinc-800 overflow-hidden shadow-2xl">
                    <div className="relative aspect-4/3 bg-zinc-950 overflow-hidden flex items-center justify-center">
                      {imageUrl ? (
                        <img
                          src={imageUrl}
                          alt="Preview"
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="flex flex-col items-center justify-center text-zinc-600 text-xs p-4 text-center">
                          <ImageIcon className="w-8 h-8 mb-2 opacity-50" />
                          <span>Product photo will appear here</span>
                        </div>
                      )}

                      {previewDiscount > 0 && (
                        <div className="absolute top-3 left-3 bg-zinc-950/90 text-emerald-400 font-mono font-bold text-xs px-2.5 py-1 rounded-lg border border-emerald-500/30">
                          {previewDiscount}% OFF
                        </div>
                      )}

                      {!inStock && (
                        <div className="absolute inset-0 bg-zinc-950/80 backdrop-blur-xs flex items-center justify-center">
                          <span className="text-rose-400 font-mono text-xs uppercase font-bold px-3 py-1 bg-rose-950/50 border border-rose-800 rounded-lg">
                            Out of Stock
                          </span>
                        </div>
                      )}
                    </div>

                    <div className="p-5 space-y-3">
                      <div className="flex items-center gap-1.5 text-xs font-mono text-zinc-400">
                        <span className="text-zinc-300 font-medium">{brand || 'Brand'}</span>
                        <span>·</span>
                        <span className="capitalize">{category}</span>
                        <span className="ml-auto text-amber-400 flex items-center gap-1">
                          <Star className="w-3 h-3 fill-amber-400" />
                          <span>{rating || 4.8}</span>
                        </span>
                      </div>

                      <h4 className="text-sm font-bold text-white line-clamp-2 leading-snug">
                        {title || 'Your Product Title Will Appear Here'}
                      </h4>

                      <p className="text-xs text-zinc-400 line-clamp-2 leading-relaxed">
                        {shortDescription || 'Short overview hook describing the key selling points...'}
                      </p>

                      <div className="pt-3 border-t border-zinc-800/80">
                        <span className="text-[10px] text-zinc-500 uppercase font-mono tracking-wider block">Best Price</span>
                        <div className="flex items-baseline gap-2 mt-0.5">
                          <span className="text-xl font-extrabold text-white font-mono">
                            {formatCurrency(effectivePrice)}
                          </span>
                          {typeof originalPrice === 'number' && originalPrice > effectivePrice && (
                            <span className="text-xs text-zinc-500 line-through font-mono">
                              {formatCurrency(originalPrice)}
                            </span>
                          )}
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-2 pt-1 text-[11px] font-mono">
                        <div className="p-2 bg-amber-500/10 text-amber-400 rounded-xl text-center border border-amber-500/20 font-semibold">
                          Amazon Ready
                        </div>
                        <div className="p-2 bg-cyan-500/10 text-cyan-400 rounded-xl text-center border border-cyan-500/20 font-semibold">
                          Flipkart Ready
                        </div>
                      </div>
                    </div>
                  </div>

                  <p className="text-[11px] text-zinc-500 text-center leading-relaxed">
                    Live reflection of how the card appears on the storefront.
                  </p>
                </div>

              </div>

            </div>
          )}

          {/* TAB 3: BACKUP, EXPORT & RESET */}
          {activeTab === 'data' && (
            <div className="space-y-6 max-w-3xl mx-auto">
              
              <div className="border-b border-zinc-800 pb-3">
                <h4 className="text-sm font-bold text-white font-mono">
                  Catalog Backup, Import &amp; Database Settings
                </h4>
                <p className="text-xs text-zinc-400 mt-0.5">
                  Monitor MongoDB Atlas cluster connectivity, export offline backups, or import products in bulk.
                </p>
              </div>

              {/* Action: MongoDB Atlas Connection Status */}
              <div className="p-5 rounded-2xl bg-zinc-900/60 border border-zinc-800 space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="flex items-center gap-2.5">
                    <Database className="w-5 h-5 text-emerald-400" />
                    <div>
                      <h5 className="text-xs font-bold text-white font-mono flex items-center gap-2">
                        MongoDB Atlas Database
                        {dbStatus?.isAtlasConnected ? (
                          <span className="px-2 py-0.5 rounded-full text-[10px] bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-sans">
                            ● Connected to Atlas
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 rounded-full text-[10px] bg-amber-500/10 text-amber-400 border border-amber-500/20 font-sans">
                            ● Local Fallback (Set MONGODB_URI)
                          </span>
                        )}
                      </h5>
                      <p className="text-[11px] text-zinc-400 mt-0.5">
                        {dbStatus?.isAtlasConnected
                          ? `Database: "${dbStatus.dbName}" · Collection: "${dbStatus.collection}" · ${dbStatus.count} documents`
                          : 'Operating with persistent client-server sync. Configure MONGODB_URI to link your Atlas cloud cluster.'}
                      </p>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={async () => {
                      await refreshDbStatus();
                      showToast('Checked MongoDB connection status', 'info');
                    }}
                    className="px-3.5 py-1.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded-xl text-xs font-mono font-medium transition-colors cursor-pointer shrink-0 border border-zinc-700 flex items-center gap-1.5"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${isDbSyncing ? 'animate-spin' : ''}`} />
                    <span>Check Connection</span>
                  </button>
                </div>

                {!dbStatus?.isAtlasConnected && (
                  <div className="p-3 bg-zinc-950/70 border border-zinc-850 rounded-xl text-[11px] font-mono text-zinc-400 space-y-1">
                    <div className="text-zinc-300 font-semibold">How to connect MongoDB Atlas:</div>
                    <div>1. Obtain your cluster connection string from MongoDB Atlas console.</div>
                    <div>2. Add to your environment or <code className="text-amber-400">.env</code> file:</div>
                    <div className="text-zinc-500 break-all select-all bg-black/40 p-1.5 rounded">
                      MONGODB_URI="mongodb+srv://&lt;username&gt;:&lt;password&gt;@cluster0.abcde.mongodb.net/nexusgear?retryWrites=true&amp;w=majority"
                    </div>
                  </div>
                )}
              </div>

              {/* Action 1: Export */}
              <div className="p-5 rounded-2xl bg-zinc-900/60 border border-zinc-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <Download className="w-4 h-4 text-emerald-400" />
                    <h5 className="text-xs font-bold text-white font-mono">Export Catalog JSON File</h5>
                  </div>
                  <p className="text-xs text-zinc-400">
                    Download an offline backup of all {products.length} products with complete specs, prices, and links.
                  </p>
                </div>
                <button
                  onClick={() => {
                    const json = exportCatalogJson();
                    const blob = new Blob([json], { type: 'application/json' });
                    const url = URL.createObjectURL(blob);
                    const a = document.createElement('a');
                    a.href = url;
                    a.download = `nexusgear-catalog-${new Date().toISOString().slice(0, 10)}.json`;
                    a.click();
                    showToast('Catalog downloaded successfully!', 'success');
                  }}
                  className="px-4 py-2.5 bg-zinc-800 hover:bg-zinc-700 text-white rounded-xl text-xs font-bold font-mono transition-colors cursor-pointer shrink-0 border border-zinc-700"
                >
                  Download JSON ({products.length} items)
                </button>
              </div>

              {/* Action 2: Import from File or Paste */}
              <div className="p-5 rounded-2xl bg-zinc-900/60 border border-zinc-800 space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Upload className="w-4 h-4 text-amber-400" />
                    <h5 className="text-xs font-bold text-white font-mono">Import Products Catalog</h5>
                  </div>
                  
                  {/* File Upload Input */}
                  <input
                    type="file"
                    ref={fileInputRef}
                    accept=".json,application/json"
                    onChange={handleFileUpload}
                    className="hidden"
                  />
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="px-3.5 py-1.5 bg-zinc-800 hover:bg-zinc-700 text-amber-400 border border-zinc-700 rounded-lg text-xs font-mono font-medium transition-colors cursor-pointer"
                  >
                    Select .JSON File
                  </button>
                </div>

                <p className="text-xs text-zinc-400">
                  Select a JSON backup file from your device, or paste product array JSON directly below.
                </p>

                {importError && (
                  <div className="p-3 bg-rose-950/40 border border-rose-800 text-rose-300 text-xs rounded-xl flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
                    <span>{importError}</span>
                  </div>
                )}

                <textarea
                  rows={5}
                  placeholder='[ { "id": "item-1", "title": "...", "category": "keyboards", "originalPrice": 14999, ... } ]'
                  value={importJsonText}
                  onChange={(e) => {
                    setImportJsonText(e.target.value);
                    setImportError(null);
                  }}
                  className="w-full p-3 bg-zinc-950 text-xs text-zinc-300 font-mono border border-zinc-800 rounded-xl focus:outline-none focus:border-amber-400"
                />

                <div className="flex items-center justify-between">
                  <span className="text-[11px] text-zinc-500 font-mono">
                    {importJsonText ? `${importJsonText.length} characters ready` : 'No JSON entered'}
                  </span>

                  <button
                    type="button"
                    disabled={!importJsonText.trim()}
                    onClick={() => {
                      if (!importJsonText.trim()) return;
                      const res = importCatalogJson(importJsonText);
                      if (res.success) {
                        setImportJsonText('');
                        setImportError(null);
                        setActiveTab('inventory');
                      } else {
                        setImportError(res.error || 'Failed to import JSON schema.');
                      }
                    }}
                    className="px-5 py-2 bg-amber-500 hover:bg-amber-400 disabled:opacity-50 text-zinc-950 rounded-xl text-xs font-bold font-mono transition-all cursor-pointer shadow-md"
                  >
                    Apply &amp; Import Products
                  </button>
                </div>
              </div>

              {/* Action: Change Admin Password */}
              <div className="p-5 rounded-2xl bg-zinc-900/60 border border-zinc-800 space-y-4">
                <div className="flex items-center gap-2">
                  <KeyRound className="w-4 h-4 text-amber-400" />
                  <h5 className="text-xs font-bold text-white font-mono">Admin Security &amp; Password</h5>
                </div>
                <p className="text-xs text-zinc-400">
                  Update your administrator password. This ensures only authorized users can access the command center.
                </p>

                {passwordError && (
                  <div className="p-3 bg-rose-950/40 border border-rose-800 text-rose-300 text-xs rounded-xl flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
                    <span>{passwordError}</span>
                  </div>
                )}

                <form onSubmit={handleUpdatePassword} className="space-y-3 max-w-md">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <label className="text-[11px] text-zinc-400 font-mono">New Password</label>
                      <input
                        type="password"
                        required
                        placeholder="••••••••"
                        value={newPasswordInput}
                        onChange={(e) => setNewPasswordInput(e.target.value)}
                        className="w-full px-3 py-2 bg-zinc-950 text-xs text-white border border-zinc-800 rounded-xl focus:outline-none focus:border-amber-400 font-mono"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[11px] text-zinc-400 font-mono">Confirm Password</label>
                      <input
                        type="password"
                        required
                        placeholder="••••••••"
                        value={confirmPasswordInput}
                        onChange={(e) => setConfirmPasswordInput(e.target.value)}
                        className="w-full px-3 py-2 bg-zinc-950 text-xs text-white border border-zinc-800 rounded-xl focus:outline-none focus:border-amber-400 font-mono"
                      />
                    </div>
                  </div>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-amber-400 border border-zinc-700 rounded-xl text-xs font-mono font-bold transition-colors cursor-pointer"
                  >
                    Update Password
                  </button>
                </form>
              </div>

              {/* Action 3: Clear Entire Catalog */}
              <div className="p-5 rounded-2xl bg-rose-950/15 border border-rose-900/40 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <Trash2 className="w-4 h-4 text-rose-400" />
                    <h5 className="text-xs font-bold text-rose-300 font-mono">Clear Entire Catalog</h5>
                  </div>
                  <p className="text-xs text-zinc-400 max-w-lg">
                    Permanently deletes all products from the store catalog, giving you a completely blank slate.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setShowResetConfirm(true)}
                  className="px-4 py-2 bg-rose-600 hover:bg-rose-500 text-white rounded-xl text-xs font-bold font-mono transition-colors cursor-pointer shrink-0"
                >
                  Clear All Products
                </button>
              </div>

            </div>
          )}

        </div>

      </div>

      {/* In-App Delete Confirmation Dialog */}
      {productToDelete && (
        <div className="fixed inset-0 z-60 overflow-hidden bg-black/80 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-6 max-w-md w-full shadow-2xl space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-rose-500/10 text-rose-400 flex items-center justify-center border border-rose-500/20">
              <Trash2 className="w-6 h-6" />
            </div>
            <div>
              <h4 className="text-base font-bold text-white font-mono">Delete Product?</h4>
              <p className="text-xs text-zinc-400 mt-1">
                Are you sure you want to delete <span className="text-white font-semibold">"{productToDelete.title}"</span>? This action will remove it from the catalog.
              </p>
            </div>
            <div className="flex items-center justify-end gap-2.5 pt-2">
              <button
                onClick={() => setProductToDelete(null)}
                className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded-xl text-xs font-semibold"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  deleteProduct(productToDelete.id);
                  setProductToDelete(null);
                }}
                className="px-4 py-2 bg-rose-600 hover:bg-rose-500 text-white rounded-xl text-xs font-bold"
              >
                Confirm Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* In-App Factory Reset Confirmation Dialog */}
      {showResetConfirm && (
        <div className="fixed inset-0 z-60 overflow-hidden bg-black/80 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-6 max-w-md w-full shadow-2xl space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-rose-500/10 text-rose-400 flex items-center justify-center border border-rose-500/20">
              <Trash2 className="w-6 h-6" />
            </div>
            <div>
              <h4 className="text-base font-bold text-white font-mono">Clear Entire Catalog?</h4>
              <p className="text-xs text-zinc-400 mt-1">
                This will delete all products from your catalog. You will have a blank catalog ready for new gear.
              </p>
            </div>
            <div className="flex items-center justify-end gap-2.5 pt-2">
              <button
                onClick={() => setShowResetConfirm(false)}
                className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded-xl text-xs font-semibold"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  resetToDefaultCatalog();
                  setShowResetConfirm(false);
                  setActiveTab('inventory');
                }}
                className="px-4 py-2 bg-rose-600 hover:bg-rose-500 text-white rounded-xl text-xs font-bold"
              >
                Yes, Clear All Products
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
