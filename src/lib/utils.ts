import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function money(n: number, ccy?: string) {
  return (Number(n) || 0).toLocaleString() + (ccy ? " " + ccy : "");
}

export function kwMatch(row: object, kw: string, keys: string[]) {
  if (!kw) return true;
  const q = kw.toLowerCase();
  const r = row as Record<string, unknown>;
  return keys.some((k) => String(r[k] ?? "").toLowerCase().includes(q));
}

/** GitHub Pages 子路径前缀；本地开发为空。 */
export const BASE_PATH = process.env.NEXT_PUBLIC_BASE_PATH || "";

export function withBase(path: string) {
  if (!path.startsWith("/")) return path;
  return `${BASE_PATH}${path}`;
}
