import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { BACKEND_URL } from "../api/config";
import { useShop } from "../context/ShopContext";

const QUICK = [
  "When will my order arrive?",
  "How can I return a product?",
  "What payment methods do you accept?",
  "Is my product in stock?",
];

function timeOf(msg) {
  if (msg.time) return msg.time;
  if (!msg.createdAt) return "";
  const d = new Date(msg.createdAt);
  if (isNaN(d)) return "";
  let h = d.getHours();
  const m = String(d.getMinutes()).padStart(2, "0");
  const ampm = h >= 12 ? "PM" : "AM";
  h = h % 12 || 12;
  return `${h}:${m} ${ampm}`;
}

export default function ChatScreen({ navigation }) {
  const { customer } = useShop();
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const listRef = useRef(null);

  const load = useCallback(async () => {
    if (!customer?.token) return;
    try {
      const res = await fetch(`${BACKEND_URL}/api/chat/mine`, {
        headers: { "X-Customer-Token": customer.token },
      });
      if (!res.ok) return;
      const data = await res.json();
      if (Array.isArray(data)) setMessages(data);
    } catch (e) {}
    setLoading(false);
  }, [customer?.token]);

  useEffect(() => {
    load();
    const unsub = navigation.addListener("focus", load);
    const timer = setInterval(load, 5000);
    return () => {
      unsub();
      clearInterval(timer);
    };
  }, [load, navigation]);

  const sendText = async (text) => {
    const clean = text.trim();
    if (!clean || !customer?.token || sending) return;
    setSending(true);
    setInput("");
    try {
      const res = await fetch(`${BACKEND_URL}/api/chat/send`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Customer-Token": customer.token,
        },
        body: JSON.stringify({ text: clean }),
      });
      if (!res.ok) {
        const t = await res.text();
        throw new Error(t || "Send failed");
      }
      await load();
      setTimeout(() => listRef.current?.scrollToEnd({ animated: true }), 300);
    } catch (e) {
      if (Platform.OS === "web") window.alert("Could not send: " + e.message);
    }
    setSending(false);
  };

  const renderItem = ({ item }) => {
    const isCustomer = item.sender === "customer";
    const isBot = item.sender === "bot";
    return (
      <View style={[styles.row, isCustomer ? styles.rowRight : styles.rowLeft]}>
        <View style={[styles.bubble, isCustomer ? styles.me : styles.other]}>
          {!isCustomer && (
            <Text style={styles.who}>{isBot ? "🤖 Auto-reply" : "🏪 Shop Owner"}</Text>
          )}
          <Text style={[styles.text, isCustomer ? styles.textMe : styles.textOther]}>
            {item.text}
          </Text>
          <Text style={[styles.time, isCustomer ? styles.timeMe : styles.timeOther]}>
            {timeOf(item)}
          </Text>
        </View>
      </View>
    );
  };

  if (!customer) {
    return (
      <SafeAreaView style={styles.center}>
        <ActivityIndicator size="large" color="#2457C5" />
        <Text style={styles.muted}>Preparing your account...</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        keyboardVerticalOffset={90}
      >
        {loading ? (
          <View style={styles.center}>
            <ActivityIndicator size="large" color="#2457C5" />
            <Text style={styles.muted}>Loading messages...</Text>
          </View>
        ) : (
          <FlatList
            ref={listRef}
            data={messages}
            keyExtractor={(m) => String(m.id)}
            renderItem={renderItem}
            contentContainerStyle={{ padding: 12, paddingBottom: 6 }}
            onContentSizeChange={() => listRef.current?.scrollToEnd({ animated: false })}
            ListEmptyComponent={
              <View style={styles.center}>
                <Text style={styles.emptyIcon}>💬</Text>
                <Text style={styles.emptyTitle}>Say hello to the shop</Text>
                <Text style={styles.muted}>Your first message creates your chat.</Text>
              </View>
            }
          />
        )}

        <View style={styles.quickBox}>
          <Text style={styles.quickTitle}>Tap a question — no typing needed:</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 12 }}>
            {QUICK.map((q) => (
              <TouchableOpacity key={q} style={styles.chip} onPress={() => sendText(q)}>
                <Text style={styles.chipText}>{q}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        <View style={styles.inputRow}>
          <TextInput
            style={styles.input}
            placeholder="Type your message..."
            placeholderTextColor="#98A2B3"
            value={input}
            onChangeText={setInput}
            onSubmitEditing={() => sendText(input)}
            returnKeyType="send"
          />
          <TouchableOpacity
            style={[styles.sendBtn, (!input.trim() || sending) && styles.sendDisabled]}
            disabled={!input.trim() || sending}
            onPress={() => sendText(input)}
          >
            <Text style={styles.sendText}>{sending ? "..." : "Send"}</Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: "#F1F3F6" },
  center: { flex: 1, justifyContent: "center", alignItems: "center", padding: 24 },
  muted: { marginTop: 8, fontSize: 13, color: "#667085", textAlign: "center" },
  emptyIcon: { fontSize: 46 },
  emptyTitle: { marginTop: 8, fontSize: 17, fontWeight: "700", color: "#212121" },
  row: { flexDirection: "row", marginVertical: 5 },
  rowRight: { justifyContent: "flex-end" },
  rowLeft: { justifyContent: "flex-start" },
  bubble: { maxWidth: "80%", borderRadius: 14, padding: 12 },
  me: { backgroundColor: "#2457C5", borderBottomRightRadius: 3 },
  other: { backgroundColor: "#FFFFFF", borderBottomLeftRadius: 3 },
  who: { fontSize: 11, fontWeight: "700", color: "#667085", marginBottom: 4 },
  text: { fontSize: 15, lineHeight: 21 },
  textMe: { color: "#FFFFFF" },
  textOther: { color: "#212121" },
  time: { fontSize: 11, marginTop: 6, alignSelf: "flex-end" },
  timeMe: { color: "#C7D7FE" },
  timeOther: { color: "#98A2B3" },
  quickBox: { paddingTop: 8, paddingBottom: 6, backgroundColor: "#FFFFFF", borderTopWidth: 1, borderTopColor: "#EAECF0" },
  quickTitle: { marginLeft: 12, marginBottom: 6, fontSize: 12, fontWeight: "600", color: "#667085" },
  chip: { marginRight: 8, paddingHorizontal: 14, paddingVertical: 10, borderRadius: 20, backgroundColor: "#EFF4FF" },
  chipText: { fontSize: 13, fontWeight: "600", color: "#2457C5" },
  inputRow: { flexDirection: "row", alignItems: "center", padding: 10, backgroundColor: "#FFFFFF" },
  input: { flex: 1, paddingHorizontal: 16, paddingVertical: 10, borderRadius: 22, backgroundColor: "#F2F4F7", fontSize: 15, color: "#212121" },
  sendBtn: { marginLeft: 8, paddingHorizontal: 20, paddingVertical: 12, borderRadius: 22, backgroundColor: "#2457C5" },
  sendDisabled: { backgroundColor: "#AAB4C5" },
  sendText: { fontSize: 15, fontWeight: "700", color: "#FFFFFF" },
});