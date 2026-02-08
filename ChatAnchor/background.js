// Aktiviert das Side Panel beim Klick auf das Icon
chrome.sidePanel.setPanelBehavior({ openPanelOnActionClick: true })
    .catch((error) => console.error(error));

// Kontextmenü erstellen
chrome.runtime.onInstalled.addListener(() => {
  chrome.contextMenus.create({
    id: "saveChatAnchor",
    title: "⚓ Chat-Anker hier setzen",
    contexts: ["selection"]
  });
});

// Speichern mit Positions-Abfrage
chrome.contextMenus.onClicked.addListener((info, tab) => {
  if (info.menuItemId === "saveChatAnchor" && info.selectionText) {
    
    // 1. Wir fragen die aktuelle Scroll-Position beim Content Script ab
    chrome.tabs.sendMessage(tab.id, { action: "getScrollPosition" }, (response) => {
      // Falls Fehler (z.B. Seite noch nicht geladen), nehmen wir 0 als Fallback
      const scrollPos = (response && response.ratio) ? response.ratio : 0;

      chrome.storage.local.get(["bookmarks"], (result) => {
        const currentBookmarks = result.bookmarks || [];
        const newBookmark = {
          id: Date.now(),
          text: info.selectionText.substring(0, 50),
          fullText: info.selectionText,
          url: tab.url,
          date: new Date().toLocaleString(),
          scrollRatio: scrollPos // <--- Hier speichern wir die %-Position
        };
        
        chrome.storage.local.set({ bookmarks: [newBookmark, ...currentBookmarks] }, () => {
          chrome.tabs.sendMessage(tab.id, { action: "showConfirmation", text: "Anker & Position gespeichert! ⚓" });
        });
      });
    });
  }
});