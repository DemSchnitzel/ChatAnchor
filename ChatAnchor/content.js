chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === "jumpToText") {
        attemptScrollAndFind(request.text, 0);
        sendResponse({ status: "searching" });
    } else if (request.action === "showConfirmation") {
        showStatusMessage(request.text);
        sendResponse({ status: "confirmed" });
    }
    return true;
});

function attemptScrollAndFind(text, attempts) {
    const cleanText = text.trim();
    // 1. Exakte Suche
    let found = window.find(cleanText, false, false, true);

    // 2. Fallback: Suche nach den ersten 25 Zeichen
    if (!found && cleanText.length > 20) {
        found = window.find(cleanText.substring(0, 25), false, false, true);
    }

    if (found) {
        const selection = window.getSelection();
        if (selection.rangeCount > 0) {
            const range = selection.getRangeAt(0);
            const element = range.startContainer.parentElement;
            
            element.scrollIntoView({ behavior: 'smooth', block: 'center' });
            
            // Highlight
            element.style.transition = "outline 0.5s, background-color 0.5s";
            element.style.outline = "3px solid #1a73e8";
            element.style.backgroundColor = "rgba(26, 115, 232, 0.1)";
            setTimeout(() => {
                element.style.outline = "none";
                element.style.backgroundColor = "transparent";
            }, 3000);
        }
    } else if (attempts < 30) { 
        // 3. Scrollen und weitersuchen
        const chatContainer = document.querySelector('infinite-scroller') || window;
        chatContainer.scrollBy(0, -800);
        
        setTimeout(() => {
            attemptScrollAndFind(text, attempts + 1);
        }, 400); 
    } else {
        console.log("ChatAnchor: Text nicht gefunden.");
        showStatusMessage("Text nicht gefunden. Scrolle manuell etwas höher.");
    }
}

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