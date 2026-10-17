/**
 * MonoCode 完整冒煙與架構規格自動化驗證測試
 */
const assert = require("assert");
const fs = require("fs");
const path = require("path");
const vm = require("vm");

function runSmokeTests() {
  console.log("開始執行 MonoCode 全面規格與邏輯冒煙測試...");

  const rootDir = path.join(__dirname, "..");
  const srcDir = path.join(rootDir, "src");

  // 1. 驗證關鍵目錄與檔案完整性
  const requiredFiles = [
    "index.html",
    "manifest.json",
    "sw.js",
    "css/main.css",
    "js/app.js",
    "js/storage.js",
    "js/templates.js",
    "js/file-tree.js",
    "js/editor.js",
    "js/runner.js",
    "js/shortcuts.js",
    "assets/icon.svg"
  ];

  requiredFiles.forEach((file) => {
    const fullPath = path.join(srcDir, file);
    assert.ok(fs.existsSync(fullPath), `必要原始碼檔案遺失: ${file}`);
  });
  console.log("✓ 原始碼檔案完整性驗證通過。");

  // 2. 驗證 CI/CD 自動部署工作流與 Docker 檔案
  assert.ok(fs.existsSync(path.join(rootDir, ".github", "workflows", "deploy.yml")), "缺少 GitHub Actions 部署工作流");
  assert.ok(fs.existsSync(path.join(rootDir, "docker-compose.yml")), "缺少 docker-compose.yml 容器配置");
  assert.ok(fs.existsSync(path.join(rootDir, ".env.example")), "缺少 .env.example 環境配置");
  assert.ok(fs.existsSync(path.join(rootDir, "README.md")), "缺少 README.md");
  console.log("✓ 工程化與 CI/CD 配置驗證通過。");

  // 3. 驗證 manifest.json 格式與必要欄位
  const manifestRaw = fs.readFileSync(path.join(srcDir, "manifest.json"), "utf8");
  const manifest = JSON.parse(manifestRaw);
  assert.strictEqual(manifest.display, "standalone", "PWA 必須支援 standalone 模式");
  assert.strictEqual(manifest.theme_color, "#000000", "主題色必須為純黑");
  assert.ok(manifest.icons && manifest.icons.length > 0, "缺少 PWA 圖標宣告");
  console.log("✓ PWA Manifest 規範驗證通過。");

  // 4. 驗證 index.html 視圖與彈窗容器
  const indexHtml = fs.readFileSync(path.join(srcDir, "index.html"), "utf8");
  assert.ok(indexHtml.includes('id="view-home"'), "缺少主頁視圖容器");
  assert.ok(indexHtml.includes('id="view-wizard"'), "缺少創建專案引導精靈視圖容器");
  assert.ok(indexHtml.includes('id="view-workspace"'), "缺少工作區視圖容器");
  assert.ok(indexHtml.includes('id="modal-settings"'), "缺少偏好設定彈窗容器");
  assert.ok(indexHtml.includes('id="modal-shortcuts"'), "缺少快捷鍵彈窗容器");
  assert.ok(indexHtml.includes('id="btn-pwa-install"'), "缺少 PWA 安裝按鈕");
  assert.ok(indexHtml.includes('id="btn-workspace-export"'), "缺少專案匯出 ZIP 按鈕");
  console.log("✓ SPA 三大視圖與彈窗組件結構驗證通過。");

  // 5. 執行 templates.js 邏輯驗證
  const templatesCode = fs.readFileSync(path.join(srcDir, "js", "templates.js"), "utf8");
  const sandbox = {};
  vm.createContext(sandbox);
  const Templates = vm.runInContext(templatesCode + "\n;Templates;", sandbox);

  assert.ok(Templates, "缺少 Templates 全域物件");
  const supportedTypes = ["web", "python", "lua", "js"];
  supportedTypes.forEach((type) => {
    assert.ok(Templates[type], `缺少 ${type} 語言範本`);
    assert.ok(Templates[type].files, `${type} 範本檔案結構為空`);
    assert.ok(Templates[type].primaryFile, `${type} 缺少主入口檔案定義`);
  });
  console.log("✓ 專案範本產生器邏輯驗證通過 (HTML/Python/Lua/JS)。");

  // 6. 執行 storage.js 預設值驗證
  const storageCode = fs.readFileSync(path.join(srcDir, "js", "storage.js"), "utf8");
  const storageSandbox = {
    localStorage: {
      getItem: () => null,
      setItem: () => {}
    },
    console: console
  };
  vm.createContext(storageSandbox);
  const Storage = vm.runInContext(storageCode + "\n;Storage;", storageSandbox);
  assert.ok(Storage, "缺少 Storage 全域物件");
  const defaultSettings = Storage.defaultSettings;
  assert.strictEqual(defaultSettings.fontSize, 14, "預設字級應為 14");
  assert.strictEqual(defaultSettings.wordWrap, "on", "預設自動折行應為 on");
  console.log("✓ 儲存模組與使用者偏好設定驗證通過。");

  console.log("\n=============================================");
  console.log("所有 6 項關鍵冒煙與規格驗證測試全部通過！");
  console.log("=============================================");
}

runSmokeTests();
