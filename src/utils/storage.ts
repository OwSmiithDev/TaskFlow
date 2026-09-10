// Safe localStorage access.
// Reads AND writes must both be guarded: Safari private mode and quota-exceeded
// make setItem throw, which would otherwise crash the app from inside an effect.

export function readJSON<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key)
    if (!raw) return fallback
    return JSON.parse(raw) as T
  } catch (err) {
    console.warn(`[taskflow] falha ao ler "${key}" do localStorage:`, err)
    return fallback
  }
}

export function writeJSON(key: string, value: unknown): boolean {
  try {
    localStorage.setItem(key, JSON.stringify(value))
    return true
  } catch (err) {
    console.warn(`[taskflow] falha ao gravar "${key}" no localStorage:`, err)
    return false
  }
}

export function readRaw(key: string): string | null {
  try {
    return localStorage.getItem(key)
  } catch (err) {
    console.warn(`[taskflow] falha ao ler "${key}" do localStorage:`, err)
    return null
  }
}

export function writeRaw(key: string, value: string): boolean {
  try {
    localStorage.setItem(key, value)
    return true
  } catch (err) {
    console.warn(`[taskflow] falha ao gravar "${key}" no localStorage:`, err)
    return false
  }
}
