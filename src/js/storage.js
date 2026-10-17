/**
 * 本地儲存與持久化管理模組 (完整 IndexedDB 多專案實體持久化)
 */
const Storage = {
  DB_NAME: "monocode_db",
  DB_VERSION: 1,
  STORE_PROJECTS: "projects",
  STORE_SETTINGS: "settings",
  CURRENT_PROJECT_ID_KEY: "monocode_active_project_id",

  defaultSettings: {
    fontSize: 14,
    tabSize: 2,
    wordWrap: "on",
    minimap: false,
    autoSave: true,
    theme: "mono-dark"
  },

  dbPromise: null,

  getDB() {
    if (!this.dbPromise) {
      this.dbPromise = new Promise((resolve, reject) => {
        const req = indexedDB.open(this.DB_NAME, this.DB_VERSION);
        req.onupgradeneeded = (e) => {
          const db = e.target.result;
          if (!db.objectStoreNames.contains(this.STORE_PROJECTS)) {
            const store = db.createObjectStore(this.STORE_PROJECTS, { keyPath: "id" });
            store.createIndex("updatedAt", "updatedAt", { unique: false });
          }
          if (!db.objectStoreNames.contains(this.STORE_SETTINGS)) {
            db.createObjectStore(this.STORE_SETTINGS, { keyPath: "key" });
          }
        };
        req.onsuccess = () => resolve(req.result);
        req.onerror = () => reject(req.error);
      });
    }
    return this.dbPromise;
  },

  async getAllProjects() {
    try {
      const db = await this.getDB();
      return new Promise((resolve) => {
        const tx = db.transaction(this.STORE_PROJECTS, "readonly");
        const store = tx.objectStore(this.STORE_PROJECTS);
        const req = store.getAll();
        req.onsuccess = () => {
          const list = req.result || [];
          list.sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt));
          resolve(list);
        };
        req.onerror = () => resolve([]);
      });
    } catch (e) {
      console.warn("讀取 IndexedDB 專案失敗，嘗試降級 LocalStorage", e);
      return [];
    }
  },

  async getProjectById(id) {
    try {
      const db = await this.getDB();
      return new Promise((resolve) => {
        const tx = db.transaction(this.STORE_PROJECTS, "readonly");
        const store = tx.objectStore(this.STORE_PROJECTS);
        const req = store.get(id);
        req.onsuccess = () => resolve(req.result || null);
        req.onerror = () => resolve(null);
      });
    } catch (e) {
      return null;
    }
  },

  async saveProject(project) {
    if (!project || !project.id) return;
    project.updatedAt = new Date().toISOString();
    try {
      const db = await this.getDB();
      return new Promise((resolve, reject) => {
        const tx = db.transaction(this.STORE_PROJECTS, "readwrite");
        const store = tx.objectStore(this.STORE_PROJECTS);
        // 去除不可序列化的 handle (例如 DirectoryHandle 分離處理)
        const serializable = Object.assign({}, project);
        if (serializable.dirHandle) delete serializable.dirHandle;
        if (serializable.fileHandle) delete serializable.fileHandle;

        const req = store.put(serializable);
        req.onsuccess = () => {
          localStorage.setItem(this.CURRENT_PROJECT_ID_KEY, project.id);
          resolve(true);
        };
        req.onerror = () => reject(req.error);
      });
    } catch (e) {
      console.warn("保存專案至 IndexedDB 失敗", e);
    }
  },

  async deleteProject(id) {
    try {
      const db = await this.getDB();
      return new Promise((resolve) => {
        const tx = db.transaction(this.STORE_PROJECTS, "readwrite");
        const store = tx.objectStore(this.STORE_PROJECTS);
        store.delete(id);
        tx.oncomplete = () => {
          if (localStorage.getItem(this.CURRENT_PROJECT_ID_KEY) === id) {
            localStorage.removeItem(this.CURRENT_PROJECT_ID_KEY);
          }
          resolve(true);
        };
      });
    } catch (e) {
      return false;
    }
  },

  async getActiveProject() {
    const activeId = localStorage.getItem(this.CURRENT_PROJECT_ID_KEY);
    if (!activeId) return null;
    return await this.getProjectById(activeId);
  },

  setActiveProjectId(id) {
    if (id) localStorage.setItem(this.CURRENT_PROJECT_ID_KEY, id);
    else localStorage.removeItem(this.CURRENT_PROJECT_ID_KEY);
  },

  getSettings() {
    try {
      const data = localStorage.getItem("monocode_user_settings");
      return data ? Object.assign({}, this.defaultSettings, JSON.parse(data)) : Object.assign({}, this.defaultSettings);
    } catch (e) {
      return Object.assign({}, this.defaultSettings);
    }
  },

  saveSettings(newSettings) {
    try {
      const merged = Object.assign(this.getSettings(), newSettings);
      localStorage.setItem("monocode_user_settings", JSON.stringify(merged));
      return merged;
    } catch (e) {
      console.warn("儲存設定失敗", e);
      return this.defaultSettings;
    }
  }
};
