export const API_BASE_URL = 'http://localhost:8080';

export const API_ENDPOINTS = {
  products: '/api/products',
  productDetail: '/api/products/:id',
  relatedProducts: '/api/products/:id/related',
  search: '/api/products/search',
  categoriesAll: '/api/products/categories/all',
  categories: '/api/products/categories',
  uploads: '/api/products/uploads',
};

// Converts "/api/products/uploads/img_123.jpg" into a full image link
export const getImageUrl = (imagePath) => {
  if (!imagePath) return null;
  if (imagePath.startsWith('http://') || imagePath.startsWith('https://') || imagePath.startsWith('data:')) {
    return imagePath;
  }
  return `${API_BASE_URL}${imagePath.startsWith('/') ? '' : '/'}${imagePath}`;
};