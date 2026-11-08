import React from "react";
import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { COLORS } from "../constants/colors";

import StartupScreen from "./StartupScreen";
import OnboardingScreen from "../src/navigation-screens/OnboardingScreen";
import ChooseRoleScreen from "../src/navigation-screens/ChooseRoleScreen";
import CustomerLoginScreen from "../src/navigation-screens/CustomerLoginScreen";
import OwnerLoginScreen from "../src/navigation-screens/OwnerLoginScreen";
import OwnerDashboardScreen from "../src/navigation-screens/OwnerDashboardScreen";
import ProfileScreen from "../src/navigation-screens/ProfileScreen";

import HomeScreen from "../screens/HomeScreen";
import SearchScreen from "../screens/SearchScreen";
import ProductsScreen from "../screens/ProductsScreen";
import ProductDetailScreen from "../screens/ProductDetailScreen";
import AdminProducts from "../screens/AdminProducts";
import AddProduct from "../screens/AddProduct";

import CartScreen from "../src/screens/CartScreen";
import CheckoutScreen from "../src/screens/CheckoutScreen";
import OrderConfirmationScreen from "../src/screens/OrderConfirmationScreen";
import OrderHistoryScreen from "../src/screens/OrderHistoryScreen";
import OrderDetailScreen from "../src/screens/OrderDetailScreen";
import ReturnScreen from "../src/screens/ReturnScreen";
import ChatScreen from "../src/screens/ChatScreen";
import NotificationsScreen from "../src/screens/NotificationsScreen";

import { ShopProvider } from "../src/context/ShopContext";
import { ThemeProvider } from "../src/context/ThemeContext";

const Stack = createNativeStackNavigator();

export default function AppNavigator() {
  return (
    <ThemeProvider>
      <ShopProvider>
        <NavigationContainer>
          <Stack.Navigator
            initialRouteName="Startup"
            screenOptions={{
              headerStyle: { backgroundColor: COLORS.primary },
              headerTintColor: "#fff",
              headerTitleStyle: { fontWeight: "bold" },
            }}
          >
            <Stack.Screen name="Startup" component={StartupScreen} options={{ headerShown: false }} />
            <Stack.Screen name="Onboarding" component={OnboardingScreen} options={{ headerShown: false }} />
            <Stack.Screen name="ChooseRole" component={ChooseRoleScreen} options={{ title: "Choose Role" }} />
            <Stack.Screen name="CustomerLogin" component={CustomerLoginScreen} options={{ title: "Customer Login" }} />
            <Stack.Screen name="OwnerLogin" component={OwnerLoginScreen} options={{ title: "Owner Login" }} />
            <Stack.Screen name="OwnerDashboard" component={OwnerDashboardScreen} options={{ title: "Owner Dashboard" }} />

            <Stack.Screen name="Home" component={HomeScreen} options={{ title: "Home" }} />
            <Stack.Screen name="Search" component={SearchScreen} options={{ title: "Search" }} />
            <Stack.Screen name="Products" component={ProductsScreen} options={({ route }) => ({ title: route.params?.category || "Products" })} />
            <Stack.Screen name="ProductDetail" component={ProductDetailScreen} options={{ title: "Product" }} />
            <Stack.Screen name="AdminProducts" component={AdminProducts} options={{ title: "Admin Products" }} />
            <Stack.Screen name="AddProduct" component={AddProduct} options={{ title: "Add / Edit Product" }} />

            <Stack.Screen name="Cart" component={CartScreen} options={{ title: "Shopping Cart" }} />
            <Stack.Screen name="Checkout" component={CheckoutScreen} options={{ title: "Checkout" }} />
            <Stack.Screen name="OrderConfirmation" component={OrderConfirmationScreen} options={{ title: "Order Confirmed" }} />
            <Stack.Screen name="Orders" component={OrderHistoryScreen} options={{ title: "My Orders" }} />
            <Stack.Screen name="OrderDetail" component={OrderDetailScreen} options={{ title: "Order Details" }} />
            <Stack.Screen name="Return" component={ReturnScreen} options={{ title: "Return / Exchange" }} />
            <Stack.Screen name="Chat" component={ChatScreen} options={{ title: "Chat with Shop" }} />
            <Stack.Screen name="Notifications" component={NotificationsScreen} options={{ title: "Notifications" }} />
            <Stack.Screen name="Profile" component={ProfileScreen} options={{ title: "My Profile" }} />
          </Stack.Navigator>
        </NavigationContainer>
      </ShopProvider>
    </ThemeProvider>
  );
}
