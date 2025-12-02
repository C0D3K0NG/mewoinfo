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

    // 📋 COPY BUTTON (New)
    const copyBtn = document.createElement('img');
    copyBtn.id = 'mewoinfo-copy';
    // Using a simple embedded SVG for copy icon
    copyBtn.src = 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAyNCAyNCIgZmlsbD0ibm9uZSIgc3Ryb2tlPSIjNGUzNDJlIiBzdHJva2Utd2lkdGg9IjIiIHN0cm9rZS1saW5lY2FwPSJyb3VuZCIgc3Ryb2tlLWxpbmVqb2luPSJyb3VuZCI+PHJlY3QgeD0iOSIgeT0iOSIgd2lkdGg9IjEzIiBoZWlnaHQ9IjEzIiByeD0iMiIgcnk9IjIiPjwvcmVjdD48cGF0aCBkPSJNNSAxNWgyYTIgMiAwIDAgMSAyLTJWM2EyIDIgMCAwIDEgMi0yaDEzIj48L3BhdGg+PC9zdmc+';
    copyBtn.title = "Copy to clipboard";
    copyBtn.onclick = () => {
        navigator.clipboard.writeText(factText);
        copyBtn.style.opacity = '0.3'; // Visual feedback
        setTimeout(() => copyBtn.style.opacity = '1', 200);
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

    autoRemoveTimer = setTimeout(removeCat, 30000);
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