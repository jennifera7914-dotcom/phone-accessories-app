import { Stack } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import { ThemeProvider } from "../context/ThemeContext";
import { ShopProvider } from "../context/ShopContext";
import { AnimatedSplashOverlay } from "@/components/animated-icon";

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  return (
    <ShopProvider>
      <ThemeProvider>
        <AnimatedSplashOverlay />
        <Stack screenOptions={{ headerShown: false }}>
          <Stack.Screen name="index" />
          <Stack.Screen name="onboarding" />
          <Stack.Screen name="choose-role" />
          <Stack.Screen name="login" />
          <Stack.Screen name="admin-login" />
          <Stack.Screen name="admin-dashboard" />
          <Stack.Screen name="home" />
          <Stack.Screen name="profile" />
          <Stack.Screen name="explore" />
          <Stack.Screen name="cart" />
          <Stack.Screen name="checkout" />
          <Stack.Screen name="order-confirmation" />
          <Stack.Screen name="orders" />
          <Stack.Screen name="order-detail" />
          <Stack.Screen name="return" />
          <Stack.Screen name="chat" />
          <Stack.Screen name="notifications" />
                  <Stack.Screen name="product-detail" />
        </Stack>
      </ThemeProvider>
    </ShopProvider>
  );
}

