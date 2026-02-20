export function lsGet<T>(key: string): T | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(key);
    if (!raw) return null;
    return JSON.parse(raw) as T;
  } catch {
    return null;
  }
}

export function lsSet<T>(key: string, val: T) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(key, JSON.stringify(val));
}

export function lsRemove(key: string) {
  if (typeof window === "undefined") return;
  window.localStorage.removeItem(key);
}

