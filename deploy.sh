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

# ------------------------------------------------------------------------------
# 1. ソースコードを常に最新に同期
# ------------------------------------------------------------------------------
echo -e "\n${YELLOW}[Step 1/6] 最新ソースコードを取得中 (Git Fetch & Reset)...${NC}"
git fetch origin main
git reset --hard origin/main

# ------------------------------------------------------------------------------
# 1.5 スワップメモリ (Swap) の確保 (1GB VPS 等のメモリ不足・OOM 対策: 4GB)
# ------------------------------------------------------------------------------
SWAP_TOTAL=$(free -m 2>/dev/null | awk '/^Swap:/ {print $2}')
if [ -z "$SWAP_TOTAL" ] || [ "$SWAP_TOTAL" -lt 3500 ]; then
  echo -e "\n${YELLOW}>>> ビルド時のメモリ不足 (OOM) 防止のため、スワップメモリ (4GB) を確保中...${NC}"
  swapoff /swapfile 2>/dev/null || true
  rm -f /swapfile
  fallocate -l 4G /swapfile 2>/dev/null || dd if=/dev/zero of=/swapfile bs=1M count=4096 2>/dev/null
  chmod 600 /swapfile
  mkswap /swapfile 2>/dev/null
  swapon /swapfile 2>/dev/null || true
  if ! grep -q '/swapfile' /etc/fstab 2>/dev/null; then
    echo '/swapfile none swap sw 0 0' >> /etc/fstab 2>/dev/null || true
  fi
  echo -e "${GREEN}>>> スワップメモリ (4GB) を有効化しました。${NC}"
fi

# ------------------------------------------------------------------------------
# 1.6 Node.js バージョンの確認と自動アップデート (Nuxt 4 は Node 22+ 必須)
# ------------------------------------------------------------------------------
NODE_MAJOR=$(node -v 2>/dev/null | cut -d'.' -f1 | tr -d 'v')
if [ -z "$NODE_MAJOR" ] || [ "$NODE_MAJOR" -lt 22 ]; then
  echo -e "\n${YELLOW}>>> Nuxt 4 の本番ビルドには Node.js 22 以上が必要です (現在: $(node -v))${NC}"
  echo ">>> Node.js 22 LTS へのアップグレードを自動実行します..."
  if command -v curl &> /dev/null; then
    curl -fsSL https://deb.nodesource.com/setup_22.x | bash -
    apt-get install -y nodejs 2>/dev/null || sudo apt-get install -y nodejs
  fi
  echo -e "${GREEN}>>> Node.js を更新しました: $(node -v)${NC}"
fi

# ------------------------------------------------------------------------------
# 2. 旧環境のクリーンアップ (初回クリーンモード時のみ実行)
# ------------------------------------------------------------------------------
if [ "$IS_CLEAN_MODE" = true ]; then
  echo -e "\n${CYAN}>>> 【初回クリーンアップ＆初期構築モード】で実行します${NC}"
  echo -e "${YELLOW}>>> 旧環境・残留プロセスのクリーンアップ中...${NC}"

  # PM2の確認と古いプロセスの完全停止・削除
  if command -v pm2 &> /dev/null; then
    echo ">>> PM2 で稼働中の旧プロセスを停止・整理します..."
    pm2 stop all 2>/dev/null || true
    pm2 delete all 2>/dev/null || true
    pm2 save --force 2>/dev/null || true
  fi

  # ポート 3000 を占有している残留プロセスの解放 (fuser)
  if command -v fuser &> /dev/null; then
    echo ">>> ポート 3000 の解放確認..."
    fuser -k 3000/tcp 2>/dev/null || true
  fi
  echo ">>> クリーンアップ完了。"
else
  echo -e "\n${CYAN}>>> 【自動アップデート (ゼロダウンタイム) モード】で実行します${NC}"
fi

# ------------------------------------------------------------------------------
# 3. 環境変数 (.env) の確認と自動セットアップ (Node 20互換)
# ------------------------------------------------------------------------------
echo -e "\n${YELLOW}[Step 2/6] 環境変数 (.env) をチェック中...${NC}"
if [ ! -f .env ]; then
  echo ">>> .env が存在しないため、本番用設定を新規生成します..."
  AUTH_SECRET_GEN=$(openssl rand -hex 32 2>/dev/null || date +%s%N | sha256sum | head -c 64)
  cat << EOF > .env
DATABASE_URL="file:./prisma/dev.db"
AUTH_SECRET="${AUTH_SECRET_GEN}"
PORT=3000
NITRO_PORT=3000
NODE_ENV=production
EOF
  echo ">>> 本番用 .env を生成しました。"
else
  # 既存の .env から不要な NODE_OPTIONS を除去 (Node 20互換)
  sed -i '/NODE_OPTIONS/d' .env 2>/dev/null || true
fi

# ------------------------------------------------------------------------------
# 4. 依存パッケージのインストール (Linux / Node 20 互換)
# ------------------------------------------------------------------------------
echo -e "\n${YELLOW}[Step 3/6] 依存パッケージをインストール中...${NC}"
npm install --no-audit --ignore-engines

# ------------------------------------------------------------------------------
# 5. データベースの更新・反映 (Prisma)
# ------------------------------------------------------------------------------
echo -e "\n${YELLOW}[Step 4/6] データベースを更新中...${NC}"
npx prisma generate
npx prisma db push --skip-generate

# 常にシードデータ（現場・マスターユーザー等）を確実に同期
echo ">>> 現場データ（テスト現場、第二現場など）および管理者を同期中..."
if [ -f prisma/seed.cjs ]; then
  node prisma/seed.cjs
fi
chmod 666 prisma/dev.db* 2>/dev/null || true

# ------------------------------------------------------------------------------
# 6. アプリケーションのビルド (Nuxt 4 / Nitro)
# ------------------------------------------------------------------------------
echo -e "\n${YELLOW}[Step 5/6] 本番アプリケーションをビルド中 (Nuxt 4)...${NC}"
NODE_OPTIONS="--max-old-space-size=2560" npm run build

# ------------------------------------------------------------------------------
# 7. PM2 プロセスの起動 / ゼロダウンタイム再起動
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

# Nginx の設定構文チェックと再読み込み
if command -v nginx &> /dev/null; then
  sudo nginx -t 2>/dev/null && sudo systemctl reload nginx 2>/dev/null || true
fi

# 疎通確認
echo -e "\n${YELLOW}>>> ローカルサーバーの疎通確認中...${NC}"
sleep 3
if curl -s -I http://localhost:3000 | grep -q "200\|302\|304"; then
  echo -e "${GREEN}>>> 正常に応答（200 OK）を受信しました！${NC}"
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
