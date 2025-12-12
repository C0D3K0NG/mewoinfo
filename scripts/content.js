let autoRemoveTimer = null;

chrome.runtime.onMessage.addListener((request) => {
    if (request.action === "SHOW_CAT") {
        showMeowFact(request.fact, request.catIndex);
    }
});

function showMeowFact(factText, catIndex) {
    removeCat();

    const container = document.createElement('div');
    container.id = 'mewoinfo-container';

    // --- Bubble ---
    const bubble = document.createElement('div');
    bubble.id = 'mewoinfo-bubble';
    
    const textSpan = document.createElement('span');
    textSpan.innerText = factText;
    bubble.appendChild(textSpan);
    

    // Close Button
    const closeBtn = document.createElement('div');
    closeBtn.id = 'mewoinfo-close';
    closeBtn.innerText = '×';
    closeBtn.onclick = removeCat;
    bubble.appendChild(closeBtn);

    // 📋 COPY BUTTON (SVG Icon - No CDN needed)
    const copyBtn = document.createElement('div');
    copyBtn.id = 'mewoinfo-copy';
    copyBtn.title = "Copy to clipboard";
    copyBtn.innerHTML = '📋'; // Simple clipboard emoji as fallback
    copyBtn.style.cursor = 'pointer';
    copyBtn.onclick = (e) => {
        e.stopPropagation();
        navigator.clipboard.writeText(factText).then(() => {
            // Visual feedback
            copyBtn.innerHTML = '✓'; // Show checkmark on success
            setTimeout(() => copyBtn.innerHTML = '📋', 500);
        });
    };
    bubble.appendChild(copyBtn);

    // --- Sound ---
    try {
        const soundUrl = chrome.runtime.getURL('sounds/meow.mp3');
        const audio = new Audio(soundUrl);
        audio.volume = 0.4;
        audio.play().catch(() => {});
    } catch(e){}

    // --- Cat Image & Petting Logic 😻 ---
    const catImg = document.createElement('img');
    catImg.id = 'mewoinfo-cat';
    catImg.src = chrome.runtime.getURL(`cat_gifs/cat${catIndex}.gif`);
    
    // PETTING EVENT
    catImg.onclick = (e) => {
        // Stop timer restart if petting
        if(autoRemoveTimer) clearTimeout(autoRemoveTimer);
        
        // Add Bounce
        catImg.classList.add('cat-bounce');
        
        // Spawn Heart
        spawnHeart(e.clientX, e.clientY);

        // Sound? Optional
        // Remove bounce after 1s
        setTimeout(() => catImg.classList.remove('cat-bounce'), 1000);
        
        // Restart remove timer
        autoRemoveTimer = setTimeout(removeCat, 30000);
    };

    container.appendChild(bubble);
    container.appendChild(catImg);
    document.body.appendChild(container);

    autoRemoveTimer = setTimeout(removeCat, 60000);
}

function spawnHeart(x, y) {
    const heart = document.createElement('div');
    heart.innerText = '❤️';
    heart.className = 'mewo-heart';
    heart.style.left = (x - 10) + 'px';
    heart.style.top = (y - 30) + 'px';
    document.body.appendChild(heart);
    setTimeout(() => heart.remove(), 1000);
}

function removeCat() {
    const existing = document.getElementById('mewoinfo-container');
    if (existing) {
        existing.style.animation = 'fadeOut 0.5s forwards';
        setTimeout(() => { if (existing) existing.remove(); }, 500);
    }
}