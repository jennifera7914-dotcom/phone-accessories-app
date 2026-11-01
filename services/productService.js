import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_BASE_URL, API_ENDPOINTS } from '../constants/api';

// ===== FAKE DATA (Fallback if backend unavailable) =====
const FAKE_PRODUCTS = [
  {
    id: 1,
    name: 'iPhone 14 Pro Case',
    mrp: 799,
    price: 499,
    image1: 'https://via.placeholder.com/300?text=iPhone+14+Case+1',
    image2: 'https://via.placeholder.com/300?text=iPhone+14+Case+2',
    description: 'Premium leather-like finish case with shock absorption technology.',
    stock: 45,
    status: 'in-stock',
    category: 'Cases',
    rating: 4.5,
  },
  {
    id: 2,
    name: 'Screen Protector 9H',
    mrp: 399,
    price: 199,
    image1: 'https://via.placeholder.com/300?text=Screen+1',
    image2: 'https://via.placeholder.com/300?text=Screen+2',
    description: '9H hardness tempered glass with oleophobic coating.',
    stock: 120,
    status: 'in-stock',
    category: 'Protectors',
    rating: 4.8,
  },
  {
    id: 3,
    name: 'USB-C 65W Charger',
    mrp: 1499,
    price: 999,
    image1: 'https://via.placeholder.com/300?text=Charger+1',
    image2: 'https://via.placeholder.com/300?text=Charger+2',
    description: 'Ultra-fast 65W USB-C charger. Charges 0-80% in 30 minutes.',
    stock: 8,
    status: 'low-stock',
    category: 'Chargers',
    rating: 4.6,
  },
  {
    id: 4,
    name: 'Lightning Cable 2M',
    mrp: 499,
    price: 299,
    image1: 'https://via.placeholder.com/300?text=Cable+1',
    image2: 'https://via.placeholder.com/300?text=Cable+2',
    description: 'Apple certified lightning cable with 2 meters length.',
    stock: 200,
    status: 'in-stock',
    category: 'Cables',
    rating: 4.7,
  },
  {
    id: 5,
    name: 'Wireless Charger 10W',
    mrp: 1299,
    price: 799,
    image1: 'https://via.placeholder.com/300?text=Wireless+1',
    image2: 'https://via.placeholder.com/300?text=Wireless+2',
    description: 'Qi-certified wireless charger with 10W fast charging.',
    stock: 0,
    status: 'out-of-stock',
    category: 'Chargers',
    rating: 4.4,
  },
  {
    id: 6,
    name: 'Phone Stand Pro',
    mrp: 699,
    price: 399,
    image1: 'https://via.placeholder.com/300?text=Stand+1',
    image2: 'https://via.placeholder.com/300?text=Stand+2',
    description: 'Adjustable phone stand with 360-degree rotation.',
    stock: 35,
    status: 'in-stock',
    category: 'Stands',
    rating: 4.3,
  },
  {
    id: 7,
    name: 'Pop Socket Mandala',
    mrp: 299,
    price: 149,
    image1: 'https://via.placeholder.com/300?text=Pop+1',
    image2: 'https://via.placeholder.com/300?text=Pop+2',
    description: 'Colorful pop socket with mandala design.',
    stock: 150,
    status: 'in-stock',
    category: 'Accessories',
    rating: 4.5,
  },
  {
    id: 8,
    name: 'Samsung Galaxy Case',
    mrp: 899,
    price: 549,
    image1: 'https://via.placeholder.com/300?text=Samsung+1',
    image2: 'https://via.placeholder.com/300?text=Samsung+2',
    description: 'Premium protection case for Samsung Galaxy S23 Ultra.',
    stock: 5,
    status: 'low-stock',
    category: 'Cases',
    rating: 4.6,
  },
  {
    id: 9,
    name: 'Tempered Glass Protector',
    mrp: 449,
    price: 249,
    image1: 'https://via.placeholder.com/300?text=Glass+1',
    image2: 'https://via.placeholder.com/300?text=Glass+2',
    description: '9H hardness glass with 2.5D curved edges.',
    stock: 80,
    status: 'in-stock',
    category: 'Protectors',
    rating: 4.9,
  },
  {
    id: 10,
    name: 'Phone Cleaning Kit',
    mrp: 299,
    price: 149,
    image1: 'https://via.placeholder.com/300?text=Cleaner+1',
    image2: 'https://via.placeholder.com/300?text=Cleaner+2',
    description: 'Complete cleaning kit with cloth, spray, and brush.',
    stock: 100,
    status: 'in-stock',
    category: 'Accessories',
    rating: 4.2,
  },
  {
    id: 11,
    name: 'Type-C Hub',
    mrp: 899,
    price: 599,
    image1: 'https://via.placeholder.com/300?text=Hub+1',
    image2: 'https://via.placeholder.com/300?text=Hub+2',
    description: 'Multi-port USB-C hub with HDMI, USB 3.0, SD card.',
    stock: 25,
    status: 'in-stock',
    category: 'Accessories',
    rating: 4.4,
  },
  {
    id: 12,
    name: 'Phone Ring Holder',
    mrp: 249,
    price: 129,
    image1: 'https://via.placeholder.com/300?text=Ring+1',
    image2: 'https://via.placeholder.com/300?text=Ring+2',
    description: 'Magnetic phone ring holder with 360 rotation.',
    stock: 180,
    status: 'in-stock',
    category: 'Accessories',
    rating: 4.3,
  },
];

// ===== CACHE KEYS =====
const CACHE_KEYS = {
  ALL_PRODUCTS: 'all_products',
  CATEGORIES: 'categories',
  PRODUCT_DETAIL: 'product_detail_',
  CACHE_TIMESTAMP: 'cache_timestamp',
};

const CACHE_DURATION = 60 * 60 * 1000; // 1 hour

// ===== HELPER: Check if cache is still valid =====
const isCacheValid = async () => {
  try {
    const timestamp = await AsyncStorage.getItem(CACHE_KEYS.CACHE_TIMESTAMP);
    if (!timestamp) return false;
    return Date.now() - parseInt(timestamp) < CACHE_DURATION;
  } catch (error) {
    return false;
  }
};

// ===== HELPER: Get cached data =====
const getCachedData = async (key) => {
  try {
    const data = await AsyncStorage.getItem(key);
    return data ? JSON.parse(data) : null;
  } catch (error) {
    console.log('Cache read error:', error);
    return null;
  }
};

// ===== HELPER: Set cached data =====
const setCachedData = async (key, data) => {
  try {
    await AsyncStorage.setItem(key, JSON.stringify(data));
    await AsyncStorage.setItem(CACHE_KEYS.CACHE_TIMESTAMP, Date.now().toString());
  } catch (error) {
    console.log('Cache write error:', error);
  }
};

// ===== PRODUCT SERVICE =====
export const productService = {
  // Get all products with caching
  getAllProducts: async (filters = {}) => {
    try {
      // Try backend first
      let url = `${API_BASE_URL}${API_ENDPOINTS.products}`;
let params = [];
if (filters.category) params.push(`category=${filters.category}`);
if (filters.sort) params.push(`sort=${filters.sort}`);
if (params.length > 0) url += `?` + params.join(`&`);

      const response = await axios.get(url, { timeout: 5000 });
      const data = response.data;

      // Cache successful response
      await setCachedData(CACHE_KEYS.ALL_PRODUCTS, data);
      return data;
    } catch (error) {
      console.log('Backend unavailable, checking cache...');

      // Try cache
      const cached = await getCachedData(CACHE_KEYS.ALL_PRODUCTS);
      if (cached) {
        console.log('Using cached products');
        return cached;
      }

      // Fallback to fake data
      console.log('Using fake data');
      let filtered = FAKE_PRODUCTS;

      if (filters.category) {
        filtered = filtered.filter(
          (p) => p.category.toLowerCase() === filters.category.toLowerCase()
        );
      }

      if (filters.sort === 'price-low') {
        filtered = [...filtered].sort((a, b) => a.price - b.price);
      }
      if (filters.sort === 'price-high') {
        filtered = [...filtered].sort((a, b) => b.price - a.price);
      }

      return filtered;
    }
  },

  // Get single product by ID
  getProductById: async (productId) => {
    try {
      const response = await axios.get(
        `${API_BASE_URL}${API_ENDPOINTS.productDetail.replace(':id', productId)}`,
        { timeout: 5000 }
      );
      await setCachedData(`${CACHE_KEYS.PRODUCT_DETAIL}${productId}`, response.data);
      return response.data;
    } catch (error) {
      // Try cache
      const cached = await getCachedData(`${CACHE_KEYS.PRODUCT_DETAIL}${productId}`);
      if (cached) return cached;

      // Fallback to fake data
      return FAKE_PRODUCTS.find((p) => p.id === productId) || {};
    }
  },

  // Search products
  searchProducts: async (query) => {
    try {
      const response = await axios.get(
        `${API_BASE_URL}${API_ENDPOINTS.search}?q=${query}`,
        { timeout: 5000 }
      );
      return response.data;
    } catch (error) {
      // Search in fake data
      return FAKE_PRODUCTS.filter(
        (p) =>
          p.name.toLowerCase().includes(query.toLowerCase()) ||
          p.category.toLowerCase().includes(query.toLowerCase()) ||
          p.description.toLowerCase().includes(query.toLowerCase())
      );
    }
  },

  // Get categories
  getCategories: async () => {
  try {
    const all = await productService.getAllProducts();
    const names = [...new Set(all.map(p => p.category).filter(Boolean))];
    if (names.length === 0) return [{id:1,name:'Cases'},{id:2,name:'Chargers'}];
    return names.map((name, idx) => ({ id: idx+1, name }));
  } catch(e){ return [{id:1,name:'Cases'}]; }
},

  // Clear cache (for refresh/logout)
  clearCache: async () => {
    try {
      await AsyncStorage.multiRemove([
        CACHE_KEYS.ALL_PRODUCTS,
        CACHE_KEYS.CATEGORIES,
        CACHE_KEYS.CACHE_TIMESTAMP,
      ]);
      console.log('Cache cleared');
    } catch (error) {
      console.log('Cache clear error:', error);
    }
  },
  createProduct: async (data) => {
    const res = await axios.post(`${API_BASE_URL}${API_ENDPOINTS.products}`, data, { timeout: 5000 });
    if (productService.clearCache) await productService.clearCache();
    return res.data;
  },

  updateProduct: async (id, data) => {
    const res = await axios.put(`${API_BASE_URL}${API_ENDPOINTS.products}/${id}`, data, { timeout: 5000 });
    if (productService.clearCache) await productService.clearCache();
    return res.data;
  },

  deleteProduct: async (id) => {
    const res = await axios.delete(`${API_BASE_URL}${API_ENDPOINTS.products}/${id}`, { timeout: 5000 });
    if (productService.clearCache) await productService.clearCache();
    return res.data;
  },  
};

// ===== CART SERVICE (Local storage) =====
export const cartService = {
  getCart: async () => {
    try {
      const cart = await AsyncStorage.getItem('cart');
      return cart ? JSON.parse(cart) : [];
    } catch (error) {
      return [];
    }
  },

  addToCart: async (product, quantity) => {
    try {
      const cart = await cartService.getCart();
      const existingItem = cart.find((item) => item.id === product.id);

      if (existingItem) {
        existingItem.quantity += quantity;
      } else {
        cart.push({ ...product, quantity, addedAt: Date.now() });
      }

      await AsyncStorage.setItem('cart', JSON.stringify(cart));
      return cart;
    } catch (error) {
      console.log('Add to cart error:', error);
      return [];
    }
  },

  removeFromCart: async (productId) => {
    try {
      const cart = await cartService.getCart();
      const filtered = cart.filter((item) => item.id !== productId);
      await AsyncStorage.setItem('cart', JSON.stringify(filtered));
      return filtered;
    } catch (error) {
      return [];
    }
  },

  updateQuantity: async (productId, quantity) => {
    try {
      const cart = await cartService.getCart();
      const item = cart.find((i) => i.id === productId);
      if (item) {
        item.quantity = quantity;
      }
      await AsyncStorage.setItem('cart', JSON.stringify(cart));
      return cart;
    } catch (error) {
      return [];
    }
  },

  clearCart: async () => {
    try {
      await AsyncStorage.removeItem('cart');
      return [];
    } catch (error) {
      return [];
    }
  },
};


// ===== WISHLIST SERVICE (Local storage) =====
export const wishlistService = {
  getWishlist: async () => {
    try {
      const wishlist = await AsyncStorage.getItem('wishlist');
      return wishlist ? JSON.parse(wishlist) : [];
    } catch (error) {
      return [];
    }
  },

  

  addToWishlist: async (product) => {
    try {
      const wishlist = await wishlistService.getWishlist();
      const exists = wishlist.find((item) => item.id === product.id);

      if (!exists) {
        wishlist.push({ ...product, addedAt: Date.now() });
      }

      await AsyncStorage.setItem('wishlist', JSON.stringify(wishlist));
      return wishlist;
    } catch (error) {
      return [];
    }
  },

  removeFromWishlist: async (productId) => {
    try {
      const wishlist = await wishlistService.getWishlist();
      const filtered = wishlist.filter((item) => item.id !== productId);
      await AsyncStorage.setItem('wishlist', JSON.stringify(filtered));
      return filtered;
    } catch (error) {
      return [];
    }
  },

  isInWishlist: async (productId) => {
    try {
      const wishlist = await wishlistService.getWishlist();
      return wishlist.some((item) => item.id === productId);
    } catch (error) {
      return false;
    }
  },
};