import React, { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Image,
  Platform,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import * as ImagePicker from "expo-image-picker";
import * as FileSystem from "expo-file-system/legacy";
import { BACKEND_URL } from "../api/config";
import { useShop } from "../context/ShopContext";

const REASONS = [
  "Defective Product",
  "Wrong Item Received",
  "Damaged in Shipping",
  "Not as Described",
  "Changed Mind",
  "Other",
];

const REQUEST_STATUS = {
  submitted: { label: "Waiting for shop review", color: "#F79009", bg: "#FFFAEB" },
  approved: { label: "Approved", color: "#12B76A", bg: "#ECFDF3" },
  rejected: { label: "Rejected", color: "#D92D20", bg: "#FEF3F2" },
};

function notify(title, message) {
  if (Platform.OS === "web") {
    window.alert(`${title}\n\n${message}`);
    return;
  }
  Alert.alert(title, message);
}

// Orders from MySQL store items as TEXT. This handles text, lists, and itemsJson safely.
function itemsText(order) {
  if (Array.isArray(order.items)) return order.items.join(", ");
  if (typeof order.items === "string" && order.items.trim() !== "") return order.items;
  if (order.itemsJson) {
    try {
      const arr = JSON.parse(order.itemsJson);
      if (Array.isArray(arr)) {
        return arr.map((i) => `${i.name} Ã—${i.quantity}`).join(", ");
      }
    } catch (e) {
      // ignore and fall through
    }
  }
  return "Items not available";
}

async function imageToBase64(uri) {
  if (Platform.OS === "web") {
    const blob = await (await fetch(uri)).blob();
    const type = blob.type || "image/jpeg";
    const base64 = await new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(String(reader.result).split(",")[1]);
      reader.onerror = () => reject(new Error("Could not read the photo"));
      reader.readAsDataURL(blob);
    });
    return { base64, type };
  }
  const base64 = await FileSystem.readAsStringAsync(uri, { encoding: "base64" });
  return { base64, type: "image/jpeg" };
}

export default function ReturnScreen({ route, navigation }) {
  const { customer, orders } = useShop();

  const deliveredOrders = (orders || []).filter((o) => o.status === "delivered");
  const preselectId = route.params?.orderId ?? null;

  const [selectedOrderId, setSelectedOrderId] = useState(() => {
    if (preselectId != null && deliveredOrders.some((o) => o.id === preselectId)) {
      return preselectId;
    }
    return deliveredOrders.length > 0 ? deliveredOrders[0].id : null;
  });
  const [actionType, setActionType] = useState("return");
  const [reason, setReason] = useState(null);
  const [details, setDetails] = useState("");
  const [photo, setPhoto] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [successInfo, setSuccessInfo] = useState(null);

  const [myRequests, setMyRequests] = useState([]);
  const [reqLoading, setReqLoading] = useState(true);

  const loadRequests = useCallback(async () => {
    if (!customer?.token) {
      setReqLoading(false);
      return;
    }
    setReqLoading(true);
    try {
      const res = await fetch(`${BACKEND_URL}/api/returns/mine`, {
        headers: { "X-Customer-Token": customer.token },
      });
      const data = res.ok ? await res.json() : [];
      setMyRequests(Array.isArray(data) ? data : []);
    } catch (e) {
      setMyRequests([]);
    }
    setReqLoading(false);
  }, [customer?.token]);

  useEffect(() => {
    loadRequests();
    const unsub = navigation.addListener("focus", loadRequests);
    return unsub;
  }, [loadRequests, navigation]);

  const pickFromGallery = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ["images"],
        allowsEditing: true,
        quality: 0.6,
      });
      if (!result.canceled && result.assets?.[0]?.uri) {
        setPhoto({ uri: result.assets[0].uri });
      }
    } catch (e) {
      notify("Notice", "Could not open the gallery.");
    }
  };

  const takeWithCamera = async () => {
    try {
      const perm = await ImagePicker.requestCameraPermissionsAsync();
      if (perm.status !== "granted") {
        notify("Permission needed", "Please allow camera access.");
        return;
      }
      const result = await ImagePicker.launchCameraAsync({
        allowsEditing: true,
        quality: 0.6,
      });
      if (!result.canceled && result.assets?.[0]?.uri) {
        setPhoto({ uri: result.assets[0].uri });
      }
    } catch (e) {
      notify("Notice", "Could not open the camera.");
    }
  };

  const handleSubmit = async () => {
    if (!customer?.token) {
      notify("Please wait", "Your account is still loading. Try again in a moment.");
      return;
    }
    if (!selectedOrderId) {
      notify("Select an order", "Please select a delivered order.");
      return;
    }
    if (!reason) {
      notify("Choose the issue", "Please tap the reason that matches your problem.");
      return;
    }

    setSubmitting(true);
    try {
      let photoBase64 = null;
      let photoType = null;
      if (photo) {
        const converted = await imageToBase64(photo.uri);
        photoBase64 = converted.base64;
        photoType = converted.type;
      }

      const res = await fetch(`${BACKEND_URL}/api/returns`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Customer-Token": customer.token,
        },
        body: JSON.stringify({
          orderId: selectedOrderId,
          actionType,
          reason,
          details,
          photoBase64,
          photoType,
        }),
      });

      if (!res.ok) {
        const text = await res.text();
        throw new Error(text || "Request failed");
      }

      const data = await res.json();
      setSuccessInfo(data);
      setReason(null);
      setDetails("");
      setPhoto(null);
      setActionType("return");
      await loadRequests();
    } catch (e) {
      notify("Could not submit", e.message);
    }
    setSubmitting(false);
  };

  // ---------- success view ----------
  if (successInfo) {
    return (
      <SafeAreaView style={styles.safe}>
        <ScrollView contentContainerStyle={styles.box}>
          <View style={styles.successCard}>
            <Text style={styles.successIcon}>âœ…</Text>
            <Text style={styles.successTitle}>
              {successInfo.actionType === "exchange" ? "Exchange request sent" : "Return request sent"}
            </Text>
            <Text style={styles.successBody}>
              Order {successInfo.orderCode} Â· Reason: {successInfo.reason}
            </Text>
            <Text style={styles.pendingBadge}>Waiting for shop review</Text>
            <Text style={styles.muted}>
              The shop will approve or reject it. You will see the decision below and in Notifications.
            </Text>
            <TouchableOpacity style={styles.primaryBtn} onPress={() => navigation.navigate("Notifications")}>
              <Text style={styles.primaryBtnText}>Open Notifications</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.secondaryBtn} onPress={() => setSuccessInfo(null)}>
              <Text style={styles.secondaryBtnText}>Back to my requests</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </SafeAreaView>
    );
  }

  // ---------- main form ----------
  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={styles.box}>
        <Text style={styles.title}>Return / Exchange</Text>
        <Text style={styles.muted}>Only delivered orders can be returned or exchanged.</Text>

        {deliveredOrders.length === 0 ? (
          <View style={styles.card}>
            <Text style={styles.body}>You have no delivered orders yet.</Text>
          </View>
        ) : (
          <>
            <Text style={styles.sectionLabel}>1. Select the order</Text>
            {deliveredOrders.map((order) => {
              const selected = selectedOrderId === order.id;
              return (
                <TouchableOpacity
                  key={String(order.id)}
                  style={[styles.orderCard, selected && styles.orderCardSelected]}
                  onPress={() => setSelectedOrderId(order.id)}
                >
                  <View style={styles.rowBetween}>
                    <Text style={styles.orderCode}>
                      {selected ? "ðŸ”˜" : "âšª"} {order.orderCode}
                    </Text>
                    <Text style={styles.body}>â‚¹{order.total}</Text>
                  </View>
                  <Text style={styles.body}>{itemsText(order)}</Text>
                  <Text style={styles.muted}>Ordered on {order.orderDate}</Text>
                </TouchableOpacity>
              );
            })}

            <Text style={styles.sectionLabel}>2. What do you want?</Text>
            <View style={styles.rowGap}>
              <TouchableOpacity
                style={[styles.choiceBtn, actionType === "return" && styles.choiceBtnActive]}
                onPress={() => setActionType("return")}
              >
                <Text style={[styles.choiceText, actionType === "return" && styles.choiceTextActive]}>
                  ðŸ“¦ Return
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.choiceBtn, actionType === "exchange" && styles.choiceBtnActive]}
                onPress={() => setActionType("exchange")}
              >
                <Text style={[styles.choiceText, actionType === "exchange" && styles.choiceTextActive]}>
                  ðŸ”„ Exchange
                </Text>
              </TouchableOpacity>
            </View>

            <Text style={styles.sectionLabel}>3. What is the issue? (tap one)</Text>
            {REASONS.map((r) => {
              const selected = reason === r;
              return (
                <TouchableOpacity
                  key={r}
                  style={[styles.reasonCard, selected && styles.reasonCardSelected]}
                  onPress={() => setReason(r)}
                >
                  <Text style={[styles.body, selected && styles.reasonTextSelected]}>
                    {selected ? "ðŸ”˜" : "âšª"} {r}
                  </Text>
                </TouchableOpacity>
              );
            })}

            <Text style={styles.sectionLabel}>4. Tell us more (optional)</Text>
            <TextInput
              style={styles.detailsInput}
              placeholder="Describe the problem in a few words..."
              placeholderTextColor="#98A2B3"
              value={details}
              onChangeText={setDetails}
              multiline
              maxLength={1000}
            />

            <Text style={styles.sectionLabel}>5. Photo of the product (optional)</Text>
            <View style={styles.rowGap}>
              <TouchableOpacity style={styles.photoBtn} onPress={pickFromGallery}>
                <Text style={styles.photoBtnText}>ðŸ“ Gallery</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.photoBtn} onPress={takeWithCamera}>
                <Text style={styles.photoBtnText}>ðŸ“· Camera</Text>
              </TouchableOpacity>
            </View>

            {photo ? (
              <View style={styles.previewBox}>
                <Image source={{ uri: photo.uri }} style={styles.previewImage} />
                <TouchableOpacity onPress={() => setPhoto(null)}>
                  <Text style={styles.removePhoto}>âœ• Remove photo</Text>
                </TouchableOpacity>
              </View>
            ) : (
              <Text style={styles.muted}>A photo helps the shop decide faster.</Text>
            )}

            <TouchableOpacity
              style={[styles.submitBtn, (!selectedOrderId || !reason || submitting) && styles.disabled]}
              disabled={!selectedOrderId || !reason || submitting}
              onPress={handleSubmit}
            >
              <Text style={styles.submitBtnText}>
                {submitting
                  ? "Sending..."
                  : `Submit ${actionType === "exchange" ? "Exchange" : "Return"} Request`}
              </Text>
            </TouchableOpacity>
          </>
        )}

        <Text style={styles.sectionLabel}>My requests</Text>
        {reqLoading ? (
          <ActivityIndicator color="#2457C5" />
        ) : myRequests.length === 0 ? (
          <Text style={styles.muted}>You have not requested any return or exchange yet.</Text>
        ) : (
          myRequests.map((r) => {
            const cfg = REQUEST_STATUS[r.status] || REQUEST_STATUS.submitted;
            return (
              <View key={String(r.id)} style={styles.card}>
                <View style={styles.rowBetween}>
                  <Text style={styles.orderCode}>
                    {r.actionType === "exchange" ? "ðŸ”„ Exchange" : "ðŸ“¦ Return"} Â· {r.orderCode}
                  </Text>
                  <View style={[styles.badge, { backgroundColor: cfg.bg }]}>
                    <Text style={[styles.badgeText, { color: cfg.color }]}>{cfg.label}</Text>
                  </View>
                </View>
                <Text style={styles.body}>Reason: {r.reason}</Text>
                {r.details ? <Text style={styles.muted}>{r.details}</Text> : null}
                {r.hasPhoto ? (
                  <Image source={{ uri: BACKEND_URL + r.photoUrl }} style={styles.requestThumb} />
                ) : null}
                {r.adminNote ? <Text style={styles.adminNote}>Shop note: {r.adminNote}</Text> : null}
                <Text style={styles.muted}>Requested on {r.requestDate}</Text>
              </View>
            );
          })
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: "#F1F3F6" },
  box: { padding: 16, paddingBottom: 40 },
  title: { fontSize: 24, fontWeight: "700", color: "#212121" },
  muted: { marginTop: 4, fontSize: 13, color: "#667085" },
  body: { fontSize: 14, color: "#475467", marginTop: 4 },
  sectionLabel: {
    marginTop: 18,
    marginBottom: 8,
    fontSize: 13,
    fontWeight: "700",
    color: "#667085",
    textTransform: "uppercase",
  },
  card: { backgroundColor: "#FFFFFF", borderRadius: 10, padding: 14, marginTop: 10 },
  orderCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 10,
    padding: 14,
    marginBottom: 8,
    borderWidth: 2,
    borderColor: "#D0D5DD",
  },
  orderCardSelected: { borderColor: "#2457C5", backgroundColor: "#EFF4FF" },
  rowBetween: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  orderCode: { fontSize: 16, fontWeight: "700", color: "#212121" },
  rowGap: { flexDirection: "row", gap: 8 },
  choiceBtn: {
    flex: 1,
    padding: 14,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: "#D0D5DD",
    backgroundColor: "#FFFFFF",
    alignItems: "center",
  },
  choiceBtnActive: { borderColor: "#2457C5", backgroundColor: "#2457C5" },
  choiceText: { fontSize: 14, fontWeight: "700", color: "#475467" },
  choiceTextActive: { color: "#FFFFFF" },
  reasonCard: {
    padding: 14,
    borderRadius: 10,
    borderWidth: 1.5,
    borderColor: "#D0D5DD",
    backgroundColor: "#FFFFFF",
    marginBottom: 8,
  },
  reasonCardSelected: { borderColor: "#2457C5", backgroundColor: "#EFF4FF" },
  reasonTextSelected: { color: "#2457C5", fontWeight: "700" },
  detailsInput: {
    backgroundColor: "#FFFFFF",
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#D0D5DD",
    padding: 12,
    minHeight: 80,
    textAlignVertical: "top",
    fontSize: 14,
    color: "#212121",
  },
  photoBtn: {
    flex: 1,
    padding: 12,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#2457C5",
    backgroundColor: "#FFFFFF",
    alignItems: "center",
  },
  photoBtnText: { color: "#2457C5", fontWeight: "700" },
  previewBox: { alignItems: "center", marginTop: 12 },
  previewImage: { width: 200, height: 150, borderRadius: 8, backgroundColor: "#E4E7EC" },
  removePhoto: { marginTop: 8, color: "#D92D20", fontWeight: "700" },
  submitBtn: {
    marginTop: 20,
    padding: 16,
    borderRadius: 10,
    alignItems: "center",
    backgroundColor: "#12B76A",
  },
  disabled: { backgroundColor: "#AAB4C5" },
  submitBtnText: { color: "#FFFFFF", fontWeight: "700", fontSize: 16 },
  successCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    padding: 20,
    alignItems: "center",
    marginTop: 20,
  },
  successIcon: { fontSize: 52 },
  successTitle: { marginTop: 10, fontSize: 20, fontWeight: "700", color: "#12B76A" },
  successBody: { marginTop: 8, fontSize: 14, color: "#475467", textAlign: "center" },
  pendingBadge: {
    marginTop: 10,
    backgroundColor: "#FFFAEB",
    color: "#B54708",
    fontWeight: "700",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    overflow: "hidden",
    fontSize: 13,
  },
  primaryBtn: {
    marginTop: 18,
    alignSelf: "stretch",
    padding: 14,
    borderRadius: 10,
    backgroundColor: "#2457C5",
    alignItems: "center",
  },
  primaryBtnText: { color: "#FFFFFF", fontWeight: "700" },
  secondaryBtn: { marginTop: 10, padding: 12, alignItems: "center" },
  secondaryBtnText: { color: "#2457C5", fontWeight: "700" },
  badge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 6 },
  badgeText: { fontSize: 11, fontWeight: "700" },
  requestThumb: { width: 120, height: 90, borderRadius: 8, marginTop: 8 },
  adminNote: { marginTop: 6, fontSize: 13, color: "#212121", fontWeight: "600" },
});
