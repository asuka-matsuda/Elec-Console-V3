# Tool Usage Conventions

1. **PowerShellによるファイル操作の禁止 (Prohibit File Modification via PowerShell)**:
   - PowerShellのコマンド (`Get-Content`, `Set-Content`, `Out-File`, `$content -replace` など) を用いて、テキストファイルの読み込み・置換・書き込みを行うことを**厳格に禁止**する。
   - **理由**: Windows環境のPowerShellではデフォルトエンコーディングの問題（Shift-JISなど）により、ソースコード内の日本語（マルチバイト文字）が文字化け（Mojibake）や破損を引き起こす危険性が非常に高いため。
   - **代替手段**: ファイルの内容を置換・変更する場合は、必ず以下のいずれかの手段を用いること：
     1. Antigravityの標準ファイル編集ツール (`multi_replace_file_content`, `replace_file_content`, `write_to_file`) を使用する。
     2. 複数ファイルへの高度な一括処理が必要な場合は、Node.js スクリプト (`fs.readFileSync`, `fs.writeFileSync` にて `utf-8` を明示) を作成して実行する。
