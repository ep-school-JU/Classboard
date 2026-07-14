export class DashboardGrid {
    constructor(selector) {
        this.grid = document.querySelector(selector);
        this.init();
    }
    init() { this.updateGridMetrics(); }
    updateGridMetrics() {
        const items = this.grid.querySelectorAll('.grid-item:not(.is-hidden)');
        items.forEach(item => {
            const x = item.getAttribute('data-x');
            const y = item.getAttribute('data-y');
            const w = item.getAttribute('data-w');
            const h = item.getAttribute('data-h');
            item.style.gridColumn = `${parseInt(x)+1} / span ${w}`;
            item.style.gridRow = `${parseInt(y)+1} / span ${h}`;
        });
    }
    restoreLayout() { this.updateGridMetrics(); }
}