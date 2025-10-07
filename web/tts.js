// tts.js - Text-to-Speech using Web Speech API

class TTS {
    constructor() {
        this.synth = window.speechSynthesis;
        this.voices = [];
        this.spanishVoice = null;
        this.enabled = true;
        this.initialized = false;
    }

    async initialize() {
        if (this.initialized) return;
        
        // Wait for voices to load
        return new Promise((resolve) => {
            const loadVoices = () => {
                this.voices = this.synth.getVoices();
                this.spanishVoice = this._findBestSpanishVoice();
                this.initialized = true;
                console.log('✓ TTS initialized', this.spanishVoice ? 'with Spanish voice' : 'without Spanish voice');
                resolve();
            };

            // Voices might load asynchronously
            if (this.synth.getVoices().length > 0) {
                loadVoices();
            } else {
                this.synth.addEventListener('voiceschanged', loadVoices, { once: true });
                // Fallback timeout
                setTimeout(loadVoices, 1000);
            }
        });
    }

    // Find the best Spanish voice available
    _findBestSpanishVoice() {
        // Prefer voices in this order:
        // 1. Spanish (Spain) - es-ES
        // 2. Spanish (Latin America) - es-MX, es-AR, etc.
        // 3. Any Spanish voice
        
        const spanishVoices = this.voices.filter(voice => 
            voice.lang.startsWith('es')
        );

        if (spanishVoices.length === 0) {
            console.warn('No Spanish voices available');
            return null;
        }

        // Prefer Spain Spanish
        const esES = spanishVoices.find(v => v.lang === 'es-ES');
        if (esES) return esES;

        // Prefer Mexican Spanish
        const esMX = spanishVoices.find(v => v.lang === 'es-MX');
        if (esMX) return esMX;

        // Return first available Spanish voice
        return spanishVoices[0];
    }

    // Speak text in Spanish
    speak(text, options = {}) {
        if (!this.enabled) {
            console.log('TTS is disabled');
            return Promise.resolve();
        }

        if (!this.initialized) {
            console.warn('TTS not initialized yet');
            return Promise.resolve();
        }

        return new Promise((resolve, reject) => {
            // Cancel any ongoing speech
            this.synth.cancel();

            const utterance = new SpeechSynthesisUtterance(text);
            
            // Set voice
            if (this.spanishVoice) {
                utterance.voice = this.spanishVoice;
            }
            utterance.lang = 'es-ES';
            
            // Set options
            utterance.rate = options.rate || 0.9; // Slightly slower for learning
            utterance.pitch = options.pitch || 1.0;
            utterance.volume = options.volume || 1.0;

            // Event handlers
            utterance.onend = () => {
                resolve();
            };

            utterance.onerror = (event) => {
                console.error('TTS error:', event);
                reject(event);
            };

            // Speak
            this.synth.speak(utterance);
        });
    }

    // Speak text in English
    speakEnglish(text, options = {}) {
        if (!this.enabled) {
            return Promise.resolve();
        }

        return new Promise((resolve, reject) => {
            this.synth.cancel();

            const utterance = new SpeechSynthesisUtterance(text);
            utterance.lang = 'en-US';
            utterance.rate = options.rate || 1.0;
            utterance.pitch = options.pitch || 1.0;
            utterance.volume = options.volume || 1.0;

            utterance.onend = () => resolve();
            utterance.onerror = (event) => {
                console.error('TTS error:', event);
                reject(event);
            };

            this.synth.speak(utterance);
        });
    }

    // Stop speaking
    stop() {
        this.synth.cancel();
    }

    // Pause speaking
    pause() {
        this.synth.pause();
    }

    // Resume speaking
    resume() {
        this.synth.resume();
    }

    // Check if speaking
    isSpeaking() {
        return this.synth.speaking;
    }

    // Enable/disable TTS
    setEnabled(enabled) {
        this.enabled = enabled;
        if (!enabled) {
            this.stop();
        }
    }

    // Check if TTS is supported
    isSupported() {
        return 'speechSynthesis' in window;
    }

    // Get available voices
    getVoices() {
        return this.voices;
    }

    // Get Spanish voices
    getSpanishVoices() {
        return this.voices.filter(voice => voice.lang.startsWith('es'));
    }

    // Set specific voice
    setVoice(voiceName) {
        const voice = this.voices.find(v => v.name === voiceName);
        if (voice) {
            this.spanishVoice = voice;
            return true;
        }
        return false;
    }

    // Create pronounce button
    createPronounceButton(text, className = 'pronounce-btn') {
        const button = document.createElement('button');
        button.className = className;
        button.innerHTML = '🔊';
        button.setAttribute('aria-label', `Pronounce ${text}`);
        button.onclick = (e) => {
            e.preventDefault();
            e.stopPropagation();
            this.speak(text);
        };
        return button;
    }
}

// Speech Recognition (for future STT features)
class STT {
    constructor() {
        this.recognition = null;
        this.isListening = false;
        this.initialized = false;
    }

    initialize() {
        if (this.initialized) return true;
        
        // Check for browser support
        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
        
        if (!SpeechRecognition) {
            console.warn('Speech recognition not supported in this browser');
            return false;
        }

        this.recognition = new SpeechRecognition();
        this.recognition.continuous = false;
        this.recognition.interimResults = false;
        this.recognition.lang = 'es-ES';
        
        this.initialized = true;
        console.log('✓ STT initialized');
        return true;
    }

    // Start listening
    listen() {
        if (!this.initialized || this.isListening) {
            return Promise.reject(new Error('STT not ready'));
        }

        return new Promise((resolve, reject) => {
            this.recognition.onresult = (event) => {
                const transcript = event.results[0][0].transcript;
                const confidence = event.results[0][0].confidence;
                resolve({ transcript, confidence });
                this.isListening = false;
            };

            this.recognition.onerror = (event) => {
                reject(event.error);
                this.isListening = false;
            };

            this.recognition.onend = () => {
                this.isListening = false;
            };

            try {
                this.recognition.start();
                this.isListening = true;
            } catch (error) {
                reject(error);
            }
        });
    }

    // Stop listening
    stop() {
        if (this.isListening) {
            this.recognition.stop();
            this.isListening = false;
        }
    }

    // Check if supported
    isSupported() {
        return !!(window.SpeechRecognition || window.webkitSpeechRecognition);
    }
}

// Create global instances
const tts = new TTS();
const stt = new STT();
