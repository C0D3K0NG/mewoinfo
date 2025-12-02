import { db } from '../scripts/db.js';
pdfjsLib.GlobalWorkerOptions.workerSrc = '../lib/pdf.worker.min.js';

const els = {
    apiKey: document.getElementById('apiKey'),
    interval: document.getElementById('interval'),
    toggle: document.getElementById('toggleExt'),
    file: document.getElementById('pdfUpload'),
    saveBtn: document.getElementById('saveBtn'),
    dlBtn: document.getElementById('downloadBtn'),
    regenBtn: document.getElementById('regenerateBtn'),
    snoozeBtn: document.getElementById('snoozeBtn'),
    historyList: document.getElementById('history-list'),
    
    // Sections
    uploadBox: document.getElementById('upload-container'),
    loadingBox: document.getElementById('loading-container'),
    statusBox: document.getElementById('file-status-container'),
    toastBox: document.getElementById('toast-container')
};

// --- INIT ---
document.addEventListener('DOMContentLoaded', async () => {
    const settings = await db.getSettings();
    const pdfText = await db.getPDFText();
    const history = await db.getHistory();

    els.apiKey.value = settings.apiKey || '';
    els.interval.value = settings.intervalMinutes || 1;
    els.toggle.checked = settings.isEnabled;

    pdfText ? showStatus('done') : showStatus('upload');
    loadHistory(history);
    
    // Check Snooze
    const snoozeUntil = await db.getSnoozeUntil();
    if (Date.now() < snoozeUntil) {
        els.snoozeBtn.innerText = "😴 Snoozing...";
        els.snoozeBtn.disabled = true;
    }
});

// --- UI HELPERS ---
function showStatus(state) {
    els.uploadBox.classList.add('hidden');
    els.loadingBox.classList.add('hidden');
    els.statusBox.classList.add('hidden');
    if (state === 'upload') els.uploadBox.classList.remove('hidden');
    if (state === 'loading') els.loadingBox.classList.remove('hidden');
    if (state === 'done') els.statusBox.classList.remove('hidden');
}

function showToast(msg, type = 'default') {
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.innerText = msg;
    els.toastBox.appendChild(toast);
    setTimeout(() => {
        toast.style.opacity = '0';
        setTimeout(() => toast.remove(), 300);
    }, 3000);
}

function loadHistory(facts) {
    els.historyList.innerHTML = "";
    if (!facts || facts.length === 0) {
        els.historyList.innerHTML = '<li class="empty-state">No meows yet...</li>';
        return;
    }
    facts.forEach(fact => {
        const li = document.createElement('li');
        li.innerText = "🐱 " + fact;
        li.title = fact; // Tooltip on hover
        els.historyList.appendChild(li);
    });
}

// --- LOGIC ---

els.file.addEventListener('change', async () => {
    if (els.file.files.length > 0) {
        showStatus('loading');
        try {
            const text = await extractTextFromPDF(els.file.files[0]);
            await db.setPDFText(text);
            setTimeout(() => {
                showStatus('done');
                showToast("PDF Loaded Successfully!", "green");
            }, 800);
        } catch (e) {
            showStatus('upload');
            showToast("Error: " + e.message, "red");
        }
    }
});

els.saveBtn.addEventListener('click', async () => {
    const apiKey = els.apiKey.value.trim();
    if (!apiKey) return showToast("API Key Required!", "red");

    els.saveBtn.innerText = "Saving...";
    try {
        const txt = await db.getPDFText();
        const facts = await db.getFacts();
        if (txt && facts.length === 0) {
            showToast("Generating Facts... Please wait", "default");
            await chrome.runtime.sendMessage({ action: 'GENERATE_INITIAL' });
        }

        await db.setSettings(apiKey, parseInt(els.interval.value), els.toggle.checked);
        
        if (els.toggle.checked) await chrome.runtime.sendMessage({ action: 'START_ALARM' });
        else await chrome.runtime.sendMessage({ action: 'STOP_ALARM' });

        showToast("Settings Saved!", "green");
    } catch (e) {
        showToast("Save Failed", "red");
    }
    els.saveBtn.innerText = "💾 Save & Start";
});

els.snoozeBtn.addEventListener('click', async () => {
    const snoozeTime = Date.now() + (30 * 60 * 1000); // 30 Mins
    await db.setSnoozeUntil(snoozeTime);
    els.snoozeBtn.innerText = "😴 Snoozing (30m)";
    els.snoozeBtn.disabled = true;
    showToast("Snoozed for 30 mins!", "default");
});

els.dlBtn.addEventListener('click', async () => {
    const facts = await db.getFacts();
    if (!facts.length) return showToast("No facts to download", "red");
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();
    doc.text("Mewoinfo History", 10, 10);
    let y = 20;
    facts.forEach((f, i) => {
        if (y > 280) { doc.addPage(); y = 10; }
        const lines = doc.splitTextToSize(`${i+1}. ${f}`, 180);
        doc.text(lines, 10, y);
        y += (lines.length * 7) + 5;
    });
    doc.save("MeowFacts.pdf");
});

els.regenBtn.addEventListener('click', () => {
    showStatus('upload');
    els.file.value = "";
});

async function extractTextFromPDF(file) {
    const arrayBuffer = await file.arrayBuffer();
    const pdf = await pdfjsLib.getDocument(arrayBuffer).promise;
    let fullText = "";
    for (let i = 1; i <= pdf.numPages; i++) {
        const page = await pdf.getPage(i);
        const textContent = await page.getTextContent();
        fullText += textContent.items.map(i => i.str).join(" ") + "\n";
    }
    return fullText;
}