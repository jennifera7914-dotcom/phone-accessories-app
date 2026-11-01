import { useEffect, useState } from 'react';
import { View, Text, FlatList, Image, StyleSheet, ActivityIndicator } from 'react-native';
import { productService } from '../../services/productService';

export default function Index() {
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [source, setSource] = useState('loading...');

  useEffect(() => {
    productService.getAllProducts()
      .then((data: any) => {
        console.log('✅ Backend connected, products from DB:', data.length, data);
        setProducts(data);
        // If data has Test Cover from MySQL, it is from backend. If iPhone 14 Case, it is FAKE fallback.
        if (data.length > 0 && data[0].name === 'Test Cover') {
          setSource('✅ LIVE from MySQL Backend');
        } else {
          setSource('⚠️ FAKE data (backend empty/unreachable)');
        }
        setLoading(false);
      })
      .catch((err: any) => {
        console.log('Backend error:', err.message);
        setLoading(false);
      });
  }, []);

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" />
        <Text>Loading products...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.header}>🛍️ Mobile Shop</Text>
      <Text style={styles.source}>{source}</Text>
      <FlatList
        data={products}
        numColumns={2}
        keyExtractor={(item: any, idx: number) => (item.id?.toString() || idx.toString())}
        contentContainerStyle={{ padding: 8 }}
        renderItem={({ item }: any) => (
          <View style={styles.card}>
            <Image
              source={{ uri: item.image1 || item.imageUrl1 || item.image_url_1 || 'https://picsum.photos/seed/test/200' }}
              style={styles.img}
            />
            <Text style={styles.name} numberOfLines={2}>{item.name}</Text>
            <Text style={styles.price}>₹{item.price}  <Text style={styles.mrp}>₹{item.mrp}</Text></Text>
            <Text style={styles.stock}>Stock: {item.stock ?? item.stockQty ?? item.stock_qty ?? 0}</Text>
          </View>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f5f5', paddingTop: 40 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header: { fontSize: 22, fontWeight: 'bold', textAlign: 'center', marginBottom: 4 },
  source: { fontSize: 12, textAlign: 'center', marginBottom: 8, color: '#555' },
  card: { backgroundColor: '#fff', borderRadius: 10, margin: 5, flex: 1, padding: 8, elevation: 2 },
  img: { width: '100%', height: 120, borderRadius: 8, backgroundColor: '#eee' },
  name: { fontSize: 12, fontWeight: '600', marginTop: 6 },
  price: { fontSize: 14, fontWeight: 'bold', marginTop: 4 },
  mrp: { fontSize: 11, color: '#999', textDecorationLine: 'line-through' },
  stock: { fontSize: 11, color: '#666', marginTop: 2 },
});