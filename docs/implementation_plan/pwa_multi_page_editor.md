# 架構實作計畫：MonoCode 極簡程式工作台 (PWA) — 圓潤黑白版

## 1. 視覺與交互風格微調：圓潤極簡（Rounded Monochrome）
* **配色核心**：深黑背景（`#000000` / `#0a0a0a`）、深灰卡片底色（`#0f0f0f`）、柔和細線邊界（`#222222` ~ `#2a2a2a`）、高對比灰白文字（`#f2f2f2` / `#888888`）。
* **圓角規格**：
  * 主要動作按鈕：圓形膠囊狀（Pill Button，`border-radius: 9999px`）。
  * 內容卡片與模態視窗：柔和圓角（`border-radius: 14px` ~ `16px`）。
  * 編輯器工作容器與終端面板：懸浮圓角卡片風格（`border-radius: 12px`），平滑溢出剪裁。
  * 輸入框與標籤頁：圓角（`border-radius: 8px`）。
* **完全禁止**：表情符號、雜亂色塊、突兀陰影、花俏過渡動畫。

---

## 2. 三大核心頁面規劃 (SPA 圓潤視覺)

### 頁面一：主頁 (Home / Dashboard)
* **頂部導航**：品牌膠囊徽章 `MONO // CODE`、離線狀態圓角徽章（`ONLINE` / `OFFLINE`）。
* **快速行動區（圓角按鈕組）**：
  * `[+ 建立新專案]`（高對比白底黑字圓角膠囊）
  * `[開啟本機檔案]`（黑底灰邊圓角膠囊）
  * `[單檔速寫]`（黑底灰邊圓角膠囊）
* **近期專案面板（圓角卡片組）**：
  * 列表卡片具備微弱的 hover 灰度回饋，點擊直接復原專案與分頁。
* **快捷鍵指南**：簡約圓角資訊卡，列出核心鍵盤綁定。

---

### 頁面二：創建專案頁 (Project Wizard)
* **居中懸浮圓角卡片**：
  * 專案名稱輸入框（圓角 `8px`）。
  * 語言範本選項（4 個圓角選擇卡：HTML5 網頁、Python 專案、Lua 腳本、JavaScript 模組）。
  * 右側即時呈現純文字 ASCII 檔案樹預覽。
  * 底部行動列：`[建立並進入工作區]`（膠囊鈕）、`[返回主頁]`。

---

### 頁面三：程式建置與工作區頁 (Workspace / Build & Run)
* **頂部操作列**：包含回主頁鈕、專案名稱、檔案分頁標籤（圓角 Tabs）、執行建置膠囊鈕。
* **左側檔案導覽列**：懸浮圓角收納抽屜（支援 `Ctrl+B` 折疊）。
* **中央代碼編輯區**：Monaco 核心包裹於圓角框線內，深色模式高對比呈現。
* **右側/下方建置與執行輸出台**：
  * HTML 支援 Web 隔離沙盒即時預覽與 Console 捕獲。
  * JS / Python / Lua 支援即時執行輸出與狀態日誌。

---

## 3. 專案工程化目錄

```text
minimal-code-editor/
├── README.md                      # 產品說明文件、開源規範、自建教學
├── docker-compose.yml             # 本地預覽容器 (Nginx 服務配置)
├── .env.example                   # 環境變數範例
├── docs/
│   ├── implementation_plan/       # 實作規畫歸檔
│   └── spec/                      # 系統規格與快捷鍵定義
├── src/
│   ├── index.html                 # 應用入口 (SPA 容器)
│   ├── manifest.json              # PWA 清單
│   ├── sw.js                      # Service Worker 離線快取策略
│   ├── css/
│   │   └── main.css               # 圓潤黑白設計系統 (全域變數與樣式)
│   ├── js/
│   │   ├── app.js                 # 視圖路由與初始化中樞
│   │   ├── storage.js             # IndexedDB / LocalStorage 封裝
│   │   ├── templates.js           # 專案範本結構產生器
│   │   ├── file-tree.js           # 工作區檔案管理模組
│   │   ├── editor.js              # Monaco 編輯器初始化與 Tabs 管理
│   │   ├── runner.js              # 建置、執行與輸出捕獲器
│   │   └── shortcuts.js           # 全域快捷鍵監聽
│   └── assets/
│       └── icon.svg               # 黑白幾何圓角向量圖標
└── tests/
    └── smoke.test.js              # 基本功能與範本產生單元驗證
```
