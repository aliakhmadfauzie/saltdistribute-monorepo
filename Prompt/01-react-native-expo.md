# 📱 React Native & Expo Plugin Prompts (`react-native-expo-plugin`)

This guide contains prompts specifically targeted at the **`react-native-expo-plugin`** and its child skills: `expo-router-mastery`, `android-expo-build-pipeline`, `firestore-realtime-engine`, and `mobile-touch-haptics-gestures`.

---

## 1. Expo Router Mastery (`expo-router-mastery`)

### Common / General Prompts
```text
Please use the 'expo-router-mastery' skill to audit our app/ routing structure and verify edge-to-edge safe area insets on Android & iOS.
```
```text
Use the 'expo-router-mastery' skill to create a modal route stack with transparent blur backdrop and smooth presentation.
```

### Specific Feature Prompts
* **Deep Linking & Role Routing:**
  ```text
  Use 'expo-router-mastery' to configure deep linking for order tracking notifications (e.g. /buyer/orders/:id and /admin/orders/:id) with role-based redirection guards.
  ```
* **Dynamic Insets Audit:**
  ```text
  Check all screens under app/(admin)/ and app/(buyer)/ using 'expo-router-mastery' to ensure zero hardcoded paddings and full adoption of useSafeAreaInsets().
  ```

---

## 2. Android Build & Packaging Pipeline (`android-expo-build-pipeline`)

### Common / General Prompts
```text
Please use the 'android-expo-build-pipeline' skill to optimize our eas.json build profiles and validate Android release configurations.
```

### Specific Feature Prompts
* **APK / AAB Build Optimization:**
  ```text
  Using 'android-expo-build-pipeline', configure a preview APK build profile and a production AAB bundle profile with ProGuard/R8 minification and resource shrinking in eas.json.
  ```
* **Adaptive Icons & Splash Screen:**
  ```text
  Use 'android-expo-build-pipeline' to verify Android 13+ monochrome and adaptive icon specifications, notification icon transparency, and splash screen boot animations.
  ```

---

## 3. Firestore Realtime Engine & Memory Safety (`firestore-realtime-engine`)

### Common / General Prompts
```text
Use the 'firestore-realtime-engine' skill to audit all snapshot listeners in src/context/ and src/services/ to guarantee zero-polling and mandatory unsubscribe() cleanups.
```

### Specific Feature Prompts
* **Realtime Orders & Stock Sync:**
  ```text
  Use 'firestore-realtime-engine' to build a real-time reactive order status tracker in src/services/firestoreService.ts that automatically syncs status updates across Admin and Buyer without UI lag.
  ```
* **Offline Caching & State Reconciliation:**
  ```text
  Implement offline persistence fallback for active orders using 'firestore-realtime-engine' and AsyncStorage when the device loses network connectivity.
  ```

---

## 4. Mobile UX, Touch Targets & Haptics (`mobile-touch-haptics-gestures`)

### Common / General Prompts
```text
Please activate 'mobile-touch-haptics-gestures' to audit all clickable elements, ensuring minimum 48dp touch targets and subtle haptic feedback.
```

### Specific Feature Prompts
* **Haptic Feedback on Critical Actions:**
  ```text
  Use 'mobile-touch-haptics-gestures' to add expo-haptics triggers (ImpactFeedbackStyle.Medium on button presses, NotificationFeedbackType.Success on successful order checkout, NotificationFeedbackType.Error on validation failure).
  ```
* **Swipe-to-Action Gestures:**
  ```text
  Implement a swipe-to-confirm or swipe-to-delete gesture using 'mobile-touch-haptics-gestures' and react-native-gesture-handler on order list items.
  ```
