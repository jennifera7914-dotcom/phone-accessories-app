import React from "react";
import {
  Alert,
  FlatList,
  SafeAreaView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useShop } from "../context/ShopContext";

const BULK_AMOUNTS = [10, 15, 20, 30];

export default function CartScreen({ navigation }) {
  const {
    cart,
    changeQuantity,
    addQuantity,
    removeFromCart,
    getCartTotal,
    notifications,
  } = useShop();

  const total = getCartTotal();
  const unread = notifications.filter((n) => !n.read).length;

  const confirmRemove = (item) => {
    Alert.alert("Remove item", `Remove ${item.name} from cart?`, [
      { text: "Cancel", style: "cancel" },
      { text: "Remove", style: "destructive", onPress: () => removeFromCart(item.id) },
    ]);
  };

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.box}>
        <View style={styles.header}>
          <Text style={styles.title}>My Cart</Text>
          <TouchableOpacity onPress={() => navigation.navigate("Notifications")}>
            <Text style={styles.bell}>🔔 {unread > 0 ? unread : ""}</Text>
          </TouchableOpacity>
        </View>

        <FlatList
          data={cart}
          keyExtractor={(item) => item.id}
          ListEmptyComponent={
            <View style={styles.emptyBox}>
              <Text style={styles.emptyIcon}>🛒</Text>
              <Text style={styles.emptyTitle}>Your cart is empty</Text>
              <Text style={styles.emptyText}>Add products from the Home screen.</Text>
              <TouchableOpacity
                style={styles.homeBtn}
                onPress={() => navigation.navigate("Home")}
              >
                <Text style={styles.homeBtnText}>Go to Home</Text>
              </TouchableOpacity>
            </View>
          }
          renderItem={({ item }) => (
            <View style={styles.card}>
              <Text style={styles.name}>
                {item.icon} {item.name}
              </Text>
              {item.variant ? <Text style={styles.variant}>{item.variant}</Text> : null}
              <Text style={styles.price}>
                ₹{item.price} each · Line total ₹{item.price * item.quantity}
              </Text>

              <View style={styles.row}>
                <TouchableOpacity
                  style={styles.btn}
                  onPress={() => changeQuantity(item.id, -1)}
                >
                  <Text style={styles.btnText}>−</Text>
                </TouchableOpacity>
                <Text style={styles.qty}>{item.quantity}</Text>
                <TouchableOpacity
                  style={styles.btn}
                  onPress={() => changeQuantity(item.id, 1)}
                >
                  <Text style={styles.btnText}>+</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={() => confirmRemove(item)}>
                  <Text style={styles.remove}>Remove</Text>
                </TouchableOpacity>
              </View>

              <View style={styles.bulkRow}>
                {BULK_AMOUNTS.map((amt) => (
                  <TouchableOpacity
                    key={amt}
                    style={styles.bulkBtn}
                    onPress={() => addQuantity(item.id, amt)}
                  >
                    <Text style={styles.bulkText}>+{amt}</Text>
                  </TouchableOpacity>
                ))}
              </View>

              <TouchableOpacity
                style={styles.buyBtn}
                onPress={() => navigation.navigate("Checkout", { buyNowId: item.id })}
              >
                <Text style={styles.buyText}>Buy Now</Text>
              </TouchableOpacity>
            </View>
          )}
        />

        <View style={styles.footer}>
          <Text style={styles.total}>Total: ₹{total}</Text>
          <TouchableOpacity
            style={[styles.placeBtn, cart.length === 0 && styles.disabled]}
            disabled={cart.length === 0}
            onPress={() => navigation.navigate("Checkout", { buyNowId: null })}
          >
            <Text style={styles.placeText}>Place Order</Text>
          </TouchableOpacity>

          <View style={styles.links}>
            <TouchableOpacity style={styles.linkBtn} onPress={() => navigation.navigate("Home")}>
              <Text style={styles.link}>Home</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.linkBtn} onPress={() => navigation.navigate("Orders")}>
              <Text style={styles.link}>My Orders</Text>
            </TouchableOpacity>
          </View>
          <View style={styles.links}>
            <TouchableOpacity style={styles.linkBtn} onPress={() => navigation.navigate("Chat")}>
              <Text style={styles.link}>Chat with Shop</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.linkBtn} onPress={() => navigation.navigate("Profile")}>
              <Text style={styles.link}>Profile</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: "#F1F3F6" },
  box: { flex: 1, padding: 16 },
  header: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 12 },
  title: { fontSize: 24, fontWeight: "700", color: "#212121" },
  bell: { fontSize: 16, fontWeight: "700", color: "#D92D20" },
  emptyBox: { alignItems: "center", marginTop: 60 },
  emptyIcon: { fontSize: 46 },
  emptyTitle: { marginTop: 10, fontSize: 18, fontWeight: "700", color: "#212121" },
  emptyText: { marginTop: 6, fontSize: 14, color: "#667085" },
  homeBtn: {
    marginTop: 16,
    paddingHorizontal: 22,
    paddingVertical: 12,
    borderRadius: 8,
    backgroundColor: "#2457C5",
  },
  homeBtnText: { color: "#FFFFFF", fontWeight: "700" },
  card: { backgroundColor: "#FFFFFF", borderRadius: 10, padding: 14, marginBottom: 12 },
  name: { fontSize: 16, fontWeight: "700", color: "#212121" },
  variant: { marginTop: 2, fontSize: 12, color: "#667085" },
  price: { marginTop: 4, color: "#667085" },
  row: { flexDirection: "row", alignItems: "center", marginTop: 10 },
  btn: {
    width: 36,
    height: 36,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: "#D0D5DD",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#FFFFFF",
  },
  btnText: { fontSize: 20, fontWeight: "700" },
  qty: { marginHorizontal: 12, fontSize: 16, fontWeight: "700" },
  remove: { marginLeft: 12, color: "#D92D20", fontWeight: "700" },
  bulkRow: { flexDirection: "row", marginTop: 10 },
  bulkBtn: {
    flex: 1,
    paddingVertical: 8,
    marginRight: 6,
    borderRadius: 6,
    backgroundColor: "#EFF4FF",
    alignItems: "center",
  },
  bulkText: { fontWeight: "700", color: "#2457C5" },
  buyBtn: {
    marginTop: 10,
    padding: 12,
    borderRadius: 6,
    alignItems: "center",
    backgroundColor: "#FB641B",
  },
  buyText: { color: "#FFFFFF", fontWeight: "700" },
  footer: { backgroundColor: "#FFFFFF", borderRadius: 10, padding: 14 },
  total: { fontSize: 20, fontWeight: "700", color: "#212121", textAlign: "center" },
  placeBtn: {
    marginTop: 10,
    padding: 16,
    borderRadius: 8,
    alignItems: "center",
    backgroundColor: "#2457C5",
  },
  disabled: { backgroundColor: "#AAB4C5" },
  placeText: { color: "#FFFFFF", fontWeight: "700", fontSize: 16 },
  links: { flexDirection: "row", marginTop: 8 },
  linkBtn: { flex: 1, alignItems: "center", paddingVertical: 8 },
  link: { color: "#2457C5", fontWeight: "700" },
});