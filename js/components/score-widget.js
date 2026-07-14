/**
 * @fileoverview Widget Compteur de points / Scoreur pour les jeux par équipe.
 * @extends BaseWidget
 */
import { BaseWidget } from './base-widget.js';
import { StorageManager } from '../storage.js';

export class ScoreWidget extends BaseWidget {
    constructor() {
        super();
        this.teams = [];
        this.maxTeams = 4;
        this.defaultColors = ['#3b82f6', '#ef4444', '#10b981', '#f59e0b']; // Bleu, Rouge, Vert, Jaune
    }

    getStyle() {
        return `
            .score-card {
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
            .header-actions {
                display: flex;
                gap: 8px;
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
            
            /* Vues */
            .view {
                display: none;
                flex-direction: column;
                flex-grow: 1;
                height: 100%;
            }
            .view.active {
                display: flex;
            }

            /* --- Vue Principale (Tableau des scores) --- */
            .teams-grid {
                display: grid;
                grid-template-columns: repeat(auto-fit, minmax(100px, 1fr));
                gap: 12px;
                flex-grow: 1;
            }
            .team-col {
                display: flex;
                flex-direction: column;
                align-items: center;
                background: rgba(255, 255, 255, 0.05);
                border-radius: var(--border-radius-medium, 12px);
                padding: 10px;
                border-top: 4px solid; /* Couleur de l'équipe injectée en JS */
                box-shadow: inset 0 2px 10px rgba(0,0,0,0.1);
                transition: transform 0.2s;
            }
            .team-name {
                font-size: 0.9rem;
                font-weight: 700;
                text-align: center;
                margin-bottom: 5px;
                word-break: break-word;
                opacity: 0.9;
            }
            .team-score {
                font-size: 3rem;
                font-weight: 800;
                font-variant-numeric: tabular-nums;
                margin: auto 0;
                text-shadow: 0 2px 10px rgba(0,0,0,0.2);
                transition: transform 0.15s, color 0.15s;
            }
            .score-controls {
                display: flex;
                gap: 8px;
                width: 100%;
                margin-top: 10px;
            }
            .btn-score {
                flex: 1;
                background: rgba(255, 255, 255, 0.1);
                border: 1px solid rgba(255, 255, 255, 0.2);
                color: white;
                font-size: 1.5rem;
                font-weight: bold;
                border-radius: 8px;
                padding: 8px 0;
                cursor: pointer;
                transition: background 0.15s, transform 0.1s;
                touch-action: manipulation;
                display: flex;
                align-items: center;
                justify-content: center;
            }
            .btn-score:hover {
                background: rgba(255, 255, 255, 0.2);
            }
            .btn-score:active {
                transform: scale(0.9);
            }
            .btn-score.add { background: rgba(16, 185, 129, 0.2); border-color: rgba(16, 185, 129, 0.4); }
            .btn-score.add:hover { background: rgba(16, 185, 129, 0.4); }
            .btn-score.sub { background: rgba(239, 68, 68, 0.2); border-color: rgba(239, 68, 68, 0.4); }
            .btn-score.sub:hover { background: rgba(239, 68, 68, 0.4); }

            /* --- Vue Édition (Configuration) --- */
            .edit-list {
                display: flex;
                flex-direction: column;
                gap: 10px;
                flex-grow: 1;
                overflow-y: auto;
                padding-right: 5px;
            }
            .edit-team-row {
                display: flex;
                align-items: center;
                gap: 8px;
                background: rgba(255, 255, 255, 0.05);
                padding: 8px;
                border-radius: 8px;
            }
            .color-picker {
                width: 30px;
                height: 30px;
                border: none;
                border-radius: 4px;
                cursor: pointer;
                padding: 0;
                background: transparent;
            }
            .name-input {
                flex-grow: 1;
                background: rgba(255, 255, 255, 0.05);
                border: 1px solid rgba(255, 255, 255, 0.2);
                border-radius: 4px;
                color: white;
                font-family: var(--font-main);
                padding: 6px 10px;
                font-size: 0.9rem;
            }
            .btn-remove-team {
                background: transparent;
                border: none;
                color: #ef4444;
                font-size: 1.2rem;
                cursor: pointer;
                opacity: 0.7;
            }
            .btn-remove-team:hover { opacity: 1; }
            
            .edit-actions {
                display: flex;
                flex-direction: column;
                gap: 8px;
                margin-top: 15px;
            }
            .btn-secondary {
                background: rgba(255, 255, 255, 0.1);
                color: white;
                border: 1px solid rgba(255, 255, 255, 0.2);
                padding: 10px;
                border-radius: 8px;
                cursor: pointer;
                font-weight: 600;
                transition: background 0.15s;
            }
            .btn-secondary:hover { background: rgba(255, 255, 255, 0.2); }
            .btn-save {
                background: #10b981;
                color: white;
                border: none;
                padding: 10px;
                border-radius: 8px;
                font-weight: 600;
                cursor: pointer;
                transition: filter 0.15s;
            }
            .btn-save:hover { filter: brightness(1.1); }
        `;
    }

    getTemplate() {
        return `
            <div class="score-card">
                <div class="widget-header">
                    <span>🏆 Scores</span>
                    <div class="header-actions">
                        <button class="btn-icon" id="btn-reset-scores" aria-label="Remettre à zéro">🔄</button>
                        <button class="btn-icon" id="btn-toggle-edit" aria-label="Configurer les équipes">⚙️</button>
                    </div>
                </div>

                <div class="view active" id="view-main">
                    <div class="teams-grid" id="teams-container">
                        </div>
                </div>

                <div class="view" id="view-edit">
                    <div class="edit-list" id="edit-teams-container">
                        </div>
                    <div class="edit-actions">
                        <button class="btn-secondary" id="btn-add-team">+ Ajouter une équipe</button>
                        <button class="btn-save" id="btn-save-config">Enregistrer</button>
                    </div>
                </div>
            </div>
        `;
    }

    init() {
        this.viewMain = this.shadowRoot.getElementById('view-main');
        this.viewEdit = this.shadowRoot.getElementById('view-edit');
        this.btnToggleEdit = this.shadowRoot.getElementById('btn-toggle-edit');
        this.btnResetScores = this.shadowRoot.getElementById('btn-reset-scores');
        
        this.teamsContainer = this.shadowRoot.getElementById('teams-container');
        this.editTeamsContainer = this.shadowRoot.getElementById('edit-teams-container');
        
        this.btnAddTeam = this.shadowRoot.getElementById('btn-add-team');
        this.btnSaveConfig = this.shadowRoot.getElementById('btn-save-config');

        this.loadData();

        this.btnToggleEdit.addEventListener('click', () => this.toggleView());
        this.btnResetScores.addEventListener('click', () => this.resetScores());
        this.btnAddTeam.addEventListener('click', () => this.addTeamRow());
        this.btnSaveConfig.addEventListener('click', () => this.saveConfig());
    }

    loadData() {
        const defaultTeams = [
            { id: 1, name: 'Équipe 1', score: 0, color: '#3b82f6' },
            { id: 2, name: 'Équipe 2', score: 0, color: '#ef4444' }
        ];
        this.teams = StorageManager.get('score_teams', defaultTeams);
        this.renderMainView();
    }

    // --- LOGIQUE VUE PRINCIPALE --- //

    renderMainView() {
        this.teamsContainer.innerHTML = '';
        
        this.teams.forEach(team => {
            const col = document.createElement('div');
            col.className = 'team-col';
            col.style.borderColor = team.color;

            col.innerHTML = `
                <div class="team-name" style="color: ${team.color}">${team.name}</div>
                <div class="team-score" id="score-val-${team.id}">${team.score}</div>
                <div class="score-controls">
                    <button class="btn-score sub" aria-label="Retirer 1 point">-</button>
                    <button class="btn-score add" aria-label="Ajouter 1 point">+</button>
                </div>
            `;

            // Événements d'ajout/retrait de points
            const btnSub = col.querySelector('.sub');
            const btnAdd = col.querySelector('.add');
            const scoreDisplay = col.querySelector(`#score-val-${team.id}`);

            btnSub.addEventListener('click', () => this.updateScore(team.id, -1, scoreDisplay));
            btnAdd.addEventListener('click', () => this.updateScore(team.id, 1, scoreDisplay));

            this.teamsContainer.appendChild(col);
        });
    }

    updateScore(teamId, delta, scoreElement) {
        const team = this.teams.find(t => t.id === teamId);
        if (team) {
            team.score += delta;
            scoreElement.textContent = team.score;
            
            // Effet visuel au tap
            scoreElement.style.transform = delta > 0 ? 'scale(1.2)' : 'scale(0.8)';
            scoreElement.style.color = delta > 0 ? '#10b981' : '#ef4444';
            setTimeout(() => {
                scoreElement.style.transform = '';
                scoreElement.style.color = '';
            }, 150);

            StorageManager.save('score_teams', this.teams);
        }
    }

    resetScores() {
        if(confirm("Remettre tous les scores à zéro ?")) {
            this.teams.forEach(t => t.score = 0);
            StorageManager.save('score_teams', this.teams);
            this.renderMainView();
        }
    }

    // --- LOGIQUE VUE ÉDITION --- //

    renderEditView() {
        this.editTeamsContainer.innerHTML = '';
        this.teams.forEach(team => this.createEditRow(team));
        this.updateAddButtonState();
    }

    createEditRow(team) {
        const row = document.createElement('div');
        row.className = 'edit-team-row';
        row.dataset.id = team.id;

        row.innerHTML = `
            <input type="color" class="color-picker" value="${team.color}">
            <input type="text" class="name-input" value="${team.name}" placeholder="Nom de l'équipe">
            <button class="btn-remove-team" aria-label="Supprimer l'équipe">✕</button>
        `;

        row.querySelector('.btn-remove-team').addEventListener('click', () => {
            row.remove();
            this.updateAddButtonState();
        });

        this.editTeamsContainer.appendChild(row);
    }

    addTeamRow() {
        const currentRows = this.editTeamsContainer.querySelectorAll('.edit-team-row').length;
        if (currentRows >= this.maxTeams) return;

        const newId = Date.now();
        const nextColor = this.defaultColors[currentRows % this.defaultColors.length];
        
        const newTeam = { id: newId, name: `Équipe ${currentRows + 1}`, score: 0, color: nextColor };
        this.createEditRow(newTeam);
        this.updateAddButtonState();
    }

    updateAddButtonState() {
        const currentRows = this.editTeamsContainer.querySelectorAll('.edit-team-row').length;
        this.btnAddTeam.style.display = currentRows >= this.maxTeams ? 'none' : 'block';
    }

    saveConfig() {
        const rows = this.editTeamsContainer.querySelectorAll('.edit-team-row');
        if (rows.length < 1) {
            alert("Vous devez avoir au moins une équipe.");
            return;
        }

        const newTeams = [];
        rows.forEach(row => {
            const id = parseInt(row.dataset.id);
            const color = row.querySelector('.color-picker').value;
            const name = row.querySelector('.name-input').value.trim() || 'Équipe';
            
            // Conserver le score existant si l'équipe existait déjà
            const existingTeam = this.teams.find(t => t.id === id);
            const score = existingTeam ? existingTeam.score : 0;

            newTeams.push({ id, name, score, color });
        });

        this.teams = newTeams;
        StorageManager.save('score_teams', this.teams);
        
        this.renderMainView();
        this.toggleView(); // Fermer la vue d'édition
    }

    toggleView() {
        if (this.viewMain.classList.contains('active')) {
            this.viewMain.classList.remove('active');
            this.viewEdit.classList.add('active');
            this.renderEditView();
        } else {
            this.viewEdit.classList.remove('active');
            this.viewMain.classList.add('active');
        }
    }
}

customElements.define('score-widget', ScoreWidget);