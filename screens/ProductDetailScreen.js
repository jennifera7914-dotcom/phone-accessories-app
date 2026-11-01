import React, { useState, useEffect } from 'react';
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
} from 'react-native';
import { productService, cartService, wishlistService } from '../services/productService';
import { COLORS } from '../constants/colors';

export default function ProductDetailScreen({ route, navigation }) {
  const { productId } = route.params;
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedImage, setSelectedImage] = useState(0);
  const [quantity, setQuantity] = useState('10');
  const [customQuantity, setCustomQuantity] = useState('');
  const [isInWishlist, setIsInWishlist] = useState(false);
  const [cartLoading, setCartLoading] = useState(false);

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

  const getStatusColor = (status) => {
    switch (status) {
      case 'in-stock':
        return COLORS.success;
      case 'low-stock':
        return '#FFC107';
      case 'out-of-stock':
        return COLORS.danger;
      default:
        return COLORS.textSecondary;
    }
  };

  const getStatusLabel = (status) => {
    switch (status) {
      case 'in-stock':
        return '✅ In Stock';
      case 'low-stock':
        return '⚠️ Low Stock Soon';
      case 'out-of-stock':
        return '❌ Out of Stock';
      default:
        return 'Unknown';
    }
  };

  const handleQuantitySelect = (qty) => {
    setQuantity(qty.toString());
    setCustomQuantity('');
  };

  const handleCustomQuantity = (text) => {
    setCustomQuantity(text);
    setQuantity('');
  };

  const finalQuantity = customQuantity || quantity;
  const totalPrice = finalQuantity * product.price;

  const handleAddToCart = async () => {
    if (!finalQuantity || finalQuantity === '0') {
      Alert.alert('Error', 'Please select a quantity');
      return;
    }

    try {
      setCartLoading(true);
      await cartService.addToCart(product, parseInt(finalQuantity));
      setCartLoading(false);
      Alert.alert('Success', `Added ${finalQuantity} units to cart!`, [
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

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {/* ===== IMAGE SECTION ===== */}
      <View style={styles.imageSection}>
        <Image
          source={{ uri: [product.image1, product.image2][selectedImage] }}
          style={styles.mainImage}
          resizeMode="contain"
        />

        {/* Discount badge */}
        {product.mrp > product.price && (
          <View style={styles.discountCircle}>
            <Text style={styles.discountPercent}>
              {Math.round(((product.mrp - product.price) / product.mrp) * 100)}%
            </Text>
          </View>
        )}

        {/* Thumbnail indicators */}
        <View style={styles.imageIndicators}>
          <TouchableOpacity
            style={[
              styles.indicator,
              selectedImage === 0 && styles.indicatorActive,
            ]}
            onPress={() => setSelectedImage(0)}
          >
            <Image source={{ uri: product.image1 }} style={styles.indicatorImage} />
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.indicator,
              selectedImage === 1 && styles.indicatorActive,
            ]}
            onPress={() => setSelectedImage(1)}
          >
            <Image source={{ uri: product.image2 }} style={styles.indicatorImage} />
          </TouchableOpacity>
        </View>
      </View>

      {/* ===== PRODUCT INFO ===== */}
      <View style={styles.infoSection}>
        <Text style={styles.productName}>{product.name}</Text>

        {/* Pricing */}
        <View style={styles.priceContainer}>
          <Text style={styles.mrp}>MRP: ₹{product.mrp}</Text>
          <Text style={styles.sellingPrice}>₹{product.price}</Text>
          <View style={styles.savingBadge}>
            <Text style={styles.savingText}>
              Save ₹{product.mrp - product.price}
            </Text>
          </View>
        </View>

        {/* Rating */}
        {product.rating && (
          <View style={styles.ratingContainer}>
            <Text style={styles.rating}>⭐ {product.rating}</Text>
            <Text style={styles.ratingText}>(Highly Rated)</Text>
          </View>
        )}

        {/* Stock Status */}
        <View
          style={[
            styles.statusContainer,
            { borderColor: getStatusColor(product.status) },
          ]}
        >
          <Text
            style={[
              styles.statusLabel,
              { color: getStatusColor(product.status) },
            ]}
          >
            {getStatusLabel(product.status)}
          </Text>
          <Text style={styles.stockCount}>
            {product.stock > 0 ? `${product.stock} units available` : 'No stock'}
          </Text>
        </View>

        {/* Description */}
        <View style={styles.descriptionSection}>
          <Text style={styles.sectionTitle}>Description</Text>
          <Text style={styles.descriptionText}>{product.description}</Text>
        </View>

        {/* Quantity Selector */}
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

          {/* Custom input */}
          <View style={styles.customQuantityContainer}>
            <Text style={styles.customQuantityLabel}>Or enter custom quantity:</Text>
            <TextInput
              style={styles.customQuantityInput}
              placeholder="e.g., 7, 8, 25, 200..."
              keyboardType="number-pad"
              value={customQuantity}
              onChangeText={handleCustomQuantity}
              placeholderTextColor={COLORS.textSecondary}
            />
          </View>

          {/* Selected quantity display */}
          <View style={styles.selectedQuantityContainer}>
            <View>
              <Text style={styles.selectedQuantityLabel}>Selected Quantity:</Text>
              <Text style={styles.selectedQuantityValue}>{finalQuantity} units</Text>
            </View>
            <View style={styles.totalPriceBox}>
              <Text style={styles.totalPriceLabel}>Total:</Text>
              <Text style={styles.totalPrice}>₹{totalPrice}</Text>
            </View>
          </View>
        </View>
      </View>

      {/* ===== ACTION BUTTONS ===== */}
      <View style={styles.buttonSection}>
        <TouchableOpacity
          style={[
            styles.addToCartButton,
            product.status === 'out-of-stock' && styles.disabledButton,
            cartLoading && { opacity: 0.6 },
          ]}
          onPress={handleAddToCart}
          disabled={product.status === 'out-of-stock' || cartLoading}
        >
          <Text style={styles.addToCartButtonText}>
            {cartLoading ? 'Adding...' : '🛒 Add to Cart'}
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

      {/* Spacer */}
      <View style={styles.spacer} />
    </ScrollView>
  );
}

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
  imageSection: {
    backgroundColor: COLORS.lightGray,
    paddingVertical: 20,
    position: 'relative',
  },
  mainImage: {
    width: '100%',
    height: 300,
  },
  discountCircle: {
    position: 'absolute',
    top: 30,
    right: 20,
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: COLORS.danger,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 3,
    elevation: 5,
  },
  discountPercent: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
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
    borderColor: COLORS.border,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 1,
  },
  indicatorActive: {
    borderColor: COLORS.primary,
    borderWidth: 3,
  },
  indicatorImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  infoSection: {
    paddingHorizontal: 15,
    paddingVertical: 20,
  },
  productName: {
    fontSize: 22,
    fontWeight: 'bold',
    color: COLORS.textPrimary,
    marginBottom: 15,
  },
  priceContainer: {
    backgroundColor: COLORS.lightGray,
    paddingHorizontal: 15,
    paddingVertical: 15,
    borderRadius: 8,
    marginBottom: 15,
    borderLeftWidth: 4,
    borderLeftColor: COLORS.primary,
  },
  mrp: {
    fontSize: 13,
    color: COLORS.textSecondary,
    marginBottom: 6,
  },
  sellingPrice: {
    fontSize: 26,
    fontWeight: 'bold',
    color: COLORS.primary,
    marginBottom: 8,
  },
  savingBadge: {
    backgroundColor: COLORS.success,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 4,
    alignSelf: 'flex-start',
  },
  savingText: {
    color: 'white',
    fontSize: 12,
    fontWeight: 'bold',
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 15,
    gap: 8,
  },
  rating: {
    fontSize: 16,
    color: COLORS.accent,
    fontWeight: 'bold',
  },
  ratingText: {
    fontSize: 12,
    color: COLORS.textSecondary,
  },
  statusContainer: {
    borderWidth: 2,
    borderRadius: 8,
    paddingHorizontal: 15,
    paddingVertical: 12,
    marginBottom: 20,
  },
  statusLabel: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  stockCount: {
    fontSize: 12,
    color: COLORS.textSecondary,
  },
  descriptionSection: {
    marginBottom: 20,
  },
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
  quantitySection: {
    backgroundColor: COLORS.lightGray,
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
    backgroundColor: 'white',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: COLORS.border,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 2,
    elevation: 1,
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
  quickSelectTextActive: {
    color: 'white',
  },
  customQuantityContainer: {
    marginBottom: 15,
  },
  customQuantityLabel: {
    fontSize: 13,
    color: COLORS.textSecondary,
    marginBottom: 8,
  },
  customQuantityInput: {
    backgroundColor: 'white',
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 6,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    color: COLORS.textPrimary,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 1,
    elevation: 1,
  },
  selectedQuantityContainer: {
    backgroundColor: 'white',
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
  totalPriceBox: {
    alignItems: 'flex-end',
  },
  totalPriceLabel: {
    fontSize: 12,
    color: COLORS.textSecondary,
    marginBottom: 2,
  },
  totalPrice: {
    fontSize: 20,
    fontWeight: 'bold',
    color: COLORS.primary,
  },
  buttonSection: {
    paddingHorizontal: 15,
    paddingVertical: 15,
    gap: 10,
    backgroundColor: 'white',
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },
  addToCartButton: {
    backgroundColor: COLORS.primary,
    paddingVertical: 15,
    borderRadius: 8,
    alignItems: 'center',
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 5,
  },
  disabledButton: {
    backgroundColor: COLORS.textSecondary,
    opacity: 0.6,
  },
  addToCartButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  secondaryButtons: {
    flexDirection: 'row',
    gap: 10,
  },
  wishlistButton: {
    flex: 1,
    backgroundColor: COLORS.secondary,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: COLORS.secondary,
  },
  wishlistButtonActive: {
    backgroundColor: '#FFEBEE',
    borderColor: COLORS.danger,
  },
  wishlistButtonText: {
    fontSize: 24,
  },
  shareButton: {
    flex: 1,
    backgroundColor: COLORS.accent,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  shareButtonText: {
    fontSize: 20,
  },
  spacer: {
    height: 20,
  },
});