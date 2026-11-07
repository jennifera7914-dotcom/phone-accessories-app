import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  ScrollView,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  StyleSheet,
} from 'react-native';
import { productService } from '../services/productService';
import { getImageUrl } from '../constants/api';

export default function SearchScreen({ navigation }) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [searched, setSearched] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSearch = async (text) => {
    setQuery(text);
    if (!text.trim()) {
      setResults([]);
      setSearched(false);
      return;
    }
    try {
      setLoading(true);
      setSearched(true);
      const data = await productService.searchProducts(text.trim());
      setResults(data);
    } catch (e) {
      setResults([]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.searchBox}>
        <TextInput
          style={styles.input}
          autoFocus
          placeholder="Search product, brand, category, or phone model..."
          value={query}
          onChangeText={handleSearch}
        />
        {query.length > 0 && (
          <TouchableOpacity onPress={() => handleSearch('')} style={styles.clearBtn}>
            <Text style={{ fontWeight: 'bold', color: '#6B7280' }}>✕</Text>
          </TouchableOpacity>
        )}
      </View>

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color="#2563EB" />
        </View>
      ) : !searched ? (
        <View style={styles.center}>
          <Text style={{ fontSize: 40 }}>🔎</Text>
          <Text style={styles.hint}>
            Type a product name, category, or phone model (e.g. iPhone 15)
          </Text>
        </View>
      ) : results.length === 0 ? (
        <View style={styles.center}>
          <Text style={{ fontSize: 40 }}>😕</Text>
          <Text style={styles.hint}>No matching accessories found for "{query}"</Text>
        </View>
      ) : (
        <ScrollView contentContainerStyle={{ padding: 14 }}>
          <Text style={styles.countText}>Found {results.length} result(s)</Text>
          {results.map((item) => {
            const imgUri = getImageUrl(item.image1);
            return (
              <TouchableOpacity
                key={item.id}
                style={styles.resultRow}
                onPress={() =>
                  navigation.navigate('ProductDetail', { productId: item.id, product: item })
                }
              >
                {imgUri ? (
                  <Image source={{ uri: imgUri }} style={styles.thumb} />
                ) : (
                  <View style={[styles.thumb, styles.noThumb]}>
                    <Text style={{ fontSize: 22 }}>📱</Text>
                  </View>
                )}
                <View style={{ flex: 1 }}>
                  <Text style={styles.name}>{item.name}</Text>
                  <Text style={styles.meta}>
                    {item.category}
                  </Text>
                  <Text style={styles.mrp}>MRP: ₹{item.mrp ?? item.price}</Text>
                </View>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F3F4F6' },
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    padding: 12,
    borderBottomWidth: 1,
    borderColor: '#E5E7EB',
  },
  input: {
    flex: 1,
    backgroundColor: '#F3F4F6',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 10,
    fontSize: 14,
  },
  clearBtn: { paddingHorizontal: 12 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 24 },
  hint: { color: '#6B7280', fontSize: 14, marginTop: 10, textAlign: 'center' },
  countText: { fontSize: 13, fontWeight: '600', color: '#4B5563', marginBottom: 10 },
  resultRow: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    padding: 12,
    borderRadius: 10,
    marginBottom: 10,
    gap: 12,
    alignItems: 'center',
  },
  thumb: { width: 64, height: 64, borderRadius: 8, backgroundColor: '#F9FAFB' },
  noThumb: { justifyContent: 'center', alignItems: 'center' },
  name: { fontSize: 15, fontWeight: 'bold', color: '#111827' },
  meta: { fontSize: 12, color: '#6B7280', marginTop: 2 },
  mrp: { fontSize: 15, fontWeight: 'bold', color: '#111827', marginTop: 4 },
});