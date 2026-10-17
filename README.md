# MonoCode — 極簡黑白程式工作台 (Production Ready)

MonoCode 是一款專為 Chrome OS Flex、低硬體規格裝置與極簡主義開發者設計的開源 Web 程式碼工作台。

核心設計哲學：**純黑白、圓潤、高對比、零干擾、無表情符號、無廣告**。

---

## 全面完備功能清單

### 1. 圓潤黑白視覺與使用者體驗（Rounded Monochrome UX）
* **高對比深色介面**：深黑背景（`#000000`）與純白高對比文字。
* **柔和圓角系統**：全域膠囊按鈕（`border-radius: 9999px`）、圓潤卡片（`14px~16px`）與懸浮面板（`12px`）。
* **極簡過渡遮罩**：整合 Monaco 編輯器核心載入骨架遮罩，平滑淡出，無突兀空白。

### 2. 三大核心視圖架構（SPA）
* **主頁（Home Dashboard）**：
  * 快速開始（新建專案、開啟本機檔案、空白單檔速寫）。
  * 一鍵安裝至本機（PWA 原生 `beforeinstallprompt` 按鈕）。
  * 即時網路連線監測（`ONLINE` / `OFFLINE` 動態切換）。
  * 近期專案歷史清單（IndexedDB / LocalStorage 本地持久化）。
* **專案建立精靈（Project Wizard）**：
  * 4 種內建範本：HTML5 網頁應用、Python 專案、Lua 腳本、JavaScript 模組。
  * 即時 ASCII 檔案結構動態預覽。
* **工作區與建置編輯頁（Workspace / Build & Run）**：
  * Microsoft Monaco 編輯器核心（深黑高對比 `hc-black` 主題）。
  * 多檔案標籤頁（Tabs）管理。
  * 底部狀態列即時顯示游標行列（`Ln X, Col Y`）、編碼（`UTF-8`）與語言狀態。
  * 點擊頂部專案名稱可隨時重新命名。

### 3. 完整檔案樹操作（File Tree Operations）
* **檔案新增與刪除**。
* **檔案重新命名**：在檔案節點點擊「改名」或雙擊檔案名稱即可直接更名。
* **單檔獨立下載**：支援單獨下載當前選定檔案至本機。
* **拖曳匯入（Drag & Drop）**：直接將本機檔案拖入左側檔案列表，自動載入至專案結構中。
* **專案整包匯出（ZIP Export）**：整合 JSZip，點擊頂部 `[匯出 ZIP]` 一鍵下載全專案壓縮檔。

### 4. 瀏覽器原生執行與建置引擎（Zero-Dependency WASM Engines）
* **HTML5 網頁專案**：沙盒隔離 iframe 即時預覽，自動劫持並輸出 `console.log` / `console.error`。
* **Python 程式**：內建 Pyodide (Python 3.11 WebAssembly 核心)，直接在瀏覽器執行標準 Python 程式碼，不需本機安裝 Python。
* **Lua 腳本**：內建 Fengari Lua 虛擬機，直接執行 Lua 腳本並輸出至終端。
* **JavaScript 程式**：沙盒隔離執行並捕獲標準輸出。
* **建置抽屜進階功能**：支援主控台與預覽畫面分頁切換、一鍵全螢幕展開（Maximize）以及毫秒級執行計時。

### 5. 偏好設定中心（Settings Modal）
* **字體大小**：12px ~ 20px 即時無縫縮放。
* **縮排寬度**：2 空格 / 4 空格切換。
* **自動折行**：開啟 / 關閉切換。
* **迷你地圖（Minimap）**：開啟 / 關閉代碼縮圖。
* **代碼自動格式化**：一鍵美化排版當前檔案。
* **重置快取**：清空本機暫存歷史。

---

## 專案結構

```text
minimal-code-editor/
├── .github/
│   └── workflows/
│       └── deploy.yml             # GitHub Actions 自動測試與 GitHub Pages 部署
├── README.md                      # 完整產品說明與架構手冊
├── docker-compose.yml             # 本地 Nginx 預覽容器
├── .env.example                   # 環境變數設定
├── docs/
│   ├── implementation_plan/       # 架構實作計畫歸檔
│   ├── walkthrough/               # 建置成果與更新記錄歸檔
│   └── spec/                      # 系統規格與快捷鍵清單
├── src/
│   ├── index.html                 # 單頁應用主容器 (SPA)
│   ├── manifest.json              # PWA 清單
│   ├── sw.js                      # 離線快取 Service Worker
│   ├── css/
│   │   └── main.css               # 圓潤黑白極簡樣式
│   ├── js/
│   │   ├── app.js                 # 視圖切換、PWA 安裝與設定調度
│   │   ├── storage.js             # 本地持久化 (LocalStorage & IndexedDB)
│   │   ├── templates.js           # 專案範本產生器
│   │   ├── file-tree.js           # 檔案樹、改名、單檔下載與拖曳匯入
│   │   ├── editor.js              # Monaco 編輯器核心與動態設定更新
│   │   ├── runner.js              # 建置、執行抽屜 (WASM Pyodide & Fengari)
│   │   └── shortcuts.js           # 鍵盤快捷鍵調度
│   └── assets/
│       └── icon.svg               # 黑白幾何圓角圖標
└── tests/
    └── smoke.test.js              # 6 項關鍵架構規格冒煙測試
```

---

## 鍵盤快捷鍵

| 快捷鍵 | 作用範圍 | 說明 |
| :--- | :--- | :--- |
| `Ctrl + S` / `Cmd + S` | 工作區 | 儲存當前檔案至本機磁碟 |
| `Ctrl + O` / `Cmd + O` | 全域 | 開啟本機檔案並載入工作區 |
| `Ctrl + Enter` | 工作區 | 觸發目前專案的「建置與執行」流程 |
| `Ctrl + B` | 工作區 | 切換左側檔案導覽面板（顯示 / 隱藏） |
| `F1` | 全域 | 開啟 / 關閉快捷鍵指南模態視窗 |
| `Escape` | 全域 | 關閉任何開啟之彈出視窗 |

---

## 自動化驗證與 CI/CD

### 本地測試
```bash
node tests/smoke.test.js
```

### GitHub Pages 自動部署
本專案已包含 `.github/workflows/deploy.yml`。將程式碼推送至 GitHub 的 `main` 分支後，GitHub Actions 將會自動執行冒煙測試並直接上架發布至 GitHub Pages！
