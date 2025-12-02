import { db } from './db.js';
import { gemini } from './gemini.js';

const ALARM_NAME = 'meow_timer';

chrome.runtime.onInstalled.addListener(async () => {
    const settings = await db.getSettings();
    if (!settings.apiKey) await db.setSettings('', 5, false);
});

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    (async () => {
        if (message.action === 'START_ALARM') {
            await setupAlarm();
            sendResponse({ status: 'started' });
        } 
        else if (message.action === 'STOP_ALARM') {
            await chrome.alarms.clear(ALARM_NAME);
            sendResponse({ status: 'stopped' });
        }
        else if (message.action === 'GENERATE_INITIAL') {
            try {
                const text = await db.getPDFText();
                const settings = await db.getSettings();
                if (!text || !settings.apiKey) {
                    sendResponse({ success: false, error: "Missing info" });
                    return;
                }
                const facts = await gemini.generateFacts(settings.apiKey, text);
                await db.setFacts(facts);
                await db.setIndex(0);
                sendResponse({ success: true, count: facts.length });
            } catch (error) {
                console.error(error);
                sendResponse({ success: false, error: error.message });
            }
        }
    })();
    return true;
});

chrome.alarms.onAlarm.addListener(async (alarm) => {
    if (alarm.name === ALARM_NAME) {
        await handleGameLoop();
    }
});

async function setupAlarm() {
    const settings = await db.getSettings();
    if (settings.isEnabled) {
        await chrome.alarms.create(ALARM_NAME, {
            periodInMinutes: Math.max(1, settings.intervalMinutes)
        });
    }
}

async function handleGameLoop() {
    const settings = await db.getSettings();
    if (!settings.isEnabled) return;

    // 1. CHECK SNOOZE 💤
    const snoozeUntil = await db.getSnoozeUntil();
    if (Date.now() < snoozeUntil) {
        console.log("😴 Shhh... Cat is snoozing.");
        return;
    }

    let facts = await db.getFacts();
    let index = await db.getIndex();

    // 2. REFILL LOGIC
    if (index >= facts.length) {
        try {
            const text = await db.getPDFText();
            if (text && settings.apiKey) {
                const newFacts = await gemini.generateFacts(settings.apiKey, text);
                facts = facts.concat(newFacts); 
                await db.setFacts(facts);
            }
        } catch (err) {
            console.error("Refill failed:", err);
            return;
        }
    }

    const currentFact = facts[index];

    // 3. SAVE TO HISTORY 📜
    await db.addToHistory(currentFact);

    // 4. SEND TO TAB
    try {
        const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
        if (tab && tab.id && !tab.url.startsWith('chrome')) {
            await chrome.tabs.sendMessage(tab.id, {
                action: 'SHOW_CAT',
                fact: currentFact,
                catIndex: Math.floor(Math.random() * 10)
            });
            await db.setIndex(index + 1);
        }
    } catch (e) {
        console.log("Tab inactive");
    }
}