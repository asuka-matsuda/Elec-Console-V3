# AGENTS.md

## 凍結ファイル（読み取り専用・編集禁止）

以下のコンポーネントは設計・実装・テストが確定しており、OSレベルで「読み取り専用属性（IsReadOnly）」に設定されています。
勝手に編集・修正・リファクタリングを提案・実行することを固く禁止します。

### 対象ファイル一覧（Atoms配下 全12ファイル）
- `app/components/common/atoms/Badge.vue`
- `app/components/common/atoms/Button.vue`
- `app/components/common/atoms/Checkbox.vue`
- `app/components/common/atoms/Divider.vue`
- `app/components/common/atoms/Heading.vue`
- `app/components/common/atoms/Icon.vue`
- `app/components/common/atoms/Input.vue`
- `app/components/common/atoms/Logo.vue`
- `app/components/common/atoms/Panel.vue`
- `app/components/common/atoms/RadioGroup.vue`
- `app/components/common/atoms/Select.vue`
- `app/components/common/atoms/Textarea.vue`

### エラー発生時の対応指示（必須）
もしこれらのファイルに対して編集を試みてアクセス拒否（EACCES / Permission Denied）エラーが発生した場合、またはこれらのコンポーネントに変更が必要と思われる状況が発生した場合は、**AIが勝手に読み取り専用属性を解除したり変更を試みたりせず、必ずユーザーに理由を説明して指示を仰いでください。**
