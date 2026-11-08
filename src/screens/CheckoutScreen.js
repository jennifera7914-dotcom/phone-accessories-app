
import React, { useState } from "react";
import {
  Alert,
  Platform,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

import { useShop } from "../context/ShopContext";
import { BACKEND_URL } from "../api/config";

// Mixed CAPTCHA characters
const CHARS =
  "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789@#$%&*";

const makeCaptcha = () =>
  Array.from(
    { length: 7 },
    () => CHARS[Math.floor(Math.random() * CHARS.length)]
  ).join("");

function notify(title, message) {
  if (Platform.OS === "web") {
    window.alert(`${title}\n\n${message}`);
  } else {
    Alert.alert(title, message);
  }
}

export default function CheckoutScreen({ navigation, route }) {
  const { customer, cart, placeOrder } = useShop();

  const buyNowId = route.params?.buyNowId || null;

  const items = buyNowId
    ? cart.filter((i) => i.id === buyNowId)
    : cart;

  const total = items.reduce(
    (sum, item) => sum + item.price * item.quantity,
    0
  );

  const [captcha, setCaptcha] = useState(makeCaptcha);
  const [typed, setTyped] = useState("");
  const [wrong, setWrong] = useState(false);
  const [verified, setVerified] = useState(false);
  const [sending, setSending] = useState(false);

  const hasAddress = !!customer?.addressSavedByAdmin;

  const addressText = hasAddress
    ? `${customer.addressLine}, ${customer.city}${
        customer.state ? ", " + customer.state : ""
      } - ${customer.pincode}`
    : "";

  const newCaptcha = () => {
    setCaptcha(makeCaptcha());
    setTyped("");
    setWrong(false);
  };

  // Step 1: Verify the CAPTCHA
  const verifyCaptcha = () => {
    if (typed.trim() !== captcha) {
      setCaptcha(makeCaptcha());
      setTyped("");
      setWrong(true);
      return;
    }

    setWrong(false);
    setVerified(true);
  };

  // Step 2: Place the order after verification
  const placeFinalOrder = async () => {
    if (sending) return;

    if (items.length === 0) {
      notify("Empty cart", "There are no items to order.");
      return;
    }

    if (!customer?.token) {
      notify("Login required", "Please log in again.");
      return;
    }

    if (!hasAddress) {
      notify(
        "Address missing",
        "Please contact the shop to save your delivery address."
      );
      return;
    }

    if (!verified) {
      notify("Verification required", "Please verify the CAPTCHA first.");
      return;
    }

    const payload = {
      items: items.map((item) => ({
        productId: item.productId,
        quantity: item.quantity,
      })),
    };

    setSending(true);

    try {
      const response = await fetch(`${BACKEND_URL}/api/orders`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Customer-Token": customer.token,
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errorMessage = await response.text();
        throw new Error(
          errorMessage || `Server replied with status ${response.status}`
        );
      }

      const saved = await response.json();

      await placeOrder({ onlyItemId: buyNowId });

      navigation.replace("OrderConfirmation", {
        orderId: saved.orderCode,
        total: saved.total,
      });
    } catch (error) {
      notify("Order not saved", error.message);
    } finally {
      setSending(false);
    }
  };

  if (!customer) {
    return (
      <SafeAreaView style={styles.safe}>
        <View style={styles.center}>
          <Text style={styles.title}>Preparing your account...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!hasAddress) {
    return (
      <SafeAreaView style={styles.safe}>
        <View style={styles.center}>
          <Text style={styles.bigIcon}>📍</Text>
          <Text style={styles.title}>Delivery address not saved</Text>
          <Text style={styles.muted}>
            Please contact the shop owner to save your delivery address.
          </Text>
          <Text style={styles.code}>{customer.customerCode}</Text>

          <TouchableOpacity
            style={styles.button}
            onPress={() => navigation.navigate("Profile")}
          >
            <Text style={styles.buttonText}>Open My Profile</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  if (items.length === 0) {
    return (
      <SafeAreaView style={styles.safe}>
        <View style={styles.center}>
          <Text style={styles.bigIcon}>🛒</Text>
          <Text style={styles.title}>Nothing to checkout</Text>

          <TouchableOpacity
            style={styles.button}
            onPress={() => navigation.navigate("Home")}
          >
            <Text style={styles.buttonText}>Go to Home</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  // GREEN TICK SCREEN AFTER CAPTCHA VERIFICATION
  if (verified) {
    return (
      <SafeAreaView style={styles.safe}>
        <View style={styles.successContainer}>
          <View style={styles.tickCircle}>
            <Text style={styles.tick}>✓</Text>
          </View>

          <Text style={styles.successTitle}>
            Verification Successful!
          </Text>

          <Text style={styles.successMessage}>
            Great! Your security check is complete.
            You can now proceed with your order.
          </Text>

          <View style={styles.verifiedCard}>
            <Text style={styles.verifiedLabel}>
              Order Total
            </Text>
            <Text style={styles.verifiedAmount}>
              ₹{total}
            </Text>
            <Text style={styles.verifiedStatus}>
              ✓ CAPTCHA Verified
            </Text>
          </View>

          <TouchableOpacity
            style={[
              styles.button,
              styles.finalButton,
              sending && styles.disabled,
            ]}
            onPress={placeFinalOrder}
            disabled={sending}
          >
            <Text style={styles.buttonText}>
              {sending
                ? "Placing Your Order..."
                : `YES, PLACE MY ORDER · ₹${total}`}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => {
              setVerified(false);
              newCaptcha();
            }}
            disabled={sending}
          >
            <Text style={styles.back}>
              ← Back to checkout
            </Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={styles.container}>
        <Text style={styles.heading}>Confirm Your Order</Text>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>📍 Delivery Address</Text>

          <Text style={styles.name}>
            {customer.name || "Customer"}
          </Text>

          <Text style={styles.muted}>
            {customer.phone || ""}
          </Text>

          <Text style={styles.address}>{addressText}</Text>

          <Text style={styles.note}>
            Address saved by the shop
          </Text>
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>
            🛒 Order Summary ({items.length} products)
          </Text>

          {items.map((item) => (
            <View key={item.id} style={styles.itemRow}>
              <Text style={styles.itemName}>
                {item.icon} {item.name} × {item.quantity}
              </Text>

              <Text style={styles.price}>
                ₹{item.price * item.quantity}
              </Text>
            </View>
          ))}

          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>Total Amount</Text>
            <Text style={styles.total}>₹{total}</Text>
          </View>
        </View>

        {/* MIXED CAPTCHA SECTION */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>
            🔒 Security Verification
          </Text>

          <Text style={styles.muted}>
            Enter the mixed characters shown below to verify
            your checkout.
          </Text>

          <View style={styles.captchaBox}>
            <Text style={styles.captcha}>{captcha}</Text>
          </View>

          <TouchableOpacity onPress={newCaptcha}>
            <Text style={styles.refresh}>
              ↻ Generate a new CAPTCHA
            </Text>
          </TouchableOpacity>

          <TextInput
            style={[styles.input, wrong && styles.inputWrong]}
            value={typed}
            onChangeText={(value) => {
              setTyped(value);
              setWrong(false);
            }}
            autoCapitalize="none"
            autoCorrect={false}
            maxLength={7}
            placeholder="Enter all 7 characters"
            placeholderTextColor="#98A2B3"
          />

          {wrong && (
            <Text style={styles.error}>
              Incorrect CAPTCHA. A new code has been generated.
              Please try again.
            </Text>
          )}

          <TouchableOpacity
            style={styles.button}
            onPress={verifyCaptcha}
          >
            <Text style={styles.buttonText}>
              ✓ VERIFY CAPTCHA
            </Text>
          </TouchableOpacity>

          <Text style={styles.note}>
            Your order will be placed only after successful
            verification and your final confirmation.
          </Text>
        </View>

        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.back}>← Back</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: "#F1F3F6",
  },
  container: {
    padding: 16,
    paddingBottom: 30,
  },
  heading: {
    fontSize: 23,
    fontWeight: "800",
    color: "#212121",
    marginBottom: 16,
  },
  card: {
    backgroundColor: "#FFFFFF",
    borderRadius: 14,
    padding: 16,
    marginBottom: 14,
    elevation: 2,
  },
  cardTitle: {
    fontSize: 17,
    fontWeight: "700",
    color: "#212121",
    marginBottom: 12,
  },
  name: {
    fontSize: 16,
    fontWeight: "700",
    color: "#212121",
  },
  address: {
    marginTop: 6,
    fontSize: 14,
    color: "#475467",
    lineHeight: 22,
  },
  muted: {
    fontSize: 13,
    color: "#667085",
    marginTop: 5,
    lineHeight: 20,
  },
  note: {
    fontSize: 12,
    color: "#12B76A",
    marginTop: 12,
    textAlign: "center",
    lineHeight: 18,
  },
  itemRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginVertical: 7,
  },
  itemName: {
    flex: 1,
    fontSize: 14,
    color: "#344054",
  },
  price: {
    fontWeight: "700",
    color: "#212121",
  },
  totalRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    borderTopWidth: 1,
    borderTopColor: "#EAECF0",
    marginTop: 12,
    paddingTop: 12,
  },
  totalLabel: {
    fontSize: 17,
    fontWeight: "700",
  },
  total: {
    fontSize: 19,
    fontWeight: "800",
    color: "#12B76A",
  },
  captchaBox: {
    backgroundColor: "#F0F4F8",
    borderWidth: 1,
    borderColor: "#D0D5DD",
    borderRadius: 12,
    paddingVertical: 18,
    paddingHorizontal: 8,
    marginTop: 16,
    marginBottom: 10,
    alignItems: "center",
  },
  captcha: {
    fontSize: 29,
    fontWeight: "900",
    letterSpacing: 5,
    color: "#2457C5",
    fontStyle: "italic",
  },
  refresh: {
    color: "#2457C5",
    textAlign: "center",
    fontWeight: "700",
    marginVertical: 12,
  },
  input: {
    borderWidth: 2,
    borderColor: "#D0D5DD",
    borderRadius: 9,
    padding: 13,
    fontSize: 18,
    textAlign: "center",
    color: "#212121",
  },
  inputWrong: {
    borderColor: "#D92D20",
  },
  error: {
    color: "#D92D20",
    textAlign: "center",
    marginTop: 10,
    fontSize: 13,
  },
  button: {
    backgroundColor: "#12B76A",
    padding: 17,
    borderRadius: 10,
    alignItems: "center",
    marginTop: 16,
  },
  buttonText: {
    color: "#FFFFFF",
    fontWeight: "800",
    fontSize: 15,
    textAlign: "center",
  },
  disabled: {
    backgroundColor: "#AAB4C5",
  },
  back: {
    textAlign: "center",
    color: "#2457C5",
    fontWeight: "700",
    padding: 14,
  },
  center: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 24,
  },
  bigIcon: {
    fontSize: 45,
  },
  title: {
    fontSize: 20,
    fontWeight: "700",
    textAlign: "center",
    marginTop: 12,
  },
  code: {
    fontSize: 18,
    color: "#2457C5",
    fontWeight: "700",
    margin: 12,
  },

  // GREEN TICK SCREEN
  successContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 24,
  },
  tickCircle: {
    width: 125,
    height: 125,
    borderRadius: 63,
    backgroundColor: "#DDF7E5",
    borderWidth: 5,
    borderColor: "#12B76A",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 25,
  },
  tick: {
    fontSize: 82,
    fontWeight: "900",
    color: "#12B76A",
    lineHeight: 95,
  },
  successTitle: {
    fontSize: 25,
    fontWeight: "900",
    color: "#12B76A",
    textAlign: "center",
  },
  successMessage: {
    fontSize: 15,
    color: "#667085",
    textAlign: "center",
    lineHeight: 23,
    marginTop: 12,
    marginBottom: 25,
  },
  verifiedCard: {
    width: "100%",
    backgroundColor: "#FFFFFF",
    borderRadius: 14,
    padding: 20,
    alignItems: "center",
    elevation: 2,
  },
  verifiedLabel: {
    fontSize: 14,
    color: "#667085",
  },
  verifiedAmount: {
    fontSize: 30,
    fontWeight: "900",
    color: "#212121",
    marginVertical: 8,
  },
  verifiedStatus: {
    color: "#12B76A",
    fontWeight: "700",
    marginTop: 5,
  },
  finalButton: {
    width: "100%",
    paddingVertical: 19,
  },
});
