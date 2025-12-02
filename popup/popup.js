import { db } from '../scripts/db.js';

// Setup Worker for PDF.js (Crucial!)
pdfjsLib.GlobalWorkerOptions.workerSrc = '../lib/pdf.worker.min.js';

// UI Elements
const apiKeyInput = document.getElementById('apiKey');
const intervalInput = document.getElementById('interval');
const toggleInput = document.getElementById('toggleExt');
const fileInput = document.getElementById('pdfUpload');
const saveBtn = document.getElementById('saveBtn');
const downloadBtn = document.getElementById('downloadBtn');
const regenerateBtn = document.getElementById('regenerateBtn');
const msgBox = document.getElementById('msg');
const fileStatus = document.getElementById('file-status');

// --- 1. Load Saved Settings on Open ---
document.addEventListener('DOMContentLoaded', async () => {
    const settings = await db.getSettings();
    const pdfText = await db.getPDFText();

    // Fill Inputs
    apiKeyInput.value = settings.apiKey || '';
    intervalInput.value = settings.intervalMinutes || 1;
    toggleInput.checked = settings.isEnabled;

    // Show PDF Status
    if (pdfText) {
        fileStatus.classList.remove('hidden');
        fileInput.classList.add('hidden'); // Hide upload if exists
        regenerateBtn.classList.remove('hidden'); // Show regen button
    }
});

// --- 2. Handle Logic ---

// Toggle "Regenerate" mode
regenerateBtn.addEventListener('click', () => {
    fileStatus.classList.add('hidden');
    fileInput.classList.remove('hidden'); // Show upload input again
    regenerateBtn.classList.add('hidden');
    msgBox.innerText = "Upload a new PDF to replace the old one.";
});

// Save & Start Button
saveBtn.addEventListener('click', async () => {
    const apiKey = apiKeyInput.value.trim();
    const interval = parseInt(intervalInput.value);
    const isEnabled = toggleInput.checked;

    if (!apiKey) {
        showMsg("❌ API Key is required!", "red");
        return;
    }

    showMsg("💾 Saving & Processing...", "blue");

    try {
        // A. Handle PDF Upload (if new file selected)
        if (fileInput.files.length > 0) {
            showMsg("📄 Reading PDF...", "blue");
            const text = await extractTextFromPDF(fileInput.files[0]);
            await db.setPDFText(text);
            
            // Trigger Background to Generate Initial Facts
            showMsg("😼 Generating Meow Facts...", "blue");
            const response = await chrome.runtime.sendMessage({ action: 'GENERATE_INITIAL' });
            
            if (!response.success) throw new Error(response.error);
        }

        // B. Save Settings
        await db.setSettings(apiKey, interval, isEnabled);

        // C. Update Alarm
        if (isEnabled) {
            await chrome.runtime.sendMessage({ action: 'START_ALARM' });
        } else {
            await chrome.runtime.sendMessage({ action: 'STOP_ALARM' });
        }

        showMsg("✅ Saved! Meow mode active.", "green");
        
        // Refresh UI state
        if (fileInput.files.length > 0) {
            fileStatus.classList.remove('hidden');
            fileInput.classList.add('hidden');
            fileInput.value = ""; // Reset input
            regenerateBtn.classList.remove('hidden');
        }

    } catch (err) {
        console.error(err);
        showMsg("❌ Error: " + err.message, "red");
    }
});

// Download Facts as PDF
downloadBtn.addEventListener('click', async () => {
    const facts = await db.getFacts();
    if (!facts || facts.length === 0) {
        showMsg("⚠️ No facts generated yet!", "orange");
        return;
    }

    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();

    doc.setFontSize(20);
    doc.text("Mewoinfo - Collected Facts", 10, 20);
    
    doc.setFontSize(12);
    let y = 40;
    
    facts.forEach((fact, index) => {
        if (y > 280) { // New page if bottom reached
            doc.addPage();
            y = 20;
        }
        // Split text to fit width
        const lines = doc.splitTextToSize(`${index + 1}. ${fact}`, 180);
        doc.text(lines, 10, y);
        y += (lines.length * 7) + 5; // Adjust spacing
    });

    doc.save("Meow_Facts.pdf");
});

// --- Helper: Extract Text from PDF ---
async function extractTextFromPDF(file) {
    const arrayBuffer = await file.arrayBuffer();
    const pdf = await pdfjsLib.getDocument(arrayBuffer).promise;
    
    let fullText = "";
    
    // Loop through all pages
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
}

// Allow pressing "Enter" in the API Key box to Save
apiKeyInput.addEventListener("keypress", (event) => {
    if (event.key === "Enter") {
        saveBtn.click(); // Automatically clicks the Save button for you
    }
});