/**
 * MonoCode 應用程式主邏輯與視圖調度器 (全面版)
 */
const App = {
  currentProject: null,
  activeView: "home", // 'home' | 'wizard' | 'workspace'
  selectedTemplateType: "web",
  deferredInstallPrompt: null,
  autoSaveTimer: null,

  init() {
    this.bindDomElements();
    this.registerServiceWorker();
    this.initViews();
    this.initShortcuts();
    this.initNetworkWatcher();
    this.initPwaInstall();
    this.initSettingsModal();

    // 啟動 Monaco
    EditorManager.init(
      document.getElementById("monaco-container"),
      document.getElementById("tab-bar"),
      () => {
        const saved = Storage.getCurrentProject();
        if (saved) {
          this.loadProjectIntoWorkspace(saved);
        } else {
          this.switchView("home");
        }
      }
    );

    Runner.init();
    FileTree.init(document.getElementById("file-list"));
  },

  registerServiceWorker() {
    if ("serviceWorker" in navigator) {
      window.addEventListener("load", () => {
        navigator.serviceWorker.register("./sw.js").catch((err) => {
          console.warn("ServiceWorker 註冊失敗：", err);
        });
      });
    }
  },

  initPwaInstall() {
    const installBtn = document.getElementById("btn-pwa-install");
    window.addEventListener("beforeinstallprompt", (e) => {
      e.preventDefault();
      this.deferredInstallPrompt = e;
      if (installBtn) {
        installBtn.style.display = "inline-flex";
      }
    });

    if (installBtn) {
      installBtn.addEventListener("click", async () => {
        if (!this.deferredInstallPrompt) return;
        this.deferredInstallPrompt.prompt();
        const { outcome } = await this.deferredInstallPrompt.userChoice;
        if (outcome === "accepted") {
          installBtn.style.display = "none";
        }
        this.deferredInstallPrompt = null;
      });
    }
  },

  initNetworkWatcher() {
    const update = () => {
      const el = document.getElementById("network-status");
      if (!el) return;
      if (navigator.onLine) {
        el.textContent = "ONLINE";
        el.style.borderColor = "var(--border-strong)";
        el.style.color = "var(--text-secondary)";
      } else {
        el.textContent = "OFFLINE";
        el.style.borderColor = "#ff6b6b";
        el.style.color = "#ff6b6b";
      }
    };
    window.addEventListener("online", update);
    window.addEventListener("offline", update);
    update();
  },

  bindDomElements() {
    // 視圖容器
    this.views = {
      home: document.getElementById("view-home"),
      wizard: document.getElementById("view-wizard"),
      workspace: document.getElementById("view-workspace")
    };

    // 主頁元素
    this.btnNewProject = document.getElementById("btn-home-new");
    this.btnOpenFile = document.getElementById("btn-home-open");
    this.btnScratch = document.getElementById("btn-home-scratch");
    this.recentListEl = document.getElementById("recent-list");
    this.fileInputHidden = document.getElementById("file-input-hidden");

    // 建立專案精靈元素
    this.inputProjectName = document.getElementById("wizard-project-name");
    this.templateCards = document.querySelectorAll(".template-card");
    this.previewBoxEl = document.getElementById("wizard-preview");
    this.btnCreateSubmit = document.getElementById("btn-wizard-submit");
    this.btnCreateCancel = document.getElementById("btn-wizard-cancel");

    // 工作區元素
    this.btnBackHome = document.getElementById("btn-workspace-home");
    this.projectNameTag = document.getElementById("workspace-project-name");
    this.btnSave = document.getElementById("btn-workspace-save");
    this.btnExport = document.getElementById("btn-workspace-export");
    this.btnRun = document.getElementById("btn-workspace-run");
    this.btnAddFile = document.getElementById("btn-sidebar-add");
    this.btnToggleSidebar = document.getElementById("btn-toggle-sidebar");
    this.sidebarEl = document.getElementById("file-sidebar");
    this.btnCloseOutput = document.getElementById("btn-close-output");
    this.btnClearOutput = document.getElementById("btn-clear-output");
    this.btnWorkspaceSettings = document.getElementById("btn-workspace-settings");

    // 快捷鍵彈窗
    this.modalShortcuts = document.getElementById("modal-shortcuts");
    this.btnCloseShortcuts = document.getElementById("btn-close-shortcuts");
    this.btnHomeShortcuts = document.getElementById("btn-home-shortcuts");

    // 設定彈窗
    this.modalSettings = document.getElementById("modal-settings");
    this.btnCloseSettings = document.getElementById("btn-close-settings");
    this.btnHomeSettings = document.getElementById("btn-home-settings");
  },

  initSettingsModal() {
    const settings = Storage.getSettings();

    const inputFontSize = document.getElementById("setting-font-size");
    const inputTabSize = document.getElementById("setting-tab-size");
    const inputWordWrap = document.getElementById("setting-word-wrap");
    const inputMinimap = document.getElementById("setting-minimap");
    const inputTheme = document.getElementById("setting-theme");
    const btnFormat = document.getElementById("btn-format-code");
    const btnClearData = document.getElementById("btn-clear-data");

    if (inputFontSize) inputFontSize.value = settings.fontSize;
    if (inputTabSize) inputTabSize.value = settings.tabSize;
    if (inputWordWrap) inputWordWrap.value = settings.wordWrap;
    if (inputMinimap) inputMinimap.value = settings.minimap ? "true" : "false";
    if (inputTheme) inputTheme.value = settings.theme || "mono-dark";

    const saveAndApply = () => {
      const updated = Storage.saveSettings({
        fontSize: parseInt(inputFontSize.value, 10),
        tabSize: parseInt(inputTabSize.value, 10),
        wordWrap: inputWordWrap.value,
        minimap: inputMinimap.value === "true",
        theme: inputTheme ? inputTheme.value : "mono-dark"
      });
      EditorManager.applySettings(updated);
    };

    [inputFontSize, inputTabSize, inputWordWrap, inputMinimap, inputTheme].forEach((el) => {
      if (el) el.addEventListener("change", saveAndApply);
    });

    if (btnFormat) {
      btnFormat.addEventListener("click", () => {
        EditorManager.formatDocument();
        this.toggleSettingsModal(false);
      });
    }

    if (btnClearData) {
      btnClearData.addEventListener("click", () => {
        if (confirm("確定要清空所有本機暫存專案？這將移除 IndexedDB / LocalStorage 的快取紀錄。")) {
          localStorage.clear();
          location.reload();
        }
      });
    }

    if (this.btnCloseSettings) {
      this.btnCloseSettings.addEventListener("click", () => this.toggleSettingsModal(false));
    }
    if (this.btnHomeSettings) {
      this.btnHomeSettings.addEventListener("click", () => this.toggleSettingsModal(true));
    }
    if (this.btnWorkspaceSettings) {
      this.btnWorkspaceSettings.addEventListener("click", () => this.toggleSettingsModal(true));
    }
    if (this.modalSettings) {
      this.modalSettings.addEventListener("click", (e) => {
        if (e.target === this.modalSettings) this.toggleSettingsModal(false);
      });
    }
  },

  initViews() {
    // 主頁事件
    this.btnNewProject.addEventListener("click", () => this.switchView("wizard"));
    this.btnOpenFile.addEventListener("click", () => this.openLocalFile());
    this.btnScratch.addEventListener("click", () => this.createScratchProject());
    if (this.btnHomeShortcuts) {
      this.btnHomeShortcuts.addEventListener("click", () => this.toggleShortcutsModal(true));
    }

    this.fileInputHidden.addEventListener("change", (e) => this.handleFallbackFileInput(e));

    // 精靈事件
    this.templateCards.forEach((card) => {
      card.addEventListener("click", () => {
        this.templateCards.forEach((c) => c.classList.remove("active"));
        card.classList.add("active");
        this.selectedTemplateType = card.dataset.type;
        this.updateWizardPreview();
      });
    });

    this.inputProjectName.addEventListener("input", () => this.updateWizardPreview());
    this.btnCreateSubmit.addEventListener("click", () => this.submitCreateProject());
    this.btnCreateCancel.addEventListener("click", () => this.switchView("home"));

    // 工作區事件
    this.btnBackHome.addEventListener("click", () => {
      Storage.setCurrentProject(this.currentProject);
      this.switchView("home");
    });
    this.btnSave.addEventListener("click", () => this.saveCurrentFile());
    if (this.btnExport) {
      this.btnExport.addEventListener("click", () => this.exportProjectZip());
    }
    this.btnRun.addEventListener("click", () => this.runCurrentProject());
    this.btnAddFile.addEventListener("click", () => this.promptAddFile());
    this.btnToggleSidebar.addEventListener("click", () => this.toggleSidebar());
    this.btnCloseOutput.addEventListener("click", () => Runner.hide());
    this.btnClearOutput.addEventListener("click", () => Runner.clearLog());

    // 專案名稱點擊重新命名
    this.projectNameTag.addEventListener("click", () => {
      if (!this.currentProject) return;
      const newName = prompt("重新命名專案：", this.currentProject.name);
      if (newName && newName.trim()) {
        this.currentProject.name = newName.trim();
        this.projectNameTag.textContent = this.currentProject.name;
        Storage.setCurrentProject(this.currentProject);
      }
    });

    // 彈窗關閉
    this.btnCloseShortcuts.addEventListener("click", () => this.toggleShortcutsModal(false));
    this.modalShortcuts.addEventListener("click", (e) => {
      if (e.target === this.modalShortcuts) this.toggleShortcutsModal(false);
    });
  },

  initShortcuts() {
    Shortcuts.init({
      onSave: () => {
        if (this.activeView === "workspace") this.saveCurrentFile();
      },
      onOpen: () => this.openLocalFile(),
      onRun: () => {
        if (this.activeView === "workspace") this.runCurrentProject();
      },
      onToggleSidebar: () => {
        if (this.activeView === "workspace") this.toggleSidebar();
      },
      onToggleShortcuts: () => this.toggleShortcutsModal(),
      onEscape: () => {
        this.toggleShortcutsModal(false);
        this.toggleSettingsModal(false);
      }
    });
  },

  switchView(viewName) {
    this.activeView = viewName;
    Object.keys(this.views).forEach((key) => {
      if (key === viewName) {
        this.views[key].classList.remove("hidden");
      } else {
        this.views[key].classList.add("hidden");
      }
    });

    if (viewName === "home") {
      this.renderRecentProjects();
    } else if (viewName === "wizard") {
      this.inputProjectName.value = "my-project";
      this.updateWizardPreview();
    } else if (viewName === "workspace") {
      if (EditorManager.editor) {
        setTimeout(() => EditorManager.editor.layout(), 50);
      }
    }
  },

  renderRecentProjects() {
    const list = Storage.getRecentProjects();
    this.recentListEl.innerHTML = "";

    if (list.length === 0) {
      this.recentListEl.innerHTML = '<div class="empty-hint">暫無近期專案紀錄</div>';
      return;
    }

    list.forEach((p) => {
      const item = document.createElement("div");
      item.className = "recent-item";

      const title = document.createElement("span");
      title.className = "title";
      title.textContent = p.name + " (" + p.type + ")";

      const date = document.createElement("span");
      date.className = "date";
      date.textContent = new Date(p.updatedAt).toLocaleDateString();

      item.appendChild(title);
      item.appendChild(date);

      item.addEventListener("click", () => {
        const saved = Storage.getCurrentProject();
        if (saved && saved.id === p.id) {
          this.loadProjectIntoWorkspace(saved);
        } else {
          const tmpl = Templates[p.type] || Templates.web;
          const proj = {
            id: p.id,
            name: p.name,
            type: p.type,
            files: Object.assign({}, tmpl.files)
          };
          this.loadProjectIntoWorkspace(proj);
        }
      });

      this.recentListEl.appendChild(item);
    });
  },

  updateWizardPreview() {
    const name = this.inputProjectName.value.trim() || "my-project";
    const tmpl = Templates[this.selectedTemplateType] || Templates.web;
    let preview = `${name}/\n`;
    const files = Object.keys(tmpl.files);
    files.forEach((f, idx) => {
      const isLast = idx === files.length - 1;
      preview += `  ${isLast ? "└─" : "├─"} ${f}\n`;
    });
    this.previewBoxEl.textContent = preview;
  },

  submitCreateProject() {
    const name = this.inputProjectName.value.trim() || "untitled-project";
    const tmpl = Templates[this.selectedTemplateType] || Templates.web;

    const newProject = {
      id: Date.now().toString(),
      name: name,
      type: this.selectedTemplateType,
      files: Object.assign({}, tmpl.files)
    };

    Storage.setCurrentProject(newProject);
    this.loadProjectIntoWorkspace(newProject);
  },

  createScratchProject() {
    const scratchProject = {
      id: Date.now().toString(),
      name: "速寫檔案",
      type: "python",
      files: {
        "scratch.py": '# 速寫 Python 腳本\nprint("Hello World")\n'
      }
    };
    Storage.setCurrentProject(scratchProject);
    this.loadProjectIntoWorkspace(scratchProject);
  },

  loadProjectIntoWorkspace(project) {
    this.currentProject = project;
    this.projectNameTag.textContent = project.name;
    FileTree.setProject(project);

    const firstFile = Object.keys(project.files)[0];
    if (firstFile) {
      EditorManager.openFile(firstFile, project.files[firstFile]);
    }

    this.switchView("workspace");
  },

  promptAddFile() {
    const filename = prompt("請輸入新增檔案名稱 (例如: helper.py 或 style2.css):");
    if (filename && filename.trim()) {
      FileTree.addFile(filename.trim(), "");
    }
  },

  toggleSidebar() {
    this.sidebarEl.classList.toggle("collapsed");
    setTimeout(() => {
      if (EditorManager.editor) EditorManager.editor.layout();
    }, 250);
  },

  toggleShortcutsModal(forceState) {
    if (forceState !== undefined) {
      if (forceState) this.modalShortcuts.classList.remove("hidden");
      else this.modalShortcuts.classList.add("hidden");
    } else {
      this.modalShortcuts.classList.toggle("hidden");
    }
  },

  toggleSettingsModal(forceState) {
    if (forceState !== undefined) {
      if (forceState) this.modalSettings.classList.remove("hidden");
      else this.modalSettings.classList.add("hidden");
    } else {
      this.modalSettings.classList.toggle("hidden");
    }
  },

  runCurrentProject() {
    if (this.currentProject) {
      Runner.runProject(this.currentProject);
    }
  },

  async openLocalFile() {
    if (window.showOpenFilePicker) {
      try {
        const [handle] = await window.showOpenFilePicker();
        const file = await handle.getFile();
        const content = await file.text();

        const project = {
          id: Date.now().toString(),
          name: file.name,
          type: "single",
          fileHandle: handle,
          files: {
            [file.name]: content
          }
        };

        Storage.setCurrentProject(project);
        this.loadProjectIntoWorkspace(project);
      } catch (err) {
        if (err.name !== "AbortError") console.error("開啟檔案失敗：", err);
      }
    } else {
      this.fileInputHidden.value = "";
      this.fileInputHidden.click();
    }
  },

  handleFallbackFileInput(e) {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const project = {
        id: Date.now().toString(),
        name: file.name,
        type: "single",
        files: {
          [file.name]: event.target.result
        }
      };
      Storage.setCurrentProject(project);
      this.loadProjectIntoWorkspace(project);
    };
    reader.readAsText(file);
  },

  async saveCurrentFile() {
    if (!this.currentProject || !FileTree.activeFile) return;

    const activeFileName = FileTree.activeFile;
    const content = EditorManager.getValue();
    FileTree.setFileContent(activeFileName, content);

    if (this.currentProject.fileHandle && window.showSaveFilePicker) {
      try {
        const writable = await this.currentProject.fileHandle.createWritable();
        await writable.write(content);
        await writable.close();
        alert(`已成功儲存至本機檔案：${activeFileName}`);
        return;
      } catch (e) {
        console.warn("直接本機儲存失敗，降級為另存檔案", e);
      }
    }

    const blob = new Blob([content], { type: "text/plain;charset=utf-8" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = activeFileName;
    a.click();
    URL.revokeObjectURL(a.href);
  },

  async exportProjectZip() {
    if (!this.currentProject || !this.currentProject.files) {
      alert("目前沒有可匯出的專案");
      return;
    }
    try {
      Runner.show();
      Runner.appendLog("info", "準備打包專案檔案...");
      if (!window.JSZip) {
        Runner.appendLog("info", "載入 JSZip 打包工具...");
        await Runner.loadScript("https://cdnjs.cloudflare.com/ajax/libs/jszip/3.10.1/jszip.min.js");
      }
      const zip = new JSZip();
      const files = this.currentProject.files;
      Object.keys(files).forEach((filename) => {
        zip.file(filename, files[filename]);
      });
      const blob = await zip.generateAsync({ type: "blob" });
      const a = document.createElement("a");
      a.href = URL.createObjectURL(blob);
      a.download = `${this.currentProject.name || "project"}.zip`;
      a.click();
      URL.revokeObjectURL(a.href);
      Runner.appendLog("success", `專案已順利匯出為 ${a.download}`);
    } catch (err) {
      Runner.appendLog("error", "打包專案失敗：" + err.message);
    }
  }
};

window.addEventListener("DOMContentLoaded", () => {
  App.init();
});
