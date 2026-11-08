import AsyncStorage from "@react-native-async-storage/async-storage";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";

export default function OnboardingScreen({ navigation }) {
  const handleGetStarted = async () => {
    await AsyncStorage.setItem("hasSeenOnboarding", "true");
    navigation.replace("ChooseRoleScreen");
  };

  return (
    <View style={styles.container}>
      <Text style={styles.icon}>📱</Text>
      <Text style={styles.title}>Welcome to Mobile Accessory Hub</Text>
      <Text style={styles.subtitle}>
        Your trusted wholesale partner for mobile accessories
      </Text>

      <View style={styles.features}>
        <Text style={styles.feature}>✓ Quality products</Text>
        <Text style={styles.feature}>✓ Wholesale prices</Text>
        <Text style={styles.feature}>✓ Fast delivery</Text>
        <Text style={styles.feature}>✓ Dedicated support</Text>
      </View>

      <TouchableOpacity style={styles.button} onPress={handleGetStarted}>
        <Text style={styles.buttonText}>Get Started</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
    justifyContent: "center",
    alignItems: "center",
    padding: 30,
  },
  icon: {
    fontSize: 80,
    marginBottom: 20,
  },
  title: {
    fontSize: 26,
    fontWeight: "bold",
    color: "#6200EE",
    textAlign: "center",
    marginBottom: 10,
  },
  subtitle: {
    fontSize: 15,
    color: "#666",
    textAlign: "center",
    marginBottom: 30,
  },
  features: {
    marginBottom: 40,
    alignItems: "flex-start",
  },
  feature: {
    fontSize: 16,
    color: "#333",
    marginVertical: 5,
  },
  button: {
    backgroundColor: "#6200EE",
    paddingVertical: 15,
    paddingHorizontal: 60,
    borderRadius: 30,
  },
  buttonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "bold",
  },
});
