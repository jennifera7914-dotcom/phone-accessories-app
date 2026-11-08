import AsyncStorage from "@react-native-async-storage/async-storage";
import { useNavigation } from "@react-navigation/native";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";

export default function OnboardingScreen() {
  const navigation = useNavigation<any>();

  const handleGetStarted = async () => {
    await AsyncStorage.setItem("hasSeenOnboarding", "true");
    navigation.replace("ChooseRole");
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Welcome to Mobile Accessory Hub! ðŸ‘‹</Text>
      <Text style={styles.desc}>
        Wholesale mobile covers, chargers & accessories at best prices. Only for
        registered customers.
      </Text>
      <TouchableOpacity style={styles.button} onPress={handleGetStarted}>
        <Text style={styles.buttonText}>Get Started â†’</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 30,
    backgroundColor: "#fff",
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    textAlign: "center",
    marginBottom: 15,
  },
  desc: { fontSize: 15, color: "#666", textAlign: "center", marginBottom: 30 },
  button: {
    backgroundColor: "#6200EE",
    paddingVertical: 15,
    paddingHorizontal: 40,
    borderRadius: 30,
  },
  buttonText: { color: "#fff", fontSize: 18, fontWeight: "bold" },
});

