import { StyleSheet, Text, TouchableOpacity, View } from "react-native";

export default function ChooseRoleScreen({ navigation }) {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Mobile Accessory Hub</Text>
      <Text style={styles.sub}>Choose how you want to continue</Text>

      <TouchableOpacity
        style={styles.card}
        onPress={() => navigation.navigate("LoginScreen")}
      >
        <Text style={styles.icon}>👤</Text>
        <Text style={styles.cardTitle}>Customer</Text>
        <Text style={styles.cardDesc}>Phone / Name + 4-Digit PIN</Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.card}
        onPress={() => navigation.navigate("AdminLoginScreen")}
      >
        <Text style={styles.icon}>🔑</Text>
        <Text style={styles.cardTitle}>Owner</Text>
        <Text style={styles.cardDesc}>Email + Password</Text>
      </TouchableOpacity>
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
    fontSize: 26,
    fontWeight: "bold",
    textAlign: "center",
    color: "#000",
  },
  sub: {
    fontSize: 13,
    textAlign: "center",
    marginTop: 6,
    marginBottom: 35,
    color: "#666",
    opacity: 0.8,
  },
  card: {
    padding: 25,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#ddd",
    alignItems: "center",
    marginBottom: 15,
    backgroundColor: "#f5f5f5",
  },
  icon: {
    fontSize: 36,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: "bold",
    marginTop: 10,
    color: "#000",
  },
  cardDesc: {
    fontSize: 12,
    marginTop: 4,
    textAlign: "center",
    color: "#666",
  },
});
