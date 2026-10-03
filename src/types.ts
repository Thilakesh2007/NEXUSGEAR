export type ProductCategory = 
  | 'keyboards' 
  | 'mice' 
  | 'headsets' 
  | 'monitors' 
  | 'controllers' 
  | 'accessories';

export interface Product {
  id: string;
  title: string;
  brand: string;
  category: ProductCategory;
  shortDescription: string;
  fullDescription: string;
  specs: Record<string, string>;
  features: string[];
  imageUrl: string;
  gallery?: string[];
  originalPrice: number; // Stored in base currency (INR)
  amazonPrice?: number;
  amazonUrl?: string;
  flipkartPrice?: number;
  flipkartUrl?: string;
  rating: number;
  reviewCount: number;
  isFeaturedDeal: boolean;
  dealBadge?: string;
  inStock: boolean;
  tags: string[];
  createdAt: string;
}

export interface FilterState {
  category: ProductCategory | 'all';
  searchQuery: string;
  priceRange: [number, number]; // [min, max]
  storeFilter: 'all' | 'amazon' | 'flipkart' | 'both';
  sortBy: 'discount' | 'price-asc' | 'price-desc' | 'rating' | 'newest';
  minDiscount: number; // 0, 15, 30, 50%
  onlyInStock: boolean;
  selectedTags: string[];
}

export interface DbStatus {
  isAtlasConnected: boolean;
  databaseType: string;
  dbName: string;
  collection: string;
  count: number;
  uriConfigured: boolean;
  error?: string | null;
}

