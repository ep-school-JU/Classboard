/**
 * @fileoverview Système de gestion et de lecture des effets sonores (Web Audio API).
 */

class AudioSystem {
    constructor() { 
        this.ctx = null; 
        this.sounds = {}; 
    }

    /**
     * Initialise l'AudioContext (doit être déclenché par une action utilisateur).
     */
    init() {
        if (this.ctx) return;
        this.ctx = new (window.AudioContext || window.webkitAudioContext)();
        
        // Chargement de vos fichiers MP3 locaux depuis le dossier classboard/audio/
        this.loadSound('silence', './audio/silence.mp3');
        this.loadSound('buzzer', './audio/buzzer.mp3');
        this.loadSound('rangement', './audio/rangement.mp3');
        this.loadSound('retour', './audio/retour.mp3');
    }

    /**
     * Télécharge un fichier audio et le décode en mémoire.
     * @param {string} name - Le nom court associé au son.
     * @param {string} url - Le chemin local du fichier MP3.
     */
    async loadSound(name, url) {
        try {
            const resp = await fetch(url);
            if (!resp.ok) {
                throw new Error(`Erreur HTTP : ${resp.status}`);
            }
            const buf = await resp.arrayBuffer();
            this.sounds[name] = await this.ctx.decodeAudioData(buf);
            console.log(`🔊 Son "${name}" chargé avec succès.`);
        } catch(e) { 
            console.error(`❌ Impossible de charger le son "${name}" à l'adresse : ${url}`, e); 
        }
    }

    /**
     * Joue un son préalablement chargé en mémoire.
     * @param {string} name - Le nom court du son à jouer.
     */
    play(name) {
        if (!this.ctx) {
            console.warn("Le système audio n'est pas encore initialisé (cliquez sur l'écran).");
            return;
        }
        if (!this.sounds[name]) {
            console.warn(`Le son "${name}" n'est pas disponible en mémoire.`);
            return;
        }
        
        const src = this.ctx.createBufferSource();
        src.buffer = this.sounds[name];
        src.connect(this.ctx.destination);
        src.start(0);
    }
}

export const audioSystem = new AudioSystem();