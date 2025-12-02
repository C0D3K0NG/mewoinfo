import { db } from './db.js';
import { gemini } from './gemini.js';

const ALARM_NAME = 'meow_timer';

// 1. Install Event - Initialize defaults
chrome.runtime.onInstalled.addListener(async () => {
    console.log("Mewoinfo Installed! 🐱");
    const settings = await db.getSettings();
    if (!settings.apiKey) {
        // First run defaults
        await db.setSettings('', 1, false); // No Key, 1 min, Disabled
    }
});

// 2. Message Handler (Communication Hub)
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
                // 1. Get Text & Key
                const text = await db.getPDFText();
                const settings = await db.getSettings();
                
                if (!text || !settings.apiKey) {
                    sendResponse({ success: false, error: "Missing PDF or API Key" });
                    return;
                }

                // 2. Call Gemini
                const facts = await gemini.generateFacts(settings.apiKey, text);
                
                // 3. Save to DB
                await db.setFacts(facts);
                await db.setIndex(0); // Reset counter
                
                sendResponse({ success: true, count: facts.length });
            } catch (error) {
                console.error(error);
                sendResponse({ success: false, error: error.message });
            }
        }
    })();
    return true; // Keep channel open for async response
});

// 3. The Alarm Listener (Tick Tock) ⏰
chrome.alarms.onAlarm.addListener(async (alarm) => {
    if (alarm.name === ALARM_NAME) {
        await handleGameLoop();
    }
});

// --- HELPER FUNCTIONS ---

async function setupAlarm() {
    const settings = await db.getSettings();
    if (settings.isEnabled) {
        // Chrome allows min 1 minute for released extensions
        const interval = Math.max(1, settings.intervalMinutes);
        
        await chrome.alarms.create(ALARM_NAME, {
            periodInMinutes: interval
        });
        console.log(`Alarm set for every ${interval} minutes.`);
    }
}

async function handleGameLoop() {
    const settings = await db.getSettings();
    if (!settings.isEnabled) return;

    // 1. Get current state
    let facts = await db.getFacts();
    let index = await db.getIndex();

    // 2. CHECK: Do we need a REFILL? ⛽
    if (index >= facts.length) {
        console.log("Facts exhausted! Refilling...");
        try {
            const text = await db.getPDFText();
            if (text && settings.apiKey) {
                const newFacts = await gemini.generateFacts(settings.apiKey, text);
                // Append new facts to existing list (Infinite scroll logic)
                facts = facts.concat(newFacts); 
                await db.setFacts(facts);
                console.log("Refilled with " + newFacts.length + " new facts.");
            }
        } catch (err) {
            console.error("Refill failed:", err);
            return; // Try again next interval
        }
    }

    // 3. Get the current fact
    const currentFact = facts[index];

    // 4. Send to Active Tab
    try {
        const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
        
        if (tab && tab.id) {
            // Check if URL is restricted (chrome:// etc)
            if (!tab.url.startsWith('chrome://') && !tab.url.startsWith('edge://')) {
                // Send Message to Content Script
                // --- NEW INJECTION LOGIC ---
                // 1. Jor kore Script dhokao (Injection)
                await chrome.scripting.executeScript({
                    target: { tabId: tab.id },
                    files: ['scripts/content.js']
                });

                // 2. Ektu wait koro jeno script ta load hoy
                setTimeout(async () => {
                    // 3. Tarpor Message pathao
                    await chrome.tabs.sendMessage(tab.id, {
                        action: 'SHOW_CAT',
                        fact: currentFact,
                        catIndex: Math.floor(Math.random() * 10)
                    });
                }, 500);
                // ---------------------------
                
                // Update Index for next time
                await db.setIndex(index + 1);
            } else {
                console.log("Skipping restricted tab.");
            }
        }
    } catch (e) {
        console.log("Could not send to tab (maybe page loading):", e);
    }
}