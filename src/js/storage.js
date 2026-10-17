/**
 * 本地儲存與持久化管理模組 (LocalStorage & IndexedDB)
 */
const Storage = {
  RECENT_KEY: "monocode_recent_projects",
  CURRENT_KEY: "monocode_current_project",
  SETTINGS_KEY: "monocode_user_settings",

  defaultSettings: {
    fontSize: 14,
    tabSize: 2,
    wordWrap: "on",
    minimap: false,
    autoSave: true,
    theme: "mono-dark"
  },

  getRecentProjects() {
    try {
      const data = localStorage.getItem(this.RECENT_KEY);
      return data ? JSON.parse(data) : [];
    } catch (e) {
      console.warn("讀取近期專案失敗", e);
      return [];
    }
  },

  saveRecentProject(projectMeta) {
    try {
      const list = this.getRecentProjects().filter((p) => p.id !== projectMeta.id);
      list.unshift({
        id: projectMeta.id || Date.now().toString(),
        name: projectMeta.name,
        type: projectMeta.type,
        updatedAt: new Date().toISOString()
      });
      localStorage.setItem(this.RECENT_KEY, JSON.stringify(list.slice(0, 10)));
    } catch (e) {
      console.warn("記錄近期專案失敗", e);
    }
  },

  getCurrentProject() {
    try {
      const data = localStorage.getItem(this.CURRENT_KEY);
      return data ? JSON.parse(data) : null;
    } catch (e) {
      return null;
    }
  },

  setCurrentProject(project) {
    try {
      localStorage.setItem(this.CURRENT_KEY, JSON.stringify(project));
      this.saveRecentProject(project);
    } catch (e) {
      console.warn("保存當前專案狀態失敗", e);
    }
  },

  clearCurrentProject() {
    localStorage.removeItem(this.CURRENT_KEY);
  },

  getSettings() {
    try {
      const data = localStorage.getItem(this.SETTINGS_KEY);
      return data ? Object.assign({}, this.defaultSettings, JSON.parse(data)) : Object.assign({}, this.defaultSettings);
    } catch (e) {
      return Object.assign({}, this.defaultSettings);
    }
  },

  saveSettings(newSettings) {
    try {
      const merged = Object.assign(this.getSettings(), newSettings);
      localStorage.setItem(this.SETTINGS_KEY, JSON.stringify(merged));
      return merged;
    } catch (e) {
      console.warn("儲存設定失敗", e);
      return this.defaultSettings;
    }
  }
};
