// Popup.js - Mengelola pengaturan antarmuka popup ekstensi dan log real-time

document.addEventListener('DOMContentLoaded', () => {
  const bypassToggle = document.getElementById('bypass-toggle');
  const autohdToggle = document.getElementById('autohd-toggle');
  const uaToggle = document.getElementById('ua-toggle');
  const patcherToggle = document.getElementById('patcher-toggle');
  const patcherSettingsPanel = document.getElementById('patcher-settings-panel');
  const patcherMethod = document.getElementById('patcher-method');
  const patcherMultiplier = document.getElementById('patcher-multiplier');
  
  const statusDot = document.getElementById('status-dot');
  const statusText = document.getElementById('status-text');

  const noVideoAlert = document.getElementById('no-video-alert');
  const videoStatsCard = document.getElementById('video-stats-card');
  const statName = document.getElementById('stat-name');
  const statSize = document.getElementById('stat-size');
  const statCodec = document.getElementById('stat-codec');
  const statBitrate = document.getElementById('stat-bitrate');

  const consoleLogs = document.getElementById('console-logs');
  const clearLogsBtn = document.getElementById('clear-logs-btn');

  function togglePatcherPanel(isActive) {
    if (isActive) {
      patcherSettingsPanel.classList.remove('hidden');
    } else {
      patcherSettingsPanel.classList.add('hidden');
    }
  }

  // 1. Memuat konfigurasi awal dari storage
  chrome.storage.local.get(['bypassCompression', 'autoHDToggle', 'desktopUserAgent', 'enablePatcher', 'patchMethod', 'patchMultiplier', 'lastVideo', 'logs'], (data) => {
    // Set status toggle (default true jika belum ada)
    const isBypassActive = data.hasOwnProperty('bypassCompression') ? data.bypassCompression : true;
    const isAutoHDActive = data.hasOwnProperty('autoHDToggle') ? data.autoHDToggle : true;
    const isUAActive = data.hasOwnProperty('desktopUserAgent') ? data.desktopUserAgent : true;
    const isPatcherActive = data.hasOwnProperty('enablePatcher') ? data.enablePatcher : false;
    const methodVal = data.patchMethod || 'extension-signal';
    const multiplierVal = data.patchMultiplier || 'auto';

    bypassToggle.checked = isBypassActive;
    autohdToggle.checked = isAutoHDActive;
    uaToggle.checked = isUAActive;
    patcherToggle.checked = isPatcherActive;
    patcherMethod.value = methodVal;
    patcherMultiplier.value = multiplierVal;

    togglePatcherPanel(isPatcherActive);
    updateStatusIndicator();

    // Tampilkan data video terakhir jika ada
    if (data.lastVideo) {
      displayVideoStats(data.lastVideo);
    }

    // Tampilkan log aktivitas
    renderLogs(data.logs);
  });

  // 2. Event Listener saat tombol toggle dirubah
  bypassToggle.addEventListener('change', (e) => {
    const isChecked = e.target.checked;
    chrome.storage.local.set({ bypassCompression: isChecked }, () => {
      updateStatusIndicator();
      addLocalLog(isChecked ? "Bypass Kompresi diaktifkan." : "Bypass Kompresi dimatikan.");
    });
  });

  autohdToggle.addEventListener('change', (e) => {
    const isChecked = e.target.checked;
    chrome.storage.local.set({ autoHDToggle: isChecked }, () => {
      addLocalLog(isChecked ? "Auto-HD & API Injector diaktifkan." : "Auto-HD & API Injector dimatikan.");
    });
  });

  uaToggle.addEventListener('change', (e) => {
    const isChecked = e.target.checked;
    chrome.storage.local.set({ desktopUserAgent: isChecked }, () => {
      addLocalLog(isChecked ? "User-Agent Desktop diaktifkan." : "User-Agent Desktop dimatikan.");
    });
  });

  patcherToggle.addEventListener('change', (e) => {
    const isChecked = e.target.checked;
    chrome.storage.local.set({ enablePatcher: isChecked }, () => {
      togglePatcherPanel(isChecked);
      addLocalLog(isChecked ? "Patcher 120 FPS diaktifkan." : "Patcher 120 FPS dimatikan.");
    });
  });

  patcherMethod.addEventListener('change', (e) => {
    const val = e.target.value;
    chrome.storage.local.set({ patchMethod: val }, () => {
      addLocalLog(`Metode patch diubah ke: ${val}`);
    });
  });

  patcherMultiplier.addEventListener('change', (e) => {
    const val = e.target.value;
    chrome.storage.local.set({ patchMultiplier: val }, () => {
      addLocalLog(`Multiplier patch diubah ke: ${val}`);
    });
  });

  // Event listener hapus log
  clearLogsBtn.addEventListener('click', () => {
    chrome.storage.local.set({ logs: [] }, () => {
      renderLogs([]);
    });
  });

  // 3. Fungsi memperbarui tampilan status aktif
  function updateStatusIndicator() {
    const isActive = bypassToggle.checked;
    if (isActive) {
      statusDot.className = 'pulse-dot active';
      statusText.textContent = 'Aktif (HQ Bypass)';
      statusText.style.color = '#00ff7f';
    } else {
      statusDot.className = 'pulse-dot inactive';
      statusText.textContent = 'Nonaktif (Kompresi Aktif)';
      statusText.style.color = '#fe2c55';
    }
  }

  // 4. Menampilkan detail file video yang ditangkap
  function displayVideoStats(video) {
    if (!video) return;
    noVideoAlert.classList.add('hidden');
    videoStatsCard.classList.remove('hidden');

    statName.textContent = video.name || '-';
    statSize.textContent = video.size ? `${(video.size / (1024 * 1024)).toFixed(2)} MB` : '-';
    statCodec.textContent = video.codec || 'Unknown';
    statBitrate.textContent = video.bitrate ? `${video.bitrate} kbps` : '-';
  }

  // 5. Merender baris logs di terminal
  function renderLogs(logs) {
    consoleLogs.innerHTML = '';
    if (!logs || logs.length === 0) {
      consoleLogs.innerHTML = '<div class="log-line empty">Menunggu aktivitas uploader...</div>';
      return;
    }

    logs.forEach(logItem => {
      const logLine = document.createElement('div');
      logLine.className = 'log-line';
      
      const timeSpan = document.createElement('span');
      timeSpan.className = 'log-time';
      timeSpan.textContent = `[${logItem.time}]`;

      const textNode = document.createTextNode(` ${logItem.text}`);
      
      logLine.appendChild(timeSpan);
      logLine.appendChild(textNode);
      consoleLogs.appendChild(logLine);
    });

    // Auto-scroll ke log terbaru
    consoleLogs.scrollTop = consoleLogs.scrollHeight;
  }

  // Menambahkan log lokal dari interaksi popup
  function addLocalLog(message) {
    chrome.storage.local.get({ logs: [] }, (data) => {
      const logs = data.logs || [];
      logs.push({ text: message, time: new Date().toLocaleTimeString() });
      if (logs.length > 25) logs.shift();
      chrome.storage.local.set({ logs });
    });
  }

  // 6. Mendengarkan perubahan storage secara langsung
  chrome.storage.onChanged.addListener((changes, areaName) => {
    if (areaName === 'local') {
      if (changes.logs) {
        renderLogs(changes.logs.newValue);
      }
      if (changes.lastVideo) {
        displayVideoStats(changes.lastVideo.newValue);
      }
    }
  });
});
