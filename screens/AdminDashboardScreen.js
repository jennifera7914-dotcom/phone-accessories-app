import AsyncStorage from "@react-native-async-storage/async-storage";
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
import { API_BASE_URL } from "../src/api/config";

const API = `${API_BASE_URL}/api/admin/customers`;

export default function AdminDashboardScreen({ navigation }) {
  const [adminEmail, setAdminEmail] = useState("");
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState("");

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
  const [editingId, setEditingId] = useState(null);

  useEffect(() => {
    checkAdmin();
  }, []);

  const checkAdmin = async () => {
    const admin = await AsyncStorage.getItem("admin");
    if (!admin) {
      navigation.replace("AdminLoginScreen");
      return;
    }
    setAdminEmail(JSON.parse(admin).email);
    loadCustomers();
  };

  const showMsg = (text, isError = false) => {
    setMsg((isError ? "❌ " : "✅ ") + text);
    setTimeout(() => setMsg(""), 3000);
  };

  const loadCustomers = async () => {
    try {
      const res = await fetch(API);
      const data = await res.json();
      setCustomers(data);
    } catch {
      showMsg("Failed to load. Is server running?", true);
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
      showMsg("Phone must be 10 digits", true);
      return;
    }
    if (alternatePhone && !/^\d{10}$/.test(alternatePhone)) {
      showMsg("Alt phone must be 10 digits", true);
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
    } catch {
      showMsg("Cannot connect to backend", true);
    }
    setLoading(false);
  };

  const handleEdit = async (id) => {
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

  const handleDelete = (id) => {
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
    navigation.replace("ChooseRoleScreen");
  };

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: "#fff" }}
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
          <Text style={styles.title}>Owner Dashboard</Text>
          <Text style={{ color: "#6200EE", fontSize: 12 }}>{adminEmail}</Text>
        </View>
        <TouchableOpacity onPress={handleLogout} style={styles.logoutBtn}>
          <Text style={styles.logoutText}>Logout</Text>
        </TouchableOpacity>
      </View>

      <TouchableOpacity
        onPress={() => navigation.navigate("HomeScreen")}
        style={styles.switchBtn}
      >
        <Text style={styles.switchText}>👁️ View App</Text>
        <Text style={{ color: "#666", fontSize: 11 }}>
          Go to Customer App as Guest Preview
        </Text>
      </TouchableOpacity>

      {msg ? (
        <Text
          style={{
            textAlign: "center",
            marginTop: 10,
            color: msg.includes("❌") ? "red" : "green",
          }}
        >
          {msg}
        </Text>
      ) : null}

      <View style={styles.card}>
        <Text style={styles.cardTitle}>
          {editingId ? `Edit Customer - ID ${editingId}` : "Add New Customer"}
        </Text>
        <TextInput
          style={styles.input}
          placeholder="Customer Name *"
          value={name}
          onChangeText={setName}
        />
        <TextInput
          style={styles.input}
          placeholder="Shop Name *"
          value={shopName}
          onChangeText={setShopName}
        />
        <TextInput
          style={styles.input}
          placeholder="Phone * (10 digits)"
          keyboardType="number-pad"
          maxLength={10}
          value={phone}
          onChangeText={(t) => setPhone(t.replace(/[^0-9]/g, "").slice(0, 10))}
        />
        <TextInput
          style={styles.input}
          placeholder="Alternate Phone (optional)"
          keyboardType="number-pad"
          maxLength={10}
          value={alternatePhone}
          onChangeText={(t) =>
            setAlternatePhone(t.replace(/[^0-9]/g, "").slice(0, 10))
          }
        />
        <TextInput
          style={styles.input}
          placeholder="Email * (must end with @gmail.com)"
          value={email}
          onChangeText={setEmail}
          autoCapitalize="none"
        />
        <TextInput
          style={styles.input}
          placeholder="Shop Address Line 1 *"
          value={line1}
          onChangeText={setLine1}
        />
        <TextInput
          style={styles.input}
          placeholder="Line 2"
          value={line2}
          onChangeText={setLine2}
        />
        <View style={{ flexDirection: "row", gap: 10 }}>
          <TextInput
            style={[styles.input, { flex: 1 }]}
            placeholder="City"
            value={city}
            onChangeText={setCity}
          />
          <TextInput
            style={[styles.input, { flex: 1 }]}
            placeholder="State"
            value={state}
            onChangeText={setState}
          />
        </View>
        <TextInput
          style={styles.input}
          placeholder="Pincode * (6 digits)"
          keyboardType="number-pad"
          maxLength={6}
          value={pincode}
          onChangeText={(t) => setPincode(t.replace(/[^0-9]/g, "").slice(0, 6))}
        />
        <TextInput
          style={styles.input}
          placeholder="GST (optional)"
          value={gstNumber}
          onChangeText={setGstNumber}
        />

        <TouchableOpacity
          onPress={handleSave}
          disabled={loading}
          style={styles.primaryBtn}
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
          <TouchableOpacity onPress={clearForm} style={styles.secondaryBtn}>
            <Text
              style={{ color: "#000", textAlign: "center", fontWeight: "600" }}
            >
              Cancel
            </Text>
          </TouchableOpacity>
        ) : null}
      </View>

      <View style={styles.card}>
        <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
          <Text style={styles.cardTitle}>Customers</Text>
          <TouchableOpacity onPress={loadCustomers}>
            <Text style={{ color: "#6200EE" }}>Refresh</Text>
          </TouchableOpacity>
        </View>
        {customers.length === 0 ? (
          <Text style={{ color: "#666", textAlign: "center", marginTop: 10 }}>
            No customers yet
          </Text>
        ) : (
          customers.map((u, index) => (
            <View key={u.id} style={styles.customerRow}>
              <Text style={styles.sno}>
                S.No {index + 1}{" "}
                <Text style={{ color: "#999", fontSize: 10 }}>ID:{u.id}</Text>
              </Text>
              <Text style={styles.cName}>
                {u.name} - {u.shopName}
              </Text>
              <Text style={{ color: "#666", fontSize: 12 }}>
                {u.phone}
                {u.alternatePhone ? ` | Alt: ${u.alternatePhone}` : ""}
              </Text>
              <Text style={{ color: "#6200EE", fontSize: 11 }}>{u.email}</Text>
              {u.address ? (
                <Text style={{ color: "#666", fontSize: 11 }}>
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
  title: { fontSize: 20, fontWeight: "bold", color: "#000" },
  switchBtn: {
    padding: 15,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#ddd",
    alignItems: "center",
    marginTop: 15,
    backgroundColor: "#f5f5f5",
  },
  switchText: { fontWeight: "bold", fontSize: 14, color: "#6200EE" },
  card: {
    padding: 15,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#ddd",
    marginTop: 15,
    backgroundColor: "#f9f9f9",
  },
  cardTitle: { fontWeight: "bold", marginBottom: 10, color: "#000" },
  input: {
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 8,
    padding: 12,
    marginBottom: 8,
    backgroundColor: "#fff",
  },
  primaryBtn: {
    backgroundColor: "#6200EE",
    padding: 14,
    borderRadius: 8,
    alignItems: "center",
    marginTop: 10,
  },
  secondaryBtn: {
    backgroundColor: "#e0e0e0",
    padding: 14,
    borderRadius: 8,
    alignItems: "center",
    marginTop: 8,
  },
  btnText: { color: "#fff", fontWeight: "bold" },
  customerRow: {
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 8,
    padding: 10,
    marginTop: 10,
    backgroundColor: "#fff",
  },
  sno: { fontWeight: "bold", fontSize: 12, color: "#000" },
  cName: { fontWeight: "600", marginTop: 2, color: "#000" },
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
