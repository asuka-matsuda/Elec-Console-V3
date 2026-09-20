#!/usr/bin/env bash
set -e

# ==============================================================================
# Elec-Console-V3 VPS 初期環境自動構築スクリプト (Ubuntu 20.04 / 22.04 / 24.04 対応)
# 
# 実行方法 (root 権限で 1 行実行):
#   curl -fsSL https://raw.githubusercontent.com/asuka-matsuda/Elec-Console-V3/main/init-server.sh | bash
# ==============================================================================

GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
CYAN='\033[0;36m'
NC='\033[0m'

echo -e "${BLUE}======================================================${NC}"
echo -e "${BLUE}   Elec-Console-V3 サーバー初期セットアップ開始       ${NC}"
echo -e "${BLUE}======================================================${NC}"

export DEBIAN_FRONTEND=noninteractive

# ------------------------------------------------------------------------------
# 1. スワップメモリ (2GB) の作成 (1GB VPS のメモリ不足 OOM 防止)
# ------------------------------------------------------------------------------
echo -e "\n${YELLOW}[1/7] スワップメモリ (2GB) を確認・作成中...${NC}"
SWAP_TOTAL=$(free -m 2>/dev/null | awk '/^Swap:/ {print $2}')
if [ -z "$SWAP_TOTAL" ] || [ "$SWAP_TOTAL" -lt 1024 ]; then
  if [ ! -f /swapfile ]; then
    fallocate -l 2G /swapfile 2>/dev/null || dd if=/dev/zero of=/swapfile bs=1M count=2048 2>/dev/null
    chmod 600 /swapfile
    mkswap /swapfile 2>/dev/null
  fi
  swapon /swapfile 2>/dev/null || true
  if ! grep -q '/swapfile' /etc/fstab 2>/dev/null; then
    echo '/swapfile none swap sw 0 0' >> /etc/fstab 2>/dev/null || true
  fi
  echo -e "${GREEN}>>> スワップメモリ (2GB) を有効化しました。${NC}"
else
  echo -e "${GREEN}>>> スワップメモリは既に確保されています。${NC}"
fi

# ------------------------------------------------------------------------------
# 2. 基本パッケージのインストール (curl, git, nginx, certbot)
# ------------------------------------------------------------------------------
echo -e "\n${YELLOW}[2/7] 必要なパッケージ (Nginx, Certbot, Git) をインストール中...${NC}"
apt-get update -y -q
apt-get install -y -q curl git nginx certbot python3-certbot-nginx

# ------------------------------------------------------------------------------
# 3. Node.js 22 (LTS) のインストール
# ------------------------------------------------------------------------------
echo -e "\n${YELLOW}[3/7] Node.js 22 LTS をインストール中...${NC}"
curl -fsSL https://deb.nodesource.com/setup_22.x | bash -
apt-get install -y -q nodejs
echo -e "${GREEN}>>> Node.js バージョン: $(node -v)${NC}"
echo -e "${GREEN}>>> npm バージョン: $(npm -v)${NC}"

# ------------------------------------------------------------------------------
# 4. PM2 のインストールと自動起動設定
# ------------------------------------------------------------------------------
echo -e "\n${YELLOW}[4/7] プロセス管理ツール (PM2) をセットアップ中...${NC}"
npm install -g pm2
pm2 startup systemd -u root --hp /root 2>/dev/null || true

# ------------------------------------------------------------------------------
# 5. Nginx リバースプロキシ設定 (app.mat-ope.com -> localhost:3000)
# ------------------------------------------------------------------------------
echo -e "\n${YELLOW}[5/7] Nginx リバースプロキシを設定中...${NC}"
cat << 'EOF' > /etc/nginx/sites-available/app.mat-ope.com
server {
    listen 80;
    listen [::]:80;
    server_name app.mat-ope.com;

    client_max_body_size 50M;

    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
EOF

# default サイトを無効化し、app.mat-ope.com を有効化
rm -f /etc/nginx/sites-enabled/default
ln -sf /etc/nginx/sites-available/app.mat-ope.com /etc/nginx/sites-enabled/app.mat-ope.com
nginx -t && systemctl reload nginx

# ------------------------------------------------------------------------------
# 6. Let's Encrypt による無料 SSL (HTTPS) の自動取得＆適用
# ------------------------------------------------------------------------------
echo -e "\n${YELLOW}[6/7] SSL 証明書 (Let's Encrypt) を自動取得中...${NC}"
certbot --nginx -d app.mat-ope.com --non-interactive --agree-tos --register-unsafely-without-email --redirect || true

# ------------------------------------------------------------------------------
# 7. Elec-Console-V3 のクローンと初回デプロイ実行
# ------------------------------------------------------------------------------
echo -e "\n${YELLOW}[7/7] Elec-Console-V3 を GitHub から取得しデプロイを実行中...${NC}"
mkdir -p /root/elec-console
cd /root/elec-console

if [ -d "Elec-Console-V3" ]; then
  cd Elec-Console-V3
  git fetch origin main
  git reset --hard origin/main
else
  git clone https://github.com/asuka-matsuda/Elec-Console-V3.git
  cd Elec-Console-V3
fi

# 初回デプロイスクリプトを実行
bash deploy.sh --clean

echo -e "\n${GREEN}======================================================${NC}"
echo -e "${GREEN}   🎉 サーバー初期構築＆Elec-Console-V3 公開完了！   ${NC}"
echo -e "${GREEN}   公開URL: https://app.mat-ope.com                  ${NC}"
echo -e "${GREEN}======================================================${NC}"
