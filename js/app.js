/**
 * @fileoverview Point d'entrée principal révisé de l'application ClassBoard.
 * Orchestre l'édition de grille interactive, le plein écran moderne et les nouveaux thèmes.
 */

// 1. Imports des widgets indispensables
import './components/base-widget.js';
import './components/clock-widget.js';
import './components/sound-widget.js';
import './components/timer-widget.js';
import './components/noise-widget.js';
import './components/schedule-widget.js';
import './components/homework-widget.js';
import './components/random-widget.js';
import './components/team-builder-widget.js';
import './components/score-widget.js';

import { DashboardGrid } from './dashboard.js';
import { StorageManager } from './storage.js';
import { audioSystem } from './audio.js';

document.addEventListener('DOMContentLoaded', () => {
    // 2. Lancement de l'infrastructure de la grille
    const dashboard = new DashboardGrid('#dashboard-grid');

    // 3. Éléments interactifs du DOM
    const themeSelector = document.getElementById('theme-selector');
    const btnEditGrid = document.getElementById('btn-edit-grid');
    const btnFullscreen = document.getElementById('btn-fullscreen');
    const btnSettings = document.getElementById('btn-settings');
    const btnCloseSettings = document.getElementById('btn-close-settings');
    const settingsPanel = document.getElementById('settings-panel');
    const settingsOverlay = document.getElementById('settings-overlay');
    const btnExport = document.getElementById('btn-export');
    const btnImport = document.getElementById('btn-import');
    const importFile = document.getElementById('import-file');
    const fontSizeAdjust = document.getElementById('font-size-adjust');
    const btnResetApp = document.getElementById('btn-reset-app');

    // 4. Lancement audio automatique lors du premier clic de l'enseignant sur l'écran
    let audioInitialized = false;
    const initAudioContext = () => {
        if (!audioInitialized) {
            audioSystem.init();
            audioInitialized = true;
            console.log("🔊 Système audio initialisé.");
            document.removeEventListener('click', initAudioContext);
            document.removeEventListener('touchstart', initAudioContext);
        }
    };
    document.addEventListener('click', initAudioContext);
    document.addEventListener('touchstart', initAudioContext);

    // 5. Gestion des Thèmes de Classe Enjoués
    const savedTheme = StorageManager.get('app_theme', 'theme-cosmic');
    document.body.className = savedTheme;
    themeSelector.value = savedTheme;

    themeSelector.addEventListener('change', (e) => {
        const theme = e.target.value;
        document.body.className = theme;
        applyFontSize(fontSizeAdjust.value);
        StorageManager.save('app_theme', theme);
    });

    // 6. Action : Déclencher le Mode Édition de Grille Tactile
    btnEditGrid.addEventListener('click', () => {
        dashboard.toggleEditing();
        // Change l'apparence visuelle du bouton dans la barre pour indiquer l'état
        if (dashboard.isEditing) {
            btnEditGrid.textContent = "💾 Sauver la grille";
            btnEditGrid.classList.add('is-active');
        } else {
            btnEditGrid.textContent = "📐 Éditer la grille";
            btnEditGrid.classList.remove('is-active');
        }
    });

    // 7. Gestion du Plein Écran Moderne (Fermeture et Ouverture)
    btnFullscreen.addEventListener('click', () => {
        if (!document.fullscreenElement) {
            document.documentElement.requestFullscreen()
                .then(() => {
                    btnFullscreen.innerHTML = `
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                            <path d="M4 14h6v6M20 10h-6V4M14 10l7-7M10 14l-7 7" />
                        </svg> Réduire`;
                })
                .catch((err) => console.error(`Erreur plein écran : ${err.message}`));
        } else {
            document.exitFullscreen().then(() => {
                btnFullscreen.innerHTML = `
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                        <path d="M15 3h6v6M9 21H3v-6M21 3l-7 7M3 21l7-7" />
                    </svg> Plein Écran`;
            });
        }
    });

    // 8. Contrôle du Panneau de Configuration Latéral
    const toggleSettings = (open) => {
        settingsPanel.setAttribute('aria-hidden', !open);
        settingsOverlay.setAttribute('aria-hidden', !open);
    };

    btnSettings.addEventListener('click', () => toggleSettings(true));
    btnCloseSettings.addEventListener('click', () => toggleSettings(false));
    settingsOverlay.addEventListener('click', () => toggleSettings(false));

    // 9. Activation et désactivation à la carte des widgets
    const checkboxes = document.querySelectorAll('.toggle-switch input');
    checkboxes.forEach(box => {
        const widgetId = box.getAttribute('data-widget');
        const widget = document.getElementById(widgetId);
        
        const isVisible = StorageManager.get(`visible_${widgetId}`, true);
        box.checked = isVisible;
        if (!isVisible && widget) {
            widget.classList.add('is-hidden');
            widget.style.display = 'none';
        }

        box.addEventListener('change', (e) => {
            const checked = e.target.checked;
            if (widget) {
                if (checked) {
                    widget.classList.remove('is-hidden');
                    widget.style.display = 'flex';
                } else {
                    widget.classList.add('is-hidden');
                    widget.style.display = 'none';
                }
                dashboard.updateGridMetrics();
            }
            StorageManager.save(`visible_${widgetId}`, checked);
        });
    });

    // 10. Gestion fine des Tailles de police (Accessibilité)
    const applyFontSize = (size) => {
        document.documentElement.removeAttribute('data-size');
        if (size !== 'normal') {
            document.documentElement.setAttribute('data-size', size);
        }
    };
    
    const savedFontSize = StorageManager.get('app_font_size', 'normal');
    fontSizeAdjust.value = savedFontSize;
    applyFontSize(savedFontSize);

    fontSizeAdjust.addEventListener('change', (e) => {
        const size = e.target.value;
        applyFontSize(size);
        StorageManager.save('app_font_size', size);
    });

    // 11. Sauvegardes JSON Externes
    btnExport.addEventListener('click', () => StorageManager.exportToFile());
    btnImport.addEventListener('click', () => importFile.click());
    
    importFile.addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (file) {
            StorageManager.importFromFile(file)
                .then(() => window.location.reload())
                .catch((err) => alert(`Erreur de chargement de fichier de classe : ${err.message}`));
        }
    });

    // 12. Réinitialisation Globale des Données
    btnResetApp.addEventListener('click', () => {
        if (confirm("Voulez-vous supprimer l'agencement personnalisé des widgets, vos thèmes et données ? Cette action est définitive.")) {
            localStorage.clear();
            window.location.reload();
        }
    });

    // 13. Service Worker
    if ('serviceWorker' in navigator) {
        window.addEventListener('load', () => {
            navigator.serviceWorker.register('./sw.js')
                .then((registration) => console.log('SW actif:', registration.scope))
                .catch((err) => console.error('Erreur SW:', err));
        });
    }
});