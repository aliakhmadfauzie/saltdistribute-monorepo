// Design tokens (Material 3 Emerald & Ceramic Slate per Android Mobile Design Guide)
export const colors = {
  surface: "#F8FAF8",
  onSurface: "#191C1A",
  surfaceSecondary: "#EDF2EE",
  onSurfaceSecondary: "#3F4943",
  surfaceTertiary: "#DEE5DF",
  onSurfaceTertiary: "#1B2820",
  surfaceInverse: "#2D312E",
  onSurfaceInverse: "#EFF1ED",

  // Material 3 Surface Containers
  surfaceContainerLowest: "#FFFFFF",
  surfaceContainerLow: "#F2F5F2",
  surfaceContainer: "#EDF2EE",
  surfaceContainerHigh: "#E7EDE8",
  surfaceContainerHighest: "#E1E8E2",
  
  // Brand Emerald Primary & Containers
  brand: "#006C4C",
  brandPrimary: "#006C4C",
  onBrandPrimary: "#FFFFFF",
  brandPrimaryContainer: "#89F8C7",
  onBrandPrimaryContainer: "#002114",
  
  brandSecondary: "#4D6357",
  onBrandSecondary: "#FFFFFF",
  brandSecondaryContainer: "#CFE9D8",
  onBrandSecondaryContainer: "#0A1F16",
  
  brandTertiary: "#D1FAE5",
  onBrandTertiary: "#064E3B",
  
  // Semantic Status Tiers
  success: "#15803D",
  onSuccess: "#FFFFFF",
  successContainer: "#DCFCE7",
  onSuccessContainer: "#14532D",
  
  warning: "#B45309",
  onWarning: "#FFFFFF",
  warningContainer: "#FEF3C7",
  onWarningContainer: "#78350F",
  
  error: "#BA1A1A",
  onError: "#FFFFFF",
  errorContainer: "#FFDAD6",
  onErrorContainer: "#410002",
  
  info: "#0E7490",
  onInfo: "#FFFFFF",
  infoContainer: "#CCFBF1",
  onInfoContainer: "#115E59",
  
  // Neutral Outlines & Dividers
  border: "#DEE5DF",
  borderStrong: "#707973",
  divider: "#E1E8E2",
  muted: "#707973",
  cardBg: "#FFFFFF",
  overlay: "rgba(15, 23, 42, 0.6)",
} as const;

export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  xxl: 32,
  xxxl: 48,
} as const;

export const radius = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  pill: 999,
} as const;

// Scaled Typography (Ensuring >= 12sp baseline for Android readability)
export const type = {
  xs: 12,
  sm: 13,
  base: 15,
  lg: 17,
  xl: 20,
  xxl: 24,
  xxxl: 30,
  display: 36,
} as const;

export const touchTarget = {
  minHeight: 48,
  minWidth: 48,
} as const;

export const layout = {
  maxWidth: 720,
  centeredContainer: {
    width: "100%" as const,
    maxWidth: 720,
    alignSelf: "center" as const,
  },
} as const;

export const shadows = {
  sm: {
    shadowColor: "#1B2820",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 3,
    elevation: 2,
  },
  md: {
    shadowColor: "#1B2820",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.09,
    shadowRadius: 8,
    elevation: 4,
  },
  lg: {
    shadowColor: "#1B2820",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.14,
    shadowRadius: 16,
    elevation: 8,
  },
} as const;
