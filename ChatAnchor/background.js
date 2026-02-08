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

// Speichern und Bestätigen
chrome.contextMenus.onClicked.addListener((info, tab) => {
  if (info.menuItemId === "saveChatAnchor" && info.selectionText) {
    chrome.storage.local.get(["bookmarks"], (result) => {
      const currentBookmarks = result.bookmarks || [];
      const newBookmark = {
        id: Date.now(),
        text: info.selectionText.substring(0, 50),
        fullText: info.selectionText,
        url: tab.url,
        date: new Date().toLocaleString()
      };
      
      chrome.storage.local.set({ bookmarks: [newBookmark, ...currentBookmarks] }, () => {
        // Bestätigung an den Tab senden
        chrome.tabs.sendMessage(tab.id, { action: "showConfirmation", text: "Anker erfolgreich gesetzt! ⚓" });
      });
    });
  }
});