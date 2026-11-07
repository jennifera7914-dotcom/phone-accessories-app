import AsyncStorage from "@react-native-async-storage/async-storage";
import { useRouter } from "expo-router";
import { useEffect, useState } from "react";
import {
    ActivityIndicator,
    ScrollView,
    StyleSheet,
    Switch,
    Text,
    TouchableOpacity,
    View,
} from "react-native";
import { useTheme } from "../context/ThemeContext";

export default function ProfileScreen() {
  const router = useRouter();
  const { isDark, colors, toggleTheme } = useTheme();
  const [user, setUser] = useState<any>(null);
  const [details, setDetails] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      const stored = await AsyncStorage.getItem("user");
      if (stored) {
        const u = JSON.parse(stored);
        setUser(u);
        // Fetch full details from backend - same as admin dashboard shows
        try {
          const res = await fetch(
            `http://localhost:8080/api/admin/customers/${u.userId}`,
          );
          if (res.ok) {
            const data = await res.json();
            setDetails(data);
          } else {
            setDetails(u); // fallback
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
      <View style={[styles.center, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  const display = details || user;

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: colors.background }}
      contentContainerStyle={{ padding: 20, paddingTop: 50 }}
    >
      <TouchableOpacity onPress={() => router.back()}>
        <Text style={{ color: colors.primary, fontSize: 16 }}>← Back</Text>
      </TouchableOpacity>

      <Text style={[styles.title, { color: colors.text }]}>My Profile</Text>

      {/* Dark / Light Toggle - This is App Settings you asked */}
      <View
        style={[
          styles.card,
          { backgroundColor: colors.card, borderColor: colors.border },
        ]}
      >
        <View
          style={{
            flexDirection: "row",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <Text style={[styles.label, { color: colors.text }]}>Appearance</Text>
          <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
            <Text style={{ color: colors.subText }}>
              {isDark ? "Dark" : "Light"}
            </Text>
            <Switch
              value={isDark}
              onValueChange={toggleTheme}
              trackColor={{ false: "#ddd", true: "#6200EE" }}
            />
          </View>
        </View>
        <Text style={{ color: colors.subText, fontSize: 12, marginTop: 5 }}>
          When you change here, whole app colors change White ↔ Dark
        </Text>
      </View>

      {/* Customer Details - Exactly as owner saved in admin.html */}
      <View
        style={[
          styles.card,
          { backgroundColor: colors.card, borderColor: colors.border },
        ]}
      >
        <Text style={[styles.section, { color: colors.primary }]}>
          Customer Details
        </Text>

        <Text style={[styles.label, { color: colors.subText }]}>
          Customer Name
        </Text>
        <Text style={[styles.value, { color: colors.text }]}>
          {display?.name || "-"}
        </Text>

        <Text style={[styles.label, { color: colors.subText }]}>Shop Name</Text>
        <Text style={[styles.value, { color: colors.text }]}>
          {display?.shopName || "-"}
        </Text>

        <Text style={[styles.label, { color: colors.subText }]}>
          Phone Number
        </Text>
        <Text style={[styles.value, { color: colors.text }]}>
          {display?.phone || "-"}
        </Text>

        {display?.alternatePhone ? (
          <>
            <Text style={[styles.label, { color: colors.subText }]}>
              Alternate Phone
            </Text>
            <Text style={[styles.value, { color: colors.text }]}>
              {display.alternatePhone}
            </Text>
          </>
        ) : null}

        <Text style={[styles.label, { color: colors.subText }]}>
          Email Address
        </Text>
        <Text style={[styles.value, { color: colors.text }]}>
          {display?.email || "-"}
        </Text>

        <Text style={[styles.label, { color: colors.subText }]}>
          GST Number
        </Text>
        <Text style={[styles.value, { color: colors.text }]}>
          {display?.gstNumber || "-"}
        </Text>
      </View>

      {/* Shop Address - From addresses table */}
      <View
        style={[
          styles.card,
          { backgroundColor: colors.card, borderColor: colors.border },
        ]}
      >
        <Text style={[styles.section, { color: colors.primary }]}>
          Shop Address
        </Text>
        {display?.address ? (
          <>
            <Text style={[styles.value, { color: colors.text }]}>
              {display.address.line1}
            </Text>
            {display.address.line2 ? (
              <Text style={[styles.value, { color: colors.text }]}>
                {display.address.line2}
              </Text>
            ) : null}
            <Text style={[styles.value, { color: colors.text }]}>
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
          <Text style={[styles.value, { color: colors.subText }]}>
            No address found
          </Text>
        )}
      </View>

      <Text
        style={{
          textAlign: "center",
          color: colors.subText,
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
  center: { flex: 1, justifyContent: "center", alignItems: "center" },
  title: { fontSize: 24, fontWeight: "bold", marginTop: 15, marginBottom: 15 },
  card: { padding: 15, borderRadius: 12, borderWidth: 1, marginBottom: 15 },
  section: { fontWeight: "bold", fontSize: 16, marginBottom: 10 },
  label: { fontSize: 12, marginTop: 8 },
  value: { fontSize: 16, fontWeight: "600", marginTop: 2 },
});
