import { useState } from 'react';
import {
  View, Text, TextInput, Switch, TouchableOpacity, ScrollView,
  Alert, Platform, StyleSheet,
} from 'react-native';
import { productService } from '../services/productService';

const notify = (msg) => (Platform.OS === 'web' ? window.alert(msg) : Alert.alert(msg));
const errMsg = (e) =>
  typeof e.response?.data === 'string' ? e.response.data
  : e.response?.data ? JSON.stringify(e.response.data)
  : e.message;

// Field and Toggle live OUTSIDE the main function on purpose:
// defined inside, React would rebuild them on every keystroke and the box would lose focus.
function Field({ label, value, onChange, keyboard = 'default', multiline = false, placeholder = '' }) {
  return (
    <View style={styles.field}>
      <Text style={styles.label}>{label}</Text>
      <TextInput
        style={[styles.input, multiline && { height: 80, textAlignVertical: 'top' }]}
        value={value}
        onChangeText={onChange}
        keyboardType={keyboard}
        multiline={multiline}
        placeholder={placeholder}
        placeholderTextColor="#aaa"
      />
    </View>
  );
}

function Toggle({ label, value, onChange }) {
  return (
    <View style={styles.toggleRow}>
      <Text style={styles.label}>{label}</Text>
      <Switch value={!!value} onValueChange={onChange} />
    </View>
  );
}

export default function AddProduct({ navigation, route }) {
  const editing = route?.params?.edit || null;   // filled when we arrived via "Edit"

  // TextInput works with text, so every typed field is kept as a string while editing
  const [form, setForm] = useState({
    name: editing?.name ?? '',
    category: editing?.category ?? '',
    brand: editing?.brand ?? '',
    description: editing?.description ?? '',
    price: editing?.price != null ? String(editing.price) : '',
    mrp: editing?.mrp != null ? String(editing.mrp) : '',
    discount: editing?.discount != null ? String(editing.discount) : '',
    stockQty: editing?.stockQty != null ? String(editing.stockQty) : '',
    image1: editing?.image1 ?? '',
    inStock: editing?.inStock ?? true,
  });
  const [saving, setSaving] = useState(false);

  const set = (key, value) => setForm((f) => ({ ...f, [key]: value }));

  const save = async () => {
    if (!form.name.trim() || !form.price.trim()) {
      notify('Name and Price are required');
      return;
    }
    const price = Number(form.price);
    const mrp = form.mrp.trim() ? Number(form.mrp) : price;
    const discount = form.discount.trim()
      ? Number(form.discount)
      : mrp > price ? Math.round(((mrp - price) / mrp) * 100) : 0;

    // Spellings must match Java's JSON: stockQty, inStock, image1
    const payload = {
      ...(editing || {}),        // when editing, keeps id, image2, rating, createdAt untouched
      name: form.name.trim(),
      category: form.category.trim(),
      brand: form.brand.trim(),
      description: form.description.trim(),
      price,
      mrp,
      discount,
      stockQty: form.stockQty.trim() ? Number(form.stockQty) : 0,
      image1: form.image1.trim() || null,
      inStock: form.inStock,
    };

    try {
      setSaving(true);
      if (editing) await productService.updateProduct(editing.id, payload);
      else await productService.createProduct(payload);
      navigation.goBack();       // AdminProducts refreshes itself on focus
    } catch (e) {
      notify('Save failed: ' + errMsg(e));
    } finally {
      setSaving(false);
    }
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={{ paddingBottom: 40 }}>
      <Text style={styles.title}>{editing ? `Edit #${editing.id}` : 'Add Product'}</Text>

       <Field label="Name *" value={form.name} onChange={(v) => set('name', v)} placeholder="Enter product name (e.g., MagSafe Clear Shockproof Case)" />
      <Field label="Category" value={form.category} onChange={(v) => set('category', v)} placeholder="Tap to select an existing category" />
            <Field label="Brand" value={form.brand} onChange={(v) => set('brand', v)} placeholder="Enter brand (e.g., Spigen / Anker)" />
            <Field label="Price *" value={form.price} onChange={(v) => set('price', v)} keyboard="numeric" placeholder="Enter price (e.g., 499)" />
            <Field label="Price *" value={form.price} onChange={(v) => set('price', v)} keyboard="numeric" placeholder="Enter price (e.g., 499)" />
            <Field label="Discount % (blank = auto)" value={form.discount} onChange={(v) => set('discount', v)} keyboard="numeric" placeholder="Enter discount % (e.g., 50)" />
            <Field label="Stock quantity" value={form.stockQty} onChange={(v) => set('stockQty', v)} keyboard="numeric" placeholder="Enter stock quantity (e.g., 50)" />
      <Field label="Image URL" value={form.image1} onChange={(v) => set('image1', v)} />
            <Field label="Description" value={form.description} onChange={(v) => set('description', v)} multiline placeholder="Enter product details (e.g., material, features, warranty)" />

      <Toggle label="In stock" value={form.inStock} onChange={(v) => set('inStock', v)} />

      <TouchableOpacity style={[styles.saveBtn, saving && { opacity: 0.6 }]} onPress={save} disabled={saving}>
        <Text style={styles.saveText}>{saving ? 'Saving…' : editing ? 'Update' : 'Save'}</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16, backgroundColor: '#f4f4f4' },
  title: { fontSize: 20, fontWeight: 'bold', marginBottom: 12 },
  field: { marginBottom: 12 },
  label: { fontSize: 13, color: '#444', marginBottom: 4, fontWeight: '600' },
  input: { backgroundColor: '#fff', borderWidth: 1, borderColor: '#ddd', borderRadius: 8, padding: 10, fontSize: 15 },
  toggleRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#fff', padding: 12, borderRadius: 8, marginBottom: 10 },
  saveBtn: { backgroundColor: '#1565c0', padding: 14, borderRadius: 8, alignItems: 'center', marginTop: 8 },
  saveText: { color: '#fff', fontWeight: 'bold', fontSize: 16 },
});