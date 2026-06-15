import sqlite3 from 'sqlite3';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const dbPath = path.resolve(__dirname, 'database.sqlite');
const db = new sqlite3.Database(dbPath, (err) => {
    if (err) {
        console.error('資料庫連線失敗:', (err.message));
    } else {
        console.log('成功連線並建立 SQLite 資料庫檔案');
    }
});

db.serialize(() => {
    console.log('開始初始化資料表...');
    // 每次初始化前先清空舊資料表，確保資料不重複
    db.run(`DROP TABLE IF EXISTS professors`);
    db.run(`DROP TABLE IF EXISTS tags`);

    db.run(`
        CREATE TABLE IF NOT EXISTS professors (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL,
            description TEXT)
    `);
    db.run(`
        CREATE TABLE IF NOT EXISTS tags(
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT UNIQUE NOT NULL
        )
    `);

    const insertProfessor = db.prepare(`
        INSERT INTO professors (name, description)
        VALUES (?, ?)
    `);

    insertProfessor.run("張真誠", "資料庫設計 電子商務安全 電子多媒體影像技術 電腦密碼學 圖像與信號處理 信息取證與安全 深度學習")
    insertProfessor.run("桑慧敏", "青光眼預測分析 太陽能與半導體製程品質管制與可靠度 電力節能之最佳設計 機率統計與模擬理論與應用 系統思維")
    insertProfessor.run("竇其仁", "行動計算 車載網路 智慧聯網 雲端計算 學習科技")
    insertProfessor.run("李榮三", "無線通訊 資訊安全 電子商務 密碼學 數位影像處理 區塊鏈技術與應用")
    insertProfessor.run("王益文", "嵌入式系統設計 VLSI系統設計 類神經網路")
    insertProfessor.run("李金鳳", "資料庫資訊系統設計 電子多媒體影像技術 電腦密碼學 資訊隱藏與浮水印技術 資料探勘與機器學習")
    insertProfessor.run("李俊宏", "人工智慧 智慧代理人 軟體工程 模糊時間序列")
    insertProfessor.run("李維斌", "網路安全 密碼學 數位浮水印 資訊安全管理")
    insertProfessor.run("周兆龍", "資訊安全 藏密分析 影像處理 生物識別 零信任")
    insertProfessor.run("林哲維", "人工智慧 自然語言處理 中文故事分析與生成 電腦視覺與人臉識別")
    insertProfessor.run("林志敏", "軟體代理人技術與應用 嵌入式系統 作業系統 軟體整合與重用 計算機算術 機器人技術與應用")
    insertProfessor.run("林峰正", "人工智慧 資料分析 演算法 雲端運算應用 影像處理 深度學習")
    insertProfessor.run("林明言", "資料探勘與資料庫 巨量資料分析 可解釋之人工智慧 推薦系統")
    insertProfessor.run("林佩君", "模糊統計 統計建模 感性工學 大數據分析 人工智慧開發與應用")
    insertProfessor.run("林佩蓉", "延展實境科技 AI影像辨識 腦機介面技術 醫療資訊 無線網狀網路")
    insertProfessor.run("洪振偉", "軟體工程(軟體系統開發、設計樣式、軟體架構) 行動應用設計 資訊教育 電腦輔助語言學習 物聯網應用開發")
    insertProfessor.run("洪維志", "無線網路 行動網路 資訊安全 密碼分析 硬體安全")
    insertProfessor.run("張志宏", "軟體工程 雲端服務 深度學習 智慧醫療 巨量資料")
    insertProfessor.run("郭士煒", "影像辨識與物件偵測 生成式人工智慧 自然語言處理 網路安全 資訊安全 智慧醫療應用")
    insertProfessor.run("郭崇韋", "積體電路電磁相容 微控制器應用 硬體安全 惡意流量分析")
    insertProfessor.run("張哲誠", "自駕車 無人機 異常檢測 聯邦式學習 平行分散式計算 機器學習 深度學習")
    insertProfessor.run("陳青文", "高效能低功率多核心系統 嵌入式系統與周邊驅動 無線隨意行動與感測網路")
    insertProfessor.run("陳德生", "VLSI 電腦輔助設計 嵌入式系統 智慧聯網")
    insertProfessor.run("陳錫民", "軟體工程 DevOps技術 服務導向運算 分散式運算")
    insertProfessor.run("陳烈武", "無線通訊與行動計算 車聯網、物聯網與人聯網 機器學習與人工智慧")
    insertProfessor.run("許芳榮", "雲端運算 生物資訊 人工智慧 醫學影像")
    insertProfessor.run("許懷中", "巨量資料分析及應用 軟體工程 雲端計算 生心理量測與群眾外包")
    insertProfessor.run("黃秀芬", "計算機演算法 圖學理論 互連結網路 無線隨意及感測網路")
    insertProfessor.run("游景盛", "生物資訊 結構生物資訊 計算系統生物")
    insertProfessor.run("葉春秀", "影像處理 智能製造 專案管理 物件導向 影像辨識")
    insertProfessor.run("劉明機", "創新學習軟體設計 教育資料科學 情感運算 認知神經科學")
    insertProfessor.run("劉宗杰", "分散式系統 網路安全 自我穩定系統 大數據分析")
    insertProfessor.run("劉怡芬", "機率論 機器學習 語音辨識 自然口語處理與辨識 計算語言學")
    insertProfessor.run("蔡國裕", "密碼學 物聯網應用與安全 行動商務與安全")
    insertProfessor.run("蔡明翰", "電腦視覺 電腦圖學 虛擬實境 擴增實境")
    insertProfessor.run("薛念林", "軟體工程 軟體品質驗證 物件設計")

    insertProfessor.finalize();

    db.all("SELECT * FROM professors", [], (err, rows) => {
        if (err) {
            throw err;
        }
        console.log('目前教授清單:');
        rows.forEach((row) => {
            console.log(`[${row.id}] ${row.name} - ${row.description}`)
        });
    });
});


db.close((err) => {
    if (err) {
        console.error('❌ 關閉資料庫時發生錯誤:', err.message);
    } else {
        console.log('\n資料庫連線已安全關閉。初始化流程結束。');
    }
});