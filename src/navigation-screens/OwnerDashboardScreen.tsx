import AsyncStorage from "@react-native-async-storage/async-storage";
import { useNavigation } from "@react-navigation/native";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { useTheme } from "../context/ThemeContext";

const API = "http://localhost:8080/api/admin/customers";

export default function AdminDashboardScreen() {
  const navigation = useNavigation<any>();
  const { colors } = useTheme();
  const [adminEmail, setAdminEmail] = useState("");
  const [customers, setCustomers] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState("");

  // Form fields
  const [name, setName] = useState("");
  const [shopName, setShopName] = useState("");
  const [phone, setPhone] = useState("");
  const [alternatePhone, setAlternatePhone] = useState("");
  const [email, setEmail] = useState("");
  const [line1, setLine1] = useState("");
  const [line2, setLine2] = useState("");
  const [city, setCity] = useState("");
  const [state, setState] = useState("");
  const [pincode, setPincode] = useState("");
  const [gstNumber, setGstNumber] = useState("");
  const [editingId, setEditingId] = useState<number | null>(null);

  useEffect(() => {
    checkAdmin();
  }, []);

  const checkAdmin = async () => {
    const admin = await AsyncStorage.getItem("admin");
    if (!admin) {
      navigation.replace("OwnerLogin");
      return;
    }
    const a = JSON.parse(admin);
    setAdminEmail(a.email);
    loadCustomers();
  };

  const showMsg = (text: string, isError = false) => {
    setMsg((isError ? "âŒ " : "âœ… ") + text);
    setTimeout(() => setMsg(""), 3000);
  };

  const loadCustomers = async () => {
    try {
      const res = await fetch(API);
      const data = await res.json();
      setCustomers(data);
    } catch (e: any) {
      showMsg("Failed to load. Is IntelliJ running?", true);
    }
  };

  const clearForm = () => {
    setName("");
    setShopName("");
    setPhone("");
    setAlternatePhone("");
    setEmail("");
    setLine1("");
    setLine2("");
    setCity("");
    setState("");
    setPincode("");
    setGstNumber("");
    setEditingId(null);
  };

  const handleSave = async () => {
    if (!name || !shopName || !phone || !email || !line1 || !pincode) {
      showMsg(
        "Please fill Name, Shop Name, Phone, Email, Line1, Pincode",
        true,
      );
      return;
    }
    if (!/^\d{10}$/.test(phone)) {
      showMsg("Phone must be exactly 10 digits", true);
      return;
    }
    if (alternatePhone && !/^\d{10}$/.test(alternatePhone)) {
      showMsg("Alternate phone must be 10 digits", true);
      return;
    }
    if (!email.toLowerCase().endsWith("@gmail.com")) {
      showMsg("Email must end with @gmail.com", true);
      return;
    }
    if (!/^\d{6}$/.test(pincode)) {
      showMsg("Pincode must be 6 digits", true);
      return;
    }

    const body = {
      name,
      shopName,
      phone,
      alternatePhone,
      email: email.toLowerCase(),
      gstNumber,
      line1,
      line2,
      city,
      state,
      pincode,
    };
    setLoading(true);
    try {
      let res;
      if (editingId === null) {
        res = await fetch(API, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        });
      } else {
        res = await fetch(`${API}/${editingId}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        });
      }
      const out = await res.json();
      if (res.ok) {
        showMsg(out.message);
        clearForm();
        loadCustomers();
      } else showMsg(out.message || "Failed", true);
    } catch (e) {
      showMsg("Cannot connect to backend", true);
    }
    setLoading(false);
  };

  const handleEdit = async (id: number) => {
    try {
      const res = await fetch(`${API}/${id}`);
      const u = await res.json();
      setName(u.name || "");
      setShopName(u.shopName || "");
      setPhone(u.phone || "");
      setAlternatePhone(u.alternatePhone || "");
      setEmail(u.email || "");
      setGstNumber(u.gstNumber || "");
      setLine1(u.address?.line1 || "");
      setLine2(u.address?.line2 || "");
      setCity(u.address?.city || "");
      setState(u.address?.state || "");
      setPincode(u.address?.pincode || "");
      setEditingId(id);
    } catch {
      showMsg("Failed to load for edit", true);
    }
  };

  const handleDelete = async (id: number) => {
    Alert.alert("Confirm", `Delete customer ID ${id}?`, [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: async () => {
          try {
            const res = await fetch(`${API}/${id}`, { method: "DELETE" });
            const out = await res.json();
            showMsg(out.message);
            if (editingId === id) clearForm();
            loadCustomers();
          } catch {
            showMsg("Delete failed", true);
          }
        },
      },
    ]);
  };

  const handleLogout = async () => {
    await AsyncStorage.removeItem("admin");
    navigation.replace("ChooseRole");
  };

  // YOUR REQUEST: Direct switch to Customer View, no login again
  const handleViewAsCustomer = () => {
    navigation.navigate("Home");
  };

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: colors.background }}
      contentContainerStyle={{ padding: 20, paddingTop: 50 }}
    >
      <View
        style={{
          flexDirection: "row",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <View>
          <Text style={[styles.title, { color: colors.text }]}>
            Owner Dashboard
          </Text>
          <Text style={{ color: colors.primary, fontSize: 12 }}>
            {adminEmail}
          </Text>
        </View>
        <TouchableOpacity onPress={handleLogout} style={styles.logoutBtn}>
          <Text style={styles.logoutText}>Logout</Text>
        </TouchableOpacity>
      </View>

      <TouchableOpacity
        onPress={handleViewAsCustomer}
        style={[
          styles.switchBtn,
          { backgroundColor: colors.card, borderColor: colors.border },
        ]}
      >
        <Text style={[styles.switchText, { color: colors.primary }]}>
          ðŸ‘ï¸ View as Customer
        </Text>
        <Text style={{ color: colors.subText, fontSize: 11 }}>
          Direct to Customer HOME - No login again
        </Text>
      </TouchableOpacity>

      {msg ? (
        <Text
          style={{
            textAlign: "center",
            marginTop: 10,
            color: msg.includes("âŒ") ? "red" : "green",
          }}
        >
          {msg}
        </Text>
      ) : null}

      <View
        style={[
          styles.card,
          { backgroundColor: colors.card, borderColor: colors.border },
        ]}
      >
        <Text style={[styles.cardTitle, { color: colors.text }]}>
          {editingId ? `Edit Customer - ID ${editingId}` : "Add New Customer"}
        </Text>
        <TextInput
          style={[
            styles.input,
            { borderColor: colors.border, color: colors.text },
          ]}
          placeholder="Customer Name *"
          placeholderTextColor={colors.subText}
          value={name}
          onChangeText={setName}
        />
        <TextInput
          style={[
            styles.input,
            { borderColor: colors.border, color: colors.text },
          ]}
          placeholder="Shop Name *"
          placeholderTextColor={colors.subText}
          value={shopName}
          onChangeText={setShopName}
        />
        <TextInput
          style={[
            styles.input,
            { borderColor: colors.border, color: colors.text },
          ]}
          placeholder="Phone * (10 digits)"
          placeholderTextColor={colors.subText}
          keyboardType="number-pad"
          maxLength={10}
          value={phone}
          onChangeText={(t) => setPhone(t.replace(/[^0-9]/g, "").slice(0, 10))}
        />
        <TextInput
          style={[
            styles.input,
            { borderColor: colors.border, color: colors.text },
          ]}
          placeholder="Alternate Phone (optional)"
          placeholderTextColor={colors.subText}
          keyboardType="number-pad"
          maxLength={10}
          value={alternatePhone}
          onChangeText={(t) =>
            setAlternatePhone(t.replace(/[^0-9]/g, "").slice(0, 10))
          }
        />
        <TextInput
          style={[
            styles.input,
            { borderColor: colors.border, color: colors.text },
          ]}
          placeholder="Email * (must end with @gmail.com)"
          placeholderTextColor={colors.subText}
          value={email}
          onChangeText={setEmail}
          autoCapitalize="none"
        />
        <TextInput
          style={[
            styles.input,
            { borderColor: colors.border, color: colors.text },
          ]}
          placeholder="Shop Address Line 1 *"
          placeholderTextColor={colors.subText}
          value={line1}
          onChangeText={setLine1}
        />
        <TextInput
          style={[
            styles.input,
            { borderColor: colors.border, color: colors.text },
          ]}
          placeholder="Line 2"
          placeholderTextColor={colors.subText}
          value={line2}
          onChangeText={setLine2}
        />
        <View style={{ flexDirection: "row", gap: 10 }}>
          <TextInput
            style={[
              styles.input,
              { flex: 1, borderColor: colors.border, color: colors.text },
            ]}
            placeholder="City (optional)"
            placeholderTextColor={colors.subText}
            value={city}
            onChangeText={setCity}
          />
          <TextInput
            style={[
              styles.input,
              { flex: 1, borderColor: colors.border, color: colors.text },
            ]}
            placeholder="State (optional)"
            placeholderTextColor={colors.subText}
            value={state}
            onChangeText={setState}
          />
        </View>
        <TextInput
          style={[
            styles.input,
            { borderColor: colors.border, color: colors.text },
          ]}
          placeholder="Pincode * (6 digits)"
          placeholderTextColor={colors.subText}
          keyboardType="number-pad"
          maxLength={6}
          value={pincode}
          onChangeText={(t) => setPincode(t.replace(/[^0-9]/g, "").slice(0, 6))}
        />
        <TextInput
          style={[
            styles.input,
            { borderColor: colors.border, color: colors.text },
          ]}
          placeholder="GST (optional)"
          placeholderTextColor={colors.subText}
          value={gstNumber}
          onChangeText={setGstNumber}
        />

        <TouchableOpacity
          onPress={handleSave}
          disabled={loading}
          style={[styles.primaryBtn, { backgroundColor: colors.primary }]}
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.btnText}>
              {editingId ? "Update Customer" : "Add Customer"}
            </Text>
          )}
        </TouchableOpacity>
        {editingId ? (
          <TouchableOpacity
            onPress={clearForm}
            style={[styles.secondaryBtn, { backgroundColor: colors.border }]}
          >
            <Text
              style={{
                color: colors.text,
                textAlign: "center",
                fontWeight: "600",
              }}
            >
              Cancel
            </Text>
          </TouchableOpacity>
        ) : null}
      </View>

      <View
        style={[
          styles.card,
          { backgroundColor: colors.card, borderColor: colors.border },
        ]}
      >
        <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
          <Text style={[styles.cardTitle, { color: colors.text }]}>
            Customers
          </Text>
          <TouchableOpacity onPress={loadCustomers}>
            <Text style={{ color: colors.primary }}>Refresh</Text>
          </TouchableOpacity>
        </View>
        {customers.length === 0 ? (
          <Text
            style={{
              color: colors.subText,
              textAlign: "center",
              marginTop: 10,
            }}
          >
            No customers yet
          </Text>
        ) : (
          customers.map((u, index) => (
            <View
              key={u.id}
              style={[styles.customerRow, { borderColor: colors.border }]}
            >
              <Text style={[styles.sno, { color: colors.text }]}>
                S.No {index + 1}{" "}
                <Text style={{ color: colors.subText, fontSize: 10 }}>
                  ID:{u.id}
                </Text>
              </Text>
              <Text style={[styles.cName, { color: colors.text }]}>
                {u.name} - {u.shopName}
              </Text>
              <Text style={{ color: colors.subText, fontSize: 12 }}>
                {u.phone}{" "}
                {u.alternatePhone ? ` | Alt: ${u.alternatePhone}` : ""}
              </Text>
              <Text style={{ color: colors.primary, fontSize: 11 }}>
                {u.email}
              </Text>
              {u.address ? (
                <Text style={{ color: colors.subText, fontSize: 11 }}>
                  {u.address.line1}, {u.address.city} - {u.address.pincode}
                </Text>
              ) : null}
              <View style={{ flexDirection: "row", gap: 10, marginTop: 8 }}>
                <TouchableOpacity
                  onPress={() => handleEdit(u.id)}
                  style={[styles.smallBtn, { backgroundColor: "#007AFF" }]}
                >
                  <Text style={styles.smallText}>Edit</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={() => handleDelete(u.id)}
                  style={[styles.smallBtn, { backgroundColor: "#ff3b30" }]}
                >
                  <Text style={styles.smallText}>Delete</Text>
                </TouchableOpacity>
              </View>
            </View>
          ))
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  title: { fontSize: 20, fontWeight: "bold" },
  switchBtn: {
    padding: 15,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: "center",
    marginTop: 15,
  },
  switchText: { fontWeight: "bold", fontSize: 14 },
  card: { padding: 15, borderRadius: 12, borderWidth: 1, marginTop: 15 },
  cardTitle: { fontWeight: "bold", marginBottom: 10 },
  input: { borderWidth: 1, borderRadius: 8, padding: 12, marginBottom: 8 },
  primaryBtn: {
    padding: 14,
    borderRadius: 8,
    alignItems: "center",
    marginTop: 10,
  },
  secondaryBtn: {
    padding: 14,
    borderRadius: 8,
    alignItems: "center",
    marginTop: 8,
  },
  btnText: { color: "#fff", fontWeight: "bold" },
  customerRow: { borderWidth: 1, borderRadius: 8, padding: 10, marginTop: 10 },
  sno: { fontWeight: "bold", fontSize: 12 },
  cName: { fontWeight: "600", marginTop: 2 },
  smallBtn: { paddingVertical: 6, paddingHorizontal: 15, borderRadius: 6 },
  smallText: { color: "#fff", fontSize: 12, fontWeight: "600" },
  logoutBtn: {
    backgroundColor: "#ff3b30",
    paddingVertical: 8,
    paddingHorizontal: 15,
    borderRadius: 8,
  },
  logoutText: { color: "#fff", fontWeight: "bold", fontSize: 12 },
});

