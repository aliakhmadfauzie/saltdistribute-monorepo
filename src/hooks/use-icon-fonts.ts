import { useState, useEffect } from "react";
import * as Font from "expo-font";
import { MaterialCommunityIcons, Ionicons, Feather } from "@expo/vector-icons";

export function useIconFonts(): [boolean, Error | null] {
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    async function loadFonts() {
      try {
        await Font.loadAsync({
          ...MaterialCommunityIcons.font,
          ...Ionicons.font,
          ...Feather.font,
        });
        setLoaded(true);
      } catch (err: any) {
        // Fall back gracefully so app does not freeze
        setError(err);
        setLoaded(true);
      }
    }

    loadFonts();
  }, []);

  return [loaded, error];
}
