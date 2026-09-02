/**
 * SaltDistribute - Unified Leaflet & CARTO Basemaps Map Template Engine
 * High-performance vector tile rendering powered by CARTO Voyager and Esri World Imagery.
 */

export const CARTO_API_KEY =
  process.env.EXPO_PUBLIC_CARTO_API_KEY ||
  "eyJhbGciOiJIUzI1NiJ9.eyJhIjoiYWNfOHI3d2czMmMiLCJqdGkiOiIzYzNkNWQ1OSJ9.WkGuupGDXNSj1OiU8BuZdnH1JtXGpRiSFrFuVhJC3zI";

export function getCartoTileUrl(mapType: "roadmap" | "satellite" = "roadmap", apiKey: string = CARTO_API_KEY): string {
  if (mapType === "satellite") {
    return "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}";
  }
  const keyParam = apiKey ? `?api_key=${apiKey}` : "";
  return `https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png${keyParam}`;
}

export interface LeafletMapOptions {
  mapType?: "roadmap" | "satellite";
  zoom?: number;
}

export interface RouteMapConfig {
  originLat: number;
  originLng: number;
  originLabel?: string;
  destLat: number;
  destLng: number;
  destName: string;
  destAddress?: string;
  distanceKm: number;
  estimatedMinutes: number;
  isCOD?: boolean;
  mapType?: "roadmap" | "satellite";
}

export interface LocationPickerMapConfig {
  originLat: number;
  originLng: number;
  originLabel?: string;
  currentLat: number;
  currentLng: number;
  distanceKm: number;
  mapType?: "roadmap" | "satellite";
}

export interface CustomerLocationMapConfig {
  sellerLat: number;
  sellerLng: number;
  sellerLabel?: string;
  customerLat: number;
  customerLng: number;
  customerName: string;
  companyName?: string;
  customerAddress: string;
  distanceKm: number;
  estimatedMinutes: number;
  mapType?: "roadmap" | "satellite";
}

export interface LiveRadarMapConfig {
  sellerLat: number;
  sellerLng: number;
  sellerLabel?: string;
  targetLat: number;
  targetLng: number;
  buyerName: string;
  statusLabel: string;
  accuracyMeters?: number;
  distanceKm: number;
  estimatedMinutes: number;
  isSharing?: boolean;
  mapType?: "roadmap" | "satellite";
}

const COMMON_CSS = `
  * { margin: 0; padding: 0; box-sizing: border-box; }
  html, body, #map {
    width: 100%;
    height: 100%;
    margin: 0;
    padding: 0;
    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
    background: #e5e7eb;
  }
  .custom-hud {
    position: absolute;
    top: 10px;
    left: 10px;
    right: 10px;
    background: rgba(255, 255, 255, 0.95);
    padding: 6px 12px;
    border-radius: 8px;
    box-shadow: 0 2px 10px rgba(0,0,0,0.18);
    font-size: 12px;
    font-weight: 700;
    color: #006C4C;
    z-index: 1000;
    border: 1px solid rgba(0, 108, 76, 0.2);
    pointer-events: none;
    display: flex;
    align-items: center;
    justify-content: space-between;
  }
  .custom-hud-dark {
    position: absolute;
    top: 10px;
    left: 10px;
    right: 10px;
    background: rgba(0, 30, 20, 0.92);
    color: #ffffff;
    padding: 8px 12px;
    border-radius: 8px;
    font-size: 11px;
    font-weight: 700;
    z-index: 1000;
    display: flex;
    align-items: center;
    justify-content: space-between;
    box-shadow: 0 4px 12px rgba(0,0,0,0.3);
    border: 1px solid rgba(0, 108, 76, 0.4);
    pointer-events: none;
  }
  .custom-pin {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 32px;
    height: 32px;
    border-radius: 50%;
    color: white;
    font-size: 15px;
    box-shadow: 0 3px 8px rgba(0,0,0,0.35);
    border: 2px solid white;
    cursor: default;
  }
  .pin-origin { background: #006C4C; }
  .pin-dest { background: #BA1A1A; }
  .pin-cod { background: #D97706; }
  .pin-customer { background: #0284C7; }
  .pin-picker { background: #BA1A1A; cursor: grab; }
  .badge-tag {
    display: inline-block;
    padding: 2px 6px;
    border-radius: 4px;
    color: #ffffff;
    font-size: 10px;
    font-weight: bold;
    margin-bottom: 4px;
  }
  .pulse-ring {
    display: inline-block;
    width: 10px;
    height: 10px;
    border-radius: 50%;
    background: #00E676;
    box-shadow: 0 0 0 rgba(0, 230, 118, 0.6);
    animation: pulse 1.5s infinite;
  }
  @keyframes pulse {
    0% { transform: scale(0.95); box-shadow: 0 0 0 0 rgba(0, 230, 118, 0.7); }
    70% { transform: scale(1.1); box-shadow: 0 0 0 10px rgba(0, 230, 118, 0); }
    100% { transform: scale(0.95); box-shadow: 0 0 0 0 rgba(0, 230, 118, 0); }
  }
  .leaflet-popup-content {
    margin: 8px 12px;
    font-size: 12px;
    line-height: 1.4;
  }
  .map-action-bar {
    position: absolute;
    bottom: 12px;
    right: 12px;
    z-index: 1000;
    display: flex;
    flex-direction: column;
    gap: 6px;
  }
  .map-ctrl-btn {
    background: #ffffff;
    border: 1px solid rgba(0, 108, 76, 0.3);
    border-radius: 8px;
    padding: 6px 10px;
    font-size: 11px;
    font-weight: 700;
    color: #006C4C;
    cursor: pointer;
    box-shadow: 0 2px 8px rgba(0,0,0,0.18);
    display: flex;
    align-items: center;
    gap: 4px;
    user-select: none;
  }
  .map-ctrl-btn:active {
    background: #E8F5E9;
    transform: scale(0.96);
  }
`;

/**
 * Generate interactive delivery route map HTML
 */
export function generateRouteMapHtml(cfg: RouteMapConfig): string {
  const isCOD = Boolean(cfg.isCOD);
  const mapType = cfg.mapType || "roadmap";
  const tileUrl = getCartoTileUrl(mapType);

  return `<!DOCTYPE html>
<html>
  <head>
    <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
    <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
    <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
    <style>
      ${COMMON_CSS}
    </style>
  </head>
  <body>
    <div class="custom-hud">
      <span>📍 ${isCOD ? "COD Meetup" : "Dispatch"}: ${cfg.distanceKm} km (~${cfg.estimatedMinutes} mins)</span>
      <span style="background:#006C4C; color:#fff; padding:2px 6px; border-radius:4px; font-size:10px;">CARTO Voyager</span>
    </div>
    <div id="map"></div>
    <div class="map-action-bar">
      <button class="map-ctrl-btn" onclick="focusDest()">📍 ${isCOD ? "COD Point" : "Tujuan"}</button>
      <button class="map-ctrl-btn" onclick="focusOrigin()">🏭 Hub</button>
      <button class="map-ctrl-btn" onclick="fitAll()">🧭 Fit All</button>
    </div>
    <script>
      const originLat = ${cfg.originLat};
      const originLng = ${cfg.originLng};
      const destLat = ${cfg.destLat};
      const destLng = ${cfg.destLng};
      const mapType = "${mapType}";

      const map = L.map('map', {
        zoomControl: true,
        attributionControl: false,
        dragging: true,
        touchZoom: true,
        doubleClickZoom: true,
        scrollWheelZoom: true
      });

      const tileUrl = "${tileUrl}";

      L.tileLayer(tileUrl, { maxZoom: 19, subdomains: 'abcd' }).addTo(map);

      const originIcon = L.divIcon({
        className: '',
        html: '<div class="custom-pin pin-origin">🏭</div>',
        iconSize: [32, 32],
        iconAnchor: [16, 16]
      });

      const destIcon = L.divIcon({
        className: '',
        html: '<div class="custom-pin ${isCOD ? "pin-cod" : "pin-dest"}">${isCOD ? "🤝" : "📍"}</div>',
        iconSize: [32, 32],
        iconAnchor: [16, 16]
      });

      const originMarker = L.marker([originLat, originLng], { icon: originIcon }).addTo(map);
      originMarker.bindPopup('<span class="badge-tag" style="background:#006C4C">TITIK ASAL PENJUAL</span><br/><b>${cfg.originLabel || "Lokasi Penjual (Live GPS)"}</b><br/>Titik Berangkat Dispatch');

      const destMarker = L.marker([destLat, destLng], { icon: destIcon }).addTo(map);
      destMarker.bindPopup('<span class="badge-tag" style="background:${isCOD ? "#D97706" : "#BA1A1A"}">${isCOD ? "COD MEETING POINT" : "DELIVERY DESTINATION"}</span><br/><b>${cfg.destName}</b><br/>${cfg.distanceKm} km (~${cfg.estimatedMinutes} mins)');

      const latlngs = [[originLat, originLng], [destLat, destLng]];
      const polyline = L.polyline(latlngs, {
        color: "${isCOD ? "#D97706" : "#006C4C"}",
        weight: 4,
        opacity: 0.85,
        dashArray: "6, 8"
      }).addTo(map);

      const bounds = L.latLngBounds(latlngs);
      map.fitBounds(bounds, { padding: [35, 35] });

      function focusDest() {
        map.flyTo([destLat, destLng], 16, { animate: true });
        destMarker.openPopup();
      }

      function focusOrigin() {
        map.flyTo([originLat, originLng], 16, { animate: true });
        originMarker.openPopup();
      }

      function fitAll() {
        map.fitBounds(bounds, { padding: [35, 35], animate: true });
      }
    </script>
  </body>
</html>`;
}

/**
 * Generate interactive location picker map HTML
 */
export function generateLocationPickerMapHtml(cfg: LocationPickerMapConfig): string {
  const mapType = cfg.mapType || "roadmap";
  const tileUrl = getCartoTileUrl(mapType);

  return `<!DOCTYPE html>
<html>
  <head>
    <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
    <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
    <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
    <style>
      ${COMMON_CSS}
      .instructions {
        font-size: 11px;
        color: #4B5563;
        font-weight: normal;
      }
    </style>
  </head>
  <body>
    <div class="custom-hud">
      <div>
        <span>📍 Titik Pengiriman Terpilih</span>
        <div class="instructions">Ketuk peta / seret pin untuk memindahkan lokasi</div>
      </div>
      <span style="background:#006C4C; color:#fff; padding:3px 8px; border-radius:4px; font-size:11px;">
        ${cfg.distanceKm} km dari Penjual
      </span>
    </div>
    <div id="map"></div>
    <script>
      const originLat = ${cfg.originLat};
      const originLng = ${cfg.originLng};
      let curLat = ${cfg.currentLat};
      let curLng = ${cfg.currentLng};
      const mapType = "${mapType}";

      const map = L.map('map', {
        zoomControl: true,
        attributionControl: false
      }).setView([curLat, curLng], 13);

      const tileUrl = "${tileUrl}";

      L.tileLayer(tileUrl, { maxZoom: 19, subdomains: 'abcd' }).addTo(map);

      const originIcon = L.divIcon({
        className: '',
        html: '<div class="custom-pin pin-origin">🏭</div>',
        iconSize: [32, 32],
        iconAnchor: [16, 16]
      });

      const destIcon = L.divIcon({
        className: '',
        html: '<div class="custom-pin pin-picker">📍</div>',
        iconSize: [32, 32],
        iconAnchor: [16, 16]
      });

      const originMarker = L.marker([originLat, originLng], { icon: originIcon }).addTo(map);
      originMarker.bindPopup('<span class="badge-tag" style="background:#006C4C">TITIK PENJUAL</span><br/><b>${cfg.originLabel || "Lokasi Penjual (Live GPS)"}</b>');

      const destMarker = L.marker([curLat, curLng], { icon: destIcon, draggable: true }).addTo(map);

      const polyline = L.polyline([[originLat, originLng], [curLat, curLng]], {
        color: "#006C4C",
        weight: 3,
        opacity: 0.8,
        dashArray: "5, 8"
      }).addTo(map);

      function updatePosition(newLat, newLng) {
        curLat = Number(newLat.toFixed(5));
        curLng = Number(newLng.toFixed(5));
        destMarker.setLatLng([curLat, curLng]);
        polyline.setLatLngs([[originLat, originLng], [curLat, curLng]]);

        const payload = JSON.stringify({
          type: 'POSITION_CHANGED',
          lat: curLat,
          lng: curLng
        });

        try {
          if (window.ReactNativeWebView) {
            window.ReactNativeWebView.postMessage(payload);
          }
          if (window.parent) {
            window.parent.postMessage(payload, '*');
          }
        } catch(err) {}
      }

      destMarker.on('dragend', function(e) {
        const coord = e.target.getLatLng();
        updatePosition(coord.lat, coord.lng);
      });

      map.on('click', function(e) {
        updatePosition(e.latlng.lat, e.latlng.lng);
      });
    </script>
  </body>
</html>`;
}

/**
 * Generate customer location preview map HTML
 */
export function generateCustomerLocationMapHtml(cfg: CustomerLocationMapConfig): string {
  const mapType = cfg.mapType || "roadmap";
  const tileUrl = getCartoTileUrl(mapType);

  return `<!DOCTYPE html>
<html>
  <head>
    <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
    <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
    <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
    <style>
      ${COMMON_CSS}
    </style>
  </head>
  <body>
    <div class="custom-hud-dark">
      <div>🚚 ${cfg.distanceKm} km (~${cfg.estimatedMinutes} mins transit dari Hub)</div>
      <span style="background:#0284C7; color:#fff; padding:2px 6px; border-radius:4px; font-size:10px;">CARTO Voyager</span>
    </div>
    <div id="map"></div>
    <script>
      const originLat = ${cfg.sellerLat};
      const originLng = ${cfg.sellerLng};
      const destLat = ${cfg.customerLat};
      const destLng = ${cfg.customerLng};
      const mapType = "${mapType}";

      const map = L.map('map', {
        zoomControl: true,
        attributionControl: false
      });

      const tileUrl = "${tileUrl}";

      L.tileLayer(tileUrl, { maxZoom: 19, subdomains: 'abcd' }).addTo(map);

      const originIcon = L.divIcon({
        className: '',
        html: '<div class="custom-pin pin-origin">🏭</div>',
        iconSize: [32, 32],
        iconAnchor: [16, 16]
      });

      const destIcon = L.divIcon({
        className: '',
        html: '<div class="custom-pin pin-customer">🏢</div>',
        iconSize: [32, 32],
        iconAnchor: [16, 16]
      });

      const originMarker = L.marker([originLat, originLng], { icon: originIcon }).addTo(map);
      originMarker.bindPopup('<span class="badge-tag" style="background:#006C4C">SELLER DEVICE</span><br/><b>${cfg.sellerLabel || "Lokasi Penjual (Device GPS)"}</b><br/>Titik Berangkat Penjual');

      const destMarker = L.marker([destLat, destLng], { icon: destIcon }).addTo(map);
      destMarker.bindPopup('<span class="badge-tag" style="background:#0284C7">CUSTOMER LOCATION</span><br/><b>${cfg.customerName}</b><br/>${cfg.companyName || "Wholesale Buyer"}<br/><small>${cfg.customerAddress}</small>').openPopup();

      const latlngs = [[originLat, originLng], [destLat, destLng]];
      const polyline = L.polyline(latlngs, {
        color: "#0284C7",
        weight: 4,
        opacity: 0.85,
        dashArray: "6, 8"
      }).addTo(map);

      const bounds = L.latLngBounds(latlngs);
      map.fitBounds(bounds, { padding: [35, 35] });
    </script>
  </body>
</html>`;
}

/**
 * Generate real-time live GNSS radar map HTML
 */
export function generateLiveRadarMapHtml(cfg: LiveRadarMapConfig): string {
  const mapType = cfg.mapType || "roadmap";
  const accuracy = cfg.accuracyMeters || 15;
  const isSharing = Boolean(cfg.isSharing);
  const tileUrl = getCartoTileUrl(mapType);

  return `<!DOCTYPE html>
<html>
  <head>
    <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
    <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
    <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
    <style>
      ${COMMON_CSS}
    </style>
  </head>
  <body>
    <div class="custom-hud-dark">
      <div>
        <span class="pulse-ring"></span>
        &nbsp; LIVE BUYER RADAR: ${cfg.buyerName}
      </div>
      <div>${cfg.distanceKm} km (~${cfg.estimatedMinutes}m)</div>
    </div>
    <div id="map"></div>
    <div class="map-action-bar">
      <button class="map-ctrl-btn" onclick="focusBuyer()">🎯 Buyer</button>
      <button class="map-ctrl-btn" onclick="focusSeller()">🏭 Seller</button>
      <button class="map-ctrl-btn" onclick="fitAll()">🧭 Fit All</button>
    </div>
    <script>
      const hubLat = ${cfg.sellerLat};
      const hubLng = ${cfg.sellerLng};
      const targetLat = ${cfg.targetLat};
      const targetLng = ${cfg.targetLng};
      const mapType = "${mapType}";

      const map = L.map('map', {
        zoomControl: true,
        attributionControl: false,
        dragging: true,
        touchZoom: true,
        doubleClickZoom: true,
        scrollWheelZoom: true
      });

      const tileUrl = "${tileUrl}";

      L.tileLayer(tileUrl, { maxZoom: 19, subdomains: 'abcd' }).addTo(map);

      const hubIcon = L.divIcon({
        className: '',
        html: '<div class="custom-pin pin-origin">🏭</div>',
        iconSize: [32, 32],
        iconAnchor: [16, 16]
      });

      const buyerIcon = L.divIcon({
        className: '',
        html: '<div class="custom-pin ${isSharing ? "pin-customer" : "pin-dest"}">${isSharing ? "📡" : "📍"}</div>',
        iconSize: [32, 32],
        iconAnchor: [16, 16]
      });

      const hubMarker = L.marker([hubLat, hubLng], { icon: hubIcon }).addTo(map);
      hubMarker.bindPopup('<span class="badge-tag" style="background:#006C4C">SELLER DEVICE</span><br/><b>${cfg.sellerLabel || "Lokasi Penjual (Live GPS)"}</b><br/>Titik Berangkat Penjual');

      const buyerMarker = L.marker([targetLat, targetLng], { icon: buyerIcon }).addTo(map);
      buyerMarker.bindPopup('<span class="badge-tag" style="background:#0284C7">LIVE BUYER GPS</span><br/><b>${cfg.buyerName}</b><br/>Status: ${cfg.statusLabel}');

      // Accuracy radius circle
      L.circle([targetLat, targetLng], {
        color: '#0284C7',
        fillColor: '#0284C7',
        fillOpacity: 0.15,
        radius: ${accuracy}
      }).addTo(map);

      const latlngs = [[hubLat, hubLng], [targetLat, targetLng]];
      const polyline = L.polyline(latlngs, {
        color: "${isSharing ? "#0284C7" : "#006C4C"}",
        weight: 4,
        opacity: 0.85,
        dashArray: "6, 8"
      }).addTo(map);

      const bounds = L.latLngBounds(latlngs);
      map.fitBounds(bounds, { padding: [35, 35] });

      function focusBuyer() {
        map.flyTo([targetLat, targetLng], 16, { animate: true });
        buyerMarker.openPopup();
      }

      function focusSeller() {
        map.flyTo([hubLat, hubLng], 16, { animate: true });
        hubMarker.openPopup();
      }

      function fitAll() {
        map.fitBounds(bounds, { padding: [35, 35], animate: true });
      }
    </script>
  </body>
</html>`;
}
