import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { COLORS } from "../constants/colors";

// Member 2 + Member 3 screens (existing)
import AddProduct from "../screens/AddProduct";
import AdminProducts from "../screens/AdminProducts";
import HomeScreen from "../screens/HomeScreen";
import ProductDetailScreen from "../screens/ProductDetailScreen";
import ProductsScreen from "../screens/ProductsScreen";
import SearchScreen from "../screens/SearchScreen";
import { ShopProvider } from "../src/context/ShopContext";
import CartScreen from "../src/screens/CartScreen";
import ChatScreen from "../src/screens/ChatScreen";
import CheckoutScreen from "../src/screens/CheckoutScreen";
import NotificationsScreen from "../src/screens/NotificationsScreen";
import OrderConfirmationScreen from "../src/screens/OrderConfirmationScreen";
import OrderDetailScreen from "../src/screens/OrderDetailScreen";
import OrderHistoryScreen from "../src/screens/OrderHistoryScreen";
import ReturnScreen from "../src/screens/ReturnScreen";

// Member 1 screens (new)
import AdminDashboardScreen from "../screens/AdminDashboardScreen";
import AdminLoginScreen from "../screens/AdminLoginScreen";
import ChooseRoleScreen from "../screens/ChooseRoleScreen";
import LoginScreen from "../screens/LoginScreen";
import OnboardingScreen from "../screens/OnboardingScreen";
import ProfileScreen from "../screens/ProfileScreen";
import SplashScreen from "../screens/SplashScreen";

const Stack = createNativeStackNavigator();

export default function AppNavigator() {
  return (
    <ShopProvider>
      <NavigationContainer>
        <Stack.Navigator
          initialRouteName="SplashScreen"
          screenOptions={{
            headerStyle: { backgroundColor: COLORS.primary },
            headerTintColor: "white",
            headerTitleStyle: { fontWeight: "bold" },
          }}
        >
          {/* Member 1 screens - Auth Flow */}
          <Stack.Screen
            name="SplashScreen"
            component={SplashScreen}
            options={{ headerShown: false }}
          />
          <Stack.Screen
            name="OnboardingScreen"
            component={OnboardingScreen}
            options={{ headerShown: false }}
          />
          <Stack.Screen
            name="ChooseRoleScreen"
            component={ChooseRoleScreen}
            options={{ headerShown: false }}
          />
          <Stack.Screen
            name="LoginScreen"
            component={LoginScreen}
            options={{ headerShown: false }}
          />
          <Stack.Screen
            name="AdminLoginScreen"
            component={AdminLoginScreen}
            options={{ headerShown: false }}
          />
          <Stack.Screen
            name="AdminDashboardScreen"
            component={AdminDashboardScreen}
            options={{ headerShown: false }}
          />
          <Stack.Screen
            name="ProfileScreen"
            component={ProfileScreen}
            options={{ headerShown: false }}
          />

          {/* Member 1 - alias so navigation.replace('HomeScreen') also works */}
          <Stack.Screen
            name="HomeScreen"
            component={HomeScreen}
            options={{ title: "🏠 Home" }}
          />

          {/* Member 2 + Member 3 screens - keep original names */}
          <Stack.Screen
            name="Home"
            component={HomeScreen}
            options={{ title: "🏠 Home" }}
          />
          <Stack.Screen
            name="AdminProducts"
            component={AdminProducts}
            options={{ title: "Admin · Products" }}
          />
          <Stack.Screen
            name="AddProduct"
            component={AddProduct}
            options={{ title: "Add / Edit Product" }}
          />
          <Stack.Screen
            name="Search"
            component={SearchScreen}
            options={{ title: "🔍 Search" }}
          />
          <Stack.Screen
            name="Products"
            component={ProductsScreen}
            options={({ route }) => ({
              title: route.params?.category || "Products",
            })}
          />
          <Stack.Screen
            name="ProductDetail"
            component={ProductDetailScreen}
            options={{ title: "📄 Product" }}
          />
          <Stack.Screen
            name="Cart"
            component={CartScreen}
            options={{ title: "Shopping Cart" }}
          />
          <Stack.Screen
            name="Checkout"
            component={CheckoutScreen}
            options={{ title: "Checkout" }}
          />
          <Stack.Screen
            name="OrderConfirmation"
            component={OrderConfirmationScreen}
            options={{ title: "Order confirmed" }}
          />
          <Stack.Screen
            name="Orders"
            component={OrderHistoryScreen}
            options={{ title: "My orders" }}
          />
          <Stack.Screen
            name="OrderDetail"
            component={OrderDetailScreen}
            options={{ title: "Order details" }}
          />
          <Stack.Screen
            name="Return"
            component={ReturnScreen}
            options={{ title: "Return / Exchange" }}
          />
          <Stack.Screen
            name="Chat"
            component={ChatScreen}
            options={{ title: "Chat with shop" }}
          />
          <Stack.Screen
            name="Notifications"
            component={NotificationsScreen}
            options={{ title: "Notifications" }}
          />
        </Stack.Navigator>
      </NavigationContainer>
    </ShopProvider>
  );
}
