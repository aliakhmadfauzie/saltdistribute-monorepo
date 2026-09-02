import { ScrollViewStyleReset } from "expo-router/html";
import { type PropsWithChildren } from "react";

/**
 * Custom root HTML wrapper for Expo Router Web
 * Fully locked viewport and zoom-prevention engine for native-like PWA experience
 */
export default function Root({ children }: PropsWithChildren) {
  return (
    <html lang="id">
      <head>
        <meta charSet="utf-8" />
        <meta httpEquiv="X-UA-Compatible" content="IE=edge" />
        
        {/* Strict Locked Viewport: Prevents user zooming & scaling */}
        <meta
          name="viewport"
          content="width=device-width, initial-scale=1.0, minimum-scale=1.0, maximum-scale=1.0, user-scalable=no, shrink-to-fit=no, viewport-fit=cover"
        />
        
        <title>SaltDistribute - Platform Distribusi Garam Industri & Grosir</title>
        
        {/* Favicons & Multi-Resolution Icons */}
        <link rel="icon" type="image/x-icon" href="/favicon.ico" />
        <link rel="icon" type="image/png" sizes="16x16" href="/favicon-16x16.png" />
        <link rel="icon" type="image/png" sizes="32x32" href="/favicon-32x32.png" />
        <link rel="icon" type="image/png" sizes="48x48" href="/favicon-48x48.png" />
        <link rel="icon" type="image/png" sizes="64x64" href="/favicon-64x64.png" />
        <link rel="apple-touch-icon" sizes="180x180" href="/apple-touch-icon.png" />

        {/* PWA Manifest & App Config */}
        <link rel="manifest" href="/manifest.json" />
        <meta name="theme-color" content="#006C4C" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="apple-mobile-web-app-title" content="SaltDistribute" />
        
        {/* Automatic Service Worker Registration & Zoom Lock Script */}
        <script
          dangerouslySetInnerHTML={{
            __html: `
              // Register PWA Service Worker
              if ('serviceWorker' in navigator) {
                window.addEventListener('load', () => {
                  navigator.serviceWorker.register('/service-worker.js')
                    .then(reg => console.log('[PWA] Service Worker active:', reg.scope))
                    .catch(err => console.warn('[PWA] Service Worker error:', err));
                });
              }

              // 1. Prevent iOS Safari Pinch-to-Zoom Gestures
              document.addEventListener('gesturestart', function (e) {
                e.preventDefault();
              }, { passive: false });

              document.addEventListener('gesturechange', function (e) {
                e.preventDefault();
              }, { passive: false });

              document.addEventListener('gestureend', function (e) {
                e.preventDefault();
              }, { passive: false });

              // 2. Prevent Double-Tap to Zoom on mobile browsers
              var lastTouchEnd = 0;
              document.addEventListener('touchend', function (e) {
                var now = Date.now();
                if (now - lastTouchEnd <= 300) {
                  var target = e.target;
                  if (!target || (target.tagName !== 'INPUT' && target.tagName !== 'TEXTAREA')) {
                    e.preventDefault();
                  }
                }
                lastTouchEnd = now;
              }, { passive: false });

              // 3. Prevent Multi-finger Pinch Zooming on Touchscreens
              document.addEventListener('touchstart', function (e) {
                if (e.touches && e.touches.length > 1) {
                  // Allow multitouch inside map iframes, block on root UI
                  if (!e.target.closest || !e.target.closest('iframe')) {
                    e.preventDefault();
                  }
                }
              }, { passive: false });

              document.addEventListener('touchmove', function (e) {
                if (e.touches && e.touches.length > 1) {
                  if (!e.target.closest || !e.target.closest('iframe')) {
                    e.preventDefault();
                  }
                }
              }, { passive: false });

              // 4. Prevent Desktop Browser Ctrl + Mouse Wheel Zoom
              window.addEventListener('wheel', function (e) {
                if (e.ctrlKey || e.metaKey) {
                  e.preventDefault();
                }
              }, { passive: false, capture: true });

              // 5. Prevent Desktop Keyboard Zoom Shortcuts (Ctrl +, Ctrl -, Ctrl 0, Cmd +, Cmd -, Cmd 0)
              window.addEventListener('keydown', function (e) {
                if ((e.ctrlKey || e.metaKey) && (e.key === '+' || e.key === '-' || e.key === '=' || e.key === '_' || e.key === '0' || e.code === 'NumpadAdd' || e.code === 'NumpadSubtract')) {
                  e.preventDefault();
                }
              }, { passive: false, capture: true });

              // 6. Reset visualViewport scale lock
              if (window.visualViewport) {
                window.visualViewport.addEventListener('resize', function () {
                  if (window.visualViewport.scale !== 1) {
                    var meta = document.querySelector('meta[name="viewport"]');
                    if (meta) {
                      meta.setAttribute('content', 'width=device-width, initial-scale=1.0, minimum-scale=1.0, maximum-scale=1.0, user-scalable=no, shrink-to-fit=no, viewport-fit=cover');
                    }
                  }
                });
              }
            `,
          }}
        />

        <ScrollViewStyleReset />
        <link
          rel="stylesheet"
          href="https://cdn.jsdelivr.net/npm/@mdi/font@7.4.47/css/materialdesignicons.min.css"
        />
        <link
          rel="stylesheet"
          href="https://unpkg.com/ionicons@7.1.0/dist/css/ionicons.min.css"
        />
        <link
          rel="stylesheet"
          href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.1/css/all.min.css"
        />
        <style
          dangerouslySetInnerHTML={{
            __html: `
              html, body, #root {
                height: 100%;
                width: 100%;
                margin: 0;
                padding: 0;
                background-color: #F8FAF9;
                font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
                
                /* Lock touch action: allows vertical/horizontal scrolling but blocks browser pinch zoom */
                touch-action: pan-x pan-y;
                -webkit-text-size-adjust: 100%;
                text-size-adjust: 100%;
                overscroll-behavior-y: contain;
                -webkit-font-smoothing: antialiased;
                -moz-osx-font-smoothing: grayscale;
              }

              /* Prevent iOS Safari automatic zoom-in when focusing text inputs (<16px trigger) */
              input, select, textarea {
                font-size: 16px !important;
                touch-action: manipulation;
              }

              /* Smooth tap highlight removal */
              * {
                -webkit-tap-highlight-color: transparent;
              }

              @font-face {
                font-family: 'ionicons';
                src: url('/fonts/Ionicons.ttf') format('truetype'),
                     url('https://cdn.jsdelivr.net/npm/@expo/vector-icons@15.1.1/build/vendor/react-native-vector-icons/Fonts/Ionicons.ttf') format('truetype'),
                     url('https://unpkg.com/@expo/vector-icons@15.1.1/build/vendor/react-native-vector-icons/Fonts/Ionicons.ttf') format('truetype');
                font-display: swap;
              }
              @font-face {
                font-family: 'Ionicons';
                src: url('/fonts/Ionicons.ttf') format('truetype'),
                     url('https://cdn.jsdelivr.net/npm/@expo/vector-icons@15.1.1/build/vendor/react-native-vector-icons/Fonts/Ionicons.ttf') format('truetype'),
                     url('https://unpkg.com/@expo/vector-icons@15.1.1/build/vendor/react-native-vector-icons/Fonts/Ionicons.ttf') format('truetype');
                font-display: swap;
              }
              @font-face {
                font-family: 'material-community';
                src: url('/fonts/MaterialCommunityIcons.ttf') format('truetype'),
                     url('https://cdn.jsdelivr.net/npm/@expo/vector-icons@15.1.1/build/vendor/react-native-vector-icons/Fonts/MaterialCommunityIcons.ttf') format('truetype'),
                     url('https://unpkg.com/@expo/vector-icons@15.1.1/build/vendor/react-native-vector-icons/Fonts/MaterialCommunityIcons.ttf') format('truetype');
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
                     url('https://cdn.jsdelivr.net/npm/@expo/vector-icons@15.1.1/build/vendor/react-native-vector-icons/Fonts/MaterialIcons.ttf') format('truetype'),
                     url('https://unpkg.com/@expo/vector-icons@15.1.1/build/vendor/react-native-vector-icons/Fonts/MaterialIcons.ttf') format('truetype');
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
            `,
          }}
        />
      </head>
      <body>{children}</body>
    </html>
  );
}
