/**
 * RODNEY BEACH RUSH - Procedural Audio System
 * Generates all sounds and music using Web Audio API
 */

class AudioEngine {
  constructor() {
    this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
    this.masterGain = this.audioContext.createGain();
    this.masterGain.connect(this.audioContext.destination);
    this.masterGain.gain.value = 0.7;
    
    this.isMuted = false;
    this.soundEnabled = true;
    this.musicEnabled = true;
    
    this.currentMusicOscillators = [];
  }

  /**
   * Engine sound - pitch varies with speed (0-100)
   */
  playEngineSound(speed, duration = 0.1) {
    if (!this.soundEnabled) return;
    
    const now = this.audioContext.currentTime;
    
    // Map speed (0-100) to frequency (200-1000 Hz)
    const baseFreq = 200 + (speed / 100) * 800;
    
    // Create oscillator for engine noise
    const osc = this.audioContext.createOscillator();
    const filter = this.audioContext.createBiquadFilter();
    const gain = this.audioContext.createGain();
    
    osc.type = 'sawtooth';
    osc.frequency.value = baseFreq;
    filter.type = 'lowpass';
    filter.frequency.value = baseFreq * 1.5;
    
    gain.gain.setValueAtTime(0.3, now);
    gain.gain.exponentialRampToValueAtTime(0.01, now + duration);
    
    osc.connect(filter);
    filter.connect(gain);
    gain.connect(this.masterGain);
    
    osc.start(now);
    osc.stop(now + duration);
  }

  /**
   * Tire skid sound
   */
  playSkidSound() {
    if (!this.soundEnabled) return;
    
    const now = this.audioContext.currentTime;
    const duration = 0.3;
    
    // White noise for skid
    const bufferSize = this.audioContext.sampleRate * duration;
    const buffer = this.audioContext.createBuffer(1, bufferSize, this.audioContext.sampleRate);
    const data = buffer.getChannelData(0);
    
    for (let i = 0; i < bufferSize; i++) {
      data[i] = Math.random() * 2 - 1;
    }
    
    const source = this.audioContext.createBufferSource();
    const filter = this.audioContext.createBiquadFilter();
    const gain = this.audioContext.createGain();
    
    source.buffer = buffer;
    filter.type = 'highpass';
    filter.frequency.value = 3000;
    
    gain.gain.setValueAtTime(0.2, now);
    gain.gain.exponentialRampToValueAtTime(0.01, now + duration);
    
    source.connect(filter);
    filter.connect(gain);
    gain.connect(this.masterGain);
    
    source.start(now);
  }

  /**
   * Ocean wave ambient sound
   */
  playOceanAmbience() {
    if (!this.soundEnabled) return;
    
    const now = this.audioContext.currentTime;
    const duration = 4;
    
    // Create wave-like sound with modulated noise
    const bufferSize = this.audioContext.sampleRate * duration;
    const buffer = this.audioContext.createBuffer(1, bufferSize, this.audioContext.sampleRate);
    const data = buffer.getChannelData(0);
    
    for (let i = 0; i < bufferSize; i++) {
      const t = i / this.audioContext.sampleRate;
      // Modulated noise (low frequency envelope)
      const envelope = Math.sin(t * 0.5) * 0.5 + 0.5;
      data[i] = (Math.random() * 2 - 1) * envelope;
    }
    
    const source = this.audioContext.createBufferSource();
    const filter = this.audioContext.createBiquadFilter();
    const gain = this.audioContext.createGain();
    
    source.buffer = buffer;
    source.loop = true;
    filter.type = 'lowpass';
    filter.frequency.value = 800;
    
    gain.gain.value = 0.15;
    
    source.connect(filter);
    filter.connect(gain);
    gain.connect(this.masterGain);
    
    source.start(now);
    source.stop(now + duration);
  }

  /**
   * Countdown beep (3... 2... 1...)
   */
  playCountdownBeep(count) {
    if (!this.soundEnabled) return;
    
    const now = this.audioContext.currentTime;
    const duration = 0.3;
    const freq = count === 0 ? 800 : 600; // Higher pitch for "GO"
    
    const osc = this.audioContext.createOscillator();
    const gain = this.audioContext.createGain();
    
    osc.type = 'sine';
    osc.frequency.value = freq;
    
    gain.gain.setValueAtTime(0.3, now);
    gain.gain.exponentialRampToValueAtTime(0.01, now + duration);
    
    osc.connect(gain);
    gain.connect(this.masterGain);
    
    osc.start(now);
    osc.stop(now + duration);
  }

  /**
   * Lap completed sound
   */
  playLapSound() {
    if (!this.soundEnabled) return;
    
    const now = this.audioContext.currentTime;
    
    // Two-tone ascending beep
    for (let i = 0; i < 2; i++) {
      const osc = this.audioContext.createOscillator();
      const gain = this.audioContext.createGain();
      const startTime = now + i * 0.15;
      const duration = 0.15;
      
      osc.type = 'sine';
      osc.frequency.value = 600 + i * 200;
      
      gain.gain.setValueAtTime(0.2, startTime);
      gain.gain.exponentialRampToValueAtTime(0.01, startTime + duration);
      
      osc.connect(gain);
      gain.connect(this.masterGain);
      
      osc.start(startTime);
      osc.stop(startTime + duration);
    }
  }

  /**
   * Race finish jingle
   */
  playFinishJingle() {
    if (!this.soundEnabled) return;
    
    const now = this.audioContext.currentTime;
    
    // Play a simple ascending melody
    const notes = [523, 659, 784, 1047]; // C, E, G, C (octave higher)
    const noteDuration = 0.3;
    
    for (let i = 0; i < notes.length; i++) {
      const osc = this.audioContext.createOscillator();
      const gain = this.audioContext.createGain();
      const startTime = now + i * noteDuration;
      
      osc.type = 'sine';
      osc.frequency.value = notes[i];
      
      gain.gain.setValueAtTime(0.3, startTime);
      gain.gain.exponentialRampToValueAtTime(0.01, startTime + noteDuration);
      
      osc.connect(gain);
      gain.connect(this.masterGain);
      
      osc.start(startTime);
      osc.stop(startTime + noteDuration);
    }
  }

  /**
   * Tropical background music (looping)
   */
  playTropicalMusic() {
    if (!this.musicEnabled) return;
    
    const now = this.audioContext.currentTime;
    const tempo = 0.5; // seconds per beat
    const loopDuration = tempo * 8; // 8 beats per loop
    
    // Simple tropical melody pattern
    const melody = [
      { freq: 523, duration: tempo },     // C
      { freq: 659, duration: tempo },     // E
      { freq: 523, duration: tempo },     // C
      { freq: 784, duration: tempo },     // G
      { freq: 659, duration: tempo },     // E
      { freq: 523, duration: tempo },     // C
      { freq: 392, duration: tempo },     // G (lower)
      { freq: 523, duration: tempo }      // C
    ];
    
    const playMelodyLoop = (startTime) => {
      for (let i = 0; i < melody.length; i++) {
        const note = melody[i];
        const noteStartTime = startTime + note.duration * i;
        
        const osc = this.audioContext.createOscillator();
        const gain = this.audioContext.createGain();
        const filter = this.audioContext.createBiquadFilter();
        
        osc.type = 'sine';
        osc.frequency.value = note.freq;
        filter.type = 'lowpass';
        filter.frequency.value = note.freq * 1.5;
        
        gain.gain.setValueAtTime(0.15, noteStartTime);
        gain.gain.exponentialRampToValueAtTime(0.01, noteStartTime + note.duration * 0.9);
        
        osc.connect(filter);
        filter.connect(gain);
        gain.connect(this.masterGain);
        
        osc.start(noteStartTime);
        osc.stop(noteStartTime + note.duration * 0.95);
        
        this.currentMusicOscillators.push(osc);
      }
      
      // Schedule next loop
      const nextLoopTime = startTime + loopDuration;
      if (this.musicEnabled) {
        setTimeout(() => playMelodyLoop(this.audioContext.currentTime), loopDuration * 1000);
      }
    };
    
    playMelodyLoop(now);
  }

  /**
   * Bass line accompaniment
   */
  playBassLine() {
    if (!this.musicEnabled) return;
    
    const now = this.audioContext.currentTime;
    const tempo = 0.5;
    
    // Simple bass pattern (lower notes)
    const bassNotes = [
      { freq: 262, duration: tempo * 2 },   // C (low)
      { freq: 196, duration: tempo * 2 },   // G (low)
      { freq: 262, duration: tempo * 2 },   // C (low)
      { freq: 196, duration: tempo * 2 }    // G (low)
    ];
    
    const playBassLoop = (startTime) => {
      for (let i = 0; i < bassNotes.length; i++) {
        const note = bassNotes[i];
        const noteStartTime = startTime + note.duration * i;
        
        const osc = this.audioContext.createOscillator();
        const gain = this.audioContext.createGain();
        
        osc.type = 'sine';
        osc.frequency.value = note.freq;
        
        gain.gain.setValueAtTime(0.1, noteStartTime);
        gain.gain.exponentialRampToValueAtTime(0.01, noteStartTime + note.duration * 0.9);
        
        osc.connect(gain);
        gain.connect(this.masterGain);
        
        osc.start(noteStartTime);
        osc.stop(noteStartTime + note.duration * 0.95);
        
        this.currentMusicOscillators.push(osc);
      }
      
      const loopDuration = tempo * 8;
      const nextLoopTime = startTime + loopDuration;
      if (this.musicEnabled) {
        setTimeout(() => playBassLoop(this.audioContext.currentTime), loopDuration * 1000);
      }
    };
    
    playBassLoop(now);
  }

  /**
   * Stop all current music
   */
  stopMusic() {
    for (let osc of this.currentMusicOscillators) {
      try {
        osc.stop(this.audioContext.currentTime);
      } catch (e) {
        // Already stopped
      }
    }
    this.currentMusicOscillators = [];
  }

  /**
   * Set master volume (0-1)
   */
  setVolume(volume) {
    this.masterGain.gain.value = Math.max(0, Math.min(1, volume));
  }

  /**
   * Toggle sound effects on/off
   */
  toggleSound() {
    this.soundEnabled = !this.soundEnabled;
    return this.soundEnabled;
  }

  /**
   * Toggle music on/off
   */
  toggleMusic() {
    this.musicEnabled = !this.musicEnabled;
    if (!this.musicEnabled) {
      this.stopMusic();
    }
    return this.musicEnabled;
  }

  /**
   * Mute/unmute all audio
   */
  toggleMute() {
    this.isMuted = !this.isMuted;
    this.masterGain.gain.value = this.isMuted ? 0 : 0.7;
    return this.isMuted;
  }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { AudioEngine };
}
