import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  FlatList,
  TouchableOpacity,
  Image,
  StyleSheet,
} from 'react-native';
import { productService } from '../services/productService';
import { COLORS } from '../constants/colors';

export default function SearchScreen({ navigation }) {
  const [searchText, setSearchText] = useState('');
  const [results, setResults] = useState([]);

  const handleSearch = async (text) => {
    setSearchText(text);

    if (text.length < 1) {
      setResults([]);
      return;
    }

    const data = await productService.searchProducts(text);
    setResults(data);
  };

  return (
    <View style={styles.container}>
      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <TextInput
          placeholder="Search products..."
          placeholderTextColor={COLORS.textSecondary}
          value={searchText}
          onChangeText={handleSearch}
          style={styles.searchInput}
          autoFocus
        />
      </View>

      {/* Results */}
      {searchText.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>🔍 Search for products</Text>
          <Text style={styles.emptySubtext}>Try: "case", "charger", "cable"</Text>
        </View>
      ) : results.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>❌ No results found</Text>
          <Text style={styles.emptySubtext}>Try a different search</Text>
        </View>
      ) : (
        <FlatList
          data={results}
          keyExtractor={(item) => item.id.toString()}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={styles.resultItem}
              onPress={() => navigation.navigate('ProductDetail', { productId: item.id })}
            >
              <Image source={{ uri: item.image1 }} style={styles.resultImage} />
              <View style={styles.resultInfo}>
                <Text style={styles.resultName}>{item.name}</Text>
                <Text style={styles.resultPrice}>₹{item.price}</Text>
              </View>
              <Text style={styles.arrow}>›</Text>
            </TouchableOpacity>
          )}
          showsVerticalScrollIndicator={false}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  searchContainer: {
    paddingHorizontal: 15,
    paddingVertical: 10,
    backgroundColor: COLORS.primary,
  },
  searchInput: {
    backgroundColor: 'white',
    paddingHorizontal: 15,
    paddingVertical: 12,
    borderRadius: 8,
    fontSize: 16,
    color: COLORS.textPrimary,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.textSecondary,
    marginBottom: 6,
  },
  emptySubtext: {
    fontSize: 14,
    color: COLORS.textSecondary,
  },
  resultItem: {
    flexDirection: 'row',
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
    backgroundColor: 'white',
    alignItems: 'center',
  },
  resultImage: {
    width: 80,
    height: 80,
    borderRadius: 8,
    backgroundColor: COLORS.lightGray,
  },
  resultInfo: {
    marginLeft: 12,
    flex: 1,
    justifyContent: 'center',
  },
  resultName: {
    fontSize: 15,
    fontWeight: '600',
    color: COLORS.textPrimary,
  },
  resultPrice: {
    fontSize: 13,
    color: COLORS.primary,
    fontWeight: 'bold',
    marginTop: 4,
  },
  arrow: {
    fontSize: 24,
    color: COLORS.textSecondary,
  },
});