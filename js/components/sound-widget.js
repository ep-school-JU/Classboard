/**
 * @fileoverview Widget de contrôle des signaux sonores avec raccourcis clavier.
 * @extends BaseWidget
 */
import { BaseWidget } from './base-widget.js';
import { audioSystem } from '../audio.js';

export class SoundWidget extends BaseWidget {
    constructor() {
        super();
        this.boundKeyDown = this.handleKeyDown.bind(this);
    }

    getStyle() {
        return `
            .sound-card {
                display: flex;
                flex-direction: column;
                justify-content: space-between;
                height: 100%;
                color: var(--text-primary, #ffffff);
            }
            .widget-title {
                font-size: 1rem;
                font-weight: 700;
                margin-bottom: 0.75rem;
                opacity: 0.9;
                text-transform: uppercase;
                letter-spacing: 0.5px;
            }
            .sounds-grid {
                display: grid;
                grid-template-columns: repeat(2, 1fr);
                gap: 10px;
                flex-grow: 1;
            }
            .sound-btn {
                background: rgba(255, 255, 255, 0.08);
                border: 1px solid rgba(255, 255, 255, 0.15);
                border-radius: 12px;
                color: var(--text-primary, #ffffff);
                font-family: 'Inter', sans-serif;
                font-size: 0.95rem;
                font-weight: 600;
                cursor: pointer;
                display: flex;
                flex-direction: column;
                align-items: center;
                justify-content: center;
                padding: 0.5rem;
                gap: 4px;
                transition: background 0.15s, transform 0.1s, border-color 0.15s;
                touch-action: manipulation;
            }
            .sound-btn:hover {
                background: rgba(255, 255, 255, 0.15);
                border-color: rgba(255, 255, 255, 0.3);
            }
            .sound-btn:active {
                transform: scale(0.95);
                background: rgba(255, 255, 255, 0.25);
            }
            .sound-icon {
                font-size: 1.5rem;
            }
            .shortcut-badge {
                font-size: 0.7rem;
                background: rgba(0, 0, 0, 0.3);
                padding: 1px 6px;
                border-radius: 4px;
                opacity: 0.5;
                margin-top: 2px;
            }
        `;
    }

    getTemplate() {
        return `
            <div class="sound-card">
                <div class="widget-title">Signaux Sonores</div>
                <div class="sounds-grid">
                    <button class="sound-btn" data-sound="silence" aria-label="Lancer le signal Silence">
                        <span class="sound-icon">🤫</span>
                        <span>Silence</span>
                        <span class="shortcut-badge">Touche 1</span>
                    </button>
                    <button class="sound-btn" data-sound="rangement" aria-label="Lancer le signal Rangement">
                        <span class="sound-icon">📦</span>
                        <span>Rangement</span>
                        <span class="shortcut-badge">Touche 2</span>
                    </button>
                    <button class="sound-btn" data-sound="retour" aria-label="Lancer le signal Retour à sa place">
                        <span class="sound-icon">🪑</span>
                        <span>À sa place</span>
                        <span class="shortcut-badge">Touche 3</span>
                    </button>
                    <button class="sound-btn" data-sound="buzzer" aria-label="Lancer le signal Buzzer">
                        <span class="sound-icon">🔔</span>
                        <span>Buzzer</span>
                        <span class="shortcut-badge">Touche 4</span>
                    </button>
                </div>
            </div>
        `;
    }

    init() {
        // Enregistrement des clics sur les boutons tactiles
        const buttons = this.shadowRoot.querySelectorAll('.sound-btn');
        buttons.forEach(btn => {
            btn.addEventListener('click', () => {
                const soundKey = btn.getAttribute('data-sound');
                audioSystem.play(soundKey);
            });
        });

        // Activation des raccourcis clavier physiques
        window.addEventListener('keydown', this.boundKeyDown);
    }

    /**
     * Intercepte les touches clavier numériques
     */
    handleKeyDown(e) {
        // Ignorer si l'enseignant est en train d'écrire dans un champ texte ou un bloc note
        if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA' || e.target.isContentEditable) {
            return;
        }

        switch (e.key) {
            case '1':
                audioSystem.play('silence');
                this._animateButtonVisual('silence');
                break;
            case '2':
                audioSystem.play('rangement');
                this._animateButtonVisual('rangement');
                break;
            case '3':
                audioSystem.play('retour');
                this._animateButtonVisual('retour');
                break;
            case '4':
                audioSystem.play('buzzer');
                this._animateButtonVisual('buzzer');
                break;
        }
    }

    /**
     * Simule visuellement l'appui sur un bouton lorsqu'on utilise un raccourci clavier
     */
    _animateButtonVisual(soundKey) {
        const btn = this.shadowRoot.querySelector(`[data-sound="${soundKey}"]`);
        if (btn) {
            btn.style.transform = 'scale(0.95)';
            btn.style.background = 'rgba(255, 255, 255, 0.25)';
            setTimeout(() => {
                btn.style.transform = '';
                btn.style.background = '';
            }, 150);
        }
    }

    disconnectedCallback() {
        window.removeEventListener('keydown', this.boundKeyDown);
    }
}

customElements.define('sound-widget', SoundWidget);