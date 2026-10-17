/**
 * 專案範本結構產生器
 */
const Templates = {
  web: {
    name: "HTML5 網頁應用",
    desc: "包含 index.html、style.css 與 app.js 的前端結構",
    primaryFile: "index.html",
    files: {
      "index.html": `<!DOCTYPE html>
<html lang="zh-TW">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Minimal Web App</title>
  <link rel="stylesheet" href="style.css">
</head>
<body>
  <div class="container">
    <h1>Hello World</h1>
    <p>Minimalist Web Application</p>
    <button id="btn-action">點擊觸發</button>
  </div>
  <script src="app.js"></script>
</body>
</html>`,
      "style.css": `body {
  background-color: #000000;
  color: #ffffff;
  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
  display: flex;
  align-items: center;
  justify-content: center;
  height: 100vh;
  margin: 0;
}
.container {
  text-align: center;
  border: 1px solid #222222;
  border-radius: 16px;
  padding: 40px;
  background: #0d0d0d;
}
button {
  margin-top: 20px;
  padding: 8px 20px;
  border-radius: 9999px;
  border: 1px solid #333333;
  background: #ffffff;
  color: #000000;
  cursor: pointer;
  font-weight: bold;
}`,
      "app.js": `document.getElementById('btn-action').addEventListener('click', () => {
  console.log('按鈕已被觸發：' + new Date().toLocaleTimeString());
  alert('Hello from MonoCode!');
});`
    }
  },

  python: {
    name: "Python 程式專案",
    desc: "標準 Python 專案起手式，附帶 README",
    primaryFile: "main.py",
    files: {
      "main.py": `# -*- coding: utf-8 -*-
"""
MonoCode Python Template
"""

def main():
    greeting = "Hello from Python!"
    print(greeting)
    
    numbers = [x * 2 for x in range(1, 6)]
    print(f"Calculated numbers: {numbers}")

if __name__ == "__main__":
    main()
`,
      "README.md": `# Python 專案

使用 MonoCode 工作台建立的輕量級 Python 專案。

## 執行方式
* 本機終端：\`python main.py\`
`
    }
  },

  lua: {
    name: "Lua 腳本專案",
    desc: "適用於遊戲邏輯或自動化任務的輕量 Lua 腳本",
    primaryFile: "main.lua",
    files: {
      "main.lua": `-- MonoCode Lua Template
local function greet(name)
    print("Hello, " .. name .. " from Lua!")
end

local list = { 10, 20, 30, 40 }
print("Lua Array Items:")
for i, v in ipairs(list) do
    print(string.format("  [%d] = %d", i, v))
end

greet("Developer")
`
    }
  },

  js: {
    name: "JavaScript / Node 專案",
    desc: "純 JavaScript 模組與 package.json",
    primaryFile: "index.js",
    files: {
      "index.js": `/**
 * MonoCode JavaScript Starter
 */

function calculateStats(items) {
  const sum = items.reduce((acc, cur) => acc + cur, 0);
  return {
    count: items.length,
    sum: sum,
    average: sum / items.length
  };
}

const scores = [85, 92, 78, 96, 88];
console.log("處理成績資料中...");
console.log("統計結果：", calculateStats(scores));
`,
      "package.json": `{
  "name": "minimal-js-project",
  "version": "1.0.0",
  "description": "Created with MonoCode",
  "main": "index.js",
  "scripts": {
    "start": "node index.js"
  }
}`
    }
  }
};
