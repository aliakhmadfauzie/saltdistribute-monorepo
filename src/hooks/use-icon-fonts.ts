import { useState, useEffect } from "react";
import { Platform } from "react-native";
import * as Font from "expo-font";
import {
  MaterialCommunityIcons,
  Ionicons,
  Feather,
  MaterialIcons,
  FontAwesome,
  AntDesign,
  Entypo,
  Octicons,
} from "@expo/vector-icons";

export function useIconFonts(): [boolean, Error | null] {
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    async function loadFonts() {
      try {
        // Load exact vector icon fonts bundled with @expo/vector-icons
        await Font.loadAsync({
          ...MaterialCommunityIcons.font,
          ...Ionicons.font,
          ...Feather.font,
          ...MaterialIcons.font,
          ...FontAwesome.font,
          ...AntDesign.font,
          ...Entypo.font,
          ...Octicons.font,
          // Aliases for React Native Web compatibility
          ionicons: (Ionicons.font as any).ionicons || (Ionicons.font as any).Ionicons,
          Ionicons: (Ionicons.font as any).ionicons || (Ionicons.font as any).Ionicons,
          "material-community": (MaterialCommunityIcons.font as any)["material-community"] || (MaterialCommunityIcons.font as any).MaterialCommunityIcons,
          MaterialCommunityIcons: (MaterialCommunityIcons.font as any)["material-community"] || (MaterialCommunityIcons.font as any).MaterialCommunityIcons,
          "Material Community Icons": (MaterialCommunityIcons.font as any)["material-community"] || (MaterialCommunityIcons.font as any).MaterialCommunityIcons,
          "Material Design Icons": (MaterialCommunityIcons.font as any)["material-community"] || (MaterialCommunityIcons.font as any).MaterialCommunityIcons,
          material: (MaterialIcons.font as any).material || (MaterialIcons.font as any).MaterialIcons,
          MaterialIcons: (MaterialIcons.font as any).material || (MaterialIcons.font as any).MaterialIcons,
          "Material Icons": (MaterialIcons.font as any).material || (MaterialIcons.font as any).MaterialIcons,
          feather: (Feather.font as any).feather || (Feather.font as any).Feather,
          Feather: (Feather.font as any).feather || (Feather.font as any).Feather,
        });

        // Web @font-face fallback injection to guarantee rendering across all browsers
        if (Platform.OS === "web" && typeof document !== "undefined") {
          const styleId = "expo-vector-icons-web-fonts";
          let style = document.getElementById(styleId) as HTMLStyleElement | null;
          if (!style) {
            style = document.createElement("style");
            style.id = styleId;
            document.head.appendChild(style);
          }
          style.textContent = `
            @font-face {
              font-family: 'ionicons';
              src: url('/fonts/Ionicons.ttf') format('truetype'),
                   url('https://cdn.jsdelivr.net/npm/@expo/vector-icons@15.1.1/build/vendor/react-native-vector-icons/Fonts/Ionicons.ttf') format('truetype');
              font-display: swap;
            }
            @font-face {
              font-family: 'Ionicons';
              src: url('/fonts/Ionicons.ttf') format('truetype'),
                   url('https://cdn.jsdelivr.net/npm/@expo/vector-icons@15.1.1/build/vendor/react-native-vector-icons/Fonts/Ionicons.ttf') format('truetype');
              font-display: swap;
            }
            @font-face {
              font-family: 'material-community';
              src: url('/fonts/MaterialCommunityIcons.ttf') format('truetype'),
                   url('https://cdn.jsdelivr.net/npm/@expo/vector-icons@15.1.1/build/vendor/react-native-vector-icons/Fonts/MaterialCommunityIcons.ttf') format('truetype');
              font-display: swap;
            }
            @font-face {
              font-family: 'MaterialCommunityIcons';
              src: url('/fonts/MaterialCommunityIcons.ttf') format('truetype'),
                   url('https://cdn.jsdelivr.net/npm/@expo/vector-icons@15.1.1/build/vendor/react-native-vector-icons/Fonts/MaterialCommunityIcons.ttf') format('truetype');
              font-display: swap;
            }
            @font-face {
              font-family: 'Material Design Icons';
              src: url('/fonts/MaterialCommunityIcons.ttf') format('truetype'),
                   url('https://cdn.jsdelivr.net/npm/@expo/vector-icons@15.1.1/build/vendor/react-native-vector-icons/Fonts/MaterialCommunityIcons.ttf') format('truetype');
              font-display: swap;
            }
            @font-face {
              font-family: 'material';
              src: url('/fonts/MaterialIcons.ttf') format('truetype'),
                   url('https://cdn.jsdelivr.net/npm/@expo/vector-icons@15.1.1/build/vendor/react-native-vector-icons/Fonts/MaterialIcons.ttf') format('truetype');
              font-display: swap;
            }
            @font-face {
              font-family: 'MaterialIcons';
              src: url('/fonts/MaterialIcons.ttf') format('truetype'),
                   url('https://cdn.jsdelivr.net/npm/@expo/vector-icons@15.1.1/build/vendor/react-native-vector-icons/Fonts/MaterialIcons.ttf') format('truetype');
              font-display: swap;
            }
            @font-face {
              font-family: 'Material Icons';
              src: url('/fonts/MaterialIcons.ttf') format('truetype'),
                   url('https://cdn.jsdelivr.net/npm/@expo/vector-icons@15.1.1/build/vendor/react-native-vector-icons/Fonts/MaterialIcons.ttf') format('truetype');
              font-display: swap;
            }
            @font-face {
              font-family: 'feather';
              src: url('/fonts/Feather.ttf') format('truetype'),
                   url('https://cdn.jsdelivr.net/npm/@expo/vector-icons@15.1.1/build/vendor/react-native-vector-icons/Fonts/Feather.ttf') format('truetype');
              font-display: swap;
            }
            @font-face {
              font-family: 'Feather';
              src: url('/fonts/Feather.ttf') format('truetype'),
                   url('https://cdn.jsdelivr.net/npm/@expo/vector-icons@15.1.1/build/vendor/react-native-vector-icons/Fonts/Feather.ttf') format('truetype');
              font-display: swap;
            }
            @font-face {
              font-family: 'FontAwesome';
              src: url('/fonts/FontAwesome.ttf') format('truetype'),
                   url('https://cdn.jsdelivr.net/npm/@expo/vector-icons@15.1.1/build/vendor/react-native-vector-icons/Fonts/FontAwesome.ttf') format('truetype');
              font-display: swap;
            }
            @font-face {
              font-family: 'AntDesign';
              src: url('/fonts/AntDesign.ttf') format('truetype'),
                   url('https://cdn.jsdelivr.net/npm/@expo/vector-icons@15.1.1/build/vendor/react-native-vector-icons/Fonts/AntDesign.ttf') format('truetype');
              font-display: swap;
            }
            @font-face {
              font-family: 'Entypo';
              src: url('/fonts/Entypo.ttf') format('truetype'),
                   url('https://cdn.jsdelivr.net/npm/@expo/vector-icons@15.1.1/build/vendor/react-native-vector-icons/Fonts/Entypo.ttf') format('truetype');
              font-display: swap;
            }
            @font-face {
              font-family: 'Octicons';
              src: url('/fonts/Octicons.ttf') format('truetype'),
                   url('https://cdn.jsdelivr.net/npm/@expo/vector-icons@15.1.1/build/vendor/react-native-vector-icons/Fonts/Octicons.ttf') format('truetype');
              font-display: swap;
            }
          `;
        }

        setLoaded(true);
      } catch (err: any) {
        console.warn("[IconFonts] Font load fallback warning:", err);
        setError(err);
        setLoaded(true);
      }
    }

    loadFonts();
  }, []);

  return [loaded, error];
}
