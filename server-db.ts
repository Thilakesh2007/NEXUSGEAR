import { MongoClient, Db, Collection } from 'mongodb';

export interface DbProduct {
  id: string;
  title: string;
  brand: string;
  category: 'keyboards' | 'mice' | 'headsets' | 'monitors' | 'controllers' | 'accessories';
  imageUrl: string;
  additionalImages?: string[];
  amazonUrl?: string;
  amazonPrice?: number;
  flipkartUrl?: string;
  flipkartPrice?: number;
  originalPrice: number;
  rating: number;
  reviewCount: number;
  tags: string[];
  specs: Record<string, string>;
  shortDescription?: string;
  fullDescription?: string;
  features?: string[];
  inStock: boolean;
  isDealOfTheDay?: boolean;
  dealEndsAt?: string;
  createdAt?: string;
  updatedAt?: string;
}

let client: MongoClient | null = null;
let db: Db | null = null;
let productsCollection: Collection<DbProduct> | null = null;

let isAtlasConnected = false;
let connectionError: string | null = null;
let inMemoryFallback: DbProduct[] = [];

/**
 * Initializes MongoDB Atlas connection using MONGODB_URI from environment
 */
export async function initMongo(): Promise<void> {
  const uri = process.env.MONGODB_URI;

  if (!uri) {
    connectionError = 'MONGODB_URI environment variable is not defined.';
    console.log('ℹ️  MongoDB Atlas: MONGODB_URI not configured. Operating in fallback persistence mode.');
    return;
  }

  try {
    console.log('🔄 MongoDB Atlas: Connecting to cluster...');
    client = new MongoClient(uri, {
      connectTimeoutMS: 10000,
      serverSelectionTimeoutMS: 10000,
    });

    await client.connect();
    
    // Choose DB name: from URI or default to 'nexusgear'
    const dbName = uri.includes('mongodb.net/') ? uri.split('mongodb.net/')[1]?.split('?')[0] : 'nexusgear';
    db = client.db(dbName || 'nexusgear');
    productsCollection = db.collection<DbProduct>('products');

    // Ensure index on unique product id
    await productsCollection.createIndex({ id: 1 }, { unique: true });

    isAtlasConnected = true;
    connectionError = null;
    console.log(`✅ MongoDB Atlas: Successfully connected to database "${db.databaseName}" and collection "products"`);
  } catch (err: any) {
    isAtlasConnected = false;
    connectionError = err.message || 'Failed to connect to MongoDB Atlas';
    console.error('⚠️  MongoDB Atlas Connection Error:', connectionError);
  }
}

/**
 * Returns connection diagnostic status
 */
export async function getDbStatus() {
  let count = 0;
  if (isAtlasConnected && productsCollection) {
    try {
      count = await productsCollection.countDocuments();
    } catch {
      count = 0;
    }
  } else {
    count = inMemoryFallback.length;
  }

  return {
    isAtlasConnected,
    databaseType: isAtlasConnected ? 'MongoDB Atlas' : 'Local Fallback',
    dbName: db?.databaseName || 'nexusgear',
    collection: 'products',
    count,
    uriConfigured: Boolean(process.env.MONGODB_URI),
    error: connectionError,
  };
}

/**
 * Retrieves all products from MongoDB Atlas or fallback
 */
export async function getAllProducts(): Promise<DbProduct[]> {
  if (isAtlasConnected && productsCollection) {
    try {
      const docs = await productsCollection.find({}).toArray();
      // Remove Mongo _id before returning
      return docs.map(({ _id, ...rest }: any) => rest);
    } catch (err) {
      console.error('Error fetching from MongoDB Atlas:', err);
    }
  }
  return inMemoryFallback;
}

/**
 * Upserts a product into MongoDB Atlas
 */
export async function saveProduct(product: DbProduct): Promise<DbProduct> {
  const timestamp = new Date().toISOString();
  const productWithTimestamps = {
    ...product,
    updatedAt: timestamp,
    createdAt: product.createdAt || timestamp,
  };

  if (isAtlasConnected && productsCollection) {
    try {
      await productsCollection.updateOne(
        { id: product.id },
        { $set: productWithTimestamps },
        { upsert: true }
      );
      return productWithTimestamps;
    } catch (err) {
      console.error('Error saving to MongoDB Atlas:', err);
    }
  }

  // Fallback storage
  const existingIdx = inMemoryFallback.findIndex((p) => p.id === product.id);
  if (existingIdx >= 0) {
    inMemoryFallback[existingIdx] = productWithTimestamps;
  } else {
    inMemoryFallback.push(productWithTimestamps);
  }

  return productWithTimestamps;
}

/**
 * Deletes a product by ID from MongoDB Atlas
 */
export async function deleteProductById(id: string): Promise<boolean> {
  if (isAtlasConnected && productsCollection) {
    try {
      const res = await productsCollection.deleteOne({ id });
      return (res.deletedCount ?? 0) > 0;
    } catch (err) {
      console.error('Error deleting from MongoDB Atlas:', err);
    }
  }

  const initialLen = inMemoryFallback.length;
  inMemoryFallback = inMemoryFallback.filter((p) => p.id !== id);
  return inMemoryFallback.length < initialLen;
}

/**
 * Bulk imports products or replaces catalog
 */
export async function saveBatchProducts(products: DbProduct[], replaceAll = false): Promise<DbProduct[]> {
  if (isAtlasConnected && productsCollection) {
    try {
      if (replaceAll) {
        await productsCollection.deleteMany({});
      }

      if (products.length > 0) {
        const operations = products.map((p) => ({
          updateOne: {
            filter: { id: p.id },
            update: { $set: { ...p, updatedAt: new Date().toISOString() } },
            upsert: true,
          },
        }));
        await productsCollection.bulkWrite(operations);
      }

      const all = await productsCollection.find({}).toArray();
      return all.map(({ _id, ...rest }: any) => rest);
    } catch (err) {
      console.error('Error bulk writing to MongoDB Atlas:', err);
    }
  }

  if (replaceAll) {
    inMemoryFallback = [...products];
  } else {
    for (const p of products) {
      const idx = inMemoryFallback.findIndex((item) => item.id === p.id);
      if (idx >= 0) inMemoryFallback[idx] = p;
      else inMemoryFallback.push(p);
    }
  }

  return inMemoryFallback;
}

/**
 * Clears all products from MongoDB Atlas
 */
export async function clearAllProducts(): Promise<void> {
  if (isAtlasConnected && productsCollection) {
    try {
      await productsCollection.deleteMany({});
    } catch (err) {
      console.error('Error clearing MongoDB Atlas collection:', err);
    }
  }
  inMemoryFallback = [];
}
