import React, { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  SafeAreaView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { BACKEND_URL } from "../api/config";

export default function NotificationsScreen({ navigation }) {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const load = useCallback(() => {
    setLoading(true);
    setError("");

    fetch(`${BACKEND_URL}/api/notifications`)
      .then((res) => {
        if (!res.ok) throw new Error("Server replied with status " + res.status);
        return res.json();
      })
      .then((data) => {
        setNotifications(Array.isArray(data) ? data : []);
        setLoading(false);
      })
      .catch((e) => {
        setError(e.message);
        setLoading(false);
      });
  }, []);

  useEffect(() => {
    load();
    const unsub = navigation.addListener("focus", load);
    return unsub;
  }, [navigation, load]);

  const markAllRead = () => {
    fetch(`${BACKEND_URL}/api/notifications/mark-all-read`, { method: "PUT" })
      .then((res) => {
        if (!res.ok) throw new Error("Could not update");
        return res.json();
      })
      .then(() => load())
      .catch(() => {});
  };

  const unreadCount = notifications.filter((n) => !n.read).length;

  if (loading) {
    return (
      <SafeAreaView style={styles.center}>
        <ActivityIndicator size="large" color="#2457C5" />
        <Text style={styles.muted}>Loading notifications from database...</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.box}>
        <Text style={styles.title}>Notifications</Text>
        <Text style={styles.muted}>
          {unreadCount > 0 ? unreadCount + " unread" : "All caught up"}
        </Text>

        {unreadCount > 0 && (
          <TouchableOpacity onPress={markAllRead}>
            <Text style={styles.markRead}>Mark all read</Text>
          </TouchableOpacity>
        )}

        {error ? (
          <View style={styles.errorBox}>
            <Text style={styles.errorTitle}>Could not load notifications</Text>
            <Text style={styles.errorText}>{error}</Text>
            <TouchableOpacity style={styles.retry} onPress={load}>
              <Text style={styles.retryText}>Retry</Text>
            </TouchableOpacity>
          </View>
        ) : notifications.length === 0 ? (
          <Text style={styles.empty}>No notifications in the database yet.</Text>
        ) : (
          <FlatList
            data={notifications}
            keyExtractor={(item) => String(item.id)}
            renderItem={({ item }) => (
              <View style={[styles.card, !item.read && styles.unreadCard]}>
                <Text style={styles.cardTitle}>{item.title}</Text>
                <Text style={styles.body}>{item.body}</Text>
                <Text style={styles.date}>{item.date}</Text>
              </View>
            )}
          />
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: "#F1F3F6" },
  box: { flex: 1, padding: 16 },
  center: { flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: "#F1F3F6" },
  title: { fontSize: 24, fontWeight: "700", color: "#212121" },
  muted: { marginTop: 4, marginBottom: 10, color: "#667085", fontSize: 13 },
  markRead: { color: "#2457C5", fontWeight: "700", marginBottom: 12 },
  empty: { marginTop: 30, textAlign: "center", color: "#667085" },
  errorBox: { backgroundColor: "#FFF4F4", padding: 14, borderRadius: 10, borderWidth: 1, borderColor: "#D92D20" },
  errorTitle: { fontWeight: "700", color: "#D92D20" },
  errorText: { marginTop: 6, color: "#475467" },
  retry: { marginTop: 12, padding: 12, borderRadius: 8, backgroundColor: "#2457C5", alignItems: "center" },
  retryText: { color: "#FFFFFF", fontWeight: "700" },
  card: { backgroundColor: "#FFFFFF", borderRadius: 10, padding: 14, marginBottom: 10, borderLeftWidth: 4, borderLeftColor: "transparent" },
  unreadCard: { backgroundColor: "#EFF4FF", borderLeftColor: "#2457C5" },
  cardTitle: { fontSize: 16, fontWeight: "700", color: "#212121" },
  body: { marginTop: 6, fontSize: 14, color: "#475467", lineHeight: 20 },
  date: { marginTop: 8, fontSize: 12, color: "#98A2B3" },
});