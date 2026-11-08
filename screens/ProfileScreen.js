import AsyncStorage from "@react-native-async-storage/async-storage";
import { useEffect, useState } from "react";
import {
    ActivityIndicator,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from "react-native";
import { API_BASE_URL } from "../src/api/config";

export default function ProfileScreen({ navigation }) {
  const [user, setUser] = useState(null);
  const [details, setDetails] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      const stored = await AsyncStorage.getItem("user");
      if (stored) {
        const u = JSON.parse(stored);
        setUser(u);
        try {
          const res = await fetch(
            `${API_BASE_URL}/api/admin/customers/${u.userId}`,
          );
          if (res.ok) {
            const data = await res.json();
            setDetails(data);
          } else {
            setDetails(u);
          }
        } catch {
          setDetails(u);
        }
      }
      setLoading(false);
    };
    load();
  }, []);

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#6200EE" />
      </View>
    );
  }

  const display = details || user;

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: "#fff" }}
      contentContainerStyle={{ padding: 20, paddingTop: 50 }}
    >
      <TouchableOpacity onPress={() => navigation.goBack()}>
        <Text style={{ color: "#6200EE", fontSize: 16 }}>← Back</Text>
      </TouchableOpacity>

      <Text style={styles.title}>My Profile</Text>

      <View style={styles.card}>
        <Text style={styles.section}>Customer Details</Text>

        <Text style={styles.label}>Customer Name</Text>
        <Text style={styles.value}>{display?.name || "-"}</Text>

        <Text style={styles.label}>Shop Name</Text>
        <Text style={styles.value}>{display?.shopName || "-"}</Text>

        <Text style={styles.label}>Phone Number</Text>
        <Text style={styles.value}>{display?.phone || "-"}</Text>

        {display?.alternatePhone ? (
          <>
            <Text style={styles.label}>Alternate Phone</Text>
            <Text style={styles.value}>{display.alternatePhone}</Text>
          </>
        ) : null}

        <Text style={styles.label}>Email Address</Text>
        <Text style={styles.value}>{display?.email || "-"}</Text>

        <Text style={styles.label}>GST Number</Text>
        <Text style={styles.value}>{display?.gstNumber || "-"}</Text>
      </View>

      <View style={styles.card}>
        <Text style={styles.section}>Shop Address</Text>
        {display?.address ? (
          <>
            <Text style={styles.value}>{display.address.line1}</Text>
            {display.address.line2 ? (
              <Text style={styles.value}>{display.address.line2}</Text>
            ) : null}
            <Text style={styles.value}>
              {[
                display.address.city,
                display.address.state,
                display.address.pincode,
              ]
                .filter(Boolean)
                .join(", ")}
            </Text>
          </>
        ) : (
          <Text style={{ color: "#666" }}>No address found</Text>
        )}
      </View>

      <Text
        style={{
          textAlign: "center",
          color: "#666",
          fontSize: 12,
          marginTop: 10,
        }}
      >
        To update details, please contact shop owner.
      </Text>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  center: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#fff",
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    marginTop: 15,
    marginBottom: 15,
    color: "#000",
  },
  card: {
    padding: 15,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#ddd",
    marginBottom: 15,
    backgroundColor: "#f9f9f9",
  },
  section: {
    fontWeight: "bold",
    fontSize: 16,
    marginBottom: 10,
    color: "#6200EE",
  },
  label: { fontSize: 12, marginTop: 8, color: "#666" },
  value: { fontSize: 16, fontWeight: "600", marginTop: 2, color: "#000" },
});
