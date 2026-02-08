// Erstellt das Rechtsklick-Menü
chrome.runtime.onInstalled.addListener(() => {
  chrome.contextMenus.create({
    id: "saveChatAnchor",
    title: "⚓ Chat-Anker hier setzen",
    contexts: ["selection"]
  });
  console.log("Kontextmenü registriert.");
});

// Lauscht auf den Klick
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
        // --- NEU: Bestätigung an die Seite senden ---
        chrome.tabs.sendMessage(tab.id, { action: "showConfirmation", text: "Anker erfolgreich gesetzt! ⚓" });
      });
    });
  }
});