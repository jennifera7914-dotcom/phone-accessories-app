
import React from "react";
import {
  SafeAreaView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

export default function OrderConfirmationScreen({ route, navigation }) {
  const orderId = route.params?.orderId || "Not available";
  const total = route.params?.total ?? 0;

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>

        <View style={styles.circle}>
          <Text style={styles.tick}>✓</Text>
        </View>

        <Text style={styles.heading}>
          Order Placed Successfully!
        </Text>

        <Text style={styles.subheading}>
          Thank you for shopping with us!
          Your order has been successfully placed
          and sent to the shop owner.
        </Text>

        <View style={styles.box}>
          <Text style={styles.label}>Order ID</Text>
          <Text style={styles.value}>{orderId}</Text>

          <View style={styles.divider} />

          <Text style={styles.label}>Total Amount</Text>
          <Text style={styles.amount}>₹{total}</Text>

          <View style={styles.divider} />

          <Text style={styles.label}>Order Status</Text>
          <View style={styles.statusBox}>
            <Text style={styles.status}>● Order Placed</Text>
          </View>
        </View>

        <Text style={styles.note}>
          📦 Your order is now with the shop owner.
          You can check its status anytime in My Orders.
        </Text>

        <TouchableOpacity
          style={styles.primaryButton}
          onPress={() => navigation.navigate("Orders")}
        >
          <Text style={styles.primaryButtonText}>
            View My Orders
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.secondaryButton}
          onPress={() => navigation.navigate("Home")}
        >
          <Text style={styles.secondaryButtonText}>
            Continue Shopping
          </Text>
        </TouchableOpacity>

      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#F1F3F6",
  },
  container: {
    flex: 1,
    padding: 24,
    justifyContent: "center",
  },
  circle: {
    alignSelf: "center",
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: "#12B76A",
    alignItems: "center",
    justifyContent: "center",
  },
  tick: {
    fontSize: 58,
    color: "#FFFFFF",
    fontWeight: "700",
  },
  heading: {
    marginTop: 22,
    fontSize: 25,
    fontWeight: "800",
    color: "#212121",
    textAlign: "center",
  },
  subheading: {
    marginTop: 10,
    fontSize: 15,
    color: "#475467",
    textAlign: "center",
    lineHeight: 23,
  },
  box: {
    marginTop: 28,
    padding: 20,
    borderRadius: 14,
    backgroundColor: "#FFFFFF",
  },
  label: {
    fontSize: 13,
    color: "#667085",
    marginBottom: 5,
  },
  value: {
    fontSize: 17,
    fontWeight: "700",
    color: "#212121",
    marginBottom: 12,
  },
  amount: {
    fontSize: 25,
    fontWeight: "800",
    color: "#12B76A",
    marginBottom: 12,
  },
  divider: {
    height: 1,
    backgroundColor: "#EAECF0",
    marginVertical: 12,
  },
  statusBox: {
    alignSelf: "flex-start",
    backgroundColor: "#ECFDF3",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
  },
  status: {
    color: "#027A48",
    fontWeight: "700",
    fontSize: 13,
  },
  note: {
    marginTop: 18,
    fontSize: 14,
    color: "#475467",
    textAlign: "center",
    lineHeight: 22,
  },
  primaryButton: {
    marginTop: 26,
    padding: 17,
    borderRadius: 10,
    alignItems: "center",
    backgroundColor: "#2457C5",
  },
  primaryButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "700",
  },
  secondaryButton: {
    marginTop: 12,
    padding: 15,
    borderRadius: 10,
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#D0D5DD",
  },
  secondaryButtonText: {
    color: "#2457C5",
    fontSize: 15,
    fontWeight: "700",
  },
});
