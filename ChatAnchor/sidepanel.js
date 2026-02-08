document.addEventListener('DOMContentLoaded', () => {
    const listDiv = document.getElementById('list');
    const clearBtn = document.getElementById('clearBtn');

    // 1. Bookmarks laden und anzeigen
    chrome.storage.local.get({ bookmarks: [] }, (data) => {
        if (data.bookmarks.length === 0) {
            listDiv.innerHTML = "<p style='color:#666; font-size:13px; text-align:center; padding-top:20px;'>Noch keine Anker gesetzt.<br>Markiere Text im Chat!</p>";
            return;
        }

        data.bookmarks.forEach(bm => {
            const item = document.createElement('div');
            item.className = 'bookmark-item';
            
            // Domain hübsch machen (z.B. "chatgpt.com")
            let domain = new URL(bm.url).hostname.replace('www.', '');
            
            item.innerHTML = `
                <span class="text-preview">"${bm.text}..."</span>
                <div class="meta-info">
                    <span>${domain}</span>
                    <span>${bm.date.split(',')[0]}</span>
                </div>
            `;
            
            // Klick-Event
            item.onclick = () => handleBookmarkClick(bm);
            listDiv.appendChild(item);
        });
    });

    // 2. Die neue "Smart-Switch"-Logik
    function handleBookmarkClick(bookmark) {
        // Wir bereinigen die URL, um sie zu vergleichen (Ignoriere alles nach #)
        const targetUrlClean = bookmark.url.split('#')[0];

        // Wir suchen in ALLEN Tabs in ALLEN Fenstern
        chrome.tabs.query({}, (tabs) => {
            // Finde einen Tab, der mit der gleichen URL beginnt
            const existingTab = tabs.find(tab => tab.url.startsWith(targetUrlClean));

            if (existingTab) {
                // FALL A: Der Chat ist schon offen -> HINGEHEN
                
                // 1. Tab aktivieren
                chrome.tabs.update(existingTab.id, { active: true });
                // 2. Fenster in den Vordergrund holen (falls es minimiert oder im Hintergrund ist)
                chrome.windows.update(existingTab.windowId, { focused: true });

                // 3. Nachricht zum Scrollen senden
                // Wir warten 500ms, falls der Browser kurz braucht, um den Tab "aufzuwecken"
                setTimeout(() => {
                    chrome.tabs.sendMessage(existingTab.id, { 
                        action: "jumpToText", 
                        text: bookmark.fullText 
                    });
                }, 500);

            } else {
                // FALL B: Chat ist nicht offen -> NEU ÖFFNEN
                chrome.tabs.create({ url: bookmark.url }, (newTab) => {
                    // Warten bis der Tab fertig geladen ist
                    const listener = (tabId, changeInfo) => {
                        if (tabId === newTab.id && changeInfo.status === 'complete') {
                            // Bei neuen Tabs geben wir der KI-Seite etwas mehr Zeit zum Rendern (2.5s)
                            setTimeout(() => {
                                chrome.tabs.sendMessage(newTab.id, { 
                                    action: "jumpToText", 
                                    text: bookmark.fullText 
                                });
                            }, 2500);
                            chrome.tabs.onUpdated.removeListener(listener);
                        }
                    };
                    chrome.tabs.onUpdated.addListener(listener);
                });
            }
        });
    }

    // 3. Lösch-Funktion
    clearBtn.onclick = () => {
        if(confirm("Wirklich alle Anker löschen?")) {
            chrome.storage.local.set({ bookmarks: [] }, () => location.reload());
        }
    };
});