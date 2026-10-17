/**
 * 工作區檔案樹管理模組 (支援本機真實資料夾同步、行內新建、行內重新命名、右鍵選單與拖曳匯入)
 */
const FileTree = {
  project: null,
  activeFile: null,
  containerEl: null,
  isCreatingFile: false,

  init(containerEl) {
    this.containerEl = containerEl;
    this.setupDragAndDrop();
    this.setupContextMenu();
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

  setupContextMenu() {
    // 點擊空白處隱藏右鍵選單
    window.addEventListener("click", () => {
      const menu = document.getElementById("file-context-menu");
      if (menu) menu.classList.add("hidden");
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

  async setFileContent(filename, content) {
    if (this.project && this.project.files) {
      this.project.files[filename] = content;
      await Storage.saveProject(this.project);

      // 若是本機資料夾連動模式，自動寫回本機實體檔案
      if (this.project.dirHandle) {
        try {
          const fileHandle = await this.project.dirHandle.getFileHandle(filename, { create: true });
          const writable = await fileHandle.createWritable();
          await writable.write(content);
          await writable.close();
        } catch (err) {
          console.warn("自動寫入本機資料夾檔案失敗", filename, err);
        }
      }
    }
  },

  showInlineCreate() {
    if (this.isCreatingFile) return;
    this.isCreatingFile = true;

    const inputWrap = document.createElement("div");
    inputWrap.className = "file-node inline-create-node";
    inputWrap.style.padding = "4px 8px";

    const input = document.createElement("input");
    input.type = "text";
    input.className = "input-rounded";
    input.placeholder = "新檔名 (如 script.py)";
    input.style.fontSize = "11px";
    input.style.padding = "2px 6px";
    input.style.height = "22px";

    const commit = () => {
      const name = input.value.trim();
      inputWrap.remove();
      this.isCreatingFile = false;
      if (name) {
        this.addFile(name, "");
      }
    };

    input.addEventListener("keydown", (e) => {
      if (e.key === "Enter") commit();
      if (e.key === "Escape") {
        inputWrap.remove();
        this.isCreatingFile = false;
      }
    });

    input.addEventListener("blur", commit);
    inputWrap.appendChild(input);
    this.containerEl.prepend(inputWrap);
    input.focus();
  },

  addFile(filename, content = "") {
    if (!this.project) return;
    if (this.project.files[filename]) {
      alert("檔案已存在：" + filename);
      return;
    }
    this.project.files[filename] = content;
    Storage.saveProject(this.project);
    this.activeFile = filename;
    this.render();
    if (window.EditorManager) {
      EditorManager.openFile(filename, content);
    }

    if (this.project.dirHandle) {
      this.project.dirHandle.getFileHandle(filename, { create: true }).then(async (handle) => {
        const wr = await handle.createWritable();
        await wr.write(content);
        await wr.close();
      }).catch(console.warn);
    }
  },

  startInlineRename(name, nodeEl) {
    const nameSpan = nodeEl.querySelector(".file-node-name");
    if (!nameSpan) return;

    const input = document.createElement("input");
    input.type = "text";
    input.value = name;
    input.className = "input-rounded";
    input.style.fontSize = "11px";
    input.style.padding = "2px 6px";
    input.style.height = "20px";
    input.style.width = "100%";

    nameSpan.replaceWith(input);
    input.focus();
    input.select();

    const commit = async () => {
      const newName = input.value.trim();
      if (!newName || newName === name) {
        this.render();
        return;
      }
      if (this.project.files[newName]) {
        alert("已存在相同名稱檔案: " + newName);
        this.render();
        return;
      }

      const content = this.project.files[name];
      delete this.project.files[name];
      this.project.files[newName] = content;

      if (this.project.dirHandle) {
        try {
          await this.project.dirHandle.removeEntry(name);
          const newH = await this.project.dirHandle.getFileHandle(newName, { create: true });
          const wr = await newH.createWritable();
          await wr.write(content);
          await wr.close();
        } catch (e) {
          console.warn("重命名本機實體檔案失敗", e);
        }
      }

      await Storage.saveProject(this.project);

      if (this.activeFile === name) {
        this.activeFile = newName;
      }

      if (window.EditorManager) {
        EditorManager.closeTab(name);
        EditorManager.openFile(newName, content);
      }

      this.render();
    };

    input.addEventListener("keydown", (e) => {
      if (e.key === "Enter") commit();
      if (e.key === "Escape") this.render();
    });
    input.addEventListener("blur", commit);
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

  async deleteFile(filename) {
    if (!this.project || Object.keys(this.project.files).length <= 1) {
      alert("專案至少需保留一個檔案");
      return;
    }
    if (confirm(`確定要刪除 ${filename}？此動作無法復原。`)) {
      delete this.project.files[filename];

      if (this.project.dirHandle) {
        try {
          await this.project.dirHandle.removeEntry(filename);
        } catch (e) {
          console.warn("刪除本機實體檔案失敗", e);
        }
      }

      await Storage.saveProject(this.project);

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

  showContextMenu(e, filename, nodeEl) {
    e.preventDefault();
    e.stopPropagation();

    let menu = document.getElementById("file-context-menu");
    if (!menu) {
      menu = document.createElement("div");
      menu.id = "file-context-menu";
      menu.className = "context-menu";
      document.body.appendChild(menu);
    }

    menu.innerHTML = `
      <div class="menu-item" id="ctx-rename">重新命名 (F2)</div>
      <div class="menu-item" id="ctx-download">下載此檔案</div>
      <div class="menu-separator"></div>
      <div class="menu-item danger" id="ctx-delete">刪除檔案</div>
    `;

    menu.style.top = `${e.clientY}px`;
    menu.style.left = `${e.clientX}px`;
    menu.classList.remove("hidden");

    document.getElementById("ctx-rename").onclick = () => {
      menu.classList.add("hidden");
      this.startInlineRename(filename, nodeEl);
    };
    document.getElementById("ctx-download").onclick = () => {
      menu.classList.add("hidden");
      this.downloadFile(filename);
    };
    document.getElementById("ctx-delete").onclick = () => {
      menu.classList.add("hidden");
      this.deleteFile(filename);
    };
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
      nameSpan.title = "點擊切換，右鍵選單或點擊改名";
      nameSpan.addEventListener("dblclick", (e) => {
        e.stopPropagation();
        this.startInlineRename(name, node);
      });
      node.appendChild(nameSpan);

      const actionGroup = document.createElement("div");
      actionGroup.className = "file-node-actions";

      const renBtn = document.createElement("span");
      renBtn.textContent = "改名";
      renBtn.className = "file-action-btn";
      renBtn.title = "重新命名";
      renBtn.addEventListener("click", (e) => {
        e.stopPropagation();
        this.startInlineRename(name, node);
      });
      actionGroup.appendChild(renBtn);

      const dlBtn = document.createElement("span");
      dlBtn.textContent = "下載";
      dlBtn.className = "file-action-btn";
      dlBtn.title = "下載此檔案";
      dlBtn.addEventListener("click", (e) => {
        e.stopPropagation();
        this.downloadFile(name);
      });
      actionGroup.appendChild(dlBtn);

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

      node.addEventListener("contextmenu", (e) => {
        this.showContextMenu(e, name, node);
      });

      this.containerEl.appendChild(node);
    });
  }
};
