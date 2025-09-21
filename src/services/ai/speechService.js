class SpeechService {
  constructor() {
    this.speechSynthesis = window.speechSynthesis;
    this.isSpeaking = false;
    this.voiceEnabled = true;
  }

  toggleVoice() {
    this.voiceEnabled = !this.voiceEnabled;
    if (!this.voiceEnabled) {
      this.stopSpeaking();
    }
    return this.voiceEnabled;
  }

  speakText(text, language = 'en-US') {
    if (!this.voiceEnabled || !this.speechSynthesis) return;
    
    this.stopSpeaking();
    
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = language;
    utterance.rate = 0.9;
    utterance.pitch = 1.1;
    
    this.speechSynthesis.speak(utterance);
    this.isSpeaking = true;
    
    utterance.onend = () => {
      this.isSpeaking = false;
    };
  }

  stopSpeaking() {
    if (this.speechSynthesis && this.isSpeaking) {
      this.speechSynthesis.cancel();
      this.isSpeaking = false;
    }
  }

  async recognizeSpeech() {
    return new Promise((resolve, reject) => {
      if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
        reject(new Error('Speech recognition not supported'));
        return;
      }

      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      const recognition = new SpeechRecognition();
      recognition.continuous = false;
      recognition.interimResults = false;
      recognition.lang = 'en-US';

      recognition.onresult = (event) => {
        const transcript = event.results[0][0].transcript;
        resolve(transcript);
      };

      recognition.onerror = (event) => {
        reject(event.error);
      };

      recognition.onend = () => {
        // Auto-stop after 5 seconds
        setTimeout(() => {
          if (recognition && recognition.abort) {
            recognition.abort();
          }
        }, 5000);
      };

      recognition.start();
      
      // Auto-stop after 7 seconds
      setTimeout(() => {
        if (recognition && recognition.stop) {
          recognition.stop();
          reject(new Error('Speech recognition timeout'));
        }
      }, 7000);
    });
  }

  async detectLanguage(text) {
    // Simple language detection
    if (text.match(/[अ-ह]/)) return 'hi-IN';
    if (text.match(/[áéíóúñ]/)) return 'es-ES';
    if (text.match(/[äöüß]/)) return 'de-DE';
    if (text.match(/[àâçéèêëîïôûùüÿ]/)) return 'fr-FR';
    return 'en-US';
  }
}

// Create singleton instance
export const speechService = new SpeechService();

// Export individual functions for convenience
export const speakText = (text, language) => speechService.speakText(text, language);
export const recognizeSpeech = () => speechService.recognizeSpeech();
export const stopSpeaking = () => speechService.stopSpeaking();
export const toggleVoice = () => speechService.toggleVoice();