/**
 * @fileoverview Widget Devoirs interactif pour le TBI.
 * @extends BaseWidget
 */
import { BaseWidget } from './base-widget.js';
import { StorageManager } from '../storage.js';

export class HomeworkWidget extends BaseWidget {
    constructor() {
        super();
        this.homeworkList = [];
    }

    getStyle() {
        return `
            .homework-card {
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
                margin-bottom: 0.75rem;
                display: flex;
                justify-content: space-between;
                align-items: center;
            }
            .add-btn {
                background: var(--accent-color, #6366f1);
                border: none;
                color: white;
                border-radius: 50%;
                width: 28px;
                height: 28px;
                font-size: 1.1rem;
                cursor: pointer;
                display: flex;
                align-items: center;
                justify-content: center;
                transition: transform 0.15s;
                touch-action: manipulation;
            }
            .add-btn:hover {
                transform: scale(1.1);
            }
            .homework-list {
                display: flex;
                flex-direction: column;
                gap: 10px;
                overflow-y: auto;
                flex-grow: 1;
                padding-right: 4px;
            }
            .homework-item {
                background: rgba(255, 255, 255, 0.04);
                border: 1px solid rgba(255, 255, 255, 0.08);
                border-radius: var(--border-radius-medium, 12px);
                padding: 12px;
                display: flex;
                justify-content: space-between;
                align-items: flex-start;
                transition: all 0.2s ease;
                animation: fadeIn 0.3s ease-out;
            }
            .homework-item:hover {
                background: rgba(255, 255, 255, 0.08);
            }
            .homework-content {
                display: flex;
                flex-direction: column;
                gap: 4px;
                flex-grow: 1;
                margin-right: 12px;
            }
            .homework-subject {
                font-size: 0.8rem;
                font-weight: 700;
                text-transform: uppercase;
                color: var(--accent-color, #6366f1);
                letter-spacing: 0.5px;
            }
            .homework-text {
                font-size: 1rem;
                font-weight: 500;
                line-height: 1.4;
            }
            .homework-date {
                font-size: 0.75rem;
                opacity: 0.5;
                font-weight: 600;
            }
            .delete-btn {
                background: transparent;
                border: none;
                color: #ef4444;
                font-size: 1.1rem;
                cursor: pointer;
                opacity: 0.4;
                transition: opacity 0.2s, transform 0.1s;
                padding: 4px;
                touch-action: manipulation;
            }
            .homework-item:hover .delete-btn {
                opacity: 1;
            }
            .delete-btn:hover {
                transform: scale(1.2);
            }
            /* Formulaire de saisie rapide */
            .input-form {
                background: rgba(15, 16, 21, 0.95);
                border: 1px solid var(--border-color, rgba(255, 255, 255, 0.1));
                border-radius: var(--border-radius-large, 16px);
                position: absolute;
                top: 10%;
                left: 5%;
                width: 90%;
                padding: 16px;
                box-sizing: border-box;
                display: none;
                flex-direction: column;
                gap: 12px;
                z-index: 200;
                box-shadow: var(--shadow-heavy);
            }
            .input-form.active {
                display: flex;
            }
            .input-form input, .input-form select {
                background: rgba(255, 255, 255, 0.06);
                border: 1px solid rgba(255, 255, 255, 0.15);
                border-radius: var(--border-radius-small, 8px);
                color: white;
                font-family: var(--font-main);
                padding: 10px;
                outline: none;
                font-size: 0.95rem;
            }
            .form-actions {
                display: flex;
                gap: 8px;
                justify-content: flex-end;
            }
            .form-btn {
                padding: 8px 16px;
                border-radius: var(--border-radius-small, 8px);
                font-family: var(--font-main);
                font-size: 0.9rem;
                cursor: pointer;
                border: none;
            }
            .form-btn.submit {
                background: var(--accent-color, #6366f1);
                color: white;
            }
            .form-btn.cancel {
                background: rgba(255, 255, 255, 0.1);
                color: white;
            }
            .empty-state {
                display: flex;
                align-items: center;
                justify-content: center;
                height: 100%;
                opacity: 0.4;
                font-size: 0.9rem;
                font-style: italic;
            }
            @keyframes fadeIn {
                from { opacity: 0; transform: translateY(10px); }
                to { opacity: 1; transform: translateY(0); }
            }
        `;
    }

    getTemplate() {
        return `
            <div class="homework-card">
                <div class="widget-header">
                    <span>📝 Devoirs</span>
                    <button class="add-btn" id="btn-add-hw" aria-label="Ajouter un devoir">+</button>
                </div>
                
                <div class="homework-list" id="homework-list">
                    </div>

                <div class="input-form" id="homework-form">
                    <input type="text" id="hw-subject" placeholder="Matière (ex: Mathématiques, Lecture...)" required>
                    <input type="text" id="hw-text" placeholder="Travail à faire..." required>
                    <input type="text" id="hw-date" placeholder="Pour le (ex: Lundi 15 mars...)" required>
                    <div class="form-actions">
                        <button class="form-btn cancel" id="btn-cancel-hw">Annuler</button>
                        <button class="form-btn submit" id="btn-submit-hw">Ajouter</button>
                    </div>
                </div>
            </div>
        `;
    }

    init() {
        this.listEl = this.shadowRoot.getElementById('homework-list');
        this.formEl = this.shadowRoot.getElementById('homework-form');
        this.btnAdd = this.shadowRoot.getElementById('btn-add-hw');
        this.btnCancel = this.shadowRoot.getElementById('btn-cancel-hw');
        this.btnSubmit = this.shadowRoot.getElementById('btn-submit-hw');

        // Inputs
        this.inputSubject = this.shadowRoot.getElementById('hw-subject');
        this.inputText = this.shadowRoot.getElementById('hw-text');
        this.inputDate = this.shadowRoot.getElementById('hw-date');

        // Charger les devoirs sauvegardés
        this.homeworkList = StorageManager.get('homework_list', [
            { id: 1, subject: "Mathématiques", text: "Faire les exercices 3 et 4 page 42", date: "Pour demain" },
            { id: 2, subject: "Orthographe", text: "Apprendre la liste de mots n°12", date: "Pour vendredi" }
        ]);

        this.renderHomeworks();

        // Événements
        this.btnAdd.addEventListener('click', () => this.showForm());
        this.btnCancel.addEventListener('click', () => this.hideForm());
        this.btnSubmit.addEventListener('click', () => this.addHomework());

        // Soumission par "Entrée" sur le dernier champ
        this.inputDate.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') this.addHomework();
        });
    }

    renderHomeworks() {
        this.listEl.innerHTML = '';

        if (this.homeworkList.length === 0) {
            this.listEl.innerHTML = `<div class="empty-state">Aucun devoir programmé</div>`;
            return;
        }

        this.homeworkList.forEach(hw => {
            const item = document.createElement('div');
            item.className = 'homework-item';
            item.innerHTML = `
                <div class="homework-content">
                    <span class="homework-subject">${hw.subject}</span>
                    <span class="homework-text">${hw.text}</span>
                    <span class="homework-date">📅 ${hw.date}</span>
                </div>
                <button class="delete-btn" aria-label="Supprimer le devoir">🗑️</button>
            `;

            // Action de suppression
            item.querySelector('.delete-btn').addEventListener('click', () => {
                this.deleteHomework(hw.id);
            });

            this.listEl.appendChild(item);
        });
    }

    showForm() {
        this.formEl.classList.add('active');
        this.inputSubject.focus();
    }

    hideForm() {
        this.formEl.classList.remove('active');
        this.inputSubject.value = '';
        this.inputText.value = '';
        this.inputDate.value = '';
    }

    addHomework() {
        const subject = this.inputSubject.value.trim();
        const text = this.inputText.value.trim();
        const date = this.inputDate.value.trim();

        if (!subject || !text || !date) {
            alert("Veuillez remplir tous les champs.");
            return;
        }

        const newHw = {
            id: Date.now(),
            subject,
            text,
            date
        };

        this.homeworkList.push(newHw);
        StorageManager.save('homework_list', this.homeworkList);
        
        this.renderHomeworks();
        this.hideForm();
    }

    deleteHomework(id) {
        this.homeworkList = this.homeworkList.filter(hw => hw.id !== id);
        StorageManager.save('homework_list', this.homeworkList);
        this.renderHomeworks();
    }
}

customElements.define('homework-widget', HomeworkWidget);