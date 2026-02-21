class AudioService {
  private context: AudioContext | null = null;

  private init() {
    if (!this.context) {
      this.context = new (window.AudioContext || (window as any).webkitAudioContext)();
    }
  }

  private playTone(freq: number, type: OscillatorType, duration: number, volume: number) {
    this.init();
    if (!this.context) return;

    const osc = this.context.createOscillator();
    const gain = this.context.createGain();

    osc.type = type;
    osc.frequency.setValueAtTime(freq, this.context.currentTime);

    gain.gain.setValueAtTime(volume, this.context.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, this.context.currentTime + duration);

    osc.connect(gain);
    gain.connect(this.context.destination);

    osc.start();
    osc.stop(this.context.currentTime + duration);
  }

  playClick() {
    // Subtle "tick" sound
    this.playTone(800, 'sine', 0.05, 0.1);
  }

  playNumber() {
    // Crisp, high-pitched click for numbers
    this.playTone(900, 'sine', 0.04, 0.08);
  }

  playOperator() {
    // Slightly lower, more resonant tone for operators
    this.playTone(550, 'sine', 0.08, 0.1);
  }

  playAction() {
    // Mid-range functional sound
    this.playTone(700, 'sine', 0.06, 0.08);
  }

  playClear() {
    // Unique "reset" sound
    this.playTone(300, 'triangle', 0.15, 0.1);
  }

  playEquals() {
    // Finality sound
    this.playTone(440, 'sine', 0.1, 0.1);
    setTimeout(() => this.playTone(880, 'sine', 0.15, 0.08), 30);
  }

  playSuccess() {
    // Soft "ding" sound
    this.playTone(600, 'sine', 0.1, 0.1);
    setTimeout(() => this.playTone(900, 'sine', 0.2, 0.08), 50);
  }

  playError() {
    // Low "thud" sound
    this.playTone(150, 'triangle', 0.3, 0.1);
  }

  playAiStart() {
    // Magical "shimmer" sound
    this.playTone(1000, 'sine', 0.1, 0.05);
    setTimeout(() => this.playTone(1200, 'sine', 0.1, 0.05), 50);
    setTimeout(() => this.playTone(1400, 'sine', 0.1, 0.05), 100);
  }
}

export const audioService = new AudioService();
