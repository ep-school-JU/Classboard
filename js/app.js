/**
 * @fileoverview Point d'entrée principal de l'application ClassBoard.
 * Orchestre les thèmes, l'affichage des volets, la sauvegarde et l'initialisation audio.
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
    const btnMic = document.getElementById('btn-mic');
    const themeSelector = document.getElementById('theme-selector');
    const btnExport = document.getElementById('btn-export');
    const btnImport = document.getElementById('btn-import');
    const importFile = document.getElementById('import-file');
    const btnSettings = document.getElementById('btn-settings');
    const btnCloseSettings = document.getElementById('btn-close-settings');
    const settingsPanel = document.getElementById('settings-panel');
    const settingsOverlay = document.getElementById('settings-overlay');
    const btnResetApp = document.getElementById('btn-reset-app');
    const fontSizeAdjust = document.getElementById('font-size-adjust');
    const btnFullscreen = document.getElementById('btn-fullscreen');

    // 4. Initialisation de l'AudioContext lors de la première interaction utilisateur
    let audioInitialized = false;
    const initAudioContext = () => {
        if (!audioInitialized) {
            audioSystem.init();
            audioInitialized = true;
            console.log("Système audio initialisé avec succès !");
            btnMic.textContent = "🎤 Actif";
            // Nettoyage des événements d'écouteurs pour ne pas le réinitialiser en boucle
            document.removeEventListener('click', initAudioContext);
            document.removeEventListener('touchstart', initAudioContext);
        }
    };
    document.addEventListener('click', initAudioContext);
    document.addEventListener('touchstart', initAudioContext);

    // 5. Gestion des Thèmes
    const savedTheme = StorageManager.get('app_theme', 'theme-minimal');
    document.body.className = savedTheme;
    themeSelector.value = savedTheme;

    themeSelector.addEventListener('change', (e) => {
        const theme = e.target.value;
        document.body.className = theme;
        // On conserve la taille de police si elle a été ajustée
        applyFontSize(fontSizeAdjust.value);
        StorageManager.save('app_theme', theme);
    });

    // 6. Gestion du Volet Paramètres (Ouverture / Fermeture)
    const toggleSettings = (open) => {
        settingsPanel.setAttribute('aria-hidden', !open);
        settingsOverlay.setAttribute('aria-hidden', !open);
    };

    btnSettings.addEventListener('click', () => toggleSettings(true));
    btnCloseSettings.addEventListener('click', () => toggleSettings(false));
    settingsOverlay.addEventListener('click', () => toggleSettings(false));

    // 7. Masquer/Afficher les widgets dynamiquement
    const checkboxes = document.querySelectorAll('.toggle-switch input');
    checkboxes.forEach(box => {
        const widgetId = box.getAttribute('data-widget');
        const widget = document.getElementById(widgetId);
        
        // Charger l'état sauvegardé
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
                    widget.style.display = 'block';
                } else {
                    widget.classList.add('is-hidden');
                    widget.style.display = 'none';
                }
                dashboard.updateGridMetrics(); // Recalculer le placement de la grille
            }
            StorageManager.save(`visible_${widgetId}`, checked);
        });
    });

    // 8. Gestion de l'Accessibilité (Tailles de police globales)
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

    // 9. Plein écran tactile (F)
    btnFullscreen.addEventListener('click', () => {
        if (!document.fullscreenElement) {
            document.documentElement.requestFullscreen().catch((err) => {
                console.error(`Erreur lors du passage en plein écran : ${err.message}`);
            });
        } else {
            document.exitFullscreen();
        }
    });

    // 10. Sauvegarde / Restauration (Données globales JSON)
    btnExport.addEventListener('click', () => StorageManager.exportToFile());
    btnImport.addEventListener('click', () => importFile.click());
    
    importFile.addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (file) {
            StorageManager.importFromFile(file)
                .then(() => window.location.reload())
                .catch((err) => alert(`Erreur de chargement : ${err.message}`));
        }
    });

    // 11. Réinitialisation complète
    btnResetApp.addEventListener('click', () => {
        if (confirm("Voulez-vous supprimer toutes vos configurations (devoirs, élèves, thèmes) ? Cette action est irréversible.")) {
            localStorage.clear();
            window.location.reload();
        }
    });

    // 12. Enregistrement du Service Worker pour le mode 100% hors-ligne
    if ('serviceWorker' in navigator) {
        window.addEventListener('load', () => {
            navigator.serviceWorker.register('./sw.js')
                .then((registration) => {
                    console.log('Service Worker installé avec succès ! Portée :', registration.scope);
                })
                .catch((err) => {
                    console.error('Échec de l\'installation du Service Worker :', err);
                });
        });
    }
});