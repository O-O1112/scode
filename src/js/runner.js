/**
 * 建置與執行輸出台管理器 (支援 HTML5 沙盒、JavaScript、Python WASM、Lua 引擎與分頁視圖切換)
 */
const Runner = {
  outputDrawerEl: null,
  consoleLogEl: null,
  previewFrameEl: null,
  outputTitleEl: null,
  tabConsoleBtn: null,
  tabPreviewBtn: null,
  btnMaximizeEl: null,
  pyodideInstance: null,
  isMaximized: false,
  activeOutputTab: "console", // 'console' | 'preview'

  init() {
    this.outputDrawerEl = document.getElementById("output-drawer");
    this.consoleLogEl = document.getElementById("console-log");
    this.previewFrameEl = document.getElementById("preview-frame");
    this.outputTitleEl = document.getElementById("output-title");
    this.tabConsoleBtn = document.getElementById("tab-output-console");
    this.tabPreviewBtn = document.getElementById("tab-output-preview");
    this.btnMaximizeEl = document.getElementById("btn-maximize-output");

    // 監聽來自沙盒 iframe 的訊息
    window.addEventListener("message", (event) => {
      if (event.data && event.data.type === "MONOCODE_LOG") {
        this.appendLog(event.data.level, event.data.message);
      }
    });

    if (this.tabConsoleBtn && this.tabPreviewBtn) {
      this.tabConsoleBtn.addEventListener("click", () => this.switchOutputTab("console"));
      this.tabPreviewBtn.addEventListener("click", () => this.switchOutputTab("preview"));
    }

    if (this.btnMaximizeEl) {
      this.btnMaximizeEl.addEventListener("click", () => this.toggleMaximize());
    }
  },

  show() {
    this.outputDrawerEl.classList.remove("hidden");
  },

  hide() {
    this.outputDrawerEl.classList.add("hidden");
  },

  toggleMaximize() {
    this.isMaximized = !this.isMaximized;
    if (this.isMaximized) {
      this.outputDrawerEl.classList.add("maximized");
      this.btnMaximizeEl.textContent = "還原";
    } else {
      this.outputDrawerEl.classList.remove("maximized");
      this.btnMaximizeEl.textContent = "全螢幕";
    }
    if (window.EditorManager && window.EditorManager.editor) {
      setTimeout(() => window.EditorManager.editor.layout(), 150);
    }
  },

  switchOutputTab(tab) {
    this.activeOutputTab = tab;
    if (tab === "console") {
      this.consoleLogEl.style.display = "block";
      this.previewFrameEl.style.display = "none";
      if (this.tabConsoleBtn) this.tabConsoleBtn.classList.add("active");
      if (this.tabPreviewBtn) this.tabPreviewBtn.classList.remove("active");
    } else {
      this.consoleLogEl.style.display = "none";
      this.previewFrameEl.style.display = "block";
      if (this.tabPreviewBtn) this.tabPreviewBtn.classList.add("active");
      if (this.tabConsoleBtn) this.tabConsoleBtn.classList.remove("active");
    }
  },

  clearLog() {
    if (this.consoleLogEl) {
      this.consoleLogEl.textContent = "";
    }
  },

  appendLog(level, message) {
    if (!this.consoleLogEl) return;
    const time = new Date().toLocaleTimeString();
    const line = document.createElement("div");
    line.style.padding = "2px 0";
    line.style.fontFamily = "var(--font-mono)";
    line.style.fontSize = "12px";

    if (level === "error") {
      line.style.color = "#ff6b6b";
    } else if (level === "warn") {
      line.style.color = "#feca57";
    } else if (level === "success") {
      line.style.color = "#ffffff";
      line.style.fontWeight = "bold";
    } else {
      line.style.color = "#cccccc";
    }
    line.textContent = `[${time}] ${message}`;
    this.consoleLogEl.appendChild(line);
    this.consoleLogEl.scrollTop = this.consoleLogEl.scrollHeight;
  },

  async loadScript(src) {
    return new Promise((resolve, reject) => {
      const existing = document.querySelector(`script[src="${src}"]`);
      if (existing) {
        resolve();
        return;
      }
      const s = document.createElement("script");
      s.src = src;
      s.onload = () => resolve();
      s.onerror = () => reject(new Error(`載入依賴腳本失敗: ${src}`));
      document.head.appendChild(s);
    });
  },

  async runProject(project) {
    this.show();
    this.clearLog();

    if (!project || !project.files) {
      this.appendLog("warn", "無效的專案內容");
      return;
    }

    const activeFile = window.FileTree ? window.FileTree.activeFile : Object.keys(project.files)[0];
    const ext = activeFile ? activeFile.split(".").pop().toLowerCase() : "";

    const startTime = performance.now();

    if (project.type === "web" || project.files["index.html"]) {
      this.runWeb(project);
    } else if (ext === "py" || project.type === "python") {
      await this.runPython(project, activeFile);
    } else if (ext === "lua" || project.type === "lua") {
      await this.runLua(project, activeFile);
    } else if (ext === "js" || project.type === "js") {
      this.runJavaScript(project, activeFile);
    } else {
      this.appendLog("warn", `檔案類型 (.${ext}) 暫無內建直譯器，可透過 Ctrl+S 儲存本機檔案。`);
    }

    const elapsed = Math.round(performance.now() - startTime);
    this.appendLog("info", `流程完成，耗時 ${elapsed}ms`);
  },

  runWeb(project) {
    if (this.tabPreviewBtn) this.tabPreviewBtn.style.display = "inline-flex";
    this.switchOutputTab("preview");
    this.outputTitleEl.textContent = "HTML5 沙盒即時預覽";

    this.appendLog("info", "編譯中：正在打包 HTML、CSS 與 JavaScript...");

    let html = project.files["index.html"] || "<h1>No index.html found</h1>";
    const css = project.files["style.css"] || "";
    const js = project.files["app.js"] || "";

    if (css) {
      html = html.replace("</head>", `<style>${css}</style></head>`);
    }

    const injectScript = `
      <script>
        (function() {
          const originalLog = console.log;
          const originalError = console.error;
          const originalWarn = console.warn;
          
          console.log = function(...args) {
            window.parent.postMessage({ type: 'MONOCODE_LOG', level: 'info', message: args.join(' ') }, '*');
            originalLog.apply(console, args);
          };
          console.error = function(...args) {
            window.parent.postMessage({ type: 'MONOCODE_LOG', level: 'error', message: args.join(' ') }, '*');
            originalError.apply(console, args);
          };
          console.warn = function(...args) {
            window.parent.postMessage({ type: 'MONOCODE_LOG', level: 'warn', message: args.join(' ') }, '*');
            originalWarn.apply(console, args);
          };
          window.onerror = function(msg, url, line) {
            window.parent.postMessage({ type: 'MONOCODE_LOG', level: 'error', message: msg + ' (第 ' + line + ' 行)' }, '*');
          };
        })();
      </script>
      <script>${js}</script>
    `;

    html = html.replace("</body>", `${injectScript}</body>`);
    this.previewFrameEl.srcdoc = html;
    this.appendLog("success", "建置完成，沙盒畫面已更新。");
  },

  runJavaScript(project, activeFile) {
    if (this.tabPreviewBtn) this.tabPreviewBtn.style.display = "none";
    this.switchOutputTab("console");
    this.outputTitleEl.textContent = `JavaScript 執行 (${activeFile})`;

    this.appendLog("info", `啟動 JavaScript 沙盒 (${activeFile})...`);
    const code = project.files[activeFile] || project.files["index.js"] || "";

    try {
      const sandboxLogs = [];
      const customConsole = {
        log: (...args) => sandboxLogs.push({ level: "info", text: args.join(" ") }),
        error: (...args) => sandboxLogs.push({ level: "error", text: args.join(" ") }),
        warn: (...args) => sandboxLogs.push({ level: "warn", text: args.join(" ") }),
        info: (...args) => sandboxLogs.push({ level: "info", text: args.join(" ") })
      };
      const runFn = new Function("console", code);
      runFn(customConsole);

      sandboxLogs.forEach((l) => this.appendLog(l.level, l.text));
      this.appendLog("success", "執行完成 (Exit Code: 0)");
    } catch (err) {
      this.appendLog("error", "執行期錯誤：" + err.message);
    }
  },

  async runPython(project, activeFile) {
    if (this.tabPreviewBtn) this.tabPreviewBtn.style.display = "none";
    this.switchOutputTab("console");
    this.outputTitleEl.textContent = `Python (WASM) 執行環境 (${activeFile})`;

    const targetFile = activeFile && activeFile.endsWith(".py") ? activeFile : "main.py";
    const pyCode = project.files[targetFile] || "";

    if (!pyCode.trim()) {
      this.appendLog("warn", "程式碼為空，略過執行。");
      return;
    }

    try {
      if (!this.pyodideInstance) {
        this.appendLog("info", "首次執行正在載入 Pyodide (Python 3.11 WASM 引擎)，請稍候...");
        await this.loadScript("https://cdn.jsdelivr.net/pyodide/v0.25.1/full/pyodide.js");
        
        this.pyodideInstance = await loadPyodide({
          stdout: (text) => this.appendLog("info", text),
          stderr: (text) => this.appendLog("error", text)
        });
        this.appendLog("success", "Python WASM 核心已就緒！");
      }

      this.appendLog("info", `執行中：${targetFile}...`);
      await this.pyodideInstance.runPythonAsync(pyCode);
      this.appendLog("success", "Python 腳本執行完成 (Exit Code: 0)");
    } catch (err) {
      this.appendLog("error", "Python 執行錯誤：\n" + (err.message || err));
    }
  },

  async runLua(project, activeFile) {
    if (this.tabPreviewBtn) this.tabPreviewBtn.style.display = "none";
    this.switchOutputTab("console");
    this.outputTitleEl.textContent = `Lua 虛擬機 (${activeFile})`;

    const targetFile = activeFile && activeFile.endsWith(".lua") ? activeFile : "main.lua";
    const luaCode = project.files[targetFile] || "";

    if (!luaCode.trim()) {
      this.appendLog("warn", "Lua 程式碼為空，略過執行。");
      return;
    }

    try {
      if (!window.fengari) {
        this.appendLog("info", "首次執行正在載入 Fengari Lua 引擎，請稍候...");
        await this.loadScript("https://cdn.jsdelivr.net/npm/fengari-web@0.1.4/dist/fengari-web.min.js");
        this.appendLog("success", "Lua 引擎載入成功！");
      }

      this.appendLog("info", `執行中：${targetFile}...`);

      const oldLog = console.log;
      console.log = (...args) => {
        this.appendLog("info", args.join(" "));
      };

      try {
        window.fengari.load(luaCode)();
        this.appendLog("success", "Lua 腳本執行完成 (Exit Code: 0)");
      } finally {
        console.log = oldLog;
      }
    } catch (err) {
      this.appendLog("error", "Lua 語法或執行錯誤：\n" + (err.message || err));
    }
  }
};
