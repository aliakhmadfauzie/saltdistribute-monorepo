import {
  calculateDistanceKm,
  estimateTransitMinutes,
  analyzeProximity,
  LiveBuyerLocation,
} from '../services/locationService';

describe('Proximity & GPS Telemetry Calculations', () => {
  // Test coordinates (Medan City Center & Industrial Hub)
  const sellerHub = { latitude: 3.5952, longitude: 98.6722 }; // Medan Hub
  const nearPoint = { latitude: 3.5955, longitude: 98.6724 }; // ~40m away
  const approachingPoint = { latitude: 3.599, longitude: 98.675 }; // ~500m away
  const farPoint = { latitude: 3.65, longitude: 98.72 }; // ~8km away

  test('calculateDistanceKm returns 0 for identical coordinates', () => {
    const dist = calculateDistanceKm(3.5952, 98.6722, 3.5952, 98.6722);
    expect(dist).toBe(0);
  });

  test('calculateDistanceKm calculates distance accurately between two points', () => {
    const dist = calculateDistanceKm(sellerHub.latitude, sellerHub.longitude, farPoint.latitude, farPoint.longitude);
    expect(dist).toBeGreaterThan(7.0);
    expect(dist).toBeLessThan(10.0);
  });

  test('estimateTransitMinutes calculates realistic urban travel times', () => {
    expect(estimateTransitMinutes(0)).toBe(0);
    expect(estimateTransitMinutes(5)).toBeGreaterThanOrEqual(9);
    expect(estimateTransitMinutes(16)).toBe(30); // 16 km at 32 km/h = 30 mins
  });

  test('analyzeProximity returns OFFLINE when location sharing is disabled', () => {
    const offlineLoc: LiveBuyerLocation = {
      latitude: sellerHub.latitude,
      longitude: sellerHub.longitude,
      accuracyMeters: 10,
      updatedAt: new Date().toISOString(),
      isSharing: false,
    };

    const analysis = analyzeProximity(offlineLoc, undefined, sellerHub);
    expect(analysis.state).toBe('OFFLINE');
    expect(analysis.isNearby).toBe(false);
  });

  test('analyzeProximity returns AT_MEETING_POINT when distance <= 150m', () => {
    const atPointLoc: LiveBuyerLocation = {
      latitude: nearPoint.latitude,
      longitude: nearPoint.longitude,
      accuracyMeters: 5,
      updatedAt: new Date().toISOString(),
      isSharing: true,
    };

    const analysis = analyzeProximity(atPointLoc, undefined, sellerHub);
    expect(analysis.state).toBe('AT_MEETING_POINT');
    expect(analysis.isNearby).toBe(true);
  });

  test('analyzeProximity returns APPROACHING when distance <= 800m', () => {
    const approachLoc: LiveBuyerLocation = {
      latitude: approachingPoint.latitude,
      longitude: approachingPoint.longitude,
      accuracyMeters: 10,
      updatedAt: new Date().toISOString(),
      isSharing: true,
    };

    const analysis = analyzeProximity(approachLoc, undefined, sellerHub);
    expect(analysis.state).toBe('APPROACHING');
  });

  test('analyzeProximity returns IN_TRANSIT when distance > 800m', () => {
    const transitLoc: LiveBuyerLocation = {
      latitude: farPoint.latitude,
      longitude: farPoint.longitude,
      accuracyMeters: 15,
      updatedAt: new Date().toISOString(),
      isSharing: true,
    };

    const analysis = analyzeProximity(transitLoc, undefined, sellerHub);
    expect(analysis.state).toBe('IN_TRANSIT');
    expect(analysis.isNearby).toBe(false);
  });
});
