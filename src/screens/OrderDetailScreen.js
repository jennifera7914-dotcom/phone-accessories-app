import React from "react";
import {
  Alert,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useShop } from "../context/ShopContext";

const steps = [
  { key: "placed", label: "Order Placed" },
  { key: "packed", label: "Packed" },
  { key: "delivered", label: "Delivered" },
];

export default function OrderDetailScreen({ route, navigation }) {
  const { orderId } = route.params;
  const { orders, cancelOrder } = useShop();

  const order = orders.find((item) => item.id === orderId);

  if (!order) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.container}>
          <Text style={styles.heading}>Order not found</Text>
        </View>
      </SafeAreaView>
    );
  }

  const isCancelled = order.status === "cancelled";
  const currentStep = isCancelled ? -1 : steps.findIndex((step) => step.key === order.status);

  const handleCancel = () => {
    Alert.alert("Cancel this order?", `Order ${order.id} will be cancelled.`, [
      { text: "Keep Order", style: "cancel" },
      {
        text: "Yes, Cancel",
        style: "destructive",
        onPress: () => cancelOrder(order.id),
      },
    ]);
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.container}>
        <View style={styles.card}>
          <Text style={styles.heading}>{order.id}</Text>
          <Text style={styles.subText}>📅 {order.date}</Text>
          <Text style={styles.subText}>💳 {order.paymentMethod}</Text>
          <Text style={styles.subText}>📍 {order.address}</Text>
          {isCancelled && <Text style={styles.cancelledText}>❌ This order was cancelled.</Text>}
        </View>

        {!isCancelled && (
          <View style={styles.card}>
            <Text style={styles.sectionTitle}>Tracking</Text>
            {steps.map((step, index) => {
              const done = index <= currentStep;
              return (
                <View key={step.key} style={styles.stepRow}>
                  <View style={[styles.dot, done ? styles.dotDone : styles.dotPending]} />
                  <Text style={done ? styles.stepDone : styles.stepPending}>{step.label}</Text>
                </View>
              );
            })}
          </View>
        )}

        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Items</Text>
          {order.items.map((item) => (
            <Text key={item} style={styles.itemText}>• {item}</Text>
          ))}
          <Text style={styles.total}>Total: ₹{order.total}</Text>
        </View>

        {order.status === "placed" && (
          <TouchableOpacity style={styles.cancelButton} onPress={handleCancel}>
            <Text style={styles.cancelButtonText}>Cancel Order</Text>
          </TouchableOpacity>
        )}

        {order.status === "delivered" && (
          <TouchableOpacity
            style={styles.returnButton}
            onPress={() => navigation.navigate("Return", { orderId: order.id })}
          >
            <Text style={styles.returnButtonText}>🔄 Request Return / Exchange</Text>
          </TouchableOpacity>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: "#F1F3F6" },
  container: { padding: 16, paddingBottom: 32 },
  card: { marginBottom: 12, padding: 14, borderRadius: 10, backgroundColor: "#FFFFFF" },
  heading: { fontSize: 22, fontWeight: "700", color: "#212121" },
  subText: { marginTop: 6, fontSize: 14, color: "#667085" },
  cancelledText: { marginTop: 10, fontSize: 14, fontWeight: "700", color: "#D92D20" },
  sectionTitle: { fontSize: 16, fontWeight: "700", color: "#212121", marginBottom: 10 },
  stepRow: { flexDirection: "row", alignItems: "center", marginVertical: 8 },
  dot: { width: 14, height: 14, borderRadius: 7, marginRight: 10 },
  dotDone: { backgroundColor: "#12B76A" },
  dotPending: { backgroundColor: "#D0D5DD" },
  stepDone: { fontSize: 15, fontWeight: "600", color: "#12B76A" },
  stepPending: { fontSize: 15, color: "#98A2B3" },
  itemText: { fontSize: 14, color: "#344054", marginBottom: 6 },
  total: { marginTop: 10, fontSize: 16, fontWeight: "700", color: "#12B76A" },
  cancelButton: { marginTop: 4, padding: 16, borderRadius: 10, alignItems: "center", backgroundColor: "#FEF3F2", borderWidth: 1, borderColor: "#D92D20" },
  cancelButtonText: { fontSize: 15, fontWeight: "700", color: "#D92D20" },
  returnButton: { marginTop: 4, padding: 16, borderRadius: 10, alignItems: "center", backgroundColor: "#2457C5" },
  returnButtonText: { fontSize: 15, fontWeight: "700", color: "#FFFFFF" },
});