import { useEffect, useState } from "react";
import {
  View,
  Text,
  FlatList,
  Image,
  StyleSheet,
  ActivityIndicator,
  TouchableOpacity,
  Alert,
} from "react-native";
import { useRouter } from "expo-router";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { productService } from "../../services/productService";
import { useTheme } from "../context/ThemeContext";

export default function Home() {
  const router = useRouter();
  const { colors } = useTheme();
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [source, setSource] = useState("loading...");
  const [user, setUser] = useState<any>(null);
  const [isOwner, setIsOwner] = useState(false);

  useEffect(() => {
    // Her products load
    productService
      .getAllProducts()
      .then((data: any) => {
        setProducts(data);
        if (data.length > 0 && data[0].name === "Test Cover") {
          setSource("✅ LIVE from MySQL Backend");
        } else if (data.length > 0) {
          setSource(`✅ ${data.length} products loaded`);
        } else {
          setSource("⚠️ No products yet");
        }
        setLoading(false);
      })
      .catch(() => {
        setLoading(false);
        setSource("⚠️ Backend unreachable");
      });

    // Your login check
    AsyncStorage.getItem("user").then((v) => {
      if (v) setUser(JSON.parse(v));
    });
    AsyncStorage.getItem("admin").then((v) => setIsOwner(!!v));
  }, []);

  const isGuestPreview = !user && isOwner;

  const handleLogout = async () => {
    await AsyncStorage.removeItem("user");
    router.replace("/choose-role" as any);
  };

  if (loading) {
    return (
      <View style={[styles.center, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={{ color: colors.text, marginTop: 10 }}>
          Loading products...
        </Text>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {isGuestPreview && (
        <View style={styles.previewBanner}>
          <Text style={styles.previewText}>
            👁️ Preview Mode - Viewing as Owner
          </Text>
          <Text style={styles.previewSub}>No customer login needed</Text>
        </View>
      )}
      <Text style={[styles.header, { color: colors.text }]}>
        📱 Mobile Accessory Hub
      </Text>
      {user && (
        <Text
          style={{
            textAlign: "center",
            color: colors.subText,
            marginBottom: 4,
          }}
        >
          Welcome {user.name} 👋
        </Text>
      )}
      <Text style={[styles.source, { color: colors.subText }]}>{source}</Text>

      <FlatList
        data={products}
        numColumns={2}
        keyExtractor={(item: any, idx: number) =>
          item.id?.toString() || idx.toString()
        }
        contentContainerStyle={{ padding: 8 }}
        renderItem={({ item }: any) => (
          <View
            style={[
              styles.card,
              { backgroundColor: colors.card, borderColor: colors.border },
            ]}
          >
            <Image
              source={{
                uri:
                  item.image1 ||
                  item.imageUrl1 ||
                  item.image_url_1 ||
                  "https://picsum.photos/seed/test/200",
              }}
              style={styles.img}
            />
            <Text
              style={[styles.name, { color: colors.text }]}
              numberOfLines={2}
            >
              {item.name}
            </Text>
            <Text style={styles.price}>
              ₹{item.price} <Text style={styles.mrp}>₹{item.mrp}</Text>
            </Text>
            <Text style={[styles.stock, { color: colors.subText }]}>
              Stock: {item.stock ?? item.stockQty ?? item.stock_qty ?? 0}
            </Text>
          </View>
        )}
        ListEmptyComponent={
          <Text
            style={{ textAlign: "center", color: colors.subText, padding: 20 }}
          >
            No products yet
          </Text>
        }
        ListFooterComponent={
          <View style={{ padding: 10 }}>
            <TouchableOpacity
              onPress={() => {
                if (isGuestPreview)
                  Alert.alert(
                    "Preview Mode",
                    "Login as a customer to view profile details",
                  );
                else router.push("/profile" as any);
              }}
              style={[styles.btn, { backgroundColor: colors.primary }]}
            >
              <Text style={styles.btnText}>View Profile</Text>
            </TouchableOpacity>

            {isOwner && (
              <TouchableOpacity
                onPress={() => router.replace("/admin-dashboard" as any)}
                style={[styles.ownerBtn, { borderColor: colors.border }]}
              >
                <Text style={[styles.ownerText, { color: colors.primary }]}>
                  🔑 Back to Owner Dashboard
                </Text>
              </TouchableOpacity>
            )}

            {!isGuestPreview && (
              <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout}>
                <Text style={styles.logoutText}>Customer Logout</Text>
              </TouchableOpacity>
            )}
            {isGuestPreview && (
              <TouchableOpacity
                style={styles.logoutBtn}
                onPress={() => router.replace("/admin-dashboard" as any)}
              >
                <Text style={styles.logoutText}>Back to Dashboard</Text>
              </TouchableOpacity>
            )}
          </View>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, paddingTop: 40 },
  center: { flex: 1, justifyContent: "center", alignItems: "center" },
  header: {
    fontSize: 22,
    fontWeight: "bold",
    textAlign: "center",
    marginBottom: 4,
  },
  source: { fontSize: 12, textAlign: "center", marginBottom: 8 },
  previewBanner: {
    backgroundColor: "#FFF3CD",
    padding: 10,
    margin: 10,
    borderRadius: 8,
  },
  previewText: { textAlign: "center", color: "#856404", fontWeight: "600" },
  previewSub: { textAlign: "center", color: "#856404", fontSize: 11 },
  card: {
    borderRadius: 10,
    margin: 5,
    flex: 1,
    padding: 8,
    borderWidth: 1,
    elevation: 2,
  },
  img: { width: "100%", height: 120, borderRadius: 8, backgroundColor: "#eee" },
  name: { fontSize: 12, fontWeight: "600", marginTop: 6 },
  price: { fontSize: 14, fontWeight: "bold", marginTop: 4 },
  mrp: { fontSize: 11, color: "#999", textDecorationLine: "line-through" },
  stock: { fontSize: 11, marginTop: 2 },
  btn: { padding: 12, borderRadius: 8, alignItems: "center", marginTop: 10 },
  btnText: { color: "#fff", fontWeight: "bold" },
  ownerBtn: {
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    alignItems: "center",
    marginTop: 10,
  },
  ownerText: { fontWeight: "bold" },
  logoutBtn: {
    backgroundColor: "#ff3b30",
    padding: 12,
    borderRadius: 8,
    alignItems: "center",
    marginTop: 10,
  },
  logoutText: { color: "#fff", fontWeight: "bold" },
});
