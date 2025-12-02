console.log("😺 MEWOINFO: Script has started running!");

let autoRemoveTimer = null;

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === "SHOW_CAT") {
        showMeowFact(request.fact, request.catIndex);
    }
});

function showMeowFact(factText, catIndex) {
    removeCat();

    // 1. Create Container & Bubble
    const container = document.createElement('div');
    container.id = 'mewoinfo-container';

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

    // --- 🔊 SOUND EFFECT ---
    const soundUrl = chrome.runtime.getURL('sounds/meow.mp3');
    const audio = new Audio(soundUrl);
    audio.volume = 0.4; // Volume kom rakhlam
    audio.play().catch(e => console.log("Audio blocked until interaction"));

    // 2. Create Cat Image
    const catImg = document.createElement('img');
    catImg.id = 'mewoinfo-cat';
    catImg.src = chrome.runtime.getURL(`cat_gifs/cat${catIndex}.gif`);
    catImg.onclick = removeCat;

    // 3. Assemble
    container.appendChild(bubble);
    container.appendChild(catImg);
    document.body.appendChild(container);

    // 4. Timer
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