import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  StyleSheet,
  RefreshControl,
} from 'react-native';
import { COLORS } from '../constants/colors';
import { productService } from '../services/productService';
import { getImageUrl } from '../constants/api';

const PRIMARY = COLORS?.primary || '#2563EB';

export default function HomeScreen({ navigation }) {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [selectedPhone, setSelectedPhone] = useState('All');
  const [sortBy, setSortBy] = useState('newest');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadDashboard = async (showSpinner = false) => {
    try {
      if (showSpinner) setLoading(true);
      const [prodData, catData] = await Promise.all([
        productService.getAllProducts({ sort: sortBy }),
        productService.getCategories(),
      ]);
      setProducts(prodData);
      setCategories(catData);
    } catch (err) {
      console.log('Error loading live store:', err.message);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  // Auto-reloads IMMEDIATELY whenever you come back from Admin screen!
  useEffect(() => {
    loadDashboard(true);
    const unsubscribe = navigation.addListener('focus', () => {
      loadDashboard(false);
    });
    return unsubscribe;
  }, [navigation, sortBy]);

  // Build Phone Model filter chips dynamically from live products (Idea B)
  const availablePhones = React.useMemo(() => {
    const set = new Set(['All']);
    products.forEach((p) => {
      if (p.compatiblePhones) {
        p.compatiblePhones
          .split(',')
          .map((s) => s.trim())
          .filter(Boolean)
          .forEach((model) => set.add(model));
      }
    });
    return Array.from(set);
  }, [products]);

  // Filter displayed products by selected Phone Model
  const filteredProducts = React.useMemo(() => {
    if (selectedPhone === 'All') return products;
    const target = selectedPhone.toLowerCase();
    return products.filter(
      (p) =>
        p.compatiblePhones &&
        (p.compatiblePhones.toLowerCase().includes(target) ||
          p.compatiblePhones.toLowerCase().includes('universal'))
    );
  }, [products, selectedPhone]);

  const featuredProducts = filteredProducts.filter((p) => p.isFeatured);
  const newArrivalProducts = filteredProducts.filter((p) => p.isNewArrival);

  // Automatic Stock Badge (Idea A)
  const getStockBadge = (qty) => {
    const n = Number(qty ?? 0);
    if (n <= 0) return { label: 'Out of Stock', bg: '#FEE2E2', color: '#DC2626' };
    if (n <= 5) return { label: `Only ${n} left!`, bg: '#FEF3C7', color: '#D97706' };
    return { label: 'In Stock', bg: '#DCFCE7', color: '#16A34A' };
  };

  const renderProductCard = (item, horizontal = false) => {
    const imgUri = getImageUrl(item.image1);
    const stock = getStockBadge(item.stockQty);
    const displayMrp = item.mrp ?? item.price ?? 0;

    return (
      <TouchableOpacity
        key={item.id}
        style={[styles.card, horizontal && styles.horizontalCard]}
        onPress={() =>
          navigation.navigate('ProductDetail', { productId: item.id, product: item })
        }
      >
        <View style={styles.imageBox}>
          {imgUri ? (
            <Image source={{ uri: imgUri }} style={styles.cardImage} />
          ) : (
            <View style={styles.placeholderImg}>
              <Text style={{ fontSize: 34 }}>📱</Text>
            </View>
          )}
          <View style={[styles.stockPill, { backgroundColor: stock.bg }]}>
            <Text style={[styles.stockPillText, { color: stock.color }]}>
              {stock.label}
            </Text>
          </View>
        </View>

        <View style={styles.cardBody}>
          <Text style={styles.brandText} numberOfLines={1}>
            {item.brand || item.category}
          </Text>
          <Text style={styles.productTitle} numberOfLines={2}>
            {item.name}
          </Text>

          {item.compatiblePhones ? (
            <Text style={styles.compatText} numberOfLines={1}>
              📱 {item.compatiblePhones}
            </Text>
          ) : null}

          <View style={styles.priceRow}>
            <Text style={styles.mrpText}>MRP: ₹{displayMrp}</Text>
            {item.rating ? (
              <Text style={styles.ratingText}>⭐ {Number(item.rating).toFixed(1)}</Text>
            ) : null}
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      {/* TOP BAR: SEARCH + ADMIN DASHBOARD BUTTON */}
      <View style={styles.topBar}>
        <TouchableOpacity
          style={styles.searchBarBtn}
          onPress={() => navigation.navigate('Search')}
        >
          <Text style={styles.searchPlaceholder}>🔍 Search cases, chargers, phone models...</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.adminBtn, { backgroundColor: PRIMARY }]}
          onPress={() => navigation.navigate('AdminProducts')}
        >
          <Text style={styles.adminBtnText}>⚙️ Admin</Text>
        </TouchableOpacity>
      </View>

      {loading ? (
        <View style={styles.centerBox}>
          <ActivityIndicator size="large" color={PRIMARY} />
          <Text style={{ marginTop: 10, color: '#6B7280' }}>Loading live store...</Text>
        </View>
      ) : (
        <ScrollView
          contentContainerStyle={{ paddingBottom: 32 }}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={() => {
                setRefreshing(true);
                loadDashboard(false);
              }}
            />
          }
        >
          {/* 1. LIVE CATEGORIES FROM ADMIN */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>📂 Shop by Category</Text>
              <TouchableOpacity
                onPress={() => navigation.navigate('Products', { category: 'All' })}
              >
                <Text style={[styles.seeAll, { color: PRIMARY }]}>View All →</Text>
              </TouchableOpacity>
            </View>

            {categories.length === 0 ? (
              <Text style={styles.emptyHint}>
                No categories yet. Add categories in ⚙️ Admin!
              </Text>
            ) : (
              <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                {categories.map((cat) => (
                  <TouchableOpacity
                    key={cat.id}
                    style={styles.categoryCard}
                    onPress={() =>
                      navigation.navigate('Products', { category: cat.name })
                    }
                  >
                    <Text style={{ fontSize: 26 }}>{cat.icon || '📱'}</Text>
                    <Text style={styles.categoryName}>{cat.name}</Text>
                    <Text style={styles.categoryCount}>{cat.productCount || 0} items</Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            )}
          </View>

          {/* 2. COMPATIBLE PHONE MODEL FILTER BAR (Idea B) */}
          {availablePhones.length > 1 && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>📱 Filter by Your Phone Model</Text>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                style={{ marginTop: 10 }}
              >
                {availablePhones.map((phone) => {
                  const active = selectedPhone === phone;
                  return (
                    <TouchableOpacity
                      key={phone}
                      style={[
                        styles.phoneChip,
                        active && { backgroundColor: PRIMARY, borderColor: PRIMARY },
                      ]}
                      onPress={() => setSelectedPhone(phone)}
                    >
                      <Text
                        style={[
                          styles.phoneChipText,
                          active && { color: '#FFFFFF', fontWeight: 'bold' },
                        ]}
                      >
                        {phone === 'All' ? 'All Phones' : phone}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>
            </View>
          )}

          {/* 3. FEATURED ACCESSORIES (Idea C) */}
          {featuredProducts.length > 0 && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>🔥 Featured Accessories</Text>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                style={{ marginTop: 10 }}
              >
                {featuredProducts.map((item) => renderProductCard(item, true))}
              </ScrollView>
            </View>
          )}

          {/* 4. NEW ARRIVALS (Idea C) */}
          {newArrivalProducts.length > 0 && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>✨ New Arrivals</Text>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                style={{ marginTop: 10 }}
              >
                {newArrivalProducts.map((item) => renderProductCard(item, true))}
              </ScrollView>
            </View>
          )}

          {/* 5. ALL PRODUCTS GRID + QUICK SORT */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>
                🛍️ {selectedPhone === 'All' ? 'All Accessories' : `For ${selectedPhone}`} (
                {filteredProducts.length})
              </Text>
            </View>

            {/* Quick Sort Pills */}
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              style={{ marginBottom: 12 }}
            >
              {[
                { key: 'newest', label: 'Newest' },
                { key: 'price-low', label: 'MRP: Low → High' },
                { key: 'price-high', label: 'MRP: High → Low' },
              ].map((s) => (
                <TouchableOpacity
                  key={s.key}
                  style={[styles.sortPill, sortBy === s.key && styles.sortPillActive]}
                  onPress={() => setSortBy(s.key)}
                >
                  <Text
                    style={[
                      styles.sortPillText,
                      sortBy === s.key && styles.sortPillTextActive,
                    ]}
                  >
                    {s.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>

            {filteredProducts.length === 0 ? (
              <View style={styles.emptyStoreBox}>
                <Text style={{ fontSize: 38 }}>📦</Text>
                <Text style={styles.emptyStoreTitle}>No products found</Text>
                <Text style={styles.emptyStoreSub}>
                  Tap "⚙️ Admin" at the top-right to add categories & products!
                </Text>
              </View>
            ) : (
              <View style={styles.grid}>
                {filteredProducts.map((item) => renderProductCard(item, false))}
              </View>
            )}
          </View>
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F3F4F6' },
  topBar: {
    flexDirection: 'row',
    padding: 12,
    backgroundColor: '#FFFFFF',
    gap: 10,
    alignItems: 'center',
    borderBottomWidth: 1,
    borderColor: '#E5E7EB',
  },
  searchBarBtn: {
    flex: 1,
    backgroundColor: '#F3F4F6',
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  searchPlaceholder: { color: '#6B7280', fontSize: 13 },
  adminBtn: {
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 10,
  },
  adminBtnText: { color: '#FFFFFF', fontWeight: 'bold', fontSize: 13 },
  centerBox: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  section: { marginTop: 16, paddingHorizontal: 14 },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  sectionTitle: { fontSize: 17, fontWeight: 'bold', color: '#111827' },
  seeAll: { fontSize: 13, fontWeight: 'bold' },
  emptyHint: { color: '#6B7280', fontSize: 13, fontStyle: 'italic' },
  categoryCard: {
    backgroundColor: '#FFFFFF',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
    marginRight: 10,
    alignItems: 'center',
    minWidth: 96,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  categoryName: { fontWeight: 'bold', fontSize: 13, color: '#1F2937', marginTop: 6 },
  categoryCount: { fontSize: 11, color: '#6B7280', marginTop: 2 },
  phoneChip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#D1D5DB',
    marginRight: 8,
  },
  phoneChipText: { fontSize: 13, color: '#374151', fontWeight: '500' },
  sortPill: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    backgroundColor: '#E5E7EB',
    marginRight: 8,
  },
  sortPillActive: { backgroundColor: '#111827' },
  sortPillText: { fontSize: 12, color: '#374151', fontWeight: '600' },
  sortPillTextActive: { color: '#FFFFFF' },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  card: {
    width: '48.5%',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    marginBottom: 12,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  horizontalCard: {
    width: 175,
    marginRight: 12,
  },
  imageBox: { width: '100%', height: 145, backgroundColor: '#F9FAFB' },
  cardImage: { width: '100%', height: '100%', resizeMode: 'cover' },
  placeholderImg: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  stockPill: {
    position: 'absolute',
    top: 8,
    left: 8,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  stockPillText: { fontSize: 10, fontWeight: 'bold' },
  cardBody: { padding: 10 },
  brandText: { fontSize: 11, color: '#6B7280', fontWeight: '600', textTransform: 'uppercase' },
  productTitle: { fontSize: 14, fontWeight: 'bold', color: '#111827', marginTop: 2 },
  compatText: { fontSize: 11, color: '#2563EB', marginTop: 4 },
  priceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 8,
  },
  mrpText: { fontSize: 15, fontWeight: 'bold', color: '#111827' },
  ratingText: { fontSize: 12, color: '#D97706', fontWeight: '600' },
  emptyStoreBox: {
    backgroundColor: '#FFFFFF',
    padding: 30,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 6,
  },
  emptyStoreTitle: { fontSize: 16, fontWeight: 'bold', color: '#111827', marginTop: 8 },
  emptyStoreSub: { fontSize: 13, color: '#6B7280', marginTop: 4, textAlign: 'center' },
});