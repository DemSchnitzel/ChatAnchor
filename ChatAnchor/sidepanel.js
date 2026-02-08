document.addEventListener('DOMContentLoaded', () => {
    const listDiv = document.getElementById('list');
    const clearBtn = document.getElementById('clearBtn');

    // 1. Bookmarks laden
    chrome.storage.local.get({ bookmarks: [] }, (data) => {
        if (data.bookmarks.length === 0) {
            listDiv.innerHTML = "<p style='color:#666; font-size:13px; text-align:center; padding-top:20px;'>Noch keine Anker gesetzt.<br>Markiere Text im Chat!</p>";
            return;
        }

        data.bookmarks.forEach(bm => {
            const item = document.createElement('div');
            item.className = 'bookmark-item';
            
            let domain = "Link";
            try {
                if (bm.url) domain = new URL(bm.url).hostname.replace('www.', '');
            } catch (e) {}

            item.innerHTML = `
                <span class="text-preview">"${bm.text}..."</span>
                <div class="meta-info">
                    <span>${domain}</span>
                    <span>${bm.date.split(',')[0]}</span>
                </div>
            `;
            
            item.onclick = () => handleBookmarkClick(bm);
            listDiv.appendChild(item);
        });
    });

    // 2. Smart-Switch Logik
    function handleBookmarkClick(bookmark) {
        if (!bookmark.url) return;
        const targetUrlClean = bookmark.url.split('#')[0];

        chrome.tabs.query({}, (tabs) => {
            const existingTab = tabs.find(tab => tab.url && tab.url.startsWith(targetUrlClean));

            if (existingTab) {
                // A: Tab schon offen
                chrome.tabs.update(existingTab.id, { active: true });
                chrome.windows.update(existingTab.windowId, { focused: true });

                setTimeout(() => {
                    chrome.tabs.sendMessage(existingTab.id, { 
                        action: "jumpToText", 
                        text: bookmark.fullText,
                        scrollRatio: bookmark.scrollRatio // <--- WICHTIG: Das hat gefehlt!
                    });
                }, 500);

            } else {
                // B: Neu öffnen
                chrome.tabs.create({ url: bookmark.url }, (newTab) => {
                    const listener = (tabId, changeInfo) => {
                        if (tabId === newTab.id && changeInfo.status === 'complete') {
                            setTimeout(() => {
                                chrome.tabs.sendMessage(newTab.id, { 
                                    action: "jumpToText", 
                                    text: bookmark.fullText,
                                    scrollRatio: bookmark.scrollRatio 
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

    clearBtn.onclick = () => {
        if(confirm("Wirklich alle Anker löschen?")) {
            chrome.storage.local.set({ bookmarks: [] }, () => location.reload());
        }
    };
});