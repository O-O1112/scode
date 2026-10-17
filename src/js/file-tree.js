/**
 * 工作區檔案樹管理模組 (支援新增、重新命名、單檔下載、刪除與拖曳匯入)
 */
const FileTree = {
  project: null,
  activeFile: null,
  containerEl: null,

  init(containerEl) {
    this.containerEl = containerEl;
    this.setupDragAndDrop();
  },

  setupDragAndDrop() {
    if (!this.containerEl) return;
    const parentSidebar = this.containerEl.parentElement;

    ["dragenter", "dragover"].forEach((eventName) => {
      parentSidebar.addEventListener(eventName, (e) => {
        e.preventDefault();
        e.stopPropagation();
        parentSidebar.style.borderColor = "var(--border-focus)";
      });
    });

    ["dragleave", "drop"].forEach((eventName) => {
      parentSidebar.addEventListener(eventName, (e) => {
        e.preventDefault();
        e.stopPropagation();
        parentSidebar.style.borderColor = "var(--border-subtle)";
      });
    });

    parentSidebar.addEventListener("drop", async (e) => {
      const files = e.dataTransfer.files;
      if (!files || files.length === 0) return;

      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        try {
          const content = await file.text();
          this.addFile(file.name, content);
        } catch (err) {
          console.warn("匯入檔案失敗:", file.name, err);
        }
      }
    });
  },

  setProject(project, defaultFile = null) {
    this.project = project;
    this.activeFile = defaultFile || Object.keys(project.files)[0] || null;
    this.render();
  },

  getFile(filename) {
    return this.project && this.project.files ? this.project.files[filename] : null;
  },

  setFileContent(filename, content) {
    if (this.project && this.project.files) {
      this.project.files[filename] = content;
      Storage.setCurrentProject(this.project);
    }
  },

  addFile(filename, content = "") {
    if (!this.project) return;
    if (this.project.files[filename]) {
      alert("檔案已存在：" + filename);
      return;
    }
    this.project.files[filename] = content;
    Storage.setCurrentProject(this.project);
    this.activeFile = filename;
    this.render();
    if (window.EditorManager) {
      EditorManager.openFile(filename, content);
    }
  },

  renameFile(oldName) {
    if (!this.project) return;
    const newName = prompt(`將 ${oldName} 重新命名為：`, oldName);
    if (!newName || !newName.trim() || newName.trim() === oldName) return;

    const trimmed = newName.trim();
    if (this.project.files[trimmed]) {
      alert("已存在相同名稱的檔案：" + trimmed);
      return;
    }

    const content = this.project.files[oldName];
    delete this.project.files[oldName];
    this.project.files[trimmed] = content;

    Storage.setCurrentProject(this.project);

    if (this.activeFile === oldName) {
      this.activeFile = trimmed;
    }

    if (window.EditorManager) {
      EditorManager.closeTab(oldName);
      EditorManager.openFile(trimmed, content);
    }

    this.render();
  },

  downloadFile(filename) {
    if (!this.project || !this.project.files[filename]) return;
    const content = this.project.files[filename];
    const blob = new Blob([content], { type: "text/plain;charset=utf-8" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = filename;
    a.click();
    URL.revokeObjectURL(a.href);
  },

  deleteFile(filename) {
    if (!this.project || Object.keys(this.project.files).length <= 1) {
      alert("專案至少需保留一個檔案");
      return;
    }
    if (confirm(`確定要刪除 ${filename}？此動作無法復原。`)) {
      delete this.project.files[filename];
      Storage.setCurrentProject(this.project);
      if (this.activeFile === filename) {
        this.activeFile = Object.keys(this.project.files)[0];
      }
      this.render();
      if (window.EditorManager) {
        EditorManager.closeTab(filename);
        EditorManager.openFile(this.activeFile, this.project.files[this.activeFile]);
      }
    }
  },

  render() {
    if (!this.containerEl || !this.project) return;
    this.containerEl.innerHTML = "";

    const filenames = Object.keys(this.project.files).sort();
    filenames.forEach((name) => {
      const node = document.createElement("div");
      node.className = "file-node" + (name === this.activeFile ? " active" : "");

      const nameSpan = document.createElement("span");
      nameSpan.textContent = name;
      nameSpan.className = "file-node-name";
      nameSpan.title = "點擊切換，雙擊重新命名";
      nameSpan.addEventListener("dblclick", (e) => {
        e.stopPropagation();
        this.renameFile(name);
      });
      node.appendChild(nameSpan);

      const actionGroup = document.createElement("div");
      actionGroup.className = "file-node-actions";

      // 重新命名按鈕
      const renBtn = document.createElement("span");
      renBtn.textContent = "改名";
      renBtn.className = "file-action-btn";
      renBtn.title = "重新命名";
      renBtn.addEventListener("click", (e) => {
        e.stopPropagation();
        this.renameFile(name);
      });
      actionGroup.appendChild(renBtn);

      // 單檔下載按鈕
      const dlBtn = document.createElement("span");
      dlBtn.textContent = "下載";
      dlBtn.className = "file-action-btn";
      dlBtn.title = "下載此檔案";
      dlBtn.addEventListener("click", (e) => {
        e.stopPropagation();
        this.downloadFile(name);
      });
      actionGroup.appendChild(dlBtn);

      // 刪除按鈕
      const delBtn = document.createElement("span");
      delBtn.textContent = "×";
      delBtn.className = "file-action-btn file-del-btn";
      delBtn.title = "刪除檔案";
      delBtn.addEventListener("click", (e) => {
        e.stopPropagation();
        this.deleteFile(name);
      });
      actionGroup.appendChild(delBtn);

      node.appendChild(actionGroup);

      node.addEventListener("click", () => {
        this.activeFile = name;
        this.render();
        if (window.EditorManager) {
          EditorManager.openFile(name, this.project.files[name]);
        }
      });

      this.containerEl.appendChild(node);
    });
  }
};
