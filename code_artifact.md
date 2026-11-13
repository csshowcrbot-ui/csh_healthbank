# 竹山秀傳醫院「健康銀行」系統程式開發規格書 (Technical Specification Document)

- **專案代號**：CSH-HealthBank
- **版本號**：v1.0.0
- **系統定位**：員工健康管理遊戲化平台（LINE LIFF 前端 + 後端 API 服務 + 院內系統中台介接）

---

## 1. 系統整體架構 (System Architecture)

系統採前後端分離架構。前端由 LINE LIFF（LINE Front-end Framework）提供免安裝單一登入體驗；後端微服務負責業務邏輯處理，並透過 API Gateway 與院內既有系統（HIS、POS、門禁、人資平台）透過安全通道對接。

```
+---------------------------------------------------------------------------------+
|                                 前端使用層 (Client Layer)                       |
|   • 員工端：LINE App -> LIFF Web App (Vue 3 / TypeScript / Tailwind CSS)        |
|   • 後台管理端：職安衛/人資後台 (Vue 3 Element Plus Dashboard)                   |
+---------------------------------------------------------------------------------+
                                      │  HTTPS / WSS
                                      ▼
+---------------------------------------------------------------------------------+
|                                閘道與認證 (Gateway & Auth)                      |
|   • Cloudflare / Nginx Reverse Proxy (SSL Termination / Rate Limiting)          |
|   • Auth0 / LINE Login OAuth 2.0 + 院內 Active Directory / JWT Verification      |
+---------------------------------------------------------------------------------+
                                      │
                                      ▼
+---------------------------------------------------------------------------------+
|                              後端應用服務 (Application Services)                |
|   • [使用者與授權服務]：員工證號綁定、LINE UID 映射、權限管理                    |
|   • [點數與交易核心]：雙重記帳帳本、防刷防併發 (Redis Mutex Lock)                |
|   • [遊戲化養成引擎]：健康樹成長經驗計算、五階段形態、澆灌事件處理              |
|   • [商城與公益模組]：福利券發行核銷 (QR Code)、前山基金會 100 點代捐 200 機制   |
|   • [外部串接中台]：定時排程 (Cron) + Webhook 接收線下硬體刷卡事件              |
+---------------------------------------------------------------------------------+
                │                                         │
                ▼                                         ▼
+-----------------------------+         +-----------------------------------------+
|     資料儲存層 (Data Layer) |         |     院內實體系統介接 (Enterprise Sync)  |
| • PostgreSQL 16 (主關聯資料)|         | • 員工餐廳 POS 機 (蔬食刷卡日入點)      |
| • Redis 7 (快取/排隊/鎖)    |         | • 體能教室門禁刷卡機 (運動 30 分鐘)     |
| • S3/MinIO (健檢證明附件)   |         | • 檢驗科 HIS 系統 (健檢/四癌篩檢完成)   |
+-----------------------------+         | • 人資教學系統 (在職訓練/健康講座時數)   |
                                        +-----------------------------------------+
```

---

## 2. 資料庫綱要設計 (Database Schema / ERD)

資料庫採用 **PostgreSQL 16**，貨幣與點數採**雙重記帳（Double-Entry Bookkeeping）**原則，避免浮點數誤差與並發超扣。

### 2.1 實體關聯圖 (Textual ERD)

```
[ users ] (員工基本檔)
   │ 1
   ├───── N [ point_ledger ] (點數進出流水帳本)
   │ 1
   ├───── 1 [ tree_status ] (健康樹成長狀態)
   │ 1
   ├───── N [ redemptions ] (商城/公益兌換紀錄)
   │ 1
   └───── N [ raw_hardware_logs ] (刷卡原始暫存紀錄)
```

### 2.2 資料表結構

#### (1) `users` 員工主檔
```sql
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    employee_no VARCHAR(20) UNIQUE NOT NULL,     -- 員工工號 (例: E12345)
    line_user_id VARCHAR(64) UNIQUE,             -- LINE UID (Uxxxxxxxx)
    card_uid VARCHAR(32) UNIQUE,                 -- 實體識別證 RFID/Mifare 內碼
    name VARCHAR(50) NOT NULL,                   -- 姓名
    dept_code VARCHAR(20) NOT NULL,              -- 部門代碼
    role VARCHAR(20) DEFAULT 'STAFF',            -- STAFF, ADMIN, HR, AUDITOR
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
```

#### (2) `point_ledger` 點數流水帳（不可變紀錄）
```sql
CREATE TABLE point_ledger (
    id BIGSERIAL PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES users(id),
    transaction_type VARCHAR(30) NOT NULL,       -- EARN_VEGETARIAN, EARN_SPORT, EARN_CHECKUP, REDEEM_COUPON, CHARITY_DONATE
    points INT NOT NULL,                         -- 正數為收入，負數為支出
    balance_snapshot INT NOT NULL,               -- 交易完成後餘額快照
    idempotency_key VARCHAR(64) UNIQUE NOT NULL, -- 冪等性鍵，防重複發放
    source_ref_id VARCHAR(100),                  -- 關聯單號 (例: POS交易序號、健檢單號)
    notes TEXT,                                  -- 說明
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX idx_ledger_user ON point_ledger(user_id, created_at DESC);
```

#### (3) `tree_status` 遊戲化健康樹狀態
```sql
CREATE TABLE tree_status (
    user_id UUID PRIMARY KEY REFERENCES users(id),
    current_level INT DEFAULT 1,                 -- 1: 破土嫩芽, 2: 茁壯小樹, 3: 茂盛成樹, 4: 開花之樹, 5: 結實金樹
    total_exp INT DEFAULT 0,                     -- 累計養分/經驗值
    pending_dew INT DEFAULT 0,                   -- 待領取餵養的水滴露水
    last_watered_at TIMESTAMP WITH TIME ZONE,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
```

#### (4) `redemptions` 兌換與公益加成紀錄
```sql
CREATE TABLE redemptions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id),
    type VARCHAR(20) NOT NULL,                   -- 'INTERNAL_VOUCHER', 'CHARITY_DONATION'
    item_name VARCHAR(100) NOT NULL,
    deducted_points INT NOT NULL,                -- 扣除點數 (例: 50點, 100點)
    actual_cash_value DECIMAL(10,2) NOT NULL,    -- 等值現金 (例: 50元, 200元配對代捐)
    qr_voucher_code VARCHAR(64) UNIQUE,          -- 兌換券代碼 (福利券用)
    status VARCHAR(20) DEFAULT 'ACTIVE',         -- 'ACTIVE', 'USED', 'DONATED', 'REVOKED'
    used_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
```

---

## 3. 核心 API 介面規格 (RESTful API Specification)

全系統採用 JSON 通訊，請求需帶有 Bearer Token（由 LIFF 換發的系統專用 JWT）。

### 3.1 遊戲主頁狀態獲取
- **Endpoint**: `GET /api/v1/tree/dashboard`
- **Headers**: `Authorization: Bearer <JWT>`
- **Response**:
```json
{
  "code": 200,
  "message": "success",
  "data": {
    "employee_info": {
      "name": "陳小嵐",
      "employee_no": "E2108",
      "dept_name": "急診護理部"
    },
    "points": {
      "current_balance": 120,
      "cash_equivalent": 120
    },
    "tree": {
      "current_level": 2,
      "level_name": "茁壯小樹",
      "current_exp": 120,
      "next_level_exp": 150,
      "pending_dew": 2
    },
    "charity_eligible": true
  }
}
```

### 3.2 澆灌樹木（遊戲互動）
- **Endpoint**: `POST /api/v1/tree/water`
- **Request**:
```json
{
  "water_amount": 1
}
```
- **Response**:
```json
{
  "code": 200,
  "message": "樹木澆灌成功",
  "data": {
    "exp_gained": 10,
    "total_exp": 130,
    "remaining_dew": 1,
    "is_level_up": false
  }
}
```

### 3.3 點數公益加成轉化（前山基金會專案）
- **業務規則**：需滿 100 點，成功後醫院代捐 NT$ 200。
- **Endpoint**: `POST /api/v1/redemption/charity-donate`
- **Request**:
```json
{
  "project_code": "QIAN_SHAN_2026",
  "points_to_donate": 100
}
```
- **Response**:
```json
{
  "code": 200,
  "message": "愛心捐贈轉換完成，感謝同仁善行",
  "data": {
    "transaction_id": "TX-20261030-9981",
    "donated_points": 100,
    "hospital_matching_fund": 200,
    "beneficiary": "財團法人南投縣私立前山社會福利慈善事業基金會",
    "current_balance": 20,
    "certificate_badge_url": "https://assets.csh.org.tw/badges/angel_tree_2026.svg"
  }
}
```

---

## 4. 硬體刷卡與外部系統自動整合機制 (Edge Integration)

為達成「數位自動化，健康不費力」，避免同仁紙本填寫，系統建構四組非同步整合流程：

### 4.1 餐廳 POS 機蔬食辨識入點
1. **觸發情境**：每週一、二蔬食日，同仁在餐廳結帳時感應員工識別證（RFID）。
2. **傳輸機制**：POS 結帳單完成後，由 POS 系統發送 Webhook 到中台 `/api/v1/integrations/pos-event`。
3. **防重入設計**：以 `pos_terminal_id + receipt_no + date` 雜湊生成 `idempotency_key`，每日每人限領一次。
4. **自動推播**：入點完成後呼叫 LINE Messaging API，推播：「今日蔬食餐點已為您添得健康點數 +1」。

### 4.2 體能教室感應門禁（健身器材）
1. **觸發情境**：同仁刷卡進入體能教室，並於健身器材讀卡器再次嗶卡。
2. **計時邏輯**：
   - 第一次刷卡：記錄 `start_time` 至 Redis（TTL: 2 小時）。
   - 運動滿 30 分鐘後離場刷卡：記錄 `end_time`。
   - 判定差值 $\ge 30 \text{ 分鐘}$，系統觸發積點事件。
3. **異常處理**：若未刷退，記錄逾時自動釋放，不重複發送點數。

### 4.3 健檢與癌症篩檢（HIS 整合）
- **定時批次排程 (Cron Job)**：每日凌晨 02:00 執行 ETL 作業。
- **資料檢索**：連線院內 HIS 唯讀副本庫，查詢前一日檢驗科發布之符合四癌篩檢（子宮頸抹片、乳房攝影、大腸便潛血、口腔黏膜）及年度全院健檢合格名單。
- **入帳規則**：每項篩檢每年限核發 1 次（+1 至 +2 點），並同步更新健康存摺檢核標記。

---

## 5. 安全性與稽核規格 (Security & Compliance)

1. **防並發超額扣點（Concurrency Control）**：
   - 所有點數扣除操作均採用 Redis 分布式鎖（Redlock），粒度精確至使用者層級：`lock:user:points:<user_id>`。
   - 資料庫層面使用 `SELECT balance FROM users WHERE id = $1 FOR UPDATE` 行級鎖定，杜絕雙重花費（Double Spending）。

2. **個資保護與醫療去識別化**：
   - 健檢與癌篩僅記錄「是否完成（Boolean）」與「完成日期」，**不儲存具體醫療檢驗數值與診斷細節**至健康銀行資料庫，嚴格符合《個人資料保護法》與醫療機構資安規範。

3. **稽核軌跡 (Audit Log)**：
   - 每一筆手動補登或權限調整動作，均須記錄操作者帳號、IP、調整原因與變更前/後值，日誌持久化儲存 3 年以上備查。

---

## 6. 前端架構與部署規範 (Deployment & DevOps)

### 6.1 前端技術堆疊
- **框架**：Vue 3 (Composition API) + Vite + TypeScript
- **樣式**：Tailwind CSS（遵照和風極簡調色盤變數配置）
- **狀態管理**：Pinia
- **動態圖形**：Lottie-web（渲染若竹生長、落水水滴輕量動畫）
- **LINE 整合**：`@line/liff` SDK v2.22+

### 6.2 容器化部署設定 (Docker Compose 範例)

```yaml
version: '3.8'

services:
  csh-backend-api:
    image: csh-health-bank-api:latest
    container_name: csh_health_api
    restart: always
    environment:
      - NODE_ENV=production
      - DB_HOST=postgres-db
      - DB_PORT=5432
      - DB_NAME=csh_healthbank
      - REDIS_URL=redis://redis-service:6379
      - LINE_CHANNEL_ID=${LINE_CHANNEL_ID}
      - LINE_CHANNEL_SECRET=${LINE_CHANNEL_SECRET}
    ports:
      - "8080:8080"
    depends_on:
      - postgres-db
      - redis-service

  postgres-db:
    image: postgres:16-alpine
    container_name: csh_postgres
    restart: always
    volumes:
      - pgdata:/var/lib/postgresql/data
    environment:
      POSTGRES_USER: health_admin
      POSTGRES_PASSWORD: ${DB_SECURE_PASSWORD}
      POSTGRES_DB: csh_healthbank

  redis-service:
    image: redis:7-alpine
    container_name: csh_redis
    restart: always
    command: ["redis-server", "--appendonly", "yes"]

volumes:
  pgdata:
```

---

## 7. 階段里程碑與測試驗收清單 (Milestones & Acceptance)

| 階段 | 預計時程 | 交付成果 | 驗收核心指標 |
| :--- | :--- | :--- | :--- |
| **Phase 1** | 第 1 ~ 3 週 | 資料庫架構、基礎 API、LINE LIFF 綁定登入 | 員工證與 LINE UID 綁定成功率 100% |
| **Phase 2** | 第 4 ~ 6 週 | 點數核心引擎、樹苗養成 Lottie 動畫、商城兌換 | 壓測 500 RPS 並發扣點無死鎖與重複兌換 |
| **Phase 3** | 第 7 ~ 9 週 | POS 機、門禁刷卡、HIS 排程介接中台 | 刷卡 5 秒內完成點數入帳並發布 LINE 訊息 |
| **Phase 4** | 第 10 ~ 11 週 | 前山基金會公益加成轉化、後台報表導出 | 產出每月捐款對帳清冊與符合會計審計標準 |
| **Phase 5** | 第 12 週 | 院內全系統滲透測試、高可用備份演練、上線 | 系統可用性達 99.9%，無重大資安漏洞 |