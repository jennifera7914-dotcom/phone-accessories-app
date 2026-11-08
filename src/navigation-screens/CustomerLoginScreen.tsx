import AsyncStorage from "@react-native-async-storage/async-storage";
import { useNavigation } from "@react-navigation/native";
import { useState } from "react";
import {
  ActivityIndicator,
  Alert,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

export default function LoginScreen() {
  const navigation = useNavigation<any>();
  const [identifier, setIdentifier] = useState("");
  const [pin, setPin] = useState("");
  const [showPin, setShowPin] = useState(false);
  const [loading, setLoading] = useState(false);
  const [debugMsg, setDebugMsg] = useState("");

  const handleLogin = async () => {
    setDebugMsg("");
    const idTrim = identifier.trim();
    if (!idTrim || !pin) {
      const msg = "Please enter Phone/Name and PIN";
      setDebugMsg(msg);
      Alert.alert("Required", msg);
      return;
    }
    if (!/^\d{4}$/.test(pin)) {
      const msg = "PIN must be exactly 4 digits";
      setDebugMsg(msg);
      Alert.alert("Invalid PIN", msg);
      return;
    }
    const isPhoneLike = /^\d+$/.test(idTrim);
    if (isPhoneLike && !/^\d{10}$/.test(idTrim)) {
      const msg = "Phone must be exactly 10 digits";
      setDebugMsg(msg);
      Alert.alert("Invalid Phone", msg);
      return;
    }

    setLoading(true);
    try {
      const response = await fetch("http://localhost:8080/api/user/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ identifier: idTrim, pin }),
      });
      const text = await response.text();
      let data: any = {};
      try {
        data = JSON.parse(text);
      } catch {
        data = { message: text };
      }

      if (response.ok) {
        await AsyncStorage.setItem("user", JSON.stringify(data));
        navigation.replace("Home");
      } else if (response.status === 404) {
        const hint = isPhoneLike
          ? "Try logging in with Customer Name."
          : "Try logging in with Phone Number.";
        const msg = (data.message || "Not registered") + "\n" + hint;
        setDebugMsg(msg);
        Alert.alert("Not Registered", msg);
      } else if (response.status === 401) {
        const msg =
          data.message || "Wrong PIN. Check your email or contact owner.";
        setDebugMsg(msg);
        Alert.alert("Wrong PIN", msg);
      } else {
        const msg = data.message || "Login failed";
        setDebugMsg("Error: " + msg);
        Alert.alert("Login Failed", msg);
      }
    } catch (error: any) {
      const msg =
        "Cannot connect to backend. Is IntelliJ running on port 8080?";
      setDebugMsg(msg);
      Alert.alert("Connection Error", msg);
    }
    setLoading(false);
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>ðŸ“± Mobile Accessory Hub</Text>
      <Text style={styles.subtitle}>
        Login with Phone or Name + PIN sent on Gmail
      </Text>

      <TextInput
        style={styles.input}
        placeholder="Phone Number or Customer Name"
        value={identifier}
        onChangeText={setIdentifier}
        autoCapitalize="none"
      />

      <View style={styles.pinRow}>
        <TextInput
          style={styles.pinInput}
          placeholder="4-Digit PIN"
          keyboardType="number-pad"
          secureTextEntry={!showPin}
          maxLength={4}
          value={pin}
          onChangeText={(t) => setPin(t.replace(/[^0-9]/g, ""))}
        />
        <TouchableOpacity
          style={styles.eyeBtn}
          onPress={() => setShowPin(!showPin)}
        >
          <Text style={styles.eyeText}>{showPin ? "ðŸ™ˆ" : "ðŸ‘ï¸"}</Text>
        </TouchableOpacity>
      </View>

      {debugMsg ? (
        <Text
          style={{
            color: debugMsg.includes("success") ? "green" : "red",
            textAlign: "center",
            marginBottom: 10,
          }}
        >
          {debugMsg}
        </Text>
      ) : null}

      <TouchableOpacity
        style={styles.button}
        onPress={handleLogin}
        disabled={loading}
      >
        {loading ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={styles.buttonText}>Login</Text>
        )}
      </TouchableOpacity>

      <Text style={styles.hint}>Don't have login? Contact Shop Owner</Text>
      <Text style={styles.hintSmall}>
        You will receive PIN on your Gmail after owner creates your account
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    padding: 30,
    backgroundColor: "#fff",
  },
  title: {
    fontSize: 22,
    fontWeight: "bold",
    textAlign: "center",
    color: "#6200EE",
  },
  subtitle: {
    fontSize: 12,
    color: "#666",
    textAlign: "center",
    marginBottom: 25,
    marginTop: 5,
  },
  input: {
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 10,
    padding: 15,
    marginBottom: 12,
    fontSize: 16,
  },
  pinRow: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 10,
    marginBottom: 12,
  },
  pinInput: { flex: 1, padding: 15, fontSize: 16 },
  eyeBtn: { padding: 12 },
  eyeText: { fontSize: 20 },
  button: {
    backgroundColor: "#6200EE",
    padding: 15,
    borderRadius: 10,
    alignItems: "center",
    marginTop: 5,
  },
  buttonText: { color: "#fff", fontSize: 18, fontWeight: "bold" },
  hint: {
    color: "#6200EE",
    textAlign: "center",
    marginTop: 20,
    fontWeight: "600",
  },
  hintSmall: { color: "#888", textAlign: "center", fontSize: 11, marginTop: 5 },
});

