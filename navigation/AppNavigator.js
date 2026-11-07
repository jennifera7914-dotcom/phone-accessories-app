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

const Stack = createNativeStackNavigator();

export default function AppNavigator() {
  return (
    <NavigationContainer>
      <Stack.Navigator
        screenOptions={{
          headerStyle: { backgroundColor: COLORS.primary },
          headerTintColor: 'white',
          headerTitleStyle: { fontWeight: 'bold' },
        }}
      >
        <Stack.Screen name="Home" component={HomeScreen} options={{ title: '🏠 Home' }} />
        <Stack.Screen name="AdminProducts" component={AdminProducts} options={{ title: 'Admin · Products' }} />
        <Stack.Screen name="AddProduct" component={AddProduct} options={{ title: 'Add / Edit Product' }} />
        <Stack.Screen name="Search" component={SearchScreen} options={{ title: '🔍 Search' }} />
        <Stack.Screen name="Products" component={ProductsScreen} options={({ route }) => ({ title: route.params?.category || 'Products' })} />
        <Stack.Screen name="ProductDetail" component={ProductDetailScreen} options={{ title: '📄 Product' }} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}