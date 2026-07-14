/**
 * @fileoverview Widget Générateur d'Équipes aléatoires basé sur la liste de la classe.
 * @extends BaseWidget
 */
import { BaseWidget } from './base-widget.js';
import { StorageManager } from '../storage.js';
import { audioSystem } from '../audio.js';

export class TeamBuilderWidget extends BaseWidget {
    constructor() {
        super();
        this.names = [];
        this.numberOfTeams = 3;
    }

    getStyle() {
        return `
            .team-builder-card {
                display: flex;
                flex-direction: column;
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
            .setup-bar {
                display: flex;
                align-items: center;
                gap: 10px;
                margin-bottom: 12px;
                background: rgba(255, 255, 255, 0.05);
                padding: 6px 10px;
                border-radius: var(--border-radius-small, 8px);
            }
            .setup-label {
                font-size: 0.8rem;
                opacity: 0.8;
                white-space: nowrap;
            }
            .team-select {
                background: rgba(0, 0, 0, 0.2);
                border: 1px solid rgba(255, 255, 255, 0.15);
                color: white;
                border-radius: 6px;
                padding: 4px 8px;
                font-size: 0.9rem;
                font-weight: bold;
                cursor: pointer;
            }
            .btn-generate {
                margin-left: auto;
                background: var(--accent-color, #6366f1);
                color: white;
                border: none;
                padding: 6px 12px;
                border-radius: 6px;
                font-size: 0.8rem;
                font-weight: 700;
                cursor: pointer;
                transition: transform 0.15s, filter 0.15s;
            }
            .btn-generate:hover { filter: brightness(1.1); }
            .btn-generate:active { transform: scale(0.95); }

            /* Affichage des groupes générés */
            .teams-wrapper {
                flex-grow: 1;
                display: grid;
                grid-template-columns: repeat(auto-fit, minmax(110px, 1fr));
                gap: 10px;
                overflow-y: auto;
                padding-right: 4px;
            }
            .team-box {
                background: rgba(255, 255, 255, 0.04);
                border: 1px solid rgba(255, 255, 255, 0.1);
                border-radius: var(--border-radius-medium, 10px);
                padding: 8px;
                display: flex;
                flex-direction: column;
                min-height: 80px;
                box-shadow: inset 0 2px 5px rgba(0,0,0,0.1);
            }
            .team-box-title {
                font-size: 0.8rem;
                font-weight: 800;
                text-transform: uppercase;
                margin-bottom: 6px;
                padding-bottom: 4px;
                border-bottom: 1px solid rgba(255, 255, 255, 0.1);
                text-align: center;
            }
            .member-list {
                display: flex;
                flex-direction: column;
                gap: 4px;
                font-size: 0.85rem;
            }
            .member-item {
                background: rgba(255, 255, 255, 0.05);
                padding: 3px 6px;
                border-radius: 4px;
                text-align: center;
                word-break: break-word;
                animation: pop-in 0.3s cubic-bezier(0.18, 0.89, 0.32, 1.28) both;
            }
            
            .no-names-alert {
                display: flex;
                align-items: center;
                justify-content: center;
                height: 100%;
                font-size: 0.85rem;
                opacity: 0.6;
                text-align: center;
            }

            @keyframes pop-in {
                from { transform: scale(0.8); opacity: 0; }
                to { transform: scale(1); opacity: 1; }
            }
        `;
    }

    getTemplate() {
        return `
            <div class="team-builder-card">
                <div class="widget-header">👥 Groupes Aléatoires</div>
                
                <div class="setup-bar">
                    <span class="setup-label">Nombre de groupes :</span>
                    <select class="team-select" id="team-select-num">
                        <option value="2">2</option>
                        <option value="3" selected>3</option>
                        <option value="4">4</option>
                        <option value="5">5</option>
                        <option value="6">6</option>
                        <option value="8">8</option>
                    </select>
                    <button class="btn-generate" id="btn-generate-teams">Générer 🎲</button>
                </div>

                <div class="teams-wrapper" id="teams-grid-container">
                    </div>
            </div>
        `;
    }

    init() {
        this.selectNum = this.shadowRoot.getElementById('team-select-num');
        this.btnGenerate = this.shadowRoot.getElementById('btn-generate-teams');
        this.gridContainer = this.shadowRoot.getElementById('teams-grid-container');

        this.btnGenerate.addEventListener('click', () => this.generateTeams());

        // Premier affichage à blanc
        this.renderEmptyState();
    }

    renderEmptyState() {
        this.gridContainer.innerHTML = `
            <div class="no-names-alert">
                Configurez la liste dans le widget "Tirage au sort" ⚙️,<br>puis cliquez sur "Générer" !
            </div>
        `;
    }

    generateTeams() {
        // On récupère la liste actuelle du Tirage au sort
        const defaultNames = ["Amine", "Chloé", "Lucas", "Léa", "Thomas", "Emma", "Hugo"];
        this.names = StorageManager.get('random_names', defaultNames);
        this.numberOfTeams = parseInt(this.selectNum.value);

        if (this.names.length < this.numberOfTeams) {
            alert(`Vous n'avez pas assez d'élèves (${this.names.length}) pour créer ${this.numberOfTeams} groupes !`);
            return;
        }

        // 1. Mélange de la liste d'élèves (Algorithme de Fisher-Yates)
        const shuffled = [...this.names];
        for (let i = shuffled.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
        }

        // 2. Création des groupes vides
        const teamsList = Array.from({ length: this.numberOfTeams }, (_, i) => ({
            name: `Groupe ${i + 1}`,
            members: [],
            color: this.getGroupColor(i)
        }));

        // 3. Répartition équitable des élèves mélangés dans les groupes
        shuffled.forEach((name, idx) => {
            const targetTeam = idx % this.numberOfTeams;
            teamsList[targetTeam].members.push(name);
        });

        // 4. Rendu visuel
        audioSystem.play('retour'); // Petit effet sonore d'ambiance
        this.renderTeams(teamsList);
    }

    renderTeams(teamsList) {
        this.gridContainer.innerHTML = '';

        teamsList.forEach((team, teamIdx) => {
            const teamBox = document.createElement('div');
            teamBox.className = 'team-box';
            
            // Un petit accent de couleur pour différencier les groupes
            teamBox.style.borderTop = `3px solid ${team.color}`;

            const membersHTML = team.members.map((name, mIdx) => {
                // Délai d'apparition progressif pour un effet visuel sympa à l'écran
                const delay = (teamIdx * 0.1) + (mIdx * 0.05);
                return `<div class="member-item" style="animation-delay: ${delay}s">${name}</div>`;
            }).join('');

            teamBox.innerHTML = `
                <div class="team-box-title" style="color: ${team.color}">${team.name}</div>
                <div class="member-list">
                    ${membersHTML}
                </div>
            `;

            this.gridContainer.appendChild(teamBox);
        });
    }

    getGroupColor(index) {
        const colors = ['#3b82f6', '#ef4444', '#10b981', '#f59e0b', '#8b5cf6', '#ec4899', '#14b8a6', '#f97316'];
        return colors[index % colors.length];
    }
}

customElements.define('team-builder-widget', TeamBuilderWidget);