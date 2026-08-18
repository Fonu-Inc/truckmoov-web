export type BrowserCoordinates = {
  lat: number;
  lng: number;
};

let browserCoordinatesPromise: Promise<BrowserCoordinates | null> | null = null;
let activeWatchId: number | null = null;
let activeTimeoutId: number | null = null;
let resolveActiveRequest: ((coordinates: BrowserCoordinates | null) => void) | null = null;

function cleanUpActiveRequest() {
  if (activeWatchId !== null && navigator.geolocation) {
    navigator.geolocation.clearWatch(activeWatchId);
    activeWatchId = null;
  }

  if (activeTimeoutId !== null) {
    window.clearTimeout(activeTimeoutId);
    activeTimeoutId = null;
  }
}

function finishActiveRequest(coordinates: BrowserCoordinates | null) {
  const resolve = resolveActiveRequest;
  resolveActiveRequest = null;
  cleanUpActiveRequest();
  resolve?.(coordinates);
}

export function getBrowserCoordinates() {
  if (browserCoordinatesPromise)
    return browserCoordinatesPromise;

  browserCoordinatesPromise = new Promise((resolve) => {
    if (!navigator.geolocation) {
      resolve(null);
      return;
    }

    resolveActiveRequest = resolve;
    activeWatchId = navigator.geolocation.watchPosition(
      position =>
        finishActiveRequest({
          lat: position.coords.latitude,
          lng: position.coords.longitude,
        }),
      () => finishActiveRequest(null),
      {
        enableHighAccuracy: false,
        maximumAge: 10 * 60 * 1000,
        timeout: 5000,
      },
    );

    activeTimeoutId = window.setTimeout(
      finishActiveRequest,
      5500,
      null,
    );
  });

  return browserCoordinatesPromise;
}

/** Clears any pending browser watcher and invalidates the cached location. */
export function clearBrowserCoordinatesCache() {
  finishActiveRequest(null);
  browserCoordinatesPromise = null;
}
