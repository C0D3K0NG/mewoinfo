console.log("😺 MEWOINFO: Script has started running!"); // DEBUG LINE

let autoRemoveTimer = null;

// Listen for messages from Background Script
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    console.log("📩 Message received:", request); // DEBUG LINE
    
    if (request.action === "SHOW_CAT") {
        showMeowFact(request.fact, request.catIndex);
    }
});

function showMeowFact(factText, catIndex) {
    console.log("🐈 Showing Cat:", factText); // DEBUG LINE

    removeCat(); // Clean up old cat

    // 1. Create Container
    const container = document.createElement('div');
    container.id = 'mewoinfo-container';

    // 2. Create Bubble
    const bubble = document.createElement('div');
    bubble.id = 'mewoinfo-bubble';
    
    const textSpan = document.createElement('span');
    textSpan.innerText = factText;
    bubble.appendChild(textSpan);

    const closeBtn = document.createElement('div');
    closeBtn.id = 'mewoinfo-close';
    closeBtn.innerText = '×';
    closeBtn.onclick = removeCat;
    bubble.appendChild(closeBtn);

    // 3. Create Cat Image
    const catImg = document.createElement('img');
    catImg.id = 'mewoinfo-cat';
    
    // IMAGE PATH CHECK
    const gifUrl = chrome.runtime.getURL(`cat_gifs/cat${catIndex}.gif`);
    catImg.src = gifUrl;
    catImg.onclick = removeCat;

    // 4. Assemble
    container.appendChild(bubble);
    container.appendChild(catImg);
    document.body.appendChild(container);

    // 5. Timer
    autoRemoveTimer = setTimeout(() => {
        removeCat();
    }, 30000); 
}

function removeCat() {
    const existing = document.getElementById('mewoinfo-container');
    if (existing) {
        existing.style.animation = 'fadeOut 0.5s forwards';
        setTimeout(() => {
            if (existing && existing.parentNode) {
                existing.parentNode.removeChild(existing);
            }
        }, 500);
    }
    if (autoRemoveTimer) {
        clearTimeout(autoRemoveTimer);
        autoRemoveTimer = null;
    }
}