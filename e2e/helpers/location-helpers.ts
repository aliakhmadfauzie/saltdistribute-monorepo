import { BrowserContext, Page } from '@playwright/test';

export interface MockCoordinates {
  latitude: number;
  longitude: number;
  accuracy?: number;
}

// Representative locations around Medan & Belawan Industrial Corridor
export const MEDAN_COORDINATES: MockCoordinates = {
  latitude: 3.5952,
  longitude: 98.6722,
  accuracy: 10,
};

export const BELAWAN_HUB_COORDINATES: MockCoordinates = {
  latitude: 3.7844,
  longitude: 98.6833,
  accuracy: 5,
};

export const KIM_INDUSTRIAL_COORDINATES: MockCoordinates = {
  latitude: 3.7042,
  longitude: 98.6912,
  accuracy: 8,
};

/**
 * Configure browser context with realistic GPS coordinates and granted geolocation permission
 */
export async function setupMockGeolocation(
  context: BrowserContext,
  coords: MockCoordinates = MEDAN_COORDINATES
): Promise<void> {
  await context.grantPermissions(['geolocation']);
  await context.setGeolocation({
    latitude: coords.latitude,
    longitude: coords.longitude,
    accuracy: coords.accuracy || 10,
  });
}

/**
 * Revoke geolocation permission to test fallback behavior
 */
export async function setupDeniedGeolocation(context: BrowserContext): Promise<void> {
  await context.clearPermissions();
}
