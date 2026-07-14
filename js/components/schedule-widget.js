/**
 * @fileoverview Widget Programme du Jour dynamique avec mise en valeur en temps réel.
 * @extends BaseWidget
 */
import { BaseWidget } from './base-widget.js';
import { StorageManager } from '../storage.js';

export class ScheduleWidget extends BaseWidget {
    constructor() {
        super();
        this.updateInterval = null;
        // Programme par défaut si aucun n'est sauvegardé
        this.defaultSchedule = [
            { id: 1, label: "Accueil & Rituels", start: "08:30", end: "09:00", color: "#6366f1" },
            { id: 2, label: "Mathématiques", start: "09:00", end: "10:15", color: "#ef4444" },
            { id: 3, label: "Récréation", start: "10:15", end: "10:30", color: "#10b981" },
            { id: 4, label: "Français (Lecture)", start: "10:30", end: "12:00", color: "#3b82f6" },
            { id: 5, label: "Pause Déjeuner", start: "12:00", end: "13:30", color: "#6b7280" },
            { id: 6, label: "Sciences / Arts", start: "13:30", end: "15:00", color: "#f59e0b" },
            { id: 7, label: "Bilan de la journée", start: "15:00", end: "15:30", color: "#8b5cf6" }
        ];
        this.schedule = [];
    }

    getStyle() {
        return `
            .schedule-card {
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
            .schedule-list {
                display: flex;
                flex-direction: column;
                gap: 8px;
                overflow-y: auto;
                flex-grow: 1;
                padding-right: 4px;
            }
            /* Style de chaque ligne d'activité */
            .activity-item {
                display: flex;
                align-items: center;
                background: rgba(255, 255, 255, 0.04);
                border: 1px solid rgba(255, 255, 255, 0.08);
                border-radius: var(--border-radius-medium, 12px);
                padding: 10px 14px;
                position: relative;
                overflow: hidden;
                transition: all 0.3s ease;
                touch-action: manipulation;
                cursor: pointer;
            }
            /* Activité passée */
            .activity-item.past {
                opacity: 0.4;
                transform: scale(0.98);
            }
            /* Activité en cours : Grand focus visuel */
            .activity-item.current {
                background: rgba(255, 255, 255, 0.1);
                border-color: var(--accent-color, #6366f1);
                box-shadow: 0 0 15px rgba(99, 102, 241, 0.2);
                transform: scale(1.02);
            }
            /* Indicateur de couleur gauche */
            .color-tag {
                width: 6px;
                height: 30px;
                border-radius: 3px;
                margin-right: 12px;
                flex-shrink: 0;
            }
            .activity-info {
                flex-grow: 1;
                display: flex;
                flex-direction: column;
            }
            .activity-label {
                font-size: 0.95rem;
                font-weight: 600;
            }
            .activity-time {
                font-size: 0.75rem;
                opacity: 0.6;
                margin-top: 2px;
            }
            /* Case à cocher tactile */
            .checkbox-done {
                width: 22px;
                height: 22px;
                border: 2px solid rgba(255, 255, 255, 0.3);
                border-radius: 6px;
                display: flex;
                align-items: center;
                justify-content: center;
                cursor: pointer;
                transition: all 0.2s;
                font-size: 0.8rem;
            }
            .activity-item.done .checkbox-done {
                background: #10b981;
                border-color: #10b981;
                color: white;
            }
            .activity-item.done .activity-label {
                text-decoration: line-through;
                opacity: 0.5;
            }
            /* Barre de progression interne pour le cours actuel */
            .progress-overlay {
                position: absolute;
                bottom: 0;
                left: 0;
                height: 3px;
                background: var(--accent-color, #6366f1);
                width: 0%;
                transition: width 1s linear;
            }
        `;
    }

    getTemplate() {
        return `
            <div class="schedule-card">
                <div class="widget-header">
                    <span>📅 Programme du jour</span>
                    <span id="current-time-badge" style="font-size: 0.8rem; opacity: 0.7; font-weight: normal;"></span>
                </div>
                <div class="schedule-list" id="schedule-list">
                    </div>
            </div>
        `;
    }

    init() {
        this.scheduleListEl = this.shadowRoot.getElementById('schedule-list');
        this.timeBadgeEl = this.shadowRoot.getElementById('current-time-badge');
        
        // Charger le programme depuis le stockage ou utiliser celui par défaut
        this.schedule = StorageManager.get('day_schedule', this.defaultSchedule);
        
        // Charger l'état coché / décoché des activités
        this.doneStates = StorageManager.get('schedule_done_states', {});

        this.renderSchedule();
        this.updateScheduleStates();

        // Rafraîchir l'état des cours toutes les minutes
        this.updateInterval = setInterval(() => {
            this.updateScheduleStates();
        }, 1000 * 30); // Toutes les 30 secondes
    }

    renderSchedule() {
        this.scheduleListEl.innerHTML = '';
        
        this.schedule.forEach(activity => {
            const isDone = this.doneStates[activity.id] ? 'done' : '';
            
            const item = document.createElement('div');
            item.className = `activity-item ${isDone}`;
            item.setAttribute('data-id', activity.id);
            item.setAttribute('data-start', activity.start);
            item.setAttribute('data-end', activity.end);

            item.innerHTML = `
                <div class="color-tag" style="background-color: ${activity.color || 'var(--accent-color)'};"></div>
                <div class="activity-info">
                    <span class="activity-label">${activity.label}</span>
                    <span class="activity-time">${activity.start} - ${activity.end}</span>
                </div>
                <div class="checkbox-done">${isDone ? '✓' : ''}</div>
                <div class="progress-overlay" id="progress-${activity.id}"></div>
            `;

            // Permet de cocher l'activité d'un tap
            item.addEventListener('click', (e) => {
                this.toggleActivityDone(activity.id, item);
            });

            this.scheduleListEl.appendChild(item);
        });
    }

    /**
     * Alterne l'état accompli de l'activité
     */
    toggleActivityDone(id, element) {
        const isDone = !this.doneStates[id];
        this.doneStates[id] = isDone;
        StorageManager.save('schedule_done_states', this.doneStates);

        const checkbox = element.querySelector('.checkbox-done');
        if (isDone) {
            element.classList.add('done');
            checkbox.textContent = '✓';
        } else {
            element.classList.remove('done');
            checkbox.textContent = '';
        }
    }

    /**
     * Analyse l'heure actuelle pour appliquer les classes (past, current, future)
     * et mettre à jour la jauge de progression.
     */
    updateScheduleStates() {
        const now = new Date();
        const currentMinutes = (now.getHours() * 60) + now.getMinutes();
        
        // Mettre à jour l'heure dans le header du widget
        const hoursStr = String(now.getHours()).padStart(2, '0');
        const minutesStr = String(now.getMinutes()).padStart(2, '0');
        this.timeBadgeEl.textContent = `${hoursStr}:${minutesStr}`;

        const items = this.shadowRoot.querySelectorAll('.activity-item');

        items.forEach(item => {
            const startStr = item.getAttribute('data-start');
            const endStr = item.getAttribute('data-end');
            const id = item.getAttribute('data-id');
            const progressOverlay = item.querySelector('.progress-overlay');

            const startMinutes = this.parseTimeToMinutes(startStr);
            const endMinutes = this.parseTimeToMinutes(endStr);

            // Nettoyage des états
            item.classList.remove('past', 'current');
            progressOverlay.style.width = '0%';

            if (currentMinutes > endMinutes) {
                // Activité passée
                item.classList.add('past');
            } else if (currentMinutes >= startMinutes && currentMinutes <= endMinutes) {
                // Activité en cours
                item.classList.add('current');
                
                // Calcul de la progression dans l'activité
                const totalDuration = endMinutes - startMinutes;
                const elapsed = currentMinutes - startMinutes;
                const progressPercent = totalDuration > 0 ? (elapsed / totalDuration) * 100 : 0;
                
                progressOverlay.style.width = `${progressPercent}%`;
            }
        });
    }

    /**
     * Convertit un string "HH:MM" en nombre absolu de minutes
     */
    parseTimeToMinutes(timeStr) {
        const parts = timeStr.split(':');
        return (parseInt(parts[0]) * 60) + parseInt(parts[1]);
    }

    disconnectedCallback() {
        if (this.updateInterval) {
            clearInterval(this.updateInterval);
        }
    }
}

customElements.define('schedule-widget', ScheduleWidget);