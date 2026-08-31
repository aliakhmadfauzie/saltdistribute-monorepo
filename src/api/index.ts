export { useAuth, AuthProvider } from "../context/AuthContext";
export { useApp, AppProvider } from "../context/AppContext";
export * from "../types";

export function formatIDR(amount: number): string {
  if (isNaN(amount) || amount === null || amount === undefined) return "Rp 0";
  const num = Math.round(Number(amount));
  const formatted = num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ".");
  return `Rp ${formatted}`;
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
