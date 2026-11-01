import { useState, useCallback } from 'react';
import {
  View, Text, FlatList, TouchableOpacity, Image, Alert,
  Platform, RefreshControl, StyleSheet,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { productService } from '../services/productService';

// Alert.alert does NOTHING on web, so we pick the right popup per platform
const notify = (msg) => (Platform.OS === 'web' ? window.alert(msg) : Alert.alert(msg));
const errMsg = (e) =>
  typeof e.response?.data === 'string' ? e.response.data
  : e.response?.data ? JSON.stringify(e.response.data)
  : e.message;

export default function AdminProducts({ navigation }) {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await productService.getAllProducts({});
      setProducts(Array.isArray(data) ? data : []);
    } catch (e) {
      notify('Could not load: ' + errMsg(e));
    } finally {
      setLoading(false);
    }
  }, []);

  // Runs every time this screen comes to the front — including when you return from the form
  useFocusEffect(useCallback(() => { load(); }, [load]));

  const del = async (id) => {
    try {
      await productService.deleteProduct(id);
      load();
    } catch (e) {
      notify('Delete failed: ' + errMsg(e));
    }
  };

  const confirmDelete = (item) => {
    if (Platform.OS === 'web') {
      if (window.confirm(`Delete "${item.name}"?`)) del(item.id);
    } else {
      Alert.alert('Delete?', item.name, [
        { text: 'Cancel' },
        { text: 'Delete', style: 'destructive', onPress: () => del(item.id) },
      ]);
    }
  };

  const renderItem = ({ item }) => (
    <View style={styles.card}>
      <Image
        source={{ uri: item.image1 || 'https://picsum.photos/seed/noimage/100' }}
        style={styles.thumb}
      />
      <View style={{ flex: 1 }}>
        <Text style={styles.name}>#{item.id} · {item.name}</Text>
        <Text style={styles.meta}>
          {item.category || '—'} · {item.brand || '—'} · ₹{item.price}
        </Text>
        <Text style={[styles.meta, { color: item.inStock ? '#2e7d32' : '#c62828' }]}>
          {item.inStock ? `In stock (${item.stockQty})` : 'Out of stock'}
          {item.isFeatured ? ' · ★ Featured' : ''}
          {item.isNewArrival ? ' · NEW' : ''}
        </Text>
        <View style={styles.row}>
          <TouchableOpacity onPress={() => navigation.navigate('AddProduct', { edit: item })}>
            <Text style={styles.edit}>Edit</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => confirmDelete(item)}>
            <Text style={styles.delete}>Delete</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Admin · Products ({products.length})</Text>
        <TouchableOpacity onPress={load}>
          <Text style={styles.refresh}>↻ Refresh</Text>
        </TouchableOpacity>
      </View>
      <TouchableOpacity style={styles.addBtn} onPress={() => navigation.navigate('AddProduct')}>
        <Text style={styles.addText}>+ Add Product</Text>
      </TouchableOpacity>
      <FlatList
        data={products}
        keyExtractor={(item, i) => String(item.id ?? i)}
        renderItem={renderItem}
        refreshControl={<RefreshControl refreshing={loading} onRefresh={load} />}
        ListEmptyComponent={
          <Text style={styles.empty}>{loading ? 'Loading…' : 'No products yet'}</Text>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16, backgroundColor: '#f4f4f4' },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
  title: { fontSize: 20, fontWeight: 'bold' },
  refresh: { color: '#1565c0', fontWeight: 'bold' },
  addBtn: { backgroundColor: '#2e7d32', padding: 12, borderRadius: 8, alignItems: 'center', marginBottom: 12 },
  addText: { color: '#fff', fontWeight: 'bold' },
  card: { flexDirection: 'row', gap: 12, backgroundColor: '#fff', padding: 10, borderRadius: 8, marginBottom: 8 },
  thumb: { width: 64, height: 64, borderRadius: 6, backgroundColor: '#ddd' },
  name: { fontWeight: 'bold', fontSize: 15 },
  meta: { color: '#555', fontSize: 12, marginTop: 2 },
  row: { flexDirection: 'row', gap: 16, marginTop: 6 },
  edit: { color: '#1565c0', fontWeight: 'bold' },
  delete: { color: '#c62828', fontWeight: 'bold' },
  empty: { textAlign: 'center', color: '#888', marginTop: 40 },
});