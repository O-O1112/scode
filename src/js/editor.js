/**
 * Monaco 編輯器核心與分頁標籤管理模組 (支援自訂黑白極簡主題與主題切換)
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
      minimap: false,
      theme: "mono-dark"
    };

    require.config({
      paths: { vs: "https://cdnjs.cloudflare.com/ajax/libs/monaco-editor/0.45.0/min/vs" }
    });

    require(["vs/editor/editor.main"], () => {
      // 註冊純黑白極簡護眼主題 (徹底移除微軟高對比的螢光黃底色)
      monaco.editor.defineTheme("mono-dark", {
        base: "vs-dark",
        inherit: false,
        rules: [
          { token: "", foreground: "d8d8d8", background: "000000" },
          { token: "comment", foreground: "555555", fontStyle: "italic" },
          { token: "keyword", foreground: "ffffff", fontStyle: "bold" },
          { token: "string", foreground: "cccccc" },
          { token: "number", foreground: "e0e0e0" },
          { token: "tag", foreground: "ffffff", fontStyle: "bold" },
          { token: "tag.id", foreground: "ffffff" },
          { token: "tag.class", foreground: "ffffff" },
          { token: "tag.html", foreground: "ffffff" },
          { token: "attribute.name", foreground: "aaaaaa" },
          { token: "attribute.value", foreground: "888888" },
          { token: "delimiter", foreground: "666666" },
          { token: "delimiter.html", foreground: "666666" },
          { token: "identifier", foreground: "e0e0e0" },
          { token: "type", foreground: "ffffff" },
          { token: "operator", foreground: "888888" }
        ],
        colors: {
          "editor.background": "#000000",
          "editor.foreground": "#d8d8d8",
          "editorCursor.foreground": "#ffffff",
          "editor.lineHighlightBackground": "#0c0c0c",
          "editorLineNumber.foreground": "#333333",
          "editorLineNumber.activeForeground": "#888888",
          "editor.selectionBackground": "#262626",
          "editor.inactiveSelectionBackground": "#161616",
          "editorIndentGuide.background": "#1a1a1a",
          "editorIndentGuide.activeBackground": "#333333"
        }
      });

      const initialTheme = settings.theme || "mono-dark";

      this.editor = monaco.editor.create(this.containerEl, {
        theme: initialTheme,
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
    if (settings.theme) {
      monaco.editor.setTheme(settings.theme);
    }
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
