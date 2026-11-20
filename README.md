# 待辦事項 · 日式極簡看板 (Minimalist Kanban Todo List)

一個採用日式極簡風格設計的待辦事項看板 Web 應用程式。支援拖曳卡片切換狀態、優先級自動排序、分類篩選與即時統計，並透過瀏覽器本地儲存（Local Storage）自動保存所有任務資料。

---

## 核心功能 (Features)

- **三欄式看板管理 (Kanban Board)**：
  - 提供 **To-do（待處理）**、**Process（進行中）** 與 **Done（已完成）** 三個狀態欄位。
  - 原生 HTML5 Drag and Drop 支援：直覺拖曳任務卡片至目標欄位，放開即更新狀態。
- **優先級自動排序 (Priority Auto-Sorting)**：
  - 任務分為 **High (高)**、**Medium (中)**、**Low (低)** 三種等級。
  - 各看板欄位均依優先程度自動排序（High → Medium → Low），高優先項目自動置頂。
- **完整任務中繼資料 (Task Metadata)**：
  - 支援設定任務內容、負責人（可選填）、優先級與分類標籤（工作 / 生活）。
  - 卡片視覺化展示對應顏色標籤與拖曳提示圖示。
- **分類快速篩選 (Category Filter)**：
  - 提供「全部」、「工作」、「生活」頁籤篩選。
  - 頁籤即時顯示各分類任務數量。
- **即時數據統計 (Real-time Statistics)**：
  - 頂部動態提示尚未完成之任務總數。
  - 各看板欄位標題即時統計卡片數量；欄位為空時顯示指引提示。
- **本地持久化儲存 (Local Persistence)**：
  - 依賴瀏覽器 `localStorage`，重新整理或關閉分頁後資料不丟失。
  - 內建向後相容邏輯，無痛升級歷史資料結構。

---

## 技術棧 (Tech Stack)

| 領域 | 技術 / 工具 | 說明 |
| :--- | :--- | :--- |
| **結構** | HTML5 | 語意化標籤（Semantic Elements）與 WAI-ARIA 無障礙屬性支援 |
| **樣式** | CSS3 (Modern Vanilla CSS) | Flexbox / Grid 版面配置、CSS 自訂變數、日式和風配色設計與響應式斷點 |
| **邏輯** | Vanilla JavaScript (ES6+) | 原生 DOM 操作、HTML5 Drag and Drop API、Local Storage 存取，零外部函式庫依賴 |

---

## 快速開始 (Getting Started)

### 前置需求
- 任何現代主流網頁瀏覽器（如 Google Chrome, Microsoft Edge, Mozilla Firefox, Safari）。
- 無需安裝 Node.js、npm 或任何後端伺服器環境。

### 本地執行步驟

1. **直接開啟**：
   使用檔案總管進入專案目錄，雙擊 `index.html` 即可直接在瀏覽器中運行。

2. **使用靜態伺服器（推薦）**：
   若偏好透過本機 HTTP 伺服器啟動，可使用下列方式之一：
   
   - 使用 VS Code 擴充套件「Live Server」右鍵點擊 `index.html` 選擇 **Open with Live Server**。
   - 使用 Python 快速建立伺服器：
     ```bash
     # Python 3
     python -m http.server 8000
     ```
     隨後於瀏覽器造訪 [http://localhost:8000](http://localhost:8000)。

---

## 目錄結構 (Project Structure)

```text
antigravity_todolist/
├── .agents/
│   └── rules/
│       └── docs-writing.md   # 文檔與技術文件撰寫規範
├── app.js                    # 核心業務邏輯、狀態管理、拖曳事件與本地存儲
├── index.html                # 應用程式主要 HTML 結構與語意化骨架
├── style.css                 # 日式極簡設計規範、版面配置與響應式樣式
└── README.md                 # 專案說明與開發指引文件
```

---

## 使用與操作說明 (Usage Guide)

### 1. 新增任務
1. 在輸入框中填寫任務內容（必填）。
2. （選填）填寫負責人姓名，預設為「未指派」。
3. 選擇優先程度（預設為 Medium）。
4. 選擇分類（「工作」或「生活」）。
5. 點擊「新增任務」或按下鍵盤 `Enter` 鍵送出，新卡片將預設加入 **To-do** 欄位。

### 2. 移動與推進進度
- 按住任意任務卡片，拖曳至目標欄位（例如從 To-do 拖至 Process，或拖至 Done）。
- 放開滑鼠後卡片即移動至新欄位，並自動依優先程度重新排列。

### 3. 刪除任務
- 點擊卡片右上方的刪除圖示（叉叉按鈕），即可將該任務永久刪除。

### 4. 切換分類檢視
- 點擊頂部的「全部」、「工作」或「生活」頁籤，即可快速篩選顯示特定類別的任務。
