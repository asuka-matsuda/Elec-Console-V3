# Elec-Console-v2

> 電気設備工事・受変電設備・送電前試験のための高信頼Webコンソール & 現場DXプラットフォーム

Elec-Console-v2 は、電気工事・受変電設備現場における**総合試験（Phase 1: 回路確認・Phase 2: 絶縁抵抗測定・Phase 3: 送電電圧/検相試験）**の記録、進捗管理、および帳票出力をリアルタイムに統合管理するWebアプリケーションです。

作業手袋を装着したタブレット操作を前提としたHUD（Head-Up Display）ダークテーマデザイン、現場での多人数同時打鍵に耐えうる排他制御、設計変更と現場実績をシームレスに同期するExcel差分マージ機能を備えています。

---

## ⚡ 主要機能

### 1. 現場試験ワークフロー（Phase 1 〜 3）
- **Phase 1: 回路確認・増し締め試験**
  - 分電盤・キュービクル内の各回路の結線確認、トルク管理、端子増し締め完了のチェック。
  - 盤単位または回路単位でのステータス管理。
- **Phase 2: 絶縁抵抗測定（メガ測定）**
  - 回路の線種（単相・三相・動力）に応じた測定相の自動判定（R-S / S-T / T-R または R-N / T-N / R-T）。
  - 内線規程・電気設備技術基準に基づく自動合否判定（1.0MΩ / 0.2MΩ / 0.1MΩ等、基準値の柔軟な設定に対応）。
  - 「全相100MΩ一括確定」およびモバイル・タブレット特化の数値キーパッド（`inputmode="decimal"`、自動全選択、Enter確定）。
- **Phase 3: 送電・電圧測定・検相試験**
  - 受電後の各相間電圧値の記録と適正範囲判定。
  - 三相交流の相順判定（正相・逆相）および単相の点灯確認記録。
- **幹線連動インターロック機構**
  - 上流幹線（フィーダー）の試験完了前に二次側盤を不用意に加圧・試験できないよう、安全インターロック制御を内蔵。

### 2. Web標準 Excel連携（インポート / エクスポート）
- **ブラウザ直接アップロード & ダウンロード**
  - クライアント端末から `.xlsx` 帳票を直接ドラッグ＆ドロップでインポート可能。
  - 試験結果（各フェーズの測定値・判定・測定日時・測定者）が反映された最新Excelファイルをワンクリックでダウンロード（`Content-Disposition: attachment`）。
- **非破壊差分マージ（Mergeモード）**
  - 工期中の設計変更（回路追加・名称変更など）によるExcel再取り込み時、**現場で既に打ち込んだ測定結果（Phase 1〜3）を保護**しながら差分のみを取り込む高精度マージ機能を搭載。

### 3. 現場同時打鍵対応（高可用性 & 排他制御）
- **楽観的排他制御（Optimistic Concurrency Control）**
  - 複数作業員が同じ盤・回路を同時編集した際の上書き消失を防止。更新タイムスタンプ（`updatedAt`）の競合を検知し、`409 Conflict` とともに最新データを即座に画面へ自動反映。
- **SQLite WALモード（Write-Ahead Logging）**
  - サーバー起動時に `PRAGMA journal_mode=WAL;` および `busy_timeout=5000;` を自動適用。複数端末からの同時APIコール時にも `SQLITE_BUSY` によるデータベースロックを回避。

### 4. 電気計算・設計支援ツール群
- **許容電流・電線サイズ選定**
- **内線規程準拠の電圧降下計算**
- **電線管（配管）サイズ・占有率計算**
- **ケーブルラック幅・多条敷設占有率計算**
- **電線重量・布設荷重計算**

---

## 🛠 技術スタック

| レイヤー | 技術 / ライブラリ | 用途 / 特徴 |
| :--- | :--- | :--- |
| **Frontend** | [Nuxt 3](https://nuxt.com/) / [Vue 3](https://vuejs.org/) | Composition API, `<script setup>`, SSR/SSG ハイブリッド |
| **Styling** | Vanilla CSS (HUD Theme) | TailwindCSS非依存、独自CSSカスタムプロパティによる高視認性ダークテーマ |
| **Backend** | Nuxt Server Engine ([Nitro](https://nitro.unjs.io/)) | 軽量高速なRESTful APIエンドポイント |
| **Database** | [SQLite](https://www.sqlite.org/) + [Prisma ORM](https://www.prisma.io/) | マイグレーション自動化、型安全なクエリ生成、WALモード |
| **Office/Excel** | [ExcelJS](https://github.com/exceljs/exceljs) | ストリーミング対応の高精度Excel解析・生成 |
| **Code Quality** | ESLint (`@nuxt/eslint`, `@stylistic`), Stylelint | 厳格なスタイル・型安全コードベース維持 |
| **Testing** | [Vitest](https://vitest.dev/) + happy-dom | 高速な単体・結合テスト（全130件以上の自動テスト） |

---

## 📁 ディレクトリ構成

```text
elec-console-v2/
├── app/
│   ├── components/       # UIコンポーネント（App* 共通部品、Portal/ 業務画面部品）
│   ├── composables/      # 状態管理・API連携・キーボード操作 Composable
│   ├── pages/            # ルーティング画面（/portal/[siteId]/phase1~3, /tools など）
│   └── utils/            # 純粋な計算・業務ロジック（rack, conduit, voltage, portal など）
├── server/
│   ├── api/              # Nitro APIルート（回路登録・更新・インポート・エクスポート）
│   ├── plugins/          # サーバープラグイン（SQLite WAL設定など）
│   └── utils/            # サーバー共通処理（Excelパーサー/生成、楽観的排他制御など）
├── prisma/
│   ├── schema.prisma     # データベーススキーマ定義
│   └── dev.db            # SQLiteデータベースファイル
├── tests/                # Vitest テストスイート（計算ロジック、Composable、排他制御など）
├── scripts/              # 開発・メンテナンス用ユーティリティスクリプト
└── error.vue             # HUDデザインシステム準拠のエラーバウンダリ
```

---

## 🚀 開発環境のセットアップ

### 前提条件
- **Node.js**: v18.x 以上 (v20.x 推奨)
- **npm**: v9.x 以上

### 1. リポジトリのクローンと依存関係のインストール
```bash
git clone <repository-url>
cd elec-console-v2
npm install
```

### 2. データベースの初期化
```bash
# PrismaスキーマをSQLiteデータベースに同期
npx prisma db push
```

### 3. 開発サーバーの起動
```bash
npm run dev
```
ブラウザで `http://localhost:3000` を開きます。

---

## 🧪 テスト & コード品質検証

本プロジェクトでは、コード品質と業務ロジックの正確性を担保するため、以下のコマンド群が整備されています。

```bash
# 単体・結合テストの実行（Vitest）
npm run test

# ESLint による静的解析・型安全性検証
npm run lint

# Stylelint によるCSSスタイル検証
npm run lint:style

# TypeScript（vue-tsc）による厳密な型チェック
npm run typecheck
```

---

## 📱 推奨動作環境

- **現場端末（タブレット / スマートフォン）**:
  - iPadOS Safari (最新版)
  - Android Chrome (最新版)
  - 横画面表示（ランドスケープモード）での一覧閲覧を推奨
- **管理端末（PC）**:
  - Google Chrome / Microsoft Edge
  - フルHD（1920x1080）以上の解像度を推奨

---

## 📄 ライセンス
Proprietary / 社内・プロジェクト専用ライセンス
