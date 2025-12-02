const DB_NAME = 'MewoinfoDB';
const DB_VERSION = 2; // Version baralam karon notun store lagbe

const STORE_SETTINGS = 'settings';
const STORE_DATA = 'data';

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

export const db = {
    // Settings
    async setSettings(apiKey, intervalMinutes, isEnabled) {
        await saveData(STORE_SETTINGS, { id: 'config', val: { apiKey, intervalMinutes, isEnabled } });
    },
    async getSettings() {
        return await getData(STORE_SETTINGS, 'config') || { apiKey: '', intervalMinutes: 1, isEnabled: false };
    },

    // PDF Text
    async setPDFText(text) { await saveData(STORE_DATA, { id: 'source_text', val: text }); },
    async getPDFText() { return await getData(STORE_DATA, 'source_text'); },

    // Facts
    async setFacts(factsArray) { await saveData(STORE_DATA, { id: 'meow_facts', val: factsArray }); },
    async getFacts() { return await getData(STORE_DATA, 'meow_facts') || []; },

    // Index
    async setIndex(index) { await saveData(STORE_DATA, { id: 'current_index', val: index }); },
    async getIndex() { return await getData(STORE_DATA, 'current_index') || 0; },

    // --- NEW FEATURES ---
    
    // 1. Snooze Logic (Timestamp)
    async setSnoozeUntil(timestamp) {
        await saveData(STORE_SETTINGS, { id: 'snooze_until', val: timestamp });
    },
    async getSnoozeUntil() {
        return await getData(STORE_SETTINGS, 'snooze_until') || 0;
    },

    // 2. History (Last 5 Facts)
    async addToHistory(fact) {
        let history = await getData(STORE_DATA, 'history') || [];
        history.unshift(fact); // Add to top
        if (history.length > 5) history.pop(); // Keep only 5
        await saveData(STORE_DATA, { id: 'history', val: history });
    },
    async getHistory() {
        return await getData(STORE_DATA, 'history') || [];
    }
};