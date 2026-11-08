import { BACKEND_URL } from "../api/config";

export const productService = {
  async getAllProducts(options = {}) {
    const response = await fetch(`${BACKEND_URL}/api/products`);

    if (!response.ok) {
      throw new Error(`Products request failed (${response.status})`);
    }

    const products = await response.json();

    if (options.sort === "newest") {
      return [...products].reverse();
    }

    return products;
  },

  async getCategories() {
    const products = await this.getAllProducts();
    return [...new Set(products.map(item => item.category).filter(Boolean))];
  },
};
