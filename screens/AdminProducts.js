import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Image,
  Modal,
  Switch,
  ActivityIndicator,
  StyleSheet,
  Platform,
  Alert,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { productService } from '../services/productService';
import { getImageUrl } from '../constants/api';

const PRESET_PHONES = [
  'Universal',
  'iPhone 15',
  'iPhone 14',
  'Samsung S24',
  'Samsung A55',
  'OnePlus 12',
  'Redmi Note 13',
  'Pixel 8',
];

const CATEGORY_ICONS = ['📱', '🛡️', '🔌', '🔋', '🎧', '⚡', '🧲', '⌚', '📷', '🎮'];

export default function AdminProducts() {
  // Tabs: 'add' | 'edit' | 'categories'
  const [activeTab, setActiveTab] = useState('add');

  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(false);
  const [uploadingSlot, setUploadingSlot] = useState(null); // 1 or 2
  const [statusMsg, setStatusMsg] = useState(null); // { type: 'ok' | 'err', text: '' }

  // Selected product in Edit Tab (null = show product list, object = show edit form)
  const [editingProduct, setEditingProduct] = useState(null);

  // Scroll-up Category Picker Modal
  const [categoryModalVisible, setCategoryModalVisible] = useState(false);

  // Product Form State (ONLY MRP - no separate price/discount!)
  const [name, setName] = useState('');
  const [category, setCategory] = useState('');
  const [mrp, setMrp] = useState('');
  const [brand, setBrand] = useState('');
  const [stockQty, setStockQty] = useState('10');
  const [image1, setImage1] = useState('');
  const [image2, setImage2] = useState('');
  const [selectedPhones, setSelectedPhones] = useState(['Universal']);
  const [customPhone, setCustomPhone] = useState('');
  const [isFeatured, setIsFeatured] = useState(false);
  const [isNewArrival, setIsNewArrival] = useState(true);
  const [description, setDescription] = useState('');

  // Category Tab Form State
  const [newCatName, setNewCatName] = useState('');
  const [newCatIcon, setNewCatIcon] = useState('📱');

  const showBanner = (type, text) => {
    setStatusMsg({ type, text });
    setTimeout(() => setStatusMsg(null), 4000);
  };

  const loadAll = async () => {
    try {
      setLoading(true);
      const [prodData, catData] = await Promise.all([
        productService.getAllProducts(),
        productService.getCategories(),
      ]);
      setProducts(prodData);
      setCategories(catData);
    } catch (e) {
      showBanner('err', 'Could not reach backend (Check IntelliJ is running on 8080)');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAll();
  }, []);

  const resetForm = () => {
    setName('');
    setCategory('');
    setMrp('');
    setBrand('');
    setStockQty('10');
    setImage1('');
    setImage2('');
    setSelectedPhones(['Universal']);
    setCustomPhone('');
    setIsFeatured(false);
    setIsNewArrival(true);
    setDescription('');
  };

  // Switch tabs cleanly
  const handleTabSwitch = (tab) => {
    setStatusMsg(null);
    setActiveTab(tab);
    if (tab === 'add') {
      setEditingProduct(null);
      resetForm();
    } else if (tab === 'edit') {
      setEditingProduct(null);
      loadAll();
    } else if (tab === 'categories') {
      loadAll();
    }
  };

  // Load clicked product into Edit form
  const startEditingProduct = (item) => {
    setEditingProduct(item);
    setName(item.name || '');
    setCategory(item.category || '');
    setMrp((item.mrp ?? item.price ?? '').toString());
    setBrand(item.brand || '');
    setStockQty((item.stockQty ?? 0).toString());
    setImage1(item.image1 || '');
    setImage2(item.image2 || '');
    const phones = item.compatiblePhones
      ? item.compatiblePhones.split(',').map((s) => s.trim()).filter(Boolean)
      : ['Universal'];
    setSelectedPhones(phones.length > 0 ? phones : ['Universal']);
    setIsFeatured(Boolean(item.isFeatured));
    setIsNewArrival(Boolean(item.isNewArrival));
    setDescription(item.description || '');
  };

  // Pick & Upload real image from device
  const pickAndUploadImage = async (slot) => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        base64: true,
        quality: 0.75,
      });

      if (result.canceled || !result.assets || result.assets.length === 0) return;

      setUploadingSlot(slot);
      const uploadedPath = await productService.uploadImage(result.assets[0]);

      if (slot === 1) setImage1(uploadedPath);
      else setImage2(uploadedPath);

      showBanner('ok', `Photo ${slot} uploaded!`);
    } catch (e) {
      showBanner('err', 'Image upload failed: ' + (e.message || 'Check backend'));
    } finally {
      setUploadingSlot(null);
    }
  };

  // Toggle compatible phone chip
  const togglePhoneModel = (model) => {
    if (selectedPhones.includes(model)) {
      setSelectedPhones(selectedPhones.filter((m) => m !== model));
    } else {
      setSelectedPhones([...selectedPhones, model]);
    }
  };

  const addCustomPhoneModel = () => {
    const clean = customPhone.trim();
    if (!clean) return;
    if (!selectedPhones.includes(clean)) {
      setSelectedPhones([...selectedPhones, clean]);
    }
    setCustomPhone('');
  };

  // Save (Create or Update) Product
  const handleSaveProduct = async () => {
    if (!name.trim()) return showBanner('err', 'Please enter Product Name');
    if (!category.trim()) return showBanner('err', 'Please select a Category');
    if (!mrp || isNaN(Number(mrp)) || Number(mrp) <= 0) {
      return showBanner('err', 'Please enter a valid MRP amount');
    }

    const numericMrp = Number(mrp);
    const numericStock = Math.max(0, parseInt(stockQty || '0', 10) || 0);

    const payload = {
      name: name.trim(),
      category: category.trim(),
      mrp: numericMrp,
      price: numericMrp, // Synced behind the scenes for Cart compatibility
      discount: 0,
      brand: brand.trim() || 'Generic',
      stockQty: numericStock,
      inStock: numericStock > 0,
      image1: image1 || null,
      image2: image2 || null,
      compatiblePhones: selectedPhones.join(', '),
      isFeatured,
      isNewArrival,
      description: description.trim(),
    };

    try {
      setLoading(true);
      if (activeTab === 'edit' && editingProduct) {
        await productService.updateProduct(editingProduct.id, payload);
        showBanner('ok', `✅ "${payload.name}" updated! Live on Customer Home.`);
        setEditingProduct(null);
      } else {
        await productService.createProduct(payload);
        showBanner('ok', `✅ "${payload.name}" added! Live on Customer Home.`);
        resetForm();
      }
      await loadAll();
    } catch (e) {
      showBanner('err', 'Save failed: ' + (e.response?.data || e.message));
    } finally {
      setLoading(false);
    }
  };

  // Delete Product
  const handleDeleteProduct = async (item) => {
    const confirmDelete =
      Platform.OS === 'web'
        ? window.confirm(`Delete "${item.name}" permanently?`)
        : await new Promise((resolve) =>
            Alert.alert('Delete Product', `Delete "${item.name}"?`, [
              { text: 'Cancel', onPress: () => resolve(false), style: 'cancel' },
              { text: 'Delete', onPress: () => resolve(true), style: 'destructive' },
            ])
          );

    if (!confirmDelete) return;

    try {
      setLoading(true);
      await productService.deleteProduct(item.id);
      showBanner('ok', `🗑️ "${item.name}" deleted`);
      setEditingProduct(null);
      await loadAll();
    } catch (e) {
      showBanner('err', 'Delete failed');
    } finally {
      setLoading(false);
    }
  };

  // Add Category
  const handleAddCategory = async () => {
    if (!newCatName.trim()) return showBanner('err', 'Enter a category name first');
    try {
      setLoading(true);
      await productService.createCategory(newCatName.trim(), newCatIcon);
      showBanner('ok', `📂 Category "${newCatName.trim()}" added!`);
      setNewCatName('');
      await loadAll();
    } catch (e) {
      showBanner('err', 'Could not add category');
    } finally {
      setLoading(false);
    }
  };

  // Delete Category
  const handleDeleteCategory = async (cat) => {
    try {
      setLoading(true);
      await productService.deleteCategory(cat.id);
      showBanner('ok', `🗑️ Category "${cat.name}" removed`);
      await loadAll();
    } catch (e) {
      showBanner('err', 'Could not delete category');
    } finally {
      setLoading(false);
    }
  };

  // Helper for Idea A: Stock Badge Preview
  const getStockBadge = (qty) => {
    const n = parseInt(qty || '0', 10) || 0;
    if (n <= 0) return { label: 'Out of Stock', bg: '#FEE2E2', color: '#DC2626' };
    if (n <= 5) return { label: `Only ${n} left!`, bg: '#FEF3C7', color: '#D97706' };
    return { label: `In Stock (${n})`, bg: '#DCFCE7', color: '#16A34A' };
  };

  // Shared Product Form (used in Add Tab AND when a product is clicked in Edit Tab)
  const renderProductForm = (isEditMode) => {
    const stockBadge = getStockBadge(stockQty);
    const allPhoneChips = Array.from(new Set([...PRESET_PHONES, ...selectedPhones]));

    return (
      <View style={styles.formCard}>
        {isEditMode && (
          <TouchableOpacity
            style={styles.backToListBtn}
            onPress={() => setEditingProduct(null)}
          >
            <Text style={styles.backToListText}>← Back to Product List</Text>
          </TouchableOpacity>
        )}

        <Text style={styles.sectionTitle}>
          {isEditMode ? `✏️ Edit: ${editingProduct?.name}` : '➕ Add New Product'}
        </Text>

        {/* 1. PRODUCT NAME */}
        <Text style={styles.label}>Product Name *</Text>
        <TextInput
          style={styles.input}
          placeholder="e.g. MagSafe Clear Shockproof Case"
          value={name}
          onChangeText={setName}
        />

        {/* 2. SCROLL-UP CATEGORY SELECTOR */}
        <Text style={styles.label}>Category * (Tap to choose)</Text>
        <TouchableOpacity
          style={styles.selectorBox}
          onPress={() => setCategoryModalVisible(true)}
        >
          <Text style={category ? styles.selectorValue : styles.selectorPlaceholder}>
            {category ? `📂 ${category}` : 'Tap here to select an existing category...'}
          </Text>
          <Text style={styles.selectorArrow}>▲</Text>
        </TouchableOpacity>

        {/* 3. ONLY MRP & BRAND */}
        <View style={styles.row}>
          <View style={{ flex: 1 }}>
            <Text style={styles.label}>MRP (₹) *</Text>
            <TextInput
              style={styles.input}
              placeholder="e.g. 499"
              keyboardType="numeric"
              value={mrp}
              onChangeText={setMrp}
            />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.label}>Brand</Text>
            <TextInput
              style={styles.input}
              placeholder="e.g. Spigen / Anker"
              value={brand}
              onChangeText={setBrand}
            />
          </View>
        </View>

        {/* 4. STOCK QUANTITY + LIVE BADGE PREVIEW (Idea A) */}
        <Text style={styles.label}>Stock Quantity (Auto-updates Customer Badge)</Text>
        <View style={styles.stockRow}>
          <TextInput
            style={[styles.input, { flex: 1, marginBottom: 0 }]}
            placeholder="0"
            keyboardType="numeric"
            value={stockQty}
            onChangeText={setStockQty}
          />
          <View style={[styles.badge, { backgroundColor: stockBadge.bg }]}>
            <Text style={[styles.badgeText, { color: stockBadge.color }]}>
              {stockBadge.label}
            </Text>
          </View>
        </View>

        {/* 5. REAL DEVICE IMAGE UPLOAD (No URL input!) */}
        <Text style={styles.label}>Product Photos (Upload from Device)</Text>
        <View style={styles.photoRow}>
          {/* Main Photo */}
          <View style={styles.photoBoxWrapper}>
            <TouchableOpacity
              style={styles.photoUploadBox}
              onPress={() => pickAndUploadImage(1)}
            >
              {uploadingSlot === 1 ? (
                <ActivityIndicator color="#2563EB" />
              ) : image1 ? (
                <Image source={{ uri: getImageUrl(image1) }} style={styles.uploadedImg} />
              ) : (
                <View style={{ alignItems: 'center' }}>
                  <Text style={{ fontSize: 26 }}>📷</Text>
                  <Text style={styles.uploadHint}>Upload Main Photo</Text>
                </View>
              )}
            </TouchableOpacity>
            {image1 ? (
              <TouchableOpacity onPress={() => setImage1('')}>
                <Text style={styles.removePhotoText}>✕ Remove</Text>
              </TouchableOpacity>
            ) : null}
          </View>

          {/* Optional 2nd Photo */}
          <View style={styles.photoBoxWrapper}>
            <TouchableOpacity
              style={styles.photoUploadBox}
              onPress={() => pickAndUploadImage(2)}
            >
              {uploadingSlot === 2 ? (
                <ActivityIndicator color="#2563EB" />
              ) : image2 ? (
                <Image source={{ uri: getImageUrl(image2) }} style={styles.uploadedImg} />
              ) : (
                <View style={{ alignItems: 'center' }}>
                  <Text style={{ fontSize: 26 }}>🖼️</Text>
                  <Text style={styles.uploadHint}>2nd Photo (Optional)</Text>
                </View>
              )}
            </TouchableOpacity>
            {image2 ? (
              <TouchableOpacity onPress={() => setImage2('')}>
                <Text style={styles.removePhotoText}>✕ Remove</Text>
              </TouchableOpacity>
            ) : null}
          </View>
        </View>

        {/* 6. COMPATIBLE PHONE MODELS (Idea B) */}
        <Text style={styles.label}>Compatible Phone Models (Tap to select)</Text>
        <View style={styles.chipWrap}>
          {allPhoneChips.map((model) => {
            const active = selectedPhones.includes(model);
            return (
              <TouchableOpacity
                key={model}
                style={[styles.chip, active && styles.chipActive]}
                onPress={() => togglePhoneModel(model)}
              >
                <Text style={[styles.chipText, active && styles.chipTextActive]}>
                  {active ? '✓ ' : '+ '}
                  {model}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
        <View style={styles.customPhoneRow}>
          <TextInput
            style={[styles.input, { flex: 1, marginBottom: 0 }]}
            placeholder="Add other phone model (e.g. Vivo V30)"
            value={customPhone}
            onChangeText={setCustomPhone}
          />
          <TouchableOpacity style={styles.addSmallBtn} onPress={addCustomPhoneModel}>
            <Text style={{ color: '#fff', fontWeight: 'bold' }}>+ Add</Text>
          </TouchableOpacity>
        </View>

        {/* 7. FEATURED & NEW ARRIVAL TOGGLES (Idea C) */}
        <View style={styles.switchCard}>
          <View style={styles.switchRow}>
            <Text style={styles.switchLabel}>🔥 Pin to "Featured" on Customer Home</Text>
            <Switch value={isFeatured} onValueChange={setIsFeatured} />
          </View>
          <View style={[styles.switchRow, { marginTop: 10 }]}>
            <Text style={styles.switchLabel}>✨ Mark as "New Arrival"</Text>
            <Switch value={isNewArrival} onValueChange={setIsNewArrival} />
          </View>
        </View>

        {/* 8. DESCRIPTION */}
        <Text style={styles.label}>Product Description</Text>
        <TextInput
          style={[styles.input, { height: 80, textAlignVertical: 'top' }]}
          multiline
          placeholder="Write key features, material, warranty..."
          value={description}
          onChangeText={setDescription}
        />

        {/* SAVE / DELETE BUTTONS */}
        <TouchableOpacity
          style={styles.saveBtn}
          onPress={handleSaveProduct}
          disabled={loading}
        >
          <Text style={styles.saveBtnText}>
            {loading
              ? 'Saving...'
              : isEditMode
              ? '💾 Save Changes'
              : '✅ Add Product to Store'}
          </Text>
        </TouchableOpacity>

        {isEditMode && (
          <TouchableOpacity
            style={styles.deleteFullBtn}
            onPress={() => handleDeleteProduct(editingProduct)}
          >
            <Text style={styles.deleteFullBtnText}>🗑️ Delete This Product</Text>
          </TouchableOpacity>
        )}
      </View>
    );
  };

  return (
    <View style={styles.container}>
      {/* TOP 3-TAB BAR */}
      <View style={styles.tabBar}>
        <TouchableOpacity
          style={[styles.tabBtn, activeTab === 'add' && styles.tabBtnActive]}
          onPress={() => handleTabSwitch('add')}
        >
          <Text style={[styles.tabText, activeTab === 'add' && styles.tabTextActive]}>
            ➕ Add
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tabBtn, activeTab === 'edit' && styles.tabBtnActive]}
          onPress={() => handleTabSwitch('edit')}
        >
          <Text style={[styles.tabText, activeTab === 'edit' && styles.tabTextActive]}>
            ✏️ Edit ({products.length})
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tabBtn, activeTab === 'categories' && styles.tabBtnActive]}
          onPress={() => handleTabSwitch('categories')}
        >
          <Text
            style={[styles.tabText, activeTab === 'categories' && styles.tabTextActive]}
          >
            📂 Categories ({categories.length})
          </Text>
        </TouchableOpacity>
      </View>

      {/* STATUS BANNER */}
      {statusMsg && (
        <View
          style={[
            styles.banner,
            { backgroundColor: statusMsg.type === 'ok' ? '#DCFCE7' : '#FEE2E2' },
          ]}
        >
          <Text
            style={{
              color: statusMsg.type === 'ok' ? '#166534' : '#991B1B',
              fontWeight: 'bold',
            }}
          >
            {statusMsg.text}
          </Text>
        </View>
      )}

      <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 50 }}>
        {/* ================= TAB 1: ADD PRODUCT ================= */}
        {activeTab === 'add' && renderProductForm(false)}

        {/* ================= TAB 2: EDIT PRODUCTS ================= */}
        {activeTab === 'edit' &&
          (editingProduct ? (
            renderProductForm(true)
          ) : (
            <View>
              <Text style={styles.helperHeading}>
                Tap any product below to view & edit its details:
              </Text>
              {products.length === 0 ? (
                <View style={styles.emptyBox}>
                  <Text style={styles.emptyText}>No products in database yet.</Text>
                  <TouchableOpacity
                    style={[styles.saveBtn, { marginTop: 12 }]}
                    onPress={() => handleTabSwitch('add')}
                  >
                    <Text style={styles.saveBtnText}>➕ Add Your First Product</Text>
                  </TouchableOpacity>
                </View>
              ) : (
                products.map((item) => {
                  const badge = getStockBadge(item.stockQty);
                  const imgUri = getImageUrl(item.image1);
                  return (
                    <TouchableOpacity
                      key={item.id}
                      style={styles.productRowCard}
                      onPress={() => startEditingProduct(item)}
                    >
                      {imgUri ? (
                        <Image source={{ uri: imgUri }} style={styles.rowThumb} />
                      ) : (
                        <View style={[styles.rowThumb, styles.noThumb]}>
                          <Text style={{ fontSize: 22 }}>📱</Text>
                        </View>
                      )}

                      <View style={{ flex: 1 }}>
                        <Text style={styles.rowTitle}>{item.name}</Text>
                        <Text style={styles.rowMeta}>
                          {item.category} • MRP: ₹{item.mrp ?? item.price}
                        </Text>
                        <View style={{ flexDirection: 'row', gap: 6, marginTop: 4 }}>
                          <View style={[styles.miniBadge, { backgroundColor: badge.bg }]}>
                            <Text style={{ fontSize: 11, color: badge.color, fontWeight: '700' }}>
                              {badge.label}
                            </Text>
                          </View>
                          {item.isFeatured && (
                            <Text style={styles.tagPill}>🔥 Featured</Text>
                          )}
                        </View>
                      </View>

                      <View style={{ alignItems: 'flex-end', gap: 8 }}>
                        <Text style={styles.editLink}>✏️ Edit</Text>
                        <TouchableOpacity onPress={() => handleDeleteProduct(item)}>
                          <Text style={styles.delLink}>🗑️ Delete</Text>
                        </TouchableOpacity>
                      </View>
                    </TouchableOpacity>
                  );
                })
              )}
            </View>
          ))}

        {/* ================= TAB 3: CATEGORIES ================= */}
        {activeTab === 'categories' && (
          <View>
            <View style={styles.formCard}>
              <Text style={styles.sectionTitle}>📂 Add New Category</Text>
              <Text style={styles.label}>Pick an Icon</Text>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                style={{ marginBottom: 12 }}
              >
                {CATEGORY_ICONS.map((ic) => (
                  <TouchableOpacity
                    key={ic}
                    style={[
                      styles.iconOption,
                      newCatIcon === ic && styles.iconOptionActive,
                    ]}
                    onPress={() => setNewCatIcon(ic)}
                  >
                    <Text style={{ fontSize: 22 }}>{ic}</Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>

              <Text style={styles.label}>Category Name *</Text>
              <TextInput
                style={styles.input}
                placeholder="e.g. Fast Chargers, Cases, Tempered Glass"
                value={newCatName}
                onChangeText={setNewCatName}
              />

              <TouchableOpacity style={styles.saveBtn} onPress={handleAddCategory}>
                <Text style={styles.saveBtnText}>➕ Add Category</Text>
              </TouchableOpacity>
            </View>

            <Text style={[styles.helperHeading, { marginTop: 18 }]}>
              Live Categories on Customer Home ({categories.length}):
            </Text>

            {categories.map((cat) => (
              <View key={cat.id} style={styles.catRow}>
                <Text style={{ fontSize: 24, marginRight: 12 }}>{cat.icon || '📱'}</Text>
                <View style={{ flex: 1 }}>
                  <Text style={styles.rowTitle}>{cat.name}</Text>
                  <Text style={styles.rowMeta}>
                    {cat.productCount || 0} product(s) in this category
                  </Text>
                </View>
                <TouchableOpacity onPress={() => handleDeleteCategory(cat)}>
                  <Text style={styles.delLink}>🗑️ Remove</Text>
                </TouchableOpacity>
              </View>
            ))}
          </View>
        )}
      </ScrollView>

      {/* ================= SCROLL-UP CATEGORY PICKER MODAL ================= */}
      <Modal
        visible={categoryModalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setCategoryModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalSheet}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Select a Category</Text>
              <TouchableOpacity onPress={() => setCategoryModalVisible(false)}>
                <Text style={styles.modalClose}>✕ Close</Text>
              </TouchableOpacity>
            </View>

            {categories.length === 0 ? (
              <View style={{ padding: 20, alignItems: 'center' }}>
                <Text style={styles.emptyText}>
                  No categories created yet! Add one first.
                </Text>
              </View>
            ) : (
              <ScrollView style={{ maxHeight: 300 }}>
                {categories.map((cat) => {
                  const selected = category === cat.name;
                  return (
                    <TouchableOpacity
                      key={cat.id}
                      style={[
                        styles.modalCatItem,
                        selected && styles.modalCatItemActive,
                      ]}
                      onPress={() => {
                        setCategory(cat.name);
                        setCategoryModalVisible(false);
                      }}
                    >
                      <Text style={{ fontSize: 22, marginRight: 12 }}>
                        {cat.icon || '📱'}
                      </Text>
                      <Text
                        style={[
                          styles.modalCatText,
                          selected && { color: '#2563EB', fontWeight: 'bold' },
                        ]}
                      >
                        {cat.name}
                      </Text>
                      {selected && (
                        <Text style={{ color: '#2563EB', fontWeight: 'bold' }}>✓</Text>
                      )}
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>
            )}

            <TouchableOpacity
              style={styles.modalAddCatBtn}
              onPress={() => {
                setCategoryModalVisible(false);
                handleTabSwitch('categories');
              }}
            >
              <Text style={styles.modalAddCatText}>
                + Need a new category? Go to Categories Tab
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F3F4F6' },
  tabBar: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    padding: 8,
    gap: 8,
    borderBottomWidth: 1,
    borderColor: '#E5E7EB',
  },
  tabBtn: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: 'center',
    backgroundColor: '#F3F4F6',
  },
  tabBtnActive: { backgroundColor: '#2563EB' },
  tabText: { fontWeight: '600', color: '#374151', fontSize: 13 },
  tabTextActive: { color: '#FFFFFF', fontWeight: 'bold' },
  banner: { padding: 12, marginHorizontal: 16, marginTop: 12, borderRadius: 8 },
  formCard: {
    backgroundColor: '#FFFFFF',
    padding: 16,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 2,
  },
  sectionTitle: { fontSize: 18, fontWeight: 'bold', color: '#111827', marginBottom: 14 },
  label: { fontSize: 13, fontWeight: '600', color: '#374151', marginBottom: 6, marginTop: 6 },
  input: {
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    backgroundColor: '#FAFAFA',
    marginBottom: 10,
  },
  row: { flexDirection: 'row', gap: 12 },
  selectorBox: {
    borderWidth: 1,
    borderColor: '#2563EB',
    backgroundColor: '#EFF6FF',
    borderRadius: 8,
    padding: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  selectorValue: { fontSize: 15, fontWeight: '600', color: '#1E40AF' },
  selectorPlaceholder: { fontSize: 14, color: '#6B7280' },
  selectorArrow: { fontSize: 13, color: '#2563EB', fontWeight: 'bold' },
  stockRow: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 10 },
  badge: { paddingHorizontal: 12, paddingVertical: 10, borderRadius: 8 },
  badgeText: { fontWeight: 'bold', fontSize: 13 },
  photoRow: { flexDirection: 'row', gap: 12, marginBottom: 12 },
  photoBoxWrapper: { flex: 1, alignItems: 'center' },
  photoUploadBox: {
    width: '100%',
    height: 130,
    borderWidth: 1.5,
    borderStyle: 'dashed',
    borderColor: '#93C5FD',
    borderRadius: 10,
    backgroundColor: '#F8FAFC',
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
  },
  uploadedImg: { width: '100%', height: '100%', resizeMode: 'cover' },
  uploadHint: { fontSize: 12, color: '#2563EB', marginTop: 6, fontWeight: '600' },
  removePhotoText: { color: '#DC2626', fontSize: 12, marginTop: 4, fontWeight: '600' },
  chipWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 10 },
  chip: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 20,
    backgroundColor: '#F3F4F6',
    borderWidth: 1,
    borderColor: '#D1D5DB',
  },
  chipActive: { backgroundColor: '#DBEAFE', borderColor: '#2563EB' },
  chipText: { fontSize: 12, color: '#374151' },
  chipTextActive: { color: '#1D4ED8', fontWeight: 'bold' },
  customPhoneRow: { flexDirection: 'row', gap: 8, marginBottom: 12, alignItems: 'center' },
  addSmallBtn: {
    backgroundColor: '#374151',
    paddingHorizontal: 14,
    paddingVertical: 11,
    borderRadius: 8,
  },
  switchCard: {
    backgroundColor: '#F9FAFB',
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    marginVertical: 8,
  },
  switchRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  switchLabel: { fontSize: 13, fontWeight: '600', color: '#1F2937' },
  saveBtn: {
    backgroundColor: '#16A34A',
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: 'center',
    marginTop: 12,
  },
  saveBtnText: { color: '#FFFFFF', fontWeight: 'bold', fontSize: 15 },
  deleteFullBtn: {
    backgroundColor: '#FEE2E2',
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: 'center',
    marginTop: 10,
  },
  deleteFullBtnText: { color: '#DC2626', fontWeight: 'bold', fontSize: 14 },
  backToListBtn: {
    alignSelf: 'flex-start',
    backgroundColor: '#E5E7EB',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
    marginBottom: 12,
  },
  backToListText: { fontWeight: '600', color: '#111827', fontSize: 13 },
  helperHeading: { fontSize: 14, fontWeight: '600', color: '#4B5563', marginBottom: 10 },
  productRowCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    padding: 12,
    borderRadius: 10,
    marginBottom: 10,
    gap: 12,
  },
  rowThumb: { width: 58, height: 58, borderRadius: 8, backgroundColor: '#F3F4F6' },
  noThumb: { justifyContent: 'center', alignItems: 'center' },
  rowTitle: { fontSize: 15, fontWeight: 'bold', color: '#111827' },
  rowMeta: { fontSize: 13, color: '#6B7280', marginTop: 2 },
  miniBadge: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 6 },
  tagPill: {
    fontSize: 11,
    backgroundColor: '#FEF3C7',
    color: '#B45309',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
    fontWeight: '600',
  },
  editLink: { color: '#2563EB', fontWeight: 'bold', fontSize: 13 },
  delLink: { color: '#DC2626', fontWeight: '600', fontSize: 12 },
  catRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    padding: 14,
    borderRadius: 10,
    marginBottom: 8,
  },
  iconOption: {
    padding: 10,
    borderRadius: 10,
    backgroundColor: '#F3F4F6',
    marginRight: 8,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  iconOptionActive: { backgroundColor: '#DBEAFE', borderColor: '#2563EB' },
  emptyBox: { backgroundColor: '#FFFFFF', padding: 24, borderRadius: 12, alignItems: 'center' },
  emptyText: { color: '#6B7280', fontSize: 14 },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.45)',
    justifyContent: 'flex-end',
  },
  modalSheet: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 18,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  modalTitle: { fontSize: 17, fontWeight: 'bold', color: '#111827' },
  modalClose: { fontSize: 14, color: '#6B7280', fontWeight: 'bold' },
  modalCatItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 12,
    borderBottomWidth: 1,
    borderColor: '#F3F4F6',
    borderRadius: 8,
  },
  modalCatItemActive: { backgroundColor: '#EFF6FF' },
  modalCatText: { flex: 1, fontSize: 15, color: '#1F2937' },
  modalAddCatBtn: {
    marginTop: 14,
    padding: 12,
    backgroundColor: '#F3F4F6',
    borderRadius: 8,
    alignItems: 'center',
  },
  modalAddCatText: { color: '#2563EB', fontWeight: 'bold', fontSize: 13 },
});