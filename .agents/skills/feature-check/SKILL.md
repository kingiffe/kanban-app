---
name: feature-check
description: 當改完程式，詢問功能有沒有壞掉、可不可以上線或進行端對端驗收時使用。透過瀏覽器實際操作，檢查新增、編輯、改狀態、刪除以及重新整理後資料持久化，並以表格列出測試結果。
---

# 功能完整性檢查技能 (Feature Check)

本技能用於在程式碼修改後進行端對端 (E2E) 功能驗證與上線前把關。透過實際操作瀏覽器驗證核心使用者旅程（新增、編輯、變更狀態、刪除、重新整理持久化），並以結構化表格回報驗收成果與上線建議。

---

## 1. 觸發時機

當使用者提出以下或類似意圖之問題時啟用：
- 「改完了，有壞掉嗎？」
- 「目前的功能可不可以上線？」
- 「幫我測試一下待辦清單功能正不正常」
- 「驗收一下剛剛修改的程式碼」

---

## 2. 測試環境與前置準備

1. **取得網頁運行環境**：
   - **禁止直接使用 `file://` 協定**：`browser` 子代理人的沙盒安全策略會阻擋 `file://` 網址（`ERR_DISALLOWED_URL`），必須透過本機 HTTP 伺服器進行測試。
   - **優先使用 Node.js 啟動本機靜態伺服器**：在 Windows 環境下 `python -m http.server` 可能無法執行，請優先使用 Node.js 內建模組在背景（`IsDaemon: true`, `BypassSandbox: true`）啟動輕量伺服器（例如連接埠 `8123`）：
     ```powershell
     node -e "const http=require('http'),fs=require('fs'),path=require('path');const mime={'.html':'text/html; charset=utf-8','.css':'text/css; charset=utf-8','.js':'application/javascript; charset=utf-8'};http.createServer((req,res)=>{let p=req.url.split('?')[0];if(p==='/')p='/index.html';const f=path.join(process.cwd(),p);fs.readFile(f,(err,data)=>{if(err){res.writeHead(404);res.end('Not found');return;}res.writeHead(200,{'Content-Type':mime[path.extname(f)]||'text/plain'});res.end(data);});}).listen(8123,'127.0.0.1',()=>console.log('Listening on 8123'));"
     ```
   - 測試完成後，務必使用 `manage_task` (`kill`) 關閉該背景伺服器程序。
2. **委派瀏覽器操作**：
   - 調用 `browser` 子代理人開啟 `http://127.0.0.1:8123/index.html` 進行真實 DOM 操作、視覺檢查與畫面擷圖。
3. **資料規範遵從**：
   - 測試過程輸入之測試資料須嚴格符合 [.agents/rules/todo-data.md](../../rules/todo-data.md) 規範（標題 50 字內、優先度 High/Medium/Low、分類工作/生活、狀態 Todo/Process/Done）。

---

## 3. 核心檢查項目清單

必須依序執行下列 5 項核心驗收測試：

1. **新增任務 (Create)**：
   - 在表單中輸入任務標題、選擇優先度（High/Medium/Low）、選擇分類（工作/生活）、填寫負責人。
   - 點擊新增按鈕或按 Enter。
   - **驗證指標**：任務卡片成功新增至看板（預設進入 To-do），卡片標籤與內容正確，上方未完成筆數即時更新。
2. **編輯任務 (Edit)**：
   - 對已建立的任務進行內容、優先度或負責人編輯。
   - **驗證指標**：修改內容能即時反映於卡片 UI 上，且排序依優先度正確調整。
3. **變更狀態 (Update Status / Drag & Drop)**：
   - 將任務從 `To-do` 欄位移動至 `Process` 欄位，再移動至 `Done` 欄位。
   - **驗證指標**：任務成功出現在目標欄位中、各欄計數器即時增減，完成狀態正確切換。
4. **刪除任務 (Delete)**：
   - 點擊任務卡片上的刪除按鈕。
   - **驗證指標**：卡片從畫面上立即消失，欄位計數器與總未完成數同步減少。
5. **重新整理持久化檢查 (Persistence / Reload)**：
   - 建立數筆具備不同狀態、優先度與分類的任務後，觸發瀏覽器重新整理（Reload）。
   - **驗證指標**：重新載入頁面後，原先儲存於 `localStorage` 的任務清單、狀態與排序維持一致，無任何資料丟失。

---

## 4. 驗收結果回報格式

測試完成後，必須以清晰的 Markdown 表格格式呈現測試結果，並提供明確的上線判定：

### 功能驗收結果總表

| 測試編號 | 測試項目 | 驗證操作步驟 | 預期結果 | 實際結果 | 測試狀態 |
| :---: | :--- | :--- | :--- | :--- | :---: |
| 1 | 新增任務 | 填寫標題、優先度、分類與負責人後送出 | 成功新增卡片至 To-do 欄，計數正確 | 與預期相符 | 通過 (Pass) |
| 2 | 編輯任務 | 修改既有任務文字與屬性 | 卡片內容即時更新且依優先度重排 | 與預期相符 | 通過 (Pass) |
| 3 | 狀態切換 | 將卡片由 To-do 拖曳至 Process 與 Done | 欄位歸屬正確切換，計數即時連動 | 與預期相符 | 通過 (Pass) |
| 4 | 刪除任務 | 點擊卡片右上角刪除按鈕 | 任務卡片完全移除，計數減少 | 與預期相符 | 通過 (Pass) |
| 5 | 重新整理儲存 | 新增任務後重新整理瀏覽器頁面 | 重新載入後所有資料完整無缺 | 與預期相符 | 通過 (Pass) |

---

### 上線評估與結論

- **整體評定**：`具備上線條件 (Ready for Release)` 或 `尚未具備上線條件 (Action Required)`。
- **異常清單**（若有任何未通過項目）：
  - 明確指出發生缺陷的操作情境、控制台報錯（Console Error）或 UI 異常表現。
  - 提供修復建議與對應之程式碼區塊指引。

### 測試擷圖與檔案路徑

- 若測試過程包含畫面擷圖，除顯示圖片外，必須**主動列出擷圖的 Windows 完整檔案路徑與可點擊的 `file:///` 連結**，方便使用者直接取用。
