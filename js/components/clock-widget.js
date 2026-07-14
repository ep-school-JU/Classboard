/**
 * @fileoverview Widget Horloge et Date dynamiques.
 * @extends BaseWidget
 */
import { BaseWidget } from './base-widget.js';

export class ClockWidget extends BaseWidget {
    constructor() {
        super();
        this.timerId = null;
    }

    getStyle() {
        return `
            .clock-card {
                display: flex;
                flex-direction: column;
                justify-content: center;
                align-items: center;
                height: 100%;
                font-family: 'Inter', sans-serif;
                color: var(--text-primary, #ffffff);
                text-align: center;
            }
            .time-display {
                font-size: 3.5rem;
                font-weight: 800;
                letter-spacing: -1px;
                line-height: 1;
                margin-bottom: 0.5rem;
                text-shadow: 0 4px 12px rgba(0,0,0,0.1);
            }
            .time-seconds {
                font-size: 2rem;
                opacity: 0.6;
                font-weight: 400;
            }
            .date-display {
                font-size: 1.1rem;
                font-weight: 500;
                opacity: 0.8;
                text-transform: capitalize;
            }
        `;
    }

    getTemplate() {
        return `
            <div class="clock-card">
                <div class="time-display" id="time">00:00<span class="time-seconds">:00</span></div>
                <div class="date-display" id="date">Chargement...</div>
            </div>
        `;
    }

    init() {
        this.timeEl = this.shadowRoot.getElementById('time');
        this.dateEl = this.shadowRoot.getElementById('date');

        this.updateClock();
        this.timerId = setInterval(() => this.updateClock(), 1000);
    }

    updateClock() {
        const now = new Date();

        // Heures & Minutes
        const hours = String(now.getHours()).padStart(2, '0');
        const minutes = String(now.getMinutes()).padStart(2, '0');
        const seconds = String(now.getSeconds()).padStart(2, '0');

        // Affichage de l'heure
        this.timeEl.innerHTML = `${hours}:${minutes}<span class="time-seconds">:${seconds}</span>`;

        // Affichage de la date en français
        const options = { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' };
        this.dateEl.textContent = now.toLocaleDateString('fr-FR', options);
    }

    /**
     * Cycle de vie de l'élément : se déclenche quand le composant est retiré du DOM.
     * Crucial pour éviter les fuites de mémoire (Memory leaks).
     */
    disconnectedCallback() {
        if (this.timerId) {
            clearInterval(this.timerId);
        }
    }
}

customElements.define('clock-widget', ClockWidget);