// Database Name and Version
const DB_NAME = 'MewoinfoDB';
const DB_VERSION = 1;

// Stores (Tables)
const STORE_SETTINGS = 'settings'; // API Key, Interval, Enabled/Disabled
const STORE_DATA = 'data';         // PDF Text, Processed Facts

// Open Database Helper
function openDB() {
    return new Promise((resolve, reject) => {
        const request = indexedDB.open(DB_NAME, DB_VERSION);

        request.onupgradeneeded = (event) => {
            const db = event.target.result;
            if (!db.objectStoreNames.contains(STORE_SETTINGS)) {
                db.createObjectStore(STORE_SETTINGS, { keyPath: 'id' });
            }
            if (!db.objectStoreNames.contains(STORE_DATA)) {
                db.createObjectStore(STORE_DATA, { keyPath: 'id' });
            }
        };

        request.onsuccess = (event) => resolve(event.target.result);
        request.onerror = (event) => reject('DB Error: ' + event.target.error);
    });
}

// Generic Save Function
async function saveData(storeName, data) {
    const db = await openDB();
    return new Promise((resolve, reject) => {
        const tx = db.transaction(storeName, 'readwrite');
        const store = tx.objectStore(storeName);
        const request = store.put(data);

        request.onsuccess = () => resolve(true);
        request.onerror = () => reject('Save Failed');
    });
}

// Generic Get Function
async function getData(storeName, id) {
    const db = await openDB();
    return new Promise((resolve, reject) => {
        const tx = db.transaction(storeName, 'readonly');
        const store = tx.objectStore(storeName);
        const request = store.get(id);

        request.onsuccess = () => resolve(request.result ? request.result.val : null);
        request.onerror = () => reject('Get Failed');
    });
}

// --- Specific Helpers for our App ---

export const db = {
    // 1. Settings (API Key, Interval)
    async setSettings(apiKey, intervalMinutes, isEnabled) {
        await saveData(STORE_SETTINGS, { id: 'config', val: { apiKey, intervalMinutes, isEnabled } });
    },
    async getSettings() {
        return await getData(STORE_SETTINGS, 'config') || { apiKey: '', intervalMinutes: 1, isEnabled: false };
    },

    // 2. PDF Text (Raw text from file)
    async setPDFText(text) {
        await saveData(STORE_DATA, { id: 'source_text', val: text });
    },
    async getPDFText() {
        return await getData(STORE_DATA, 'source_text');
    },

    // 3. Meow Facts (Array of strings)
    async setFacts(factsArray) {
        // Fetch existing to append or overwrite? Let's overwrite for new PDF, append for refill.
        // For simplicity, we assume this function receives the FULL updated list.
        await saveData(STORE_DATA, { id: 'meow_facts', val: factsArray });
    },
    async getFacts() {
        return await getData(STORE_DATA, 'meow_facts') || [];
    },

    // 4. Current Index (Where are we in the list?)
    async setIndex(index) {
        await saveData(STORE_DATA, { id: 'current_index', val: index });
    },
    async getIndex() {
        return await getData(STORE_DATA, 'current_index') || 0;
    }
};