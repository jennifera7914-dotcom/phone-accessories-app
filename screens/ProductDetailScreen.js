import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  Image,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Alert,
  TextInput,
  Share,
  Modal,
  FlatList,
  Dimensions,
} from 'react-native';
import {
  productService,
  cartService,
  wishlistService,
} from '../services/productService';
import { COLORS } from '../constants/colors';
import { getImageUrl } from '../constants/api';

const { width: SCREEN_W, height: SCREEN_H } = Dimensions.get('window');

export default function ProductDetailScreen({ route, navigation }) {
  const { productId } = route.params;
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedImage, setSelectedImage] = useState(0);
  const [quantity, setQuantity] = useState('10');
  const [customQuantity, setCustomQuantity] = useState('');
  const [qtyError, setQtyError] = useState('');
  const [isInWishlist, setIsInWishlist] = useState(false);
  const [cartLoading, setCartLoading] = useState(false);

  // Full-screen image viewer
  const [viewerVisible, setViewerVisible] = useState(false);
  const [viewerIndex, setViewerIndex] = useState(0);
  const flatListRef = useRef(null);

  useEffect(() => {
    fetchProduct();
  }, [productId]);

  useEffect(() => {
    checkWishlist();
  }, [product]);

  const fetchProduct = async () => {
    try {
      const data = await productService.getProductById(productId);
      setProduct(data);
      setLoading(false);
    } catch (err) {
      console.log(err);
      setLoading(false);
    }
  };

  const checkWishlist = async () => {
    if (product) {
      const inWishlist = await wishlistService.isInWishlist(product.id);
      setIsInWishlist(inWishlist);
    }
  };

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color={COLORS.primary} />
      </View>
    );
  }

  if (!product) {
    return (
      <View style={styles.centerContainer}>
        <Text>Product not found</Text>
      </View>
    );
  }

  // Build images array (only non-null images)
  const productImages = [product.image1, product.image2]
    .filter(Boolean)
    .map((img) => getImageUrl(img));

  const stockQty = Number(product.stockQty ?? 0);
  const isOutOfStock = stockQty <= 0;

  // Quick select buttons (10, 15, 20...)
  const handleQuantitySelect = (qty) => {
    const numQty = parseInt(qty);
    if (numQty > stockQty) {
      setQtyError(
        `Only ${stockQty} pieces are available. Please choose ${stockQty} or less.`
      );
      return;
    }
    setQuantity(qty.toString());
    setCustomQuantity('');
    setQtyError('');
  };

  // Custom quantity input — only numbers, inline error below
  const handleCustomQuantity = (text) => {
    const cleanText = text.replace(/[^0-9]/g, '');
    setCustomQuantity(cleanText);
    setQuantity('');

    if (text !== cleanText) {
      setQtyError('Only numbers can be entered here');
      return;
    }

    const numQty = parseInt(cleanText);
    if (!isNaN(numQty) && numQty > stockQty) {
      setQtyError(
        `Only ${stockQty} pieces are available. Please enter ${stockQty} or less.`
      );
    } else {
      setQtyError('');
    }
  };

  const finalQuantity = customQuantity || quantity;
  const totalPrice = (parseInt(finalQuantity) || 0) * product.price;

  const handleAddToCart = async () => {
    const numQty = parseInt(finalQuantity);
    if (!finalQuantity || numQty <= 0) {
      setQtyError('Please enter a valid quantity');
      return;
    }
    if (numQty > stockQty) {
      setQtyError(
        `Only ${stockQty} pieces are available. Please enter ${stockQty} or less.`
      );
      return;
    }
    setQtyError('');

    try {
      setCartLoading(true);
      await cartService.addToCart(product, numQty);
      setCartLoading(false);
      Alert.alert('Success', `Added ${numQty} units to cart!`, [
        { text: 'Continue Shopping', onPress: () => navigation.goBack() },
        { text: 'Go to Cart', onPress: () => navigation.navigate('Cart') },
      ]);
    } catch (err) {
      setCartLoading(false);
      Alert.alert('Error', 'Failed to add to cart');
    }
  };

  const handleWishlist = async () => {
    try {
      if (isInWishlist) {
        await wishlistService.removeFromWishlist(product.id);
        setIsInWishlist(false);
        Alert.alert('Removed', 'Removed from wishlist');
      } else {
        await wishlistService.addToWishlist(product);
        setIsInWishlist(true);
        Alert.alert('Added', 'Added to wishlist!');
      }
    } catch (err) {
      Alert.alert('Error', 'Failed to update wishlist');
    }
  };

  const handleShare = async () => {
    try {
      await Share.share({
        message: `Check out ${product.name} - ₹${product.price}. ${product.description}`,
        title: 'Share Product',
      });
    } catch (err) {
      Alert.alert('Error', 'Failed to share');
    }
  };

  // Open full-screen viewer
  const openViewer = (index) => {
    setViewerIndex(index);
    setViewerVisible(true);
  };

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {/* ===== IMAGE SECTION ===== */}
      <View style={styles.imageSection}>
        <TouchableOpacity
          activeOpacity={0.9}
          onPress={() => openViewer(selectedImage)}
        >
          <Image
            source={{ uri: productImages[selectedImage] || null }}
            style={styles.mainImage}
            resizeMode="contain"
          />
        </TouchableOpacity>

        {productImages.length > 1 && (
          <View style={styles.imageIndicators}>
            {productImages.map((img, idx) => (
              <TouchableOpacity
                key={idx}
                style={[
                  styles.indicator,
                  selectedImage === idx && styles.indicatorActive,
                ]}
                onPress={() => setSelectedImage(idx)}
              >
                <Image source={{ uri: img }} style={styles.indicatorImage} />
              </TouchableOpacity>
            ))}
          </View>
        )}

        {productImages.length > 1 && (
          <View style={styles.imageCounter}>
            <Text style={styles.imageCounterText}>
              {selectedImage + 1} / {productImages.length}
            </Text>
          </View>
        )}
      </View>

      {/* ===== PRODUCT INFO ===== */}
      <View style={styles.infoSection}>
        <Text style={styles.productName}>{product.name}</Text>

        {/* Pricing — no Save ₹X */}
        <View style={styles.priceContainer}>
          <Text style={styles.sellingPrice}>₹{product.price}</Text>
          {product.mrp > product.price && (
            <Text style={styles.mrp}>MRP: ₹{product.mrp}</Text>
          )}
        </View>

        {/* Stock Status */}
        <View
          style={[
            styles.statusContainer,
            { borderColor: isOutOfStock ? COLORS.danger : COLORS.success },
          ]}
        >
          <Text
            style={[
              styles.statusLabel,
              { color: isOutOfStock ? COLORS.danger : COLORS.success },
            ]}
          >
            {isOutOfStock ? '❌ Out of Stock' : '✅ In Stock'}
          </Text>
          <Text style={styles.stockCount}>
            {stockQty > 0 ? `${stockQty} units available` : 'No stock'}
          </Text>
        </View>

        {/* Description */}
        <View style={styles.descriptionSection}>
          <Text style={styles.sectionTitle}>Description</Text>
          <Text style={styles.descriptionText}>{product.description}</Text>
        </View>

        {/* Quantity Selector */}
        {!isOutOfStock && (
          <View style={styles.quantitySection}>
            <Text style={styles.sectionTitle}>Select Quantity (Bulk Pricing)</Text>

            {/* Quick select buttons */}
            <View style={styles.quickSelectContainer}>
              {['10', '15', '20', '30', '40'].map((qty) => (
                <TouchableOpacity
                  key={qty}
                  style={[
                    styles.quickSelectButton,
                    quantity === qty && styles.quickSelectButtonActive,
                  ]}
                  onPress={() => handleQuantitySelect(qty)}
                >
                  <Text
                    style={[
                      styles.quickSelectText,
                      quantity === qty && styles.quickSelectTextActive,
                    ]}
                  >
                    {qty}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* Custom quantity input with inline error */}
            <View style={styles.customQuantityContainer}>
              <Text style={styles.customQuantityLabel}>
                Or enter custom quantity:
              </Text>
              <TextInput
                style={[
                  styles.customQuantityInput,
                  qtyError && styles.customQuantityInputError,
                ]}
                placeholder="Enter the quantity you want"
                keyboardType="number-pad"
                value={customQuantity}
                onChangeText={handleCustomQuantity}
                placeholderTextColor={COLORS.textSecondary}
              />
              {qtyError ? (
                <Text style={styles.qtyErrorText}>{qtyError}</Text>
              ) : null}
            </View>

            {/* Selected quantity display */}
            <View style={styles.selectedQuantityContainer}>
              <View>
                <Text style={styles.selectedQuantityLabel}>
                  Selected Quantity:
                </Text>
                <Text style={styles.selectedQuantityValue}>
                  {finalQuantity} units
                </Text>
              </View>
              <View style={styles.totalPriceBox}>
                <Text style={styles.totalPriceLabel}>Total:</Text>
                <Text style={styles.totalPrice}>₹{totalPrice}</Text>
              </View>
            </View>
          </View>
        )}
      </View>

      {/* ===== ACTION BUTTONS ===== */}
      <View style={styles.buttonSection}>
        <TouchableOpacity
          style={[
            styles.addToCartButton,
            isOutOfStock && styles.disabledButton,
            cartLoading && { opacity: 0.6 },
          ]}
          onPress={handleAddToCart}
          disabled={isOutOfStock || cartLoading}
        >
          <Text style={styles.addToCartButtonText}>
            {cartLoading
              ? 'Adding...'
              : isOutOfStock
              ? 'Out of Stock'
              : '🛒 Add to Cart'}
          </Text>
        </TouchableOpacity>

        <View style={styles.secondaryButtons}>
          <TouchableOpacity
            style={[
              styles.wishlistButton,
              isInWishlist && styles.wishlistButtonActive,
            ]}
            onPress={handleWishlist}
          >
            <Text style={styles.wishlistButtonText}>
              {isInWishlist ? '❤️' : '🤍'}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.shareButton} onPress={handleShare}>
            <Text style={styles.shareButtonText}>📤</Text>
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.spacer} />

      {/* ===== FULL-SCREEN IMAGE VIEWER ===== */}
      <Modal
        visible={viewerVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setViewerVisible(false)}
        statusBarTranslucent
      >
        <View style={styles.viewerContainer}>
          {/* Close Button */}
          <TouchableOpacity
            style={styles.viewerClose}
            onPress={() => setViewerVisible(false)}
            activeOpacity={0.7}
          >
            <Text style={styles.viewerCloseText}>✕</Text>
          </TouchableOpacity>

          {/* Image Counter */}
          <View style={styles.viewerCounter}>
            <Text style={styles.viewerCounterText}>
              {viewerIndex + 1} / {productImages.length}
            </Text>
          </View>

          {/* Swipeable Images */}
          <FlatList
            ref={flatListRef}
            data={productImages}
            horizontal
            pagingEnabled
            showsHorizontalScrollIndicator={false}
            initialScrollIndex={viewerIndex}
            getItemLayout={(data, index) => ({
              length: SCREEN_W,
              offset: SCREEN_W * index,
              index,
            })}
            onMomentumScrollEnd={(e) => {
              const idx = Math.round(
                e.nativeEvent.contentOffset.x / SCREEN_W
              );
              setViewerIndex(idx);
            }}
            keyExtractor={(item, idx) => idx.toString()}
            renderItem={({ item }) => (
              <View style={[styles.viewerImageWrapper, { width: SCREEN_W }]}>
                <Image
                  source={{ uri: item }}
                  style={styles.viewerImage}
                  resizeMode="contain"
                />
              </View>
            )}
          />

          {/* Dot Indicators */}
          {productImages.length > 1 && (
            <View style={styles.viewerDots}>
              {productImages.map((_, idx) => (
                <View
                  key={idx}
                  style={[
                    styles.viewerDot,
                    viewerIndex === idx && styles.viewerDotActive,
                  ]}
                />
              ))}
            </View>
          )}

          {/* Left Arrow */}
          {viewerIndex > 0 && (
            <TouchableOpacity
              style={styles.viewerNavLeft}
              onPress={() => {
                flatListRef.current?.scrollToOffset({
                  offset: (viewerIndex - 1) * SCREEN_W,
                  animated: true,
                });
                setViewerIndex(viewerIndex - 1);
              }}
            >
              <Text style={styles.viewerNavArrow}>‹</Text>
            </TouchableOpacity>
          )}

          {/* Right Arrow */}
          {viewerIndex < productImages.length - 1 && (
            <TouchableOpacity
              style={styles.viewerNavRight}
              onPress={() => {
                flatListRef.current?.scrollToOffset({
                  offset: (viewerIndex + 1) * SCREEN_W,
                  animated: true,
                });
                setViewerIndex(viewerIndex + 1);
              }}
            >
              <Text style={styles.viewerNavArrow}>›</Text>
            </TouchableOpacity>
          )}
        </View>
      </Modal>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.background,
  },

  /* ===== IMAGE ===== */
  imageSection: {
    backgroundColor: '#F3F4F6',
    paddingVertical: 20,
    position: 'relative',
  },
  mainImage: {
    width: '100%',
    height: 300,
    backgroundColor: '#F3F4F6',
  },
  imageIndicators: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 10,
    marginTop: 12,
    paddingHorizontal: 15,
  },
  indicator: {
    width: 70,
    height: 70,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: '#D1D5DB',
    overflow: 'hidden',
    backgroundColor: '#fff',
  },
  indicatorActive: { borderColor: COLORS.primary, borderWidth: 3 },
  indicatorImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  imageCounter: {
    position: 'absolute',
    top: 30,
    left: 16,
    backgroundColor: 'rgba(0,0,0,0.6)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  imageCounterText: { color: '#fff', fontSize: 12, fontWeight: '600' },

  /* ===== INFO ===== */
  infoSection: { paddingHorizontal: 15, paddingVertical: 20 },
  productName: {
    fontSize: 22,
    fontWeight: 'bold',
    color: COLORS.textPrimary,
    marginBottom: 15,
  },
  priceContainer: {
    backgroundColor: '#F3F4F6',
    paddingHorizontal: 15,
    paddingVertical: 15,
    borderRadius: 8,
    marginBottom: 15,
    borderLeftWidth: 4,
    borderLeftColor: COLORS.primary,
  },
  sellingPrice: {
    fontSize: 26,
    fontWeight: 'bold',
    color: COLORS.primary,
    marginBottom: 6,
  },
  mrp: { fontSize: 13, color: COLORS.textSecondary },

  /* ===== STOCK ===== */
  statusContainer: {
    borderWidth: 2,
    borderRadius: 8,
    paddingHorizontal: 15,
    paddingVertical: 12,
    marginBottom: 20,
  },
  statusLabel: { fontSize: 16, fontWeight: 'bold', marginBottom: 4 },
  stockCount: { fontSize: 12, color: COLORS.textSecondary },

  /* ===== DESCRIPTION ===== */
  descriptionSection: { marginBottom: 20 },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: COLORS.textPrimary,
    marginBottom: 10,
  },
  descriptionText: {
    fontSize: 14,
    color: COLORS.textSecondary,
    lineHeight: 22,
  },

  /* ===== QUANTITY ===== */
  quantitySection: {
    backgroundColor: '#F3F4F6',
    paddingHorizontal: 15,
    paddingVertical: 15,
    borderRadius: 8,
    marginBottom: 20,
  },
  quickSelectContainer: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 15,
    flexWrap: 'wrap',
  },
  quickSelectButton: {
    backgroundColor: '#fff',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: '#D1D5DB',
  },
  quickSelectButtonActive: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  quickSelectText: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.textPrimary,
  },
  quickSelectTextActive: { color: '#fff' },
  customQuantityContainer: { marginBottom: 15 },
  customQuantityLabel: {
    fontSize: 13,
    color: COLORS.textSecondary,
    marginBottom: 8,
  },
  customQuantityInput: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 6,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    color: COLORS.textPrimary,
  },
  customQuantityInputError: {
    borderColor: '#DC2626',
    borderWidth: 2,
  },
  qtyErrorText: {
    color: '#DC2626',
    fontSize: 12,
    fontWeight: '600',
    marginTop: 6,
    lineHeight: 17,
  },
  selectedQuantityContainer: {
    backgroundColor: '#fff',
    paddingHorizontal: 12,
    paddingVertical: 12,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: COLORS.primary,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  selectedQuantityLabel: {
    fontSize: 12,
    color: COLORS.textSecondary,
    marginBottom: 4,
  },
  selectedQuantityValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.primary,
  },
  totalPriceBox: { alignItems: 'flex-end' },
  totalPriceLabel: {
    fontSize: 12,
    color: COLORS.textSecondary,
    marginBottom: 2,
  },
  totalPrice: { fontSize: 20, fontWeight: 'bold', color: COLORS.primary },

  /* ===== BUTTONS ===== */
  buttonSection: {
    paddingHorizontal: 15,
    paddingVertical: 15,
    gap: 10,
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
  },
  addToCartButton: {
    backgroundColor: COLORS.primary,
    paddingVertical: 15,
    borderRadius: 8,
    alignItems: 'center',
    elevation: 5,
  },
  disabledButton: {
    backgroundColor: '#9CA3AF',
    opacity: 0.6,
  },
  addToCartButtonText: { color: '#fff', fontSize: 16, fontWeight: 'bold' },
  secondaryButtons: { flexDirection: 'row', gap: 10 },
  wishlistButton: {
    flex: 1,
    backgroundColor: '#F3F4F6',
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#E5E7EB',
  },
  wishlistButtonActive: {
    backgroundColor: '#FEE2E2',
    borderColor: '#DC2626',
  },
  wishlistButtonText: { fontSize: 24 },
  shareButton: {
    flex: 1,
    backgroundColor: '#F3F4F6',
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#E5E7EB',
  },
  shareButtonText: { fontSize: 20 },
  spacer: { height: 20 },

  /* ===== FULL-SCREEN VIEWER ===== */
  viewerContainer: {
    flex: 1,
    backgroundColor: '#000000',
    justifyContent: 'center',
    alignItems: 'center',
  },
  viewerClose: {
    position: 'absolute',
    top: 50,
    right: 20,
    zIndex: 100,
    backgroundColor: 'rgba(255,255,255,0.15)',
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  viewerCloseText: {
    color: '#fff',
    fontSize: 20,
    fontWeight: 'bold',
  },
  viewerCounter: {
    position: 'absolute',
    top: 55,
    left: 20,
    zIndex: 100,
    backgroundColor: 'rgba(255,255,255,0.15)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  viewerCounterText: {
    color: '#fff',
    fontSize: 13,
    fontWeight: '600',
  },
  viewerImageWrapper: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    width: SCREEN_W,
  },
  viewerImage: {
    width: SCREEN_W,
    height: SCREEN_H,
    backgroundColor: '#000',
  },
  viewerDots: {
    position: 'absolute',
    bottom: 50,
    flexDirection: 'row',
    gap: 8,
    zIndex: 100,
  },
  viewerDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: 'rgba(255,255,255,0.3)',
  },
  viewerDotActive: {
    backgroundColor: '#fff',
    width: 20,
  },
  viewerNavLeft: {
    position: 'absolute',
    left: 10,
    zIndex: 100,
    padding: 20,
  },
  viewerNavRight: {
    position: 'absolute',
    right: 10,
    zIndex: 100,
    padding: 20,
  },
  viewerNavArrow: {
    color: '#fff',
    fontSize: 50,
    fontWeight: 'bold',
    textShadowColor: 'rgba(0,0,0,0.5)',
    textShadowRadius: 10,
  },
});