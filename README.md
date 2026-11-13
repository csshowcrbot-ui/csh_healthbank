# 竹山秀傳醫院「健康銀行」系統 (CSH-HealthBank)

> **版本**：v1.0.0  
> **系統定位**：員工健康管理遊戲化平台（LINE LIFF 前端 + 後端 API 服務 + 院內系統中台介接）  
> **設計理念**：日式簡約・余白（Yohaku）・以心餵養（和風極簡視覺與微儀式感）

---

## 🌿 系統功能與架構亮點

### 1. 前端使用層 (LINE LIFF 和風極簡體驗)
遵照 `ui_ux.md` 規範打造高辨識度、減壓無負擔的日式極簡風格：
- **調色盤**：和紙白 (`#FAF8F5`)、若竹色 (`#4A7C59`)、深木炭 (`#2B2D2F`)、素木色 (`#F0EBE1`)、琥珀金 (`#D49B48`)、撫子緋 (`#C85A54`)。
- **三大核心頁籤**：
  1. **🌿「庭園」(Home)**：
     - **健康樹養成引擎**：呈現 5 階段形態（1. 破土嫩芽、2. 茁壯若竹、3. 茂盛成樹、4. 開花之樹、5. 結實金樹），具備隨風搖曳動態與生長養分進度。
     - **落水成露微互動 (Watering Micro-ritual)**：每日累積水滴晨露，輕觸餵養觸發落水漣漪波紋與 `+10 EXP` 成長養分。
     - **點數資產帳本**：當前健康點數（如 `120 pt`）與等值生活金（`NT$ 120`，10 點換 10 元福利折抵）。
     - **溫暖共好捷徑**：滿 100 點可一鍵轉讓予前山基金會，醫院加碼代捐。
  2. **📋「修養」(Habits & Tasks)**：
     - 日式生活誌排版（日嚐・蔬食、習藝・講座、養身・健檢、行健・體能）。
     - 自動感應達成時浮現朱紅色木刻蓋印（「済」、「達成」）。
  3. **🍵「共好」(Exchange & Share)**：
     - **【喜捨・倍增愛心】前山基金會專案**：滿 100 點轉化，竹山秀傳醫院配對加碼代捐 NT$ 200 元，頒發典雅和紙感謝狀函（含基金會與醫院紅印、核銷單號）。
     - **【犒賞・日嚐好物】**：員工餐廳 50 元折抵券、秀傳運動吸水巾等，即時生成可供餐檯店員核銷之專屬 QR Code。

### 2. 後端應用服務 (Application Services & RESTful API)
- **點數與交易核心 (Double-Entry Bookkeeping)**：
  - 嚴格採用雙重記帳帳本原則，每筆流水帳均帶有不可變餘額快照（`balance_snapshot`）。
  - 內建冪等性鍵（`idempotency_key`）防範重複領取與並發超扣。
- **院內實體系統介接中台 (Edge Integration Webhooks)**：
  - `POST /api/v1/integrations/pos-event`：員工餐廳 POS 蔬食 RFID 嗶卡入點 (+1 pt, +1 露水)。
  - `POST /api/v1/integrations/gym-access`：體能教室門禁進場計時與滿 30 分鐘刷退判斷 (+1 pt, +1 露水)。
  - `POST /api/v1/integrations/his-sync`：每日凌晨 02:00 HIS 健檢與癌症篩檢合格名單批次 ETL (+2 pt, +2 露水)。
- **審計與管理後台 (Admin & Audit)**：
  - 雙重記帳完整稽核軌跡檢視。
  - 前山基金會會計對帳清冊與一鍵導出審計 CSV。
  - 內建「院內實體設備介接模擬器」，隨時模擬硬體刷卡並即時檢視 Webhook 日誌流。

---

## 🚀 快速啟動 (Quick Start)

### 1. 安裝套件
```bash
npm install
```

### 2. 同步啟動前後端開發環境 (Dev Mode)
```bash
npm run dev
```
- 前端 LIFF 介面：`http://localhost:5173`
- 後端 REST API：`http://localhost:3000`

### 3. 單一指令編譯並啟動整合生產服務 (Production Mode)
```bash
npm run build
npm start
```
- 瀏覽器開啟：`http://localhost:3000` 即可體驗完整功能。

### 4. 執行自動化驗證測試套件 (Verification Test Suite)
```bash
npm test
```
涵蓋 18 項自動檢驗項目（含資料庫完整性、健康樹餵養、POS防重複發放、運動30分判定、前山基金會配對代捐、雙重記帳餘額快照核算）。

---

## 📂 專案目錄結構

```
CSH-HealthBank/
├── code_artifact.md          # 系統程式開發規格書 (Technical Spec)
├── ui_ux.md                  # 和風極簡 UI/UX 規劃指南
├── package.json              # 專案依賴與腳本定義
├── vite.config.js            # Vite 設定 (含 API 反向代理)
├── tailwind.config.js        # 和風配色 (若竹、和紙白、素木、琥珀金、撫子緋)
├── server/                   # 後端 API 與服務
│   ├── server.js             # Express 伺服器入口
│   ├── db.js                 # 雙重記帳資料庫引擎與資料儲存
│   ├── data.json             # 持久化資料庫主檔
│   └── routes/
│       ├── tree.js           # 遊戲樹主頁與滴水餵養 API
│       ├── redemption.js     # 前山基金會愛心加成與福利券核銷 API
│       ├── integrations.js   # POS、體能教室門禁、HIS 介接 Webhook
│       └── admin.js          # 帳本稽核日誌與會計報表 API
├── src/                      # 前端 Vue 3 + Tailwind CSS 介面
│   ├── main.js               # Vue 進入點
│   ├── App.vue               # LINE LIFF 主頁面 (庭園 / 修養 / 共好)
│   ├── style.css             # 和風質感樣式、印章與水波紋動態
│   └── components/
│       ├── ZenGardenTree.vue # 5 階段動態健康樹與澆灌微動態
│       ├── CharityModal.vue  # 前山基金會典雅和紙感謝狀函
│       ├── VoucherModal.vue  # 福利券 QR Code 與餐檯掃碼核銷模擬
│       ├── EdgeSimulatorModal.vue # 院內實體設備刷卡模擬中台
│       ├── AdminLedgerModal.vue   # 職安衛與會計審計後台
│       └── NotificationDrawer.vue # LINE Messaging 智慧推播模擬
└── tests/
    └── test_api.js           # 18 項全流程自動化整合測試套件
```

