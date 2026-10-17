/**
 * Monaco 編輯器核心與分頁標籤管理模組 (支援動態偏好設定與載入狀態)
 */
const EditorManager = {
  editor: null,
  containerEl: null,
  tabBarEl: null,
  openTabs: [], // array of filenames
  activeTab: null,
  models: {}, // filename -> monaco model

  extToLang: {
    html: "html",
    htm: "html",
    css: "css",
    js: "javascript",
    mjs: "javascript",
    py: "python",
    lua: "lua",
    json: "json",
    md: "markdown",
    txt: "plaintext"
  },

  init(containerEl, tabBarEl, onReady) {
    this.containerEl = containerEl;
    this.tabBarEl = tabBarEl;

    const settings = window.Storage ? Storage.getSettings() : {
      fontSize: 14,
      tabSize: 2,
      wordWrap: "on",
      minimap: false
    };

    require.config({
      paths: { vs: "https://cdnjs.cloudflare.com/ajax/libs/monaco-editor/0.45.0/min/vs" }
    });

    require(["vs/editor/editor.main"], () => {
      this.editor = monaco.editor.create(this.containerEl, {
        theme: "hc-black",
        fontSize: settings.fontSize,
        tabSize: settings.tabSize,
        wordWrap: settings.wordWrap,
        minimap: { enabled: settings.minimap },
        fontFamily: "'Consolas', 'Courier New', monospace",
        automaticLayout: true,
        lineNumbers: "on",
        scrollBeyondLastLine: false,
        cursorBlinking: "smooth",
        quickSuggestions: true,
        suggestOnTriggerCharacters: true
      });

      // 監聽光標位置更新狀態列
      this.editor.onDidChangeCursorPosition((e) => {
        const statusCursor = document.getElementById("status-cursor");
        if (statusCursor) {
          statusCursor.textContent = `Ln ${e.position.lineNumber}, Col ${e.position.column}`;
        }
      });

      window.addEventListener("resize", () => {
        if (this.editor) this.editor.layout();
      });

      // 隱藏編輯器載入遮罩
      const loadingOverlay = document.getElementById("editor-loading-overlay");
      if (loadingOverlay) {
        loadingOverlay.style.opacity = "0";
        setTimeout(() => loadingOverlay.remove(), 250);
      }

      if (onReady) onReady();
    });
  },

  applySettings(settings) {
    if (!this.editor) return;
    this.editor.updateOptions({
      fontSize: parseInt(settings.fontSize, 10) || 14,
      tabSize: parseInt(settings.tabSize, 10) || 2,
      wordWrap: settings.wordWrap || "on",
      minimap: { enabled: !!settings.minimap }
    });
  },

  getLanguageFromFilename(filename) {
    const ext = filename.split(".").pop().toLowerCase();
    return this.extToLang[ext] || "plaintext";
  },

  openFile(filename, content) {
    if (!this.editor) return;

    if (!this.openTabs.includes(filename)) {
      this.openTabs.push(filename);
    }
    this.activeTab = filename;

    let model = this.models[filename];
    const lang = this.getLanguageFromFilename(filename);

    if (!model) {
      model = monaco.editor.createModel(content, lang);
      model.onDidChangeContent(() => {
        if (window.FileTree) {
          FileTree.setFileContent(filename, model.getValue());
        }
      });
      this.models[filename] = model;
    } else if (content !== undefined && model.getValue() !== content) {
      model.setValue(content);
    }

    this.editor.setModel(model);
    this.renderTabs();

    const statusLang = document.getElementById("status-lang");
    if (statusLang) {
      statusLang.textContent = lang.toUpperCase();
    }
  },

  closeTab(filename) {
    this.openTabs = this.openTabs.filter((t) => t !== filename);
    if (this.models[filename]) {
      this.models[filename].dispose();
      delete this.models[filename];
    }
    if (this.activeTab === filename) {
      this.activeTab = this.openTabs[this.openTabs.length - 1] || null;
      if (this.activeTab && window.FileTree) {
        this.openFile(this.activeTab, FileTree.getFile(this.activeTab));
      }
    }
    this.renderTabs();
  },

  renderTabs() {
    if (!this.tabBarEl) return;
    this.tabBarEl.innerHTML = "";

    this.openTabs.forEach((filename) => {
      const tab = document.createElement("div");
      tab.className = "tab-item" + (filename === this.activeTab ? " active" : "");

      const nameSpan = document.createElement("span");
      nameSpan.textContent = filename;
      tab.appendChild(nameSpan);

      const closeBtn = document.createElement("span");
      closeBtn.className = "tab-close";
      closeBtn.textContent = "×";
      closeBtn.title = "關閉分頁";
      closeBtn.addEventListener("click", (e) => {
        e.stopPropagation();
        if (this.openTabs.length > 1) {
          this.closeTab(filename);
        }
      });
      tab.appendChild(closeBtn);

      tab.addEventListener("click", () => {
        if (window.FileTree) {
          this.openFile(filename, FileTree.getFile(filename));
        }
      });

      this.tabBarEl.appendChild(tab);
    });
  },

  formatDocument() {
    if (this.editor) {
      const action = this.editor.getAction("editor.action.formatDocument");
      if (action) action.run();
    }
  },

  getValue() {
    return this.editor ? this.editor.getValue() : "";
  },

  setValue(val) {
    if (this.editor) this.editor.setValue(val);
  }
};
