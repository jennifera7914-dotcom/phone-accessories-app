import { useNavigation } from '@react-navigation/native';
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Image,
  FlatList,
  StyleSheet,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { productService } from '../services/productService';
import { COLORS } from '../constants/colors';

export default function HomeScreen({ navigation }) {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [sortBy, setSortBy] = useState('newest');

  useEffect(() => {
    fetchInitialData();
  }, []);

  useEffect(() => {
    fetchProducts();
  }, [selectedCategory, sortBy]);

  const fetchInitialData = async () => {
    try {
      setLoading(true);
      const cats = await productService.getCategories();
      setCategories(cats);
      setLoading(false);
    } catch (err) {
      setLoading(false);
    }
  };

  const fetchProducts = async () => {
    try {
      const data = await productService.getAllProducts({
        category: selectedCategory,
        sort: sortBy,
      });
      setProducts(data);
    } catch (err) {
      console.log(err);
    }
  };

  const onRefresh = async () => {
    try {
      setRefreshing(true);
      await productService.clearCache();
      await fetchInitialData();
      await fetchProducts();
      setRefreshing(false);
    } catch (err) {
      setRefreshing(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color={COLORS.primary} />
        <Text style={styles.loadingText}>Loading products...</Text>
      </View>
    );
  }

  const ProductCard = ({ item }) => (
    <TouchableOpacity
      style={styles.productCard}
      activeOpacity={0.8}
      onPress={() => navigation.navigate('ProductDetail', { productId: item.id })}
    >
      <View style={styles.imageWrapper}>
        <Image
          source={{ uri: item.image1 }}
          style={styles.productImage}
          resizeMode="cover"
        />
        <View style={[styles.statusBadge, { backgroundColor: getStatusColor(item.status) }]}>
          <Text style={styles.statusText}>{getStatusLabel(item.status)}</Text>
        </View>
        {item.mrp > item.price && (
          <View style={styles.discountBadge}>
            <Text style={styles.discountText}>
              {Math.round(((item.mrp - item.price) / item.mrp) * 100)}%
            </Text>
          </View>
        )}
      </View>

      <View style={styles.cardContent}>
        <Text style={styles.productName} numberOfLines={2}>
          {item.name}
        </Text>

        <View style={styles.priceContainer}>
          <Text style={styles.currentPrice}>₹{item.price}</Text>
          <Text style={styles.originalPrice}>₹{item.mrp}</Text>
        </View>

        {item.rating && (
          <View style={styles.ratingContainer}>
            <Text style={styles.rating}>⭐ {item.rating}</Text>
          </View>
        )}
      </View>
    </TouchableOpacity>
  );
  
  const nav = useNavigation();
  return (
    <ScrollView
      style={styles.container}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      showsVerticalScrollIndicator={false}
    >
      {/* BANNER */}
      <View style={styles.banner}>
        <Text style={styles.bannerTitle}>🛍️ Phone Accessories</Text>
        <Text style={styles.bannerSubtitle}>Premium quality, bulk pricing</Text>
      </View>

      <TouchableOpacity
  onPress={() => nav.navigate('AdminProducts')}
  style={{ alignSelf: 'flex-end', backgroundColor: '#222', paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20, margin: 10 }}
>
  <Text style={{ color: '#fff', fontWeight: 'bold' }}>⚙ Admin</Text>
</TouchableOpacity>

      {/* SEARCH BAR */}
      <TouchableOpacity
        style={styles.searchBar}
        activeOpacity={0.7}
        onPress={() => navigation.navigate('Search')}
      >
        <Text style={styles.searchText}>🔍 Search products...</Text>
      </TouchableOpacity>

      {/* CATEGORIES */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Categories</Text>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.categoriesScroll}
        >
          <TouchableOpacity
            style={[
              styles.categoryChip,
              selectedCategory === null && styles.categoryChipActive,
            ]}
            onPress={() => setSelectedCategory(null)}
          >
            <Text
              style={[
                styles.categoryChipText,
                selectedCategory === null && styles.categoryChipTextActive,
              ]}
            >
              All
            </Text>
          </TouchableOpacity>

          {categories.map((cat) => (
            <TouchableOpacity
              key={cat.id}
              style={[
                styles.categoryChip,
                selectedCategory === cat.name && styles.categoryChipActive,
              ]}
              onPress={() => setSelectedCategory(cat.name)}
            >
              <Text
                style={[
                  styles.categoryChipText,
                  selectedCategory === cat.name && styles.categoryChipTextActive,
                ]}
              >
                {cat.name}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* FILTERS */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Sort By</Text>
        <View style={styles.filterContainer}>
          {[
            { key: 'newest', label: '🆕 Newest' },
            { key: 'price-low', label: '💰 Low to High' },
            { key: 'price-high', label: '💎 High to Low' },
          ].map((option) => (
            <TouchableOpacity
              key={option.key}
              style={[
                styles.filterButton,
                sortBy === option.key && styles.filterButtonActive,
              ]}
              onPress={() => setSortBy(option.key)}
            >
              <Text
                style={[
                  styles.filterButtonText,
                  sortBy === option.key && styles.filterButtonTextActive,
                ]}
              >
                {option.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* PRODUCTS GRID */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>
          {selectedCategory ? selectedCategory : 'All Products'} ({products.length})
        </Text>

        {products.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>📦 No products available</Text>
          </View>
        ) : (
          <View style={styles.gridContainer}>
            {products.map((item) => (
              <View key={item.id} style={styles.gridItem}>
                <ProductCard item={item} />
              </View>
            ))}
          </View>
        )}
      </View>

      {/* SPACER */}
      <View style={styles.spacer} />
    </ScrollView>
  );
}

const getStatusColor = (status) => {
  switch (status) {
    case 'in-stock':
      return COLORS.success;
    case 'low-stock':
      return '#FFC107';
    case 'out-of-stock':
      return COLORS.danger;
    default:
      return '#999';
  }
};

const getStatusLabel = (status) => {
  switch (status) {
    case 'in-stock':
      return '✅ In Stock';
    case 'low-stock':
      return '⚠️ Low Stock';
    case 'out-of-stock':
      return '❌ Out of Stock';
    default:
      return 'Unknown';
  }
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.background,
  },
  loadingText: {
    marginTop: 10,
    fontSize: 14,
    color: COLORS.textSecondary,
  },
  banner: {
    height: 160,
    backgroundColor: COLORS.primary,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  bannerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: 'white',
    textAlign: 'center',
  },
  bannerSubtitle: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.9)',
    marginTop: 6,
  },
  searchBar: {
    backgroundColor: 'white',
    marginHorizontal: 15,
    marginVertical: 15,
    paddingVertical: 12,
    paddingHorizontal: 15,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: COLORS.border,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
  searchText: {
    fontSize: 16,
    color: COLORS.textSecondary,
  },
  section: {
    marginHorizontal: 15,
    marginVertical: 15,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.textPrimary,
    marginBottom: 12,
  },
  categoriesScroll: {
    marginHorizontal: -15,
    paddingHorizontal: 15,
  },
  categoryChip: {
    backgroundColor: 'white',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    marginRight: 10,
    borderWidth: 1.5,
    borderColor: COLORS.border,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 1,
  },
  categoryChipActive: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  categoryChipText: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.textPrimary,
  },
  categoryChipTextActive: {
    color: 'white',
  },
  filterContainer: {
    flexDirection: 'row',
    gap: 8,
    flexWrap: 'wrap',
  },
  filterButton: {
    backgroundColor: 'white',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: COLORS.border,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 2,
    elevation: 1,
  },
  filterButtonActive: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  filterButtonText: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.textPrimary,
  },
  filterButtonTextActive: {
    color: 'white',
  },
  gridContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  gridItem: {
    width: '48%',
    marginBottom: 15,
  },
  productCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: COLORS.border,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  imageWrapper: {
    width: '100%',
    height: 160,
    backgroundColor: COLORS.lightGray,
    position: 'relative',
    overflow: 'hidden',
  },
  productImage: {
    width: '100%',
    height: '100%',
  },
  statusBadge: {
    position: 'absolute',
    top: 8,
    right: 8,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    elevation: 2,
  },
  statusText: {
    color: 'white',
    fontSize: 10,
    fontWeight: 'bold',
  },
  discountBadge: {
    position: 'absolute',
    top: 8,
    left: 8,
    backgroundColor: COLORS.danger,
    width: 45,
    height: 45,
    borderRadius: 50,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    elevation: 2,
  },
  discountText: {
    color: 'white',
    fontSize: 12,
    fontWeight: 'bold',
  },
  cardContent: {
    padding: 10,
  },
  productName: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.textPrimary,
    height: 35,
  },
  priceContainer: {
    flexDirection: 'row',
    paddingTop: 8,
    gap: 8,
    alignItems: 'center',
  },
  currentPrice: {
    fontSize: 14,
    fontWeight: 'bold',
    color: COLORS.primary,
  },
  originalPrice: {
    fontSize: 11,
    color: COLORS.textSecondary,
    textDecorationLine: 'line-through',
  },
  ratingContainer: {
    marginTop: 6,
  },
  rating: {
    fontSize: 11,
    color: COLORS.accent,
    fontWeight: '600',
  },
  emptyContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyText: {
    fontSize: 16,
    color: COLORS.textSecondary,
  },
  spacer: {
    height: 30,
  },
});