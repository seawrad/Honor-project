# 資料庫設定與遷移

## 概述

此目錄包含資料庫連接設定、遷移檔案和類型定義。

## 檔案結構

```
database/
├── migrations/          # SQL 遷移檔案
│   └── 001_initial_schema.sql
├── db.ts               # 資料庫連接和客戶端包裝器
├── migrate.ts          # 遷移執行器
├── types.ts            # TypeScript 類型定義
└── README.md           # 本檔案
```

## 環境變數設定

在 `backend/.env` 檔案中設定以下變數：

```env
DB_HOST=localhost
DB_PORT=5432
DB_NAME=group_running_app
DB_USER=postgres
DB_PASSWORD=postgres
DB_POOL_MAX=20
DB_IDLE_TIMEOUT=30000
DB_CONNECTION_TIMEOUT=2000
```

## 使用方式

### 執行遷移

```bash
# 執行所有待處理的遷移
npm run migrate

# 或直接使用 tsx
tsx src/database/migrate.ts up
```

### 回滾遷移

```bash
# 回滾最後一次遷移
npm run migrate:rollback

# 或直接使用 tsx
tsx src/database/migrate.ts rollback
```

### 在程式碼中使用資料庫

```typescript
import { db } from './database/db.js'

// 執行查詢
const result = await db.query('SELECT * FROM users WHERE id = $1', [userId])

// 執行交易
await db.transaction(async (client) => {
  await client.query('INSERT INTO users (...) VALUES (...)')
  await client.query('INSERT INTO activities (...) VALUES (...)')
})

// 測試連接
const isConnected = await db.testConnection()

// 取得連接池統計
const stats = db.getPoolStats()
```

## 資料庫架構

### 主要資料表

- **users**: 使用者帳號資訊
- **activities**: 跑步活動
- **activity_participants**: 活動參與者（多對多關聯）
- **social_connections**: 社交關係（追蹤/被追蹤）
- **routes**: GPS 路線記錄
- **chat_rooms**: 聊天室
- **chat_messages**: 聊天訊息
- **notifications**: 通知
- **activity_ratings**: 活動評分

### 索引優化

所有外鍵和常用查詢欄位都已建立索引，包括：

- 活動的建立者、日期、位置、狀態
- 參與者的使用者和活動關聯
- 社交連接的追蹤者和被追蹤者
- 路線的使用者和活動關聯
- 聊天訊息的聊天室和時間
- 通知的使用者和已讀狀態

## 錯誤處理

`DatabaseClient` 類別提供自動錯誤處理：

- 查詢失敗會拋出 `DatabaseError`
- 交易失敗會自動回滾
- 連接錯誤會記錄並重新拋出
- 開發模式下會記錄查詢執行時間

## 連接池管理

- 預設最大連接數：20
- 閒置超時：30 秒
- 連接超時：2 秒
- 支援優雅關閉（graceful shutdown）
