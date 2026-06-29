// content.js - Berjalan di ISOLATED world halaman TikTok
// Bertindak sebagai jembatan komunikasi (Bridge) antara MAIN world (inject.js) dan Storage Extension

console.log("TikTok High Quality Uploader: Content script (ISOLATED) aktif.");

// 0. Injeksi inject.js ke dalam MAIN world secara SINKRON untuk kompatibilitas penuh (anti-delay di Lemur/Kiwi Browser)
function injectMainScriptSync() {
  const scriptId = "tiktok-hq-uploader-injector";
  if (document.getElementById(scriptId)) return;

  try {
    const xhr = new XMLHttpRequest();
    // Membaca file secara sinkron (false) dari lokal ekstensi
    xhr.open("GET", chrome.runtime.getURL("inject.js"), false);
    xhr.send();
    
    if (xhr.status === 200 || xhr.status === 0) {
      const script = document.createElement("script");
      script.id = scriptId;
      script.textContent = xhr.responseText;
      (document.head || document.documentElement).appendChild(script);
      console.log("TikTok HQ Content: Berhasil menginjeksi inject.js secara SINKRON.");
    } else {
      console.error("TikTok HQ Content: Gagal memuat inject.js, status:", xhr.status);
    }
  } catch (e) {
    console.error("TikTok HQ Content: Gagal melakukan sinkronisasi inject.js:", e);
  }
}
injectMainScriptSync();

// 1. Catat inisialisasi awal ke logs storage
chrome.storage.local.get({ logs: [] }, (data) => {
  const logs = data.logs || [];
  logs.push({ text: "Content Script (Bridge) aktif.", time: new Date().toLocaleTimeString() });
  if (logs.length > 25) logs.shift();
  chrome.storage.local.set({ logs });
});

// Menerima pesan dari background.js saat masuk halaman upload
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === "uploadPageDetected") {
    console.log(`[TikTok HQ Content]: Membuka halaman upload -> ${message.url}`);
    chrome.storage.local.get({ logs: [] }, (data) => {
      const logs = data.logs || [];
      logs.push({ text: `Mendeteksi Halaman Unggah: ${message.url}`, time: new Date().toLocaleTimeString() });
      if (logs.length > 25) logs.shift();
      chrome.storage.local.set({ logs });
    });
  }
});

// 2. Jembatan Komunikasi (Bridge)
window.addEventListener("message", (event) => {
  if (event.source !== window) return;

  if (event.data && event.data.source === "tiktok-hq-injector") {
    switch (event.data.action) {
      case "getSettings":
        chrome.storage.local.get(["bypassCompression", "autoHDToggle", "desktopUserAgent", "enablePatcher", "patchMethod", "patchMultiplier"], (settings) => {
          // Update sessionStorage cache untuk muat ulang berikutnya agar sinkron
          sessionStorage.setItem('__tt_hq_bypass', settings.bypassCompression !== false ? 'true' : 'false');
          sessionStorage.setItem('__tt_hq_autohd', settings.autoHDToggle !== false ? 'true' : 'false');
          sessionStorage.setItem('__tt_hq_ua', settings.desktopUserAgent !== false ? 'true' : 'false');
          sessionStorage.setItem('__tt_hq_enable_patcher', settings.enablePatcher === true ? 'true' : 'false');
          sessionStorage.setItem('__tt_hq_patch_method', settings.patchMethod || 'extension-signal');
          sessionStorage.setItem('__tt_hq_patch_multiplier', settings.patchMultiplier || 'auto');

          window.postMessage({
            source: "tiktok-hq-content-bridge",
            action: "settingsResponse",
            settings: settings
          }, "*");
        });
        break;
      case "saveLastVideo":
        chrome.storage.local.set({ lastVideo: event.data.videoInfo }, () => {
          console.log("[TikTok HQ Content]: Metadata video disimpan ke local storage:", event.data.videoInfo);
        });
        break;
      case "log":
        console.log("[TikTok HQ Injector Log]:", event.data.message);
        chrome.storage.local.get({ logs: [] }, (data) => {
          const logs = data.logs || [];
          // Hindari spam log duplikat berturut-turut untuk menjaga space log
          if (logs.length > 0 && logs[logs.length - 1].text === event.data.message) {
            return;
          }
          logs.push({ text: event.data.message, time: new Date().toLocaleTimeString() });
          if (logs.length > 80) logs.shift();
          chrome.storage.local.set({ logs });
        });
        break;
    }
  }
});

// 3. Ambil data setelan asinkron saat content script diinisialisasi dan sinkronkan cache sessionStorage
chrome.storage.local.get(["bypassCompression", "autoHDToggle", "desktopUserAgent", "enablePatcher", "patchMethod", "patchMultiplier"], (settings) => {
  sessionStorage.setItem('__tt_hq_bypass', settings.bypassCompression !== false ? 'true' : 'false');
  sessionStorage.setItem('__tt_hq_autohd', settings.autoHDToggle !== false ? 'true' : 'false');
  sessionStorage.setItem('__tt_hq_ua', settings.desktopUserAgent !== false ? 'true' : 'false');
  sessionStorage.setItem('__tt_hq_enable_patcher', settings.enablePatcher === true ? 'true' : 'false');
  sessionStorage.setItem('__tt_hq_patch_method', settings.patchMethod || 'extension-signal');
  sessionStorage.setItem('__tt_hq_patch_multiplier', settings.patchMultiplier || 'auto');
});

// 4. Pantau perubahan storage secara real-time dan kirim ke page context
chrome.storage.onChanged.addListener((changes, areaName) => {
  if (areaName === "local" && (changes.bypassCompression || changes.desktopUserAgent || changes.autoHDToggle || changes.enablePatcher || changes.patchMethod || changes.patchMultiplier)) {
    chrome.storage.local.get(["bypassCompression", "desktopUserAgent", "autoHDToggle", "enablePatcher", "patchMethod", "patchMultiplier"], (settings) => {
      // Update sessionStorage cache
      sessionStorage.setItem('__tt_hq_bypass', settings.bypassCompression !== false ? 'true' : 'false');
      sessionStorage.setItem('__tt_hq_autohd', settings.autoHDToggle !== false ? 'true' : 'false');
      sessionStorage.setItem('__tt_hq_ua', settings.desktopUserAgent !== false ? 'true' : 'false');
      sessionStorage.setItem('__tt_hq_enable_patcher', settings.enablePatcher === true ? 'true' : 'false');
      sessionStorage.setItem('__tt_hq_patch_method', settings.patchMethod || 'extension-signal');
      sessionStorage.setItem('__tt_hq_patch_multiplier', settings.patchMultiplier || 'auto');

      window.postMessage({
        source: "tiktok-hq-content-bridge",
        action: "settingsResponse",
        settings: settings
      }, "*");
    });
  }
});
