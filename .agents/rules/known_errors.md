---
description: 既知のシステムエラー、インフラ・DB・UI設計上の落とし穴と恒久対策ガイドライン
globs: ["**/*"]
---

# 既知のシステムエラーと開発上の落とし穴・恒久対策集 (Known Errors & Best Practices)

本ドキュメントは、Elec-Console-V3 プロジェクトで実際に発生し解決された重大なエラー、落とし穴、およびその恒久対策を記録したナレッジベースです。
開発およびAIエージェントによる作業時は、本ルールを常に遵守し、同じ問題の再発を防止してください。

---

## 1. Prisma SQLite の相対パス解決による DB 乖離問題 (P2021)

### 現象
- `PrismaClientKnownRequestError: The table main.XXXX does not exist in the current database. (code: P2021)`
- `npx prisma db push` を実行したにもかかわらず、本番アプリ実行時にテーブルが存在しないエラーが発生する。

### 原因
- `.env` で `DATABASE_URL="file:./prisma/dev.db"` と指定した場合の相対パス解決のズレ：
  - **Prisma CLI（db push / migrate）**: `prisma/schema.prisma` の配置ディレクトリを基準にするため、`prisma/prisma/dev.db` を生成・同期してしまう。
  - **Nuxt / Nitro 実行時**: プロセスのカレントディレクトリ（プロジェクトルート）を基準にするため、`prisma/dev.db` を参照する。
  - その結果、CLI が更新した DB と、アプリが参照する DB が別物（乖離）になっていた。

### 恒久対策
- 本番サーバー（VPS）の `.env` では、常に**絶対パス**を指定すること：
  ```env
  DATABASE_URL="file:/root/Elec-Console-V3/prisma/dev.db"
  ```
- ローカル環境では、Prisma 標準の `DATABASE_URL="file:./dev.db"`（`prisma/` からの相対パス）を厳守する。

---

## 2. Nuxt / Nitro 本番ビルド成果物内の Prisma クライアント未更新問題

### 現象
- `PrismaClientValidationError: Unknown field 'xxxx' for include statement on model 'yyyy'.`
- スキーマに新フィールドやリレーションを追加した後、ルートで `npx prisma generate` しても、実行時に未定義エラーになる。

### 原因
- Nuxt（Nitro）は、`npm run build` 実行時に `@prisma/client` を本番バンドルディレクトリ（`.output/server/node_modules/@prisma/client`）内に独立してコピー・バンドルする。
- ルートの `node_modules/@prisma/client` を更新しても、`.output/server` を再ビルドしなければ本番サーバーは古い Prisma クライアントを実行し続ける。

### 恒久対策
- スキーマ変更・デプロイ時は、以下の**実行順序を絶対厳守**すること：
  1. `git pull origin main`
  2. `npx prisma db push`
  3. `npx prisma generate`（ルートのクライアントを最新化）
  4. `npm run build`（最新クライアントを含めて本番バンドルをクリーン再生成）
  5. `pm2 restart elec-console`
- `update.sh` はこの順序を担保するように構成済み。

---

## 3. SQLite 外部キー制約エラー (P2003) とカスケード削除

### 現象
- `PrismaClientKnownRequestError: Foreign key constraint failed on the field (code: P2003)`
- 現場（Site）などの親エンティティ削除時に 500 エラーが発生する。

### 原因
- SQLite では外部キー制約が有効（`PRAGMA foreign_keys = ON`）な場合、Prisma の `onDelete: Cascade` 定義だけでは、リレーションの依存順序や多対多テーブル（`_UserSites` や `UserOnSite`）の都合で制約違反がトリガーされる場合がある。

### 恒久対策
- 親エンティティを削除する API では、単独の `prisma.site.delete()` に依存せず、**明示的なトランザクション（`$transaction`）内で依存子テーブルを末端から順次削除**すること：
  ```ts
  await prisma.$transaction([
    prisma.circuit.deleteMany({ where: { siteId } }),
    prisma.event.deleteMany({ where: { siteId } }),
    prisma.userOnSite.deleteMany({ where: { siteId } }),
    prisma.siteSettings.deleteMany({ where: { siteId } }),
    prisma.calendarSettings.deleteMany({ where: { siteId } }),
    prisma.operationLog.deleteMany({ where: { siteId } }),
    prisma.site.delete({ where: { id: siteId } }),
  ])
  ```

---

## 4. テーブル操作列の幅計算とスロット列のはみ出し問題

### 現象
- テーブル幅自動計算（`useTableAutoWidth` / `tableAutoWidth.ts`）において、操作ボタン列（`actions`）のボタンが枠外にはみ出る。

### 原因
- スロット列（文字のないボタン列など）に対して一律デフォルト幅（120px 等）が割り当てられていたため、ボタンテキストやボタン数が増加した際に縮小圧迫されていた。
- px 値をハードコードすると、ボタンテキストの変更やボタン追加のたびに修正を強いられる。

### 恒久対策
- **CSS 標準の「auto-fit」パターン（`width: 1%` + `white-space: nowrap`）を適用すること**：
  ```html
  <!-- TableColGroup -->
  <col v-if="col.key === 'actions'" class="col-actions" style="width: 1%" />
  ```
  ```scss
  td.col-actions {
    width: 1%;
    white-space: nowrap;
  }
  ```
- テーブルは `width: 1%` の列を必要最小限（中身のテキスト・ボタンの実幅）まで自動縮小し、かつ `white-space: nowrap` で折り返し・はみ出しを防ぐ。余剰幅は他の可変列（回路名称など）が均等に吸収する。

---

## 5. 絶縁抵抗試験の法規基準値動的判定（電気設備技術基準）

### 現象
- 全相OK/NGの判定において、一律 1.0MΩ などの固定閾値を使用すると、法令および現場実態と乖離する。

### 法規基準（内線規程 第1350-1節 / 電気設備技術基準 第58条）
- 配電方式および使用電圧に応じて以下の基準値が定められている：
  - **400V系**（3φ3W 400V, 3φ4W 415V/440V 等）: **0.4 MΩ 以上**
  - **200V系**（3φ3W 200V, 1φ2W 200V 等）: **0.2 MΩ 以上**
  - **100V系 および 単相3線式 100/200V**（1φ3W 100/200V, 1φ2W 100V 等）: 対地電圧が 150V 以下のため **0.1 MΩ 以上**

### 恒久対策
- `getPhase2Threshold(haidenHoushiki?: string | null): number` ユーティリティを使用し、回路情報の `haidenHoushiki` 文字列から動的に判定する：
  - 文字列に `400V`, `415V`, `440V` を含む場合 → `0.4`
  - 文字列に `200V` を含む場合（かつ単三100/200V以外） → `0.2`
  - 文字列に `100V` を含む場合（単三100/200V含む） → `0.1`
  - 未指定時のフォールバック → `0.1`
- 画面上の入力バリデーション（`CellPhaseMeas`）および保存時判定（`TablePhase2`）の双方が同一ロジックを参照する。
