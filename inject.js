// inject.js - Berjalan langsung di MAIN world (halaman utama TikTok)
// Dioptimalkan khusus untuk ketahanan tinggi (anti-crash) pada HP iQOO 15R dan Kiwi Browser Android.

(function () {
  if (window.__tt_hq_uploader_injected) {
    console.log("TikTok HQ Injector: Skrip injeksi sudah aktif (guard).");
    return;
  }
  window.__tt_hq_uploader_injected = true;

  // Membaca cache setelan secara sinkron dari sessionStorage
  const bypassComp = sessionStorage.getItem('__tt_hq_bypass') !== 'false';
  const autoHD = sessionStorage.getItem('__tt_hq_autohd') !== 'false';
  const desktopUA = sessionStorage.getItem('__tt_hq_ua') !== 'false';
  const enablePatcher = sessionStorage.getItem('__tt_hq_enable_patcher') === 'true';
  const patchMethod = sessionStorage.getItem('__tt_hq_patch_method') || 'extension-signal';
  const patchMultiplier = sessionStorage.getItem('__tt_hq_patch_multiplier') || 'auto';

  let currentSettings = {
    bypassCompression: bypassComp,
    autoHDToggle: autoHD,
    desktopUserAgent: desktopUA,
    enablePatcher: enablePatcher,
    patchMethod: patchMethod,
    patchMultiplier: patchMultiplier
  };

  window.__originalVideoFile = null;

  // Menyimpan referensi API asli sebelum dihapus
  const originalVideoEncoder = window.VideoEncoder;
  const originalAudioEncoder = window.AudioEncoder;
  const originalOffscreenCanvas = window.OffscreenCanvas;
  const OriginalWorker = window.Worker;

  // Menyimpan referensi API asli untuk input file & drag-and-drop
  const originalFilesDescriptor = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'files');
  const originalDataTransferFiles = Object.getOwnPropertyDescriptor(DataTransfer.prototype, 'files');
  const patchedFilesMap = new WeakMap();

  try {
    Object.defineProperty(HTMLInputElement.prototype, 'files', {
      get: function() {
        if (currentSettings.enablePatcher && patchedFilesMap.has(this)) {
          if (!this._hasLoggedPatchedAccess) {
            this._hasLoggedPatchedAccess = true;
            log("Uploader membaca FileList yang sudah di-patch pada input element.");
          }
          return patchedFilesMap.get(this);
        }
        return originalFilesDescriptor.get.call(this);
      },
      set: function(val) {
        return originalFilesDescriptor.set.call(this, val);
      },
      configurable: true
    });

    Object.defineProperty(DataTransfer.prototype, 'files', {
      get: function() {
        if (currentSettings.enablePatcher && patchedFilesMap.has(this)) {
          if (!this._hasLoggedPatchedAccess) {
            this._hasLoggedPatchedAccess = true;
            log("Uploader membaca FileList yang sudah di-patch pada DataTransfer.");
          }
          return patchedFilesMap.get(this);
        }
        return originalDataTransferFiles.get.call(this);
      },
      configurable: true
    });
  } catch (e) {
    console.error("Gagal mendefinisikan properti file hijack:", e);
  }


  function log(msg) {
    window.postMessage({
      source: "tiktok-hq-injector",
      action: "log",
      message: msg
    }, "*");
  }

  function applyBypassSettings() {
    if (currentSettings.bypassCompression) {
      try {
        delete window.VideoEncoder;
        delete window.AudioEncoder;
        delete window.OffscreenCanvas;
        log("Bypass Kompresi Aktif: API kompresi dinonaktifkan secara sinkron.");
      } catch (e) {
        try {
          window.VideoEncoder = undefined;
          window.AudioEncoder = undefined;
          window.OffscreenCanvas = undefined;
        } catch (err) { }
      }
    } else {
      try {
        if (originalVideoEncoder) window.VideoEncoder = originalVideoEncoder;
        if (originalAudioEncoder) window.AudioEncoder = originalAudioEncoder;
        if (originalOffscreenCanvas) window.OffscreenCanvas = originalOffscreenCanvas;
        log("Bypass Kompresi Nonaktif: API kompresi diaktifkan kembali.");
      } catch (e) {
        log("Gagal mengembalikan API kompresi: " + e.message);
      }
    }
  }

  log("TikTok HQ Injector: Memulai inisialisasi sinkron MAIN world...");

  // ==========================================
  // 1. PENYAMARAN USER-AGENT & PLATFORM (DESKTOP SPOOFING)
  // ==========================================
  if (currentSettings.desktopUserAgent) {
    const DESKTOP_UA = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36";
    const DESKTOP_PLATFORM = "Win32";

    try {
      Object.defineProperty(navigator, 'userAgent', { get: () => DESKTOP_UA, configurable: true });
      Object.defineProperty(navigator, 'platform', { get: () => DESKTOP_PLATFORM, configurable: true });
      Object.defineProperty(navigator, 'appVersion', { get: () => DESKTOP_UA, configurable: true });

      // Mock navigator.userAgentData secara lengkap dan detail
      if (navigator.userAgentData) {
        const mockedUAData = {
          brands: [
            { brand: 'Not_A Brand', version: '8' },
            { brand: 'Chromium', version: '120' },
            { brand: 'Google Chrome', version: '120' }
          ],
          mobile: false,
          platform: 'Windows',
          getHighEntropyValues: function (hints) {
            return Promise.resolve({
              architecture: 'x86',
              bitness: '64',
              brands: this.brands,
              mobile: false,
              model: '',
              platform: 'Windows',
              platformVersion: '10.0.0',
              uaFullVersion: '120.0.0.0'
            });
          }
        };
        Object.defineProperty(navigator, 'userAgentData', { get: () => mockedUAData, configurable: true });
      }
      log("Spoofing User-Agent Desktop diaktifkan secara sinkron.");
    } catch (e) {
      log("Gagal menyamarkan navigator: " + e.message);
    }

    // ==========================================
    // 2. PENYAMARAN HARDWARE & RESOLUSI DESKTOP
    // ==========================================
    try {
      Object.defineProperty(navigator, 'maxTouchPoints', { get: () => 0, configurable: true });
      Object.defineProperty(navigator, 'hardwareConcurrency', { get: () => 16, configurable: true });
      Object.defineProperty(navigator, 'deviceMemory', { get: () => 8, configurable: true });

      Object.defineProperty(window.screen, 'width', { get: () => 1920, configurable: true });
      Object.defineProperty(window.screen, 'height', { get: () => 1080, configurable: true });
      Object.defineProperty(window.screen, 'availWidth', { get: () => 1920, configurable: true });
      Object.defineProperty(window.screen, 'availHeight', { get: () => 1040, configurable: true });
      Object.defineProperty(window, 'innerWidth', { get: () => 1920, configurable: true });
      Object.defineProperty(window, 'innerHeight', { get: () => 1080, configurable: true });
      Object.defineProperty(window, 'outerWidth', { get: () => 1920, configurable: true });
      Object.defineProperty(window, 'outerHeight', { get: () => 1080, configurable: true });

      // Spoof touch support (Hapus event touch bawaan mobile)
      try {
        if ('ontouchstart' in window) {
          delete window.ontouchstart;
        }
        if ('ontouchstart' in document) {
          delete document.ontouchstart;
        }
        if (window.TouchEvent) {
          delete window.TouchEvent;
        }
      } catch (e) { }

      // Spoof dimensi clientWidth/clientHeight viewport pada documentElement & body
      try {
        const originalClientWidth = Object.getOwnPropertyDescriptor(Element.prototype, 'clientWidth').get;
        const originalClientHeight = Object.getOwnPropertyDescriptor(Element.prototype, 'clientHeight').get;

        Object.defineProperty(Element.prototype, 'clientWidth', {
          get: function () {
            if (this === document.documentElement || this === document.body) {
              return 1920;
            }
            return originalClientWidth.call(this);
          },
          configurable: true
        });

        Object.defineProperty(Element.prototype, 'clientHeight', {
          get: function () {
            if (this === document.documentElement || this === document.body) {
              return 1080;
            }
            return originalClientHeight.call(this);
          },
          configurable: true
        });
      } catch (e) { }

      // Spoof Screen Orientation (Kunci ke landscape desktop)
      try {
        const mockedOrientation = {
          angle: 0,
          type: 'landscape-primary',
          onchange: null,
          addEventListener: function () { },
          removeEventListener: function () { },
          dispatchEvent: function () { return true; }
        };
        Object.defineProperty(window.screen, 'orientation', { get: () => mockedOrientation, configurable: true });
        Object.defineProperty(window, 'orientation', { get: () => 0, configurable: true });
      } catch (e) { }

      // Spoof Visual Viewport (Mencegah kebocoran ukuran layar asli di mobile)
      try {
        if (window.visualViewport) {
          const mockedViewport = {
            width: 1920,
            height: 1080,
            scale: 1,
            offsetLeft: 0,
            offsetTop: 0,
            pageLeft: 0,
            pageTop: 0,
            onresize: null,
            onscroll: null,
            addEventListener: function () { },
            removeEventListener: function () { },
            dispatchEvent: function () { return true; }
          };
          Object.defineProperty(window, 'visualViewport', { get: () => mockedViewport, configurable: true });
        }
      } catch (e) { }

      if (window.WebGLRenderingContext) {
        const originalGetParameter = WebGLRenderingContext.prototype.getParameter;
        WebGLRenderingContext.prototype.getParameter = function (pname) {
          if (pname === 0x9245) return 'Google Inc. (NVIDIA)';
          if (pname === 0x9246) return 'ANGLE (NVIDIA, NVIDIA GeForce RTX 3060 Direct3D11 vs_5_0 ps_5_0, D3D11)';
          return originalGetParameter.apply(this, arguments);
        };
        if (window.WebGL2RenderingContext) {
          WebGL2RenderingContext.prototype.getParameter = WebGLRenderingContext.prototype.getParameter;
        }
      }
      log("Bypass deteksi fisik (Touch, Screen, GPU, Cores, Memory, Orientation) diinisialisasi secara sinkron.");
    } catch (err) {
      log("Gagal menyamarkan spesifikasi hardware: " + err.message);
    }
  } else {
    log("Spoofing User-Agent & Hardware nonaktif.");
  }

  // ==========================================
  // 3. MEMATIKAN API KOMPRESI DI MAIN THREAD
  // ==========================================
  applyBypassSettings();

  // ==========================================
  // 3B. WEB WORKER HIJACKING (BYPASS COMPRESSION IN WORKERS)
  // ==========================================
  try {
    if (OriginalWorker) {
      window.Worker = function (scriptURL, options) {
        if (!currentSettings.bypassCompression && !currentSettings.autoHDToggle) {
          return new OriginalWorker(scriptURL, options);
        }
        const urlStr = scriptURL.toString();
        log("Mengintersepsi pembuatan Web Worker: " + urlStr);

        let workerURL = scriptURL;

        try {
          let originalCode = "";
          if (urlStr.startsWith('blob:')) {
            const xhr = new XMLHttpRequest();
            xhr.open('GET', urlStr, false);
            xhr.send();
            originalCode = xhr.responseText;
          } else {
            originalCode = "importScripts(\"" + urlStr + "\");";
          }

          const modifiedCode = `
            (function() {
              const bypassComp = ${currentSettings.bypassCompression};
              const autoHD = ${currentSettings.autoHDToggle};

              try {
                if (bypassComp) {
                  delete self.VideoEncoder;
                  delete self.AudioEncoder;
                  delete self.OffscreenCanvas;
                  console.log("[TikTok Worker Bypass]: Berhasil menonaktifkan API kompresi di dalam Web Worker.");
                }
              } catch(e) {
                console.error("[TikTok Worker Bypass]: Gagal menonaktifkan API kompresi:", e);
              }

              // Intersep Fetch di dalam Web Worker
              try {
                if (autoHD && self.fetch) {
                  const originalFetch = self.fetch;
                  self.fetch = async function(resource, config) {
                    try {
                      let url = typeof resource === 'string' ? resource : (resource instanceof Request ? resource.url : '');
                      if (url && (url.includes("tiktok.com") || url.includes("tiktokstudio.com") || url.includes("byteoversea") || url.includes("tiktokv.com") || url.includes("tiktokapis.com") || url.includes("ibytedtos.com") || url.includes("bytedance.com") || url.includes("bytegecko.com") || url.includes("tiktokw.com"))) {
                        if (config && config.body) {
                          if (typeof config.body === 'string') {
                            try {
                              let data = JSON.parse(config.body);
                              if (data.video_id || data.creation_id || data.text || data.desc || data.privacy_type || url.includes("project") || url.includes("post") || url.includes("publish")) {
                                data.allow_hd = 1;
                                data.is_hd = 1;
                                data.video_quality = 'hq';
                                data.allow_high_quality = 1;
                                data.allow_hd_upload = 1;
                                data.is_high_quality = 1;
                                data.enable_hd = 1;
                                data.hd_upload = 1;
                                data.hd = 1;
                                config.body = JSON.stringify(data);
                                console.log("[TikTok Worker Bypass]: Berhasil menyuntikkan parameter HD ke Worker Fetch (JSON)!");
                              }
                            } catch (e) {}
                          } else if (config.body instanceof FormData) {
                            const formData = config.body;
                            if (!formData.has('allow_hd')) formData.append('allow_hd', '1');
                            if (!formData.has('is_hd')) formData.append('is_hd', '1');
                            if (!formData.has('video_quality')) formData.append('video_quality', 'hq');
                            if (!formData.has('allow_high_quality')) formData.append('allow_high_quality', '1');
                            if (!formData.has('allow_hd_upload')) formData.append('allow_hd_upload', '1');
                            if (!formData.has('is_high_quality')) formData.append('is_high_quality', '1');
                            if (!formData.has('enable_hd')) formData.append('enable_hd', '1');
                            if (!formData.has('hd_upload')) formData.append('hd_upload', '1');
                            console.log("[TikTok Worker Bypass]: Berhasil menyuntikkan parameter HD ke Worker Fetch (FormData)!");
                          }
                        }
                      }
                    } catch (err) {}
                    return originalFetch.apply(this, arguments);
                  };
                }
              } catch(e) {}
            })();
            ${originalCode}
          `;

          const blob = new Blob([modifiedCode], { type: 'application/javascript' });
          workerURL = URL.createObjectURL(blob);
        } catch (err) {
          log("Gagal menyuntikkan bypass ke Web Worker, menggunakan skrip asli: " + err.message);
        }

        return new OriginalWorker(workerURL, options);
      };

      window.Worker.prototype = OriginalWorker.prototype;
      log("Web Worker Hijacker berhasil aktif secara sinkron.");
    }
  } catch (e) {
    log("Gagal mengaktifkan Web Worker Hijacker: " + e.message);
  }

  // ==========================================
  // 4. PARSER METADATA VIDEO
  // ==========================================
  function parseVideoMetadata(file) {
    return new Promise((resolve) => {
      const readChunk = (start, end) => {
        return new Promise((res) => {
          const reader = new FileReader();
          reader.onload = (e) => res(new Uint8Array(e.target.result));
          reader.onerror = () => res(null);
          reader.readAsArrayBuffer(file.slice(start, end));
        });
      };

      const findPattern = (arr, pat) => {
        const len = pat.length;
        for (let i = 0; i <= arr.length - len; i++) {
          let match = true;
          for (let j = 0; j < len; j++) {
            if (arr[i + j] !== pat.charCodeAt(j)) {
              match = false;
              break;
            }
          }
          if (match) return true;
        }
        return false;
      };

      const detectCodecFromBuffer = (bytes) => {
        if (!bytes) return null;
        if (findPattern(bytes, 'avc1')) return 'H.264 (AVC)';
        if (findPattern(bytes, 'hvc1') || findPattern(bytes, 'hev1')) return 'H.265 (HEVC)';
        if (findPattern(bytes, 'vp09')) return 'VP9';
        if (findPattern(bytes, 'av01')) return 'AV1';
        return null;
      };

      const parseDuration = (bytes) => {
        if (!bytes) return 0;
        const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
        for (let i = 0; i < bytes.length - 36; i++) {
          if (bytes[i] === 109 && bytes[i + 1] === 118 && bytes[i + 2] === 104 && bytes[i + 3] === 100) {
            try {
              const version = view.getUint8(i + 4);
              let timescale = 1000;
              let duration = 0;
              if (version === 0) {
                timescale = view.getUint32(i + 16);
                duration = view.getUint32(i + 20);
              } else if (version === 1) {
                timescale = view.getUint32(i + 24);
                duration = view.getUint32(i + 32);
              }
              if (timescale > 0) return duration / timescale;
            } catch (e) { }
            break;
          }
        }
        return 0;
      };

      (async () => {
        let codec = 'Unknown';
        let durationSec = 0;
        const firstChunkSize = Math.min(file.size, 1024 * 1024);
        const firstBytes = await readChunk(0, firstChunkSize);
        let detected = detectCodecFromBuffer(firstBytes);
        if (detected) codec = detected;
        durationSec = parseDuration(firstBytes);

        if ((codec === 'Unknown' || durationSec === 0) && file.size > firstChunkSize) {
          const lastBytes = await readChunk(Math.max(0, file.size - 1024 * 1024), file.size);
          if (codec === 'Unknown') {
            const detectedLast = detectCodecFromBuffer(lastBytes);
            if (detectedLast) codec = detectedLast;
          }
          if (durationSec === 0) durationSec = parseDuration(lastBytes);
        }

        const bitrateKbps = durationSec > 0 ? Math.round(((file.size * 8) / durationSec) / 1000) : 0;
        resolve({ codec, durationSec, bitrateKbps });
      })();
    });
  }

  // ==========================================
  // 5. LOGIKA HIGH-QUALITY TOGGLE DI DOM TIKTOK
  // ==========================================
  function forceHighQualityToggleDOM() {
    if (!currentSettings.autoHDToggle) return;
    try {
      log("Mencoba mengaktifkan toggle High-Quality di DOM TikTok...");
      const keywords = ["high-quality", "kualitas tinggi", "hd", "high quality", "hd upload", "allow hd", "allow high-quality"];
      const elements = document.querySelectorAll('span, p, div, label, input, button');

      for (let el of elements) {
        const text = el.textContent ? el.textContent.toLowerCase() : '';
        const matchesKeyword = keywords.some(kw => text.includes(kw));

        if (matchesKeyword) {
          const parent = el.closest('div');
          if (parent) {
            const checkbox = parent.querySelector('input[type="checkbox"]');
            if (checkbox && !checkbox.checked) {
              checkbox.click();
              log("Toggle High-Quality (Checkbox) berhasil diaktifkan ke ON!");
              break;
            }
            const roleSwitch = parent.querySelector('[role="switch"], button[aria-checked]');
            if (roleSwitch) {
              const isChecked = roleSwitch.getAttribute('aria-checked') === 'true' || roleSwitch.classList.contains('semi-switch-checked');
              if (!isChecked) {
                roleSwitch.click();
                log("Toggle High-Quality (Role Switch / Button) berhasil diaktifkan ke ON!");
                break;
              }
            }
            const customSwitch = parent.querySelector('.tiktok-switch, [class*="switch"]');
            if (customSwitch) {
              if (!customSwitch.classList.contains('checked') && !customSwitch.classList.contains('active')) {
                customSwitch.click();
                log("Toggle High-Quality (Custom Switch Class) diaktifkan ke ON!");
                break;
              }
            }
          }
        }
      }
    } catch (e) {
      log("Error saat mengubah DOM Toggle: " + e.message);
    }
  }

  // ==========================================
  // 6. TIMESCALE PATCHER (60fps/120fps Uploader)
  // ==========================================
  
  window.__patchedVideoBlob = null;
  window.__patchedVideoArrayBuffer = null;

  async function handleSelectedVideo(file) {
    if (!file) return file;
    if (file.type.startsWith('video/')) {
      window.__originalVideoFile = file;
      log("Video terdeteksi: " + file.name + " (" + (file.size / (1024 * 1024)).toFixed(2) + " MB)");

      const meta = await parseVideoMetadata(file);
      log("Metadata video: Codec=" + meta.codec + ", Durasi=" + meta.durationSec.toFixed(2) + "s, Bitrate=" + meta.bitrateKbps + "kbps");

      window.postMessage({
        source: "tiktok-hq-injector",
        action: "saveLastVideo",
        videoInfo: {
          name: file.name,
          size: file.size,
          codec: meta.codec,
          bitrate: meta.bitrateKbps
        }
      }, "*");

      // Reset cache patcher sebelumnya
      window.__patchedVideoBlob = null;
      window.__patchedVideoArrayBuffer = null;

      if (currentSettings.enablePatcher) {
        try {
          log(`[Timescale Patcher] Memulai pemrosesan biner (${currentSettings.patchMethod}, multiplier=${currentSettings.patchMultiplier})...`);
          const arrayBuffer = await file.arrayBuffer();
          const info = window.Upload120Patcher.inspectMp4(arrayBuffer);
          
          if (info.isMp4 && !info.error) {
            let divider = 2;
            if (currentSettings.patchMultiplier === 'auto') {
              const fps = info.fps || 30;
              if (fps >= 100) divider = 4;
              else if (fps >= 75) divider = 3;
              else divider = 2;
            } else {
              divider = Number(currentSettings.patchMultiplier) || 2;
            }

            const result = window.Upload120Patcher.patchMp4Buffer(arrayBuffer, {
              divider: divider,
              method: currentSettings.patchMethod
            });

            const patchedBlob = new Blob([result.bytes], { type: file.type || 'video/mp4' });
            window.__patchedVideoBlob = patchedBlob;
            window.__patchedVideoArrayBuffer = result.bytes.buffer;

            const patchedFile = new File([result.bytes], file.name, { type: file.type || 'video/mp4', lastModified: file.lastModified });
            log(`[Timescale Patcher] Sukses! Video berhasil di-patch (${divider}x). Ukuran akhir: ${(patchedBlob.size / (1024 * 1024)).toFixed(2)} MB`);
            
            if (currentSettings.autoHDToggle) {
              setTimeout(forceHighQualityToggleDOM, 1000);
              setTimeout(forceHighQualityToggleDOM, 2500);
              setTimeout(forceHighQualityToggleDOM, 5000);
            }
            return patchedFile;
          } else {
            log("[Timescale Patcher] Warning: Berkas bukan format MP4 yang valid untuk timescale patching.");
          }
        } catch (err) {
          log("[Timescale Patcher] Gagal mempatch video: " + err.message);
        }
      }

      if (currentSettings.autoHDToggle) {
        setTimeout(forceHighQualityToggleDOM, 1000);
        setTimeout(forceHighQualityToggleDOM, 2500);
        setTimeout(forceHighQualityToggleDOM, 5000);
      }
    }
    return file;
  }

  // ==========================================
  // 6B. HIJACK MODERN APIs (showOpenFilePicker & Blob.slice)
  // ==========================================
  try {
    if (window.showOpenFilePicker) {
      const originalShowOpenFilePicker = window.showOpenFilePicker;
      window.showOpenFilePicker = async function (options) {
        log("[API Hijack] Mencegat showOpenFilePicker. Memulai patch...");
        const handles = await originalShowOpenFilePicker.apply(this, arguments);
        return Promise.all(handles.map(async (handle) => {
          if (handle.kind === 'file') {
            const originalGetFile = handle.getFile;
            handle.getFile = async function () {
              const file = await originalGetFile.apply(this, arguments);
              if (file.type.startsWith('video/')) {
                log("[API Hijack] showOpenFilePicker: Mendeteksi berkas video -> " + file.name);
                return await handleSelectedVideo(file);
              }
              return file;
            };
          }
          return handle;
        }));
      };
      log("[API Hijack] showOpenFilePicker hijacker berhasil aktif.");
    }
  } catch (e) {
    log("Gagal menyuntikkan hijack showOpenFilePicker: " + e.message);
  }

  try {
    const originalSlice = Blob.prototype.slice;
    Blob.prototype.slice = function (start, end, contentType) {
      if (currentSettings.enablePatcher && window.__patchedVideoBlob && window.__originalVideoFile) {
        if (this === window.__originalVideoFile || (this.size === window.__originalVideoFile.size && this.type === window.__originalVideoFile.type)) {
          if (!this._hasLoggedSlice) {
            this._hasLoggedSlice = true;
            log("[Blob Patcher] Mencegat slice() pada video asli, mengalihkan ke video ter-patch.");
          }
          return originalSlice.call(window.__patchedVideoBlob, start, end, contentType);
        }
      }
      return originalSlice.apply(this, arguments);
    };
    log("[Blob Patcher] Blob.prototype.slice hijacker berhasil aktif.");
  } catch (e) {
    log("Gagal menyuntikkan hijack Blob.slice: " + e.message);
  }


  // Hijack document.createElement untuk menangkap detached input file (sangat umum di mobile uploader)
  try {
    const originalCreateElement = document.createElement;
    document.createElement = function (tagName, ...args) {
      const el = originalCreateElement.apply(this, [tagName, ...args]);
      if (tagName && tagName.toString().toLowerCase() === 'input') {
        el.addEventListener('change', async (event) => {
          if (el.type === 'file' && event.isTrusted) {
            const files = originalFilesDescriptor.get.call(el);
            if (files && files.length > 0) {
              event.stopImmediatePropagation();
              event.preventDefault();

              log("Mencegat detached input file (isTrusted). Memulai patch timescale...");
              const patchedFile = await handleSelectedVideo(files[0]);
              if (patchedFile && patchedFile !== files[0]) {
                const dt = new DataTransfer();
                dt.items.add(patchedFile);
                patchedFilesMap.set(el, dt.files);
                log("Detached input.files ditimpa dengan versi ter-patch.");
              }

              // Memicu ulang event change
              log("Memicu ulang event change pada detached input...");
              const newEvent = new Event('change', { bubbles: true, cancelable: true });
              el.dispatchEvent(newEvent);
            }
          }
        }, { capture: true });
      }
      return el;
    };
  } catch (e) {
    log("Gagal menyuntikkan hijack createElement: " + e.message);
  }

  // Event change input file DOM
  document.addEventListener('change', async (event) => {
    try {
      const target = event.target;
      if (target && target.tagName === 'INPUT' && target.type === 'file') {
        const files = originalFilesDescriptor.get.call(target);
        if (files && files.length > 0) {
          if (event.isTrusted) {
            event.stopImmediatePropagation();
            event.preventDefault();

            log("Mencegat input file DOM (isTrusted). Memulai patch timescale...");
            const patchedFile = await handleSelectedVideo(files[0]);
            if (patchedFile && patchedFile !== files[0]) {
              const dt = new DataTransfer();
              dt.items.add(patchedFile);
              patchedFilesMap.set(target, dt.files);
              log("Input.files ditimpa dengan versi ter-patch.");
            }

            // Memicu ulang event change
            log("Memicu ulang event change pada DOM input...");
            const newEvent = new Event('change', { bubbles: true, cancelable: true });
            target.dispatchEvent(newEvent);
          } else {
            log("Event change ter-patch diteruskan ke halaman.");
          }
        }
      }
    } catch (err) {
      log("Error pada event change input file DOM: " + err.message);
    }
  }, true);

  // Event drag & drop file
  document.addEventListener('drop', async (event) => {
    try {
      const transfer = event.dataTransfer;
      if (transfer) {
        const files = originalDataTransferFiles.get.call(transfer);
        if (files && files.length > 0) {
          if (event.isTrusted) {
            event.stopImmediatePropagation();
            event.preventDefault();

            log("Mencegat drop file (isTrusted). Memulai patch timescale...");
            const patchedFile = await handleSelectedVideo(files[0]);
            if (patchedFile && patchedFile !== files[0]) {
              const dt = new DataTransfer();
              dt.items.add(patchedFile);
              patchedFilesMap.set(transfer, dt.files);
              log("DataTransfer.files ditimpa dengan versi ter-patch.");
            }

            // Memicu ulang event drop
            log("Memicu ulang event drop dengan file ter-patch...");
            const newEvent = new DragEvent('drop', {
              bubbles: true,
              cancelable: true
            });
            Object.defineProperty(newEvent, 'dataTransfer', {
              value: transfer,
              configurable: true,
              enumerable: true
            });
            event.target.dispatchEvent(newEvent);
          } else {
            log("Event drop ter-patch diteruskan ke halaman.");
          }
        }
      }
    } catch (err) {
      log("Error pada event drop file: " + err.message);
    }
  }, true);



  // Helper untuk melakukan penggantian payload upload secara asinkron (untuk fetch)
  async function getPatchedBody(body) {
    if (!currentSettings.enablePatcher || !window.__patchedVideoBlob) return body;
    const patchedBlob = window.__patchedVideoBlob;
    
    if (body instanceof Blob) {
      if (body.type.startsWith('video/') || (window.__originalVideoFile && Math.abs(body.size - window.__originalVideoFile.size) < 100000)) {
        log(`[Timescale Patcher] Mengganti upload Blob asli (${(body.size / 1024 / 1024).toFixed(2)} MB) dengan versi ter-patch (${(patchedBlob.size / 1024 / 1024).toFixed(2)} MB)`);
        return patchedBlob;
      }
    } else if (body instanceof FormData) {
      const newFormData = new FormData();
      let replaced = false;
      for (const [key, value] of body.entries()) {
        if (value instanceof Blob && (value.type.startsWith('video/') || (window.__originalVideoFile && Math.abs(value.size - window.__originalVideoFile.size) < 100000))) {
          const originalName = window.__originalVideoFile ? window.__originalVideoFile.name : 'video.mp4';
          const newName = originalName.replace(/\.[^/.]+$/, "") + "_patched.mp4";
          newFormData.append(key, patchedBlob, newName);
          replaced = true;
          log(`[Timescale Patcher] Mengganti file dalam FormData [${key}] dengan versi ter-patch (${(patchedBlob.size / 1024 / 1024).toFixed(2)} MB)`);
        } else {
          newFormData.append(key, value);
        }
      }
      return replaced ? newFormData : body;
    } else if (body instanceof ArrayBuffer || ArrayBuffer.isView(body)) {
      const byteLength = body.byteLength || body.length;
      if (window.__originalVideoFile && Math.abs(byteLength - window.__originalVideoFile.size) < 100000) {
        log(`[Timescale Patcher] Mengganti upload ArrayBuffer/View (${(byteLength / 1024 / 1024).toFixed(2)} MB) dengan versi ter-patch...`);
        const arrayBuffer = window.__patchedVideoArrayBuffer || await patchedBlob.arrayBuffer();
        return ArrayBuffer.isView(body) ? new body.constructor(arrayBuffer) : arrayBuffer;
      }
    }
    
    return body;
  }

  // Helper untuk melakukan penggantian payload upload secara sinkron (untuk XHR.send)
  function getPatchedBodySync(body) {
    if (!currentSettings.enablePatcher || !window.__patchedVideoBlob) return body;
    const patchedBlob = window.__patchedVideoBlob;
    
    if (body instanceof Blob) {
      if (body.type.startsWith('video/') || (window.__originalVideoFile && Math.abs(body.size - window.__originalVideoFile.size) < 100000)) {
        log(`[Timescale Patcher] XHR: Mengganti Blob asli (${(body.size / 1024 / 1024).toFixed(2)} MB) dengan versi ter-patch (${(patchedBlob.size / 1024 / 1024).toFixed(2)} MB)`);
        return patchedBlob;
      }
    } else if (body instanceof FormData) {
      const newFormData = new FormData();
      let replaced = false;
      for (const [key, value] of body.entries()) {
        if (value instanceof Blob && (value.type.startsWith('video/') || (window.__originalVideoFile && Math.abs(value.size - window.__originalVideoFile.size) < 100000))) {
          const originalName = window.__originalVideoFile ? window.__originalVideoFile.name : 'video.mp4';
          const newName = originalName.replace(/\.[^/.]+$/, "") + "_patched.mp4";
          newFormData.append(key, patchedBlob, newName);
          replaced = true;
          log(`[Timescale Patcher] XHR: Mengganti file dalam FormData [${key}] dengan versi ter-patch (${(patchedBlob.size / 1024 / 1024).toFixed(2)} MB)`);
        } else {
          newFormData.append(key, value);
        }
      }
      return replaced ? newFormData : body;
    } else if (body instanceof ArrayBuffer || ArrayBuffer.isView(body)) {
      const byteLength = body.byteLength || body.length;
      if (window.__originalVideoFile && Math.abs(byteLength - window.__originalVideoFile.size) < 100000 && window.__patchedVideoArrayBuffer) {
        log(`[Timescale Patcher] XHR: Mengganti ArrayBuffer/View (${(byteLength / 1024 / 1024).toFixed(2)} MB) dengan versi ter-patch...`);
        return ArrayBuffer.isView(body) ? new body.constructor(window.__patchedVideoArrayBuffer) : window.__patchedVideoArrayBuffer;
      }
    }
    
    return body;
  }

  // ==========================================
  // 7. INTERCEPT API UPLOAD & PUBLISH (FETCH & XHR)
  // ==========================================
  const originalFetch = window.fetch;
  window.fetch = async function (resource, config) {
    if (!currentSettings.autoHDToggle) {
      return originalFetch.apply(this, arguments);
    }
    try {
      let url = typeof resource === 'string' ? resource : (resource instanceof Request ? resource.url : '');
      if (url && (url.includes("tiktok.com") || url.includes("tiktokstudio.com") || url.includes("byteoversea") || url.includes("tiktokv.com") || url.includes("tiktokapis.com") || url.includes("ibytedtos.com") || url.includes("bytedance.com") || url.includes("bytegecko.com") || url.includes("tiktokw.com"))) {
        if (config && config.body) {
          // Ganti body dengan versi ter-patch jika sesuai
          config.body = await getPatchedBody(config.body);

          if (typeof config.body === 'string') {
            try {
              let data = JSON.parse(config.body);
              if (data.video_id || data.creation_id || data.text || data.desc || data.privacy_type || url.includes("project") || url.includes("post") || url.includes("publish")) {
                data.allow_hd = 1;
                data.allow_hd_upload = true;
                data.is_hd = 1;
                data.is_hd_upload = true;
                data.video_quality = 'hq';
                data.allow_high_quality = 1;
                data.allow_high_quality_upload = true;
                data.is_high_quality = 1;
                data.enable_hd = true;
                data.hd_upload = 1;
                data.hd = 1;
                config.body = JSON.stringify(data);
                log("Suntik parameter HD ke Fetch upload request (JSON) berhasil!");
              }
            } catch (e) { }
          } else if (config.body instanceof FormData) {
            const formData = config.body;
            if (!formData.has('allow_hd')) formData.append('allow_hd', '1');
            if (!formData.has('allow_hd_upload')) formData.append('allow_hd_upload', 'true');
            if (!formData.has('is_hd')) formData.append('is_hd', '1');
            if (!formData.has('is_hd_upload')) formData.append('is_hd_upload', 'true');
            if (!formData.has('video_quality')) formData.append('video_quality', 'hq');
            if (!formData.has('allow_high_quality')) formData.append('allow_high_quality', '1');
            if (!formData.has('allow_high_quality_upload')) formData.append('allow_high_quality_upload', 'true');
            if (!formData.has('is_high_quality')) formData.append('is_high_quality', '1');
            if (!formData.has('enable_hd')) formData.append('enable_hd', 'true');
            if (!formData.has('hd_upload')) formData.append('hd_upload', '1');
            log("Suntik parameter HD ke Fetch upload request (FormData) berhasil!");
          }
        }
      }
    } catch (err) {
      log("Error saat intersep Fetch: " + err.message);
    }
    return originalFetch.apply(this, arguments);
  };

  const originalOpen = XMLHttpRequest.prototype.open;
  const originalSend = XMLHttpRequest.prototype.send;

  XMLHttpRequest.prototype.open = function (method, url, ...rest) {
    this._url = url;
    return originalOpen.apply(this, [method, url, ...rest]);
  };

  XMLHttpRequest.prototype.send = function (body) {
    if (!currentSettings.autoHDToggle) {
      return originalSend.apply(this, arguments);
    }
    try {
      if (this._url && (this._url.includes("tiktok.com") || this._url.includes("tiktokstudio.com") || this._url.includes("byteoversea") || this._url.includes("tiktokv.com") || this._url.includes("tiktokapis.com") || this._url.includes("ibytedtos.com") || this._url.includes("bytedance.com") || this._url.includes("bytegecko.com") || this._url.includes("tiktokw.com"))) {
        if (body) {
          // Ganti body dengan versi ter-patch secara sinkron
          body = getPatchedBodySync(body);

          if (typeof body === 'string') {
            try {
              let data = JSON.parse(body);
              if (data.video_id || data.creation_id || data.text || data.desc || data.privacy_type || this._url.includes("project") || this._url.includes("post") || this._url.includes("publish")) {
                data.allow_hd = 1;
                data.allow_hd_upload = true;
                data.is_hd = 1;
                data.is_hd_upload = true;
                data.video_quality = 'hq';
                data.allow_high_quality = 1;
                data.allow_high_quality_upload = true;
                data.is_high_quality = 1;
                data.enable_hd = true;
                data.hd_upload = 1;
                data.hd = 1;
                body = JSON.stringify(data);
                log("Suntik parameter HD ke XHR upload request (JSON) berhasil!");
              }
            } catch (e) { }
          } else if (body instanceof FormData) {
            if (!body.has('allow_hd')) body.append('allow_hd', '1');
            if (!body.has('allow_hd_upload')) body.append('allow_hd_upload', 'true');
            if (!body.has('is_hd')) body.append('is_hd', '1');
            if (!body.has('is_hd_upload')) body.append('is_hd_upload', 'true');
            if (!body.has('video_quality')) body.append('video_quality', 'hq');
            if (!body.has('allow_high_quality')) body.append('allow_high_quality', '1');
            if (!body.has('allow_high_quality_upload')) body.append('allow_high_quality_upload', 'true');
            if (!body.has('is_high_quality')) body.append('is_high_quality', '1');
            if (!body.has('enable_hd')) body.append('enable_hd', 'true');
            if (!body.has('hd_upload')) body.append('hd_upload', '1');
            log("Suntik parameter HD ke FormData XHR berhasil!");
          }
        }
      }
    } catch (err) {
      log("Error saat intersep XHR send: " + err.message);
    }
    return originalSend.apply(this, arguments);
  };

  // ==========================================
  // 8. UPLOAD120PATCHER CORE LIBRARY
  // ==========================================
  const CONTAINER_BOXES = new Set([
    'moov', 'trak', 'mdia', 'minf', 'stbl', 'edts', 'udta', 'meta', 'dinf', 'moof', 'traf', 'mvex'
  ]);

  const METHODS = Object.freeze([
    {
      id: 'extension-signal',
      name: 'TikTok Web Signal',
      description: 'Recommended first try: adds TikTok-friendly edit-list and metadata signals while local playback stays normal.'
    },
    {
      id: 'balanced-sync',
      name: 'Balanced Sync',
      description: 'Strong fallback: changes movie and track timing, then adds an edit-list guard.'
    },
    {
      id: 'classic-force',
      name: 'Classic Force',
      description: 'Legacy fallback: the older hard timing patch for stubborn uploads; desktop playback may feel slowed.'
    }
  ]);

  const METHOD_IDS = new Set(METHODS.map(method => method.id));
  const METHOD_BEHAVIOR = Object.freeze({
    'balanced-sync': {
      patchMovieTiming: true,
      patchMediaTiming: true,
      editListMode: 'speed',
      localMetadata: true,
      itunesMetadata: false,
      requireTiming: true
    },
    'extension-signal': {
      patchMovieTiming: false,
      patchMediaTiming: false,
      editListMode: 'neutral',
      localMetadata: true,
      itunesMetadata: true,
      requireTiming: false
    },
    'classic-force': {
      patchMovieTiming: true,
      patchMediaTiming: true,
      editListMode: null,
      localMetadata: false,
      itunesMetadata: false,
      requireTiming: true
    }
  });

  function asBytes(input) {
    if (input instanceof Uint8Array) return input;
    if (input instanceof ArrayBuffer) return new Uint8Array(input);
    if (ArrayBuffer.isView(input)) return new Uint8Array(input.buffer, input.byteOffset, input.byteLength);
    throw new TypeError('Expected an ArrayBuffer or Uint8Array.');
  }

  function makeView(bytes) {
    return new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  }

  function readU32(view, off) {
    return view.getUint32(off, false);
  }

  function readU64(view, off) {
    const hi = BigInt(view.getUint32(off, false));
    const lo = BigInt(view.getUint32(off + 4, false));
    return (hi << 32n) + lo;
  }

  function writeU32(view, off, value) {
    view.setUint32(off, Math.max(0, Math.min(0xFFFFFFFF, Math.floor(value))) >>> 0, false);
  }

  function writeU64(view, off, value) {
    const big = typeof value === 'bigint' ? value : BigInt(Math.floor(value));
    view.setUint32(off, Number((big >> 32n) & 0xFFFFFFFFn), false);
    view.setUint32(off + 4, Number(big & 0xFFFFFFFFn), false);
  }

  function writeI16(view, off, value) {
    view.setInt16(off, value, false);
  }

  function writeU16(view, off, value) {
    view.setUint16(off, value, false);
  }

  function fourcc(bytes, off) {
    if (off < 0 || off + 4 > bytes.length) return '';
    return String.fromCharCode(bytes[off], bytes[off + 1], bytes[off + 2], bytes[off + 3]);
  }

  function isSaneType(type) {
    return /^[\x20-\x7E]{4}$/.test(type);
  }

  function* walkBoxes(bytes, start = 0, end = bytes.length) {
    const view = makeView(bytes);
    let pos = start;
    while (pos + 8 <= end) {
      const size = readU32(view, pos);
      const type = fourcc(bytes, pos + 4);
      if (!isSaneType(type)) return;

      let headerSize = 8;
      let boxEnd;
      if (size === 1) {
        if (pos + 16 > end) return;
        const largeSize = readU64(view, pos + 8);
        if (largeSize > BigInt(Number.MAX_SAFE_INTEGER)) return;
        headerSize = 16;
        boxEnd = pos + Number(largeSize);
      } else if (size === 0) {
        boxEnd = end;
      } else {
        boxEnd = pos + size;
      }

      if (boxEnd > end || boxEnd <= pos || pos + headerSize > boxEnd) return;
      yield { type, start: pos, headerSize, contentStart: pos + headerSize, contentEnd: boxEnd, end: boxEnd };
      pos = boxEnd;
    }
  }

  function findBoxes(bytes, type, start = 0, end = bytes.length, results = []) {
    for (const box of walkBoxes(bytes, start, end)) {
      if (box.type === type) results.push(box);
      const childStart = box.type === 'meta' ? box.contentStart + 4 : box.contentStart;
      if (CONTAINER_BOXES.has(box.type) && childStart < box.contentEnd) {
        findBoxes(bytes, type, childStart, box.contentEnd, results);
      }
    }
    return results;
  }

  function findChild(bytes, parent, type) {
    const childStart = parent.type === 'meta' ? parent.contentStart + 4 : parent.contentStart;
    for (const box of walkBoxes(bytes, childStart, parent.contentEnd)) {
      if (box.type === type) return box;
    }
    return null;
  }

  function findDirectChildren(bytes, parent, type) {
    const children = [];
    const childStart = parent.type === 'meta' ? parent.contentStart + 4 : parent.contentStart;
    for (const box of walkBoxes(bytes, childStart, parent.contentEnd)) {
      if (box.type === type) children.push(box);
    }
    return children;
  }

  function findDescendant(bytes, parent, types) {
    return types.reduce((current, type) => current ? findChild(bytes, current, type) : null, parent);
  }

  function readMvhd(bytes, box) {
    const view = makeView(bytes);
    const off = box.contentStart;
    const version = bytes[off];
    let p = off + 4;
    if (version === 1) {
      p += 16;
      return {
        version,
        timescale: readU32(view, p),
        duration: readU64(view, p + 4),
        timescaleOffset: p,
        durationOffset: p + 4,
        durationBytes: 8
      };
    }
    p += 8;
    return {
      version,
      timescale: readU32(view, p),
      duration: readU32(view, p + 4),
      timescaleOffset: p,
      durationOffset: p + 4,
      durationBytes: 4
    };
  }

  function readMdhd(bytes, box) {
    const view = makeView(bytes);
    const off = box.contentStart;
    const version = bytes[off];
    let p = off + 4;
    if (version === 1) {
      p += 16;
      return {
        version,
        timescale: readU32(view, p),
        duration: readU64(view, p + 4),
        timescaleOffset: p,
        durationOffset: p + 4,
        durationBytes: 8
      };
    }
    p += 8;
    return {
      version,
      timescale: readU32(view, p),
      duration: readU32(view, p + 4),
      timescaleOffset: p,
      durationOffset: p + 4,
      durationBytes: 4
    };
  }

  function readStts(bytes, box) {
    const view = makeView(bytes);
    const entryCount = readU32(view, box.contentStart + 4);
    const maxEntries = Math.floor((box.contentEnd - (box.contentStart + 8)) / 8);
    const count = Math.min(entryCount, maxEntries);
    const deltas = new Map();
    let totalSamples = 0;
    let weightedDelta = 0;

    for (let i = 0; i < count; i++) {
      const sampleCount = readU32(view, box.contentStart + 8 + i * 8);
      const sampleDelta = readU32(view, box.contentStart + 12 + i * 8);
      totalSamples += sampleCount;
      weightedDelta += sampleCount * sampleDelta;
      deltas.set(sampleDelta, (deltas.get(sampleDelta) || 0) + sampleCount);
    }

    let modeDelta = 0;
    let modeSamples = 0;
    for (const [delta, samples] of deltas.entries()) {
      if (samples > modeSamples) {
        modeDelta = delta;
        modeSamples = samples;
      }
    }

    return {
      entryCount,
      parsedEntries: count,
      totalSamples,
      avgDelta: totalSamples > 0 ? weightedDelta / totalSamples : 0,
      modeDelta
    };
  }

  function findVideoTrack(bytes, moov) {
    const traks = [];
    for (const box of walkBoxes(bytes, moov.contentStart, moov.contentEnd)) {
      if (box.type === 'trak') traks.push(box);
    }
    for (const trak of traks) {
      const mdia = findChild(bytes, trak, 'mdia');
      const hdlr = mdia && findChild(bytes, mdia, 'hdlr');
      if (!hdlr) continue;
      const handlerType = fourcc(bytes, hdlr.contentStart + 8);
      if (handlerType === 'vide') return { trak, mdia };
    }
    return null;
  }

  function trackHandlerType(bytes, trak) {
    const mdia = findChild(bytes, trak, 'mdia');
    const hdlr = mdia && findChild(bytes, mdia, 'hdlr');
    return hdlr ? fourcc(bytes, hdlr.contentStart + 8) : '';
  }

  function isVideoTrack(bytes, trak) {
    return trackHandlerType(bytes, trak) === 'vide';
  }

  function readTkhdSize(bytes, tkhd) {
    if (!tkhd || tkhd.contentEnd - tkhd.contentStart < 8) return { width: 0, height: 0 };
    const view = makeView(bytes);
    const widthRaw = readU32(view, tkhd.contentEnd - 8);
    const heightRaw = readU32(view, tkhd.contentEnd - 4);
    return { width: widthRaw / 65536, height: heightRaw / 65536 };
  }

  function roundFps(fps) {
    if (!Number.isFinite(fps) || fps <= 0) return 0;
    return Math.abs(fps - Math.round(fps)) < 0.05 ? Math.round(fps) : Number(fps.toFixed(3));
  }

  function inspectMp4(input) {
    const bytes = asBytes(input);
    const ftyp = findBoxes(bytes, 'ftyp')[0];
    if (!ftyp) return { isMp4: false, error: 'Not an MP4 / ISO BMFF file (no ftyp box).' };

    const major = fourcc(bytes, ftyp.contentStart);
    const moov = findBoxes(bytes, 'moov')[0];
    if (!moov) return { isMp4: true, major, error: 'Missing moov box (file may be incomplete).' };

    const mvhd = findChild(bytes, moov, 'mvhd');
    if (!mvhd) return { isMp4: true, major, error: 'Missing mvhd box.' };

    const mvhdData = readMvhd(bytes, mvhd);
    const videoTrack = findVideoTrack(bytes, moov);
    let fps = 0;
    let rawFps = 0;
    let frameCount = 0;
    let durationSec = 0;
    let videoTimescale = 0;
    let width = 0;
    let height = 0;

    if (videoTrack) {
      const mdhd = findChild(bytes, videoTrack.mdia, 'mdhd');
      if (mdhd) {
        const m = readMdhd(bytes, mdhd);
        videoTimescale = m.timescale;
        const duration = typeof m.duration === 'bigint' ? Number(m.duration) : m.duration;
        durationSec = m.timescale > 0 ? duration / m.timescale : 0;
      }

      const size = readTkhdSize(bytes, findChild(bytes, videoTrack.trak, 'tkhd'));
      width = size.width;
      height = size.height;

      const stts = findDescendant(bytes, videoTrack.trak, ['mdia', 'minf', 'stbl', 'stts']);
      if (stts && videoTimescale > 0) {
        const s = readStts(bytes, stts);
        frameCount = s.totalSamples;
        if (s.modeDelta > 0) rawFps = videoTimescale / s.modeDelta;
        else if (s.avgDelta > 0) rawFps = videoTimescale / s.avgDelta;
        else if (durationSec > 0) rawFps = frameCount / durationSec;
        fps = roundFps(rawFps);
      }
    }

    return {
      isMp4: true,
      major,
      fps,
      rawFps,
      frameCount,
      durationSec,
      width: Math.round(width),
      height: Math.round(height),
      movieTimescale: mvhdData.timescale,
      videoTimescale,
      mvhdCount: findBoxes(bytes, 'mvhd').length,
      mdhdCount: findBoxes(bytes, 'mdhd').length
    };
  }

  function checkedU32(value, label, min = 1) {
    const integer = Math.floor(value);
    if (!Number.isFinite(integer) || integer < min || integer > 0xFFFFFFFF) {
      throw new Error(`${label} would overflow a 32-bit MP4 field.`);
    }
    return integer;
  }

  function normalizePatchOptions(options = 4) {
    if (typeof options === 'number') {
      if (!Number.isFinite(options) || options < 1) throw new Error(`Invalid divider: ${options}`);
      return { divider: Math.max(1, Math.round(options)), method: 'classic-force' };
    }

    if (!options || typeof options !== 'object') {
      throw new Error('Patch options must be a divider number or options object.');
    }

    const divider = Number(options.divider ?? 4);
    if (!Number.isFinite(divider) || divider < 1) throw new Error(`Invalid divider: ${options.divider}`);

    const method = options.method || 'balanced-sync';
    if (!METHOD_IDS.has(method)) throw new Error(`Unknown patch method: ${method}`);

    return {
      divider: Math.max(1, Math.round(divider)),
      method
    };
  }

  function concatBytes(parts) {
    const total = parts.reduce((sum, part) => sum + part.byteLength, 0);
    const out = new Uint8Array(total);
    let offset = 0;
    for (const part of parts) {
      out.set(part, offset);
      offset += part.byteLength;
    }
    return out;
  }

  function stringBytes(value) {
    const out = new Uint8Array(value.length);
    for (let i = 0; i < value.length; i++) out[i] = value.charCodeAt(i) & 0xFF;
    return out;
  }

  function boxTypeBytes(type) {
    if (typeof type === 'string') return stringBytes(type);
    if (type instanceof Uint8Array && type.byteLength === 4) return type;
    throw new Error('MP4 box type must be a four-character string or four bytes.');
  }

  function makeBox(type, ...parts) {
    const payload = concatBytes(parts);
    const out = new Uint8Array(payload.byteLength + 8);
    const view = makeView(out);
    writeU32(view, 0, out.byteLength);
    out.set(boxTypeBytes(type), 4);
    out.set(payload, 8);
    return out;
  }

  function makeFullBox(type, version, flags, ...parts) {
    const header = new Uint8Array(4);
    header[0] = version & 0xFF;
    header[1] = (flags >> 16) & 0xFF;
    header[2] = (flags >> 8) & 0xFF;
    header[3] = flags & 0xFF;
    return makeBox(type, header, ...parts);
  }

  function makeEditListBox(segmentDuration, divider) {
    const mediaRate = Math.max(1, Math.min(0x7FFF, Math.round(divider)));
    const durationNumber = typeof segmentDuration === 'bigint' ? Number(segmentDuration) : segmentDuration;

    if (typeof segmentDuration === 'bigint' || durationNumber > 0xFFFFFFFF) {
      const payload = new Uint8Array(24);
      const view = makeView(payload);
      writeU32(view, 0, 1);
      writeU64(view, 4, segmentDuration);
      writeU64(view, 12, 0n);
      writeI16(view, 20, mediaRate);
      writeU16(view, 22, 0);
      return makeFullBox('elst', 1, 0, payload);
    }

    const payload = new Uint8Array(16);
    const view = makeView(payload);
    writeU32(view, 0, 1);
    writeU32(view, 4, checkedU32(durationNumber, 'elst segment duration', 0));
    view.setInt32(8, 0, false);
    writeI16(view, 12, mediaRate);
    writeU16(view, 14, 0);
    return makeFullBox('elst', 0, 0, payload);
  }

  function makeMetadataHintBox(method, divider) {
    return makeBox('u120', stringBytes(JSON.stringify({
      tool: 'Upload120',
      method,
      divider,
      local: true
    })));
  }

  function makeDataBoxUtf8(value) {
    const text = new TextEncoder().encode(value);
    const payload = new Uint8Array(8 + text.byteLength);
    const view = makeView(payload);
    writeU32(view, 0, 1);
    writeU32(view, 4, 0);
    payload.set(text, 8);
    return makeBox('data', payload);
  }

  function makeItunesItem(typeBytes, value) {
    return makeBox(typeBytes, makeDataBoxUtf8(value));
  }

  function makeItunesMetadataBox(method, divider) {
    const methodInfo = METHODS.find(item => item.id === method);
    const methodName = methodInfo ? methodInfo.name : method;
    const handlerPayload = new Uint8Array(21);
    handlerPayload.set(stringBytes('mdir'), 4);
    handlerPayload.set(stringBytes('appl'), 8);

    const hdlr = makeFullBox('hdlr', 0, 0, handlerPayload);
    const ilst = makeBox('ilst',
      makeItunesItem(new Uint8Array([0xA9, 0x63, 0x6D, 0x74]), `${methodName} ${divider}x`),
      makeItunesItem(new Uint8Array([0x61, 0x41, 0x52, 0x54]), 'Upload120'),
      makeItunesItem(new Uint8Array([0xA9, 0x41, 0x52, 0x54]), 'Upload120')
    );

    return makeFullBox('meta', 0, 0, hdlr, ilst);
  }

  function patchMvhdInPlace(bytes, mvhd, divider) {
    const view = makeView(bytes);
    const m = readMvhd(bytes, mvhd);
    const newTimescale = checkedU32(Math.max(1, m.timescale / divider), 'mvhd timescale');
    writeU32(view, m.timescaleOffset, newTimescale);

    if (m.durationBytes === 4) {
      const newDuration = checkedU32(m.duration / divider, 'mvhd duration', 0);
      writeU32(view, m.durationOffset, newDuration);
      return { timescale: newTimescale, duration: newDuration };
    }

    const newDuration = m.duration / BigInt(divider);
    writeU64(view, m.durationOffset, newDuration);
    return { timescale: newTimescale, duration: newDuration };
  }

  function patchMdhdInPlace(bytes, mdhd, divider) {
    const view = makeView(bytes);
    const m = readMdhd(bytes, mdhd);
    const newTimescale = checkedU32(Math.max(1, m.timescale / divider), 'mdhd timescale');
    writeU32(view, m.timescaleOffset, newTimescale);

    if (m.durationBytes === 4) {
      const newDuration = checkedU32(m.duration / divider, 'mdhd duration', 0);
      writeU32(view, m.durationOffset, newDuration);
      return { timescale: newTimescale, duration: newDuration };
    }

    const newDuration = m.duration / BigInt(divider);
    writeU64(view, m.durationOffset, newDuration);
    return { timescale: newTimescale, duration: newDuration };
  }

  function adjustChunkOffsets(bytes, threshold, delta) {
    if (delta === 0) return;
    const view = makeView(bytes);

    for (const stco of findBoxes(bytes, 'stco')) {
      const entryCount = readU32(view, stco.contentStart + 4);
      const maxEntries = Math.floor((stco.contentEnd - (stco.contentStart + 8)) / 4);
      for (let i = 0; i < Math.min(entryCount, maxEntries); i++) {
        const offset = stco.contentStart + 8 + i * 4;
        const value = readU32(view, offset);
        if (value >= threshold) writeU32(view, offset, checkedU32(value + delta, 'stco chunk offset', 0));
      }
    }

    for (const co64 of findBoxes(bytes, 'co64')) {
      const entryCount = readU32(view, co64.contentStart + 4);
      const maxEntries = Math.floor((co64.contentEnd - (co64.contentStart + 8)) / 8);
      for (let i = 0; i < Math.min(entryCount, maxEntries); i++) {
        const offset = co64.contentStart + 8 + i * 8;
        const value = readU64(view, offset);
        if (value >= BigInt(threshold)) writeU64(view, offset, value + BigInt(delta));
      }
    }
  }

  function applyOperations(bytes, operations) {
    const sorted = [...operations].sort((a, b) => b.start - a.start);
    let current = bytes;

    for (const op of sorted) {
      const replacedLength = op.end - op.start;
      const delta = op.insert.byteLength - replacedLength;
      current = concatBytes([current.slice(0, op.start), op.insert, current.slice(op.end)]);
      const view = makeView(current);

      for (const start of [...new Set(op.ancestors)]) {
        const size = readU32(view, start);
        if (size === 1) writeU64(view, start + 8, readU64(view, start + 8) + BigInt(delta));
        else writeU32(view, start, checkedU32(size + delta, `${fourcc(current, start + 4)} box size`, 8));
      }

      adjustChunkOffsets(current, op.start, delta);
    }

    return current;
  }

  function collectEditListOperations(bytes, divider) {
    const operations = [];
    let elstCount = 0;

    for (const moov of findBoxes(bytes, 'moov')) {
      const mvhd = findChild(bytes, moov, 'mvhd');
      if (!mvhd) continue;
      const movie = readMvhd(bytes, mvhd);

      for (const trak of findDirectChildren(bytes, moov, 'trak')) {
        if (!isVideoTrack(bytes, trak)) continue;
        const elst = makeEditListBox(movie.duration, divider);
        const edts = findChild(bytes, trak, 'edts');

        if (edts) {
          const existing = findChild(bytes, edts, 'elst');
          if (existing) {
            operations.push({
              start: existing.start,
              end: existing.end,
              insert: elst,
              ancestors: [moov.start, trak.start, edts.start]
            });
          } else {
            operations.push({
              start: edts.contentEnd,
              end: edts.contentEnd,
              insert: elst,
              ancestors: [moov.start, trak.start, edts.start]
            });
          }
        } else {
          const tkhd = findChild(bytes, trak, 'tkhd');
          const start = tkhd ? tkhd.end : trak.contentStart;
          operations.push({
            start,
            end: start,
            insert: makeBox('edts', elst),
            ancestors: [moov.start, trak.start]
          });
        }

        elstCount++;
      }
    }

    return { operations, elstCount };
  }

  function collectMetadataOperations(bytes, method, divider) {
    const operations = [];

    for (const moov of findBoxes(bytes, 'moov')) {
      const hint = makeMetadataHintBox(method, divider);
      const udta = findChild(bytes, moov, 'udta');

      if (udta) {
        operations.push({
          start: udta.contentEnd,
          end: udta.contentEnd,
          insert: hint,
          ancestors: [moov.start, udta.start]
        });
      } else {
        operations.push({
          start: moov.contentEnd,
          end: moov.contentEnd,
          insert: makeBox('udta', hint),
          ancestors: [moov.start]
        });
      }
    }

    return operations;
  }

  function collectItunesMetadataOperations(bytes, method, divider) {
    const operations = [];

    for (const moov of findBoxes(bytes, 'moov')) {
      const meta = makeItunesMetadataBox(method, divider);
      const udta = findChild(bytes, moov, 'udta');

      if (udta) {
        operations.push({
          start: udta.contentEnd,
          end: udta.contentEnd,
          insert: meta,
          ancestors: [moov.start, udta.start]
        });
      } else {
        operations.push({
          start: moov.contentEnd,
          end: moov.contentEnd,
          insert: makeBox('udta', meta),
          ancestors: [moov.start]
        });
      }
    }

    return operations;
  }

  function patchTimingFields(bytes, divider, patchMovieTiming, patchMediaTiming) {
    let mvhdCount = 0;
    let mdhdCount = 0;

    for (const moov of findBoxes(bytes, 'moov')) {
      if (patchMovieTiming) {
        const mvhd = findChild(bytes, moov, 'mvhd');
        if (mvhd) {
          patchMvhdInPlace(bytes, mvhd, divider);
          mvhdCount++;
        }
      }

      if (!patchMediaTiming) continue;

      for (const trak of findDirectChildren(bytes, moov, 'trak')) {
        if (!isVideoTrack(bytes, trak)) continue;
        const mdia = findChild(bytes, trak, 'mdia');
        const mdhd = mdia && findChild(bytes, mdia, 'mdhd');
        if (!mdhd) continue;
        patchMdhdInPlace(bytes, mdhd, divider);
        mdhdCount++;
      }
    }

    return { mvhdCount, mdhdCount };
  }

  function patchMp4Buffer(input, options = 4) {
    const { divider, method } = normalizePatchOptions(options);
    const source = asBytes(input);
    let bytes = new Uint8Array(source.byteLength);
    bytes.set(source);
    const behavior = METHOD_BEHAVIOR[method];
    const warnings = [];

    const { mvhdCount, mdhdCount } = patchTimingFields(
      bytes,
      divider,
      behavior.patchMovieTiming,
      behavior.patchMediaTiming
    );
    if (behavior.requireTiming && (mvhdCount === 0 || (behavior.patchMediaTiming && mdhdCount === 0))) {
      throw new Error('No mvhd/mdhd timing boxes were found to patch.');
    }

    const operations = [];
    let elstCount = 0;
    let metadataCount = 0;

    if (behavior.editListMode) {
      const editLists = collectEditListOperations(bytes, behavior.editListMode === 'neutral' ? 1 : divider);
      operations.push(...editLists.operations);
      elstCount = editLists.elstCount;
      if (elstCount === 0) warnings.push('No tracks were available for an edit-list signal.');
    }

    if (behavior.localMetadata) {
      const metadataOps = collectMetadataOperations(bytes, method, divider);
      operations.push(...metadataOps);
      metadataCount += metadataOps.length;
    }

    if (behavior.itunesMetadata) {
      const itunesOps = collectItunesMetadataOperations(bytes, method, divider);
      operations.push(...itunesOps);
      metadataCount += itunesOps.length;
    }

    if (!behavior.requireTiming && operations.length === 0) throw new Error('No moov box was found to tag.');

    if (operations.length > 0) bytes = applyOperations(bytes, operations);

    return {
      buffer: bytes.buffer,
      bytes,
      method,
      divider,
      warnings,
      mvhdCount,
      mdhdCount,
      elstCount,
      metadataCount
    };
  }

  window.Upload120Patcher = { METHODS, inspectMp4, patchMp4Buffer, walkBoxes };

  window.addEventListener("message", (event) => {
    if (event.source !== window) return;
    if (event.data && event.data.source === "tiktok-hq-content-bridge") {
      if (event.data.action === "settingsResponse") {
        const newSettings = event.data.settings || {};
        const oldBypass = currentSettings.bypassCompression;
        currentSettings = { ...currentSettings, ...newSettings };

        if (oldBypass !== currentSettings.bypassCompression) {
          applyBypassSettings();
        }
      }
    }
  });

  window.postMessage({ source: "tiktok-hq-injector", action: "getSettings" }, "*");
  log("Inisialisasi interseptor anti-crash selesai.");
})();
