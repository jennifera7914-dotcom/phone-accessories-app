import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_BASE_URL, API_ENDPOINTS } from '../constants/api';

// ===== LIVE PRODUCT & CATEGORY SERVICE (ZERO FAKE DATA) =====
export const productService = {
  // 1. Get all products (supports category, phoneModel, featured, newArrival, sort)
  getAllProducts: async (filters = {}) => {
    let url = `${API_BASE_URL}${API_ENDPOINTS.products}`;
    const params = [];

    if (filters.category && filters.category !== 'All') {
      params.push(`category=${encodeURIComponent(filters.category)}`);
    }
    if (filters.phoneModel && filters.phoneModel !== 'All') {
      params.push(`phoneModel=${encodeURIComponent(filters.phoneModel)}`);
    }
    if (filters.featured) {
      params.push(`featured=true`);
    }
    if (filters.newArrival) {
      params.push(`newArrival=true`);
    }
    if (filters.sort) {
      params.push(`sort=${encodeURIComponent(filters.sort)}`);
    }
    if (params.length > 0) {
      url += `?` + params.join(`&`);
    }

    const response = await axios.get(url, { timeout: 8000 });
    return Array.isArray(response.data) ? response.data : [];
  },

  // 2. Get single product by ID
  getProductById: async (productId) => {
    const url = `${API_BASE_URL}${API_ENDPOINTS.productDetail.replace(':id', productId)}`;
    const response = await axios.get(url, { timeout: 8000 });
    return response.data;
  },

  // 3. Get related products
  getRelatedProducts: async (productId) => {
    try {
      const url = `${API_BASE_URL}${API_ENDPOINTS.relatedProducts.replace(':id', productId)}`;
      const response = await axios.get(url, { timeout: 8000 });
      return Array.isArray(response.data) ? response.data : [];
    } catch (e) {
      return [];
    }
  },

  // 4. Search products live from DB
  searchProducts: async (query) => {
    const url = `${API_BASE_URL}${API_ENDPOINTS.search}?q=${encodeURIComponent(query || '')}`;
    const response = await axios.get(url, { timeout: 8000 });
    return Array.isArray(response.data) ? response.data : [];
  },

  // 5. Get live categories from DB
  getCategories: async () => {
    const response = await axios.get(`${API_BASE_URL}${API_ENDPOINTS.categoriesAll}`, { timeout: 8000 });
    return Array.isArray(response.data) ? response.data : [];
  },

  // 6. Add a new category (Admin)
  createCategory: async (name, icon = '📱') => {
    const response = await axios.post(
      `${API_BASE_URL}${API_ENDPOINTS.categories}`,
      { name, icon },
      { timeout: 8000 }
    );
    return response.data;
  },

  // 7. Delete a category (Admin)
  deleteCategory: async (id) => {
    const response = await axios.delete(`${API_BASE_URL}${API_ENDPOINTS.categories}/${id}`, {
      timeout: 8000,
    });
    return response.data;
  },

  // 8. Upload a real image file from Laptop or Phone to Backend /uploads folder
  uploadImage: async (asset) => {
    let base64Data = asset.base64 || null;
    let fileName = asset.fileName || 'product.jpg';

    // Compress & convert cleanly on Web browser so even large photos upload fast
    if (typeof document !== 'undefined' && asset.uri) {
      try {
        base64Data = await new Promise((resolve, reject) => {
          const img = new window.Image();
          img.crossOrigin = 'Anonymous';
          img.onload = () => {
            const maxDim = 1000;
            let w = img.width;
            let h = img.height;
            if (w > maxDim || h > maxDim) {
              if (w > h) {
                h = Math.round((h * maxDim) / w);
                w = maxDim;
              } else {
                w = Math.round((w * maxDim) / h);
                h = maxDim;
              }
            }
            const canvas = document.createElement('canvas');
            canvas.width = w;
            canvas.height = h;
            const ctx = canvas.getContext('2d');
            ctx.drawImage(img, 0, 0, w, h);
            resolve(canvas.toDataURL('image/jpeg', 0.82));
          };
          img.onerror = reject;
          img.src = asset.uri;
        });
        fileName = 'upload.jpg';
      } catch (err) {
        if (asset.uri.startsWith('data:')) {
          base64Data = asset.uri;
        }
      }
    }

    const response = await axios.post(
      `${API_BASE_URL}${API_ENDPOINTS.uploads}`,
      { base64: base64Data, fileName },
      { timeout: 20000 }
    );
    return response.data.imageUrl; // returns "/api/products/uploads/img_xxxx.jpg"
  },

  // 9. Create Product (Admin)
  createProduct: async (data) => {
    const res = await axios.post(`${API_BASE_URL}${API_ENDPOINTS.products}`, data, { timeout: 8000 });
    return res.data;
  },

  // 10. Update Product (Admin)
  updateProduct: async (id, data) => {
    const res = await axios.put(`${API_BASE_URL}${API_ENDPOINTS.products}/${id}`, data, { timeout: 8000 });
    return res.data;
  },

  // 11. Delete Product (Admin)
  deleteProduct: async (id) => {
    const res = await axios.delete(`${API_BASE_URL}${API_ENDPOINTS.products}/${id}`, { timeout: 8000 });
    return res.data;
  },

  clearCache: async () => {},
};

// ===== CART SERVICE (Kept intact for CartScreen) =====
export const cartService = {
  getCart: async () => {
    try {
      const cart = await AsyncStorage.getItem('cart');
      return cart ? JSON.parse(cart) : [];
    } catch (error) {
      return [];
    }
  },
  addToCart: async (product, quantity = 1) => {
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
      if (item) item.quantity = quantity;
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

// ===== WISHLIST SERVICE (Kept intact) =====
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
      if (!wishlist.find((item) => item.id === product.id)) {
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