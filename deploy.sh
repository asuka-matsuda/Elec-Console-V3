#!/usr/bin/env bash
set -e

# ==============================================================================
# Elec-Console-V3 本番環境 自動デプロイ・更新スクリプト (ConoHa VPS / Ubuntu)
# 
# 使い方:
#   初回構築 (クリーンアップ含む):  bash deploy.sh --clean  (または単に bash deploy.sh)
#   次回以降の自動アップデート:   bash deploy.sh
# ==============================================================================

# 色付き出力
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
CYAN='\033[0;36m'
NC='\033[0m'

echo -e "${BLUE}======================================================${NC}"
echo -e "${BLUE}   Elec-Console-V3 本番デプロイ＆管理スクリプト      ${NC}"
echo -e "${BLUE}======================================================${NC}"

# スクリプトがあるディレクトリに移動
cd "$(dirname "$0")"

# モード判定 (引数 --clean / --init があるか、PM2に登録されていない場合は初期化モード)
IS_CLEAN_MODE=false
if [[ "$1" == "--clean" || "$1" == "--init" ]]; then
  IS_CLEAN_MODE=true
elif ! command -v pm2 &> /dev/null || ! pm2 list | grep -q "elec-console"; then
  IS_CLEAN_MODE=true
fi

if [ "$IS_CLEAN_MODE" = true ]; then
  echo -e "${CYAN}>>> 【初回クリーンアップ＆初期構築モード】で実行します${NC}"
else
  echo -e "${CYAN}>>> 【自動アップデート (ゼロダウンタイム) モード】で実行します${NC}"
fi

# ------------------------------------------------------------------------------
# 1. 旧環境のクリーンアップ (初回クリーンモード時のみ実行)
# ------------------------------------------------------------------------------
if [ "$IS_CLEAN_MODE" = true ]; then
  echo -e "\n${YELLOW}[Step 1/6] 旧環境・残留プロセスのクリーンアップ中...${NC}"

  # PM2の確認と古いプロセスの停止・削除
  if command -v pm2 &> /dev/null; then
    echo ">>> PM2 で稼働中の旧プロセスを停止・整理します..."
    # 既存の elec-console 以外の古いプロセスがあれば停止
    pm2 stop all 2>/dev/null || true
    pm2 delete all 2>/dev/null || true
    pm2 save --force 2>/dev/null || true
  fi

  # ポート 3000 を占有している残留プロセスの解放 (fuser / lsof)
  if command -v fuser &> /dev/null; then
    echo ">>> ポート 3000 の解放確認..."
    fuser -k 3000/tcp 2>/dev/null || true
  fi
  echo ">>> クリーンアップ完了。"
else
  echo -e "\n${YELLOW}[Step 1/6] 最新ソースコードを取得中 (Git Fetch & Reset)...${NC}"
  git fetch origin main
  git reset --hard origin/main
fi

# ------------------------------------------------------------------------------
# 2. 環境変数 (.env) の確認と自動セットアップ
# ------------------------------------------------------------------------------
echo -e "\n${YELLOW}[Step 2/6] 環境変数 (.env) をチェック中...${NC}"
if [ ! -f .env ]; then
  echo ">>> .env が存在しないため、本番用設定を新規生成します..."
  AUTH_SECRET_GEN=$(openssl rand -hex 32 2>/dev/null || date +%s%N | sha256sum | head -c 64)
  cat << EOF > .env
NODE_OPTIONS="--experimental-require-module"
DATABASE_URL="file:./prisma/dev.db"
AUTH_SECRET="${AUTH_SECRET_GEN}"
PORT=3000
NITRO_PORT=3000
NODE_ENV=production
EOF
  echo ">>> 本番用 .env を生成しました。"
fi

# ------------------------------------------------------------------------------
# 3. 依存パッケージのインストール
# ------------------------------------------------------------------------------
echo -e "\n${YELLOW}[Step 3/6] 依存パッケージをインストール中...${NC}"
export NODE_OPTIONS="--experimental-require-module"
npm install --no-audit

# ------------------------------------------------------------------------------
# 4. データベースの更新・反映 (Prisma)
# ------------------------------------------------------------------------------
echo -e "\n${YELLOW}[Step 4/6] データベースを更新中...${NC}"
npx prisma generate
npx prisma db push --skip-generate

# 初回クリーンアップモード時はシードデータ（現場・マスターユーザー等）を確実に同期
if [ "$IS_CLEAN_MODE" = true ]; then
  echo ">>> 初期現場データ（テスト現場、第二現場など）および管理者をシード同期中..."
  if [ -f prisma/seed.cjs ]; then
    node prisma/seed.cjs || true
  fi
fi

# ------------------------------------------------------------------------------
# 5. アプリケーションのビルド (Nuxt 4 / Nitro)
# ------------------------------------------------------------------------------
echo -e "\n${YELLOW}[Step 5/6] 本番アプリケーションをビルド中 (Nuxt 4)...${NC}"
npm run build

# ------------------------------------------------------------------------------
# 6. PM2 プロセスの起動 / ゼロダウンタイム再起動
# ------------------------------------------------------------------------------
echo -e "\n${YELLOW}[Step 6/6] サーバープロセスを管理・反映中 (PM2)...${NC}"
if ! command -v pm2 &> /dev/null; then
  echo ">>> PM2 をグローバルインストールします..."
  sudo npm install -g pm2
fi

if pm2 list | grep -q "elec-console"; then
  echo ">>> 稼働中の elec-console をゼロダウンタイムで再読み込み (reload) します..."
  pm2 reload ecosystem.config.cjs --update-env
else
  echo ">>> elec-console プロセスを新規起動します..."
  pm2 start ecosystem.config.cjs
fi

pm2 save

# Nginx の設定構文チェック（エラーがあれば警告）
if command -v nginx &> /dev/null; then
  sudo nginx -t 2>/dev/null && sudo systemctl reload nginx 2>/dev/null || true
fi

echo -e "\n${GREEN}======================================================${NC}"
if [ "$IS_CLEAN_MODE" = true ]; then
  echo -e "${GREEN}   【初回セットアップ完了】旧環境の整理とV3の公開が完了しました！${NC}"
else
  echo -e "${GREEN}   【自動アップデート完了】最新コードの反映が完了しました！${NC}"
fi
echo -e "${GREEN}   公開URL: https://app.mat-ope.com${NC}"
echo -e "${GREEN}======================================================${NC}"
pm2 status elec-console
