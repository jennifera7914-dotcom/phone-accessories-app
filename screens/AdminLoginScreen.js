import AsyncStorage from "@react-native-async-storage/async-storage";
import { useState } from "react";
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

export default function AdminLoginScreen({ navigation }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);

  const [showForgotPass, setShowForgotPass] = useState(false);
  const [showForgotEmail, setShowForgotEmail] = useState(false);
  const [fpEmail, setFpEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [newPass, setNewPass] = useState("");
  const [showNewPass, setShowNewPass] = useState(false);
  const [otpSent, setOtpSent] = useState(false);
  const [feRecoveryEmail, setFeRecoveryEmail] = useState("");

  const handleLogin = async () => {
    if (!email.trim() || !password) {
      Alert.alert("Required", "Please enter Email and Password");
      return;
    }
    if (!email.toLowerCase().endsWith("@gmail.com")) {
      Alert.alert("Invalid Email", "Owner Email must end with @gmail.com");
      return;
    }
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE_URL}/api/admin/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim().toLowerCase(), password }),
      });
      const data = await res.json();
      if (res.ok) {
        await AsyncStorage.setItem("admin", JSON.stringify(data));
        navigation.replace("AdminDashboardScreen");
      } else {
        Alert.alert("Login Failed", data.message || "Wrong email or password");
      }
    } catch (e) {
      Alert.alert(
        "Connection Error",
        "Cannot connect to backend. Is the server running on port 8080?",
      );
    }
    setLoading(false);
  };

  const handleRequestOtp = async () => {
    if (!fpEmail.toLowerCase().endsWith("@gmail.com")) {
      Alert.alert("Invalid", "Primary email must end with @gmail.com");
      return;
    }
    try {
      const res = await fetch(
        `${API_BASE_URL}/api/admin/forgot-password/request`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email: fpEmail.trim().toLowerCase() }),
        },
      );
      const out = await res.json();
      if (res.ok) {
        Alert.alert("OTP Sent", out.message);
        setOtpSent(true);
      } else Alert.alert("Failed", out.message);
    } catch {
      Alert.alert("Error", "Cannot connect to backend");
    }
  };

  const handleResetPass = async () => {
    if (!otp || !newPass) {
      Alert.alert("Required", "Enter OTP and New Password");
      return;
    }
    if (newPass.length < 4) {
      Alert.alert("Invalid", "Password must be at least 4 chars");
      return;
    }
    try {
      const res = await fetch(
        `${API_BASE_URL}/api/admin/forgot-password/reset`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            email: fpEmail.trim().toLowerCase(),
            otp,
            newPassword: newPass,
          }),
        },
      );
      const out = await res.json();
      if (res.ok) {
        Alert.alert("Success", out.message);
        setShowForgotPass(false);
        setOtpSent(false);
        setOtp("");
        setNewPass("");
      } else Alert.alert("Failed", out.message);
    } catch {
      Alert.alert("Error", "Cannot connect");
    }
  };

  const handleForgotEmail = async () => {
    if (!feRecoveryEmail.toLowerCase().endsWith("@gmail.com")) {
      Alert.alert("Invalid", "Recovery email must end with @gmail.com");
      return;
    }
    try {
      const res = await fetch(`${API_BASE_URL}/api/admin/forgot-email`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          recoveryEmail: feRecoveryEmail.trim().toLowerCase(),
        }),
      });
      const out = await res.json();
      if (res.ok) Alert.alert("Sent", out.message);
      else Alert.alert("Failed", out.message);
    } catch {
      Alert.alert("Error", "Cannot connect");
    }
  };

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: "#fff" }}
      contentContainerStyle={{ padding: 30, paddingTop: 60 }}
    >
      <Text style={styles.title}>🔑 Owner Login</Text>
      <Text style={styles.sub}>Mobile Accessory Hub - Owner Only</Text>

      <TextInput
        style={styles.input}
        placeholder="Primary Owner Email"
        value={email}
        onChangeText={setEmail}
        autoCapitalize="none"
        keyboardType="email-address"
      />

      <View style={styles.passRow}>
        <TextInput
          style={styles.passInput}
          placeholder="Password"
          secureTextEntry={!showPass}
          value={password}
          onChangeText={setPassword}
        />
        <TouchableOpacity
          onPress={() => setShowPass(!showPass)}
          style={styles.eyeBtn}
        >
          <Text style={styles.eye}>{showPass ? "🙈" : "👁️"}</Text>
        </TouchableOpacity>
      </View>

      <TouchableOpacity
        style={styles.btn}
        onPress={handleLogin}
        disabled={loading}
      >
        {loading ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={styles.btnText}>Login</Text>
        )}
      </TouchableOpacity>

      <View
        style={{
          flexDirection: "row",
          justifyContent: "space-between",
          marginTop: 14,
        }}
      >
        <TouchableOpacity
          onPress={() => {
            setShowForgotPass(!showForgotPass);
            setShowForgotEmail(false);
          }}
        >
          <Text style={styles.linkSmall}>Forgot Password?</Text>
        </TouchableOpacity>
        <TouchableOpacity
          onPress={() => {
            setShowForgotEmail(!showForgotEmail);
            setShowForgotPass(false);
          }}
        >
          <Text style={styles.linkSmall}>Forgot Email?</Text>
        </TouchableOpacity>
      </View>

      {showForgotPass && (
        <View style={styles.miniCard}>
          <Text style={styles.miniTitle}>Reset Password via OTP</Text>
          <TextInput
            style={styles.input}
            placeholder="Primary Owner Email"
            value={fpEmail}
            onChangeText={setFpEmail}
            autoCapitalize="none"
          />
          <TouchableOpacity style={styles.smallBtn} onPress={handleRequestOtp}>
            <Text style={styles.btnText}>Send OTP to Primary Email</Text>
          </TouchableOpacity>
          {otpSent && (
            <>
              <TextInput
                style={styles.input}
                placeholder="6-Digit OTP"
                keyboardType="number-pad"
                maxLength={6}
                value={otp}
                onChangeText={setOtp}
              />
              <View style={styles.passRow}>
                <TextInput
                  style={styles.passInput}
                  placeholder="New Password (min 4 chars)"
                  secureTextEntry={!showNewPass}
                  value={newPass}
                  onChangeText={setNewPass}
                />
                <TouchableOpacity
                  onPress={() => setShowNewPass(!showNewPass)}
                  style={styles.eyeBtn}
                >
                  <Text style={styles.eye}>{showNewPass ? "🙈" : "👁️"}</Text>
                </TouchableOpacity>
              </View>
              <TouchableOpacity
                style={styles.smallBtn}
                onPress={handleResetPass}
              >
                <Text style={styles.btnText}>Reset Password</Text>
              </TouchableOpacity>
            </>
          )}
        </View>
      )}

      {showForgotEmail && (
        <View style={styles.miniCard}>
          <Text style={styles.miniTitle}>Recover Primary Email</Text>
          <TextInput
            style={styles.input}
            placeholder="Recovery Email"
            value={feRecoveryEmail}
            onChangeText={setFeRecoveryEmail}
            autoCapitalize="none"
          />
          <TouchableOpacity style={styles.smallBtn} onPress={handleForgotEmail}>
            <Text style={styles.btnText}>
              Send Primary Email to Recovery Email
            </Text>
          </TouchableOpacity>
          <Text style={styles.hintText}>
            We will email your Primary Owner Email to this Recovery Email.
          </Text>
        </View>
      )}

      <TouchableOpacity
        onPress={() => navigation.goBack()}
        style={{ marginTop: 20 }}
      >
        <Text style={styles.linkBack}>← Back to Choose Role</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  title: {
    fontSize: 22,
    fontWeight: "bold",
    textAlign: "center",
    color: "#000",
  },
  sub: {
    fontSize: 12,
    textAlign: "center",
    marginTop: 5,
    marginBottom: 25,
    color: "#666",
  },
  input: {
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 10,
    padding: 15,
    marginBottom: 10,
    fontSize: 15,
  },
  passRow: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 10,
    marginBottom: 10,
  },
  passInput: { flex: 1, padding: 15, fontSize: 15 },
  eyeBtn: { padding: 12 },
  eye: { fontSize: 20 },
  btn: {
    backgroundColor: "#6200EE",
    padding: 15,
    borderRadius: 10,
    alignItems: "center",
    marginTop: 5,
  },
  smallBtn: {
    backgroundColor: "#6200EE",
    padding: 12,
    borderRadius: 10,
    alignItems: "center",
    marginTop: 8,
  },
  btnText: { color: "#fff", fontSize: 15, fontWeight: "bold" },
  linkSmall: {
    color: "#6200EE",
    fontSize: 13,
    textDecorationLine: "underline",
  },
  linkBack: { color: "#6200EE", textAlign: "center", fontWeight: "600" },
  miniCard: {
    padding: 15,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#ddd",
    marginTop: 14,
    backgroundColor: "#f9f9f9",
  },
  miniTitle: { fontWeight: "bold", marginBottom: 10, color: "#000" },
  hintText: { color: "#666", fontSize: 11, marginTop: 6 },
});
