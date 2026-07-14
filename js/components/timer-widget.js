/**
 * @fileoverview Widget Minuteur Circulaire Tactile avec signaux visuels et sonores.
 * @extends BaseWidget
 */
import { BaseWidget } from './base-widget.js';
import { audioSystem } from '../audio.js';

export class TimerWidget extends BaseWidget {
    constructor() {
        super();
        this.totalSeconds = 0;
        this.remainingSeconds = 0;
        this.intervalId = null;
        this.isPaused = true;
        this.circleLength = 2 * Math.PI * 45; // Rayon de 45px (2 * pi * r = ~282.74)
    }

    getStyle() {
        return `
            .timer-card {
                display: flex;
                flex-direction: column;
                justify-content: space-between;
                align-items: center;
                height: 100%;
                color: var(--text-primary, #ffffff);
                font-family: var(--font-main);
                padding: 0.5rem;
            }
            .widget-header {
                font-size: 0.9rem;
                font-weight: 700;
                text-transform: uppercase;
                letter-spacing: 0.5px;
                opacity: 0.9;
                width: 100%;
                text-align: left;
                margin-bottom: 0.5rem;
            }
            .timer-display-area {
                position: relative;
                width: 130px;
                height: 130px;
                display: flex;
                align-items: center;
                justify-content: center;
            }
            /* SVG Cercle de progression */
            svg {
                transform: rotate(-90deg); /* Démarrage en haut à 12h */
                width: 100%;
                height: 100%;
            }
            circle {
                fill: transparent;
                stroke-width: 6;
            }
            .circle-bg {
                stroke: rgba(255, 255, 255, 0.08);
            }
            .circle-progress {
                stroke: var(--accent-color, #6366f1);
                stroke-linecap: round;
                transition: stroke-dashoffset 1s linear, stroke 0.5s ease;
            }
            /* Changements de couleur selon l'urgence */
            .timer-warning {
                stroke: #f97316; /* Orange */
            }
            .timer-danger {
                stroke: #ef4444; /* Rouge */
            }
            /* Temps numérique au centre */
            .time-text {
                position: absolute;
                font-size: 1.8rem;
                font-weight: 800;
                font-variant-numeric: tabular-nums;
            }
            /* Presets tactiles rapides */
            .presets-grid {
                display: grid;
                grid-template-columns: repeat(4, 1fr);
                gap: 6px;
                width: 100%;
                margin: 0.5rem 0;
            }
            .preset-btn {
                background: rgba(255, 255, 255, 0.06);
                border: 1px solid rgba(255, 255, 255, 0.1);
                border-radius: 8px;
                color: var(--text-primary, #ffffff);
                font-size: 0.75rem;
                font-weight: 600;
                padding: 6px 0;
                cursor: pointer;
                transition: all 0.15s;
                touch-action: manipulation;
            }
            .preset-btn:hover {
                background: rgba(255, 255, 255, 0.12);
                border-color: rgba(255, 255, 255, 0.25);
            }
            .preset-btn:active {
                transform: scale(0.92);
            }
            /* Contrôles d'action (Play/Pause/Reset) */
            .controls {
                display: flex;
                gap: 12px;
                justify-content: center;
                width: 100%;
            }
            .control-btn {
                background: var(--accent-color, #6366f1);
                border: none;
                border-radius: 50%;
                width: 42px;
                height: 42px;
                display: flex;
                align-items: center;
                justify-content: center;
                color: #ffffff;
                font-size: 1.2rem;
                cursor: pointer;
                transition: all 0.15s;
                box-shadow: 0 4px 10px rgba(0,0,0,0.15);
                touch-action: manipulation;
            }
            .control-btn:hover {
                transform: scale(1.08);
                filter: brightness(1.1);
            }
            .control-btn:active {
                transform: scale(0.95);
            }
            .control-btn.btn-secondary {
                background: rgba(255, 255, 255, 0.1);
                border: 1px solid rgba(255, 255, 255, 0.2);
                color: var(--text-primary, #ffffff);
            }
            /* Input de temps libre */
            .custom-time-input {
                background: transparent;
                border: none;
                border-bottom: 2px dashed rgba(255, 255, 255, 0.3);
                color: var(--text-primary, #ffffff);
                font-family: var(--font-main);
                font-size: 1.8rem;
                font-weight: 800;
                width: 100px;
                text-align: center;
                outline: none;
            }
        `;
    }

    getTemplate() {
        return `
            <div class="timer-card">
                <div class="widget-header">⏱️ Minuteur</div>
                
                <div class="timer-display-area">
                    <svg viewBox="0 0 100 100">
                        <circle class="circle-bg" cx="50" cy="50" r="45"></circle>
                        <circle class="circle-progress" id="progress-bar" cx="50" cy="50" r="45"></circle>
                    </svg>
                    <div class="time-text" id="time-display">
                        <input type="text" class="custom-time-input" id="time-input" value="10:00" placeholder="00:00">
                    </div>
                </div>

                <div class="presets-grid">
                    <button class="preset-btn" data-time="300">5 min</button>
                    <button class="preset-btn" data-time="600">10 min</button>
                    <button class="preset-btn" data-time="900">15 min</button>
                    <button class="preset-btn" data-time="1200">20 min</button>
                    <button class="preset-btn" data-time="1800">30 min</button>
                    <button class="preset-btn" data-time="2700">45 min</button>
                    <button class="preset-btn" data-time="custom">Libre</button>
                    <button class="preset-btn" id="btn-sound-test">Test🔊</button>
                </div>

                <div class="controls">
                    <button class="control-btn btn-secondary" id="btn-reset" aria-label="Réinitialiser">🔄</button>
                    <button class="control-btn" id="btn-play-pause" aria-label="Démarrer / Pause">▶️</button>
                </div>
            </div>
        `;
    }

    init() {
        this.progressBar = this.shadowRoot.getElementById('progress-bar');
        this.timeDisplay = this.shadowRoot.getElementById('time-display');
        this.timeInput = this.shadowRoot.getElementById('time-input');
        this.btnPlayPause = this.shadowRoot.getElementById('btn-play-pause');
        this.btnReset = this.shadowRoot.getElementById('btn-reset');
        this.btnSoundTest = this.shadowRoot.getElementById('btn-sound-test');

        // Configuration initiale du tracé SVG
        this.progressBar.style.strokeDasharray = this.circleLength;
        this.progressBar.style.strokeDashoffset = 0;

        // Événements des Presets
        const presets = this.shadowRoot.querySelectorAll('.preset-btn[data-time]');
        presets.forEach(btn => {
            btn.addEventListener('click', () => {
                const action = btn.getAttribute('data-time');
                if (action === 'custom') {
                    this.enableCustomInput();
                } else {
                    this.setTimer(parseInt(action));
                }
            });
        });

        // Contrôles principaux
        this.btnPlayPause.addEventListener('click', () => this.toggleTimer());
        this.btnReset.addEventListener('click', () => this.resetTimer());
        this.btnSoundTest.addEventListener('click', () => audioSystem.play('buzzer'));

        // Validation de la saisie manuelle de temps libre
        this.timeInput.addEventListener('blur', () => this.validateCustomInput());
        this.timeInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                this.validateCustomInput();
                this.timeInput.blur();
            }
        });

        // Initialisation par défaut à 10 minutes (600s)
        this.setTimer(600);
    }

    setTimer(seconds) {
        this.stopInterval();
        this.totalSeconds = seconds;
        this.remainingSeconds = seconds;
        this.isPaused = true;
        this.updateDisplay();
    }

    enableCustomInput() {
        this.stopInterval();
        this.isPaused = true;
        this.btnPlayPause.textContent = "▶️";
        this.timeInput.style.display = "inline-block";
        this.timeInput.focus();
        this.timeInput.select();
    }

    validateCustomInput() {
        const val = this.timeInput.value.trim();
        const parts = val.split(':');
        let minutes = 0;
        let seconds = 0;

        if (parts.length === 1) {
            minutes = parseInt(parts[0]) || 0;
        } else if (parts.length >= 2) {
            minutes = parseInt(parts[0]) || 0;
            seconds = parseInt(parts[1]) || 0;
        }

        const total = (minutes * 60) + seconds;
        if (total > 0) {
            this.setTimer(total);
        } else {
            this.setTimer(600); // Back to default if invalid input
        }
    }

    toggleTimer() {
        if (this.totalSeconds <= 0) return;

        if (this.isPaused) {
            this.startInterval();
        } else {
            this.stopInterval();
        }
    }

    startInterval() {
        this.isPaused = false;
        this.btnPlayPause.textContent = "⏸️";
        this.timeInput.disabled = true;

        this.intervalId = setInterval(() => {
            this.remainingSeconds--;
            this.updateDisplay();

            if (this.remainingSeconds <= 0) {
                this.timerFinished();
            }
        }, 1000);
    }

    stopInterval() {
        this.isPaused = true;
        this.btnPlayPause.textContent = "▶️";
        this.timeInput.disabled = false;
        if (this.intervalId) {
            clearInterval(this.intervalId);
            this.intervalId = null;
        }
    }

    resetTimer() {
        this.setTimer(this.totalSeconds);
    }

    timerFinished() {
        this.stopInterval();
        audioSystem.play('buzzer');
        
        // Effet de clignotement rouge d'urgence
        let flashes = 0;
        const flashInterval = setInterval(() => {
            this.progressBar.classList.toggle('timer-danger');
            flashes++;
            if (flashes >= 10) {
                clearInterval(flashInterval);
                this.progressBar.classList.remove('timer-danger');
                this.resetTimer();
            }
        }, 300);
    }

    updateDisplay() {
        const mins = Math.floor(this.remainingSeconds / 60);
        const secs = this.remainingSeconds % 60;
        const formattedTime = `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
        
        this.timeInput.value = formattedTime;

        // Calcul du Dashoffset SVG pour le cercle
        const progressPercent = this.totalSeconds > 0 ? this.remainingSeconds / this.totalSeconds : 0;
        const offset = this.circleLength * (1 - progressPercent);
        this.progressBar.style.strokeDashoffset = offset;

        // Gestion de l'alerte de couleur dynamique
        this.progressBar.classList.remove('timer-warning', 'timer-danger');
        if (progressPercent <= 0.15) {
            this.progressBar.classList.add('timer-danger'); // Moins de 15% du temps restant
        } else if (progressPercent <= 0.40) {
            this.progressBar.classList.add('timer-warning'); // Moins de 40%
        }
    }

    disconnectedCallback() {
        this.stopInterval();
    }
}

customElements.define('timer-widget', TimerWidget);