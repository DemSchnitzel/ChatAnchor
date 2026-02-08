document.addEventListener('DOMContentLoaded', () => {
    const listDiv = document.getElementById('list');
    const clearBtn = document.getElementById('clearBtn');

    // Bookmarks laden und anzeigen
    chrome.storage.local.get({ bookmarks: [] }, (data) => {
        if (data.bookmarks.length === 0) {
            listDiv.innerHTML = "<p>Noch keine Anker gesetzt. Markiere Text im Chat!</p>";
            return;
        }

        data.bookmarks.forEach(bm => {
            const item = document.createElement('div');
            item.className = 'bookmark-item';
            item.innerHTML = `
                <span class="text-preview">"${bm.text}..."</span>
                <span class="date">${bm.date}</span>
            `;
            
            item.onclick = () => {
                chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
                    if (tabs[0]) {
                        chrome.tabs.sendMessage(tabs[0].id, { action: "jumpToText", text: bm.fullText });
                    }
                });
            };
            listDiv.appendChild(item);
        });
    });

    // Alles löschen
    clearBtn.onclick = () => {
        chrome.storage.local.set({ bookmarks: [] }, () => {
            listDiv.innerHTML = "<p>Gelöscht!</p>";
            setTimeout(() => location.reload(), 500);
        });
    };
});