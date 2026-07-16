/**
 * @fileoverview Gestionnaire de grille interactif.
 * Permet le déplacement et redimensionnement assisté des widgets et gère leur persistance.
 */

import { StorageManager } from './storage.js';

export class DashboardGrid {
    constructor(selector) {
        this.grid = document.querySelector(selector);
        this.isEditing = false;
        this.init();
    }

    init() {
        this.restoreLayout();
        window.addEventListener('resize', () => this.updateGridMetrics());
    }

    /**
     * Applique les positions CSS Grid à tous les widgets visibles.
     */
    updateGridMetrics() {
        const items = this.grid.querySelectorAll('.grid-item');
        items.forEach(item => {
            if (item.classList.contains('is-hidden') || item.style.display === 'none') {
                return;
            }
            const x = parseInt(item.getAttribute('data-x')) || 0;
            const y = parseInt(item.getAttribute('data-y')) || 0;
            const w = parseInt(item.getAttribute('data-w')) || 2;
            const h = parseInt(item.getAttribute('data-h')) || 2;

            item.style.gridColumn = `${x + 1} / span ${w}`;
            item.style.gridRow = `${y + 1} / span ${h}`;
        });
    }

    /**
     * Active ou désactive le mode édition de la grille.
     */
    toggleEditing() {
        this.isEditing = !this.isEditing;
        if (this.isEditing) {
            this.grid.classList.add('is-editing');
            this.injectEditOverlays();
        } else {
            this.grid.classList.remove('is-editing');
            this.removeEditOverlays();
        }
    }

    /**
     * Injecte le panneau d'outils d'édition (flèches et tailles) dans chaque widget.
     */
    injectEditOverlays() {
        const items = this.grid.querySelectorAll('.grid-item:not(.is-hidden)');
        items.forEach(item => {
            // Éviter d'injecter plusieurs fois
            if (item.querySelector('.edit-overlay')) return;

            const overlay = document.createElement('div');
            overlay.className = 'edit-overlay';
            overlay.innerHTML = `
                <div class="edit-arrows-grid">
                    <div></div>
                    <button class="edit-btn arrow-up" title="Monter">⬆️</button>
                    <div></div>
                    <button class="edit-btn arrow-left" title="Gauche">⬅️</button>
                    <div style="display:flex;align-items:center;justify-content:center;font-size:0.75rem;color:#aaa;">Dépl.</div>
                    <button class="edit-btn arrow-right" title="Droite">➡️</button>
                    <div></div>
                    <button class="edit-btn arrow-down" title="Descendre">⬇️</button>
                    <div></div>
                </div>
                <div class="edit-resize-row">
                    <button class="edit-btn resize-btn dec-w" title="Réduire largeur">W-</button>
                    <button class="edit-btn resize-btn inc-w" title="Agrandir largeur">W+</button>
                    <button class="edit-btn resize-btn dec-h" title="Réduire hauteur">H-</button>
                    <button class="edit-btn resize-btn inc-h" title="Agrandir hauteur">H+</button>
                </div>
            `;

            // Écouteurs d'action
            overlay.querySelector('.arrow-up').addEventListener('click', () => this.moveWidget(item, 0, -1));
            overlay.querySelector('.arrow-down').addEventListener('click', () => this.moveWidget(item, 0, 1));
            overlay.querySelector('.arrow-left').addEventListener('click', () => this.moveWidget(item, -1, 0));
            overlay.querySelector('.arrow-right').addEventListener('click', () => this.moveWidget(item, 1, 0));

            overlay.querySelector('.inc-w').addEventListener('click', () => this.resizeWidget(item, 1, 0));
            overlay.querySelector('.dec-w').addEventListener('click', () => this.resizeWidget(item, -1, 0));
            overlay.querySelector('.inc-h').addEventListener('click', () => this.resizeWidget(item, 0, 1));
            overlay.querySelector('.dec-h').addEventListener('click', () => this.resizeWidget(item, 0, -1));

            item.appendChild(overlay);
        });
    }

    /**
     * Supprime les panneaux d'édition de tous les widgets.
     */
    removeEditOverlays() {
        const overlays = this.grid.querySelectorAll('.edit-overlay');
        overlays.forEach(overlay => overlay.remove());
    }

    /**
     * Déplace un widget de manière sécurisée sans dépasser de la grille 12x8.
     */
    moveWidget(item, dx, dy) {
        let x = (parseInt(item.getAttribute('data-x')) || 0) + dx;
        let y = (parseInt(item.getAttribute('data-y')) || 0) + dy;
        const w = parseInt(item.getAttribute('data-w')) || 2;
        const h = parseInt(item.getAttribute('data-h')) || 2;

        // Limites horizontales (12 colonnes)
        if (x < 0) x = 0;
        if (x + w > 12) x = 12 - w;

        // Limites verticales (8 lignes)
        if (y < 0) y = 0;
        if (y + h > 8) y = 8 - h;

        item.setAttribute('data-x', x);
        item.setAttribute('data-y', y);
        this.updateGridMetrics();
        this.saveWidgetLayout(item);
    }

    /**
     * Redimensionne un widget en veillant à ce qu'il reste dans des valeurs cohérentes.
     */
    resizeWidget(item, dw, dh) {
        const x = parseInt(item.getAttribute('data-x')) || 0;
        const y = parseInt(item.getAttribute('data-y')) || 0;
        let w = (parseInt(item.getAttribute('data-w')) || 2) + dw;
        let h = (parseInt(item.getAttribute('data-h')) || 2) + dh;

        // Tailles minimales logiques
        if (w < 1) w = 1;
        if (h < 1) h = 1;

        // Limites maximales sur la grille
        if (x + w > 12) w = 12 - x;
        if (y + h > 8) h = 8 - y;

        item.setAttribute('data-w', w);
        item.setAttribute('data-h', h);
        this.updateGridMetrics();
        this.saveWidgetLayout(item);
    }

    /**
     * Sauvegarde la position personnalisée du widget dans le stockage local.
     */
    saveWidgetLayout(item) {
        const id = item.id;
        const layout = {
            x: item.getAttribute('data-x'),
            y: item.getAttribute('data-y'),
            w: item.getAttribute('data-w'),
            h: item.getAttribute('data-h')
        };
        StorageManager.save(`layout_${id}`, layout);
    }

    /**
     * Restaure la mise en page enregistrée par l'enseignant.
     */
    restoreLayout() {
        const items = this.grid.querySelectorAll('.grid-item');
        items.forEach(item => {
            const saved = StorageManager.get(`layout_${item.id}`);
            if (saved) {
                item.setAttribute('data-x', saved.x);
                item.setAttribute('data-y', saved.y);
                item.setAttribute('data-w', saved.w);
                item.setAttribute('data-h', saved.h);
            }
        });
        this.updateGridMetrics();
    }
}