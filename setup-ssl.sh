#!/usr/bin/env bash
set -e

# ==============================================================================
# SSL (HTTPS) 自動設定スクリプト (Let's Encrypt / Certbot)
# ==============================================================================

GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

echo -e "\n${YELLOW}>>> SSL 証明書 (HTTPS: ポート443) を設定中...${NC}"

# ファイアウォールの解放 (80, 443)
if command -v ufw &> /dev/null; then
  ufw allow 80/tcp 2>/dev/null || true
  ufw allow 443/tcp 2>/dev/null || true
  ufw reload 2>/dev/null || true
fi

# Certbot による証明書取得と Nginx 自動設定
certbot --nginx -d app.mat-ope.com --non-interactive --agree-tos --register-unsafely-without-email --redirect || certbot --nginx -d app.mat-ope.com --non-interactive --agree-tos -m admin@mat-ope.com --redirect

# Nginx 設定テストと反映
nginx -t && systemctl reload nginx

echo -e "\n${GREEN}======================================================${NC}"
echo -e "${GREEN}   🎉 HTTPS (SSL) の設定が完了しました！             ${NC}"
echo -e "${GREEN}   ブラウザで https://app.mat-ope.com を開いてください！${NC}"
echo -e "${GREEN}======================================================${NC}"
