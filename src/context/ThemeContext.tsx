import AsyncStorage from "@react-native-async-storage/async-storage";
import { createContext, useContext, useEffect, useState } from "react";

const lightColors = {
  background: "#ffffff",
  card: "#f5f5f5",
  text: "#000000",
  subText: "#666666",
  border: "#dddddd",
  primary: "#6200EE",
};

const darkColors = {
  background: "#121212",
  card: "#1e1e1e",
  text: "#ffffff",
  subText: "#aaaaaa",
  border: "#333333",
  primary: "#BB86FC",
};

const ThemeContext = createContext<any>(null);

export const ThemeProvider = ({ children }: any) => {
  const [isDark, setIsDark] = useState(false);

  useEffect(() => {
    AsyncStorage.getItem("theme").then((val) => {
      if (val === "dark") setIsDark(true);
    });
  }, []);

  const toggleTheme = async () => {
    const newMode = !isDark;
    setIsDark(newMode);
    await AsyncStorage.setItem("theme", newMode ? "dark" : "light");
  };

  const colors = isDark ? darkColors : lightColors;

  return (
    <ThemeContext.Provider value={{ isDark, colors, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => useContext(ThemeContext);
