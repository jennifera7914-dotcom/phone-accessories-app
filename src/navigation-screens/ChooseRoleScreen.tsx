import { useNavigation } from "@react-navigation/native";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { useTheme } from "../context/ThemeContext";

export default function ChooseRoleScreen() {
  const navigation = useNavigation<any>();
  const { colors } = useTheme();

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <Text style={[styles.title, { color: colors.text }]}>
        Mobile Accessory Hub
      </Text>
      <Text style={[styles.sub, { color: colors.subText }]}>
        Choose how you want to continue
      </Text>

      <TouchableOpacity
        style={[
          styles.card,
          { backgroundColor: colors.card, borderColor: colors.border },
        ]}
        onPress={() => navigation.navigate("CustomerLogin")}
      >
        
        <Text style={[styles.cardTitle, { color: colors.text }]}>Customer</Text>
        <Text style={[styles.cardDesc, { color: colors.subText }]}>
          Phone / Name + 4-Digit PIN
        </Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={[
          styles.card,
          { backgroundColor: colors.card, borderColor: colors.border },
        ]}
        onPress={() => navigation.navigate("OwnerLogin")}
      >
        
        <Text style={[styles.cardTitle, { color: colors.text }]}>Owner</Text>
        <Text style={[styles.cardDesc, { color: colors.subText }]}>
          Email + Password
        </Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: "center", padding: 30 },
  title: { fontSize: 26, fontWeight: "bold", textAlign: "center" },
  sub: {
    fontSize: 13,
    textAlign: "center",
    marginTop: 6,
    marginBottom: 35,
    opacity: 0.8,
  },
  card: {
    padding: 25,
    borderRadius: 16,
    borderWidth: 1,
    alignItems: "center",
    marginBottom: 15,
  },
  icon: { fontSize: 36 },
  cardTitle: { fontSize: 18, fontWeight: "bold", marginTop: 10 },
  cardDesc: { fontSize: 12, marginTop: 4, textAlign: "center" },
});


