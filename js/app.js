/**
 * @fileoverview Point d'entrée principal de l'application ClassBoard.
 */

// 1. Imports des composants et gestionnaires
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
    // 2. Initialisation de la grille
    const dashboard = new DashboardGrid('#dashboard-grid');

    // 3. Éléments du DOM
    const themeSelector = document.getElementById('theme-selector');
    const btnEditGrid = document.getElementById('btn-edit-grid');
    const btnExport = document.getElementById('btn-export');
    const btnImport = document.getElementById('btn-import');
    const importFile = document.getElementById('import-file');
    const btnSettings = document.getElementById('btn-settings');
    const btnCloseSettings = document.getElementById('btn-close-settings');
    const settingsPanel = document.getElementById('settings-panel');
    const settingsOverlay = document.getElementById('settings-overlay');
    const btnResetApp = document.getElementById('btn-reset-app');
    const btnFullscreen = document.getElementById('btn-fullscreen');
    const fontSizeAdjust = document.getElementById('font-size-adjust');
    const btnMic = document.getElementById('btn-mic'); // Peut être null si retiré du HTML

    // 4. Initialisation sécurisée du Système Audio au premier clic
    let audioInitialized = false;
    const initAudioContext = () => {
        if (!audioInitialized) {
            audioSystem.init();
            audioInitialized = true;
            console.log("Système audio initialisé avec succès !");
            
            // Sécurité : on modifie le bouton micro uniquement s'il existe dans le HTML
            if (btnMic) {
                btnMic.textContent = "🎤 Actif";
            }
            
            // Nettoyage des écouteurs pour éviter les exécutions inutiles
            document.removeEventListener('click', initAudioContext);
            document.removeEventListener('touchstart', initAudioContext);
        }
    };
    document.addEventListener('click', initAudioContext);
    document.addEventListener('touchstart', initAudioContext);

    // 5. Gestion de l'édition interactive de la Grille
    if (btnEditGrid) {
        btnEditGrid.addEventListener('click', () => {
            const isEditing = dashboard.toggleEditing();
            if (isEditing) {
                btnEditGrid.textContent = "💾 Sauver la grille";
                btnEditGrid.classList.add('is-active');
            } else {
                btnEditGrid.textContent = "📐 Éditer la grille";
                btnEditGrid.classList.remove('is-active');
            }
        });
    }

    // 6. Gestion du sélecteur de Thèmes
    const savedTheme = StorageManager.get('classboard-theme', 'theme-minimal');
    document.body.className = savedTheme;
    themeSelector.value = savedTheme;

    themeSelector.addEventListener('change', (e) => {
        const selected = e.target.value;
        document.body.className = selected;
        StorageManager.save('classboard-theme', selected);
    });

    // 7. Panneau de Configuration (Ouverture / Fermeture)
    const toggleSettings = (show) => {
        const isVisible = show !== undefined ? show : settingsPanel.getAttribute('aria-hidden') === 'true';
        settingsPanel.setAttribute('aria-hidden', !isVisible);
        settingsOverlay.setAttribute('aria-hidden', !isVisible);
    };

    btnSettings.addEventListener('click', () => toggleSettings(true));
    btnCloseSettings.addEventListener('click', () => toggleSettings(false));
    settingsOverlay.addEventListener('click', () => toggleSettings(false));

    // 8. Toggles des widgets actifs dans les paramètres
    const toggles = settingsPanel.querySelectorAll('.toggle-switch input');
    toggles.forEach(toggle => {
        const widgetId = toggle.getAttribute('data-widget');
        const widget = document.getElementById(widgetId);
        
        const isHidden = StorageManager.get(`hide-${widgetId}`, false);
        if (widget) {
            if (isHidden) {
                widget.classList.add('is-hidden');
                toggle.checked = false;
            } else {
                widget.classList.remove('is-hidden');
                toggle.checked = true;
            }
        }

        toggle.addEventListener('change', (e) => {
            const checked = e.target.checked;
            if (widget) {
                if (checked) {
                    widget.classList.remove('is-hidden');
                    StorageManager.save(`hide-${widgetId}`, false);
                } else {
                    widget.classList.add('is-hidden');
                    StorageManager.save(`hide-${widgetId}`, true);
                }
                dashboard.updateGridMetrics();
            }
        });
    });

    // 9. Taille de police (Accessibilité)
    const savedSize = StorageManager.get('classboard-font-size', 'normal');
    document.documentElement.setAttribute('data-size', savedSize);
    fontSizeAdjust.value = savedSize;

    fontSizeAdjust.addEventListener('change', (e) => {
        const size = e.target.value;
        document.documentElement.setAttribute('data-size', size);
        StorageManager.save('classboard-font-size', size);
    });

    // 10. Gestion du mode Plein Écran
    btnFullscreen.addEventListener('click', () => {
        if (!document.fullscreenElement) {
            document.documentElement.requestFullscreen().catch(err => {
                console.error(`Impossible d'activer le plein écran : ${err.message}`);
            });
        } else {
            document.exitFullscreen();
        }
    });

    // 11. Sauvegarde / Restauration (JSON)
    btnExport.addEventListener('click', () => StorageManager.exportToFile());
    btnImport.addEventListener('click', () => importFile.click());
    
    importFile.addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (file) {
            StorageManager.importFromFile(file)
                .then(() => window.location.reload())
                .catch((err) => alert(`Erreur : ${err.message}`));
        }
    });

    // 12. Réinitialisation complète
    btnResetApp.addEventListener('click', () => {
        if (confirm("Voulez-vous supprimer toutes vos configurations ? Cette action est irréversible.")) {
            localStorage.clear();
            window.location.reload();
        }
    });

    // 13. Service Worker pour fonctionnement hors-ligne
    if ('serviceWorker' in navigator) {
        window.addEventListener('load', () => {
            navigator.serviceWorker.register('./sw.js')
                .then(() => console.log('Service Worker OK'))
                .catch(err => console.error('Erreur SW:', err));
        });
    }
});