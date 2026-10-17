/**
 * 全域快捷鍵調度管理器
 */
const Shortcuts = {
  init(callbacks) {
    window.addEventListener("keydown", (e) => {
      const isCtrlOrCmd = e.ctrlKey || e.metaKey;

      // Ctrl + S (儲存檔案)
      if (isCtrlOrCmd && e.key.toLowerCase() === "s") {
        e.preventDefault();
        if (callbacks.onSave) callbacks.onSave();
        return;
      }

      // Ctrl + O (開啟檔案)
      if (isCtrlOrCmd && e.key.toLowerCase() === "o") {
        e.preventDefault();
        if (callbacks.onOpen) callbacks.onOpen();
        return;
      }

      // Ctrl + Enter (執行 / 建置)
      if (isCtrlOrCmd && e.key === "Enter") {
        e.preventDefault();
        if (callbacks.onRun) callbacks.onRun();
        return;
      }

      // Ctrl + B (折疊 / 展開側邊欄)
      if (isCtrlOrCmd && e.key.toLowerCase() === "b") {
        e.preventDefault();
        if (callbacks.onToggleSidebar) callbacks.onToggleSidebar();
        return;
      }

      // F1 (快捷鍵說明)
      if (e.key === "F1") {
        e.preventDefault();
        if (callbacks.onToggleShortcuts) callbacks.onToggleShortcuts();
        return;
      }

      // Escape (關閉彈窗)
      if (e.key === "Escape") {
        if (callbacks.onEscape) callbacks.onEscape();
      }
    });
  }
};
