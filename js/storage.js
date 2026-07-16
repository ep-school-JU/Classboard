/**
 * @fileoverview Gestionnaire de stockage local (LocalStorage) et d'import/export de configuration JSON.
 */

export class StorageManager {
    static get(key, defaultValue = null) {
        try {
            const item = localStorage.getItem(key);
            return item ? JSON.parse(item) : defaultValue;
        } catch (e) {
            console.error(`Erreur de lecture pour la clé "${key}":`, e);
            return defaultValue;
        }
    }

    static save(key, value) {
        try {
            localStorage.setItem(key, JSON.stringify(value));
        } catch (e) {
            console.error(`Erreur d'écriture pour la clé "${key}":`, e);
        }
    }

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

    static importFromFile(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = (e) => {
                try {
                    const data = JSON.parse(e.target.result);
                    localStorage.clear();
                    for (const [key, value] of Object.entries(data)) {
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