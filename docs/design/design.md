// Design tokens (Material 3 Emerald & Ceramic Slate) — from /app/design_guidelines.json
export const colors = {
  surface: "#FAFAF9",
  onSurface: "#1C1917",
  surfaceSecondary: "#F5F5F4",
  onSurfaceSecondary: "#44403C",
  surfaceTertiary: "#E7E5E4",
  onSurfaceTertiary: "#292524",
  surfaceInverse: "#1C1917",
  onSurfaceInverse: "#FAFAF9",
  brand: "#059669",
  brandPrimary: "#059669",
  onBrandPrimary: "#FFFFFF",
  brandSecondary: "#10B981",
  onBrandSecondary: "#022C22",
  brandTertiary: "#D1FAE5",
  onBrandTertiary: "#064E3B",
  success: "#16A34A",
  onSuccess: "#FFFFFF",
  warning: "#D97706",
  onWarning: "#FFFFFF",
  error: "#DC2626",
  onError: "#FFFFFF",
  info: "#0F766E",
  onInfo: "#FFFFFF",
  border: "#D6D3D1",
  borderStrong: "#78716C",
  divider: "#E7E5E4",
  muted: "#78716C",
} as const;

export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  xxl: 32,
  xxxl: 48,
};

export const radius = {
  sm: 6,
  md: 12,
  lg: 20,
  pill: 999,
};

export const type = {
  sm: 12,
  base: 14,
  lg: 16,
  xl: 20,
  xxl: 24,
  xxxl: 32,
};
