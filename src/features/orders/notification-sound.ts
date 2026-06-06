let audioContext: AudioContext | null = null;

export async function unlockNotificationSound() {
  if (typeof window === "undefined") return;
  audioContext ??= new AudioContext();
  if (audioContext.state === "suspended") {
    await audioContext.resume();
  }
}

export async function playOrderNotificationSound() {
  try {
    await unlockNotificationSound();
    if (!audioContext) return;

    const start = audioContext.currentTime;
    [0, 0.18].forEach((offset, index) => {
      const oscillator = audioContext!.createOscillator();
      const gain = audioContext!.createGain();
      oscillator.type = "sine";
      oscillator.frequency.value = index === 0 ? 740 : 980;
      gain.gain.setValueAtTime(0.0001, start + offset);
      gain.gain.exponentialRampToValueAtTime(0.2, start + offset + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.0001, start + offset + 0.16);
      oscillator.connect(gain);
      gain.connect(audioContext!.destination);
      oscillator.start(start + offset);
      oscillator.stop(start + offset + 0.17);
    });
  } catch {
    // Browsers can block audio until the user interacts with the page.
  }
}
