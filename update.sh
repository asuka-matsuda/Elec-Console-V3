#!/usr/bin/env bash
set -e

# ==============================================================================
# Elec-Console-V3 日常アップデート専用スクリプト
# 使い方: bash update.sh
# ==============================================================================

GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m'

echo -e "${BLUE}======================================================${NC}"
echo -e "${BLUE}   🚀 Elec-Console-V3 クイックアップデート           ${NC}"
echo -e "${BLUE}======================================================${NC}"

cd "$(dirname "$0")"

# 1. 最新コードの取得
echo -e "\n${YELLOW}[1/4] GitHub から最新コードを取得中...${NC}"
git pull origin main

# 2. パッケージ更新 (package.json に変更があった場合のみ実行)
if git diff --name-only HEAD@{1} HEAD 2>/dev/null | grep -q "package.json"; then
  echo -e "\n${YELLOW}>>> package.json の更新を検知したためパッケージを更新中...${NC}"
  npm install --no-audit --ignore-engines
fi

# 3. データベースの更新とクライアント生成
echo -e "\n${YELLOW}[2/4] データベースの同期およびクライアント生成...${NC}"
npx prisma db push > /dev/null 2>&1 || true
npx prisma generate
if [ -f prisma/seed.cjs ]; then
  node prisma/seed.cjs 2>/dev/null || true
fi
chmod 666 prisma/dev.db* 2>/dev/null || true

# 4. 高速本番ビルド
echo -e "\n${YELLOW}[3/4] アプリケーションをビルド中...${NC}"
NODE_OPTIONS="--max-old-space-size=2560" npm run build

# 5. サーバープロセスの更新
echo -e "\n${YELLOW}[4/4] サーバープロセスを更新中...${NC}"
pm2 reload ecosystem.config.cjs --update-env 2>/dev/null || pm2 restart ecosystem.config.cjs 2>/dev/null || pm2 start ecosystem.config.cjs
pm2 save

sleep 2
pm2 status elec-console

echo -e "\n${GREEN}======================================================${NC}"
echo -e "${GREEN}   ✨ アップデート完了！最新バージョンが公開されました！ ${NC}"
echo -e "${GREEN}   公開URL: https://app.mat-ope.com                  ${NC}"
echo -e "${GREEN}======================================================${NC}"
