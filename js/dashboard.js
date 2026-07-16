/**
 * @fileoverview Gestionnaire de grille interactive (déplacement, redimensionnement et persistance).
 */

export class DashboardGrid {
    constructor(selector) {
        this.grid = document.querySelector(selector);
        this.isEditing = false;
        this.init();
    }

    init() {
        this.loadLayout();
        this.updateGridMetrics();
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
            this.saveLayout();
        }
        return this.isEditing;
    }

    /**
     * Applique les coordonnées grid-column et grid-row du CSS à chaque élément.
     */
    updateGridMetrics() {
        const items = this.grid.querySelectorAll('.grid-item');
        items.forEach(item => {
            const x = parseInt(item.getAttribute('data-x')) || 0;
            const y = parseInt(item.getAttribute('data-y')) || 0;
            const w = parseInt(item.getAttribute('data-w')) || 2;
            const h = parseInt(item.getAttribute('data-h')) || 2;

            item.style.gridColumn = `${x + 1} / span ${w}`;
            item.style.gridRow = `${y + 1} / span ${h}`;
        });
    }

    /**
     * Génère et injecte la surcouche de contrôle d'édition dans chaque widget.
     */
    injectEditOverlays() {
        const items = this.grid.querySelectorAll('.grid-item');
        items.forEach(item => {
            // Éviter d'injecter plusieurs fois si déjà présent
            if (item.querySelector('.edit-overlay')) return;

            const overlay = document.createElement('div');
            overlay.className = 'edit-overlay';
            overlay.innerHTML = `
                <div class="edit-arrows-grid">
                    <div></div>
                    <button class="edit-btn move-up" title="Monter">▲</button>
                    <div></div>
                    <button class="edit-btn move-left" title="Gauche">◀</button>
                    <div style="display:flex; justify-content:center; align-items:center; color:#fff; font-size:1.2rem;">✥</div>
                    <button class="edit-btn move-right" title="Droite">▶</button>
                    <div></div>
                    <button class="edit-btn move-down" title="Descendre">▼</button>
                    <div></div>
                </div>
                <div class="edit-resize-row">
                    <button class="edit-btn resize-btn dec-w" title="Moins Large">↔ -</button>
                    <button class="edit-btn resize-btn inc-w" title="Plus Large">↔ +</button>
                    <button class="edit-btn resize-btn dec-h" title="Moins Haut">↕ -</button>
                    <button class="edit-btn resize-btn inc-h" title="Plus Haut">↕ +</button>
                </div>
            `;

            // Ajout des écouteurs de clics pour le déplacement
            overlay.querySelector('.move-up').addEventListener('click', () => this.moveWidget(item, 0, -1));
            overlay.querySelector('.move-down').addEventListener('click', () => this.moveWidget(item, 0, 1));
            overlay.querySelector('.move-left').addEventListener('click', () => this.moveWidget(item, -1, 0));
            overlay.querySelector('.move-right').addEventListener('click', () => this.moveWidget(item, 1, 0));

            // Ajout des écouteurs de clics pour la taille
            overlay.querySelector('.inc-w').addEventListener('click', () => this.resizeWidget(item, 1, 0));
            overlay.querySelector('.dec-w').addEventListener('click', () => this.resizeWidget(item, -1, 0));
            overlay.querySelector('.inc-h').addEventListener('click', () => this.resizeWidget(item, 0, 1));
            overlay.querySelector('.dec-h').addEventListener('click', () => this.resizeWidget(item, 0, -1));

            item.appendChild(overlay);
        });
    }

    /**
     * Nettoie les surcouches d'édition.
     */
    removeEditOverlays() {
        const overlays = this.grid.querySelectorAll('.edit-overlay');
        overlays.forEach(overlay => overlay.remove());
    }

    /**
     * Déplace un widget en limitant sa course à la grille 12x8.
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
    }

    /**
     * Modifie la taille d'un widget en l'empêchant de dépasser de l'écran.
     */
    resizeWidget(item, dw, dh) {
        const x = parseInt(item.getAttribute('data-x')) || 0;
        const y = parseInt(item.getAttribute('data-y')) || 0;
        let w = (parseInt(item.getAttribute('data-w')) || 2) + dw;
        let h = (parseInt(item.getAttribute('data-h')) || 2) + dh;

        // Tailles minimales sécurisées (1x1) et maximales
        if (w < 1) w = 1;
        if (h < 1) h = 1;
        if (x + w > 12) w = 12 - x;
        if (y + h > 8) h = 8 - y;

        item.setAttribute('data-w', w);
        item.setAttribute('data-h', h);
        this.updateGridMetrics();
    }

    /**
     * Enregistre l'agencement actuel dans le stockage local.
     */
    saveLayout() {
        const layout = [];
        const items = this.grid.querySelectorAll('.grid-item');
        items.forEach(item => {
            layout.push({
                id: item.id,
                x: item.getAttribute('data-x'),
                y: item.getAttribute('data-y'),
                w: item.getAttribute('data-w'),
                h: item.getAttribute('data-h')
            });
        });
        localStorage.setItem('classboard-grid-layout', JSON.stringify(layout));
    }

    /**
     * Charge l'agencement sauvegardé s'il existe.
     */
    loadLayout() {
        const saved = localStorage.getItem('classboard-grid-layout');
        if (!saved) return;

        try {
            const layout = JSON.parse(saved);
            layout.forEach(widgetConfig => {
                const item = this.grid.querySelector(`#${widgetConfig.id}`);
                if (item) {
                    item.setAttribute('data-x', widgetConfig.x);
                    item.setAttribute('data-y', widgetConfig.y);
                    item.setAttribute('data-w', widgetConfig.w);
                    item.setAttribute('data-h', widgetConfig.h);
                }
            });
        } catch (e) {
            console.error("Impossible de charger l'agencement de la grille", e);
        }
    }
}