import AsyncStorage from "@react-native-async-storage/async-storage";
import { BACKEND_URL } from "./config";

const TOKEN_KEY = "mobileshop_customer_token";

// Silent sign-in: reuses the stored token, or creates a new customer.
export async function ensureSession() {
  const storedToken = await AsyncStorage.getItem(TOKEN_KEY);

  const res = await fetch(`${BACKEND_URL}/api/customers/session`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ token: storedToken || "" }),
  });

  if (!res.ok) {
    throw new Error(`Session request failed (${res.status})`);
  }

  const profile = await res.json();
  await AsyncStorage.setItem(TOKEN_KEY, profile.token);
  return profile;
}

export async function fetchProfile(token) {
  const res = await fetch(`${BACKEND_URL}/api/customers/me`, {
    headers: { "X-Customer-Token": token || "" },
  });
  if (!res.ok) {
    throw new Error(`Profile request failed (${res.status})`);
  }
  return res.json();
}

export function authHeaders(token) {
  return { "X-Customer-Token": token || "" };
}