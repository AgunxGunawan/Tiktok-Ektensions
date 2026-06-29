// Background Service Worker (Manifest V3)

// Fungsi untuk memperbarui status ruleset declarativeNetRequest secara dinamis
function updateRulesetState(desktopUserAgent) {
  const updateRules = {
    enableRulesetIds: desktopUserAgent ? ["ruleset_tiktok_upload"] : [],
    disableRulesetIds: desktopUserAgent ? [] : ["ruleset_tiktok_upload"]
  };
  
  chrome.declarativeNetRequest.updateEnabledRulesets(updateRules, () => {
    if (chrome.runtime.lastError) {
      console.error("[TikTok HQ Background]: Gagal memperbarui ruleset:", chrome.runtime.lastError);
    } else {
      console.log(`[TikTok HQ Background]: Ruleset 'ruleset_tiktok_upload' diperbarui. Desktop UA = ${desktopUserAgent}`);
    }
  });
}

// Listener saat ekstensi dipasang atau diperbarui
chrome.runtime.onInstalled.addListener(() => {
  console.log("[TikTok HQ Background]: Ekstensi berhasil dipasang.");
  
  const initialSettings = {
    bypassCompression: true,
    autoHDToggle: true,
    desktopUserAgent: true,
    logs: [{ text: "Ekstensi dipasang. Siap digunakan.", time: new Date().toLocaleTimeString() }]
  };

  chrome.storage.local.set(initialSettings, () => {
    console.log("[TikTok HQ Background]: Konfigurasi awal disimpan.");
    updateRulesetState(true);
  });
});

// Listener saat browser dimulai
chrome.runtime.onStartup.addListener(() => {
  chrome.storage.local.get({ desktopUserAgent: true }, (items) => {
    updateRulesetState(items.desktopUserAgent);
  });
});

// Deteksi perubahan storage untuk sinkronisasi ruleset UA
chrome.storage.onChanged.addListener((changes, areaName) => {
  if (areaName === "local" && changes.desktopUserAgent) {
    updateRulesetState(changes.desktopUserAgent.newValue);
  }
});

// Listener untuk mendeteksi saat tab diperbarui
chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  if (changeInfo.status === 'complete' && tab.url) {
    const isUploadPage = tab.url.includes("tiktok.com/upload") || tab.url.includes("tiktokstudio.com");
    if (isUploadPage) {
      console.log(`[TikTok HQ Detector]: Pengguna mengunjungi halaman unggah -> ${tab.url}`);
      
      chrome.tabs.sendMessage(tabId, { action: "uploadPageDetected", url: tab.url }).catch((err) => {
        // Abaikan error jika content script belum termuat
      });
    }
  }
});

// Listener pesan untuk sinkronisasi runtime cepat
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === "getSettings") {
    chrome.storage.local.get(["bypassCompression", "autoHDToggle", "desktopUserAgent"], (items) => {
      sendResponse(items);
    });
    return true; // Menjaga port pesan tetap terbuka untuk respon asinkron
  }
});
