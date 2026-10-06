#!/usr/bin/env bash
set -e

# ==============================================================================
# Elec-Console-V3 超高速デプロイ & アップデートスクリプト
# ==============================================================================

GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

cd "$(dirname "$0")"

# ------------------------------------------------------------------------------
# 1. ローカル開発環境（PC手元）で実行された場合
#    -> 高速ローカルビルド & VPS転送デプロイ (約15秒で完了) を自動実行
# ------------------------------------------------------------------------------
if [ "$HOSTNAME" != "elec-vps" ] && [ "$USER" != "root" ]; then
  echo -e "${BLUE}======================================================${NC}"
  echo -e "${BLUE}   🚀 Elec-Console-V3 超高速ローカルビルドデプロイ    ${NC}"
  echo -e "${BLUE}======================================================${NC}"
  echo -e "${YELLOW}ローカル環境を検知しました。成果物転送による高速デプロイを開始します...${NC}"

  node scripts/deploy-fast.mjs
  exit 0
fi

# ------------------------------------------------------------------------------
# 2. VPSサーバー上で直接実行された場合のフォールバック処理
# ------------------------------------------------------------------------------
echo -e "${BLUE}======================================================${NC}"
echo -e "${BLUE}   ⚡ Elec-Console-V3 サーバー直接アップデート       ${NC}"
echo -e "${BLUE}======================================================${NC}"
echo -e "${YELLOW}※ VPS上の直接ビルドはメモリ制限のため時間がかかる場合があります。${NC}"
echo -e "${YELLOW}※ 手元PCから 'npm run deploy' または 'bash update.sh' の実行を推奨します。${NC}\n"

# 1. 最新コードの取得
echo -e "${YELLOW}[1/4] GitHub から最新コードを取得中...${NC}"
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

# 4. 本番ビルド (手元転送成果物がない場合のみビルド)
if [ ! -d ".output/server" ]; then
  echo -e "\n${YELLOW}[3/4] アプリケーションをビルド中...${NC}"
  NODE_OPTIONS="--max-old-space-size=2560" npm run build
else
  echo -e "\n${GREEN}[3/4] 既存のビルド成果物 (.output) を確認しました。ビルドをスキップします。${NC}"
fi

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
