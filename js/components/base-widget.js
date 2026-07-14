export class BaseWidget extends HTMLElement {
    constructor() {
        super();
        this.attachShadow({ mode: 'open' });
    }
    connectedCallback() {
        this.shadowRoot.innerHTML = `
            <style>
                :host { display: block; height: 100%; width: 100%; box-sizing: border-box; }
                ${this.getStyle()}
            </style>
            ${this.getTemplate()}
        `;
        this.init();
    }
    getStyle() { return ''; }
    getTemplate() { return ''; }
    init() {}
}