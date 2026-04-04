# Group Running App（團體跑步 Web 應用）— 系統說明報告

本文件介紹本專案之定位、架構、功能模組、技術棧、資料庫、即時通訊、部署與維運要點，供期末報告或技術文件使用。

---

## 一、專案概述

### 1.1 專案名稱與定位

- **名稱**：Group Running App（前端品牌可呈現為 RunCrew）
- **類型**：Progressive Web App（PWA）形態的單頁應用（SPA）
- **目標**：讓跑者能在網路上建立／搜尋／加入團體跑步活動，並整合社群（追蹤／動態）、活動內即時聊天、GPS 軌跡與路線歷史、成就與排行榜、跑後記憶卡、私訊（DM）等，形成完整的「線上跑團」體驗。

### 1.2 使用者故事（摘要）

| 角色 | 可做之事 |
|------|-----------|
| 一般使用者 | 註冊、登入、瀏覽活動、建立活動、加入／退出、查看詳情、聊天、GPS 追蹤、獨跑、路線歷史 |
| 社交使用者 | 搜尋使用者、追蹤／取消追蹤、個人檔案、粉絲／追蹤列表、追蹤動態 Feed |
| 進階使用者 | 編輯／取消活動（依規則）、活動評分、成就、統計、排行榜、記憶卡、DM |
| 開發者帳號 | 可略過部分限制（如倒數、過去時間等），便於測試 |

---

## 二、整體架構

### 2.1 Monorepo 結構

```
group-running-app/
├── frontend/          # React + TypeScript + Vite
├── backend/           # Node.js + Express + TypeScript
├── docker-compose.yml # 本地 PostgreSQL（Redis 容器可選）
├── Dockerfile         # 生產映像：建置前端 + 後端，後端可同時提供靜態前端
├── DEPLOYMENT.md      # 部署說明
├── RAILWAY_DEPLOY.md  # Railway 部署步驟（若專案內有）
├── SEED_TESTING_GUIDE.md
└── package.json       # npm workspaces 根設定
```

### 2.2 執行時架構（概念）

```
[瀏覽器]
    │  HTTPS
    ▼
[Express 後端]
    ├── REST API        /api/*
    ├── Socket.io       /socket.io（即時聊天、活動內位置分享）
    ├── 靜態資源       /（生產：Vite build 產物）
    └── Swagger UI      /api-docs
         │
         ▼
    [PostgreSQL]
```

- **開發模式**：前端常駐（例如 localhost:3000），透過 Vite proxy 轉發 `/api`、`/socket.io` 至後端（例如 localhost:5000）。
- **生產模式（Docker／Railway）**：同一服務埠可提供前端靜態檔與 API；若前後端分離部署，需正確設定 `CORS_ORIGIN`（及可選 `PRODUCTION_ORIGIN`），並注意尾隨斜線與實際 Origin 一致。

### 2.3 認證與狀態

- **JWT**：Access Token + Refresh Token。
- **前端**：`AuthContext` 管理登入狀態；Axios 攔截器處理 Token 過期與刷新。
- **受保護路由**：`ProtectedRoute` 包裝主版面與業務頁面。

---

## 三、技術棧（細項）

### 3.1 前端

| 類別 | 技術 |
|------|------|
| 框架 | React 18、TypeScript |
| 建置 | Vite |
| UI | Material-UI (MUI)、Emotion |
| 路由 | React Router v6 |
| 地圖 | Leaflet、react-leaflet |
| 即時 | socket.io-client |
| 國際化 | i18next、react-i18next（含繁中／英文等） |
| PWA | vite-plugin-pwa、Workbox |
| HTTP | Axios |
| 測試 | Vitest、Testing Library |

**效能與體驗**：路由 lazy load（登入／註冊可 eager）、響應式版面、Web Vitals 觀測（開發環境）、地圖區塊響應式高度等。

### 3.2 後端

| 類別 | 技術 |
|------|------|
| 執行環境 | Node.js 18+（建議 20+） |
| 框架 | Express 4 |
| 語言 | TypeScript（編譯至 dist/） |
| 資料庫 | PostgreSQL（pg 連線池） |
| 即時 | Socket.io（與 HTTP 共用伺服器） |
| 安全 | Helmet、CORS 白名單、express-rate-limit、輸入驗證 |
| 文件 | swagger-ui-express、OpenAPI 規格 |
| 測試 | Vitest、Supertest |

**部署行為**：啟動時可自動執行 migrations（可用 `SKIP_AUTO_MIGRATE=1` 關閉）；可選 `SEED_ON_START=1` 於啟動時執行種子資料（示範／測試環境用，正式環境請審慎）；置於反向代理後建議設定 `trust proxy`，避免 rate limit 與 `X-Forwarded-For` 相關錯誤。資料庫連線可支援 `DATABASE_URL`（例如 Railway PostgreSQL）與傳統 `DB_*` 變數。

### 3.3 資料庫遷移（Migrations）

`backend/src/database/migrations/` 檔案與主題：

| 檔案 | 主題 |
|------|------|
| 001_initial_schema.sql | 使用者、活動、參與者、社交、路線、聊天室、訊息、通知、評分等核心表 |
| 002_add_user_avatar.sql | 使用者頭像 URL |
| 003_activity_type.sql | 活動類型／起迄點等擴充 |
| 004_dm_chat.sql | 私訊房間與訊息 |
| 005_run_memory_cards.sql | 跑後記憶卡 |
| 006_achievements.sql、009_add_more_achievements.sql | 成就系統 |
| 007_goals.sql | 週／月目標 |
| 008_solo_runs.sql | 獨跑紀錄 |
| 010_activity_bookmarks.sql | 活動書籤 |
| 011_route_positions_local.sql | 路線／座標相關擴充 |

---

## 四、前端路由與頁面（App.tsx）

在 `ProtectedRoute` + `AppLayout` 下的主要路由：

| 路徑 | 頁面／用途 |
|------|------------|
| `/` | 首頁 HomePage |
| `/activities` | 活動列表 ActivityListPage |
| `/activities/create` | 建立活動 CreateActivityPage |
| `/activities/:id` | 活動詳情 ActivityDetailPage |
| `/activities/:id/edit` | 編輯活動 EditActivityPage |
| `/activities/:id/cancel` | 取消活動 CancelActivityPage |
| `/activities/:activityId/tracking` | GPS 追蹤 GPSTrackingPage |
| `/run-now` | 獨跑 SoloRunPage |
| `/activities/:activityId/chat` | 活動聊天 ChatPage |
| `/routes/history` | 路線歷史 RouteHistoryPage |
| `/memory-cards/:cardId` | 記憶卡 RunMemoryCardPage |
| `/users/:userId` | 使用者檔案 UserProfilePage |
| `/users/search` | 使用者搜尋 UserSearchPage |
| `/users/:userId/followers`、`/following` | 粉絲／追蹤列表 FollowersPage |
| `/feed` | 追蹤動態 ActivityFeedPage |
| `/chat-list` | 聊天列表 ChatListPage |
| `/achievements` | 成就 AchievementsPage |
| `/stats` | 統計 StatsPage |
| `/leaderboard` | 排行榜 LeaderboardPage |

公開路由：`/login`、`/register`；另有 `/settings`。未知路徑導向 `/`。

---

## 五、功能模組說明（依使用者流程）

### 5.1 帳號與身分

- 註冊：Email、密碼（強度規則）、顯示名稱、年齡區間、同意條款。
- 登入：可選保持登入、記住帳號。
- Token 刷新與登出：與 `AuthContext`、Token 儲存（如 localStorage）及後端 refresh 端點配合。

### 5.2 首頁與導覽（AppLayout）

- 頂欄、側邊選單（小螢幕抽屜）、模組入口（活動、Feed、聊天、成就、統計、排行榜、路線、建立活動、搜尋使用者等）。
- 通知鈴、離線指示、PWA 更新提示、錯誤 Toast、DM 浮動視窗、開發者橫幅（若實作）等。

### 5.3 活動（Activities）

- 列表：搜尋、篩選、地圖檢視（依實作）。
- 建立：時間型（單點）與路線型（地圖繪製、距離計算）。
- 詳情：主辦、時間地點、人數、參與者、狀態。
- 加入／退出、書籤、評分（完成後）、主辦編輯／取消（含時間窗限制，開發者模式可略過）。

### 5.4 GPS 追蹤與路線

- 活動內追蹤：軌跡、距離、速度；Socket 廣播位置給同房間使用者；地圖區分主辦與參與者。
- sessionStorage 還原工作階段（重新整理提示）。
- 路線歷史頁；獨跑流程（倒數等）。

### 5.5 聊天與私訊

- 活動聊天：Socket 即時 + HTTP 歷史訊息。
- DM：後端 004 遷移與 chat 相關 API；前端 Context 與浮動視窗。

### 5.6 社交與個人檔案

- 搜尋、追蹤、個人檔案、Followers／Following、Feed。

### 5.7 成就、目標、統計、排行榜

- 成就解鎖與列表 API；週／月目標；統計視覺化；排行榜依週／月與指標（距離或次數）彙總。

### 5.8 跑後記憶卡

- 活動相關記憶卡建立與檢視（標題、天氣、參與者訊息等，依實作）。

### 5.9 通知

- 活動、聊天、社交等事件之通知列表與已讀。

### 5.10 設定與離線

- 設定頁（語言、主題等）；OfflinePage；ErrorBoundary。

---

## 六、後端 API 路由（摘要）

| 前綴 | 用途 |
|------|------|
| `/api/auth` | 註冊、登入、刷新、目前使用者 |
| `/api/users` | 檔案、更新、追蹤、搜尋、評分列表等 |
| `/api/activities` | 活動 CRUD、搜尋、Feed、加入退出、書籤、評分 |
| `/api/routes` | 路線與座標 |
| `/api/memory-cards` | 記憶卡 |
| `/api/achievements` | 成就 |
| `/api/goals` | 目標 |
| `/api/leaderboard` | 排行榜 |
| `/api/chat` | 活動聊天與 DM |
| `/api/notifications` | 通知 |
| `/health` | 健康檢查 |
| `/api-docs` | Swagger UI |

實際路徑以 `backend/src/routes/*.ts` 與 Swagger 為準。

---

## 七、即時通訊（Socket.io）

- 聊天：加入活動房間、送訊、收訊。
- 活動追蹤：加入追蹤房間、送出座標、廣播（含主辦身分、頭像、速度等 metadata）。
- 連線驗證與 REST 相同 JWT 概念。

---

## 八、安全與合規（摘要）

- 密碼 bcrypt；JWT 雙 Token；生產環境務必設定強隨機 `JWT_SECRET`、`JWT_REFRESH_SECRET`。
- CORS 白名單與 Origin 正規化（避免尾隨斜線不一致）。
- Rate limiting；Helmet；欄位驗證（年齡、Email、活動時間等）。

---

## 九、測試與品質

- 前端：Vitest + Testing Library（多頁與元件）。
- 後端：Vitest + Supertest 等。
- 可選 coverage 指令產出覆蓋率。

---

## 十、部署與維運

- **Docker**：一體建置前後端，單一 Node 程序服務 API 與靜態檔；映像內需包含 migrations（例如複製至 dist）以便自動遷移。
- **Railway**：`DATABASE_URL`、JWT、CORS、`trust proxy`、可選 `SEED_ON_START`；詳見 `DEPLOYMENT.md` / `RAILWAY_DEPLOY.md`。
- **種子**：`npm run seed --workspace=backend` 或生產對應 `node dist/database/seed.js`；測試帳號見 `SEED_TESTING_GUIDE.md`。

---

## 十一、專案文件索引

| 檔案 | 內容 |
|------|------|
| README.md | 快速開始、技術棧、指令 |
| DEPLOYMENT.md | 部署與環境變數 |
| RAILWAY_DEPLOY.md | Railway 教學（若有） |
| SEED_TESTING_GUIDE.md | 種子與測試帳號 |

---

## 十二、結語

本專案為前後端分離、可 PWA 安裝、具即時通訊與地圖能力的團體跑步社群平台，整合活動管理、社交、聊天／位置分享、路線與排行榜／成就等模組，並支援 Docker 與雲端部署，適合作為期末專題或示範系統。

---

*若與程式實作有出入，以 `frontend/src`、`backend/src` 及 migrations 為準。*
