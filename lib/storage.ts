import { PlayerState } from "@/lib/types";
import { createInitialState } from "@/lib/gameLogic";

const STORAGE_KEY = "monster-farm-save-v2";
const LEGACY_STORAGE_KEY = "monster-farm-save-v1";

const isBrowser = () => typeof window !== "undefined";

export const loadState = (): PlayerState => {
  if (!isBrowser()) {
    return createInitialState();
  }

  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    const legacyRaw = window.localStorage.getItem(LEGACY_STORAGE_KEY);
    const source = raw ?? legacyRaw;

    if (!source) {
      const initial = createInitialState();
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(initial));
      return initial;
    }

    const parsed = JSON.parse(source) as Partial<PlayerState>;
    const merged = createInitialState(parsed);
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(merged));
    return merged;
  } catch {
    const fallback = createInitialState();
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(fallback));
    } catch {
      // localStorage can be blocked in some browser privacy contexts.
    }
    return fallback;
  }
};

export const saveState = (state: PlayerState): void => {
  if (!isBrowser()) {
    return;
  }

  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    // Ignore write failures to avoid gameplay crashes.
  }
};

export const resetState = (): PlayerState => {
  const fresh = createInitialState();
  saveState(fresh);
  return fresh;
};
