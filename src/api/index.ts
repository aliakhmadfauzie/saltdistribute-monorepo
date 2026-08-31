export { useAuth, AuthProvider } from "../context/AuthContext";
export { useApp, AppProvider } from "../context/AppContext";
export * from "../types";

export function formatIDR(amount: number): string {
  return "Rp " + Math.round(amount).toLocaleString("id-ID");
}

export function formatGrams(grams: number): string {
  if (grams >= 1000000) {
    const tons = grams / 1000000;
    return `${tons.toFixed(tons % 1 === 0 ? 0 : 2)} Ton`;
  }
  if (grams >= 1000) {
    const kgs = grams / 1000;
    return `${kgs.toFixed(kgs % 1 === 0 ? 0 : 1)} kg`;
  }
  const formatted = Number(grams.toFixed(2));
  return `${formatted} g`;
}
