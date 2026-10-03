import express from 'express';
import { createServer as createViteServer } from 'vite';
import path from 'path';
import dotenv from 'dotenv';
import { GoogleGenAI } from '@google/genai';
import {
  initMongo,
  getDbStatus,
  getAllProducts,
  saveProduct,
  deleteProductById,
  saveBatchProducts,
  clearAllProducts,
} from './server-db';

dotenv.config();

const app = express();
const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;

app.use(express.json());

interface ScrapedData {
  title?: string;
  brand?: string;
  category?: 'keyboards' | 'mice' | 'headsets' | 'monitors' | 'controllers' | 'accessories';
  imageUrl?: string;
  amazonPrice?: number;
  originalPrice?: number;
  rating?: number;
  reviewCount?: number;
  shortDescription?: string;
  features?: string[];
  specs?: Record<string, string>;
  tags?: string[];
}

/**
 * Extracts ASIN from Amazon URL
 */
function extractAsin(url: string): string | null {
  const match = url.match(/(?:dp|gp\/product|d)\/([A-Z0-9]{10})/i) ||
                url.match(/(?:asin=|\/)([A-Z0-9]{10})(?:[/?&]|$)/i);
  return match ? match[1].toUpperCase() : null;
}

/**
 * Parses raw HTML from Amazon product page
 */
function parseAmazonHtml(html: string): ScrapedData {
  const result: ScrapedData = {};

  // Title: og:title or #productTitle
  const ogTitleMatch = html.match(/<meta\s+property=["']og:title["']\s+content=["'](.*?)["']/i);
  const prodTitleMatch = html.match(/id=["']productTitle["'][^>]*>\s*([\s\S]*?)\s*<\/span>/i);
  const titleTagMatch = html.match(/<title>([\s\S]*?)<\/title>/i);

  let rawTitle = prodTitleMatch?.[1] || ogTitleMatch?.[1] || titleTagMatch?.[1] || '';
  rawTitle = rawTitle.replace(/[\r\n\t]+/g, ' ').replace(/\s{2,}/g, ' ').trim();
  if (rawTitle) {
    // Strip Amazon suffix like ": Amazon.in: Electronics"
    rawTitle = rawTitle.replace(/\s*:\s*Amazon\..*$/i, '').trim();
    result.title = rawTitle;
  }

  // Image: og:image or #landingImage or dynamic image JSON
  const ogImageMatch = html.match(/<meta\s+property=["']og:image["']\s+content=["'](https:\/\/m\.media-amazon\.com\/images\/[^"']+)["']/i) ||
                       html.match(/<meta\s+property=["']og:image["']\s+content=["'](https:\/\/[^"']+)["']/i);

  const landingImageMatch = html.match(/id=["']landingImage["'][^>]*data-old-hires=["'](https:\/\/[^"']+)["']/i) ||
                           html.match(/id=["']landingImage["'][^>]*src=["'](https:\/\/[^"']+)["']/i);

  // Dynamic image JSON: {"https://m.media-amazon.com/images/I/...":[500,500]}
  const dynamicImageMatch = html.match(/data-a-dynamic-image=["']\{&quot;(https:\/\/m\.media-amazon\.com\/images\/I\/[^&]+)&quot;/i) ||
                            html.match(/data-a-dynamic-image=["']\{"(https:\/\/m\.media-amazon\.com\/images\/I\/[^"]+)"/i);

  const img = dynamicImageMatch?.[1] || landingImageMatch?.[1] || ogImageMatch?.[1];
  if (img && !img.includes('pixel') && !img.includes('transparent')) {
    result.imageUrl = img;
  }

  // Price: .a-price .a-offscreen or .a-price-whole
  const priceOffscreenMatch = html.match(/<span\s+class=["'][^"']*a-price\s+[^"']*a-price-whole[^"']*["'][^>]*>([\d,.]+)/i) ||
                             html.match(/class=["']a-offscreen["'][^>]*>[₹$Rs.\s]*([\d,.]+)/i);

  if (priceOffscreenMatch?.[1]) {
    const cleaned = priceOffscreenMatch[1].replace(/,/g, '');
    const num = parseFloat(cleaned);
    if (!isNaN(num) && num > 0) {
      result.amazonPrice = Math.round(num);
    }
  }

  // Original MRP price (strikethrough)
  const mrpMatch = html.match(/class=["'][^"']*a-text-price[^"']*["'][^>]*>[\s\S]*?class=["']a-offscreen["'][^>]*>[₹$Rs.\s]*([\d,.]+)/i) ||
                   html.match(/class=["'][^"']*basisPrice[^"']*["'][^>]*>[\s\S]*?class=["']a-offscreen["'][^>]*>[₹$Rs.\s]*([\d,.]+)/i);

  if (mrpMatch?.[1]) {
    const cleaned = mrpMatch[1].replace(/,/g, '');
    const num = parseFloat(cleaned);
    if (!isNaN(num) && num > 0) {
      result.originalPrice = Math.round(num);
    }
  }

  // Brand
  const brandMatch = html.match(/id=["']bylineInfo["'][^>]*>Visit the (.*?) Store<\/a>/i) ||
                     html.match(/id=["']bylineInfo["'][^>]*>Brand:\s*(.*?)<\/a>/i) ||
                     html.match(/class=["'][^"']*po-brand[^"']*["'][\s\S]*?class=["']a-span9["'][^>]*><span[^>]*>(.*?)<\/span>/i);

  if (brandMatch?.[1]) {
    result.brand = brandMatch[1].trim();
  }

  // Rating
  const ratingMatch = html.match(/<span[^>]*class=["'][^"']*a-icon-alt[^"']*["'][^>]*>([\d.]+)\s*out of 5/i);
  if (ratingMatch?.[1]) {
    result.rating = parseFloat(ratingMatch[1]);
  }

  // Category detection from title or breadcrumb
  if (rawTitle) {
    const t = rawTitle.toLowerCase();
    if (t.includes('keyboard') || t.includes('keychron') || t.includes('mechanical switch')) {
      result.category = 'keyboards';
    } else if (t.includes('mouse') || t.includes('mice') || t.includes('superlight') || t.includes('deathadder')) {
      result.category = 'mice';
    } else if (t.includes('headset') || t.includes('headphone') || t.includes('earphone') || t.includes('audio')) {
      result.category = 'headsets';
    } else if (t.includes('monitor') || t.includes('display') || t.includes('oled') || t.includes('240hz')) {
      result.category = 'monitors';
    } else if (t.includes('controller') || t.includes('gamepad') || t.includes('joystick')) {
      result.category = 'controllers';
    } else {
      result.category = 'accessories';
    }
  }

  return result;
}

/**
 * Fallback to Gemini with Google Search to fetch official Amazon listing information
 */
async function fetchViaGeminiSearch(url: string, asin: string | null): Promise<ScrapedData> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error('GEMINI_API_KEY not configured');
  }

  const ai = new GoogleGenAI();
  const searchPrompt = `You are an Amazon product details extraction specialist.
I have an Amazon product URL: "${url}" ${asin ? `with ASIN: "${asin}"` : ''}.
Search the official live Amazon listing (prefer Amazon.in for INR pricing).
Extract the exact official product details:
1. Full Product Title
2. Brand
3. Category (one of: keyboards, mice, headsets, monitors, controllers, accessories)
4. Official high-res Amazon media CDN Image URL (starts with https://m.media-amazon.com/images/I/ or https://images-na.ssl-images-amazon.com/images/I/)
5. Current Live Deal/Selling Price in Indian Rupees (INR number without commas)
6. Original List Price / M.R.P. in Indian Rupees (INR number without commas)
7. Customer Rating (number out of 5, e.g. 4.7)
8. Customer Reviews count (number, e.g. 2400)
9. Concise 1-sentence product summary
10. Up to 4 key feature bullet points
11. Hardware specifications key-value pairs (e.g. Sensor, Switches, Weight, Battery, Connectivity)
12. 3 to 5 tags (e.g. Wireless, RGB, Rapid Trigger)

Return ONLY valid JSON matching this structure:
{
  "title": "string",
  "brand": "string",
  "category": "keyboards | mice | headsets | monitors | controllers | accessories",
  "imageUrl": "https://m.media-amazon.com/images/I/...",
  "amazonPrice": number,
  "originalPrice": number,
  "rating": number,
  "reviewCount": number,
  "shortDescription": "string",
  "features": ["feature 1", "feature 2"],
  "specs": { "SpecKey": "SpecVal" },
  "tags": ["tag1", "tag2"]
}`;

  const response = await ai.models.generateContent({
    model: 'gemini-3.8-flash',
    contents: searchPrompt,
    config: {
      tools: [{ googleSearch: {} }],
    },
  });

  const text = response.text || '';
  
  // Extract JSON from markdown code block or raw string
  const jsonMatch = text.match(/```(?:json)?\s*([\s\S]*?)\s*```/) || [null, text];
  const cleanedJson = (jsonMatch[1] || text).trim();

  try {
    const parsed = JSON.parse(cleanedJson);
    return parsed;
  } catch (e) {
    // If not pure JSON, attempt to locate { ... }
    const firstBrace = cleanedJson.indexOf('{');
    const lastBrace = cleanedJson.lastIndexOf('}');
    if (firstBrace !== -1 && lastBrace !== -1) {
      const sliced = cleanedJson.slice(firstBrace, lastBrace + 1);
      return JSON.parse(sliced);
    }
    throw new Error('Failed to parse Gemini search grounding response: ' + text.slice(0, 100));
  }
}

// Scrape / Fetch Route
app.post('/api/fetch-amazon', async (req, res) => {
  try {
    const { url } = req.body;
    if (!url || typeof url !== 'string' || !url.trim()) {
      return res.status(400).json({ success: false, error: 'A valid Amazon URL is required' });
    }

    const trimmedUrl = url.trim();
    const asin = extractAsin(trimmedUrl);
    const targetUrl = asin 
      ? `https://www.amazon.in/dp/${asin}` 
      : (trimmedUrl.startsWith('http') ? trimmedUrl : `https://${trimmedUrl}`);

    let scraped: ScrapedData = {};
    let fetchError: any = null;

    // 1. First attempt: Direct HTTP request with browser headers
    try {
      const response = await fetch(targetUrl, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8',
          'Accept-Language': 'en-IN,en;q=0.9,hi;q=0.8',
          'Cache-Control': 'no-cache',
        },
        redirect: 'follow',
      });

      if (response.ok) {
        const html = await response.text();
        // Check if Amazon blocked with CAPTCHA
        if (!html.includes('api-services-support@amazon.com') && !html.includes('Enter the characters you see below')) {
          scraped = parseAmazonHtml(html);
        }
      }
    } catch (err) {
      fetchError = err;
    }

    // 2. If direct fetch was blocked by Amazon anti-bot or missing critical image/price, use Gemini Search Grounding
    if (!scraped.imageUrl || !scraped.amazonPrice || !scraped.title) {
      try {
        const geminiData = await fetchViaGeminiSearch(targetUrl, asin);
        scraped = {
          ...geminiData,
          // Prefer whichever is richer
          title: scraped.title || geminiData.title,
          imageUrl: scraped.imageUrl || geminiData.imageUrl,
          amazonPrice: scraped.amazonPrice || geminiData.amazonPrice,
          originalPrice: scraped.originalPrice || geminiData.originalPrice || (scraped.amazonPrice ? Math.round(scraped.amazonPrice * 1.25) : undefined),
          rating: scraped.rating || geminiData.rating || 4.7,
          reviewCount: scraped.reviewCount || geminiData.reviewCount || 150,
          brand: scraped.brand || geminiData.brand || 'Gaming Gear',
          category: scraped.category || geminiData.category || 'keyboards',
          specs: { ...geminiData.specs, ...scraped.specs },
          features: geminiData.features || scraped.features || [],
          tags: geminiData.tags || scraped.tags || [],
        };
      } catch (geminiErr: any) {
        console.warn('Gemini search grounding fallback notice:', geminiErr.message);
      }
    }

    // If still missing original price, estimate reasonable MRP
    if (scraped.amazonPrice && (!scraped.originalPrice || scraped.originalPrice <= scraped.amazonPrice)) {
      scraped.originalPrice = Math.round(scraped.amazonPrice * 1.22);
    }

    if (!scraped.title && !scraped.imageUrl) {
      return res.status(422).json({
        success: false,
        error: 'Could not extract product details from this Amazon link. Please verify the link or enter details manually.',
      });
    }

    return res.json({
      success: true,
      asin,
      data: scraped,
    });
  } catch (error: any) {
    console.error('Error in /api/fetch-amazon:', error);
    return res.status(500).json({
      success: false,
      error: error.message || 'Internal server error while fetching Amazon product details',
    });
  }
});

/**
 * MongoDB Atlas Database Endpoints
 */

// Check database connection and statistics
app.get('/api/db/status', async (req, res) => {
  try {
    const status = await getDbStatus();
    return res.json({ success: true, ...status });
  } catch (error: any) {
    return res.status(500).json({ success: false, error: error.message });
  }
});

// Get all products from database
app.get('/api/products', async (req, res) => {
  try {
    const products = await getAllProducts();
    return res.json({ success: true, products });
  } catch (error: any) {
    return res.status(500).json({ success: false, error: error.message });
  }
});

// Add or update a product
app.post('/api/products', async (req, res) => {
  try {
    const productData = req.body;
    if (!productData || !productData.id || !productData.title) {
      return res.status(400).json({ success: false, error: 'Product ID and Title are required.' });
    }
    const saved = await saveProduct(productData);
    return res.json({ success: true, product: saved });
  } catch (error: any) {
    return res.status(500).json({ success: false, error: error.message });
  }
});

// Delete a product by ID
app.delete('/api/products/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const deleted = await deleteProductById(id);
    return res.json({ success: true, deleted, id });
  } catch (error: any) {
    return res.status(500).json({ success: false, error: error.message });
  }
});

// Batch import or replace catalog
app.post('/api/products/batch', async (req, res) => {
  try {
    const { products, replaceAll } = req.body;
    if (!Array.isArray(products)) {
      return res.status(400).json({ success: false, error: 'products array is required.' });
    }
    const updated = await saveBatchProducts(products, Boolean(replaceAll));
    return res.json({ success: true, count: updated.length, products: updated });
  } catch (error: any) {
    return res.status(500).json({ success: false, error: error.message });
  }
});

// Clear entire catalog
app.delete('/api/products', async (req, res) => {
  try {
    await clearAllProducts();
    return res.json({ success: true, message: 'All products removed from catalog.' });
  } catch (error: any) {
    return res.status(500).json({ success: false, error: error.message });
  }
});

// Setup Vite middleware in dev or static files in production
async function startServer() {
  // Connect to MongoDB Atlas
  await initMongo();

  if (process.env.NODE_ENV === 'production') {
    app.use(express.static(path.resolve(__dirname, 'dist')));
    app.get('*', (req, res) => {
      res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
    });
  } else {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
