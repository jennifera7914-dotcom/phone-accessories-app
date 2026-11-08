
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Platform,
  RefreshControl,
  SafeAreaView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { BACKEND_URL } from "../api/config";
import { useShop } from "../context/ShopContext";

const STATUS = {
  placed: { label: "ORDER PLACED", color: "#2457C5", bg: "#EFF4FF" },
  delivered: { label: "DELIVERED", color: "#12B76A", bg: "#ECFDF3" },
  cancelled: { label: "CANCELLED", color: "#D92D20", bg: "#FEF3F2" },
};

const STEPS = [
  { key: "placed", label: "Order Placed" },
  { key: "delivered", label: "Delivered" },
];

const MONTHS = [
  "Jan", "Feb", "Mar", "Apr", "May", "Jun",
  "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
];

const pad = (n) => String(n).padStart(2, "0");

function getStatus(status) {
  if (status === "cancelled") return "cancelled";
  if (status === "delivered") return "delivered";
  return "placed";
}

function formatDateTime(value) {
  if (!value) return "—";

  const d = new Date(value);

  if (Number.isNaN(d.getTime())) return String(value);

  let h = d.getHours();
  const ampm = h >= 12 ? "PM" : "AM";
  h = h % 12 || 12;

  return `${pad(d.getDate())} ${MONTHS[d.getMonth()]} ${d.getFullYear()}, ${pad(h)}:${pad(d.getMinutes())} ${ampm}`;
}

function parseItemsJson(order) {
  if (!order.itemsJson) return null;

  try {
    const arr = JSON.parse(order.itemsJson);
    return Array.isArray(arr) ? arr : null;
  } catch (e) {
    return null;
  }
}

function confirmAction(title, message, onYes) {
  if (Platform.OS === "web") {
    if (window.confirm(`${title}\n\n${message}`)) onYes();
    return;
  }

  Alert.alert(title, message, [
    { text: "No", style: "cancel" },
    { text: "Yes", style: "destructive", onPress: onYes },
  ]);
}

function notify(title, message) {
  if (Platform.OS === "web") {
    window.alert(`${title}\n\n${message}`);
    return;
  }

  Alert.alert(title, message);
}

export default function OrderHistoryScreen({ navigation }) {
  const {
    customer,
    orders,
    reloadOrders,
    cancelOrder,
    addItemsToCart,
  } = useShop();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [expandedId, setExpandedId] = useState(null);
  const [history, setHistory] = useState({});
  const [historyLoading, setHistoryLoading] = useState(null);
  const [busyId, setBusyId] = useState(null);

  const load = async () => {
    setLoading(true);
    setError("");

    try {
      await reloadOrders();
    } catch (e) {
      setError(e.message || "Please try again.");
    }

    setLoading(false);
  };

  useEffect(() => {
    load();

    const unsubscribe = navigation.addListener("focus", load);

    return unsubscribe;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [navigation]);

  const toggleTimeline = async (order) => {
    if (expandedId === order.id) {
      setExpandedId(null);
      return;
    }

    setExpandedId(order.id);
    setHistoryLoading(order.id);

    try {
      const res = await fetch(
        `${BACKEND_URL}/api/orders/${order.id}/history`
      );

      const data = res.ok ? await res.json() : [];

      // Show only the simplified order statuses.
      const filteredHistory = Array.isArray(data)
        ? data.filter((entry) =>
            ["placed", "delivered", "cancelled"].includes(entry.status)
          )
        : [];

      setHistory((prev) => ({
        ...prev,
        [order.id]: filteredHistory,
      }));
    } catch (e) {
      setHistory((prev) => ({
        ...prev,
        [order.id]: [],
      }));
    }

    setHistoryLoading(null);
  };

  const onCancel = (order) => {
    confirmAction(
      "Cancel this order?",
      `Order ${order.orderCode} will be cancelled.`,
      async () => {
        setBusyId(order.id);

        try {
          await cancelOrder(order.id);

          setHistory((prev) => {
            const copy = { ...prev };
            delete copy[order.id];
            return copy;
          });

          await reloadOrders();
        } catch (e) {
          notify("Could not cancel", e.message);
        }

        setBusyId(null);
      }
    );
  };

  const onReorder = async (order) => {
    const items = parseItemsJson(order);

    if (!items || items.length === 0) {
      notify(
        "Cannot reorder",
        "This order has no saved item details."
      );
      return;
    }

    setBusyId(order.id);

    try {
      const result = await addItemsToCart(items);

      setBusyId(null);

      notify(
        "Added to cart",
        `${result.added} item(s) added at today's prices.` +
          (result.skipped
            ? ` ${result.skipped} item(s) skipped (out of stock or no longer sold).`
            : "")
      );

      navigation.navigate("Cart");
    } catch (e) {
      setBusyId(null);
      notify("Could not reorder", e.message);
    }
  };

  const renderOrder = ({ item: order }) => {
    const status = getStatus(order.status);
    const config = STATUS[status];

    const currentStep = STEPS.findIndex(
      (step) => step.key === status
    );

    const itemLines = (order.items || "")
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);

    const busy = busyId === order.id;

    return (
      <View style={styles.card}>
        <View style={styles.cardTop}>
          <View>
            <Text style={styles.orderCode}>{order.orderCode}</Text>
            <Text style={styles.ref}>Ref #{order.id}</Text>
          </View>

          <View style={[styles.badge, { backgroundColor: config.bg }]}>
            <Text style={[styles.badgeText, { color: config.color }]}>
              {config.label}
            </Text>
          </View>
        </View>

        <Text style={styles.meta}>
          📅 Placed on {formatDateTime(order.placedAt || order.orderDate)}
        </Text>

        {status === "cancelled" ? (
          <Text style={styles.cancelledText}>
            This order was cancelled.
          </Text>
        ) : (
          <View style={styles.stepsRow}>
            {STEPS.map((step, index) => {
              const done = index <= currentStep;

              return (
                <View key={step.key} style={styles.step}>
                  <View
                    style={[
                      styles.stepDot,
                      done ? styles.stepDone : styles.stepPending,
                    ]}
                  />
                  <Text
                    style={[
                      styles.stepLabel,
                      done && styles.stepLabelDone,
                    ]}
                  >
                    {step.label}
                  </Text>
                </View>
              );
            })}
          </View>
        )}

        <Text style={styles.sectionLabel}>Items</Text>

        {itemLines.map((line, index) => (
          <Text key={index} style={styles.itemLine}>
            • {line}
          </Text>
        ))}

        <Text style={styles.sectionLabel}>Delivery address</Text>
        <Text style={styles.body}>📍 {order.address || "—"}</Text>

        <View style={styles.totalRow}>
          <Text style={styles.totalLabel}>Total</Text>
          <Text style={styles.total}>₹{order.total}</Text>
        </View>

        <View style={styles.actions}>
          <TouchableOpacity
            style={styles.trackBtn}
            onPress={() => toggleTimeline(order)}
          >
            <Text style={styles.trackText}>
              {expandedId === order.id
                ? "Hide tracking ▴"
                : "View tracking ▾"}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.reorderBtn, busy && styles.disabled]}
            disabled={busy}
            onPress={() => onReorder(order)}
          >
            <Text style={styles.reorderText}>
              {busy ? "Please wait..." : "Reorder"}
            </Text>
          </TouchableOpacity>
        </View>

        {status === "placed" && (
          <TouchableOpacity
            style={[styles.cancelBtn, busy && styles.disabled]}
            disabled={busy}
            onPress={() => onCancel(order)}
          >
            <Text style={styles.cancelText}>
              Cancel this order
            </Text>
          </TouchableOpacity>
        )}

        {status === "delivered" && (
          <TouchableOpacity
            style={styles.returnBtn}
            onPress={() =>
              navigation.navigate("Return", {
                orderId: order.id,
                orderCode: order.orderCode,
              })
            }
          >
            <Text style={styles.returnText}>
              🔄 Request return / exchange
            </Text>
          </TouchableOpacity>
        )}

        {expandedId === order.id && (
          <View style={styles.timeline}>
            <Text style={styles.timelineTitle}>
              Tracking history
            </Text>

            {historyLoading === order.id ? (
              <ActivityIndicator color="#2457C5" />
            ) : (history[order.id] || []).length === 0 ? (
              <Text style={styles.muted}>
                No tracking entries yet.
              </Text>
            ) : (
              history[order.id].map((h) => (
                <View key={String(h.id)} style={styles.timelineRow}>
                  <View style={styles.timelineDot} />

                  <View style={{ flex: 1 }}>
                    <Text style={styles.timelineStatus}>
                      {STATUS[h.status]?.label || h.status}
                    </Text>

                    {h.note ? (
                      <Text style={styles.timelineNote}>
                        {h.note}
                      </Text>
                    ) : null}

                    <Text style={styles.timelineMeta}>
                      {formatDateTime(h.changedAt)} · by{" "}
                      {h.changedBy === "admin" ? "shop" : "you"}
                    </Text>
                  </View>
                </View>
              ))
            )}
          </View>
        )}
      </View>
    );
  };

  if (!customer) {
    return (
      <SafeAreaView style={styles.center}>
        <ActivityIndicator size="large" color="#2457C5" />
        <Text style={styles.muted}>
          Preparing your account...
        </Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.box}>
        <View style={styles.header}>
          <View>
            <Text style={styles.title}>My Orders</Text>
            <Text style={styles.muted}>
              {orders.length}{" "}
              {orders.length === 1 ? "order" : "orders"} · from the database
            </Text>
          </View>

          <TouchableOpacity onPress={load}>
            <Text style={styles.refresh}>🔄 Refresh</Text>
          </TouchableOpacity>
        </View>

        {error ? (
          <View style={styles.errorBox}>
            <Text style={styles.errorTitle}>
              ⚠️ Could not load orders
            </Text>

            <Text style={styles.errorText}>{error}</Text>

            <TouchableOpacity style={styles.retry} onPress={load}>
              <Text style={styles.retryText}>Retry</Text>
            </TouchableOpacity>
          </View>
        ) : loading && orders.length === 0 ? (
          <View style={styles.center}>
            <ActivityIndicator size="large" color="#2457C5" />
            <Text style={styles.muted}>
              Loading your orders...
            </Text>
          </View>
        ) : orders.length === 0 ? (
          <View style={styles.center}>
            <Text style={styles.emptyIcon}>📦</Text>
            <Text style={styles.emptyTitle}>No orders yet</Text>
            <Text style={styles.muted}>
              Orders you place will appear here with live tracking.
            </Text>
          </View>
        ) : (
          <FlatList
            data={orders}
            keyExtractor={(order) => String(order.id)}
            renderItem={renderOrder}
            contentContainerStyle={{ paddingBottom: 24 }}
            refreshControl={
              <RefreshControl
                refreshing={loading}
                onRefresh={load}
              />
            }
          />
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: "#F1F3F6",
  },
  box: {
    flex: 1,
    padding: 16,
  },
  center: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 24,
    backgroundColor: "#F1F3F6",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 12,
  },
  title: {
    fontSize: 24,
    fontWeight: "700",
    color: "#212121",
  },
  muted: {
    marginTop: 4,
    fontSize: 13,
    color: "#667085",
    textAlign: "center",
  },
  refresh: {
    color: "#2457C5",
    fontWeight: "700",
    paddingTop: 6,
  },
  errorBox: {
    backgroundColor: "#FFF4F4",
    borderRadius: 10,
    padding: 14,
    borderWidth: 1,
    borderColor: "#D92D20",
  },
  errorTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#D92D20",
  },
  errorText: {
    marginTop: 6,
    color: "#475467",
    fontSize: 13,
  },
  retry: {
    marginTop: 12,
    padding: 12,
    borderRadius: 8,
    alignItems: "center",
    backgroundColor: "#2457C5",
  },
  retryText: {
    color: "#FFFFFF",
    fontWeight: "700",
  },
  emptyIcon: {
    fontSize: 46,
  },
  emptyTitle: {
    marginTop: 10,
    fontSize: 18,
    fontWeight: "700",
    color: "#212121",
  },
  card: {
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    padding: 16,
    marginBottom: 14,
  },
  cardTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
  },
  orderCode: {
    fontSize: 17,
    fontWeight: "700",
    color: "#212121",
  },
  ref: {
    fontSize: 11,
    color: "#98A2B3",
    marginTop: 2,
  },
  badge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
  },
  badgeText: {
    fontSize: 11,
    fontWeight: "700",
  },
  meta: {
    marginTop: 8,
    fontSize: 13,
    color: "#475467",
  },
  cancelledText: {
    marginTop: 10,
    fontSize: 14,
    fontWeight: "700",
    color: "#D92D20",
  },
  stepsRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 14,
  },
  step: {
    flex: 1,
    alignItems: "center",
  },
  stepDot: {
    width: 14,
    height: 14,
    borderRadius: 7,
  },
  stepDone: {
    backgroundColor: "#12B76A",
  },
  stepPending: {
    backgroundColor: "#D0D5DD",
  },
  stepLabel: {
    marginTop: 4,
    fontSize: 11,
    color: "#98A2B3",
    textAlign: "center",
  },
  stepLabelDone: {
    color: "#12B76A",
    fontWeight: "700",
  },
  sectionLabel: {
    marginTop: 12,
    marginBottom: 4,
    fontSize: 11,
    fontWeight: "700",
    color: "#98A2B3",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  itemLine: {
    fontSize: 14,
    color: "#344054",
    lineHeight: 22,
  },
  body: {
    fontSize: 14,
    color: "#475467",
    lineHeight: 21,
  },
  totalRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 14,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: "#EAECF0",
  },
  totalLabel: {
    fontSize: 15,
    fontWeight: "600",
    color: "#475467",
  },
  total: {
    fontSize: 19,
    fontWeight: "700",
    color: "#12B76A",
  },
  actions: {
    flexDirection: "row",
    marginTop: 12,
  },
  trackBtn: {
    flex: 1,
    padding: 12,
    borderRadius: 8,
    alignItems: "center",
    backgroundColor: "#EFF4FF",
    marginRight: 6,
  },
  trackText: {
    color: "#2457C5",
    fontWeight: "700",
  },
  reorderBtn: {
    flex: 1,
    padding: 12,
    borderRadius: 8,
    alignItems: "center",
    backgroundColor: "#FB641B",
    marginLeft: 6,
  },
  reorderText: {
    color: "#FFFFFF",
    fontWeight: "700",
  },
  disabled: {
    opacity: 0.5,
  },
  cancelBtn: {
    marginTop: 10,
    padding: 12,
    borderRadius: 8,
    alignItems: "center",
    backgroundColor: "#FFF4F4",
    borderWidth: 1,
    borderColor: "#D92D20",
  },
  cancelText: {
    color: "#D92D20",
    fontWeight: "700",
  },
  returnBtn: {
    marginTop: 10,
    padding: 12,
    borderRadius: 8,
    alignItems: "center",
    backgroundColor: "#2457C5",
  },
  returnText: {
    color: "#FFFFFF",
    fontWeight: "700",
  },
  timeline: {
    marginTop: 14,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: "#EAECF0",
  },
  timelineTitle: {
    fontSize: 14,
    fontWeight: "700",
    color: "#212121",
    marginBottom: 8,
  },
  timelineRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginBottom: 10,
  },
  timelineDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: "#2457C5",
    marginTop: 5,
    marginRight: 10,
  },
  timelineStatus: {
    fontSize: 14,
    fontWeight: "700",
    color: "#212121",
  },
  timelineNote: {
    fontSize: 13,
    color: "#475467",
    marginTop: 2,
  },
  timelineMeta: {
    fontSize: 12,
    color: "#98A2B3",
    marginTop: 2,
  },
});
