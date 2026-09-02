import React, { useEffect } from "react";
import { Stack } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import { LogBox } from "react-native";
import { SafeAreaProvider } from "react-native-safe-area-context";

import { useIconFonts } from "../src/hooks/use-icon-fonts";
import { AuthProvider } from "../src/context/AuthContext";
import { AppProvider } from "../src/context/AppContext";
import { I18nProvider } from "../src/i18n";
import InAppNotificationToast from "../src/components/InAppNotificationToast";
import AdminQuickOrderOverlay from "../src/components/AdminQuickOrderOverlay";

LogBox.ignoreAllLogs(true);
SplashScreen.preventAutoHideAsync().catch(() => {});

export default function RootLayout() {
  const [fontsLoaded, fontError] = useIconFonts();

  useEffect(() => {
    if (fontsLoaded || fontError) {
      SplashScreen.hideAsync().catch(() => {});
    }
  }, [fontsLoaded, fontError]);

  if (!fontsLoaded && !fontError) {
    return null;
  }

  return (
    <SafeAreaProvider>
      <I18nProvider>
        <AuthProvider>
          <AppProvider>
            <Stack screenOptions={{ headerShown: false }} />
            <InAppNotificationToast />
            <AdminQuickOrderOverlay />
          </AppProvider>
        </AuthProvider>
      </I18nProvider>
    </SafeAreaProvider>
  );
}
