type StorageLike = Pick<Storage, "getItem" | "setItem" | "removeItem">

function storage(area: "localStorage" | "sessionStorage"): StorageLike | null {
  if (typeof window === "undefined") return null
  try {
    return window[area]
  } catch {
    return null
  }
}

export const safeLocalStorage: StorageLike = {
  getItem(key) {
    try {
      return storage("localStorage")?.getItem(key) ?? null
    } catch {
      return null
    }
  },
  setItem(key, value) {
    try {
      storage("localStorage")?.setItem(key, value)
    } catch {
      /* private mode or blocked storage */
    }
  },
  removeItem(key) {
    try {
      storage("localStorage")?.removeItem(key)
    } catch {
      /* private mode or blocked storage */
    }
  },
}

export const safeSessionStorage: StorageLike = {
  getItem(key) {
    try {
      return storage("sessionStorage")?.getItem(key) ?? null
    } catch {
      return null
    }
  },
  setItem(key, value) {
    try {
      storage("sessionStorage")?.setItem(key, value)
    } catch {
      /* private mode or blocked storage */
    }
  },
  removeItem(key) {
    try {
      storage("sessionStorage")?.removeItem(key)
    } catch {
      /* private mode or blocked storage */
    }
  },
}
