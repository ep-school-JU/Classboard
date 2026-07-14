/**
 * @fileoverview Widget Sonomètre (Niveau Sonore) interactif en temps réel utilisant l'API Web Audio.
 * @extends BaseWidget
 */
import { BaseWidget } from './base-widget.js';

export class NoiseWidget extends BaseWidget {
    constructor() {
        super();
        this.audioContext = null;
        this.analyser = null;
        this.microphone = null;
        this.javascriptNode = null;
        this.isListening = false;
        
        // Configuration de base
        this.threshold = 45; // Seuil de tolérance par défaut (en % d'amplitude relative)
        this.alertTimer = null;
        this.isAlerting = false;
    }

    getStyle() {
        return `
            .noise-card {
                display: flex;
                flex-direction: column;
                justify-content: space-between;
                height: 100%;
                color: var(--text-primary, #ffffff);
                font-family: var(--font-main);
                padding: 0.2rem;
            }
            .widget-header {
                font-size: 0.95rem;
                font-weight: 700;
                text-transform: uppercase;
                letter-spacing: 0.5px;
                opacity: 0.9;
                margin-bottom: 0.5rem;
            }
            .noise-layout {
                display: flex;
                align-items: center;
                gap: 20px;
                flex-grow: 1;
                height: 120px;
            }
            /* Jauge de niveau sonore */
            .meter-container {
                width: 32px;
                height: 100%;
                background: rgba(255, 255, 255, 0.08);
                border: 1px solid rgba(255, 255, 255, 0.15);
                border-radius: 16px;
                position: relative;
                overflow: hidden;
                display: flex;
                flex-direction: column-reverse; /* Remplit du bas vers le haut */
            }
            .meter-bar {
                width: 100%;
                height: 0%; /* Contrôlé dynamiquement par JS */
                background: linear-gradient(to top, #10b981 0%, #f59e0b 60%, #ef4444 100%);
                border-radius: 16px;
                transition: height 0.1s ease-out;
            }
            /* Ligne indicatrice de seuil */
            .threshold-line {
                position: absolute;
                left: 0;
                width: 100%;
                height: 2px;
                background: #ef4444;
                box-shadow: 0 0 8px #ef4444;
                transition: bottom 0.2s ease;
                z-index: 2;
            }
            /* Panneau de contrôle du bruit */
            .noise-controls {
                flex-grow: 1;
                display: flex;
                flex-direction: column;
                justify-content: center;
                gap: 12px;
            }
            .status-indicator {
                font-size: 1.1rem;
                font-weight: 700;
                display: flex;
                align-items: center;
                gap: 8px;
            }
            .indicator-dot {
                width: 10px;
                height: 10px;
                border-radius: 50%;
                background: #6b7280; /* Gris éteint */
            }
            .status-indicator.active .indicator-dot {
                background: #10b981;
                box-shadow: 0 0 10px #10b981;
                animation: pulse 1.5s infinite;
            }
            /* Boutons de présélection de seuil tactiles */
            .threshold-selector {
                display: grid;
                grid-template-columns: repeat(3, 1fr);
                gap: 6px;
            }
            .threshold-btn {
                background: rgba(255, 255, 255, 0.06);
                border: 1px solid rgba(255, 255, 255, 0.1);
                border-radius: 8px;
                color: var(--text-primary, #ffffff);
                font-family: var(--font-main);
                font-size: 0.7rem;
                font-weight: 600;
                padding: 6px 4px;
                cursor: pointer;
                transition: all 0.15s;
                text-align: center;
            }
            .threshold-btn.active {
                background: var(--accent-color, #6366f1);
                border-color: var(--accent-color, #6366f1);
                box-shadow: 0 0 10px rgba(99, 102, 241, 0.3);
            }
            /* État d'alerte global sur le widget */
            .noise-card.alert-active {
                animation: danger-flash 1s infinite alternate;
            }
            @keyframes pulse {
                0% { transform: scale(1); opacity: 1; }
                50% { transform: scale(1.2); opacity: 0.7; }
                100% { transform: scale(1); opacity: 1; }
            }
            @keyframes danger-flash {
                from { border-color: rgba(239, 68, 68, 0.2); background: rgba(239, 68, 68, 0.05); }
                to { border-color: rgba(239, 68, 68, 0.8); background: rgba(239, 68, 68, 0.25); }
            }
        `;
    }

    getTemplate() {
        return `
            <div class="noise-card" id="widget-body">
                <div class="widget-header">🎤 Niveau Sonore</div>
                
                <div class="noise-layout">
                    <div class="meter-container">
                        <div class="threshold-line" id="threshold-indicator" style="bottom: 45%;"></div>
                        <div class="meter-bar" id="volume-meter"></div>
                    </div>

                    <div class="noise-controls">
                        <div class="status-indicator" id="mic-status">
                            <span class="indicator-dot"></span>
                            <span id="status-text">Microphone désactivé</span>
                        </div>
                        
                        <div style="font-size: 0.8rem; opacity: 0.7;">Sensibilité (Seuil maximum) :</div>
                        <div class="threshold-selector">
                            <button class="threshold-btn active" data-level="30">🤫 Chut</button>
                            <button class="threshold-btn" data-level="50">👥 Groupe</button>
                            <button class="threshold-btn" data-level="75">📢 Classe</button>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }

    init() {
        this.widgetBody = this.shadowRoot.getElementById('widget-body');
        this.volumeMeter = this.shadowRoot.getElementById('volume-meter');
        this.thresholdIndicator = this.shadowRoot.getElementById('threshold-indicator');
        this.micStatus = this.shadowRoot.getElementById('mic-status');
        this.statusText = this.shadowRoot.getElementById('status-text');

        // Gestion du choix de sensibilité
        const buttons = this.shadowRoot.querySelectorAll('.threshold-btn');
        buttons.forEach(btn => {
            btn.addEventListener('click', () => {
                buttons.forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                const level = parseInt(btn.getAttribute('data-level'));
                this.setThreshold(level);
            });
        });

        // Demander l'accès au microphone sur clic sur le statut pour démarrer
        this.micStatus.addEventListener('click', () => this.toggleMicrophone());
    }

    setThreshold(level) {
        this.threshold = level;
        this.thresholdIndicator.style.bottom = `${level}%`;
    }

    async toggleMicrophone() {
        if (this.isListening) {
            this.stopMicrophone();
            return;
        }

        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true, video: false });
            
            // Initialisation de la Web Audio API
            this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
            this.analyser = this.audioContext.createAnalyser();
            this.analyser.smoothingTimeConstant = 0.3; // Rendu plus fluide
            this.analyser.fftSize = 256;

            this.microphone = this.audioContext.createMediaStreamSource(stream);
            this.microphone.connect(this.analyser);

            this.isListening = true;
            this.micStatus.classList.add('active');
            this.statusText.textContent = "Sonomètre actif";

            this.analyzeVolume();
        } catch (err) {
            console.error("Accès microphone refusé :", err);
            alert("Veuillez autoriser l'accès au microphone dans les paramètres de votre navigateur pour utiliser le sonomètre.");
            this.statusText.textContent = "Accès refusé ✕";
        }
    }

    stopMicrophone() {
        this.isListening = false;
        this.micStatus.classList.remove('active');
        this.statusText.textContent = "Microphone désactivé";
        this.volumeMeter.style.height = '0%';
        this.clearAlert();

        if (this.microphone) {
            this.microphone.disconnect();
            this.microphone = null;
        }
        if (this.audioContext && this.audioContext.state !== 'closed') {
            this.audioContext.close();
            this.audioContext = null;
        }
    }

    analyzeVolume() {
        if (!this.isListening) return;

        const array = new Uint8Array(this.analyser.frequencyBinCount);
        this.analyser.getByteFrequencyData(array);

        // Calcul de la moyenne d'amplitude (Root Mean Square ou RMS)
        let values = 0;
        const length = array.length;
        for (let i = 0; i < length; i++) {
            values += array[i];
        }
        const average = values / length;

        // Conversion en pourcentage d'amplitude relative pour notre jauge
        const volumePercentage = Math.min(100, Math.round((average / 128) * 100));
        
        // Rendu visuel immédiat
        this.volumeMeter.style.height = `${volumePercentage}%`;

        // Évaluation du dépassement de seuil
        if (volumePercentage > this.threshold) {
            this.triggerThresholdWarning();
        } else {
            this.resetThresholdWarning();
        }

        // Boucle récursive synchronisée sur le taux de rafraîchissement d'écran
        requestAnimationFrame(() => this.analyzeVolume());
    }

    triggerThresholdWarning() {
        if (this.isAlerting) return;

        // Si le bruit dépasse le seuil, on démarre un compte à rebours de 2.5 secondes
        if (!this.alertTimer) {
            this.alertTimer = setTimeout(() => {
                this.isAlerting = true;
                this.widgetBody.classList.add('alert-active');
            }, 2500); // Seuil de tolérance temporelle
        }
    }

    resetThresholdWarning() {
        if (this.alertTimer) {
            clearTimeout(this.alertTimer);
            this.alertTimer = null;
        }
        this.clearAlert();
    }

    clearAlert() {
        this.isAlerting = false;
        this.widgetBody.classList.remove('alert-active');
    }

    disconnectedCallback() {
        this.stopMicrophone();
    }
}

customElements.define('noise-widget', NoiseWidget);