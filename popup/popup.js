import { db } from '../scripts/db.js';

pdfjsLib.GlobalWorkerOptions.workerSrc = '../lib/pdf.worker.min.js';

// UI Elements (Updated IDs)
const apiKeyInput = document.getElementById('apiKey');
const intervalInput = document.getElementById('interval');
const toggleInput = document.getElementById('toggleExt');
const fileInput = document.getElementById('pdfUpload');
const saveBtn = document.getElementById('saveBtn');
const downloadBtn = document.getElementById('downloadBtn');
const regenerateBtn = document.getElementById('regenerateBtn');
const msgBox = document.getElementById('msg');

// PDF Section Containers
const uploadContainer = document.getElementById('upload-container');
const loadingContainer = document.getElementById('loading-container');
const fileStatusContainer = document.getElementById('file-status-container');

// --- 1. Load Saved Settings on Open ---
document.addEventListener('DOMContentLoaded', async () => {
    const settings = await db.getSettings();
    const pdfText = await db.getPDFText();

    apiKeyInput.value = settings.apiKey || '';
    intervalInput.value = settings.intervalMinutes || 1;
    toggleInput.checked = settings.isEnabled;

    // Check PDF Status
    if (pdfText) {
        showFileDoneState();
    } else {
        showUploadState();
    }

    // Check Active State -> Fade Save Button if already running
    if (settings.isEnabled && settings.apiKey && pdfText) {
       updateSaveButtonState(true); // Make it look disabled
    }
});

// --- UI Helper Functions for PDF States ---
function showLoading() {
    uploadContainer.classList.add('hidden');
    fileStatusContainer.classList.add('hidden');
    loadingContainer.classList.remove('hidden');
    msgBox.innerText = "";
}

function showFileDoneState() {
    loadingContainer.classList.add('hidden');
    uploadContainer.classList.add('hidden');
    fileStatusContainer.classList.remove('hidden');
}

function showUploadState() {
    loadingContainer.classList.add('hidden');
    fileStatusContainer.classList.add('hidden');
    uploadContainer.classList.remove('hidden');
    fileInput.value = ""; // Reset file selection
}

// Helper to manage Save button state
function updateSaveButtonState(isActive) {
    if (isActive) {
        saveBtn.classList.add('disabled-look');
        saveBtn.innerHTML = "🐱 Active & Running";
        // We don't actually disable `saveBtn.disabled = true` because user might want to update settings,
        // but visually it looks faded to indicate it's already ON.
    } else {
        saveBtn.classList.remove('disabled-look');
        saveBtn.innerHTML = "💾 Save & Start";
    }
}


// --- 2. Event Listeners ---

// Handle File Selection (Triggers Loading)
fileInput.addEventListener('change', async () => {
    if (fileInput.files.length > 0) {
        showLoading(); // Start Loading UI
        try {
            const text = await extractTextFromPDF(fileInput.files[0]);
            await db.setPDFText(text);
            // Wait a tiny bit for visual effect
            setTimeout(() => {
                 showFileDoneState(); // Done UI
                 showMsg("PDF processed successfully!", "green");
            }, 500);
           
        } catch (error) {
            console.error(error);
            showUploadState(); // Revert on error
            showMsg("❌ Error reading PDF: " + error.message, "red");
        }
    }
});


// Toggle "Regenerate" mode
regenerateBtn.addEventListener('click', () => {
    showUploadState();
    showMsg("Upload a new PDF to replace.", "#e67e5f");
});

// Save & Start Button
saveBtn.addEventListener('click', async () => {
    const apiKey = apiKeyInput.value.trim();
    const interval = parseInt(intervalInput.value);
    const isEnabled = toggleInput.checked;

    if (!apiKey) {
        showMsg("❌ Key missing!", "red");
        return;
    }

    // Immediately disable button visually to prevent double clicks
    saveBtn.classList.add('disabled-look');
    saveBtn.innerHTML = "⏳ Processing...";
    showMsg("Saving...", "blue");

    try {
        // Check if we need initial generation (only if text exists but no facts yet)
        const currentText = await db.getPDFText();
        const currentFacts = await db.getFacts();

        if (currentText && currentFacts.length === 0) {
             showMsg("😼 Generating first facts... (Wait)", "blue");
             const response = await chrome.runtime.sendMessage({ action: 'GENERATE_INITIAL' });
             if (!response.success) throw new Error(response.error);
        }

        // Save Settings
        await db.setSettings(apiKey, interval, isEnabled);

        // Update Alarm
        if (isEnabled) {
            await chrome.runtime.sendMessage({ action: 'START_ALARM' });
        } else {
            await chrome.runtime.sendMessage({ action: 'STOP_ALARM' });
        }

        showMsg("✅ Saved! Meow mode active.", "green");
        updateSaveButtonState(isEnabled); // Update button look based on final state

    } catch (err) {
        console.error(err);
        showMsg("❌ Error: " + err.message, "red");
        updateSaveButtonState(false); // Revert button if error
    }
});

// Download Facts as PDF
downloadBtn.addEventListener('click', async () => {
    const facts = await db.getFacts();
    if (!facts || facts.length === 0) {
        showMsg("⚠️ No facts yet!", "orange");
        return;
    }

    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();
    // ... (PDF generation code same as before) ...
    doc.setFontSize(20);
    doc.text("Mewoinfo - Collected Facts", 10, 20);
    doc.setFontSize(12);
    let y = 40;
    facts.forEach((fact, index) => {
        if (y > 280) { doc.addPage(); y = 20; }
        const lines = doc.splitTextToSize(`${index + 1}. ${fact}`, 180);
        doc.text(lines, 10, y);
        y += (lines.length * 7) + 5;
    });
    doc.save("Meow_Facts.pdf");
});


// --- Helper: Extract Text from PDF (Same as before) ---
async function extractTextFromPDF(file) {
    const arrayBuffer = await file.arrayBuffer();
    const pdf = await pdfjsLib.getDocument(arrayBuffer).promise;
    let fullText = "";
    for (let i = 1; i <= pdf.numPages; i++) {
        const page = await pdf.getPage(i);
        const textContent = await page.getTextContent();
        const pageText = textContent.items.map(item => item.str).join(" ");
        fullText += pageText + "\n";
    }
    return fullText;
}

function showMsg(text, color) {
    msgBox.innerText = text;
    msgBox.style.color = color;
    // Auto-clear message after 3 seconds
    setTimeout(() => { msgBox.innerText = ""; }, 3000);
}