import { db } from './db.js';
import { gemini } from './gemini.js';

const ALARM_NAME = 'meow_timer';

// 1. Install & Setup
chrome.runtime.onInstalled.addListener(async () => {
    const settings = await db.getSettings();
    if (!settings.apiKey) await db.setSettings('', 1, false);
});

// 2. Message Handler
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
            // ... (Same logic as before) ...
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

// 3. Alarm Trigger
chrome.alarms.onAlarm.addListener(async (alarm) => {
    if (alarm.name === ALARM_NAME) {
        await handleGameLoop();
    }
});

async function setupAlarm() {
    const settings = await db.getSettings();
    if (settings.isEnabled) {
        // Minimum 0.5 min for testing, usually 1 min
        await chrome.alarms.create(ALARM_NAME, {
            periodInMinutes: Math.max(0.5, settings.intervalMinutes)
        });
    }
}

// --- MAIN LOOP ---
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

    // 4. SEND TO TAB (FORCE INJECTION METHOD) 💉
    try {
        const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
        
        // Skip restricted pages
        if (tab && tab.id && !tab.url.startsWith('chrome://') && !tab.url.startsWith('edge://')) {
            
            console.log("🚀 Injecting Cat Script into:", tab.url);

            // A. Force Inject Script
            try {
                await chrome.scripting.executeScript({
                    target: { tabId: tab.id },
                    files: ['scripts/content.js']
                });
                // Also inject CSS to be safe
                await chrome.scripting.insertCSS({
                    target: { tabId: tab.id },
                    files: ['styles/content.css']
                });
            } catch (injectionErr) {
                console.log("Script likely already there, proceeding...", injectionErr);
            }

            // B. Wait small delay then Send Message
            setTimeout(async () => {
                await chrome.tabs.sendMessage(tab.id, {
                    action: 'SHOW_CAT',
                    fact: currentFact,
                    catIndex: Math.floor(Math.random() * 10)
                });
                console.log("📨 Message Sent!");
            }, 300); // 300ms delay to let script load

            await db.setIndex(index + 1);
        } else {
            console.log("🚫 Restricted Tab or Inactive");
        }
    } catch (e) {
        console.log("Could not find active tab:", e);
    }
}