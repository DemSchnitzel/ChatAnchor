chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === "jumpToText") {
        // Starte den intelligenten Sprung mit Position
        smartJump(request.text, request.scrollRatio || 0);
        sendResponse({ status: "searching" });
    } 
    else if (request.action === "getScrollPosition") {
        // Berechne die aktuelle Position in Prozent für das Speichern
        const scroller = getScrollParent();
        let ratio = 0;
        if (scroller === window) {
            ratio = window.scrollY / document.documentElement.scrollHeight;
        } else {
            ratio = scroller.scrollTop / scroller.scrollHeight;
        }
        sendResponse({ ratio: ratio });
    } 
    else if (request.action === "showConfirmation") {
        showStatusMessage(request.text);
        sendResponse({ status: "confirmed" });
    }
    return true;
});

// Hilfsfunktion: Findet automatisch das Element, das gescrollt werden kann
function getScrollParent() {
    // Wir suchen nach Containern, die scrollbar sind (wichtig für Gemini/ChatGPT)
    const candidates = document.querySelectorAll('div, main, article, [role="main"], .infinite-scroller');
    let bestCandidate = window;
    let maxScrollHeight = 0;

    candidates.forEach(el => {
        const style = window.getComputedStyle(el);
        const isScrollable = (style.overflowY === 'auto' || style.overflowY === 'scroll') && el.scrollHeight > el.clientHeight;
        
        if (isScrollable && el.scrollHeight > maxScrollHeight) {
            maxScrollHeight = el.scrollHeight;
            bestCandidate = el;
        }
    });
    return bestCandidate;
}

async function smartJump(text, ratio) {
    const scroller = getScrollParent();
    
    // SCHRITT 1: Sofort zur prozentualen Stelle springen
    // Das zwingt Gemini, den Inhalt dort nachzuladen
    const targetY = scroller.scrollHeight * ratio;
    
    if (scroller === window) window.scrollTo(0, targetY);
    else scroller.scrollTop = targetY;

    // SCHRITT 2: Warten (1 Sekunde), damit Gemini Zeit hat, die "leeren" Bereiche zu füllen
    await new Promise(r => setTimeout(r, 1000));

    // SCHRITT 3: Jetzt die präzise Textsuche starten
    attemptScrollAndFind(text, 0);
}

function attemptScrollAndFind(text, attempts) {
    const cleanText = text.trim();
    
    // Suche: Exakt
    let found = window.find(cleanText, false, false, true);
    
    // Suche: Fallback (erste 25 Zeichen)
    if (!found && cleanText.length > 20) {
        found = window.find(cleanText.substring(0, 25), false, false, true);
    }

    if (found) {
        const sel = window.getSelection();
        if (sel.rangeCount > 0) {
            const el = sel.getRangeAt(0).startContainer.parentElement;
            el.scrollIntoView({ behavior: 'smooth', block: 'center' });
            
            // Highlight
            el.style.transition = "outline 0.5s, background-color 0.5s";
            el.style.outline = "3px solid #1a73e8";
            el.style.backgroundColor = "rgba(26, 115, 232, 0.2)";
            setTimeout(() => { 
                el.style.outline = "none"; 
                el.style.backgroundColor = "transparent"; 
            }, 3000);
        }
    } else if (attempts < 10) { 
        // Kleine Feinjustierung, falls wir knapp daneben gelandet sind
        const scroller = getScrollParent();
        scroller.scrollBy(0, -500); 
        setTimeout(() => attemptScrollAndFind(text, attempts + 1), 500);
    } else {
        console.log("ChatAnchor: Text nicht exakt gefunden.");
        showStatusMessage("Position erreicht! (Text evtl. nicht geladen)");
    }
}

function showStatusMessage(msg) {
    let div = document.getElementById('chat-anchor-status');
    if (!div) {
        div = document.createElement('div');
        div.id = 'chat-anchor-status';
        div.style = "position: fixed; top: 20px; left: 50%; transform: translateX(-50%); background: #202124; color: white; padding: 12px 24px; border-radius: 24px; z-index: 99999; font-family: sans-serif; font-size: 14px; box-shadow: 0 4px 12px rgba(0,0,0,0.2); opacity: 0; transition: opacity 0.3s;";
        document.body.appendChild(div);
    }
    div.innerText = msg;
    div.style.opacity = "1";
    setTimeout(() => div.style.opacity = "0", 4000);
}