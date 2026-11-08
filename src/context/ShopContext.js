
import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";

import { BACKEND_URL } from "../api/config";
import {
  authHeaders,
  ensureSession,
  fetchProfile,
} from "../api/session";

const ShopContext = createContext();

const parseJson = (value, fallback) => {
  if (!value) return fallback;

  if (typeof value !== "string") return value;

  try {
    return JSON.parse(value);
  } catch (e) {
    return fallback;
  }
};

export function ShopProvider({ children }) {
  const [customer, setCustomer] = useState(null);
  const [sessionReady, setSessionReady] = useState(false);
  const [sessionError, setSessionError] = useState("");

  const tokenRef = useRef(null);

  const [cart, setCart] = useState([]);
  const [savedForLater, setSavedForLater] = useState([]);
  const [orders, setOrders] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [returnRequests, setReturnRequests] = useState([]);

  // ---------- LOAD CART ----------

  const loadCart = async (token) => {
    if (!token) return;

    const res = await fetch(`${BACKEND_URL}/api/cart`, {
      headers: authHeaders(token),
    });

    if (!res.ok) {
      throw new Error(`Cart request failed (${res.status})`);
    }

    const data = await res.json();

    setCart(parseJson(data.items, []));
    setSavedForLater(parseJson(data.savedForLater, []));
  };

  // ---------- LOAD ORDERS ----------

  const loadOrders = async (token) => {
    if (!token) return;

    const res = await fetch(`${BACKEND_URL}/api/orders/mine`, {
      headers: authHeaders(token),
    });

    if (!res.ok) {
      throw new Error(`Orders request failed (${res.status})`);
    }

    const data = await res.json();

    setOrders(Array.isArray(data) ? data : []);
  };

  // ---------- LOAD CUSTOMER NOTIFICATIONS ----------

  const loadNotifications = async (token) => {
    if (!token) return;

    const res = await fetch(`${BACKEND_URL}/api/notifications`, {
      headers: authHeaders(token),
    });

    if (!res.ok) {
      throw new Error(
        `Notifications request failed (${res.status})`
      );
    }

    const data = await res.json();

    setNotifications(Array.isArray(data) ? data : []);
  };

  // ---------- CREATE CUSTOMER SESSION ----------

  useEffect(() => {
    let active = true;

    (async () => {
      try {
        const profile = await ensureSession();

        if (!active) return;

        tokenRef.current = profile.token;
        setCustomer(profile);

        await Promise.allSettled([
          loadCart(profile.token),
          loadOrders(profile.token),
          loadNotifications(profile.token),
        ]);

      } catch (e) {
        if (active) {
          setSessionError(e.message);
        }
      } finally {
        if (active) {
          setSessionReady(true);
        }
      }
    })();

    return () => {
      active = false;
    };
  }, []);

  // ---------- RELOAD ORDERS ----------

  const reloadOrders = useCallback(() => {
    return loadOrders(tokenRef.current);
  }, []);

  // ---------- RELOAD NOTIFICATIONS ----------

  const reloadNotifications = useCallback(async () => {
    try {
      await loadNotifications(tokenRef.current);
    } catch (e) {
      console.log(
        "Could not load notifications:",
        e.message
      );
    }
  }, []);

  // ---------- REFRESH PROFILE ----------

  const refreshProfile = useCallback(async () => {
    if (!tokenRef.current) return;

    try {
      const fresh = await fetchProfile(tokenRef.current);
      setCustomer(fresh);
    } catch (e) {
      console.log(
        "Could not refresh profile:",
        e.message
      );
    }
  }, []);

  // ---------- SAVE CART TO MYSQL ----------

  const saveCart = async (nextItems, nextSaved) => {
    setCart(nextItems);
    setSavedForLater(nextSaved);

    if (!tokenRef.current) return;

    try {
      await fetch(`${BACKEND_URL}/api/cart`, {
        method: "POST",

        headers: {
          "Content-Type": "application/json",
          ...authHeaders(tokenRef.current),
        },

        body: JSON.stringify({
          items: JSON.stringify(nextItems),
          savedForLater: JSON.stringify(nextSaved),
        }),
      });

    } catch (e) {
      console.log("Could not save cart:", e.message);
    }
  };

  // ---------- CART HELPERS ----------

  const capFor = (item) => (
    item.stock != null ? item.stock : 999
  );

  const buildCartItem = (product, quantity) => ({
    id: "p" + product.id,
    productId: product.id,
    name: product.name,
    variant: product.variant || "",
    price: product.price,
    icon: product.icon || "",
    stock: product.stock,
    quantity,
  });

  // ---------- ADD TO CART ----------

  const addToCart = (product) => {
    const existing = cart.find(
      (i) => i.productId === product.id
    );

    const cap = product.stock != null
      ? product.stock
      : 999;

    const next = existing
      ? cart.map((i) =>
          i.productId === product.id
            ? {
                ...i,
                quantity: Math.min(
                  i.quantity + 1,
                  cap
                ),
              }
            : i
        )
      : [...cart, buildCartItem(product, 1)];

    saveCart(next, savedForLater);
  };

  // ---------- REORDER ----------

  const addItemsToCart = async (orderItems) => {
    let next = [...cart];

    let added = 0;
    let skipped = 0;

    for (const it of orderItems) {
      let product = null;

      if (it.productId != null) {
        try {
          const r = await fetch(
            `${BACKEND_URL}/api/products/${it.productId}`
          );

          if (r.ok) {
            product = await r.json();
          }
        } catch (e) {
          product = null;
        }
      }

      if (
        !product ||
        (product.stock != null && product.stock <= 0)
      ) {
        skipped++;
        continue;
      }

      const cap = product.stock != null
        ? product.stock
        : 999;

      const qty = Math.min(
        it.quantity || 1,
        cap
      );

      const existing = next.find(
        (i) => i.productId === product.id
      );

      if (existing) {
        next = next.map((i) =>
          i.productId === product.id
            ? {
                ...i,
                quantity: Math.min(
                  i.quantity + qty,
                  cap
                ),
                price: product.price,
                stock: product.stock,
              }
            : i
        );
      } else {
        next.push(buildCartItem(product, qty));
      }

      added++;
    }

    await saveCart(next, savedForLater);

    return { added, skipped };
  };

  // ---------- CART ACTIONS ----------

  const changeQuantity = (id, change) => {
    const next = cart.map((item) =>
      item.id === id
        ? {
            ...item,
            quantity: Math.max(
              1,
              Math.min(
                capFor(item),
                item.quantity + change
              )
            ),
          }
        : item
    );

    saveCart(next, savedForLater);
  };

  const setQuantity = (id, quantity) => {
    const next = cart.map((item) =>
      item.id === id
        ? {
            ...item,
            quantity: Math.max(
              1,
              Math.min(
                capFor(item),
                Number(quantity) || 1
              )
            ),
          }
        : item
    );

    saveCart(next, savedForLater);
  };

  const addQuantity = (id, amount) => {
    const next = cart.map((item) =>
      item.id === id
        ? {
            ...item,
            quantity: Math.min(
              capFor(item),
              item.quantity + amount
            ),
          }
        : item
    );

    saveCart(next, savedForLater);
  };

  const removeFromCart = (id) => {
    saveCart(
      cart.filter((item) => item.id !== id),
      savedForLater
    );
  };

  const clearCart = () => {
    saveCart([], savedForLater);
  };

  const getCartTotal = () => {
    return cart.reduce(
      (sum, item) => sum + item.price * item.quantity,
      0
    );
  };

  // ---------- SAVE FOR LATER ----------

  const saveForLater = (id) => {
    const item = cart.find((i) => i.id === id);

    if (!item) return;

    saveCart(
      cart.filter((i) => i.id !== id),
      [...savedForLater, item]
    );
  };

  const moveBackToCart = (id) => {
    const item = savedForLater.find(
      (i) => i.id === id
    );

    if (!item) return;

    saveCart(
      [...cart, item],
      savedForLater.filter((i) => i.id !== id)
    );
  };

  const removeSavedItem = (id) => {
    saveCart(
      cart,
      savedForLater.filter((i) => i.id !== id)
    );
  };

  // ---------- ORDERS ----------

  const placeOrder = async ({ onlyItemId = null } = {}) => {
    const remaining = onlyItemId
      ? cart.filter((i) => i.id !== onlyItemId)
      : [];

    await saveCart(remaining, savedForLater);

    try {
      await loadOrders(tokenRef.current);
      await loadNotifications(tokenRef.current);
    } catch (e) {
      console.log(
        "Could not refresh after order:",
        e.message
      );
    }
  };

  // ---------- CANCEL ORDER ----------

  const cancelOrder = async (dbId) => {
    const res = await fetch(
      `${BACKEND_URL}/api/orders/${dbId}/cancel`,
      {
        method: "PUT",
        headers: authHeaders(tokenRef.current),
      }
    );

    if (!res.ok) {
      const text = await res.text();

      throw new Error(
        text || `Cancel failed (${res.status})`
      );
    }

    await loadOrders(tokenRef.current);
    await reloadNotifications();
  };

  // ---------- RETURNS ----------

  // Existing temporary local return-request function.
  // This has not yet been connected to the backend.

  const submitReturnRequest = ({
    orderId,
    actionType,
    reason,
    photoUri,
  }) => {
    const request = {
      id: `REQ-${Date.now().toString().slice(-6)}`,
      orderId,
      actionType,
      reason,
      photoUri: photoUri || null,
      status: "Received - Under Review",
      date: new Date().toISOString().slice(0, 10),
    };

    setReturnRequests((prev) => [
      request,
      ...prev,
    ]);

    return request;
  };

  // ---------- MARK ALL NOTIFICATIONS READ ----------

  const markAllNotificationsRead = async () => {
    if (!tokenRef.current) {
      throw new Error("Customer session is not ready.");
    }

    const res = await fetch(
      `${BACKEND_URL}/api/notifications/mark-all-read`,
      {
        method: "PUT",
        headers: authHeaders(tokenRef.current),
      }
    );

    if (!res.ok) {
      const text = await res.text();

      throw new Error(
        text || `Could not mark notifications read (${res.status})`
      );
    }

    const updated = await res.json();

    setNotifications(
      Array.isArray(updated)
        ? updated
        : notifications.map((n) => ({
            ...n,
            read: true,
          }))
    );
  };

  // ---------- PROVIDER ----------

  return (
    <ShopContext.Provider
      value={{
        customer,
        sessionReady,
        sessionError,
        refreshProfile,

        cart,
        savedForLater,
        orders,
        notifications,
        returnRequests,

        addToCart,
        addItemsToCart,

        changeQuantity,
        setQuantity,
        addQuantity,
        removeFromCart,
        clearCart,
        getCartTotal,

        saveForLater,
        moveBackToCart,
        removeSavedItem,

        placeOrder,
        cancelOrder,
        reloadOrders,
        reloadNotifications,

        submitReturnRequest,
        markAllNotificationsRead,
      }}
    >
      {children}
    </ShopContext.Provider>
  );
}

export function useShop() {
  const context = useContext(ShopContext);

  if (!context) {
    throw new Error(
      "useShop must be used inside ShopProvider."
    );
  }

  return context;
}
