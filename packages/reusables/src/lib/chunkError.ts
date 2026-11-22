// Chromium, Firefox and Safari word a failed dynamic import differently.
const CHUNK_ERROR = /dynamically imported module|importing a module script failed|ChunkLoadError|loading (css )?chunk .* failed|unable to preload css/i;
const RELOAD_KEY = "tm:chunk-reload-at";
const RELOAD_COOLDOWN_MS = 30_000;

export function isChunkLoadError(error: unknown): boolean {
  const text = error instanceof Error ? `${error.name} ${error.message}` : String(error);
  return CHUNK_ERROR.test(text);
}

/**
 * A deploy replaces the hashed files an open tab still points at, so loading a
 * page it hasn't opened yet fails. One reload fetches the new version. Returns
 * false when a reload just happened, so a file that is really missing cannot loop.
 */
export function reloadForNewVersion(): boolean {
  try {
    if (Date.now() - Number(sessionStorage.getItem(RELOAD_KEY) ?? 0) < RELOAD_COOLDOWN_MS)
      return false;
    sessionStorage.setItem(
      RELOAD_KEY,
      String(Date.now()),
    );
  }
  catch {
    // Storage is blocked, so there is no way to tell a loop from a first try.
    return false;
  }
  window.location.reload();
  return true;
}

/** Vite fires this when a lazily loaded file or its styles fail to download. */
export function installChunkErrorRecovery(): void {
  window.addEventListener(
    "vite:preloadError",
    () => {
      reloadForNewVersion();
    },
  );
}
