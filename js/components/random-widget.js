/**
 * @fileoverview Widget Sélecteur Aléatoire avec choix du mode de tirage (avec/sans remise).
 * @extends BaseWidget
 */
import { BaseWidget } from './base-widget.js';
import { StorageManager } from '../storage.js';
import { audioSystem } from '../audio.js';

export class RandomWidget extends BaseWidget {
    constructor() {
        super();
        this.names = [];
        this.remainingNames = [];
        this.isAnimating = false;
        this.removeDrawn = true; // Mode par défaut : ne pas réinterroger
    }

    getStyle() {
        return `
            .random-card {
                display: flex;
                flex-direction: column;
                height: 100%;
                color: var(--text-primary, #ffffff);
                font-family: var(--font-main);
                padding: 0.2rem;
                position: relative;
            }
            .widget-header {
                font-size: 0.95rem;
                font-weight: 700;
                text-transform: uppercase;
                letter-spacing: 0.5px;
                opacity: 0.9;
                margin-bottom: 0.75rem;
                display: flex;
                justify-content: space-between;
                align-items: center;
            }
            .btn-icon {
                background: transparent;
                border: none;
                color: var(--text-primary);
                font-size: 1.2rem;
                cursor: pointer;
                opacity: 0.6;
                transition: opacity 0.2s, transform 0.2s;
                touch-action: manipulation;
            }
            .btn-icon:hover {
                opacity: 1;
                transform: scale(1.1);
            }
            
            /* Vues (Main / Edit) */
            .view {
                display: none;
                flex-direction: column;
                flex-grow: 1;
                height: 100%;
            }
            .view.active {
                display: flex;
            }

            /* --- Vue Principale --- */
            .result-display {
                flex-grow: 1;
                display: flex;
                align-items: center;
                justify-content: center;
                font-size: 2.5rem;
                font-weight: 800;
                text-align: center;
                word-break: break-word;
                background: rgba(0, 0, 0, 0.2);
                border-radius: var(--border-radius-medium, 12px);
                margin-bottom: 15px;
                box-shadow: inset 0 4px 10px rgba(0,0,0,0.1);
                transition: color 0.3s, transform 0.1s;
            }
            .result-display.winner {
                color: var(--accent-color, #6366f1);
                transform: scale(1.05);
                text-shadow: 0 0 20px rgba(99, 102, 241, 0.4);
            }
            .controls {
                display: flex;
                flex-direction: column;
                gap: 8px;
            }
            .btn-draw {
                background: var(--accent-color, #6366f1);
                color: white;
                border: none;
                padding: 12px;
                border-radius: var(--border-radius-small, 8px);
                font-size: 1.1rem;
                font-weight: 700;
                cursor: pointer;
                transition: transform 0.15s, filter 0.15s;
                touch-action: manipulation;
            }
            .btn-draw:hover { filter: brightness(1.1); }
            .btn-draw:active { transform: scale(0.96); }
            .btn-draw:disabled {
                background: rgba(255,255,255,0.1);
                color: rgba(255,255,255,0.3);
                cursor: not-allowed;
            }
            .stats {
                font-size: 0.8rem;
                text-align: center;
                opacity: 0.6;
            }

            /* --- Vue Édition --- */
            .edit-textarea {
                flex-grow: 1;
                background: rgba(255, 255, 255, 0.05);
                border: 1px solid rgba(255, 255, 255, 0.2);
                border-radius: var(--border-radius-small, 8px);
                color: white;
                font-family: var(--font-main);
                padding: 10px;
                resize: none;
                margin-bottom: 10px;
                font-size: 0.9rem;
            }
            .edit-textarea:focus {
                outline: none;
                border-color: var(--accent-color, #6366f1);
            }
            .setting-row {
                display: flex;
                align-items: center;
                gap: 8px;
                font-size: 0.85rem;
                margin-bottom: 12px;
                opacity: 0.9;
                cursor: pointer;
            }
            .setting-row input[type="checkbox"] {
                accent-color: var(--accent-color, #6366f1);
                width: 16px;
                height: 16px;
                cursor: pointer;
            }
            .btn-save {
                background: #10b981;
                color: white;
                border: none;
                padding: 10px;
                border-radius: var(--border-radius-small, 8px);
                font-weight: 600;
                cursor: pointer;
                transition: filter 0.15s;
            }
            .btn-save:hover { filter: brightness(1.1); }
        `;
    }

    getTemplate() {
        return `
            <div class="random-card">
                <div class="widget-header">
                    <span>🎲 Tirage au sort</span>
                    <button class="btn-icon" id="btn-toggle-edit" aria-label="Modifier la configuration">⚙️</button>
                </div>

                <div class="view active" id="view-main">
                    <div class="result-display" id="result">Prêt ?</div>
                    <div class="controls">
                        <button class="btn-draw" id="btn-draw">Tirer un élève</button>
                        <div class="stats" id="stats-text">...</div>
                    </div>
                </div>

                <div class="view" id="view-edit">
                    <div style="font-size: 0.8rem; margin-bottom: 8px; opacity: 0.8;">
                        Liste des prénoms (un par ligne ou virgules) :
                    </div>
                    <textarea class="edit-textarea" id="names-input" placeholder="Ex: Lucas, Emma, Hugo..."></textarea>
                    
                    <label class="setting-row">
                        <input type="checkbox" id="cb-remove-drawn">
                        Ne pas réinterroger les élèves déjà tirés
                    </label>

                    <button class="btn-save" id="btn-save">Enregistrer</button>
                </div>
            </div>
        `;
    }

    init() {
        this.viewMain = this.shadowRoot.getElementById('view-main');
        this.viewEdit = this.shadowRoot.getElementById('view-edit');
        this.btnToggleEdit = this.shadowRoot.getElementById('btn-toggle-edit');
        
        this.resultDisplay = this.shadowRoot.getElementById('result');
        this.btnDraw = this.shadowRoot.getElementById('btn-draw');
        this.statsText = this.shadowRoot.getElementById('stats-text');
        
        this.namesInput = this.shadowRoot.getElementById('names-input');
        this.cbRemoveDrawn = this.shadowRoot.getElementById('cb-remove-drawn');
        this.btnSave = this.shadowRoot.getElementById('btn-save');

        this.loadData();

        this.btnDraw.addEventListener('click', () => this.drawName());
        this.btnToggleEdit.addEventListener('click', () => this.toggleView());
        this.btnSave.addEventListener('click', () => this.saveData());
    }

    loadData() {
        const defaultNames = ["Amine", "Chloé", "Lucas", "Léa", "Thomas"];
        this.names = StorageManager.get('random_names', defaultNames);
        this.remainingNames = StorageManager.get('random_remaining', [...this.names]);
        
        // Chargement du mode choisi (par défaut activé)
        this.removeDrawn = StorageManager.get('random_mode_remove', true);
        
        this.namesInput.value = this.names.join('\n');
        this.cbRemoveDrawn.checked = this.removeDrawn;
        
        this.updateStats();
    }

    saveData() {
        const rawText = this.namesInput.value;
        const parsedNames = rawText.split(/[\n,]+/).map(n => n.trim()).filter(n => n.length > 0);

        if (parsedNames.length === 0) {
            alert("La liste ne peut pas être vide.");
            return;
        }

        this.names = parsedNames;
        this.remainingNames = [...this.names]; 
        
        this.removeDrawn = this.cbRemoveDrawn.checked;

        StorageManager.save('random_names', this.names);
        StorageManager.save('random_remaining', this.remainingNames);
        StorageManager.save('random_mode_remove', this.removeDrawn);

        this.resultDisplay.textContent = "Prêt ?";
        this.resultDisplay.classList.remove('winner');
        
        this.updateStats();
        this.toggleView();
    }

    drawName() {
        if (this.isAnimating) return;
        
        // Si le mode "sans remise" est actif et que la liste est vide, on recommence un cycle
        if (this.removeDrawn && this.remainingNames.length === 0) {
            this.remainingNames = [...this.names];
            StorageManager.save('random_remaining', this.remainingNames);
            this.updateStats();
        }

        this.isAnimating = true;
        this.btnDraw.disabled = true;
        this.resultDisplay.classList.remove('winner');

        // On pioche toujours dans remainingNames, mais si removeDrawn est faux, 
        // remainingNames reste toujours égal à names.
        const pool = this.removeDrawn ? this.remainingNames : this.names;
        const randomIndex = Math.floor(Math.random() * pool.length);
        const winner = pool[randomIndex];
        
        // Retrait de l'élève UNIQUEMENT si le mode est coché
        if (this.removeDrawn) {
            this.remainingNames.splice(randomIndex, 1);
            StorageManager.save('random_remaining', this.remainingNames);
        }

        let ticks = 0;
        const maxTicks = 15; 
        const speed = 60; 

        const interval = setInterval(() => {
            this.resultDisplay.textContent = this.names[Math.floor(Math.random() * this.names.length)];
            ticks++;

            if (ticks >= maxTicks) {
                clearInterval(interval);
                this.resultDisplay.textContent = winner;
                this.resultDisplay.classList.add('winner');
                audioSystem.play('tirage');
                
                this.updateStats();
                this.isAnimating = false;
                this.btnDraw.disabled = false;
            }
        }, speed);
    }

    updateStats() {
        if (this.removeDrawn) {
            this.statsText.textContent = `${this.remainingNames.length} restants / ${this.names.length}`;
            if (this.remainingNames.length === 0) {
                this.btnDraw.textContent = "🔄 Réinitialiser et Tirer";
            } else {
                this.btnDraw.textContent = "Tirer un élève";
            }
        } else {
            this.statsText.textContent = `${this.names.length} élèves inscrits (Doublons possibles)`;
            this.btnDraw.textContent = "Tirer un élève";
        }
    }

    toggleView() {
        if (this.viewMain.classList.contains('active')) {
            this.viewMain.classList.remove('active');
            this.viewEdit.classList.add('active');
            this.namesInput.value = this.names.join('\n');
            this.cbRemoveDrawn.checked = this.removeDrawn;
        } else {
            this.viewEdit.classList.remove('active');
            this.viewMain.classList.add('active');
        }
    }
}

customElements.define('random-widget', RandomWidget);