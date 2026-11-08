import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { COLORS } from '../constants/colors';

import HomeScreen from '../screens/HomeScreen';
import SearchScreen from '../screens/SearchScreen';
import ProductsScreen from '../screens/ProductsScreen';
import ProductDetailScreen from '../screens/ProductDetailScreen';
import AdminProducts from '../screens/AdminProducts';
import AddProduct from '../screens/AddProduct';
import CartScreen from '../src/screens/CartScreen';
import CheckoutScreen from '../src/screens/CheckoutScreen';
import OrderConfirmationScreen from '../src/screens/OrderConfirmationScreen';
import OrderHistoryScreen from '../src/screens/OrderHistoryScreen';
import OrderDetailScreen from '../src/screens/OrderDetailScreen';
import ReturnScreen from '../src/screens/ReturnScreen';
import ChatScreen from '../src/screens/ChatScreen';
import NotificationsScreen from '../src/screens/NotificationsScreen';
import { ShopProvider } from '../src/context/ShopContext';

const Stack = createNativeStackNavigator();

export default function AppNavigator() {
  return (
    <ShopProvider>
      <NavigationContainer>
      <Stack.Navigator
        screenOptions={{
          headerStyle: { backgroundColor: COLORS.primary },
          headerTintColor: 'white',
          headerTitleStyle: { fontWeight: 'bold' },
        }}
      >
        <Stack.Screen name="Home" component={HomeScreen} options={{ title: 'ðŸ  Home' }} />
        <Stack.Screen name="AdminProducts" component={AdminProducts} options={{ title: 'Admin Â· Products' }} />
        <Stack.Screen name="AddProduct" component={AddProduct} options={{ title: 'Add / Edit Product' }} />
        <Stack.Screen name="Search" component={SearchScreen} options={{ title: 'ðŸ” Search' }} />
        <Stack.Screen name="Products" component={ProductsScreen} options={({ route }) => ({ title: route.params?.category || 'Products' })} />
        <Stack.Screen name="ProductDetail" component={ProductDetailScreen} options={{ title: 'ðŸ“„ Product' }} />
        <Stack.Screen name="Cart" component={CartScreen} options={{ title: 'Shopping Cart' }} />
              <Stack.Screen name="Checkout" component={CheckoutScreen} options={{ title: 'Checkout' }} />
        <Stack.Screen name="OrderConfirmation" component={OrderConfirmationScreen} options={{ title: 'Order confirmed' }} />
        <Stack.Screen name="Orders" component={OrderHistoryScreen} options={{ title: 'My orders' }} />
        <Stack.Screen name="OrderDetail" component={OrderDetailScreen} options={{ title: 'Order details' }} />
        <Stack.Screen name="Return" component={ReturnScreen} options={{ title: 'Return / Exchange' }} />
        <Stack.Screen name="Chat" component={ChatScreen} options={{ title: 'Chat with shop' }} />
        <Stack.Screen name="Notifications" component={NotificationsScreen} options={{ title: 'Notifications' }} />
      </Stack.Navigator>
    </NavigationContainer>
    </ShopProvider>
  );
}
