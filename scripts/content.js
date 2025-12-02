// Variable to keep track of the timer so we can cancel it if needed
let autoRemoveTimer = null;

// Listen for messages from Background Script
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === "SHOW_CAT") {
        showMeowFact(request.fact, request.catIndex);
    }
});

function showMeowFact(factText, catIndex) {
    // 1. Check if already exists, remove it first (clean slate)
    removeCat();

    // 2. Create Container
    const container = document.createElement('div');
    container.id = 'mewoinfo-container';

    // 3. Create Bubble
    const bubble = document.createElement('div');
    bubble.id = 'mewoinfo-bubble';
    
    // Add Text
    const textSpan = document.createElement('span');
    textSpan.innerText = factText;
    bubble.appendChild(textSpan);

    // Add Close Button
    const closeBtn = document.createElement('div');
    closeBtn.id = 'mewoinfo-close';
    closeBtn.innerText = '×';
    closeBtn.onclick = removeCat; // Click to close immediately
    bubble.appendChild(closeBtn);

    // 4. Create Cat Image
    const catImg = document.createElement('img');
    catImg.id = 'mewoinfo-cat';
    
    // IMPORTANT: Get correct URL for the extension file
    // Assumes files are named cat0.gif, cat1.gif ... cat9.gif
    const gifUrl = chrome.runtime.getURL(`cat_gifs/cat${catIndex}.gif`);
    catImg.src = gifUrl;

    // Optional: Click cat to dismiss too
    catImg.onclick = removeCat;

    // 5. Assemble
    container.appendChild(bubble);
    container.appendChild(catImg);

    // 6. Inject into the webpage
    document.body.appendChild(container);

    // 7. Auto Remove after 30 Seconds
    autoRemoveTimer = setTimeout(() => {
        removeCat();
    }, 30000); // 30000 ms = 30 seconds
}

function removeCat() {
    const existing = document.getElementById('mewoinfo-container');
    if (existing) {
        // Add fade out effect
        existing.style.animation = 'fadeOut 0.5s forwards';
        
        // Remove from DOM after animation finishes
        setTimeout(() => {
            if (existing && existing.parentNode) {
                existing.parentNode.removeChild(existing);
            }
        }, 500); // Wait for 0.5s animation
    }
    
    // Clear timer if it exists (so it doesn't try to remove non-existent cat)
    if (autoRemoveTimer) {
        clearTimeout(autoRemoveTimer);
        autoRemoveTimer = null;
    }
}