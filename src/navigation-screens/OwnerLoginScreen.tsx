import AsyncStorage from "@react-native-async-storage/async-storage";
import { useNavigation } from "@react-navigation/native";
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
import { useTheme } from "../context/ThemeContext";

export default function AdminLoginScreen() {
  const navigation = useNavigation<any>();
  const { colors } = useTheme();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);

  // Forgot states
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
      const res = await fetch("http://localhost:8080/api/admin/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim().toLowerCase(), password }),
      });
      const data = await res.json();
      if (res.ok) {
        await AsyncStorage.setItem("admin", JSON.stringify(data));
        navigation.replace("OwnerDashboard");
      } else {
        Alert.alert("Login Failed", data.message || "Wrong email or password");
      }
    } catch (e: any) {
      Alert.alert(
        "Connection Error",
        "Cannot connect to backend. Is IntelliJ running on port 8080?",
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
        "http://localhost:8080/api/admin/forgot-password/request",
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
        "http://localhost:8080/api/admin/forgot-password/reset",
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
      const res = await fetch("http://localhost:8080/api/admin/forgot-email", {
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
      style={{ flex: 1, backgroundColor: colors.background }}
      contentContainerStyle={{ padding: 30, paddingTop: 60 }}
    >
      <Text style={[styles.title, { color: colors.text }]}>ðŸ”‘ Owner Login</Text>
      <Text style={[styles.sub, { color: colors.subText }]}>
        Mobile Accessory Hub - Owner Only
      </Text>

      <TextInput
        style={[
          styles.input,
          { borderColor: colors.border, color: colors.text },
        ]}
        placeholder="Primary Owner Email"
        placeholderTextColor={colors.subText}
        value={email}
        onChangeText={setEmail}
        autoCapitalize="none"
        keyboardType="email-address"
      />

      <View style={[styles.passRow, { borderColor: colors.border }]}>
        <TextInput
          style={[styles.passInput, { color: colors.text }]}
          placeholder="Password"
          placeholderTextColor={colors.subText}
          secureTextEntry={!showPass}
          value={password}
          onChangeText={setPassword}
        />
        <TouchableOpacity
          onPress={() => setShowPass(!showPass)}
          style={styles.eyeBtn}
        >
          <Text style={styles.eye}>{showPass ? "ðŸ™ˆ" : "ðŸ‘ï¸"}</Text>
        </TouchableOpacity>
      </View>

      <TouchableOpacity
        style={[styles.btn, { backgroundColor: colors.primary }]}
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
          <Text
            style={{
              color: colors.primary,
              fontSize: 13,
              textDecorationLine: "underline",
            }}
          >
            Forgot Password?
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          onPress={() => {
            setShowForgotEmail(!showForgotEmail);
            setShowForgotPass(false);
          }}
        >
          <Text
            style={{
              color: colors.primary,
              fontSize: 13,
              textDecorationLine: "underline",
            }}
          >
            Forgot Email?
          </Text>
        </TouchableOpacity>
      </View>

      {showForgotPass && (
        <View
          style={[
            styles.miniCard,
            { backgroundColor: colors.card, borderColor: colors.border },
          ]}
        >
          <Text style={[styles.miniTitle, { color: colors.text }]}>
            Reset Password via OTP
          </Text>
          <TextInput
            style={[
              styles.input,
              { borderColor: colors.border, color: colors.text },
            ]}
            placeholder="Primary Owner Email"
            placeholderTextColor={colors.subText}
            value={fpEmail}
            onChangeText={setFpEmail}
            autoCapitalize="none"
          />
          <TouchableOpacity
            style={[styles.smallBtn, { backgroundColor: colors.primary }]}
            onPress={handleRequestOtp}
          >
            <Text style={styles.btnText}>Send OTP to Primary Email</Text>
          </TouchableOpacity>
          {otpSent && (
            <>
              <TextInput
                style={[
                  styles.input,
                  { borderColor: colors.border, color: colors.text },
                ]}
                placeholder="6-Digit OTP"
                placeholderTextColor={colors.subText}
                keyboardType="number-pad"
                maxLength={6}
                value={otp}
                onChangeText={setOtp}
              />
              <View style={[styles.passRow, { borderColor: colors.border }]}>
                <TextInput
                  style={[styles.passInput, { color: colors.text }]}
                  placeholder="New Password (min 4 chars)"
                  placeholderTextColor={colors.subText}
                  secureTextEntry={!showNewPass}
                  value={newPass}
                  onChangeText={setNewPass}
                />
                <TouchableOpacity
                  onPress={() => setShowNewPass(!showNewPass)}
                  style={styles.eyeBtn}
                >
                  <Text style={styles.eye}>{showNewPass ? "ðŸ™ˆ" : "ðŸ‘ï¸"}</Text>
                </TouchableOpacity>
              </View>
              <TouchableOpacity
                style={[styles.smallBtn, { backgroundColor: colors.primary }]}
                onPress={handleResetPass}
              >
                <Text style={styles.btnText}>Reset Password</Text>
              </TouchableOpacity>
            </>
          )}
        </View>
      )}

      {showForgotEmail && (
        <View
          style={[
            styles.miniCard,
            { backgroundColor: colors.card, borderColor: colors.border },
          ]}
        >
          <Text style={[styles.miniTitle, { color: colors.text }]}>
            Recover Primary Email
          </Text>
          <TextInput
            style={[
              styles.input,
              { borderColor: colors.border, color: colors.text },
            ]}
            placeholder="Recovery Email"
            placeholderTextColor={colors.subText}
            value={feRecoveryEmail}
            onChangeText={setFeRecoveryEmail}
            autoCapitalize="none"
          />
          <TouchableOpacity
            style={[styles.smallBtn, { backgroundColor: colors.primary }]}
            onPress={handleForgotEmail}
          >
            <Text style={styles.btnText}>
              Send Primary Email to Recovery Email
            </Text>
          </TouchableOpacity>
          <Text style={{ color: colors.subText, fontSize: 11, marginTop: 6 }}>
            We will email your Primary Owner Email to this Recovery Email.
          </Text>
        </View>
      )}

      <TouchableOpacity onPress={() => navigation.replace("ChooseRole")}>
        <Text style={[styles.link, { color: colors.primary }]}>
          â† Back to Choose Role
        </Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  title: { fontSize: 22, fontWeight: "bold", textAlign: "center" },
  sub: { fontSize: 12, textAlign: "center", marginTop: 5, marginBottom: 25 },
  input: {
    borderWidth: 1,
    borderRadius: 10,
    padding: 15,
    marginBottom: 10,
    fontSize: 15,
  },
  passRow: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderRadius: 10,
    marginBottom: 10,
  },
  passInput: { flex: 1, padding: 15, fontSize: 15 },
  eyeBtn: { padding: 12 },
  eye: { fontSize: 20 },
  btn: { padding: 15, borderRadius: 10, alignItems: "center", marginTop: 5 },
  smallBtn: {
    padding: 12,
    borderRadius: 10,
    alignItems: "center",
    marginTop: 8,
  },
  btnText: { color: "#fff", fontSize: 15, fontWeight: "bold" },
  link: { textAlign: "center", marginTop: 20, fontWeight: "600" },
  miniCard: { padding: 15, borderRadius: 10, borderWidth: 1, marginTop: 14 },
  miniTitle: { fontWeight: "bold", marginBottom: 10 },
});

