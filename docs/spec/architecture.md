# MonoCode 系統規格與架構設計

## 1. 模組架構

```
+--------------------------------------------------------------+
|                          MonoCode                            |
|                 (Single Page Application / PWA)              |
+--------------------------------------------------------------+
                               |
       +-----------------------+-----------------------+
       |                       |                       |
       v                       v                       v
[ 視圖層 Views ]      [ 核心邏輯 Controllers ] [ 儲存與離線 Storage ]
  - Home 儀表板         - app.js (路由與調度)    - storage.js (IndexedDB)
  - Wizard 專案精靈     - editor.js (Monaco)    - sw.js (Cache-First SW)
  - Workspace 工作區    - file-tree.js (檔案樹)  - File System Access API
                        - runner.js (建置執行)
                        - shortcuts.js (快捷鍵)
```

## 2. 視圖狀態轉換
* `VIEW_HOME` -> 點選「新建專案」 -> `VIEW_WIZARD`
* `VIEW_HOME` -> 點選「開啟檔案」或「開啟近期專案」 -> `VIEW_WORKSPACE`
* `VIEW_WIZARD` -> 完成專案配置 -> 觸發 `templates.js` 生成專案 -> `VIEW_WORKSPACE`
* `VIEW_WORKSPACE` -> 點選頂部「主頁」 -> 儲存當前工作區狀態 -> `VIEW_HOME`

## 3. 執行沙盒安全機制
* HTML / JS 執行：採用帶有 `sandbox="allow-scripts allow-modals"` 屬性的獨立 `<iframe>`。
* 輸出捕獲：在沙盒內劫持 `console.log`、`console.error`、`console.warn` 並透過 `window.postMessage` 傳回輸出控制台。
