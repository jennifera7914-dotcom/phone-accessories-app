import React, { useState, useEffect } from 'react';
import { View, Text, FlatList, TouchableOpacity, Image, StyleSheet, ActivityIndicator } from 'react-native';
import { productService } from '../services/productService';
import { COLORS } from '../constants/colors';

export default function ProductsScreen({ route, navigation }) {
  const { category } = route.params || {};
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [sortBy, setSortBy] = useState('newest');

  useEffect(() => {
    fetchProducts();
  }, [category, sortBy]);

  const fetchProducts = async () => {
    try {
      setLoading(true);
      const data = await productService.getAllProducts({
        category: category,
        sort: sortBy,
      });
      setProducts(data);
      setLoading(false);
    } catch (err) {
      console.log(err);
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color={COLORS.primary} />
      </View>
    );
  }

  const ProductCard = ({ item }) => (
    <TouchableOpacity
      style={styles.productCard}
      onPress={() => navigation.navigate('ProductDetail', { productId: item.id })}
    >
      <View style={styles.imageWrapper}>
        <Image source={{ uri: item.image }} style={styles.productImage} />
      </View>
      <Text style={styles.productName} numberOfLines={2}>{item.name}</Text>
      <View style={styles.priceRow}>
        <Text style={styles.currentPrice}>₹{item.price}</Text>
        <Text style={styles.originalPrice}>₹{item.mrp}</Text>
      </View>
      <Text style={styles.rating}>⭐ {item.rating}</Text>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>{category || 'All Products'}</Text>
        <Text style={styles.headerSubtitle}>{products.length} products</Text>
      </View>

      {/* Sort Buttons */}
      <View style={styles.sortContainer}>
        {[
          { key: 'newest', label: '🆕 Newest' },
          { key: 'price-low', label: '💰 Low Price' },
          { key: 'price-high', label: '💎 High Price' },
          { key: 'rating', label: '⭐ Rating' },
        ].map((option) => (
          <TouchableOpacity
            key={option.key}
            style={[
              styles.sortButton,
              { backgroundColor: sortBy === option.key ? COLORS.primary : COLORS.lightGray },
            ]}
            onPress={() => setSortBy(option.key)}
          >
            <Text
              style={[
                styles.sortButtonText,
                { color: sortBy === option.key ? 'white' : COLORS.textPrimary },
              ]}
            >
              {option.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Products Grid */}
      {products.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>No products found</Text>
        </View>
      ) : (
        <FlatList
          data={products}
          keyExtractor={(item) => item.id.toString()}
          renderItem={({ item }) => <ProductCard item={item} />}
          numColumns={2}
          columnWrapperStyle={styles.columnWrapper}
          contentContainerStyle={styles.contentContainer}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  centerContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: COLORS.background },
  header: { backgroundColor: COLORS.primary, paddingHorizontal: 15, paddingVertical: 15 },
  headerTitle: { fontSize: 20, fontWeight: 'bold', color: 'white' },
  headerSubtitle: { fontSize: 12, color: 'rgba(255,255,255,0.7)', marginTop: 4 },
  sortContainer: { paddingHorizontal: 15, paddingVertical: 10, flexDirection: 'row', gap: 8, flexWrap: 'wrap', backgroundColor: 'white', borderBottomWidth: 1, borderBottomColor: COLORS.border },
  sortButton: { paddingHorizontal: 12, paddingVertical: 8, borderRadius: 6 },
  sortButtonText: { fontSize: 12, fontWeight: 'bold' },
  productCard: { flex: 1, margin: 8, backgroundColor: 'white', borderRadius: 8, overflow: 'hidden', borderWidth: 1, borderColor: COLORS.border },
  imageWrapper: { width: '100%', height: 150, backgroundColor: COLORS.lightGray },
  productImage: { width: '100%', height: '100%' },
  productName: { fontSize: 13, fontWeight: 'bold', color: COLORS.textPrimary, padding: 10, paddingBottom: 4 },
  priceRow: { flexDirection: 'row', paddingHorizontal: 10, gap: 5, alignItems: 'center' },
  currentPrice: { fontSize: 14, fontWeight: 'bold', color: COLORS.primary },
  originalPrice: { fontSize: 11, color: COLORS.textSecondary, textDecorationLine: 'line-through' },
  rating: { fontSize: 11, color: COLORS.accent, paddingHorizontal: 10, paddingBottom: 10, fontWeight: '500' },
  columnWrapper: { paddingHorizontal: 8 },
  contentContainer: { paddingBottom: 20 },
  emptyContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  emptyText: { fontSize: 16, color: COLORS.textSecondary },
});