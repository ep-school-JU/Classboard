/**
 * @fileoverview Gestionnaire de stockage local (LocalStorage) et d'import/export de configuration JSON.
 */

export class StorageManager {
    /**
     * Récupère une valeur du stockage local.
     * @param {string} key - La clé de stockage.
     * @param {*} defaultValue - La valeur de retour par défaut si la clé n'existe pas.
     * @returns {*} La valeur stockée (décodée du JSON) ou la valeur par défaut.
     */
    static get(key, defaultValue = null) {
        try {
            const item = localStorage.getItem(key);
            return item ? JSON.parse(item) : defaultValue;
        } catch (e) {
            console.error(`Erreur de lecture pour la clé "${key}":`, e);
            return defaultValue;
        }
    }

    /**
     * Enregistre une valeur dans le stockage local sous forme de chaîne JSON.
     * @param {string} key - La clé de stockage.
     * @param {*} value - La valeur à sauvegarder.
     */
    static save(key, value) {
        try {
            localStorage.setItem(key, JSON.stringify(value));
        } catch (e) {
            console.error(`Erreur d'écriture pour la clé "${key}":`, e);
        }
    }

    /**
     * Exporte toutes les clés LocalStorage de ClassBoard dans un fichier JSON téléchargeable.
     */
    static exportToFile() {
        const data = {};
        for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i);
            data[key] = localStorage.getItem(key);
        }

        const jsonString = JSON.stringify(data, null, 2);
        const blob = new Blob([jsonString], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        
        const a = document.createElement('a');
        a.href = url;
        a.download = `classboard-sauvegarde-${new Date().toISOString().split('T')[0]}.json`;
        document.body.appendChild(a);
        a.click();
        
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    }

    /**
     * Importe un fichier JSON de configuration et l'applique au LocalStorage.
     * @param {File} file - Le fichier JSON sélectionné par l'utilisateur.
     * @returns {Promise<void>} Resolves lorsque l'importation est terminée.
     */
    static importFromFile(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = (e) => {
                try {
                    const data = JSON.parse(e.target.result);
                    // On vide l'ancien stockage avant d'injecter le nouveau
                    localStorage.clear();
                    for (const [key, value] of Object.entries(data)) {
                        // Les valeurs exportées sont déjà des chaînes JSON, on les réinjecte telles quelles
                        localStorage.setItem(key, value);
                    }
                    resolve();
                } catch (err) {
                    reject(new Error("Format de fichier de sauvegarde invalide."));
                }
            };
            reader.onerror = () => reject(new Error("Erreur lors de la lecture du fichier."));
            reader.readAsText(file);
        });
    }
}