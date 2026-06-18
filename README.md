# TutorSearch 教授專題媒合系統

TutorSearch 是一個前後端分離的教授專題媒合網站。使用者可以輸入想做的研究方向，系統會依照教授的研究專長進行關鍵字比對、標籤篩選與媒合排序，協助學生快速找到可能適合的專題指導教授。

## 專案資訊

- 網站標題：TutorSearch 教授專題媒合系統
- 前端：Vue 3 + Vite
- 後端：Node.js + Express
- 資料庫：SQLite
- 部署平台：Azure App Service


## 專案結構

```text
Final_Project-test2/
  client/                 # Vue + Vite 前端
    src/App.vue           # 主要畫面與搜尋邏輯
    src/main.js           # Vue 入口
    vite.config.js        # Vite 開發伺服器與 proxy 設定

  server/                 # Express 後端與 SQLite
    server.js             # API 與正式環境靜態檔服務
    init-db.js            # SQLite 初始化腳本
    database.sqlite       # 教授資料庫
    professors.js         # Azure 備援資料

  .github/workflows/      # GitHub Actions 部署設定
  package.json            # 專案啟動、建置與 Azure 設定
  server.js               # Azure Node 入口
```

## 功能說明

- 使用者可以輸入研究興趣或專題方向。
- 系統會根據教授研究專長計算媒合分數。
- 支援標籤篩選教授。
- 顯示教授清單、媒合分數、匹配關鍵字與熱門研究趨勢。
- 支援深色與淺色主題切換。
- 後端提供教授資料 API。
- Azure 上若 SQLite 原生套件啟動異常，會使用備援資料避免整站掛掉。

## API

```text
GET /api/health
```

檢查後端是否正常啟動。

```text
GET /api/professors
```

取得教授資料。

回傳格式：

```json
{
  "message": "success",
  "data": [
    {
      "id": 1,
      "name": "張真誠",
      "description": "資料庫設計 電子商務安全 ..."
    }
  ]
}
```

## 安裝與執行

請先安裝 Node.js 20 以上版本。Windows PowerShell 若無法直接執行 `npm`，可以改用 `npm.cmd`。

安裝依賴：

```powershell
npm.cmd install
```

初始化 SQLite 資料庫：

```powershell
npm.cmd run init-db
```

開發模式同時啟動前後端：

```powershell
npm.cmd run dev
```

開發網址：

```text
http://localhost:5173
```

API 網址：

```text
http://localhost:3000/api/professors
```

正式建置：

```powershell
npm.cmd run build
```

正式啟動：

```powershell
npm.cmd start
```

正式網址：

```text
http://localhost:3000
```
