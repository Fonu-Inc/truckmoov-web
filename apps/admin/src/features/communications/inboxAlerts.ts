const SOUND_KEY = "truckmoov.inbox.sound";

export function readSoundPreference(): boolean {
  try {
    return localStorage.getItem(SOUND_KEY) !== "off";
  }
  catch {
    return true;
  }
}

export function writeSoundPreference(on: boolean) {
  try {
    localStorage.setItem(SOUND_KEY, on ? "on" : "off");
  }
  catch {
    // The preference is a convenience; losing it is harmless.
  }
}

export function playInboundSound() {
  try {
    const context = new AudioContext();
    const oscillator = context.createOscillator();
    const gain = context.createGain();
    oscillator.frequency.value = 880;
    gain.gain.value = 0.05;
    oscillator.connect(gain);
    gain.connect(context.destination);
    oscillator.start();
    oscillator.stop(context.currentTime + 0.15);
    window.setTimeout(() => void context.close(), 400);
  }
  catch {
    // Browsers refuse audio before the first click; the badge still tells staff.
  }
}
