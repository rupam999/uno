/**
 * Sound manager for game audio
 */

let audioContext: AudioContext | null = null;
let isSoundEnabled = true;

/**
 * Initialize audio context (must be called after user interaction)
 */
export function initAudio() {
  if (typeof window === 'undefined') return;

  if (!audioContext) {
    audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
  }
}

/**
 * Enable or disable sound
 */
export function setSoundEnabled(enabled: boolean) {
  isSoundEnabled = enabled;
}

/**
 * Get sound enabled state
 */
export function isSoundEnabledState() {
  return isSoundEnabled;
}

/**
 * Play UNO call sound - cheerful "UNO!" announcement
 */
export function playUnoSound() {
  if (!isSoundEnabled || !audioContext) return;

  try {
    const now = audioContext.currentTime;

    // Create oscillator for the "U" sound
    const osc1 = audioContext.createOscillator();
    const gain1 = audioContext.createGain();

    osc1.connect(gain1);
    gain1.connect(audioContext.destination);

    // "U" - lower pitch
    osc1.frequency.setValueAtTime(400, now);
    osc1.frequency.exponentialRampToValueAtTime(450, now + 0.15);

    gain1.gain.setValueAtTime(0.3, now);
    gain1.gain.exponentialRampToValueAtTime(0.01, now + 0.2);

    osc1.start(now);
    osc1.stop(now + 0.2);

    // Create oscillator for the "NO!" sound
    const osc2 = audioContext.createOscillator();
    const gain2 = audioContext.createGain();

    osc2.connect(gain2);
    gain2.connect(audioContext.destination);

    // "NO!" - higher pitch with excitement
    osc2.frequency.setValueAtTime(600, now + 0.15);
    osc2.frequency.exponentialRampToValueAtTime(700, now + 0.35);

    gain2.gain.setValueAtTime(0, now + 0.15);
    gain2.gain.linearRampToValueAtTime(0.35, now + 0.2);
    gain2.gain.exponentialRampToValueAtTime(0.01, now + 0.4);

    osc2.start(now + 0.15);
    osc2.stop(now + 0.4);

    // Add a subtle "ding" at the end
    const osc3 = audioContext.createOscillator();
    const gain3 = audioContext.createGain();

    osc3.connect(gain3);
    gain3.connect(audioContext.destination);

    osc3.frequency.setValueAtTime(800, now + 0.35);

    gain3.gain.setValueAtTime(0.2, now + 0.35);
    gain3.gain.exponentialRampToValueAtTime(0.01, now + 0.5);

    osc3.start(now + 0.35);
    osc3.stop(now + 0.5);

  } catch (error) {
    console.error('Error playing UNO sound:', error);
  }
}

/**
 * Play card play sound
 */
export function playCardSound() {
  if (!isSoundEnabled || !audioContext) return;

  try {
    const now = audioContext.currentTime;
    const osc = audioContext.createOscillator();
    const gain = audioContext.createGain();

    osc.connect(gain);
    gain.connect(audioContext.destination);

    osc.frequency.setValueAtTime(200, now);
    osc.frequency.exponentialRampToValueAtTime(100, now + 0.1);

    gain.gain.setValueAtTime(0.15, now);
    gain.gain.exponentialRampToValueAtTime(0.01, now + 0.1);

    osc.start(now);
    osc.stop(now + 0.1);
  } catch (error) {
    console.error('Error playing card sound:', error);
  }
}

/**
 * Play draw card sound
 */
export function playDrawSound() {
  if (!isSoundEnabled || !audioContext) return;

  try {
    const now = audioContext.currentTime;
    const osc = audioContext.createOscillator();
    const gain = audioContext.createGain();

    osc.connect(gain);
    gain.connect(audioContext.destination);

    osc.frequency.setValueAtTime(150, now);
    osc.frequency.linearRampToValueAtTime(120, now + 0.08);

    gain.gain.setValueAtTime(0.12, now);
    gain.gain.exponentialRampToValueAtTime(0.01, now + 0.08);

    osc.start(now);
    osc.stop(now + 0.08);
  } catch (error) {
    console.error('Error playing draw sound:', error);
  }
}

/**
 * Play win sound
 */
export function playWinSound() {
  if (!isSoundEnabled || !audioContext) return;

  try {
    const now = audioContext.currentTime;
    const frequencies = [523.25, 659.25, 783.99, 1046.50]; // C, E, G, C (major chord)

    frequencies.forEach((freq, index) => {
      const osc = audioContext!.createOscillator();
      const gain = audioContext!.createGain();

      osc.connect(gain);
      gain.connect(audioContext!.destination);

      osc.frequency.setValueAtTime(freq, now + index * 0.1);

      gain.gain.setValueAtTime(0.2, now + index * 0.1);
      gain.gain.exponentialRampToValueAtTime(0.01, now + index * 0.1 + 0.5);

      osc.start(now + index * 0.1);
      osc.stop(now + index * 0.1 + 0.5);
    });
  } catch (error) {
    console.error('Error playing win sound:', error);
  }
}

/**
 * Play catch UNO sound (warning/alert sound)
 */
export function playCatchUnoSound() {
  if (!isSoundEnabled || !audioContext) return;

  try {
    const now = audioContext.currentTime;

    // Create a siren-like warning sound
    const osc = audioContext.createOscillator();
    const gain = audioContext.createGain();

    osc.connect(gain);
    gain.connect(audioContext.destination);

    // Rapid frequency change for alert effect
    osc.frequency.setValueAtTime(600, now);
    osc.frequency.exponentialRampToValueAtTime(400, now + 0.1);
    osc.frequency.exponentialRampToValueAtTime(600, now + 0.2);
    osc.frequency.exponentialRampToValueAtTime(400, now + 0.3);

    gain.gain.setValueAtTime(0.3, now);
    gain.gain.exponentialRampToValueAtTime(0.01, now + 0.35);

    osc.start(now);
    osc.stop(now + 0.35);
  } catch (error) {
    console.error('Error playing catch UNO sound:', error);
  }
}
