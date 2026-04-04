# RunCrew

一個團體跑步應用程式（RunCrew），讓跑者可以建立、加入和追蹤團體跑步活動。

## 專案結構

這是一個 monorepo 專案，包含前端和後端：

```
RunCrew repo/
├── frontend/          # React + TypeScript + Vite 前端應用
├── backend/           # Node.js + Express + TypeScript 後端 API
├── docker-compose.yml # 本地開發環境 (PostgreSQL + Redis)
└── package.json       # Workspace 根配置
```

## 技術棧

### 前端
- React 18
- TypeScript
- Vite
- Material-UI (MUI)
- React Router
- Leaflet (地圖)
- Socket.io Client (即時通訊)

### 後端
- Node.js
- Express
- TypeScript
- PostgreSQL
- Socket.io (即時通訊)
- JWT (身份驗證)

### 開發工具
- ESLint
- Prettier
- Docker & Docker Compose

## 開始使用

### 前置需求

- Node.js 18+ 
- npm 或 yarn
- Docker 和 Docker Compose

### 安裝

1. 複製專案並安裝依賴：

```bash
npm install
```

2. 設定環境變數：

```bash
# 複製範例環境變數檔案
cp .env.example .env
cp backend/.env.example backend/.env
cp frontend/.env.example frontend/.env

# 編輯 .env 檔案並填入你的配置
```

3. 啟動資料庫服務（PostgreSQL；Redis 為選用，後端目前未使用）：

```bash
docker-compose up -d
```

4. 執行資料庫遷移（在專案根目錄）：

```bash
npm run migrate --workspace=backend
```

### 開發

啟動前端和後端開發伺服器：

```bash
# 同時啟動前端和後端
npm run dev

# 或分別啟動
npm run dev:frontend  # 前端運行在 http://localhost:3000
npm run dev:backend   # 後端運行在 http://localhost:5000
```

### 建置

```bash
npm run build
```

### 程式碼品質

```bash
# 執行 ESLint
npm run lint

# 格式化程式碼
npm run format
```

## 環境變數

查看 `.env.example` 檔案了解所需的環境變數配置。

主要配置包括：
- 資料庫連線資訊
- Redis 連線資訊
- JWT 密鑰
- AWS 配置（生產環境）
- CORS 設定

## 開發指南

詳細的需求、設計和實作計畫請參考：
- [需求文件](.kiro/specs/group-running-app/requirements.md)
- [設計文件](.kiro/specs/group-running-app/design.md)
- [任務清單](.kiro/specs/group-running-app/tasks.md)

## 部署到網際網路 (Deployment)

請參考 [DEPLOYMENT.md](DEPLOYMENT.md) 取得完整的部署指南。

## 授權

Private
