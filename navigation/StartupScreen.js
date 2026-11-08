import React, { useEffect } from "react";
import { ActivityIndicator, Text, View } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useNavigation } from "@react-navigation/native";

export default function StartupScreen() {
  const navigation = useNavigation();

  useEffect(() => {
    let active = true;
    const start = async () => {
      try {
        const [hasSeenOnboarding, admin, user] = await Promise.all([
          AsyncStorage.getItem("hasSeenOnboarding"),
          AsyncStorage.getItem("admin"),
          AsyncStorage.getItem("user"),
        ]);

        if (!active) return;

        let route = "ChooseRole";
        if (!hasSeenOnboarding) route = "Onboarding";
        else if (admin) route = "OwnerDashboard";
        else if (user) route = "Home";

        navigation.reset({ index: 0, routes: [{ name: route }] });
      } catch (error) {
        if (active) navigation.reset({ index: 0, routes: [{ name: "ChooseRole" }] });
      }
    };

    start();
    return () => { active = false; };
  }, [navigation]);

  return (
    <View style={{ flex: 1, backgroundColor: "#6200EE", alignItems: "center", justifyContent: "center" }}>
      <Text style={{ color: "#fff", fontSize: 25, fontWeight: "bold" }}>Mobile Accessory Hub</Text>
      <Text style={{ color: "#fff", marginTop: 8 }}>Wholesale Accessories Store</Text>
      <ActivityIndicator color="#fff" size="large" style={{ marginTop: 22 }} />
      <Text style={{ color: "#fff", marginTop: 10 }}>Loading...</Text>
    </View>
  );
}

