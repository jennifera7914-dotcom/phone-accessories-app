import AsyncStorage from "@react-native-async-storage/async-storage";
import { useEffect, useState } from "react";
import { ActivityIndicator, StyleSheet, Text, View } from "react-native";

export default function SplashScreen({ navigation }) {
  const [error, setError] = useState("");

  useEffect(() => {
    const check = async () => {
      try {
        await new Promise((r) => setTimeout(r, 2000));
        const hasSeenOnboarding =
          await AsyncStorage.getItem("hasSeenOnboarding");
        const admin = await AsyncStorage.getItem("admin");
        const user = await AsyncStorage.getItem("user");

        if (!hasSeenOnboarding) {
          navigation.replace("OnboardingScreen");
        } else if (admin) {
          navigation.replace("AdminDashboardScreen");
        } else if (user) {
          navigation.replace("HomeScreen");
        } else {
          navigation.replace("ChooseRoleScreen");
        }
      } catch (e) {
        setError(e.message || String(e));
        setTimeout(() => navigation.replace("ChooseRoleScreen"), 1000);
      }
    };
    check();
  }, []);

  return (
    <View style={styles.container}>
      <Text style={styles.logo}>📱 Mobile Accessory Hub</Text>
      <Text style={styles.subtitle}>Wholesale Accessories Store</Text>
      <ActivityIndicator size="large" color="#fff" style={{ marginTop: 20 }} />
      <Text style={styles.loading}>Loading...</Text>
      {error ? <Text style={styles.error}>{error}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#6200EE",
    justifyContent: "center",
    alignItems: "center",
  },
  logo: {
    fontSize: 26,
    fontWeight: "bold",
    color: "#fff",
    textAlign: "center",
  },
  subtitle: {
    fontSize: 14,
    color: "#fff",
    marginTop: 8,
    opacity: 0.9,
  },
  loading: {
    color: "#fff",
    marginTop: 10,
  },
  error: {
    color: "yellow",
    marginTop: 10,
    paddingHorizontal: 20,
    textAlign: "center",
  },
});
