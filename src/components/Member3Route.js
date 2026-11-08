import React from "react";
import { useShop } from "../context/ShopContext";
import {
  useNavigation,
  useRouter,
  useLocalSearchParams,
} from "expo-router";

const routePaths = {
  Home: "/home",
  Profile: "/profile",
  ProductDetail: "/product-detail",
  Cart: "/cart",
  Checkout: "/checkout",
  OrderConfirmation: "/order-confirmation",
  Orders: "/orders",
  OrderDetail: "/order-detail",
  Return: "/return",
  Chat: "/chat",
  Notifications: "/notifications",
};

function cleanParams(routeParams = {}) {
  const result = {};

  Object.entries(routeParams).forEach(([key, value]) => {
    if (value !== null && value !== undefined) {
      result[key] = String(value);
    }
  });

  return result;
}

export default function Member3Route({ component: Screen }) {
  const nativeNavigation = useNavigation();
  const router = useRouter();
  const params = useLocalSearchParams();
  const { addToCart } = useShop();

  const navigation = React.useMemo(() => ({
    navigate(name, routeParams) {
      const pathname = routePaths[name];

      if (!pathname) {
        console.warn("Unknown Member 3 route:", name);
        return;
      }

      router.push({
        pathname,
        params: cleanParams(routeParams),
      });
    },

    replace(name, routeParams) {
      const pathname = routePaths[name];

      if (!pathname) {
        console.warn("Unknown Member 3 route:", name);
        return;
      }

      router.replace({
        pathname,
        params: cleanParams(routeParams),
      });
    },

    goBack() {
      router.back();
    },

    addListener(event, callback) {
      return nativeNavigation.addListener(event, callback);
    },
  }), [nativeNavigation, router]);

  const route = React.useMemo(() => ({
    params: {
      ...params,
      buyNowId: params.buyNowId != null
        ? Number(params.buyNowId)
        : null,
      orderId: params.orderId != null
        ? Number(params.orderId)
        : undefined,
      total: params.total != null
        ? Number(params.total)
        : undefined,
    },
  }), [params]);

  return <Screen navigation={navigation} route={route} addToCartToShop={addToCart} />;
}


