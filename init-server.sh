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
# 1. スワップメモリ (4GB) の作成 (1GB VPS のメモリ不足 OOM 防止)
# ------------------------------------------------------------------------------
echo -e "\n${YELLOW}[1/7] スワップメモリ (4GB) を確認・作成中...${NC}"
SWAP_TOTAL=$(free -m 2>/dev/null | awk '/^Swap:/ {print $2}')
if [ -z "$SWAP_TOTAL" ] || [ "$SWAP_TOTAL" -lt 3500 ]; then
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
# 5. Nginx リバースプロキシ＆セキュリティ防壁設定 (app.mat-ope.com -> localhost:3000)
# ------------------------------------------------------------------------------
echo -e "\n${YELLOW}[5/7] Nginx リバースプロキシ＆セキュリティ設定を構築中...${NC}"

# ポート 80 競合の解消 (Apache2 が動いている場合は停止・無効化)
systemctl stop apache2 2>/dev/null || true
systemctl disable apache2 2>/dev/null || true
if command -v fuser &> /dev/null; then
  fuser -k 80/tcp 2>/dev/null || true
fi
pkill -f nginx 2>/dev/null || true
sleep 1

# 5.1 Nginx セキュリティ基本設定（レート制限・バージョン隠蔽）
cat << 'EOF' > /etc/nginx/conf.d/security.conf
server_tokens off;
limit_req_zone $binary_remote_addr zone=req_limit_general:10m rate=30r/s;
limit_req_zone $binary_remote_addr zone=req_limit_login:10m rate=5r/m;
EOF

# 5.2 Nginx サイト設定 (IP直打ち・Bot・脆弱性プローブの完全遮断 + SSL準備)
cat << 'EOF' > /etc/nginx/sites-available/app.mat-ope.com
# HTTP (ポート 80) 未承認ホスト・IP直打ち遮断 (444: 応答なし切断)
server {
    listen 80 default_server;
    listen [::]:80 default_server;
    server_name _;
    return 444;
}

# HTTPS (ポート 443) 未承認ホスト・IP直打ち遮断 (TLSハンドシェイク拒否)
server {
    listen 443 ssl default_server;
    listen [::]:443 ssl default_server;
    server_name _;
    ssl_ciphers aNULL;
    ssl_reject_handshake on;
    return 444;
}

# 正規ホスト (app.mat-ope.com)
server {
    listen 80;
    server_name app.mat-ope.com;

    client_max_body_size 50M;

    # 悪質Bot・クローラー・スクレイパーの即時遮断
    if ($http_user_agent ~* (ahrefs|semrush|petalbot|bytespider|mj12bot|dotbot|megaindex|sqlmap|nikto|masscan|nmap|zgrab|python-requests)) {
        return 444;
    }

    # ドットファイル (.env, .git等) の直接アクセスを即時切断
    location ~ /\.(?!well-known) {
        deny all;
        return 444;
    }

    # DBファイル、バックアップ、スクリプトの直接ダウンロード完全遮断
    location ~* \.(sqlite|db|sql|bak|backup|tar|gz|zip|sh|log|conf)$ {
        deny all;
        return 444;
    }

    # 既知のCMS・脆弱性探索パスを即時切断
    location ~* (wp-|phpmyadmin|actuator|setup\.php|install\.php) {
        return 444;
    }

    # ログインAPIのレートリミット保護 (ブルートフォース防止)
    location /api/auth/login {
        limit_req zone=req_limit_login burst=5 nodelay;

        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    # 一般リクエスト (Nuxt 4 アプリケーション)
    location / {
        limit_req zone=req_limit_general burst=50 nodelay;

        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;

        # セキュリティヘッダー
        add_header X-Robots-Tag "noindex, nofollow, noarchive, nosnippet" always;
        add_header X-Content-Type-Options "nosniff" always;
        add_header X-Frame-Options "SAMEORIGIN" always;
        add_header Referrer-Policy "strict-origin-when-cross-origin" always;
    }
}
EOF

# default サイトを無効化し、app.mat-ope.com を有効化
rm -f /etc/nginx/sites-enabled/default
rm -f /etc/nginx/sites-available/default
ln -sf /etc/nginx/sites-available/app.mat-ope.com /etc/nginx/sites-enabled/app.mat-ope.com
nginx -t
systemctl restart nginx || systemctl start nginx

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
