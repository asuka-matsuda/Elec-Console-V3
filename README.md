# Elec-Console-V3

> 電気設備工事・受変電設備・送電前試験のための高信頼Webコンソール & 現場DXプラットフォーム

[![Nuxt 4](https://img.shields.io/badge/Nuxt-4.5.1-00DC82?logo=nuxt.js)](https://nuxt.com/)
[![Vue 3](https://img.shields.io/badge/Vue-3.5-4FC08D?logo=vue.js)](https://vuejs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.9-3178C6?logo=typescript)](https://www.typescriptlang.org/)
[![Prisma](https://img.shields.io/badge/Prisma-5.22-2D3748?logo=prisma)](https://www.prisma.io/)

**Elec-Console-V3** は、電気工事・受変電設備現場における**総合試験（Phase 1: 回路確認・Phase 2: 絶縁抵抗測定・Phase 3: 送電電圧/検相試験）**の記録、進捗管理、および帳票出力をリアルタイムに統合管理する最新Webアプリケーションです。

---

## ⚡ 主要機能

### 1. ポータル & スケジュール管理
- **複数現場対応**: 作業員・管理者ごとにアサインされた現場のシームレスな切り替えと進捗の一元管理。
- **フル機能カレンダー**: FullCalendarを統合した直感的なスケジュール画面。イベントバッジの多層アンビエントグロー表示、日/週/月ビュー対応。
- **お知らせ & 更新履歴**: 管理者からのお知らせ通知とバージョン履歴のタイムライン表示。

### 2. 現場試験ワークフロー（Phase 1 〜 3）
- **Phase 1: 回路確認・増し締め試験**
  - 分電盤・キュービクル内の各回路の結線確認、トルク管理、端子増し締め完了のチェック。
- **Phase 2: 絶縁抵抗測定（メガ測定）**
  - 線種（単相・三相・動力）に応じた測定相の自動判定。内線規程に基づく自動合否判定。
- **Phase 3: 送電・電圧測定・検相試験**
  - 各相間電圧値の記録と適正範囲判定。三相交流の相順判定（正相・逆相）および点灯確認。

### 3. 電気計算・設計支援ツール群
- **許容電流・電線サイズ選定**
- **内線規程準拠の電圧降下計算**
- **電線管（配管）サイズ・占有率計算**
- **ケーブルラック幅・多条敷設占有率計算**
- **電線重量・布設荷重計算**

### 4. 管理者・セキュリティ機能
- **現場管理・作業員アサイン**: 現場の新規作成、ステータス変更、アクセス権限付与。
- **アカウント・認証保護**: PBKDF2-HMAC-SHA512 による強固なパスワード暗号化、レートリミット制御、セッション管理。
- **SQLite WALモード**: 高速な読み書きと並行トランザクションを両立。

---

## 🛠 技術スタック

| 分類 | 技術 | 特徴 / 用途 |
| :--- | :--- | :--- |
| **Framework** | [Nuxt 4.5](https://nuxt.com/) / [Vue 3.5](https://vuejs.org/) | Composition API, SSR / SPA ハイブリッド |
| **Styling** | Tailwind CSS + SCSS | 独自デザインシステム、HUDダークテーマ、レスポンシブ設計 |
| **Server Engine** | [Nitro 2.13](https://nitro.unjs.io/) | 軽量・高速な Node サーバーエンジン |
| **Database** | SQLite + [Prisma ORM 5.22](https://www.prisma.io/) | 型安全なスキーマ管理、WALモード、自動シード同期 |
| **Icons & UI** | [Lucide Vue](https://lucide.dev/), [FullCalendar](https://fullcalendar.io/) | 高品質アイコン群、カレンダーコンポーネント |
| **Process Manager**| [PM2](https://pm2.keymetrics.io/) | 本番プロセスの自動再起動・クラスタ管理 |
| **Web Server** | Nginx + Certbot | リバースプロキシ、Let's Encrypt 無料SSL (HTTPS) 自動更新 |

---

## 🚀 開発 & 運用

### ローカル開発環境の起動
```bash
# パッケージのインストール
npm install

# 開発サーバーの起動 (http://localhost:3000)
npm run dev
```

### 本番サーバーへの自動アップデート
本番環境（VPS）へのデプロイは専用スクリプトで自動化されています：
```bash
# サーバー上で実行 (git pullからビルド・ゼロダウンタイム再起動まで全自動)
bash update.sh
```

手元のPCからリモート実行する場合：
```bash
ssh elec-vps "cd ~/Elec-Console-V3 && bash update.sh"
```
