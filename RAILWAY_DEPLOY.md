# Railway 部署教學 - RunCrew

用 Railway 部署整個 App（前端 + 後端 + 資料庫），一個平台搞定。

---

## 前置準備

1. **GitHub 帳號**（程式碼需在 GitHub）
2. **Railway 帳號**：https://railway.app → Sign up with GitHub

---

## Step 1：把程式碼推到 GitHub

如果還沒推上去：

```bash
git add .
git commit -m "Prepare for deployment"
git push origin main
```

---

## Step 2：在 Railway 建立專案

1. 登入 https://railway.app
2. 點 **New Project**
3. 選 **Deploy from GitHub repo**
4. 選你的 FYP 專案 repo
5. Railway 會自動偵測到 `Dockerfile` 並開始部署（第一次可能會失敗，因為還沒設定環境變數）

---

## Step 3：新增 PostgreSQL 資料庫

1. 在專案頁面點 **+ New**
2. 選 **Database** → **PostgreSQL**
3. Railway 會建立一個 PostgreSQL 服務
4. 點進 PostgreSQL 服務 → **Variables** → 複製 `DATABASE_URL`（格式類似 `postgresql://postgres:xxx@xxx.railway.app:5432/railway`）

---

## Step 4：設定 App 的環境變數

1. 點進你的 **Web Service**（不是 PostgreSQL 那個）
2. 點 **Variables** 分頁
3. 點 **+ New Variable** 或 **Raw Editor**，加入：

| 變數名稱 | 值 | 說明 |
|----------|-----|------|
| `DATABASE_URL` | （從 PostgreSQL 服務複製） | 資料庫連線 |
| `JWT_SECRET` | 隨機長字串，例如 `my-super-secret-jwt-key-12345` | 登入 token 用 |
| `JWT_REFRESH_SECRET` | 另一個隨機長字串 | 刷新 token 用 |
| `PORT` | `5000` | 服務埠號 |
| `NODE_ENV` | `production` | 環境 |

**CORS_ORIGIN** 先不設，等拿到網址再補。

---

## Step 5：連結 PostgreSQL 到 App

1. 在 Web Service 的 **Variables** 裡，點 **Add Reference**
2. 選 PostgreSQL 服務的 `DATABASE_URL`
3. 這樣 `DATABASE_URL` 會自動帶入

（或手動貼上 Step 3 複製的 `DATABASE_URL`）

---

## Step 6：產生網址並設定 CORS

1. 點 Web Service → **Settings**
2. 在 **Networking** 區塊點 **Generate Domain**
3. 會得到類似 `https://your-app-name.up.railway.app` 的網址
4. 回到 **Variables**，新增：
   - `CORS_ORIGIN` = 你的 Railway 網址（例如 `https://your-app-name.up.railway.app`）
   - `PRODUCTION_ORIGIN` = 同上

5. 儲存後 Railway 會自動重新部署

---

## Step 7：執行種子資料（測試帳號）

**遷移自動執行**：App 啟動時會自動跑 migrations，不需手動執行。

**種子資料**（建立測試帳號、活動等）：需要跑一次：

1. 點 Web Service → **Settings** → 找到 **Deploy** 區塊
2. 若有 **Shell** 或 **Run Command**，執行：
   ```bash
   node dist/database/seed.js
   ```

若 Railway 沒有 Shell，可改用本機執行：

```bash
# 在專案根目錄，設定 Railway 的 DATABASE_URL 後執行
DATABASE_URL="postgresql://..." npm run seed --workspace=backend
```

（從 Railway 的 PostgreSQL 服務複製 `DATABASE_URL`，貼到本機環境變數）

---

## Step 8：確認部署成功

1. 開啟你的 Railway 網址，例如 `https://your-app-name.up.railway.app`
2. 應能看到登入頁
3. 用 `alice@test.com` / `Test1234!` 登入測試

---

## 常見問題

### 部署失敗：Build error

- 確認 repo 根目錄有 `Dockerfile`
- 確認 `frontend`、`backend` 資料夾結構正確

### 登入失敗 / 500 錯誤

- 檢查 `DATABASE_URL` 是否正確
- 確認已執行 `migrate` 和 `seed`

### CORS 錯誤

- 確認 `CORS_ORIGIN` 和 `PRODUCTION_ORIGIN` 與實際網址一致（含 `https://`，結尾不要 `/`）

### 如何跑 seed？

若 Railway 有 **Shell**：

```bash
cd /app && node dist/database/seed.js
```

若沒有 Shell，可在本機用 Railway 的 `DATABASE_URL` 連線後執行 seed。

---

## 費用說明

- Railway 有免費額度（約 $5/月）
- 超過會要求綁信用卡
- 適合 FYP 展示與小型上線

---

## 快速檢查清單

- [ ] 程式碼已推到 GitHub
- [ ] Railway 專案已建立並連結 repo
- [ ] 已新增 PostgreSQL
- [ ] 已設定 `DATABASE_URL`、`JWT_SECRET`、`JWT_REFRESH_SECRET`
- [ ] 已產生網址並設定 `CORS_ORIGIN`
- [ ] 已執行 migrate 和 seed
- [ ] 能成功開啟網頁並登入
