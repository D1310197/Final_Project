# 老師專長搜尋系統

這是一個前後端分離的全端專案。前端使用 Vue 3 與 Vite，後端使用 Express 與 SQLite，提供教授專長資料查詢與專題概念媒合功能。

## 專案結構

```text
Final_Project/
├─ client/   前端 Vue/Vite 專案
├─ server/   後端 Express/SQLite 專案
└─ package.json
```

## 安裝套件

在專案根目錄依序安裝根目錄、後端與前端套件：

```powershell
npm.cmd install
npm.cmd install --prefix server
npm.cmd install --prefix client
```

如果在 Windows PowerShell 看到 `npm.ps1` 被執行原則封鎖，請使用 `npm.cmd` 執行 npm 指令。

## 初始化資料庫

```powershell
npm.cmd run init-db
```

這個指令會建立或重建 `server/database.sqlite`，並寫入教授專長資料。

## 開發模式

同時啟動後端與前端：

```powershell
npm.cmd run dev
```

啟動後開啟前端：

```text
http://localhost:5173
```

後端 API 位址：

```text
http://localhost:3000/api/professors
```

## 正式建置與啟動

先建置前端：

```powershell
npm.cmd run build:client
```

再啟動後端：

```powershell
npm.cmd start
```

建置完成後，後端會從 `client/dist` 提供前端頁面：

```text
http://localhost:3000
```

