chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === "jumpToText") {
        // Wir starten die Suche
        attemptScrollAndFind(request.text, 0);
        sendResponse({ status: "searching" });
    }
    // --- NEU: Auf Bestätigung reagieren ---
    else if (request.action === "showConfirmation") {
        showStatusMessage(request.text);
        sendResponse({ status: "confirmed" });
    }
    return true;
});

function attemptScrollAndFind(text, attempts) {
    // 1. Bereinige den Suchtext von seltsamen Leerzeichen
    const cleanText = text.trim();
    
    // 2. Suche den Text (window.find ist schnell, aber sensibel)
    let found = window.find(cleanText, false, false, true);

    // 3. Falls nicht gefunden, versuchen wir es mit einer Teilsuche (ersten 20 Zeichen)
    if (!found && cleanText.length > 20) {
        found = window.find(cleanText.substring(0, 25), false, false, true);
    }

    if (found) {
        const selection = window.getSelection();
        if (selection.rangeCount > 0) {
            const range = selection.getRangeAt(0);
            const element = range.startContainer.parentElement;
            
            element.scrollIntoView({ behavior: 'smooth', block: 'center' });
            
            // Visuelles Highlight
            element.style.transition = "outline 0.5s, background-color 0.5s";
            element.style.outline = "3px solid #1a73e8";
            element.style.backgroundColor = "rgba(26, 115, 232, 0.1)";
            setTimeout(() => {
                element.style.outline = "none";
                element.style.backgroundColor = "transparent";
            }, 3000);
        }
    } else if (attempts < 30) { 
        // 4. Weitermachen: Scrolle höher
        // Wir nutzen hier scrollBy auf dem Haupt-Container, falls vorhanden, sonst window
        const chatContainer = document.querySelector('infinite-scroller') || window;
        chatContainer.scrollBy(0, -800);
        
        // Erhöhe die Zeit leicht, damit Gemini Zeit zum "Atmen" hat
        setTimeout(() => {
            attemptScrollAndFind(text, attempts + 1);
        }, 400); 
    } else {
        // Statt alert() nutzen wir jetzt die Konsole, um den Nutzer nicht zu nerven
        console.log("ChatAnchor: Text nicht gefunden nach 30 Versuchen.");
        // Optional: Ein kleiner Hinweis am oberen Rand der Seite statt Popup
        showStatusMessage("Text im Verlauf nicht gefunden. Scrolle manuell etwas höher.");
    }
}

// Hilfsfunktion für unaufdringliche Nachrichten
function showStatusMessage(msg) {
    let statusDiv = document.getElementById('chat-anchor-status');
    if (!statusDiv) {
        statusDiv = document.createElement('div');
        statusDiv.id = 'chat-anchor-status';
        statusDiv.style = "position: fixed; top: 20px; left: 50%; transform: translateX(-50%); background: #323232; color: white; padding: 10px 20px; border-radius: 20px; z-index: 9999; font-family: sans-serif; font-size: 13px; opacity: 0; transition: opacity 0.5s;";
        document.body.appendChild(statusDiv);
    }
    statusDiv.innerText = msg;
    statusDiv.style.opacity = "1";
    setTimeout(() => { statusDiv.style.opacity = "0"; }, 4000);
}